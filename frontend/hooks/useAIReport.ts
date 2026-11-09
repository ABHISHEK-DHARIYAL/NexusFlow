import { useState, useEffect, useCallback } from 'react';
import { analysisService } from '../services/analysis.service';
import { AIAnalysisReport } from '../types';

export const useAIReport = (reportId?: string) => {
  const [report, setReport] = useState<AIAnalysisReport | null>(null);
  const [reports, setReports] = useState<AIAnalysisReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (reportId) {
        const data = await analysisService.getReportById(reportId);
        setReport(data);
      } else {
        const data = await analysisService.getReports();
        setReports(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI analysis report');
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const triggerAnalysis = async (repositoryId: string, taskType?: string) => {
    const res = await analysisService.triggerAnalysis(repositoryId, taskType);
    await fetchReportData();
    return res;
  };

  return { report, reports, isLoading, error, refetch: fetchReportData, triggerAnalysis };
};
