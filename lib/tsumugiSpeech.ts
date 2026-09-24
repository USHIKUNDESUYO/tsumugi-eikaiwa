'use client';

/**
 * 紬の日本語ボイス再生。
 *
 * セリフは事前に音声ファイル化して public/voice/<id>.mp3 に置いてある。
 * 実行時にTTSを叩かないので、オフラインでも鳴るし遅延もない。
 *
 * ブラウザはユーザー操作なしの音声再生を止めるので、
 * 再生に失敗しても黙って諦める。画面が壊れるほうが困る。
 */

let audio: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
  }
  return audio;
}

/**
 * iOS と Chrome は最初のユーザー操作より前に音を鳴らせない。
 * 何かタップされた時点で無音を一度再生して、以降を解禁しておく。
 */
export function unlockVoice(): void {
  if (unlocked) return;
  const el = getAudio();
  if (!el) return;
  unlocked = true;
  el.muted = true;
  el.play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
      el.muted = false;
    })
    .catch(() => {
      el.muted = false;
    });
}

export function stopVoice(): void {
  const el = getAudio();
  if (!el) return;
  el.pause();
  el.currentTime = 0;
}

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * セリフIDの音声を鳴らす。
 * 音声ファイルが無いIDでも、静かに何もしないだけ。
 */
export function speakJa(id: string, options: SpeakOptions = {}): void {
  const el = getAudio();
  if (!el || !id) return;

  el.pause();
  el.currentTime = 0;
  el.onended = null;
  el.onerror = null;

  el.src = `/voice/${id}.mp3`;
  el.onended = () => options.onEnd?.();
  el.onerror = () => options.onEnd?.();

  el.play()
    .then(() => options.onStart?.())
    // 自動再生がブロックされた / ファイルが無い。どちらも致命的ではない。
    .catch(() => options.onEnd?.());
}
