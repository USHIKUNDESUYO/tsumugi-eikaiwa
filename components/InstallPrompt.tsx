'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Detect Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    // Listen for beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // No install prompt available, show instructions instead
      setShowInstructions(true);
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  // Don't show anything if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Install banner */}
      <div className="bg-gradient-to-r from-pink-100 to-purple-100 border-b border-pink-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">📱</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">
                ホーム画面に追加してアプリとして使おう！
              </p>
              <p className="text-xs text-gray-600">
                オフラインでも使えて、すぐに開けます
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
              >
                インストール
              </button>
            ) : (
              <button
                onClick={handleShowInstructions}
                className="px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
              >
                手順を見る
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                📱 ホーム画面に追加
              </h2>
              <button
                onClick={handleCloseInstructions}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isIOS && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-pink-600 font-semibold">
                    <span className="text-2xl">🍎</span>
                    <span>iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="space-y-3 list-decimal list-inside text-gray-700">
                    <li>
                      画面下の<strong>共有ボタン</strong>（<span className="inline-flex items-center px-1">□↑</span>）をタップ
                    </li>
                    <li>
                      下にスクロールして<strong>「ホーム画面に追加」</strong>を選択
                    </li>
                    <li>
                      右上の<strong>「追加」</strong>をタップ
                    </li>
                  </ol>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <strong>ヒント：</strong> Safari以外のブラウザ（Chrome等）では追加できません。Safariで開いてください。
                  </div>
                </div>
              )}

              {isAndroid && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <span className="text-2xl">🤖</span>
                    <span>Android (Chrome)</span>
                  </div>
                  <ol className="space-y-3 list-decimal list-inside text-gray-700">
                    <li>
                      右上の<strong>メニュー</strong>（<span className="inline-flex items-center px-1">⋮</span>）をタップ
                    </li>
                    <li>
                      <strong>「ホーム画面に追加」</strong>または<strong>「アプリをインストール」</strong>を選択
                    </li>
                    <li>
                      <strong>「追加」</strong>または<strong>「インストール」</strong>をタップ
                    </li>
                  </ol>
                </div>
              )}

              {!isIOS && !isAndroid && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-600 font-semibold">
                    <span className="text-2xl">💻</span>
                    <span>デスクトップ</span>
                  </div>
                  <p className="text-gray-700">
                    ブラウザのアドレスバー右側にインストールアイコンが表示されます。クリックしてインストールしてください。
                  </p>
                </div>
              )}

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-pink-800">
                  ✨ インストールのメリット
                </p>
                <ul className="text-sm text-pink-700 space-y-1 list-disc list-inside">
                  <li>ホーム画面からワンタップで起動</li>
                  <li>オフラインでも基本機能が使える</li>
                  <li>全画面で没入感のある学習体験</li>
                  <li>音声機能がスムーズに動作</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>⚠️ 注意：</strong> 音声機能とPWAインストールはHTTPS環境（Vercel等）で最大限活用できます。
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
