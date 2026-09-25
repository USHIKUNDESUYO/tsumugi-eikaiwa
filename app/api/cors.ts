/**
 * アプリ版（Capacitor）から API を叩くための CORS。
 *
 * アプリの画面は端末内から配信されるので、オリジンは Android が https://localhost、
 * iOS が capacitor://localhost になり、Vercel 上の API とはクロスオリジンになる。
 * JSON の POST は先にプリフライト（OPTIONS）が飛び、許可ヘッダーが無いと
 * WebView は本番のリクエストを送らない。つまりアプリ内で紬と会話できない。
 *
 * 許可するのはアプリのオリジンだけ。Web 版は同一オリジンなので何も足さない。
 * （app/api ごと退避して静的書き出しするモバイルビルドに巻き込まれないよう、ここに置く）
 */
const APP_ORIGINS = new Set(['https://localhost', 'capacitor://localhost']);

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  // 許可するかどうかがオリジンで変わるので、キャッシュにもそれを伝える
  if (!origin || !APP_ORIGINS.has(origin)) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '7200',
    Vary: 'Origin',
  };
}

/** プリフライトへの応答 */
export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
