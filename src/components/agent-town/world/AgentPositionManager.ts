/**
 * JARVIS Agent Town — Agent Position Manager
 * Step 6: Data-Driven Agent Positions, Navigation Locomotion & Agent-to-Agent Interactions
 */

import { AgentWorldState, WorldPosition, AgentAnimationState } from './types';
import { AgentTownMember, ActiveConnection } from '../types';
import { AnimationStateMachine } from './AnimationStateMachine';
import { AgentAnimationController } from './character/AgentAnimationController';
import { AgentMovementController } from './navigation/AgentMovementController';
import { MovementRequest } from './navigation/types';
import { AgentInteractionController } from './interaction/AgentInteractionController';
import { InteractionRequest } from './interaction/types';
import { AgentSocialController } from './social/AgentSocialController';

// Standard Home Coordinates for Core Agents
export const AGENT_HOME_POSITIONS: Record<string, WorldPosition> = {
  'agent-alice': { x: -220, y: -180, z: 0, rotation: 45 },
  'agent-bob': { x: -220, y: 180, z: 0, rotation: 135 },
  'agent-carol': { x: 220, y: -180, z: 0, rotation: -45 },
  'agent-dave': { x: 220, y: 180, z: 0, rotation: -135 }
};

export class AgentPositionManager {
  private agentStates: Map<string, AgentWorldState> = new Map();
  private animationController: AgentAnimationController = new AgentAnimationController();
  private movementController: AgentMovementController = new AgentMovementController();
  private interactionController: AgentInteractionController = new AgentInteractionController();
  private socialController: AgentSocialController = new AgentSocialController();

  constructor() {
    this.initDefaultStates();
  }

  public getAnimationController(): AgentAnimationController {
    return this.animationController;
  }

  public getMovementController(): AgentMovementController {
    return this.movementController;
  }

  public getInteractionController(): AgentInteractionController {
    return this.interactionController;
  }

  public getSocialController(): AgentSocialController {
    return this.socialController;
  }

  /**
   * Initialize default position data for Alice, Bob, Carol, and Dave
   */
  private initDefaultStates() {
    const defaultConfigs: Array<{
      id: string;
      name: string;
      role: string;
      color: string;
      glow: string;
    }> = [
      { id: 'agent-alice', name: 'Alice', role: 'Research & Analysis', color: '#00e8ff', glow: 'rgba(0, 232, 255, 0.7)' },
      { id: 'agent-bob', name: 'Bob', role: 'Operations & Execution', color: '#f5a524', glow: 'rgba(245, 165, 36, 0.7)' },
      { id: 'agent-carol', name: 'Carol', role: 'Knowledge & Memory', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.7)' },
      { id: 'agent-dave', name: 'Dave', role: 'Strategic Command', color: '#10e890', glow: 'rgba(16, 232, 144, 0.7)' }
    ];

    for (const config of defaultConfigs) {
      const home = AGENT_HOME_POSITIONS[config.id] || { x: 0, y: 0, z: 0, rotation: 0 };
      this.agentStates.set(config.id, {
        agentId: config.id,
        name: config.name,
        role: config.role,
        currentPosition: { ...home },
        homePosition: { ...home },
        targetPosition: null,
        animationState: 'IDLE',
        previousAnimationState: 'IDLE',
        movementState: 'STATIONARY',
        facing: 'SOUTH',
        stateStartTime: Date.now(),
        neuralPulse: 0,
        isSelected: false,
        isHovered: false,
        avatarColor: config.color,
        glowColor: config.glow,
        taskTitle: null
      });
    }
  }

