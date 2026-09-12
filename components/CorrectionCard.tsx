import { CorrectionCard as CorrectionCardType } from '@/types';

interface CorrectionCardProps {
  correction: CorrectionCardType;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  const severityColors = {
    minor: 'bg-blue-50 border-blue-200',
    moderate: 'bg-amber-50 border-amber-200',
    important: 'bg-rose-50 border-rose-200',
  };

  const severityLabels = {
    minor: '💡 小さなポイント',
    moderate: '⚠️ 気をつけたいポイント',
    important: '⭐ 重要なポイント',
  };

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm ${severityColors[correction.severity]}`}>
      <div className="text-xs font-semibold mb-3 text-gray-700">
        {severityLabels[correction.severity]}
      </div>
      <div className="space-y-3">
        <div>
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">あなたの表現</span>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">"{correction.said}"</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">より良い表現</span>
          <p className="text-sm font-bold text-gray-900 mt-1.5 leading-relaxed bg-white/50 rounded-lg px-3 py-2">"{correction.better}"</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">解説</span>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{correction.why}</p>
        </div>
      </div>
    </div>
  );
}
