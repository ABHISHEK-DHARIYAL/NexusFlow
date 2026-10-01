import { TaskStatus, TaskType, TaskPriority } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { RepositoryRepository } from '../repositories/RepositoryRepository';
import { AIReportRepository } from '../repositories/AIReportRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { GithubAccountRepository } from '../repositories/GithubAccountRepository';
import { GithubApiClient } from '../integrations/github/GithubApiClient';
import { GithubRepositoryService } from '../integrations/github/GithubRepositoryService';
import { aiInputSelectionStrategy, FileInput } from './AIInputSelectionStrategy';
import { FileInputItem } from './AIInputSelectionService';
import { aiConfig } from '../config/aiConfig';
import { analyzeRepositoryWithGemini } from '../geminiService';
import { normalizeCategory, normalizeSeverity } from '../validations/aiReportValidation';
import { NotFoundError, UnauthorizedError, ConflictError, BadRequestError } from '../utils/errors';
import { taskSyncService } from './TaskSyncService';
import { logger } from '../logger';

export class AIAnalysisService {
  constructor(
    private repoRepository = new RepositoryRepository(),
    private reportRepository = new AIReportRepository(),
    private taskRepository = new TaskRepository(),
    private githubAccountRepository = new GithubAccountRepository()
  ) {}

