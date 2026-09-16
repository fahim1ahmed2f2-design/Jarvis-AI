import React, { useState, useEffect, useMemo } from 'react';
import {
  AgentTownMember,
  ActiveConnection,
  ParentTask,
  TownMetrics
} from '../../types';
import {
  GitFork,
  Zap,
  Activity,
  Cpu,
  Brain,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Terminal
} from 'lucide-react';
import { multiHopEngine, MultiHopSession } from '../interaction/MultiHopConsultationEngine';
import { soundFx } from '../../../../services/soundFxService';

interface TacticalVisualHubProps {
  agents: AgentTownMember[];
  selectedAgentId: string | null;
  activeConnections: ActiveConnection[];
  activeParentTask: ParentTask | null;
  metrics: TownMetrics;
  onSelectAgent: (agent: AgentTownMember) => void;
  onOpenUniversalModal: () => void;
  primaryColor?: string;
}

export const TacticalVisualHub: React.FC<TacticalVisualHubProps> = ({
  agents,
  selectedAgentId,
  activeConnections,
  activeParentTask,
  metrics,
  onSelectAgent,
  onOpenUniversalModal,
  primaryColor = '#00e8ff'
}) => {
  const [multiHopSession, setMultiHopSession] = useState<MultiHopSession | null>(null);
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    return multiHopEngine.subscribe((s) => setMultiHopSession(s));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseTick((t) => (t + 1) % 100);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getAgentColor = (id: string) => {
    const found = agents.find((a) => a.id === id);
    return found ? found.avatar.color : primaryColor;
  };

  const getAgentName = (id: string) => {
    const found = agents.find((a) => a.id === id);
    return found ? found.name : id;
  };

  const activeWorkingAgents = useMemo(() => {
    return agents.filter((a) => a.status === 'WORKING' || a.status === 'THINKING');
  }, [agents]);

  const totalCompletedTasks = useMemo(() => {
    return agents.reduce((acc, curr) => acc + (curr.taskHistory?.length || 0), 0);
  }, [agents]);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'radial-gradient(circle at 50% 20%, rgba(10, 24, 60, 0.95) 0%, rgba(2, 6, 18, 0.98) 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative'
      }}
    >
      {/* Background Cyber Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0, 232, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 232, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* ── 1. TOP TELEMETRY STRIP ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          zIndex: 1
        }}
      >
        <div
          style={{
            background: 'rgba(3, 10, 28, 0.85)',
            border: '1px solid rgba(0, 232, 255, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 0 20px rgba(0, 232, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(0, 232, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Brain size={22} color="#00e8ff" />
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              ACTIVE NEURAL MESH
            </div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
              {agents.length} AGENTS ONLINE
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(3, 10, 28, 0.85)',
            border: '1px solid rgba(16, 232, 144, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 0 20px rgba(16, 232, 144, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(16, 232, 144, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Activity size={22} color="#10e890" />
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              SYSTEM LATENCY & LOAD
            </div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#10e890' }}>
              {metrics.systemLoad}% LOAD • 11ms
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(3, 10, 28, 0.85)',
            border: '1px solid rgba(245, 165, 36, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 0 20px rgba(245, 165, 36, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(245, 165, 36, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <GitFork size={22} color="#f5a524" />
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              ACTIVE DIRECTIVES
            </div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#f5a524' }}>
              {activeWorkingAgents.length} WORKING • {totalCompletedTasks} DONE
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(3, 10, 28, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="#a855f7" />
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                DISPATCH NEW MISSION
              </div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                DIRECTIVE LAUNCHER
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playChime();
              onOpenUniversalModal();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #00e8ff 0%, #a855f7 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.70rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(0, 232, 255, 0.4)'
            }}
          >
            <Play size={12} fill="#ffffff" />
            <span>DISPATCH</span>
          </button>
        </div>
      </div>

      {/* ── 2. LIVE MULTI-AGENT DAG ORCHESTRATION PIPELINE ── */}
      <div
        style={{
          background: 'rgba(3, 10, 28, 0.92)',
          border: '1px solid rgba(0, 232, 255, 0.25)',
          borderRadius: '12px',
          padding: '18px',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
          zIndex: 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitFork size={16} color="#00e8ff" />
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.82rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#ffffff'
              }}
            >
              MULTI-AGENT DAG ORCHESTRATION & PIPELINE MATRIX
            </span>
          </div>

          {activeParentTask ? (
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.66rem',
                color: '#f5a524',
                background: 'rgba(245, 165, 36, 0.15)',
                border: '1px solid rgba(245, 165, 36, 0.4)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              ACTIVE PIPELINE: {activeParentTask.progress}%
            </span>
          ) : (
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.66rem',
                color: '#10e890',
                background: 'rgba(16, 232, 144, 0.1)',
                border: '1px solid rgba(16, 232, 144, 0.3)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              PIPELINE READY // STANDBY
            </span>
          )}
        </div>

        {activeParentTask ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(245, 165, 36, 0.08)',
                border: '1px solid rgba(245, 165, 36, 0.3)',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#f5a524' }}>
                DIRECTIVE: {activeParentTask.title}
              </div>
              <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${activeParentTask.progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f5a524 0%, #00e8ff 100%)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Subtask Nodes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px'
              }}
            >
              {activeParentTask.subtasks.map((st, idx) => {
                const isWorking = st.status === 'WORKING';
                const isCompleted = st.status === 'COMPLETED';
                const agentColor = getAgentColor(st.assignedAgentId);

                return (
                  <div
                    key={st.id}
                    style={{
                      background: isWorking ? 'rgba(0, 232, 255, 0.12)' : 'rgba(2, 6, 18, 0.7)',
                      border: `1px solid ${isWorking ? '#00e8ff' : isCompleted ? '#10e890' : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: isWorking ? '0 0 16px rgba(0, 232, 255, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.68rem', fontWeight: 800, color: agentColor }}>
                        NODE 0{idx + 1} // {getAgentName(st.assignedAgentId)}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.58rem',
                          color: isWorking ? '#00e8ff' : isCompleted ? '#10e890' : '#94a3b8',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '1px 4px',
                          borderRadius: '3px'
                        }}
                      >
                        {st.status}
                      </span>
                    </div>

                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.80rem', color: '#ffffff', fontWeight: 600 }}>
                      {st.title}
                    </div>

                    {st.result && (
                      <div
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.62rem',
                          color: 'rgba(216, 180, 254, 0.9)',
                          background: 'rgba(0, 0, 0, 0.4)',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          marginTop: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        ✓ {st.result}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(2, 6, 18, 0.5)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}
          >
            <GitFork size={28} color="rgba(0, 232, 255, 0.5)" />
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.84rem', color: '#ffffff', fontWeight: 700 }}>
              NO MULTI-AGENT ORCHESTRATION CURRENTLY IN FLIGHT
            </div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '420px' }}>
              Launch a high-level project directive to automatically decompose workflows across Research, Architecture, Execution, and Memory nodes.
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenUniversalModal();
              }}
              style={{
                marginTop: '6px',
                padding: '6px 16px',
                background: 'rgba(0, 232, 255, 0.15)',
                border: '1px solid #00e8ff',
                borderRadius: '6px',
                color: '#00e8ff',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.70rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + LAUNCH MULTI-AGENT PROJECT
            </button>
          </div>
        )}
      </div>

      {/* ── 3. 9-AGENT NEURAL LOAD & LATENCY HEATMAP MATRIX ── */}
      <div
        style={{
          background: 'rgba(3, 10, 28, 0.92)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '12px',
          padding: '18px',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
          zIndex: 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="#a855f7" />
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.82rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#ffffff'
              }}
            >
              9-AGENT COGNITIVE LOAD & MEMORY HEATMAP
            </span>
          </div>

          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.64rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            REAL-TIME REFRESH: 60 FPS
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '10px'
          }}
        >
          {agents.map((ag) => {
            const isSelected = selectedAgentId === ag.id;
            const isBusy = ag.status === 'WORKING' || ag.status === 'THINKING';
            const loadPercent = ag.neuralLoad || 20;

            return (
              <div
                key={ag.id}
                onClick={() => {
                  soundFx.playClick();
                  onSelectAgent(ag);
                }}
                style={{
                  background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(2, 6, 18, 0.75)',
                  border: `1px solid ${isSelected ? ag.avatar.color : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isSelected ? `0 0 16px ${ag.avatar.color}30` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: `${ag.avatar.color}25`,
                        border: `1px solid ${ag.avatar.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: ag.avatar.color
                      }}
                    >
                      {ag.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.74rem', fontWeight: 800, color: '#ffffff' }}>
                        {ag.name}
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: ag.avatar.color }}>
                        {ag.codename}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.60rem',
                      color: isBusy ? '#00e8ff' : '#10e890',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${isBusy ? '#00e8ff50' : '#10e89050'}`
                    }}
                  >
                    {ag.status}
                  </span>
                </div>

                {/* Neural Load Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.60rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '3px' }}>
                    <span>NEURAL LOAD</span>
                    <span style={{ color: ag.avatar.color, fontWeight: 700 }}>{loadPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${loadPercent}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${ag.avatar.color} 0%, #ffffff 100%)`,
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                </div>

                {/* Subtext info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  <span>RAM: {ag.memoryAllocated || '512 MB'}</span>
                  <span>PING: {ag.latencyMs || 10}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. MULTI-HOP WALKING CONSULTATION TRACER ── */}
      {multiHopSession && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(3, 10, 28, 0.95) 0%, rgba(16, 24, 60, 0.95) 100%)',
            border: '1px solid rgba(0, 232, 255, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 0 25px rgba(0, 232, 255, 0.15)',
            zIndex: 1
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#00e8ff" />
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.80rem', fontWeight: 800, color: '#00e8ff' }}>
                ACTIVE MULTI-HOP CONSULTATION CHAIN
              </span>
            </div>

            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.62rem',
                color: '#ffffff',
                background: 'rgba(0, 232, 255, 0.15)',
                border: '1px solid rgba(0, 232, 255, 0.4)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              HOP {multiHopSession.currentHopIndex + 1} OF {multiHopSession.hops.length}
            </span>
          </div>

          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.85rem', color: '#ffffff', fontWeight: 600, marginBottom: '10px' }}>
            TOPIC: "{multiHopSession.prompt}"
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {multiHopSession.hops.map((h, i) => {
              const isCurrent = i === multiHopSession.currentHopIndex;
              const isPast = i < multiHopSession.currentHopIndex;
              const agentColor = getAgentColor(h.targetAgentId);

              return (
                <div
                  key={h.id}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '8px 10px',
                    background: isCurrent ? 'rgba(0, 232, 255, 0.15)' : 'rgba(2, 6, 18, 0.6)',
                    border: `1px solid ${isCurrent ? '#00e8ff' : isPast ? '#10e890' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.64rem', fontWeight: 700, color: agentColor }}>
                      {getAgentName(h.targetAgentId)}
                    </span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.54rem', color: isCurrent ? '#00e8ff' : isPast ? '#10e890' : '#64748b' }}>
                      {h.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {h.locationName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
