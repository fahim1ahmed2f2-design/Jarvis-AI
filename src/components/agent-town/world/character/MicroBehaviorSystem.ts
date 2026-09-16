/**
 * JARVIS Agent Town — Micro-Behavior System
 * Step 4: Non-Repetitive Idle Variations & Personality Anti-Synchronization
 */

export type MicroBehaviorType =
  | 'CHECK_SCREEN'
  | 'EXAMINE_DATA_ORB'
  | 'DEEP_FOCUS'
  | 'REFLECTIVE_PAUSE'
  | 'RECALIBRATE_TOOL'
  | 'CHECK_SYSTEM_PANEL'
  | 'BROWSE_CRYSTAL_NODES'
  | 'ORGANIZE_ARCHIVE'
  | 'SCAN_COMMAND_TABLE'
  | 'OBSERVE_SECTOR_HUBS'
  | 'NORMAL_IDLE';

export interface MicroBehaviorConfig {
  agentId: string;
  phaseOffset: number; // Anti-synchronization phase in radians
  intervalSeconds: number; // Base interval between micro-behaviors
  durationSeconds: number; // Duration of active micro-action
  weights: Array<{ behavior: MicroBehaviorType; weight: number }>;
}

export const AGENT_MICRO_CONFIGS: Record<string, MicroBehaviorConfig> = {
  'agent-alice': {
    agentId: 'agent-alice',
    phaseOffset: 0.0,
    intervalSeconds: 7.4,
    durationSeconds: 2.2,
    weights: [
      { behavior: 'CHECK_SCREEN', weight: 0.40 },
      { behavior: 'EXAMINE_DATA_ORB', weight: 0.25 },
      { behavior: 'DEEP_FOCUS', weight: 0.25 },
      { behavior: 'REFLECTIVE_PAUSE', weight: 0.10 }
    ]
  },
  'agent-bob': {
    agentId: 'agent-bob',
    phaseOffset: 1.73,
    intervalSeconds: 5.2,
    durationSeconds: 1.8,
    weights: [
      { behavior: 'RECALIBRATE_TOOL', weight: 0.35 },
      { behavior: 'CHECK_SYSTEM_PANEL', weight: 0.35 },
      { behavior: 'CHECK_SCREEN', weight: 0.20 },
      { behavior: 'DEEP_FOCUS', weight: 0.10 }
    ]
  },
  'agent-carol': {
    agentId: 'agent-carol',
    phaseOffset: 3.45,
    intervalSeconds: 8.6,
    durationSeconds: 2.6,
    weights: [
      { behavior: 'BROWSE_CRYSTAL_NODES', weight: 0.40 },
      { behavior: 'ORGANIZE_ARCHIVE', weight: 0.30 },
      { behavior: 'REFLECTIVE_PAUSE', weight: 0.20 },
      { behavior: 'DEEP_FOCUS', weight: 0.10 }
    ]
  },
  'agent-dave': {
    agentId: 'agent-dave',
    phaseOffset: 5.18,
    intervalSeconds: 6.5,
    durationSeconds: 2.4,
    weights: [
      { behavior: 'SCAN_COMMAND_TABLE', weight: 0.35 },
      { behavior: 'OBSERVE_SECTOR_HUBS', weight: 0.35 },
      { behavior: 'DEEP_FOCUS', weight: 0.20 },
      { behavior: 'CHECK_SCREEN', weight: 0.10 }
    ]
  }
};

export interface MicroPoseOffset {
  headPan: number;
  headTilt: number;
  armGesture: number;
  propSpin: number;
  propOffset: number;
  visorGlint: number;
  activeBehavior: MicroBehaviorType;
}

