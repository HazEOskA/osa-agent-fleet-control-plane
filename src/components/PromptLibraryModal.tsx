import React, { useState } from 'react';
import { X, Search, Sparkles, Cpu, Code2, Lightbulb, Scale, FileJson, FileText, ArrowRight } from 'lucide-react';
import { PROMPT_TEMPLATES } from '../data/templates';
import type { PromptTemplate } from '../types';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PromptTemplate) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-4 h-4 text-indigo-500" />,
  Code2: <Code2 className="w-4 h-4 text-emerald-500" />,
  Lightbulb: <Lightbulb className="w-4 h-4 text-amber-500" />,
  Scale: <Scale className="w-4 h-4 text-blue-500" />,
  FileJson: <FileJson className="w-4 h-4 text-cyan-500" />,
  FileText: <FileText className="w-4 h-4 text-rose-500" />,
};

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Coding', 'Reasoning', 'Analysis', 'Writing', 'Data'];

  const filtered = PROMPT_TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'All' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase()) ||
      tpl.prompt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/80 rounded-xl text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Prompt Engineering Library</h2>
              <p className="text-xs text-neutral-500">
                Curated high-signal frameworks and blueprints optimized for Gemini 3.7
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-neutral-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, categories, or keywords..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-100/80 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-neutral-800 placeholder-neutral-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-sm">
              No matching prompts found. Try a different search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filtered.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-xl border border-neutral-200/80 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition-all flex flex-col justify-between group shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-neutral-100 border border-neutral-200">
                          {ICON_MAP[tpl.iconName] || <Sparkles className="w-4 h-4 text-blue-500" />}
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                          {tpl.category}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-neutral-900 text-sm group-hover:text-blue-600 transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {tpl.systemInstruction ? 'Custom Persona' : 'Standard'}
                    </span>
                    <button
                      onClick={() => {
                        onSelectTemplate(tpl);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Use Prompt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
