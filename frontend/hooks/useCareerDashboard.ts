import { useState, useEffect, useCallback } from 'react';
import { careerDashboardService } from '../services/careerDashboard.service';
import { UnifiedCareerOverviewDTO } from '../../backend/services/UnifiedCareerDashboardService';

export const useCareerDashboard = () => {
  const [data, setData] = useState<UnifiedCareerOverviewDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await careerDashboardService.getOverview();
      setData(overview);
    } catch (err: any) {
      setError(err.message || 'Failed to load unified career dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchOverview,
  };
};
