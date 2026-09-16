/**
 * JARVIS Agent Town — Task Badge & Activity Halo Renderer
 * Step 8: Overhead Task Status Chips, Progress Arcs & Ground Activity Halos
 */

import { AgentTaskBadgeData } from './types';
import { CameraState } from '../types';

export class TaskBadgeRenderer {
  /**
   * Renders the dynamic ground activity halo beneath an agent
   */
  public static renderGroundHalo(
    ctx: CanvasRenderingContext2D,
    badge: AgentTaskBadgeData,
    screenX: number,
    screenY: number,
    cam: CameraState,
    elapsedTime: number
  ) {
    if (!badge.isVisible && badge.visualState === 'IDLE') return;

    const z = cam.zoom;
    const color = badge.agentColor;

    ctx.save();
    ctx.translate(screenX, screenY);

    if (badge.visualState === 'WORKING') {
      // ── WORKING: Pulsing chromatic activity ring ──
      const pulse = Math.sin(elapsedTime * 4.0) * 2 * z;
      const r = (16 + pulse) * z;

      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 * z;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * z;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Rotating Tick Marks
      ctx.beginPath();
      ctx.ellipse(0, 0, (r + 4 * z), (r + 4 * z) * 0.5, elapsedTime * 2.0, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 1 * z;
      ctx.setLineDash([4 * z, 8 * z]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (badge.visualState === 'THINKING') {
      // ── THINKING: Concentric dashed radar bracket ──
      const r = 18 * z;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.5, -elapsedTime * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 * z;
      ctx.setLineDash([6 * z, 6 * z]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (badge.visualState === 'WALKING') {
      // ── WALKING: Small directional motion pulse ──
      const r = (14 + Math.sin(elapsedTime * 6.0) * 2) * z;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}88`;
      ctx.lineWidth = 1 * z;
      ctx.stroke();
    } else if (badge.visualState === 'COMPLETED') {
      // ── COMPLETED: Celebratory emerald ring ──
      const r = 20 * z;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#10e890';
      ctx.lineWidth = 2 * z;
      ctx.stroke();
    } else if (badge.visualState === 'FAILED') {
      // ── FAILED: Pulsing warning ring ──
      const r = (16 + Math.sin(elapsedTime * 8.0) * 3) * z;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2 * z;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renders the overhead holographic task status chip and progress arc above an agent
   */
  public static renderOverheadBadge(
    ctx: CanvasRenderingContext2D,
    badge: AgentTaskBadgeData,
    screenX: number,
    screenY: number,
    cam: CameraState,
    elapsedTime: number
  ) {
    if (!badge.isVisible) return;
    if (badge.visualState === 'IDLE' && !badge.taskTitle) return;

    const z = cam.zoom;
    const color = badge.agentColor;
    const badgeY = screenY - 58 * z;

    ctx.save();
    ctx.translate(screenX, badgeY);

    const hasProgress = badge.progress !== null && badge.progress !== undefined;
    const chipWidth = (hasProgress ? 88 : 74) * z;
    const chipHeight = (badge.taskTitle ? 24 : 16) * z;

    // 1. Container Capsule
    ctx.beginPath();
    ctx.roundRect(-chipWidth / 2, -chipHeight / 2, chipWidth, chipHeight, 4 * z);
    ctx.fillStyle = 'rgba(2, 6, 22, 0.94)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 * z;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6 * z;
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. Status / Action Title
    const statusText =
      badge.visualState === 'WALKING'
        ? `[→ ${badge.destinationName || 'MOVE'}]`
        : badge.visualState === 'WORKING'
        ? 'WORKING'
        : badge.visualState === 'THINKING'
        ? 'THINKING'
        : badge.visualState === 'FAILED'
        ? 'ERROR'
        : badge.visualState === 'COMPLETED'
        ? 'DONE'
        : 'ACTIVE';

    ctx.font = `700 ${Math.max(7, 8 * z)}px 'Orbitron', sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(`${badge.agentName.toUpperCase()} // ${statusText}`, 0, badge.taskTitle ? -2 * z : 3 * z);

    // 3. Task Subtitle (if available)
    if (badge.taskTitle) {
      ctx.font = `${Math.max(6, 7 * z)}px 'Share Tech Mono', monospace`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.textAlign = 'center';
      const truncated = badge.taskTitle.length > 14 ? `${badge.taskTitle.substring(0, 13)}…` : badge.taskTitle;
      ctx.fillText(truncated, 0, 7 * z);
    }

    // 4. Circular Progress Arc (if real progress exists)
    if (hasProgress) {
      const arcX = chipWidth / 2 - 10 * z;
      const arcY = 0;
      const arcR = 5 * z;

      // Background Track
      ctx.beginPath();
      ctx.arc(arcX, arcY, arcR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5 * z;
      ctx.stroke();

      // Progress Arc
      const pct = Math.max(0, Math.min(100, badge.progress!)) / 100;
      ctx.beginPath();
      ctx.arc(arcX, arcY, arcR, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 * z;
      ctx.stroke();
    }

    ctx.restore();
  }
}
