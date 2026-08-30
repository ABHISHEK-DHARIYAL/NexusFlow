import { apiClient } from './apiClient';
import { User, ApiResponse } from '../types';

export const userService = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User> | { user: User }>('/auth/me');
    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return (response.data as { user: User }).user;
  },

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(`/v1/users/${id}`, updates);
    return response.data.data;
  },
};
