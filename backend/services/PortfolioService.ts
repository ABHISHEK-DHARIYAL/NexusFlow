import { EventEmitter } from 'events';
import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { PortfolioCrawler } from '../integrations/portfolio/PortfolioCrawler';
import { PortfolioAnalysisEngine } from './PortfolioAnalysisEngine';
import { PortfolioAiService } from './PortfolioAiService';
import { PortfolioRepository } from '../repositories/PortfolioRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { TaskSyncService } from './TaskSyncService';
import { validateAndResolveUrl, SsrfError } from '../integrations/portfolio/ssrfValidator';
import { logger } from '../logger';
import { BadRequestError, NotFoundError } from '../utils/errors';

export const portfolioEventEmitter = new EventEmitter();

export class PortfolioService {
  constructor(
    private repository = new PortfolioRepository(),
    private crawler = new PortfolioCrawler(),
    private engine = new PortfolioAnalysisEngine(),
    private aiService = new PortfolioAiService(),
    private taskRepository = new TaskRepository(),
    private taskSyncService = new TaskSyncService()
  ) {}

  public async connectPortfolio(userId: string, url: string) {
    if (!url || typeof url !== 'string') {
      throw new BadRequestError('Portfolio URL is required.');
    }

    let validatedUrl: Awaited<ReturnType<typeof validateAndResolveUrl>>;
    try {
      validatedUrl = await validateAndResolveUrl(url);
    } catch (err: any) {
      if (err instanceof SsrfError) {
        throw new BadRequestError(`Security Validation Failed: ${err.message}`);
      }
      throw new BadRequestError(`Invalid portfolio URL: ${err.message}`);
    }

    // Idempotency check: check if a crawl or analysis task is currently QUEUED or RUNNING for this user
    const activeTasks = await this.taskRepository.findAll({ userId, limit: 10 });
    const pendingTask = activeTasks.tasks.find(
      (t) =>
        (t.taskType === TaskType.PORTFOLIO_CRAWL || t.taskType === TaskType.PORTFOLIO_ANALYSIS) &&
        (t.status === TaskStatus.QUEUED || t.status === TaskStatus.RUNNING)
    );

    if (pendingTask) {
      const existingPortfolio = await this.repository.findPortfolioByUserId(userId);
      if (existingPortfolio) {
        return { portfolio: existingPortfolio, task: pendingTask, isExisting: true };
      }
    }

    portfolioEventEmitter.emit('portfolio:crawl_started', {
      userId,
      url: validatedUrl.normalizedUrl,
      domain: validatedUrl.domain,
      timestamp: new Date()
    });

    // Upsert Portfolio record
    const portfolio = await this.repository.upsertPortfolio(userId, {
      url: validatedUrl.normalizedUrl,
      domain: validatedUrl.domain,
      crawlStatus: 'CRAWLING'
    });

    // Create DB Task
    const task = await this.taskRepository.create({
      user: { connect: { id: userId } },
      taskType: TaskType.PORTFOLIO_CRAWL,
      priority: TaskPriority.HIGH,
      status: TaskStatus.RUNNING
    });

    // Async background crawling & processing
    this.processPortfolioCrawl(userId, portfolio.id, task.id, validatedUrl.normalizedUrl).catch((err) => {
      logger.root.error(`[Portfolio] Background crawl execution failed for portfolio ${portfolio.id}:`, err);
    });

    return { portfolio, task, isExisting: false };
  }

