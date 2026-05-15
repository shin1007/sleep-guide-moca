# sleep-guide-moca 仕様書

## 1. アプリケーション概要

**名称**: sleep-guide-moca  
**種類**: 睡眠ガイド PWA (Progressive Web App)  
**目的**: 段階的な睡眠導入支援を提供するアプリケーション  
**対応プラットフォーム**: PC (Chrome/Firefox), iPhone Safari, PWA  

## 2. 機能仕様

### 2.1 再生フロー

アプリケーションは 3 つの段階を順序に従って再生する：

| Stage | 名称 | トラック数 | 役割 |
|-------|------|-----------|------|
| `pmr` | 漸進的筋弛緩法 (PMR) | 30 | 筋肉を緊張・脱力させてリラックスを促進 |
| `breathing` | 4-7-8 呼吸法 | 4 | 副交感神経を優位にする呼吸法 |
| `shuffle` | 認知シャッフル | 100+ | ランダムな単語を浮かべ、思考をリセット |

### 2.2 Shuffle ステージの Gap 機能

Shuffle ステージでは、トラック再生後に無音の Gap 期間が挿入される：

- **Gap 期間**: 固定値（設定 `shuffleGapSec`、秒）
- **目的**: ノイズだけの期間を設けて、単語連想の心理効果を維持
- **ノイズ継続**: Gap 中もノイズは継続再生（途切れない）

### 2.3 タイマー機能

- デフォルト: 35 分
- 設定可能 (`timerMinutes`)
- タイマー終了時に自動停止

### 2.4 再生状態管理

```
PlaybackStatus: 'idle' | 'playing' | 'paused'
Phase: 'track' | 'gap'
```

**フロー**:
```
idle 
  ↓ (startPlayback)
playing → (track or gap phase)
  ↓ (pausePlayback)
paused
  ↓ (advancePlayback)
playing
  ↓ (stopPlayback)
idle
```

---

## 3. ノイズ制御システム

### 3.1 ノイズの種類

- `white`: ホワイトノイズ (全周波数均等)
- `pink`: ピンクノイズ (低周波優位; Voss-McCartney アルゴリズム)
- `brown`: ブラウンノイズ (低周波さらに強調)

### 3.2 ノイズ音量制御

**計算式**:
```
effectiveNoiseVolume = noiseVolume × 0.25
```

- `noiseVolume`: 0～1 (ノイズ相対ボリューム)
- `× 0.25`: ノイズ過大防止の固定係数

**ボリューム更新**:
- 設定変更時のみ `syncNoisePlayback()` が呼ばれる
- gain を `setTargetAtTime()` で 0.02 秒 (20ms) かけてスムーズに調整
- 既に同じ type で running 状態なら source の restart をスキップ

### 3.3 ノイズコントローラー (noise.ts)

**インターフェース**:
```typescript
interface WhiteNoiseController {
  start(volume: number, type?: NoiseType, timeConstant?: number): Promise<void>;
  setVolume(volume: number, timeConstant?: number): void;
  stop(): void;
  destroy(): void;
}
```

**特徴**:
- **Context 再利用**: AudioContext を一度作成したら、アプリ終了時 (`destroy()`) までクローズしない
- **Source 再利用**: 同じ type での `start()` 呼び出し時は、既存 source を再利用 (gain 調整のみ)
- **Type 変更時のみ restart**: type が変わった場合のみ source.stop() → 新規作成
- **iOS 対応**: Context を保持し続けることで、iOS AudioContext の suspend-resume コストを削減

**内部状態**:
- `isStarted`: source が実際に再生中か
- `pendingVolume`: 目標 gain 値
- `currentType`: 現在の noise type

### 3.4 ノイズの実装詳細

**Buffer 生成**:
- バッファ長: 2 秒
- チャネル: stereo (2 ch)
- ノイズ生成: `buildNoiseBuffer()` で毎回新規生成

**Audio Graph**:
```
BufferSource 
  → BiquadFilter (highpass, 400Hz)
  → GainNode
  → destination (speaker)
```

**Loop**:
- `BufferSource.loop = true` で連続再生

---

## 4. iOS Safari 互換性対応

### 4.1 問題点

iOS Safari の AudioContext は、アクティブな HTML audio 要素がない場合、自動的に suspend される。これにより：
- ノイズが途切れる
- gain 調整が失敗する
- 設定変更が反映されない

### 4.2 解決策: 無音 Audio 要素による Context 維持

**実装**:
```typescript
// silenceAudioRef: 隠し audio 要素 (muted)
silenceAudioRef.current.volume = 0;
silenceAudioRef.current.src = createLoopableSilenceUrl();
silenceAudioRef.current.loop = true;
silenceAudioRef.current.play(); // iOS でも動作 (muted なので音は出ない)
```

**タイミング**:
- `status === 'playing'` 時のみ silence 再生開始
- `status !== 'playing'` 時に silence 停止

**Silence データ**:
- **形式**: WAV (10 秒, 44100Hz, mono, 16-bit)
- **エンコード**: base64 (SILENCE_DATA_URL)
- **理由**: Blob URL 生成は iOS で不安定なため、静的な data URL を使用

### 4.3 Context State 管理

```typescript
if (context.state === 'suspended') {
  await context.resume();
}
```

AudioContext が suspend 状態なら、明示的に resume する。

---

## 5. 音声トラック制御

### 5.1 Voice Volume 調整

**計算式**:
```
effectiveVoiceVolume = voiceVolume
```

- 毎回の設定変更で即座に `audioRef.current.volume` に適用
- スムーズな fade は使わず即座反映

