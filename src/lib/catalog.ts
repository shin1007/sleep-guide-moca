import { createLoopableSilenceUrl } from './silence';

export type StageId = 'pmr' | 'breathing' | 'shuffle';

export interface TrackInfo {
  id: string;
  stage: StageId;
  order: number;
  title: string;
  audioUrl: string;
  speechContent: string;
}

export interface QueueItem extends TrackInfo {
  delayAfterMs: number;
}

export interface SleepSettings {
  masterVolume: number;
  voiceVolume: number;
  noiseVolume: number;
  noiseType: NoiseType;
  shuffleMinGapSec: number;
  shuffleMaxGapSec: number;
  timerMinutes: number;
}

const stageMeta: Record<StageId, { label: string; hue: number }> = {
  pmr: { label: '漸進的筋弛緩法', hue: 28 },
  breathing: { label: '4-7-8呼吸法', hue: 196 },
  shuffle: { label: '認知シャッフル', hue: 250 },
};

const audioModules = {
  ...import.meta.glob('/1-PMR/*.aac', { eager: true, import: 'default' }),
  ...import.meta.glob('/2-478breathing/*.aac', { eager: true, import: 'default' }),
  ...import.meta.glob('/3-cognitive-shuffling/*.aac', { eager: true, import: 'default' }),
} as Record<string, string>;

