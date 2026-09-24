'use client';

import { useMemo, useState } from 'react';
import type { AppState, Expression, MistakeRecord } from '@/types';
import { getDueCards, onCorrect, onWrong, masteryRatio, MAX_BOX } from '@/lib/srs';
import { updateMistake, deleteMistake, addBondPoints } from '@/lib/storage';
import { getPraise, getEncouragement } from '@/lib/tsumugiVoice';
import { speakText, stopAllSpeech } from '@/lib/ttsVoice';
import TsumugiCharacter from '@/components/tsumugi/TsumugiCharacter';
import SpeechBubble from '@/components/tsumugi/SpeechBubble';

export default function ReviewScreen({ state, now }: { state: AppState; now: number }) {
  // 出題リストは画面を開いた時点で確定させる（解答中に増減させない）
  const [queue, setQueue] = useState<MistakeRecord[]>(() => getDueCards(state.mistakes, now || Date.now()));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [expression, setExpression] = useState<Expression>('smile');
  const [line, setLine] = useState('さ、ひとつずつ思い出してみよう。');

  const card = queue[index];
  const remaining = queue.length - index;

  const totalMastered = useMemo(
    () => state.mistakes.filter((m) => (m.box ?? 0) >= MAX_BOX).length,
    [state.mistakes]
  );

  const answer = (correct: boolean) => {
    if (!card) return;
    updateMistake(card.id, correct ? onCorrect(card) : onWrong(card));
    if (correct) {
      addBondPoints(2);
      const praise = getPraise(state.bond.level);
      setExpression(praise.expression);
      setLine(praise.text);
    } else {
      const enc = getEncouragement();
      setExpression(enc.expression);
      setLine(enc.text);
    }
    setDone((d) => d + 1);

    setTimeout(() => {
      setRevealed(false);
      setIndex((i) => i + 1);
      setExpression('smile');
    }, 900);
  };

  /* ------------------------------ 空っぽ ------------------------------ */
  if (state.mistakes.length === 0) {
    return (
      <EmptyState
        outfit={state.bond.currentOutfit}
        title="まだカードがありません"
        body={'会話の中で直してもらった表現が、\nここに自動でたまります。\nまずは1回、紬と話してみて。'}
        expression="smile"
      />
    );
  }

  if (!card) {
    return (
      <EmptyState
        outfit={state.bond.currentOutfit}
        title={done > 0 ? `${done}枚、おつかれさま！` : '今は復習するカードがないよ'}
        body={
          done > 0
            ? 'つぎの出題タイミングまで、ちょっと寝かせるね。\n間隔をあけたほうが、ちゃんと残るから。'
            : `覚えきったカード ${totalMastered} 枚。\nまた時間がたったら出てくるよ。`
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
        <TsumugiCharacter
          expression={expression}
          outfit={state.bond.currentOutfit}
          size={150}
          reduceMotion={state.settings.reduceMotion}
        />
        <SpeechBubble key={line} text={line} speed={26} className="max-w-[320px] text-center" />

        {/* 問題カード */}
        <div className="tsu-card-solid w-full px-5 py-5">
          <p className="text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
            あなたが言ったのは
          </p>
          <p className="mt-1 text-[17px] font-extrabold leading-snug line-through decoration-2" style={{ color: 'var(--text-soft)' }}>
            {card.said}
          </p>

          <div className="my-3.5 flex items-center gap-2">
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
              自然な言い方は？
            </span>
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>

          {revealed ? (
            <div className="anim-pop">
              <button
                type="button"
                onClick={() => {
                  stopAllSpeech();
                  speakText(card.better);
                }}
                className="tsu-btn w-full text-left"
              >
                <p className="text-[19px] font-extrabold leading-snug" style={{ color: 'var(--tsu-pink-600)' }}>
                  {card.better} <span className="text-[15px]">🔊</span>
                </p>
              </button>
              <p className="mt-2 text-[12.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                {card.why}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="tsu-btn tsu-btn-ghost w-full py-3.5 text-[14px]"
            >
              答えを見る
            </button>
          )}

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10.5px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
              定着度
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--tsu-pink-100)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${masteryRatio(card) * 100}%`,
                  background: 'linear-gradient(90deg, var(--tsu-mint), var(--tsu-pink-500))',
                }}
              />
            </div>
          </div>
        </div>

        {revealed && (
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
          onClick={() => {
            deleteMistake(card.id);
            setQueue((q) => q.filter((c) => c.id !== card.id));
          }}
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
}: {
  title: string;
  body: string;
  expression: Expression;
  outfit: AppState['bond']['currentOutfit'];
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center safe-top">
      <div className="anim-float">
        <TsumugiCharacter expression={expression} outfit={outfit} size={200} />
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
