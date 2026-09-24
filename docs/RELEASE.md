# Google Play リリース手順（Shipaton 2026 提出用）

> **締切：2026年9月30日 23:45 PDT**（日本時間 10月1日 15:45）
> 審査に1〜3日かかるので、**9月26〜27日には提出**しておきたい。

Shipaton の必須要件は2つだけです。

1. アプリの初版が 2026/8/1〜9/30 の間に Google Play で公開されること
2. RevenueCat SDK で課金が動いていること

どちらもこのリポジトリで対応済みです。あとは Play Console と RevenueCat の設定だけ。

---

## 全体の流れ

```
A. Web API を Vercel にデプロイ      ← AI会話の裏側。先にやる
B. Play Console でアプリと商品を作る
C. RevenueCat を Play とつなぐ
D. AAB をビルドしてアップロード
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
> ただし審査員に見せるなら AI が喋ったほうが圧倒的に良いので、やっておくこと。

---

## B. Play Console

### B-1. アプリを作成

- アプリ名：`紬の英会話`
- パッケージ名：**`app.tsumugi.eikaiwa`**

> ⚠️ パッケージ名は一度アップロードすると**二度と変更できません**。
> 独自ドメインで出したい場合は、最初のアップロード前に
> `capacitor.config.ts` の `appId` と `android/app/build.gradle` の
> `namespace` / `applicationId` を書き換えてください。

### B-2. アプリ内商品を作る

**収益化 → アプリ内アイテム → アプリ内商品** で1つ作成：

| 項目 | 値 |
|---|---|
| プロダクトID | `tsumugi_premium_lifetime` |
| 名前 | 13場面ぜんぶ解放 |
| 説明 | ロック中の10シナリオと実用フレーズ104個が開きます |
| 価格 | 買い切りで ¥600〜¥1,200 あたり |

作ったら **「有効化」を忘れずに**。有効化しないと RevenueCat から見えません。

> 買い切り（管理対象商品）を推奨します。サブスクは審査項目が増えるので、
> この日程なら避けたほうが安全です。落ち着いてから追加できます。

### B-3. ストア掲載情報

提出に必要なもの：

- [ ] アプリアイコン 512×512 → `public/icon-512.png`（生成済み）
- [ ] フィーチャーグラフィック 1024×500 → 要作成
- [ ] スマホのスクリーンショット 2枚以上 → ホーム／会話画面がおすすめ
- [ ] 簡単な説明（80文字以内）
- [ ] 詳しい説明
- [ ] **プライバシーポリシーのURL（必須）**

### B-4. データセーフティ（要注意）

このアプリは**ユーザーが入力した英文を DeepSeek のAPIに送信**しています。
データセーフティのフォームで必ず申告してください。

- 収集するデータ：**ユーザーが生成したコンテンツ（その他のテキスト）**
- 目的：アプリの機能（AIによる応答と添削）
- 第三者と共有：**はい**（AIの推論プロバイダ）
- 学習データやプロフィールは収集していない、端末内の学習履歴は送信していない、と書けます

> 虚偽申告は公開停止の理由になります。ここは正直に。

---

## C. RevenueCat

1. [app.revenuecat.com](https://app.revenuecat.com) でプロジェクト作成
2. **Play Store アプリを追加** — パッケージ名 `app.tsumugi.eikaiwa`
3. **Service Account の認証情報をアップロード**
   （Google Cloud でサービスアカウントを作り、Play Console の API アクセスで権限付与）
   → ここが一番時間がかかります。**先に着手してください**
4. **Entitlement を作成** — 識別子は必ず **`premium`**
   （`lib/purchases.ts` の `PREMIUM_ENTITLEMENT` と一致させること）
5. **Product** に `tsumugi_premium_lifetime` を登録し、`premium` entitlement に紐づける
6. **Offering** を作成（`default`）し、Package を1つ追加して上の Product を割り当て
7. **API keys → Public app key（`goog_` で始まるもの）** をコピー

> Package の識別子に `lifetime` / `monthly` / `annual` を含めると、
> ペイウォールに「買い切り」「月額」「年額」と自動でラベルが出ます。

---

## D. AAB をビルドしてアップロード

```bash
npm install

NEXT_PUBLIC_API_BASE=https://あなたのvercelのURL \
NEXT_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxx \
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
- [ ] ロックされたシナリオを踏むとペイウォールが出る
- [ ] ライセンステスターのアカウントで購入が通り、シナリオが解放される
- [ ] 一度アプリを消して入れ直し、「購入を復元」で戻る
- [ ] 機内モードでも復習とフレーズ帳が使える
- [ ] Shipaton の Devpost に提出（デモ動画＋ストアのリンク）

---

## 詰まりやすいところ

**ペイウォールに商品が出てこない**
→ Play Console で商品を「有効化」したか／RevenueCat の Offering に Package を入れたか／
   APIキーがビルド時に渡っているか。`NEXT_PUBLIC_` 系はビルド時に焼き込まれるので、
   キーを変えたら必ず `npm run build:mobile` からやり直すこと。

**アプリ内で会話が返ってこない**
→ `NEXT_PUBLIC_API_BASE` を渡さずにビルドした可能性大。
   `npm run build:mobile` は未設定だと警告を出します。

**購入がテストできない**
→ Play Console → 設定 → ライセンステストに Google アカウントを登録。
   内部テストトラックに一度アップロードしてから実機で確認するのが確実です。
