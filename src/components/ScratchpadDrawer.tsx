import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Save, Copy, Check, StickyNote } from 'lucide-react';
import type { ScratchpadNote } from '../types';

interface ScratchpadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: ScratchpadNote[];
  onSaveNotes: (notes: ScratchpadNote[]) => void;
}

export const ScratchpadDrawer: React.FC<ScratchpadDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onSaveNotes,
}) => {
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const handleCreateNote = () => {
    const newNote: ScratchpadNote = {
      id: Math.random().toString(36).substring(2, 9),
      title: `Draft ${notes.length + 1}`,
      content: '',
      updatedAt: Date.now(),
    };
    const updated = [newNote, ...notes];
    onSaveNotes(updated);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateTitle = (newTitle: string) => {
    if (!currentNote) return;
    const updated = notes.map((n) =>
      n.id === currentNote.id ? { ...n, title: newTitle, updatedAt: Date.now() } : n
    );
    onSaveNotes(updated);
  };

  const handleUpdateContent = (newContent: string) => {
    if (!currentNote) return;
    const updated = notes.map((n) =>
      n.id === currentNote.id ? { ...n, content: newContent, updatedAt: Date.now() } : n
    );
    onSaveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    onSaveNotes(updated);
    if (activeNoteId === id && updated.length > 0) {
      setActiveNoteId(updated[0].id);
    }
  };

  const handleCopy = async () => {
    if (!currentNote?.content) return;
    await navigator.clipboard.writeText(currentNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <StickyNote className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-neutral-900 text-base">Scratchpad & Drafts</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note Tabs Strip */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-neutral-200 bg-neutral-100/60 overflow-x-auto scrollbar-none">
          {notes.length === 0 ? (
            <button
              onClick={handleCreateNote}
              className="text-xs text-neutral-500 hover:text-neutral-900 py-1"
            >
              + Click to create your first note
            </button>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 ${
                  activeNoteId === note.id
                    ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200'
                    : 'text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                <span className="truncate max-w-[120px]">{note.title || 'Untitled'}</span>
                {notes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="text-neutral-400 hover:text-red-600 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Editor Body */}
        {currentNote ? (
          <div className="flex-1 flex flex-col p-5 space-y-3 overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                value={currentNote.title}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                placeholder="Note Title..."
                className="text-base font-bold text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-blue-500 focus:outline-none flex-1 py-1"
              />
              <button
                onClick={handleCopy}
                disabled={!currentNote.content}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 disabled:opacity-40 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            <textarea
              value={currentNote.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
              placeholder="Jot down notes, test prompt ideas, copy code snippets or generated insights here..."
              className="flex-1 w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs leading-relaxed text-neutral-800 resize-none"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
            No note selected. Click "New Note" to begin.
          </div>
        )}
      </div>
    </div>
  );
};
