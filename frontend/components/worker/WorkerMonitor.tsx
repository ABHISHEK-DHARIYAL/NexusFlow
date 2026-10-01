import React, { useState } from 'react';
import {
  Cpu,
  Activity,
  Sliders,
  Zap,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Gauge,
  Layers,
  Lock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Worker, WorkerMetrics } from '../../types';

interface WorkerMonitorProps {
  workers: Worker[];
  metrics: WorkerMetrics[];
  onScaleThreads: (workerId: string, maxThreads: number) => void;
}

export const WorkerMonitor: React.FC<WorkerMonitorProps> = ({
  workers,
  metrics,
  onScaleThreads,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || '');
  const [threadInput, setThreadInput] = useState(16);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];

  const chartData = metrics.slice(-20).map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    cpu: Math.round(m.cpuUsagePercent),
    memory: Math.round(m.memoryUsageMB),
    threads: m.activeThreads,
    queue: m.queueDepth,
  }));

  const handleScaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    onScaleThreads(selectedWorker.id, threadInput);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-emerald-400" />
            Java 21 Concurrency Worker Monitor
          </h2>
          <p className="text-xs text-slate-400">
            Real-time JVM Heap memory, ReentrantLock concurrency state, and ThreadPool scaling controls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">Heartbeat Frequency: 5s</span>
        </div>
      </div>

      {/* Concurrency Specs & Lock Engine Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-indigo-400" /> Lock Engine
          </div>
          <div className="text-sm font-bold text-slate-100 mt-1">ReentrantLock</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Dual Condition (notFull, notEmpty)</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-400" /> Blocking Queue
          </div>
          <div className="text-sm font-bold text-slate-100 mt-1">Array Heap Priority</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Priority Weighting Algorithm</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-amber-400" /> Active Threads
          </div>
          <div className="text-sm font-bold text-slate-100 mt-1">
            {workers.reduce((acc, w) => acc + w.activeThreads, 0)} Active
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Dynamic Worker ThreadPool</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-indigo-400" /> Total Executions
          </div>
          <div className="text-sm font-bold text-slate-100 mt-1">
            {workers.reduce((acc, w) => acc + w.tasksCompleted, 0)} Completed
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Zero Worker Deadlocks</p>
        </div>
      </div>

      {/* Workers Cards & Scale Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workers List */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Worker Thread Nodes
          </h3>
          {workers.map((worker) => (
            <div
              key={worker.id}
              onClick={() => {
                setSelectedWorkerId(worker.id);
                setThreadInput(worker.maxThreads);
              }}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                selectedWorker?.id === worker.id
                  ? 'border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100">{worker.workerId}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    worker.status === 'BUSY'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {worker.status}
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-400 space-y-1">
                <div>Host: <span className="text-slate-300 font-mono">{worker.hostIdentifier}</span></div>
                <div>ThreadPool: <strong className="text-indigo-300">{worker.activeThreads} / {worker.maxThreads} Threads</strong></div>
              </div>

              {worker.currentTaskName && (
                <div className="mt-2 text-[10px] text-indigo-300 bg-indigo-950/60 p-2 rounded-lg border border-indigo-500/20 truncate font-mono">
                  → Executing: {worker.currentTaskName}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Thread Pool Scaling & Metrics Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scaling Controls Panel */}
          {selectedWorker && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                Dynamic ThreadPool Scaling — {selectedWorker.workerId}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Adjust maximum concurrent worker threads allocated to this Java execution node
              </p>

              <form onSubmit={handleScaleSubmit} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                    <span>Target Max Threads:</span>
                    <span className="text-indigo-400 font-mono">{threadInput} Threads</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="32"
                    step="2"
                    value={threadInput}
                    onChange={(e) => setThreadInput(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-950 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
                >
                  Apply Scaling
                </button>
              </form>
            </div>
          )}

          {/* Realtime JVM Memory & CPU Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              JVM Memory Usage (MB) & Active Queue Depth
            </h3>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      fontSize: '12px',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    name="JVM Memory MB"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorMem)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
