'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AppState, Outfit, Settings } from '@/types';
import { OUTFIT_UNLOCKS, updateSettings, resetAll, exportState, bondProgress } from '@/lib/storage';
import { MAX_BOX } from '@/lib/srs';
import { festivalScenarioOrder, getEssentialPhrases } from '@/lib/festivalScenarios';
import { apiUrl } from '@/lib/apiBase';
import TsumugiCharacter from '@/components/tsumugi/TsumugiCharacter';

const SETTING_ROWS: Array<{ key: keyof Settings; label: string; hint: string }> = [
  { key: 'autoSpeak', label: '紬の声を自動再生', hint: '返事が来たら自動で読み上げます' },
  { key: 'sfxEnabled', label: '演出を出す', hint: 'ハートやきらきらを表示します' },
  { key: 'reduceMotion', label: 'アニメを減らす', hint: '動きを止めて電池を節約します' },
];

export default function ProgressScreen({
  state,
  isPremium,
  onChangeOutfit,
  onOpenPaywall,
}: {
  state: AppState;
  isPremium: boolean;
  onChangeOutfit: (o: Outfit) => void;
  onOpenPaywall: () => void;
}) {
  const [aiLive, setAiLive] = useState<boolean | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/chat'))
      .then((r) => r.json())
      .then((d) => setAiLive(Boolean(d.configured)))
      .catch(() => setAiLive(false));
  }, []);

  const stats = useMemo(() => {
    const totalMinutes = Math.round(
      state.sessionStats.reduce((acc, s) => acc + s.duration, 0) / 60_000
    );
    const corrections = state.sessionStats.reduce((acc, s) => acc + s.correctionsCount, 0);
    const mastered = state.mistakes.filter((m) => (m.box ?? 0) >= MAX_BOX).length;
    const essentials = getEssentialPhrases();
    const essentialsDone = essentials.filter((p) => state.masteredPhrases.includes(p.en)).length;
    return {
      totalMinutes,
      corrections,
      mastered,
      essentialsDone,
      essentialsTotal: essentials.length,
    };
  }, [state]);

  const progress = bondProgress(state.bond);

  const download = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tsumugi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-5 pb-6 safe-top">
      <header className="pt-5">
        <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--text)' }}>
          記録
        </h1>
      </header>

      {/* -------------------------- サマリー -------------------------- */}
      <section className="mt-4 grid grid-cols-2 gap-2.5">
        <Stat label="はなした回数" value={`${state.profile.totalSessions}`} unit="回" />
        <Stat label="はなした時間" value={`${stats.totalMinutes}`} unit="分" />
        <Stat label="直してもらった数" value={`${stats.corrections}`} unit="コ" />
        <Stat label="覚えきった表現" value={`${stats.mastered}`} unit="コ" />
        <Stat
          label="クリアしたシーン"
          value={`${state.clearedScenarios.length}`}
          unit={`/ ${festivalScenarioOrder.length}`}
        />
        <Stat label="連続学習" value={`${state.streak.current}`} unit={`日（最長${state.streak.longest}）`} />
      </section>

      {/* -------------------------- 必修フレーズ -------------------------- */}
      <section className="tsu-card-solid mt-3 px-4 py-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-extrabold" style={{ color: 'var(--text)' }}>
            ⭐️ 必修フレーズの暗記
          </p>
          <p className="text-[12px] font-extrabold" style={{ color: 'var(--tsu-pink-600)' }}>
            {stats.essentialsDone} / {stats.essentialsTotal}
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--tsu-pink-100)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${(stats.essentialsDone / Math.max(1, stats.essentialsTotal)) * 100}%`,
              background: 'linear-gradient(90deg, var(--tsu-gold), var(--tsu-pink-500))',
            }}
          />
        </div>
      </section>

      {/* ----------------------------- プラン ----------------------------- */}
      <section className="mt-3">
        {isPremium ? (
          <div className="tsu-card-solid flex items-center gap-3 px-4 py-3.5">
            <span className="text-[20px]" aria-hidden>
              💗
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-extrabold" style={{ color: 'var(--text)' }}>
                13場面ぜんぶ解放ずみ
              </p>
              <p className="text-[11.5px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                ありがとう。最後まで一緒に練習できます。
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPaywall}
            className="tsu-btn w-full rounded-[22px] px-4 py-3.5 text-left text-white"
            style={{ background: 'linear-gradient(120deg, var(--tsu-pink-400), var(--tsu-pink-600))' }}
          >
            <span className="block text-[13.5px] font-extrabold">🔒 ロック中のシナリオを解放する</span>
            <span className="block text-[11.5px] font-semibold opacity-90">
              無料は3場面。残り10場面とフレーズが開きます
            </span>
          </button>
        )}
      </section>

      {/* --------------------------- クローゼット --------------------------- */}
      <section className="mt-5">
        <h2 className="mb-1 text-[13px] font-extrabold" style={{ color: 'var(--text-soft)' }}>
          クローゼット
        </h2>
        <p className="mb-2.5 text-[11.5px] font-semibold" style={{ color: 'var(--text-faint)' }}>
          親密度 Lv.{state.bond.level}・つぎまで あと {Math.max(0, progress.next - progress.current)}
        </p>

        <div className="tsu-scroll flex gap-2.5 overflow-x-auto pb-2">
          {OUTFIT_UNLOCKS.map((u) => {
            const unlocked = state.bond.unlockedOutfits.includes(u.outfit);
            const active = state.bond.currentOutfit === u.outfit;
            return (
              <button
                key={u.outfit}
                type="button"
                disabled={!unlocked}
                onClick={() => onChangeOutfit(u.outfit)}
                className="tsu-btn tsu-card-solid relative w-[112px] shrink-0 px-2 pb-2.5 pt-1 !rounded-3xl"
                style={{
                  borderColor: active ? 'var(--tsu-pink-400)' : 'var(--border)',
                  borderWidth: active ? 2 : 1,
                  opacity: unlocked ? 1 : 0.45,
                }}
              >
                <TsumugiCharacter
                  expression={active ? 'happy' : 'smile'}
                  outfit={u.outfit}
                  size={104}
                  reduceMotion
                />
                <span className="mt-0.5 block text-[11.5px] font-extrabold" style={{ color: 'var(--text)' }}>
                  {u.label}
                </span>
                {!unlocked && (
                  <span className="block text-[10px] font-bold" style={{ color: 'var(--text-faint)' }}>
                    🔒 Lv.{u.level}で解放
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ----------------------------- 設定 ----------------------------- */}
      <section className="mt-5">
        <h2 className="mb-2 text-[13px] font-extrabold" style={{ color: 'var(--text-soft)' }}>
          設定
        </h2>
        <div className="tsu-card-solid divide-y" style={{ borderColor: 'var(--border)' }}>
          {SETTING_ROWS.map((row) => (
            <label
              key={row.key}
              className="flex cursor-pointer items-center gap-3 px-4 py-3.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
                  {row.label}
                </span>
                <span className="block text-[11.5px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                  {row.hint}
                </span>
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={Boolean(state.settings[row.key])}
                onChange={(e) => {
                  updateSettings({ [row.key]: e.target.checked } as Partial<Settings>);
                }}
              />
              <span
                aria-hidden
                className="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200"
                style={{
                  background: state.settings[row.key] ? 'var(--tsu-pink-500)' : 'var(--tsu-pink-100)',
                }}
              >
                <span
                  className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] duration-200"
                  style={{ left: state.settings[row.key] ? 26 : 4 }}
                />
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* ---------------------------- AI接続状態 ---------------------------- */}
      <section className="tsu-card-solid mt-3 flex items-center gap-3 px-4 py-3.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: aiLive ? '#3FBF8F' : 'var(--tsu-gold)' }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-extrabold" style={{ color: 'var(--text)' }}>
            {aiLive === null ? '確認中…' : aiLive ? 'AI会話：接続ずみ' : 'AI会話：オフライン用の返事'}
          </p>
          <p className="text-[11.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-faint)' }}>
            {aiLive
              ? '紬が自由に返事をします。'
              : 'OPENAI_API_KEY を設定すると、紬が自由に返事をするようになります。設定しなくても練習はできます。'}
          </p>
        </div>
      </section>

      {/* ---------------------------- データ ---------------------------- */}
      <section className="mt-3 flex flex-col gap-2">
        <button type="button" onClick={download} className="tsu-btn tsu-btn-ghost w-full py-3 text-[13.5px]">
          学習データを書き出す
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 4000);
              return;
            }
            resetAll();
            window.location.reload();
          }}
          className="tsu-btn w-full py-3 text-[13.5px] font-extrabold"
          style={{
            background: confirmReset ? '#E5484D' : 'transparent',
            color: confirmReset ? '#fff' : 'var(--text-faint)',
          }}
        >
          {confirmReset ? 'ほんとうに消します（もう一度タップ）' : 'すべてのデータを削除'}
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="tsu-card-solid px-4 py-3">
      <p className="text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
        {label}
      </p>
      <p className="mt-0.5 text-[22px] font-extrabold leading-none" style={{ color: 'var(--text)' }}>
        {value}
        <span className="ml-1 text-[11.5px] font-bold" style={{ color: 'var(--text-faint)' }}>
          {unit}
        </span>
      </p>
    </div>
  );
}
