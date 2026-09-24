import type { Expression, Outfit } from '@/types';

const BASE = '/tsumugi';

/**
 * いまイラストが揃っているのは casual（基準の衣装）の表情12種だけ。
 * 他の衣装は基準の笑顔1枚しかないので、表情もまばたきも出さない。
 */
const OUTFITS_WITH_EXPRESSIONS: Outfit[] = ['casual'];

/**
 * まばたき・口パクの差し替えを許す表情。
 *
 * blink/talk の差分は「基準の体」で描かれているので、体つきが違う絵から
 * 差し替えると一瞬だけ体が変わってちらつく。たとえば thinking は顎に指を
 * 当てたポーズなので、まばたきの瞬間に手が消える。
 * また happy / sleepy / wink はもともと目を閉じているので差し替える意味がない。
 */
const SWAP_SAFE_EXPRESSIONS: Expression[] = ['neutral', 'smile', 'shy', 'surprised', 'sad', 'love'];

export function hasExpressionSet(outfit: Outfit): boolean {
  return OUTFITS_WITH_EXPRESSIONS.includes(outfit);
}

export function artSrc(expression: Expression, outfit: Outfit): string {
  return hasExpressionSet(outfit)
    ? `${BASE}/expr-${expression}.webp`
    : `${BASE}/outfit-${outfit}.webp`;
}

export function blinkSrc(outfit: Outfit): string | null {
  return hasExpressionSet(outfit) ? `${BASE}/expr-blink.webp` : null;
}

export function talkSrc(outfit: Outfit): string | null {
  return hasExpressionSet(outfit) ? `${BASE}/expr-talk.webp` : null;
}

export function canBlink(expression: Expression, outfit: Outfit): boolean {
  return hasExpressionSet(outfit) && SWAP_SAFE_EXPRESSIONS.includes(expression);
}

export function canTalk(expression: Expression, outfit: Outfit): boolean {
  return hasExpressionSet(outfit) && SWAP_SAFE_EXPRESSIONS.includes(expression);
}

/** イラストの縦横比（生成時の 880x1184） */
export const ART_ASPECT = 880 / 1184;

const ALL_EXPRESSIONS: Expression[] = [
  'neutral', 'smile', 'happy', 'shy', 'surprised',
  'thinking', 'sad', 'wink', 'sleepy', 'love',
];
const ALL_OUTFITS: Outfit[] = ['hoodie', 'festival', 'sauna', 'yukata'];

/**
 * 表情を切り替えた瞬間に読み込みが走ると一瞬消えるので、
 * 起動時にまとめてブラウザキャッシュに入れておく。
 */
export function preloadArt(): void {
  if (typeof window === 'undefined') return;
  const srcs = [
    ...ALL_EXPRESSIONS.map((e) => `${BASE}/expr-${e}.webp`),
    `${BASE}/expr-blink.webp`,
    `${BASE}/expr-talk.webp`,
    ...ALL_OUTFITS.map((o) => `${BASE}/outfit-${o}.webp`),
  ];
  for (const src of srcs) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}
