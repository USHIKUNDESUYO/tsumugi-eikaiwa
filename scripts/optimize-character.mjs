#!/usr/bin/env node
/**
 * 生成された透過PNGをアプリに載せられるサイズまで落とす。
 *
 * 880x1184 の透過PNGは1枚1MB近くあり、16枚そのまま積むと
 * PWAとしてもAPKとしても重すぎる。表示は最大でも 238px CSS
 * (=2xで約476px) なので、幅480pxのWebPに変換する。
 *
 *   node scripts/optimize-character.mjs
 */
import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(ROOT, 'public/tsumugi');
const TARGET_WIDTH = 480;
const QUALITY = 84;

const sources = readdirSync(DIR)
  .filter((f) => f.endsWith('-cut.png'))
  .sort();

if (sources.length === 0) {
  console.error('public/tsumugi/*-cut.png が見つかりません。先に cutout を実行してください。');
  process.exit(1);
}

let before = 0;
let after = 0;

for (const file of sources) {
  const srcPath = resolve(DIR, file);
  const name = file.replace(/-cut\.png$/, '');
  const outPath = resolve(DIR, `${name}.webp`);

  await sharp(srcPath)
    .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, alphaQuality: 90, effort: 6 })
    .toFile(outPath);

  const b = statSync(srcPath).size;
  const a = statSync(outPath).size;
  before += b;
  after += a;
  console.log(`${name.padEnd(18)} ${(b / 1024).toFixed(0).padStart(5)}KB → ${(a / 1024).toFixed(0).padStart(4)}KB`);
}

console.log(
  `\n合計 ${(before / 1024 / 1024).toFixed(1)}MB → ${(after / 1024 / 1024).toFixed(2)}MB ` +
    `(${Math.round((1 - after / before) * 100)}% 削減)`
);
