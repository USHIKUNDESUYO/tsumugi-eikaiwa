import type { MistakeRecord } from '@/types';

/**
 * 超軽量 SRS（間隔反復）。Leitner box 方式。
 * 正解したら次の箱へ、間違えたら箱0に戻る。
 */
const INTERVALS_MS = [
  0,                // box 0: すぐ
  10 * 60_000,      // box 1: 10分後
  60 * 60_000,      // box 2: 1時間後
  24 * 3_600_000,   // box 3: 翌日
  3 * 24 * 3_600_000,  // box 4: 3日後
  7 * 24 * 3_600_000,  // box 5: 1週間後
  21 * 24 * 3_600_000, // box 6: 3週間後
];

export const MAX_BOX = INTERVALS_MS.length - 1;

export function scheduleNext(box: number, now = Date.now()): { box: number; dueAt: number } {
  const clamped = Math.max(0, Math.min(MAX_BOX, box));
  return { box: clamped, dueAt: now + INTERVALS_MS[clamped] };
}

export function onCorrect(record: MistakeRecord, now = Date.now()): Partial<MistakeRecord> {
  const next = scheduleNext((record.box ?? 0) + 1, now);
  return {
    ...next,
    timesMastered: record.timesMastered + 1,
    lastReviewed: now,
  };
}

export function onWrong(record: MistakeRecord, now = Date.now()): Partial<MistakeRecord> {
  const next = scheduleNext(0, now);
  return {
    ...next,
    timesSeen: record.timesSeen + 1,
    lastReviewed: now,
  };
}

/** いま復習すべきカード（期限切れ優先、次に未学習） */
export function getDueCards(records: MistakeRecord[], now = Date.now()): MistakeRecord[] {
  return records
    .filter((r) => (r.dueAt ?? 0) <= now)
    .sort((a, b) => {
      const boxDiff = (a.box ?? 0) - (b.box ?? 0);
      if (boxDiff !== 0) return boxDiff;
      return (a.dueAt ?? 0) - (b.dueAt ?? 0);
    });
}

/** 完全に覚えたと見なすか */
export function isMastered(record: MistakeRecord): boolean {
  return (record.box ?? 0) >= MAX_BOX;
}

/** 進捗率 0..1 */
export function masteryRatio(record: MistakeRecord): number {
  return Math.min(1, (record.box ?? 0) / MAX_BOX);
}
