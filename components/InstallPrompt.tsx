'use client';

import { useState, useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

const DISMISS_KEY = 'tsumugi-install-dismissed';
const subscribeNoop = () => () => {};

/*
 * バナーは下部ナビのある画面でしか出さない（オンボーディングや会話中に出すと
 * 下端のボタンや最新の返事に被る）。ただ beforeinstallprompt は読み込み直後に
 * 一度しか飛ばず、初回はオンボーディング中に来てしまう。
 * 取りこぼさないよう、イベントはモジュールの読み込み時点から拾っておく。
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function setDeferredPrompt(e: BeforeInstallPromptEvent | null) {
  deferredPrompt = e;
  promptListeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
  });
}

function subscribePrompt(listener: () => void) {
  promptListeners.add(listener);
  return () => {
    promptListeners.delete(listener);
  };
}

function detectPlatform(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios';
  if (/Android/.test(navigator.userAgent)) return 'android';
  return 'other';
}

/** すでにアプリとして開いているか（ホーム画面から起動した PWA か、Android アプリ本体） */
function isInstalled(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    // Capacitor の WebView は standalone を名乗らないので、ネイティブかどうかを別に見る
    Capacitor.isNativePlatform() ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as IOSNavigator).standalone === true
  );
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const installed = useSyncExternalStore(subscribeNoop, isInstalled, () => true);
  const platform = useSyncExternalStore(subscribeNoop, detectPlatform, () => 'other' as const);
  const deferred = useSyncExternalStore(subscribePrompt, () => deferredPrompt, () => null);

  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const hidden = installed || dismissed || (typeof window !== 'undefined' && wasDismissed());

  if (hidden || platform === 'other') return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* プライベートモードなど。セッション内だけ閉じれば十分。 */
    }
    setDismissed(true);
  };

  const install = async () => {
    if (!deferred) {
      setOpen(true);
      return;
    }
    // prompt() はひとつのイベントにつき一度しか呼べない。次に押されたら手順を案内する。
    setDeferredPrompt(null);
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') dismiss();
  };

  return (
    <>
      <div
        className="anim-up fixed inset-x-3 z-[45] safe-bottom"
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
            className="tsu-btn -mr-2 grid h-10 w-10 shrink-0 place-items-center text-[15px]"
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
