/* Código de entrega en el seguimiento · Calificación por enlace (?calificar=) */
(function(){
  if(window.__pdPedTienda)return;window.__pdPedTienda=1;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const C=new Map(),pend=new Set();
  window.pdCodigoHtml=function(o){
    if(!o||!o.id||!o.negocio_id||['entregado','cancelado','anulado','rechazado'].includes(String(o.estado||'').toLowerCase()))return '';
    const id=String(o.id);
    if(!C.has(id)&&!pend.has(id)){pend.add(id);Promise.resolve(sb.rpc('codigo_entrega',{p_pedido:id})).then(r=>{C.set(id,r&&!r.error&&r.data?String(r.data):'')}).catch(()=>C.set(id,'')).finally(()=>pend.delete(id))}
    const c=C.get(id);if(!c)return '';
    return '<div class="pdpCard pdCodEnt"><div><b>Tu código de entrega</b><small>Dáselo al motorizado solo cuando tengas tu pedido en la mano.</small></div><strong>'+E(c)+'</strong></div>';
  };
  async function calificar(id){
    let r;try{r=await sb.rpc('pedido_para_calificar',{p_pedido:id})}catch(e){r={error:e}}
    const o=r&&!r.error&&(Array.isArray(r.data)?r.data[0]:r.data);
    if(!o){toast('No encontramos ese pedido.');return}
    if(o.ya_calificado){toast('¡Este pedido ya fue calificado! Gracias.');return}
    if(String(o.estado)!=='entregado'){toast('Podrás calificar cuando el pedido sea entregado.');return}
    const stars=g=>'<div class="pdRateStars" data-group="'+g+'">'+[1,2,3,4,5].map(n=>'<button type="button" data-v="'+n+'" aria-label="'+n+' estrella'+(n>1?'s':'')+'">★</button>').join('')+'</div>';
    showModal('<div class="sheet pdRateSheet"><div class="sheetTop"><h2>Califica tu pedido</h2><button class="close" onclick="closeModal()" aria-label="Cerrar">×</button></div>'
      +'<div class="pdKicker">Pedido #'+E(String(o.id).slice(0,8).toUpperCase())+'</div>'
      +(o.negocio_id?'<div class="pdRateGroup"><span>¿Qué tal el pedido de '+E(o.negocio_nombre||'el negocio')+'?</span>'+stars('negocio')+'</div>':'')
      +(o.motorizado_id?'<div class="pdRateGroup"><span>¿Qué tal el servicio'+(o.motorizado_nombre?' de '+E(String(o.motorizado_nombre).split(' ')[0]):' del motorizado')+'?</span>'+stars('motorizado')+'</div>':'')
      +'<textarea id="pdRateComment" maxlength="300" placeholder="Comentario (opcional)"></textarea><button type="button" class="pdRateSend" id="pdRateSend" disabled>Enviar calificación</button></div>');
    const val={negocio:0,motorizado:0},need=['negocio','motorizado'].filter(g=>document.querySelector('.pdRateStars[data-group="'+g+'"]')),send=document.getElementById('pdRateSend');
    if(!need.length)send.disabled=false;
    document.querySelectorAll('.pdRateStars').forEach(box=>box.addEventListener('click',ev=>{const b=ev.target.closest('button[data-v]');if(!b)return;const g=box.dataset.group;val[g]=+b.dataset.v;box.querySelectorAll('button').forEach(x=>x.classList.toggle('on',+x.dataset.v<=val[g]));send.disabled=!need.every(k=>val[k]>0)}));
    send.addEventListener('click',async()=>{send.disabled=true;send.textContent='Enviando…';
      const {error}=await sb.from('calificaciones').insert({pedido_id:o.id,negocio_id:o.negocio_id||null,motorizado_id:o.motorizado_id||null,estrellas_negocio:val.negocio||null,estrellas_motorizado:val.motorizado||null,comentario:(document.getElementById('pdRateComment')?.value||'').trim()||null});
      if(error&&String(error.code)!=='23505'){toast('No se pudo enviar la calificación. Inténtalo más tarde.');send.disabled=false;send.textContent='Enviar calificación';return}
      try{const k='pidemas_calificados',m=JSON.parse(localStorage.getItem(k)||'{}');m[o.id]=val.negocio||val.motorizado||5;localStorage.setItem(k,JSON.stringify(m))}catch(_){}
      closeModal();toast('¡Gracias por tu calificación!')});
  }
  const id=(new URLSearchParams(location.search).get('calificar')||'').trim();
  if(/^[0-9a-f-]{36}$/i.test(id)){
    try{const u=new URL(location.href);u.searchParams.delete('calificar');history.replaceState(history.state,'',u.pathname+u.search+u.hash)}catch(_){}
    const go=()=>setTimeout(()=>calificar(id),900);
    if(document.readyState==='complete')go();else addEventListener('load',go,{once:true});
  }
})();
