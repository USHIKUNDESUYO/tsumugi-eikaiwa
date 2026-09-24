'use client';

import { useState, useSyncExternalStore } from 'react';
import type { LanguageLevel } from '@/types';
import { updateProfile } from '@/lib/storage';
import { FESTIVAL_INFO, getCountdown } from '@/lib/festivalScenarios';
import TsumugiArt from '@/components/tsumugi/TsumugiArt';
import SpeechBubble from '@/components/tsumugi/SpeechBubble';

const LEVELS: Array<{ id: LanguageLevel; label: string; desc: string; emoji: string }> = [
  { id: 'elementary', label: 'はじめて寄り', desc: '単語は出るけど、文にならない', emoji: '🌱' },
  { id: 'intermediate', label: 'すこし話せる', desc: '簡単なやり取りならできる', emoji: '🌿' },
  { id: 'business', label: 'けっこう話せる', desc: '仕事でも英語を使う', emoji: '🌳' },
];

/** OS の「視差効果を減らす」を尊重する（まだ設定画面を触れていない段階なので） */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}

export default function OnboardingScreen() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<LanguageLevel>('elementary');
  const countdown = getCountdown();

  const finish = () => {
    updateProfile({
      displayName: name.trim() || 'あなた',
      currentLevel: level,
      goalLevel: 'intermediate',
      onboarded: true,
    });
  };

  const lines = [
    'はじめまして。わたし、紬（つむぎ）といいます。\nあなたの英会話、となりで見ています。',
    `${name.trim() || 'あなた'}さん、ですね。おぼえました。\n…いまって、英語どれくらい話せますか？`,
    countdown.status === 'upcoming'
      ? `10月2日まで、あと${countdown.days}日。\n福岡に世界中から人が来ます。\n…だいじょうぶ。ぜんぶ一緒に練習しましょう。`
      : 'いよいよですね。\nだいじょうぶ、練習した分はちゃんと出ます。',
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 safe-top">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10">
        <div className="anim-float">
          <TsumugiArt
            expression={step === 0 ? 'wave' : step === 1 ? 'thinking' : 'cheer'}
            size={230}
            reduceMotion={prefersReducedMotion}
          />
        </div>

        <SpeechBubble
          key={step}
          text={lines[step]}
          className="w-full max-w-sm whitespace-pre-line anim-pop"
        />

        <div className="w-full max-w-sm">
          {step === 0 && (
            <div className="anim-up">
              <label
                htmlFor="tsu-name"
                className="mb-2 block text-[13px] font-extrabold"
                style={{ color: 'var(--text-soft)' }}
              >
                なんて呼べばいいですか？
              </label>
              <input
                id="tsu-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ニックネームでOK"
                maxLength={16}
                autoComplete="off"
                className="tsu-card-solid w-full px-5 py-3.5 text-center font-bold outline-none"
                style={{ color: 'var(--text)' }}
              />
            </div>
          )}

          {step === 1 && (
            <div className="anim-up flex flex-col gap-2.5">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  className="tsu-btn tsu-card-solid flex items-center gap-3 px-4 py-3 text-left !rounded-2xl"
                  style={{
                    borderColor: level === l.id ? 'var(--tsu-pink-400)' : 'var(--border)',
                    borderWidth: level === l.id ? 2 : 1,
                  }}
                >
                  <span className="text-2xl" aria-hidden>
                    {l.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>
                      {l.label}
                    </span>
                    <span className="block text-[12px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                      {l.desc}
                    </span>
                  </span>
                  {level === l.id && <span aria-hidden>💗</span>}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div
              className="anim-up rounded-3xl px-5 py-4 text-center"
              style={{ background: 'var(--tsu-pink-100)' }}
            >
              <p className="text-[11px] font-extrabold tracking-widest" style={{ color: 'var(--tsu-pink-600)' }}>
                YOUR GOAL
              </p>
              <p className="mt-1 text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>
                {FESTIVAL_INFO.shortName} 2026
              </p>
              <p className="mt-0.5 text-[12px] font-semibold" style={{ color: 'var(--text-soft)' }}>
                10/2（金）〜10/4（日）・{FESTIVAL_INFO.venue}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pb-10">
        <button
          type="button"
          onClick={() => (step < 2 ? setStep(step + 1) : finish())}
          disabled={step === 0 && name.trim().length === 0}
          className="tsu-btn tsu-btn-primary w-full py-4 text-[16px]"
        >
          {step === 0 ? 'よろしくね' : step === 1 ? 'これでお願いします' : 'はじめる'}
        </button>
        <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 22 : 6,
                background: i === step ? 'var(--tsu-pink-500)' : 'var(--tsu-pink-200)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
