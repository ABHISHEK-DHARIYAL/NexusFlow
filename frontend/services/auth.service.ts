import {
  apiClient,
  API_URL,
  setMemoryAccessToken,
  setStoredRefreshToken,
  getStoredRefreshToken,
  refreshSession,
} from './apiClient';
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
  refreshToken?: string;
  expiresIn?: string | number;
}

export const authService = {
  /** Asks the backend for a GitHub authorization URL for the signed-in
   * user, then sends the browser there. */
  async connectGithub(): Promise<void> {
    const response = await apiClient.get<ApiResponse<{ url: string }>>('/auth/github/connect-url');
    const url = response.data?.data?.url;
    if (!url) throw new Error('Could not start the GitHub connection.');
    window.location.href = url;
  },

  async getGithubStatus(): Promise<{
    connected: boolean;
    configured: boolean;
    githubAccount: { githubUsername: string; profileUrl: string; avatarUrl: string } | null;
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/auth/github/status');
    return response.data.data;
  },

  async disconnectGithub(): Promise<void> {
    await apiClient.delete('/auth/github');
  },

  async signup(data: { email: string; password: string; username?: string; name?: string }): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/signup', data);
    const authData = response.data.data as AuthResponseData;
    if (authData.accessToken) {
      setMemoryAccessToken(authData.accessToken);
    }
    if (authData.refreshToken) setStoredRefreshToken(authData.refreshToken);
    return authData;
  },

  async loginWithPassword(email: string, password: string): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', { email, password });
    const authData = response.data.data as AuthResponseData;
    if (authData.accessToken) {
      setMemoryAccessToken(authData.accessToken);
    }
    if (authData.refreshToken) setStoredRefreshToken(authData.refreshToken);
    return authData;
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

  /** Mints a new access token from the stored refresh token / cookie.
   * Shared single-flight so concurrent callers never double-rotate. */
  async refreshTokens(): Promise<AuthResponseData> {
    return refreshSession();
  },

  async logout(): Promise<void> {
    try {
      const stored = getStoredRefreshToken();
      await apiClient.post('/auth/logout', stored ? { refreshToken: stored } : {});
    } finally {
      setMemoryAccessToken(null);
      setStoredRefreshToken(null);
    }
  },
};
