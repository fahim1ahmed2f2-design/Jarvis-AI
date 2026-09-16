import { ActivityEvent } from './types';

const MAX_ACTIVITIES = 35;

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    timestamp: '08:00',
    agentId: 'agent-alice',
    agentName: 'Alice',
    type: 'TASK_COMPLETED',
    description: 'Synthesized literature on autonomous multi-agent networks'
  },
  {
    id: 'act-2',
    timestamp: '08:09',
    agentId: 'agent-bob',
    agentName: 'Bob',
    type: 'TASK_COMPLETED',
    description: 'Audited background tool executor sandbox permissions'
  },
  {
    id: 'act-3',
    timestamp: '08:16',
    agentId: 'agent-carol',
    agentName: 'Carol',
    type: 'MEMORY_STORED',
    description: 'Indexed 42 episodic memory clusters and refreshed vector graph'
  },
  {
    id: 'act-4',
    timestamp: '08:21',
    agentId: 'agent-dave',
    agentName: 'Dave',
    type: 'TASK_COMPLETED',
    description: 'Mapped multi-agent task dependency graph for digital operations'
  },
  {
    id: 'act-5',
    timestamp: '08:25',
    agentId: 'agent-dave',
    agentName: 'Dave',
    type: 'SYSTEM',
    description: 'Agent Town Level-4 AI Operations Center synchronized'
  }
];

class AgentActivityFeed {
  private activities: ActivityEvent[] = [...INITIAL_ACTIVITIES];
  private listeners: Set<() => void> = new Set();

  public getActivities(): ActivityEvent[] {
    return [...this.activities];
  }

  public record(
    agentId: string,
    agentName: string,
    type: ActivityEvent['type'],
    description: string,
    icon?: string
  ): ActivityEvent {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const event: ActivityEvent = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      agentId,
      agentName,
      type,
      description,
      icon
    };

    this.activities = [event, ...this.activities.slice(0, MAX_ACTIVITIES - 1)];
    this.notify();
    return event;
  }

  public logEvent(event: {
    id?: string;
    agentId: string;
    agentName: string;
    agentColor?: string;
    eventType?: string;
    title?: string;
    description: string;
    icon?: string;
    timestamp?: number | string;
  }): ActivityEvent {
    const typeMap: Record<string, ActivityEvent['type']> = {
      AGENT_COMMUNICATION: 'COLLABORATION',
      TASK_STARTED: 'TASK_STARTED',
      TASK_COMPLETED: 'TASK_COMPLETED',
      SYSTEM: 'SYSTEM'
    };
    const mappedType: ActivityEvent['type'] = (event.eventType && typeMap[event.eventType]) || 'COLLABORATION';
    const desc = event.title ? `${event.title} - ${event.description}` : event.description;
    return this.record(event.agentId, event.agentName, mappedType, desc, event.icon);
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
        console.error('[AgentActivityFeed] Listener error:', err);
      }
    });
  }
}

export const agentActivityFeed = new AgentActivityFeed();
