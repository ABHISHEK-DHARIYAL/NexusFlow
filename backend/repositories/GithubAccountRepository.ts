import { GitHubAccount } from '@prisma/client';
import { IGithubAccountRepository } from '../interfaces/IGithubAccountRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class GithubAccountRepository implements IGithubAccountRepository {
  async findByUserId(userId: string): Promise<GitHubAccount | null> {
    try {
      return await prisma.gitHubAccount.findUnique({ where: { userId } });
    } catch (err) {
      logger.database.error(`GithubAccountRepository.findByUserId failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findByGithubUserId(githubUserId: string): Promise<GitHubAccount | null> {
    try {
      return await prisma.gitHubAccount.findUnique({ where: { githubUserId } });
    } catch (err) {
      logger.database.error(`GithubAccountRepository.findByGithubUserId failed: ${(err as Error).message}`);
      return null;
    }
  }

  async upsert(userId: string, data: {
    githubUserId: string;
    githubUsername: string;
    accessToken: string;
    refreshToken?: string | null;
    tokenExpiresAt?: Date | null;
    profileUrl?: string | null;
    avatarUrl?: string | null;
  }): Promise<GitHubAccount> {
    return prisma.gitHubAccount.upsert({
      where: { userId },
      update: {
        githubUsername: data.githubUsername,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        profileUrl: data.profileUrl,
        avatarUrl: data.avatarUrl,
      },
      create: {
        userId,
        githubUserId: data.githubUserId,
        githubUsername: data.githubUsername,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        profileUrl: data.profileUrl,
        avatarUrl: data.avatarUrl,
      },
    });
  }

  async delete(id: string): Promise<GitHubAccount> {
    return prisma.gitHubAccount.delete({ where: { id } });
  }
}
