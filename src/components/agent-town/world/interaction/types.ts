/**
 * JARVIS Agent Town — Interaction & Conversation Layer Types
 * Step 6: Natural Agent-to-Agent Interaction & Conversation Animations
 */

import { WorldPosition } from '../types';
import { CharacterFacing } from '../character/types';

export type InteractionPhase =
  | 'APPROACHING'      // Visiting agent walking to communication point
  | 'ALIGNING'         // Both agents turning to face each other
  | 'SPEAKER_ACTIVE'   // Initiator speaking (talking animation)
  | 'DATA_TRANSFER'    // Holographic quantum data packets traversing conduit
  | 'RESPONDER_ACTIVE' // Target agent responding (talking animation)
  | 'COMPLETING'       // Brief confirmation pulse
  | 'RETURNING';       // Visiting agent walking back to previous station

export type AgentInteractionType =
  | 'TASK_HANDOFF'
  | 'QUESTION'
  | 'STATUS_UPDATE'
  | 'COLLABORATION'
  | 'REVIEW'
  | 'COMMAND'
  | 'GENERAL';

export interface DataPacket {
  id: string;
  progress: number; // 0 to 1 along conduit
  speed: number;
  color: string;
  size: number;
  fromPosition: WorldPosition;
  toPosition: WorldPosition;
}

export interface ActiveInteractionSession {
  id: string;
  initiatorId: string;
  targetId: string;
  type: AgentInteractionType;
  topic?: string;
  phase: InteractionPhase;
  phaseStartTime: number;
  totalStartTime: number;
  initiatorPreviousPosition: WorldPosition;
  initiatorPreviousState: string;
  initiatorStagingNodeId: string;
  targetPreviousFacing?: CharacterFacing;
  dataPackets: DataPacket[];
  isManualUserTriggered: boolean;
}

export interface InteractionRequest {
  initiatorId: string;
  targetId: string;
  type: AgentInteractionType;
  topic?: string;
  isManual?: boolean;
}
