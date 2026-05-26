// 대주아리랑2 PWA Service Worker
const CACHE_NAME = 'arirang2-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // 날씨 API는 항상 네트워크 우선 (캐시 fallback)
  if (url.hostname === 'api.open-meteo.com') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, respClone));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  // 동일 origin 자원: 캐시 우선 (offline 지원)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, respClone));
        return resp;
      }))
    );
  }
});
