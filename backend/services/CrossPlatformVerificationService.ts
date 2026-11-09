import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { CrossPlatformVerificationRepository } from '../repositories/CrossPlatformVerificationRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { EvidenceNormalizer } from '../integrations/crossplatform/EvidenceNormalizer';
import { CrossPlatformMatcher } from '../integrations/crossplatform/CrossPlatformMatcher';
import { crossPlatformEventEmitter } from './CrossPlatformEventEmitter';
import { GeminiAiService } from './GeminiAiService';
import { assertResourceOwnership } from '../utils/ownership';
import { NotFoundError } from '../utils/errors';
import { logger } from '../logger';
import { CrossPlatformVerificationReport } from '../../types';

export class CrossPlatformVerificationService {
  constructor(
    private verificationRepo = new CrossPlatformVerificationRepository(),
    private taskRepo = new TaskRepository(),
    private normalizer = new EvidenceNormalizer(),
    private geminiAi = new GeminiAiService()
  ) {}

  public async initiateVerification(userId: string, authUser?: any): Promise<{ taskId: string; message: string }> {
    assertResourceOwnership(userId, authUser || { id: userId, role: 'USER' }, 'User Profile');

    // Create a Task for asynchronous execution tracking
    const task = await this.taskRepo.create({
      user: { connect: { id: userId } },
      taskType: TaskType.CROSS_PLATFORM_VERIFICATION,
      priority: TaskPriority.HIGH,
      status: TaskStatus.RUNNING,
      progress: 10,
    });

    crossPlatformEventEmitter.emit('cross_platform:verification_started', {
      userId,
      taskId: task.id,
      timestamp: new Date(),
    });

    // Process verification asynchronously
    this.processVerification(userId, task.id).catch((err) => {
      logger.ai.error(`Asynchronous Cross-Platform Developer Verification failed: ${err.message}`);
      this.taskRepo.updateStatus(task.id, TaskStatus.FAILED, 0, err.message).catch(() => {});
      crossPlatformEventEmitter.emit('cross_platform:verification_failed', {
        userId,
        taskId: task.id,
        error: err.message,
      });
    });

    return {
      taskId: task.id,
      message: 'Cross-platform developer verification initiated successfully',
    };
  }

  public async processVerification(userId: string, taskId: string): Promise<CrossPlatformVerificationReport> {
    try {
      // Step 1: Normalize Evidence
      await this.taskRepo.updateStatus(taskId, TaskStatus.RUNNING, 25);
      crossPlatformEventEmitter.emit('cross_platform:verification_progress', {
        userId,
        taskId,
        progress: 25,
        status: 'GATHERING_PLATFORM_EVIDENCE',
      });

      const evidenceSet = await this.normalizer.normalizeUserEvidence(userId);

      // Step 2: Match Claims & Detect Discrepancies
      await this.taskRepo.updateStatus(taskId, TaskStatus.RUNNING, 60);
      crossPlatformEventEmitter.emit('cross_platform:verification_progress', {
        userId,
        taskId,
        progress: 60,
        status: 'EVALUATING_CROSS_PLATFORM_CLAIMS',
      });

      const matched = CrossPlatformMatcher.evaluateCrossPlatform(evidenceSet);

      // Step 3: AI Executive Summary
      await this.taskRepo.updateStatus(taskId, TaskStatus.RUNNING, 85);
      crossPlatformEventEmitter.emit('cross_platform:verification_progress', {
        userId,
        taskId,
        progress: 85,
        status: 'GENERATING_EXECUTIVE_REPORT',
      });

      const connectedLabels = evidenceSet.sourcesUsed.filter((s) => s.connected).map((s) => s.label);
      const topDiscrepancies = matched.discrepancies.slice(0, 3).map((d) => d.explanation);
      const topSupported = matched.claims
        .filter((c) => c.status === 'SUPPORTED')
        .slice(0, 3)
        .map((c) => c.claimText);

      const aiSummary = await this.geminiAi.generateCrossPlatformVerificationSummary({
        totalClaims: matched.claims.length,
        verifiedCount: matched.verifiedCount,
        partialCount: matched.partialCount,
        notFoundCount: matched.notFoundCount,
        unverifiableCount: matched.unverifiableCount,
        discrepancyCount: matched.discrepancyCount,
        technicalConsistencyScore: matched.technicalConsistencyScore,
        overallCoverageScore: matched.overallCoverageScore,
        sourcesUsedLabels: connectedLabels,
        topDiscrepancies,
        topSupported,
      });

      const recommendations = Array.from(
        new Set([...matched.missingEvidenceRecommendations, ...aiSummary.recommendations])
      );
      const strongSignals = Array.from(
        new Set([...matched.strongProfileSignals, ...aiSummary.strongSignals])
      );

      // Step 4: Persist Report
      const saved = await this.verificationRepo.saveVerification({
        userId,
        taskId,
        technicalConsistencyScore: matched.technicalConsistencyScore,
        projectConsistencyScore: matched.projectConsistencyScore,
        cpConsistencyScore: matched.cpConsistencyScore,
        technologyConsistencyScore: matched.technologyConsistencyScore,
        overallCoverageScore: matched.overallCoverageScore,
        verifiedClaimsCount: matched.verifiedCount,
        partialClaimsCount: matched.partialCount,
        notFoundClaimsCount: matched.notFoundCount,
        unverifiableClaimsCount: matched.unverifiableCount,
        discrepancyCount: matched.discrepancyCount,
        summary: aiSummary.summary,
        claims: matched.claims,
        discrepancies: matched.discrepancies,
        projectCrossVerifications: matched.projectCrossVerifications,
        competitiveProgrammingVerifications: matched.competitiveProgrammingVerifications,
        technologyMatrix: matched.technologyMatrix,
        strongProfileSignals: strongSignals,
        missingEvidenceRecommendations: matched.missingEvidenceRecommendations,
        recommendations,
        sourcesUsed: evidenceSet.sourcesUsed,
      });

      await this.taskRepo.updateStatus(taskId, TaskStatus.COMPLETED, 100);

      const report: CrossPlatformVerificationReport = {
        id: saved.id,
        userId: saved.userId,
        taskId: saved.taskId,
        technicalConsistencyScore: saved.technicalConsistencyScore,
        projectConsistencyScore: saved.projectConsistencyScore,
        cpConsistencyScore: saved.cpConsistencyScore,
        technologyConsistencyScore: saved.technologyConsistencyScore,
        overallCoverageScore: saved.overallCoverageScore,
        verifiedClaimsCount: saved.verifiedClaimsCount,
        partialClaimsCount: saved.partialClaimsCount,
        notFoundClaimsCount: saved.notFoundClaimsCount,
        unverifiableClaimsCount: saved.unverifiableClaimsCount,
        discrepancyCount: saved.discrepancyCount,
        summary: saved.summary,
        claims: saved.claims as any,
        discrepancies: saved.discrepancies as any,
        projectCrossVerifications: saved.projectCrossVerifications as any,
        competitiveProgrammingVerifications: saved.competitiveProgrammingVerifications as any,
        technologyMatrix: saved.technologyMatrix as any,
        strongProfileSignals: saved.strongProfileSignals as any,
        missingEvidenceRecommendations: saved.missingEvidenceRecommendations as any,
        recommendations: saved.recommendations as any,
        sourcesUsed: saved.sourcesUsed as any,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      };

      crossPlatformEventEmitter.emit('cross_platform:verification_completed', {
        userId,
        taskId,
        reportId: saved.id,
        report,
      });

      return report;
    } catch (err: any) {
      await this.taskRepo.updateStatus(taskId, TaskStatus.FAILED, 0, err.message);
      throw err;
    }
  }

