import React from 'react';
import { ApplicationStats } from '../../types';
import { Briefcase, Clock, Award, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

interface ApplicationOverviewCardsProps {
  stats: ApplicationStats | null;
  loading: boolean;
  onFilterHealth?: (health: string | null) => void;
  activeHealthFilter?: string | null;
}

export const ApplicationOverviewCards: React.FC<ApplicationOverviewCardsProps> = ({
  stats,
  loading,
  onFilterHealth,
  activeHealthFilter,
}) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'ALL',
      title: 'Total Tracked',
      value: stats.total,
      subtext: 'Pipeline count',
      icon: <Briefcase className="w-5 h-5 text-blue-400" />,
      borderColor: 'border-slate-800 hover:border-blue-500/50',
      activeColor: 'bg-blue-500/10 border-blue-500',
    },
    {
      id: 'ACTIVE',
      title: 'Active Pipeline',
      value: stats.active,
      subtext: `${stats.interviews} in interviews`,
      icon: <TrendingUp className="w-5 h-5 text-indigo-400" />,
      borderColor: 'border-slate-800 hover:border-indigo-500/50',
      activeColor: 'bg-indigo-500/10 border-indigo-500',
    },
    {
      id: 'INTERVIEWS',
      title: 'Interviewing',
      value: stats.interviews,
      subtext: 'Active rounds',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      borderColor: 'border-slate-800 hover:border-amber-500/50',
      activeColor: 'bg-amber-500/10 border-amber-500',
    },
    {
      id: 'OFFERS',
      title: 'Offers Received',
      value: stats.offers,
      subtext: `${stats.funnel.conversionRates.overallConversion}% overall conversion`,
      icon: <Award className="w-5 h-5 text-emerald-400" />,
      borderColor: 'border-slate-800 hover:border-emerald-500/50',
      activeColor: 'bg-emerald-500/10 border-emerald-500',
    },
    {
      id: 'STALLED',
      title: 'Stalled Applications',
      value: stats.stalled,
      subtext: '>= 14 days inactive',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      borderColor: 'border-slate-800 hover:border-rose-500/50',
      activeColor: 'bg-rose-500/10 border-rose-500',
    },
    {
      id: 'NEEDS_ACTION',
      title: 'Action Required',
      value: stats.needsAction,
      subtext: 'Pending saved / follow-ups',
      icon: <CheckCircle2 className="w-5 h-5 text-purple-400" />,
      borderColor: 'border-slate-800 hover:border-purple-500/50',
      activeColor: 'bg-purple-500/10 border-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => {
        const isSelected = activeHealthFilter === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onFilterHealth?.(isSelected ? null : c.id)}
            className={`text-left bg-slate-900/60 border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
              isSelected ? c.activeColor : c.borderColor
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium truncate">{c.title}</span>
              <div className="p-1.5 rounded-lg bg-slate-800/80">{c.icon}</div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight mb-0.5">{c.value}</div>
            <div className="text-[11px] text-slate-400 truncate">{c.subtext}</div>
          </button>
        );
      })}
    </div>
  );
};
