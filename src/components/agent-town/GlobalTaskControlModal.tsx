import React from 'react';
import { AlertTriangle, X, Octagon } from 'lucide-react';

interface GlobalTaskControlModalProps {
  isOpen: boolean;
  onConfirmCancelAll: () => void;
  onClose: () => void;
  primaryColor?: string;
}

export const GlobalTaskControlModal: React.FC<GlobalTaskControlModalProps> = ({
  isOpen,
  onConfirmCancelAll,
  onClose,
  primaryColor = '#ff4060'
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 18, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(180deg, rgba(20, 6, 18, 0.98) 0%, rgba(10, 4, 14, 0.98) 100%)',
          border: '1px solid rgba(255, 64, 96, 0.6)',
          borderRadius: '12px',
          boxShadow: '0 0 35px rgba(255, 64, 96, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'v3FadeIn 0.18s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 64, 96, 0.2)',
            background: 'rgba(255, 64, 96, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Octagon size={16} color="#ff4060" />
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.08em'
              }}
            >
              CONFIRM GLOBAL TASK ABORT
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={20} color="#ff4060" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.88rem', color: '#ffffff', lineHeight: 1.4 }}>
              Are you sure you want to cancel all active Agent Town tasks and multi-agent projects? All in-flight AI reasoning channels will be aborted and Alice, Bob, Carol, and Dave will reset to <strong>READY</strong>.
            </div>
          </div>

          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.66rem',
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            NOTE: Main JARVIS Dashboard, Chat, Radar, and Voice systems will remain untouched.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#ffffff',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.80rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              KEEP RUNNING
            </button>

            <button
              onClick={() => {
                onConfirmCancelAll();
                onClose();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                background: 'linear-gradient(135deg, #ff4060 0%, #d91c44 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(255, 64, 96, 0.4)'
              }}
            >
              <Octagon size={12} />
              <span>CANCEL ALL TASKS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
