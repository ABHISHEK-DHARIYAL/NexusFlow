import { RepositoryRepository } from '../repositories/RepositoryRepository';
import { GithubAccountRepository } from '../repositories/GithubAccountRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskSyncService, taskSyncService } from './TaskSyncService';
import {
  GithubApiClient,
  GithubUserService,
  GithubRepositoryService,
  GithubMapper,
  ListUserRepositoriesParams,
  RepositoryFileFilter,
} from '../integrations/github';
import { NotFoundError, ConflictError, UnauthorizedError, BadRequestError } from '../utils/errors';
import { assertResourceOwnership } from '../utils/ownership';
import { logger } from '../logger';
import { TaskStatus, SyncStatus } from '@prisma/client';

export class RepositoryService {
  constructor(
    private repoRepository = new RepositoryRepository(),
    private githubAccountRepository = new GithubAccountRepository(),
    private taskRepository = new TaskRepository(),
    private syncService: TaskSyncService = taskSyncService
  ) {}

  private async getGithubApiClient(userId: string): Promise<GithubApiClient> {
    const githubAccount = await this.githubAccountRepository.findByUserId(userId);
    if (!githubAccount || !githubAccount.accessToken) {
      throw new UnauthorizedError(
        'GitHub account not connected or missing access token. Please authenticate with GitHub.'
      );
    }
    return new GithubApiClient(githubAccount.accessToken);
  }

  // Normalize inputs from owner/name, fullName or URL
  private normalizeRepositoryInput(payload: { owner?: string; name?: string; fullName?: string; url?: string }): {
    owner: string;
    name: string;
  } {
    let owner = payload.owner?.trim();
    let name = payload.name?.trim();

    if (payload.url && payload.url.trim()) {
      let rawUrl = payload.url.trim();
      rawUrl = rawUrl.replace(/^https?:\/\//i, '').replace(/^github\.com\//i, '').replace(/\.git$/i, '');
      const parts = rawUrl.split('/').filter(Boolean);
      if (parts.length >= 2) {
        owner = parts[0];
        name = parts[1];
      }
    } else if (payload.fullName && payload.fullName.trim()) {
      const parts = payload.fullName.trim().split('/');
      if (parts.length === 2) {
        owner = parts[0];
        name = parts[1];
      }
    }

    if (!owner || !name) {
      throw new BadRequestError('Invalid repository payload. Expected owner and name, fullName, or GitHub URL.');
    }

    // Basic security validation to prevent path traversal or malicious input
    const validNameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!validNameRegex.test(owner) || !validNameRegex.test(name)) {
      throw new BadRequestError('Repository owner and name contain invalid characters.');
    }

    return { owner, name };
  }

  // GitHub REST API proxy methods
  async listGithubRepositories(userId: string, params?: ListUserRepositoriesParams) {
    const client = await this.getGithubApiClient(userId);
    const userService = new GithubUserService(client);
    return userService.getUserRepositories(params);
  }

  async getGithubRepositoryDetails(userId: string, githubRepoId: number) {
    const client = await this.getGithubApiClient(userId);
    const repoService = new GithubRepositoryService(client);
    return repoService.getRepositoryById(githubRepoId);
  }

  // NexusFlow Imported Repositories
  async getRepositoryById(repositoryId: string, userId: string) {
    const repo = await this.repoRepository.findById(repositoryId);
    if (!repo) {
      throw new NotFoundError(`Repository with ID ${repositoryId} not found`);
    }
    assertResourceOwnership(repo.userId, { id: userId, role: 'USER' }, 'repository');
    return repo;
  }