  /**
   * Synchronize position manager with active agent members from React state and active conduits
   */
  public syncWithMembers(
    members: AgentTownMember[],
    selectedAgentId: string | null,
    activeConnections: ActiveConnection[] = []
  ) {
    for (const member of members) {
      let state = this.agentStates.get(member.id);
      if (!state) {
        const home = AGENT_HOME_POSITIONS[member.id] || { x: 0, y: 0, z: 0, rotation: 0 };
        state = {
          agentId: member.id,
          name: member.name,
          role: member.role,
          currentPosition: { ...home },
          homePosition: { ...home },
          targetPosition: null,
          animationState: 'IDLE',
          previousAnimationState: 'IDLE',
          movementState: 'STATIONARY',
          facing: 'SOUTH',
          stateStartTime: Date.now(),
          neuralPulse: 0,
          isSelected: false,
          isHovered: false,
          avatarColor: member.avatar.color,
          glowColor: member.avatar.glowColor,
          taskTitle: member.currentTask?.title || null
        };
        this.agentStates.set(member.id, state);
      }

      // Update selection and metadata
      state.isSelected = selectedAgentId === member.id;
      state.name = member.name;
      state.role = member.role;
      state.taskTitle = member.currentTask?.title || null;

      // Only derive animation state if stationary and NOT in an active conversation session
      const isInSession = Boolean(this.interactionController.getSessionForAgent(member.id));
      if (!this.movementController.isMoving(member.id) && !isInSession) {
        const derived = this.animationController.resolveAnimationState(member, state, activeConnections);

        if (state.animationState !== derived && state.movementState === 'STATIONARY') {
          const result = AnimationStateMachine.transition(state.animationState, derived);
          if (result.changed) {
            state.previousAnimationState = state.animationState;
            state.animationState = result.nextState;
            state.stateStartTime = Date.now();
          }
        }
      }
    }

    // Auto-sync real activeConnections into interaction controller if not already present
    for (const conn of activeConnections) {
      const existing = this.interactionController.getSessionForAgent(conn.fromAgentId);
      if (!existing && conn.fromAgentId !== conn.toAgentId) {
        this.requestInteraction(conn.fromAgentId, conn.toAgentId, 'COLLABORATION', 'Neural Conduit Sync', false);
      }
    }
  }

  /**
   * Update tick for movement, interactions, and animations
   */
  public update(deltaTime: number, elapsedTime: number) {
    // 1. Gather all current positions & move statuses for collision, navigation & interactions
    const positionsMap = new Map<string, WorldPosition>();
    const moveStatusMap = new Map<string, boolean>();

    for (const [id, state] of this.agentStates.entries()) {
      positionsMap.set(id, state.currentPosition);
      moveStatusMap.set(id, this.movementController.isMoving(id));
    }

    // 2. Step Movement Controller along Navigation Graph Paths
    this.movementController.update(
      deltaTime,
      positionsMap,
      (agentId: string, arrivalState: 'WORKING' | 'IDLE' | 'TALKING' | 'INTERACTING') => {
        const state = this.agentStates.get(agentId);
        if (state) {
          state.movementState = 'ARRIVED';
          state.targetPosition = null;
          state.previousAnimationState = 'WALKING';
          state.animationState = arrivalState;
          state.stateStartTime = Date.now();
        }
      }
    );

    // 3. Step Interaction Controller for Active Agent Conversations
    this.interactionController.update(
      deltaTime,
      elapsedTime,
      positionsMap,
      moveStatusMap,
      (agentId: string, targetPos: WorldPosition, destName: string) => {
        return this.moveToDestination(agentId, targetPos, destName, 'IDLE');
      },
      (completedSession) => {
        // Return initiator to previous state
        const state = this.agentStates.get(completedSession.initiatorId);
        if (state) {
          state.animationState = (completedSession.initiatorPreviousState as AgentAnimationState) || 'IDLE';
        }
      }
    );

    // 4. Step Social Controller for Proximity Awareness & Acknowledgements
    this.socialController.update(deltaTime, Array.from(this.agentStates.values()));

    // 5. Update agent state visuals, facings, and conversation overrides
    for (const [id, state] of this.agentStates.entries()) {
      // Neural pulse animation wave
      state.neuralPulse = Math.sin(elapsedTime * 3 + (id.charCodeAt(6) || 0)) * 0.5 + 0.5;

      const isWalking = this.movementController.isMoving(id);
      if (isWalking) {
        state.movementState = 'MOVING';
        if (state.animationState !== 'WALKING') {
          state.previousAnimationState = state.animationState;
          state.animationState = 'WALKING';
          state.stateStartTime = Date.now();
        }
        const nav = this.movementController.getNavState(id);
        if (nav) {
          state.facing = nav.targetFacing;
        }
      } else {
        if (state.movementState === 'MOVING') {
          state.movementState = 'STATIONARY';
        }

        // Apply interaction session overrides (TALKING, LISTENING, and facing conversation partner)
        const session = this.interactionController.getSessionForAgent(id);
        if (session && session.phase !== 'APPROACHING' && session.phase !== 'RETURNING') {
          const isInitiator = session.initiatorId === id;
          const partnerId = isInitiator ? session.targetId : session.initiatorId;
          const pSelf = state.currentPosition;
          const pPartner = positionsMap.get(partnerId);

          if (pPartner) {
            state.facing = AgentInteractionController.calculateFacingToward(pSelf, pPartner);
          }

          if (session.phase === 'ALIGNING') {
            state.animationState = 'IDLE';
          } else if (session.phase === 'SPEAKER_ACTIVE' || session.phase === 'DATA_TRANSFER') {
            state.animationState = isInitiator ? 'TALKING' : 'LISTENING';
          } else if (session.phase === 'RESPONDER_ACTIVE') {
            state.animationState = isInitiator ? 'LISTENING' : 'TALKING';
          } else if (session.phase === 'COMPLETING') {
            state.animationState = 'CELEBRATING';
          }
        }
      }
    }
  }

