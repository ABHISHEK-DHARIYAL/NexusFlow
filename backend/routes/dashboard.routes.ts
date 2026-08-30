import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const controller = new DashboardController();

// Require auth on all dashboard endpoints
router.use(requireAuth);

router.get('/summary', asyncHandler(controller.getSummary));
router.get('/overview', asyncHandler(controller.getOverview));
router.get('/strengths', asyncHandler(controller.getStrengths));
router.get('/gaps', asyncHandler(controller.getGaps));
router.get('/actions', asyncHandler(controller.getActions));
router.get('/timeline', asyncHandler(controller.getTimeline));

export default router;
