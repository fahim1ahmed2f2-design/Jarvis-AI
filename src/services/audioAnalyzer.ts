/**
 * Real-Time Unified Acoustic Analyzer & Physics Bridge
 * 
 * Captures both:
 * 1. Microphone input stream (user speaking: "kichu bolle")
 * 2. TTS & playback audio stream (JARVIS speaking: "kichu sunle")
 * 
 * Computes:
 * - 32-band speech-weighted frequency spectrum (80 Hz - 8,000 Hz)
 * - 160-point real-time time-domain audio waveform for holographic oscilloscope
 * - True RMS acoustic pressure & explosive plosive attack velocity (d(Volume)/dt)
 * - Tri-band physical energy decomposition (Deep Bass resonance, Vowel formants, High sibilants)
 */

export interface AcousticPhysicsData {
  frequencies: number[];
  waveform: Float32Array;
  volume: number;
  attack: number;
  bass: number;
  mid: number;
  high: number;
  isActive: boolean;
}

const WAVEFORM_POINTS = 160;

class RealtimeAudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private lastAudioLogTime: number = 0;

  // Microphone stream data
  private micFrequencies: number[] = new Array(32).fill(0);
  private micWaveform: Float32Array = new Float32Array(WAVEFORM_POINTS);
  private micVolume: number = 0;
  private isMicActive: boolean = false;

  // Raw analysis buffers
  private rawFreqArray: Uint8Array<ArrayBuffer> | null = null;
  private rawTimeArray: Uint8Array<ArrayBuffer> | null = null;

  // Playback / TTS stream data
  private playbackFrequencies: number[] = new Array(32).fill(0);
  private playbackWaveform: Float32Array = new Float32Array(WAVEFORM_POINTS);
  private playbackVolume: number = 0;
  private isPlaybackActive: boolean = false;
  private playbackTimeoutId: any = null;

  // Unified dynamic acoustic state
  private unifiedFrequencies: number[] = new Array(32).fill(0);
  private unifiedWaveform: Float32Array = new Float32Array(WAVEFORM_POINTS);
  private previousVolume: number = 0;
  private instantAttack: number = 0;
  private lastUpdateTime: number = performance.now();

  // Speech band filter frequencies (32 logarithmically spaced bands between 80Hz and 8200Hz)
  private bandBinIndices: [number, number][] = [];

  constructor() {
    this.initSpeechFilterBands(48000, 512);
  }

  private initSpeechFilterBands(sampleRate: number, fftSize: number) {
    const binWidth = sampleRate / fftSize;
    const minFreq = 80;
    const maxFreq = 8200;
    const bands = 32;
    this.bandBinIndices = [];

    for (let i = 0; i < bands; i++) {
      const fLow = minFreq * Math.pow(maxFreq / minFreq, i / bands);
      const fHigh = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / bands);

      const binStart = Math.max(1, Math.floor(fLow / binWidth));
      const binEnd = Math.max(binStart + 1, Math.min(fftSize / 2, Math.ceil(fHigh / binWidth)));
      this.bandBinIndices.push([binStart, binEnd]);
    }
  }

  /**
   * Connects to a microphone MediaStream and starts analyzing frequency and amplitude.
   */
  public start(
    stream: MediaStream,
    sensitivity: number = 75,
    onData?: (frequencies: number[], volume: number) => void
  ) {
    this.stopMic();

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      this.initSpeechFilterBands(this.audioContext.sampleRate || 48000, 512);

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512; // 256 frequency bins for high-resolution speech analysis
      this.analyser.smoothingTimeConstant = 0.3; // low latency for instantaneous speech response

      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.rawFreqArray = new Uint8Array(new ArrayBuffer(bufferLength));
      this.rawTimeArray = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
      this.isMicActive = true;

      const update = () => {
        if (!this.analyser || !this.isMicActive || !this.rawFreqArray || !this.rawTimeArray) return;

        this.analyser.getByteFrequencyData(this.rawFreqArray);
        this.analyser.getByteTimeDomainData(this.rawTimeArray);

        // Calculate speech-calibrated frequency bands
        const gain = Math.max(0.5, (sensitivity / 50.0) * 1.0);
        let sumEnergy = 0;

        for (let b = 0; b < 32; b++) {
          const [startBin, endBin] = this.bandBinIndices[b] || [b, b + 1];
          let bandSum = 0;
          let count = 0;

          for (let k = startBin; k < endBin && k < this.rawFreqArray.length; k++) {
            bandSum += this.rawFreqArray[k];
            count++;
          }

          const avgByte = count > 0 ? bandSum / count : 0;
          // Perceptual dynamic range expansion
          const norm = (avgByte / 255.0) * gain;
          const shapedVal = Math.min(1.0, Math.pow(norm, 0.88));
          this.micFrequencies[b] = Math.max(0.015, shapedVal);
          sumEnergy += shapedVal;
        }

        // True RMS volume computation from time-domain samples
        let sumSquares = 0;
        const timeLen = this.rawTimeArray.length;
        for (let i = 0; i < timeLen; i++) {
          const sample = (this.rawTimeArray[i] - 128) / 128.0;
          sumSquares += sample * sample;
        }
        const rms = Math.sqrt(sumSquares / timeLen);
        this.micVolume = Math.min(1.0, rms * gain * 1.8);

        // Subsample time domain into 160-point oscilloscope waveform
        const step = timeLen / WAVEFORM_POINTS;
        for (let i = 0; i < WAVEFORM_POINTS; i++) {
          const idx = Math.min(timeLen - 1, Math.floor(i * step));
          this.micWaveform[i] = (this.rawTimeArray[idx] - 128) / 128.0;
        }

        this.recalculateUnifiedState();

        if (this.micVolume > 0.12 && Date.now() - this.lastAudioLogTime > 2500) {
          console.log('[VOICE] Mic speech activity detected (volume: ' + Math.round(this.micVolume * 100) + '%)');
          this.lastAudioLogTime = Date.now();
        }

        if (onData) {
          onData(this.unifiedFrequencies, this.micVolume);
        }

        this.animFrameId = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      console.warn('RealtimeAudioAnalyzer initialization notice:', err);
    }
  }

  private playbackContext: AudioContext | null = null;
  private playbackAnalyser: AnalyserNode | null = null;
  private playbackSourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
  private playbackAnimFrameId: number | null = null;

  /**
   * Directly attaches an HTMLAudioElement to the real Web Audio API frequency analyser.
   * This extracts the literal physical frequencies and waveform of JARVIS's voice in real time!
   */
  public attachMediaElement(audio: HTMLAudioElement) {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.playbackContext && AudioCtx) {
        this.playbackContext = new AudioCtx();
      }
      if (this.playbackContext && this.playbackContext.state === 'suspended') {
        this.playbackContext.resume().catch(() => {});
      }

      if (!this.playbackAnalyser && this.playbackContext) {
        this.playbackAnalyser = this.playbackContext.createAnalyser();
        this.playbackAnalyser.fftSize = 512;
        this.playbackAnalyser.smoothingTimeConstant = 0.25;
      }

      if (this.playbackContext && this.playbackAnalyser && !this.playbackSourceMap.has(audio)) {
        try {
          const source = this.playbackContext.createMediaElementSource(audio);
          source.connect(this.playbackAnalyser);
          this.playbackAnalyser.connect(this.playbackContext.destination);
          this.playbackSourceMap.set(audio, source);
        } catch (srcErr) {
          console.warn('[AUDIO_ANALYZER] createMediaElementSource note:', srcErr);
        }
      }

      this.startPlaybackAnalysisLoop();
    } catch (err) {
      console.warn('[AUDIO_ANALYZER] attachMediaElement error:', err);
    }
  }

  private startPlaybackAnalysisLoop() {
    if (this.playbackAnimFrameId) return;

    const rawFreqs: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(256));
    const rawTime: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(512));

    const update = () => {
      if (!this.playbackAnalyser) {
        this.playbackAnimFrameId = null;
        return;
      }

      this.playbackAnalyser.getByteFrequencyData(rawFreqs);
      this.playbackAnalyser.getByteTimeDomainData(rawTime);

      for (let b = 0; b < 32; b++) {
        const [startBin, endBin] = this.bandBinIndices[b] || [b, b + 1];
        let bandSum = 0;
        let count = 0;
        for (let k = startBin; k < endBin && k < rawFreqs.length; k++) {
          bandSum += rawFreqs[k];
          count++;
        }
        const avg = count > 0 ? bandSum / count : 0;
        const norm = Math.min(1.0, Math.pow(avg / 255.0, 0.82) * 1.6);
        this.playbackFrequencies[b] = norm;
      }

      // Time-domain RMS volume and waveform
      let sumSquares = 0;
      for (let i = 0; i < 512; i++) {
        const s = (rawTime[i] - 128) / 128.0;
        sumSquares += s * s;
      }
      const rms = Math.sqrt(sumSquares / 512);
      this.playbackVolume = Math.min(1.0, rms * 2.0);

      const step = 512 / WAVEFORM_POINTS;
      for (let i = 0; i < WAVEFORM_POINTS; i++) {
        const idx = Math.min(511, Math.floor(i * step));
        this.playbackWaveform[i] = (rawTime[idx] - 128) / 128.0;
      }

      this.isPlaybackActive = this.playbackVolume > 0.015;
      this.recalculateUnifiedState();

      this.playbackAnimFrameId = requestAnimationFrame(update);
    };

    this.playbackAnimFrameId = requestAnimationFrame(update);
  }

  /**
   * Feed live playback/TTS audio frequencies, volume, and optional waveform
   * directly from high-fidelity speech synthesizer or audio element.
   */
  public feedPlaybackAudio(frequencies: number[], volume?: number, waveform?: Float32Array | number[]) {
    if (!frequencies || frequencies.length === 0) return;

    this.isPlaybackActive = true;
    const len = Math.min(32, frequencies.length);
    let sum = 0;

    for (let i = 0; i < 32; i++) {
      const val = i < len ? frequencies[i] : 0.02;
      this.playbackFrequencies[i] = Math.max(0.015, Math.min(1.0, val));
      sum += this.playbackFrequencies[i];
    }

    if (volume !== undefined) {
      this.playbackVolume = Math.max(0, Math.min(1.0, volume));
    } else {
      this.playbackVolume = Math.min(1.0, (sum / 32) * 1.5);
    }

    if (waveform && waveform.length > 0) {
      const wLen = Math.min(WAVEFORM_POINTS, waveform.length);
      for (let i = 0; i < WAVEFORM_POINTS; i++) {
        this.playbackWaveform[i] = i < wLen ? waveform[i] : 0;
      }
    }

    this.recalculateUnifiedState();

    if (this.playbackTimeoutId) {
      clearTimeout(this.playbackTimeoutId);
    }
    // Auto-clear playback if no new audio frames are fed within 250ms
    this.playbackTimeoutId = setTimeout(() => {
      this.clearPlaybackAudio();
    }, 250);
  }

  /**
   * Clears playback audio state.
   */
  public clearPlaybackAudio() {
    this.isPlaybackActive = false;
    this.playbackVolume = 0;
    this.playbackFrequencies.fill(0);
    this.playbackWaveform.fill(0);
    this.recalculateUnifiedState();
    if (this.playbackTimeoutId) {
      clearTimeout(this.playbackTimeoutId);
      this.playbackTimeoutId = null;
    }
  }

  /**
   * Recalculates unified frequency spectrum, waveform, and transient onset velocity (attack)
   */
  private recalculateUnifiedState() {
    const now = performance.now();
    const dt = Math.max(0.001, (now - this.lastUpdateTime) / 1000);
    this.lastUpdateTime = now;

    let currentVolume = 0;

    if (this.isPlaybackActive && this.isMicActive) {
      for (let i = 0; i < 32; i++) {
        this.unifiedFrequencies[i] = Math.max(this.micFrequencies[i], this.playbackFrequencies[i]);
      }
      for (let i = 0; i < WAVEFORM_POINTS; i++) {
        this.unifiedWaveform[i] = Math.abs(this.playbackWaveform[i]) > Math.abs(this.micWaveform[i])
          ? this.playbackWaveform[i]
          : this.micWaveform[i];
      }
      currentVolume = Math.max(this.micVolume, this.playbackVolume);
    } else if (this.isPlaybackActive) {
      for (let i = 0; i < 32; i++) {
        this.unifiedFrequencies[i] = this.playbackFrequencies[i];
      }
      this.unifiedWaveform.set(this.playbackWaveform);
      currentVolume = this.playbackVolume;
    } else if (this.isMicActive) {
      for (let i = 0; i < 32; i++) {
        this.unifiedFrequencies[i] = this.micFrequencies[i];
      }
      this.unifiedWaveform.set(this.micWaveform);
      currentVolume = this.micVolume;
    } else {
      this.unifiedFrequencies.fill(0);
      this.unifiedWaveform.fill(0);
      currentVolume = 0;
    }

    // Transient attack velocity (shock impulse on sudden consonants / speech bursts)
    const deltaVol = currentVolume - this.previousVolume;
    if (deltaVol > 0.035) {
      this.instantAttack = Math.min(1.0, (deltaVol / dt) * 0.09);
    } else {
      // Exponential decay of attack impulse
      this.instantAttack *= Math.exp(-dt * 15.0);
    }
    this.previousVolume = currentVolume;
  }

  /**
   * Returns complete physics data packet for the 3D Holographic Core physics engine.
   */
  public getAcousticPhysicsData(): AcousticPhysicsData {
    const freqs = this.unifiedFrequencies;
    const vol = this.isPlaybackActive ? Math.max(this.playbackVolume, this.micVolume) : this.micVolume;

    // Tri-band energy distribution (Speech Formants):
    // Bass: Bands 0-7 (80 - 350 Hz): Pitch fundamental & chest resonance
    // Mid: Bands 8-21 (350 - 2800 Hz): Vowel formants & voice clarity
    // High: Bands 22-31 (2800 - 8200 Hz): Consonants, plosives & sibilants
    let bassSum = 0;
    let midSum = 0;
    let highSum = 0;

    for (let i = 0; i < 32; i++) {
      const v = freqs[i];
      if (i < 8) bassSum += v;
      else if (i < 22) midSum += v;
      else highSum += v;
    }

    const bass = bassSum / 8;
    const mid = midSum / 14;
    const high = highSum / 10;

    const isActive = (this.isMicActive && this.micVolume > 0.025) || (this.isPlaybackActive && this.playbackVolume > 0.025);

    return {
      frequencies: freqs,
      waveform: this.unifiedWaveform,
      volume: vol,
      attack: this.instantAttack,
      bass,
      mid,
      high,
      isActive
    };
  }

  public getWaveformData(): Float32Array {
    return this.unifiedWaveform;
  }

  public getLatestFrequencies(): number[] {
    return this.unifiedFrequencies;
  }

  public getLatestVolume(): number {
    return Math.max(this.micVolume, this.playbackVolume);
  }

  public isActive(): boolean {
    return this.isMicActive || this.isPlaybackActive;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public stopMic() {
    this.isMicActive = false;
    this.micVolume = 0;
    this.micFrequencies.fill(0);
    this.micWaveform.fill(0);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.source) {
      try { this.source.disconnect(); } catch {}
      this.source = null;
    }
    if (this.analyser) {
      try { this.analyser.disconnect(); } catch {}
      this.analyser = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.recalculateUnifiedState();
  }

  public stop() {
    this.stopMic();
    this.clearPlaybackAudio();
  }
}

export const realtimeAudioAnalyzer = new RealtimeAudioAnalyzer();
