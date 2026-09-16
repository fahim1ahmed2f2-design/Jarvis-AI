/**
 * JARVIS Agent Town — World Layer Types
 * Step 1: Animated World Foundation
 */

export interface WorldPosition {
  x: number;
  y: number;
  z?: number;
  rotation?: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export interface Size3D {
  width: number;
  length: number;
  height: number;
}

export type WorldObjectType =
  | 'GROUND'
  | 'ZONE'
  | 'BUILDING'
  | 'DESK'
  | 'MACHINE'
  | 'SCREEN'
  | 'LIGHT'
  | 'DECORATION'
  | 'AGENT_STATION'
  | 'INTERACTION_POINT'
  | 'CONDUIT_LINE';

export type AgentAnimationState =
  | 'IDLE'
  | 'WALKING'
  | 'WORKING'
  | 'THINKING'
  | 'TALKING'
  | 'LISTENING'
  | 'INTERACTING'
  | 'CELEBRATING'
  | 'WAITING'
  | 'SLEEPING'
  | 'ERROR';

export type AgentMovementState = 'STATIONARY' | 'MOVING' | 'ARRIVED';

export type AgentFacing =
  | 'NORTH'
  | 'SOUTH'
  | 'EAST'
  | 'WEST'
  | 'NORTH_EAST'
  | 'NORTH_WEST'
  | 'SOUTH_EAST'
  | 'SOUTH_WEST'
  | 'IDLE';

export interface WorldObject {
  id: string;
  type: WorldObjectType;
  name: string;
  position: WorldPosition;
  size: Size3D;
  rotation?: number;
  scale?: number;
  visible: boolean;
  interactive: boolean;
  zoneId?: string;
  agentId?: string;
  color?: string;
  secondaryColor?: string;
  glowColor?: string;
  renderLayer?: number;
  metadata?: Record<string, any>;
}

export interface TownZone {
  id: string;
  sectorKey: 'ALL' | 'COMMAND' | 'RESEARCH' | 'OPERATIONS' | 'KNOWLEDGE';
  name: string;
  codename: string;
  description: string;
  center: WorldPosition;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  color: string;
  accentColor: string;
  assignedAgentId: string;
}

export interface AgentWorldState {
  agentId: string;
  currentPosition: WorldPosition;
  homePosition: WorldPosition;
  targetPosition: WorldPosition | null;
  animationState: AgentAnimationState;
  previousAnimationState: AgentAnimationState;
  movementState: AgentMovementState;
  facing: AgentFacing;
  stateStartTime: number;
  neuralPulse: number;
  isSelected: boolean;
  isHovered: boolean;
  avatarColor: string;
  glowColor: string;
  name: string;
  role: string;
  taskTitle?: string | null;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  minZoom: number;
  maxZoom: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface AmbientParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  alpha: number;
  color: string;
  pulsePhase: number;
}

export type AssetCategory = 'AGENT' | 'ENVIRONMENT' | 'PROP' | 'EFFECT';

export interface BaseAsset {
  id: string;
  name: string;
  category: AssetCategory;
  version: string;
  author: string;
}

export interface AgentAsset extends BaseAsset {
  category: 'AGENT';
  agentId: string;
  palette: {
    primary: string;
    secondary: string;
    glow: string;
    accent: string;
    hud: string;
  };
  iconName: string;
  placeholderShape: 'HOLO_PRISM' | 'CYBER_ORB' | 'QUANTUM_CORE' | 'COMMAND_SPIRE';
}

export interface EnvironmentAsset extends BaseAsset {
  category: 'ENVIRONMENT';
  zoneId: string;
  tilePattern: string;
  gridColor: string;
  borderGlow: string;
}

export interface PropAsset extends BaseAsset {
  category: 'PROP';
  propType: string;
  dimensions: Size3D;
  hologramColor?: string;
}

export interface EffectAsset extends BaseAsset {
  category: 'EFFECT';
  effectType: 'CONDUIT_PULSE' | 'NEURAL_AURA' | 'HOLO_SCAN' | 'TERMINAL_BLINK';
  color: string;
}
