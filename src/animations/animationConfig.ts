import { JarvisState, StateVisualConfig, SuitTheme, SuitThemeConfig } from '../types/jarvis';

export const STATE_CONFIGS: Record<JarvisState, StateVisualConfig> = {
  IDLE: {
    name: 'IDLE',
    displayStatus: 'JARVIS ONLINE',
    subStatus: 'SYSTEM STATUS: STANDBY // PROTOCOL ALPHA',
    primaryColor: '#00f0ff',
    secondaryColor: '#0d9488',
    glowColor: 'rgba(0, 240, 255, 0.45)',
    corePulseSpeed: 1.0,
    coreScale: 1.0,
    rotationSpeedMultiplier: 1.0,
    particleSpeedMultiplier: 1.0,
    particleActivity: 0.2,
    audioReactIntensity: 0.1,
    ringGlowIntensity: 0.8,
    waveformVisible: false,
    statusBadgeColor: '#00f0ff',
    isWarning: false
  },
  LISTENING: {
    name: 'LISTENING',
    displayStatus: 'LISTENING...',
    subStatus: 'AUDIO RECEPTOR ACTIVE // FREQ 142.8 GHz',
    primaryColor: '#00ffff',
    secondaryColor: '#2dd4bf',
    glowColor: 'rgba(0, 255, 255, 0.75)',
    corePulseSpeed: 2.2,
    coreScale: 1.02,
    rotationSpeedMultiplier: 1.8,
    particleSpeedMultiplier: 2.0,
    particleActivity: 0.6,
    audioReactIntensity: 0.5,
    ringGlowIntensity: 1.1,
    waveformVisible: true,
    statusBadgeColor: '#2dd4bf',
    isWarning: false
  },
  THINKING: {
    name: 'THINKING',
    displayStatus: 'THINKING...',
    subStatus: 'NEURAL FLUX PROCESSING // SYNAPSE OVERDRIVE',
    primaryColor: '#38bdf8',
    secondaryColor: '#06b6d4',
    glowColor: 'rgba(56, 189, 248, 0.8)',
    corePulseSpeed: 3.2,
    coreScale: 1.03,
    rotationSpeedMultiplier: 2.8,
    particleSpeedMultiplier: 3.0,
    particleActivity: 0.9,
    audioReactIntensity: 0.3,
    ringGlowIntensity: 1.2,
    waveformVisible: false,
    statusBadgeColor: '#38bdf8',
    isWarning: false
  },
  SPEAKING: {
    name: 'SPEAKING',
    displayStatus: 'SPEAKING...',
    subStatus: 'SYNTHESIS ENGINE BROADCASTING // VOX MATRIX',
    primaryColor: '#22d3ee',
    secondaryColor: '#14b8a6',
    glowColor: 'rgba(34, 211, 238, 0.85)',
    corePulseSpeed: 2.6,
    coreScale: 1.04,
    rotationSpeedMultiplier: 2.0,
    particleSpeedMultiplier: 2.4,
    particleActivity: 0.75,
    audioReactIntensity: 0.5,
    ringGlowIntensity: 1.2,
    waveformVisible: true,
    statusBadgeColor: '#22d3ee',
    isWarning: false
  },
  EXECUTING: {
    name: 'EXECUTING',
    displayStatus: 'EXECUTING...',
    subStatus: 'RUNNING SUBROUTINE PIPELINE // THREADS: 128',
    primaryColor: '#14b8a6',
    secondaryColor: '#00f0ff',
    glowColor: 'rgba(20, 184, 166, 0.8)',
    corePulseSpeed: 2.4,
    coreScale: 1.02,
    rotationSpeedMultiplier: 2.4,
    particleSpeedMultiplier: 2.6,
    particleActivity: 0.8,
    audioReactIntensity: 0.35,
    ringGlowIntensity: 1.15,
    waveformVisible: true,
    statusBadgeColor: '#14b8a6',
    isWarning: false
  },
  ALERT: {
    name: 'ALERT',
    displayStatus: 'REMINDER ALERT',
    subStatus: 'SCHEDULED EVENT TRIGGERED // NOTIFICATION BEACON',
    primaryColor: '#00e5ff',
    secondaryColor: '#0891b2',
    glowColor: 'rgba(0, 229, 255, 0.85)',
    corePulseSpeed: 3.0,
    coreScale: 1.04,
    rotationSpeedMultiplier: 2.2,
    particleSpeedMultiplier: 2.4,
    particleActivity: 0.8,
    audioReactIntensity: 0.5,
    ringGlowIntensity: 1.2,
    waveformVisible: true,
    statusBadgeColor: '#00e5ff',
    isWarning: false
  },
  ERROR: {
    name: 'ERROR',
    displayStatus: 'SYSTEM ALERT',
    subStatus: 'ANOMALY DETECTED // SECURITY INTERRUPT',
    primaryColor: '#38bdf8',
    secondaryColor: '#0d9488',
    glowColor: 'rgba(56, 189, 248, 0.9)',
    corePulseSpeed: 4.0,
    coreScale: 0.96,
    rotationSpeedMultiplier: 0.6,
    particleSpeedMultiplier: 1.8,
    particleActivity: 0.85,
    audioReactIntensity: 0.25,
    ringGlowIntensity: 1.2,
    waveformVisible: false,
    statusBadgeColor: '#38bdf8',
    isWarning: true
  }
};

