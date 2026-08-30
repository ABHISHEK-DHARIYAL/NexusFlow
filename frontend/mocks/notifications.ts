import { Notification } from '../types';

export const mockNotifications: Notification[] = [
  {
    id: 'ntf_001',
    userId: 'usr_01h8x92a001',
    type: 'ANALYSIS_READY',
    title: 'AI Analysis Complete',
    message: 'Full repository analysis for nexusflow-api (repo_001) is ready for review.',
    isRead: false,
    relatedRepositoryId: 'repo_001',
    createdAt: '2026-08-09T06:30:00Z',
  },
  {
    id: 'ntf_002',
    userId: 'usr_01h8x92a001',
    type: 'SECURITY_WARNING',
    title: 'Critical Security Finding',
    message: '1 Critical finding detected in nexusflow-api: Potential JWT Secret Misconfiguration.',
    isRead: false,
    relatedRepositoryId: 'repo_001',
    createdAt: '2026-08-09T06:30:05Z',
  },
  {
    id: 'ntf_003',
    userId: 'usr_01h8x92a001',
    type: 'SYSTEM_ALERT',
    title: 'Worker Node Unhealthy',
    message: 'Worker node wrk_java_04 flagged as UNHEALTHY due to memory threshold breach (98.7%).',
    isRead: true,
    createdAt: '2026-08-09T08:10:00Z',
  },
  {
    id: 'ntf_004',
    userId: 'usr_01h8x92a001',
    type: 'TASK_COMPLETED',
    title: 'Task Completed',
    message: 'Code Quality Check for nexusflow-web finished successfully in 4m 58s.',
    isRead: true,
    relatedTaskId: 'tsk_103',
    relatedRepositoryId: 'repo_003',
    createdAt: '2026-08-09T04:15:00Z',
  },
];
