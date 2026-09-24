'use client';

import { useId, useMemo } from 'react';
import type { Expression, Outfit } from '@/types';

interface TsumugiCharacterProps {
  expression?: Expression;
  /** 喋っている間 true にすると口が動く */
  speaking?: boolean;
  outfit?: Outfit;
  /** 表示サイズ(px)。高さ基準。 */
  size?: number;
  reduceMotion?: boolean;
  /** きらきら等の装飾を出すか（設定で切れる） */
  effects?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  表情テーブル                                                        */
/* ------------------------------------------------------------------ */

type EyeStyle = 'open' | 'arc-up' | 'arc-down' | 'half' | 'wide' | 'line';
type MouthStyle = 'smile' | 'open' | 'grin' | 'wavy' | 'frown' | 'o' | 'soft';
type BrowStyle = 'neutral' | 'raised' | 'worried' | 'angled' | 'tilt';

interface Look {
  eyeL: EyeStyle;
  eyeR: EyeStyle;
  brow: BrowStyle;
  mouth: MouthStyle;
  blush: number;
  /** 瞳をハートにする */
  heartEyes?: boolean;
  /** 瞳のオフセット（視線） */
  gaze?: [number, number];
  sparkle?: boolean;
  blink?: boolean;
}

const LOOKS: Record<Expression, Look> = {
  neutral:   { eyeL: 'open',     eyeR: 'open',     brow: 'neutral', mouth: 'soft',  blush: 0.35, blink: true },
  smile:     { eyeL: 'open',     eyeR: 'open',     brow: 'neutral', mouth: 'smile', blush: 0.5,  blink: true },
  happy:     { eyeL: 'arc-up',   eyeR: 'arc-up',   brow: 'raised',  mouth: 'grin',  blush: 0.7,  sparkle: true },
  shy:       { eyeL: 'half',     eyeR: 'half',     brow: 'worried', mouth: 'wavy',  blush: 1 },
  surprised: { eyeL: 'wide',     eyeR: 'wide',     brow: 'raised',  mouth: 'o',     blush: 0.5 },
  thinking:  { eyeL: 'open',     eyeR: 'open',     brow: 'tilt',    mouth: 'soft',  blush: 0.3, gaze: [4, -6], blink: true },
  sad:       { eyeL: 'arc-down', eyeR: 'arc-down', brow: 'angled',  mouth: 'frown', blush: 0.3 },
  wink:      { eyeL: 'arc-up',   eyeR: 'open',     brow: 'raised',  mouth: 'grin',  blush: 0.65, sparkle: true },
  sleepy:    { eyeL: 'line',     eyeR: 'line',     brow: 'worried', mouth: 'soft',  blush: 0.4 },
  love:      { eyeL: 'open',     eyeR: 'open',     brow: 'raised',  mouth: 'smile', blush: 1, heartEyes: true, sparkle: true },
};

/* ------------------------------------------------------------------ */
/*  パーツのパス                                                        */
/*  ※ 左目だけ定義して、右目は x -> 320-x のミラーで描く                 */
/* ------------------------------------------------------------------ */

const EYE_WHITE =
  'M108 158 C109 141 120 133 130 133 C141 133 149 144 149 159 C149 174 139 183 128 183 C116 183 108 172 108 158 Z';

/** 上まぶた。目の上弧に沿う三日月＋目尻のはね。 */
const LASH_SHAPE =
  'M106 162 C106 142 117 130 130 130 C143 130 151 143 151 160 ' +
  'C149 150 144 142 137 139 C134 137 132 137 130 137 ' +
  'C120 137 112 146 110 163 Z';
const LASH_LOWER = 'M111 172 C117 181 125 184 132 183';

const ARC_UP = 'M107 168 C116 150 141 150 150 167';
const ARC_DOWN = 'M107 152 C116 170 141 170 150 153';
const LINE_EYE = 'M107 160 C117 153 140 153 150 159';
/** 目を 1.1 倍にして 8px 下げる。中心 (128.5,158) → (128.5,166) */
const EYE_FIT = 'translate(-12.85, -7.8) scale(1.1)';

const LID_HALF = 'M103 128 L153 128 L153 157 C141 149 116 149 103 158 Z';

const BROWS: Record<BrowStyle, string> = {
  neutral: 'M112 115 C121 109 139 109 149 114',
  raised: 'M112 106 C121 99 140 99 150 105',
  worried: 'M112 121 C122 115 139 109 150 106',
  angled: 'M112 124 C122 118 139 111 150 108',
  tilt: 'M112 112 C121 106 139 108 150 113',
};

const MOUTHS: Record<MouthStyle, { d: string; fill?: string; stroke?: boolean }> = {
  soft: { d: 'M152 205 Q160 210 168 205', stroke: true },
  smile: { d: 'M148 203 Q160 214 172 203', stroke: true },
  wavy: { d: 'M150 206 Q156 200 160 205 Q164 210 170 204', stroke: true },
  frown: { d: 'M150 211 Q160 202 170 211', stroke: true },
  grin: { d: 'M145 199 Q160 194 175 199 Q172 221 160 223 Q148 221 145 199 Z', fill: '#8A3348' },
  open: { d: 'M149 201 Q160 197 171 201 Q168 217 160 218 Q152 217 149 201 Z', fill: '#8A3348' },
  o: { d: 'M160 207 m-7 0 a7 9 0 1 0 14 0 a7 9 0 1 0 -14 0', fill: '#8A3348' },
};

/* ------------------------------------------------------------------ */
/*  衣装                                                                */
/* ------------------------------------------------------------------ */

const OUTFIT_COLORS: Record<Outfit, { main: string; shade: string; accent: string }> = {
  casual: { main: '#FFEFE2', shade: '#F3D9C4', accent: '#FF8FB1' },
  hoodie: { main: '#FFC2D6', shade: '#F29EBC', accent: '#FFFFFF' },
  festival: { main: '#2E2A38', shade: '#1E1B26', accent: '#FF5C8A' },
  sauna: { main: '#FFFFFF', shade: '#E8E8E8', accent: '#8ED8D2' },
  yukata: { main: '#3A4E7A', shade: '#2A3A5C', accent: '#FF8FB1' },
};

export default function TsumugiCharacter({
  expression = 'smile',
  speaking = false,
  outfit = 'casual',
  size = 220,
  reduceMotion = false,
  effects = true,
  className = '',
}: TsumugiCharacterProps) {
  const uid = useId().replace(/:/g, '');
  const look = LOOKS[expression] ?? LOOKS.smile;
  const colors = OUTFIT_COLORS[outfit];
  const animate = !reduceMotion;

  const mouthStyle: MouthStyle = speaking
    ? look.mouth === 'grin'
      ? 'grin'
      : 'open'
    : look.mouth;
  const mouth = MOUTHS[mouthStyle];
  const gaze = look.gaze ?? [0, 0];

  const id = useMemo(
    () => ({
      hair: `h-${uid}`,
      hairBack: `hb-${uid}`,
      skin: `s-${uid}`,
      iris: `i-${uid}`,
      blushF: `bf-${uid}`,
      clip: `c-${uid}`,
      glow: `g-${uid}`,
      cloth: `cl-${uid}`,
    }),
    [uid]
  );

  /** 片目ぶんを描く（左目の座標系。右目はミラー変換で再利用） */
  const renderEye = (style: EyeStyle) => {
    if (style === 'arc-up' || style === 'arc-down' || style === 'line') {
      const d = style === 'arc-up' ? ARC_UP : style === 'arc-down' ? ARC_DOWN : LINE_EYE;
      return (
        <path
          d={d}
          stroke="#4A3138"
          strokeWidth={style === 'line' ? 4.5 : 6}
          strokeLinecap="round"
          fill="none"
        />
      );
    }

    const wide = style === 'wide';
    const irisR = wide ? 16 : 15;
    const pupilR = wide ? 6 : 8;

    return (
      <>
        <path d={EYE_WHITE} fill="#FFFDFB" />

        <g clipPath={`url(#${id.clip})`}>
          {/* 上まぶたの落ち影 */}
          <path d={EYE_WHITE} fill="#E8D2DA" opacity="0.45" transform="translate(0,-10)" />

          <g transform={`translate(${gaze[0]}, ${gaze[1]})`}>
            <ellipse cx="129" cy="159" rx={irisR} ry={irisR + 3} fill={`url(#${id.iris})`} />
            {/* 虹彩の輪郭 */}
            <ellipse
              cx="129"
              cy="159"
              rx={irisR}
              ry={irisR + 3}
              fill="none"
              stroke="#7A3E58"
              strokeWidth="2"
              opacity="0.65"
            />
            {/* 下側の光 */}
            <ellipse cx="129" cy="168" rx={irisR - 4} ry="6" fill="#FFC2D9" opacity="0.75" />

            {look.heartEyes ? (
              <path
                d="M129 155 C126 150 119 151 119 157 C119 163 127 168 129 170 C131 168 139 163 139 157 C139 151 132 150 129 155 Z"
                fill="#FF3F79"
              />
            ) : (
              <ellipse cx="129" cy="160" rx={pupilR} ry={pupilR + 2} fill="#37212B" />
            )}

            {/* ハイライト */}
            <circle cx="122" cy="150" r={wide ? 7 : 6} fill="#FFFFFF" />
            <circle cx="136" cy="169" r="3.2" fill="#FFFFFF" opacity="0.85" />
            <circle cx="133" cy="153" r="1.8" fill="#FFFFFF" opacity="0.9" />
          </g>
        </g>

        {style === 'half' && (
          <>
            <path d={LID_HALF} fill={`url(#${id.skin})`} />
            <path
              d="M103 157 C116 148 141 148 153 156"
              stroke="#4A3138"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}

        <path d={LASH_SHAPE} fill="#4A3138" />
        <path
          d={LASH_LOWER}
          stroke="#8A6670"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </>
    );
  };

  const eyeGroupClass = look.blink && animate ? 'tsumugi-blink' : '';

  return (
    <svg
      viewBox="0 0 320 380"
      width={(size * 320) / 380}
      height={size}
      className={`tsumugi-svg ${animate ? 'tsumugi-breathe' : ''} ${className}`}
      role="img"
      aria-label={`紬（${expression}）`}
    >
      <defs>
        <linearGradient id={id.hair} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#D9A87E" />
          <stop offset="45%" stopColor="#B9805C" />
          <stop offset="100%" stopColor="#8E5B42" />
        </linearGradient>
        <linearGradient id={id.hairBack} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#A9724F" />
          <stop offset="100%" stopColor="#6F452F" />
        </linearGradient>
        <radialGradient id={id.skin} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#FFF3EA" />
          <stop offset="100%" stopColor="#FCDFCE" />
        </radialGradient>
        <linearGradient id={id.iris} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8E4A7A" />
          <stop offset="55%" stopColor="#D2628F" />
          <stop offset="100%" stopColor="#FF9CBE" />
        </linearGradient>
        <linearGradient id={id.cloth} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.shade} />
        </linearGradient>
        <clipPath id={id.clip}>
          <path d={EYE_WHITE} />
        </clipPath>
        <filter id={id.blushF} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={id.glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ============================ 後ろ髪 ============================ */}
      <g className={animate ? 'tsumugi-sway-slow' : ''} style={{ transformOrigin: '160px 90px' }}>
        <path
          d="M160 46 C102 46 68 88 66 142 C64 196 54 250 46 300 C70 312 96 320 118 322 C104 268 102 214 106 176 C118 196 142 204 160 204 C178 204 202 196 214 176 C218 214 216 268 202 322 C224 320 250 312 274 300 C266 250 256 196 254 142 C252 88 218 46 160 46 Z"
          fill={`url(#${id.hairBack})`}
        />
      </g>

      {/* ============================= 体 ============================== */}
      <g>
        {/* 首 */}
        <path d="M146 220 L174 220 L174 256 Q160 268 146 256 Z" fill="#F6D2BE" />
        <path d="M146 220 L174 220 L174 236 Q160 248 146 236 Z" fill="#DFA792" opacity="0.85" />
        <ellipse cx="160" cy="224" rx="20" ry="7" fill="#D69A85" opacity="0.5" />

        {/* 肩・服 */}
        <path
          d="M160 248 C120 250 74 268 58 300 C48 322 44 352 42 380 L278 380 C276 352 272 322 262 300 C246 268 200 250 160 248 Z"
          fill={`url(#${id.cloth})`}
        />

        {outfit === 'yukata' && (
          <>
            <path d="M160 250 L124 306 L142 316 L160 268 Z" fill="#FFFFFF" opacity="0.95" />
            <path d="M160 250 L196 306 L178 316 L160 268 Z" fill="#FFFFFF" opacity="0.95" />
            <rect x="48" y="336" width="224" height="26" fill={colors.accent} opacity="0.9" />
          </>
        )}

        {outfit === 'hoodie' && (
          <>
            <path
              d="M160 252 C132 252 110 264 104 282 C126 296 144 300 160 300 C176 300 194 296 216 282 C210 264 188 252 160 252 Z"
              fill={colors.shade}
            />
            <path d="M146 296 L143 344" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
            <path d="M174 296 L177 344" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
            <circle cx="143" cy="346" r="4" fill={colors.accent} />
            <circle cx="177" cy="346" r="4" fill={colors.accent} />
          </>
        )}

        {outfit === 'festival' && (
          <>
            {/* ラミネート（フェスのパス） */}
            <path d="M136 252 L160 316" stroke={colors.accent} strokeWidth="4" fill="none" />
            <path d="M184 252 L160 316" stroke={colors.accent} strokeWidth="4" fill="none" />
            <rect x="146" y="314" width="28" height="36" rx="4" fill="#FFF0F5" />
            <rect x="150" y="320" width="20" height="4" rx="2" fill={colors.accent} />
            <rect x="150" y="328" width="14" height="3" rx="1.5" fill="#C9B8C4" />
            <rect x="150" y="334" width="17" height="3" rx="1.5" fill="#C9B8C4" />
          </>
        )}

        {outfit === 'sauna' && (
          <>
            <path
              d="M160 250 C122 252 84 268 68 296 L252 296 C236 268 198 252 160 250 Z"
              fill="#FFFFFF"
            />
            <path d="M68 296 L252 296" stroke={colors.accent} strokeWidth="6" />
          </>
        )}

        {outfit === 'casual' && (
          <>
            <path
              d="M160 250 C147 250 136 254 132 262 C143 275 151 280 160 280 C169 280 177 275 188 262 C184 254 173 250 160 250 Z"
              fill={colors.shade}
            />
            <path
              d="M134 263 C144 274 152 278 160 278 C168 278 176 274 186 263"
              stroke={colors.accent}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
          </>
        )}
      </g>

      {/* 肩にかかる後ろ髪。体より手前に置かないと、髪がぜんぶ隠れてカツラに見える。 */}
      <g className={animate ? 'tsumugi-sway-slow' : ''} style={{ transformOrigin: '160px 120px' }}>
        <path
          d="M70 210 C60 258 54 312 50 366 C64 372 80 374 94 372 C92 318 94 262 100 216 Z"
          fill={`url(#${id.hairBack})`}
          opacity="0.96"
        />
        <path
          d="M250 210 C260 258 266 312 270 366 C256 372 240 374 226 372 C228 318 226 262 220 216 Z"
          fill={`url(#${id.hairBack})`}
          opacity="0.96"
        />
      </g>

      {/* ============================== 顔 ============================== */}
      <g>
        <path
          d="M160 58 C207 58 233 93 233 141 C233 173 225 197 209 215 C196 230 178 240 160 240 C142 240 124 230 111 215 C95 197 87 173 87 141 C87 93 113 58 160 58 Z"
          fill={`url(#${id.skin})`}
        />
        {/* 耳 */}
        <ellipse cx="88" cy="152" rx="9" ry="14" fill="#FBDCCB" />
        <ellipse cx="232" cy="152" rx="9" ry="14" fill="#FBDCCB" />

        {/* チーク */}
        <g filter={`url(#${id.blushF})`} opacity={look.blush}>
          <ellipse cx="114" cy="196" rx="20" ry="11.5" fill="#FF8FB1" />
          <ellipse cx="206" cy="196" rx="20" ry="11.5" fill="#FF8FB1" />
        </g>
        {look.blush > 0.8 && (
          <g opacity="0.55">
            <path d="M106 192 L112 200 M114 190 L120 198 M122 192 L128 200" stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round" />
            <path d="M192 192 L198 200 M200 190 L206 198 M208 192 L214 200" stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* 目 */}
        <g className={eyeGroupClass}>
          <g transform={EYE_FIT}>{renderEye(look.eyeL)}</g>
          <g transform={`translate(320,0) scale(-1,1) ${EYE_FIT}`}>{renderEye(look.eyeR)}</g>
        </g>

        {/* 鼻 */}
        <path d="M158 190 Q161 193 164 190" stroke="#D9A18A" strokeWidth="2.6" strokeLinecap="round" fill="none" />

        {/* 口 */}
        <g
          className={speaking && animate ? 'tsumugi-talk' : ''}
          style={{ transformOrigin: '160px 206px' }}
        >
          {mouth.stroke ? (
            <path d={mouth.d} stroke="#B34A63" strokeWidth="4" strokeLinecap="round" fill="none" />
          ) : (
            <>
              <path d={mouth.d} fill={mouth.fill} />
              <ellipse cx="160" cy="215" rx="8" ry="5" fill="#F58AAA" />
            </>
          )}
        </g>
      </g>

      {/* ============================ 前髪 ============================== */}
      <g>
        <path
          d="M160 34
             C100 34 64 76 70 150
             C76 134 85 121 97 113
             C101 134 109 150 120 160
             C126 141 130 120 132 98
             C140 120 149 134 160 141
             C171 134 180 120 188 98
             C190 120 194 141 200 160
             C211 150 219 134 223 113
             C235 121 244 134 250 150
             C256 76 220 34 160 34 Z"
          fill={`url(#${id.hair})`}
        />
        {/* 髪のツヤ */}
        <path
          d="M108 92 C124 70 150 60 176 64 C176 70 174 74 170 76 C146 78 124 88 112 104 Z"
          fill="#FFEEDC"
          opacity="0.5"
        />
        <path
          d="M192 72 C210 78 224 92 234 110 C230 112 226 112 223 110 C214 96 204 86 190 80 Z"
          fill="#FFEEDC"
          opacity="0.38"
        />

        {/* サイドの髪 */}
        <g className={animate ? 'tsumugi-sway' : ''} style={{ transformOrigin: '96px 100px' }}>
          <path
            d="M96 84 C74 104 66 152 66 202 C66 232 70 254 76 268 C88 278 102 278 110 270 C98 226 94 176 100 136 C100 114 98 98 96 84 Z"
            fill={`url(#${id.hair})`}
          />
        </g>
        <g className={animate ? 'tsumugi-sway-rev' : ''} style={{ transformOrigin: '224px 100px' }}>
          <path
            d="M224 84 C246 104 254 152 254 202 C254 232 250 254 244 268 C232 278 218 278 210 270 C222 226 226 176 220 136 C220 114 222 98 224 84 Z"
            fill={`url(#${id.hair})`}
          />
        </g>

        {/* アホ毛 */}
        <g className={animate ? 'tsumugi-ahoge' : ''} style={{ transformOrigin: '156px 48px' }}>
          <path
            d="M154 44 C144 20 156 2 178 0 C162 8 156 20 166 30 C156 28 150 34 154 44 Z"
            fill="#C89366"
          />
        </g>

        {/* 髪飾り（桜） */}
        <g transform="translate(224 96) scale(0.95)">
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-9"
              rx="5.5"
              ry="8.5"
              fill="#FFB3CC"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="3.6" fill="#FFF1B8" />
        </g>
      </g>

      {/* 眉は前髪より手前に。アニメ的だし、表情がはっきり出る。 */}
      <g opacity="0.92">
        <path d={BROWS[look.brow]} stroke="#9E6C48" strokeWidth="3.8" strokeLinecap="round" fill="none" />
        <g transform="translate(320,0) scale(-1,1)">
          <path
            d={BROWS[look.brow === 'tilt' ? 'raised' : look.brow]}
            stroke="#9E6C48"
            strokeWidth="3.8"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </g>

      {/* ============================ きらきら ============================ */}
      {look.sparkle && effects && (
        <g className={animate ? 'tsumugi-sparkle' : ''} filter={`url(#${id.glow})`}>
          <path d="M58 104 L62 116 L74 120 L62 124 L58 136 L54 124 L42 120 L54 116 Z" fill="#FFE27A" />
          <path d="M262 76 L265 85 L274 88 L265 91 L262 100 L259 91 L250 88 L259 85 Z" fill="#FFC2D9" />
          <path d="M272 168 L274 175 L281 177 L274 179 L272 186 L270 179 L263 177 L270 175 Z" fill="#FFE27A" />
          <path d="M48 196 L50 203 L57 205 L50 207 L48 214 L46 207 L39 205 L46 203 Z" fill="#FFC2D9" />
        </g>
      )}
    </svg>
  );
}
