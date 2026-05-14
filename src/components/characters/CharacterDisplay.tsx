import React from 'react';
import { Character, CharacterExpression } from './Character';

interface CharacterDisplayProps {
  stage: 'pmr' | 'breathing' | 'shuffle';
  subStage?: number; // 各ステージ内での進行度
  isPlaying?: boolean;
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
  const getCharacterExpression = (): CharacterExpression => {
    if (!isPlaying) {
      // デフォルトはリラックス状態
      return 'relaxed_1';
    }

    switch (stage) {
      case 'pmr':
        // 漸進的筋弛緩法のステージ
        if (subStage < 5) {
          // 初期段階：リラックス状態
          return 'relaxed_1';
        } else if (subStage < 15) {
          // 中盤：力を入れている
          return 'muscle_relax_1';
        } else if (subStage < 25) {
          // 脱力中
          return 'muscle_relax_2';
        } else {
          // 完全脱力
          return 'muscle_relax_3';
        }

      case 'breathing':
        // 4-7-8呼吸法のステージ
        if (subStage === 0) {
          // 吸気
          return 'breathing_1';
        } else if (subStage === 1) {
          // 保持
          return 'breathing_2';
        } else {
          // 呼気
          return 'breathing_3';
        }

      case 'shuffle':
        // 認知シャッフルのステージ
        if (subStage < 20) {
          // 初期段階：瞑想を始める
          return 'meditation_1';
        } else if (subStage < 50) {
          // 中盤：深い瞑想
          return 'meditation_2';
        } else if (subStage < 80) {
          // 後期：非常に深い瞑想
          return 'meditation_3';
        } else {
          // 最終段階：浮遊状態、眠気
          return 'floating_1';
        }

      default:
        return 'relaxed_1';
    }
  };

  const expression = getCharacterExpression();

  return (
    <div className="character-display">
      <Character expression={expression} size="large" />
    </div>
  );
};

export default CharacterDisplay;
