export type NoiseType = 'white' | 'pink' | 'brown';

export interface WhiteNoiseController {
  start(volume: number, type?: NoiseType, timeConstant?: number): Promise<void>;
  setVolume(volume: number, timeConstant?: number): void;
  stop(): void;
}

export function createWhiteNoiseController() {
  let context: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  let gainNode: GainNode | null = null;
  let currentType: NoiseType | null = null;
  let pendingVolume = 0.18;

  async function ensureStarted(volume: number, type: NoiseType, timeConstant?: number) {
    pendingVolume = volume;

    if (!context) {
      context = new AudioContext();
    }

    if (context.state === 'suspended') {
      await context.resume();
    }

    // If already running with a different type, stop first
    if (source && currentType !== type) {
      try {
        source.stop();
      } catch {}
      source.disconnect();
      source = null;
    }

    let isFreshStart = false;
    if (!source) {
      if (volume < 0.001) {
        return;
      }

      isFreshStart = true;
      currentType = type;
      const buffer = buildNoiseBuffer(context, 2, type);
      const filter = context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 400; // Lowered slightly for richer pink/brown

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
      source.start();
    }

    if (gainNode) {
      if (isFreshStart) {
        gainNode.gain.value = 0;
      }
      const tc = timeConstant ?? (isFreshStart ? 0.8 : 0.02);
      gainNode.gain.setTargetAtTime(volume, context.currentTime, tc);
    }
  }

  return {
    async start(volume: number, type: NoiseType = 'white', timeConstant?: number) {
      await ensureStarted(volume, type, timeConstant);
    },
    setVolume(volume: number, timeConstant = 0.02) {
      pendingVolume = volume;
      if (context && gainNode) {
        gainNode.gain.setTargetAtTime(volume, context.currentTime, timeConstant);
      }
    },
    stop() {
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