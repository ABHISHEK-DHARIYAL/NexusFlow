import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { TokenService } from '../../backend/services/TokenService';
import { OAuthStateStore } from '../../backend/services/GithubOAuthService';
import { RefreshTokenService } from '../../backend/services/RefreshTokenService';
import { assertResourceOwnership, isResourceOwner } from '../../backend/utils/ownership';
import { requireAuth, requireRole } from '../../backend/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { UnauthorizedError, ForbiddenError, SecurityError } from '../../backend/utils/errors';

// Mock dependencies for unit testing
const mockRefreshTokenRepo = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  revokeToken: vi.fn(),
  revokeFamily: vi.fn(),
  revokeAllForUser: vi.fn(),
  deleteExpired: vi.fn(),
};

vi.mock('../../backend/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb({
      refreshToken: {
        update: vi.fn(),
        create: vi.fn(),
      },
      user: {
        update: vi.fn(),
        create: vi.fn(),
      },
      gitHubAccount: {
        upsert: vi.fn(),
        create: vi.fn(),
      },
    })),
  },
}));

describe('PART 3 — AUTHENTICATION & AUTHORIZATION TESTS', () => {

  describe('1. TokenService (JWT & Refresh Token Hashing)', () => {
    let tokenService: TokenService;

    beforeEach(() => {
      tokenService = new TokenService();
    });

    it('should generate a valid JWT access token with correct claims (sub, role, iss, aud)', () => {
      const userId = 'user-123';
      const role = UserRole.USER;
      const { accessToken, expiresIn } = tokenService.generateAccessToken(userId, role);

      expect(accessToken).toBeDefined();
      expect(expiresIn).toBe(900); // 15 mins

      const decoded = tokenService.verifyAccessToken(accessToken);
      expect(decoded.sub).toBe(userId);
      expect(decoded.role).toBe(role);
      expect(decoded.iss).toBe('nexusflow-api');
      expect(decoded.aud).toBe('nexusflow-app');
    });

    it('should reject invalid or tampered JWT', () => {
      expect(() => tokenService.verifyAccessToken('invalid.jwt.token')).toThrow(UnauthorizedError);
    });

    it('should reject expired JWT', () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123', role: 'USER' },
        process.env.JWT_SECRET || 'nexusflow-local-access-secret-change-before-production',
        { expiresIn: '-1s', issuer: 'nexusflow-api', audience: 'nexusflow-app' }
      );

      expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow('Access token has expired');
    });

    it('should reject JWT with wrong issuer', () => {
      const wrongIssuerToken = jwt.sign(
        { sub: 'user-123', role: 'USER' },
        process.env.JWT_SECRET || 'nexusflow-local-access-secret-change-before-production',
        { expiresIn: '15m', issuer: 'wrong-issuer', audience: 'nexusflow-app' }
      );

      expect(() => tokenService.verifyAccessToken(wrongIssuerToken)).toThrow('Invalid access token');
    });

    it('should reject JWT with wrong audience', () => {
      const wrongAudienceToken = jwt.sign(
        { sub: 'user-123', role: 'USER' },
        process.env.JWT_SECRET || 'nexusflow-local-access-secret-change-before-production',
        { expiresIn: '15m', issuer: 'nexusflow-api', audience: 'wrong-audience' }
      );

      expect(() => tokenService.verifyAccessToken(wrongAudienceToken)).toThrow('Invalid access token');
    });

    it('should generate sha256 hash for refresh token', () => {
      const rawToken = 'my-super-secret-refresh-token';
      const hash1 = tokenService.hashRefreshToken(rawToken);
      const hash2 = tokenService.hashRefreshToken(rawToken);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // hex sha256
    });
  });

  describe('2. OAuthStateStore (OAuth State & CSRF Protection)', () => {
    let stateStore: OAuthStateStore;

    beforeEach(() => {
      stateStore = new OAuthStateStore();
    });

    it('should generate and validate cryptographically random state', () => {
      const state = stateStore.createState();
      expect(state).toBeDefined();

      const isValid = stateStore.validateAndInvalidate(state);
      expect(isValid).toBe(true);
    });

    it('should reject non-existent state', () => {
      expect(stateStore.validateAndInvalidate('random-fake-state')).toBe(false);
    });

    it('should prevent state reuse (single-use token)', () => {
      const state = stateStore.createState();
      expect(stateStore.validateAndInvalidate(state)).toBe(true);
      // Second attempt must fail
      expect(stateStore.validateAndInvalidate(state)).toBe(false);
    });
  });

  describe('3. RefreshTokenService (Token Rotation & Reuse Detection)', () => {
    let tokenService: TokenService;
    let refreshTokenService: RefreshTokenService;

    beforeEach(() => {
      vi.clearAllMocks();
      tokenService = new TokenService();
      refreshTokenService = new RefreshTokenService(mockRefreshTokenRepo as any, tokenService);
    });

    it('should create refresh token and store hash in DB', async () => {
      mockRefreshTokenRepo.create.mockResolvedValue({});

      const { refreshToken, tokenHash, expiresAt } = await refreshTokenService.createRefreshToken('user-1');

      expect(refreshToken).toBeDefined();
      expect(tokenHash).toBeDefined();
      expect(expiresAt).toBeInstanceOf(Date);
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledOnce();
    });

    it('should detect token reuse and revoke token family', async () => {
      const rawToken = 'reused-token';
      const tokenHash = tokenService.hashRefreshToken(rawToken);

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue({
        id: 'tok-1',
        userId: 'user-1',
        tokenHash,
        familyId: 'family-999',
        isRevoked: true, // Already revoked -> REUSE!
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(refreshTokenService.rotateRefreshToken(rawToken)).rejects.toThrow(
        SecurityError
      );

      expect(mockRefreshTokenRepo.revokeFamily).toHaveBeenCalledWith('family-999');
    });

    it('should reject expired refresh token', async () => {
      const rawToken = 'expired-token';
      const tokenHash = tokenService.hashRefreshToken(rawToken);

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue({
        id: 'tok-2',
        userId: 'user-1',
        tokenHash,
        familyId: 'family-100',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 10000), // Expired
      });

      await expect(refreshTokenService.rotateRefreshToken(rawToken)).rejects.toThrow(
        UnauthorizedError
      );

      expect(mockRefreshTokenRepo.revokeToken).toHaveBeenCalledWith('tok-2');
    });
  });

  describe('4. Resource Ownership Verification', () => {
    it('should allow owner to access their resource', () => {
      const authUser = { id: 'user-100', role: UserRole.USER };
      expect(() => assertResourceOwnership('user-100', authUser, 'repository')).not.toThrow();
      expect(isResourceOwner('user-100', authUser)).toBe(true);
    });

    it('should allow admin to access any resource', () => {
      const adminUser = { id: 'admin-1', role: UserRole.ADMIN };
      expect(() => assertResourceOwnership('user-100', adminUser, 'repository')).not.toThrow();
      expect(isResourceOwner('user-100', adminUser)).toBe(true);
    });

    it('should forbid user from accessing another user resource (IDOR)', () => {
      const authUser = { id: 'user-200', role: UserRole.USER };
      expect(() => assertResourceOwnership('user-100', authUser, 'repository')).toThrow(ForbiddenError);
      expect(isResourceOwner('user-100', authUser)).toBe(false);
    });
  });

  describe('5. Authorization Middleware', () => {
    it('should allow user with required role', () => {
      const req: any = { user: { id: 'u1', role: UserRole.ADMIN } };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireRole(UserRole.ADMIN);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(); // called without error
    });

    it('should block user without required role', () => {
      const req: any = { user: { id: 'u1', role: UserRole.USER } };
      const res: any = {};
      const next = vi.fn();

      const middleware = requireRole(UserRole.ADMIN);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

});
