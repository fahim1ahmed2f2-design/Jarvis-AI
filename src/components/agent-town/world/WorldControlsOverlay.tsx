/**
 * JARVIS Agent Town v4.0 Sovereign — World Controls Overlay
 * Futuristic HUD Viewport, Interactive Sector Quick-Jump Matrix & Mini-Map Radar Controller
 */

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Cpu,
  Brain,
  BookOpen,
  Shield,
  Sparkles,
  Tv,
  Wrench,
  Crown,
  Radar,
  Eye,
  Navigation
} from 'lucide-react';
import { TownSector, AgentTownMember } from '../types';
import { soundFx } from '../../../services/soundFxService';

interface WorldControlsOverlayProps {
  selectedSector: TownSector;
  selectedAgentId: string | null;
  agents: AgentTownMember[];
  onSelectSector: (sector: TownSector) => void;
  onSelectAgent: (agent: AgentTownMember) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  primaryColor?: string;
}

export const WorldControlsOverlay: React.FC<WorldControlsOverlayProps> = ({
  selectedSector,
  selectedAgentId,
  agents,
  onSelectSector,
  onSelectAgent,
  onZoomIn,
  onZoomOut,
  onResetView,
  primaryColor = '#00e8ff'
}) => {
  const [showMiniMap, setShowMiniMap] = useState(false);

  const getAgent = (id: string) => agents.find((a) => a.id === id);

  const sectors: { id: TownSector; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'ALL', label: 'PLAZA', icon: <Sparkles size={11} />, color: '#00e8ff' },
    { id: 'PENTHOUSE', label: 'SANCTUM', icon: <Crown size={11} />, color: '#eab308' },
    { id: 'RESEARCH', label: 'AI LAB', icon: <Brain size={11} />, color: '#00e8ff' },
    { id: 'OPERATIONS', label: 'OPS GRID', icon: <Cpu size={11} />, color: '#f97316' },
    { id: 'KNOWLEDGE', label: 'ARCHIVE', icon: <BookOpen size={11} />, color: '#a855f7' },
    { id: 'COMMAND', label: 'COMMAND', icon: <Shield size={11} />, color: '#10b981' },
    { id: 'STUDIO', label: 'STUDIO', icon: <Tv size={11} />, color: '#ec4899' },
    { id: 'CYBER_DEFENSE', label: 'DEFENSE', icon: <Wrench size={11} />, color: '#f59e0b' }
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 15
      }}
    >
      {/* 1. Quick Sector Jump Pill Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(4, 9, 24, 0.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${primaryColor}30`,
          borderRadius: '8px',
          padding: '4px 6px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
          pointerEvents: 'auto'
        }}
      >
        {sectors.map((sec) => {
          const isSelected = selectedSector === sec.id && !selectedAgentId;
          return (
            <button
              key={sec.id}
              onClick={() => {
                soundFx.playClick();
                onSelectSector(sec.id);
              }}
              title={`Fly to ${sec.label} Sector`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 7px',
                background: isSelected ? `${sec.color}25` : 'transparent',
                border: isSelected ? `1px solid ${sec.color}` : '1px solid transparent',
                borderRadius: '5px',
                color: isSelected ? sec.color : 'rgba(255, 255, 255, 0.6)',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.66rem',
                fontWeight: isSelected ? 800 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 0 8px ${sec.color}35` : 'none'
              }}
            >
              <span style={{ color: isSelected ? sec.color : 'rgba(255,255,255,0.4)' }}>
                {sec.icon}
              </span>
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Top-Right Navigation Controls & Mini-Map Radar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '6px',
          pointerEvents: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(4, 9, 24, 0.90)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${primaryColor}30`,
            borderRadius: '8px',
            padding: '4px 8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Mini-Map Radar Toggle */}
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            title="Toggle Tactical Mini-Map Radar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 6px',
              background: showMiniMap ? `${primaryColor}30` : 'transparent',
              border: `1px solid ${showMiniMap ? primaryColor : 'transparent'}`,
              borderRadius: '5px',
              color: showMiniMap ? primaryColor : '#cbd5e1',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.64rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Radar size={12} style={{ color: primaryColor }} />
            <span>RADAR</span>
          </button>

          {/* Zoom In */}
          {onZoomIn && (
            <button
              onClick={() => {
                soundFx.playClick();
                onZoomIn();
              }}
              title="Zoom In Camera"
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                padding: '3px 6px',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomIn size={12} />
            </button>
          )}

          {/* Zoom Out */}
          {onZoomOut && (
            <button
              onClick={() => {
                soundFx.playClick();
                onZoomOut();
              }}
              title="Zoom Out Camera"
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                padding: '3px 6px',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomOut size={12} />
            </button>
          )}

          {/* Reset Camera View */}
          {onResetView && (
            <button
              onClick={() => {
                soundFx.playClick();
                onResetView();
              }}
              title="Reset Campus View"
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                padding: '3px 6px',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Maximize2 size={12} />
            </button>
          )}

          {/* Drag & Pan Hint */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.60rem',
              color: 'rgba(255, 255, 255, 0.5)',
              paddingLeft: '4px'
            }}
          >
            <Compass size={11} color={primaryColor} />
            <span>PAN & ZOOM ENABLED</span>
          </div>
        </div>

        {/* Tactical Mini-Map Radar Popup */}
        {showMiniMap && (
          <div
            style={{
              width: '180px',
              height: '130px',
              background: 'rgba(4, 9, 24, 0.95)',
              backdropFilter: 'blur(14px)',
              border: `1px solid ${primaryColor}`,
              borderRadius: '8px',
              boxShadow: `0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px ${primaryColor}25`,
              position: 'relative',
              overflow: 'hidden',
              padding: '6px'
            }}
          >
            {/* Radar Grid Lines */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `radial-gradient(circle, ${primaryColor}15 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
                pointerEvents: 'none'
              }}
            />

            {/* Radar Sweep Animation */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '110px',
                height: '110px',
                marginTop: '-55px',
                marginLeft: '-55px',
                borderRadius: '50%',
                border: `1px solid ${primaryColor}30`,
                pointerEvents: 'none'
              }}
            />

            {/* Mini Sector Labels */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#94a3b8', fontFamily: "'Share Tech Mono', monospace" }}>
                <span>SANCTUM [TOP]</span>
                <span>AI LAB</span>
              </div>

              {/* Live Agent Blips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center', margin: 'auto' }}>
                {agents.map((ag) => (
                  <div
                    key={ag.id}
                    onClick={() => onSelectAgent(ag)}
                    title={`${ag.name}: ${ag.role}`}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: ag.status === 'WORKING' ? '#00e8ff' : '#10b981',
                      border: '1px solid #ffffff',
                      boxShadow: `0 0 6px ${ag.status === 'WORKING' ? '#00e8ff' : '#10b981'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.45rem',
                      fontWeight: 900,
                      color: '#000000',
                      cursor: 'pointer'
                    }}
                  >
                    {ag.name.charAt(0)}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#94a3b8', fontFamily: "'Share Tech Mono', monospace" }}>
                <span>OPS GRID</span>
                <span>NEWSROOM</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
