import {
  Repository,
  Prisma,
  RepositoryBranch,
  RepositoryCommit,
  RepositoryContributor,
  RepositoryIssue,
  RepositoryPullRequest,
  RepositoryLanguage,
  RepositorySync,
  RepositoryFile,
  SyncStatus,
} from '@prisma/client';
import { IRepositoryRepository } from '../interfaces/IRepositoryRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export interface RepositorySyncPayload {
  metadata?: {
    license?: string | null;
    isFork?: boolean;
    isArchived?: boolean;
    hasTopics?: string | null;
  };
  statistics?: {
    commitCount?: number;
    branchCount?: number;
    pullRequestCount?: number;
    contributorCount?: number;
    openIssuesCount?: number;
  };
  branches?: Array<{
    name: string;
    isProtected: boolean;
    commitSha?: string | null;
  }>;
  commits?: Array<{
    sha: string;
    message: string;
    authorName?: string | null;
    authorEmail?: string | null;
    authorAvatarUrl?: string | null;
    commitDate: Date;
    githubUrl?: string | null;
  }>;
  contributors?: Array<{
    username: string;
    avatarUrl?: string | null;
    contributions: number;
    profileUrl?: string | null;
  }>;
  issues?: Array<{
    issueNumber: number;
    title: string;
    state: string;
    authorUsername?: string | null;
    authorAvatarUrl?: string | null;
    labels?: string | null;
    githubUrl?: string | null;
    githubCreatedAt?: Date;
    githubUpdatedAt?: Date;
  }>;
  pullRequests?: Array<{
    prNumber: number;
    title: string;
    state: string;
    authorUsername?: string | null;
    authorAvatarUrl?: string | null;
    isMerged: boolean;
    githubUrl?: string | null;
    githubCreatedAt?: Date;
    githubUpdatedAt?: Date;
  }>;
  languages?: Array<{
    name: string;
    bytes: bigint;
    percentage: number;
  }>;
}

