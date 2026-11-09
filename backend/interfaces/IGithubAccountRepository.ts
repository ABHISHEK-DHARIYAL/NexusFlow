import { GitHubAccount, Prisma } from '@prisma/client';

export interface IGithubAccountRepository {
  findByUserId(userId: string): Promise<GitHubAccount | null>;
  findByGithubUserId(githubUserId: string): Promise<GitHubAccount | null>;
  upsert(userId: string, data: {
    githubUserId: string;
    githubUsername: string;
    accessToken: string;
    refreshToken?: string | null;
    tokenExpiresAt?: Date | null;
    profileUrl?: string | null;
    avatarUrl?: string | null;
  }): Promise<GitHubAccount>;
  delete(id: string): Promise<GitHubAccount>;
}
