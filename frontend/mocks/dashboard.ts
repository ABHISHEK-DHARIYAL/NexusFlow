import { DashboardSummary } from '../types';

export const mockDashboardSummary: DashboardSummary = {
  totalRepositories: 5,
  activeTasks: 1,
  queuedTasks: 1,
  completedTasks24h: 18,
  activeWorkers: 3,
  avgHealthScore: 87.2,
  criticalSecurityIssues: 1,
  totalThroughputPerMin: 52.7,
};

export const mockHealthTrends = [
  { date: 'Aug 03', healthScore: 81, securityScore: 80, performanceScore: 84 },
  { date: 'Aug 04', healthScore: 83, securityScore: 82, performanceScore: 85 },
  { date: 'Aug 05', healthScore: 82, securityScore: 80, performanceScore: 86 },
  { date: 'Aug 06', healthScore: 85, securityScore: 84, performanceScore: 88 },
  { date: 'Aug 07', healthScore: 84, securityScore: 82, performanceScore: 87 },
  { date: 'Aug 08', healthScore: 86, securityScore: 85, performanceScore: 90 },
  { date: 'Aug 09', healthScore: 87, securityScore: 88, performanceScore: 92 },
];

export const mockTaskExecutionStats = [
  { time: '00:00', completed: 12, failed: 0, queued: 2 },
  { time: '04:00', completed: 8, failed: 1, queued: 1 },
  { time: '08:00', completed: 24, failed: 0, queued: 4 },
  { time: '12:00', completed: 32, failed: 2, queued: 3 },
  { time: '16:00', completed: 28, failed: 0, queued: 2 },
  { time: '20:00', completed: 19, failed: 1, queued: 1 },
];

export const mockWorkerUtilizationStats = [
  { name: 'wrk_java_01', cpu: 64.2, memory: 51.2, threads: 18 },
  { name: 'wrk_java_02', cpu: 12.5, memory: 25.6, threads: 2 },
  { name: 'wrk_java_03', cpu: 88.4, memory: 78.0, threads: 28 },
  { name: 'wrk_java_04', cpu: 99.1, memory: 98.7, threads: 0 },
];
