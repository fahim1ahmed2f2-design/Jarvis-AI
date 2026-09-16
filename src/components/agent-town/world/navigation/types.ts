/**
 * JARVIS Agent Town — Navigation & Pathfinding Layer Types
 * Step 5: Real Agent Walking, Pathfinding and Natural Movement
 */

import { WorldPosition } from '../types';
import { CharacterFacing } from '../character/types';

export interface NavNode {
  id: string;
  name: string;
  position: WorldPosition;
  connections: string[]; // Connected NavNode IDs
  isCommunicationPoint?: boolean;
  assignedAgentId?: string;
  zoneId?: string;
}

export interface ObstacleBounds {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface MovementRequest {
  agentId: string;
  targetPosition: WorldPosition;
  destinationName?: string;
  destinationNodeId?: string;
  targetFacing?: CharacterFacing;
  targetAgentId?: string;
  onArrivalState?: 'WORKING' | 'IDLE' | 'TALKING' | 'INTERACTING';
}

export interface AgentNavState {
  agentId: string;
  currentPath: WorldPosition[];
  currentWaypointIndex: number;
  movementSpeed: number; // World units per second
  headingAngle: number; // Smooth heading in radians
  targetFacing: CharacterFacing;
  isPaused: boolean;
  destinationName?: string;
  onArrivalState: 'WORKING' | 'IDLE' | 'TALKING' | 'INTERACTING';
}
