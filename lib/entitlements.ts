import type { FestivalScenarioId } from '@/types';
import { festivalScenarioOrder, festivalScenarios } from './festivalScenarios';

/**
 * 無料で遊べるシナリオ。
 * 「英語が聞き取れない時」「はじめましての一言」「受付」の3つ＝
 * フェス初日に本当に困る場面を無料にして、価値が伝わってから課金を案内する。
 */
export const FREE_SCENARIOS: FestivalScenarioId[] = [
  'rescue-phrases',
  'first-hello',
  'arrival-checkin',
];

export const LOCKED_SCENARIO_COUNT = festivalScenarioOrder.length - FREE_SCENARIOS.length;

export function isScenarioFree(id: FestivalScenarioId): boolean {
  return FREE_SCENARIOS.includes(id);
}

export function isScenarioUnlocked(id: FestivalScenarioId, isPremium: boolean): boolean {
  return isPremium || isScenarioFree(id);
}

/** 有料側にだけ入っているフレーズの数（訴求に使う） */
export function lockedPhraseCount(): number {
  return festivalScenarioOrder
    .filter((id) => !isScenarioFree(id))
    .reduce((acc, id) => acc + festivalScenarios[id].phrases.length, 0);
}
