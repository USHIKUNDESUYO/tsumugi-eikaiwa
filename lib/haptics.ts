'use client';

import { Capacitor } from '@capacitor/core';

/**
 * 触覚フィードバック。
 *
 * ネイティブ（Capacitor）では Haptics プラグイン、
 * ブラウザでは navigator.vibrate にフォールバックする。
 * iOS Safari は vibrate を実装していないので、Web では黙って何も起きない。
 */

export type HapticStrength = 'light' | 'medium' | 'heavy';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

const FALLBACK_MS: Record<HapticStrength, number> = {
  light: 10,
  medium: 20,
  heavy: 40,
};

export function haptic(strength: HapticStrength = 'light'): void {
  if (!enabled || typeof window === 'undefined') return;

  if (Capacitor.isNativePlatform()) {
    void (async () => {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        const style =
          strength === 'heavy' ? ImpactStyle.Heavy : strength === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
        await Haptics.impact({ style });
      } catch {
        /* 端末が対応していない。無音で構わない。 */
      }
    })();
    return;
  }

  try {
    navigator.vibrate?.(FALLBACK_MS[strength]);
  } catch {
    /* 未対応ブラウザ */
  }
}

/** レベルアップなど、少し派手に伝えたいとき */
export function hapticCelebrate(): void {
  if (!enabled || typeof window === 'undefined') return;
  if (Capacitor.isNativePlatform()) {
    haptic('heavy');
    setTimeout(() => haptic('medium'), 110);
    setTimeout(() => haptic('light'), 210);
    return;
  }
  try {
    navigator.vibrate?.([30, 60, 20, 60, 40]);
  } catch {
    /* 未対応ブラウザ */
  }
}
