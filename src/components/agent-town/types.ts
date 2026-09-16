export type AgentStatus = 
  | 'IDLE' 
  | 'READY' 
  | 'THINKING' 
  | 'WORKING' 
  | 'WAITING' 
  | 'COMPLETED' 
  | 'ERROR' 
  | 'OFFLINE';

export type TaskStatus = 
  | 'QUEUED' 
  | 'WORKING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED';

export type OrchestrationStatus = 
  | 'PENDING' 
  | 'QUEUED' 
  | 'WORKING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED';

export type MessageType = 
  | 'REQUEST' 
  | 'RESPONSE' 
  | 'INFORMATION' 
  | 'STATUS' 
  | 'ERROR';

export type MessageStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED';

export type MemoryType = 
  | 'SHORT_TERM' 
  | 'TASK_MEMORY' 
  | 'AGENT_MEMORY' 
  | 'SHARED_MEMORY';

export type MemoryImportance = 
  | 'LOW' 
  | 'MEDIUM' 
  | 'HIGH' 
  | 'CRITICAL';

export type SkillCategory = 
  | 'RESEARCH' 
  | 'ANALYSIS' 
  | 'KNOWLEDGE' 
  | 'PLANNING' 
  | 'AUTOMATION' 
  | 'SYSTEM' 
  | 'COMMUNICATION';

export type ToolStatus = 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'DENIED' 
  | 'TIMEOUT';

export type DeskId = 
  | 'DESK_JARVIS_PENTHOUSE'
  | 'DESK_RESEARCH' 
  | 'DESK_OPERATIONS' 
  | 'DESK_KNOWLEDGE' 
  | 'DESK_COMMAND'
  | 'DESK_STUDIO'
  | 'DESK_CYBER_DEFENSE'
  | 'DESK_BIG_DATA'
  | 'DESK_CLOUD_DEVOPS';

export type TownSector = 
  | 'ALL' 
  | 'PENTHOUSE' 
  | 'COMMAND' 
  | 'RESEARCH' 
  | 'OPERATIONS' 
  | 'KNOWLEDGE' 
  | 'STUDIO' 
  | 'CYBER_DEFENSE' 
  | 'PLAZA';

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  enabled: boolean;
  requiredPermission: string;
}

export interface ToolResult {
  toolCallId: string;
  toolId: string;
  status: ToolStatus;
  result: any;
  error?: string | null;
  timestamp: string;
}

export interface ToolAuditEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  toolId: string;
  toolName: string;
  taskId: string | null;
  status: ToolStatus;
  inputSummary?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'TASK_STARTED' | 'TASK_COMPLETED' | 'TASK_FAILED' | 'TASK_CANCELLED' | 'TOOL_USED' | 'COLLABORATION' | 'MEMORY_STORED' | 'SYSTEM';
  description: string;
  icon?: string;
}

export interface SystemHealthStatus {
  agents: string;
  aiService: string;
  memory: string;
  tools: string;
  orchestrator: string;
  communication: string;
}

export interface SubTask {
  id: string;
  parentTaskId: string;
  assignedAgentId: string;
  title: string;
  description: string;
  status: OrchestrationStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dependsOnTaskIds: string[];
  retryCount: number;
  reassignmentCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  result: string | null;
  toolsUsed?: string[];
  error: string | null;
}

export interface ParentTask {
  id: string;
  title: string;
  description: string;
  status: OrchestrationStatus;
  coordinatorId: string; // 'agent-dave' default
  subtasks: SubTask[];
  progress: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  finalResult: string | null;
  error: string | null;
}

export interface AgentPosition {
  deskId: DeskId;
  deskName: string;
  sector: string;
  zone: string;
  coordinates?: { x: number; y: number };
}

export interface AgentAvatar {
  color: string;
  icon: string;
  glowColor: string;
}

export interface AgentTask {
  id: string;
  title: string;
  assignedAgentId: string;
  status: TaskStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  result?: string | null;
  toolsUsed?: string[];
  error: string | null;
  progress: number;
}

export interface AgentTownMember {
  id: string;
  name: string;
  codename: string;
  role: string;
  personality: string;
  status: AgentStatus;
  currentTask: AgentTask | null;
  previousTask: string | null;
  taskHistory: AgentTask[];
  capabilities: string[];
  skills: AgentSkill[];
  allowedPermissions: string[];
  toolsEnabled: boolean;
  avatar: AgentAvatar;
  position: AgentPosition;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
  neuralLoad: number;
  memoryAllocated: string;
  latencyMs: number;
  statusDescription: string;
  activeCollabText?: string | null;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  responseContent?: string | null;
  type: MessageType;
  status: MessageStatus;
  timestamp: string;
  relatedTaskId: string | null;
  hopDepth: number;
}

export interface ActiveConnection {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  timestamp: number;
}

export interface AgentMemoryRecord {
  id: string;
  agentId: string; // 'agent-alice', 'agent-bob', 'agent-carol', 'agent-dave', or 'shared'
  type: MemoryType;
  content: string;
  source: string;
  relatedTaskId: string | null;
  importance: MemoryImportance;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MemoryCounts {
  alice: number;
  bob: number;
  carol: number;
  dave: number;
  shared: number;
  total: number;
}

export interface TownMetrics {
  totalAgents: number;
  activeAgents: number;
  availableAgents: number;
  currentTasks: number;
  activeOrchestrations?: number;
  systemLoad: number;
  townStatus: string;
  health?: SystemHealthStatus;
}

export interface TownAgent {
  id: string;
  name: string;
  codename: string;
  role: string;
  sector: string;
  status: AgentStatus | string;
  avatarColor: string;
  currentTask: string;
  lastActivity: string;
  capabilities: string[];
  neuralLoad: number;
  memoryAllocated: string;
  latencyMs: number;
  statusDescription: string;
}

export type AtmosphereMode = 'DAY' | 'DUSK' | 'NIGHT' | 'MATRIX';
export type SimulationSpeed = 1 | 2 | 4;
export type TownViewTab = 'agents' | 'visual_hub' | 'rooms' | 'news' | 'social';

