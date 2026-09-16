/**
 * JARVIS Agent Town — Environment Renderer
 * Step 7: High-Detail Canvas World Renderer for Reactive Rooms, Dynamic Lighting & Workstations
 */

import {
  RoomData,
  PathSegment,
  EnvironmentProp,
  AmbientDrone,
  InteractionPoint,
  RoomDynamicLighting,
  HubActivityLevel,
  WorkstationState
} from './types';
import { CameraState } from '../types';
import { WorldCoordinateSystem } from '../WorldCoordinateSystem';
import { TOWN_ROOMS, TOWN_PATHWAYS } from './EnvironmentData';

export class EnvironmentRenderer {
  /**
   * Render all rooms, floors, and environmental architecture with dynamic lighting
   */
  public static renderRooms(
    ctx: CanvasRenderingContext2D,
    cam: CameraState,
    activeSector: string,
    hoveredRoomId: string | null,
    roomLightings?: Map<string, RoomDynamicLighting>,
    elapsedTime: number = 0
  ) {
    for (const room of TOWN_ROOMS) {
      const isSectorActive =
        activeSector === 'ALL' ||
        activeSector === room.codename.split('//')[0].trim() ||
        (room.agentId && activeSector.includes(room.agentName.toUpperCase()));
      const isHovered = hoveredRoomId === room.id;
      const lighting = roomLightings?.get(room.id);
      const intensity = lighting ? lighting.intensity : 0.12;

      // Project 4 isometric room corners
      const pTop = WorldCoordinateSystem.worldToScreen({ x: room.bounds.minX, y: room.bounds.minY, z: 0 }, cam);
      const pRight = WorldCoordinateSystem.worldToScreen({ x: room.bounds.maxX, y: room.bounds.minY, z: 0 }, cam);
      const pBottom = WorldCoordinateSystem.worldToScreen({ x: room.bounds.maxX, y: room.bounds.maxY, z: 0 }, cam);
      const pLeft = WorldCoordinateSystem.worldToScreen({ x: room.bounds.minX, y: room.bounds.maxY, z: 0 }, cam);

      ctx.save();

      // 1. Room Floor Platform Fill with Dynamic Lighting
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.closePath();

      const hexAlpha = Math.max(10, Math.min(255, Math.floor(intensity * 255)))
        .toString(16)
        .padStart(2, '0');

      ctx.fillStyle = isHovered ? `${room.color}28` : isSectorActive ? `${room.color}${hexAlpha}` : 'rgba(255, 255, 255, 0.02)';
      ctx.fill();

      // 2. Room Outer Border & Ambient Glow
      ctx.strokeStyle = isHovered
        ? room.color
        : isSectorActive
        ? `${room.color}88`
        : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = isHovered ? 2.5 : 1.2;
      ctx.stroke();

      // 3. Cybernetic Corner Bracket Accents
      this.drawCornerBrackets(ctx, [pTop, pRight, pBottom, pLeft], room.color, cam.zoom);

      // 4. Stylized Room Header Tag
      const centerScreen = WorldCoordinateSystem.worldToScreen(room.center, cam);
      ctx.font = `${Math.max(9, 10.5 * cam.zoom)}px 'Orbitron', monospace`;
      ctx.fillStyle = isSectorActive ? room.color : 'rgba(255, 255, 255, 0.35)';
      ctx.textAlign = 'center';
      ctx.fillText(room.codename, centerScreen.x, pTop.y - 10 * cam.zoom);

      ctx.restore();
    }
  }

