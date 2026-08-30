import { AIReportRepository } from '../repositories/AIReportRepository';
import { NotFoundError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export class AIReportService {
  constructor(private reportRepository = new AIReportRepository()) {}

  async getReportById(id: string) {
    const report = await this.reportRepository.findById(id);
    if (!report) {
      throw new NotFoundError(`Analysis Report with ID ${id} not found`);
    }
    return report;
  }

  async getReportByTaskId(taskId: string) {
    const report = await this.reportRepository.findByTaskId(taskId);
    if (!report) {
      throw new NotFoundError(`Analysis Report for task ${taskId} not found`);
    }
    return report;
  }

  async getReportsByRepositoryId(repositoryId: string) {
    return this.reportRepository.findByRepositoryId(repositoryId);
  }

  async createReport(data: Prisma.AIAnalysisReportCreateInput) {
    return this.reportRepository.create(data);
  }
}
