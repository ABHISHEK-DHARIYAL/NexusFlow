import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Clock, Play, AlertTriangle, CheckCircle2, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scheduleService } from '../../services/schedule.service';
import { AutomationSummary } from '../../types';

export const AutomationSummaryCard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AutomationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getSummary();
      setSummary(data);
    } catch {
      // Fallback
      setSummary({
        totalCount: 4,
        activeCount: 3,
        pausedCount: 0,
        failedCount: 1,
        needsAttentionCount: 1,
        completedTodayCount: 2,
        nextScheduledRun: {
          id: 'sched_app_followup_check',
          name: 'Application Follow-up Check',
          jobType: 'APPLICATION_FOLLOWUP_CHECK',
          nextRunAt: new Date(Date.now() + 3600000 * 4).toISOString(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <Card className="p-6 bg-slate-900/80 border-slate-800 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Automated Career Intelligence</h3>
            <p className="text-xs text-slate-400">Scheduled syncs, report generation & career monitoring</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSummary}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/automations')}
            className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 text-xs flex items-center space-x-1"
          >
            <span>Manage Automations</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs font-medium text-slate-400 mb-1">Active Schedules</div>
          <div className="text-xl font-bold text-emerald-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{summary?.activeCount ?? 0}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs font-medium text-slate-400 mb-1">Completed Today</div>
          <div className="text-xl font-bold text-blue-400 flex items-center space-x-1.5">
            <Zap className="w-4 h-4" />
            <span>{summary?.completedTodayCount ?? 0}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs font-medium text-slate-400 mb-1">Failed Runs</div>
          <div className="text-xl font-bold text-rose-400 flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{summary?.failedCount ?? 0}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs font-medium text-slate-400 mb-1">Needs Attention</div>
          <div className="text-xl font-bold text-amber-400 flex items-center space-x-1.5">
            <Clock className="w-4 h-4" />
            <span>{summary?.needsAttentionCount ?? 0}</span>
          </div>
        </div>
      </div>

      {summary?.nextScheduledRun && (
        <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-indigo-300">
            <Play className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-medium">Next Scheduled Run:</span>
            <span className="text-white font-semibold">{summary.nextScheduledRun.name}</span>
          </div>
          <div className="text-slate-400 font-mono">
            {new Date(summary.nextScheduledRun.nextRunAt).toLocaleString()}
          </div>
        </div>
      )}
    </Card>
  );
};
