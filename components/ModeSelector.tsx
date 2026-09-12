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
    <div className="bg-gradient-to-br from-cyan-50/50 to-teal-50/50 border border-cyan-100/50 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-cyan-600">📚</span>
        練習モード
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            disabled={disabled}
            className={`
              px-3 py-3.5 rounded-xl text-sm font-medium transition-all touch-manipulation min-h-[52px] flex flex-col items-center justify-center gap-1
              ${currentMode === mode.value
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md'
                : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-sm border border-gray-200/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
            `}
          >
            <span className="text-xl">{mode.emoji}</span>
            <span className="text-xs leading-tight">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
