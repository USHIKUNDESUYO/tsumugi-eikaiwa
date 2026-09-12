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
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          まだ訂正記録がありません
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          会話の中で訂正があると、自動的にここに記録されます。<br />
          後で復習して、英語力を伸ばしましょう！
        </p>
        {!isOnline && (
          <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            📡 オフライン中 - 過去の記録があればここで復習できます
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            復習リスト <span className="text-teal-600">({mistakes.length}件)</span>
            {!isOnline && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-normal">
                📡 オフライン
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">
            {isOnline 
              ? '間違えた表現をまとめて復習できます' 
              : 'ローカルデータから復習できます'}
          </p>
        </div>
        {mistakes.length > 0 && (
          <button
            onClick={() => onStartDrill(mistakes)}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
          >
            🎯 復習する
          </button>
        )}
      </div>

      <div className="space-y-3">
        {mistakes.map((mistake) => (
          <div
            key={mistake.id}
            className={`rounded-lg border-2 p-4 ${severityColors[mistake.severity]}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{severityLabels[mistake.severity]}</span>
                <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                  {modeLabels[mistake.mode] || mistake.mode}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleMarkMastered(mistake.id)}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  title="習得済みにする"
                >
                  ✓ 習得
                </button>
                <button
                  onClick={() => handleDelete(mistake.id)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  title="削除"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500">間違えた表現:</span>
                <p className="text-sm text-gray-700 mt-1">"{mistake.said}"</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">正しい表現:</span>
                <p className="text-sm font-semibold text-gray-900 mt-1">"{mistake.better}"</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">解説:</span>
                <p className="text-sm text-gray-700 mt-1">{mistake.why}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                📅 {new Date(mistake.timestamp).toLocaleDateString('ja-JP')}
              </div>
              <div className="text-xs text-gray-500">
                👁️ 見た回数: {mistake.timesSeen}
              </div>
              <div className="text-xs text-gray-500">
                ✓ 習得: {mistake.timesMastered}回
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
