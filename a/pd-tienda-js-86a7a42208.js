/* Clave secreta de cada pedido (solo en este teléfono): permite ver el código de entrega */
window.pdGuardarTokenPedido=function(id,t){try{const k='pd_tokens_pedido',m=JSON.parse(localStorage.getItem(k)||'{}');m[String(id)]=t;const ks=Object.keys(m);if(ks.length>60)ks.slice(0,ks.length-60).forEach(x=>delete m[x]);localStorage.setItem(k,JSON.stringify(m))}catch(_){}};
window.pdTokenPedido=function(id){try{return JSON.parse(localStorage.getItem('pd_tokens_pedido')||'{}')[String(id)]||null}catch(_){return null}};
const SUPABASE_URL='https://escxesvzndmyfuteawey.supabase.co';
const SUPABASE_KEY='sb_publishable_pCP210JJcN3NP3a6Y2c--w_c7C0PjaU';
// Evita que una petición HTTP de Supabase quede pendiente indefinidamente.
const pidemasFetchConTimeout=async(input,init={})=>{
  const controller=new AbortController();
  const externo=init.signal;
  const timer=setTimeout(()=>controller.abort(new DOMException('La conexión con Supabase superó 15 segundos.','TimeoutError')),15000);
  if(externo){if(externo.aborted)controller.abort(externo.reason);else externo.addEventListener('abort',()=>controller.abort(externo.reason),{once:true});}
  try{return await fetch(input,{...init,signal:controller.signal});}
  finally{clearTimeout(timer);}
};
/* Sesión propia de la tienda: no se mezcla con la del Admin, Negocio o Motorizado abiertos en el mismo navegador */
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{global:{fetch:pidemasFetchConTimeout},auth:{storageKey:'pidemas-tienda-cliente',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

/* Acceso de clientes con Google. No concede permisos de Pidemás ni de negocio. */
let pdClienteSesion=null;

function pdCerrarCuentaCliente(){const overlay=document.getElementById('pdGoogleAuthOverlay');if(overlay)overlay.hidden=true;}
function pdActualizarCuentaCliente(user){
  pdClienteSesion=user||null;
  const btn=document.getElementById('pdCustomerAccountBtn');
  const login=document.getElementById('pdGoogleSignInBtn');
  const logout=document.getElementById('pdGoogleSignOutBtn');
  const userBox=document.getElementById('pdGoogleAuthUser');
  const desc=document.getElementById('pdGoogleAuthDescription');
  const profileBtn=document.getElementById('pdGoogleProfileBtn');
  const profileForm=document.getElementById('pdGoogleProfileForm');
  if(btn){btn.classList.toggle('pdLogged',!!user);btn.textContent=user?(String(user.user_metadata?.full_name||user.user_metadata?.name||'C').trim().charAt(0).toUpperCase()||'C'):'♙';btn.title=user?(user.email||'Mi cuenta'):'Mi cuenta';}
  if(login)login.hidden=!!user;
  if(logout)logout.hidden=!user;
  if(profileBtn)profileBtn.hidden=!user;
  if(!user&&profileForm)profileForm.hidden=true;
  if(userBox){userBox.hidden=!user;userBox.innerHTML=user?'<strong>'+esc(user.user_metadata?.full_name||user.user_metadata?.name||'Cliente Pidemás')+'</strong>'+esc(user.email||'') : '';}
  if(desc)desc.textContent=user?'Has iniciado sesión en Pidemás.':'Inicia sesión para guardar tus datos y consultar tus pedidos.';
}




(async function pdInicializarAuthCliente(){
  try{
    const {data,error}=await sb.auth.getSession();if(error)throw error;
    pdActualizarCuentaCliente(data.session?.user||null);
    sb.auth.onAuthStateChange((_event,session)=>{
      pdActualizarCuentaCliente(session?.user||null);
      if(!session?.user){try{localStorage.removeItem('pidemas_order_history');}catch(e){}}
    });
    const params=new URLSearchParams(window.location.search);
    if(params.has('code')){const pdNeg=(params.get('negocio')||'').trim();window.history.replaceState({},document.title,window.location.pathname+(pdNeg?'?negocio='+encodeURIComponent(pdNeg):'')+window.location.hash);}
  }catch(e){console.warn('No se pudo recuperar la sesión del cliente:',e);}
})();


// Cálculo de distancia por carretera sin Google ni API Key.
// Se utiliza OSRM sobre OpenStreetMap para obtener la ruta en vehículo.
let restaurants=[], products=[], cart=[], productCategories=[], allProductCategories=[];
let selectedRestaurantCategories=null;
let selectedBusinessCategory='';
let customerNearbyCoords=null;
const BUSINESS_CATEGORY_OPTIONS=[['Restaurantes','🍽️'],['Comida criolla','🍲'],['Pizzerías','🍕'],['Pollerías','🍗'],['Hamburgueserías','🍔'],['Comida rápida','🌭'],['Sangucherías','🥪'],['Paviferías','🍖'],['Cevicherías','🐟'],['Chifas','🥡'],['Sushi y comida japonesa','🍣'],['Parrillas y anticuchos','🍢'],['Heladerías','🍦'],['Cafeterías','☕'],['Juguerías','🥤'],['Dulcerías y pastelerías','🧁'],['Panaderías','🥖'],['Bodegas y minimarkets','🛒'],['Fruterías y verdulerías','🥑'],['Carnicerías','🥩'],['Licorerías','🍾'],['Farmacias y boticas','💊'],['Ropa y moda','👕'],['Calzado y zapatillas','👟'],['Accesorios y bisutería','👜'],['Tecnología','💻'],['Celulares y accesorios','📱'],['Belleza y cuidado personal','💄'],['Hogar y decoración','🏠'],['Ferreterías','🔧'],['Deportes','⚽'],['Bebés y maternidad','🍼'],['Florerías y regalos','💐'],['Mascotas','🐶'],['Librerías y útiles escolares','📚'],['Jugueterías','🧸'],['Lavanderías','🧺']];
let currentDeliveryCost=0;
let currentDeliveryDistanceKm=null;
let appliedDeliveryDiscount=null;
const CART_STORAGE_KEY='pidemas_cart_v1';

function loadCart(){
  try{const saved=JSON.parse(localStorage.getItem(CART_STORAGE_KEY)||'[]');cart=Array.isArray(saved)?saved:[];}catch(e){cart=[]}
  updateCart();
}
function saveCart(){try{localStorage.setItem(CART_STORAGE_KEY,JSON.stringify(cart));}catch(e){}}


const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const pick=(o,keys,def='')=>{for(const k of keys) if(o?.[k]!==undefined&&o[k]!==null&&o[k]!=='') return o[k];return def};

async function loadData(){
  /* Carta por enlace: no cargar la tienda general encima de la carta */
  if((new URLSearchParams(location.search).get('negocio')||'').trim()){return abrirCartaDesdeEnlace()}
  const [r,p,s,c]=await Promise.all([
    sb.from('negocios').select('*').eq('activo',true).order('nombre',{ascending:true}),
    sb.from('productos_negocio').select('*').eq('disponible',true).order('orden',{ascending:true}),
    sb.from('productos_stock').select('*').eq('disponible',true).gt('stock',0).order('nombre',{ascending:true}),
    sb.from('categorias_negocio').select('*').order('orden',{ascending:true})
  ]);
  restaurants=(r.data||[]).filter(n=>n&&n.visible_admin!==false); /* Pidemás puede ocultar un negocio de la tienda */
  allProductCategories=c.data||[]; productCategories=allProductCategories.filter(x=>x.activo!==false);
  // Solo se publican en la Tienda los productos cuyo negocio está activo.
  // Esto evita que un negocio oculto siga apareciendo a través de su carta.
  const negociosActivos=new Set(restaurants.map(x=>String(x.id)));
  const productosNegocioActivos=(p.data||[])
    .filter(x=>negociosActivos.has(String(x.negocio_id||'')))
    .map(x=>({...x,origen:'negocio'}));
  products=productosNegocioActivos;
  renderBusinessCategories(); renderRestaurants(); renderProducts();
  if(r.error||p.error||s.error||c.error) console.warn(r.error,p.error,s.error,c.error);
}

function parseHorario(horario){
  const raw=String(horario||'').trim();
  if(!raw) return null;
  const clean=raw.toLowerCase().replace(/\u00a0/g,' ').replace(/\./g,'').replace(/\s+/g,' ').trim();
  // Separar únicamente por rangos. No usar "a" sola porque rompe "am"/"pm".
  const parts=clean.split(/\s*(?:-|–|—)\s*|\s+(?:a|hasta)\s+/i).filter(Boolean);
  if(parts.length<2) return null;
  function toMinutes(value){
    value=String(value).trim();
    const m=value.match(/(\d{1,2})(?::(\d{1,2}))?\s*(am|pm|a m|p m)?/i);
    if(!m) return null;
    let h=Number(m[1]), min=Number(m[2]||0);
    const ap=(m[3]||'').replace(/\s/g,'').toLowerCase();
    if(ap==='pm' && h<12) h+=12;
    if(ap==='am' && h===12) h=0;
    if(h>23 || min>59) return null;
    return h*60+min;
  }
  const open=toMinutes(parts[0]);
  const close=toMinutes(parts[1]);
  if(open===null || close===null) return null;
  return {open,close};
}

function getLimaNow(){
  // La disponibilidad de los negocios se calcula siempre con la hora de Piura/Lima,
  // independientemente de la zona horaria configurada en el teléfono o navegador.
  const ahora=new Date();
  const partes=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Lima',
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false
  }).formatToParts(ahora);
  const v={};
  partes.forEach(x=>{if(x.type!=='literal')v[x.type]=x.value});
  return new Date(Number(v.year),Number(v.month)-1,Number(v.day),Number(v.hour)%24,Number(v.minute),Number(v.second));
}

function dayKeyFromDate(date){
  return ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][date.getDay()];
}

function getDailySchedule(horario, date=new Date()){
  const raw=String(horario||'').trim();
  if(!raw) return null;
  const wanted=dayKeyFromDate(date);

  // También admite un horario guardado como JSON por el panel de negocio.
  try{
    const obj=JSON.parse(raw);
    if(obj && typeof obj==='object' && !Array.isArray(obj)){
      const value=obj[wanted] ?? obj[wanted.normalize('NFD').replace(/[\u0300-\u036f]/g,'')];
      if(value===false || value===null || value===undefined || value==='') return null;
      if(typeof value==='string') return parseHorario(value);
      if(typeof value==='object'){
        const abierto=value.abierto ?? value.activo ?? value.open;
        if(abierto===false) return null;
        const texto=value.horario || value.horas || (value.abre && value.cierra ? `${value.abre}-${value.cierra}` : '');
        return parseHorario(texto);
      }
    }
  }catch(e){}

  const dayAliases={
    lunes:'lunes',martes:'martes',miercoles:'miercoles','miércoles':'miercoles',
    jueves:'jueves',viernes:'viernes',sabado:'sabado','sábado':'sabado',domingo:'domingo'
  };
  const lines=raw.split(/\n|;|\s*\|\s*/).map(x=>x.trim()).filter(Boolean);
  const dayLines=lines.filter(line=>{
    const m=line.match(/^([^=:]+)\s*[:=]\s*(.+)$/);
    if(!m) return false;
    const key=m[1].trim().toLowerCase();
    return !!dayAliases[key];
  });

  // Si el campo contiene días, solo se usa el día actual.
  if(dayLines.length){
    const line=dayLines.find(line=>{
      const m=line.match(/^([^=:]+)\s*[:=]\s*(.+)$/);
      return m && dayAliases[m[1].trim().toLowerCase()]===wanted;
    });
    if(!line) return null;
    const m=line.match(/^([^=:]+)\s*[:=]\s*(.+)$/);
    return parseHorario(m[2]);
  }

  // Compatibilidad con un horario simple antiguo sin días.
  return parseHorario(raw);
}



function pdPausado(r){try{const t=r&&r.pausado_hasta?new Date(r.pausado_hasta).getTime():0;return t>Date.now()?t:0}catch(e){return 0}}
function isRestaurantOpen(r, referenceDate=null){
  if(!referenceDate&&pdPausado(r))return false;
  const horario=pick(r,['horario','horarios','horario_atencion','horario_atencion_negocio'],'');
  const now=referenceDate || getLimaNow();
  const range=getDailySchedule(horario,now);
  if(!range) return false;

  const current=now.getHours()*60+now.getMinutes();
  if(range.open<range.close) return current>=range.open && current<range.close;
  if(range.open>range.close) return current>=range.open || current<range.close;
  return true;
}

// Muestra "Abre pronto" cuando faltan 60 minutos o menos para la próxima apertura.
function isRestaurantOpeningSoon(r, referenceDate=null){
  const horario=pick(r,['horario','horarios','horario_atencion','horario_atencion_negocio'],'');
  const now=referenceDate || getLimaNow();
  if(isRestaurantOpen(r,now)) return false;
  for(let d=0; d<=7; d++){
    const date=new Date(now);
    date.setDate(date.getDate()+d);
    const range=getDailySchedule(horario,date);
    if(!range) continue;
    const opening=new Date(date);
    opening.setHours(Math.floor(range.open/60),range.open%60,0,0);
    const minutes=(opening.getTime()-now.getTime())/60000;
    if(minutes>0) return minutes<=60;
  }
  return false;
}

function refreshRestaurantStatuses(){
  renderRestaurants();
}

