import React from 'react';

export type CharacterExpression = 
  | 'relaxed_1' | 'relaxed_2' | 'relaxed_3' | 'relaxed_4'
  | 'breathing_1' | 'breathing_2' | 'breathing_3'
  | 'muscle_relax_1' | 'muscle_relax_2' | 'muscle_relax_3'
  | 'meditation_1' | 'meditation_2' | 'meditation_3'
  | 'deep_relax_1' | 'deep_relax_2' | 'deep_relax_3'
  | 'eyes_closed_1' | 'eyes_closed_2' | 'eyes_closed_3'
  | 'gentle_smile_1' | 'gentle_smile_2' | 'floating_1';

interface CharacterProps {
  expression: CharacterExpression;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeMap = {
  small: 150,
  medium: 250,
  large: 350,
};

// リラックス表情 - 基本的なリラックス状態
const CharacterRelaxed1: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    {/* 頭 */}
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 優しく閉じている */}
    <ellipse cx="85" cy="70" rx="6" ry="8" fill="#333"/>
    <ellipse cx="115" cy="70" rx="6" ry="8" fill="#333"/>
    {/* 目の下 - 小じわ */}
    <path d="M 82 78 Q 85 80 88 78" stroke="#ccc" strokeWidth="1" fill="none"/>
    <path d="M 112 78 Q 115 80 118 78" stroke="#ccc" strokeWidth="1" fill="none"/>
    {/* 口 - 優しい笑顔 */}
    <path d="M 85 95 Q 100 105 115 95" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 体 */}
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    {/* 両手 - リラックス */}
    <ellipse cx="65" cy="150" rx="12" ry="35" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-20 65 150)"/>
    <ellipse cx="135" cy="150" rx="12" ry="35" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(20 135 150)"/>
    {/* 両脚 */}
    <ellipse cx="85" cy="230" rx="12" ry="30" fill="#333" stroke="#333" strokeWidth="2"/>
    <ellipse cx="115" cy="230" rx="12" ry="30" fill="#333" stroke="#333" strokeWidth="2"/>
  </svg>
);

// リラックス表情2 - より深いリラックス
const CharacterRelaxed2: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 半開き */}
    <path d="M 80 70 Q 85 75 90 70" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M 110 70 Q 115 75 120 70" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 瞼の下の影 */}
    <path d="M 80 72 Q 85 74 90 72" stroke="#ccc" strokeWidth="1" fill="none"/>
    <path d="M 110 72 Q 115 74 120 72" stroke="#ccc" strokeWidth="1" fill="none"/>
    {/* 口 - 穏やかな笑顔 */}
    <path d="M 82 98 Q 100 108 118 98" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="60" cy="155" rx="12" ry="40" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-35 60 155)"/>
    <ellipse cx="140" cy="155" rx="12" ry="40" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(35 140 155)"/>
    <ellipse cx="80" cy="235" rx="12" ry="28" fill="#333"/>
    <ellipse cx="120" cy="235" rx="12" ry="28" fill="#333"/>
  </svg>
);

// リラックス表情3 - 優しい目を閉じた状態
const CharacterRelaxed3: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 完全に閉じた */}
    <ellipse cx="85" cy="72" rx="7" ry="5" fill="#333"/>
    <ellipse cx="115" cy="72" rx="7" ry="5" fill="#333"/>
    {/* 眉 - やや下がった優しい表情 */}
    <path d="M 75 62 Q 85 60 95 62" stroke="#8b6f47" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M 105 62 Q 115 60 125 62" stroke="#8b6f47" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 口 - 穏やかな微笑 */}
    <path d="M 84 100 Q 100 107 116 100" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="62" cy="150" rx="13" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-30 62 150)"/>
    <ellipse cx="138" cy="150" rx="13" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(30 138 150)"/>
    <ellipse cx="78" cy="235" rx="11" ry="30" fill="#333"/>
    <ellipse cx="122" cy="235" rx="11" ry="30" fill="#333"/>
  </svg>
);