export class MicroBehaviorSystem {
  /**
   * Evaluates the active micro-behavior and returns procedural pose offsets
   */
  public static getMicroBehaviorOffset(
    agentId: string,
    elapsedTime: number
  ): MicroPoseOffset {
    const config = AGENT_MICRO_CONFIGS[agentId] || AGENT_MICRO_CONFIGS['agent-alice'];
    const adjustedTime = elapsedTime + config.phaseOffset;

    const cycleTime = config.intervalSeconds + config.durationSeconds;
    const currentCycleIndex = Math.floor(adjustedTime / cycleTime);
    const progressInCycle = (adjustedTime % cycleTime) / cycleTime;
    const activeProgress = (adjustedTime % cycleTime) / config.durationSeconds;

    // Default neutral idle offset
    const defaultOffset: MicroPoseOffset = {
      headPan: 0,
      headTilt: 0,
      armGesture: 0,
      propSpin: 0,
      propOffset: 0,
      visorGlint: 0,
      activeBehavior: 'NORMAL_IDLE'
    };

    // If outside the active duration window, return normal idle
    if (activeProgress > 1.0) {
      return defaultOffset;
    }

    // Determine the deterministic behavior for this cycle using pseudo-random hashing
    const behavior = this.selectBehavior(config, currentCycleIndex);

    // Smooth bell curve envelope (0 -> 1 -> 0)
    const envelope = Math.sin(activeProgress * Math.PI);

    switch (behavior) {
      case 'CHECK_SCREEN':
        // Head pans left toward holo-screen and tilts slightly down
        return {
          headPan: -0.32 * envelope,
          headTilt: 0.12 * envelope,
          armGesture: 0.15 * envelope,
          propSpin: 1.2 * envelope,
          propOffset: 1.5 * envelope,
          visorGlint: 1.0 * envelope,
          activeBehavior: behavior
        };

      case 'EXAMINE_DATA_ORB':
        // Alice looks up at floating data node, raising hand slightly
        return {
          headPan: 0.22 * envelope,
          headTilt: -0.25 * envelope,
          armGesture: 0.45 * envelope,
          propSpin: 2.5 * envelope,
          propOffset: 3.5 * envelope,
          visorGlint: 1.2 * envelope,
          activeBehavior: behavior
        };

      case 'DEEP_FOCUS':
        // Still posture with intense visor concentration
        return {
          headPan: 0,
          headTilt: -0.08 * envelope,
          armGesture: 0,
          propSpin: 0.5 * envelope,
          propOffset: 0.5 * envelope,
          visorGlint: 1.5 * envelope,
          activeBehavior: behavior
        };

      case 'REFLECTIVE_PAUSE':
        // Slow head turn glance across the headquarters
        return {
          headPan: Math.sin(activeProgress * Math.PI * 2) * 0.28,
          headTilt: 0.05 * envelope,
          armGesture: -0.1 * envelope,
          propSpin: 0.8 * envelope,
          propOffset: 1.0 * envelope,
          visorGlint: 0.8 * envelope,
          activeBehavior: behavior
        };

      case 'RECALIBRATE_TOOL':
        // Bob turns magnetic wrench in hands
        return {
          headPan: 0.15 * envelope,
          headTilt: 0.22 * envelope,
          armGesture: 0.65 * envelope,
          propSpin: 5.0 * envelope,
          propOffset: 2.0 * envelope,
          visorGlint: 1.0 * envelope,
          activeBehavior: behavior
        };

      case 'CHECK_SYSTEM_PANEL':
        // Bob turns toward operations console
        return {
          headPan: 0.35 * envelope,
          headTilt: 0.18 * envelope,
          armGesture: 0.3 * envelope,
          propSpin: 1.5 * envelope,
          propOffset: 1.5 * envelope,
          visorGlint: 1.1 * envelope,
          activeBehavior: behavior
        };

      case 'BROWSE_CRYSTAL_NODES':
        // Carol re-arranges floating memory crystal shards
        return {
          headPan: -0.2 * envelope,
          headTilt: -0.12 * envelope,
          armGesture: 0.55 * envelope,
          propSpin: 3.8 * envelope,
          propOffset: 4.0 * envelope,
          visorGlint: 1.3 * envelope,
          activeBehavior: behavior
        };

      case 'ORGANIZE_ARCHIVE':
        // Carol inspects tiered knowledge shelves
        return {
          headPan: 0.3 * envelope,
          headTilt: 0.1 * envelope,
          armGesture: 0.35 * envelope,
          propSpin: 2.0 * envelope,
          propOffset: 2.0 * envelope,
          visorGlint: 0.9 * envelope,
          activeBehavior: behavior
        };

      case 'SCAN_COMMAND_TABLE':
        // Dave sweeps eyes across tactical command table
        return {
          headPan: Math.sin(activeProgress * Math.PI * 2) * 0.32,
          headTilt: 0.2 * envelope,
          armGesture: 0.35 * envelope,
          propSpin: 2.2 * envelope,
          propOffset: 2.5 * envelope,
          visorGlint: 1.2 * envelope,
          activeBehavior: behavior
        };

      case 'OBSERVE_SECTOR_HUBS':
        // Dave looks out toward the other agent sectors
        return {
          headPan: -0.38 * envelope,
          headTilt: -0.05 * envelope,
          armGesture: 0.2 * envelope,
          propSpin: 1.5 * envelope,
          propOffset: 1.8 * envelope,
          visorGlint: 1.1 * envelope,
          activeBehavior: behavior
        };

      default:
        return defaultOffset;
    }
  }

  /**
   * Deterministic weighted selector based on pseudo-random hash of cycle index
   */
  private static selectBehavior(config: MicroBehaviorConfig, cycleIndex: number): MicroBehaviorType {
    // Simple fast linear congruential pseudo-random generator
    const hash = ((cycleIndex * 9301 + 49297) % 233280) / 233280;

    let cumulative = 0;
    for (const item of config.weights) {
      cumulative += item.weight;
      if (hash <= cumulative) {
        return item.behavior;
      }
    }
    return config.weights[0]?.behavior || 'NORMAL_IDLE';
  }
}
