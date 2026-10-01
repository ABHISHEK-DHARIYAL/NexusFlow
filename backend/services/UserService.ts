import { User, UserRole, AccountStatus, Prisma } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IGithubAccountRepository } from '../interfaces/IGithubAccountRepository';
import { UserRepository } from '../repositories/UserRepository';
import { GithubAccountRepository } from '../repositories/GithubAccountRepository';
import { GithubUserProfile } from './GithubOAuthService';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';
import { NotFoundError, ConflictError, UnauthorizedError } from '../utils/errors';
import { hashPassword, comparePassword } from '../utils/password';

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

  /**
   * Creates a brand-new account from an email + password signup. This is
   * the "first login" path: no GitHub identity is attached yet, and
   * `githubId` is left null until the user connects GitHub afterward
   * (see `linkGithubAccount` below).
   */
  async createWithPassword(data: {
    email: string;
    password: string;
    username?: string;
    name?: string;
  }): Promise<User> {
    const existingEmail = await this.userRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('An account with this email already exists');
    }

    // Derive a username from the email's local part if none was given,
    // then de-duplicate it the same way GitHub sign-in does.
    let username = data.username || data.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
    if (!username) {
      username = `user-${Math.random().toString(36).substring(2, 8)}`;
    }
    const existingUsername = await this.userRepo.findByUsername(username);
    if (existingUsername) {
      username = `${username}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const passwordHash = await hashPassword(data.password);

    logger.auth.info(`[User Service] Creating new user from email/password signup: ${data.email}`);

    return prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email: data.email,
          username,
          name: data.name || username,
          passwordHash,
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
    });
  }

  /**
   * Verifies email + password credentials for an existing account and
   * returns the user on success. Throws UnauthorizedError for any
   * failure (unknown email, wrong password, or a GitHub-only account
   * that has no password set) without distinguishing which, so a login
   * attempt can't be used to enumerate registered emails.
   */
  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return this.userRepo.update(user.id, { lastLoginAt: new Date() });
  }

  /**
   * Attaches a GitHub identity to an already-authenticated user (the
   * "connect GitHub later" flow), rather than creating or logging into a
   * separate account the way `findOrCreateFromGithub` does.
   */
  async linkGithubAccount(
    userId: string,
    githubUser: GithubUserProfile,
    githubAccessToken: string,
    githubRefreshToken?: string
  ): Promise<User> {
    const stringGithubId = String(githubUser.id);

    const owner = await this.userRepo.findByGithubId(stringGithubId);
    if (owner && owner.id !== userId) {
      throw new ConflictError(
        'This GitHub account is already connected to a different NexusFlow account'
      );
    }

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          githubId: stringGithubId,
          avatarUrl: githubUser.avatar_url,
        },
      });

      await tx.gitHubAccount.upsert({
        where: { userId },
        update: {
          githubUsername: githubUser.login,
          accessToken: githubAccessToken,
          refreshToken: githubRefreshToken || null,
          avatarUrl: githubUser.avatar_url,
          profileUrl: githubUser.html_url,
        },
        create: {
          userId,
          githubUserId: stringGithubId,
          githubUsername: githubUser.login,
          accessToken: githubAccessToken,
          refreshToken: githubRefreshToken || null,
          avatarUrl: githubUser.avatar_url,
          profileUrl: githubUser.html_url,
        },
      });

      logger.auth.info(`[User Service] Connected GitHub account @${githubUser.login} to user ${userId}`);

      return updatedUser;
    });
  }
}

export default UserService;
