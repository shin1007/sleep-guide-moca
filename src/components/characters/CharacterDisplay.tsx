import React from 'react';

interface CharacterDisplayProps {
  stage: 'pmr' | 'breathing' | 'shuffle';
  subStage?: number; // 各ステージ内での進行度
  isPlaying?: boolean;
}

const STANDING_IMAGES = Array.from({ length: 24 }, (_, i) =>
  `/standing/psd/moca-stand-${String(i + 1).padStart(2, '0')}.png`,
);

function pickStageImage(stage: CharacterDisplayProps['stage'], subStage: number): string {
  // 各ステージに対して立ち絵の範囲を割り当てる
  if (stage === 'pmr') {
    const idx = Math.max(0, Math.min(7, subStage % 8));
    return STANDING_IMAGES[idx];
  }

  if (stage === 'breathing') {
    const idx = 8 + Math.max(0, Math.min(5, subStage % 6));
    return STANDING_IMAGES[idx];
  }

  const idx = 14 + Math.max(0, Math.min(9, subStage % 10));
  return STANDING_IMAGES[idx];
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
  const src = isPlaying ? pickStageImage(stage, subStage) : STANDING_IMAGES[0];

  return (
    <div className="character-display">
      <img src={src} alt="宮舞モカの立ち絵" className="character-image" />
    </div>
  );
};

export default CharacterDisplay;
