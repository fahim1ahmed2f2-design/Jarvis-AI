import { AgentMemoryRecord, MemoryType, MemoryImportance, MemoryCounts } from './types';

const STORAGE_KEY = 'jarvis_agent_town_memories_v1';

export const MAX_TASK_MEMORIES = 30;
export const MAX_AGENT_MEMORIES = 50;
export const MAX_SHARED_MEMORIES = 100;

export const INITIAL_MEMORIES: AgentMemoryRecord[] = [
  // ── Alice (Research) ──
  {
    id: 'mem-alice-1',
    agentId: 'agent-alice',
    type: 'AGENT_MEMORY',
    content: 'Always prioritize empirical benchmark data, structured comparative matrices, and concise executive summaries for all analytical directives.',
    source: 'System Heuristic',
    relatedTaskId: null,
    importance: 'CRITICAL',
    timestamp: '08:00'
  },
  {
    id: 'mem-alice-2',
    agentId: 'agent-alice',
    type: 'TASK_MEMORY',
    content: 'Decentralized multi-agent communication networks demonstrate 3.4x higher resilience under asynchronous latency loads compared to centralized dispatchers.',
    source: 'Task Synthesis',
    relatedTaskId: 'task-alice-init-1',
    importance: 'HIGH',
    timestamp: '08:12'
  },

  // ── Bob (Operations) ──
  {
    id: 'mem-bob-1',
    agentId: 'agent-bob',
    type: 'AGENT_MEMORY',
    content: 'All automation workflows must verify process sandboxing permissions and validate authorization tokens before executing system operations.',
    source: 'Security Policy',
    relatedTaskId: null,
    importance: 'CRITICAL',
    timestamp: '08:05'
  },
  {
    id: 'mem-bob-2',
    agentId: 'agent-bob',
    type: 'TASK_MEMORY',
    content: 'Process termination hooks should dispatch SIGTERM with a 500ms grace window before fallback SIGKILL to preserve state integrity.',
    source: 'Audit Log',
    relatedTaskId: 'task-bob-init-1',
    importance: 'MEDIUM',
    timestamp: '08:09'
  },

  // ── Carol (Knowledge) ──
  {
    id: 'mem-carol-1',
    agentId: 'agent-carol',
    type: 'AGENT_MEMORY',
    content: 'Episodic memory records must be deduplicated, indexed with semantic vector keys, and structured hierarchically across operational sectors.',
    source: 'Knowledge Architecture',
    relatedTaskId: null,
    importance: 'CRITICAL',
    timestamp: '08:10'
  },
  {
    id: 'mem-carol-2',
    agentId: 'agent-carol',
    type: 'TASK_MEMORY',
    content: 'Knowledge repository synchronized across 42 memory clusters with zero fragmentation indexation.',
    source: 'Vector Indexer',
    relatedTaskId: 'task-carol-init-1',
    importance: 'HIGH',
    timestamp: '08:16'
  },

  // ── Dave (Planning) ──
  {
    id: 'mem-dave-1',
    agentId: 'agent-dave',
    type: 'AGENT_MEMORY',
    content: 'Always decompose complex operational goals into sequential phases: Research -> Architecture -> Execution -> Verification.',
    source: 'Master Directive',
    relatedTaskId: null,
    importance: 'CRITICAL',
    timestamp: '08:15'
  },
  {
    id: 'mem-dave-2',
    agentId: 'agent-dave',
    type: 'TASK_MEMORY',
    content: 'Formulated parallel coordination hierarchy for Alice, Bob, and Carol with asynchronous delegation gates.',
    source: 'Task Synthesis',
    relatedTaskId: 'task-dave-init-1',
    importance: 'HIGH',
    timestamp: '08:21'
  },

  // ── Shared Knowledge ──
  {
    id: 'mem-shared-1',
    agentId: 'shared',
    type: 'SHARED_MEMORY',
    content: 'JARVIS Mark-III Sovereign autonomous AI operations headquarters operating with Level-4 telemetry conduits.',
    source: 'Facility Core',
    relatedTaskId: null,
    importance: 'CRITICAL',
    timestamp: '07:30'
  },
  {
    id: 'mem-shared-2',
    agentId: 'shared',
    type: 'SHARED_MEMORY',
    content: 'Agent Town core matrix connects 4 specialized AI desks (Research, Operations, Knowledge, Command) with isolated reasoning sessions.',
    source: 'System Matrix',
    relatedTaskId: null,
    importance: 'HIGH',
    timestamp: '07:45'
  }
];