// リラックス表情4 - 深いリラックス、頭を傾ける
const CharacterRelaxed4: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(100, 80) rotate(-5)">
      <circle cx="0" cy="0" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
      {/* 目 - ほぼ閉じた */}
      <ellipse cx="-15" cy="-8" rx="6" ry="4" fill="#333"/>
      <ellipse cx="15" cy="-8" rx="6" ry="4" fill="#333"/>
      {/* 眉 */}
      <path d="M -25 -18 Q -15 -20 -5 -18" stroke="#8b6f47" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 5 -18 Q 15 -20 25 -18" stroke="#8b6f47" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* 口 - ほのかな笑顔 */}
      <path d="M -12 12 Q 0 18 12 12" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </g>
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="55" cy="145" rx="12" ry="42" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-40 55 145)"/>
    <ellipse cx="145" cy="155" rx="12" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(25 145 155)"/>
    <ellipse cx="75" cy="238" rx="12" ry="28" fill="#333"/>
    <ellipse cx="125" cy="238" rx="12" ry="28" fill="#333"/>
  </svg>
);

// 呼吸中1 - 吸気
const CharacterBreathing1: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 集中している */}
    <circle cx="85" cy="70" r="5" fill="#333"/>
    <circle cx="115" cy="70" r="5" fill="#333"/>
    {/* 口 - 「すー」と吸っている */}
    <ellipse cx="100" cy="98" rx="8" ry="12" fill="none" stroke="#333" strokeWidth="2"/>
    <path d="M 100 86 L 100 110" stroke="#ccc" strokeWidth="1"/>
    {/* 体 - 少し大きくなった */}
    <ellipse cx="100" cy="160" rx="38" ry="52" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    {/* 手 - 自然な位置 */}
    <ellipse cx="62" cy="150" rx="12" ry="36" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-15 62 150)"/>
    <ellipse cx="138" cy="150" rx="12" ry="36" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(15 138 150)"/>
    <ellipse cx="80" cy="232" rx="12" ry="30" fill="#333"/>
    <ellipse cx="120" cy="232" rx="12" ry="30" fill="#333"/>
  </svg>
);

// 呼吸中2 - 息を止めている
const CharacterBreathing2: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 集中、少し圧力がある */}
    <circle cx="85" cy="70" r="5" fill="#333"/>
    <circle cx="115" cy="70" r="5" fill="#333"/>
    {/* 眉 - 下がった */}
    <path d="M 75 62 Q 85 58 95 62" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 105 62 Q 115 58 125 62" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - 閉じている */}
    <path d="M 82 98 Q 100 102 118 98" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 体 - 少し膨らんでいる */}
    <ellipse cx="100" cy="160" rx="40" ry="53" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="60" cy="150" rx="13" ry="35" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-20 60 150)"/>
    <ellipse cx="140" cy="150" rx="13" ry="35" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(20 140 150)"/>
    <ellipse cx="78" cy="232" rx="12" ry="30" fill="#333"/>
    <ellipse cx="122" cy="232" rx="12" ry="30" fill="#333"/>
  </svg>
);

// 呼吸中3 - 呼気
const CharacterBreathing3: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - リラックス */}
    <path d="M 80 70 Q 85 74 90 70" stroke="#333" strokeWidth="2" fill="none"/>
    <path d="M 110 70 Q 115 74 120 70" stroke="#333" strokeWidth="2" fill="none"/>
    {/* 口 - 「ふー」と吐いている */}
    <ellipse cx="100" cy="100" rx="6" ry="10" fill="none" stroke="#333" strokeWidth="2"/>
    {/* 呼気の線 */}
    <path d="M 94 105 Q 88 110 82 115" stroke="#ccc" strokeWidth="1" fill="none" strokeDasharray="2,2"/>
    <path d="M 100 108 Q 100 115 100 122" stroke="#ccc" strokeWidth="1" fill="none" strokeDasharray="2,2"/>
    <path d="M 106 105 Q 112 110 118 115" stroke="#ccc" strokeWidth="1" fill="none" strokeDasharray="2,2"/>
    {/* 体 - 少し小さくなった */}
    <ellipse cx="100" cy="160" rx="33" ry="48" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="65" cy="150" rx="12" ry="34" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-10 65 150)"/>
    <ellipse cx="135" cy="150" rx="12" ry="34" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(10 135 150)"/>
    <ellipse cx="82" cy="230" rx="11" ry="28" fill="#333"/>
    <ellipse cx="118" cy="230" rx="11" ry="28" fill="#333"/>
  </svg>
);

