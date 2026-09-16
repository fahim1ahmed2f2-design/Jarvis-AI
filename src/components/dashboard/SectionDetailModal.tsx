import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Trash2,
  Plus,
  Loader2,
  Home,
  Power,
  Lightbulb,
  Wind,
  Tv,
  Radio,
  Send,
  Sparkles,
  Volume2
} from 'lucide-react';
import { NavSection, StateVisualConfig, TelemetryData } from '../../types/jarvis';
import {
  fetchMemories,
  fetchReminders,
  fetchAvailableTools,
  fetchTaskHistory,
  createMemory,
  deleteMemory,
  MemoryRecord,
  ReminderRecord,
  AutonomousTaskRecord,
  ToolRecord,
  fetchSmartDevices,
  toggleSmartDevice,
  fetchSmartScenes,
  activateSmartScene,
  broadcastGoogleHome,
  SmartDeviceRecord
} from '../../services/api';

interface SectionDetailModalProps {
  section: NavSection;
  config: StateVisualConfig;
  telemetry: TelemetryData;
  onClose: () => void;
  onSendCommand: (cmd: string) => void;
}

export const SectionDetailModal: React.FC<SectionDetailModalProps> = ({
  section,
  config,
  telemetry,
  onClose,
  onSendCommand
}) => {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [tasks, setTasks] = useState<AutonomousTaskRecord[]>([]);
  const [smartDevices, setSmartDevices] = useState<SmartDeviceRecord[]>([]);
  const [smartScenes, setSmartScenes] = useState<Record<string, any>>({});
  const [smartProvider, setSmartProvider] = useState<string>('virtual');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<string>('');
  const [newMemoryText, setNewMemoryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadSectionData = async () => {
      setIsLoading(true);
      try {
        if (section === 'MEMORY') {
          const mems = await fetchMemories();
          if (isMounted) setMemories(mems?.memories || []);
        } else if (section === 'CALENDAR') {
          const rems = await fetchReminders();
          if (isMounted) setReminders(rems?.reminders || []);
        } else if (section === 'TOOLS') {
          const tList = await fetchAvailableTools();
          if (isMounted) setTools(tList.tools || []);
        } else if (section === 'TASKS') {
          const tHistory = await fetchTaskHistory();
          if (isMounted) setTasks(tHistory?.tasks || []);
        } else if (section === 'SMART_HOME') {
          const devData = await fetchSmartDevices();
          if (isMounted) {
            setSmartDevices(devData.devices || []);
            setSmartProvider(devData.provider || 'virtual');
          }
          const scData = await fetchSmartScenes();
          if (isMounted) setSmartScenes(scData.scenes || {});
        }
      } catch (err) {
        console.warn('Error loading section data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadSectionData();
    return () => { isMounted = false; };
  }, [section]);

  const handleToggleSmart = async (id: string) => {
    try {
      await toggleSmartDevice(id);
      const updated = await fetchSmartDevices();
      setSmartDevices(updated.devices || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivateScene = async (sceneId: string) => {
    try {
      await activateSmartScene(sceneId);
      const updated = await fetchSmartDevices();
      setSmartDevices(updated.devices || []);
      setBroadcastStatus(`Engaged ${sceneId.replace('_', ' ').toUpperCase()} scene!`);
      setTimeout(() => setBroadcastStatus(''), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    try {
      setBroadcastStatus('Broadcasting to Google Home speakers...');
      await broadcastGoogleHome(broadcastText.trim());
      setBroadcastStatus(`Vocal announcement transmitted: "${broadcastText}"`);
      setBroadcastText('');
      setTimeout(() => setBroadcastStatus(''), 4000);
    } catch (e) {
      setBroadcastStatus('Broadcast failed.');
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    try {
      await createMemory(newMemoryText.trim(), 'user_input');
      setNewMemoryText('');
      const updated = await fetchMemories();
      setMemories(updated?.memories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getSectionTitle = () => {
    switch (section) {
      case 'AGENTS': return 'CORE SUBSYSTEMS & AGENTS';
      case 'TASKS': return 'AUTONOMOUS TASKS & HISTORY';
      case 'CALENDAR': return 'REMINDERS & SCHEDULED TIMERS';
      case 'MEMORY': return 'LONG-TERM MEMORY STORE';
      case 'TOOLS': return 'REGISTERED PC TOOLS & CAPABILITIES';
      case 'SMART_HOME': return 'GOOGLE HOME & IOT MATRIX';
      default: return section;
    }
  };

  return (
    <div className="jarvis-section-modal-overlay">
      <div
        className="jarvis-section-modal"
        style={{ borderColor: config.primaryColor }}
      >
        {/* Modal Header */}
        <div className="section-modal-header">
          <div className="modal-title-group">
            <span className="modal-icon font-mono" style={{ color: config.primaryColor }}>//</span>
            <h2 className="modal-title font-display">{getSectionTitle()}</h2>
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: config.primaryColor, marginLeft: '0.5rem' }} />
            )}
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="section-modal-body font-mono">
          {/* 1. AGENTS VIEW */}
          {section === 'AGENTS' && (
            <div className="modal-agents-grid">
              {[
                { name: 'Computer Control Agent', desc: 'Direct desktop application launching, windows manipulation, and safe filesystem operations', status: telemetry.backendStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE' },
                { name: 'Voice Subsystem', desc: 'Real-time browser speech recognition (STT) and OpenAI TTS vocal playback', status: 'ONLINE' },
                { name: 'Neural Reasoning Core', desc: 'OpenAI GPT-4o / GPT-4o-mini reasoning, tool parameter generation, and conversational planning', status: telemetry.isConfigured ? 'ONLINE' : 'UNCONFIGURED' },
                { name: 'Memory Store', desc: 'Persistent user preferences, workspace facts, and contextual recall across sessions', status: telemetry.backendStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE' },
                { name: 'Autonomous Task Engine', desc: 'Multi-step action sequencing, state management, and self-healing verification', status: telemetry.backendStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE' },
                { name: 'PC Tool Registry', desc: `${telemetry.totalTools} registered sandboxed functions for system, browser, and OS interaction`, status: telemetry.backendStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE' }
              ].map((ag, i) => (
                <div key={i} className="agent-detail-card">
                  <div className="card-top">
                    <span className="agent-name font-display">{ag.name}</span>
                    <span
                      className="agent-status-pill"
                      style={{ color: ag.status === 'ONLINE' ? '#10b981' : ag.status === 'UNCONFIGURED' ? '#f59e0b' : '#ef4444' }}
                    >
                      ● {ag.status}
                    </span>
                  </div>
                  <p className="agent-desc">{ag.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* 2. MEMORY VIEW */}
          {section === 'MEMORY' && (
            <div className="modal-memory-view">
              <form className="add-memory-bar" onSubmit={handleAddMemory}>
                <input
                  type="text"
                  placeholder="Add a new memory (e.g. 'User prefers Dark Mode and concise code')..."
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  className="add-mem-input font-mono"
                />
                <button type="submit" className="add-mem-btn font-mono" style={{ backgroundColor: config.primaryColor }}>
                  <Plus className="w-3.5 h-3.5" /> SAVE
                </button>
              </form>

              <div className="memories-scroll-list">
                {isLoading ? (
                  <div className="empty-notice">Loading memory store...</div>
                ) : memories.length === 0 ? (
                  <div className="empty-notice">No stored memories in database. Type above to add one.</div>
                ) : (
                  memories.map((m) => (
                    <div key={m.id} className="memory-row-card">
                      <div className="mem-row-top">
                        <span className="mem-cat-badge">[{m.category || 'PREFERENCE'}]</span>
                        <span className="mem-date">{m.created_at ? new Date(m.created_at).toLocaleString() : 'RECENT'}</span>
                        <button
                          className="mem-del-btn"
                          onClick={() => handleDeleteMemory(m.id)}
                          title="Delete memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="mem-content">{m.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. CALENDAR & REMINDERS VIEW */}
          {section === 'CALENDAR' && (
            <div className="modal-calendar-view">
              <div className="calendar-status-bar">
                <span>SCHEDULED REMINDERS ({reminders.length})</span>
                <button
                  className="quick-add-btn font-mono"
                  onClick={() => {
                    onClose();
                    onSendCommand('Remind me in 10 minutes to review project status');
                  }}
                >
                  + SET 10-MIN REMINDER
                </button>
              </div>

              <div className="reminders-scroll-list">
                {isLoading ? (
                  <div className="empty-notice">Loading reminders...</div>
                ) : reminders.length === 0 ? (
                  <div className="empty-notice">No pending reminders in assistant scheduler.</div>
                ) : (
                  reminders.map((r) => (
                    <div key={r.id} className="reminder-row-card">
                      <div className="rem-top">
                        <span className="rem-title">{r.title}</span>
                        <span className="rem-status" style={{ color: r.status === 'pending' ? config.primaryColor : '#10b981' }}>
                          ● {r.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="rem-meta">
                        <span>DUE: {r.due_timestamp}</span>
                        <span>RECURRING: {r.recurring ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. TASKS VIEW */}
          {section === 'TASKS' && (
            <div className="modal-tasks-view">
              <div className="tools-count-bar">
                <span>AUTONOMOUS TASK HISTORY ({tasks.length})</span>
              </div>
              <div className="memories-scroll-list">
                {isLoading ? (
                  <div className="empty-notice">Loading task history...</div>
                ) : tasks.length === 0 ? (
                  <div className="empty-notice">No autonomous tasks have been executed yet.</div>
                ) : (
                  tasks.map((t) => (
                    <div key={t.task_id} className="memory-row-card">
                      <div className="mem-row-top">
                        <span className="mem-cat-badge">[{t.status.toUpperCase()}]</span>
                        <span className="mem-date">{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</span>
                      </div>
                      <p className="mem-content"><strong>Goal:</strong> {t.goal}</p>
                      {t.steps && t.steps.length > 0 && (
                        <div className="agent-meta" style={{ marginTop: '0.4rem' }}>
                          <span>STEPS: {t.steps.length}</span>
                          <span>RESULT: {t.result_summary || 'Completed'}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. TOOLS VIEW */}
          {section === 'TOOLS' && (
            <div className="modal-tools-view">
              <div className="tools-count-bar">
                <span>TOTAL REGISTERED TOOLS: {tools.length || telemetry.totalTools}</span>
                <span>STATUS: ACTIVE &amp; SANDBOXED</span>
              </div>

              <div className="tools-scroll-grid">
                {isLoading ? (
                  <div className="empty-notice">Loading registered tools...</div>
                ) : tools.length === 0 ? (
                  <div className="empty-notice">No registered tools found.</div>
                ) : (
                  tools.map((t, idx) => (
                    <div key={idx} className="tool-chip-card">
                      <div className="tool-chip-header">
                        <Wrench className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                        <span className="tool-name">{t.name}</span>
                        {t.permission_level && (
                          <span className="meta-text" style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#10b981' }}>
                            [{t.permission_level.toUpperCase()}]
                          </span>
                        )}
                      </div>
                      <p className="tool-desc">{t.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 6. SMART HOME VIEW */}
          {section === 'SMART_HOME' && (
            <div className="modal-smart-home-view">
              <div className="tools-count-bar">
                <span>ACTIVE BRIDGE: {smartProvider.toUpperCase()}</span>
                <span>DEVICES: {smartDevices.length}</span>
              </div>
              
              <div className="broadcast-box">
                <input 
                  type="text" 
                  value={broadcastText} 
                  onChange={(e) => setBroadcastText(e.target.value)} 
                  placeholder="Broadcast message..." 
                  className="add-mem-input font-mono"
                />
                <button onClick={handleBroadcast} className="add-mem-btn font-mono" style={{ backgroundColor: config.primaryColor }}>
                  <Radio className="w-3.5 h-3.5" /> BROADCAST
                </button>
              </div>
              {broadcastStatus && <p className="status-notice">{broadcastStatus}</p>}

              <div className="tools-scroll-grid">
                {smartDevices.map((d) => (
                  <div key={d.id} className="tool-chip-card">
                    <div className="tool-chip-header">
                      <Home className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                      <span className="tool-name">{d.name}</span>
                      <button onClick={() => handleToggleSmart(d.id)} className="mem-del-btn">
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="tool-desc">{d.room} - {d.state.power?.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
