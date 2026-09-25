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
    .then(async (registration) => {
      // 前の版から更新したばかりだと、まだ前の版のサービスワーカーが動いていることがある。
      // 前の版は保存の頼みを知らないので無視される（遅い回線だと入れ替わりが頼んだ後になり、
      // 声が1本も保存されなかった）。新しい版があるか確かめて、入れ替わってから頼む
      await registration.update().catch(() => {});
      const incoming = registration.installing ?? registration.waiting ?? registration.active;
      if (incoming) await settled(incoming);
      registration.active?.postMessage({ type: 'precache', shell, urls });
    })
    .catch(() => {
      /* 保存できなくても、電波がある間はふつうに使える */
    });
}

/** 入れ替わり中のサービスワーカーが動き出す（か、入れ替わりに失敗する）まで待つ */
function settled(worker: ServiceWorker): Promise<void> {
  const done = () => worker.state === 'activated' || worker.state === 'redundant';
  if (done()) return Promise.resolve();
  return new Promise((resolve) => {
    const onChange = () => {
      if (!done()) return;
      worker.removeEventListener('statechange', onChange);
      resolve();
    };
    worker.addEventListener('statechange', onChange);
  });
}
