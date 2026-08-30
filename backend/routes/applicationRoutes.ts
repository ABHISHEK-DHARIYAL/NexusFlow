import { Router } from 'express';
import { applicationController } from '../controllers/ApplicationController';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// Stats
router.get('/stats', (req, res) => applicationController.getStats(req, res));

// Base CRUD
router.post('/', (req, res) => applicationController.create(req, res));
router.get('/', (req, res) => applicationController.list(req, res));
router.get('/:id', (req, res) => applicationController.getById(req, res));
router.patch('/:id', (req, res) => applicationController.update(req, res));
router.delete('/:id', (req, res) => applicationController.delete(req, res));

// Status lifecycle
router.post('/:id/status', (req, res) => applicationController.updateStatus(req, res));

// Timeline Events
router.post('/:id/events', (req, res) => applicationController.addEvent(req, res));
router.get('/:id/events', (req, res) => applicationController.getEvents(req, res));

// Follow-up reminders
router.post('/:id/follow-ups', (req, res) => applicationController.addFollowUp(req, res));
router.patch('/:id/follow-ups/:followUpId', (req, res) => applicationController.updateFollowUp(req, res));
router.delete('/:id/follow-ups/:followUpId', (req, res) => applicationController.deleteFollowUp(req, res));

// AI Follow-up draft
router.post('/:id/draft-followup', (req, res) => applicationController.draftFollowUp(req, res));

export default router;
