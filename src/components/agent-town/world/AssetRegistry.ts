/**
 * JARVIS Agent Town — Asset Registry
 * Step 1: Asset Abstraction Layer & Character/World Placeholders
 */

import { AgentAsset, EnvironmentAsset, PropAsset, EffectAsset } from './types';

// Agent Asset Metadata Registry (Ready for Step 2 Character Art)
export const AGENT_ASSET_REGISTRY: Record<string, AgentAsset> = {
  'agent-alice': {
    id: 'asset-agent-alice',
    name: 'Alice // Research Hologram',
    category: 'AGENT',
    agentId: 'agent-alice',
    version: '1.0.0',
    author: 'JARVIS Core Architecture',
    palette: {
      primary: '#00e8ff',
      secondary: '#0284c7',
      glow: 'rgba(0, 232, 255, 0.8)',
      accent: '#38bdf8',
      hud: '#0c4a6e'
    },
    iconName: 'Brain',
    placeholderShape: 'HOLO_PRISM'
  },
  'agent-bob': {
    id: 'asset-agent-bob',
    name: 'Bob // Ops Executor Orb',
    category: 'AGENT',
    agentId: 'agent-bob',
    version: '1.0.0',
    author: 'JARVIS Core Architecture',
    palette: {
      primary: '#f5a524',
      secondary: '#ea580c',
      glow: 'rgba(245, 165, 36, 0.8)',
      accent: '#fb923c',
      hud: '#7c2d12'
    },
    iconName: 'Cpu',
    placeholderShape: 'CYBER_ORB'
  },
  'agent-carol': {
    id: 'asset-agent-carol',
    name: 'Carol // Knowledge Crystal Core',
    category: 'AGENT',
    agentId: 'agent-carol',
    version: '1.0.0',
    author: 'JARVIS Core Architecture',
    palette: {
      primary: '#a855f7',
      secondary: '#7e22ce',
      glow: 'rgba(168, 85, 247, 0.8)',
      accent: '#c084fc',
      hud: '#581c87'
    },
    iconName: 'BookOpen',
    placeholderShape: 'QUANTUM_CORE'
  },
  'agent-dave': {
    id: 'asset-agent-dave',
    name: 'Dave // Command Spire Core',
    category: 'AGENT',
    agentId: 'agent-dave',
    version: '1.0.0',
    author: 'JARVIS Core Architecture',
    palette: {
      primary: '#10e890',
      secondary: '#059669',
      glow: 'rgba(16, 232, 144, 0.8)',
      accent: '#34d399',
      hud: '#064e3b'
    },
    iconName: 'Shield',
    placeholderShape: 'COMMAND_SPIRE'
  }
};

export class AssetRegistry {
  public static getAgentAsset(agentId: string): AgentAsset | undefined {
    return AGENT_ASSET_REGISTRY[agentId];
  }

  /**
   * Helper to draw high-definition futuristic placeholder characters
   * Easily replaceable with animated sprite sheets in Step 2.
   */
  public static drawAgentPlaceholder(
    ctx: CanvasRenderingContext2D,
    agentId: string,
    state: string,
    pulse: number,
    isSelected: boolean,
    isHovered: boolean,
    screenX: number,
    screenY: number,
    zoom: number
  ) {
    const asset = this.getAgentAsset(agentId);
    const color = asset ? asset.palette.primary : '#00e8ff';
    const glow = asset ? asset.palette.glow : 'rgba(0, 232, 255, 0.6)';
    const size = 18 * zoom;

    ctx.save();
    ctx.translate(screenX, screenY);

    // 1. Base Hologram Pedestal Ring
    ctx.beginPath();
    ctx.ellipse(0, 8 * zoom, size * 1.4, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? 'rgba(0, 232, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#00e8ff' : color;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    // 2. Rotating Pulse Ring for Active/Working/Thinking states
    if (state === 'WORKING' || state === 'THINKING' || state === 'CELEBRATING') {
      ctx.beginPath();
      const pulseSize = (1.4 + pulse * 0.4) * size;
      ctx.ellipse(0, 8 * zoom, pulseSize, pulseSize * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = state === 'THINKING' ? '#38bdf8' : color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Floating Holographic Character Avatar Body (Futuristic Geometric Crystal Core)
    const floatY = -Math.sin(pulse * Math.PI * 2) * (4 * zoom) - (12 * zoom);
    ctx.translate(0, floatY);

    // Glow aura
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 1.6);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.4, glow);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, size * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core Solid Geometric Character Body
    ctx.beginPath();
    if (asset?.placeholderShape === 'CYBER_ORB') {
      // Bob - Cyber Orb
      ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
    } else if (asset?.placeholderShape === 'QUANTUM_CORE') {
      // Carol - Diamond Matrix
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.8, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.8, 0);
      ctx.closePath();
    } else if (asset?.placeholderShape === 'COMMAND_SPIRE') {
      // Dave - Hexagonal Command Spire
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const hx = Math.cos(angle) * size * 0.85;
        const hy = Math.sin(angle) * size * 0.85;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    } else {
      // Alice - Holo Prism
      ctx.moveTo(0, -size * 1.1);
      ctx.lineTo(size * 0.9, size * 0.7);
      ctx.lineTo(-size * 0.9, size * 0.7);
      ctx.closePath();
    }

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = (isSelected || isHovered ? 20 : 12) * zoom;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner Cyber Eye / Core Dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}
