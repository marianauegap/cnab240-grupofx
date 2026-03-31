const CACHE = 'grupofx-cnab240-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Instala e faz cache dos recursos principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // Se algum externo falhar, ignora e continua
        return cache.addAll(['/', '/index.html', '/manifest.json']);
      });
    })
  );
  self.skipWaiting();
});

// Limpa caches antigos ao ativar
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Serve do cache, busca na rede se não tiver
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Só faz cache de respostas válidas
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }).catch(() => {
        // Offline fallback: retorna index.html
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
