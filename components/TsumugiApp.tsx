'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FestivalScenarioId, Outfit } from '@/types';
import { touchStreak, setOutfit } from '@/lib/storage';
import { useAppState, useHydrated } from '@/lib/useAppState';
import { preloadArt } from '@/lib/tsumugiArt';
import { unlockVoice, speakJa, stopVoice } from '@/lib/tsumugiSpeech';
import { unlockSfx, setSfxEnabled, playSfx } from '@/lib/sfx';
import { setHapticsEnabled, hapticCelebrate, haptic } from '@/lib/haptics';
import { setBgmEnabled, playBgm } from '@/lib/bgm';
import { sceneIsNight } from '@/lib/scenes';
import { buildReviewQueue } from '@/lib/review';
import { getLevelUpLine } from '@/lib/tsumugiVoice';
import BottomNav, { type Screen } from '@/components/BottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import TsumugiCharacter from '@/components/tsumugi/TsumugiCharacter';
import TsumugiArt from '@/components/tsumugi/TsumugiArt';
import OnboardingScreen from '@/components/screens/OnboardingScreen';
import HomeScreen from '@/components/screens/HomeScreen';
import ScenarioListScreen from '@/components/screens/ScenarioListScreen';
import ChatScreen from '@/components/screens/ChatScreen';
import PhrasebookScreen, { type PhraseTab } from '@/components/screens/PhrasebookScreen';
import ReviewScreen from '@/components/screens/ReviewScreen';
import ProgressScreen from '@/components/screens/ProgressScreen';

export interface LevelUpEvent {
  level: number;
  unlocked?: { outfit: Outfit; label: string };
}

export default function TsumugiApp() {
  const state = useAppState();
  const hydrated = useHydrated();

  const [screen, setScreen] = useState<Screen>('home');
  const [activeScenario, setActiveScenario] = useState<FestivalScenarioId | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpEvent | null>(null);
  /** 復習の出題は「画面を開いた時刻」で確定させる（開いている間に増減しない） */
  const [reviewOpenedAt, setReviewOpenedAt] = useState(0);
  const [phraseTab, setPhraseTab] = useState<PhraseTab>('scenes');

  useEffect(() => {
    touchStreak();
    // ブラウザは最初のユーザー操作より前に音を鳴らせない。一度だけ解禁しておく。
    const unlock = () => {
      unlockVoice();
      unlockSfx();
      // 自動再生の制限があるので、BGMも最初のタップで鳴らし始める
      playBgm('day');
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // 着ている衣装のイラストを先に温めておく（着替えたら新しいぶんを読む）
  useEffect(() => {
    preloadArt(state.bond.currentOutfit);
  }, [state.bond.currentOutfit]);

  // 効果音と振動は React の外で鳴るので、設定を単純に流し込む
  useEffect(() => {
    setSfxEnabled(state.settings.soundEffects);
    setHapticsEnabled(state.settings.haptics);
    setBgmEnabled(state.settings.bgm);
  }, [state.settings.soundEffects, state.settings.haptics, state.settings.bgm]);

  // 夜の場面に入ったら落ち着いたトラックへ。抜けたら戻す。
  useEffect(() => {
    playBgm(activeScenario && sceneIsNight(activeScenario) ? 'night' : 'day');
  }, [activeScenario]);

  // 復習の出題数（会話で直された文＋フェスのフレーズ）。バッジの数と画面の中身を揃える
  const dueCount = useMemo(() => buildReviewQueue(state).length, [state]);

  const navigate = useCallback((next: Screen) => {
    playSfx('tap');
    haptic('light');
    if (next === 'review') setReviewOpenedAt(Date.now());
    setScreen(next);
    // 画面は差し替えてもページのスクロール位置は残るので、ホームの下のほうから開くと
    // 次の画面が途中から始まっていた（見出しやタブが見えない）。画面を変えたら先頭へ。
    window.scrollTo({ top: 0 });
  }, []);

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
      <main
        key={screen}
        className={`flex-1 pb-[calc(var(--nav-h)+var(--safe-bottom)+8px)] ${
          state.settings.reduceMotion ? '' : 'anim-screen'
        }`}
      >
        {screen === 'home' && (
          <HomeScreen
            state={state}
            onStart={setActiveScenario}
            onNavigate={navigate}
            onOpenMyAnswers={() => {
              setPhraseTab('mine');
              navigate('phrases');
            }}
          />
        )}
        {screen === 'scenarios' && <ScenarioListScreen state={state} onStart={setActiveScenario} />}
        {screen === 'phrases' && <PhrasebookScreen state={state} tab={phraseTab} onTabChange={setPhraseTab} />}
        {screen === 'review' && <ReviewScreen key={reviewOpenedAt} state={state} now={reviewOpenedAt} />}
        {screen === 'progress' && (
          <ProgressScreen
            state={state}
            onChangeOutfit={(o) => {
              playSfx('unlock');
              haptic('light');
              setOutfit(o);
            }}
          />
        )}
      </main>

      <BottomNav current={screen} onChange={navigate} dueCount={dueCount} />
      {/* ナビの真上に出すバナーなので、ナビのある画面でだけ出す */}
      <InstallPrompt />

      {levelUp && (
        <LevelUpOverlay
          event={levelUp}
          outfit={state.bond.currentOutfit}
          reduceMotion={state.settings.reduceMotion}
          jaVoice={state.settings.jaVoice}
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
  jaVoice,
  onClose,
}: {
  event: LevelUpEvent;
  outfit: Outfit;
  reduceMotion: boolean;
  jaVoice: boolean;
  onClose: () => void;
}) {
  const [line] = useState(() => getLevelUpLine(event.level));

  useEffect(() => {
    playSfx('levelup');
    hapticCelebrate();
    if (jaVoice) speakJa(line.id);
    return () => stopVoice();
  }, [jaVoice, line.id]);

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
            expression={event.unlocked ? 'cheer' : line.expression}
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