  async getAllRepositories(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      language?: string;
      visibility?: string;
    }
  ) {
    return this.repoRepository.findAll({ ...params, userId });
  }

  // Connect GitHub Repository
  async connectRepository(
    userId: string,
    payload: { owner?: string; name?: string; fullName?: string; url?: string }
  ) {
    const { owner, name } = this.normalizeRepositoryInput(payload);
    const fullName = `${owner}/${name}`;

    // Check duplicate connection for this user
    const existing = await this.repoRepository.findByUserIdAndFullName(userId, fullName);
    if (existing) {
      throw new ConflictError(`Repository "${fullName}" is already connected to your account.`);
    }

    // Validate access & fetch details from GitHub REST API
    const client = await this.getGithubApiClient(userId);
    const githubRepoService = new GithubRepositoryService(client);
    const ghRepo = await githubRepoService.getRepository(owner, name);

    // Map GitHub repository payload to Prisma input
    const mappedRepo = GithubMapper.mapRepository(ghRepo, userId);
    mappedRepo.syncStatus = 'NOT_IMPORTED' as any;

    // Create repository record in DB
    const repository = await this.repoRepository.create(mappedRepo as any);
    return repository;
  }

  // Legacy import route alias
  async importRepository(userId: string, payload: { fullName?: string; owner?: string; name?: string; url?: string }) {
    const repository = await this.connectRepository(userId, payload);
    // Auto-trigger background synchronization
    this.triggerRepositorySync(userId, repository.id).catch((err) => {
      logger.repository.error(`Background repository sync failed for ${repository.id}: ${err.message}`);
    });
    return repository;
  }

  // Trigger REPOSITORY_SYNC task & execution
  async triggerRepositorySync(userId: string, repositoryId: string) {
    const repo = await this.getRepositoryById(repositoryId, userId);

    // Idempotency check: Prevent duplicate concurrent sync jobs
    const activeSync = await this.repoRepository.findActiveSyncByRepositoryId(repositoryId);
    if (activeSync) {
      throw new ConflictError(`Synchronization is already in progress for repository "${repo.fullName}".`);
    }

    // Create sync record in DB
    const syncRecord = await this.repoRepository.createSyncRecord(repositoryId);

    // Create REPOSITORY_SYNC task in DB
    const task = await this.taskRepository.create({
      repository: { connect: { id: repositoryId } },
      user: { connect: { id: userId } },
      taskType: 'REPOSITORY_SYNC' as any,
      priority: 'MEDIUM',
      status: TaskStatus.QUEUED,
    });

    // Link task ID to sync record
    await this.repoRepository.updateSyncRecord(syncRecord.id, { taskId: task.id } as any);

    // Dispatch task to Java worker Engine
    await this.syncService.dispatchToWorker(task);

    // Asynchronously perform repository sync
    this.executeSync(userId, repositoryId, syncRecord.id, task.id).catch((err) => {
      logger.repository.error(`Repository sync execution error for ${repositoryId}: ${err.message}`);
    });

    return {
      syncId: syncRecord.id,
      taskId: task.id,
      repositoryId,
      status: syncRecord.status,
    };
  }

  // Core execution logic for repository synchronization
  async executeSync(userId: string, repositoryId: string, syncId: string, taskId: string) {
    const repo = await this.repoRepository.findById(repositoryId);
    if (!repo) return;

    await this.repoRepository.update(repositoryId, { syncStatus: 'SYNCING' as any });
    await this.repoRepository.updateSyncRecord(syncId, { status: 'SYNCING' as any });
    await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 10);

    try {
      const client = await this.getGithubApiClient(userId);
      const githubRepoService = new GithubRepositoryService(client);

      // Fetch branches, commits, contributors, issues, PRs, languages
      const [ghRepo, branches, commits, contributors, issues, pullRequests, languages] = await Promise.all([
        githubRepoService.getRepository(repo.owner, repo.name),
        githubRepoService.getBranches(repo.owner, repo.name).catch(() => []),
        githubRepoService.getCommits(repo.owner, repo.name, { page: 1, per_page: 30 }).catch(() => []),
        githubRepoService.getContributors(repo.owner, repo.name).catch(() => []),
        githubRepoService.getIssues(repo.owner, repo.name, 'all', { page: 1, per_page: 30 }).catch(() => []),
        githubRepoService.getPullRequests(repo.owner, repo.name, 'all', { page: 1, per_page: 30 }).catch(() => []),
        githubRepoService.getLanguages(repo.owner, repo.name).catch(() => ({})),
      ]);

      const defaultBranch = ghRepo.default_branch || repo.defaultBranch || 'main';

      // Fetch tree structure
      let treeResponse;
      try {
        treeResponse = await githubRepoService.getTree(repo.owner, repo.name, defaultBranch, true);
      } catch (err: any) {
        logger.repository.warn(`Recursive tree fetch failed for ${repo.fullName}, falling back to non-recursive tree: ${err.message}`);
        treeResponse = await githubRepoService.getTree(repo.owner, repo.name, defaultBranch, false).catch(() => ({
          sha: '',
          url: '',
          tree: [],
          truncated: false,
        }));
      }

      // Apply file filter
      const fileFilter = new RepositoryFileFilter();
      const filteredFiles = (treeResponse.tree || [])
        .filter((item) => fileFilter.shouldIncludeFile(item.path, item.size))
        .map((item) => ({
          path: item.path,
          sha: item.sha,
          size: BigInt(item.size || 0),
          fileType: item.type === 'tree' ? 'dir' : 'file',
          language: fileFilter.detectLanguage(item.path),
        }));

      // Save branch/commit metadata
      const mappedMetadata = GithubMapper.mapMetadata(ghRepo);
      const mappedBranches = branches.map(GithubMapper.mapBranch);
      const mappedCommits = commits.map(GithubMapper.mapCommit);
      const mappedContributors = contributors.map(GithubMapper.mapContributor);
      const mappedIssues = issues.map(GithubMapper.mapIssue);
      const mappedPRs = pullRequests.map(GithubMapper.mapPullRequest);
      const mappedLanguages = GithubMapper.mapLanguages(languages);

      await this.repoRepository.saveSyncData(repositoryId, {
        metadata: mappedMetadata,
        statistics: {
          commitCount: mappedCommits.length,
          branchCount: mappedBranches.length,
          pullRequestCount: mappedPRs.length,
          contributorCount: mappedContributors.length,
          openIssuesCount: ghRepo.open_issues_count || 0,
        },
        branches: mappedBranches,
        commits: mappedCommits,
        contributors: mappedContributors,
        issues: mappedIssues,
        pullRequests: mappedPRs,
        languages: mappedLanguages,
      });

      // Synchronize files incrementally
      await this.repoRepository.syncRepositoryFiles(repositoryId, filteredFiles);

      // Terminal sync state
      const isPartial = treeResponse.truncated;
      const finalSyncStatus: SyncStatus = isPartial ? 'SYNCED' : 'SYNCED';

      await this.repoRepository.updateSyncRecord(syncId, {
        status: finalSyncStatus,
        completedAt: new Date(),
        fileCount: filteredFiles.length,
      });

      await this.repoRepository.update(repositoryId, {
        starsCount: ghRepo.stargazers_count,
        forksCount: ghRepo.forks_count,
        openIssues: ghRepo.open_issues_count,
        language: ghRepo.language || repo.language,
        description: ghRepo.description || repo.description,
        defaultBranch,
        syncStatus: 'SYNCED' as any,
        lastSyncedAt: new Date(),
      });

      await this.taskRepository.updateStatus(taskId, TaskStatus.COMPLETED, 100);

      return this.repoRepository.findById(repositoryId);
    } catch (err: any) {
      logger.repository.error(`Sync failed for repository ${repositoryId}: ${err.message}`);

      await this.repoRepository.updateSyncRecord(syncId, {
        status: 'FAILED',
        error: err.message,
        completedAt: new Date(),
      }).catch(() => {});

      await this.repoRepository.update(repositoryId, { syncStatus: 'FAILED' as any }).catch(() => {});
      await this.taskRepository.updateStatus(taskId, TaskStatus.FAILED, undefined, err.message).catch(() => {});

      throw err;
    }
  }

  // Alias syncRepositoryData for backward compatibility
  async syncRepositoryData(userId: string, repositoryId: string) {
    const syncRes = await this.triggerRepositorySync(userId, repositoryId);
    return this.repoRepository.findById(repositoryId);
  }

  // Sync status getter
  async getSyncStatus(userId: string, repositoryId: string, syncId: string) {
    await this.getRepositoryById(repositoryId, userId);
    const sync = await this.repoRepository.findSyncById(syncId);
    if (!sync) {
      throw new NotFoundError(`Sync record with ID ${syncId} not found`);
    }
    return sync;
  }

  // File metadata getter
  async getFiles(userId: string, repositoryId: string, params?: { page?: number; limit?: number }) {
    await this.getRepositoryById(repositoryId, userId);
    return this.repoRepository.findFilesByRepositoryId(repositoryId, params);
  }

  // Sub-resource getters
  async getBranches(userId: string, repositoryId: string) {
    await this.getRepositoryById(repositoryId, userId);
    return this.repoRepository.findBranches(repositoryId);
  }

  async getCommits(userId: string, repositoryId: string, params?: { page?: number; limit?: number }) {
    await this.getRepositoryById(repositoryId, userId);
    return this.repoRepository.findCommits(repositoryId, params);
  }

  async getContributors(userId: string, repositoryId: string) {
    await this.getRepositoryById(repositoryId, userId);
    return this.repoRepository.findContributors(repositoryId);
  }

  async getIssues(userId: string, repositoryId: string, state?: string) {
    await this.getRepositoryById(repositoryId, userId);
    return this.repoRepository.findIssues(repositoryId, state);
  }

  async getPullRequests(userId: string, repositoryId: string, state?: string) {
    await this.getRepositoryById(repositoryId, userId);
    return this.repoRepository.findPullRequests(repositoryId, state);
  }

  async getLanguages(userId: string, repositoryId: string) {
    await this.getRepositoryById(repositoryId, userId);
    return this.repoRepository.findLanguages(repositoryId);
  }

  async deleteRepository(userId: string, repositoryId: string) {
    await this.getRepositoryById(repositoryId, userId);
    return this.repoRepository.delete(repositoryId);
  }
}
