import { apiClient } from './apiClient';
import { Task, TaskExecutionLog, ApiResponse } from '../types';

export const taskService = {
  async getTasks(): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]> | { tasks: Task[] }>('/tasks');
    if ('data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return (response.data as { tasks: Task[] }).tasks || [];
  },

  async getTaskLogs(taskId: string): Promise<TaskExecutionLog[]> {
    const response = await apiClient.get<ApiResponse<TaskExecutionLog[]> | { logs: TaskExecutionLog[] }>(
      `/tasks/${taskId}/logs`
    );
    if ('data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return (response.data as { logs: TaskExecutionLog[] }).logs || [];
  },

  async createTask(repositoryId: string, taskType: string, priority: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task> | { task: Task }>('/tasks', {
      repositoryId,
      taskType,
      priority,
    });
    if ('task' in response.data) {
      return response.data.task;
    }
    return response.data.data;
  },

  async cancelTask(taskId: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task> | { task: Task }>(`/tasks/${taskId}/cancel`);
    if ('task' in response.data) {
      return response.data.task;
    }
    return response.data.data;
  },

  async retryTask(taskId: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task> | { task: Task }>(`/tasks/${taskId}/retry`);
    if ('task' in response.data) {
      return response.data.task;
    }
    return response.data.data;
  },
};
