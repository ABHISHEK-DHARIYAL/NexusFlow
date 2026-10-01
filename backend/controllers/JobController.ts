import { Request, Response } from 'express';
import { jobMatchingService } from '../services/JobMatchingService';
import { jobReadinessService } from '../services/JobReadinessService';
import { companyPreparationService } from '../services/CompanyPreparationService';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { requireUserId } from '../utils/ownership';
import { logger } from '../logger';

export class JobController {
  public async createJob(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId((req as any).user);
      const { title, company, location, employmentType, sourceUrl, rawDescription, autoMatch } = req.body;

      if (!rawDescription || typeof rawDescription !== 'string' || rawDescription.trim().length === 0) {
        res.status(400).json({ error: 'rawDescription is required and must be a non-empty string.' });
        return;
      }

      const job = await jobMatchingService.createJobDescription(userId, {
        title,
        company,
        location,
        employmentType,
        sourceUrl,
        rawDescription,
      }, (req as any).user);

      let matchResult = null;
      if (autoMatch !== false) {
        matchResult = await jobMatchingService.initiateJobMatch(userId, job.id, (req as any).user);
      }

      res.status(201).json({
        job,
        matchTask: matchResult,
      });
    } catch (err: any) {
      logger.system.error(`JobController.createJob failed: ${err.message}`);
      const statusCode = err instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getUserJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId((req as any).user);
      const jobs = await jobMatchingService.getUserJobDescriptions(userId, (req as any).user);
      res.json({ jobs });
    } catch (err: any) {
      logger.system.error(`JobController.getUserJobs failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  }

  public async getJobById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const job = await jobMatchingService.getJobDescriptionById(id, (req as any).user);
      res.json(job);
    } catch (err: any) {
      logger.system.error(`JobController.getJobById failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await jobMatchingService.deleteJobDescription(id, (req as any).user);
      res.status(200).json({ message: 'Job description deleted successfully' });
    } catch (err: any) {
      logger.system.error(`JobController.deleteJob failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async initiateMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = requireUserId((req as any).user);
      const result = await jobMatchingService.initiateJobMatch(userId, id, (req as any).user);
      res.status(202).json(result);
    } catch (err: any) {
      logger.system.error(`JobController.initiateMatch failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : err instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getJobMatchReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const match = await jobMatchingService.getJobMatchReport(id, (req as any).user);
      res.json(match);
    } catch (err: any) {
      logger.system.error(`JobController.getJobMatchReport failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getMatchById(req: Request, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const match = await jobMatchingService.getJobMatchById(matchId, (req as any).user);
      res.json(match);
    } catch (err: any) {
      logger.system.error(`JobController.getMatchById failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async calculateReadiness(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id || req.params.jobId;
      const userId = requireUserId((req as any).user);
      const report = await jobReadinessService.calculateJobReadiness(userId, jobId, (req as any).user);
      res.status(202).json(report);
    } catch (err: any) {
      logger.system.error(`JobController.calculateReadiness failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : err instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getReadiness(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id || req.params.jobId;
      const userId = requireUserId((req as any).user);
      const report = await jobReadinessService.getLatestReadiness(userId, jobId, (req as any).user);
      res.json(report);
    } catch (err: any) {
      logger.system.error(`JobController.getReadiness failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getReadinessGaps(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id || req.params.jobId;
      const userId = requireUserId((req as any).user);
      const gaps = await jobReadinessService.getReadinessGaps(userId, jobId, (req as any).user);
      res.json(gaps);
    } catch (err: any) {
      logger.system.error(`JobController.getReadinessGaps failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getReadinessRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id || req.params.jobId;
      const userId = requireUserId((req as any).user);
      const recs = await jobReadinessService.getReadinessRecommendations(userId, jobId, (req as any).user);
      res.json(recs);
    } catch (err: any) {
      logger.system.error(`JobController.getReadinessRecommendations failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async runWhatIfAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.id || req.params.jobId;
      const userId = requireUserId((req as any).user);
      const result = await jobReadinessService.runWhatIfAnalysis(userId, jobId, req.body, (req as any).user);
      res.json(result);
    } catch (err: any) {
      logger.system.error(`JobController.runWhatIfAnalysis failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  // ==========================================
  // PART 19 — COMPANY-SPECIFIC PREPARATION
  // ==========================================

  public async generateCompanyPreparation(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.jobId || req.params.id;
      const userId = requireUserId((req as any).user);
      const result = await companyPreparationService.generateCompanyPreparation(
        userId,
        jobId,
        (req as any).user,
        req.body
      );
      res.status(201).json(result);
    } catch (err: any) {
      logger.system.error(`JobController.generateCompanyPreparation failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : err instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getCompanyPreparation(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.jobId || req.params.id;
      const userId = requireUserId((req as any).user);
      const result = await companyPreparationService.getCompanyPreparation(userId, jobId, (req as any).user);
      res.json(result);
    } catch (err: any) {
      logger.system.error(`JobController.getCompanyPreparation failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getCompanyPreparationTopics(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.jobId || req.params.id;
      const userId = requireUserId((req as any).user);
      const result = await companyPreparationService.getCompanyPreparationTopics(userId, jobId, (req as any).user);
      res.json(result);
    } catch (err: any) {
      logger.system.error(`JobController.getCompanyPreparationTopics failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async getCompanyPreparationRoadmap(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.jobId || req.params.id;
      const userId = requireUserId((req as any).user);
      const result = await companyPreparationService.getCompanyPreparationRoadmap(userId, jobId, (req as any).user);
      res.json(result);
    } catch (err: any) {
      logger.system.error(`JobController.getCompanyPreparationRoadmap failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }

  public async refreshCompanyPreparation(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.jobId || req.params.id;
      const userId = requireUserId((req as any).user);
      const result = await companyPreparationService.generateCompanyPreparation(
        userId,
        jobId,
        (req as any).user,
        req.body
      );
      res.json(result);
    } catch (err: any) {
      logger.system.error(`JobController.refreshCompanyPreparation failed: ${err.message}`);
      const statusCode = err instanceof NotFoundError ? 404 : err instanceof BadRequestError ? 400 : 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
}

export const jobController = new JobController();
