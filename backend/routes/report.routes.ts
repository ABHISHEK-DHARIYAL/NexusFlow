import { Router } from 'express';
import { AIReportController } from '../controllers/AIReportController';
import { careerReportController } from '../controllers/CareerReportController';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const aiReportController = new AIReportController();

// Require auth on all report routes
router.use(requireAuth);

// Career Report Endpoints
router.post('/generate', asyncHandler(careerReportController.generateReport));
router.get('/reports', asyncHandler(careerReportController.getUserReports));
router.post('/:id/refresh', asyncHandler(careerReportController.refreshReport));
router.get('/:id/export', asyncHandler(careerReportController.exportReportHtml));

// Repository Analysis Specific Routes
router.get('/report/:analysisId', asyncHandler(careerReportController.getReportById));
router.get('/report/:analysisId/findings', asyncHandler(aiReportController.getReportFindings));
router.get('/repository/:repoId', asyncHandler(aiReportController.getRepositoryAnalyses));
router.get('/repo/:repoId', asyncHandler(aiReportController.getRepositoryAnalyses));
router.post('/trigger', asyncHandler(aiReportController.triggerRepositoryAnalysis));

// Default collection endpoints
router.get('/', asyncHandler(careerReportController.getUserReports));
router.post('/', asyncHandler(careerReportController.generateReport));

// Dynamic ID routes last
router.get('/:id', asyncHandler(careerReportController.getReportById));
router.get('/:id/findings', asyncHandler(aiReportController.getReportFindings));

export default router;
