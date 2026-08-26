import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Sliders,
  Sparkles,
  StickyNote,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Bot,
  Globe,
  Brain,
} from 'lucide-react';
import type { ChatSession, ModelId } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onTogglePinSession: (id: string) => void;
  onOpenSettings: () => void;
  onOpenPromptLibrary: () => void;
  onOpenScratchpad: () => void;
  onExportSession: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onTogglePinSession,
  onOpenSettings,
  onOpenPromptLibrary,
  onOpenScratchpad,
  onExportSession,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [search, setSearch] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const recentSessions = filteredSessions.filter((s) => !s.isPinned);

  if (isCollapsed) {
    return (
      <div className="w-14 border-r border-neutral-200 bg-neutral-900 text-neutral-300 flex flex-col items-center py-3.5 justify-between shrink-0 transition-all">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={onNewSession}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenPromptLibrary}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Prompt Library"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenScratchpad}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Scratchpad & Drafts"
          >
            <StickyNote className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Model Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 border-r border-neutral-200 bg-neutral-900 text-neutral-300 flex flex-col h-full shrink-0 transition-all select-none">
      {/* Top Branding & New Chat */}
      <div className="p-3.5 border-b border-neutral-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">Gemini AI Studio</span>
              <span className="block text-[10px] text-neutral-400 font-mono">v3.7 Flash Engine</span>
            </div>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Quick Action Navigation */}
      <div className="px-3 py-2 border-b border-neutral-800 grid grid-cols-2 gap-1.5 text-xs">
        <button
          onClick={onOpenPromptLibrary}
          className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="truncate">Prompts</span>
        </button>
        <button
          onClick={onOpenScratchpad}
          className="flex items-center gap-1.5 p-2 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
        >
          <StickyNote className="w-3.5 h-3.5 text-amber-400" />
          <span className="truncate">Scratchpad</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-800/80 border border-neutral-700/60 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Session Lists */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-neutral-800">
        {/* Pinned Section */}
        {pinnedSessions.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
              <Pin className="w-3 h-3 text-amber-400" />
              <span>Pinned</span>
            </div>
            {pinnedSessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                isActive={s.id === activeSessionId}
                onSelect={() => onSelectSession(s.id)}
                onDelete={() => onDeleteSession(s.id)}
                onTogglePin={() => onTogglePinSession(s.id)}
              />
            ))}
          </div>
        )}

        {/* Recent Section */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Recent Chats ({recentSessions.length})
          </div>
          {recentSessions.length === 0 && pinnedSessions.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs">
              No conversations yet. Start a new one!
            </div>
          ) : (
            recentSessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                isActive={s.id === activeSessionId}
                onSelect={() => onSelectSession(s.id)}
                onDelete={() => onDeleteSession(s.id)}
                onTogglePin={() => onTogglePinSession(s.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors"
          title="Adjust Parameters & Model"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Config</span>
        </button>

        <button
          onClick={onExportSession}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors"
          title="Export current chat transcript"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </aside>
  );
};

const SessionItem: React.FC<{
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}> = ({ session, isActive, onSelect, onDelete, onTogglePin }) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-neutral-800 text-white font-medium shadow-xs border border-neutral-700/60'
          : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-neutral-500'}`} />
        <span className="truncate text-xs">{session.title || 'New Conversation'}</span>
      </div>

      {/* Hover Action buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={`p-1 rounded hover:bg-neutral-700 transition-colors ${
            session.isPinned ? 'text-amber-400 opacity-100' : 'text-neutral-400'
          }`}
          title={session.isPinned ? 'Unpin' : 'Pin to top'}
        >
          <Pin className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded transition-colors"
          title="Delete Chat"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
