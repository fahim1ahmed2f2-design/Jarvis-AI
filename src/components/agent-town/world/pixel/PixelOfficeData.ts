/**
 * JARVIS Agent Town v4.0 Sovereign — Realistic Silicon Valley Tech Office Campus Data
 * 
 * 8 Dedicated High-Tech Office Spaces:
 * 1. 👑 Executive Boardroom & Supreme Sanctum (JARVIS)
 * 2. 🔬 AI Research & Neural Lab (Alice)
 * 3. 📚 Knowledge Archive & Digital Library (Carol)
 * 4. 🎨 UX & Media Design Studio (Tuly)
 * 5. 🛡️ Cyber Defense & Threat War Room (Jonson & Knox)
 * 6. ⚡ Open-Plan Software & Big Data Engineering Bay (Bob & Mob)
 * 7. 🎖️ Mission Strategy & Operations HQ (Dave)
 * 8. ☕ Central Tech Pantry, Cafeteria & Recreation Lounge (Grand Social Hub)
 */

export interface PixelRoom {
  id: string;
  name: string;
  codename: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floorType:
    | 'PENTHOUSE_GOLD_MARBLE'
    | 'PARQUET_MAHOGANY'
    | 'LAB_CYAN_TILE'
    | 'STUDIO_PASTEL'
    | 'CYBER_STEEL'
    | 'WORKSHOP_GRID'
    | 'COMMAND_NAVY'
    | 'PLAZA_TERRAZZO';
  accentColor: string;
  icon: string;
  department: string;
}

export interface PixelFurniture {
  id: string;
  type:
    | 'DESK'
    | 'CHAIR'
    | 'BOARDROOM_TABLE'
    | 'BOOKSHELF'
    | 'STUDY_TABLE'
    | 'OPEN_BOOK'
    | 'WHITEBOARD'
    | 'STRATEGY_TABLE'
    | 'COFFEE_BAR'
    | 'ESPRESSO_MACHINE'
    | 'PING_PONG_TABLE'
    | 'VENDING_MACHINE'
    | 'PLANT'
    | 'WATER_COOLER'
    | 'SECTIONAL_COUCH'
    | 'COUCH'
    | 'FILING_CABINET'
    | 'LAB_BENCH'
    | 'SERVER_RACK'
    | 'WALL_DISPLAY'
    | 'DOOR'
    | 'HOLOGRAPHIC_GLOBE'
    | 'ART_EASEL'
    | 'CYBER_RADAR'
    | 'FOUNTAIN';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  label?: string;
  extra?: Record<string, any>;
}

export interface PixelDeskMapping {
  agentId: string;
  agentName: string;
  room: string;
  x: number;
  y: number;
  facing: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  monitors: number;
  screenColor: string;
  role: string;
}

