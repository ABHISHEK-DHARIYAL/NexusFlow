import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Bell, ArrowRight, CheckCircle2, AlertOctagon } from 'lucide-react';

interface JobReadinessTrackerCardProps {
  jobOverview: any;
  pipeline: any;
}

export const JobReadinessTrackerCard: React.FC<JobReadinessTrackerCardProps> = ({ jobOverview, pipeline }) => {
  const navigate = useNavigate();
  const target = jobOverview?.selectedJobReadiness;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Target Job Readiness */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Target Role Readiness</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/jobs')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Job Intelligence
          </Button>
        </div>

        {target ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{target.title}</h3>
                <p className="text-xs text-slate-400 font-medium">{target.company}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-amber-400">{target.readinessScore}%</span>
                <span className="text-[10px] text-slate-500 block">Readiness Score</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] block">JOB MATCH</span>
                <span className="font-extrabold text-emerald-400 text-sm">{target.matchScore}%</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">PREPARATION COVERAGE</span>
                <span className="font-extrabold text-blue-400 text-sm">{target.companyPrepCoverage}%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 block">Critical Gaps to Close:</span>
              <div className="flex flex-wrap gap-1.5">
                {target.criticalGaps.map((gap: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-800/50 text-xs">
                    ⚠ {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">Analyze a job description to track readiness metrics.</p>
        )}
      </Card>

      {/* Application Tracker & Needs Attention */}
      <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100">Application Pipeline</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/applications')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Job Tracker
          </Button>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
          {Object.entries(pipeline?.byStatus || {}).map(([status, count]: [string, any]) => (
            <div key={status} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-500 font-mono block uppercase">{status}</span>
              <span className="font-bold text-slate-100 text-sm">{count}</span>
            </div>
          ))}
        </div>

        {/* Needs Attention Items */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5 text-red-400" /> Needs Your Attention ({pipeline?.needsAttention?.length || 0})
          </span>

          {pipeline?.needsAttention?.length > 0 ? (
            pipeline.needsAttention.map((item: any) => (
              <div
                key={item.id}
                onClick={() => navigate('/applications')}
                className="p-3 rounded-xl bg-slate-950/80 border border-red-900/30 hover:border-red-700/50 transition-colors cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-100 block">{item.companyName} — {item.jobTitle}</span>
                  <span className="text-[11px] text-red-300">{item.reason}</span>
                </div>
                <Badge variant="rose" className="text-[10px]">{item.status}</Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-3 text-center">No urgent application items requiring immediate action.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
