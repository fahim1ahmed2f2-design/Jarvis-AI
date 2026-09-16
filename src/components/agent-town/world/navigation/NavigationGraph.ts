/**
 * JARVIS Agent Town — Spatial Navigation Graph & Obstacle Definitions
 * Step 5: Real Agent Walking, Pathfinding and Natural Movement
 */

import { NavNode, ObstacleBounds } from './types';

// ── 24 SPATIAL NAVIGATION GRAPH NODES ──
export const NAVIGATION_NODES: Record<string, NavNode> = {
  // ── Central Neural Plaza Hub ──
  NODE_HUB_CENTER: {
    id: 'NODE_HUB_CENTER',
    name: 'Central Synaptic Junction',
    position: { x: 0, y: 0, z: 0 },
    connections: ['NODE_HUB_NORTH', 'NODE_HUB_SOUTH', 'NODE_HUB_EAST', 'NODE_HUB_WEST'],
    zoneId: 'zone-central-plaza'
  },
  NODE_HUB_NORTH: {
    id: 'NODE_HUB_NORTH',
    name: 'Plaza North Portal',
    position: { x: 0, y: -50, z: 0 },
    connections: ['NODE_HUB_CENTER', 'NODE_CORRIDOR_ALICE', 'NODE_CORRIDOR_CAROL', 'NODE_NORTH_BRIDGE_MID'],
    zoneId: 'zone-central-plaza'
  },
  NODE_HUB_SOUTH: {
    id: 'NODE_HUB_SOUTH',
    name: 'Plaza South Portal',
    position: { x: 0, y: 50, z: 0 },
    connections: ['NODE_HUB_CENTER', 'NODE_CORRIDOR_BOB', 'NODE_CORRIDOR_DAVE', 'NODE_SOUTH_BRIDGE_MID'],
    zoneId: 'zone-central-plaza'
  },
  NODE_HUB_WEST: {
    id: 'NODE_HUB_WEST',
    name: 'Plaza West Concourse',
    position: { x: -50, y: 0, z: 0 },
    connections: ['NODE_HUB_CENTER', 'NODE_CORRIDOR_ALICE', 'NODE_CORRIDOR_BOB'],
    zoneId: 'zone-central-plaza'
  },
  NODE_HUB_EAST: {
    id: 'NODE_HUB_EAST',
    name: 'Plaza East Concourse',
    position: { x: 50, y: 0, z: 0 },
    connections: ['NODE_HUB_CENTER', 'NODE_CORRIDOR_CAROL', 'NODE_CORRIDOR_DAVE'],
    zoneId: 'zone-central-plaza'
  },

  // ── Alice: Investigation & Research Lab ──
  NODE_CORRIDOR_ALICE: {
    id: 'NODE_CORRIDOR_ALICE',
    name: 'Research Lab Concourse',
    position: { x: -120, y: -100, z: 0 },
    connections: ['NODE_HUB_NORTH', 'NODE_HUB_WEST', 'NODE_ALICE_COMM_POINT', 'NODE_NORTH_BRIDGE_MID'],
    zoneId: 'zone-research-lab'
  },
  NODE_ALICE_HOME: {
    id: 'NODE_ALICE_HOME',
    name: "Alice's Primary Station",
    position: { x: -220, y: -180, z: 0 },
    connections: ['NODE_ALICE_DESK', 'NODE_ALICE_COMM_POINT'],
    assignedAgentId: 'agent-alice',
    zoneId: 'zone-research-lab'
  },
  NODE_ALICE_DESK: {
    id: 'NODE_ALICE_DESK',
    name: 'Investigation Terminal Desk',
    position: { x: -200, y: -160, z: 0 },
    connections: ['NODE_ALICE_HOME', 'NODE_ALICE_COMM_POINT'],
    zoneId: 'zone-research-lab'
  },
  NODE_ALICE_COMM_POINT: {
    id: 'NODE_ALICE_COMM_POINT',
    name: "Alice's Visitor Staging Point",
    position: { x: -180, y: -180, z: 0 },
    connections: ['NODE_CORRIDOR_ALICE', 'NODE_ALICE_HOME', 'NODE_ALICE_DESK'],
    isCommunicationPoint: true,
    assignedAgentId: 'agent-alice',
    zoneId: 'zone-research-lab'
  },

  // ── Bob: Operations & Automation Lab ──
  NODE_CORRIDOR_BOB: {
    id: 'NODE_CORRIDOR_BOB',
    name: 'Operations Grid Concourse',
    position: { x: -120, y: 100, z: 0 },
    connections: ['NODE_HUB_SOUTH', 'NODE_HUB_WEST', 'NODE_BOB_COMM_POINT', 'NODE_SOUTH_BRIDGE_MID'],
    zoneId: 'zone-operations-grid'
  },
  NODE_BOB_HOME: {
    id: 'NODE_BOB_HOME',
    name: "Bob's Primary Station",
    position: { x: -220, y: 180, z: 0 },
    connections: ['NODE_BOB_CONSOLE', 'NODE_BOB_COMM_POINT'],
    assignedAgentId: 'agent-bob',
    zoneId: 'zone-operations-grid'
  },
  NODE_BOB_CONSOLE: {
    id: 'NODE_BOB_CONSOLE',
    name: 'Automation Console Desk',
    position: { x: -200, y: 160, z: 0 },
    connections: ['NODE_BOB_HOME', 'NODE_BOB_COMM_POINT'],
    zoneId: 'zone-operations-grid'
  },
  NODE_BOB_COMM_POINT: {
    id: 'NODE_BOB_COMM_POINT',
    name: "Bob's Visitor Staging Point",
    position: { x: -180, y: 180, z: 0 },
    connections: ['NODE_CORRIDOR_BOB', 'NODE_BOB_HOME', 'NODE_BOB_CONSOLE'],
    isCommunicationPoint: true,
    assignedAgentId: 'agent-bob',
    zoneId: 'zone-operations-grid'
  },

  // ── Carol: Memory Archive & Library ──
  NODE_CORRIDOR_CAROL: {
    id: 'NODE_CORRIDOR_CAROL',
    name: 'Knowledge Library Concourse',
    position: { x: 120, y: -100, z: 0 },
    connections: ['NODE_HUB_NORTH', 'NODE_HUB_EAST', 'NODE_CAROL_COMM_POINT', 'NODE_NORTH_BRIDGE_MID'],
    zoneId: 'zone-knowledge-archive'
  },
  NODE_CAROL_HOME: {
    id: 'NODE_CAROL_HOME',
    name: "Carol's Primary Station",
    position: { x: 220, y: -180, z: 0 },
    connections: ['NODE_CAROL_ARCHIVE', 'NODE_CAROL_COMM_POINT'],
    assignedAgentId: 'agent-carol',
    zoneId: 'zone-knowledge-archive'
  },
  NODE_CAROL_ARCHIVE: {
    id: 'NODE_CAROL_ARCHIVE',
    name: 'Memory Library Console Desk',
    position: { x: 200, y: -160, z: 0 },
    connections: ['NODE_CAROL_HOME', 'NODE_CAROL_COMM_POINT'],
    zoneId: 'zone-knowledge-archive'
  },
  NODE_CAROL_COMM_POINT: {
    id: 'NODE_CAROL_COMM_POINT',
    name: "Carol's Visitor Staging Point",
    position: { x: 180, y: -180, z: 0 },
    connections: ['NODE_CORRIDOR_CAROL', 'NODE_CAROL_HOME', 'NODE_CAROL_ARCHIVE'],
    isCommunicationPoint: true,
    assignedAgentId: 'agent-carol',
    zoneId: 'zone-knowledge-archive'
  },

  // ── Dave: Strategic Command Center ──
  NODE_CORRIDOR_DAVE: {
    id: 'NODE_CORRIDOR_DAVE',
    name: 'Command Causeway Concourse',
    position: { x: 120, y: 100, z: 0 },
    connections: ['NODE_HUB_SOUTH', 'NODE_HUB_EAST', 'NODE_DAVE_COMM_POINT', 'NODE_SOUTH_BRIDGE_MID'],
    zoneId: 'zone-command-hub'
  },
  NODE_DAVE_HOME: {
    id: 'NODE_DAVE_HOME',
    name: "Dave's Primary Station",
    position: { x: 220, y: 180, z: 0 },
    connections: ['NODE_DAVE_COMMAND', 'NODE_DAVE_COMM_POINT'],
    assignedAgentId: 'agent-dave',
    zoneId: 'zone-command-hub'
  },
  NODE_DAVE_COMMAND: {
    id: 'NODE_DAVE_COMMAND',
    name: 'Strategic Command Table',
    position: { x: 200, y: 160, z: 0 },
    connections: ['NODE_DAVE_HOME', 'NODE_DAVE_COMM_POINT'],
    zoneId: 'zone-command-hub'
  },
  NODE_DAVE_COMM_POINT: {
    id: 'NODE_DAVE_COMM_POINT',
    name: "Dave's Visitor Staging Point",
    position: { x: 180, y: 180, z: 0 },
    connections: ['NODE_CORRIDOR_DAVE', 'NODE_DAVE_HOME', 'NODE_DAVE_COMMAND'],
    isCommunicationPoint: true,
    assignedAgentId: 'agent-dave',
    zoneId: 'zone-command-hub'
  },

  // ── Inter-Sector Cross-Bridges ──
  NODE_NORTH_BRIDGE_MID: {
    id: 'NODE_NORTH_BRIDGE_MID',
    name: 'North Inter-Sector Data Bridge',
    position: { x: 0, y: -190, z: 0 },
    connections: ['NODE_CORRIDOR_ALICE', 'NODE_CORRIDOR_CAROL', 'NODE_HUB_NORTH'],
    zoneId: 'zone-central-plaza'
  },
  NODE_SOUTH_BRIDGE_MID: {
    id: 'NODE_SOUTH_BRIDGE_MID',
    name: 'South Inter-Sector Ops Bridge',
    position: { x: 0, y: 190, z: 0 },
    connections: ['NODE_CORRIDOR_BOB', 'NODE_CORRIDOR_DAVE', 'NODE_HUB_SOUTH'],
    zoneId: 'zone-central-plaza'
  }
};

// ── NON-WALKABLE OBSTACLES (Desks, Server Racks, Quantum Core) ──
export const WORLD_OBSTACLES: ObstacleBounds[] = [
  // Central Quantum Reactor
  {
    id: 'obs-reactor-core',
    name: 'Quantum Reactor Core',
    minX: -26,
    maxX: 26,
    minY: -26,
    maxY: 26
  },
  // Alice Research Desks and Racks
  {
    id: 'obs-alice-furniture',
    name: 'Research Compute Equipment',
    minX: -285,
    maxX: -225,
    minY: -210,
    maxY: -130
  },
  // Bob Operations Desks and Robotic Arm
  {
    id: 'obs-bob-furniture',
    name: 'Operations Workstation Equipment',
    minX: -285,
    maxX: -225,
    minY: 130,
    maxY: 235
  },
  // Carol Knowledge Shelves and Vault
  {
    id: 'obs-carol-furniture',
    name: 'Memory Shelves and Vault',
    minX: 225,
    maxX: 285,
    minY: -235,
    maxY: -130
  },
  // Dave Command Table and Beacon
  {
    id: 'obs-dave-furniture',
    name: 'Strategic Command Table',
    minX: 225,
    maxX: 285,
    minY: 130,
    maxY: 235
  }
];
