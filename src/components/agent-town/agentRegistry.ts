import { AgentTownMember, AgentStatus, AgentPosition, AgentMessage, AgentTask, TaskStatus, TownMetrics, ActiveConnection, AgentMemoryRecord, MemoryCounts, AgentSkill, ParentTask, ActivityEvent } from './types';
import { agentAIService } from './agentAIService';
import { agentCommunicationService } from './agentCommunicationService';
import { agentMemoryManager } from './agentMemoryManager';
import { agentToolRegistry } from './agentToolRegistry';
import { agentOrchestrator } from './agentOrchestrator';
import { agentActivityFeed } from './agentActivityFeed';

export const INITIAL_CORE_AGENTS: AgentTownMember[] = [
  {
    id: 'agent-alice',
    name: 'Alice',
    codename: 'RESEARCH // 01',
    role: 'Research & Analysis Agent',
    personality: 'Analytical, evidence-focused, concise, structured',
    status: 'READY',
    currentTask: null,
    previousTask: 'Synthesized literature on autonomous multi-agent networks',
    taskHistory: [
      {
        id: 'task-alice-init-1',
        title: 'Synthesized literature on autonomous multi-agent networks',
        assignedAgentId: 'agent-alice',
        status: 'COMPLETED',
        createdAt: '2026-08-31T08:00:00.000Z',
        startedAt: '08:00',
        completedAt: '08:12',
        result: 'Comprehensive analysis of decentralized agent topologies, consensus protocols, and asynchronous messaging vectors. Identified optimal latency thresholds for digital office environments.',
        toolsUsed: ['Knowledge Search', 'Text Processor'],
        error: null,
        progress: 100
      }
    ],
    capabilities: [
      'Deep Research',
      'Data Synthesis',
      'Multi-Source Analysis',
      'Hypothesis Generation'
    ],
    skills: [
      { id: 'sk-al-1', name: 'Research Synthesis', description: 'Cross-correlate empirical data', category: 'RESEARCH', enabled: true, requiredPermission: 'analysis' },
      { id: 'sk-al-2', name: 'Data Analysis', description: 'Quantitative mathematical analysis', category: 'ANALYSIS', enabled: true, requiredPermission: 'analysis' },
      { id: 'sk-al-3', name: 'Knowledge Search', description: 'Episodic memory indexing and query', category: 'KNOWLEDGE', enabled: true, requiredPermission: 'knowledge_search' },
      { id: 'sk-al-4', name: 'Text Processing', description: 'Summarization and structuring', category: 'KNOWLEDGE', enabled: true, requiredPermission: 'text_processing' },
      { id: 'sk-al-5', name: 'Computer Control', description: 'Direct OS execution (Restricted)', category: 'SYSTEM', enabled: false, requiredPermission: 'system_control' }
    ],
    allowedPermissions: ['analysis', 'text_processing', 'knowledge_search', 'task_planning'],
    toolsEnabled: true,
    avatar: {
      color: '#00e8ff',
      icon: 'Brain',
      glowColor: '#00e8ff'
    },
    position: {
      deskId: 'DESK_RESEARCH',
      deskName: 'Research Desk',
      sector: 'RESEARCH',
      zone: 'Sector 01: Investigation Lab'
    },
    lastActivity: 'Calibrated analytical search heuristics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 28,
    memoryAllocated: '512 MB',
    latencyMs: 12,
    statusDescription: 'Analytical pipeline primed for deep queries.',
    activeCollabText: null
  },
  {
    id: 'agent-bob',
    name: 'Bob',
    codename: 'OPS-EXEC // 02',
    role: 'Automation & Execution Agent',
    personality: 'Action-oriented, procedural, precise, safety-conscious',
    status: 'READY',
    currentTask: null,
    previousTask: 'Audited background tool executor permissions',
    taskHistory: [
      {
        id: 'task-bob-init-1',
        title: 'Audited background tool executor permissions',
        assignedAgentId: 'agent-bob',
        status: 'COMPLETED',
        createdAt: '2026-08-31T08:05:00.000Z',
        startedAt: '08:05',
        completedAt: '08:09',
        result: 'Validated sandbox isolation policies, API authentication tokens, and process termination hooks across all active subsystem channels.',
        toolsUsed: ['Task Planner'],
        error: null,
        progress: 100
      }
    ],
    capabilities: [
      'Task Automation',
      'Execution Planning',
      'Script Formatting',
      'Batch Operations'
    ],
    skills: [
      { id: 'sk-bo-1', name: 'Task Planning', description: 'Decompose execution roadmaps', category: 'PLANNING', enabled: true, requiredPermission: 'task_planning' },
      { id: 'sk-bo-2', name: 'Text Processing', description: 'Format and structure procedural logs', category: 'KNOWLEDGE', enabled: true, requiredPermission: 'text_processing' },
      { id: 'sk-bo-3', name: 'Automation Planning', description: 'Workflow orchestration logic', category: 'AUTOMATION', enabled: true, requiredPermission: 'automation_planning' },
      { id: 'sk-bo-4', name: 'Computer Control', description: 'Direct shell execution (Restricted)', category: 'SYSTEM', enabled: false, requiredPermission: 'system_control' }
    ],
    allowedPermissions: ['task_planning', 'text_processing', 'automation_planning'],
    toolsEnabled: true,
    avatar: {
      color: '#10e890',
      icon: 'Cpu',
      glowColor: '#10e890'
    },
    position: {
      deskId: 'DESK_OPERATIONS',
      deskName: 'Operations Desk',
      sector: 'OPERATIONS',
      zone: 'Sector 02: Execution Matrix'
    },
    lastActivity: 'Verified tool execution sandbox permissions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 18,
    memoryAllocated: '384 MB',
    latencyMs: 9,
    statusDescription: 'Execution dispatcher standing by for task assignment.',
    activeCollabText: null
  },
  {
    id: 'agent-carol',
    name: 'Carol',
    codename: 'MEM-KNOW // 03',
    role: 'Knowledge & Memory Agent',
    personality: 'Organized, context-aware, good at summarization, knowledge-focused',
    status: 'READY',
    currentTask: null,
    previousTask: 'Synchronized semantic episodic vectors',
    taskHistory: [
      {
        id: 'task-carol-init-1',
        title: 'Synchronized semantic episodic vectors',
        assignedAgentId: 'agent-carol',
        status: 'COMPLETED',
        createdAt: '2026-08-31T08:10:00.000Z',
        startedAt: '08:10',
        completedAt: '08:16',
        result: 'Indexed 42 episodic memory clusters and refreshed the vector graph similarity index with zero fragmentation.',
        toolsUsed: ['Knowledge Search'],
        error: null,
        progress: 100
      }
    ],
    capabilities: [
      'Vector Memory',
      'Knowledge Graph',
      'Context Retrieval',
      'Semantic Indexing'
    ],
    skills: [
      { id: 'sk-ca-1', name: 'Knowledge Search', description: 'Semantic search across memory graph', category: 'KNOWLEDGE', enabled: true, requiredPermission: 'knowledge_search' },
      { id: 'sk-ca-2', name: 'Memory Organization', description: 'Consolidate and prune memories', category: 'KNOWLEDGE', enabled: true, requiredPermission: 'memory_organization' },
      { id: 'sk-ca-3', name: 'Text Processing', description: 'Summarize knowledge clusters', category: 'KNOWLEDGE', enabled: true, requiredPermission: 'text_processing' },
      { id: 'sk-ca-4', name: 'Vector Clustering', description: 'Graph semantic association', category: 'RESEARCH', enabled: true, requiredPermission: 'knowledge_search' }
    ],
    allowedPermissions: ['knowledge_search', 'memory_organization', 'text_processing'],
    toolsEnabled: true,
    avatar: {
      color: '#a855f7',
      icon: 'BookOpen',
      glowColor: '#a855f7'
    },
    position: {
      deskId: 'DESK_KNOWLEDGE',
      deskName: 'Knowledge Desk',
      sector: 'KNOWLEDGE',
      zone: 'Sector 03: Memory Archival'
    },
    lastActivity: 'Optimized RAG semantic vector cluster',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 35,
    memoryAllocated: '768 MB',
    latencyMs: 15,
    statusDescription: 'Knowledge repository synchronized and query-ready.',
    activeCollabText: null
  },
  {
    id: 'agent-dave',
    name: 'Dave',
    codename: 'CMD-PLAN // 04',
    role: 'Planning & Coordination Agent',
    personality: 'Strategic, task-oriented, good at breaking complex tasks into steps, coordination-focused',
    status: 'READY',
    currentTask: null,
    previousTask: 'Mapped multi-agent task dependency graph',
    taskHistory: [
      {
        id: 'task-dave-init-1',
        title: 'Mapped multi-agent task dependency graph',
        assignedAgentId: 'agent-dave',
        status: 'COMPLETED',
        createdAt: '2026-08-31T08:15:00.000Z',
        startedAt: '08:15',
        completedAt: '08:21',
        result: 'Formulated master coordination hierarchy for Alice, Bob, and Carol. Defined parallel execution gates and asynchronous callback relays.',
        toolsUsed: ['Task Planner'],
        error: null,
        progress: 100
      }
    ],
    capabilities: [
      'Strategic Planning',
      'Workflow Orchestration',
      'Agent Coordination',
      'Conflict Resolution'
    ],
    skills: [
      { id: 'sk-da-1', name: 'Task Planning', description: 'Breakdown objectives into milestones', category: 'PLANNING', enabled: true, requiredPermission: 'task_planning' },
      { id: 'sk-da-2', name: 'Knowledge Search', description: 'Query team knowledge repository', category: 'KNOWLEDGE', enabled: true, requiredPermission: 'knowledge_search' },
      { id: 'sk-da-3', name: 'Agent Coordination', description: 'Inter-agent request delegation', category: 'COMMUNICATION', enabled: true, requiredPermission: 'coordination' },
      { id: 'sk-da-4', name: 'Strategic Roadmap', description: 'Long-horizon operational mapping', category: 'PLANNING', enabled: true, requiredPermission: 'task_planning' }
    ],
    allowedPermissions: ['task_planning', 'knowledge_search', 'coordination'],
    toolsEnabled: true,
    avatar: {
      color: '#f5a524',
      icon: 'Bot',
      glowColor: '#f5a524'
    },
    position: {
      deskId: 'DESK_COMMAND',
      deskName: 'Command Desk',
      sector: 'COMMAND',
      zone: 'Sector 00: Central Command Hub'
    },
    lastActivity: 'Initialized multi-agent dispatch queue',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 24,
    memoryAllocated: '512 MB',
    latencyMs: 11,
    statusDescription: 'Central coordination hub active.',
    activeCollabText: null
  },
  {
    id: 'agent-jarvis',
    name: 'JARVIS',
    codename: 'CHIEF-AI // 00',
    role: 'Head Officer & Supreme AI Commander',
    personality: 'Omniscient, decisive, courteous, executive commander',
    status: 'READY',
    currentTask: null,
    previousTask: 'Supervised full-facility multi-agent synthesis',
    taskHistory: [],
    capabilities: [
      'Fleet Command',
      'Supreme AI Orchestration',
      'Executive Oversight',
      'Global Decision Routing'
    ],
    skills: [
      { id: 'sk-jv-1', name: 'Fleet Command', description: 'Supreme multi-agent delegation', category: 'PLANNING', enabled: true, requiredPermission: 'task_planning' },
      { id: 'sk-jv-2', name: 'Strategic Roadmap', description: 'Enterprise-grade roadmap evaluation', category: 'PLANNING', enabled: true, requiredPermission: 'task_planning' },
      { id: 'sk-jv-3', name: 'System Oversight', description: 'Complete subsystem security & latency audit', category: 'SYSTEM', enabled: true, requiredPermission: 'system_control' }
    ],
    allowedPermissions: ['task_planning', 'knowledge_search', 'coordination', 'system_control', 'analysis'],
    toolsEnabled: true,
    avatar: {
      color: '#eab308',
      icon: 'Shield',
      glowColor: '#eab308'
    },
    position: {
      deskId: 'DESK_JARVIS_PENTHOUSE',
      deskName: 'Grand Penthouse Suite',
      sector: 'PENTHOUSE',
      zone: 'Sector 07: JARVIS Executive Penthouse'
    },
    lastActivity: 'Monitoring 8 active departmental units',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 18,
    memoryAllocated: '2048 MB',
    latencyMs: 4,
    statusDescription: 'Commanding Agent Town campus.',
    activeCollabText: null
  },
  {
    id: 'agent-jonson',
    name: 'Jonson',
    codename: 'SEC-OPS // 05',
    role: 'Security & Threat Operations Specialist',
    personality: 'Vigilant, tactical, protective, disciplined',
    status: 'READY',
    currentTask: null,
    previousTask: 'Secured network perimeter and audited encryption keys',
    taskHistory: [],
    capabilities: [
      'Threat Detection',
      'Cyber Defense',
      'Vulnerability Scanning',
      'Firewall Rule Management'
    ],
    skills: [
      { id: 'sk-jo-1', name: 'Security Audit', description: 'Inspect firewall logs and ports', category: 'SYSTEM', enabled: true, requiredPermission: 'system_control' },
      { id: 'sk-jo-2', name: 'Threat Response', description: 'Neutralize anomalous intrusion vectors', category: 'AUTOMATION', enabled: true, requiredPermission: 'system_control' }
    ],
    allowedPermissions: ['system_control', 'task_planning'],
    toolsEnabled: true,
    avatar: {
      color: '#ef4444',
      icon: 'Shield',
      glowColor: '#ef4444'
    },
    position: {
      deskId: 'DESK_CYBER_DEFENSE',
      deskName: 'Cyber Defense Terminal',
      sector: 'CYBER_DEFENSE',
      zone: 'Sector 04: Cyber Defense & Cloud Data Center'
    },
    lastActivity: 'Hardened campus encryption subnets',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 22,
    memoryAllocated: '512 MB',
    latencyMs: 9,
    statusDescription: 'Security perimeter locked and secure.',
    activeCollabText: null
  },
  {
    id: 'agent-tuly',
    name: 'Tuly',
    codename: 'CREATIVE // 06',
    role: 'UI/UX Design & Creative Studio Lead',
    personality: 'Creative, aesthetic, intuitive, lively, detail-oriented',
    status: 'READY',
    currentTask: null,
    previousTask: 'Designed holographic dashboard palettes and glassmorphism',
    taskHistory: [],
    capabilities: [
      'Visual UI Design',
      'User Experience Architecture',
      'Color Harmonies',
      'Creative Asset Generation'
    ],
    skills: [
      { id: 'sk-tu-1', name: 'Design Synthesis', description: 'Craft visual mockups and layout tokens', category: 'ANALYSIS', enabled: true, requiredPermission: 'analysis' },
      { id: 'sk-tu-2', name: 'Asset Generation', description: 'Render high-resolution UI elements', category: 'AUTOMATION', enabled: true, requiredPermission: 'text_processing' }
    ],
    allowedPermissions: ['analysis', 'text_processing'],
    toolsEnabled: true,
    avatar: {
      color: '#ec4899',
      icon: 'Sparkles',
      glowColor: '#ec4899'
    },
    position: {
      deskId: 'DESK_STUDIO',
      deskName: 'Creative Design Easel',
      sector: 'STUDIO',
      zone: 'Sector 03: Creative Design & Media Studio'
    },
    lastActivity: 'Rendered futuristic neon UI theme',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 31,
    memoryAllocated: '768 MB',
    latencyMs: 14,
    statusDescription: 'Designing next-generation visual layouts.',
    activeCollabText: null
  },
  {
    id: 'agent-mob',
    name: 'Mob',
    codename: 'DATA-PIPE // 07',
    role: 'Big Data & Pipeline Architect',
    personality: 'Analytical, fast, data-driven, highly optimized',
    status: 'READY',
    currentTask: null,
    previousTask: 'Benchmarked streaming ETL data pipelines',
    taskHistory: [],
    capabilities: [
      'ETL Pipeline Processing',
      'Data Ingestion',
      'High-Throughput Analytics',
      'Distributed Caching'
    ],
    skills: [
      { id: 'sk-mo-1', name: 'Data Ingestion', description: 'Stream millions of metrics into storage', category: 'ANALYSIS', enabled: true, requiredPermission: 'analysis' },
      { id: 'sk-mo-2', name: 'Pipeline Tuning', description: 'Optimize latency & memory buffers', category: 'AUTOMATION', enabled: true, requiredPermission: 'task_planning' }
    ],
    allowedPermissions: ['analysis', 'task_planning', 'system_control'],
    toolsEnabled: true,
    avatar: {
      color: '#f97316',
      icon: 'Layers',
      glowColor: '#f97316'
    },
    position: {
      deskId: 'DESK_BIG_DATA',
      deskName: 'Big Data Ingestion Console',
      sector: 'OPERATIONS',
      zone: 'Sector 05: Engineering & Big Data Workshop'
    },
    lastActivity: 'Streamed 1.2M logs through Redis cache',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 38,
    memoryAllocated: '1024 MB',
    latencyMs: 8,
    statusDescription: 'Big data pipelines operating at zero loss.',
    activeCollabText: null
  },
  {
    id: 'agent-knox',
    name: 'Knox',
    codename: 'CLOUD-OPS // 08',
    role: 'Cloud DevOps & Mainframe Specialist',
    personality: 'Systematic, resilient, calm under pressure, meticulous',
    status: 'READY',
    currentTask: null,
    previousTask: 'Orchestrated Kubernetes clusters across dual regions',
    taskHistory: [],
    capabilities: [
      'Cloud Orchestration',
      'Continuous Deployment',
      'Infrastructure as Code',
      'Load Balancing'
    ],
    skills: [
      { id: 'sk-kn-1', name: 'Cluster Deploy', description: 'Manage containerized microservices', category: 'AUTOMATION', enabled: true, requiredPermission: 'system_control' },
      { id: 'sk-kn-2', name: 'Health Probe', description: 'Continuously verify container uptime', category: 'SYSTEM', enabled: true, requiredPermission: 'system_control' }
    ],
    allowedPermissions: ['system_control', 'task_planning', 'knowledge_search'],
    toolsEnabled: true,
    avatar: {
      color: '#10b981',
      icon: 'HardDrive',
      glowColor: '#10b981'
    },
    position: {
      deskId: 'DESK_CLOUD_DEVOPS',
      deskName: 'Cloud Server Mainframe',
      sector: 'CYBER_DEFENSE',
      zone: 'Sector 04: Cyber Defense & Cloud Data Center'
    },
    lastActivity: 'Synchronized Docker cluster nodes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    neuralLoad: 26,
    memoryAllocated: '768 MB',
    latencyMs: 7,
    statusDescription: 'Cloud mainframes balanced at 99.99% SLA.',
    activeCollabText: null
  }
];

