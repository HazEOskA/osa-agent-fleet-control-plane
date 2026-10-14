/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Sliders,
  AlertTriangle,
  Download,
  Share2,
  Menu,
  Key,
  ShieldCheck,
  Brain,
  Globe,
  Trash2,
} from 'lucide-react';
import type {
  ChatSession,
  ChatMessage,
  ModelId,
  ThinkingLevelOption,
  AttachedImage,
  PromptTemplate,
  ScratchpadNote,
} from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { MessageComposer } from './components/MessageComposer';
import { SettingsModal } from './components/SettingsModal';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { ScratchpadDrawer } from './components/ScratchpadDrawer';
import { FleetLogin } from './components/FleetLogin';

const STORAGE_SESSIONS_KEY = 'gemini_studio_sessions_v1';
const STORAGE_ACTIVE_ID_KEY = 'gemini_studio_active_session_v1';
const STORAGE_NOTES_KEY = 'gemini_studio_scratchpad_v1';

function createDefaultSession(): ChatSession {
  return {
    id: Math.random().toString(36).substring(2, 9),
    title: 'New Conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    model: 'gemini-3.7-flash',
    temperature: 0.7,
    thinkingLevel: 'DEFAULT',
    useSearch: false,
    systemInstruction: '',
    isPinned: false,
  };
}