export const PIXEL_ROOMS: PixelRoom[] = [
  // 1. 👑 Executive Boardroom & Supreme Sanctum (Top Center)
  {
    id: 'room_jarvis_penthouse',
    name: 'Executive Boardroom & Supreme Sanctum',
    codename: 'SECTOR // 00 : EXECUTIVE SUITE',
    x: 540,
    y: 40,
    width: 520,
    height: 320,
    floorType: 'PENTHOUSE_GOLD_MARBLE',
    accentColor: '#eab308',
    icon: '👑',
    department: 'EXECUTIVE MANAGEMENT'
  },
  // 2. 📚 Knowledge Archive & Digital Library (Top Left)
  {
    id: 'room_carol_library',
    name: 'Knowledge Archive & Digital Library',
    codename: 'SECTOR // 01 : KNOWLEDGE & MEMORY',
    x: 40,
    y: 40,
    width: 460,
    height: 320,
    floorType: 'PARQUET_MAHOGANY',
    accentColor: '#a855f7',
    icon: '📚',
    department: 'INFORMATION ARCHITECTURE'
  },
  // 3. 🔬 AI Research & Neural Lab (Top Right)
  {
    id: 'room_alice_lab',
    name: 'AI Research & Neural Lab',
    codename: 'SECTOR // 02 : ADVANCED R&D',
    x: 1100,
    y: 40,
    width: 460,
    height: 320,
    floorType: 'LAB_CYAN_TILE',
    accentColor: '#00e8ff',
    icon: '🔬',
    department: 'NEURAL RESEARCH & DATA SCIENCE'
  },
  // 4. 🎨 UX & Media Design Studio (Mid Left)
  {
    id: 'room_tuly_studio',
    name: 'UX & Media Design Studio',
    codename: 'SECTOR // 03 : CREATIVE & DESIGN',
    x: 40,
    y: 400,
    width: 460,
    height: 360,
    floorType: 'STUDIO_PASTEL',
    accentColor: '#ec4899',
    icon: '🎨',
    department: 'PRODUCT & VISUAL DESIGN'
  },
  // 5. 🛡️ Cyber Defense & Threat War Room (Mid Right)
  {
    id: 'room_cyber_defense',
    name: 'Cyber Defense & Threat War Room',
    codename: 'SECTOR // 04 : SEC-OPS & CLOUD',
    x: 1100,
    y: 400,
    width: 460,
    height: 360,
    floorType: 'CYBER_STEEL',
    accentColor: '#ef4444',
    icon: '🛡️',
    department: 'SECURITY OPERATIONS & INFRASTRUCTURE'
  },
  // 6. ⚡ Open-Plan Software & Big Data Engineering Bay (Bottom Left)
  {
    id: 'room_bob_workshop',
    name: 'Software Engineering & Data Bay',
    codename: 'SECTOR // 05 : PLATFORM & DATA',
    x: 40,
    y: 800,
    width: 460,
    height: 360,
    floorType: 'WORKSHOP_GRID',
    accentColor: '#f59e0b',
    icon: '⚡',
    department: 'CORE SOFTWARE ENGINEERING'
  },
  // 7. 🎖️ Mission Strategy & Operations HQ (Bottom Right)
  {
    id: 'room_dave_command',
    name: 'Mission Strategy & Operations HQ',
    codename: 'SECTOR // 06 : TACTICAL COMMAND',
    x: 1100,
    y: 800,
    width: 460,
    height: 360,
    floorType: 'COMMAND_NAVY',
    accentColor: '#10e890',
    icon: '🎖️',
    department: 'GLOBAL TACTICAL DISPATCH'
  },
  // 8. ☕ Central Tech Pantry & Cafeteria Lounge (Center Hub)
  {
    id: 'room_central_plaza',
    name: 'Tech Pantry, Cafeteria & Lounge',
    codename: 'SECTOR // 07 : ALL-HANDS & CAFE',
    x: 540,
    y: 400,
    width: 520,
    height: 760,
    floorType: 'PLAZA_TERRAZZO',
    accentColor: '#38bdf8',
    icon: '☕',
    department: 'COMMUNITY & BREAKROOM'
  }
];

export const PIXEL_DESKS: Record<string, PixelDeskMapping> = {
  'agent-jarvis': {
    agentId: 'agent-jarvis',
    agentName: 'JARVIS',
    room: 'PENTHOUSE',
    x: 800,
    y: 150,
    facing: 'DOWN',
    monitors: 3,
    screenColor: '#eab308',
    role: 'Supreme Sovereign Officer'
  },
  'agent-carol': {
    agentId: 'agent-carol',
    agentName: 'Carol',
    room: 'LIBRARY',
    x: 270,
    y: 170,
    facing: 'DOWN',
    monitors: 2,
    screenColor: '#a855f7',
    role: 'Knowledge Architect'
  },
  'agent-alice': {
    agentId: 'agent-alice',
    agentName: 'Alice',
    room: 'RESEARCH_LAB',
    x: 1330,
    y: 170,
    facing: 'DOWN',
    monitors: 2,
    screenColor: '#00e8ff',
    role: 'Lead AI Researcher'
  },
  'agent-tuly': {
    agentId: 'agent-tuly',
    agentName: 'Tuly',
    room: 'STUDIO',
    x: 270,
    y: 530,
    facing: 'DOWN',
    monitors: 2,
    screenColor: '#ec4899',
    role: 'Principal UX Designer'
  },
  'agent-jonson': {
    agentId: 'agent-jonson',
    agentName: 'Jonson',
    room: 'CYBER_DEFENSE',
    x: 1240,
    y: 530,
    facing: 'DOWN',
    monitors: 3,
    screenColor: '#ef4444',
    role: 'Cyber Threat Specialist'
  },
  'agent-knox': {
    agentId: 'agent-knox',
    agentName: 'Knox',
    room: 'CYBER_DEFENSE',
    x: 1420,
    y: 530,
    facing: 'DOWN',
    monitors: 3,
    screenColor: '#10b981',
    role: 'Cloud Infra Lead'
  },
  'agent-bob': {
    agentId: 'agent-bob',
    agentName: 'Bob',
    room: 'OPS_WORKSHOP',
    x: 190,
    y: 930,
    facing: 'DOWN',
    monitors: 3,
    screenColor: '#f59e0b',
    role: 'Automation Lead'
  },
  'agent-mob': {
    agentId: 'agent-mob',
    agentName: 'Mob',
    room: 'OPS_WORKSHOP',
    x: 350,
    y: 930,
    facing: 'DOWN',
    monitors: 3,
    screenColor: '#f97316',
    role: 'Big Data Pipeline Architect'
  },
  'agent-dave': {
    agentId: 'agent-dave',
    agentName: 'Dave',
    room: 'COMMAND_HQ',
    x: 1330,
    y: 940,
    facing: 'UP',
    monitors: 3,
    screenColor: '#10e890',
    role: 'Strategic Mission Commander'
  }
};

