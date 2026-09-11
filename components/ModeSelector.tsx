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
    <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">練習モード</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            disabled={disabled}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${currentMode === mode.value
                ? 'bg-teal-500 text-white shadow-md'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="mr-1">{mode.emoji}</span>
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
