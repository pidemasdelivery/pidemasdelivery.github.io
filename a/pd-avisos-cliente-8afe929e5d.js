/* ===== Avisos del pedido para el cliente · Pidemás (tienda) =====
   Al terminar un pedido se ofrece «Avísame cuando avance». Si el cliente acepta, este celular
   queda anotado para ESE pedido (función guardar_push_cliente, valida el token del pedido)
   y le llegan: aceptado por el negocio, en camino, entregado o cancelado, aunque cierre la tienda.
   En iPhone solo funciona con Pidemás agregada a la pantalla de inicio (iOS 16.4 o más). */
(function(){
  if(window.pdAvisosCliente)return;
  const VAPID='BJIq-YR1vRTC7KlhzD_tJH4YLBR2Hl_vUAtvyIiRj9qaD5GENjDOsNZzlFBQYE7JFNlGpU7ENq8RDNMbx_qUSXQ';
  const soporta=()=>('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window);
  const llave=()=>{const s=VAPID.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((VAPID.length+3)%4);const b=atob(s);return Uint8Array.from(b,c=>c.charCodeAt(0))};
  const cli=()=>{try{if(typeof sb!=='undefined'&&sb)return sb}catch(_){}return window.sb||window.db||null};
  async function registro(){
    let r=await navigator.serviceWorker.getRegistration('./');
    if(!r)r=await navigator.serviceWorker.register('sw.js');
    return navigator.serviceWorker.ready.then(x=>x||r);
  }
  async function suscribir(pedido,token){
    const r=await registro();
    let s=await r.pushManager.getSubscription();
    if(s){const k=s.options&&s.options.applicationServerKey;if(k&&new Uint8Array(k).join()!==llave().join()){await s.unsubscribe();s=null}}
    if(!s)s=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:llave()});
    const j=s.toJSON(),c=cli();if(!c)throw new Error('sin conexión');
    const {error}=await c.rpc('guardar_push_cliente',{p_pedido:pedido,p_token:token,p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth});
    if(error)throw error;
    return true;
  }
  const ICO='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  const OK='<div style="display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:16px;background:#E7F5EC;color:#146C36;font:600 14px/1.4 Inter,system-ui,sans-serif">'+ICO+'<span>Listo: te avisaremos aquí cuando tu pedido sea aceptado, salga hacia ti y llegue.</span></div>';
  /* Bloque para la hoja «¡Pedido enviado!» */
  function bloque(pedido,token){
    if(!soporta()||!pedido||!token)return '';
    const perm=Notification.permission;
    if(perm==='denied')return '';
    const id='pdAvC'+String(pedido).replace(/[^a-z0-9]/gi,'').slice(0,12);
    if(perm==='granted'){setTimeout(()=>{suscribir(pedido,token).catch(e=>console.warn('Avisos cliente:',e&&e.message||e))},400);return '<div id="'+id+'" style="margin:4px 0 12px">'+OK+'</div>'}
    window['__'+id]=()=>activar(pedido,token,id);
    return '<div id="'+id+'" style="margin:4px 0 12px"><button type="button" onclick="window.__'+id+'()" style="width:100%;min-height:54px;display:flex;align-items:center;justify-content:center;gap:10px;border-radius:16px;border:1.5px solid #C4410C;background:#FFF4EC;color:#9A330A;font:800 16px Inter,system-ui,sans-serif;cursor:pointer">'+ICO+'Avísame cuando avance</button><small style="display:block;margin-top:6px;text-align:center;color:#6B5E55;font:500 12.5px/1.35 Inter,system-ui,sans-serif">Te llega un aviso aunque cierres la tienda.</small></div>';
  }
  async function activar(pedido,token,id){
    const box=document.getElementById(id);const b=box&&box.querySelector('button');
    if(b){b.disabled=true;b.lastChild.textContent='Activando…'}
    try{
      const p=await Notification.requestPermission();
      if(p!=='granted'){if(box)box.innerHTML='<div style="padding:12px 14px;border-radius:16px;background:#FFF4E5;color:#8A4B00;font:500 14px/1.4 Inter,system-ui,sans-serif">No se activaron los avisos. Puedes ver cómo va tu pedido en <b>Pedidos</b>.</div>';return}
      await suscribir(pedido,token);
      if(box)box.innerHTML=OK;
    }catch(e){
      console.warn('Avisos cliente:',e&&e.message||e);
      if(box)box.innerHTML='<div style="padding:12px 14px;border-radius:16px;background:#FFF4E5;color:#8A4B00;font:500 14px/1.4 Inter,system-ui,sans-serif">No pudimos activar los avisos en este celular. Puedes ver cómo va tu pedido en <b>Pedidos</b>.</div>';
    }
  }
  /* Tocar el aviso abre «Pedidos» */
  function abrirPedidos(){let n=0;const t=setInterval(()=>{n++;const a=window.pdAppTienda;if(a&&a.ir){clearInterval(t);try{a.ir('pedidos')}catch(_){}}else if(n>40)clearInterval(t)},250)}
  try{if(new URLSearchParams(location.search).get('ver')==='pedidos'){abrirPedidos();history.replaceState(history.state,'',location.pathname)}}catch(_){}
  if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',ev=>{const m=ev.data||{};if(m.type==='pd-abrir-pedidos')abrirPedidos()});
  window.pdAvisosCliente={bloque,activar,soporta};
})();
