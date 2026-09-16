/**
 * JARVIS Agent Town — Agent Social Controller
 * Step 11: Proximity Awareness, 15s Pair Cooldowns, Room Occupancy & Task Milestone Reactions
 */

import { WorldPosition, AgentWorldState } from '../types';
import { SocialState, SocialEvent, SocialReaction, RoomOccupancyState } from './types';
import { WorldCoordinateSystem } from '../WorldCoordinateSystem';
import { TOWN_ROOMS } from '../environment/EnvironmentData';

export const PROXIMITY_THRESHOLD_PX = 85;
export const SOCIAL_COOLDOWN_MS = 15000;
export const REACTION_DURATION_MS = 1400;

export class AgentSocialController {
  private socialStates: Map<string, SocialState> = new Map();
  private pairCooldowns: Map<string, number> = new Map();
  private activeReactions: Map<string, SocialReaction> = new Map();
  private roomOccupancies: Map<string, RoomOccupancyState> = new Map();
  private events: SocialEvent[] = [];

  constructor() {
    this.initDefaultStates();
  }

  private initDefaultStates() {
    for (const id of ['agent-alice', 'agent-bob', 'agent-carol', 'agent-dave']) {
      this.socialStates.set(id, 'IDLE');
    }

    for (const room of TOWN_ROOMS) {
      this.roomOccupancies.set(room.id, {
        roomId: room.id,
        occupantAgentIds: []
      });
    }
  }

  /**
   * Main social controller tick (proximity checks & reaction cleanup)
   */
  public update(deltaTime: number, agentStates: AgentWorldState[]) {
    const now = Date.now();

    // 1. Clean up expired reactions
    for (const [agentId, reaction] of Array.from(this.activeReactions.entries())) {
      if (now - reaction.startTime > reaction.durationMs) {
        this.activeReactions.delete(agentId);
      }
    }

    // 2. Proximity Detection across agent pairs
    const count = agentStates.length;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const a = agentStates[i];
        const b = agentStates[j];

        const dist = WorldCoordinateSystem.distance2D(a.currentPosition, b.currentPosition);
        if (dist <= PROXIMITY_THRESHOLD_PX) {
          this.handleProximityEncounter(a, b, now);
        }
      }
    }

    // 3. Update Room Occupancy
    this.updateRoomOccupancy(agentStates, now);
  }

  /**
   * Handle two agents crossing paths in proximity
   */
  private handleProximityEncounter(a: AgentWorldState, b: AgentWorldState, now: number) {
    const pairKey = [a.agentId, b.agentId].sort().join(':');
    const lastTime = this.pairCooldowns.get(pairKey) || 0;

    if (now - lastTime < SOCIAL_COOLDOWN_MS) {
      return; // Under cooldown to prevent loop chatter
    }

    // Do not trigger ambient social reactions if either is doing an urgent task
    if (a.animationState === 'WORKING' && b.animationState === 'WORKING') {
      return;
    }

    // Trigger subtle acknowledgement
    this.pairCooldowns.set(pairKey, now);

    const angleAB = Math.atan2(b.currentPosition.y - a.currentPosition.y, b.currentPosition.x - a.currentPosition.x);
    const angleBA = Math.atan2(a.currentPosition.y - b.currentPosition.y, a.currentPosition.x - b.currentPosition.x);

    if (!this.activeReactions.has(a.agentId)) {
      this.activeReactions.set(a.agentId, {
        agentId: a.agentId,
        targetAgentId: b.agentId,
        type: 'HEAD_TURN',
        durationMs: REACTION_DURATION_MS,
        startTime: now,
        targetAngle: angleAB
      });
    }

    if (!this.activeReactions.has(b.agentId)) {
      this.activeReactions.set(b.agentId, {
        agentId: b.agentId,
        targetAgentId: a.agentId,
        type: 'NOD',
        durationMs: REACTION_DURATION_MS,
        startTime: now,
        targetAngle: angleBA
      });
    }

    this.logEvent({
      id: `soc_${now}_${a.agentId}_${b.agentId}`,
      timestamp: now,
      type: 'AGENT_ACKNOWLEDGED',
      initiatorAgentId: a.agentId,
      targetAgentId: b.agentId,
      description: `${a.name} and ${b.name} acknowledged each other.`
    });
  }

  /**
   * Update room occupancy records
   */
  private updateRoomOccupancy(agentStates: AgentWorldState[], now: number) {
    for (const room of TOWN_ROOMS) {
      const occupants: string[] = [];
      for (const agent of agentStates) {
        const p = agent.currentPosition;
        if (
          p.x >= room.bounds.minX &&
          p.x <= room.bounds.maxX &&
          p.y >= room.bounds.minY &&
          p.y <= room.bounds.maxY
        ) {
          occupants.push(agent.agentId);
        }
      }

      const prev = this.roomOccupancies.get(room.id);
      if (prev) {
        const newArrivals = occupants.filter((id) => !prev.occupantAgentIds.includes(id));
        if (newArrivals.length > 0) {
          prev.lastEnteredAgentId = newArrivals[0];
          prev.lastEnteredTimestamp = now;
        }
        prev.occupantAgentIds = occupants;
      }
    }
  }

  /**
   * Trigger social reaction when a task completes
   */
  public onTaskCompleted(agentId: string, completedPosition: WorldPosition, allAgents: AgentWorldState[]) {
    const now = Date.now();
    for (const other of allAgents) {
      if (other.agentId !== agentId) {
        const dist = WorldCoordinateSystem.distance2D(completedPosition, other.currentPosition);
        if (dist <= 160) {
          const angle = Math.atan2(
            completedPosition.y - other.currentPosition.y,
            completedPosition.x - other.currentPosition.x
          );
          this.activeReactions.set(other.agentId, {
            agentId: other.agentId,
            targetAgentId: agentId,
            type: 'OBSERVE',
            durationMs: 1800,
            startTime: now,
            targetAngle: angle
          });
        }
      }
    }
  }

  /**
   * Trigger social reaction when a task encounters an error
   */
  public onTaskError(agentId: string, errorPosition: WorldPosition, allAgents: AgentWorldState[]) {
    const now = Date.now();
    const dave = allAgents.find((a) => a.agentId === 'agent-dave');
    if (dave && dave.agentId !== agentId) {
      const angle = Math.atan2(
        errorPosition.y - dave.currentPosition.y,
        errorPosition.x - dave.currentPosition.x
      );
      this.activeReactions.set(dave.agentId, {
        agentId: dave.agentId,
        targetAgentId: agentId,
        type: 'OBSERVE',
        durationMs: 2000,
        startTime: now,
        targetAngle: angle
      });
    }
  }

  public getActiveReaction(agentId: string): SocialReaction | undefined {
    return this.activeReactions.get(agentId);
  }

  public getSocialState(agentId: string): SocialState {
    return this.socialStates.get(agentId) || 'IDLE';
  }

  public setSocialState(agentId: string, state: SocialState) {
    this.socialStates.set(agentId, state);
  }

  private logEvent(event: SocialEvent) {
    this.events.unshift(event);
    if (this.events.length > 25) this.events.pop();
  }
}
