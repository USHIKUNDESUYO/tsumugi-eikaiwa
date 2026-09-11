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
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
          復習完了！
        </h3>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          お疲れ様でした！{mistakes.length}個の表現を復習しました。
        </p>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
        >
          リストに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            復習ドリル {currentIndex + 1} / {mistakes.length}
          </h3>
          <button
            onClick={onExit}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ✕ 終了
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-teal-100 rounded-2xl shadow-lg p-6 mb-6">
        <div className="mb-4">
          <span className="text-xs font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            問題
          </span>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">間違えた表現:</p>
          <p className="text-lg font-medium text-gray-800 mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
            "{currentMistake.said}"
          </p>
          
          <p className="text-sm text-gray-600 mb-2">ヒント（日本語解説）:</p>
          <p className="text-sm text-gray-700 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            {currentMistake.why}
          </p>
        </div>

        {!showAnswer && !feedback && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                正しい表現を英語で入力してください:
              </label>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the correct phrase..."
                className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!userInput.trim()}
                className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                確認
              </button>
              <button
                type="button"
                onClick={handleShowAnswer}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                答えを見る
              </button>
            </div>
          </form>
        )}

        {feedback === 'correct' && (
          <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl">
            <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
              <span className="text-2xl">✓</span>
              <span>正解です！</span>
            </div>
            <p className="text-sm text-green-600">
              素晴らしい！次の問題に進みます...
            </p>
          </div>
        )}

        {(feedback === 'incorrect' || showAnswer) && (
          <div className="space-y-4">
            {feedback === 'incorrect' && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
                  <span className="text-2xl">ℹ️</span>
                  <span>もう一度確認しましょう</span>
                </div>
                <p className="text-sm text-amber-600">
                  あなたの回答: "{userInput}"
                </p>
              </div>
            )}

            <div className="p-4 bg-teal-50 border-2 border-teal-300 rounded-xl">
              <p className="text-sm font-medium text-teal-700 mb-2">正解:</p>
              <p className="text-lg font-semibold text-teal-900">
                "{currentMistake.better}"
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
            >
              {currentIndex < mistakes.length - 1 ? '次へ →' : '完了'}
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-gray-500">
        💡 ヒント: 正解に近い表現なら正解として認識されます
      </div>
    </div>
  );
}
