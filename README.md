# 紬の英会話 🌸

**2026年10月2日、福岡。世界中から来る人たちと、英語で話すために。**

SYNAPSE FESTIVAL 2026（10/2–4・INN THE PARK 福岡）に向けた、実戦特化の英会話練習アプリ。
AIパートナー「紬（つむぎ）」が**フェスで実際に出会う人物を演じ**、その場面の英語だけを鍛えます。

---

## なぜフェス特化なのか

SYNAPSE FESTIVAL は「音楽を入口に、人・文化・地域がつながる3日間のコミュニティフェス」。
国内外から**起業家・クリエイター・デジタルノマド・アーティスト**が集まります。

つまり必要なのは TOEIC の英語ではなく、**焚き火とサウナとDJブースの前で使う英語**。
このアプリはそこに全振りしています。

### 13の実戦シナリオ

| | シーン | 相手役 | 何ができるようになるか |
|---|---|---|---|
| 🆘 | 聞き取れない！そんな時 | Jordan（London・音楽ジャーナリスト） | 早口で固まった時の命綱フレーズ |
| 👋 | はじめましての一言 | Leo（Berlin・UXデザイナー） | 隣の人に自分から話しかける |
| 🎫 | 受付・チェックイン | Mika（福岡・バイリンガルスタッフ） | リストバンドとテントサイト |
| 💼 | 仕事・活動の話 | Priya（Singapore・スタジオ創業者） | 「今なに作ってるの？」に答える |
| 🎧 | 音楽の話 | Kenta（Tokyo/Australia・DJ） | 「この曲やばい」を英語で |
| 🍜 | フード＆ドリンク | Sam（Portland・フード出店者） | 注文・シェア・福岡の食の説明 |
| ⛺ | テント泊・キャンプ | Marta（Barcelona・写真家） | 隣のテントの人と仲良くなる |
| ♨️ | サウナ・ととのう | Tom（Melbourne・サウナ初心者） | 「ととのう」を英語で説明する |
| 🎨 | ワークショップ・アート | Yuki（京都/Lisbon・アーティスト） | 飛び込み参加、作品について聞く |
| 🔥 | 焚き火の夜 | Noa（Tel Aviv・元エンジニア） | 深い話をする／受け止める |
| 📱 | 連絡先を交換する | Alex（Taipei・インディー開発者） | 出会いを一晩で消さない |
| 🗾 | 福岡を案内する | Chloé（Paris・イラストレーター） | 屋台・太宰府・とんこつを説明する |
| 🌅 | さよなら・また会おう | Leo（初日に会った彼） | 次につながる別れ方 |

各シナリオに **8〜11個の実用フレーズ**（⭐️付きが必修・全54個）と、日本語の文化Tipsを収録。

---

## 主な機能

### 会話
- **ロールプレイ**：紬が上記の人物を演じる。1〜3文の短いやり取りで、実際の立ち話のテンポ
- **そっと直す訂正カード**：間違えたら日本語で理由付き解説。会話は止めない
- **フレーズ引き出し**：詰まったらタップして入力欄へ
- **音声入力／読み上げ**：Web Speech API + クラウドTTS（任意）

### 紬というキャラクター
- **インラインSVGで自作**：10表情 × 5衣装、まばたき・呼吸・髪の揺れ・アホ毛・口パク（外部画像ゼロ）
- **親密度システム**：話すほどハートが貯まり、Lv.1→10 で口調が変化（ていねい → 打ち解ける → 甘える）
- **衣装の解放**：いつもの私服／ゆるパーカー／フェスコーデ／サウナタオル／浴衣

### 続ける仕組み
- **本番までのカウントダウン**：10月2日まであと何日何時間
- **間隔反復（SRS）**：間違えた表現を Leitner box で7段階スケジュール。忘れる直前に出題
- **連続学習日数** / セッション記録 / 必修フレーズの暗記率
- **データ書き出し**：全学習データを JSON でバックアップ

### 無料と有料
無料で「聞き取れない時」「はじめましての一言」「受付・チェックイン」の3場面が遊べます。
残り10場面と実用フレーズ104個（うち必修42個）は買い切りで解放。課金は RevenueCat 経由です。

### 技術面
- Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4
- Android アプリ版は Capacitor。画面は端末内の静的ファイル、AI会話だけサーバーを叩くハイブリッド
- 状態は `useSyncExternalStore` で localStorage を購読（サーバー不要・完全ローカル）
- PWA対応（オフラインでも復習とフレーズ帳が使える）
- `next build` / `eslint` ともにクリーン

---

## セットアップ

```bash
npm install
npm run dev
```

APIキーなしでも動きます（シナリオごとの用意された返答にフォールバック）。
紬に自由に返事をさせるには `.env.local` を作成：

```bash
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://api.deepseek.com   # OpenAI互換ならなんでも
OPENAI_MODEL=deepseek-v4-flash

# 任意：クラウドTTS（未設定なら端末の音声合成にフォールバック）
TTS_API_KEY=your_openai_key
TTS_BASE_URL=https://api.openai.com/v1
TTS_MODEL=tts-1
TTS_VOICE=nova
```

`.env.example` をコピーして使ってください。

---

## Android アプリとしてビルドする

```bash
NEXT_PUBLIC_API_BASE=https://your-app.vercel.app \
NEXT_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxx \
npm run build:mobile

npx cap open android   # Android Studio で署名付き AAB を作成
```

`build:mobile` は静的書き出し（`out/`）を作って `android/` に同期します。
静的書き出しでは POST の Route Handler を扱えないため、スクリプトが
ビルド中だけ `app/api` を退避し、終わったら必ず元に戻します。

Google Play への提出手順は **[docs/RELEASE.md](docs/RELEASE.md)** にまとめてあります。

## スマホにインストール（PWA）

PWA対応なので、ホーム画面に追加するとアプリのように起動します。
会場は電波が不安定なこともあるので、**当日までに一度開いてキャッシュしておく**のがおすすめ。

- **iPhone**：Safari で開く → 共有（□↑） → ホーム画面に追加
- **Android**：Chrome のメニュー（⋮） → アプリをインストール

---

## ディレクトリ

```
app/
  api/chat/route.ts        会話API（OpenAI互換 + フォールバック）
  api/tts/route.ts         読み上げAPI
components/
  TsumugiApp.tsx           画面ルーティングと親密度演出
  tsumugi/
    TsumugiCharacter.tsx   紬のSVG本体（表情・衣装・アニメーション）
    SpeechBubble.tsx       タイプライター吹き出し
    BondMeter.tsx          親密度メーター
    MicButton.tsx          音声入力
  screens/                 各画面
capacitor.config.ts        Android アプリの設定（appId はアップロード後は変更不可）
scripts/build-mobile.mjs   静的書き出し → cap sync android
lib/
  purchases.ts             RevenueCat ラッパー（Webでは購入なしにフォールバック）
  entitlements.ts          無料シナリオと解放判定
  festivalScenarios.ts     13シナリオ + フレーズ + ロールプレイ用プロンプト
  tsumugiVoice.ts          紬の日本語セリフ（親密度で変化）
  srs.ts                   間隔反復スケジューラ
  storage.ts               localStorage を外部ストア化
  prompts.ts               システムプロンプト生成
```

---

## ライセンス

private
