/* Service worker de la tienda: los pedidos y datos siempre van por la red (en vivo).
   Solo los archivos con huella en el nombre (carpeta a/) se guardan: no cambian nunca. */
const PD_CACHE='pidemas-tienda-a-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pidemas-tienda-a-')&&k!==PD_CACHE).map(k=>caches.delete(k))))
])));
self.addEventListener('fetch', e => {
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==self.location.origin)return;
  if(/\/a\/[^/]+-[0-9a-f]{10}\.(js|css|svg|png)$/.test(u.pathname)){
    e.respondWith(caches.open(PD_CACHE).then(async c=>{const hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res&&res.ok)c.put(r,res.clone()).catch(()=>{});return res}));
  }
});
