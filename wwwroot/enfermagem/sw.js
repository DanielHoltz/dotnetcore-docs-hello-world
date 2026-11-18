/* EnfCalc service worker — funciona offline (cache do app shell, atualização em segundo plano) */
var CACHE = 'enfcalc-v32';
// essenciais para o app abrir offline; cada arquivo é guardado individualmente (uma falha não impede a instalação)
var ASSETS = [
  './', 'index.html', 'css/styles.css', 'js/calc.js', 'js/data.js', 'js/maletas.js', 'js/doses.js', 'js/paciente.js', 'js/revisoes.js', 'js/emergencia.js', 'js/bulario.js', 'js/bulario_extra.js', 'js/apresentacoes.js', 'js/protocolos.js', 'js/perfis.js', 'js/modulos.js', 'js/catalogo.js', 'js/antimicrobianos.js', 'js/app.js', 'js/ui.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];
// opcionais, grandes: baixados em segundo plano depois da instalação (leitor de código de barras)
var OPCIONAIS = ['js/ean.js'];

function guardar(cache, lista) {
  return Promise.all(lista.map(function (u) { return cache.add(u).then(function () { return null; }, function () { return u; }); }))
    .then(function (falhas) { return falhas.filter(Boolean); });
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return guardar(c, ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    // completa o que faltou na instalação e baixa os opcionais, sem bloquear
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.concat(OPCIONAIS).map(function (u) { return c.match(u).then(function (h) { return h || c.add(u).catch(function () {}); }); }));
    });
  }));
});

// mensagens da página: status do cache (para o app mostrar se está pronto offline)
self.addEventListener('message', function (e) {
  if (!e.data || e.data.tipo !== 'status-cache') return;
  caches.open(CACHE).then(function (c) {
    return Promise.all(ASSETS.concat(OPCIONAIS).map(function (u) { return c.match(u).then(function (h) { return h ? null : u; }); }));
  }).then(function (faltam) {
    faltam = faltam.filter(Boolean);
    if (e.source) e.source.postMessage({ tipo: 'status-cache', faltam: faltam, ean: faltam.indexOf('js/ean.js') < 0 });
  });
});

// stale-while-revalidate: responde do cache e atualiza em segundo plano; nunca entrega resposta nula
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;            // fontes e bibliotecas externas: rede normal
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(function () {
        if (hit) return hit;
        if (e.request.mode === 'navigate') return cache.match('index.html').then(function (idx) { return idx || new Response('<!doctype html><meta charset="utf-8"><title>EnfCalc offline</title><p style="font:16px system-ui;padding:24px">Sem conexão e o app ainda não foi guardado para uso offline. Conecte-se uma vez e abra o EnfCalc novamente.</p>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }); });
        return new Response('', { status: 504, statusText: 'Offline' });
      });
      return hit || net;
    });
  }));
});
