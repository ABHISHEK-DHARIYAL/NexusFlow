import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression test for a confirmed bug: initializeAuth() previously only
// attempted authService.refreshTokens() (the only call that actually uses
// the HTTP-only refresh cookie) INSIDE an `if (session.isAuthenticated)`
// branch. But getSession() can never report authenticated on a cold page
// load - there is no access token anywhere yet at that point (nothing
// sets a non-memory accessToken cookie) - so that branch was unreachable,
// and a user landing on the app with only a valid refresh cookie (e.g.
// right after the GitHub OAuth redirect, or after a normal page refresh)
// was incorrectly treated as logged out. The fix tries refreshTokens()
// first, since it's the only mechanism that actually reads that cookie.

const { refreshTokensMock, getSessionMock, setMemoryAccessTokenMock } = vi.hoisted(() => ({
  refreshTokensMock: vi.fn(),
  getSessionMock: vi.fn(),
  setMemoryAccessTokenMock: vi.fn(),
}));

vi.mock('../../services/auth.service', () => ({
  authService: {
    refreshTokens: refreshTokensMock,
    getSession: getSessionMock,
    loginWithGithub: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../../services/apiClient', () => ({
  setMemoryAccessToken: setMemoryAccessTokenMock,
}));

import { useAuthStore } from '../useAuthStore';

describe('useAuthStore.initializeAuth - cold page load with only a refresh cookie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      githubAccount: null,
      isAuthenticated: false,
      isLoading: true,
      accessToken: null,
    });
  });

  it('authenticates the user from refreshTokens() alone, without requiring getSession() to already say authenticated', async () => {
    refreshTokensMock.mockResolvedValueOnce({
      user: { id: 'user-1', username: 'octocat' },
      accessToken: 'fresh-access-token',
      expiresIn: 900,
    });
    // Simulate the pre-existing bug scenario: getSession() reports
    // unauthenticated (as it always does on cold load, since no access
    // token is attached to that request either).
    getSessionMock.mockResolvedValueOnce({ user: null, isAuthenticated: false });

    await useAuthStore.getState().initializeAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({ id: 'user-1', username: 'octocat' });
    expect(state.isLoading).toBe(false);
    expect(setMemoryAccessTokenMock).toHaveBeenCalledWith('fresh-access-token');
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('falls back to clearing auth state when there is no valid refresh cookie at all', async () => {
    refreshTokensMock.mockRejectedValueOnce({ status: 401 });
    getSessionMock.mockResolvedValueOnce({ user: null, isAuthenticated: false });

    await useAuthStore.getState().initializeAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('never leaves isLoading stuck at true, on either success or failure', async () => {
    refreshTokensMock.mockRejectedValueOnce({ status: 401 });
    getSessionMock.mockRejectedValueOnce(new Error('network error'));

    await useAuthStore.getState().initializeAuth();

    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