// 筋弛緩中1 - 力を入れている
const CharacterMuscleRelax1: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 力を入れている */}
    <circle cx="85" cy="70" r="5" fill="#333"/>
    <circle cx="115" cy="70" r="5" fill="#333"/>
    {/* 眉 - 寄った */}
    <path d="M 70 62 Q 85 58 100 62" stroke="#8b6f47" strokeWidth="2.5" fill="none"/>
    <path d="M 100 62 Q 115 58 130 62" stroke="#8b6f47" strokeWidth="2.5" fill="none"/>
    {/* 口 - 歯を食いしばっている */}
    <line x1="82" y1="100" x2="118" y2="100" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
    {/* 体 - 緊張している */}
    <ellipse cx="100" cy="160" rx="36" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2.5"/>
    {/* 腕 - 力こぶ表現 */}
    <ellipse cx="58" cy="145" rx="15" ry="32" fill="#fdbcb4" stroke="#333" strokeWidth="2.5" transform="rotate(-25 58 145)"/>
    <circle cx="50" cy="128" r="6" fill="#d4a574" stroke="#333" strokeWidth="1"/>
    <ellipse cx="142" cy="145" rx="15" ry="32" fill="#fdbcb4" stroke="#333" strokeWidth="2.5" transform="rotate(25 142 145)"/>
    <circle cx="150" cy="128" r="6" fill="#d4a574" stroke="#333" strokeWidth="1"/>
    <ellipse cx="75" cy="235" rx="13" ry="30" fill="#333"/>
    <ellipse cx="125" cy="235" rx="13" ry="30" fill="#333"/>
  </svg>
);

// 筋弛緩中2 - 脱力
const CharacterMuscleRelax2: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 開いたリラックス状態 */}
    <circle cx="85" cy="70" r="5" fill="#333"/>
    <circle cx="115" cy="70" r="5" fill="#333"/>
    {/* 眉 - 正常に戻った */}
    <path d="M 75 62 Q 85 60 95 62" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 105 62 Q 115 60 125 62" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - 優しく開いている */}
    <ellipse cx="100" cy="100" rx="8" ry="6" fill="none" stroke="#333" strokeWidth="2"/>
    {/* 体 - 脱力 */}
    <ellipse cx="100" cy="160" rx="32" ry="48" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    {/* 腕 - だら～んと脱力 */}
    <ellipse cx="55" cy="160" rx="11" ry="40" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-45 55 160)"/>
    <ellipse cx="145" cy="160" rx="11" ry="40" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(45 145 160)"/>
    <ellipse cx="80" cy="235" rx="11" ry="28" fill="#333"/>
    <ellipse cx="120" cy="235" rx="11" ry="28" fill="#333"/>
  </svg>
);

// 筋弛緩中3 - 脱力が進んだ
const CharacterMuscleRelax3: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - ほぼ閉じかけている */}
    <path d="M 80 70 Q 85 73 90 70" stroke="#333" strokeWidth="2" fill="none"/>
    <path d="M 110 70 Q 115 73 120 70" stroke="#333" strokeWidth="2" fill="none"/>
    {/* 口 - 小さく開いている */}
    <ellipse cx="100" cy="100" rx="6" ry="5" fill="none" stroke="#333" strokeWidth="1.5"/>
    {/* 体 - さらに脱力 */}
    <ellipse cx="100" cy="165" rx="30" ry="45" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    {/* 腕 - 完全に脱力 */}
    <ellipse cx="52" cy="170" rx="10" ry="42" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-60 52 170)"/>
    <ellipse cx="148" cy="170" rx="10" ry="42" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(60 148 170)"/>
    <ellipse cx="82" cy="238" rx="10" ry="26" fill="#333"/>
    <ellipse cx="118" cy="238" rx="10" ry="26" fill="#333"/>
  </svg>
);

