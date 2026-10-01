import { describe, it, expect, beforeEach } from 'vitest';
import { SchedulerService } from '../../backend/services/SchedulerService';
import { ScheduledJobRepository } from '../../backend/repositories/ScheduledJobRepository';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../../backend/utils/errors';

describe('Part 24 - IDOR & Ownership Protection Tests', () => {
  let service: SchedulerService;
  let repo: ScheduledJobRepository;

  beforeEach(() => {
    repo = new ScheduledJobRepository();
    service = new SchedulerService(repo);
  });

  it('should isolate user schedules and prevent cross-user schedule access (IDOR)', async () => {
    // User A creates a schedule
    const scheduleA = await service.createSchedule('user_A', {
      name: 'User A Schedule',
      jobType: 'GITHUB_SYNC',
      frequency: 'DAILY',
      time: '09:00',
    });

    expect(scheduleA.userId).toBe('user_A');

    // User A can view schedule
    const fetchedByA = await service.getScheduleById('user_A', scheduleA.id);
    expect(fetchedByA.id).toBe(scheduleA.id);

    // User B attempts to view User A's schedule -> Should throw ForbiddenError or NotFoundError
    await expect(service.getScheduleById('user_B', scheduleA.id)).rejects.toThrow(ForbiddenError);

    // User B attempts to update User A's schedule -> Should throw ForbiddenError
    await expect(
      service.updateSchedule('user_B', scheduleA.id, { name: 'Hacked Schedule' })
    ).rejects.toThrow(ForbiddenError);

    // User B attempts to delete User A's schedule -> Should throw ForbiddenError
    await expect(service.deleteSchedule('user_B', scheduleA.id)).rejects.toThrow(ForbiddenError);

    // User B attempts to trigger runNow on User A's schedule -> Should throw ForbiddenError
    await expect(service.runNow('user_B', scheduleA.id)).rejects.toThrow(ForbiddenError);
  });

  it('should ensure getSchedules lists only the requesting user schedules', async () => {
    await service.createSchedule('user_A', { name: 'A Job', jobType: 'LEETCODE_SYNC', frequency: 'DAILY', time: '10:00' });
    await service.createSchedule('user_B', { name: 'B Job', jobType: 'CODEFORCES_SYNC', frequency: 'DAILY', time: '11:00' });

    const userASchedules = await service.getSchedules('user_A');
    expect(userASchedules.every((s) => s.userId === 'user_A')).toBe(true);

    const userBSchedules = await service.getSchedules('user_B');
    expect(userBSchedules.every((s) => s.userId === 'user_B')).toBe(true);
  });
});
