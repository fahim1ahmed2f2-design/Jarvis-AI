/**
 * JARVIS Agent Town — Character Animation Types
 * Step 2: Animated Agent Character System
 */

import { AgentAnimationState, WorldPosition } from '../types';

export type CharacterFacing = 'SOUTH' | 'SOUTH_EAST' | 'EAST' | 'NORTH_EAST' | 'NORTH' | 'NORTH_WEST' | 'WEST' | 'SOUTH_WEST';

export interface ColorPalette {
  primary: string;
  secondary: string;
  glow: string;
  accent: string;
  armor: string;
  visor: string;
  shadow: string;
  hud: string;
}

export interface CharacterPropConfig {
  type: 'HOLO_TABLET' | 'TOOL_WRENCH' | 'MEMORY_CRYSTALS' | 'COMMAND_GLOBE' | 'NONE';
  color: string;
  glowColor: string;
  scale: number;
}

export interface AgentVisualConfig {
  agentId: string;
  displayName: string;
  role: string;
  personality: 'ANALYTICAL' | 'ENERGETIC' | 'SCHOLARLY' | 'COMMANDING';
  baseScale: number;
  palette: ColorPalette;
  headStyle: 'SLEEK_HELMET' | 'TECH_VISOR' | 'HOODED_MANTLE' | 'COMMAND_OFFICER';
  prop: CharacterPropConfig;
  idleCycleSpeed: number;
  idleSwayAmplitude: number;
  breathingSpeed: number;
  walkStrideFrequency: number;
  walkBobHeight: number;
}

export interface LimbPose {
  leftArmAngle: number;
  rightArmAngle: number;
  leftForearmAngle: number;
  rightForearmAngle: number;
  leftLegAngle: number;
  rightLegAngle: number;
  headTiltAngle: number;
  headPanAngle: number;
  torsoPitch: number;
  torsoHeightOffset: number;
  handToolHeight: number;
  propRotation: number;
  propFloatOffset: number;
  particlesIntensity: number;
  shadowScale: number;
  facing: CharacterFacing;
}

export interface CharacterStateBlend {
  fromState: AgentAnimationState;
  toState: AgentAnimationState;
  blendProgress: number; // 0 to 1
  blendDuration: number; // in seconds
}
