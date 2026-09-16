import React, { useState, useEffect } from 'react';
import { JarvisState } from '../../types/jarvis';
import { jarvisSpeechService } from '../../services/speechService';

interface DebugControlsProps {
  currentState: JarvisState;
  onStateChange: (state: JarvisState) => void;
}

interface StateButton {
  keyNumber: string;
  state: JarvisState;
  label: string;
  desc: string;
}

const BUTTONS: StateButton[] = [
  { keyNumber: '1', state: 'IDLE', label: 'IDLE', desc: 'Calm pulse' },
  { keyNumber: '2', state: 'LISTENING', label: 'LISTEN', desc: 'Waveform pulse' },
  { keyNumber: '3', state: 'THINKING', label: 'THINK', desc: 'Neural vortex' },
  { keyNumber: '4', state: 'SPEAKING', label: 'SPEAK', desc: 'Audio reactive' },
  { keyNumber: '5', state: 'EXECUTING', label: 'EXECUTE', desc: 'Energy surge' },
  { keyNumber: '6', state: 'ERROR', label: 'ERROR', desc: 'Alarm flare' }
];

export const DebugControls: React.FC<DebugControlsProps> = ({
  currentState,
  onStateChange
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [micStatus, setMicStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const [listenerStatus, setListenerStatus] = useState<string>('STOPPED');
  const [sttStatus, setSttStatus] = useState<string>('READY');
  const [lastError, setLastError] = useState<string | null>(null);

  // Sync debug panel metrics
  useEffect(() => {
    const updateMetrics = () => {
      setMicStatus(jarvisSpeechService.getMicStatus());
      setListenerStatus(jarvisSpeechService.getListenerStatus());
      setSttStatus(jarvisSpeechService.getSttStatus());
      setLastError(jarvisSpeechService.getLastError());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 500);
    return () => clearInterval(interval);
  }, [currentState]);

  const handleButtonClick = (item: StateButton) => {
    if (item.state === 'LISTENING') {
      if (currentState === 'LISTENING') {
        // Toggle off
        jarvisSpeechService.stopListening();
        onStateChange('IDLE');
      } else {
        // Start manual listening
        jarvisSpeechService.triggerManualListening();
        onStateChange('LISTENING');
      }
    } else {
      if (currentState === 'LISTENING') {
        jarvisSpeechService.stopListening();
      }
      onStateChange(item.state);
    }
  };

  return (
    <div className={`debug-dock-container ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="dock-header">
        <span className="dock-title">MANUAL STATE OVERRIDE</span>
        <button
          className="dock-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand Control Dock' : 'Collapse Control Dock'}
        >
          {collapsed ? 'SHOW CONTROLS [ ▲ ]' : 'HIDE [ ▼ ]'}
        </button>
      </div>

      {!collapsed && (
        <div className="dock-body">
          {/* Section 12: Voice Telemetry Debug Panel */}
          <div className="voice-debug-status-panel font-mono" style={{
            fontSize: '9px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '3px',
            padding: '6px 8px',
            marginBottom: '8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3px 8px'
          }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>MIC: </span>
              <span style={{ color: micStatus === 'CONNECTED' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {micStatus}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>LISTENER: </span>
              <span style={{ color: currentState === 'LISTENING' ? '#00f0ff' : '#9ca3af', fontWeight: 'bold' }}>
                {currentState === 'LISTENING' ? 'LISTENING' : listenerStatus}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>STT: </span>
              <span style={{ color: sttStatus === 'ERROR' ? '#ef4444' : (currentState === 'LISTENING' ? '#00f0ff' : '#10b981'), fontWeight: 'bold' }}>
                {currentState === 'LISTENING' ? 'LISTENING' : sttStatus}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>STATE: </span>
              <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>
                {currentState}
              </span>
            </div>
            {lastError && (
              <div style={{ gridColumn: '1 / -1', color: '#ef4444', marginTop: '2px', borderTop: '1px solid rgba(239,68,68,0.2)', paddingTop: '2px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>LAST ERROR: </span>
                <span>{lastError}</span>
              </div>
            )}
          </div>

          <div className="dock-buttons-grid">
            {BUTTONS.map((item) => {
              const isActive = currentState === item.state;
              let displayLabel = item.label;
              if (item.state === 'LISTENING' && currentState === 'LISTENING') {
                displayLabel = 'STOP LISTEN';
              }
              return (
                <button
                  key={item.state}
                  className={`dock-state-btn ${isActive ? 'is-active' : ''} btn-${item.state.toLowerCase()}`}
                  onClick={() => handleButtonClick(item)}
                  title={item.state === 'LISTENING' && currentState === 'LISTENING' ? 'Stop listening and return to IDLE' : item.desc}
                >
                  <span className="btn-hotkey">{item.keyNumber}</span>
                  <span className="btn-label">{displayLabel}</span>
                  <span className="btn-indicator" />
                </button>
              );
            })}
          </div>

          <div className="dock-footer">
            <span className="dock-tip">SHORTCUTS: <strong className="font-mono">1 - 6</strong> | <strong className="font-mono">ESC</strong> TO RESET</span>
          </div>
        </div>
      )}
    </div>
  );
};
