import React from 'react';
import { ApplicationStats } from '../../types';
import { TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

interface ApplicationFunnelAnalyticsProps {
  stats: ApplicationStats | null;
}

export const ApplicationFunnelAnalytics: React.FC<ApplicationFunnelAnalyticsProps> = ({ stats }) => {
  if (!stats) return null;

  const { funnel } = stats;

  const funnelStages = [
    { label: 'Applied', count: funnel.applied, rate: 100, color: 'bg-blue-500' },
    {
      label: 'Screening',
      count: funnel.screening,
      rate: funnel.conversionRates.screeningFromApplied,
      color: 'bg-indigo-500',
    },
    {
      label: 'Assessment',
      count: funnel.assessment,
      rate: funnel.conversionRates.assessmentFromScreening,
      color: 'bg-purple-500',
    },
    {
      label: 'Interview',
      count: funnel.interview,
      rate: funnel.conversionRates.interviewFromAssessment,
      color: 'bg-amber-500',
    },
    {
      label: 'Final Round',
      count: funnel.finalRound,
      rate: funnel.conversionRates.finalFromInterview,
      color: 'bg-orange-500',
    },
    {
      label: 'Offer',
      count: funnel.offer,
      rate: funnel.conversionRates.offerFromFinal,
      color: 'bg-emerald-500',
    },
  ];

  const maxCount = Math.max(funnel.applied, 1);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Pipeline Conversion Analytics</h3>
            <p className="text-xs text-slate-400">Application funnel metrics & stage conversion health</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">Overall Conversion</div>
          <div className="text-lg font-bold text-emerald-400">
            {funnel.conversionRates.overallConversion}%
          </div>
        </div>
      </div>

      {!funnel.hasSufficientData && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Fewer than 3 applications tracked. Track more applications to establish statistically robust conversion rates.
          </span>
        </div>
      )}

      <div className="space-y-3">
        {funnelStages.map((s, idx) => {
          const widthPct = Math.max(Math.round((s.count / maxCount) * 100), s.count > 0 ? 8 : 2);
          return (
            <div key={s.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-200">{s.label}</span>
                  <span className="text-slate-500">({s.count})</span>
                </div>
                <div className="flex items-center gap-3">
                  {idx > 0 && (
                    <span className="text-slate-400 text-[11px]">
                      {s.rate}% step conversion
                    </span>
                  )}
                  <span className="font-mono text-slate-300 font-semibold">{s.count}</span>
                </div>
              </div>

              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className={`h-full ${s.color} transition-all duration-500 rounded-full`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time intelligence synced with Job Match & Readiness Engines</span>
        </div>
        <div>
          Stalled Threshold: <span className="text-slate-200 font-mono">14 days</span>
        </div>
      </div>
    </div>
  );
};
