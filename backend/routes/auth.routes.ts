import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { authRateLimiter, credentialsRateLimiter } from '../middleware/security';
import { validateRequest } from '../middleware/validateRequest';
import {
  githubCallbackSchema,
  refreshTokenSchema,
  logoutSchema,
  signupSchema,
  loginSchema,
} from '../validations/auth.validation';

const router = Router();

// Generous limiter for the whole /api/auth/* surface (covers passive
// calls like /refresh and /me that fire on every page load).
router.use(authRateLimiter);

// Deploy check: open /api/auth/status in a browser. If this returns JSON,
// the server is running the version with email + password auth.
router.get('/status', (_req, res) => {
  res.json({ success: true, emailPasswordAuth: true, routes: ['POST /signup', 'POST /login'] });
});

// Email + password signup ("first login") - tighter, credential-guessing-
// sensitive limiter stacked on top of the general one above.
router.post('/signup', credentialsRateLimiter, validateRequest(signupSchema), AuthController.signup);

// Email + password login - same tighter limiter.
router.post('/login', credentialsRateLimiter, validateRequest(loginSchema), AuthController.login);

// GitHub OAuth initiation (login/signup with GitHub directly)
router.get('/github', AuthController.initiateGithub);

// GitHub OAuth initiation to CONNECT to an already-logged-in account
// (e.g. from Settings, after signing up with email + password first)
router.get('/github/connect', AuthController.initiateGithubConnect);

// GitHub OAuth callback (shared by both flows above)
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
