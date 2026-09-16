import React from 'react';
import { JarvisState, StateVisualConfig } from '../../types/jarvis';
import { AudioVisualizerBars } from './AudioVisualizerBars';

interface CenterStatusProps {
  state: JarvisState;
  config: StateVisualConfig;
  audioFrequencies: number[];
}

export const CenterStatus: React.FC<CenterStatusProps> = ({
  state,
  config,
  audioFrequencies
}) => {
  return (
    <div className={`center-status-minimal state-${state.toLowerCase()}`}>
      {/* Subtle bottom audio spectrum and reticle indicator - unblocks central core */}
      <div className="minimal-spectrum-frame">
        <span className="spectrum-side-tag font-mono">SPECTRUM // {state}</span>
        <div className="visualizer-wrapper-minimal">
          <AudioVisualizerBars 
            frequencies={audioFrequencies} 
            state={state} 
            color={config.primaryColor} 
          />
        </div>
        <span className="spectrum-side-tag font-mono">142.8 GHz</span>
      </div>
    </div>
  );
};
