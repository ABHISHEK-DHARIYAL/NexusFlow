import { AIAnalysisReport, Prisma } from '@prisma/client';
import { IAIReportRepository } from '../interfaces/IAIReportRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class AIReportRepository implements IAIReportRepository {
  async findById(id: string): Promise<AIAnalysisReport | null> {
    try {
      return await prisma.aIAnalysisReport.findUnique({
        where: { id },
        include: { findings: true, repository: true },
      });
    } catch (err) {
      logger.database.error(`AIReportRepository.findById failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findByTaskId(taskId: string): Promise<AIAnalysisReport | null> {
    try {
      return await prisma.aIAnalysisReport.findUnique({
        where: { taskId },
        include: { findings: true },
      });
    } catch (err) {
      logger.database.error(`AIReportRepository.findByTaskId failed: ${(err as Error).message}`);
      return null;
    }
  }

  async findByRepositoryId(repositoryId: string): Promise<AIAnalysisReport[]> {
    try {
      return await prisma.aIAnalysisReport.findMany({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
        include: { findings: true },
      });
    } catch (err) {
      logger.database.error(`AIReportRepository.findByRepositoryId failed: ${(err as Error).message}`);
      return [];
    }
  }

  async create(data: Prisma.AIAnalysisReportCreateInput): Promise<AIAnalysisReport> {
    return prisma.aIAnalysisReport.create({ data, include: { findings: true } });
  }

  async update(id: string, data: Prisma.AIAnalysisReportUpdateInput): Promise<AIAnalysisReport> {
    return prisma.aIAnalysisReport.update({ where: { id }, data });
  }

  async delete(id: string): Promise<AIAnalysisReport> {
    return prisma.aIAnalysisReport.delete({ where: { id } });
  }
}
