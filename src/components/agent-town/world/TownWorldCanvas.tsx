/**
 * JARVIS Agent Town — TownWorldCanvas
 * Step 3: Living Agent Town 60 FPS 2.5D Isometric Animated World Engine
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { AgentTownMember, TownSector, ActiveConnection } from '../types';
import {
  CameraState,
  AmbientParticle,
  WorldPosition
} from './types';
import { WorldCoordinateSystem } from './WorldCoordinateSystem';
import { AgentPositionManager } from './AgentPositionManager';
import { AnimatedAgentRenderer } from './character/AnimatedAgentRenderer';
import {
  TOWN_ROOMS,
  TOWN_PATHWAYS,
  INITIAL_MAINTENANCE_DRONE,
  WORLD_BOUNDARIES
} from './environment/EnvironmentData';
import { EnvironmentRenderer } from './environment/EnvironmentRenderer';
import { EnvironmentActivityController } from './environment/EnvironmentActivityController';
import { EnvironmentProp, InteractionPoint } from './environment/types';
import { InteractionRenderer } from './interaction/InteractionRenderer';
import { AgentTaskVisualizer } from './task/AgentTaskVisualizer';
import { TaskBadgeRenderer } from './task/TaskBadgeRenderer';
import { AgentTownCameraController } from './camera/AgentTownCameraController';
import { AgentTownEffectsController } from './effects/AgentTownEffectsController';
import { HolographicEffectsRenderer } from './effects/HolographicEffectsRenderer';
import { PixelOfficeRenderer } from './pixel/PixelOfficeRenderer';
import { PixelAgentRenderer, PixelAgentVisualState } from './pixel/PixelAgentRenderer';
import { PIXEL_DESKS } from './pixel/PixelOfficeData';
import { multiHopEngine, MultiHopSession } from './interaction/MultiHopConsultationEngine';
import { autonomousOfficeEngine, AutonomousAgentState, OfficeDialogueBubble } from './social/AutonomousOfficeLifeEngine';
import { bdNewsOfficeEngine, BDNewsDialogueBubble } from './social/BangladeshNewsOfficeEngine';


interface TownWorldCanvasProps {
  agents: AgentTownMember[];
  selectedAgentId: string | null;
  selectedSector: TownSector;
  activeConnections?: ActiveConnection[];
  onSelectAgent: (agent: AgentTownMember) => void;
  onSelectZone?: (sector: TownSector) => void;
  primaryColor?: string;
  className?: string;
}

export const TownWorldCanvas: React.FC<TownWorldCanvasProps> = ({
  agents,
  selectedAgentId,
  selectedSector,
  activeConnections = [],
  onSelectAgent,
  onSelectZone,
  primaryColor = '#a855f7',
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Position Manager (manages positions of Alice, Bob, Carol, Dave)
  const posManagerRef = useRef<AgentPositionManager>(new AgentPositionManager());

  // Environment Activity Controller (manages room states, dynamic lighting & reactive props)
  const activityCtrlRef = useRef<EnvironmentActivityController>(new EnvironmentActivityController());

  // Task & Activity Visualizer (manages task badges, progress arcs & live event stream)
  const taskVisualizerRef = useRef<AgentTaskVisualizer>(new AgentTaskVisualizer());

  // Autonomous Maintenance Drone ("Sparky")
  const droneRef = useRef({ ...INITIAL_MAINTENANCE_DRONE });

  // Camera Controller (manages 6 camera modes, follow mode, pair framing & smooth easing)
  const cameraCtrlRef = useRef<AgentTownCameraController>(new AgentTownCameraController());

  // Holographic Effects Controller (manages pooled particles, selection scans & celebratory bursts)
  const effectsCtrlRef = useRef<AgentTownEffectsController>(new AgentTownEffectsController());

  // Camera State (centered on the 5-room headquarters)
  const cameraRef = useRef<CameraState>({
    x: 0,
    y: 0,
    zoom: 0.85,
    targetX: 0,
    targetY: 0,
    targetZoom: 0.85,
    minZoom: 0.45,
    maxZoom: 2.2,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    viewportWidth: 800,
    viewportHeight: 600
  });

  // Ambient Particles
  const particlesRef = useRef<AmbientParticle[]>([]);

  // Hover states
  const hoveredAgentIdRef = useRef<string | null>(null);
  const hoveredRoomIdRef = useRef<string | null>(null);
  const hoveredPointIdRef = useRef<string | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    name: string;
    category?: string;
    status: string;
    color?: string;
  } | null>(null);

  // Sector filtering camera focus across 7 Mega Rooms + Plaza
  useEffect(() => {
    if (selectedSector === 'ALL') {
      cameraRef.current.targetX = 0;
      cameraRef.current.targetY = 0;
      cameraRef.current.targetZoom = 0.65;
    } else if (selectedSector === 'PENTHOUSE') {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - 800;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - 160;
      cameraRef.current.targetZoom = 1.15;
    } else if (selectedSector === 'KNOWLEDGE') {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - 270;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - 170;
      cameraRef.current.targetZoom = 1.15;
    } else if (selectedSector === 'RESEARCH') {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - 1330;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - 170;
      cameraRef.current.targetZoom = 1.15;
    } else if (selectedSector === 'STUDIO') {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - 270;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - 530;
      cameraRef.current.targetZoom = 1.15;
    } else if (selectedSector === 'CYBER_DEFENSE') {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - 1330;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - 530;
      cameraRef.current.targetZoom = 1.15;
    } else if (selectedSector === 'OPERATIONS') {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - 270;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - 930;
      cameraRef.current.targetZoom = 1.15;
    } else if (selectedSector === 'COMMAND') {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - 1330;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - 940;
      cameraRef.current.targetZoom = 1.15;
    } else if (selectedSector === 'PLAZA') {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - 800;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - 700;
      cameraRef.current.targetZoom = 1.05;
    }
  }, [selectedSector]);

  const multiHopSessionRef = useRef<MultiHopSession | null>(null);
  const autoAgentStatesRef = useRef<Record<string, AutonomousAgentState>>({});
  const officeDialoguesRef = useRef<OfficeDialogueBubble[]>([]);
  const bdNewsBubbleRef = useRef<BDNewsDialogueBubble | null>(null);

  useEffect(() => {
    return multiHopEngine.subscribe((session) => {
      multiHopSessionRef.current = session;
    });
  }, []);

  useEffect(() => {
    return autonomousOfficeEngine.subscribe((agentStates, activeDialogues) => {
      autoAgentStatesRef.current = agentStates;
      officeDialoguesRef.current = activeDialogues;
    });
  }, []);

  useEffect(() => {
    return bdNewsOfficeEngine.subscribe((bubble) => {
      bdNewsBubbleRef.current = bubble;
    });
  }, []);


  // Focus camera on selected agent
  useEffect(() => {
    if (selectedAgentId) {
      const AGENT_PROFILES_DESK: Record<string, { x: number; y: number }> = {
        'agent-jarvis': { x: 800, y: 160 },
        'agent-carol': { x: 270, y: 170 },
        'agent-alice': { x: 1330, y: 170 },
        'agent-tuly': { x: 270, y: 530 },
        'agent-jonson': { x: 1250, y: 530 },
        'agent-knox': { x: 1410, y: 530 },
        'agent-bob': { x: 200, y: 930 },
        'agent-mob': { x: 350, y: 930 },
        'agent-dave': { x: 1330, y: 940 }
      };
      const desk = AGENT_PROFILES_DESK[selectedAgentId];
      if (desk) {
        cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - desk.x;
        cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - desk.y;
        cameraRef.current.targetZoom = 1.25;
      }
    }
  }, [selectedAgentId]);

  // Keyboard 'E' / 'e' shortcut to inspect hovered or selected agent
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        if (hoveredAgentIdRef.current) {
          const found = agents.find((a) => a.id === hoveredAgentIdRef.current);
          if (found) onSelectAgent(found);
        } else if (selectedAgentId) {
          const found = agents.find((a) => a.id === selectedAgentId);
          if (found) onSelectAgent(found);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agents, selectedAgentId, onSelectAgent]);

  // Initialize Ambient Floating Cyber Particles
  useEffect(() => {
    const particles: AmbientParticle[] = [];
    const colors = ['#00e8ff', '#a855f7', '#f5a524', '#10e890'];
    for (let i = 0; i < 28; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        z: Math.random() * 80,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        vz: (Math.random() - 0.5) * 4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        color: colors[i % colors.length],
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    particlesRef.current = particles;
  }, []);

  // ── STEP 15: REDUCED MOTION & VIEWPORT DENSITY SCALING ──
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    effectsCtrlRef.current.setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => effectsCtrlRef.current.setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const cam = cameraRef.current;
    const scale = Math.min(1.0, Math.max(0.3, cam.viewportWidth / 1200));
    effectsCtrlRef.current.setDensityScale(scale);
  });

  // ── STEP 15: TASK STATE TRANSITION DETECTION FOR EFFECTS ──
  const prevTaskStatusRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const prev = prevTaskStatusRef.current;
    for (const agent of agents) {
      const key = agent.id;
      const curStatus = agent.currentTask?.status || 'NONE';
      const prevStatus = prev.get(key) || 'NONE';

      if (prevStatus !== curStatus) {
        if (curStatus === 'COMPLETED' && prevStatus === 'WORKING') {
          const state = posManagerRef.current.getAgentState(key);
          if (state) effectsCtrlRef.current.spawnCompletionBurst(state.currentPosition);
        }
        if (curStatus === 'FAILED' && prevStatus === 'WORKING') {
          const state = posManagerRef.current.getAgentState(key);
          if (state) effectsCtrlRef.current.spawnErrorBurst(state.currentPosition);
        }
      }
      prev.set(key, curStatus);
    }
  }, [agents]);

  // ── MAIN 60 FPS CANVAS ANIMATION & RENDER LOOP ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsedTime = now / 1000;

      const cam = cameraRef.current;

      // 1. Smooth Camera Interpolation (Lerp)
      cam.x = WorldCoordinateSystem.lerp(cam.x, cam.targetX, deltaTime * 6);
      cam.y = WorldCoordinateSystem.lerp(cam.y, cam.targetY, deltaTime * 6);
      cam.zoom = WorldCoordinateSystem.lerp(cam.zoom, cam.targetZoom, deltaTime * 6);

      // 2. Update Position Manager & Locomotion
      posManagerRef.current.update(deltaTime, elapsedTime);

      // 2b. Spawn movement trail particles for walking agents (Step 15 polish)
      for (const aState of posManagerRef.current.getAllAgentStates()) {
        if (aState.animationState === 'WALKING') {
          effectsCtrlRef.current.spawnMovementTrail(aState.currentPosition, aState.avatarColor);
        }
      }

      // 3. Update Ambient Particles
      for (const p of particlesRef.current) {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.z += p.vz * deltaTime;
        p.pulsePhase += deltaTime * 2;
        if (p.x > 350) p.x = -350;
        if (p.x < -350) p.x = 350;
        if (p.y > 350) p.y = -350;
        if (p.y < -350) p.y = 350;
        if (p.z > 90) p.z = 0;
        if (p.z < 0) p.z = 90;
      }

      // 4. Clear Canvas & Deep Obsidian Cyber Background
      const w = cam.viewportWidth;
      const h = cam.viewportHeight;

      ctx.fillStyle = '#020612';
      ctx.fillRect(0, 0, w, h);

      // Radial background ambient core glow
      const plazaScreen = WorldCoordinateSystem.worldToScreen({ x: 0, y: 0, z: 0 }, cam);
      const bgRadial = ctx.createRadialGradient(
        plazaScreen.x,
        plazaScreen.y,
        10,
        plazaScreen.x,
        plazaScreen.y,
        Math.max(w, h) * 0.75
      );
      bgRadial.addColorStop(0, 'rgba(168, 85, 247, 0.12)');
      bgRadial.addColorStop(0.5, 'rgba(0, 232, 255, 0.05)');
      bgRadial.addColorStop(1, 'rgba(2, 6, 18, 0)');
      ctx.fillStyle = bgRadial;
      ctx.fillRect(0, 0, w, h);

      // ── STEP 15+: 2D TOP-DOWN RETRO PIXEL-ART OFFICE WORLD RENDERER ──
      PixelOfficeRenderer.renderWorld(
        ctx,
        cam,
        hoveredAgentIdRef.current,
        selectedAgentId,
        elapsedTime
      );

      // ── RENDER CHIBI PIXEL-ART AGENTS (9 AGENT TEAM) ──
      const AGENT_PROFILES: Record<
        string,
        {
          hair: string;
          outfit: string;
          skin: string;
          desk: { x: number; y: number };
          facing: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
        }
      > = {
        'agent-jarvis': { hair: '#eab308', outfit: '#1e1b4b', skin: '#fed7aa', desk: { x: 800, y: 160 }, facing: 'DOWN' },
        'agent-carol': { hair: '#b91c1c', outfit: '#7e22ce', skin: '#fed7aa', desk: { x: 270, y: 170 }, facing: 'DOWN' },
        'agent-alice': { hair: '#92400e', outfit: '#475569', skin: '#fed7aa', desk: { x: 1330, y: 170 }, facing: 'DOWN' },
        'agent-tuly': { hair: '#ec4899', outfit: '#db2777', skin: '#fde68a', desk: { x: 270, y: 530 }, facing: 'DOWN' },
        'agent-jonson': { hair: '#1e293b', outfit: '#dc2626', skin: '#fed7aa', desk: { x: 1250, y: 530 }, facing: 'DOWN' },
        'agent-knox': { hair: '#047857', outfit: '#059669', skin: '#fde68a', desk: { x: 1410, y: 530 }, facing: 'DOWN' },
        'agent-bob': { hair: '#b45309', outfit: '#ea580c', skin: '#fde68a', desk: { x: 200, y: 930 }, facing: 'DOWN' },
        'agent-mob': { hair: '#1f2937', outfit: '#f97316', skin: '#fed7aa', desk: { x: 350, y: 930 }, facing: 'DOWN' },
        'agent-dave': { hair: '#1e3a8a', outfit: '#1e3a8a', skin: '#fde68a', desk: { x: 1330, y: 940 }, facing: 'UP' }
      };

      const mhop = multiHopSessionRef.current;

      for (const agent of agents) {
        const profile = AGENT_PROFILES[agent.id] || {
          hair: '#b45309',
          outfit: '#3b82f6',
          skin: '#fed7aa',
          desk: { x: 800, y: 600 },
          facing: 'DOWN' as const
        };

        const isSelected = selectedAgentId === agent.id;
        const isHovered = hoveredAgentIdRef.current === agent.id;
        const isWorking = agent.status === 'WORKING';

        const auto = autoAgentStatesRef.current[agent.id];

        let currentAgentPos = auto ? auto.currentPos : profile.desk;
        let currentFacing = auto ? auto.facing : profile.facing;
        let isWalking = auto ? auto.isWalking : false;
        let isSitting = auto ? auto.isSitting : true;

        if (mhop && agent.id === mhop.initiatorId) {
          currentAgentPos = mhop.currentPos;
          currentFacing = mhop.facing;
          isWalking = mhop.isWalking;
          isSitting = !mhop.isWalking;
        }

        const screenPos = PixelOfficeRenderer.worldToScreen2D(currentAgentPos, cam);

        const visualState: PixelAgentVisualState = {
          agentId: agent.id,
          name: agent.name,
          codename: agent.codename,
          role: agent.role,
          status: mhop && agent.id === mhop.initiatorId ? (mhop.isWalking ? 'WALKING' : 'COMMUNICATING') : agent.status,
          position: currentAgentPos,
          facing: currentFacing,
          isWalking,
          isSitting,
          color: agent.avatar.color || '#00e8ff',
          hairColor: profile.hair,
          outfitColor: profile.outfit,
          skinColor: profile.skin,
          isSelected,
          isHovered
        };

        PixelAgentRenderer.renderAgent(ctx, visualState, screenPos, 2.2 * cam.zoom, elapsedTime);

        // Overhead Task Badge if agent is currently working on a task
        if (agent.currentTask && isWorking && !mhop) {
          const badgeY = screenPos.y - 48 * cam.zoom;
          ctx.save();
          ctx.font = `bold ${Math.max(9, Math.round(9 * cam.zoom))}px 'Share Tech Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#00e8ff';
          ctx.lineWidth = 1;
          const taskText = agent.currentTask.title.length > 20 ? `${agent.currentTask.title.slice(0, 18)}...` : agent.currentTask.title;
          const tw = ctx.measureText(taskText).width;
          ctx.beginPath();
          ctx.roundRect(screenPos.x - tw / 2 - 6, badgeY - 7, tw + 12, 15, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#00e8ff';
          ctx.fillText(taskText, screenPos.x, badgeY + 4);
          ctx.restore();
        }
      }

      // ── ENHANCED OVERHEAD SPEECH BUBBLE RENDERER (BANGLA & ENGLISH MULTI-LINE) ──
      const wrapCanvasText = (text: string, maxW: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let cur = '';
        for (const w of words) {
          const test = cur ? cur + ' ' + w : w;
          if (ctx.measureText(test).width > maxW && cur) {
            lines.push(cur);
            cur = w;
          } else {
            cur = test;
          }
        }
        if (cur) lines.push(cur);
        return lines.length > 0 ? lines : [text];
      };

      const drawOverheadBubble = (
        worldPos: { x: number; y: number },
        speakerName: string,
        color: string,
        text: string,
        subtext?: string,
        badge?: string,
        iconEmoji: string = '💬',
        isBreakingNews: boolean = false
      ) => {
        const bubbleScreen = PixelOfficeRenderer.worldToScreen2D(worldPos, cam);
        const floatBounce = Math.sin(elapsedTime * 3.2) * (2.0 * cam.zoom);
        const baseY = bubbleScreen.y - (52 * cam.zoom) + floatBounce;

        ctx.save();

        // 1. Pulsing Ground Ring under speaker
        ctx.beginPath();
        const pulse = (10 * cam.zoom) + Math.sin(elapsedTime * 4.5) * (3 * cam.zoom);
        ctx.arc(bubbleScreen.x, bubbleScreen.y + (16 * cam.zoom), pulse, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6 * cam.zoom;
        ctx.stroke();

        // 2. Measure & Wrap Text
        const fontSize = Math.max(9.5, Math.round(10.5 * cam.zoom));
        ctx.font = `500 ${fontSize}px 'Hind Siliguri', 'Noto Sans Bengali', 'Share Tech Mono', sans-serif`;
        const maxTextWidth = Math.min(280 * cam.zoom, 360);
        const lines = wrapCanvasText(text, maxTextWidth);

        let longestLineW = 0;
        for (const l of lines) {
          const w = ctx.measureText(l).width;
          if (w > longestLineW) longestLineW = w;
        }

        const bubbleW = Math.max(longestLineW + (28 * cam.zoom), (isBreakingNews ? 220 : 160) * cam.zoom);
        const lineHeight = fontSize * 1.35;
        const bodyH = lines.length * lineHeight;
        const headerH = 18 * cam.zoom;
        const subtextH = subtext ? (14 * cam.zoom) : 0;
        const bubbleH = headerH + bodyH + subtextH + (12 * cam.zoom);

        const bubbleX = bubbleScreen.x - (bubbleW / 2);
        const bubbleTop = baseY - bubbleH;

        // 3. Glassmorphic Gradient Background
        const grad = ctx.createLinearGradient(0, bubbleTop, 0, baseY);
        grad.addColorStop(0, 'rgba(6, 14, 38, 0.96)');
        grad.addColorStop(1, 'rgba(2, 6, 22, 0.98)');
        ctx.fillStyle = grad;

        // Glowing Border
        ctx.shadowColor = color;
        ctx.shadowBlur = (isBreakingNews ? 16 : 10) * cam.zoom;
        ctx.strokeStyle = color;
        ctx.lineWidth = (isBreakingNews ? 2.0 : 1.5) * cam.zoom;

        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleTop, bubbleW, bubbleH, 7 * cam.zoom);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4. Little Triangle Tail Pointing Down to Head
        ctx.fillStyle = 'rgba(4, 10, 30, 0.98)';
        ctx.beginPath();
        ctx.moveTo(bubbleScreen.x - (6 * cam.zoom), baseY);
        ctx.lineTo(bubbleScreen.x + (6 * cam.zoom), baseY);
        ctx.lineTo(bubbleScreen.x, baseY + (7 * cam.zoom));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.stroke();

        // 5. Header Line: Icon + Speaker Name + Badge
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(8.5, Math.round(8.5 * cam.zoom))}px 'Orbitron', sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(
          `${iconEmoji} ${speakerName.toUpperCase()}`,
          bubbleX + (9 * cam.zoom),
          bubbleTop + (13 * cam.zoom)
        );

        if (badge) {
          ctx.fillStyle = '#10e890';
          ctx.font = `bold ${Math.max(7.5, Math.round(8 * cam.zoom))}px 'Share Tech Mono', monospace`;
          ctx.textAlign = 'right';
          ctx.fillText(badge, bubbleX + bubbleW - (9 * cam.zoom), bubbleTop + (13 * cam.zoom));
        }

        // 6. Multi-line Bengali / English Speech Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `500 ${fontSize}px 'Hind Siliguri', 'Noto Sans Bengali', 'Share Tech Mono', sans-serif`;
        ctx.textAlign = 'left';

        lines.forEach((line, idx) => {
          ctx.fillText(
            line,
            bubbleX + (9 * cam.zoom),
            bubbleTop + headerH + ((idx + 1) * lineHeight) - (2 * cam.zoom)
          );
        });

        // 7. Subtext / Perspective Tag
        if (subtext) {
          ctx.fillStyle = 'rgba(216, 180, 254, 0.90)';
          ctx.font = `italic 500 ${Math.max(7.5, Math.round(8.5 * cam.zoom))}px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif`;
          ctx.fillText(
            `↳ ${subtext}`,
            bubbleX + (9 * cam.zoom),
            bubbleTop + bubbleH - (6 * cam.zoom)
          );
        }

        ctx.restore();
      };

      // ── SPONTANEOUS OFFICE DIALOGUE BUBBLES ──
      for (const diag of officeDialoguesRef.current) {
        drawOverheadBubble(
          diag.position,
          diag.speakerName,
          diag.color,
          diag.text,
          undefined,
          '● লাইভ',
          '⚡'
        );
      }

      // ── 🇧🇩 BANGLADESH BREAKING NEWS ACTIVE OFFICE DEBATE BUBBLE ──
      const bdNewsBubble = bdNewsBubbleRef.current;
      if (bdNewsBubble && bdNewsBubble.expiresAt > Date.now()) {
        drawOverheadBubble(
          bdNewsBubble.position,
          bdNewsBubble.speakerName,
          bdNewsBubble.color,
          bdNewsBubble.text,
          bdNewsBubble.subtext,
          `[${bdNewsBubble.turnIndex}/${bdNewsBubble.totalTurns}]`,
          '🇧🇩',
          true
        );

        // 3. Top Newsroom Ticker Banner
        const bannerW = Math.min(cameraRef.current.viewportWidth - 40, 720);
        const bannerH = 32;
        const bx = (cameraRef.current.viewportWidth - bannerW) / 2;
        const by = 12;

        ctx.save();
        ctx.fillStyle = 'rgba(4, 10, 32, 0.96)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.45)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(bx, by, bannerW, bannerH, 7);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = `bold 10px 'Orbitron', 'Hind Siliguri', sans-serif`;
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'left';
        ctx.fillText(`● 🇧🇩 বাংলাদেশ নিউজ হাব`, bx + 12, by + 20);

        ctx.font = `600 10px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif`;
        ctx.fillStyle = '#ffffff';
        const truncatedHeadline = bdNewsBubble.storyTitle.length > 52
          ? bdNewsBubble.storyTitle.slice(0, 52) + '...'
          : bdNewsBubble.storyTitle;
        ctx.fillText(`: "${truncatedHeadline}"`, bx + 155, by + 20);

        ctx.font = `bold 9.5px 'Share Tech Mono', monospace`;
        ctx.fillStyle = '#10e890';
        ctx.textAlign = 'right';
        ctx.fillText(`TURN ${bdNewsBubble.turnIndex}/${bdNewsBubble.totalTurns}`, bx + bannerW - 12, by + 20);
        ctx.restore();
      }

      // ── MULTI-HOP DIALOGUE BUBBLE, LASER CONDUIT & TOP HUD ──
      if (mhop) {
        // Laser Beam during active consultation
        let targetDeskPos: { x: number; y: number } | null = null;
        let beamColor = '#00e8ff';

        if (mhop.stage === 'CONSULTING_DAVE') {
          targetDeskPos = AGENT_PROFILES['agent-dave'].desk;
          beamColor = '#3b82f6';
        } else if (mhop.stage === 'CONSULTING_BOB') {
          targetDeskPos = AGENT_PROFILES['agent-bob'].desk;
          beamColor = '#f59e0b';
        } else if (mhop.stage === 'CONSULTING_CAROL') {
          targetDeskPos = AGENT_PROFILES['agent-carol'].desk;
          beamColor = '#a855f7';
        }

        if (targetDeskPos) {
          const p1 = PixelOfficeRenderer.worldToScreen2D(mhop.currentPos, cam);
          const p2 = PixelOfficeRenderer.worldToScreen2D(targetDeskPos, cam);

          ctx.save();
          ctx.strokeStyle = beamColor;
          ctx.lineWidth = 2.5 * cam.zoom;
          ctx.setLineDash([8 * cam.zoom, 4 * cam.zoom]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Pulsing Data packet
          const packetT = (elapsedTime * 2.5) % 1.0;
          const packetX = p1.x + (p2.x - p1.x) * packetT;
          const packetY = p1.y + (p2.y - p1.y) * packetT;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = beamColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(packetX, packetY, 5 * cam.zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Render Active Multi-hop Dialogue Speech Bubble
        if (mhop.activeDialogue) {
          drawOverheadBubble(
            mhop.activeDialogue.position,
            mhop.activeDialogue.speakerName,
            mhop.activeDialogue.color,
            mhop.activeDialogue.text,
            `কনসাল্টেশন: ${mhop.stage.replace(/_/g, ' ')}`,
            `${mhop.progress}%`,
            '🚶'
          );
        }

        // Top Status HUD Banner for Multi-Hop
        ctx.save();
        const bannerW = Math.min(cameraRef.current.viewportWidth - 40, 560);
        const bannerH = 28;
        const bx = (cameraRef.current.viewportWidth - bannerW) / 2;
        const by = 12;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
        ctx.strokeStyle = '#00e8ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, bannerW, bannerH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = `bold 10px 'Orbitron', sans-serif`;
        ctx.fillStyle = '#00e8ff';
        ctx.textAlign = 'left';
        ctx.fillText(`⚡ MULTI-AGENT WALK: ALICE ➜ DAVE ➜ BOB ➜ CAROL ➜ LAB`, bx + 12, by + 18);

        ctx.font = `bold 10px 'Share Tech Mono', monospace`;
        ctx.fillStyle = '#10e890';
        ctx.textAlign = 'right';
        ctx.fillText(`${mhop.progress}% [${mhop.stage.replace(/_/g, ' ')}]`, bx + bannerW - 12, by + 18);
        ctx.restore();
      }

      // ── ACTIVE NEURAL COLLABORATION CONDUITS ──
      for (const conn of activeConnections) {
        const fromProfile = AGENT_PROFILES[conn.fromAgentId]?.desk;
        const toProfile = AGENT_PROFILES[conn.toAgentId]?.desk;
        if (fromProfile && toProfile) {
          const p1 = PixelOfficeRenderer.worldToScreen2D(fromProfile, cam);
          const p2 = PixelOfficeRenderer.worldToScreen2D(toProfile, cam);

          ctx.save();
          ctx.strokeStyle = '#00e8ff';
          ctx.lineWidth = 2 * cam.zoom;
          ctx.setLineDash([6 * cam.zoom, 4 * cam.zoom]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Travelling Data Packet Dot
          const t = (elapsedTime * 1.5) % 1.0;
          const dotX = p1.x + (p2.x - p1.x) * t;
          const dotY = p1.y + (p2.y - p1.y) * t;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00e8ff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 4 * cam.zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ── HOLOGRAPHIC WORLD EFFECTS & BURSTS ──
      effectsCtrlRef.current.update(deltaTime);
      HolographicEffectsRenderer.renderBursts(ctx, effectsCtrlRef.current.getActiveBursts(), cam);

      // Request next frame
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedSector]);

  // ── DRAWING SUB-ROUTINES ──

  const drawIsometricGrid = (ctx: CanvasRenderingContext2D, cam: CameraState) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 232, 255, 0.05)';
    ctx.lineWidth = 1;

    const gridSize = 40;
    const gridCount = 9;

    for (let i = -gridCount; i <= gridCount; i++) {
      const p1 = WorldCoordinateSystem.worldToScreen({ x: -gridCount * gridSize, y: i * gridSize, z: 0 }, cam);
      const p2 = WorldCoordinateSystem.worldToScreen({ x: gridCount * gridSize, y: i * gridSize, z: 0 }, cam);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = WorldCoordinateSystem.worldToScreen({ x: i * gridSize, y: -gridCount * gridSize, z: 0 }, cam);
      const p4 = WorldCoordinateSystem.worldToScreen({ x: i * gridSize, y: gridCount * gridSize, z: 0 }, cam);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    cam: CameraState,
    particles: AmbientParticle[],
    elapsedTime: number
  ) => {
    ctx.save();
    for (const p of particles) {
      const pos = WorldCoordinateSystem.worldToScreen({ x: p.x, y: p.y, z: p.z }, cam);
      const pulseAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulsePhase));

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * cam.zoom, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, pulseAlpha));
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6 * cam.zoom;
      ctx.fill();
    }
    ctx.restore();
  };

  const drawYSortedEntities = (
    ctx: CanvasRenderingContext2D,
    cam: CameraState,
    deltaTime: number,
    elapsedTime: number
  ) => {
    type RenderItem =
      | { type: 'PROP'; depth: number; data: EnvironmentProp }
      | { type: 'AGENT'; depth: number; data: ReturnType<AgentPositionManager['getAllAgentStates']>[0] }
      | { type: 'DRONE'; depth: number };

    const renderList: RenderItem[] = [];

    // 1. Gather all Environment Props from the 5 Rooms
    for (const room of TOWN_ROOMS) {
      for (const prop of room.props) {
        renderList.push({
          type: 'PROP',
          depth: WorldCoordinateSystem.calculateRenderDepth(prop.position),
          data: prop
        });
      }
    }

    // 2. Gather Animated Agents
    const agentStates = posManagerRef.current.getAllAgentStates();
    for (const agent of agentStates) {
      renderList.push({
        type: 'AGENT',
        depth: WorldCoordinateSystem.calculateRenderDepth(agent.currentPosition, 5),
        data: agent
      });
    }

    // 3. Autonomous Maintenance Drone ("Sparky")
    renderList.push({
      type: 'DRONE',
      depth: WorldCoordinateSystem.calculateRenderDepth(droneRef.current.position, 2)
    });

    // Sort ascending by depth (lower depth = rendered first / in background)
    renderList.sort((a, b) => a.depth - b.depth);

    const hubLevel = activityCtrlRef.current.getHubActivityLevel();

    // Render in sorted order
    for (const item of renderList) {
      if (item.type === 'PROP') {
        const propRoom = TOWN_ROOMS.find((r) => r.id === item.data.roomId);
        const ownerMember = propRoom ? agents.find((a) => a.id === propRoom.agentId) : undefined;
        const wsState = activityCtrlRef.current.getWorkstationState(
          propRoom?.agentId || '',
          ownerMember?.status
        );
        EnvironmentRenderer.renderProp(ctx, item.data, cam, elapsedTime, wsState, hubLevel);
      } else if (item.type === 'AGENT') {
        const p = WorldCoordinateSystem.worldToScreen(item.data.currentPosition, cam);
        const member = agents.find((a) => a.id === item.data.agentId);
        const isMoving = posManagerRef.current.getMovementController().isMoving(item.data.agentId);
        const navState = posManagerRef.current.getMovementController().getNavState(item.data.agentId);

        if (member) {
          const badge = taskVisualizerRef.current.deriveBadgeData(
            member,
            item.data.isSelected,
            item.data.isHovered,
            isMoving,
            navState?.destinationName
          );

          // 1. Ground Activity Halo
          TaskBadgeRenderer.renderGroundHalo(ctx, badge, p.x, p.y, cam, elapsedTime);

          // 2. Character Canvas Render
          AnimatedAgentRenderer.render(
            ctx,
            item.data.agentId,
            item.data.animationState,
            item.data.previousAnimationState,
            item.data.stateStartTime,
            elapsedTime,
            p.x,
            p.y,
            cam.zoom,
            item.data.isSelected,
            item.data.isHovered,
            item.data.taskTitle
          );

          // 3. Overhead Holographic Task Badge & Progress Arc
          TaskBadgeRenderer.renderOverheadBadge(ctx, badge, p.x, p.y, cam, elapsedTime);
        } else {
          AnimatedAgentRenderer.render(
            ctx,
            item.data.agentId,
            item.data.animationState,
            item.data.previousAnimationState,
            item.data.stateStartTime,
            elapsedTime,
            p.x,
            p.y,
            cam.zoom,
            item.data.isSelected,
            item.data.isHovered,
            item.data.taskTitle
          );
        }
      } else if (item.type === 'DRONE') {
        EnvironmentRenderer.updateAndRenderDrone(ctx, droneRef.current, cam, deltaTime, elapsedTime);
      }
    }
  };

  // ── RESIZE OBSERVER ──
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(300, Math.floor(rect.height));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      cameraRef.current.viewportWidth = width;
      cameraRef.current.viewportHeight = height;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ── INTERACTION & HIT-TESTING (Mouse & Touch Events) ──

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    cameraCtrlRef.current.interruptToFreeMode();
    const cam = cameraRef.current;
    cam.isDragging = true;
    cam.dragStartX = e.clientX - cam.targetX;
    cam.dragStartY = e.clientY - cam.targetY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cam = cameraRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Drag Pan with Boundary Clamping
    if (cam.isDragging) {
      const rawTargetX = e.clientX - cam.dragStartX;
      const rawTargetY = e.clientY - cam.dragStartY;
      cam.targetX = Math.max(-1200, Math.min(1200, rawTargetX));
      cam.targetY = Math.max(-900, Math.min(900, rawTargetY));
      return;
    }

    // 2. Hover Hit-Testing in 2D Pixel Office
    const rect = canvas.getBoundingClientRect();
    const mouseScreen = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const AGENT_PROFILES_DESK: Record<string, { x: number; y: number }> = {
      'agent-jarvis': { x: 800, y: 160 },
      'agent-carol': { x: 270, y: 170 },
      'agent-alice': { x: 1330, y: 170 },
      'agent-tuly': { x: 270, y: 530 },
      'agent-jonson': { x: 1250, y: 530 },
      'agent-knox': { x: 1410, y: 530 },
      'agent-bob': { x: 200, y: 930 },
      'agent-mob': { x: 350, y: 930 },
      'agent-dave': { x: 1330, y: 940 }
    };

    // 2A. Test Agents first (Highest priority)
    let foundAgent: AgentTownMember | null = null;
    for (const agent of agents) {
      const autoPos = autoAgentStatesRef.current[agent.id]?.currentPos;
      const desk = AGENT_PROFILES_DESK[agent.id] || { x: 800, y: 600 };
      const currentPos = autoPos || desk;
      const screenPos = PixelOfficeRenderer.worldToScreen2D(currentPos, cam);
      const dx = mouseScreen.x - screenPos.x;
      const dy = mouseScreen.y - screenPos.y;
      if (Math.sqrt(dx * dx + dy * dy) <= 36 * cam.zoom) {
        foundAgent = agent;
        break;
      }
    }

    if (foundAgent) {
      hoveredAgentIdRef.current = foundAgent.id;
      hoveredPointIdRef.current = null;
      hoveredRoomIdRef.current = null;
      setHoveredInfo({
        name: foundAgent.name,
        category: 'AUTONOMOUS AGENT',
        status: `${foundAgent.role} [${foundAgent.status}]`,
        color: foundAgent.avatar.color || '#00e8ff'
      });
      canvas.style.cursor = 'pointer';
      return;
    } else {
      hoveredAgentIdRef.current = null;
      setHoveredInfo(null);
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseUp = () => {
    cameraRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    cameraCtrlRef.current.interruptToFreeMode();
    const cam = cameraRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    cam.targetZoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, cam.targetZoom * zoomFactor));
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickScreen = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const focusOnWorldPosition = (pos: { x: number; y: number }, zoom = 1.3) => {
      cameraRef.current.targetX = PixelOfficeRenderer.WORLD_CENTER_X - pos.x;
      cameraRef.current.targetY = PixelOfficeRenderer.WORLD_CENTER_Y - pos.y;
      cameraRef.current.targetZoom = zoom;
    };

    const cam = cameraRef.current;

    const AGENT_PROFILES_DESK: Record<string, { x: number; y: number }> = {
      'agent-jarvis': { x: 800, y: 160 },
      'agent-carol': { x: 270, y: 170 },
      'agent-alice': { x: 1330, y: 170 },
      'agent-tuly': { x: 270, y: 530 },
      'agent-jonson': { x: 1250, y: 530 },
      'agent-knox': { x: 1410, y: 530 },
      'agent-bob': { x: 200, y: 930 },
      'agent-mob': { x: 350, y: 930 },
      'agent-dave': { x: 1330, y: 940 }
    };

    // 1. Check if clicked an Agent in 2D Space
    for (const agent of agents) {
      const autoPos = autoAgentStatesRef.current[agent.id]?.currentPos;
      const desk = AGENT_PROFILES_DESK[agent.id] || { x: 800, y: 600 };
      const currentPos = autoPos || desk;
      const screenPos = PixelOfficeRenderer.worldToScreen2D(currentPos, cam);
      const dx = clickScreen.x - screenPos.x;
      const dy = clickScreen.y - screenPos.y;
      if (Math.sqrt(dx * dx + dy * dy) <= 40 * cam.zoom) {
        onSelectAgent(agent);
        return;
      }
    }

    // 2. Check if clicked an Interaction Point
    const clickWorld = WorldCoordinateSystem.screenToWorld(clickScreen, cam);
    for (const room of TOWN_ROOMS) {
      for (const pt of room.interactionPoints) {
        const dist = WorldCoordinateSystem.distance2D(clickWorld, pt.position);
        if (dist <= pt.radius) {
          // If an agent is selected, order them to walk to this interaction point!
          if (selectedAgentId) {
            posManagerRef.current.moveToDestination(
              selectedAgentId,
              pt.position,
              pt.name,
              'WORKING'
            );
            return;
          }

          if (pt.agentId) {
            const found = agents.find((a) => a.id === pt.agentId);
            if (found) {
              onSelectAgent(found);
              return;
            }
          }
          focusOnWorldPosition(pt.position, 1.3);
          return;
        }
      }
    }

    // 3. Check if clicked a Room
    for (const room of TOWN_ROOMS) {
      if (
        clickWorld.x >= room.bounds.minX &&
        clickWorld.x <= room.bounds.maxX &&
        clickWorld.y >= room.bounds.minY &&
        clickWorld.y <= room.bounds.maxY
      ) {
        if (room.agentId && !selectedAgentId) {
          const found = agents.find((a) => a.id === room.agentId);
          if (found) {
            onSelectAgent(found);
            return;
          }
        }
        if (onSelectZone) {
          let secKey: TownSector = 'ALL';
          if (room.category === 'COMMAND_CENTER') secKey = 'COMMAND';
          else if (room.category === 'RESEARCH_LAB') secKey = 'RESEARCH';
          else if (room.category === 'OPERATIONS_LAB') secKey = 'OPERATIONS';
          else if (room.category === 'KNOWLEDGE_LIBRARY') secKey = 'KNOWLEDGE';
          onSelectZone(secKey);
        }
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cam = cameraRef.current;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = agents.findIndex((a) => a.id === selectedAgentId);
      const nextIndex = (currentIndex + 1) % agents.length;
      if (agents[nextIndex]) onSelectAgent(agents[nextIndex]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = agents.findIndex((a) => a.id === selectedAgentId);
      const prevIndex = (currentIndex - 1 + agents.length) % agents.length;
      if (agents[prevIndex]) onSelectAgent(agents[prevIndex]);
    } else if (e.key === 'f' || e.key === 'F') {
      // Toggle follow mode on selected agent
      if (selectedAgentId) {
        if (cameraCtrlRef.current.getMode() === 'FOLLOW_AGENT') {
          cameraCtrlRef.current.interruptToFreeMode();
        } else {
          cameraCtrlRef.current.followAgent(selectedAgentId, cam, 1.30);
        }
      }
    } else if (e.key === 'o' || e.key === 'O' || e.key === '0') {
      // Reset to overview
      cameraCtrlRef.current.resetToOverview(cam);
    } else if (e.key === 'h' || e.key === 'H') {
      // Return selected agent home
      if (selectedAgentId) {
        posManagerRef.current.returnHome(selectedAgentId);
      }
    } else if (e.key === 'c' || e.key === 'C') {
      // Cancel selected agent movement
      if (selectedAgentId) {
        posManagerRef.current.cancelMovement(selectedAgentId);
      }
    } else if (e.key === ' ') {
      // Pause / resume movement
      e.preventDefault();
      if (selectedAgentId) {
        const isMoving = posManagerRef.current.getMovementController().isMoving(selectedAgentId);
        if (isMoving) posManagerRef.current.pauseMovement(selectedAgentId);
        else posManagerRef.current.resumeMovement(selectedAgentId);
      }
    } else if (e.key === '+' || e.key === '=') {
      cam.targetZoom = Math.min(cam.maxZoom, cam.targetZoom * 1.15);
    } else if (e.key === '-' || e.key === '_') {
      cam.targetZoom = Math.max(cam.minZoom, cam.targetZoom * 0.85);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      tabIndex={0}
      role="region"
      aria-label="Agent Town Animated Headquarters"
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#020612',
        userSelect: 'none',
        outline: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />

      {/* Futuristic HUD Hover Info Tooltip */}
      {hoveredInfo && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(2, 6, 22, 0.95)',
            border: `1px solid ${hoveredInfo.color || primaryColor}88`,
            borderRadius: '6px',
            padding: '7px 14px',
            boxShadow: `0 0 20px rgba(0, 0, 0, 0.9), 0 0 10px ${hoveredInfo.color || primaryColor}33`,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            maxWidth: '360px',
            zIndex: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 800,
                color: hoveredInfo.color || '#00e8ff',
                letterSpacing: '0.06em'
              }}
            >
              {hoveredInfo.name}
            </span>

            {hoveredInfo.category && (
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.55rem',
                  color: hoveredInfo.color || '#00e8ff',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  border: `1px solid ${hoveredInfo.color || primaryColor}44`
                }}
              >
                {hoveredInfo.category}
              </span>
            )}
          </div>

          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.62rem',
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: 1.25
            }}
          >
            {hoveredInfo.status}
          </span>
        </div>
      )}
    </div>
  );
};
