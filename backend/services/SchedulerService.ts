import { scheduledJobRepository, ScheduledJobRepository } from '../repositories/ScheduledJobRepository';
import { TaskService } from './TaskService';
import { careerReportService, CareerReportService } from './CareerReportService';
import { unifiedCareerDashboardService, UnifiedCareerDashboardService } from './UnifiedCareerDashboardService';
import { applicationService, ApplicationService } from './ApplicationService';
import { scheduleEventEmitter } from './ScheduleEventEmitter';
import { calculateNextRunAt, validateCronExpression, isValidTimezone } from '../utils/cronUtils';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../logger';
import { ScheduledJob, ScheduledJobExecution, AutomationTemplate, AutomationSummary } from '../../types';

export interface CreateScheduleInput {
  name: string;
  description?: string | null;
  jobType: string;
  frequency: string; // DAILY, WEEKLY, MONTHLY, CUSTOM_CRON, INTERVAL
  schedule?: string | null; // Cron expression or interval string
  time?: string | null; // HH:MM
  timezone?: string | null;
  resourceId?: string | null;
}

export interface UpdateScheduleInput {
  name?: string;
  description?: string | null;
  frequency?: string;
  schedule?: string | null;
  time?: string | null;
  timezone?: string | null;
  resourceId?: string | null;
}

