import { Request, Response } from 'express';
import { careerReportService } from '../services/CareerReportService';
import { aiAnalysisService } from '../services/AIAnalysisService';
import { UnauthorizedError } from '../utils/errors';

export class CareerReportController {
  generateReport = async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const { type, title } = req.body;
    const report = await careerReportService.generateReport({
      userId: req.user.id,
      type: type || 'CAREER',
      title,
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  };

  getUserReports = async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const type = req.query.type as string;
    const careerReports = await careerReportService.getUserReports(req.user.id, type);
    
    // Also include repository analysis reports if no specific type filter or type is REPO
    let repoReports: any[] = [];
    if (!type || type.toUpperCase() === 'GITHUB' || type.toUpperCase() === 'REPO') {
      try {
        repoReports = await aiAnalysisService.getUserReports(req.user.id);
      } catch (err) {
        repoReports = [];
      }
    }

    res.json({
      success: true,
      data: {
        careerReports,
        repoReports,
        all: [
          ...careerReports,
          ...repoReports.map((rr) => ({
            id: rr.id,
            userId: req.user!.id,
            title: `Repository Analysis: ${rr.repository?.name || 'Codebase'}`,
            type: 'GITHUB',
            summary: rr.summary,
            scores: { overallScore: rr.overallScore, securityScore: rr.securityScore },
            createdAt: rr.createdAt,
            updatedAt: rr.analyzedAt,
          })),
        ],
      },
    });
  };

  getReportById = async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const reportId = req.params.id || req.params.analysisId;

    try {
      const careerReport = await careerReportService.getReportById(reportId, req.user.id);
      res.json({
        success: true,
        data: careerReport,
      });
      return;
    } catch (err: any) {
      // If not found in career reports, fallback to repo analysis report
      if (err.name === 'NotFoundError') {
        const repoReport = await aiAnalysisService.getReportById(req.user.id, reportId);
        res.json({
          success: true,
          data: repoReport,
        });
        return;
      }
      throw err;
    }
  };

  refreshReport = async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const reportId = req.params.id || req.params.analysisId;
    const refreshed = await careerReportService.refreshReport(reportId, req.user.id);

    res.json({
      success: true,
      message: 'Report refreshed with latest intelligence metrics',
      data: refreshed,
    });
  };

  exportReportHtml = async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }

    const reportId = req.params.id || req.params.analysisId;
    const report = await careerReportService.getReportById(reportId, req.user.id);
    const html = careerReportService.generatePrintHtml(report);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  };
}

export const careerReportController = new CareerReportController();
