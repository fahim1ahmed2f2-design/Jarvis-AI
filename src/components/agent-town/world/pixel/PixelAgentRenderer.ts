/**
 * JARVIS Agent Town — Pixel Agent Character Renderer
 * Step 15+: 2D Top-Down Retro Pixel-Art Chibi Character Sprite Renderer
 */

import { ScreenPosition } from '../types';

export interface PixelAgentVisualState {
  agentId: string;
  name: string;
  codename: string;
  role: string;
  status: 'IDLE' | 'WORKING' | 'THINKING' | 'COMMUNICATING' | 'WAITING' | 'ERROR' | 'COMPLETED' | 'READY' | 'OFFLINE' | 'WALKING';
  position: { x: number; y: number };
  facing: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  isWalking: boolean;
  isSitting: boolean;
  color: string;
  hairColor: string;
  outfitColor: string;
  skinColor: string;
  isSelected: boolean;
  isHovered: boolean;
}

export class PixelAgentRenderer {
  /**
   * Draw a chibi pixel-art character at the screen position
   */
  public static renderAgent(
    ctx: CanvasRenderingContext2D,
    agent: PixelAgentVisualState,
    screenPos: ScreenPosition,
    scale: number = 2.4,
    elapsedTime: number = 0
  ) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const x = Math.round(screenPos.x);
    const y = Math.round(screenPos.y);

    // 1. Soft Pixel Drop Shadow
    ctx.beginPath();
    ctx.ellipse(x, y + 14 * scale, 9 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    // Walking / Idle Bobbing offset
    const walkBob = agent.isWalking ? Math.sin(elapsedTime * 12) * (1.5 * scale) : Math.sin(elapsedTime * 2.5) * (0.5 * scale);
    const charY = y + walkBob;

    // 2. Render Character Body & Clothing
    this.drawCharacterSprite(ctx, agent, x, charY, scale, elapsedTime);

    // 3. Render Name Tag / Role Tag
    this.drawNameTag(ctx, agent, x, charY, scale);

    // 4. Render Active Working Typing / Thinking / Interaction Prompts
    this.drawOverheads(ctx, agent, x, charY, scale, elapsedTime);

    ctx.restore();
  }

