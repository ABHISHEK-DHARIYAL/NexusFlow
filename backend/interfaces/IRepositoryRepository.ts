import { Repository, Prisma } from '@prisma/client';

export interface IRepositoryRepository {
  findById(id: string): Promise<Repository | null>;
  findByFullName(fullName: string): Promise<Repository | null>;
  findByUserId(userId: string, params?: { page?: number; limit?: number; search?: string }): Promise<{ repositories: Repository[]; total: number }>;
  findAll(params?: { page?: number; limit?: number; search?: string; userId?: string }): Promise<{ repositories: Repository[]; total: number }>;
  create(data: Prisma.RepositoryCreateInput): Promise<Repository>;
  update(id: string, data: Prisma.RepositoryUpdateInput): Promise<Repository>;
  delete(id: string): Promise<Repository>;
}
