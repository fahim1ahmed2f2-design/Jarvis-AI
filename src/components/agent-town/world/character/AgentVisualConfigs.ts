/**
 * JARVIS Agent Town — Agent Visual Configurations
 * Step 2: Data-Driven Character Design & Aesthetic Specifications
 */

import { AgentVisualConfig } from './types';

export const AGENT_VISUAL_CONFIGS: Record<string, AgentVisualConfig> = {
  'agent-alice': {
    agentId: 'agent-alice',
    displayName: 'Alice',
    role: 'Research & Analysis',
    personality: 'ANALYTICAL',
    baseScale: 1.0,
    palette: {
      primary: '#00e8ff',
      secondary: '#0284c7',
      glow: 'rgba(0, 232, 255, 0.85)',
      accent: '#38bdf8',
      armor: '#082f49',
      visor: '#00e8ff',
      shadow: 'rgba(0, 150, 255, 0.25)',
      hud: '#0c4a6e'
    },
    headStyle: 'SLEEK_HELMET',
    prop: {
      type: 'HOLO_TABLET',
      color: '#00e8ff',
      glowColor: 'rgba(0, 232, 255, 0.7)',
      scale: 1.0
    },
    idleCycleSpeed: 1.2,
    idleSwayAmplitude: 1.5,
    breathingSpeed: 1.3,
    walkStrideFrequency: 4.0,
    walkBobHeight: 3.0
  },
  'agent-bob': {
    agentId: 'agent-bob',
    displayName: 'Bob',
    role: 'Operations & Execution',
    personality: 'ENERGETIC',
    baseScale: 1.05,
    palette: {
      primary: '#f5a524',
      secondary: '#ea580c',
      glow: 'rgba(245, 165, 36, 0.85)',
      accent: '#fb923c',
      armor: '#431407',
      visor: '#f5a524',
      shadow: 'rgba(245, 120, 20, 0.25)',
      hud: '#7c2d12'
    },
    headStyle: 'TECH_VISOR',
    prop: {
      type: 'TOOL_WRENCH',
      color: '#f5a524',
      glowColor: 'rgba(245, 165, 36, 0.7)',
      scale: 1.1
    },
    idleCycleSpeed: 1.8,
    idleSwayAmplitude: 2.2,
    breathingSpeed: 1.7,
    walkStrideFrequency: 4.8,
    walkBobHeight: 3.5
  },
  'agent-carol': {
    agentId: 'agent-carol',
    displayName: 'Carol',
    role: 'Knowledge & Memory',
    personality: 'SCHOLARLY',
    baseScale: 0.98,
    palette: {
      primary: '#a855f7',
      secondary: '#7e22ce',
      glow: 'rgba(168, 85, 247, 0.85)',
      accent: '#c084fc',
      armor: '#3b0764',
      visor: '#a855f7',
      shadow: 'rgba(168, 85, 247, 0.25)',
      hud: '#581c87'
    },
    headStyle: 'HOODED_MANTLE',
    prop: {
      type: 'MEMORY_CRYSTALS',
      color: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.7)',
      scale: 1.0
    },
    idleCycleSpeed: 1.0,
    idleSwayAmplitude: 1.2,
    breathingSpeed: 1.1,
    walkStrideFrequency: 3.6,
    walkBobHeight: 2.5
  },
  'agent-dave': {
    agentId: 'agent-dave',
    displayName: 'Dave',
    role: 'Strategic Command',
    personality: 'COMMANDING',
    baseScale: 1.04,
    palette: {
      primary: '#10e890',
      secondary: '#059669',
      glow: 'rgba(16, 232, 144, 0.85)',
      accent: '#34d399',
      armor: '#022c22',
      visor: '#10e890',
      shadow: 'rgba(16, 232, 144, 0.25)',
      hud: '#064e3b'
    },
    headStyle: 'COMMAND_OFFICER',
    prop: {
      type: 'COMMAND_GLOBE',
      color: '#10e890',
      glowColor: 'rgba(16, 232, 144, 0.7)',
      scale: 1.05
    },
    idleCycleSpeed: 1.3,
    idleSwayAmplitude: 1.6,
    breathingSpeed: 1.4,
    walkStrideFrequency: 4.2,
    walkBobHeight: 3.2
  }
};

export const getAgentVisualConfig = (agentId: string): AgentVisualConfig => {
  return (
    AGENT_VISUAL_CONFIGS[agentId] || {
      agentId,
      displayName: 'Agent',
      role: 'Autonomous Subsystem',
      personality: 'ANALYTICAL',
      baseScale: 1.0,
      palette: {
        primary: '#00e8ff',
        secondary: '#0284c7',
        glow: 'rgba(0, 232, 255, 0.7)',
        accent: '#38bdf8',
        armor: '#082f49',
        visor: '#00e8ff',
        shadow: 'rgba(0, 150, 255, 0.2)',
        hud: '#0c4a6e'
      },
      headStyle: 'SLEEK_HELMET',
      prop: {
        type: 'NONE',
        color: '#00e8ff',
        glowColor: 'rgba(0, 232, 255, 0.5)',
        scale: 1.0
      },
      idleCycleSpeed: 1.2,
      idleSwayAmplitude: 1.5,
      breathingSpeed: 1.3,
      walkStrideFrequency: 4.0,
      walkBobHeight: 3.0
    }
  );
};
