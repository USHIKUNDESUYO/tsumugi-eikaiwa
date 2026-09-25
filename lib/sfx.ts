'use client';

/**
 * 効果音。Web Audio で合成する。
 *
 * 音声ファイルを積まないので容量ゼロ、読み込み待ちゼロ、オフラインでも鳴る。
 * UI音はごく短い単音なので、録音を用意するより合成のほうが音色を詰めやすい。
 *
 * 音階はペンタトニック（C D E G A）に寄せてある。
 * どの音がどの順で鳴っても濁らないので、連打されても不快にならない。
 */

export type SfxName =
  | 'tap'
  | 'pop'
  | 'correct'
  | 'soft'
  | 'levelup'
  | 'send'
  | 'receive'
  | 'unlock';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** iOS と Chrome は最初のユーザー操作まで AudioContext を止めている */
export function unlockSfx(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

interface ToneOptions {
  /** 周波数(Hz) */
  freq: number;
  /** 鳴り始めるまでの待ち(秒) */
  delay?: number;
  /** 長さ(秒) */
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  /** 終端の周波数。指定すると滑らかに変化する */
  toFreq?: number;
}

function tone({ freq, delay = 0, duration = 0.16, type = 'sine', gain = 1, toFreq }: ToneOptions): void {
  const c = getCtx();
  if (!c || !master) return;

  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const env = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (toFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(toFreq, start + duration);

  // クリックノイズが出ないよう、立ち上がりと減衰を必ず付ける
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(env);
  env.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** ペンタトニック上の音（C5 を基準） */
const N = {
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  E6: 1318.5,
  G6: 1568.0,
  A6: 1760.0,
};

const RECIPES: Record<SfxName, () => void> = {
  // タブやボタン。存在は分かるが主張しない程度に
  tap: () => tone({ freq: N.A5, duration: 0.07, type: 'triangle', gain: 0.5 }),

  // ハートが飛ぶ。上に抜ける
  pop: () => tone({ freq: N.E5, toFreq: N.E6, duration: 0.14, type: 'sine', gain: 0.7 }),

  // 正解。明るい2音
  correct: () => {
    tone({ freq: N.E6, duration: 0.14, gain: 0.7 });
    tone({ freq: N.A6, delay: 0.08, duration: 0.24, gain: 0.55 });
  },

  // 間違い。責めない低め単音
  soft: () => tone({ freq: N.D5, toFreq: N.C5, duration: 0.22, type: 'sine', gain: 0.45 }),

  // レベルアップ。上行アルペジオ
  levelup: () => {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) =>
      tone({ freq: f, delay: i * 0.085, duration: 0.3, type: 'triangle', gain: 0.6 })
    );
    tone({ freq: N.E6, delay: 0.34, duration: 0.5, gain: 0.45 });
    tone({ freq: N.G6, delay: 0.34, duration: 0.5, gain: 0.3 });
  },

  // 送信。短く上へ
  send: () => tone({ freq: N.G5, toFreq: N.C6, duration: 0.1, type: 'sine', gain: 0.5 }),

  // 受信。柔らかく下へ
  receive: () => tone({ freq: N.C6, toFreq: N.G5, duration: 0.13, type: 'sine', gain: 0.45 }),

  // 解放。きらきら
  unlock: () => {
    [N.C6, N.E6, N.G6, N.A6].forEach((f, i) =>
      tone({ freq: f, delay: i * 0.06, duration: 0.22, gain: 0.45 })
    );
  },
};

let enabled = true;

/** 設定から呼ぶ。切られていれば一切鳴らさない。 */
export function setSfxEnabled(value: boolean): void {
  enabled = value;
}

export function playSfx(name: SfxName): void {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  try {
    RECIPES[name]();
  } catch {
    // 音が鳴らないことでUIを壊さない
  }
}
