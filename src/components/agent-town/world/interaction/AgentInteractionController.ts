/**
 * JARVIS Agent Town — Agent Interaction Controller
 * Step 6: Turn-Taking Conversation State Machine, Staging Approach & Packet Lifecycle
 */

import { WorldPosition } from '../types';
import { CharacterFacing } from '../character/types';
import {
  ActiveInteractionSession,
  InteractionRequest,
  DataPacket,
  InteractionPhase
} from './types';
import { NAVIGATION_NODES } from '../navigation/NavigationGraph';
import { WorldCoordinateSystem } from '../WorldCoordinateSystem';

export class AgentInteractionController {
  private sessions: Map<string, ActiveInteractionSession> = new Map();

  // Communication staging points for each agent
  private static readonly AGENT_COMM_NODES: Record<string, string> = {
    'agent-alice': 'NODE_ALICE_COMM_POINT',
    'agent-bob': 'NODE_BOB_COMM_POINT',
    'agent-carol': 'NODE_CAROL_COMM_POINT',
    'agent-dave': 'NODE_DAVE_COMM_POINT'
  };

  /**
   * Dispatches a new agent-to-agent visual interaction session
   */
  public startInteraction(
    request: InteractionRequest,
    initiatorPos: WorldPosition,
    initiatorState: string,
    onMoveRequested: (agentId: string, targetPos: WorldPosition, destName: string) => boolean
  ): boolean {
    if (request.initiatorId === request.targetId) return false;

    // Check if either agent is already in an active session
    for (const session of this.sessions.values()) {
      if (
        session.initiatorId === request.initiatorId ||
        session.targetId === request.initiatorId ||
        session.initiatorId === request.targetId ||
        session.targetId === request.targetId
      ) {
        return false;
      }
    }

    // Find the target's visitor communication point
    const commNodeId = AgentInteractionController.AGENT_COMM_NODES[request.targetId] || 'NODE_HUB_CENTER';
    const commNode = NAVIGATION_NODES[commNodeId];
    if (!commNode) return false;

    const sessionId = `session_${request.initiatorId}_${request.targetId}_${Date.now()}`;
    const now = Date.now();

    const session: ActiveInteractionSession = {
      id: sessionId,
      initiatorId: request.initiatorId,
      targetId: request.targetId,
      type: request.type,
      topic: request.topic,
      phase: 'APPROACHING',
      phaseStartTime: now,
      totalStartTime: now,
      initiatorPreviousPosition: { ...initiatorPos },
      initiatorPreviousState: initiatorState,
      initiatorStagingNodeId: commNodeId,
      dataPackets: [],
      isManualUserTriggered: Boolean(request.isManual)
    };

    this.sessions.set(sessionId, session);

    // Command the initiator to walk to the staging communication point
    onMoveRequested(request.initiatorId, commNode.position, `Meet ${request.targetId}`);
    return true;
  }

