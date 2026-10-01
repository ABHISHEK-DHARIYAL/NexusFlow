import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { mockTasks } from '../mocks/tasks';
import { History, CheckCircle, Clock } from 'lucide-react';

export const ExecutionHistoryPage: React.FC = () => {
  return (
    <PageContainer
      title="Execution History"
      description="Historical log audits for completed and failed AST analysis tasks."
    >
      <div className="space-y-3">
        {mockTasks.map((task) => (
          <Card key={task.id} className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm">{task.taskType}</span>
                <StatusBadge status={task.status} type="task" />
              </div>
              <p className="text-xs text-slate-400 font-mono">Task ID: {task.id}</p>
            </div>
            <div className="text-right text-xs text-slate-400 font-mono">
              <div>Started: {task.startedAt ? new Date(task.startedAt).toLocaleTimeString() : 'N/A'}</div>
              <div>Ended: {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : 'N/A'}</div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
