'use client';

import { useId, useState } from 'react';
import { CorrectionCard as CorrectionCardType } from '@/types';

interface CorrectionCardProps {
  correction: CorrectionCardType;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const explanationId = useId();
  
  const severityColors = {
    minor: 'border-l-teal-400',
    moderate: 'border-l-amber-400',
    important: 'border-l-rose-400',
  };

  const severityIcons = {
    minor: '💡',
    moderate: '⚠️',
    important: '⭐',
  };
  
  const severityLabels = {
    minor: '小さなポイント',
    moderate: '気をつけたいポイント',
    important: '重要なポイント',
  };

  return (
    <div className={`rounded-xl border border-gray-200 border-l-2 bg-white px-3 pb-3 ${severityColors[correction.severity]}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={explanationId}
        className="min-h-11 w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base flex-shrink-0">{severityIcons[correction.severity]}</span>
          <span className="text-xs font-semibold text-gray-700 truncate">
            表現のヒント
          </span>
        </div>
        <span className="text-teal-700 text-xs flex-shrink-0">
          {isExpanded ? '閉じる −' : '解説 ＋'}
        </span>
      </button>
      <p className="text-sm leading-6 font-medium text-teal-800 break-words">{correction.better}</p>
      
      {isExpanded && (
        <div id={explanationId} className="mt-3 space-y-3 border-t border-gray-100 pt-3 text-sm break-words">
          <p className="text-xs text-gray-500">{severityLabels[correction.severity]}</p>
          <div className="flex gap-1.5">
            <span className="text-gray-500 font-medium flex-shrink-0">❌</span>
            <div className="min-w-0">
              <p className="text-gray-700 leading-relaxed">{correction.said}</p>
            </div>
          </div>
          <div className="pt-1 border-t border-gray-200/50">
            <p className="text-gray-600 leading-relaxed">{correction.why}</p>
          </div>
        </div>
      )}
    </div>
  );
}