  public async triggerAnalysis(userId: string, repositoryId: string) {
    // 1. Ownership & Existence Verification (IDOR Protection)
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      include: { files: true },
    });

    if (!repository) {
      throw new NotFoundError(`Repository with ID ${repositoryId} not found`);
    }

    if (repository.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to analyze this repository');
    }

    // 2. Idempotency Check: Prevent duplicate concurrent analysis
    const existingActiveTask = await prisma.task.findFirst({
      where: {
        repositoryId,
        status: { in: [TaskStatus.QUEUED, TaskStatus.RUNNING] },
        taskType: { in: [TaskType.AI_ANALYSIS, TaskType.REPO_ANALYSIS] },
      },
    });

    if (existingActiveTask) {
      throw new ConflictError('An AI analysis task is already queued or running for this repository');
    }

    // 3. Create Task record
    const task = await prisma.task.create({
      data: {
        userId,
        repositoryId,
        taskType: TaskType.AI_ANALYSIS,
        status: TaskStatus.QUEUED,
        priority: TaskPriority.HIGH,
        progress: 0,
      },
    });

    // 4. Dispatch Task to Java Worker / Async Processing
    taskSyncService.dispatchToWorker(task).catch((err) => {
      logger.ai.warn(`Failed to dispatch AI_ANALYSIS task ${task.id} to Java worker: ${err.message}`);
    });

    // Asynchronously execute analysis in node worker engine
    this.executeAnalysis(task.id, repositoryId).catch((err) => {
      logger.ai.error(`Background AI execution failed for task ${task.id}: ${err.message}`);
    });

    return {
      task,
      repository,
    };
  }

  public async executeAnalysis(taskId: string, repositoryId: string) {
    try {
      logger.ai.info(`Starting execution of AI Analysis Task ${taskId} for repository ${repositoryId}`);

      // 1. Update Task status to RUNNING
      await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 10);

      // 2. Fetch Repository & Synced Files
      const repository = await prisma.repository.findUnique({
        where: { id: repositoryId },
        include: { files: true, statistics: true },
      });

      if (!repository) {
        throw new NotFoundError(`Repository ${repositoryId} not found`);
      }

      // Convert stored files to FileInput format (metadata only so far -
      // content is fetched below, only for the files actually worth
      // analyzing, to avoid fetching every file in the repository).
      const fileInputs: FileInput[] = (repository.files || []).map((file) => ({
        path: file.path,
        content: null,
        size: Number(file.size || 0),
        language: file.language,
      }));

      // 2b. Fetch real file content for the top-ranked candidate files.
      //
      // Fix for a confirmed severe bug: this previously never happened -
      // every file was sent to Gemini with a hardcoded placeholder
      // ("content truncated or unavailable") instead of its real source
      // code, meaning every AI analysis report (scores, findings) was
      // generated from file paths and repo metadata alone, not from
      // actually reading the code. This fetches real content only for the
      // top-ranked candidates (same priority/size ranking used for final
      // selection), respecting the existing per-analysis file budget, so
      // it doesn't fetch content for every file in large repositories.
      const candidates = aiInputSelectionStrategy.selectCandidatePaths(
        fileInputs,
        aiConfig.maxFilesPerAnalysis
      );

      if (candidates.length > 0) {
        try {
          const githubAccount = await this.githubAccountRepository.findByUserId(repository.userId);
          if (githubAccount?.accessToken) {
            const client = new GithubApiClient(githubAccount.accessToken);
            const [owner, repoName] = repository.fullName.split('/');
            const repoService = new GithubRepositoryService(client);
            const contentByPath = new Map<string, string>();

            await Promise.all(
              candidates.map(async (candidate) => {
                try {
                  const { content } = await repoService.getFileContent(
                    owner,
                    repoName,
                    candidate.path,
                    repository.defaultBranch || 'main'
                  );
                  contentByPath.set(candidate.path, content);
                } catch (err: any) {
                  logger.ai.warn(`Failed to fetch content for ${candidate.path}: ${err.message}`);
                }
              })
            );

            for (const file of fileInputs) {
              const fetched = contentByPath.get(file.path);
              if (fetched !== undefined) {
                file.content = fetched;
              }
            }
          } else {
            logger.ai.warn(
              `No GitHub access token available for user ${repository.userId}; analysis will proceed on repository metadata only`
            );
          }
        } catch (err: any) {
          logger.ai.warn(`File content fetch step failed, continuing with metadata-only analysis: ${err.message}`);
        }
      }

      // 3. Select Context using AIInputSelectionStrategy (used here for
      // coverage logging; the actual content sent to Gemini is selected
      // again, independently, by AIInputSelectionService inside
      // GeminiAiService - that duplication is pre-existing and out of
      // scope to consolidate here).
      const selectedContext = aiInputSelectionStrategy.selectContext(fileInputs);
      logger.ai.info(
        `AI Input Selection complete: ${selectedContext.filesAnalyzed.length}/${selectedContext.totalEligibleFiles} files selected (${selectedContext.inputCoverage * 100}% coverage, partial: ${selectedContext.isPartial})`
      );

      await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 40);

      // 4. Invoke Gemini API Intelligence with real file content (only
      // files that were actually fetched successfully - see step 2b above).
      const filesWithContent: FileInputItem[] = fileInputs
        .filter((f): f is FileInput & { content: string } => typeof f.content === 'string' && f.content.length > 0)
        .map((f) => ({
          path: f.path,
          content: f.content as string,
          language: f.language,
          size: Number(f.size || 0),
        }));

      const { reportData, modelName, modelVersion } = await analyzeRepositoryWithGemini(
        repository.fullName,
        repository.description || '',
        repository.language || 'TypeScript',
        taskId,
        repositoryId,
        filesWithContent
      );

      await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 80);

      // 5. Store AIAnalysisReport & Findings in Database
      const createdReport = await prisma.aIAnalysisReport.create({
        data: {
          repositoryId,
          taskId,
          overallScore: reportData.overallScore,
          securityScore: reportData.securityScore,
          performanceScore: reportData.performanceScore,
          architectureScore: reportData.architectureScore,
          maintainabilityScore: reportData.maintainabilityScore,
          documentationScore: reportData.documentationScore,
          summary: reportData.summary,
          recommendations: reportData.recommendations,
          modelName,
          modelVersion,
          findings: {
            create: (reportData.findings || []).map((f: any) => ({
              category: normalizeCategory(f.category),
              severity: normalizeSeverity(f.severity),
              title: f.title,
              description: f.description,
              filePath: f.filePath || null,
              lineNumber: f.lineNumber || null,
              snippet: f.snippet || null,
              recommendation: f.recommendation || null,
            })),
          },
        },
        include: { findings: true },
      });

      // 6. Update Repository Statistics
      await prisma.repositoryStatistics.upsert({
        where: { repositoryId },
        create: {
          repositoryId,
          healthScore: reportData.overallScore,
          lastAnalyzedAt: new Date(),
        },
        update: {
          healthScore: reportData.overallScore,
          lastAnalyzedAt: new Date(),
        },
      });

      // 7. Complete Task & Create Notification
      await this.taskRepository.updateStatus(taskId, TaskStatus.COMPLETED, 100);

      await prisma.notification.create({
        data: {
          userId: repository.userId,
          type: 'ANALYSIS_READY',
          title: `AI Analysis Complete: ${repository.name}`,
          message: `Repository ${repository.fullName} analysis is complete with health score ${reportData.overallScore}/100.`,
          relatedTaskId: taskId,
          relatedRepositoryId: repositoryId,
        },
      });

      logger.ai.info(`AI Analysis Task ${taskId} completed successfully. Report ID: ${createdReport.id}`);
      return createdReport;
    } catch (err: any) {
      logger.ai.error(`Failed to execute AI Analysis for task ${taskId}: ${err.message}`);
      await this.taskRepository.updateStatus(taskId, TaskStatus.FAILED, undefined, err.message);
      throw err;
    }
  }

  public async getUserReports(userId: string) {
    const userRepos = await prisma.repository.findMany({
      where: { userId },
      select: { id: true },
    });
    const repoIds = userRepos.map((r) => r.id);
    return prisma.aIAnalysisReport.findMany({
      where: { repositoryId: { in: repoIds } },
      include: { repository: true, findings: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getReportsByRepositoryId(userId: string, repositoryId: string) {
    const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
    if (!repository) {
      throw new NotFoundError(`Repository ${repositoryId} not found`);
    }
    if (repository.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to view reports for this repository');
    }
    return this.reportRepository.findByRepositoryId(repositoryId);
  }

  public async getReportById(userId: string, reportId: string) {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError(`Analysis report with ID ${reportId} not found`);
    }
    const repository = await prisma.repository.findUnique({ where: { id: report.repositoryId } });
    if (!repository || repository.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to view this report');
    }
    return report;
  }

  public async getReportFindings(userId: string, reportId: string) {
    const report = await this.getReportById(userId, reportId);
    return (report as any).findings || [];
  }
}

export const aiAnalysisService = new AIAnalysisService();
