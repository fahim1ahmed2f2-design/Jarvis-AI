/**
 * JARVIS Agent Town v4.0 Sovereign — Realistic Tech Office Campus Renderer
 * 
 * Ultra-Detailed Realistic Silicon Valley Office World:
 * - 👑 Executive Boardroom with 85" Display & Leather Swivel Chairs
 * - 🔬 AI Cleanroom Lab with Glass Whiteboards & Cyan Deep Learning Racks
 * - 📚 Mahogany Wood Library with Oak Bookshelves & Brass Banker's Lamp
 * - 🎨 UX Design Studio with Color Swatches, Easels & Sectional Sofas
 * - 🛡️ Cyber Threat War Room with Live Global Radar Wall
 * - ⚡ Engineering Open-Plan Bay with Multi-Monitor Code Terminals
 * - 🎖️ Tactical Command Center with Interactive Mission Map
 * - ☕ Tech Pantry & Lounge with Artisan Espresso Bar, Ping-Pong Table & Terrazzo Floor
 */

import { CameraState, ScreenPosition, WorldPosition } from '../types';
import { PIXEL_ROOMS, PIXEL_DESKS, PIXEL_FURNITURE, PixelRoom, PixelFurniture } from './PixelOfficeData';

export class PixelOfficeRenderer {
  public static readonly WORLD_CENTER_X = 800;
  public static readonly WORLD_CENTER_Y = 600;

  /**
   * Projects 2D World coordinates (x, y) to Screen pixels centered in the canvas viewport
   */
  public static worldToScreen2D(
    worldPos: { x: number; y: number },
    camera: CameraState
  ): ScreenPosition {
    const scale = camera.zoom;
    const sx = (worldPos.x - this.WORLD_CENTER_X + camera.x) * scale + camera.viewportWidth / 2;
    const sy = (worldPos.y - this.WORLD_CENTER_Y + camera.y) * scale + camera.viewportHeight / 2;
    return { x: sx, y: sy };
  }

  /**
   * Projects Screen pixels back to 2D World coordinates
   */
  public static screenToWorld2D(
    screenPos: ScreenPosition,
    camera: CameraState
  ): { x: number; y: number } {
    const scale = camera.zoom;
    const wx = (screenPos.x - camera.viewportWidth / 2) / scale - camera.x + this.WORLD_CENTER_X;
    const wy = (screenPos.y - camera.viewportHeight / 2) / scale - camera.y + this.WORLD_CENTER_Y;
    return { x: wx, y: wy };
  }

  /**
   * Main render pass for the realistic Silicon Valley Tech Campus
   */
  public static renderWorld(
    ctx: CanvasRenderingContext2D,
    camera: CameraState,
    hoveredId: string | null,
    selectedId: string | null,
    elapsedTime: number
  ) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;

