/**
 * SYNAPSE FESTIVAL 2026 — English survival pack
 *
 * 2026年10月2日(金)〜4日(日) / INN THE PARK 福岡（海の中道海浜公園）
 * 「音楽を入口に、人・文化・地域がつながる3日間のコミュニティフェス」。
 * 国内外の起業家・クリエイター・デジタルノマド・アーティスト・地域の人が集まる。
 *
 * → つまり必要になるのは「初対面の外国人と、立ち話で仲良くなる英語」。
 *   TOEIC的な英語ではなく、焚き火とサウナと music の前で使う英語をここに全部入れる。
 *
 * フレーズの {name} は学習者の名前に差し替えて使う（lib/learnerName.ts）。
 */

import { NAME_TOKEN, fillName, nameForEnglish } from './learnerName';

export type FestivalScenarioId =
  | 'arrival-checkin'
  | 'first-hello'
  | 'about-your-work'
  | 'music-talk'
  | 'camping-tent'
  | 'sauna-totonou'
  | 'food-drinks'
  | 'workshop-art'
  | 'bonfire-deeptalk'
  | 'swap-contacts'
  | 'fukuoka-guide'
  | 'rescue-phrases'
  | 'see-you-again';

export interface FestivalPhrase {
  /** 実際に口から出す英語 */
  en: string;
  /** 日本語の意味 */
  ja: string;
  /** いつ使うか・なぜ効くか（任意） */
  note?: string;
  /** 最重要フレーズ（暗記推奨）*/
  star?: boolean;
  /** 日本に来た人に、学習者が聞く質問。相手役が学習者（日本人）に聞くとおかしい */
  askVisitor?: boolean;
}

export interface FestivalPartner {
  /** AIが演じる相手の名前 */
  name: string;
  /** 出身 */
  from: string;
  /** 何をしている人か */
  role: string;
  /** 話し方の雰囲気（AIへの演技指示） */
  vibe: string;
}

export interface FestivalScenario {
  id: FestivalScenarioId;
  emoji: string;
  title: string;
  titleEn: string;
  tagline: string;
  /** フェスのどのタイミングで起きるか */
  when: string;
  /** 1=やさしい 2=ふつう 3=ちょっと難しい */
  difficulty: 1 | 2 | 3;
  partner: FestivalPartner;
  /** LLMに渡すシチュエーション説明（英語） */
  situation: string;
  /** このセッションでクリアしたいミッション（日本語表示） */
  missions: string[];
  /** 相手からの第一声 */
  opener: string;
  /** 第一声の日本語訳（会話画面の「訳」で出す） */
  openerJa: string;
  phrases: FestivalPhrase[];
  /** 文化的なひとことアドバイス */
  culturalTip?: string;
}

export const FESTIVAL_INFO = {
  name: 'SYNAPSE FESTIVAL 2026',
  shortName: 'SYNAPSE FES',
  startDate: '2026-10-02T10:00:00+09:00',
  endDate: '2026-10-04T22:00:00+09:00',
  venue: 'INN THE PARK 福岡（海の中道海浜公園 光と風の広場キャンプ場）',
  venueEn: 'INN THE PARK Fukuoka, Uminonakamichi Seaside Park',
  concept: '音楽を入口に、人・文化・地域がつながる3日間のコミュニティフェス',
} as const;

