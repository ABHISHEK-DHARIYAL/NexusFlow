import { RefreshToken, Prisma } from '@prisma/client';
import { IRefreshTokenRepository } from '../interfaces/IRefreshTokenRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    try {
      return await prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
    } catch (err) {
      logger.database.error(`RefreshTokenRepository.findByTokenHash failed: ${(err as Error).message}`);
      return null;
    }
  }

  async revokeToken(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  async revokeFamily(familyId: string): Promise<Prisma.BatchPayload> {
    return prisma.refreshToken.updateMany({
      where: { familyId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeAllForUser(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async deleteExpired(): Promise<Prisma.BatchPayload> {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
