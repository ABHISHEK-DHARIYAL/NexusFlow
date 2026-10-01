import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/task.service';
import { Task, TaskExecutionLog } from '../types';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch queue tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const cancelTask = async (taskId: string) => {
    const updated = await taskService.cancelTask(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    return updated;
  };

  const retryTask = async (taskId: string) => {
    const updated = await taskService.retryTask(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    return updated;
  };

  const getTaskLogs = async (taskId: string): Promise<TaskExecutionLog[]> => {
    return taskService.getTaskLogs(taskId);
  };

  return { tasks, isLoading, error, refetch: fetchTasks, cancelTask, retryTask, getTaskLogs };
};
