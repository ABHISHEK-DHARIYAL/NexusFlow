import { useState, useEffect, useCallback } from 'react';
import { repositoryService, GetRepositoriesParams } from '../services/repository.service';
import { Repository } from '../types';

export const useRepositories = (params?: GetRepositoriesParams) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await repositoryService.getRepositories(params);
      setRepositories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const importRepository = async (payload: { fullName: string; description?: string; language?: string; visibility?: string }) => {
    const res = await repositoryService.importRepository(payload);
    await fetchRepositories();
    return res;
  };

  return { repositories, isLoading, error, refetch: fetchRepositories, importRepository };
};
