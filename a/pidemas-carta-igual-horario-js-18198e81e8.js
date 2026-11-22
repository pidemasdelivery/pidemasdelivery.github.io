(function(){
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SV=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
  const IC={
    reloj:SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    alerta:SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5"/><path d="M12 16h.01"/>'),
    candado:SV('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    flecha:SV('<path d="M9 6l6 6-6 6"/>')
  };
  function estadoDe(r){
    try{if(typeof window.pdEstadoHorario==='function')return window.pdEstadoHorario(r)}catch(e){}
    let a=false;try{a=isRestaurantOpen(r)}catch(e){}
    return a?{tipo:'on',pill:'Abierto',txt:'Recibe pedidos ahora.'}:{tipo:'off',pill:'Cerrado',txt:'Ahora no recibe pedidos.'};
  }
  function armar(r){
    const modal=document.getElementById('cartaModalNegocio');if(!modal||!r)return;
    const nombre=String(r.nombre||r.nombre_negocio||r.razon_social||'Negocio');
    const ini=E(nombre.charAt(0).toUpperCase());
    /* Logo en cuadro redondeado, con la inicial si no hay imagen */
    const id=modal.querySelector('.pdCartaId');
    if(id&&!id.querySelector('.pcLogo')){
      const img=id.querySelector('.pdCartaLogo');const src=img?(img.getAttribute('src')||''):'';
      const box=document.createElement('span');box.className='pcLogo';
      if(src){const im=document.createElement('img');im.alt='';im.src=src;im.onerror=function(){box.textContent=nombre.charAt(0).toUpperCase()};box.appendChild(im)}else box.textContent=nombre.charAt(0).toUpperCase();
      id.insertBefore(box,id.firstChild);
    }
    /* Tarjeta de estado: toca para abrir el horario */
    const body=modal.querySelector('.carta-modal-body');
    if(body&&!body.querySelector('.pcEst')){
      const st=estadoDe(r);
      const tit=st.tit||(st.tipo==='on'?'Abierto ahora':st.tipo==='warn'?st.pill:'Cerrado ahora');
      const ic=st.tipo==='on'?IC.reloj:st.tipo==='warn'?IC.alerta:IC.candado;
      const b=document.createElement('button');b.type='button';b.className='pcEst '+st.tipo;
      b.setAttribute('aria-label','Ver horario de atención de '+nombre);
      b.innerHTML='<span class="ic">'+ic+'</span><span class="tx"><b>'+E(tit)+'</b><span>'+E(st.txt)+'</span></span><span class="go">Horario'+IC.flecha+'</span>';
      b.onclick=function(){try{window.showRestaurantSchedule(r.id)}catch(e){}};
      body.insertBefore(b,body.firstChild);
    }
    /* Pie blanco con borde, como el del horario */
    const bar=document.getElementById('pdCartaCartBar');
    if(bar&&!bar.parentElement.classList.contains('pcFoot')){
      const foot=document.createElement('div');foot.className='pcFoot';
      bar.parentElement.insertBefore(foot,bar);foot.appendChild(bar);
    }
  }
  if(typeof window.abrirModalCarta==='function'){
    const prev=window.abrirModalCarta;
    window.abrirModalCarta=function(r){
      const out=prev.apply(this,arguments);
      try{armar(r)}catch(e){console.warn('[Pidemás] carta',e)}
      return out;
    };
  }
})();
