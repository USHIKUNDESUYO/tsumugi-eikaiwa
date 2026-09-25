const CACHE_NAME = 'tsumugi-eikaiwa-v6';

// Assets that can be cached (images, manifest)
const staticAssets = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  // Take control immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(staticAssets);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Network-first for HTML (navigations) to avoid stale shells
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // エラーのページで、保存してある正しい画面を上書きしない
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Network error' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // Cache-first for Next.js static assets (they have content hashes)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }
  
  // Network-first for everything else (JS, CSS without hashes)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 丸ごとの応答（200）だけ保存する。音声は「一部だけ」の 206 で届くことがあり、
        // 206 はキャッシュに入れられない（put が失敗する）
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request);
      })
  );
});

/* ------------------------------------------------------------------ */
/*  オフラインの準備（lib/offline.ts から頼まれる）                        */
/*  会場で電波が無くなっても、フレーズ帳・自分の答え・復習と紬の声が使えるよう、 */
/*  電波があるうちにアプリ本体と音声を保存しておく。                         */
/* ------------------------------------------------------------------ */

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'precache' || !Array.isArray(data.urls)) return;
  event.waitUntil(
    precache(data.shell || [], data.urls).then((result) => {
      if (event.source) event.source.postMessage({ type: 'precache-done', ...result });
    })
  );
});

async function precache(shell, urls) {
  const cache = await caches.open(CACHE_NAME);
  const origin = self.location.origin;
  const toKey = (u) => new URL(u, origin).href;

  // 前のビルドの JS・CSS はもう使わないので消す（デプロイのたびに溜まらないように）。
  // フォント（/_next/static/media/）は画面ごとに使う文字の分だけ読まれるので、消さずに残す
  if (shell.length) {
    const keep = new Set(shell.map(toKey));
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname;
      if (path.startsWith('/_next/static/') && !path.startsWith('/_next/static/media/') && !keep.has(request.url)) {
        await cache.delete(request);
      }
    }
  }

  const queue = [...new Set([...shell, ...urls].map(toKey))].filter((u) => u.startsWith(origin));
  let added = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      if (await cache.match(url)) {
        skipped++;
        continue;
      }
      try {
        // Range を付けずに取り、丸ごとの 200 を保存する（音声を「一部だけ」で保存しない）
        const response = await fetch(url, { cache: 'no-cache' });
        if (response.status !== 200) {
          failed++;
          continue;
        }
        bytes += Number(response.headers.get('content-length') || 0);
        await cache.put(url, response);
        added++;
      } catch {
        failed++;
      }
    }
  };
  // 3本ずつ。ほかの読み込みの邪魔をしすぎない
  await Promise.all([worker(), worker(), worker()]);
  return { added, skipped, failed, bytes };
}
