/**
 * フレーズの中の {name} を、学習者の名前に差し替える。
 *
 * 名乗る・予約名を伝えるといったフレーズは、本人の名前が入ってはじめて
 * 使える練習になる。以前は開発者の名前（Ushi）が直書きされていて、
 * ほかの人には他人の自己紹介になり、会話の相手役まで "I'm Ushi" と名乗っていた。
 *
 * オンボーディングで聞く名前は「紬が呼ぶ名前」なので、たいてい
 * ひらがな・カタカナで入る。英文の中にかなのままでは読めないし、英語の
 * 読み上げでも発音されないので、英文に入れるときはヘボン式のローマ字に直す。
 * 漢字は読みが分からないので、入力されたまま使う。
 */

export const NAME_TOKEN = '{name}';

/** 名前が無いとき（入力前・既定値）に埋める印。和文の教材でおなじみの伏せ字 */
const BLANK = '○○';

/** オンボーディングで空のまま進んだときに入る既定値。名前としては扱わない。 */
const DEFAULT_NAMES = new Set(['あなた']);

const KANA: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', ゐ: 'i', ゑ: 'e', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ゔ: 'vu',
};

/** 小さい「ゃゅょ」: きゃ → kya、しゃ → sha */
const SMALL_Y: Record<string, string> = { ゃ: 'a', ゅ: 'u', ょ: 'o' };
/** 小さい母音: ティ → ti、ファ → fa、ウィ → wi */
const SMALL_VOWEL: Record<string, string> = { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o' };

function toHiragana(s: string): string {
  // カタカナ（ァ〜ヶ）はひらがなより 0x60 後ろにある
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** かなだけでできた名前をローマ字にする。かな以外が混じっていたら null。 */
function kanaToRomaji(kana: string): string | null {
  // 1文字ずつのローマ字。小さい字は直前の1文字と組み合わせるので、文字単位で持つ。
  const pieces: string[] = [];
  let doubleNext = false;

  for (const c of toHiragana(kana)) {
    const prev = pieces[pieces.length - 1];

    if (c === 'っ') {
      doubleNext = true;
    } else if (c === 'ー') {
      // 長音はパスポートのヘボン式にならって書かない（ユーキ → Yuki）
    } else if (SMALL_Y[c] && prev?.endsWith('i')) {
      // きゃ → kya。しゃ・ちゃ・じゃ は y を挟まない（sha / cha / ja）
      const stem = prev.slice(0, -1);
      pieces[pieces.length - 1] = stem + (/(sh|ch|j)$/.test(stem) ? '' : 'y') + SMALL_Y[c];
    } else if (SMALL_VOWEL[c] && prev && /[aiueo]$/.test(prev)) {
      // ティ → ti、ファ → fa、ウィ → wi（「う」だけのときは w を立てる）
      const stem = prev.slice(0, -1);
      pieces[pieces.length - 1] = (stem || 'w') + SMALL_VOWEL[c];
    } else {
      let piece = KANA[c] ?? SMALL_VOWEL[c];
      if (!piece) return null;
      if (doubleNext) {
        // っ は次の子音を重ねる。ch の前だけは t（まっちゃ → matcha）
        piece = piece.startsWith('ch') ? 't' + piece : piece[0] + piece;
        doubleNext = false;
      }
      pieces.push(piece);
    }
  }
  return pieces.join('') || null;
}

/**
 * 表示名を整える。名前として使えないもの（空・既定値）は空文字。
 * 相手役のプロンプトにも入るので、改行などの制御文字は落とし、長さも切る。
 */
function cleanName(displayName: string | undefined): string {
  const name = (displayName ?? '')
    .normalize('NFKC')
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
  return DEFAULT_NAMES.has(name) ? '' : name;
}

/**
 * 英文の中で使う名前。
 * 英字はそのまま（頭だけ大文字）、かなはローマ字、読めないものは入力のまま。
 */
export function nameForEnglish(displayName: string | undefined): string {
  const name = cleanName(displayName);
  if (!name) return '';
  if (/^[A-Za-z][A-Za-z .'-]*$/.test(name)) return name[0].toUpperCase() + name.slice(1);
  const romaji = kanaToRomaji(name);
  return romaji ? romaji[0].toUpperCase() + romaji.slice(1) : name;
}

/**
 * {name} を差し替える。
 * lang は {name} が置かれている文の言語（和文の中の英語フレーズなら 'en'）。
 * blank は名前が無いときに埋める文字（画面では ○○、プロンプトでは説明文）。
 */
export function fillName(
  text: string,
  displayName: string | undefined,
  lang: 'en' | 'ja',
  blank: string = BLANK
): string {
  if (!text.includes(NAME_TOKEN)) return text;
  const name = lang === 'en' ? nameForEnglish(displayName) : cleanName(displayName);
  return text.split(NAME_TOKEN).join(name || blank);
}