function normalizeBusinessCategory(r){
  const raw=String(pick(r,['categoria_negocio','categoria_comercial','tipo_negocio','categoria'],'')).trim().toLocaleLowerCase('es');
  return BUSINESS_CATEGORY_OPTIONS.find(([name])=>name.toLocaleLowerCase('es')===raw)?.[0] || raw;
}
// Los negocios de comida y bebidas muestran "Ver carta"; las demás categorías, "Ver productos".
function businessCatalogButtonLabel(r){
  const category=normalizeBusinessCategory(r).toLocaleLowerCase('es');
  const foodCategories=['restaurantes','pizzerías','pollerías','paviferías','cevicherías','chifas','heladerías','cafeterías','juguerías','dulcerías y pastelerías','bodegas y minimarkets'];
  return foodCategories.includes(category) ? 'Ver carta' : 'Ver productos';
}
function renderBusinessCategories(){
 const el=document.getElementById('businessCategories');if(!el)return;
 el.innerHTML=[['','✨','Todos'],...BUSINESS_CATEGORY_OPTIONS.map(([n,i])=>[n,i,n])].map(([value,icon,label])=>`<button type="button" class="businessCategory ${selectedBusinessCategory===value?'active':''}" onclick="selectBusinessCategory('${value.replace(/'/g,"\'")}')"><span class="catIcon">${icon}</span><span>${label}</span></button>`).join('');
}
function selectBusinessCategory(value){
  // Si se elige una categoría desde la carta de un negocio, volver al listado.
  const productsEl=document.getElementById('products');
  if(productsEl && productsEl.classList.contains('menu-completo')) volverMenuPrincipal();
  selectedBusinessCategory=value;
  renderBusinessCategories();
  const restaurantsSection=document.getElementById('restaurantsSection');
  const categoriesSection=document.getElementById('businessCategoriesSection');
  const heading=document.getElementById('businessesHeading');
  const nearbyButton=document.getElementById('nearbyButton');
  const nearbySectionHead=document.getElementById('nearbySectionHead');
  const restaurantsGrid=document.getElementById('restaurants');
  // Al filtrar por categoría, mover los resultados debajo de los chips.
  // La sección de cercanía vuelve arriba al seleccionar "Todos".
  if(value){
    if(nearbySectionHead) nearbySectionHead.style.display='';
    if(restaurantsGrid) restaurantsGrid.style.display='';
    if(heading) heading.textContent=value;
    if(nearbyButton) nearbyButton.classList.add('hidden');
    if(restaurantsSection && categoriesSection && categoriesSection.parentNode){
      categoriesSection.parentNode.insertBefore(restaurantsSection, categoriesSection.nextSibling);
    }
    renderRestaurants();
    // Mantener fija la posición de la página: los resultados aparecen debajo de las categorías sin saltar el scroll.
  }else{
    if(nearbySectionHead) nearbySectionHead.style.display='none';
    if(restaurantsGrid) restaurantsGrid.style.display='none';
    if(heading) heading.textContent='Negocios cerca de ti';
    if(nearbyButton) nearbyButton.classList.remove('hidden');
    const app=document.querySelector('.app');
    if(restaurantsSection && categoriesSection && app) app.insertBefore(restaurantsSection,categoriesSection);
    renderRestaurants();
    // Al volver a 'Todos', conservar también la posición actual de desplazamiento.
  }
}
function restaurantCoords(r){const lat=Number(pick(r,['latitud','latitude','lat'],NaN)),lng=Number(pick(r,['longitud','longitude','lng','lon'],NaN));return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{latitude:lat,longitude:lng}:null}
function distanceKm(a,b){const rad=n=>n*Math.PI/180;const dLat=rad(b.latitude-a.latitude),dLng=rad(b.longitude-a.longitude);const x=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLng/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function nearbyMsg(t){const st=document.getElementById('nearbyStatus');if(st)st.textContent=t||'';}

function enableNearbyBusinesses(){
 const btn=document.getElementById('nearbyButton');
 if(!navigator.geolocation){nearbyMsg('Tu dispositivo no permite obtener la ubicación.');return;}
 if(btn)btn.disabled=true;
 nearbyMsg('Buscando tu ubicación…');
 navigator.geolocation.getCurrentPosition(pos=>{
   customerNearbyCoords={latitude:pos.coords.latitude,longitude:pos.coords.longitude};
   if(btn)btn.disabled=false;nearbyMsg('');
   renderRestaurants();try{window.__pdCerca&&window.__pdCerca(true)}catch(e){}
 },err=>{
   if(btn)btn.disabled=false;
   nearbyMsg(err.code===1?'No se concedió permiso para usar tu ubicación.':'No se pudo obtener tu ubicación.');
   try{window.__pdCerca&&window.__pdCerca(false)}catch(e){}
 },{enableHighAccuracy:true,timeout:12000,maximumAge:120000});
}

function renderRestaurants(list=null){
  list=(list||restaurants).filter(r=>!selectedBusinessCategory||normalizeBusinessCategory(r)===selectedBusinessCategory);
  if(customerNearbyCoords)list=[...list].sort((a,b)=>{const ca=restaurantCoords(a),cb=restaurantCoords(b);if(!ca&&!cb)return 0;if(!ca)return 1;if(!cb)return -1;return distanceKm(customerNearbyCoords,ca)-distanceKm(customerNearbyCoords,cb)});
  const openCount=list.filter(r=>isRestaurantOpen(r)).length;
  document.getElementById('restaurantCount').textContent=list.length+' disponibles';

  const el=document.getElementById('restaurants');
  if(!list.length){
    el.innerHTML='<div class="empty" style="grid-column:1/-1">No hay negocios disponibles todavía.</div>';
    return;
  }

  el.innerHTML=list.map(r=>{
    const name=pick(r,['nombre','nombre_negocio','razon_social'],'Restaurante');
    const logo=pick(r,['logo_url','logo','imagen_logo_url','imagen_logo'],'');
    const abierto=isRestaurantOpen(r);
    const abrePronto=!abierto && isRestaurantOpeningSoon(r);
    const logoHtml=logo
      ? `<div class="restaurantLogoWrap"><img class="restaurantLogo" src="${esc(logo)}" alt="Logo de ${esc(name)}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
      : '';

    return `<div class="restaurant ${abierto?'':'closedRestaurant'}">
      ${logoHtml}
      <h3>${esc(name)}</h3>
      ${normalizeBusinessCategory(r)?`<p>${esc(normalizeBusinessCategory(r))}</p>`:''}
      ${customerNearbyCoords&&restaurantCoords(r)?`<div class="restaurantDistance">${distanceKm(customerNearbyCoords,restaurantCoords(r)).toFixed(1)} km aprox.</div>`:''}
      ${abierto
        ? `<div class="restaurantStatus open">Abierto</div><button onclick="showRestaurant('${r.id}')">${businessCatalogButtonLabel(r)}</button>`
        : `<div class="restaurantStatus closedLight">${abrePronto?'Abre pronto':'Cerrado'}</div><button type="button" class="closedScheduleButton" onclick="showRestaurantSchedule('${r.id}')">Ver horario</button>`}
    </div>`;
  }).join('');
}







function getProductStock(p){
  const raw=pick(p,['stock','stock_actual','cantidad_stock','existencias','cantidad_disponible'],null);
  if(raw===null || raw==='') return null;
  const n=Number(raw);
  return Number.isFinite(n)?Math.max(0,n):null;
}
function getOfficialMenuInfo(p){
  if(!p || p.origen!=='negocio') return null;
  const rid=String(p.negocio_id||'');
  const name=String(p.nombre||p.nombre_producto||'').trim();
  const n=String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

  const peraId='623072f5-fafb-4519-b3aa-5354082ad836';
  const cjotasId='658f5cc7-0bc8-436d-af4b-39101e5e6012';

  const pera={
    'platos':['Pavo con tallarines','Pavo con chifles','Pavo con ensalada','Pavo con tallarines + chifles','Pavo con tallarines + ensalada','Pavo con chifles + ensalada'],
    'complementos':['Sandwich','Aguadito','Tamal de maiz','Tamal de choclo','Papa rellena','Chifles'],
    'bebidas':['Té, Anís, Manzanilla','Café','Leche','Gaseosa 1 1/2 Lt.','Gaseosa 1/2 Lt.','Agua mineral','Vaso chicha morada'],
    'postres':['Budín','Leche asada','Repollito']
  };
  const cjotas={
    'ceviches':['Filete','Caballa','Filete con caballa','Filete con langostinos','Ceviche mixto','Conchas negras','Causa acevichada','Causa de langostinos','Tiradito (filete o caballa)','Leche de tigre','Leche de pantera','Congrio','Filete con conchas','Mixto afro','Arroz con mariscos'],
    'sudados':['Cabrilla','Cabrillon','Chupe de cangrejo','Chupe de langostinos','Parihuela de cabrilla','Parihuela de cabrillon','Pasado de cabrilla','Pasado de cabrillon'],
    'chicharrones':['Pollo','Pescado','Pollo con pescado','Mixto (pollo, pescado, langostino)','Alitas acevichadas','Alitas BBQ','Alita broaster'],
    'criollos':['Costillas de cerdo con patacones','Seco de chabelo','Majado de yuca','Carne aliñada','Cabrilla al ajo c/ patacones'],
    'guarniciones':['Arroz','Plátano frito','Chifles caseros','Patacones','Yuca frita']
  };

  const find=menu=>{
    let order=0;
    for(const [cat,items] of Object.entries(menu)){
      const idx=items.findIndex(x=>String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()===n);
      if(idx>=0) return {name:cat[0].toUpperCase()+cat.slice(1),categoryOrder:Object.keys(menu).indexOf(cat)+1,productOrder:idx+1};
    }
    return null;
  };
  if(rid===peraId)return find(pera);
  if(rid===cjotasId)return find(cjotas);
  return null;
}

function renderProducts(list=products){
  const el=document.getElementById('products');
  const title=document.getElementById('productsTitle');
  const isFullMenu=selectedRestaurantCategories!==null && document.getElementById('products').classList.contains('menu-completo');
  const countEl=document.getElementById('productCount');
  if(countEl) countEl.textContent=list.length+' disponibles';
  if(!list.length){
    {const q_=String(document.getElementById('search')?.value||'').trim();el.innerHTML='<div class="empty" style="grid-column:1/-1;padding:20px;text-align:center">'+(q_?'No hay productos que coincidan con «'+esc(q_)+'».':'Este negocio todavía no tiene productos disponibles.')+'</div>';}
    return;
  }

  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const categoriesSource=Array.isArray(selectedRestaurantCategories)?selectedRestaurantCategories:(Array.isArray(productCategories)?productCategories:[]);
  const categoryById=new Map(categoriesSource.map(c=>[String(c.id),c]));
  const allCategoryById=new Map((Array.isArray(selectedRestaurantCategories)?selectedRestaurantCategories:(Array.isArray(allProductCategories)?allProductCategories:[])).map(c=>[String(c.id),c]));
  const activeCategoryNamesByNegocio=new Map();
  categoriesSource.forEach(c=>{const key=String(c.negocio_id||'');if(!activeCategoryNamesByNegocio.has(key))activeCategoryNamesByNegocio.set(key,new Set());activeCategoryNamesByNegocio.get(key).add(norm(c.nombre));});
  const card=p=>{
    const name=pick(p,['nombre','nombre_producto'],'Producto');
    const price=Number(pick(p,['precio','precio_unitario'],0));
    const img=pick(p,['imagen_url','imagen'],'');
    const stock=getProductStock(p);
    const stockText=stock===null?'':'<div style="margin-top:7px;color:var(--fr-muted);font-size:12px">Stock: '+stock+' unidades</div>';
    const restaurant=p.origen==='negocio'?restaurants.find(r=>String(r.id)===String(p.negocio_id)):null;
    const restaurantOpen=restaurant?isRestaurantOpen(restaurant):true;
    const actionButton=(restaurant&&!restaurantOpen)
      ? `<button type="button" class="closedScheduleButton" onclick="event.stopPropagation();showRestaurantSchedule('${p.negocio_id}')">Ver horario</button>`
      : `<button type="button" onclick="event.stopPropagation();openProductDetails('${p.id}','${p.origen}')">Ver detalles</button>`;
    return `<div class="product productDetailCard" role="button" tabindex="0" onclick="openProductDetails('${p.id}','${p.origen}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProductDetails('${p.id}','${p.origen}')}" style="cursor:pointer"><div class="productImg${img?'':' pdNoImg'}">${img?`<img src="${esc(img)}" alt="${esc(name)}" draggable="false" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('pdNoImg');this.remove()">`:''}</div><div class="productBody"><h3>${esc(name)}</h3><div class="price">S/ ${price.toFixed(2)}</div>${stockText}${actionButton}</div></div>`;
  };
  el.classList.toggle('menu-completo',isFullMenu);

  // En inicio: una pasarela completa por negocio, mezclando todas sus categorías.
  if(!isFullMenu && !document.getElementById('search').value.trim()){
    const sections=[];
    restaurants.forEach(r=>{
      const items=list.filter(p=>p.origen==='negocio'&&String(p.negocio_id)===String(r.id));
      if(!items.length)return;
      const name=pick(r,['nombre','nombre_negocio','razon_social'],'Restaurante');
      sections.push(`<section class="restaurantProductsSection"><div class="restaurantProductsHead"><h3>${esc(name)}</h3><button class="restaurantShowMore" type="button" onclick="showRestaurant('${r.id}')">Mostrar más</button></div><div class="productCarousel">${items.map(card).join('')}</div></section>`);
    });
    el.innerHTML=sections.join('')||'<div class="empty">No hay productos disponibles todavía.</div>';
    return;
  }

  // Carta completa del negocio: agrupar por categoría real y usar el menú oficial
  // como respaldo cuando algún producto no tenga categoria_id enlazado correctamente.
  if(isFullMenu){
    const visible=list.filter(p=>{
      const rawCat=allCategoryById.get(String(p.categoria_id||''));
      return !rawCat || rawCat.activo!==false;
    });
    const sections=[];
    const assigned=new Set();
    categoriesSource.filter(c=>c.activo!==false).forEach(c=>{
      const items=visible.filter(p=>String(p.categoria_id||'')===String(c.id));
      if(!items.length)return;
      items.forEach(p=>assigned.add(String(p.id)));
      sections.push(`<section class="categoryBlock"><h3 class="categoryTitle">${esc(c.nombre||'Categoría')}</h3><div class="categoryGrid">${items.map(card).join('')}</div></section>`);
    });

    // Respaldo por nombre para productos conocidos si la relación de categoría está vacía/rota.
    const fallbackGroups=new Map();
    visible.forEach(p=>{
      if(assigned.has(String(p.id)))return;
      const info=getOfficialMenuInfo(p);
      if(info){
        if(!fallbackGroups.has(info.name))fallbackGroups.set(info.name,[]);
        fallbackGroups.get(info.name).push(p);
        assigned.add(String(p.id));
      }
    });
    const officialOrder=['Platos','Complementos','Bebidas','Postres','Ceviches','Sudados','Chicharrones','Criollos','Guarniciones'];
    [...fallbackGroups.keys()].sort((a,b)=>officialOrder.indexOf(a)-officialOrder.indexOf(b)).forEach(name=>{
      const items=fallbackGroups.get(name)||[];
      if(items.length)sections.push(`<section class="categoryBlock"><h3 class="categoryTitle">${esc(name)}</h3><div class="categoryGrid">${items.map(card).join('')}</div></section>`);
    });

    el.innerHTML=sections.join('')||'<div class="empty" style="grid-column:1/-1">Este negocio todavía no tiene productos disponibles en sus categorías.</div>';
    return;
  }

  // Resultados de búsqueda: mostrar productos coincidentes sin ensanchar la página.
  el.innerHTML=`<div class="productCarousel">${list.map(card).join('')}</div>`;
}

async function showRestaurant(id){
  const r=restaurants.find(x=>String(x.id)===String(id));
  if(!r || r.activo===false || r.visible_admin===false)return;

  // Cargar primero la carta real de Supabase. Así no aparece por un instante
  // la vista previa horizontal de Inicio antes de abrir la carta completa.
  const cachedProducts=(products||[]).filter(p=>p.origen==='negocio'&&String(p.negocio_id)===String(id));
  let productsToShow=cachedProducts;
  let categoriesToShow=(productCategories||[]).filter(c=>String(c.negocio_id||'')===String(id)&&c.activo!==false);
  let loadError=false;

  try{
    const [catRes,prodRes]=await Promise.all([
      sb.from('categorias_negocio').select('*').eq('negocio_id',id).order('orden',{ascending:true}),
      sb.from('productos_negocio').select('*').eq('negocio_id',id).eq('disponible',true).order('orden',{ascending:true})
    ]);
    if(!prodRes.error){
      productsToShow=(prodRes.data||[]).map(x=>({...x,origen:'negocio'}));
      if(!catRes.error) categoriesToShow=(catRes.data||[]).filter(c=>c.activo!==false);
      products=(products||[]).filter(p=>!(p.origen==='negocio'&&String(p.negocio_id)===String(id))).concat(productsToShow);
    }else{
      loadError=true;
      console.warn('No se pudo cargar la carta desde Supabase:',prodRes.error);
    }
  }catch(e){
    loadError=true;
    console.warn('No se pudo actualizar la carta desde Supabase:',e);
  }

  selectedRestaurantCategories=categoriesToShow;
  entrarCartaCompleta(r);
  renderProducts(productsToShow);
  abrirModalCarta(r);

  if(loadError && !productsToShow.length){
    const el=document.getElementById('cartaModalProducts');
    if(el)el.innerHTML='<div class="empty" style="padding:20px;text-align:center">No se pudieron cargar los productos. Comprueba la conexión e inténtalo nuevamente.</div>';
  }
}

// Recuerda si la carta se abrió desde el listado de «Locales cerca de ti».
let volverAListadoCercanosAlCerrarCarta=false;

function abrirModalCarta(r){
  let modal=document.getElementById('cartaModalNegocio');
  if(!modal){modal=document.createElement('div');modal.id='cartaModalNegocio';document.body.appendChild(modal);}
  const nombre=pick(r,['nombre','nombre_negocio','razon_social'],'Carta del negocio');
  modal.className='carta-modal-overlay';
  const pdLogo=pick(r,['logo_url','logo','imagen_logo_url','imagen_logo'],'');const pdCat=normalizeBusinessCategory(r)||'Negocio';const pdOpen=isRestaurantOpen(r);
  modal.innerHTML=`<div class="carta-modal-sheet" role="dialog" aria-modal="true" aria-label="Carta de ${esc(nombre)}"><div class="carta-modal-head"><div class="pdCartaId">${pdLogo?`<img class="pdCartaLogo" src="${esc(pdLogo)}" alt="" onerror="this.remove()">`:''}<div class="pdCartaTxt"><span class="pdKicker">${esc(pdCat)}</span><h2>${esc(nombre)}</h2><span class="pdPill ${pdOpen?'is-dark':'is-off'}">${pdOpen?'Abierto':'Cerrado'}</span></div></div>${(new URLSearchParams(location.search).get('negocio')||'').trim()?'':'<button type="button" class="carta-modal-close" aria-label="Cerrar carta" onclick="cerrarModalCarta()">×</button>'}</div><div class="carta-modal-body"><div id="cartaModalProducts"></div></div><button type="button" id="pdCartaCartBar" class="pdCartaCartBar" hidden onclick="openCart()"></button></div>`;
  pdUpdateCartaBar();
  actualizarContenidoModalCarta(r);
}

function actualizarContenidoModalCarta(r){
  const target=document.getElementById('cartaModalProducts');
  const source=document.getElementById('products');
  if(target&&source)target.innerHTML=source.innerHTML;
}

function cerrarModalCarta(){
  if(document.documentElement.classList.contains('pdCartaEnlace'))return;
  const modal=document.getElementById('cartaModalNegocio');
  if(modal){modal.className='hidden';modal.innerHTML='';}
  const regresarAListado=volverAListadoCercanosAlCerrarCarta;
  volverAListadoCercanosAlCerrarCarta=false;
  volverMenuPrincipal();
  // Si la carta vino del modal de locales cercanos, volver a mostrar ese listado
  // en lugar de dejar al usuario en Inicio.

}

function entrarCartaCompleta(r){
  const hero=document.querySelector('.hero');if(hero)hero.classList.add('hidden');
  const businessCategoriesSection=document.getElementById('businessCategoriesSection');if(businessCategoriesSection)businessCategoriesSection.classList.add('hidden');
  const restaurantsSection=document.getElementById('restaurantsSection');if(restaurantsSection)restaurantsSection.classList.add('hidden');
  const head=document.getElementById('productsSectionHead');
  if(head)head.innerHTML=`<div class="menuRestaurantHeader"><h2 id="productsTitle">${esc(pick(r,['nombre','nombre_negocio','razon_social'],'Restaurante'))}</h2></div>`;
  document.getElementById('products').classList.add('menu-completo');
}

function volverMenuPrincipal(){
  /* Carta por enlace: nunca volver al Inicio general; se queda en la carta del negocio */
  if((new URLSearchParams(location.search).get('negocio')||'').trim()){const ps=document.getElementById('productsSection');if(ps)ps.classList.remove('hidden');['restaurantsSection','businessCategoriesSection'].forEach(i=>document.getElementById(i)?.classList.add('hidden'));document.querySelector('.hero')?.classList.add('hidden');const pe=document.getElementById('products');if(pe&&!pe.classList.contains('menu-completo')){abrirCartaDesdeEnlace()}else{window.scrollTo({top:0,behavior:'smooth'})}return}
  selectedRestaurantCategories=null;
  const restaurantsSection=document.getElementById('restaurantsSection');
  if(restaurantsSection)restaurantsSection.classList.remove('hidden');
  const businessCategoriesSection=document.getElementById('businessCategoriesSection');
  if(businessCategoriesSection)businessCategoriesSection.classList.remove('hidden');
  const hero=document.querySelector('.hero');if(hero)hero.classList.remove('hidden');
  const head=document.getElementById('productsSectionHead');
  if(head)head.innerHTML='<h2 id="productsTitle">Productos</h2><span class="count" id="productCount">'+products.length+' disponibles</span>';
  document.getElementById('products').classList.remove('menu-completo');
  renderRestaurants();
  renderProducts(products);
  window.scrollTo({top:0,behavior:'smooth'});
}

const HORARIO_AVISO_MINUTOS=30;
let horarioAlertTimer=null;
let ultimoAvisoHorario='';





function revisarAvisoHorario(){
  if(window.__pdProg)return; // con reserva activa, los avisos de abre/cierra pronto no aplican
  const ahora=getLimaNow();
  const minutoActual=ahora.getHours()*60+ahora.getMinutes();

  for(const r of restaurants){
    const horario=pick(r,['horario','horarios','horario_atencion','horario_atencion_negocio'],'');
    const range=getDailySchedule(horario,ahora);
    if(!range) continue;

    const abierto=isRestaurantOpen(r);
    let minutosHastaCierre=range.close-minutoActual;
    if(range.open>range.close && minutoActual>=range.open) minutosHastaCierre=(1440-minutoActual)+range.close;

    if(abierto){
      if(minutosHastaCierre>0 && minutosHastaCierre<=HORARIO_AVISO_MINUTOS){
        const clave=`cierre-${r.id}-${range.close}-${ahora.toDateString()}`;
        if(ultimoAvisoHorario!==clave){
          const nombre=pick(r,['nombre','nombre_negocio','razon_social'],'El negocio');
          mostrarAvisoHorario(`${nombre} cerrará en ${minutosHastaCierre} ${minutosHastaCierre===1?'minuto':'minutos'}.`);
          ultimoAvisoHorario=clave;
        }
      }
    }else{
      // Solo avisa de la apertura si existe un horario para el día actual.
      const minutosHastaApertura=range.open-minutoActual;
      if(minutosHastaApertura>0 && minutosHastaApertura<=HORARIO_AVISO_MINUTOS){
        const clave=`apertura-${r.id}-${range.open}-${ahora.toDateString()}`;
        if(ultimoAvisoHorario!==clave){
          const nombre=pick(r,['nombre','nombre_negocio','razon_social'],'El negocio');
          mostrarAvisoHorario(`${nombre} abrirá en ${minutosHastaApertura} ${minutosHastaApertura===1?'minuto':'minutos'}.`);
          ultimoAvisoHorario=clave;
        }
      }
    }
  }
}

// Actualiza automáticamente el estado al cambiar la hora de apertura/cierre.
refreshRestaurantStatuses();
revisarAvisoHorario();
setInterval(refreshRestaurantStatuses,30000);
setInterval(revisarAvisoHorario,30000);
setTimeout(revisarAvisoHorario,500);
document.getElementById('search').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase().trim();
  if(!q){if(document.getElementById('products').classList.contains('menu-completo')){volverMenuPrincipal();return;}selectedRestaurantCategories=null;document.getElementById('productsTitle').textContent='Productos';renderRestaurants();renderProducts();return}
  renderRestaurants(restaurants.filter(r=>JSON.stringify(r).toLowerCase().includes(q)));
  renderProducts(products.filter(p=>JSON.stringify(p).toLowerCase().includes(q)));
});

function getProductRestaurantId(p){
  if(!p || p.origen!=='negocio') return null;
  return p.negocio_id || null;
}
function getCartRestaurantId(){
  const item=cart.find(x=>x.origen==='negocio');
  return item ? (item.negocio_id || null) : null;
}
function getRestaurantNameById(id){
  const r=restaurants.find(x=>String(x.id)===String(id));
  return pick(r,['nombre','nombre_negocio','razon_social'],'Negocio');
}
function showRestaurantConflict(currentId,newId){
  /* El carrito es de otro negocio: se muestra a quién pertenece, cuánto lleva y dos salidas claras */
  const currentName=esc(getRestaurantNameById(currentId));
  const newName=esc(getRestaurantNameById(newId));
  const cant=cart.reduce((a,x)=>a+(Number(x.cantidad)||0),0);
  const tot=cart.reduce((a,x)=>a+(Number(x.precio)||0)*(Number(x.cantidad)||0),0);
  const ic='<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"></circle><circle cx="18" cy="20" r="1.5"></circle><path d="M2.5 3h2.6l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 7H6"></path></svg>';
  showModal(`<div class="sheet pdConf"><div class="sheetTop"><h2>Tu carrito es de otro negocio</h2><button class="close" aria-label="Cerrar" onclick="closeModal()">×</button></div>
    <div class="pdConfCart"><span class="pdConfIc">${ic}</span><div><small>Tu carrito</small><b>${currentName}</b><span>${cant} ${cant===1?'producto':'productos'} · S/ ${tot.toFixed(2)}</span></div></div>
    <p class="pdConfTxt">Cada pedido es de un solo negocio. Termina tu pedido de <b>${currentName}</b> o vacía el carrito para pedir en <b>${newName}</b>.</p>
    <div class="pdConfActs"><button class="primary" type="button" onclick="closeModal();openCart()">Ver mi carrito</button>
    <button class="pdConfSec" type="button" onclick="cart.splice(0,cart.length);saveCart();updateCart();closeModal();if(typeof toast==='function')toast('Carrito vaciado · ya puedes pedir en ${newName}')">Vaciar carrito y pedir aquí</button></div></div>`);
}
function splitCatalogDescription(raw){const s=String(raw||'');const marker='\n\n[[PIDEMAS_CARACTERISTICAS_V1: ';const at=s.lastIndexOf(marker);if(at<0)return {description:s,features:[]};try{const end=s.indexOf(']]',at);if(end<0)return {description:s,features:[]};const parsed=JSON.parse(s.slice(at+marker.length,end));return {description:s.slice(0,at).trimEnd(),features:Array.isArray(parsed)?parsed.filter(x=>x&&String(x.name||'').trim()&&String(x.value||'').trim()):[]}}catch(e){return {description:s,features:[]}}}
function openProductDetails(id,origen){
  const p=products.find(x=>String(x.id)===String(id)&&x.origen===origen);
  if(!p){toast('No se encontró este producto.');return;}
  const restaurant=origen==='negocio'?restaurants.find(r=>String(r.id)===String(p.negocio_id)):null;
  if(restaurant && !isRestaurantOpen(restaurant)){
    showRestaurantSchedule(p.negocio_id);return;
  }
  const name=pick(p,['nombre','nombre_producto'],'Producto');
  const parsedCatalogDescription=splitCatalogDescription(pick(p,['descripcion','descripcion_detallada','detalle'],'')||'');const description=parsedCatalogDescription.description;const featureMarkup=parsedCatalogDescription.features.length?'<div class="productCatalogFeatures"><strong>Características</strong>'+parsedCatalogDescription.features.map(f=>'<div><b>'+esc(f.name)+':</b> '+esc(f.value)+'</div>').join('')+'</div>':'';
  const img=pick(p,['imagen_url','imagen'],'');
  const price=Number(pick(p,['precio','precio_unitario'],0));
  const stock=getProductStock(p);
  showModal(`<div class="sheet productDetailSheet"><div class="sheetTop"><h2>Detalle del producto</h2><button class="close" onclick="closeModal()" aria-label="Cerrar">×</button></div>${img?`<div class="productDetailImage"><img src="${esc(img)}" alt="${esc(name)}" loading="lazy" decoding="async" onerror="this.parentElement.remove()"></div>`:''}<h2 style="margin:0">${esc(name)}</h2><div class="productDetailPrice">S/ ${price.toFixed(2)}</div><div class="productDetailDescription">${description?esc(description):'Este negocio no ha agregado una descripción para este producto.'}</div>${featureMarkup}${stock!==null?`<div class="muted">Disponibles: ${stock}</div>`:''}<div style="font-weight:800;margin-top:16px">Cantidad</div><div class="productDetailQty"><button type="button" onclick="changeDetailQty(-1,${stock===null?'null':stock})" aria-label="Disminuir cantidad">−</button><strong id="detailProductQty">1</strong><button type="button" onclick="changeDetailQty(1,${stock===null?'null':stock})" aria-label="Aumentar cantidad">+</button></div><button class="primary" onclick="addDetailedProductToCart('${String(p.id)}','${origen}')">Agregar al carrito · S/ <span id="detailProductTotal">${price.toFixed(2)}</span></button></div>`);
  window.currentDetailProduct={id:String(p.id),origen,price,stock};
}
function changeDetailQty(delta,stock){
  const el=document.getElementById('detailProductQty');if(!el)return;
  let qty=Math.max(1,Number(el.textContent||1)+delta);
  if(stock!==null && Number.isFinite(Number(stock)))qty=Math.min(qty,Math.max(1,Number(stock)));
  el.textContent=String(qty);
  const total=Number(window.currentDetailProduct?.price||0)*qty;
  const totalEl=document.getElementById('detailProductTotal');if(totalEl)totalEl.textContent=total.toFixed(2);
}
function addDetailedProductToCart(id,origen){
  const qty=Math.max(1,Number(document.getElementById('detailProductQty')?.textContent||1));
  const ok=addToCart(id,origen,qty);
  if(ok)closeModal();
}
function addToCart(id,origen,qty=1){
  const p=products.find(x=>String(x.id)===String(id)&&x.origen===origen);if(!p)return false;
  qty=Math.max(1,Math.floor(Number(qty)||1));
  if(origen==='negocio'){
    const newRestaurantId=getProductRestaurantId(p);
    const currentRestaurantId=getCartRestaurantId();
    if(currentRestaurantId && String(currentRestaurantId)!==String(newRestaurantId)){
      showRestaurantConflict(currentRestaurantId,newRestaurantId);
      return false;
    }
  }
  const key=String(id)+'|'+origen;
  const old=cart.find(x=>x.key===key);
  const availableStock=Number(p?.stock);
  if(Number.isFinite(availableStock) && availableStock>=0){
    const totalCurrent=cart.filter(x=>String(x.id)===String(id)&&x.origen===origen).reduce((sum,x)=>sum+Number(x.cantidad||0),0);
    if(totalCurrent+qty>availableStock){toast('No hay suficiente stock disponible de este producto.');return false;}
  }
  if(old)old.cantidad+=qty; else cart.push({key,id:String(id),origen,negocio_id:getProductRestaurantId(p),nombre:pick(p,['nombre','nombre_producto'],'Producto'),categoria:(window.pdCategoriaDe?pdCategoriaDe(p):''),precio:Number(pick(p,['precio','precio_unitario'],0)),cantidad:qty});
  saveCart();updateCart();toast('Producto agregado al carrito');return true;
}
function updateCart(){document.getElementById('cartCount').textContent=cart.reduce((a,x)=>a+x.cantidad,0);try{pdUpdateCartaBar();}catch(e){}}
function pdUpdateCartaBar(){
  const bar=document.getElementById('pdCartaCartBar');if(!bar)return;
  const n=cart.reduce((a,x)=>a+Number(x.cantidad||0),0);
  const total=cart.reduce((a,x)=>a+Number(x.precio||0)*Number(x.cantidad||0),0);
  if(!n){bar.hidden=true;return;}
  bar.hidden=false;
  bar.innerHTML=`<span class="pdCartaCartLeft"><span class="pdCartaCartCount">${n}</span>Ver carrito</span><span>S/ ${total.toFixed(2)}</span>`;
}
function openCart(){
  const total=cart.reduce((a,x)=>a+x.precio*x.cantidad,0);
  const rows=cart.length
    ? cart.map((x,i)=>`<div style="display:flex;gap:10px;align-items:center;border-bottom:1px solid var(--fr-peach-soft);padding:13px 0"><div style="flex:1"><b>${esc(x.nombre)}</b><div style="color:var(--fr-muted)">S/ ${x.precio.toFixed(2)} × ${x.cantidad}</div></div><button onclick="cart[${i}].cantidad--;if(cart[${i}].cantidad<=0)cart.splice(${i},1);saveCart();updateCart();openCart()" style="border:0;background:var(--fr-peach-soft);border-radius:10px;padding:8px">−</button><button onclick="cart[${i}].cantidad++;saveCart();updateCart();openCart()" style="border:0;background:var(--fr-ink);color:#fff;border-radius:10px;padding:8px">+</button></div>`).join('')
    : `<div class="empty">Tu carrito está vacío.</div>`;
  showModal(`<div class="sheet"><div class="sheetTop"><h2>Tu carrito</h2><button class="close" onclick="closeModal()">×</button></div>${rows}<h3 style="text-align:right;margin:18px 0">Total: S/ ${total.toFixed(2)}</h3>${cart.length?`<button class="primary" onclick="openCheckout()">Continuar pedido</button>`:''}</div>`);
  if(!cart.length){startOrderTracking();}
}
function openCheckout(){
  const customer=getCustomerInfo();
  showModal(`<div class="sheet"><div class="sheetTop"><h2>Datos de entrega</h2><button class="close" onclick="closeModal()">×</button></div>
  <div class="field"><label>Nombre</label><input id="cNombre" value="${esc(customer.nombre_cliente||"")}" required></div>
  <div class="field"><label>Teléfono</label><input id="cTelefono" inputmode="tel" value="${esc(customer.telefono_cliente||"")}" required></div>
  <div class="field"><label>Dirección de entrega</label><input id="cDireccion" required></div>
  <div class="field"><label>Referencia</label><input id="cReferencia"></div>
  <div class="field"><label>Ubicación de entrega</label>
    <div class="locationBox">
      <div class="locationRow">
        <button type="button" class="locationBtn" onclick="useCurrentLocation('cart')">Usar mi ubicación actual</button>
        <span id="cLocationStatus" class="locationStatus">Aún no se ha enviado la ubicación.</span>
      </div>
      <input id="cLat" type="hidden"><input id="cLng" type="hidden">
      <div id="cMapLink" class="locationStatus" style="margin-top:8px"></div>
    </div>
  </div>
  <div class="field"><label>Delivery</label><div id="deliveryFareBox" style="padding:12px;border-radius:14px;background:var(--fr-peach-soft)"><div style="font-size:13px;color:var(--fr-muted)">Calculando delivery...</div></div></div>
  <div class="field">
    <label>Código de descuento para delivery</label>
    <div class="discountBox">
      <div class="discountRow"><input id="cDiscountCode" maxlength="40" placeholder="" value="" autocomplete="off"><button type="button" class="discountApply" onclick="applyDeliveryDiscount()">Aplicar</button></div>
      <div id="cDiscountMsg" class="discountMsg">El descuento se aplica únicamente al delivery.</div>
    </div>
  </div>
  <div class="field"><label>Método de pago</label><select id="cPago" required onchange="togglePaymentProof()"><option value="" selected disabled>Seleccione el método de pago</option><option value="efectivo">Efectivo</option><option value="yape">Yape</option></select></div>
  <div class="field hidden" id="cashPaymentBox">
    <label>¿Con cuánto pagarás?</label>
    <input id="cMontoPago" type="number" inputmode="decimal" min="0" step="0.01" placeholder="S/ 0.00" oninput="updateCashChange()">
    <div style="margin-top:8px;padding:12px;border-radius:12px;background:var(--fr-peach-soft)">
      <div style="font-size:13px;color:var(--fr-muted)">Subtotal del pedido</div>
      <div id="cMontoSubtotal" style="font-size:16px;font-weight:800">S/ 0.00</div>
      <div style="font-size:13px;color:var(--fr-muted);margin-top:7px">Delivery</div>
      <div id="cMontoDelivery" style="font-size:16px;font-weight:800">S/ 0.00</div>
      <div style="font-size:13px;color:var(--fr-muted);margin-top:7px">Total a pagar</div>
      <div id="cMontoPedido" style="font-size:20px;font-weight:800">S/ 0.00</div>
      <div style="font-size:13px;color:var(--fr-muted);margin-top:7px">Cambio que recibirá del motorizado</div>
      <div id="cCambio" style="font-size:22px;font-weight:800">S/ 0.00</div>
    </div>
  </div>
  <div class="field hidden" id="yapePaymentBox">
    <div style="border:1px solid var(--fr-line);border-radius:14px;padding:12px;background:#fff;text-align:center">
      <div style="font-size:16px;font-weight:800;margin-bottom:8px">Pago con Yape</div>
      <div class="pdYapeOps" role="radiogroup" aria-label="Forma de pago con Yape">
        <label class="pdYapeOp" id="pdYapeOpNegocio"><input type="radio" name="pdYapeModo" value="negocio" checked><span><b>Coordinar con el negocio</b><small>El negocio te escribirá por WhatsApp para que le yapees.</small></span></label>
        <label class="pdYapeOp" hidden style="display:none"><input type="radio" name="pdYapeModo" value="motorizado"><span><b>Al motorizado al recibir</b><small>No pagues ahora. El motorizado te mostrará el QR en la puerta.</small></span></label>
      </div>
      <div style="margin-top:9px;padding:8px;border-radius:10px;background:var(--fr-peach-soft);text-align:left">
        <div style="font-size:12px;color:var(--fr-muted)">Subtotal</div>
        <div id="cYapeSubtotal" style="font-size:15px;font-weight:800;margin-top:2px">S/ 0.00</div>
        <div style="font-size:12px;color:var(--fr-muted);margin-top:6px">Delivery</div>
        <div id="cYapeDelivery" style="font-size:15px;font-weight:800;margin-top:2px">S/ 0.00</div>
        <div style="font-size:12px;color:var(--fr-muted);margin-top:6px">Monto total a pagar</div>
        <div id="cYapeMonto" style="font-size:20px;font-weight:800;margin-top:2px">S/ 0.00</div>
      </div>
    </div>
  </div>
  <div class="field hidden" id="paymentProofBox">
    <label>Constancia de pago</label>
    <div style="border:2px dashed var(--fr-muted);border-radius:16px;padding:22px 14px;text-align:center;background:#fff;cursor:pointer" onclick="document.getElementById('cProof').click()">
      <div style="font-size:34px;line-height:1;margin-bottom:8px">☁️</div>
      <div style="font-size:16px;font-weight:800">Seleccionar archivo</div>
      <div id="cProofStatus" style="font-size:13px;color:var(--fr-muted);margin-top:5px">o arrastra una imagen aquí</div>
      <input id="cProof" type="file" accept="image/*" onchange="previewProof(this,'cProofPreview'); updateProofStatus(this)" style="display:none">
    </div>
    <div class="locationStatus" style="margin-top:7px">Sube una captura del pago para que Pidemás la revise.</div>
    <img id="cProofPreview" class="previewImg hidden" alt="Vista previa del comprobante">
  </div>
  <div class="field" id="cCompBox">
    <label>Comprobante de pago</label>
    <div class="compOpts" role="radiogroup" aria-label="Tipo de comprobante">
      <button type="button" class="compOpt" data-comp="boleta" onclick="pdCompSel('boleta')">Boleta</button>
      <button type="button" class="compOpt" data-comp="factura" onclick="pdCompSel('factura')">Factura</button>
    </div>
    <input type="hidden" id="cCompTipo" value="ninguno">
    <div class="compCampos hidden" id="cCompBoleta">
      <label for="cCompDni">DNI</label>
      <input id="cCompDni" type="text" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="8 dígitos">
      <label for="cCompNombre">Nombre en la boleta (opcional)</label>
      <input id="cCompNombre" type="text" autocomplete="off" placeholder="Si es distinto a tu nombre">
    </div>
    <div class="compCampos hidden" id="cCompFactura">
      <label for="cCompRuc">RUC</label>
      <input id="cCompRuc" type="text" inputmode="numeric" maxlength="11" autocomplete="off" placeholder="11 dígitos">
      <label for="cCompRazon">Razón social</label>
      <input id="cCompRazon" type="text" autocomplete="off" placeholder="Nombre de la empresa">
      <label for="cCompDirFiscal">Dirección fiscal (opcional)</label>
      <input id="cCompDirFiscal" type="text" autocomplete="off" placeholder="Dirección que figura en SUNAT">
    </div>
    <div class="locationStatus" id="cCompNota">¿Necesitas boleta o factura? Elige una. Si no, déjalo sin marcar.</div>
  </div>
  <div class="field"><label>Nota para el pedido</label><textarea id="cObs" rows="3" maxlength="300" placeholder="Ej: sin cebolla, tocar el timbre, dejar en recepción…"></textarea></div>
  <button class="primary" onclick="submitCartOrder()">Enviar pedido</button></div>`);

  // Cada checkout empieza sin coordenadas ocultas para evitar reutilizar un GPS
  // antiguo mientras el formulario todavía muestra “Aún no se ha enviado la ubicación”.
  const oldLat=document.getElementById('cLat');
  const oldLng=document.getElementById('cLng');
  const oldStatus=document.getElementById('cLocationStatus');
  const oldMap=document.getElementById('cMapLink');
  currentDeliveryCost=0;
  currentDeliveryDistanceKm=null;
  appliedDeliveryDiscount=null;
  if(oldLat) oldLat.value='';
  if(oldLng) oldLng.value='';
  if(oldStatus) oldStatus.textContent='Aún no se ha enviado la ubicación.';
  if(oldMap) oldMap.innerHTML='';

  renderDeliveryBox(`<div style="font-size:13px;color:var(--fr-muted)">Ubicación de entrega</div><div style="font-size:14px;font-weight:700;margin-top:4px">Pulsa «Usar mi ubicación actual» para calcular el delivery.</div>`);
  updateDeliveryFarePreview();
}

function getCartTotal(){
  return cart.reduce((a,x)=>a+Number(x.precio||0)*Number(x.cantidad||0),0);
}

function getDiscountedDeliveryCost(delivery=Number(currentDeliveryCost||0)){
  const d=Math.max(0,Number(delivery)||0);
  const discount=Math.min(d,Math.max(0,Number(appliedDeliveryDiscount?.amount||0)));
  return Math.max(0,d-discount);
}
function getCheckoutTotal(){
  return getCartTotal()+(window.pdDescMonto?window.pdDescMonto():0)+getDiscountedDeliveryCost();
}

function updatePaymentAmounts(){
  const subtotal=getCartTotal();
  const deliveryOriginal=Number(currentDeliveryCost||0);
  const discount=Number(appliedDeliveryDiscount?.amount||0);
  const delivery=getDiscountedDeliveryCost(deliveryOriginal);
  const dsc=window.pdDescMonto?window.pdDescMonto():0;
  const total=subtotal+dsc+delivery;
  const subtotalEl=document.getElementById('cMontoSubtotal');
  const deliveryEl=document.getElementById('cMontoDelivery');
  const pedido=document.getElementById('cMontoPedido');
  const yapeSubtotal=document.getElementById('cYapeSubtotal');
  const yapeDelivery=document.getElementById('cYapeDelivery');
  const yapeMonto=document.getElementById('cYapeMonto');
  if(subtotalEl)subtotalEl.textContent=`S/ ${(subtotal+dsc).toFixed(2)}`;
  if(deliveryEl)deliveryEl.textContent=`S/ ${delivery.toFixed(2)}`;
  const msg=document.getElementById('cDiscountMsg');
  if(msg){msg.innerHTML=appliedDeliveryDiscount ? `<span class="discountApplied">✓ ${esc(appliedDeliveryDiscount.codigo)}: -S/ ${discount.toFixed(2)} en delivery</span>` : 'El descuento se aplica únicamente al delivery.';}
  if(pedido)pedido.textContent=`S/ ${total.toFixed(2)}`;
  if(yapeSubtotal)yapeSubtotal.textContent=`S/ ${(subtotal+dsc).toFixed(2)}`;
  if(yapeDelivery)yapeDelivery.textContent=`S/ ${delivery.toFixed(2)}`;
  if(yapeMonto)yapeMonto.textContent=`S/ ${total.toFixed(2)}`;
  updateCashChange();
}

async function applyDeliveryDiscount(){
  const input=document.getElementById('cDiscountCode'), msg=document.getElementById('cDiscountMsg');
  const code=String(input?.value||'').trim().toUpperCase();
  if(!code){appliedDeliveryDiscount=null;updatePaymentAmounts();if(msg)msg.textContent='Ingresa un código de descuento.';return;}
  if(!Number.isFinite(Number(currentDeliveryCost))||Number(currentDeliveryCost)<=0){if(msg)msg.textContent='Primero calcula el delivery con tu ubicación.';return;}
  if(msg)msg.textContent='Validando código...';
  try{
    const {data,error}=await sb.from('codigos_delivery').select('*').eq('codigo',code).eq('activo',true).maybeSingle();
    if(error)throw error;
    if(!data){appliedDeliveryDiscount=null;updatePaymentAmounts();msg.textContent='Código inválido o inactivo.';return;}
    const now=Date.now(),ini=data.fecha_inicio?Date.parse(data.fecha_inicio):null,fin=data.fecha_fin?Date.parse(data.fecha_fin):null;
    if(ini&&now<ini){appliedDeliveryDiscount=null;updatePaymentAmounts();msg.textContent='Este código todavía no está vigente.';return;}
    if(fin&&now>fin){appliedDeliveryDiscount=null;updatePaymentAmounts();msg.textContent='Este código ya venció.';return;}
    const minimo=Number(data.compra_minima||0);
    if(getCartTotal()<minimo){appliedDeliveryDiscount=null;updatePaymentAmounts();msg.textContent=`Compra mínima para este código: S/ ${minimo.toFixed(2)}.`;return;}
    const usos=Number(data.usos||0),maxUsos=Number(data.max_usos||0);
    if(maxUsos>0&&usos>=maxUsos){appliedDeliveryDiscount=null;updatePaymentAmounts();msg.textContent='Este código ya alcanzó su límite de usos.';return;}
    let amount=String(data.tipo)==='porcentaje'?Number(currentDeliveryCost)*(Number(data.valor||0)/100):Number(data.valor||0);
    amount=Math.min(Number(currentDeliveryCost||0),Math.max(0,amount));
    if(amount<=0){appliedDeliveryDiscount=null;updatePaymentAmounts();msg.textContent='Este código no genera descuento para este delivery.';return;}
    appliedDeliveryDiscount={id:data.id,codigo:code,tipo:data.tipo,valor:Number(data.valor||0),amount};updatePaymentAmounts();
  }catch(e){console.error('Código de delivery:',e);appliedDeliveryDiscount=null;updatePaymentAmounts();if(msg)msg.textContent='No se pudo validar el código. Verifica la configuración de promociones.';}
}

function updateCashChange(){
  const total=getCheckoutTotal();
  const input=document.getElementById('cMontoPago');
  const cambio=document.getElementById('cCambio');
  const paid=Number(input?.value||0);
  const change=Math.max(0,paid-total);
  const pedido=document.getElementById('cMontoPedido');
  if(pedido)pedido.textContent=`S/ ${total.toFixed(2)}`;
  if(cambio)cambio.textContent=`S/ ${change.toFixed(2)}`;
}




function togglePaymentProof(){
  const pay=document.getElementById('cPago')?.value;
  const proofBox=document.getElementById('paymentProofBox');
  const yapeBox=document.getElementById('yapePaymentBox');
  const cashBox=document.getElementById('cashPaymentBox');
  if(proofBox)proofBox.classList.add('hidden');
  if(yapeBox)yapeBox.classList.toggle('hidden', pay!=='yape');
  if(cashBox)cashBox.classList.toggle('hidden', pay!=='efectivo');
  updatePaymentAmounts();
}
function updateProofStatus(input){
  const file=input?.files?.[0];
  const status=document.getElementById('cProofStatus');
  if(status) status.textContent=file ? file.name : 'o arrastra una imagen aquí';
}
function previewProof(input,targetId){
  const img=document.getElementById(targetId), file=input?.files?.[0];
  if(!img)return;
  if(!file){
    img.classList.add('hidden');
    img.removeAttribute('src');
    const nameEl=document.getElementById('cProofName');
    if(nameEl)nameEl.textContent='Ninguna imagen seleccionada.';
    return;
  }
  if(!file.type.startsWith('image/')){
    toast('La constancia debe ser una imagen');
    input.value='';
    return;
  }
  if(file.size>8*1024*1024){
    toast('La imagen no debe superar 8 MB');
    input.value='';
    return;
  }

  const nameEl=document.getElementById('cProofName');
  if(nameEl)nameEl.textContent=file.name||'Imagen seleccionada';
  const reader=new FileReader();
  reader.onload=function(e){
    img.src=e.target.result;
    img.classList.remove('hidden');
    img.style.display='block';
  };
  reader.onerror=function(){
    img.classList.add('hidden');
    img.removeAttribute('src');
    toast('No se pudo mostrar la vista previa');
  };
  reader.readAsDataURL(file);
}
async function compressPaymentProof(file){
  if(!file)return null;
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('No se pudo leer la imagen de la constancia.'));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('No se pudo procesar la imagen de la constancia.'));
      img.onload=()=>{
        try{
          const maxSide=1280;
          const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
          canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
          const ctx=canvas.getContext('2d');
          if(!ctx)throw new Error('No se pudo preparar la imagen.');
          ctx.fillStyle='#fff';
          ctx.fillRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          resolve(canvas.toDataURL('image/jpeg',0.72));
        }catch(e){reject(e)}
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadPaymentProof(file,orderId){
  if(!file)return null;
  const ext='jpg';
  const path=`pedidos/${orderId}/comprobante-${Date.now()}.${ext}`;
  // Primero intentamos guardar la constancia en Storage como antes.
  // Si el navegador, CORS o la política del bucket devuelve "Failed to fetch",
  // no bloqueamos el pedido: guardamos una versión comprimida como data URL
  // dentro del campo de comprobante del pedido.
  try{
    const compressedDataUrl=await compressPaymentProof(file);
    const response=await fetch(compressedDataUrl);
    const blob=await response.blob();
    const uploadFile=new File([blob],`comprobante-${Date.now()}.jpg`,{type:'image/jpeg'});
    const {error}=await sb.storage.from('comprobantes-pago').upload(path,uploadFile,{upsert:false,contentType:'image/jpeg',cacheControl:'3600'});
    if(!error){
      const {data}=sb.storage.from('comprobantes-pago').getPublicUrl(path);
      if(data?.publicUrl)return data.publicUrl;
    }
    return compressedDataUrl;
  }catch(storageError){
    // Fallback robusto para evitar que un fallo de Storage impida enviar el pedido.
    try{
      return await compressPaymentProof(file);
    }catch(fallbackError){
      throw new Error('No se pudo preparar la constancia de Yape. Intenta seleccionar nuevamente la imagen.');
    }
  }
}
function useCurrentLocation(prefix){
  const status=document.getElementById('cLocationStatus');
  const latEl=document.getElementById('cLat');
  const lngEl=document.getElementById('cLng');
  const mapEl=document.getElementById('cMapLink');

  if(!navigator.geolocation){
    if(status)status.textContent='Este navegador no permite obtener ubicación.';
    return;
  }

  if(status)status.textContent='Obteniendo ubicación…';

  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude.toFixed(7), lng=pos.coords.longitude.toFixed(7);
    if(latEl)latEl.value=lat;
    if(lngEl)lngEl.value=lng;
    if(status)status.textContent=`Ubicación obtenida: ${lat}, ${lng}`;
    if(mapEl)mapEl.innerHTML=`<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener" style="color:var(--fr-ink);font-weight:700">Abrir ubicación en el mapa</a>`;
    if(prefix==='cart') updateDeliveryFarePreview();
  },err=>{
    let msg='No se pudo obtener la ubicación.';
    if(err.code===1)msg='Debes permitir el acceso a tu ubicación.';
    if(err.code===2)msg='No se pudo determinar tu ubicación.';
    if(err.code===3)msg='La ubicación tardó demasiado. Intenta nuevamente.';
    if(status)status.textContent=msg;
  },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
}

function rememberLastOrder(order){
  try{
    localStorage.setItem('pidemas_last_order',JSON.stringify({
      id:order.id,
      total:Number(order.total||0),
      metodo_pago:order.metodo_pago||'',
      nombre_cliente:order.nombre_cliente||'',
      creado_en:new Date().toISOString(),
      items:(order.items||[]).map(x=>({nombre:x.nombre,precio:Number(x.precio||0),cantidad:Number(x.cantidad||1)})),
      ubicacion:!!(order.latitud_entrega&&order.longitud_entrega),
      comprobante:!!order.comprobante,
      estado:order.estado||'pendiente',
      pago_confirmado:!!order.pago_confirmado,
      negocio_id:order.negocio_id||null
    }));
  }catch(e){}
  try{window.pdRenderActiveOrder&&window.pdRenderActiveOrder();}catch(e){}
}
function getLastOrder(){
  try{return JSON.parse(localStorage.getItem('pidemas_last_order')||'null')}catch(e){return null}
}
function trackingIndex(status){
  const s=String(status||'pendiente').toLowerCase();
  if(s==='cancelado') return -1;
  if(s==='entregado') return 5;
  if(s==='en_entrega') return 4;
  if(s==='en_camino') return 3;
  if(s==='aceptado') return 2;
  if(s==='asignado') return 1;
  return 0;
}
function trackingLabel(status){
  const s=String(status||'pendiente').toLowerCase();
  if(s==='cancelado') return 'Cancelado';
  if(s==='entregado') return 'Entregado';
  if(s==='en_entrega') return 'En entrega';
  if(s==='en_camino') return 'En camino';
  if(s==='aceptado') return 'Pedido aceptado';
  if(s==='asignado') return 'Motorizado asignado';
  return 'Pedido recibido';
}
function renderTracking(o){
  const idx=trackingIndex(o.estado);
  const steps=[
    ['Pedido recibido','Tu pedido fue registrado'],
    ['Motorizado asignado','Ya hay un motorizado para tu pedido'],
    ['Pedido aceptado','El motorizado aceptó tu pedido'],
    ['En camino','El motorizado está en camino'],
    ['En entrega','Tu pedido va hacia la dirección indicada'],
    ['Entregado','Pedido entregado correctamente']
  ];
  const tf=v=>{if(!v)return '';const d=new Date(v);return isNaN(d)?'':d.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});};
  const times=[o.creado_en,o.asignado_en,o.aceptado_en,o.en_camino_en,o.en_entrega_en,o.entregado_en];
  if(idx===-1){
    return `<div class="orderTracking pdTrk"><div class="pdTrkHead"><span class="pdKicker">Estado del pedido</span><span class="pdTrkLive">Actualizado</span></div><div class="pdTrkCancel">Este pedido fue cancelado.</div></div>`;
  }
  return `<div class="orderTracking pdTrk">
    <div class="pdTrkHead"><span class="pdKicker">Estado del pedido</span><span class="pdTrkLive"><i></i>Actualización automática</span></div>
    ${steps.map((st,i)=>{
      const done=i<idx,cur=i===idx,t=tf(times[i]);
      return `<div class="pdTrkStep${done?' is-done':''}${cur?' is-cur':''}${i===steps.length-1?' is-last':''}"><span class="pdTrkDot"></span><div class="pdTrkBody"><div class="pdTrkName"><span>${st[0]}</span>${cur?'<span class="pdTrkNow">Ahora</span>':(t&&i<=idx?`<span class="pdTrkTime">${t}</span>`:'')}</div>${cur?`<div class="pdTrkDesc">${st[1]}${t?' · '+t:''}</div>`:''}</div></div>`;
    }).join('')}
  </div>`;
}

