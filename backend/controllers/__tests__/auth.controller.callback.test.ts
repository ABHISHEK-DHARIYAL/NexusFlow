import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression tests for a confirmed bug: GET /api/auth/github/callback is a
// browser navigation (GitHub redirects the user's browser here directly),
// but the controller previously responded with res.json(...) - so instead
// of landing on the app, the browser displayed the raw JSON auth response.
// The fix makes this endpoint always redirect: to FRONTEND_URL/ on
// success, or to FRONTEND_URL/login?error=<code> on failure. The access
// token is never put in the redirect URL - only the existing HTTP-only
// refresh cookie is set, matching the app's existing
// cookie + POST /api/auth/refresh hydration mechanism.

vi.mock('../../config/env', () => ({
  env: { FRONTEND_URL: 'http://localhost:5000' },
}));

vi.mock('../../logger', () => ({
  logger: { auth: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } },
}));

const { handleGithubCallbackMock } = vi.hoisted(() => ({
  handleGithubCallbackMock: vi.fn(),
}));

vi.mock('../../services/AuthService', () => ({
  AuthService: class {
    handleGithubCallback = handleGithubCallbackMock;
  },
}));
vi.mock('../../services/TokenService', () => ({ TokenService: class {} }));
vi.mock('../../services/RefreshTokenService', () => ({ RefreshTokenService: class {} }));
vi.mock('../../services/GithubOAuthService', () => ({ GithubOAuthService: class {} }));
vi.mock('../../services/UserService', () => ({ UserService: class {} }));
vi.mock('../../repositories/UserRepository', () => ({ UserRepository: class {} }));
vi.mock('../../repositories/GithubAccountRepository', () => ({ GithubAccountRepository: class {} }));
vi.mock('../../repositories/RefreshTokenRepository', () => ({ RefreshTokenRepository: class {} }));

import { AuthController } from '../auth.controller';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.redirect = vi.fn().mockReturnValue(res);
  return res;
}

describe('AuthController.githubCallback - browser redirect behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to FRONTEND_URL/ on success and never renders JSON in the browser', async () => {
    handleGithubCallbackMock.mockResolvedValueOnce({
      authResult: { user: { id: 'user-1' }, accessToken: 'access-token-value', expiresIn: 900 },
      refreshToken: 'refresh-token-value',
      cookieOptions: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 1000, path: '/api/auth' },
    });

    const req: any = { query: { code: 'abc123', state: 'valid-state' } };
    const res = mockRes();
    const next = vi.fn();

    await AuthController.githubCallback(req, res, next);

    expect(res.json).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5000/');
  });

  it('sets the refresh cookie but never puts the access token in the redirect URL', async () => {
    handleGithubCallbackMock.mockResolvedValueOnce({
      authResult: { user: { id: 'user-1' }, accessToken: 'super-secret-access-token', expiresIn: 900 },
      refreshToken: 'refresh-token-value',
      cookieOptions: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 1000, path: '/api/auth' },
    });

    const req: any = { query: { code: 'abc123', state: 'valid-state' } };
    const res = mockRes();
    const next = vi.fn();

    await AuthController.githubCallback(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token-value',
      expect.objectContaining({ httpOnly: true })
    );

    const redirectUrl = res.redirect.mock.calls[0][0];
    expect(redirectUrl).not.toContain('super-secret-access-token');
    expect(redirectUrl).not.toContain('accessToken');
  });

  it('redirects to /login?error=invalid_state on invalid state, without calling next()', async () => {
    handleGithubCallbackMock.mockRejectedValueOnce(new Error('INVALID_OAUTH_STATE'));

    const req: any = { query: { code: 'abc123', state: 'forged-state' } };
    const res = mockRes();
    const next = vi.fn();

    await AuthController.githubCallback(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('http://localhost:5000/login?error=invalid_state');
  });

  it('redirects to /login?error=... when code or state is missing, without rendering JSON', async () => {
    const req: any = { query: {} };
    const res = mockRes();
    const next = vi.fn();

    await AuthController.githubCallback(req, res, next);

    expect(res.json).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('http://localhost:5000/login?error='));
  });
});
