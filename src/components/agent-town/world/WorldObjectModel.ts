/**
 * JARVIS Agent Town — World Object Model
 * Step 1: Data-Driven Spatial Headquarters Layout & Object Definitions
 */

import { WorldObject, TownZone } from './types';

// Spatial Town Zones Definition
export const TOWN_ZONES: TownZone[] = [
  {
    id: 'zone-central-plaza',
    sectorKey: 'ALL',
    name: 'Central Neural Plaza',
    codename: 'CORE // HUB-00',
    description: 'Central synaptic routing junction and quantum core reactor',
    center: { x: 0, y: 0, z: 0 },
    bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
    color: '#00e8ff',
    accentColor: '#a855f7',
    assignedAgentId: ''
  },
  {
    id: 'zone-research-lab',
    sectorKey: 'RESEARCH',
    name: 'Investigation & Research Lab',
    codename: 'SECTOR-01 // RES-LAB',
    description: 'Empirical data analysis, synthesis heuristics, and deep hypothesis generation',
    center: { x: -220, y: -180, z: 0 },
    bounds: { minX: -320, maxX: -120, minY: -280, maxY: -80 },
    color: '#00e8ff',
    accentColor: '#38bdf8',
    assignedAgentId: 'agent-alice'
  },
  {
    id: 'zone-operations-grid',
    sectorKey: 'OPERATIONS',
    name: 'Operations & Execution Grid',
    codename: 'SECTOR-02 // OPS-GRID',
    description: 'System automation pipelines, tool execution sandbox, and task dispatching',
    center: { x: -220, y: 180, z: 0 },
    bounds: { minX: -320, maxX: -120, minY: 80, maxY: 280 },
    color: '#f5a524',
    accentColor: '#fb923c',
    assignedAgentId: 'agent-bob'
  },
  {
    id: 'zone-knowledge-archive',
    sectorKey: 'KNOWLEDGE',
    name: 'Memory Archive & Library',
    codename: 'SECTOR-03 // MEM-ARCH',
    description: 'Episodic knowledge consolidation, vector embeddings, and cross-agent indexing',
    center: { x: 220, y: -180, z: 0 },
    bounds: { minX: 120, maxX: 320, minY: -280, maxY: -80 },
    color: '#a855f7',
    accentColor: '#c084fc',
    assignedAgentId: 'agent-carol'
  },
  {
    id: 'zone-command-hub',
    sectorKey: 'COMMAND',
    name: 'Strategic Command Center',
    codename: 'SECTOR-04 // CMD-HUB',
    description: 'Multi-agent orchestration, mission roadmaps, and central priority governance',
    center: { x: 220, y: 180, z: 0 },
    bounds: { minX: 120, maxX: 320, minY: 80, maxY: 280 },
    color: '#10e890',
    accentColor: '#34d399',
    assignedAgentId: 'agent-dave'
  }
];

