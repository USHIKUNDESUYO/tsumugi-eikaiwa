'use client';

import { useState } from 'react';
import { Phrase } from '@/types';

interface PhraseBankProps {
  phrases: Phrase[];
  title: string;
  onPhraseClick?: (phrase: string) => void;
}

export default function PhraseBank({ phrases, title, onPhraseClick }: PhraseBankProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💼</span>
          <span className="font-semibold text-purple-900">{title}</span>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            {phrases.length}個
          </span>
        </div>
        <span className={`text-purple-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
          <p className="text-xs text-purple-600 mb-3">
            クリックして入力欄に挿入できます
          </p>
          {phrases.map((phrase, index) => (
            <div
              key={index}
              onClick={() => onPhraseClick?.(phrase.english)}
              className="bg-white border border-purple-200 rounded-lg p-3 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 group-hover:text-purple-600">📌</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1 group-hover:text-purple-900">
                    {phrase.english}
                  </p>
                  <p className="text-xs text-gray-600">
                    {phrase.japanese}
                  </p>
                  {phrase.context && (
                    <p className="text-xs text-purple-600 mt-1 italic">
                      💡 {phrase.context}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
