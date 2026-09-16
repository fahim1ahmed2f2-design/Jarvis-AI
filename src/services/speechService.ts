import { VoiceSettings, loadVoiceSettings, saveVoiceSettings } from './voiceSettings';
import { jarvisTTSService } from './ttsService';
import { realtimeAudioAnalyzer } from './audioAnalyzer';

export type ListenerStatus = 'STARTING' | 'READY' | 'LISTENING' | 'STOPPED' | 'ERROR';
export type SttStatus = 'READY' | 'LISTENING' | 'PROCESSING' | 'ERROR';
export type VoiceSystemStatus = 'IDLE' | 'WAKE_LISTENING' | 'ACTIVE_LISTENING' | 'PROCESSING' | 'ERROR';

export interface SpeechServiceCallbacks {
  onStatusChange?: (status: VoiceSystemStatus) => void;
  onWakeWordDetected?: (word: string) => void;
  onCommandRecognized?: (command: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  onAudioLevel?: (frequencies: number[], volume: number) => void;
  onError?: (errorMessage: string) => void;
  onStateFeedback?: () => void;
  onAckRequested?: (phrase: string) => void;
}

// ── Multi-Language Wake Word Matching Helper ────────────────────────────────────

export interface WakeMatchResult {
  isMatch: boolean;
  matchedPhrase: string;
  remainder: string;
}

export function matchWakePhrase(transcript: string, configuredWakeWord: string = 'Hello Jarvis'): WakeMatchResult {
  const cleanInput = transcript.trim();
  if (!cleanInput) return { isMatch: false, matchedPhrase: '', remainder: '' };

  const basePatterns: string[] = [
    'hello\\s+jarvis',
    'hey\\s+jarvis',
    'hi\\s+jarvis',
    'ok\\s+jarvis',
    'okay\\s+jarvis',
    'jarvis',
    'hello\\s+jarvice',
    'hey\\s+jarvice',
    'hi\\s+jarvice',
    'jarvice',
    'hello\\s+jervis',
    'hey\\s+jervis',
    'jervis',
    'hello\\s+service',
    'hey\\s+service',
    'hello\\s+travis',
    'hey\\s+travis',
    'হ্যালো\\s+জারভিস',
    'হে\\s+জারভিস',
    'হাই\\s+জারভিস',
    'ওকে\\s+জারভিস',
    'শোনো\\s+জারভিস',
    'এই\\s+জারভিস',
    'জারভিস',
    'জার্ভিস',
    'জারভীস',
    'shono\\s+jarvis',
    'shuno\\s+jarvis',
    'ei\\s+jarvis',
    'bolo\\s+jarvis',
    'oye\\s+jarvis'
  ];

  if (configuredWakeWord && configuredWakeWord.trim()) {
    const escaped = configuredWakeWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = escaped.replace(/\s+/g, '\\s+');
    if (!basePatterns.includes(pattern.toLowerCase())) {
      basePatterns.unshift(pattern);
    }
  }

  for (const pat of basePatterns) {
    const regex = new RegExp(`^${pat}(?:\\s+|$|[.,?!;:\\s]+(.*))`, 'i');
    const match = cleanInput.match(regex);
    if (match) {
      const matchedPhrase = cleanInput.slice(0, match[0].length - (match[1] ? match[1].length : 0)).replace(/[\s,.:;!?-]+$/, '').trim();
      const remainder = (match[1] || '').replace(/^[\s,.:;!?-]+/, '').trim();
      return {
        isMatch: true,
        matchedPhrase,
        remainder
      };
    }
  }

  return { isMatch: false, matchedPhrase: '', remainder: '' };
}

export function cleanLeadingWakeWord(transcript: string, configuredWakeWord: string = 'Hello Jarvis'): string {
  const match = matchWakePhrase(transcript, configuredWakeWord);
  if (match.isMatch && match.remainder) {
    return match.remainder;
  }
  return transcript
    .replace(/^(?:hello|hey|hi|ok|okay|yo|dear|shono|shuno|oye|ei|bolo|হ্যালো|হে|এই|শোনো|ওহে)?[\s,]*(?:jarvis|jarvice|jervis|jarves|jarviz|javis|জারভিস|জার্ভিস|জারভীস)[\s,.:;!?-]*/i, '')
    .replace(/^(?:please|kindly|দয়া করে|একটু|বলো তো|বলুন তো)[\s,.:;!?-]*/i, '')
    .trim();
}

function playFuturisticWakeChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 450);
  } catch {}
}

// ── Main Speech Service (Hardware Exclusive, Barge-In & Continuous Voice) ──────

