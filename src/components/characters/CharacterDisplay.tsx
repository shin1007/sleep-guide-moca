import React from 'react';

interface CharacterDisplayProps {
  stage: 'pmr' | 'breathing' | 'shuffle';
  subStage?: number; // 各ステージ内での進行度
  isPlaying?: boolean;
}

// 立ち絵ファイル一覧。番号 11, 17, 19, 23 は削除済みのため配列から除外して明示的に記述。
const PMR_IMAGES = [
  '/standing/psd/moca-stand-01.png',
  '/standing/psd/moca-stand-02.png',
  '/standing/psd/moca-stand-03.png',
  '/standing/psd/moca-stand-04.png',
  '/standing/psd/moca-stand-05.png',
  '/standing/psd/moca-stand-06.png',
  '/standing/psd/moca-stand-07.png',
  '/standing/psd/moca-stand-08.png',
];

const BREATHING_IMAGES = [
  '/standing/psd/moca-stand-09.png',
  '/standing/psd/moca-stand-10.png',
  // 11 は削除
  '/standing/psd/moca-stand-12.png',
  '/standing/psd/moca-stand-13.png',
  '/standing/psd/moca-stand-14.png',
];

const SHUFFLE_IMAGES = [
  '/standing/psd/moca-stand-15.png',
  '/standing/psd/moca-stand-16.png',
  // 17 は削除
  '/standing/psd/moca-stand-18.png',
  // 19 は削除
  '/standing/psd/moca-stand-20.png',
  '/standing/psd/moca-stand-21.png',
  '/standing/psd/moca-stand-22.png',
  // 23 は削除
  '/standing/psd/moca-stand-24.png',
];

function pickStageImage(stage: CharacterDisplayProps['stage'], subStage: number): string {
  if (stage === 'pmr') {
    const idx = Math.abs(subStage) % PMR_IMAGES.length;
    return PMR_IMAGES[idx];
  }

  if (stage === 'breathing') {
    const idx = Math.abs(subStage) % BREATHING_IMAGES.length;
    return BREATHING_IMAGES[idx];
  }

  const idx = Math.abs(subStage) % SHUFFLE_IMAGES.length;
  return SHUFFLE_IMAGES[idx];
}

/**
 * ステージに応じて適切なキャラクター表情を選択するコンポーネント
 * 睡眠ガイドの段階的な状態を視覚的に表現する
 */
export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
  stage,
  subStage = 0,
  isPlaying = false,
}) => {
  // 再生中はステージに応じた画像、停止時は既存の PMR 立ち絵をフォールバックとして使用
  const src = isPlaying ? pickStageImage(stage, subStage) : PMR_IMAGES[0];
  // キャッシュバスト：日時を URL に付与して最新画像を強制的に読み込み
  const bustSrc = `${src}?v=${new Date().toISOString().split('T')[0]}`;

  return (
    <div className="character-display">
      <img src={bustSrc} alt="宮舞モカの立ち絵" className="character-image" />
    </div>
  );
};

export default CharacterDisplay;