async function refreshLastOrderTracking(){
  
  if(!pdClienteSesion?.id){
    toast('Inicia sesión con Google para guardar tus pedidos en tu cuenta.');
    pdAbrirCuentaCliente();
    return;
  }
const o=getLastOrder();
  if(!o?.id)return;
  const {data,error}=await sb.from('pedidos')
    .select('id,estado,pago_confirmado,motorizado_id,negocio_id,entregado_en,en_camino_en,en_entrega_en,aceptado_en,creado_en,en_local_en,negocio_aceptado_en,tiempo_preparacion_min,listo_para_recojo')
    .eq('id',o.id).maybeSingle();
  if(error||!data)return;
  const merged={...o,...data};
  try{localStorage.setItem('pidemas_last_order',JSON.stringify(merged));}catch(e){}
  const modal=document.getElementById('modal');
  if(!modal || modal.className==='hidden')return;
  const old=modal.querySelector('.orderTracking');
  if(old){
    const wrapper=old.parentElement;
    const fresh=document.createElement('div');
    fresh.innerHTML=renderTracking(merged);
    old.replaceWith(fresh.firstElementChild);
  }
  const badge=document.getElementById('lastOrderStatus');
  if(badge)badge.textContent=trackingLabel(data.estado);
}
function startOrderTracking(){
  refreshLastOrderTracking();
  if(window.pidemasTrackingTimer)clearInterval(window.pidemasTrackingTimer);
  window.pidemasTrackingTimer=setInterval(refreshLastOrderTracking,8000);
  if(window.pidemasRealtimeChannel){
    try{sb.removeChannel(window.pidemasRealtimeChannel)}catch(e){}
  }
  const id=getLastOrder()?.id;
  if(!id)return;
  window.pidemasRealtimeChannel=sb.channel('cliente-pedido-'+id)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'pedidos',filter:`id=eq.${id}`},payload=>{
      const current=getLastOrder()||{};
      const merged={...current,...payload.new};
      try{localStorage.setItem('pidemas_last_order',JSON.stringify(merged));}catch(e){}
      refreshLastOrderTracking();
    }).subscribe();
}


