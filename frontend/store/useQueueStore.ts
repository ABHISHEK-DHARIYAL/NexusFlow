import { create } from 'zustand';
import { Task } from '../types';
import { mockTasks } from '../mocks/tasks';

interface QueueState {
  tasks: Task[];
  statusFilter: string;
  typeFilter: string;
  searchQuery: string;
  setStatusFilter: (status: string) => void;
  setTypeFilter: (type: string) => void;
  setSearchQuery: (query: string) => void;
  upsertTask: (task: Partial<Task> & { id: string }) => void;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  tasks: mockTasks,
  statusFilter: 'ALL',
  typeFilter: 'ALL',
  searchQuery: '',
  setStatusFilter: (status: string) => set({ statusFilter: status }),
  setTypeFilter: (type: string) => set({ typeFilter: type }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  upsertTask: (task: Partial<Task> & { id: string }) =>
    set((state) => {
      const index = state.tasks.findIndex((t) => t.id === task.id);
      if (index >= 0) {
        const updated = [...state.tasks];
        updated[index] = { ...updated[index], ...task } as Task;
        return { tasks: updated };
      }
      return { tasks: [task as Task, ...state.tasks] };
    }),
  cancelTask: (taskId: string) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: 'CANCELLED' as const } : t)),
    })),
  retryTask: (taskId: string) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: 'QUEUED' as const, progress: 0 } : t)),
    })),
}));