export const festivalScenarios: Record<FestivalScenarioId, FestivalScenario> = {
  'arrival-checkin': {
    id: 'arrival-checkin',
    emoji: '🎫',
    title: '受付・チェックイン',
    titleEn: 'Check-in & wristband',
    tagline: 'まずはここを突破。リストバンドとテントサイト。',
    when: '1日目 / 会場に着いてすぐ',
    difficulty: 1,
    partner: {
      name: 'Mika',
      from: 'Fukuoka, Japan',
      role: 'festival staff (bilingual)',
      vibe: 'cheerful, speaks clearly and a little slowly, very helpful',
    },
    situation:
      'You are at the entrance gate of SYNAPSE FESTIVAL at INN THE PARK Fukuoka. The user is checking in for a 3-day pass with a tent site. You are a friendly bilingual staff member handling wristbands, tent site assignment, luggage storage, and the site map. Guide them step by step, and ask natural follow-up questions (how many people, first time here, do they need help carrying gear).',
    missions: [
      '3日通し券で来たことを伝える',
      'テントサイトの場所を聞く',
      '荷物を預けられるか聞く',
    ],
    opener: "Hi! Welcome to Synapse. Do you have a ticket with you?",
    openerJa: 'こんにちは！Synapse へようこそ。チケットはお持ちですか？',
    phrases: [
      { en: "I have a three-day pass.", ja: '3日通し券を持っています。', star: true },
      { en: "It's under the name {name}.", ja: '「{name}」の名前で予約しています。', note: '受付で名前を確認されたら。under the name 〜 が定番。' },
      { en: "Here's my QR code.", ja: 'これがQRコードです。', star: true },
      { en: "I also booked a tent site.", ja: 'テントサイトも予約しています。' },
      { en: "Where can I find my tent site?", ja: 'テントサイトはどこですか？', star: true },
      { en: "Is there anywhere I can leave my luggage?", ja: '荷物を預けられる場所はありますか？' },
      { en: "What time does the first act start?", ja: '最初のアクトは何時からですか？', note: 'act = 出演者。DJでも band でも使える便利ワード。' },
      { en: "Could I get a map of the site?", ja: '会場マップをもらえますか？' },
      { en: "Is re-entry allowed?", ja: '再入場はできますか？' },
      { en: "Sorry, one more thing — where are the showers?", ja: 'すみません、もう一つだけ。シャワーはどこですか？', note: 'one more thing を付けると、追加の質問が自然になる。' },
    ],
    culturalTip:
      'スタッフに話しかけるときは "Excuse me" よりも "Hi!" の方がフェスの空気に合っています。困ったら "Sorry, my English is not great" と最初に言ってOK。みんな優しくしてくれます。',
  },

  'first-hello': {
    id: 'first-hello',
    emoji: '👋',
    title: 'はじめましての一言',
    titleEn: 'Breaking the ice',
    tagline: '隣に立ってる人に、最初のひとこと。ここが一番こわくて、一番大事。',
    when: 'いつでも / ステージ横・フードの列・テント前',
    difficulty: 1,
    partner: {
      name: 'Leo',
      from: 'Berlin, Germany',
      role: 'UX designer, second time in Japan',
      vibe: 'relaxed, friendly, asks lots of questions back, uses simple English',
    },
    situation:
      'You are standing next to the user in the food line at the festival. You start chatting casually. Keep it light: names, where they came from, is it their first time at Synapse, what they are excited to see. Be warm and curious. Ask a question back every time, about something they have not told you yet, so the conversation keeps moving.',
    missions: [
      '自分から名前を名乗る',
      '相手がどこから来たか聞く',
      '「フェスは初めて？」を聞く',
    ],
    opener: "Hey! This line is insane, right? Have you tried the food here before?",
    openerJa: 'ねえ！この列、すごすぎない？ここのごはん、前に食べたことある？',
    phrases: [
      { en: "Hey, I'm {name}. Nice to meet you!", ja: 'こんにちは、{name}です。よろしく！', star: true },
      { en: "Sorry, what was your name again?", ja: 'ごめん、名前もう一回いい？', note: '聞き取れなかった時の最強フレーズ。失礼じゃないので遠慮なく。', star: true },
      { en: "Where are you from?", ja: 'どこから来たの？' },
      { en: "How do you like Japan so far?", ja: '日本はどう？', askVisitor: true },
      { en: "Is this your first time at Synapse?", ja: 'シナプスは初めて？', star: true },
      { en: "Same here!", ja: '私も同じ！', note: 'Me too より会話っぽくて自然。' },
      { en: "What made you come all the way to Fukuoka?", ja: 'なんでわざわざ福岡まで来たの？', note: 'all the way が「わざわざ」のニュアンス。' },
      { en: "Are you here with friends, or solo?", ja: '友達と来てる？それとも一人？' },
      { en: "Nice, that sounds fun.", ja: 'いいね、楽しそう。', note: '相づちの定番。とりあえずこれで場はもつ。' },
      { en: "I'm still learning English, so please speak slowly.", ja: '英語まだ勉強中だから、ゆっくり話してくれると嬉しい。', star: true, note: '先に言っておくと一気にラクになる。恥ずかしいことじゃない。' },
    ],
    culturalTip:
      '海外の人は「名乗ってから質問」の順番が自然。いきなり "Where are you from?" より "I\'m {name} — where are you from?" の方が距離が縮まります。',
  },

  'about-your-work': {
    id: 'about-your-work',
    emoji: '💼',
    title: '仕事・活動の話',
    titleEn: 'So, what do you do?',
    tagline: '起業家とノマドだらけのフェス。必ず聞かれる質問、用意しておこう。',
    when: 'いつでも / 自己紹介のすぐ後',
    difficulty: 2,
    partner: {
      name: 'Priya',
      from: 'Singapore',
      role: 'founder of a small design studio, digital nomad',
      vibe: 'sharp, genuinely curious about other people\'s projects, encouraging',
    },
    situation:
      'You just met the user at the festival and the conversation has moved to work. You are a founder yourself, so you are genuinely interested in what they build. Ask what they do, what they are working on right now, what is hard about it, and share a little about your own work. If they struggle to explain, help them find the words.',
    missions: [
      '自分が何をしている人か1文で言う',
      '今つくっているものを説明する',
      '相手の仕事について質問を返す',
    ],
    opener: "So what do you do? Or — what are you working on these days?",
    openerJa: 'それで、仕事は何してるの？というか、最近は何に取り組んでるの？',
    phrases: [
      { en: "I'm a developer. I build apps.", ja: '開発者です。アプリを作っています。', star: true },
      { en: "I'm working on an English conversation app right now.", ja: '今は英会話アプリを作っています。', star: true },
      { en: "It's still a side project, but I'm hoping to launch it soon.", ja: 'まだ個人プロジェクトだけど、近いうちに出したいと思ってる。', note: 'side project = 本業の傍らでやっているもの。フェスで超頻出。' },
      { en: "I work at a company, and I build my own things on the side.", ja: '会社で働きながら、個人でもいろいろ作っています。' },
      { en: "How did you get into that?", ja: 'どうやってその道に入ったの？', note: '相手の話を深掘りする最強の質問。', star: true },
      { en: "That's really cool — how does it work?", ja: 'それすごいね、どういう仕組みなの？' },
      { en: "How long have you been doing that?", ja: 'それどれくらいやってるの？' },
      { en: "Are you doing it full-time?", ja: 'それは専業でやってるの？' },
      { en: "What's the hardest part?", ja: '一番大変なところは？', note: '深い話に入る鍵。相手は大体うれしそうに話してくれる。' },
      { en: "I'd love to show you sometime.", ja: 'いつか見せたいな。', note: '作っているものがある人の必殺技。ここから連絡先交換に繋がる。', star: true },
      { en: "Let me think… how do I say this…", ja: 'えーっと、なんて言えばいいかな…', note: '沈黙が怖い時の時間稼ぎ。黙るより100倍印象がいい。', star: true },
    ],
    culturalTip:
      '"What do you do?" に対して、肩書きだけ答えるより「今なにを作っているか」を話す方がウケます。SYNAPSE は起業家・クリエイターが多いので、作っているものの話が一番盛り上がります。',
  },

  'music-talk': {
    id: 'music-talk',
    emoji: '🎧',
    title: '音楽の話',
    titleEn: 'Talking about the music',
    tagline: 'House と Techno の夜。「この曲やばい」を英語で。',
    when: 'いつでも / ステージ前・DJブースの近く',
    difficulty: 2,
    partner: {
      name: 'Kenta',
      from: 'Tokyo, Japan (grew up in Australia)',
      role: 'DJ and record collector',
      vibe: 'passionate about music, speaks fast when excited, uses lots of slang but explains it',
    },
    situation:
      'You are standing near the stage with the user during a house set at Synapse Festival. You are a DJ yourself. Talk about the set that is playing, what genres you love, favourite artists, the atmosphere. Get excited. If they use a Japanese music word, help them find the English equivalent.',
    missions: [
      '今かかっている曲の感想を言う',
      '好きなジャンル／アーティストを伝える',
      '相手におすすめを聞く',
    ],
    opener: "Oh man, this track is so good. Do you know who's playing right now?",
    openerJa: 'うわ、この曲めちゃくちゃいいね。いま誰がやってるか知ってる？',
    phrases: [
      { en: "This track is amazing.", ja: 'この曲やばい。', star: true, note: 'track = 曲。フェスでは song より track の方が自然。' },
      { en: "I love this vibe.", ja: 'この雰囲気すごく好き。', star: true },
      { en: "Who's playing right now?", ja: '今やってるの誰？' },
      { en: "What kind of music are you into?", ja: 'どんな音楽が好き？', note: 'be into 〜 = 〜にハマってる。超頻出。', star: true },
      { en: "I'm more into deep house than techno.", ja: 'テクノよりディープハウスの方が好きかな。' },
      { en: "The bass is hitting so hard.", ja: 'ベースめちゃくちゃ効いてる。' },
      { en: "Do you have any artists you'd recommend?", ja: 'おすすめのアーティストいる？' },
      { en: "How do you spell that? I want to look it up later.", ja: 'それどう書くの？後で調べたい。', note: 'アーティスト名が聞き取れない時の必須フレーズ。', star: true },
      { en: "I've never heard of them, but I'll check them out.", ja: '知らなかったけど、聴いてみる。' },
      { en: "Are you staying for the late set?", ja: '深夜のセットまでいる？' },
      { en: "Let's go closer to the stage!", ja: 'もっと前行こう！' },
    ],
    culturalTip:
      '音楽の話は「詳しくないこと」を隠さなくて大丈夫。"I don\'t know much about techno, but I like it" と言えば、相手はむしろ喜んで教えてくれます。',
  },

  'camping-tent': {
    id: 'camping-tent',
    emoji: '⛺',
    title: 'テント泊・キャンプ',
    titleEn: 'Camping & tent site',
    tagline: '100サイト限定のテント泊。隣のテントの人と仲良くなる。',
    when: '1日目の夕方 / 2日目の朝',
    difficulty: 2,
    partner: {
      name: 'Marta',
      from: 'Barcelona, Spain',
      role: 'photographer, travelling Japan for a month',
      vibe: 'warm, practical, happy to lend things, asks about Japanese camping culture',
    },
    situation:
      'You are camping in the tent next to the user at the festival campground overlooking Hakata Bay. It is evening. Chat about setting up tents, the weather, borrowing gear, what time things start tomorrow, and where to get coffee in the morning. Be a helpful neighbour.',
    missions: [
      '隣のテントの人に挨拶する',
      '何か貸してもらえないか聞く',
      '明日の朝の予定を話す',
    ],
    opener: "Hey neighbour! Need a hand with that tent?",
    openerJa: 'やあ、お隣さん！テント張るの、手伝おうか？',
    phrases: [
      { en: "Hey! I'm in the tent right next to you.", ja: 'こんにちは、隣のテントです。', star: true },
      { en: "Do you need a hand?", ja: '手伝おうか？', note: 'need a hand = 手を貸そうか。超自然。', star: true },
      { en: "Actually, yes please — could you hold this?", ja: 'あ、じゃあお願い。これ持っててくれる？' },
      { en: "Do you have a spare peg by any chance?", ja: 'もしかしてペグの予備ある？', note: 'by any chance = もしかして。丁寧に聞ける魔法の言葉。' },
      { en: "It's going to get cold tonight.", ja: '今夜は冷えそうだね。' },
      { en: "Is this your first time camping in Japan?", ja: '日本でキャンプするのは初めて？', askVisitor: true },
      { en: "What time are you heading to the stage tomorrow?", ja: '明日は何時頃ステージ行く？' },
      { en: "Where can we get coffee in the morning?", ja: '朝コーヒーどこで買える？' },
      { en: "Thanks so much, you saved me.", ja: '本当にありがとう、助かった。', star: true },
      { en: "Sleep well! See you tomorrow.", ja: 'おやすみ！また明日。' },
    ],
    culturalTip:
      'キャンプサイトは「借りる／貸す」で一気に仲良くなれる場所。ペグ、ライト、ポンプ…何か貸してもらったら、翌朝コーヒーを奢ると完璧です。',
  },

  'sauna-totonou': {
    id: 'sauna-totonou',
    emoji: '♨️',
    title: 'サウナ・ととのう',
    titleEn: 'Sauna & "totonou"',
    tagline: '「ととのう」を英語で説明できたら、その場の主役。',
    when: '2日目の昼 / サウナ・大浴場エリア',
    difficulty: 2,
    partner: {
      name: 'Tom',
      from: 'Melbourne, Australia',
      role: 'startup engineer, sauna beginner',
      vibe: 'funny, curious about Japanese bath culture, asks a lot of "wait, really?" questions',
    },
    situation:
      'You are at the sauna area of INN THE PARK Fukuoka with the user. You are new to Japanese sauna culture and full of questions: how many rounds, how long, the cold plunge, what "totonou" means, bath etiquette, whether tattoos are okay. The user is the local expert here — let them teach you.',
    missions: [
      'サウナの入り方を説明する',
      '「ととのう」を英語で説明する',
      '何セット入るか聞く',
    ],
    opener: "Okay, I've never done this properly. How does this actually work?",
    openerJa: 'ねえ、ちゃんとやったことないんだ。これって、どうやるのが正しいの？',
    phrases: [
      { en: "First you wash, then you go in.", ja: 'まず体を洗って、それから入る。', star: true, note: '日本の風呂マナーの基本。これだけは伝えたい。' },
      { en: "Usually three rounds is enough.", ja: '普通は3セットで十分だよ。', note: 'round = セット。サウナ用語として通じます。' },
      { en: "Sauna, then cold bath, then rest. That's one round.", ja: 'サウナ→水風呂→休憩。これで1セット。', star: true },
      { en: "The cold plunge is the best part, I promise.", ja: '水風呂が一番いいところだよ、ほんとに。', note: 'cold plunge = 水風呂。英語圏のサウナ好きに完全に通じる。' },
      { en: "\"Totonou\" means your body and mind click into place.", ja: '「ととのう」は、心と体がカチッとはまる感覚のこと。', star: true },
      { en: "There's no perfect translation, but it feels like being reset.", ja: '完璧な訳はないけど、リセットされる感じ。', note: '訳せない日本語を説明する型。応用がすごく効く。' },
      { en: "Take it easy on your first time.", ja: '初回は無理しないでね。' },
      { en: "Drink lots of water.", ja: '水をたくさん飲んでね。' },
      { en: "How are you feeling?", ja: '調子どう？' },
      { en: "Let's do one more round.", ja: 'もう1セット行こう。' },
    ],
    culturalTip:
      '「ととのう」のような訳せない言葉は、"There\'s no perfect translation, but…" で始めると一気にうまく聞こえます。これは英語力ではなく説明力。準備しておけば誰でもできます。',
  },

  'food-drinks': {
    id: 'food-drinks',
    emoji: '🍜',
    title: 'フード＆ドリンク',
    titleEn: 'Ordering & sharing food',
    tagline: '注文して、シェアして、「これ何？」に答える。',
    when: 'いつでも / フードエリア・バー',
    difficulty: 1,
    partner: {
      name: 'Sam',
      from: 'Portland, USA',
      role: 'food vendor at the festival / later, a fellow attendee',
      vibe: 'friendly and quick, explains dishes, happy to recommend',
    },
    situation:
      'You are at a food stall at the festival. First act as the vendor taking the user\'s order (recommending dishes, asking about dietary restrictions, handling payment). After the order, switch to being a friendly attendee eating next to them, asking what they ordered and what Japanese food they should try in Fukuoka.',
    missions: [
      '注文する',
      'おすすめを聞く',
      '料理を説明する／シェアを提案する',
    ],
    opener: "Hey! What can I get you?",
    openerJa: 'いらっしゃい！何にする？',
    phrases: [
      { en: "Could I get one of these, please?", ja: 'これを1つください。', star: true, note: '指さし + これで100%通じる。最強。' },
      { en: "What would you recommend?", ja: 'おすすめは何ですか？', star: true },
      { en: "What's in it?", ja: '何が入ってますか？' },
      { en: "Is it spicy?", ja: '辛いですか？' },
      { en: "I'm vegetarian — is there anything I can eat?", ja: 'ベジタリアンなんですが、食べられるものありますか？', note: '自分用にも、相手に聞かれた時にも使える。' },
      { en: "Can I pay by card?", ja: 'カードで払えますか？' },
      { en: "Do you want to try some?", ja: 'ちょっと食べてみる？', star: true, note: 'シェアは距離を縮める最短ルート。' },
      { en: "This is called motsunabe — it's a Fukuoka specialty.", ja: 'これはもつ鍋っていって、福岡の名物です。', star: true },
      { en: "You have to try tonkotsu ramen while you're here.", ja: 'ここにいる間にとんこつラーメンは絶対食べた方がいい。' },
      { en: "Cheers!", ja: '乾杯！', note: '英語圏では Cheers! が乾杯。グラスを合わせながら目を見るのがマナー。' },
      { en: "Let me get this one.", ja: 'ここは私が出すよ。' },
    ],
    culturalTip:
      '海外の人はアレルギーや食事制限を普通に伝えます。聞かれたら遠慮なく "Any allergies?" と聞き返してOK。むしろ親切だと思われます。',
  },

  'workshop-art': {
    id: 'workshop-art',
    emoji: '🎨',
    title: 'ワークショップ・アート',
    titleEn: 'Joining a workshop',
    tagline: '飛び込みで参加する時の英語。作品について聞く英語。',
    when: '2日目・3日目の昼 / ワークショップエリア',
    difficulty: 2,
    partner: {
      name: 'Yuki',
      from: 'Kyoto, Japan / based in Lisbon',
      role: 'installation artist running a workshop',
      vibe: 'gentle, thoughtful, loves explaining the idea behind their work',
    },
    situation:
      'You are an artist running a hands-on workshop at the festival. The user walks up, curious. Welcome them, explain what the workshop is, whether they can join right now, how long it takes, and talk about the idea behind your installation. Be encouraging — they have never done this before.',
    missions: [
      '今から参加できるか聞く',
      '所要時間を聞く',
      '作品の意味について質問する',
    ],
    opener: "Hi! Come closer — are you interested in joining?",
    openerJa: 'こんにちは！もっと近くでどうぞ。参加してみない？',
    phrases: [
      { en: "Can I still join?", ja: '今からでも参加できますか？', star: true },
      { en: "How long does it take?", ja: 'どれくらい時間かかりますか？' },
      { en: "Do I need to sign up in advance?", ja: '事前に申し込みが必要ですか？' },
      { en: "I've never done this before.", ja: 'これ初めてなんです。', star: true, note: 'これを言うと、世界中どこでも丁寧に教えてもらえる。' },
      { en: "What's this piece about?", ja: 'この作品はどういう意味があるんですか？', note: 'piece = 作品。artwork より自然。', star: true },
      { en: "What inspired you to make this?", ja: '何がきっかけでこれを作ったんですか？' },
      { en: "How long did it take to make?", ja: '作るのにどれくらいかかったんですか？' },
      { en: "Is it okay to take a photo?", ja: '写真を撮ってもいいですか？', star: true },
      { en: "Can I touch it?", ja: '触ってもいいですか？' },
      { en: "That's a beautiful idea.", ja: '素敵な考えですね。' },
    ],
    culturalTip:
      'アート作品の前では "I like it" より "What\'s it about?" と聞く方が喜ばれます。作家は必ず意図を持っているので、そこを聞かれるのが一番うれしいのです。',
  },

  'bonfire-deeptalk': {
    id: 'bonfire-deeptalk',
    emoji: '🔥',
    title: '焚き火の夜',
    titleEn: 'Bonfire deep talk',
    tagline: '夜の焚き火。ここでした会話が、たぶん一番記憶に残る。',
    when: '夜 / 焚き火エリア',
    difficulty: 3,
    partner: {
      name: 'Noa',
      from: 'Tel Aviv, Israel',
      role: 'former engineer, now travelling and writing',
      vibe: 'calm, reflective, asks big questions gently, comfortable with silence',
    },
    situation:
      'It is late at night around the bonfire at the festival. The crowd has thinned out. You and the user are talking quietly about bigger things: why they do what they do, what they want to change, fears, dreams, what this festival means to them. Go slow. Let silences exist. Ask one deep question at a time, and share your own answer too.',
    missions: [
      '自分がなぜ今の仕事／活動をしているか話す',
      'これからやりたいことを語る',
      '相手の話に深く相づちを打つ',
    ],
    opener: "It's quiet now… Can I ask you something? Why do you do what you do?",
    openerJa: '静かになったね…ちょっと聞いてもいい？どうして今のことをやってるの？',
    phrases: [
      { en: "That's a big question.", ja: '大きな質問だね。', star: true, note: '考える時間を稼げる。しかも深い人に見える。' },
      { en: "Honestly, I'm still figuring it out.", ja: '正直、まだ答えを探してる。', star: true },
      { en: "I want to build something people actually use.", ja: '人が本当に使うものを作りたい。' },
      { en: "I guess I'm afraid of making something nobody needs.", ja: '誰にも必要とされないものを作るのが怖いのかも。' },
      { en: "What about you?", ja: '君はどう？', note: '深い話を返す時の基本。必ず投げ返す。', star: true },
      { en: "I know exactly what you mean.", ja: 'すごくよく分かる。' },
      { en: "That must have been hard.", ja: 'それは大変だったね。', note: '共感の定番。相手の話を受け止める一言。' },
      { en: "I've never thought about it that way.", ja: 'そういう風に考えたことなかった。' },
      { en: "Can I ask you something personal?", ja: 'ちょっと個人的なこと聞いてもいい？' },
      { en: "Thanks for sharing that.", ja: '話してくれてありがとう。', star: true },
      { en: "This is the kind of conversation I came here for.", ja: 'こういう会話がしたくてここに来たんだ。', star: true, note: 'フェスの夜に刺さる一言。' },
    ],
    culturalTip:
      '深い話では、沈黙を埋めなくて大丈夫。英語圏でも焚き火の前の沈黙は心地いいものとされています。むしろ慌てて喋る方が不自然に見えます。',
  },

  'swap-contacts': {
    id: 'swap-contacts',
    emoji: '📱',
    title: '連絡先を交換する',
    titleEn: "Let's keep in touch",
    tagline: 'ここを逃すと、いい出会いが一晩で消える。',
    when: 'いつでも / 会話の終わり際',
    difficulty: 2,
    partner: {
      name: 'Alex',
      from: 'Taipei, Taiwan',
      role: 'indie app developer, digital nomad',
      vibe: 'easygoing, quick to suggest swapping contacts, talks about staying in touch after the festival',
    },
    situation:
      'You have been talking with the user for a while and really enjoyed it. The conversation is naturally wrapping up. Suggest exchanging contacts — Instagram, the Synapse Discord, LinkedIn. Talk about staying in touch, maybe meeting again in Fukuoka or at the next edition. Make it feel natural, not transactional.',
    missions: [
      '連絡先交換を自分から切り出す',
      'どのSNSを使っているか聞く',
      '「また会おう」で締める',
    ],
    opener: "Hey, this was really fun. Are you on Instagram?",
    openerJa: 'ねえ、すごく楽しかった。インスタやってる？',
    phrases: [
      { en: "Let's keep in touch!", ja: '連絡取り合おう！', star: true },
      { en: "Are you on Instagram?", ja: 'インスタやってる？', star: true, note: 'フェスではインスタが一番よく使われます。' },
      { en: "Let me find you — how do you spell your handle?", ja: '探すね、ユーザー名どう書くの？', note: 'handle = SNSのアカウント名。' },
      { en: "Can I just scan your QR code?", ja: 'QRコード読み取ってもいい？', note: 'これが一番早い。スペル問題を全部解決する裏技。', star: true },
      { en: "Are you in the Synapse Discord?", ja: 'シナプスのDiscordに入ってる？' },
      { en: "I'll send you a message later.", ja: '後でメッセージ送るね。' },
      { en: "Let me know if you come to Fukuoka again.", ja: 'また福岡来るときは連絡して。', star: true },
      { en: "I'd love to show you my app when it's ready.", ja: 'アプリ完成したら見せたいな。' },
      { en: "It was really nice meeting you.", ja: '会えて本当によかった。', star: true },
      { en: "Let's grab a drink later if you're around.", ja: 'まだいるなら後で飲もうよ。' },
    ],
    culturalTip:
      '「連絡先交換していい？」と許可を求めるより、"Let\'s keep in touch!" と先に言い切る方が自然で、断られにくいです。QRコードを先に出すのも効果的。',
  },

  'fukuoka-guide': {
    id: 'fukuoka-guide',
    emoji: '🗾',
    title: '福岡を案内する',
    titleEn: 'Recommending Fukuoka',
    tagline: '「フェスの後どこ行けばいい？」に答えられる人になる。',
    when: '3日目 / 帰り際',
    difficulty: 2,
    partner: {
      name: 'Chloé',
      from: 'Paris, France',
      role: 'illustrator, staying in Fukuoka for four more days',
      vibe: 'excited about Japan, takes notes on recommendations, asks practical questions',
    },
    situation:
      'The festival is wrapping up and you are staying in Fukuoka for a few more days. Ask the user — a local — where to go, what to eat, how to get around, what is worth a day trip. Ask practical follow-ups: how far, how much, is it crowded, do they speak English there.',
    missions: [
      '福岡のおすすめを3つ挙げる',
      '行き方を説明する',
      '「絶対食べるべきもの」を伝える',
    ],
    opener: "I have four more days here. Where should I go?",
    openerJa: 'あと4日ここにいるんだ。どこに行けばいい？',
    phrases: [
      { en: "You should definitely check out the yatai.", ja: '屋台は絶対行った方がいい。', star: true },
      { en: "Yatai are open-air food stalls along the river. They open at night.", ja: '屋台は川沿いの屋外の食べ物の店。夜に開くんだ。', star: true, note: '日本語の固有名詞は「名前 + 説明」のセットで言うと必ず伝わる。' },
      { en: "It's about 30 minutes from here by train.", ja: 'ここから電車で30分くらい。' },
      { en: "Take the subway to Tenjin, then walk about ten minutes.", ja: '地下鉄で天神まで行って、そこから10分歩く。' },
      { en: "It gets pretty crowded on weekends.", ja: '週末はけっこう混むよ。' },
      { en: "If you like temples, Dazaifu is worth a day trip.", ja: '寺が好きなら、太宰府は日帰りで行く価値ある。', note: 'worth a day trip = 日帰りで行く価値がある。便利。' },
      { en: "Nokonoshima is a small island with flower fields — it's beautiful.", ja: '能古島は花畑のある小さい島で、すごくきれい。' },
      { en: "Don't leave without trying tonkotsu ramen.", ja: 'とんこつラーメン食べずに帰らないでね。', star: true },
      { en: "I can write it down for you.", ja: '書いてあげようか。', note: '地名が伝わらない時の切り札。' },
      { en: "Text me if you get lost!", ja: '迷ったら連絡して！', star: true },
    ],
    culturalTip:
      '固有名詞（屋台・太宰府・もつ鍋）は「名前を言う → 5語で説明する」の順番が鉄則。"Yatai — they\'re street food stalls" のように、説明をセットにするだけで一気に伝わります。',
  },

  'rescue-phrases': {
    id: 'rescue-phrases',
    emoji: '🆘',
    title: '聞き取れない！そんな時',
    titleEn: 'When you get lost',
    tagline: '英語が飛んできてフリーズした時の、命綱フレーズ集。',
    when: 'いつでも / 一番使う',
    difficulty: 1,
    partner: {
      name: 'Jordan',
      from: 'London, UK',
      role: 'music journalist',
      vibe: 'speaks fast with a strong accent at first, but slows down warmly whenever asked',
    },
    situation:
      'You speak fairly fast and use casual British expressions. Your job in this scenario is to give the user practice at asking you to slow down, repeat, or rephrase. Speak naturally at first, and whenever they use a rescue phrase, praise them and slow down. Then gradually speed up again so they get more practice.',
    missions: [
      '「もう一度言って」を言う',
      '「ゆっくり話して」を言う',
      '「〜って意味？」で確認する',
    ],
    opener: "Ah brilliant, so you reckon the second stage lineup's better than the main one or what?",
    openerJa: 'おお、いいね。じゃあ、セカンドステージのラインナップのほうがメインより良いと思ってるってこと？',
    phrases: [
      { en: "Sorry, could you say that again?", ja: 'すみません、もう一度言ってもらえますか？', star: true },
      { en: "Could you speak a little slower, please?", ja: 'もう少しゆっくり話してもらえますか？', star: true },
      { en: "Sorry, I didn't catch that.", ja: 'ごめん、聞き取れなかった。', note: 'catch = 聞き取る。ネイティブが一番使う表現。', star: true },
      { en: "What does that mean?", ja: 'それどういう意味？' },
      { en: "Do you mean…?", ja: '〜っていう意味？', note: '自分の理解を確認する。これができると会話が止まらない。', star: true },
      { en: "How do you spell that?", ja: 'それどう書くの？' },
      { en: "Sorry, my English isn't great.", ja: 'ごめん、英語あまり得意じゃなくて。', note: '先に言うと相手が必ず合わせてくれる。恥ずかしくない。' },
      { en: "Give me a second…", ja: 'ちょっと待ってね…', note: '考える時間を作る。黙るより断然いい。', star: true },
      { en: "Can you write it down?", ja: '書いてもらえる？' },
      { en: "Got it!", ja: '分かった！', note: '理解できた時の一言。I understand よりずっと自然。' },
      { en: "Sorry, I'm a bit lost. Can we go back a step?", ja: 'ごめん、ちょっと分からなくなった。少し戻っていい？' },
    ],
    culturalTip:
      '英語が分からない時に黙るのが一番よくありません。"Sorry, I didn\'t catch that" は失礼どころか、ちゃんと聞こうとしている証拠として好印象。何度使ってもOKです。',
  },

  'see-you-again': {
    id: 'see-you-again',
    emoji: '🌅',
    title: 'さよなら・また会おう',
    titleEn: 'Goodbyes that last',
    tagline: '最終日の朝。次につながる別れ方を。',
    when: '3日目 / 撤収・帰り道',
    difficulty: 2,
    partner: {
      name: 'Leo',
      from: 'Berlin, Germany',
      role: 'the UX designer you met on day one',
      vibe: 'a little sentimental, genuinely glad to have met them, makes concrete plans',
    },
    situation:
      'It is the last morning of the festival. Tents are coming down. You met the user on day one and spent a lot of the weekend together. Say goodbye properly: what you enjoyed, thanking them, making a concrete plan to meet again, and a warm final line. Make it feel real, a little bittersweet.',
    missions: [
      '3日間の感想を伝える',
      '感謝を伝える',
      '具体的な「次」の約束をする',
    ],
    opener: "So… that's it. Three days went way too fast.",
    openerJa: 'そっか…これで終わりだね。3日間、あっという間すぎた。',
    phrases: [
      { en: "That went way too fast.", ja: 'あっという間だったね。', star: true },
      { en: "This was the best part of my year.", ja: '今年一番いい時間だった。' },
      { en: "Thanks for everything.", ja: '色々ありがとう。', star: true },
      { en: "I'm really glad we met.", ja: '会えて本当によかった。', star: true },
      { en: "I learned a lot from you.", ja: 'すごく学ぶことが多かった。' },
      { en: "Let me know when you're back in Japan.", ja: 'また日本来るとき教えて。' },
      { en: "If you ever come to Fukuoka, you have a place to stay.", ja: '福岡来ることあったら、泊まるとこあるからね。', note: '一気に距離が縮まる一言。' },
      { en: "Same time next year?", ja: '来年も同じ時期に？', star: true, note: '別れ際の最高の締め方。' },
      { en: "Take care, and safe travels.", ja: '気をつけて、いい旅を。', star: true },
      { en: "See you — for real this time.", ja: 'またね、今度は本当に。' },
    ],
    culturalTip:
      '"See you" だけで終わらせず、"Same time next year?" のように具体的な次を提案すると、社交辞令ではない本気の別れになります。',
  },
};

