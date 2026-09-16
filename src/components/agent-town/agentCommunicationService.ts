import { AgentMessage, ActiveConnection, MessageType, MessageStatus, AgentTownMember } from './types';
import { agentAIService } from './agentAIService';

export const MAX_AGENT_HOPS = 3;

class AgentCommunicationService {
  private messages: AgentMessage[] = [];
  private activeConnections: ActiveConnection[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initInitialMessages();
  }

  private initInitialMessages() {
    this.messages = [
      {
        id: 'msg-init-1',
        fromAgentId: 'agent-alice',
        toAgentId: 'agent-dave',
        content: 'Requesting strategic coordination roadmap for cross-sector intelligence indexing.',
        responseContent: 'Roadmap formulated: Phase 1 (Knowledge ingestion), Phase 2 (Vector correlation), Phase 3 (Automated synthesis).',
        type: 'REQUEST',
        status: 'COMPLETED',
        timestamp: '08:14',
        relatedTaskId: 'task-alice-init-1',
        hopDepth: 1
      },
      {
        id: 'msg-init-2',
        fromAgentId: 'agent-bob',
        toAgentId: 'agent-carol',
        content: 'Querying episodic vector memory schemas for sandbox tool permission parameters.',
        responseContent: 'Memory schema validated: All sandbox authorization keys match Level-4 execution policies.',
        type: 'REQUEST',
        status: 'COMPLETED',
        timestamp: '08:08',
        relatedTaskId: 'task-bob-init-1',
        hopDepth: 1
      }
    ];
  }

  public getMessages(agentId?: string, taskId?: string): AgentMessage[] {
    let result = [...this.messages];
    if (agentId) {
      result = result.filter((m) => m.fromAgentId === agentId || m.toAgentId === agentId);
    }
    if (taskId) {
      result = result.filter((m) => m.relatedTaskId === taskId);
    }
    return result;
  }

  public getActiveConnections(): ActiveConnection[] {
    return [...this.activeConnections];
  }

  /**
   * Dispatches a controlled request from one agent to another.
   * Enforces hop limit MAX_AGENT_HOPS = 3 to prevent recursion.
   */
  public async dispatchAgentRequest(
    fromAgent: AgentTownMember,
    toAgent: AgentTownMember,
    content: string,
    relatedTaskId: string | null = null,
    currentHop: number = 1,
    onStateChange?: (update: {
      senderSubtext?: string | null;
      receiverSubtext?: string | null;
      receiverStatus?: 'THINKING' | 'READY';
    }) => void
  ): Promise<AgentMessage> {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Anti-Loop Guard: check max hop depth
    if (currentHop > MAX_AGENT_HOPS) {
      const stopMsg: AgentMessage = {
        id: msgId,
        fromAgentId: fromAgent.id,
        toAgentId: toAgent.id,
        content: content,
        responseContent: `[SYSTEM STOP] Maximum agent communication depth (${MAX_AGENT_HOPS} hops) reached. Request concluded safely.`,
        type: 'INFORMATION',
        status: 'COMPLETED',
        timestamp: timeStr,
        relatedTaskId,
        hopDepth: currentHop
      };
      this.messages = [stopMsg, ...this.messages];
      this.notify();
      return stopMsg;
    }

    const newMsg: AgentMessage = {
      id: msgId,
      fromAgentId: fromAgent.id,
      toAgentId: toAgent.id,
      content,
      responseContent: null,
      type: 'REQUEST',
      status: 'PROCESSING',
      timestamp: timeStr,
      relatedTaskId,
      hopDepth: currentHop
    };

    this.messages = [newMsg, ...this.messages];

    // Add active connection for visual UI line
    const connId = `conn-${fromAgent.id}-${toAgent.id}-${Date.now()}`;
    const newConn: ActiveConnection = {
      id: connId,
      fromAgentId: fromAgent.id,
      toAgentId: toAgent.id,
      timestamp: Date.now()
    };
    this.activeConnections = [...this.activeConnections, newConn];
    this.notify();

    // Signal state change to agents
    onStateChange?.({
      senderSubtext: `↳ Sending request to ${toAgent.name}...`,
      receiverSubtext: `↳ Assisting ${fromAgent.name}...`,
      receiverStatus: 'THINKING'
    });

    try {
      // Execute assistance prompt for target agent
      const collabTask = {
        id: `collab-${msgId}`,
        title: `Collaboration request from ${fromAgent.name} (${fromAgent.role}): "${content}"`,
        assignedAgentId: toAgent.id,
        status: 'WORKING' as const,
        createdAt: new Date().toISOString(),
        startedAt: timeStr,
        completedAt: null,
        error: null,
        progress: 50
      };

      const response = await agentAIService.executeTask(toAgent, collabTask);

      // Check if message was cancelled while in-flight
      const targetMsg = this.messages.find((m) => m.id === msgId);
      if (!targetMsg || targetMsg.status === 'CANCELLED') {
        this.removeConnection(connId);
        return targetMsg || newMsg;
      }

      if (response.success && response.result) {
        targetMsg.status = 'COMPLETED';
        targetMsg.responseContent = response.result;
        onStateChange?.({
          senderSubtext: `↳ Received response from ${toAgent.name}`,
          receiverSubtext: null,
          receiverStatus: 'READY'
        });
      } else if (response.cancelled) {
        targetMsg.status = 'CANCELLED';
        onStateChange?.({
          senderSubtext: null,
          receiverSubtext: null,
          receiverStatus: 'READY'
        });
      } else {
        targetMsg.status = 'FAILED';
        targetMsg.responseContent = 'Communication failed: Target agent could not complete the request.';
        onStateChange?.({
          senderSubtext: `↳ Communication failed with ${toAgent.name}`,
          receiverSubtext: null,
          receiverStatus: 'READY'
        });
      }
    } catch (err) {
      const targetMsg = this.messages.find((m) => m.id === msgId);
      if (targetMsg) {
        targetMsg.status = 'FAILED';
        targetMsg.responseContent = 'Communication failed: Network or subsystem timeout.';
      }
      onStateChange?.({
        senderSubtext: null,
        receiverSubtext: null,
        receiverStatus: 'READY'
      });
    } finally {
      // Clear visual connection line after brief grace period (3.5s)
      setTimeout(() => {
        this.removeConnection(connId);
        onStateChange?.({
          senderSubtext: null
        });
      }, 3500);

      this.notify();
    }

    return this.messages.find((m) => m.id === msgId) || newMsg;
  }

  public cancelMessagesForTask(taskId: string): void {
    let changed = false;
    this.messages.forEach((msg) => {
      if (msg.relatedTaskId === taskId && (msg.status === 'PROCESSING' || msg.status === 'PENDING')) {
        msg.status = 'CANCELLED';
        changed = true;
      }
    });

    if (changed) {
      this.activeConnections = [];
      this.notify();
    }
  }

  public cancelMessage(messageId: string): void {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = 'CANCELLED';
      this.notify();
    }
  }

  private removeConnection(connId: string) {
    this.activeConnections = this.activeConnections.filter((c) => c.id !== connId);
    this.notify();
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
        console.error('Error notifying AgentCommunicationService subscriber:', err);
      }
    });
  }
}

export const agentCommunicationService = new AgentCommunicationService();
