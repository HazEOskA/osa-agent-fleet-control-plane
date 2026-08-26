import React, { useRef, useEffect, useState } from 'react';
import {
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  Terminal,
  Cpu,
  Lightbulb,
  FileCode,
  Layers,
} from 'lucide-react';
import type { ChatMessage, AttachedImage, PromptTemplate } from '../types';
import { MarkdownView } from './MarkdownView';
import { GroundingSources } from './GroundingSources';
import { ThinkingBlock } from './ThinkingBlock';

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onRegenerateLast: () => void;
  onUsePromptTemplate: (tpl: PromptTemplate) => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  isGenerating,
  onRegenerateLast,
  onUsePromptTemplate,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Auto-scroll on new message or stream chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleCopyMessage = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      // Ignore
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-2">
          Gemini AI Studio
        </h1>
        <p className="text-sm text-neutral-500 max-w-md mb-8 leading-relaxed">
          Powered by Google’s Gemini 3.7 Flash. Explore reasoning, system architecture, clean refactoring, and multimodal vision analysis.
        </p>

        {/* Quick Starter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
          <button
            onClick={() =>
              onUsePromptTemplate({
                id: 'starter-1',
                title: 'Architecture Blueprint',
                category: 'Coding',
                description: 'Full-stack application blueprint',
                prompt: 'Design a modular, scalable architecture for a real-time collaborative application with TypeScript, WebSocket sync, and database schemas.',
                iconName: 'Cpu',
              })
            }
            className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-blue-400 hover:bg-blue-50/20 transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2 mb-1.5 text-blue-600 font-semibold text-xs">
              <Cpu className="w-4 h-4" />
              <span>Full-Stack Architecture</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Generate schemas, API contracts, and modular system boundaries.
            </p>
          </button>

          <button
            onClick={() =>
              onUsePromptTemplate({
                id: 'starter-2',
                title: 'Code Refactor & Security Audit',
                category: 'Coding',
                description: 'TypeScript clean refactoring',
                prompt: 'What are the top 5 subtle anti-patterns in modern React & TypeScript applications, and how can we eliminate them with strict type safety?',
                iconName: 'FileCode',
              })
            }
            className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-blue-400 hover:bg-blue-50/20 transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2 mb-1.5 text-emerald-600 font-semibold text-xs">
              <FileCode className="w-4 h-4" />
              <span>Refactor & Best Practices</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Audit code structures, type safety constraints, and edge-case handling.
            </p>
          </button>

          <button
            onClick={() =>
              onUsePromptTemplate({
                id: 'starter-3',
                title: 'First-Principles Reasoning',
                category: 'Reasoning',
                description: 'Analytical deconstruction',
                prompt: 'Explain the core algorithmic differences between Vector Embeddings, Sparse BM25, and Hybrid Search in RAG architectures.',
                iconName: 'Lightbulb',
              })
            }
            className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-blue-400 hover:bg-blue-50/20 transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2 mb-1.5 text-amber-600 font-semibold text-xs">
              <Lightbulb className="w-4 h-4" />
              <span>Deep Technical Explanation</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Deconstruct complex algorithms and distributed systems concepts.
            </p>
          </button>

          <button
            onClick={() =>
              onUsePromptTemplate({
                id: 'starter-4',
                title: 'Structured JSON Extraction',
                category: 'Data',
                description: 'Strict schema generator',
                prompt: 'Create a strict JSON Schema and sample mock dataset for an enterprise Task & Project Management platform with role-based permissions.',
                iconName: 'Layers',
              })
            }
            className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-blue-400 hover:bg-blue-50/20 transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2 mb-1.5 text-indigo-600 font-semibold text-xs">
              <Layers className="w-4 h-4" />
              <span>JSON Schema & Data Models</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Design type-safe schemas, entities, and data validation rules.
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl mx-auto w-full">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isLast = index === messages.length - 1;

        return (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {/* Model Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            {/* Message Bubble & Content */}
            <div
              className={`max-w-[88%] rounded-2xl p-4 transition-all ${
                isUser
                  ? 'bg-neutral-900 text-white rounded-tr-xs shadow-xs'
                  : 'bg-white border border-neutral-200/80 rounded-tl-xs shadow-xs text-neutral-800'
              }`}
            >
              {/* User Attached Images */}
              {isUser && msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.images.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800 max-w-xs"
                    >
                      <img
                        src={img.previewUrl}
                        alt={img.name}
                        className="max-h-48 object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Model Thinking Block */}
              {!isUser && (
                <ThinkingBlock
                  thinkingText={msg.thinkingText}
                  isStreaming={msg.isStreaming && !msg.text}
                />
              )}

              {/* Message Text */}
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed font-normal">
                  {msg.text}
                </p>
              ) : (
                <>
                  {msg.text ? (
                    <MarkdownView content={msg.text} />
                  ) : msg.isStreaming ? (
                    <div className="flex items-center gap-2 text-neutral-400 text-xs py-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      <span>Generating response...</span>
                    </div>
                  ) : null}

                  {/* Error display */}
                  {msg.error && (
                    <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Generation Error</p>
                        <p className="text-[11px] text-red-600">{msg.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Grounding Metadata */}
                  <GroundingSources metadata={msg.groundingMetadata} />
                </>
              )}

              {/* Footer metadata & Action toolbar */}
              <div
                className={`flex items-center justify-between gap-3 pt-2 mt-2 border-t text-[11px] ${
                  isUser ? 'border-neutral-800 text-neutral-400' : 'border-neutral-100 text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {!isUser && msg.modelUsed && (
                    <span className="text-neutral-500 hidden sm:inline">• {msg.modelUsed}</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyMessage(msg)}
                    className={`p-1 rounded transition-colors ${
                      isUser ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'
                    }`}
                    title="Copy text"
                  >
                    {copiedMsgId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {!isUser && isLast && !isGenerating && (
                    <button
                      onClick={onRegenerateLast}
                      className="p-1 rounded hover:bg-neutral-100 text-neutral-500 transition-colors"
                      title="Regenerate response"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
