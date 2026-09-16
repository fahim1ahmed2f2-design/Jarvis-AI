import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { JarvisState, TelemetryData, StateVisualConfig, IntelligenceEvent, RealSystemMetrics } from '../types/jarvis';
import { STATE_CONFIGS } from '../animations/animationConfig';
import { checkBackendHealth, fetchMemories, fetchSystemMetrics, fetchAvailableTools } from '../services/api';
import { jarvisSpeechService } from '../services/speechService';
import { realtimeAudioAnalyzer } from '../services/audioAnalyzer';

type StateListener = (state: JarvisState) => void;
const listeners = new Set<StateListener>();

type EventListener = (event: IntelligenceEvent) => void;
const eventListeners = new Set<EventListener>();

export interface SubtitleWordData {
  sentence: string;
  words: string[];
  activeWordIndex: number;
}

type SubtitleListener = (sub: SubtitleWordData | null) => void;
const subtitleListeners = new Set<SubtitleListener>();
let globalCurrentSubtitle: SubtitleWordData | null = null;

export function emitSubtitleGlobal(sub: SubtitleWordData | null) {
  globalCurrentSubtitle = sub;
  subtitleListeners.forEach((fn) => {
    try { fn(sub); } catch {}
  });
}

export function subscribeSubtitleGlobal(fn: SubtitleListener): () => void {
  subtitleListeners.add(fn);
  fn(globalCurrentSubtitle);
  return () => {
    subtitleListeners.delete(fn);
  };
}

let globalCurrentState: JarvisState = 'IDLE';

// Real-time events start empty and only populate as REAL events happen in the app
let globalEvents: IntelligenceEvent[] = [
  {
    id: `evt-${Date.now()}-init`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    category: 'SYSTEM',
    description: 'JARVIS Interface initialized // Standing by for user commands',
    level: 'info'
  }
];

export function logIntelligenceEvent(
  category: IntelligenceEvent['category'],
  description: string,
  level: IntelligenceEvent['level'] = 'info'
) {
  const newEvent: IntelligenceEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    category,
    description,
    level
  };

  globalEvents = [newEvent, ...globalEvents.slice(0, 49)];
  eventListeners.forEach((listener) => listener(newEvent));
}

export function setJarvisStateGlobal(newState: JarvisState) {
  if (globalCurrentState !== newState) {
    globalCurrentState = newState;
    listeners.forEach((listener) => listener(newState));

    // Emit live intelligence event on state transition
    if (newState === 'LISTENING') {
      logIntelligenceEvent('VOICE', 'Microphone active // Capturing voice stream', 'info');
    } else if (newState === 'THINKING') {
      logIntelligenceEvent('AI', 'Processing query with AI brain', 'info');
    } else if (newState === 'EXECUTING') {
      logIntelligenceEvent('AGENT', 'Executing requested tool action on PC', 'warning');
    } else if (newState === 'SPEAKING') {
      logIntelligenceEvent('VOICE', 'Vocal synthesis audio active', 'info');
    } else if (newState === 'ERROR') {
      logIntelligenceEvent('SYSTEM', 'Error encountered during operation', 'error');
    }
  }
}

export function getJarvisStateGlobal(): JarvisState {
  return globalCurrentState;
}

const INITIAL_METRICS: RealSystemMetrics = {
  cpuUsage: null,
  cpuBrand: null,
  cpuFreqMhz: null,
  physicalCores: null,
  logicalCores: null,
  ramTotalGb: null,
  ramUsedGb: null,
  ramPercent: null,
  diskTotalGb: null,
  diskUsedGb: null,
  diskPercent: null,
  diskReadBytes: null,
  diskWriteBytes: null,
  batteryPercent: null,
  batteryPlugged: null,
  batteryMinsLeft: null,
  networkBytesSent: null,
  networkBytesRecv: null,
  networkConnections: null,
  activeThreads: null,
  osName: null,
  computerName: null,
  topProcesses: []
};

