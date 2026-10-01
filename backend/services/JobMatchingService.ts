import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';
import { assertResourceOwnership } from '../utils/ownership';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { JobDescriptionInput, JobMatchReport } from '../../types';
import { JobRequirementExtractor } from '../integrations/jobs/JobRequirementExtractor';
import { JobMatchingEngine, UserProfileEvidenceSet } from '../integrations/jobs/JobMatchingEngine';
import { jobExplanationService } from './JobExplanationService';
import { jobEventEmitter } from './JobEventEmitter';

export class JobMatchingService {
  public async createJobDescription(userId: string, input: JobDescriptionInput, authUser?: any): Promise<any> {
    if (!input.rawDescription || input.rawDescription.trim().length === 0) {
      throw new BadRequestError('Job description text cannot be empty.');
    }

    const normalizedText = input.rawDescription.trim().toLowerCase();

    const job = await prisma.jobDescription.create({
      data: {
        userId,
        title: input.title || 'Software Engineering Position',
        company: input.company || 'Technology Company',
        location: input.location || 'Remote / Hybrid',
        employmentType: input.employmentType || 'Full-time',
        sourceUrl: input.sourceUrl,
        rawDescription: input.rawDescription,
        normalizedText,
      },
    });

    return job;
  }

  public async getJobDescriptionById(jobId: string, authUser?: any): Promise<any> {
    const job = await prisma.jobDescription.findUnique({
      where: { id: jobId },
      include: {
        matches: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!job) {
      throw new NotFoundError(`Job description with ID ${jobId} not found`);
    }

    assertResourceOwnership(job.userId, authUser || { id: job.userId, role: 'USER' }, 'JobDescription');

    return job;
  }

  public async getUserJobDescriptions(userId: string, authUser?: any): Promise<any[]> {
    if (authUser) {
      assertResourceOwnership(userId, authUser, 'UserJobDescriptions');
    }

    return prisma.jobDescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        matches: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  public async deleteJobDescription(jobId: string, authUser?: any): Promise<void> {
    const job = await prisma.jobDescription.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError(`Job description with ID ${jobId} not found`);
    }

    assertResourceOwnership(job.userId, authUser || { id: job.userId, role: 'USER' }, 'JobDescription');

    await prisma.jobDescription.delete({ where: { id: jobId } });
  }

  public async initiateJobMatch(userId: string, jobId: string, authUser?: any): Promise<any> {
    const job = await prisma.jobDescription.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError(`Job description with ID ${jobId} not found`);
    }

    assertResourceOwnership(job.userId, authUser || { id: userId, role: 'USER' }, 'JobDescription');

    const task = await prisma.task.create({
      data: {
        userId,
        taskType: TaskType.JOB_ANALYSIS,
        priority: TaskPriority.HIGH,
        status: TaskStatus.RUNNING,
        progress: 10,
      },
    });

    jobEventEmitter.emit('job:analysis_started', {
      userId,
      jobId,
      taskId: task.id,
      timestamp: new Date(),
    });

    // Run processing asynchronously
    this.processJobMatch(userId, jobId, task.id).catch((err) => {
      logger.ai.error(`Job matching processing failed for jobId ${jobId}: ${err.message}`);
    });

    return { taskId: task.id, message: 'Job description analysis and profile matching initiated successfully' };
  }

  public async processJobMatch(userId: string, jobId: string, taskId: string): Promise<JobMatchReport> {
    try {
      const job = await prisma.jobDescription.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new NotFoundError(`Job description with ID ${jobId} not found`);
      }

      await prisma.task.update({
        where: { id: taskId },
        data: { progress: 30 },
      });

      // 1. Extract requirements
      const requirements = JobRequirementExtractor.extractRequirements(job.rawDescription);

      // 2. Fetch all user profile evidence
      const [resume, repos, leetcode, codeforces, portfolio, crossPlatform] = await Promise.all([
        prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        prisma.repository.findMany({ where: { userId }, include: { languages: true } }),
        prisma.leetCodeProfile.findUnique({ where: { userId } }),
        prisma.codeforcesProfile.findUnique({ where: { userId } }),
        prisma.portfolio.findUnique({ where: { userId }, include: { projects: true } }),
        prisma.crossPlatformVerification.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      ]);

      await prisma.task.update({
        where: { id: taskId },
        data: { progress: 60 },
      });

      const profileEvidence: UserProfileEvidenceSet = {
        resume: resume
          ? {
              skills: (resume.skills as any) || {},
              workExperience: (resume.workExperience as any) || [],
              education: (resume.education as any) || [],
              projects: (resume.projects as any) || [],
            }
          : undefined,
        githubEvidence: repos.map((r) => ({
          fullName: r.fullName,
          description: r.description || undefined,
          primaryLanguage: r.language || undefined,
          languages: r.languages.map((l) => ({ name: l.name, bytes: Number(l.bytes) })),
        })),
        leetcodeProfile: leetcode
          ? {
              totalSolved: leetcode.totalSolved,
              contestRating: leetcode.contestRating || undefined,
            }
          : undefined,
        codeforcesProfile: codeforces
          ? {
              rating: codeforces.rating || undefined,
              rank: codeforces.rank || undefined,
            }
          : undefined,
        portfolio: portfolio
          ? {
              projects: (portfolio.projects as any) || [],
            }
          : undefined,
        crossPlatformVerification: crossPlatform
          ? {
              technologyMatrix: (crossPlatform.technologyMatrix as any) || [],
            }
          : undefined,
      };

      // 3. Compute deterministic job match
      const deterministicMatch = JobMatchingEngine.evaluateJobMatch(jobId, userId, requirements, profileEvidence);

      await prisma.task.update({
        where: { id: taskId },
        data: { progress: 80 },
      });

      // 4. Run Gemini explanation service for enhanced insights
      const explanation = await jobExplanationService.explainJobMatch(deterministicMatch);

      // Merge Gemini explanation items into final report
      const finalReportData = {
        ...deterministicMatch,
        taskId,
        summary: explanation.summary || deterministicMatch.summary,
        recommendations: explanation.recommendations?.length ? explanation.recommendations : deterministicMatch.recommendations,
        interviewPriorities: explanation.interviewPriorities?.length ? explanation.interviewPriorities : deterministicMatch.interviewPriorities,
      };

      // 5. Save JobMatch in database
      const savedMatch = await prisma.jobMatch.create({
        data: {
          jobId,
          userId,
          taskId,
          overallMatchScore: finalReportData.overallMatchScore,
          requiredSkillCoverage: finalReportData.requiredSkillCoverage,
          preferredSkillCoverage: finalReportData.preferredSkillCoverage,
          projectRelevanceScore: finalReportData.projectRelevanceScore,
          experienceMatchStatus: finalReportData.experienceMatchStatus,
          educationMatchStatus: finalReportData.educationMatchStatus,
          cpRelevanceStatus: finalReportData.cpRelevanceStatus,
          summary: finalReportData.summary,
          extractedRequirements: JSON.parse(JSON.stringify(finalReportData.extractedRequirements)),
          skillMatches: JSON.parse(JSON.stringify(finalReportData.skillMatches)),
          projectRelevance: JSON.parse(JSON.stringify(finalReportData.projectRelevance)),
          missingSkills: JSON.parse(JSON.stringify(finalReportData.missingSkills)),
          keywordAlignment: JSON.parse(JSON.stringify(finalReportData.keywordAlignment)),
          recommendations: JSON.parse(JSON.stringify(finalReportData.recommendations)),
          interviewPriorities: JSON.parse(JSON.stringify(finalReportData.interviewPriorities)),
        },
      });

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      jobEventEmitter.emit('job:analysis_completed', {
        userId,
        jobId,
        matchId: savedMatch.id,
        taskId,
        timestamp: new Date(),
      });

      return {
        id: savedMatch.id,
        jobId: savedMatch.jobId,
        userId: savedMatch.userId,
        taskId: savedMatch.taskId,
        overallMatchScore: savedMatch.overallMatchScore,
        matchLabel: finalReportData.matchLabel,
        requiredSkillCoverage: savedMatch.requiredSkillCoverage,
        preferredSkillCoverage: savedMatch.preferredSkillCoverage,
        projectRelevanceScore: savedMatch.projectRelevanceScore,
        experienceMatchStatus: savedMatch.experienceMatchStatus as any,
        educationMatchStatus: savedMatch.educationMatchStatus as any,
        cpRelevanceStatus: savedMatch.cpRelevanceStatus as any,
        summary: savedMatch.summary,
        extractedRequirements: savedMatch.extractedRequirements as any,
        skillMatches: savedMatch.skillMatches as any,
        projectRelevance: savedMatch.projectRelevance as any,
        missingSkills: savedMatch.missingSkills as any,
        keywordAlignment: savedMatch.keywordAlignment as any,
        recommendations: savedMatch.recommendations as any,
        interviewPriorities: savedMatch.interviewPriorities as any,
        createdAt: savedMatch.createdAt.toISOString(),
      };
    } catch (err: any) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.FAILED,
          failureReason: err.message,
        },
      });

      jobEventEmitter.emit('job:analysis_failed', {
        userId,
        jobId,
        taskId,
        error: err.message,
        timestamp: new Date(),
      });

      throw err;
    }
  }

  public async getJobMatchReport(jobId: string, authUser?: any): Promise<any> {
    const job = await prisma.jobDescription.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError(`Job description with ID ${jobId} not found`);
    }

    assertResourceOwnership(job.userId, authUser || { id: job.userId, role: 'USER' }, 'JobDescription');

    const match = await prisma.jobMatch.findFirst({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });

    if (!match) {
      throw new NotFoundError(`No match report found for job ID ${jobId}`);
    }

    return match;
  }

  public async getJobMatchById(matchId: string, authUser?: any): Promise<any> {
    const match = await prisma.jobMatch.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundError(`Job match report with ID ${matchId} not found`);
    }

    assertResourceOwnership(match.userId, authUser || { id: match.userId, role: 'USER' }, 'JobMatch');

    return match;
  }
}

export const jobMatchingService = new JobMatchingService();
