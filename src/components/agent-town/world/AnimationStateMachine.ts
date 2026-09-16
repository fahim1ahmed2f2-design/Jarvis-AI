/**
 * JARVIS Agent Town — Animation State Machine
 * Step 1: Validated State Transitions & Animation State Architecture
 */

import { AgentAnimationState } from './types';

// Validated transition graph to prevent impossible random transitions
const ALLOWED_TRANSITIONS: Record<AgentAnimationState, AgentAnimationState[]> = {
  IDLE: ['WALKING', 'WORKING', 'THINKING', 'TALKING', 'LISTENING', 'INTERACTING', 'WAITING', 'SLEEPING', 'ERROR'],
  WALKING: ['IDLE', 'WORKING', 'THINKING', 'TALKING', 'LISTENING', 'INTERACTING', 'WAITING', 'ERROR'],
  WORKING: ['THINKING', 'TALKING', 'LISTENING', 'CELEBRATING', 'IDLE', 'ERROR', 'WAITING', 'WALKING', 'INTERACTING'],
  THINKING: ['WORKING', 'TALKING', 'LISTENING', 'IDLE', 'ERROR', 'CELEBRATING'],
  TALKING: ['IDLE', 'WORKING', 'WALKING', 'THINKING', 'LISTENING', 'INTERACTING', 'ERROR'],
  LISTENING: ['IDLE', 'WORKING', 'WALKING', 'THINKING', 'TALKING', 'INTERACTING', 'ERROR'],
  INTERACTING: ['IDLE', 'WORKING', 'TALKING', 'LISTENING', 'CELEBRATING', 'ERROR'],
  CELEBRATING: ['IDLE', 'WORKING', 'TALKING'],
  WAITING: ['IDLE', 'WORKING', 'WALKING', 'THINKING', 'TALKING', 'LISTENING', 'ERROR'],
  SLEEPING: ['IDLE', 'WAITING'],
  ERROR: ['IDLE', 'WORKING', 'WAITING']
};

// Recommended default animation duration (in milliseconds)
export const STATE_DEFAULT_DURATIONS: Partial<Record<AgentAnimationState, number>> = {
  CELEBRATING: 3500,
  TALKING: 4000,
  THINKING: 5000,
  INTERACTING: 3000
};

export class AnimationStateMachine {
  /**
   * Validates if a transition from `currentState` to `nextState` is allowed
   */
  public static canTransition(
    currentState: AgentAnimationState,
    nextState: AgentAnimationState
  ): boolean {
    if (currentState === nextState) return true;
    const allowed = ALLOWED_TRANSITIONS[currentState] || [];
    return allowed.includes(nextState);
  }

  /**
   * Attempts a state transition. Returns the resulting state (new state if valid, current state if invalid)
   */
  public static transition(
    currentState: AgentAnimationState,
    requestedState: AgentAnimationState
  ): { nextState: AgentAnimationState; changed: boolean } {
    if (this.canTransition(currentState, requestedState)) {
      return { nextState: requestedState, changed: currentState !== requestedState };
    }
    console.warn(`[AnimationStateMachine] Invalid state transition: ${currentState} -> ${requestedState}`);
    return { nextState: currentState, changed: false };
  }

  /**
   * Automatically derives the ideal animation state from live agent status and tasks
   */
  public static deriveStateFromAgentStatus(
    agentStatus: string,
    hasCurrentTask: boolean,
    isThinking: boolean = false
  ): AgentAnimationState {
    if (isThinking || agentStatus === 'THINKING') {
      return 'THINKING';
    }
    if (hasCurrentTask || agentStatus === 'WORKING') {
      return 'WORKING';
    }
    if (agentStatus === 'ERROR') {
      return 'ERROR';
    }
    if (agentStatus === 'WAITING') {
      return 'WAITING';
    }
    if (agentStatus === 'COMPLETED') {
      return 'CELEBRATING';
    }
    return 'IDLE';
  }

  /**
   * Get human-readable description of the current animation state
   */
  public static getStateDescription(state: AgentAnimationState): string {
    switch (state) {
      case 'IDLE':
        return 'Monitoring Subsystems (Standby)';
      case 'WALKING':
        return 'Navigating Headquarters Grid';
      case 'WORKING':
        return 'Executing Autonomous Task';
      case 'THINKING':
        return 'Synthesizing Neural Reasoning Matrix';
      case 'TALKING':
        return 'Inter-Agent Conduit Communication';
      case 'INTERACTING':
        return 'Accessing Physical Terminal Hub';
      case 'CELEBRATING':
        return 'Mission Protocol Succeeded';
      case 'WAITING':
        return 'Awaiting Task Dispatch';
      case 'SLEEPING':
        return 'Low Power Standby';
      case 'ERROR':
        return 'Subsystem Fault Detected';
      default:
        return 'Online';
    }
  }
}
