/**
 * JARVIS Agent Town — Agent Animation Controller
 * Step 4: Centralized State Priority, Communication Linking & Lifecycle Coordinator
 */

import { AgentAnimationState, AgentWorldState } from '../types';
import { AgentTownMember, ActiveConnection } from '../../types';

export class AgentAnimationController {
  private completionTimers: Map<string, number> = new Map();
  private isReducedMotion: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
      });
    }
  }

  /**
   * Evaluates the active visual animation state from the live Agent Town status and conduits
   * Enforces strict state priority hierarchy without creating fake autonomous tasks.
   */
  public resolveAnimationState(
    member: AgentTownMember,
    currentWorldState: AgentWorldState | undefined,
    activeConnections: ActiveConnection[] = []
  ): AgentAnimationState {
    const now = Date.now();

    // 1. Priority 1: Subsystem Error
    if (member.status === 'ERROR') {
      return 'ERROR';
    }

    // 2. Priority 2: Task Completion Celebration (2.5 second victory pulse)
    const completionTime = this.completionTimers.get(member.id);
    if (member.status === 'COMPLETED') {
      if (!completionTime) {
        this.completionTimers.set(member.id, now);
        return 'CELEBRATING';
      } else if (now - completionTime < 2500) {
        return 'CELEBRATING';
      }
    } else if (completionTime) {
      this.completionTimers.delete(member.id);
    }

    // 3. Priority 3: Active Inter-Agent Communication (Conduit Stream)
    const isSender = activeConnections.some((c) => c.fromAgentId === member.id);
    if (isSender) {
      return 'TALKING';
    }

    // 4. Priority 4: Active Inter-Agent Receiver
    const isReceiver = activeConnections.some((c) => c.toAgentId === member.id);
    if (isReceiver) {
      return 'LISTENING';
    }

    // 5. Priority 5: Locomotion / Movement
    if (currentWorldState && currentWorldState.movementState === 'MOVING') {
      return 'WALKING';
    }

    // 6. Priority 6: Deep Thinking / Synthesis
    if (member.status === 'THINKING') {
      return 'THINKING';
    }

    // 7. Priority 7: Active Autonomous Task Execution
    if (member.status === 'WORKING' || Boolean(member.currentTask)) {
      return 'WORKING';
    }

    // 8. Priority 8: Waiting / Standby Dispatch
    if (member.status === 'WAITING') {
      return 'WAITING';
    }

    // 9. Priority 9: Default Living Idle
    return 'IDLE';
  }

  /**
   * Check if reduced motion is requested by user environment
   */
  public getReducedMotion(): boolean {
    return this.isReducedMotion;
  }
}
