import React, { useState } from 'react';
import { Bot, Cpu, Zap, Activity, Radio, Shield, Brain, Sparkles, CheckCircle2, Clock, BookOpen, AlertTriangle, Moon, Play, ArrowRightLeft } from 'lucide-react';
import { AgentTownMember, AgentStatus } from './types';

interface AgentStationProps {
  agent: AgentTownMember;
  isSelected: boolean;
  onSelect: (agent: AgentTownMember) => void;
  primaryColor?: string;
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; bg: string; border: string; pulse: boolean }> = {
  READY: {
    label: 'READY',
    color: '#10e890',
    bg: 'rgba(16, 232, 144, 0.10)',
    border: 'rgba(16, 232, 144, 0.35)',
    pulse: false
  },
  WORKING: {
    label: 'WORKING',
    color: '#00e8ff',
    bg: 'rgba(0, 232, 255, 0.14)',
    border: 'rgba(0, 232, 255, 0.45)',
    pulse: true
  },
  THINKING: {
    label: 'THINKING',
    color: '#f5a524',
    bg: 'rgba(245, 165, 36, 0.12)',
    border: 'rgba(245, 165, 36, 0.40)',
    pulse: true
  },
  WAITING: {
    label: 'WAITING',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.10)',
    border: 'rgba(168, 85, 247, 0.35)',
    pulse: true
  },
  COMPLETED: {
    label: 'COMPLETED',
    color: '#10e890',
    bg: 'rgba(16, 232, 144, 0.12)',
    border: 'rgba(16, 232, 144, 0.40)',
    pulse: false
  },
  IDLE: {
    label: 'IDLE',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.30)',
    pulse: false
  },
  ERROR: {
    label: 'ERROR',
    color: '#ff4060',
    bg: 'rgba(255, 64, 96, 0.14)',
    border: 'rgba(255, 64, 96, 0.45)',
    pulse: true
  },
  OFFLINE: {
    label: 'OFFLINE',
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.08)',
    border: 'rgba(107, 114, 128, 0.25)',
    pulse: false
  }
};

