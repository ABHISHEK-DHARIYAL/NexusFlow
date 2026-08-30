import React, { useState } from 'react';
import {
  ListTodo,
  Play,
  RotateCcw,
  XCircle,
  Terminal,
  Plus,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Task, Repository, TaskPriority, TaskType } from '../../types';
import { TaskLogViewerModal } from './TaskLogViewerModal';

interface TaskQueueManagerProps {
  tasks: Task[];
  repositories: Repository[];
  onCreateTask: (repoId: string, taskType: string, priority: string) => void;
  onCancelTask: (taskId: string) => void;
  onRetryTask: (taskId: string) => void;
}

export const TaskQueueManager: React.FC<TaskQueueManagerProps> = ({
  tasks,
  repositories,
  onCreateTask,
  onCancelTask,
  onRetryTask,
}) => {
  const [selectedRepoId, setSelectedRepoId] = useState(repositories[0]?.id || '');
  const [taskType, setTaskType] = useState<TaskType>('REPO_ANALYSIS');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [activeLogTask, setActiveLogTask] = useState<Task | null>(null);

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'RUNNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'QUEUED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId) return;
    onCreateTask(selectedRepoId, taskType, priority);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Create Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-indigo-400" />
            Background Task Priority Queue
          </h2>
          <p className="text-xs text-slate-400">
            Tasks enqueued in custom Heap Priority Queue processed by Java 21 Concurrency Engine
          </p>
        </div>

        <form
          onSubmit={handleCreateTask}
          className="flex flex-wrap items-center gap-2 w-full lg:w-auto bg-slate-900 border border-slate-800 p-2 rounded-2xl"
        >
          <select
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName}
              </option>
            ))}
          </select>

          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="REPO_ANALYSIS">Repo Analysis</option>
            <option value="SECURITY_AUDIT">Security Audit</option>
            <option value="CODE_QUALITY_CHECK">Code Quality Check</option>
            <option value="ARCHITECTURE_REVIEW">Architecture Review</option>
            <option value="FULL_SCAN">Full Scan</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Enqueue Task
          </button>
        </form>
      </div>

      {/* Task Queue Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/80 uppercase text-[10px] text-slate-400">
            <tr>
              <th className="px-5 py-3.5">Task ID</th>
              <th className="px-5 py-3.5">Repository</th>
              <th className="px-5 py-3.5">Task Type</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Status & Progress</th>
              <th className="px-5 py-3.5">Worker</th>
              <th className="px-5 py-3.5">Enqueued At</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-800/40 transition">
                <td className="px-5 py-4 font-mono font-bold text-indigo-300">{task.id}</td>
                <td className="px-5 py-4 font-semibold text-slate-100">{task.repositoryName}</td>
                <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{task.taskType}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getPriorityBadge(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusBadge(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                    {task.status === 'RUNNING' && (
                      <div className="flex-1 max-w-[80px] bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-[11px] font-mono text-slate-400">
                  {task.workerId || '—'}
                </td>
                <td className="px-5 py-4 text-[10px] text-slate-500">
                  {new Date(task.createdAt).toLocaleTimeString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setActiveLogTask(task)}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                      title="View Logs Terminal"
                    >
                      <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    </button>

                    {task.status === 'QUEUED' || task.status === 'RUNNING' ? (
                      <button
                        onClick={() => onCancelTask(task.id)}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-rose-400 hover:bg-rose-950/40 transition"
                        title="Cancel Task"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onRetryTask(task.id)}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-1.5 text-indigo-400 hover:bg-slate-800 transition"
                        title="Re-enqueue Task"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Task Log Terminal Modal */}
      <TaskLogViewerModal
        isOpen={!!activeLogTask}
        onClose={() => setActiveLogTask(null)}
        task={activeLogTask}
      />
    </div>
  );
};
