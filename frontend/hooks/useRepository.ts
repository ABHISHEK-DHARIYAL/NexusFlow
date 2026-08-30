import { useState, useEffect, useCallback } from 'react';
import { repositoryService } from '../services/repository.service';
import { Repository, AIAnalysisReport, Task } from '../types';

export const useRepository = (id: string | undefined) => {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [latestReport, setLatestReport] = useState<AIAnalysisReport | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepo = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await repositoryService.getRepositoryById(id);
      setRepository(data.repository);
      setLatestReport(data.latestReport);
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repository details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRepo();
  }, [fetchRepo]);

  const syncRepository = async () => {
    if (!id) return;
    const res = await repositoryService.syncRepository(id);
    setRepository(res.repository);
    return res;
  };

  return { repository, latestReport, tasks, isLoading, error, refetch: fetchRepo, syncRepository };
};
