import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { UserRole } from '@prisma/client';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../logger';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export class TokenService {
  private readonly secret: string;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessExpiration: string;

  constructor() {
    this.secret = env.JWT_SECRET || 'nexusflow-local-access-secret-change-before-production';
    this.issuer = env.JWT_ISSUER || 'nexusflow-api';
    this.audience = env.JWT_AUDIENCE || 'nexusflow-app';
    const rawExp = env.JWT_ACCESS_EXPIRATION;
    this.accessExpiration = rawExp && rawExp.trim() ? rawExp.trim() : '15m';
  }

  generateAccessToken(userId: string, role: UserRole): { accessToken: string; expiresIn: number } {
    const payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      sub: userId,
      role,
    };

    const options: SignOptions = {
      expiresIn: 900,
      issuer: this.issuer,
      audience: this.audience,
    };

    const accessToken = jwt.sign(payload, this.secret, options);
    const expiresIn = 15 * 60; // 15 minutes in seconds

    return { accessToken, expiresIn };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const options: VerifyOptions = {
        issuer: this.issuer,
        audience: this.audience,
      };

      const decoded = jwt.verify(token, this.secret, options) as JwtPayload;
      if (!decoded.sub || !decoded.role) {
        throw new UnauthorizedError('Invalid token payload claims');
      }
      return decoded;
    } catch (err: any) {
      if (err instanceof UnauthorizedError) throw err;
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired');
      }
      throw new UnauthorizedError('Invalid access token');
    }
  }

  generateOauthState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateFamilyId(): string {
    return crypto.randomUUID();
  }
}

export default TokenService;
