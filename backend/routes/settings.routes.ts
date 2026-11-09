import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const controller = new SettingsController();

router.use(requireAuth);

router.get('/', asyncHandler(controller.getSettings));
router.put('/', asyncHandler(controller.updateSettings));

export default router;
