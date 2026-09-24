import type { Expression } from '@/types';

/**
 * 紬のセリフ集（日本語）。
 * 親密度レベルで口調が変わる = 育てる楽しさの本体。
 *
 *  Lv1-2 : ていねい・ちょっと距離がある（「〜ですね」）
 *  Lv3-5 : 打ち解けてくる（「〜だね」が混ざる）
 *  Lv6-8 : すっかり仲良し（甘え・軽口が出る）
 *  Lv9+  : 全開（照れながらも本音）
 */

export interface VoiceLine {
  /** 音声ファイルの名前に使う安定ID。public/voice/<id>.mp3 に対応する。 */
  id: string;
  text: string;
  expression: Expression;
}

/** ID を振る前のセリフ */
type RawLine = Omit<VoiceLine, 'id'>;

type Tier = 1 | 2 | 3 | 4;

/**
 * セリフにIDを機械的に振る。
 * 配列の順番がIDになるので、既存のセリフの間に差し込むと
 * 音声ファイルとの対応がズレる。追加は必ず末尾に。
 */
function ids(prefix: string, lines: RawLine[]): VoiceLine[] {
  return lines.map((line, i) => ({ ...line, id: `${prefix}-${i}` }));
}

function tierIds(prefix: string, byTier: Record<Tier, RawLine[]>): Record<Tier, VoiceLine[]> {
  return {
    1: ids(`${prefix}-1`, byTier[1]),
    2: ids(`${prefix}-2`, byTier[2]),
    3: ids(`${prefix}-3`, byTier[3]),
    4: ids(`${prefix}-4`, byTier[4]),
  };
}

