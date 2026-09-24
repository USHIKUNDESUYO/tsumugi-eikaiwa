/**
 * API のベースURL。
 *
 * Web（Vercel）では同一オリジンなので空文字でよい。
 * Capacitor（Android アプリ）では画面が端末内の静的ファイルから配信されるため、
 * AI 会話と読み上げだけは Vercel 上のサーバーを絶対URLで叩く必要がある。
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
