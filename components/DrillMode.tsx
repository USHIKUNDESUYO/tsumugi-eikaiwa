'use client';

import { useState, useEffect } from 'react';
import { MistakeRecord } from '@/types';
import { markMistakeMastered } from '@/lib/storage';

interface DrillModeProps {
  mistakes: MistakeRecord[];
  onComplete: () => void;
  onExit: () => void;
}

export default function DrillMode({ mistakes, onComplete, onExit }: DrillModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [completed, setCompleted] = useState(false);

  const currentMistake = mistakes[currentIndex];
  const progress = ((currentIndex + 1) / mistakes.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || showAnswer) return;

    const userAnswer = userInput.trim().toLowerCase();
    const correctAnswer = currentMistake.better.toLowerCase();

    // Simple matching - check if user's answer is close enough
    const isCorrect = 
      userAnswer === correctAnswer ||
      userAnswer.includes(correctAnswer) ||
      correctAnswer.includes(userAnswer) ||
      // Remove punctuation and check
      userAnswer.replace(/[.,!?]/g, '') === correctAnswer.replace(/[.,!?]/g, '');

    if (isCorrect) {
      setFeedback('correct');
      markMistakeMastered(currentMistake.id);
      
      // Auto-advance after short delay
      setTimeout(() => {
        handleNext();
      }, 1500);
    } else {
      setFeedback('incorrect');
      setShowAnswer(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < mistakes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setShowAnswer(false);
      setFeedback(null);
    } else {
      setCompleted(true);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6 min-h-[500px]">
        <div className="text-6xl sm:text-7xl mb-6 animate-bounce">🎉</div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 text-center">
          復習完了！
        </h3>
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-2xl p-6 mb-6 max-w-md w-full">
          <div className="flex items-center justify-center gap-3 text-teal-700">
            <span className="text-4xl font-bold">{mistakes.length}</span>
            <span className="text-lg">個の表現を復習しました</span>
          </div>
        </div>
        <p className="text-base sm:text-lg text-gray-600 mb-8 text-center max-w-md leading-relaxed">
          お疲れ様でした！継続が力になります。
        </p>
        <button
          onClick={onComplete}
          className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl active:scale-95 touch-manipulation text-lg"
        >
          📚 リストに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 safe-area-bottom">
      {/* Progress Header */}
      <div className="mb-5 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl">🎯</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-gray-800">
                復習ドリル
              </h3>
              <p className="text-xs text-gray-500">
                問題 {currentIndex + 1} / {mistakes.length}
              </p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all touch-manipulation min-h-[44px] flex items-center gap-1.5 flex-shrink-0"
          >
            <span>✕</span>
            <span className="hidden sm:inline">終了</span>
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-right font-medium">
          {Math.round(progress)}% 完了
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-gradient-to-br from-white to-teal-50/30 border-2 border-teal-200 rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="mb-4 sm:mb-5">
          <span className="text-xs sm:text-sm font-bold text-teal-700 bg-teal-100 px-4 py-1.5 rounded-full inline-flex items-center gap-2">
            <span>💡</span>
            <span>問題</span>
          </span>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-rose-700 mb-2 uppercase tracking-wide">間違えた表現</p>
            <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <p className="text-base sm:text-lg font-semibold text-gray-800">
                "{currentMistake.said}"
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-xs sm:text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">💡 ヒント（日本語解説）</p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                {currentMistake.why}
              </p>
            </div>
          </div>
        </div>

        {!showAnswer && !feedback && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm sm:text-base font-semibold text-gray-700 mb-2 block">
                ✍️ 正しい表現を英語で入力してください
              </label>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the correct phrase..."
                className="w-full px-4 py-3.5 sm:py-4 border-2 border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-white shadow-sm transition-all"
                autoFocus
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={!userInput.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 touch-manipulation min-h-[52px]"
              >
                ✓ 確認する
              </button>
              <button
                type="button"
                onClick={handleShowAnswer}
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:bg-gray-300 transition-all touch-manipulation border-2 border-gray-200 min-h-[52px]"
              >
                💡 答えを見る
              </button>
            </div>
          </form>
        )}

        {feedback === 'correct' && (
          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 text-green-700 font-bold mb-2 text-lg">
              <span className="text-3xl">✓</span>
              <span>正解です！</span>
            </div>
            <p className="text-sm sm:text-base text-green-700">
              素晴らしい！次の問題に進みます...
            </p>
          </div>
        )}

        {(feedback === 'incorrect' || showAnswer) && (
          <div className="space-y-3 sm:space-y-4">
            {feedback === 'incorrect' && (
              <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl shadow-md">
                <div className="flex items-center gap-3 text-amber-700 font-bold mb-2 text-base sm:text-lg">
                  <span className="text-2xl sm:text-3xl">ℹ️</span>
                  <span>もう一度確認しましょう</span>
                </div>
                <p className="text-sm sm:text-base text-amber-700 break-words">
                  あなたの回答: <span className="font-semibold">"{userInput}"</span>
                </p>
              </div>
            )}

            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-xl shadow-md">
              <p className="text-xs sm:text-sm font-bold text-teal-700 mb-2 uppercase tracking-wide">✓ 正解</p>
              <p className="text-lg sm:text-xl font-bold text-teal-900 break-words">
                "{currentMistake.better}"
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold text-base sm:text-lg hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl active:scale-95 touch-manipulation"
            >
              {currentIndex < mistakes.length - 1 ? '次へ →' : '✓ 完了'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
        <p className="text-xs sm:text-sm text-blue-700 font-medium">
          💡 ヒント: 正解に近い表現なら正解として認識されます
        </p>
      </div>
    </div>
  );
}