export default function App() {
  // Session states
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return [createDefaultSession()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
      if (savedId) return savedId;
    } catch {
      // Fallback
    }
    return sessions[0]?.id || '';
  });

  // Scratchpad states
  const [notes, setNotes] = useState<ScratchpadNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NOTES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'welcome-note',
        title: 'Project Notes & Architecture',
        content: '# Gemini AI Studio Scratchpad\n- Use this space to paste code, outline prompt ideas, or save generation insights.\n- Everything is automatically saved locally.',
        updatedAt: Date.now(),
      },
    ];
  });

  // UI Modals & Drawers
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Runtime status
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
    } catch {
      // Handle quota exceeded
    }
  }, [sessions]);

  // Save active session ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeSessionId);
    } catch {
      // Fallback
    }
  }, [activeSessionId]);

  // Save scratchpad notes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
    } catch {
      // Fallback
    }
  }, [notes]);

  // Browser uses a same-origin, HttpOnly operator session, never the Fleet service bearer.
  useEffect(() => {
    let active = true;
    fetch('/api/session', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => { if (active) setAuthenticated(data.authenticated === true); })
      .catch(() => { if (active) setAuthenticated(false); });
    return () => { active = false; };
  }, []);

  // Check health endpoint
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasKey === 'boolean') {
          setHasApiKey(data.hasKey);
        }
      })
      .catch((err) => {
        console.warn('Could not verify /api/health status:', err);
      });
  }, []);

  // Active session helper
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || createDefaultSession();

  const updateActiveSession = useCallback(
    (updater: (prev: ChatSession) => ChatSession) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? updater(s) : s))
      );
    },
    [activeSession.id]
  );

  // Handlers for Session Management
  const handleNewSession = () => {
    const newSession = createDefaultSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = createDefaultSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleTogglePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const handleClearCurrentChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      updateActiveSession((s) => ({
        ...s,
        messages: [],
        updatedAt: Date.now(),
      }));
    }
  };

  const handleExportSession = () => {
    if (activeSession.messages.length === 0) {
      alert('This conversation is empty.');
      return;
    }

    const transcript = activeSession.messages
      .map(
        (m) =>
          `### ${m.role === 'user' ? 'User' : `Gemini (${activeSession.model})`} [${new Date(
            m.timestamp
          ).toLocaleString()}]\n\n${m.text}\n`
      )
      .join('\n---\n\n');

    const fileContent = `# ${activeSession.title}\n*Exported on ${new Date().toLocaleString()}*\n\n${transcript}`;
    const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeSession.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_transcript.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Send Message & Stream Response
  const handleSendMessage = async (userText: string, attachedImages: AttachedImage[]) => {
    if (isGenerating) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      text: userText,
      images: attachedImages,
      timestamp: Date.now(),
    };

    // Auto-title session if it's the first message
    const shouldTitle = activeSession.messages.length === 0;
    const newTitle = shouldTitle
      ? userText.slice(0, 36) + (userText.length > 36 ? '...' : '')
      : activeSession.title;

    // Model placeholder message
    const modelMessageId = Math.random().toString(36).substring(2, 9);
    const initialModelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelUsed: activeSession.model,
    };

    const updatedMessages = [...activeSession.messages, userMessage, initialModelMessage];

    updateActiveSession((s) => ({
      ...s,
      title: newTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    }));

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Prepare payload for server
      const payloadMessages = [...activeSession.messages, userMessage].map((m) => ({
        role: m.role === 'model' ? ('model' as const) : ('user' as const),
        text: m.text,
        images: m.images?.map((img) => ({
          data: img.data,
          mimeType: img.mimeType,
        })),
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: activeSession.model,
          systemInstruction: activeSession.systemInstruction,
          temperature: activeSession.temperature,
          thinkingLevel:
            activeSession.thinkingLevel === 'DEFAULT' ? undefined : activeSession.thinkingLevel,
          useSearch: activeSession.useSearch,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 401) setAuthenticated(false);
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let accumulatedThinking = '';
      let groundingData: unknown = undefined;

      let terminal = false;
      if (!reader) throw new Error('Fleet returned no response stream');
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, '\n');
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        for (const block of blocks) {
          const dataLine = block.split('\n').find(line => line.startsWith('data:'));
          if (!dataLine) continue;
          const dataStr = dataLine.slice(5).trim();
          if (dataStr === '[DONE]') { terminal = true; continue; }
          let parsed: { type?: string; error?: { code?: string } | string; text?: string; grounding?: unknown };
          try { parsed = JSON.parse(dataStr); }
          catch { throw new Error('Invalid Fleet SSE JSON'); }
          if (parsed.type === 'error' || parsed.error) throw new Error('Fleet generation failed');
          if (parsed.type === 'done') { terminal = true; continue; }
          if (terminal) throw new Error('Unexpected Fleet data after completion');
          if (parsed.text) accumulatedText += parsed.text;
          if (parsed.grounding) groundingData = parsed.grounding;
          updateActiveSession((s) => ({
            ...s,
            messages: s.messages.map(m => m.id === modelMessageId ? {
              ...m, text: accumulatedText,
              groundingMetadata: groundingData as ChatMessage['groundingMetadata'],
              isStreaming: true,
            } : m),
          }));
        }
      }
      if (!terminal || !accumulatedText.trim()) throw new Error('Incomplete Fleet response');
      
      // Finish streaming successfully
      updateActiveSession((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === modelMessageId
            ? {
                ...m,
                text: accumulatedText,
                groundingMetadata: groundingData as ChatMessage['groundingMetadata'],
                isStreaming: false,
              }
            : m
        ),
      }));
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        const errorMsg = (err as Error)?.message || 'Generation failed. Check server logs or API key.';
        updateActiveSession((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === modelMessageId
              ? {
                  ...m,
                  error: errorMsg,
                  isStreaming: false,
                }
              : m
          ),
        }));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerateLast = () => {
    if (activeSession.messages.length < 2) return;
    const lastUserIndex = [...activeSession.messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = activeSession.messages.length - 1 - lastUserIndex;
    const userMsg = activeSession.messages[actualIndex];

    // Remove everything from actualIndex + 1 onwards
    const trimmed = activeSession.messages.slice(0, actualIndex);
    updateActiveSession((s) => ({ ...s, messages: trimmed }));

    // Resend
    handleSendMessage(userMsg.text, userMsg.images || []);
  };

  const handleUsePromptTemplate = (tpl: PromptTemplate) => {
    if (tpl.systemInstruction) {
      updateActiveSession((s) => ({
        ...s,
        systemInstruction: tpl.systemInstruction || s.systemInstruction,
      }));
    }
    handleSendMessage(tpl.prompt, []);
  };

  if (authenticated === null) {
    return <div className="grid min-h-screen place-items-center bg-neutral-950 text-neutral-100">Checking Fleet operator session…</div>;
  }
  if (!authenticated) return <FleetLogin onAuthenticated={() => setAuthenticated(true)} />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 font-sans text-neutral-900 antialiased">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSession.id}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onExportSession={handleExportSession}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50/50">
        {/* Top Navbar */}
        <header className="h-14 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="Expand Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-neutral-900 text-sm truncate">
                {activeSession.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                <span className="text-blue-600 font-semibold">{activeSession.model}</span>
                <span>•</span>
                <span>temp: {activeSession.temperature}</span>
                {activeSession.useSearch && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                      <Globe className="w-3 h-3" /> Search ON
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Clear */}
            {activeSession.messages.length > 0 && (
              <button
                onClick={handleClearCurrentChat}
                className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-neutral-100 transition-colors"
                title="Clear current conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Config & Parameters */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors"
              title="Configure parameters & persona"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </header>

        {/* API Key Missing Alert Banner if applicable */}
        {!hasApiKey && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>API Key configuration:</strong> Ensure your <code>GEMINI_API_KEY</code> is enabled in Google AI Studio's <strong>Settings &gt; Secrets</strong> panel.
              </span>
            </div>
          </div>
        )}

        {/* Chat Stream Workspace */}
        <ChatWorkspace
          messages={activeSession.messages}
          isGenerating={isGenerating}
          onRegenerateLast={handleRegenerateLast}
          onUsePromptTemplate={handleUsePromptTemplate}
        />

        {/* Message Input Composer */}
        <div className="shrink-0 bg-gradient-to-t from-neutral-50 via-neutral-50/90 to-transparent pt-2">
          <MessageComposer
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isGenerating={isGenerating}
            model={activeSession.model}
            useSearch={activeSession.useSearch}
            onToggleSearch={() =>
              updateActiveSession((s) => ({ ...s, useSearch: !s.useSearch }))
            }
            thinkingLevel={activeSession.thinkingLevel}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        model={activeSession.model}
        onChangeModel={(m) => updateActiveSession((s) => ({ ...s, model: m }))}
        temperature={activeSession.temperature}
        onChangeTemperature={(t) => updateActiveSession((s) => ({ ...s, temperature: t }))}
        thinkingLevel={activeSession.thinkingLevel}
        onChangeThinkingLevel={(l) => updateActiveSession((s) => ({ ...s, thinkingLevel: l }))}
        useSearch={activeSession.useSearch}
        onChangeUseSearch={(srch) => updateActiveSession((s) => ({ ...s, useSearch: srch }))}
        systemInstruction={activeSession.systemInstruction}
        onChangeSystemInstruction={(si) => updateActiveSession((s) => ({ ...s, systemInstruction: si }))}
        hasApiKey={hasApiKey}
      />

      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectTemplate={handleUsePromptTemplate}
      />

      <ScratchpadDrawer
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        notes={notes}
        onSaveNotes={setNotes}
      />
    </div>
  );
}
