'use client';

import { useMemo, useState } from 'react';
import type { AppState, Expression } from '@/types';
import { onCorrect, onWrong, masteryRatio, MAX_BOX } from '@/lib/srs';
import { updateMistake, deleteMistake, addBondPoints, gradeCard, retireCard } from '@/lib/storage';
import { buildReviewQueue, NEW_PHRASES_PER_DAY, type ReviewItem } from '@/lib/review';
import { festivalScenarios } from '@/lib/festivalScenarios';
import { fillName } from '@/lib/learnerName';
import { hasJapanese } from '@/lib/speechMatch';
import { getPraise, getEncouragement } from '@/lib/tsumugiVoice';
import { speakText, stopAllSpeech } from '@/lib/ttsVoice';
import { speakJa } from '@/lib/tsumugiSpeech';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import TsumugiArt from '@/components/tsumugi/TsumugiArt';
import SpeechBubble from '@/components/tsumugi/SpeechBubble';
import SayItPractice from '@/components/tsumugi/SayItPractice';

/** カード1枚ぶんの、問題・答え・補足 */
interface CardView {
  /** どの場面のフレーズか */
  context?: string;
  isNew?: boolean;
  promptLabel: string;
  prompt: string;
  /** 問題を取り消し線で出すか（自分の間違い） */
  strike: boolean;
  question: string;
  /** 正解の英語（「A / B」の言い換えを含むことがある） */
  answer: string;
  /** 答えの後に出す説明 */
  note?: string;
  /** 定着度 0..1 */
  mastery: number;
}

function viewOf(item: ReviewItem, displayName: string): CardView {
  if (item.kind === 'mistake') {
    // 日本語で「なんて言うの？」と聞いた記録は、間違いではないので取り消し線にしない
    const askedInJapanese = hasJapanese(item.record.said);
    return {
      promptLabel: askedInJapanese ? '言いたかったこと' : 'あなたが言ったのは',
      prompt: item.record.said,
      strike: !askedInJapanese,
      question: askedInJapanese ? '英語で言うと？' : '自然な言い方は？',
      answer: item.record.better,
      note: item.record.why,
      mastery: masteryRatio(item.record),
    };
  }
  const scenario = festivalScenarios[item.scenarioId];
  return {
    context: `${scenario.emoji} ${scenario.title}`,
    isNew: item.isNew,
    promptLabel: 'フェスのフレーズ',
    prompt: fillName(item.phrase.ja, displayName, 'ja'),
    strike: false,
    question: '英語で言うと？',
    answer: fillName(item.phrase.en, displayName, 'en'),
    note: item.phrase.note,
    mastery: Math.min(1, (item.progress?.box ?? 0) / MAX_BOX),
  };
}

