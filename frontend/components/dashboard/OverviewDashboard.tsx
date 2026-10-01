import React from 'react';
import {
  FolderGit2,
  Activity,
  ListTodo,
  ShieldAlert,
  Cpu,
  Sparkles,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Play,
  RotateCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { DashboardSummary, Repository, Task, Worker, WorkerMetrics } from '../../types';

interface OverviewDashboardProps {
  summary: DashboardSummary | null;
  repositories: Repository[];
  tasks: Task[];
  workers: Worker[];
  metrics: WorkerMetrics[];
  onTriggerAnalysis: (repoId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  summary,
  repositories,
  tasks,
  workers,
  metrics,
  onTriggerAnalysis,
  onNavigateTab,
}) => {
  const chartData = metrics.slice(-15).map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    cpu: Math.round(m.cpuUsagePercent),
    memory: Math.round(m.memoryUsageMB),
    throughput: Math.round(m.throughputPerMin),
  }));

  return (
    <div className="space-y-6">
      {/* Platform Welcome & Quick Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                NexusFlow v0.1.0 Architecture
              </span>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                Java 21 ThreadPool
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Developer Intelligence & AI Analysis Gateway
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Monitors active GitHub repository static code quality, coordinates high-throughput concurrency background tasks, and executes deep architectural AI audits powered by Gemini 3.6 Flash.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('repositories')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
            >
              <FolderGit2 className="h-4 w-4" /> Import Repository
            </button>
            <button
              onClick={() => onNavigateTab('workers')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Cpu className="h-4 w-4 text-emerald-400" /> Worker Engine
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Repositories */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tracked Repos</span>
            <FolderGit2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">
              {summary?.totalRepositories || repositories.length}
            </span>
            <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> Active Sync
            </span>
          </div>
        </div>

        {/* System Health Score */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Health Score</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">
              {summary?.avgHealthScore || 88}<span className="text-sm font-normal text-slate-500">/100</span>
            </span>
            <span className="text-[10px] font-medium text-emerald-400">Gemini Audited</span>
          </div>
        </div>

        {/* Active Concurrency Tasks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active & Queued Tasks</span>
            <ListTodo className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">
              {(summary?.activeTasks || 0) + (summary?.queuedTasks || 0)}
            </span>
            <span className="text-[10px] text-slate-400">
              {summary?.queuedTasks || 0} Queued in Heap
            </span>
          </div>
        </div>

        {/* Critical Findings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Security Advisories</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">
              {summary?.criticalSecurityIssues || 3}
            </span>
            <span className="text-[10px] text-amber-400/80">Requires Review</span>
          </div>
        </div>
      </div>

      {/* Real-time System Metrics Chart & Java Worker Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Concurrency Engine Throughput Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                Java Worker CPU Load & Throughput
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time metrics polled from Java 21 Custom Thread Pool
              </p>
            </div>
            <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
              ~28 ops/min
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                  dataKey="cpu"
                  name="CPU Usage %"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Worker Nodes Quick Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400" /> Worker Thread Nodes
              </h3>
              <button
                onClick={() => onNavigateTab('workers')}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
              >
                View Details →
              </button>
            </div>

            <div className="space-y-3">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-200">{worker.workerId}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        worker.status === 'BUSY'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {worker.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Threads: {worker.activeThreads} / {worker.maxThreads}</span>
                    <span>Done: {worker.tasksCompleted}</span>
                  </div>
                  {worker.currentTaskName && (
                    <div className="mt-1.5 text-[10px] text-indigo-300 truncate font-mono">
                      → {worker.currentTaskName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Concurrency Model: Java ReentrantLock</span>
            <span className="text-emerald-400 font-mono">OK</span>
          </div>
        </div>
      </div>

      {/* Repositories Quick Action Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Tracked Repositories & Quick Audit Triggers
            </h3>
            <p className="text-[11px] text-slate-400">
              Select a repository to launch an immediate Gemini AI static review
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('repositories')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            All Repositories ({repositories.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-indigo-500/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{repo.fullName}</h4>
                  <span className="text-[10px] text-slate-400">{repo.language || 'Multi-language'}</span>
                </div>
                <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  {repo.healthScore || 85}/100
                </span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                {repo.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                <span className="text-[10px] text-slate-500">
                  ⭐ {repo.starsCount} • 🍴 {repo.forksCount}
                </span>
                <button
                  onClick={() => onTriggerAnalysis(repo.id)}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-600/40 transition"
                >
                  <Play className="h-3 w-3 fill-indigo-300" /> Audit Repo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
