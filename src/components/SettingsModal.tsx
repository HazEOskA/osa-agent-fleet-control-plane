import React from 'react';
import { X, Sliders, Sparkles, Brain, Globe, ShieldCheck, HelpCircle } from 'lucide-react';
import type { ModelId, ThinkingLevelOption } from '../types';
import { SYSTEM_PERSONAS } from '../data/templates';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ModelId;
  onChangeModel: (model: ModelId) => void;
  temperature: number;
  onChangeTemperature: (temp: number) => void;
  thinkingLevel: ThinkingLevelOption;
  onChangeThinkingLevel: (level: ThinkingLevelOption) => void;
  useSearch: boolean;
  onChangeUseSearch: (useSearch: boolean) => void;
  systemInstruction: string;
  onChangeSystemInstruction: (instruction: string) => void;
  hasApiKey: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  model,
  onChangeModel,
  temperature,
  onChangeTemperature,
  thinkingLevel,
  onChangeThinkingLevel,
  useSearch,
  onChangeUseSearch,
  systemInstruction,
  onChangeSystemInstruction,
  hasApiKey,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-900 text-white rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Model Parameters & Persona</h2>
              <p className="text-xs text-neutral-500">Configure Gemini model behavior and generation rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* API Key Status */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-5 h-5 ${hasApiKey ? 'text-emerald-600' : 'text-amber-500'}`} />
              <div>
                <p className="font-semibold text-xs text-neutral-900">
                  {hasApiKey ? 'Server Gemini API Key Attached' : 'API Key Setup in AI Studio'}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {hasApiKey
                    ? 'Securely proxied via server-side Google GenAI SDK'
                    : 'Manage in Settings > Secrets in Google AI Studio'}
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                hasApiKey ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {hasApiKey ? 'Connected' : 'Secret Managed'}
            </span>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block font-semibold text-neutral-900 text-xs uppercase tracking-wider">
              Gemini Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChangeModel('gemini-3.7-flash')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  model === 'gemini-3.7-flash'
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-neutral-900 text-sm">Gemini 3.7 Flash</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  State-of-the-art hybrid reasoning, coding, multimodal vision, and high speed.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onChangeModel('gemini-3.1-flash-lite')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  model === 'gemini-3.1-flash-lite'
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-neutral-900 text-sm">Gemini 3.1 Flash Lite</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                    Fast
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Ultra-low latency lightweight model for instant responses and summaries.
                </p>
              </button>
            </div>
          </div>

          {/* Thinking Level (for 3.7 Flash) */}
          {model === 'gemini-3.7-flash' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-600" />
                  <span>Thinking & Reasoning Level</span>
                </label>
                <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {thinkingLevel}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['DEFAULT', 'HIGH', 'LOW', 'MINIMAL'] as ThinkingLevelOption[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onChangeThinkingLevel(lvl)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      thinkingLevel === lvl
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {lvl === 'DEFAULT' ? 'Auto (Default)' : lvl}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500">
                Controls the depth of intermediate chain-of-thought exploration before final response generation.
              </p>
            </div>
          )}

          {/* Google Search Grounding */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-neutral-900 text-sm">Google Search Grounding</span>
              </div>
              <p className="text-xs text-neutral-500">
                Ground answers in real-time Google Search data with cited source links.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={useSearch}
                onChange={(e) => onChangeUseSearch(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                Temperature ({temperature.toFixed(2)})
              </label>
              <span className="text-xs text-neutral-500">
                {temperature < 0.3 ? 'Deterministic & Precise' : temperature < 0.9 ? 'Balanced' : 'Creative & Divergent'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={temperature}
              onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
              <span>0.0 (Precise)</span>
              <span>1.0 (Balanced)</span>
              <span>2.0 (Creative)</span>
            </div>
          </div>

          {/* System Instructions / Personas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                System Persona & Instructions
              </label>
              <span className="text-[11px] text-neutral-400">Optional</span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SYSTEM_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChangeSystemInstruction(p.instruction)}
                  className="px-2.5 py-1 text-xs rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium whitespace-nowrap transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={systemInstruction}
              onChange={(e) => onChangeSystemInstruction(e.target.value)}
              placeholder="e.g. You are a Senior Staff Engineer. Answer directly with concise TypeScript code and test cases."
              className="w-full p-3 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-neutral-800 placeholder-neutral-400 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
