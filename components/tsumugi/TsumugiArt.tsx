'use client';

import { useEffect, useState } from 'react';
import type { Expression, Outfit } from '@/types';
import { artSrc, blinkSrc, talkSrc, canBlink, canTalk, ART_ASPECT } from '@/lib/tsumugiArt';
import TsumugiCharacter from './TsumugiCharacter';

interface TsumugiArtProps {
  expression?: Expression;
  /** 喋っている間 true にすると口が動く */
  speaking?: boolean;
  outfit?: Outfit;
  /** 表示サイズ(px)。高さ基準。 */
  size?: number;
  reduceMotion?: boolean;
  effects?: boolean;
  className?: string;
}

/**
 * 紬のイラスト表示。
 *
 * ラスタ画像はSVGのように変形できないので、まばたきと口パクは
 * 差分画像への「差し替え」で表現する。3枚を重ねて opacity で
 * 切り替えることで、切り替え時に読み込みが走らないようにしている。
 *
 * イラストがまだ無い環境でも動くよう、読み込みに失敗したら
 * 手描きSVG版にフォールバックする。
 */
export default function TsumugiArt({
  expression = 'smile',
  speaking = false,
  outfit = 'casual',
  size = 220,
  reduceMotion = false,
  effects = true,
  className = '',
}: TsumugiArtProps) {
  const [blinking, setBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  const base = artSrc(expression, outfit);
  const blink = canBlink(expression, outfit) ? blinkSrc(outfit) : null;
  const talk = canTalk(expression, outfit) ? talkSrc(outfit) : null;
  const blinkable = Boolean(blink) && !reduceMotion && !speaking;

  /* まばたき: 2.6〜6秒ごとに130msだけ閉じる */
  useEffect(() => {
    if (!blinkable || !blink) return;
    let openTimer: ReturnType<typeof setTimeout>;
    let nextTimer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      nextTimer = setTimeout(() => {
        setBlinking(true);
        openTimer = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 130);
      }, 2600 + Math.random() * 3400);
    };
    schedule();

    return () => {
      clearTimeout(nextTimer);
      clearTimeout(openTimer);
    };
  }, [blinkable, blink]);

  /* 口パク */
  useEffect(() => {
    if (!speaking || reduceMotion || !talk) return;
    const id = setInterval(() => setMouthOpen((v) => !v), 170);
    return () => clearInterval(id);
  }, [speaking, reduceMotion, talk]);

  // イラストが無い環境では手描きSVGに戻す
  if (failed) {
    return (
      <TsumugiCharacter
        expression={expression}
        speaking={speaking}
        outfit={outfit}
        size={size}
        reduceMotion={reduceMotion}
        effects={effects}
        className={className}
      />
    );
  }

  const showTalk = Boolean(talk) && speaking && mouthOpen && !reduceMotion;
  const showBlink = Boolean(blink) && blinking;

  const layer = (src: string, visible: boolean, alt: string, isBase: boolean) => (
    // eslint-disable-next-line @next/next/no-img-element -- 透過WebPを重ねて差し替えるので next/image は使えない
    <img
      key={src}
      src={src}
      alt={alt}
      draggable={false}
      onError={isBase ? () => setFailed(true) : undefined}
      className={isBase ? 'block h-full w-full' : 'absolute inset-0 h-full w-full'}
      style={{
        objectFit: 'contain',
        opacity: visible ? 1 : 0,
        // 差し替えの瞬間にちらつかないよう、フェードはごく短く
        transition: 'opacity 60ms linear',
        pointerEvents: 'none',
      }}
    />
  );

  return (
    <div
      className={`relative select-none ${reduceMotion ? '' : 'tsumugi-breathe'} ${className}`}
      style={{ height: size, width: size * ART_ASPECT }}
    >
      {layer(base, !showBlink && !showTalk, `紬（${expression}）`, true)}
      {blink && layer(blink, showBlink, '', false)}
      {talk && layer(talk, showTalk, '', false)}

      {effects && (expression === 'happy' || expression === 'love' || expression === 'wink') && (
        <span
          className={`pointer-events-none absolute inset-0 ${reduceMotion ? '' : 'art-twinkle'}`}
          aria-hidden
        >
          <span className="absolute left-[4%] top-[18%] text-[1.1em]">✨</span>
          <span className="absolute right-[6%] top-[10%] text-[0.9em]">✨</span>
          <span className="absolute right-[2%] top-[42%] text-[0.75em]">✨</span>
        </span>
      )}
    </div>
  );
}
