import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRequest } from '../middleware/validateRequest';
import { createTaskSchema, updateTaskStatusSchema } from '../validations/task.validation';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const taskController = new TaskController();

router.use(requireAuth);

router.get('/', asyncHandler(taskController.getTasks));
router.get('/:id', asyncHandler(taskController.getTaskById));
router.post('/', validateRequest(createTaskSchema), asyncHandler(taskController.createTask));
router.patch('/:id/status', validateRequest(updateTaskStatusSchema), asyncHandler(taskController.updateTaskStatus));
router.post('/:id/cancel', asyncHandler(taskController.cancelTask));
router.post('/:id/retry', asyncHandler(taskController.retryTask));
router.get('/:id/logs', asyncHandler(taskController.getTaskLogs));
router.delete('/:id', asyncHandler(taskController.deleteTask));

export default router;
