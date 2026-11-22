(function(){
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const SVG=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
  const BOLSA=SVG('<path d="M6.33 8h11.34a2 2 0 0 1 1.98 2.27l-1.25 8.5a2 2 0 0 1 -1.98 1.73h-8.84a2 2 0 0 1 -1.98 -1.73l-1.25 -8.5a2 2 0 0 1 1.98 -2.27z"/><path d="M9 11v-5a3 3 0 0 1 6 0v5"/>');
  const RUTA=SVG('<path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z"/><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5"/>');
  const negNombre=o=>{try{return o.negocio_nombre||(o.negocio_id&&getRestaurantNameById(o.negocio_id))||(o.negocio_id?'Negocio':'Productos Pidemás')}catch(e){return 'Pidemás'}};
  const code=o=>'#'+String(o.id||'').slice(0,8).toUpperCase();
  const fecha=v=>{const d=v?new Date(v):null;if(!d||isNaN(d))return '';const hoy=new Date(),ay=new Date(Date.now()-864e5);const h=d.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit'});if(d.toDateString()===hoy.toDateString())return 'Hoy, '+h;if(d.toDateString()===ay.toDateString())return 'Ayer, '+h;return d.toLocaleDateString('es-PE',{day:'numeric',month:'short'})+', '+h};
  const hora=v=>{const d=v?new Date(v):null;return d&&!isNaN(d)?d.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit'}):''};
  const est=o=>String(o.estado||'pendiente').toLowerCase();
  const terminado=o=>['entregado','cancelado','anulado','rechazado'].includes(est(o));
  const pagoTxt=m=>{m=String(m||'');return m?m.charAt(0).toUpperCase()+m.slice(1):''};
  const itemsTxt=o=>(o.items||[]).map(x=>Number(x.cantidad||1)+' × '+x.nombre).join(', ');
  function top(titulo,sub){return '<div class="pdpTop"><div><h2>'+E(titulo)+'</h2>'+(sub?'<small>'+E(sub)+'</small>':'')+'</div><button type="button" class="pdpX" aria-label="Cerrar" onclick="closeModal()">×</button></div>'}
  function vacio(ic,t,p,btn){return '<div class="pdpCard pdpVacio"><i>'+ic+'</i><b>'+E(t)+'</b><p>'+E(p)+'</p>'+(btn||'')+'</div>'}
  const sinSesion=()=>{try{return !pdClienteSesion?.id}catch(e){return true}};
  const loginBtn='<button type="button" class="pdpBtn" style="width:100%!important" onclick="closeModal();pdAbrirCuentaCliente()">Iniciar sesión con Google</button>';

  /* ---------- Pasos del seguimiento (alineados con lo que marca el motorizado) ---------- */
  function pasos(o){
    const neg=!!o.negocio_id,s=est(o);
    const L=[
      {k:'recibido',t:'Pedido recibido',d:neg?'El negocio está revisando tu pedido.':'Estamos preparando tu pedido.',at:o.creado_en},
      neg?{k:'negocio',t:'El negocio lo confirmó',d:'Están preparando tu pedido.',at:o.negocio_aceptado_en}:null,
      {k:'moto',t:'Motorizado en camino al local',d:'Un motorizado ya tiene tu pedido asignado.',at:o.aceptado_en||o.asignado_en},
      {k:'camino',t:'Recogió tu pedido',d:'Va camino a tu dirección.',at:o.en_camino_en},
      {k:'llegando',t:'Llegando a tu dirección',d:'Ten listo tu pago y tu celular.',at:o.en_entrega_en},
      {k:'entregado',t:'Pedido entregado',d:'¡Gracias por pedir en Pidemás!',at:o.entregado_en}
    ].filter(Boolean);
    const porEstado={pendiente:0,confirmado:neg?1:0,asignado:neg?2:1,aceptado:neg?2:1,pedido_aceptado:neg?2:1,camino_recojo:neg?2:1,en_camino:neg?3:2,camino_entrega:neg?3:2,en_entrega:neg?4:3,confirmando_pago:neg?4:3,entregado:L.length-1};
    let cur=porEstado[s]??0;
    L.forEach((p,i)=>{if(p.at&&i>cur)cur=i});
    if(s==='entregado')cur=L.length-1;
    return {L,cur};
  }
  function titular(o,p){
    const s=est(o);
    if(['cancelado','anulado','rechazado'].includes(s))return ['Pedido cancelado','Si ya pagaste, Pidemás se comunicará contigo.'];
    const k=p.L[p.cur].k;
    return {recibido:['Recibimos tu pedido','Te avisaremos en cada paso.'],negocio:['Están preparando tu pedido',o.tiempo_preparacion_min?'Listo en unos '+o.tiempo_preparacion_min+' min.':'El negocio ya lo confirmó.'],moto:['Un motorizado va por tu pedido','Lo recogerá en el local.'],camino:['Tu pedido va en camino','El motorizado ya salió hacia tu dirección.'],llegando:['¡Ya casi llega!','El motorizado está por llegar.'],entregado:['Pedido entregado','¡Buen provecho!']}[k]||['Tu pedido','En proceso'];
  }
  function detalle(o){
    const sub=Number(o.subtotal),del=Number(o.delivery_cost??o.costo_delivery);
    return (o.items||[]).map(x=>'<div class="pdpLine"><span>'+Number(x.cantidad||1)+' × '+E(x.nombre)+'</span><span>'+money(Number(x.precio||0)*Number(x.cantidad||1))+'</span></div>').join('')+
      (Number.isFinite(sub)&&sub>0?'<div class="pdpLine"><span>Subtotal</span><span>'+money(sub)+'</span></div>':'')+
      (Number.isFinite(del)?'<div class="pdpLine"><span>Delivery</span><span>'+money(del)+'</span></div>':'')+
      (o.metodo_pago?'<div class="pdpLine"><span>Pago</span><span>'+E(pagoTxt(o.metodo_pago))+(o.pago_confirmado?' · confirmado':'')+'</span></div>':'')+
      '<div class="pdpLine t"><span>Total</span><span>'+money(o.total)+'</span></div>';
  }

  /* ---------- Seguimiento ---------- */
  let pedidosSeg=[],elegido=0,timer=null,detAbiertos={};
  function pintarSeguimiento(){
    const sheet=document.querySelector('#modal .sheet.pdpTrack');if(!sheet)return;
    const o=pedidosSeg[elegido]||pedidosSeg[0];if(!o)return;
    const p=pasos(o),[t1,t2]=titular(o,p),canc=['cancelado','anulado','rechazado'].includes(est(o));
    const body=sheet.querySelector('.pdpBody'),y=body?body.scrollTop:0;
    let h='';
    h+='<div class="pdpHero"><div class="k"><span>'+E(negNombre(o))+' · '+E(code(o))+'</span>'+(canc?'':'<span class="pdpLive"><i></i>En vivo</span>')+'</div><h3>'+E(t1)+'</h3><p>'+E(t2)+'</p>'+(canc?'':'<div class="pdpBar">'+p.L.map((_,i)=>'<span class="'+(i<=p.cur?'on':'')+'"></span>').join('')+'</div>')+'</div>';
    if(pedidosSeg.length>1)h+='<div class="pdpCarouselHint"><span>Desliza para ver otro pedido</span><strong>'+String(elegido+1)+' / '+String(pedidosSeg.length)+'</strong></div><div class="pdpCarouselDots" aria-hidden="true">'+pedidosSeg.map((x,i)=>'<i class="'+(i===elegido?'on':'')+'"></i>').join('')+'</div>';
    try{if(!canc&&window.pdCodigoHtml)h+=window.pdCodigoHtml(o)}catch(_){}
    if(!canc)h+='<div class="pdpCard"><div class="pdpTl">'+p.L.map((s,i)=>{const done=i<p.cur,cur=i===p.cur;return '<div class="pdpSt'+(done?' done':'')+(cur?' cur':'')+'"><span class="pdpDot"></span><div style="flex:1;min-width:0"><div class="pdpRow"><b>'+E(s.t)+'</b>'+((done||cur)&&hora(s.at)?'<time>'+hora(s.at)+'</time>':'')+'</div>'+(cur?'<small>'+E(s.d)+'</small>':'')+'</div></div>'}).join('')+'</div></div>';
    const detAb=!!detAbiertos[String(o.id)];
    h+='<div class="pdpCard"><button type="button" class="pdpLink" data-acc="detalle" data-id="'+E(o.id)+'" style="margin-top:0">'+(detAb?'Ocultar detalle':'Ver detalle')+'</button><div class="pdpDet"'+(detAb?'':' hidden')+'>'+detalle(o)+'</div></div>';
    sheet.innerHTML=top('Seguimiento',pedidosSeg.length>1?pedidosSeg.length+' pedidos en curso':'')+'<div class="pdpBody">'+h+'</div>';
    const nb=sheet.querySelector('.pdpBody');if(nb)nb.scrollTop=y;
    /* Carrusel táctil real: deslizar horizontalmente cambia el pedido.
       Los listeners se instalan una sola vez en la hoja persistente. */
    if(!sheet.dataset.pdpSwipeReady){
      let sx=0,sy=0,started=false;
      const begin=(x,y)=>{sx=x;sy=y;started=true};
      const finish=(x,y)=>{
        if(!started)return;started=false;
        if(pedidosSeg.length<2)return;
        const dx=x-sx,dy=y-sy;
        if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.2)return;
        const next=Math.max(0,Math.min(pedidosSeg.length-1,elegido+(dx<0?1:-1)));
        if(next!==elegido){elegido=next;pintarSeguimiento()}
      };
      sheet.addEventListener('touchstart',e=>{
        const t=e.changedTouches&&e.changedTouches[0];if(t)begin(t.clientX,t.clientY);
      },{passive:true});
      sheet.addEventListener('touchend',e=>{
        const t=e.changedTouches&&e.changedTouches[0];if(t)finish(t.clientX,t.clientY);
      },{passive:true});
      sheet.addEventListener('pointerdown',e=>{
        if(e.pointerType==='mouse')begin(e.clientX,e.clientY);
      },{passive:true});
      sheet.addEventListener('pointerup',e=>{
        if(e.pointerType==='mouse')finish(e.clientX,e.clientY);
      },{passive:true});
      sheet.addEventListener('click',e=>{
        const b=e.target.closest('[data-acc="detalle"]');if(!b)return;
        const d=b.nextElementSibling;if(!d)return;
        d.hidden=!d.hidden;b.textContent=d.hidden?'Ver detalle':'Ocultar detalle';
        if(b.dataset.id)detAbiertos[b.dataset.id]=!d.hidden;
      });
      sheet.dataset.pdpSwipeReady='1';
    }
  }
  async function refrescar(){
    if(!document.querySelector('#modal .sheet.pdpTrack')){clearInterval(timer);timer=null;return}
    try{const l=await getTrackingOrders();if(l.length){const id=pedidosSeg[elegido]?.id;pedidosSeg=l;const i=l.findIndex(x=>x.id===id);elegido=i>=0?i:0;pintarSeguimiento()}}catch(e){}
  }
  window.openOrderTracking=async function(id){
    if(sinSesion()){showModal('<div class="sheet pdpSheet pdpTrack0">'+top('Seguimiento')+'<div class="pdpBody">'+vacio(RUTA,'Inicia sesión para seguir tu pedido','Así ves en qué paso va tu pedido desde cualquier teléfono.',loginBtn)+'</div></div>');return}
    showModal('<div class="sheet pdpSheet pdpTrack">'+top('Seguimiento')+'<div class="pdpBody"><div class="pdpCard" style="text-align:center;color:var(--fr-muted);font:600 14px Inter,system-ui,-apple-system,Roboto,Arial,sans-serif">Cargando tu pedido…</div></div></div>');
    const l=await getTrackingOrders();
    if(!document.querySelector('#modal .sheet.pdpTrack'))return;
    if(!l.length){document.querySelector('#modal .sheet.pdpTrack').innerHTML=top('Seguimiento')+'<div class="pdpBody">'+vacio(RUTA,'No tienes pedidos en curso','Cuando hagas un pedido, aquí verás cada paso en tiempo real.','<button type="button" class="pdpBtn light" style="width:100%!important" onclick="closeModal();openOrderHistory()">Ver mis pedidos</button>')+'</div>';return}
    pedidosSeg=l;elegido=Math.max(0,id?l.findIndex(x=>String(x.id)===String(id)):0);
    pintarSeguimiento();
    clearInterval(timer);timer=setInterval(refrescar,15000);
    try{startOrderTracking()}catch(e){}
  };

  /* ---------- Mis pedidos ---------- */
  const calificados=()=>{try{return JSON.parse(localStorage.getItem('pidemas_calificados')||'{}')||{}}catch(e){return {}}};
  function tarjeta(o){
    const s=est(o),canc=['cancelado','anulado','rechazado'].includes(s),fin=s==='entregado';
    const pill=canc?'<span class="pdpPill off">Cancelado</span>':fin?'<span class="pdpPill ok">Entregado</span>':'<span class="pdpPill">'+E(trackingLabel(o.estado))+'</span>';
    const r=calificados()[o.id];
    const n=(o.items||[]).reduce((a,x)=>a+Number(x.cantidad||1),0);
    let btns='';
    if(!fin&&!canc)btns+='<button type="button" class="pdpBtn" data-acc="seguir" data-id="'+E(o.id)+'">Ver seguimiento</button>';
    if((fin||canc)&&(o.items||[]).length)btns+='<button type="button" class="pdpBtn'+(fin&&!r?' light':'')+'" data-acc="repetir" data-id="'+E(o.id)+'">Volver a pedir</button>';
    if(fin&&!r)btns+='<button type="button" class="pdpBtn" data-acc="calificar" data-id="'+E(o.id)+'">Calificar</button>';
    return '<div class="pdpCard"><div class="pdpRow"><div style="min-width:0"><div class="pdpNeg">'+E(negNombre(o))+'</div><div class="pdpMeta">'+E(fecha(o.creado_en))+' · '+E(code(o))+'</div></div>'+pill+'</div>'+
      '<div class="pdpItems">'+E(itemsTxt(o)||'Pedido de productos')+'</div>'+
      (r?'<div class="pdpStars">Tu calificación: <b>'+'★'.repeat(Number(r)||0)+'</b></div>':'')+
      '<div class="pdpFoot"><span>'+(n?n+' producto'+(n===1?'':'s')+' · ':'')+E(pagoTxt(o.metodo_pago))+'</span><strong>'+money(o.total)+'</strong></div>'+
      '<button type="button" class="pdpLink" data-acc="detalle">Ver detalle</button><div class="pdpDet" hidden>'+detalle(o)+'</div>'+
      (btns?'<div class="pdpBtns">'+btns+'</div>':'')+'</div>';
  }
  window.openOrderHistory=async function(){
    if(sinSesion()){showModal('<div class="sheet pdpSheet">'+top('Mis pedidos')+'<div class="pdpBody">'+vacio(BOLSA,'Inicia sesión para ver tus pedidos','Tus pedidos quedan guardados en tu cuenta de Google.',loginBtn)+'</div></div>');return}
    showModal('<div class="sheet pdpSheet pdpHist">'+top('Mis pedidos')+'<div class="pdpBody"><div class="pdpCard" style="text-align:center;color:var(--fr-muted);font:600 14px Inter,system-ui,-apple-system,Roboto,Arial,sans-serif">Cargando tus pedidos…</div></div></div>');
    const h=await pdCargarHistorialPedidosCliente();
    const sheet=document.querySelector('#modal .sheet.pdpHist');if(!sheet)return;
    if(!h.length){sheet.innerHTML=top('Mis pedidos')+'<div class="pdpBody">'+vacio(BOLSA,'Aún no tienes pedidos','Explora los negocios de Piura y haz tu primer pedido.','<button type="button" class="pdpBtn" style="width:100%!important" onclick="closeModal()">Explorar la tienda</button>')+'</div>';return}
    const curso=h.filter(o=>!terminado(o)),antes=h.filter(terminado);
    sheet.innerHTML=top('Mis pedidos',h.length+' pedido'+(h.length===1?'':'s'))+'<div class="pdpBody">'+
      (curso.length?'<div class="pdpSec">En curso</div>'+curso.map(tarjeta).join(''):'')+
      (antes.length?'<div class="pdpSec">Anteriores</div>'+antes.map(tarjeta).join(''):'')+'</div>';
    sheet.onclick=e=>{
      const b=e.target.closest('[data-acc]');if(!b)return;const a=b.dataset.acc,id=b.dataset.id;
      if(a==='detalle'){const d=b.nextElementSibling;d.hidden=!d.hidden;b.textContent=d.hidden?'Ver detalle':'Ocultar detalle';return}
      if(a==='seguir'){window.openOrderTracking(id);return}
      if(a==='repetir'){try{window.pdReorder(id)}catch(_){}return}
      if(a==='calificar'){try{window.pdOpenRating(id)}catch(_){}return}
    };
  };
})();

/* «Pedido en curso» de la portada: usa los mismos pedidos de la cuenta que el Seguimiento,
   así nunca muestra un pedido que el seguimiento no tiene (por ejemplo, uno ya entregado) */
(function(){
  const FIN=['entregado','cancelado','anulado','rechazado'];
  let corriendo=false;
  async function sincronizar(){
    if(corriendo)return;corriendo=true;
    try{
      let uid=null;try{uid=pdClienteSesion&&pdClienteSesion.id}catch(e){}
      if(!uid||typeof sb==='undefined'||!sb.from)return;
      const {data,error}=await sb.from('pedidos').select('id,estado,negocio_id,total,metodo_pago,creado_en,pago_confirmado').eq('cliente_auth_id',uid).order('creado_en',{ascending:false}).limit(20);
      if(error)return;
      const act=(data||[]).find(x=>!FIN.includes(String(x.estado||'').toLowerCase()));
      let prev=null;try{prev=JSON.parse(localStorage.getItem('pidemas_last_order')||'null')}catch(e){}
      if(act)localStorage.setItem('pidemas_last_order',JSON.stringify(Object.assign({},prev&&String(prev.id)===String(act.id)?prev:{},act)));
      else localStorage.removeItem('pidemas_last_order');
      try{window.pdRenderActiveOrder&&window.pdRenderActiveOrder()}catch(e){}
    }catch(e){}finally{corriendo=false}
  }
  window.pdSincronizarPedidoEnCurso=sincronizar;
  setTimeout(sincronizar,1500);setInterval(()=>{if(!document.hidden)sincronizar()},20000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sincronizar()});
  /* Al abrir el seguimiento también se actualiza la portada */
  const t=setInterval(()=>{if(typeof window.openOrderTracking!=='function'||window.openOrderTracking.__pdSync)return;clearInterval(t);const f=window.openOrderTracking;window.openOrderTracking=async function(){const r=await f.apply(this,arguments);sincronizar();return r};window.openOrderTracking.__pdSync=true},400);
})();
