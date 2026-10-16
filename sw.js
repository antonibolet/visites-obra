// Visites d'obra · Tacuina — permet obrir l'app sense cobertura (les visites ja es desen al mòbil).
const CACHE = 'visites-1.4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function ambTemps(p, ms) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('temps')), ms);
    p.then(v => { clearTimeout(t); res(v); }, err => { clearTimeout(t); rej(err); });
  });
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;  // el servidor de Google no passa per aquí
  if (req.mode === 'navigate') {
    // Primer la xarxa (per rebre les versions noves); si no n'hi ha o va lenta, la còpia desada.
    const xarxa = fetch(req).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put('./index.html', c)); }
      return r;
    });
    e.respondWith(ambTemps(xarxa, 5000).catch(() =>
      caches.match('./index.html').then(r => r || caches.match('./')).then(r => r || xarxa)));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
