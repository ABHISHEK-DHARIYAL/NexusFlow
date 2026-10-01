import { useState, useEffect, useCallback } from 'react';
import { leetCodeService, LeetCodeProfileResponse, LeetCodeContestsResponse, LeetCodeStatsResponse } from '../services/leetcode.service';
import { LeetCodeAnalysis } from '../types';

export const useLeetCode = () => {
  const [data, setData] = useState<LeetCodeProfileResponse | null>(null);
  const [stats, setStats] = useState<LeetCodeStatsResponse | null>(null);
  const [contests, setContests] = useState<LeetCodeContestsResponse | null>(null);
  const [analysis, setAnalysis] = useState<LeetCodeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeetCodeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profileRes = await leetCodeService.getProfile();
      setData(profileRes);

      const [statsRes, contestsRes, analysisRes] = await Promise.allSettled([
        leetCodeService.getStatistics(),
        leetCodeService.getContests(),
        leetCodeService.getAnalysis(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (contestsRes.status === 'fulfilled') setContests(contestsRes.value);
      if (analysisRes.status === 'fulfilled') setAnalysis(analysisRes.value);
    } catch (err: any) {
      setError(err.message || 'No LeetCode profile found');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeetCodeData();
  }, [fetchLeetCodeData]);

  const connectProfile = async (username: string) => {
    setIsSyncing(true);
    try {
      const res = await leetCodeService.connectProfile(username);
      await fetchLeetCodeData();
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncProfile = async () => {
    setIsSyncing(true);
    try {
      const res = await leetCodeService.syncData();
      await fetchLeetCodeData();
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    data,
    stats,
    contests,
    analysis,
    isLoading,
    isSyncing,
    error,
    refetch: fetchLeetCodeData,
    connectProfile,
    syncProfile,
  };
};
