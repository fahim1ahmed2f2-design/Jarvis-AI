import React from 'react';
import { Mic } from 'lucide-react';

interface MicrophoneButtonProps {
  isListening: boolean;
  isActive: boolean;
  primaryColor: string;
  onClick: () => void;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  isActive,
  primaryColor,
  onClick
}) => {
  return (
    <button
      type="button"
      className={`hud-mic-btn ${isListening ? 'is-listening' : ''} ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      title={isListening ? 'Listening active (Click or ESC to cancel)' : 'Click to speak or press Ctrl+Space'}
      style={{
        borderColor: isListening ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)',
        color: isListening ? '#00f0ff' : '#ffffff'
      }}
    >
      {isListening && (
        <span 
          className="mic-pulse-halo" 
          style={{ borderColor: primaryColor, boxShadow: `0 0 12px ${primaryColor}` }} 
        />
      )}
      <Mic size={14} className={`mic-icon ${isListening ? 'animate-pulse' : ''}`} />
      <span className="mic-hotkey-tag font-mono">VOX</span>
    </button>
  );
};
