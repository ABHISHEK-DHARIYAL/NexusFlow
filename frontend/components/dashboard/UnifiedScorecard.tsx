import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LayoutGrid, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface ScorecardProps {
  scorecard: Record<string, { score: number | null; status: string }>;
}

export const UnifiedScorecard: React.FC<ScorecardProps> = ({ scorecard }) => {
  const labels: Record<string, { title: string; category: string }> = {
    technical: { title: 'Technical Profile', category: 'GitHub / Codebase' },
    dsa: { title: 'DSA & Competitive', category: 'LeetCode / Codeforces' },
    projects: { title: 'Project Evidence', category: 'Portfolio / GitHub' },
    resume: { title: 'Resume ATS', category: 'Resume Intelligence' },
    portfolio: { title: 'Portfolio UX & SEO', category: 'Portfolio Crawl' },
    verification: { title: 'Claims Verification', category: 'Cross-Platform Verification' },
    jobReadiness: { title: 'Job Readiness', category: 'Job Intelligence' },
    interviewPrep: { title: 'Company Preparation', category: 'Interview Coach' },
  };

  return (
    <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">Unified Developer Scorecard</h2>
        </div>
        <span className="text-xs text-slate-400">8 Vector Dimension Matrix</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(scorecard).map(([key, item]) => {
          const info = labels[key] || { title: key, category: 'General' };
          const hasData = item.score !== null;

          return (
            <div
              key={key}
              className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                hasData
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/30 border-slate-800/40 opacity-75'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">
                  {info.category}
                </span>
                <span className="text-xs font-bold text-slate-200 block truncate">{info.title}</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-lg font-extrabold text-slate-100">
                    {hasData ? `${Math.round(item.score!)}` : 'N/A'}
                  </div>
                  <span className="text-[10px] text-slate-400 block">{item.status}</span>
                </div>

                {hasData ? (
                  item.score! >= 80 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )
                ) : (
                  <HelpCircle className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
