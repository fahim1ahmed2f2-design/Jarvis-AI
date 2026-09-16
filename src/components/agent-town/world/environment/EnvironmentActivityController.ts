/**
 * JARVIS Agent Town — Environment Activity Controller
 * Step 7: Dynamic Room States, Reactive Lighting & Environmental Event Decays
 */

import {
  RoomActivityState,
  WorkstationState,
  HubActivityLevel,
  EnvironmentEvent,
  RoomDynamicLighting
} from './types';
import { AgentTownMember, ActiveConnection } from '../../types';
import { TOWN_ROOMS } from './EnvironmentData';

export class EnvironmentActivityController {
  private roomLightings: Map<string, RoomDynamicLighting> = new Map();
  private events: EnvironmentEvent[] = [];

  constructor() {
    this.initLightingStates();
  }

  private initLightingStates() {
    for (const room of TOWN_ROOMS) {
      this.roomLightings.set(room.id, {
        roomId: room.id,
        intensity: 0.10,
        targetIntensity: 0.10,
        glowColor: room.color,
        accentColor: room.accentColor,
        activityScore: 0.05,
        activityState: 'IDLE'
      });
    }
  }

  /**
   * Evaluates live agent states and conduits, updating room activity states and lighting
   */
  public update(
    deltaTime: number,
    agents: AgentTownMember[],
    activeConnections: ActiveConnection[] = []
  ) {
    const now = Date.now();

    // 1. Decay and prune temporary visual events
    for (let i = this.events.length - 1; i >= 0; i--) {
      const evt = this.events[i];
      const elapsed = (now - evt.timestamp) / 1000;
      if (elapsed >= evt.durationSeconds) {
        this.events.splice(i, 1);
      } else {
        evt.intensity = 1.0 - (elapsed / evt.durationSeconds);
      }
    }

    // 2. Compute individual room states and scores
    let totalScore = 0;
    let activeAgentCount = 0;

    for (const room of TOWN_ROOMS) {
      const lighting = this.roomLightings.get(room.id);
      if (!lighting) continue;

      if (room.category === 'CENTRAL_HUB') continue; // Hub computed after sector aggregation

      const agent = agents.find((a) => a.id === room.agentId);
      const isCommunicating = activeConnections.some(
        (c) => c.fromAgentId === room.agentId || c.toAgentId === room.agentId
      );

      let score = 0.05;
      let state: RoomActivityState = 'IDLE';
      let targetIntensity = 0.10;

      if (agent) {
        if (agent.status === 'ERROR') {
          score = 0.6;
          state = 'ERROR';
          targetIntensity = 0.22;
        } else if (agent.status === 'COMPLETED') {
          score = 1.0;
          state = 'COMPLETED';
          targetIntensity = 0.32;
        } else if (isCommunicating) {
          score = 0.75;
          state = 'COMMUNICATING';
          targetIntensity = 0.26;
          activeAgentCount++;
        } else if (agent.status === 'WORKING' || Boolean(agent.currentTask)) {
          score = 0.85;
          state = 'WORKING' as RoomActivityState;
          targetIntensity = 0.28;
          activeAgentCount++;
        } else if (agent.status === 'THINKING') {
          score = 0.55;
          state = 'THINKING';
          targetIntensity = 0.20;
          activeAgentCount++;
        } else if (agent.status === 'WAITING') {
          score = 0.2;
          state = 'IDLE';
          targetIntensity = 0.12;
        }
      }

      totalScore += score;
      lighting.activityScore = score;
      lighting.activityState = state;
      lighting.targetIntensity = targetIntensity;

      // Smooth exponential lighting interpolation
      lighting.intensity += (lighting.targetIntensity - lighting.intensity) * Math.min(1, deltaTime * 3.5);
    }

    // 3. Compute Central Hub activity state and dynamic lighting
    const hubLighting = this.roomLightings.get('room-central-hub');
    if (hubLighting) {
      const avgScore = totalScore / 4;
      hubLighting.activityScore = avgScore;
      hubLighting.targetIntensity = 0.08 + avgScore * 0.22;
      hubLighting.intensity += (hubLighting.targetIntensity - hubLighting.intensity) * Math.min(1, deltaTime * 3.5);

      if (activeAgentCount >= 3) {
        hubLighting.activityState = 'BUSY';
      } else if (activeAgentCount >= 1) {
        hubLighting.activityState = 'ACTIVE';
      } else {
        hubLighting.activityState = 'IDLE';
      }
    }
  }

  /**
   * Derive the reactive workstation visual state for an agent station
   */
  public getWorkstationState(agentId: string, memberStatus?: string): WorkstationState {
    if (!memberStatus) return 'IDLE';
    switch (memberStatus) {
      case 'WORKING':
        return 'ACTIVE';
      case 'THINKING':
        return 'PROCESSING';
      case 'ERROR':
        return 'WARNING';
      case 'COMPLETED':
        return 'SUCCESS';
      default:
        return 'IDLE';
    }
  }

  /**
   * Get Central Hub activity level based on aggregated active workload
   */
  public getHubActivityLevel(): HubActivityLevel {
    const hubLighting = this.roomLightings.get('room-central-hub');
    const score = hubLighting ? hubLighting.activityScore : 0.05;

    if (score >= 0.70) return 'HIGH_ACTIVITY';
    if (score >= 0.40) return 'ACTIVE';
    if (score >= 0.15) return 'LOW_ACTIVITY';
    return 'CALM';
  }

  /**
   * Trigger a temporary visual event
   */
  public triggerEvent(
    type: EnvironmentEvent['type'],
    agentId: string,
    roomId: string,
    durationSeconds: number = 2.5
  ) {
    this.events.push({
      id: `evt_${Date.now()}_${Math.random()}`,
      type,
      agentId,
      roomId,
      intensity: 1.0,
      timestamp: Date.now(),
      durationSeconds
    });
  }

  public getRoomLighting(roomId: string): RoomDynamicLighting | undefined {
    return this.roomLightings.get(roomId);
  }

  public getAllRoomLightings(): Map<string, RoomDynamicLighting> {
    return this.roomLightings;
  }

  public getActiveEvents(): EnvironmentEvent[] {
    return this.events;
  }
}
