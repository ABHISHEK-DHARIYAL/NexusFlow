import { apiClient } from './apiClient';
import { Worker, WorkerMetrics, ApiResponse } from '../types';

export const workerService = {
  async getWorkers(): Promise<Worker[]> {
    const response = await apiClient.get<ApiResponse<Worker[]> | { workers: Worker[] }>('/workers');
    if ('data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return (response.data as { workers: Worker[] }).workers || [];
  },

  async getWorkerMetrics(): Promise<WorkerMetrics[]> {
    const response = await apiClient.get<ApiResponse<WorkerMetrics[]> | { metrics: WorkerMetrics[] }>(
      '/workers/metrics'
    );
    if ('data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return (response.data as { metrics: WorkerMetrics[] }).metrics || [];
  },

  async scaleWorkerThreads(workerId: string, maxThreads: number): Promise<Worker> {
    const response = await apiClient.post<ApiResponse<Worker> | { worker: Worker }>(
      '/workers/scale',
      { workerId, maxThreads }
    );
    if ('worker' in response.data) {
      return response.data.worker;
    }
    return response.data.data;
  },
};
