import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  X,
  RefreshCw,
  Volume2,
  Square,
  MapPin,
  Compass,
  Wind,
  Droplets,
  Sun,
  Moon,
  Shield,
  Activity,
  Zap,
  Globe,
  Wifi,
  Navigation,
  Sparkles
} from 'lucide-react';
import { fetchRadarScanApi } from '../../services/api';
import { jarvisTTSService } from '../../services/ttsService';
import { soundFx } from '../../services/soundFxService';

interface GeospatialRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export const GeospatialRadarModal: React.FC<GeospatialRadarModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#00f0ff'
}) => {
  const [radarData, setRadarData] = useState<any>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedBlip, setSelectedBlip] = useState<any>(null);

  const runRadarScan = async (loc?: string) => {
    setLoading(true);
    soundFx.playClick();
    try {
      const data = await fetchRadarScanApi(loc);
      setRadarData(data);
      if (data?.radar_blips && data.radar_blips.length > 0) {
        setSelectedBlip(data.radar_blips[0]);
      }
      soundFx.playSuccess();
    } catch (err) {
      console.warn('Radar scan notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runRadarScan();
    } else {
      jarvisTTSService.stop();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const handleSpeak = () => {
    if (!radarData?.tactical_report) return;
    if (isSpeaking) {
      jarvisTTSService.stop();
      setIsSpeaking(false);
      return;
    }

    soundFx.playSuccess();
    setIsSpeaking(true);
    jarvisTTSService.speak(radarData.tactical_report, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  if (!isOpen) return null;

  const loc = radarData?.location || {};
  const atm = radarData?.atmospheric || {};
  const env = radarData?.environment || {};
  const blips = radarData?.radar_blips || [];

  // AQI Color helper
  const aqiVal = typeof env.us_aqi === 'number' ? env.us_aqi : 50;
  const aqiColor = aqiVal <= 50 ? '#10b981' : aqiVal <= 100 ? '#f59e0b' : aqiVal <= 150 ? '#f97316' : '#ef4444';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          background: 'linear-gradient(135deg, rgba(2, 8, 20, 0.98) 0%, rgba(5, 16, 35, 0.98) 100%)',
          border: `1px solid ${primaryColor}45`,
          borderRadius: '12px',
          boxShadow: `0 0 60px ${primaryColor}25, 0 24px 60px rgba(0,0,0,0.85)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.09)',
          background: `linear-gradient(90deg, ${primaryColor}12, transparent)`
        }}>
          {/* Title & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '8px',
              background: `${primaryColor}15`,
              border: `1px solid ${primaryColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Radio size={20} color={primaryColor} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 700,
                color: primaryColor,
                letterSpacing: '0.1em'
              }}>
                // JARVIS GEOSPATIAL TACTICAL RADAR //
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                letterSpacing: '0.06em',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>TACTICAL VICINITY &amp; ATMOSPHERIC SCANNER</span>
                <span style={{
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '9px'
                }}>
                  ● RADAR ONLINE
                </span>
              </div>
            </div>
          </div>

          {/* Action Matrix */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => runRadarScan(searchLocation || undefined)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                color: primaryColor,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'SWEEPING...' : 'RADAR SWEEP'}</span>
            </button>

            {radarData?.tactical_report && (
              <button
                onClick={handleSpeak}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: isSpeaking ? '#ef4444' : primaryColor,
                  color: '#020617',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 0 14px ${isSpeaking ? '#ef444480' : `${primaryColor}60`}`,
                  transition: 'all 0.2s'
                }}
              >
                {isSpeaking ? <Square size={12} className="fill-current" /> : <Volume2 size={12} />}
                <span>{isSpeaking ? 'STOP' : 'SPEAK REPORT'}</span>
              </button>
            )}

            {/* Glowing Close Button */}
            <button
              onClick={onClose}
              title="Close Radar (Esc)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <X size={14} />
              <span>CLOSE</span>
            </button>
          </div>
        </div>

        {/* ── SEARCH & LOCATION QUICK BAR ── */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Scan custom city or coordinates (e.g. Dhaka, Chittagong, Sylhet, Tokyo, London)..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(6, 18, 36, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#ffffff',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                onKeyDown={(e) => e.key === 'Enter' && runRadarScan(searchLocation || undefined)}
              />
            </div>
            <button
              onClick={() => runRadarScan(searchLocation || undefined)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                borderRadius: '6px',
                background: primaryColor,
                color: '#020617',
                border: 'none',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <Navigation size={12} />
              <span>SCAN SECTOR</span>
            </button>
          </div>

          {/* Quick Location Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              onClick={() => { setSearchLocation(''); runRadarScan(); }}
              style={{
                padding: '3px 9px', borderRadius: '4px',
                background: 'rgba(0, 240, 255, 0.12)', border: '1px solid rgba(0, 240, 255, 0.35)',
                color: primaryColor, fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
              }}
            >
              📍 My Location (Auto GPS)
            </button>
            {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Cox\'s Bazar', 'Tokyo', 'London', 'New York'].map((city) => (
              <button
                key={city}
                onClick={() => { setSearchLocation(city); runRadarScan(city); }}
                style={{
                  padding: '3px 8px', borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer'
                }}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* ── MODAL BODY: 2-COLUMN TACTICAL HUD ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '16px'
        }}>
          {/* ── LEFT COLUMN: SCI-FI ROTATING RADAR SCOPE ── */}
          <div style={{
            background: 'rgba(6, 18, 36, 0.92)',
            border: `1px solid ${primaryColor}35`,
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            {/* Header Telemetry */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: primaryColor }}>
              <span style={{ borderTop: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}`, padding: '2px 4px' }}>
                RADAR_SWEEP//360°
              </span>
              <span style={{ borderTop: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}`, padding: '2px 4px' }}>
                RANGE: 50 KM
              </span>
            </div>

            {/* Circular Radar Scope */}
            <div style={{
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, rgba(2, 10, 25, 0.95) 75%)',
              border: `2px solid ${primaryColor}50`,
              position: 'relative',
              margin: '12px 0',
              overflow: 'hidden',
              boxShadow: `0 0 30px ${primaryColor}20, inset 0 0 30px ${primaryColor}15`
            }}>
              {/* Concentric Distance Rings */}
              <div style={{ position: 'absolute', inset: '15%', border: `1px dashed ${primaryColor}30`, borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: '30%', border: `1px solid ${primaryColor}25`, borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: '45%', border: `1px dashed ${primaryColor}35`, borderRadius: '50%' }} />

              {/* Crosshair Axes */}
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: `${primaryColor}25` }} />
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: `${primaryColor}25` }} />

              {/* Rotating Radar Sweep Beam */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${primaryColor}25 330deg, ${primaryColor}60 360deg)`,
                animation: 'spin 4s linear infinite',
                transformOrigin: 'center center'
              }} />

              {/* Center Origin Dot */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '6px',
                height: '6px',
                background: '#ffffff',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 10px ${primaryColor}`
              }} />

              {/* Blinking Tactical Blips */}
              {blips.map((b: any, idx: number) => {
                const angleRad = (b.bearing_deg - 90) * (Math.PI / 180);
                const distRatio = Math.min(b.distance_km / 10, 0.85); // normalize within circle
                const x = 50 + Math.cos(angleRad) * distRatio * 45;
                const y = 50 + Math.sin(angleRad) * distRatio * 45;

                const isSelected = selectedBlip?.id === b.id;

                return (
                  <div
                    key={b.id || idx}
                    onClick={() => setSelectedBlip(b)}
                    title={`${b.name} (${b.distance_km}km)`}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${y}%`,
                      width: isSelected ? '12px' : '8px',
                      height: isSelected ? '12px' : '8px',
                      borderRadius: '50%',
                      background: b.type === 'MEDICAL' ? '#ef4444' : b.type === 'POWER' ? '#f59e0b' : '#10b981',
                      border: '1px solid #ffffff',
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      boxShadow: `0 0 8px ${b.type === 'MEDICAL' ? '#ef4444' : '#10b981'}`,
                      animation: 'pulse 1.5s infinite',
                      zIndex: 10
                    }}
                  />
                );
              })}
            </div>

            {/* Bottom GPS Coordinates Readout */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: primaryColor }}>
              <span style={{ borderBottom: `2px solid ${primaryColor}`, borderLeft: `2px solid ${primaryColor}`, padding: '2px 4px' }}>
                GPS: {loc.coordinates?.formatted || '23.8103° N, 90.4125° E'}
              </span>
              <span style={{ borderBottom: `2px solid ${primaryColor}`, borderRight: `2px solid ${primaryColor}`, padding: '2px 4px' }}>
                ALT: {loc.elevation || '14m AMSL'}
              </span>
            </div>

            {/* Selected Blip Detail Card */}
            {selectedBlip && (
              <div style={{
                width: '100%',
                boxSizing: 'border-box',
                marginTop: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontFamily: 'monospace',
                fontSize: '10px'
              }}>
                <div style={{ color: primaryColor, fontWeight: 700 }}>
                  [TARGET LOCKED]: {selectedBlip.name}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>DIST: {selectedBlip.distance_km} KM</span>
                  <span>BEARING: {selectedBlip.bearing_deg}°</span>
                  <span style={{ color: '#10b981' }}>{selectedBlip.status}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: MULTI-LAYER TELEMETRY & ATMOSPHERIC METRICS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Location Overview Badge Card */}
            <div style={{
              background: 'rgba(6, 18, 36, 0.92)',
              border: `1px solid ${primaryColor}30`,
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  {loc.full_name || 'Dhaka, Bangladesh'}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                  ISP: {loc.isp} // TIMEZONE: {loc.timezone}
                </div>
              </div>
              <div style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: primaryColor,
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 700
              }}>
                SECTOR NOMINAL
              </div>
            </div>

            {/* Weather & Atmospheric Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {/* Temperature */}
              <div style={{ background: 'rgba(6, 18, 36, 0.92)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'monospace', fontSize: '9.5px' }}>TEMPERATURE</div>
                <div style={{ color: primaryColor, fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                  {atm.temperature_c ?? 28}°C
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '9px' }}>Feels: {atm.feels_like_c ?? 30}°C</div>
              </div>

              {/* Wind */}
              <div style={{ background: 'rgba(6, 18, 36, 0.92)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'monospace', fontSize: '9.5px' }}>WIND VELOCITY</div>
                <div style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                  {atm.wind_kph ?? '12 km/h'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '9px' }}>Vis: {atm.visibility ?? '10 km'}</div>
              </div>

              {/* Humidity */}
              <div style={{ background: 'rgba(6, 18, 36, 0.92)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'monospace', fontSize: '9.5px' }}>HUMIDITY</div>
                <div style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                  {atm.humidity ?? '65%'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '9px' }}>Sky: {atm.condition}</div>
              </div>

              {/* UV & Sun */}
              <div style={{ background: 'rgba(6, 18, 36, 0.92)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'monospace', fontSize: '9.5px' }}>UV RADIATION</div>
                <div style={{ color: '#facc15', fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                  {atm.uv_index ?? '6.2'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '9px' }}>Sunset: {atm.sunset}</div>
              </div>
            </div>

            {/* Air Quality (AQI) Environmental Scanner */}
            <div style={{
              background: 'rgba(6, 18, 36, 0.92)',
              border: `1px solid ${aqiColor}40`,
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace', fontSize: '10px' }}>
                  ENVIRONMENTAL AIR QUALITY INDEX (AQI)
                </div>
                <div style={{ color: aqiColor, fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                  US AQI {env.us_aqi ?? 65} — {env.rating ?? 'Moderate'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace', fontSize: '10px', marginTop: '4px' }}>
                  PM2.5: {env.pm2_5} | PM10: {env.pm10} | Ozone: {env.ozone}
                </div>
              </div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: `${aqiColor}15`,
                border: `2px solid ${aqiColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 700,
                color: aqiColor
              }}>
                {env.us_aqi ?? 65}
              </div>
            </div>

            {/* Tactical Vicinity Infrastructure List */}
            <div style={{
              background: 'rgba(6, 18, 36, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ color: primaryColor, fontFamily: 'monospace', fontSize: '10.5px', fontWeight: 700 }}>
                VICINITY TACTICAL INFRASTRUCTURE NODES ({blips.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                {blips.map((b: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedBlip(b)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: selectedBlip?.id === b.id ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedBlip?.id === b.id ? `${primaryColor}40` : 'rgba(255, 255, 255, 0.05)'}`,
                      fontFamily: 'monospace',
                      fontSize: '9.5px',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ color: '#ffffff' }}>{b.name}</span>
                    <span style={{ color: primaryColor }}>{b.distance_km} KM</span>
                    <span style={{ color: '#10b981' }}>{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
