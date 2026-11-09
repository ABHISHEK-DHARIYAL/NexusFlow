import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.use(requireAuth);

router.get('/', asyncHandler(controller.getNotifications));
router.post('/:id/read', asyncHandler(controller.markAsRead));
router.post('/read-all', asyncHandler(controller.markAllAsRead));

export default router;
