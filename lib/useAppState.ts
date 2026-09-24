'use client';

import { useSyncExternalStore } from 'react';
import type { AppState } from '@/types';
import { subscribe, getSnapshot, getServerSnapshot } from './storage';

/** localStorage の中身を React から購読する */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ------------------------------------------------------------------ */
/*  ハイドレーション判定用の極小ストア                                    */
/*  subscribe はクライアントでマウントされた時にしか呼ばれない。            */
/*  そこでフラグを立てて通知することで、サーバー描画 → 実データへ切り替える。 */
/* ------------------------------------------------------------------ */

let hydrated = false;
const hydrationListeners = new Set<() => void>();

function subscribeHydration(onChange: () => void): () => void {
  hydrationListeners.add(onChange);
  if (!hydrated) {
    hydrated = true;
    // subscribe の実行中に同期で通知しない（React が購読を終えてから知らせる）
    queueMicrotask(() => {
      for (const listener of hydrationListeners) listener();
    });
  }
  return () => {
    hydrationListeners.delete(onChange);
  };
}

/**
 * ハイドレーション済みかどうか。
 * localStorage 由来の表示はサーバーで描けないので、これが true になるまで待つ。
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => hydrated,
    () => false
  );
}
