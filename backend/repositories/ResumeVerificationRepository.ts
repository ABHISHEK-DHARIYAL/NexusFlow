import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export interface SaveVerificationInput {
  resumeId: string;
  userId: string;
  taskId?: string | null;
  overallCoverageScore: number;
  verifiedClaimsCount: number;
  partialClaimsCount: number;
  notFoundClaimsCount: number;
  unverifiableClaimsCount: number;
  summary: string;
  claims: any;
  projectMatches: any;
  strongProjects: any;
  recommendations: any;
}

export class ResumeVerificationRepository {
  public async saveVerification(data: SaveVerificationInput) {
    try {
      return await prisma.resumeGitHubVerification.create({
        data: {
          resumeId: data.resumeId,
          userId: data.userId,
          taskId: data.taskId,
          overallCoverageScore: data.overallCoverageScore,
          verifiedClaimsCount: data.verifiedClaimsCount,
          partialClaimsCount: data.partialClaimsCount,
          notFoundClaimsCount: data.notFoundClaimsCount,
          unverifiableClaimsCount: data.unverifiableClaimsCount,
          summary: data.summary,
          claims: data.claims,
          projectMatches: data.projectMatches,
          strongProjects: data.strongProjects,
          recommendations: data.recommendations
        }
      });
    } catch (err: any) {
      logger.database.error(`ResumeVerificationRepository.saveVerification failed: ${err.message}`);
      throw err;
    }
  }

  public async findLatestVerificationByResumeId(resumeId: string) {
    try {
      return await prisma.resumeGitHubVerification.findFirst({
        where: { resumeId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (err: any) {
      logger.database.error(`ResumeVerificationRepository.findLatestVerificationByResumeId failed: ${err.message}`);
      return null;
    }
  }

  public async findLatestVerificationByUserId(userId: string) {
    try {
      return await prisma.resumeGitHubVerification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (err: any) {
      logger.database.error(`ResumeVerificationRepository.findLatestVerificationByUserId failed: ${err.message}`);
      return null;
    }
  }

  public async findVerificationById(id: string) {
    try {
      return await prisma.resumeGitHubVerification.findUnique({
        where: { id }
      });
    } catch (err: any) {
      logger.database.error(`ResumeVerificationRepository.findVerificationById failed: ${err.message}`);
      return null;
    }
  }
}
