/**
 * JARVIS Agent Town — 1-Click Quick Team Mission Launchpad
 * Provides frictionless 1-click multi-agent task execution presets.
 */

import React from 'react';
import { AgentTownMember } from './types';
import { Sparkles, Shield, Cpu, Newspaper, Palette, Play, Zap } from 'lucide-react';
import { soundFx } from '../../services/soundFxService';

interface QuickTeamMissionBarProps {
  agents: AgentTownMember[];
  onDispatchPreset: (title: string, description: string, coordinatorId: string) => void;
  primaryColor?: string;
}

interface MissionPreset {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  coordinatorId: string;
  team: string[];
  icon: React.ReactNode;
  accentColor: string;
}

export const QuickTeamMissionBar: React.FC<QuickTeamMissionBarProps> = ({
  agents,
  onDispatchPreset,
  primaryColor = '#00e8ff'
}) => {
  const presets: MissionPreset[] = [
    {
      id: 'standup',
      title: 'Autonomous Daily Standup & Subsystem Sync',
      shortLabel: 'DAILY STANDUP',
      description: 'Synchronize all 9 AI agents, review active workloads, and align strategic objectives.',
      coordinatorId: 'agent-jarvis',
      team: ['JARVIS', 'Dave', 'Alice', 'Bob'],
      icon: <Sparkles size={12} />,
      accentColor: '#eab308'
    },
    {
      id: 'system_doctor',
      title: '1-Click PC Turbo Boost & RAM Memory Optimization',
      shortLabel: 'TURBO BOOST',
      description: 'Audit running background processes, clear RAM cache, and optimize system latency.',
      coordinatorId: 'agent-bob',
      team: ['Bob', 'Mob'],
      icon: <Cpu size={12} />,
      accentColor: '#f59e0b'
    },
    {
      id: 'cyber_audit',
      title: 'Zero-Trust Cyber Security & Perimeter Defense Audit',
      shortLabel: 'CYBER AUDIT',
      description: 'Scan active network ports, audit firewall integrity, and verify sandbox permissions.',
      coordinatorId: 'agent-jonson',
      team: ['Jonson', 'Knox', 'Dave'],
      icon: <Shield size={12} />,
      accentColor: '#ef4444'
    },
    {
      id: 'bd_intel',
      title: 'Bangladesh Tech & Breaking News Intelligence Brief',
      shortLabel: 'BD INTEL BRIEF',
      description: 'Fetch real-time Bangladesh tech updates, export trends, and formulate executive briefing.',
      coordinatorId: 'agent-alice',
      team: ['Alice', 'Carol', 'Jonson'],
      icon: <Newspaper size={12} />,
      accentColor: '#10b981'
    },
    {
      id: 'design_sprint',
      title: 'UI/UX Visual Design & Component Polish Sprint',
      shortLabel: 'UI/UX SPRINT',
      description: 'Audit glassmorphism contrast, refine micro-animations, and synchronize HUD palette.',
      coordinatorId: 'agent-tuly',
      team: ['Tuly', 'Alice'],
      icon: <Palette size={12} />,
      accentColor: '#ec4899'
    }
  ];

  const handleLaunch = (preset: MissionPreset) => {
    soundFx.playSuccess();
    onDispatchPreset(preset.title, preset.description, preset.coordinatorId);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        background: 'rgba(4, 9, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${primaryColor}30`,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
        overflowX: 'auto',
        zIndex: 14,
        pointerEvents: 'auto'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.64rem',
          fontWeight: 800,
          color: primaryColor,
          paddingRight: '6px',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          whiteSpace: 'nowrap'
        }}
      >
        <Zap size={12} color={primaryColor} />
        <span>1-CLICK MISSIONS:</span>
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => handleLaunch(p)}
            title={`${p.title} (Team: ${p.team.join(', ')})`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: `1px solid ${p.accentColor}50`,
              borderRadius: '5px',
              color: '#ffffff',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${p.accentColor}30`;
              e.currentTarget.style.borderColor = p.accentColor;
              e.currentTarget.style.boxShadow = `0 0 10px ${p.accentColor}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
              e.currentTarget.style.borderColor = `${p.accentColor}50`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ color: p.accentColor }}>{p.icon}</span>
            <span>{p.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
