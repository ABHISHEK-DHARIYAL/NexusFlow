import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';
import { assertResourceOwnership } from '../utils/ownership';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { JobReadinessReport, JobMatchReport } from '../../types';
import { JobReadinessEngine } from '../integrations/jobs/JobReadinessEngine';
import { jobReadinessGeminiService } from '../integrations/jobs/JobReadinessGeminiService';
import { jobMatchingService } from './JobMatchingService';
import { jobEventEmitter } from './JobEventEmitter';

export class JobReadinessService {
  /**
   * Calculates Job Readiness for a given job description & user profile.
   */
  public async calculateJobReadiness(userId: string, jobId: string, authUser?: any): Promise<JobReadinessReport> {
    const job = await prisma.jobDescription.findUnique({
      where: { id: jobId },
      include: {
        matches: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!job) {
      throw new NotFoundError(`Job description with ID ${jobId} not found`);
    }

    assertResourceOwnership(job.userId, authUser || { id: userId, role: 'USER' });

    // 1. Create analysis task
    const task = await prisma.task.create({
      data: {
        userId,
        taskType: TaskType.JOB_READINESS_ANALYSIS,
        priority: TaskPriority.HIGH,
        status: TaskStatus.RUNNING,
        progress: 10,
        startedAt: new Date(),
      },
    });

    jobEventEmitter.emit('job_readiness:started', {
      userId,
      jobId,
      taskId: task.id,
      timestamp: new Date(),
    });

    try {
      // 2. Ensure JobMatch exists
      let latestMatchData: JobMatchReport | null = null;
      if (job.matches && job.matches.length > 0) {
        const m = job.matches[0];
        latestMatchData = {
          id: m.id,
          jobId: m.jobId,
          userId: m.userId,
          taskId: m.taskId || undefined,
          overallMatchScore: m.overallMatchScore,
          matchLabel: (m as any).matchLabel || 'Strong Alignment',
          requiredSkillCoverage: m.requiredSkillCoverage,
          preferredSkillCoverage: m.preferredSkillCoverage,
          projectRelevanceScore: m.projectRelevanceScore,
          experienceMatchStatus: m.experienceMatchStatus as any,
          educationMatchStatus: m.educationMatchStatus as any,
          cpRelevanceStatus: m.cpRelevanceStatus as any,
          summary: m.summary,
          extractedRequirements: m.extractedRequirements as any,
          skillMatches: m.skillMatches as any,
          projectRelevance: m.projectRelevance as any,
          missingSkills: m.missingSkills as any,
          keywordAlignment: m.keywordAlignment as any,
          recommendations: m.recommendations as any,
          interviewPriorities: m.interviewPriorities as any,
          createdAt: m.createdAt.toISOString(),
        };
      } else {
        // Run job match first
        latestMatchData = await jobMatchingService.getJobMatchReport(jobId, authUser);
      }

      await prisma.task.update({
        where: { id: task.id },
        data: { progress: 40 },
      });

      jobEventEmitter.emit('job_readiness:progress', {
        userId,
        jobId,
        taskId: task.id,
        progress: 40,
        stage: 'PROFILE_EVIDENCE_GATHERING',
      });

      // 3. Gather Profile Evidence
      const [repos, leetcode, codeforces, portfolio, resume, crossPlatform] = await Promise.all([
        prisma.repository.findMany({ where: { userId }, include: { languages: true } }),
        prisma.leetCodeProfile.findUnique({ where: { userId } }),
        prisma.codeforcesProfile.findUnique({ where: { userId } }),
        prisma.portfolio.findUnique({ where: { userId }, include: { projects: true } }),
        prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        prisma.crossPlatformVerification.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      ]);

      const profileEvidence = {
        repositories: repos.map((r) => ({
          ...r,
          languages: r.languages.map((l) => ({ name: l.name, bytes: Number(l.bytes) })),
        })),
        leetcodeProfile: leetcode
          ? {
              ...leetcode,
              lastSyncedAt: leetcode.lastSyncedAt.toISOString(),
              createdAt: leetcode.createdAt.toISOString(),
              updatedAt: leetcode.updatedAt.toISOString(),
            }
          : null,
        codeforcesProfile: codeforces
          ? {
              ...codeforces,
              lastSyncedAt: codeforces.lastSyncedAt.toISOString(),
              createdAt: codeforces.createdAt.toISOString(),
              updatedAt: codeforces.updatedAt.toISOString(),
            }
          : null,
        portfolio: portfolio
          ? {
              ...portfolio,
              lastCrawledAt: portfolio.lastCrawledAt?.toISOString(),
              projects: portfolio.projects || [],
            }
          : null,
        resume: resume
          ? {
              ...resume,
              updatedAt: resume.updatedAt.toISOString(),
              workExperience: (resume.workExperience as any[]) || [],
            }
          : null,
        crossPlatformVerification: crossPlatform,
      };

      await prisma.task.update({
        where: { id: task.id },
        data: { progress: 70 },
      });

      jobEventEmitter.emit('job_readiness:progress', {
        userId,
        jobId,
        taskId: task.id,
        progress: 70,
        stage: 'DETERMINISTIC_SCORING',
      });

      // 4. Compute Deterministic Job Readiness
      const readinessEngineResult = JobReadinessEngine.calculateReadiness(latestMatchData, profileEvidence);

      // 5. Generate Gemini Explanation
      const executiveSummary = await jobReadinessGeminiService.generateReadinessExplanation(
        latestMatchData,
        readinessEngineResult
      );

      // 6. Save in database
      const savedReport = await prisma.jobReadiness.create({
        data: {
          jobId,
          userId,
          taskId: task.id,
          score: readinessEngineResult.score,
          level: readinessEngineResult.level,
          confidence: readinessEngineResult.confidence,
          interviewReadinessScore: readinessEngineResult.interviewReadinessScore,
          dsaRelevance: readinessEngineResult.dsaRelevance,
          dimensions: JSON.parse(JSON.stringify(readinessEngineResult.dimensions)),
          criticalGaps: JSON.parse(JSON.stringify(readinessEngineResult.criticalGaps)),
          readinessBlockers: JSON.parse(JSON.stringify(readinessEngineResult.readinessBlockers)),
          strongSignals: JSON.parse(JSON.stringify(readinessEngineResult.strongSignals)),
          weakSignals: JSON.parse(JSON.stringify(readinessEngineResult.weakSignals)),
          interviewPrep: JSON.parse(JSON.stringify(readinessEngineResult.interviewPrep)),
          preparationPriorities: JSON.parse(JSON.stringify(readinessEngineResult.preparationPriorities)),
          projectLeverage: JSON.parse(JSON.stringify(readinessEngineResult.projectLeverage)),
          whatIfSimulation: JSON.parse(JSON.stringify(readinessEngineResult.whatIfSimulation || [])),
          executiveSummary,
          dataFreshness: JSON.parse(JSON.stringify(readinessEngineResult.dataFreshness)),
        },
      });

      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      const fullReport: JobReadinessReport = {
        id: savedReport.id,
        jobId: savedReport.jobId,
        userId: savedReport.userId,
        taskId: savedReport.taskId,
        score: savedReport.score,
        level: savedReport.level as any,
        confidence: savedReport.confidence as any,
        interviewReadinessScore: savedReport.interviewReadinessScore,
        dsaRelevance: savedReport.dsaRelevance as any,
        dimensions: savedReport.dimensions as any,
        criticalGaps: savedReport.criticalGaps as any,
        readinessBlockers: savedReport.readinessBlockers as any,
        strongSignals: savedReport.strongSignals as any,
        weakSignals: savedReport.weakSignals as any,
        interviewPrep: savedReport.interviewPrep as any,
        preparationPriorities: savedReport.preparationPriorities as any,
        projectLeverage: savedReport.projectLeverage as any,
        whatIfSimulation: savedReport.whatIfSimulation as any,
        executiveSummary: savedReport.executiveSummary,
        dataFreshness: savedReport.dataFreshness as any,
        createdAt: savedReport.createdAt.toISOString(),
        updatedAt: savedReport.updatedAt.toISOString(),
      };

      jobEventEmitter.emit('job_readiness:completed', {
        userId,
        jobId,
        readinessId: savedReport.id,
        taskId: task.id,
        score: savedReport.score,
        level: savedReport.level,
        timestamp: new Date(),
      });

      return fullReport;
    } catch (err: any) {
      logger.system.error(`JobReadinessService.calculateJobReadiness failed: ${err.message}`);

      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.FAILED,
          failureReason: err.message,
        },
      });

      jobEventEmitter.emit('job_readiness:failed', {
        userId,
        jobId,
        taskId: task.id,
        error: err.message,
        timestamp: new Date(),
      });

      throw err;
    }
  }

  /**
   * Retrieves the latest Job Readiness report for a job ID.
   */
  public async getLatestReadiness(userId: string, jobId: string, authUser?: any): Promise<JobReadinessReport> {
    const job = await prisma.jobDescription.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError(`Job description with ID ${jobId} not found`);
    }

    assertResourceOwnership(job.userId, authUser || { id: userId, role: 'USER' });

    const report = await prisma.jobReadiness.findFirst({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });

    if (!report) {
      // Compute on demand
      return this.calculateJobReadiness(userId, jobId, authUser);
    }

    return {
      id: report.id,
      jobId: report.jobId,
      userId: report.userId,
      taskId: report.taskId,
      score: report.score,
      level: report.level as any,
      confidence: report.confidence as any,
      interviewReadinessScore: report.interviewReadinessScore,
      dsaRelevance: report.dsaRelevance as any,
      dimensions: report.dimensions as any,
      criticalGaps: report.criticalGaps as any,
      readinessBlockers: report.readinessBlockers as any,
      strongSignals: report.strongSignals as any,
      weakSignals: report.weakSignals as any,
      interviewPrep: report.interviewPrep as any,
      preparationPriorities: report.preparationPriorities as any,
      projectLeverage: report.projectLeverage as any,
      whatIfSimulation: report.whatIfSimulation as any,
      executiveSummary: report.executiveSummary,
      dataFreshness: report.dataFreshness as any,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves critical gaps & blockers for a job.
   */
  public async getReadinessGaps(userId: string, jobId: string, authUser?: any) {
    const report = await this.getLatestReadiness(userId, jobId, authUser);
    return {
      jobId,
      criticalGaps: report.criticalGaps,
      readinessBlockers: report.readinessBlockers,
      weakSignals: report.weakSignals,
    };
  }

  /**
   * Retrieves readiness recommendations & preparation priorities.
   */
  public async getReadinessRecommendations(userId: string, jobId: string, authUser?: any) {
    const report = await this.getLatestReadiness(userId, jobId, authUser);
    return {
      jobId,
      preparationPriorities: report.preparationPriorities,
      projectLeverage: report.projectLeverage,
      interviewPrep: report.interviewPrep,
    };
  }

  /**
   * Executes deterministic what-if scenario simulation.
   */
  public async runWhatIfAnalysis(
    userId: string,
    jobId: string,
    payload?: { scenarioId?: string; customActions?: string[] },
    authUser?: any
  ) {
    const report = await this.getLatestReadiness(userId, jobId, authUser);
    const existingSimulations = report.whatIfSimulation || [];

    if (payload?.scenarioId) {
      const matchedScen = existingSimulations.find((s) => s.scenarioId === payload.scenarioId);
      if (matchedScen) {
        return {
          jobId,
          currentScore: report.score,
          simulatedScenario: matchedScen,
        };
      }
    }

    return {
      jobId,
      currentScore: report.score,
      allScenarios: existingSimulations,
    };
  }
}

export const jobReadinessService = new JobReadinessService();
