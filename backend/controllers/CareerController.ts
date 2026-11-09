import { Request, Response } from 'express';
import { careerCoachService } from '../services/CareerCoachService';
import {
  CreateChatInputSchema,
  SendMessageInputSchema,
  StartInterviewInputSchema,
  SubmitAnswerInputSchema,
} from '../validations/career.validation';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { requireUserId } from '../utils/ownership';
import { logger } from '../logger';

export class CareerController {
  /**
   * POST /api/career/chats
   */
  public async createChat(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = requireUserId(authUser);

      const parsed = CreateChatInputSchema.parse(req.body);
      const chat = await careerCoachService.createChat(
        userId,
        parsed.mode,
        parsed.jobId,
        parsed.title,
        parsed.initialMessage,
        authUser
      );

      res.status(201).json(chat);
    } catch (err: any) {
      logger.ai.error(`Error creating career chat: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to create career chat' });
    }
  }

  /**
   * GET /api/career/chats
   */
  public async getUserChats(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = requireUserId(authUser);

      const chats = await careerCoachService.getUserChats(userId, authUser);
      res.json(chats);
    } catch (err: any) {
      logger.ai.error(`Error fetching career chats: ${err.message}`);
      res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch career chats' });
    }
  }

  /**
   * GET /api/career/chats/:chatId
   */
  public async getChatById(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { chatId } = req.params;

      const chat = await careerCoachService.getChatById(chatId, authUser);
      res.json(chat);
    } catch (err: any) {
      logger.ai.error(`Error fetching chat ${req.params.chatId}: ${err.message}`);
      res.status(err.statusCode || 404).json({ error: err.message || 'Chat not found' });
    }
  }

  /**
   * POST /api/career/chats/:chatId/messages
   */
  public async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { chatId } = req.params;
      const userId = requireUserId(authUser);

      const parsed = SendMessageInputSchema.parse(req.body);
      const message = await careerCoachService.sendMessage(
        userId,
        chatId,
        parsed.message,
        parsed.jobId,
        parsed.mode,
        authUser
      );

      res.status(201).json(message);
    } catch (err: any) {
      logger.ai.error(`Error sending message in chat ${req.params.chatId}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to send message' });
    }
  }

  /**
   * DELETE /api/career/chats/:chatId
   */
  public async deleteChat(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { chatId } = req.params;

      await careerCoachService.deleteChat(chatId, authUser);
      res.json({ message: 'Career chat deleted successfully' });
    } catch (err: any) {
      logger.ai.error(`Error deleting chat ${req.params.chatId}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to delete chat' });
    }
  }

  /**
   * GET /api/career/metrics
   */
  public async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = requireUserId(authUser);

      const metrics = await careerCoachService.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (err: any) {
      logger.ai.error(`Error fetching career metrics: ${err.message}`);
      res.status(500).json({ error: err.message || 'Failed to fetch career metrics' });
    }
  }

  /**
   * POST /api/career/interviews
   */
  public async startInterviewSession(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = requireUserId(authUser);

      const parsed = StartInterviewInputSchema.parse(req.body);
      const session = await careerCoachService.startInterviewSession(
        userId,
        parsed.jobId,
        parsed.interviewType,
        parsed.difficulty,
        authUser
      );

      res.status(201).json(session);
    } catch (err: any) {
      logger.ai.error(`Error starting interview session: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to start interview session' });
    }
  }

  /**
   * GET /api/career/interviews
   */
  public async getUserInterviews(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userId = requireUserId(authUser);

      const sessions = await careerCoachService.getUserInterviews(userId, authUser);
      res.json(sessions);
    } catch (err: any) {
      logger.ai.error(`Error fetching interview sessions: ${err.message}`);
      res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch interview sessions' });
    }
  }

  /**
   * GET /api/career/interviews/:sessionId
   */
  public async getInterviewSession(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { sessionId } = req.params;

      const session = await careerCoachService.getInterviewSession(sessionId, authUser);
      res.json(session);
    } catch (err: any) {
      logger.ai.error(`Error fetching interview session ${req.params.sessionId}: ${err.message}`);
      res.status(err.statusCode || 404).json({ error: err.message || 'Interview session not found' });
    }
  }

  /**
   * POST /api/career/interviews/:sessionId/answer
   */
  public async submitAnswer(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { sessionId } = req.params;

      const parsed = SubmitAnswerInputSchema.parse(req.body);
      const result = await careerCoachService.submitAnswer(
        sessionId,
        parsed.questionId,
        parsed.userResponse,
        authUser
      );

      res.json(result);
    } catch (err: any) {
      logger.ai.error(`Error submitting answer in interview ${req.params.sessionId}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to submit answer' });
    }
  }

  /**
   * POST /api/career/interviews/:sessionId/finish
   */
  public async finishInterviewSession(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { sessionId } = req.params;

      const session = await careerCoachService.finishInterviewSession(sessionId, authUser);
      res.json(session);
    } catch (err: any) {
      logger.ai.error(`Error finishing interview session ${req.params.sessionId}: ${err.message}`);
      res.status(err.statusCode || 400).json({ error: err.message || 'Failed to finish interview session' });
    }
  }
}

export const careerController = new CareerController();