export const PIXEL_FURNITURE: PixelFurniture[] = [
  // ── 1. 👑 EXECUTIVE BOARDROOM & PENTHOUSE ──
  { id: 'jv_desk', type: 'DESK', x: 740, y: 140, width: 120, height: 46, color: '#1e1b4b', extra: { monitors: 3, isExecutive: true } },
  { id: 'jv_boardroom_table', type: 'BOARDROOM_TABLE', x: 700, y: 220, width: 200, height: 70, label: 'Conference Table', color: '#312e81' },
  { id: 'jv_wall_display', type: 'WALL_DISPLAY', x: 730, y: 48, width: 140, height: 40, label: 'Executive Telemetry 85"' },
  { id: 'jv_couch_left', type: 'COUCH', x: 565, y: 180, width: 85, height: 38, color: '#1e1b4b' },
  { id: 'jv_couch_right', type: 'COUCH', x: 950, y: 180, width: 85, height: 38, color: '#1e1b4b' },
  { id: 'jv_plant_1', type: 'PLANT', x: 555, y: 55, width: 26, height: 30, extra: { species: 'Monstera' } },
  { id: 'jv_plant_2', type: 'PLANT', x: 1025, y: 55, width: 26, height: 30, extra: { species: 'Ficus' } },

  // ── 2. 📚 KNOWLEDGE ARCHIVE & LIBRARY ──
  { id: 'lib_bookshelf_1', type: 'BOOKSHELF', x: 55, y: 48, width: 110, height: 50, label: 'AI & Neural Systems' },
  { id: 'lib_bookshelf_2', type: 'BOOKSHELF', x: 175, y: 48, width: 110, height: 50, label: 'Distributed Systems' },
  { id: 'lib_bookshelf_3', type: 'BOOKSHELF', x: 295, y: 48, width: 110, height: 50, label: 'Philosophy & Math' },
  { id: 'lib_study_table', type: 'STUDY_TABLE', x: 170, y: 235, width: 160, height: 46, label: 'Reading Table' },
  { id: 'lib_book_1', type: 'OPEN_BOOK', x: 205, y: 245, width: 22, height: 16, color: '#fef08a' },
  { id: 'lib_book_2', type: 'OPEN_BOOK', x: 275, y: 245, width: 22, height: 16, color: '#67e8f9' },
  { id: 'lib_desk', type: 'DESK', x: 230, y: 155, width: 85, height: 40, extra: { monitors: 2 } },
  { id: 'lib_filing', type: 'FILING_CABINET', x: 420, y: 55, width: 28, height: 38 },
  { id: 'lib_plant', type: 'PLANT', x: 420, y: 250, width: 24, height: 28 },

  // ── 3. 🔬 AI RESEARCH & NEURAL LAB ──
  { id: 'lab_whiteboard', type: 'WHITEBOARD', x: 1120, y: 48, width: 150, height: 50, label: 'Loss = -Σ y log(p)' },
  { id: 'lab_server_1', type: 'SERVER_RACK', x: 1290, y: 48, width: 46, height: 54, extra: { leds: 'CYAN' } },
  { id: 'lab_server_2', type: 'SERVER_RACK', x: 1350, y: 48, width: 46, height: 54, extra: { leds: 'CYAN' } },
  { id: 'lab_bench', type: 'LAB_BENCH', x: 1190, y: 235, width: 190, height: 44, label: 'Quantum Compute Bench' },
  { id: 'lab_desk', type: 'DESK', x: 1290, y: 155, width: 85, height: 40, extra: { monitors: 2 } },
  { id: 'lab_plant', type: 'PLANT', x: 1445, y: 55, width: 24, height: 28 },

  // ── 4. 🎨 UX & MEDIA DESIGN STUDIO ──
  { id: 'stu_desk', type: 'DESK', x: 220, y: 515, width: 105, height: 42, extra: { monitors: 2, tablet: true } },
  { id: 'stu_easel', type: 'ART_EASEL', x: 365, y: 440, width: 48, height: 58 },
  { id: 'stu_couch', type: 'COUCH', x: 65, y: 640, width: 95, height: 40, color: '#831843' },
  { id: 'stu_wall_display', type: 'WALL_DISPLAY', x: 160, y: 410, width: 130, height: 36, label: 'UI/UX Design Mockups' },
  { id: 'stu_plant', type: 'PLANT', x: 420, y: 415, width: 24, height: 28 },

  // ── 5. 🛡️ CYBER DEFENSE & THREAT WAR ROOM ──
  { id: 'sec_desk_jonson', type: 'DESK', x: 1190, y: 515, width: 105, height: 42, extra: { monitors: 3 } },
  { id: 'sec_desk_knox', type: 'DESK', x: 1370, y: 515, width: 105, height: 42, extra: { monitors: 3 } },
  { id: 'sec_radar', type: 'CYBER_RADAR', x: 1255, y: 415, width: 150, height: 52, label: 'Global & Bangladesh Cyber Threat Radar' },
  { id: 'sec_server_1', type: 'SERVER_RACK', x: 1115, y: 415, width: 46, height: 54, extra: { leds: 'RED' } },
  { id: 'sec_server_2', type: 'SERVER_RACK', x: 1115, y: 485, width: 46, height: 54, extra: { leds: 'RED' } },
  { id: 'sec_plant', type: 'PLANT', x: 1445, y: 415, width: 24, height: 28 },

  // ── 6. ⚡ SOFTWARE & BIG DATA ENGINEERING BAY ──
  { id: 'ops_desk_bob', type: 'DESK', x: 140, y: 915, width: 105, height: 42, extra: { monitors: 3, codeGlowing: true } },
  { id: 'ops_desk_mob', type: 'DESK', x: 300, y: 915, width: 105, height: 42, extra: { monitors: 3, codeGlowing: true } },
  { id: 'ops_server_cluster_1', type: 'SERVER_RACK', x: 55, y: 815, width: 46, height: 54, extra: { leds: 'AMBER' } },
  { id: 'ops_server_cluster_2', type: 'SERVER_RACK', x: 115, y: 815, width: 46, height: 54, extra: { leds: 'AMBER' } },
  { id: 'ops_server_cluster_3', type: 'SERVER_RACK', x: 175, y: 815, width: 46, height: 54, extra: { leds: 'AMBER' } },
  { id: 'ops_whiteboard', type: 'WHITEBOARD', x: 260, y: 815, width: 130, height: 46, label: 'CI/CD Pipeline: Prod OK' },
  { id: 'ops_plant', type: 'PLANT', x: 420, y: 815, width: 24, height: 28 },

  // ── 7. 🎖️ MISSION STRATEGY & OPERATIONS HQ ──
  { id: 'cmd_desk', type: 'DESK', x: 1280, y: 925, width: 105, height: 42, extra: { monitors: 3 } },
  { id: 'cmd_strategy_table', type: 'STRATEGY_TABLE', x: 1190, y: 820, width: 170, height: 60, label: 'Tactical Mission Map' },
  { id: 'cmd_couch', type: 'COUCH', x: 1400, y: 890, width: 65, height: 44, color: '#064e3b' },
  { id: 'cmd_plant', type: 'PLANT', x: 1120, y: 815, width: 24, height: 28 },

  // ── 8. ☕ CENTRAL TECH PANTRY & CAFETERIA LOUNGE ──
  { id: 'plz_coffee_bar', type: 'COFFEE_BAR', x: 575, y: 435, width: 140, height: 50, label: 'Artisan Espresso Bar' },
  { id: 'plz_water_cooler', type: 'WATER_COOLER', x: 745, y: 435, width: 28, height: 40 },
  { id: 'plz_vending_machine', type: 'VENDING_MACHINE', x: 800, y: 435, width: 50, height: 50, label: 'Tech Snacks' },
  { id: 'plz_ping_pong', type: 'PING_PONG_TABLE', x: 885, y: 435, width: 120, height: 60, label: 'Table Tennis' },
  { id: 'plz_fountain', type: 'FOUNTAIN', x: 755, y: 710, width: 90, height: 90 },
  { id: 'plz_sectional_couch', type: 'SECTIONAL_COUCH', x: 580, y: 940, width: 160, height: 90, label: 'Lounge Sofas' },
  { id: 'plz_couch_2', type: 'COUCH', x: 880, y: 960, width: 110, height: 44, color: '#0369a1' },
  { id: 'plz_plant_1', type: 'PLANT', x: 555, y: 415, width: 26, height: 30 },
  { id: 'plz_plant_2', type: 'PLANT', x: 1025, y: 415, width: 26, height: 30 },
  { id: 'plz_plant_3', type: 'PLANT', x: 555, y: 1120, width: 26, height: 30 },
  { id: 'plz_plant_4', type: 'PLANT', x: 1025, y: 1120, width: 26, height: 30 }
];
