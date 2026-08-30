import React from 'react';
import { GitBranch, ListTodo, Cpu, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { DashboardSummary } from '../../types';

export interface DashboardStatsCardsProps {
  summary: DashboardSummary;
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ summary }) => {
  const stats = [
    {
      title: 'Total Repositories',
      value: summary.totalRepositories,
      subtext: '5 monitored repositories',
      icon: <GitBranch className="w-5 h-5 text-blue-400" />,
      color: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Active Tasks / Queue',
      value: `${summary.activeTasks} / ${summary.queuedTasks}`,
      subtext: `${summary.completedTasks24h} completed in 24h`,
      icon: <ListTodo className="w-5 h-5 text-amber-400" />,
      color: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Active Workers',
      value: summary.activeWorkers,
      subtext: `${summary.totalThroughputPerMin} tasks/min throughput`,
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      color: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Avg Repository Health',
      value: `${summary.avgHealthScore}%`,
      subtext: `${summary.criticalSecurityIssues} critical issue flagged`,
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      color: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">{stat.title}</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-100 mt-1">{stat.value}</div>
            <p className="text-[11px] text-slate-400 mt-1">{stat.subtext}</p>
          </div>
          <div className={`p-2.5 rounded-xl border ${stat.color}`}>{stat.icon}</div>
        </Card>
      ))}
    </div>
  );
};
