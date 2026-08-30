import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import { aiConfig } from '../config/aiConfig';
import { logger } from '../logger';

export interface GeminiRunnerOptions {
  params: GenerateContentParameters;
  apiKey?: string;
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
}

/**
 * Fallback candidate model names in order of preference for text tasks.
 */
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

/**
 * Creates a standard GoogleGenAI client with required User-Agent header.
 */
export function createGeminiClient(apiKey?: string): GoogleGenAI | null {
  const key = apiKey || aiConfig.getApiKey();
  if (!key || key === 'MY_GEMINI_API_KEY' || key === 'your_gemini_api_key' || key === 'placeholder') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Executes a Gemini API call with exponential backoff, jitter, and automatic model fallback on transient errors (503, 429, 500).
 */
export async function runGeminiWithRetryAndFallback(
  options: GeminiRunnerOptions
): Promise<GenerateContentResponse> {
  const client = createGeminiClient(options.apiKey);
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured or is a placeholder.');
  }

  const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
  const maxRetries = options.maxRetries ?? (isTestEnv ? 1 : aiConfig.maxRetries ?? 3);
  let delayMs = options.initialDelayMs ?? (isTestEnv ? 10 : 1000);
  let lastError: any = null;

  const requestedModel = options.params.model || aiConfig.getModel();
  // Build model priority list starting with requested model
  const modelsToTry = Array.from(new Set([requestedModel, ...FALLBACK_MODELS]));
  const callTimeoutMs = isTestEnv ? 800 : (options.timeoutMs || aiConfig.getTimeoutMs() || 15000);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const modelForAttempt = modelsToTry[(attempt - 1) % modelsToTry.length];
    const paramsWithModel: GenerateContentParameters = {
      ...options.params,
      model: modelForAttempt,
    };

    let timer: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Gemini request timeout (${callTimeoutMs}ms)`));
      }, callTimeoutMs);
    });

    try {
      logger.ai.info(`Calling Gemini API (Attempt ${attempt}/${maxRetries}, Model: ${modelForAttempt})...`);
      const response = await Promise.race([
        client.models.generateContent(paramsWithModel),
        timeoutPromise,
      ]);
      return response;
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || err?.error?.code;
      const message = err?.message || err?.error?.message || String(err);

      const isTransient =
        status === 503 ||
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 504 ||
        message.includes('503') ||
        message.includes('high demand') ||
        message.includes('UNAVAILABLE') ||
        message.includes('RATE_LIMIT') ||
        message.includes('timeout') ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNRESET';

      logger.ai.warn(`Gemini API call attempt ${attempt}/${maxRetries} (${modelForAttempt}) failed: ${message}`);

      if (!isTransient || attempt >= maxRetries) {
        break;
      }

      // Exponential backoff with jitter (e.g. 1000ms + 0-500ms random)
      const jitter = Math.floor(Math.random() * 500);
      const sleepTime = delayMs + jitter;
      logger.ai.info(`Waiting ${sleepTime}ms before retrying Gemini API...`);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
      delayMs *= 2;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  throw lastError || new Error('All Gemini API attempts failed.');
}
