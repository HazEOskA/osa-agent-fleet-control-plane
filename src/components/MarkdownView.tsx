import React, { useState } from 'react';
import { Check, Copy, Eye, Code, ChevronDown, ChevronRight } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  if (!content) return null;

  // Split content by code blocks (```lang ... ```)
  const segments = parseMarkdownSegments(content);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-neutral-800 break-words">
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <CodeBlockCard
              key={idx}
              code={seg.code}
              language={seg.language}
            />
          );
        }
        return <ProseBlock key={idx} text={seg.text} />;
      })}
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlockCard: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const isHtmlOrSvg =
    language.toLowerCase() === 'html' ||
    language.toLowerCase() === 'svg' ||
    (language.toLowerCase() === 'xml' && code.includes('<svg'));

  const isJson = language.toLowerCase() === 'json';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className="rounded-xl border border-neutral-200/90 bg-neutral-950 text-neutral-100 overflow-hidden shadow-xs my-3 font-mono text-[13px]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px] px-1.5 py-0.5 bg-neutral-800 rounded">
            {language || 'text'}
          </span>
          <span className="text-[11px] text-neutral-500">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isHtmlOrSvg && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                showPreview
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'hover:bg-neutral-800 text-neutral-300'
              }`}
              title={showPreview ? 'Show Code' : 'Live Preview'}
            >
              {showPreview ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPreview ? 'Code' : 'Preview'}</span>
            </button>
          )}

          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`hidden sm:inline-block px-2 py-1 rounded text-xs transition-colors ${
              showLineNumbers ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'
            }`}
            title="Toggle Line Numbers"
          >
            #
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body / Preview */}
      {showPreview && isHtmlOrSvg ? (
        <div className="p-4 bg-white text-neutral-900 border-b border-neutral-200">
          <div className="p-3 bg-neutral-50 rounded border border-neutral-200 overflow-auto max-h-96">
            <div dangerouslySetInnerHTML={{ __html: code }} />
          </div>
        </div>
      ) : (
        <div className="p-3.5 overflow-x-auto max-h-[520px] scrollbar-thin scrollbar-thumb-neutral-700">
          <pre className="flex leading-6 text-neutral-200">
            {showLineNumbers && (
              <span className="select-none text-neutral-600 pr-3.5 text-right border-r border-neutral-800/80 mr-3.5 text-xs font-mono">
                {lines.map((_, i) => (
                  <span key={i} className="block leading-6">
                    {i + 1}
                  </span>
                ))}
              </span>
            )}
            <code className="flex-1 font-mono">{code.trim()}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

const ProseBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-semibold text-neutral-900 mt-3 mb-1">
              <InlineFormatting text={trimmed.slice(4)} />
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-semibold text-neutral-900 mt-4 mb-1.5 pb-1 border-b border-neutral-200/80">
              <InlineFormatting text={trimmed.slice(3)} />
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl font-bold text-neutral-900 mt-5 mb-2 pb-1 border-b border-neutral-300">
              <InlineFormatting text={trimmed.slice(2)} />
            </h1>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-3 border-blue-500 bg-blue-50/50 pl-3.5 py-1.5 my-1.5 text-neutral-700 rounded-r-md text-[14px] italic">
              <InlineFormatting text={trimmed.slice(2)} />
            </blockquote>
          );
        }

        // Unordered lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-neutral-400 mt-1.5 select-none text-[8px]">•</span>
              <div className="flex-1">
                <InlineFormatting text={trimmed.slice(2)} />
              </div>
            </div>
          );
        }

        // Numbered lists (e.g. 1. 2. )
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-semibold text-neutral-500 min-w-[20px] text-xs mt-0.5 select-none">
                {numberedMatch[1]}.
              </span>
              <div className="flex-1">
                <InlineFormatting text={numberedMatch[2]} />
              </div>
            </div>
          );
        }

        // Horizontal Rule
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return <hr key={idx} className="border-neutral-200 my-3" />;
        }

        // Standard paragraph line
        return (
          <p key={idx} className="text-neutral-800">
            <InlineFormatting text={line} />
          </p>
        );
      })}
    </div>
  );
};

// Parser for inline formatting (bold, italics, code, links)
const InlineFormatting: React.FC<{ text: string }> = ({ text }) => {
  // Regex to split on `code`, **bold**, *italic*, [link](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        // Inline Code `...`
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-900 font-mono text-[13px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Bold **...**
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          return (
            <strong key={index} className="font-semibold text-neutral-950">
              {part.slice(2, -2)}
            </strong>
          );
        }

        // Italic *...*
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
          return (
            <em key={index} className="italic text-neutral-800">
              {part.slice(1, -1)}
            </em>
          );
        }

        // Link [title](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={index}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline underline-offset-2 decoration-blue-300 font-medium inline-flex items-center gap-0.5"
            >
              {linkMatch[1]}
            </a>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

// Helper to separate prose and code blocks
type MarkdownSegment =
  | { type: 'prose'; text: string }
  | { type: 'code'; code: string; language: string };

function parseMarkdownSegments(markdown: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      const prose = markdown.slice(lastIndex, match.index);
      if (prose.trim()) {
        segments.push({ type: 'prose', text: prose });
      }
    }

    const language = match[1] || 'text';
    const code = match[2] || '';
    segments.push({ type: 'code', code, language });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < markdown.length) {
    const trailing = markdown.slice(lastIndex);
    if (trailing.trim()) {
      segments.push({ type: 'prose', text: trailing });
    }
  }

  return segments;
}