const textModules = {
  ...import.meta.glob('/1-PMR/*.txt', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/2-478breathing/*.txt', { eager: true, query: '?raw', import: 'default' }),
  ...import.meta.glob('/3-cognitive-shuffling/*.txt', { eager: true, query: '?raw', import: 'default' }),
} as Record<string, string>;

export const defaultSettings: SleepSettings = {
  masterVolume: 0.9,
  voiceVolume: 0.95,
  noiseVolume: 0.01,
  noiseType: 'white',
  shuffleMinGapSec: 5,
  shuffleMaxGapSec: 10,
  timerMinutes: 35,
};

export const sleepLibrary = buildLibrary();

function buildLibrary() {
  const tracks = Object.entries(audioModules)
    .map(([path, audioUrl]) => {
      const textPath = path.replace(/\.aac$/, '.txt');
      const speechContent = textModules[textPath] ?? '';
      return parseTrack(path, audioUrl, speechContent);
    })
    .sort((left, right) => {
      if (left.stage !== right.stage) {
        return stageOrder(left.stage) - stageOrder(right.stage);
      }

      return left.order - right.order;
    });

  const byId = Object.fromEntries(tracks.map((track) => [track.id, track]));

  return {
    tracks,
    byId,
    stages: {
      pmr: tracks.filter((track) => track.stage === 'pmr'),
      breathing: tracks.filter((track) => track.stage === 'breathing'),
      shuffle: tracks.filter((track) => track.stage === 'shuffle'),
    } satisfies Record<StageId, TrackInfo[]>,
  };
}

function stageOrder(stage: StageId) {
  return stage === 'pmr' ? 0 : stage === 'breathing' ? 1 : 2;
}

function parseTrack(path: string, audioUrl: string, speechContent: string): TrackInfo {
  const fileName = path.split('/').pop() ?? path;
  const withoutExt = fileName.replace(/\.aac$/i, '');
  const [folder] = path.split('/').filter(Boolean);
  const stage = resolveStage(folder);
  const order = Number.parseInt(withoutExt.match(/^(\d+)/)?.[1] ?? '0', 10);
  const rawTitle = stripTechniqueSuffix(withoutExt, stage);

  return {
    id: `${stage}:${String(order).padStart(3, '0')}`,
    stage,
    order,
    title: normalizeTitle(rawTitle),
    audioUrl,
    speechContent,
  };
}

function resolveStage(folder: string | undefined): StageId {
  if (folder === '1-PMR') {
    return 'pmr';
  }

  if (folder === '2-478breathing') {
    return 'breathing';
  }

  return 'shuffle';
}

function stripTechniqueSuffix(name: string, stage: StageId) {
  switch (stage) {
    case 'pmr':
      return name.replace(/^\d+-/, '').replace(/-PMR$/i, '');
    case 'breathing':
      return name.replace(/^\d+-/, '').replace(/-4-7-8呼吸法$/i, '');
    case 'shuffle':
      return name.replace(/^\d+-/, '').replace(/-認知シャッフル睡眠法$/i, '');
  }
}

function normalizeTitle(title: string) {
  return title.replace(/_/g, ' / ').trim();
}

export function getStageLabel(stage: StageId) {
  return stageMeta[stage].label;
}

export function getStageHue(stage: StageId) {
  return stageMeta[stage].hue;
}

export function createQueue(settings: SleepSettings) {
  const pmr = sleepLibrary.stages.pmr.map((track) => {
    let queueItems: QueueItem[] = [{ ...track, delayAfterMs: 350 }]; // Default delay

    if ([6, 11, 14, 17, 21, 24].includes(track.order)) {
      // Replace 5-second delay with a 10-second silence track
      const silence5s: QueueItem = {
        id: `pmr:${String(track.order).padStart(3, '0')}:silence:5s`,
        stage: track.stage,
        order: track.order, // Keep original order to maintain sequence context
        title: 'Silence (approx. 5s)', // Indicate approximate duration
        audioUrl: createLoopableSilenceUrl(), // Use the 10s silence URL
        speechContent: '',
        delayAfterMs: 0, // The silence track itself will play
      };
      queueItems = [{ ...track, delayAfterMs: 0 }, silence5s]; // Play original track, then silence
    } else if ([9, 13, 16, 19, 23, 26, 29].includes(track.order)) {
      // Replace 10-second delay with a 10-second silence track
      const silence10s: QueueItem = {
        id: `pmr:${String(track.order).padStart(3, '0')}:silence:10s`,
        stage: track.stage,
        order: track.order, // Keep original order
        title: 'Silence (approx. 10s)', // Indicate approximate duration
        audioUrl: createLoopableSilenceUrl(), // Use the 10s silence URL
        speechContent: '',
        delayAfterMs: 0, // The silence track itself will play
      };
      queueItems = [{ ...track, delayAfterMs: 0 }, silence10s]; // Play original track, then silence
    }
    
    return queueItems;
  }).flat(); // Flatten the array of arrays to a single array of QueueItems
  
  // Split breathing into intro (0-3) and steps (4-6)
  const breathingIntro = sleepLibrary.stages.breathing
    .filter((t) => t.order < 4)
    .map((track) => ({ ...track, delayAfterMs: 300 }));
  const breathingSteps = sleepLibrary.stages.breathing
    .filter((t) => t.order >= 4)
    .map((track) => ({ ...track, delayAfterMs: 300 }));
  // Repeat breathing steps 4 times
  const breathing = [...breathingIntro, ...breathingSteps, ...breathingSteps, ...breathingSteps, ...breathingSteps];

  // Play shuffle-intro tracks (files 000-003) first in order,
  // then play the remaining shuffle tracks (004+) in a seeded shuffled order.
  const shuffleIntro = sleepLibrary.stages.shuffle
    .filter((t) => t.order < 4)
    .map((track) => ({ ...track, delayAfterMs: 300 }));

  const shuffleRemaining = sleepLibrary.stages.shuffle.filter((t) => t.order >= 4);
  const shuffledRemaining = seededShuffle(shuffleRemaining, Date.now());
  const shuffle = shuffledRemaining.map((track, index) => ({
    ...track,
    delayAfterMs:
      index === shuffledRemaining.length - 1
        ? 0
        : randomBetween(settings.shuffleMinGapSec, settings.shuffleMaxGapSec, index + 11) * 1000,
  }));

  return [...pmr, ...breathing, ...shuffleIntro, ...shuffle];
}

export function buildArtworkDataUri(stage: StageId, subtitle: string) {
  const hue = getStageHue(stage);
  const label = getStageLabel(stage);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b1120" />
          <stop offset="100%" stop-color="#050816" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#f97316" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#f97316" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#bg)" />
      <circle cx="256" cy="256" r="256" fill="url(#glow)" />
      
      <!-- Accent Line -->
      <rect x="64" y="340" width="40" height="4" rx="2" fill="#f97316" />
      
      <path d="M122 316c41-7 74-34 85-70 8-26 8-54 0-82 42 8 76 40 86 84 13 57-22 112-78 126-36 9-72 1-93-18z" fill="#fbbf24" />
      
      <text x="64" y="320" fill="#f97316" font-size="24" font-weight="800" font-family="sans-serif" letter-spacing="4">MIYAMAI MOCA</text>
      <text x="64" y="388" fill="#f8fafc" font-size="42" font-weight="800" font-family="sans-serif">${escapeXml(label)}</text>
      <text x="64" y="432" fill="#94a3b8" font-size="24" font-family="sans-serif">${escapeXml(subtitle)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function randomBetween(min: number, max: number, seed: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const ratio = seededRandom(seed);
  return low + (high - low) * ratio;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function seededShuffle<T>(items: T[], seed: number) {
  const output = items.slice();
  let currentSeed = seed >>> 0;

  for (let index = output.length - 1; index > 0; index -= 1) {
    currentSeed += 0x6d2b79f5;
    let value = currentSeed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const random = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    const swapIndex = Math.floor(random * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output;
}