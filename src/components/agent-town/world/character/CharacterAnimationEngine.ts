/**
 * JARVIS Agent Town — Character Animation Engine
 * Step 4: Procedural Character Motion, Personality Kinematics & Living Micro-Behaviors
 */

import { AgentAnimationState } from '../types';
import { AgentVisualConfig, LimbPose, CharacterFacing } from './types';
import { MicroBehaviorSystem } from './MicroBehaviorSystem';

export class CharacterAnimationEngine {
  /**
   * Computes the complete procedural limb and prop pose for an agent given its current state
   */
  public static computePose(
    config: AgentVisualConfig,
    state: AgentAnimationState,
    elapsedTime: number,
    stateElapsedTime: number,
    facing: CharacterFacing = 'SOUTH',
    isMoving: boolean = false,
    isReducedMotion: boolean = false
  ): LimbPose {
    // Base time adjusted by per-agent personality speed and reduced motion
    const motionMultiplier = isReducedMotion ? 0.35 : 1.0;
    const time = elapsedTime * config.idleCycleSpeed * motionMultiplier;
    const breathTime = elapsedTime * config.breathingSpeed * motionMultiplier;

    switch (state) {
      case 'WALKING':
        return this.computeWalkPose(config, time, facing, isReducedMotion);

      case 'WORKING':
        return this.computeWorkPose(config, time, breathTime, stateElapsedTime, facing, isReducedMotion);

      case 'THINKING':
        return this.computeThinkPose(config, time, breathTime, stateElapsedTime, facing, isReducedMotion);

      case 'TALKING':
        return this.computeTalkPose(config, time, breathTime, stateElapsedTime, facing, isReducedMotion);

      case 'LISTENING':
        return this.computeListeningPose(config, time, breathTime, stateElapsedTime, facing, isReducedMotion);

      case 'CELEBRATING':
        return this.computeCelebratePose(config, time, facing, isReducedMotion);

      case 'INTERACTING':
        return this.computeInteractPose(config, time, breathTime, facing, isReducedMotion);

      case 'WAITING':
        return this.computeWaitingPose(config, time, breathTime, facing, isReducedMotion);

      case 'ERROR':
        return this.computeErrorPose(config, time, facing);

      case 'IDLE':
      default:
        return this.computeIdlePose(config, time, breathTime, elapsedTime, facing, isReducedMotion);
    }
  }

  /**
   * Natural, desynchronized Idle pose with organic breathing, subtle body sway, and weighted micro-actions
   */
  private static computeIdlePose(
    config: AgentVisualConfig,
    time: number,
    breathTime: number,
    rawElapsedTime: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    // 1. Natural breathing cycle
    const breath = Math.sin(breathTime * 2.0);
    const torsoHeightOffset = breath * (isReducedMotion ? 0.3 : 0.8);

    // 2. Subtle organic sway
    const sway = Math.sin(time * 0.9) * (config.idleSwayAmplitude * (isReducedMotion ? 0.01 : 0.04));

    // 3. Query Weighted Micro-Behavior System (Non-Synchronized Bounded Variations)
    const micro = MicroBehaviorSystem.getMicroBehaviorOffset(config.agentId, rawElapsedTime);

    return {
      leftArmAngle: 0.15 + sway * 0.5 + micro.armGesture * 0.5,
      rightArmAngle: -0.15 - sway * 0.5 + micro.armGesture,
      leftForearmAngle: 0.2 + breath * 0.05,
      rightForearmAngle: -0.2 - breath * 0.05 + micro.armGesture * 0.6,
      leftLegAngle: 0.05,
      rightLegAngle: -0.05,
      headTiltAngle: micro.headTilt,
      headPanAngle: micro.headPan,
      torsoPitch: 0.02,
      torsoHeightOffset: torsoHeightOffset,
      handToolHeight: micro.armGesture > 0.2 ? 4 : 0,
      propRotation: time * 0.4 + micro.propSpin,
      propFloatOffset: Math.sin(time * 1.5) * 2.0 + micro.propOffset,
      particlesIntensity: 0.2 + micro.visorGlint * 0.3,
      shadowScale: 1.0 - torsoHeightOffset * 0.03,
      facing
    };
  }

