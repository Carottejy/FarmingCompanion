// Transforme l'export web d'Expo (dist/) en web app installable et utilisable hors ligne :
//  - manifest.webmanifest + icônes (écran d'accueil iPhone / Android)
//  - service worker qui met en cache TOUS les fichiers de l'application
//  - balises <head> pour iOS (mode plein écran, icône, couleur)
//  - 404.html (copie d'index.html) pour que GitHub Pages serve les routes de l'app
// Usage : node scripts/make-pwa.mjs dist
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const base = (process.env.WEB_BASE_URL ?? '').replace(/\/$/, '');

const THEME = '#2E7D32';
const BG = '#F7F5EF';

const manifest = {
  name: 'FarmingCompanion',
  short_name: 'Farming',
  description: app.description,
  lang: 'fr',
  start_url: `${base}/`,
  scope: `${base}/`,
  display: 'standalone',
  orientation: 'portrait',
  background_color: BG,
  theme_color: THEME,
  icons: [
    { src: `${base}/pwa-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${base}/pwa-512.png`, sizes: '512x512', type: 'image/png' },
    { src: `${base}/pwa-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
writeFileSync(join(dist, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

// <head> : manifest, icône iPhone, plein écran, enregistrement du service worker.
const head = `
<meta name="theme-color" content="${THEME}">
<link rel="manifest" href="${base}/manifest.webmanifest">
<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Farming">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('${base}/sw.js', { scope: '${base}/' }).catch(function (e) {
        console.warn('Service worker non enregistré', e);
      });
    });
  }
</script>
`;
const indexPath = join(dist, 'index.html');
let html = readFileSync(indexPath, 'utf8');
html = html.replace(/<html lang="[^"]*"/, '<html lang="fr"');
html = html.replace(/<title>.*?<\/title>/, '<title>FarmingCompanion</title>');
html = html.replace('</head>', `${head}</head>`);
writeFileSync(indexPath, html);
writeFileSync(join(dist, '404.html'), html);
writeFileSync(join(dist, '.nojekyll'), '');

// Liste de tous les fichiers à mettre en cache (hors sw.js lui-même).
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(dist)
  .map((p) => relative(dist, p).split(sep).join('/'))
  .filter((f) => f !== 'sw.js' && f !== '.nojekyll' && f !== '404.html' && !f.endsWith('.map'))
  .sort();

const hash = createHash('sha256');
for (const f of files) hash.update(f).update(readFileSync(join(dist, f)));
const version = `fc-${app.version}-${hash.digest('hex').slice(0, 10)}`;

const sw = `// Généré par scripts/make-pwa.mjs — ne pas modifier à la main.
const CACHE = ${JSON.stringify(version)};
const FILES = ${JSON.stringify(['./', ...files.filter((f) => f !== 'index.html')])};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new URL(f, self.registration.scope).href))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('fc-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // API GitHub, etc. : réseau uniquement

  // Navigation (ouverture de l'app ou d'un onglet) : toujours la page de l'app en cache.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(self.registration.scope, { cacheName: CACHE }).then((cached) => cached || fetch(req)),
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
`;
writeFileSync(join(dist, 'sw.js'), sw);

console.log(`PWA prête : ${files.length} fichiers en cache (${version}), base « ${base || '/'} »`);
