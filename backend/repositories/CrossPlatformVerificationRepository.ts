import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export interface SaveCrossPlatformVerificationInput {
  userId: string;
  taskId?: string | null;
  technicalConsistencyScore: number;
  projectConsistencyScore: number;
  cpConsistencyScore: number;
  technologyConsistencyScore: number;
  overallCoverageScore: number;
  verifiedClaimsCount: number;
  partialClaimsCount: number;
  notFoundClaimsCount: number;
  unverifiableClaimsCount: number;
  discrepancyCount: number;
  summary: string;
  claims: any;
  discrepancies: any;
  projectCrossVerifications: any;
  competitiveProgrammingVerifications: any;
  technologyMatrix: any;
  strongProfileSignals: any;
  missingEvidenceRecommendations: any;
  recommendations: any;
  sourcesUsed: any;
}

export class CrossPlatformVerificationRepository {
  public async saveVerification(data: SaveCrossPlatformVerificationInput) {
    try {
      return await prisma.crossPlatformVerification.create({
        data: {
          userId: data.userId,
          taskId: data.taskId,
          technicalConsistencyScore: data.technicalConsistencyScore,
          projectConsistencyScore: data.projectConsistencyScore,
          cpConsistencyScore: data.cpConsistencyScore,
          technologyConsistencyScore: data.technologyConsistencyScore,
          overallCoverageScore: data.overallCoverageScore,
          verifiedClaimsCount: data.verifiedClaimsCount,
          partialClaimsCount: data.partialClaimsCount,
          notFoundClaimsCount: data.notFoundClaimsCount,
          unverifiableClaimsCount: data.unverifiableClaimsCount,
          discrepancyCount: data.discrepancyCount,
          summary: data.summary,
          claims: data.claims,
          discrepancies: data.discrepancies,
          projectCrossVerifications: data.projectCrossVerifications,
          competitiveProgrammingVerifications: data.competitiveProgrammingVerifications,
          technologyMatrix: data.technologyMatrix,
          strongProfileSignals: data.strongProfileSignals,
          missingEvidenceRecommendations: data.missingEvidenceRecommendations,
          recommendations: data.recommendations,
          sourcesUsed: data.sourcesUsed,
        },
      });
    } catch (err: any) {
      logger.database.error(`CrossPlatformVerificationRepository.saveVerification failed: ${err.message}`);
      throw err;
    }
  }

  public async findLatestByUserId(userId: string) {
    try {
      return await prisma.crossPlatformVerification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      logger.database.error(`CrossPlatformVerificationRepository.findLatestByUserId failed: ${err.message}`);
      return null;
    }
  }

  public async findById(id: string) {
    try {
      return await prisma.crossPlatformVerification.findUnique({
        where: { id },
      });
    } catch (err: any) {
      logger.database.error(`CrossPlatformVerificationRepository.findById failed: ${err.message}`);
      return null;
    }
  }
}
