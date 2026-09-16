/**
 * JARVIS Agent Town — Environment Layer Types
 * Step 7: Living, Responsive Agent Town Environment & Dynamic Reactive Workspaces
 */

import { WorldPosition, Size3D } from '../types';

export type RoomCategory = 'CENTRAL_HUB' | 'RESEARCH_LAB' | 'OPERATIONS_LAB' | 'KNOWLEDGE_LIBRARY' | 'COMMAND_CENTER';

export type RoomActivityState =
  | 'IDLE'
  | 'ACTIVE'
  | 'BUSY'
  | 'COMMUNICATING'
  | 'THINKING'
  | 'ERROR'
  | 'COMPLETED';

export type WorkstationState =
  | 'OFF'
  | 'IDLE'
  | 'ACTIVE'
  | 'PROCESSING'
  | 'WARNING'
  | 'SUCCESS';

export type HubActivityLevel = 'CALM' | 'LOW_ACTIVITY' | 'ACTIVE' | 'HIGH_ACTIVITY';

export type EnvironmentEventType =
  | 'AGENT_STARTED_WORK'
  | 'AGENT_STARTED_THINKING'
  | 'AGENT_COMPLETED'
  | 'AGENT_ERROR'
  | 'AGENT_STARTED_COMMUNICATION';

export interface EnvironmentEvent {
  id: string;
  type: EnvironmentEventType;
  agentId: string;
  roomId: string;
  intensity: number; // 1.0 down to 0.0 decay
  timestamp: number;
  durationSeconds: number;
}

export interface RoomDynamicLighting {
  roomId: string;
  intensity: number; // 0.08 (calm) to 0.35 (busy/active)
  targetIntensity: number;
  glowColor: string;
  accentColor: string;
  activityScore: number; // 0.0 to 1.0
  activityState: RoomActivityState;
}

export interface InteractionPoint {
  id: string;
  name: string;
  category: string;
  description: string;
  roomId: string;
  agentId?: string;
  position: WorldPosition;
  radius: number; // Interaction hit radius in world units
  iconName: string;
  primaryColor: string;
  status: 'ACTIVE' | 'IDLE' | 'STANDBY' | 'ONLINE';
}

export interface PathSegment {
  id: string;
  name: string;
  from: WorldPosition;
  to: WorldPosition;
  width: number;
  color: string;
  pulseSpeed: number;
  glowIntensity: number;
}

export interface EnvironmentProp {
  id: string;
  name: string;
  roomId: string;
  type:
    | 'RESEARCH_DESK'
    | 'OPERATIONS_DESK'
    | 'KNOWLEDGE_DESK'
    | 'COMMAND_TABLE'
    | 'HOLO_MONITOR_ARRAY'
    | 'ROBOTIC_ARM'
    | 'KNOWLEDGE_SHELVES'
    | 'COMMAND_GLOBE_STATION'
    | 'CYBER_TERRARIUM'
    | 'SERVER_RACK_UNIT'
    | 'QUANTUM_REACTOR_CORE'
    | 'COMMUNAL_BENCH';
  position: WorldPosition;
  size: Size3D;
  color: string;
  secondaryColor: string;
  interactive: boolean;
  interactionPointId?: string;
  workstationState?: WorkstationState;
  metadata?: Record<string, any>;
}

export interface RoomData {
  id: string;
  name: string;
  codename: string;
  category: RoomCategory;
  description: string;
  agentId: string;
  agentName: string;
  center: WorldPosition;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  color: string;
  accentColor: string;
  ambientGlowColor: string;
  floorPattern: 'HEX_CIRCUIT' | 'GRID_PULSE' | 'CRYSTAL_FACET' | 'RADAR_RINGS' | 'REACTOR_CORE';
  interactionPoints: InteractionPoint[];
  props: EnvironmentProp[];
}

export interface AmbientDrone {
  id: string;
  name: string;
  position: WorldPosition;
  targetWaypoints: WorldPosition[];
  currentWaypointIndex: number;
  speed: number;
  bobPhase: number;
  rotation: number;
  color: string;
  scanPulse: number;
}

export interface WorldBoundary {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
