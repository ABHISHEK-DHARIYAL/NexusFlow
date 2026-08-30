import { apiClient } from './apiClient';
import { AIAnalysisReport, Repository, ApiResponse } from '../types';

export const analysisService = {
  async getReports(): Promise<AIAnalysisReport[]> {
    const response = await apiClient.get<ApiResponse<AIAnalysisReport[]> | { reports: AIAnalysisReport[] }>(
      '/analysis/reports'
    );
    if ('data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return (response.data as { reports: AIAnalysisReport[] }).reports || [];
  },

  async getReportById(reportId: string): Promise<AIAnalysisReport> {
    const response = await apiClient.get<ApiResponse<AIAnalysisReport> | { report: AIAnalysisReport }>(
      `/analysis/report/${reportId}`
    );
    if ('report' in response.data) {
      return response.data.report;
    }
    return response.data.data;
  },

  async getReportsByRepo(repoId: string): Promise<AIAnalysisReport[]> {
    const response = await apiClient.get<ApiResponse<AIAnalysisReport[]> | { reports: AIAnalysisReport[] }>(
      `/analysis/repo/${repoId}`
    );
    if ('data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return (response.data as { reports: AIAnalysisReport[] }).reports || [];
  },

  async triggerAnalysis(
    repositoryId: string,
    taskType?: string
  ): Promise<{ report: AIAnalysisReport; repository: Repository }> {
    const response = await apiClient.post<
      ApiResponse<{ report: AIAnalysisReport; repository: Repository }> | { report: AIAnalysisReport; repository: Repository }
    >('/analysis/trigger', { repositoryId, taskType });

    if ('report' in response.data) {
      return response.data;
    }
    return response.data.data;
  },
};
