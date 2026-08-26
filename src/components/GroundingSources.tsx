import React, { useState } from 'react';
import { Globe, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { GroundingMetadata } from '../types';

interface GroundingSourcesProps {
  metadata?: GroundingMetadata;
}

export const GroundingSources: React.FC<GroundingSourcesProps> = ({ metadata }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!metadata) return null;

  const chunks = metadata.groundingChunks || [];
  const queries = metadata.webSearchQueries || [];

  if (chunks.length === 0 && queries.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-neutral-100 text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-800 transition-colors font-medium py-1 px-2 rounded-md hover:bg-neutral-100/80"
      >
        <Globe className="w-3.5 h-3.5 text-blue-600" />
        <span>Grounding Sources ({chunks.length})</span>
        {queries.length > 0 && (
          <span className="text-[11px] text-neutral-400 font-normal hidden sm:inline">
            • {queries[0]}
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-neutral-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-neutral-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-blue-200">
          {queries.length > 0 && (
            <div className="text-[11px] text-neutral-500 flex items-center gap-1">
              <span className="font-semibold text-neutral-600">Search Queries:</span>
              <div className="flex flex-wrap gap-1">
                {queries.map((q, idx) => (
                  <span key={idx} className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">
                    "{q}"
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            {chunks.map((chunk, idx) => {
              const uri = chunk.web?.uri;
              const title = chunk.web?.title || uri;
              if (!uri) return null;

              let domain = '';
              try {
                domain = new URL(uri).hostname.replace(/^www\./, '');
              } catch {
                domain = uri;
              }

              return (
                <a
                  key={idx}
                  href={uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded bg-neutral-50 hover:bg-blue-50/60 border border-neutral-200 hover:border-blue-300 transition-all group text-left"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium text-neutral-800 truncate text-[12px] group-hover:text-blue-700">
                      {title}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">{domain}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-blue-600 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
