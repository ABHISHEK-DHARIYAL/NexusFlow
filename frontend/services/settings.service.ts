import { apiClient } from './apiClient';
import { ApiResponse } from '../types';

export interface UserSettings {
  emailNotifications: boolean;
  autoRetryFailedTasks: boolean;
  theme: 'dark' | 'light' | 'system';
}

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    try {
      const response = await apiClient.get<ApiResponse<UserSettings>>('/v1/settings');
      return response.data.data;
    } catch {
      // Fallback for local settings defaults
      return {
        emailNotifications: true,
        autoRetryFailedTasks: true,
        theme: 'dark',
      };
    }
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const response = await apiClient.put<ApiResponse<UserSettings>>('/v1/settings', settings);
      return response.data.data;
    } catch {
      return {
        emailNotifications: settings.emailNotifications ?? true,
        autoRetryFailedTasks: settings.autoRetryFailedTasks ?? true,
        theme: settings.theme ?? 'dark',
      };
    }
  },
};
