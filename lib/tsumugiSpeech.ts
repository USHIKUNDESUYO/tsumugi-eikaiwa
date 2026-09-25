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

import { duckBgm, unduckBgm } from './bgm';

let audio: HTMLAudioElement | null = null;
let unlocked = false;
/** いま鳴っている再生の番号。止めたり切り替えたりした再生の知らせは捨てる。 */
let playId = 0;
/** ダッキングの解除漏れを防ぐ（同じ再生で2回 unduck しない） */
let ducking = false;

function startDuck(): void {
  if (ducking) return;
  ducking = true;
  duckBgm();
}

function endDuck(): void {
  if (!ducking) return;
  ducking = false;
  unduckBgm();
}

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
  playId += 1;
  endDuck();
  const el = getAudio();
  if (!el) return;
  el.pause();
  el.currentTime = 0;
}

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  /** 鳴らせなかったとき。無ければ onEnd を呼ぶ。 */
  onError?: () => void;
  /** 速さ（1 が普通）。audio 要素は使い回すので、毎回ここで決め直す */
  rate?: number;
}

/**
 * 同梱の音声ファイルを紬の声として鳴らす（日本語のセリフも、事前に作った英文も）。
 * 同じ audio 要素を使い回すので、紬が同時に2つのことを喋ることはない。
 */
export function playVoiceFile(src: string, options: SpeakOptions = {}): void {
  const el = getAudio();
  if (!el || !src) return;

  endDuck();
  el.pause();
  el.currentTime = 0;
  el.onended = null;
  el.onerror = null;

  // 失敗は error イベントと play() の reject の両方で届くことがあり、
  // 次の再生に切り替えると前の play() も遅れて reject される。
  // 1回の再生につき終わりを1度だけ、しかも最新の再生の分だけ知らせる。
  const id = ++playId;
  let settled = false;
  const settle = (callback?: () => void) => {
    if (settled || id !== playId) return;
    settled = true;
    endDuck();
    callback?.();
  };

  el.src = src;
  // 新しい音声を読むと playbackRate は defaultPlaybackRate に戻るので、両方そろえる
  el.defaultPlaybackRate = options.rate ?? 1;
  el.playbackRate = options.rate ?? 1;
  el.onended = () => settle(options.onEnd);
  el.onerror = () => settle(options.onError ?? options.onEnd);

  startDuck();
  el.play()
    .then(() => {
      if (!settled && id === playId) options.onStart?.();
    })
    // 自動再生がブロックされた / ファイルが無い。どちらも致命的ではない。
    .catch(() => settle(options.onError ?? options.onEnd));
}

/**
 * セリフIDの音声を鳴らす。
 * 音声ファイルが無いIDでも、静かに何もしないだけ。
 */
export function speakJa(id: string, options: SpeakOptions = {}): void {
  if (!id) return;
  playVoiceFile(`/voice/${id}.mp3`, options);
}
