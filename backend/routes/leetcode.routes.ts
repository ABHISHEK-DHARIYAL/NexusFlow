import { Router } from 'express';
import { leetCodeController } from '../controllers/LeetCodeController';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Protect all LeetCode routes with auth middleware
router.use(requireAuth);

router.post('/connect', asyncHandler(leetCodeController.connectProfile));
router.post('/sync', asyncHandler(leetCodeController.syncData));

router.get('/profile', asyncHandler(leetCodeController.getProfile));
router.get('/statistics', asyncHandler(leetCodeController.getStatistics));
router.get('/contests', asyncHandler(leetCodeController.getContests));
router.get('/analysis', asyncHandler(leetCodeController.getAnalysis));

export default router;
