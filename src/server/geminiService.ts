import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
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
    data: string; // base64 without header or with header
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

  // Format messages into Gemini contents format
  const contents = options.messages.map((msg) => {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (msg.images && msg.images.length > 0) {
      for (const img of msg.images) {
        // Strip data:image/...;base64, if present
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

  const config: Record<string, unknown> = {};

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

  const responseStream = await ai.models.generateContentStream({
    model: modelName,
    contents,
    config,
  });

  for await (const chunk of responseStream) {
    if (signal?.aborted) {
      break;
    }
    const text = chunk.text;
    const grounding = chunk.candidates?.[0]?.groundingMetadata;
    onChunk({ text, grounding });
  }
}
