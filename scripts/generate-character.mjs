#!/usr/bin/env node
/**
 * 紬のイラストを fal.ai で生成する。
 *
 *   FAL_KEY が必要です。鍵のある環境（＝あなたのPC）で実行してください。
 *     export FAL_KEY=xxxxxxxx
 *     node scripts/generate-character.mjs base       # ① 基準の1枚だけ作る（安い）
 *     node scripts/generate-character.mjs variants   # ② 表情と衣装を派生させる
 *     node scripts/generate-character.mjs cutout     # ③ 背景を抜いて透過PNGにする
 *     node scripts/generate-character.mjs all        # ①〜③ を通しで
 *
 * ポイント:
 *   - 一貫性は FLUX.1 Kontext の image-to-image 編集で担保する。
 *     毎回テキストから作ると別人になるので、必ず「基準の1枚」から派生させる。
 *   - fal が返す画像URLをそのまま次の入力に渡すので、アップロードは不要。
 *   - 生成済みのファイルは飛ばすので、途中で止めても再開できる。
 *   - まず base だけ実行して、絵柄が気に入らなければプロンプトを直すこと。
 *     variants まで走らせると枚数ぶん課金されます。
 */

import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/tsumugi');
const STATE_FILE = resolve(ROOT, '.tsumugi-gen.json');

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('FAL_KEY が設定されていません。\n  export FAL_KEY=xxxx\n を実行してから再試行してください。');
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/*  使うモデル                                                          */
/* ------------------------------------------------------------------ */

const MODEL = {
  // 基準の1枚（テキスト→画像）
  base: 'fal-ai/flux/dev',
  // 表情・衣装の差分（画像→画像、キャラを保ったまま編集）
  edit: 'fal-ai/flux-pro/kontext',
  // 背景抜き。
  // rembg は淡い肌色が画面端にあると背景と誤判定し、上げた手を丸ごと消した。
  // BiRefNet は手も細い髪も残せるので、多少遅くてもこちらを使う。
  cutout: 'fal-ai/birefnet/v2',
};

/* ------------------------------------------------------------------ */
/*  紬の設定（ここを変えると絵柄が変わる）                                 */
/* ------------------------------------------------------------------ */

const STYLE =
  'soft anime illustration, modern Japanese mobile game character art, clean cel shading, ' +
  'gentle warm lighting, pastel palette, delicate linework, high quality, detailed face';

const CHARACTER =
  'a gentle 20-year-old Japanese woman named Tsumugi, ' +
  'long straight milk-tea light brown hair past her shoulders, straight fringe covering her forehead, ' +
  'two side locks framing her face, one small stray ahoge strand sticking up on top, ' +
  'a small pink cherry blossom hair clip on her right side, ' +
  'large expressive eyes with violet-to-pink gradient irises and bright highlights, ' +
  'soft pink blush on her cheeks, small nose, gentle kind face, ' +
  'wearing a loose cream-coloured knit sweater';

const FRAMING =
  'upper body portrait facing the viewer, centred, head and shoulders fully visible with margin above the hair, ' +
  'flat plain light grey background, no text, no watermark, no border';

const BASE_PROMPT = `${CHARACTER}, calm gentle closed-mouth smile, ${FRAMING}, ${STYLE}`;

