// JARVIS v2.0 — TypeScript Type Definitions
// Complete V2 type system with streaming, RAG, profile, and new UI types

export type JarvisState = 
  | 'IDLE' 
  | 'LISTENING' 
  | 'THINKING' 
  | 'SPEAKING' 
  | 'EXECUTING' 
  | 'ALERT' 
  | 'ERROR';

export type BackendStatus = 'ONLINE' | 'CONNECTING' | 'OFFLINE';

// V2: 10 suit themes (5 original + 5 new)
export type SuitTheme = 
  | 'MARK_II'         // Classic Silver-Blue
  | 'MARK_IV'         // Classic Cyan-Blue (default)
  | 'MARK_VII'        // War Machine Dark
  | 'MARK_XLII'       // Gold-Bronze
  | 'MARK_LXXXV'      // Stealth Dark
  | 'MARK_V'          // Gold-Red (Suitcase armor)
  | 'NEBULA'          // Purple-Cyan
  | 'GHOST'           // Silver-White
  | 'CRIMSON'         // Red-Black
  | 'AURORA';         // Green-Blue

export interface SuitThemeConfig {
  id: SuitTheme;
  name: string;
  codename: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  bgGradient?: string;
  gridColor?: string;
}

export type NavSection = 
  | 'COMMAND_CENTER' 
  | 'AI_CORE' 
  | 'AGENTS' 
  | 'TASKS' 
  | 'CALENDAR' 
  | 'MEMORY' 
  | 'CONVERSATIONS' 
  | 'TOOLS'
  | 'SMART_HOME'
  | 'KNOWLEDGE_BASE'  // V2 new
  | 'NOTES'           // V2 new
  | 'PLUGINS';        // V2 new

export interface SmartSceneRecord {
  name: string;
  description: string;
  icon?: string;
  actions: Array<Record<string, any>>;
}

export interface VoiceEngineRecord {
  id: string;
  name: string;
  available: boolean;
  type?: string;
  default?: boolean;
}

export interface StateVisualConfig {
  name: string;
  displayStatus: string;
  subStatus: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  corePulseSpeed: number;
  coreScale: number;
  rotationSpeedMultiplier: number;
  particleSpeedMultiplier: number;
  particleActivity: number;
  audioReactIntensity: number;
  ringGlowIntensity: number;
  waveformVisible: boolean;
  statusBadgeColor: string;
  isWarning: boolean;
}

export interface IntelligenceEvent {
  id: string;
  timestamp: string;
  category: 'SYSTEM' | 'VOICE' | 'AI' | 'AGENT' | 'TOOL' | 'MEMORY' | 'KNOWLEDGE';
  description: string;
  level?: 'info' | 'success' | 'warning' | 'error';
}

export interface RealSystemMetrics {
  // CPU
  cpuUsage: number | null;
  cpuBrand: string | null;
  cpuFreqMhz: number | null;       // V2
  physicalCores: number | null;
  logicalCores: number | null;
  
  // RAM
  ramTotalGb: number | null;
  ramUsedGb: number | null;
  ramPercent: number | null;
  
  // Disk
  diskTotalGb: number | null;
  diskUsedGb: number | null;
  diskPercent: number | null;
  diskReadBytes: number | null;     // V2
  diskWriteBytes: number | null;   // V2
  
  // Battery
  batteryPercent: number | null;
  batteryPlugged: boolean | null;
  batteryMinsLeft: number | null;  // V2
  
  // Network V2
  networkBytesSent: number | null;
  networkBytesRecv: number | null;
  networkConnections: number | null;
  
  // OS/System
  activeThreads: number | null;
  osName: string | null;
  computerName: string | null;
  
  // V2: Top processes
  topProcesses: Array<{
    pid: number;
    name: string;
    cpu_pct: number;
    mem_pct: number;
  }>;
}

export interface TelemetryData {
  fps: number;
  systemUptime: string;
  networkLatency: number | null;
  audioFrequencyData: number[];
  backendStatus: BackendStatus;
  isConfigured: boolean;
  memoryCount: number;
  totalTools: number;
  activeModel: string;
  systemMetrics: RealSystemMetrics;
}

// V2: Streaming chat message
export interface StreamingState {
  isStreaming: boolean;
  partialText: string;
  streamingMessageId: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'JARVIS';
  text: string;
  timestamp: string;
  isError?: boolean;
  isStreaming?: boolean;           // V2
  intent?: string;
  model_used?: string;
  mode_used?: string;
  route_reason?: string;
  reaction?: 'up' | 'down' | null; // V2 feedback
  sources?: Array<{
    title: string;
    url: string;
    snippet?: string;
  }>;
  steps?: Array<{
    step_index?: number;
    title: string;
    tool?: string;
    arguments?: Record<string, any>;
    status: string;
    message?: string;
    error?: string;
    verified?: boolean;
    duration_ms?: number;
  }>;
}

export interface AgentCardInfo {
  id: string;
  name: string;
  description: string;
  status: 'READY' | 'ACTIVE' | 'OFFLINE';
}

export interface HudVisibilityState {
  leftSidebar: boolean;
  rightLiveFeed: boolean;
  systemMonitor: boolean;
  coreSubsystems: boolean;
  memoryInsights: boolean;
  aiProvider: boolean;
  quickActions: boolean;
  centerStatusCard: boolean;
  centerTopBanner: boolean;
  centerIndicators: boolean;
  topbarQuickActions: boolean;
  commandBar: boolean;
  networkMonitor: boolean;       // V2
  batteryCard: boolean;          // V2
  processCard: boolean;          // V2
}

// V2: Toast notification system
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'agent';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;  // ms, default 4000
  timestamp: number;
  expandable?: boolean;
  details?: string;
}

// V2: Knowledge base document
export interface KnowledgeDocument {
  doc_id: string;
  filename: string;
  chunk_count: number;
  indexed_at: string;
}

export interface KnowledgeQueryResult {
  doc_id: string;
  filename: string;
  chunk: string;
  relevance_score: number;
  source: string;
  search_type: 'semantic' | 'keyword';
}

// V2: User profile
export interface UserProfile {
  name: string;
  display_name: string;
  language: string;
  timezone: string;
  location: string;
  theme: string;
  communication_style: 'formal' | 'casual' | 'professional';
  response_length: 'brief' | 'auto' | 'detailed';
  stock_tickers: string[];
  github_username: string;
  interests: string[];
  custom_wake_phrase: string;
  created_at: string;
  updated_at: string;
}

// V2: JARVIS Note
export interface JarvisNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  pinned: boolean;
  color: string;
}

// V2: Plugin
export interface JarvisPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  category: string;
  tools_count: number;
}
