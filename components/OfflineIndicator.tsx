'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export default function OfflineIndicator() {
  // navigator.onLine はブラウザ側の状態なので外部ストアとして購読する
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
  const [wasOffline, setWasOffline] = useState(!isOnline);

  // オフラインに落ちたことをレンダー中に記録しておく（復帰バナーを出すため）
  if (!isOnline && !wasOffline) setWasOffline(true);

  // 復帰バナーはしばらくしたら自分で消える。setState はタイマーの中だけ。
  useEffect(() => {
    if (!isOnline || !wasOffline) return;
    const t = setTimeout(() => setWasOffline(false), 2600);
    return () => clearTimeout(t);
  }, [isOnline, wasOffline]);

  const showRecovered = isOnline && wasOffline;
  if (isOnline && !showRecovered) return null;

  return (
    <div
      role="status"
      className="anim-pop fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[12.5px] font-extrabold text-white shadow-lg safe-top"
      style={{ background: isOnline ? '#3FBF8F' : 'var(--tsu-gold)' }}
    >
      {isOnline ? '✓ オンラインに戻りました' : '📡 オフライン中 — 復習とフレーズ帳は使えます'}
    </div>
  );
}