  /**
   * Main update tick for all active conversation sessions
   */
  public update(
    deltaTime: number,
    elapsedTime: number,
    agentPositions: Map<string, WorldPosition>,
    agentMoveStatuses: Map<string, boolean>, // whether agent is currently walking
    onMoveRequested: (agentId: string, targetPos: WorldPosition, destName: string) => boolean,
    onSessionCompleted?: (session: ActiveInteractionSession) => void
  ) {
    const now = Date.now();
    const sessionsToRemove: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const pInit = agentPositions.get(session.initiatorId);
      const pTarget = agentPositions.get(session.targetId);

      if (!pInit || !pTarget) {
        sessionsToRemove.push(sessionId);
        continue;
      }

      const phaseElapsed = (now - session.phaseStartTime) / 1000;

      // ── 1. UPDATE TRAVELLING DATA PACKETS ──
      for (let i = session.dataPackets.length - 1; i >= 0; i--) {
        const packet = session.dataPackets[i];
        packet.progress += deltaTime * packet.speed;
        if (packet.progress >= 1.0) {
          session.dataPackets.splice(i, 1);
        }
      }

      // ── 2. STATE MACHINE PHASES ──
      switch (session.phase) {
        case 'APPROACHING': {
          const isWalking = agentMoveStatuses.get(session.initiatorId);
          const commNode = NAVIGATION_NODES[session.initiatorStagingNodeId];
          const distToComm = commNode ? WorldCoordinateSystem.distance2D(pInit, commNode.position) : 0;

          // If arrived at communication point or stopped moving
          if (!isWalking || distToComm < 8) {
            this.setPhase(session, 'ALIGNING', now);
          }
          break;
        }

        case 'ALIGNING': {
          // Allow 0.4s for smooth mutual orientation
          if (phaseElapsed >= 0.4) {
            this.setPhase(session, 'SPEAKER_ACTIVE', now);
            // Spawn initial data packet
            this.spawnPacket(session, pInit, pTarget, '#00e8ff', 1.8);
          }
          break;
        }

        case 'SPEAKER_ACTIVE': {
          // Initiator talks while target listens (1.8s)
          if (phaseElapsed >= 1.8) {
            this.setPhase(session, 'DATA_TRANSFER', now);
            this.spawnPacket(session, pInit, pTarget, '#a855f7', 2.2);
            this.spawnPacket(session, pInit, pTarget, '#00e8ff', 1.6);
          }
          break;
        }

        case 'DATA_TRANSFER': {
          // Packet transit wave (1.2s)
          if (phaseElapsed >= 1.2) {
            this.setPhase(session, 'RESPONDER_ACTIVE', now);
            // Spawn return data packet from target to initiator
            this.spawnPacket(session, pTarget, pInit, '#10e890', 2.0);
          }
          break;
        }

        case 'RESPONDER_ACTIVE': {
          // Target responds while initiator listens (1.6s)
          if (phaseElapsed >= 1.6) {
            this.setPhase(session, 'COMPLETING', now);
          }
          break;
        }

        case 'COMPLETING': {
          // Brief 0.6s confirmation pulse
          if (phaseElapsed >= 0.6) {
            this.setPhase(session, 'RETURNING', now);
            // Command initiator to walk back to previous station
            onMoveRequested(
              session.initiatorId,
              session.initiatorPreviousPosition,
              'Return to Station'
            );
          }
          break;
        }

        case 'RETURNING': {
          const isWalking = agentMoveStatuses.get(session.initiatorId);
          const distToHome = WorldCoordinateSystem.distance2D(pInit, session.initiatorPreviousPosition);

          if (!isWalking || distToHome < 8) {
            if (onSessionCompleted) onSessionCompleted(session);
            sessionsToRemove.push(sessionId);
          }
          break;
        }
      }
    }

    for (const id of sessionsToRemove) {
      this.sessions.delete(id);
    }
  }

  /**
   * Spawns an animated data packet along the active conduit
   */
  private spawnPacket(
    session: ActiveInteractionSession,
    from: WorldPosition,
    to: WorldPosition,
    color: string,
    speed: number
  ) {
    const packet: DataPacket = {
      id: `packet_${Date.now()}_${Math.random()}`,
      progress: 0,
      speed,
      color,
      size: 4,
      fromPosition: { ...from },
      toPosition: { ...to }
    };
    session.dataPackets.push(packet);
  }

  private setPhase(session: ActiveInteractionSession, phase: InteractionPhase, timestamp: number) {
    session.phase = phase;
    session.phaseStartTime = timestamp;
  }

  /**
   * Calculate 8-way facing direction from point A toward point B
   */
  public static calculateFacingToward(from: WorldPosition, to: WorldPosition): CharacterFacing {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += Math.PI * 2;

    const octant = Math.PI / 4;
    if (angle >= 7 * octant + octant / 2 || angle < octant / 2) return 'EAST';
    if (angle >= octant / 2 && angle < 3 * octant / 2) return 'SOUTH_EAST';
    if (angle >= 3 * octant / 2 && angle < 5 * octant / 2) return 'SOUTH';
    if (angle >= 5 * octant / 2 && angle < 7 * octant / 2) return 'SOUTH_WEST';
    if (angle >= 7 * octant / 2 && angle < 9 * octant / 2) return 'WEST';
    if (angle >= 9 * octant / 2 && angle < 11 * octant / 2) return 'NORTH_WEST';
    if (angle >= 11 * octant / 2 && angle < 13 * octant / 2) return 'NORTH';
    return 'NORTH_EAST';
  }

  /**
   * Cancel an active interaction session cleanly
   */
  public cancelInteraction(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  /**
   * Cancel any interaction involving a specific agent
   */
  public cancelForAgent(agentId: string) {
    for (const [id, session] of this.sessions.entries()) {
      if (session.initiatorId === agentId || session.targetId === agentId) {
        this.sessions.delete(id);
      }
    }
  }

  public getSessionForAgent(agentId: string): ActiveInteractionSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.initiatorId === agentId || session.targetId === agentId) {
        return session;
      }
    }
    return undefined;
  }

  public getAllSessions(): ActiveInteractionSession[] {
    return Array.from(this.sessions.values());
  }

  public hasActiveSessions(): boolean {
    return this.sessions.size > 0;
  }
}
