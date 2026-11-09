import { Request, Response } from 'express';
import { aiAnalysisService } from '../services/AIAnalysisService';
import { ApiResponse } from '../types';
import { UnauthorizedError } from '../utils/errors';

export class AIReportController {
  triggerRepositoryAnalysis = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const repositoryId = req.params.id || req.body.repositoryId;
    const result = await aiAnalysisService.triggerAnalysis(req.user.id, repositoryId);

    const response: ApiResponse<any> = {
      success: true,
      message: 'AI repository analysis queued successfully',
      data: result,
    };

    res.status(202).json(response);
  };

  triggerAnalysis = this.triggerRepositoryAnalysis;

  getUserReports = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const reports = await aiAnalysisService.getUserReports(req.user.id);

    const response: ApiResponse<any> = {
      success: true,
      data: reports,
    };

    res.json(response);
  };

  getRepositoryAnalyses = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const repositoryId = req.params.id || req.params.repoId;
    const reports = await aiAnalysisService.getReportsByRepositoryId(req.user.id, repositoryId);

    const response: ApiResponse<any> = {
      success: true,
      data: reports,
    };

    res.json(response);
  };

  getReportsByRepoId = this.getRepositoryAnalyses;

  getReportById = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const reportId = req.params.analysisId || req.params.id;
    const report = await aiAnalysisService.getReportById(req.user.id, reportId);

    const response: ApiResponse<any> = {
      success: true,
      data: report,
    };

    res.json(response);
  };

  getReportFindings = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const reportId = req.params.analysisId || req.params.id;
    const findings = await aiAnalysisService.getReportFindings(req.user.id, reportId);

    const response: ApiResponse<any> = {
      success: true,
      data: findings,
    };

    res.json(response);
  };
}
