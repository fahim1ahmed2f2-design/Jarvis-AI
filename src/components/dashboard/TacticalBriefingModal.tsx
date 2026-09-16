import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  X, 
  RefreshCw, 
  Volume2, 
  Square, 
  CloudSun, 
  Cpu, 
  CheckSquare, 
  TrendingUp, 
  Newspaper,
  Compass,
  Zap,
  Activity
} from 'lucide-react';
import { fetchTacticalBriefingApi } from '../../services/api';
import { jarvisTTSService } from '../../services/ttsService';
import { soundFx } from '../../services/soundFxService';

interface TacticalBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export const TacticalBriefingModal: React.FC<TacticalBriefingModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#00f0ff'
}) => {
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [location, setLocation] = useState('Dhaka');

  const loadBriefing = async (loc = location) => {
    setLoading(true);
    try {
      soundFx.playClick();
      const data = await fetchTacticalBriefingApi(loc);
      setBriefing(data);
    } catch (e) {
      console.warn('Briefing load notice:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBriefing();
    } else {
      jarvisTTSService.stop();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const handleSpeak = () => {
    if (!briefing) return;
    if (isSpeaking) {
      jarvisTTSService.stop();
      setIsSpeaking(false);
      return;
    }

    soundFx.playSuccess();
    setIsSpeaking(true);
    const script = briefing.audio_script || briefing.bengali_audio_script || 'Briefing ready, Sir.';
    jarvisTTSService.speak(script, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="hud-modal-backdrop" onClick={onClose}>
      <div 
        className="hud-modal-container"
        style={{ maxWidth: '820px', width: '92vw', maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="hud-modal-header" style={{ borderColor: `${primaryColor}40` }}>
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}40` }}
            >
              <Compass className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wider font-display" style={{ color: primaryColor }}>
                // TACTICAL INTELLIGENCE BRIEFING //
              </h2>
              <p className="text-xs font-mono text-slate-400">
                EXECUTIVE AUTONOMOUS SITREP // {briefing?.date || 'SYNTHESIZING'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadBriefing()}
              disabled={loading}
              className="px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: primaryColor
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              REFRESH
            </button>

            <button
              onClick={handleSpeak}
              disabled={!briefing || loading}
              className="px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: isSpeaking ? '#ef4444' : primaryColor,
                color: '#020617',
                border: 'none',
                boxShadow: `0 0 12px ${isSpeaking ? '#ef444480' : `${primaryColor}80`}`
              }}
            >
              {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
              {isSpeaking ? 'STOP AUDIO' : 'READ DOSSIER'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="hud-modal-body overflow-y-auto p-4 space-y-4 font-mono text-sm">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
              <span>COLLECTING MULTI-DOMAIN INTELLIGENCE & TELEMETRY...</span>
            </div>
          ) : briefing ? (
            <>
              {/* Top Row: System Health & Weather Radar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* System Diagnostics */}
                <div 
                  className="p-3.5 rounded border"
                  style={{ backgroundColor: 'rgba(6, 18, 36, 0.75)', borderColor: `${primaryColor}30` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                      SYSTEM STATUS & HARDWARE
                    </span>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: briefing.system_health?.status === 'Optimal' ? '#10b98120' : '#f59e0b20',
                        color: briefing.system_health?.status === 'Optimal' ? '#10b981' : '#f59e0b',
                        border: `1px solid ${briefing.system_health?.status === 'Optimal' ? '#10b98140' : '#f59e0b40'}`
                      }}
                    >
                      {briefing.system_health?.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div className="text-slate-400 text-[10px]">CPU LOAD</div>
                      <div className="text-sm font-bold text-white">{briefing.system_health?.cpu_percent}%</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div className="text-slate-400 text-[10px]">RAM USED</div>
                      <div className="text-sm font-bold" style={{ color: '#10b981' }}>{briefing.system_health?.ram_percent}%</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div className="text-slate-400 text-[10px]">BATTERY</div>
                      <div className="text-sm font-bold" style={{ color: primaryColor }}>{briefing.system_health?.battery_percent}%</div>
                    </div>
                  </div>
                </div>

                {/* Weather Radar */}
                <div 
                  className="p-3.5 rounded border"
                  style={{ backgroundColor: 'rgba(6, 18, 36, 0.75)', borderColor: `${primaryColor}30` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <CloudSun className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                      ENVIRONMENT RADAR ({briefing.weather?.location || location})
                    </span>
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>
                      {briefing.weather?.temperature_c}°C
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-2">
                    {briefing.weather?.summary || 'Weather conditions normal.'}
                  </p>
                  <div className="flex gap-3 text-[11px] text-slate-400">
                    <span>Humidity: <strong className="text-white">{briefing.weather?.humidity}</strong></span>
                    <span>Wind: <strong className="text-white">{briefing.weather?.wind_speed}</strong></span>
                  </div>
                </div>
              </div>

              {/* Middle Row: Operations Queue & Financials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tasks & Operations */}
                <div 
                  className="p-3.5 rounded border"
                  style={{ backgroundColor: 'rgba(6, 18, 36, 0.75)', borderColor: `${primaryColor}30` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                      OPERATIONAL QUEUE ({briefing.tasks?.count} Tasks, {briefing.reminders?.count} Reminders)
                    </span>
                  </div>
                  {briefing.tasks?.items?.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {briefing.tasks.items.map((t: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                          <span className="truncate">{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-2">No pending operations queued.</div>
                  )}
                </div>

                {/* Market & Crypto Radar */}
                <div 
                  className="p-3.5 rounded border"
                  style={{ backgroundColor: 'rgba(6, 18, 36, 0.75)', borderColor: `${primaryColor}30` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                      FINANCIAL & CRYPTO RADAR
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div className="text-slate-400 text-[10px]">BITCOIN (BTC)</div>
                      <div className="text-sm font-bold text-white">
                        ${briefing.market?.btc_usd ? Number(briefing.market.btc_usd).toLocaleString() : '--'}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        {briefing.market?.btc_change_24h > 0 ? '+' : ''}{briefing.market?.btc_change_24h}% (24h)
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                      <div className="text-slate-400 text-[10px]">USD TO BDT</div>
                      <div className="text-sm font-bold text-white">
                        {briefing.market?.usd_bdt} ৳
                      </div>
                      <div className="text-[10px] text-slate-400">Interbank Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Global Tech News Dossier */}
              <div 
                className="p-3.5 rounded border"
                style={{ backgroundColor: 'rgba(6, 18, 36, 0.75)', borderColor: `${primaryColor}30` }}
              >
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <Newspaper className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  GLOBAL TECH DOSSIER
                </div>
                <div className="space-y-1.5 text-xs">
                  {briefing.news?.map((headline: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300">
                      <span className="text-slate-500 font-mono text-[10px]">0{idx+1} //</span>
                      <span className="truncate hover:text-cyan-400 transition-colors">{headline}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">No briefing data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
