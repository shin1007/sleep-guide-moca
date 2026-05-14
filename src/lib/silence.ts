// iOS のバックグラウンド維持では、data URL よりも実ファイルのほうが安定しやすい。
// public/silence.wav をそのまま参照する。
const SILENCE_AUDIO_PATH = `${import.meta.env.BASE_URL}silence.wav`;

// ループ再生用の無音ファイル URL を返す。
export function createLoopableSilenceUrl(): string {
  return SILENCE_AUDIO_PATH;
}

