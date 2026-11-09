import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../logger';

/**
 * AES-256-GCM encryption for secrets stored in the database (GitHub OAuth
 * tokens). Stored format: "enc:v1:<iv>.<authTag>.<ciphertext>" (base64url).
 *
 * Key: TOKEN_ENCRYPTION_KEY if set (any string - it is hashed to 32 bytes),
 * otherwise derived from JWT_REFRESH_SECRET. Changing the key makes existing
 * stored tokens unreadable; users then simply reconnect GitHub.
 */
const PREFIX = 'enc:v1:';

const getKey = (): Buffer => {
  const secret = env.TOKEN_ENCRYPTION_KEY || `nexusflow-token-key:${env.JWT_REFRESH_SECRET}`;
  return crypto.createHash('sha256').update(secret).digest();
};

export const isEncrypted = (value: string | null | undefined): boolean =>
  !!value && value.startsWith(PREFIX);

export const encryptSecret = (plain: string): string => {
  if (!plain || isEncrypted(plain)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
};

/** Returns the plaintext. Legacy un-encrypted values pass through unchanged.
 * Returns '' if the value cannot be decrypted (e.g. the key changed). */
export const decryptSecret = (stored: string): string => {
  if (!stored || !isEncrypted(stored)) return stored;
  try {
    const [iv, tag, data] = stored.slice(PREFIX.length).split('.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    logger.auth.error('[tokenCrypto] Failed to decrypt a stored token (encryption key changed?)');
    return '';
  }
};
