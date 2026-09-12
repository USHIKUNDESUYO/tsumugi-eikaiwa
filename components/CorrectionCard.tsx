'use client';

import { useState } from 'react';
import { CorrectionCard as CorrectionCardType } from '@/types';

interface CorrectionCardProps {
  correction: CorrectionCardType;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const severityColors = {
    minor: 'bg-blue-50/80 border-blue-200/50',
    moderate: 'bg-amber-50/80 border-amber-200/50',
    important: 'bg-rose-50/80 border-rose-200/50',
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
    <div className={`rounded-xl border backdrop-blur-sm transition-all ${severityColors[correction.severity]} ${isExpanded ? 'p-3' : 'p-2.5'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base flex-shrink-0">{severityIcons[correction.severity]}</span>
          <span className="text-xs font-semibold text-gray-700 truncate">
            {severityLabels[correction.severity]}
          </span>
        </div>
        <span className="text-gray-400 text-sm flex-shrink-0 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div className="mt-2.5 space-y-2 text-xs">
          <div className="flex gap-1.5">
            <span className="text-gray-500 font-medium flex-shrink-0">❌</span>
            <div className="min-w-0">
              <p className="text-gray-700 leading-relaxed">"{correction.said}"</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="text-green-600 font-medium flex-shrink-0">✅</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 leading-relaxed">"{correction.better}"</p>
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
