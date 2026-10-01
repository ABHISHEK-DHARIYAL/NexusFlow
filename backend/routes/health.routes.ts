import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const healthController = new HealthController();

router.get('/health', asyncHandler(healthController.getHealth));

export default router;
