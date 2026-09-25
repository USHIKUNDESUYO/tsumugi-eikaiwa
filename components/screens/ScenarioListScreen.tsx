'use client';

import { useState } from 'react';
import type { AppState, FestivalScenarioId } from '@/types';
import { festivalScenarios, festivalScenarioOrder } from '@/lib/festivalScenarios';
import { sceneSrc } from '@/lib/scenes';
import { fillName } from '@/lib/learnerName';

const DIFF_LABEL = ['', 'やさしい', 'ふつう', 'ちょい難'];

export default function ScenarioListScreen({
  state,
  onStart,
}: {
  state: AppState;
  onStart: (id: FestivalScenarioId) => void;
}) {
  const [open, setOpen] = useState<FestivalScenarioId | null>(null);

  return (
    <div className="px-5 safe-top">
      <header className="pt-5">
        <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--text)' }}>
          フェスの13場面
        </h1>
        <p className="mt-1 text-[12.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-soft)' }}>
          紬が相手役を演じます。受付から、焚き火の夜、連絡先交換まで。
          <br />
          ぜんぶ SYNAPSE FES で実際に起きる場面です。
        </p>
      </header>

      <ul className="mt-4 flex flex-col gap-2.5 pb-6">
        {festivalScenarioOrder.map((id, i) => {
          const s = festivalScenarios[id];
          const cleared = state.clearedScenarios.includes(id);
          const expanded = open === id;

          return (
            <li key={id} className="tsu-card-solid overflow-hidden anim-up" style={{ animationDelay: `${i * 26}ms` }}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : id)}
                aria-expanded={expanded}
                className="tsu-btn flex w-full items-center gap-3.5 px-4 py-3.5 text-left !rounded-none"
              >
                <span
                  className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[24px]"
                  style={{ background: cleared ? 'var(--tsu-pink-200)' : 'var(--tsu-pink-100)' }}
                  aria-hidden
                >
                  {s.emoji}
                  {cleared && (
                    <span
                      className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-[11px] text-white"
                      style={{ background: 'var(--tsu-pink-600)' }}
                    >
                      ✓
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[15.5px] font-extrabold" style={{ color: 'var(--text)' }}>
                      {s.title}
                    </span>
                    <span
                      className="shrink-0 whitespace-nowrap rounded-full px-1.5 py-[1px] text-[9.5px] font-extrabold"
                      style={{ background: 'var(--tsu-lav-100)', color: 'var(--tsu-lav-400)' }}
                    >
                      {DIFF_LABEL[s.difficulty]}
                    </span>
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[12px] font-semibold"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    {s.tagline}
                  </span>
                </span>

                <span
                  className="shrink-0 text-[13px] transition-transform duration-200"
                  style={{ color: 'var(--text-faint)', transform: expanded ? 'rotate(180deg)' : 'none' }}
                  aria-hidden
                >
                  ▾
                </span>
              </button>

              {expanded && (
                <div className="anim-up border-t" style={{ borderColor: 'var(--border)' }}>
                  {/* その場面がどこなのかを一枚で見せる */}
                  <div className="relative h-28 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 装飾用の背景 */}
                    <img src={sceneSrc(id)} alt="" aria-hidden className="h-full w-full object-cover" />
                    <span
                      className="absolute left-3 bottom-2 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white"
                      style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)' }}
                    >
                      {s.when}
                    </span>
                  </div>

                  <div className="px-4 py-4">
                  <div
                    className="rounded-2xl px-3.5 py-3"
                    style={{ background: 'var(--tsu-pink-50)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-[11px] font-extrabold" style={{ color: 'var(--tsu-pink-600)' }}>
                      相手役
                    </p>
                    <p className="mt-0.5 text-[13.5px] font-extrabold" style={{ color: 'var(--text)' }}>
                      {s.partner.name}・{s.partner.from}
                    </p>
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--text-soft)' }}>
                      {s.partner.role}
                    </p>
                  </div>

                  <p className="mt-3 text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
                    このセッションのミッション
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {s.missions.map((m) => (
                      <li key={m} className="flex gap-2 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                        <span aria-hidden>☐</span>
                        {m}
                      </li>
                    ))}
                  </ul>

                  {s.culturalTip && (
                    <p
                      className="mt-3 rounded-2xl px-3.5 py-2.5 text-[11.5px] font-semibold leading-relaxed"
                      style={{ background: 'var(--tsu-lav-100)', color: 'var(--text-soft)' }}
                    >
                      💡 {fillName(s.culturalTip, state.profile.displayName, 'en')}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => onStart(id)}
                    className="tsu-btn tsu-btn-primary mt-3.5 w-full py-3.5 text-[15px]"
                  >
                    {cleared ? 'もう一度はなす' : 'このシーンをはなす'}
                  </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
