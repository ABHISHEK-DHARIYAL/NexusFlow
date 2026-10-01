import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';
import { assertResourceOwnership } from '../utils/ownership';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { CompanyPreparationReport, JobMatchReport, JobReadinessReport } from '../../types';
import { companyPreparationEngine } from '../integrations/company/CompanyPreparationEngine';
import { companyPreparationGeminiService } from '../integrations/company/CompanyPreparationGeminiService';
import { jobMatchingService } from './JobMatchingService';
import { jobReadinessService } from './JobReadinessService';
import { jobEventEmitter } from './JobEventEmitter';

export class CompanyPreparationService {
  /**
   * Generates or recalculates a Company-Specific Preparation Plan.
   */
  public async generateCompanyPreparation(
    userId: string,
    jobId: string,
    authUser?: any,
    customCompanyInput?: any
  ): Promise<CompanyPreparationReport> {
    const job = await prisma.jobDescription.findUnique({
      where: { id: jobId },
      include: {
        matches: { orderBy: { createdAt: 'desc' }, take: 1 },
        readinesses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!job) {
      throw new NotFoundError(`Job description with ID ${jobId} not found`);
    }

    assertResourceOwnership(job.userId, authUser || { id: userId, role: 'USER' });

    // 1. Create task record
    const task = await prisma.task.create({
      data: {
        userId,
        taskType: TaskType.COMPANY_PREPARATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.RUNNING,
        progress: 10,
        startedAt: new Date(),
      },
    });

    jobEventEmitter.emit('company_preparation:started', {
      userId,
      jobId,
      taskId: task.id,
      timestamp: new Date(),
    });

    try {
      // 2. Ensure JobMatch exists
      let latestMatch: JobMatchReport;
      if (job.matches && job.matches.length > 0) {
        const m = job.matches[0];
        latestMatch = {
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
        latestMatch = await jobMatchingService.getJobMatchReport(jobId, authUser);
      }

      // 3. Ensure JobReadiness exists
      let latestReadiness: JobReadinessReport;
      if (job.readinesses && job.readinesses.length > 0) {
        const r = job.readinesses[0];
        latestReadiness = {
          id: r.id,
          jobId: r.jobId,
          userId: r.userId,
          taskId: r.taskId || undefined,
          score: r.score,
          level: r.level as any,
          confidence: r.confidence as any,
          interviewReadinessScore: r.interviewReadinessScore,
          dsaRelevance: r.dsaRelevance as any,
          dimensions: r.dimensions as any,
          criticalGaps: r.criticalGaps as any,
          readinessBlockers: r.readinessBlockers as any,
          strongSignals: r.strongSignals as any,
          weakSignals: r.weakSignals as any,
          interviewPrep: r.interviewPrep as any,
          preparationPriorities: r.preparationPriorities as any,
          projectLeverage: r.projectLeverage as any,
          whatIfSimulation: r.whatIfSimulation as any,
          executiveSummary: r.executiveSummary,
          dataFreshness: r.dataFreshness as any,
          createdAt: r.createdAt.toISOString(),
        };
      } else {
        latestReadiness = await jobReadinessService.calculateJobReadiness(userId, jobId, authUser);
      }

      await prisma.task.update({
        where: { id: task.id },
        data: { progress: 30 },
      });

      jobEventEmitter.emit('company_preparation:progress', {
        userId,
        jobId,
        taskId: task.id,
        progress: 30,
        stage: 'PROFILE_EVIDENCE_GATHERING',
      });

      // 4. Gather User Profile Evidence
      const [repos, leetcode, codeforces, portfolio, resume] = await Promise.all([
        prisma.repository.findMany({ where: { userId }, include: { languages: true } }),
        prisma.leetCodeProfile.findUnique({ where: { userId } }),
        prisma.codeforcesProfile.findUnique({ where: { userId } }),
        prisma.portfolio.findUnique({ where: { userId } }),
        prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      ]);

      const userProfile = {
        repositories: repos,
        leetCodeProfile: leetcode,
        codeforcesProfile: codeforces,
        portfolio,
        resume,
      };

      await prisma.task.update({
        where: { id: task.id },
        data: { progress: 50 },
      });

      jobEventEmitter.emit('company_preparation:progress', {
        userId,
        jobId,
        taskId: task.id,
        progress: 50,
        stage: 'DETERMINISTIC_PRIORITY_ANALYSIS',
      });

      // 5. Deterministic Analysis Engine
      const rawReport = companyPreparationEngine.analyze({
        jobId,
        companyName: job.company || 'Target Company',
        jobTitle: job.title || 'Software Engineer',
        rawDescription: job.rawDescription,
        customCompanyInput: {
          website: customCompanyInput?.website || job.sourceUrl || undefined,
          location: job.location || undefined,
          ...customCompanyInput,
        },
        jobMatch: latestMatch,
        jobReadiness: latestReadiness,
        userProfile,
      });

      await prisma.task.update({
        where: { id: task.id },
        data: { progress: 75 },
      });

      jobEventEmitter.emit('company_preparation:progress', {
        userId,
        jobId,
        taskId: task.id,
        progress: 75,
        stage: 'GEMINI_AI_REFINEMENT',
      });

      // 6. Gemini Refinement (with fallback)
      const finalReportWithoutId = await companyPreparationGeminiService.generateRefinement(
        {
          id: '',
          jobId,
          userId,
          taskId: task.id,
          ...rawReport,
          createdAt: new Date().toISOString(),
        },
        job.rawDescription
      );

      // 7. Store CompanyPreparation in DB
      const dbRecord = await prisma.companyPreparation.create({
        data: {
          jobId,
          userId,
          taskId: task.id,
          companyName: finalReportWithoutId.companyName,
          jobTitle: finalReportWithoutId.jobTitle,
          jobMatchScore: finalReportWithoutId.jobMatchScore,
          jobReadinessScore: finalReportWithoutId.jobReadinessScore,
          preparationCoverageScore: finalReportWithoutId.preparationCoverageScore,
          topPriorityTopic: finalReportWithoutId.topPriorityTopic,
          companyProfile: finalReportWithoutId.companyProfile as any,
          coverageFormulaBreakdown: finalReportWithoutId.coverageFormulaBreakdown as any,
          priorityEngineFormulaDoc: finalReportWithoutId.priorityEngineFormulaDoc,
          priorityItems: finalReportWithoutId.priorityItems as any,
          dsaPreparation: finalReportWithoutId.dsaPreparation as any,
          technicalAndSystemDesignPrep: finalReportWithoutId.technicalAndSystemDesignPrep as any,
          projectPreparations: finalReportWithoutId.projectPreparations as any,
          behavioralPreparations: finalReportWithoutId.behavioralPreparations as any,
          companyResearch: finalReportWithoutId.companyResearch as any,
          resumePositioning: finalReportWithoutId.resumePositioning as any,
          profileGaps: finalReportWithoutId.profileGaps as any,
          skillTransfers: finalReportWithoutId.skillTransfers as any,
          roadmap: finalReportWithoutId.roadmap as any,
          executiveSummary: finalReportWithoutId.executiveSummary,
          noFabricationDisclaimer: finalReportWithoutId.noFabricationDisclaimer,
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

      const fullReport: CompanyPreparationReport = {
        id: dbRecord.id,
        jobId: dbRecord.jobId,
        userId: dbRecord.userId,
        taskId: task.id,
        companyName: dbRecord.companyName,
        jobTitle: dbRecord.jobTitle,
        jobMatchScore: dbRecord.jobMatchScore,
        jobReadinessScore: dbRecord.jobReadinessScore,
        preparationCoverageScore: dbRecord.preparationCoverageScore,
        topPriorityTopic: dbRecord.topPriorityTopic,
        companyProfile: dbRecord.companyProfile as any,
        coverageFormulaBreakdown: dbRecord.coverageFormulaBreakdown as any,
        priorityEngineFormulaDoc: dbRecord.priorityEngineFormulaDoc,
        priorityItems: dbRecord.priorityItems as any,
        dsaPreparation: dbRecord.dsaPreparation as any,
        technicalAndSystemDesignPrep: dbRecord.technicalAndSystemDesignPrep as any,
        projectPreparations: dbRecord.projectPreparations as any,
        behavioralPreparations: dbRecord.behavioralPreparations as any,
        companyResearch: dbRecord.companyResearch as any,
        resumePositioning: dbRecord.resumePositioning as any,
        profileGaps: dbRecord.profileGaps as any,
        skillTransfers: dbRecord.skillTransfers as any,
        roadmap: dbRecord.roadmap as any,
        executiveSummary: dbRecord.executiveSummary,
        noFabricationDisclaimer: dbRecord.noFabricationDisclaimer,
        createdAt: dbRecord.createdAt.toISOString(),
        updatedAt: dbRecord.updatedAt.toISOString(),
      };

      jobEventEmitter.emit('company_preparation:completed', {
        userId,
        jobId,
        taskId: task.id,
        preparationId: fullReport.id,
        preparationCoverageScore: fullReport.preparationCoverageScore,
        topPriorityTopic: fullReport.topPriorityTopic,
        timestamp: new Date(),
      });

      return fullReport;
    } catch (err: any) {
      logger.system.error(`generateCompanyPreparation failed: ${err.message}`);

      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.FAILED,
          failureReason: err.message,
        },
      });

      jobEventEmitter.emit('company_preparation:failed', {
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
   * Retrieves latest Company Preparation report for a job.
   */
  public async getCompanyPreparation(
    userId: string,
    jobId: string,
    authUser?: any
  ): Promise<CompanyPreparationReport> {
    const job = await prisma.jobDescription.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError(`Job description with ID ${jobId} not found`);
    }

    assertResourceOwnership(job.userId, authUser || { id: userId, role: 'USER' });

    const prep = await prisma.companyPreparation.findFirst({
      where: { jobId, userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!prep) {
      return this.generateCompanyPreparation(userId, jobId, authUser);
    }

    return {
      id: prep.id,
      jobId: prep.jobId,
      userId: prep.userId,
      taskId: prep.taskId || undefined,
      companyName: prep.companyName,
      jobTitle: prep.jobTitle,
      jobMatchScore: prep.jobMatchScore,
      jobReadinessScore: prep.jobReadinessScore,
      preparationCoverageScore: prep.preparationCoverageScore,
      topPriorityTopic: prep.topPriorityTopic,
      companyProfile: prep.companyProfile as any,
      coverageFormulaBreakdown: prep.coverageFormulaBreakdown as any,
      priorityEngineFormulaDoc: prep.priorityEngineFormulaDoc,
      priorityItems: prep.priorityItems as any,
      dsaPreparation: prep.dsaPreparation as any,
      technicalAndSystemDesignPrep: prep.technicalAndSystemDesignPrep as any,
      projectPreparations: prep.projectPreparations as any,
      behavioralPreparations: prep.behavioralPreparations as any,
      companyResearch: prep.companyResearch as any,
      resumePositioning: prep.resumePositioning as any,
      profileGaps: prep.profileGaps as any,
      skillTransfers: prep.skillTransfers as any,
      roadmap: prep.roadmap as any,
      executiveSummary: prep.executiveSummary,
      noFabricationDisclaimer: prep.noFabricationDisclaimer,
      createdAt: prep.createdAt.toISOString(),
      updatedAt: prep.updatedAt.toISOString(),
    };
  }

  /**
   * Gets topic priorities and preparation breakdown.
   */
  public async getCompanyPreparationTopics(
    userId: string,
    jobId: string,
    authUser?: any
  ) {
    const report = await this.getCompanyPreparation(userId, jobId, authUser);
    return {
      topPriorityTopic: report.topPriorityTopic,
      priorityItems: report.priorityItems,
      dsaPreparation: report.dsaPreparation,
      technicalAndSystemDesignPrep: report.technicalAndSystemDesignPrep,
      profileGaps: report.profileGaps,
      skillTransfers: report.skillTransfers,
    };
  }

  /**
   * Gets preparation roadmap for a job.
   */
  public async getCompanyPreparationRoadmap(
    userId: string,
    jobId: string,
    authUser?: any
  ) {
    const report = await this.getCompanyPreparation(userId, jobId, authUser);
    return {
      roadmap: report.roadmap,
      topPriorityTopic: report.topPriorityTopic,
      preparationCoverageScore: report.preparationCoverageScore,
      coverageFormulaBreakdown: report.coverageFormulaBreakdown,
    };
  }
}

export const companyPreparationService = new CompanyPreparationService();