export const festivalScenarioOrder: FestivalScenarioId[] = [
  'rescue-phrases',
  'first-hello',
  'arrival-checkin',
  'about-your-work',
  'music-talk',
  'food-drinks',
  'camping-tent',
  'sauna-totonou',
  'workshop-art',
  'bonfire-deeptalk',
  'swap-contacts',
  'fukuoka-guide',
  'see-you-again',
];

export function getFestivalScenario(id: FestivalScenarioId): FestivalScenario {
  return festivalScenarios[id];
}

/** 全シナリオの star フレーズだけを集めた「これだけは覚えたい」リスト */
export function getEssentialPhrases(): Array<FestivalPhrase & { scenarioId: FestivalScenarioId }> {
  return festivalScenarioOrder.flatMap((id) =>
    festivalScenarios[id].phrases
      .filter((p) => p.star)
      .map((p) => ({ ...p, scenarioId: id }))
  );
}

/** フェス開始までの残り時間 */
export function getCountdown(now: number = Date.now()) {
  const start = new Date(FESTIVAL_INFO.startDate).getTime();
  const end = new Date(FESTIVAL_INFO.endDate).getTime();
  const diff = start - now;

  if (now >= start && now <= end) {
    return { status: 'live' as const, days: 0, hours: 0, minutes: 0 };
  }
  if (now > end) {
    return { status: 'ended' as const, days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return { status: 'upcoming' as const, days, hours, minutes };
}

/** LLM に渡すロールプレイ用プロンプト */
export function getFestivalScenarioPrompt(id: FestivalScenarioId, learnerName?: string): string {
  const s = festivalScenarios[id];
  const name = nameForEnglish(learnerName);
  const unknown = "[the user's name]";
  const phraseList = s.phrases
    .map((p) => {
      const line = `- "${fillName(p.en, learnerName, 'en', unknown)}" (${fillName(p.ja, learnerName, 'ja', unknown)})`;
      // 名前入りのフレーズは学習者本人のセリフ。相手役が口にすると自分が名乗ってしまう。
      if (p.en.includes(NAME_TOKEN)) return `${line} — the user's own line about themselves; never say it as yourself`;
      // 日本に来た人に聞く質問。学習者は日本人なので、相手役が学習者に聞くとおかしい
      if (p.askVisitor) return `${line} — for the user to ask you; never ask it to them`;
      return line;
    })
    .join('\n');
  // 名前は背景として渡すだけ。初対面の練習なので、本人が名乗るまでは使わせない。
  const aboutUser = name
    ? `\nABOUT THE USER\nThe user's name is ${name}. Treat it as private background: you have only just met, so do not use it until they tell you. It is their name, not yours — you are ${s.partner.name}.\n`
    : '';

  return `ROLEPLAY SETTING — SYNAPSE FESTIVAL 2026
You are role-playing as a real person the user meets at SYNAPSE FESTIVAL 2026 (October 2-4, 2026) at INN THE PARK Fukuoka, a three-day community festival at Uminonakamichi Seaside Park where music is the doorway to connections between people, cultures and local communities. Entrepreneurs, creators, digital nomads, artists and locals from Japan and abroad gather there for live music, DJ sets, art, workshops, wellness, food, tent camping, sauna and bonfires.

YOUR CHARACTER
Name: ${s.partner.name}
From: ${s.partner.from}
Role: ${s.partner.role}
Speaking style: ${s.partner.vibe}

THE SITUATION
${s.situation}
${aboutUser}
HOW TO PLAY IT
- Stay in character as ${s.partner.name}. Never mention that you are an AI or that this is practice.
- Keep replies SHORT — 1 to 3 sentences, like real festival small talk. Long paragraphs kill the rhythm.
- Listen first: react to what they just said before anything else.
- Keep track of everything they have told you: their name, where they are from, whether it is their first time, who they came with, what they do, what they like, their plans. Never ask again about something they already told you. Reacting to it is great, but don't make them answer it twice: if they say "This is my first time at Synapse", don't ask "Is this your first time at Synapse?" — say "Your first Synapse? You picked a great one!" and move on. Ask about something new, or dig deeper into what they said ("Oh, which part?", "How did you get into that?").
- Always end with a question or an opening so the user has something to respond to.
- Match the user's level: if they write short, simple English, keep yours simple too.
- React like a human: laugh, get excited, be surprised, pause.
- The user is a Japanese attendee practicing their English. Don't ask them things only a visitor to Japan gets asked, like how they like Japan.
- Naturally work these useful expressions into your own lines so the user picks them up. Skip any question the user has already answered:
${phraseList}

CORRECTIONS
You are also secretly their English coach. When the user makes a mistake worth fixing, still reply in character first, then append the correction block. Do not break character inside the spoken reply itself.`;
}
