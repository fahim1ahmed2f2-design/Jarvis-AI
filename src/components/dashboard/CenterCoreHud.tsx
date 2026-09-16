import React from 'react';
import { 
  Cpu, 
  Brain, 
  Mic, 
  Wrench, 
  HardDrive,
  X,
  Sparkles
} from 'lucide-react';
import { JarvisState, StateVisualConfig, TelemetryData, HudVisibilityState, ChatMessage } from '../../types/jarvis';
import { Jarvis3DCanvas } from '../3d/Jarvis3DCanvas';
import { SubtitleData } from '../../services/ttsService';

interface CenterCoreHudProps {
  state: JarvisState;
  config: StateVisualConfig;
  telemetry: TelemetryData;
  visibility: HudVisibilityState;
  onHidePanel: (panel: keyof HudVisibilityState) => void;
  latestMessage?: ChatMessage | null;
  liveTranscript?: string | null;
  jarvisSubtitle?: SubtitleData | string | null;
  onOpenChatDrawer?: () => void;
}

export const CenterCoreHud: React.FC<CenterCoreHudProps> = ({
  state,
  config,
  telemetry,
  visibility,
  onHidePanel,
  latestMessage,
  liveTranscript,
  jarvisSubtitle,
  onOpenChatDrawer
}) => {
  const isOnline = telemetry.backendStatus === 'ONLINE';
  const { systemMetrics } = telemetry;

  const getSubStatusLabel = () => {
    switch (state) {
      case 'LISTENING':
        return 'MICROPHONE CAPTURING VOICE';
      case 'THINKING':
        return 'PROCESSING WITH AI BRAIN';
      case 'EXECUTING':
        return 'EXECUTING TOOL ACTION ON PC';
      case 'SPEAKING':
        return 'TTS VOCAL SYNTHESIS BROADCAST';
      case 'ALERT':
        return 'SECURITY CONFIRMATION REQUIRED';
      case 'ERROR':
        return 'OPERATION FAILED // ERROR ENCOUNTERED';
      case 'IDLE':
      default:
        return 'STANDBY // READY FOR COMMAND';
    }
  };

  const getSystemStatusText = () => {
    switch (state) {
      case 'IDLE': return 'READY';
      case 'LISTENING': return 'LISTENING';
      case 'THINKING': return 'THINKING';
      case 'EXECUTING': return 'EXECUTING';
      case 'SPEAKING': return 'SPEAKING';
      case 'ALERT': return 'CONFIRMATION';
      case 'ERROR': return 'ERROR';
      default: return 'ONLINE';
    }
  };

  return (
    <div className="jarvis-center-core-hud">
      {/* Top Core Info Banner */}
      {visibility.centerTopBanner && (
        <div className="core-top-banner">
          <div className="core-title-group">
            <div className="core-label font-mono">
              <span className="core-prefix">//</span> SOVEREIGN NEURAL CORE v3.0
            </div>
            <h1 className="core-main-heading font-display">
              JARVIS
            </h1>
            <div className="core-sub-heading font-mono" style={{ color: config.primaryColor }}>
              MARK-III SOVEREIGN
            </div>
          </div>

          <div className="core-meta-badges">
            <div className="core-meta-pill font-mono" style={{ borderColor: `${config.primaryColor}40` }}>
              <span 
                className="meta-dot" 
                style={{ 
                  backgroundColor: isOnline ? config.primaryColor : '#ef4444',
                  boxShadow: `0 0 6px ${isOnline ? config.primaryColor : '#ef4444'}`
                }} 
              />
              <span className="meta-text">
                STATUS: <strong style={{ color: isOnline ? config.primaryColor : '#ef4444' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</strong>
              </span>
            </div>

            <div className="core-meta-pill font-mono" style={{ borderColor: 'rgba(0, 240, 255, 0.2)' }}>
              <span className="meta-text">MODEL: <strong>{telemetry.activeModel}</strong></span>
            </div>

            <button
              type="button"
              className="hud-panel-close-btn"
              onClick={() => onHidePanel('centerTopBanner')}
              title="Hide Neural Core Banner (Cross)"
              aria-label="Hide Neural Core Banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. SYSTEM STATUS -> READY PANEL (Directly ABOVE the AI Core) */}
      {visibility.centerStatusCard && (
        <div className="core-status-card">
          <div className="core-status-header font-mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>SYSTEM STATUS</span>
              <span 
                className="core-status-pulse" 
                style={{ backgroundColor: config.primaryColor }} 
              />
            </div>
            <button
              type="button"
              className="hud-panel-close-btn"
              onClick={() => onHidePanel('centerStatusCard')}
              title="Hide Status Card (Cross)"
              aria-label="Hide Status Card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div 
            className="core-status-value font-display"
            style={{ 
              color: config.primaryColor,
              textShadow: `0 0 12px ${config.primaryColor}`
            }}
          >
            {getSystemStatusText()}
          </div>
          <div className="core-substatus-text font-mono">
            {getSubStatusLabel()}
          </div>
        </div>
      )}

      {/* 2. ANIMATED HOLOGRAPHIC AI NEURAL CORE */}
      <div className="core-stage-wrapper">
        <Jarvis3DCanvas 
          state={state} 
          audioFrequencyData={telemetry.audioFrequencyData} 
        />
      </div>

      {/* Holographic Subtitle / Live Transcription HUD */}
      {(jarvisSubtitle || liveTranscript) && (
        <div 
          className="core-subtitle-holo-system"
          onClick={onOpenChatDrawer}
          title="Click to view full conversation history"
        >
          {/* Projection Emitter Beam tethering 3D core to subtitle */}
          <div className="holo-projection-beam-wrap">
            <div 
              className="holo-projection-beam" 
              style={{ background: `linear-gradient(180deg, ${config.primaryColor}, transparent)` }} 
            />
            <div className="holo-beam-emitter-node" style={{ borderColor: `${config.primaryColor}60` }}>
              <span className="emitter-dot" style={{ backgroundColor: config.primaryColor }} />
              <span className="holo-beam-telemetry font-mono">
                <span>FREQ</span>
                <span className="beam-freq" style={{ color: config.primaryColor }}>
                  {telemetry.audioFrequencyData[0] ? `${Math.round(telemetry.audioFrequencyData[0] * 1200)}Hz` : 'ACTIVE'}
                </span>
              </span>
            </div>
          </div>

          {/* Futuristic Sci-Fi Subtitle Container */}
          <div 
            className="core-holographic-subtitle-container"
            style={{ borderColor: `${config.primaryColor}80` }}
          >
            {/* Holographic Reticle Corners */}
            <span className="holo-corner top-left" style={{ borderColor: config.primaryColor }} />
            <span className="holo-corner top-right" style={{ borderColor: config.primaryColor }} />
            <span className="holo-corner bottom-left" style={{ borderColor: config.primaryColor }} />
            <span className="holo-corner bottom-right" style={{ borderColor: config.primaryColor }} />

            {/* Subtitle Header Row with Mini EQ */}
            <div className="subtitle-header-row font-mono">
              <div className="subtitle-mini-eq">
                {telemetry.audioFrequencyData.slice(0, 5).map((f, i) => (
                  <span 
                    key={i} 
                    className="mini-eq-bar" 
                    style={{ 
                      height: `${Math.max(3, f * 14)}px`, 
                      backgroundColor: config.primaryColor 
                    }} 
                  />
                ))}
              </div>

              <div className="subtitle-tag">
                {jarvisSubtitle ? (
                  <span className="tag-jarvis" style={{ color: config.primaryColor }}>
                    <Sparkles className="w-3 h-3" /> JARVIS VOCAL SYNTHESIS
                  </span>
                ) : (
                  <span className="tag-user" style={{ color: '#10b981' }}>
                    <Mic className="w-3 h-3" /> LIVE USER INPUT
                  </span>
                )}
              </div>

              <div className="subtitle-mini-eq">
                {telemetry.audioFrequencyData.slice(5, 10).map((f, i) => (
                  <span 
                    key={i} 
                    className="mini-eq-bar" 
                    style={{ 
                      height: `${Math.max(3, f * 14)}px`, 
                      backgroundColor: config.primaryColor 
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Subtitle Text with Word-by-Word Karaoke Highlight */}
            <div className="subtitle-text">
              {jarvisSubtitle ? (
                typeof jarvisSubtitle === 'string' ? (
                  <span>{jarvisSubtitle}</span>
                ) : (
                  <span className="karaoke-subtitle-line">
                    {jarvisSubtitle.words && jarvisSubtitle.words.length > 0 ? (
                      jarvisSubtitle.words.map((word, wIdx) => {
                        const isSpoken = wIdx < jarvisSubtitle.activeWordIndex;
                        const isActive = wIdx === jarvisSubtitle.activeWordIndex;
                        return (
                          <span
                            key={wIdx}
                            className={`subtitle-word ${isActive ? 'active-word' : isSpoken ? 'spoken-word' : 'upcoming-word'}`}
                            style={isActive ? { borderColor: config.primaryColor, color: config.primaryColor } : {}}
                          >
                            {word}{' '}
                          </span>
                        );
                      })
                    ) : (
                      <span>{jarvisSubtitle.sentence}</span>
                    )}
                  </span>
                )
              ) : liveTranscript ? (
                <span className="font-mono" style={{ color: '#10b981' }}>
                  "{liveTranscript}..."
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 3. LOWER DASHBOARD PANELS (Directly BELOW the AI Core) */}
      {visibility.centerIndicators && (
        <div className="core-bottom-banner" style={{ position: 'relative' }}>
          <button
            type="button"
            className="hud-panel-close-btn"
            style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 10 }}
            onClick={() => onHidePanel('centerIndicators')}
            title="Hide Subsystem Indicators (Cross)"
            aria-label="Hide Subsystem Indicators"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        {/* Audio Reactive Equalizer Bars */}
        <div className="core-audio-equalizer">
          {telemetry.audioFrequencyData.slice(0, 24).map((freq, idx) => (
            <div 
              key={idx} 
              className="eq-bar"
              style={{
                height: `${Math.max(4, freq * 36)}px`,
                backgroundColor: config.primaryColor,
                opacity: 0.35 + freq * 0.65
              }}
            />
          ))}
        </div>

        {/* Real Subsystem Indicators Grid */}
        <div className="core-indicators-grid">
          {/* Real CPU Usage */}
          <div className="core-indicator-item">
            <div className="indicator-icon-wrap" style={{ borderColor: `${config.primaryColor}30` }}>
              <Cpu className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            </div>
            <div className="indicator-text-block">
              <span className="indicator-name font-mono">CPU LOAD</span>
              <span className="indicator-status font-mono" style={{ color: config.primaryColor }}>
                {systemMetrics.cpuUsage !== null ? `${systemMetrics.cpuUsage}%` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Real RAM Usage */}
          <div className="core-indicator-item">
            <div className="indicator-icon-wrap" style={{ borderColor: `${config.primaryColor}30` }}>
              <HardDrive className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            </div>
            <div className="indicator-text-block">
              <span className="indicator-name font-mono">RAM USED</span>
              <span className="indicator-status font-mono" style={{ color: '#10b981' }}>
                {systemMetrics.ramPercent !== null ? `${systemMetrics.ramPercent}%` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Real Memory Count */}
          <div className="core-indicator-item">
            <div className="indicator-icon-wrap" style={{ borderColor: `${config.primaryColor}30` }}>
              <Brain className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            </div>
            <div className="indicator-text-block">
              <span className="indicator-name font-mono">MEMORY</span>
              <span className="indicator-status font-mono" style={{ color: '#10b981' }}>
                {telemetry.memoryCount} RECALL
              </span>
            </div>
          </div>

          {/* Voice status */}
          <div className="core-indicator-item">
            <div className="indicator-icon-wrap" style={{ borderColor: `${config.primaryColor}30` }}>
              <Mic className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            </div>
            <div className="indicator-text-block">
              <span className="indicator-name font-mono">VOICE</span>
              <span 
                className="indicator-status font-mono"
                style={{ color: state === 'LISTENING' ? '#10b981' : config.primaryColor }}
              >
                {state === 'LISTENING' ? 'CAPTURING' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Real Tools Count */}
          <div className="core-indicator-item">
            <div className="indicator-icon-wrap" style={{ borderColor: `${config.primaryColor}30` }}>
              <Wrench className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
            </div>
            <div className="indicator-text-block">
              <span className="indicator-name font-mono">TOOLS</span>
              <span className="indicator-status font-mono" style={{ color: config.primaryColor }}>
                {telemetry.totalTools} ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
