import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { WorkerCard } from '../components/worker/WorkerCard';
import { WorkerUtilizationChart } from '../components/charts/WorkerUtilizationChart';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useWorkers } from '../hooks';
import { Cpu, RefreshCw, Loader2 } from 'lucide-react';
import { mockWorkerUtilizationStats } from '../mocks/dashboard';

export const WorkersDashboardPage: React.FC = () => {
  const { workers, isLoading, error, refetch, scaleWorker } = useWorkers();

  return (
    <PageContainer
      title="Virtual Thread Workers"
      description="Java 21 Virtual Thread cluster health, CPU/Memory load, and concurrency scaling."
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Nodes
        </Button>
      }
    >
      {/* Chart Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Cluster Utilization Telemetry</h3>
            <p className="text-xs text-slate-400">Live CPU and Heap memory footprint per worker node</p>
          </div>
          <Cpu className="w-4 h-4 text-emerald-400" />
        </div>
        <WorkerUtilizationChart data={mockWorkerUtilizationStats} />
      </Card>

      {/* Grid of Workers */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100">Worker Instances ({workers.length})</h3>
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span>Loading worker instances from backend...</span>
          </div>
        ) : error ? (
          <Card className="p-6 text-center text-xs text-red-300 border-red-800/50 bg-red-950/20">
            Failed to load worker metrics: {error}
          </Card>
        ) : workers.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No active worker nodes registered in cluster.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onScaleThreads={(workerId) => scaleWorker(workerId, worker.maxThreads + 10)}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
