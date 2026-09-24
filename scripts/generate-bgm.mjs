#!/usr/bin/env node
/**
 * BGM を生成してループ可能な MP3 にする。
 *
 *   FAL_KEY=xxxx node scripts/generate-bgm.mjs [track ...]
 *
 * 生成された音楽はそのまま loop させると継ぎ目でプツッと切れる。
 * 末尾を先頭に重ねてクロスフェードし、最後と最初が連続するように加工する。
 *
 * 既に WAV が手元にある場合は public/bgm/_raw/<id>.wav を置いておけば
 * 生成を飛ばして加工だけ行う。
 */
import * as lame from '@breezystack/lamejs';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/bgm');
const RAW_DIR = resolve(OUT_DIR, '_raw');
const MODEL = 'cassetteai/music-generator';

/** ループの継ぎ目を溶かす長さ(秒) */
const CROSSFADE_SEC = 3;
const MP3_KBPS = 80;
const DURATION_SEC = 50;

const TRACKS = {
  day:
    'gentle calm lo-fi instrumental for a cozy study app, soft felt piano, warm pad, ' +
    'very light brushed percussion, slow tempo, nostalgic and comforting, no vocals, ' +
    'consistent loopable texture with no build-up and no ending',
  night:
    'quiet ambient instrumental for a late night campfire, warm analog pad, ' +
    'sparse soft piano notes, distant crackle-like texture, very slow, intimate and calm, ' +
    'no vocals, no percussion, consistent loopable texture with no build-up and no ending',
};

const FAL_KEY = process.env.FAL_KEY;

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

/** WAV を { channels, rate, samples(Int16Array, interleaved) } にする */
function parseWav(buf) {
  const channels = buf.readUInt16LE(22);
  const rate = buf.readUInt32LE(24);
  let off = 12;
  while (off < buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'data') {
      return {
        channels,
        rate,
        samples: new Int16Array(buf.buffer, buf.byteOffset + off + 8, Math.floor(size / 2)),
      };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error('WAV に data チャンクがありません');
}

/**
 * 末尾 CROSSFADE_SEC を先頭に重ねて、ループの継ぎ目を消す。
 * 出力は元より CROSSFADE_SEC ぶん短くなる。
 */
function makeSeamless({ channels, rate, samples }) {
  const frames = Math.floor(samples.length / channels);
  const fade = Math.min(Math.floor(CROSSFADE_SEC * rate), Math.floor(frames / 3));
  const outFrames = frames - fade;
  const out = new Int16Array(outFrames * channels);

  for (let f = 0; f < outFrames; f++) {
    for (let c = 0; c < channels; c++) {
      const i = f * channels + c;
      if (f < fade) {
        // 先頭は「頭 × 増加」＋「末尾 × 減少」で重ねる
        const t = f / fade;
        const head = samples[i];
        const tail = samples[(outFrames + f) * channels + c];
        out[i] = Math.max(-32768, Math.min(32767, Math.round(head * t + tail * (1 - t))));
      } else {
        out[i] = samples[i];
      }
    }
  }
  return { channels, rate, samples: out };
}

function toMp3({ channels, rate, samples }, kbps = MP3_KBPS) {
  const encoder = new lame.Mp3Encoder(channels, rate, kbps);
  const chunks = [];
  const block = 1152 * channels;
  for (let i = 0; i < samples.length; i += block) {
    const slice = samples.subarray(i, i + block);
    let mp3;
    if (channels === 2) {
      const left = new Int16Array(slice.length / 2);
      const right = new Int16Array(slice.length / 2);
      for (let j = 0; j < left.length; j++) {
        left[j] = slice[j * 2];
        right[j] = slice[j * 2 + 1];
      }
      mp3 = encoder.encodeBuffer(left, right);
    } else {
      mp3 = encoder.encodeBuffer(slice);
    }
    if (mp3.length) chunks.push(Buffer.from(mp3));
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(Buffer.from(tail));
  return Buffer.concat(chunks);
}

mkdirSync(RAW_DIR, { recursive: true });
const only = process.argv.slice(2);
const targets = Object.entries(TRACKS).filter(([id]) => only.length === 0 || only.includes(id));

for (const [id, prompt] of targets) {
  const outPath = resolve(OUT_DIR, `${id}.mp3`);
  if (existsSync(outPath)) {
    console.log(`skip ${id}`);
    continue;
  }

  const rawPath = resolve(RAW_DIR, `${id}.wav`);
  if (!existsSync(rawPath)) {
    if (!FAL_KEY) {
      console.log(`${id}: WAV も FAL_KEY も無いので飛ばします`);
      continue;
    }
    process.stdout.write(`${id} 生成中 `);
    const result = await falRun({ prompt, duration: DURATION_SEC });
    const url = result?.audio_file?.url ?? result?.audio?.url;
    if (!url) {
      console.log(`失敗: 音声URLなし`);
      continue;
    }
    writeFileSync(rawPath, Buffer.from(await (await fetch(url)).arrayBuffer()));
    console.log('ok');
  }

  const wav = parseWav(readFileSync(rawPath));
  const looped = makeSeamless(wav);
  const mp3 = toMp3(looped);
  writeFileSync(outPath, mp3);
  const seconds = looped.samples.length / looped.channels / looped.rate;
  console.log(`${id}: ${seconds.toFixed(1)}秒 / ${(mp3.length / 1024).toFixed(0)}KB（継ぎ目を${CROSSFADE_SEC}秒で溶かし済み）`);
}
