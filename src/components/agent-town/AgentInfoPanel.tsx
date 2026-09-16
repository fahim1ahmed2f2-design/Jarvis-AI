import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bot,
  Cpu,
  Zap,
  Activity,
  Radio,
  Shield,
  Brain,
  Sparkles,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  HardDrive,
  Wifi,
  Layers,
  Terminal,
  BookOpen,
  Play,
  Check,
  RotateCcw,
  AlertTriangle,
  History,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Send,
  MessageSquare,
  Database,
  Search,
  Plus,
  Trash2,
  Share2,
  Award,
  Bookmark,
  Wrench,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Crosshair,
  Navigation,
  Copy,
  Lock
} from 'lucide-react';
import {
  AgentTownMember,
  AgentStatus,
  TownMetrics,
  TaskStatus,
  AgentMessage,
  MessageStatus,
  AgentMemoryRecord,
  MemoryType,
  MemoryImportance,
  MemoryCounts,
  ToolAuditEntry,
  ParentTask
} from './types';
import { ToolDefinition } from './agentToolRegistry';
import { multiHopEngine, MultiHopSession } from './world/interaction/MultiHopConsultationEngine';
import { agentAIService } from './agentAIService';
import { soundFx } from '../../services/soundFxService';

interface AgentInfoPanelProps {
  selectedAgent: AgentTownMember | null;
  allAgents: AgentTownMember[];
  metrics: TownMetrics;
  messages: AgentMessage[];
  memories: AgentMemoryRecord[];
  memoryCounts: MemoryCounts;
  tools: ToolDefinition[];
  auditLogs: ToolAuditEntry[];
  globalToolsEnabled: boolean;
  activeParentTask?: ParentTask | null;
  onSelectAgent: (agent: AgentTownMember) => void;
  onOpenAssignModal: () => void;
  onCancelTask: (agentId: string, taskId?: string) => void;
  onRetryTask?: (agentId: string, taskId: string) => void;
  onCompleteTask?: (agentId: string, taskId?: string) => void;
  onRequestCollaboration?: (fromAgentId: string, toAgentId: string, prompt: string, taskId?: string | null) => Promise<any>;
  onAddMemory?: (record: Omit<AgentMemoryRecord, 'id' | 'timestamp'>) => void;
  onPromoteToAgent?: (id: string) => void;
  onPromoteToShared?: (id: string) => void;
  onDeleteMemory?: (id: string, force?: boolean) => { success: boolean; requiresConfirmation?: boolean };
  onConsolidateKnowledge?: () => { consolidatedCount: number };
  onToggleGlobalTools?: (enabled?: boolean) => void;
  onToggleAgentTools?: (agentId: string, enabled?: boolean) => void;
  onExecuteToolDirectly?: (agent: AgentTownMember, toolId: string, input: any) => Promise<any>;
  onFocusAgent?: (agentId: string) => void;
  onFollowAgent?: (agentId: string) => void;
  isFollowing?: boolean;
  onClose: () => void;
  primaryColor?: string;
}

type PanelTab = 'overview' | 'tasks' | 'chat' | 'memory' | 'tools' | 'permissions' | 'audit';

const TASK_STATUS_COLORS: Record<TaskStatus, { color: string; bg: string; border: string }> = {
  QUEUED: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', border: 'rgba(56, 189, 248, 0.3)' },
  WORKING: { color: '#00e8ff', bg: 'rgba(0, 232, 255, 0.15)', border: 'rgba(0, 232, 255, 0.45)' },
  COMPLETED: { color: '#10e890', bg: 'rgba(16, 232, 144, 0.12)', border: 'rgba(16, 232, 144, 0.40)' },
  CANCELLED: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' },
  FAILED: { color: '#ff4060', bg: 'rgba(255, 64, 96, 0.15)', border: 'rgba(255, 64, 96, 0.45)' }
};

