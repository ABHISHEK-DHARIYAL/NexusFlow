import { Request, Response, NextFunction } from 'express';
import { AuthService, buildRefreshCookieOptions } from '../services/AuthService';
import { TokenService } from '../services/TokenService';
import { RefreshTokenService } from '../services/RefreshTokenService';
import { GithubOAuthService } from '../services/GithubOAuthService';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';
import { GithubAccountRepository } from '../repositories/GithubAccountRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { UnauthorizedError } from '../utils/errors';
import { env } from '../config/env';
import { logger } from '../logger';
import { prisma } from '../lib/prisma';


// Instantiate singletons / dependencies for AuthController
const tokenService = new TokenService();
const refreshTokenRepo = new RefreshTokenRepository();
const userRepo = new UserRepository();
const githubAccountRepo = new GithubAccountRepository();

const githubOAuthService = new GithubOAuthService(tokenService);
const refreshTokenService = new RefreshTokenService(refreshTokenRepo, tokenService);
const userService = new UserService(userRepo, githubAccountRepo);

const authService = new AuthService(
  githubOAuthService,
  tokenService,
  refreshTokenService,
  userService
);

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, username, name } = req.body;
      const { authResult, refreshToken, cookieOptions } = await authService.signup({
        email,
        password,
        username,
        name,
      });

      res.cookie('refreshToken', refreshToken, cookieOptions);
      // refreshToken is also returned in the body so browsers that block
      // cross-site cookies can still keep the user signed in.
      res.status(201).json({ success: true, data: { ...authResult, refreshToken } });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { authResult, refreshToken, cookieOptions } = await authService.login(email, password);

      res.cookie('refreshToken', refreshToken, cookieOptions);
      res.status(200).json({ success: true, data: { ...authResult, refreshToken } });
    } catch (err) {
      next(err);
    }
  }

  static initiateGithub(req: Request, res: Response, next: NextFunction): void {
    try {
      const { url } = authService.initiateGithubAuth();
      res.redirect(url);
    } catch (err) {
      next(err);
    }
  }

  static async initiateGithubConnect(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Hit via a full-page navigation from Settings, so there's no
    // Authorization header available (the access token only ever lives
    // in memory) - authenticate off the HTTP-only refresh cookie instead.
    try {
      const userId = await authService.resolveUserIdFromRefreshCookie(req.cookies?.refreshToken);
      if (!userId) {
        res.redirect(`${env.FRONTEND_URL}/repositories?github_error=oauth_unauthorized`);
        return;
      }

      const { url } = authService.initiateGithubConnect(userId);
      res.redirect(url);
    } catch (err) {
      next(err);
    }
  }

  static async githubCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    // This endpoint is hit by the browser as a full-page navigation
    // (GitHub redirects here directly), never by the frontend's apiClient.
    // It must therefore always respond with a redirect - either back to
    // the app on success, or to a login error state on failure - and
    // must never render a raw JSON body in the browser.
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;

      if (!code || !state) {
        throw new UnauthorizedError('Missing code or state from GitHub OAuth callback');
      }

      const { authResult, refreshToken, cookieOptions, mode } = await authService.handleGithubCallback(
        code,
        state
      );

      // Set HTTP-only refreshToken cookie. This is the only piece of
      // authentication state handed to the browser here - the access
      // token is intentionally NOT included in the redirect (not as a
      // query param, not as a URL fragment). The frontend's existing
      // POST /api/auth/refresh flow (already used by useAuthStore on
      // app load) uses this cookie to mint an access token into memory
      // once it arrives on the app shell.
      res.cookie('refreshToken', refreshToken, cookieOptions);

      logger.auth.info(`[Auth Controller] GitHub OAuth callback succeeded (${mode}) for user ${authResult.user.id}; redirecting to frontend`);

      // A "connect" flow started from Settings while already logged in -
      // send the user back there (with a success flag) instead of the
      // app root, so they land where they started.
      const destination = mode === 'connect' ? '/repositories?github=connected' : '/repositories';
      res.redirect(`${env.FRONTEND_URL}${destination}`);
    } catch (err: any) {
      // Route OAuth callback failures back to the frontend's login page
      // with a short, non-sensitive error code, instead of letting the
      // global JSON error handler render raw JSON in the browser - the
      // browser is mid-navigation here, not making an API call.
      const message = err?.message || 'oauth_failed';
      let errorCode = 'oauth_failed';
      if (message === 'INVALID_OAUTH_STATE') {
        errorCode = 'invalid_state';
      } else if (err instanceof UnauthorizedError) {
        errorCode = 'oauth_unauthorized';
      } else if (err?.statusCode === 409) {
        errorCode = 'github_already_connected';
      }

      logger.auth.warn(`[Auth Controller] GitHub OAuth callback failed (${errorCode}): ${message}`);

      res.redirect(`${env.FRONTEND_URL}/repositories?github_error=${encodeURIComponent(errorCode)}`);
    }
  }

  /**
   * Returns the GitHub authorization URL for the signed-in user. Called with
   * the normal Bearer token (so it works even when cross-site cookies are
   * blocked); the frontend then navigates the browser to the returned URL.
   */
  static async githubConnectUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');

      if (
        !env.GITHUB_CLIENT_ID ||
        !env.GITHUB_CLIENT_SECRET ||
        env.GITHUB_CLIENT_ID === 'placeholder' ||
        env.GITHUB_CLIENT_SECRET === 'placeholder'
      ) {
        res.status(503).json({
          success: false,
          message:
            'GitHub connection is not configured on this server. The administrator must set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
        });
        return;
      }

      const { url } = authService.initiateGithubConnect(req.user.id);
      res.status(200).json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  }

  /** Whether the signed-in user has GitHub connected (tokens never returned). */
  static async githubStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');

      const account = await githubAccountRepo.findByUserId(req.user.id);
      res.status(200).json({
        success: true,
        data: {
          connected: !!account,
          configured: !(
            !env.GITHUB_CLIENT_ID ||
            !env.GITHUB_CLIENT_SECRET ||
            env.GITHUB_CLIENT_ID === 'placeholder' ||
            env.GITHUB_CLIENT_SECRET === 'placeholder'
          ),
          githubAccount: account
            ? {
                githubUsername: account.githubUsername,
                profileUrl: account.profileUrl,
                avatarUrl: account.avatarUrl,
              }
            : null,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /** Disconnects GitHub from the signed-in user's account. */
  static async githubDisconnect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');

      // Best-effort: also revoke NexusFlow's access on GitHub's side, so the
      // saved token stops working everywhere (not just in our database).
      const account = await githubAccountRepo.findByUserId(req.user.id);
      if (account?.accessToken && env.GITHUB_CLIENT_ID !== 'placeholder') {
        try {
          const basic = Buffer.from(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`).toString('base64');
          await fetch(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/grant`, {
            method: 'DELETE',
            headers: {
              Authorization: `Basic ${basic}`,
              Accept: 'application/vnd.github+json',
              'Content-Type': 'application/json',
              'User-Agent': 'NexusFlow',
            },
            body: JSON.stringify({ access_token: account.accessToken }),
          });
        } catch (revokeErr: any) {
          logger.auth.warn(`[Auth Controller] Could not revoke GitHub grant: ${revokeErr?.message}`);
        }
      }

      await prisma.gitHubAccount.deleteMany({ where: { userId: req.user.id } });
      await prisma.user.update({ where: { id: req.user.id }, data: { githubId: null } });
      res.status(200).json({ success: true, message: 'GitHub disconnected' });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken =
        req.cookies?.refreshToken || (req.body && req.body.refreshToken);

      if (!rawRefreshToken) {
        throw new UnauthorizedError('No refresh token provided in cookies or request body');
      }

      const { authResult, newRefreshToken, cookieOptions } = await authService.refreshTokens(
        rawRefreshToken
      );

      // Set new HTTP-only cookie
      res.cookie('refreshToken', newRefreshToken, cookieOptions);

      res.status(200).json({
        success: true,
        data: { ...authResult, refreshToken: newRefreshToken },
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken =
        req.cookies?.refreshToken || (req.body && req.body.refreshToken);

      if (rawRefreshToken) {
        await authService.logout(rawRefreshToken);
      }

      // Clear cookie securely
      const { maxAge: _maxAge, ...clearOptions } = buildRefreshCookieOptions();
      res.clearCookie('refreshToken', clearOptions);

      res.status(200).json({
        success: true,
        message: 'Successfully logged out',
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(200).json({
          user: null,
          success: true,
          data: null,
        });
        return;
      }

      const user = await userService.getUserById(req.user.id);
      const userDto = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        githubId: user.githubId,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      };

      res.status(200).json({
        user: userDto,
        success: true,
        data: userDto,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(200).json({
          success: true,
          data: {
            user: null,
            isAuthenticated: false,
          },
        });
        return;
      }

      const sessionData = await authService.getSession(req.user.id);
      res.status(200).json({
        success: true,
        data: sessionData,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default AuthController;
