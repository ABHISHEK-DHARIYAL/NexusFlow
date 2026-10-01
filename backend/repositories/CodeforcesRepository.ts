import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class CodeforcesRepository {
  public async findProfileByUserId(userId: string) {
    try {
      return await prisma.codeforcesProfile.findUnique({
        where: { userId },
        include: {
          contests: { orderBy: { contestDate: 'asc' } },
          tagStats: { orderBy: { solvedCount: 'desc' } },
          analyses: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });
    } catch (err: any) {
      logger.database.error(`CodeforcesRepository.findProfileByUserId failed: ${err.message}`);
      return null;
    }
  }

  public async findProfileByHandle(handle: string) {
    try {
      return await prisma.codeforcesProfile.findFirst({
        where: { handle },
        include: {
          contests: { orderBy: { contestDate: 'asc' } },
          tagStats: { orderBy: { solvedCount: 'desc' } }
        }
      });
    } catch (err: any) {
      logger.database.error(`CodeforcesRepository.findProfileByHandle failed: ${err.message}`);
      return null;
    }
  }

  public async upsertProfile(
    userId: string,
    data: {
      handle: string;
      profileUrl: string;
      rating?: number | null;
      maxRating?: number | null;
      rank?: string | null;
      maxRank?: string | null;
      contribution?: number;
      friendOfCount?: number;
      titlePhoto?: string | null;
      organization?: string | null;
      cpScore?: number;
    }
  ) {
    return prisma.codeforcesProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
        lastSyncedAt: new Date()
      },
      update: {
        ...data,
        lastSyncedAt: new Date()
      },
      include: {
        contests: { orderBy: { contestDate: 'asc' } },
        tagStats: { orderBy: { solvedCount: 'desc' } },
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
  }

  public async replaceContests(
    profileId: string,
    contests: Array<{
      contestId: number;
      contestName: string;
      contestDate: Date;
      rank: number;
      ratingBefore: number;
      ratingAfter: number;
      ratingChange: number;
      problemsSolved: number;
    }>
  ) {
    await prisma.codeforcesContest.deleteMany({
      where: { profileId }
    });

    if (contests.length === 0) return [];

    return prisma.codeforcesContest.createMany({
      data: contests.map((c) => ({
        profileId,
        ...c
      }))
    });
  }

  public async replaceTagStats(
    profileId: string,
    tagStats: Array<{
      tagName: string;
      solvedCount: number;
      avgDifficulty: number;
      strengthLevel: 'STRONG' | 'MODERATE' | 'WEAK';
    }>
  ) {
    await prisma.codeforcesTagStats.deleteMany({
      where: { profileId }
    });

    if (tagStats.length === 0) return [];

    return prisma.codeforcesTagStats.createMany({
      data: tagStats.map((ts) => ({
        profileId,
        ...ts
      }))
    });
  }

  public async createAnalysis(
    profileId: string,
    taskId: string | null,
    data: {
      cpScore: number;
      summary: string;
      strengths: any;
      weaknesses: any;
      recommendations: any;
      learningRoadmap: any;
      contestStrategy: any;
    }
  ) {
    return prisma.codeforcesAnalysis.create({
      data: {
        profileId,
        taskId,
        ...data
      }
    });
  }

  public async getLatestAnalysis(profileId: string) {
    return prisma.codeforcesAnalysis.findFirst({
      where: { profileId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
