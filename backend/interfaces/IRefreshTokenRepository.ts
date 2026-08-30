import { RefreshToken, Prisma } from '@prisma/client';

export interface IRefreshTokenRepository {
  create(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeToken(id: string): Promise<RefreshToken>;
  revokeFamily(familyId: string): Promise<Prisma.BatchPayload>;
  revokeAllForUser(userId: string): Promise<Prisma.BatchPayload>;
  deleteExpired(): Promise<Prisma.BatchPayload>;
}
