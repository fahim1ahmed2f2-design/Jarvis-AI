import React, { useState, useEffect, useCallback } from 'react';
import {
  StickyNote, Plus, Trash2, X, Pin, PinOff,
  Sparkles, Edit3, Save, Search, Tag
} from 'lucide-react';
import { JarvisNote } from '../../types/jarvis';

interface JarvisNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor: string;
  onSendCommand?: (cmd: string) => void;
}

const NOTE_COLORS = [
  { id: 'cyan', border: 'rgba(0, 229, 255, 0.4)', bg: 'rgba(0, 229, 255, 0.04)' },
  { id: 'green', border: 'rgba(16, 185, 129, 0.4)', bg: 'rgba(16, 185, 129, 0.04)' },
  { id: 'amber', border: 'rgba(245, 158, 11, 0.4)', bg: 'rgba(245, 158, 11, 0.04)' },
  { id: 'purple', border: 'rgba(139, 92, 246, 0.4)', bg: 'rgba(139, 92, 246, 0.04)' },
  { id: 'red', border: 'rgba(239, 68, 68, 0.4)', bg: 'rgba(239, 68, 68, 0.04)' },
];

const COLOR_DOT_COLORS: Record<string, string> = {
  cyan: '#00e5ff', green: '#10b981', amber: '#f59e0b', purple: '#8b5cf6', red: '#ef4444'
};

const NOTES_STORAGE_KEY = 'jarvis_notes_v2';

function loadNotes(): JarvisNote[] {
  try {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveNotes(notes: JarvisNote[]): void {
  try { localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes)); } catch {}
}

export const JarvisNotesModal: React.FC<JarvisNotesModalProps> = ({
  isOpen,
  onClose,
  primaryColor,
  onSendCommand
}) => {
  const [notes, setNotes] = useState<JarvisNote[]>(loadNotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState('cyan');
  const [searchText, setSearchText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const persist = (updated: JarvisNote[]) => {
    setNotes(updated);
    saveNotes(updated);
  };

  const handleCreate = () => {
    const newNote: JarvisNote = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      pinned: false,
      color: 'cyan'
    };
    persist([newNote, ...notes]);
    setEditingId(newNote.id);
    setEditTitle(newNote.title);
    setEditContent('');
    setEditColor('cyan');
  };

  const handleSave = (noteId: string) => {
    const updated = notes.map(n =>
      n.id === noteId
        ? { ...n, title: editTitle || 'Untitled', content: editContent, color: editColor, updated_at: new Date().toISOString() }
        : n
    );
    persist(updated);
    setEditingId(null);
  };

  const handleDelete = (noteId: string) => {
    persist(notes.filter(n => n.id !== noteId));
    if (editingId === noteId) setEditingId(null);
  };

  const handleTogglePin = (noteId: string) => {
    persist(notes.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n));
  };

  const handleAIEnhance = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !onSendCommand) return;
    onSendCommand(`Enhance and expand this note for me:\n\nTitle: ${note.title}\n\n${note.content}`);
    onClose();
  };

  const filteredNotes = notes.filter(n =>
    !searchText || 
    n.title.toLowerCase().includes(searchText.toLowerCase()) ||
    n.content.toLowerCase().includes(searchText.toLowerCase())
  ).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '760px', maxWidth: '95vw', maxHeight: '88vh',
        background: 'linear-gradient(135deg, rgba(3,10,24,0.97) 0%, rgba(6,18,36,0.97) 100%)',
        border: `1px solid ${primaryColor}40`,
        borderRadius: '12px',
        boxShadow: `0 0 60px ${primaryColor}20, 0 24px 60px rgba(0,0,0,0.7)`,
        overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: `linear-gradient(90deg, ${primaryColor}10, transparent)`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StickyNote size={16} color={primaryColor} />
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: primaryColor, letterSpacing: '0.1em' }}>
                JARVIS NOTES
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                {notes.length} NOTES // AI-POWERED PAD
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCreate}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '6px',
                background: primaryColor, color: '#030712',
                fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
                border: 'none', cursor: 'pointer'
              }}
            >
              <Plus size={12} /> NEW NOTE
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={13} color="rgba(255,255,255,0.4)" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.75)'
              }}
            />
          </div>
        </div>

        {/* Notes grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredNotes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
              <StickyNote size={28} color="rgba(255,255,255,0.1)" style={{ display: 'block', margin: '0 auto 12px' }} />
              No notes yet. Click "New Note" to create one.
            </div>
          )}
          {filteredNotes.map(note => {
            const colorObj = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
            const isEditing = editingId === note.id;

            return (
              <div key={note.id} style={{
                background: `linear-gradient(135deg, ${colorObj.bg} 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1px solid ${colorObj.border}`,
                borderRadius: '8px',
                padding: '12px 14px',
                position: 'relative'
              }}>
                {isEditing ? (
                  /* Edit Mode */
                  <div>
                    {/* Color picker */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      {NOTE_COLORS.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setEditColor(c.id)}
                          style={{
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: COLOR_DOT_COLORS[c.id],
                            border: editColor === c.id ? '2px solid white' : '2px solid transparent',
                            cursor: 'pointer', padding: 0
                          }}
                        />
                      ))}
                    </div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '5px', padding: '6px 10px', marginBottom: '8px',
                        fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                        outline: 'none', boxSizing: 'border-box'
                      }}
                      placeholder="Note title..."
                    />
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={5}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '5px', padding: '8px 10px',
                        fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.75)',
                        outline: 'none', resize: 'vertical', lineHeight: '1.5', boxSizing: 'border-box'
                      }}
                      placeholder="Write your note..."
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button
                        onClick={() => handleSave(note.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '5px 12px', borderRadius: '5px',
                          background: primaryColor, color: '#030712',
                          fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
                          border: 'none', cursor: 'pointer'
                        }}
                      >
                        <Save size={11} /> SAVE
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '5px 12px', borderRadius: '5px',
                          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                          fontFamily: 'monospace', fontSize: '10px',
                          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {note.pinned && <Pin size={11} color={COLOR_DOT_COLORS[note.color]} />}
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                          {note.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => handleTogglePin(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.pinned ? COLOR_DOT_COLORS[note.color] : 'rgba(255,255,255,0.3)' }}>
                          {note.pinned ? <Pin size={12} /> : <PinOff size={12} />}
                        </button>
                        <button onClick={() => { setEditingId(note.id); setEditTitle(note.title); setEditContent(note.content); setEditColor(note.color); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                          <Edit3 size={12} />
                        </button>
                        {onSendCommand && (
                          <button onClick={() => handleAIEnhance(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: primaryColor, opacity: 0.7 }} title="AI Enhance">
                            <Sparkles size={12} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {note.content && (
                      <p style={{
                        fontFamily: 'monospace', fontSize: '10.5px', color: 'rgba(255,255,255,0.6)',
                        lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap',
                        maxHeight: '80px', overflow: 'hidden'
                      }}>
                        {note.content}
                      </p>
                    )}
                    <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                      {new Date(note.updated_at).toLocaleDateString()} {new Date(note.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
