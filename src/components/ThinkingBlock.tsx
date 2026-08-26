import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface ThinkingBlockProps {
  thinkingText?: string;
  isStreaming?: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ thinkingText, isStreaming }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinkingText && !isStreaming) return null;

  return (
    <div className="mb-3 rounded-lg border border-purple-200/80 bg-purple-50/40 text-xs overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-purple-900 font-medium hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span className="font-semibold text-purple-950">
            {isStreaming ? 'Reasoning in progress...' : 'Thinking Process'}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200/70 text-purple-800 font-normal">
            Gemini 3.7
          </span>
        </div>
        <div className="flex items-center gap-1 text-purple-700">
          <span className="text-[11px]">{isOpen ? 'Hide' : 'Show details'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 py-2.5 bg-white/70 border-t border-purple-100 font-mono text-[12px] leading-relaxed text-neutral-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
          {thinkingText || (
            <div className="flex items-center gap-2 text-purple-600">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing constraints and synthesizing solution...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
