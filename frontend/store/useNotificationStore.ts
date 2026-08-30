import { create } from 'zustand';
import { Notification } from '../types';
import { mockNotifications } from '../mocks/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Partial<Notification>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.isRead).length,
  addNotification: (notification: Partial<Notification>) =>
    set((state) => {
      const newNotif: Notification = {
        id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: notification.userId || 'user-1',
        type: notification.type || 'ANALYSIS_READY',
        title: notification.title || 'Real-time Event',
        message: notification.message || '',
        isRead: false,
        createdAt: new Date().toISOString(),
        ...notification,
      };
      const updated = [newNotif, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    }),
  markAsRead: (id: string) =>
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  deleteNotification: (id: string) =>
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    }),
}));
