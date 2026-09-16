import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  X,
  AlertTriangle,
  Shield,
  Sparkles,
  Terminal,
  GitFork,
  Bookmark,
  Zap
} from 'lucide-react';
import { AgentTownMember } from './types';
import { multiHopEngine } from './world/interaction/MultiHopConsultationEngine';
import { soundFx } from '../../services/soundFxService';

interface AssignTaskModalProps {
  isOpen: boolean;
  agent: AgentTownMember | null;
  onAssign: (agentId: string, taskTitle: string) => void;
  onDispatchOrchestration?: (title: string, description?: string, coordinatorId?: string) => void;
  onCancelTask: (agentId: string, taskId?: string) => void;
  onClose: () => void;
  primaryColor?: string;
}

const AGENT_QUICK_SUGGESTIONS: Record<string, string[]> = {
  'agent-jarvis': [
    'Supervise campus-wide multi-agent security & operational synthesis',
    'Execute global priority scheduling audit across all 8 departments',
    'Formulate executive response roadmap for critical system anomalies'
  ],
  'agent-alice': [
    'Deep analytical literature review on autonomous multi-agent topologies',
    'Synthesize quantitative metrics on memory vector clustering efficiency',
    'Correlate empirical findings across decentralized AI models'
  ],
  'agent-bob': [
    'Automate sandboxed batch execution workflows and verification hooks',
    'Audit background tool executor sandbox isolation and permissions',
    'Decompose operational step-by-step procedural roadmap for deployment'
  ],
  'agent-carol': [
    'Consolidate high-importance episodic memories into shared team vault',
    'Synchronize semantic vector embeddings and prune stale knowledge nodes',
    'Query RAG knowledge graph for cross-agent contextual relationships'
  ],
  'agent-dave': [
    'Formulate master coordination dependency graph across Alice, Bob, Carol',
    'Decompose high-level strategic project into parallel subtask gates',
    'Optimize team workload balance and eliminate execution bottlenecks'
  ],
  'agent-jonson': [
    'Perform zero-trust perimeter port scan and intrusion audit',
    'Verify AES-256-GCM encryption tokens across inter-agent channels',
    'Simulate cyber defense firewall response to anomalous packet vectors'
  ],
  'agent-tuly': [
    'Design next-gen cyber neon UI design tokens and glassmorphism specs',
    'Synthesize color harmony palettes and visual component hierarchy',
    'Render futuristic HUD layout mockup for multi-agent command matrices'
  ],
  'agent-mob': [
    'Benchmark 1M log stream ingestion through Redis streaming pipeline',
    'Tune high-throughput ETL data pipeline buffers and minimize latency',
    'Analyze telemetry memory buffers and distributed caching efficiency'
  ],
  'agent-knox': [
    'Orchestrate Kubernetes cluster container pods across dual regions',
    'Continuously verify Docker microservice uptime and health probes',
    'Validate continuous deployment pipeline scripts and rollback hooks'
  ]
};

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  agent,
  onAssign,
  onDispatchOrchestration,
  onCancelTask,
  onClose,
  primaryColor = '#a855f7'
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [isOrchestrationMode, setIsOrchestrationMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTaskInput('');
      setIsOrchestrationMode(agent?.id === 'agent-dave' || agent?.id === 'agent-jarvis');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, agent]);

  if (!isOpen || !agent) return null;

  const accentColor = agent.avatar.color || primaryColor;
  const isWorking = agent.status === 'WORKING' || agent.status === 'THINKING';
  const suggestions = AGENT_QUICK_SUGGESTIONS[agent.id] || [
    'Execute role-specific analytical directive',
    'Process verified tool feedback in sandbox',
    'Synthesize comprehensive summary report'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim() || isWorking) return;

    soundFx.playSuccess();
    if (isOrchestrationMode && onDispatchOrchestration) {
      onDispatchOrchestration(taskInput.trim(), '', agent.id);
    } else {
      onAssign(agent.id, taskInput.trim());
    }
    onClose();
  };

  const handleSelectSuggestion = (sug: string) => {
    soundFx.playClick();
    setTaskInput(sug);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          background: 'linear-gradient(180deg, rgba(6, 14, 38, 0.98) 0%, rgba(3, 8, 26, 0.98) 100%)',
          border: `1px solid ${accentColor}80`,
          borderRadius: '14px',
          boxShadow: `0 0 45px ${accentColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'v3FadeIn 0.18s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: `linear-gradient(90deg, ${accentColor}20 0%, transparent 100%)`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${accentColor}35 0%, rgba(2, 6, 18, 0.8) 100%)`,
                border: `1px solid ${accentColor}80`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Terminal size={18} color={accentColor} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.90rem',
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  color: '#ffffff'
                }}
              >
                ASSIGN DIRECTIVE v2
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.64rem',
                  color: accentColor
                }}
              >
                TARGET: {agent.name.toUpperCase()} // {agent.position.deskName.toUpperCase()}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {/* Active Task Collision Warning */}
          {isWorking && agent.currentTask && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 14px',
                background: 'rgba(245, 165, 36, 0.12)',
                border: '1px solid rgba(245, 165, 36, 0.45)',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f5a524', fontFamily: "'Orbitron', sans-serif", fontSize: '0.74rem', fontWeight: 800 }}>
                <AlertTriangle size={14} color="#f5a524" />
                <span>AGENT IS CURRENTLY WORKING ON A TASK</span>
              </div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.82rem', color: '#ffffff', lineHeight: 1.3 }}>
                "{agent.currentTask.title}"
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onCancelTask(agent.id, agent.currentTask?.id);
                    onClose();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '4px',
                    color: '#ef4444',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.66rem',
                    cursor: 'pointer'
                  }}
                >
                  <X size={11} />
                  <span>CANCEL CURRENT TASK</span>
                </button>
              </div>
            </div>
          )}

          {/* Task Input Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.68rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '6px',
                letterSpacing: '0.06em'
              }}
            >
              // TASK SPECIFICATION FOR {agent.name.toUpperCase()}:
            </label>
            <textarea
              ref={inputRef}
              disabled={isWorking}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isWorking
                  ? 'Agent busy. Cancel current task to assign a new one...'
                  : `Enter a task for ${agent.name} or click a preset below...`
              }
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(2, 6, 18, 0.9)',
                border: `1px solid ${isWorking ? 'rgba(255, 255, 255, 0.1)' : `${accentColor}60`}`,
                borderRadius: '8px',
                padding: '12px',
                color: '#ffffff',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.90rem',
                lineHeight: 1.4,
                outline: 'none',
                resize: 'none',
                boxShadow: isWorking ? 'none' : `0 0 16px ${accentColor}15`
              }}
            />
          </div>

          {/* Specialized Quick Suggestions */}
          {!isWorking && (
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
                // SPECIALTY PRESETS:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = accentColor;
                      e.currentTarget.style.background = `${accentColor}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    <Bookmark size={11} color={accentColor} />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Agent Orchestration Option Toggle */}
          {onDispatchOrchestration && (
            <div
              onClick={() => {
                if (!isWorking) {
                  soundFx.playClick();
                  setIsOrchestrationMode((p) => !p);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: isOrchestrationMode ? 'rgba(245, 165, 36, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isOrchestrationMode ? '#f5a524' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                cursor: isWorking ? 'not-allowed' : 'pointer'
              }}
            >
              <GitFork size={14} color={isOrchestrationMode ? '#f5a524' : 'rgba(255,255,255,0.4)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.70rem', fontWeight: 700, color: isOrchestrationMode ? '#f5a524' : '#ffffff' }}>
                  MULTI-AGENT COORDINATION MODE
                </div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.70rem', color: 'rgba(255,255,255,0.6)' }}>
                  Coordinate parallel subtasks with cross-agent feedback.
                </div>
              </div>
              <input
                type="checkbox"
                checked={isOrchestrationMode}
                onChange={() => {}}
                style={{ accentColor: '#f5a524', cursor: 'pointer' }}
              />
            </div>
          )}

          {/* Multi-Hop Walking Consultation Action */}
          <div
            onClick={() => {
              if (isWorking) return;
              soundFx.playChime();
              const prompt = taskInput.trim() || `Cross-domain analysis with ${agent.name}`;
              multiHopEngine.startConsultationChain(prompt);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              background: 'linear-gradient(135deg, rgba(0, 232, 255, 0.12) 0%, rgba(168, 85, 247, 0.15) 100%)',
              border: '1px solid rgba(0, 232, 255, 0.5)',
              borderRadius: '6px',
              cursor: isWorking ? 'not-allowed' : 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={15} color="#00e8ff" />
              <div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.68rem', fontWeight: 800, color: '#00e8ff' }}>
                  🚶 MULTI-AGENT WALKING CONSULTATION
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                  {agent.name} starts consultation chain across campus labs
                </div>
              </div>
            </div>
            <Play size={12} fill="#00e8ff" color="#00e8ff" />
          </div>

          {/* Modal Footer Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              Press [Enter] to assign • [Esc] to cancel
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={!taskInput.trim() || isWorking}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  background: !taskInput.trim() || isWorking ? 'rgba(255, 255, 255, 0.08)' : `linear-gradient(135deg, ${accentColor} 0%, #4f8eff 100%)`,
                  border: 'none',
                  borderRadius: '6px',
                  color: !taskInput.trim() || isWorking ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  cursor: !taskInput.trim() || isWorking ? 'not-allowed' : 'pointer',
                  boxShadow: !taskInput.trim() || isWorking ? 'none' : `0 0 16px ${accentColor}50`
                }}
              >
                <Play size={11} fill="#ffffff" />
                <span>{isOrchestrationMode ? 'DISPATCH PROJECT' : 'ASSIGN DIRECTIVE'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
