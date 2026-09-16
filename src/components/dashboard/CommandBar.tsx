import React, { useState, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  ChevronUp, 
  ChevronDown, 
  Square, 
  Sparkles, 
  Brain, 
  Search, 
  Compass, 
  Zap, 
  Cpu,
  X,
  Volume2,
  VolumeX,
  MessageSquare
} from 'lucide-react';
import { JarvisState, StateVisualConfig } from '../../types/jarvis';
import { jarvisSpeechService } from '../../services/speechService';

export type IntelligenceMode = 'auto' | 'thinking' | 'deep_research' | 'web_search' | 'fast';

interface CommandBarProps {
  state: JarvisState;
  config: StateVisualConfig;
  onSendMessage: (text: string, mode?: IntelligenceMode, modelOverride?: string) => void;
  onToggleChatDrawer: () => void;
  isChatOpen: boolean;
  isProcessing: boolean;
  onStopExecution?: () => void;
  currentMode: IntelligenceMode;
  onSelectMode: (mode: IntelligenceMode) => void;
  currentModel: string;
  onSelectModel: (model: string) => void;
  onHide?: () => void;
  ttsEnabled?: boolean;
  onToggleTts?: () => void;
  liveTranscript?: string | null;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  state,
  config,
  onSendMessage,
  onToggleChatDrawer,
  isChatOpen,
  isProcessing,
  onStopExecution,
  currentMode,
  onSelectMode,
  currentModel,
  onSelectModel,
  onHide,
  ttsEnabled = true,
  onToggleTts,
  liveTranscript
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isListening = state === 'LISTENING';

  const handleMicClick = () => {
    if (isListening) {
      jarvisSpeechService.stopListening();
    } else {
      jarvisSpeechService.triggerManualListening();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isProcessing) return;

    onSendMessage(trimmed, currentMode, currentModel === 'auto' ? undefined : currentModel);
    setInputText('');
  };

  const modes: Array<{ id: IntelligenceMode; label: string; icon: React.ReactNode; tooltip: string }> = [
    { id: 'auto', label: 'AUTO', icon: <Sparkles className="w-3 h-3" />, tooltip: 'Smart Router: Auto-selects Fast vs Deep Thinking based on difficulty' },
    { id: 'thinking', label: 'THINKING', icon: <Brain className="w-3 h-3" />, tooltip: 'Deep Reasoning: Multi-step chain-of-thought analysis' },
    { id: 'deep_research', label: 'DEEP RESEARCH', icon: <Compass className="w-3 h-3" />, tooltip: 'Deep Research: Multi-source web synthesis & citations' },
    { id: 'web_search', label: 'WEB SEARCH', icon: <Search className="w-3 h-3" />, tooltip: 'Live Web: Real-time search & internet intelligence' },
    { id: 'fast', label: 'FAST', icon: <Zap className="w-3 h-3" />, tooltip: 'Fast Mode: Ultra low-latency instant response' }
  ];

  const models = [
    { id: 'auto', name: '✨ Auto-Select (Smart Router)' },
    { id: 'gemini-3.5-flash', name: '⚡ Gemini 3.5 Flash (Super-Fast)' },
    { id: 'gemini-3.7-flash', name: '🧠 Gemini 3.7 Flash (Deep Reasoning)' },
    { id: 'gemini-3.6-flash', name: '🚀 Gemini 3.6 Flash (Advanced)' },
    { id: 'gemini-3.5-flash-lite', name: '🍃 Gemini 3.5 Flash Lite' },
    { id: 'gemini-3.1-flash-lite', name: '⚡ Gemini 3.1 Flash Lite' },
    { id: 'gemini-3.1-pro-preview', name: '💎 Gemini 3.1 Pro Preview' },
    { id: 'gemini-flash-latest', name: '🔥 Gemini Flash Latest' },
    { id: 'gemini-pro-latest', name: '👑 Gemini Pro Latest' }
  ];

