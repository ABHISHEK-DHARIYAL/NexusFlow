import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCareerDashboard } from '../hooks/useCareerDashboard';
import { ProfileHeaderBanner } from '../components/dashboard/ProfileHeaderBanner';
import { CareerSnapshotGrid } from '../components/dashboard/CareerSnapshotGrid';
import { NextBestActionCard } from '../components/dashboard/NextBestActionCard';
import { AiExecutiveSummaryCard } from '../components/dashboard/AiExecutiveSummaryCard';
import { UnifiedScorecard } from '../components/dashboard/UnifiedScorecard';
import { TopStrengthsGaps } from '../components/dashboard/TopStrengthsGaps';
import { DsaContestSummary } from '../components/dashboard/DsaContestSummary';
import { ProjectHealthGrid } from '../components/dashboard/ProjectHealthGrid';
import { JobReadinessTrackerCard } from '../components/dashboard/JobReadinessTrackerCard';
import { CareerTimelineCard } from '../components/dashboard/CareerTimelineCard';
import { AutomationSummaryCard } from '../components/dashboard/AutomationSummaryCard';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, FileText, Loader2, AlertCircle } from 'lucide-react';
import { careerDashboardService } from '../services/careerDashboard.service';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCareerDashboard();

  const handleGenerateReport = async () => {
    try {
      const res = await careerDashboardService.generateReport('CAREER', 'Unified Developer Career Report');
      if (res?.data?.id) {
        navigate(`/analysis/reports/${res.data.id}`);
      } else {
        navigate('/analysis/reports');
      }
    } catch (err) {
      navigate('/analysis/reports');
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Unified Career Intelligence Dashboard">
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm font-medium">Aggregating multi-vector career intelligence...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer title="Unified Career Intelligence Dashboard">
        <Card className="p-8 border-red-800/50 bg-red-950/20 text-red-200 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <div>
            <h3 className="font-bold text-base">Failed to load Unified Career Dashboard</h3>
            <p className="text-xs text-red-300 mt-1">{error || 'Unknown error occurred'}</p>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            Retry Loading
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Unified Developer Career Dashboard"
      description="Central intelligence aggregation across GitHub, LeetCode, Codeforces, Portfolio, Resume, Verification, and Jobs."
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateReport}
            leftIcon={<FileText className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
          >
            Export Career Report
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Profile Header & Integration Completeness */}
        <ProfileHeaderBanner
          user={data.user}
          completeness={data.profileCompleteness}
          freshness={data.dataFreshness}
          onRefresh={refetch}
          isRefreshing={isLoading}
        />

        {/* Top Level Metric Snapshot */}
        <CareerSnapshotGrid snapshot={data.careerSnapshot} />

        {/* Deterministic Next Best Action */}
        <NextBestActionCard action={data.nextBestAction} />

        {/* AI Executive Summary */}
        <AiExecutiveSummaryCard summary={data.aiCareerSummary} />

        {/* 8-Dimension Scorecard */}
        <UnifiedScorecard scorecard={data.scorecard} />

        {/* Top Strengths & Priority Gaps */}
        <TopStrengthsGaps strengths={data.topStrengths} gaps={data.topGaps} />

        {/* Automated Career Intelligence Scheduler */}
        <AutomationSummaryCard />

        {/* DSA & Competitive Programming Breakdown */}
        <DsaContestSummary leetcode={data.dsaSummary.leetcode} codeforces={data.dsaSummary.codeforces} />

        {/* Project Intelligence & Proof of Work */}
        <ProjectHealthGrid projects={data.projectIntelligence.projects} />

        {/* Target Job Readiness & Application Pipeline */}
        <JobReadinessTrackerCard jobOverview={data.jobOverview} pipeline={data.applicationPipeline} />

        {/* Career Activity Log */}
        <CareerTimelineCard timeline={data.careerTimeline} />
      </div>
    </PageContainer>
  );
};