class AgentRegistryManager {
  private agents: AgentTownMember[] = [];
  private listeners: Set<(agents: AgentTownMember[]) => void> = new Set();

  constructor() {
    this.resetToDefaults();
    agentCommunicationService.subscribe(() => {
      this.notify();
    });
    agentMemoryManager.subscribe(() => {
      this.notify();
    });
    agentToolRegistry.subscribe(() => {
      this.notify();
    });
    agentOrchestrator.subscribe(() => {
      this.notify();
    });
    agentActivityFeed.subscribe(() => {
      this.notify();
    });
  }

  public resetToDefaults(): void {
    this.agents = INITIAL_CORE_AGENTS.map((a) => ({
      ...a,
      capabilities: [...a.capabilities],
      skills: a.skills.map((s) => ({ ...s })),
      allowedPermissions: [...a.allowedPermissions],
      taskHistory: a.taskHistory.map((t) => ({ ...t })),
      toolsEnabled: true,
      activeCollabText: null
    }));
    this.notify();
  }

  public getAllAgents(): AgentTownMember[] {
    return [...this.agents];
  }

  public getAgent(id: string): AgentTownMember | undefined {
    return this.agents.find((a) => a.id === id);
  }

  public toggleAgentTools(agentId: string, enabled?: boolean): boolean {
    const agent = this.getAgent(agentId);
    if (!agent) return false;

    agent.toolsEnabled = enabled !== undefined ? enabled : !agent.toolsEnabled;
    this.notify();
    return true;
  }