// 瞑想中1 - 瞑想の始まり
const CharacterMeditation1: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 閉じている */}
    <ellipse cx="85" cy="72" rx="7" ry="5" fill="#333"/>
    <ellipse cx="115" cy="72" rx="7" ry="5" fill="#333"/>
    {/* 眉 - 穏やか */}
    <path d="M 73 62 Q 85 60 97 62" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 103 62 Q 115 60 127 62" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - 穏やかな笑顔 */}
    <path d="M 84 100 Q 100 107 116 100" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 体 */}
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    {/* 手 - 瞑想ポーズ */}
    <ellipse cx="62" cy="165" rx="11" ry="28" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-40 62 165)"/>
    <ellipse cx="138" cy="165" rx="11" ry="28" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(40 138 165)"/>
    {/* 光の輪 - 瞑想中 */}
    <circle cx="100" cy="80" r="52" fill="none" stroke="#ffd700" strokeWidth="1.5" opacity="0.4" strokeDasharray="3,2"/>
    <ellipse cx="80" cy="235" rx="11" ry="30" fill="#333"/>
    <ellipse cx="120" cy="235" rx="11" ry="30" fill="#333"/>
  </svg>
);

// 瞑想中2 - 深い瞑想
const CharacterMeditation2: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 完全に閉じた */}
    <ellipse cx="85" cy="72" rx="7" ry="4" fill="#333"/>
    <ellipse cx="115" cy="72" rx="7" ry="4" fill="#333"/>
    {/* 眉 - やや下がった穏やか */}
    <path d="M 70 60 Q 85 57 100 60" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 100 60 Q 115 57 130 60" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - 穏やかな笑顔 */}
    <path d="M 85 102 Q 100 108 115 102" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 体 */}
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    {/* 手 - 瞑想ポーズ */}
    <ellipse cx="60" cy="170" rx="10" ry="30" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-45 60 170)"/>
    <ellipse cx="140" cy="170" rx="10" ry="30" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(45 140 170)"/>
    {/* 光の輪 - より明るい */}
    <circle cx="100" cy="80" r="55" fill="none" stroke="#ffd700" strokeWidth="2" opacity="0.5" strokeDasharray="4,2"/>
    <circle cx="100" cy="80" r="62" fill="none" stroke="#ffed4e" strokeWidth="1" opacity="0.3" strokeDasharray="5,3"/>
    <ellipse cx="80" cy="235" rx="11" ry="30" fill="#333"/>
    <ellipse cx="120" cy="235" rx="11" ry="30" fill="#333"/>
  </svg>
);

// 瞑想中3 - 超深い瞑想
const CharacterMeditation3: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 完全に閉じている */}
    <line x1="80" y1="72" x2="90" y2="72" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
    <line x1="110" y1="72" x2="120" y2="72" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
    {/* 眉 - 穏やか */}
    <path d="M 68 58 Q 85 55 102 58" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 98 58 Q 115 55 132 58" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - ほのかな笑顔 */}
    <path d="M 86 103 Q 100 109 114 103" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 体 */}
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    {/* 手 - 瞑想ポーズ */}
    <ellipse cx="58" cy="175" rx="10" ry="32" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-50 58 175)"/>
    <ellipse cx="142" cy="175" rx="10" ry="32" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(50 142 175)"/>
    {/* 光の輪 - 最も明るい */}
    <circle cx="100" cy="80" r="58" fill="none" stroke="#ffd700" strokeWidth="2.5" opacity="0.6"/>
    <circle cx="100" cy="80" r="65" fill="none" stroke="#ffed4e" strokeWidth="1.5" opacity="0.4"/>
    <circle cx="100" cy="80" r="72" fill="none" stroke="#ffe680" strokeWidth="1" opacity="0.2"/>
    <ellipse cx="80" cy="235" rx="11" ry="30" fill="#333"/>
    <ellipse cx="120" cy="235" rx="11" ry="30" fill="#333"/>
  </svg>
);

