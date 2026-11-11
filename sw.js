/* Service worker mínimo: la tienda siempre usa la red (pedidos en vivo). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
