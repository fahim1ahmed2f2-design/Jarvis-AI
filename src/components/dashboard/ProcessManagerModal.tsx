import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, X, AlertTriangle, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fetchTopProcessesApi, killProcessApi, deepCleanApi } from '../../services/api';
import { soundFx } from '../../services/soundFxService';

interface ProcessItem {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_mb: number;
  memory_percent: number;
  status: string;
}

interface ProcessManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProcessManagerModal: React.FC<ProcessManagerModalProps> = ({ isOpen, onClose }) => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [sortBy, setSortBy] = useState<'memory' | 'cpu'>('memory');
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const loadProcesses = async () => {
    setLoading(true);
    try {
      const res = await fetchTopProcessesApi(20, sortBy);
      if (res.processes) {
        setProcesses(res.processes);
      }
    } catch {
      setActionMsg({ type: 'error', text: 'Failed to fetch process table.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      soundFx.playClick();
      loadProcesses();
      setActionMsg(null);
    }
  }, [isOpen, sortBy]);

  if (!isOpen) return null;

  const handleKill = async (pid: number, name: string) => {
    if (!confirm(`Are you sure you want to terminate '${name}' (PID: ${pid})?`)) return;
    soundFx.playAlert();
    try {
      const res = await killProcessApi({ pid });
      if (res.success) {
        soundFx.playSuccess();
        setActionMsg({ type: 'success', text: `Terminated '${name}' (PID: ${pid}) successfully.` });
        loadProcesses();
      } else {
        setActionMsg({ type: 'error', text: res.error || 'Failed to terminate process.' });
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Error killing process.' });
    }
  };

  const handleDeepClean = async () => {
    setCleaning(true);
    soundFx.playAlert();
    try {
      const res = await deepCleanApi();
      soundFx.playSuccess();
      setActionMsg({ type: 'success', text: `Cleaned ${res.files_deleted} temp files, freed ${res.freed_mb} MB!` });
      loadProcesses();
    } catch {
      setActionMsg({ type: 'error', text: 'Deep clean failed.' });
    } finally {
      setCleaning(false);
    }
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
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                PROCESS & RESOURCE MATRIX
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LIVE TELEMETRY
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Inspect active Windows processes, RAM allocation, and CPU execution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeepClean}
              disabled={cleaning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-mono transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {cleaning ? 'Cleaning...' : 'Turbo Clean'}
            </button>
            <button
              onClick={loadProcesses}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 transition-colors"
              title="Refresh processes"
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

        {/* Action feedback message */}
        {actionMsg && (
          <div className={`px-6 py-2.5 text-xs font-mono flex items-center gap-2 border-b ${
            actionMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}>
            {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{actionMsg.text}</span>
          </div>
        )}

        {/* Sort Controls */}
        <div className="px-6 py-3 bg-black/40 border-b border-cyan-500/10 flex items-center justify-between text-xs font-mono">
          <span className="text-gray-400">Total Active Tracked: <strong className="text-white">{processes.length}</strong></span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Sort By:</span>
            <button
              onClick={() => setSortBy('memory')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                sortBy === 'memory'
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Memory Usage (MB)
            </button>
            <button
              onClick={() => setSortBy('cpu')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                sortBy === 'cpu'
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              CPU Usage (%)
            </button>
          </div>
        </div>

        {/* Table of processes */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Process Name</th>
                <th className="py-2.5 px-3">PID</th>
                <th className="py-2.5 px-3">CPU %</th>
                <th className="py-2.5 px-3">RAM (MB)</th>
                <th className="py-2.5 px-3">Memory Bar</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processes.map(proc => {
                const isHeavy = proc.memory_mb > 500 || proc.cpu_percent > 20;
                return (
                  <tr
                    key={proc.pid}
                    className={`hover:bg-cyan-500/10 transition-colors ${
                      isHeavy ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-white font-semibold flex items-center gap-2">
                      {isHeavy && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      <span className="truncate max-w-[200px]" title={proc.name}>
                        {proc.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300/80">{proc.pid}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded ${proc.cpu_percent > 15 ? 'bg-red-500/20 text-red-300' : 'text-gray-300'}`}>
                        {proc.cpu_percent}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white font-bold">{proc.memory_mb} MB</td>
                    <td className="py-2.5 px-3 w-36">
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(proc.memory_percent * 4, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleKill(proc.pid, proc.name)}
                        className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-colors text-[11px]"
                      >
                        End Task
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/50 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Protected core system processes are automatically shielded.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-all font-semibold"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
