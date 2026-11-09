import { create } from 'zustand';
import { DashboardSummary } from '../types';
import { mockDashboardSummary, mockHealthTrends, mockTaskExecutionStats, mockWorkerUtilizationStats } from '../mocks/dashboard';

interface DashboardState {
  summary: DashboardSummary;
  healthTrends: typeof mockHealthTrends;
  taskStats: typeof mockTaskExecutionStats;
  workerUtilization: typeof mockWorkerUtilizationStats;
}

export const useDashboardStore = create<DashboardState>(() => ({
  summary: mockDashboardSummary,
  healthTrends: mockHealthTrends,
  taskStats: mockTaskExecutionStats,
  workerUtilization: mockWorkerUtilizationStats,
}));
