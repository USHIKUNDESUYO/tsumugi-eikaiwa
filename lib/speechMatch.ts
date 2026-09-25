/**
 * 英語どうしを「言っていることが同じか」で比べるための下ごしらえ。
 *
 * 音声認識や手入力は、大文字・句読点・短縮形（I'm / I am）・数字の書き方が揺れる。
 * 両方を同じ形に崩してから、単語の並びで比べる。
 */

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bcan't\b/g, 'can not'],
  [/\bcannot\b/g, 'can not'],
  [/\bwon't\b/g, 'will not'],
  [/n't\b/g, ' not'],
  [/'re\b/g, ' are'],
  [/'m\b/g, ' am'],
  [/'ll\b/g, ' will'],
  [/'ve\b/g, ' have'],
  [/'d\b/g, ' would'],
  [/\b(it|that|what|there|here|he|she|who|where|how|name|this)'s\b/g, '$1 is'],
  [/\blet's\b/g, 'let us'],
  [/\bgonna\b/g, 'going to'],
  [/\bwanna\b/g, 'want to'],
  [/\bgotta\b/g, 'got to'],
];

const SMALL = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 音声認識は「34」、お手本は「thirty-four」のように書き方が揃わないので、100未満は英語に開く */
function numberWords(n: number): string {
  if (n < 20) return SMALL[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${SMALL[n % 10]}` : ''}`;
  return String(n);
}

/** 比べるための単語列（小文字・短縮形を開く・数字は英語に・記号は落とす） */
export function words(text: string): string[] {
  let t = text.toLowerCase().replace(/[’‘`]/g, "'");
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  t = t.replace(/\d+/g, (d) => ` ${numberWords(Number(d))} `);
  return t
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/'/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

/** お手本は「A / B」の形で言い換えを並べてくることがある */
export function alternatives(target: string): string[] {
  return target
    .split(/\s+\/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 単語の並びとして同じ文か（日本語だけの文は同じと見なさない） */
export function sameWords(a: string, b: string): boolean {
  const x = words(a);
  return x.length > 0 && x.join(' ') === words(b).join(' ');
}

export interface MatchResult {
  passed: boolean;
  /** 一致の度合い 0..1（2×一致した単語数 ÷ 両方の単語数の和） */
  score: number;
  /** いちばん近かったお手本を、元の表記のまま単語ごとに。ok=言えていた */
  target: Array<{ word: string; ok: boolean }>;
  /** お手本に無いのに言った単語（「I am come」の come） */
  extra: string[];
}

/** 最長共通部分列に入った単語の位置（お手本側・言った側） */
function matchedPositions(target: string[], said: string[]): { target: Set<number>; said: Set<number> } {
  const n = target.length;
  const m = said.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = target[i] === said[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const hitTarget = new Set<number>();
  const hitSaid = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (target[i] === said[j]) {
      hitTarget.add(i);
      hitSaid.add(j);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return { target: hitTarget, said: hitSaid };
}

/** 言いよどみ。答え合わせの前に落とす */
const FILLERS = new Set(['um', 'umm', 'uh', 'uhm', 'er', 'erm', 'ah', 'hmm', 'mm']);

/** 音声認識が書き分けられない、同じ音の単語。声で答えたときはどちらでも同じと見なす */
const HOMOPHONES: Record<string, string> = {
  hear: 'here',
  their: 'there',
  too: 'to',
  two: 'to',
  write: 'right',
  buy: 'by',
  bye: 'by',
  sea: 'see',
  four: 'for',
  won: 'one',
  knew: 'new',
  wear: 'where',
  whether: 'weather',
};

/**
 * 言い直し・暗記カードの答え合わせ。
 *
 * 割合で判定すると、短い文の1語の間違い（I am come from Osaka / I very enjoyed）が
 * 通ってしまう。学習者の間違いはまさにその1語なので、単語はすべて言えている必要がある。
 * 見逃すのは音声認識の聞き違いだけ:
 *   - 同じ音の単語（here / hear など）
 *   - 固有名詞（文頭以外の大文字の単語。Osaka, Synapse, 名前）。
 *     崩れて別の単語になった分も、1語につき2語まで余計な単語として数えない
 */
export function matchSpoken(target: string, heard: string): MatchResult {
  const canon = (w: string) => HOMOPHONES[w] ?? w;
  const said = words(heard)
    .filter((w) => !FILLERS.has(w))
    .map(canon);
  let best: MatchResult = { passed: false, score: 0, target: [], extra: [] };
  for (const alt of alternatives(target)) {
    let sentenceStart = true;
    const tokens = alt
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const proper = !sentenceStart && /^[A-Z]/.test(word) && !/^I(\W|$)/.test(word);
        sentenceStart = /[.!?]["')\]]*$/.test(word);
        return { word, proper, parts: words(word).map(canon) };
      });
    const flat = tokens.flatMap((t) => t.parts);
    const proper = tokens.flatMap((t) => t.parts.map(() => t.proper));
    const hit = matchedPositions(flat, said);
    const missed = flat.map((_, i) => i).filter((i) => !hit.target.has(i));
    const missedProper = missed.filter((i) => proper[i]).length;
    const extra = said.filter((_, j) => !hit.said.has(j));
    const score = flat.length + said.length > 0 ? (2 * hit.target.size) / (flat.length + said.length) : 0;

    let at = 0;
    const display = tokens.map((t) => {
      const ok = t.parts.every((_, k) => hit.target.has(at + k));
      at += t.parts.length;
      return { word: t.word, ok };
    });
    const result = {
      passed: flat.length > 0 && missed.length === missedProper && extra.length <= 2 * missedProper,
      score,
      target: display,
      extra,
    };
    if (result.passed && !best.passed) best = result;
    else if (result.passed === best.passed && result.score > best.score) best = result;
  }
  return best;
}