let pidemasCatalogChannels=[];
function startCatalogRealtime(){
  try{pidemasCatalogChannels.forEach(ch=>sb.removeChannel(ch));}catch(e){}
  pidemasCatalogChannels=[];
  const productChannel=sb.channel('tienda-productos-catalogo')
    .on('postgres_changes',{event:'*',schema:'public',table:'productos_negocio'},()=>{if(!new URLSearchParams(location.search).has('negocio'))loadData()})
    .on('postgres_changes',{event:'*',schema:'public',table:'productos_stock'},()=>{if(!new URLSearchParams(location.search).has('negocio'))loadData()})
    .on('postgres_changes',{event:'*',schema:'public',table:'categorias_negocio'},()=>{if(!new URLSearchParams(location.search).has('negocio'))loadData()})
    .subscribe();
  pidemasCatalogChannels.push(productChannel);
}

function roundDeliveryToTenth(value){
  return Math.round((Number(value)+Number.EPSILON)*10)/10;
}

// Tarifa oficial Pidemás:
// hasta 3 km = S/ 6.00; desde >3 km, S/ 2.00 por cada km adicional.
// El cálculo es proporcional y al final se redondea a S/ 0.10.
// La distancia se obtiene por carretera mediante OSRM/OpenStreetMap, sin Google API.
function calculateDeliveryFare(distanceKm){
  const km=Number(distanceKm);
  if(!Number.isFinite(km)||km<0)return null;
  const raw=km<=3 ? 6 : 6 + ((km-3)*2);
  return roundDeliveryToTenth(raw);
}

