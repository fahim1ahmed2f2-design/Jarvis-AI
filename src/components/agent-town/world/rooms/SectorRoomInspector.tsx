import React, { useState } from 'react';
import {
  AgentTownMember,
  TownSector
} from '../../types';
import {
  Building2,
  Shield,
  Cpu,
  Brain,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Lock,
  Zap,
  Play,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { soundFx } from '../../../../services/soundFxService';

interface SectorRoomInspectorProps {
  agents: AgentTownMember[];
  selectedSector: TownSector;
  onSelectSector: (sector: TownSector) => void;
  onSelectAgent: (agent: AgentTownMember) => void;
  onOpenAssignModal: (agent: AgentTownMember) => void;
  onOpenBDNews?: () => void;
  primaryColor?: string;
}

interface RoomDefinition {
  id: TownSector;
  name: string;
  tagline: string;
  description: string;
  leadAgentId: string;
  additionalAgentIds?: string[];
  powerBudget: string;
  securityClearance: string;
  accentColor: string;
  icon: any;
  capabilities: string[];
}

const SECTOR_ROOMS: RoomDefinition[] = [
  {
    id: 'PENTHOUSE',
    name: 'JARVIS Executive Penthouse',
    tagline: 'SECTOR 07 // SUPREME COMMAND & FLEET OVERSIGHT',
    description: 'High-level multi-agent governance, fleet routing, and global executive intelligence processing.',
    leadAgentId: 'agent-jarvis',
    powerBudget: '2048 MW • 100% Online',
    securityClearance: 'LEVEL-5 TOP EXECUTIVE',
    accentColor: '#eab308',
    icon: Shield,
    capabilities: ['Fleet Command', 'Executive Oversight', 'Global Routing', 'Subsystem Security']
  },
  {
    id: 'RESEARCH',
    name: 'Investigation & Research Lab',
    tagline: 'SECTOR 01 // EMPIRICAL SYNTHESIS & ANALYSIS',
    description: 'Autonomous literature reviews, hypothesis testing, cross-domain verification, and deep search queries.',
    leadAgentId: 'agent-alice',
    powerBudget: '768 MW • 99.8% Online',
    securityClearance: 'LEVEL-3 SCIENTIFIC',
    accentColor: '#00e8ff',
    icon: Brain,
    capabilities: ['Deep Research', 'Data Synthesis', 'Hypothesis Generation', 'Mathematical Analysis']
  },
  {
    id: 'OPERATIONS',
    name: 'Execution Matrix & Automation Hub',
    tagline: 'SECTOR 02 // PROCEDURAL AUTOMATION & SCRIPTS',
    description: 'Batch execution queues, workflow dispatching, script sandboxing, and background automation pipelines.',
    leadAgentId: 'agent-bob',
    additionalAgentIds: ['agent-mob'],
    powerBudget: '1200 MW • 100% Online',
    securityClearance: 'LEVEL-4 OPERATIONAL',
    accentColor: '#10e890',
    icon: Cpu,
    capabilities: ['Task Automation', 'Batch Workflows', 'Script Formatting', 'Big Data Streaming']
  },
  {
    id: 'KNOWLEDGE',
    name: 'Memory Archival & Knowledge Vault',
    tagline: 'SECTOR 03 // VECTOR INDEX & EPISODIC STORAGE',
    description: 'High-dimensional semantic vectors, RAG associative memory clustering, and cross-agent shared knowledge.',
    leadAgentId: 'agent-carol',
    powerBudget: '890 MW • 100% Online',
    securityClearance: 'LEVEL-3 ARCHIVAL',
    accentColor: '#a855f7',
    icon: Layers,
    capabilities: ['Vector Memory', 'Knowledge Graphs', 'Context Retrieval', 'Semantic Indexing']
  },
  {
    id: 'COMMAND',
    name: 'Strategy & Coordination Command',
    tagline: 'SECTOR 00 // MULTI-AGENT DAG ORCHESTRATION',
    description: 'Master dependency graph formulation, parallel subtask dispatch, bottleneck resolution, and team alignment.',
    leadAgentId: 'agent-dave',
    powerBudget: '1024 MW • 100% Online',
    securityClearance: 'LEVEL-4 STRATEGIC',
    accentColor: '#f5a524',
    icon: Activity,
    capabilities: ['Strategic Planning', 'Workflow Orchestration', 'Agent Delegation', 'Conflict Resolution']
  },
  {
    id: 'CYBER_DEFENSE',
    name: 'Cyber Defense & Cloud Data Center',
    tagline: 'SECTOR 04 // THREAT OPERATIONS & CLOUD MAINFRAME',
    description: 'Zero-trust perimeter auditing, real-time intrusion neutralization, and Docker/Kubernetes cloud cluster uptime.',
    leadAgentId: 'agent-jonson',
    additionalAgentIds: ['agent-knox'],
    powerBudget: '1540 MW • 100% Online',
    securityClearance: 'LEVEL-5 DEFENSIVE',
    accentColor: '#ef4444',
    icon: Lock,
    capabilities: ['Threat Detection', 'Perimeter Hardening', 'Kubernetes Orchestration', 'Firewall Auditing']
  },
  {
    id: 'STUDIO',
    name: 'Creative UI/UX & Media Design Studio',
    tagline: 'SECTOR 05 // VISUAL HARMONY & EXPERIENCE LAB',
    description: 'Futuristic glassmorphic UI generation, dynamic palette synthesis, micro-animations, and aesthetic grading.',
    leadAgentId: 'agent-tuly',
    powerBudget: '650 MW • 99.4% Online',
    securityClearance: 'LEVEL-2 CREATIVE',
    accentColor: '#ec4899',
    icon: Sparkles,
    capabilities: ['Visual UI Design', 'UX Architecture', 'Color Harmonies', 'Asset Generation']
  },
  {
    id: 'PLAZA',
    name: 'Central Watercooler & BD News Lounge',
    tagline: 'SECTOR 06 // SOCIAL BANTER & BANGLADESH DEBATE',
    description: 'Office recreation, spontaneous peer consultations, tea/coffee breaks, and live Bangladesh breaking news debates.',
    leadAgentId: 'agent-jarvis',
    additionalAgentIds: ['agent-alice', 'agent-bob', 'agent-carol', 'agent-dave', 'agent-tuly'],
    powerBudget: '450 MW • 100% Online',
    securityClearance: 'PUBLIC / OPEN ACCESS',
    accentColor: '#10b981',
    icon: Building2,
    capabilities: ['Bilingual News Debate', 'Peer Banter', 'Coffee Breaks', 'Consensus Voting']
  }
];

export const SectorRoomInspector: React.FC<SectorRoomInspectorProps> = ({
  agents,
  selectedSector,
  onSelectSector,
  onSelectAgent,
  onOpenAssignModal,
  onOpenBDNews,
  primaryColor = '#00e8ff'
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | TownSector>(selectedSector);

  const filteredRooms = activeFilter === 'ALL'
    ? SECTOR_ROOMS
    : SECTOR_ROOMS.filter((r) => r.id === activeFilter);

  const getAgent = (id: string) => agents.find((a) => a.id === id);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'radial-gradient(circle at 50% 15%, rgba(6, 18, 48, 0.95) 0%, rgba(2, 6, 18, 0.98) 100%)',
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
            'linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* ── 1. SECTOR SELECTOR BAR ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(3, 10, 28, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '10px 16px',
          zIndex: 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} color="#00e8ff" />
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.80rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.08em'
            }}
          >
            AGENT TOWN SECTOR & ROOM DIRECTORY
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {(['ALL', 'PENTHOUSE', 'COMMAND', 'RESEARCH', 'OPERATIONS', 'KNOWLEDGE', 'CYBER_DEFENSE', 'STUDIO', 'PLAZA'] as const).map(
            (sec) => {
              const isSelected = activeFilter === sec;
              return (
                <button
                  key={sec}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveFilter(sec);
                    onSelectSector(sec);
                  }}
                  style={{
                    padding: '4px 10px',
                    background: isSelected ? 'rgba(0, 232, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? '#00e8ff' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '6px',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.68rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#00e8ff' : 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sec}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* ── 2. SECTOR ROOM CARDS GRID ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
          zIndex: 1
        }}
      >
        {filteredRooms.map((room) => {
          const RoomIcon = room.icon;
          const leadAgent = getAgent(room.leadAgentId);
          const additionalAgents = (room.additionalAgentIds || []).map(getAgent).filter(Boolean) as AgentTownMember[];

          return (
            <div
              key={room.id}
              style={{
                background: 'rgba(3, 10, 28, 0.92)',
                border: `1px solid ${room.accentColor}50`,
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: `0 0 25px ${room.accentColor}15, inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Room Banner */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, ${room.accentColor}30 0%, rgba(2, 6, 18, 0.9) 100%)`,
                      border: `1px solid ${room.accentColor}80`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 14px ${room.accentColor}30`
                    }}
                  >
                    <RoomIcon size={22} color={room.accentColor} />
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.90rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '0.06em'
                      }}
                    >
                      {room.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.62rem',
                        color: room.accentColor,
                        marginTop: '2px'
                      }}
                    >
                      {room.tagline}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.58rem',
                    color: room.accentColor,
                    background: `${room.accentColor}18`,
                    border: `1px solid ${room.accentColor}40`,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  {room.securityClearance}
                </span>
              </div>

              {/* Description */}
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.82rem',
                  color: 'rgba(255, 255, 255, 0.75)',
                  lineHeight: 1.35
                }}
              >
                {room.description}
              </div>

              {/* Assigned Personnel */}
              <div>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.62rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '6px'
                  }}
                >
                  // STATIONED AGENTS & CREW:
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {leadAgent && (
                    <div
                      onClick={() => {
                        soundFx.playClick();
                        onSelectAgent(leadAgent);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: `${leadAgent.avatar.color}20`,
                        border: `1px solid ${leadAgent.avatar.color}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: leadAgent.status === 'WORKING' ? '#00e8ff' : '#10e890',
                          boxShadow: `0 0 6px ${leadAgent.status === 'WORKING' ? '#00e8ff' : '#10e890'}`
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {leadAgent.name} (Lead)
                      </span>
                    </div>
                  )}

                  {additionalAgents.map((ag) => (
                    <div
                      key={ag.id}
                      onClick={() => {
                        soundFx.playClick();
                        onSelectAgent(ag);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${ag.avatar.color}60`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: ag.status === 'WORKING' ? '#00e8ff' : '#10e890'
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#ffffff'
                        }}
                      >
                        {ag.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capabilities Chips */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {room.capabilities.map((cap) => (
                  <span
                    key={cap}
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.58rem',
                      color: 'rgba(216, 180, 254, 0.85)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    • {cap}
                  </span>
                ))}
              </div>

              {/* Room Actions & Telemetry Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  marginTop: 'auto'
                }}
              >
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  POWER: {room.powerBudget}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {room.id === 'PLAZA' && onOpenBDNews && (
                    <button
                      onClick={() => {
                        soundFx.playChime();
                        onOpenBDNews();
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🇧🇩 <span>NEWS LOUNGE</span>
                    </button>
                  )}

                  {leadAgent && (
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onOpenAssignModal(leadAgent);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: `${room.accentColor}25`,
                        border: `1px solid ${room.accentColor}`,
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Play size={10} fill="#ffffff" />
                      <span>DISPATCH</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