  /**
   * Render illuminated metallic walkways and flowing energy tracks
   */
  public static renderWalkways(
    ctx: CanvasRenderingContext2D,
    cam: CameraState,
    elapsedTime: number
  ) {
    ctx.save();
    for (const path of TOWN_PATHWAYS) {
      const p1 = WorldCoordinateSystem.worldToScreen(path.from, cam);
      const p2 = WorldCoordinateSystem.worldToScreen(path.to, cam);

      // 1. Walkway Metal Bed
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'rgba(8, 20, 48, 0.7)';
      ctx.lineWidth = path.width * cam.zoom * 0.45;
      ctx.stroke();

      // 2. Luminous Center Guide Strip
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `${path.color}44`;
      ctx.lineWidth = 2 * cam.zoom;
      ctx.stroke();

      // 3. Travelling Energy Pulse
      const t = (elapsedTime * path.pulseSpeed * 0.35) % 1;
      const pulseX = p1.x + (p2.x - p1.x) * t;
      const pulseY = p1.y + (p2.y - p1.y) * t;

      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 3 * cam.zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = path.color;
      ctx.shadowBlur = 10 * cam.zoom;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  /**
   * Render specialized reactive environment props
   */
  public static renderProp(
    ctx: CanvasRenderingContext2D,
    prop: EnvironmentProp,
    cam: CameraState,
    elapsedTime: number,
    workstationState: WorkstationState = 'IDLE',
    hubLevel: HubActivityLevel = 'CALM'
  ) {
    const p = WorldCoordinateSystem.worldToScreen(prop.position, cam);
    const z = cam.zoom;
    const w = prop.size.width * z * 0.5;
    const l = prop.size.length * z * 0.3;
    const h = prop.size.height * z * 0.6;
    const color = prop.color;
    const isActive = workstationState === 'ACTIVE' || workstationState === 'PROCESSING';

    ctx.save();
    ctx.translate(p.x, p.y);

    if (prop.type === 'QUANTUM_REACTOR_CORE') {
      // ── CENTRAL QUANTUM CORE REACTOR (Scales with Hub Activity Level) ──
      const rpmSpeed =
        hubLevel === 'HIGH_ACTIVITY' ? 4.5 : hubLevel === 'ACTIVE' ? 3.0 : hubLevel === 'LOW_ACTIVITY' ? 2.0 : 1.2;

      // Base Platform
      ctx.beginPath();
      ctx.ellipse(0, 0, 24 * z, 12 * z, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#02182b';
      ctx.strokeStyle = '#00e8ff';
      ctx.lineWidth = 1.5 * z;
      ctx.fill();
      ctx.stroke();

      // Dual Counter-Rotating Containment Rings
      ctx.beginPath();
      ctx.ellipse(0, -18 * z, 20 * z, 8 * z, elapsedTime * rpmSpeed, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 232, 255, 0.75)';
      ctx.lineWidth = 2 * z;
      ctx.setLineDash([4 * z, 4 * z]);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, -18 * z, 14 * z, 6 * z, -elapsedTime * (rpmSpeed * 1.3), 0, Math.PI * 2);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5 * z;
      ctx.stroke();
      ctx.setLineDash([]);

      // Central Plasma Core
      const corePulse = Math.sin(elapsedTime * rpmSpeed * 2.0) * 3 * z;
      ctx.beginPath();
      ctx.arc(0, -18 * z, (8 + corePulse * 0.4) * z, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00e8ff';
      ctx.shadowBlur = (15 + corePulse) * z;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (prop.type === 'CYBER_TERRARIUM') {
      // ── HOLOGRAPHIC BIO-DATA TERRARIUM (Central Hub) ──
      const floatWave = Math.sin(elapsedTime * 2.0) * 3 * z;

      ctx.beginPath();
      ctx.ellipse(0, 0, 16 * z, 8 * z, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 20, 15, 0.8)';
      ctx.strokeStyle = '#10e890';
      ctx.lineWidth = 1.5 * z;
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-6 * z, -12 * z - floatWave, 0, -22 * z - floatWave);
      ctx.strokeStyle = '#10e890';
      ctx.lineWidth = 2 * z;
      ctx.stroke();

      for (let leaf = 0; leaf < 4; leaf++) {
        const leafAngle = (leaf * Math.PI) / 2 + elapsedTime * 0.8;
        const lx = Math.cos(leafAngle) * 8 * z;
        const ly = -14 * z - floatWave + Math.sin(leafAngle) * 4 * z;

        ctx.beginPath();
        ctx.arc(lx, ly, 2.5 * z, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10e890';
        ctx.shadowBlur = 8 * z;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else if (prop.type === 'ROBOTIC_ARM') {
      // ── OPERATIONS ROBOTIC ARM ASSEMBLER (Bob) ──
      const armSpeed = isActive ? 5.5 : 2.5;
      const armAngle = Math.sin(elapsedTime * armSpeed) * 0.45;
      const baseR = 12 * z;

      // Base
      ctx.beginPath();
      ctx.ellipse(0, 0, baseR, baseR * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#431407';
      ctx.strokeStyle = '#f5a524';
      ctx.lineWidth = 1.5 * z;
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(0, -6 * z);
      ctx.rotate(armAngle);

      // Segment 1
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-3 * z, -16 * z, 6 * z, 16 * z);

      // Elbow Joint
      ctx.translate(0, -16 * z);
      ctx.rotate(-armAngle * 1.5 - 0.3);

      // Segment 2
      ctx.fillStyle = '#f5a524';
      ctx.fillRect(-2.5 * z, -14 * z, 5 * z, 14 * z);

      // Welding Head with Sparks if Active
      ctx.beginPath();
      ctx.arc(0, -14 * z, 3 * z, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = isActive ? 16 * z : 8 * z;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isActive && Math.sin(elapsedTime * 12.0) > 0.3) {
        // Welding Spark Particle
        for (let s = 0; s < 3; s++) {
          const sx = (Math.random() - 0.5) * 8 * z;
          const sy = -14 * z + (Math.random() - 0.5) * 8 * z;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5 * z, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }

      ctx.restore();
    } else if (prop.type === 'HOLO_MONITOR_ARRAY') {
      // ── ANALYTICAL HOLO-SCREEN (Alice / Bob) ──
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w, -h, w * 2, h);
      ctx.fillStyle = 'rgba(2, 6, 22, 0.9)';
      ctx.strokeStyle = isActive ? color : `${color}66`;
      ctx.lineWidth = 1.5 * z;
      ctx.fill();
      ctx.stroke();

      // Dynamic Scrolling Waveform
      const speed = isActive ? 6.0 : 2.0;
      ctx.beginPath();
      ctx.strokeStyle = isActive ? color : '#38bdf8';
      ctx.lineWidth = 1.2 * z;
      for (let i = 0; i < 8; i++) {
        const lx = -w + 4 * z + (i * (w * 2 - 8 * z)) / 7;
        const ly = -h / 2 + Math.sin(elapsedTime * speed + i * 0.8) * 6 * z;
        if (i === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();

      ctx.restore();
    } else if (prop.type === 'KNOWLEDGE_SHELVES') {
      // ── HOLOGRAPHIC KNOWLEDGE DATA SHELVES (Carol) ──
      ctx.beginPath();
      ctx.rect(-w, -h, w * 2, h);
      ctx.fillStyle = 'rgba(6, 12, 34, 0.9)';
      ctx.strokeStyle = isActive ? '#c084fc' : '#a855f7';
      ctx.lineWidth = 1.5 * z;
      ctx.fill();
      ctx.stroke();

      const tiers = 3;
      for (let t = 0; t < tiers; t++) {
        const tierY = -h + 8 * z + t * 12 * z;
        ctx.beginPath();
        ctx.moveTo(-w + 4 * z, tierY);
        ctx.lineTo(w - 4 * z, tierY);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 1 * z;
        ctx.stroke();

        for (let book = 0; book < 4; book++) {
          const bx = -w + 8 * z + book * 10 * z;
          const floatOffset = isActive ? Math.sin(elapsedTime * 3.0 + book) * 2 * z : 0;
          ctx.beginPath();
          ctx.rect(bx, tierY - 8 * z - floatOffset, 5 * z, 8 * z);
          ctx.fillStyle = book % 2 === 0 ? '#c084fc' : '#7e22ce';
          ctx.fill();
        }
      }
    } else if (prop.type === 'COMMAND_GLOBE_STATION') {
      // ── TACTICAL COMMAND GLOBE STATION (Dave) ──
      const globeRadius = 14 * z;

      ctx.beginPath();
      ctx.ellipse(0, 0, 16 * z, 8 * z, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#022c22';
      ctx.strokeStyle = '#10e890';
      ctx.lineWidth = 1.5 * z;
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(0, -20 * z);

      ctx.beginPath();
      ctx.arc(0, 0, globeRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(4, 40, 26, 0.7)';
      ctx.strokeStyle = '#10e890';
      ctx.lineWidth = 1.5 * z;
      ctx.shadowColor = '#10e890';
      ctx.shadowBlur = isActive ? 18 * z : 10 * z;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Rotating Radar Ring
      const radarSpeed = isActive ? 3.0 : 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, globeRadius * 1.1, globeRadius * 0.4, elapsedTime * radarSpeed, 0, Math.PI * 2);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5 * z;
      ctx.stroke();

      ctx.restore();
    } else if (prop.type === 'SERVER_RACK_UNIT') {
      // ── SERVER / COMPUTE / VAULT ARRAY ──
      this.drawStandardExtrudedProp(ctx, w, l, h, color, prop.secondaryColor, z);

      // Blinking Compute LEDs
      const ledRows = 4;
      for (let r = 0; r < ledRows; r++) {
        const blink = Math.sin(elapsedTime * 6.0 + r * 2) > 0.2;
        ctx.beginPath();
        ctx.arc(-w / 2, -h + 8 * z + r * 10 * z, 2 * z, 0, Math.PI * 2);
        ctx.fillStyle = blink ? color : '#0369a1';
        ctx.fill();
      }
    } else {
      this.drawStandardExtrudedProp(ctx, w, l, h, color, prop.secondaryColor, z);
    }

    ctx.restore();
  }

  private static drawStandardExtrudedProp(
    ctx: CanvasRenderingContext2D,
    w: number,
    l: number,
    h: number,
    color: string,
    secondaryColor: string,
    z: number
  ) {
    // Top Face
    ctx.beginPath();
    ctx.moveTo(0, -h - l);
    ctx.lineTo(w, -h);
    ctx.lineTo(0, -h + l);
    ctx.lineTo(-w, -h);
    ctx.closePath();
    ctx.fillStyle = secondaryColor || 'rgba(8, 18, 42, 0.95)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 * z;
    ctx.stroke();

    // Right Face
    ctx.beginPath();
    ctx.moveTo(0, -h + l);
    ctx.lineTo(w, -h);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, l);
    ctx.closePath();
    ctx.fillStyle = 'rgba(4, 10, 26, 0.95)';
    ctx.fill();
    ctx.strokeStyle = `${color}44`;
    ctx.stroke();

    // Left Face
    ctx.beginPath();
    ctx.moveTo(0, -h + l);
    ctx.lineTo(-w, -h);
    ctx.lineTo(-w, 0);
    ctx.lineTo(0, l);
    ctx.closePath();
    ctx.fillStyle = 'rgba(2, 6, 18, 0.95)';
    ctx.fill();
    ctx.strokeStyle = `${color}44`;
    ctx.stroke();
  }

  public static updateAndRenderDrone(
    ctx: CanvasRenderingContext2D,
    drone: AmbientDrone,
    cam: CameraState,
    deltaTime: number,
    elapsedTime: number
  ) {
    const target = drone.targetWaypoints[drone.currentWaypointIndex];
    if (target) {
      const dx = target.x - drone.position.x;
      const dy = target.y - drone.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        drone.currentWaypointIndex = (drone.currentWaypointIndex + 1) % drone.targetWaypoints.length;
      } else {
        const moveDist = drone.speed * deltaTime;
        drone.position.x += (dx / dist) * moveDist;
        drone.position.y += (dy / dist) * moveDist;
        drone.rotation = Math.atan2(dy, dx);
      }
    }

    drone.bobPhase += deltaTime * 3.0;
    const bob = Math.sin(drone.bobPhase) * 3;

    const p = WorldCoordinateSystem.worldToScreen({
      x: drone.position.x,
      y: drone.position.y,
      z: (drone.position.z ?? 0) + bob
    }, cam);

    const z = cam.zoom;
    const r = 8 * z;

    ctx.save();
    ctx.translate(p.x, p.y);

    const shadowPos = WorldCoordinateSystem.worldToScreen({
      x: drone.position.x,
      y: drone.position.y,
      z: 0
    }, cam);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, shadowPos.y - p.y, 10 * z, 5 * z, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 6, 18, 0.5)';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#082f49';
    ctx.strokeStyle = '#00e8ff';
    ctx.lineWidth = 1.5 * z;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(Math.cos(drone.rotation) * 3 * z, Math.sin(drone.rotation) * 2 * z, 2.5 * z, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#00e8ff';
    ctx.shadowBlur = 8 * z;
    ctx.fill();
    ctx.shadowBlur = 0;

    for (let jet = 0; jet < 2; jet++) {
      const jx = (jet === 0 ? -6 : 6) * z;
      ctx.beginPath();
      ctx.arc(jx, 5 * z, 1.8 * z, 0, Math.PI * 2);
      ctx.fillStyle = '#00e8ff';
      ctx.fill();
    }

    ctx.restore();
  }

  public static renderInteractionPoints(
    ctx: CanvasRenderingContext2D,
    cam: CameraState,
    hoveredPointId: string | null,
    elapsedTime: number
  ) {
    for (const room of TOWN_ROOMS) {
      for (const pt of room.interactionPoints) {
        const p = WorldCoordinateSystem.worldToScreen(pt.position, cam);
        const z = cam.zoom;
        const isHovered = hoveredPointId === pt.id;

        ctx.save();
        ctx.translate(p.x, p.y);

        const pulse = Math.sin(elapsedTime * 3.0 + p.x) * 0.3 + 0.7;
        const r = (isHovered ? 18 : 12) * z;

        ctx.beginPath();
        ctx.ellipse(0, 0, r * pulse, r * 0.5 * pulse, 0, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? pt.primaryColor : `${pt.primaryColor}55`;
        ctx.lineWidth = isHovered ? 2 * z : 1 * z;
        ctx.setLineDash(isHovered ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isHovered) {
          ctx.strokeStyle = pt.primaryColor;
          ctx.lineWidth = 1.5 * z;
          const s = 22 * z;
          ctx.beginPath();
          ctx.moveTo(-s, -s / 2);
          ctx.lineTo(-s + 6 * z, -s / 2);
          ctx.moveTo(-s, -s / 2);
          ctx.lineTo(-s, -s / 2 + 4 * z);

          ctx.moveTo(s, -s / 2);
          ctx.lineTo(s - 6 * z, -s / 2);
          ctx.moveTo(s, -s / 2);
          ctx.lineTo(s, -s / 2 + 4 * z);
          ctx.stroke();
        }

        ctx.restore();
      }
    }
  }

  private static drawCornerBrackets(
    ctx: CanvasRenderingContext2D,
    corners: { x: number; y: number }[],
    color: string,
    zoom: number
  ) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (const c of corners) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 2.5 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}
