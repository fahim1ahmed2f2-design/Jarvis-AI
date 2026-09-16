import React, { useState } from 'react';
import { Activity, X } from 'lucide-react';
import { IntelligenceEvent, StateVisualConfig } from '../../types/jarvis';

interface LiveIntelligenceFeedProps {
  events: IntelligenceEvent[];
  config: StateVisualConfig;
  onClose?: () => void;
}

export const LiveIntelligenceFeed: React.FC<LiveIntelligenceFeedProps> = ({
  events,
  config,
  onClose
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredEvents = filterCategory === 'ALL'
    ? events
    : events.filter(e => e.category === filterCategory);

  const getCategoryColor = (category: IntelligenceEvent['category']) => {
    switch (category) {
      case 'VOICE': return '#06b6d4';
      case 'AI': return '#8b5cf6';
      case 'AGENT': return '#f59e0b';
      case 'TOOL': return '#10b981';
      case 'MEMORY': return '#ec4899';
      case 'SYSTEM':
      default:
        return '#00f0ff';
    }
  };

  return (
    <aside className="jarvis-live-feed-sidebar">
      {/* Feed Header */}
      <div className="feed-header">
        <div className="feed-title-block">
          <div className="feed-live-indicator">
            <span 
              className="live-pulse-dot" 
              style={{ 
                backgroundColor: config.primaryColor,
                boxShadow: `0 0 8px ${config.primaryColor}`
              }} 
            />
            <span className="live-tag font-mono">LIVE FEED</span>
          </div>
          <h2 className="feed-heading font-display">
            INTELLIGENCE STREAM
          </h2>
        </div>

        <div className="feed-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div className="feed-meta-count font-mono" style={{ color: config.primaryColor }}>
            {events.length} EVENTS
          </div>
          {onClose && (
            <button
              type="button"
              className="hud-panel-close-btn"
              onClick={onClose}
              title="Hide Intelligence Stream (Cross)"
              aria-label="Hide Intelligence Stream"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="feed-filter-bar font-mono">
        {['ALL', 'AI', 'AGENT', 'VOICE', 'SYSTEM'].map((cat) => (
          <button
            key={cat}
            className={`filter-pill ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
            style={{
              borderColor: filterCategory === cat ? config.primaryColor : 'rgba(0, 240, 255, 0.15)',
              color: filterCategory === cat ? config.primaryColor : '#94a3b8'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="feed-events-container">
        {filteredEvents.length === 0 ? (
          <div className="feed-empty-state font-mono">
            <span>NO EVENTS IN LOG</span>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const catColor = getCategoryColor(evt.category);

            return (
              <div 
                key={evt.id} 
                className={`feed-event-item level-${evt.level || 'info'}`}
                style={{
                  borderLeftColor: catColor
                }}
              >
                <div className="event-item-top">
                  <span 
                    className="event-category-badge font-mono"
                    style={{ 
                      color: catColor,
                      borderColor: `${catColor}40`,
                      backgroundColor: `${catColor}15`
                    }}
                  >
                    {evt.category}
                  </span>
                  <span className="event-timestamp font-mono">
                    {evt.timestamp}
                  </span>
                </div>

                <p className="event-description font-mono">
                  {evt.description}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Feed Bottom Status */}
      <div className="feed-footer font-mono">
        <div className="footer-status-line">
          <Activity className="w-3 h-3" style={{ color: config.primaryColor }} />
          <span>SOCKET HARMONICS // NOMINAL</span>
        </div>
      </div>
    </aside>
  );
};
