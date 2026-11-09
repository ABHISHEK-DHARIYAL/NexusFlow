import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { leetCodeApiClient, LeetCodeApiClient } from '../integrations/leetcode/LeetCodeApiClient';
import { leetCodeAnalysisEngine, LeetCodeAnalysisEngine } from './LeetCodeAnalysisEngine';
import { leetCodeAiService, LeetCodeAiService } from './LeetCodeAiService';
import { leetCodeRepository, LeetCodeRepository } from '../repositories/LeetCodeRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskSyncService } from './TaskSyncService';
import { leetCodeEventEmitter } from './LeetCodeEventEmitter';
import { logger } from '../logger';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class LeetCodeService {
  constructor(
    private repository: LeetCodeRepository = leetCodeRepository,
    private apiClient: LeetCodeApiClient = leetCodeApiClient,
    private engine: LeetCodeAnalysisEngine = leetCodeAnalysisEngine,
    private aiService: LeetCodeAiService = leetCodeAiService,
    private taskRepository: TaskRepository = new TaskRepository(),
    private taskSyncService: TaskSyncService = new TaskSyncService()
  ) {}

  public async connectProfile(userId: string, username: string) {
    if (!username || typeof username !== 'string') {
      throw new BadRequestError('LeetCode username is required.');
    }

    const cleanUsername = username.trim();
    if (!this.apiClient.validateUsername(cleanUsername)) {
      throw new BadRequestError(`Invalid LeetCode username format: '${username}'. Must be 3-30 alphanumeric characters, underscores or hyphens.`);
    }

    // Check for active duplicate task (Idempotency)
    const activeTasks = await this.taskRepository.findAll({
      userId,
      limit: 10,
    });

    const pendingTask = activeTasks.tasks.find(
      (t) =>
        (t.taskType === TaskType.LEETCODE_SYNC || t.taskType === TaskType.LEETCODE_ANALYSIS) &&
        (t.status === TaskStatus.QUEUED || t.status === TaskStatus.RUNNING)
    );

    if (pendingTask) {
      logger.ai.info(`LeetCode sync task already active for userId ${userId} (TaskId: ${pendingTask.id}). Reusing existing task.`);
      const existingProfile = await this.repository.findProfileByUserId(userId);
      return { profile: existingProfile, task: pendingTask, isExisting: true };
    }

    // Initial fetch to populate profile record
    const rawData = await this.apiClient.fetchUserData(cleanUsername);
    const metrics = this.engine.computeDeterministicMetrics(rawData.profile, rawData.contests, rawData.topicStats);

    // Upsert Profile
    const profile = await this.repository.upsertProfile(userId, {
      username: cleanUsername,
      profileUrl: rawData.profile.profileUrl,
      realName: rawData.profile.realName,
      ranking: rawData.profile.ranking,
      reputation: rawData.profile.reputation,
      totalSolved: metrics.totalSolved,
      easySolved: metrics.easySolved,
      mediumSolved: metrics.mediumSolved,
      hardSolved: metrics.hardSolved,
      acceptanceRate: rawData.profile.acceptanceRate,
      streak: metrics.streak,
      dsaScore: metrics.dsaScore,
      contestRating: metrics.contestRating,
      maxRating: metrics.maxRating,
      globalRanking: metrics.globalRanking,
    });

    // Save Contests & Topic Stats
    await this.repository.saveContests(
      profile.id,
      rawData.contests.map((c) => ({
        contestName: c.contestName,
        contestDate: new Date(c.contestDate),
        rating: c.rating,
        ranking: c.ranking,
        problemsSolved: c.problemsSolved,
        totalProblems: c.totalProblems,
        score: c.score,
        ratingChange: c.ratingChange,
      }))
    );

    await this.repository.saveTopicStats(
      profile.id,
      rawData.topicStats.map((t) => ({
        topicName: t.topicName,
        solvedCount: t.solvedCount,
        easyCount: t.easyCount,
        mediumCount: t.mediumCount,
        hardCount: t.hardCount,
        strengthLevel: this.engine.classifyTopicStrength(t.solvedCount, t.easyCount, t.mediumCount, t.hardCount),
      }))
    );

    // Create Sync & Analysis Task
    const task = await this.taskRepository.create({
      taskType: TaskType.LEETCODE_ANALYSIS,
      priority: TaskPriority.HIGH,
      status: TaskStatus.QUEUED,
      progress: 10,
      user: { connect: { id: userId } },
    });

    // Dispatch to Java Worker
    this.taskSyncService.dispatchToWorker(task).catch((err) => {
      logger.worker.warn(`Java worker dispatch warning for LeetCode task ${task.id}: ${err.message}`);
    });

    // Execute background analysis
    this.executeBackgroundAnalysis(userId, profile.id, task.id, cleanUsername, rawData, metrics).catch((err) => {
      logger.ai.error(`Background LeetCode analysis execution error for task ${task.id}: ${err.message}`);
    });

    return { profile, task, isExisting: false };
  }

  public async syncData(userId: string) {
    const existing = await this.repository.findProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError('No LeetCode profile found for this user. Please connect a profile first.');
    }
    return this.connectProfile(userId, existing.username);
  }

  private async executeBackgroundAnalysis(
    userId: string,
    profileId: string,
    taskId: string,
    username: string,
    rawData: any,
    metrics: any
  ) {
    try {
      leetCodeEventEmitter.emit('leetcode:sync_started', { userId, username, taskId, timestamp: new Date() });
      await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 40);
      leetCodeEventEmitter.emit('leetcode:sync_progress', { userId, taskId, progress: 40 });

      // Generate AI Insights from Gemini
      const aiInsights = await this.aiService.generateInsights(username, metrics);

      await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 85);
      leetCodeEventEmitter.emit('leetcode:sync_progress', { userId, taskId, progress: 85 });

      // Save Analysis in Database
      const analysisRecord = await this.repository.saveAnalysis(profileId, taskId, {
        dsaScore: metrics.dsaScore,
        summary: aiInsights.summary,
        strengths: aiInsights.strengths,
        weaknesses: aiInsights.weaknesses,
        recommendations: aiInsights.recommendations,
        learningRoadmap: aiInsights.learningRoadmap,
        contestStrategy: aiInsights.contestStrategy,
      });

      await this.taskRepository.updateStatus(taskId, TaskStatus.COMPLETED, 100);
      leetCodeEventEmitter.emit('leetcode:sync_completed', { userId, taskId, progress: 100 });
      leetCodeEventEmitter.emit('leetcode:analysis_completed', { userId, profileId, username, analysisId: analysisRecord.id });
      logger.ai.info(`LeetCode background analysis completed for user ${username} (TaskId: ${taskId}, AnalysisId: ${analysisRecord.id})`);
    } catch (err: any) {
      leetCodeEventEmitter.emit('leetcode:sync_failed', { userId, taskId, error: err.message });
      logger.ai.error(`LeetCode background analysis failed for taskId ${taskId}: ${err.message}`);
      await this.taskRepository.updateStatus(taskId, TaskStatus.FAILED, undefined, `LeetCode analysis error: ${err.message}`);
    }
  }

  public async getProfile(userId: string) {
    const profile = await this.repository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('LeetCode profile not found for authenticated user.');
    }

    const latestAnalysis = profile.analyses?.[0] || null;

    // Convert contests into raw objects for metric computation
    const rawContests = profile.contests.map((c) => ({
      contestName: c.contestName,
      contestDate: c.contestDate,
      rating: c.rating,
      ranking: c.ranking,
      problemsSolved: c.problemsSolved,
      totalProblems: c.totalProblems,
      score: c.score,
      ratingChange: c.ratingChange,
    }));

    const rawTopics = profile.topicStats.map((t) => ({
      topicName: t.topicName,
      solvedCount: t.solvedCount,
      easyCount: t.easyCount,
      mediumCount: t.mediumCount,
      hardCount: t.hardCount,
    }));

    const metrics = this.engine.computeDeterministicMetrics(
      {
        username: profile.username,
        profileUrl: profile.profileUrl,
        realName: profile.realName || undefined,
        ranking: profile.ranking || undefined,
        reputation: profile.reputation || undefined,
        totalSolved: profile.totalSolved,
        easySolved: profile.easySolved,
        mediumSolved: profile.mediumSolved,
        hardSolved: profile.hardSolved,
        acceptanceRate: profile.acceptanceRate,
        streak: profile.streak,
      },
      rawContests,
      rawTopics
    );

    return {
      profile,
      metrics,
      latestAnalysis,
    };
  }

  public async getStatistics(userId: string) {
    const data = await this.getProfile(userId);
    return {
      profile: data.profile,
      topicStats: data.profile.topicStats,
      metrics: data.metrics,
    };
  }

  public async getContests(userId: string) {
    const profile = await this.repository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('LeetCode profile not found for authenticated user.');
    }

    const rawContests = profile.contests.map((c) => ({
      contestName: c.contestName,
      contestDate: c.contestDate,
      rating: c.rating,
      ranking: c.ranking,
      problemsSolved: c.problemsSolved,
      totalProblems: c.totalProblems,
      score: c.score,
      ratingChange: c.ratingChange,
    }));

    const metrics = this.engine.computeDeterministicMetrics(
      {
        username: profile.username,
        profileUrl: profile.profileUrl,
        totalSolved: profile.totalSolved,
        easySolved: profile.easySolved,
        mediumSolved: profile.mediumSolved,
        hardSolved: profile.hardSolved,
        acceptanceRate: profile.acceptanceRate,
        streak: profile.streak,
      },
      rawContests,
      []
    );

    return {
      contests: profile.contests,
      contestRating: metrics.contestRating,
      maxRating: metrics.maxRating,
      ratingTrend: metrics.ratingTrend,
      globalRanking: profile.globalRanking,
    };
  }

  public async getAnalysis(userId: string) {
    const profile = await this.repository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('LeetCode profile not found for authenticated user.');
    }

    const analysis = await this.repository.findLatestAnalysisByProfileId(profile.id);
    if (!analysis) {
      throw new NotFoundError('No AI analysis report found for this LeetCode profile.');
    }

    return analysis;
  }
}

export const leetCodeService = new LeetCodeService();