export function useJarvisState() {
  const [currentState, setCurrentState] = useState<JarvisState>(globalCurrentState);
  const [events, setEvents] = useState<IntelligenceEvent[]>(globalEvents);
  const liveAudioDataRef = useRef<number[] | null>(null);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    fps: 60,
    systemUptime: '00:00:00',
    networkLatency: null,
    audioFrequencyData: new Array(32).fill(0),
    backendStatus: 'CONNECTING',
    isConfigured: false,
    memoryCount: 0,
    totalTools: 0,
    activeModel: 'gpt-4o',
    systemMetrics: INITIAL_METRICS
  });

  const setState = useCallback((newState: JarvisState) => {
    setJarvisStateGlobal(newState);
    setCurrentState(newState);
    if (newState !== 'LISTENING' && newState !== 'SPEAKING') {
      liveAudioDataRef.current = null;
    }
  }, []);

  const setLiveAudioFrequencies = useCallback((frequencies: number[]) => {
    liveAudioDataRef.current = frequencies;
  }, []);

  // Listen to global state changes
  useEffect(() => {
    const handleStateChange: StateListener = (state) => {
      setCurrentState(state);
    };
    listeners.add(handleStateChange);
    return () => {
      listeners.delete(handleStateChange);
    };
  }, []);

  // Listen to intelligence events
  useEffect(() => {
    const handleEvent: EventListener = (event) => {
      setEvents((prev) => [event, ...prev.slice(0, 49)]);
    };
    eventListeners.add(handleEvent);
    return () => {
      eventListeners.delete(handleEvent);
    };
  }, []);

  // Check Backend Health, Real System Metrics & Memory
  useEffect(() => {
    let isMounted = true;

    const pollRealBackendData = async () => {
      const pingStart = performance.now();
      try {
        const health = await checkBackendHealth();
        const latencyMs = Math.round(performance.now() - pingStart);

        if (!isMounted) return;

        if (health && (health.status === 'online' || health.status === 'healthy' || (health as any).health === 'healthy')) {
          // Fetch real system metrics
          let realMetrics: RealSystemMetrics = INITIAL_METRICS;
          try {
            const metricsRes = await fetchSystemMetrics();
            if (metricsRes && (metricsRes.status === 'online' || metricsRes.status === 'healthy' || (metricsRes as any).health === 'healthy')) {
              realMetrics = {
                cpuUsage: metricsRes.cpu?.usage_percent ?? null,
                cpuBrand: metricsRes.cpu?.brand ?? null,
                cpuFreqMhz: metricsRes.cpu?.frequency_mhz ?? null,
                physicalCores: metricsRes.cpu?.physical_cores ?? null,
                logicalCores: metricsRes.cpu?.logical_cores ?? null,
                ramTotalGb: metricsRes.ram?.total_gb ?? null,
                ramUsedGb: metricsRes.ram?.used_gb ?? null,
                ramPercent: metricsRes.ram?.percent ?? null,
                diskTotalGb: metricsRes.disk?.total_gb ?? null,
                diskUsedGb: metricsRes.disk?.used_gb ?? null,
                diskPercent: metricsRes.disk?.percent ?? null,
                diskReadBytes: metricsRes.disk?.read_bytes ?? null,
                diskWriteBytes: metricsRes.disk?.write_bytes ?? null,
                batteryPercent: metricsRes.battery?.percent ?? null,
                batteryPlugged: metricsRes.battery?.plugged ?? null,
                batteryMinsLeft: metricsRes.battery?.minutes_left ?? null,
                networkBytesSent: metricsRes.network?.bytes_sent ?? null,
                networkBytesRecv: metricsRes.network?.bytes_recv ?? null,
                networkConnections: metricsRes.network?.active_connections ?? null,
                activeThreads: metricsRes.threads ?? null,
                osName: metricsRes.os?.name ?? null,
                computerName: metricsRes.os?.computer_name ?? null,
                topProcesses: metricsRes.top_processes ?? []
              };
            }
          } catch {
            // non-fatal
          }

          // Fetch real memories count
          let realMemoryCount = 0;
          try {
            const mems = await fetchMemories();
            realMemoryCount = mems?.memories ? mems.memories.length : (mems?.total ?? 0);
          } catch {
            // non-fatal
          }

          // Fetch real tool count
          let realToolsCount = health.total_tools || 0;
          try {
            const toolsRes = await fetchAvailableTools();
            if (toolsRes && toolsRes.total_tools) {
              realToolsCount = toolsRes.total_tools;
            }
          } catch {
            // non-fatal
          }

          setTelemetry((prev) => ({
            ...prev,
            backendStatus: 'ONLINE',
            networkLatency: latencyMs,
            isConfigured: health.is_configured,
            totalTools: realToolsCount,
            activeModel: health.model || 'gpt-4o',
            memoryCount: realMemoryCount,
            systemMetrics: realMetrics
          }));
        } else {
          setTelemetry((prev) => ({
            ...prev,
            backendStatus: 'OFFLINE',
            networkLatency: null,
            systemMetrics: INITIAL_METRICS
          }));
        }
      } catch {
        if (isMounted) {
          setTelemetry((prev) => ({
            ...prev,
            backendStatus: 'OFFLINE',
            networkLatency: null,
            systemMetrics: INITIAL_METRICS
          }));
        }
      }
    };

    pollRealBackendData();
    const interval = setInterval(pollRealBackendData, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut listener: 1-7 and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case '1':
          if (currentState === 'LISTENING') jarvisSpeechService.stopListening();
          setState('IDLE');
          break;
        case '2':
          if (currentState === 'LISTENING') {
            jarvisSpeechService.stopListening();
            setState('IDLE');
          } else {
            jarvisSpeechService.triggerManualListening();
          }
          break;
        case 'Escape':
          if (currentState === 'LISTENING') jarvisSpeechService.stopListening();
          setState('IDLE');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setState, currentState]);

  // Real Uptime ticker & Live Audio Data
  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      const uptimeStr = `${hours}:${minutes}:${seconds}`;

      // Audio frequency data from live stream if listening or speaking, else fallback to analyzer
      let freqData: number[];
      if (liveAudioDataRef.current && liveAudioDataRef.current.length > 0) {
        freqData = liveAudioDataRef.current;
      } else if (realtimeAudioAnalyzer.isActive()) {
        freqData = realtimeAudioAnalyzer.getLatestFrequencies();
      } else {
        freqData = new Array(32).fill(0);
      }

      setTelemetry((prev) => ({
        ...prev,
        systemUptime: uptimeStr,
        audioFrequencyData: freqData
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const currentConfig: StateVisualConfig = useMemo(() => {
    return STATE_CONFIGS[currentState] || STATE_CONFIGS.IDLE;
  }, [currentState]);

  return {
    currentState,
    setState,
    setLiveAudioFrequencies,
    config: currentConfig,
    telemetry,
    events
  };
}
