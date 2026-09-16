/**
 * JARVIS Agent Town v4.0 Sovereign — Ultra-Modern Sci-Fi Cyberpunk Header Bar
 * Elevated with rich aesthetics, neon lighting selectors, speed governors, and multi-view navigation.
 */

import React from 'react';
import { AgentTownMember, AtmosphereMode, SimulationSpeed, TownViewTab } from '../../types';
import { RotateCw, Sparkles, Sun, Moon, Zap, Activity, Globe, MessageSquare, Plus, X } from 'lucide-react';
import { soundFx } from '../../../../services/soundFxService';

interface PixelTownHeaderProps {
  agents: AgentTownMember[];
  selectedAgentId: string | null;
  activeTab: TownViewTab;
  onSelectTab: (tab: TownViewTab) => void;
  onSelectAgent: (agent: AgentTownMember) => void;
  atmosphere?: AtmosphereMode;
  onToggleAtmosphere?: (mode: AtmosphereMode) => void;
  simulationSpeed?: SimulationSpeed;
  onChangeSpeed?: (speed: SimulationSpeed) => void;
  onOpenNewTaskModal?: () => void;
  onRefresh?: () => void;
  onOpenBDNews?: () => void;
  onClose?: () => void;
  primaryColor?: string;
}

export const PixelTownHeader: React.FC<PixelTownHeaderProps> = ({
  agents,
  selectedAgentId,
  activeTab,
  onSelectTab,
  onSelectAgent,
  atmosphere = 'NIGHT',
  onToggleAtmosphere,
  simulationSpeed = 1,
  onChangeSpeed,
  onOpenNewTaskModal,
  onRefresh,
  onOpenBDNews,
  onClose,
  primaryColor = '#00e8ff'
}) => {
  const activeWorkingCount = agents.filter((a) => a.status === 'WORKING' || a.status === 'THINKING').length;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 18px',
        background: 'linear-gradient(90deg, rgba(4, 9, 24, 0.98) 0%, rgba(10, 18, 42, 0.98) 50%, rgba(4, 9, 24, 0.98) 100%)',
        borderBottom: `1px solid ${primaryColor}40`,
        boxShadow: `0 4px 25px rgba(0, 0, 0, 0.7), inset 0 -1px 0 ${primaryColor}20`,
        zIndex: 30,
        position: 'relative'
      }}
    >
      {/* ── LEFT: AGENT TOWN v4 SOVEREIGN BADGE & TELEMETRY ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            background: 'linear-gradient(135deg, rgba(0, 232, 255, 0.18) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: `1px solid ${primaryColor}`,
            borderRadius: '7px',
            boxShadow: `0 0 15px ${primaryColor}35`,
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.90rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '0.08em'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: primaryColor,
              boxShadow: `0 0 10px ${primaryColor}`,
              animation: 'pulse 1.5s infinite'
            }}
          />
          <span>AGENT TOWN</span>
          <span
            style={{
              background: `${primaryColor}30`,
              color: primaryColor,
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: 900
            }}
          >
            v4.0 SOVEREIGN
          </span>
        </div>

        {/* Live Population & Active Load Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.68rem',
            color: 'rgba(255, 255, 255, 0.7)',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px 8px',
            borderRadius: '5px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Activity size={12} style={{ color: '#10b981' }} />
          <span>{agents.length} AGENTS</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
          <span style={{ color: activeWorkingCount > 0 ? '#00e8ff' : '#94a3b8' }}>
            {activeWorkingCount} ACTIVE
          </span>
        </div>
      </div>

      {/* ── CENTER: MULTI-VIEW TABS & AGENT QUICK MATRIX ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Navigation Tabs (5 Views) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(2, 6, 18, 0.85)',
            border: '1px solid rgba(0, 232, 255, 0.25)',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px'
          }}
        >
          {[
            { id: 'agents', label: 'CAMPUS 2.5D', icon: '🏙️' },
            { id: 'visual_hub', label: 'TACTICAL HUB', icon: '⚡' },
            { id: 'rooms', label: 'SECTOR ROOMS', icon: '🏛️' },
            { id: 'news', label: 'BD NEWSROOM', icon: '🇧🇩' },
            { id: 'social', label: 'OFFICE LIFE', icon: '🌐' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClick();
                  if (tab.id === 'news') {
                    onOpenBDNews?.();
                  } else {
                    onSelectTab(tab.id as TownViewTab);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(0, 232, 255, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)'
                    : 'transparent',
                  border: isActive ? `1px solid ${primaryColor}` : '1px solid transparent',
                  borderRadius: '6px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 10px ${primaryColor}40` : 'none'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Character Headshot Quick Buttons (ALL 9 Agents) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(2, 6, 18, 0.6)',
            padding: '2px 4px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {agents.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            const hairColor =
              agent.id === 'agent-jarvis'
                ? '#eab308'
                : agent.id === 'agent-alice'
                ? '#00e8ff'
                : agent.id === 'agent-bob'
                ? '#f97316'
                : agent.id === 'agent-carol'
                ? '#a855f7'
                : agent.id === 'agent-dave'
                ? '#10b981'
                : agent.id === 'agent-tuly'
                ? '#ec4899'
                : agent.id === 'agent-jonson'
                ? '#ef4444'
                : agent.id === 'agent-mob'
                ? '#f59e0b'
                : '#3b82f6';

            return (
              <button
                key={agent.id}
                onClick={() => {
                  soundFx.playClick();
                  onSelectAgent(agent);
                }}
                title={`${agent.name} — ${agent.role} (${agent.status})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 6px',
                  background: isSelected ? `${primaryColor}28` : 'rgba(30, 41, 59, 0.6)',
                  border: `1px solid ${isSelected ? primaryColor : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 0 8px ${primaryColor}40` : 'none'
                }}
              >
                <div
                  style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '3px',
                    background: hairColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.52rem',
                    color: '#000000',
                    fontWeight: 900
                  }}
                >
                  {agent.name.charAt(0)}
                </div>

                <span
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.66rem',
                    color: isSelected ? '#ffffff' : '#cbd5e1',
                    fontWeight: isSelected ? 700 : 500
                  }}
                >
                  {agent.name}
                </span>

                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: agent.status === 'WORKING' ? '#00e8ff' : agent.status === 'THINKING' ? '#a855f7' : '#10b981',
                    boxShadow: `0 0 5px ${agent.status === 'WORKING' ? '#00e8ff' : '#10b981'}`
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: ATMOSPHERE / SPEED / DISPATCH / EXIT ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Atmosphere Mode Selector */}
        {onToggleAtmosphere && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(2, 6, 18, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '2px'
            }}
          >
            {(['DAY', 'DUSK', 'NIGHT', 'MATRIX'] as AtmosphereMode[]).map((mode) => {
              const isCurr = atmosphere === mode;
              const icons = { DAY: '☀️', DUSK: '🌆', NIGHT: '🌙', MATRIX: '⚡' };
              return (
                <button
                  key={mode}
                  onClick={() => onToggleAtmosphere(mode)}
                  title={`Campus Atmosphere: ${mode}`}
                  style={{
                    padding: '3px 6px',
                    background: isCurr ? `${primaryColor}30` : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    color: isCurr ? primaryColor : 'rgba(255,255,255,0.4)',
                    fontWeight: isCurr ? 800 : 500
                  }}
                >
                  {icons[mode]}
                </button>
              );
            })}
          </div>
        )}

        {/* Simulation Speed Governor */}
        {onChangeSpeed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(2, 6, 18, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '2px'
            }}
          >
            {([1, 2, 4] as SimulationSpeed[]).map((spd) => {
              const isCurr = simulationSpeed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => onChangeSpeed(spd)}
                  title={`Simulation Speed: ${spd}x`}
                  style={{
                    padding: '2px 6px',
                    background: isCurr ? `${primaryColor}30` : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    color: isCurr ? primaryColor : 'rgba(255,255,255,0.5)',
                    fontWeight: isCurr ? 800 : 500
                  }}
                >
                  {spd}x
                </button>
              );
            })}
          </div>
        )}

        {/* 1-Click New Task Dispatcher Button */}
        {onOpenNewTaskModal && (
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenNewTaskModal();
            }}
            title="Deploy Universal Task or Team Orchestration"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              background: 'linear-gradient(135deg, rgba(0, 232, 255, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)',
              border: `1px solid ${primaryColor}`,
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.80rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 0 12px ${primaryColor}40`,
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={13} style={{ color: primaryColor }} />
            <span>NEW TASK</span>
          </button>
        )}

        {/* Refresh Camera / Campus Button */}
        <button
          onClick={onRefresh}
          title="Reset Camera & Recalibrate Matrix"
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(71, 85, 105, 0.6)',
            borderRadius: '6px',
            padding: '6px',
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <RotateCw size={13} />
        </button>

        {/* Exit Modal Button */}
        {onClose && (
          <button
            onClick={onClose}
            title="Exit Agent Town"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              padding: '6px',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    </header>
  );
};
