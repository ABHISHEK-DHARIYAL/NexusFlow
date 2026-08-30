import { useState, useEffect, useCallback } from 'react';
import { workerService } from '../services/worker.service';
import { Worker, WorkerMetrics } from '../types';

export const useWorkers = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [metrics, setMetrics] = useState<WorkerMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [workersData, metricsData] = await Promise.all([
        workerService.getWorkers(),
        workerService.getWorkerMetrics(),
      ]);
      setWorkers(workersData);
      setMetrics(metricsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch worker statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkerData();
  }, [fetchWorkerData]);

  const scaleWorker = async (workerId: string, maxThreads: number) => {
    const updated = await workerService.scaleWorkerThreads(workerId, maxThreads);
    setWorkers((prev) => prev.map((w) => (w.id === workerId || w.workerId === workerId ? updated : w)));
    return updated;
  };

  return { workers, metrics, isLoading, error, refetch: fetchWorkerData, scaleWorker };
};
