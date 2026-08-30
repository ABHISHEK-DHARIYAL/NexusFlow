import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository';
import { TokenService } from './TokenService';
import { prisma } from '../lib/prisma';
import { UnauthorizedError, SecurityError } from '../utils/errors';
import { logger } from '../logger';

export class RefreshTokenService {
  constructor(
    private refreshTokenRepo: IRefreshTokenRepository,
    private tokenService: TokenService
  ) {}

  async createRefreshToken(userId: string, familyId?: string): Promise<{ refreshToken: string; tokenHash: string; expiresAt: Date; familyId: string }> {
    const rawToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashRefreshToken(rawToken);
    const tokenFamilyId = familyId || this.tokenService.generateFamilyId();
    
    // Default 7 days expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.create({
      user: { connect: { id: userId } },
      tokenHash,
      familyId: tokenFamilyId,
      expiresAt,
    });

    return { refreshToken: rawToken, tokenHash, expiresAt, familyId: tokenFamilyId };
  }

  async rotateRefreshToken(rawRefreshToken: string): Promise<{
    userId: string;
    newRawRefreshToken: string;
    expiresAt: Date;
    familyId: string;
  }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const existingToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!existingToken) {
      logger.auth.warn(`[Refresh Token] Invalid or unknown token hash provided`);
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if revoked -> REUSE DETECTED!
    if (existingToken.isRevoked) {
      logger.auth.error(
        `🚨 [SECURITY LOG] Refresh token reuse detected! UserId: ${existingToken.userId}, FamilyId: ${existingToken.familyId}`
      );
      // Revoke the entire token family to protect user
      await this.refreshTokenRepo.revokeFamily(existingToken.familyId);
      throw new SecurityError('Refresh token reuse detected. All sessions in this family have been revoked.');
    }

    // Check expiration
    if (new Date() > existingToken.expiresAt) {
      logger.auth.warn(`[Refresh Token] Token expired for userId: ${existingToken.userId}`);
      await this.refreshTokenRepo.revokeToken(existingToken.id);
      throw new UnauthorizedError('Refresh token has expired');
    }

    const newRawRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenHash = this.tokenService.hashRefreshToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Atomic rotation in transaction
    await prisma.$transaction(async (tx) => {
      // Revoke old token
      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: { isRevoked: true },
      });

      // Create new token in same family
      await tx.refreshToken.create({
        data: {
          userId: existingToken.userId,
          tokenHash: newTokenHash,
          familyId: existingToken.familyId,
          expiresAt,
        },
      });
    });

    logger.auth.info(`[Refresh Token] Successfully rotated token for userId: ${existingToken.userId}`);

    return {
      userId: existingToken.userId,
      newRawRefreshToken,
      expiresAt,
      familyId: existingToken.familyId,
    };
  }

  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const existingToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (existingToken) {
      await this.refreshTokenRepo.revokeToken(existingToken.id);
      logger.auth.info(`[Refresh Token] Revoked refresh token for userId: ${existingToken.userId}`);
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userId);
    logger.auth.info(`[Refresh Token] Revoked all tokens for userId: ${userId}`);
  }
}

export default RefreshTokenService;
