import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('mysql://root:password@localhost:3306/nexusflow'),
  
  JWT_SECRET: z.string().default('nexusflow-local-access-secret-change-before-production'),
  JWT_REFRESH_SECRET: z.string().default('nexusflow-local-refresh-secret-change-before-production'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  JWT_ISSUER: z.string().default('nexusflow-api'),
  JWT_AUDIENCE: z.string().default('nexusflow-app'),

  GITHUB_CLIENT_ID: z.string().default('placeholder'),
  GITHUB_CLIENT_SECRET: z.string().default('placeholder'),
  GITHUB_CALLBACK_URL: z.string().default('http://localhost:3000/api/auth/github/callback'),

  FRONTEND_URL: z.string().default('http://localhost:3000'),
  BACKEND_URL: z.string().default('http://localhost:3000'),
  // Must match the port the Java worker actually listens on (WORKER_PORT
  // in the worker service, default 8081) - this used to be called
  // JAVA_SERVICE_URL here but JAVA_WORKER_URL everywhere the value was
  // actually read, so setting the old name silently did nothing.
  JAVA_WORKER_URL: z.string().default('http://localhost:8081'),
  JAVA_WORKER_SECRET: z.string().default('default_nexusflow_worker_secret_2026'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z
    .string()
    .transform((val) =>
      val && (val.includes('2.5') || val.includes('2.0') || val.includes('1.5') || val.includes('gemini-1') || val.includes('gemini-2'))
        ? 'gemini-3.6-flash'
        : val
    )
    .default('gemini-3.6-flash'),
  GEMINI_REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().default(8192),
});

export type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingFields = error.issues.map((e) => e.path.join('.')).join(', ');
    console.error(`❌ Invalid Environment Variables Configuration: ${missingFields}`);
    env = envSchema.parse({});
  } else {
    throw error;
  }
}

// Fail fast: never allow production to run with the hardcoded default JWT
// secrets. Anyone who has read this source file (public on GitHub) knows
// these default values, so running with them in production means any
// attacker can forge valid access tokens for any user/role.
const DEFAULT_JWT_SECRET = 'nexusflow-local-access-secret-change-before-production';
const DEFAULT_JWT_REFRESH_SECRET = 'nexusflow-local-refresh-secret-change-before-production';

if (
  env.NODE_ENV === 'production' &&
  (env.JWT_SECRET === DEFAULT_JWT_SECRET || env.JWT_REFRESH_SECRET === DEFAULT_JWT_REFRESH_SECRET)
) {
  throw new Error(
    'FATAL: JWT_SECRET / JWT_REFRESH_SECRET must be set to unique, non-default values in production. ' +
      'Refusing to start with the hardcoded default secret from source control.'
  );
}

// GitHub OAuth is now optional (email + password is the primary login), so
// placeholder credentials no longer stop the server from booting. They are
// only needed if you use the "Connect GitHub" feature from Settings.
if (
  env.NODE_ENV === 'production' &&
  (env.GITHUB_CLIENT_ID === 'placeholder' || env.GITHUB_CLIENT_SECRET === 'placeholder')
) {
  console.warn('[env] GitHub OAuth credentials are not set - "Connect GitHub" will not work until they are.');
}

export { env };
export default env;
