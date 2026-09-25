import type { Expression, Outfit } from '@/types';

const BASE = '/tsumugi';

/**
 * 基準の衣装。この衣装だけファイル名に衣装名が入らない
 * （最初に基準画像として生成したものをそのまま使っているため）。
 */
const DEFAULT_OUTFIT: Outfit = 'casual';

/**
 * まばたき・口パクの差し替えを許す表情。
 *
 * blink / talk の差分は「その衣装の基準ポーズ」で描かれているので、
 * 体つきが違う絵から差し替えると一瞬だけ体が変わってちらつく。
 * たとえば thinking は顎に指を当てたポーズなので、まばたきの瞬間に手が消える。
 * happy / sleepy / wink はもともと目を閉じているので差し替える意味がない。
 */
const SWAP_SAFE_EXPRESSIONS: Expression[] = [
  'neutral',
  'smile',
  'shy',
  'surprised',
  'sad',
  'love',
];

function prefix(outfit: Outfit): string {
  return outfit === DEFAULT_OUTFIT ? `${BASE}/expr` : `${BASE}/outfit-${outfit}-expr`;
}

export function artSrc(expression: Expression, outfit: Outfit): string {
  return `${prefix(outfit)}-${expression}.webp`;
}

export function blinkSrc(outfit: Outfit): string {
  return `${prefix(outfit)}-blink.webp`;
}

export function talkSrc(outfit: Outfit): string {
  return `${prefix(outfit)}-talk.webp`;
}

export function canBlink(expression: Expression): boolean {
  return SWAP_SAFE_EXPRESSIONS.includes(expression);
}

export function canTalk(expression: Expression): boolean {
  return SWAP_SAFE_EXPRESSIONS.includes(expression);
}

/** イラストの縦横比（生成時の 880x1184） */
export const ART_ASPECT = 880 / 1184;

/**
 * 全身立ち絵の縦横比。
 * 9:16 で生成しているが、背景を抜いたあとの書き出しは 480x889 になる。
 * 9/16 のまま枠を作ると枠だけ約4%横長になり、キラキラ演出の位置が絵から
 * ずれるので、実ファイルの寸法をそのまま使う。
 */
export const FULL_ASPECT = 480 / 889;

/**
 * 全身立ち絵。衣装を見せたい場面で使う。
 * まだ用意できていない衣装があるので、読めなければバストアップに落とす。
 */
export function fullBodySrc(outfit: Outfit): string {
  return `${BASE}/full-${outfit}.webp`;
}

const ALL_EXPRESSIONS: Expression[] = [
  'neutral',
  'smile',
  'happy',
  'shy',
  'surprised',
  'thinking',
  'sad',
  'wink',
  'sleepy',
  'love',
  'wave',
  'cheer',
  'point',
  'plead',
  'hide',
];

/** その衣装で使う絵（表情ぜんぶ・まばたき・口パク） */
export function artSrcs(outfit: Outfit): string[] {
  return [...ALL_EXPRESSIONS.map((e) => artSrc(e, outfit)), blinkSrc(outfit), talkSrc(outfit)];
}

/**
 * 表情を切り替えた瞬間に読み込みが走ると一瞬消えるので、
 * いま着ている衣装のぶんだけ先にブラウザキャッシュへ入れておく。
 * 全衣装ぶん（60枚）を先読みすると無駄が大きいので、着ているものだけにする。
 */
export function preloadArt(outfit: Outfit): void {
  if (typeof window === 'undefined') return;
  for (const src of artSrcs(outfit)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}
