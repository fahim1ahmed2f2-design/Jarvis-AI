import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Bot, 
  Brain, 
  Cpu, 
  Sparkles, 
  Globe, 
  Radio, 
  Zap, 
  Play, 
  Sliders, 
  Calculator,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { JarvisState, TelemetryData, StateVisualConfig, AgentCardInfo, HudVisibilityState } from '../../types/jarvis';
import { fetchMemories, MemoryRecord } from '../../services/api';

interface BottomDashboardGridProps {
  state: JarvisState;
  config: StateVisualConfig;
  telemetry: TelemetryData;
  onSendCommand: (command: string) => void;
  onTriggerVoice: () => void;
  onOpenSettings: () => void;
  visibility: HudVisibilityState;
  onHidePanel: (panel: keyof HudVisibilityState) => void;
  onRestorePanel: (panel: keyof HudVisibilityState) => void;
  onRestoreAllPanels: () => void;
}

interface PanelsCollapsedState {
  systemMonitor: boolean;
  coreSubsystems: boolean;
  memoryInsights: boolean;
  aiProvider: boolean;
  quickActions: boolean;
}

const STORAGE_KEY = 'jarvis_panel_collapse_states';

const loadSavedCollapseState = (): PanelsCollapsedState => {
  const defaultState: PanelsCollapsedState = {
    systemMonitor: false,
    coreSubsystems: false,
    memoryInsights: false,
    aiProvider: false,
    quickActions: false,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        systemMonitor: Boolean(parsed.systemMonitor ?? (localStorage.getItem('systemMonitorCollapsed') === 'true')),
        coreSubsystems: Boolean(parsed.coreSubsystems ?? (localStorage.getItem('coreSubsystemsCollapsed') === 'true')),
        memoryInsights: Boolean(parsed.memoryInsights ?? (localStorage.getItem('memoryInsightsCollapsed') === 'true')),
        aiProvider: Boolean(parsed.aiProvider ?? (localStorage.getItem('aiProviderCollapsed') === 'true')),
        quickActions: Boolean(parsed.quickActions ?? (localStorage.getItem('quickActionsCollapsed') === 'true')),
      };
    }
    
    // Check individual keys fallback
    return {
      systemMonitor: localStorage.getItem('systemMonitorCollapsed') === 'true',
      coreSubsystems: localStorage.getItem('coreSubsystemsCollapsed') === 'true',
      memoryInsights: localStorage.getItem('memoryInsightsCollapsed') === 'true',
      aiProvider: localStorage.getItem('aiProviderCollapsed') === 'true',
      quickActions: localStorage.getItem('quickActionsCollapsed') === 'true',
    };
  } catch {
    return defaultState;
  }
};

const REAL_SUBSYSTEMS: AgentCardInfo[] = [
  { id: 'computer', name: 'Computer Agent v3', description: 'PC window, application & filesystem execution engine', status: 'READY' },
  { id: 'voice', name: 'Voice Subsystem v3', description: 'Microphone STT capture & neural TTS vocal synthesis', status: 'READY' },
  { id: 'ai', name: 'Sovereign Neural Brain', description: 'Intent classification, chain-of-thought LLM reasoning', status: 'READY' },
  { id: 'memory', name: 'Memory Store v3', description: 'Persistent contextual preference & fact storage', status: 'READY' },
  { id: 'tasks', name: 'Autonomous Task Engine', description: 'Multi-step goal pipeline with checkpoint verification', status: 'READY' },
  { id: 'tools', name: 'Tool Registry v3', description: '66+ sandboxed operational PC subroutines online', status: 'READY' },
];

