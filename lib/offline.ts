'use client';

import { Capacitor } from '@capacitor/core';
import type { Outfit } from '@/types';
import { ENGLISH_VOICE_LINES } from './englishVoiceLines';
import { VOICE_CATALOG } from './tsumugiVoice';
import { artSrcs } from './tsumugiArt';

/**
 * 会場で電波が無くなっても使えるように、電波があるうちにアプリ本体と紬の声を保存しておく。
 * 実際に保存するのはサービスワーカー（public/sw.js の precache）。
 *
 * サーバーを止めて確かめたところ、初めて開いた端末ではアプリ自体が開けず
 * （最初の読み込みはサービスワーカーを通らないので、JS が保存されていない）、
 * 何度か開いた端末でも、一度も鳴らしていない声はスマホの声に落ちていた。
 * 紬の声は全部で約4.3MB。保存済みのものは取り直さないので、通信は1回だけ。
 */
export function prepareOffline(outfit: Outfit): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !navigator.onLine) return;
  // アプリ版はファイルが端末の中にあるので要らない
  if (Capacitor.isNativePlatform()) return;

  // いま読み込んでいるアプリ本体（HTML と、ビルドごとに名前の変わる JS・CSS・フォント）
  const shell = [
    '/',
    ...performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .filter((u) => new URL(u).pathname.startsWith('/_next/static/')),
  ];
  const urls = [
    ...VOICE_CATALOG.map((l) => `/voice/${l.id}.mp3`),
    ...Object.values(ENGLISH_VOICE_LINES).map((hash) => `/voice-en/${hash}.mp3`),
    '/bgm/day.mp3',
    '/bgm/night.mp3',
    ...artSrcs(outfit),
  ];

  navigator.serviceWorker.ready
    .then((registration) => registration.active?.postMessage({ type: 'precache', shell, urls }))
    .catch(() => {
      /* 保存できなくても、電波がある間はふつうに使える */
    });
}
