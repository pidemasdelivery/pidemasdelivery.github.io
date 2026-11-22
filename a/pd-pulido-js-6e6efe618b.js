/* Pidemás · pulido de app: cuadros de carga, fotos que aparecen suave, seguimiento animado y hojas que se cierran deslizando */
(function(){
  if(window.__pdPulido)return;window.__pdPulido=true;
  const quieto=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vibrar=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};

  /* 1 · Cuadros de carga mientras llegan los negocios */
  const sk='<div class="pdSkCard" aria-hidden="true"><i></i><div><b></b><u></u><s></s></div></div>';
  function cargando(id,n){const el=document.getElementById(id);if(!el)return;if(el.querySelector('.restaurant,.product,.pdRestCard,.empty'))return;if(el.textContent.trim())return;el.innerHTML=sk.repeat(n);el.setAttribute('aria-busy','true');if(el.style.display==='none'){el.style.display='';el.dataset.pdSkOculto='1'}
    new MutationObserver((m,o)=>{if(!el.querySelector('.pdSkCard')){el.removeAttribute('aria-busy');o.disconnect()}}).observe(el,{childList:true})}
  cargando('restaurants',4);
  window.pdCuadrosCarga=cargando;

  /* Fotos que aparecen suave */
  function suave(img){if(img.__pdImg||img.complete||!img.closest('.restaurant,.product,.productDetailCard,.carta-modal-sheet,.sheet'))return;img.__pdImg=1;img.classList.add('pdImgEspera');
    const listo=()=>{img.classList.remove('pdImgEspera');img.classList.add('pdImgLista')};img.addEventListener('load',listo,{once:true});img.addEventListener('error',listo,{once:true});setTimeout(listo,3000)}
  if(!quieto)new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.tagName==='IMG')suave(n);else n.querySelectorAll&&n.querySelectorAll('img').forEach(suave)}}).observe(document.body,{childList:true,subtree:true});

  /* 4 · Seguimiento: cuando cambia el estado, el título entra, la barra avanza y el celular vibra */
  let estadoAntes=null;
  function revisarEstado(){
    const h=document.querySelector('#modal .pdpHero h3');const badge=document.querySelector('#pdActiveOrder');
    const txt=(h&&h.textContent.trim())||(badge&&badge.textContent.replace(/\s+/g,' ').trim())||null;
    if(txt&&estadoAntes&&txt!==estadoAntes&&!txt.startsWith(estadoAntes.slice(0,6))){
      const hero=document.querySelector('#modal .pdpHero');if(hero&&!quieto){hero.classList.remove('pdCambio');void hero.offsetWidth;hero.classList.add('pdCambio')}
      vibrar([30,60,30]);
    }
    if(txt)estadoAntes=txt;
  }
  let tEst=null;new MutationObserver(()=>{clearTimeout(tEst);tEst=setTimeout(revisarEstado,120)}).observe(document.body,{childList:true,subtree:true,characterData:true});

  /* 7 · Hojas que se cierran deslizando hacia abajo */
  const HOJAS='#modal .sheet,.carta-modal-sheet,.pcSheet';
  const CERRAR='.pdpX,.pcaX,.pdtX,.carta-modal-close,.pcX,button.close,[aria-label^="Cerrar"]';
  function cerrarHoja(h){const b=[...h.querySelectorAll(CERRAR)].find(x=>x.offsetParent!==null);if(b){b.click();return true}
    if(h.closest('#modal')&&typeof closeModal==='function'){closeModal();return true}if(h.classList.contains('carta-modal-sheet')&&typeof cerrarModalCarta==='function'){cerrarModalCarta();return true}return false}
  function desplazado(t,h){for(let e=t;e&&e!==h.parentElement;e=e.parentElement){if(e.scrollTop>0)return true;if(e===h)break}return false}
  let g=null;
  function inicio(x,y,t){
    if(quieto)return;const h=t.closest&&t.closest(HOJAS);if(!h)return;
    if(h.classList.contains('carta-modal-sheet')&&document.documentElement.classList.contains('pdCartaEnlace'))return;
    if(t.closest('input,textarea,select,[contenteditable],.pdpTabs,.pcaChips,.pvChips,[class*="Chips"]'))return;
    if(desplazado(t,h))return;
    g={h,x0:x,y0:y,dy:0,t0:Date.now(),activo:false};
  }
  function mover(x,y,ev){
    if(!g)return;const dx=x-g.x0,dy=y-g.y0;
    if(!g.activo){if(Math.abs(dy)<10&&Math.abs(dx)<10)return;if(dy<=0||Math.abs(dx)>Math.abs(dy)){g=null;return}g.activo=true;g.h.classList.add('pdArrastrando')}
    g.dy=Math.max(0,dy);const ahora=Date.now();g.v=(g.dy-(g.dyAnt||0))/Math.max(1,ahora-(g.tAnt||g.t0));g.dyAnt=g.dy;g.tAnt=ahora;
    g.h.style.setProperty('translate','0 '+(g.dy<120?g.dy:120+(g.dy-120)*0.85)+'px','important');
    if(ev&&ev.cancelable)ev.preventDefault();
  }
  function fin(){
    if(!g)return;const s=g;g=null;if(!s.activo)return;
    const v=(Date.now()-(s.tAnt||0))<90?(s.v||0):0;const h=s.h;h.classList.remove('pdArrastrando');h.classList.add('pdSoltando');
    if(s.dy>110||(v>0.55&&s.dy>40)){
      h.style.setProperty('translate','0 '+(h.offsetHeight+40)+'px','important');vibrar(8);
      setTimeout(()=>{cerrarHoja(h);setTimeout(()=>{h.style.removeProperty('translate');h.classList.remove('pdSoltando')},60)},230);
    }else{h.style.setProperty('translate','0 0px','important');setTimeout(()=>{h.style.removeProperty('translate');h.classList.remove('pdSoltando')},300)}
    /* evita que el final del arrastre cuente como toque en un botón */
    const anular=e=>{if(!e.isTrusted)return;e.stopPropagation();e.preventDefault();window.removeEventListener('click',anular,true)};window.addEventListener('click',anular,true);setTimeout(()=>window.removeEventListener('click',anular,true),350);
  }
  document.addEventListener('touchstart',e=>{if(e.touches.length===1)inicio(e.touches[0].clientX,e.touches[0].clientY,e.target)},{passive:true});
  document.addEventListener('touchmove',e=>{if(g&&e.touches.length===1)mover(e.touches[0].clientX,e.touches[0].clientY,e)},{passive:false});
  document.addEventListener('touchend',fin);document.addEventListener('touchcancel',fin);
  document.addEventListener('mousedown',e=>{if(e.button===0)inicio(e.clientX,e.clientY,e.target)});
  document.addEventListener('mousemove',e=>{if(g)mover(e.clientX,e.clientY,e)});
  document.addEventListener('mouseup',fin);
})();
