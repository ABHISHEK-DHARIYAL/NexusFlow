import React, { useEffect, useState } from 'react';
import { X, Terminal } from 'lucide-react';
import { TaskExecutionLog, Task } from '../../types';
import { api } from '../../services/api';

interface TaskLogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export const TaskLogViewerModal: React.FC<TaskLogViewerModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const [logs, setLogs] = useState<TaskExecutionLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setLoading(true);
      api
        .getTaskLogs(task.id)
        .then((data) => setLogs(Array.isArray(data) ? data : (data as any).logs || []))
        .finally(() => setLoading(false));

      // Poll every 2s for active logs
      const interval = setInterval(() => {
        api.getTaskLogs(task.id).then((data) => setLogs(Array.isArray(data) ? data : (data as any).logs || []));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Task Execution Terminal — {task.id}
              </h3>
              <p className="text-[11px] text-slate-400">
                Repository: {task.repositoryName} • Worker: {task.workerId || 'Pending Allocation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Terminal Window */}
        <div className="mt-4 h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-2">
          {loading && logs.length === 0 ? (
            <div className="text-slate-500 py-8 text-center">Loading execution logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-slate-500 py-8 text-center">
              Task enqueued. Waiting for Java ThreadPool worker node to claim...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 shrink-0">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span
                  className={`font-bold shrink-0 ${
                    log.level === 'ERROR'
                      ? 'text-rose-400'
                      : log.level === 'WARN'
                      ? 'text-amber-400'
                      : log.level === 'DEBUG'
                      ? 'text-indigo-400'
                      : 'text-emerald-400'
                  }`}
                >
                  [{log.level}]
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Status: <strong className="text-indigo-400">{task.status}</strong> ({task.progress}%)</span>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
};
