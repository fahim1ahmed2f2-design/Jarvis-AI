/**
 * JARVIS Agent Town — Holographic World Effects Types
 * Step 13: Premium Holographic World Effects & Particle System
 */

import { WorldPosition } from '../types';

export type HolographicEffectType =
  | 'SELECTION_SCAN'
  | 'THINKING_GLYPHS'
  | 'WORKSTATION_SCREEN'
  | 'COMPLETION_BURST'
  | 'ERROR_WARNING'
  | 'MOVEMENT_TRAIL'
  | 'ARRIVAL_PULSE'
  | 'AMBIENT_DUST';

export interface WorldParticle {
  id: number;
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  lifetimeMs: number;
  ageMs: number;
  type: HolographicEffectType;
}

export interface HolographicBurst {
  id: string;
  position: WorldPosition;
  color: string;
  maxRadius: number;
  currentRadius: number;
  alpha: number;
  startTime: number;
  durationMs: number;
  type: 'COMPLETION' | 'ERROR' | 'ARRIVAL' | 'SELECTION';
}

export interface EffectBudget {
  maxParticles: number;
  maxBursts: number;
  isReducedMotion: boolean;
  densityScale: number; // 0.5 for small screens, 1.0 for desktop
}