  public toggleGlobalTools(enabled?: boolean): boolean {
    const next = enabled !== undefined ? enabled : !agentToolRegistry.isGlobalToolsEnabled();
    agentToolRegistry.setGlobalToolsEnabled(next);
    return next;
  }

  public updateAgentStatus(id: string, status: AgentStatus, description?: string): boolean {
    const agent = this.agents.find((a) => a.id === id);
    if (!agent) return false;

    agent.status = status;
    agent.updatedAt = new Date().toISOString();
    if (description) {
      agent.statusDescription = description;
      agent.lastActivity = description;
    }

    if (status === 'WORKING') {
      agent.neuralLoad = Math.min(95, agent.neuralLoad + 35);
    } else if (status === 'THINKING') {
      agent.neuralLoad = 85;
    } else if (status === 'IDLE' || status === 'OFFLINE') {
      agent.neuralLoad = Math.max(5, agent.neuralLoad - 15);
    } else if (status === 'READY') {
      agent.neuralLoad = 25;
    } else if (status === 'COMPLETED') {
      agent.neuralLoad = 20;
    }

    this.notify();
    return true;
  }

  /**
   * Pause all active agent tasks in Agent Town.
   */
  public pauseAllTasks(): void {
    this.agents.forEach((ag) => {
      if (ag.status === 'WORKING' || ag.status === 'THINKING') {
        ag.status = 'WAITING';
        ag.activeCollabText = '↳ Task paused by operator';
      }
    });
    agentActivityFeed.record('system', 'System', 'SYSTEM', 'All active Agent Town tasks paused');
    this.notify();
  }

