import { create } from 'zustand';
import { Worker, WorkerMetrics } from '../types';
import { mockWorkers, mockWorkerMetrics } from '../mocks/workers';

interface WorkerState {
  workers: Worker[];
  metrics: WorkerMetrics[];
  selectedWorkerId: string | null;
  selectWorker: (id: string | null) => void;
}

export const useWorkerStore = create<WorkerState>((set) => ({
  workers: mockWorkers,
  metrics: mockWorkerMetrics,
  selectedWorkerId: mockWorkers[0].id,
  selectWorker: (id: string | null) => set({ selectedWorkerId: id }),
}));