  return (
    <div className="jarvis-bottom-interaction-container">
      {/* 1. Large Futuristic TALK TO JARVIS Central Button */}
      <div className="talk-to-jarvis-wrapper">
        <button
          type="button"
          className={`talk-to-jarvis-btn ${isListening ? 'is-listening' : ''}`}
          onClick={handleMicClick}
          style={{
            borderColor: isListening ? '#10b981' : config.primaryColor,
            boxShadow: isListening 
              ? '0 0 25px rgba(16, 185, 129, 0.45), inset 0 0 15px rgba(16, 185, 129, 0.25)'
              : `0 0 20px ${config.glowColor}, inset 0 0 10px rgba(0, 240, 255, 0.15)`
          }}
          title={isListening ? 'Click to Stop Listening' : 'Click to Talk to JARVIS'}
        >
          {/* Animated pulsing outer rings */}
          <div className="pulse-ring ring-1" style={{ borderColor: isListening ? '#10b981' : config.primaryColor }} />
          <div className="pulse-ring ring-2" style={{ borderColor: isListening ? '#10b981' : config.primaryColor }} />

          <div className="btn-inner-content">
            {isListening ? (
              <MicOff className="w-5 h-5 mic-icon" style={{ color: '#10b981' }} />
            ) : (
              <Mic className="w-5 h-5 mic-icon" style={{ color: config.primaryColor }} />
            )}
            <span className="btn-text font-display">
              {isListening ? 'LISTENING...' : 'TALK TO JARVIS'}
            </span>
          </div>
        </button>
      </div>

      {/* 2. Compact Command Bar & Intelligence Toolbar */}
      <div className="compact-command-bar-wrapper">
        {/* Intelligence Mode & Model Control Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          marginBottom: '6px',
          background: 'rgba(0, 10, 25, 0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 240, 255, 0.18)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
        }}>
          {/* Mode Selection Pills */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', alignItems: 'center' }}>
            {modes.map((m) => {
              const isActive = currentMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMode(m.id)}
                  title={m.tooltip}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    fontSize: '9.5px',
                    fontFamily: 'monospace',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '4px',
                    border: isActive ? `1px solid ${config.primaryColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? config.primaryColor : 'rgba(255, 255, 255, 0.65)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 0 8px rgba(0, 240, 255, 0.35)` : 'none'
                  }}
                >
                  <span style={{ color: isActive ? config.primaryColor : 'rgba(255, 255, 255, 0.4)' }}>
                    {m.icon}
                  </span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Model Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <Cpu className="w-3 h-3" style={{ color: config.primaryColor }} />
            <select
              value={currentModel}
              onChange={(e) => onSelectModel(e.target.value)}
              style={{
                background: 'rgba(0, 20, 40, 0.9)',
                color: config.primaryColor,
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '9.5px',
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '180px'
              }}
              title="Select specific AI model or keep on Auto-Select"
            >
              {models.map((mod) => (
                <option key={mod.id} value={mod.id} style={{ background: '#07101e', color: '#fff' }}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Voice Output (TTS) Toggle Pill */}
          {onToggleTts && (
            <button
              type="button"
              onClick={onToggleTts}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: 700,
                borderRadius: '4px',
                border: ttsEnabled ? `1px solid ${config.primaryColor}` : '1px solid rgba(255, 255, 255, 0.15)',
                background: ttsEnabled ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                color: ttsEnabled ? config.primaryColor : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: ttsEnabled ? '0 0 8px rgba(0, 240, 255, 0.3)' : 'none',
                flexShrink: 0
              }}
              title={ttsEnabled ? 'Voice Output: ACTIVE (JARVIS speaks answers) — Click to Mute' : 'Voice Output: MUTED — Click to Enable Speech'}
            >
              {ttsEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              <span>{ttsEnabled ? 'VOICE ON' : 'VOICE MUTED'}</span>
            </button>
          )}
        </div>

        {/* Live speech feedback pill when user is speaking */}
        {liveTranscript && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-10px)',
            background: 'rgba(3, 10, 24, 0.95)',
            border: '1px solid #00f0ff',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.45), inset 0 0 10px rgba(0, 240, 255, 0.2)',
            borderRadius: '24px',
            padding: '6px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#00f0ff',
            pointerEvents: 'none',
            zIndex: 100,
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              flexShrink: 0
            }} />
            <span style={{ letterSpacing: '0.04em' }}>
              VOICE INPUT: <strong>"{liveTranscript}"</strong>
            </span>
          </div>
        )}

        {/* Input Form */}
        <form className="command-bar-form" onSubmit={handleFormSubmit}>
          {/* Mic quick button */}
          <button
            type="button"
            className={`command-mic-btn ${isListening ? 'active' : ''}`}
            onClick={handleMicClick}
            title={isListening ? 'Stop microphone' : 'Start microphone'}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" style={{ color: '#10b981' }} />
            ) : (
              <Mic className="w-4 h-4" style={{ color: config.primaryColor }} />
            )}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            className="command-text-input font-mono"
            placeholder={
              liveTranscript
                ? `🎙️ "${liveTranscript}..."`
                : isListening
                ? 'Listening to your voice... (speak now)'
                : isProcessing
                ? 'JARVIS is processing...'
                : currentMode === 'thinking'
                ? 'Ask a complex coding, math or logic question [THINKING MODE]...'
                : currentMode === 'deep_research'
                ? 'Enter topic for deep internet investigation [RESEARCH MODE]...'
                : currentMode === 'web_search'
                ? 'Search live real-time web [WEB SEARCH MODE]...'
                : 'Type a command or ask JARVIS anything [AUTO SMART ROUTE]...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
          />

          {/* Stop / Cancel button if processing */}
          {isProcessing && onStopExecution && (
            <button
              type="button"
              className="command-stop-btn font-mono"
              onClick={onStopExecution}
              title="Stop current execution"
            >
              <Square className="w-3.5 h-3.5" />
              <span>STOP</span>
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            className="command-send-btn font-mono"
            disabled={!inputText.trim() || isProcessing}
            style={{
              backgroundColor: inputText.trim() ? config.primaryColor : undefined,
              color: inputText.trim() ? '#030712' : undefined
            }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>SEND</span>
          </button>

          {/* Conversation Drawer Toggle (Click to view JARVIS text) */}
          <button
            type="button"
            className={`command-drawer-toggle-btn font-mono ${isChatOpen ? 'active' : ''}`}
            onClick={onToggleChatDrawer}
            title={isChatOpen ? 'Close Conversation Log' : 'Open Conversation Log (Click here to read JARVIS responses)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0.32rem 0.55rem',
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.06em'
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            <span>{isChatOpen ? 'HIDE LOG' : 'CHAT LOG'}</span>
            {isChatOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Hide Command Bar Cross Button */}
          {onHide && (
            <button
              type="button"
              className="hud-panel-close-btn"
              onClick={onHide}
              title="Hide Command Bar (Cross)"
              aria-label="Hide Command Bar"
              style={{ marginLeft: '4px' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