// 深いリラックス1 - うつむいている
const CharacterDeepRelax1: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(100, 75) rotate(15)">
      <circle cx="0" cy="0" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
      <ellipse cx="-15" cy="-5" rx="7" ry="4" fill="#333"/>
      <ellipse cx="15" cy="-5" rx="7" ry="4" fill="#333"/>
      <path d="M -8 15 Q 0 20 8 15" stroke="#333" strokeWidth="2" fill="none"/>
    </g>
    <ellipse cx="100" cy="170" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="60" cy="160" rx="12" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-50 60 160)"/>
    <ellipse cx="140" cy="160" rx="12" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(50 140 160)"/>
    <ellipse cx="78" cy="240" rx="12" ry="30" fill="#333"/>
    <ellipse cx="122" cy="240" rx="12" ry="30" fill="#333"/>
    {/* 光 */}
    <circle cx="100" cy="100" r="70" fill="none" stroke="#d4a5ff" strokeWidth="1.5" opacity="0.3"/>
  </svg>
);

// 深いリラックス2 - 頭を後ろに傾けている
const CharacterDeepRelax2: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(100, 70) rotate(-20)">
      <circle cx="0" cy="0" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
      <ellipse cx="-15" cy="-8" rx="6" ry="4" fill="#333"/>
      <ellipse cx="15" cy="-8" rx="6" ry="4" fill="#333"/>
      <path d="M -10 12 Q 0 18 10 12" stroke="#333" strokeWidth="2" fill="none"/>
    </g>
    <ellipse cx="100" cy="165" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="62" cy="155" rx="12" ry="40" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-35 62 155)"/>
    <ellipse cx="138" cy="155" rx="12" ry="40" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(35 138 155)"/>
    <ellipse cx="80" cy="238" rx="12" ry="28" fill="#333"/>
    <ellipse cx="120" cy="238" rx="12" ry="28" fill="#333"/>
    {/* 光 */}
    <circle cx="100" cy="100" r="75" fill="none" stroke="#a8d5ff" strokeWidth="1.5" opacity="0.25"/>
  </svg>
);

// 深いリラックス3 - 眠気が来た
const CharacterDeepRelax3: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - ほぼ閉じかけている */}
    <path d="M 80 72 Q 85 75 90 72" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M 110 72 Q 115 75 120 72" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Zzzzの表現 */}
    <text x="140" y="60" fontSize="16" fill="#999">z</text>
    <text x="150" y="45" fontSize="14" fill="#ccc">z</text>
    {/* 口 - ほのかに開いている */}
    <ellipse cx="100" cy="100" rx="5" ry="4" fill="none" stroke="#333" strokeWidth="1.5"/>
    {/* 体 */}
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="65" cy="155" rx="12" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-25 65 155)"/>
    <ellipse cx="135" cy="155" rx="12" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(25 135 155)"/>
    <ellipse cx="82" cy="235" rx="11" ry="28" fill="#333"/>
    <ellipse cx="118" cy="235" rx="11" ry="28" fill="#333"/>
    {/* 光 */}
    <circle cx="100" cy="100" r="80" fill="none" stroke="#e6ccff" strokeWidth="1" opacity="0.2"/>
  </svg>
);

// 目を閉じた1 - 標準的
const CharacterEyesClosed1: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 完全に閉じている */}
    <line x1="78" y1="70" x2="92" y2="70" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
    <line x1="108" y1="70" x2="122" y2="70" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
    {/* 眉 */}
    <path d="M 70 60 Q 85 58 100 60" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 100 60 Q 115 58 130 60" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - 穏やか */}
    <path d="M 84 100 Q 100 107 116 100" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="62" cy="150" rx="12" ry="36" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-20 62 150)"/>
    <ellipse cx="138" cy="150" rx="12" ry="36" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(20 138 150)"/>
    <ellipse cx="80" cy="232" rx="12" ry="30" fill="#333"/>
    <ellipse cx="120" cy="232" rx="12" ry="30" fill="#333"/>
  </svg>
);

// 目を閉じた2 - やや眉を下げた
const CharacterEyesClosed2: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 */}
    <line x1="77" y1="72" x2="93" y2="72" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="107" y1="72" x2="123" y2="72" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
    {/* 眉 - より下がった */}
    <path d="M 65 62 Q 85 56 105 62" stroke="#8b6f47" strokeWidth="2.5" fill="none"/>
    <path d="M 95 62 Q 115 56 135 62" stroke="#8b6f47" strokeWidth="2.5" fill="none"/>
    {/* 口 - ほぼ一直線 */}
    <line x1="82" y1="100" x2="118" y2="100" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="60" cy="150" rx="12" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-30 60 150)"/>
    <ellipse cx="140" cy="150" rx="12" ry="38" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(30 140 150)"/>
    <ellipse cx="78" cy="232" rx="12" ry="30" fill="#333"/>
    <ellipse cx="122" cy="232" rx="12" ry="30" fill="#333"/>
  </svg>
);

