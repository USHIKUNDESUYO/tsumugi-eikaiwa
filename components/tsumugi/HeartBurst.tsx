'use client';

import { useEffect, useState } from 'react';

interface Burst {
  id: number;
  dx: number;
  left: number;
  emoji: string;
}

const EMOJIS = ['💗', '💖', '✨', '💕'];

function makeBatch(seed: number): Burst[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: seed * 10 + i,
    dx: Math.round(((((seed * 37 + i * 91) % 100) / 100) - 0.5) * 70),
    left: 20 + (((seed * 53 + i * 29) % 100) / 100) * 60,
    emoji: EMOJIS[(seed + i) % EMOJIS.length],
  }));
}

/** trigger が増えるたびにハートが舞う */
export default function HeartBurst({ trigger, enabled = true }: { trigger: number; enabled?: boolean }) {
  const [prevTrigger, setPrevTrigger] = useState(trigger);
  const [bursts, setBursts] = useState<Burst[]>([]);

  if (prevTrigger !== trigger) {
    setPrevTrigger(trigger);
    setBursts((prev) => (trigger > 0 ? [...prev, ...makeBatch(trigger)] : prev));
  }

  useEffect(() => {
    if (bursts.length === 0) return;
    const t = setTimeout(() => setBursts([]), 1700);
    return () => clearTimeout(t);
  }, [bursts.length]);

  if (!enabled || bursts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {bursts.map((b, i) => (
        <span
          key={b.id}
          className="anim-heart absolute bottom-1/3 text-xl"
          style={{ left: `${b.left}%`, ['--dx' as string]: `${b.dx}px`, animationDelay: `${(i % 5) * 70}ms` }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