export const BottomDashboardGrid: React.FC<BottomDashboardGridProps> = ({
  state,
  config,
  telemetry,
  onSendCommand,
  onTriggerVoice,
  onOpenSettings,
  visibility,
  onHidePanel,
  onRestorePanel,
  onRestoreAllPanels
}) => {
  const [recentMemories, setRecentMemories] = useState<MemoryRecord[]>([]);
  const [collapsedPanels, setCollapsedPanels] = useState<PanelsCollapsedState>(loadSavedCollapseState);

  const togglePanel = (panel: keyof PanelsCollapsedState) => {
    setCollapsedPanels((prev) => {
      const nextVal = !prev[panel];
      const updated = { ...prev, [panel]: nextVal };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(`${panel}Collapsed`, String(nextVal));
      } catch {
        // non-fatal localStorage error
      }
      return updated;
    });
  };

  useEffect(() => {
    const loadMemories = async () => {
      try {
        const mems = await fetchMemories();
        if (mems?.memories && mems.memories.length > 0) {
          setRecentMemories(mems.memories.slice(0, 2));
        }
      } catch {
        // non-fatal
      }
    };
    loadMemories();
  }, [telemetry.memoryCount]);

  const isOnline = telemetry.backendStatus === 'ONLINE';
  const isLlmConnected = telemetry.isConfigured && isOnline;
  const { systemMetrics } = telemetry;

  const getSubsystemStatus = (agentId: string): 'READY' | 'ACTIVE' | 'OFFLINE' => {
    if (!isOnline) return 'OFFLINE';
    if (agentId === 'computer' && state === 'EXECUTING') return 'ACTIVE';
    if (agentId === 'voice' && (state === 'LISTENING' || state === 'SPEAKING')) return 'ACTIVE';
    if (agentId === 'ai' && state === 'THINKING') return 'ACTIVE';
    return 'READY';
  };

  const allCardDefs = [
    { key: 'systemMonitor' as const, label: 'SYSTEM MONITOR', icon: Cpu },
    { key: 'coreSubsystems' as const, label: 'CORE SUBSYSTEMS', icon: Bot },
    { key: 'memoryInsights' as const, label: 'MEMORY INSIGHTS', icon: Brain },
    { key: 'aiProvider' as const, label: 'AI PROVIDER', icon: Sparkles },
    { key: 'quickActions' as const, label: 'QUICK ACTIONS', icon: Zap }
  ];

  const hiddenCards = allCardDefs.filter(c => !visibility[c.key]);
  const visibleCount = 5 - hiddenCards.length;

  if (visibleCount === 0) {
    return (
      <div className="hud-cards-empty-restore-bar font-mono">
        <span className="restore-strip-label" style={{ color: config.primaryColor }}>
          // 5 BOTTOM PANELS HIDDEN [FREE VIEW]
        </span>
        <div className="restore-chips-row">
          {hiddenCards.map(c => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                className="hud-restore-chip-btn font-mono"
                onClick={() => onRestorePanel(c.key)}
                title={`Restore ${c.label}`}
              >
                <Icon className="w-3 h-3" style={{ color: config.primaryColor }} />
                <span>+ {c.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="hud-restore-all-btn font-mono"
            onClick={onRestoreAllPanels}
          >
            RESTORE ALL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jarvis-bottom-dashboard-wrapper">
      {hiddenCards.length > 0 && (
        <div className="hud-cards-restore-strip font-mono">
          <span className="restore-strip-label" style={{ color: config.primaryColor }}>
            HIDDEN PANELS ({hiddenCards.length}):
          </span>
          <div className="restore-chips-row">
            {hiddenCards.map(c => {
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  className="hud-restore-chip-btn font-mono"
                  onClick={() => onRestorePanel(c.key)}
                  title={`Restore ${c.label}`}
                >
                  <Icon className="w-3 h-3" style={{ color: config.primaryColor }} />
                  <span>+ {c.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="hud-restore-all-btn font-mono"
              onClick={onRestoreAllPanels}
            >
              RESTORE ALL
            </button>
          </div>
        </div>
      )}

      <section 
        className="jarvis-bottom-dashboard-grid"
        style={{ gridTemplateColumns: `repeat(${visibleCount}, 1fr)` }}
      >
        {/* 1. REAL SYSTEM MONITOR */}
        {visibility.systemMonitor && (
          <div className={`hud-card card-system-monitor ${collapsedPanels.systemMonitor ? 'is-collapsed' : 'is-expanded'}`}>
            <div className="card-header">
              <div className="card-title-group">
                <Cpu className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                <span className="card-title font-mono">SYSTEM MONITOR</span>
              </div>
              <div className="card-header-actions">
                <span className="card-badge font-mono" style={{ color: config.primaryColor }}>
                  LIVE
                </span>
                <button 
                  type="button"
                  className="hud-panel-collapse-btn"
                  onClick={() => togglePanel('systemMonitor')}
                  aria-label={collapsedPanels.systemMonitor ? 'Expand System Monitor' : 'Collapse System Monitor'}
                  aria-expanded={!collapsedPanels.systemMonitor}
                  title={collapsedPanels.systemMonitor ? 'Expand System Monitor' : 'Collapse System Monitor'}
                >
                  {collapsedPanels.systemMonitor ? (
                    <ChevronUp className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  )}
                </button>
                <button 
                  type="button"
                  className="hud-panel-close-btn"
                  onClick={() => onHidePanel('systemMonitor')}
                  aria-label="Hide System Monitor"
                  title="Hide System Monitor (Cross)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className={`hud-card-body ${collapsedPanels.systemMonitor ? 'is-collapsed' : 'is-expanded'}`}>
              <div className="hud-card-body-inner">
                <div className="card-content system-metrics-grid font-mono">
                  <div className="metric-box">
                    <span className="metric-name">CPU LOAD</span>
                    <span className="metric-val font-mono" style={{ color: config.primaryColor }}>
                      {systemMetrics.cpuUsage !== null ? `${systemMetrics.cpuUsage}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-name">RAM USED</span>
                    <span className="metric-val font-mono" style={{ color: '#10b981' }}>
                      {systemMetrics.ramUsedGb !== null ? `${systemMetrics.ramUsedGb}/${systemMetrics.ramTotalGb}G` : 'N/A'}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-name">DISK (C:)</span>
                    <span className="metric-val font-mono" style={{ color: config.primaryColor }}>
                      {systemMetrics.diskPercent !== null ? `${systemMetrics.diskPercent}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="metric-box">
                    <span className="metric-name">THREADS</span>
                    <span className="metric-val font-mono" style={{ color: config.primaryColor }}>
                      {systemMetrics.activeThreads !== null ? systemMetrics.activeThreads : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="card-footer-note font-mono">
                  <span>{systemMetrics.cpuBrand || systemMetrics.osName || 'HOST: 127.0.0.1:8000'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. REAL ACTIVE SUBSYSTEMS */}
        {visibility.coreSubsystems && (
          <div className={`hud-card card-active-agents ${collapsedPanels.coreSubsystems ? 'is-collapsed' : 'is-expanded'}`}>
            <div className="card-header">
              <div className="card-title-group">
                <Bot className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                <span className="card-title font-mono">CORE SUBSYSTEMS</span>
              </div>
              <div className="card-header-actions">
                <span className="card-badge font-mono" style={{ color: '#10b981' }}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                <button 
                  type="button"
                  className="hud-panel-collapse-btn"
                  onClick={() => togglePanel('coreSubsystems')}
                  aria-label={collapsedPanels.coreSubsystems ? 'Expand Core Subsystems' : 'Collapse Core Subsystems'}
                  aria-expanded={!collapsedPanels.coreSubsystems}
                  title={collapsedPanels.coreSubsystems ? 'Expand Core Subsystems' : 'Collapse Core Subsystems'}
                >
                  {collapsedPanels.coreSubsystems ? (
                    <ChevronUp className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  )}
                </button>
                <button 
                  type="button"
                  className="hud-panel-close-btn"
                  onClick={() => onHidePanel('coreSubsystems')}
                  aria-label="Hide Core Subsystems"
                  title="Hide Core Subsystems (Cross)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className={`hud-card-body ${collapsedPanels.coreSubsystems ? 'is-collapsed' : 'is-expanded'}`}>
              <div className="hud-card-body-inner">
                <div className="card-content agents-mini-grid font-mono">
                  {REAL_SUBSYSTEMS.map((agent) => {
                    const currentStatus = getSubsystemStatus(agent.id);
                    const isActive = currentStatus === 'ACTIVE';
                    const isOffline = currentStatus === 'OFFLINE';

                    return (
                      <div 
                        key={agent.id} 
                        className={`agent-mini-chip ${isActive ? 'is-active' : ''}`}
                        style={{
                          borderColor: isActive ? '#f59e0b' : isOffline ? '#ef4444' : 'rgba(0, 240, 255, 0.15)',
                          backgroundColor: isActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(6, 18, 36, 0.4)'
                        }}
                      >
                        <div className="chip-left">
                          <span 
                            className="chip-dot" 
                            style={{ 
                              backgroundColor: isActive ? '#f59e0b' : isOffline ? '#ef4444' : '#10b981',
                              boxShadow: `0 0 6px ${isActive ? '#f59e0b' : isOffline ? '#ef4444' : '#10b981'}`
                            }} 
                          />
                          <span className="chip-name">{agent.name}</span>
                        </div>
                        <span 
                          className="chip-status"
                          style={{ color: isActive ? '#f59e0b' : isOffline ? '#ef4444' : '#10b981' }}
                        >
                          {currentStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. REAL MEMORY INSIGHTS */}
        {visibility.memoryInsights && (
          <div className={`hud-card card-memory-insights ${collapsedPanels.memoryInsights ? 'is-collapsed' : 'is-expanded'}`}>
            <div className="card-header">
              <div className="card-title-group">
                <Brain className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                <span className="card-title font-mono">MEMORY INSIGHTS</span>
              </div>
              <div className="card-header-actions">
                <span className="card-badge font-mono" style={{ color: config.primaryColor }}>
                  {telemetry.memoryCount} STORED
                </span>
                <button 
                  type="button"
                  className="hud-panel-collapse-btn"
                  onClick={() => togglePanel('memoryInsights')}
                  aria-label={collapsedPanels.memoryInsights ? 'Expand Memory Insights' : 'Collapse Memory Insights'}
                  aria-expanded={!collapsedPanels.memoryInsights}
                  title={collapsedPanels.memoryInsights ? 'Expand Memory Insights' : 'Collapse Memory Insights'}
                >
                  {collapsedPanels.memoryInsights ? (
                    <ChevronUp className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  )}
                </button>
                <button 
                  type="button"
                  className="hud-panel-close-btn"
                  onClick={() => onHidePanel('memoryInsights')}
                  aria-label="Hide Memory Insights"
                  title="Hide Memory Insights (Cross)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className={`hud-card-body ${collapsedPanels.memoryInsights ? 'is-collapsed' : 'is-expanded'}`}>
              <div className="hud-card-body-inner">
                <div className="card-content memory-details font-mono">
                  <div className="memory-stat-row">
                    <span className="stat-label">STORED MEMORIES:</span>
                    <span className="stat-value" style={{ color: config.primaryColor }}>
                      {telemetry.memoryCount}
                    </span>
                  </div>

                  <div className="recent-memories-list">
                    <span className="recent-heading">RECENT ENTRIES:</span>
                    {recentMemories.length > 0 ? (
                      recentMemories.map((m) => (
                        <div key={m.id} className="recent-memory-item">
                          <span className="memory-cat">[{m.category || 'CONTEXT'}]</span> {m.content.slice(0, 40)}...
                        </div>
                      ))
                    ) : (
                      <div className="recent-memory-item text-dim">
                        No memories stored yet. Tell JARVIS a preference to save it.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. REAL LLM STATUS */}
        {visibility.aiProvider && (
          <div className={`hud-card card-llm-status ${collapsedPanels.aiProvider ? 'is-collapsed' : 'is-expanded'}`}>
            <div className="card-header">
              <div className="card-title-group">
                <Sparkles className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                <span className="card-title font-mono">AI PROVIDER</span>
              </div>
              <div className="card-header-actions">
                <span 
                  className="card-badge font-mono"
                  style={{ color: isLlmConnected ? '#10b981' : '#f59e0b' }}
                >
                  {isLlmConnected ? 'CONNECTED' : 'NOT CONFIGURED'}
                </span>
                <button 
                  type="button"
                  className="hud-panel-collapse-btn"
                  onClick={() => togglePanel('aiProvider')}
                  aria-label={collapsedPanels.aiProvider ? 'Expand AI Provider' : 'Collapse AI Provider'}
                  aria-expanded={!collapsedPanels.aiProvider}
                  title={collapsedPanels.aiProvider ? 'Expand AI Provider' : 'Collapse AI Provider'}
                >
                  {collapsedPanels.aiProvider ? (
                    <ChevronUp className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  )}
                </button>
                <button 
                  type="button"
                  className="hud-panel-close-btn"
                  onClick={() => onHidePanel('aiProvider')}
                  aria-label="Hide AI Provider"
                  title="Hide AI Provider (Cross)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className={`hud-card-body ${collapsedPanels.aiProvider ? 'is-collapsed' : 'is-expanded'}`}>
              <div className="hud-card-body-inner">
                <div className="card-content llm-details font-mono">
                  <div className="llm-provider-row">
                    <span className="provider-name">PROVIDER:</span>
                    <span className="provider-val" style={{ color: config.primaryColor }}>OpenAI</span>
                  </div>

                  <div className="llm-provider-row">
                    <span className="provider-name">MODEL:</span>
                    <span className="provider-val" style={{ color: config.primaryColor }}>
                      {telemetry.activeModel}
                    </span>
                  </div>

                  <div className="llm-provider-row">
                    <span className="provider-name">KEY STATUS:</span>
                    <span 
                      className="provider-val"
                      style={{ color: isLlmConnected ? '#10b981' : '#f59e0b' }}
                    >
                      {isLlmConnected ? '● Ready for reasoning' : '● Add key in Settings'}
                    </span>
                  </div>
                </div>

                <button 
                  className="llm-configure-btn font-mono"
                  onClick={onOpenSettings}
                >
                  <Sliders className="w-3 h-3" />
                  <span>CONFIGURE API</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. 100% REAL QUICK COMMANDS */}
        {visibility.quickActions && (
          <div className={`hud-card card-quick-commands ${collapsedPanels.quickActions ? 'is-collapsed' : 'is-expanded'}`}>
            <div className="card-header">
              <div className="card-title-group">
                <Zap className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                <span className="card-title font-mono">QUICK ACTIONS</span>
              </div>
              <div className="card-header-actions">
                <span className="card-badge font-mono" style={{ color: config.primaryColor }}>
                  REAL PC TOOLS
                </span>
                <button 
                  type="button"
                  className="hud-panel-collapse-btn"
                  onClick={() => togglePanel('quickActions')}
                  aria-label={collapsedPanels.quickActions ? 'Expand Quick Actions' : 'Collapse Quick Actions'}
                  aria-expanded={!collapsedPanels.quickActions}
                  title={collapsedPanels.quickActions ? 'Expand Quick Actions' : 'Collapse Quick Actions'}
                >
                  {collapsedPanels.quickActions ? (
                    <ChevronUp className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                  )}
                </button>
                <button 
                  type="button"
                  className="hud-panel-close-btn"
                  onClick={() => onHidePanel('quickActions')}
                  aria-label="Hide Quick Actions"
                  title="Hide Quick Actions (Cross)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className={`hud-card-body ${collapsedPanels.quickActions ? 'is-collapsed' : 'is-expanded'}`}>
              <div className="hud-card-body-inner">
                <div className="card-content quick-actions-grid font-mono">
                  <button 
                    className="quick-action-btn"
                    onClick={() => onSendCommand('Open YouTube')}
                    title="Launch YouTube in default browser"
                  >
                    <Play className="w-3 h-3" />
                    <span>Open YouTube</span>
                  </button>

                  <button 
                    className="quick-action-btn"
                    onClick={() => onSendCommand('Open Chrome')}
                    title="Launch Google Chrome"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Open Chrome</span>
                  </button>

                  <button 
                    className="quick-action-btn"
                    onClick={() => onSendCommand('Open Calculator')}
                    title="Launch Windows Calculator"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>Calculator</span>
                  </button>

                  <button 
                    className="quick-action-btn"
                    onClick={() => onSendCommand('Open Downloads')}
                    title="Open Downloads folder in File Explorer"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>Downloads</span>
                  </button>

                  <button 
                    className="quick-action-btn"
                    onClick={() => onSendCommand('What CPU and RAM do I have?')}
                    title="Retrieve actual hardware metrics"
                  >
                    <Activity className="w-3 h-3" />
                    <span>System Specs</span>
                  </button>

                  <button 
                    className="quick-action-btn"
                    onClick={onTriggerVoice}
                    title="Activate microphone speech recognition"
                  >
                    <Radio className="w-3 h-3" />
                    <span>Start Voice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};


