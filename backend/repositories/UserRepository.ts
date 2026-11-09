import { User, Prisma } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { id } });
    } catch (err) {
      logger.database.error(`UserRepository.findById failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    // Errors intentionally propagate: swallowing a DB failure here made
    // login look like "Invalid email or password" and signup crash later.
    return prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    // Errors intentionally propagate: swallowing a DB failure here made
    // login look like "Invalid email or password" and signup crash later.
    return prisma.user.findUnique({ where: { username } });
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({ where: { githubId } });
    } catch (err) {
      logger.database.error(`UserRepository.findByGithubId failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findAll(params?: { page?: number; limit?: number; search?: string }): Promise<{ users: User[]; total: number }> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const skip = (page - 1) * limit;

      const where: Prisma.UserWhereInput = params?.search
        ? {
            OR: [
              { name: { contains: params.search } },
              { username: { contains: params.search } },
              { email: { contains: params.search } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.user.count({ where }),
      ]);

      return { users, total };
    } catch (err) {
      logger.database.error(`UserRepository.findAll failed: ${(err as Error).message}`);
      return { users: [], total: 0 };
    }
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  }
}
