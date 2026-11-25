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

/* ===== Avisos del pedido para el cliente (push) ===== */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Pidemás', body: e.data ? e.data.text() : '' }; }
  if (d.rol && d.rol !== 'cliente') return;
  e.waitUntil((async () => {
    await self.registration.showNotification(d.title || 'Pidemás', {
      body: d.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: d.tag || 'pidemas-pedido',
      renotify: true,
      data: { pedidoId: d.pedidoId || null }
    });
    const list = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(c => String(c.url || '').startsWith(self.registration.scope) && !/\/(admin|motorizado|negocio)\//.test(c.url));
    list.forEach(c => c.postMessage({ type: 'pd-push-cliente', data: d }));
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL('./?ver=pedidos', self.registration.scope).href;
  e.waitUntil((async () => {
    const list = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(c => String(c.url || '').startsWith(self.registration.scope) && !/\/(admin|motorizado|negocio)\//.test(c.url));
    for (const c of list) { if ('focus' in c) { await c.focus(); c.postMessage({ type: 'pd-abrir-pedidos' }); return; } }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
