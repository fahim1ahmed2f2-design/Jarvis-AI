/**
 * JARVIS Agent Town — Live Activity Feed HUD
 * Step 8/15+: Draggable, Collapsible & Dismissible Floating Activity Stream
 */

import React, { useState, useEffect, useRef } from 'react';
import { AgentActivityEvent } from './types';
import { AgentTownMember } from '../../types';
import { Activity, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Zap, Radio, X, GripVertical } from 'lucide-react';

interface AgentActivityFeedProps {
  events: AgentActivityEvent[];
  agents: AgentTownMember[];
  onSelectAgent: (agent: AgentTownMember) => void;
  onClose?: () => void;
  primaryColor?: string;
}

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({
  events,
  agents,
  onSelectAgent,
  onClose,
  primaryColor = '#00e8ff'
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [, setTick] = useState<number>(0);

  // Dragging State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // 1-second interval for updating humanized timestamps
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev + 1) % 1000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global mouse move & mouse up listeners for smooth dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 340, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position ? position.x : rect.left,
      startY: position ? position.y : rect.top
    };
    if (!position) {
      setPosition({ x: rect.left, y: rect.top });
    }
    setIsDragging(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const formatTimestamp = (timestamp: number): string => {
    const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    return `${mins}m ago`;
  };

  const filteredEvents =
    selectedFilter === 'ALL'
      ? events
      : events.filter((e) => e.agentId === selectedFilter);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'TASK_COMPLETED':
        return <CheckCircle size={12} color="#10e890" />;
      case 'TASK_FAILED':
        return <AlertTriangle size={12} color="#ef4444" />;
      case 'AGENT_COMMUNICATION':
        return <Radio size={12} color="#00e8ff" />;
      default:
        return <Zap size={12} color="#f5a524" />;
    }
  };

  // Minimized Re-Open Button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Open Town Activity Feed"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 25,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'rgba(2, 6, 23, 0.9)',
          border: '1px solid rgba(0, 232, 255, 0.4)',
          borderRadius: '8px',
          color: '#00e8ff',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '0.66rem',
          fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 232, 255, 0.2)',
          transition: 'all 0.15s ease'
        }}
      >
        <Activity size={13} color={primaryColor} />
        ACTIVITY FEED
      </button>
    );
  }

  const customStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px',
        maxHeight: isExpanded ? '240px' : '42px'
      }
    : {
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        width: '320px',
        maxHeight: isExpanded ? '240px' : '42px'
      };

  return (
    <div
      ref={containerRef}
      style={{
        ...customStyle,
        background: 'linear-gradient(135deg, rgba(2, 6, 22, 0.94) 0%, rgba(6, 14, 38, 0.96) 100%)',
        border: '1px solid rgba(0, 232, 255, 0.35)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 232, 255, 0.18)',
        backdropFilter: 'blur(12px)',
        zIndex: 28,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'max-height 0.2s ease',
        userSelect: 'none'
      }}
    >
      {/* ── DRAGGABLE HEADER ── */}
      <div
        onMouseDown={handleDragMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 10px',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
        }}
      >
        {/* Drag Grip + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GripVertical size={13} color="rgba(255, 255, 255, 0.4)" />
          <Activity size={13} color={primaryColor} />
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.64rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.08em'
            }}
          >
            TOWN ACTIVITY FEED
          </span>
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.55rem',
              color: primaryColor,
              background: 'rgba(0, 232, 255, 0.15)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontWeight: 700
            }}
          >
            LIVE
          </span>
        </div>

        {/* Header Action Buttons: Minimize/Expand + Close (X) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? 'Minimize' : 'Expand'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            title="Close Feed (Dismiss)"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              color: '#f87171',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '2px'
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* ── AGENT FILTER CHIPS ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              overflowX: 'auto'
            }}
          >
            {['ALL', ...agents.map((a) => a.id)].map((f) => {
              const matched = agents.find((a) => a.id === f);
              const label = f === 'ALL' ? 'ALL' : (matched ? matched.name.toUpperCase() : f);
              const isSelected = selectedFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.55rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    background: isSelected ? 'rgba(0, 232, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? 'rgba(0, 232, 255, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── EVENT STREAM ── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {filteredEvents.length === 0 ? (
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.62rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textAlign: 'center',
                  padding: '16px 0'
                }}
              >
                NO RECENT ACTIVITY RECORDED
              </div>
            ) : (
              filteredEvents.slice(0, 15).map((evt) => {
                const matchedAgent = agents.find((a) => a.id === evt.agentId);

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      if (matchedAgent) onSelectAgent(matchedAgent);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '5px 8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px',
                      cursor: matchedAgent ? 'pointer' : 'default',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getEventIcon(evt.eventType)}
                        <span
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '0.60rem',
                            fontWeight: 700,
                            color: evt.agentColor || '#ffffff'
                          }}
                        >
                          {evt.agentName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.52rem',
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}
                      >
                        {formatTimestamp(evt.timestamp)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.58rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {evt.title}
                    </div>

                    {evt.description && (
                      <div
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: '0.52rem',
                          color: 'rgba(255, 255, 255, 0.45)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {evt.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
