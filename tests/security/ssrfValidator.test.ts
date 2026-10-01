import { describe, it, expect, beforeEach } from 'vitest';
import { validateAndResolveUrl, SsrfError } from '../../backend/integrations/portfolio/ssrfValidator';

describe('Part 24 - Portfolio SSRF Protection & URL Validation Tests', () => {
  it('should allow valid public HTTP/HTTPS URLs', async () => {
    const res = await validateAndResolveUrl('https://example.com/portfolio');
    expect(res.normalizedUrl).toBe('https://example.com/portfolio');
    expect(res.hostname).toBe('example.com');
  });

  it('should block 127.0.0.1 and localhost loopbacks', async () => {
    await expect(validateAndResolveUrl('http://127.0.0.1')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('http://localhost')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('http://0.0.0.0')).rejects.toThrow(SsrfError);
  });

  it('should block private IPv4 address ranges', async () => {
    await expect(validateAndResolveUrl('http://10.0.0.1')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('http://172.16.0.5')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('http://192.168.1.1')).rejects.toThrow(SsrfError);
  });

  it('should block cloud metadata endpoint 169.254.169.254', async () => {
    await expect(validateAndResolveUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(SsrfError);
  });

  it('should block non-http/https protocols', async () => {
    await expect(validateAndResolveUrl('file:///etc/passwd')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('ftp://example.com')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('gopher://127.0.0.1')).rejects.toThrow(SsrfError);
  });
});
