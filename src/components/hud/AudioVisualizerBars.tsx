import React from 'react';
import { JarvisState } from '../../types/jarvis';

interface AudioVisualizerBarsProps {
  frequencies: number[];
  state: JarvisState;
  color: string;
}

export const AudioVisualizerBars: React.FC<AudioVisualizerBarsProps> = ({
  frequencies,
  state,
  color
}) => {
  return (
    <div className={`audio-visualizer-container state-${state.toLowerCase()}`}>
      <div className="visualizer-bars">
        {frequencies.map((val, idx) => {
          // Calculate symmetrical frequency heights from center outward
          const heightPct = Math.max(8, Math.round(val * 100));
          return (
            <div
              key={idx}
              className="viz-bar"
              style={{
                height: `${heightPct}%`,
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}`
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