function getRestaurantForCart(){
  const firstRest=cart.find(x=>x.origen==='negocio');
  if(!firstRest)return null;
  return restaurants.find(r=>String(r.id)===String(firstRest.negocio_id))||null;
}

// Recupera el negocio directamente de Supabase si todavía no está en el
// catálogo cargado en memoria. Esto evita que un negocio cerrado/recién
// actualizado provoque un cálculo de delivery en S/ 0.00 o un falso error
// de ubicación.
async function getRestaurantForCartAsync(){
  const local=getRestaurantForCart();
  const idFresco=cart.find(x=>x.origen==='negocio')?.negocio_id;
  if(idFresco){try{const {data,error}=await sb.from('negocios').select('*').eq('id',idFresco).maybeSingle();if(!error&&data)return {...(local||{}),...data};}catch(e){}}
  if(local)return local;
  const firstRest=cart.find(x=>x.origen==='negocio');
  if(!firstRest?.negocio_id)return null;
  try{
    const {data,error}=await sb.from('negocios').select('*').eq('id',firstRest.negocio_id).maybeSingle();
    if(!error && data)return data;
  }catch(e){}
  return null;
}

function isPiuraCoordinate(lat,lng){
  return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>-5.35&&lat<-5.05&&lng>-80.80&&lng<-80.45;
}

/* Punto de salida para los productos de Pidemás (stock). Cámbialo por la dirección real de despacho. */
const PIDEMAS_BASE={latitude:-5.1945,longitude:-80.6328,nombre:'Pidemás (Plaza de Armas de Piura)'};

/* Coordenadas que vienen dentro de un enlace de Google Maps (…@lat,lng / ?q=lat,lng / !3dlat!4dlng) */
function coordsDesdeEnlaceMaps(url){
  const s=decodeURIComponent(String(url||''));
  const ps=[/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/];
  for(const re of ps){const m=s.match(re);if(m){const lat=Number(m[1]),lng=Number(m[2]);if(isPiuraCoordinate(lat,lng))return {latitude:lat,longitude:lng}}}
  return null;
}

/* Ubicación del negocio: SIEMPRE primero la de su perfil (latitud/longitud), luego su enlace de Google Maps.
   Las coordenadas fijas de abajo solo se usan si el perfil del negocio todavía no tiene ubicación. */
function getRestaurantCoords(r){
  if(!r)return null;
  const lat=Number(pick(r,['latitud','latitude','lat']));
  const lng=Number(pick(r,['longitud','longitude','lng','lon']));
  if(isPiuraCoordinate(lat,lng))return {latitude:lat,longitude:lng};
  const desdeMaps=coordsDesdeEnlaceMaps(pick(r,['google_maps_url','ubicacion_url','maps_url','ubicacion'],''));
  if(desdeMaps)return desdeMaps;
  const name=String(pick(r,['nombre','name'])||'').trim();
  if(/pera\s*madura/i.test(name))return {latitude:-5.190723,longitude:-80.625562};
  if(/cjotas/i.test(name))return {latitude:-5.1902175,longitude:-80.6292716};
  return null;
}

async function geocodeRestaurantInPiura(r){
  if(!r) return null;
  const name=String(pick(r,['nombre','name'])||'').trim();
  const address=String(pick(r,['direccion','address','domicilio'])||'').trim();
  const cacheKey='pidemas_restaurant_geo_'+String(r.id||name||'sin-id');
  // No reutilizar caché para La Pera Madura: el problema detectado era precisamente
  // una coordenada antigua/incorrecta del negocio.
  if(/pera\s*madura/i.test(name)){
    const coords={latitude:-5.190723,longitude:-80.625562};
    try{localStorage.setItem(cacheKey,JSON.stringify(coords));}catch(e){}
    return coords;
  }
  try{
    const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');
    if(cached && Number.isFinite(Number(cached.latitude)) && Number.isFinite(Number(cached.longitude))){
      return {latitude:Number(cached.latitude),longitude:Number(cached.longitude)};
    }
  }catch(e){}

  // Dirección conocida de La Pera Madura, para evitar depender de una URL corta de Google Maps.
  const fallbackAddress=/pera\s*madura/i.test(name) && !address ? 'Jr. Arequipa 166, Piura, Peru' : '';
  const queries=[];
  if(address){
    const cleanAddress=address.replace(/https?:\/\/\S+/gi,'').trim();
    if(cleanAddress) queries.push(`${cleanAddress}, Piura, Peru`);
  }
  if(name) queries.push(`${name}, Piura, Peru`);
  if(name && address){
    const cleanAddress=address.replace(/https?:\/\/\S+/gi,'').trim();
    if(cleanAddress) queries.push(`${name}, ${cleanAddress}, Piura, Peru`);
  }
  if(fallbackAddress) queries.push(fallbackAddress);

  for(const q of queries){
    // Primer geocodificador: Nominatim/OpenStreetMap.
    try{
      const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=pe&q='+encodeURIComponent(q);
      const response=await fetch(url,{headers:{'Accept':'application/json','Accept-Language':'es'}});
      if(response.ok){
        const rows=await response.json();
        const row=Array.isArray(rows)?rows[0]:null;
        const lat=Number(row?.lat),lon=Number(row?.lon);
        if(Number.isFinite(lat)&&Number.isFinite(lon)&&lat>-5.35&&lat<-5.05&&lon>-80.80&&lon<-80.45){
          const coords={latitude:lat,longitude:lon};
          try{localStorage.setItem(cacheKey,JSON.stringify(coords));}catch(e){}
          return coords;
        }
      }
    }catch(e){}

    // Segundo geocodificador: Photon. Sirve como respaldo cuando Nominatim no responde.
    try{
      const url='https://photon.komoot.io/api/?limit=1&q='+encodeURIComponent(q);
      const response=await fetch(url,{headers:{'Accept':'application/json'}});
      if(response.ok){
        const data=await response.json();
        const c=data?.features?.[0]?.geometry?.coordinates;
        const lon=Number(c?.[0]),lat=Number(c?.[1]);
        if(Number.isFinite(lat)&&Number.isFinite(lon)&&lat>-5.35&&lat<-5.05&&lon>-80.80&&lon<-80.45){
          const coords={latitude:lat,longitude:lon};
          try{localStorage.setItem(cacheKey,JSON.stringify(coords));}catch(e){}
          return coords;
        }
      }
    }catch(e){}
  }
  return null;
}

function straightLineKm(origin,destination){
  const olat=Number(origin?.latitude), olng=Number(origin?.longitude);
  const dlat=Number(destination?.latitude), dlng=Number(destination?.longitude);
  if(![olat,olng,dlat,dlng].every(Number.isFinite)) return NaN;
  const toRad=v=>v*Math.PI/180;
  const dLat=toRad(dlat-olat), dLon=toRad(dlng-olng);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(olat))*Math.cos(toRad(dlat))*Math.sin(dLon/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

async function getRoadDistanceKm(origin,destination){
  const olat=Number(origin?.latitude), olng=Number(origin?.longitude);
  const dlat=Number(destination?.latitude), dlng=Number(destination?.longitude);
  if(![olat,olng,dlat,dlng].every(Number.isFinite)){
    throw new Error('No hay coordenadas válidas para calcular el delivery.');
  }

  // IMPORTANTE: aquí NO se hacen aproximaciones geométricas ni factores inventados.
  // La distancia mostrada debe venir de una ruta real sobre la red vial.
  // Primero usamos OSRM/OpenStreetMap y, si no responde, Valhalla.
  // Si ninguno puede calcular una ruta, se informa el error en vez de fabricar una distancia.
  try{
    const url='https://router.project-osrm.org/route/v1/driving/'+
      encodeURIComponent(olng+','+olat+';'+dlng+','+dlat)+
      '?overview=false&steps=false&alternatives=true&continue_straight=false';
    const response=await fetch(url,{headers:{'Accept':'application/json'}});
    const data=await response.json();
    const routes=Array.isArray(data?.routes)?data.routes:[];
    const distances=routes
      .map(r=>Number(r?.distance))
      .filter(m=>Number.isFinite(m)&&m>=0)
      .map(m=>m/1000);
    if(response.ok && data?.code==='Ok' && distances.length){
      // Usamos la ruta real más corta devuelta por OSRM; no se modifica su distancia.
      return Math.min(...distances);
    }
  }catch(e){}

  try{
    const response=await fetch('https://valhalla1.openstreetmap.de/route',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json','X-Client-Id':'pidemas-delivery'},
      body:JSON.stringify({
        locations:[
          {lat:olat,lon:olng,radius:1000},
          {lat:dlat,lon:dlng,radius:1000}
        ],
        costing:'motorcycle',
        units:'kilometers'
      })
    });
    const data=await response.json();
    const km=Number(data?.trip?.summary?.length);
    if(response.ok && Number.isFinite(km) && km>=0) return km;
  }catch(e){}

  throw new Error('No se pudo calcular una ruta real por carretera. No se mostrará una distancia aproximada. Verifica la ubicación e inténtalo nuevamente.');
}
async function calculateCurrentDelivery(){
  const lat=Number(document.getElementById('cLat')?.value);
  const lng=Number(document.getElementById('cLng')?.value);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)) throw new Error('Primero debes enviar tu ubicación.');
  const esStock=!cart.some(x=>x.origen==='negocio');
  const restaurant=esStock?null:await getRestaurantForCartAsync();
  if(!restaurant&&!esStock){
    throw new Error('No se pudo identificar el negocio del pedido. Vuelve a cargar la tienda e inténtalo nuevamente.');
  }
  let origin=esStock?{latitude:PIDEMAS_BASE.latitude,longitude:PIDEMAS_BASE.longitude}:getRestaurantCoords(restaurant);

  // Nunca permitir que una coordenada del negocio produzca una ruta absurda.
  // Si el punto está a más de 40 km del cliente, se considera incorrecto y se vuelve
  // a buscar por dirección/nombre.
  if(origin){
    const roughKm=straightLineKm(origin,{latitude:lat,longitude:lng});
    if(!Number.isFinite(roughKm)||roughKm>40) origin=null;
  }
  if(!origin&&!esStock){
    origin=await geocodeRestaurantInPiura(restaurant);
  }
  if(!origin){
    throw new Error('No se pudo localizar correctamente el negocio en Piura. Revisa su dirección en el panel de Pidemás.');
  }
  const roughKm=straightLineKm(origin,{latitude:lat,longitude:lng});
  if(!Number.isFinite(roughKm)||roughKm>40){
    throw new Error('La ubicación del negocio no es válida para esta entrega. Revisa sus coordenadas GPS en el panel de Pidemás.');
  }
  let distanceKm,aproximado=false;
  try{distanceKm=await getRoadDistanceKm(origin,{latitude:lat,longitude:lng});}
  catch(e1){
    await new Promise(r=>setTimeout(r,1500));
    try{distanceKm=await getRoadDistanceKm(origin,{latitude:lat,longitude:lng});}
    catch(e2){
      /* Plan B: los mapas no respondieron. Distancia en línea recta + 30 % por las calles, marcada como aproximada */
      distanceKm=Math.round(straightLineKm(origin,{latitude:lat,longitude:lng})*1.3*100)/100;aproximado=true;
    }
  }
  window.__pdDeliveryAprox=aproximado;
  if(!Number.isFinite(distanceKm)||distanceKm>60){
    throw new Error('La ruta obtenida no es válida para una entrega dentro de Piura. Revisa la ubicación del negocio.');
  }
  /* Tarifa configurable desde el Admin (zonas, recargos, mínimo y máximo) */
  let tf=null;try{if(window.pdTarifa){await pdTarifa.cargar();tf=pdTarifa.calcular({km:distanceKm,destino:{lat,lng},subtotal:(typeof getCartTotal==='function'?getCartTotal():0),aproximado});}}catch(e){tf=null}
  window.__pdTarifaUltima=tf;
  return {distanceKm,delivery:tf?tf.total:calculateDeliveryFare(distanceKm),tarifa:tf,restaurant:restaurant||{id:null,nombre:PIDEMAS_BASE.nombre,stock:true},aproximado,stock:esStock};
}

function renderDeliveryBox(text,kind='normal'){
  const el=document.getElementById('deliveryFareBox');
  if(!el)return;
  el.innerHTML=text;
  el.style.background=kind==='error'?'#fff1f1':'#FBF3EE';
}

async function updateDeliveryFarePreview(){
  const locationStatus=document.getElementById('cLocationStatus');
  const locationText=String(locationStatus?.textContent||'').trim();
  if(locationText==='' || /Aún no se ha enviado la ubicación/i.test(locationText)){
    renderDeliveryBox(`<div style="font-size:13px;color:var(--fr-muted)">Ubicación de entrega</div><div style="font-size:14px;font-weight:700;margin-top:4px">Pulsa «Usar mi ubicación actual» para calcular el delivery.</div>`);
    return;
  }
  const subtotal=getCartTotal();
  const currentLat=Number(document.getElementById('cLat')?.value);
  const currentLng=Number(document.getElementById('cLng')?.value);
  if(!Number.isFinite(currentLat)||!Number.isFinite(currentLng)){
    renderDeliveryBox(`<div style="font-size:13px;color:var(--fr-muted)">Ubicación de entrega</div><div style="font-size:14px;font-weight:700;margin-top:4px">Pulsa «Usar mi ubicación actual» para calcular el delivery.</div>`);
    return;
  }
  renderDeliveryBox(`<div style="font-size:13px;color:var(--fr-muted)">Calculando delivery...</div><div style="font-size:20px;font-weight:800;margin-top:3px">—</div>`);
  try{
    const result=await calculateCurrentDelivery();
    if(!result.restaurant){
      currentDeliveryCost=0;
      currentDeliveryDistanceKm=0;
      updatePaymentAmounts();
      renderDeliveryBox(`<div style="font-size:13px;color:var(--fr-muted)">Delivery</div><div style="font-size:20px;font-weight:800;margin-top:3px">S/ 0.00</div>`);
      return;
    }
    currentDeliveryCost=Number(result.delivery||0);
    currentDeliveryDistanceKm=Number(result.distanceKm||0);
    updatePaymentAmounts();
    renderDeliveryBox(`<div style="font-size:13px;color:var(--fr-muted)">${result.aproximado?'Distancia aproximada':'Distancia por carretera'}</div><div style="font-size:16px;font-weight:800;margin-top:2px">${result.distanceKm.toFixed(2)} km</div><div style="font-size:11px;color:var(--fr-muted);margin-top:3px">${result.aproximado?'Distancia aproximada: los mapas no respondieron. Pidemás puede ajustar el delivery.':'Ruta calculada con OpenStreetMap'}</div><div style="font-size:13px;color:var(--fr-muted);margin-top:7px">Delivery</div><div style="font-size:20px;font-weight:800;margin-top:3px">S/ ${result.delivery.toFixed(2)}</div><div style="font-size:13px;color:var(--fr-muted);margin-top:7px">Total del pedido: S/ ${(subtotal+result.delivery).toFixed(2)}</div>`);
  }catch(e){
    currentDeliveryCost=0;
    currentDeliveryDistanceKm=null;
    updatePaymentAmounts();
    renderDeliveryBox(`<div style="font-size:13px;color:#a00">${esc(e.message||'No se pudo calcular el delivery.')}</div>`,'error');
  }
}