/** 差分。key がファイル名になる。 */
const EXPRESSIONS = {
  neutral:
    'Make her expression completely neutral: her lips closed in a flat straight line with no smile at all, ' +
    'eyes open and relaxed, eyebrows level, barely any blush.',
  smile:
    'Give her a soft gentle smile with her lips completely closed and no teeth visible at all, ' +
    'eyes open, kind and calm. A quiet smile, not a laugh.',
  happy:
    'Change her expression to bright joyful laughter, eyes closed in happy upward arcs, open smiling mouth, cheeks flushed.',
  shy:
    'Make her intensely embarrassed and flustered: both cheeks flushed deep red across the nose, ' +
    'her eyes half-lidded and glancing away to the side, eyebrows angled upward in the middle, ' +
    'mouth a small wavering awkward line.',
  surprised: 'Change her expression to surprised, eyes wide open, eyebrows raised, small round open mouth.',
  thinking:
    'Make her look puzzled and deep in thought: both of her eyes clearly looking upward to the upper left corner, ' +
    'one eyebrow raised much higher than the other, lips pressed together and pushed to one side.',
  sad:
    'Make her clearly sad and close to tears: eyebrows sharply angled up in the middle, ' +
    'eyes glistening and looking downward, mouth turned down into a small frown, cheeks pale with no blush.',
  wink: 'Change her expression to a playful wink, her left eye closed, right eye open, cheerful open smile.',
  sleepy: 'Change her expression to sleepy, both eyes nearly closed into soft lines, relaxed small smile.',
  love:
    'Make her look lovestruck: her eyes wide open and sparkling with large bright highlights, ' +
    'cheeks deeply flushed red, a soft tender closed-mouth smile, head tilted slightly to one side.',
  // まばたき・口パク用の差分
  blink: 'Close both of her eyes completely into gentle downward curved lines, keep her expression otherwise identical.',
  talk: 'Open her mouth as if speaking a word, keep her eyes open and her expression otherwise identical.',
};

/**
 * ポーズ差分。
 * 表情だけだと「同じ絵が表情だけ変わる」状態になるので、
 * 場面ごとに体の動きが変わるカットを用意する。
 * 手は生成が崩れやすいので、指示で位置と形を細かく指定する。
 */
const POSES = {
  wave:
    'Raise her right hand up beside her head and wave at the viewer with an open palm, ' +
    'fingers relaxed and clearly separated, five fingers, with a cheerful smile. ' +
    'Zoom out slightly so her whole raised hand is inside the frame.',
  cheer:
    'Raise both of her hands up in front of her chest as small gentle fists in a happy ' +
    'celebratory gesture, her eyes closed in joyful upward arcs and a big open smile. ' +
    'Zoom out slightly so both hands are inside the frame.',
  point:
    'Raise her right index finger up beside her face in a gentle teaching gesture, ' +
    'one finger extended and the rest curled, with a kind helpful smile and open eyes.',
  plead:
    'Bring both of her hands together in front of her chest as if politely asking a favour, ' +
    'head tilted slightly to one side, eyes looking up at the viewer, ' +
    'a small hopeful closed-mouth smile with a blush.',
  hide:
    'Raise both of her hands to her cheeks, palms touching her face, ' +
    'her cheeks flushed deep red, eyes wide and embarrassed, mouth a small wavering line.',
};

const OUTFITS = {
  hoodie: 'Change her top to a soft pink oversized hoodie with white drawstrings.',
  festival:
    'Change her top to a black sleeveless festival top, with a pink lanyard and a festival pass hanging around her neck.',
  sauna: 'Change her top to a white towel wrapped around her, with a small white towel folded on her head.',
  yukata: 'Change her top to a navy blue summer yukata with a pink obi sash and a white collar.',
};

/**
 * 瞳の色は末尾に書いても効かない。モデルが「日本人の女の子＝茶色の瞳」に
 * 引っ張られて勝手に変えてしまうので、指示の先頭に単独で置く。
 */
const EYE_LOCK =
  'Her irises are bright violet-purple fading to pink. Keep that exact eye colour. ';

/**
 * 腕を上げるポーズを作らせると、モデルが勝手に袖丈を変えてしまう。
 * クリーム色のセーターは半袖に、フェスのタンクトップは逆に袖付きに化けた。
 * 衣装ごとに文言を変えると破綻するので、「今の服のまま」とだけ言う。
 */
const SLEEVE_LOCK =
  'Keep her top exactly as it already is, including its sleeve length, its neckline and its colour. ';

const KEEP =
  ' Keep the same character, the exact same face, the same hairstyle and hair colour, ' +
  'the same violet-to-pink gradient eye colour, the same clothing, the same art style, ' +
  'the same framing and the same plain background. Do not change anything else. ' +
  'Never change her eye colour to brown or amber.';

/* ------------------------------------------------------------------ */
/*  fal の queue API                                                    */
/* ------------------------------------------------------------------ */

