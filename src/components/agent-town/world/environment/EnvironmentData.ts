/**
 * JARVIS Agent Town — Environment Data Models
 * Step 3: Living Agent Town Environment & Data-Driven Workspace Architecture
 */

import { RoomData, PathSegment, AmbientDrone, WorldBoundary } from './types';

// World Camera Bounds to prevent drifting into empty space
export const WORLD_BOUNDARIES: WorldBoundary = {
  minX: -400,
  maxX: 400,
  minY: -350,
  maxY: 350
};

// ── 5 DISTINCT WORKSPACE ROOMS ──
export const TOWN_ROOMS: RoomData[] = [
  // ── 1. CENTRAL NEURAL HUB ──
  {
    id: 'room-central-hub',
    name: 'Central Neural Plaza',
    codename: 'CORE // HUB-00',
    category: 'CENTRAL_HUB',
    description: 'Central communal meeting hub, quantum core reactor, and synaptic data junction',
    agentId: '',
    agentName: 'Shared Common',
    center: { x: 0, y: 0, z: 0 },
    bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
    color: '#00e8ff',
    accentColor: '#a855f7',
    ambientGlowColor: 'rgba(0, 232, 255, 0.15)',
    floorPattern: 'REACTOR_CORE',
    interactionPoints: [
      {
        id: 'point-quantum-core',
        name: 'Quantum Core Reactor',
        category: 'POWER & SYNC',
        description: 'Central synaptic power core synchronizing all autonomous agent neural processes',
        roomId: 'room-central-hub',
        position: { x: 0, y: 0, z: 0 },
        radius: 35,
        iconName: 'Zap',
        primaryColor: '#00e8ff',
        status: 'ACTIVE'
      },
      {
        id: 'point-cyber-terrarium',
        name: 'Bio-Data Terrarium',
        category: 'ATMOSPHERE',
        description: 'Holographic cybernetic flora synthesizing digital harmonic resonance for the town',
        roomId: 'room-central-hub',
        position: { x: -60, y: 0, z: 0 },
        radius: 25,
        iconName: 'Sparkles',
        primaryColor: '#10e890',
        status: 'ONLINE'
      }
    ],
    props: [
      {
        id: 'prop-quantum-core',
        name: 'Quantum Reactor Core',
        roomId: 'room-central-hub',
        type: 'QUANTUM_REACTOR_CORE',
        position: { x: 0, y: 0, z: 0 },
        size: { width: 50, length: 50, height: 35 },
        color: '#00e8ff',
        secondaryColor: '#a855f7',
        interactive: true,
        interactionPointId: 'point-quantum-core'
      },
      {
        id: 'prop-cyber-terrarium',
        name: 'Bio-Data Terrarium',
        roomId: 'room-central-hub',
        type: 'CYBER_TERRARIUM',
        position: { x: -60, y: 0, z: 0 },
        size: { width: 24, length: 24, height: 26 },
        color: '#10e890',
        secondaryColor: '#059669',
        interactive: true,
        interactionPointId: 'point-cyber-terrarium'
      }
    ]
  },

  // ── 2. ALICE: INVESTIGATION & RESEARCH LAB ──
  {
    id: 'room-alice-lab',
    name: 'Investigation & Research Lab',
    codename: 'SECTOR-01 // RES-LAB',
    category: 'RESEARCH_LAB',
    description: 'Empirical data analysis, synthesis heuristics, and deep hypothesis generation',
    agentId: 'agent-alice',
    agentName: 'Alice',
    center: { x: -220, y: -180, z: 0 },
    bounds: { minX: -320, maxX: -120, minY: -280, maxY: -80 },
    color: '#00e8ff',
    accentColor: '#38bdf8',
    ambientGlowColor: 'rgba(0, 232, 255, 0.12)',
    floorPattern: 'HEX_CIRCUIT',
    interactionPoints: [
      {
        id: 'point-alice-desk',
        name: 'Research Terminal Desk',
        category: 'WORKSTATION',
        description: 'Deep inquiry console with neural hypothesis synthesis matrix',
        roomId: 'room-alice-lab',
        agentId: 'agent-alice',
        position: { x: -220, y: -180, z: 0 },
        radius: 35,
        iconName: 'Brain',
        primaryColor: '#00e8ff',
        status: 'ACTIVE'
      },
      {
        id: 'point-alice-screen',
        name: 'Analytical Holo-Screen Array',
        category: 'MONITORING',
        description: 'Multi-variable empirical telemetry charts and active literature feed',
        roomId: 'room-alice-lab',
        position: { x: -245, y: -215, z: 20 },
        radius: 25,
        iconName: 'Activity',
        primaryColor: '#38bdf8',
        status: 'ONLINE'
      },
      {
        id: 'point-alice-rack',
        name: 'Neural Tensor Compute Array',
        category: 'COMPUTE',
        description: 'High-density GPU tensor cluster dedicated to complex statistical correlations',
        roomId: 'room-alice-lab',
        position: { x: -270, y: -140, z: 0 },
        radius: 25,
        iconName: 'Server',
        primaryColor: '#0284c7',
        status: 'ONLINE'
      }
    ],
    props: [
      {
        id: 'prop-alice-desk',
        name: 'Research Workstation',
        roomId: 'room-alice-lab',
        type: 'RESEARCH_DESK',
        position: { x: -220, y: -180, z: 0 },
        size: { width: 65, length: 48, height: 26 },
        color: '#00e8ff',
        secondaryColor: '#0369a1',
        interactive: true,
        interactionPointId: 'point-alice-desk'
      },
      {
        id: 'prop-alice-screen',
        name: 'Holo-Screen Array',
        roomId: 'room-alice-lab',
        type: 'HOLO_MONITOR_ARRAY',
        position: { x: -245, y: -215, z: 20 },
        size: { width: 44, length: 10, height: 32 },
        color: '#00e8ff',
        secondaryColor: '#38bdf8',
        interactive: true,
        interactionPointId: 'point-alice-screen'
      },
      {
        id: 'prop-alice-rack',
        name: 'Tensor Compute Array',
        roomId: 'room-alice-lab',
        type: 'SERVER_RACK_UNIT',
        position: { x: -270, y: -140, z: 0 },
        size: { width: 22, length: 42, height: 48 },
        color: '#0284c7',
        secondaryColor: '#0c4a6e',
        interactive: true,
        interactionPointId: 'point-alice-rack'
      }
    ]
  },

  // ── 3. BOB: OPERATIONS & AUTOMATION LAB ──
  {
    id: 'room-bob-ops',
    name: 'Operations & Automation Lab',
    codename: 'SECTOR-02 // OPS-GRID',
    category: 'OPERATIONS_LAB',
    description: 'System automation pipelines, tool execution sandbox, and task dispatching',
    agentId: 'agent-bob',
    agentName: 'Bob',
    center: { x: -220, y: 180, z: 0 },
    bounds: { minX: -320, maxX: -120, minY: 80, maxY: 280 },
    color: '#f5a524',
    accentColor: '#fb923c',
    ambientGlowColor: 'rgba(245, 165, 36, 0.12)',
    floorPattern: 'GRID_PULSE',
    interactionPoints: [
      {
        id: 'point-bob-desk',
        name: 'Automation Workstation Desk',
        category: 'WORKSTATION',
        description: 'Multi-channel script orchestration and secure process executor console',
        roomId: 'room-bob-ops',
        agentId: 'agent-bob',
        position: { x: -220, y: 180, z: 0 },
        radius: 35,
        iconName: 'Cpu',
        primaryColor: '#f5a524',
        status: 'ACTIVE'
      },
      {
        id: 'point-bob-arm',
        name: 'Robotic Assembler Unit',
        category: 'TOOLING',
        description: 'Automated workflow pipeline compiler with physical diagnostic feedback',
        roomId: 'room-bob-ops',
        position: { x: -270, y: 220, z: 0 },
        radius: 25,
        iconName: 'Wrench',
        primaryColor: '#ea580c',
        status: 'ONLINE'
      },
      {
        id: 'point-bob-screen',
        name: 'Sandbox Telemetry Monitor',
        category: 'MONITORING',
        description: 'Real-time CPU/RAM execution telemetry and tool sandbox audit feed',
        roomId: 'room-bob-ops',
        position: { x: -245, y: 145, z: 20 },
        radius: 25,
        iconName: 'Terminal',
        primaryColor: '#fb923c',
        status: 'ONLINE'
      }
    ],
    props: [
      {
        id: 'prop-bob-desk',
        name: 'Operations Desk',
        roomId: 'room-bob-ops',
        type: 'OPERATIONS_DESK',
        position: { x: -220, y: 180, z: 0 },
        size: { width: 65, length: 48, height: 26 },
        color: '#f5a524',
        secondaryColor: '#c2410c',
        interactive: true,
        interactionPointId: 'point-bob-desk'
      },
      {
        id: 'prop-bob-arm',
        name: 'Robotic Assembler Arm',
        roomId: 'room-bob-ops',
        type: 'ROBOTIC_ARM',
        position: { x: -270, y: 220, z: 0 },
        size: { width: 28, length: 28, height: 42 },
        color: '#ea580c',
        secondaryColor: '#7c2d12',
        interactive: true,
        interactionPointId: 'point-bob-arm'
      },
      {
        id: 'prop-bob-screen',
        name: 'Telemetry Screen',
        roomId: 'room-bob-ops',
        type: 'HOLO_MONITOR_ARRAY',
        position: { x: -245, y: 145, z: 20 },
        size: { width: 44, length: 10, height: 32 },
        color: '#f5a524',
        secondaryColor: '#ea580c',
        interactive: true,
        interactionPointId: 'point-bob-screen'
      }
    ]
  },

  // ── 4. CAROL: KNOWLEDGE ARCHIVE & LIBRARY ──
  {
    id: 'room-carol-library',
    name: 'Memory Archive & Library',
    codename: 'SECTOR-03 // MEM-ARCH',
    category: 'KNOWLEDGE_LIBRARY',
    description: 'Episodic knowledge consolidation, vector embeddings, and cross-agent indexing',
    agentId: 'agent-carol',
    agentName: 'Carol',
    center: { x: 220, y: -180, z: 0 },
    bounds: { minX: 120, maxX: 320, minY: -280, maxY: -80 },
    color: '#a855f7',
    accentColor: '#c084fc',
    ambientGlowColor: 'rgba(168, 85, 247, 0.12)',
    floorPattern: 'CRYSTAL_FACET',
    interactionPoints: [
      {
        id: 'point-carol-desk',
        name: 'Knowledge Library Console Desk',
        category: 'WORKSTATION',
        description: 'Episodic memory query console with semantic concept cross-referencing',
        roomId: 'room-carol-library',
        agentId: 'agent-carol',
        position: { x: 220, y: -180, z: 0 },
        radius: 35,
        iconName: 'BookOpen',
        primaryColor: '#a855f7',
        status: 'ACTIVE'
      },
      {
        id: 'point-carol-shelves',
        name: 'Holographic Knowledge Shelves',
        category: 'ARCHIVE',
        description: 'Floating vector data crystals housing historical agent conversations and notes',
        roomId: 'room-carol-library',
        position: { x: 260, y: -220, z: 0 },
        radius: 28,
        iconName: 'Layers',
        primaryColor: '#c084fc',
        status: 'ONLINE'
      },
      {
        id: 'point-carol-vault',
        name: 'Vector Database Storage Vault',
        category: 'STORAGE',
        description: 'High-dimensional vector embedding store for lightning-fast memory retrieval',
        roomId: 'room-carol-library',
        position: { x: 270, y: -140, z: 0 },
        radius: 25,
        iconName: 'Database',
        primaryColor: '#7e22ce',
        status: 'ONLINE'
      }
    ],
    props: [
      {
        id: 'prop-carol-desk',
        name: 'Library Desk',
        roomId: 'room-carol-library',
        type: 'KNOWLEDGE_DESK',
        position: { x: 220, y: -180, z: 0 },
        size: { width: 65, length: 48, height: 26 },
        color: '#a855f7',
        secondaryColor: '#6b21a8',
        interactive: true,
        interactionPointId: 'point-carol-desk'
      },
      {
        id: 'prop-carol-shelves',
        name: 'Knowledge Shelves',
        roomId: 'room-carol-library',
        type: 'KNOWLEDGE_SHELVES',
        position: { x: 260, y: -220, z: 0 },
        size: { width: 48, length: 18, height: 46 },
        color: '#c084fc',
        secondaryColor: '#581c87',
        interactive: true,
        interactionPointId: 'point-carol-shelves'
      },
      {
        id: 'prop-carol-vault',
        name: 'Vector Storage Vault',
        roomId: 'room-carol-library',
        type: 'SERVER_RACK_UNIT',
        position: { x: 270, y: -140, z: 0 },
        size: { width: 22, length: 42, height: 48 },
        color: '#7e22ce',
        secondaryColor: '#3b0764',
        interactive: true,
        interactionPointId: 'point-carol-vault'
      }
    ]
  },

  // ── 5. DAVE: STRATEGIC COMMAND CENTER ──
  {
    id: 'room-dave-command',
    name: 'Strategic Command Center',
    codename: 'SECTOR-04 // CMD-HUB',
    category: 'COMMAND_CENTER',
    description: 'Multi-agent orchestration, mission roadmaps, and central priority governance',
    agentId: 'agent-dave',
    agentName: 'Dave',
    center: { x: 220, y: 180, z: 0 },
    bounds: { minX: 120, maxX: 320, minY: 80, maxY: 280 },
    color: '#10e890',
    accentColor: '#34d399',
    ambientGlowColor: 'rgba(16, 232, 144, 0.12)',
    floorPattern: 'RADAR_RINGS',
    interactionPoints: [
      {
        id: 'point-dave-table',
        name: 'Strategic Command Table',
        category: 'WORKSTATION',
        description: 'Master mission dispatch table with live multi-agent subtask graph visualizer',
        roomId: 'room-dave-command',
        agentId: 'agent-dave',
        position: { x: 220, y: 180, z: 0 },
        radius: 35,
        iconName: 'Shield',
        primaryColor: '#10e890',
        status: 'ACTIVE'
      },
      {
        id: 'point-dave-globe',
        name: 'Tactical Multi-Agent Holo-Globe',
        category: 'PLANNING',
        description: 'Dynamic 3D tactical projection of all active agent tasks and collaboration links',
        roomId: 'room-dave-command',
        position: { x: 250, y: 215, z: 20 },
        radius: 26,
        iconName: 'Globe',
        primaryColor: '#34d399',
        status: 'ONLINE'
      },
      {
        id: 'point-dave-dispatch',
        name: 'Global Dispatch Synchronizer',
        category: 'ORCHESTRATION',
        description: 'Priority queue router balancing neural latency across all 4 sectors',
        roomId: 'room-dave-command',
        position: { x: 270, y: 140, z: 0 },
        radius: 25,
        iconName: 'Radio',
        primaryColor: '#059669',
        status: 'ONLINE'
      }
    ],
    props: [
      {
        id: 'prop-dave-table',
        name: 'Command Table',
        roomId: 'room-dave-command',
        type: 'COMMAND_TABLE',
        position: { x: 220, y: 180, z: 0 },
        size: { width: 68, length: 50, height: 26 },
        color: '#10e890',
        secondaryColor: '#047857',
        interactive: true,
        interactionPointId: 'point-dave-table'
      },
      {
        id: 'prop-dave-globe',
        name: 'Tactical Holo-Globe',
        roomId: 'room-dave-command',
        type: 'COMMAND_GLOBE_STATION',
        position: { x: 250, y: 215, z: 20 },
        size: { width: 34, length: 34, height: 36 },
        color: '#10e890',
        secondaryColor: '#34d399',
        interactive: true,
        interactionPointId: 'point-dave-globe'
      },
      {
        id: 'prop-dave-dispatch',
        name: 'Dispatch Synchronizer',
        roomId: 'room-dave-command',
        type: 'SERVER_RACK_UNIT',
        position: { x: 270, y: 140, z: 0 },
        size: { width: 24, length: 42, height: 52 },
        color: '#059669',
        secondaryColor: '#064e3b',
        interactive: true,
        interactionPointId: 'point-dave-dispatch'
      }
    ]
  }
];

