import React, { useState, useEffect } from 'react';
import { JarvisState, TelemetryData, StateVisualConfig } from '../../types/jarvis';

interface TelemetryWidgetsProps {
  state: JarvisState;
  config: StateVisualConfig;
  telemetry: TelemetryData;
}

const LOG_MESSAGES = [
  'QUANTUM FLUX HARMONIC: 142.85 GHz',
  'NEURAL SYNAPSE INTERFACE: CONNECTED',
  'ARC REACTOR OUTPUT: NOMINAL 99.8%',
  'SEC_PROTOCOL: LEVEL 4 ENCRYPTION',
  'SUBROUTINE PIPELINE: READY',
  'ATMOSPHERIC PRESSURE: 101.3 kPa',
  'THERMAL INTEGRITY: VERIFIED',
  'HEURISTIC ENGINE: ACTIVE',
  'SPECTRAL ARRAY: CALIBRATED',
  'BUFFER FLUSH: COMPLETE (0ms)'
];

export const TelemetryWidgets: React.FC<TelemetryWidgetsProps> = ({
  state,
  config,
  telemetry
}) => {
  const [logs, setLogs] = useState<string[]>([
    'SYSTEM INITIALIZED // ALL CHANNELS ACTIVE',
    'AI CORE ONLINE // STANDBY PROTOCOL'
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomMsg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs((prev) => [...prev.slice(-4), `[${timestamp}] ${randomMsg}`]);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  // When state changes, add specific log
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    let stateMsg = `STATE CHANGED >> ${state}`;
    if (state === 'LISTENING') stateMsg = 'AUDIO RECEPTORS CAPTURING FREQUENCY';
    if (state === 'THINKING') stateMsg = 'NEURAL ENGINE ENGAGING MULTI-THREAD MATRIX';
    if (state === 'SPEAKING') stateMsg = 'VOCAL SYNTHESIS BROADCASTING ON ALL FREQUENCIES';
    if (state === 'EXECUTING') stateMsg = 'EXECUTING TASK PIPELINE // PROTOCOL OMEGA';
    if (state === 'ERROR') stateMsg = 'WARNING: SECURITY ALERT TRIGGERED';

    setLogs((prev) => [...prev.slice(-4), `[${timestamp}] ${stateMsg}`]);
  }, [state]);

  return (
    <>
      {/* Top Left: Arc Reactor Power Gauge & Diagnostics */}
      <aside className="telemetry-panel panel-top-left">
        <div className="panel-header">
          <span className="panel-title">ARC POWER CORE</span>
          <span className="panel-tag" style={{ color: config.primaryColor }}>PWR-99</span>
        </div>

        <div className="reactor-gauge-wrapper">
          <div className="reactor-circle">
            <svg viewBox="0 0 100 100" className="gauge-svg">
              <circle cx="50" cy="50" r="40" className="gauge-track" />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="gauge-value"
                style={{
                  stroke: config.primaryColor,
                  strokeDasharray: '251.2',
                  strokeDashoffset: `${251.2 * (1 - (telemetry.systemMetrics.cpuUsage ?? 45) / 100)}`
                }}
              />
            </svg>
            <div className="gauge-center-text">
              <span className="gauge-num" style={{ color: config.primaryColor }}>
                {(telemetry.systemMetrics.cpuUsage ?? 45).toFixed(0)}%
              </span>
              <span className="gauge-unit">CPU LOAD</span>
            </div>
          </div>

          <div className="subsystem-list">
            <div className="subsystem-item">
              <span className="subsystem-name">RAM UTIL</span>
              <span className="subsystem-val" style={{ color: config.primaryColor }}>{telemetry.systemMetrics.ramPercent ?? 50}%</span>
            </div>
            <div className="subsystem-item">
              <span className="subsystem-name">THREADS</span>
              <span className="subsystem-val" style={{ color: config.primaryColor }}>{telemetry.systemMetrics.activeThreads ?? 128} ACTIVE</span>
            </div>
            <div className="subsystem-item">
              <span className="subsystem-name">SECURITY</span>
              <span className="subsystem-val" style={{ color: state === 'ERROR' ? '#ef4444' : '#10b981' }}>
                {state === 'ERROR' ? 'BREACH' : 'ALPHA'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Right: Compact Subtle Status Card (JARVIS ONLINE / SYSTEM STANDBY) */}
      <aside className="telemetry-panel panel-top-right-status">
        <div className="panel-header">
          <span className="panel-title">SYSTEM STATUS</span>
          <span 
            className="compact-status-dot" 
            style={{ 
              backgroundColor: config.primaryColor, 
              boxShadow: `0 0 8px ${config.primaryColor}` 
            }} 
          />
        </div>

        <div className="compact-status-body">
          <div className="status-pair">
            <span className="status-main-label">JARVIS</span>
            <span 
              className="status-main-state font-display" 
              style={{ 
                color: config.primaryColor,
                textShadow: `0 0 10px ${config.primaryColor}`
              }} 
            >
              {state === 'IDLE' ? 'ONLINE' : state}
            </span>
          </div>

          <div className="status-divider-mini" style={{ borderColor: 'rgba(0, 240, 255, 0.2)' }} />

          <div className="status-pair">
            <span className="status-sub-label">SYSTEM</span>
            <span className="status-sub-val font-mono" style={{ color: config.primaryColor }}>
              {state === 'IDLE' ? 'STANDBY' : config.name}
            </span>
          </div>
        </div>

        <div className="compact-metrics-row font-mono">
          <span>RAM: {telemetry.systemMetrics.ramPercent ?? 45}%</span>
          <span>LAT: {telemetry.networkLatency ?? 12}ms</span>
        </div>
      </aside>

      {/* Bottom Left: Live Subroutine Telemetry Stream */}
      <aside className="telemetry-panel panel-bottom-left">
        <div className="panel-header">
          <span className="panel-title">SUBROUTINE TELEMETRY</span>
          <span className="panel-blinker" style={{ backgroundColor: config.primaryColor }} />
        </div>

        <div className="log-stream-container font-mono">
          {logs.map((log, index) => (
            <div key={index} className="log-line" style={{ color: index === logs.length - 1 ? config.primaryColor : 'rgba(255, 255, 255, 0.55)' }}>
              <span className="log-prompt">&gt;</span> {log}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
