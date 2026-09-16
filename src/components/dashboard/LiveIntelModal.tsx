import React, { useState, useEffect } from 'react';
import {
  CloudSun, TrendingUp, Newspaper, RefreshCw, X, MapPin,
  Wind, Droplets, ArrowUpRight, ArrowDownRight, ExternalLink
} from 'lucide-react';
import { fetchLiveWeatherApi, fetchCryptoFxApi, fetchTechNewsApi } from '../../services/api';
import { soundFx } from '../../services/soundFxService';

interface LiveIntelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveIntelModal: React.FC<LiveIntelModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'weather' | 'markets' | 'news'>('weather');
  const [city, setCity] = useState('Dhaka');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadIntel = async () => {
    setLoading(true);
    try {
      if (activeTab === 'weather') {
        const w = await fetchLiveWeatherApi(city);
        setWeatherData(w);
      } else if (activeTab === 'markets') {
        const m = await fetchCryptoFxApi();
        setMarketData(m.rates);
      } else if (activeTab === 'news') {
        const n = await fetchTechNewsApi(8);
        setNewsData(n.stories || []);
      }
    } catch {
      // Fallback handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      soundFx.playClick();
      loadIntel();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleWeatherSearch = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    loadIntel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#090d16]/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-cyan-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
              <CloudSun className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                GLOBAL INTEL & RADAR
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  REAL-TIME FEEDS
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Live atmospheric conditions, cryptocurrency valuations, and trending headlines
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadIntel}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-3 bg-black/40 border-b border-cyan-500/10 flex items-center gap-3 text-xs font-mono">
          <button
            onClick={() => { setActiveTab('weather'); soundFx.playClick(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'weather'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" /> Atmospheric Weather
          </button>
          <button
            onClick={() => { setActiveTab('markets'); soundFx.playClick(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'markets'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Crypto & Forex Ticker
          </button>
          <button
            onClick={() => { setActiveTab('news'); soundFx.playClick(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'news'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" /> Tech Headlines
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* 1. WEATHER TAB */}
          {activeTab === 'weather' && (
            <div className="space-y-6">
              <form onSubmit={handleWeatherSearch} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Enter city (e.g. Dhaka, London, Tokyo)"
                    className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-xs font-mono outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-semibold transition-all"
                >
                  Lookup
                </button>
              </form>

              {weatherData && weatherData.success ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-2xl md:col-span-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-purple-300 font-mono uppercase tracking-wider">
                        {weatherData.location}
                      </div>
                      <div className="text-4xl font-black text-white mt-1">
                        {weatherData.temperature_c}°C
                      </div>
                      <div className="text-sm text-gray-300 mt-1 font-mono">
                        {weatherData.condition} (Feels like {weatherData.feels_like_c}°C)
                      </div>
                    </div>
                    <div className="text-5xl">🌦️</div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-[10px] text-gray-400 font-mono">HUMIDITY</div>
                        <div className="text-sm font-bold text-white font-mono">{weatherData.humidity}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                      <Wind className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="text-[10px] text-gray-400 font-mono">WIND SPEED</div>
                        <div className="text-sm font-bold text-white font-mono">{weatherData.wind_speed}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 font-mono text-xs">
                  {loading ? 'Fetching atmospheric telemetry...' : 'Enter a city name above to inspect live weather.'}
                </div>
              )}
            </div>
          )}

          {/* 2. MARKETS TAB */}
          {activeTab === 'markets' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase text-emerald-400 tracking-wider mb-3">
                  🔥 Cryptocurrency Real-Time Telemetry
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {marketData?.crypto && Object.entries(marketData.crypto).map(([sym, item]: [string, any]) => {
                    const isPositive = (item.change_24h || 0) >= 0;
                    return (
                      <div key={sym} className="p-4 bg-black/60 border border-emerald-500/30 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white font-mono">{sym} / USD</span>
                          <span className={`text-xs font-mono flex items-center ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {item.change_24h}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-white mt-2 font-mono">
                          ${item.usd?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-1">
                          ≈ ৳ {item.bdt?.toLocaleString()} BDT
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-3">
                  💱 Fiat Currency Exchange (USD Benchmark)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {marketData?.forex && Object.entries(marketData.forex).map(([pair, rate]: [string, any]) => (
                    <div key={pair} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="text-[10px] text-gray-400 font-mono">{pair.replace('_', ' / ')}</div>
                      <div className="text-base font-bold text-white font-mono mt-1">{rate}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. NEWS TAB */}
          {activeTab === 'news' && (
            <div className="space-y-3">
              {newsData.length > 0 ? (
                newsData.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 bg-black/60 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/40 rounded-xl transition-all group"
                  >
                    <div className="flex-1 pr-4">
                      <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        Source score: {item.score} pts • by {item.by}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  </a>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 font-mono text-xs">
                  {loading ? 'Retrieving news stream...' : 'No headlines available.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/50 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Real-time public live telemetry radar.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-all font-semibold"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
};