export const AgentStation: React.FC<AgentStationProps> = ({
  agent,
  isSelected,
  onSelect,
  primaryColor = '#a855f7'
}) => {
  const [hovered, setHovered] = useState(false);
  const statusInfo = STATUS_CONFIG[agent.status] || STATUS_CONFIG.READY;
  const accentColor = agent.avatar.color || primaryColor;
  const isWorking = agent.status === 'WORKING' || agent.status === 'THINKING';
  const hasCollab = !!agent.activeCollabText;

  const renderAvatarIcon = () => {
    switch (agent.avatar.icon) {
      case 'Brain':
        return <Brain size={22} style={{ color: accentColor, filter: `drop-shadow(0 0 6px ${accentColor})` }} />;
      case 'Cpu':
        return <Cpu size={22} style={{ color: accentColor, filter: `drop-shadow(0 0 6px ${accentColor})` }} />;
      case 'BookOpen':
        return <BookOpen size={22} style={{ color: accentColor, filter: `drop-shadow(0 0 6px ${accentColor})` }} />;
      case 'Bot':
      default:
        return <Bot size={22} style={{ color: accentColor, filter: `drop-shadow(0 0 6px ${accentColor})` }} />;
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: isSelected
          ? `linear-gradient(145deg, rgba(8, 20, 48, 0.95) 0%, rgba(14, 10, 36, 0.95) 100%)`
          : hovered
          ? `linear-gradient(145deg, rgba(6, 16, 38, 0.90) 0%, rgba(8, 12, 28, 0.90) 100%)`
          : `linear-gradient(145deg, rgba(4, 12, 30, 0.82) 0%, rgba(6, 8, 22, 0.82) 100%)`,
        border: isSelected
          ? `1px solid ${accentColor}`
          : hasCollab
          ? `1px solid #a855f7`
          : hovered
          ? `1px solid ${accentColor}75`
          : `1px solid rgba(0, 232, 255, 0.16)`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isSelected
          ? `0 0 26px ${accentColor}45, 0 12px 32px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
          : hasCollab
          ? `0 0 22px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)`
          : hovered
          ? `0 0 18px ${accentColor}25, 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        transform: isSelected ? 'translateY(-2px)' : hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minWidth: '260px'
      }}
    >
      {/* Top Station Header & Desk Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.62rem',
              color: 'rgba(216, 180, 254, 0.65)',
              letterSpacing: '0.10em'
            }}
          >
            {agent.codename}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.60rem',
              color: accentColor,
              background: `${accentColor}12`,
              padding: '1px 5px',
              borderRadius: '4px',
              border: `1px solid ${accentColor}30`
            }}
          >
            {agent.position.deskName}
          </span>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            background: statusInfo.bg,
            border: `1px solid ${statusInfo.border}`,
            borderRadius: '10px'
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: statusInfo.color,
              boxShadow: `0 0 6px ${statusInfo.color}`,
              animation: statusInfo.pulse ? 'v3Pulse 1.5s infinite' : 'none'
            }}
          />
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.66rem',
              fontWeight: 700,
              color: statusInfo.color,
              letterSpacing: '0.08em'
            }}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Desk & Core Visual Stage */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '10px 12px',
          background: 'rgba(2, 6, 18, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated AI Reactor Core Orb */}
        <div
          style={{
            position: 'relative',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${accentColor}25 0%, rgba(2, 8, 24, 0.85) 100%)`,
            border: `1px solid ${accentColor}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 14px ${accentColor}35`,
            flexShrink: 0
          }}
        >
          {/* Subtle Outer Concentric Ring */}
          <span
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '16px',
              border: `1px dashed ${accentColor}45`,
              animation: isWorking ? 'v3Spin 4s linear infinite' : 'v3Spin 12s linear infinite'
            }}
          />
          {renderAvatarIcon()}
        </div>

        {/* Name & Role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.96rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#ffffff',
              textShadow: isSelected || hovered ? `0 0 10px ${accentColor}80` : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {agent.name}
          </div>
          <div
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'rgba(216, 180, 254, 0.75)',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {agent.role}
          </div>
        </div>
      </div>

      {/* Inter-Agent Collaboration Sub-label (Step 6) */}
      {hasCollab && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 8px',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '6px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.64rem',
            color: '#d8b4fe',
            animation: 'v3Pulse 1.5s infinite'
          }}
        >
          <ArrowRightLeft size={11} color="#d8b4fe" />
          <span>{agent.activeCollabText}</span>
        </div>
      )}

      {/* Current Task or Activity Teaser */}
      <div
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.66rem',
          color: agent.currentTask ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
          background: agent.currentTask ? 'rgba(0, 232, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
          borderLeft: `2px solid ${isWorking ? '#00e8ff' : accentColor}`,
          padding: '6px 8px',
          borderRadius: '0 6px 6px 0',
          lineHeight: 1.35,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '32px'
        }}
      >
        {agent.currentTask ? (
          <div>
            <span style={{ color: '#00e8ff', fontWeight: 700 }}>TASK: </span>
            <span>{agent.currentTask.title}</span>
          </div>
        ) : agent.previousTask ? (
          <div style={{ color: 'rgba(216, 180, 254, 0.75)' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>[LAST TASK] </span>
            <span>{agent.previousTask}</span>
          </div>
        ) : (
          <span>{agent.statusDescription}</span>
        )}
      </div>

      {/* Workstation Activity Floor Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.62rem',
          color: 'rgba(255, 255, 255, 0.45)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Cpu size={11} color={accentColor} />
          <span>LOAD: {agent.neuralLoad}%</span>
        </div>

        {/* Live Audio/Neural Pulsing Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '10px' }}>
          <span style={{ width: '2px', height: isWorking ? '10px' : '6px', background: accentColor, opacity: 0.7 }} />
          <span style={{ width: '2px', height: isWorking ? '8px' : '10px', background: accentColor, opacity: 0.9 }} />
          <span style={{ width: '2px', height: isWorking ? '12px' : '4px', background: accentColor, opacity: 0.6 }} />
          <span style={{ width: '2px', height: isWorking ? '6px' : '8px', background: accentColor, opacity: 0.8 }} />
        </div>

        <span>LATENCY: {agent.latencyMs}ms</span>
      </div>
    </div>
  );
};
