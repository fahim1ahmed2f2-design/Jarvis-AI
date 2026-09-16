/**
 * JARVIS Agent Town — Social Behavior Types
 * Step 11: Advanced Natural Agent Social Behavior & Workplace Awareness
 */

export type SocialState =
  | 'IDLE'
  | 'WORKING'
  | 'THINKING'
  | 'OBSERVING'
  | 'APPROACHING'
  | 'INTERACTING'
  | 'LISTENING'
  | 'RESPONDING'
  | 'RETURNING'
  | 'RESTING';

export type SocialEventType =
  | 'AGENT_NEARBY'
  | 'AGENT_ACKNOWLEDGED'
  | 'AGENT_ENTERED_ROOM'
  | 'AGENT_LEFT_ROOM'
  | 'TASK_COMPLETION_OBSERVED'
  | 'TASK_ERROR_OBSERVED';

export interface SocialEvent {
  id: string;
  timestamp: number;
  type: SocialEventType;
  initiatorAgentId: string;
  targetAgentId?: string;
  roomId?: string;
  description: string;
}

export interface SocialReaction {
  agentId: string;
  targetAgentId?: string;
  type: 'HEAD_TURN' | 'NOD' | 'GLANCE' | 'OBSERVE';
  durationMs: number;
  startTime: number;
  targetAngle: number;
}

export interface RoomOccupancyState {
  roomId: string;
  occupantAgentIds: string[];
  lastEnteredAgentId?: string;
  lastEnteredTimestamp?: number;
}
