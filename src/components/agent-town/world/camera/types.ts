/**
 * JARVIS Agent Town — Camera Layer Types
 * Step 10: Premium Cinematic Camera & Smart Focus System
 */

import { WorldPosition } from '../types';

export type CameraMode =
  | 'FREE'
  | 'FOCUS_AGENT'
  | 'FOCUS_LOCATION'
  | 'FOLLOW_AGENT'
  | 'FOLLOW_INTERACTION'
  | 'OVERVIEW';

export type CameraPriority =
  | 'URGENT_USER_REQUEST'
  | 'USER_SELECTED_AGENT'
  | 'ACTIVE_COMMUNICATION'
  | 'HIGH_PRIORITY_TASK'
  | 'TASK_COMPLETION'
  | 'NORMAL_ACTIVITY'
  | 'AMBIENT_EVENT';

export interface CameraAnchor {
  id: string;
  name: string;
  worldPosition: WorldPosition;
  recommendedZoom: number;
}

export interface CameraFrameTarget {
  targetWorldPosition: WorldPosition;
  targetZoom: number;
  mode: CameraMode;
  trackedAgentId?: string | null;
  trackedPartnerId?: string | null;
  priority: CameraPriority;
  transitionDurationMs?: number;
}

export interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZoom: number;
  maxZoom: number;
}
