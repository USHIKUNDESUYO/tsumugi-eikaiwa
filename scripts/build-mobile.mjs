#!/usr/bin/env node
/**
 * Capacitor（Android）向けのビルド。
 *
 *   1. app/api を一時退避する（静的書き出しは POST の Route Handler を扱えない）
 *   2. BUILD_TARGET=mobile で next build → out/ が出る
 *   3. 何があっても app/api を元に戻す
 *   4. npx cap sync android
 *
 * NEXT_PUBLIC_API_BASE に、API を動かしている Vercel の URL を必ず渡すこと。
 * 渡さないとアプリ内から AI 会話ができない（復習とフレーズ帳は動く）。
 */
import { execSync } from 'node:child_process';
import { existsSync, renameSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = resolve(root, 'app/api');
const stashDir = resolve(root, '.api-stash');

const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? '';
if (!apiBase) {
  console.warn(
    '\n⚠️  NEXT_PUBLIC_API_BASE が未設定です。\n' +
      '   アプリ内から AI 会話ができないビルドになります。\n' +
      '   例: NEXT_PUBLIC_API_BASE=https://your-app.vercel.app npm run build:mobile\n'
  );
}

function run(command) {
  execSync(command, { cwd: root, stdio: 'inherit', env: process.env });
}

// 前回の失敗で残っていたら先に戻す
if (existsSync(stashDir) && !existsSync(apiDir)) {
  renameSync(stashDir, apiDir);
}

// tsconfig は .next と .next-mobile 両方の生成型を見る。
// Web ビルドが残した型定義は退避中の app/api を指したままなので、先に捨てる。
// （次に npm run build すれば作り直される）
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

  run('npx next build');
} finally {
  if (stashed && existsSync(stashDir)) {
    rmSync(apiDir, { recursive: true, force: true });
    renameSync(stashDir, apiDir);
  }
}

run('npx cap sync android');

console.log('\n✅ out/ を android/ に同期しました。');
console.log('   次: npx cap open android で Android Studio を開き、');
console.log('   Build → Generate Signed Bundle / APK から AAB を作成してください。\n');
