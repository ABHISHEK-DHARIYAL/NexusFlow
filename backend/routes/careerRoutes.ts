import { Router } from 'express';
import { careerController } from '../controllers/CareerController';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Career Coach Chat Endpoints
router.post('/chats', requireAuth, (req, res) => careerController.createChat(req, res));
router.get('/chats', requireAuth, (req, res) => careerController.getUserChats(req, res));
router.get('/chats/:chatId', requireAuth, (req, res) => careerController.getChatById(req, res));
router.post('/chats/:chatId/messages', requireAuth, (req, res) => careerController.sendMessage(req, res));
router.delete('/chats/:chatId', requireAuth, (req, res) => careerController.deleteChat(req, res));

// Career Dashboard Metrics
router.get('/metrics', requireAuth, (req, res) => careerController.getDashboardMetrics(req, res));

// Mock Interview Endpoints
router.post('/interviews', requireAuth, (req, res) => careerController.startInterviewSession(req, res));
router.get('/interviews', requireAuth, (req, res) => careerController.getUserInterviews(req, res));
router.get('/interviews/:sessionId', requireAuth, (req, res) => careerController.getInterviewSession(req, res));
router.post('/interviews/:sessionId/answer', requireAuth, (req, res) => careerController.submitAnswer(req, res));
router.post('/interviews/:sessionId/finish', requireAuth, (req, res) => careerController.finishInterviewSession(req, res));

export default router;
