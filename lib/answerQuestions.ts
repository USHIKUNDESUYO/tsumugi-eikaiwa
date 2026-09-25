import type { FestivalScenarioId } from './festivalScenarios';

/**
 * フェスで必ず聞かれる質問（自分の答えノート）。
 *
 * 初対面の雑談で聞かれることはほぼ決まっている。自分の答えを先に英語にして
 * 口ぐせにしておくのが、本番でいちばん効く準備になる。
 * 英文は scripts/export-voice-lines.ts で紬の声にしている（public/voice-en/）。
 */
export interface AnswerQuestion {
  id: string;
  en: string;
  ja: string;
  /** 何を書けばいいかの手がかり */
  hint: string;
  /** 下書きの例（入力欄のプレースホルダ） */
  example: string;
  /** この質問が出やすい場面（会話中の💡で、自分の答えを先に並べる） */
  scenes: FestivalScenarioId[];
}

export const ANSWER_QUESTIONS: AnswerQuestion[] = [
  {
    id: 'name',
    en: "What's your name?",
    ja: '名前は？',
    hint: '呼んでほしい名前。覚えてもらえるひとことがあると強い',
    example: 'ゆきです。雪の日に生まれたから、ゆき',
    scenes: ['first-hello', 'swap-contacts', 'arrival-checkin'],
  },
  {
    id: 'from',
    en: 'Where are you from?',
    ja: 'どこから来たの？',
    hint: '住んでいる街と、その街のひとこと紹介',
    example: '大阪から来た。たこ焼きの街',
    scenes: ['first-hello', 'camping-tent', 'food-drinks'],
  },
  {
    id: 'work',
    en: 'What do you do?',
    ja: '仕事は何をしてるの？',
    hint: '何をしている人かを1文で。会社名より「何を作っているか」',
    example: 'IT企業のエンジニア。飲食店向けのアプリを作ってる',
    scenes: ['about-your-work', 'first-hello', 'bonfire-deeptalk'],
  },
  {
    id: 'project',
    en: 'What are you working on these days?',
    ja: '最近は何に取り組んでるの？',
    hint: 'いま作っているもの・がんばっていること',
    example: '英会話アプリを作ってる。キャラと話して練習できるやつ',
    scenes: ['about-your-work', 'bonfire-deeptalk'],
  },
  {
    id: 'first-time',
    en: 'Is this your first time at Synapse?',
    ja: 'Synapse は初めて？',
    hint: '初めてかどうかと、ひとこと',
    example: '初めて！友だちに誘われて来た',
    scenes: ['first-hello', 'music-talk', 'arrival-checkin'],
  },
  {
    id: 'why',
    en: 'What brought you here?',
    ja: 'どうして来たの？',
    hint: '来た理由・楽しみにしていること',
    example: '音楽が好きだし、いろんな国の人と話してみたくて',
    scenes: ['first-hello', 'bonfire-deeptalk'],
  },
  {
    id: 'music',
    en: 'What kind of music are you into?',
    ja: 'どんな音楽が好き？',
    hint: '好きなジャンルやアーティストをひとつ',
    example: 'ハウスとテクノが好き。夜のDJが楽しみ',
    scenes: ['music-talk', 'first-hello'],
  },
  {
    id: 'fun',
    en: 'What do you do for fun?',
    ja: '休みの日は何してるの？',
    hint: '趣味をひとつ。好きな理由もあると話が続く',
    example: 'サウナとキャンプ。ととのうのが好き',
    scenes: ['bonfire-deeptalk', 'camping-tent', 'sauna-totonou'],
  },
  {
    id: 'fukuoka',
    en: 'Any recommendations in Fukuoka?',
    ja: '福岡のおすすめってある？',
    hint: '食べ物か場所をひとつ。どこで食べられるかも',
    example: '天神の屋台。ラーメンともつ鍋が最高',
    scenes: ['fukuoka-guide', 'food-drinks'],
  },
  {
    id: 'stay',
    en: 'How long are you staying?',
    ja: 'いつまでいるの？',
    hint: '何日いるか・どこに泊まっているか',
    example: '3日間ずっといる。テントに泊まってる',
    scenes: ['camping-tent', 'see-you-again', 'arrival-checkin'],
  },
];
