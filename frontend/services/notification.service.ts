import { apiClient } from './apiClient';
import { Notification, ApiResponse } from '../types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<ApiResponse<Notification[]> | { notifications: Notification[] }>(
      '/notifications'
    );
    if ('data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return (response.data as { notifications: Notification[] }).notifications || [];
  },

  async markAsRead(id: string): Promise<boolean> {
    const response = await apiClient.post<{ success: boolean }>(`/notifications/${id}/read`);
    return response.data.success;
  },

  async markAllAsRead(): Promise<boolean> {
    const response = await apiClient.post<{ success: boolean }>('/notifications/read-all');
    return response.data.success;
  },
};
