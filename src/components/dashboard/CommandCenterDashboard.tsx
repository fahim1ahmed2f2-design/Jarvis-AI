import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  JarvisState,
  TelemetryData,
  StateVisualConfig,
  ChatMessage,
  NavSection,
  IntelligenceEvent,
  HudVisibilityState,
  SuitTheme
} from '../../types/jarvis';
import {
  ChevronRight,
  ChevronLeft,
  Activity,
  Mic,
  Sparkles
} from 'lucide-react';
import {
  sendChatMessage,
  stopAgentExecution,
  ExecutionStep
} from '../../services/api';
import { jarvisSpeechService, VoiceSystemStatus } from '../../services/speechService';
import { jarvisTTSService, SubtitleData } from '../../services/ttsService';
import { loadVoiceSettings, saveVoiceSettings } from '../../services/voiceSettings';
import { logIntelligenceEvent } from '../../state/jarvisState';
import { soundFx } from '../../services/soundFxService';
import { applyThemeToConfig } from '../../animations/animationConfig';

// Dashboard Components
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { CenterCoreHud } from './CenterCoreHud';
import { LiveIntelligenceFeed } from './LiveIntelligenceFeed';
import { CommandBar, IntelligenceMode } from './CommandBar';
import { ChatDrawer } from './ChatDrawer';
import { VoiceSettingsModal } from '../hud/VoiceSettingsModal';
import { SectionDetailModal } from './SectionDetailModal';
import { CommandPaletteModal } from './CommandPaletteModal';
import { ProcessManagerModal } from './ProcessManagerModal';
import { CodeSandboxModal } from './CodeSandboxModal';
import { LiveIntelModal } from './LiveIntelModal';
import { TacticalBriefingModal } from './TacticalBriefingModal';
import { ScreenVisionModal } from './ScreenVisionModal';
import { GeospatialRadarModal } from './GeospatialRadarModal';
import { MacroPresetsModal } from './MacroPresetsModal';
import { SystemOptimizerModal } from './SystemOptimizerModal';
import { KnowledgeBaseModal } from './KnowledgeBaseModal';
import { AgentTownModal } from './AgentTownModal';
import { JarvisNotesModal } from './JarvisNotesModal';
import { NotificationToastContainer, useToasts } from './NotificationToast';

interface CommandCenterDashboardProps {
  state: JarvisState;
  config: StateVisualConfig;
  telemetry: TelemetryData;
  events: IntelligenceEvent[];
  onStateChange: (state: JarvisState) => void;
  onLiveAudioFrequencies?: (frequencies: number[]) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'JARVIS',
    text: 'Jarvis v3.0 Mark-III Sovereign online and fully operational. Neural intelligence engines, autonomous PC control, ambient memory, and voice synthesis — all systems green. Standing by for your command, Sir.',
    timestamp: '00:00:01'
  }
];

const HUD_VISIBILITY_STORAGE_KEY = 'jarvis_hud_visibility_v3';

const DEFAULT_HUD_VISIBILITY: HudVisibilityState = {
  leftSidebar: true,
  rightLiveFeed: true,
  systemMonitor: true,
  coreSubsystems: true,
  memoryInsights: true,
  aiProvider: true,
  quickActions: true,
  centerStatusCard: true,
  centerTopBanner: true,
  centerIndicators: true,
  topbarQuickActions: true,
  commandBar: true,
  networkMonitor: true,
  batteryCard: true,
  processCard: true,
};

const loadSavedHudVisibility = (): HudVisibilityState => {
  try {
    const saved = localStorage.getItem(HUD_VISIBILITY_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_HUD_VISIBILITY, ...JSON.parse(saved) };
    }
  } catch {
    // non-fatal
  }
  return DEFAULT_HUD_VISIBILITY;
};