const IMPORTANCE_CONFIG: Record<MemoryImportance, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: '#ff4060', bg: 'rgba(255, 64, 96, 0.15)', border: 'rgba(255, 64, 96, 0.45)' },
  HIGH: { color: '#f5a524', bg: 'rgba(245, 165, 36, 0.15)', border: 'rgba(245, 165, 36, 0.45)' },
  MEDIUM: { color: '#00e8ff', bg: 'rgba(0, 232, 255, 0.12)', border: 'rgba(0, 232, 255, 0.35)' },
  LOW: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.25)' }
};

export const AgentInfoPanel: React.FC<AgentInfoPanelProps> = ({
  selectedAgent,
  allAgents,
  metrics,
  messages,
  memories,
  memoryCounts,
  tools,
  auditLogs,
  globalToolsEnabled,
  activeParentTask,
  onSelectAgent,
  onOpenAssignModal,
  onCancelTask,
  onRetryTask,
  onCompleteTask,
  onRequestCollaboration,
  onAddMemory,
  onPromoteToAgent,
  onPromoteToShared,
  onDeleteMemory,
  onConsolidateKnowledge,
  onToggleGlobalTools,
  onToggleAgentTools,
  onExecuteToolDirectly,
  onFocusAgent,
  onFollowAgent,
  isFollowing = false,
  onClose,
  primaryColor = '#a855f7'
}) => {
  // Panel Active Sub-Tab
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');

  // Interactive States
  const [expandedHistoryTaskId, setExpandedHistoryTaskId] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  // Direct Neural Chat State
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatStreamReply, setChatStreamReply] = useState<string | null>(null);
  const [isChatThinking, setIsChatThinking] = useState(false);

  // Peer Collab Form State
  const [isCollabFormOpen, setIsCollabFormOpen] = useState(false);
  const [collabTargetId, setCollabTargetId] = useState<string>('');
  const [collabPrompt, setCollabPrompt] = useState<string>('');

  // Memory UI States
  const [memorySearch, setMemorySearch] = useState('');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<string>('ALL');
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryType, setNewMemoryType] = useState<MemoryType>('AGENT_MEMORY');
  const [newMemoryImportance, setNewMemoryImportance] = useState<MemoryImportance>('HIGH');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [consolidationNotice, setConsolidationNotice] = useState<string | null>(null);

  // Tool Test State
  const [selectedTestToolId, setSelectedTestToolId] = useState<string>('calculator');
  const [toolCustomInput, setToolCustomInput] = useState<string>('{\n  "expression": "256 * 1.5 + 48"\n}');
  const [toolTestOutput, setToolTestOutput] = useState<string | null>(null);
  const [isToolTesting, setIsToolTesting] = useState(false);

  // Multi-Hop Consultation Stream
  const [multiHopSession, setMultiHopSession] = useState<MultiHopSession | null>(null);

  useEffect(() => {
    return multiHopEngine.subscribe((s) => setMultiHopSession(s));
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const accentColor = selectedAgent ? selectedAgent.avatar.color || primaryColor : primaryColor;
  const isThinking = selectedAgent?.status === 'THINKING';
  const isWorking = selectedAgent?.status === 'WORKING';
  const isError = selectedAgent?.status === 'ERROR' || selectedAgent?.currentTask?.status === 'FAILED';
  const isCompleted = selectedAgent?.status === 'COMPLETED' || selectedAgent?.currentTask?.status === 'COMPLETED';

  // Available authorized tools for this agent
  const agentAllowedTools = useMemo(() => {
    if (!selectedAgent) return [];
    return tools.filter((t) => selectedAgent.allowedPermissions.includes(t.permission));
  }, [tools, selectedAgent]);

  // Agent Audit Logs
  const agentAuditLogs = useMemo(() => {
    if (!selectedAgent) return [];
    return auditLogs.filter((l) => l.agentId === selectedAgent.id);
  }, [auditLogs, selectedAgent]);

  // Filter memories for selected agent (private + shared)
  const filteredMemories = useMemo(() => {
    if (!selectedAgent) return [];

    return memories.filter((m) => {
      const isOwnerOrShared = m.agentId === selectedAgent.id || m.agentId === 'shared' || m.type === 'SHARED_MEMORY';
      if (!isOwnerOrShared) return false;

      if (memoryTypeFilter !== 'ALL' && m.type !== memoryTypeFilter) return false;

      if (memorySearch.trim()) {
        const q = memorySearch.toLowerCase();
        return m.content.toLowerCase().includes(q) || m.source.toLowerCase().includes(q);
      }
      return true;
    });
  }, [memories, selectedAgent, memoryTypeFilter, memorySearch]);

  const otherAgents = useMemo(() => {
    if (!selectedAgent) return [];
    return allAgents.filter((a) => a.id !== selectedAgent.id);
  }, [allAgents, selectedAgent]);

  const getAgentName = (id: string) => {
    const found = allAgents.find((a) => a.id === id);
    return found ? found.name : id;
  };

  // Direct 1-on-1 AI Chat Dispatch
  const handleSendDirectChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !chatPrompt.trim() || isChatThinking) return;

    soundFx.playClick();
    setIsChatThinking(true);
    setChatStreamReply(null);

    const taskMock = {
      id: `task_chat_${Date.now()}`,
      title: chatPrompt.trim(),
      assignedAgentId: selectedAgent.id,
      status: 'WORKING' as TaskStatus,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toLocaleTimeString(),
      completedAt: null,
      error: null,
      progress: 50
    };

    try {
      const res = await agentAIService.executeTask(selectedAgent, taskMock);
      if (res.success && res.result) {
        soundFx.playSuccess();
        setChatStreamReply(res.result);
      } else {
        setChatStreamReply(res.error || 'Agent completed reasoning analysis.');
      }
    } catch (err: any) {
      setChatStreamReply(`Execution error: ${err.message}`);
    } finally {
      setIsChatThinking(false);
      setChatPrompt('');
    }
  };

  // Send Collaboration Request
  const handleSendCollaboration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !collabTargetId || !collabPrompt.trim() || !onRequestCollaboration) return;

    soundFx.playChime();
    await onRequestCollaboration(
      selectedAgent.id,
      collabTargetId,
      collabPrompt.trim(),
      selectedAgent.currentTask?.id || null
    );

    setCollabPrompt('');
    setIsCollabFormOpen(false);
  };

  // Memory additions
  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !newMemoryContent.trim() || !onAddMemory) return;

    soundFx.playClick();
    onAddMemory({
      agentId: newMemoryType === 'SHARED_MEMORY' ? 'shared' : selectedAgent.id,
      type: newMemoryType,
      content: newMemoryContent.trim(),
      source: 'Operator Directive',
      relatedTaskId: selectedAgent.currentTask?.id || null,
      importance: newMemoryImportance
    });

    setNewMemoryContent('');
    setIsAddMemoryOpen(false);
  };

  const handleConsolidateClick = () => {
    if (onConsolidateKnowledge) {
      soundFx.playSuccess();
      const res = onConsolidateKnowledge();
      setConsolidationNotice(`Consolidated ${res.consolidatedCount} high-value records to Shared Memory.`);
      setTimeout(() => setConsolidationNotice(null), 4000);
    }
  };

  // Tool Sandbox Execution Test
  const handleRunToolTest = async () => {
    if (!selectedAgent || !onExecuteToolDirectly) return;

    soundFx.playClick();
    setIsToolTesting(true);

    let parsedInput: any = {};
    try {
      parsedInput = JSON.parse(toolCustomInput);
    } catch (err) {
      parsedInput = { query: toolCustomInput, expression: toolCustomInput, prompt: toolCustomInput, text: toolCustomInput };
    }

    try {
      const res = await onExecuteToolDirectly(selectedAgent, selectedTestToolId, parsedInput);
      soundFx.playSuccess();
      setToolTestOutput(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setToolTestOutput(`Tool Execution Error: ${err.message}`);
    } finally {
      setIsToolTesting(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTaskId(id);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  return (
    <aside
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '420px',
        borderLeft: '1px solid rgba(0, 232, 255, 0.25)',
        background: 'linear-gradient(180deg, rgba(3, 10, 28, 0.98) 0%, rgba(6, 14, 38, 0.98) 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        zIndex: 25,
        overflow: 'hidden',
        boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* ── TOP HEADER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: `linear-gradient(90deg, ${accentColor}18 0%, transparent 100%)`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color={accentColor} />
          <div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.84rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#ffffff'
              }}
            >
              {selectedAgent ? `${selectedAgent.name.toUpperCase()} // AGENT PROFILE` : 'TOWN OVERVIEW'}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.60rem', color: accentColor }}>
              {selectedAgent ? selectedAgent.position.deskName : 'CAMPUS MONITOR'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Close Profile Panel"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <X size={14} />
        </button>
      </div>

      {selectedAgent ? (
        <>
          {/* ── SUB-TABS NAVIGATION BAR ── */}
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              background: 'rgba(10, 16, 34, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '4px 8px',
              gap: '4px'
            }}
          >
            {[
              { id: 'overview', label: 'Overview', icon: Zap },
              { id: 'tasks', label: 'Tasks', icon: Play },
              { id: 'chat', label: 'Neural Chat', icon: MessageSquare },
              { id: 'memory', label: 'Memory', icon: Brain },
              { id: 'tools', label: 'Tools', icon: Wrench },
              { id: 'permissions', label: 'Skills', icon: Shield },
              { id: 'audit', label: 'Audit', icon: Terminal }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab(tab.id as PanelTab);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: isActive ? `${accentColor}25` : 'transparent',
                    border: `1px solid ${isActive ? accentColor : 'transparent'}`,
                    borderRadius: '5px',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.64rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <TabIcon size={11} color={isActive ? accentColor : 'rgba(255, 255, 255, 0.5)'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── SCROLLABLE TAB CONTENT ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* ════════════ 1. TAB: OVERVIEW ════════════ */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Agent Identity Showcase Card */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '16px',
                    background: 'rgba(2, 6, 20, 0.75)',
                    border: `1px solid ${accentColor}50`,
                    borderRadius: '12px',
                    boxShadow: `0 0 20px ${accentColor}18`
                  }}
                >
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${accentColor}35 0%, rgba(2, 6, 18, 0.9) 100%)`,
                      border: `1px solid ${accentColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 16px ${accentColor}50`,
                      marginBottom: '8px'
                    }}
                  >
                    <Bot size={26} color={accentColor} />
                  </div>

                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                    {selectedAgent.name}
                  </div>

                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: accentColor, marginTop: '2px' }}>
                    {selectedAgent.codename} • {selectedAgent.position.deskName}
                  </div>

                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.80rem', color: 'rgba(216, 180, 254, 0.85)', marginTop: '4px' }}>
                    {selectedAgent.role}
                  </div>

                  {/* Status Indicator Pill */}
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      background: isThinking ? 'rgba(245, 165, 36, 0.2)' : isCompleted ? 'rgba(16, 232, 144, 0.2)' : isError ? 'rgba(255, 64, 96, 0.2)' : `${accentColor}20`,
                      border: `1px solid ${isThinking ? '#f5a524' : isCompleted ? '#10e890' : isError ? '#ff4060' : accentColor}`,
                      borderRadius: '12px',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: isThinking ? '#f5a524' : isCompleted ? '#10e890' : isError ? '#ff4060' : accentColor
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isThinking ? '#f5a524' : isCompleted ? '#10e890' : isError ? '#ff4060' : accentColor,
                        boxShadow: `0 0 6px ${accentColor}`
                      }}
                    />
                    <span>{selectedAgent.status}</span>
                  </div>
                </div>

                {/* Cognitive Gauges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'rgba(2, 6, 20, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.60rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      NEURAL LOAD
                    </div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: accentColor, marginTop: '2px' }}>
                      {selectedAgent.neuralLoad}%
                    </div>
                    <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedAgent.neuralLoad}%`, height: '100%', background: accentColor }} />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(2, 6, 20, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.60rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      RAM ALLOCATED
                    </div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#10e890', marginTop: '2px' }}>
                      {selectedAgent.memoryAllocated || '512 MB'}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                      LATENCY: {selectedAgent.latencyMs || 10}ms
                    </div>
                  </div>
                </div>

                {/* Behavioral Archetype */}
                <div style={{ background: 'rgba(2, 6, 20, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                    // PERSONALITY & OPERATIONAL DIRECTIVE:
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.3 }}>
                    "{selectedAgent.personality}"
                  </div>
                </div>

                {/* Quick Camera Focus Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {onFocusAgent && (
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onFocusAgent(selectedAgent.id);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px',
                        background: 'rgba(0, 232, 255, 0.15)',
                        border: '1px solid #00e8ff',
                        borderRadius: '6px',
                        color: '#00e8ff',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Crosshair size={12} />
                      <span>FOCUS CAMERA</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onOpenAssignModal();
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px',
                      background: `linear-gradient(135deg, ${accentColor} 0%, #4f8eff 100%)`,
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: `0 0 12px ${accentColor}40`
                    }}
                  >
                    <Play size={11} fill="#ffffff" />
                    <span>ASSIGN TASK</span>
                  </button>
                </div>
              </div>
            )}

            {/* ════════════ 2. TAB: TASKS & MISSIONS ════════════ */}
            {activeTab === 'tasks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Active Working Task */}
                <div
                  style={{
                    background: 'rgba(2, 6, 20, 0.85)',
                    border: `1px solid ${isWorking ? '#00e8ff' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '10px',
                    padding: '14px',
                    boxShadow: isWorking ? '0 0 20px rgba(0, 232, 255, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.74rem', fontWeight: 800, color: '#00e8ff' }}>
                      CURRENT TASK IN FLIGHT
                    </span>
                    {selectedAgent.currentTask && (
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.60rem',
                          color: TASK_STATUS_COLORS[selectedAgent.currentTask.status]?.color || '#00e8ff',
                          background: TASK_STATUS_COLORS[selectedAgent.currentTask.status]?.bg || 'transparent',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {selectedAgent.currentTask.status}
                      </span>
                    )}
                  </div>

                  {selectedAgent.currentTask ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
                        {selectedAgent.currentTask.title}
                      </div>

                      <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${selectedAgent.currentTask.progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00e8ff 0%, #10e890 100%)',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.60rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          STARTED: {selectedAgent.currentTask.startedAt || 'JUST NOW'}
                        </span>

                        <button
                          onClick={() => onCancelTask(selectedAgent.id, selectedAgent.currentTask?.id)}
                          style={{
                            padding: '3px 8px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '4px',
                            color: '#ef4444',
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '0.60rem',
                            cursor: 'pointer'
                          }}
                        >
                          CANCEL TASK
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 0', textAlign: 'center', fontFamily: "'Rajdhani', sans-serif", fontSize: '0.80rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                      No active task in progress. Agent is idle and ready.
                    </div>
                  )}
                </div>

                {/* Task History Log */}
                <div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                    // RECENT TASK HISTORY ({selectedAgent.taskHistory?.length || 0}):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selectedAgent.taskHistory || []).map((th) => {
                      const isExpanded = expandedHistoryTaskId === th.id;
                      return (
                        <div
                          key={th.id}
                          style={{
                            background: 'rgba(2, 6, 20, 0.65)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.64rem', color: '#10e890' }}>
                              ✓ COMPLETED
                            </span>
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                              {th.completedAt || 'Recent'}
                            </span>
                          </div>

                          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.80rem', fontWeight: 600, color: '#ffffff' }}>
                            {th.title}
                          </div>

                          {th.result && (
                            <div>
                              <div
                                onClick={() => setExpandedHistoryTaskId(isExpanded ? null : th.id)}
                                style={{
                                  fontFamily: "'Share Tech Mono', monospace",
                                  fontSize: '0.60rem',
                                  color: accentColor,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>{isExpanded ? 'Hide Result' : 'View Full Output'}</span>
                                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              </div>

                              {isExpanded && (
                                <div
                                  style={{
                                    marginTop: '6px',
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '6px',
                                    padding: '8px',
                                    fontFamily: "'Share Tech Mono', monospace",
                                    fontSize: '0.64rem',
                                    color: 'rgba(216, 180, 254, 0.95)',
                                    lineHeight: 1.35,
                                    position: 'relative'
                                  }}
                                >
                                  {th.result}
                                  <button
                                    onClick={() => handleCopyText(th.result || '', th.id)}
                                    title="Copy Result"
                                    style={{
                                      position: 'absolute',
                                      top: '6px',
                                      right: '6px',
                                      background: 'rgba(255, 255, 255, 0.1)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '2px 4px',
                                      color: '#ffffff',
                                      cursor: 'pointer',
                                      fontSize: '0.55rem'
                                    }}
                                  >
                                    {copiedTaskId === th.id ? 'COPIED!' : <Copy size={10} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════ 3. TAB: DIRECT NEURAL CHAT & COLLAB ════════════ */}
            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(2, 6, 20, 0.85)', border: `1px solid ${accentColor}40`, borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.74rem', fontWeight: 800, color: accentColor, marginBottom: '6px' }}>
                    DIRECT 1-ON-1 AI DIALOGUE
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Prompt {selectedAgent.name} directly. Queries are routed through this agent's specialized behavioral persona, episodic memories, and authorized tools.
                  </div>

                  {/* Chat Output Stream */}
                  {chatStreamReply && (
                    <div
                      style={{
                        marginTop: '12px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: `1px solid ${accentColor}60`,
                        borderRadius: '8px',
                        padding: '12px',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.70rem',
                        color: '#ffffff',
                        lineHeight: 1.4,
                        maxHeight: '220px',
                        overflowY: 'auto'
                      }}
                    >
                      <div style={{ color: accentColor, fontWeight: 800, marginBottom: '4px' }}>
                        [{selectedAgent.name.toUpperCase()} REPLY]:
                      </div>
                      {chatStreamReply}
                    </div>
                  )}

                  {isChatThinking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: accentColor }}>
                      <Activity size={12} style={{ animation: 'v3Pulse 1.2s infinite' }} />
                      <span>{selectedAgent.name} is synthesizing reasoning...</span>
                    </div>
                  )}

                  {/* Input Form */}
                  <form onSubmit={handleSendDirectChat} style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      placeholder={`Ask ${selectedAgent.name} a question or give a command...`}
                      disabled={isChatThinking}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${accentColor}50`,
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#ffffff',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.84rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!chatPrompt.trim() || isChatThinking}
                      style={{
                        padding: '8px 14px',
                        background: accentColor,
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ffffff',
                        cursor: isChatThinking ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>

                {/* Peer Collaboration Trigger */}
                <div style={{ background: 'rgba(2, 6, 20, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', fontWeight: 800, color: '#10e890' }}>
                      INTER-AGENT COLLABORATION DISPATCH
                    </span>
                    <button
                      onClick={() => setIsCollabFormOpen(!isCollabFormOpen)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#10e890',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.62rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isCollabFormOpen ? '[-] Close' : '[+] New Collaboration'}
                    </button>
                  </div>

                  {isCollabFormOpen && (
                    <form onSubmit={handleSendCollaboration} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <select
                        value={collabTargetId}
                        onChange={(e) => setCollabTargetId(e.target.value)}
                        style={{
                          background: '#020612',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#ffffff',
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.68rem'
                        }}
                      >
                        <option value="">Select Target Peer Agent...</option>
                        {otherAgents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name} ({ag.role})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={collabPrompt}
                        onChange={(e) => setCollabPrompt(e.target.value)}
                        placeholder="Collaboration directive or query..."
                        style={{
                          background: '#020612',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#ffffff',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '0.80rem'
                        }}
                      />

                      <button
                        type="submit"
                        disabled={!collabTargetId || !collabPrompt.trim()}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #10e890 0%, #00e8ff 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#020612',
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        SEND NEURAL CONDUIT REQUEST
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ════════════ 4. TAB: MEMORY VAULT ════════════ */}
            {activeTab === 'memory' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Search & Actions Bar */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={12} color="rgba(255, 255, 255, 0.4)" style={{ position: 'absolute', top: '9px', left: '8px' }} />
                    <input
                      type="text"
                      value={memorySearch}
                      onChange={(e) => setMemorySearch(e.target.value)}
                      placeholder="Search memory records..."
                      style={{
                        width: '100%',
                        background: 'rgba(2, 6, 20, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '6px 8px 6px 26px',
                        color: '#ffffff',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.68rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <button
                    onClick={() => setIsAddMemoryOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      background: 'rgba(0, 232, 255, 0.15)',
                      border: '1px solid #00e8ff',
                      borderRadius: '6px',
                      color: '#00e8ff',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.64rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={11} />
                    <span>ADD</span>
                  </button>

                  <button
                    onClick={handleConsolidateClick}
                    title="Consolidate High-Importance Memories to Shared Vault"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid #a855f7',
                      borderRadius: '6px',
                      color: '#a855f7',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.64rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={11} />
                    <span>CONSOLIDATE</span>
                  </button>
                </div>

                {consolidationNotice && (
                  <div style={{ background: 'rgba(16, 232, 144, 0.15)', border: '1px solid #10e890', borderRadius: '6px', padding: '6px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.64rem', color: '#10e890' }}>
                    {consolidationNotice}
                  </div>
                )}

                {/* Add Memory Modal Sub-form */}
                {isAddMemoryOpen && (
                  <form onSubmit={handleAddMemorySubmit} style={{ background: 'rgba(2, 6, 20, 0.95)', border: '1px solid #00e8ff', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.72rem', fontWeight: 800, color: '#00e8ff' }}>
                      INSERT NEW MEMORY RECORD
                    </div>
                    <textarea
                      value={newMemoryContent}
                      onChange={(e) => setNewMemoryContent(e.target.value)}
                      placeholder="Enter knowledge or memory snippet..."
                      rows={3}
                      style={{
                        background: '#000000',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '8px',
                        color: '#ffffff',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.80rem'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddMemoryOpen(false)}
                        style={{ padding: '4px 8px', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', color: '#ffffff', fontSize: '0.60rem' }}
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={!newMemoryContent.trim()}
                        style={{ padding: '4px 10px', background: '#00e8ff', border: 'none', borderRadius: '4px', color: '#020612', fontFamily: "'Orbitron', sans-serif", fontSize: '0.62rem', fontWeight: 800 }}
                      >
                        SAVE
                      </button>
                    </div>
                  </form>
                )}

                {/* Memory Records List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredMemories.map((mem) => (
                    <div
                      key={mem.id}
                      style={{
                        background: 'rgba(2, 6, 20, 0.7)',
                        border: `1px solid ${IMPORTANCE_CONFIG[mem.importance]?.border || 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '0.58rem',
                            color: IMPORTANCE_CONFIG[mem.importance]?.color || '#00e8ff',
                            background: IMPORTANCE_CONFIG[mem.importance]?.bg || 'transparent',
                            padding: '1px 6px',
                            borderRadius: '3px'
                          }}
                        >
                          {mem.type} // {mem.importance}
                        </span>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {mem.type !== 'SHARED_MEMORY' && onPromoteToShared && (
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                onPromoteToShared(mem.id);
                              }}
                              title="Promote to Shared Team Memory"
                              style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '2px' }}
                            >
                              <Share2 size={11} />
                            </button>
                          )}
                          {onDeleteMemory && (
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                onDeleteMemory(mem.id, true);
                              }}
                              title="Delete Record"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.80rem', color: '#ffffff', lineHeight: 1.3 }}>
                        {mem.content}
                      </div>

                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.56rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                        SOURCE: {mem.source} • {mem.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════ 5. TAB: TOOLS & LIVE SANDBOX ════════════ */}
            {activeTab === 'tools' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(2, 6, 20, 0.85)', border: '1px solid rgba(0, 232, 255, 0.3)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.74rem', fontWeight: 800, color: '#00e8ff' }}>
                      AUTHORIZED TOOL EXECUTOR
                    </span>
                    <button
                      onClick={() => onToggleAgentTools && onToggleAgentTools(selectedAgent.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: selectedAgent.toolsEnabled ? '#10e890' : '#ef4444',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.62rem',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedAgent.toolsEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      <span>{selectedAgent.toolsEnabled ? 'TOOLS ACTIVE' : 'TOOLS DISABLED'}</span>
                    </button>
                  </div>

                  {/* Tool Select Dropdown */}
                  <select
                    value={selectedTestToolId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedTestToolId(id);
                      if (id === 'calculator') setToolCustomInput('{\n  "expression": "256 * 1.5 + 48"\n}');
                      else if (id === 'text_processor') setToolCustomInput('{\n  "text": "Agent Town v2 operating at 60 FPS",\n  "mode": "word_count"\n}');
                      else if (id === 'knowledge_search') setToolCustomInput('{\n  "query": "resilience"\n}');
                      else if (id === 'task_planner') setToolCustomInput('{\n  "objective": "Full campus telemetry scan"\n}');
                      else if (id === 'code_solver') setToolCustomInput('{\n  "prompt": "Optimize binary search tree",\n  "language": "typescript"\n}');
                      else if (id === 'cyber_defense_scanner') setToolCustomInput('{\n  "target": "Campus Subnet 01"\n}');
                      else if (id === 'data_pipeline_streamer') setToolCustomInput('{\n  "records": 500000,\n  "topic": "telemetry.stream"\n}');
                      else if (id === 'creative_palette_generator') setToolCustomInput('{\n  "theme": "Cyber Neon Glow"\n}');
                    }}
                    style={{
                      width: '100%',
                      background: '#020612',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#ffffff',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.68rem',
                      marginBottom: '8px'
                    }}
                  >
                    {agentAllowedTools.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>

                  {/* JSON Input Area */}
                  <textarea
                    value={toolCustomInput}
                    onChange={(e) => setToolCustomInput(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      background: '#000000',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#00e8ff',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.68rem',
                      resize: 'none'
                    }}
                  />

                  <button
                    onClick={handleRunToolTest}
                    disabled={isToolTesting}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #00e8ff 0%, #a855f7 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: isToolTesting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isToolTesting ? 'EXECUTING IN SANDBOX...' : 'RUN TOOL IN SANDBOX'}
                  </button>

                  {/* Sandbox Result Output */}
                  {toolTestOutput && (
                    <div
                      style={{
                        marginTop: '10px',
                        background: '#000000',
                        border: '1px solid rgba(16, 232, 144, 0.4)',
                        borderRadius: '6px',
                        padding: '8px',
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.64rem',
                        color: '#10e890',
                        maxHeight: '160px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {toolTestOutput}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════ 6. TAB: PERMISSIONS & SKILLS ════════════ */}
            {activeTab === 'permissions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  // GRANTED SKILLS & CAPABILITIES ({selectedAgent.skills?.length || 0}):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedAgent.skills || []).map((sk) => (
                    <div
                      key={sk.id}
                      style={{
                        background: 'rgba(2, 6, 20, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.74rem', fontWeight: 700, color: '#ffffff' }}>
                          {sk.name}
                        </div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {sk.description}
                        </div>
                      </div>

                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.58rem',
                          color: sk.enabled ? '#10e890' : '#ef4444',
                          background: sk.enabled ? 'rgba(16, 232, 144, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${sk.enabled ? 'rgba(16, 232, 144, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {sk.enabled ? 'ACTIVE' : 'RESTRICTED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════ 7. TAB: AUDIT & EVENT LOG ════════════ */}
            {activeTab === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  // AGENT AUDIT LOG ({agentAuditLogs.length} ENTRIES):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {agentAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: 'rgba(2, 6, 20, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.64rem', fontWeight: 700, color: '#00e8ff' }}>
                          TOOL: {log.toolName}
                        </span>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.56rem', color: log.status === 'SUCCESS' ? '#10e890' : '#ff4060' }}>
                          {log.status}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        {log.timestamp} • {log.inputSummary || 'Executed cleanly'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Town Overview State when no agent is selected */
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', alignItems: 'center' }}>
          <Brain size={36} color="#00e8ff" />
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
            AGENT TOWN HEADQUARTERS
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.80rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            Select an agent from the top bar or workspace to inspect cognitive load, dispatch direct directives, and review telemetry.
          </div>
        </div>
      )}
    </aside>
  );
};
