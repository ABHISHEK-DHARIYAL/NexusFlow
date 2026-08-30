import { TaskExecutionLog } from '../types';

export const mockTaskExecutionLogs: Record<string, TaskExecutionLog[]> = {
  tsk_101: [
    {
      id: 'log_001',
      taskId: 'tsk_101',
      workerId: 'wrk_java_01',
      level: 'INFO',
      message: 'Worker wrk_java_01 claimed task tsk_101 from Redis priority queue.',
      timestamp: '2026-08-09T08:10:05Z',
    },
    {
      id: 'log_002',
      taskId: 'tsk_101',
      workerId: 'wrk_java_01',
      level: 'DEBUG',
      message: 'Cloning repository nexusflow-api (branch: main) into virtual thread memory stream...',
      timestamp: '2026-08-09T08:10:08Z',
    },
    {
      id: 'log_003',
      taskId: 'tsk_101',
      workerId: 'wrk_java_01',
      level: 'INFO',
      message: 'Constructed AST for 142 source files across 8 modules.',
      timestamp: '2026-08-09T08:11:15Z',
    },
    {
      id: 'log_004',
      taskId: 'tsk_101',
      workerId: 'wrk_java_01',
      level: 'INFO',
      message: 'Submitting AST payload to Gemini 2.5 Flash for multi-vector code review (security, perf, arch)...',
      timestamp: '2026-08-09T08:12:00Z',
    },
    {
      id: 'log_005',
      taskId: 'tsk_101',
      workerId: 'wrk_java_01',
      level: 'INFO',
      message: 'Processing streamed Gemini tokens. Progress: 72%.',
      timestamp: '2026-08-09T08:12:30Z',
    },
  ],
};
