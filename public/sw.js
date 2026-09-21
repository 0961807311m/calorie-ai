const CACHE_NAME = 'calorieai-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/history',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — кешуємо статику
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — чистимо старі кеші
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first для API, cache-first для статики
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API та Supabase — завжди мережа
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('googleapis')
  ) {
    return;
  }

  // Решта — спочатку кеш, потім мережа
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          // Кешуємо тільки успішні GET
          if (request.method === 'GET' && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      );
    })
  );
});