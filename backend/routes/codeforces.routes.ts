import { Router } from 'express';
import { codeforcesController } from '../controllers/CodeforcesController';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Protect all Codeforces routes with authentication middleware
router.use(requireAuth);

router.post('/connect', asyncHandler(codeforcesController.connectProfile));
router.post('/sync', asyncHandler(codeforcesController.syncData));

router.get('/profile', asyncHandler(codeforcesController.getProfile));
router.get('/statistics', asyncHandler(codeforcesController.getStatistics));
router.get('/contests', asyncHandler(codeforcesController.getContests));
router.get('/analysis', asyncHandler(codeforcesController.getAnalysis));

export default router;