export default function ReviewScreen({ state, now }: { state: AppState; now: number }) {
  // 出題リストは画面を開いた時点で確定させる（解答中に増減させない）
  const [queue, setQueue] = useState<ReviewItem[]>(() => buildReviewQueue(state, now || Date.now()));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  /** 答えてから次のカードに移るまで。ボタンの二度押しで二重に記録しない */
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(0);
  const [expression, setExpression] = useState<Expression>('smile');
  const [line, setLine] = useState('さ、ひとつずつ思い出してみよう。');

  const item = queue[index];
  const view = item ? viewOf(item, state.profile.displayName) : null;
  const remaining = queue.length - index;

  const totalMastered = useMemo(
    () =>
      state.mistakes.filter((m) => (m.box ?? 0) >= MAX_BOX).length +
      Object.values(state.cards).filter((c) => !c.retired && c.box >= MAX_BOX).length,
    [state.mistakes, state.cards]
  );

  const answer = (correct: boolean, nextDelay = 900) => {
    if (!item || answered) return;
    setAnswered(true);
    if (item.kind === 'mistake') {
      updateMistake(item.record.id, correct ? onCorrect(item.record) : onWrong(item.record));
    } else {
      gradeCard(item.key, correct);
    }
    if (correct) {
      playSfx('correct');
      haptic('medium');
      addBondPoints(2);
      const praise = getPraise(state.bond.level);
      setExpression('cheer');
      setLine(praise.text);
      if (state.settings.jaVoice) speakJa(praise.id);
    } else {
      playSfx('soft');
      const enc = getEncouragement();
      setExpression(enc.expression);
      setLine(enc.text);
      if (state.settings.jaVoice) speakJa(enc.id);
    }
    setDone((d) => d + 1);

    setTimeout(() => {
      setRevealed(false);
      setAnswered(false);
      setIndex((i) => i + 1);
      setExpression('smile');
    }, nextDelay);
  };

  const retire = () => {
    if (!item || answered) return;
    if (item.kind === 'mistake') deleteMistake(item.record.id);
    else retireCard(item.key);
    setQueue((q) => q.filter((c) => c.key !== item.key));
    setRevealed(false);
  };

  /* ------------------------------ 空っぽ ------------------------------ */
  if (!item || !view) {
    return (
      <EmptyState
        outfit={state.bond.currentOutfit}
        reduceMotion={state.settings.reduceMotion}
        title={done > 0 ? `${done}枚、おつかれさま！` : '今は復習するカードがないよ'}
        body={
          done > 0
            ? 'つぎの出題タイミングまで、ちょっと寝かせるね。\n間隔をあけたほうが、ちゃんと残るから。'
            : `新しいフレーズは、1日${NEW_PHRASES_PER_DAY}枚ずつ出てくるよ。\n覚えきったカード ${totalMastered} 枚。`
        }
        expression={done > 0 ? 'happy' : 'smile'}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 safe-top">
      <header className="flex items-center justify-between pt-5">
        <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--text)' }}>
          復習
        </h1>
        <span
          className="rounded-full px-3 py-1.5 text-[12px] font-extrabold"
          style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
        >
          のこり {remaining}
        </span>
      </header>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--tsu-pink-100)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${(index / Math.max(1, queue.length)) * 100}%`,
            background: 'linear-gradient(90deg, var(--tsu-pink-300), var(--tsu-pink-600))',
          }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
        <TsumugiArt
          expression={expression}
          outfit={state.bond.currentOutfit}
          size={150}
          reduceMotion={state.settings.reduceMotion}
          effects={state.settings.sfxEnabled}
        />
        <SpeechBubble key={line} text={line} speed={26} className="max-w-[320px] text-center" />

        {/* 問題カード */}
        <div className="tsu-card-solid w-full px-5 py-5">
          {view.context && (
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
              <span>{view.context}</span>
              {view.isNew && (
                <span
                  className="rounded-full px-1.5 py-[1px] text-[9.5px] text-white"
                  style={{ background: 'var(--tsu-pink-500)' }}
                >
                  NEW
                </span>
              )}
            </p>
          )}
          <p className="text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
            {view.promptLabel}
          </p>
          <p
            className={`mt-1 text-[17px] font-extrabold leading-snug ${view.strike ? 'line-through decoration-2' : ''}`}
            style={{ color: view.strike ? 'var(--text-soft)' : 'var(--text)' }}
          >
            {view.prompt}
          </p>

          <div className="my-3.5 flex items-center gap-2">
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
              {view.question}
            </span>
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>

          {revealed ? (
            <div className="anim-pop">
              <button
                type="button"
                onClick={() => {
                  stopAllSpeech();
                  speakText(view.answer);
                }}
                className="tsu-btn w-full text-left"
              >
                <p className="text-[19px] font-extrabold leading-snug" style={{ color: 'var(--tsu-pink-600)' }}>
                  {view.answer} <span className="text-[15px]">🔊</span>
                </p>
              </button>
              {view.note && (
                <p className="mt-2 text-[12.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  {view.note}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* 答えを見る前に、自分の口で言ってみる（思い出す練習がいちばん残る） */}
              <p className="text-[11.5px] font-bold" style={{ color: 'var(--text-faint)' }}>
                声に出して言ってみて（打ってもOK）
              </p>
              <SayItPractice
                key={item.key}
                target={view.answer}
                hideAnswer
                onPass={() => {
                  setRevealed(true);
                  answer(true, 1600);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  playSfx('tap');
                  setRevealed(true);
                }}
                className="tsu-btn tsu-btn-ghost mt-3 w-full py-3.5 text-[14px]"
              >
                答えを見る
              </button>
            </>
          )}

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10.5px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
              定着度
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--tsu-pink-100)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${view.mastery * 100}%`,
                  background: 'linear-gradient(90deg, var(--tsu-mint), var(--tsu-pink-500))',
                }}
              />
            </div>
          </div>
        </div>

        {revealed && !answered && (
          <div className="anim-up flex w-full gap-2.5">
            <button
              type="button"
              onClick={() => answer(false)}
              className="tsu-btn tsu-btn-ghost flex-1 py-3.5 text-[14px]"
            >
              まだあやしい
            </button>
            <button
              type="button"
              onClick={() => answer(true)}
              className="tsu-btn tsu-btn-primary flex-1 py-3.5 text-[14px]"
            >
              言えた！
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={retire}
          className="tsu-btn pb-4 text-[11.5px] font-bold underline"
          style={{ color: 'var(--text-faint)' }}
        >
          このカードはもういらない
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  expression,
  outfit,
  reduceMotion,
}: {
  title: string;
  body: string;
  expression: Expression;
  outfit: AppState['bond']['currentOutfit'];
  reduceMotion: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center safe-top">
      <div className="anim-float">
        <TsumugiArt expression={expression} outfit={outfit} size={200} reduceMotion={reduceMotion} />
      </div>
      <h2 className="text-[19px] font-extrabold" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      <p className="whitespace-pre-line text-[13px] font-semibold leading-relaxed" style={{ color: 'var(--text-soft)' }}>
        {body}
      </p>
    </div>
  );
}