export const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = ({
  state,
  config,
  telemetry,
  events,
  onStateChange,
  onLiveAudioFrequencies
}) => {
  // Navigation & UI Layout State
  const [activeSection, setActiveSection] = useState<NavSection>('COMMAND_CENTER');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState<NavSection | null>(null);

  // HUD Dynamic Visibility States (Cross Hide & Free Screen)
  const [hudVisibility, setHudVisibility] = useState<HudVisibilityState>(loadSavedHudVisibility);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const prevVisibilityRef = useRef<HudVisibilityState>(hudVisibility);

  const updateHudVisibility = (newVisibility: HudVisibilityState) => {
    setHudVisibility(newVisibility);
    try {
      localStorage.setItem(HUD_VISIBILITY_STORAGE_KEY, JSON.stringify(newVisibility));
    } catch {
      // non-fatal
    }
  };

  const handleHidePanel = (panel: keyof HudVisibilityState) => {
    const updated = { ...hudVisibility, [panel]: false };
    updateHudVisibility(updated);
  };

  const handleRestorePanel = (panel: keyof HudVisibilityState) => {
    const updated = { ...hudVisibility, [panel]: true };
    updateHudVisibility(updated);
  };

  const handleTogglePanel = (panel: keyof HudVisibilityState) => {
    const updated = { ...hudVisibility, [panel]: !hudVisibility[panel] };
    updateHudVisibility(updated);
  };

  const handleRestoreAll = () => {
    setIsZenMode(false);
    updateHudVisibility(DEFAULT_HUD_VISIBILITY);
  };

  const handleToggleZenMode = () => {
    if (!isZenMode) {
      prevVisibilityRef.current = hudVisibility;
      setIsZenMode(true);
      updateHudVisibility({
        ...hudVisibility,
        leftSidebar: false,
        rightLiveFeed: false,
        systemMonitor: false,
        coreSubsystems: false,
        memoryInsights: false,
        aiProvider: false,
        quickActions: false,
        centerStatusCard: false,
        centerTopBanner: false,
        centerIndicators: false,
        topbarQuickActions: false,
      });
    } else {
      setIsZenMode(false);
      updateHudVisibility(prevVisibilityRef.current || DEFAULT_HUD_VISIBILITY);
    }
  };

  // Advanced Matrix Modals State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProcessManagerOpen, setIsProcessManagerOpen] = useState(false);
  const [isCodeSandboxOpen, setIsCodeSandboxOpen] = useState(false);
  const [isLiveIntelOpen, setIsLiveIntelOpen] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [isAgentTownOpen, setIsAgentTownOpen] = useState(false);
  const [isMacrosModalOpen, setIsMacrosModalOpen] = useState(false);
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // V3: Toast notification system
  const toastAPI = useToasts();

  // Suit Theme State (Iron Man Armor Suit Themes)
  const [suitTheme, setSuitTheme] = useState<SuitTheme>(() => {
    try {
      return (localStorage.getItem('jarvis_suit_theme') as SuitTheme) || 'MARK_IV';
    } catch {
      return 'MARK_IV';
    }
  });

  const handleSelectSuitTheme = (theme: SuitTheme) => {
    setSuitTheme(theme);
    try {
      localStorage.setItem('jarvis_suit_theme', theme);
    } catch {}
  };

  const themedConfig = applyThemeToConfig(config, suitTheme);

  // Chat & Execution State
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);
  const [, setVoiceStatus] = useState<VoiceSystemStatus>('IDLE');
  const [ttsEnabled, setTtsEnabled] = useState(() => loadVoiceSettings().ttsEnabled);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('auto');
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [liveInterimTranscript, setLiveInterimTranscript] = useState<string | null>(null);
  const [liveJarvisSubtitle, setLiveJarvisSubtitle] = useState<SubtitleData | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Global Keyboard Shortcuts (Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handle section selection from LeftSidebar
  const handleNavSelect = (section: NavSection) => {
    setActiveSection(section);
    if (section === 'CONVERSATIONS') {
      setIsChatDrawerOpen(true);
    } else if (section !== 'COMMAND_CENTER' && section !== 'AI_CORE') {
      setModalSection(section);
    }
  };

  /**
   * CENTRAL AI RESPONSE HANDLER
   */
  const handleAIResponse = useCallback((
    replyText: string,
    isError = false,
    steps?: ExecutionStep[],
    intent?: string,
    modelUsed?: string,
    modeUsed?: string,
    routeReason?: string,
    sources?: any[]
  ) => {
    const msgId = `jarvis-${Date.now()}`;
    const jarvisMsg: ChatMessage = {
      id: msgId,
      sender: 'JARVIS',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      isError,
      intent,
      model_used: modelUsed,
      mode_used: modeUsed,
      route_reason: routeReason,
      sources: sources,
      steps
    };

    setMessages((prev) => [...prev, jarvisMsg]);
    logIntelligenceEvent('AI', `JARVIS: ${replyText.slice(0, 70)}${replyText.length > 70 ? '...' : ''}`, isError ? 'error' : 'success');

    // V2: Show toast notification for JARVIS responses
    if (!isError && replyText.trim()) {
      toastAPI.success('JARVIS', replyText.slice(0, 80) + (replyText.length > 80 ? '...' : ''));
    } else if (isError) {
      toastAPI.error('JARVIS ERROR', replyText.slice(0, 80));
    }

    if (steps && steps.length > 0) {
      setExecutionSteps(steps);
      const successfulSteps = steps.filter((s) => s.status === 'completed').length;
      logIntelligenceEvent('AGENT', `Completed ${successfulSteps}/${steps.length} autonomous steps for [${intent || 'ACTION'}]`, 'success');
    }

    if (ttsEnabled && replyText.trim() && !isError) {
      setIsTTSSpeaking(true);
      onStateChange('SPEAKING');
      jarvisSpeechService.notifyTTSState(true);

      jarvisTTSService.speak(replyText, {
        onStart: () => {
          setIsTTSSpeaking(true);
          onStateChange('SPEAKING');
          jarvisSpeechService.notifyTTSState(true);
        },
        onSubtitle: (sub) => {
          setLiveJarvisSubtitle(sub || null);
        },
        onFrequencies: (freqs) => {
          if (onLiveAudioFrequenciesRef.current) {
            onLiveAudioFrequenciesRef.current(freqs);
          }
        },
        onEnd: () => {
          setIsTTSSpeaking(false);
          setLiveJarvisSubtitle(null);
          jarvisSpeechService.notifyTTSState(false);
        },
        onError: (err) => {
          console.warn('[TTS] Synthesis notice:', err);
          setIsTTSSpeaking(false);
          setLiveJarvisSubtitle(null);
          jarvisSpeechService.notifyTTSState(false);
        }
      }).catch((err) => {
        console.warn('[TTS] Uncaught speak error:', err);
        setIsTTSSpeaking(false);
        setLiveJarvisSubtitle(null);
        jarvisSpeechService.notifyTTSState(false);
      });
    } else {
      onStateChange('IDLE');
    }
  }, [ttsEnabled, onStateChange]);

  /**
   * PROCESS & SEND MESSAGE TO JARVIS CORE
   */
  const processAndSendMessage = useCallback(async (userText: string, customMode?: IntelligenceMode, customModel?: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isProcessing) return;

    soundFx.playClick();
    jarvisTTSService.unlockAudio();
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'USER',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };

    setMessages((prev) => [...prev, userMsg]);
    logIntelligenceEvent('AI', `User instruction: "${trimmed.slice(0, 50)}${trimmed.length > 50 ? '...' : ''}"`, 'info');

    setIsProcessing(true);
    setExecutionSteps([]);
    onStateChange('THINKING');

    abortControllerRef.current = new AbortController();

    const activeMode = customMode || intelligenceMode;
    const activeModel = (customModel || selectedModel) === 'auto' ? undefined : (customModel || selectedModel);

    try {
      const response = await sendChatMessage(
        trimmed,
        'default',
        abortControllerRef.current.signal,
        activeMode,
        activeModel
      );
      setIsProcessing(false);
      handleAIResponse(
        response.reply,
        response.status === 'error',
        response.steps,
        response.intent,
        response.model_used,
        response.mode_used,
        response.route_reason,
        response.sources
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logIntelligenceEvent('SYSTEM', 'Directive execution cancelled by user', 'warning');
        handleAIResponse('Execution stopped by user, Sir.', true);
      } else {
        logIntelligenceEvent('SYSTEM', `Server connection error: ${err.message}`, 'error');
        handleAIResponse(`Network error: ${err.message}. Ensuring autonomous fallback.`, true);
      }
      setIsProcessing(false);
      onStateChange('IDLE');
    }
  }, [isProcessing, onStateChange, handleAIResponse, intelligenceMode, selectedModel]);

  const handleStopExecution = useCallback(async () => {
    soundFx.playAlert();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    try {
      await stopAgentExecution();
    } catch (e) {
      console.warn('[AGENT] Stop signal notice:', e);
    }
    setIsProcessing(false);
    onStateChange('IDLE');
    logIntelligenceEvent('SYSTEM', 'Manual override: Stopped active task', 'warning');
  }, [onStateChange]);

  const handleStopSpeaking = useCallback(() => {
    jarvisTTSService.stop();
    jarvisSpeechService.notifyTTSState(false);
    setIsTTSSpeaking(false);
    setLiveJarvisSubtitle(null);
    setLiveInterimTranscript(null);
    onStateChange('IDLE');
    logIntelligenceEvent('VOICE', 'Speech synthesis halted', 'info');
  }, [onStateChange]);

  const handleToggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev;
      const settings = loadVoiceSettings();
      settings.ttsEnabled = next;
      saveVoiceSettings(settings);
      if (!next) {
        jarvisTTSService.stop();
        jarvisSpeechService.notifyTTSState(false);
        setIsTTSSpeaking(false);
        setLiveJarvisSubtitle(null);
        onStateChange('IDLE');
      }
      return next;
    });
  }, [onStateChange]);

  // Voice Service Integration
  const processAndSendMessageRef = useRef(processAndSendMessage);
  useEffect(() => { processAndSendMessageRef.current = processAndSendMessage; });
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; });
  const onLiveAudioFrequenciesRef = useRef(onLiveAudioFrequencies);
  useEffect(() => { onLiveAudioFrequenciesRef.current = onLiveAudioFrequencies; });

  const handleStopSpeakingRef = useRef(handleStopSpeaking);
  useEffect(() => { handleStopSpeakingRef.current = handleStopSpeaking; });

  useEffect(() => {
    jarvisSpeechService.setCallbacks({
      onStatusChange: (status) => {
        setVoiceStatus(status);
        if (status === 'ACTIVE_LISTENING') {
          onStateChangeRef.current('LISTENING');
        } else if (status === 'WAKE_LISTENING' || status === 'IDLE') {
          setLiveInterimTranscript(null);
          onStateChangeRef.current('IDLE');
        }
      },
      onWakeWordDetected: (word) => {
        soundFx.playSuccess();
        onStateChangeRef.current('LISTENING');
        logIntelligenceEvent('VOICE', `Wake word "${word || 'JARVIS'}" validated`, 'success');
      },
      onInterimTranscript: (liveText: string) => {
        setLiveInterimTranscript(liveText || null);
      },
      onAckRequested: (phrase: string) => {
        const ackMsg: ChatMessage = {
          id: `jarvis-ack-${Date.now()}`,
          sender: 'JARVIS',
          text: phrase,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        };
        setMessages((prev) => [...prev, ackMsg]);
        logIntelligenceEvent('VOICE', `JARVIS: ${phrase}`, 'info');

        const settings = loadVoiceSettings();
        if (settings.ttsEnabled) {
          setIsTTSSpeaking(true);
          onStateChangeRef.current('SPEAKING');
          jarvisSpeechService.notifyTTSState(true);

          jarvisTTSService.speak(phrase, {
            onStart: () => {
              setIsTTSSpeaking(true);
              onStateChangeRef.current('SPEAKING');
              jarvisSpeechService.notifyTTSState(true);
            },
            onSubtitle: (sub) => {
              setLiveJarvisSubtitle(sub || null);
            },
            onFrequencies: (freqs) => {
              if (onLiveAudioFrequenciesRef.current) {
                onLiveAudioFrequenciesRef.current(freqs);
              }
            },
            onEnd: () => {
              setIsTTSSpeaking(false);
              setLiveJarvisSubtitle(null);
              onStateChangeRef.current('LISTENING');
              jarvisSpeechService.notifyTTSState(false);
            },
            onError: () => {
              setIsTTSSpeaking(false);
              setLiveJarvisSubtitle(null);
              onStateChangeRef.current('LISTENING');
              jarvisSpeechService.notifyTTSState(false);
            }
          });
        }
      },
      onCommandRecognized: (transcript) => {
        setLiveInterimTranscript(null);
        const lower = transcript.toLowerCase().trim();
        if (lower === 'stop' || lower === 'stop jarvis' || lower === 'stop speaking') {
          handleStopSpeakingRef.current?.();
          return;
        }
        onStateChangeRef.current('THINKING');
        logIntelligenceEvent('VOICE', `Voice recognized: "${transcript}"`, 'info');
        processAndSendMessageRef.current(transcript);
      },
      onAudioLevel: (freqs) => {
        if (onLiveAudioFrequenciesRef.current) {
          onLiveAudioFrequenciesRef.current(freqs);
        }
      },
      onError: (errMsg) => {
        logIntelligenceEvent('VOICE', `Voice Receptor: ${errMsg}`, 'error');
      }
    });

    const settings = loadVoiceSettings();
    if (settings.wakeWordEnabled) {
      jarvisSpeechService.start();
    }

    return () => {
      jarvisSpeechService.stopAll();
    };
  }, []);

  return (
    <div className={`jarvis-command-center-root state-${state.toLowerCase()}`}>
      {/* Background Ambience & Scanlines */}
      <div className="hud-vignette" />
      <div className="hud-scanlines" />
      <div
        className="hud-ambient-glow"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${config.glowColor} 0%, transparent 60%)`
        }}
      />

      {/* Screen Corner Framing Brackets */}
      <div className="hud-corner-bracket bracket-tl" style={{ borderColor: config.primaryColor }} />
      <div className="hud-corner-bracket bracket-tr" style={{ borderColor: config.primaryColor }} />
      <div className="hud-corner-bracket bracket-bl" style={{ borderColor: config.primaryColor }} />
      <div className="hud-corner-bracket bracket-br" style={{ borderColor: config.primaryColor }} />

      {/* TOP BAR */}
      <TopBar
        state={state}
        config={themedConfig}
        telemetry={telemetry}
        onOpenSettings={() => setIsVoiceModalOpen(true)}
        onToggleChatDrawer={() => setIsChatDrawerOpen((prev) => !prev)}
        isChatOpen={isChatDrawerOpen}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenProcessManager={() => setIsProcessManagerOpen(true)}
        onOpenCodeSandbox={() => setIsCodeSandboxOpen(true)}
        onOpenLiveIntel={() => setIsLiveIntelOpen(true)}
        onOpenBriefing={() => setIsBriefingModalOpen(true)}
        onOpenVision={() => setIsVisionModalOpen(true)}
        onOpenRadar={() => setIsRadarModalOpen(true)}
        onOpenAgentTown={() => setIsAgentTownOpen(true)}
        onOpenMacros={() => setIsMacrosModalOpen(true)}
        onOpenOptimizer={() => setIsOptimizerModalOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenNotes={() => setIsNotesOpen(true)}
        currentSuitTheme={suitTheme}
        onSelectSuitTheme={handleSelectSuitTheme}
        visibility={hudVisibility}
        onTogglePanel={handleTogglePanel}
        onToggleZenMode={handleToggleZenMode}
        isZenMode={isZenMode}
        onRestoreAll={handleRestoreAll}
        ttsEnabled={ttsEnabled}
        onToggleTts={handleToggleTts}
      />

      {/* Floating Left Edge Restore Tab when LeftSidebar is hidden */}
      {!hudVisibility.leftSidebar && (
        <button
          type="button"
          className="hud-edge-restore-btn left-edge font-mono"
          onClick={() => handleRestorePanel('leftSidebar')}
          title="Restore Navigation Sidebar"
          style={{ borderColor: 'rgba(0, 240, 255, 0.4)' }}
        >
          <ChevronRight className="w-3.5 h-3.5" style={{ color: themedConfig.primaryColor }} />
          <span className="edge-btn-text">NAV</span>
        </button>
      )}

      {/* Floating Right Edge Restore Tab when Live Feed is hidden */}
      {!hudVisibility.rightLiveFeed && (
        <button
          type="button"
          className="hud-edge-restore-btn right-edge font-mono"
          onClick={() => handleRestorePanel('rightLiveFeed')}
          title="Restore Intelligence Stream"
          style={{ borderColor: 'rgba(0, 240, 255, 0.4)' }}
        >
          <ChevronLeft className="w-3.5 h-3.5" style={{ color: themedConfig.primaryColor }} />
          <span className="edge-btn-text">FEED</span>
        </button>
      )}

      {/* MAIN 3-COLUMN DASHBOARD */}
      <main className={`dashboard-main-3col ${!hudVisibility.leftSidebar ? 'no-left-sidebar' : ''} ${!hudVisibility.rightLiveFeed ? 'no-right-feed' : ''}`}>
        {/* LEFT COLUMN: Collapsible Sidebar */}
        {hudVisibility.leftSidebar && (
          <LeftSidebar
            activeSection={activeSection}
            onSelectSection={handleNavSelect}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            config={themedConfig}
            memoryCount={telemetry.memoryCount}
            toolsCount={telemetry.totalTools}
            onClose={() => handleHidePanel('leftSidebar')}
          />
        )}

        {/* CENTER COLUMN: Main AI Core HUD (Overlays 3D Three.js canvas) */}
        <section className="dashboard-center-column">
          <CenterCoreHud
            state={state}
            config={themedConfig}
            telemetry={telemetry}
            visibility={hudVisibility}
            onHidePanel={handleHidePanel}
            latestMessage={messages[messages.length - 1] || null}
            liveTranscript={liveInterimTranscript}
            jarvisSubtitle={liveJarvisSubtitle}
            onOpenChatDrawer={() => setIsChatDrawerOpen(true)}
          />
        </section>

        {/* RIGHT COLUMN: Live Intelligence Feed */}
        {hudVisibility.rightLiveFeed && (
          <section className="dashboard-right-column">
            <LiveIntelligenceFeed
              events={events}
              config={themedConfig}
              onClose={() => handleHidePanel('rightLiveFeed')}
            />
          </section>
        )}
      </main>

      {/* BOTTOM INTERACTION BAR: TALK TO JARVIS & COMMAND BAR */}
      {hudVisibility.commandBar ? (
        <CommandBar
          state={state}
          config={themedConfig}
          onSendMessage={processAndSendMessage}
          onToggleChatDrawer={() => setIsChatDrawerOpen((prev) => !prev)}
          isChatOpen={isChatDrawerOpen}
          isProcessing={isProcessing || isTTSSpeaking}
          onStopExecution={isTTSSpeaking ? handleStopSpeaking : handleStopExecution}
          currentMode={intelligenceMode}
          onSelectMode={setIntelligenceMode}
          currentModel={selectedModel}
          onSelectModel={setSelectedModel}
          onHide={() => handleHidePanel('commandBar')}
          ttsEnabled={ttsEnabled}
          onToggleTts={handleToggleTts}
          liveTranscript={liveInterimTranscript}
        />
      ) : (
        <div className="hud-floating-talk-pill font-mono">
          <button
            type="button"
            className="floating-mic-btn font-mono"
            onClick={() => jarvisSpeechService.triggerManualListening()}
            title="Talk to JARVIS (Microphone)"
            style={{ borderColor: config.primaryColor }}
          >
            <Mic className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            <span>TALK TO JARVIS</span>
          </button>
          <button
            type="button"
            className="floating-restore-cmd-btn font-mono"
            onClick={() => handleRestorePanel('commandBar')}
            title="Restore Command Bar Input"
          >
            + INPUT BAR
          </button>
        </div>
      )}

      {/* CONVERSATION CONSOLE DRAWER */}
      <ChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        messages={messages}
        state={state}
        config={config}
        backendStatus={telemetry.backendStatus}
        isProcessing={isProcessing}
        isTTSSpeaking={isTTSSpeaking}
        ttsEnabled={ttsEnabled}
        onToggleTts={handleToggleTts}
        onStopSpeaking={handleStopSpeaking}
        onStopExecution={handleStopExecution}
        executionSteps={executionSteps}
        onOpenSettings={() => setIsVoiceModalOpen(true)}
      />

      {/* COMMAND PALETTE MODAL (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenProcessManager={() => setIsProcessManagerOpen(true)}
        onOpenCodeSandbox={() => setIsCodeSandboxOpen(true)}
        onOpenLiveIntel={() => setIsLiveIntelOpen(true)}
        onSendChatCommand={processAndSendMessage}
      />

      {/* PROCESS & RESOURCE MANAGER MODAL */}
      <ProcessManagerModal
        isOpen={isProcessManagerOpen}
        onClose={() => setIsProcessManagerOpen(false)}
      />

      {/* DEVELOPER CODE SANDBOX MODAL */}
      <CodeSandboxModal
        isOpen={isCodeSandboxOpen}
        onClose={() => setIsCodeSandboxOpen(false)}
      />

      {/* LIVE INTEL & RADAR MODAL */}
      <LiveIntelModal
        isOpen={isLiveIntelOpen}
        onClose={() => setIsLiveIntelOpen(false)}
      />

      {/* TACTICAL INTELLIGENCE BRIEFING MODAL */}
      <TacticalBriefingModal
        isOpen={isBriefingModalOpen}
        onClose={() => setIsBriefingModalOpen(false)}
        primaryColor={config.primaryColor}
      />

      {/* MULTIMODAL SCREEN VISION MODAL */}
      <ScreenVisionModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        primaryColor={config.primaryColor}
      />

      {/* AUTONOMOUS MACRO WORKFLOWS PRESETS MODAL */}
      <MacroPresetsModal
        isOpen={isMacrosModalOpen}
        onClose={() => setIsMacrosModalOpen(false)}
        primaryColor={config.primaryColor}
      />

      {/* SYSTEM DIAGNOSTICS & TURBO BOOST MODAL */}
      <SystemOptimizerModal
        config={themedConfig}
        isOpen={isOptimizerModalOpen}
        onClose={() => setIsOptimizerModalOpen(false)}
        onSendCommand={processAndSendMessage}
      />

      {/* SETTINGS MODAL */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        primaryColor={themedConfig.primaryColor}
        onClose={() => setIsVoiceModalOpen(false)}
        onSettingsSaved={(newSettings) => {
          setTtsEnabled(newSettings.ttsEnabled);
          jarvisSpeechService.updateSettings(newSettings);
          if (newSettings.wakeWordEnabled) {
            jarvisSpeechService.start();
          } else {
            jarvisSpeechService.stopAll();
          }
          logIntelligenceEvent('SYSTEM', 'Voice & AI Configuration updated successfully', 'success');
        }}
        onTestVoice={(callbacks) => jarvisTTSService.testVoice(callbacks)}
      />

      {/* SECTION DETAIL MODALS (Tasks, Memory, Calendar, Tools, etc.) */}
      {modalSection && (
        <SectionDetailModal
          section={modalSection}
          config={themedConfig}
          telemetry={telemetry}
          onClose={() => setModalSection(null)}
          onSendCommand={processAndSendMessage}
        />
      )}

      {/* V2: KNOWLEDGE BASE MODAL */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeBaseOpen}
        onClose={() => setIsKnowledgeBaseOpen(false)}
        primaryColor={themedConfig.primaryColor}
      />

      {/* SCI-FI GEOSPATIAL TACTICAL RADAR MODAL */}
      <GeospatialRadarModal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        primaryColor={themedConfig.primaryColor}
      />

      {/* JARVIS AGENT TOWN MODAL */}
      <AgentTownModal
        isOpen={isAgentTownOpen}
        onClose={() => setIsAgentTownOpen(false)}
        primaryColor={themedConfig.primaryColor}
      />

      {/* V2: JARVIS NOTES MODAL */}
      <JarvisNotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        primaryColor={themedConfig.primaryColor}
        onSendCommand={processAndSendMessage}
      />

      {/* V2: TOAST NOTIFICATION CONTAINER */}
      <NotificationToastContainer
        toasts={toastAPI.toasts}
        onDismiss={toastAPI.dismissToast}
        primaryColor={themedConfig.primaryColor}
      />
    </div>
  );
};
