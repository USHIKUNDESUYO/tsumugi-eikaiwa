'use client';

import { useState, useEffect } from 'react';

export default function QRCodeDisplay() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setCurrentUrl(url);
      // Use QR Server API for generating QR codes (free, no API key needed)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`);
    }
  }, []);

  const toggleQR = () => {
    setShowQR(!showQR);
  };

  return (
    <>
      {/* QR Code Button - positioned to avoid FAB and input */}
      <button
        onClick={toggleQR}
        className="fixed bottom-24 md:bottom-4 left-4 md:right-4 md:left-auto bg-white/90 backdrop-blur-sm shadow-lg rounded-full p-3 hover:shadow-xl transition-all border border-gray-200/50 z-30 hover:scale-110 active:scale-95"
        title="QRコードを表示"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-gray-700" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" 
          />
        </svg>
      </button>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                📱 スマホでアクセス
              </h2>
              <button
                onClick={toggleQR}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-lg" />
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  このQRコードをスマホで読み取ってください
                </p>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 break-all border border-gray-200">
                  {currentUrl || 'URLを取得中...'}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">📝 次のステップ：</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>スマホでこのページを開く</li>
                  <li>Safari（iPhone）またはChrome（Android）で開く</li>
                  <li>「ホーム画面に追加」でインストール</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                <strong>⚠️ 注意：</strong> PWAインストールと音声機能はHTTPS環境（例：Vercel）が必要です。
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
