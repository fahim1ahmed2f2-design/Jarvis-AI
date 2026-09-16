/**
 * JARVIS Agent Town v4.0 Sovereign — Retro Pixel & Cyber-Glass Footer Status Bar
 * Displays live cluster load, active agent telemetry, collaborative neural links, and quick directive dispatch.
 */

import React from 'react';
import { AgentTownMember, TownMetrics, AtmosphereMode, SimulationSpeed } from '../../types';
import { Sparkles, Users, Zap, MessageSquare, Network, Database, Cpu, ShieldCheck } from 'lucide-react';

interface PixelTownFooterProps {
  agents: AgentTownMember[];
  metrics: TownMetrics;
  atmosphere?: AtmosphereMode;
  simulationSpeed?: SimulationSpeed;
  onOpenChat?: () => void;
  primaryColor?: string;
}

export const PixelTownFooter: React.FC<PixelTownFooterProps> = ({
  agents,
  metrics,
  atmosphere = 'NIGHT',
  simulationSpeed = 1,
  onOpenChat,
  primaryColor = '#00e8ff'
}) => {
  const busyCount = agents.filter((a) => a.status === 'WORKING' || a.status === 'THINKING').length;
  const activePercent = Math.min(100, Math.round((busyCount / (agents.length || 1)) * 100));

  // Compute total neural load across all agents
  const totalLoad = Math.min(100, Math.round(agents.reduce((acc, a) => acc + (a.neuralLoad || 20), 0) / (agents.length || 1)));

  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 18px',
        background: 'linear-gradient(90deg, rgba(4, 9, 24, 0.98) 0%, rgba(10, 18, 42, 0.98) 50%, rgba(4, 9, 24, 0.98) 100%)',
        borderTop: `1px solid ${primaryColor}30`,
        boxShadow: `0 -4px 20px rgba(0, 0, 0, 0.6)`,
        zIndex: 30,
        position: 'relative'
      }}
    >
      {/* ── LEFT: CLUSTER STATUS & MODEL & LOAD GAUGE ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Sovereign Online Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 9px',
            background: `${primaryColor}18`,
            border: `1px solid ${primaryColor}`,
            borderRadius: '6px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.70rem',
            color: primaryColor,
            fontWeight: 800
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: primaryColor,
              boxShadow: `0 0 8px ${primaryColor}`
            }}
          />
          SOVEREIGN CLUSTER ONLINE
        </div>

        {/* Multi-Model Brain Engine */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(71, 85, 105, 0.6)',
            borderRadius: '6px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.68rem',
            color: '#e2e8f0'
          }}
        >
          <Sparkles size={11} style={{ color: primaryColor }} />
          <span>AUTONOMOUS AGENT ORCHESTRATOR v4</span>
        </div>

        {/* Neural Load Meter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 9px',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(71, 85, 105, 0.6)',
            borderRadius: '6px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.68rem',
            color: '#94a3b8'
          }}
        >
          <Cpu size={12} style={{ color: '#10b981' }} />
          <span style={{ color: '#cbd5e1', fontWeight: 700 }}>LOAD</span>
          <div
            style={{
              width: '60px',
              height: '6px',
              background: '#0f172a',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                width: `${totalLoad}%`,
                height: '100%',
                background: totalLoad > 75 ? '#ef4444' : totalLoad > 45 ? '#f59e0b' : '#00e8ff',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <span style={{ color: '#00e8ff', fontWeight: 700 }}>{totalLoad}%</span>
        </div>
      </div>

      {/* ── RIGHT: AGENT CAPACITY & ACTIVE CONNECTIONS & DIRECTIVE DISPATCH ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Total Agents Active Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(71, 85, 105, 0.6)',
            borderRadius: '6px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.68rem',
            color: '#e2e8f0'
          }}
        >
          <Users size={12} style={{ color: '#94a3b8' }} />
          <span>{agents.length} AGENTS READY</span>
        </div>

        {/* Busy / Deep Thinking Count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(71, 85, 105, 0.6)',
            borderRadius: '6px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.68rem',
            color: '#e2e8f0'
          }}
        >
          <Zap size={12} style={{ color: busyCount > 0 ? '#00e8ff' : '#94a3b8' }} />
          <span>{busyCount} ACTIVE TASKS</span>
        </div>

        {/* Quick Broadcast Directive Button */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            title="Open Universal Broadcast & Task Dispatch"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: 'linear-gradient(135deg, rgba(0, 232, 255, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
              border: `1px solid ${primaryColor}`,
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 0 12px ${primaryColor}35`,
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={13} style={{ color: primaryColor }} />
            <span>DISPATCH DIRECTIVE</span>
          </button>
        )}
      </div>
    </footer>
  );
};
