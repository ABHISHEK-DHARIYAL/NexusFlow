import { describe, it, expect } from 'vitest';
import { isPrivateIp, validateAndResolveUrl, createPinnedLookup, SsrfError } from '../ssrfValidator';

describe('isPrivateIp', () => {
  it('flags standard private/loopback/link-local ranges', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('10.0.0.5')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.31.255.255')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);
    expect(isPrivateIp('169.254.169.254')).toBe(true); // cloud metadata endpoint
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('fe80::1')).toBe(true);
  });

  it('does not flag ordinary public IPs', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('172.15.0.1')).toBe(false); // just outside 172.16.0.0/12
    expect(isPrivateIp('172.32.0.1')).toBe(false); // just outside 172.16.0.0/12
  });
});

describe('validateAndResolveUrl', () => {
  it('rejects localhost and loopback hostnames', async () => {
    await expect(validateAndResolveUrl('http://localhost/')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('http://127.0.0.1/')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('http://foo.localhost/')).rejects.toThrow(SsrfError);
  });

  it('rejects non-http(s) schemes', async () => {
    await expect(validateAndResolveUrl('file:///etc/passwd')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('gopher://127.0.0.1/')).rejects.toThrow(SsrfError);
  });

  it('rejects literal private IP addresses directly in the URL', async () => {
    await expect(validateAndResolveUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('http://10.0.0.1/')).rejects.toThrow(SsrfError);
    await expect(validateAndResolveUrl('http://192.168.1.1/')).rejects.toThrow(SsrfError);
  });
});

describe('createPinnedLookup - DNS-rebinding / TOCTOU fix', () => {
  // Regression test for a confirmed bug: validateAndResolveUrl() resolved
  // and validated DNS up front, but the actual HTTP request used the raw
  // hostname, letting the HTTP client re-resolve DNS independently at
  // connect time. An attacker with a short-TTL DNS record could pass
  // validation pointing at a public IP, then have the record flip to a
  // private/metadata address before the actual connection happened.

  it('resolves the validated hostname to exactly the pre-validated IP, not a fresh lookup', () => {
    const lookup = createPinnedLookup('example.com', '93.184.216.34');
    let resultAddress: string | undefined;
    let resultFamily: number | undefined;

    lookup('example.com', {}, (err, address, family) => {
      expect(err).toBeNull();
      resultAddress = address;
      resultFamily = family;
    });

    expect(resultAddress).toBe('93.184.216.34');
    expect(resultFamily).toBe(4);
  });

  it('refuses to resolve any hostname other than the one it was pinned for', () => {
    const lookup = createPinnedLookup('example.com', '93.184.216.34');
    let receivedErr: Error | null = null;

    // Simulates a scenario where something tries to resolve a different
    // hostname through an agent pinned for a specific validated host.
    lookup('attacker-controlled.example', {}, (err) => {
      receivedErr = err;
    });

    expect(receivedErr).not.toBeNull();
  });

  it('correctly identifies IPv6 addresses for the pinned lookup family', () => {
    const lookup = createPinnedLookup('example.com', '2606:2800:220:1:248:1893:25c8:1946');
    let resultFamily: number | undefined;

    lookup('example.com', {}, (_err, _address, family) => {
      resultFamily = family;
    });

    expect(resultFamily).toBe(6);
  });
});
