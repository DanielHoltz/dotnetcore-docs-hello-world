/* EnfCalc service worker — funciona offline (cache-first do app shell) */
var CACHE = 'enfcalc-v20';
var ASSETS = [
  './', 'index.html', 'css/styles.css', 'js/calc.js', 'js/data.js', 'js/maletas.js', 'js/doses.js', 'js/paciente.js', 'js/revisoes.js', 'js/emergencia.js', 'js/bulario.js', 'js/bulario_extra.js', 'js/apresentacoes.js', 'js/protocolos.js', 'js/modulos.js', 'js/catalogo.js', 'js/app.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// stale-while-revalidate: responde do cache e atualiza em segundo plano
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) cache.put(e.request, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
