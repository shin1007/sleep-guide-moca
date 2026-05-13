export type NoiseType = 'white' | 'pink' | 'brown';

export interface WhiteNoiseController {
  start(volume: number, type?: NoiseType, timeConstant?: number): Promise<void>;
  setVolume(volume: number, timeConstant?: number): void;
  stop(): void;
  destroy(): void;
}

export function createWhiteNoiseController() {
  let context: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  let gainNode: GainNode | null = null;
  let currentType: NoiseType | null = null;
  let pendingVolume = 0.18;
  let isStarted = false;

  async function ensureStarted(volume: number, type: NoiseType, timeConstant?: number) {
    pendingVolume = volume;

    if (!context) {
      context = new AudioContext();
    }

    if (context.state === 'suspended') {
      await context.resume();
    }

    // If already running with the correct type, just adjust volume
    if (isStarted && currentType === type) {
      if (gainNode && volume !== pendingVolume) {
        const tc = timeConstant ?? 0.02;
        gainNode.gain.setTargetAtTime(volume, context.currentTime, tc);
      }
      return;
    }

    // If type changed, disconnect and restart
    if (source) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
      source = null;
      isStarted = false;
    }

    if (volume < 0.001) {
      return;
    }

    currentType = type;
    const buffer = buildNoiseBuffer(context, 2, type);
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 400;

    if (!gainNode) {
      gainNode = context.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(context.destination);
    }

    source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(filter);
    filter.connect(gainNode);
    
    try {
      source.start();
      isStarted = true;
    } catch (err) {
      console.warn('Failed to start noise source:', err);
      isStarted = false;
      return;
    }

    const tc = 0.8; // Fresh start fade-in
    gainNode.gain.setTargetAtTime(volume, context.currentTime, tc);
  }

  return {
    async start(volume: number, type: NoiseType = 'white', timeConstant?: number) {
      await ensureStarted(volume, type, timeConstant);
    },
    setVolume(volume: number, timeConstant = 0.02) {
      pendingVolume = volume;
      if (context && gainNode && isStarted) {
        try {
          gainNode.gain.setTargetAtTime(volume, context.currentTime, timeConstant);
        } catch (err) {
          console.warn('Failed to set noise volume:', err);
        }
      }
    },
    stop() {
      // Stop and disconnect source, but keep context for reuse (especially on iOS)
      if (source && isStarted) {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      }

      // Mute gain node instead of disconnecting to preserve the audio chain
      if (gainNode && context) {
        try {
          gainNode.gain.setTargetAtTime(0, context.currentTime, 0.02);
        } catch {}
      }

      source = null;
      isStarted = false;
      currentType = null;
      // Keep context and gainNode for reuse on next start()
    },
    destroy() {
      // Fully clean up context - called only on component unmount
      if (source) {
        try {
          source.stop();
        } catch {}
        source.disconnect();
      }

      if (gainNode) {
        gainNode.disconnect();
      }

      if (context && context.state !== 'closed') {
        void context.close();
      }

      context = null;
      source = null;
      gainNode = null;
      currentType = null;
    },
    get pendingVolume() {
      return pendingVolume;
    },
  } satisfies WhiteNoiseController & { pendingVolume: number };
}

function buildNoiseBuffer(context: AudioContext, seconds: number, type: NoiseType) {
  const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * seconds)), context.sampleRate);
  const channel = buffer.getChannelData(0);

  if (type === 'white') {
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    // Voss-McCartney algorithm for pink noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < channel.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750312;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      channel[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      channel[i] *= 0.11; // normalization
      b6 = white * 0.115926;
    }
  } else if (type === 'brown') {
    let lastOut = 0;
    for (let i = 0; i < channel.length; i++) {
      const white = Math.random() * 2 - 1;
      const out = (lastOut + (0.02 * white)) / 1.002;
      channel[i] = out * 3.5; // normalization
      lastOut = out;
    }
  }

  return buffer;
}