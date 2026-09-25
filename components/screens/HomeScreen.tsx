'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AppState, Expression, FestivalScenarioId } from '@/types';
import {
  FESTIVAL_INFO,
  festivalScenarios,
  festivalScenarioOrder,
  getCountdown,
  getEssentialPhrases,
} from '@/lib/festivalScenarios';
import { getGreeting } from '@/lib/tsumugiVoice';
import { buildReviewQueue } from '@/lib/review';
import { ANSWER_QUESTIONS } from '@/lib/answerQuestions';
import { speakText, stopAllSpeech } from '@/lib/ttsVoice';
import { fillName } from '@/lib/learnerName';
import { speakJa } from '@/lib/tsumugiSpeech';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import TsumugiArt from '@/components/tsumugi/TsumugiArt';
import SpeechBubble from '@/components/tsumugi/SpeechBubble';
import BondMeter from '@/components/tsumugi/BondMeter';
import HeartBurst from '@/components/tsumugi/HeartBurst';
import type { Screen } from '@/components/BottomNav';

interface Props {
  state: AppState;
  onStart: (id: FestivalScenarioId) => void;
  onNavigate: (s: Screen) => void;
  /** フレーズ帳の「自分の答え」を開く */
  onOpenMyAnswers: () => void;
}

export default function HomeScreen({ state, onStart, onNavigate, onOpenMyAnswers }: Props) {
  // 挨拶はマウント時に一度だけ決める（毎レンダリングで変わると落ち着かない）
  const [greeting] = useState(() => getGreeting(state.bond.level));
  const [countdown, setCountdown] = useState(() => getCountdown());
  const [pats, setPats] = useState(0);
  // 開いた直後は手を振って迎える。少ししたら挨拶の表情に落ち着く。
  const [expression, setExpression] = useState<Expression>('wave');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown()), 30_000);
    return () => clearInterval(t);
  }, []);

  // 手を振り終えたところで、挨拶のひとことを声に出す
  useEffect(() => {
    const t = setTimeout(() => {
      setExpression(greeting.expression);
      if (state.settings.jaVoice) speakJa(greeting.id);
    }, 2200);
    return () => clearTimeout(t);
  }, [greeting.expression, greeting.id, state.settings.jaVoice]);

  const dueCount = buildReviewQueue(state).length;
  const answersDone = ANSWER_QUESTIONS.filter((q) => state.myAnswers[q.id]?.en).length;
  const cleared = state.clearedScenarios.length;
  const total = festivalScenarioOrder.length;

  /** 今日のおすすめ = まだクリアしていない最初のシナリオ */
  const recommended = useMemo(() => {
    const next = festivalScenarioOrder.find((id) => !state.clearedScenarios.includes(id));
    return festivalScenarios[next ?? festivalScenarioOrder[0]];
  }, [state.clearedScenarios]);

  /** 今日のひとこと（日替わりで固定） */
  const [phraseOfDay] = useState(() => {
    const all = getEssentialPhrases();
    const day = Math.floor(Date.now() / 86_400_000);
    return all[day % all.length];
  });
  const phraseEn = fillName(phraseOfDay.en, state.profile.displayName, 'en');
  const phraseJa = fillName(phraseOfDay.ja, state.profile.displayName, 'ja');

  /** なでるほど照れが深くなる: 照れる → 顔を隠す → 甘える */
  const PAT_REACTIONS: Expression[] = ['shy', 'hide', 'love'];
  const pat = () => {
    playSfx('pop');
    haptic('light');
    setPats((p) => p + 1);
    setExpression(PAT_REACTIONS[pats % PAT_REACTIONS.length]);
    setTimeout(() => setExpression('smile'), 1900);
  };

  const speak = (text: string) => {
    stopAllSpeech();
    setSpeaking(true);
    speakText(text, { onEnd: () => setSpeaking(false), onError: () => setSpeaking(false) });
  };

  return (
    <div className="px-5 safe-top">
      {/* --------------------------- カウントダウン --------------------------- */}
      <header className="pt-4">
        <div
          className="relative overflow-hidden rounded-[28px] px-5 py-4 text-white"
          style={{
            background: 'linear-gradient(120deg, #FF7FA9 0%, #EE3D75 48%, #A78BFA 100%)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="anim-shimmer pointer-events-none absolute inset-0" aria-hidden />
          <p className="text-[10.5px] font-extrabold tracking-[0.22em] opacity-90">
            {FESTIVAL_INFO.shortName} 2026
          </p>

          {countdown.status === 'upcoming' ? (
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-[13px] font-bold opacity-90">本番まで</span>
              <span className="text-[38px] font-extrabold leading-none">{countdown.days}</span>
              <span className="text-[15px] font-extrabold">日</span>
              <span className="text-[12px] font-bold opacity-85">
                {countdown.hours}時間{countdown.minutes}分
              </span>
            </p>
          ) : countdown.status === 'live' ? (
            <p className="mt-1 text-[26px] font-extrabold leading-tight">いま、開催中！🔥</p>
          ) : (
            <p className="mt-1 text-[22px] font-extrabold leading-tight">おつかれさま🌅</p>
          )}

          <p className="mt-1 text-[11.5px] font-semibold opacity-90">
            10/2（金）〜10/4（日）・INN THE PARK 福岡
          </p>
        </div>
      </header>

      {/* ----------------------------- 紬 ----------------------------- */}
      <section className="relative mt-3 flex flex-col items-center">
        <HeartBurst trigger={pats} enabled={state.settings.sfxEnabled} />
        <button
          type="button"
          onClick={pat}
          aria-label="紬をなでる"
          className="tsu-btn !rounded-full"
        >
          <TsumugiArt
            expression={expression}
            outfit={state.bond.currentOutfit}
            speaking={speaking}
            size={238}
            reduceMotion={state.settings.reduceMotion}
            effects={state.settings.sfxEnabled}
          />
        </button>

        <SpeechBubble text={greeting.text} className="-mt-1 w-full max-w-[330px]" />

        <div className="tsu-card mt-4 flex w-full items-center gap-4 px-4 py-3">
          <div className="flex-1">
            <BondMeter bond={state.bond} />
          </div>
          <div className="text-center">
            <p className="text-[19px] font-extrabold leading-none" style={{ color: 'var(--tsu-pink-600)' }}>
              🔥{state.streak.current}
            </p>
            <p className="mt-0.5 text-[10px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
              連続日数
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------- 今日のおすすめ --------------------------- */}
      <section className="mt-5">
        <h2 className="mb-2 text-[13px] font-extrabold" style={{ color: 'var(--text-soft)' }}>
          今日やるならこれ
        </h2>
        <button
          type="button"
          onClick={() => onStart(recommended.id)}
          className="tsu-btn tsu-card-solid flex w-full items-center gap-3.5 px-4 py-4 text-left !rounded-[26px]"
        >
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[27px]"
            style={{ background: 'var(--tsu-pink-100)' }}
            aria-hidden
          >
            {recommended.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15.5px] font-extrabold" style={{ color: 'var(--text)' }}>
              {recommended.title}
            </span>
            <span
              className="mt-0.5 block truncate text-[12px] font-semibold"
              style={{ color: 'var(--text-faint)' }}
            >
              {recommended.tagline}
            </span>
          </span>
          <span
            className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg, var(--tsu-pink-400), var(--tsu-pink-600))' }}
          >
            はなす
          </span>
        </button>
      </section>

      {/* ----------------------------- 進捗 ----------------------------- */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('scenarios')}
          className="tsu-btn tsu-card-solid px-4 py-3.5 text-left !rounded-[22px]"
        >
          <p className="text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
            シナリオ
          </p>
          <p className="mt-0.5 text-[22px] font-extrabold leading-none" style={{ color: 'var(--text)' }}>
            {cleared}
            <span className="text-[13px] font-bold" style={{ color: 'var(--text-faint)' }}>
              {' '}
              / {total}
            </span>
          </p>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--tsu-pink-100)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(cleared / total) * 100}%`,
                background: 'linear-gradient(90deg, var(--tsu-pink-300), var(--tsu-pink-600))',
              }}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('review')}
          className="tsu-btn tsu-card-solid px-4 py-3.5 text-left !rounded-[22px]"
        >
          <p className="text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
            復習まちのカード
          </p>
          <p className="mt-0.5 text-[22px] font-extrabold leading-none" style={{ color: 'var(--text)' }}>
            {dueCount}
            <span className="text-[13px] font-bold" style={{ color: 'var(--text-faint)' }}>
              {' '}
              枚
            </span>
          </p>
          <p className="mt-2 text-[11px] font-bold" style={{ color: dueCount ? 'var(--tsu-pink-600)' : 'var(--text-faint)' }}>
            {dueCount ? 'いまがちょうどいい時間' : 'ぜんぶ終わってるよ'}
          </p>
        </button>
      </section>

      {/* ------------------------- 自分の答えノート ------------------------- */}
      <section className="mt-4">
        <button
          type="button"
          onClick={onOpenMyAnswers}
          className="tsu-btn tsu-card-solid flex w-full items-center gap-3.5 px-4 py-3.5 text-left !rounded-[22px]"
        >
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[24px]"
            style={{ background: 'var(--tsu-lav-100)' }}
            aria-hidden
          >
            📝
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>
              自分の答えノート
            </span>
            <span className="mt-0.5 block text-[12px] font-semibold" style={{ color: 'var(--text-faint)' }}>
              フェスで必ず聞かれる10の質問・できた {answersDone} / {ANSWER_QUESTIONS.length}
            </span>
          </span>
          <span className="shrink-0 text-[18px] font-extrabold" style={{ color: 'var(--text-faint)' }} aria-hidden>
            ›
          </span>
        </button>
      </section>

      {/* --------------------------- 今日のひとこと --------------------------- */}
      <section className="mt-4 mb-6">
        <h2 className="mb-2 text-[13px] font-extrabold" style={{ color: 'var(--text-soft)' }}>
          今日のひとこと
        </h2>
        <div className="tsu-card-solid px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-extrabold leading-snug" style={{ color: 'var(--text)' }}>
                {phraseEn}
              </p>
              <p className="mt-1 text-[12.5px] font-semibold" style={{ color: 'var(--text-soft)' }}>
                {phraseJa}
              </p>
              {phraseOfDay.note && (
                <p className="mt-1.5 text-[11.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                  {phraseOfDay.note}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => speak(phraseEn)}
              aria-label="発音を聞く"
              className="tsu-btn grid h-11 w-11 shrink-0 place-items-center text-[18px]"
              style={{ background: 'var(--tsu-pink-100)' }}
            >
              🔊
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
