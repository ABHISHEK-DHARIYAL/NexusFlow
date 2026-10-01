import { Router } from 'express';
import { RepositoryController } from '../controllers/RepositoryController';
import { AIReportController } from '../controllers/AIReportController';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const repoController = new RepositoryController();
const reportController = new AIReportController();

// All repository routes require authentication
router.use(requireAuth);

router.get('/', asyncHandler(repoController.getRepositories));
router.get('/:id', asyncHandler(repoController.getRepositoryById));
router.post('/connect', asyncHandler(repoController.connectRepository));
router.post('/import', asyncHandler(repoController.importRepository));

// Sync & AI Analysis Actions
router.post('/:id/sync', asyncHandler(repoController.syncRepository));
router.get('/:id/sync/:syncId', asyncHandler(repoController.getSyncStatus));
router.post('/:id/analyze', asyncHandler(reportController.triggerRepositoryAnalysis));
router.get('/:id/analyses', asyncHandler(reportController.getRepositoryAnalyses));

// Repository Data & Sub-resources
router.get('/:id/files', asyncHandler(repoController.getFiles));
router.get('/:id/branches', asyncHandler(repoController.getBranches));
router.get('/:id/commits', asyncHandler(repoController.getCommits));
router.get('/:id/contributors', asyncHandler(repoController.getContributors));
router.get('/:id/issues', asyncHandler(repoController.getIssues));
router.get('/:id/pulls', asyncHandler(repoController.getPullRequests));
router.get('/:id/languages', asyncHandler(repoController.getLanguages));

router.delete('/:id', asyncHandler(repoController.deleteRepository));

export default router;
