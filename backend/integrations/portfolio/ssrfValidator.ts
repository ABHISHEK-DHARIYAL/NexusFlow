import dns from 'dns';
import { URL } from 'url';

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

export const isPrivateIp = (ip: string): boolean => {
  // IPv4 checks
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '0.0.0.0') return true;

  // 10.0.0.0/8
  if (ip.startsWith('10.')) return true;

  // 172.16.0.0/12
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
  }

  // 192.168.0.0/16
  if (ip.startsWith('192.168.')) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP cloud metadata 169.254.169.254)
  if (ip.startsWith('169.254.')) return true;

  // IPv6 checks
  const lowerIp = ip.toLowerCase();
  if (
    lowerIp === '::1' ||
    lowerIp === '0:0:0:0:0:0:0:1' ||
    lowerIp.startsWith('fe80:') ||
    lowerIp.startsWith('fc00:') ||
    lowerIp.startsWith('fd00:')
  ) {
    return true;
  }

  return false;
};

export const validateAndResolveUrl = async (inputUrl: string): Promise<{
  normalizedUrl: string;
  hostname: string;
  domain: string;
  ip: string;
}> => {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new SsrfError('URL is required and must be a string.');
  }

  let parsed: URL;
  try {
    // Add protocol if missing
    let raw = inputUrl.trim();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = `https://${raw}`;
    }
    parsed = new URL(raw);
  } catch (err) {
    throw new SsrfError('Invalid URL format.');
  }

  // Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfError(`Unsupported scheme '${parsed.protocol}'. Only http:// and https:// are allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Quick hostname checks
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'
  ) {
    throw new SsrfError('Access to localhost or loopback address is forbidden.');
  }

  if (isPrivateIp(hostname)) {
    throw new SsrfError('Access to private/internal IP address is forbidden.');
  }

  // Resolve hostname DNS
  let ip = hostname;
  // If hostname is not already an IP address
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) && !hostname.includes(':')) {
    try {
      const addresses = await dns.promises.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        throw new SsrfError(`Failed to resolve DNS for hostname '${hostname}'.`);
      }
      for (const addr of addresses) {
        if (isPrivateIp(addr.address)) {
          throw new SsrfError(`Hostname '${hostname}' resolved to forbidden private IP address '${addr.address}'.`);
        }
      }
      ip = addresses[0].address;
    } catch (err: any) {
      if (err instanceof SsrfError) throw err;
      throw new SsrfError(`DNS resolution failed for '${hostname}': ${err.message}`);
    }
  }

  // Strip hash fragment
  parsed.hash = '';

  const normalizedUrl = parsed.toString();
  const domain = parsed.host;

  return {
    normalizedUrl,
    hostname,
    domain,
    ip
  };
};

/**
 * Fix for a confirmed SSRF gap: validateAndResolveUrl() resolves and
 * validates DNS up front, but the actual HTTP request (in
 * PortfolioCrawler.ts) was using the raw hostname, letting the HTTP client
 * perform its own separate DNS lookup at connect time. An attacker
 * controlling DNS for their domain (short TTL) could pass validation
 * pointing to a public IP, then have the record change to point at a
 * private/metadata address by the time the actual connection happened
 * (classic TOCTOU / DNS-rebinding SSRF bypass).
 *
 * This returns a Node-compatible `lookup` function pinned to the exact IP
 * that was already validated as safe, so the HTTP client cannot resolve
 * the hostname to anything else - closing the gap without changing any
 * other request behavior (TLS SNI/Host header still use the real hostname
 * as normal, since only address resolution is overridden).
 */
export const createPinnedLookup = (hostname: string, ip: string) => {
  const family = ip.includes(':') ? 6 : 4;
  return (
    lookupHostname: string,
    options: any,
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
  ) => {
    if (lookupHostname.toLowerCase() !== hostname.toLowerCase()) {
      callback(new Error(`Refusing to resolve unexpected hostname '${lookupHostname}' (pinned to '${hostname}').`) as NodeJS.ErrnoException, '', 4);
      return;
    }
    callback(null, ip, family);
  };
};