export class SchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private repository: ScheduledJobRepository = scheduledJobRepository,
    private taskService: TaskService = new TaskService(),
    private reportService: CareerReportService = careerReportService,
    private dashboardService: UnifiedCareerDashboardService = unifiedCareerDashboardService,
    private appService: ApplicationService = applicationService
  ) {}

  /**
   * Starts the periodic scheduler background loop
   */
  startLoop(intervalMs = 30000): void {
    if (this.timer) return;
    logger?.system?.info?.(`[SchedulerService] Starting periodic scheduler loop (${intervalMs}ms interval)`);
    
    // Recover any incomplete/stale executions on boot
    this.recoverIncompleteExecutions().catch((err) => {
      logger?.system?.error?.(`[SchedulerService] Error recovering executions on boot: ${err.message}`);
    });

    this.timer = setInterval(() => {
      this.processDueSchedules().catch((err) => {
        logger?.system?.error?.(`[SchedulerService] Loop error: ${err.message}`);
      });
    }, intervalMs);
  }

  /**
   * Stops the periodic scheduler loop
   */
  stopLoop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger?.system?.info?.('[SchedulerService] Stopped scheduler background loop');
    }
  }

  /**
   * Creates a new scheduled job for a user
   */
  async createSchedule(userId: string, input: CreateScheduleInput): Promise<ScheduledJob> {
    if (!input.name || !input.name.trim()) {
      throw new BadRequestError('Schedule name is required');
    }
    if (!input.jobType || !input.jobType.trim()) {
      throw new BadRequestError('Job type is required');
    }

    const validTypes = [
      'GITHUB_SYNC',
      'LEETCODE_SYNC',
      'CODEFORCES_SYNC',
      'PORTFOLIO_REFRESH',
      'RESUME_ANALYSIS',
      'PROFILE_REFRESH',
      'JOB_READINESS_REFRESH',
      'CAREER_REPORT',
      'APPLICATION_FOLLOWUP_CHECK',
      'CAREER_INSIGHT',
    ];

    if (!validTypes.includes(input.jobType.toUpperCase())) {
      throw new BadRequestError(`Invalid jobType. Supported types: ${validTypes.join(', ')}`);
    }

    // Limit active schedules per user to max 10
    const userSchedules = await this.repository.findByUserId(userId);
    const activeCount = userSchedules.filter((s) => s.status === 'ACTIVE' || s.enabled).length;
    if (activeCount >= 10) {
      throw new BadRequestError('Maximum limit of 10 active automations reached. Please pause or delete an existing schedule.');
    }

    const frequency = (input.frequency || 'DAILY').toUpperCase();
    const timezone = isValidTimezone(input.timezone || '') ? input.timezone! : 'UTC';

    if (frequency === 'CUSTOM_CRON') {
      if (!input.schedule || !validateCronExpression(input.schedule)) {
        throw new BadRequestError('Invalid cron expression. Expected standard 5-part cron syntax (e.g. "0 9 * * *")');
      }
    }

    const scheduleStr = frequency === 'CUSTOM_CRON' ? input.schedule! : input.schedule || frequency;
    const timeStr = input.time || '09:00';

    const nextRunAt = calculateNextRunAt({
      frequency,
      schedule: scheduleStr,
      time: timeStr,
      timezone,
    });

    const created = await this.repository.create({
      userId,
      name: input.name.trim(),
      description: input.description,
      jobType: input.jobType.toUpperCase(),
      schedule: scheduleStr,
      frequency,
      time: timeStr,
      timezone,
      enabled: true,
      status: 'ACTIVE',
      resourceId: input.resourceId,
      nextRunAt,
    });

    scheduleEventEmitter.emit('schedule:created', {
      scheduleId: created.id,
      userId,
      name: created.name,
      jobType: created.jobType,
    });

    return created;
  }

  /**
   * Retrieves all schedules for a user
   */
  async getSchedules(userId: string): Promise<ScheduledJob[]> {
    return this.repository.findByUserId(userId);
  }

  /**
   * Retrieves a single schedule by ID with IDOR protection
   */
  async getScheduleById(userId: string, scheduleId: string): Promise<ScheduledJob> {
    const job = await this.repository.findById(scheduleId);
    if (!job) {
      throw new NotFoundError(`Schedule with ID ${scheduleId} not found`);
    }
    if (job.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this schedule');
    }
    return job;
  }

  /**
   * Generates summary metrics for the Career Dashboard
   */
  async getAutomationSummary(userId: string): Promise<AutomationSummary> {
    const schedules = await this.getSchedules(userId);
    const totalCount = schedules.length;
    const activeCount = schedules.filter((s) => s.enabled && s.status === 'ACTIVE').length;
    const pausedCount = schedules.filter((s) => !s.enabled || s.status === 'PAUSED').length;
    const failedCount = schedules.filter((s) => s.status === 'FAILED').length;
    const needsAttentionCount = schedules.filter((s) => s.status === 'NEEDS_ATTENTION' || (s.consecutiveFailures && s.consecutiveFailures >= 3)).length;

    // Count executions completed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let completedTodayCount = 0;
    for (const s of schedules) {
      const execs = await this.repository.findExecutionsByJobId(s.id);
      completedTodayCount += execs.filter(
        (e) => e.status === 'COMPLETED' && new Date(e.createdAt) >= startOfToday
      ).length;
    }

    // Find next upcoming scheduled run
    const upcoming = schedules
      .filter((s) => s.enabled && s.status === 'ACTIVE' && s.nextRunAt)
      .sort((a, b) => new Date(a.nextRunAt!).getTime() - new Date(b.nextRunAt!).getTime());

    const nextScheduledRun = upcoming.length > 0 ? {
      id: upcoming[0].id,
      name: upcoming[0].name,
      jobType: upcoming[0].jobType,
      nextRunAt: upcoming[0].nextRunAt!,
    } : null;

    return {
      totalCount,
      activeCount,
      pausedCount,
      failedCount,
      needsAttentionCount,
      completedTodayCount,
      nextScheduledRun,
    };
  }

  /**
   * Returns recommended automation templates
   */
  getAutomationTemplates(): AutomationTemplate[] {
    return [
      {
        id: 'tpl_daily_github_sync',
        name: 'Daily GitHub Sync',
        description: 'Synchronize commit logs, PR health, and issue status every morning.',
        jobType: 'GITHUB_SYNC',
        frequency: 'DAILY',
        time: '09:00',
        timezone: 'UTC',
        recommended: true,
      },
      {
        id: 'tpl_weekly_leetcode_sync',
        name: 'Weekly LeetCode Sync',
        description: 'Update solved problems, topic mastery, and contest rankings every Monday.',
        jobType: 'LEETCODE_SYNC',
        frequency: 'WEEKLY',
        time: '09:00',
        timezone: 'UTC',
        recommended: true,
      },
      {
        id: 'tpl_weekly_codeforces_sync',
        name: 'Weekly Codeforces Sync',
        description: 'Update Codeforces contest ratings, tag weaknesses, and submission history.',
        jobType: 'CODEFORCES_SYNC',
        frequency: 'WEEKLY',
        time: '09:00',
        timezone: 'UTC',
        recommended: false,
      },
      {
        id: 'tpl_weekly_career_report',
        name: 'Weekly Career Report',
        description: 'Generate an executive multi-vector career progress report every Monday.',
        jobType: 'CAREER_REPORT',
        frequency: 'WEEKLY',
        time: '09:00',
        timezone: 'UTC',
        recommended: true,
      },
      {
        id: 'tpl_daily_app_followup_check',
        name: 'Application Follow-up Check',
        description: 'Check active job applications daily for overdue follow-ups and interview dates.',
        jobType: 'APPLICATION_FOLLOWUP_CHECK',
        frequency: 'DAILY',
        time: '09:00',
        timezone: 'UTC',
        recommended: true,
      },
      {
        id: 'tpl_weekly_career_insight',
        name: 'Weekly AI Career Insight',
        description: 'Synthesize career momentum and actionable priority changes automatically.',
        jobType: 'CAREER_INSIGHT',
        frequency: 'WEEKLY',
        time: '09:00',
        timezone: 'UTC',
        recommended: false,
      },
    ];
  }

  /**
   * Updates an existing schedule
   */
  async updateSchedule(userId: string, scheduleId: string, input: UpdateScheduleInput): Promise<ScheduledJob> {
    const job = await this.getScheduleById(userId, scheduleId);

    const frequency = (input.frequency || job.frequency || 'DAILY').toUpperCase();
    const timezone = isValidTimezone(input.timezone || job.timezone) ? (input.timezone || job.timezone) : 'UTC';

    if (frequency === 'CUSTOM_CRON' && input.schedule) {
      if (!validateCronExpression(input.schedule)) {
        throw new BadRequestError('Invalid cron expressionsyntax');
      }
    }

    const scheduleStr = input.schedule !== undefined ? (input.schedule || frequency) : job.schedule;
    const timeStr = input.time !== undefined ? (input.time || '09:00') : job.time;

    const nextRunAt = calculateNextRunAt({
      frequency,
      schedule: scheduleStr,
      time: timeStr,
      timezone,
    });

    const updated = await this.repository.update(scheduleId, {
      ...(input.name && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description }),
      frequency,
      schedule: scheduleStr,
      time: timeStr,
      timezone,
      resourceId: input.resourceId !== undefined ? input.resourceId : job.resourceId,
      nextRunAt: nextRunAt ? nextRunAt.toISOString() : null,
      ...(job.status === 'NEEDS_ATTENTION' && { status: 'ACTIVE', consecutiveFailures: 0 }),
    });

    scheduleEventEmitter.emit('schedule:updated', {
      scheduleId,
      userId,
    });

    return updated;
  }

  /**
   * Enables a schedule
   */
  async enableSchedule(userId: string, scheduleId: string): Promise<ScheduledJob> {
    const job = await this.getScheduleById(userId, scheduleId);

    const nextRunAt = calculateNextRunAt({
      frequency: job.frequency,
      schedule: job.schedule,
      time: job.time,
      timezone: job.timezone,
    });

    const updated = await this.repository.update(scheduleId, {
      enabled: true,
      status: 'ACTIVE',
      consecutiveFailures: 0,
      nextRunAt: nextRunAt ? nextRunAt.toISOString() : null,
    });

    scheduleEventEmitter.emit('schedule:updated', { scheduleId, userId, action: 'enabled' });
    return updated;
  }

  /**
   * Disables/Pauses a schedule
   */
  async disableSchedule(userId: string, scheduleId: string): Promise<ScheduledJob> {
    const job = await this.getScheduleById(userId, scheduleId);

    const updated = await this.repository.update(scheduleId, {
      enabled: false,
      status: 'PAUSED',
    });

    scheduleEventEmitter.emit('schedule:disabled', { scheduleId, userId });
    return updated;
  }

  /**
   * Deletes a schedule
   */
  async deleteSchedule(userId: string, scheduleId: string): Promise<boolean> {
    await this.getScheduleById(userId, scheduleId);
    const deleted = await this.repository.delete(scheduleId);
    if (deleted) {
      scheduleEventEmitter.emit('schedule:updated', { scheduleId, userId, action: 'deleted' });
    }
    return deleted;
  }

  /**
   * Retrieves execution history for a schedule
   */
  async getExecutions(userId: string, scheduleId: string): Promise<ScheduledJobExecution[]> {
    await this.getScheduleById(userId, scheduleId);
    return this.repository.findExecutionsByJobId(scheduleId);
  }

  /**
   * Immediately triggers a single run of a schedule without altering future scheduled runs
   */
  async runNow(userId: string, scheduleId: string): Promise<ScheduledJobExecution> {
    const job = await this.getScheduleById(userId, scheduleId);

    logger?.system?.info?.(`[SchedulerService] Manual Run Now triggered for schedule ${scheduleId}`);

    // Create immediate execution
    const execution = await this.repository.createExecution({
      scheduledJobId: job.id,
      userId: job.userId,
      scheduledOccurrence: new Date(),
      status: 'QUEUED',
    });

    // Execute asynchronously (do NOT await background completion before returning response)
    this.executeScheduleJob(job, execution, true).catch((err) => {
      logger?.system?.error?.(`[SchedulerService] Run now execution failed: ${err.message}`);
    });

    return execution;
  }

  /**
   * Core scheduler evaluation loop to process due jobs
   */
  async processDueSchedules(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      const dueJobs = await this.repository.findDueJobs();
      if (dueJobs.length === 0) {
        this.isProcessing = false;
        return 0;
      }

      logger?.system?.info?.(`[SchedulerService] Found ${dueJobs.length} due scheduled jobs`);

      for (const job of dueJobs) {
        // Idempotency / Duplicate prevention check
        const activeExec = await this.repository.findActiveExecutionForJob(job.id);
        if (activeExec) {
          logger?.system?.warn?.(`[SchedulerService] Job ${job.id} is already running. Skipping execution.`);
          
          await this.repository.createExecution({
            scheduledJobId: job.id,
            userId: job.userId,
            scheduledOccurrence: new Date(),
            status: 'SKIPPED',
          });

          // Advance nextRunAt so it doesn't loop infinitely
          const nextRunAt = calculateNextRunAt({
            frequency: job.frequency,
            schedule: job.schedule,
            time: job.time,
            timezone: job.timezone,
            fromDate: new Date(),
          });

          await this.repository.update(job.id, { nextRunAt: nextRunAt ? nextRunAt.toISOString() : null });
          scheduleEventEmitter.emit('schedule:skipped', {
            userId: job.userId,
            scheduleId: job.id,
            reason: 'SKIPPED_ALREADY_RUNNING',
          });
          continue;
        }

        const scheduledOccurrence = job.nextRunAt ? new Date(job.nextRunAt) : new Date();
        const nextRunAt = calculateNextRunAt({
          frequency: job.frequency,
          schedule: job.schedule,
          time: job.time,
          timezone: job.timezone,
          fromDate: new Date(),
        });

        // Update schedule state
        await this.repository.update(job.id, {
          lastRunAt: new Date().toISOString(),
          nextRunAt: nextRunAt ? nextRunAt.toISOString() : null,
        });

        // Create execution
        const execution = await this.repository.createExecution({
          scheduledJobId: job.id,
          userId: job.userId,
          scheduledOccurrence,
          status: 'QUEUED',
        });

        scheduleEventEmitter.emit('schedule:started', {
          userId: job.userId,
          scheduleId: job.id,
          executionId: execution.id,
        });

        // Execute task
        this.executeScheduleJob(job, execution, false).catch((err) => {
          logger?.system?.error?.(`[SchedulerService] Execution ${execution.id} error: ${err.message}`);
        });
      }

      return dueJobs.length;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Dispatches and handles job execution for different job types
   */
  private async executeScheduleJob(
    job: ScheduledJob,
    execution: ScheduledJobExecution,
    isManualRun: boolean
  ): Promise<void> {
    const startTime = Date.now();
    await this.repository.updateExecution(execution.id, { status: 'RUNNING' });

    try {
      let taskId: string | undefined = undefined;

      switch (job.jobType.toUpperCase()) {
        case 'GITHUB_SYNC': {
          const task = await (this.taskService as any).createTask({
            userId: job.userId,
            repositoryId: job.resourceId || 'repo_01',
            taskType: 'REPOSITORY_SYNC' as any,
            priority: 'MEDIUM' as any,
          });
          taskId = task.id;
          break;
        }

        case 'LEETCODE_SYNC': {
          const task = await (this.taskService as any).createTask({
            userId: job.userId,
            taskType: 'LEETCODE_SYNC' as any,
            priority: 'MEDIUM' as any,
          });
          taskId = task.id;
          break;
        }

        case 'CODEFORCES_SYNC': {
          const task = await (this.taskService as any).createTask({
            userId: job.userId,
            taskType: 'CODEFORCES_SYNC' as any,
            priority: 'MEDIUM' as any,
          });
          taskId = task.id;
          break;
        }

        case 'PORTFOLIO_REFRESH': {
          const task = await (this.taskService as any).createTask({
            userId: job.userId,
            taskType: 'PORTFOLIO_CRAWL' as any,
            priority: 'MEDIUM' as any,
          });
          taskId = task.id;
          break;
        }

        case 'RESUME_ANALYSIS': {
          const task = await (this.taskService as any).createTask({
            userId: job.userId,
            taskType: 'RESUME_ANALYSIS' as any,
            priority: 'MEDIUM' as any,
          });
          taskId = task.id;
          break;
        }

        case 'PROFILE_REFRESH': {
          const task = await (this.taskService as any).createTask({
            userId: job.userId,
            taskType: 'CROSS_PLATFORM_VERIFICATION' as any,
            priority: 'MEDIUM' as any,
          });
          taskId = task.id;
          break;
        }

        case 'JOB_READINESS_REFRESH': {
          const task = await (this.taskService as any).createTask({
            userId: job.userId,
            taskType: 'JOB_READINESS_ANALYSIS' as any,
            priority: 'MEDIUM' as any,
          });
          taskId = task.id;
          break;
        }

        case 'CAREER_REPORT': {
          await this.reportService.generateReport({
            userId: job.userId,
            type: 'CAREER',
            title: `Scheduled Weekly Career Report (${new Date().toLocaleDateString()})`,
          });
          break;
        }

        case 'APPLICATION_FOLLOWUP_CHECK': {
          const stats = await this.appService.getStats(job.userId);
          logger?.system?.info?.(
            `[SchedulerService] Application follow-up check for ${job.userId}: ${stats.needsAction} applications need action`
          );
          break;
        }

        case 'CAREER_INSIGHT': {
          const overview = await this.dashboardService.getOverview(job.userId);
          logger?.system?.info?.(
            `[SchedulerService] Automated Career Insight generated for user ${job.userId}. Health Score: ${overview.scorecard.jobReadiness?.score ?? 85}`
          );
          break;
        }

        default: {
          logger?.system?.info?.(`[SchedulerService] Executed generic schedule task for type: ${job.jobType}`);
        }
      }

      const durationMs = Date.now() - startTime;

      await this.repository.updateExecution(execution.id, {
        status: 'COMPLETED',
        taskId: taskId || null,
        completedAt: new Date().toISOString(),
        durationMs,
      });

      await this.repository.update(job.id, {
        lastStatus: 'COMPLETED',
        lastError: null,
        consecutiveFailures: 0,
        ...(job.status === 'NEEDS_ATTENTION' && { status: 'ACTIVE' }),
      });

      scheduleEventEmitter.emit('schedule:completed', {
        userId: job.userId,
        scheduleId: job.id,
        executionId: execution.id,
        durationMs,
      });
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMessage = err.message || 'Execution failed';

      logger?.system?.error?.(`[SchedulerService] Schedule job execution failed: ${errorMessage}`);

      await this.repository.updateExecution(execution.id, {
        status: 'FAILED',
        error: errorMessage,
        completedAt: new Date().toISOString(),
        durationMs,
      });

      const newFailures = (job.consecutiveFailures || 0) + 1;
      const newStatus = newFailures >= 3 ? 'NEEDS_ATTENTION' : job.status;

      await this.repository.update(job.id, {
        lastStatus: 'FAILED',
        lastError: errorMessage,
        consecutiveFailures: newFailures,
        status: newStatus,
      });

      scheduleEventEmitter.emit('schedule:failed', {
        userId: job.userId,
        scheduleId: job.id,
        executionId: execution.id,
        error: errorMessage,
      });
    }
  }

  /**
   * Recovers stale incomplete executions on server startup
   */
  private async recoverIncompleteExecutions(): Promise<void> {
    try {
      const dueJobs = await this.repository.findDueJobs();
      for (const job of dueJobs) {
        const activeExec = await this.repository.findActiveExecutionForJob(job.id);
        if (activeExec) {
          logger?.system?.warn?.(`[SchedulerService] Cleaning up stale active execution ${activeExec.id}`);
          await this.repository.updateExecution(activeExec.id, {
            status: 'CANCELLED',
            error: 'Server restarted during execution',
            completedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      logger?.system?.warn?.(`[SchedulerService] Recovery error: ${err.message}`);
    }
  }
}

export const schedulerService = new SchedulerService();
