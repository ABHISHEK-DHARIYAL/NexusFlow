import { create } from 'zustand';
import { User, GitHubAccount } from '../types';
import { authService } from '../services/auth.service';
import { setMemoryAccessToken } from '../services/apiClient';

interface AuthState {
  user: User | null;
  githubAccount: GitHubAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;

  initializeAuth: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: User | null, githubAccount?: GitHubAccount | null) => void;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  githubAccount: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      // Try to mint a fresh in-memory access token from the HTTP-only
      // refresh cookie first. This must come before getSession(): on a
      // cold page load there is no access token anywhere yet (nothing
      // sets a non-memory accessToken cookie), so getSession()'s
      // optionalAuth middleware can never see the user as authenticated
      // - gating refreshTokens() behind it (as this previously did) made
      // the refresh-cookie mechanism unreachable on page load/refresh.
      const authData = await authService.refreshTokens();
      if (authData.accessToken) {
        setMemoryAccessToken(authData.accessToken);
        set({
          user: authData.user,
          githubAccount: authData.githubAccount || null,
          isAuthenticated: true,
          accessToken: authData.accessToken,
          isLoading: false,
        });
        return;
      }
    } catch {
      // No valid refresh cookie (never logged in, or it expired/was
      // revoked) - fall through to the session check below as a
      // secondary check before concluding the user is unauthenticated.
    }

    try {
      const session = await authService.getSession();
      if (session.isAuthenticated && session.user) {
        set({
          user: session.user,
          githubAccount: session.githubAccount || null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        get().clearAuth();
      }
    } catch {
      get().clearAuth();
    } finally {
      set({ isLoading: false });
    }
  },

  login: () => {
    authService.loginWithGithub();
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      get().clearAuth();
    }
  },

  refreshSession: async () => {
    try {
      const authData = await authService.refreshTokens();
      if (authData.accessToken) {
        setMemoryAccessToken(authData.accessToken);
        set({
          user: authData.user,
          githubAccount: authData.githubAccount || null,
          isAuthenticated: true,
          accessToken: authData.accessToken,
        });
      }
    } catch {
      get().clearAuth();
    }
  },

  setUser: (user, githubAccount = null) => {
    set({
      user,
      githubAccount,
      isAuthenticated: !!user,
    });
  },

  setAccessToken: (token) => {
    setMemoryAccessToken(token);
    set({ accessToken: token });
  },

  clearAuth: () => {
    setMemoryAccessToken(null);
    set({
      user: null,
      githubAccount: null,
      isAuthenticated: false,
      accessToken: null,
      isLoading: false,
    });
  },
}));
