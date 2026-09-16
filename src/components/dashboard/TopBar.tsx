import React, { useState, useEffect } from 'react';
import {
  Radio,
  Sliders,
  BookOpen,
  StickyNote,
  Cpu,
  Wifi,
  Battery,
  BatteryCharging,
  Eye,
  Zap,
  Shield,
  Clock,
  Bot
} from 'lucide-react';
import { JarvisState, TelemetryData, StateVisualConfig, HudVisibilityState, SuitTheme } from '../../types/jarvis';
import { SUIT_THEMES, getSuitThemeList } from '../../animations/animationConfig';

interface TopBarProps {
  state: JarvisState;
  config: StateVisualConfig;
  telemetry: TelemetryData;
  onOpenSettings: () => void;
  onToggleChatDrawer?: () => void;
  isChatOpen?: boolean;
  onOpenCommandPalette?: () => void;
  onOpenProcessManager?: () => void;
  onOpenCodeSandbox?: () => void;
  onOpenLiveIntel?: () => void;
  onOpenBriefing?: () => void;
  onOpenVision?: () => void;
  onOpenRadar?: () => void;
  onOpenAgentTown?: () => void;
  onOpenMacros?: () => void;
  onOpenOptimizer?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenNotes?: () => void;
  currentSuitTheme?: SuitTheme;
  onSelectSuitTheme?: (theme: SuitTheme) => void;
  visibility?: HudVisibilityState;
  onTogglePanel?: (panel: keyof HudVisibilityState) => void;
  onToggleZenMode?: () => void;
  isZenMode?: boolean;
  onRestoreAll?: () => void;
  ttsEnabled?: boolean;
  onToggleTts?: () => void;
}

const STATE_LABELS: Record<JarvisState, { label: string; color: string }> = {
  IDLE:      { label: 'STANDBY', color: '#00e8ff' },
  LISTENING: { label: 'LISTENING', color: '#10e890' },
  THINKING:  { label: 'PROCESSING', color: '#f5a524' },
  SPEAKING:  { label: 'SPEAKING', color: '#a855f7' },
  EXECUTING: { label: 'EXECUTING', color: '#4f8eff' },
  ALERT:     { label: 'ALERT', color: '#ff4060' },
  ERROR:     { label: 'ERROR', color: '#ff4060' },
};

