"use client";

import { useState } from "react";
import { ReviewItem } from "@/lib/types";

interface ReviewPanelProps {
  items: ReviewItem[];
  onUpdateItems: (items: ReviewItem[]) => void;
}

export default function ReviewPanel({ items, onUpdateItems }: ReviewPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">復習リストが空です</h2>
          <p className="text-gray-500">
            チャットで会話すると、訂正された表現が自動的に追加されます
          </p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    const updated = [...items];
    updated[currentIndex].reviewCount += 1;
    onUpdateItems(updated);
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="text-sm text-gray-600">
            復習回数: {currentItem.reviewCount}
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 min-h-[300px] flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-sm text-gray-500 mb-2">間違えた表現</h3>
            <p className="text-2xl font-bold text-red-500">{currentItem.word}</p>
          </div>

          {showAnswer ? (
            <>
              <div className="mb-6">
                <h3 className="text-sm text-gray-500 mb-2">正しい表現</h3>
                <p className="text-2xl font-bold text-green-500">{currentItem.meaning}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-2">説明</h3>
                <p className="text-lg text-gray-700">{currentItem.example}</p>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-8 bg-tsumugi-primary text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg active:scale-95 transition-transform"
            >
              答えを見る
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-full text-lg font-medium active:scale-95 transition-transform"
          >
            ← 前へ
          </button>
          <button
            onClick={handleNext}
            className="flex-1 bg-tsumugi-primary text-white px-6 py-4 rounded-full text-lg font-medium shadow-lg active:scale-95 transition-transform"
          >
            次へ →
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => onUpdateItems([])}
            className="text-sm text-gray-500 underline"
          >
            復習リストをクリア
          </button>
        </div>
      </div>
    </div>
  );
}