  public async getLatestVerification(userId: string, authUser?: any): Promise<CrossPlatformVerificationReport | null> {
    assertResourceOwnership(userId, authUser || { id: userId, role: 'USER' }, 'User Profile');

    const saved = await this.verificationRepo.findLatestByUserId(userId);
    if (!saved) return null;

    return {
      id: saved.id,
      userId: saved.userId,
      taskId: saved.taskId,
      technicalConsistencyScore: saved.technicalConsistencyScore,
      projectConsistencyScore: saved.projectConsistencyScore,
      cpConsistencyScore: saved.cpConsistencyScore,
      technologyConsistencyScore: saved.technologyConsistencyScore,
      overallCoverageScore: saved.overallCoverageScore,
      verifiedClaimsCount: saved.verifiedClaimsCount,
      partialClaimsCount: saved.partialClaimsCount,
      notFoundClaimsCount: saved.notFoundClaimsCount,
      unverifiableClaimsCount: saved.unverifiableClaimsCount,
      discrepancyCount: saved.discrepancyCount,
      summary: saved.summary,
      claims: saved.claims as any,
      discrepancies: saved.discrepancies as any,
      projectCrossVerifications: saved.projectCrossVerifications as any,
      competitiveProgrammingVerifications: saved.competitiveProgrammingVerifications as any,
      technologyMatrix: saved.technologyMatrix as any,
      strongProfileSignals: saved.strongProfileSignals as any,
      missingEvidenceRecommendations: saved.missingEvidenceRecommendations as any,
      recommendations: saved.recommendations as any,
      sourcesUsed: saved.sourcesUsed as any,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  public async getClaims(userId: string, authUser?: any) {
    const report = await this.getLatestVerification(userId, authUser);
    return report ? report.claims : [];
  }

  public async getDiscrepancies(userId: string, authUser?: any) {
    const report = await this.getLatestVerification(userId, authUser);
    return report ? report.discrepancies : [];
  }

  public async getSources(userId: string, authUser?: any) {
    const report = await this.getLatestVerification(userId, authUser);
    if (report) return report.sourcesUsed;

    const normalizer = new EvidenceNormalizer();
    const evidenceSet = await normalizer.normalizeUserEvidence(userId);
    return evidenceSet.sourcesUsed;
  }
}
