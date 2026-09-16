/**
 * JARVIS Agent Town — Interaction Visual Effects Renderer
 * Step 6: Luminous Conduit Beams, Data Packets & Speech Frequency Badges
 */

import { ActiveInteractionSession, DataPacket } from './types';
import { CameraState, WorldPosition } from '../types';
import { WorldCoordinateSystem } from '../WorldCoordinateSystem';

export class InteractionRenderer {
  /**
   * Renders all active interaction conduits, data streams, and speech frequency badges
   */
  public static renderSessions(
    ctx: CanvasRenderingContext2D,
    sessions: ActiveInteractionSession[],
    agentPositions: Map<string, WorldPosition>,
    cam: CameraState,
    elapsedTime: number
  ) {
    if (sessions.length === 0) return;

    for (const session of sessions) {
      const pInit = agentPositions.get(session.initiatorId);
      const pTarget = agentPositions.get(session.targetId);
      if (!pInit || !pTarget) continue;

      // Only draw visual conduit and packets after arrival (when in active communication phases)
      const isActiveCommunication =
        session.phase === 'ALIGNING' ||
        session.phase === 'SPEAKER_ACTIVE' ||
        session.phase === 'DATA_TRANSFER' ||
        session.phase === 'RESPONDER_ACTIVE' ||
        session.phase === 'COMPLETING';

      if (!isActiveCommunication) continue;

      const sInit = WorldCoordinateSystem.worldToScreen({ x: pInit.x, y: pInit.y, z: 20 }, cam);
      const sTarget = WorldCoordinateSystem.worldToScreen({ x: pTarget.x, y: pTarget.y, z: 20 }, cam);
      const z = cam.zoom;

      ctx.save();

      // ── 1. LUMINOUS INTER-AGENT CONDUIT BEAM ──
      const midX = (sInit.x + sTarget.x) / 2;
      const midY = (sInit.y + sTarget.y) / 2 - 15 * z; // Slight upward arc

      ctx.beginPath();
      ctx.moveTo(sInit.x, sInit.y);
      ctx.quadraticCurveTo(midX, midY, sTarget.x, sTarget.y);
      ctx.strokeStyle = 'rgba(0, 232, 255, 0.45)';
      ctx.lineWidth = 2 * z;
      ctx.setLineDash([4 * z, 4 * z]);
      ctx.lineDashOffset = -elapsedTime * 25 * z;
      ctx.shadowColor = '#00e8ff';
      ctx.shadowBlur = 10 * z;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // ── 2. TRAVELLING HOLOGRAPHIC DATA PACKETS ──
      for (const packet of session.dataPackets) {
        const t = Math.max(0, Math.min(1, packet.progress));
        // Quadratic bezier interpolation (B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2)
        const bx = (1 - t) * (1 - t) * sInit.x + 2 * (1 - t) * t * midX + t * t * sTarget.x;
        const by = (1 - t) * (1 - t) * sInit.y + 2 * (1 - t) * t * midY + t * t * sTarget.y;

        ctx.beginPath();
        ctx.arc(bx, by, packet.size * z, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = packet.color;
        ctx.shadowBlur = 12 * z;
        ctx.fill();

        // Packet Aura Ring
        ctx.beginPath();
        ctx.arc(bx, by, (packet.size + 2) * z, 0, Math.PI * 2);
        ctx.strokeStyle = packet.color;
        ctx.lineWidth = 1.5 * z;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── 3. SPEECH WAVEFORM FREQUENCY BADGE ──
      const isInitiatorSpeaking = session.phase === 'SPEAKER_ACTIVE' || session.phase === 'DATA_TRANSFER';
      const isTargetSpeaking = session.phase === 'RESPONDER_ACTIVE';

      if (isInitiatorSpeaking || isTargetSpeaking) {
        const speakerScreen = isInitiatorSpeaking ? sInit : sTarget;
        const speakerColor = isInitiatorSpeaking ? '#00e8ff' : '#10e890';
        const badgeY = speakerScreen.y - 32 * z;

        ctx.save();
        ctx.translate(speakerScreen.x, badgeY);

        // Badge Container
        const bw = 55 * z;
        const bh = 14 * z;
        ctx.beginPath();
        ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 3 * z);
        ctx.fillStyle = 'rgba(2, 6, 22, 0.9)';
        ctx.strokeStyle = speakerColor;
        ctx.lineWidth = 1 * z;
        ctx.shadowColor = speakerColor;
        ctx.shadowBlur = 8 * z;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Animated Audio Bars
        const barCount = 5;
        for (let b = 0; b < barCount; b++) {
          const barHeight = (Math.sin(elapsedTime * 10.0 + b * 1.5) * 0.5 + 0.5) * 8 * z + 2 * z;
          const barX = -bw / 2 + 8 * z + b * 9 * z;
          ctx.beginPath();
          ctx.rect(barX, -barHeight / 2, 2.5 * z, barHeight);
          ctx.fillStyle = speakerColor;
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
    }
  }
}
