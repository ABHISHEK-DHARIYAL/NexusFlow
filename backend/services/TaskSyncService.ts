import { TaskStatus } from '@prisma/client';
import { javaWorkerClient, JavaWorkerClient } from '../worker/JavaWorkerClient';
import { TaskRepository } from '../repositories/TaskRepository';
import { logger } from '../logger';
import { workerConfig } from '../worker/workerConfig';

export class TaskSyncService {
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(
    private taskRepository = new TaskRepository(),
    private workerClient: JavaWorkerClient = javaWorkerClient
  ) {}

  public async dispatchToWorker(task: any, correlationId?: string): Promise<void> {
    try {
      logger.worker.info(`Dispatching task ${task.id} to Java worker...`);
      
      let taskTypeMapped: any = task.taskType || task.type || 'CUSTOM';
      let priorityMapped: any = task.priority || 'MEDIUM';

      const payload = {
        taskId: task.id,
        repositoryId: task.repositoryId,
        userId: task.userId,
        taskType: taskTypeMapped,
        priority: priorityMapped,
        maxRetries: task.maxRetries || 3,
        scheduledAt: task.scheduledAt ? new Date(task.scheduledAt).toISOString() : null,
        payload: typeof task.payload === 'string' ? JSON.parse(task.payload || '{}') : task.payload || {},
      };

      const response = await this.workerClient.submitTask(payload, correlationId);
      
      const mappedStatus = this.mapJavaStatusToPrisma(response.status);
      await this.taskRepository.updateStatus(task.id, mappedStatus);
      logger.worker.info(`Task ${task.id} successfully dispatched to Java worker. Initial status: ${response.status}`);
    } catch (err: any) {
      logger.worker.error(`Failed to dispatch task ${task.id} to Java worker: ${err.message}`);
      await this.taskRepository.updateStatus(task.id, TaskStatus.FAILED, undefined, `Worker dispatch error: ${err.message}`);
    }
  }

  public async syncTask(taskId: string, correlationId?: string): Promise<any> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) return null;

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED || task.status === TaskStatus.CANCELLED) {
      return task;
    }

    try {
      const workerStatus = await this.workerClient.getTaskStatus(taskId, correlationId);
      const mappedStatus = this.mapJavaStatusToPrisma(workerStatus.status);

      let progress = task.progress;
      if (mappedStatus === TaskStatus.COMPLETED) {
        progress = 100;
      } else if (mappedStatus === TaskStatus.RUNNING) {
        progress = Math.max(progress || 0, 50);
      }

      let failureReason = task.failureReason;
      if (workerStatus.error) {
        failureReason = `${workerStatus.error.code}: ${workerStatus.error.message}`;
      }

      const updated = await this.taskRepository.updateStatus(taskId, mappedStatus, progress, failureReason);
      return updated;
    } catch (err: any) {
      logger.worker.error(`Failed to sync task ${taskId} with Java worker: ${err.message}`);
      return task;
    }
  }

  public async syncAllActiveTasks(): Promise<void> {
    try {
      const activeStatuses: TaskStatus[] = [TaskStatus.QUEUED, TaskStatus.RUNNING];
      for (const status of activeStatuses) {
        const { tasks } = await this.taskRepository.findAll({ status, limit: 100 });
        for (const task of tasks) {
          await this.syncTask(task.id);
        }
      }
    } catch (err: any) {
      logger.worker.error(`Error during batch task synchronization: ${err.message}`);
    }
  }

  public startBackgroundPoller(intervalMs: number = workerConfig.pollIntervalMs): void {
    if (this.pollingInterval) return;
    logger.worker.info(`Starting background task state sync poller (interval: ${intervalMs}ms)`);
    this.pollingInterval = setInterval(() => {
      this.syncAllActiveTasks().catch(err => {
        logger.worker.error(`Background sync error: ${err.message}`);
      });
    }, intervalMs);
  }

  public stopBackgroundPoller(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      logger.worker.info('Stopped background task state sync poller');
    }
  }

  private mapJavaStatusToPrisma(javaStatus: string): TaskStatus {
    switch (javaStatus?.toUpperCase()) {
      case 'QUEUED':
      case 'SCHEDULED':
        return TaskStatus.QUEUED;
      case 'RUNNING':
      case 'RETRYING':
        return TaskStatus.RUNNING;
      case 'COMPLETED':
        return TaskStatus.COMPLETED;
      case 'FAILED':
        return TaskStatus.FAILED;
      case 'CANCELLED':
        return TaskStatus.CANCELLED;
      default:
        return TaskStatus.QUEUED;
    }
  }
}

export const taskSyncService = new TaskSyncService();
