import React from 'react';
import { JarvisState, TelemetryData, StateVisualConfig } from '../../types/jarvis';

interface HeaderStatusProps {
  state: JarvisState;
  config: StateVisualConfig;
  telemetry: TelemetryData;
}

export const HeaderStatus: React.FC<HeaderStatusProps> = ({
  state,
  config,
  telemetry
}) => {
  return (
    <header className="jarvis-header-hud">
      <div className="header-left">
        <div className="system-logo">
          <span className="logo-glitch" data-text="JARVIS">JARVIS</span>
          <span className="logo-sub">MARK VII // OS</span>
        </div>
        <div className="header-status-pill" style={{ borderColor: config.primaryColor }}>
          <span 
            className="status-pulse-dot" 
            style={{ backgroundColor: config.primaryColor, boxShadow: `0 0 10px ${config.primaryColor}` }} 
          />
          <span className="status-label" style={{ color: config.primaryColor }}>
            {state}
          </span>
        </div>
      </div>

      <div className="header-center">
        <div className="hud-frequency-meter">
          <span className="meter-label">CORE FREQ</span>
          <span className="meter-val">142.85 GHz</span>
        </div>
        <div className="hud-header-bar-graph">
          <div className="bar-cell active" style={{ backgroundColor: config.primaryColor }} />
          <div className="bar-cell active" style={{ backgroundColor: config.primaryColor }} />
          <div className="bar-cell active" style={{ backgroundColor: config.primaryColor }} />
          <div className="bar-cell active" style={{ backgroundColor: config.primaryColor }} />
          <div className="bar-cell active" style={{ backgroundColor: config.primaryColor }} />
          <div className="bar-cell" />
          <div className="bar-cell" />
        </div>
      </div>

      <div className="header-right">
        <div className="telemetry-compact">
          <span className="telemetry-key">UPTIME</span>
          <span className="telemetry-value font-mono">{telemetry.systemUptime}</span>
        </div>
        <div className="telemetry-compact">
          <span className="telemetry-key">LATENCY</span>
          <span className="telemetry-value font-mono">{telemetry.networkLatency} ms</span>
        </div>
        <div className="telemetry-compact">
          <span className="telemetry-key">CORE TEMP</span>
          <span className="telemetry-value font-mono">{telemetry.systemMetrics.cpuUsage !== null ? `${Math.round(38 + (telemetry.systemMetrics.cpuUsage || 0) * 0.25)}°C` : '42°C'}</span>
        </div>
      </div>
    </header>
  );
};