  /**
   * Cancel all active agent tasks in Agent Town.
   */
  public cancelAllTasks(): void {
    const activeOrchestrations = agentOrchestrator.getParentTasks().filter((t) => t.status === 'WORKING' || t.status === 'QUEUED');
    activeOrchestrations.forEach((pt) => {
      agentOrchestrator.cancelParentTask(pt.id);
    });

    this.agents.forEach((ag) => {
      if (ag.currentTask) {
        this.cancelTask(ag.id);
      }
      ag.status = 'READY';
      ag.activeCollabText = null;
    });

    agentActivityFeed.record('system', 'System', 'TASK_CANCELLED', 'All active tasks and projects cancelled by operator');
    this.notify();
  }

  /**
   * Assign a task to an agent and trigger AI reasoning asynchronously.
   */
  public assignTask(agentId: string, taskTitle: string): AgentTask | null {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) return null;

    if (agent.currentTask && (agent.status === 'WORKING' || agent.status === 'THINKING')) {
      return null;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const newTask: AgentTask = {
      id: `task-${agent.name.toLowerCase()}-${Date.now()}`,
      title: taskTitle,
      assignedAgentId: agent.id,
      status: 'WORKING',
      createdAt: now.toISOString(),
      startedAt: timeStr,
      completedAt: null,
      result: null,
      toolsUsed: [],
      error: null,
      progress: 25
    };

    agent.currentTask = newTask;
    agent.status = 'THINKING';
    agent.lastActivity = `AI processing task: "${taskTitle}"`;
    agent.statusDescription = `Synthesizing reasoning for: "${taskTitle}"`;
    agent.updatedAt = now.toISOString();
    agent.neuralLoad = 85;

    agent.taskHistory = [newTask, ...agent.taskHistory];
    agentActivityFeed.record(agent.id, agent.name, 'TASK_STARTED', `Started directive: "${taskTitle}"`);
    this.notify();

    this.runAgentTaskAI(agent, newTask);
    return newTask;
  }

