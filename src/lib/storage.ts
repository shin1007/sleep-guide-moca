import { defaultSettings, type SleepSettings } from './catalog';

export interface PlaybackSession {
  isPlaying: boolean;
  queue: Array<{
    id: string;
    stage: 'pmr' | 'breathing' | 'shuffle';
    order: number;
    title: string;
    audioUrl: string;
    delayAfterMs: number;
    silenceRepeat?: number;
  }>;
  currentIndex: number;
  currentTime: number;
  phase: 'track' | 'gap';
  gapRemainingMs: number;
  timerEndsAt: number | null;
  updatedAt: number;
}

const SETTINGS_KEY = 'sleep-guide-moca.settings.v1';
const SESSION_KEY = 'sleep-guide-moca.session.v1';

export function loadSettings(): SleepSettings {
  const rawValue = localStorage.getItem(SETTINGS_KEY);
  if (!rawValue) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SleepSettings>;
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SleepSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSession(): PlaybackSession | null {
  // keep loadSession available but prefer not to auto-restore; return null by default
  try {
    const rawValue = sessionStorage.getItem(SESSION_KEY);
    if (!rawValue) return null;
    return JSON.parse(rawValue) as PlaybackSession;
  } catch {
    return null;
  }
}

export function saveSession(session: PlaybackSession | null) {
  if (!session) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}