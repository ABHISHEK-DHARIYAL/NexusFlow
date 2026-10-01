import { EventEmitter } from 'events';
import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { CodeforcesApiClient } from '../integrations/codeforces/CodeforcesApiClient';
import { CodeforcesAnalysisEngine } from './CodeforcesAnalysisEngine';
import { CodeforcesAiService } from './CodeforcesAiService';
import { CodeforcesRepository } from '../repositories/CodeforcesRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskSyncService } from './TaskSyncService';
import { logger } from '../logger';
import { BadRequestError, NotFoundError } from '../utils/errors';

export const codeforcesEventEmitter = new EventEmitter();

export class CodeforcesService {
  constructor(
    private repository = new CodeforcesRepository(),
    private apiClient = new CodeforcesApiClient(),
    private engine = new CodeforcesAnalysisEngine(),
    private aiService = new CodeforcesAiService(),
    private taskRepository = new TaskRepository(),
    private taskSyncService = new TaskSyncService()
  ) {}

  public async connectProfile(userId: string, handle: string) {
    if (!handle || typeof handle !== 'string') {
      throw new BadRequestError('Codeforces handle is required.');
    }

    const cleanHandle = handle.trim();
    this.apiClient.validateHandle(cleanHandle);

    // Idempotency check: check if a sync or analysis task is already RUNNING or QUEUED for this user
    const activeTasks = await this.taskRepository.findAll({
      userId,
      limit: 10
    });

    const pendingTask = activeTasks.tasks.find(
      (t) =>
        (t.taskType === TaskType.CODEFORCES_SYNC || t.taskType === TaskType.CODEFORCES_ANALYSIS) &&
        (t.status === TaskStatus.QUEUED || t.status === TaskStatus.RUNNING)
    );

    if (pendingTask) {
      const existingProfile = await this.repository.findProfileByUserId(userId);
      if (existingProfile) {
        return { profile: existingProfile, task: pendingTask, isExisting: true };
      }
    }

    codeforcesEventEmitter.emit('codeforces:sync_started', { userId, handle: cleanHandle, timestamp: new Date() });

    // Fetch Codeforces API data
    const rawData = await this.apiClient.fetchAllData(cleanHandle);

    // Compute Deterministic Metrics
    const metrics = this.engine.computeMetrics(rawData.user, rawData.ratingHistory, rawData.submissions);

    // Persist Profile
    const profile = await this.repository.upsertProfile(userId, {
      handle: rawData.user.handle,
      profileUrl: `https://codeforces.com/profile/${rawData.user.handle}`,
      rating: rawData.user.rating || null,
      maxRating: rawData.user.maxRating || null,
      rank: rawData.user.rank || null,
      maxRank: rawData.user.maxRank || null,
      contribution: rawData.user.contribution || 0,
      friendOfCount: rawData.user.friendOfCount || 0,
      titlePhoto: rawData.user.titlePhoto || null,
      organization: rawData.user.organization || null,
      cpScore: metrics.cpScore
    });

    // Replace Contests
    await this.repository.replaceContests(
      profile.id,
      rawData.ratingHistory.map((rh) => ({
        contestId: rh.contestId,
        contestName: rh.contestName,
        contestDate: new Date(rh.ratingUpdateTimeSeconds * 1000),
        rank: rh.rank,
        ratingBefore: rh.oldRating,
        ratingAfter: rh.newRating,
        ratingChange: rh.newRating - rh.oldRating,
        problemsSolved: 0
      }))
    );

    // Replace Tag Stats
    const tagStatsToSave: Array<{
      tagName: string;
      solvedCount: number;
      avgDifficulty: number;
      strengthLevel: 'STRONG' | 'MODERATE' | 'WEAK';
    }> = [];

    metrics.strongTags.forEach((tag) => {
      tagStatsToSave.push({ tagName: tag, solvedCount: 15, avgDifficulty: 1500, strengthLevel: 'STRONG' });
    });
    metrics.weakTags.forEach((tag) => {
      tagStatsToSave.push({ tagName: tag, solvedCount: 3, avgDifficulty: 1000, strengthLevel: 'WEAK' });
    });

    await this.repository.replaceTagStats(profile.id, tagStatsToSave);

    // Create Sync & Analysis Task
    const task = await this.taskRepository.create({
      taskType: TaskType.CODEFORCES_ANALYSIS,
      priority: TaskPriority.HIGH,
      status: TaskStatus.QUEUED,
      progress: 10,
      user: { connect: { id: userId } }
    });

    // Dispatch to Java Worker if available
    this.taskSyncService.dispatchToWorker(task).catch((err) => {
      logger.worker.warn(`Java worker dispatch warning for Codeforces task ${task.id}: ${err.message}`);
    });

    // Execute background AI analysis
    this.executeBackgroundAnalysis(userId, profile.id, task.id, cleanHandle, metrics).catch((err) => {
      logger.ai.error(`Background Codeforces analysis error for task ${task.id}: ${err.message}`);
      codeforcesEventEmitter.emit('codeforces:sync_failed', { userId, taskId: task.id, error: err.message });
    });

    return { profile, task, isExisting: false };
  }

  public async syncData(userId: string) {
    const existing = await this.repository.findProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError('No Codeforces profile found for this user. Please connect a profile first.');
    }
    return this.connectProfile(userId, existing.handle);
  }

  public async getProfile(userId: string) {
    const profile = await this.repository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Codeforces profile not found.');
    }
    return profile;
  }

  public async getStatistics(userId: string) {
    const profile = await this.repository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Codeforces profile not found.');
    }

    const rawData = await this.apiClient.fetchAllData(profile.handle);
    const metrics = this.engine.computeMetrics(rawData.user, rawData.ratingHistory, rawData.submissions);

    return {
      profile,
      metrics
    };
  }

  public async getContests(userId: string) {
    const profile = await this.repository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Codeforces profile not found.');
    }
    return profile.contests || [];
  }

  public async getAnalysis(userId: string) {
    const profile = await this.repository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Codeforces profile not found.');
    }

    const analysis = await this.repository.getLatestAnalysis(profile.id);
    if (!analysis) {
      throw new NotFoundError('No analysis report generated yet for this Codeforces profile.');
    }
    return analysis;
  }

  private async executeBackgroundAnalysis(
    userId: string,
    profileId: string,
    taskId: string,
    handle: string,
    metrics: any
  ) {
    try {
      await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 50);
      codeforcesEventEmitter.emit('codeforces:sync_progress', { userId, taskId, progress: 50 });

      // Generate AI Insights with Gemini
      const report = await this.aiService.generateAnalysisReport(handle, metrics);

      // Save Analysis
      await this.repository.createAnalysis(profileId, taskId, {
        cpScore: metrics.cpScore,
        summary: report.summary,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        recommendations: report.recommendations,
        learningRoadmap: report.learningRoadmap,
        contestStrategy: report.contestStrategy
      });

      await this.taskRepository.updateStatus(taskId, TaskStatus.COMPLETED, 100);

      codeforcesEventEmitter.emit('codeforces:sync_completed', { userId, taskId, progress: 100 });
      codeforcesEventEmitter.emit('codeforces:analysis_completed', { userId, profileId, handle });
    } catch (err: any) {
      logger.ai.error(`executeBackgroundAnalysis failed for task ${taskId}: ${err.message}`);
      await this.taskRepository.updateStatus(taskId, TaskStatus.FAILED, undefined, err.message);
      codeforcesEventEmitter.emit('codeforces:sync_failed', { userId, taskId, error: err.message });
    }
  }
}

export const codeforcesService = new CodeforcesService();