export const TopBar: React.FC<TopBarProps> = ({
  state,
  config,
  telemetry,
  onOpenSettings,
  onOpenKnowledgeBase,
  onOpenNotes,
  onOpenVision,
  onOpenRadar,
  onOpenAgentTown,
  currentSuitTheme,
  onSelectSuitTheme
}) => {
  const [currentDateTime, setCurrentDateTime] = useState({ time: '00:00:00', date: '01 JAN 2026', weekday: 'MON' });
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [tickParity, setTickParity] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
      const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      setCurrentDateTime({ time: timeStr, date: dateStr, weekday });
      setTickParity(p => !p);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOnline = telemetry.backendStatus === 'ONLINE';
  const { systemMetrics } = telemetry;
  const themes = getSuitThemeList();

  const battPct = systemMetrics.batteryPercent ?? 100;
  const battPlugged = systemMetrics.batteryPlugged;
  const battColor = battPct < 20 ? '#ff4060' : battPct < 50 ? '#f5a524' : '#10e890';

  const stateInfo = STATE_LABELS[state] ?? STATE_LABELS.IDLE;
  const primaryColor = config.primaryColor || '#00e8ff';

  const [hours, minutes, seconds] = currentDateTime.time.split(':');

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.45rem 1rem',
      background: 'rgba(3,10,26,0.82)',
      borderBottom: `1px solid rgba(0,232,255,0.16)`,
      backdropFilter: 'blur(24px) saturate(1.5)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,232,255,0.06)',
      zIndex: 30,
      position: 'relative',
      flexShrink: 0,
    }}>

      {/* ── LEFT: Brand & Status ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* Logo Block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, rgba(0,232,255,0.15) 0%, rgba(79,142,255,0.08) 100%)`,
            border: `1px solid ${primaryColor}40`,
            borderRadius: '8px',
            boxShadow: `0 0 14px ${primaryColor}30, inset 0 1px 0 rgba(255,255,255,0.06)`,
            flexShrink: 0,
          }}>
            <Zap size={16} style={{ color: primaryColor, filter: `drop-shadow(0 0 4px ${primaryColor})` }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 900,
                fontSize: '1.05rem',
                letterSpacing: '0.12em',
                color: primaryColor,
                textShadow: `0 0 14px ${primaryColor}70`,
              }}>JARVIS</span>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.68rem',
                color: 'rgba(0,232,255,0.75)',
                letterSpacing: '0.10em',
                fontWeight: 700,
                background: 'rgba(0,232,255,0.08)',
                border: '1px solid rgba(0,232,255,0.22)',
                borderRadius: '4px',
                padding: '1px 6px',
              }}>v3.0 SOVEREIGN</span>
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.66rem',
              fontWeight: 600,
              color: 'rgba(180,210,230,0.55)',
              letterSpacing: '0.14em',
              marginTop: '1px',
            }}>MARK-III AUTONOMOUS CORE</div>
          </div>
        </div>

        {/* System Status Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '3px 10px',
          background: isOnline ? 'rgba(16,232,144,0.08)' : 'rgba(255,64,96,0.08)',
          border: `1px solid ${isOnline ? 'rgba(16,232,144,0.35)' : 'rgba(255,64,96,0.35)'}`,
          borderRadius: '20px',
          boxShadow: isOnline ? '0 0 10px rgba(16,232,144,0.15)' : '0 0 10px rgba(255,64,96,0.15)',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: isOnline ? '#10e890' : '#ff4060',
            boxShadow: `0 0 8px ${isOnline ? '#10e890' : '#ff4060'}`,
            animation: isOnline ? 'v3Pulse 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.72rem',
            fontWeight: 700,
            color: isOnline ? '#10e890' : '#ff4060',
            letterSpacing: '0.10em',
          }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>

        {/* State Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '3px 10px',
          background: `${stateInfo.color}14`,
          border: `1px solid ${stateInfo.color}40`,
          borderRadius: '20px',
          boxShadow: `0 0 10px ${stateInfo.color}15`,
        }}>
          <span style={{
            width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
            background: stateInfo.color,
            boxShadow: `0 0 6px ${stateInfo.color}`,
            animation: state !== 'IDLE' ? 'v3Blink 1s step-end infinite' : 'none',
          }} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.72rem',
            fontWeight: 700,
            color: stateInfo.color,
            letterSpacing: '0.10em',
          }}>{stateInfo.label}</span>
        </div>

        {/* V3 Mini System Vitals */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingLeft: '6px', borderLeft: '1px solid rgba(0,232,255,0.14)' }}>
          {/* CPU */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={11} style={{ color: primaryColor, opacity: 0.85 }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: primaryColor, opacity: 0.9 }}>
              {systemMetrics.cpuUsage !== null ? `${systemMetrics.cpuUsage}%` : '--'}
            </span>
          </div>
          {/* Battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {battPlugged ? <BatteryCharging size={11} style={{ color: battColor }} /> : <Battery size={11} style={{ color: battColor }} />}
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: battColor }}>
              {Math.round(battPct)}%
            </span>
          </div>
          {/* Network */}
          <Wifi size={11} style={{ color: isOnline ? primaryColor : '#ff4060', opacity: 0.90 }} />
        </div>
      </div>

      {/* ── CENTER: V3 Clock ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        {/* Main Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontWeight: 700,
            fontSize: '1.30rem',
            letterSpacing: '0.08em',
            color: primaryColor,
            textShadow: `0 0 14px ${primaryColor}60`,
          }}>{hours}</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontWeight: 700,
            fontSize: '1.30rem',
            color: primaryColor,
            opacity: tickParity ? 1 : 0.3,
            transition: 'opacity 0.1s',
            margin: '0 1px',
          }}>:</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontWeight: 700,
            fontSize: '1.30rem',
            letterSpacing: '0.08em',
            color: primaryColor,
            textShadow: `0 0 14px ${primaryColor}60`,
          }}>{minutes}</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontWeight: 700,
            fontSize: '1.30rem',
            color: primaryColor,
            opacity: tickParity ? 1 : 0.3,
            transition: 'opacity 0.1s',
            margin: '0 1px',
          }}>:</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontWeight: 600,
            fontSize: '1.30rem',
            letterSpacing: '0.08em',
            color: primaryColor,
            opacity: 0.75,
          }}>{seconds}</span>
        </div>
        {/* Date Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.62rem',
            color: 'rgba(180,210,230,0.55)',
            letterSpacing: '0.12em',
          }}>{currentDateTime.weekday}</span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(0,232,255,0.30)' }} />
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.62rem',
            color: 'rgba(180,210,230,0.55)',
            letterSpacing: '0.10em',
          }}>{currentDateTime.date}</span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(0,232,255,0.30)' }} />
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.62rem',
            color: 'rgba(0,232,255,0.40)',
            letterSpacing: '0.10em',
          }}>UPTIME: {telemetry.systemUptime}</span>
        </div>
      </div>

      {/* ── RIGHT: Action Buttons Matrix (Ultra-Modern Sci-Fi HUD) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Vision */}
        {onOpenVision && (
          <ActionBtn 
            icon={<Eye size={13} style={{ filter: 'drop-shadow(0 0 4px #00e8ff)' }} />} 
            label="VISION" 
            color="#00e8ff" 
            onClick={onOpenVision} 
            title="Screen Vision & Multimodal Perception" 
          />
        )}

        {/* Radar */}
        {onOpenRadar && (
          <ActionBtn 
            icon={<Radio size={13} style={{ animation: 'v3Spin 6s linear infinite', filter: 'drop-shadow(0 0 4px #10e890)' }} />} 
            label="RADAR" 
            color="#10e890" 
            onClick={onOpenRadar} 
            title="Geospatial Tactical Radar Scanner" 
          />
        )}

        {/* Agent Town */}
        {onOpenAgentTown && (
          <ActionBtn 
            icon={<Bot size={13} style={{ filter: 'drop-shadow(0 0 4px #a855f7)' }} />} 
            label="AGENT TOWN" 
            color="#a855f7" 
            onClick={onOpenAgentTown} 
            title="JARVIS Autonomous Agent Town & Multi-Agent Matrix" 
          />
        )}

        {/* Knowledge Base */}
        {onOpenKnowledgeBase && (
          <ActionBtn 
            icon={<BookOpen size={13} style={{ filter: 'drop-shadow(0 0 4px #4f8eff)' }} />} 
            label="KNOWLEDGE" 
            color="#4f8eff" 
            onClick={onOpenKnowledgeBase} 
            title="Document & Fact Knowledge Base (RAG)" 
          />
        )}

        {/* Notes */}
        {onOpenNotes && (
          <ActionBtn 
            icon={<StickyNote size={13} style={{ filter: 'drop-shadow(0 0 4px #f5a524)' }} />} 
            label="NOTES" 
            color="#f5a524" 
            onClick={onOpenNotes} 
            title="JARVIS Neural Scratchpad Notes" 
          />
        )}

        {/* V3 Suit Theme Selector Capsule */}
        {onSelectSuitTheme && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowThemePicker(p => !p)}
              title="Change Iron Man Suit Theme"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '5px 12px',
                background: showThemePicker 
                  ? `linear-gradient(180deg, ${primaryColor}25 0%, rgba(4, 16, 36, 0.85) 100%)` 
                  : 'linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(4, 16, 36, 0.65) 100%)',
                border: `1px solid ${showThemePicker ? primaryColor : 'rgba(0, 232, 255, 0.25)'}`,
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: showThemePicker 
                  ? `0 0 16px ${primaryColor}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)` 
                  : '0 2px 8px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                transform: showThemePicker ? 'translateY(-1px)' : 'none',
              }}
            >
              {/* Glowing Reactor Orb */}
              <span style={{
                position: 'relative',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: primaryColor,
                boxShadow: `0 0 8px ${primaryColor}, 0 0 14px ${primaryColor}80`,
                display: 'inline-block',
                flexShrink: 0,
              }}>
                <span style={{
                  position: 'absolute',
                  inset: '-3px',
                  borderRadius: '50%',
                  border: `1px solid ${primaryColor}60`,
                  animation: 'v3Pulse 2s infinite',
                }} />
              </span>

              <span style={{
                fontFamily: "'Rajdhani', 'Space Grotesk', sans-serif",
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#edfcff',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: `0 0 8px ${primaryColor}60`,
              }}>
                SUIT
              </span>
            </button>

            {/* Suit Theme Dropdown Menu */}
            {showThemePicker && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'linear-gradient(160deg, rgba(4, 14, 34, 0.98) 0%, rgba(2, 8, 20, 0.99) 100%)',
                border: '1px solid rgba(0, 232, 255, 0.30)',
                borderRadius: '12px',
                padding: '10px',
                zIndex: 500,
                minWidth: '230px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 232, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                animation: 'v3SlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid rgba(0, 232, 255, 0.14)',
                }}>
                  <span style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    color: 'rgba(0, 232, 255, 0.8)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}>
                    ARMOR PROTOCOL // SUIT SELECT
                  </span>
                  <span style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.60rem',
                    color: 'rgba(255, 255, 255, 0.35)',
                  }}>
                    {themes.length} THEMES
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '300px', overflowY: 'auto' }}>
                  {themes.map(theme => {
                    const isCurrent = currentSuitTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => { onSelectSuitTheme(theme.id as SuitTheme); setShowThemePicker(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: isCurrent 
                            ? `linear-gradient(90deg, ${theme.primaryColor}22 0%, rgba(255,255,255,0.02) 100%)` 
                            : 'transparent',
                          border: isCurrent ? `1px solid ${theme.primaryColor}50` : '1px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <span style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: theme.primaryColor,
                          boxShadow: isCurrent ? `0 0 10px ${theme.primaryColor}` : `0 0 4px ${theme.primaryColor}60`,
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontSize: '0.80rem',
                            fontWeight: 700,
                            color: isCurrent ? theme.primaryColor : '#edfcff',
                            letterSpacing: '0.04em',
                          }}>
                            {theme.name}
                          </div>
                          <div style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '0.62rem',
                            color: 'rgba(180, 210, 230, 0.45)',
                          }}>
                            {theme.codename}
                          </div>
                        </div>
                        {isCurrent && (
                          <span style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '0.58rem',
                            color: theme.primaryColor,
                            background: `${theme.primaryColor}18`,
                            padding: '2px 6px',
                            borderRadius: '10px',
                            border: `1px solid ${theme.primaryColor}40`,
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Control Button */}
        <button
          onClick={onOpenSettings}
          title="Open Voice & Subsystem Settings (Ctrl+,)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            background: `linear-gradient(180deg, ${primaryColor}22 0%, rgba(4, 16, 36, 0.8) 100%)`,
            border: `1px solid ${primaryColor}60`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            color: '#edfcff',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: `0 0 14px ${primaryColor}28, inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `linear-gradient(180deg, ${primaryColor}35 0%, rgba(4, 16, 36, 0.95) 100%)`;
            e.currentTarget.style.borderColor = primaryColor;
            e.currentTarget.style.boxShadow = `0 0 22px ${primaryColor}55, inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(180deg, ${primaryColor}22 0%, rgba(4, 16, 36, 0.8) 100%)`;
            e.currentTarget.style.borderColor = `${primaryColor}60`;
            e.currentTarget.style.boxShadow = `0 0 14px ${primaryColor}28, inset 0 1px 0 rgba(255, 255, 255, 0.15)`;
            e.currentTarget.style.transform = 'none';
          }}
        >
          <Sliders size={13} style={{ color: primaryColor, filter: `drop-shadow(0 0 4px ${primaryColor})` }} />
          <span style={{
            fontFamily: "'Rajdhani', 'Space Grotesk', sans-serif",
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#edfcff',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textShadow: `0 0 8px ${primaryColor}50`,
          }}>
            SETTINGS
          </span>
        </button>
      </div>
    </header>
  );
};

/* ── V3 Ultra-Refined Cyber HUD Action Button ── */
const ActionBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
  title?: string;
}> = ({ icon, label, color, onClick, title }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 11px',
        background: hovered 
          ? `linear-gradient(180deg, ${color}22 0%, rgba(4, 16, 36, 0.85) 100%)`
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(4, 16, 36, 0.65) 100%)',
        border: `1px solid ${hovered ? color : 'rgba(0, 232, 255, 0.22)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: hovered 
          ? `0 0 16px ${color}40, inset 0 1px 0 rgba(255, 255, 255, 0.25)` 
          : '0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        transform: hovered ? 'translateY(-1.5px)' : 'none',
      }}
    >
      <span style={{ 
        display: 'flex', 
        alignItems: 'center', 
        color: hovered ? color : `${color}e0`,
        transition: 'color 0.2s ease',
      }}>
        {icon}
      </span>
      <span style={{
        fontFamily: "'Rajdhani', 'Space Grotesk', sans-serif",
        fontSize: '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: hovered ? '#ffffff' : '#e0f4ff',
        textShadow: hovered ? `0 0 8px ${color}` : 'none',
        transition: 'all 0.2s ease',
      }}>
        {label}
      </span>
    </button>
  );
};

