const CACHE = 'todo-niel-v1';
const APP_SHELL = [
  '/css/style.css',
  '/css/auth.css',
  '/css/calendario.css',
  '/css/footer.css',
  '/js/calendario.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.webmanifest',
  '/offline.html'
];

self.addEventListener('install', event => {
  // Pre-cache only static shell files; never cache rendered pages or user data.
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  // Remove older versions of this app's cache and take control of open pages.
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('todo-niel-') && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const privateRoute =
    path === '/api' ||
    path.startsWith('/api/') ||
    ['/login', '/logout', '/register', '/inicio', '/cadastrar', '/tarefas', '/calendario'].includes(path) ||
    path.startsWith('/edit/');

  if (privateRoute && request.mode !== 'navigate') {
    // Always use the network without HTTP/SW caching for auth, API, and private routes.
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (request.mode === 'navigate') {
    // Network-first for HTML; even authenticated pages are never put in a cache.
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(async () => {
        const offlinePage = await caches.match('/offline.html');
        return offlinePage || new Response('Sem conexão.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
    return;
  }

  const isStaticAsset =
    ['style', 'script', 'image', 'font'].includes(request.destination) ||
    /\.(?:css|js|png|jpe?g|gif|svg|ico|webmanifest|woff2?)$/i.test(path);

  if (!isStaticAsset) return;

  // Cache-first for same-origin static assets; dynamic requests never reach this cache.
  event.respondWith((async () => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  })());
});
