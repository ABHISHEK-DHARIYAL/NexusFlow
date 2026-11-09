import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export interface CreateCareerReportDTO {
  userId: string;
  title: string;
  type: string;
  summary: string;
  scores?: any;
  strengths?: any;
  gaps?: any;
  recommendations?: any;
  evidence?: any;
  sourcesUsed?: any;
  freshnessStatus?: 'FRESH' | 'STALE' | 'UNAVAILABLE';
}

export class CareerReportRepository {
  async create(data: CreateCareerReportDTO) {
    try {
      return await prisma.careerReport.create({
        data: {
          userId: data.userId,
          title: data.title,
          type: data.type,
          summary: data.summary,
          scores: data.scores ?? null,
          strengths: data.strengths ?? null,
          gaps: data.gaps ?? null,
          recommendations: data.recommendations ?? null,
          evidence: data.evidence ?? null,
          sourcesUsed: data.sourcesUsed ?? null,
          freshnessStatus: data.freshnessStatus ?? 'FRESH',
        },
      });
    } catch (err: any) {
      logger.database.error(`CareerReportRepository.create failed: ${err.message}`);
      throw err;
    }
  }

  async findById(id: string) {
    try {
      return await prisma.careerReport.findUnique({
        where: { id },
      });
    } catch (err: any) {
      logger.database.error(`CareerReportRepository.findById failed: ${err.message}`);
      return null;
    }
  }

  async findByUserId(userId: string, type?: string) {
    try {
      const where: any = { userId };
      if (type) {
        where.type = type;
      }
      return await prisma.careerReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      logger.database.error(`CareerReportRepository.findByUserId failed: ${err.message}`);
      return [];
    }
  }

  async update(id: string, data: Partial<CreateCareerReportDTO>) {
    try {
      return await prisma.careerReport.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.summary && { summary: data.summary }),
          ...(data.scores !== undefined && { scores: data.scores }),
          ...(data.strengths !== undefined && { strengths: data.strengths }),
          ...(data.gaps !== undefined && { gaps: data.gaps }),
          ...(data.recommendations !== undefined && { recommendations: data.recommendations }),
          ...(data.evidence !== undefined && { evidence: data.evidence }),
          ...(data.sourcesUsed !== undefined && { sourcesUsed: data.sourcesUsed }),
          ...(data.freshnessStatus && { freshnessStatus: data.freshnessStatus }),
        },
      });
    } catch (err: any) {
      logger.database.error(`CareerReportRepository.update failed: ${err.message}`);
      throw err;
    }
  }

  async delete(id: string) {
    try {
      return await prisma.careerReport.delete({
        where: { id },
      });
    } catch (err: any) {
      logger.database.error(`CareerReportRepository.delete failed: ${err.message}`);
      throw err;
    }
  }
}

export const careerReportRepository = new CareerReportRepository();