// Data-Driven Static & Interactive World Objects
export const WORLD_OBJECTS: WorldObject[] = [
  // ── 1. CENTRAL PLAZA CORE ──
  {
    id: 'obj-plaza-reactor',
    type: 'MACHINE',
    name: 'Quantum Neural Core Reactor',
    position: { x: 0, y: 0, z: 0 },
    size: { width: 60, length: 60, height: 40 },
    visible: true,
    interactive: true,
    zoneId: 'zone-central-plaza',
    color: '#00e8ff',
    secondaryColor: '#a855f7',
    glowColor: 'rgba(0, 232, 255, 0.4)',
    metadata: {
      type: 'REACTOR',
      rpm: 1.5,
      energyLevel: '100%'
    }
  },
  {
    id: 'obj-plaza-hologram-ring',
    type: 'DECORATION',
    name: 'Synaptic Routing Ring',
    position: { x: 0, y: 0, z: 25 },
    size: { width: 90, length: 90, height: 5 },
    visible: true,
    interactive: false,
    zoneId: 'zone-central-plaza',
    color: '#00e8ff',
    glowColor: 'rgba(0, 232, 255, 0.6)'
  },

  // ── 2. ALICE: RESEARCH LAB ──
  {
    id: 'obj-alice-desk',
    type: 'AGENT_STATION',
    name: 'Investigation Terminal Desk',
    position: { x: -220, y: -180, z: 0 },
    size: { width: 70, length: 50, height: 28 },
    visible: true,
    interactive: true,
    zoneId: 'zone-research-lab',
    agentId: 'agent-alice',
    color: '#00e8ff',
    secondaryColor: '#0369a1',
    glowColor: 'rgba(0, 232, 255, 0.35)',
    metadata: {
      stationName: 'Alice Research Desk',
      sector: 'RESEARCH'
    }
  },
  {
    id: 'obj-alice-screen',
    type: 'SCREEN',
    name: 'Analytical Holo-Screen Array',
    position: { x: -245, y: -210, z: 25 },
    size: { width: 45, length: 10, height: 35 },
    visible: true,
    interactive: false,
    zoneId: 'zone-research-lab',
    color: '#00e8ff',
    glowColor: 'rgba(0, 232, 255, 0.5)'
  },
  {
    id: 'obj-alice-compute-rack',
    type: 'MACHINE',
    name: 'Neural Tensor Compute Array',
    position: { x: -260, y: -140, z: 0 },
    size: { width: 25, length: 45, height: 50 },
    visible: true,
    interactive: false,
    zoneId: 'zone-research-lab',
    color: '#0284c7',
    glowColor: 'rgba(2, 132, 199, 0.3)'
  },

  // ── 3. BOB: OPERATIONS GRID ──
  {
    id: 'obj-bob-desk',
    type: 'AGENT_STATION',
    name: 'Automation Workstation Desk',
    position: { x: -220, y: 180, z: 0 },
    size: { width: 70, length: 50, height: 28 },
    visible: true,
    interactive: true,
    zoneId: 'zone-operations-grid',
    agentId: 'agent-bob',
    color: '#f5a524',
    secondaryColor: '#c2410c',
    glowColor: 'rgba(245, 165, 36, 0.35)',
    metadata: {
      stationName: 'Bob Operations Desk',
      sector: 'OPERATIONS'
    }
  },
  {
    id: 'obj-bob-screen',
    type: 'SCREEN',
    name: 'Sandbox Tool Telemetry Monitor',
    position: { x: -245, y: 210, z: 25 },
    size: { width: 45, length: 10, height: 35 },
    visible: true,
    interactive: false,
    zoneId: 'zone-operations-grid',
    color: '#f5a524',
    glowColor: 'rgba(245, 165, 36, 0.5)'
  },
  {
    id: 'obj-bob-pipeline-engine',
    type: 'MACHINE',
    name: 'Autonomous Task Pipeline Engine',
    position: { x: -260, y: 140, z: 0 },
    size: { width: 30, length: 40, height: 45 },
    visible: true,
    interactive: false,
    zoneId: 'zone-operations-grid',
    color: '#ea580c',
    glowColor: 'rgba(234, 88, 12, 0.3)'
  },

  // ── 4. CAROL: KNOWLEDGE ARCHIVE ──
  {
    id: 'obj-carol-desk',
    type: 'AGENT_STATION',
    name: 'Memory Library Console Desk',
    position: { x: 220, y: -180, z: 0 },
    size: { width: 70, length: 50, height: 28 },
    visible: true,
    interactive: true,
    zoneId: 'zone-knowledge-archive',
    agentId: 'agent-carol',
    color: '#a855f7',
    secondaryColor: '#6b21a8',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    metadata: {
      stationName: 'Carol Knowledge Desk',
      sector: 'KNOWLEDGE'
    }
  },
  {
    id: 'obj-carol-screen',
    type: 'SCREEN',
    name: 'Episodic Memory Crystal Array',
    position: { x: 245, y: -210, z: 25 },
    size: { width: 45, length: 10, height: 35 },
    visible: true,
    interactive: false,
    zoneId: 'zone-knowledge-archive',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)'
  },
  {
    id: 'obj-carol-archive-vault',
    type: 'MACHINE',
    name: 'Vector Database Storage Vault',
    position: { x: 260, y: -140, z: 0 },
    size: { width: 25, length: 45, height: 50 },
    visible: true,
    interactive: false,
    zoneId: 'zone-knowledge-archive',
    color: '#7e22ce',
    glowColor: 'rgba(126, 34, 206, 0.3)'
  },

  // ── 5. DAVE: COMMAND CENTER ──
  {
    id: 'obj-dave-desk',
    type: 'AGENT_STATION',
    name: 'Strategic Command Console Desk',
    position: { x: 220, y: 180, z: 0 },
    size: { width: 70, length: 50, height: 28 },
    visible: true,
    interactive: true,
    zoneId: 'zone-command-hub',
    agentId: 'agent-dave',
    color: '#10e890',
    secondaryColor: '#047857',
    glowColor: 'rgba(16, 232, 144, 0.35)',
    metadata: {
      stationName: 'Dave Command Desk',
      sector: 'COMMAND'
    }
  },
  {
    id: 'obj-dave-screen',
    type: 'SCREEN',
    name: 'Tactical Multi-Agent Holo-Globe',
    position: { x: 245, y: 210, z: 25 },
    size: { width: 45, length: 10, height: 35 },
    visible: true,
    interactive: false,
    zoneId: 'zone-command-hub',
    color: '#10e890',
    glowColor: 'rgba(16, 232, 144, 0.5)'
  },
  {
    id: 'obj-dave-dispatch-beacon',
    type: 'MACHINE',
    name: 'Global Dispatch Synchronizer',
    position: { x: 260, y: 140, z: 0 },
    size: { width: 30, length: 40, height: 55 },
    visible: true,
    interactive: false,
    zoneId: 'zone-command-hub',
    color: '#059669',
    glowColor: 'rgba(5, 150, 105, 0.3)'
  }
];

// High-speed energy conduit pathways between Central Plaza and Sectors
export const CONDUIT_PATHWAYS = [
  {
    id: 'conduit-plaza-alice',
    fromZone: 'zone-central-plaza',
    toZone: 'zone-research-lab',
    from: { x: -30, y: -30, z: 0 },
    to: { x: -180, y: -150, z: 0 },
    color: '#00e8ff',
    pulseSpeed: 1.8
  },
  {
    id: 'conduit-plaza-bob',
    fromZone: 'zone-central-plaza',
    toZone: 'zone-operations-grid',
    from: { x: -30, y: 30, z: 0 },
    to: { x: -180, y: 150, z: 0 },
    color: '#f5a524',
    pulseSpeed: 1.6
  },
  {
    id: 'conduit-plaza-carol',
    fromZone: 'zone-central-plaza',
    toZone: 'zone-knowledge-archive',
    from: { x: 30, y: -30, z: 0 },
    to: { x: 180, y: -150, z: 0 },
    color: '#a855f7',
    pulseSpeed: 1.7
  },
  {
    id: 'conduit-plaza-dave',
    fromZone: 'zone-central-plaza',
    toZone: 'zone-command-hub',
    from: { x: 30, y: 30, z: 0 },
    to: { x: 180, y: 150, z: 0 },
    color: '#10e890',
    pulseSpeed: 2.0
  }
];
