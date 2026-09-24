'use client';

import { useMemo, useState } from 'react';
import type { AppState, FestivalScenarioId } from '@/types';
import { festivalScenarios, festivalScenarioOrder } from '@/lib/festivalScenarios';
import { togglePhraseMastered } from '@/lib/storage';
import { speakText, stopAllSpeech } from '@/lib/ttsVoice';

export default function PhrasebookScreen({ state }: { state: AppState }) {
  const [scenarioId, setScenarioId] = useState<FestivalScenarioId>(festivalScenarioOrder[0]);
  const [starOnly, setStarOnly] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  const scenario = festivalScenarios[scenarioId];
  const phrases = useMemo(
    () => (starOnly ? scenario.phrases.filter((p) => p.star) : scenario.phrases),
    [scenario, starOnly]
  );

  const masteredCount = scenario.phrases.filter((p) => state.masteredPhrases.includes(p.en)).length;

  const speak = (en: string) => {
    stopAllSpeech();
    setPlaying(en);
    speakText(en, { onEnd: () => setPlaying(null), onError: () => setPlaying(null) });
  };

  return (
    <div className="safe-top">
      <header className="px-5 pt-5">
        <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--text)' }}>
          フレーズ帳
        </h1>
        <p className="mt-1 text-[12.5px] font-semibold" style={{ color: 'var(--text-soft)' }}>
          ⭐️ がついているのが「これだけは覚えたい」フレーズ。
        </p>
      </header>

      {/* シーン切り替え */}
      <div className="tsu-scroll mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {festivalScenarioOrder.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setScenarioId(id)}
            data-active={id === scenarioId}
            className="tsu-chip tsu-btn shrink-0 px-3.5 py-2 text-[12.5px]"
          >
            {festivalScenarios[id].emoji} {festivalScenarios[id].title}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between px-5">
        <p className="text-[12px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
          覚えた {masteredCount} / {scenario.phrases.length}
        </p>
        <button
          type="button"
          onClick={() => setStarOnly((v) => !v)}
          data-active={starOnly}
          className="tsu-chip tsu-btn px-3 py-1.5 text-[11.5px]"
        >
          ⭐️ 必修だけ
        </button>
      </div>

      <ul className="mt-2.5 flex flex-col gap-2 px-5 pb-6">
        {phrases.map((p, i) => {
          const mastered = state.masteredPhrases.includes(p.en);
          return (
            <li
              key={p.en}
              className="tsu-card-solid anim-up px-4 py-3.5"
              style={{
                animationDelay: `${i * 22}ms`,
                borderColor: mastered ? 'var(--tsu-pink-300)' : 'var(--border)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-start gap-1.5 text-[15.5px] font-extrabold leading-snug" style={{ color: 'var(--text)' }}>
                    {p.star && <span aria-label="必修">⭐️</span>}
                    <span>{p.en}</span>
                  </p>
                  <p className="mt-1 text-[12.5px] font-semibold" style={{ color: 'var(--text-soft)' }}>
                    {p.ja}
                  </p>
                  {p.note && (
                    <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                      {p.note}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => speak(p.en)}
                    aria-label={`${p.en} を再生`}
                    className="tsu-btn grid h-10 w-10 place-items-center text-[16px]"
                    style={{ background: playing === p.en ? 'var(--tsu-pink-300)' : 'var(--tsu-pink-100)' }}
                  >
                    {playing === p.en ? '🔈' : '🔊'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      togglePhraseMastered(p.en);
                    }}
                    aria-label={mastered ? '覚えたを取り消す' : '覚えた'}
                    aria-pressed={mastered}
                    className="tsu-btn grid h-10 w-10 place-items-center text-[15px]"
                    style={{
                      background: mastered ? 'var(--tsu-pink-500)' : 'var(--tsu-pink-100)',
                      color: mastered ? '#fff' : 'var(--text-faint)',
                    }}
                  >
                    ✓
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
