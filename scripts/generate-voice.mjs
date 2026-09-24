#!/usr/bin/env node
/**
 * 紬の日本語セリフの音声を事前生成する。
 *
 * セリフは lib/tsumugiVoice.ts に固定リストとして持っているので、
 * 実行時にTTSを叩かず、あらかじめ音声ファイルにして同梱する。
 * こうすると オフラインでも鳴る / 遅延ゼロ / 1回鳴るたびに課金されない。
 *
 *   FAL_KEY=xxxx node scripts/generate-voice.mjs [voice_id]
 *
 * voice_id は fal-ai/kokoro/japanese のもの:
 *   jf_alpha / jf_gongitsune / jf_nezumi / jf_tebukuro / jm_kumo
 *
 * 生成済みのファイルは飛ばすので、途中で止めても再開できる。
 * 声を変えたいときは public/voice を消してから実行すること。
 */
import * as lame from '@breezystack/lamejs';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/voice');
const MODEL = 'fal-ai/kokoro/japanese';

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('FAL_KEY が設定されていません。\n  export FAL_KEY=xxxx');
  process.exit(1);
}

const VOICE = process.argv[2] || process.env.TSUMUGI_VOICE || 'jf_tebukuro';
/** 少しゆっくり喋らせたほうが、やさしい印象になる */
const SPEED = Number(process.env.TSUMUGI_VOICE_SPEED || 0.95);
const MP3_KBPS = 64;

const { VOICE_CATALOG } = await import(resolve(ROOT, 'lib/tsumugiVoice.ts'));

/* ------------------------------------------------------------------ */

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

/** Kokoro は WAV しか返さない。そのままだと1本250KBで60本積めないので MP3 にする。 */
function wavToMp3(buf, kbps = MP3_KBPS) {
  const channels = buf.readUInt16LE(22);
  const rate = buf.readUInt32LE(24);
  let off = 12;
  while (off < buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'data') {
      const samples = new Int16Array(buf.buffer, buf.byteOffset + off + 8, Math.floor(size / 2));
      const encoder = new lame.Mp3Encoder(channels, rate, kbps);
      const chunks = [];
      for (let i = 0; i < samples.length; i += 1152) {
        const mp3 = encoder.encodeBuffer(samples.subarray(i, i + 1152));
        if (mp3.length) chunks.push(Buffer.from(mp3));
      }
      const tail = encoder.flush();
      if (tail.length) chunks.push(Buffer.from(tail));
      return Buffer.concat(chunks);
    }
    off += 8 + size + (size % 2);
  }
  throw new Error('WAV に data チャンクがありません');
}

/* ------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true });
console.log(`声: ${VOICE} / 速度: ${SPEED} / ${VOICE_CATALOG.length} 本\n`);

let made = 0;
let bytes = 0;

for (const line of VOICE_CATALOG) {
  const outPath = resolve(OUT_DIR, `${line.id}.mp3`);
  if (existsSync(outPath)) continue;

  process.stdout.write(`${line.id.padEnd(20)} ${line.text.slice(0, 22)}… `);
  try {
    const result = await falRun({ prompt: line.text, voice: VOICE, speed: SPEED });
    const url = result?.audio?.url;
    if (!url) throw new Error(`音声URLなし: ${JSON.stringify(result).slice(0, 150)}`);

    const wav = Buffer.from(await (await fetch(url)).arrayBuffer());
    const mp3 = wavToMp3(wav);
    writeFileSync(outPath, mp3);
    made += 1;
    bytes += mp3.length;
    console.log(`${(mp3.length / 1024).toFixed(0)}KB`);
  } catch (error) {
    console.log(`失敗: ${error.message}`);
  }
}

console.log(`\n${made} 本を生成 / 合計 ${(bytes / 1024 / 1024).toFixed(2)}MB`);
console.log('声を変えるときは public/voice を消してから実行してください。');
