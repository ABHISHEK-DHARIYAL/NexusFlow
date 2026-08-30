import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Regression tests for improved GitHub OAuth debug logging: failures must
// surface GitHub's real error detail (status, body/error fields) for local
// debugging, while GITHUB_CLIENT_SECRET, the authorization code, and any
// access/refresh token must never appear in a log line.

vi.mock('../../logger', () => ({
  logger: {
    auth: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  },
}));

import { GithubOAuthService } from '../GithubOAuthService';
import { TokenService } from '../TokenService';
import { logger } from '../../logger';

const SECRET_TOKEN = 'gho_supersecrettoken123';
const SECRET_CLIENT_SECRET = 'client-secret-value-xyz';

describe('GithubOAuthService - safe debug logging', () => {
  let service: GithubOAuthService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new GithubOAuthService({} as TokenService);
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs status, statusText, and body on a failed profile fetch, without the access token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve('{"message":"Bad credentials"}'),
    });

    await expect(service.fetchUserProfile(SECRET_TOKEN)).rejects.toThrow('Failed to fetch user profile from GitHub');

    expect(logger.auth.error).toHaveBeenCalledWith(
      expect.stringContaining('status=401, statusText=Unauthorized, body={"message":"Bad credentials"}')
    );

    const allLoggedText = (logger.auth.error as any).mock.calls.map((c: any[]) => c.join(' ')).join(' ');
    expect(allLoggedText).not.toContain(SECRET_TOKEN);
  });

  it('logs error/error_description/status on a failed token exchange, without client_secret or the code', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'bad_verification_code', error_description: 'The code passed is incorrect or expired.' }),
    });

    await expect(service.exchangeCodeForToken('some-auth-code')).rejects.toThrow('GitHub authorization failed');

    expect(logger.auth.error).toHaveBeenCalledWith(
      expect.stringContaining('status=400, error=bad_verification_code, error_description=The code passed is incorrect or expired.')
    );

    const allLoggedText = (logger.auth.error as any).mock.calls.map((c: any[]) => c.join(' ')).join(' ');
    expect(allLoggedText).not.toContain(SECRET_CLIENT_SECRET);
    expect(allLoggedText).not.toContain('some-auth-code');
  });

  it('never logs the access token on a successful profile fetch either', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, login: 'octocat', name: 'Octo Cat', email: 'octo@example.com', avatar_url: 'a', html_url: 'h' }),
      });

    await service.fetchUserProfile(SECRET_TOKEN);

    const allCalls = [...(logger.auth.info as any).mock.calls, ...(logger.auth.error as any).mock.calls];
    const allLoggedText = allCalls.map((c: any[]) => c.join(' ')).join(' ');
    expect(allLoggedText).not.toContain(SECRET_TOKEN);
  });
});
