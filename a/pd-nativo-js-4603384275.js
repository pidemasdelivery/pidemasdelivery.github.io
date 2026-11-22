/* Pidemás · comportamiento de app nativa
   1 · Instalar la app (Android: botón; iPhone: guía de «Agregar a inicio»)
   2 · Vibración corta al tocar la barra inferior, los chips y los botones principales (Android)
   3 · Las ventanas bajan animadas al cerrarlas con la ×
   4 · Deslizar hacia abajo en Inicio para actualizar los negocios
   5 · Aviso de «Sin conexión» y actualización automática al volver internet
   6 · La barra de estado del celular toma el color de lo que está arriba (oscura con ventanas abiertas)
   Nada de esto cambia las funciones existentes: solo las llama o escucha. */
(function(){
  if(window.__pdNativo)return;window.__pdNativo=true;
  const quieto=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vibrar=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
  const enlaceCarta=()=>new URLSearchParams(location.search).has('negocio');
  const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

  /* ¿Hay una ventana abierta encima de la página? (algo fijo que tapa buena parte de la pantalla) */
  function hayVentana(){
    if(document.body.classList.contains('modal-open')||document.body.classList.contains('pc-abierto'))return true;
    const W=innerWidth,H=innerHeight;
    for(const el of document.querySelectorAll('body > *')){
      if(el.id==='pdInstalar'||el.id==='pdRed'||el.id==='pdPtr'||el.matches('header,.bottom,script,style,#toast'))continue;
      const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.display==='none'||cs.visibility==='hidden'||el.hidden)continue;
      const r=el.getBoundingClientRect();if(r.width*r.height>W*H*0.45)return true;
    }
    return false;
  }

  /* ---------- 6 · Color de la barra de estado ---------- */
  let meta=document.querySelector('meta[name="theme-color"]');
  if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta)}
  const parse=c=>{const m=/rgba?\(([^)]+)\)/.exec(c);if(!m)return null;const p=m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}};
  function colorArriba(){
    const pila=document.elementsFromPoint(innerWidth/2,1);if(!pila.length)return null;
    let c={r:255,g:249,b:245};
    for(const el of pila.slice().reverse()){
      const cs=getComputedStyle(el);const k=parse(cs.backgroundColor);if(!k||k.a===0)continue;
      const a=k.a*(parseFloat(cs.opacity)||1);c={r:c.r*(1-a)+k.r*a,g:c.g*(1-a)+k.g*a,b:c.b*(1-a)+k.b*a};
    }
    const h=v=>Math.round(v).toString(16).padStart(2,'0');return '#'+h(c.r)+h(c.g)+h(c.b);
  }
  let tColor=null;
  function pintarBarra(){clearTimeout(tColor);tColor=setTimeout(()=>{const c=colorArriba();if(c&&meta.content!==c)meta.content=c},140)}
  new MutationObserver(pintarBarra).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style','open']});
  addEventListener('scroll',pintarBarra,{passive:true});addEventListener('resize',pintarBarra);
  document.addEventListener('animationend',pintarBarra,true);document.addEventListener('transitionend',pintarBarra,true);
  pintarBarra();

  /* ---------- 2 · Vibración corta al tocar ---------- */
  const TOQUE='.navbtn,button.primary,.pdtGo,.pcaGo,.pdpBtn,.phGo,.pdCkSubmit button,[class*="Chips"] button,.businessCategory,.pdCkSeg button';
  document.addEventListener('click',e=>{
    if(!e.isTrusted)return;const b=e.target.closest&&e.target.closest(TOQUE);if(!b||b.disabled)return;
    if(/agregar|añadir/i.test(b.textContent||''))return; /* al agregar ya vibra el efecto del carrito */
    vibrar(8);
  },true);

  /* ---------- 3 · Ventanas que bajan al cerrarlas con la × ---------- */
  const HOJAS='#modal .sheet,#modal .productDetailSheet,#modal .scheduleSheet,.carta-modal-sheet,.pcSheet';
  const CERRAR='.pdpX,.pcaX,.pdtX,.pdOkClose,.carta-modal-close,.pcX,button.close,[aria-label^="Cerrar"]';
  let cerrando=false;
  document.addEventListener('click',e=>{
    if(quieto||cerrando||!e.isTrusted)return;
    const b=e.target.closest&&e.target.closest(CERRAR);if(!b)return;
    const hoja=b.closest(HOJAS);if(!hoja||!hoja.animate)return;
    const fondo=hoja.parentElement&&getComputedStyle(hoja.parentElement).position==='fixed'?hoja.parentElement:null;
    e.preventDefault();e.stopImmediatePropagation();
    cerrando=true;
    const d=200,ease='cubic-bezier(.4,0,1,1)';
    const a=hoja.animate([{translate:'0 0'},{translate:'0 '+Math.max(hoja.offsetHeight,240)+'px'}],{duration:d,easing:ease,fill:'forwards'});
    const f=fondo&&fondo!==document.body?fondo.animate([{opacity:1},{opacity:0}],{duration:d,easing:'linear',fill:'forwards'}):null;
    let hecho=false;
    const terminar=()=>{if(hecho)return;hecho=true;
      try{b.click()}finally{cerrando=false}
      /* si la ventana sigue abierta (la × no cerraba), se devuelve a su lugar */
      requestAnimationFrame(()=>{try{a.cancel()}catch(_){}try{f&&f.cancel()}catch(_){}});
    };
    a.onfinish=terminar;setTimeout(terminar,d+120);
  },true);

  /* ---------- 4 · Deslizar hacia abajo para actualizar ---------- */
  const ptr=document.createElement('div');ptr.id='pdPtr';ptr.setAttribute('aria-hidden','true');
  ptr.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>';
  document.body.appendChild(ptr);
  const UMBRAL=72;let p=null,cargando=false;
  const arriba=()=>(document.scrollingElement||document.documentElement).scrollTop<=0;
  const topeHeader=()=>{const h=document.querySelector('.app>header,header');const r=h&&h.getBoundingClientRect();return r&&r.bottom>0?r.bottom:0};
  function enFijo(t){for(let e=t;e&&e!==document.body;e=e.parentElement){if(getComputedStyle(e).position==='fixed')return true}return false}
  function mostrar(dist){
    const k=Math.min(1,dist/UMBRAL),y=topeHeader()+Math.min(dist,UMBRAL+24)*0.9-30;
    ptr.style.transform='translateY('+y+'px)';ptr.style.opacity=String(Math.min(1,k*1.4));
    ptr.querySelector('svg').style.rotate=(cargando?'':(k*180)+'deg');
    ptr.classList.toggle('listo',dist>=UMBRAL);
  }
  function esconder(){ptr.animate([{opacity:ptr.style.opacity||1},{opacity:0}],{duration:180,fill:'forwards'}).onfinish=()=>{ptr.style.opacity='0';ptr.classList.remove('gira','listo');ptr.getAnimations().forEach(x=>x.cancel())}}
  document.addEventListener('touchstart',e=>{
    if(cargando||e.touches.length!==1||enlaceCarta()||!arriba()||hayVentana())return;
    const t=e.target;if(!t.closest||!t.closest('.app')||t.closest('header,input,textarea,select,[class*="Chips"],.leaflet-container')||enFijo(t))return;
    p={y0:e.touches[0].clientY,x0:e.touches[0].clientX,d:0,activo:false};
  },{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!p||e.touches.length!==1)return;
    const dy=e.touches[0].clientY-p.y0,dx=e.touches[0].clientX-p.x0;
    if(!p.activo){if(Math.abs(dy)<8)return;if(dy<0||Math.abs(dx)>Math.abs(dy)||!arriba()){p=null;return}p.activo=true;ptr.getAnimations().forEach(x=>x.cancel())}
    p.d=dy*0.55;mostrar(p.d);
  },{passive:true});
  async function soltar(){
    if(!p)return;const s=p;p=null;if(!s.activo)return;
    if(s.d<UMBRAL||typeof loadData!=='function'){esconder();return}
    cargando=true;vibrar(10);ptr.classList.remove('listo');ptr.classList.add('gira');ptr.querySelector('svg').style.rotate='';
    ptr.querySelector('svg').innerHTML='<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4v5h-5"/>';
    const t0=Date.now();
    try{await loadData()}catch(err){console.warn('Actualizar:',err)}
    await new Promise(r=>setTimeout(r,Math.max(0,650-(Date.now()-t0))));
    ptr.querySelector('svg').innerHTML='<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>';
    cargando=false;esconder();
  }
  document.addEventListener('touchend',soltar);document.addEventListener('touchcancel',soltar);

  /* ---------- 5 · Sin conexión ---------- */
  const red=document.createElement('div');red.id='pdRed';red.setAttribute('role','status');red.setAttribute('aria-live','polite');red.hidden=true;
  document.body.appendChild(red);
  let tRed=null;
  function sinRed(){clearTimeout(tRed);red.className='';red.hidden=false;
    red.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M2 2l20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.8"/><path d="M19 12.9a10 10 0 0 0-2.3-1.6"/><path d="M12 20h.01"/></svg><span>Sin conexión a internet</span>';
    vibrar([20,40,20]);pintarBarra()}
  function conRed(){if(red.hidden)return;red.className='ok';
    red.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>Conexión restablecida</span>';
    tRed=setTimeout(()=>{red.hidden=true},2400);
    if(!enlaceCarta()&&typeof loadData==='function')loadData().catch(()=>{});}
  addEventListener('offline',sinRed);addEventListener('online',conRed);
  if(navigator.onLine===false)sinRed();

  /* ---------- 1 · Instalar la app ---------- */
  const instalada=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
  const ua=navigator.userAgent||'';
  const iOS=/iphone|ipad|ipod/i.test(ua)||(/macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
  const iOSSafari=iOS&&/safari/i.test(ua)&&!/crios|fxios|edgios|opios|gsa\//i.test(ua);
  const android=/android/i.test(ua)&&!/wv\)|; wv/i.test(ua);
  const NO='pdInstalarNo',DIAS=1;let forzar=false;
  window.pdOfrecerInstalar=function(){if(instalada())return;forzar=true;intentos=0;if(card)card.hidden=true;clearTimeout(programar.t);programar.t=setTimeout(intentar,1200)};
  const descartado=()=>{const t=Number(ls.get(NO)||0);return t&&Date.now()-t<DIAS*864e5};
  let aviso=null,card=null,intentos=0;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();aviso=e;programar(400)});
  setTimeout(function(){if(!aviso&&android&&!instalada())programar(0)},3000);
  addEventListener('appinstalled',()=>{ls.set(NO,String(Date.now()+3650*864e5));if(card)card.hidden=true});
  function programar(ms){if(instalada()||(!forzar&&descartado())||card&&!card.hidden)return;clearTimeout(programar.t);programar.t=setTimeout(intentar,ms)}
  function intentar(){
    if(instalada()||(!forzar&&descartado()))return;
    if(!aviso&&!iOSSafari&&!android)return;
    if(hayVentana()||document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){if(++intentos<40)programar(1500);return}
    mostrarCard();
  }
  function mostrarCard(){
    if(!card){card=document.createElement('div');card.id='pdInstalar';card.setAttribute('role','dialog');card.setAttribute('aria-label','Instalar Pidemás');document.body.appendChild(card)}
    const icono=(document.querySelector('link[rel="apple-touch-icon"]')||{}).href;
    const ico='<span class="ico"'+(icono?' style="background-image:url(\''+icono.replace(/'/g,'%27')+'\')"':'')+'>'+(icono?'':'P')+'</span>';
    const T1=forzar?'¿Instalas Pidemás para seguir tu pedido?':'Instala Pidemás';
    if(aviso){
      card.innerHTML=ico+'<span class="tx"><b>'+T1+'</b><small>'+(forzar?'Mira tu pedido en vivo y vuelve a pedir con un toque desde tu inicio.':'Ábrela desde tu inicio, más rápida y a pantalla completa.')+'</small></span><span class="bt"><button type="button" class="si">Instalar</button><button type="button" class="no">Ahora no</button></span>';
    }else if(android){
      card.innerHTML=ico+'<span class="tx"><b>'+T1+'</b><small>Toca ⋮ (arriba a la derecha) y luego «Instalar app» o «Agregar a pantalla principal». Si ya la tienes, ábrela desde tu inicio.</small></span><span class="bt"><button type="button" class="no">Entendido</button></span>';
    }else{
      card.innerHTML=ico+'<span class="tx"><b>'+T1+'</b><small>Toca <svg class="shr" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> Compartir y luego «Agregar a inicio».</small></span><span class="bt"><button type="button" class="no">Entendido</button></span>';
    }
    card.hidden=false;
    const hd=document.querySelector('.app>header,header');const r=hd&&hd.getBoundingClientRect();
    if(r&&r.height&&r.bottom>0)card.style.top=(r.bottom+8)+'px';
    card.querySelector('.no').onclick=()=>{ls.set(NO,String(Date.now()));card.hidden=true;forzar=false};
    const si=card.querySelector('.si');
    if(si)si.onclick=async()=>{const ev=aviso;aviso=null;card.hidden=true;if(!ev)return;try{ev.prompt();const r=await ev.userChoice;if(r&&r.outcome!=='accepted')ls.set(NO,String(Date.now()))}catch(e){}};
  }
  if(iOSSafari&&!instalada())programar(400);
})();
