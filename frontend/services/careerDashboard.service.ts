import { apiClient } from './apiClient';
import { UnifiedCareerOverviewDTO } from '../../backend/services/UnifiedCareerDashboardService';

export const careerDashboardService = {
  async getOverview(): Promise<UnifiedCareerOverviewDTO> {
    const response = await apiClient.get<UnifiedCareerOverviewDTO>('/dashboard/overview');
    return response.data;
  },

  async getStrengths() {
    const response = await apiClient.get('/dashboard/strengths');
    return response.data;
  },

  async getGaps() {
    const response = await apiClient.get('/dashboard/gaps');
    return response.data;
  },

  async getActions() {
    const response = await apiClient.get('/dashboard/actions');
    return response.data;
  },

  async getTimeline() {
    const response = await apiClient.get('/dashboard/timeline');
    return response.data;
  },

  async generateReport(type: string, title?: string) {
    const response = await apiClient.post('/reports/generate', { type, title });
    return response.data;
  },

  async getUserReports(type?: string) {
    const response = await apiClient.get('/reports', { params: { type } });
    return response.data;
  },

  async getReportById(id: string) {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  },

  async refreshReport(id: string) {
    const response = await apiClient.post(`/reports/${id}/refresh`);
    return response.data;
  },

  getExportUrl(id: string) {
    return `/api/reports/${id}/export`;
  },
};