async function falRun(model, input) {
  const submit = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!submit.ok) {
    throw new Error(`submit ${model} failed: ${submit.status} ${await submit.text()}`);
  }
  const { status_url: statusUrl, response_url: responseUrl } = await submit.json();

  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL_KEY}` } });
    const body = await res.json();
    if (body.status === 'COMPLETED') break;
    if (body.status === 'FAILED' || body.error) {
      throw new Error(`${model} failed: ${JSON.stringify(body)}`);
    }
    process.stdout.write('.');
  }

  const out = await fetch(responseUrl, { headers: { Authorization: `Key ${FAL_KEY}` } });
  if (!out.ok) throw new Error(`fetch result failed: ${out.status}`);
  return out.json();
}

function firstImageUrl(result) {
  const url = result?.images?.[0]?.url ?? result?.image?.url;
  if (!url) throw new Error(`画像URLが取れませんでした: ${JSON.stringify(result).slice(0, 300)}`);
  return url;
}

async function download(url, path) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

/* ------------------------------------------------------------------ */
/*  状態（途中から再開できるように URL を覚えておく）                       */
/* ------------------------------------------------------------------ */

const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : { raw: {} };
const saveState = () => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');

/* ------------------------------------------------------------------ */
/*  各ステップ                                                          */
/* ------------------------------------------------------------------ */

async function stepBase() {
  mkdirSync(OUT_DIR, { recursive: true });
  if (state.baseUrl) {
    console.log('基準画像はすでにあります。作り直すなら .tsumugi-gen.json を消してください。');
    return;
  }
  console.log('基準の1枚を生成中');
  const result = await falRun(MODEL.base, {
    prompt: BASE_PROMPT,
    image_size: 'portrait_4_3',
    num_inference_steps: 34,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: true,
  });
  state.baseUrl = firstImageUrl(result);
  state.seed = result.seed;
  saveState();
  await download(state.baseUrl, resolve(OUT_DIR, '_base.png'));
  console.log('\n→ public/tsumugi/_base.png');
  console.log('   気に入らなければ .tsumugi-gen.json を消して、BASE_PROMPT を直して再実行してください。');
  console.log('   気に入ったら: node scripts/generate-character.mjs variants');
}

async function stepVariants(only = []) {
  if (!state.baseUrl) throw new Error('先に base を実行してください。');
  let jobs = [
    ...Object.entries(EXPRESSIONS).map(([k, v]) => [`expr-${k}`, v]),
    ...Object.entries(OUTFITS).map(([k, v]) => [`outfit-${k}`, v]),
  ];
  // 名前を渡すとその分だけ作り直す: variants expr-shy expr-love
  if (only.length > 0) {
    jobs = jobs.filter(([name]) => only.includes(name));
    for (const [name] of jobs) delete state.raw[name];
    saveState();
  }

  console.log(`${jobs.length} 枚を生成します（すでにあるものは飛ばします）`);
  for (const [name, instruction] of jobs) {
    if (state.raw[name]) {
      console.log(`skip ${name}`);
      continue;
    }
    process.stdout.write(`${name} `);
    const result = await falRun(MODEL.edit, {
      prompt: instruction + KEEP,
      image_url: state.baseUrl,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: 'png',
      safety_tolerance: '2',
    });
    state.raw[name] = firstImageUrl(result);
    saveState();
    await download(state.raw[name], resolve(OUT_DIR, `${name}.png`));
    console.log(' ok');
  }
  console.log('→ 次: node scripts/generate-character.mjs cutout');
}

/**
 * 衣装ごとの表情差分。
 *
 * 衣装画像そのものを土台にして表情を変える。こうしないと、衣装を着替えた
 * 瞬間に紬が無表情のまま固定されてしまう（SVG版は全組み合わせを描けていた）。
 */
/** ポーズ差分。衣装ごとに、その衣装の絵を土台にして作る。 */
async function stepPoses(only = []) {
  const bases = [['casual', state.baseUrl], ...Object.keys(OUTFITS).map((o) => [o, state.raw[`outfit-${o}`]])];
  const jobs = [];
  for (const [outfit, baseUrl] of bases) {
    if (!baseUrl) continue;
    for (const [pose, instruction] of Object.entries(POSES)) {
      const name = outfit === 'casual' ? `expr-${pose}` : `outfit-${outfit}-expr-${pose}`;
      jobs.push([name, instruction, baseUrl]);
    }
  }

  const filtered = only.length > 0 ? jobs.filter(([n]) => only.includes(n)) : jobs;
  if (only.length > 0) {
    for (const [name] of filtered) delete state.raw[name];
    saveState();
  }
  console.log(`${filtered.length} 枚（すでにあるものは飛ばします）`);

  for (const [name, instruction, baseUrl] of filtered) {
    if (state.raw[name]) continue;
    process.stdout.write(`${name} `);
    const result = await falRun(MODEL.edit, {
      prompt: EYE_LOCK + SLEEVE_LOCK + instruction + KEEP,
      image_url: baseUrl,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: 'png',
      safety_tolerance: '2',
    });
    state.raw[name] = firstImageUrl(result);
    saveState();
    await download(state.raw[name], resolve(OUT_DIR, `${name}.png`));
    console.log(' ok');
  }
}

async function stepOutfitExpressions(only = []) {
  const outfits = Object.keys(OUTFITS);
  const jobs = [];
  for (const outfit of outfits) {
    const baseKey = `outfit-${outfit}`;
    if (!state.raw[baseKey]) {
      console.warn(`${baseKey} がまだありません。先に variants を実行してください。`);
      continue;
    }
    for (const [expr, instruction] of Object.entries(EXPRESSIONS)) {
      jobs.push([`${baseKey}-expr-${expr}`, instruction, state.raw[baseKey]]);
    }
  }

  const filtered = only.length > 0 ? jobs.filter(([n]) => only.includes(n)) : jobs;
  // 名前を指定したときは作り直したいはずなので、覚えているURLを捨てる
  if (only.length > 0) {
    for (const [name] of filtered) delete state.raw[name];
    saveState();
  }
  console.log(`${filtered.length} 枚（すでにあるものは飛ばします）`);

  for (const [name, instruction, baseUrl] of filtered) {
    if (state.raw[name]) {
      continue;
    }
    process.stdout.write(`${name} `);
    const result = await falRun(MODEL.edit, {
      prompt: EYE_LOCK + instruction + KEEP,
      image_url: baseUrl,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: 'png',
      safety_tolerance: '2',
    });
    state.raw[name] = firstImageUrl(result);
    saveState();
    await download(state.raw[name], resolve(OUT_DIR, `${name}.png`));
    console.log(' ok');
  }
}

async function stepCutout() {
  const names = Object.keys(state.raw);
  if (names.length === 0) throw new Error('先に variants を実行してください。');

  for (const name of names) {
    const outPath = resolve(OUT_DIR, `${name}-cut.png`);
    if (existsSync(outPath)) {
      console.log(`skip ${name}`);
      continue;
    }
    process.stdout.write(`${name} 背景抜き `);
    const result = await falRun(MODEL.cutout, { image_url: state.raw[name] });
    await download(firstImageUrl(result), outPath);
    console.log(' ok');
  }
  console.log('\n完了。public/tsumugi/*-cut.png が透過PNGです。');
  console.log('このままコミットして push してください。圧縮とアプリへの組み込みはこちらでやります。');
}

/* ------------------------------------------------------------------ */

const step = process.argv[2] ?? 'base';
try {
  if (step === 'base' || step === 'all') await stepBase();
  if (step === 'variants' || step === 'all') await stepVariants(process.argv.slice(3));
  if (step === 'outfit-expressions' || step === 'all')
    await stepOutfitExpressions(process.argv.slice(3));
  if (step === 'poses' || step === 'all') await stepPoses(process.argv.slice(3));
  if (step === 'cutout' || step === 'all') await stepCutout();
  if (!['base', 'variants', 'outfit-expressions', 'poses', 'cutout', 'all'].includes(step)) {
    console.error('使い方: node scripts/generate-character.mjs [base|variants|outfit-expressions|poses|cutout|all]');
    process.exit(1);
  }
} catch (error) {
  console.error('\n失敗:', error.message);
  process.exit(1);
}
