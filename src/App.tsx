import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildArtworkDataUri,
  createQueue,
  getStageLabel,
  sleepLibrary,
  type QueueItem,
  type SleepSettings,
  type StageId,
} from './lib/catalog';
import { createWhiteNoiseController } from './lib/noise';
import { createLoopableSilenceUrl } from './lib/silence';
import { loadSettings, saveSession, saveSettings, type PlaybackSession } from './lib/storage';
import { CharacterDisplay } from './components/characters/CharacterDisplay';

type PlaybackStatus = 'idle' | 'playing' | 'paused';
type GapTimer = ReturnType<typeof window.setTimeout> | null;

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceAudioRef = useRef<HTMLAudioElement | null>(null);
  const noiseControllerRef = useRef<ReturnType<typeof createWhiteNoiseController> | null>(null);
  const gapTimerRef = useRef<GapTimer>(null);
  const silenceRepeatIntervalRef = useRef<number | null>(null);
  const silenceRepeatRemainingRef = useRef<number>(0);
  const silenceEndedHandlerRef = useRef<((this: HTMLAudioElement, ev: Event) => any) | null>(null);
  const trackAdvanceTimerRef = useRef<GapTimer>(null);
  const warmupAbortRef = useRef<AbortController | null>(null);
  const trackTransitionRef = useRef(false);
  const settingsRef = useRef<SleepSettings>(loadSettings());
  const currentQueueRef = useRef<QueueItem[]>([]);
  const currentIndexRef = useRef(0);
  const currentPhaseRef = useRef<'track' | 'gap'>('track');
  const currentGapRemainingRef = useRef(0);
  const gapStartedAtRef = useRef(0);
  const currentTimeRef = useRef(0);
  const timerEndsAtRef = useRef<number | null>(null);
  const lastAdvanceAtRef = useRef(0);
  

  const [settings, setSettingsState] = useState<SleepSettings>(() => loadSettings());
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'track' | 'gap'>('track');
  const [currentTime, setCurrentTime] = useState(0);
  const [gapRemainingMs, setGapRemainingMs] = useState(0);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const statusRef = useRef<PlaybackStatus>('idle');

  const activeTrack = queue[currentIndex] ?? null;

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    noiseControllerRef.current = createWhiteNoiseController();
    return () => {
      noiseControllerRef.current?.destroy();
    };
  }, []);

  // startup: do not auto-restore previous session by design

  useEffect(() => {
    setMediaSession(activeTrack, phase, status);
  }, [activeTrack, phase, status]);

  // progress bar removed: no periodic tick required here

  useEffect(() => {
    warmupSequence();
    return () => {
      warmupAbortRef.current?.abort();
    };
  }, []);

  // 初期化時に日本語47文字を仮レンダリングして、吹き出しに必要な高さを計測し
  // CSS変数 `--speech-box-height` に設定する。
  // 理由: 実機での折り返しを想定して最適な高さでボックスを固定するため。
  useEffect(() => {
    try {
      const sample = 'あ'.repeat(47);
      const base = document.querySelector('.speech-text') as HTMLElement | null;
      if (!base) return;
      // クローンを作り、オフスクリーンに追加して高さを測定する（既存のスタイルを継承させるため）
      const clone = base.cloneNode(false) as HTMLElement;
      clone.textContent = sample;
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.left = '-9999px';
      // match the rendered width of the original bubble so text wraps the same way
      const baseRect = base.getBoundingClientRect();
      if (baseRect.width && baseRect.width > 0) {
        clone.style.width = `${Math.ceil(baseRect.width)}px`;
      }
      clone.style.top = '0';
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      document.body.appendChild(clone);
      // フォント・レンダリングが安定するまで1フレーム待つ（安全性向上）
      requestAnimationFrame(() => {
        try {
          const rect = clone.getBoundingClientRect();
          const height = Math.ceil(rect.height);
          document.documentElement.style.setProperty('--speech-box-height', `${height}px`);
        } finally {
          clone.remove();
        }
      });
    } catch (err) {
      // 計測が失敗しても致命的ではないので無視
    }
  }, []);

  useEffect(() => {
    return () => {
      if (gapTimerRef.current) {
        window.clearTimeout(gapTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!timerEndsAt || status !== 'playing') {
      return;
    }

    const timeout = window.setTimeout(() => {
      stopPlayback('タイマーが終了しました。');
    }, Math.max(0, timerEndsAt - Date.now()));

    return () => {
      window.clearTimeout(timeout);
    };
  }, [timerEndsAt, status]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) {
      return;
    }

    const handleEndedNative = () => {
      onAudioEnded();
    };

    const handleTimeUpdateNative = () => {
      onTimeUpdate();
    };

    const handlePauseNative = () => {
      onAudioPause();
    };

    element.addEventListener('ended', handleEndedNative);
    element.addEventListener('timeupdate', handleTimeUpdateNative);
    element.addEventListener('pause', handlePauseNative);
    // Update speech bubble tail position to align with character image center
    function updateSpeechTail() {
      try {
        const img = document.querySelector('.character-image') as HTMLElement | null;
        const bubble = document.querySelector('.speech-text') as HTMLElement | null;
        if (!img || !bubble) return;
        const imgRect = img.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();
        const left = imgRect.left + imgRect.width / 2 - bubbleRect.left;
        bubble.style.setProperty('--speech-tail-left', `${left}px`);
      } catch (err) {
        // ignore
      }
    }

    updateSpeechTail();
    window.addEventListener('resize', updateSpeechTail);
    const charImg = document.querySelector('.character-image');
    charImg?.addEventListener('load', updateSpeechTail);

    return () => {
      element.removeEventListener('ended', handleEndedNative);
      element.removeEventListener('timeupdate', handleTimeUpdateNative);
      element.removeEventListener('pause', handlePauseNative);
      window.removeEventListener('resize', updateSpeechTail);
      charImg?.removeEventListener('load', updateSpeechTail);
    };
  }, []);

  useEffect(() => {
    const reassertPlayback = () => {
      if (statusRef.current !== 'playing') {
        return;
      }

      syncNoisePlayback();

      if (currentPhaseRef.current === 'gap') {
        const elapsed = Math.max(0, Date.now() - gapStartedAtRef.current);
        const remaining = Math.max(0, currentGapRemainingRef.current - elapsed);
        currentGapRemainingRef.current = remaining;
        setGapRemainingMs(remaining);

        if (gapTimerRef.current) {
          window.clearTimeout(gapTimerRef.current);
          gapTimerRef.current = null;
        }

        if (document.visibilityState !== 'visible' || remaining <= 0) {
          advanceQueue();
          return;
        }

        gapStartedAtRef.current = Date.now();
        gapTimerRef.current = window.setTimeout(() => {
          gapTimerRef.current = null;
          advanceQueue();
        }, remaining);
      }

      if (audioRef.current) {
        const duration = audioRef.current.duration;
        if (
          currentPhaseRef.current === 'track' &&
          (audioRef.current.ended ||
            (Number.isFinite(duration) && duration > 0 && audioRef.current.currentTime >= duration - 0.05))
        ) {
          onAudioEnded();
          return;
        }

        if (audioRef.current.paused) {
          void audioRef.current.play().then(() => {
            armTrackAdvanceTimer();
          }).catch(() => {});
        } else if (currentPhaseRef.current === 'track') {
          armTrackAdvanceTimer();
        }
      }

      if (silenceAudioRef.current) {
        silenceAudioRef.current.muted = true;
        silenceAudioRef.current.volume = 0;
        silenceAudioRef.current.loop = true;
        silenceAudioRef.current.src = createLoopableSilenceUrl();
        void silenceAudioRef.current.play().catch(() => {});
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reassertPlayback();
      }
    };

    const onPageShow = () => {
      reassertPlayback();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  // Apply volume changes immediately during playback
  useEffect(() => {
    if (status !== 'playing' || trackTransitionRef.current) {
      return;
    }

    setVoiceVolume(clamp(settings.voiceVolume));
  }, [settings.voiceVolume, status]);

  useEffect(() => {
    if (status === 'playing') {
      syncNoisePlayback();
      // Keep silence playing to maintain AudioContext on iOS
      if (silenceAudioRef.current) {
        try {
          silenceAudioRef.current.muted = true;
          silenceAudioRef.current.volume = 0;
          silenceAudioRef.current.src = createLoopableSilenceUrl();
          silenceAudioRef.current.loop = true;
          void silenceAudioRef.current.play().catch(() => {
            // iOS may require user interaction; ignore errors
          });
        } catch {}
      }
    } else {
      // Stop silence when not playing
      if (silenceAudioRef.current) {
        try {
          silenceAudioRef.current.pause();
          silenceAudioRef.current.currentTime = 0;
        } catch {}
      }
    }
  }, [status, settings.noiseVolume, settings.noiseType]);

  function updateSettings(nextSettings: SleepSettings) {
    settingsRef.current = nextSettings;
    setSettingsState(nextSettings);
    // save immediately (no debounce)
    saveSettings(nextSettings);
  }

  function scheduleSessionSave() {
    // save session immediately (no debounce); keep saving but do not auto-restore on startup
    const snapshot = captureSession();
    saveSession(snapshot);
  }

  function clearTrackAdvanceTimer() {
    if (trackAdvanceTimerRef.current) {
      window.clearTimeout(trackAdvanceTimerRef.current);
      trackAdvanceTimerRef.current = null;
    }
  }

  function armTrackAdvanceTimer() {
    clearTrackAdvanceTimer();

    const element = audioRef.current;
    if (!element || currentPhaseRef.current !== 'track' || statusRef.current !== 'playing') {
      return;
    }

    if (!Number.isFinite(element.duration) || element.duration <= 0) {
      return;
    }

    const remainingSeconds = Math.max(0, element.duration - element.currentTime);
    if (remainingSeconds <= 0) {
      return;
    }

    trackAdvanceTimerRef.current = window.setTimeout(() => {
      trackAdvanceTimerRef.current = null;
      if (statusRef.current === 'playing' && currentPhaseRef.current === 'track') {
        onAudioEnded();
      }
    }, remainingSeconds * 1000 + 250);
  }

  function captureSession(): PlaybackSession | null {
    if (!currentQueueRef.current.length) {
      return null;
    }

      return {
      isPlaying: statusRef.current === 'playing',
      queue: currentQueueRef.current.map((item) => ({
        id: item.id,
        stage: item.stage,
        order: item.order,
        title: item.title,
        audioUrl: item.audioUrl,
          delayAfterMs: item.delayAfterMs,
          silenceRepeat: item.silenceRepeat,
      })),
      currentIndex: currentIndexRef.current,
      currentTime: currentTimeRef.current,
      phase: currentPhaseRef.current,
      gapRemainingMs: currentGapRemainingRef.current,
      timerEndsAt: timerEndsAtRef.current,
      updatedAt: Date.now(),
    };
  }

  function startPlayback() {
    const nextQueue = createQueue(settings);
    currentQueueRef.current = nextQueue;
    currentIndexRef.current = 0;
    currentPhaseRef.current = 'track';
    currentGapRemainingRef.current = 0;
    currentTimeRef.current = 0;

    setQueue(nextQueue);
    setCurrentIndex(0);
    setPhase('track');
    setCurrentTime(0);
    setGapRemainingMs(0);
    const endsAt = Date.now() + settings.timerMinutes * 60_000;
    setTimerEndsAt(endsAt);
    timerEndsAtRef.current = endsAt;
    updateStatus('playing');
    setStatusMessage('再生を開始しました。');

    void startCurrentTrack(nextQueue[0]);

    scheduleSessionSave();
  }

  async function continuePlayback(restored = false) {
    const nextQueue = currentQueueRef.current.length ? currentQueueRef.current : queue;
    if (!nextQueue.length) {
      return;
    }

    updateStatus('playing');
    setStatusMessage('再開しました。');
    if (currentPhaseRef.current === 'track') {
      await startCurrentTrack(nextQueue[currentIndexRef.current] ?? nextQueue[0], currentTimeRef.current);
    } else {
      const nextItem = nextQueue[currentIndexRef.current];
      const silenceRepeat = nextItem?.silenceRepeat ?? 0;
      scheduleGap(currentGapRemainingRef.current || nextItem?.delayAfterMs || 0, silenceRepeat);
    }

    scheduleSessionSave();
  }

  function pausePlayback() {
    if (status !== 'playing') {
      return;
    }

    if (gapTimerRef.current) {
      window.clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
    clearTrackAdvanceTimer();

    // clear any repeating-silence activity
    clearSilenceRepeatInterval();

    updateStatus('paused');
    // fade down audio and noise to avoid clicks
    if (audioRef.current) {
      void fadeAudioTo(0, 120).then(() => {
        audioRef.current?.pause();
      });
    }

    // Only stop noise if we're not in a gap (gap keeps noise running)
    if (currentPhaseRef.current !== 'gap' && noiseControllerRef.current) {
      void fadeOutNoiseAndStop();
    }

    if (phase === 'gap') {
      const elapsed = Math.max(0, Date.now() - gapStartedAtRef.current);
      currentGapRemainingRef.current = Math.max(0, gapRemainingMs - elapsed);
      setGapRemainingMs(currentGapRemainingRef.current);
    }

    setStatusMessage('一時停止しました。');
    scheduleSessionSave();
  }

  function stopPlayback(message = '停止しました。') {
    if (gapTimerRef.current) {
      window.clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
    clearTrackAdvanceTimer();

    // fade out audio then remove src
    if (audioRef.current) {
      void fadeAudioTo(0, 120).then(() => {
        try {
          audioRef.current?.pause();
          if (audioRef.current) {
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
        } catch {}
      });
    }

    if (noiseControllerRef.current) {
      void fadeOutNoiseAndStop();
    }

    // Stop silence audio
    if (silenceAudioRef.current) {
      try {
        silenceAudioRef.current.pause();
        silenceAudioRef.current.currentTime = 0;
      } catch {}
    }
    clearSilenceRepeatInterval();

    currentQueueRef.current = [];
    currentIndexRef.current = 0;
    currentPhaseRef.current = 'track';
    currentGapRemainingRef.current = 0;
    currentTimeRef.current = 0;
    timerEndsAtRef.current = null;

    setQueue([]);
    setCurrentIndex(0);
    setPhase('track');
    setCurrentTime(0);
    setGapRemainingMs(0);
    setTimerEndsAt(null);
    updateStatus('idle');
    setStatusMessage(message);
    saveSession(null);
  }

  async function startCurrentTrack(track: QueueItem | undefined, resumeTime = 0) {
    if (!track || !audioRef.current) {
      return;
    }

    if (gapTimerRef.current) {
      window.clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
    clearTrackAdvanceTimer();

    trackTransitionRef.current = true;
    // prepare audio with volume 0 to avoid click
    if (audioRef.current) {
      try {
        audioRef.current.volume = 1;
        setVoiceVolume(0);
        audioRef.current.pause();
        if (audioRef.current.src !== new URL(track.audioUrl, window.location.href).toString()) {
          audioRef.current.src = track.audioUrl;
          audioRef.current.load(); // reset only when source actually changed
        }
        if (resumeTime > 0) {
          audioRef.current.currentTime = resumeTime;
        }
      } catch (err) {
        console.warn('Audio reset warning:', err);
      }
    }
    const voiceVol = clamp(settings.voiceVolume);

    console.log(`Starting track: ${track.speechContent}, volume: ${Math.round(voiceVol * 100)}%, src: ${track.audioUrl}`);

    // Relies on useEffect to manage noise based on status and settings.
    // Noise is started/stopped by pause/continue/stopPlayback functions and useEffect hook.

    try {
      await audioRef.current.play();
      // fade up to desired voice volume
      await fadeAudioTo(voiceVol, 180);
      setPhase('track');
      currentPhaseRef.current = 'track';
      updateStatus('playing');
      setCurrentTime(audioRef.current.currentTime);
      currentTimeRef.current = audioRef.current.currentTime;
      setStatusMessage(`${getStageLabel(track.stage)} を再生中です。`);
      armTrackAdvanceTimer();
    } catch (error) {
      console.error('Play error:', error);
      updateStatus('paused');
      setStatusMessage('再生の開始にユーザー操作が必要です。再開ボタンを押してください。');
    } finally {
      trackTransitionRef.current = false;
    }
  }

  function clearSilenceRepeatInterval() {
    if (silenceRepeatIntervalRef.current) {
      window.clearInterval(silenceRepeatIntervalRef.current);
      silenceRepeatIntervalRef.current = null;
    }
    silenceRepeatRemainingRef.current = 0;
    if (silenceEndedHandlerRef.current && silenceAudioRef.current) {
      silenceAudioRef.current.removeEventListener('ended', silenceEndedHandlerRef.current);
      silenceEndedHandlerRef.current = null;
    }
  }

  function scheduleGap(delayMs: number, silenceRepeat = 0) {
    console.debug('scheduleGap requested', {
      currentIndex: currentIndexRef.current,
      delayMs,
      silenceRepeat,
      currentId: currentQueueRef.current[currentIndexRef.current]?.id,
    });

    if (gapTimerRef.current) {
      window.clearTimeout(gapTimerRef.current);
    }
    clearTrackAdvanceTimer();

    // clear any previous repeated-silence interval
    clearSilenceRepeatInterval();

    const nextDelay = Math.max(0, delayMs);
    // Always schedule the gap even when the tab is not visible. Background
    // throttling can affect timers, so repeated 1s silence uses the audio
    // element's "ended" events which are more reliable in background.

    if (statusRef.current !== 'playing') {
      updateStatus('playing');
    }
    currentPhaseRef.current = 'gap';
    setPhase('gap');
    setGapRemainingMs(nextDelay);
    currentGapRemainingRef.current = nextDelay;
    gapStartedAtRef.current = Date.now();

    if (nextDelay === 0) {
      advanceQueue();
      return;
    }

    // If we have a requested number of 1s silent segments, attempt to play
    // them explicitly (1s × N). We still keep the overall gap timer as a
    // fallback in case playback is blocked.
    if (silenceRepeat > 0 && silenceAudioRef.current) {
      const s = silenceAudioRef.current;
      try {
        s.muted = true;
        s.volume = 0;
        s.loop = false;
        s.src = createLoopableSilenceUrl();
        s.currentTime = 0;
      } catch {}

      silenceRepeatRemainingRef.current = silenceRepeat;

      // Play once immediately.
      try {
        void s.play().catch(() => {});
      } catch {}

      // Use the 'ended' event to chain subsequent 1s silent plays. This is
      // more reliable when the page is backgrounded compared to setInterval.
      const handler = function () {
        // decrement remaining after each ended
        silenceRepeatRemainingRef.current -= 1;
        if (silenceRepeatRemainingRef.current <= 0) {
          // cleanup
          if (silenceEndedHandlerRef.current && silenceAudioRef.current) {
            silenceAudioRef.current.removeEventListener('ended', silenceEndedHandlerRef.current);
          }
          silenceEndedHandlerRef.current = null;
          return;
        }

        try {
          // replay the silence clip
          if (silenceAudioRef.current) {
            silenceAudioRef.current.currentTime = 0;
            void silenceAudioRef.current.play().catch(() => {});
          }
        } catch {}
      };

      silenceEndedHandlerRef.current = handler;
      s.addEventListener('ended', handler);
    }

    gapTimerRef.current = window.setTimeout(() => {
      gapTimerRef.current = null;
      clearSilenceRepeatInterval();
      console.debug('gap timeout fired', { currentIndex: currentIndexRef.current });
      advanceQueue();
    }, nextDelay);
  }

  function advanceQueue() {
    const nextIndex = currentIndexRef.current + 1;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);

    const nextTrack = currentQueueRef.current[nextIndex];
    if (!nextTrack) {
      stopPlayback('すべての工程が完了しました。');
      return;
    }

    setStatusMessage(`次の工程に進みます: ${getStageLabel(nextTrack.stage)}`);
    void startCurrentTrack(nextTrack);
    scheduleSessionSave();
  }

  function getCurrentShuffleGapMs(track: QueueItem) {
    // Use the delay already computed when the queue was built. Prefer the
    // explicit `delayAfterMs`; if that's missing or zero but a
    // `silenceRepeat` exists, use that as a fallback (1s × N).
    if (!track) return 0;
    if (typeof track.delayAfterMs === 'number' && track.delayAfterMs > 0) {
      return track.delayAfterMs;
    }
    if (typeof track.silenceRepeat === 'number' && track.silenceRepeat > 0) {
      return track.silenceRepeat * 1000;
    }
    return 0;
  }

  function onAudioPause() {
    if (trackTransitionRef.current) {
      return;
    }

    const element = audioRef.current;
    if (element && element.ended) {
      return;
    }

    if (
      element &&
      Number.isFinite(element.duration) &&
      element.duration > 0 &&
      element.currentTime >= element.duration - 0.05
    ) {
      return;
    }

    if (currentPhaseRef.current === 'gap') {
      return;
    }

    if (statusRef.current === 'playing') {
      updateStatus('paused');
    }
  }

  function onAudioEnded() {
    const now = Date.now();
    if (now - lastAdvanceAtRef.current < 250) {
      return;
    }
    lastAdvanceAtRef.current = now;

    clearTrackAdvanceTimer();
    const currentTrack = currentQueueRef.current[currentIndexRef.current];
    if (!currentTrack) {
      stopPlayback();
      return;
    }

    const delayAfterMs = getCurrentShuffleGapMs(currentTrack);
    const silenceRepeat = currentTrack.silenceRepeat ?? 0;
    console.debug('onAudioEnded:', { id: currentTrack.id, delayAfterMs, silenceRepeat });
    if (delayAfterMs > 0) {
      scheduleGap(delayAfterMs, silenceRepeat);
      scheduleSessionSave();
      return;
    }

    advanceQueue();
  }

  function onTimeUpdate() {
    const nextTime = audioRef.current?.currentTime ?? 0;
    currentTimeRef.current = nextTime;
    setCurrentTime(nextTime);

    if (currentPhaseRef.current === 'track' && audioRef.current) {
      const duration = audioRef.current.duration;
      if (Number.isFinite(duration) && duration > 0) {
        if (nextTime >= duration - 0.05) {
          onAudioEnded();
          return;
        }

        armTrackAdvanceTimer();
      }
    }
  }

  function adjustSettings(next: Partial<SleepSettings>) {
    updateSettings({ ...settings, ...next });
  }

  function warmupSequence() {
    if (warmupAbortRef.current) {
      warmupAbortRef.current.abort();
    }

    const controller = new AbortController();
    warmupAbortRef.current = controller;
    const warmStages: StageId[] = ['pmr', 'breathing', 'shuffle'];

    const run = async () => {
      for (const stage of warmStages) {
        if (controller.signal.aborted) {
          return;
        }

        const tracks = sleepLibrary.stages[stage];
        if (!tracks.length) {
          continue;
        }

        for (const track of tracks) {
          if (controller.signal.aborted) {
            return;
          }

          try {
            const response = await fetch(track.audioUrl, { cache: 'reload' });
            if (!response.ok) {
              continue;
            }

            const cache = await caches.open('sleep-guide-moca-media-v1');
            await cache.put(track.audioUrl, response.clone());
          } catch {
            // warmup is best effort
          }
        }
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        void run();
      });
    } else {
      globalThis.setTimeout(() => {
        void run();
      }, 250);
    }
  }

  function setMediaSession(track: QueueItem | null, currentPhaseValue: 'track' | 'gap', currentStatus: PlaybackStatus) {
    if (!('mediaSession' in navigator)) {
      return;
    }

    const stage = track?.stage ?? 'pmr';
    const label = track ? `${getStageLabel(stage)} / ${track.speechContent}` : '待機中';
    const subtitle = currentPhaseValue === 'gap' ? '次の工程を準備中' : currentStatus === 'playing' ? '再生中' : '停止中';
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: label,
      artist: '宮舞モカ',
      album: '宮舞モカとおやすみ',
      artwork: [
        { src: buildArtworkDataUri(stage, subtitle), sizes: '96x96', type: 'image/svg+xml' },
        { src: buildArtworkDataUri(stage, subtitle), sizes: '128x128', type: 'image/svg+xml' },
        { src: buildArtworkDataUri(stage, subtitle), sizes: '256x256', type: 'image/svg+xml' },
      ],
    });

    navigator.mediaSession.playbackState = currentStatus === 'playing' ? 'playing' : 'paused';
    navigator.mediaSession.setActionHandler('play', () => {
      if (status === 'playing') {
        return;
      }
      void continuePlayback();
    });
    navigator.mediaSession.setActionHandler('pause', () => pausePlayback());
    navigator.mediaSession.setActionHandler('stop', () => stopPlayback('停止しました。'));
    navigator.mediaSession.setActionHandler('nexttrack', () => advanceQueue());
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const previousIndex = Math.max(0, currentIndexRef.current - 1);
      if (!currentQueueRef.current.length) {
        return;
      }

      currentIndexRef.current = previousIndex;
      setCurrentIndex(previousIndex);
      void startCurrentTrack(currentQueueRef.current[previousIndex], 0);
    });
  }

  function clamp(value: number) {
    return Math.min(1, Math.max(0, value));
  }

  function ensureVoiceAudioGraph() {
    return audioRef.current;
  }

  function setVoiceVolume(volume: number, timeConstant = 0.02) {
    const clamped = clamp(volume);
    const element = ensureVoiceAudioGraph();
    if (element) {
      try {
        element.volume = clamped;
      } catch {
        // ignore
      }
    }
  }

  function syncNoisePlayback() {
    const noiseVol = clamp(settingsRef.current.noiseVolume * 0.25);
    if (!noiseControllerRef.current) return;
    
    if (noiseVol > 0.001) {
      // Start only on first call, then just adjust volume
      void noiseControllerRef.current.start(noiseVol, settingsRef.current.noiseType, 0.02);
    } else {
      noiseControllerRef.current.setVolume(0);
    }
  }

  function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async function fadeAudioTo(target: number, duration = 200) {
    const start = audioRef.current?.volume ?? 1;
    const delta = target - start;
    if (duration <= 0) {
      setVoiceVolume(clamp(target));
      return;
    }

    const steps = Math.max(4, Math.floor(duration / 16));
    for (let i = 1; i <= steps; i += 1) {
      const v = start + (delta * i) / steps;
      setVoiceVolume(clamp(v));
      // small await to allow browser to apply
      // eslint-disable-next-line no-await-in-loop
      await sleep(Math.floor(duration / steps));
    }
  }

  async function fadeOutNoiseAndStop() {
    const ctrl = noiseControllerRef.current;
    if (!ctrl) return;
    try {
      ctrl.setVolume(0);
      await sleep(80);
    } finally {
      try {
        ctrl.stop();
      } catch {}
    }
  }

  function randomBetween(min: number, max: number, seed: number) {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    let value = seed >>> 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    const ratio = (value >>> 0) / 4294967296;
    return low + (high - low) * ratio;
  }

  function updateStatus(nextStatus: PlaybackStatus) {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }

  const volumeSummary = useMemo(
    () => ({
      voice: Math.round(settings.voiceVolume * 100),
      noise: Math.round(settings.noiseVolume * 0.25 * 100),
    }),
    [settings.noiseVolume, settings.voiceVolume],
  );

  return (
    <main className={`app-shell ${status === 'playing' ? 'is-playing' : ''}`}>
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onLoadedMetadata={armTrackAdvanceTimer}
        onDurationChange={armTrackAdvanceTimer}
        onEnded={onAudioEnded}
        onTimeUpdate={onTimeUpdate}
        onError={(e) => {
          const err = audioRef.current?.error;
          const msg = err ? `Audio error: ${err.code} ${err.message}` : 'Unknown audio error';
          console.error(msg, 'src:', audioRef.current?.src);
          setStatusMessage(msg);
        }}
        onPause={onAudioPause}
      />

      {/* Hidden audio element for silence during gaps - keeps AudioContext alive on iOS */}
      <audio
        ref={silenceAudioRef}
        preload="auto"
        playsInline
        muted
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          left: '-9999px',
          top: 'auto',
        }}
      />

      <section className="main-content">
        <div className="speech-section">
          <div className="stage-label">{activeTrack ? getStageLabel(activeTrack.stage) : '漸進的筋弛緩法　▶　4-7-8呼吸法　▶　認知シャッフル睡眠法'}</div>
          <div className="speech-text">{activeTrack?.speechContent ?? '私と一緒に心を落ち着けて、深い眠りに就きましょう'}</div>
        </div>
        
        <div className="character-section">
          <div className="hero-buttons">
            <button
              className="primary icon"
              onClick={status === 'playing' ? pausePlayback : status === 'paused' ? () => void continuePlayback() : startPlayback}
              aria-label={status === 'playing' ? '一時停止' : status === 'paused' ? '再開' : '再生'}
            >
              {status === 'playing' ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              className="secondary icon"
              onClick={() => stopPlayback('停止しました。')}
              aria-label="停止"
            >
              <StopIcon />
            </button>
          </div>
          <div className="character-wrapper">
            <CharacterDisplay 
              stage={activeTrack?.stage ?? 'pmr'}
              subStage={Math.min(queue.length, currentIndex)}
              isPlaying={status === 'playing'}
            />
          </div>
        </div>
      </section>

      <section className="controls-grid">


        <article className="panel">
          <div className="panel-head">
          </div>

          <Slider label="ボイス音量" value={settings.voiceVolume} onChange={(value) => adjustSettings({ voiceVolume: value })} />
          <Slider 
            label="ノイズ音量" 
            value={settings.noiseVolume} 
            onChange={(value) => adjustSettings({ noiseVolume: value })} 
            extra={
              <select
                title="noise-type"
                value={settings.noiseType}
                onChange={(e) => adjustSettings({ noiseType: e.target.value as any })}
              >
                <option value="white">ホワイトノイズ</option>
                <option value="pink">ピンクノイズ</option>
                <option value="brown">ブラウンノイズ</option>
              </select>
            }
          />
        </article>

        <article className="panel">
          <div className="panel-head">
            </div>

          <div className="range-grid">
            <label>
              <span>シャッフル間隔（秒）</span>
              <input
                type="number"
                min={0.5}
                max={60}
                step={0.1}
                value={settings.shuffleGapSec}
                onChange={(event) => adjustSettings({ shuffleGapSec: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>スリープタイマー</span>
              <select
                value={settings.timerMinutes}
                onChange={(event) => adjustSettings({ timerMinutes: Number(event.target.value) })}
              >
                {[15, 20, 30, 45, 60, 90].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes}分
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="help-text">再開時は、同じ単語列と位置を維持したまま続行します。</p>
        </article>
      </section>

      {/* 再生キューパネルは UI 簡素化のため削除 */}

      <input type="hidden" aria-hidden="true" value={phase} readOnly />
    </main>
  );
}

function Slider({ label, value, onChange, extra }: { label: string; value: number; onChange: (value: number) => void; extra?: React.ReactNode }) {
  return (
    <label className="slider-row">
      <div className="slider-content">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {label}
          {extra}
        </div>
        <div className="slider-row-controls">
          <input type="range" min={0} max={1} step={0.01} value={value} onChange={(event) => onChange(Number(event.target.value))} />
          <strong className="slider-percentage">{Math.round(value * 100)}%</strong>
        </div>
      </div>
    </label>
  );
}

function WatsonIcon() {
  return (
    <div className="watson-icon">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C10.3 2 9 3.3 9 5V6.1C7.3 6.6 6 8.1 6 10V17C6 18.1 6.9 19 8 19H16C17.1 19 18 18.1 18 17V10C18 8.1 16.7 6.6 15 6.1V5C15 3.3 13.7 2 12 2ZM11 5C11 4.4 11.4 4 12 4C12.6 4 13 4.4 13 5V6H11V5ZM8 10C8 8.9 8.9 8 10 8H14C15.1 8 16 8.9 16 10V17H8V10ZM10 11V13H11V11H10ZM13 11V13H14V11H13ZM10 14V16H11V14H10ZM13 14V16H14V14H13Z" fill="currentColor"/>
        <path d="M7 21C7 20.4 7.4 20 8 20H16C16.6 20 17 20.4 17 21C17 21.6 16.6 22 16 22H8C7.4 22 7 21.6 7 21Z" fill="currentColor"/>
        {/* Cat Ears */}
        <path d="M6 8L4 5L8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin='round'/>
        <path d="M18 8L20 5L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin='round'/>
      </svg>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 3.868v16.264A1 1 0 0 0 6.57 21.2l12.86-8.664A1 1 0 0 0 19.43 11.46L6.57 2.796A1 1 0 0 0 5 3.868z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="4" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="15" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  );
}