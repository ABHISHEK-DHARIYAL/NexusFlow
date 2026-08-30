import { apiClient, API_URL, setMemoryAccessToken } from './apiClient';
import { User, GitHubAccount, ApiResponse } from '../types';

export interface SessionData {
  user: User | null;
  githubAccount?: GitHubAccount | null;
  isAuthenticated: boolean;
}

export interface AuthResponseData {
  user: User;
  githubAccount?: GitHubAccount;
  accessToken: string;
  expiresIn?: string | number;
}

export const authService = {
  getGithubAuthUrl(): string {
    return `${API_URL}/auth/github`;
  },

  loginWithGithub(): void {
    window.location.href = this.getGithubAuthUrl();
  },

  async getSession(): Promise<SessionData> {
    try {
      const response = await apiClient.get<ApiResponse<SessionData>>('/auth/session');
      if (response.data?.data) {
        return response.data.data;
      }
      return { user: null, isAuthenticated: false };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  },

  async getMe(): Promise<{ user: User; githubAccount?: GitHubAccount }> {
    const response = await apiClient.get<{ user: User; githubAccount?: GitHubAccount; data?: User }>('/auth/me');
    const user = response.data.user || response.data.data;
    return {
      user,
      githubAccount: response.data.githubAccount,
    };
  },

  async refreshTokens(): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/refresh');
    const authData = response.data.data || (response.data as any);
    if (authData.accessToken) {
      setMemoryAccessToken(authData.accessToken);
    }
    return authData;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setMemoryAccessToken(null);
    }
  },
};
