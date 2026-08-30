import { taskService } from './task.service';
import { Task } from '../types';

export const queueService = {
  async getQueueTasks(): Promise<Task[]> {
    return taskService.getTasks();
  },

  async cancelTask(taskId: string): Promise<Task> {
    return taskService.cancelTask(taskId);
  },

  async retryTask(taskId: string): Promise<Task> {
    return taskService.retryTask(taskId);
  },
};
