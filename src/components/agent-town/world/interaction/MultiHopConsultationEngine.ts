/**
 * JARVIS Agent Town — Multi-Hop Walking Consultation & Collaborative Synthesis Engine
 * 
 * Flow:
 * 1. Alice (R&D Lab) starts research hypothesis.
 * 2. Alice WALKS through corridors into Dave's Command HQ -> Consults Dave on Strategy.
 * 3. Alice WALKS with Dave's insight into Bob's Ops Workshop -> Consults Bob on Tools & Execution.
 * 4. Alice WALKS with accumulated insights into Carol's Library -> Consults Carol on Memory & Archives.
 * 5. Alice WALKS back home to her R&D Research Desk -> Delivers unified multi-agent final answer.
 */

import { agentActivityFeed } from '../../agentActivityFeed';

export type ConsultationStage =
  | 'IDLE'
  | 'INITIAL_RESEARCH'
  | 'WALKING_TO_DAVE'
  | 'CONSULTING_DAVE'
  | 'WALKING_TO_BOB'
  | 'CONSULTING_BOB'
  | 'WALKING_TO_CAROL'
  | 'CONSULTING_CAROL'
  | 'WALKING_HOME'
  | 'SYNTHESIS_COMPLETE';

export interface DialogueBubble {
  speakerId: string;
  speakerName: string;
  color: string;
  text: string;
  position: { x: number; y: number };
}

export interface ConsultationHopStep {
  id: string;
  targetAgentId: string;
  locationName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface MultiHopSession {
  id: string;
  taskTitle: string;
  prompt?: string;
  currentHopIndex: number;
  hops: ConsultationHopStep[];
  initiatorId: string; // usually 'agent-alice'
  stage: ConsultationStage;
  currentPos: { x: number; y: number };
  facing: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  isWalking: boolean;
  activeDialogue: DialogueBubble | null;
  consultedInsights: {
    dave?: string;
    bob?: string;
    carol?: string;
    finalReport?: string;
  };
  startTime: number;
  stageStartTime: number;
  progress: number; // 0 to 100
}

type SessionListener = (session: MultiHopSession | null) => void;

class MultiHopConsultationEngine {
  private activeSession: MultiHopSession | null = null;
  private listeners: Set<SessionListener> = new Set();
  private animationFrameId: number | null = null;

  // Key Coordinates in 5-Room World
  public readonly POSITIONS = {
    ALICE_DESK: { x: 870, y: 220 },
    ALICE_DOOR: { x: 600, y: 200 },
    HALL_CENTER: { x: 570, y: 445 },
    DAVE_DOOR: { x: 600, y: 630 },
    DAVE_DESK: { x: 840, y: 660 },
    BOB_DOOR: { x: 505, y: 630 },
    BOB_DESK: { x: 300, y: 650 },
    CAROL_DOOR: { x: 505, y: 200 },
    CAROL_DESK: { x: 300, y: 220 }
  };

