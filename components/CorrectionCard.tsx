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
    <div className={`rounded-lg border-2 p-4 my-3 ${severityColors[correction.severity]}`}>
      <div className="text-xs font-semibold mb-2 text-gray-600">
        {severityLabels[correction.severity]}
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-xs font-medium text-gray-500">あなたの表現:</span>
          <p className="text-sm text-gray-700 mt-1">"{correction.said}"</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500">より良い表現:</span>
          <p className="text-sm font-semibold text-gray-900 mt-1">"{correction.better}"</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500">解説:</span>
          <p className="text-sm text-gray-700 mt-1">{correction.why}</p>
        </div>
      </div>
    </div>
  );
}
