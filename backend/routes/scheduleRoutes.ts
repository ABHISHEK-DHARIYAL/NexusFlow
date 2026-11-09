import { Router } from 'express';
import { scheduleController } from '../controllers/ScheduleController';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Schedule CRUD & Controls
router.post('/', requireAuth, (req, res, next) => scheduleController.createSchedule(req, res, next));
router.get('/', requireAuth, (req, res, next) => scheduleController.getSchedules(req, res, next));
router.get('/summary', requireAuth, (req, res, next) => scheduleController.getAutomationSummary(req, res, next));
router.get('/templates', requireAuth, (req, res, next) => scheduleController.getAutomationTemplates(req, res, next));
router.get('/:id', requireAuth, (req, res, next) => scheduleController.getScheduleById(req, res, next));
router.patch('/:id', requireAuth, (req, res, next) => scheduleController.updateSchedule(req, res, next));
router.post('/:id/enable', requireAuth, (req, res, next) => scheduleController.enableSchedule(req, res, next));
router.post('/:id/disable', requireAuth, (req, res, next) => scheduleController.disableSchedule(req, res, next));
router.delete('/:id', requireAuth, (req, res, next) => scheduleController.deleteSchedule(req, res, next));
router.get('/:id/executions', requireAuth, (req, res, next) => scheduleController.getExecutions(req, res, next));
router.post('/:id/run-now', requireAuth, (req, res, next) => scheduleController.runNow(req, res, next));

export default router;
