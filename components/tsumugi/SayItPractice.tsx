'use client';

import { useState } from 'react';
import { alternatives, matchSpoken, type MatchResult } from '@/lib/speechMatch';
import { speakText, stopAllSpeech } from '@/lib/ttsVoice';
import MicButton from '@/components/tsumugi/MicButton';

interface Props {
  /** お手本（「A / B」の言い換えを含んでもよい） */
  target: string;
  /** 言えたとき */
  onPass?: () => void;
  /** 言えなかったとき（何度でも言い直せる） */
  onMiss?: () => void;
  /** 暗記カードのように、答えを見る前に言わせるとき。お手本の音声も、外れた単語も見せない */
  hideAnswer?: boolean;
}

/**
 * 声に出して言う練習（言い直し・暗記カード・自分の答え）。
 * マイクが使えない端末や、声を出せない場所でも練習できるよう、打ち込みでも答え合わせする。
 */
export default function SayItPractice({ target, onPass, onMiss, hideAnswer }: Props) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);

  const check = (heard: string) => {
    if (!heard.trim()) return;
    const r = matchSpoken(target, heard);
    setResult(r);
    if (r.passed) onPass?.();
    else onMiss?.();
  };

  const edit = (value: string) => {
    setText(value);
    setResult(null);
  };

  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-1.5">
        {!hideAnswer && (
          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              speakText(alternatives(target)[0] ?? target);
            }}
            aria-label="お手本を聞く"
            className="tsu-btn grid h-10 w-10 shrink-0 place-items-center text-[15px]"
            style={{ background: 'var(--tsu-pink-100)' }}
          >
            🔊
          </button>
        )}
        <input
          value={text}
          onChange={(e) => edit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              check(text);
            }
          }}
          placeholder="声で言うか、ここに打ってね"
          aria-label="英語で言ってみる"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="tsu-card-solid h-10 min-w-0 flex-1 px-3.5 text-[14px] outline-none"
          style={{ borderRadius: 16, color: 'var(--text)' }}
        />
        <MicButton
          compact
          onResult={(t) => {
            setText(t);
            check(t);
          }}
          onInterim={edit}
        />
        <button
          type="button"
          onClick={() => check(text)}
          disabled={!text.trim()}
          className="tsu-btn tsu-btn-primary h-10 shrink-0 px-3 text-[12.5px]"
        >
          確認
        </button>
      </div>

      {result && (
        <div
          role="status"
          className="anim-pop mt-2 rounded-2xl px-3.5 py-2.5"
          style={{
            background: result.passed ? 'var(--tsu-pink-100)' : 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <p
            className="text-[12.5px] font-extrabold"
            style={{ color: result.passed ? 'var(--tsu-pink-600)' : 'var(--text-soft)' }}
          >
            {result.passed ? '言えた！ ✨' : hideAnswer ? 'おしい！もう一回言ってみて' : 'おしい！薄い色のところを、もう一回'}
          </p>
          {!result.passed && !hideAnswer && (
            <p className="mt-1 text-[14px] font-extrabold leading-snug">
              {result.target.map((t, i) => (
                <span
                  key={i}
                  style={{
                    color: t.ok ? 'var(--tsu-pink-600)' : 'var(--text-faint)',
                    textDecoration: t.ok ? 'none' : 'underline dotted',
                  }}
                >
                  {t.word}{' '}
                </span>
              ))}
            </p>
          )}
          {!result.passed && result.extra.length > 0 && (
            <p className="mt-1 text-[11.5px] font-bold" style={{ color: 'var(--text-faint)' }}>
              言わなくていい単語：{result.extra.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
