/**
 * Secret Filter and Sanitization Utility
 * Prevents sensitive files, tokens, and private keys from being passed to LLM services.
 */

const SECRET_FILE_PATTERNS: RegExp[] = [
  /^\.env(?:\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.asc$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /credentials\.json$/i,
  /service-account.*\.json$/i,
  /\.secret$/i,
  /shadow$/i,
  /passwd$/i,
  /htpasswd$/i,
];

const EXCLUDED_DIRS: string[] = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'target',
  'coverage',
  '.idea',
  '.vscode',
  '.next',
  '.out',
];

const EXCLUDED_EXTENSIONS: string[] = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.zip', '.tar', '.gz',
  '.exe', '.dll', '.so', '.dylib', '.jar', '.class', '.pyc', '.woff', '.woff2', '.ttf'
];

const SECRET_CONTENT_PATTERNS: { name: string; pattern: RegExp; replacement: string }[] = [
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PGP|PRIVATE)? KEY[^\n]*-----[\s\S]*?-----END [^\n]*-----/g,
    replacement: '[REDACTED PRIVATE KEY]',
  },
  {
    name: 'AWS Access Key',
    pattern: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
    replacement: '[REDACTED AWS KEY]',
  },
  {
    name: 'GitHub Token',
    pattern: /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b/g,
    replacement: '[REDACTED GITHUB TOKEN]',
  },
  {
    name: 'Generic API Key / Secret',
    pattern: /(api[_-]?key|secret|password|auth[_-]?token|bearer)\s*[:=]\s*["']([^"']{8,})["']/gi,
    replacement: '$1: "[REDACTED SECRET]"',
  },
];

export function isExcludedDirectory(filePath: string): boolean {
  const parts = filePath.split('/');
  return parts.some((part) => EXCLUDED_DIRS.includes(part.toLowerCase()));
}

export function isBinaryOrMediaFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return EXCLUDED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isSecretFilePath(filePath: string): boolean {
  const fileName = filePath.split('/').pop() || filePath;
  return SECRET_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

export function sanitizeContent(content: string): { cleanContent: string; redactedCount: number } {
  let cleanContent = content;
  let redactedCount = 0;

  for (const { pattern, replacement } of SECRET_CONTENT_PATTERNS) {
    const matches = cleanContent.match(pattern);
    if (matches && matches.length > 0) {
      redactedCount += matches.length;
      cleanContent = cleanContent.replace(pattern, replacement);
    }
  }

  return { cleanContent, redactedCount };
}