export class JarvisSpeechService {
  private recognition: any = null;
  private isRunning = false;
  private isCommandListening = false;
  private isTTSPlaying = false;
  private ttsWatchdogTimer: any = null;
  private conversationalFollowupTimer: any = null;
  private heartbeatTimer: any = null;
  private callbacks: SpeechServiceCallbacks = {};
  private settings: VoiceSettings = loadVoiceSettings();

  // Utterance state
  private pendingFinalTranscript = '';
  private isStarting = false;
  private isStartingTimestamp = 0;
  private restartTimer: any = null;
  private silenceTimer: any = null;
  private lastCapturedTranscript = '';

  // Status metrics
  private micStatus: 'CONNECTED' | 'DISCONNECTED' = 'CONNECTED';
  private listenerStatus: ListenerStatus = 'STOPPED';
  private sttStatus: SttStatus = 'READY';
  private lastError: string | null = null;

  constructor() {
    this.setupInteractionRecovery();
    if (typeof window !== 'undefined') {
      (window as any).jarvisSpeechService = this;
    }
  }

  // ── Status Getters ──────────────────────────────────────────────────────────

  public getMicStatus(): 'CONNECTED' | 'DISCONNECTED' {
    return this.micStatus;
  }

  public getListenerStatus(): ListenerStatus {
    return this.listenerStatus;
  }

  public getSttStatus(): SttStatus {
    return this.sttStatus;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public isListeningNow(): boolean {
    return this.isCommandListening;
  }

  // ── Initialization ───────────────────────────────────────────────────────────

  private createFreshRecognition(): any {
    if (typeof window === 'undefined') return null;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('[VOICE] Web SpeechRecognition API is not supported in this browser');
      this.sttStatus = 'ERROR';
      this.lastError = 'Browser does not support SpeechRecognition. Use Chrome or Edge.';
      this.callbacks.onError?.(this.lastError);
      return null;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = this.resolveRecognitionLang();
      rec.maxAlternatives = 1;

      rec.onstart = this.handleRecognitionStart.bind(this);
      rec.onresult = this.handleRecognitionResult.bind(this);
      rec.onerror = this.handleRecognitionError.bind(this);
      rec.onend = this.handleRecognitionEnd.bind(this);

      return rec;
    } catch (e: any) {
      console.warn('[VOICE] Error creating SpeechRecognition:', e);
      this.lastError = e?.message || 'Speech init failed';
      return null;
    }
  }

  private resolveRecognitionLang(): string {
    if (this.settings.speechLanguage && this.settings.speechLanguage !== 'auto') {
      return this.settings.speechLanguage;
    }
    // Auto mode default: English + Bengali phonetic compatibility
    return 'en-US';
  }

  public setLanguage(lang: string) {
    this.settings.speechLanguage = lang;
    saveVoiceSettings(this.settings);
    this.restartListening();
    this.callbacks.onStateFeedback?.();
  }

  public getLanguage(): string {
    return this.resolveRecognitionLang();
  }

