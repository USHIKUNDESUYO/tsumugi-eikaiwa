'use client';

import { useState } from 'react';

interface SessionTipsProps {
  tips: string[];
  onAddToReview?: (phrase: string) => void;
}

export default function SessionTips({ tips, onAddToReview }: SessionTipsProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || tips.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-4 shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <h3 className="font-semibold text-amber-900">今日のおすすめフレーズ</h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 text-xl"
        >
          ✕
        </button>
      </div>

      <p className="text-sm text-amber-800 mb-3">
        このセッションで練習すると良いフレーズです：
      </p>

      <div className="space-y-2">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between group hover:border-amber-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-500">✓</span>
              <p className="text-sm font-medium text-gray-800">"{tip}"</p>
            </div>
            {onAddToReview && (
              <button
                onClick={() => onAddToReview(tip)}
                className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors opacity-0 group-hover:opacity-100"
              >
                復習に追加
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-amber-600 mt-3 text-center">
        これらのフレーズを使って会話してみましょう！
      </p>
    </div>
  );
}