  /**
   * Working pose with personality-specific gestures:
   * Alice: holographic graph analysis; Bob: pneumatic tool operation; Carol: crystal sorting; Dave: tactical dispatch
   */
  private static computeWorkPose(
    config: AgentVisualConfig,
    time: number,
    breathTime: number,
    stateTime: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    const motionScale = isReducedMotion ? 0.4 : 1.0;
    const typeSpeed = time * 7.5;
    const leftType = Math.sin(typeSpeed) * 0.2 * motionScale;
    const rightType = Math.cos(typeSpeed + 1.2) * 0.2 * motionScale;

    const breath = Math.sin(breathTime * 2.5);

    if (config.personality === 'ANALYTICAL') {
      // ── ALICE: Empirical Data Synthesis & Holo-Screen Swiping ──
      const swipeCycle = Math.sin(time * 1.6);
      const rightArmSwipe = swipeCycle > 0.6 ? (swipeCycle - 0.6) * 1.6 : 0;

      return {
        leftArmAngle: 0.55 + leftType * 0.3,
        rightArmAngle: 0.55 + rightType * 0.3 + rightArmSwipe * 0.4,
        leftForearmAngle: 0.75 + leftType * 0.5,
        rightForearmAngle: 0.75 + rightType * 0.5 - rightArmSwipe * 0.6,
        leftLegAngle: 0.06,
        rightLegAngle: -0.06,
        headTiltAngle: 0.2 + breath * 0.04,
        headPanAngle: Math.sin(time * 1.1) * 0.2,
        torsoPitch: 0.1,
        torsoHeightOffset: -0.8 + Math.sin(typeSpeed * 0.5) * 0.3,
        handToolHeight: 4,
        propRotation: time * 1.4,
        propFloatOffset: Math.sin(time * 2.8) * 3.0,
        particlesIntensity: 0.8,
        shadowScale: 0.96,
        facing
      };
    } else if (config.personality === 'ENERGETIC') {
      // ── BOB: Technical Equipment Console & Tool Operation ──
      const wrenchTurn = Math.sin(time * 4.0) * 0.4;
      return {
        leftArmAngle: 0.7 + leftType * 0.4,
        rightArmAngle: 0.75 + wrenchTurn * 0.5,
        leftForearmAngle: 0.85 + leftType * 0.6,
        rightForearmAngle: 0.9 + wrenchTurn * 0.6,
        leftLegAngle: 0.1,
        rightLegAngle: -0.1,
        headTiltAngle: 0.28,
        headPanAngle: Math.sin(time * 1.8) * 0.15,
        torsoPitch: 0.15,
        torsoHeightOffset: -1.2 + Math.sin(time * 6.0) * 0.5,
        handToolHeight: 6,
        propRotation: time * 3.5,
        propFloatOffset: Math.sin(time * 4.0) * 3.5,
        particlesIntensity: 0.9,
        shadowScale: 0.94,
        facing
      };
    } else if (config.personality === 'SCHOLARLY') {
      // ── CAROL: Semantic Knowledge Querying & Floating Crystal Harmony ──
      const floatWave = Math.sin(time * 1.4) * 1.8;
      return {
        leftArmAngle: 0.4 + Math.sin(time * 1.8) * 0.2,
        rightArmAngle: 0.4 - Math.cos(time * 1.8) * 0.2,
        leftForearmAngle: 0.6 + leftType * 0.3,
        rightForearmAngle: 0.6 + rightType * 0.3,
        leftLegAngle: 0.05,
        rightLegAngle: -0.05,
        headTiltAngle: 0.12 + breath * 0.03,
        headPanAngle: Math.sin(time * 0.8) * 0.15,
        torsoPitch: 0.06,
        torsoHeightOffset: floatWave,
        handToolHeight: 5,
        propRotation: time * 2.2,
        propFloatOffset: Math.sin(time * 2.0) * 4.0,
        particlesIntensity: 0.85,
        shadowScale: 0.97 - (floatWave / 25),
        facing
      };
    } else {
      // ── DAVE: Strategic Command Orchestration & Holographic Globe Routing ──
      const commandSweep = Math.sin(time * 1.2) * 0.35;
      return {
        leftArmAngle: 0.45 + leftType * 0.2,
        rightArmAngle: 0.65 + commandSweep * 0.4,
        leftForearmAngle: 0.7 + leftType * 0.4,
        rightForearmAngle: 0.75 + commandSweep * 0.5,
        leftLegAngle: 0.08,
        rightLegAngle: -0.08,
        headTiltAngle: 0.15,
        headPanAngle: commandSweep * 0.6,
        torsoPitch: 0.08,
        torsoHeightOffset: -0.6,
        handToolHeight: 5,
        propRotation: time * 1.8,
        propFloatOffset: Math.sin(time * 2.2) * 3.0,
        particlesIntensity: 0.85,
        shadowScale: 0.96,
        facing
      };
    }
  }

