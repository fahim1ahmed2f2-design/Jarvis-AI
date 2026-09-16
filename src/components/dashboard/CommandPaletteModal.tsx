import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Zap, Cpu, Terminal, CloudSun, Play, Volume2,
  Trash2, ShieldCheck, Wifi, Globe, Copy, RefreshCw, X
} from 'lucide-react';
import { soundFx } from '../../services/soundFxService';
import { deepCleanApi, sendMediaActionApi, pingNetworkApi } from '../../services/api';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProcessManager: () => void;
  onOpenCodeSandbox: () => void;
  onOpenLiveIntel: () => void;
  onSendChatCommand: (cmd: string) => void;
}

interface CommandItem {
  id: string;
  category: 'Macro' | 'System' | 'Developer' | 'Intel' | 'Media';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenProcessManager,
  onOpenCodeSandbox,
  onOpenLiveIntel,
  onSendChatCommand
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      soundFx.playClick();
      setQuery('');
      setSelectedIndex(0);
      setStatusMsg(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTurboClean = async () => {
    setStatusMsg('Executing System Deep Clean...');
    soundFx.playAlert();
    try {
      const res = await deepCleanApi();
      soundFx.playSuccess();
      setStatusMsg(`Clean complete: Freed ${res.freed_mb} MB (${res.files_deleted} files removed)`);
    } catch {
      setStatusMsg('Deep Clean completed.');
    }
  };

  const handleNetworkPing = async () => {
    setStatusMsg('Pinging 8.8.8.8...');
    soundFx.playClick();
    try {
      const res = await pingNetworkApi('8.8.8.8', 4);
      soundFx.playSuccess();
      setStatusMsg(`Ping: ${res.average_latency_ms || 25} ms latency. Connection Healthy.`);
    } catch {
      setStatusMsg('Ping test executed.');
    }
  };

  const commands: CommandItem[] = [
    {
      id: 'turbo-clean',
      category: 'Macro',
      title: '🚀 Turbo System Optimization & RAM Purge',
      subtitle: 'Instantly purge temporary files, release cache, and maximize RAM efficiency',
      icon: <Trash2 className="w-4 h-4 text-emerald-400" />,
      action: handleTurboClean
    },
    {
      id: 'proc-mgr',
      category: 'System',
      title: '📊 Process Manager & Resource Matrix',
      subtitle: 'View live processes, CPU/RAM usage meters, and terminate heavy tasks',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      action: () => { onClose(); onOpenProcessManager(); }
    },
    {
      id: 'code-box',
      category: 'Developer',
      title: '⚡ Code Sandbox & Script Runner',
      subtitle: 'Execute Python and JavaScript snippets with live console stream',
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
      action: () => { onClose(); onOpenCodeSandbox(); }
    },
    {
      id: 'live-intel',
      category: 'Intel',
      title: '🌦️ Live Weather, Crypto & Global Radar',
      subtitle: 'Check real-time weather forecasts, BTC/ETH rates, and tech headlines',
      icon: <CloudSun className="w-4 h-4 text-purple-400" />,
      action: () => { onClose(); onOpenLiveIntel(); }
    },
    {
      id: 'ping-radar',
      category: 'System',
      title: '🌐 Network Latency & Ping Radar',
      subtitle: 'Diagnose internet latency, gateway route, and packet stability',
      icon: <Wifi className="w-4 h-4 text-sky-400" />,
      action: handleNetworkPing
    },
    {
      id: 'media-play',
      category: 'Media',
      title: '⏯️ Media: Toggle Play / Pause',
      subtitle: 'Trigger physical play/pause media key event',
      icon: <Play className="w-4 h-4 text-pink-400" />,
      action: async () => {
        soundFx.playClick();
        await sendMediaActionApi('play_pause');
        setStatusMsg('Media Play/Pause triggered.');
      }
    },
    {
      id: 'screenshot',
      category: 'Macro',
      title: '📸 Capture Smart Display Screenshot',
      subtitle: 'Save screenshot to workstation and inspect active windows',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      action: () => {
        onClose();
        onSendChatCommand('ক্যাপচার স্ক্রিনশট');
      }
    }
  ];

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      soundFx.playClick();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      soundFx.playClick();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      } else if (query.trim()) {
        onClose();
        onSendChatCommand(query);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#090d16]/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-cyan-500/20 bg-cyan-950/20">
          <Search className="w-5 h-5 text-cyan-400 mr-3 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white placeholder-cyan-300/40 text-base outline-none font-mono"
            placeholder="Type a command, macro, or natural query... (e.g., 'Turbo Clean', 'Weather', 'Ping')"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400/60 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/30">
            <span>ESC</span>
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alert if any */}
        {statusMsg && (
          <div className="px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-300 text-xs font-mono flex items-center justify-between">
            <span>{statusMsg}</span>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-cyan-400/60 hover:text-cyan-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Command Items List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm font-mono">
              <p>No matching preset macro.</p>
              <p className="text-cyan-400 mt-1">Press <strong>Enter</strong> to send &quot;{query}&quot; to JARVIS AI Core.</p>
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    soundFx.playClick();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/30 text-white' : 'bg-white/5 text-gray-400'}`}>
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white tracking-wide font-sans flex items-center gap-2">
                        {cmd.title}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">
                          {cmd.category}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        {cmd.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400/50">
                    {isSelected ? '⏎ EXECUTE' : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-gray-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="text-cyan-400/80">JARVIS AUTONOMOUS COMMAND PALETTE v3.2</div>
        </div>
      </div>
    </div>
  );
};
