import React, { useState, useEffect } from 'react';
import {
  Activity, Power, Pause, Play, Volume2, Clock, Trash2,
  Calendar, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw,
  Search, HardDrive, FileAudio, Eye, ChevronRight, Mic, Sparkles, Database
} from 'lucide-react';
import {
  AmbientConfigRecord,
  AmbientMemoryItemRecord,
  AmbientStatusRecord,
  fetchAmbientStatusApi,
  updateAmbientConfigApi,
  startAmbientPipelineApi,
  pauseAmbientPipelineApi,
  resumeAmbientPipelineApi,
  stopAmbientPipelineApi,
  fetchAmbientMemoriesApi,
  deleteAmbientMemoryApi,
  deleteAmbientMemoriesRangeApi,
  clearAllAmbientMemoriesApi
} from '../../services/api';

interface AmbientMemorySectionProps {
  primaryColor: string;
}

export const AmbientMemorySection: React.FC<AmbientMemorySectionProps> = ({ primaryColor }) => {
  const [ambientStatus, setAmbientStatus] = useState<AmbientStatusRecord | null>(null);
  const [memories, setMemories] = useState<AmbientMemoryItemRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Range Deletion State
  const [rangeDate, setRangeDate] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [showRangeModal, setShowRangeModal] = useState(false);

  // Clear All Confirmation Modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const status = await fetchAmbientStatusApi();
      setAmbientStatus(status);

      const memsRes = await fetchAmbientMemoriesApi({
        search: searchQuery || undefined,
        date: dateFilter || undefined,
        limit: 50
      });
      setMemories(memsRes.memories || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load ambient memory status' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, dateFilter]);

  // Periodic status poll if active to update real-time visualizer
  useEffect(() => {
    if (ambientStatus?.config?.enabled && !ambientStatus?.config?.paused) {
      const interval = setInterval(async () => {
        try {
          const status = await fetchAmbientStatusApi();
          setAmbientStatus(status);
        } catch {
          // Silent interval poll
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [ambientStatus?.config?.enabled, ambientStatus?.config?.paused]);

  const handleToggleEnabled = async () => {
    if (!ambientStatus) return;
    try {
      setActionLoading(true);
      const newEnabled = !ambientStatus.config.enabled;
      if (newEnabled) {
        await startAmbientPipelineApi();
        setMessage({ type: 'success', text: 'Ambient Memory activated. Listening via microphone in background.' });
      } else {
        await stopAmbientPipelineApi();
        setMessage({ type: 'success', text: 'Ambient Memory deactivated.' });
      }
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to toggle ambient state' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async () => {
    if (!ambientStatus) return;
    try {
      setActionLoading(true);
      const newPaused = !ambientStatus.config.paused;
      if (newPaused) {
        await pauseAmbientPipelineApi();
        setMessage({ type: 'success', text: 'Ambient Memory paused. Audio capture is suspended.' });
      } else {
        await resumeAmbientPipelineApi();
        setMessage({ type: 'success', text: 'Ambient Memory resumed. Active listening restored.' });
      }
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to toggle pause state' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSaveAudio = async () => {
    if (!ambientStatus) return;
    try {
      setActionLoading(true);
      const newSaveAudio = !ambientStatus.config.save_audio;
      await updateAmbientConfigApi({ save_audio: newSaveAudio });
      setMessage({
        type: 'success',
        text: newSaveAudio ? 'Audio saving enabled (WAV snippets stored).' : 'Audio saving disabled (Transcripts only).'
      });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update audio save setting' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetRetention = async (days: number) => {
    try {
      setActionLoading(true);
      await updateAmbientConfigApi({ retention_days: days });
      setMessage({ type: 'success', text: `Retention policy set to ${days === 0 ? 'Forever' : `${days} Days`}.` });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update retention policy' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      setActionLoading(true);
      await deleteAmbientMemoryApi(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      setMessage({ type: 'success', text: 'Ambient memory record deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete record' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRange = async () => {
    if (!rangeDate || !rangeStart || !rangeEnd) {
      setMessage({ type: 'error', text: 'Please specify Date, Start Time and End Time.' });
      return;
    }
    try {
      setActionLoading(true);
      const res = await deleteAmbientMemoriesRangeApi(rangeDate, rangeStart, rangeEnd);
      setShowRangeModal(false);
      setMessage({ type: 'success', text: res.message || 'Records in time range deleted.' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete range' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setActionLoading(true);
      const res = await clearAllAmbientMemoriesApi();
      setShowClearConfirm(false);
      setMessage({ type: 'success', text: res.message || 'All ambient memories cleared.' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to clear all memories' });
    } finally {
      setActionLoading(false);
    }
  };

  const currentState = ambientStatus?.pipeline?.current_state || (ambientStatus?.config?.enabled ? 'LISTENING' : 'OFF');

  const getStateColor = () => {
    switch (currentState) {
      case 'LISTENING': return '#10e890';
      case 'PROCESSING': return '#00e8ff';
      case 'PAUSED': return '#f5a524';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Section Title ── */}
      <div className="settings-section-header">
        <Activity size={15} style={{ color: primaryColor }} />
        <span>AMBIENT AUDITORY MEMORY &amp; REAL-TIME RECALL</span>
      </div>

      {/* ── Status & Active Telemetry Card ── */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(4, 16, 38, 0.8) 0%, rgba(2, 8, 20, 0.9) 100%)',
        border: `1px solid ${getStateColor()}40`,
        borderRadius: '10px',
        boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${getStateColor()}15`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Animated Core Orb */}
          <div style={{
            position: 'relative',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: getStateColor(),
            boxShadow: `0 0 10px ${getStateColor()}, 0 0 20px ${getStateColor()}80`,
            flexShrink: 0,
          }}>
            {currentState === 'LISTENING' && (
              <span style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: `1.5px solid ${getStateColor()}`,
                animation: 'v3Pulse 1.5s infinite',
              }} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#b8d4e0',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                CURRENT STATE:
              </span>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.78rem',
                fontWeight: 800,
                color: getStateColor(),
                background: `${getStateColor()}18`,
                border: `1px solid ${getStateColor()}50`,
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.10em',
                boxShadow: `0 0 8px ${getStateColor()}30`,
              }}>
                {currentState}
              </span>
            </div>
            <p style={{
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              fontSize: '0.80rem',
              color: '#8da6bd',
              marginTop: '3px',
              lineHeight: 1.4,
            }}>
              {currentState === 'LISTENING' && 'Microphone VAD actively listening for speech segments in background.'}
              {currentState === 'PROCESSING' && 'Speech-to-Text worker is transcribing recorded auditory episode.'}
              {currentState === 'PAUSED' && 'Ambient memory is temporarily paused. Audio capture is suspended.'}
              {currentState === 'OFF' && 'Ambient memory is disabled. Normal JARVIS voice features operate as usual.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {ambientStatus?.config?.enabled && (
            <button
              onClick={handleTogglePause}
              disabled={actionLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: ambientStatus.config.paused ? '1px solid rgba(16, 232, 144, 0.5)' : '1px solid rgba(245, 165, 36, 0.5)',
                background: ambientStatus.config.paused ? 'rgba(16, 232, 144, 0.15)' : 'rgba(245, 165, 36, 0.15)',
                color: ambientStatus.config.paused ? '#10e890' : '#f5a524',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {ambientStatus.config.paused ? <Play size={13} /> : <Pause size={13} />}
              {ambientStatus.config.paused ? 'Resume' : 'Pause'}
            </button>
          )}

          <button
            onClick={handleToggleEnabled}
            disabled={actionLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '8px',
              border: ambientStatus?.config?.enabled ? '1px solid rgba(255, 64, 96, 0.5)' : '1px solid rgba(0, 232, 255, 0.5)',
              background: ambientStatus?.config?.enabled ? 'rgba(255, 64, 96, 0.18)' : 'rgba(0, 232, 255, 0.18)',
              color: ambientStatus?.config?.enabled ? '#ff4060' : '#00e8ff',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: ambientStatus?.config?.enabled ? '0 0 14px rgba(255, 64, 96, 0.3)' : '0 0 14px rgba(0, 232, 255, 0.3)',
              transition: 'all 0.18s ease',
            }}
          >
            <Power size={13} />
            {ambientStatus?.config?.enabled ? 'Turn OFF' : 'Turn ON'}
          </button>
        </div>
      </div>

      {/* ── Status Toast ── */}
      {message && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: message.type === 'success' ? 'rgba(16, 232, 144, 0.10)' : 'rgba(255, 64, 96, 0.10)',
          border: message.type === 'success' ? '1px solid rgba(16, 232, 144, 0.35)' : '1px solid rgba(255, 64, 96, 0.35)',
          color: message.type === 'success' ? '#10e890' : '#ff4060',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.80rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}>
            &times;
          </button>
        </div>
      )}

      {/* ── Core Configuration Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        
        {/* 1. Audio Snippet Preservation */}
        <div className="setting-group">
          <div className="setting-label-row">
            <label className="setting-label">
              <FileAudio size={13} style={{ color: primaryColor }} />
              <span>SAVE ORIGINAL AUDIO</span>
            </label>
            <button
              type="button"
              className={`toggle-switch-btn ${ambientStatus?.config?.save_audio ? 'is-on' : 'is-off'}`}
              onClick={handleToggleSaveAudio}
              disabled={actionLoading}
            >
              {ambientStatus?.config?.save_audio ? 'ON' : 'OFF'}
            </button>
          </div>
          <span className="setting-hint">
            {ambientStatus?.config?.save_audio
              ? 'Storing 16kHz speech WAV audio snippets on disk alongside timestamped transcripts.'
              : 'Audio snippets discarded. Only transcripts, confidence, and timestamps are saved locally.'}
          </span>
        </div>

        {/* 2. Retention Policy */}
        <div className="setting-group">
          <label className="setting-label">
            <Clock size={13} style={{ color: primaryColor }} />
            <span>RETENTION DURATION</span>
          </label>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
            {[
              { label: '1 Day', days: 1 },
              { label: '7 Days', days: 7 },
              { label: '30 Days', days: 30 },
              { label: 'Forever', days: 0 }
            ].map(r => {
              const isSelected = ambientStatus?.config?.retention_days === r.days;
              return (
                <button
                  key={r.days}
                  onClick={() => handleSetRetention(r.days)}
                  disabled={actionLoading}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: isSelected ? `1px solid ${primaryColor}` : '1px solid rgba(0, 232, 255, 0.18)',
                    background: isSelected ? `${primaryColor}22` : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? primaryColor : '#b8d4e0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 10px ${primaryColor}40` : 'none',
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <span className="setting-hint">
            Records older than {ambientStatus?.config?.retention_days === 0 ? 'Forever (no auto-purge)' : `${ambientStatus?.config?.retention_days} days`} are scheduled for local cleanup.
          </span>
        </div>
      </div>

      {/* ── Memory Management & Transcript Browser Card ── */}
      <div className="setting-group" style={{ padding: '16px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <label className="setting-label">
            <HardDrive size={13} style={{ color: primaryColor }} />
            <span>STORED EPISODES ({ambientStatus?.stats?.total_records || memories.length})</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowRangeModal(true)}
              className="sci-fi-btn"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <Calendar size={12} style={{ color: '#f5a524' }} />
              <span>DELETE RANGE</span>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="sci-fi-btn"
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(255, 64, 96, 0.4)', color: '#ff4060' }}
            >
              <Trash2 size={12} />
              <span>CLEAR ALL</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8da6bd' }} />
            <input
              type="text"
              placeholder="Search transcript keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="sci-fi-input"
              style={{ paddingLeft: '30px' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Calendar size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8da6bd' }} />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="sci-fi-input"
              style={{ paddingLeft: '30px' }}
            />
          </div>
        </div>

        {/* Memories Episodes List */}
        <div style={{
          maxHeight: '260px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px',
        }}>
          {loading && memories.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8da6bd', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem' }}>
              <RefreshCw size={16} style={{ animation: 'v3Spin 1s linear infinite', color: primaryColor, marginBottom: '6px' }} />
              <div>Loading ambient records...</div>
            </div>
          ) : memories.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#8da6bd',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.82rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '6px',
              border: '1px dashed rgba(0, 232, 255, 0.12)',
            }}>
              No ambient memory records found for this filter.
            </div>
          ) : (
            memories.map(m => (
              <div
                key={m.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(2, 8, 20, 0.75)',
                  border: '1px solid rgba(0, 232, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0, 232, 255, 0.35)';
                  e.currentTarget.style.background = 'rgba(4, 14, 34, 0.9)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(0, 232, 255, 0.12)';
                  e.currentTarget.style.background = 'rgba(2, 8, 20, 0.75)';
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: "'Rajdhani', monospace", fontSize: '0.75rem', fontWeight: 700, color: '#00e8ff' }}>
                      {m.date}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ fontFamily: "'Rajdhani', monospace", fontSize: '0.75rem', color: '#b8d4e0' }}>
                      {m.start_time} → {m.end_time}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.70rem', fontWeight: 700, color: '#10e890', textTransform: 'uppercase' }}>
                      {m.language}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                    fontSize: '0.84rem',
                    color: '#edfcff',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}>
                    {m.transcript}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteOne(m.id)}
                  title="Delete memory record"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8da6bd',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff4060'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8da6bd'}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Modal: Delete By Date & Time Range ── */}
      {showRangeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 600,
          background: 'rgba(1, 5, 16, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(4, 14, 38, 0.98) 0%, rgba(2, 8, 24, 0.99) 100%)',
            border: '1px solid rgba(0, 232, 255, 0.35)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 30px rgba(0, 232, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.92rem', fontWeight: 700, color: '#00e8ff', textTransform: 'uppercase' }}>
                DELETE TIME RANGE
              </span>
              <button onClick={() => setShowRangeModal(false)} style={{ background: 'none', border: 'none', color: '#8da6bd', fontSize: '1.2rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.80rem', color: '#8da6bd' }}>
              Permanently delete all ambient conversations recorded within the specified time window.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', color: '#b8d4e0', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  DATE (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={rangeDate}
                  onChange={e => setRangeDate(e.target.value)}
                  className="sci-fi-input"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', color: '#b8d4e0', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    START TIME
                  </label>
                  <input
                    type="text"
                    placeholder="14:00:00"
                    value={rangeStart}
                    onChange={e => setRangeStart(e.target.value)}
                    className="sci-fi-input"
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', color: '#b8d4e0', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    END TIME
                  </label>
                  <input
                    type="text"
                    placeholder="15:00:00"
                    value={rangeEnd}
                    onChange={e => setRangeEnd(e.target.value)}
                    className="sci-fi-input"
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => setShowRangeModal(false)}
                className="sci-fi-btn"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteRange}
                disabled={actionLoading}
                className="btn-v3-danger"
                style={{ padding: '5px 14px', borderRadius: '6px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.78rem', fontWeight: 700 }}
              >
                DELETE RANGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Clear All Confirmation ── */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 600,
          background: 'rgba(1, 5, 16, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(30, 4, 14, 0.98) 0%, rgba(14, 2, 8, 0.99) 100%)',
            border: '1px solid rgba(255, 64, 96, 0.45)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 35px rgba(255, 64, 96, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4060' }}>
              <ShieldAlert size={18} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase' }}>
                CONFIRM FULL DATA PURGE
              </span>
            </div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.45 }}>
              Are you sure you want to delete <strong style={{ color: '#ff4060' }}>ALL Ambient Memory records</strong>? This action is permanent and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="sci-fi-btn"
              >
                CANCEL
              </button>
              <button
                onClick={handleClearAll}
                disabled={actionLoading}
                className="btn-v3-danger"
                style={{ padding: '6px 16px', borderRadius: '6px', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.80rem', fontWeight: 800 }}
              >
                PERMANENTLY DELETE ALL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
