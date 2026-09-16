/**
 * JARVIS Agent Town — Agent Orchestrator Facade
 * Step 9: Multi-Agent DAG Workflow Coordinator, Capability-Based Routing & Loop-Protected Handoffs
 */

import { ParentTask, SubTask, AgentTownMember, OrchestrationStatus } from './types';
import { agentAIService } from './agentAIService';
import { agentCommunicationService } from './agentCommunicationService';
import { agentMemoryManager } from './agentMemoryManager';
import { AgentOrchestrationEngine, MAX_HANDOFFS_PER_TASK } from './orchestrator/AgentOrchestrationEngine';
import { HandoffRequest } from './orchestrator/types';

export const MAX_SUBTASKS_PER_PARENT = 6;
export const MAX_TASK_DEPTH = 3;
export const MAX_RETRIES_PER_TASK = 2;
export const MAX_CONCURRENT_AGENTS = 4;

class AgentOrchestrator {
  private parentTasks: Map<string, ParentTask> = new Map();
  private inFlightSubtasks: Map<string, AbortController> = new Map();
  private handoffs: Map<string, HandoffRequest> = new Map();
  private listeners: Set<() => void> = new Set();

  public getParentTasks(): ParentTask[] {
    return Array.from(this.parentTasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getActiveParentTask(): ParentTask | null {
    return (
      Array.from(this.parentTasks.values()).find(
        (t) => t.status === 'WORKING' || t.status === 'QUEUED' || t.status === 'PENDING'
      ) || null
    );
  }

  public getParentTask(id: string): ParentTask | undefined {
    return this.parentTasks.get(id);
  }

  /**
   * Evaluates task complexity.
   * Simple arithmetic or trivial queries bypass multi-agent decomposition.
   */
  public isComplexTask(title: string): boolean {
    const t = title.toLowerCase().trim();
    if (t.length < 15 && /^[0-9+\-*/().^%\s]+$/.test(t)) return false;
    if (t.startsWith('calculate') || t.startsWith('compute') || t.startsWith('what is') || t.startsWith('word count')) {
      if (!t.includes('and') && !t.includes('plan') && !t.includes('analyze') && !t.includes('create') && !t.includes('research')) {
        return false;
      }
    }
    return true;
  }

  /**
   * Dispatches a parent task, decomposing into subtasks if complex.
   */
  public async dispatchParentTask(
    title: string,
    description: string = '',
    coordinatorId: string = 'agent-dave',
    agents: AgentTownMember[],
    onAgentUpdate: (agentId: string, statusText?: string) => void
  ): Promise<ParentTask> {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const parentTaskId = `ptask-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const parentTask: ParentTask = {
      id: parentTaskId,
      title: title.trim(),
      description: description.trim(),
      status: 'WORKING',
      coordinatorId,
      subtasks: [],
      progress: 5,
      createdAt: new Date().toISOString(),
      startedAt: timeStr,
      completedAt: null,
      finalResult: null,
      error: null
    };

    this.parentTasks.set(parentTaskId, parentTask);
    this.notify();

    // 1. Simple Direct Route
    if (!this.isComplexTask(title)) {
      await this.executeSimpleParentTask(parentTask, agents, onAgentUpdate);
      return parentTask;
    }

    // 2. Multi-Agent DAG Workflow Route
    await this.executeOrchestratedWorkflow(parentTask, agents, onAgentUpdate);
    return parentTask;
  }

  /**
   * Direct execution for simple queries without subtask decomposition.
   */
  private async executeSimpleParentTask(
    parentTask: ParentTask,
    agents: AgentTownMember[],
    onAgentUpdate: (agentId: string, statusText?: string) => void
  ): Promise<void> {
    const coordinator = agents.find((a) => a.id === parentTask.coordinatorId) || agents[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    onAgentUpdate(coordinator.id, `Direct execution: "${parentTask.title}"`);

    const simpleSubtask: SubTask = {
      id: `sub-${Date.now()}-1`,
      parentTaskId: parentTask.id,
      assignedAgentId: coordinator.id,
      title: parentTask.title,
      description: 'Direct task processing without multi-agent decomposition.',
      status: 'WORKING',
      priority: 'HIGH',
      dependsOnTaskIds: [],
      retryCount: 0,
      reassignmentCount: 0,
      createdAt: new Date().toISOString(),
      startedAt: timeStr,
      completedAt: null,
      result: null,
      error: null
    };

    parentTask.subtasks = [simpleSubtask];
    parentTask.progress = 40;
    this.notify();

    const response = await agentAIService.executeTask(
      coordinator,
      {
        id: simpleSubtask.id,
        title: simpleSubtask.title,
        assignedAgentId: coordinator.id,
        status: 'WORKING',
        createdAt: simpleSubtask.createdAt,
        startedAt: timeStr,
        completedAt: null,
        result: null,
        error: null,
        progress: 50
      },
      (toolName) => onAgentUpdate(coordinator.id, `Using ${toolName}...`)
    );

    if (parentTask.status === 'CANCELLED') return;

    const finishTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    if (response.success && response.result) {
      simpleSubtask.status = 'COMPLETED';
      simpleSubtask.result = response.result;
      simpleSubtask.completedAt = finishTime;

      parentTask.status = 'COMPLETED';
      parentTask.progress = 100;
      parentTask.completedAt = finishTime;
      parentTask.finalResult = response.result;
    } else {
      simpleSubtask.status = 'FAILED';
      simpleSubtask.error = response.error || 'Execution failed';
      simpleSubtask.completedAt = finishTime;

      parentTask.status = 'FAILED';
      parentTask.error = response.error || 'Execution failed';
      parentTask.completedAt = finishTime;
    }

    this.notify();
  }

  /**
   * Executes multi-agent DAG workflow across stages.
   */
  private async executeOrchestratedWorkflow(
    parentTask: ParentTask,
    agents: AgentTownMember[],
    onAgentUpdate: (agentId: string, statusText?: string) => void
  ): Promise<void> {
    const dave = agents.find((a) => a.id === 'agent-dave');
    const alice = agents.find((a) => a.id === 'agent-alice');
    const carol = agents.find((a) => a.id === 'agent-carol');
    const bob = agents.find((a) => a.id === 'agent-bob');

    // 1. Generate Subtasks with explicit DAG dependencies
    const subAliceId = `sub-${parentTask.id}-1`;
    const subCarolId = `sub-${parentTask.id}-2`;
    const subBobId = `sub-${parentTask.id}-3`;

    const subtasks: SubTask[] = [
      {
        id: subAliceId,
        parentTaskId: parentTask.id,
        assignedAgentId: 'agent-alice',
        title: `Research and analytical evaluation for: "${parentTask.title}"`,
        description: 'Conduct deep literature, data, and market analysis.',
        status: 'QUEUED',
        priority: 'HIGH',
        dependsOnTaskIds: [],
        retryCount: 0,
        reassignmentCount: 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        result: null,
        error: null
      },
      {
        id: subCarolId,
        parentTaskId: parentTask.id,
        assignedAgentId: 'agent-carol',
        title: `Contextual memory and knowledge synthesis for: "${parentTask.title}"`,
        description: 'Query knowledge vectors and consolidate historical memory.',
        status: 'QUEUED',
        priority: 'HIGH',
        dependsOnTaskIds: [],
        retryCount: 0,
        reassignmentCount: 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        result: null,
        error: null
      },
      {
        id: subBobId,
        parentTaskId: parentTask.id,
        assignedAgentId: 'agent-bob',
        title: `Actionable execution and procedural roadmap for: "${parentTask.title}"`,
        description: 'Formulate implementation stages, sandbox safety, and batch steps.',
        status: 'QUEUED',
        priority: 'MEDIUM',
        dependsOnTaskIds: [subAliceId], // Depends on Alice completing research
        retryCount: 0,
        reassignmentCount: 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        result: null,
        error: null
      }
    ];

    parentTask.subtasks = subtasks;
    parentTask.progress = 15;
    this.notify();

    // Resolve DAG Stages
    const stages = AgentOrchestrationEngine.resolveDAGStages(subtasks);

    // 2. Dave signals subtask dispatches via Agent Communication
    if (dave && alice) {
      agentCommunicationService.dispatchAgentRequest(
        dave,
        alice,
        `Research directive: "${parentTask.title}"`,
        parentTask.id,
        1
      );
    }
    if (dave && carol) {
      agentCommunicationService.dispatchAgentRequest(
        dave,
        carol,
        `Knowledge retrieval directive: "${parentTask.title}"`,
        parentTask.id,
        1
      );
    }

    // 3. Stage 1 Execution (Alice & Carol in Parallel)
    onAgentUpdate('agent-dave', `Coordinating ${stages[0].stageName}`);
    subtasks[0].status = 'WORKING';
    subtasks[0].startedAt = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    subtasks[1].status = 'WORKING';
    subtasks[1].startedAt = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    parentTask.progress = 25;
    this.notify();

    const [resAlice, resCarol] = await Promise.all([
      this.executeSubTaskWithRetry(subtasks[0], alice || agents[0], onAgentUpdate),
      this.executeSubTaskWithRetry(subtasks[1], carol || agents[0], onAgentUpdate)
    ]);

    if (parentTask.status === 'CANCELLED') return;

    parentTask.progress = 60;
    this.notify();

    // 4. Stage 2 Execution (Bob - Dependent on Alice)
    if (dave && bob) {
      agentCommunicationService.dispatchAgentRequest(
        dave,
        bob,
        `Execution planning directive based on research: "${parentTask.title}"`,
        parentTask.id,
        1
      );
    }

    onAgentUpdate('agent-dave', `Coordinating ${stages[1]?.stageName || 'Stage 2: BOB'}`);
    subtasks[2].status = 'WORKING';
    subtasks[2].startedAt = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    parentTask.progress = 75;
    this.notify();

    const resBob = await this.executeSubTaskWithRetry(subtasks[2], bob || agents[0], onAgentUpdate);

    if ((parentTask.status as OrchestrationStatus) === 'CANCELLED') return;

    parentTask.progress = 85;
    this.notify();

    // 5. Stage 3: Dave synthesizes all subtask findings into Unified Final Report
    onAgentUpdate('agent-dave', 'Synthesizing Multi-Agent Strategic Master Report');
    const synthesisPrompt = `[MULTI-AGENT COORDINATION MASTER SYNTHESIS]
Directive: "${parentTask.title}"

Subtask 1 [ALICE // RESEARCH]:
${resAlice.result || 'Analysis completed.'}

Subtask 2 [CAROL // KNOWLEDGE]:
${resCarol.result || 'Knowledge synchronized.'}

Subtask 3 [BOB // OPERATIONS]:
${resBob.result || 'Execution roadmap generated.'}

Please synthesize these 3 independent agent findings into a cohesive, high-level Strategic Master Report. Structure the output with:
1. Executive Summary
2. Key Research & Knowledge Insights
3. Operational Execution Roadmap
4. Strategic Coordination Assessment`;

    const finalSynthesis = await agentAIService.executeTask(
      dave || agents[0],
      {
        id: `synth-${parentTask.id}`,
        title: synthesisPrompt,
        assignedAgentId: dave ? dave.id : 'agent-dave',
        status: 'WORKING',
        createdAt: new Date().toISOString(),
        startedAt: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        completedAt: null,
        result: null,
        error: null,
        progress: 90
      },
      (toolName) => onAgentUpdate('agent-dave', `Synthesizing with ${toolName}...`)
    );

    if ((parentTask.status as OrchestrationStatus) === 'CANCELLED') return;

    const finishTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    if (finalSynthesis.success && finalSynthesis.result) {
      parentTask.status = 'COMPLETED';
      parentTask.progress = 100;
      parentTask.completedAt = finishTime;
      parentTask.finalResult = finalSynthesis.result;

      // Save high-level synthesized memory
      agentMemoryManager.addMemory({
        agentId: 'shared',
        type: 'SHARED_MEMORY',
        content: `Master Plan for "${parentTask.title}": ${finalSynthesis.result.slice(0, 200)}...`,
        source: 'Multi-Agent Orchestrator',
        relatedTaskId: parentTask.id,
        importance: 'CRITICAL'
      });
    } else {
      parentTask.status = 'COMPLETED';
      parentTask.progress = 100;
      parentTask.completedAt = finishTime;
      parentTask.finalResult = `[MULTI-AGENT REPORTS COLLECTED]\n\n• ALICE (Research):\n${resAlice.result}\n\n• CAROL (Knowledge):\n${resCarol.result}\n\n• BOB (Operations):\n${resBob.result}`;
    }

    onAgentUpdate('agent-dave', 'Multi-Agent Orchestration Completed');
    this.notify();
  }

  /**
   * Request an agent-to-agent task handoff with loop protection
   */
  public requestHandoff(
    fromAgentId: string,
    toAgentId: string,
    subtaskId: string,
    reason: string
  ): { success: boolean; message?: string } {
    const existing = Array.from(this.handoffs.values()).filter((h) => h.subtaskId === subtaskId);
    const count = existing.length;
    const visited = existing.map((h) => h.fromAgentId);

    const validation = AgentOrchestrationEngine.createLoopProtectedHandoff(
      fromAgentId,
      toAgentId,
      subtaskId,
      reason,
      count,
      visited
    );

    if (!validation.valid || !validation.handoff) {
      return { success: false, message: validation.reason };
    }

    this.handoffs.set(validation.handoff.id, validation.handoff);
    this.notify();
    return { success: true, message: `Handoff from ${fromAgentId} to ${toAgentId} approved.` };
  }

  /**
   * Executes a single subtask with retry limit enforcement (MAX_RETRIES = 2).
   */
  private async executeSubTaskWithRetry(
    subtask: SubTask,
    agent: AgentTownMember,
    onAgentUpdate: (agentId: string, statusText?: string) => void
  ): Promise<{ success: boolean; result?: string; error?: string }> {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    onAgentUpdate(agent.id, `Executing subtask: "${subtask.title}"`);

    let attempts = 0;
    while (attempts <= MAX_RETRIES_PER_TASK) {
      const response = await agentAIService.executeTask(
        agent,
        {
          id: subtask.id,
          title: subtask.title,
          assignedAgentId: agent.id,
          status: 'WORKING',
          createdAt: subtask.createdAt,
          startedAt: timeStr,
          completedAt: null,
          result: null,
          error: null,
          progress: 50
        },
        (toolName) => onAgentUpdate(agent.id, `Using ${toolName}...`)
      );

      const parent = this.parentTasks.get(subtask.parentTaskId);
      if (parent && parent.status === 'CANCELLED') {
        subtask.status = 'CANCELLED';
        return { success: false, error: 'Cancelled' };
      }

      if (response.success && response.result) {
        subtask.status = 'COMPLETED';
        subtask.result = response.result;
        subtask.toolsUsed = response.toolsUsed;
        subtask.completedAt = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        this.notify();
        return { success: true, result: response.result };
      }

      attempts++;
      subtask.retryCount = attempts;
      if (attempts <= MAX_RETRIES_PER_TASK) {
        onAgentUpdate(agent.id, `Retrying subtask (Attempt ${attempts + 1}/${MAX_RETRIES_PER_TASK + 1})...`);
      }
    }

    subtask.status = 'FAILED';
    subtask.error = 'Subtask failed after max retries.';
    subtask.completedAt = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    this.notify();
    return { success: false, error: subtask.error };
  }

  /**
   * Cancels a parent task and cascades cancellation to all child subtasks.
   */
  public cancelParentTask(parentTaskId: string): boolean {
    const parent = this.parentTasks.get(parentTaskId);
    if (!parent) return false;

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    parent.status = 'CANCELLED';
    parent.completedAt = timeStr;

    parent.subtasks.forEach((st) => {
      if (st.status === 'WORKING' || st.status === 'QUEUED' || st.status === 'PENDING') {
        st.status = 'CANCELLED';
        st.completedAt = timeStr;
      }
      agentAIService.cancelTask(st.assignedAgentId);
    });

    agentAIService.cancelTask(parent.coordinatorId);
    agentCommunicationService.cancelMessagesForTask(parentTaskId);

    this.notify();
    return true;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[AgentOrchestrator] Listener error:', err);
      }
    });
  }
}

export const agentOrchestrator = new AgentOrchestrator();
