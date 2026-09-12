'use client';

import { useState, useEffect } from 'react';
import { MistakeRecord } from '@/types';
import { deleteMistake, markMistakeMastered } from '@/lib/storage';

interface ReviewListProps {
  mistakes: MistakeRecord[];
  onUpdate: () => void;
  onStartDrill: (mistakes: MistakeRecord[]) => void;
}

const modeLabels: Record<string, string> = {
  'free-chat': 'フリートーク',
  'daily-life': '日常会話',
  'travel': '旅行',
  'workplace-small-talk': '職場雑談',
  'meeting': '会議',
  'email': 'メール',
  'presentation': 'プレゼン',
  'vocab-drill': '語彙練習',
};

export default function ReviewList({ mistakes, onUpdate, onStartDrill }: ReviewListProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('この記録を削除しますか？')) {
      deleteMistake(id);
      onUpdate();
    }
  };

  const handleMarkMastered = (id: string) => {
    markMistakeMastered(id);
    onUpdate();
  };

  const severityColors = {
    minor: 'bg-blue-50 border-blue-200',
    moderate: 'bg-amber-50 border-amber-200',
    important: 'bg-rose-50 border-rose-200',
  };

  const severityLabels = {
    minor: '💡',
    moderate: '⚠️',
    important: '⭐',
  };

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6 min-h-[400px]">
        <div className="text-5xl sm:text-6xl mb-4 animate-bounce">📝</div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 text-center">
          まだ訂正記録がありません
        </h3>
        <p className="text-sm sm:text-base text-gray-500 text-center max-w-md leading-relaxed">
          会話の中で訂正があると、自動的にここに記録されます。
        </p>
        <p className="text-sm sm:text-base text-gray-500 text-center max-w-md mt-2">
          後で復習して、英語力を伸ばしましょう！
        </p>
        {!isOnline && (
          <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            📡 オフライン中 - 過去の記録があればここで復習できます
          </div>
        )}
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
        >
          💬 会話に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 flex items-center gap-2 flex-wrap">
              📚 復習リスト 
              <span className="text-teal-600 bg-teal-100 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {mistakes.length}件
              </span>
              {!isOnline && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-normal">
                  📡 オフライン
                </span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {isOnline 
                ? '間違えた表現をまとめて復習できます' 
                : 'ローカルデータから復習できます'}
            </p>
          </div>
          {mistakes.length > 0 && (
            <button
              onClick={() => onStartDrill(mistakes)}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg active:scale-95 touch-manipulation flex items-center justify-center gap-2"
            >
              <span className="text-lg">🎯</span>
              <span>すべて復習する</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {mistakes.map((mistake) => (
          <div
            key={mistake.id}
            className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5 shadow-sm ${severityColors[mistake.severity]} transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl">{severityLabels[mistake.severity]}</span>
                <span className="text-xs font-semibold text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200">
                  {modeLabels[mistake.mode] || mistake.mode}
                </span>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => handleMarkMastered(mistake.id)}
                  className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 active:bg-green-300 transition-all touch-manipulation"
                  title="習得済みにする"
                >
                  <span className="hidden sm:inline">✓ 習得</span>
                  <span className="sm:hidden">✓</span>
                </button>
                <button
                  onClick={() => handleDelete(mistake.id)}
                  className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition-all touch-manipulation"
                  title="削除"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-rose-50/50 backdrop-blur-sm border border-rose-200/50 rounded-lg p-3">
                <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">間違えた表現</span>
                <p className="text-sm sm:text-base text-gray-800 mt-1.5 font-medium">"{mistake.said}"</p>
              </div>
              <div className="bg-emerald-50/50 backdrop-blur-sm border border-emerald-200/50 rounded-lg p-3">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">正しい表現</span>
                <p className="text-sm sm:text-base text-gray-900 mt-1.5 font-bold">"{mistake.better}"</p>
              </div>
              <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-200/50 rounded-lg p-3">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">解説</span>
                <p className="text-sm sm:text-base text-gray-700 mt-1.5 leading-relaxed">{mistake.why}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 pt-3 border-t border-gray-200/50">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>📅</span>
                <span>{new Date(mistake.timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>👁️</span>
                <span>{mistake.timesSeen}回</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>✓</span>
                <span>習得 {mistake.timesMastered}回</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