// 目を閉じた3 - 穏やかな表情
const CharacterEyesClosed3: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 穏やかに閉じている */}
    <ellipse cx="85" cy="70" rx="7" ry="5" fill="#333"/>
    <ellipse cx="115" cy="70" rx="7" ry="5" fill="#333"/>
    {/* 目の下 - 小じわ */}
    <path d="M 82 76 Q 85 78 88 76" stroke="#ccc" strokeWidth="1" fill="none"/>
    <path d="M 112 76 Q 115 78 118 76" stroke="#ccc" strokeWidth="1" fill="none"/>
    {/* 眉 - やや上がった */}
    <path d="M 72 60 Q 85 58 98 60" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 102 60 Q 115 58 128 60" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - 優しい笑顔 */}
    <path d="M 85 100 Q 100 107 115 100" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="65" cy="152" rx="12" ry="35" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-15 65 152)"/>
    <ellipse cx="135" cy="152" rx="12" ry="35" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(15 135 152)"/>
    <ellipse cx="82" cy="233" rx="11" ry="29" fill="#333"/>
    <ellipse cx="118" cy="233" rx="11" ry="29" fill="#333"/>
  </svg>
);

// 優しい笑顔1 - 暖かい
const CharacterGentleSmile1: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 優しく開いている */}
    <circle cx="85" cy="70" r="5" fill="#333"/>
    <circle cx="115" cy="70" r="5" fill="#333"/>
    {/* 目の周りの小じわ - 笑っている */}
    <path d="M 95 65 Q 100 68 105 65" stroke="#ccc" strokeWidth="1" fill="none"/>
    <path d="M 95 75 Q 100 76 105 75" stroke="#ccc" strokeWidth="1" fill="none"/>
    {/* 眉 - 上がった */}
    <path d="M 75 58 Q 85 56 95 58" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 105 58 Q 115 56 125 58" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - 大きな笑顔 */}
    <path d="M 80 98 Q 100 112 120 98" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M 82 100 Q 100 108 118 100" stroke="#ffb3ba" strokeWidth="1" fill="none"/>
    {/* 体 */}
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="60" cy="145" rx="12" ry="36" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-25 60 145)"/>
    <ellipse cx="140" cy="145" rx="12" ry="36" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(25 140 145)"/>
    <ellipse cx="78" cy="230" rx="12" ry="30" fill="#333"/>
    <ellipse cx="122" cy="230" rx="12" ry="30" fill="#333"/>
  </svg>
);

// 優しい笑顔2 - ホッとした
const CharacterGentleSmile2: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
    {/* 目 - 目を細めた笑顔 */}
    <path d="M 80 68 Q 85 72 90 68" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M 110 68 Q 115 72 120 68" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 眉 - 上がった */}
    <path d="M 73 56 Q 85 54 97 56" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    <path d="M 103 56 Q 115 54 127 56" stroke="#8b6f47" strokeWidth="2" fill="none"/>
    {/* 口 - 穏やかな笑顔 */}
    <path d="M 84 100 Q 100 110 116 100" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* 体 */}
    <ellipse cx="100" cy="160" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    <ellipse cx="62" cy="148" rx="12" ry="36" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-18 62 148)"/>
    <ellipse cx="138" cy="148" rx="12" ry="36" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(18 138 148)"/>
    <ellipse cx="80" cy="232" rx="12" ry="30" fill="#333"/>
    <ellipse cx="120" cy="232" rx="12" ry="30" fill="#333"/>
  </svg>
);