  private static drawCharacterSprite(
    ctx: CanvasRenderingContext2D,
    agent: PixelAgentVisualState,
    x: number,
    y: number,
    scale: number,
    elapsedTime: number
  ) {
    const s = scale;
    const isFacingUp = agent.facing === 'UP';
    const isFacingLeft = agent.facing === 'LEFT';
    const isFacingRight = agent.facing === 'RIGHT';

    // ── LEGS / SHOES ──
    if (!agent.isSitting) {
      const walkCycle = agent.isWalking ? Math.sin(elapsedTime * 14) : 0;
      const legL = walkCycle > 0 ? -2 * s : 0;
      const legR = walkCycle < 0 ? -2 * s : 0;

      ctx.fillStyle = '#1e293b'; // Dark pants
      ctx.fillRect(x - 5 * s, y + 5 * s + legL, 4 * s, 6 * s);
      ctx.fillRect(x + 1 * s, y + 5 * s + legR, 4 * s, 6 * s);

      // Shoes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 6 * s, y + 10 * s + legL, 5 * s, 3 * s);
      ctx.fillRect(x + 1 * s, y + 10 * s + legR, 5 * s, 3 * s);
    }

    // ── TORSO / OUTFIT ──
    ctx.fillStyle = agent.outfitColor;
    ctx.fillRect(x - 6 * s, y - 2 * s, 12 * s, 8 * s);

    // Outfit Collar / Tie / Details
    if (!isFacingUp) {
      // Collar / Tie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2 * s, y - 2 * s, 4 * s, 3 * s);
      ctx.fillStyle = agent.color; // Signature tie/badge
      ctx.fillRect(x - 1 * s, y - 1 * s, 2 * s, 4 * s);

      // Hands (Typing animation if working & sitting)
      if (agent.isSitting && agent.status === 'WORKING') {
        const typeOffset = Math.sin(elapsedTime * 18) * 1.2 * s;
        ctx.fillStyle = agent.skinColor;
        ctx.fillRect(x - 6 * s, y + 2 * s + typeOffset, 3 * s, 3 * s);
        ctx.fillRect(x + 3 * s, y + 2 * s - typeOffset, 3 * s, 3 * s);
      }
    }

    // ── HEAD & FACE ──
    const headW = 14 * s;
    const headH = 12 * s;
    const headX = x - 7 * s;
    const headY = y - 14 * s;

    // Skin Base
    ctx.fillStyle = agent.skinColor;
    ctx.fillRect(headX + 1 * s, headY, headW - 2 * s, headH);
    ctx.fillRect(headX, headY + 2 * s, headW, headH - 4 * s);

    // Eyes & Expressions (if not facing UP)
    if (!isFacingUp) {
      const eyeXOffset = isFacingLeft ? -2 * s : isFacingRight ? 2 * s : 0;

      ctx.fillStyle = '#1e293b'; // Eyes
      if (agent.status === 'WORKING' && agent.isSitting) {
        // Focused looking down/squint
        ctx.fillRect(headX + 3 * s + eyeXOffset, headY + 6 * s, 2 * s, 1 * s);
        ctx.fillRect(headX + 9 * s + eyeXOffset, headY + 6 * s, 2 * s, 1 * s);
      } else {
        // Normal wide eyes with shine
        ctx.fillRect(headX + 3 * s + eyeXOffset, headY + 5 * s, 2 * s, 3 * s);
        ctx.fillRect(headX + 9 * s + eyeXOffset, headY + 5 * s, 2 * s, 3 * s);

        ctx.fillStyle = '#ffffff'; // Eye shine
        ctx.fillRect(headX + 3 * s + eyeXOffset, headY + 5 * s, 1 * s, 1 * s);
        ctx.fillRect(headX + 9 * s + eyeXOffset, headY + 5 * s, 1 * s, 1 * s);
      }

      // Cheeks Blush
      ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
      ctx.fillRect(headX + 2 * s, headY + 8 * s, 2 * s, 1.5 * s);
      ctx.fillRect(headX + 10 * s, headY + 8 * s, 2 * s, 1.5 * s);
    }

    // ── HAIR STYLES BY CHARACTER ──
    this.drawCharacterHair(ctx, agent, headX, headY, headW, headH, s, isFacingUp, isFacingLeft, isFacingRight);
  }

  private static drawCharacterHair(
    ctx: CanvasRenderingContext2D,
    agent: PixelAgentVisualState,
    hx: number,
    hy: number,
    hw: number,
    hh: number,
    s: number,
    isUp: boolean,
    isLeft: boolean,
    isRight: boolean
  ) {
    ctx.fillStyle = agent.hairColor;

    if (agent.agentId === 'agent-jarvis') {
      // ── 👑 JARVIS: Supreme Gold Commander Hair + Halo Crown ──
      ctx.fillRect(hx, hy - 3 * s, hw, 4 * s);
      ctx.fillRect(hx - 2 * s, hy + 1 * s, 3 * s, 6 * s);
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 3 * s, 6 * s);

      // Gold Commander Crown / Halo
      ctx.fillStyle = '#eab308';
      ctx.fillRect(hx + 2 * s, hy - 6 * s, hw - 4 * s, 2.5 * s);
      ctx.fillRect(hx + hw / 2 - 2 * s, hy - 8 * s, 4 * s, 2 * s);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(hx + hw / 2 - 1 * s, hy - 7 * s, 2 * s, 2 * s);

      // Cyan Cyber Monocle Eyepiece
      if (!isUp) {
        ctx.strokeStyle = '#00e8ff';
        ctx.lineWidth = 1 * s;
        ctx.strokeRect(hx + 8 * s, hy + 4.5 * s, 3.5 * s, 3 * s);
      }
    } else if (agent.agentId === 'agent-jonson') {
      // ── 🛡️ JONSON: Tactical Buzzcut & Security Earpiece ──
      ctx.fillRect(hx, hy - 2 * s, hw, 3 * s);
      ctx.fillRect(hx - 1 * s, hy + 1 * s, 2 * s, 4 * s);
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 2 * s, 4 * s);

