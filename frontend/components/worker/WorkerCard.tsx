import React from 'react';
import { Cpu, Server, Activity, HardDrive } from 'lucide-react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { Progress } from '../ui/Progress';
import { Worker } from '../../types';

export interface WorkerCardProps {
  worker: Worker;
  onScaleThreads?: (workerId: string) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onScaleThreads }) => {
  return (
    <Card className="flex flex-col justify-between space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-slate-100 text-sm">{worker.workerId}</h3>
            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[180px]">
              {worker.hostIdentifier}
            </span>
          </div>
        </div>
        <StatusBadge status={worker.status} type="worker" />
      </div>

      <div className="space-y-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 text-xs">
        <div>
          <div className="flex justify-between text-slate-400 mb-1 font-mono">
            <span>CPU Usage</span>
            <span>{worker.cpuUsagePercent ?? 0}%</span>
          </div>
          <Progress value={worker.cpuUsagePercent ?? 0} size="sm" variant={worker.cpuUsagePercent && worker.cpuUsagePercent > 80 ? 'rose' : 'emerald'} />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1 font-mono">
            <span>Memory Usage</span>
            <span>{worker.memoryUsagePercent ?? 0}%</span>
          </div>
          <Progress value={worker.memoryUsagePercent ?? 0} size="sm" variant={worker.memoryUsagePercent && worker.memoryUsagePercent > 80 ? 'amber' : 'blue'} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5 font-mono">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>{worker.activeThreads} / {worker.maxThreads} Threads</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          Tasks: <span className="text-emerald-400 font-bold">{worker.tasksCompleted}</span> ok /{' '}
          <span className="text-rose-400 font-bold">{worker.tasksFailed}</span> err
        </div>
      </div>
    </Card>
  );
};
