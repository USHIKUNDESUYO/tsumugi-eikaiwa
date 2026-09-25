/**
 * 紬の声で事前に音声化するセリフの一覧を書き出す。
 *
 *   npx tsx scripts/export-voice-lines.ts
 *
 * 出力:
 *   scripts/voice/lines.json  … scripts/generate-voice-qwen.py の入力
 *   lib/englishVoiceLines.ts  … アプリが「この英文は同梱の音声で鳴らせるか」を引く表
 *
 * 日本語は lib/tsumugiVoice.ts の固定セリフ（public/voice/<id>.mp3）。
 * 英語はシナリオの最初のひとこととフレーズ、自分の答えノートの質問（public/voice-en/<hash>.mp3）。
 * 英文のファイル名は本文のハッシュにする。文言を直せば別ファイルになるので、
 * 古い音声が新しい文言で鳴ることはない。
 *
 * 名前入りのフレーズ（{name}）は人によって変わるので事前には作らない。
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOICE_CATALOG } from '../lib/tsumugiVoice';
import { festivalScenarios, festivalScenarioOrder } from '../lib/festivalScenarios';
import { NAME_TOKEN } from '../lib/learnerName';
import { ANSWER_QUESTIONS } from '../lib/answerQuestions';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hashOf = (text: string) => createHash('sha1').update(text).digest('hex').slice(0, 12);

interface Line {
  id: string;
  lang: 'ja' | 'en';
  text: string;
  out: string;
}

const lines: Line[] = VOICE_CATALOG.map((l) => ({
  id: l.id,
  lang: 'ja',
  text: l.text,
  out: `public/voice/${l.id}.mp3`,
}));

const english = new Map<string, string>();
for (const id of festivalScenarioOrder) {
  const s = festivalScenarios[id];
  for (const text of [s.opener, ...s.phrases.map((p) => p.en)]) {
    if (text.includes(NAME_TOKEN)) continue;
    english.set(text, hashOf(text));
  }
}
for (const q of ANSWER_QUESTIONS) english.set(q.en, hashOf(q.en));
for (const [text, hash] of english) {
  lines.push({ id: hash, lang: 'en', text, out: `public/voice-en/${hash}.mp3` });
}

mkdirSync(resolve(ROOT, 'scripts/voice'), { recursive: true });
writeFileSync(resolve(ROOT, 'scripts/voice/lines.json'), `${JSON.stringify({ lines }, null, 2)}\n`);

const table = [...english].map(([text, hash]) => `  ${JSON.stringify(text)}: '${hash}',`).join('\n');
writeFileSync(
  resolve(ROOT, 'lib/englishVoiceLines.ts'),
  `// 自動生成（npx tsx scripts/export-voice-lines.ts）。手で編集しないこと。
// 英文 → public/voice-en/<hash>.mp3 のハッシュ。ここに載っている英文は、
// 紬の声で事前に作った音声を鳴らす（通信も待ち時間も要らない）。
export const ENGLISH_VOICE_LINES: Record<string, string> = {
${table}
};
`
);

console.log(`日本語 ${VOICE_CATALOG.length} 本 / 英語 ${english.size} 本 → scripts/voice/lines.json, lib/englishVoiceLines.ts`);