      // Red Cyber Comm Earpiece
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(hx + hw, hy + 4 * s, 2 * s, 3 * s);
    } else if (agent.agentId === 'agent-tuly') {
      // ── 🎨 TULY: Long Magenta Hair with Chic Yellow Ribbon ──
      ctx.fillRect(hx, hy - 2 * s, hw, 4 * s);
      ctx.fillRect(hx - 3 * s, hy + 1 * s, 4 * s, 10 * s); // Long Left Hair
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 4 * s, 10 * s); // Long Right Hair
      if (!isUp) {
        ctx.fillRect(hx + 1 * s, hy + 1 * s, hw - 2 * s, 3 * s); // Cute Front Bangs
      }

      // Yellow Flower / Ribbon Hairclip
      ctx.fillStyle = '#fde047';
      ctx.fillRect(hx - 2 * s, hy - 2 * s, 4 * s, 4 * s);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(hx - 1 * s, hy - 1 * s, 2 * s, 2 * s);
    } else if (agent.agentId === 'agent-mob') {
      // ── 📊 MOB: Big Data Coder Hair & Green Headphones ──
      ctx.fillRect(hx - 1 * s, hy - 3 * s, hw + 2 * s, 4 * s);
      ctx.fillRect(hx + 3 * s, hy - 5 * s, 4 * s, 3 * s);
      ctx.fillRect(hx - 2 * s, hy + 1 * s, 3 * s, 5 * s);
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 3 * s, 5 * s);

      // Green Tech Headphones
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(hx - 3 * s, hy + 3 * s, 3 * s, 5 * s);
      ctx.fillRect(hx + hw, hy + 3 * s, 3 * s, 5 * s);
      ctx.fillRect(hx - 1 * s, hy - 4 * s, hw + 2 * s, 2 * s);
    } else if (agent.agentId === 'agent-knox') {
      // ── ☁️ KNOX: Cloud DevOps Tech Visor ──
      ctx.fillRect(hx - 1 * s, hy - 2 * s, hw + 2 * s, 3 * s);
      ctx.fillRect(hx - 2 * s, hy + 1 * s, 3 * s, 5 * s);
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 3 * s, 5 * s);

      // Teal Cloud DevOps Visor across forehead
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(hx - 1 * s, hy + 2 * s, hw + 2 * s, 2.5 * s);
    } else if (agent.agentId === 'agent-alice') {
      // ── ALICE: Neat Brown Bob with Front Bangs ──
      ctx.fillRect(hx, hy - 2 * s, hw, 4 * s);
      ctx.fillRect(hx - 2 * s, hy + 1 * s, 3 * s, 9 * s); // Left bob side
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 3 * s, 9 * s); // Right bob side
      if (!isUp) {
        ctx.fillRect(hx + 1 * s, hy + 1 * s, hw - 2 * s, 3 * s); // Bangs
      }
    } else if (agent.agentId === 'agent-bob') {
      // ── BOB: Spiky Developer Hair + Headphones ──
      ctx.fillRect(hx - 1 * s, hy - 3 * s, hw + 2 * s, 4 * s);
      ctx.fillRect(hx + 2 * s, hy - 5 * s, 3 * s, 3 * s); // Center Spike
      ctx.fillRect(hx + 8 * s, hy - 4 * s, 3 * s, 2 * s); // Right Spike
      ctx.fillRect(hx - 2 * s, hy + 1 * s, 3 * s, 4 * s);
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 3 * s, 4 * s);

      // Headphones around neck
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(hx - 1 * s, hy + hh - 1 * s, hw + 2 * s, 2 * s);
    } else if (agent.agentId === 'agent-carol') {
      // ── CAROL: Auburn Ponytail with Glasses ──
      ctx.fillRect(hx, hy - 2 * s, hw, 4 * s);
      ctx.fillRect(hx - 2 * s, hy + 1 * s, 3 * s, 7 * s);
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 3 * s, 7 * s);
      // Ponytail hanging to the side
      ctx.fillRect(hx + hw, hy + 3 * s, 3 * s, 6 * s);

      // Glasses (if facing front)
      if (!isUp) {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1 * s;
        ctx.strokeRect(hx + 2.5 * s, hy + 4.5 * s, 3.5 * s, 3 * s);
        ctx.strokeRect(hx + 8 * s, hy + 4.5 * s, 3.5 * s, 3 * s);
      }
    } else if (agent.agentId === 'agent-dave') {
      // ── DAVE: Tactical Commander Dark Hair with Cap/Visor ──
      ctx.fillRect(hx - 1 * s, hy - 2 * s, hw + 2 * s, 4 * s);
      ctx.fillRect(hx - 2 * s, hy + 1 * s, 3 * s, 5 * s);
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 3 * s, 5 * s);

      // Navy Commander Cap Visor
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(hx - 2 * s, hy - 4 * s, hw + 4 * s, 4 * s);
      ctx.fillStyle = '#f59e0b'; // Gold Commander Emblem
      ctx.fillRect(hx + 5 * s, hy - 3 * s, 4 * s, 2 * s);
    } else {
      // Default Agent Hair
      ctx.fillRect(hx - 1 * s, hy - 2 * s, hw + 2 * s, 4 * s);
      ctx.fillRect(hx - 2 * s, hy + 1 * s, 3 * s, 5 * s);
      ctx.fillRect(hx + hw - 1 * s, hy + 1 * s, 3 * s, 5 * s);
    }
  }

  private static drawNameTag(
    ctx: CanvasRenderingContext2D,
    agent: PixelAgentVisualState,
    x: number,
    y: number,
    scale: number
  ) {
    const s = scale;
    const tagY = y + 16 * s;

    ctx.save();
    ctx.font = `bold ${Math.max(9, Math.round(9 * (s / 2)))}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = agent.name;
    const textW = ctx.measureText(text).width;

    // Name Capsule Background
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.strokeStyle = `${agent.color}80`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(x - textW / 2 - 5, tagY - 6, textW + 10, 13, 3);
    ctx.fill();
    ctx.stroke();

    // Agent Name Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, tagY);

    ctx.restore();
  }

  private static drawOverheads(
    ctx: CanvasRenderingContext2D,
    agent: PixelAgentVisualState,
    x: number,
    y: number,
    scale: number,
    elapsedTime: number
  ) {
    const s = scale;
    const topY = y - 22 * s;

    // ── 1. HOVERED OR SELECTED: GOLDEN ARROW & "PRESS E" PROMPT (as in screenshot) ──
    if (agent.isHovered || agent.isSelected) {
      const arrowBob = Math.sin(elapsedTime * 6) * (2 * s);
      const arrowY = topY - 8 * s + arrowBob;

      // Golden Arrow ▼
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x - 5 * s, arrowY - 5 * s);
      ctx.lineTo(x + 5 * s, arrowY - 5 * s);
      ctx.lineTo(x, arrowY + 1 * s);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Retro "Press E" / "Inspect" Capsule Badge
      ctx.save();
      ctx.font = `bold ${Math.max(9, Math.round(8 * (s / 2)))}px 'Share Tech Mono', monospace`;
      const promptText = 'Press E';
      const promptW = ctx.measureText(promptText).width;
      const badgeX = x + 18 * s;
      const badgeY = y - 4 * s;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX - 4, badgeY - 7, promptW + 8, 14, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(promptText, badgeX, badgeY);
      ctx.restore();
    }

    // ── 2. THINKING SPEECH BUBBLE ──
    if (agent.status === 'THINKING') {
      const bubbleY = topY - 4 * s;
      ctx.fillStyle = '#f5a524';
      ctx.beginPath();
      ctx.arc(x, bubbleY, 7 * s, 0, Math.PI * 2);
      ctx.fill();

      // Lightbulb / Dots
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(8 * s)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💡', x, bubbleY);
    }
  }
}
