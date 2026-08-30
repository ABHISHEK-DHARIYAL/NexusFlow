import { Worker, WorkerStatus, Prisma } from '@prisma/client';

export interface IWorkerRepository {
  findById(id: string): Promise<Worker | null>;
  findByWorkerId(workerId: string): Promise<Worker | null>;
  findAll(params?: { status?: WorkerStatus }): Promise<Worker[]>;
  create(data: Prisma.WorkerCreateInput): Promise<Worker>;
  update(id: string, data: Prisma.WorkerUpdateInput): Promise<Worker>;
  updateHeartbeat(workerId: string, status?: WorkerStatus, activeThreads?: number): Promise<Worker>;
  delete(id: string): Promise<Worker>;
}
