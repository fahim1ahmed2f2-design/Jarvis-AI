import { TownAgent, TownMetrics } from './types';

export const INITIAL_TOWN_METRICS: TownMetrics = {
  totalAgents: 6,
  activeAgents: 4,
  availableAgents: 2,
  currentTasks: 3,
  systemLoad: 24.8,
  townStatus: 'ALL NODES SYNCHRONIZED // ZERO ANOMALIES'
};

export const INITIAL_AGENTS: TownAgent[] = [
  {
    id: 'agent-athena',
    name: 'Athena',
    codename: 'STRAT-CORE // 01',
    role: 'Strategic Reasoning & Executive Synthesis',
    sector: 'EXECUTIVE',
    status: 'READY',
    avatarColor: '#00e8ff',
    currentTask: 'Synthesizing tactical priority matrix for current session',
    lastActivity: '8s ago — Calibrated command reasoning weights',
    capabilities: ['Deep Reasoning', 'Goal Decomposition', 'Multi-Step Planning', 'Executive Briefing'],
    neuralLoad: 38,
    memoryAllocated: '512 MB',
    latencyMs: 14,
    statusDescription: 'Standing by on primary cognition loop.'
  },
  {
    id: 'agent-sentinel',
    name: 'Sentinel',
    codename: 'GUARD-EYE // 02',
    role: 'Threat Monitoring & System Defense',
    sector: 'EXECUTIVE',
    status: 'READY',
    avatarColor: '#10e890',
    currentTask: 'Active perimeter watchdog & process integrity telemetry',
    lastActivity: '3s ago — Validated system security tokens',
    capabilities: ['Threat Detection', 'Permission Guard', 'Network Watchdog', 'Process Sentinel'],
    neuralLoad: 22,
    memoryAllocated: '256 MB',
    latencyMs: 9,
    statusDescription: 'All local endpoints secure and authenticated.'
  },
  {
    id: 'agent-chronos',
    name: 'Chronos',
    codename: 'CHRONO-MEM // 03',
    role: 'Ambient Memory & Temporal Archival',
    sector: 'RESEARCH',
    status: 'PROCESSING',
    avatarColor: '#a855f7',
    currentTask: 'Indexing conversation vectors and chronological episodic cache',
    lastActivity: 'Just now — Formatted ambient speech transcripts',
    capabilities: ['Episodic Retrieval', 'Semantic Indexing', 'Knowledge Graph', 'Temporal Timeline'],
    neuralLoad: 68,
    memoryAllocated: '768 MB',
    latencyMs: 28,
    statusDescription: 'Vector indexing pipeline active.'
  },
  {
    id: 'agent-cipher',
    name: 'Cipher',
    codename: 'NEURAL-CRYPT // 04',
    role: 'Deep Code Analysis & Neural Encryption',
    sector: 'RESEARCH',
    status: 'IDLE',
    avatarColor: '#f5a524',
    currentTask: 'Standing by for sandbox execution and code verification',
    lastActivity: '45s ago — Audited local script permissions',
    capabilities: ['Code Synthesis', 'AST Parsing', 'Sandbox Isolation', 'Encryption'],
    neuralLoad: 12,
    memoryAllocated: '192 MB',
    latencyMs: 16,
    statusDescription: 'Code sandbox idle in low-power standby.'
  },
  {
    id: 'agent-orion',
    name: 'Orion',
    codename: 'AUTO-FORGE // 05',
    role: 'Autonomous Macro Ops & Tool Dispatcher',
    sector: 'OPERATIONS',
    status: 'READY',
    avatarColor: '#4f8eff',
    currentTask: 'Monitoring automated workflow triggers & OS dispatch queues',
    lastActivity: '14s ago — Synchronized automation scheduler',
    capabilities: ['Macro Execution', 'GUI Automation', 'File System Ops', 'Workflow Chaining'],
    neuralLoad: 31,
    memoryAllocated: '384 MB',
    latencyMs: 11,
    statusDescription: 'Workflow queue primed for dispatch.'
  },
  {
    id: 'agent-nexus',
    name: 'Nexus',
    codename: 'COMM-RELAY // 06',
    role: 'IoT Gateway & Telemetry Bridge',
    sector: 'OPERATIONS',
    status: 'STANDBY',
    avatarColor: '#ec4899',
    currentTask: 'Awaiting device handshake on local subnetwork',
    lastActivity: '2m ago — Polled smart device hub status',
    capabilities: ['Smart Home Protocol', 'Hardware Sensor Bus', 'Audio Receptors', 'WebSocket Streams'],
    neuralLoad: 8,
    memoryAllocated: '128 MB',
    latencyMs: 21,
    statusDescription: 'Subsystem in low-latency standby mode.'
  }
];