class AgentMemoryManager {
  private memories: AgentMemoryRecord[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.memories = parsed;
            return;
          }
        }
      }
    } catch (err) {
      console.warn('[AgentMemoryManager] Error reading localStorage:', err);
    }
    this.memories = [...INITIAL_MEMORIES];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
      }
    } catch (err) {
      console.warn('[AgentMemoryManager] Error writing localStorage:', err);
    }
  }

  public getAllMemories(): AgentMemoryRecord[] {
    return [...this.memories];
  }

  public getMemory(id: string): AgentMemoryRecord | undefined {
    return this.memories.find((m) => m.id === id);
  }

  /**
   * Access control: Retrieves private memories of an agent plus shared memories if allowed.
   */
  public getAgentMemory(agentId: string, includeShared: boolean = true): AgentMemoryRecord[] {
    return this.memories.filter((m) => {
      if (m.agentId === agentId) return true;
      if (includeShared && m.agentId === 'shared') return true;
      return false;
    });
  }

  public getSharedMemory(): AgentMemoryRecord[] {
    return this.memories.filter((m) => m.agentId === 'shared' || m.type === 'SHARED_MEMORY');
  }

  /**
   * Add a memory record with automatic eviction limit enforcement.
   */
  public addMemory(record: Omit<AgentMemoryRecord, 'id' | 'timestamp'>): AgentMemoryRecord {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newRecord: AgentMemoryRecord = {
      ...record,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr
    };

    // Enforce eviction limits based on memory type
    this.enforceLimits(newRecord.type);

    this.memories = [newRecord, ...this.memories];
    this.saveToStorage();
    this.notify();
    return newRecord;
  }

  /**
   * Eviction safeguard: Removes oldest LOW items first, preserving CRITICAL and HIGH.
   */
  private enforceLimits(type: MemoryType) {
    let limit = MAX_TASK_MEMORIES;
    if (type === 'AGENT_MEMORY') limit = MAX_AGENT_MEMORIES;
    if (type === 'SHARED_MEMORY') limit = MAX_SHARED_MEMORIES;

    const matching = this.memories.filter((m) => m.type === type);
    if (matching.length >= limit) {
      // Find oldest LOW item
      let evictIndex = this.memories.findIndex((m) => m.type === type && m.importance === 'LOW');
      if (evictIndex === -1) {
        // Fallback to oldest MEDIUM item
        evictIndex = this.memories.findIndex((m) => m.type === type && m.importance === 'MEDIUM');
      }
      if (evictIndex !== -1) {
        this.memories.splice(evictIndex, 1);
      }
    }
  }

  /**
   * Promote a task memory to permanent agent private memory.
   */
  public promoteToAgentMemory(memoryId: string): boolean {
    const mem = this.memories.find((m) => m.id === memoryId);
    if (!mem) return false;

    mem.type = 'AGENT_MEMORY';
    if (mem.importance === 'LOW') mem.importance = 'MEDIUM';
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Promote a memory to SHARED_MEMORY accessible by all agents.
   */
  public promoteToSharedMemory(memoryId: string): boolean {
    const mem = this.memories.find((m) => m.id === memoryId);
    if (!mem) return false;

    mem.type = 'SHARED_MEMORY';
    mem.agentId = 'shared';
    if (mem.importance === 'LOW') mem.importance = 'HIGH';
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Delete memory with confirmation guard for CRITICAL items.
   */
  public deleteMemory(id: string, force: boolean = false): { success: boolean; requiresConfirmation?: boolean } {
    const mem = this.memories.find((m) => m.id === id);
    if (!mem) return { success: false };

    if (mem.importance === 'CRITICAL' && !force) {
      return { success: false, requiresConfirmation: true };
    }

    this.memories = this.memories.filter((m) => m.id !== id);
    this.saveToStorage();
    this.notify();
    return { success: true };
  }

  public clearTaskMemory(taskId: string): void {
    this.memories = this.memories.filter((m) => !(m.relatedTaskId === taskId && m.type === 'SHORT_TERM'));
    this.saveToStorage();
    this.notify();
  }

  /**
   * Search memory across keywords, agent filters, type filters, and importance.
   */
  public searchMemory(
    query: string,
    filters?: {
      agentId?: string;
      type?: MemoryType | 'ALL';
      importance?: MemoryImportance | 'ALL';
    }
  ): AgentMemoryRecord[] {
    const q = query.trim().toLowerCase();

    return this.memories.filter((m) => {
      if (filters?.agentId && filters.agentId !== 'ALL') {
        if (filters.agentId === 'shared' && m.agentId !== 'shared') return false;
        if (filters.agentId !== 'shared' && m.agentId !== filters.agentId && m.agentId !== 'shared') return false;
      }

      if (filters?.type && filters.type !== 'ALL') {
        if (m.type !== filters.type) return false;
      }

      if (filters?.importance && filters.importance !== 'ALL') {
        if (m.importance !== filters.importance) return false;
      }

      if (!q) return true;

      return (
        m.content.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q)
      );
    });
  }

  /**
   * Retrieves concise relevant memories for AI context prompt injection.
   */
  public getRelevantMemoriesForTask(agentId: string, taskTitle: string, maxItems: number = 3): AgentMemoryRecord[] {
    const accessible = this.getAgentMemory(agentId, true);
    const keywords = taskTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

    const scored = accessible.map((m) => {
      let score = 0;
      if (m.importance === 'CRITICAL') score += 5;
      if (m.importance === 'HIGH') score += 3;
      if (m.type === 'SHARED_MEMORY') score += 2;

      const contentLower = m.content.toLowerCase();
      keywords.forEach((kw) => {
        if (contentLower.includes(kw)) score += 4;
      });

      return { mem: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxItems).map((s) => s.mem);
  }

  /**
   * Carol's Knowledge Consolidation Action:
   * Analyzes all task memories and promotes key conclusions to SHARED_MEMORY.
   */
  public consolidateKnowledge(): { consolidatedCount: number } {
    let count = 0;
    this.memories.forEach((m) => {
      if (m.type === 'TASK_MEMORY' && (m.importance === 'HIGH' || m.importance === 'CRITICAL')) {
        m.type = 'SHARED_MEMORY';
        m.agentId = 'shared';
        count++;
      }
    });

    if (count > 0) {
      this.saveToStorage();
      this.notify();
    }
    return { consolidatedCount: count };
  }

  public getMemoryCounts(): MemoryCounts {
    const alice = this.memories.filter((m) => m.agentId === 'agent-alice').length;
    const bob = this.memories.filter((m) => m.agentId === 'agent-bob').length;
    const carol = this.memories.filter((m) => m.agentId === 'agent-carol').length;
    const dave = this.memories.filter((m) => m.agentId === 'agent-dave').length;
    const shared = this.memories.filter((m) => m.agentId === 'shared' || m.type === 'SHARED_MEMORY').length;

    return {
      alice,
      bob,
      carol,
      dave,
      shared,
      total: this.memories.length
    };
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
        console.error('[AgentMemoryManager] Error notifying listener:', err);
      }
    });
  }
}

export const agentMemoryManager = new AgentMemoryManager();