// 浮遊状態 - 夢見心地
const CharacterFloating1: React.FC = () => (
  <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    {/* 雲のような背景 */}
    <circle cx="100" cy="150" r="80" fill="#e8e8ff" opacity="0.4"/>
    <path d="M 50 140 Q 30 150 40 160 Q 20 170 50 175 Q 35 185 65 185 Q 50 200 80 190 Q 95 185 110 195 Q 120 170 140 180 Q 155 165 150 150 Q 160 130 140 125 Q 125 115 110 125 Q 100 110 80 120 Q 70 105 50 120" fill="#f0e6ff" opacity="0.3"/>
    
    {/* キャラクター - 浮遊している */}
    <g transform="translate(100, 70)">
      <circle cx="0" cy="0" r="45" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
      {/* 目 - 夢見心地 */}
      <circle cx="-15" cy="-8" r="5" fill="#333"/>
      <circle cx="15" cy="-8" r="5" fill="#333"/>
      {/* 星のようなキラキラ */}
      <polygon points="0,-5 2,-8 5,-7 3,-10 4,-13 0,-11 -4,-13 -3,-10 -5,-7 -2,-8" fill="#ffd700" opacity="0.6"/>
      {/* 眉 - 穏やか */}
      <path d="M -25 -18 Q -15 -20 -5 -18" stroke="#8b6f47" strokeWidth="2" fill="none"/>
      <path d="M 5 -18 Q 15 -20 25 -18" stroke="#8b6f47" strokeWidth="2" fill="none"/>
      {/* 口 - ほのかな笑顔 */}
      <path d="M -12 12 Q 0 18 12 12" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </g>
    
    {/* 体 */}
    <ellipse cx="100" cy="150" rx="35" ry="50" fill="#e8d5c4" stroke="#333" strokeWidth="2"/>
    {/* 手 - 浮遊ポーズ */}
    <ellipse cx="55" cy="140" rx="12" ry="40" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(-60 55 140)"/>
    <ellipse cx="145" cy="140" rx="12" ry="40" fill="#fdbcb4" stroke="#333" strokeWidth="2" transform="rotate(60 145 140)"/>
    {/* 脚 - 柔らかく */}
    <ellipse cx="80" cy="220" rx="12" ry="28" fill="#333"/>
    <ellipse cx="120" cy="220" rx="12" ry="28" fill="#333"/>
    
    {/* 光のオーラ */}
    <circle cx="100" cy="120" r="90" fill="none" stroke="#b0c4ff" strokeWidth="1.5" opacity="0.3"/>
    <circle cx="100" cy="120" r="100" fill="none" stroke="#c4d4ff" strokeWidth="1" opacity="0.2"/>
  </svg>
);

const characterMap: Record<CharacterExpression, React.FC> = {
  relaxed_1: CharacterRelaxed1,
  relaxed_2: CharacterRelaxed2,
  relaxed_3: CharacterRelaxed3,
  relaxed_4: CharacterRelaxed4,
  breathing_1: CharacterBreathing1,
  breathing_2: CharacterBreathing2,
  breathing_3: CharacterBreathing3,
  muscle_relax_1: CharacterMuscleRelax1,
  muscle_relax_2: CharacterMuscleRelax2,
  muscle_relax_3: CharacterMuscleRelax3,
  meditation_1: CharacterMeditation1,
  meditation_2: CharacterMeditation2,
  meditation_3: CharacterMeditation3,
  deep_relax_1: CharacterDeepRelax1,
  deep_relax_2: CharacterDeepRelax2,
  deep_relax_3: CharacterDeepRelax3,
  eyes_closed_1: CharacterEyesClosed1,
  eyes_closed_2: CharacterEyesClosed2,
  eyes_closed_3: CharacterEyesClosed3,
  gentle_smile_1: CharacterGentleSmile1,
  gentle_smile_2: CharacterGentleSmile2,
  floating_1: CharacterFloating1,
};

export const Character: React.FC<CharacterProps> = ({ 
  expression, 
  size = 'medium',
  className = ''
}) => {
  const ComponentToRender = characterMap[expression];
  const pixelSize = sizeMap[size];

  if (!ComponentToRender) {
    return <div className={className}>Unknown expression: {expression}</div>;
  }

  return (
    <div 
      className={className}
      style={{
        width: pixelSize,
        height: pixelSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ComponentToRender />
    </div>
  );
};

export default Character;
