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

    return () => {
      element.removeEventListener('ended', handleEndedNative);
      element.removeEventListener('timeupdate', handleTimeUpdateNative);
      element.removeEventListener('pause', handlePauseNative);
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

    setVoiceVolume(clamp(settings.masterVolume * settings.voiceVolume));
  }, [settings.masterVolume, settings.voiceVolume, status]);

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
  }, [status, settings.masterVolume, settings.noiseVolume, settings.noiseType]);

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
      scheduleGap(currentGapRemainingRef.current || nextQueue[currentIndexRef.current]?.delayAfterMs || 0);
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
    const voiceVol = clamp(settings.masterVolume * settings.voiceVolume);

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

  function scheduleGap(delayMs: number) {
    if (gapTimerRef.current) {
      window.clearTimeout(gapTimerRef.current);
    }
    clearTrackAdvanceTimer();

    const nextDelay = Math.max(0, delayMs);
    if (document.visibilityState !== 'visible') {
      currentPhaseRef.current = 'track';
      setPhase('track');
      setGapRemainingMs(0);
      currentGapRemainingRef.current = 0;
      advanceQueue();
      return;
    }

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

    gapTimerRef.current = window.setTimeout(() => {
      gapTimerRef.current = null;
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
    if (track.stage !== 'shuffle' || track.order === 0) {
      return track.delayAfterMs;
    }

    const nextTrack = currentQueueRef.current[currentIndexRef.current + 1];
    if (!nextTrack || nextTrack.stage !== 'shuffle') {
      return 0;
    }

    const currentSettings = settingsRef.current;
    return randomBetween(currentSettings.shuffleMinGapSec, currentSettings.shuffleMaxGapSec, currentIndexRef.current + 11) * 1000;
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
    if (delayAfterMs > 0) {
      scheduleGap(delayAfterMs);
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
    const noiseVol = clamp(settingsRef.current.masterVolume * settingsRef.current.noiseVolume * 0.25);
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
      voice: Math.round(settings.voiceVolume * settings.masterVolume * 100),
      noise: Math.round(settings.noiseVolume * settings.masterVolume * 0.25 * 100),
    }),
    [settings.masterVolume, settings.noiseVolume, settings.voiceVolume],
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
          <div className="stage-label">{activeTrack ? getStageLabel(activeTrack.stage) : '待機中...'}</div>
          <div className="speech-text">{activeTrack?.speechContent ?? '漸進的筋弛緩法　▶　4-7-8呼吸法　▶　認知シャッフル睡眠法 の順で進みます'}</div>
        </div>
        
        <div className="character-section">
          <div className="character-wrapper">
            <CharacterDisplay 
              stage={activeTrack?.stage ?? 'pmr'}
              subStage={Math.min(queue.length, currentIndex)}
              isPlaying={status === 'playing'}
            />
          </div>
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
        </div>
      </section>

      <section className="controls-grid">


        <article className="panel">
          <div className="panel-head">
            <h2>音量ミキサー</h2>
          </div>

          <Slider label="マスター音量" value={settings.masterVolume} onChange={(value) => adjustSettings({ masterVolume: value })} />
          <Slider label="ボイス音量" value={settings.voiceVolume} onChange={(value) => adjustSettings({ voiceVolume: value })} />
          <Slider 
            label="ノイズ音量" 
            value={settings.noiseVolume} 
            onChange={(value) => adjustSettings({ noiseVolume: value })} 
            extra={
              <select
                value={settings.noiseType}
                onChange={(e) => adjustSettings({ noiseType: e.target.value as any })}
              >
                <option value="white">ホワイト</option>
                <option value="pink">ピンク</option>
                <option value="brown">ブラウン</option>
              </select>
            }
          />
        </article>

        <article className="panel">
          <div className="panel-head">
              <h2>認知シャッフル</h2>
            </div>

          <div className="range-grid">
            <label>
              <span>最小間隔</span>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.1}
                value={settings.shuffleMinGapSec}
                onChange={(event) => adjustSettings({ shuffleMinGapSec: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>最大間隔</span>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.1}
                value={settings.shuffleMaxGapSec}
                onChange={(event) => adjustSettings({ shuffleMaxGapSec: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="timer-row">
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
            <div className="timer-remaining">{timerEndsAt ? `終了予定 ${new Date(timerEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '未設定'}</div>
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
      <span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {label}
          {extra}
        </div>
        <strong>{Math.round(value * 100)}%</strong>
      </span>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(event) => onChange(Number(event.target.value))} />
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