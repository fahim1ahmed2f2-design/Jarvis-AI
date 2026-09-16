/**
 * JARVIS Agent Town — Task & Activity Layer Types
 * Step 8: Live Task Visualization, Progress, Activity Feedback & Overhead Badges
 */

import { WorldPosition } from '../types';

export type VisualTaskState =
  | 'QUEUED'
  | 'ASSIGNED'
  | 'WALKING'
  | 'WORKING'
  | 'THINKING'
  | 'COMMUNICATING'
  | 'WAITING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'IDLE';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ActivityEventType =
  | 'TASK_STARTED'
  | 'TASK_PROGRESS'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'TASK_CANCELLED'
  | 'AGENT_MOVED'
  | 'AGENT_COMMUNICATION'
  | 'AGENT_THINKING';

export interface AgentActivityEvent {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  agentColor: string;
  eventType: ActivityEventType;
  title: string;
  description: string;
  taskId?: string;
  progress?: number;
  metadata?: Record<string, any>;
}

export interface AgentTaskBadgeData {
  agentId: string;
  agentName: string;
  agentColor: string;
  taskTitle: string | null;
  visualState: VisualTaskState;
  progress: number | null; // 0 to 100 or null if indeterminate
  priority: TaskPriority;
  isVisible: boolean;
  destinationName?: string | null;
}