export class RepositoryRepository implements IRepositoryRepository {
  async findById(id: string): Promise<Repository | null> {
    try {
      return await prisma.repository.findUnique({
        where: { id },
        include: {
          metadata: true,
          statistics: true,
          languages: { orderBy: { percentage: 'desc' } },
        },
      });
    } catch (err) {
      logger.database.error(`RepositoryRepository.findById failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findByFullName(fullName: string): Promise<Repository | null> {
    try {
      return await prisma.repository.findUnique({
        where: { fullName },
        include: { metadata: true, statistics: true },
      });
    } catch (err) {
      logger.database.error(`RepositoryRepository.findByFullName failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findByUserIdAndFullName(userId: string, fullName: string): Promise<Repository | null> {
    try {
      return await prisma.repository.findFirst({
        where: { userId, fullName },
        include: { metadata: true, statistics: true },
      });
    } catch (err) {
      logger.database.error(`RepositoryRepository.findByUserIdAndFullName failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findByUserId(
    userId: string,
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<{ repositories: Repository[]; total: number }> {
    return this.findAll({ ...params, userId });
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    userId?: string;
    language?: string;
    visibility?: string;
  }): Promise<{ repositories: Repository[]; total: number }> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const skip = (page - 1) * limit;

      const where: Prisma.RepositoryWhereInput = {
        ...(params?.userId && { userId: params.userId }),
        ...(params?.language && params.language !== 'ALL' && { language: params.language }),
        ...(params?.visibility &&
          params.visibility !== 'ALL' && { visibility: params.visibility as 'PUBLIC' | 'PRIVATE' }),
        ...(params?.search && {
          OR: [
            { name: { contains: params.search } },
            { fullName: { contains: params.search } },
            { description: { contains: params.search } },
          ],
        }),
      };

      const [repositories, total] = await Promise.all([
        prisma.repository.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: { statistics: true, metadata: true },
        }),
        prisma.repository.count({ where }),
      ]);

      return { repositories, total };
    } catch (err) {
      logger.database.error(`RepositoryRepository.findAll failed: ${(err as Error).message}`);
      return { repositories: [], total: 0 };
    }
  }

  async create(data: Prisma.RepositoryCreateInput): Promise<Repository> {
    return prisma.repository.create({
      data,
      include: { metadata: true, statistics: true },
    });
  }

  async update(id: string, data: Prisma.RepositoryUpdateInput): Promise<Repository> {
    return prisma.repository.update({
      where: { id },
      data,
      include: { metadata: true, statistics: true },
    });
  }

  async delete(id: string): Promise<Repository> {
    return prisma.repository.delete({ where: { id } });
  }

  // Sub-resource query methods
  async findBranches(repositoryId: string): Promise<RepositoryBranch[]> {
    return prisma.repositoryBranch.findMany({
      where: { repositoryId },
      orderBy: { name: 'asc' },
    });
  }

  async findCommits(
    repositoryId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ commits: RepositoryCommit[]; total: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 30;
    const skip = (page - 1) * limit;

    const [commits, total] = await Promise.all([
      prisma.repositoryCommit.findMany({
        where: { repositoryId },
        skip,
        take: limit,
        orderBy: { commitDate: 'desc' },
      }),
      prisma.repositoryCommit.count({ where: { repositoryId } }),
    ]);

    return { commits, total };
  }

  async findContributors(repositoryId: string): Promise<RepositoryContributor[]> {
    return prisma.repositoryContributor.findMany({
      where: { repositoryId },
      orderBy: { contributions: 'desc' },
    });
  }

  async findIssues(repositoryId: string, state?: string): Promise<RepositoryIssue[]> {
    const where: Prisma.RepositoryIssueWhereInput = {
      repositoryId,
      ...(state && state !== 'all' && { state }),
    };
    return prisma.repositoryIssue.findMany({
      where,
      orderBy: { issueNumber: 'desc' },
    });
  }

  async findPullRequests(repositoryId: string, state?: string): Promise<RepositoryPullRequest[]> {
    const where: Prisma.RepositoryPullRequestWhereInput = {
      repositoryId,
      ...(state && state !== 'all' && { state }),
    };
    return prisma.repositoryPullRequest.findMany({
      where,
      orderBy: { prNumber: 'desc' },
    });
  }

  async findLanguages(repositoryId: string): Promise<RepositoryLanguage[]> {
    return prisma.repositoryLanguage.findMany({
      where: { repositoryId },
      orderBy: { percentage: 'desc' },
    });
  }

  // Upsert synchronization data inside a transaction
  async saveSyncData(repositoryId: string, payload: RepositorySyncPayload): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Update Repository metadata
      if (payload.metadata) {
        await tx.repositoryMetadata.upsert({
          where: { repositoryId },
          update: {
            license: payload.metadata.license,
            isFork: payload.metadata.isFork ?? false,
            isArchived: payload.metadata.isArchived ?? false,
            hasTopics: payload.metadata.hasTopics,
          },
          create: {
            repositoryId,
            license: payload.metadata.license,
            isFork: payload.metadata.isFork ?? false,
            isArchived: payload.metadata.isArchived ?? false,
            hasTopics: payload.metadata.hasTopics,
          },
        });
      }

      // 2. Update Repository statistics
      if (payload.statistics) {
        await tx.repositoryStatistics.upsert({
          where: { repositoryId },
          update: {
            commitCount: payload.statistics.commitCount ?? 0,
            branchCount: payload.statistics.branchCount ?? 0,
            pullRequestCount: payload.statistics.pullRequestCount ?? 0,
            contributorCount: payload.statistics.contributorCount ?? 0,
          },
          create: {
            repositoryId,
            commitCount: payload.statistics.commitCount ?? 0,
            branchCount: payload.statistics.branchCount ?? 0,
            pullRequestCount: payload.statistics.pullRequestCount ?? 0,
            contributorCount: payload.statistics.contributorCount ?? 0,
          },
        });
      }

      // 3. Upsert Branches
      if (payload.branches) {
        for (const branch of payload.branches) {
          await tx.repositoryBranch.upsert({
            where: {
              repositoryId_name: { repositoryId, name: branch.name },
            },
            update: {
              isProtected: branch.isProtected,
              commitSha: branch.commitSha,
            },
            create: {
              repositoryId,
              name: branch.name,
              isProtected: branch.isProtected,
              commitSha: branch.commitSha,
            },
          });
        }
      }

      // 4. Upsert Commits
      if (payload.commits) {
        for (const commit of payload.commits) {
          await tx.repositoryCommit.upsert({
            where: {
              repositoryId_sha: { repositoryId, sha: commit.sha },
            },
            update: {
              message: commit.message,
              authorName: commit.authorName,
              authorEmail: commit.authorEmail,
              authorAvatarUrl: commit.authorAvatarUrl,
              commitDate: commit.commitDate,
              githubUrl: commit.githubUrl,
            },
            create: {
              repositoryId,
              sha: commit.sha,
              message: commit.message,
              authorName: commit.authorName,
              authorEmail: commit.authorEmail,
              authorAvatarUrl: commit.authorAvatarUrl,
              commitDate: commit.commitDate,
              githubUrl: commit.githubUrl,
            },
          });
        }
      }

      // 5. Upsert Contributors
      if (payload.contributors) {
        for (const contrib of payload.contributors) {
          await tx.repositoryContributor.upsert({
            where: {
              repositoryId_username: { repositoryId, username: contrib.username },
            },
            update: {
              avatarUrl: contrib.avatarUrl,
              contributions: contrib.contributions,
              profileUrl: contrib.profileUrl,
            },
            create: {
              repositoryId,
              username: contrib.username,
              avatarUrl: contrib.avatarUrl,
              contributions: contrib.contributions,
              profileUrl: contrib.profileUrl,
            },
          });
        }
      }

      // 6. Upsert Issues
      if (payload.issues) {
        for (const issue of payload.issues) {
          await tx.repositoryIssue.upsert({
            where: {
              repositoryId_issueNumber: { repositoryId, issueNumber: issue.issueNumber },
            },
            update: {
              title: issue.title,
              state: issue.state,
              authorUsername: issue.authorUsername,
              authorAvatarUrl: issue.authorAvatarUrl,
              labels: issue.labels,
              githubUrl: issue.githubUrl,
              githubCreatedAt: issue.githubCreatedAt,
              githubUpdatedAt: issue.githubUpdatedAt,
            },
            create: {
              repositoryId,
              issueNumber: issue.issueNumber,
              title: issue.title,
              state: issue.state,
              authorUsername: issue.authorUsername,
              authorAvatarUrl: issue.authorAvatarUrl,
              labels: issue.labels,
              githubUrl: issue.githubUrl,
              githubCreatedAt: issue.githubCreatedAt,
              githubUpdatedAt: issue.githubUpdatedAt,
            },
          });
        }
      }

      // 7. Upsert Pull Requests
      if (payload.pullRequests) {
        for (const pr of payload.pullRequests) {
          await tx.repositoryPullRequest.upsert({
            where: {
              repositoryId_prNumber: { repositoryId, prNumber: pr.prNumber },
            },
            update: {
              title: pr.title,
              state: pr.state,
              authorUsername: pr.authorUsername,
              authorAvatarUrl: pr.authorAvatarUrl,
              isMerged: pr.isMerged,
              githubUrl: pr.githubUrl,
              githubCreatedAt: pr.githubCreatedAt,
              githubUpdatedAt: pr.githubUpdatedAt,
            },
            create: {
              repositoryId,
              prNumber: pr.prNumber,
              title: pr.title,
              state: pr.state,
              authorUsername: pr.authorUsername,
              authorAvatarUrl: pr.authorAvatarUrl,
              isMerged: pr.isMerged,
              githubUrl: pr.githubUrl,
              githubCreatedAt: pr.githubCreatedAt,
              githubUpdatedAt: pr.githubUpdatedAt,
            },
          });
        }
      }

      // 8. Upsert Languages
      if (payload.languages) {
        for (const lang of payload.languages) {
          await tx.repositoryLanguage.upsert({
            where: {
              repositoryId_name: { repositoryId, name: lang.name },
            },
            update: {
              bytes: lang.bytes,
              percentage: lang.percentage,
            },
            create: {
              repositoryId,
              name: lang.name,
              bytes: lang.bytes,
              percentage: lang.percentage,
            },
          });
        }
      }

      // 9. Update Repository sync status and timestamp
      await tx.repository.update({
        where: { id: repositoryId },
        data: {
          syncStatus: 'SYNCED',
          lastSyncedAt: new Date(),
        },
      });
    });
  }

  // ==========================================
  // REPOSITORY SYNC & REPOSITORY FILE METHODS
  // ==========================================

  async createSyncRecord(repositoryId: string, taskId?: string): Promise<RepositorySync> {
    return prisma.repositorySync.create({
      data: {
        repositoryId,
        taskId,
        status: 'SYNCING',
        startedAt: new Date(),
      },
    });
  }

  async updateSyncRecord(
    syncId: string,
    data: { status?: SyncStatus; completedAt?: Date; error?: string; fileCount?: number }
  ): Promise<RepositorySync> {
    return prisma.repositorySync.update({
      where: { id: syncId },
      data,
    });
  }

  async findSyncById(syncId: string): Promise<RepositorySync | null> {
    return prisma.repositorySync.findUnique({
      where: { id: syncId },
    });
  }

  async findLatestSyncByRepositoryId(repositoryId: string): Promise<RepositorySync | null> {
    return prisma.repositorySync.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveSyncByRepositoryId(repositoryId: string): Promise<RepositorySync | null> {
    return prisma.repositorySync.findFirst({
      where: {
        repositoryId,
        status: { in: ['IMPORTING', 'SYNCING'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFilesByRepositoryId(
    repositoryId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ files: RepositoryFile[]; total: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      prisma.repositoryFile.findMany({
        where: { repositoryId },
        skip,
        take: limit,
        orderBy: { path: 'asc' },
      }),
      prisma.repositoryFile.count({ where: { repositoryId } }),
    ]);

    return { files, total };
  }

  async syncRepositoryFiles(
    repositoryId: string,
    fileData: Array<{ path: string; sha: string; size: bigint; fileType: string; language?: string | null }>
  ): Promise<{ createdCount: number; updatedCount: number; deletedCount: number }> {
    return prisma.$transaction(async (tx) => {
      const existingFiles = await tx.repositoryFile.findMany({
        where: { repositoryId },
        select: { id: true, path: true, sha: true },
      });

      const existingMap = new Map(existingFiles.map((f) => [f.path, f]));
      const newPathsSet = new Set(fileData.map((f) => f.path));

      let createdCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;

      for (const item of fileData) {
        const existing = existingMap.get(item.path);
        if (!existing) {
          await tx.repositoryFile.create({
            data: {
              repositoryId,
              path: item.path,
              sha: item.sha,
              size: item.size,
              fileType: item.fileType,
              language: item.language,
            },
          });
          createdCount++;
        } else if (existing.sha !== item.sha) {
          await tx.repositoryFile.update({
            where: { id: existing.id },
            data: {
              sha: item.sha,
              size: item.size,
              fileType: item.fileType,
              language: item.language,
              updatedAt: new Date(),
            },
          });
          updatedCount++;
        }
      }

      for (const existing of existingFiles) {
        if (!newPathsSet.has(existing.path)) {
          await tx.repositoryFile.delete({
            where: { id: existing.id },
          });
          deletedCount++;
        }
      }

      return { createdCount, updatedCount, deletedCount };
    });
  }
}
