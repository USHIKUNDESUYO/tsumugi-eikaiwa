import { ChatMode } from '@/types';

interface ModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

const modes: { value: ChatMode; label: string; emoji: string }[] = [
  { value: 'free-chat', label: 'フリートーク', emoji: '💬' },
  { value: 'daily-life', label: '日常会話', emoji: '🏡' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'workplace-small-talk', label: '職場雑談', emoji: '☕' },
  { value: 'business', label: 'ビジネス英語', emoji: '💼' },
  { value: 'vocab-drill', label: '語彙練習', emoji: '📚' },
];

export default function ModeSelector({ currentMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="text-cyan-600">📚</span>
        練習モード
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            disabled={disabled}
            className={`
              px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation
              ${currentMode === mode.value
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
            `}
          >
            <span className="mr-1.5">{mode.emoji}</span>
            <span className="text-xs">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
