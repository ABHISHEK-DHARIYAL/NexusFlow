import { prisma } from '../lib/prisma';
import { ScheduledJob, ScheduledJobExecution } from '../../types';

export interface CreateScheduledJobDTO {
  userId: string;
  name: string;
  description?: string | null;
  jobType: string;
  schedule: string;
  frequency?: string;
  time?: string | null;
  timezone?: string;
  enabled?: boolean;
  status?: string;
  resourceId?: string | null;
  nextRunAt?: Date | string | null;
}

export interface CreateExecutionDTO {
  scheduledJobId: string;
  userId: string;
  taskId?: string | null;
  scheduledOccurrence?: Date | string | null;
  status?: string;
}

export class ScheduledJobRepository {
  async create(data: CreateScheduledJobDTO): Promise<ScheduledJob> {
    const created = await prisma.scheduledJob.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description || null,
        jobType: data.jobType,
        schedule: data.schedule,
        frequency: data.frequency || 'DAILY',
        time: data.time || '09:00',
        timezone: data.timezone || 'UTC',
        enabled: data.enabled !== undefined ? data.enabled : true,
        status: data.status || 'ACTIVE',
        resourceId: data.resourceId || null,
        nextRunAt: data.nextRunAt ? new Date(data.nextRunAt) : null,
      },
    });

    return this.mapPrismaJobToDomain(created);
  }

  async findById(id: string): Promise<ScheduledJob | null> {
    const job = await prisma.scheduledJob.findUnique({
      where: { id },
      include: { executions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    return job ? this.mapPrismaJobToDomain(job) : null;
  }

  async findByUserId(userId: string): Promise<ScheduledJob[]> {
    const jobs = await prisma.scheduledJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { executions: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    return jobs.map((j) => this.mapPrismaJobToDomain(j));
  }

  async findDueJobs(): Promise<ScheduledJob[]> {
    const now = new Date();
    const jobs = await prisma.scheduledJob.findMany({
      where: {
        enabled: true,
        status: 'ACTIVE',
        nextRunAt: { lte: now },
      },
    });
    return jobs.map((j) => this.mapPrismaJobToDomain(j));
  }

  async update(id: string, data: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const updated = await prisma.scheduledJob.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.schedule && { schedule: data.schedule }),
        ...(data.frequency && { frequency: data.frequency }),
        ...(data.time !== undefined && { time: data.time }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.status && { status: data.status }),
        ...(data.resourceId !== undefined && { resourceId: data.resourceId }),
        ...(data.lastRunAt !== undefined && { lastRunAt: data.lastRunAt ? new Date(data.lastRunAt) : null }),
        ...(data.nextRunAt !== undefined && { nextRunAt: data.nextRunAt ? new Date(data.nextRunAt) : null }),
        ...(data.lastStatus !== undefined && { lastStatus: data.lastStatus }),
        ...(data.lastError !== undefined && { lastError: data.lastError }),
        ...(data.consecutiveFailures !== undefined && { consecutiveFailures: data.consecutiveFailures }),
      },
    });
    return this.mapPrismaJobToDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.scheduledJob.delete({ where: { id } });
    return true;
  }

  async createExecution(data: CreateExecutionDTO): Promise<ScheduledJobExecution> {
    const created = await prisma.scheduledJobExecution.create({
      data: {
        scheduledJobId: data.scheduledJobId,
        userId: data.userId,
        taskId: data.taskId || null,
        scheduledOccurrence: data.scheduledOccurrence ? new Date(data.scheduledOccurrence) : new Date(),
        status: data.status || 'QUEUED',
      },
    });
    return this.mapPrismaExecutionToDomain(created);
  }

  async findExecutionsByJobId(scheduledJobId: string): Promise<ScheduledJobExecution[]> {
    const execs = await prisma.scheduledJobExecution.findMany({
      where: { scheduledJobId },
      orderBy: { createdAt: 'desc' },
    });
    return execs.map((e) => this.mapPrismaExecutionToDomain(e));
  }

  async findActiveExecutionForJob(scheduledJobId: string): Promise<ScheduledJobExecution | null> {
    const active = await prisma.scheduledJobExecution.findFirst({
      where: {
        scheduledJobId,
        status: { in: ['QUEUED', 'RUNNING'] },
      },
    });
    return active ? this.mapPrismaExecutionToDomain(active) : null;
  }

  async updateExecution(id: string, data: Partial<ScheduledJobExecution>): Promise<ScheduledJobExecution> {
    const updated = await prisma.scheduledJobExecution.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.taskId !== undefined && { taskId: data.taskId }),
        ...(data.completedAt !== undefined && { completedAt: data.completedAt ? new Date(data.completedAt) : null }),
        ...(data.error !== undefined && { error: data.error }),
        ...(data.durationMs !== undefined && { durationMs: data.durationMs }),
      },
    });
    return this.mapPrismaExecutionToDomain(updated);
  }

  private mapPrismaJobToDomain(job: any): ScheduledJob {
    return {
      id: job.id,
      userId: job.userId,
      name: job.name,
      description: job.description,
      jobType: job.jobType,
      schedule: job.schedule,
      frequency: job.frequency,
      time: job.time,
      timezone: job.timezone,
      enabled: job.enabled,
      status: job.status,
      resourceId: job.resourceId,
      lastRunAt: job.lastRunAt ? new Date(job.lastRunAt).toISOString() : null,
      nextRunAt: job.nextRunAt ? new Date(job.nextRunAt).toISOString() : null,
      lastStatus: job.lastStatus,
      lastError: job.lastError,
      consecutiveFailures: job.consecutiveFailures,
      createdAt: new Date(job.createdAt).toISOString(),
      updatedAt: new Date(job.updatedAt).toISOString(),
      executions: job.executions ? job.executions.map((e: any) => this.mapPrismaExecutionToDomain(e)) : undefined,
    };
  }

  private mapPrismaExecutionToDomain(exec: any): ScheduledJobExecution {
    return {
      id: exec.id,
      scheduledJobId: exec.scheduledJobId,
      userId: exec.userId,
      taskId: exec.taskId,
      scheduledOccurrence: exec.scheduledOccurrence ? new Date(exec.scheduledOccurrence).toISOString() : null,
      startedAt: new Date(exec.startedAt).toISOString(),
      completedAt: exec.completedAt ? new Date(exec.completedAt).toISOString() : null,
      status: exec.status,
      error: exec.error,
      durationMs: exec.durationMs,
      createdAt: new Date(exec.createdAt).toISOString(),
    };
  }
}

export const scheduledJobRepository = new ScheduledJobRepository();
