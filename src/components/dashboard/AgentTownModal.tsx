import React, { useEffect } from 'react';
import { AgentTownView } from '../agent-town/AgentTownView';

interface AgentTownModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export const AgentTownModal: React.FC<AgentTownModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#a855f7'
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'rgba(2, 6, 18, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '1280px',
          maxWidth: '97vw',
          height: '860px',
          maxHeight: '94vh',
          background: 'linear-gradient(145deg, rgba(3, 10, 26, 0.98) 0%, rgba(8, 16, 38, 0.98) 100%)',
          border: `1px solid ${primaryColor}55`,
          borderRadius: '14px',
          boxShadow: `0 0 60px ${primaryColor}25, 0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Decorative Sci-Fi Corner Brackets */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderTop: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}`, pointerEvents: 'none', zIndex: 30 }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}`, pointerEvents: 'none', zIndex: 30 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderBottom: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}`, pointerEvents: 'none', zIndex: 30 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderBottom: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}`, pointerEvents: 'none', zIndex: 30 }} />

        {/* Full Interactive Agent Town Workspace */}
        <AgentTownView onClose={onClose} primaryColor={primaryColor} />
      </div>
    </div>
  );
};