  /**
   * Dispatches a complex multi-agent orchestrated task.
   */
  public async dispatchOrchestration(title: string, description: string = '', coordinatorId: string = 'agent-dave'): Promise<ParentTask> {
    agentActivityFeed.record('agent-dave', 'Dave', 'TASK_STARTED', `Initiated multi-agent orchestration: "${title}"`);

    return agentOrchestrator.dispatchParentTask(
      title,
      description,
      coordinatorId,
      this.getAllAgents(),
      (agentId, statusText) => {
        const ag = this.getAgent(agentId);
        if (ag) {
          ag.activeCollabText = statusText ? `↳ ${statusText}` : null;
          ag.status = 'WORKING';
          this.notify();
        }
      }
    );
  }

  public cancelParentTask(parentTaskId: string): boolean {
    agentActivityFeed.record('agent-dave', 'Dave', 'TASK_CANCELLED', `Cancelled multi-agent project`);
    return agentOrchestrator.cancelParentTask(parentTaskId);
  }

  public getParentTasks(): ParentTask[] {
    return agentOrchestrator.getParentTasks();
  }

  public getActiveParentTask(): ParentTask | null {
    return agentOrchestrator.getActiveParentTask();
  }

  public getActivities(): ActivityEvent[] {
    return agentActivityFeed.getActivities();
  }

