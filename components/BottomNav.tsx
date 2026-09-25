'use client';

export type Screen = 'home' | 'scenarios' | 'phrases' | 'review' | 'progress';

const TABS: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'scenarios', label: '練習', icon: '🎪' },
  { id: 'phrases', label: 'フレーズ', icon: '📖' },
  { id: 'review', label: '復習', icon: '🔁' },
  { id: 'progress', label: '記録', icon: '📊' },
];

export default function BottomNav({
  current,
  onChange,
  dueCount = 0,
}: {
  current: Screen;
  onChange: (s: Screen) => void;
  dueCount?: number;
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        background: 'var(--surface)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderTop: '1px solid var(--border)',
      }}
      aria-label="メインナビゲーション"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((tab) => {
          const active = current === tab.id;
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={active ? 'page' : undefined}
                className="tsu-btn relative flex w-full flex-col items-center gap-0.5 py-2.5 !rounded-2xl"
              >
                <span
                  className="text-[21px] leading-none transition-transform duration-200"
                  style={{ transform: active ? 'scale(1.18) translateY(-1px)' : 'none' }}
                  aria-hidden
                >
                  {tab.icon}
                </span>
                <span
                  className="text-[10.5px] font-extrabold"
                  style={{ color: active ? 'var(--tsu-pink-600)' : 'var(--text-faint)' }}
                >
                  {tab.label}
                </span>
                {tab.id === 'review' && dueCount > 0 && (
                  <span
                    className="absolute right-[18%] top-1 min-w-[17px] rounded-full px-1 text-[10px] font-extrabold text-white"
                    style={{ background: 'var(--tsu-pink-600)' }}
                  >
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
