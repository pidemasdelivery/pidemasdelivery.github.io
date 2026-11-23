(function(){
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SV=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
  const IC={
    reloj:SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    alerta:SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5"/><path d="M12 16h.01"/>'),
    abre:SV('<path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/><path d="M10 21v-6h4v6"/>'),
    candado:SV('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    info:SV('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>')
  };
  const DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const hora=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mi=m%60,ap=h>=12?'pm':'am',h12=h%12||12;return h12+(mi?':'+String(mi).padStart(2,'0'):'')+' '+ap};
  const rango=r=>hora(r.open)+' – '+hora(r.close);
  const horarioDe=r=>{try{return pick(r,['horario','horarios','horario_atencion','horario_atencion_negocio'],'')}catch(e){return r&&r.horario||''}};
  const nombreDe=r=>{try{return pick(r,['nombre','nombre_negocio','razon_social'],'Negocio')}catch(e){return r&&r.nombre||'Negocio'}};
  const rests=()=>{try{return restaurants||[]}catch(e){return []}};
  const ahora=()=>{try{return getLimaNow()}catch(e){return new Date()}};
  const dia=(h,d)=>{try{return window.getDailySchedule(h,d)}catch(e){return null}};
  const minAhora=n=>n.getHours()*60+n.getMinutes();
  const enMin=m=>m<60?m+' min':(Math.floor(m/60)+' h'+(m%60?' '+(m%60)+' min':''));

  /* Estado actual del negocio */
  function estado(r){
    const h=horarioDe(r),n=ahora(),cur=minAhora(n);
    let abierto=false;try{abierto=isRestaurantOpen(r)}catch(e){}
    if(!String(h).trim())return {tipo:'off',pill:'Sin horario',txt:'Este negocio todavía no registró su horario.'};
    if(abierto){
      let hoy=dia(h,n);if(hoy&&hoy.tramos){const t=hoy.tramos.find(t=>cur>=t.open&&cur<t.close);if(t)hoy=t}
      let falta=hoy?hoy.close-cur:null;if(hoy&&hoy.open>hoy.close&&cur>=hoy.open)falta=1440-cur+hoy.close;
      if(falta!=null&&falta<=30)return {tipo:'warn',pill:'Cierra pronto',txt:'Recibe pedidos hasta las '+hora(hoy.close)+' (en '+enMin(falta)+').'};
      return {tipo:'on',pill:'Abierto',txt:hoy?'Recibe pedidos hasta las '+hora(hoy.close)+'.':'Recibe pedidos ahora.'};
    }
    for(let d=0;d<=7;d++){
      const f=new Date(n);f.setDate(f.getDate()+d);let r2=dia(h,f);if(!r2)continue;
      if(d===0&&r2.tramos){const t=r2.tramos.find(t=>t.open>cur);if(!t)continue;r2=t}
      if(d===0&&r2.open<=cur)continue;
      const falta=d===0?r2.open-cur:null;
      const cuando=d===0?'hoy':d===1?'mañana':'el '+DIAS[f.getDay()];
      if(falta!=null&&falta<=60)return {tipo:'warn',pill:'Abre pronto',txt:'Abre hoy a las '+hora(r2.open)+' (en '+enMin(falta)+').'};
      return {tipo:'off',pill:'Cerrado',txt:'Abre '+cuando+' a las '+hora(r2.open)+'.'};
    }
    return {tipo:'off',pill:'Cerrado',txt:'No tiene días de atención registrados.'};
  }
  window.pdEstadoHorario=estado;

  /* Hoja de horario */
  window.showRestaurantSchedule=function(id){
    const r=rests().find(x=>String(x.id)===String(id));if(!r)return;
    const h=horarioDe(r),n=ahora(),st=estado(r);
    const logo=r.logo_url||r.logo||r.imagen_logo_url||'';const nom=nombreDe(r);
    const lunes=new Date(n);lunes.setDate(n.getDate()-((n.getDay()+6)%7));
    let filas='';
    for(let i=0;i<7;i++){
      const f=new Date(lunes);f.setDate(lunes.getDate()+i);const rg=dia(h,f);const esHoy=f.getDay()===n.getDay();
      filas+='<div class="phDia'+(esHoy?' hoy':'')+(rg?'':' cerr')+'"><span>'+cap(DIAS[f.getDay()])+(esHoy?'<i class="tag">Hoy</i>':'')+'</span><em>'+(rg?(window.pdTramosTxt?pdTramosTxt(rg,hora):rango(rg)):'Cerrado')+'</em></div>';
    }
    let corte='Estos horarios ya incluyen el horario de atención de Pidemás.';try{const sem=window.pdHorarioSemana&&pdHorarioSemana();if(sem){const no=sem.filter(x=>!x.activo).map(x=>x.dia.toLowerCase());if(no.length)corte='Estos horarios ya incluyen el horario de atención de Pidemás. Pidemás no atiende '+(no.length===1?'los '+no[0]+'s':'los días: '+no.join(', '))+'.'}}catch(e){}
    const enCarta=(()=>{try{return document.getElementById('products')?.classList.contains('menu-completo')&&String(currentNegocioId||'')===String(r.id)}catch(e){return false}})()||!!document.querySelector('#cartaModalNegocio:not(.hidden) .carta-modal-body');
    showModal('<div class="sheet scheduleSheet phSheet"><div class="phTop"><span class="phLogo">'+(logo?'<img src="'+E(logo)+'" alt="" onerror="this.parentElement.textContent=\''+E(nom.charAt(0).toUpperCase())+'\'">':E(nom.charAt(0).toUpperCase()))+'</span><span class="phTit"><small>Horario de atención</small><b>'+E(nom)+'</b></span><button type="button" class="phX close" onclick="closeModal()" aria-label="Cerrar">×</button></div>'+
      '<div class="phBody"><div class="phEst '+st.tipo+'"><span class="ic">'+(st.tipo==='on'?IC.reloj:st.tipo==='warn'?IC.alerta:IC.candado)+'</span><span><b>'+(st.tipo==='on'?'Abierto ahora':st.tipo==='warn'?st.pill:'Cerrado ahora')+'</b><span>'+E(st.txt)+'</span></span></div>'+
      '<div class="phSem"><h3>Esta semana</h3>'+filas+'</div>'+
      (corte?'<div class="phNota">'+IC.info+'<span>'+E(corte)+'</span></div>':'')+'</div>'+
      '<div class="phFoot"><button type="button" class="phGo" onclick="'+(enCarta?'closeModal()':'closeModal();showRestaurant(\''+E(String(r.id))+'\')')+'">'+(enCarta?'Volver a la carta':'Ver la carta')+'</button></div></div>');
  };

  /* Aviso flotante: abre pronto / cierra pronto / cerrado */
  let tAviso=null;
  function buscarNegocio(t){return rests().slice().sort((a,b)=>nombreDe(b).length-nombreDe(a).length).find(r=>t.startsWith(nombreDe(r)))||null}
  window.mostrarAvisoHorario=function(texto){
    const box=document.getElementById('horarioAlert');if(!box)return;
    const t=String(texto||'');const r=buscarNegocio(t);const nom=r?nombreDe(r):'';
    let tipo='off',ic=IC.info,tit='Aviso',cuerpo=t,acc=[];
    let m;
    if((m=t.match(/^Pidemás cerrará en (\d+)/i))){tipo='warn';ic=IC.alerta;tit='Pidemás cierra pronto';cuerpo='Recibe pedidos solo '+enMin(Number(m[1]))+' más. Si quieres pedir, hazlo ahora.';acc=[['Pedir ahora','dk',()=>{try{const el=document.getElementById('restaurantsSection')||document.getElementById('restaurants');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}}]]}
    else if((m=t.match(/cerrará en (\d+)/i))){tipo='warn';ic=IC.alerta;tit=nom+' cierra pronto';cuerpo='Recibe pedidos solo '+enMin(Number(m[1]))+' más. Si quieres pedir, hazlo ahora.';if(r)acc=[['Pedir ahora','dk',()=>{try{showRestaurant(r.id)}catch(e){}}],['Ver horario','',()=>window.showRestaurantSchedule(r.id)]]}
    else if((m=t.match(/abrirá en (\d+)/i))){tipo='';ic=IC.abre;tit=nom+' abre pronto';cuerpo='Empieza a recibir pedidos en '+enMin(Number(m[1]))+'. Ya puedes ver su carta.';if(r)acc=[['Ver la carta','dk',()=>{try{showRestaurant(r.id)}catch(e){}}]]}
    else if(/está cerrado/i.test(t)){tipo='off';ic=IC.candado;tit=(nom||'El negocio')+' está cerrado';const st=r?estado(r):null;cuerpo='Tu pedido no puede enviarse ahora. '+(st?st.txt:'Vuelve cuando abra.');if(r)acc=[['Ver horario','dk',()=>window.showRestaurantSchedule(r.id)]]}
    else if(/Pidemás (recibe pedidos|no atiende)/i.test(t)){tipo='off';ic=IC.candado;tit=/no atiende/i.test(t)?'Hoy no atendemos':'Fuera de horario';cuerpo=t}
    box.innerHTML='<div class="phA '+tipo+'"><span class="ic">'+ic+'</span><span class="tx"><b>'+E(tit)+'</b><span>'+E(cuerpo)+'</span></span><button type="button" class="x" aria-label="Cerrar aviso">×</button></div>'+
      (acc.length?'<div class="phAcc">'+acc.map((a,i)=>'<button type="button" class="'+a[1]+'" data-i="'+i+'">'+E(a[0])+'</button>').join('')+'</div>':'')+'<div class="phBar"><i></i></div>';
    box.querySelector('.x').onclick=e=>{e.preventDefault();e.stopPropagation();cerrar()};
    box.querySelectorAll('.phAcc button').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();cerrar();try{closeModal()}catch(_){}acc[Number(b.dataset.i)][2]()});
    box.classList.remove('show');void box.offsetWidth;box.classList.add('show');
    clearTimeout(tAviso);try{clearTimeout(horarioAlertTimer)}catch(e){}
    tAviso=setTimeout(cerrar,12000);
  };
  function cerrar(){const b=document.getElementById('horarioAlert');if(b)b.classList.remove('show');clearTimeout(tAviso)}
  window.cerrarAvisoHorario=function(e){if(e){try{e.preventDefault();e.stopPropagation()}catch(_){}}cerrar()};
})();
