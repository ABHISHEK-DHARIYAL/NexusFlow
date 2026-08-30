import { env } from '../config/env';
import { TokenService } from './TokenService';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import { logger } from '../logger';

export interface GithubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

interface OAuthStateData {
  state: string;
  expiresAt: number;
}

export class OAuthStateStore {
  private states = new Map<string, OAuthStateData>();
  private readonly ttlMs = 10 * 60 * 1000; // 10 minutes TTL

  createState(): string {
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + this.ttlMs;
    this.states.set(state, { state, expiresAt });
    this.cleanExpired();
    return state;
  }

  validateAndInvalidate(state: string): boolean {
    if (!state) return false;
    const data = this.states.get(state);
    if (!data) return false;

    // Remove immediately so it can never be reused
    this.states.delete(state);

    if (Date.now() > data.expiresAt) {
      return false;
    }
    return true;
  }

  private cleanExpired() {
    const now = Date.now();
    for (const [key, val] of this.states.entries()) {
      if (now > val.expiresAt) {
        this.states.delete(key);
      }
    }
  }
}

export class GithubOAuthService {
  private stateStore = new OAuthStateStore();

  constructor(private tokenService: TokenService) {}

  getAuthorizationUrl(): { url: string; state: string } {
    const clientId = env.GITHUB_CLIENT_ID;
    const callbackUrl = env.GITHUB_CALLBACK_URL;

    // The state sent to GitHub must be the exact same value stored for
    // later validation in the callback. Previously two different random
    // values were generated here - one was stored, a different one was
    // sent to GitHub - so every real OAuth callback failed state
    // validation and login never worked.
    const state = this.stateStore.createState();

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: 'read:user user:email repo',
      state,
    });

    const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
    logger.auth.info(`[OAuth] Generated GitHub OAuth authorization URL`);
    return { url, state };
  }

  validateState(state: string): boolean {
    return this.stateStore.validateAndInvalidate(state);
  }

  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    if (!code) {
      throw new BadRequestError('Authorization code is required');
    }

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: env.GITHUB_CALLBACK_URL,
        }),
      });

      const data = await response.json();

      if (data.error || !data.access_token) {
        // Debugging aid only: logs the error code/description GitHub itself
        // returned plus the HTTP status, so a failed exchange is
        // diagnosable locally. Never logs client_secret, the authorization
        // code, access_token, or refresh_token.
        logger.auth.error(
          `[OAuth] GitHub token exchange failed: status=${response.status}, error=${data.error || 'unknown'}, error_description=${data.error_description || 'none'}`
        );
        throw new UnauthorizedError(`GitHub authorization failed: ${data.error_description || 'Invalid code'}`);
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || undefined,
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedError || err instanceof BadRequestError) throw err;
      logger.auth.error(`[OAuth] GitHub token exchange HTTP error: ${err.message}`);
      throw new UnauthorizedError('Failed to communicate with GitHub OAuth service');
    }
  }

  async fetchUserProfile(githubAccessToken: string): Promise<GithubUserProfile> {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
          'User-Agent': 'NexusFlow-Auth-Agent',
          Accept: 'application/json',
        },
      });

      if (!userRes.ok) {
        // Debugging aid only: reads GitHub's actual error response body so
        // a failed /user call is diagnosable locally (GitHub returns
        // useful detail here, e.g. bad credentials, rate limiting, scope
        // issues). githubAccessToken is never included in this log line.
        const errorBody = await userRes.text().catch(() => '<failed to read response body>');
        logger.auth.error(
          `[OAuth] GitHub profile request failed: status=${userRes.status}, statusText=${userRes.statusText}, body=${errorBody}`
        );
        throw new UnauthorizedError('Failed to fetch user profile from GitHub');
      }

      const rawUser = await userRes.json();

      // If email is private, fetch primary email from /user/emails
      let email = rawUser.email;
      if (!email) {
        try {
          const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${githubAccessToken}`,
              'User-Agent': 'NexusFlow-Auth-Agent',
              Accept: 'application/json',
            },
          });
          if (emailsRes.ok) {
            const emails = await emailsRes.json();
            const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
            if (primary) email = primary.email;
          }
        } catch {
          // ignore email fetch failure fallback
        }
      }

      if (!email) {
        email = `${rawUser.login}@users.noreply.github.com`;
      }

      return {
        id: rawUser.id,
        login: rawUser.login,
        name: rawUser.name || rawUser.login,
        email,
        avatar_url: rawUser.avatar_url,
        html_url: rawUser.html_url,
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedError) throw err;
      logger.auth.error(`[OAuth] GitHub user profile fetch error: ${err.message}`);
      throw new UnauthorizedError('Failed to retrieve GitHub user information');
    }
  }
}

export default GithubOAuthService;
