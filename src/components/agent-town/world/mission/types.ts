/**
 * JARVIS Agent Town — Mission System Types
 * Step 14: Premium Agent Town Mission System & Multi-Stage Timeline
 */

import { SubTask, TownSector } from '../../types';

export type MissionState =
  | 'DETECTED'
  | 'PLANNING'
  | 'ASSIGNING'
  | 'ACTIVE'
  | 'COLLABORATING'
  | 'WAITING'
  | 'COMPLETING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type MissionPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface MissionStage {
  id: string;
  name: string;
  assignedAgentId: string;
  status: 'DONE' | 'ACTIVE' | 'PENDING' | 'FAILED';
  progress?: number | null;
}

export interface AgentMission {
  missionId: string;
  taskId: string;
  title: string;
  description: string;
  priority: MissionPriority;
  status: MissionState;
  coordinatorId: string;
  assignedAgentIds: string[];
  stages: MissionStage[];
  progress: number;
  targetSector: TownSector;
  createdAt: string;
  completedAt?: string | null;
}
