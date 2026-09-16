import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { JarvisState, StateVisualConfig, ChatMessage, BackendStatus } from '../../types/jarvis';
import { sendChatMessage, stopAgentExecution, ExecutionStep } from '../../services/api';
import { jarvisSpeechService, VoiceSystemStatus } from '../../services/speechService';
import { jarvisTTSService } from '../../services/ttsService';
import { MicrophoneButton } from './MicrophoneButton';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { ExecutingActivityCard } from './ExecutingActivityCard';
import { AgentTaskPanel } from './AgentTaskPanel';
import { VoiceSettings, loadVoiceSettings, saveVoiceSettings } from '../../services/voiceSettings';
import { logIntelligenceEvent } from '../../state/jarvisState';
import { MarkdownMessage } from '../common/MarkdownMessage';

interface ChatPanelProps {
  state: JarvisState;
  config: StateVisualConfig;
  backendStatus: BackendStatus;
  isConfigured: boolean;
  onStateChange: (state: JarvisState) => void;
  onLiveAudioFrequencies?: (frequencies: number[]) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-0',
    sender: 'JARVIS',
    text: 'Good day, sir. All PC control subroutines online. Type a command or say "Jarvis" to activate voice control.',
    timestamp: '00:00:01'
  }
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  state,
  config,
  backendStatus,
  isConfigured,
  onStateChange,
  onLiveAudioFrequencies
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceSystemStatus>('IDLE');
  const [ttsEnabled, setTtsEnabled] = useState(() => loadVoiceSettings().ttsEnabled);
  const [ttsStatusMsg, setTtsStatusMsg] = useState<string | null>(null);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback((msgId: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const speakingMsgIdRef = useRef<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, isTTSSpeaking, executionSteps]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      jarvisSpeechService.stopAll();
      jarvisTTSService.stop();
    };
  }, []);

  /**
   * CENTRAL AI RESPONSE HANDLER
   */
  const handleAIResponse = useCallback((replyText: string, isError = false, steps?: ExecutionStep[], intent?: string) => {
    const msgId = `jarvis-${Date.now()}`;
    const jarvisMsg: ChatMessage = {
      id: msgId,
      sender: 'JARVIS',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      isError,
      intent,
      steps
    };

    setMessages((prev) => [...prev, jarvisMsg]);
    speakingMsgIdRef.current = msgId;

    const settings = loadVoiceSettings();

    if (isError || !settings.ttsEnabled) {
      onStateChange(isError ? 'ERROR' : 'IDLE');
      if (isError) {
        setTimeout(() => onStateChange('IDLE'), 3500);
      }
      return;
    }

    // Transition to SPEAKING state and start TTS
    onStateChange('SPEAKING');
    setIsTTSSpeaking(true);
    setTtsStatusMsg(null);

    // KEY FIX: Notify speech service that TTS is playing so it pauses recognition
    jarvisSpeechService.notifyTTSState(true);

    jarvisTTSService.speak(replyText, {
      onStart: () => {
        setIsTTSSpeaking(true);
        onStateChange('SPEAKING');
      },
      onFrequencies: (frequencies) => {
        if (onLiveAudioFrequencies) {
          onLiveAudioFrequencies(frequencies);
        }
      },
      onEnd: () => {
        setIsTTSSpeaking(false);
        speakingMsgIdRef.current = null;
        onStateChange('IDLE');
        // KEY FIX: Tell recognition to resume now that TTS is done
        jarvisSpeechService.notifyTTSState(false);
      },
      onError: (errMsg) => {
        console.warn('[ChatPanel] TTS error:', errMsg);
        setTtsStatusMsg(errMsg);
        setIsTTSSpeaking(false);
        onStateChange('IDLE');
      }
    }).catch((err) => {
      console.error('[ChatPanel] TTS speak() promise rejected:', err);
      setIsTTSSpeaking(false);
      onStateChange('IDLE');
    });
  }, [onStateChange, onLiveAudioFrequencies]);

  /**
   * UNIFIED MESSAGE SENDER — used for both typed AND voice input.
   */
  const processAndSendMessage = useCallback(async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    // Check immediate local stop command
    const lower = trimmed.toLowerCase();
    if (lower === 'stop' || lower === 'stop jarvis' || lower === 'stop speaking' || lower === 'cancel') {
      stopAgentExecution('default');
      if (jarvisTTSService.isSpeaking()) {
        jarvisTTSService.stop();
        setIsTTSSpeaking(false);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsProcessing(false);
      setExecutionSteps([]);
      onStateChange('IDLE');
      setMessages((prev) => [...prev, {
        id: `user-${Date.now()}`,
        sender: 'USER',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }, {
        id: `jarvis-${Date.now()}`,
        sender: 'JARVIS',
        text: 'Task stopped. All operations have been halted.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      }]);
      logIntelligenceEvent('SYSTEM', 'User halt override executed', 'warning');
      return;
    }

    // Stop any ongoing speech before processing new command
    if (jarvisTTSService.isSpeaking()) {
      jarvisTTSService.stop();
      setIsTTSSpeaking(false);
    }

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: trimmed,
      timestamp
    };

    setMessages((prev) => [...prev, userMsg]);
    logIntelligenceEvent('AI', `User command: "${trimmed.slice(0, 50)}${trimmed.length > 50 ? '...' : ''}"`, 'info');
    setInputText('');
    setIsProcessing(true);
    setExecutionSteps([]);
    onStateChange('THINKING');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    console.log('[AI] request started');
    try {
      const res = await sendChatMessage(trimmed, 'default', abortController.signal);
      console.log('[AI] response received');
      setIsProcessing(false);
      abortControllerRef.current = null;

      // If tools were executed, show EXECUTING state and activity card
      if (res.steps && res.steps.length > 0) {
        setExecutionSteps(res.steps);
        onStateChange('EXECUTING');
        // Log tool execution event stream
        for (const st of res.steps) {
          const statusLevel = st.status === 'completed' ? 'success' : (st.status === 'failed' ? 'error' : 'warning');
          const statusText = st.status === 'completed' ? 'SUCCESS' : (st.status === 'failed' ? 'FAILED' : st.status.toUpperCase());
          logIntelligenceEvent('AGENT', `TOOL ${st.tool || st.title} ${statusText} // ${st.message || st.title}`, statusLevel);
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      // Route response through central handler (triggers TTS and chat display)
      handleAIResponse(res.reply, res.status === 'error', res.steps, res.intent);

    } catch (err: unknown) {
      setIsProcessing(false);
      abortControllerRef.current = null;
      setExecutionSteps([]);

      if (err instanceof Error && err.message === 'ABORTED') {
        setMessages((prev) => [...prev, {
          id: `jarvis-abort-${Date.now()}`,
          sender: 'JARVIS',
          text: '[Request canceled by user override]',
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);
        onStateChange('IDLE');
        return;
      }

      const errorMessage = backendStatus === 'OFFLINE'
        ? 'Backend offline. Start the Python server: cd backend && py -m backend.main'
        : 'Neural core communication error. Check backend/.env configuration.';

      handleAIResponse(errorMessage, true);
    }
  }, [backendStatus, onStateChange, handleAIResponse]);

  // Initialize voice input — runs ONCE only (no state/processAndSendMessage in deps)
  // Using refs to avoid stale closures while keeping the effect stable.
  const processAndSendMessageRef = useRef(processAndSendMessage);
  useEffect(() => { processAndSendMessageRef.current = processAndSendMessage; });
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; });

  useEffect(() => {
    jarvisSpeechService.setCallbacks({
      onStatusChange: (status) => {
        setVoiceStatus(status);
        if (status === 'ACTIVE_LISTENING') {
          onStateChangeRef.current('LISTENING');
        } else if (status === 'WAKE_LISTENING') {
          // Only go back to IDLE if we were in LISTENING (not if EXECUTING/THINKING)
          setVoiceStatus('WAKE_LISTENING');
        }
      },
      onWakeWordDetected: () => {
        onStateChangeRef.current('LISTENING');
      },
      // onAckRequested: JARVIS says "Yes?" without going through the full AI pipeline
      onAckRequested: (phrase: string) => {
        const msgId = `jarvis-ack-${Date.now()}`;
        setMessages((prev) => [...prev, {
          id: msgId,
          sender: 'JARVIS',
          text: phrase,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);
        // Speak the acknowledgment through TTS
        const settings = loadVoiceSettings();
        if (settings.ttsEnabled) {
          jarvisSpeechService.notifyTTSState(true);
          jarvisTTSService.speak(phrase, {
            onEnd: () => {
              jarvisSpeechService.notifyTTSState(false);
            }
          });
        }
      },
      onCommandRecognized: (command) => {
        const lower = command.toLowerCase().trim();
        if (lower === 'stop' || lower === 'stop jarvis' || lower === 'stop speaking') {
          handleStopSpeaking();
          return;
        }
        processAndSendMessageRef.current(command);
      },
      onAudioLevel: (frequencies) => {
        if (onLiveAudioFrequencies) {
          onLiveAudioFrequencies(frequencies);
        }
      },
      onError: (errMsg) => {
        setMessages((prev) => [...prev, {
          id: `voice-err-${Date.now()}`,
          sender: 'JARVIS',
          text: `[Voice Receptor: ${errMsg}]`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          isError: true
        }]);
      }
    });

    const settings = loadVoiceSettings();
    if (settings.wakeWordEnabled) {
      jarvisSpeechService.start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Empty deps: runs ONCE on mount only. Callbacks use refs.

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        if (isTTSSpeaking) {
          handleStopSpeaking();
        } else if (state === 'LISTENING') {
          jarvisSpeechService.stopListening();
          onStateChange('IDLE');
        } else {
          jarvisSpeechService.triggerManualListening();
        }
      } else if (e.key === 'Escape') {
        if (isTTSSpeaking) {
          handleStopSpeaking();
        } else if (isProcessing || state === 'EXECUTING') {
          handleStopGeneration();
        } else if (state === 'LISTENING') {
          jarvisSpeechService.stopListening();
          onStateChange('IDLE');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [state, onStateChange, isTTSSpeaking, isProcessing]);

  // Keep ttsEnabled in sync with settings
  useEffect(() => {
    const settings = loadVoiceSettings();
    setTtsEnabled(settings.ttsEnabled);
  }, [isVoiceModalOpen]);

  const handleStopSpeaking = () => {
    stopAgentExecution('default');
    jarvisTTSService.stop();
    // Notify speech service so it can resume recognition
    jarvisSpeechService.notifyTTSState(false);
    setIsTTSSpeaking(false);
    speakingMsgIdRef.current = null;
    setExecutionSteps([]);
    onStateChange('IDLE');
  };

  const handleStopGeneration = () => {
    stopAgentExecution('default');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setExecutionSteps([]);
    onStateChange('IDLE');
  };

  const handleManualMicToggle = () => {
    if (isTTSSpeaking) {
      handleStopSpeaking();
    } else if (state === 'LISTENING') {
      jarvisSpeechService.stopListening();
      onStateChange('IDLE');
    } else {
      jarvisSpeechService.triggerManualListening();
    }
  };

  const handleSettingsSaved = (newSettings: VoiceSettings) => {
    setTtsEnabled(newSettings.ttsEnabled);
    jarvisSpeechService.updateSettings(newSettings);
    if (newSettings.wakeWordEnabled) {
      jarvisSpeechService.start();
    } else {
      jarvisSpeechService.stopAll();
    }
    if (!newSettings.ttsEnabled && isTTSSpeaking) {
      handleStopSpeaking();
    }
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    processAndSendMessage(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const isListeningNow = state === 'LISTENING' || voiceStatus === 'ACTIVE_LISTENING';
  const showStopBtn = isProcessing || isTTSSpeaking || state === 'EXECUTING';

  return (
    <>
      <div className={`hud-chat-panel ${isCollapsed ? 'is-collapsed' : ''}`}>
        {/* Chat Header */}
        <div className="chat-panel-header">
          <div className="chat-title-group">
            <span className="chat-blinker" style={{ backgroundColor: config.primaryColor }} />
            <span className="chat-panel-title">COMMAND TERMINAL</span>
            <span
              className="status-badge-pill online font-mono"
              title={isConfigured ? 'Multi-Provider AI Neural Core Active (Gemini, Groq, Claude, OpenAI, OpenRouter)' : 'Zero-Key Dynamic Intelligence Active'}
              style={{ cursor: 'pointer' }}
              onClick={() => setIsVoiceModalOpen(true)}
            >
              ● {backendStatus} {isConfigured ? '⚡ AI NEURAL' : '🌐 DYNAMIC AI'} [{state}]
            </span>

          </div>

          <div className="chat-header-actions">
            {/* TTS quick toggle */}
            <button
              className="chat-action-icon-btn"
              onClick={() => {
                const settings = loadVoiceSettings();
                const newEnabled = !settings.ttsEnabled;
                saveVoiceSettings({ ...settings, ttsEnabled: newEnabled });
                setTtsEnabled(newEnabled);
                if (!newEnabled && isTTSSpeaking) handleStopSpeaking();
              }}
              title={ttsEnabled ? 'Voice output ON — Click to mute' : 'Voice output OFF — Click to enable'}
            >
              {ttsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            <button
              className="chat-action-icon-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              title="Voice & Settings"
            >
              <Settings size={13} />
            </button>
            <button
              className="chat-toggle-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? 'TERMINAL [ ▲ ]' : 'HIDE [ ▼ ]'}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="chat-panel-body">
            {/* Phase 12 Autonomous Task Engine HUD Panel */}
            <AgentTaskPanel primaryColor={config.primaryColor} />

            {/* Dynamic HUD Activity Card during agent execution */}
            {executionSteps.length > 0 && (
              <ExecutingActivityCard
                steps={executionSteps}
                primaryColor={config.primaryColor}
                isExecuting={state === 'EXECUTING' || isProcessing}
                onCancel={handleStopGeneration}
              />
            )}

            <div className="chat-messages-scroll font-mono">
              {messages.map((msg) => {
                const isUser = msg.sender === 'USER';
                const isCurrentlySpeakingMsg = speakingMsgIdRef.current === msg.id && isTTSSpeaking;
                return (
                  <div
                    key={msg.id}
                    className={`chat-message-row ${isUser ? 'msg-user' : 'msg-jarvis'} ${msg.isError ? 'msg-error' : ''} ${isCurrentlySpeakingMsg ? 'msg-speaking-now' : ''}`}
                  >
                    <div className="msg-meta">
                      <span
                        className="msg-sender"
                        style={{ color: isUser ? '#ffffff' : (msg.isError ? '#ef4444' : config.primaryColor) }}
                      >
                        {isUser ? 'USER' : 'JARVIS'}:
                        {isCurrentlySpeakingMsg && (
                          <span className="speaking-indicator font-mono" style={{ color: config.primaryColor }}>
                            {' '}▶ SPEAKING
                          </span>
                        )}
                      </span>
                      <span className="msg-time">{msg.timestamp}</span>
                    </div>
                    <div className="msg-content">
                      {/* Section 16 & 18: Tool Execution Pipeline Visualizer in Chat History */}
                      {msg.steps && msg.steps.length > 0 && (
                        <div
                          className="msg-tool-steps"
                          style={{
                            marginBottom: '6px',
                            padding: '6px 8px',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '4px',
                            fontSize: '9px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.45)', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                            <span>[ACTION LOG / REAL TOOL PIPELINE]</span>
                            {msg.intent && <span style={{ color: config.primaryColor }}>INTENT: {msg.intent}</span>}
                          </div>
                          {msg.steps.map((st, sIdx) => {
                            const isSuccess = st.status === 'completed';
                            const isFail = st.status === 'failed';
                            return (
                              <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: sIdx > 0 ? '4px' : '0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: config.primaryColor, fontWeight: 700 }}>
                                    {isSuccess ? '✓' : isFail ? '✕' : '●'} {st.tool || st.title}
                                  </span>
                                  <span style={{
                                    fontSize: '8px',
                                    fontWeight: 700,
                                    color: isSuccess ? '#10b981' : isFail ? '#ef4444' : '#f59e0b'
                                  }}>
                                    {st.status.toUpperCase()} {st.duration_ms ? `(${st.duration_ms}ms)` : ''}
                                  </span>
                                </div>
                                {st.message && (
                                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '8.5px' }}>
                                    → {st.message}
                                  </span>
                                )}
                                {st.error && (
                                  <span style={{ color: '#ef4444', fontSize: '8.5px' }}>
                                    [ERR]: {st.error}
                                  </span>
                                )}
                                {st.arguments && Object.keys(st.arguments).length > 0 && (
                                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '7.5px' }}>
                                    args: {JSON.stringify(st.arguments)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="msg-markdown-wrapper" style={{ marginTop: '2px' }}>
                        <MarkdownMessage
                          content={msg.text}
                          primaryColor={config.primaryColor}
                          isUser={isUser}
                        />
                      </div>

                      {/* Copy Button for all messages */}
                      <div style={{ display: 'flex', gap: '5px', marginTop: '4px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Copy message text"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '3px',
                            padding: '2px 6px', borderRadius: '3px',
                            background: copiedId === msg.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${copiedId === msg.id ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            color: copiedId === msg.id ? '#10b981' : 'rgba(255,255,255,0.45)',
                            fontFamily: 'monospace', fontSize: '8.5px', cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {copiedId === msg.id ? <Check size={9} /> : <Copy size={9} />}
                          {copiedId === msg.id ? 'COPIED' : 'COPY'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* TTS Status Notice */}
              {ttsStatusMsg && (
                <div className="chat-message-row msg-error">
                  <div className="msg-meta">
                    <span className="msg-sender" style={{ color: '#f97316' }}>VOICE OUTPUT:</span>
                  </div>
                  <div className="msg-content">
                    <p className="msg-text">{ttsStatusMsg}</p>
                  </div>
                </div>
              )}

              {/* Listening indicator */}
              {isListeningNow && (
                <div className="chat-message-row msg-listening">
                  <div className="msg-meta">
                    <span className="msg-sender" style={{ color: config.primaryColor }}>VOX RECEPTOR:</span>
                    <span className="msg-time font-mono animate-pulse">LISTENING...</span>
                  </div>
                  <div className="msg-content">
                    <span className="listening-tag font-mono">&gt; Speak your command now...</span>
                  </div>
                </div>
              )}

              {/* Thinking indicator */}
              {isProcessing && (
                <div className="chat-message-row msg-jarvis msg-loading">
                  <div className="msg-meta">
                    <span className="msg-sender" style={{ color: config.primaryColor }}>JARVIS:</span>
                    <span className="msg-time font-mono">THINKING...</span>
                  </div>
                  <div className="msg-content">
                    <span className="thinking-dots">
                      <span className="dot" style={{ backgroundColor: config.primaryColor }} />
                      <span className="dot" style={{ backgroundColor: config.primaryColor }} />
                      <span className="dot" style={{ backgroundColor: config.primaryColor }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form className="chat-input-form" onSubmit={handleFormSubmit}>
              <div className="chat-input-wrapper">
                <MicrophoneButton
                  isListening={isListeningNow}
                  isActive={voiceStatus === 'WAKE_LISTENING'}
                  primaryColor={config.primaryColor}
                  onClick={handleManualMicToggle}
                />

                <span className="input-prompt font-mono">&gt;</span>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className="chat-text-input font-mono"
                  placeholder={
                    isTTSSpeaking
                      ? 'JARVIS speaking... (Ctrl+Space or ESC to stop)'
                      : isListeningNow
                      ? 'Listening to microphone...'
                      : isProcessing || state === 'EXECUTING'
                      ? 'Executing command...'
                      : ttsEnabled
                      ? 'Type command or say "Jarvis"... JARVIS will execute & speak'
                      : 'Type command or say "Jarvis"... (Voice output OFF)'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing || isTTSSpeaking}
                />

                {showStopBtn ? (
                  <button
                    type="button"
                    className="chat-stop-btn font-display"
                    onClick={isTTSSpeaking ? handleStopSpeaking : handleStopGeneration}
                    title={isTTSSpeaking ? 'Stop speaking (ESC)' : 'Halt task (ESC)'}
                  >
                    {isTTSSpeaking ? 'STOP SPEECH [ ■ ]' : 'STOP [ ■ ]'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="chat-send-btn font-display"
                    disabled={!inputText.trim()}
                    style={{
                      borderColor: config.primaryColor,
                      color: inputText.trim() ? config.primaryColor : 'rgba(255,255,255,0.3)'
                    }}
                  >
                    SEND
                  </button>
                )}
              </div>
            </form>

            {/* TTS status bar */}
            <div className="tts-status-bar font-mono">
              <span style={{ color: ttsEnabled ? config.primaryColor : '#6b7280' }}>
                {ttsEnabled ? '◉ VOICE ON' : '○ VOICE OFF'}
              </span>
              {isTTSSpeaking && (
                <span className="animate-pulse" style={{ color: config.primaryColor, marginLeft: '0.5rem' }}>
                  ▶ SPEAKING...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        primaryColor={config.primaryColor}
        onClose={() => setIsVoiceModalOpen(false)}
        onSettingsSaved={handleSettingsSaved}
        onTestVoice={(callbacks) => jarvisTTSService.testVoice(callbacks)}
      />
    </>
  );
};
