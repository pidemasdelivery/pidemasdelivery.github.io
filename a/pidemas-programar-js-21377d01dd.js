(function(){
  const $=id=>document.getElementById(id);
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MES=['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];
  const CAL='<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>';
  const LUNA='<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  const lima=()=>{try{return getLimaNow()}catch(e){return new Date()}};
  const hora=m=>{const h=Math.floor(m/60),mi=m%60;return (h%12||12)+':'+String(mi).padStart(2,'0')+' '+(h>=12?'p. m.':'a. m.')};
  const p2=n=>String(n).padStart(2,'0');
  const abiertoPidemas=()=>{try{return typeof pdServicioAbierto==='function'?pdServicioAbierto():true}catch(e){return true}};

  /* ---------- Modo programado ---------- */
  function leer(){try{const v=JSON.parse(sessionStorage.getItem('pd_prog')||'null');if(v&&v.iso&&new Date(v.iso).getTime()>Date.now()){const f=new Date(v.y,v.mo,v.d,v.h,v.mi,0,0);return {...v,fecha:f}}}catch(e){}return null}
  window.__pdProg=leer();window.__pdProgNegId=window.__pdProg?window.__pdProg.neg||null:null;
  function fijar(v){window.__pdProg=v;if(!v)window.__pdProgNegId=null;try{if(v)sessionStorage.setItem('pd_prog',JSON.stringify({...v,fecha:undefined}));else sessionStorage.removeItem('pd_prog')}catch(e){}refrescar()}
  window.pdCancelarProgramado=()=>fijar(null);
  /* Los negocios se ven abiertos o cerrados según la hora programada */
  const orig=window.isRestaurantOpen;
  if(typeof orig==='function')window.isRestaurantOpen=function(r,ref){return orig.call(this,r,ref||(window.__pdProg?window.__pdProg.fecha:null))};
  function refrescar(){
    document.body.classList.toggle('pp-prog',!!window.__pdProg);
    try{refreshRestaurantStatuses()}catch(e){}try{renderRestaurants()}catch(e){}
    banner();
  }
  function banner(){
    let b=$('ppBanner');const v=window.__pdProg;
    if(!v){if(b)b.hidden=true;return}
    if(!b){b=document.createElement('div');b.id='ppBanner';b.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='cambiar')abrirSlots();if(a.dataset.a==='quitar')fijar(null)})}
    const hd=document.querySelector('.app>header');if(hd&&b.previousElementSibling!==hd)hd.insertAdjacentElement('afterend',b);else if(!hd&&!b.parentElement)document.body.prepend(b);
    b.hidden=false;b.innerHTML=CAL+'<span><b>Pedido programado</b><small>'+E(v.txt)+'</small></span><button type="button" data-a="cambiar">Cambiar</button><button type="button" data-a="quitar" aria-label="Quitar">×</button>';
  }


  /* ---------- Horario de cada negocio: solo se puede reservar dentro de su jornada ---------- */
  const HKEYS=['horario','horarios','horario_atencion','horario_atencion_negocio'];
  function negociosCtx(){
    try{
      if(typeof cart==='undefined'||!Array.isArray(cart)||!cart.length||typeof restaurants==='undefined')return [];
      const ids=[...new Set(cart.map(x=>String(x.negocio_id||'')).filter(Boolean))];
      return ids.map(id=>restaurants.find(r=>String(r.id)===id)).filter(Boolean);
    }catch(e){return []}
  }
  /* Negocios para los que se reserva: los del carrito o, si está vacío, el negocio desde el que se pidió reservar */
  function negociosReserva(){
    const c=negociosCtx();if(c.length)return c;
    try{const id=window.__pdProgNegId;if(!id||typeof restaurants==='undefined')return [];const r=restaurants.find(x=>String(x.id)===String(id));return r?[r]:[]}catch(e){return []}
  }
  const nomNeg=r=>{try{return pick(r,['nombre','nombre_negocio','razon_social'],'El negocio')}catch(e){return 'El negocio'}};
  const horNeg=r=>{try{return String(pick(r,HKEYS,'')||'').trim()}catch(e){return ''}};
  function rangoNeg(r,f){const h=horNeg(r);if(!h)return undefined;try{return getDailySchedule(h,f)||null}catch(e){return undefined}}
  function dentroUno(r,f,m){
    const g=rangoNeg(r,f);if(g===undefined)return true;if(g===null)return false;
    const x=((m%1440)+1440)%1440;
    if(g.tramos)return g.tramos.some(t=>x>=t.open&&x<t.close);
    if(g.open<g.close)return x>=g.open&&x<g.close;
    if(g.open>g.close)return x>=g.open||x<g.close;
    return true;
  }
  const dentroNeg=(f,m)=>negociosReserva().every(r=>dentroUno(r,f,m));
  window.pdAtiendeEn=(r,f)=>dentroUno(r,f,f.getHours()*60+f.getMinutes());
  window.pdRangoNeg=rangoNeg;

  /* ---------- Horarios disponibles ---------- */
  function diasDisponibles(){
    const out=[],n=lima(),cur=n.getHours()*60+n.getMinutes();
    for(let i=0;i<=7&&out.length<7;i++){
      const f=new Date(n);f.setDate(n.getDate()+i);f.setHours(12,0,0,0);
      const h=window.pdHorarioDia?pdHorarioDia(f):{abre:540,ultimo:1290};if(!h)continue;
      let ini=h.abre;if(i===0)ini=Math.max(ini,Math.ceil((cur+45)/30)*30);
      const slots0=[];for(let m=Math.ceil(ini/30)*30;m<=h.ultimo;m+=30)slots0.push(m);
      const slots=slots0.filter(m=>dentroNeg(f,m));
      if(!slots.length)continue;
      const et=i===0?'Hoy':i===1?'Mañana':DIAS[f.getDay()].charAt(0).toUpperCase()+DIAS[f.getDay()].slice(1);
      out.push({f,slots,et,sub:f.getDate()+' '+MES[f.getMonth()],dia:DIAS[f.getDay()]});
    }
    return out;
  }
  let selD=0,selH=null,lista=[];
  function abrirSlots(){
    lista=diasDisponibles();if(!lista.length){const _ng=negociosReserva();const _t=_ng.length?nomNeg(_ng[0])+' no tiene horarios disponibles para reservar en los próximos 7 días.':'No hay horarios disponibles para reservar en los próximos días.';try{if(typeof mostrarAvisoHorario==='function')mostrarAvisoHorario(_t);else toast(_t)}catch(e){window.pdInfo(_t)}return}
    const v=window.__pdProg;selD=0;selH=null;
    if(v){const k=lista.findIndex(d=>d.f.toDateString()===v.fecha.toDateString());if(k>=0){selD=k;selH=v.h*60+v.mi;if(!lista[k].slots.includes(selH))selH=null}}
    let m=$('ppSlots');
    if(!m){m=document.createElement('div');m.id='ppSlots';document.body.appendChild(m);m.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
      if(a==='x'){m.hidden=true;if(!window.__pdProg)window.__pdProgNegId=null}
      if(a==='dia'){selD=+b.dataset.i;selH=null;pintar()}
      if(a==='hora'){selH=+b.dataset.m;pintar()}
      if(a==='ok'&&selH!=null){const d=lista[selD];const f=new Date(d.f);f.setHours(Math.floor(selH/60),selH%60,0,0);
        const iso=f.getFullYear()+'-'+p2(f.getMonth()+1)+'-'+p2(f.getDate())+'T'+p2(f.getHours())+':'+p2(f.getMinutes())+':00-05:00';
        const txt=(d.et==='Hoy'?'hoy':d.et==='Mañana'?'mañana '+d.dia:d.dia)+' '+d.sub+', '+hora(selH);
        const abs=d.dia+' '+d.sub+', '+hora(selH);
        m.hidden=true;$('ppCerrado')&&($('ppCerrado').hidden=true);
        fijar({neg:window.__pdProgNegId||null,iso,txt,abs,y:f.getFullYear(),mo:f.getMonth(),d:f.getDate(),h:f.getHours(),mi:f.getMinutes(),fecha:f});
        const _rn=negociosReserva();
        if(_rn.length&&!negociosCtx().length){try{toast('Listo, reservaste para '+txt+(/\.$/.test(txt)?'':'.')+' Ahora elige tus productos de '+nomNeg(_rn[0])+'.')}catch(e){}try{closeModal()}catch(e){}try{window.showRestaurant(_rn[0].id)}catch(e){}}
        else{try{toast(_rn.length?'Listo, tu pedido queda reservado para '+txt:'Listo, reservaste para '+txt+(/\.$/.test(txt)?'':'.')+' Ahora elige un negocio y arma tu pedido.')}catch(e){}}
      }})}
    m.hidden=false;pintar();
  }
  function pintar(){
    const m=$('ppSlots');if(!m)return;const d=lista[selD];
    /* se recuerda el desplazamiento para que al elegir un cajón la pantalla no salte */
    const _bd=m.querySelector('.bd'),_di=m.querySelector('.dias'),_ho=m.querySelector('.horas'),_st=_bd?_bd.scrollTop:0,_sl=_di?_di.scrollLeft:0,_re=!!_bd;
    const RELOJ='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    const _nh=negociosReserva().map(r=>{const g=rangoNeg(r,d.f);return g?'<div class="nhi">'+RELOJ+'<span><b>'+E(nomNeg(r))+'</b><small>Atiende '+(g.tramos?'de '+g.tramos.map(t=>hora(t.open)+' a '+hora(t.close)).join(' y de '):'de '+hora(g.open)+' a '+hora(g.close))+'</small></span></div>':''}).join('');
    const _hrs='<div class="hg"><div class="hgr">'+d.slots.map(s=>'<button type="button" data-a="hora" data-m="'+s+'" class="'+(s===selH?'on':'')+'">'+hora(s)+'</button>').join('')+'</div></div>';
    const _dias=lista.map((x,i)=>{const lab=(x.et==='Hoy'||x.et==='Mañana')?x.et:x.et.slice(0,3);return '<button type="button" data-a="dia" data-i="'+i+'" class="'+(i===selD?'on':'')+'"><i>'+E(lab)+'</i><b>'+x.f.getDate()+'</b><small>'+E(String(x.sub).split(' ')[1]||'')+'</small></button>'}).join('');
    m.innerHTML='<div class="bg" data-a="x"></div><div class="s"><div class="hd"><span class="ico">'+CAL+'</span><span class="tt"><b>Programar pedido</b><small>Elige cuándo quieres recibirlo</small></span><button type="button" class="x" data-a="x" aria-label="Cerrar">×</button></div><div class="bd">'+(_nh?'<div class="nh">'+_nh+'</div>':'')+
      '<div class="lb"><span class="n">'+CAL+'</span><span class="t"><b>Elige el día</b><small>Hasta 7 días de anticipación</small></span><span class="pill">Paso 1 de 2</span></div><div class="dias">'+_dias+'</div>'+
      '<div class="lb"><span class="n">'+RELOJ+'</span><span class="t"><b>Elige la hora de entrega</b><small>Es una hora aproximada</small></span><span class="pill">Paso 2 de 2</span></div><div class="horas">'+_hrs+'</div></div>'+
      '<div class="ft"><div class="sum'+(selH==null?' vacio':'')+'">'+CAL+'<span><small>Tu reserva</small><b>'+(selH==null?'Elige una hora para continuar':E(d.et+', '+d.sub+' · '+hora(selH)))+'</b></span></div><button type="button" class="bt dk" data-a="ok"'+(selH==null?' disabled':'')+'>'+(selH==null?'Elige una hora':'Confirmar reserva')+'</button></div></div>';
    if(_re){const sh=m.querySelector('.s');if(sh)sh.style.animation='none';const bd=m.querySelector('.bd'),di=m.querySelector('.dias');if(bd)bd.scrollTop=_st;if(di)di.scrollLeft=_sl}
  }
  window.pdProgramarPedido=abrirSlots;

  /* ---------- Pantalla «Estamos cerrados» ---------- */
  function semana(){
    const s=window.pdHorarioSemana?pdHorarioSemana():[];const hoy=DIAS[lima().getDay()].normalize('NFD').replace(/[̀-ͯ]/g,'');
    const h12=v=>{const m=String(v||'').match(/(\d{1,2}):(\d{2})/);return m?hora(+m[1]*60+(+m[2])):v};
    const fil=[];s.forEach(x=>{const k=x.dia.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');const val=x.activo?h12(x.abre)+' – '+h12(x.ultimo):'Cerrado';const last=fil[fil.length-1];
      if(last&&last.val===val&&!last.hoy&&k!==hoy){last.hasta=x.dia}else fil.push({desde:x.dia,hasta:null,val,hoy:k===hoy,off:!x.activo})});
    return fil.map(r=>'<div class="'+(r.hoy?'hoy':'')+'"><span>'+E(r.desde+(r.hasta?' a '+r.hasta.toLowerCase():''))+(r.hoy?' · hoy':'')+'</span><span class="'+(r.off?'off':'')+'">'+E(r.val)+'</span></div>').join('');
  }
  function pantalla(){
    if(abiertoPidemas()||window.__pdProg){const c=$('ppCerrado');if(c)c.hidden=true;return}
    const clave='pp_visto_'+lima().toDateString();let visto=false;try{visto=sessionStorage.getItem(clave)==='1'}catch(e){}
    let c=$('ppCerrado');
    if(!c){c=document.createElement('div');c.id='ppCerrado';document.body.appendChild(c);c.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;
      if(b.dataset.a==='ver'){c.hidden=true;try{sessionStorage.setItem(clave,'1')}catch(_){}}
      if(b.dataset.a==='prog'){try{sessionStorage.setItem(clave,'1')}catch(_){}abrirSlots()}})}
    document.body.classList.add('ppCerradoVisto');
    if(visto){c.hidden=true;return}
    const p=window.pdHorario&&pdHorario.proxima();const logo=document.querySelector('.pidemas-header-logo')?.getAttribute('src')||'';
    const html='<div class="in">'+(logo?'<div class="logo"><img src="'+logo+'" alt="Pidemás Delivery"></div>':'')+'<div class="luna">'+LUNA+'</div><h1>Estamos cerrados</h1>'+
      '<p class="vuelve">'+(p?'Volvemos a recibir pedidos<br><b>'+E(p.cuando+(p.cuando==='mañana'?' '+DIAS[(lima().getDay()+1)%7]:'')+' a las '+p.hora)+'</b>':'Por ahora no estamos recibiendo pedidos.')+'</p>'+
      '<div class="sem">'+semana()+'</div>'+
      '<button type="button" class="bt dk" data-a="prog">'+CAL+'Programar un pedido</button>'+
      '<button type="button" class="bt lt" data-a="ver">Ver los negocios igual</button>'+
      '<p class="nota">Puedes ver las cartas ahora. Para pedir, programa tu entrega y la enviamos apenas abramos.</p></div>';
    if(c.dataset.h!==html){c.innerHTML=html;c.dataset.h=html}
    c.hidden=false;
  }
  /* ---------- En «Tu pedido» se muestra la hora programada ---------- */
  function checkout(){
    const sh=document.querySelector('#modal .sheet.pdCkV2');if(!sh)return;let k=sh.querySelector('.ppCk');const v=window.__pdProg;
    if(!v){k?.remove();return}
    if(!k){k=document.createElement('div');k.className='ppCk';const ref=sh.querySelector('.ckBody,.ckCard')?.closest('.ckCard')||sh.children[1];(ref?ref.parentElement:sh).insertBefore(k,ref||null);k.addEventListener('click',e=>{if(e.target.closest('button'))abrirSlots()})}
    let fu='';try{const bad=negociosReserva().find(r=>!dentroUno(r,v.fecha,v.h*60+v.mi));if(bad)fu=nomNeg(bad)+' no atiende a esa hora'}catch(e){}
    const h='<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg><span><b>'+(fu?'Revisa el horario':'Entrega programada')+'</b><small>'+E(fu||v.txt)+'</small></span><button type="button">Cambiar</button>';
    if(k.dataset.h!==h){k.innerHTML=h;k.dataset.h=h}
    const btn=sh.querySelector('button.primary[onclick*="submitCartOrder"] span');if(btn&&/Confirmar pedido/.test(btn.textContent))btn.textContent='Programar pedido';
  }
  /* Al terminar el pedido se sale del modo programado */
  const sub=window.submitCartOrder;
  if(typeof sub==='function')window.submitCartOrder=async function(){const v=window.__pdProg;const r=await sub.apply(this,arguments);
    try{const t=$('modal')?.innerText||'';if(v&&/enviado|registrado/i.test(t)){const s=document.querySelector('#modal .sheet');if(s&&!s.querySelector('.ppOk')){const d=document.createElement('div');d.className='ppCk ppOk';d.style.margin='12px 0';d.innerHTML=CAL+'<span><b>Pedido programado</b><small>Para '+E(v.txt)+(String(v.txt||'').endsWith('.')?'':'.')+' El negocio lo verá y lo preparará para esa hora.</small></span>';const h2=s.querySelector('h2,.sheetTop');(h2&&h2.parentElement===s?h2:s.firstElementChild).insertAdjacentElement('afterend',d)}fijar(null)}}catch(e){}
    return r};
  window.pdProgMarca=()=>window.__pdProg?{iso:window.__pdProg.iso,txt:window.__pdProg.abs||window.__pdProg.txt}:null;
  function todo(){try{pantalla();banner();checkout()}catch(e){}}
  setTimeout(()=>{refrescar();todo()},600);setInterval(todo,1500);
  new MutationObserver(()=>{clearTimeout(todo.t);todo.t=setTimeout(checkout,60)}).observe(document.documentElement,{childList:true,subtree:true});
})();