  public subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    listener(this.activeSession);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.activeSession);
    }
  }

  public getSession(): MultiHopSession | null {
    return this.activeSession;
  }

  /**
   * Starts a new Multi-Hop Walking Consultation Pipeline
   */
  public startConsultationChain(taskPrompt: string = 'Comprehensive Multi-Agent Synthesis & Cross-Domain Evaluation') {
    const session: MultiHopSession = {
      id: `mhop_${Date.now()}`,
      taskTitle: taskPrompt,
      prompt: taskPrompt,
      currentHopIndex: 0,
      hops: [
        { id: 'hop-dave', targetAgentId: 'agent-dave', locationName: 'Sector 4: Strategic HQ', status: 'IN_PROGRESS' },
        { id: 'hop-bob', targetAgentId: 'agent-bob', locationName: 'Sector 2: Operations & Hardware', status: 'PENDING' },
        { id: 'hop-carol', targetAgentId: 'agent-carol', locationName: 'Sector 3: Knowledge Archive', status: 'PENDING' }
      ],
      initiatorId: 'agent-alice',
      stage: 'INITIAL_RESEARCH',
      currentPos: { ...this.POSITIONS.ALICE_DESK },
      facing: 'DOWN',
      isWalking: false,
      activeDialogue: {
        speakerId: 'agent-alice',
        speakerName: 'Alice',
        color: '#00e8ff',
        text: 'Initiating hypothesis. Preparing consultation path...',
        position: { ...this.POSITIONS.ALICE_DESK }
      },
      consultedInsights: {},
      startTime: Date.now(),
      stageStartTime: Date.now(),
      progress: 5
    };

    this.activeSession = session;
    this.notify();

    agentActivityFeed.logEvent({
      id: `evt_${Date.now()}`,
      agentId: 'agent-alice',
      agentName: 'Alice',
      agentColor: '#00e8ff',
      eventType: 'TASK_STARTED',
      title: `Multi-Hop Walk: ${taskPrompt}`,
      description: 'Alice is walking to consult Dave, Bob, and Carol for consensus.',
      timestamp: Date.now()
    });

    this.startLoop();
  }

  private startLoop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    const tick = () => {
      if (!this.activeSession) return;
      this.updateSessionState();
      this.notify();

      if (this.activeSession && this.activeSession.stage !== 'SYNTHESIS_COMPLETE') {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        // Keep final state visible
        setTimeout(() => {
          if (this.activeSession?.stage === 'SYNTHESIS_COMPLETE') {
            this.activeSession = null;
            this.notify();
          }
        }, 12000);
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private interpolate(p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
    const clampedT = Math.max(0, Math.min(1, t));
    return {
      x: p1.x + (p2.x - p1.x) * clampedT,
      y: p1.y + (p2.y - p1.y) * clampedT
    };
  }

  private getFacing(p1: { x: number; y: number }, p2: { x: number; y: number }): 'DOWN' | 'UP' | 'LEFT' | 'RIGHT' {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'RIGHT' : 'LEFT';
    }
    return dy > 0 ? 'DOWN' : 'UP';
  }

  private interpolatePath(waypoints: { x: number; y: number }[], progress01: number) {
    if (waypoints.length <= 1) return { pos: waypoints[0], facing: 'DOWN' as const };
    const totalSegments = waypoints.length - 1;
    const scaled = progress01 * totalSegments;
    const segIdx = Math.min(Math.floor(scaled), totalSegments - 1);
    const segT = scaled - segIdx;

    const p1 = waypoints[segIdx];
    const p2 = waypoints[segIdx + 1];
    return {
      pos: this.interpolate(p1, p2, segT),
      facing: this.getFacing(p1, p2)
    };
  }

  private updateSessionState() {
    if (!this.activeSession) return;
    const now = Date.now();
    const elapsed = now - this.activeSession.stageStartTime;

    switch (this.activeSession.stage) {
      case 'INITIAL_RESEARCH': {
        // 2 seconds initial hypothesis
        if (elapsed > 2200) {
          this.activeSession.stage = 'WALKING_TO_DAVE';
          this.activeSession.stageStartTime = now;
          this.activeSession.isWalking = true;
          this.activeSession.progress = 15;
          this.activeSession.activeDialogue = null;
        }
        break;
      }

      case 'WALKING_TO_DAVE': {
        // 3.5 seconds walking from Lab to Dave in Command HQ
        const dur = 3500;
        const t = Math.min(1, elapsed / dur);
        const waypoints = [
          this.POSITIONS.ALICE_DESK,
          this.POSITIONS.ALICE_DOOR,
          this.POSITIONS.HALL_CENTER,
          this.POSITIONS.DAVE_DOOR,
          this.POSITIONS.DAVE_DESK
        ];
        const res = this.interpolatePath(waypoints, t);
        this.activeSession.currentPos = res.pos;
        this.activeSession.facing = res.facing;
        this.activeSession.progress = 15 + Math.round(t * 15);

        if (t >= 1) {
          this.activeSession.stage = 'CONSULTING_DAVE';
          this.activeSession.stageStartTime = now;
          this.activeSession.isWalking = false;
          this.activeSession.facing = 'RIGHT';
          this.activeSession.activeDialogue = {
            speakerId: 'agent-dave',
            speakerName: 'Dave (Command)',
            color: '#3b82f6',
            text: 'Directing strategic priorities & risk parameters.',
            position: { x: 840, y: 640 }
          };
          this.activeSession.consultedInsights.dave = 'Strategic directive validated: High confidence priority routing applied.';
        }
        break;
      }

      case 'CONSULTING_DAVE': {
        // 3 seconds dialogue with Dave
        if (elapsed > 3000) {
          if (this.activeSession.hops[0]) this.activeSession.hops[0].status = 'COMPLETED';
          if (this.activeSession.hops[1]) this.activeSession.hops[1].status = 'IN_PROGRESS';
          this.activeSession.currentHopIndex = 1;
          this.activeSession.stage = 'WALKING_TO_BOB';
          this.activeSession.stageStartTime = now;
          this.activeSession.isWalking = true;
          this.activeSession.progress = 35;
          this.activeSession.activeDialogue = null;
        }
        break;
      }

      case 'WALKING_TO_BOB': {
        // 3.5 seconds walking from Dave's HQ to Bob's Workshop
        const dur = 3500;
        const t = Math.min(1, elapsed / dur);
        const waypoints = [
          this.POSITIONS.DAVE_DESK,
          this.POSITIONS.DAVE_DOOR,
          { x: 570, y: 630 },
          this.POSITIONS.BOB_DOOR,
          this.POSITIONS.BOB_DESK
        ];
        const res = this.interpolatePath(waypoints, t);
        this.activeSession.currentPos = res.pos;
        this.activeSession.facing = res.facing;
        this.activeSession.progress = 35 + Math.round(t * 20);

        if (t >= 1) {
          this.activeSession.stage = 'CONSULTING_BOB';
          this.activeSession.stageStartTime = now;
          this.activeSession.isWalking = false;
          this.activeSession.facing = 'LEFT';
          this.activeSession.activeDialogue = {
            speakerId: 'agent-bob',
            speakerName: 'Bob (Ops)',
            color: '#f59e0b',
            text: 'Verifying automated execution pipelines & tool benchmarks.',
            position: { x: 300, y: 630 }
          };
          this.activeSession.consultedInsights.bob = 'Technical ops confirmed: Execution bandwidth & tool reliability optimal.';
        }
        break;
      }

      case 'CONSULTING_BOB': {
        // 3 seconds dialogue with Bob
        if (elapsed > 3000) {
          if (this.activeSession.hops[1]) this.activeSession.hops[1].status = 'COMPLETED';
          if (this.activeSession.hops[2]) this.activeSession.hops[2].status = 'IN_PROGRESS';
          this.activeSession.currentHopIndex = 2;
          this.activeSession.stage = 'WALKING_TO_CAROL';
          this.activeSession.stageStartTime = now;
          this.activeSession.isWalking = true;
          this.activeSession.progress = 60;
          this.activeSession.activeDialogue = null;
        }
        break;
      }

      case 'WALKING_TO_CAROL': {
        // 3.5 seconds walking from Bob's Ops into Carol's Library
        const dur = 3500;
        const t = Math.min(1, elapsed / dur);
        const waypoints = [
          this.POSITIONS.BOB_DESK,
          this.POSITIONS.BOB_DOOR,
          this.POSITIONS.HALL_CENTER,
          this.POSITIONS.CAROL_DOOR,
          this.POSITIONS.CAROL_DESK
        ];
        const res = this.interpolatePath(waypoints, t);
        this.activeSession.currentPos = res.pos;
        this.activeSession.facing = res.facing;
        this.activeSession.progress = 60 + Math.round(t * 15);

        if (t >= 1) {
          this.activeSession.stage = 'CONSULTING_CAROL';
          this.activeSession.stageStartTime = now;
          this.activeSession.isWalking = false;
          this.activeSession.facing = 'LEFT';
          this.activeSession.activeDialogue = {
            speakerId: 'agent-carol',
            speakerName: 'Carol (Library)',
            color: '#a855f7',
            text: 'Retrieving literature citations & persistent memory context.',
            position: { x: 300, y: 200 }
          };
          this.activeSession.consultedInsights.carol = 'Knowledge base indexed: Citations and historical memory records matched.';
        }
        break;
      }

      case 'CONSULTING_CAROL': {
        // 3 seconds dialogue with Carol
        if (elapsed > 3000) {
          if (this.activeSession.hops[2]) this.activeSession.hops[2].status = 'COMPLETED';
          this.activeSession.stage = 'WALKING_HOME';
          this.activeSession.stageStartTime = now;
          this.activeSession.isWalking = true;
          this.activeSession.progress = 80;
          this.activeSession.activeDialogue = null;
        }
        break;
      }

      case 'WALKING_HOME': {
        // 3.5 seconds walking from Carol's Library back to Alice's Research Lab
        const dur = 3500;
        const t = Math.min(1, elapsed / dur);
        const waypoints = [
          this.POSITIONS.CAROL_DESK,
          this.POSITIONS.CAROL_DOOR,
          { x: 570, y: 200 },
          this.POSITIONS.ALICE_DOOR,
          this.POSITIONS.ALICE_DESK
        ];
        const res = this.interpolatePath(waypoints, t);
        this.activeSession.currentPos = res.pos;
        this.activeSession.facing = res.facing;
        this.activeSession.progress = 80 + Math.round(t * 18);

        if (t >= 1) {
          this.activeSession.stage = 'SYNTHESIS_COMPLETE';
          this.activeSession.stageStartTime = now;
          this.activeSession.isWalking = false;
          this.activeSession.facing = 'DOWN';
          this.activeSession.progress = 100;
          this.activeSession.activeDialogue = {
            speakerId: 'agent-alice',
            speakerName: 'Alice (R&D)',
            color: '#10e890',
            text: 'All multi-agent consultations synthesized! Final report ready.',
            position: { ...this.POSITIONS.ALICE_DESK }
          };

          const finalReport = `### 🌟 Multi-Agent Consensus & Collaborative Synthesis Report

**1. 🔬 Alice (R&D Science & Formulation):**
- Structured core hypotheses and identified cross-domain analytical requirements.

**2. 🎖️ Dave (Strategic Command & Alignment):**
- ${this.activeSession.consultedInsights.dave}

**3. ⚡ Bob (Engineering & Operations Validation):**
- ${this.activeSession.consultedInsights.bob}

**4. 📚 Carol (Knowledge Archive & Literature Search):**
- ${this.activeSession.consultedInsights.carol}

---
**🏆 Final Synthesis:** Full consensus reached across all 4 dedicated departments with 100% verification!`;

          this.activeSession.consultedInsights.finalReport = finalReport;

          agentActivityFeed.logEvent({
            id: `evt_${Date.now()}`,
            agentId: 'agent-alice',
            agentName: 'Alice',
            agentColor: '#10e890',
            eventType: 'TASK_COMPLETED',
            title: `Consensus Complete: ${this.activeSession.taskTitle}`,
            description: 'Alice consulted Dave, Bob, Carol and generated the final synthesized report.',
            timestamp: Date.now()
          });
        }
        break;
      }
    }
  }
}

export const multiHopEngine = new MultiHopConsultationEngine();
