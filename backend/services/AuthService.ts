import { GithubOAuthService } from './GithubOAuthService';
import { TokenService } from './TokenService';
import { RefreshTokenService } from './RefreshTokenService';
import { UserService } from './UserService';
import { AuthResponseDto, SessionResponseDto, mapUserToResponseDto } from '../dtos/auth.dto';
import { logger } from '../logger';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

export class AuthService {
  constructor(
    private githubOAuthService: GithubOAuthService,
    private tokenService: TokenService,
    private refreshTokenService: RefreshTokenService,
    private userService: UserService
  ) {}

  initiateGithubAuth(): { url: string; state: string } {
    logger.auth.info(`[Auth Service] OAuth started`);
    return this.githubOAuthService.getAuthorizationUrl();
  }

  async handleGithubCallback(code: string, state: string): Promise<{
    authResult: AuthResponseDto;
    refreshToken: string;
    cookieOptions: CookieOptions;
  }> {
    // 1. Validate OAuth State
    const isValidState = this.githubOAuthService.validateState(state);
    if (!isValidState) {
      logger.auth.warn(`[Auth Service] OAuth state validation failed or expired for state: ${state}`);
      throw new Error('INVALID_OAUTH_STATE');
    }

    // 2. Exchange Code
    const { accessToken: githubToken, refreshToken: githubRefreshToken } =
      await this.githubOAuthService.exchangeCodeForToken(code);

    // 3. Fetch Profile
    const githubProfile = await this.githubOAuthService.fetchUserProfile(githubToken);

    // 4. Create or Update User
    const user = await this.userService.findOrCreateFromGithub(
      githubProfile,
      githubToken,
      githubRefreshToken
    );

    // 5. Generate Access Token & Refresh Token
    const { accessToken, expiresIn } = this.tokenService.generateAccessToken(user.id, user.role);
    const { refreshToken, expiresAt } = await this.refreshTokenService.createRefreshToken(user.id);

    logger.auth.info(`[Auth Service] Login success for user: ${user.username} (${user.id})`);

    const userDto = mapUserToResponseDto(user);
    const authResult: AuthResponseDto = {
      user: userDto,
      accessToken,
      expiresIn,
    };

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: '/api/auth',
    };

    return { authResult, refreshToken, cookieOptions };
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

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    };

    return { authResult, newRefreshToken: newRawRefreshToken, cookieOptions };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    if (rawRefreshToken) {
      await this.refreshTokenService.revokeRefreshToken(rawRefreshToken);
    }
    logger.auth.info(`[Auth Service] Logout completed`);
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
