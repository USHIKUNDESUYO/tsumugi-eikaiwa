'use client';

/**
 * BGM。
 *
 * 生成した音楽はそのまま loop させると継ぎ目が鳴るので、
 * scripts/generate-bgm.mjs で末尾と先頭をクロスフェード済みのものを流す。
 *
 * 英語学習アプリで音楽が読み上げに被るのは害でしかないので、
 * 声が鳴っている間は自動で音量を落とす（ダッキング）。
 */

export type BgmTrack = 'day' | 'night';

/** 背景なので相当小さい。主役は紬の声と英語の読み上げ。 */
const BASE_VOLUME = 0.16;
const DUCKED_VOLUME = 0.03;
const RAMP_MS = 380;

let el: HTMLAudioElement | null = null;
let current: BgmTrack | null = null;
let enabled = true;
let ducked = 0;
let rampTimer: ReturnType<typeof setInterval> | null = null;

function getEl(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!el) {
    el = new Audio();
    el.loop = true;
    el.volume = 0;
    el.preload = 'auto';
  }
  return el;
}

/** 音量を急に変えると耳につくので、短い時間をかけて寄せる */
function rampTo(target: number): void {
  const audio = getEl();
  if (!audio) return;
  if (rampTimer) clearInterval(rampTimer);

  const from = audio.volume;
  const steps = Math.max(1, Math.round(RAMP_MS / 40));
  let step = 0;

  rampTimer = setInterval(() => {
    step += 1;
    const t = step / steps;
    audio.volume = Math.max(0, Math.min(1, from + (target - from) * t));
    if (step >= steps) {
      if (rampTimer) clearInterval(rampTimer);
      rampTimer = null;
      if (target === 0) audio.pause();
    }
  }, 40);
}

function targetVolume(): number {
  if (!enabled) return 0;
  return ducked > 0 ? DUCKED_VOLUME : BASE_VOLUME;
}

export function setBgmEnabled(value: boolean): void {
  enabled = value;
  const audio = getEl();
  if (!audio) return;
  if (!enabled) {
    rampTo(0);
  } else if (current) {
    void audio.play().catch(() => {});
    rampTo(targetVolume());
  }
}

export function playBgm(track: BgmTrack): void {
  const audio = getEl();
  if (!audio) return;
  if (current === track) {
    if (enabled && audio.paused) void audio.play().catch(() => {});
    return;
  }

  current = track;
  audio.src = `/bgm/${track}.mp3`;
  // 用意できていないトラックは day に落とす。無音よりマシ。
  audio.onerror = () => {
    if (track !== 'day') {
      current = 'day';
      audio.onerror = null;
      audio.src = '/bgm/day.mp3';
      void audio.play().catch(() => {});
    }
  };

  if (!enabled) return;
  audio.volume = 0;
  // 自動再生がブロックされたら諦める。最初のタップ後に鳴り始める。
  void audio
    .play()
    .then(() => rampTo(targetVolume()))
    .catch(() => {});
}

export function stopBgm(): void {
  current = null;
  rampTo(0);
}

/** 声が鳴り始めたら呼ぶ。入れ子で呼ばれても壊れないよう数える。 */
export function duckBgm(): void {
  ducked += 1;
  rampTo(targetVolume());
}

export function unduckBgm(): void {
  ducked = Math.max(0, ducked - 1);
  rampTo(targetVolume());
}
