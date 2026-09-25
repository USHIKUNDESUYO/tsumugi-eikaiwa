'use client';

import { useMemo, useState } from 'react';
import type { AppState, FestivalScenarioId } from '@/types';
import { festivalScenarios, festivalScenarioOrder } from '@/lib/festivalScenarios';
import { togglePhraseMastered } from '@/lib/storage';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import { speakText, stopAllSpeech } from '@/lib/ttsVoice';
import { fillName } from '@/lib/learnerName';
import MyAnswersPanel from '@/components/screens/MyAnswersPanel';

export type PhraseTab = 'mine' | 'scenes';

const PHRASE_TABS: Array<{ id: PhraseTab; label: string }> = [
  { id: 'mine', label: '📝 自分の答え' },
  { id: 'scenes', label: '📖 場面のフレーズ' },
];

export default function PhrasebookScreen({
  state,
  tab,
  onTabChange,
}: {
  state: AppState;
  /** 「自分の答え」と「場面のフレーズ」のどちらを見ているか（ホームから直接開けるよう外で持つ） */
  tab: PhraseTab;
  onTabChange: (tab: PhraseTab) => void;
}) {
  const [scenarioId, setScenarioId] = useState<FestivalScenarioId>(festivalScenarioOrder[0]);
  const [starOnly, setStarOnly] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  const scenario = festivalScenarios[scenarioId];
  const phrases = useMemo(
    () => (starOnly ? scenario.phrases.filter((p) => p.star) : scenario.phrases),
    [scenario, starOnly]
  );

  const masteredCount = scenario.phrases.filter((p) => state.masteredPhrases.includes(p.en)).length;

  /** key は元のフレーズ（再生中の表示に使う）、text は名前を入れて読み上げる文 */
  const speak = (key: string, text: string) => {
    stopAllSpeech();
    setPlaying(key);
    speakText(text, { onEnd: () => setPlaying(null), onError: () => setPlaying(null) });
  };

  return (
    <div className="safe-top">
      <header className="px-5 pt-5">
        <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--text)' }}>
          フレーズ帳
        </h1>
        <div className="mt-3 flex gap-2" role="tablist" aria-label="フレーズ帳の切り替え">
          {PHRASE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              data-active={tab === t.id}
              onClick={() => {
                playSfx('tap');
                onTabChange(t.id);
              }}
              className="tsu-chip tsu-btn flex-1 py-2.5 text-[13px]"
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'mine' ? (
        <MyAnswersPanel state={state} />
      ) : (
        <>
          <p className="mt-3 px-5 text-[12.5px] font-semibold" style={{ color: 'var(--text-soft)' }}>
            ⭐️ がついているのが「これだけは覚えたい」フレーズ。
          </p>

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
              // 「覚えた」は元のフレーズで記録する（名前を変えても消えないように）
              const mastered = state.masteredPhrases.includes(p.en);
              const en = fillName(p.en, state.profile.displayName, 'en');
              const ja = fillName(p.ja, state.profile.displayName, 'ja');
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
                        <span>{en}</span>
                      </p>
                      <p className="mt-1 text-[12.5px] font-semibold" style={{ color: 'var(--text-soft)' }}>
                        {ja}
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
                        onClick={() => speak(p.en, en)}
                        aria-label={`${en} を再生`}
                        className="tsu-btn grid h-10 w-10 place-items-center text-[16px]"
                        style={{ background: playing === p.en ? 'var(--tsu-pink-300)' : 'var(--tsu-pink-100)' }}
                      >
                        {playing === p.en ? '🔈' : '🔊'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nowMastered = togglePhraseMastered(p.en);
                          playSfx(nowMastered ? 'correct' : 'tap');
                          haptic('light');
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
        </>
      )}
    </div>
  );
}
