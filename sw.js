const CACHE='ironform-v6-20261103a';
const ASSETS=['./','./index.html','./archive.html','./refresh.html','./phase-v.js','./refresh-ui.js','./refresh.css','./manifest.webmanifest','./icon.svg',...Array.from({length:15},(_,i)=>`./data-${i+1}.js`)];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ironform-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  // One cache entry per path: date hashes and build queries never change page identity.
  const key=url.origin+url.pathname;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok)await cache.put(key,response.clone());
      return response;
    }catch{
      return await cache.match(key)||new Response('Not available offline. Reconnect and try again.',{status:503,headers:{'Content-Type':'text/plain'}});
    }
  })());
});
