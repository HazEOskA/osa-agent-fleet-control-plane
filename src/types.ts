export type ModelId = 'gemini-3.7-flash' | 'gemini-3.1-flash-lite';
export type ThinkingLevelOption = 'DEFAULT' | 'HIGH' | 'LOW' | 'MINIMAL';

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: unknown[];
}

export interface AttachedImage {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 string
  previewUrl: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  images?: AttachedImage[];
  timestamp: number;
  isStreaming?: boolean;
  error?: string;
  groundingMetadata?: GroundingMetadata;
  thinkingText?: string;
  modelUsed?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: ModelId;
  temperature: number;
  thinkingLevel: ThinkingLevelOption;
  useSearch: boolean;
  systemInstruction: string;
  isPinned?: boolean;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Coding' | 'Analysis' | 'Writing' | 'Reasoning' | 'Data';
  description: string;
  prompt: string;
  systemInstruction?: string;
  iconName: string;
}

export interface ScratchpadNote {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}
