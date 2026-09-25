#!/usr/bin/env node
/**
 * サーバーの無い場所に置くお試し版のビルド。
 *
 *   node scripts/build-web-demo.mjs
 *
 * 静的書き出し（scripts/build-mobile.mjs と同じ）をしたあと、
 * out/ を「単体で配れる状態」に削り込む。削るのは3種類:
 *
 *   1. public/tsumugi/*.png — 生成イラストの中間ファイル。配信するのは webp だけ
 *   2. public/bgm/_raw/*.wav — BGMの元WAV。配信するのは加工済みMP3だけ
 *   3. 自己ホストのフォント本体
 *
 * 3だけ少し説明がいる。M PLUS Rounded 1c は500個近いサブセットに分割されて
 * いて、全画面を歩いて実測しても68個が読まれる。配布先によってはファイル数に
 * 上限があるので、ここでは同じ書体を Google Fonts から読む形に差し替える。
 * next/font が書き出す CSS の font-family は素の "M PLUS Rounded 1c" なので、
 * @font-face を落として <link> を足すだけで見た目は変わらない。
 * （アプリ本体とモバイル版は従来どおり自己ホストのまま。ここで差し替えるのは
 *   out/ の中身だけで、リポジトリのソースには触らない。）
 *
 * AI会話は /api/chat が無いので lib/chatTransport.ts が window.claude 経由に
 * 切り替える。それも無い場所では会話だけができない版になる。
 */
import { execSync } from 'node:child_process';
import { existsSync, renameSync, rmSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'out');
const apiDir = resolve(root, 'app/api');
const stashDir = resolve(root, '.api-stash');

const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
  'family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap">';

function walk(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) found.push(...walk(p));
    else found.push(p);
  }
  return found;
}

/* 1. 静的書き出し ------------------------------------------------------ */

if (existsSync(stashDir) && !existsSync(apiDir)) renameSync(stashDir, apiDir);
for (const stale of ['out', '.next/types', '.next/dev/types']) {
  rmSync(resolve(root, stale), { recursive: true, force: true });
}

let stashed = false;
try {
  if (existsSync(apiDir)) {
    rmSync(stashDir, { recursive: true, force: true });
    renameSync(apiDir, stashDir);
    stashed = true;
  }
  execSync('npx next build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, BUILD_TARGET: 'mobile' },
  });
} finally {
  if (stashed && existsSync(stashDir)) {
    rmSync(apiDir, { recursive: true, force: true });
    renameSync(stashDir, apiDir);
  }
}

/* 2. 中間ファイルを落とす ---------------------------------------------- */

let dropped = 0;
for (const p of walk(out)) {
  const rel = relative(out, p);
  const isRawArt = rel.startsWith('tsumugi/') && rel.endsWith('.png');
  const isRawBgm = rel.startsWith('bgm/_raw/');
  if (isRawArt || isRawBgm) {
    rmSync(p);
    dropped++;
  }
}
console.log(`中間ファイル ${dropped} 個を除外`);

/* 3. フォントを Google Fonts に差し替える ------------------------------- */

let faces = 0;
for (const p of walk(out).filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(p, 'utf8');
  if (!css.includes('@font-face')) continue;
  // src に自己ホストの woff2 を持つ @font-face だけ落とす。
  // local(Arial) にメトリクスを寄せた Fallback 定義は残す。
  const stripped = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
    if (!/url\(\s*["']?[^)]*\.woff2/.test(block)) return block;
    faces++;
    return '';
  });
  if (stripped !== css) writeFileSync(p, stripped);
}

let fonts = 0;
for (const p of walk(out).filter((f) => f.endsWith('.woff2'))) {
  rmSync(p);
  fonts++;
}

let pages = 0;
for (const p of walk(out).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(p, 'utf8');
  if (html.includes('fonts.googleapis.com')) continue;
  const i = html.indexOf('</head>');
  if (i === -1) continue;
  writeFileSync(p, html.slice(0, i) + FONT_LINK + html.slice(i));
  pages++;
}
console.log(`@font-face ${faces} 件と woff2 ${fonts} 個を除外し、${pages} ページに Google Fonts を追加`);

/* 4. 結果 --------------------------------------------------------------- */

const files = walk(out);
const bytes = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(`\nout/: ${files.length} ファイル / ${(bytes / 1e6).toFixed(2)}MB`);
