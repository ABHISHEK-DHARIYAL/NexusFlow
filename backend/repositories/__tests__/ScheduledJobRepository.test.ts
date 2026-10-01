import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression test for a bug where ScheduledJobRepository silently fell back
// to an in-memory mock store (backend/mockDb.ts) whenever a Prisma call
// returned a legitimate empty array, or on any Prisma error - meaning a real
// user with zero scheduled jobs would be served fabricated data belonging to
// a seeded fake user. The fix removes the mock fallback entirely so the
// repository is backed exclusively by Prisma/MySQL, and errors propagate
// instead of being swallowed.

const findManyMock = vi.fn();
const findUniqueMock = vi.fn();
const createMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('../../lib/prisma', () => ({
  prisma: {
    scheduledJob: {
      findMany: (...args: any[]) => findManyMock(...args),
      findUnique: (...args: any[]) => findUniqueMock(...args),
      create: (...args: any[]) => createMock(...args),
      update: vi.fn(),
      delete: (...args: any[]) => deleteMock(...args),
    },
    scheduledJobExecution: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { ScheduledJobRepository } from '../ScheduledJobRepository';

describe('ScheduledJobRepository', () => {
  let repo: ScheduledJobRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ScheduledJobRepository();
  });

  it('returns a real empty array for a user with no scheduled jobs, never fabricated mock data', async () => {
    findManyMock.mockResolvedValueOnce([]);

    const jobs = await repo.findByUserId('real-user-with-no-jobs');

    expect(jobs).toEqual([]);
    // Must not contain the seeded mock job ("Daily GitHub Sync" / usr_01h8x9p3)
    expect(jobs.some((j: any) => j.userId === 'usr_01h8x9p3')).toBe(false);
  });

  it('propagates a real Prisma error instead of silently returning fake data', async () => {
    findManyMock.mockRejectedValueOnce(new Error('DB connection lost'));

    await expect(repo.findByUserId('any-user')).rejects.toThrow('DB connection lost');
  });

  it('never mixes results across users: findByUserId only returns jobs matching userId', async () => {
    findManyMock.mockImplementationOnce(({ where }: any) => {
      expect(where.userId).toBe('user-a');
      return Promise.resolve([
        { id: 'job1', userId: 'user-a', name: 'A job', createdAt: new Date(), updatedAt: new Date() },
      ]);
    });

    const jobs = await repo.findByUserId('user-a');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].userId).toBe('user-a');
  });

  it('propagates errors on delete rather than silently no-oping against mock data', async () => {
    deleteMock.mockRejectedValueOnce(new Error('Record to delete does not exist'));
    await expect(repo.delete('nonexistent-id')).rejects.toThrow();
  });
});
