import React from 'react';
import { Bot, Sparkles, X, ChevronRight, Activity, Shield, Users, Layers, Play, Pause, Octagon, ArrowLeft } from 'lucide-react';
import { TownSector, TownMetrics } from './types';

interface AgentTownHeaderProps {
  metrics: TownMetrics;
  selectedSector: TownSector;
  onSelectSector: (sector: TownSector) => void;
  isInfoPanelOpen: boolean;
  onToggleInfoPanel: () => void;
  onOpenNewTaskModal?: () => void;
  onOpenBDNewsModal?: () => void;
  onPauseAllTasks?: () => void;
  onOpenCancelAllModal?: () => void;
  onClose: () => void;
  primaryColor?: string;
}

export const AgentTownHeader: React.FC<AgentTownHeaderProps> = ({
  metrics,
  selectedSector,
  onSelectSector,
  isInfoPanelOpen,
  onToggleInfoPanel,
  onOpenNewTaskModal,
  onOpenBDNewsModal,
  onPauseAllTasks,
  onOpenCancelAllModal,
  onClose,
  primaryColor = '#a855f7'
}) => {
  const sectors: { id: TownSector; label: string }[] = [
    { id: 'ALL', label: 'ALL SECTORS' },
    { id: 'COMMAND', label: 'COMMAND // DAVE' },
    { id: 'RESEARCH', label: 'RESEARCH // ALICE' },
    { id: 'OPERATIONS', label: 'OPERATIONS // BOB' },
    { id: 'KNOWLEDGE', label: 'KNOWLEDGE // CAROL' }
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
        background: 'linear-gradient(180deg, rgba(4, 10, 30, 0.98) 0%, rgba(2, 6, 20, 0.98) 100%)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        zIndex: 20,
        flexShrink: 0,
        gap: '16px',
        flexWrap: 'wrap'
      }}
    >
      {/* Left: Branding & Core Telemetry Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onClose}
          title="Return to Main JARVIS Dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: 'rgba(255, 255, 255, 0.75)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.66rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#00e8ff';
            e.currentTarget.style.borderColor = '#00e8ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }}
        >
          <ArrowLeft size={12} />
          <span>BACK TO JARVIS</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${primaryColor}35 0%, rgba(0, 232, 255, 0.25) 100%)`,
              border: `1px solid ${primaryColor}80`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 16px ${primaryColor}40`
            }}
          >
            <Bot size={18} style={{ color: '#ffffff', filter: `drop-shadow(0 0 6px ${primaryColor})` }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.96rem',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  color: '#ffffff',
                  textShadow: `0 0 10px ${primaryColor}80`
                }}
              >
                AGENT TOWN
              </span>
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.62rem',
                  color: '#10e890',
                  background: 'rgba(16, 232, 144, 0.12)',
                  border: '1px solid rgba(16, 232, 144, 0.35)',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10e890', boxShadow: '0 0 6px #10e890' }} />
                ● ONLINE
              </span>
            </div>

            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.60rem',
                color: 'rgba(216, 180, 254, 0.75)',
                display: 'flex',
                gap: '8px',
                marginTop: '1px'
              }}
            >
              <span>CORE MATRIX // 4 AGENTS</span>
              <span>•</span>
              <span>Active: {metrics.activeAgents}</span>
              <span>•</span>
              <span>Tasks: {metrics.currentTasks}</span>
              <span>•</span>
              <span>System: NORMAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Global Task Controls & New Task Primary Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onOpenBDNewsModal && (
          <button
            onClick={onOpenBDNewsModal}
            title="Open Bangladesh Breaking News & Agent Town Debate Hub"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(16, 232, 144, 0.25) 100%)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>🇧🇩</span>
            <span>BD BREAKING NEWS</span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
                animation: 'v3Pulse 1.2s infinite'
              }}
            />
          </button>
        )}

        {onOpenNewTaskModal && (
          <button
            onClick={onOpenNewTaskModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: `linear-gradient(135deg, ${primaryColor}35 0%, rgba(0, 232, 255, 0.3) 100%)`,
              border: `1px solid ${primaryColor}90`,
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              boxShadow: `0 0 16px ${primaryColor}40`,
              transition: 'all 0.15s ease'
            }}
          >
            <Play size={11} color="#00e8ff" />
            <span>NEW TASK</span>
          </button>
        )}


        {onPauseAllTasks && (
          <button
            onClick={onPauseAllTasks}
            title="Pause all active tasks in Agent Town"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              background: 'rgba(245, 165, 36, 0.15)',
              border: '1px solid rgba(245, 165, 36, 0.4)',
              borderRadius: '6px',
              color: '#f5a524',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.62rem',
              cursor: 'pointer'
            }}
          >
            <Pause size={10} />
            <span>PAUSE ALL</span>
          </button>
        )}

        {onOpenCancelAllModal && (
          <button
            onClick={onOpenCancelAllModal}
            title="Cancel all active tasks in Agent Town"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              background: 'rgba(255, 64, 96, 0.15)',
              border: '1px solid rgba(255, 64, 96, 0.4)',
              borderRadius: '6px',
              color: '#ff4060',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.62rem',
              cursor: 'pointer'
            }}
          >
            <Octagon size={10} />
            <span>CANCEL ALL</span>
          </button>
        )}
      </div>

      {/* Right: Sector Filters & Panel Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            background: 'rgba(2, 6, 18, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px'
          }}
        >
          {sectors.map((sector) => {
            const isActive = selectedSector === sector.id;
            return (
              <button
                key={sector.id}
                onClick={() => onSelectSector(sector.id)}
                style={{
                  padding: '4px 8px',
                  background: isActive ? `linear-gradient(135deg, ${primaryColor}40 0%, rgba(0, 232, 255, 0.25) 100%)` : 'transparent',
                  border: isActive ? `1px solid ${primaryColor}70` : '1px solid transparent',
                  borderRadius: '4px',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.58rem',
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {sector.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onToggleInfoPanel}
          title={isInfoPanelOpen ? 'Collapse Agent Panel' : 'Expand Agent Panel'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            background: isInfoPanelOpen ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isInfoPanelOpen ? primaryColor : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '6px',
            color: isInfoPanelOpen ? '#d8b4fe' : 'rgba(255, 255, 255, 0.65)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.62rem',
            cursor: 'pointer'
          }}
        >
          <Layers size={11} />
          <span>INSPECTOR</span>
        </button>
      </div>
    </header>
  );
};
