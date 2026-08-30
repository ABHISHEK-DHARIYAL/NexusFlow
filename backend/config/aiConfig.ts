import { env } from './env';

function resolveModel(modelInput?: string): string {
  const model = modelInput || 'gemini-3.6-flash';
  if (
    model.includes('2.5') ||
    model.includes('2.0') ||
    model.includes('1.5') ||
    model.includes('gemini-1') ||
    model.includes('gemini-2')
  ) {
    return 'gemini-3.6-flash';
  }
  return model;
}

export const aiConfig = {
  getApiKey: (): string | undefined => process.env.GEMINI_API_KEY || env.GEMINI_API_KEY,
  getModel: (): string => resolveModel(process.env.GEMINI_MODEL || env.GEMINI_MODEL),
  getTimeoutMs: (): number => Number(process.env.GEMINI_REQUEST_TIMEOUT_MS) || env.GEMINI_REQUEST_TIMEOUT_MS || 30000,
  getMaxOutputTokens: (): number => Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || env.GEMINI_MAX_OUTPUT_TOKENS || 8192,

  apiKey: process.env.GEMINI_API_KEY || env.GEMINI_API_KEY,
  get modelName(): string {
    return resolveModel(process.env.GEMINI_MODEL || env.GEMINI_MODEL);
  },
  timeoutMs: Number(process.env.GEMINI_REQUEST_TIMEOUT_MS) || env.GEMINI_REQUEST_TIMEOUT_MS || 30000,
  maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || env.GEMINI_MAX_OUTPUT_TOKENS || 8192,

  maxInputBytes: 60 * 1024,
  maxTotalInputBytes: 60 * 1024,
  maxFilesPerAnalysis: 25,
  maxSingleFileBytes: 30 * 1024,

  maxRetries: 3,
  retryDelayMs: 500,
  initialRetryDelayMs: 500,
  backoffMultiplier: 2,

  // Forbidden filenames & secret file patterns
  secretFilePatterns: [
    /\.env(\..*)?$/i,
    /\.pem$/i,
    /\.key$/i,
    /\.p12$/i,
    /\.pfx$/i,
    /id_rsa/i,
    /id_ed25519/i,
    /credentials\.json$/i,
    /service_account.*\.json$/i,
    /secrets\.y(a)?ml$/i,
    /shadow$/i,
    /htpasswd$/i,
    /token\.json$/i,
  ],

  // Inline content secret scanning regexes
  secretContentRegexes: [
    /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/g,
    /sk-[A-Za-z0-9]{32,}/g,
    /AIzaSy[A-Za-z0-9_-]{33}/g,
    /AKIA[0-9A-Z]{16}/g,
    /-----BEGIN (?:RSA |EC |PGP )?PRIVATE KEY-----/g,
    /bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi,
  ],
};
