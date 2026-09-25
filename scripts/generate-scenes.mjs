#!/usr/bin/env node
/**
 * シナリオごとの背景を生成する。
 *
 *   FAL_KEY=xxxx node scripts/generate-scenes.mjs [scene_id ...]
 *
 * 人物は描かせない。紬の立ち絵と喧嘩するし、
 * 「知らない誰か」が常に画面にいるのは邪魔にしかならない。
 * 文字も描かせない（生成AIの文字は必ず崩れる）。
 */
import sharp from 'sharp';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/scenes');
const STATE_FILE = resolve(ROOT, '.tsumugi-scenes.json');
const MODEL = 'fal-ai/flux/dev';

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('FAL_KEY が設定されていません。');
  process.exit(1);
}

const STYLE =
  'soft anime background illustration, painterly, warm cinematic lighting, detailed environment, ' +
  'pastel palette, gentle nostalgic atmosphere, studio-quality background art. ' +
  'Absolutely no people, no characters, no figures, no text, no letters, no logos, no watermark.';

/** SYNAPSE FESTIVAL は海の中道（博多湾沿いの海浜公園）で開催される */
const SCENES = {
  'arrival-checkin':
    'The entrance gate of an outdoor music festival in a seaside park on a clear morning, ' +
    'a wooden welcome arch, fabric banners, white reception tents, pine trees, bright blue sky.',
  'first-hello':
    'A walkway between food stalls at an outdoor festival in the afternoon, ' +
    'string lights and bunting overhead, grass underfoot, warm low sun.',
  'about-your-work':
    'An open grass lawn at a seaside festival overlooking a calm bay, ' +
    'picnic blankets, low camping chairs and parasols, soft afternoon light.',
  'music-talk':
    'An outdoor festival stage at night, an empty DJ booth, coloured stage lights cutting through haze, ' +
    'speaker stacks, dark sky.',
  'food-drinks':
    'A row of festival food stalls at night, warm paper lanterns, wooden counters, ' +
    'steam rising from pots, handwritten-looking menu boards with no readable text.',
  'camping-tent':
    'A campground of spherical dome tents on grass at dusk, string lights between poles, ' +
    'a view over a calm bay, purple and orange sky.',
  'sauna-totonou':
    'An outdoor wooden sauna deck at evening, a barrel sauna hut, a cold water tub, ' +
    'steam drifting, towels hanging on a rail, trees around.',
  'workshop-art':
    'An open-air art workshop under a canopy, a hanging thread installation catching the light, ' +
    'wooden tables with craft materials, dappled daylight.',
  'bonfire-deeptalk':
    'A bonfire in a clearing late at night, logs arranged around the fire, sparks rising, ' +
    'dark silhouetted trees, a starry sky.',
  'swap-contacts':
    'Festival grounds in the evening after the crowd has thinned, string lights overhead, ' +
    'an empty wooden bench, soft warm bokeh in the background.',
  'fukuoka-guide':
    'Riverside yatai food stalls in Fukuoka at night, red paper lanterns, ' +
    'city lights reflecting on the dark water, narrow walkway.',
  'rescue-phrases':
    'A festival ground during a daytime set seen from the back, a distant stage, ' +
    'colourful flags on poles, sunlight, shallow depth of field.',
  'see-you-again':
    'A festival campground at sunrise, a few folded tents, morning mist drifting over a bay, ' +
    'golden low light, quiet and empty.',
};

const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {};
const saveState = () => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');

async function falRun(input) {
  const submit = await fetch(`https://queue.fal.run/${MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!submit.ok) throw new Error(`submit ${submit.status}: ${(await submit.text()).slice(0, 200)}`);
  const { status_url: statusUrl, response_url: responseUrl } = await submit.json();
  for (let i = 0; i < 150; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const body = await (await fetch(statusUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })).json();
    if (body.status === 'COMPLETED') break;
    if (body.status === 'FAILED') throw new Error(`failed: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return (await fetch(responseUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })).json();
}

mkdirSync(OUT_DIR, { recursive: true });

const only = process.argv.slice(2);
const targets = Object.entries(SCENES).filter(([id]) => only.length === 0 || only.includes(id));
if (only.length > 0) {
  for (const [id] of targets) delete state[id];
  saveState();
}

let bytes = 0;
for (const [id, description] of targets) {
  const outPath = resolve(OUT_DIR, `${id}.webp`);
  if (existsSync(outPath) && state[id]) {
    console.log(`skip ${id}`);
    continue;
  }

  process.stdout.write(`${id.padEnd(20)} `);
  try {
    const result = await falRun({
      prompt: `${description} ${STYLE}`,
      image_size: 'landscape_16_9',
      num_inference_steps: 32,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
    });
    const url = result?.images?.[0]?.url;
    if (!url) throw new Error('画像URLなし');

    const raw = Buffer.from(await (await fetch(url)).arrayBuffer());
    // 表示は最大でも画面幅(390px @2x = 780px)。960pxあれば足りる。
    await sharp(raw).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile(outPath);

    state[id] = url;
    saveState();
    const { size } = await sharp(outPath).metadata().then(() => import('node:fs')).then((fs) => fs.statSync(outPath));
    bytes += size;
    console.log(`${(size / 1024).toFixed(0)}KB`);
  } catch (error) {
    console.log(`失敗: ${error.message}`);
  }
}

console.log(`\n合計 ${(bytes / 1024 / 1024).toFixed(2)}MB`);
