/**
 * JARVIS Agent Town — Agent Task Visualizer
 * Step 8: Task State Mapping, Badge Calculations & Live Event Accumulation
 */

import { AgentTownMember, ActiveConnection } from '../../types';
import {
  VisualTaskState,
  AgentActivityEvent,
  AgentTaskBadgeData,
  TaskPriority,
  ActivityEventType
} from './types';

export class AgentTaskVisualizer {
  private events: AgentActivityEvent[] = [];
  private readonly MAX_EVENTS = 25;
  private previousAgentStates: Map<string, { status: string; taskId: string | null }> = new Map();

  constructor() {
    this.initDefaultHistory();
  }

  private initDefaultHistory() {
    const now = Date.now();
    this.events = [
      {
        id: `evt_init_1`,
        timestamp: now - 35000,
        agentId: 'agent-dave',
        agentName: 'Dave',
        agentColor: '#10e890',
        eventType: 'TASK_COMPLETED',
        title: 'System Initialization',
        description: 'Command center systems online & operational'
      },
      {
        id: `evt_init_2`,
        timestamp: now - 22000,
        agentId: 'agent-carol',
        agentName: 'Carol',
        agentColor: '#a855f7',
        eventType: 'TASK_STARTED',
        title: 'Neural Indexing',
        description: 'Indexed town knowledge vectors into memory bank'
      }
    ];
  }

  /**
   * Evaluates agent status transitions and records real activity events
   */
  public update(agents: AgentTownMember[], activeConnections: ActiveConnection[] = []) {
    const now = Date.now();

    for (const member of agents) {
      const prev = this.previousAgentStates.get(member.id);
      const currentTaskId = member.currentTask?.id || null;
      const currentStatus = member.status;

      if (!prev) {
        this.previousAgentStates.set(member.id, {
          status: currentStatus,
          taskId: currentTaskId
        });
        continue;
      }

      // 1. Detect new task started
      if (currentTaskId && currentTaskId !== prev.taskId) {
        this.logEvent({
          id: `evt_${now}_${Math.random()}`,
          timestamp: now,
          agentId: member.id,
          agentName: member.name,
          agentColor: member.avatar.color,
          eventType: 'TASK_STARTED',
          title: `Task Started: ${member.currentTask?.title || 'New Task'}`,
          description: `Assigned to ${member.name} (${member.role})`,
          taskId: currentTaskId,
          progress: member.currentTask?.progress
        });
      }

      // 2. Detect task completed
      if (prev.status === 'WORKING' && currentStatus === 'COMPLETED') {
        this.logEvent({
          id: `evt_${now}_${Math.random()}`,
          timestamp: now,
          agentId: member.id,
          agentName: member.name,
          agentColor: member.avatar.color,
          eventType: 'TASK_COMPLETED',
          title: `Task Completed`,
          description: `${member.name} finalized task successfully`,
          taskId: prev.taskId || undefined
        });
      }

      // 3. Detect error
      if (currentStatus === 'ERROR' && prev.status !== 'ERROR') {
        this.logEvent({
          id: `evt_${now}_${Math.random()}`,
          timestamp: now,
          agentId: member.id,
          agentName: member.name,
          agentColor: member.avatar.color,
          eventType: 'TASK_FAILED',
          title: `Task Caution / Error`,
          description: `${member.name} encountered execution exception`,
          taskId: currentTaskId || undefined
        });
      }

      this.previousAgentStates.set(member.id, {
        status: currentStatus,
        taskId: currentTaskId
      });
    }
  }

  /**
   * Log an event into the ring buffer
   */
  public logEvent(event: AgentActivityEvent) {
    this.events.unshift(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }
  }

  /**
   * Derive compact overhead badge data for a given agent
   */
  public deriveBadgeData(
    member: AgentTownMember,
    isSelected: boolean,
    isHovered: boolean,
    isMoving: boolean,
    destinationName?: string | null
  ): AgentTaskBadgeData {
    let visualState: VisualTaskState = 'IDLE';

    if (isMoving) {
      visualState = 'WALKING';
    } else if (member.status === 'WORKING') {
      visualState = 'WORKING';
    } else if (member.status === 'THINKING') {
      visualState = 'THINKING';
    } else if (member.status === 'ERROR') {
      visualState = 'FAILED';
    } else if (member.status === 'COMPLETED') {
      visualState = 'COMPLETED';
    } else if (member.status === 'WAITING') {
      visualState = 'WAITING';
    }

    const hasActiveTask = Boolean(member.currentTask);
    const isVisible = isSelected || isHovered || hasActiveTask || isMoving || member.status === 'WORKING' || member.status === 'THINKING';

    const priority: TaskPriority = 'NORMAL';

    return {
      agentId: member.id,
      agentName: member.name,
      agentColor: member.avatar.color,
      taskTitle: member.currentTask?.title || null,
      visualState,
      progress: member.currentTask?.progress !== undefined ? member.currentTask.progress : null,
      priority,
      isVisible,
      destinationName: isMoving ? destinationName || 'Waypoint' : null
    };
  }

  public getRecentEvents(agentFilter: string = 'ALL'): AgentActivityEvent[] {
    if (agentFilter === 'ALL') {
      return this.events;
    }
    return this.events.filter((e) => e.agentId === agentFilter);
  }
}
