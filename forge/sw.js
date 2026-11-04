const CACHE='ironform-forge-preview-v1';
const ASSETS=['./','./index.html','./app.css','./app.js','./program.js','./store.js','./manifest.webmanifest','./assets/icon.svg','./assets/iron-plate.jpg','./assets/fonts.css',...Array.from({length:6},(_,i)=>`./assets/font-${i+1}.ttf`)];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ironform-forge-preview-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),key=url.origin+url.pathname;try{const response=await fetch(event.request);if(response.ok)await cache.put(key,response.clone());return response;}catch{return await cache.match(key)||new Response('Reconnect to load this resource.',{status:503});}})());
});
