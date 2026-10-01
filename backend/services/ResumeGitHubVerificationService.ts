import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { ResumeRepository } from '../repositories/ResumeRepository';
import { ResumeVerificationRepository } from '../repositories/ResumeVerificationRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { ResumeClaimExtractor } from '../integrations/resume/ResumeClaimExtractor';
import { GitHubEvidenceExtractor } from '../integrations/resume/GitHubEvidenceExtractor';
import { ClaimMatcher } from '../integrations/resume/ClaimMatcher';
import { resumeEventEmitter } from './ResumeEventEmitter';
import { GeminiAiService } from './GeminiAiService';
import { assertResourceOwnership } from '../utils/ownership';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../logger';
import { StrongProjectSuggestion, ResumeGitHubVerification } from '../../types';

export class ResumeGitHubVerificationService {
  constructor(
    private resumeRepo = new ResumeRepository(),
    private verificationRepo = new ResumeVerificationRepository(),
    private taskRepo = new TaskRepository(),
    private evidenceExtractor = new GitHubEvidenceExtractor(),
    private geminiAi = new GeminiAiService()
  ) {}

  public async initiateVerification(userId: string, resumeId: string, authUser?: any): Promise<any> {
    const resume = await this.resumeRepo.findResumeById(resumeId);
    if (!resume) {
      throw new NotFoundError(`Resume with ID ${resumeId} not found`);
    }

    assertResourceOwnership(resume.userId, authUser || { id: userId, role: 'USER' }, 'Resume');

    // Create a Task for asynchronous execution tracking
    const task = await this.taskRepo.create({
      user: { connect: { id: userId } },
      taskType: TaskType.RESUME_GITHUB_VERIFICATION,
      priority: TaskPriority.HIGH,
      status: TaskStatus.RUNNING,
      progress: 10
    });

    resumeEventEmitter.emit('resume:github_verification_started', {
      userId,
      resumeId,
      taskId: task.id,
      timestamp: new Date()
    });

    // Run verification processing asynchronously
    this.processVerification(userId, resumeId, task.id, resume).catch((err) => {
      logger.ai.error(`Asynchronous Resume ↔ GitHub Verification failed: ${err.message}`);
    });

    return { taskId: task.id, message: 'Resume ↔ GitHub Verification initiated successfully' };
  }