// ── ILLUMINATED WALKWAYS & PATH NETWORK ──
export const TOWN_PATHWAYS: PathSegment[] = [
  // Hub to Alice Lab
  {
    id: 'path-hub-alice',
    name: 'Research Concourse',
    from: { x: -40, y: -40, z: 0 },
    to: { x: -170, y: -140, z: 0 },
    width: 20,
    color: '#00e8ff',
    pulseSpeed: 1.8,
    glowIntensity: 0.5
  },
  // Hub to Bob Operations
  {
    id: 'path-hub-bob',
    name: 'Operations Pathway',
    from: { x: -40, y: 40, z: 0 },
    to: { x: -170, y: 140, z: 0 },
    width: 20,
    color: '#f5a524',
    pulseSpeed: 1.6,
    glowIntensity: 0.5
  },
  // Hub to Carol Library
  {
    id: 'path-hub-carol',
    name: 'Archive Promenade',
    from: { x: 40, y: -40, z: 0 },
    to: { x: 170, y: -140, z: 0 },
    width: 20,
    color: '#a855f7',
    pulseSpeed: 1.7,
    glowIntensity: 0.5
  },
  // Hub to Dave Command
  {
    id: 'path-hub-dave',
    name: 'Command Causeway',
    from: { x: 40, y: 40, z: 0 },
    to: { x: 170, y: 140, z: 0 },
    width: 20,
    color: '#10e890',
    pulseSpeed: 2.0,
    glowIntensity: 0.5
  },
  // North Cross-Bridge (Alice Lab to Carol Library)
  {
    id: 'path-alice-carol-bridge',
    name: 'Data Transfer Bridge',
    from: { x: -150, y: -190, z: 0 },
    to: { x: 150, y: -190, z: 0 },
    width: 12,
    color: '#38bdf8',
    pulseSpeed: 1.2,
    glowIntensity: 0.35
  },
  // South Cross-Bridge (Bob Ops to Dave Command)
  {
    id: 'path-bob-dave-bridge',
    name: 'Tactical Operations Bridge',
    from: { x: -150, y: 190, z: 0 },
    to: { x: 150, y: 190, z: 0 },
    width: 12,
    color: '#34d399',
    pulseSpeed: 1.2,
    glowIntensity: 0.35
  }
];

// ── PLAYFUL DETAIL: AUTONOMOUS MAINTENANCE DRONE ──
export const INITIAL_MAINTENANCE_DRONE: AmbientDrone = {
  id: 'drone-sparky',
  name: 'Sparky // Maint-Bot 01',
  position: { x: 0, y: 0, z: 12 },
  targetWaypoints: [
    { x: 0, y: 0, z: 12 },
    { x: -120, y: -100, z: 12 },
    { x: 0, y: -50, z: 12 },
    { x: 120, y: -100, z: 12 },
    { x: 50, y: 0, z: 12 },
    { x: 120, y: 100, z: 12 },
    { x: 0, y: 50, z: 12 },
    { x: -120, y: 100, z: 12 }
  ],
  currentWaypointIndex: 0,
  speed: 45, // World units per second
  bobPhase: 0,
  rotation: 0,
  color: '#00e8ff',
  scanPulse: 0
};