async function submitCartOrder(){
  const descOn=(typeof window.pdDescActivo==='function')&&window.pdDescActivo();
  const descItems=descOn?window.pdDescItems():[];
  const cubOn=descOn&&window.pdDescCubOn();
  const descCub=cubOn?window.pdDescCubPrecio():0;
  const descMonto=descItems.reduce((a,x)=>a+x.p,0)+descCub;
  /* Si un precio cambió mientras el producto estaba en el carrito, se actualiza y se avisa antes de enviar */
  {const cambiados=[];cart.forEach(x=>{const p=(typeof products!=='undefined'?products:[]).find(y=>String(y.id)===String(x.id)&&y.origen===x.origen);if(!p)return;const real=Number(pick(p,['precio','precio_unitario'],x.precio));if(Number.isFinite(real)&&Math.abs(real-Number(x.precio||0))>0.009){cambiados.push(x.nombre);x.precio=real}});
    if(cambiados.length){saveCart();updateCart();try{updatePaymentAmounts()}catch(_){}toast('Cambió el precio de '+cambiados.join(', ')+'. Revisa el total y vuelve a enviar tu pedido.');return}}
  const subtotal=cart.reduce((a,x)=>a+x.precio*x.cantidad,0)+descMonto;
  let deliveryCost=0, deliveryDistanceKm=null;
  try{
    const delivery=await calculateCurrentDelivery();
    deliveryCost=Number(delivery.delivery||0);
    deliveryDistanceKm=Number(delivery.distanceKm||0);
  }catch(e){
    toast(e.message||'No se pudo calcular el delivery.');
    return;
  }
  let discountAmount=0, discountCode='';
  if(appliedDeliveryDiscount){discountAmount=Math.min(deliveryCost,Math.max(0,Number(appliedDeliveryDiscount.amount||0)));discountCode=String(appliedDeliveryDiscount.codigo||'').trim().toUpperCase();}
  const finalDeliveryCost=Math.max(0,deliveryCost-discountAmount);
  const total=subtotal+finalDeliveryCost;
  const name=document.getElementById('cNombre').value.trim();
  const tel=document.getElementById('cTelefono').value.trim();
  const dir=document.getElementById('cDireccion').value.trim();
  const lat=document.getElementById('cLat')?.value||null;
  const lng=document.getElementById('cLng')?.value||null;
  const pago=document.getElementById('cPago').value;
  if(!pago){toast('Selecciona un método de pago antes de enviar el pedido.');return}
  const proof=document.getElementById('cProof')?.files?.[0]||null;
  if(!name||!tel||!dir){toast('Completa nombre, teléfono y dirección');return}
  // Comprobante: boleta (DNI) o factura (RUC). Se guarda dentro de observaciones con una marca.
  let compMarca='';
  const limpiaComp=v=>String(v||'').replace(/\s+[·|]\s+/g,' ').replace(/[{}]/g,'').trim();
  try{
    const ct=document.getElementById('cCompTipo')?.value||'ninguno';
    if(ct==='boleta'){
      const dni=String(document.getElementById('cCompDni')?.value||'').replace(/\D/g,'');
      if(!/^\d{8}$/.test(dni)){toast('Para la boleta ingresa un DNI de 8 dígitos.');pdCompSel('boleta');document.getElementById('cCompDni')?.focus();return}
      const nb=String(document.getElementById('cCompNombre')?.value||'').trim();
      compMarca='__PIDEMAS_COMPROBANTE__'+JSON.stringify({tipo:'boleta',documento:'DNI',numero:dni,nombre:limpiaComp(nb||name)});
    }else if(ct==='factura'){
      const ruc=String(document.getElementById('cCompRuc')?.value||'').replace(/\D/g,'');
      const razon=String(document.getElementById('cCompRazon')?.value||'').trim();
      const dirF=String(document.getElementById('cCompDirFiscal')?.value||'').trim();
      if(!/^(10|15|16|17|20)\d{9}$/.test(ruc)){toast('Para la factura ingresa un RUC válido de 11 dígitos.');pdCompSel('factura');document.getElementById('cCompRuc')?.focus();return}
      if(razon.length<3){toast('Para la factura ingresa la razón social.');pdCompSel('factura');document.getElementById('cCompRazon')?.focus();return}
      compMarca='__PIDEMAS_COMPROBANTE__'+JSON.stringify({tipo:'factura',documento:'RUC',numero:ruc,razon_social:limpiaComp(razon),direccion_fiscal:limpiaComp(dirF)});
    }
  }catch(e){console.warn('Comprobante:',e)}
  // Yape se paga al recibir: el motorizado muestra el QR. Ya no se pide captura al cliente.
  const montoPago=Number(document.getElementById('cMontoPago')?.value||0);
  if(pago==='efectivo' && (!Number.isFinite(montoPago) || montoPago < total)){
    toast(`Ingresa un monto en efectivo igual o mayor a S/ ${total.toFixed(2)}`);
    return;
  }
  const vuelto=pago==='efectivo' ? Math.max(0,montoPago-total) : 0;

  const businessItems=cart.filter(x=>x.origen==='negocio');
  const firstRest=businessItems[0]||null;
  // El ID del negocio se conserva en cada línea del carrito. No dependemos
  // de que el catálogo siga cargado en memoria al momento de enviar el pedido.
  const businessIds=[...new Set(businessItems.map(x=>String(x.negocio_id||'')).filter(Boolean))];
  if(businessIds.length>1){
    toast('Tu pedido debe contener productos de un solo negocio. Vacía el carrito y vuelve a intentarlo.');
    return;
  }
  const rp=firstRest?products.find(p=>String(p.id)===String(firstRest.id)&&p.origen==='negocio'):null;
  const orderBusinessId=firstRest?.negocio_id||rp?.negocio_id||null;
  if(firstRest && !orderBusinessId){
    toast('No se pudo identificar el negocio del producto. Vuelve a abrir su carta y agrega nuevamente el producto.');
    return;
  }
  // Generamos el ID antes de insertar para poder guardar la constancia
  // dentro del mismo INSERT y evitar el UPDATE bloqueado por RLS.
  const orderId=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)}));
  let proofUrl=null;
  if(proof){
    try{
      proofUrl=await uploadPaymentProof(proof,orderId);
    }catch(e){
      toast('No se pudo subir la constancia de Yape: '+(e.message||e));
      return;
    }
  }

  const pdYapeModo=pago==='yape'?(document.querySelector('input[name="pdYapeModo"]:checked')?.value||'motorizado'):'';
  const baseObs=[document.getElementById('cObs').value.trim(),pdYapeModo==='negocio'?'Pago Yape: prefiere coordinar con el negocio por WhatsApp':pdYapeModo==='motorizado'?'Pago Yape: pagará al motorizado con QR al recibir':'',(typeof window.pdCarrito18==='function'&&window.pdCarrito18())?'PRODUCTO_MAYOR_18_VERIFICAR_DNI':''].filter(Boolean).join(' · ');
  const paymentObs=pago==='efectivo'
    ? `__PIDEMAS_PAGO_EFECTIVO__${JSON.stringify({monto:montoPago,vuelto:vuelto,subtotal:subtotal,delivery:finalDeliveryCost,total:total,delivery_original:deliveryCost,descuento_delivery:discountAmount,codigo_descuento:discountCode})}`
    : '';
  const descProd=(typeof window.pdDescProdResumen==='function')?window.pdDescProdResumen():[];
  const descMarca=(descOn||descProd.length)?'__PIDEMAS_DESCARTABLES__'+JSON.stringify({items:descItems.map(x=>({n:x.n,p:x.p})).concat(descProd.map(n=>({n,p:0}))),cubiertos:cubOn,cubiertos_precio:descCub}):'';
  const orderObservaciones=[baseObs,paymentObs,compMarca,descMarca].filter(Boolean).join(' · ');

  const tokenCliente=(window.crypto&&crypto.randomUUID)?crypto.randomUUID()+crypto.randomUUID():Array.from({length:4},()=>Math.random().toString(36).slice(2)).join('');
  try{window.pdGuardarTokenPedido&&window.pdGuardarTokenPedido(orderId,tokenCliente)}catch(_){}
  const order={id:orderId,token_cliente:tokenCliente,cliente_auth_id:pdClienteSesion?.id||null,tipo_pedido:orderBusinessId?'negocio':'stock',negocio_id:orderBusinessId,estado:'pendiente',motorizado_id:null,pago_confirmado:false,nombre_cliente:name,telefono_cliente:tel,direccion_entrega:dir,referencia_entrega:document.getElementById('cReferencia').value,latitud_entrega:lat?Number(lat):null,longitud_entrega:lng?Number(lng):null,metodo_pago:pago,subtotal:subtotal,costo_delivery:finalDeliveryCost,total,observaciones:[orderObservaciones,(deliveryDistanceKm!==null||window.__pdProg)?`__PIDEMAS_DELIVERY__${JSON.stringify({aproximado:!!window.__pdDeliveryAprox,zona:(window.__pdTarifaUltima&&window.__pdTarifaUltima.zona)||null,detalle:(window.pdDetalleTxt?window.pdDetalleTxt():null),programado:(window.pdProgMarca&&window.pdProgMarca()?window.pdProgMarca().iso:null),programado_txt:(window.pdProgMarca&&window.pdProgMarca()?window.pdProgMarca().txt:null),km:deliveryDistanceKm,costo:finalDeliveryCost,delivery_original:deliveryCost,descuento_delivery:discountAmount,codigo_descuento:discountCode})}`:''].filter(Boolean).join(' · '),comprobante_pago_url:proofUrl};

  // Reservar/descontar stock de forma segura antes de crear el pedido.
  // Cada actualización exige que todavía exista suficiente stock; si una línea falla,
  // se revierte lo reservado para no dejar cantidades incompletas.
  // Validación final del horario antes de enviar el pedido.
  // El cliente puede conservar productos agregados cuando el negocio estaba abierto,
  // pero nunca puede completar el pedido si el negocio ya cerró.
  const negocioParaValidar=cart.find(x=>x.origen==='negocio');
  if(negocioParaValidar){
    // Volvemos a consultar el negocio justo antes de reservar stock. Así el
    // horario que manda es el actual, aunque el producto haya sido agregado
    // cuando el local estaba abierto.
    let negocioActual;
    try{negocioActual=await getRestaurantForCartAsync();}
    catch(error){
      console.error('No se pudo verificar el horario del negocio:',error);
      toast('No se pudo verificar si el negocio está abierto. Comprueba tu conexión e inténtalo nuevamente.');
      return;
    }
    if(!negocioActual || !isRestaurantOpen(negocioActual)){
      const nombreNegocio=negocioActual
        ? pick(negocioActual,['nombre','nombre_negocio','razon_social'],'El negocio')
        : 'El negocio';
      toast(`${nombreNegocio} está cerrado. No puedes completar este pedido ahora.`);
      if(typeof mostrarAvisoHorario==='function'){
        mostrarAvisoHorario(`${nombreNegocio} está cerrado. Tu pedido no puede continuar hasta que vuelva a abrir.`);
      }
      return;
    }
  }

  // Reserva de stock mediante funciones RPC SECURITY DEFINER de Supabase.
  // Así no dependemos de que el navegador tenga permiso UPDATE por RLS.
  async function reserveProductStockDirect(table,id,qty,variante){
    const {data,error}=await sb.rpc('reservar_stock',{p_pedido:orderId,p_tabla:table,p_producto:String(id),p_variante:variante?String(variante):null,p_cantidad:qty});
    if(error) throw new Error(error.message||'Supabase no pudo reservar el stock.');
    return data===true||(Array.isArray(data)&&data[0]===true)?{id,ok:true}:null;
  }

  // Compensa una reserva si falla la creación del pedido o alguna línea posterior.
  async function releaseProductStockDirect(table,id,qty,variante){
    const {data,error}=await sb.rpc('liberar_stock',{p_pedido:orderId,p_tabla:table,p_producto:String(id),p_variante:variante?String(variante):null,p_cantidad:qty});
    if(error) throw new Error(error.message||'No se pudo devolver el stock reservado.');
    return !!data;
  }

  const stockReservations=[];
  try{
    for(const x of cart){
      const qty=Math.max(1,Math.floor(Number(x.cantidad||1)));
      const table=x.origen==='negocio'?'productos_negocio':'productos_stock';
      const updated=await reserveProductStockDirect(table,x.id,qty,x.variante||null);
      if(!updated){
        throw new Error(`El producto "${x.nombre}" ya no tiene suficiente stock.`);
      }
      stockReservations.push({table,id:x.id,qty,variante:x.variante||null});
    }
  }catch(stockError){
    for(const r of stockReservations){
      try{await releaseProductStockDirect(r.table,r.id,r.qty,r.variante);}catch(e){console.error('No se pudo revertir stock:',e);}
    }
    toast('No se pudo reservar el stock: '+(stockError?.message||stockError));
    return;
  }

  console.info('[Pidemás] Registrando pedido principal…');
  const {error}=await sb.from('pedidos').insert(order);
  if(error){
    for(const r of stockReservations){
      try{await releaseProductStockDirect(r.table,r.id,r.qty,r.variante);}catch(e){console.error('No se pudo revertir stock:',e);}
    }
    if(/CLIENTE_BLOQUEADO/.test(String(error.message||''))){toast('No pudimos registrar tu pedido. Comunícate con Pidemás Delivery por WhatsApp.');return}
    toast('No se pudo enviar: '+error.message);return
  }

  // detalle_pedidos.producto_id apunta a la tabla legacy "productos".
  // Los productos actuales vienen de productos_negocio/productos_stock,
  // por lo que sus UUID no necesariamente existen en "productos".
  // Guardamos el producto por nombre/precio/cantidad y dejamos producto_id en NULL
  // para evitar la violación de la FK detalle_pedidos_producto_id_fkey.
  const detalles=cart.map(x=>({
    pedido_id:orderId,
    producto_id:null,
    producto_ref:String(x.id),
    origen:x.origen||null,
    variante:x.variante||null,
    nombre_producto:(window.pdNombreConCategoria?pdNombreConCategoria(x):x.nombre),
    precio_unitario:x.precio,
    cantidad:x.cantidad,
    subtotal:x.precio*x.cantidad
  }));
  descItems.filter(x=>x.p>0).forEach(x=>detalles.push({pedido_id:orderId,producto_id:null,producto_ref:null,origen:null,variante:null,nombre_producto:x.n,precio_unitario:x.p,cantidad:1,subtotal:x.p}));
  if(descCub>0)detalles.push({pedido_id:orderId,producto_id:null,producto_ref:null,origen:null,variante:null,nombre_producto:'Cubiertos',precio_unitario:descCub,cantidad:1,subtotal:descCub});
  console.info('[Pidemás] Registrando productos del pedido…', orderId);
  const d=await sb.from('detalle_pedidos').insert(detalles);
  // No borrar el pedido principal si falla el detalle: el borrado provocaba que
  // el cliente creyera que envió el pedido, pero este desaparecía de Pidemás.
  // Conservamos el registro principal y mostramos una advertencia visible para
  // poder localizar el fallo de detalle_pedidos en Supabase.
  let detalleErrorMensaje='';
  if(d.error){
    console.error('detalle_pedidos error; el pedido principal se conserva:', d.error);
    detalleErrorMensaje=d.error.message||'No se pudieron guardar los productos del pedido';
  }
  saveCustomerInfo(name,tel);
  const history=getOrderHistory();
  history.unshift({id:orderId,negocio_id:rp?.negocio_id||null,subtotal,delivery_cost:finalDeliveryCost,delivery_distance_km:deliveryDistanceKm,total,descuento_delivery:discountAmount,codigo_descuento:discountCode,delivery_original:deliveryCost,metodo_pago:pago,monto_pago:pago==='efectivo'?montoPago:null,vuelto:pago==='efectivo'?vuelto:null,nombre_cliente:name,telefono_cliente:tel,items:cart.map(x=>({id:x.id,origen:x.origen,nombre:x.nombre,precio:Number(x.precio||0),cantidad:Number(x.cantidad||1)})),estado:'pendiente',pago_confirmado:false,creado_en:new Date().toISOString()});
  try{
    const scopedKey=pdClienteSesion?.id?'pidemas_order_history_user_'+pdClienteSesion.id:'pidemas_order_history';
    localStorage.setItem(scopedKey,JSON.stringify(history.slice(0,50)));
    localStorage.setItem('pidemas_order_history',JSON.stringify(history.slice(0,50)));
  }catch(e){}
  rememberLastOrder({
    id:orderId,
    total,
    metodo_pago:pago,
    nombre_cliente:name,
    items:cart,
    latitud_entrega:lat,
    longitud_entrega:lng,
    comprobante:!!proof,
    estado:'pendiente',
    pago_confirmado:false,
  });
  if(discountCode&&appliedDeliveryDiscount?.id){try{const {error:rpcErr}=await sb.rpc('usar_codigo_delivery',{p_id:appliedDeliveryDiscount.id,p_pedido:orderId});if(rpcErr)throw rpcErr;}catch(e){console.warn('No se pudo actualizar uso del código:',e);}}
  cart=[];saveCart();updateCart();try{window.pdDescReset&&window.pdDescReset()}catch(e){}
  // Reemplazar el modal de checkout directamente evita que el popstate de closeModal()
  // cierre también el mensaje de éxito en móviles.
  showModal(`<div class="sheet pdOkSheet" role="dialog" aria-modal="true" aria-label="Pedido enviado">
    <button class="close pdOkClose" onclick="closeModal()" aria-label="Cerrar">×</button>
    <div class="pdOkBody">
      <div class="pdOkHero">
        <span class="pdOkBadge" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.4H7.7a1.6 1.6 0 0 1-1.6-1.4L5 8z"/><path d="M9 8V6.8a3 3 0 0 1 6 0V8"/><path d="m9.4 14.2 1.9 1.9 3.5-3.7"/></svg></span>
        <h2>${detalleErrorMensaje?'Pedido registrado':'¡Pedido enviado!'}</h2>
        <p>${detalleErrorMensaje?'Tu pedido quedó registrado, pero hubo un problema al guardar los productos.':'La tienda ya recibió tu pedido y lo confirmará en breve.'}</p>
      </div>
      <div class="pdOkTicket">
        <div class="pdOkRow"><span>N.º de pedido</span><b>#${String(orderId).slice(0,8).toUpperCase()}</b></div>
        <div class="pdOkRow"><span>Estado</span><em class="pdOkPill">Pendiente</em></div>
        ${lat&&lng?`<div class="pdOkRow"><span>Ubicación</span><b class="pdOkYes">✓ Enviada</b></div>`:''}
        ${proof?`<div class="pdOkRow"><span>Comprobante</span><b class="pdOkYes">✓ En revisión</b></div>`:''}
      </div>
      ${detalleErrorMensaje?`<div class="pdOkWarn">Aviso técnico: ${esc(detalleErrorMensaje)}. Comunícate con Pidemás indicando el número de pedido.</div>`:''}
      <button class="primary pdOkBtn" onclick="closeModal()">Aceptar</button>
    </div>
  </div>`);

}

