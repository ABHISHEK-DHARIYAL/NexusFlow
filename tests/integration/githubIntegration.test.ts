import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RepositoryService } from '../../backend/services/RepositoryService';
import { RepositoryRepository } from '../../backend/repositories/RepositoryRepository';
import { GithubAccountRepository } from '../../backend/repositories/GithubAccountRepository';
import { TaskRepository } from '../../backend/repositories/TaskRepository';
import { TaskSyncService } from '../../backend/services/TaskSyncService';
import { RepositoryFileFilter } from '../../backend/integrations/github/RepositoryFileFilter';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../../backend/utils/errors';
import { TaskStatus, SyncStatus } from '@prisma/client';

describe('Part 6 - GitHub Repository Integration', () => {
  let mockRepoRepo: any;
  let mockGithubAccountRepo: any;
  let mockTaskRepo: any;
  let mockSyncService: any;
  let repoService: RepositoryService;

  const mockUser1 = 'user-123';
  const mockUser2 = 'user-456';

  const sampleGhRepo = {
    id: 1296269,
    node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2MjY5',
    name: 'Hello-World',
    full_name: 'octocat/Hello-World',
    private: false,
    owner: {
      login: 'octocat',
      id: 583231,
      avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      html_url: 'https://github.com/octocat',
      type: 'User',
    },
    html_url: 'https://github.com/octocat/Hello-World',
    description: 'This your first repo!',
    fork: false,
    created_at: '2011-01-26T19:01:12Z',
    updated_at: '2011-01-26T19:14:43Z',
    pushed_at: '2011-01-26T19:06:43Z',
    git_url: 'git://github.com/octocat/Hello-World.git',
    ssh_url: 'git@github.com:octocat/Hello-World.git',
    clone_url: 'https://github.com/octocat/Hello-World.git',
    stargazers_count: 80,
    watchers_count: 80,
    language: 'JavaScript',
    forks_count: 9,
    open_issues_count: 0,
    default_branch: 'main',
    size: 108,
    visibility: 'public',
  };

  beforeEach(() => {
    mockRepoRepo = {
      findById: vi.fn(),
      findByFullName: vi.fn(),
      findByUserIdAndFullName: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findBranches: vi.fn(),
      findCommits: vi.fn(),
      findContributors: vi.fn(),
      findIssues: vi.fn(),
      findPullRequests: vi.fn(),
      findLanguages: vi.fn(),
      saveSyncData: vi.fn().mockResolvedValue(undefined),
      createSyncRecord: vi.fn(),
      updateSyncRecord: vi.fn(),
      findSyncById: vi.fn(),
      findActiveSyncByRepositoryId: vi.fn(),
      findFilesByRepositoryId: vi.fn(),
      syncRepositoryFiles: vi.fn().mockResolvedValue({ createdCount: 5, updatedCount: 0, deletedCount: 0 }),
    };

    mockGithubAccountRepo = {
      findByUserId: vi.fn().mockResolvedValue({
        userId: mockUser1,
        accessToken: 'gho_mock_token_123',
      }),
    };

    mockTaskRepo = {
      create: vi.fn(),
      updateStatus: vi.fn(),
    };

    mockSyncService = {
      dispatchToWorker: vi.fn().mockResolvedValue(undefined),
    };

    repoService = new RepositoryService(
      mockRepoRepo as any,
      mockGithubAccountRepo as any,
      mockTaskRepo as any,
      mockSyncService as any
    );
  });

  describe('Repository Connection & URL Normalization', () => {
    it('1. Connects a valid repository via owner/name', async () => {
      mockRepoRepo.findByUserIdAndFullName.mockResolvedValue(null);
      mockRepoRepo.create.mockResolvedValue({
        id: 'repo-1',
        userId: mockUser1,
        name: 'Hello-World',
        owner: 'octocat',
        fullName: 'octocat/Hello-World',
        syncStatus: 'NOT_IMPORTED',
      });

      vi.spyOn(repoService as any, 'getGithubApiClient').mockResolvedValue({
        get: vi.fn().mockResolvedValue({ data: sampleGhRepo }),
      });

      const repo = await repoService.connectRepository(mockUser1, { owner: 'octocat', name: 'Hello-World' });

      expect(repo.fullName).toBe('octocat/Hello-World');
      expect(mockRepoRepo.create).toHaveBeenCalled();
    });

    it('2. Connects a repository via full GitHub URL normalization', async () => {
      mockRepoRepo.findByUserIdAndFullName.mockResolvedValue(null);
      mockRepoRepo.create.mockResolvedValue({
        id: 'repo-2',
        userId: mockUser1,
        fullName: 'octocat/Hello-World',
      });

      vi.spyOn(repoService as any, 'getGithubApiClient').mockResolvedValue({
        get: vi.fn().mockResolvedValue({ data: sampleGhRepo }),
      });

      const repo = await repoService.connectRepository(mockUser1, {
        url: 'https://github.com/octocat/Hello-World.git',
      });

      expect(mockRepoRepo.create).toHaveBeenCalled();
    });

    it('3. Rejects invalid repository payload format', async () => {
      await expect(repoService.connectRepository(mockUser1, { owner: '' })).rejects.toThrow(BadRequestError);
    });

    it('4. Rejects connection if user lacks GitHub OAuth connection', async () => {
      mockGithubAccountRepo.findByUserId.mockResolvedValue(null);
      await expect(
        repoService.connectRepository(mockUser1, { owner: 'octocat', name: 'Hello-World' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('5. Prevents duplicate repository connection for the same user', async () => {
      mockRepoRepo.findByUserIdAndFullName.mockResolvedValue({
        id: 'repo-1',
        fullName: 'octocat/Hello-World',
      });

      await expect(
        repoService.connectRepository(mockUser1, { owner: 'octocat', name: 'Hello-World' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('Authorization & Security (IDOR Protection)', () => {
    it('6. Blocks user from accessing another user repository', async () => {
      mockRepoRepo.findById.mockResolvedValue({
        id: 'repo-private',
        userId: mockUser2, // Belongs to user-456
      });

      await expect(repoService.getRepositoryById('repo-private', mockUser1)).rejects.toThrow();
    });

    it('7. Returns user repositories scoped exclusively to user', async () => {
      mockRepoRepo.findAll.mockResolvedValue({
        repositories: [{ id: 'repo-1', userId: mockUser1 }],
        total: 1,
      });

      const res = await repoService.getAllRepositories(mockUser1);
      expect(mockRepoRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ userId: mockUser1 }));
      expect(res.repositories.length).toBe(1);
    });
  });

  describe('Repository Synchronization & Idempotency', () => {
    it('8. Triggers REPOSITORY_SYNC task and dispatches to Java worker', async () => {
      const mockRepoRecord = {
        id: 'repo-1',
        userId: mockUser1,
        owner: 'octocat',
        name: 'Hello-World',
        fullName: 'octocat/Hello-World',
      };

      mockRepoRepo.findById.mockResolvedValue(mockRepoRecord);
      mockRepoRepo.findActiveSyncByRepositoryId.mockResolvedValue(null);
      mockRepoRepo.createSyncRecord.mockResolvedValue({
        id: 'sync-123',
        repositoryId: 'repo-1',
        status: 'SYNCING',
      });
      mockTaskRepo.create.mockResolvedValue({
        id: 'task-123',
        taskType: 'REPOSITORY_SYNC',
        status: TaskStatus.QUEUED,
      });

      // Mock executeSync to avoid async side effect errors in test
      vi.spyOn(repoService, 'executeSync').mockImplementation(async () => mockRepoRecord as any);

      const result = await repoService.triggerRepositorySync(mockUser1, 'repo-1');

      expect(result.syncId).toBe('sync-123');
      expect(result.taskId).toBe('task-123');
      expect(mockSyncService.dispatchToWorker).toHaveBeenCalled();
    });

    it('9. Prevents concurrent duplicate sync jobs (Idempotency check)', async () => {
      mockRepoRepo.findById.mockResolvedValue({
        id: 'repo-1',
        userId: mockUser1,
        fullName: 'octocat/Hello-World',
      });
      mockRepoRepo.findActiveSyncByRepositoryId.mockResolvedValue({
        id: 'sync-active',
        status: 'SYNCING',
      });

      await expect(repoService.triggerRepositorySync(mockUser1, 'repo-1')).rejects.toThrow(ConflictError);
    });
  });

  describe('File Filtering Utility', () => {
    it('10. Excludes node_modules, build outputs, and binary files', () => {
      const filter = new RepositoryFileFilter();

      expect(filter.shouldIncludeFile('src/index.ts', 1000)).toBe(true);
      expect(filter.shouldIncludeFile('node_modules/express/index.js', 1000)).toBe(false);
      expect(filter.shouldIncludeFile('dist/bundle.js', 1000)).toBe(false);
      expect(filter.shouldIncludeFile('target/app.jar', 1000)).toBe(false);
      expect(filter.shouldIncludeFile('.git/config', 100)).toBe(false);
      expect(filter.shouldIncludeFile('assets/logo.png', 500)).toBe(false);
      expect(filter.shouldIncludeFile('bin/app.exe', 500)).toBe(false);
    });

    it('11. Filters out files exceeding size threshold (>5MB default)', () => {
      const filter = new RepositoryFileFilter({ maxSizeBytes: 5 * 1024 * 1024 });

      expect(filter.shouldIncludeFile('src/bigfile.js', 6 * 1024 * 1024)).toBe(false);
      expect(filter.shouldIncludeFile('src/smallfile.js', 1 * 1024 * 1024)).toBe(true);
    });

    it('12. Correctly detects source programming languages', () => {
      const filter = new RepositoryFileFilter();

      expect(filter.detectLanguage('src/App.tsx')).toBe('TypeScript');
      expect(filter.detectLanguage('Main.java')).toBe('Java');
      expect(filter.detectLanguage('script.py')).toBe('Python');
      expect(filter.detectLanguage('main.go')).toBe('Go');
    });
  });

  describe('Repository Deletion & Cascading Cleanups', () => {
    it('13. Deletes repository when authorized', async () => {
      mockRepoRepo.findById.mockResolvedValue({
        id: 'repo-1',
        userId: mockUser1,
      });
      mockRepoRepo.delete.mockResolvedValue({ id: 'repo-1' });

      const res = await repoService.deleteRepository(mockUser1, 'repo-1');
      expect(mockRepoRepo.delete).toHaveBeenCalledWith('repo-1');
    });
  });
});
