import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Attach log handlers
if ('$on' in prisma) {
  (prisma as any).$on('query', (e: any) => {
    logger.database.debug(`Query: ${e.query}`, { duration: `${e.duration}ms` });
  });

  (prisma as any).$on('error', (e: any) => {
    const msg = e.message || '';
    if (msg.includes("Can't reach database server") || msg.includes("P1001") || msg.includes("ECONNREFUSED")) {
      logger.database.debug(`Prisma connection unavailable (using in-memory fallback): ${msg}`);
    } else {
      logger.database.error(`Prisma Error: ${msg}`);
    }
  });
}

export default prisma;
