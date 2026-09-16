export interface VoiceSettings {
  // Voice Input & Wake Word
  selectedDeviceId: string;
  speechLanguage: string;           // 'en-US', 'en-GB', 'en-IN'
  sensitivity: number; // 1 to 100
  wakeWordEnabled: boolean;
  wakeWord: string;
  wakeChimeEnabled: boolean;        // subtle sci-fi audio chime on wake word
  timeoutSeconds: number;          // silence timeout while listening (seconds)
  conversationTimeoutSeconds: number; // how long to wait for command after wake (seconds)
  wakeWordAck: boolean;            // whether JARVIS says "Yes?" after wake word

  // Voice Output (TTS)
  ttsEnabled: boolean;
  ttsVoice: string;
  ttsSpeed: number; // 0.75 to 1.5
  ttsVolume: number; // 0 to 100

  // Phase 6: Vision & Computer Agent
  screenVisionEnabled: boolean;
  captureMode: 'fullscreen' | 'active_window';
  confidenceThreshold: number; // 50 to 95 (%)
  askBeforeSensitive: boolean;

  // Phase 7: Web Research & Real-Time Intelligence
  webAccessEnabled: boolean;
  researchDepth: 'quick' | 'normal' | 'deep';
  useWebForCurrentInfo: boolean;
  showSources: boolean;

  // Phase 8: Long-Term Memory
  memoryEnabled: boolean;

  // Phase 9: Personal Assistant & Reminders
  remindersEnabled: boolean;
  notificationsEnabled: boolean;
  reminderVoiceEnabled: boolean;
  reminderSoundEnabled: boolean;
  defaultReminderDurationMinutes: number;

  // Developer / Debug Mode (Section 18)
  debugModeEnabled: boolean;
}

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  category: 'neural' | 'system';
}

const STORAGE_KEY = 'jarvis_voice_settings_v8';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  selectedDeviceId: 'default',
  speechLanguage: 'en-US',
  sensitivity: 75,
  wakeWordEnabled: true,
  wakeWord: 'Hello Jarvis',
  wakeChimeEnabled: true,
  timeoutSeconds: 2.5,               // 2.5s silence → finalize command
  conversationTimeoutSeconds: 10,    // 10s to speak a command after wake
  wakeWordAck: true,                 // say "Yes?" after wake word
  ttsEnabled: true,
  ttsVoice: 'jarvis',
  ttsSpeed: 1.0,
  ttsVolume: 100,

  // Vision & Computer Agent Defaults
  screenVisionEnabled: true,
  captureMode: 'fullscreen',
  confidenceThreshold: 75,
  askBeforeSensitive: true,

  // Web Intelligence Defaults
  webAccessEnabled: true,
  researchDepth: 'normal',
  useWebForCurrentInfo: true,
  showSources: true,

  // Phase 8 Memory Defaults
  memoryEnabled: true,

  // Phase 9 Personal Assistant Defaults
  remindersEnabled: true,
  notificationsEnabled: true,
  reminderVoiceEnabled: true,
  reminderSoundEnabled: true,
  defaultReminderDurationMinutes: 10,

  // Developer Debug Mode Default
  debugModeEnabled: true
};

export function loadVoiceSettings(): VoiceSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_VOICE_SETTINGS;
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export async function getAvailableMicrophones(): Promise<AudioInputDevice[]> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [{ deviceId: 'default', label: 'Default Microphone' }];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices
      .filter((d) => d.kind === 'audioinput')
      .map((d, index) => ({
        deviceId: d.deviceId || `mic-${index}`,
        label: d.label || `Microphone ${index + 1} (${d.deviceId ? d.deviceId.slice(0, 5) : 'Default'})`,
      }));

    return audioInputs.length > 0
      ? audioInputs
      : [{ deviceId: 'default', label: 'Default Microphone' }];
  } catch {
    return [{ deviceId: 'default', label: 'Default Microphone' }];
  }
}

export function getAvailableVoices(): Promise<VoiceOption[]> {
  return new Promise((resolve) => {
    const neuralVoices: VoiceOption[] = [
      { id: 'jarvis', name: 'JARVIS British Neural (Ryan Neural - MCU Style)', category: 'neural' },
      { id: 'pradeep', name: 'JARVIS Bangla Neural (প্রদীপ - মার্জিত পুরুষ কণ্ঠ)', category: 'neural' },
      { id: 'nabanita', name: 'JARVIS Bangla Neural (নবনিতা - স্পষ্ট নারী কণ্ঠ)', category: 'neural' },
      { id: 'onyx', name: 'JARVIS Onyx (Commanding & Rich)', category: 'neural' },
      { id: 'fable', name: 'JARVIS British Accent (Ryan Neural)', category: 'neural' },
      { id: 'alloy', name: 'JARVIS Alloy (Crisp & Balanced)', category: 'neural' },
      { id: 'echo', name: 'JARVIS Echo (Smooth Conversational)', category: 'neural' },
      { id: 'nova', name: 'JARVIS Nova (Energetic & Clear)', category: 'neural' },
      { id: 'shimmer', name: 'JARVIS Shimmer (Calm & Expressive)', category: 'neural' }
    ];

    if (!('speechSynthesis' in window)) {
      return resolve(neuralVoices);
    }

    const loadSysVoices = () => {
      const sysVoices = window.speechSynthesis.getVoices();
      const systemOptions: VoiceOption[] = sysVoices
        .filter((v) => v.lang.startsWith('en'))
        .map((v) => ({
          id: v.name,
          name: `System: ${v.name} (${v.lang})`,
          category: 'system' as const
        }));

      resolve([...neuralVoices, ...systemOptions]);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      loadSysVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        loadSysVoices();
      };
      setTimeout(() => loadSysVoices(), 400);
    }
  });
}
