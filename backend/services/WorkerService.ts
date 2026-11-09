import { WorkerRepository } from '../repositories/WorkerRepository';
import { NotFoundError } from '../utils/errors';
import { WorkerStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class WorkerService {
  constructor(private workerRepository = new WorkerRepository()) {}

  async getWorkerById(id: string) {
    const worker = await this.workerRepository.findById(id);
    if (!worker) {
      throw new NotFoundError(`Worker with ID ${id} not found`);
    }
    return worker;
  }

  async getAllWorkers(params?: { status?: WorkerStatus }) {
    return this.workerRepository.findAll(params);
  }

  async registerWorker(data: Prisma.WorkerCreateInput) {
    return this.workerRepository.create(data);
  }

  async heartbeat(workerId: string, status?: WorkerStatus, activeThreads?: number) {
    const worker = await this.workerRepository.findByWorkerId(workerId);
    if (!worker) {
      throw new NotFoundError(`Worker with node ID ${workerId} not found`);
    }
    return this.workerRepository.updateHeartbeat(workerId, status, activeThreads);
  }

  /**
   * Returns the most recent metrics sample for each worker, backed by the
   * existing WorkerMetrics table. Previously nothing in the codebase read
   * this table - GET /workers/metrics had no backend implementation at all
   * and was served exclusively by an unauthenticated legacy mock in
   * server.ts. If no worker has ever reported a metrics sample yet, this
   * correctly returns an empty array rather than fabricated numbers.
   */
  async getLatestMetrics() {
    const workers = await prisma.worker.findMany({ select: { id: true } });
    const results = await Promise.all(
      workers.map((w) =>
        prisma.workerMetrics.findFirst({
          where: { workerId: w.id },
          orderBy: { timestamp: 'desc' },
        })
      )
    );
    return results.filter((m): m is NonNullable<typeof m> => m !== null);
  }
}
