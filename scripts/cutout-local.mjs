#!/usr/bin/env node
/**
 * 背景抜きをローカルで行う（fal.ai を使わない版）。
 *
 *   node scripts/cutout-local.mjs public/tsumugi/full-hoodie.png ...
 *
 * 単純な色距離では抜けない。背景のグレー rgb(243,237,232) と
 * クリーム色のセーター rgb(245,232,200) は距離が近く、
 * 許容差を広げるとセーターが消え、狭めると背景が残る。
 *
 * そこで3つの条件を全部満たす画素だけを背景と見なす:
 *   1. 画像の縁から連続してつながっている（体の内側に穴が開かない）
 *   2. 無彩色に近い（RGBの開きが小さい）— セーターも肌も彩度があるので除外される
 *   3. 明るい — 影や髪を巻き込まない
 * さらに、隣の画素との差が小さいことも見るので、背景の緩いグラデも追える。
 */
import sharp from 'sharp';
import { resolve, dirname, basename } from 'node:path';

/** RGBの最大-最小。背景のグレーは11程度、クリーム色は45程度。 */
const NEUTRAL_MAX = 20;
/** 背景はどれも明るい。影や髪を巻き込まないための下限。 */
const MIN_BRIGHTNESS = 200;
/** 隣の画素からどれだけ離れてよいか（背景のグラデを追うため） */
const LOCAL_TOLERANCE = 14;
/** 輪郭のギザギザを均すぼかし量(px) */
const FEATHER = 0.8;

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('使い方: node scripts/cutout-local.mjs <png> [<png> ...]');
  process.exit(1);
}

for (const file of files) {
  const src = resolve(file);
  const out = resolve(dirname(src), basename(src, '.png') + '-cut.png');

  const image = sharp(src).ensureAlpha();
  const { width, height } = await image.metadata();
  const raw = await image.raw().toBuffer();

  const neutralAndBright = (i) => {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max - min <= NEUTRAL_MAX && min >= MIN_BRIGHTNESS;
  };

  const closeTo = (i, j) =>
    Math.abs(raw[i] - raw[j]) <= LOCAL_TOLERANCE &&
    Math.abs(raw[i + 1] - raw[j + 1]) <= LOCAL_TOLERANCE &&
    Math.abs(raw[i + 2] - raw[j + 2]) <= LOCAL_TOLERANCE;

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  /** from が -1 のときは縁からの起点 */
  const push = (x, y, from) => {
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * 4;
    if (!neutralAndBright(i)) return;
    if (from >= 0 && !closeTo(i, from * 4)) return;
    visited[p] = 1;
    queue[tail++] = p;
  };

  for (let x = 0; x < width; x++) {
    push(x, 0, -1);
    push(x, height - 1, -1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y, -1);
    push(width - 1, y, -1);
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(x - 1, y, p);
    if (x < width - 1) push(x + 1, y, p);
    if (y > 0) push(x, y - 1, p);
    if (y < height - 1) push(x, y + 1, p);
  }

  const alpha = Buffer.alloc(width * height);
  let removed = 0;
  for (let p = 0; p < width * height; p++) {
    alpha[p] = visited[p] ? 0 : 255;
    if (visited[p]) removed++;
  }

  // sharp は1チャンネル画像をぼかすと3チャンネルで返すことがある。
  // 1バイト/画素で読むと横縞のゴミになるので、実際のチャンネル数で拾う。
  const blurred = await sharp(alpha, { raw: { width, height, channels: 1 } })
    .blur(FEATHER)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const stride = blurred.info.channels;
  for (let p = 0; p < width * height; p++) raw[p * 4 + 3] = blurred.data[p * stride];

  await sharp(raw, { raw: { width, height, channels: 4 } }).png().toFile(out);
  console.log(`${basename(src).padEnd(22)} ${((removed / (width * height)) * 100).toFixed(0)}% を透過`);
}
