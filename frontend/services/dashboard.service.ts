import { apiClient } from './apiClient';
import { DashboardSummary, ApiResponse } from '../types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary | ApiResponse<DashboardSummary>>(
      '/dashboard/summary'
    );
    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as DashboardSummary;
  },
};
