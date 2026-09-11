'use client';

import { BusinessScenario, DifficultyLevel } from '@/types';
import { businessScenarios } from '@/lib/businessScenarios';

interface BusinessScenarioSelectorProps {
  currentScenario?: BusinessScenario;
  currentDifficulty: DifficultyLevel;
  onScenarioChange: (scenario: BusinessScenario) => void;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  disabled?: boolean;
}

const difficultyInfo: Record<DifficultyLevel, { label: string; emoji: string; color: string }> = {
  beginner: { label: '初級', emoji: '🌱', color: 'bg-green-100 text-green-700 border-green-300' },
  intermediate: { label: '中級', emoji: '🌿', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  advanced: { label: '上級', emoji: '🌳', color: 'bg-purple-100 text-purple-700 border-purple-300' },
};

export default function BusinessScenarioSelector({
  currentScenario,
  currentDifficulty,
  onScenarioChange,
  onDifficultyChange,
  disabled,
}: BusinessScenarioSelectorProps) {
  const scenarios = Object.values(businessScenarios);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <span>💼</span>
          ビジネスシナリオ
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => onScenarioChange(scenario.id)}
              disabled={disabled}
              className={`
                px-3 py-3 rounded-lg text-xs font-medium transition-all text-left
                ${currentScenario === scenario.id
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-1 mb-1">
                <span>{scenario.emoji}</span>
                <span className="font-semibold">{scenario.label}</span>
              </div>
              <p className="text-xs opacity-80 leading-tight">
                {scenario.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-purple-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">難易度レベル</h3>
        <div className="flex gap-2">
          {(Object.keys(difficultyInfo) as DifficultyLevel[]).map((difficulty) => {
            const info = difficultyInfo[difficulty];
            return (
              <button
                key={difficulty}
                onClick={() => onDifficultyChange(difficulty)}
                disabled={disabled}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2
                  ${currentDifficulty === difficulty
                    ? info.color + ' shadow-md'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">{info.emoji}</span>
                  <span>{info.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>自動レベルアップ:</strong> 上手にできると、自動的に難易度が上がります！
          </p>
        </div>
      </div>
    </div>
  );
}
