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
    <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">学習進捗</h3>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-500">現在のレベル</div>
          <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium mt-1 ${currentInfo.color}`}>
            {currentInfo.label}
          </div>
          <div className="text-xs text-gray-600 mt-1">{currentInfo.description}</div>
        </div>
        
        <div className="text-2xl text-gray-300">→</div>
        
        <div>
          <div className="text-xs text-gray-500">目標レベル</div>
          <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium mt-1 ${goalInfo.color}`}>
            {goalInfo.label}
          </div>
          <div className="text-xs text-gray-600 mt-1">{goalInfo.description}</div>
        </div>
      </div>
      
      <div className="flex gap-1 mb-3">
        {levels.map((level, index) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition-all ${
              index <= currentIndex
                ? levelInfo[level].color
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-teal-100">
        <div>
          <div className="text-xs text-gray-500">練習セッション</div>
          <div className="text-lg font-bold text-teal-600">{profile.totalSessions}回</div>
        </div>
        {profile.lastSessionDate && (
          <div>
            <div className="text-xs text-gray-500">最終練習日</div>
            <div className="text-sm font-medium text-gray-700">
              {new Date(profile.lastSessionDate).toLocaleDateString('ja-JP')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
