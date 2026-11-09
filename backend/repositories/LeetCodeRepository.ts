import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class LeetCodeRepository {
  public async findProfileByUserId(userId: string) {
    try {
      return await prisma.leetCodeProfile.findUnique({
        where: { userId },
        include: {
          contests: { orderBy: { contestDate: 'asc' } },
          topicStats: { orderBy: { solvedCount: 'desc' } },
          analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    } catch (err: any) {
      logger.database.error(`LeetCodeRepository.findProfileByUserId failed: ${err.message}`);
      return null;
    }
  }

  public async findProfileByUsername(username: string) {
    try {
      return await prisma.leetCodeProfile.findFirst({
        where: { username },
        include: {
          contests: { orderBy: { contestDate: 'asc' } },
          topicStats: { orderBy: { solvedCount: 'desc' } },
        },
      });
    } catch (err: any) {
      logger.database.error(`LeetCodeRepository.findProfileByUsername failed: ${err.message}`);
      return null;
    }
  }

  public async upsertProfile(userId: string, data: {
    username: string;
    profileUrl: string;
    realName?: string | null;
    ranking?: number | null;
    reputation?: number | null;
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    acceptanceRate: number;
    streak: number;
    dsaScore: number;
    contestRating: number;
    maxRating: number;
    globalRanking?: number | null;
  }) {
    return prisma.leetCodeProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: {
        ...data,
        lastSyncedAt: new Date(),
      },
    });
  }

  public async saveContests(profileId: string, contests: {
    contestName: string;
    contestDate: Date;
    rating: number;
    ranking: number;
    problemsSolved: number;
    totalProblems: number;
    score: number;
    ratingChange: number;
  }[]) {
    await prisma.leetCodeContest.deleteMany({ where: { profileId } });
    if (contests.length === 0) return [];

    return prisma.leetCodeContest.createMany({
      data: contests.map((c) => ({
        profileId,
        ...c,
      })),
    });
  }

  public async saveTopicStats(profileId: string, topicStats: {
    topicName: string;
    solvedCount: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    strengthLevel: string;
  }[]) {
    await prisma.leetCodeTopicStats.deleteMany({ where: { profileId } });
    if (topicStats.length === 0) return [];

    return prisma.leetCodeTopicStats.createMany({
      data: topicStats.map((t) => ({
        profileId,
        ...t,
      })),
    });
  }

  public async saveAnalysis(profileId: string, taskId: string | null, analysis: {
    dsaScore: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    learningRoadmap: any;
    contestStrategy: any;
  }) {
    return prisma.leetCodeAnalysis.create({
      data: {
        profileId,
        taskId,
        dsaScore: analysis.dsaScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
        learningRoadmap: analysis.learningRoadmap,
        contestStrategy: analysis.contestStrategy,
      },
    });
  }

  public async findLatestAnalysisByProfileId(profileId: string) {
    return prisma.leetCodeAnalysis.findFirst({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const leetCodeRepository = new LeetCodeRepository();
