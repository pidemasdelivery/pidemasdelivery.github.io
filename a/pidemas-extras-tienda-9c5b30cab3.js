(function(){
  const LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
  const escH=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g,'');
  const CLOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const HEART='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  const DEFAULT_ETA='25–40 min';
  const idFromOnclick=el=>{const m=String(el?.getAttribute('onclick')||'').match(/\('([^']+)'/);return m?m[1]:null};
  const findRest=id=>(typeof restaurants!=='undefined'&&Array.isArray(restaurants))?restaurants.find(x=>String(x.id)===String(id)):null;
  const restName=r=>pick(r,['nombre','nombre_negocio','razon_social'],'El negocio');
  const etaOf=r=>String((r&&r.tiempo_estimado)||'').trim()||DEFAULT_ETA;

  /* ---------- Próxima apertura: "Abre hoy 6 p. m." ---------- */
  function nextOpeningLabel(r){
    try{
      const pz=pdPausado(r);if(pz){const f=new Date(pz);return 'Pausado · vuelve a recibir pedidos a las '+f.toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'numeric',minute:'2-digit'})}
      const h=pick(r,['horario','horarios','horario_atencion','horario_atencion_negocio'],'');
      if(!h)return '';
      const now=getLimaNow();
      for(let d=0;d<=7;d++){
        const date=new Date(now);date.setDate(date.getDate()+d);
        const range=getDailySchedule(h,date);if(!range)continue;
        const op=new Date(date);op.setHours(Math.floor(range.open/60),range.open%60,0,0);
        if(op>now){
          const hh=op.getHours(),mm=op.getMinutes();
          const t=`${hh%12||12}${mm?':'+String(mm).padStart(2,'0'):''} ${hh>=12?'p. m.':'a. m.'}`;
          const day=d===0?'hoy':d===1?'mañana':'el '+['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][op.getDay()];
          return `Abre ${day} ${t}`;
        }
      }
    }catch(e){}
    return '';
  }
  window.pdNextOpeningLabel=nextOpeningLabel;

  /* ---------- Favoritos ---------- */
  const FAV_KEY='pidemas_favoritos';
  const getFavs=()=>{const f=LS.get(FAV_KEY,[]);return Array.isArray(f)?f.map(String):[]};
  function toggleFav(id){
    const f=getFavs();const i=f.indexOf(String(id));
    if(i>=0)f.splice(i,1);else f.unshift(String(id));
    LS.set(FAV_KEY,f);
    toast(i>=0?'Quitado de favoritos':'Agregado a favoritos');
    enhanceRestaurants();
  }
  window.pdToggleFav=toggleFav;

  /* ---------- Calificaciones promedio por negocio ---------- */
  let ratingMap=new Map();
  async function loadRatings(){
    try{
      const {data,error}=await sb.from('negocio_calificaciones').select('negocio_id,promedio,total');
      if(error||!Array.isArray(data))return;
      ratingMap=new Map(data.map(x=>[String(x.negocio_id),x]));
      enhanceRestaurants();
    }catch(e){}
  }

  /* ---------- Tarjetas de negocios ---------- */
  function enhanceRestaurants(){
    const el=document.getElementById('restaurants');if(!el)return;
    const favs=getFavs();
    const cards=[...el.querySelectorAll(':scope>.restaurant')];
    cards.forEach(card=>{
      const btn=card.querySelector(':scope>button:not(.pdFav)');
      const id=idFromOnclick(btn);if(!id)return;
      const r=findRest(id);if(!r)return;
      card.dataset.negocioId=id;
      card.querySelectorAll('.pdFav,.pdEta').forEach(x=>x.remove());
      const on=favs.includes(String(id));
      card.insertAdjacentHTML('afterbegin',`<button type="button" class="pdFav ${on?'is-on':''}" aria-pressed="${on}" aria-label="${on?'Quitar de favoritos':'Agregar a favoritos'}" onclick="event.stopPropagation();pdToggleFav('${escH(id)}')">${HEART}</button>`);
      const open=isRestaurantOpen(r);
      const rt=ratingMap.get(String(id));
      const stars=rt&&Number(rt.total)>=3?`<span class="pdStars">★ ${Number(rt.promedio).toFixed(1)}</span>`:'';
      const status=card.querySelector('.restaurantStatus');
      if(open){
        status?.insertAdjacentHTML('beforebegin',`<div class="pdEta">${CLOCK}<span>${escH(etaOf(r))}</span>${stars}</div>`);
      }else{
        if(stars)status?.insertAdjacentHTML('beforebegin',`<div class="pdEta">${stars}</div>`);
        const label=nextOpeningLabel(r);
        if(label&&status)status.textContent=label;
      }
    });
    // Favoritos primero, respetando el orden original del resto.
    const favCards=cards.filter(c=>favs.includes(String(c.dataset.negocioId)));
    favCards.sort((a,b)=>favs.indexOf(a.dataset.negocioId)-favs.indexOf(b.dataset.negocioId));
    const before=[...el.children].slice(0,favCards.length);
    favCards.reverse().forEach(c=>el.prepend(c));
    if(favCards.some((c,i)=>before[before.length-1-i]!==c))el.scrollLeft=0;
  }
  if(typeof window.renderRestaurants==='function'){
    const _rr=window.renderRestaurants;
    window.renderRestaurants=function(){const out=_rr.apply(this,arguments);try{enhanceRestaurants()}catch(e){console.warn('[Pidemás] negocios',e)}return out};
  }

  /* ---------- Encabezado de la carta: tiempo estimado / próxima apertura ---------- */
  let currentNegocioId=null;
  if(typeof window.abrirModalCarta==='function'){
    const _amc=window.abrirModalCarta;
    window.abrirModalCarta=function(r){
      const out=_amc.apply(this,arguments);
      try{
        currentNegocioId=r?.id??null;
        const txt=document.querySelector('#cartaModalNegocio .pdCartaTxt');
        const pill=txt?.querySelector('.pdPill');
        if(pill){
          if(isRestaurantOpen(r)) pill.insertAdjacentHTML('afterend',`<span class="pdCartaEta">${CLOCK}${escH(etaOf(r))}</span>`);
          else{const l=nextOpeningLabel(r);if(l)pill.textContent=l;}
        }
      }catch(e){}
      return out;
    };
  }

  /* ---------- Lo más pedido ---------- */
  const topCache=new Map();
  function insertTop(){
    const target=document.getElementById('cartaModalProducts');if(!target)return;
    target.querySelector('.pdTopBlock')?.remove();
    const top=topCache.get(String(currentNegocioId));if(!top||!top.length)return;
    const cards=[...target.querySelectorAll('.categoryGrid .product')];
    const used=new Set();const picked=[];
    for(const t of top){
      const pdTn=String(t.nombre_producto||''),pdM=pdTn.match(/^(.*?)\s*\(([^()]+)\)\s*$/),pdBase=pdM?pdM[1]:pdTn,pdCat=pdM?norm(pdM[2]):'';const pdOk=c=>!used.has(c)&&norm(c.querySelector('h3')?.textContent)===norm(pdBase);const c=cards.find(c=>pdOk(c)&&(!pdCat||norm(c.closest('.categoryBlock')?.querySelector('.categoryTitle')?.dataset.nombre||c.closest('.categoryBlock')?.querySelector('.categoryTitle')?.textContent).startsWith(pdCat)))||cards.find(pdOk);
      if(c){used.add(c);picked.push(c.cloneNode(true));}
      if(picked.length>=3)break;
    }
    if(!picked.length)return;
    const sec=document.createElement('section');sec.className='categoryBlock pdTopBlock';
    sec.innerHTML='<h3 class="categoryTitle">Lo más pedido</h3><div class="categoryGrid"></div>';
    picked.forEach(c=>sec.querySelector('.categoryGrid').appendChild(c));
    target.prepend(sec);
  }
  async function loadTop(id){
    if(!id)return;
    if(!topCache.has(String(id))){
      try{
        const {data,error}=await sb.rpc('productos_mas_pedidos',{p_negocio_id:id});
        topCache.set(String(id),!error&&Array.isArray(data)?data:[]);
      }catch(e){topCache.set(String(id),[]);}
    }
    if(String(currentNegocioId)===String(id))insertTop();
  }
  if(typeof window.actualizarContenidoModalCarta==='function'){
    const _acm=window.actualizarContenidoModalCarta;
    window.actualizarContenidoModalCarta=function(){const out=_acm.apply(this,arguments);try{insertTop()}catch(e){}return out};
  }
  if(typeof window.showRestaurant==='function'){
    const _sr=window.showRestaurant;
    window.showRestaurant=async function(id){currentNegocioId=id;const out=await _sr.apply(this,arguments);loadTop(id);return out};
  }

  /* ---------- Direcciones guardadas ---------- */
  const ADDR_KEY='pidemas_direcciones';
  const getAddrs=()=>{const a=LS.get(ADDR_KEY,[]);return Array.isArray(a)?a.filter(x=>x&&x.direccion):[]};
  function saveAddr(dir,ref){
    dir=String(dir||'').trim();if(!dir)return;
    const a=getAddrs().filter(x=>norm(x.direccion)!==norm(dir));
    a.unshift({direccion:dir,referencia:String(ref||'').trim()});
    LS.set(ADDR_KEY,a.slice(0,4));
  }
  if(typeof window.saveCustomerInfo==='function'){
    const _sci=window.saveCustomerInfo;
    window.saveCustomerInfo=function(){
      const out=_sci.apply(this,arguments);
      try{saveAddr(document.getElementById('cDireccion')?.value,document.getElementById('cReferencia')?.value)}catch(e){}
      return out;
    };
  }
  function pickAddr(i){
    const a=getAddrs()[i];if(!a)return;
    const d=document.getElementById('cDireccion'),r=document.getElementById('cReferencia');
    if(d){d.value=a.direccion;d.dispatchEvent(new Event('input',{bubbles:true}))}
    if(r){r.value=a.referencia||'';r.dispatchEvent(new Event('input',{bubbles:true}))}
    renderAddrs();
  }
  function forgetAddr(i){
    const a=getAddrs();a.splice(i,1);LS.set(ADDR_KEY,a);renderAddrs();
  }
  function newAddr(){
    const d=document.getElementById('cDireccion'),r=document.getElementById('cReferencia');
    if(d)d.value='';if(r)r.value='';renderAddrs();d?.focus();
  }
  window.pdPickAddr=pickAddr;window.pdForgetAddr=forgetAddr;window.pdNewAddr=newAddr;
  function renderAddrs(){
    const input=document.getElementById('cDireccion');if(!input)return;
    const field=input.closest('.field');if(!field)return;
    let wrap=document.getElementById('pdAddrWrap');
    const a=getAddrs();
    if(!a.length){wrap?.remove();return}
    if(!wrap){wrap=document.createElement('div');wrap.id='pdAddrWrap';wrap.className='pdAddrWrap';field.parentElement.insertBefore(wrap,field)}
    const cur=norm(input.value);
    wrap.innerHTML=`<span class="pdKicker">Direcciones guardadas</span><div class="pdAddrList">${a.map((x,i)=>`<button type="button" class="pdAddr ${cur&&norm(x.direccion)===cur?'is-on':''}" onclick="pdPickAddr(${i})">${PIN}<span class="pdAddrTxt"><strong>${escH(x.direccion)}</strong>${x.referencia?`<span>${escH(x.referencia)}</span>`:''}</span><span class="pdAddrDel" role="button" aria-label="Olvidar esta dirección" onclick="event.stopPropagation();pdForgetAddr(${i})">×</span></button>`).join('')}</div><button type="button" class="pdAddrNew" onclick="pdNewAddr()">+ Usar otra dirección</button>`;
  }
  if(typeof window.openCheckout==='function'){
    const _oc=window.openCheckout;
    window.openCheckout=function(){
      const out=_oc.apply(this,arguments);
      setTimeout(()=>{
        try{
          const a=getAddrs();
          const d=document.getElementById('cDireccion'),r=document.getElementById('cReferencia');
          if(a.length&&d&&!d.value.trim()){d.value=a[0].direccion;if(r&&!r.value.trim())r.value=a[0].referencia||''}
          renderAddrs();
          d?.addEventListener('input',()=>{const w=document.getElementById('pdAddrWrap');if(!w)return;const cur=norm(d.value);w.querySelectorAll('.pdAddr').forEach((b,i)=>b.classList.toggle('is-on',!!cur&&norm(getAddrs()[i]?.direccion)===cur))});
        }catch(e){console.warn('[Pidemás] direcciones',e)}
      },0);
      return out;
    };
  }

  /* ---------- Historial: estado real, volver a pedir y calificar ---------- */
  const RATED_KEY='pidemas_calificados';
  const getRated=()=>{const r=LS.get(RATED_KEY,{});return r&&typeof r==='object'?r:{}};
  async function syncHistory(){
    const h=getOrderHistory();const ids=h.map(x=>x&&x.id).filter(Boolean).slice(0,20);
    if(!ids.length)return false;
    const {data,error}=await sb.from('pedidos').select('id,estado,motorizado_id,negocio_id').in('id',ids);
    if(error||!Array.isArray(data))return false;
    const m=new Map(data.map(x=>[String(x.id),x]));let changed=false;
    h.forEach(o=>{const d=m.get(String(o?.id));if(!d)return;['estado','motorizado_id','negocio_id'].forEach(k=>{if(d[k]!=null&&d[k]!==o[k]){o[k]=d[k];changed=true}})});
    if(changed)LS.set('pidemas_order_history',h);
    return changed;
  }
  function enhanceHistory(){
    const rated=getRated();const h=getOrderHistory();
    document.querySelectorAll('#modal .pdHistCard').forEach(card=>{
      const del=card.querySelector('[onclick*="deleteOrderHistoryItem"]');
      const id=idFromOnclick(del);if(!id)return;
      const o=h.find(x=>String(x.id)===String(id));if(!o)return;
      const idx=trackingIndex(o.estado);
      const actions=card.querySelector('.pdHistActions');if(!actions)return;
      actions.querySelectorAll('.pdReorderBtn,.pdRateBtn').forEach(x=>x.remove());
      card.querySelector('.pdRated')?.remove();
      if(idx===5||idx===-1){
        if((o.items||[]).length)actions.insertAdjacentHTML('afterbegin',`<button type="button" class="pdBtnDark pdReorderBtn" onclick="pdReorder('${escH(id)}')">Volver a pedir</button>`);
      }
      if(idx===5){
        if(rated[id])actions.insertAdjacentHTML('beforebegin',`<div class="pdRated">Tu calificación: <strong>${'★'.repeat(Number(rated[id])||0)}</strong></div>`);
        else del.insertAdjacentHTML('beforebegin',`<button type="button" class="pdBtnLight pdRateBtn" onclick="pdOpenRating('${escH(id)}')">Calificar</button>`);
      }
    });
  }
  let syncing=false;
  if(typeof window.openOrderHistory==='function'){
    const _ooh=window.openOrderHistory;
    window.openOrderHistory=function(){
      const out=_ooh.apply(this,arguments);
      try{enhanceHistory()}catch(e){}
      if(!syncing){
        syncing=true;
        syncHistory().then(ch=>{syncing=false;if(ch&&document.querySelector('#modal .pdHistCard')){_ooh();enhanceHistory()}}).catch(()=>{syncing=false});
      }
      return out;
    };
  }

  window.pdReorder=async function(orderId){
    const o=getOrderHistory().find(x=>String(x.id)===String(orderId));if(!o)return;
    const items=(o.items||[]).filter(x=>x&&x.nombre);
    if(!items.length){toast('Este pedido no tiene productos para repetir.');return}
    const negId=o.negocio_id||null;
    const r=negId?findRest(negId):null;
    if(negId&&!r){toast('Este negocio ya no está disponible en Pidemás.');return}
    if(r&&!isRestaurantOpen(r)){const l=nextOpeningLabel(r);toast(`${restName(r)} está cerrado ahora.${l?' '+l+'.':''}`);return}
    if(cart.length&&!(await window.pdConfirmar('¿Reemplazar tu carrito?\nSe quitará lo que tienes ahora en el carrito.')))return;
    try{closeModal()}catch(e){}
    cart=[];saveCart();updateCart();
    if(r)await window.showRestaurant(r.id);
    const pool=(products||[]).filter(p=>negId?(p.origen==='negocio'&&String(p.negocio_id)===String(negId)):p.origen!=='negocio');
    let added=0;const missing=[];
    const realToast=window.toast;window.toast=function(){};
    try{
      for(const it of items){
        const p=pool.find(p=>it.id&&String(p.id)===String(it.id)&&(!it.origen||p.origen===it.origen))
          ||pool.find(p=>norm(pick(p,['nombre','nombre_producto'],''))===norm(it.nombre))||(()=>{const pdM=String(it.nombre||'').match(/^(.*?)\s*\(([^()]+)\)\s*$/);if(!pdM)return null;const L=pool.filter(p=>norm(pick(p,['nombre','nombre_producto'],''))===norm(pdM[1]));return L.find(p=>window.pdCategoriaDe&&norm(pdCategoriaDe(p))===norm(pdM[2]))||L[0]||null})();
        if(p&&addToCart(p.id,p.origen,Math.max(1,Number(it.cantidad||1))))added++;else missing.push(it.nombre);
      }
    }finally{window.toast=realToast}
    if(!added){toast('Los productos de ese pedido ya no están disponibles.');return}
    toast(`Agregamos ${added} producto${added===1?'':'s'} a tu carrito.${missing.length?' No disponible: '+missing.join(', ')+'.':''}`);
    if(!r)openCart();
  };

  window.pdOpenRating=function(orderId){
    const o=getOrderHistory().find(x=>String(x.id)===String(orderId));if(!o)return;
    const negName=(o.negocio_id&&getRestaurantNameById(o.negocio_id))||'el negocio';
    const stars=g=>`<div class="pdRateStars" data-group="${g}">${[1,2,3,4,5].map(n=>`<button type="button" data-v="${n}" aria-label="${n} estrella${n>1?'s':''}">★</button>`).join('')}</div>`;
    showModal(`<div class="sheet pdRateSheet"><div class="sheetTop"><h2>Califica tu pedido</h2><button class="close" onclick="closeModal()" aria-label="Cerrar">×</button></div>
      <div class="pdKicker">Pedido #${escH(String(o.id).slice(0,8).toUpperCase())}</div>
      ${o.negocio_id?`<div class="pdRateGroup"><span>¿Qué tal la comida de ${escH(negName)}?</span>${stars('negocio')}</div>`:''}
      ${o.motorizado_id?`<div class="pdRateGroup"><span>¿Qué tal el servicio del motorizado?</span>${stars('motorizado')}</div>`:''}
      <textarea id="pdRateComment" maxlength="300" placeholder="Comentario (opcional)"></textarea>
      <button type="button" class="pdRateSend" id="pdRateSend" disabled>Enviar calificación</button>
    </div>`);
    const val={negocio:0,motorizado:0};
    const need=['negocio','motorizado'].filter(g=>document.querySelector(`.pdRateStars[data-group="${g}"]`));
    const send=document.getElementById('pdRateSend');
    if(!need.length)send.disabled=false;
    document.querySelectorAll('.pdRateStars').forEach(box=>{
      box.addEventListener('click',ev=>{
        const b=ev.target.closest('button[data-v]');if(!b)return;
        const g=box.dataset.group;val[g]=Number(b.dataset.v);
        box.querySelectorAll('button').forEach(x=>x.classList.toggle('on',Number(x.dataset.v)<=val[g]));
        send.disabled=!need.every(k=>val[k]>0);
      });
    });
    send.addEventListener('click',async()=>{
      send.disabled=true;send.textContent='Enviando…';
      const row={pedido_id:o.id,negocio_id:o.negocio_id||null,motorizado_id:o.motorizado_id||null,
        estrellas_negocio:val.negocio||null,estrellas_motorizado:val.motorizado||null,
        comentario:(document.getElementById('pdRateComment')?.value||'').trim()||null};
      const {error}=await sb.from('calificaciones').insert(row);
      const rated=getRated();
      if(error&&String(error.code)!=='23505'){
        console.warn('calificaciones',error);
        toast('No se pudo enviar la calificación. Inténtalo más tarde.');
        send.disabled=false;send.textContent='Enviar calificación';return;
      }
      rated[o.id]=val.negocio||val.motorizado||5;LS.set(RATED_KEY,rated);
      toast('¡Gracias por tu calificación!');
      openOrderHistory();
    });
  };

  /* ---------- Avisos cuando cambia el estado del pedido ---------- */
  const STATUS_MSG={asignado:'Ya tienes un motorizado asignado',aceptado:'El motorizado aceptó tu pedido',en_camino:'Tu pedido va en camino',en_entrega:'El motorizado está llegando a tu dirección',entregado:'Pedido entregado. ¡Buen provecho!',cancelado:'Tu pedido fue cancelado'};
  const baseTitle=document.title;
  function checkStatus(){
    const o=getLastOrder();if(!o?.id)return;
    const st=String(o.estado||'pendiente').toLowerCase();
    const key=o.id+'|'+st;
    let last='';try{last=localStorage.getItem('pidemas_aviso_estado')||''}catch(e){}
    if(last===key)return;
    try{localStorage.setItem('pidemas_aviso_estado',key)}catch(e){}
    if(!last.startsWith(o.id+'|'))return; // primera vez que vemos este pedido: sin aviso
    const msg=STATUS_MSG[st];if(!msg)return;
    toast(msg);
    try{navigator.vibrate&&navigator.vibrate([150,80,150])}catch(e){}
    if(document.hidden){document.title='● '+msg+' · Pidemás'}
    try{
      if('Notification' in window&&Notification.permission==='granted'){
        const n=new Notification('Pidemás · Pedido #'+String(o.id).slice(0,8).toUpperCase(),{body:msg,tag:'pidemas-'+o.id});
        n.onclick=()=>{window.focus();try{openOrderTracking()}catch(e){}n.close()};
      }
    }catch(e){}
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)document.title=baseTitle});
  if(typeof window.refreshLastOrderTracking==='function'){
    const _rl=window.refreshLastOrderTracking;
    window.refreshLastOrderTracking=async function(){const out=await _rl.apply(this,arguments);try{checkStatus()}catch(e){}return out};
  }
  if(typeof window.rememberLastOrder==='function'){
    const _rlo=window.rememberLastOrder;
    window.rememberLastOrder=function(){
      const out=_rlo.apply(this,arguments);
      try{checkStatus()}catch(e){}
      // En computadoras pedimos permiso para avisar aunque la pestaña esté en segundo plano.
      try{if(!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)&&'Notification' in window&&Notification.permission==='default')Notification.requestPermission()}catch(e){}
      return out;
    };
  }

  /* ---------- Arranque ---------- */
  function boot(){
    try{enhanceRestaurants()}catch(e){}
    setTimeout(loadRatings,1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
