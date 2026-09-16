/**
 * JARVIS Agent Town — Agent Movement Controller
 * Step 5: Multi-Agent Locomotion, Waypoint Traversal & Dynamic Facing
 */

import { WorldPosition } from '../types';
import { CharacterFacing } from '../character/types';
import { MovementRequest, AgentNavState } from './types';
import { PathfindingEngine } from './PathfindingEngine';
import { WorldCoordinateSystem } from '../WorldCoordinateSystem';

export class AgentMovementController {
  private navStates: Map<string, AgentNavState> = new Map();

  // Agent specific movement walk speeds (World units / second)
  private static readonly AGENT_SPEEDS: Record<string, number> = {
    'agent-alice': 95,
    'agent-bob': 115,
    'agent-carol': 90,
    'agent-dave': 100
  };

  constructor() {
    this.initNavStates();
  }

  private initNavStates() {
    const agentIds = ['agent-alice', 'agent-bob', 'agent-carol', 'agent-dave'];
    for (const id of agentIds) {
      this.navStates.set(id, {
        agentId: id,
        currentPath: [],
        currentWaypointIndex: 0,
        movementSpeed: AgentMovementController.AGENT_SPEEDS[id] || 95,
        headingAngle: 0,
        targetFacing: 'SOUTH',
        isPaused: false,
        onArrivalState: 'IDLE'
      });
    }
  }

  /**
   * Dispatches a new movement request for an agent
   */
  public requestMovement(
    request: MovementRequest,
    currentPos: WorldPosition
  ): boolean {
    const nav = this.navStates.get(request.agentId);
    if (!nav) return false;

    // Compute A* path from current position to target
    const path = PathfindingEngine.findPath(currentPos, request.targetPosition);
    if (path.length === 0) return false;

    nav.currentPath = path;
    nav.currentWaypointIndex = 0;
    nav.isPaused = false;
    nav.destinationName = request.destinationName;
    nav.onArrivalState = request.onArrivalState || 'IDLE';

    return true;
  }

  /**
   * Updates all moving agents along their waypoint paths
   */
  public update(
    deltaTime: number,
    agentPositions: Map<string, WorldPosition>,
    onArrived?: (agentId: string, finalState: 'WORKING' | 'IDLE' | 'TALKING' | 'INTERACTING') => void
  ) {
    for (const [agentId, nav] of this.navStates.entries()) {
      if (nav.isPaused || nav.currentPath.length === 0) continue;

      const currentPos = agentPositions.get(agentId);
      if (!currentPos) continue;

      const targetWaypoint = nav.currentPath[nav.currentWaypointIndex];
      if (!targetWaypoint) {
        // Path complete -> Trigger arrival
        this.completeMovement(agentId, onArrived);
        continue;
      }

      // Calculate vector to waypoint
      const dx = targetWaypoint.x - currentPos.x;
      const dy = targetWaypoint.y - currentPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        // Waypoint reached -> advance to next
        nav.currentWaypointIndex++;
        if (nav.currentWaypointIndex >= nav.currentPath.length) {
          this.completeMovement(agentId, onArrived);
          continue;
        }
      } else {
        // Smooth heading angular interpolation
        const targetHeading = Math.atan2(dy, dx);
        nav.headingAngle = this.lerpAngle(nav.headingAngle, targetHeading, deltaTime * 8);
        nav.targetFacing = this.headingToFacing(nav.headingAngle);

        // Move toward waypoint
        const step = nav.movementSpeed * deltaTime;
        const moveDist = Math.min(step, dist);
        currentPos.x += (dx / dist) * moveDist;
        currentPos.y += (dy / dist) * moveDist;
      }
    }

    // Apply mutual person-to-person spacing repulsion
    this.applyAgentSpacing(agentPositions, deltaTime);
  }

  /**
   * Complete movement and notify position manager
   */
  private completeMovement(
    agentId: string,
    onArrived?: (agentId: string, finalState: 'WORKING' | 'IDLE' | 'TALKING' | 'INTERACTING') => void
  ) {
    const nav = this.navStates.get(agentId);
    if (!nav) return;

    const arrivalState = nav.onArrivalState;
    nav.currentPath = [];
    nav.currentWaypointIndex = 0;
    nav.destinationName = undefined;

    if (onArrived) {
      onArrived(agentId, arrivalState);
    }
  }

  /**
   * Mutual person-to-person spacing avoidance to prevent agent overlapping
   */
  private applyAgentSpacing(agentPositions: Map<string, WorldPosition>, deltaTime: number) {
    const minDistance = 22; // World units
    const ids = Array.from(agentPositions.keys());

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const p1 = agentPositions.get(ids[i]);
        const p2 = agentPositions.get(ids[j]);
        if (!p1 || !p2) continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0 && dist < minDistance) {
          const overlap = (minDistance - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;

          p1.x -= nx * overlap * deltaTime * 5;
          p1.y -= ny * overlap * deltaTime * 5;
          p2.x += nx * overlap * deltaTime * 5;
          p2.y += ny * overlap * deltaTime * 5;
        }
      }
    }
  }

  /**
   * Convert continuous radian heading angle into discrete 8-way facing
   */
  public headingToFacing(angle: number): CharacterFacing {
    // Normalize to [0, 2PI)
    let a = angle % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;

    const octant = Math.PI / 4;
    if (a >= 7 * octant + octant / 2 || a < octant / 2) return 'EAST';
    if (a >= octant / 2 && a < 3 * octant / 2) return 'SOUTH_EAST';
    if (a >= 3 * octant / 2 && a < 5 * octant / 2) return 'SOUTH';
    if (a >= 5 * octant / 2 && a < 7 * octant / 2) return 'SOUTH_WEST';
    if (a >= 7 * octant / 2 && a < 9 * octant / 2) return 'WEST';
    if (a >= 9 * octant / 2 && a < 11 * octant / 2) return 'NORTH_WEST';
    if (a >= 11 * octant / 2 && a < 13 * octant / 2) return 'NORTH';
    return 'NORTH_EAST';
  }

  /**
   * Shortest path angular interpolation
   */
  private lerpAngle(a: number, b: number, t: number): number {
    const diff = (b - a + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    return a + diff * Math.max(0, Math.min(1, t));
  }

  public cancelMovement(agentId: string) {
    const nav = this.navStates.get(agentId);
    if (nav) {
      nav.currentPath = [];
      nav.currentWaypointIndex = 0;
      nav.isPaused = false;
    }
  }

  public pauseMovement(agentId: string) {
    const nav = this.navStates.get(agentId);
    if (nav) nav.isPaused = true;
  }

  public resumeMovement(agentId: string) {
    const nav = this.navStates.get(agentId);
    if (nav) nav.isPaused = false;
  }

  public isMoving(agentId: string): boolean {
    const nav = this.navStates.get(agentId);
    return Boolean(nav && nav.currentPath.length > 0 && !nav.isPaused);
  }

  public getNavState(agentId: string): AgentNavState | undefined {
    return this.navStates.get(agentId);
  }
}
