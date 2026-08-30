import { UserRole } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from './errors';
import { logger } from '../logger';

export interface AuthUser {
  id: string;
  role: UserRole | string;
}

/**
 * Asserts that the authenticated user owns the resource or has ADMIN role.
 * Throws ForbiddenError if the check fails.
 */
export function assertResourceOwnership(
  resourceUserId: string,
  authUser: AuthUser | undefined,
  resourceName = 'resource'
): void {
  if (!authUser) {
    throw new ForbiddenError('Authentication required to verify ownership');
  }

  if (authUser.role === UserRole.ADMIN || authUser.role === 'ADMIN') {
    return; // Admins bypass resource ownership checks
  }

  if (authUser.id !== resourceUserId) {
    logger.auth.warn(
      `[Resource Ownership] IDOR attempt by user ${authUser.id} on ${resourceName} belonging to user ${resourceUserId}`
    );
    throw new ForbiddenError(`You do not have ownership of this ${resourceName}`);
  }
}

/**
 * Returns the authenticated user's id, or throws UnauthorizedError.
 * Never falls back to a client-supplied body/query userId or a hardcoded
 * default - identity must always come from verified authentication.
 */
export function requireUserId(authUser: AuthUser | undefined): string {
  if (!authUser?.id) {
    throw new UnauthorizedError('Authentication required');
  }
  return authUser.id;
}
export function isResourceOwner(resourceUserId: string, authUser: AuthUser | undefined): boolean {
  if (!authUser) return false;
  if (authUser.role === UserRole.ADMIN || authUser.role === 'ADMIN') return true;
  return authUser.id === resourceUserId;
}