### 5.2 トラック終了検出

**Event Handler** (`onPause`):
```typescript
function onPause() {
  if (element.ended && currentPhaseRef.current !== 'gap') {
    // Natural end-of-track: advance queue
    advanceQueue();
  }
  // Ignore pause events that are not end-of-track (e.g., user pause during gap)
}
```

- `element.ended`: 自然終了か確認
- `currentPhaseRef.current !== 'gap'`: gap 中の pause は無視 (gap タイマーが進行中)

### 5.3 Gap スケジューリング

```typescript
function scheduleGap() {
  currentPhaseRef.current = 'gap';
  setPhase('gap');
  
  const gapDurationMs = Math.max(0, Math.floor(settings.shuffleGapSec * 1000));
  
  gapTimerRef.current = setTimeout(() => {
    advanceQueue();
  }, gapDurationMs);
}
```

- gap 中は audio 再生されない (silence のみ)
- ノイズは継続再生
- タイムアウト後に次トラックへ

---

## 6. 設定仕様

### 6.1 SleepSettings インターフェース

```typescript
interface SleepSettings {
  voiceVolume: number;        // 0～1, default: 0.95
  noiseVolume: number;        // 0～1, default: 0.01
  noiseType: NoiseType;       // 'white' | 'pink' | 'brown', default: 'white'
  shuffleGapSec: number;      // 秒, default: 7
  timerMinutes: number;       // default: 35
}
```

### 6.2 設定の永続化

- **保存**: `localStorage` に JSON で保存
- **読み込み**: アプリ起動時に復元
- **自動保存**: 設定変更時に即座に保存 (debounce なし)
- **セッション**: 再生状況も保存するが、起動時に復元しない (設計)

---

## 7. Media Session API

Smartwatch/notification 制御用:
- 現在トラック情報を MediaSession に登録
- Play/Pause コントロール可能

---

## 8. 技術スタック

| 技術 | 用途 |
|------|------|
| React 18 | UI フレームワーク |
| Vite | ビルドツール |
| TypeScript | 言語 |
| Web Audio API | ノイズ生成・制御 |
| HTML Audio Element | トラック再生 |
| localStorage | 設定・セッション保存 |

---

## 9. Key Implementation Details

### 9.1 useEffect 依存配列戦略

**ノイズ同期**:
```typescript
useEffect(() => {
  if (status === 'playing') {
    syncNoisePlayback();
    // ... silence play
  }
}, [status, settings.noiseVolume, settings.noiseType]);
```

- `status` 変更時のみ実行
- 設定変更時もトリガー (gain 調整が必要)

**Voice Volume**:
```typescript
useEffect(() => {
  if (status === 'playing' && audioRef.current) {
    audioRef.current.volume = clamp(settings.voiceVolume);
  }
}, [settings.voiceVolume, ..., status]);
```

- すべての音量・タイプ関連設定で再実行
- ただし `status` が 'playing' でない場合はスキップ

### 9.2 Refs 使用パターン

| Ref | 目的 |
|-----|------|
| `audioRef` | 声トラック再生要素 |
| `silenceAudioRef` | 隠し無音要素 (iOS Context 維持用) |
| `noiseControllerRef` | ノイズ制御オブジェクト |
| `gapTimerRef` | gap タイムアウト |
| `settingsRef` | 最新設定 (イベントハンドラから即座アクセス) |
| `currentQueueRef` | 現在キュー |
| `currentIndexRef` | 現在トラック index |
| `currentPhaseRef` | 現在フェーズ |

---

## 10. トラブルシューティング

### 10.1 ノイズが途切れる

**症状**: PC Chrome でも iPhone Safari でも、トラック変更時にノイズが一瞬途切れる

**原因**:
- Source を毎回 stop/start していた
- `ensureStarted()` が既存状態を正確に判定していなかった

**対策**: (現行)
- `isStarted` フラグで状態追跡
- 同じ type なら source を再利用 (gain 調整のみ)
- type 変更時のみ restart

### 10.2 iOS Safari で音量スライダー反応なし

**症状**: 音量スライダー移動時に効果がない

**原因**:
- gain 値が更新されていない
- `pendingVolume` との比較が before-update だった

**対策**: (現行)
- `volume !== pendingVolume` チェックを after-update に変更
- `timeConstant` を明示指定 (0.02s, 20ms)
- `setTargetAtTime()` の信頼性向上

### 10.3 iOS Safari で silence 再生失敗

**症状**: AudioContext が suspend されたまま

**原因**:
- Blob URL 生成が不安定
- 無音要素の再生が失敗

**対策**: (現行)
- 静的 base64 encoded WAV を使用
- `.catch()` で play() の失敗を無視

### 10.4 現在抱えている問題

- iOS でボイスの音量スライダーが機能していない
- トラックの合間ごとに停止しているかのような動作がある。iOS ではその間ノイズが再生されない
- PC で、5秒や10秒の待ち時間が機能していない

---

## 11. 今後の最適化案

1. **Service Worker**: キャッシング戦略の改善
2. **Precache**: audio/silence ファイルの事前ロード
3. **Diagnostic Logging**: iOS 固有の AudioContext state を監視
4. **Performance**: ノイズバッファ生成を worker へ
5. **A/B Test**: Gap 期間、ノイズ周波数の効果測定

---

## 12. 参考資料

- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- iOS Audio Context Issues: https://developer.apple.com/forums/
- Voss-McCartney Pink Noise: https://en.wikipedia.org/wiki/Pink_noise
