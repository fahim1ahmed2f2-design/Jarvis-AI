/**
 * JARVIS Agent Town — Animated Agent Renderer
 * Step 2: Multi-Part Vector Canvas Character Rendering System
 */

import { AgentVisualConfig, LimbPose } from './types';
import { getAgentVisualConfig } from './AgentVisualConfigs';
import { CharacterAnimationEngine } from './CharacterAnimationEngine';
import { AgentAnimationState } from '../types';

export class AnimatedAgentRenderer {
  /**
   * Renders a fully articulated, animated agent character onto the Canvas 2D context
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    agentId: string,
    state: AgentAnimationState,
    previousState: AgentAnimationState,
    stateStartTime: number,
    elapsedTime: number,
    screenX: number,
    screenY: number,
    zoom: number,
    isSelected: boolean,
    isHovered: boolean,
    taskTitle?: string | null
  ) {
    const config = getAgentVisualConfig(agentId);
    const stateElapsedTime = (Date.now() - stateStartTime) / 1000;

    // 1. Compute Current and Blend Poses
    const currentPose = CharacterAnimationEngine.computePose(
      config,
      state,
      elapsedTime,
      stateElapsedTime,
      'SOUTH',
      state === 'WALKING'
    );

    // If recently transitioned states, apply smooth pose blending (0.3s blend window)
    let finalPose = currentPose;
    if (state !== previousState && stateElapsedTime < 0.3) {
      const prevPose = CharacterAnimationEngine.computePose(
        config,
        previousState,
        elapsedTime,
        10.0,
        'SOUTH',
        previousState === 'WALKING'
      );
      const blendFactor = stateElapsedTime / 0.3;
      finalPose = CharacterAnimationEngine.lerpPose(prevPose, currentPose, blendFactor);
    }

    const scale = config.baseScale * zoom;

    ctx.save();
    ctx.translate(screenX, screenY);

    // ── PASS 1: GROUND CONTACT SHADOW ──
    this.drawGroundShadow(ctx, config, finalPose, scale);

    // ── PASS 2: SELECTION & HOVER PEDESTAL AURA ──
    this.drawPedestalAura(ctx, config, state, isSelected, isHovered, finalPose, scale);

    // ── PASS 3: ARTICULATED CYBERNETIC CHARACTER BODY ──
    ctx.save();
    ctx.translate(0, finalPose.torsoHeightOffset * scale);

    // Legs & Stance
    this.drawLegs(ctx, config, finalPose, scale);

    // Torso, Chestplate & Power Core
    this.drawTorso(ctx, config, finalPose, scale, elapsedTime);

    // Articulated Arms & Hands
    this.drawArms(ctx, config, finalPose, scale);

    // Cyber Head & Illuminated Visor
    this.drawHead(ctx, config, finalPose, scale, elapsedTime);

    // Specialized Animated Character Props (Tablet, Wrench, Crystals, Globe)
    this.drawSpecializedProp(ctx, config, finalPose, scale, elapsedTime);

    ctx.restore();

    // ── PASS 4: STATE-SPECIFIC PARTICLES & EFFECTS (Thinking, Talking, Working) ──
    this.drawStateEffects(ctx, config, state, finalPose, scale, elapsedTime);

    // ── PASS 5: NAMEPLATE & STATUS BADGE ──
    this.drawNameplate(ctx, config, state, isSelected, isHovered, scale, taskTitle);

    ctx.restore();
  }

  /**
   * Ground contact shadow: physically grounds character to the floor
   */
  private static drawGroundShadow(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    pose: LimbPose,
    scale: number
  ) {
    const rx = 16 * scale * pose.shadowScale;
    const ry = 8 * scale * pose.shadowScale;

    ctx.beginPath();
    ctx.ellipse(0, 10 * scale, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 6, 18, 0.75)';
    ctx.fill();

    // Subtle colored edge glow under feet
    ctx.beginPath();
    ctx.ellipse(0, 10 * scale, rx * 0.9, ry * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = config.palette.shadow;
    ctx.fill();
  }

  /**
   * Holographic pedestal and selection highlight ring
   */
  private static drawPedestalAura(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    state: AgentAnimationState,
    isSelected: boolean,
    isHovered: boolean,
    pose: LimbPose,
    scale: number
  ) {
    const r = 22 * scale;
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.ellipse(0, 10 * scale, r * 1.2, r * 0.6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? config.palette.primary : config.palette.accent;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.setLineDash(isSelected ? [6, 4] : [4, 4]);
      ctx.shadowColor = config.palette.primary;
      ctx.shadowBlur = 12 * scale;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Selection Corner Brackets
      if (isSelected) {
        ctx.fillStyle = config.palette.primary;
        const b = 28 * scale;
        const bs = 4 * scale;
        // Top-left
        ctx.fillRect(-b, 0, bs, 1.5);
        ctx.fillRect(-b, 0, 1.5, bs);
        // Top-right
        ctx.fillRect(b - bs, 0, bs, 1.5);
        ctx.fillRect(b - 1.5, 0, 1.5, bs);
      }
    }
  }

  /**
   * Legs and Cybernetic Boots
   */
  private static drawLegs(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    pose: LimbPose,
    scale: number
  ) {
    const legWidth = 4 * scale;
    const legLength = 12 * scale;
    const hipY = 2 * scale;

    // Left Leg
    ctx.save();
    ctx.translate(-5 * scale, hipY);
    ctx.rotate(pose.leftLegAngle);
    ctx.fillStyle = config.palette.armor;
    ctx.fillRect(-legWidth / 2, 0, legWidth, legLength);
    // Boot
    ctx.fillStyle = config.palette.secondary;
    ctx.fillRect(-legWidth / 2 - 1 * scale, legLength - 3 * scale, legWidth + 2 * scale, 4 * scale);
    ctx.restore();

    // Right Leg
    ctx.save();
    ctx.translate(5 * scale, hipY);
    ctx.rotate(pose.rightLegAngle);
    ctx.fillStyle = config.palette.armor;
    ctx.fillRect(-legWidth / 2, 0, legWidth, legLength);
    // Boot
    ctx.fillStyle = config.palette.secondary;
    ctx.fillRect(-legWidth / 2 - 1 * scale, legLength - 3 * scale, legWidth + 2 * scale, 4 * scale);
    ctx.restore();
  }

  /**
   * Torso, Armor Plating, and Arc Power Core
   */
  private static drawTorso(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    pose: LimbPose,
    scale: number,
    elapsedTime: number
  ) {
    const torsoW = 14 * scale;
    const torsoH = 16 * scale;

    ctx.save();
    ctx.translate(0, -torsoH);
    ctx.rotate(pose.torsoPitch);

    // Torso Base Armor
    ctx.beginPath();
    ctx.roundRect(-torsoW / 2, 0, torsoW, torsoH, 3 * scale);
    ctx.fillStyle = config.palette.armor;
    ctx.fill();
    ctx.strokeStyle = `${config.palette.primary}66`;
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // Shoulder Armor Pads
    ctx.fillStyle = config.palette.secondary;
    ctx.fillRect(-torsoW / 2 - 3 * scale, 0, 4 * scale, 5 * scale);
    ctx.fillRect(torsoW / 2 - 1 * scale, 0, 4 * scale, 5 * scale);

    // Chest Arc Power Core
    const pulse = Math.sin(elapsedTime * 4.0) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(0, torsoH * 0.45, 2.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = config.palette.primary;
    ctx.shadowBlur = 8 * scale * pulse;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Subtle Chest Armor Seam Lines
    ctx.beginPath();
    ctx.moveTo(-torsoW / 2 + 2 * scale, torsoH * 0.7);
    ctx.lineTo(0, torsoH * 0.85);
    ctx.lineTo(torsoW / 2 - 2 * scale, torsoH * 0.7);
    ctx.strokeStyle = `${config.palette.primary}88`;
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Articulated Cybernetic Arms & Hands
   */
  private static drawArms(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    pose: LimbPose,
    scale: number
  ) {
    const armW = 3.5 * scale;
    const upperArmL = 8 * scale;
    const foreArmL = 8 * scale;
    const shoulderY = -15 * scale;

    // ── Left Arm ──
    ctx.save();
    ctx.translate(-8 * scale, shoulderY);
    ctx.rotate(pose.leftArmAngle);

    // Upper Arm
    ctx.fillStyle = config.palette.armor;
    ctx.fillRect(-armW / 2, 0, armW, upperArmL);

    // Forearm
    ctx.translate(0, upperArmL);
    ctx.rotate(pose.leftForearmAngle);
    ctx.fillStyle = config.palette.secondary;
    ctx.fillRect(-armW / 2, 0, armW, foreArmL);

    // Hand
    ctx.fillStyle = config.palette.primary;
    ctx.fillRect(-armW / 2 + 0.5 * scale, foreArmL, armW - 1 * scale, 2.5 * scale);
    ctx.restore();

    // ── Right Arm ──
    ctx.save();
    ctx.translate(8 * scale, shoulderY);
    ctx.rotate(pose.rightArmAngle);

    // Upper Arm
    ctx.fillStyle = config.palette.armor;
    ctx.fillRect(-armW / 2, 0, armW, upperArmL);

    // Forearm
    ctx.translate(0, upperArmL);
    ctx.rotate(pose.rightForearmAngle);
    ctx.fillStyle = config.palette.secondary;
    ctx.fillRect(-armW / 2, 0, armW, foreArmL);

    // Hand
    ctx.fillStyle = config.palette.primary;
    ctx.fillRect(-armW / 2 + 0.5 * scale, foreArmL, armW - 1 * scale, 2.5 * scale);
    ctx.restore();
  }

  /**
   * Cybernetic Head, Helmet, and Illuminated Visor
   */
  private static drawHead(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    pose: LimbPose,
    scale: number,
    elapsedTime: number
  ) {
    const headRadius = 7.5 * scale;
    const headCenterY = -23 * scale;

    ctx.save();
    ctx.translate(0, headCenterY);
    ctx.rotate(pose.headTiltAngle);
    ctx.translate(pose.headPanAngle * 4 * scale, 0);

    // 1. Head Base Helmet
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = config.palette.armor;
    ctx.fill();
    ctx.strokeStyle = config.palette.secondary;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // 2. Specialized Helmet Accents based on HeadStyle
    if (config.headStyle === 'HOODED_MANTLE') {
      // Carol: Scholar Cyber Mantle / Cowl
      ctx.beginPath();
      ctx.moveTo(-headRadius - 2 * scale, -headRadius);
      ctx.lineTo(0, -headRadius - 5 * scale);
      ctx.lineTo(headRadius + 2 * scale, -headRadius);
      ctx.lineTo(headRadius + 3 * scale, headRadius);
      ctx.lineTo(-headRadius - 3 * scale, headRadius);
      ctx.closePath();
      ctx.fillStyle = config.palette.secondary;
      ctx.fill();
    } else if (config.headStyle === 'COMMAND_OFFICER') {
      // Dave: Tactical Officer Crest
      ctx.beginPath();
      ctx.moveTo(-4 * scale, -headRadius - 1 * scale);
      ctx.lineTo(0, -headRadius - 6 * scale);
      ctx.lineTo(4 * scale, -headRadius - 1 * scale);
      ctx.fillStyle = config.palette.primary;
      ctx.fill();
    } else if (config.headStyle === 'TECH_VISOR') {
      // Bob: Utility Dual Side Antenna Sensors
      ctx.fillStyle = config.palette.accent;
      ctx.fillRect(-headRadius - 3 * scale, -4 * scale, 2.5 * scale, 8 * scale);
      ctx.fillRect(headRadius + 0.5 * scale, -4 * scale, 2.5 * scale, 8 * scale);
    }

    // 3. Illuminated Futuristic Eye Visor
    const visorW = 10 * scale;
    const visorH = 3.5 * scale;
    ctx.beginPath();
    ctx.roundRect(-visorW / 2, -1 * scale, visorW, visorH, 1.5 * scale);
    ctx.fillStyle = config.palette.visor;
    ctx.shadowColor = config.palette.primary;
    ctx.shadowBlur = 10 * scale;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing Visor Glint
    ctx.fillStyle = '#ffffff';
    const glintOffset = Math.sin(elapsedTime * 2.0) * 3 * scale;
    ctx.fillRect(-1 * scale + glintOffset, -0.5 * scale, 2 * scale, 2 * scale);

    ctx.restore();
  }

  /**
   * Specialized Animated Props (Alice: Holo-Tablet, Bob: Wrench, Carol: Crystals, Dave: Command Globe)
   */
  private static drawSpecializedProp(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    pose: LimbPose,
    scale: number,
    elapsedTime: number
  ) {
    const prop = config.prop;
    if (prop.type === 'NONE') return;

    ctx.save();
    ctx.translate(14 * scale, -10 * scale + pose.propFloatOffset * scale);

    if (prop.type === 'HOLO_TABLET') {
      // ── ALICE: HOLOGRAPHIC RESEARCH TABLET ──
      const tw = 16 * scale;
      const th = 11 * scale;
      ctx.beginPath();
      ctx.roundRect(-tw / 2, -th / 2, tw, th, 2 * scale);
      ctx.fillStyle = 'rgba(2, 20, 48, 0.85)';
      ctx.fill();
      ctx.strokeStyle = config.palette.primary;
      ctx.lineWidth = 1 * scale;
      ctx.shadowColor = config.palette.primary;
      ctx.shadowBlur = 8 * scale;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Scrolling Research Graph Waveform
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1 * scale;
      for (let i = 0; i < 4; i++) {
        const lx = -tw / 2 + 3 * scale + i * 3 * scale;
        const ly = Math.sin(elapsedTime * 4.0 + i) * 2 * scale;
        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    } else if (prop.type === 'TOOL_WRENCH') {
      // ── BOB: MAGNETIC PLASMA SPANNER ──
      ctx.rotate(pose.propRotation * 0.5);
      const wl = 14 * scale;
      ctx.fillStyle = config.palette.secondary;
      ctx.fillRect(-2 * scale, -wl / 2, 4 * scale, wl);
      // Tool Head
      ctx.beginPath();
      ctx.arc(0, -wl / 2, 4 * scale, 0, Math.PI * 2);
      ctx.fillStyle = config.palette.primary;
      ctx.shadowColor = config.palette.primary;
      ctx.shadowBlur = 6 * scale;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (prop.type === 'MEMORY_CRYSTALS') {
      // ── CAROL: ORBITING EPISODIC KNOWLEDGE CRYSTALS ──
      for (let c = 0; c < 3; c++) {
        const angle = pose.propRotation + (c * (Math.PI * 2)) / 3;
        const cx = Math.cos(angle) * 10 * scale;
        const cy = Math.sin(angle) * 5 * scale;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 4 * scale);
        ctx.lineTo(cx + 3 * scale, cy);
        ctx.lineTo(cx, cy + 4 * scale);
        ctx.lineTo(cx - 3 * scale, cy);
        ctx.closePath();
        ctx.fillStyle = config.palette.primary;
        ctx.shadowColor = config.palette.primary;
        ctx.shadowBlur = 8 * scale;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else if (prop.type === 'COMMAND_GLOBE') {
      // ── DAVE: TACTICAL COMMAND HOLO-GLOBE ──
      const gr = 8 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, gr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 30, 20, 0.7)';
      ctx.fill();
      ctx.strokeStyle = config.palette.primary;
      ctx.lineWidth = 1 * scale;
      ctx.shadowColor = config.palette.primary;
      ctx.shadowBlur = 8 * scale;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Rotating Radar Ring
      ctx.beginPath();
      ctx.ellipse(0, 0, gr, gr * 0.4, pose.propRotation, 0, Math.PI * 2);
      ctx.strokeStyle = '#34d399';
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * State-Specific Visual Storytelling Effects (Thinking, Talking, Listening, Working, Celebrating, Error)
   */
  private static drawStateEffects(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    state: AgentAnimationState,
    pose: LimbPose,
    scale: number,
    elapsedTime: number
  ) {
    if (state === 'THINKING') {
      // Orbiting Neural Constellation Ring around Head
      ctx.save();
      ctx.translate(0, -25 * scale);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 * scale, 6 * scale, elapsedTime * 2.0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 232, 255, 0.8)';
      ctx.lineWidth = 1.5 * scale;
      ctx.setLineDash([3, 3]);
      ctx.shadowColor = '#00e8ff';
      ctx.shadowBlur = 10 * scale;
      ctx.stroke();
      ctx.setLineDash([]);

      // Sparkles
      for (let s = 0; s < 3; s++) {
        const sa = elapsedTime * 3.0 + (s * Math.PI * 2) / 3;
        const sx = Math.cos(sa) * 16 * scale;
        const sy = Math.sin(sa) * 6 * scale;
        ctx.beginPath();
        ctx.arc(sx, sy, 2 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.restore();
    } else if (state === 'TALKING') {
      // Speech Communication Wave Pulse
      ctx.save();
      ctx.translate(12 * scale, -28 * scale);
      for (let w = 0; w < 3; w++) {
        const waveProgress = (elapsedTime * 2.5 + w * 0.33) % 1;
        const wr = waveProgress * 12 * scale;
        const alpha = 1 - waveProgress;
        ctx.beginPath();
        ctx.arc(0, 0, wr, -Math.PI / 3, Math.PI / 3);
        ctx.strokeStyle = config.palette.primary;
        ctx.globalAlpha = alpha * 0.8;
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
      }
      ctx.restore();
    } else if (state === 'LISTENING') {
      // Attentive Listening Receptive Halos
      ctx.save();
      ctx.translate(-10 * scale, -28 * scale);
      for (let w = 0; w < 2; w++) {
        const waveProgress = (elapsedTime * 2.0 + w * 0.5) % 1;
        const wr = (1 - waveProgress) * 10 * scale;
        const alpha = waveProgress;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1, wr), Math.PI * 0.7, Math.PI * 1.3);
        ctx.strokeStyle = config.palette.accent;
        ctx.globalAlpha = alpha * 0.7;
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
      }
      ctx.restore();
    } else if (state === 'WORKING') {
      // Active Workstation Energy Pulse & Data Sparks
      ctx.save();
      ctx.translate(0, 5 * scale);
      const wp = (elapsedTime * 3.0) % 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, (14 + wp * 8) * scale, (7 + wp * 4) * scale, 0, 0, Math.PI * 2);
      ctx.strokeStyle = config.palette.primary;
      ctx.globalAlpha = (1 - wp) * 0.6;
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.restore();
    } else if (state === 'CELEBRATING') {
      // Victory Gold / Cyan Starburst Ring
      ctx.save();
      ctx.translate(0, -15 * scale);
      const celebPulse = (elapsedTime * 4.0) % 1;
      ctx.beginPath();
      ctx.arc(0, 0, (10 + celebPulse * 16) * scale, 0, Math.PI * 2);
      ctx.strokeStyle = '#34d399';
      ctx.globalAlpha = 1 - celebPulse;
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      ctx.restore();
    } else if (state === 'ERROR') {
      // Warning Alert Chevron
      ctx.save();
      ctx.translate(0, -38 * scale);
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 4 * scale);
      ctx.lineTo(0, -6 * scale);
      ctx.lineTo(6 * scale, 4 * scale);
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10 * scale;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  /**
   * Accessible Nameplate and Status Pill
   */
  private static drawNameplate(
    ctx: CanvasRenderingContext2D,
    config: AgentVisualConfig,
    state: AgentAnimationState,
    isSelected: boolean,
    isHovered: boolean,
    scale: number,
    taskTitle?: string | null
  ) {
    ctx.save();
    ctx.translate(0, -36 * scale);

    // Name Text
    const name = config.displayName.toUpperCase();
    ctx.font = `bold ${Math.max(10, 11 * scale)}px 'Orbitron', sans-serif`;
    const textW = ctx.measureText(name).width;
    const badgeW = Math.max(textW + 16 * scale, 56 * scale);
    const badgeH = 16 * scale;

    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 3.5 * scale);
    ctx.fillStyle = isSelected
      ? 'rgba(0, 232, 255, 0.95)'
      : isHovered
      ? 'rgba(168, 85, 247, 0.9)'
      : 'rgba(2, 6, 22, 0.9)';
    ctx.fill();
    ctx.strokeStyle = config.palette.primary;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = isSelected ? '#020612' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 0, 0);

    // State Pill
    ctx.font = `${Math.max(7.5, 8 * scale)}px 'Share Tech Mono', monospace`;
    const stateText = state;
    const stateW = ctx.measureText(stateText).width + 8 * scale;
    ctx.beginPath();
    ctx.roundRect(-stateW / 2, 11 * scale, stateW, 11 * scale, 2.5 * scale);
    ctx.fillStyle = state === 'WORKING'
      ? 'rgba(245, 165, 36, 0.3)'
      : state === 'THINKING'
      ? 'rgba(0, 232, 255, 0.3)'
      : state === 'TALKING'
      ? 'rgba(168, 85, 247, 0.3)'
      : 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = state === 'WORKING'
      ? '#f5a524'
      : state === 'THINKING'
      ? '#00e8ff'
      : state === 'TALKING'
      ? '#a855f7'
      : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = state === 'WORKING'
      ? '#f5a524'
      : state === 'THINKING'
      ? '#00e8ff'
      : state === 'TALKING'
      ? '#a855f7'
      : 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(stateText, 0, 16.5 * scale);

    // Task Speech Bubble (if actively working)
    if (taskTitle && (state === 'WORKING' || state === 'THINKING')) {
      const shortTask = taskTitle.length > 22 ? taskTitle.substring(0, 20) + '...' : taskTitle;
      ctx.font = `${Math.max(7.5, 8 * scale)}px 'Rajdhani', sans-serif`;
      const taskW = ctx.measureText(shortTask).width + 10 * scale;
      ctx.beginPath();
      ctx.roundRect(-taskW / 2, -20 * scale, taskW, 13 * scale, 3 * scale);
      ctx.fillStyle = 'rgba(245, 165, 36, 0.95)';
      ctx.fill();
      ctx.fillStyle = '#020612';
      ctx.fillText(shortTask, 0, -13.5 * scale);
    }

    ctx.restore();
  }
}
