import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@prisma/client', () => ({
  UserRole: { ADMIN: 'ADMIN', USER: 'USER' },
  TaskStatus: { QUEUED: 'QUEUED', RUNNING: 'RUNNING', COMPLETED: 'COMPLETED', FAILED: 'FAILED', CANCELLED: 'CANCELLED' },
}));

// Regression test for a confirmed frontend/backend contract gap:
// frontend/services/task.service.ts calls POST /tasks/:id/cancel,
// POST /tasks/:id/retry, and GET /tasks/:id/logs - none of which ever had
// a matching route on the real backend (only a since-removed
// unauthenticated legacy mock in server.ts served these paths). This
// tests the restored TaskService methods that wire these to real,
// previously-unused infrastructure (JavaWorkerClient.cancelTask() and the
// TaskExecutionLog Prisma model).

vi.mock('../../lib/prisma', () => ({
  prisma: {
    taskExecutionLog: {
      findMany: vi.fn().mockResolvedValue([{ id: 'log1', taskId: 'task1', message: 'started' }]),
    },
  },
}));

vi.mock('../../worker/JavaWorkerClient', () => ({
  javaWorkerClient: {
    cancelTask: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../TaskEventEmitter', () => ({
  taskEventEmitter: { emit: vi.fn() },
}));

import { TaskService } from '../TaskService';
import { javaWorkerClient } from '../../worker/JavaWorkerClient';

function makeRepoStub(task: any) {
  return {
    findById: vi.fn().mockResolvedValue(task),
    updateStatus: vi.fn().mockImplementation((id: string, status: string, progress?: number) =>
      Promise.resolve({ ...task, status, progress })
    ),
  } as any;
}

function makeSyncStub() {
  return {
    dispatchToWorker: vi.fn().mockResolvedValue(undefined),
    syncTask: vi.fn().mockResolvedValue(null),
  } as any;
}

describe('TaskService - restored cancel/retry/logs endpoints', () => {
  const authUser = { id: 'user-a', role: 'USER' };

  it('cancelTask calls the Java worker and marks the task CANCELLED', async () => {
    const task = { id: 'task1', userId: 'user-a', status: 'RUNNING' };
    const repo = makeRepoStub(task);
    const sync = makeSyncStub();
    const service = new TaskService(repo, sync);

    const result = await service.cancelTask('task1', authUser as any);

    expect(javaWorkerClient.cancelTask).toHaveBeenCalledWith('task1');
    expect(repo.updateStatus).toHaveBeenCalledWith('task1', 'CANCELLED', undefined, undefined);
  });

  it('cancelTask refuses to cancel an already-completed task', async () => {
    const task = { id: 'task1', userId: 'user-a', status: 'COMPLETED' };
    const repo = makeRepoStub(task);
    const sync = makeSyncStub();
    const service = new TaskService(repo, sync);

    await expect(service.cancelTask('task1', authUser as any)).rejects.toThrow();
  });

  it('retryTask re-queues a FAILED task and re-dispatches it', async () => {
    const task = { id: 'task1', userId: 'user-a', status: 'FAILED' };
    const repo = makeRepoStub(task);
    const sync = makeSyncStub();
    const service = new TaskService(repo, sync);

    await service.retryTask('task1', authUser as any);

    expect(repo.updateStatus).toHaveBeenCalledWith('task1', 'QUEUED', 0, undefined);
    expect(sync.dispatchToWorker).toHaveBeenCalled();
  });

  it('retryTask refuses to retry a task that has not failed', async () => {
    const task = { id: 'task1', userId: 'user-a', status: 'RUNNING' };
    const repo = makeRepoStub(task);
    const sync = makeSyncStub();
    const service = new TaskService(repo, sync);

    await expect(service.retryTask('task1', authUser as any)).rejects.toThrow();
  });

  it('getTaskLogs enforces ownership before returning logs', async () => {
    const task = { id: 'task1', userId: 'someone-else', status: 'COMPLETED' };
    const repo = makeRepoStub(task);
    const sync = makeSyncStub();
    const service = new TaskService(repo, sync);

    await expect(service.getTaskLogs('task1', authUser as any)).rejects.toThrow();
  });

  it('getTaskLogs returns real log entries for the owner', async () => {
    const task = { id: 'task1', userId: 'user-a', status: 'COMPLETED' };
    const repo = makeRepoStub(task);
    const sync = makeSyncStub();
    const service = new TaskService(repo, sync);

    const logs = await service.getTaskLogs('task1', authUser as any);
    expect(logs).toEqual([{ id: 'log1', taskId: 'task1', message: 'started' }]);
  });
});
