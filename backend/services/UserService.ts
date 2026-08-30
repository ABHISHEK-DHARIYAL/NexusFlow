import { User, UserRole, AccountStatus, Prisma } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IGithubAccountRepository } from '../interfaces/IGithubAccountRepository';
import { UserRepository } from '../repositories/UserRepository';
import { GithubAccountRepository } from '../repositories/GithubAccountRepository';
import { GithubUserProfile } from './GithubOAuthService';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';
import { NotFoundError } from '../utils/errors';

export class UserService {
  constructor(
    private userRepo: IUserRepository = new UserRepository(),
    private githubAccountRepo: IGithubAccountRepository = new GithubAccountRepository()
  ) {}

  async getAllUsers(params?: { page?: number; limit?: number; search?: string }): Promise<{ users: User[]; total: number }> {
    return this.userRepo.findAll(params);
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.userRepo.create(data);
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    await this.getUserById(id);
    return this.userRepo.update(id, data);
  }

  async deleteUser(id: string): Promise<User> {
    await this.getUserById(id);
    return this.userRepo.delete(id);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOrCreateFromGithub(
    githubUser: GithubUserProfile,
    githubAccessToken: string,
    githubRefreshToken?: string
  ): Promise<User> {
    const stringGithubId = String(githubUser.id);
    
    // Check if user already exists
    let existingUser = await this.userRepo.findByGithubId(stringGithubId);

    if (existingUser) {
      logger.auth.info(`[User Service] Existing user logged in via GitHub: ${existingUser.username}`);

      // Transactionally update user last login and GitHub account info
      return await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            lastLoginAt: new Date(),
            avatarUrl: githubUser.avatar_url || existingUser.avatarUrl,
            name: githubUser.name || existingUser.name,
          },
        });

        await tx.gitHubAccount.upsert({
          where: { userId: existingUser.id },
          update: {
            githubUsername: githubUser.login,
            accessToken: githubAccessToken,
            refreshToken: githubRefreshToken || null,
            avatarUrl: githubUser.avatar_url,
            profileUrl: githubUser.html_url,
          },
          create: {
            userId: existingUser.id,
            githubUserId: stringGithubId,
            githubUsername: githubUser.login,
            accessToken: githubAccessToken,
            refreshToken: githubRefreshToken || null,
            avatarUrl: githubUser.avatar_url,
            profileUrl: githubUser.html_url,
          },
        });

        return updatedUser;
      });
    }

    // New user creation
    logger.auth.info(`[User Service] Creating new user for GitHub account: ${githubUser.login}`);

    // Generate unique username if needed
    let username = githubUser.login;
    const existingUsername = await this.userRepo.findByUsername(username);
    if (existingUsername) {
      username = `${githubUser.login}-${Math.random().toString(36).substring(2, 6)}`;
    }

    return await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          githubId: stringGithubId,
          username,
          email: githubUser.email || `${username}@users.noreply.github.com`,
          name: githubUser.name || username,
          avatarUrl: githubUser.avatar_url,
          role: UserRole.USER,
          status: AccountStatus.ACTIVE,
          lastLoginAt: new Date(),
          settings: {
            create: {
              theme: 'system',
            },
          },
        },
      });

      await tx.gitHubAccount.create({
        data: {
          userId: newUser.id,
          githubUserId: stringGithubId,
          githubUsername: githubUser.login,
          accessToken: githubAccessToken,
          refreshToken: githubRefreshToken || null,
          avatarUrl: githubUser.avatar_url,
          profileUrl: githubUser.html_url,
        },
      });

      return newUser;
    });
  }
}

export default UserService;