  /**
   * Thinking pose: focused contemplation with orbital neural constellation
   */
  private static computeThinkPose(
    config: AgentVisualConfig,
    time: number,
    breathTime: number,
    stateTime: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    const breath = Math.sin(breathTime * 1.5);
    const floatY = Math.sin(time * 1.8) * (isReducedMotion ? 0.5 : 1.5);

    return {
      leftArmAngle: -0.1,
      rightArmAngle: 0.95, // Hand to chin / visor
      leftForearmAngle: 0.2,
      rightForearmAngle: -1.1,
      leftLegAngle: 0.04,
      rightLegAngle: -0.04,
      headTiltAngle: -0.15 + breath * 0.04,
      headPanAngle: Math.sin(time * 0.8) * 0.18,
      torsoPitch: -0.05,
      torsoHeightOffset: floatY,
      handToolHeight: 8,
      propRotation: time * 2.0,
      propFloatOffset: Math.sin(time * 2.5) * 4.0,
      particlesIntensity: 1.0,
      shadowScale: 1.0 - floatY * 0.05,
      facing
    };
  }

  /**
   * Talking pose: communicative gestures aligned with speech packet pulses
   */
  private static computeTalkPose(
    config: AgentVisualConfig,
    time: number,
    breathTime: number,
    stateTime: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    const talkRhythm = Math.sin(time * 5.0) * (isReducedMotion ? 0.2 : 0.35);
    const gesture = Math.sin(time * 2.2) * (isReducedMotion ? 0.1 : 0.25);

    return {
      leftArmAngle: 0.2 + gesture,
      rightArmAngle: 0.5 + talkRhythm,
      leftForearmAngle: 0.3 + gesture * 0.5,
      rightForearmAngle: 0.6 + talkRhythm * 0.6,
      leftLegAngle: 0.06,
      rightLegAngle: -0.06,
      headTiltAngle: Math.sin(time * 3.0) * 0.1,
      headPanAngle: Math.sin(time * 1.5) * 0.15,
      torsoPitch: 0.04 + talkRhythm * 0.03,
      torsoHeightOffset: Math.sin(time * 4.0) * 0.6,
      handToolHeight: 3,
      propRotation: time * 0.8,
      propFloatOffset: Math.sin(time * 2.0) * 2.5,
      particlesIntensity: 0.6,
      shadowScale: 0.98,
      facing
    };
  }