// V2: 10 Suit Themes (5 original + 5 new)
export const SUIT_THEMES: Record<SuitTheme, SuitThemeConfig> = {
  // ─── Original 5 Themes ───
  MARK_II: {
    id: 'MARK_II',
    name: 'Mark II (v2.0)',
    codename: 'Platinum Titanium Core',
    primaryColor: '#00f0ff',
    secondaryColor: '#38bdf8',
    accentColor: '#e0f2fe',
    glowColor: 'rgba(0, 240, 255, 0.55)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(0, 240, 255, 0.08) 0%, rgba(3, 10, 24, 0.95) 70%)',
    gridColor: 'rgba(0, 240, 255, 0.06)'
  },
  MARK_IV: {
    id: 'MARK_IV',
    name: 'Mark IV',
    codename: 'Classic Arc Cyan',
    primaryColor: '#00e5ff',
    secondaryColor: '#0d9488',
    accentColor: '#38bdf8',
    glowColor: 'rgba(0, 229, 255, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(0, 229, 255, 0.07) 0%, rgba(3, 10, 24, 0.95) 70%)',
    gridColor: 'rgba(0, 229, 255, 0.05)'
  },
  MARK_VII: {
    id: 'MARK_VII',
    name: 'Mark VII',
    codename: 'Stark Gold & Crimson',
    primaryColor: '#ffb800',
    secondaryColor: '#ff3344',
    accentColor: '#ffe066',
    glowColor: 'rgba(255, 184, 0, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(255, 184, 0, 0.07) 0%, rgba(12, 5, 2, 0.97) 70%)',
    gridColor: 'rgba(255, 184, 0, 0.05)'
  },
  MARK_XLII: {
    id: 'MARK_XLII',
    name: 'Mark XLII',
    codename: 'Cyber Stealth Emerald',
    primaryColor: '#00ff9d',
    secondaryColor: '#059669',
    accentColor: '#6ee7b7',
    glowColor: 'rgba(0, 255, 157, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(0, 255, 157, 0.07) 0%, rgba(2, 10, 8, 0.97) 70%)',
    gridColor: 'rgba(0, 255, 157, 0.05)'
  },
  MARK_LXXXV: {
    id: 'MARK_LXXXV',
    name: 'Mark LXXXV',
    codename: 'Vibranium Amethyst',
    primaryColor: '#b026ff',
    secondaryColor: '#7c3aed',
    accentColor: '#d8b4fe',
    glowColor: 'rgba(176, 38, 255, 0.45)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(176, 38, 255, 0.08) 0%, rgba(8, 3, 20, 0.97) 70%)',
    gridColor: 'rgba(176, 38, 255, 0.05)'
  },

  // ─── V2 New 5 Themes ───
  MARK_V: {
    id: 'MARK_V',
    name: 'Mark V',
    codename: 'Suitcase Armor — Solar Gold',
    primaryColor: '#ffd700',
    secondaryColor: '#dc2626',
    accentColor: '#fbbf24',
    glowColor: 'rgba(255, 215, 0, 0.5)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(255, 215, 0, 0.08) 0%, rgba(15, 5, 0, 0.97) 70%)',
    gridColor: 'rgba(255, 215, 0, 0.06)'
  },
  NEBULA: {
    id: 'NEBULA',
    name: 'NEBULA',
    codename: 'Deep Space Nebula Core',
    primaryColor: '#c084fc',
    secondaryColor: '#00e5ff',
    accentColor: '#818cf8',
    glowColor: 'rgba(192, 132, 252, 0.5)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(192, 132, 252, 0.1) 0%, rgba(5, 2, 20, 0.97) 70%)',
    gridColor: 'rgba(192, 132, 252, 0.05)'
  },
  GHOST: {
    id: 'GHOST',
    name: 'GHOST',
    codename: 'Phantom Stealth White',
    primaryColor: '#e2e8f0',
    secondaryColor: '#94a3b8',
    accentColor: '#f8fafc',
    glowColor: 'rgba(226, 232, 240, 0.4)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(226, 232, 240, 0.06) 0%, rgba(5, 8, 15, 0.97) 70%)',
    gridColor: 'rgba(226, 232, 240, 0.04)'
  },
  CRIMSON: {
    id: 'CRIMSON',
    name: 'CRIMSON',
    codename: 'Blood Crimson Dominance',
    primaryColor: '#ef4444',
    secondaryColor: '#7f1d1d',
    accentColor: '#fca5a5',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(239, 68, 68, 0.08) 0%, rgba(15, 2, 2, 0.98) 70%)',
    gridColor: 'rgba(239, 68, 68, 0.05)'
  },
  AURORA: {
    id: 'AURORA',
    name: 'AURORA',
    codename: 'Arctic Aurora Borealis',
    primaryColor: '#34d399',
    secondaryColor: '#3b82f6',
    accentColor: '#6ee7b7',
    glowColor: 'rgba(52, 211, 153, 0.5)',
    bgGradient: 'radial-gradient(ellipse at 50% 45%, rgba(52, 211, 153, 0.08) 0%, rgba(2, 8, 15, 0.97) 70%)',
    gridColor: 'rgba(52, 211, 153, 0.05)'
  }
};

export function applyThemeToConfig(baseConfig: StateVisualConfig, themeId: SuitTheme): StateVisualConfig {
  const theme = SUIT_THEMES[themeId] || SUIT_THEMES.MARK_IV;
  if (themeId === 'MARK_IV') return baseConfig;
  return {
    ...baseConfig,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    glowColor: theme.glowColor,
    statusBadgeColor: theme.primaryColor
  };
}

export function getSuitThemeList(): SuitThemeConfig[] {
  return Object.values(SUIT_THEMES);
}
