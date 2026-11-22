(function(){
  const $=id=>document.getElementById(id);
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.66 16.66l-4.24 4.24a2 2 0 0 1 -2.83 0l-4.25 -4.24a8 8 0 1 1 11.32 0z"/></svg>';
  const RELOJ='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>';
  const enlace=()=>(new URLSearchParams(location.search).get('negocio')||'').trim();
  function direccion(){
    const app=document.querySelector('.app');if(!app)return;
    let b=document.querySelector('.piDir');
    if(enlace()){b?.remove();return}
    if(!b){b=document.createElement('button');b.type='button';b.className='piDir';b.onclick=()=>{try{pdAbrirCuentaCliente()}catch(e){}};const h=app.querySelector(':scope>header');(h||app.firstChild)?.insertAdjacentElement(h?'afterend':'beforebegin',b)}
    let d={};try{d=window.pdDatosClienteGuardados?window.pdDatosClienteGuardados():{}}catch(e){}
    const txt=d.direccion||'';
    b.innerHTML='<i>'+PIN+'</i><span><small>Entregar en</small><b>'+(txt?E(txt):'Agrega tu dirección de entrega')+'</b></span><em>›</em>';
  }
  function orden(){
    const cat=$('businessCategoriesSection'),rest=$('restaurantsSection');
    if(cat&&rest&&cat.compareDocumentPosition(rest)&Node.DOCUMENT_POSITION_PRECEDING)rest.insertAdjacentElement('beforebegin',cat);
  }
  function negocios(){
    let lista=[];try{lista=restaurants||[]}catch(e){}
    document.querySelectorAll('#restaurants .restaurant').forEach(card=>{
      const id=card.dataset.negocioId;const r=lista.find(x=>String(x.id)===String(id))||{};
      const nombre=card.querySelector('h3')?.textContent||r.nombre||'';
      if(!card.querySelector('.piLogo')){const l=document.createElement('div');l.className='piLogo';const logo=r.logo_url||r.logo||r.imagen_logo_url||'';l.innerHTML=logo?'<img src="'+E(logo)+'" alt="" onerror="this.remove()">':E(nombre.trim().charAt(0).toUpperCase());card.prepend(l)}
      if(!card.querySelector('.piMeta')){
        const cat=card.querySelector(':scope>p')?.textContent||'';const eta=card.querySelector(':scope>.pdEta span')?.textContent||'';const dist=card.querySelector(':scope>.restaurantDistance')?.textContent||'';
        const m=document.createElement('div');m.className='piMeta';m.innerHTML=[cat?E(cat):'',eta?RELOJ+' '+E(eta):'',dist?E(dist.replace(/^\W+/,'')):''].filter(Boolean).join(' · ');
        card.querySelector('h3')?.insertAdjacentElement('afterend',m);
      }
      const st=card.querySelector('.restaurantStatus');card.classList.toggle('cerrado',!!st&&!st.classList.contains('open'));
      if(!card.dataset.piClick){card.dataset.piClick='1';card.addEventListener('click',e=>{if(e.target.closest('.pdFav,button'))return;card.querySelector(':scope>button:not(.pdFav)')?.click()})}
    });
  }
  function stock(){document.querySelectorAll('#products .productBody>div').forEach(x=>{if(/^\s*Stock:/i.test(x.textContent))x.classList.add('pcaStockViejo')})}

  /* ---- Orden tipo app: buscador propio, pedido en curso arriba, sin portada ---- */
  const LUPA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>';
  const DIANA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path><circle cx="12" cy="12" r="8"></circle></svg>';
  function estructura(){
    const app=document.querySelector('.app');if(!app)return;
    const dir=document.querySelector('.piDir');
    let bus=document.querySelector('.piBuscar');const inp=$('search');
    if(!bus&&inp){bus=document.createElement('label');bus.className='piBuscar';bus.innerHTML=LUPA;bus.appendChild(inp);}
    /* En la carta de un negocio: primero la tarjeta del negocio y debajo el buscador */
    const cabNeg=$('productsSectionHead');const enNegocio=!!(cabNeg&&cabNeg.querySelector('.pcaHead'));
    if(bus)bus.classList.toggle('piBuscarAbajo',enNegocio);
    if(enNegocio&&bus){
      if(cabNeg.nextElementSibling!==bus)cabNeg.insertAdjacentElement('afterend',bus);
      return;
    }
    const ancla=dir||app.querySelector(':scope>header');
    if(bus&&ancla&&ancla.nextElementSibling!==bus)ancla.insertAdjacentElement('afterend',bus);
    const act=$('pdActiveOrder');if(act&&bus&&bus.nextElementSibling!==act)bus.insertAdjacentElement('afterend',act);
    const head=$('nearbySectionHead');
    if(head&&!head.querySelector('.piCerca')){const b=document.createElement('button');b.type='button';b.className='piCerca';b.innerHTML=DIANA+'Cerca de mí';b.onclick=()=>{try{enableNearbyBusinesses()}catch(e){}};head.appendChild(b)}
  }
  /* Negocios abiertos primero */
  function abiertosPrimero(){
    const box=$('restaurants');if(!box)return;
    const cards=[...box.querySelectorAll(':scope>.restaurant')];
    const ab=cards.filter(c=>!c.classList.contains('cerrado')),ce=cards.filter(c=>c.classList.contains('cerrado'));
    const orden=[...ab,...ce];if(orden.some((c,i)=>cards[i]!==c))orden.forEach(c=>box.appendChild(c));
  }
  /* Íconos de línea para las categorías (sin emojis) */
  const ICO={'':'layout-grid','Restaurantes':'tools-kitchen-2','Comida criolla':'soup','Pizzerías':'pizza','Pollerías':'meat','Hamburgueserías':'burger','Comida rápida':'sausage','Sangucherías':'baguette','Paviferías':'meat','Cevicherías':'fish','Chifas':'bowl-chopsticks','Sushi y comida japonesa':'fish','Parrillas y anticuchos':'grill','Heladerías':'ice-cream','Cafeterías':'coffee','Juguerías':'cup','Dulcerías y pastelerías':'cake','Panaderías':'bread','Bodegas y minimarkets':'shopping-cart','Fruterías y verdulerías':'apple','Carnicerías':'meat','Licorerías':'bottle','Farmacias y boticas':'pill','Ropa y moda':'shirt','Calzado y zapatillas':'shoe','Accesorios y bisutería':'shopping-bag','Tecnología':'device-laptop','Celulares y accesorios':'device-mobile','Belleza y cuidado personal':'brush','Hogar y decoración':'home','Ferreterías':'tool','Deportes':'ball-football','Bebés y maternidad':'baby-carriage','Florerías y regalos':'flower','Mascotas':'paw','Librerías y útiles escolares':'book','Jugueterías':'horse-toy','Lavanderías':'wash-machine'};
  function categorias(){
    document.querySelectorAll('#businessCategories .businessCategory').forEach(b=>{
      const m=String(b.getAttribute('onclick')||'').match(/selectBusinessCategory\('([^']*)'\)/);const k=m?m[1]:null;if(k===null)return;
      const ic=b.querySelector('.catIcon');if(!ic||ic.querySelector('i.ti')||window.__piSinFuente)return;ic.dataset.emoji=ic.textContent;ic.innerHTML='<i class="ti ti-'+(ICO[k]||'building-store')+'" aria-hidden="true"></i>';
    });
  }
  /* "1 disponibles" → "1 disponible" */
  function plurales(){['restaurantCount','productCount'].forEach(id=>{const e=$(id);if(e&&/^1 disponibles$/.test(e.textContent.trim()))e.textContent='1 disponible'})}
  /* Inicio: en lugar de repetir los productos de cada negocio, «Pedir de nuevo» */
  function marcarProductos(){const s=$('products')?.closest('section');if(s)s.classList.add('piProductos')}
  function enInicio(){const p=$('products');const q=String($('search')?.value||'').trim();return !enlace()&&!(p&&p.classList.contains('menu-completo'))&&!q}
  function pedirDeNuevo(){
    marcarProductos();
    document.body.classList.toggle('piInicio',enInicio());
    let h=[];try{h=JSON.parse(localStorage.getItem('pidemas_order_history')||'[]')}catch(e){}
    h=(Array.isArray(h)?h:[]).filter(o=>o&&(o.items||[]).length&&['entregado'].includes(String(o.estado||'').toLowerCase())).slice(0,6);
    let sec=document.querySelector('.piRepetir');
    if(!h.length||!enInicio()){sec?.remove();return}
    if(!sec){sec=document.createElement('section');sec.className='piRepetir';$('restaurantsSection')?.insertAdjacentElement('afterend',sec)}
    let lista=[];try{lista=restaurants||[]}catch(e){}
    sec.innerHTML='<h2>Pedir de nuevo</h2><div class="piRepList">'+h.map(o=>{const r=lista.find(x=>String(x.id)===String(o.negocio_id));return '<div class="piRep"><b>'+E(r?r.nombre:(o.negocio_id?'Negocio':'Productos Pidemás'))+'</b><small>'+E((o.items||[]).map(x=>Number(x.cantidad||1)+' × '+x.nombre).join(', '))+'</small><div class="piRepPie"><strong>S/ '+Number(o.total||0).toFixed(2)+'</strong><button type="button" data-rep="'+E(o.id)+'">Pedir otra vez</button></div></div>'}).join('')+'</div>';
    sec.onclick=e=>{const b=e.target.closest('[data-rep]');if(b)try{window.pdReorder(b.dataset.rep)}catch(_){}};
  }
  /* Menú de abajo: Inicio · Buscar · Mis pedidos · Perfil */
  function menu(){
    const nav=document.querySelector('.bottom nav');if(!nav||nav.dataset.pi)return;nav.dataset.pi='1';
    const btns=[...nav.querySelectorAll('.navbtn')];
    const seg=btns.find(b=>/openOrderTracking/.test(b.getAttribute('onclick')||''));
    const mk=(txt,svg,fn)=>{const b=document.createElement('button');b.type='button';b.className='navbtn';b.innerHTML='<svg class="pdNavIco" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+svg+'</svg><span>'+txt+'</span>';b.onclick=fn;return b};
    const buscar=mk('Buscar','<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>',()=>{try{closeModal()}catch(e){}window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>$('search')?.focus(),250)});
    const perfil=mk('Perfil','<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"></path><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>',()=>{try{pdAbrirCuentaCliente()}catch(e){}});
    if(btns[0])btns[0].insertAdjacentElement('afterend',buscar);
    if(seg)seg.replaceWith(perfil);else nav.appendChild(perfil);
    const pintarPerfil=()=>{let on=false;try{on=!!pdClienteSesion}catch(e){}perfil.classList.toggle('piConSesion',on)};pintarPerfil();setInterval(pintarPerfil,2000);
  }
  /* Si la fuente de íconos no carga, se vuelve a los emojis en gris para que nunca queden vacíos */
  setTimeout(()=>{try{document.fonts.load('20px "tabler-icons"').catch(()=>{}).then(()=>{const ok=[...document.fonts].some(f=>String(f.family).replace(/["']/g,'')==='tabler-icons'&&f.status==='loaded');if(!ok){window.__piSinFuente=true;document.querySelectorAll('#businessCategories .catIcon[data-emoji]').forEach(ic=>{ic.textContent=ic.dataset.emoji;ic.style.filter='grayscale(1)'})}})}catch(e){}},5000);

  /* ---- Filtros: Categoría ▾ · Abiertos · Cerca de mí ---- */
  const GRUPOS=[['Comida',['Restaurantes','Comida criolla','Pizzerías','Pollerías','Hamburgueserías','Comida rápida','Sangucherías','Paviferías','Cevicherías','Chifas','Sushi y comida japonesa','Parrillas y anticuchos','Heladerías','Cafeterías','Juguerías','Dulcerías y pastelerías','Panaderías']],['Mercado',['Bodegas y minimarkets','Fruterías y verdulerías','Carnicerías','Licorerías']],['Tiendas',['Farmacias y boticas','Ropa y moda','Calzado y zapatillas','Accesorios y bisutería','Tecnología','Celulares y accesorios','Belleza y cuidado personal','Hogar y decoración','Ferreterías','Deportes','Bebés y maternidad','Florerías y regalos','Mascotas','Librerías y útiles escolares','Jugueterías']],['Servicios',['Lavanderías']]];
  const EMO={};try{(BUSINESS_CATEGORY_OPTIONS||[]).forEach(([n,e])=>EMO[n]=e)}catch(e){}
  let soloAbiertos=false,cercaOn=false;
  window.__pdCerca=function(on){cercaOn=!!on;if(on)soloAbiertos=true;filtros();aplicarAbiertos()};
  const catActual=()=>{try{return selectedBusinessCategory||''}catch(e){return ''}};
  const GRID='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>';
  const icono=k=>k===''?'<span style="color:inherit;display:flex">'+GRID+'</span>':window.__piSinFuente?'<span style="filter:grayscale(1)">'+(EMO[k]||'')+'</span>':'<i class="ti ti-'+(ICO[k]||'building-store')+'" aria-hidden="true"></i>';
  function conteos(){const c={};let l=[];try{l=restaurants||[]}catch(e){}l.forEach(r=>{let k='';try{k=normalizeBusinessCategory(r)}catch(e){k=r.categoria_negocio||''}c[k]=(c[k]||0)+1});return {c,total:l.length}}
  function filtros(){
    const head=$('nearbySectionHead');if(!head)return;
    let f=document.querySelector('.piFiltros');
    if(!f){f=document.createElement('div');f.className='piFiltros';head.insertAdjacentElement('afterend',f)}
    const cat=catActual();
    f.innerHTML='<button type="button" class="piChip'+(cat?' on':'')+'" data-f="cat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>'+(cat?E(cat)+'<span class="x" data-f="limpiar">×</span>':'Categorías ▾')+'</button>'+
      '<button type="button" class="piChip'+(soloAbiertos?' on':'')+'" data-f="abiertos">Abiertos</button>'+
      '<button type="button" class="piChip'+(cercaOn?' on':'')+'" data-f="cerca">'+DIANA+'Cerca</button>';
    f.onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;const a=b.dataset.f;
      if(a==='limpiar'){e.stopPropagation();try{selectBusinessCategory('')}catch(_){}filtros();return}
      if(a==='cat'){hojaCategorias();return}
      if(a==='abiertos'){soloAbiertos=!soloAbiertos;filtros();aplicarAbiertos();return}
      if(a==='cerca'){if(cercaOn){cercaOn=false;filtros();aplicarAbiertos()}else{try{enableNearbyBusinesses()}catch(_){}}}};
  }
  function aplicarAbiertos(){
    const box=$('restaurants');if(!box)return;let vis=0;
    const cards=[...box.querySelectorAll(':scope>.restaurant')];const dist=c=>{const d=c.querySelector('.restaurantDistance');return d?parseFloat(d.textContent):NaN};
    const pasa=c=>!(soloAbiertos&&c.classList.contains('cerrado'));
    let top=null;if(cercaOn){top=new Set(cards.filter(c=>pasa(c)&&!isNaN(dist(c))).sort((x,y)=>dist(x)-dist(y)).slice(0,5))}
    cards.forEach(c=>{const sinDist=isNaN(dist(c));const ocultar=!pasa(c)||(top&&!top.has(c)&&!(sinDist&&!soloAbiertos));if(ocultar)c.style.setProperty('display','none','important');else c.style.removeProperty('display');if(!ocultar)vis++});
    let m=document.querySelector('.piSinRes');
    if(!vis&&box.querySelector('.restaurant')){if(!m){m=document.createElement('div');m.className='piSinRes';box.insertAdjacentElement('afterend',m)}m.textContent=soloAbiertos?'No hay negocios abiertos en este momento.':'No hay negocios en esta categoría.'}else m?.remove();
  }
  function hojaCategorias(){
    const {c,total}=conteos(),cat=catActual();
    const fila=(k,n,cnt)=>'<button type="button" class="row'+(cat===k?' on':'')+'" data-cat="'+E(k)+'"><span class="ic">'+icono(k)+'</span>'+E(n)+'<small>'+(cnt!=null?cnt+' negocio'+(cnt===1?'':'s'):'')+'</small></button>';
    let h='<div class="rows">'+fila('','Todas',total)+'</div>';
    GRUPOS.forEach(([g,lista])=>{const con=lista.filter(k=>c[k]);if(con.length)h+='<span class="grp">'+g+'</span><div class="rows">'+con.map(k=>fila(k,k,c[k])).join('')+'</div>'});
    try{showModal('<div class="sheet piCatSheet"><div class="pcTopC"><h2>Categorías</h2><button type="button" onclick="closeModal()" aria-label="Cerrar">×</button></div><div class="pcBodyC">'+h+'</div></div>')}catch(e){return}
    const s=document.querySelector('#modal .piCatSheet');
    if(s)s.onclick=e=>{const b=e.target.closest('[data-cat]');if(!b)return;try{closeModal()}catch(_){}try{selectBusinessCategory(b.dataset.cat)}catch(_){}setTimeout(()=>{filtros();$('restaurantsSection')?.scrollIntoView({behavior:'smooth',block:'start'})},60)};
  }
  function todo(){try{direccion();estructura();orden();negocios();abiertosPrimero();categorias();filtros();aplicarAbiertos();plurales();pedirDeNuevo();menu();stock()}catch(e){console.warn('[Pidemás] inicio',e)}}
  const env=(n)=>{const f=window[n];if(typeof f!=='function')return;window[n]=function(){const r=f.apply(this,arguments);try{todo()}catch(e){}return r}};
  env('renderRestaurants');env('pdActualizarCuentaCliente');env('renderProducts');env('renderBusinessCategories');env('selectBusinessCategory');env('volverMenuPrincipal');env('cerrarModalCarta');
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='search')setTimeout(pedirDeNuevo,30)});
  todo();document.documentElement.classList.remove('piHomePre');setTimeout(todo,800);setTimeout(todo,2500);
  /* Al guardar el perfil se actualiza la dirección mostrada */
  document.addEventListener('click',e=>{if(e.target.closest('#pdGoogleAuthOverlay'))setTimeout(direccion,1500)},true);
})();
