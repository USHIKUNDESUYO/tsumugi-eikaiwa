'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

const DISMISS_KEY = 'tsumugi-install-dismissed';
const subscribeNoop = () => () => {};

function detectPlatform(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios';
  if (/Android/.test(navigator.userAgent)) return 'android';
  return 'other';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as IOSNavigator).standalone === true
  );
}

export default function InstallPrompt() {
  const standalone = useSyncExternalStore(subscribeNoop, isStandalone, () => true);
  const platform = useSyncExternalStore(subscribeNoop, detectPlatform, () => 'other' as const);

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const hidden =
    standalone ||
    dismissed ||
    (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1');

  if (hidden || platform === 'other') return null;

  const install = async () => {
    if (!deferred) {
      setOpen(true);
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setDeferred(null);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* プライベートモードなど。セッション内だけ閉じれば十分。 */
    }
    setDismissed(true);
  };

  return (
    <>
      <div
        className="anim-up fixed inset-x-3 z-[55] safe-bottom"
        style={{ bottom: 'calc(var(--nav-h) + 10px)' }}
      >
        <div className="tsu-card-solid mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <span className="text-[22px]" aria-hidden>
            📲
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-extrabold" style={{ color: 'var(--text)' }}>
              ホーム画面に置いておく？
            </p>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--text-faint)' }}>
              アプリみたいに開けて、フェス会場でもすぐ使えます
            </p>
          </div>
          <button type="button" onClick={install} className="tsu-btn tsu-btn-primary shrink-0 px-3.5 py-2 text-[12px]">
            入れる
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="閉じる"
            className="tsu-btn shrink-0 px-1.5 text-[15px]"
            style={{ color: 'var(--text-faint)' }}
          >
            ×
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-6"
          style={{ background: 'rgba(40, 20, 34, 0.5)' }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="インストール方法"
        >
          <div
            className="tsu-card-solid anim-up w-full max-w-sm px-5 py-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[16px] font-extrabold" style={{ color: 'var(--text)' }}>
              ホーム画面への追加のしかた
            </p>
            <ol
              className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[13.5px] font-semibold leading-relaxed"
              style={{ color: 'var(--text-soft)' }}
            >
              {platform === 'ios' ? (
                <>
                  <li>Safari で開く（Chrome では追加できません）</li>
                  <li>下の共有ボタン（□↑）をタップ</li>
                  <li>「ホーム画面に追加」を選ぶ</li>
                  <li>右上の「追加」をタップ</li>
                </>
              ) : (
                <>
                  <li>Chrome の右上メニュー（⋮）をタップ</li>
                  <li>「アプリをインストール」を選ぶ</li>
                  <li>「インストール」をタップ</li>
                </>
              )}
            </ol>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="tsu-btn tsu-btn-primary mt-4 w-full py-3 text-[14px]"
            >
              わかった
            </button>
          </div>
        </div>
      )}
    </>
  );
}
