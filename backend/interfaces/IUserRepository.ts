import { User, Prisma } from '@prisma/client';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByGithubId(githubId: string): Promise<User | null>;
  findAll(params?: { page?: number; limit?: number; search?: string }): Promise<{ users: User[]; total: number }>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  delete(id: string): Promise<User>;
}
