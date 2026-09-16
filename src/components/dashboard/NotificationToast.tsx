import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, Bot, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ToastNotification, ToastType } from '../../types/jarvis';

interface NotificationToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  primaryColor?: string;
}

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  agent: Bot
};

const TOAST_COLORS: Record<ToastType, { border: string; glow: string; icon: string; bg: string }> = {
  success: {
    border: 'rgba(16, 185, 129, 0.7)',
    glow: 'rgba(16, 185, 129, 0.25)',
    icon: '#10b981',
    bg: 'rgba(0, 20, 15, 0.92)'
  },
  error: {
    border: 'rgba(239, 68, 68, 0.7)',
    glow: 'rgba(239, 68, 68, 0.25)',
    icon: '#ef4444',
    bg: 'rgba(20, 5, 5, 0.92)'
  },
  warning: {
    border: 'rgba(245, 158, 11, 0.7)',
    glow: 'rgba(245, 158, 11, 0.25)',
    icon: '#f59e0b',
    bg: 'rgba(20, 15, 3, 0.92)'
  },
  info: {
    border: 'rgba(0, 229, 255, 0.5)',
    glow: 'rgba(0, 229, 255, 0.2)',
    icon: '#00e5ff',
    bg: 'rgba(3, 10, 24, 0.92)'
  },
  agent: {
    border: 'rgba(139, 92, 246, 0.7)',
    glow: 'rgba(139, 92, 246, 0.25)',
    icon: '#8b5cf6',
    bg: 'rgba(10, 5, 20, 0.92)'
  }
};

interface SingleToastProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const SingleToast: React.FC<SingleToastProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const duration = toast.duration ?? 4500;

  const colors = TOAST_COLORS[toast.type];
  const Icon = TOAST_ICONS[toast.type];

  // Slide in animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Progress countdown
  useEffect(() => {
    const step = 100 / (duration / 50);
    intervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          handleDismiss();
          return 0;
        }
        return prev - step;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'relative',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '12px 14px',
        paddingRight: '36px',
        marginBottom: '8px',
        boxShadow: `0 4px 24px ${colors.glow}, 0 0 0 1px rgba(255,255,255,0.04)`,
        backdropFilter: 'blur(16px)',
        minWidth: '280px',
        maxWidth: '380px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
        opacity: visible ? 1 : 0,
        overflow: 'hidden',
        cursor: toast.details ? 'pointer' : 'default'
      }}
      onClick={() => toast.details && setExpanded(e => !e)}
    >
      {/* Top content row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Icon */}
        <div style={{ flexShrink: 0, marginTop: '1px' }}>
          <Icon size={16} color={colors.icon} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: colors.icon,
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            {toast.title}
          </div>
          {toast.message && (
            <div style={{
              fontFamily: 'monospace',
              fontSize: '10.5px',
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: '1.45',
              wordBreak: 'break-word'
            }}>
              {toast.message}
            </div>
          )}

          {/* Expandable details */}
          {expanded && toast.details && (
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: `1px solid ${colors.border}`,
              fontFamily: 'monospace',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {toast.details}
            </div>
          )}

          {/* Expand toggle */}
          {toast.details && (
            <button
              style={{
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontFamily: 'monospace',
                fontSize: '9px',
                color: colors.icon,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 0',
                opacity: 0.8
              }}
              onClick={e => { e.stopPropagation(); setExpanded(ex => !ex); }}
            >
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {expanded ? 'HIDE DETAILS' : 'SHOW DETAILS'}
            </button>
          )}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={e => { e.stopPropagation(); handleDismiss(); }}
        aria-label="Dismiss notification"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '4px',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)',
          transition: 'all 0.15s'
        }}
      >
        <X size={10} />
      </button>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '2px',
        width: `${progress}%`,
        background: colors.icon,
        boxShadow: `0 0 6px ${colors.icon}`,
        transition: 'width 0.05s linear',
        borderRadius: '0 0 0 8px'
      }} />
    </div>
  );
};

export const NotificationToastContainer: React.FC<NotificationToastProps> = ({
  toasts,
  onDismiss
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        top: '60px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}
    >
      {toasts.slice(0, 5).map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'all' }}>
          <SingleToast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

// ─── Hook: useToasts ───
export interface ToastAPI {
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
  success: (title: string, message?: string, details?: string) => string;
  error: (title: string, message?: string, details?: string) => string;
  warning: (title: string, message?: string, details?: string) => string;
  info: (title: string, message?: string, details?: string) => string;
  agent: (title: string, message?: string, details?: string) => string;
}

export function useToasts(): ToastAPI {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id' | 'timestamp'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: Date.now()
    };
    setToasts(prev => [newToast, ...prev].slice(0, 8));
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => setToasts([]), []);

  const make = (type: ToastType) =>
    (title: string, message?: string, details?: string): string =>
      addToast({ type, title, message, details });

  return {
    toasts,
    addToast,
    dismissToast,
    clearAll,
    success: make('success'),
    error: make('error'),
    warning: make('warning'),
    info: make('info'),
    agent: make('agent')
  };
}
