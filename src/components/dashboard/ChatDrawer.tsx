import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Terminal, 
  X, 
  Volume2, 
  VolumeX, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  User, 
  ChevronDown,
  Sparkles,
  ExternalLink,
  Brain,
  Compass,
  Search,
  Zap,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { JarvisState, StateVisualConfig, ChatMessage, BackendStatus } from '../../types/jarvis';
import { ExecutionStep } from '../../services/api';
import { MarkdownMessage } from '../common/MarkdownMessage';
import { AgentTaskPanel } from '../hud/AgentTaskPanel';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  state: JarvisState;
  config: StateVisualConfig;
  backendStatus: BackendStatus;
  isProcessing: boolean;
  isTTSSpeaking: boolean;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onStopSpeaking: () => void;
  onStopExecution: () => void;
  executionSteps: ExecutionStep[];
  onOpenSettings: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  state,
  config,
  backendStatus,
  isProcessing,
  isTTSSpeaking,
  ttsEnabled,
  onToggleTts,
  onStopSpeaking,
  onStopExecution,
  executionSteps,
  onOpenSettings
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, 'up' | 'down' | null>>({});

  const handleCopy = useCallback((msgId: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleReaction = useCallback((msgId: string, reaction: 'up' | 'down') => {
    setReactions(prev => ({
      ...prev,
      [msgId]: prev[msgId] === reaction ? null : reaction
    }));
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isProcessing, isTTSSpeaking, executionSteps]);

  if (!isOpen) return null;

  return (
    <div className="jarvis-chat-drawer-overlay">
      <div 
        className="jarvis-chat-drawer"
        style={{ borderColor: `${config.primaryColor}50` }}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <Terminal className="w-4 h-4" style={{ color: config.primaryColor }} />
            <span className="drawer-title font-display">NEURAL CONVERSATION LOG — v3</span>
            <span className="drawer-badge font-mono" style={{ color: config.primaryColor }}>
              {messages.length} ENTRIES
            </span>
          </div>

          <div className="drawer-actions">
            {/* Voice TTS Toggle */}
            <button
              className="drawer-action-btn"
              onClick={onToggleTts}
              title={ttsEnabled ? 'Mute Voice Output' : 'Enable Voice Output'}
              style={{ color: ttsEnabled ? config.primaryColor : '#64748b' }}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="action-txt font-mono">{ttsEnabled ? 'VOICE ON' : 'VOICE MUTED'}</span>
            </button>

            {/* Stop Execution / Speech Button */}
            {(isProcessing || isTTSSpeaking) && (
              <button
                className="drawer-action-btn stop-btn font-mono"
                onClick={isTTSSpeaking ? onStopSpeaking : onStopExecution}
                title="Halt active operation (ESC)"
              >
                <Square className="w-3.5 h-3.5" />
                <span>{isTTSSpeaking ? 'HALT SPEECH' : 'HALT TASK'}</span>
              </button>
            )}

            <button
              className="drawer-action-btn close-btn"
              onClick={onClose}
              title="Close Console Panel (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Active Task / Execution Steps Panel */}
        {executionSteps && executionSteps.length > 0 && (
          <div className="drawer-task-section">
            <AgentTaskPanel
              primaryColor={config.primaryColor}
            />
          </div>
        )}

        {/* Messages Log Container */}
        <div className="drawer-messages-body">
          {messages.map((msg) => {
            const isJarvis = msg.sender === 'JARVIS';

            return (
              <div 
                key={msg.id} 
                className={`drawer-msg-item ${isJarvis ? 'msg-jarvis' : 'msg-user'} ${msg.isError ? 'msg-error' : ''}`}
              >
                <div className="msg-avatar" style={{ borderColor: isJarvis ? config.primaryColor : 'rgba(255,255,255,0.3)' }}>
                  {isJarvis ? (
                    <Bot className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  ) : (
                    <User className="w-3.5 h-3.5" style={{ color: '#e2e8f0' }} />
                  )}
                </div>

                <div className="msg-payload">
                  <div className="msg-header font-mono">
                    <span className="msg-sender" style={{ color: isJarvis ? config.primaryColor : '#cbd5e1' }}>
                      {msg.sender}
                    </span>

                    {/* Model & Routing Badge for JARVIS */}
                    {isJarvis && (msg.model_used || msg.mode_used) && (
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: msg.mode_used === 'THINKING' 
                          ? 'rgba(168, 85, 247, 0.18)' 
                          : msg.mode_used === 'DEEP_RESEARCH'
                          ? 'rgba(234, 179, 8, 0.18)'
                          : msg.mode_used === 'WEB_SEARCH'
                          ? 'rgba(59, 130, 246, 0.18)'
                          : 'rgba(0, 240, 255, 0.12)',
                        border: `1px solid ${
                          msg.mode_used === 'THINKING' 
                            ? 'rgba(168, 85, 247, 0.35)' 
                            : msg.mode_used === 'DEEP_RESEARCH'
                            ? 'rgba(234, 179, 8, 0.35)'
                            : msg.mode_used === 'WEB_SEARCH'
                            ? 'rgba(59, 130, 246, 0.35)'
                            : 'rgba(0, 240, 255, 0.25)'
                        }`,
                        color: msg.mode_used === 'THINKING' 
                          ? '#c084fc' 
                          : msg.mode_used === 'DEEP_RESEARCH'
                          ? '#facc15'
                          : msg.mode_used === 'WEB_SEARCH'
                          ? '#60a5fa'
                          : config.primaryColor,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        marginLeft: '6px'
                      }} title={msg.route_reason || ''}>
                        {msg.mode_used === 'THINKING' && <Brain className="w-2.5 h-2.5" />}
                        {msg.mode_used === 'DEEP_RESEARCH' && <Compass className="w-2.5 h-2.5" />}
                        {msg.mode_used === 'WEB_SEARCH' && <Search className="w-2.5 h-2.5" />}
                        {msg.mode_used === 'FAST' && <Zap className="w-2.5 h-2.5" />}
                        <span>{msg.model_used || msg.mode_used}</span>
                      </span>
                    )}

                    <span className="msg-timestamp">{msg.timestamp}</span>
                  </div>

                  <div className="msg-markdown-wrapper" style={{ marginTop: '4px' }}>
                    <MarkdownMessage
                      content={msg.text}
                      primaryColor={config.primaryColor}
                      isUser={!isJarvis}
                    />
                  </div>

                  {/* V2: Copy + Reaction Buttons (Available for both User and JARVIS messages) */}
                  <div style={{ display: 'flex', gap: '5px', marginTop: '6px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      title="Copy message text"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '3px',
                        padding: '2px 7px', borderRadius: '4px',
                        background: copiedId === msg.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${copiedId === msg.id ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: copiedId === msg.id ? '#10b981' : isJarvis ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)',
                        fontFamily: 'monospace', fontSize: '9px', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {copiedId === msg.id ? <Check size={10} /> : <Copy size={10} />}
                      {copiedId === msg.id ? 'COPIED' : 'COPY'}
                    </button>

                    {isJarvis && (
                      <>
                        <button
                          onClick={() => handleReaction(msg.id, 'up')}
                          title="Good response"
                          style={{
                            padding: '2px 6px', borderRadius: '4px',
                            background: reactions[msg.id] === 'up' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${reactions[msg.id] === 'up' ? '#10b98150' : 'rgba(255,255,255,0.07)'}`,
                            color: reactions[msg.id] === 'up' ? '#10b981' : 'rgba(255,255,255,0.3)',
                            cursor: 'pointer', fontSize: '10px'
                          }}
                        >
                          <ThumbsUp size={10} />
                        </button>
                        <button
                          onClick={() => handleReaction(msg.id, 'down')}
                          title="Poor response"
                          style={{
                            padding: '2px 6px', borderRadius: '4px',
                            background: reactions[msg.id] === 'down' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${reactions[msg.id] === 'down' ? '#ef444450' : 'rgba(255,255,255,0.07)'}`,
                            color: reactions[msg.id] === 'down' ? '#ef4444' : 'rgba(255,255,255,0.3)',
                            cursor: 'pointer', fontSize: '10px'
                          }}
                        >
                          <ThumbsDown size={10} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Research / Web Sources Cards */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      borderRadius: '5px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{
                        fontSize: '9.5px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontWeight: 700,
                        marginBottom: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Compass className="w-3 h-3" style={{ color: config.primaryColor }} />
                        VERIFIED SOURCES &amp; CITATIONS ({msg.sources.length}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {msg.sources.slice(0, 5).map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '9px',
                              color: '#93c5fd',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '3px 6px',
                              borderRadius: '3px',
                              border: '1px solid rgba(255, 255, 255, 0.04)'
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                              [{i + 1}] {src.title || src.url}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5" style={{ flexShrink: 0 }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking animation in drawer */}
          {isProcessing && (
            <div className="drawer-msg-item msg-jarvis msg-loading">
              <div className="msg-avatar" style={{ borderColor: config.primaryColor }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
              </div>
              <div className="msg-payload">
                <div className="msg-header font-mono">
                  <span className="msg-sender" style={{ color: config.primaryColor }}>JARVIS</span>
                  <span className="msg-timestamp">PROCESSING...</span>
                </div>
                <div className="msg-loading-dots">
                  <span className="dot" style={{ backgroundColor: config.primaryColor }} />
                  <span className="dot" style={{ backgroundColor: config.primaryColor }} />
                  <span className="dot" style={{ backgroundColor: config.primaryColor }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Drawer Footer Status */}
        <div className="drawer-footer font-mono">
          <span className="footer-status-pill" style={{ color: backendStatus === 'ONLINE' ? config.primaryColor : '#ef4444' }}>
            ● BACKEND: {backendStatus}
          </span>
          <span className="footer-tip">
            TIP: Press <strong>ESC</strong> to stop speech or task execution at any time.
          </span>
        </div>
      </div>
    </div>
  );
};
