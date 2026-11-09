import { Session, Prisma } from '@prisma/client';

export interface ISessionRepository {
  create(data: Prisma.SessionCreateInput): Promise<Session>;
  findByToken(sessionToken: string): Promise<Session | null>;
  deleteByToken(sessionToken: string): Promise<Session | null>;
  deleteAllForUser(userId: string): Promise<Prisma.BatchPayload>;
}