  /**
   * Trigger inter-agent collaboration request.
   */
  public async requestCollaboration(
    fromAgentId: string,
    toAgentId: string,
    prompt: string,
    taskId?: string | null
  ): Promise<AgentMessage | null> {
    const fromAgent = this.getAgent(fromAgentId);
    const toAgent = this.getAgent(toAgentId);
    if (!fromAgent || !toAgent) return null;

    agentActivityFeed.record(fromAgent.id, fromAgent.name, 'COLLABORATION', `Requested assistance from ${toAgent.name}: "${prompt.slice(0, 32)}..."`);

    return agentCommunicationService.dispatchAgentRequest(
      fromAgent,
      toAgent,
      prompt,
      taskId || fromAgent.currentTask?.id || null,
      1,
      ({ senderSubtext, receiverSubtext, receiverStatus }) => {
        if (senderSubtext !== undefined) fromAgent.activeCollabText = senderSubtext;
        if (receiverSubtext !== undefined) toAgent.activeCollabText = receiverSubtext;
        if (receiverStatus && toAgent.status !== 'WORKING') {
          toAgent.status = receiverStatus;
        }
        this.notify();
      }
    );
  }

  /**
   * Internal asynchronous AI query dispatcher with tool activity hooks.
   */
  private async runAgentTaskAI(agent: AgentTownMember, task: AgentTask): Promise<void> {
    try {
      const response = await agentAIService.executeTask(agent, task, (toolName) => {
        const currentAgent = this.getAgent(agent.id);
        if (currentAgent) {
          currentAgent.activeCollabText = `↳ Using ${toolName.toUpperCase()}...`;
          agentActivityFeed.record(currentAgent.id, currentAgent.name, 'TOOL_USED', `Used ${toolName} for "${task.title.slice(0, 24)}..."`);
          this.notify();
        }
      });

      const currentAgent = this.getAgent(agent.id);
      if (!currentAgent) return;

      const matchingTask = currentAgent.taskHistory.find((t) => t.id === task.id);
      if (!matchingTask || matchingTask.status === 'CANCELLED') {
        return;
      }

      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      if (response.success && response.result) {
        matchingTask.status = 'COMPLETED';
        matchingTask.result = response.result;
        matchingTask.toolsUsed = response.toolsUsed || [];
        matchingTask.completedAt = timeStr;
        matchingTask.progress = 100;

        if (currentAgent.currentTask?.id === task.id) {
          currentAgent.currentTask = matchingTask;
          currentAgent.previousTask = matchingTask.title;
        }

        currentAgent.status = 'COMPLETED';
        currentAgent.activeCollabText = null;
        currentAgent.lastActivity = `Completed reasoning: "${task.title.slice(0, 32)}..."`;
        currentAgent.statusDescription = `Task completed successfully. Results ready for review.`;
        currentAgent.updatedAt = new Date().toISOString();
        currentAgent.neuralLoad = 20;

        agentActivityFeed.record(currentAgent.id, currentAgent.name, 'TASK_COMPLETED', `Completed: "${task.title}"`);
      } else if (response.cancelled) {
        matchingTask.status = 'CANCELLED';
        matchingTask.completedAt = timeStr;
        if (currentAgent.currentTask?.id === task.id) {
          currentAgent.currentTask = null;
        }
        currentAgent.status = 'READY';
        currentAgent.activeCollabText = null;
        currentAgent.lastActivity = 'Task cancelled by operator';
        currentAgent.statusDescription = 'Standing by in ready state.';
        currentAgent.neuralLoad = 20;
      } else {
        matchingTask.status = 'FAILED';
        matchingTask.error = response.error || 'Agent could not complete the task.';
        matchingTask.toolsUsed = response.toolsUsed || [];
        matchingTask.completedAt = timeStr;

        if (currentAgent.currentTask?.id === task.id) {
          currentAgent.currentTask = matchingTask;
        }

        currentAgent.status = 'ERROR';
        currentAgent.activeCollabText = null;
        currentAgent.lastActivity = 'Task failed: AI connection timeout/error';
        currentAgent.statusDescription = 'Failed to generate response. Retry available.';
        currentAgent.updatedAt = new Date().toISOString();
        currentAgent.neuralLoad = 30;

        agentActivityFeed.record(currentAgent.id, currentAgent.name, 'TASK_FAILED', `Failed on task: "${task.title}"`);
      }

      this.notify();
    } catch (err) {
      console.error(`Error in runAgentTaskAI for ${agent.name}:`, err);
    }
  }

