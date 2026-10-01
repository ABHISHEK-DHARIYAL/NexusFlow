import React from 'react';
import {
  TrendingUp,
  Target,
  AlertTriangle,
  Code2,
  Trophy,
  Award,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { CareerDashboardMetrics } from '../../types';

interface CareerMetricsViewProps {
  metrics: CareerDashboardMetrics | null;
  isLoading: boolean;
}

export const CareerMetricsView: React.FC<CareerMetricsViewProps> = ({ metrics, isLoading }) => {
  if (isLoading || !metrics) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs animate-pulse">
        Loading verified developer career metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Career Strength</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">{metrics.careerStrengthScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Grounded across 5 platforms
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Job Readiness</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">{metrics.jobReadinessScore}</span>
            <span className="text-xs text-slate-500">% alignment</span>
          </div>
          <p className="text-[11px] text-blue-400 font-medium">Target role verified</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Top Skill Gap</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-base font-bold text-slate-100 block truncate">{metrics.topSkillGap}</span>
          <p className="text-[11px] text-amber-400 font-medium">High priority for study</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">DSA Strength</span>
            <Code2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">{metrics.dsaStrengthScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <p className="text-[11px] text-purple-400 font-medium">LeetCode & Codeforces</p>
        </div>
      </div>

      {/* Main Focus Card */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5 fill-indigo-400/20" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Next Recommended Career Action</h3>
            <p className="text-xs text-indigo-300 mt-0.5">{metrics.nextRecommendedAction}</p>
          </div>
        </div>

        {/* Sources Transparency */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
          <span className="font-semibold text-slate-500">Verified Evidence Sources:</span>
          {metrics.sourcesUsed.map((source) => (
            <span
              key={source}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              {source}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
