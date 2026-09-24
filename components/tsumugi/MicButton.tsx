'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** ブラウザ差異を吸収するための最小限の型 */
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

type Ctor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): Ctor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface MicButtonProps {
  onResult: (text: string) => void;
  onInterim?: (text: string) => void;
  disabled?: boolean;
}

const subscribeNoop = () => () => {};

export default function MicButton({ onResult, onInterim, disabled }: MicButtonProps) {
  // SpeechRecognition の有無はブラウザ側の事実なので、外部ストアとして読む
  const supported = useSyncExternalStore(
    subscribeNoop,
    () => getRecognitionCtor() !== null,
    () => false
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');

  useEffect(() => () => recRef.current?.abort(), []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    setError(null);
    finalRef.current = '';

    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0]?.transcript ?? '';
        if (r.isFinal) finalRef.current += text;
        else interim += text;
      }
      onInterim?.(finalRef.current + interim);
    };

    rec.onerror = (e) => {
      setError(
        e.error === 'not-allowed'
          ? 'マイクの許可が必要です'
          : e.error === 'no-speech'
            ? '聞き取れませんでした'
            : 'うまく聞き取れませんでした'
      );
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      const text = finalRef.current.trim();
      if (text) onResult(text);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [onResult, onInterim]);

  if (!supported) return null;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        aria-label={listening ? '録音を止める' : '英語で話す'}
        aria-pressed={listening}
        className="tsu-btn relative grid h-12 w-12 place-items-center text-[20px]"
        style={{
          background: listening
            ? 'linear-gradient(135deg, var(--tsu-pink-400), var(--tsu-pink-600))'
            : 'var(--tsu-pink-100)',
        }}
      >
        {listening && (
          <span
            className="anim-ring absolute inset-0 rounded-full"
            style={{ border: '2px solid var(--tsu-pink-400)' }}
            aria-hidden
          />
        )}
        <span aria-hidden>{listening ? '⏹' : '🎤'}</span>
      </button>

      {error && (
        <span
          className="absolute -top-8 right-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-extrabold"
          style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
          role="status"
        >
          {error}
        </span>
      )}
    </div>
  );
}
