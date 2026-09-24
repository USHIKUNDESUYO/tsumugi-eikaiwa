'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FestivalScenarioId, Outfit } from '@/types';
import { touchStreak, setOutfit } from '@/lib/storage';
import { useAppState, useHydrated } from '@/lib/useAppState';
import { initPurchases } from '@/lib/purchases';
import { preloadArt } from '@/lib/tsumugiArt';
import { usePurchases } from '@/lib/usePurchases';
import { isScenarioUnlocked } from '@/lib/entitlements';
import { getDueCards } from '@/lib/srs';
import { getLevelUpLine } from '@/lib/tsumugiVoice';
import BottomNav, { type Screen } from '@/components/BottomNav';
import TsumugiCharacter from '@/components/tsumugi/TsumugiCharacter';
import TsumugiArt from '@/components/tsumugi/TsumugiArt';
import OnboardingScreen from '@/components/screens/OnboardingScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import ScenarioListScreen from '@/components/screens/ScenarioListScreen';
import ChatScreen from '@/components/screens/ChatScreen';
import PhrasebookScreen from '@/components/screens/PhrasebookScreen';
import ReviewScreen from '@/components/screens/ReviewScreen';
import ProgressScreen from '@/components/screens/ProgressScreen';
import PaywallScreen from '@/components/screens/PaywallScreen';

export interface LevelUpEvent {
  level: number;
  unlocked?: { outfit: Outfit; label: string };
}

export default function TsumugiApp() {
  const state = useAppState();
  const hydrated = useHydrated();
  const purchases = usePurchases();
  const isPremium = purchases.isPremium;

  const [screen, setScreen] = useState<Screen>('home');
  const [activeScenario, setActiveScenario] = useState<FestivalScenarioId | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpEvent | null>(null);
  /** 復習の出題は「画面を開いた時刻」で確定させる（開いている間に増減しない） */
  const [reviewOpenedAt, setReviewOpenedAt] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    touchStreak();
    void initPurchases();
    // 表情を切り替えた瞬間に読み込みが走ると一瞬消えるので、先に温めておく
    preloadArt();
  }, []);

  const dueCount = useMemo(() => getDueCards(state.mistakes).length, [state.mistakes]);

  const navigate = useCallback((next: Screen) => {
    if (next === 'review') setReviewOpenedAt(Date.now());
    setScreen(next);
  }, []);

  /** 未解放のシナリオを踏んだら、会話ではなくペイウォールを開く */
  const startScenario = useCallback(
    (id: FestivalScenarioId) => {
      if (isScenarioUnlocked(id, isPremium)) setActiveScenario(id);
      else setShowPaywall(true);
    },
    [isPremium]
  );

  /* --------------------------- 初回ロード中 --------------------------- */
  if (!hydrated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="anim-float">
          <TsumugiCharacter expression="smile" size={170} />
        </div>
        <p className="text-sm font-bold" style={{ color: 'var(--text-faint)' }}>
          よみこみちゅう…
        </p>
      </div>
    );
  }

  /* ---------------------------- オンボーディング ---------------------------- */
  if (!state.profile.onboarded) {
    return <OnboardingScreen />;
  }

  /* ----------------------------- ペイウォール ----------------------------- */
  if (showPaywall) {
    return <PaywallScreen state={state} onClose={() => setShowPaywall(false)} />;
  }

  /* ------------------------------ 会話中 ------------------------------ */
  if (activeScenario) {
    return (
      <ChatScreen
        scenarioId={activeScenario}
        state={state}
        onExit={() => setActiveScenario(null)}
        onLevelUp={setLevelUp}
      />
    );
  }

  /* ------------------------------ 通常画面 ----------------------------- */
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col">
      <main className="flex-1 pb-[calc(var(--nav-h)+var(--safe-bottom)+8px)]">
        {screen === 'home' && (
          <HomeScreen
            state={state}
            isPremium={isPremium}
            onStart={startScenario}
            onNavigate={navigate}
            onOpenPaywall={() => setShowPaywall(true)}
          />
        )}
        {screen === 'scenarios' && (
          <ScenarioListScreen state={state} isPremium={isPremium} onStart={startScenario} />
        )}
        {screen === 'phrases' && (
          <PhrasebookScreen
            state={state}
            isPremium={isPremium}
            onOpenPaywall={() => setShowPaywall(true)}
          />
        )}
        {screen === 'review' && <ReviewScreen key={reviewOpenedAt} state={state} now={reviewOpenedAt} />}
        {screen === 'progress' && (
          <ProgressScreen
            state={state}
            isPremium={isPremium}
            onChangeOutfit={setOutfit}
            onOpenPaywall={() => setShowPaywall(true)}
          />
        )}
      </main>

      <BottomNav current={screen} onChange={navigate} dueCount={dueCount} />

      {levelUp && (
        <LevelUpOverlay
          event={levelUp}
          outfit={state.bond.currentOutfit}
          reduceMotion={state.settings.reduceMotion}
          onClose={() => setLevelUp(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  レベルアップ演出                                                     */
/* ------------------------------------------------------------------ */

function LevelUpOverlay({
  event,
  outfit,
  reduceMotion,
  onClose,
}: {
  event: LevelUpEvent;
  outfit: Outfit;
  reduceMotion: boolean;
  onClose: () => void;
}) {
  const line = getLevelUpLine(event.level);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(40, 20, 34, 0.55)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="親密度アップ"
      onClick={onClose}
    >
      <div
        className="tsu-card-solid anim-levelup w-full max-w-sm overflow-hidden px-6 pb-6 pt-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[12px] font-extrabold tracking-[0.2em]" style={{ color: 'var(--tsu-pink-400)' }}>
          BOND LEVEL UP
        </p>
        <p className="mt-1 text-4xl font-extrabold" style={{ color: 'var(--tsu-pink-600)' }}>
          Lv.{event.level}
        </p>

        <div className="relative mx-auto mt-2 flex justify-center">
          <span
            className="anim-ring absolute inset-0 m-auto h-28 w-28 rounded-full"
            style={{ border: '3px solid var(--tsu-pink-300)' }}
          />
          <TsumugiArt
            expression={event.unlocked ? 'happy' : line.expression}
            outfit={event.unlocked?.outfit ?? outfit}
            size={190}
            reduceMotion={reduceMotion}
          />
        </div>

        <p className="mt-2 text-[15px] font-bold leading-relaxed" style={{ color: 'var(--text)' }}>
          「{line.text}」
        </p>

        {event.unlocked && (
          <p
            className="mt-3 rounded-2xl px-4 py-2 text-[13px] font-extrabold"
            style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
          >
            🎀 あたらしい衣装「{event.unlocked.label}」を解放！
          </p>
        )}

        <button type="button" onClick={onClose} className="tsu-btn tsu-btn-primary mt-5 w-full py-3.5 text-[15px]">
          うれしい
        </button>
      </div>
    </div>
  );
}
