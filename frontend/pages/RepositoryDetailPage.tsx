import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { ScoreGauge } from '../components/charts/ScoreGauge';
import { FindingCard } from '../components/analysis/FindingCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RepositoryDetailTabs } from '../components/repository/RepositoryDetailTabs';
import { useRepository, useAIReport } from '../hooks';
import {
  GitBranch,
  Play,
  RefreshCw,
  Star,
  GitFork,
  ShieldCheck,
  ListTodo,
  Loader2,
  AlertCircle,
  CheckCircle2,
  GitPullRequest,
} from 'lucide-react';

export const RepositoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState('findings');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { repository: repo, latestReport, tasks: repoTasks, isLoading, error, syncRepository, refetch } = useRepository(id);
  const { triggerAnalysis } = useAIReport();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncRepository();
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    try {
      await triggerAnalysis(id, 'FULL_SCAN');
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger AI analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderSyncBadge = () => {
    if (!repo) return null;
    const status = repo.syncStatus || 'SYNCED';
    switch (status) {
      case 'SYNCED':
        return (
          <Badge variant="emerald" size="md">
            <CheckCircle2 className="w-3 h-3 mr-1" /> SYNCED
          </Badge>
        );
      case 'SYNCING':
      case 'IMPORTING':
        return (
          <Badge variant="blue" size="md">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> SYNCING
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="rose" size="md">
            <AlertCircle className="w-3 h-3 mr-1" /> SYNC FAILED
          </Badge>
        );
      default:
        return (
          <Badge variant="slate" size="md">
            NOT SYNCED
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading Repository..." description="Fetching codebase details and metrics">
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span>Retrieving repository details from backend...</span>
        </div>
      </PageContainer>
    );
  }

  if (error || !repo) {
    return (
      <PageContainer title="Repository Not Found" description="The requested repository could not be located">
        <Card className="p-8 text-center space-y-4 max-w-lg mx-auto border-slate-800">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm text-slate-300">{error || 'Repository record not found.'}</p>
          <Button onClick={() => navigate('/repositories')} size="sm">
            Back to Repositories
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={repo.name}
      description={repo.description || 'No description provided for this repository.'}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSyncing}
            leftIcon={isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            onClick={handleSync}
          >
            {isSyncing ? 'Syncing...' : 'Sync Repository'}
          </Button>
          <Button
            size="sm"
            disabled={isAnalyzing}
            leftIcon={isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            onClick={handleRunAnalysis}
          >
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>
        </div>
      }
    >
      {/* Header Metrics Banner */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        <div className="flex items-center gap-4">
          <ScoreGauge score={repo.healthScore || 0} label="Overall Health" size="sm" />
          <div>
            <span className="text-xs text-slate-400 font-medium">Sync & Language</span>
            <div className="flex items-center gap-2 mt-1">
              {renderSyncBadge()}
              <span className="text-xs text-slate-300 font-mono">{repo.language || 'Code'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 my-auto">
          <span className="text-xs text-slate-400 font-medium">Git Stats</span>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-200 mt-1">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              {repo.starsCount} Stars
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {repo.forksCount} Forks
            </span>
          </div>
        </div>

        <div className="space-y-1 my-auto">
          <span className="text-xs text-slate-400 font-medium">Default Branch</span>
          <div className="flex items-center gap-1.5 text-xs font-mono text-blue-400 mt-1">
            <GitBranch className="w-4 h-4" />
            <span>{repo.defaultBranch}</span>
          </div>
        </div>

        <div className="space-y-1 my-auto">
          <span className="text-xs text-slate-400 font-medium">Last Synced</span>
          <div className="text-xs font-mono text-slate-300 mt-1">
            {repo.lastSyncedAt ? new Date(repo.lastSyncedAt).toLocaleString() : 'Never'}
          </div>
        </div>
      </Card>

      {/* Main Tabs Navigation */}
      <Tabs
        tabs={[
          { id: 'findings', label: 'AI Findings & Analysis', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'repository-data', label: 'GitHub Repository Data', icon: <GitPullRequest className="w-4 h-4" /> },
          { id: 'tasks', label: 'Task Execution Queue', icon: <ListTodo className="w-4 h-4" />, badge: repoTasks.length },
        ]}
        activeTab={activeMainTab}
        onChange={setActiveMainTab}
      />

      {/* Main Tab Content */}
      {activeMainTab === 'findings' && (
        <div className="space-y-4">
          {latestReport ? (
            <>
              <Card className="space-y-3">
                <h3 className="font-semibold text-slate-100 text-sm">AI Executive Summary</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{latestReport.summary}</p>
              </Card>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-100 text-base">
                  Detected Findings ({latestReport.findings?.length || 0})
                </h3>
                {latestReport.findings && latestReport.findings.length > 0 ? (
                  latestReport.findings.map((fnd) => <FindingCard key={fnd.id} finding={fnd} />)
                ) : (
                  <Card className="p-4 text-xs text-slate-400">No security or architectural findings reported.</Card>
                )}
              </div>
            </>
          ) : (
            <Card className="p-8 text-center text-xs text-slate-400">
              No analysis report generated for this repository yet. Click "Run AI Analysis" above to analyze.
            </Card>
          )}
        </div>
      )}

      {activeMainTab === 'repository-data' && (
        <RepositoryDetailTabs repository={repo} />
      )}

      {activeMainTab === 'tasks' && (
        <div className="space-y-3">
          {repoTasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-400">
              No tasks currently queued or running for this repository.
            </Card>
          ) : (
            repoTasks.map((task) => (
              <Card key={task.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">{task.taskType}</span>
                    <StatusBadge status={task.status} type="task" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Task ID: {task.id}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/queue')}>
                  View Logs
                </Button>
              </Card>
            ))
          )}
        </div>
      )}
    </PageContainer>
  );
};
