const CACHE = 'nova-ai-v1';

// الملفات اللي هتتحفظ عند التثبيت
const PRECACHE = [
  '/',
  '/logo.png',
  '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first — لو الشبكة فشلت يرجع من الكاش
self.addEventListener('fetch', (e) => {
  // تجاهل الـ API requests والـ external requests
  if (
    e.request.url.includes('/api/') ||
    !e.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // حفظ نسخة في الكاش
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
