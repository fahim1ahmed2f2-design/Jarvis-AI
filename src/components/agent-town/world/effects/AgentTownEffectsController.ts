/**
 * JARVIS Agent Town — Holographic Effects Controller
 * Step 13: Particle Pool Management, Burst Generation & Effect Budgeting
 */

import { WorldPosition } from '../types';
import { WorldParticle, HolographicBurst, EffectBudget, HolographicEffectType } from './types';

export const MAX_PARTICLE_POOL_SIZE = 100;
export const MAX_ACTIVE_BURSTS = 12;

export class AgentTownEffectsController {
  private particlePool: WorldParticle[] = [];
  private bursts: HolographicBurst[] = [];
  private budget: EffectBudget = {
    maxParticles: MAX_PARTICLE_POOL_SIZE,
    maxBursts: MAX_ACTIVE_BURSTS,
    isReducedMotion: false,
    densityScale: 1.0
  };

  constructor() {
    this.initParticlePool();
  }

  private initParticlePool() {
    for (let i = 0; i < MAX_PARTICLE_POOL_SIZE; i++) {
      this.particlePool.push({
        id: i,
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 2,
        alpha: 0,
        maxAlpha: 0.8,
        color: '#00e8ff',
        lifetimeMs: 1000,
        ageMs: 0,
        type: 'AMBIENT_DUST'
      });
    }
  }

  /**
   * Main update tick for particles and expanding bursts
   */
  public update(deltaTime: number) {
    const dtMs = deltaTime * 1000;
    const now = Date.now();

    // 1. Update Particles
    for (const p of this.particlePool) {
      if (!p.active) continue;

      p.ageMs += dtMs;
      if (p.ageMs >= p.lifetimeMs) {
        p.active = false;
        continue;
      }

      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.z += p.vz * deltaTime;

      const progress = p.ageMs / p.lifetimeMs;
      p.alpha = (1 - progress) * p.maxAlpha;
    }

    // 2. Update Bursts
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      const elapsed = now - b.startTime;
      if (elapsed >= b.durationMs) {
        this.bursts.splice(i, 1);
        continue;
      }

      const t = elapsed / b.durationMs;
      b.currentRadius = b.maxRadius * Math.sin(t * (Math.PI / 2));
      b.alpha = (1 - t) * 0.85;
    }
  }

  /**
   * Spawn a celebratory task completion emerald sparkle burst
   */
  public spawnCompletionBurst(pos: WorldPosition) {
    if (this.budget.isReducedMotion) return;

    // Expanding emerald ring
    this.bursts.push({
      id: `burst_comp_${Date.now()}`,
      position: { ...pos },
      color: '#10e890',
      maxRadius: 65,
      currentRadius: 0,
      alpha: 0.9,
      startTime: Date.now(),
      durationMs: 900,
      type: 'COMPLETION'
    });

    // Particle sparkles
    const particleCount = Math.floor(16 * this.budget.densityScale);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Math.random() * 45 + 25;
      this.allocateParticle({
        type: 'COMPLETION_BURST',
        x: pos.x,
        y: pos.y,
        z: (pos.z || 0) + 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: Math.random() * 30 + 15,
        size: Math.random() * 2.5 + 1.5,
        color: '#10e890',
        maxAlpha: 0.9,
        lifetimeMs: Math.random() * 500 + 600
      });
    }
  }

  /**
   * Spawn localized task error warning pulse
   */
  public spawnErrorBurst(pos: WorldPosition) {
    this.bursts.push({
      id: `burst_err_${Date.now()}`,
      position: { ...pos },
      color: '#ff4060',
      maxRadius: 50,
      currentRadius: 0,
      alpha: 0.85,
      startTime: Date.now(),
      durationMs: 800,
      type: 'ERROR'
    });
  }

  /**
   * Spawn waypoint arrival floor pulse
   */
  public spawnArrivalPulse(pos: WorldPosition, color: string = '#00e8ff') {
    this.bursts.push({
      id: `burst_arr_${Date.now()}`,
      position: { ...pos },
      color,
      maxRadius: 38,
      currentRadius: 0,
      alpha: 0.75,
      startTime: Date.now(),
      durationMs: 650,
      type: 'ARRIVAL'
    });
  }

  /**
   * Spawn subtle trailing particle when an agent moves
   */
  public spawnMovementTrail(pos: WorldPosition, color: string) {
    if (this.budget.isReducedMotion) return;
    if (Math.random() > 0.4 * this.budget.densityScale) return;

    this.allocateParticle({
      type: 'MOVEMENT_TRAIL',
      x: pos.x + (Math.random() - 0.5) * 6,
      y: pos.y + (Math.random() - 0.5) * 6,
      z: 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      vz: Math.random() * 8 + 2,
      size: Math.random() * 1.5 + 1.0,
      color,
      maxAlpha: 0.5,
      lifetimeMs: 450
    });
  }

  private allocateParticle(params: Partial<WorldParticle>): boolean {
    const p = this.particlePool.find((item) => !item.active);
    if (!p) return false;

    p.active = true;
    p.x = params.x || 0;
    p.y = params.y || 0;
    p.z = params.z || 0;
    p.vx = params.vx || 0;
    p.vy = params.vy || 0;
    p.vz = params.vz || 0;
    p.size = params.size || 2;
    p.color = params.color || '#00e8ff';
    p.maxAlpha = params.maxAlpha || 0.8;
    p.alpha = p.maxAlpha;
    p.lifetimeMs = params.lifetimeMs || 800;
    p.ageMs = 0;
    p.type = params.type || 'AMBIENT_DUST';
    return true;
  }

  public getActiveParticles(): WorldParticle[] {
    return this.particlePool.filter((p) => p.active);
  }

  public getActiveBursts(): HolographicBurst[] {
    return this.bursts;
  }

  public setReducedMotion(isReduced: boolean) {
    this.budget.isReducedMotion = isReduced;
  }

  public setDensityScale(scale: number) {
    this.budget.densityScale = Math.max(0.2, Math.min(1.0, scale));
  }
}
