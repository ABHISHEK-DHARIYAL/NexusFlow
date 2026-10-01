import { create } from 'zustand';
import { User, GitHubAccount } from '../types';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { setMemoryAccessToken } from '../services/apiClient';

interface AuthState {
  user: User | null;
  githubAccount: GitHubAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  authError: string | null;

  initializeAuth: () => Promise<void>;
  login: () => void;
  signup: (data: { email: string; password: string; username?: string; name?: string }) => Promise<boolean>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  connectGithub: () => void;
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

  connectGithub: () => {
    authService.connectGithub();
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
