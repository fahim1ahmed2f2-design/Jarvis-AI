/**
 * JARVIS Agent Town — Holographic Effects Renderer
 * Step 13: 2D Canvas Renderer for Selection Rings, Thinking Glyphs, Bursts & Holograms
 */

import { CameraState, WorldPosition } from '../types';
import { WorldParticle, HolographicBurst } from './types';
import { WorldCoordinateSystem } from '../WorldCoordinateSystem';

export class HolographicEffectsRenderer {
  /**
   * Render expanding holographic floor bursts (Completion emerald bursts, Arrival pulses, Error rings)
   */
  public static renderBursts(
    ctx: CanvasRenderingContext2D,
    bursts: HolographicBurst[],
    cam: CameraState
  ) {
    ctx.save();
    for (const b of bursts) {
      const p = WorldCoordinateSystem.worldToScreen(b.position, cam);
      const rx = b.currentRadius * cam.zoom;
      const ry = b.currentRadius * 0.5 * cam.zoom;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = Math.max(1, 2.5 * cam.zoom);
      ctx.globalAlpha = Math.max(0, Math.min(1, b.alpha));
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12 * cam.zoom;
      ctx.stroke();

      // Secondary inner ring
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = Math.max(0, Math.min(1, b.alpha * 0.6));
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Render active pooled particles
   */
  public static renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: WorldParticle[],
    cam: CameraState
  ) {
    ctx.save();
    for (const p of particles) {
      if (!p.active) continue;

      const screenPos = WorldCoordinateSystem.worldToScreen(
        { x: p.x, y: p.y, z: p.z },
        cam
      );

      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, p.size * cam.zoom, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6 * cam.zoom;
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Render holographic selection targeting brackets around selected agent
   */
  public static renderSelectionScan(
    ctx: CanvasRenderingContext2D,
    agentWorldPos: WorldPosition,
    color: string,
    cam: CameraState,
    elapsedTime: number
  ) {
    const p = WorldCoordinateSystem.worldToScreen(agentWorldPos, cam);
    const r = 24 * cam.zoom;
    const ry = r * 0.5;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Rotating dashed outer ring
    ctx.save();
    ctx.rotate(elapsedTime * 1.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 * cam.zoom;
    ctx.globalAlpha = 0.85;
    ctx.setLineDash([6 * cam.zoom, 6 * cam.zoom]);
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * cam.zoom;
    ctx.stroke();
    ctx.restore();

    // Pulsing inner diamond brackets
    const pulse = Math.sin(elapsedTime * 4) * 0.2 + 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.5 * pulse, ry * 0.5 * pulse, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5 * pulse;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render thinking orbital data glyphs around agent head
   */
  public static renderThinkingGlyphs(
    ctx: CanvasRenderingContext2D,
    agentWorldPos: WorldPosition,
    color: string,
    cam: CameraState,
    elapsedTime: number
  ) {
    const p = WorldCoordinateSystem.worldToScreen(
      { x: agentWorldPos.x, y: agentWorldPos.y, z: (agentWorldPos.z || 0) + 38 },
      cam
    );

    ctx.save();
    const glyphCount = 3;
    const orbitRadius = 16 * cam.zoom;

    for (let i = 0; i < glyphCount; i++) {
      const angle = elapsedTime * 2.5 + (i * (Math.PI * 2)) / glyphCount;
      const gx = p.x + Math.cos(angle) * orbitRadius;
      const gy = p.y + Math.sin(angle) * orbitRadius * 0.45;

      ctx.beginPath();
      ctx.arc(gx, gy, 2 * cam.zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#f5a524';
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = '#f5a524';
      ctx.shadowBlur = 6 * cam.zoom;
      ctx.fill();
    }
    ctx.restore();
  }
}
