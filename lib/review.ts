import type { AppState, CardProgress, FestivalScenarioId, MistakeRecord } from '@/types';
import { festivalScenarioOrder, festivalScenarios, type FestivalPhrase } from './festivalScenarios';
import { NAME_TOKEN, nameForEnglish } from './learnerName';
import { getDueCards } from './srs';

/**
 * 復習に出すカードを並べる。
 *
 * これまでは会話で直された文だけで、直されなければ復習は空っぽだった。
 * フェスのフレーズ（必修54個＋α）も、日本語を見て英語を思い出すカードとして混ぜる。
 */

/** 1日に新しく出すフレーズの数。まとめて出すと覚えきれず、翌日からの復習が溜まる */
export const NEW_PHRASES_PER_DAY = 6;
/** 1回の復習で出す最大の枚数（数分で終わる量にする） */
export const SESSION_LIMIT = 20;

export type ReviewItem =
  | { kind: 'mistake'; key: string; record: MistakeRecord }
  | {
      kind: 'phrase';
      key: string;
      scenarioId: FestivalScenarioId;
      phrase: FestivalPhrase;
      /** 今日はじめて出すカード */
      isNew: boolean;
      progress?: CardProgress;
    };

export function phraseKey(en: string): string {
  return `phrase:${en}`;
}

let orderCache: Array<{ scenarioId: FestivalScenarioId; phrase: FestivalPhrase }> | null = null;

/** 覚える順番: 必修（⭐️）を場面の順に、そのあと残りを場面の順に。同じ英文は1枚にまとめる */
function phraseOrder(): Array<{ scenarioId: FestivalScenarioId; phrase: FestivalPhrase }> {
  if (orderCache) return orderCache;
  const all = festivalScenarioOrder.flatMap((scenarioId) =>
    festivalScenarios[scenarioId].phrases.map((phrase) => ({ scenarioId, phrase }))
  );
  const seen = new Set<string>();
  orderCache = [...all.filter((p) => p.phrase.star), ...all.filter((p) => !p.phrase.star)].filter(({ phrase }) => {
    if (seen.has(phrase.en)) return false;
    seen.add(phrase.en);
    return true;
  });
  return orderCache;
}

function dayOf(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** いま復習するカード。期限が来たものを定着度の低い順に、そのあと今日の新しいフレーズ */
export function buildReviewQueue(state: AppState, now = Date.now()): ReviewItem[] {
  const due: Array<{ item: ReviewItem; box: number; dueAt: number }> = getDueCards(state.mistakes, now).map(
    (record) => ({
      item: { kind: 'mistake', key: `mistake:${record.id}`, record },
      box: record.box ?? 0,
      dueAt: record.dueAt ?? 0,
    })
  );

  const today = dayOf(now);
  const introducedToday = Object.entries(state.cards).filter(
    ([key, c]) => key.startsWith('phrase:') && !c.retired && dayOf(c.introducedAt) === today
  ).length;
  let room = Math.max(0, NEW_PHRASES_PER_DAY - introducedToday);
  // 名前入りのフレーズ（Hi, I'm {name}）は、英語で書ける名前があるときだけ出す
  const canUseName = nameForEnglish(state.profile.displayName) !== '';

  const fresh: ReviewItem[] = [];
  for (const { scenarioId, phrase } of phraseOrder()) {
    if (phrase.en.includes(NAME_TOKEN) && !canUseName) continue;
    const key = phraseKey(phrase.en);
    const progress = state.cards[key];
    if (progress) {
      if (!progress.retired && progress.dueAt <= now) {
        due.push({
          item: { kind: 'phrase', key, scenarioId, phrase, isNew: false, progress },
          box: progress.box,
          dueAt: progress.dueAt,
        });
      }
    } else if (room > 0) {
      room -= 1;
      fresh.push({ kind: 'phrase', key, scenarioId, phrase, isNew: true });
    }
  }

  due.sort((a, b) => a.box - b.box || a.dueAt - b.dueAt);
  return [...due.map((d) => d.item), ...fresh].slice(0, SESSION_LIMIT);
}
