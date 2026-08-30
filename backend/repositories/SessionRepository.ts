import { Session, Prisma } from '@prisma/client';
import { ISessionRepository } from '../interfaces/ISessionRepository';
import { prisma } from '../lib/prisma';
import { logger } from '../logger';

export class SessionRepository implements ISessionRepository {
  async create(data: Prisma.SessionCreateInput): Promise<Session> {
    return prisma.session.create({ data });
  }

  async findByToken(sessionToken: string): Promise<Session | null> {
    try {
      return await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
    } catch (err) {
      logger.database.error(`SessionRepository.findByToken failed: ${(err as Error).message}`);
      return null;
    }
  }

  async deleteByToken(sessionToken: string): Promise<Session | null> {
    try {
      return await prisma.session.delete({
        where: { sessionToken },
      });
    } catch (err) {
      logger.database.error(`SessionRepository.deleteByToken failed: ${(err as Error).message}`);
      return null;
    }
  }

  async deleteAllForUser(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }
}