  /**
   * Listening pose: attentive posture, turned toward speaker, receiving data stream
   */
  private static computeListeningPose(
    config: AgentVisualConfig,
    time: number,
    breathTime: number,
    stateTime: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    const subtleNod = Math.sin(time * 2.0) * 0.08;

    return {
      leftArmAngle: 0.1,
      rightArmAngle: 0.15,
      leftForearmAngle: 0.35,
      rightForearmAngle: 0.4,
      leftLegAngle: 0.04,
      rightLegAngle: -0.04,
      headTiltAngle: 0.08 + subtleNod,
      headPanAngle: -0.15, // Turned toward communication conduit
      torsoPitch: 0.05, // Attentive lean
      torsoHeightOffset: Math.sin(breathTime * 1.6) * 0.5,
      handToolHeight: 2,
      propRotation: time * 0.6,
      propFloatOffset: Math.sin(time * 1.8) * 2.0,
      particlesIntensity: 0.45,
      shadowScale: 0.99,
      facing
    };
  }

  /**
   * Walking locomotion pose: natural alternating stride and opposing arm swings
   */
  private static computeWalkPose(
    config: AgentVisualConfig,
    time: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    const motionScale = isReducedMotion ? 0.5 : 1.0;
    const stride = Math.sin(time * config.walkStrideFrequency) * motionScale;
    const bob = Math.abs(Math.cos(time * config.walkStrideFrequency)) * config.walkBobHeight * motionScale;

    return {
      leftArmAngle: -stride * 0.6,
      rightArmAngle: stride * 0.6,
      leftForearmAngle: 0.3 + Math.max(0, -stride * 0.4),
      rightForearmAngle: 0.3 + Math.max(0, stride * 0.4),
      leftLegAngle: stride * 0.7,
      rightLegAngle: -stride * 0.7,
      headTiltAngle: 0.05,
      headPanAngle: 0,
      torsoPitch: 0.1,
      torsoHeightOffset: -bob,
      handToolHeight: 0,
      propRotation: time * 1.0,
      propFloatOffset: -bob * 0.5,
      particlesIntensity: 0.4,
      shadowScale: 1.0 - (bob / 12),
      facing
    };
  }

  /**
   * Celebrating pose: victorious arms raised and energetic bounce
   */
  private static computeCelebratePose(
    config: AgentVisualConfig,
    time: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    const bounce = Math.abs(Math.sin(time * 6.0)) * (isReducedMotion ? 1.5 : 4.5);
    const wave = Math.sin(time * 8.0) * 0.3;

    return {
      leftArmAngle: 1.2 + wave,
      rightArmAngle: 1.2 - wave,
      leftForearmAngle: -0.4,
      rightForearmAngle: -0.4,
      leftLegAngle: 0.15,
      rightLegAngle: -0.15,
      headTiltAngle: -0.2,
      headPanAngle: wave * 0.5,
      torsoPitch: -0.05,
      torsoHeightOffset: -bounce,
      handToolHeight: 12,
      propRotation: time * 3.0,
      propFloatOffset: -bounce - 4,
      particlesIntensity: 1.2,
      shadowScale: 0.85 + (bounce / 30),
      facing
    };
  }

  /**
   * Waiting pose: shifting weight, slight foot tap
   */
  private static computeWaitingPose(
    config: AgentVisualConfig,
    time: number,
    breathTime: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    const tap = Math.sin(time * 4.0) > 0.7 && !isReducedMotion ? 0.2 : 0;
    const weightShift = Math.sin(time * 0.6) * 0.08;

    return {
      leftArmAngle: 0.2,
      rightArmAngle: -0.2,
      leftForearmAngle: 0.4,
      rightForearmAngle: -0.4,
      leftLegAngle: weightShift,
      rightLegAngle: -weightShift + tap,
      headTiltAngle: 0.1,
      headPanAngle: Math.sin(time * 0.5) * 0.2,
      torsoPitch: 0.02,
      torsoHeightOffset: Math.sin(breathTime * 2.0) * 0.6,
      handToolHeight: 0,
      propRotation: time * 0.3,
      propFloatOffset: 0,
      particlesIntensity: 0.2,
      shadowScale: 1.0,
      facing
    };
  }

