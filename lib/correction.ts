import type { CorrectionCard } from '@/types';

const KEYS = ['said', 'better', 'why', 'severity'] as const;
const SEVERITIES: ReadonlyArray<CorrectionCard['severity']> = ['minor', 'moderate', 'important'];

/**
 * 添削ブロック（<correction> の中身）を読む。
 * AI の JSON はときどき崩れていて（本番とプレビューで測ると添削 91個中 8個）、捨てるとカードが黙って消えていた。
 * 崩れ方は、"why" の後ろのカンマ抜けが 7個、説明の中に " をそのまま書いたものが 1個。どれも中身は正しかった。
 * ふつうに読めなければ、カンマを補って読み、それでもだめなら項目名を目印に値を取り出す。
 */
export function parseCorrectionBlock(block: string): CorrectionCard | null {
  const body = block.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const fields = tryJson(body) ?? tryJson(addMissingCommas(body)) ?? byKeys(body);
  if (!fields?.said || !fields.better || !fields.why) return null;
  const severity = SEVERITIES.find((s) => s === fields.severity) ?? 'minor';
  return { said: String(fields.said), better: String(fields.better), why: String(fields.why), severity };
}

function tryJson(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** 値の閉じ " のあと、カンマなしで次の "項目名": が来ている所にカンマを補う */
function addMissingCommas(text: string): string {
  return text.replace(/"(\s*)"(said|better|why|severity)"(\s*):/g, '",$1"$2"$3:');
}

/**
 * 項目名を目印に値を取り出す。値は、次の "項目名": か最後の } の手前の " まで。
 * 説明の中に " がそのまま入っていても読める。
 */
function byKeys(text: string): Record<string, string> | null {
  const next = `(?="(?:${KEYS.join('|')})"\\s*:|}\\s*$)`;
  const out: Record<string, string> = {};
  for (const key of KEYS) {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*,?\\s*${next}`));
    if (m) out[key] = unescapeValue(m[1]);
  }
  return Object.keys(out).length ? out : null;
}

function unescapeValue(raw: string): string {
  // エスケープされていない " と改行を JSON の書き方に直してから、\" や \n を元に戻す
  const escaped = raw
    .replace(/\\?"/g, (q) => (q === '"' ? '\\"' : q))
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  try {
    return JSON.parse(`"${escaped}"`) as string;
  } catch {
    return raw;
  }
}

/**
 * 日本語で「英語でどう説明する？」と聞かれたときの添削で、答えではなく
 * 質問の英訳（How do you explain "totonou" in English?）になっているか。
 * 「I'm an engineer. But I can't explain it in English yet.」のような、言いたいことを
 * そのまま英語にしたものは答えなので、質問の形（? で終わる）のときだけ
 */
export function isQuestionAboutEnglish(better: string): boolean {
  return (
    /\?["'”’]?\s*$/.test(better.trim()) &&
    /\bin english\b|\bhow (do|should|would|can|could) (i|you|we) (say|explain|describe)\b/i.test(better)
  );
}
