import { LanguageLevel, UserProfile } from '@/types';

interface ProgressIndicatorProps {
  profile: UserProfile;
}

const levelInfo: Record<LanguageLevel, { label: string; description: string; color: string }> = {
  elementary: {
    label: '初級',
    description: '日常会話レベル',
    color: 'bg-green-500',
  },
  intermediate: {
    label: '中級',
    description: '一般的な話題に対応',
    color: 'bg-blue-500',
  },
  business: {
    label: 'ビジネス',
    description: '会議・プレゼン対応',
    color: 'bg-purple-500',
  },
};

export default function ProgressIndicator({ profile }: ProgressIndicatorProps) {
  const currentInfo = levelInfo[profile.currentLevel];
  const goalInfo = levelInfo[profile.goalLevel];
  
  const levels: LanguageLevel[] = ['elementary', 'intermediate', 'business'];
  const currentIndex = levels.indexOf(profile.currentLevel);
  const goalIndex = levels.indexOf(profile.goalLevel);
  
  return (
    <div className="bg-gradient-to-br from-sky-50/50 to-blue-50/50 border border-blue-100/50 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-blue-600">📈</span>
        学習進捗
      </h3>
      
      <div className="space-y-3">
        {/* Compact level display */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">現在</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-medium ${currentInfo.color}`}>
              {currentInfo.label}
            </div>
          </div>
          <div className="text-lg text-gray-300">→</div>
          <div className="flex-1 text-right">
            <div className="text-xs text-gray-500 mb-1">目標</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-medium ${goalInfo.color}`}>
              {goalInfo.label}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="flex gap-1.5">
          {levels.map((level, index) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                index <= currentIndex
                  ? levelInfo[level].color
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-blue-100/50">
          <div>
            <div className="text-xs text-gray-500">練習回数</div>
            <div className="text-base font-bold text-blue-600">{profile.totalSessions}回</div>
          </div>
          {profile.lastSessionDate && (
            <div className="text-right">
              <div className="text-xs text-gray-500">最終日</div>
              <div className="text-xs font-medium text-gray-700">
                {new Date(profile.lastSessionDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
