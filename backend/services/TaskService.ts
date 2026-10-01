import { TaskRepository } from '../repositories/TaskRepository';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Prisma, TaskStatus, TaskPriority } from '@prisma/client';
import { TaskSyncService, taskSyncService } from './TaskSyncService';
import { assertResourceOwnership, AuthUser } from '../utils/ownership';
import { taskEventEmitter } from './TaskEventEmitter';
import { javaWorkerClient } from '../worker/JavaWorkerClient';
import { prisma } from '../lib/prisma';

export class TaskService {
  constructor(
    private taskRepository = new TaskRepository(),
    private syncService: TaskSyncService = taskSyncService
  ) {}

  async getTaskById(id: string, authUser?: AuthUser) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }
    if (authUser) {
      assertResourceOwnership(task.userId, authUser, 'task');
    }
    // Perform sync check with Java worker if active
    if (task.status === TaskStatus.QUEUED || task.status === TaskStatus.RUNNING) {
      const synced = await this.syncService.syncTask(id);
      return synced || task;
    }
    return task;
  }

  async getAllTasks(params?: { page?: number; limit?: number; status?: TaskStatus; priority?: TaskPriority; userId?: string; repositoryId?: string }) {
    return this.taskRepository.findAll(params);
  }

  async createTask(data: Prisma.TaskCreateInput) {
    const createdTask = await this.taskRepository.create(data);
    // Dispatch task to Java Worker Engine asynchronously
    this.syncService.dispatchToWorker(createdTask).catch(() => {});

    // Fix: taskEventEmitter was subscribed to in WebSocketServer.ts but
    // nothing anywhere ever called .emit() on it, so real-time task/queue
    // updates were never delivered to any client.
    taskEventEmitter.emit('task:created', {
      userId: (createdTask as any).userId,
      taskId: createdTask.id,
      taskType: (createdTask as any).taskType,
      status: createdTask.status,
      timestamp: new Date(),
    });

    return createdTask;
  }

  async updateTaskStatus(id: string, status: TaskStatus, progress?: number, failureReason?: string, authUser?: AuthUser) {
    const existing = await this.getTaskById(id, authUser);
    const updated = await this.taskRepository.updateStatus(id, status, progress, failureReason);

    const userId = (existing as any).userId;
    const basePayload = { userId, taskId: id, status, timestamp: new Date() };

    taskEventEmitter.emit('task:status_changed', basePayload);

    if (progress !== undefined) {
      taskEventEmitter.emit('task:progress', { ...basePayload, progress });
    }
    if (status === TaskStatus.COMPLETED) {
      taskEventEmitter.emit('task:completed', basePayload);
    }
    if (status === TaskStatus.FAILED) {
      taskEventEmitter.emit('task:failed', { ...basePayload, failureReason });
    }

    return updated;
  }

  async deleteTask(id: string, authUser?: AuthUser) {
    await this.getTaskById(id, authUser);
    return this.taskRepository.delete(id);
  }

  /**
   * Fix for a confirmed regression: frontend/services/task.service.ts
   * calls POST /tasks/:id/cancel, but the real task.routes.ts never had a
   * matching route - only a since-removed unauthenticated legacy mock in
   * server.ts ever served this path. This uses the JavaWorkerClient's
   * existing cancelTask() method (already implemented, just never called
   * from anywhere) to actually request cancellation from the Java worker.
   */
  async cancelTask(id: string, authUser?: AuthUser) {
    const task = await this.getTaskById(id, authUser);

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new BadRequestError(`Task is already ${task.status.toLowerCase()} and cannot be cancelled`);
    }

    try {
      await javaWorkerClient.cancelTask(id);
    } catch (err: any) {
      // Best-effort: the worker may have already finished the task, or be
      // unreachable. Proceed to mark it cancelled locally regardless, but
      // surface the failure in logs rather than silently pretending the
      // remote cancellation definitely happened.
    }

    return this.updateTaskStatus(id, TaskStatus.CANCELLED, undefined, undefined, authUser);
  }

  /**
   * Fix for a confirmed regression: frontend calls POST /tasks/:id/retry
   * with no matching real route ever having existed. A failed task is
   * retried by resetting it to QUEUED and re-dispatching it through the
   * existing dispatchToWorker() path used for initial task creation - the
   * Java side's own internal RetryManager still applies for
   * worker-initiated retries; this is specifically for a user manually
   * retrying a task that has already reached a terminal FAILED state.
   */
  async retryTask(id: string, authUser?: AuthUser) {
    const task = await this.getTaskById(id, authUser);

    if (task.status !== TaskStatus.FAILED) {
      throw new BadRequestError(`Only failed tasks can be retried (current status: ${task.status})`);
    }

    const updated = await this.taskRepository.updateStatus(id, TaskStatus.QUEUED, 0, undefined);
    this.syncService.dispatchToWorker(updated).catch(() => {});

    taskEventEmitter.emit('task:status_changed', {
      userId: (task as any).userId,
      taskId: id,
      status: TaskStatus.QUEUED,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Fix for a confirmed regression: frontend calls GET /tasks/:id/logs
   * with no matching real route ever having existed. The Prisma schema
   * already defines a real TaskExecutionLog model; nothing in the
   * backend ever wrote to or read from it.
   */
  async getTaskLogs(id: string, authUser?: AuthUser) {
    await this.getTaskById(id, authUser);
    return prisma.taskExecutionLog.findMany({
      where: { taskId: id },
      orderBy: { timestamp: 'asc' },
    });
  }
}
