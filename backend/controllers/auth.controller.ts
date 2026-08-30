import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
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
  static initiateGithub(req: Request, res: Response, next: NextFunction): void {
    try {
      const { url } = authService.initiateGithubAuth();
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

      const { authResult, refreshToken, cookieOptions } = await authService.handleGithubCallback(
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

      logger.auth.info(`[Auth Controller] GitHub OAuth callback succeeded for user ${authResult.user.id}; redirecting to frontend`);

      res.redirect(`${env.FRONTEND_URL}/`);
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
      }

      logger.auth.warn(`[Auth Controller] GitHub OAuth callback failed (${errorCode}): ${message}`);

      res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(errorCode)}`);
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
        data: authResult,
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
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
      });

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
