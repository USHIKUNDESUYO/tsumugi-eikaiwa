'use client';

interface SessionSummaryProps {
  show: boolean;
  messagesCount: number;
  correctionsCount: number;
  durationMinutes: number;
  mode: string;
  onClose: () => void;
}

const modeLabels: Record<string, string> = {
  'free-chat': 'フリートーク',
  'daily-life': '日常会話',
  'travel': '旅行',
  'workplace-small-talk': '職場雑談',
  'business': 'ビジネス英語',
  'vocab-drill': '語彙練習',
};

export default function SessionSummary({
  show,
  messagesCount,
  correctionsCount,
  durationMinutes,
  mode,
  onClose,
}: SessionSummaryProps) {
  if (!show) return null;

  const getEncouragingMessage = () => {
    if (messagesCount >= 10) {
      return 'たくさん会話できましたね。継続が何より大切です。';
    }
    if (correctionsCount === 0) {
      return '訂正なしで進められましたね。素晴らしいです！';
    }
    if (correctionsCount <= 2) {
      return '良いペースで進んでいます。一緒に成長しましょう。';
    }
    return '今日も一歩前進しました。着実に力がついています。';
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden sticky top-0 bg-white pt-2 pb-3 px-4 border-b border-gray-100 rounded-t-3xl">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="p-6 sm:p-8 text-center border-b border-gray-100">
          <div className="text-5xl sm:text-6xl mb-4">🎉</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            お疲れ様でした！
          </h2>
          <p className="text-sm sm:text-base text-gray-500">
            今日のセッションの記録です
          </p>
        </div>

        {/* Stats */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-cyan-600 mb-1">
                  {messagesCount}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">メッセージ</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-teal-600 mb-1">
                  {correctionsCount}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">訂正</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-sm text-gray-500">練習時間</div>
                <div className="text-lg font-bold text-gray-800">
                  {durationMinutes}分
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <div className="text-sm text-gray-500">モード</div>
                <div className="text-base font-bold text-gray-800">
                  {modeLabels[mode] || mode}
                </div>
              </div>
            </div>
          </div>

          {/* Encouraging message */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-5 text-center">
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
              {getEncouragingMessage()}
            </p>
            <p className="text-sm sm:text-base text-gray-600 mt-3">
              また一緒に練習しましょう 🌸
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl pb-safe">
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:from-cyan-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl active:scale-95 touch-manipulation"
          >
            新しいセッションを始める
          </button>
        </div>
      </div>
    </div>
  );
}
