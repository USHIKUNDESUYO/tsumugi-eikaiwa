'use client';

import { useState } from 'react';
import type { AppState } from '@/types';
import { festivalScenarioOrder, festivalScenarios, getEssentialPhrases } from '@/lib/festivalScenarios';
import { FREE_SCENARIOS, LOCKED_SCENARIO_COUNT, isScenarioFree, lockedPhraseCount } from '@/lib/entitlements';
import { usePurchases } from '@/lib/usePurchases';
import { purchase, restore, clearPurchaseError, type SimplePackage } from '@/lib/purchases';
import TsumugiArt from '@/components/tsumugi/TsumugiArt';
import SpeechBubble from '@/components/tsumugi/SpeechBubble';

const KIND_LABEL: Record<SimplePackage['kind'], string> = {
  lifetime: '買い切り',
  annual: '年額',
  monthly: '月額',
  other: '',
};

export default function PaywallScreen({
  state,
  onClose,
}: {
  state: AppState;
  onClose: () => void;
}) {
  const p = usePurchases();
  const [selected, setSelected] = useState<string | null>(null);

  const lockedPhrases = lockedPhraseCount();
  const lockedEssentials = getEssentialPhrases().filter((x) => !isScenarioFree(x.scenarioId)).length;
  const lockedScenarios = festivalScenarioOrder.filter((id) => !isScenarioFree(id));

  const current = selected ?? p.packages[0]?.identifier ?? null;

  const buy = async () => {
    if (!current) return;
    const ok = await purchase(current);
    if (ok) onClose();
  };

  const doRestore = async () => {
    const ok = await restore();
    if (ok) onClose();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 safe-top">
      <header className="flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="tsu-btn grid h-10 w-10 place-items-center text-[17px]"
          style={{ background: 'var(--tsu-pink-100)' }}
        >
          ←
        </button>
        <button
          type="button"
          onClick={doRestore}
          disabled={p.busy || !p.available}
          className="tsu-btn px-3 py-1.5 text-[11.5px] font-extrabold"
          style={{ color: 'var(--text-faint)' }}
        >
          購入を復元
        </button>
      </header>

      <div className="flex flex-col items-center pt-1">
        <TsumugiArt
          expression="plead"
          outfit={state.bond.currentOutfit}
          size={190}
          reduceMotion={state.settings.reduceMotion}
        />
        <SpeechBubble
          text="あのね。…もっと、いろんな場面で一緒に練習したい。"
          className="w-full max-w-[330px] text-center"
        />
      </div>

      <h1 className="mt-5 text-center text-[22px] font-extrabold leading-snug" style={{ color: 'var(--text)' }}>
        13場面ぜんぶ、
        <br />
        紬と練習する
      </h1>

      {/* --------------------------- もらえるもの --------------------------- */}
      <ul className="mt-4 flex flex-col gap-2">
        <Benefit
          emoji="🎪"
          title={`シナリオが ${LOCKED_SCENARIO_COUNT} 個ふえる`}
          body="焚き火の夜、サウナ、音楽の話、連絡先交換、福岡案内…フェスの本番で効く場面が全部開きます。"
        />
        <Benefit
          emoji="📖"
          title={`実用フレーズ ${lockedPhrases} 個（うち必修 ${lockedEssentials} 個）`}
          body="日本語訳と「いつ使うか」の解説つき。音声再生と暗記チェックもできます。"
        />
        <Benefit
          emoji="💗"
          title="紬との時間が続く"
          body="無料の3場面だけだと、すぐ話すことがなくなります。13場面あれば毎日ちがう練習ができて、親密度も自然に上がっていきます。"
        />
      </ul>

      {/* ---------------------------- 開くシナリオ ---------------------------- */}
      <div className="tsu-scroll mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {lockedScenarios.map((id) => (
          <span
            key={id}
            className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold"
            style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
          >
            {festivalScenarios[id].emoji} {festivalScenarios[id].title}
          </span>
        ))}
      </div>

      {/* ------------------------------ 価格 ------------------------------ */}
      <div className="mt-5 flex flex-col gap-2">
        {p.packages.map((pkg) => {
          const active = current === pkg.identifier;
          return (
            <button
              key={pkg.identifier}
              type="button"
              onClick={() => setSelected(pkg.identifier)}
              className="tsu-btn tsu-card-solid flex items-center gap-3 px-4 py-3.5 text-left !rounded-[22px]"
              style={{
                borderColor: active ? 'var(--tsu-pink-400)' : 'var(--border)',
                borderWidth: active ? 2 : 1,
              }}
            >
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] text-white"
                style={{ background: active ? 'var(--tsu-pink-500)' : 'var(--tsu-pink-100)' }}
                aria-hidden
              >
                {active ? '✓' : ''}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-extrabold" style={{ color: 'var(--text)' }}>
                  {KIND_LABEL[pkg.kind] || pkg.title}
                </span>
                <span className="block truncate text-[11.5px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                  {pkg.title}
                </span>
              </span>
              <span className="shrink-0 text-[17px] font-extrabold" style={{ color: 'var(--tsu-pink-600)' }}>
                {pkg.priceString}
              </span>
            </button>
          );
        })}
      </div>

      {p.error && (
        <p
          className="mt-3 rounded-2xl px-4 py-2.5 text-[12px] font-bold"
          style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
          role="alert"
          onClick={clearPurchaseError}
        >
          {p.error}
        </p>
      )}

      <div className="mt-auto pb-6 pt-5">
        {p.available ? (
          <button
            type="button"
            onClick={buy}
            disabled={p.busy || !current}
            className="tsu-btn tsu-btn-primary w-full py-4 text-[16px]"
          >
            {p.busy ? '処理中…' : 'ぜんぶ解放する'}
          </button>
        ) : (
          <div
            className="rounded-[22px] px-4 py-3.5 text-center text-[12.5px] font-bold leading-relaxed"
            style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
          >
            {p.status === 'loading'
              ? '商品を読み込んでいます…'
              : 'この画面はアプリ版（Google Play）で購入できます。ブラウザ版では無料の3シナリオをお使いください。'}
          </div>
        )}

        <p className="mt-3 text-center text-[10.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-faint)' }}>
          無料でも「{FREE_SCENARIOS.map((id) => festivalScenarios[id].title).join('」「')}」は
          ずっと遊べます。
          <br />
          購入は Google Play アカウントに請求されます。
        </p>
      </div>
    </div>
  );
}

function Benefit({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <li className="tsu-card-solid flex gap-3 px-4 py-3">
      <span className="text-[20px] leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
          {title}
        </span>
        <span className="mt-0.5 block text-[11.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-faint)' }}>
          {body}
        </span>
      </span>
    </li>
  );
}
