import { useState, useEffect, useCallback } from 'react';
import { codeforcesService, CodeforcesStatsResponse } from '../services/codeforces.service';
import { CodeforcesAnalysis, CodeforcesContest, CodeforcesProfile } from '../types';

export const useCodeforces = () => {
  const [profile, setProfile] = useState<CodeforcesProfile | null>(null);
  const [stats, setStats] = useState<CodeforcesStatsResponse | null>(null);
  const [contests, setContests] = useState<CodeforcesContest[]>([]);
  const [analysis, setAnalysis] = useState<CodeforcesAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCodeforcesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statsRes = await codeforcesService.getStatistics();
      setProfile(statsRes.profile);
      setStats(statsRes);

      const [contestsRes, analysisRes] = await Promise.allSettled([
        codeforcesService.getContests(),
        codeforcesService.getAnalysis()
      ]);

      if (contestsRes.status === 'fulfilled') setContests(contestsRes.value);
      if (analysisRes.status === 'fulfilled') setAnalysis(analysisRes.value);
    } catch (err: any) {
      setError(err.message || 'No Codeforces profile connected');
      setProfile(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodeforcesData();
  }, [fetchCodeforcesData]);

  const connectProfile = async (handle: string) => {
    setIsSyncing(true);
    try {
      const res = await codeforcesService.connectProfile(handle);
      await fetchCodeforcesData();
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncProfile = async () => {
    setIsSyncing(true);
    try {
      const res = await codeforcesService.syncData();
      await fetchCodeforcesData();
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    profile,
    stats,
    metrics: stats?.metrics || null,
    contests,
    analysis,
    isLoading,
    isSyncing,
    error,
    refetch: fetchCodeforcesData,
    connectProfile,
    syncProfile
  };
};
