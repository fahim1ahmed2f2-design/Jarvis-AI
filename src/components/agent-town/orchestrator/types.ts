/**
 * JARVIS Agent Town — Orchestrator Types
 * Step 9: Smart Agent Orchestration Layer & Multi-Agent DAG Workflow
 */

export type AgentCapability =
  | 'RESEARCH'
  | 'DATA_ANALYSIS'
  | 'WEB_SEARCH'
  | 'COMPARISON'
  | 'SUMMARIZATION'
  | 'AUTOMATION'
  | 'TECHNICAL_OPERATIONS'
  | 'SYSTEM_WORKFLOWS'
  | 'TOOL_EXECUTION'
  | 'MEMORY_RETRIEVAL'
  | 'KNOWLEDGE_SYNTHESIS'
  | 'INFORMATION_STORAGE'
  | 'CONTEXTUAL_LOOKUP'
  | 'COORDINATION'
  | 'PLANNING'
  | 'TASK_DECOMPOSITION'
  | 'WORKFLOW_SUPERVISION';

export interface AgentCapabilityProfile {
  agentId: string;
  name: string;
  role: string;
  primaryCapabilities: AgentCapability[];
  maxConcurrentTasks: number;
}

export interface AgentWorkloadState {
  agentId: string;
  activeTaskCount: number;
  isAvailable: boolean;
  currentWorkloadScore: number; // 0.0 to 1.0
}

export interface DAGStage {
  stageIndex: number;
  stageName: string;
  subtaskIds: string[];
  isParallel: boolean;
}

export interface HandoffRequest {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  subtaskId: string;
  reason: string;
  timestamp: number;
  handoffCount: number;
  visitedAgents: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
}
