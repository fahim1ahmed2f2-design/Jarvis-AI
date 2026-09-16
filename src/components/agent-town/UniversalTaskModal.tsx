import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  X,
  Sparkles,
  Brain,
  Cpu,
  BookOpen,
  Layers,
  Terminal,
  GitFork,
  Shield,
  Zap,
  Bookmark
} from 'lucide-react';
import { AgentTownMember } from './types';
import { soundFx } from '../../services/soundFxService';

interface UniversalTaskModalProps {
  isOpen: boolean;
  agents: AgentTownMember[];
  onDispatch: (targetAgentId: string, taskTitle: string, isOrchestration: boolean) => void;
  onClose: () => void;
  primaryColor?: string;
}

interface PresetTemplate {
  id: string;
  title: string;
  targetId: 'AUTO' | string;
  isOrchestration: boolean;
  category: string;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'p1',
    title: 'Conduct Full Campus Security Audit & Perimeter Vulnerability Scan',
    targetId: 'agent-jonson',
    isOrchestration: false,
    category: 'SECURITY'
  },
  {
    id: 'p2',
    title: 'Synthesize Autonomous Multi-Agent Consensus & Strategic Roadmap',
    targetId: 'AUTO',
    isOrchestration: true,
    category: 'ORCHESTRATION'
  },
  {
    id: 'p3',
    title: 'Deep Research on Quantum-Resistant Cryptography & Zero-Knowledge Proofs',
    targetId: 'agent-alice',
    isOrchestration: false,
    category: 'RESEARCH'
  },
  {
    id: 'p4',
    title: 'Benchmark High-Throughput Big Data Stream Pipeline & Redis Caching',
    targetId: 'agent-mob',
    isOrchestration: false,
    category: 'BIG DATA'
  },
  {
    id: 'p5',
    title: 'Design Next-Gen Cyber Neon Holographic UI Palette & Glassmorphic Specs',
    targetId: 'agent-tuly',
    isOrchestration: false,
    category: 'CREATIVE UI'
  },
  {
    id: 'p6',
    title: 'Audit Docker Kubernetes Cluster Containers & Multi-Region Health Probes',
    targetId: 'agent-knox',
    isOrchestration: false,
    category: 'CLOUD OPS'
  }
];

export const UniversalTaskModal: React.FC<UniversalTaskModalProps> = ({
  isOpen,
  agents,
  onDispatch,
  onClose,
  primaryColor = '#00e8ff'
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<'AUTO' | string>('AUTO');
  const [isOrchestration, setIsOrchestration] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTaskInput('');
      setSelectedTarget('AUTO');
      setIsOrchestration(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    soundFx.playSuccess();
    if (selectedTarget === 'AUTO') {
      onDispatch('agent-dave', taskInput.trim(), true);
    } else {
      onDispatch(selectedTarget, taskInput.trim(), isOrchestration);
    }
    onClose();
  };

  const handleApplyPreset = (preset: PresetTemplate) => {
    soundFx.playClick();
    setTaskInput(preset.title);
    setSelectedTarget(preset.targetId);
    setIsOrchestration(preset.isOrchestration);
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
        zIndex: 55,
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
          maxWidth: '580px',
          maxHeight: '92vh',
          background: 'linear-gradient(180deg, rgba(6, 14, 38, 0.98) 0%, rgba(3, 8, 26, 0.98) 100%)',
          border: `1px solid ${primaryColor}80`,
          borderRadius: '14px',
          boxShadow: `0 0 50px ${primaryColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'v3FadeIn 0.18s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: `linear-gradient(90deg, ${primaryColor}20 0%, transparent 100%)`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${primaryColor}35 0%, rgba(2, 6, 18, 0.8) 100%)`,
                border: `1px solid ${primaryColor}80`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={18} color={primaryColor} />
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
                NEW AGENT TOWN DIRECTIVE v2
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.64rem',
                  color: primaryColor
                }}
              >
                CENTRAL COMMAND // {agents.length} SPECIALIZED AGENT NODES ONLINE
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {/* Directive Input */}
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
              // WHAT SHOULD THE AGENT TOWN TEAM EXECUTE?
            </label>
            <textarea
              ref={inputRef}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type your directive or pick a 1-click preset below...'
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(2, 6, 18, 0.9)',
                border: `1px solid ${primaryColor}60`,
                borderRadius: '8px',
                padding: '12px',
                color: '#ffffff',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.90rem',
                lineHeight: 1.4,
                outline: 'none',
                resize: 'none',
                boxShadow: `0 0 16px ${primaryColor}15`
              }}
            />
          </div>

          {/* 1-Click Preset Templates */}
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.64rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
              // 1-CLICK PRESET DIRECTIVES:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px' }}>
              {PRESET_TEMPLATES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
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
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.background = 'rgba(0, 232, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <Bookmark size={11} color={primaryColor} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Selector Grid */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.66rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '6px'
              }}
            >
              // EXECUTION TARGET ({agents.length} AGENTS READY)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedTarget('AUTO');
                  setIsOrchestration(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  background: selectedTarget === 'AUTO' ? 'rgba(245, 165, 36, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${selectedTarget === 'AUTO' ? '#f5a524' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gridColumn: 'span 2'
                }}
              >
                <GitFork size={14} color="#f5a524" />
                <div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#f5a524' }}>
                    AUTO-SELECT (Dave + Multi-Agent DAG)
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.70rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Intelligently decomposes complex objectives across specialized team members.
                  </div>
                </div>
              </button>

              {agents.map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedTarget(ag.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    background: selectedTarget === ag.id ? `${ag.avatar.color}25` : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${selectedTarget === ag.id ? ag.avatar.color : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ag.avatar.color, boxShadow: `0 0 6px ${ag.avatar.color}` }} />
                  <div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.68rem', fontWeight: 700 }}>
                      {ag.name}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.56rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {ag.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
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
              Press [Enter] to dispatch • [Esc] to cancel
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
                disabled={!taskInput.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  background: !taskInput.trim() ? 'rgba(255, 255, 255, 0.08)' : `linear-gradient(135deg, ${primaryColor} 0%, #4f8eff 100%)`,
                  border: 'none',
                  borderRadius: '6px',
                  color: !taskInput.trim() ? 'rgba(255, 255, 255, 0.3)' : '#ffffff',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  cursor: !taskInput.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: !taskInput.trim() ? 'none' : `0 0 16px ${primaryColor}50`
                }}
              >
                <Play size={11} fill="#ffffff" />
                <span>DISPATCH DIRECTIVE</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
