import type { FestivalScenarioId } from '@/types';

/**
 * シナリオごとの背景。
 * public/scenes/<id>.webp に置いてある。人物も文字も描かせていないので、
 * 紬の立ち絵を前に重ねてもぶつからない。
 */
export function sceneSrc(id: FestivalScenarioId): string {
  return `/scenes/${id}.webp`;
}
