/**
 * JARVIS Agent Town — Smart Agent & Sector Spotlight Search Bar
 * Allows instant search and camera jump to any agent, room, or capability.
 */

import React, { useState, useRef, useEffect } from 'react';
import { AgentTownMember, TownSector } from './types';
import { Search, MapPin, User, Sparkles, X } from 'lucide-react';
import { soundFx } from '../../services/soundFxService';

interface AgentSpotlightBarProps {
  agents: AgentTownMember[];
  onSelectAgent: (agent: AgentTownMember) => void;
  onSelectSector: (sector: TownSector) => void;
  primaryColor?: string;
}

export const AgentSpotlightBar: React.FC<AgentSpotlightBarProps> = ({
  agents,
  onSelectAgent,
  onSelectSector,
  primaryColor = '#00e8ff'
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sectors: { id: TownSector; label: string; icon: string }[] = [
    { id: 'ALL', label: 'Central Plaza & Cafeteria', icon: '☕' },
    { id: 'PENTHOUSE', label: 'Executive Boardroom & Sanctum', icon: '👑' },
    { id: 'RESEARCH', label: 'AI Research & Neural Lab', icon: '🔬' },
    { id: 'OPERATIONS', label: 'Software Engineering Bay', icon: '⚡' },
    { id: 'KNOWLEDGE', label: 'Knowledge Archive Library', icon: '📚' },
    { id: 'COMMAND', label: 'Mission Strategy Command HQ', icon: '🎖️' },
    { id: 'STUDIO', label: 'UX & Media Design Studio', icon: '🎨' },
    { id: 'CYBER_DEFENSE', label: 'Cyber Defense War Room', icon: '🛡️' }
  ];

  const matchedAgents = query.trim()
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.role.toLowerCase().includes(query.toLowerCase()) ||
          a.capabilities.some((c) => c.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const matchedSectors = query.trim()
    ? sectors.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()) || s.id.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div style={{ position: 'relative', pointerEvents: 'auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(4, 9, 24, 0.90)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isOpen ? primaryColor : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '7px',
          padding: '3px 8px',
          boxShadow: isOpen ? `0 0 12px ${primaryColor}30` : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <Search size={12} style={{ color: isOpen ? primaryColor : 'rgba(255, 255, 255, 0.5)' }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Spotlight search (Agent, Room, Skill)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.68rem',
            width: isOpen ? '190px' : '150px',
            transition: 'width 0.2s ease'
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', padding: 0 }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && query.trim().length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '260px',
            background: 'rgba(4, 9, 24, 0.98)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${primaryColor}50`,
            borderRadius: '8px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(0, 232, 255, 0.2)',
            zIndex: 50,
            padding: '6px',
            maxHeight: '260px',
            overflowY: 'auto'
          }}
        >
          {/* Matched Agents */}
          {matchedAgents.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.60rem', color: '#94a3b8', padding: '2px 6px' }}>
                AGENTS
              </div>
              {matchedAgents.map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectAgent(ag);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    marginBottom: '3px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${primaryColor}20`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: ag.avatar.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.55rem',
                      color: '#000000',
                      fontWeight: 900
                    }}
                  >
                    {ag.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                      {ag.name}
                    </div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.60rem', color: '#94a3b8' }}>
                      {ag.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Matched Sectors */}
          {matchedSectors.length > 0 && (
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.60rem', color: '#94a3b8', padding: '2px 6px' }}>
                SECTORS & ROOMS
              </div>
              {matchedSectors.map((sec) => (
                <div
                  key={sec.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectSector(sec.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    marginBottom: '3px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${primaryColor}20`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                >
                  <span>{sec.icon}</span>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.76rem', fontWeight: 700, color: '#ffffff' }}>
                    {sec.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {matchedAgents.length === 0 && matchedSectors.length === 0 && (
            <div style={{ padding: '8px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              No matching agent or room found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
