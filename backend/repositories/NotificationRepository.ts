import { prisma } from '../lib/prisma';

/**
 * Fix for a confirmed regression: NotificationsPage.tsx (a real, routed
 * frontend page at /notifications) calls GET /notifications,
 * POST /notifications/:id/read, and POST /notifications/read-all. These
 * were previously served only by an unauthenticated, in-memory mock in
 * server.ts that was removed as part of the security audit. The Prisma
 * schema already defines a real Notification model - nothing in the
 * backend ever used it. This wires it up using the existing model only.
 */
export class NotificationRepository {
  async findByUserId(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return result.count > 0;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return true;
  }
}

export const notificationRepository = new NotificationRepository();