  private setupInteractionRecovery() {
    if (typeof window === 'undefined') return;

    const onWakeActivity = () => {
      jarvisTTSService.unlockAudio();
      if (this.isRunning && !this.recognition && !this.isStarting) {
        console.log('[VOICE] Window active / interaction — ensuring recognition is running');
        this.startSession();
      }
    };

    window.addEventListener('click', onWakeActivity, { passive: true });
    window.addEventListener('keydown', onWakeActivity, { passive: true });
    window.addEventListener('touchstart', onWakeActivity, { passive: true });
    window.addEventListener('focus', onWakeActivity, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        onWakeActivity();
      }
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  public setCallbacks(callbacks: SpeechServiceCallbacks) {
    this.callbacks = callbacks;
  }

  public updateSettings(newSettings: VoiceSettings) {
    this.settings = { ...newSettings };
    saveVoiceSettings(this.settings);

    if (newSettings.wakeWordEnabled) {
      if (!this.isRunning) {
        this.start();
      }
    } else {
      this.stopListening();
    }
    this.callbacks.onStateFeedback?.();
  }

  public destroy() {
    this.stopAll();
  }

  /**
   * TTS playback notification.
   * Enables seamless Barge-In (Interruption) and continuous conversational follow-up!
   */
  public notifyTTSState(isPlaying: boolean) {
    this.isTTSPlaying = isPlaying;
    if (this.ttsWatchdogTimer) {
      clearTimeout(this.ttsWatchdogTimer);
      this.ttsWatchdogTimer = null;
    }
    if (this.conversationalFollowupTimer) {
      clearTimeout(this.conversationalFollowupTimer);
      this.conversationalFollowupTimer = null;
    }

    if (isPlaying) {
      console.log('[VOICE] TTS active — listening for voice barge-in');
      this.clearSilenceTimer();

      // Ensure recognition is active in background to catch voice interruption
      if (!this.recognition && this.isRunning && !this.isStarting) {
        this.startSession();
      }

      // Watchdog failsafe: Never allow TTS lock for > 20 seconds
      this.ttsWatchdogTimer = setTimeout(() => {
        if (this.isTTSPlaying) {
          console.warn('[VOICE] TTS watchdog triggered force unlock');
          this.isTTSPlaying = false;
          if (this.isRunning && !this.recognition) {
            this.startSession();
          }
        }
      }, 20000);
    } else {
      console.log('[VOICE] TTS finished — opening 7.5s conversational follow-up window');
      
      // Enter Continuous Follow-up Window
      this.isCommandListening = true;
      this.listenerStatus = 'LISTENING';
      this.sttStatus = 'LISTENING';
      this.callbacks.onStatusChange?.('ACTIVE_LISTENING');
      this.callbacks.onInterimTranscript?.('Listening... speak anytime');
      this.callbacks.onStateFeedback?.();

      if (!this.recognition && this.isRunning && !this.isStarting) {
        this.startSession();
      }

      // Auto-revert to wake standby after 7.5s if no follow-up voice is received
      this.conversationalFollowupTimer = setTimeout(() => {
        if (this.isRunning && this.isCommandListening && !this.isTTSPlaying) {
          console.log('[VOICE] Follow-up window elapsed — active in continuous wake standby');
          this.isCommandListening = false;
          this.listenerStatus = 'READY';
          this.sttStatus = 'READY';
          this.callbacks.onStatusChange?.('WAKE_LISTENING');
          this.callbacks.onInterimTranscript?.('');
          this.callbacks.onStateFeedback?.();

          // Ensure recognition session remains alive for the next wake word!
          if (!this.recognition && this.isRunning && !this.isStarting) {
            this.startSession();
          }
        }
      }, 7500);
    }
  }

  private initMicAudioStream() {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia && !realtimeAudioAnalyzer.isActive()) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        realtimeAudioAnalyzer.start(stream, this.settings.sensitivity || 75);
      }).catch((e) => {
        console.warn('[VOICE] Microphone stream analyzer notice:', e);
      });
    }
  }

  /**
   * Periodic Self-Healing Heartbeat
   * Continuously verifies recognition is healthy and immediately resurrects if killed by browser.
   */
  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (!this.isRunning) return;

      // 1. Recover stuck isStarting lock
      if (this.isStarting && Date.now() - this.isStartingTimestamp > 2500) {
        console.warn('[VOICE_WATCHDOG] isStarting lock timed out — resetting state');
        this.isStarting = false;
      }

      // 2. Resurrect recognition if browser dropped it
      if (!this.recognition && !this.isStarting && this.isRunning) {
        console.log('[VOICE_WATCHDOG] Speech recognition was dead — reviving session');
        this.startSession();
      }
    }, 1200);
  }

  /**
   * Starts speech engine with exclusive hardware access & 24/7 self-healing loop.
   */
  public async start(): Promise<boolean> {
    this.settings = loadVoiceSettings();
    this.isRunning = true;
    this.micStatus = 'CONNECTED';
    this.listenerStatus = 'READY';
    this.callbacks.onStatusChange?.('WAKE_LISTENING');
    this.callbacks.onStateFeedback?.();

    this.initMicAudioStream();
    this.startHeartbeat();

    console.log('[VOICE] Speech recognition engine active with self-healing heartbeat');
    this.startSession();
    return true;
  }

  /**
   * Manual listen trigger (mic button / TALK TO JARVIS).
   */
  public triggerManualListening() {
    console.log('[VOICE] Manual listen activated');
    jarvisTTSService.unlockAudio();
    this.initMicAudioStream();
    if (this.conversationalFollowupTimer) {
      clearTimeout(this.conversationalFollowupTimer);
      this.conversationalFollowupTimer = null;
    }
    this.isCommandListening = true;
    this.lastCapturedTranscript = '';
    this.pendingFinalTranscript = '';
    this.listenerStatus = 'LISTENING';
    this.sttStatus = 'LISTENING';
    this.callbacks.onStatusChange?.('ACTIVE_LISTENING');
    this.callbacks.onInterimTranscript?.('Listening... speak now');
    this.callbacks.onStateFeedback?.();

    this.restartListening();
  }

  public stopListening() {
    this.clearSilenceTimer();
    if (this.conversationalFollowupTimer) {
      clearTimeout(this.conversationalFollowupTimer);
      this.conversationalFollowupTimer = null;
    }
    this.isCommandListening = false;
    this.lastCapturedTranscript = '';
    this.pendingFinalTranscript = '';
    this.listenerStatus = this.isRunning ? 'READY' : 'STOPPED';
    this.sttStatus = 'READY';
    this.callbacks.onInterimTranscript?.('');
    this.callbacks.onStatusChange?.('WAKE_LISTENING');
    this.callbacks.onStateFeedback?.();
  }

  public stopAll() {
    this.clearSilenceTimer();
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.ttsWatchdogTimer) {
      clearTimeout(this.ttsWatchdogTimer);
      this.ttsWatchdogTimer = null;
    }
    if (this.conversationalFollowupTimer) {
      clearTimeout(this.conversationalFollowupTimer);
      this.conversationalFollowupTimer = null;
    }

    this.isRunning = false;
    this.isStarting = false;
    this.isCommandListening = false;
    this.isTTSPlaying = false;
    this.listenerStatus = 'STOPPED';
    this.sttStatus = 'READY';

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    this.callbacks.onInterimTranscript?.('');
    this.callbacks.onStatusChange?.('IDLE');
    this.callbacks.onStateFeedback?.();
  }

  // ── Internal — Session Management ──────────────────────────────────────────

  private startSession() {
    if (!this.isRunning || this.isStarting) return;

    try {
      if (this.recognition) {
        try {
          this.recognition.onstart = null;
          this.recognition.onresult = null;
          this.recognition.onerror = null;
          this.recognition.onend = null;
          this.recognition.abort();
        } catch {}
        this.recognition = null;
      }

      this.recognition = this.createFreshRecognition();
      if (!this.recognition) {
        this.isStarting = false;
        return;
      }

      this.isStarting = true;
      this.isStartingTimestamp = Date.now();
      this.recognition.start();
      console.log('[VOICE] STT session active, language:', this.recognition.lang);
    } catch (e: any) {
      this.isStarting = false;
      const msg = e?.message || '';
      console.warn('[VOICE] Recognition start caught exception:', msg);
      this.scheduleRestart(250);
    }
  }

  private restartListening() {
    try {
      if (this.recognition) {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
        this.recognition = null;
      }
    } catch {}
    this.isStarting = false;
    setTimeout(() => this.startSession(), 60);
  }

  private scheduleRestart(delayMs = 80) {
    if (!this.isRunning) return;
    if (this.restartTimer) clearTimeout(this.restartTimer);

    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.isRunning) {
        this.startSession();
      }
    }, delayMs);
  }

  // ── Internal — Recognition Event Handlers ────────────────────────────────────

  private handleRecognitionStart() {
    this.isStarting = false;
    this.micStatus = 'CONNECTED';
    this.sttStatus = this.isCommandListening ? 'LISTENING' : 'READY';
    this.lastError = null;
    this.callbacks.onStateFeedback?.();
    console.log(`[VOICE] Microphone listening (${this.isCommandListening ? 'COMMAND' : 'STANDBY_WAKE'})`);
  }

  private handleRecognitionResult(event: any) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      const isFinal = result.isFinal;

      if (!transcript) continue;

      console.log(`[VOICE_HEARD] "${transcript}" (final: ${isFinal}, TTS playing: ${this.isTTSPlaying})`);

      // ── BARGE-IN / INTERRUPTION HANDLING ──────────────────────────────────
      // If user speaks while JARVIS is talking, instantly halt TTS!
      if (this.isTTSPlaying) {
        console.log('[VOICE_BARGE_IN] User spoke during TTS — halting speech immediately');
        jarvisTTSService.stop();
        this.isTTSPlaying = false;
        this.isCommandListening = true;
        this.listenerStatus = 'LISTENING';
        this.callbacks.onStatusChange?.('ACTIVE_LISTENING');

        // Check if user just wanted JARVIS to stop
        const lower = transcript.toLowerCase();
        if (['stop', 'stop jarvis', 'wait', 'quiet', 'shut up', 'pause', 'থামো', 'চুপ', 'থামো জারভিস'].includes(lower)) {
          this.callbacks.onInterimTranscript?.('Halted.');
          setTimeout(() => this.callbacks.onInterimTranscript?.(''), 1500);
          return;
        }
      }

      // Reset conversational follow-up timer on active user speech
      if (this.conversationalFollowupTimer) {
        clearTimeout(this.conversationalFollowupTimer);
        this.conversationalFollowupTimer = null;
      }

      // 1. Immediately update the live HUD badge so user sees their words in real-time!
      this.lastCapturedTranscript = transcript;
      this.callbacks.onInterimTranscript?.(transcript);

      // Clean leading wake phrase if present
      const cleaned = cleanLeadingWakeWord(transcript, this.settings.wakeWord);
      const commandToRun = cleaned.length > 0 ? cleaned : transcript;

      if (isFinal) {
        this.pendingFinalTranscript = commandToRun;
        this.dispatchRecognizedCommand(commandToRun);
        return;
      } else {
        // Reset silence timer on interim speech (low-latency 480ms)
        this.resetSilenceTimer(commandToRun);
      }
    }
  }

  private dispatchRecognizedCommand(cmdText: string) {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    this.clearSilenceTimer();
    if (this.conversationalFollowupTimer) {
      clearTimeout(this.conversationalFollowupTimer);
      this.conversationalFollowupTimer = null;
    }

    console.log(`[VOICE_DISPATCH] Directive recognized: "${trimmed}"`);

    // Clean up current transcript buffers
    this.lastCapturedTranscript = '';
    this.pendingFinalTranscript = '';
    this.callbacks.onInterimTranscript?.('');

    // Check if it's purely a wake word (e.g. "hello jarvis", "jarvis", "শোনো জারভিস")
    const match = matchWakePhrase(trimmed, this.settings.wakeWord);
    if (match.isMatch && !match.remainder) {
      console.log(`[VOICE] Pure wake word validated: "${match.matchedPhrase}"`);
      playFuturisticWakeChime();
      this.callbacks.onWakeWordDetected?.(match.matchedPhrase);
      this.triggerManualListening();
      if (this.settings.wakeWordAck) {
        const isBn = /[\u0980-\u09FF]/.test(match.matchedPhrase) || ['shono', 'shuno', 'ei', 'bolo'].some(b => match.matchedPhrase.toLowerCase().includes(b));
        this.callbacks.onAckRequested?.(isBn ? 'হ্যাঁ স্যার, বলুন শুনছি' : 'Yes, Sir?');
      }
      return;
    }

    // Direct command execution!
    this.isCommandListening = false;
    this.callbacks.onCommandRecognized?.(trimmed);
  }

  private handleRecognitionError(event: any) {
    this.isStarting = false;
    const err = event?.error;

    if (err === 'no-speech' || err === 'aborted') {
      // Normal pause in room or expected restart — quietly schedule fast restart
      if (this.isRunning) {
        this.scheduleRestart(60);
      }
      return;
    }

    if (err === 'not-allowed') {
      this.micStatus = 'DISCONNECTED';
      this.sttStatus = 'ERROR';
      this.lastError = 'Microphone permission blocked. Please click the mic icon in your address bar and allow.';
      this.callbacks.onError?.(this.lastError);
      this.callbacks.onInterimTranscript?.('⚠️ Microphone permission blocked in browser');
      this.callbacks.onStatusChange?.('ERROR');
      this.callbacks.onStateFeedback?.();
      return;
    }

    if (err === 'network') {
      this.lastError = 'Network notice on speech service.';
      console.warn('[VOICE] Speech service network notice — recovering in 1s');
      if (this.isRunning) {
        this.scheduleRestart(1000);
      }
      return;
    }

    console.warn(`[VOICE] Recognition notice: ${err}`);
    if (this.isRunning) {
      this.scheduleRestart(250);
    }
  }

  private handleRecognitionEnd() {
    this.isStarting = false;
    this.recognition = null;

    // If we had a pending transcript when Chrome ended the utterance, dispatch it!
    if (this.pendingFinalTranscript) {
      const text = this.pendingFinalTranscript;
      this.pendingFinalTranscript = '';
      this.dispatchRecognizedCommand(text);
    }

    // ALWAYS ensure continuous restart if running — never let recognition stay dead!
    if (this.isRunning) {
      this.scheduleRestart(60);
    }
  }

  // ── Internal — Timers ────────────────────────────────────────────────────────

  private resetSilenceTimer(interimText: string) {
    this.clearSilenceTimer();
    if (!this.isRunning) return;

    // Ultra low-latency silence timer (480ms) for snappy, near-instant command dispatch
    const delay = this.isCommandListening ? 480 : 720;
    this.silenceTimer = setTimeout(() => {
      if (interimText && !this.isTTSPlaying) {
        console.log(`[VOICE] Low-latency silence timeout finalized: "${interimText}"`);
        this.dispatchRecognizedCommand(interimText);
      }
    }, delay);
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

export const jarvisSpeechService = new JarvisSpeechService();
