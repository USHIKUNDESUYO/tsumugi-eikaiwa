'use client';

import { useState } from 'react';
import type { AppState, MyAnswer } from '@/types';
import { ANSWER_QUESTIONS, type AnswerQuestion } from '@/lib/answerQuestions';
import { coachAnswer, type CoachedAnswer } from '@/lib/myAnswers';
import { saveMyAnswer, addBondPoints } from '@/lib/storage';
import { getPraise } from '@/lib/tsumugiVoice';
import { speakText, stopAllSpeech } from '@/lib/ttsVoice';
import { speakJa } from '@/lib/tsumugiSpeech';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import SayItPractice from '@/components/tsumugi/SayItPractice';

/**
 * 自分の答えノート。フェスで必ず聞かれる質問に、自分の答えを英語で用意しておく。
 * 下書きは日本語でも英語でもよく、紬が口に出して言える英語にする。
 */
export default function MyAnswersPanel({ state }: { state: AppState }) {
  const done = ANSWER_QUESTIONS.filter((q) => state.myAnswers[q.id]?.en).length;

  return (
    <div className="px-5 pb-6">
      <p className="mt-3 text-[12.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-soft)' }}>
        初めて会った人に、必ず聞かれる10の質問。
        <br />
        自分の答えを紬と一緒に英語にして、口ぐせにしておこう。
      </p>
      <p className="mt-2 text-[12px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
        できた {done} / {ANSWER_QUESTIONS.length}
      </p>

      <ul className="mt-2.5 flex flex-col gap-2.5">
        {ANSWER_QUESTIONS.map((q, i) => (
          <AnswerCard key={q.id} question={q} saved={state.myAnswers[q.id]} state={state} index={i} />
        ))}
      </ul>
    </div>
  );
}

