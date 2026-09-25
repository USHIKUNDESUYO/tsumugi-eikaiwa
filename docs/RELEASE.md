# Google Play リリース手順

アプリは無料で、課金はありません。Play Console の設定と AAB のアップロードだけで出せます。

---

## 全体の流れ

```
A. Web API を Vercel にデプロイ      ← AI会話の裏側。先にやる
B. Play Console でアプリを作る
C. AAB をビルドしてアップロード
```

---

## A. Web API を Vercel にデプロイ

アプリ本体は端末内で動きますが、**AI会話と読み上げだけはサーバーが必要**です。

1. このリポジトリを Vercel にデプロイ
2. 環境変数を設定
   | 変数 | 値 |
   |---|---|
   | `OPENAI_API_KEY` | DeepSeek の APIキー |
   | `OPENAI_BASE_URL` | `https://api.deepseek.com` |
   | `OPENAI_MODEL` | `deepseek-v4-flash` |
   | `TTS_API_KEY` | （任意）OpenAI の APIキー。未設定なら端末の音声合成にフォールバック |
3. デプロイ後の URL を控える（例：`https://tsumugi-eikaiwa.vercel.app`）

> 設定しなくてもアプリは動きます（シナリオごとの固定応答にフォールバック）。

---

## B. Play Console

### B-1. アプリを作成

- アプリ名：`紬の英会話`
- パッケージ名：**`app.tsumugi.eikaiwa`**
- 無料 / 有料：**無料**

> ⚠️ パッケージ名は一度アップロードすると**二度と変更できません**。
> 独自ドメインで出したい場合は、最初のアップロード前に
> `capacitor.config.ts` の `appId` と `android/app/build.gradle` の
> `namespace` / `applicationId` を書き換えてください。

### B-2. ストア掲載情報

提出に必要なもの：

- [ ] アプリアイコン 512×512 → `public/icon-512.png`（生成済み）
- [ ] フィーチャーグラフィック 1024×500 → 要作成
- [ ] スマホのスクリーンショット 2枚以上 → ホーム／会話画面がおすすめ
- [ ] 簡単な説明（80文字以内）
- [ ] 詳しい説明
- [ ] **プライバシーポリシーのURL（必須）**

### B-3. データセーフティ（要注意）

このアプリは**ユーザーが入力した英文を DeepSeek のAPIに送信**しています。
データセーフティのフォームで必ず申告してください。

- 収集するデータ：**ユーザーが生成したコンテンツ（その他のテキスト）**
- 目的：アプリの機能（AIによる応答と添削）
- 第三者と共有：**はい**（AIの推論プロバイダ）
- 学習データやプロフィールは収集していない、端末内の学習履歴は送信していない、と書けます

> 虚偽申告は公開停止の理由になります。ここは正直に。

---

## C. AAB をビルドしてアップロード

```bash
npm install

NEXT_PUBLIC_API_BASE=https://あなたのvercelのURL \
npm run build:mobile

npx cap open android
```

Android Studio が開いたら：

1. **Build → Generate Signed Bundle / APK → Android App Bundle**
2. キーストアを選択（初回は新規作成。**このファイルは絶対に無くさないこと**。
   失うと以後アプリを更新できなくなります）
3. `release` を選んでビルド
4. 出力された `.aab` を Play Console の **製品版** にアップロード

### 2回目以降のアップロード

`android/app/build.gradle` の `versionCode` を必ず +1 してください。
同じ versionCode は受け付けられません。

```gradle
versionCode 2
versionName "1.0.1"
```

---

## 提出前チェック

- [ ] 実機で「はなす」から会話が返ってくる（＝`NEXT_PUBLIC_API_BASE` が効いている）
- [ ] 13場面すべて、鍵なしで「はなす」から始められる
- [ ] 機内モードでも復習とフレーズ帳が使える

---

## 詰まりやすいところ

**アプリ内で会話が返ってこない**
→ `NEXT_PUBLIC_API_BASE` を渡さずにビルドした可能性大。
   `npm run build:mobile` は未設定だと警告を出します。
   `NEXT_PUBLIC_` 系はビルド時に焼き込まれるので、URL を変えたら必ず
   `npm run build:mobile` からやり直すこと。
