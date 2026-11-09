import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/TokenService';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import { logger } from '../logger';

const tokenService = new TokenService();

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      logger.auth.warn(`[Auth Middleware] Missing token on protected endpoint: ${req.originalUrl}`);
      throw new UnauthorizedError('Authentication token is required');
    }

    // Verify token claims, issuer, audience, exp
    const payload = tokenService.verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      logger.auth.warn(`[Auth Middleware] Verification failed: ${err.message}`);
      next(new UnauthorizedError('Invalid or expired authentication token'));
    }
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const payload = tokenService.verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        role: payload.role,
      };
    }
  } catch {
    // Ignore token verification errors for optional auth
  }
  next();
};

export const requireRole = (...allowedRoles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.auth.warn(`[Role Authorization] Unauthenticated access attempt`);
      return next(new UnauthorizedError('Authentication required'));
    }

    const hasRole = allowedRoles.some((role) => req.user?.role === role);
    if (!hasRole) {
      logger.auth.warn(
        `[Role Authorization] Forbidden access by user ${req.user.id} with role ${req.user.role}. Allowed: ${allowedRoles.join(', ')}`
      );
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
};

export const requireAnyRole = (allowedRoles: (UserRole | string)[]) => {
  return requireRole(...allowedRoles);
};