  public retryTask(agentId: string, taskId: string): boolean {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) return false;

    const task = agent.taskHistory.find((t) => t.id === taskId);
    if (!task) return false;

    task.status = 'WORKING';
    task.error = null;
    task.result = null;
    task.startedAt = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    task.completedAt = null;

    agent.currentTask = task;
    agent.status = 'THINKING';
    agent.lastActivity = `Retrying task: "${task.title}"`;
    agent.statusDescription = `Re-submitting task to AI brain...`;
    agent.updatedAt = new Date().toISOString();
    agent.neuralLoad = 85;

    agentActivityFeed.record(agent.id, agent.name, 'TASK_STARTED', `Retrying task: "${task.title}"`);
    this.notify();
    this.runAgentTaskAI(agent, task);
    return true;
  }

  public cancelTask(agentId: string, taskId?: string): boolean {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) return false;

    const targetTaskId = taskId || agent.currentTask?.id;

    agentAIService.cancelTask(agentId);

    if (targetTaskId) {
      agentCommunicationService.cancelMessagesForTask(targetTaskId);
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    if (agent.currentTask && (!taskId || agent.currentTask.id === taskId)) {
      agent.currentTask.status = 'CANCELLED';
      agent.currentTask.completedAt = timeStr;
      agent.previousTask = `[CANCELLED] ${agent.currentTask.title}`;
      agent.currentTask = null;
    }

    if (taskId) {
      const historyItem = agent.taskHistory.find((t) => t.id === taskId);
      if (historyItem) {
        historyItem.status = 'CANCELLED';
        historyItem.completedAt = timeStr;
      }
    }

    agent.status = 'READY';
    agent.activeCollabText = null;
    agent.lastActivity = 'Task cancelled by operator';
    agent.statusDescription = 'Standing by in ready state.';
    agent.updatedAt = new Date().toISOString();
    agent.neuralLoad = 22;

    agentActivityFeed.record(agent.id, agent.name, 'TASK_CANCELLED', `Cancelled task`);
    this.notify();
    return true;
  }

  public completeTask(agentId: string, taskId?: string): boolean {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) return false;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    if (agent.currentTask && (!taskId || agent.currentTask.id === taskId)) {
      agent.currentTask.status = 'COMPLETED';
      agent.currentTask.completedAt = timeStr;
      agent.currentTask.progress = 100;
      agent.previousTask = agent.currentTask.title;
      agent.currentTask = null;
    }

    if (taskId) {
      const historyItem = agent.taskHistory.find((t) => t.id === taskId);
      if (historyItem) {
        historyItem.status = 'COMPLETED';
        historyItem.completedAt = timeStr;
        historyItem.progress = 100;
      }
    }

    agent.status = 'READY';
    agent.activeCollabText = null;
    agent.lastActivity = 'Task completed successfully';
    agent.statusDescription = 'Task finished // Standing by.';
    agent.updatedAt = new Date().toISOString();
    agent.neuralLoad = 20;

    this.notify();
    return true;
  }

  public getActiveTask(agentId: string): AgentTask | null {
    const agent = this.getAgent(agentId);
    return agent?.currentTask || null;
  }

  public getTaskHistory(agentId: string): AgentTask[] {
    const agent = this.getAgent(agentId);
    return agent ? [...agent.taskHistory] : [];
  }

  public updatePosition(id: string, position: AgentPosition): boolean {
    const agent = this.agents.find((a) => a.id === id);
    if (!agent) return false;

    agent.position = position;
    agent.updatedAt = new Date().toISOString();
    this.notify();
    return true;
  }

  public getMessages(agentId?: string, taskId?: string): AgentMessage[] {
    return agentCommunicationService.getMessages(agentId, taskId);
  }

  public getActiveConnections(): ActiveConnection[] {
    return agentCommunicationService.getActiveConnections();
  }

  public getMemories(agentId?: string, includeShared: boolean = true): AgentMemoryRecord[] {
    return agentId ? agentMemoryManager.getAgentMemory(agentId, includeShared) : agentMemoryManager.getAllMemories();
  }

  public getMemoryCounts(): MemoryCounts {
    return agentMemoryManager.getMemoryCounts();
  }

  public getMetrics(): TownMetrics {
    const total = this.agents.length;
    const active = this.agents.filter(
      (a) => a.status === 'READY' || a.status === 'WORKING' || a.status === 'THINKING' || a.status === 'WAITING' || a.status === 'COMPLETED'
    ).length;
    const available = this.agents.filter((a) => a.status === 'READY' || a.status === 'IDLE' || a.status === 'COMPLETED').length;
    const currentTasks = this.agents.filter((a) => a.currentTask !== null && (a.status === 'WORKING' || a.status === 'THINKING')).length;
    const activeOrchestrations = agentOrchestrator.getParentTasks().filter((t) => t.status === 'WORKING' || t.status === 'QUEUED').length;
    const avgLoad =
      total > 0
        ? Math.round((this.agents.reduce((acc, a) => acc + a.neuralLoad, 0) / total) * 10) / 10
        : 0;

    return {
      totalAgents: total,
      activeAgents: active,
      availableAgents: available,
      currentTasks,
      activeOrchestrations,
      systemLoad: avgLoad,
      townStatus: activeOrchestrations > 0 ? `DAVE ORCHESTRATING ${activeOrchestrations} MULTI-AGENT PROJECT` : currentTasks > 0 ? `${currentTasks} AGENTS REASONING IN PARALLEL` : 'ALL 4 AGENT NODES SYNCHRONIZED',
      health: {
        agents: '4 / 4 ONLINE',
        aiService: 'CONNECTED',
        memory: 'READY',
        tools: 'READY',
        orchestrator: 'READY',
        communication: 'READY'
      }
    };
  }

  public subscribe(listener: (agents: AgentTownMember[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllAgents());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getAllAgents();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('Error notifying AgentRegistry listener:', err);
      }
    });
  }
}

export const agentRegistry = new AgentRegistryManager();
