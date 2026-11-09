import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/env', () => ({
  env: { TOKEN_ENCRYPTION_KEY: 'test-key', JWT_REFRESH_SECRET: 'x' },
}));
vi.mock('../../logger', () => ({
  logger: { auth: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } },
}));

import { encryptSecret, decryptSecret, isEncrypted } from '../tokenCrypto';

describe('tokenCrypto', () => {
  it('round-trips and does not store plaintext', () => {
    const enc = encryptSecret('gho_secret_token');
    expect(isEncrypted(enc)).toBe(true);
    expect(enc).not.toContain('gho_secret_token');
    expect(decryptSecret(enc)).toBe('gho_secret_token');
  });

  it('uses a fresh IV each time', () => {
    expect(encryptSecret('abc')).not.toBe(encryptSecret('abc'));
  });

  it('passes legacy plaintext through and never double-encrypts', () => {
    expect(decryptSecret('gho_legacy')).toBe('gho_legacy');
    const enc = encryptSecret('abc');
    expect(encryptSecret(enc)).toBe(enc);
  });

  it('returns empty string for tampered data', () => {
    const enc = encryptSecret('abc');
    expect(decryptSecret(enc.slice(0, -2) + 'AA')).toBe('');
  });
});