  /**
   * Request an agent to walk to a target destination via A* Pathfinding
   */
  public moveToDestination(
    agentId: string,
    targetPos: WorldPosition,
    destinationName?: string,
    onArrivalState: 'WORKING' | 'IDLE' | 'TALKING' | 'INTERACTING' = 'IDLE'
  ): boolean {
    const state = this.agentStates.get(agentId);
    if (!state) return false;

    const request: MovementRequest = {
      agentId,
      targetPosition: { ...targetPos },
      destinationName,
      onArrivalState
    };

    const success = this.movementController.requestMovement(request, state.currentPosition);
    if (success) {
      state.targetPosition = { ...targetPos };
      state.movementState = 'MOVING';
      state.previousAnimationState = state.animationState;
      state.animationState = 'WALKING';
      state.stateStartTime = Date.now();
    }
    return success;
  }

  /**
   * Request a visual agent-to-agent interaction
   */
  public requestInteraction(
    initiatorId: string,
    targetId: string,
    type: InteractionRequest['type'] = 'COLLABORATION',
    topic?: string,
    isManual: boolean = true
  ): boolean {
    const init = this.agentStates.get(initiatorId);
    if (!init) return false;

    return this.interactionController.startInteraction(
      {
        initiatorId,
        targetId,
        type,
        topic,
        isManual
      },
      init.currentPosition,
      init.animationState,
      (aId, targetPos, destName) => {
        return this.moveToDestination(aId, targetPos, destName, 'IDLE');
      }
    );
  }

  /**
   * Return agent to home station via navigation path
   */
  public returnHome(agentId: string) {
    const state = this.agentStates.get(agentId);
    if (state) {
      this.interactionController.cancelForAgent(agentId);
      this.moveToDestination(agentId, state.homePosition, 'Home Station', 'IDLE');
    }
  }

  /**
   * Cancel active movement or interaction safely
   */
  public cancelMovement(agentId: string) {
    const state = this.agentStates.get(agentId);
    if (state) {
      this.interactionController.cancelForAgent(agentId);
      this.movementController.cancelMovement(agentId);
      state.movementState = 'STATIONARY';
      state.targetPosition = null;
      state.previousAnimationState = state.animationState;
      state.animationState = 'IDLE';
      state.stateStartTime = Date.now();
    }
  }

  public pauseMovement(agentId: string) {
    this.movementController.pauseMovement(agentId);
  }

  public resumeMovement(agentId: string) {
    this.movementController.resumeMovement(agentId);
  }

  public getAgentState(agentId: string): AgentWorldState | undefined {
    return this.agentStates.get(agentId);
  }

  public getAllAgentStates(): AgentWorldState[] {
    return Array.from(this.agentStates.values());
  }

  public setHoveredAgent(agentId: string | null) {
    for (const [id, state] of this.agentStates.entries()) {
      state.isHovered = id === agentId;
    }
  }
}
