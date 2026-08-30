import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { workerConfig } from '../worker/workerConfig';
import { UnauthorizedError } from '../utils/errors';

/**
 * Validates inbound requests from the Java worker process using the same
 * shared secret already used in the other direction (Node -> Java, see
 * backend/worker/JavaWorkerClient.ts and worker/src/main/java/com/nexusflow/security/InternalAuthFilter.java).
 *
 * Fix for a confirmed bug: POST /api/v1/workers/register and
 * /api/v1/workers/heartbeat had no authentication at all, letting anyone
 * register or take over a "worker" identity and manipulate the task queue.
 *
 * Uses a constant-time comparison to match the timing-attack resistance
 * already present on the Java side (InternalAuthFilter uses
 * MessageDigest.isEqual).
 */
export function requireWorkerSecret(req: Request, _res: Response, next: NextFunction): void {
  const provided = req.header('X-Worker-Secret');
  const expected = workerConfig.javaWorkerSecret;

  if (!provided) {
    throw new UnauthorizedError('Invalid or missing worker credentials');
  }

  const providedBuf = Buffer.from(provided, 'utf-8');
  const expectedBuf = Buffer.from(expected, 'utf-8');

  const matches =
    providedBuf.length === expectedBuf.length && timingSafeEqual(providedBuf, expectedBuf);

  if (!matches) {
    throw new UnauthorizedError('Invalid or missing worker credentials');
  }
  next();
}
