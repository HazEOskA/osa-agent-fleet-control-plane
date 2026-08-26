import { GoogleGenAI, ThinkingLevel, type GenerateContentConfig } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_GEMINI_REQUEST_TIMEOUT_MS = 90_000;
const PRIMARY_MODEL = 'gemini-3.7-flash';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const RETRYABLE_STATUS_CODES = new Set([429, 503]);
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

export function getGeminiRequestTimeoutMs(): number {
  const configured = Number.parseInt(process.env.GEMINI_REQUEST_TIMEOUT_MS || '', 10);
  if (Number.isFinite(configured) && configured >= 5_000) {
    return configured;
  }
  return DEFAULT_GEMINI_REQUEST_TIMEOUT_MS;
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: getGeminiRequestTimeoutMs(),
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ChatMessagePayload {
  role: 'user' | 'model';
  text: string;
  images?: Array<{
    data: string;
    mimeType: string;
  }>;
}

export interface ChatRequestOptions {
  messages: ChatMessagePayload[];
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  thinkingLevel?: 'LOW' | 'HIGH' | 'MINIMAL';
  useSearch?: boolean;
}

type StreamChunk = { text?: string; grounding?: unknown };

function getNumericStatus(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^\d{3}$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return undefined;
}

function extractStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as Record<string, unknown>;
  const direct =
    getNumericStatus(candidate.code) ??
    getNumericStatus(candidate.statusCode) ??
    getNumericStatus(candidate.status);

  if (direct) {
    return direct;
  }

  const response = candidate.response;
  if (response && typeof response === 'object') {
    const responseStatus = getNumericStatus((response as Record<string, unknown>).status);
    if (responseStatus) {
      return responseStatus;
    }
  }

  return undefined;
}

function extractStatusCodeFromMessage(error: unknown): number | undefined {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const codeMatch = message.match(/\"code\"\s*:\s*(429|503)/);
  if (codeMatch) {
    return Number.parseInt(codeMatch[1], 10);
  }

  if (/\b429\b/.test(message)) return 429;
  if (/\b503\b/.test(message)) return 503;
  return undefined;
}

function getRetryableStatusCode(error: unknown): number | undefined {
  const status = extractStatusCode(error) ?? extractStatusCodeFromMessage(error);
  return status && RETRYABLE_STATUS_CODES.has(status) ? status : undefined;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;

  const reason = signal.reason;
  if (reason instanceof Error) {
    throw reason;
  }
  throw new Error('Gemini request was aborted.');
}

async function sleepWithAbort(delayMs: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);

    const onAbort = () => {
      cleanup();
      const reason = signal?.reason;
      reject(reason instanceof Error ? reason : new Error('Gemini request was aborted.'));
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function buildContents(messages: ChatMessagePayload[]) {
  return messages.map((msg) => {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (msg.images && msg.images.length > 0) {
      for (const img of msg.images) {
        const cleanBase64 = img.data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
    }

    if (msg.text) {
      parts.push({ text: msg.text });
    }

    return {
      role: msg.role === 'model' ? 'model' : 'user',
      parts,
    };
  });
}

function buildConfig(options: ChatRequestOptions, signal?: AbortSignal): GenerateContentConfig {
  const config: GenerateContentConfig = {
    httpOptions: {
      timeout: getGeminiRequestTimeoutMs(),
    },
  };

  if (signal) {
    config.abortSignal = signal;
  }

  if (options.systemInstruction && options.systemInstruction.trim()) {
    config.systemInstruction = options.systemInstruction.trim();
  }

  if (typeof options.temperature === 'number') {
    config.temperature = options.temperature;
  }

  if (options.thinkingLevel) {
    if (options.thinkingLevel === 'LOW') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    } else if (options.thinkingLevel === 'HIGH') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    } else if (options.thinkingLevel === 'MINIMAL') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    }
  }

  if (options.useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  return config;
}

export async function handleGeminiStream(
  options: ChatRequestOptions,
  onChunk: (chunk: StreamChunk) => void,
  signal?: AbortSignal
) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }

  const selectedModel = options.model || PRIMARY_MODEL;
  const modelCandidates =
    selectedModel === PRIMARY_MODEL ? [PRIMARY_MODEL, FALLBACK_MODEL] : [selectedModel];
  const contents = buildContents(options.messages);
  const config = buildConfig(options, signal);

  let lastError: unknown;

  for (let modelIndex = 0; modelIndex < modelCandidates.length; modelIndex += 1) {
    const modelName = modelCandidates[modelIndex];

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      throwIfAborted(signal);
      let emittedAnyChunk = false;

      try {
        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config,
        });

        for await (const chunk of responseStream) {
          throwIfAborted(signal);
          const text = chunk.text;
          const grounding = chunk.candidates?.[0]?.groundingMetadata;

          if (text || grounding) {
            emittedAnyChunk = true;
          }
          onChunk({ text, grounding });
        }

        return;
      } catch (error: unknown) {
        lastError = error;
        throwIfAborted(signal);

        const retryableStatus = getRetryableStatusCode(error);
        if (!retryableStatus || emittedAnyChunk) {
          throw error;
        }

        const hasRetryRemaining = attempt < RETRY_DELAYS_MS.length;
        if (hasRetryRemaining) {
          const delayMs = RETRY_DELAYS_MS[attempt];
          console.warn(
            `Gemini ${modelName} returned ${retryableStatus}; retrying in ${delayMs} ms (attempt ${attempt + 2}/${RETRY_DELAYS_MS.length + 1}).`
          );
          await sleepWithAbort(delayMs, signal);
          continue;
        }

        const hasFallback = modelIndex < modelCandidates.length - 1;
        if (hasFallback) {
          const fallbackModel = modelCandidates[modelIndex + 1];
          console.warn(
            `Gemini ${modelName} remained unavailable after bounded retries; falling back to ${fallbackModel}.`
          );
          break;
        }

        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Gemini generation failed after retries and fallback.');
}