  public async processPortfolioCrawl(
    userId: string,
    portfolioId: string,
    taskId: string,
    startUrl: string
  ) {
    try {
      await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 20);

      portfolioEventEmitter.emit('portfolio:crawl_progress', {
        userId,
        portfolioId,
        progress: 30,
        phase: 'Crawling Same-Domain Pages'
      });

      // Execute Crawl
      const crawlResult = await this.crawler.crawl(startUrl);

      if (!crawlResult.robotsAllowed) {
        await this.repository.updateCrawlStatus(portfolioId, 'FAILED', 'Crawling disallowed by robots.txt');
        await this.taskRepository.updateStatus(
          taskId,
          TaskStatus.FAILED,
          0,
          'Crawling disallowed by robots.txt'
        );
        portfolioEventEmitter.emit('portfolio:crawl_failed', {
          userId,
          portfolioId,
          error: 'Crawling disallowed by robots.txt'
        });
        return;
      }

      portfolioEventEmitter.emit('portfolio:crawl_progress', {
        userId,
        portfolioId,
        progress: 60,
        phase: 'Extracting Data & Computing Metrics'
      });

      // Compute Deterministic Metrics
      const metrics = this.engine.computeMetrics(crawlResult);

      // Save Crawled Pages
      await this.repository.replacePages(portfolioId, crawlResult.pages);

      // Save Detected Projects
      await this.repository.replaceProjects(portfolioId, crawlResult.detectedProjects);

      // Save Extracted Links
      const allLinks = [
        ...crawlResult.pages.flatMap((p) =>
          p.internalLinks.map((l) => ({ sourceUrl: p.url, targetUrl: l.url, linkType: 'INTERNAL', anchorText: l.anchorText }))
        ),
        ...crawlResult.allGithubLinks.map((g) => ({ sourceUrl: startUrl, targetUrl: g, linkType: 'GITHUB' })),
        ...crawlResult.allResumeLinks.map((r) => ({ sourceUrl: startUrl, targetUrl: r, linkType: 'RESUME' })),
        ...crawlResult.allSocialLinks.map((s) => ({ sourceUrl: startUrl, targetUrl: s.url, linkType: 'SOCIAL' })),
        ...crawlResult.brokenLinks.map((b) => ({
          sourceUrl: b.sourceUrl,
          targetUrl: b.targetUrl,
          linkType: 'BROKEN',
          isBroken: true,
          statusCode: b.statusCode
        }))
      ];
      await this.repository.replaceLinks(portfolioId, allLinks);

      // Update Portfolio Metadata & Quality Score
      const primaryPage = crawlResult.pages[0];
      await this.repository.upsertPortfolio(userId, {
        url: startUrl,
        domain: crawlResult.domain,
        title: primaryPage?.title,
        description: primaryPage?.metaDescription,
        crawlStatus: 'COMPLETED',
        robotsAllowed: true,
        pageCount: crawlResult.pages.length,
        qualityScore: metrics.portfolioQualityScore
      });

      await this.taskRepository.updateStatus(taskId, TaskStatus.RUNNING, 80);

      portfolioEventEmitter.emit('portfolio:crawl_progress', {
        userId,
        portfolioId,
        progress: 85,
        phase: 'Generating Gemini Portfolio Recommendations'
      });

      // Generate Gemini Analysis
      const aiReport = await this.aiService.generateAnalysisReport(crawlResult.domain, metrics);

      // Save Analysis
      const savedAnalysis = await this.repository.saveAnalysis(portfolioId, taskId, {
        portfolioQualityScore: metrics.portfolioQualityScore,
        seoScore: metrics.seoScore,
        accessibilityScore: metrics.accessibilityScore,
        navigationScore: metrics.navigationScore,
        projectPresentationScore: metrics.projectPresentationScore,
        recruiterReadinessScore: metrics.recruiterReadinessScore,
        summary: aiReport.summary,
        strengths: aiReport.strengths,
        weaknesses: aiReport.weaknesses,
        recruiterPerspective: aiReport.recruiterPerspective,
        seoRecommendations: aiReport.seoRecommendations,
        accessibilityRecommendations: aiReport.accessibilityRecommendations,
        designContentRecommendations: aiReport.designContentRecommendations,
        improvementRoadmap: aiReport.improvementRoadmap
      });

      await this.taskRepository.updateStatus(taskId, TaskStatus.COMPLETED, 100);

      portfolioEventEmitter.emit('portfolio:crawl_completed', {
        userId,
        portfolioId,
        pageCount: crawlResult.pages.length,
        qualityScore: metrics.portfolioQualityScore
      });

      portfolioEventEmitter.emit('portfolio:analysis_completed', {
        userId,
        portfolioId,
        analysisId: savedAnalysis.id
      });
    } catch (err: any) {
      logger.root.error(`[PortfolioService] Error processing crawl for portfolio ${portfolioId}:`, err);
      await this.repository.updateCrawlStatus(portfolioId, 'FAILED', err.message);
      await this.taskRepository.updateStatus(taskId, TaskStatus.FAILED, 0, err.message);

      portfolioEventEmitter.emit('portfolio:crawl_failed', {
        userId,
        portfolioId,
        error: err.message
      });
    }
  }

  public async getPortfolio(userId: string) {
    const portfolio = await this.repository.findPortfolioByUserId(userId);
    if (!portfolio) {
      throw new NotFoundError('No connected portfolio found for this user.');
    }
    return portfolio;
  }

  public async getPages(userId: string) {
    const portfolio = await this.getPortfolio(userId);
    return portfolio.pages;
  }

  public async getProjects(userId: string) {
    const portfolio = await this.getPortfolio(userId);
    return portfolio.projects;
  }

  public async getAnalysis(userId: string) {
    const portfolio = await this.getPortfolio(userId);
    if (!portfolio.analyses || portfolio.analyses.length === 0) {
      throw new NotFoundError('No analysis report available for this portfolio.');
    }
    return portfolio.analyses[0];
  }

  public async deletePortfolio(userId: string) {
    const portfolio = await this.getPortfolio(userId);
    await this.repository.deletePortfolio(userId);
    return { success: true, message: `Portfolio for domain ${portfolio.domain} removed.` };
  }
}
