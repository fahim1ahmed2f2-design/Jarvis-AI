import React, { useMemo, useState, useEffect } from 'react';
import { AgentTownMember, TownSector, ActiveConnection, ParentTask } from './types';
import { TownWorldCanvas } from './world/TownWorldCanvas';
import { WorldControlsOverlay } from './world/WorldControlsOverlay';
import { AgentActivityFeed } from './world/task/AgentActivityFeed';
import { AgentActivityEvent } from './world/task/types';
import { AgentMissionHUD } from './world/mission/AgentMissionHUD';
import { AgentMissionController } from './world/mission/AgentMissionController';
import { QuickTeamMissionBar } from './QuickTeamMissionBar';
import { AgentSpotlightBar } from './AgentSpotlightBar';
import { Zap, GitFork, X, Radio, Volume2 } from 'lucide-react';
import { autonomousOfficeEngine, OfficeDialogueBubble } from './world/social/AutonomousOfficeLifeEngine';
import { soundFx } from '../../services/soundFxService';

interface TownWorkspaceProps {
  agents: AgentTownMember[];
  selectedAgentId: string | null;
  selectedSector: TownSector;
  activeConnections?: ActiveConnection[];
  activeParentTask?: ParentTask | null;
  onCancelParentTask?: (id: string) => void;
  onSelectAgent: (agent: AgentTownMember) => void;
  onSelectSector?: (sector: TownSector) => void;
  onDispatchPreset?: (title: string, description: string, coordinatorId: string) => void;
  onDeselect: () => void;
  primaryColor?: string;
}

