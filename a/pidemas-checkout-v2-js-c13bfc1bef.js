(function(){
  const $=id=>document.getElementById(id);
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SVG=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
  const IC={
    pin:SVG('<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.66 16.66l-4.24 4.24a2 2 0 0 1 -2.83 0l-4.25 -4.24a8 8 0 1 1 11.32 0z"/>'),
    user:SVG('<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"/><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>'),
    bag:SVG('<path d="M6.33 8h11.34a2 2 0 0 1 1.98 2.27l-1.25 8.5a2 2 0 0 1 -1.98 1.73h-8.84a2 2 0 0 1 -1.98 -1.73l-1.25 -8.5a2 2 0 0 1 1.98 -2.27z"/><path d="M9 11v-5a3 3 0 0 1 6 0v5"/>'),
    cash:SVG('<path d="M7 9m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"/><path d="M12 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M17 9v-2a2 2 0 0 0 -2 -2h-10a2 2 0 0 0 -2 2v6a2 2 0 0 0 2 2h2"/>')
  };
  const campo=id=>{const el=$(id);return el?el.closest('.field'):null};
  function tarjeta(icono,titulo,edit){
    const c=document.createElement('section');c.className='ckCard';
    c.innerHTML='<div class="ckHead"><i>'+icono+'</i><b>'+titulo+'</b>'+(edit?'<button type="button" class="ckEdit">'+edit+'</button>':'')+'</div><div class="ckSum"></div><div class="ckBody" hidden></div>';
    return c;
  }
  function plegable(c,abierto){
    const body=c.querySelector('.ckBody'),btn=c.querySelector('.ckEdit');
    const set=v=>{body.hidden=!v;if(btn)btn.textContent=v?'Listo':(btn.dataset.txt||'Cambiar')};
    if(btn){btn.dataset.txt=btn.textContent;btn.onclick=()=>set(body.hidden)}
    set(!!abierto);return set;
  }
  function interruptor(texto,nodo,abierto){
    const b=document.createElement('button');b.type='button';b.className='ckToggle';
    const set=v=>{nodo.hidden=!v;b.innerHTML=E(texto);b.setAttribute('aria-expanded',String(!!v))};
    b.onclick=e=>{if(e){e.preventDefault();e.stopPropagation()}set(nodo.hidden)};set(!!abierto);return b;
  }
  function negocioNombre(){
    try{const it=(cart||[]).find(x=>x.origen==='negocio');if(!it)return 'Productos Pidemás';const r=(restaurants||[]).find(x=>String(x.id)===String(it.negocio_id));return r?(r.nombre||r.nombre_negocio||''):''}catch(e){return ''}
  }
  function rehacer(){
    const sheet=document.querySelector('#modal .sheet.pdCheckout');if(!sheet||sheet.classList.contains('pdCkV2'))return;
    if(!$('cNombre'))return;
    sheet.classList.add('pdCkV2');
    const top=sheet.querySelector('.sheetTop');const n=negocioNombre();
    if(top&&n&&!top.querySelector('.ckSub')){const h=top.querySelector('h2');if(h)h.insertAdjacentHTML('beforeend','<span class="ckSub">'+E(n)+'</span>')}
    const vacioDir=!String($('cDireccion')?.value||'').trim();
    const vacioDatos=!String($('cNombre')?.value||'').trim()||!String($('cTelefono')?.value||'').trim();
    const cards=document.createElement('div');cards.className='ckCards';
    (sheet.querySelector('#pdCkItems')||top).insertAdjacentElement(sheet.querySelector('#pdCkItems')?'beforebegin':'afterend',cards);

    /* 1. Entregar en */
    const cE=tarjeta(IC.pin,'Entregar en','Cambiar');const bE=cE.querySelector('.ckBody');
    const fDir=campo('cDireccion'),fRef=campo('cReferencia'),fLoc=campo('cLat'),fDel=$('deliveryFareBox')?.closest('.field');
    const wrapAddr=$('pdAddrWrap');
    [wrapAddr,fDir,fRef].forEach(x=>{if(x)bE.appendChild(x)});
    const loc=document.createElement('div');loc.className='ckLoc';cE.appendChild(loc);
    if(fLoc){fLoc.classList.add('ckOcultoLoc');cE.appendChild(fLoc)}
    if(fDel){fDel.classList.add('ckDelivery');cE.appendChild(fDel)}
    plegable(cE,vacioDir);cards.appendChild(cE);

    /* 2. Tus datos */
    const cD=tarjeta(IC.user,'Tus datos','Editar');const bD=cD.querySelector('.ckBody');
    [campo('cNombre'),campo('cTelefono')].forEach(x=>{if(x)bD.appendChild(x)});
    plegable(cD,vacioDatos);cards.appendChild(cD);

    /* 3. Productos */
    const items=$('pdCkItems');
    if(items){const cP=document.createElement('section');cP.className='ckCard';cP.innerHTML='<div class="ckHead"><i>'+IC.bag+'</i><b>Tu pedido</b></div>';cP.appendChild(items);
      const fObs=campo('cObs');
      if(fObs){const v=!!String($('cObs')?.value||'').trim();const caja=document.createElement('div');caja.className='ckNota';caja.appendChild(fObs);cP.appendChild(interruptor('Agregar una nota para el pedido',caja,v));cP.appendChild(caja)}
      cards.appendChild(cP)}

    /* 4. Pago */
    const cG=document.createElement('section');cG.className='ckCard';cG.innerHTML='<div class="ckHead"><i>'+IC.cash+'</i><b>Pago</b></div>';
    const fPago=campo('cPago');if(fPago)cG.appendChild(fPago);
    ['cashPaymentBox','yapePaymentBox'].forEach(id=>{const x=$(id);if(x)cG.appendChild(x)});
    const fDesc=campo('cDiscountCode');
    if(fDesc){const caja=document.createElement('div');caja.className='ckCupon';cG.appendChild(caja);caja.appendChild(fDesc)}
    cards.appendChild(cG);

    /* Resúmenes que se actualizan solos */
    function pintar(){
      const dir=String($('cDireccion')?.value||'').trim(),ref=String($('cReferencia')?.value||'').trim();
      cE.querySelector('.ckSum').innerHTML=dir?'<strong>'+E(dir)+'</strong>'+(ref?E(ref):''):'<span class="ckFalta">Escribe la dirección de entrega.</span>';
      const nom=String($('cNombre')?.value||'').trim(),tel=String($('cTelefono')?.value||'').trim();
      cD.querySelector('.ckSum').innerHTML=(nom||tel)?'<strong>'+E(nom||'Sin nombre')+'</strong>'+(tel?E(tel):'<span class="ckFalta">Falta tu celular</span>'):'<span class="ckFalta">Escribe tu nombre y celular.</span>';
      const la=$('cLat')?.value,ln=$('cLng')?.value,on=!!(la&&ln);
      const st=String($('cLocationStatus')?.textContent||'');
      loc.className='ckLoc'+(on?' on':'');
      loc.innerHTML='<i>'+IC.pin+'</i><span><b>'+(on?'Ubicación lista':'Falta tu ubicación')+'</b><small>'+(on?'<a href="https://www.google.com/maps?q='+la+','+ln+'" target="_blank" rel="noopener">Ver en el mapa</a>':(/Obteniendo|Buscando/i.test(st)?E(st):'Necesaria para calcular el delivery.'))+'</small></span><button type="button" class="ckLocBtn">'+(on?'Actualizar':'Usar mi ubicación')+'</button>';
      /* Desglose de la tarifa bajo «Delivery» en el resumen */
      try{const tf=window.__pdTarifaUltima,sum=$('pdCkSummary');if(sum){const dl=[...sum.querySelectorAll('.pdLine')].find(x=>/^\s*Delivery/.test(x.textContent));let box=sum.querySelector('.ckDesg');const lines=null;/* el cliente solo ve «Delivery · km» y el monto, sin el desglose de la tarifa */const html=lines?lines.map(d=>'<div><span>'+E(d.concepto)+'</span><span>'+(d.monto<0?'− ':'')+'S/ '+Math.abs(Number(d.monto)).toFixed(2)+'</span></div>').join(''):'';if(!lines){box?.remove()}else if(dl){if(!box){box=document.createElement('div');box.className='ckDesg';dl.insertAdjacentElement('afterend',box)}if(box.dataset.h!==html){box.innerHTML=html;box.dataset.h=html}}}}catch(e){}
      const fb=$('deliveryFareBox');if(fb){const tx=fb.textContent||'';const ok=/Delivery\s*S\//.test(tx)&&!/aproximada/i.test(tx);const f=fb.closest('.field');if(f)f.style.display=ok?'none':''}
      loc.querySelector('.ckLocBtn').onclick=()=>{try{useCurrentLocation('cart')}catch(e){}setTimeout(pintar,300)};
      let mb=loc.nextElementSibling;if(!mb||!mb.classList.contains('ckMapa')){mb=document.createElement('button');mb.type='button';mb.className='ckMapa';loc.insertAdjacentElement('afterend',mb);mb.onclick=()=>marcarEnMapa(pintar)}
      mb.innerHTML=MAPA+'<span>'+(on?'¿No es aquí? Marca el lugar en el mapa':'Marcar el lugar de entrega en el mapa')+'</span>';
    }
    sheet.addEventListener('input',pintar);
    pintar();
    const iv=setInterval(()=>{if(!document.body.contains(sheet)){clearInterval(iv);return}pintar()},800);
    /* Si falta algo al confirmar, abre la tarjeta correspondiente */
    const enviar=sheet.querySelector('button.primary[onclick*="submitCartOrder"]');
    if(enviar)enviar.addEventListener('click',()=>{
      if(!String($('cNombre')?.value||'').trim()||!String($('cTelefono')?.value||'').trim()){cD.querySelector('.ckBody').hidden=false;cD.querySelector('.ckEdit').textContent='Listo';cD.scrollIntoView({behavior:'smooth',block:'center'})}
      else if(!String($('cDireccion')?.value||'').trim()){cE.querySelector('.ckBody').hidden=false;cE.querySelector('.ckEdit').textContent='Listo';cE.scrollIntoView({behavior:'smooth',block:'center'})}
    },true);
  }
  const MAPA='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg>';
  async function marcarEnMapa(pintar){
    if(!window.pdMapaElegir)return;
    const la=Number($('cLat')?.value),ln=Number($('cLng')?.value);
    const c=($('cLat')?.value&&Number.isFinite(la)&&Number.isFinite(ln))?{lat:la,lng:ln}:null;
    const r=await window.pdMapaElegir({titulo:'¿Dónde entregamos tu pedido?',icono:'ti-home',centro:c,tip:'Mueve el mapa hasta el lugar de entrega'});
    if(!r)return;
    const lat=r.lat.toFixed(7),lng=r.lng.toFixed(7);
    if($('cLat'))$('cLat').value=lat;if($('cLng'))$('cLng').value=lng;
    const st=$('cLocationStatus');if(st)st.textContent='Ubicación marcada en el mapa: '+lat+', '+lng;
    const ml=$('cMapLink');if(ml)ml.innerHTML='<a href="https://www.google.com/maps?q='+lat+','+lng+'" target="_blank" rel="noopener" style="color:var(--fr-ink);font-weight:700">Abrir ubicación en el mapa</a>';
    const d=$('cDireccion');if(d&&r.linea&&(!d.value.trim()||d.dataset.ckMapa==='1')){d.value=[r.linea,r.sub].filter(Boolean).join(', ');d.dataset.ckMapa='1';d.dispatchEvent(new Event('input',{bubbles:true}))}
    try{updateDeliveryFarePreview()}catch(e){}
    setTimeout(pintar,100);setTimeout(pintar,1500);
  }
  const o=window.openCheckout;
  if(typeof o==='function'){
    window.openCheckout=function(){const out=o.apply(this,arguments);setTimeout(()=>{try{rehacer()}catch(e){console.warn('[Pidemás] checkout',e)}},40);return out};
  }
})();
