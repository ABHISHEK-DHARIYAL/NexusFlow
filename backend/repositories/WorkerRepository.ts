import { Worker, WorkerStatus, Prisma } from '@prisma/client';
import { IWorkerRepository } from '../interfaces/IWorkerRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class WorkerRepository implements IWorkerRepository {
  async findById(id: string): Promise<Worker | null> {
    try {
      return await prisma.worker.findUnique({
        where: { id },
        include: { metrics: { take: 10, orderBy: { timestamp: 'desc' } } },
      });
    } catch (err) {
      logger.database.error(`WorkerRepository.findById failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findByWorkerId(workerId: string): Promise<Worker | null> {
    try {
      return await prisma.worker.findUnique({ where: { workerId } });
    } catch (err) {
      logger.database.error(`WorkerRepository.findByWorkerId failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findAll(params?: { status?: WorkerStatus }): Promise<Worker[]> {
    try {
      const where: Prisma.WorkerWhereInput = params?.status ? { status: params.status } : {};
      return await prisma.worker.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: { metrics: { take: 1, orderBy: { timestamp: 'desc' } } },
      });
    } catch (err) {
      logger.database.error(`WorkerRepository.findAll failed: ${(err as Error).message}`);
      return [];
    }
  }

  async create(data: Prisma.WorkerCreateInput): Promise<Worker> {
    return prisma.worker.create({ data });
  }

  async update(id: string, data: Prisma.WorkerUpdateInput): Promise<Worker> {
    return prisma.worker.update({ where: { id }, data });
  }

  async updateHeartbeat(workerId: string, status?: WorkerStatus, activeThreads?: number): Promise<Worker> {
    return prisma.worker.update({
      where: { workerId },
      data: {
        lastHeartbeat: new Date(),
        ...(status && { status }),
        ...(activeThreads !== undefined && { activeThreads }),
      },
    });
  }

  async delete(id: string): Promise<Worker> {
    return prisma.worker.delete({ where: { id } });
  }
}