export const TownWorkspace: React.FC<TownWorkspaceProps> = ({
  agents,
  selectedAgentId,
  selectedSector,
  activeConnections = [],
  activeParentTask,
  onCancelParentTask,
  onSelectAgent,
  onSelectSector,
  onDispatchPreset,
  onDeselect,
  primaryColor = '#00e8ff'
}) => {
  const [latestDialogue, setLatestDialogue] = useState<OfficeDialogueBubble | null>(null);

  useEffect(() => {
    return autonomousOfficeEngine.subscribe((states, dialogues) => {
      if (dialogues.length > 0) {
        setLatestDialogue(dialogues[dialogues.length - 1]);
      }
    });
  }, []);

  const getAgentName = (id: string) => {
    const found = agents.find((a) => a.id === id);
    return found ? found.name : id;
  };

  const getAgentColor = (id: string) => {
    const found = agents.find((a) => a.id === id);
    return found ? found.avatar.color : '#00e8ff';
  };

  const activityEvents: AgentActivityEvent[] = useMemo(() => {
    const list: AgentActivityEvent[] = [];
    const now = Date.now();

    if (activeParentTask) {
      list.push({
        id: `evt_orch_${activeParentTask.id}`,
        timestamp: now - 8000,
        agentId: activeParentTask.coordinatorId || 'agent-dave',
        agentName: 'Dave',
        agentColor: '#10e890',
        eventType: 'TASK_STARTED',
        title: activeParentTask.title,
        description: `Multi-agent orchestration in progress (${activeParentTask.progress}%)`,
        progress: activeParentTask.progress
      });
    }

    for (const conn of activeConnections) {
      list.push({
        id: `evt_conn_${conn.id}`,
        timestamp: conn.timestamp || now - 4000,
        agentId: conn.fromAgentId,
        agentName: getAgentName(conn.fromAgentId),
        agentColor: getAgentColor(conn.fromAgentId),
        eventType: 'AGENT_COMMUNICATION',
        title: `Neural Collaboration`,
        description: `${getAgentName(conn.fromAgentId)} ──→ ${getAgentName(conn.toAgentId)}`
      });
    }

    for (const member of agents) {
      if (member.currentTask) {
        list.push({
          id: `evt_task_${member.id}_${member.currentTask.id}`,
          timestamp: now - 18000,
          agentId: member.id,
          agentName: member.name,
          agentColor: member.avatar.color,
          eventType:
            member.status === 'WORKING'
              ? 'TASK_STARTED'
              : member.status === 'COMPLETED'
              ? 'TASK_COMPLETED'
              : 'TASK_PROGRESS',
          title: member.currentTask.title,
          description: `${member.role} • Status: ${member.status}`,
          progress: member.currentTask.progress
        });
      }
    }

    return list;
  }, [agents, activeConnections, activeParentTask]);

  const activeMission = useMemo(() => {
    if (!activeParentTask) return null;
    return AgentMissionController.fromParentTask(activeParentTask);
  }, [activeParentTask]);

  return (
    <main
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#020612'
      }}
    >
      {/* ── TOP UX BAR: SPOTLIGHT SEARCH & 1-CLICK MISSION LAUNCHPAD ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '8px 16px 0 16px',
          zIndex: 14
        }}
      >
        {/* Spotlight Search */}
        <AgentSpotlightBar
          agents={agents}
          onSelectAgent={onSelectAgent}
          onSelectSector={(sec) => onSelectSector?.(sec)}
          primaryColor={primaryColor}
        />

        {/* 1-Click Quick Team Missions Launchpad */}
        {onDispatchPreset && (
          <QuickTeamMissionBar
            agents={agents}
            onDispatchPreset={onDispatchPreset}
            primaryColor={primaryColor}
          />
        )}
      </div>

      {/* ── ACTIVE ORCHESTRATION PIPELINE HUD ── */}
      {activeParentTask && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            margin: '8px 16px 0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 14px',
            background: 'linear-gradient(135deg, rgba(2, 6, 22, 0.95) 0%, rgba(10, 18, 48, 0.95) 100%)',
            border: '1px solid rgba(245, 165, 36, 0.5)',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(245, 165, 36, 0.15)',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitFork size={15} color="#f5a524" style={{ animation: 'v3Pulse 1.4s infinite' }} />
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#ffffff'
                }}
              >
                ORCHESTRATION PIPELINE:
              </span>
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#f5a524'
                }}
              >
                {activeParentTask.title}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.72rem',
                  color: '#10e890',
                  fontWeight: 700
                }}
              >
                {activeParentTask.progress}% COMPLETED
              </span>

              {onCancelParentTask && (
                <button
                  onClick={() => onCancelParentTask(activeParentTask.id)}
                  title="Cancel Entire Orchestration"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '4px',
                    color: '#f87171',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.66rem',
                    cursor: 'pointer'
                  }}
                >
                  <X size={11} />
                  <span>ABORT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2.5D ANIMATED AGENT TOWN WORLD CANVAS ── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* HUD Camera Navigation Overlay */}
        <WorldControlsOverlay
          selectedSector={selectedSector}
          selectedAgentId={selectedAgentId}
          agents={agents}
          onSelectSector={(sector) => {
            if (onSelectSector) onSelectSector(sector);
          }}
          onSelectAgent={onSelectAgent}
          primaryColor={primaryColor}
        />

        {/* Live Active Mission Floating HUD */}
        <AgentMissionHUD
          mission={activeMission}
          agents={agents}
          onFocusSector={(sector) => {
            if (onSelectSector) onSelectSector(sector);
          }}
          onSelectAgent={onSelectAgent}
          onCancelMission={onCancelParentTask}
          primaryColor={primaryColor}
        />

        {/* 60 FPS 2.5D Isometric World Engine */}
        <TownWorldCanvas
          agents={agents}
          selectedAgentId={selectedAgentId}
          selectedSector={selectedSector}
          activeConnections={activeConnections}
          onSelectAgent={onSelectAgent}
          onSelectZone={(sector) => {
            if (onSelectSector) onSelectSector(sector);
          }}
          primaryColor={primaryColor}
        />

        {/* Live Multi-Agent Activity Feed Stream HUD */}
        <AgentActivityFeed
          events={activityEvents}
          agents={agents}
          onSelectAgent={onSelectAgent}
          primaryColor={primaryColor}
        />

        {/* ── LIVE OFFICE INTERCOM & SUBTITLES TICKER ── */}
        {latestDialogue && (
          <div
            onClick={() => {
              const speaker = agents.find((a) => a.id === latestDialogue.speakerId);
              if (speaker) onSelectAgent(speaker);
            }}
            title="Click to Zoom to Speaker"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(4, 9, 24, 0.94)',
              backdropFilter: 'blur(14px)',
              border: `1px solid ${latestDialogue.color || primaryColor}`,
              borderRadius: '20px',
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.8), 0 0 12px ${latestDialogue.color}35`,
              zIndex: 15,
              cursor: 'pointer',
              maxWidth: '650px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={13} style={{ color: latestDialogue.color || primaryColor, animation: 'pulse 1.2s infinite' }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.80rem', fontWeight: 800, color: latestDialogue.color || primaryColor }}>
                {latestDialogue.speakerName}:
              </span>
            </div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.76rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              "{latestDialogue.text}"
            </span>
          </div>
        )}
      </div>
    </main>
  );
};
