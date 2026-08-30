import { Task, TaskStatus, TaskPriority, Prisma } from '@prisma/client';

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findAll(params?: { page?: number; limit?: number; status?: TaskStatus; priority?: TaskPriority; userId?: string; repositoryId?: string }): Promise<{ tasks: Task[]; total: number }>;
  create(data: Prisma.TaskCreateInput): Promise<Task>;
  update(id: string, data: Prisma.TaskUpdateInput): Promise<Task>;
  updateStatus(id: string, status: TaskStatus, progress?: number, failureReason?: string): Promise<Task>;
  delete(id: string): Promise<Task>;
}
