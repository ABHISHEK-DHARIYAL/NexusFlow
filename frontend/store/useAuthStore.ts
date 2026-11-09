import { create } from 'zustand';
import { User, GitHubAccount } from '../types';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { setMemoryAccessToken, setStoredRefreshToken } from '../services/apiClient';

interface AuthState {
  user: User | null;
  githubAccount: GitHubAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  authError: string | null;

  initializeAuth: () => Promise<void>;
  signup: (data: { email: string; password: string; username?: string; name?: string }) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  connectGithub: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
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
  authError: null,

  initializeAuth: async () => {
    set({ isLoading: true });

    // Restore the saved login: the refresh token (HTTP-only cookie and/or
    // the localStorage copy) mints a fresh access token, so the user does
    // not have to sign in again after a reload or browser restart. Retry a
    // few times on network errors / 5xx because free hosting tiers can
    // take a while to wake the backend up - we must not mistake a sleeping
    // server for a signed-out user.
    const MAX_ATTEMPTS = 4;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const authData = await authService.refreshTokens();
        if (authData.accessToken) {
          set({
            user: authData.user,
            githubAccount: authData.githubAccount || null,
            isAuthenticated: true,
            accessToken: authData.accessToken,
            isLoading: false,
          });
          return;
        }
        break;
      } catch (err: any) {
        const status = err?.status;
        const transient = status === 0 || (typeof status === 'number' && status >= 500);
        if (transient && attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        break; // Definitive "not signed in" (or gave up retrying)
      }
    }

    get().clearAuth();
  },

  signup: async (data) => {
    set({ authError: null });
    try {
      const authData = await authService.signup(data);
      set({
        user: authData.user,
        githubAccount: authData.githubAccount || null,
        isAuthenticated: true,
        accessToken: authData.accessToken,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ authError: err?.status === 404 ? 'Sign-up endpoint not found on the server. The backend is running an older version - redeploy the latest code.' : (err?.message || 'Could not create your account. Please try again.') });
      return false;
    }
  },

  loginWithPassword: async (email, password) => {
    set({ authError: null });
    try {
      const authData = await authService.loginWithPassword(email, password);
      set({
        user: authData.user,
        githubAccount: authData.githubAccount || null,
        isAuthenticated: true,
        accessToken: authData.accessToken,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ authError: err?.status === 404 ? 'Login endpoint not found on the server. The backend is running an older version - redeploy the latest code.' : (err?.message || 'Invalid email or password.') });
      return false;
    }
  },

  connectGithub: async () => {
    await authService.connectGithub();
  },

  deleteAccount: async () => {
    const currentUser = get().user;
    if (!currentUser) {
      set({ authError: 'You must be signed in to delete your account.' });
      return false;
    }
    set({ authError: null });
    try {
      await userService.deleteAccount(currentUser.id);
      // The account (and its refresh token) is gone server-side; this just
      // clears the HTTP-only cookie and resets local state.
      await authService.logout();
      get().clearAuth();
      return true;
    } catch (err: any) {
      set({ authError: err?.message || 'Could not delete your account. Please try again.' });
      return false;
    }
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
        set({
          user: authData.user,
          githubAccount: authData.githubAccount || null,
          isAuthenticated: true,
          accessToken: authData.accessToken,
        });
      }
    } catch (err: any) {
      if ([400, 401, 403, 422].includes(err?.status)) get().clearAuth();
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
    setStoredRefreshToken(null);
    set({
      user: null,
      githubAccount: null,
      isAuthenticated: false,
      accessToken: null,
      isLoading: false,
    });
  },
}));
