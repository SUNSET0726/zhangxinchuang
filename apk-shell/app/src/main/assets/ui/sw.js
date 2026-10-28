const CACHE = 'zhaoge-v1';
const SHELL = [
  '/ui/home/home.html',
  '/ui/base/theme.css',
  '/ui/base/theme.js',
  '/ui/base/snow.js',
  '/ui/manifest.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return c.add(new Request(u, { cache: 'reload' })).catch(function () { });
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') { return; }
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) { return; }
  if (url.pathname.indexOf('/ui/') !== 0) { return; }
  e.respondWith(
    fetch(req).then(function (r) {
      const cp = r.clone();
      caches.open(CACHE).then(function (c) { c.put(req, cp); }).catch(function () { });
      return r;
    }).catch(function () {
      return caches.match(req).then(function (m) { return m || caches.match('/ui/home/home.html'); });
    })
  );
});