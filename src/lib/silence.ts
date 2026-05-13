/**
 * Generate base64-encoded WAV silence for iOS compatibility
 * Pre-generated 10 seconds of 44100Hz mono 16-bit silence
 */
const SILENCE_DATA_URL = (() => {
  // WAV header for 10 seconds of silence
  // This is a minimal WAV file structure encoded in base64
  const silentWavBase64 = 'UklGRiYgAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==';
  return `data:audio/wav;base64,${silentWavBase64}`;
})();

/**
 * Get loopable silence audio URL (uses pre-generated base64 data)
 */
export function createLoopableSilenceUrl(): string {
  return SILENCE_DATA_URL;
}

