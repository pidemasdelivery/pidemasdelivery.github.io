(function(){
  const $=id=>document.getElementById(id);
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PIURA={lat:-5.1945,lng:-80.6328};
  const PIN='<svg viewBox="0 0 40 52" width="100%" height="100%" aria-hidden="true"><path d="M20 51c0 0 18-18.6 18-31A18 18 0 0 0 2 20c0 12.4 18 31 18 31z" fill="#1F1A17"/><circle cx="20" cy="20" r="7" fill="#FFFFFF"/></svg>';
  const TILES='https://tile.openstreetmap.org/{z}/{x}/{y}.png',ATTR='© OpenStreetMap';
  let Lp=null;
  function leaflet(){
    if(window.L&&L.map)return Promise.resolve(L);if(Lp)return Lp;
    Lp=new Promise((ok,ko)=>{if(!document.querySelector('link[href*="leaflet@1.9.4"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(l)}
      const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>ok(window.L);s.onerror=()=>{Lp=null;ko(new Error('No cargó el mapa'))};document.head.appendChild(s)});return Lp;
  }
  function coords(v){
    const s=decodeURIComponent(String(v||''));
    for(const re of [/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/]){const m=s.match(re);if(m){const la=Number(m[1]),ln=Number(m[2]);if(Math.abs(la)<=90&&Math.abs(ln)<=180)return {lat:la,lng:ln}}}
    return null;
  }
  const fx=n=>Number(n).toFixed(6);
  const linkDe=c=>'https://www.google.com/maps?q='+fx(c.lat)+','+fx(c.lng);
  const esCorto=v=>/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(v||''));
  async function inversa(c){
    try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=es&lat='+c.lat+'&lon='+c.lng);const j=await r.json();const a=j.address||{};
      const calle=[a.road||a.pedestrian||a.footway||a.residential,a.house_number].filter(Boolean).join(' ');
      const zona=a.neighbourhood||a.suburb||a.quarter||a.city_district||a.hamlet||'';const ciudad=a.city||a.town||a.village||a.county||'';
      return {linea:calle||zona||j.name||'',sub:[calle?zona:'',ciudad].filter(Boolean).join(', ')};
    }catch(e){return null}
  }
  async function buscar(q){
    const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es&countrycodes=pe&viewbox=-80.78,-5.08,-80.52,-5.30&q='+encodeURIComponent(q+(/piura|castilla|veintis|sullana|paita|catacaos/i.test(q)?'':', Piura')));
    const j=await r.json();return (Array.isArray(j)?j:[]).map(x=>({lat:Number(x.lat),lng:Number(x.lon),nom:(x.name||String(x.display_name).split(',')[0]),sub:String(x.display_name).split(',').slice(1,4).join(',').trim()}));
  }
  /* Selector de ubicación a pantalla completa: pdMapaElegir({titulo, centro, icono}) → {lat,lng,linea,sub} | null */
  let big=null,tRev=null,ultima=null,resolver=null;
  function elegir(o){
    o=o||{};
    return new Promise(res=>{
      if(resolver)resolver(null);resolver=res;
      let m=$('pdmpMapa');
      if(!m){m=document.createElement('div');m.id='pdmpMapa';m.hidden=true;
        m.innerHTML='<div class="hd"><button type="button" class="ic" data-a="x" aria-label="Cerrar"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M5 12l6 6M5 12l6-6"/></svg></button><b id="pdmpTit"></b></div>'+
          '<div class="bq"><div class="in"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/></svg><input id="pdmpQ" placeholder="Busca la calle o una referencia" enterkeyhint="search" autocomplete="off"></div><div class="rs" id="pdmpRs" hidden></div></div>'+
          '<div class="mz"><div class="mp" id="pdmpBig"></div><div class="sh"></div><div class="pin">'+PIN+'</div><div class="tip" id="pdmpTip">Mueve el mapa hasta el lugar</div><button type="button" class="gps" data-a="gps" aria-label="Mi ubicación"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button></div>'+
          '<div class="ft"><div class="dr"><span id="pdmpIco"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span><b id="pdmpDir">Mueve el mapa</b><small id="pdmpSub"></small></span></div><button type="button" class="ok" data-a="ok">Confirmar ubicación</button></div>';
        m.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
          if(a==='x')cerrar(null);
          if(a==='ok'&&big){const c=big.getCenter();cerrar({lat:Number(fx(c.lat)),lng:Number(fx(c.lng)),linea:ultima&&ultima.linea||'',sub:ultima&&ultima.sub||''})}
          if(a==='gps'){if(!navigator.geolocation)return;b.style.opacity=.5;navigator.geolocation.getCurrentPosition(p=>{b.style.opacity=1;big&&big.setView([p.coords.latitude,p.coords.longitude],18)},()=>{b.style.opacity=1;window.pdAviso('No se pudo obtener tu ubicación. Revisa el permiso de ubicación del navegador.')},{enableHighAccuracy:true,timeout:20000,maximumAge:0})}
          if(a==='res'){const r=JSON.parse(b.dataset.r);$('pdmpRs').hidden=true;$('pdmpQ').blur();big&&big.setView([r.lat,r.lng],18)}
        });
        let tq=null;const q=m.querySelector('#pdmpQ'),rs=m.querySelector('#pdmpRs');
        const correr=async()=>{const v=q.value.trim();if(v.length<3){rs.hidden=true;return}const k=coords(v);if(k){rs.hidden=true;big&&big.setView([k.lat,k.lng],18);return}
          rs.hidden=false;rs.innerHTML='<div class="nada">Buscando…</div>';
          try{const L2=await buscar(v);rs.innerHTML=L2.length?L2.map(r=>'<button type="button" data-a="res" data-r=\''+E(JSON.stringify({lat:r.lat,lng:r.lng}))+'\'><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span>'+E(r.nom)+'<small>'+E(r.sub)+'</small></span></button>').join(''):'<div class="nada">No encontramos esa dirección. Prueba con otra calle o mueve el mapa a mano.</div>'}catch(e){rs.innerHTML='<div class="nada">No se pudo buscar. Mueve el mapa a mano.</div>'}};
        q.addEventListener('input',()=>{clearTimeout(tq);tq=setTimeout(correr,600)});
        q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(tq);correr()}});
      }
      document.body.appendChild(m);m.hidden=false;document.documentElement.style.overflow='hidden';
      $('pdmpTit').textContent=o.titulo||'Marcar ubicación';
      $('pdmpTip').textContent=o.tip||'Mueve el mapa hasta el lugar';$('pdmpTip').style.display='';$('pdmpQ').value='';$('pdmpRs').hidden=true;
      const ini=o.centro||PIURA,z=o.centro?18:15;ultima=null;
      $('pdmpDir').textContent='Cargando mapa…';$('pdmpSub').textContent='';
      leaflet().then(L=>{
        if(!big){big=L.map('pdmpBig',{zoomControl:false}).setView([ini.lat,ini.lng],z);L.tileLayer(TILES,{maxZoom:19,attribution:ATTR}).addTo(big);
          big.on('movestart',()=>{m.classList.add('mov');$('pdmpTip').style.display='none'});big.on('moveend',()=>{m.classList.remove('mov');rev()})}
        else big.setView([ini.lat,ini.lng],z,{animate:false});
        setTimeout(()=>{big.invalidateSize();rev()},60);
      }).catch(()=>{$('pdmpDir').textContent='No se pudo cargar el mapa';$('pdmpSub').textContent='Revisa tu conexión e inténtalo de nuevo.'});
    });
  }
  function rev(){
    if(!big)return;const c=big.getCenter();$('pdmpDir').textContent='Buscando dirección…';$('pdmpSub').textContent=fx(c.lat)+', '+fx(c.lng);
    clearTimeout(tRev);tRev=setTimeout(async()=>{const r=await inversa(c);const n=big.getCenter();if(Math.abs(n.lat-c.lat)>1e-6||Math.abs(n.lng-c.lng)>1e-6)return;ultima=r;
      $('pdmpDir').textContent=r&&r.linea?r.linea:'Punto marcado en el mapa';$('pdmpSub').textContent=r&&r.sub?r.sub:fx(c.lat)+', '+fx(c.lng)},500);
  }
  function cerrar(v){const m=$('pdmpMapa');if(m)m.hidden=true;document.documentElement.style.overflow='';const r=resolver;resolver=null;if(r)r(v)}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('pdmpMapa')&&!$('pdmpMapa').hidden){e.stopPropagation();cerrar(null)}},true);
  window.pdMapaElegir=elegir;

  /* ---------- Botón «Marcar en el mapa» en cada ubicación de los formularios ---------- */
  const CAMPOS=[
    {id:'admRecojoUbicacion',dir:'admRecojoDireccion',titulo:'Lugar de recojo',icono:'ti-package'},
    {id:'admRecojoUbicacionEntrega',dir:'admRecojoEntrega',titulo:'Lugar de entrega',icono:'ti-home'},
    {id:'encGpsRecojo',dir:'encDireccionRecojo',titulo:'Lugar de recojo de la encomienda',icono:'ti-package'},
    {id:'admCompraUbicacion',dir:'admCompraDireccion',titulo:'Lugar de entrega de la compra',icono:'ti-home'},
    {id:'admCompraLugar',dir:null,titulo:'Dónde se hace la compra',icono:'ti-building-store',lugar:true},
    {id:'clienteUbicacion',dir:'clienteDireccion',titulo:'Ubicación del cliente',icono:'ti-user',ancla:'.pdcWithBtn'}
  ];
  const minis=new Map();
  function setVal(el,v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
  function pintarCampo(cfg){
    const inp=$(cfg.id),box=inp&&$('pdmpB_'+cfg.id);if(!box)return;
    const k=coords(inp.value),pv=box.querySelector('.pdmpPv'),st=box.querySelector('.pdmpSt'),bt=box.querySelector('.pdmpBt span');
    bt.textContent=k?'Cambiar en el mapa':'Marcar en el mapa';
    if(k){st.className='pdmpSt';st.innerHTML=fx(k.lat)+', '+fx(k.lng)+' · <a href="'+linkDe(k)+'" target="_blank" rel="noopener">Ver en Google Maps</a>'}
    else if(esCorto(inp.value)){st.className='pdmpSt bad';st.textContent='Este enlace corto no trae coordenadas: la tarifa no se puede calcular. Márcalo en el mapa.'}
    else{st.className='pdmpSt';st.textContent=''}
    pv.hidden=!k;
    if(k&&pv.offsetWidth)leaflet().then(L=>{
      let mm=minis.get(cfg.id);const el=pv.querySelector('.mp');
      if(!mm||mm.getContainer()!==el){mm=L.map(el,{zoomControl:false,dragging:false,touchZoom:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,tap:false}).setView([k.lat,k.lng],17);L.tileLayer(TILES,{maxZoom:19,attribution:ATTR}).addTo(mm);minis.set(cfg.id,mm)}
      else{mm.invalidateSize();mm.setView([k.lat,k.lng],17,{animate:false})}
    }).catch(()=>{});
  }
  async function abrirCampo(cfg){
    const inp=$(cfg.id);if(!inp)return;
    const r=await elegir({titulo:cfg.titulo,icono:cfg.icono,centro:coords(inp.value)});
    if(!r)return;
    const link=linkDe(r);
    if(cfg.lugar){const nombre=inp.value.replace(/https?:\/\/\S+/g,'').replace(/[\s·–-]+$/,'').trim()||[r.linea,r.sub].filter(Boolean).join(', ');setVal(inp,(nombre?nombre+' · ':'')+link)}
    else setVal(inp,link);
    const d=cfg.dir&&$(cfg.dir);if(d&&!d.value.trim()&&r.linea)setVal(d,[r.linea,r.sub].filter(Boolean).join(', '));
    pintarCampo(cfg);
  }
  function montar(){
    CAMPOS.forEach(cfg=>{
      const inp=$(cfg.id);if(!inp)return;
      if(!$('pdmpB_'+cfg.id)){
        const b=document.createElement('div');b.className='pdmpBox';b.id='pdmpB_'+cfg.id;
        b.innerHTML='<button type="button" class="pdmpBt"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg><span>Marcar en el mapa</span></button><div class="pdmpPv" hidden><div class="mp"></div><div class="pin">'+PIN+'</div></div><div class="pdmpSt"></div>';
        const anc=cfg.ancla&&inp.closest(cfg.ancla);if(anc)anc.insertAdjacentElement('afterend',b);else (inp.closest('.field')||inp.parentElement).appendChild(b);
        b.querySelector('.pdmpBt').onclick=e=>{e.preventDefault();abrirCampo(cfg)};
        b.querySelector('.pdmpPv').onclick=()=>abrirCampo(cfg);
        inp.addEventListener('input',()=>pintarCampo(cfg));
        if(cfg.lugar&&!inp.placeholder)inp.placeholder='Nombre del lugar (opcional: márcalo en el mapa)';
      }
      const f=inp.value+'|'+!!$('pdmpB_'+cfg.id).offsetWidth;if(inp.dataset.pdmpF!==f){inp.dataset.pdmpF=f;pintarCampo(cfg)}
    });
  }
  setInterval(()=>{try{montar()}catch(e){}},800);
})();