  public async processVerification(
    userId: string,
    resumeId: string,
    taskId: string,
    resume: any
  ): Promise<ResumeGitHubVerification> {
    try {
      // Step 1: Extract claims from resume
      const rawClaims = ResumeClaimExtractor.extractClaims({
        contactInfo: resume.contactInfo,
        workExperience: resume.workExperience as any[],
        education: resume.education as any[],
        skills: resume.skills,
        projects: resume.projects as any[]
      });

      await this.taskRepo.updateStatus(taskId, TaskStatus.RUNNING, 30);
      resumeEventEmitter.emit('resume:github_verification_progress', {
        userId,
        resumeId,
        taskId,
        progress: 30,
        status: 'EXTRACTING_GITHUB_EVIDENCE'
      });

      // Step 2: Extract evidence from user GitHub repositories
      const repositoriesEvidence = await this.evidenceExtractor.extractUserEvidence(userId);

      await this.taskRepo.updateStatus(taskId, TaskStatus.RUNNING, 60);
      resumeEventEmitter.emit('resume:github_verification_progress', {
        userId,
        resumeId,
        taskId,
        progress: 60,
        status: 'EVALUATING_CLAIMS'
      });

      // Step 3: Match claims against GitHub evidence
      const {
        evaluatedClaims,
        projectMatches,
        coverageScore,
        verifiedCount,
        partialCount,
        notFoundCount,
        unverifiableCount
      } = ClaimMatcher.evaluateClaims(rawClaims, repositoriesEvidence);

      // Step 4: Discover strong GitHub projects not mentioned in resume
      const resumeProjectNames = (resume.projects as any[] || []).map((p) => (p.title || '').toLowerCase());
      const strongProjects: StrongProjectSuggestion[] = [];

      for (const repo of repositoriesEvidence) {
        const nameLower = repo.name.toLowerCase();
        const fullLower = repo.fullName.toLowerCase();

        const isMentioned = resumeProjectNames.some(
          (rName) => rName.length > 2 && (nameLower.includes(rName) || rName.includes(nameLower))
        );

        if (!isMentioned) {
          strongProjects.push({
            repositoryId: repo.repositoryId,
            repositoryName: repo.fullName,
            description: repo.description || 'Production-grade software repository',
            language: repo.primaryLanguage || 'TypeScript',
            starsCount: repo.stargazersCount,
            relevanceReason: 'Identified strong architectural structure in user GitHub profile.',
            suggestedTitle: repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            suggestedHighlights: [
              `Architected ${repo.name} utilizing ${repo.primaryLanguage || 'modern frameworks'}.`,
              `Configured end-to-end repository infrastructure with ${repo.filePaths.length} tracked files.`
            ]
          });
        }
      }

      await this.taskRepo.updateStatus(taskId, TaskStatus.RUNNING, 85);
      resumeEventEmitter.emit('resume:github_verification_progress', {
        userId,
        resumeId,
        taskId,
        progress: 85,
        status: 'GENERATING_SUMMARY'
      });

      // Step 5: Construct Summary and Recommendations via Gemini AI or Fallback
      const supportedClaimTexts = evaluatedClaims
        .filter((c) => c.status === 'SUPPORTED')
        .slice(0, 5)
        .map((c) => c.claimText);

      const unverifiableClaimTexts = evaluatedClaims
        .filter((c) => c.status === 'UNVERIFIABLE' || c.status === 'NOT_FOUND')
        .slice(0, 5)
        .map((c) => c.claimText);

      const aiResult = await this.geminiAi.generateResumeVerificationSummary({
        totalClaims: evaluatedClaims.length,
        verifiedCount,
        partialCount,
        notFoundCount,
        unverifiableCount,
        coverageScore,
        topSupportedClaims: supportedClaimTexts,
        unverifiableClaims: unverifiableClaimTexts,
        strongProjectsCount: strongProjects.length
      });

      const summary = aiResult.summary;
      const recommendations = aiResult.recommendations;

      // Save verification result in DB
      const savedResult = await this.verificationRepo.saveVerification({
        resumeId,
        userId,
        taskId,
        overallCoverageScore: coverageScore,
        verifiedClaimsCount: verifiedCount,
        partialClaimsCount: partialCount,
        notFoundClaimsCount: notFoundCount,
        unverifiableClaimsCount: unverifiableCount,
        summary,
        claims: evaluatedClaims,
        projectMatches,
        strongProjects,
        recommendations
      });

      await this.taskRepo.updateStatus(taskId, TaskStatus.COMPLETED, 100);

      const responsePayload: ResumeGitHubVerification = {
        id: savedResult.id,
        resumeId: savedResult.resumeId,
        userId: savedResult.userId,
        taskId: savedResult.taskId,
        overallCoverageScore: savedResult.overallCoverageScore,
        verifiedClaimsCount: savedResult.verifiedClaimsCount,
        partialClaimsCount: savedResult.partialClaimsCount,
        notFoundClaimsCount: savedResult.notFoundClaimsCount,
        unverifiableClaimsCount: savedResult.unverifiableClaimsCount,
        summary: savedResult.summary,
        claims: savedResult.claims as any,
        projectMatches: savedResult.projectMatches as any,
        strongProjects: savedResult.strongProjects as any,
        recommendations: savedResult.recommendations as any,
        createdAt: savedResult.createdAt.toISOString(),
        updatedAt: savedResult.updatedAt.toISOString()
      };

      resumeEventEmitter.emit('resume:github_verification_completed', {
        userId,
        resumeId,
        taskId,
        verificationId: savedResult.id,
        overallCoverageScore: coverageScore,
        timestamp: new Date()
      });

      return responsePayload;
    } catch (err: any) {
      logger.ai.error(`processVerification error: ${err.message}`);
      await this.taskRepo.updateStatus(taskId, TaskStatus.FAILED, undefined, err.message);

      resumeEventEmitter.emit('resume:github_verification_failed', {
        userId,
        resumeId,
        taskId,
        error: err.message,
        timestamp: new Date()
      });

      throw err;
    }
  }

  public async getLatestVerification(resumeId: string, authUser?: any): Promise<ResumeGitHubVerification | null> {
    const resume = await this.resumeRepo.findResumeById(resumeId);
    if (!resume) {
      throw new NotFoundError(`Resume with ID ${resumeId} not found`);
    }

    assertResourceOwnership(resume.userId, authUser, 'Resume');

    const result = await this.verificationRepo.findLatestVerificationByResumeId(resumeId);
    if (!result) return null;

    return {
      id: result.id,
      resumeId: result.resumeId,
      userId: result.userId,
      taskId: result.taskId,
      overallCoverageScore: result.overallCoverageScore,
      verifiedClaimsCount: result.verifiedClaimsCount,
      partialClaimsCount: result.partialClaimsCount,
      notFoundClaimsCount: result.notFoundClaimsCount,
      unverifiableClaimsCount: result.unverifiableClaimsCount,
      summary: result.summary,
      claims: result.claims as any,
      projectMatches: result.projectMatches as any,
      strongProjects: result.strongProjects as any,
      recommendations: result.recommendations as any,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString()
    };
  }
}
