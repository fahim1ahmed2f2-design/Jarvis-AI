import React from 'react';
import { ExecutionStep } from '../../services/api';

interface ExecutingActivityCardProps {
  steps: ExecutionStep[];
  primaryColor: string;
  isExecuting: boolean;
  onCancel?: () => void;
}

export const ExecutingActivityCard: React.FC<ExecutingActivityCardProps> = ({
  steps,
  primaryColor,
  isExecuting,
  onCancel
}) => {
  if (!isExecuting && steps.length === 0) return null;

  return (
    <div className="hud-activity-card animate-fade-in font-mono">
      <div className="activity-card-header">
        <div className="activity-header-left">
          <span className="activity-pulse-dot" style={{ backgroundColor: primaryColor }} />
          <span className="activity-header-title">AGENT ACTION PIPELINE</span>
        </div>
        {isExecuting && onCancel && (
          <button
            type="button"
            className="activity-abort-btn"
            onClick={onCancel}
            title="Halt current subroutine"
          >
            ABORT [ ■ ]
          </button>
        )}
      </div>

      <div className="activity-steps-list">
        {steps.map((step, idx) => {
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'executing';
          const isFailed = step.status === 'failed';
          const isAwaiting = step.status === 'awaiting_confirmation';

          return (
            <div
              key={idx}
              className={`activity-step-row ${isDone ? 'step-done' : ''} ${isCurrent ? 'step-active' : ''} ${isFailed ? 'step-failed' : ''}`}
            >
              <span className="step-icon">
                {isDone && <span style={{ color: '#10b981' }}>✓</span>}
                {isCurrent && <span className="animate-spin" style={{ color: primaryColor }}>⟳</span>}
                {isFailed && <span style={{ color: '#ef4444' }}>✕</span>}
                {isAwaiting && <span style={{ color: '#f59e0b' }}>⚠</span>}
              </span>
              <span className="step-text" style={{ color: isCurrent ? primaryColor : isDone ? '#e2e8f0' : '#94a3b8' }}>
                {step.title}
              </span>
              {isCurrent && <span className="step-running-tag animate-pulse">RUNNING...</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
