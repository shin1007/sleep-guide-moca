/**
 * Generate a data URL for silent audio that can be used to keep AudioContext alive on iOS
 */
export function createSilenceAudioUrl(durationSeconds: number): string {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  
  // Create a WAV file with silence
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = totalSamples * blockAlign;
  
  // WAV header
  const wav = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wav);
  
  // "RIFF" chunk descriptor
  view.setUint32(0, 0x46464952, true); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  view.setUint32(8, 0x45564157, true); // "WAVE"
  
  // "fmt " subchunk
  view.setUint32(12, 0x20746366, true); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample
  
  // "data" subchunk
  view.setUint32(36, 0x61746164, true); // "data"
  view.setUint32(40, dataSize, true); // Subchunk2Size
  
  // Data is already all zeros (silence), so we just need the header
  
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Create a continuous silence data URL that can loop indefinitely
 */
export function createLoopableSilenceUrl(): string {
  return createSilenceAudioUrl(1.0); // 1 second of silence
}
