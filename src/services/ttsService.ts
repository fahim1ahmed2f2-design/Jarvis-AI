import { loadVoiceSettings } from './voiceSettings';
import { realtimeAudioAnalyzer } from './audioAnalyzer';
import { emitSubtitleGlobal } from '../state/jarvisState';

export interface SubtitleData {
  sentence: string;
  words: string[];
  activeWordIndex: number;
}

export interface TTSPlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onFrequencies?: (frequencies: number[]) => void;
  onError?: (errMessage: string) => void;
  onSubtitle?: (subtitle: SubtitleData | null) => void;
}

/**
 * Strips markdown symbols, code blocks, URLs, and formatting tags
 * to create crystal-clear spoken words.
 */
export function cleanTextForSpeech(raw: string): string {
  let t = raw.trim();
  // Strip code blocks
  t = t.replace(/```[\s\S]*?```/g, '');
  // Strip inline code
  t = t.replace(/`([^`]+)`/g, '$1');
  // Strip headers (#, ##, ###)
  t = t.replace(/^#{1,6}\s+/gm, '');
  // Strip bold, italics, strikethrough
  t = t.replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1');
  // Strip markdown links [text](url) -> text
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Strip raw URLs
  t = t.replace(/https?:\/\/\S+/g, '');
  // Strip bullet markers (- , * , 1. , etc)
  t = t.replace(/^[\s*->•\d.]+\s+/gm, '');

  // Replace em-dashes and long hyphens with comma for natural speech pauses
  t = t.replace(/—|–|--/g, ', ');

  // Convert all-caps JARVIS / J.A.R.V.I.S. / J-A-R-V-I-S to "Jarvis" for English
  t = t.replace(/\bJ[\.\-\s]?A[\.\-\s]?R[\.\-\s]?V[\.\-\s]?I[\.\-\s]?S\b/gi, 'Jarvis');
  t = t.replace(/\bJARVIS\b/g, 'Jarvis');

  // Masterclass Bengali Phonetic Transliteration & Normalization Engine
  // Ensures Edge-TTS Bengali Neural voices pronounce mixed English/Bangla text with crystal clarity
  const isBengali = /[\u0980-\u09FF]/.test(t);
  if (isBengali) {
    // 1. Core Identity & Form of Address
    t = t.replace(/\b(?:JARVIS|Jarvis|jarvis)\b/g, 'জারভিস');
    t = t.replace(/\b(?:Sir|sir|SIR)\b/g, 'স্যার');
    t = t.replace(/\bTony\s+Stark\b/gi, 'টনি স্টার্ক');
    t = t.replace(/\bStark\b/gi, 'স্টার্ক');
    t = t.replace(/\bMark-?III\b|\bMark-?3\b/gi, 'মার্ক থ্রি');
    t = t.replace(/\bMark-?II\b|\bMark-?2\b/gi, 'মার্ক টু');
    t = t.replace(/\bMark-?IV\b|\bMark-?4\b/gi, 'মার্ক ফোর');
    t = t.replace(/\bMark-?I\b|\bMark-?1\b/gi, 'মার্ক ওয়ান');
    t = t.replace(/\bSovereign\b/gi, 'সোভারেন');
    t = t.replace(/\bCore\b/gi, 'কোর');

    // 2. Version Normalization in Bengali
    t = t.replace(/\bv(\d+)\.(\d+)\b/gi, 'ভার্সন $1 পয়েন্ট $2');
    t = t.replace(/\bv(\d+)\b/gi, 'ভার্সন $1');
    t = t.replace(/\bversion\s+(\d+)\.(\d+)\b/gi, 'ভার্সন $1 পয়েন্ট $2');
    t = t.replace(/\bversion\s+(\d+)\b/gi, 'ভার্সন $1');

    // 3. Cultural & Natural Greetings Normalization
    t = t.replace(/\b(?:নমস্কার|নমস্তে|প্রণাম)\b/g, 'হ্যালো');
    t = t.replace(/\b(?:Assalamu\s*Alaikum|Assalamualaykum)\b/gi, 'আসসালামু আলাইকুম');
    t = t.replace(/\b(?:Walaikum\s*Assalam|Walaikumas-salam)\b/gi, 'ওয়ালাইকুম আসসালাম');
    t = t.replace(/\b(?:Thank\s*you|Thanks|Thx)\b/gi, 'ধন্যবাদ');
    t = t.replace(/\b(?:Please|Kindly)\b/gi, 'দয়া করে');
    t = t.replace(/\b(?:Hello|Hi|Hey)\b/gi, 'হ্যালো');
    t = t.replace(/\b(?:OK|Ok|okay|Okay)\b/g, 'ঠিক আছে');

    // 4. Hardware, Units, Protocols & Technical Acronyms
    t = t.replace(/100%/g, 'একশ শতাংশ');
    t = t.replace(/%/g, ' শতাংশ ');
    t = t.replace(/24\/7/g, 'সার্বক্ষণিক');
    t = t.replace(/°C/g, ' ডিগ্রি সেলসিয়াস ');
    t = t.replace(/°F/g, ' ডিগ্রি ফারেনহাইট ');
    t = t.replace(/°/g, ' ডিগ্রি ');
    t = t.replace(/\bkm\/h\b/gi, ' কিলোমিটার প্রতি ঘণ্টা ');
    t = t.replace(/\bTB\b/g, ' টেরাবাইট ');
    t = t.replace(/\bGB\b/g, ' গিগাবাইট ');
    t = t.replace(/\bMB\b/g, ' মেগাবাইট ');
    t = t.replace(/\bKB\b/g, ' কিলোবাইট ');
    t = t.replace(/\bms\b/g, ' মিলিসেকেন্ড ');
    t = t.replace(/\bGHz\b/gi, ' গিগাহার্টজ ');
    t = t.replace(/\bMHz\b/gi, ' মেগাহার্টজ ');
    t = t.replace(/\bHz\b/gi, ' হার্টজ ');
    t = t.replace(/\bFPS\b/gi, ' এফপিএস ');
    t = t.replace(/\bCPU\b/g, 'সিপিইউ');
    t = t.replace(/\bRAM\b/g, 'র‌্যাম');
    t = t.replace(/\bGPU\b/g, 'জিপিইউ');
    t = t.replace(/\bSSD\b/g, 'এসএসডি');
    t = t.replace(/\bHDD\b/g, 'হার্ডডিস্ক');
    t = t.replace(/\bWi-?Fi\b/gi, 'ওয়াইফাই');
    t = t.replace(/\bBluetooth\b/gi, 'ব্লুটুথ');
    t = t.replace(/\bAQI\b/g, 'এয়ার কোয়ালিটি ইনডেক্স');
    t = t.replace(/\bGPS\b/g, 'জিপিএস');
    t = t.replace(/\bIP\b/g, 'আইপি');
    t = t.replace(/\bAI\b/g, 'এআই');
    t = t.replace(/\bPC\b/g, 'পিসি');
    t = t.replace(/\bOS\b/g, 'ওএস');
    t = t.replace(/\bUSB\b/g, 'ইউএসবি');
    t = t.replace(/\bAPI\b/g, 'এপিআই');
    t = t.replace(/\bURL\b/g, 'ইউআরএল');
    t = t.replace(/\bID\b/g, 'আইডি');
    t = t.replace(/\bSMS\b/g, 'এসএমএস');
    t = t.replace(/\bPDF\b/g, 'পিডিএফ');

    // 5. Software, Platforms & Applications
    t = t.replace(/\bGoogle\b/gi, 'গুগল');
    t = t.replace(/\bYouTube\b/gi, 'ইউটিউব');
    t = t.replace(/\bChrome\b/gi, 'ক্রোম');
    t = t.replace(/\bSpotify\b/gi, 'স্পটিফাই');
    t = t.replace(/\bWindows\b/gi, 'উইন্ডোজ');
    t = t.replace(/\bVS\s*Code\b|\bvscode\b/gi, 'ভিএস কোড');
    t = t.replace(/\bPython\b/gi, 'পাইথন');
    t = t.replace(/\bJavaScript\b/gi, 'জাভাস্ক্রিপ্ট');
    t = t.replace(/\bPowerShell\b/gi, 'পাওয়ারশেল');
    t = t.replace(/\bFacebook\b/gi, 'ফেসবুক');
    t = t.replace(/\bWhatsApp\b/gi, 'হোয়াটসঅ্যাপ');
    t = t.replace(/\bTelegram\b/gi, 'টেলিগ্রাম');

    // 6. Common Tech & Action Vocabulary
    t = t.replace(/\bOnline\b/gi, 'অনলাইন');
    t = t.replace(/\bOffline\b/gi, 'অফলাইন');
    t = t.replace(/\bReady\b/gi, 'রেডি');
    t = t.replace(/\bSystem\b|\bSystems\b/gi, 'সিস্টেম');
    t = t.replace(/\bStatus\b/gi, 'স্ট্যাটাস');
    t = t.replace(/\bApp\b/gi, 'অ্যাপ');
    t = t.replace(/\bApps\b/gi, 'অ্যাপস');
    t = t.replace(/\bApplication\b/gi, 'অ্যাপ্লিকেশন');
    t = t.replace(/\bFile\b/gi, 'ফাইল');
    t = t.replace(/\bFiles\b/gi, 'ফাইলস');
    t = t.replace(/\bFolder\b/gi, 'ফোল্ডার');
    t = t.replace(/\bTask\b/gi, 'টাস্ক');
    t = t.replace(/\bTasks\b/gi, 'টাস্কস');
    t = t.replace(/\bVolume\b/gi, 'ভলিউম');
    t = t.replace(/\bBrightness\b/gi, 'ব্রাইটনেস');
    t = t.replace(/\bBattery\b/gi, 'ব্যাটারি');
    t = t.replace(/\bNetwork\b/gi, 'নেটওয়ার্ক');
    t = t.replace(/\bInternet\b/gi, 'ইন্টারনেট');
    t = t.replace(/\bSpeed\b/gi, 'স্পিড');
    t = t.replace(/\bScreen\b/gi, 'স্ক্রিন');
    t = t.replace(/\bDisplay\b/gi, 'ডিসপ্লে');
    t = t.replace(/\bVision\b/gi, 'ভিশন');
    t = t.replace(/\bAudio\b/gi, 'অডিও');
    t = t.replace(/\bVoice\b/gi, 'ভয়েস');
    t = t.replace(/\bMic\b|\bMicrophone\b/gi, 'মাইক্রোফোন');
    t = t.replace(/\bSpeaker\b/gi, 'স্পিকার');
    t = t.replace(/\bCamera\b/gi, 'ক্যামেরা');
    t = t.replace(/\bMemory\b/gi, 'মেমরি');
    t = t.replace(/\bDiagnostic\b|\bDiagnostics\b/gi, 'ডায়াগনস্টিক');
    t = t.replace(/\bOptimizer\b/gi, 'অপটিমাইজার');
    t = t.replace(/\bDoctor\b/gi, 'ডক্টর');
    t = t.replace(/\bTurbo\b/gi, 'টার্বো');
    t = t.replace(/\bBoost\b/gi, 'বুস্ট');
    t = t.replace(/\bCode\b/gi, 'কোড');
    t = t.replace(/\bSearch\b/gi, 'সার্চ');
    t = t.replace(/\bUpdate\b/gi, 'আপডেট');
    t = t.replace(/\bUpgrade\b/gi, 'আপগ্রেড');
    t = t.replace(/\bDownload\b/gi, 'ডাউনলোড');
    t = t.replace(/\bUpload\b/gi, 'আপলোড');
    t = t.replace(/\bOpen\b/gi, 'ওপেন');
    t = t.replace(/\bClose\b/gi, 'ক্লোজ');
    t = t.replace(/\bStart\b/gi, 'স্টার্ট');
    t = t.replace(/\bStop\b/gi, 'স্টপ');
    t = t.replace(/\bRestart\b/gi, 'রিস্টার্ট');
    t = t.replace(/\bSettings\b/gi, 'সেটিংস');
    t = t.replace(/\bChat\b/gi, 'চ্যাট');
    t = t.replace(/\bMessage\b/gi, 'মেসেজ');
    t = t.replace(/\bEmail\b|\bMail\b/gi, 'ইমেইল');
    t = t.replace(/\bWeather\b/gi, 'আবহাওয়া');
    t = t.replace(/\bTemperature\b/gi, 'তাপমাত্রা');
    t = t.replace(/\bBitcoin\b|\bBTC\b/gi, 'বিটকয়েন');
    t = t.replace(/\bDollar\b|\bUSD\b/gi, 'ডলার');
    t = t.replace(/\bActive\b/gi, 'অ্যাক্টিভ');
  } else {
    // English Roman numeral and version normalization
    t = t.replace(/\bMark-?II\b/gi, 'Mark Two');
    t = t.replace(/\bMark-?III\b/gi, 'Mark Three');
    t = t.replace(/\bMark-?IV\b/gi, 'Mark Four');
    t = t.replace(/\bMark-?I\b/gi, 'Mark One');
    t = t.replace(/\bv(\d+)\.(\d+)\b/gi, 'version $1 point $2');
    t = t.replace(/\bv(\d+)\b/gi, 'version $1');
  }

  // Strip unpronounceable characters
  t = t.replace(/[^\w\s.,!?;:'"\-()%/\u0964\u0965\u0980-\u09FF]/g, '');

  // Collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

/**
 * Splits text into individual sentences for real-time speech (supports English and Bengali Dari).
 */
export function extractSpeechSentences(cleanText: string): string[] {
  const segments = cleanText.match(/[^.!?।॥\n]+[.!?।॥\n]*/g);
  if (!segments || segments.length === 0) return [cleanText];
  return segments.map((s) => s.trim()).filter((s) => s.length > 0);
}

class JarvisTTSService {
  private activeAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private synthAnimFrameId: number | null = null;
  private isCurrentlySpeaking = false;
  private abortController: AbortController | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private activeCallbacks: TTSPlaybackCallbacks | null = null;
  private blobCache: Map<string, string> = new Map();
  private pendingFetches: Map<string, Promise<string | null>> = new Map();

  constructor() {
    this.setupUserGestureUnlock();
  }

  /**
   * Unlocks browser audio policy (Autoplay) on user click/interaction.
   */
  public unlockAudio(): void {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioContext && AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          try { window.speechSynthesis.resume(); } catch {}
        }
      }
    } catch {
      // Non-fatal
    }
  }

  private setupUserGestureUnlock(): void {
    if (typeof window === 'undefined') return;
    const unlockHandler = () => {
      this.unlockAudio();
    };
    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  /**
   * Prefetches audio for a sentence in background so it is ready immediately when needed.
   */
  private async fetchSentenceAudioUrl(
    sentence: string,
    voice: string,
    speed: number,
    signal?: AbortSignal
  ): Promise<string | null> {
    const key = `${sentence}_${voice}_${speed}`;
    if (this.blobCache.has(key)) {
      return this.blobCache.get(key)!;
    }
    if (this.pendingFetches.has(key)) {
      return this.pendingFetches.get(key)!;
    }

    const fetchPromise = (async () => {
      try {
        const res = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sentence, voice, speed }),
          signal
        });

        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) return null;

        const blob = await res.blob();
        if (blob.size < 100) return null;

        const url = URL.createObjectURL(blob);
        this.blobCache.set(key, url);
        // Limit cache size to 100 items
        if (this.blobCache.size > 100) {
          const firstKey = this.blobCache.keys().next().value;
          if (firstKey) {
            const oldUrl = this.blobCache.get(firstKey);
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            this.blobCache.delete(firstKey);
          }
        }
        return url;
      } catch {
        return null;
      } finally {
        this.pendingFetches.delete(key);
      }
    })();

    this.pendingFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Main entry point. Speaks text sentence-by-sentence with parallel prefetching for ZERO lag between sentences.
   */
  public async speak(text: string, callbacks: TTSPlaybackCallbacks = {}): Promise<void> {
    this.stop();
    this.unlockAudio();

    const settings = loadVoiceSettings();
    if (!settings.ttsEnabled) {
      console.log('[TTS] Disabled by user settings, skipping speech');
      callbacks.onEnd?.();
      return;
    }

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      callbacks.onEnd?.();
      return;
    }

    const sentences = extractSpeechSentences(cleanedText);
    if (sentences.length === 0) {
      callbacks.onEnd?.();
      return;
    }

    this.activeCallbacks = callbacks;
    this.isCurrentlySpeaking = true;
    this.abortController = new AbortController();
    callbacks.onStart?.();

    const isNeuralVoice = ['jarvis', 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'pradeep', 'nabanita', 'bengali', 'bangla']
      .includes(settings.ttsVoice.toLowerCase()) || !settings.ttsVoice.startsWith('System:');

    // Start fetching sentence 0 and sentence 1 in parallel immediately!
    if (isNeuralVoice) {
      this.fetchSentenceAudioUrl(sentences[0], settings.ttsVoice, settings.ttsSpeed, this.abortController.signal);
      if (sentences.length > 1) {
        this.fetchSentenceAudioUrl(sentences[1], settings.ttsVoice, settings.ttsSpeed, this.abortController.signal);
      }
    }

    try {
      for (let i = 0; i < sentences.length; i++) {
        if (!this.isCurrentlySpeaking) break;

        const curSentence = sentences[i];

        // Trigger prefetching for the sentence after next
        if (isNeuralVoice && i + 2 < sentences.length) {
          this.fetchSentenceAudioUrl(sentences[i + 2], settings.ttsVoice, settings.ttsSpeed, this.abortController.signal);
        }

        let sentencePlayed = false;

        if (isNeuralVoice) {
          try {
            const audioUrl = await this.fetchSentenceAudioUrl(curSentence, settings.ttsVoice, settings.ttsSpeed, this.abortController.signal);
            if (audioUrl && this.isCurrentlySpeaking) {
              sentencePlayed = await this.playAudioUrl(audioUrl, settings.ttsVolume, callbacks);
            }
          } catch (err) {
            console.warn('[TTS] Audio playback notice, attempting web speech:', err);
          }
        }

        if (!sentencePlayed && this.isCurrentlySpeaking) {
          // Fallback: Web Speech API for this sentence
          await this.playSentenceViaWebSpeech(
            curSentence, settings.ttsVoice, settings.ttsSpeed, settings.ttsVolume, callbacks
          );
        }
      }
    } finally {
      this.isCurrentlySpeaking = false;
      this.stopSynthVisualizer();
      callbacks.onEnd?.();
    }
  }

  /**
   * Plays a pre-fetched audio URL with low-latency start and visualizer integration.
   */
  private playAudioUrl(
    audioUrl: string,
    volume: number,
    callbacks: TTSPlaybackCallbacks
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let resolved = false;
      let safetyTimeoutId: any = null;

      const audio = new Audio();
      this.activeAudio = audio;
      audio.src = audioUrl;
      audio.volume = Math.max(0, Math.min(1, volume / 100));

      const cleanup = (success: boolean) => {
        if (resolved) return;
        resolved = true;
        if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
        this.stopSynthVisualizer();
        try {
          audio.pause();
        } catch {}
        this.activeAudio = null;
        realtimeAudioAnalyzer.clearPlaybackAudio();
        resolve(success);
      };

      audio.onloadedmetadata = () => {
        const dur = Math.max(0.4, audio.duration || 1.5);
        safetyTimeoutId = setTimeout(() => cleanup(true), (dur + 1.5) * 1000);
      };

      audio.onended = () => cleanup(true);
      audio.onerror = () => cleanup(false);

      // Connect physical audio element directly to real-time audio FFT analyzer
      realtimeAudioAnalyzer.attachMediaElement(audio);

      audio.play().catch(() => {
        cleanup(false);
      });

      safetyTimeoutId = setTimeout(() => cleanup(true), 8000);
    });
  }

  /**
   * Plays a single sentence via Web Speech API with guaranteed completion timeout.
   */
  private playSentenceViaWebSpeech(
    sentence: string,
    voiceName: string,
    speed: number,
    volume: number,
    callbacks: TTSPlaybackCallbacks
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch {}

      const utterance = new SpeechSynthesisUtterance(sentence);
      this.activeUtterance = utterance;

      utterance.rate = Math.max(0.7, Math.min(1.5, speed));
      utterance.volume = Math.max(0, Math.min(1, volume / 100));

      const isBengali = /[\u0980-\u09FF]/.test(sentence);
      const voices = window.speechSynthesis.getVoices();
      const exactMatch = voices.find((v) => v.name === voiceName);
      const bengaliMatch = isBengali ? voices.find((v) => v.lang.startsWith('bn')) : null;
      const englishMatch = voices.find((v) => v.lang.startsWith('en') && !v.name.includes('Zira'));
      const chosenVoice = bengaliMatch || exactMatch || englishMatch || voices.find((v) => v.lang.startsWith('en')) || voices[0];

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang || (isBengali ? 'bn-BD' : 'en-US');
      }

      const estDuration = Math.max(1.2, (sentence.length / 13) / Math.max(0.7, speed));
      let resolved = false;
      let safetyTimer: any = null;

      const handleDone = () => {
        if (resolved) return;
        resolved = true;
        if (safetyTimer) clearTimeout(safetyTimer);
        this.activeUtterance = null;
        this.stopSynthVisualizer();
        resolve();
      };

      // Strict safety timeout so Web Speech can NEVER hang
      safetyTimer = setTimeout(handleDone, (estDuration + 3.0) * 1000);

      utterance.onstart = () => {
        this.startSynthVisualizer();
      };

      utterance.onend = handleDone;
      utterance.onerror = handleDone;

      window.speechSynthesis.speak(utterance);
    });
  }

  private startSynthVisualizer() {
    this.stopSynthVisualizer();
    let phase = 0;
    const wave = new Float32Array(160);

    const update = () => {
      if (!this.isCurrentlySpeaking) return;

      phase += 0.16;
      const freqs = new Array(32);
      const envelope = Math.sin(phase * 0.7) * 0.35 + 0.55;

      for (let i = 0; i < 32; i++) {
        const f1 = Math.sin(phase * 1.4 + i * 0.35) * 0.38;
        const f2 = Math.cos(phase * 2.1 + i * 0.22) * 0.25;
        const jitter = (Math.random() - 0.5) * 0.07;
        freqs[i] = Math.max(0.02, Math.min(1.0, (f1 + f2 + 0.5 + jitter) * envelope));
      }

      for (let i = 0; i < 160; i++) {
        const t = (i / 160) * Math.PI * 6;
        wave[i] = Math.sin(t + phase * 2) * envelope * 0.6;
      }

      if (this.activeCallbacks) {
        this.activeCallbacks.onFrequencies?.(freqs);
      }
      realtimeAudioAnalyzer.feedPlaybackAudio(freqs, envelope * 0.75, wave);

      this.synthAnimFrameId = requestAnimationFrame(update);
    };

    this.synthAnimFrameId = requestAnimationFrame(update);
  }

  private stopSynthVisualizer() {
    if (this.synthAnimFrameId) {
      cancelAnimationFrame(this.synthAnimFrameId);
      this.synthAnimFrameId = null;
    }
  }

  /**
   * Immediately stops all speech.
   */
  public stop() {
    this.isCurrentlySpeaking = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.src = '';
      } catch {}
      this.activeAudio = null;
    }

    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    this.stopSynthVisualizer();
    realtimeAudioAnalyzer.clearPlaybackAudio();

    if (this.activeCallbacks) {
      this.activeCallbacks.onEnd?.();
      this.activeCallbacks = null;
    }
  }

  /**
   * Test TTS with a fixed phrase.
   */
  public async testVoice(callbacks: TTSPlaybackCallbacks = {}): Promise<void> {
    const testText = 'Hello, Sir. All audio synthesis systems are operational.';
    await this.speak(testText, callbacks);
  }
}

export const jarvisTTSService = new JarvisTTSService();