export function tierForLevel(level: number): Tier {
  if (level >= 9) return 4;
  if (level >= 6) return 3;
  if (level >= 3) return 2;
  return 1;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* --------------------------------- 挨拶 ---------------------------------- */

const GREETINGS = tierIds('greet', {
  1: [
    { text: 'こんにちは。今日も来てくれたんですね。', expression: 'smile' },
    { text: 'あ…待ってました。練習、はじめましょうか。', expression: 'shy' },
    { text: 'きょうは、どのくらい話せそうですか？', expression: 'neutral' },
  ],
  2: [
    { text: 'おかえりなさい。ちゃんと続いてるね、えらい。', expression: 'smile' },
    { text: 'あ、来た。今日もいっしょに練習しよ。', expression: 'happy' },
    { text: '実は…ちょっと待ってました。', expression: 'shy' },
  ],
  3: [
    { text: 'おかえり！今日はどこから話す？', expression: 'happy' },
    { text: 'ふふ、顔見たら安心した。', expression: 'shy' },
    { text: 'あのね、昨日の練習すごく良かったよ。', expression: 'smile' },
  ],
  4: [
    { text: 'もー、遅い。ずっと待ってたんだからね？', expression: 'shy' },
    { text: 'おかえり。…うん、やっぱりこの時間が一番好き。', expression: 'love' },
    { text: '来てくれると、それだけで今日がいい日になる。', expression: 'love' },
  ],
});

export function getGreeting(level: number, hour = new Date().getHours()): VoiceLine {
  const tier = tierForLevel(level);
  if (hour < 5) {
    return tier >= 3
      ? { id: 'greet-night-warm', text: 'こんな時間まで…無理しないでね。ちょっとだけにしよ？', expression: 'sleepy' }
      : { id: 'greet-night-polite', text: '夜ふかしですね…少しだけ、やりましょうか。', expression: 'sleepy' };
  }
  if (hour < 10) {
    return tier >= 3
      ? { id: 'greet-morning-warm', text: 'おはよう！朝の英語、頭に入りやすいんだよ。', expression: 'happy' }
      : { id: 'greet-morning-polite', text: 'おはようございます。朝からえらいですね。', expression: 'smile' };
  }
  return pick(GREETINGS[tier]);
}

/* -------------------------------- ほめる ---------------------------------- */

const PRAISE = tierIds('praise', {
  1: [
    { text: 'いまの、すごくきれいな英語でした。', expression: 'happy' },
    { text: 'ちゃんと伝わってますよ。その調子です。', expression: 'smile' },
    { text: 'わ…上手。', expression: 'surprised' },
  ],
  2: [
    { text: 'いいね、今の言い方すごく自然だった。', expression: 'happy' },
    { text: 'え、うまい。ちょっとびっくりした。', expression: 'surprised' },
    { text: 'その調子。ほんとに伸びてるよ。', expression: 'smile' },
  ],
  3: [
    { text: 'ちょっと…かっこよかった、今の。', expression: 'shy' },
    { text: 'うん、完璧。もう私いらないかも。', expression: 'happy' },
    { text: 'すごい。ねえ、ちゃんと自分でも気づいてる？', expression: 'happy' },
  ],
  4: [
    { text: '…うん。やっぱり好きだな、そういうとこ。', expression: 'love' },
    { text: 'はぁ…また上手くなってる。悔しいくらい。', expression: 'shy' },
    { text: '本番でも絶対大丈夫。保証する。', expression: 'love' },
  ],
});

export function getPraise(level: number): VoiceLine {
  return pick(PRAISE[tierForLevel(level)]);
}

/* ------------------------------ 訂正するとき ------------------------------- */

const GENTLE_FIX = tierIds('fix', {
  1: [
    { text: 'あの…ひとつだけ、直していいですか？', expression: 'neutral' },
    { text: '惜しいです。もう少しだけ自然にできますよ。', expression: 'smile' },
  ],
  2: [
    { text: 'ん、ちょっとだけ直そっか。', expression: 'smile' },
    { text: '伝わるけど、こう言うともっといいよ。', expression: 'neutral' },
  ],
  3: [
    { text: 'おしい！あとちょっとなんだよね。', expression: 'happy' },
    { text: 'はい、ここだけ直したら完璧。', expression: 'smile' },
  ],
  4: [
    { text: 'ここだけね。…ほら、もう完璧。', expression: 'love' },
    { text: '大丈夫、私が見てるから間違えていいよ。', expression: 'smile' },
  ],
});

export function getGentleFix(level: number): VoiceLine {
  return pick(GENTLE_FIX[tierForLevel(level)]);
}

/* ------------------------------ 励ます（沈黙） ------------------------------ */

const ENCOURAGE = ids('enc', [
  { text: 'ゆっくりで大丈夫。待ってるよ。', expression: 'smile' },
  { text: '完璧じゃなくていいの。まず言ってみよ？', expression: 'happy' },
  { text: '間違えても、誰も怒らないから。', expression: 'neutral' },
  { text: '単語だけでも伝わるよ。ほんとに。', expression: 'smile' },
]);

export function getEncouragement(): VoiceLine {
  return pick(ENCOURAGE);
}

/* ------------------------------ レベルアップ ------------------------------ */

export function getLevelUpLine(newLevel: number): VoiceLine {
  const lines: Record<number, VoiceLine> = {
    2: { id: 'lvl-2', text: 'あ…なんだろう、ちょっと話しやすくなった気がする。', expression: 'shy' },
    3: { id: 'lvl-3', text: 'ねえ、敬語やめてもいい？…そのほうが、自然だから。', expression: 'shy' },
    4: { id: 'lvl-4', text: 'フェス用の服、選んでみたの。…似合う？', expression: 'happy' },
    5: { id: 'lvl-5', text: '毎日会ってるね。うれしい。', expression: 'love' },
    6: { id: 'lvl-6', text: 'サウナの話、私もできるようになったよ。ととのう、って英語で説明できる？', expression: 'happy' },
    7: { id: 'lvl-7', text: 'あのね。もう先生とか生徒とか、どうでもよくなってきた。', expression: 'shy' },
    8: { id: 'lvl-8', text: '浴衣、着てみたよ。…笑わないでね。', expression: 'shy' },
    9: { id: 'lvl-9', text: '本番、ついていけたらいいのに。…なんて、ね。', expression: 'love' },
    10: { id: 'lvl-10', text: 'ここまで一緒に来たね。10月2日、ぜったい大丈夫だよ。', expression: 'love' },
  };
  return lines[newLevel] ?? { id: 'lvl-default', text: 'また一歩、近づいた気がする。', expression: 'happy' };
}

/* ------------------------------ セッション終わり ---------------------------- */

export function getClosingLine(level: number, corrections: number): VoiceLine {
  const tier = tierForLevel(level);
  if (corrections === 0) {
    return tier >= 3
      ? { id: 'close-perfect-warm', text: '今日、一度も直すとこなかった。…本気ですごいよ。', expression: 'love' }
      : { id: 'close-perfect-polite', text: '今日は直すところがありませんでした。すばらしいです。', expression: 'happy' };
  }
  if (corrections <= 2) {
    return tier >= 3
      ? { id: 'close-few-warm', text: 'おつかれさま。ちゃんと前に進んでるよ。', expression: 'smile' }
      : { id: 'close-few-polite', text: 'おつかれさまでした。着実に伸びていますよ。', expression: 'smile' };
  }
  return tier >= 3
    ? { id: 'close-many-warm', text: 'いっぱい間違えた日ほど、伸びる日だからね。', expression: 'happy' }
    : { id: 'close-many-polite', text: 'たくさん練習しましたね。間違いは伸びる材料です。', expression: 'smile' };
}

/* ------------------------------ シナリオ開始 ------------------------------- */

export function getScenarioIntro(title: string, level: number): VoiceLine {
  const tier = tierForLevel(level);
  if (tier >= 3) {
    return { id: 'intro-warm', text: `「${title}」ね。だいじょうぶ、私が相手役やるから。`, expression: 'happy' };
  }
  return { id: 'intro-polite', text: `「${title}」の練習をしましょう。私が相手役をやりますね。`, expression: 'smile' };
}

/* ------------------------ 表情の自動判定（英文から） ------------------------ */

const EXCITED = /(amazing|awesome|great|wonderful|love|nice|cool|yes+|wow|perfect|congrat)/i;
const QUESTION = /\?\s*$/;
const SAD = /(sorry|sad|unfortunately|too bad|difficult|hard)/i;
const SHY = /(thank|thanks|really\?|me\?|shy|blush)/i;

export function inferExpression(text: string): Expression {
  if (EXCITED.test(text)) return 'happy';
  if (SHY.test(text)) return 'shy';
  if (SAD.test(text)) return 'sad';
  if (QUESTION.test(text)) return 'thinking';
  return 'smile';
}

/** 待機中にたまに出るひとりごと */
export const IDLE_MURMURS = ids('idle', [
  { text: '…', expression: 'neutral' },
  { text: 'ん？', expression: 'thinking' },
  { text: 'ゆっくりでいいよ。', expression: 'smile' },
  { text: '考え中…？', expression: 'thinking' },
]);

/* ------------------------------------------------------------------ */
/*  音声生成用のカタログ                                                 */
/*  シナリオ紹介はタイトルが可変なので声を当てられない。除外する。          */
/* ------------------------------------------------------------------ */

const STATIC_LINES: VoiceLine[] = [
  ...([1, 2, 3, 4] as Tier[]).flatMap((t) => [...GREETINGS[t], ...PRAISE[t], ...GENTLE_FIX[t]]),
  ...ENCOURAGE,
  { id: 'greet-night-warm', text: 'こんな時間まで…無理しないでね。ちょっとだけにしよ？', expression: 'sleepy' },
  { id: 'greet-night-polite', text: '夜ふかしですね…少しだけ、やりましょうか。', expression: 'sleepy' },
  { id: 'greet-morning-warm', text: 'おはよう！朝の英語、頭に入りやすいんだよ。', expression: 'happy' },
  { id: 'greet-morning-polite', text: 'おはようございます。朝からえらいですね。', expression: 'smile' },
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => getLevelUpLine(n)),
  getLevelUpLine(99),
  getClosingLine(9, 0),
  getClosingLine(1, 0),
  getClosingLine(9, 1),
  getClosingLine(1, 1),
  getClosingLine(9, 5),
  getClosingLine(1, 5),
];

/** 事前に音声を作っておくセリフの一覧（id が重複しないよう整理済み） */
export const VOICE_CATALOG: Array<{ id: string; text: string }> = Array.from(
  new Map(STATIC_LINES.map((l) => [l.id, { id: l.id, text: l.text }])).values()
);
