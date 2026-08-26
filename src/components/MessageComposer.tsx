import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Globe,
  Brain,
  Image as ImageIcon,
  Sliders,
  CornerDownLeft,
} from 'lucide-react';
import type { AttachedImage, ModelId, ThinkingLevelOption } from '../types';
import { AttachmentUploader, ImageAttachButton } from './AttachmentUploader';

interface MessageComposerProps {
  onSendMessage: (text: string, images: AttachedImage[]) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  model: ModelId;
  useSearch: boolean;
  onToggleSearch: () => void;
  thinkingLevel: ThinkingLevelOption;
  onOpenSettings: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  model,
  useSearch,
  onToggleSearch,
  thinkingLevel,
  onOpenSettings,
}) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<AttachedImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputTriggerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isGenerating) return;
    if (!text.trim() && images.length === 0) return;

    onSendMessage(text.trim(), images);
    setText('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const triggerFileInput = () => {
    const hiddenInput = fileInputTriggerRef.current?.querySelector('input[type="file"]') as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.click();
    }
  };

  // Rough token estimation (~4 chars per token)
  const tokenEstimate = Math.ceil((text.length || 0) / 4);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
        {/* Attachment Strip if images exist */}
        <div ref={fileInputTriggerRef}>
          <AttachmentUploader
            images={images}
            onAddImages={(newImgs) => setImages([...images, ...newImgs])}
            onRemoveImage={(id) => setImages(images.filter((img) => img.id !== id))}
            disabled={isGenerating}
          />
        </div>

        {/* Text Area */}
        <div className="px-4 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder={
              isGenerating
                ? 'Gemini is responding...'
                : 'Ask Gemini anything, paste code, request analysis or attach images...'
            }
            className="w-full text-sm text-neutral-800 placeholder-neutral-400 bg-transparent border-0 resize-none focus:outline-none leading-relaxed max-h-48 overflow-y-auto"
          />
        </div>

        {/* Bottom Toolbar & Badges */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-100 bg-neutral-50/50 rounded-b-2xl text-xs text-neutral-500">
          {/* Left Controls */}
          <div className="flex items-center gap-1">
            <ImageAttachButton
              onClick={triggerFileInput}
              disabled={isGenerating}
              count={images.length}
            />

            {/* Google Search Grounding toggle */}
            <button
              type="button"
              onClick={onToggleSearch}
              disabled={isGenerating}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${
                useSearch
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                  : 'border-transparent hover:bg-neutral-200/60 text-neutral-500'
              }`}
              title="Toggle Google Search live grounding"
            >
              <Globe className={`w-3.5 h-3.5 ${useSearch ? 'text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Model Badge */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-neutral-600 hover:bg-neutral-200/60 transition-colors font-mono text-[11px]"
              title="Click to adjust model parameters"
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>{model === 'gemini-3.7-flash' ? '3.7 Flash' : '3.1 Lite'}</span>
            </button>

            {thinkingLevel !== 'DEFAULT' && (
              <span className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 font-mono">
                <Brain className="w-2.5 h-2.5" />
                <span>{thinkingLevel}</span>
              </span>
            )}
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-2">
            {text.length > 0 && (
              <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
                ~{tokenEstimate} tokens
              </span>
            )}

            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                title="Stop generation"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!text.trim() && images.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-200 disabled:text-neutral-400 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:cursor-not-allowed"
                title="Send message (Enter)"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
