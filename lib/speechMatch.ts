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
