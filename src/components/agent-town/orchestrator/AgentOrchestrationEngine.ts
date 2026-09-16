/**
 * JARVIS Agent Town — Agent Orchestration Engine
 * Step 9: Capability-Based Routing, DAG Stage Resolution & Loop-Protected Handoffs
 */

import { SubTask, AgentTownMember } from '../types';
import {
  AgentCapability,
  AgentCapabilityProfile,
  AgentWorkloadState,
  DAGStage,
  HandoffRequest
} from './types';

export const MAX_HANDOFFS_PER_TASK = 3;

export class AgentOrchestrationEngine {
  public static readonly CAPABILITY_PROFILES: Record<string, AgentCapabilityProfile> = {
    'agent-alice': {
      agentId: 'agent-alice',
      name: 'Alice',
      role: 'Research & Analysis',
      primaryCapabilities: ['RESEARCH', 'DATA_ANALYSIS', 'WEB_SEARCH', 'COMPARISON', 'SUMMARIZATION'],
      maxConcurrentTasks: 3
    },
    'agent-bob': {
      agentId: 'agent-bob',
      name: 'Bob',
      role: 'Operations & Execution',
      primaryCapabilities: ['AUTOMATION', 'TECHNICAL_OPERATIONS', 'SYSTEM_WORKFLOWS', 'TOOL_EXECUTION'],
      maxConcurrentTasks: 3
    },
    'agent-carol': {
      agentId: 'agent-carol',
      name: 'Carol',
      role: 'Knowledge & Memory',
      primaryCapabilities: ['MEMORY_RETRIEVAL', 'KNOWLEDGE_SYNTHESIS', 'INFORMATION_STORAGE', 'CONTEXTUAL_LOOKUP'],
      maxConcurrentTasks: 3
    },
    'agent-dave': {
      agentId: 'agent-dave',
      name: 'Dave',
      role: 'Strategic Command',
      primaryCapabilities: ['COORDINATION', 'PLANNING', 'TASK_DECOMPOSITION', 'WORKFLOW_SUPERVISION'],
      maxConcurrentTasks: 3
    }
  };

  /**
   * Evaluates capability requirements and selects the best available agent
   */
  public static findBestAgentForCapability(
    requiredCapability: AgentCapability,
    workloadMap: Map<string, AgentWorkloadState>
  ): string {
    const candidates = Object.values(this.CAPABILITY_PROFILES).filter((profile) =>
      profile.primaryCapabilities.includes(requiredCapability)
    );

    if (candidates.length === 0) return 'agent-dave';

    // Sort by lowest active task count
    candidates.sort((a, b) => {
      const loadA = workloadMap.get(a.agentId)?.activeTaskCount ?? 0;
      const loadB = workloadMap.get(b.agentId)?.activeTaskCount ?? 0;
      return loadA - loadB;
    });

    return candidates[0].agentId;
  }

  /**
   * Computes topological DAG execution stages from subtask dependency lists
   */
  public static resolveDAGStages(subtasks: SubTask[]): DAGStage[] {
    const stages: DAGStage[] = [];
    const completedSet = new Set<string>();
    const remaining = [...subtasks];
    let stageIndex = 0;

    while (remaining.length > 0) {
      // Find all subtasks whose dependencies have already been satisfied
      const readyForStage = remaining.filter((st) =>
        st.dependsOnTaskIds.every((depId) => completedSet.has(depId))
      );

      if (readyForStage.length === 0) {
        // Fallback for circular dependency or orphan task: take first remaining
        const fallback = remaining.shift()!;
        readyForStage.push(fallback);
      }

      const stageSubtaskIds = readyForStage.map((st) => st.id);
      stages.push({
        stageIndex,
        stageName: `Stage ${stageIndex + 1}: ${readyForStage.map((s) => s.assignedAgentId.replace('agent-', '').toUpperCase()).join(' & ')}`,
        subtaskIds: stageSubtaskIds,
        isParallel: readyForStage.length > 1
      });

      for (const st of readyForStage) {
        completedSet.add(st.id);
        const idx = remaining.findIndex((r) => r.id === st.id);
        if (idx !== -1) remaining.splice(idx, 1);
      }

      stageIndex++;
    }

    return stages;
  }

  /**
   * Validates and creates a loop-protected handoff request
   */
  public static createLoopProtectedHandoff(
    fromAgentId: string,
    toAgentId: string,
    subtaskId: string,
    reason: string,
    existingHandoffCount: number = 0,
    visitedAgents: string[] = []
  ): { valid: boolean; handoff?: HandoffRequest; reason?: string } {
    if (fromAgentId === toAgentId) {
      return { valid: false, reason: 'Self-handoff is not allowed' };
    }

    if (existingHandoffCount >= MAX_HANDOFFS_PER_TASK) {
      return { valid: false, reason: `Max handoff depth limit (${MAX_HANDOFFS_PER_TASK}) reached.` };
    }

    if (visitedAgents.includes(toAgentId)) {
      return { valid: false, reason: `Ping-pong handoff loop detected: ${toAgentId} already processed this subtask.` };
    }

    const updatedVisited = [...visitedAgents, fromAgentId];
    const handoff: HandoffRequest = {
      id: `handoff_${Date.now()}_${Math.random()}`,
      fromAgentId,
      toAgentId,
      subtaskId,
      reason,
      timestamp: Date.now(),
      handoffCount: existingHandoffCount + 1,
      visitedAgents: updatedVisited,
      status: 'PENDING'
    };

    return { valid: true, handoff };
  }

  /**
   * Computes live workload scores for all agents
   */
  public static computeWorkloadMap(
    agents: AgentTownMember[],
    activeSubtasks: SubTask[]
  ): Map<string, AgentWorkloadState> {
    const workloadMap = new Map<string, AgentWorkloadState>();

    for (const agent of agents) {
      const activeCount = activeSubtasks.filter(
        (st) => st.assignedAgentId === agent.id && (st.status === 'WORKING' || st.status === 'QUEUED')
      ).length;

      const profile = this.CAPABILITY_PROFILES[agent.id];
      const maxTasks = profile ? profile.maxConcurrentTasks : 3;

      workloadMap.set(agent.id, {
        agentId: agent.id,
        activeTaskCount: activeCount,
        isAvailable: activeCount < maxTasks && agent.status !== 'OFFLINE' && agent.status !== 'ERROR',
        currentWorkloadScore: Math.min(1.0, activeCount / maxTasks)
      });
    }

    return workloadMap;
  }
}