let pidemasModalHistoryActive=false;
let pidemasModalClosingFromHistory=false;
function updatePidemasViewportHeight(){
  const vv=(window.visualViewport&&window.visualViewport.height)||0,ih=window.innerHeight||document.documentElement.clientHeight;
  const a=document.activeElement,escribe=!!(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable));
  /* Con el teclado abierto la hoja NO se encoge (eso la deformaba): mantiene su alto y el navegador sube el campo */
  const teclado=escribe&&vv>0&&vv<ih*0.8;
  document.documentElement.classList.toggle('pdTeclado',teclado);
  if(teclado)return;
  const h=vv||ih;
  if(h>0)document.documentElement.style.setProperty('--pidemas-vh',`${Math.round(h)}px`);
}
document.addEventListener('focusin',()=>setTimeout(updatePidemasViewportHeight,60));
document.addEventListener('focusout',()=>setTimeout(updatePidemasViewportHeight,120));
updatePidemasViewportHeight();
window.addEventListener('resize',updatePidemasViewportHeight,{passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',updatePidemasViewportHeight,{passive:true});
  window.visualViewport.addEventListener('scroll',updatePidemasViewportHeight,{passive:true});
}
function showModal(content){
  const modal=document.getElementById('modal');
  const wasOpen=modal.classList.contains('overlay');
  updatePidemasViewportHeight();
  modal.className='overlay';
  modal.innerHTML=content;
  document.body.classList.add('modal-open');
  if(!wasOpen&&!pidemasModalClosingFromHistory){
    pidemasModalHistoryActive=false;
  }
  requestAnimationFrame(()=>{
    updatePidemasViewportHeight();
    const sheet=modal.querySelector('.sheet,.imageOnlySheet,.scheduleSheet,.productDetailSheet');
    if(sheet)sheet.scrollTop=0;
    modal.scrollTop=0;
  });
}
function closeModal(options={}){
  const modal=document.getElementById('modal');
  const wasOpen=modal.classList.contains('overlay');
  modal.className='hidden';modal.innerHTML='';
  document.body.classList.remove('modal-open');
  if(wasOpen&&pidemasModalHistoryActive&&!options.fromPopstate){
    pidemasModalHistoryActive=false;
    pidemasModalClosingFromHistory=true;
    try{history.back();}catch(e){}
    setTimeout(()=>{pidemasModalClosingFromHistory=false;},250);
  }else if(options.fromPopstate){
    pidemasModalHistoryActive=false;
  }
}
window.addEventListener('popstate',()=>{
  const modal=document.getElementById('modal');
  if(modal&&modal.classList.contains('overlay')&&!window.__pdAtras)closeModal({fromPopstate:true});
  else pidemasModalHistoryActive=false;
});
// Al enfocar un campo con el teclado abierto, mantenerlo y el botón de envío accesibles.
document.addEventListener('focusin',event=>{
  const modal=document.getElementById('modal');
  if(!modal||!modal.classList.contains('overlay')||!modal.contains(event.target))return;
  if(!event.target.matches('input,textarea,select'))return;
  setTimeout(()=>{
    updatePidemasViewportHeight();
    try{event.target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});}catch(e){}
  },220);
});
// Protege el envío: errores inesperados se muestran al cliente y el botón no queda bloqueado.
const pidemasOriginalSubmitCartOrder=submitCartOrder;
submitCartOrder=async function(){
  if(window.__pidemasOrderSubmitting){toast('El pedido sigue en proceso. No vuelvas a pulsar enviar.');return;}
  const button=document.querySelector('#modal.overlay .primary[onclick*="submitCartOrder"]');
  window.__pidemasOrderSubmitting=true;
  if(button){button.disabled=true;button.dataset.originalText=button.dataset.originalText||button.textContent;button.dataset.originalHtml=button.innerHTML;button.textContent='Enviando pedido…';button.style.opacity='.7';button.style.cursor='wait';}
  let watchdog=null;
  try{
    // Si una consulta de red queda pendiente, avisar en vez de dejar la pantalla sin explicación.
    const timeoutPromise=new Promise((_,reject)=>{
      watchdog=setTimeout(()=>reject(new Error('El envío se detuvo porque el servidor no respondió. El resultado puede ser incierto: revisa primero el panel de Pidemás antes de reintentar.')),45000);
    });
    await Promise.race([pidemasOriginalSubmitCartOrder(),timeoutPromise]);
  }catch(error){
    console.error('Error inesperado al enviar pedido:',error);
    toast('No se pudo confirmar el envío: '+(error?.message||'error inesperado. Revisa el panel antes de reintentar.'));
  }finally{
    if(watchdog)clearTimeout(watchdog);
    window.__pidemasOrderSubmitting=false;
    const currentButton=document.querySelector('#modal.overlay .primary[onclick*="submitCartOrder"]');
    if(currentButton){currentButton.disabled=false;if(currentButton.dataset.originalHtml)currentButton.innerHTML=currentButton.dataset.originalHtml;else currentButton.textContent=currentButton.dataset.originalText||'Enviar pedido';currentButton.style.opacity='';currentButton.style.cursor='';}
  }
}
let pidemasToastTimer=null;
function toast(msg){
  const t=document.getElementById('toast');if(!t)return;
  t.textContent=String(msg||'');t.style.display='block';
  t.style.zIndex='10050';
  if(pidemasToastTimer) clearTimeout(pidemasToastTimer);
  pidemasToastTimer=setTimeout(()=>{t.style.display='none';},String(msg||'').length>90?6500:3500);
}
async function openOrderHistory(){
  if(!pdClienteSesion?.id){
    showModal(`<div class="sheet"><div class="sheetTop"><h2>Mis pedidos</h2><button class="close" onclick="closeModal()">×</button></div><div class="empty" style="margin-top:16px">Inicia sesión con Google para consultar tus pedidos.</div><button class="primary" type="button" onclick="closeModal();pdAbrirCuentaCliente()">Iniciar sesión</button></div>`);
    return;
  }
  showModal(`<div class="sheet"><div class="sheetTop"><h2>Mis pedidos</h2><button class="close" onclick="closeModal()">×</button></div><div class="empty" style="margin-top:16px">Cargando tus pedidos…</div></div>`);
  const history=await pdCargarHistorialPedidosCliente();
  if(!history.length){
    showModal(`<div class="sheet"><div class="sheetTop"><h2>Mis pedidos</h2><button class="close" onclick="closeModal()">×</button></div><div class="empty" style="margin-top:16px">Todavía no tienes pedidos registrados.</div></div>`);
    return;
  }
  const rows=history.map(o=>{
    const code=String(o.id||'').slice(0,8).toUpperCase();
    const items=(o.items||[]).map(x=>`${esc(x.nombre)} × ${x.cantidad}`).join('<br>');
    const subtotal=Number(o.subtotal);
    const delivery=Number(o.delivery_cost);
    const hasBreakdown=Number.isFinite(subtotal)&&Number.isFinite(delivery);
    const idx=trackingIndex(o.estado);
    const bars=[0,1,2,3,4,5].map(n=>`<span class="${idx>=0&&n<=idx?'on':''}"></span>`).join('');
    const d=o.creado_en?new Date(o.creado_en):null;
    const fecha=d&&!isNaN(d)?d.toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'}):'';
    const nItems=(o.items||[]).reduce((a,x)=>a+Number(x.cantidad||1),0);
    const negocio=getRestaurantNameById(o.negocio_id)||o.negocio_nombre||'Pidemás';
    const pill=idx<0?'is-off':(idx===5?'is-done':'');
    return `<div class="pdHistCard">
      <div class="pdHistTop"><span class="pdKicker">${esc(negocio)}</span><span class="pdPill ${pill}">${trackingLabel(o.estado)}</span></div>
      <div class="pdHistCode">#${code}</div>
      ${fecha?`<div class="pdHistMeta">${fecha}</div>`:''}
      ${idx>=0&&idx<5?`<div class="pdBars pdBarsLight">${bars}</div>`:''}
      <div class="pdHistItems">${items||'Pedido de productos'}</div>
      ${hasBreakdown?`<div class="pdLine"><span>Subtotal</span><span>S/ ${subtotal.toFixed(2)}</span></div><div class="pdLine"><span>Delivery</span><span>S/ ${delivery.toFixed(2)}</span></div>`:''}
      ${o.metodo_pago==='efectivo'&&Number.isFinite(Number(o.monto_pago))?`<div class="pdLine"><span>Pagas con · cambio</span><span>S/ ${Number(o.monto_pago).toFixed(2)} · S/ ${Number(o.vuelto||0).toFixed(2)}</span></div>`:''}
      <div class="pdHistFoot"><span>${nItems?nItems+' producto'+(nItems===1?'':'s')+' · ':''}${esc(String(o.metodo_pago||'').charAt(0).toUpperCase()+String(o.metodo_pago||'').slice(1))}</span><strong>S/ ${Number(o.total||0).toFixed(2)}</strong></div>
      <div class="pdHistActions">${idx>=0&&idx<5?`<button type="button" class="pdBtnDark" onclick="openOrderTracking()">Ver seguimiento</button>`:''}</div>
    </div>`;
  }).join('');
  showModal(`<div class="sheet"><div class="sheetTop"><h2>Mis pedidos</h2><button class="close" onclick="closeModal()">×</button></div>
    
    ${rows}
  </div>`);
}


async function pdCargarHistorialPedidosCliente(){
  const uid=pdClienteSesion?.id;
  if(!uid)return [];
  const cacheKey='pidemas_order_history_user_'+uid;
  try{
    const {data:orders,error}=await sb.from('pedidos')
      .select('id,cliente_auth_id,negocio_id,estado,pago_confirmado,nombre_cliente,telefono_cliente,metodo_pago,subtotal,costo_delivery,total,observaciones,creado_en,entregado_en,en_camino_en,en_entrega_en,aceptado_en')
      .eq('cliente_auth_id',uid)
      .order('creado_en',{ascending:false});
    if(error)throw error;
    const ids=(orders||[]).map(o=>o.id).filter(Boolean);
    const negocioIds=[...new Set((orders||[]).map(o=>o.negocio_id).filter(Boolean).map(String))];
    let negociosPorId={};
    if(negocioIds.length){
      try{
        const {data:negocios,error:negociosError}=await sb.from('negocios')
          .select('id,nombre,nombre_negocio,razon_social')
          .in('id',negocioIds);
        if(negociosError)throw negociosError;
        for(const n of (negocios||[])){
          const nombre=String(n.nombre||n.nombre_negocio||n.razon_social||'').trim();
          if(nombre)negociosPorId[String(n.id)]=nombre;
        }
      }catch(e){
        console.warn('No se pudieron recuperar los nombres de los negocios del historial:',e);
      }
    }
    let details=[];
    if(ids.length){
      const {data:d,error:detailError}=await sb.from('detalle_pedidos')
        .select('pedido_id,nombre_producto,precio_unitario,cantidad,subtotal')
        .in('pedido_id',ids);
      if(detailError)throw detailError;
      details=d||[];
    }
    const grouped=new Map();
    for(const d of details){
      const key=String(d.pedido_id);
      if(!grouped.has(key))grouped.set(key,[]);
      grouped.get(key).push({nombre:d.nombre_producto||'Producto',precio:Number(d.precio_unitario||0),cantidad:Number(d.cantidad||1)});
    }
    const history=(orders||[]).map(o=>{
      const obs=String(o.observaciones||'');
      let delivery=Number(o.costo_delivery||0);
      let subtotal=Number(o.subtotal||0);
      // El historial conserva la estructura que usa la vista actual.
      return {
        id:o.id,cliente_auth_id:o.cliente_auth_id,negocio_id:o.negocio_id,
        negocio_nombre:negociosPorId[String(o.negocio_id)]||'',
        estado:o.estado,pago_confirmado:!!o.pago_confirmado,
        nombre_cliente:o.nombre_cliente,telefono_cliente:o.telefono_cliente,
        metodo_pago:o.metodo_pago,subtotal,delivery_cost:delivery,total:Number(o.total||0),
        creado_en:o.creado_en,entregado_en:o.entregado_en,
        en_camino_en:o.en_camino_en,en_entrega_en:o.en_entrega_en,aceptado_en:o.aceptado_en,
        items:grouped.get(String(o.id))||[]
      };
    });
    localStorage.setItem(cacheKey,JSON.stringify(history));
    // La clave antigua se mantiene solo como caché de compatibilidad de esta sesión.
    localStorage.setItem('pidemas_order_history',JSON.stringify(history));
    return history;
  }catch(error){
    console.error('No se pudo cargar el historial de pedidos desde Supabase:',error);
    try{
      const cached=JSON.parse(localStorage.getItem(cacheKey)||'[]');
      if(Array.isArray(cached))return cached;
    }catch(e){}
    toast('No se pudo consultar tu historial. Revisa tu conexión e inténtalo nuevamente.');
    return [];
  }
}

async function deleteOrderHistoryItem(orderId){
  const history=getOrderHistory();
  const index=history.findIndex(o=>String(o.id||'')===String(orderId));
  if(index<0){toast('El pedido ya no está en el historial.');return}
  const code=String(orderId||'').slice(0,8).toUpperCase();
  if(!(await window.pdConfirmar(`¿Eliminar el pedido #${code} del historial?`)))return;
  history.splice(index,1);
  try{localStorage.setItem('pidemas_order_history',JSON.stringify(history));}catch(e){toast('No se pudo actualizar el historial.');return}
  toast('Pedido eliminado del historial');
  openOrderHistory();
}



function getOrderHistory(){
  try{
    const key=pdClienteSesion?.id?'pidemas_order_history_user_'+pdClienteSesion.id:'pidemas_order_history';
    const h=JSON.parse(localStorage.getItem(key)||'[]');
    return Array.isArray(h)?h:[];
  }catch(e){return []}
}
function saveCustomerInfo(name,tel){
  try{localStorage.setItem('pidemas_customer_info',JSON.stringify({nombre_cliente:name||'',telefono_cliente:tel||''}));}catch(e){}
}
function getCustomerInfo(){
  try{return JSON.parse(localStorage.getItem('pidemas_customer_info')||'null')||{};}catch(e){return {}}
}