    // 1. Campus Foundation & Floor Boundary
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);

    // 2. Render Modern Hallway Connections & Walkways
    this.drawCorridors(ctx, camera, elapsedTime);

    // 3. Render 8 Dedicated Modern Office Suites
    for (const room of PIXEL_ROOMS) {
      this.drawRoom(ctx, room, camera, elapsedTime);
    }

    // 4. Render Realistic Glass Walls & Doorways
    this.drawGlassPartitions(ctx, camera);

    // 5. Render High-Tech Office Furniture, Displays, Desks & Coffee Bar
    for (const item of PIXEL_FURNITURE) {
      this.drawFurniture(ctx, item, camera, elapsedTime);
    }

    // 6. Render Room Entrance Acrylic Signs & Department Tags
    for (const room of PIXEL_ROOMS) {
      this.drawRoomHeaderSign(ctx, room, camera);
    }

    ctx.restore();
  }

  private static drawCorridors(ctx: CanvasRenderingContext2D, camera: CameraState, elapsedTime: number) {
    const s = camera.zoom;

    // Modern Polished Slate Walkway Corridors
    const h1 = this.worldToScreen2D({ x: 20, y: 360 }, camera);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(h1.x, h1.y, 1560 * s, 40 * s);

    const h2 = this.worldToScreen2D({ x: 20, y: 760 }, camera);
    ctx.fillRect(h2.x, h2.y, 1560 * s, 40 * s);

    const v1 = this.worldToScreen2D({ x: 500, y: 20 }, camera);
    ctx.fillRect(v1.x, v1.y, 40 * s, 1160 * s);

    const v2 = this.worldToScreen2D({ x: 1060, y: 20 }, camera);
    ctx.fillRect(v2.x, v2.y, 40 * s, 1160 * s);

    // Subtle Corridor LED Floor Guidelights
    ctx.strokeStyle = 'rgba(0, 232, 255, 0.2)';
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(h1.x, h1.y + 18 * s, 1560 * s, 4 * s);
    ctx.strokeRect(h2.x, h2.y + 18 * s, 1560 * s, 4 * s);
  }

  private static drawRoom(
    ctx: CanvasRenderingContext2D,
    room: PixelRoom,
    camera: CameraState,
    elapsedTime: number
  ) {
    const p = this.worldToScreen2D({ x: room.x, y: room.y }, camera);
    const w = room.width * camera.zoom;
    const h = room.height * camera.zoom;
    const s = camera.zoom;

    // ── DISTINCT REALISTIC FLOOR PATTERNS PER ROOM ──
    if (room.floorType === 'PENTHOUSE_GOLD_MARBLE') {
      // 👑 Executive Boardroom: Deep Polished Obsidian Marble with Gold Inlays
      ctx.fillStyle = '#0a0e1c';
      ctx.fillRect(p.x, p.y, w, h);

      // Gold Marble Tile Grid
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.22)';
      ctx.lineWidth = 1;
      const tileSize = 32 * s;
      for (let x = p.x; x < p.x + w; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + h);
        ctx.stroke();
      }
      for (let y = p.y; y < p.y + h; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + w, y);
        ctx.stroke();
      }

      // Executive Navy Blue Inlay Rug
      const rugX = p.x + 60 * s;
      const rugY = p.y + 60 * s;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(rugX, rugY, w - 120 * s, h - 120 * s);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(rugX, rugY, w - 120 * s, h - 120 * s);
    } else if (room.floorType === 'PARQUET_MAHOGANY') {
      // 📚 Carol's Knowledge Library: Rich Hardwood Mahogany Planks
      ctx.fillStyle = '#1c130c';
      ctx.fillRect(p.x, p.y, w, h);

      const plankHeight = 16 * s;
      const plankWidth = 54 * s;
      ctx.strokeStyle = '#2b1b10';
      ctx.lineWidth = 1;
      let row = 0;
      for (let y = p.y; y < p.y + h; y += plankHeight) {
        const offset = (row % 2) * (plankWidth / 2);
        for (let x = p.x - plankWidth + offset; x < p.x + w; x += plankWidth) {
          ctx.strokeRect(x, y, plankWidth, plankHeight);
        }
        row++;
      }

      // Center Persian Reading Rug
      const rugX = p.x + 90 * s;
      const rugY = p.y + 110 * s;
      ctx.fillStyle = '#311432';
      ctx.fillRect(rugX, rugY, w - 180 * s, h - 160 * s);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(rugX, rugY, w - 180 * s, h - 160 * s);
    } else if (room.floorType === 'LAB_CYAN_TILE') {
      // 🔬 Alice's AI Lab: Seamless High-Tech Epoxy Cleanroom Cyan Tiles
      ctx.fillStyle = '#031926';
      ctx.fillRect(p.x, p.y, w, h);

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      const tileSize = 24 * s;
      for (let x = p.x; x < p.x + w; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + h);
        ctx.stroke();
      }
      for (let y = p.y; y < p.y + h; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + w, y);
        ctx.stroke();
      }

      // Anti-Static Computing Floor Mat
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fillRect(p.x + 50 * s, p.y + 60 * s, w - 100 * s, h - 110 * s);
    } else if (room.floorType === 'STUDIO_PASTEL') {
      // 🎨 Tuly's Design Studio: Scandinavian Light Birchwood & Creative Palette
      ctx.fillStyle = '#18121e';
      ctx.fillRect(p.x, p.y, w, h);

      // Light Wood Planks
      ctx.strokeStyle = '#271b30';
      ctx.lineWidth = 1;
      const plankHeight = 18 * s;
      for (let y = p.y; y < p.y + h; y += plankHeight) {
        ctx.beginPath();
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + w, y);
        ctx.stroke();
      }

      // Pastel Geometric Design Rug
      const rugX = p.x + 80 * s;
      const rugY = p.y + 110 * s;
      ctx.fillStyle = '#4a044e';
      ctx.fillRect(rugX, rugY, w - 160 * s, h - 160 * s);
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(rugX, rugY, w - 160 * s, h - 160 * s);
    } else if (room.floorType === 'CYBER_STEEL') {
      // 🛡️ Jonson & Knox Cyber Defense: Tactical Heavy Steel Plating
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(p.x, p.y, w, h);

      ctx.strokeStyle = '#232936';
      ctx.lineWidth = 1.5;
      const panelSize = 36 * s;
      for (let x = p.x; x < p.x + w; x += panelSize) {
        for (let y = p.y; y < p.y + h; y += panelSize) {
          ctx.strokeRect(x, y, panelSize, panelSize);
        }
      }

      // Tactical Red Ops Zone Boundary
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(p.x + 40 * s, p.y + 60 * s, w - 80 * s, h - 100 * s);
    } else if (room.floorType === 'WORKSHOP_GRID') {
      // ⚡ Bob & Mob Engineering Bay: Tech Polished Concrete Grid
      ctx.fillStyle = '#111827';
      ctx.fillRect(p.x, p.y, w, h);

      ctx.strokeStyle = 'rgba(245, 165, 36, 0.20)';
      ctx.lineWidth = 1;
      const gridSize = 26 * s;
      for (let x = p.x; x < p.x + w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + h);
        ctx.stroke();
      }
      for (let y = p.y; y < p.y + h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + w, y);
        ctx.stroke();
      }

      // Anti-Fatigue Dev Standing Mats under desks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x + 80 * s, p.y + 90 * s, 160 * s, 80 * s);
      ctx.fillRect(p.x + 240 * s, p.y + 90 * s, 160 * s, 80 * s);
    } else if (room.floorType === 'COMMAND_NAVY') {
      // 🎖️ Dave's Command HQ: Tactical Navy Acoustic Carpet
      ctx.fillStyle = '#061727';
      ctx.fillRect(p.x, p.y, w, h);

      ctx.strokeStyle = 'rgba(16, 232, 144, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x + 20 * s, p.y + 20 * s, w - 40 * s, h - 40 * s);

      // Strategy Table Hex Grid Underlay
      ctx.fillStyle = 'rgba(16, 232, 144, 0.06)';
      ctx.fillRect(p.x + 60 * s, p.y + 50 * s, w - 120 * s, 120 * s);
    } else if (room.floorType === 'PLAZA_TERRAZZO') {
      // ☕ Central Tech Pantry & Cafeteria: Italian Terrazzo Marble with Cafe Ambience
      ctx.fillStyle = '#0c1524';
      ctx.fillRect(p.x, p.y, w, h);

      // Terrazzo Subtle Tile Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      const tileSize = 32 * s;
      for (let x = p.x; x < p.x + w; x += tileSize) {
        for (let y = p.y; y < p.y + h; y += tileSize) {
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }

      // Central Decorative Courtyard Circle
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.beginPath();
      ctx.arc(p.x + w / 2, p.y + h / 2, 110 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2 * s;
      ctx.stroke();
    }
  }

  private static drawGlassPartitions(ctx: CanvasRenderingContext2D, camera: CameraState) {
    const s = camera.zoom;

    // Outer Modern Glass Walls with Aluminium Bevels
    for (const room of PIXEL_ROOMS) {
      const p = this.worldToScreen2D({ x: room.x, y: room.y }, camera);
      const w = room.width * s;
      const h = room.height * s;

      // Outer Wall Solid Frame
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Frosted Glass Reflection Highlight
      ctx.strokeStyle = `${room.accentColor}60`;
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(p.x + 2 * s, p.y + 2 * s, w - 4 * s, h - 4 * s);

      // Glass Doorway Opening (Door gap)
      let doorX = p.x + w / 2 - 25 * s;
      let doorY = p.y + h - 4 * s;
      if (room.id === 'room_jarvis_penthouse') {
        doorY = p.y + h - 4 * s;
      }
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(doorX, doorY, 50 * s, 8 * s);
    }
  }

  private static drawRoomHeaderSign(ctx: CanvasRenderingContext2D, room: PixelRoom, camera: CameraState) {
    const s = camera.zoom;
    const p = this.worldToScreen2D({ x: room.x + 12, y: room.y + 10 }, camera);

    if (s < 0.55) return; // Skip if zoomed far out

    // Acrylic Illuminated Wall Signboard
    ctx.save();
    ctx.fillStyle = 'rgba(4, 9, 24, 0.88)';
    ctx.fillRect(p.x, p.y, 220 * s, 26 * s);
    ctx.strokeStyle = `${room.accentColor}80`;
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(p.x, p.y, 220 * s, 26 * s);

    // Accent LED dot
    ctx.fillStyle = room.accentColor;
    ctx.beginPath();
    ctx.arc(p.x + 10 * s, p.y + 13 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Sign Text
    ctx.font = `bold ${Math.max(8, 10 * s)}px 'Share Tech Mono', monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${room.icon} ${room.name.toUpperCase()}`, p.x + 20 * s, p.y + 17 * s);
    ctx.restore();
  }

  private static drawFurniture(
    ctx: CanvasRenderingContext2D,
    item: PixelFurniture,
    camera: CameraState,
    elapsedTime: number
  ) {
    const p = this.worldToScreen2D({ x: item.x, y: item.y }, camera);
    const w = item.width * camera.zoom;
    const h = item.height * camera.zoom;
    const s = camera.zoom;

    ctx.save();

    // ── 0. DROP SHADOW (Directional Soft Shadow under all furniture) ──
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(p.x + 4 * s, p.y + 6 * s, w, h);

    // ── 1. MODERN DESKS (With Multi-Monitors, Keyboards, Coffee Mugs & Cable Trays) ──
    if (item.type === 'DESK') {
      const isExec = item.extra?.isExecutive;
      // Desk Table Top (Rich walnut / Matte charcoal)
      ctx.fillStyle = isExec ? '#1e1b4b' : '#1e293b';
      ctx.fillRect(p.x, p.y, w, h);

      // Desk Bevel Edging
      ctx.strokeStyle = isExec ? '#eab308' : '#475569';
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Desk Leather Pad
      const padW = w * 0.65;
      const padH = h * 0.55;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x + (w - padW) / 2, p.y + (h - padH) / 2, padW, padH);

      // Keyboards
      ctx.fillStyle = '#334155';
      ctx.fillRect(p.x + (w - padW) / 2 + 10 * s, p.y + h - 14 * s, 34 * s, 8 * s);

      // Ceramic Coffee Mug with animated steam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x + w - 12 * s, p.y + h - 12 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();

      // Monitors on Desk Top
      const monitorCount = item.extra?.monitors || 2;
      const monW = 26 * s;
      const monH = 16 * s;
      const monStartX = p.x + (w - monitorCount * (monW + 4 * s)) / 2;

      for (let i = 0; i < monitorCount; i++) {
        const mx = monStartX + i * (monW + 4 * s);
        const my = p.y + 4 * s;

        // Monitor Bezel
        ctx.fillStyle = '#090d16';
        ctx.fillRect(mx, my, monW, monH);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, monW, monH);

        // Screen Glow (Showing code lines / waveforms)
        const screenColor = isExec ? '#eab308' : i === 0 ? '#00e8ff' : '#10b981';
        ctx.fillStyle = `${screenColor}30`;
        ctx.fillRect(mx + 1.5 * s, my + 1.5 * s, monW - 3 * s, monH - 3 * s);

        // Code / Graph lines on monitor
        ctx.strokeStyle = screenColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mx + 4 * s, my + 5 * s);
        ctx.lineTo(mx + monW - 6 * s, my + 5 * s);
        ctx.moveTo(mx + 4 * s, my + 9 * s);
        ctx.lineTo(mx + monW - 10 * s, my + 9 * s);
        ctx.stroke();
      }

      // Ergonomic Mesh Swivel Chair behind desk
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(p.x + w / 2, p.y + h + 10 * s, 9 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.stroke();
    }

    // ── 2. EXECUTIVE BOARDROOM CONFERENCE TABLE ──
    else if (item.type === 'BOARDROOM_TABLE') {
      // Walnut Table Top
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Embedded Center Glass Video Array
      ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
      ctx.fillRect(p.x + 20 * s, p.y + 14 * s, w - 40 * s, h - 28 * s);

      // 6 Executive Leather Swivel Chairs around table
      const chairPositions = [
        { x: p.x + 35 * s, y: p.y - 10 * s },
        { x: p.x + w / 2, y: p.y - 10 * s },
        { x: p.x + w - 35 * s, y: p.y - 10 * s },
        { x: p.x + 35 * s, y: p.y + h + 10 * s },
        { x: p.x + w / 2, y: p.y + h + 10 * s },
        { x: p.x + w - 35 * s, y: p.y + h + 10 * s }
      ];

      for (const ch of chairPositions) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ch.x, ch.y, 8 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1 * s;
        ctx.stroke();
      }
    }

    // ── 3. 85" WALL PRESENTATION DISPLAY ──
    else if (item.type === 'WALL_DISPLAY') {
      ctx.fillStyle = '#020617';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Live Bar Charts & Data Telemetry
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${Math.max(6, 8 * s)}px 'Share Tech Mono', monospace`;
      ctx.fillText(item.label || 'SYSTEM DISPLAY', p.x + 8 * s, p.y + 12 * s);

      // Animated mini telemetry bars
      const barCount = 6;
      for (let i = 0; i < barCount; i++) {
        const barH = (8 + Math.sin(elapsedTime * 2 + i) * 6) * s;
        ctx.fillStyle = i % 2 === 0 ? '#00e8ff' : '#10b981';
        ctx.fillRect(p.x + 12 * s + i * 16 * s, p.y + h - barH - 6 * s, 10 * s, barH);
      }
    }

    // ── 4. ARTISAN ESPRESSO COFFEE BAR ──
    else if (item.type === 'COFFEE_BAR') {
      // Wood & Quartz Countertop
      ctx.fillStyle = '#1e130c';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Espresso Machine on Counter
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(p.x + 15 * s, p.y + 8 * s, 34 * s, 26 * s);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(p.x + 15 * s, p.y + 8 * s, 34 * s, 26 * s);

      // Coffee Grinder & Syrup Bottles
      ctx.fillStyle = '#475569';
      ctx.fillRect(p.x + 55 * s, p.y + 10 * s, 16 * s, 22 * s);

      // Blackboard Menu
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x + 80 * s, p.y + 6 * s, 48 * s, 22 * s);
      ctx.fillStyle = '#fef08a';
      ctx.font = `bold ${Math.max(5, 6 * s)}px 'Share Tech Mono', monospace`;
      ctx.fillText('☕ ESPRESSO', p.x + 84 * s, p.y + 14 * s);
      ctx.fillText('🥛 LATTE', p.x + 84 * s, p.y + 22 * s);
    }

    // ── 5. PING-PONG / TABLE TENNIS TABLE ──
    else if (item.type === 'PING_PONG_TABLE') {
      // Green Table Top
      ctx.fillStyle = '#15803d';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // White Center Boundary Line
      ctx.beginPath();
      ctx.moveTo(p.x + w / 2, p.y);
      ctx.lineTo(p.x + w / 2, p.y + h);
      ctx.stroke();

      // Table Tennis Net in Middle
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(p.x, p.y + h / 2 - 2 * s, w, 4 * s);

      // Red and Blue Ping Pong Paddles
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(p.x + w * 0.25, p.y + h * 0.25, 4 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(p.x + w * 0.75, p.y + h * 0.75, 4 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── 6. ENTERPRISE SERVER RACKS (With Animated Blinking LEDs) ──
    else if (item.type === 'SERVER_RACK') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Server Units (U-Slots)
      const slotCount = 5;
      const ledColor = item.extra?.leds === 'CYAN' ? '#00e8ff' : item.extra?.leds === 'RED' ? '#ef4444' : '#f59e0b';
      for (let i = 0; i < slotCount; i++) {
        const sy = p.y + 4 * s + i * (h / slotCount);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(p.x + 3 * s, sy, w - 6 * s, h / slotCount - 2 * s);

        // Blinking LEDs
        const isBlinking = Math.sin(elapsedTime * 4 + i * 2) > 0;
        ctx.fillStyle = isBlinking ? ledColor : '#334155';
        ctx.beginPath();
        ctx.arc(p.x + 8 * s, sy + 4 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isBlinking ? '#10b981' : '#334155';
        ctx.beginPath();
        ctx.arc(p.x + 14 * s, sy + 4 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── 7. LUSH OFFICE PLANTS (Monstera, Ficus, Snake Plants) ──
    else if (item.type === 'PLANT') {
      // Terracotta Pot
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.arc(p.x + w / 2, p.y + h - 6 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();

      // Multi-Layer Lush Green Leaves
      const leafColors = ['#15803d', '#22c55e', '#16a34a', '#4ade80'];
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5 + Math.sin(elapsedTime + i) * 0.1;
        const lx = p.x + w / 2 + Math.cos(ang) * 9 * s;
        const ly = p.y + h / 2 - 4 * s + Math.sin(ang) * 9 * s;
        ctx.fillStyle = leafColors[i % leafColors.length];
        ctx.beginPath();
        ctx.arc(lx, ly, 6 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── 8. WHITEBOARD / GLASS EQUATIONS BOARD ──
    else if (item.type === 'WHITEBOARD') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Diagram & Math formulas
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${Math.max(6, 8 * s)}px 'Share Tech Mono', monospace`;
      ctx.fillText(item.label || 'Whiteboard', p.x + 8 * s, p.y + 14 * s);

      // Marker Tray at bottom
      ctx.fillStyle = '#64748b';
      ctx.fillRect(p.x + 10 * s, p.y + h - 3 * s, w - 20 * s, 3 * s);
    }

    // ── 9. SECTIONAL LOUNGE SOFAS ──
    else if (item.type === 'SECTIONAL_COUCH' || item.type === 'COUCH') {
      ctx.fillStyle = item.color || '#1e293b';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Plush Cushions
      const cushionW = w * 0.45;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(p.x + 4 * s, p.y + 4 * s, cushionW, h - 8 * s);
      ctx.fillRect(p.x + w - cushionW - 4 * s, p.y + 4 * s, cushionW, h - 8 * s);
    }

    // ── 10. SNACK & BEVERAGE VENDING MACHINE ──
    else if (item.type === 'VENDING_MACHINE') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#00e8ff';
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Glass Snack View Window
      ctx.fillStyle = 'rgba(0, 232, 255, 0.15)';
      ctx.fillRect(p.x + 6 * s, p.y + 6 * s, w - 12 * s, h * 0.65);

      // Snack Shelves
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x + 6 * s, p.y + h * 0.3);
      ctx.lineTo(p.x + w - 6 * s, p.y + h * 0.3);
      ctx.moveTo(p.x + 6 * s, p.y + h * 0.5);
      ctx.lineTo(p.x + w - 6 * s, p.y + h * 0.5);
      ctx.stroke();

      // Coin Slot / Dispenser
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x + 10 * s, p.y + h - 12 * s, w - 20 * s, 8 * s);
    }

    // ── 11. WATER COOLER / DISPENSER ──
    else if (item.type === 'WATER_COOLER') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x + 4 * s, p.y + 14 * s, w - 8 * s, h - 14 * s);

      // Blue Water Bottle on Top
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(p.x + w / 2, p.y + 9 * s, 7 * s, 0, Math.PI * 2);
      ctx.fill();

      // Water Spouts
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p.x + 7 * s, p.y + 20 * s, 3 * s, 4 * s);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(p.x + w - 10 * s, p.y + 20 * s, 3 * s, 4 * s);
    }

    // ── 12. TACTICAL CYBER THREAT RADAR ──
    else if (item.type === 'CYBER_RADAR') {
      ctx.fillStyle = '#020617';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Pulsing Radar Rings
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(p.x + w / 2, p.y + h / 2, (h * 0.35), 0, Math.PI * 2);
      ctx.stroke();

      // Rotating Radar Sweep Line
      const sweepAng = elapsedTime * 3;
      ctx.beginPath();
      ctx.moveTo(p.x + w / 2, p.y + h / 2);
      ctx.lineTo(
        p.x + w / 2 + Math.cos(sweepAng) * (h * 0.38),
        p.y + h / 2 + Math.sin(sweepAng) * (h * 0.38)
      );
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();
    }

    // ── 13. CENTRAL WATER FOUNTAIN ──
    else if (item.type === 'FOUNTAIN') {
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.arc(p.x + w / 2, p.y + h / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3 * s;
      ctx.stroke();

      // Water Ripple Animation
      const rippleRadius = ((elapsedTime * 20) % (w / 2)) * s;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.arc(p.x + w / 2, p.y + h / 2, Math.max(2, rippleRadius), 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── 14. BOOKSHELVES ──
    else if (item.type === 'BOOKSHELF') {
      ctx.fillStyle = '#2b1b10';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5 * s;
      ctx.strokeRect(p.x, p.y, w, h);

      // Book rows with colorful spines
      const bookColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const shelfRows = 3;
      for (let r = 0; r < shelfRows; r++) {
        const ry = p.y + 4 * s + r * (h / shelfRows);
        ctx.fillStyle = '#1c130c';
        ctx.fillRect(p.x + 4 * s, ry, w - 8 * s, h / shelfRows - 2 * s);

        for (let b = 0; b < 6; b++) {
          ctx.fillStyle = bookColors[(r + b) % bookColors.length];
          ctx.fillRect(p.x + 8 * s + b * 15 * s, ry + 2 * s, 10 * s, h / shelfRows - 6 * s);
        }
      }
    }

    // Default Fallback Props
    else {
      ctx.fillStyle = item.color || '#334155';
      ctx.fillRect(p.x, p.y, w, h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeRect(p.x, p.y, w, h);
    }

    ctx.restore();
  }
}
