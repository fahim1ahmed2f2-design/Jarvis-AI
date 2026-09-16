/**
 * JARVIS Agent Town — Agent Mission HUD
 * Step 14: Glassmorphic Sci-Fi Mission Card with Stage Timeline & Focus Controls
 */

import React from 'react';
import { AgentMission } from './types';
import { AgentTownMember, TownSector } from '../../types';
import { Target, CheckCircle, Clock, X, Zap, Shield, AlertCircle } from 'lucide-react';

interface AgentMissionHUDProps {
  mission: AgentMission | null;
  agents: AgentTownMember[];
  onFocusSector: (sector: TownSector) => void;
  onSelectAgent: (agent: AgentTownMember) => void;
  onCancelMission?: (taskId: string) => void;
  primaryColor?: string;
}

export const AgentMissionHUD: React.FC<AgentMissionHUDProps> = ({
  mission,
  agents,
  onFocusSector,
  onSelectAgent,
  onCancelMission,
  primaryColor = '#a855f7'
}) => {
  if (!mission) return null;

  const isCompleted = mission.status === 'COMPLETED';
  const isFailed = mission.status === 'FAILED';
  const isPlanning = mission.status === 'PLANNING';

  const statusColor = isCompleted
    ? '#10e890'
    : isFailed
    ? '#ff4060'
    : isPlanning
    ? '#f5a524'
    : primaryColor;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 28,
        minWidth: '380px',
        maxWidth: '92vw',
        background: 'rgba(3, 8, 24, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${statusColor}50`,
        borderRadius: '12px',
        boxShadow: `0 0 30px ${statusColor}22, 0 12px 30px rgba(0, 0, 0, 0.75)`,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'auto',
        animation: 'v3FadeIn 0.3s ease-out'
      }}
    >
      {/* ── HEADER ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: `${statusColor}20`,
              border: `1px solid ${statusColor}70`,
              borderRadius: '6px',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.66rem',
              fontWeight: 800,
              color: statusColor,
              letterSpacing: '0.08em'
            }}
          >
            <Zap size={11} style={{ color: statusColor }} />
            MISSION // {mission.status}
          </div>

          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.64rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            ({mission.progress}%)
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onFocusSector(mission.targetSector)}
            title="Focus camera on active mission location"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${statusColor}60`,
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.62rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Target size={11} style={{ color: statusColor }} />
            FOCUS SECTOR
          </button>

          {onCancelMission && !isCompleted && !isFailed && (
            <button
              onClick={() => onCancelMission(mission.taskId)}
              title="Cancel mission"
              style={{
                background: 'rgba(255, 64, 96, 0.15)',
                border: '1px solid rgba(255, 64, 96, 0.4)',
                borderRadius: '6px',
                padding: '3px 6px',
                color: '#ff4060',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── MISSION TITLE ── */}
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: '0.94rem',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.04em',
          lineHeight: 1.2
        }}
      >
        {mission.title}
      </div>

      {/* ── STAGE TIMELINE PILLS ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {mission.stages.map((stage, idx) => {
          const isDone = stage.status === 'DONE';
          const isActive = stage.status === 'ACTIVE';
          const stageCol = isDone ? '#10e890' : isActive ? '#00e8ff' : 'rgba(255, 255, 255, 0.4)';

          return (
            <div
              key={stage.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                background: isActive ? 'rgba(0, 232, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${stageCol}50`,
                borderRadius: '4px',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.58rem',
                color: stageCol,
                whiteSpace: 'nowrap'
              }}
            >
              {isDone ? <CheckCircle size={10} style={{ color: '#10e890' }} /> : <span>{idx + 1}.</span>}
              <span>{stage.name}</span>
            </div>
          );
        })}
      </div>

      {/* ── ASSIGNED AGENTS ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.58rem',
              color: 'rgba(255, 255, 255, 0.45)'
            }}
          >
            ASSIGNED CREW:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {mission.assignedAgentIds.map((aId) => {
              const member = agents.find((a) => a.id === aId);
              if (!member) return null;

              return (
                <button
                  key={aId}
                  onClick={() => onSelectAgent(member)}
                  title={`Select ${member.name} (${member.role})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    background: `${member.avatar.color}18`,
                    border: `1px solid ${member.avatar.color}60`,
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.56rem',
                    cursor: 'pointer'
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: member.avatar.color
                    }}
                  />
                  {member.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sector Destination Tag */}
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.56rem',
            color: 'rgba(216, 180, 254, 0.8)',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '1px 6px',
            borderRadius: '4px'
          }}
        >
          SECTOR: {mission.targetSector}
        </span>
      </div>
    </div>
  );
};
