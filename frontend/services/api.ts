import { authService } from './auth.service';
import { userService } from './user.service';
import { repositoryService } from './repository.service';
import { dashboardService } from './dashboard.service';
import { taskService } from './task.service';
import { workerService } from './worker.service';
import { analysisService } from './analysis.service';
import { notificationService } from './notification.service';
import { settingsService } from './settings.service';

export {
  apiClient,
  API_URL,
  setMemoryAccessToken,
  getMemoryAccessToken,
} from './apiClient';

export {
  authService,
  userService,
  repositoryService,
  dashboardService,
  taskService,
  workerService,
  analysisService,
  notificationService,
  settingsService,
};

export const api = {
  // Auth
  getMe: () => authService.getMe(),
  getSession: () => authService.getSession(),
  login: () => authService.loginWithGithub(),
  logout: () => authService.logout(),

  // Dashboard
  getDashboardSummary: () => dashboardService.getSummary(),

  // Repositories
  getRepositories: () => repositoryService.getRepositories(),
  getRepository: (id: string) => repositoryService.getRepositoryById(id),
  importRepository: (data: {
    fullName: string;
    description?: string;
    language?: string;
    visibility?: string;
  }) => repositoryService.importRepository(data),
  syncRepository: (id: string) => repositoryService.syncRepository(id),

  // Tasks
  getTasks: () => taskService.getTasks(),
  getTaskLogs: (taskId: string) => taskService.getTaskLogs(taskId),
  createTask: (repositoryId: string, taskType: string, priority: string) =>
    taskService.createTask(repositoryId, taskType, priority),
  cancelTask: (taskId: string) => taskService.cancelTask(taskId),
  retryTask: (taskId: string) => taskService.retryTask(taskId),

  // Workers
  getWorkers: () => workerService.getWorkers(),
  getWorkerMetrics: () => workerService.getWorkerMetrics(),
  scaleWorkerThreads: (workerId: string, maxThreads: number) =>
    workerService.scaleWorkerThreads(workerId, maxThreads),

  // Reports
  getReports: () => analysisService.getReports(),
  getReport: (reportId: string) => analysisService.getReportById(reportId),
  triggerAnalysis: (repositoryId: string, taskType?: string) =>
    analysisService.triggerAnalysis(repositoryId, taskType),

  // Notifications
  getNotifications: () => notificationService.getNotifications(),
  markNotificationRead: (id: string) => notificationService.markAsRead(id),
  markAllNotificationsRead: () => notificationService.markAllAsRead(),
};
