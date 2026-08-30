import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Drawer } from '../components/ui/Drawer';
import { useTasks } from '../hooks';
import { TaskExecutionLog } from '../types';
import { Search, RefreshCw, XCircle, Terminal, Loader2 } from 'lucide-react';

export const QueueMonitorPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<TaskExecutionLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const { tasks, isLoading, error, refetch, cancelTask, retryTask, getTaskLogs } = useTasks();

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (selectedTaskId) {
      setIsLoadingLogs(true);
      getTaskLogs(selectedTaskId)
        .then((logs) => setTaskLogs(logs))
        .catch(() => setTaskLogs([]))
        .finally(() => setIsLoadingLogs(false));
    } else {
      setTaskLogs([]);
    }
  }, [selectedTaskId]);

  return (
    <PageContainer
      title="Queue Monitor"
      description="Live execution task dispatcher, Redis priority queue, and virtual thread telemetry."
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Queue
        </Button>
      }
    >
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search tasks by ID or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'RUNNING', label: 'Running' },
            { value: 'QUEUED', label: 'Queued' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'FAILED', label: 'Failed' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {/* Task List Table/Cards */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span>Loading queue tasks from backend...</span>
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-xs text-red-300 border-red-800/50 bg-red-950/20">
          Failed to load queue tasks: {error}
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card className="p-8 text-center text-xs text-slate-400">
          No tasks found matching your filter criteria.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100 text-sm">{task.taskType}</span>
                  <StatusBadge status={task.status} type="task" />
                  <Badge variant="purple" size="sm">Priority: {task.priority}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>ID: {task.id}</span>
                  {task.workerId && <span>Worker: {task.workerId}</span>}
                  <span>Progress: {task.progress}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Terminal className="w-3.5 h-3.5" />}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  Logs
                </Button>
                {task.status === 'RUNNING' && (
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => cancelTask(task.id)}
                  >
                    Cancel
                  </Button>
                )}
                {task.status === 'FAILED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => retryTask(task.id)}
                  >
                    Retry
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Task Log Drawer */}
      <Drawer
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        title={`Task Execution Terminal (${selectedTaskId})`}
        position="right"
      >
        <div className="space-y-3 font-mono text-xs">
          {isLoadingLogs ? (
            <div className="p-8 flex items-center justify-center text-slate-500 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Fetching logs from server...</span>
            </div>
          ) : taskLogs.length === 0 ? (
            <div className="p-4 text-slate-500">No live stream logs available for this task.</div>
          ) : (
            taskLogs.map((log) => (
              <div key={log.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className={log.level === 'INFO' ? 'text-blue-400' : 'text-amber-400'}>[{log.level}]</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-200">{log.message}</p>
              </div>
            ))
          )}
        </div>
      </Drawer>
    </PageContainer>
  );
};