  /**
   * Error pose: glitchy posture / warning vibration
   */
  private static computeErrorPose(
    config: AgentVisualConfig,
    time: number,
    facing: CharacterFacing
  ): LimbPose {
    const glitch = (Math.random() - 0.5) * 0.15;
    return {
      leftArmAngle: 0.4 + glitch,
      rightArmAngle: -0.4 - glitch,
      leftForearmAngle: 0.5,
      rightForearmAngle: -0.5,
      leftLegAngle: 0.1,
      rightLegAngle: -0.1,
      headTiltAngle: 0.3 + glitch,
      headPanAngle: glitch * 2,
      torsoPitch: 0.15,
      torsoHeightOffset: (Math.random() - 0.5) * 1.5,
      handToolHeight: 0,
      propRotation: time * 0.5,
      propFloatOffset: 0,
      particlesIntensity: 0.9,
      shadowScale: 0.95,
      facing
    };
  }

  /**
   * Interacting pose: reaching forward to touch machine/terminal
   */
  private static computeInteractPose(
    config: AgentVisualConfig,
    time: number,
    breathTime: number,
    facing: CharacterFacing,
    isReducedMotion: boolean
  ): LimbPose {
    const pulse = Math.sin(time * 3.0) * 0.1;
    return {
      leftArmAngle: 0.75 + pulse,
      rightArmAngle: 0.75 - pulse,
      leftForearmAngle: 0.5,
      rightForearmAngle: 0.5,
      leftLegAngle: 0.1,
      rightLegAngle: -0.1,
      headTiltAngle: 0.15,
      headPanAngle: 0,
      torsoPitch: 0.15,
      torsoHeightOffset: -0.5,
      handToolHeight: 6,
      propRotation: time * 1.5,
      propFloatOffset: Math.sin(time * 2.0) * 2.0,
      particlesIntensity: 0.7,
      shadowScale: 0.98,
      facing
    };
  }

  /**
   * Blends between two poses for smooth transitions without abrupt snapping
   */
  public static lerpPose(poseA: LimbPose, poseB: LimbPose, t: number): LimbPose {
    const clampT = Math.max(0, Math.min(1, t));
    const lerp = (a: number, b: number) => a + (b - a) * clampT;

    return {
      leftArmAngle: lerp(poseA.leftArmAngle, poseB.leftArmAngle),
      rightArmAngle: lerp(poseA.rightArmAngle, poseB.rightArmAngle),
      leftForearmAngle: lerp(poseA.leftForearmAngle, poseB.leftForearmAngle),
      rightForearmAngle: lerp(poseA.rightForearmAngle, poseB.rightForearmAngle),
      leftLegAngle: lerp(poseA.leftLegAngle, poseB.leftLegAngle),
      rightLegAngle: lerp(poseA.rightLegAngle, poseB.rightLegAngle),
      headTiltAngle: lerp(poseA.headTiltAngle, poseB.headTiltAngle),
      headPanAngle: lerp(poseA.headPanAngle, poseB.headPanAngle),
      torsoPitch: lerp(poseA.torsoPitch, poseB.torsoPitch),
      torsoHeightOffset: lerp(poseA.torsoHeightOffset, poseB.torsoHeightOffset),
      handToolHeight: lerp(poseA.handToolHeight, poseB.handToolHeight),
      propRotation: lerp(poseA.propRotation, poseB.propRotation),
      propFloatOffset: lerp(poseA.propFloatOffset, poseB.propFloatOffset),
      particlesIntensity: lerp(poseA.particlesIntensity, poseB.particlesIntensity),
      shadowScale: lerp(poseA.shadowScale, poseB.shadowScale),
      facing: clampT > 0.5 ? poseB.facing : poseA.facing
    };
  }
}
