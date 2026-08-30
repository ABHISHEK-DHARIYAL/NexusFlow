import { User, GitHubAccount } from '../types';

export const mockCurrentUser: User = {
  id: 'usr_01h8x92a001',
  name: 'Alex Rivera',
  username: 'arivera',
  email: 'alex.rivera@nexusflow.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  githubId: 'gh_8849201',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: '2025-01-15T08:30:00Z',
  lastLoginAt: '2026-08-09T08:15:00Z',
};

export const mockGithubAccount: GitHubAccount = {
  id: 'gha_01h8x92a002',
  userId: 'usr_01h8x92a001',
  githubUserId: 'gh_8849201',
  githubUsername: 'arivera-dev',
  profileUrl: 'https://github.com/arivera-dev',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  updatedAt: '2026-08-01T12:00:00Z',
};
