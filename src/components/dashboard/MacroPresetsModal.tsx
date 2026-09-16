import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  X, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  HardDrive, 
  Moon, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { fetchMacrosApi, executeMacroApi } from '../../services/api';
import { soundFx } from '../../services/soundFxService';
import { logIntelligenceEvent } from '../../state/jarvisState';

interface MacroPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export const MacroPresetsModal: React.FC<MacroPresetsModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#00f0ff'
}) => {
  const [macros, setMacros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRunningId, setActiveRunningId] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadMacros();
    }
  }, [isOpen]);

  const loadMacros = async () => {
    setLoading(true);
    try {
      const res = await fetchMacrosApi();
      setMacros(res.macros || []);
    } catch (e) {
      console.warn('Load macros notice:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunMacro = async (macroId: string) => {
    setActiveRunningId(macroId);
    setExecutionResult(null);
    soundFx.playClick();
    logIntelligenceEvent('AGENT', `Executing Macro Workflow: ${macroId.toUpperCase()}`, 'warning');

    try {
      const res = await executeMacroApi(macroId);
      setExecutionResult(res);
      soundFx.playSuccess();
      logIntelligenceEvent('SYSTEM', `Macro Workflow '${macroId}' completed successfully`, 'success');
    } catch (err: any) {
      soundFx.playAlert();
      logIntelligenceEvent('SYSTEM', `Macro execution failed: ${err.message}`, 'error');
    } finally {
      setActiveRunningId(null);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'HardDrive': return <HardDrive className="w-5 h-5" />;
      case 'Shield': return <Shield className="w-5 h-5" />;
      case 'Moon': return <Moon className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="hud-modal-backdrop" onClick={onClose}>
      <div 
        className="hud-modal-container"
        style={{ maxWidth: '780px', width: '92vw', maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="hud-modal-header" style={{ borderColor: `${primaryColor}40` }}>
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}40` }}
            >
              <Zap className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wider font-display" style={{ color: primaryColor }}>
                // AUTONOMOUS MACRO WORKFLOWS //
              </h2>
              <p className="text-xs font-mono text-slate-400">
                1-CLICK MULTI-STEP SYSTEM & ENVIRONMENT PRESETS
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="hud-modal-body overflow-y-auto p-4 space-y-4 font-mono text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {macros.map((m) => {
              const isRunning = activeRunningId === m.id;
              const cardColor = m.color || primaryColor;

              return (
                <div
                  key={m.id}
                  className="p-4 rounded border flex flex-col justify-between transition-all"
                  style={{
                    backgroundColor: 'rgba(6, 18, 36, 0.75)',
                    borderColor: isRunning ? cardColor : `${cardColor}30`,
                    boxShadow: isRunning ? `0 0 16px ${cardColor}40` : 'none'
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="p-2.5 rounded shrink-0"
                      style={{ backgroundColor: `${cardColor}20`, color: cardColor }}
                    >
                      {getIcon(m.icon)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-display tracking-wider text-white">
                        {m.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunMacro(m.id)}
                    disabled={activeRunningId !== null}
                    className="w-full py-2 px-3 rounded text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all"
                    style={{
                      backgroundColor: isRunning ? `${cardColor}40` : cardColor,
                      color: '#020617',
                      opacity: activeRunningId !== null && !isRunning ? 0.4 : 1
                    }}
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        EXECUTING WORKFLOW...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        ENGAGE MACRO
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Execution Result Log */}
          {executionResult && (
            <div 
              className="p-4 rounded border mt-4"
              style={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', borderColor: `${primaryColor}40` }}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>WORKFLOW EXECUTION REPORT // {executionResult.macro_id?.toUpperCase()}</span>
              </div>
              <p className="text-xs text-slate-200 mb-3">
                {executionResult.summary}
              </p>

              <div className="space-y-2">
                {executionResult.steps?.map((step: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/70 p-2 rounded border border-slate-800 text-xs flex items-start gap-2">
                    <span className="text-cyan-400 font-mono text-[10px]">[{idx+1}]</span>
                    <div>
                      <strong className="text-slate-300">{step.step}:</strong>
                      <span className="text-slate-400 ml-1.5">{step.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
