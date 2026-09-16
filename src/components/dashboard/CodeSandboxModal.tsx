import React, { useState } from 'react';
import { Terminal, Play, RotateCcw, Copy, Check, X, Clock, Code2 } from 'lucide-react';
import { runCodeApi } from '../../services/api';
import { soundFx } from '../../services/soundFxService';

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SNIPPETS: Record<string, { py: string; js: string }> = {
  math: {
    py: `# Advanced Math & Statistics\nimport math\n\ndef primes_up_to(n):\n    primes = []\n    for num in range(2, n + 1):\n        if all(num % i != 0 for i in range(2, int(math.isqrt(num)) + 1)):\n            primes.append(num)\n    return primes\n\nprint(f"Primes up to 100: {primes_up_to(100)}")\nprint(f"Pi approximation: {math.pi:.6f}")`,
    js: `// Fast Array Operations\nconst numbers = Array.from({length: 10}, (_, i) => (i + 1) * 3);\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconsole.log({ numbers, sum, average: sum / numbers.length });`
  },
  system: {
    py: `# Inspect Hardware & System Specs\nimport platform, psutil\n\nprint(f"Operating System: {platform.system()} {platform.release()}")\nprint(f"CPU Physical Cores: {psutil.cpu_count(logical=False)}")\nprint(f"CPU Total Logical: {psutil.cpu_count(logical=True)}")\nprint(f"RAM Total: {round(psutil.virtual_memory().total / (1024**3), 2)} GB")`,
    js: `// High Precision Timer\nconst start = process.hrtime.bigint();\nfor(let i = 0; i < 1000000; i++) Math.sqrt(i);\nconst end = process.hrtime.bigint();\nconsole.log(\`Execution time: \${Number(end - start) / 1e6} ms\`);`
  }
};

export const CodeSandboxModal: React.FC<CodeSandboxModalProps> = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState<'python' | 'javascript'>('python');
  const [code, setCode] = useState<string>(PRESET_SNIPPETS.math.py);
  const [output, setOutput] = useState<string>('Console ready. Press "Run Code" (or Ctrl+Enter) to execute.');
  const [running, setRunning] = useState<boolean>(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!code.trim() || running) return;
    setRunning(true);
    soundFx.playAlert();
    setOutput('Executing in isolated sandbox...');

    try {
      const res = await runCodeApi(code, language, 10);
      setExecTime(res.duration_ms);
      if (res.success) {
        soundFx.playSuccess();
        setOutput(res.stdout || '[Program executed with code 0 (No stdout)]');
      } else {
        setOutput(`Error (Exit Code ${res.returncode}):\n${res.stderr || 'Execution failed.'}`);
      }
    } catch (err: any) {
      setOutput(`API Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadPreset = (key: 'math' | 'system') => {
    setCode(language === 'python' ? PRESET_SNIPPETS[key].py : PRESET_SNIPPETS[key].js);
    soundFx.playClick();
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
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                DEVELOPER SANDBOX & REPL
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ISOLATED RUNTIME
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Execute algorithmic logic, scripts, and automation routines on the host
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-black/40 border-b border-cyan-500/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Runtime:</span>
            <button
              onClick={() => {
                setLanguage('python');
                setCode(PRESET_SNIPPETS.math.py);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                language === 'python'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              🐍 Python 3
            </button>
            <button
              onClick={() => {
                setLanguage('javascript');
                setCode(PRESET_SNIPPETS.math.js);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                language === 'javascript'
                  ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              ⚡ JavaScript / Node
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Presets:</span>
            <button
              onClick={() => loadPreset('math')}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-cyan-300"
            >
              Math Algorithm
            </button>
            <button
              onClick={() => loadPreset('system')}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-cyan-300"
            >
              System Telemetry
            </button>
          </div>
        </div>

        {/* Code Editor & Console Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-cyan-500/20 overflow-hidden min-h-[340px]">
          {/* Editor Column */}
          <div className="flex flex-col p-4 bg-[#05070d]">
            <div className="flex items-center justify-between mb-2 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Code2 className="w-3.5 h-3.5" /> Code Editor ({language.toUpperCase()})
              </span>
              <span>Press Ctrl+Enter to Run</span>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleRun();
                }
              }}
              className="flex-1 w-full p-3 bg-black/60 border border-white/10 rounded-xl text-green-400 font-mono text-xs leading-relaxed outline-none resize-none focus:border-cyan-500/50 custom-scrollbar"
              spellCheck={false}
              placeholder="Write your code here..."
            />
          </div>

          {/* Console Column */}
          <div className="flex flex-col p-4 bg-[#03050a]">
            <div className="flex items-center justify-between mb-2 text-xs font-mono text-gray-400">
              <span className="text-amber-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Output Stream
              </span>
              <div className="flex items-center gap-3">
                {execTime !== null && (
                  <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {execTime} ms
                  </span>
                )}
                <button
                  onClick={handleCopyOutput}
                  className="hover:text-white transition-colors"
                  title="Copy console output"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <pre className="flex-1 w-full p-3 bg-black/80 border border-white/10 rounded-xl text-cyan-200 font-mono text-xs overflow-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
              {output}
            </pre>
          </div>
        </div>

        {/* Footer with Run Button */}
        <div className="px-6 py-4 bg-black/50 border-t border-cyan-500/20 flex items-center justify-between">
          <button
            onClick={() => setCode('')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-mono transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Editor
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold font-mono text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className={`w-4 h-4 fill-current ${running ? 'animate-pulse' : ''}`} />
              {running ? 'Executing...' : 'Run Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
