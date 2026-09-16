import React from 'react';
import { JarvisState, TelemetryData, StateVisualConfig } from '../../types/jarvis';
import { HeaderStatus } from './HeaderStatus';
import { CenterStatus } from './CenterStatus';
import { TelemetryWidgets } from './TelemetryWidgets';
import { ChatPanel } from './ChatPanel';
import { DebugControls } from './DebugControls';

interface HudOverlayProps {
  state: JarvisState;
  config: StateVisualConfig;
  telemetry: TelemetryData;
  onStateChange: (state: JarvisState) => void;
  onLiveAudioFrequencies?: (frequencies: number[]) => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  state,
  config,
  telemetry,
  onStateChange,
  onLiveAudioFrequencies
}) => {
  return (
    <div className={`jarvis-hud-overlay state-${state.toLowerCase()}`}>
      {/* Cinematic Vignette & Scanline layers */}
      <div className="hud-vignette" />
      <div className="hud-scanlines" />
      <div 
        className="hud-ambient-glow" 
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${config.glowColor} 0%, transparent 65%)` 
        }} 
      />

      {/* Sci-Fi Holographic Crosshairs & Reticle Overlay */}
      <div className="hud-reticle-center">
        <div className="reticle-ring ring-outer" style={{ borderColor: config.primaryColor }} />
        <div className="reticle-ring ring-inner" style={{ borderColor: config.primaryColor }} />
        <div className="reticle-crosshair cross-h" style={{ backgroundColor: config.primaryColor }} />
        <div className="reticle-crosshair cross-v" style={{ backgroundColor: config.primaryColor }} />
      </div>

      {/* Screen Corner Framing Brackets */}
      <div className="hud-screen-corner corner-top-left" style={{ borderColor: config.primaryColor }} />
      <div className="hud-screen-corner corner-top-right" style={{ borderColor: config.primaryColor }} />
      <div className="hud-screen-corner corner-bottom-left" style={{ borderColor: config.primaryColor }} />
      <div className="hud-screen-corner corner-bottom-right" style={{ borderColor: config.primaryColor }} />

      {/* Top Header Banner */}
      <HeaderStatus state={state} config={config} telemetry={telemetry} />

      {/* Corner Telemetry Information (including Right Status Card) */}
      <TelemetryWidgets state={state} config={config} telemetry={telemetry} />

      {/* Minimal Bottom Audio Spectrum (Unobstructed central core) */}
      <CenterStatus state={state} config={config} audioFrequencies={telemetry.audioFrequencyData} />

      {/* Right Column: Interactive Command Terminal & Debug State Dock */}
      <div className="hud-right-column">
        <ChatPanel 
          state={state} 
          config={config} 
          backendStatus={telemetry.backendStatus}
          isConfigured={telemetry.isConfigured}
          onStateChange={onStateChange}
          onLiveAudioFrequencies={onLiveAudioFrequencies}
        />
        <DebugControls currentState={state} onStateChange={onStateChange} />
      </div>
    </div>
  );
};
