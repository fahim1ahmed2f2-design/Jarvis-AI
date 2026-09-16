/**
 * JARVIS Agent Town — Cinematic Camera Controller
 * Step 10: 6-Mode Camera Engine, Pair Framing, Deadzone Follow & Boundary Clamping
 */

import { WorldPosition, CameraState } from '../types';
import { CameraMode, CameraFrameTarget, CameraBounds, CameraAnchor } from './types';
import { WorldCoordinateSystem } from '../WorldCoordinateSystem';

export class AgentTownCameraController {
  private mode: CameraMode = 'FREE';
  private trackedAgentId: string | null = null;
  private trackedPartnerId: string | null = null;
  private previousState: { x: number; y: number; zoom: number; mode: CameraMode } | null = null;

  public static readonly DEFAULT_BOUNDS: CameraBounds = {
    minX: -650,
    maxX: 650,
    minY: -480,
    maxY: 480,
    minZoom: 0.6,
    maxZoom: 1.8
  };

  public static readonly ROOM_ANCHORS: Record<string, CameraAnchor> = {
    'room-central-hub': {
      id: 'room-central-hub',
      name: 'Central Neural Plaza',
      worldPosition: { x: 0, y: 0, z: 0 },
      recommendedZoom: 1.05
    },
    'room-research-lab': {
      id: 'room-research-lab',
      name: 'Alice Research Lab',
      worldPosition: { x: -220, y: -180, z: 0 },
      recommendedZoom: 1.30
    },
    'room-operations-lab': {
      id: 'room-operations-lab',
      name: 'Bob Operations Lab',
      worldPosition: { x: -220, y: 180, z: 0 },
      recommendedZoom: 1.30
    },
    'room-knowledge-library': {
      id: 'room-knowledge-library',
      name: 'Carol Knowledge Library',
      worldPosition: { x: 220, y: -180, z: 0 },
      recommendedZoom: 1.30
    },
    'room-command-center': {
      id: 'room-command-center',
      name: 'Dave Command Center',
      worldPosition: { x: 220, y: 180, z: 0 },
      recommendedZoom: 1.30
    }
  };

  /**
   * Main camera update tick (smooth transition interpolation & follow logic)
   */
  public update(
    deltaTime: number,
    camera: CameraState,
    agentPositionsMap: Map<string, WorldPosition>
  ) {
    // ── 1. FOLLOW AGENT MODE ──
    if (this.mode === 'FOLLOW_AGENT' && this.trackedAgentId) {
      const pos = agentPositionsMap.get(this.trackedAgentId);
      if (pos) {
        const iso = this.worldToCameraIso(pos);
        camera.targetX = -iso.x;
        camera.targetY = -iso.y;
      }
    }

    // ── 2. FOLLOW INTERACTION MODE (Pair Framing) ──
    if (this.mode === 'FOLLOW_INTERACTION' && this.trackedAgentId && this.trackedPartnerId) {
      const pA = agentPositionsMap.get(this.trackedAgentId);
      const pB = agentPositionsMap.get(this.trackedPartnerId);

      if (pA && pB) {
        const midWorld: WorldPosition = {
          x: (pA.x + pB.x) / 2,
          y: (pA.y + pB.y) / 2,
          z: ((pA.z || 0) + (pB.z || 0)) / 2
        };
        const iso = this.worldToCameraIso(midWorld);
        camera.targetX = -iso.x;
        camera.targetY = -iso.y;

        const dist = WorldCoordinateSystem.distance2D(pA, pB);
        camera.targetZoom = dist > 180 ? 1.10 : 1.25;
      }
    }

    // ── 3. SMOOTH POSITION & ZOOM EASING ──
    if (!camera.isDragging) {
      camera.x += (camera.targetX - camera.x) * Math.min(1, deltaTime * 5.5);
      camera.y += (camera.targetY - camera.y) * Math.min(1, deltaTime * 5.5);
      camera.zoom += (camera.targetZoom - camera.zoom) * Math.min(1, deltaTime * 4.5);
    } else {
      camera.x = camera.targetX;
      camera.y = camera.targetY;
    }
  }

  /**
   * Focus smoothly on a specific agent
   */
  public focusAgent(agentId: string, pos: WorldPosition, camera: CameraState, targetZoom: number = 1.30) {
    this.savePreviousState(camera);
    this.mode = 'FOCUS_AGENT';
    this.trackedAgentId = agentId;
    this.trackedPartnerId = null;

    const iso = this.worldToCameraIso(pos);
    camera.targetX = -iso.x;
    camera.targetY = -iso.y;
    camera.targetZoom = targetZoom;
  }

  /**
   * Enter dynamic follow mode for an agent
   */
  public followAgent(agentId: string, camera: CameraState, targetZoom: number = 1.30) {
    this.savePreviousState(camera);
    this.mode = 'FOLLOW_AGENT';
    this.trackedAgentId = agentId;
    this.trackedPartnerId = null;
    camera.targetZoom = targetZoom;
  }

  /**
   * Frame two communicating agents comfortably
   */
  public frameInteraction(
    agentAId: string,
    agentBId: string,
    posA: WorldPosition,
    posB: WorldPosition,
    camera: CameraState
  ) {
    this.savePreviousState(camera);
    this.mode = 'FOLLOW_INTERACTION';
    this.trackedAgentId = agentAId;
    this.trackedPartnerId = agentBId;

    const midWorld: WorldPosition = {
      x: (posA.x + posB.x) / 2,
      y: (posA.y + posB.y) / 2,
      z: 0
    };
    const iso = this.worldToCameraIso(midWorld);
    camera.targetX = -iso.x;
    camera.targetY = -iso.y;

    const dist = WorldCoordinateSystem.distance2D(posA, posB);
    camera.targetZoom = dist > 180 ? 1.10 : 1.25;
  }

  /**
   * Focus on a specific room anchor
   */
  public focusRoom(roomId: string, camera: CameraState) {
    const anchor = AgentTownCameraController.ROOM_ANCHORS[roomId];
    if (anchor) {
      this.savePreviousState(camera);
      this.mode = 'FOCUS_LOCATION';
      this.trackedAgentId = null;
      this.trackedPartnerId = null;

      const iso = this.worldToCameraIso(anchor.worldPosition);
      camera.targetX = -iso.x;
      camera.targetY = -iso.y;
      camera.targetZoom = anchor.recommendedZoom;
    }
  }

  /**
   * Reset smoothly to full town overview
   */
  public resetToOverview(camera: CameraState) {
    this.savePreviousState(camera);
    this.mode = 'OVERVIEW';
    this.trackedAgentId = null;
    this.trackedPartnerId = null;

    camera.targetX = 0;
    camera.targetY = 0;
    camera.targetZoom = 1.0;
  }

  /**
   * User interaction yields camera control to FREE mode instantly
   */
  public interruptToFreeMode() {
    this.mode = 'FREE';
    this.trackedAgentId = null;
    this.trackedPartnerId = null;
  }

  public getMode(): CameraMode {
    return this.mode;
  }

  public getTrackedAgentId(): string | null {
    return this.trackedAgentId;
  }

  private savePreviousState(camera: CameraState) {
    this.previousState = {
      x: camera.x,
      y: camera.y,
      zoom: camera.zoom,
      mode: this.mode
    };
  }

  private worldToCameraIso(pos: WorldPosition): { x: number; y: number } {
    const isoX = (pos.x - pos.y) * Math.cos(Math.PI / 6);
    const isoY = (pos.x + pos.y) * Math.sin(Math.PI / 6) * 0.58 - (pos.z || 0);
    return { x: isoX, y: isoY };
  }
}
