'use client';

import type { Bond } from '@/types';
import { bondProgress } from '@/lib/storage';

export default function BondMeter({ bond, compact = false }: { bond: Bond; compact?: boolean }) {
  const p = bondProgress(bond);
  const maxed = p.ratio >= 1 && bond.level >= 10;

  return (
    <div className={compact ? 'flex items-center gap-2' : 'w-full'}>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[15px]" aria-hidden>
          💗
        </span>
        <span className="text-[13px] font-extrabold" style={{ color: 'var(--tsu-pink-600)' }}>
          Lv.{bond.level}
        </span>
      </div>

      <div
        className={`${compact ? 'w-20' : 'mt-1.5 w-full'} h-2 rounded-full overflow-hidden`}
        style={{ background: 'var(--tsu-pink-100)' }}
        role="progressbar"
        aria-valuenow={Math.round(p.ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="紬との親密度"
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.max(4, p.ratio * 100)}%`,
            background: 'linear-gradient(90deg, var(--tsu-pink-300), var(--tsu-pink-600))',
          }}
        />
      </div>

      {!compact && (
        <p className="mt-1 text-[11px] font-semibold" style={{ color: 'var(--text-faint)' }}>
          {maxed ? 'さいこうの仲です' : `つぎのレベルまで あと ${Math.max(0, p.next - p.current)}`}
        </p>
      )}
    </div>
  );
}
