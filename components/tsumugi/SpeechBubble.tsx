'use client';

import { useEffect, useState } from 'react';

interface SpeechBubbleProps {
  text: string;
  /** 1文字ずつ出す */
  typewriter?: boolean;
  speed?: number;
  className?: string;
}

export default function SpeechBubble({
  text,
  typewriter = true,
  speed = 34,
  className = '',
}: SpeechBubbleProps) {
  const [count, setCount] = useState(typewriter ? 0 : text.length);
  const [prevText, setPrevText] = useState(text);

  // props が変わったときに state を合わせる（React 公式の「レンダー中の調整」パターン）
  if (prevText !== text) {
    setPrevText(text);
    setCount(typewriter ? 0 : text.length);
  }

  useEffect(() => {
    if (!typewriter) return;
    const timer = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(timer);
  }, [text, typewriter, speed]);

  const shown = text.slice(0, count);

  return (
    <div
      className={`tsu-card-solid tsu-bubble-tail relative px-5 py-3.5 text-[15px] leading-relaxed font-medium ${className}`}
      style={{ color: 'var(--text)' }}
    >
      {shown}
      {typewriter && count < text.length && (
        <span className="ml-0.5 inline-block w-[2px] h-[1em] align-middle bg-current opacity-60" />
      )}
    </div>
  );
}
