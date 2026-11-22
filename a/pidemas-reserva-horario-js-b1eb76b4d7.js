(function(){
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const CAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>';
  const hora=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mi=m%60;return (h%12||12)+':'+String(mi).padStart(2,'0')+' '+(h>=12?'p. m.':'a. m.')};
  const lima=()=>{try{return getLimaNow()}catch(e){return new Date()}};
  const rests=()=>{try{return restaurants||[]}catch(e){return []}};
  const nom=r=>{try{return pick(r,['nombre','nombre_negocio','razon_social'],'El negocio')}catch(e){return 'El negocio'}};
  const prog=()=>window.__pdProg||null;
  const DSEM=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],MESES=['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];
  /* «Hoy, sáb 7 nov · 9:00 a. m.» */
  function cuando(v){const f=v.fecha,n=lima();const a=new Date(n);a.setHours(0,0,0,0);const b=new Date(f);b.setHours(0,0,0,0);const dd=Math.round((b-a)/864e5);
    const dia=dd===0?'Hoy':dd===1?'Mañana':DSEM[f.getDay()];return dia+' '+f.getDate()+' '+MESES[f.getMonth()]+' · '+hora(f.getHours()*60+f.getMinutes())}
  const fin=t=>/\.$/.test(t)?t:t+'.';
  function rangoCorto(r,f){try{const g=window.pdRangoNeg&&window.pdRangoNeg(r,f);return g?'Ese día atiende de '+hora(g.open)+' a '+hora(g.close):'Ese día no atiende'}catch(e){return ''}}
  /* ¿El negocio atiende a la hora reservada? */
  function atiende(r,f){try{return typeof window.pdAtiendeEn==='function'?window.pdAtiendeEn(r,f):true}catch(e){return true}}
  /* ¿Tiene algún horario libre para reservar en los próximos días? (abierto ahora no cuenta) */
  function abiertoAhora(r){try{const f=lima();return atiende(r,f)&&(typeof pdServicioAbierto!=='function'||pdServicioAbierto())}catch(e){return false}}
  function reservarPara(id){
    window.__pdProgNegId=String(id);
    try{closeModal()}catch(e){}
    if(typeof window.pdProgramarPedido==='function')window.pdProgramarPedido();
  }
  window.pdReservarNegocio=reservarPara;

  /* En modo reserva, el estado del negocio se describe según la hora reservada */
  const estOrig=window.pdEstadoHorario;
  if(typeof estOrig==='function')window.pdEstadoHorario=function(r){
    const v=prog();if(!v||!r)return estOrig.apply(this,arguments);
    return atiende(r,v.fecha)
      ?{tipo:'on',pill:'Atiende a esa hora',tit:'Atiende en tu reserva',txt:cuando(v)}
      :{tipo:'off',pill:'No atiende a esa hora',tit:'No atiende a la hora de tu reserva',txt:'Tu reserva: '+cuando(v)+'\n'+fin(rangoCorto(r,v.fecha))};
  };

  /* Hoja de horario: aviso claro y botón para reservar dentro de su horario */
  const schOrig=window.showRestaurantSchedule;
  if(typeof schOrig==='function')window.showRestaurantSchedule=function(id){
    const out=schOrig.apply(this,arguments);
    try{
      const r=rests().find(x=>String(x.id)===String(id));if(!r)return out;
      const sh=document.querySelector('#modal .phSheet');if(!sh)return out;
      const v=prog();const foot=sh.querySelector('.phFoot');
      if(v&&atiende(r,v.fecha)){
        const est=sh.querySelector('.phEst');
        if(est){est.className='phEst on';est.innerHTML='<span class="ic">'+CAL+'</span><span><b>Atiende en tu reserva</b><span>'+E(cuando(v))+'</span></span>'}
      }
      if(v&&!atiende(r,v.fecha)){
        const est=sh.querySelector('.phEst');
        if(est){est.className='phEst off';est.innerHTML='<span class="ic">'+CAL+'</span><span><b>No atiende a la hora de tu reserva</b><span>'+E('Tu reserva: '+cuando(v)+'\n'+fin(rangoCorto(r,v.fecha))+' Elige otra hora.')+'</span></span>'}
        if(foot&&!foot.querySelector('.pdResBtn'))foot.insertAdjacentHTML('afterbegin','<button type="button" class="pdResBtn">'+CAL+' Cambiar la hora de reserva</button>');
      }else if(!v&&!abiertoAhora(r)){
        if(foot&&!foot.querySelector('.pdResBtn'))foot.insertAdjacentHTML('afterbegin','<button type="button" class="pdResBtn">'+CAL+' Reservar para cuando atienda</button>');
      }
      const b=foot&&foot.querySelector('.pdResBtn');if(b)b.onclick=e=>{e.preventDefault();reservarPara(r.id)};
    }catch(e){console.warn('[Pidemás] reserva',e)}
    return out;
  };

  /* Último control antes de enviar: la hora reservada debe estar dentro del horario del negocio */
  const subOrig=window.submitCartOrder;
  if(typeof subOrig==='function')window.submitCartOrder=async function(){
    const v=prog();
    if(v){
      try{
        if(v.fecha.getTime()<=lima().getTime()+15*60000){
          const t='La hora de tu reserva ('+cuando(v)+') ya pasó o está muy cerca. Elige otra hora.';
          try{mostrarAvisoHorario?mostrarAvisoHorario(t):toast(t)}catch(e){}
          if(typeof window.pdProgramarPedido==='function')window.pdProgramarPedido();return;
        }
        const ids=[...new Set((cart||[]).map(x=>String(x.negocio_id||'')).filter(Boolean))];
        const bad=ids.map(id=>rests().find(r=>String(r.id)===id)).filter(Boolean).find(r=>!atiende(r,v.fecha));
        if(bad){
          const t=nom(bad)+' no atiende a la hora de tu reserva ('+cuando(v)+'). '+fin(rangoCorto(bad,v.fecha))+' Elige otra hora.';
          try{toast(t)}catch(e){}
          if(typeof window.pdProgramarPedido==='function')window.pdProgramarPedido();return;
        }
      }catch(e){}
    }
    return subOrig.apply(this,arguments);
  };
})();