function AnswerCard({
  question,
  saved,
  state,
  index,
}: {
  question: AnswerQuestion;
  saved?: MyAnswer;
  state: AppState;
  index: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(saved?.draft ?? '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CoachedAnswer | null>(null);
  const [error, setError] = useState(false);
  const [practicing, setPracticing] = useState(false);

  const speak = (text: string) => {
    stopAllSpeech();
    speakText(text);
  };

  const make = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(false);
    playSfx('tap');
    try {
      setResult(await coachAnswer(question, draft.trim(), state.profile.currentLevel, state.profile.displayName));
      playSfx('receive');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!result) return;
    saveMyAnswer(question.id, { draft: draft.trim(), en: result.en, ja: result.ja, tip: result.tip || undefined });
    playSfx('correct');
    haptic('medium');
    setEditing(false);
    setResult(null);
    // 作ったら、その場で一度声に出す
    setPracticing(true);
  };

  const praise = () => {
    playSfx('correct');
    haptic('medium');
    addBondPoints(1);
    if (state.settings.jaVoice) speakJa(getPraise(state.bond.level).id);
  };

  return (
    <li className="tsu-card-solid anim-up px-4 py-3.5" style={{ animationDelay: `${index * 22}ms` }}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-extrabold leading-snug" style={{ color: 'var(--text)' }}>
            {saved?.en && <span aria-label="できた">✅ </span>}
            {question.en}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold" style={{ color: 'var(--text-faint)' }}>
            {question.ja}
          </p>
        </div>
        <button
          type="button"
          onClick={() => speak(question.en)}
          aria-label={`${question.en} を聞く`}
          className="tsu-btn grid h-10 w-10 shrink-0 place-items-center text-[16px]"
          style={{ background: 'var(--tsu-pink-100)' }}
        >
          🔊
        </button>
      </div>

      {/* ------------------------- 保存した答え ------------------------- */}
      {saved?.en && !editing && (
        <>
          <button
            type="button"
            onClick={() => speak(saved.en)}
            className="tsu-btn mt-2.5 w-full rounded-2xl px-3.5 py-2.5 text-left"
            style={{ background: 'var(--tsu-pink-50)' }}
          >
            <span className="block text-[10.5px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
              あなたの答え
            </span>
            <span className="mt-0.5 block text-[15px] font-extrabold leading-snug" style={{ color: 'var(--tsu-pink-600)' }}>
              {saved.en} <span className="text-[12px]">🔊</span>
            </span>
            {saved.ja && (
              <span className="mt-0.5 block text-[12px] font-semibold" style={{ color: 'var(--text-soft)' }}>
                {saved.ja}
              </span>
            )}
            {saved.tip && (
              <span className="mt-1 block text-[11.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                💡 {saved.tip}
              </span>
            )}
          </button>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setPracticing((v) => !v)}
              aria-expanded={practicing}
              className="tsu-btn flex-1 py-2.5 text-[13px] font-extrabold"
              style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
            >
              🎤 言ってみる
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(saved.draft);
                setPracticing(false);
                setEditing(true);
              }}
              className="tsu-btn px-4 py-2.5 text-[13px] font-extrabold"
              style={{ background: 'var(--tsu-lav-100)', color: 'var(--tsu-lav-400)' }}
            >
              ✏️ 作り直す
            </button>
          </div>
          {practicing && (
            <>
              <p className="mt-2.5 text-[11.5px] font-bold" style={{ color: 'var(--text-faint)' }}>
                声に出して言ってみよう。本番で聞かれたら、これがそのまま出てくるように
              </p>
              <SayItPractice key={saved.en} target={saved.en} onPass={praise} />
            </>
          )}
        </>
      )}

      {/* ---------------------------- まだ無い ---------------------------- */}
      {!saved?.en && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="tsu-btn tsu-btn-primary mt-3 w-full py-2.5 text-[13.5px]"
        >
          紬と一緒に作る
        </button>
      )}

      {/* ----------------------------- 作る ----------------------------- */}
      {editing && (
        <div className="mt-3">
          <p className="text-[11.5px] font-bold leading-relaxed" style={{ color: 'var(--text-faint)' }}>
            {question.hint}。日本語でも英語でもいいよ
          </p>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(false);
            }}
            rows={2}
            placeholder={`例：${question.example}`}
            aria-label={`「${question.ja}」への答えの下書き`}
            className="tsu-card-solid mt-1.5 w-full resize-none px-3.5 py-2.5 text-[14px] outline-none"
            style={{ borderRadius: 16, color: 'var(--text)' }}
          />
          {/* 英語ができたら「これにする」が主役。作り直しは控えめにする */}
          <button
            type="button"
            onClick={make}
            disabled={!draft.trim() || busy}
            className={`tsu-btn mt-2 w-full py-2.5 text-[13.5px] ${result ? 'font-extrabold' : 'tsu-btn-primary'}`}
            style={result ? { background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' } : undefined}
          >
            {busy ? '紬が考えてるよ…' : result ? 'この下書きで作り直す' : '紬に英語にしてもらう'}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-[12px] font-bold" style={{ color: 'var(--tsu-pink-600)' }}>
              うまく作れなかった…少ししてから、もう一回ためしてね
            </p>
          )}

          {result && (
            <div className="anim-pop mt-2.5 rounded-2xl px-3.5 py-3" style={{ background: 'var(--tsu-pink-50)' }}>
              <p className="text-[10.5px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
                英語にすると
              </p>
              <p className="mt-0.5 text-[16px] font-extrabold leading-snug" style={{ color: 'var(--tsu-pink-600)' }}>
                {result.en}
              </p>
              {result.ja && (
                <p className="mt-0.5 text-[12px] font-semibold" style={{ color: 'var(--text-soft)' }}>
                  {result.ja}
                </p>
              )}
              {result.tip && (
                <p className="mt-1 text-[11.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                  💡 {result.tip}
                </p>
              )}
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => speak(result.en)}
                  aria-label="作った答えを聞く"
                  className="tsu-btn grid h-10 w-10 shrink-0 place-items-center text-[15px]"
                  style={{ background: 'var(--tsu-pink-100)' }}
                >
                  🔊
                </button>
                <button type="button" onClick={save} className="tsu-btn tsu-btn-primary flex-1 py-2.5 text-[13.5px]">
                  これにする
                </button>
              </div>
            </div>
          )}

          {saved?.en && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setResult(null);
                setError(false);
              }}
              className="tsu-btn mt-2 text-[11.5px] font-bold underline"
              style={{ color: 'var(--text-faint)' }}
            >
              作り直すのをやめる
            </button>
          )}
        </div>
      )}
    </li>
  );
}
