import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_GEMINI_REQUEST_TIMEOUT_MS = 90_000;

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

export async function handleGeminiStream(
  options: ChatRequestOptions,
  onChunk: (chunk: { text?: string; grounding?: unknown }) => void,
  signal?: AbortSignal
) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }

  const modelName = options.model || 'gemini-3.7-flash';

  const contents = options.messages.map((msg) => {
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

  const config: Record<string, unknown> = {
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

  if (signal?.aborted) {
    throw new Error('Gemini request was aborted before it started.');
  }

  const responseStream = await ai.models.generateContentStream({
    model: modelName,
    contents,
    config,
  });

  for await (const chunk of responseStream) {
    if (signal?.aborted) {
      throw new Error('Gemini request was aborted.');
    }

    const text = chunk.text;
    const grounding = chunk.candidates?.[0]?.groundingMetadata;
    onChunk({ text, grounding });
  }
}
