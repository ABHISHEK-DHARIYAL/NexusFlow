import { AIAnalysisReport, Prisma } from '@prisma/client';

export interface IAIReportRepository {
  findById(id: string): Promise<AIAnalysisReport | null>;
  findByTaskId(taskId: string): Promise<AIAnalysisReport | null>;
  findByRepositoryId(repositoryId: string): Promise<AIAnalysisReport[]>;
  create(data: Prisma.AIAnalysisReportCreateInput): Promise<AIAnalysisReport>;
  update(id: string, data: Prisma.AIAnalysisReportUpdateInput): Promise<AIAnalysisReport>;
  delete(id: string): Promise<AIAnalysisReport>;
}
