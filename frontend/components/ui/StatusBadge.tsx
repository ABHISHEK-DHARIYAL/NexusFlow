import React from 'react';
import { TaskStatus, WorkerStatus, SeverityLevel } from '../../types';

export interface StatusBadgeProps {
  status: TaskStatus | WorkerStatus | SeverityLevel | string;
  type?: 'task' | 'worker' | 'severity';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'task' }) => {
  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (type === 'task' || type === 'worker') {
    switch (status) {
      case 'RUNNING':
      case 'BUSY':
        badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        dotColor = 'bg-blue-400 animate-pulse';
        break;
      case 'COMPLETED':
      case 'IDLE':
        badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        dotColor = 'bg-emerald-400';
        break;
      case 'QUEUED':
      case 'SCHEDULED':
        badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        dotColor = 'bg-amber-400';
        break;
      case 'FAILED':
      case 'UNHEALTHY':
        badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        dotColor = 'bg-rose-400';
        break;
      case 'CANCELLED':
      case 'STOPPED':
        badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
        dotColor = 'bg-slate-500';
        break;
    }
  } else if (type === 'severity') {
    switch (status) {
      case 'CRITICAL':
        badgeColor = 'bg-red-500/15 text-red-400 border-red-500/40 font-bold';
        dotColor = 'bg-red-500';
        break;
      case 'HIGH':
        badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        dotColor = 'bg-rose-400';
        break;
      case 'MEDIUM':
        badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        dotColor = 'bg-amber-400';
        break;
      case 'LOW':
        badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        dotColor = 'bg-blue-400';
        break;
      case 'INFO':
        badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
        dotColor = 'bg-cyan-400';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${badgeColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};
