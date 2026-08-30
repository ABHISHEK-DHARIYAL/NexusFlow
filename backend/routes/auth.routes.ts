import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/security';
import { validateRequest } from '../middleware/validateRequest';
import {
  githubCallbackSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../validations/auth.validation';

const router = Router();

// Apply auth rate limiter to all authentication routes
router.use(authRateLimiter);

// GitHub OAuth initiation
router.get('/github', AuthController.initiateGithub);

// GitHub OAuth callback
router.get(
  '/github/callback',
  validateRequest(githubCallbackSchema),
  AuthController.githubCallback
);

// Token Refresh
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  AuthController.refresh
);

// Logout
router.post(
  '/logout',
  validateRequest(logoutSchema),
  AuthController.logout
);

// Get current user profile
router.get('/me', optionalAuth, AuthController.getMe);

// Get current session state
router.get('/session', optionalAuth, AuthController.getSession);

export default router;
