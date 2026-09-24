import type { FestivalScenarioId } from '@/types';

/**
 * シナリオごとの背景。
 * public/scenes/<id>.webp に置いてある。人物も文字も描かせていないので、
 * 紬の立ち絵を前に重ねてもぶつからない。
 */
export function sceneSrc(id: FestivalScenarioId): string {
  return `/scenes/${id}.webp`;
}

/** 夜・夕方の場面。BGMを落ち着いたトラックに切り替える。 */
const NIGHT_SCENES: FestivalScenarioId[] = [
  'music-talk',
  'food-drinks',
  'camping-tent',
  'sauna-totonou',
  'bonfire-deeptalk',
  'swap-contacts',
  'fukuoka-guide',
];

export function sceneIsNight(id: FestivalScenarioId): boolean {
  return NIGHT_SCENES.includes(id);
}
