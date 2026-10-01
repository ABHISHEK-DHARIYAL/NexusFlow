import { GithubOAuthService } from './GithubOAuthService';
import { TokenService } from './TokenService';
import { RefreshTokenService } from './RefreshTokenService';
import { UserService } from './UserService';
import { AuthResponseDto, SessionResponseDto, mapUserToResponseDto } from '../dtos/auth.dto';
import { logger } from '../logger';
import { User } from '@prisma/client';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

const buildRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth',
});

export class AuthService {
  constructor(
    private githubOAuthService: GithubOAuthService,
    private tokenService: TokenService,
    private refreshTokenService: RefreshTokenService,
    private userService: UserService
  ) {}

  private async issueTokensFor(user: User): Promise<{
    authResult: AuthResponseDto;
    refreshToken: string;
    cookieOptions: CookieOptions;
  }> {
    const { accessToken, expiresIn } = this.tokenService.generateAccessToken(user.id, user.role);
    const { refreshToken } = await this.refreshTokenService.createRefreshToken(user.id);

    const userDto = mapUserToResponseDto(user);
    const authResult: AuthResponseDto = {
      user: userDto,
      accessToken,
      expiresIn,
    };

    return { authResult, refreshToken, cookieOptions: buildRefreshCookieOptions() };
  }

  async signup(data: {
    email: string;
    password: string;
    username?: string;
    name?: string;
  }): Promise<{ authResult: AuthResponseDto; refreshToken: string; cookieOptions: CookieOptions }> {
    const user = await this.userService.createWithPassword(data);
    logger.auth.info(`[Auth Service] Signup success for user: ${user.username} (${user.id})`);
    return this.issueTokensFor(user);
  }

  async login(
    email: string,
    password: string
  ): Promise<{ authResult: AuthResponseDto; refreshToken: string; cookieOptions: CookieOptions }> {
    const user = await this.userService.validateCredentials(email, password);
    logger.auth.info(`[Auth Service] Email/password login success for user: ${user.username} (${user.id})`);
    return this.issueTokensFor(user);
  }

  initiateGithubAuth(): { url: string; state: string } {
    logger.auth.info(`[Auth Service] OAuth started`);
    return this.githubOAuthService.getAuthorizationUrl();
  }

  /**
   * Same as initiateGithubAuth, but ties the OAuth state to an
   * already-authenticated user so the callback links GitHub to that
   * account instead of logging in/signing up a separate one.
   */
  initiateGithubConnect(userId: string): { url: string; state: string } {
    logger.auth.info(`[Auth Service] GitHub connect flow started for user ${userId}`);
    return this.githubOAuthService.getAuthorizationUrl(userId);
  }

  async handleGithubCallback(code: string, state: string): Promise<{
    authResult: AuthResponseDto;
    refreshToken: string;
    cookieOptions: CookieOptions;
    mode: 'login' | 'connect';
  }> {
    // 1. Validate OAuth State
    const stateData = this.githubOAuthService.validateState(state);
    if (!stateData) {
      logger.auth.warn(`[Auth Service] OAuth state validation failed or expired for state: ${state}`);
      throw new Error('INVALID_OAUTH_STATE');
    }

    // 2. Exchange Code
    const { accessToken: githubToken, refreshToken: githubRefreshToken } =
      await this.githubOAuthService.exchangeCodeForToken(code);

    // 3. Fetch Profile
    const githubProfile = await this.githubOAuthService.fetchUserProfile(githubToken);

    // 4. Either link GitHub to the already-logged-in user ("connect"),
    // or find/create a user the normal login/signup way.
    let user: User;
    let mode: 'login' | 'connect';
    if (stateData.linkUserId) {
      user = await this.userService.linkGithubAccount(
        stateData.linkUserId,
        githubProfile,
        githubToken,
        githubRefreshToken
      );
      mode = 'connect';
    } else {
      user = await this.userService.findOrCreateFromGithub(
        githubProfile,
        githubToken,
        githubRefreshToken
      );
      mode = 'login';
    }

    // 5. Generate Access Token & Refresh Token
    logger.auth.info(`[Auth Service] GitHub ${mode} success for user: ${user.username} (${user.id})`);
    const { authResult, refreshToken, cookieOptions } = await this.issueTokensFor(user);

    return { authResult, refreshToken, cookieOptions, mode };
  }

  async refreshTokens(rawRefreshToken: string): Promise<{
    authResult: AuthResponseDto;
    newRefreshToken: string;
    cookieOptions: CookieOptions;
  }> {
    const { userId, newRawRefreshToken } =
      await this.refreshTokenService.rotateRefreshToken(rawRefreshToken);

    const user = await this.userService.getUserById(userId);
    const { accessToken, expiresIn } = this.tokenService.generateAccessToken(user.id, user.role);

    logger.auth.info(`[Auth Service] Token refresh successful for user: ${user.username}`);

    const userDto = mapUserToResponseDto(user);
    const authResult: AuthResponseDto = {
      user: userDto,
      accessToken,
      expiresIn,
    };

    return { authResult, newRefreshToken: newRawRefreshToken, cookieOptions: buildRefreshCookieOptions() };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    if (rawRefreshToken) {
      await this.refreshTokenService.revokeRefreshToken(rawRefreshToken);
    }
    logger.auth.info(`[Auth Service] Logout completed`);
  }

  /**
   * Resolves the userId behind a raw refresh-token cookie without
   * rotating it. Used to authenticate the "Connect GitHub" page
   * navigation, which carries the HTTP-only refresh cookie but not the
   * in-memory Bearer access token.
   */
  async resolveUserIdFromRefreshCookie(rawRefreshToken: string | undefined): Promise<string | null> {
    return this.refreshTokenService.resolveUserIdFromRefreshCookie(rawRefreshToken);
  }

  async getSession(userId: string): Promise<SessionResponseDto> {
    const user = await this.userService.getUserById(userId);
    return {
      user: mapUserToResponseDto(user),
      isAuthenticated: true,
    };
  }
}

export default AuthService;
