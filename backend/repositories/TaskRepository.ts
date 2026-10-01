import { Task, TaskStatus, TaskPriority, Prisma } from '@prisma/client';
import { ITaskRepository } from '../interfaces/ITaskRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class TaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    try {
      return await prisma.task.findUnique({
        where: { id },
        include: { repository: true, assignedWorker: true, executionLogs: true, analysisReport: true },
      });
    } catch (err) {
      logger.database.error(`TaskRepository.findById failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findAll(params?: { page?: number; limit?: number; status?: TaskStatus; priority?: TaskPriority; userId?: string; repositoryId?: string }): Promise<{ tasks: Task[]; total: number }> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const skip = (page - 1) * limit;

      const where: Prisma.TaskWhereInput = {
        ...(params?.status && { status: params.status }),
        ...(params?.priority && { priority: params.priority }),
        ...(params?.userId && { userId: params.userId }),
        ...(params?.repositoryId && { repositoryId: params.repositoryId }),
      };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { repository: true, assignedWorker: true },
        }),
        prisma.task.count({ where }),
      ]);

      return { tasks, total };
    } catch (err) {
      logger.database.error(`TaskRepository.findAll failed: ${(err as Error).message}`);
      return { tasks: [], total: 0 };
    }
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({ data });
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return prisma.task.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: TaskStatus, progress?: number, failureReason?: string): Promise<Task> {
    const data: Prisma.TaskUpdateInput = {
      status,
      ...(progress !== undefined && { progress }),
      ...(failureReason !== undefined && { failureReason }),
      ...(status === TaskStatus.RUNNING && { startedAt: new Date() }),
      ...(status === TaskStatus.COMPLETED && { completedAt: new Date(), progress: 100 }),
      ...(status === TaskStatus.FAILED && { completedAt: new Date() }),
    };

    return prisma.task.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Task> {
    return prisma.task.delete({ where: { id } });
  }
}
