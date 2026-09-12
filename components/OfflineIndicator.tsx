'use client';

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online) {
        setShowOfflineNotice(true);
      } else {
        setTimeout(() => setShowOfflineNotice(false), 3000);
      }
    };

    setIsOnline(navigator.onLine);
    setShowOfflineNotice(!navigator.onLine);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (!showOfflineNotice && isOnline) return null;

  return (
    <div
      className={`fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-amber-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <span className="mr-2">✓</span>
          オンラインに戻りました
        </>
      ) : (
        <>
          <span className="mr-2">📡</span>
          オフラインモード - 復習リストは利用可能
        </>
      )}
    </div>
  );
}
