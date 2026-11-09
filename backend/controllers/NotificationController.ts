import { Request, Response } from 'express';
import { notificationRepository } from '../repositories/NotificationRepository';
import { UnauthorizedError } from '../utils/errors';
import { ApiResponse } from '../types';

export class NotificationController {
  getNotifications = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const notifications = await notificationRepository.findByUserId(req.user.id);
    const response: ApiResponse = { success: true, data: notifications };
    res.json(response);
  };

  markAsRead = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const success = await notificationRepository.markAsRead(req.params.id, req.user.id);
    res.json({ success });
  };

  markAllAsRead = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    const success = await notificationRepository.markAllAsRead(req.user.id);
    res.json({ success });
  };
}