async function getTrackingOrders(){
  // El seguimiento se consulta en Supabase por la cuenta autenticada,
  // no por los IDs guardados únicamente en el almacenamiento del teléfono.
  let user=pdClienteSesion;
  try{
    const {data,error}=await sb.auth.getUser();
    if(error)throw error;
    user=data?.user||null;
    if(user)pdActualizarCuentaCliente(user);
  }catch(error){
    console.error('No se pudo verificar la cuenta para el seguimiento:',error);
    toast('No se pudo verificar tu cuenta. Vuelve a iniciar sesión.');
    return [];
  }
  if(!user?.id)return [];
  const {data:orders,error}=await sb.from('pedidos')
    .select('id,cliente_auth_id,estado,pago_confirmado,motorizado_id,negocio_id,entregado_en,en_camino_en,en_entrega_en,aceptado_en,creado_en,total,metodo_pago,en_local_en,negocio_aceptado_en,tiempo_preparacion_min,listo_para_recojo,subtotal,costo_delivery')
    .eq('cliente_auth_id',user.id)
    .order('creado_en',{ascending:false});
  if(error){
    console.error('No se pudieron consultar los pedidos para seguimiento:',error);
    toast('No se pudo cargar el seguimiento. Inténtalo nuevamente.');
    return [];
  }
  const rows=Array.isArray(orders)?orders:[];
  if(!rows.length)return [];
  const ids=rows.map(x=>x.id).filter(Boolean);
  const {data:details,error:detailError}=await sb.from('detalle_pedidos')
    .select('pedido_id,nombre_producto,precio_unitario,cantidad,subtotal')
    .in('pedido_id',ids);
  if(detailError)console.warn('No se pudieron cargar los detalles del seguimiento:',detailError);
  const grouped=new Map();
  for(const d of (details||[])){
    const key=String(d.pedido_id);
    if(!grouped.has(key))grouped.set(key,[]);
    grouped.get(key).push({nombre:d.nombre_producto||'Producto',precio:Number(d.precio_unitario||0),cantidad:Number(d.cantidad||1)});
  }
  const history=rows.map(o=>({
    ...o,
    delivery_cost:Number(o.costo_delivery||0),
    subtotal:Number(o.subtotal||0),
    items:grouped.get(String(o.id))||[]
  }));
  try{
    localStorage.setItem('pidemas_order_history_user_'+user.id,JSON.stringify(history));
    localStorage.setItem('pidemas_order_history',JSON.stringify(history));
    const active=history.find(x=>!['entregado','cancelado','anulado'].includes(String(x.estado||'').toLowerCase()));
    if(active)localStorage.setItem('pidemas_last_order',JSON.stringify(active));
  }catch(e){}
  return history.filter(x=>!['entregado','cancelado','anulado'].includes(String(x.estado||'').toLowerCase()));
}
function trackingSlide(o){
  const code=String(o.id).slice(0,8).toUpperCase();
  const idx=trackingIndex(o.estado);
  const bars=[0,1,2,3,4,5].map(n=>`<span class="${idx>=0&&n<=idx?'on':''}"></span>`).join('');
  const negocio=getRestaurantNameById(o.negocio_id)||o.negocio_nombre||'Negocio';
  const items=(o.items||[]);
  const pago=o.metodo_pago?String(o.metodo_pago).charAt(0).toUpperCase()+String(o.metodo_pago).slice(1):'';
  return `<div class="pdTrackSlide">
    <div class="pdBand">
      <div class="pdBandTop"><span class="pdBandKicker">${esc(negocio)}</span><span class="pdBandPill">${esc(trackingLabel(o.estado))}</span></div>
      <div class="pdBandCode">#${code}</div>
      <div class="pdBars">${bars}</div>
      <div class="pdBandMeta">${idx<0?'Pedido cancelado':'Paso '+(idx+1)+' de 6'}</div>
    </div>
    ${o.pago_confirmado?`<div class="pdPaidNote">Pago confirmado por Pidemás</div>`:''}
    ${renderTracking(o)}
    ${(items.length||o.total)?`<div class="pdPayBox">${items.map(x=>`<div class="pdLine"><span>${Number(x.cantidad||1)} × ${esc(x.nombre)}</span><span>S/ ${(Number(x.precio||0)*Number(x.cantidad||1)).toFixed(2)}</span></div>`).join('')}${pago?`<div class="pdLine"><span>Pago</span><strong>${esc(pago)}</strong></div>`:''}<div class="pdTotal"><span>Total</span><strong>S/ ${Number(o.total||0).toFixed(2)}</strong></div></div>`:''}
  </div>`;
}
function enableTrackingSwipe(orders){
  const viewport=document.getElementById('trackingSwipeViewport');
  const track=document.getElementById('trackingSwipeTrack');
  if(!viewport||!track||orders.length<=1)return;
  const dots=[...document.querySelectorAll('[data-track-dot]')];
  const counter=document.getElementById('trackingCounter');
  let index=0,startX=0,startY=0;
  const go=i=>{
    index=Math.max(0,Math.min(orders.length-1,i));
    track.style.transform=`translateX(-${index*100}%)`;
    dots.forEach((d,n)=>d.classList.toggle('active',n===index));
    if(counter)counter.textContent=`${index+1} / ${orders.length}`;
  };
  dots.forEach(d=>d.onclick=()=>go(Number(d.dataset.trackDot)));
  viewport.addEventListener('touchstart',e=>{const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY},{passive:true});
  viewport.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.2)go(index+(dx<0?1:-1))},{passive:true});
}
async function openOrderTracking(){
  const orders=await getTrackingOrders();
  if(!orders.length){
    showModal(`<div class="sheet"><div class="sheetTop"><h2>Seguimiento de pedido</h2><button class="close" onclick="closeModal()">×</button></div><div class="empty" style="margin-top:16px">Aún no tienes un pedido para seguir.</div></div>`);
    return;
  }
  showModal(`<div class="sheet">
    <div class="sheetTop"><h2>Seguimiento de pedido</h2><button class="close" onclick="closeModal()">×</button></div>
    <div id="trackingSwipeViewport" style="margin-top:14px;overflow:hidden;touch-action:pan-y">
      <div id="trackingSwipeTrack" style="display:flex;transition:transform .28s ease;will-change:transform">
        ${orders.map(o=>`<div style="min-width:100%;box-sizing:border-box;padding:0 1px">${trackingSlide(o)}</div>`).join('')}
      </div>
    </div>
    ${orders.length>1?`<div style="display:flex;justify-content:center;gap:7px;margin-top:12px">${orders.map((_,i)=>`<button data-track-dot="${i}" style="width:9px;height:9px;border-radius:50%;border:0;padding:0;background:${i===0?'var(--fr-ink)':'#6F625A'}"></button>`).join('')}</div><div id="trackingCounter" style="text-align:center;color:var(--fr-muted);font-size:12px;margin-top:5px">1 / ${orders.length}</div>`:''}
  </div>`);
  enableTrackingSwipe(orders);
  startOrderTracking();
}
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}

/*
 * Enlace individual de carta:
 * https://TU-DOMINIO/tienda.html?negocio=UUID_DEL_NEGOCIO
 * Al abrir el enlace, la tienda existente carga y abre la carta del negocio.
 */
async function abrirCartaDesdeEnlace(){
  const params=new URLSearchParams(window.location.search);
  const negocioId=(params.get('negocio')||'').trim();
  if(!negocioId)return;

  // Modo carta directa: no mostrar el catálogo general ni abrir un modal
  // sobre Inicio. El UUID de la URL determina el único negocio visible.
  const productsSection=document.getElementById('productsSection');
  const restaurantsSection=document.getElementById('restaurantsSection');
  const businessCategoriesSection=document.getElementById('businessCategoriesSection');
  const hero=document.querySelector('.hero');
  const head=document.getElementById('productsSectionHead');
  const productsEl=document.getElementById('products');
  if(hero)hero.classList.add('hidden');
  if(restaurantsSection)restaurantsSection.classList.add('hidden');
  if(businessCategoriesSection)businessCategoriesSection.classList.add('hidden');
  if(productsSection)productsSection.classList.remove('hidden');
  if(productsEl)productsEl.innerHTML='<div class="empty" style="padding:24px;text-align:center"><span style="display:flex;gap:6px;justify-content:center;align-items:center;height:44px;margin-bottom:12px" aria-hidden="true"><i style="width:8px;height:44px;border-radius:5px;background:#C4410C;animation:pdEq 1s ease-in-out infinite"></i><i style="width:8px;height:44px;border-radius:5px;background:#E8A06E;animation:pdEq 1s .15s ease-in-out infinite"></i><i style="width:8px;height:44px;border-radius:5px;background:#C4410C;animation:pdEq 1s .3s ease-in-out infinite"></i><i style="width:8px;height:44px;border-radius:5px;background:#E8A06E;animation:pdEq 1s .45s ease-in-out infinite"></i><i style="width:8px;height:44px;border-radius:5px;background:#C4410C;animation:pdEq 1s .6s ease-in-out infinite"></i></span><style>@keyframes pdEq{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}</style>Cargando la carta del negocio…</div>';

  try{
    // Consultar el registro exacto por ID aunque no aparezca en la lista general.
    const {data:negocio,error:negocioError}=await sb.from('negocios').select('*').eq('id',negocioId).maybeSingle();
    if(negocioError)throw negocioError;
    if(!negocio || negocio.activo===false || negocio.visible_admin===false || String(negocio.activo).toLowerCase()==='false'){
      if(head)head.innerHTML='<h2>Carta no disponible</h2>';try{window.piQuitarCarga&&window.piQuitarCarga()}catch(_){}
      if(productsEl)productsEl.innerHTML='<div class="empty" style="padding:24px;text-align:center">Este negocio no está disponible o el enlace no es válido.</div>';
      return;
    }

    // Mantener el negocio enlazado como el único contexto de carta en esta visita.
    restaurants=[negocio];
    selectedBusinessCategory='';
    const [catRes,prodRes]=await Promise.all([
      sb.from('categorias_negocio').select('*').eq('negocio_id',negocioId).order('orden',{ascending:true}),
      sb.from('productos_negocio').select('*').eq('negocio_id',negocioId).eq('disponible',true).order('orden',{ascending:true})
    ]);
    if(prodRes.error)throw prodRes.error;

    selectedRestaurantCategories=(catRes.data||[]).filter(c=>c.activo!==false && String(c.negocio_id)===String(negocioId));
    const cartaProductos=(prodRes.data||[])
      .filter(p=>String(p.negocio_id)===String(negocioId) && p.disponible!==false)
      .map(p=>({...p,origen:'negocio'}));
    products=cartaProductos;

    if(head)head.innerHTML=`<div class="menuRestaurantHeader"><h2 id="productsTitle">${esc(pick(negocio,['nombre','nombre_negocio','razon_social'],'Carta del negocio'))}</h2></div>`;
    if(productsEl)productsEl.classList.add('menu-completo');
    renderProducts(cartaProductos);

    // Impedir que los botones de volver de la carta directa muestren locales ajenos.
    document.title=`${pick(negocio,['nombre','nombre_negocio','razon_social'],'Carta')} | Pidemás`;
    window.scrollTo({top:0,behavior:'instant'});

    // Abrir la misma ventana de carta (logo, estado, Lo más pedido) que se abre desde Inicio.
    // Se espera a que terminen de cargar todos los scripts de la página y se reintenta si algo la cierra.
    try{
      if(document.readyState==='loading')await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));
      const abierta=()=>{const m=document.getElementById('cartaModalNegocio');return !!(m&&m.classList.contains('carta-modal-overlay')&&m.innerHTML.trim())};
      const aplicar=()=>{
        if(!document.documentElement.classList.contains('pdCartaEnlace')){
          document.documentElement.classList.add('pdCartaEnlace');
          const st=document.createElement('style');
          st.textContent='html.pdCartaEnlace:root body #cartaModalNegocio .carta-modal-close{display:none!important}'
            +'html.pdCartaEnlace:root,html.pdCartaEnlace:root body{overflow:hidden!important;height:100dvh!important;max-height:100dvh!important;overscroll-behavior:none!important}'
            +'html.pdCartaEnlace:root body #cartaModalNegocio.carta-modal-overlay{overflow:hidden!important;touch-action:none}'
            +'html.pdCartaEnlace:root body #cartaModalNegocio .carta-modal-body{touch-action:pan-y;overscroll-behavior:contain!important}'
            +'html.pdCartaEnlace:root body #cartaModalNegocio.carta-modal-overlay{background:var(--fr-surface,#fff)!important;align-items:flex-start!important}'
            +'html.pdCartaEnlace:root body .bottom{z-index:9050!important}'
            +'html.pdCartaEnlace:root body #cartaModalNegocio .carta-modal-sheet{height:calc(100dvh - 84px - env(safe-area-inset-bottom,0px))!important;max-height:calc(100dvh - 84px - env(safe-area-inset-bottom,0px))!important;border-radius:0!important;box-shadow:none!important}'
            +'html.pdCartaEnlace body>.app{visibility:hidden}';
          document.head.appendChild(st);
        }
        if(productsSection)productsSection.classList.add('hidden');
        if(!window.__pdInicioCarta){
          window.__pdInicioCarta=true;
          document.addEventListener('click',e=>{
            const b=e.target.closest&&e.target.closest('.bottom .navbtn');
            if(b&&/scrollToTop/.test(b.getAttribute('onclick')||'')){
              const bd=document.querySelector('#cartaModalNegocio .carta-modal-body');
              if(bd)bd.scrollTo({top:0,behavior:'smooth'});
            }
          },true);
        }
        if(!window.__pdBuscador){
          window.__pdBuscador=true;
          const st2=document.createElement('style');
          st2.textContent='html.pdCartaEnlace:root body #cartaModalNegocio .pdBuscaCarta{display:flex;align-items:center;gap:10px;flex:0 0 auto;box-sizing:border-box;width:100%;height:48px;margin:0;padding:0 14px;border:1px solid var(--fr-line,#EFE3DA);border-radius:16px;background:#fff;cursor:text}'
            +'html.pdCartaEnlace:root body #cartaModalNegocio .pdBuscaCarta svg{flex:0 0 auto;width:20px;height:20px;color:var(--fr-muted,#6F625A)}'
            +'html.pdCartaEnlace:root body #cartaModalNegocio .pdBuscaCarta input{flex:1 1 0;min-width:0;height:100%;border:0;outline:0;background:transparent;box-shadow:none;padding:0;font:500 16px Inter,system-ui,-apple-system,Roboto,Arial,sans-serif;color:var(--fr-ink,#1F1A17);-webkit-appearance:none;appearance:none}'
            +'html.pdCartaEnlace:root body #cartaModalNegocio .pdBuscaCarta input::placeholder{color:var(--fr-muted,#6F625A);opacity:1}'
            +'html.pdCartaEnlace:root body #cartaModalNegocio .pdBuscaVacio{padding:18px 8px;text-align:center;font:600 14px Inter,system-ui,-apple-system,Roboto,Arial,sans-serif;color:var(--fr-muted,#6F625A)}';
          document.head.appendChild(st2);
          const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
          const ocultar=(el,on)=>{if(on)el.style.setProperty('display','none','important');else el.style.removeProperty('display')};
          const filtrar=()=>{
            const inp=document.getElementById('pdBuscaCartaInput'),cont=document.getElementById('cartaModalProducts');
            if(!inp||!cont)return;
            const words=norm(inp.value).split(/\s+/).filter(Boolean);
            let visibles=0;
            cont.querySelectorAll('.productDetailCard').forEach(c=>{
              const h=c.querySelector('h3'),d=c.querySelector('.pcaDesc');
              const t=norm((h?h.textContent:c.textContent)+' '+(d?d.textContent:''));
              const ok=!words.length||words.every(w=>t.includes(w));
              ocultar(c,!ok);if(ok)visibles++;
            });
            cont.querySelectorAll('.categoryBlock').forEach(b=>{
              const hay=[...b.querySelectorAll('.productDetailCard')].some(c=>c.style.display!=='none');
              ocultar(b,words.length>0&&!hay);
            });
            const chips=document.querySelector('#cartaModalNegocio .pcaChips');
            if(chips)ocultar(chips,words.length>0);
            let v=document.getElementById('pdBuscaVacio');
            if(words.length&&!visibles){
              if(!v){v=document.createElement('div');v.id='pdBuscaVacio';v.className='pdBuscaVacio';cont.insertAdjacentElement('beforebegin',v)}
              v.textContent='No encontramos productos para «'+inp.value.trim()+'».';
            }else if(v)v.remove();
          };
          const montar=()=>{
            const body=document.querySelector('#cartaModalNegocio .carta-modal-body');
            if(!body||document.getElementById('pdBuscaCarta'))return;
            const ref=body.querySelector('.pcaChips')||document.getElementById('cartaModalProducts');
            if(!ref)return;
            const box=document.createElement('label');
            box.id='pdBuscaCarta';box.className='pdBuscaCarta';
            box.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg><input id="pdBuscaCartaInput" type="search" placeholder="Buscar productos..." aria-label="Buscar productos" autocomplete="off" enterkeyhint="search">';
            ref.insertAdjacentElement('beforebegin',box);
            box.querySelector('input').addEventListener('input',filtrar);
          };
          montar();
          // La carta se vuelve a dibujar cuando cambia el carrito: se vuelve a montar y a filtrar.
          setInterval(()=>{montar();const i=document.getElementById('pdBuscaCartaInput');if(i&&i.value)filtrar()},600);
          // Botón «Buscar» del menú de abajo: sube al buscador de la carta.
          document.addEventListener('click',e=>{
            const b=e.target.closest&&e.target.closest('.bottom .navbtn');
            if(!b||b.textContent.trim()!=='Buscar')return;
            e.stopPropagation();e.preventDefault();
            const bd=document.querySelector('#cartaModalNegocio .carta-modal-body'),i=document.getElementById('pdBuscaCartaInput');
            if(bd)bd.scrollTo({top:0,behavior:'smooth'});
            if(i)setTimeout(()=>i.focus(),250);
          },true);
        }
      };
      for(let i=0;i<12&&!abierta();i++){
        await new Promise(r=>setTimeout(r,i?700:200));
        try{await window.showRestaurant(negocioId)}catch(err){console.warn('Reintentando abrir la carta:',err)}
      }
      if(abierta()){
        aplicar();try{window.piQuitarCarga&&window.piQuitarCarga()}catch(_){}
        // Durante los primeros segundos, si otra parte de la tienda la cierra, se vuelve a abrir.
        let n=0;const guardia=setInterval(()=>{
          if(++n>16){clearInterval(guardia);return}
          if(!abierta()){try{window.showRestaurant(negocioId)}catch(_){}}
        },500);
      }
    }catch(err){console.warn('No se pudo abrir la ventana de carta; se muestra la carta directa:',err)}
    try{window.piQuitarCarga&&window.piQuitarCarga()}catch(_){}
  }catch(e){
    console.error('No se pudo cargar la carta del negocio enlazado:',e);
    if(head)head.innerHTML='<h2>No se pudo cargar la carta</h2>';try{window.piQuitarCarga&&window.piQuitarCarga()}catch(_){}
    if(productsEl)productsEl.innerHTML='<div class="empty" style="padding:24px;text-align:center">No se pudo cargar esta carta. Comprueba tu conexión e inténtalo nuevamente.</div>';
  }
}

loadCart();
// Enlace individual: no cargar ni renderizar el catálogo general.
const pidemasNegocioEnlace = (new URLSearchParams(window.location.search).get('negocio') || '').trim();
if (pidemasNegocioEnlace) {
  abrirCartaDesdeEnlace();
} else {
  loadData().catch(err => console.error('No se pudo cargar la tienda:', err));
  startCatalogRealtime();
}

// Navegación con el botón Atrás de Android: primero retrocede dentro de la tienda.
(function(){
  let backHandling=false;
  function isModalOpen(){
    const m=document.getElementById('modal');
    return !!(m && !m.classList.contains('hidden') && m.innerHTML.trim());
  }
  function addStoreHistoryState(){
    try{history.pushState({pidemasStore:true,stamp:Date.now()},'',location.href);}catch(e){}
  }
  // El estado inicial permite interceptar el primer Atrás sin abandonar la tienda.
  addStoreHistoryState();
  window.addEventListener('popstate',function(){
    if(backHandling)return;
    backHandling=true;
    try{
      if(isModalOpen()){
        if(!window.__pdAtras&&typeof closeModal==='function')closeModal();
      }else if(document.getElementById('products')?.classList.contains('menu-completo')){
        if(typeof volverMenuPrincipal==='function')volverMenuPrincipal();
      }else{
        // En la pantalla principal se mantiene al usuario dentro de la tienda.
        // No se fuerza la salida del sitio al primer toque de Atrás.
      }
    }catch(e){console.warn('No se pudo procesar Atrás dentro de la tienda:',e)}
    addStoreHistoryState();
    backHandling=false;
  });
})();
