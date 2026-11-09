import { describe, it, expect, vi } from 'vitest';
import { TaskService } from '../../backend/services/TaskService';
import { TaskSyncService } from '../../backend/services/TaskSyncService';
import { JavaWorkerClient } from '../../backend/worker/JavaWorkerClient';
import { TaskStatus } from '@prisma/client';

describe('End-to-End Task Flow Integration', () => {
  it('should create a task in DB, dispatch to Java worker, and synchronize status', async () => {
    const mockTaskRepo: any = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
    };

    const mockWorkerClient: any = {
      submitTask: vi.fn().mockResolvedValue({ taskId: 'e2e-task-1', status: 'RUNNING' }),
      getTaskStatus: vi.fn().mockResolvedValue({
        taskId: 'e2e-task-1',
        status: 'COMPLETED',
        retryCount: 0,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        executionTimeMs: 120,
        result: { summary: 'Analysis complete' },
        error: null,
      }),
    };

    const syncService = new TaskSyncService(mockTaskRepo, mockWorkerClient as JavaWorkerClient);
    const taskService = new TaskService(mockTaskRepo, syncService);

    const createdTask = {
      id: 'e2e-task-1',
      title: 'Analyze Repository Security',
      type: 'ANALYSIS',
      status: TaskStatus.QUEUED,
      priority: 'HIGH',
      repositoryId: 'repo-e2e',
      userId: 'user-e2e',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockTaskRepo.create.mockResolvedValue(createdTask);
    mockTaskRepo.findById.mockResolvedValue(createdTask);
    mockTaskRepo.updateStatus.mockImplementation(async (id: string, status: TaskStatus) => ({
      ...createdTask,
      status,
    }));

    // 1. Dispatch task to worker via sync service
    await syncService.dispatchToWorker(createdTask);

    expect(mockWorkerClient.submitTask).toHaveBeenCalledOnce();
    expect(mockTaskRepo.updateStatus).toHaveBeenCalledWith('e2e-task-1', TaskStatus.RUNNING);

    // 2. Fetch task by ID (triggers real-time sync with Java worker)
    const syncedTask = await taskService.getTaskById('e2e-task-1');

    expect(mockWorkerClient.getTaskStatus).toHaveBeenCalledWith('e2e-task-1', undefined);
    expect(syncedTask.status).toBe(TaskStatus.COMPLETED);
  });
});
