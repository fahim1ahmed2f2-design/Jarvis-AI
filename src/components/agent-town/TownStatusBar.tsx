import React, { useState } from 'react';
import { Activity, ShieldCheck, Database, Server, Radio, ChevronUp, ChevronDown, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { TownMetrics, MemoryCounts, ActivityEvent } from './types';

interface TownStatusBarProps {
  metrics: TownMetrics;
  memoryCounts?: MemoryCounts;
  recentActivities?: ActivityEvent[];
  primaryColor?: string;
}

export const TownStatusBar: React.FC<TownStatusBarProps> = ({
  metrics,
  memoryCounts,
  recentActivities = [],
  primaryColor = '#a855f7'
}) => {
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', zIndex: 20, flexShrink: 0 }}>
      {/* Expandable Activity Feed Drawer */}
      {isActivityOpen && (
        <div
          style={{
            maxHeight: '140px',
            overflowY: 'auto',
            background: 'rgba(2, 6, 18, 0.98)',
            borderTop: '1px solid rgba(168, 85, 247, 0.25)',
            padding: '8px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.62rem'
          }}
        >
          <div style={{ color: '#00e8ff', fontWeight: 700, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
            <span>// REAL-TIME TEAM ACTIVITY FEED</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{recentActivities.length} EVENTS RECORDED</span>
          </div>

          {recentActivities.slice(0, 8).map((act) => (
            <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.85)' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>[{act.timestamp}]</span>
              <span style={{ color: act.agentId === 'agent-alice' ? '#00e8ff' : act.agentId === 'agent-bob' ? '#10e890' : act.agentId === 'agent-carol' ? '#a855f7' : '#f5a524', fontWeight: 700 }}>
                {act.agentName}:
              </span>
              <span>{act.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Status Bar Footer */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 20px',
          borderTop: '1px solid rgba(168, 85, 247, 0.18)',
          background: 'rgba(2, 6, 18, 0.96)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.64rem',
          color: 'rgba(216, 180, 254, 0.65)',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: System Health Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setIsActivityOpen((p) => !p)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#ffffff',
              padding: '2px 6px',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.60rem',
              cursor: 'pointer'
            }}
          >
            <Activity size={10} color="#00e8ff" />
            <span>TEAM ACTIVITY</span>
            {isActivityOpen ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.75)' }}>
            <Server size={12} color="#10e890" />
            <span>SYSTEM: AGENTS (4/4) • AI (CONNECTED) • MEMORY (READY) • TOOLS (READY) • ORCHESTRATOR (READY)</span>
          </div>
        </div>

        {/* Center: Memory Counts Telemetry */}
        {memoryCounts && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.7)' }}>
            <Database size={11} color="#a855f7" />
            <span>
              MEMORY STATUS: ALICE ({memoryCounts.alice}) • BOB ({memoryCounts.bob}) • CAROL ({memoryCounts.carol}) • DAVE ({memoryCounts.dave}) • SHARED ({memoryCounts.shared})
            </span>
          </div>
        )}

        {/* Right: Status Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
          <span>LEGEND:</span>
          <span style={{ color: '#10e890' }}>● READY</span>
          <span style={{ color: '#f5a524' }}>● THINKING</span>
          <span style={{ color: '#00e8ff' }}>● WORKING</span>
          <span style={{ color: '#a855f7' }}>● WAITING</span>
          <span style={{ color: '#ff4060' }}>! ERROR</span>
        </div>
      </footer>
    </div>
  );
};
