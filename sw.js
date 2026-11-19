// Replaces both sw.js and the legacy sw.js?v=20261001b registration.
const ROOT = new URL('./', self.location.href);
const PREFIX = `ironform-forge-live:${ROOT.pathname}:`;
const CACHE = `${PREFIX}20261119-1`;
const ASSETS = ['index.html', 'manifest.webmanifest', 'icon.svg',
  'forge/app.css', 'forge/app.js', 'forge/program.js', 'forge/store.js',
  'forge/assets/icon.svg', 'forge/assets/iron-plate.jpg', 'forge/assets/fonts.css',
  ...Array.from({length:6}, (_,i)=>`forge/assets/font-${i+1}.ttf`)].map(path=>new URL(path, ROOT).href);
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>
    (key.startsWith(PREFIX) && key !== CACHE) || /^ironform-v\d+$/.test(key)
  ).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  const home = url.pathname === ROOT.pathname || url.pathname === new URL('index.html', ROOT).pathname;
  const key = home ? new URL('index.html', ROOT).href : url.origin + url.pathname;
  // Cache app assets only, never API responses or other sites on this origin.
  if (!ASSETS.includes(key)) return;
  event.respondWith((async()=>{
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request, {cache:'no-cache'});
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch {
      return await cache.match(key) || new Response('Reconnect to load Ironform.', {status:503});
    }
  })());
});
