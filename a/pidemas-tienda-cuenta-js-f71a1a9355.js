(function(){
  const $=id=>document.getElementById(id);
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SVG=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
  const IC={
    pin:SVG('<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.66 16.66l-4.24 4.24a2 2 0 0 1 -2.83 0l-4.25 -4.24a8 8 0 1 1 11.32 0z"/>'),
    user:SVG('<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"/><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>'),
    receipt:SVG('<path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/>'),
    route:SVG('<path d="M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z"/><path d="M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5"/>'),
    out:SVG('<path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/><path d="M9 12h12l-3 -3"/><path d="M18 15l3 -3"/>'),
    bolt:SVG('<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"/>')
  };
  const G='<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const LS={get(){try{return JSON.parse(localStorage.getItem('pidemas_customer_info')||'null')||{}}catch(e){return {}}},set(o){try{localStorage.setItem('pidemas_customer_info',JSON.stringify({...LS.get(),...o}))}catch(e){}}};
  const usuario=()=>{try{return pdClienteSesion||null}catch(e){return null}};
  /* Datos guardados: primero la cuenta de Google (sirve en cualquier teléfono), luego este teléfono */
  function datos(){
    const u=usuario(),m=(u&&u.user_metadata)||{},l=LS.get();
    const num=v=>{const n=Number(v);return v!==''&&v!=null&&Number.isFinite(n)?n:null};
    return {
      nombre:m.full_name||m.name||l.nombre_cliente||'',
      telefono:m.phone||l.telefono_cliente||'',
      correo:m.contact_email||'',
      direccion:m.address||l.direccion||'',
      referencia:m.address_reference||l.referencia||'',
      lat:num(m.delivery_lat??l.lat),lng:num(m.delivery_lng??l.lng)
    };
  }
  window.pdDatosClienteGuardados=datos;
  let borrador=null,vista='';

  function overlay(){
    const o=$('pdGoogleAuthOverlay');if(!o)return null;
    if(!o.querySelector('.pcSheet')){
      o.innerHTML='<section class="pcSheet" role="dialog" aria-modal="true" aria-labelledby="pcTitulo"><div class="pcTop"><strong id="pcTitulo">Mi cuenta</strong><button type="button" class="pcX" aria-label="Cerrar">×</button></div><div class="pcBody"></div><div class="pcFoot"></div></section>';
      o.addEventListener('click',e=>{if(e.target.closest('.pcX'))window.pdCerrarCuentaCliente()});
    }
    return o;
  }
  function msg(t,ok){const m=document.querySelector('#pdGoogleAuthOverlay .pcMsg');if(m){m.textContent=t||'';m.classList.toggle('ok',!!ok)}}
  function pintarLogin(){
    vista='login';const o=overlay();if(!o)return;
    o.querySelector('#pcTitulo').textContent='Mi cuenta';
    o.querySelector('.pcBody').innerHTML='<div class="pcHero"><div class="pcBrand"><img alt="Pidemás Delivery" src="'+((document.querySelector('.pidemas-header-logo')||{}).src||'')+'"></div><h2>Pide más rápido</h2><p>Entra con tu cuenta de Google y tus datos quedarán listos en cada pedido.</p></div>'+
      '<ul class="pcBen"><li><i>'+IC.pin+'</i><span><b>Tu ubicación guardada</b><small>El motorizado llega directo a tu puerta.</small></span></li>'+
      '<li><i>'+IC.bolt+'</i><span><b>Pedidos en segundos</b><small>Nombre, celular y dirección se llenan solos.</small></span></li>'+
      '<li><i>'+IC.route+'</i><span><b>Sigue tus pedidos</b><small>Mira en qué paso va tu pedido desde cualquier teléfono.</small></span></li></ul>';
    o.querySelector('.pcFoot').innerHTML='<button type="button" class="pcGoogle" id="pcGoogleBtn">'+G+'Continuar con Google</button><p class="pcMsg" role="status" aria-live="polite"></p>';
    o.querySelector('#pcGoogleBtn').onclick=()=>window.pdIngresarConGoogle();
  }
  const MAPA='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg>';
  function locHTML(d){
    const on=d.lat!=null&&d.lng!=null;
    return '<div class="pcLoc'+(on?' on':'')+'"><i>'+IC.pin+'</i><span><b>'+(on?'Ubicación guardada':'Sin ubicación guardada')+'</b><small>'+(on?'<a href="https://www.google.com/maps?q='+d.lat+','+d.lng+'" target="_blank" rel="noopener">Ver en el mapa</a>':'Guárdala estando en tu casa u oficina.')+'</small></span></div>'+
      '<div class="pcLocBtns"><button type="button" class="pcBtn'+(on?' light':'')+'" data-acc="ubicar">'+IC.pin+(on?'Actualizar ubicación':'Usar mi ubicación actual')+'</button>'+'<button type="button" class="pcBtn light" data-acc="mapa">'+MAPA+'Marcar en el mapa</button>'+(on?'<button type="button" class="pcBtn light" data-acc="quitar">Quitar</button>':'')+'</div>';
  }
  function pintarPerfil(){
    vista='perfil';const o=overlay();if(!o)return;const u=usuario();if(!u)return pintarLogin();
    const m=u.user_metadata||{};const d=borrador||datos();borrador=d;
    const foto=m.avatar_url||m.picture||'';const ini=String(d.nombre||u.email||'C').trim().charAt(0).toUpperCase();
    o.querySelector('#pcTitulo').textContent='Mi perfil';
    o.querySelector('.pcBody').innerHTML='<div class="pcUser"><div class="pcAv">'+E(ini)+'</div><div><b>'+E(d.nombre||'Cliente Pidemás')+'</b><small>'+E(u.email||'')+'</small></div></div>'+
      '<div class="pcSec"><div class="pcSecT">'+IC.user+'Datos para tus pedidos</div><p class="pcSecS">Así te contactará el negocio y el motorizado.</p>'+
        '<label class="pcF"><span>Nombre completo</span><input id="pcNombre" autocomplete="name" value="'+E(d.nombre)+'"></label>'+
        '<label class="pcF"><span>Número de celular</span><input id="pcTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ej. 987 654 321" value="'+E(d.telefono)+'"></label>'+
        '<label class="pcF"><span>Correo de contacto (opcional)</span><input id="pcCorreo" type="email" autocomplete="email" placeholder="'+E(u.email||'')+'" value="'+E(d.correo)+'"></label></div>'+
      '<div class="pcSec"><div class="pcSecT">'+IC.pin+'Dirección de entrega</div><p class="pcSecS">Se usará al confirmar tus pedidos. Puedes cambiarla en cada pedido.</p>'+
        '<label class="pcF"><span>Dirección</span><input id="pcDir" autocomplete="street-address" placeholder="Ej. Av. Grau 1234, Piura" value="'+E(d.direccion)+'"></label>'+
        '<label class="pcF"><span>Referencia</span><textarea id="pcRef" placeholder="Ej. Frente al parque, casa de portón negro">'+E(d.referencia)+'</textarea></label>'+
        '<div class="pcF" id="pcLocBox">'+locHTML(d)+'</div></div>';
    o.querySelector('.pcFoot').innerHTML='<p class="pcMsg" role="status" aria-live="polite"></p><button type="button" class="pcBtn big" data-acc="guardar">Guardar mis datos</button><button type="button" class="pcBtn big light" data-acc="salir">'+IC.out+'Cerrar sesión</button>';
    const sync=()=>{borrador={...borrador,nombre:$('pcNombre').value,telefono:$('pcTel').value,correo:$('pcCorreo').value,direccion:$('pcDir').value,referencia:$('pcRef').value}};
    o.querySelector('.pcBody').oninput=sync;
    o.querySelector('.pcSheet').onclick=async e=>{
      const b=e.target.closest('[data-acc]');if(!b)return;const a=b.dataset.acc;
      if(a==='ubicar'){sync();ubicar(b);return}
      if(a==='mapa'){sync();if(!window.pdMapaElegir)return;const c=(borrador.lat!=null&&borrador.lng!=null)?{lat:Number(borrador.lat),lng:Number(borrador.lng)}:null;const r=await window.pdMapaElegir({titulo:'Tu ubicación de entrega',icono:'ti-home',centro:c,tip:'Mueve el mapa hasta tu casa u oficina'});if(!r)return;borrador.lat=r.lat;borrador.lng=r.lng;if(!String(borrador.direccion||'').trim()&&r.linea){borrador.direccion=[r.linea,r.sub].filter(Boolean).join(', ');const di=$('pcDir');if(di)di.value=borrador.direccion}$('pcLocBox').innerHTML=locHTML(borrador);estadoLoc('Guardando ubicación…');try{await guardarUbicacion(r.lat,r.lng);estadoLoc('Ubicación guardada en tu cuenta. Se usará en tus pedidos.')}catch(err){estadoLoc('No se pudo guardar la ubicación: '+(err.message||'inténtalo de nuevo.'),true)}return}
      if(a==='quitar'){sync();borrador.lat=null;borrador.lng=null;$('pcLocBox').innerHTML=locHTML(borrador);try{await guardarUbicacion(null,null);estadoLoc('Ubicación quitada.')}catch(err){estadoLoc('No se pudo quitar: '+(err.message||''),true)}return}
      if(a==='guardar'){sync();guardar(b);return}
      if(a==='pedidos'){window.pdCerrarCuentaCliente();try{openOrderHistory()}catch(_){}return}
      if(a==='seguimiento'){window.pdCerrarCuentaCliente();try{openOrderTracking()}catch(_){}return}
      if(a==='salir'){if(!(await window.pdConfirmar('¿Cerrar sesión en este teléfono?')))return;try{const {error}=await sb.auth.signOut();if(error)throw error;borrador=null;window.pdActualizarCuentaCliente(null);msg('Sesión cerrada.',true)}catch(err){msg('No se pudo cerrar la sesión: '+(err.message||''))}}
    };
  }
  /* Pide la ubicación: primero con GPS preciso y, si tarda, con la ubicación aproximada del teléfono */
  function pedirUbicacion(){
    return new Promise((ok,mal)=>{
      if(!navigator.geolocation)return mal({code:0});
      navigator.geolocation.getCurrentPosition(ok,e=>{
        if(e&&e.code===1)return mal(e);
        navigator.geolocation.getCurrentPosition(ok,mal,{enableHighAccuracy:false,timeout:15000,maximumAge:120000});
      },{enableHighAccuracy:true,timeout:12000,maximumAge:0});
    });
  }
  function estadoLoc(txt,err){
    const box=$('pcLocBox');if(!box)return;
    let s=box.querySelector('.pcLocMsg');if(!s){s=document.createElement('p');s.className='pcLocMsg';box.appendChild(s)}
    s.textContent=txt||'';s.style.cssText='margin:8px 2px 0;font:600 13px Inter,system-ui,-apple-system,Roboto,Arial,sans-serif;color:'+(err?'var(--fr-red)':'#1F1A17');
  }
  async function guardarUbicacion(lat,lng){
    const u=usuario();
    LS.set({lat,lng});
    if(!u)return true;
    const {data:r,error}=await sb.auth.updateUser({data:{delivery_lat:lat,delivery_lng:lng}});
    if(error)throw error;
    try{pdClienteSesion=r.user||u}catch(_){}
    return true;
  }
  async function ubicar(btn){
    if(!navigator.geolocation){estadoLoc('Este teléfono no permite obtener la ubicación.',true);return}
    btn.disabled=true;estadoLoc('Buscando tu ubicación… puede tardar unos segundos.');msg('');
    try{
      const p=await pedirUbicacion();
      const lat=Number(p.coords.latitude.toFixed(7)),lng=Number(p.coords.longitude.toFixed(7));
      borrador.lat=lat;borrador.lng=lng;
      $('pcLocBox').innerHTML=locHTML(borrador);estadoLoc('Guardando ubicación…');
      /* Se guarda al momento: no hace falta tocar «Guardar mis datos» */
      await guardarUbicacion(lat,lng);
      estadoLoc('Ubicación guardada en tu cuenta. Se usará en tus pedidos.');
    }catch(e){
      btn.disabled=false;
      if(e&&e.code===1)estadoLoc('Chrome bloqueó tu ubicación. Toca el candado junto a la dirección de la página › Permisos › Ubicación › Permitir, y vuelve a intentarlo.',true);
      else if(e&&(e.code===2||e.code===3))estadoLoc('No se pudo obtener tu ubicación. Activa la ubicación (GPS) del teléfono y vuelve a intentarlo.',true);
      else estadoLoc('No se pudo guardar la ubicación: '+((e&&e.message)||'inténtalo de nuevo.'),true);
    }
  }
  async function guardar(btn){
    const d=borrador;
    if(!String(d.nombre||'').trim()){msg('Escribe tu nombre completo.');$('pcNombre').focus();return}
    const tel=String(d.telefono||'').replace(/\D/g,'');
    if(tel&&tel.length<9){msg('Revisa tu número de celular (9 dígitos).');$('pcTel').focus();return}
    btn.disabled=true;const btTx=btn.textContent;btn.textContent='Guardando…';msg('');
    const data={full_name:d.nombre.trim(),phone:String(d.telefono||'').trim(),contact_email:String(d.correo||'').trim(),address:String(d.direccion||'').trim(),address_reference:String(d.referencia||'').trim(),delivery_lat:d.lat,delivery_lng:d.lng};
    LS.set({nombre_cliente:data.full_name,telefono_cliente:data.phone,direccion:data.address,referencia:data.address_reference,lat:data.delivery_lat,lng:data.delivery_lng});
    try{const {data:r,error}=await sb.auth.updateUser({data});if(error)throw error;borrador=null;window.pdActualizarCuentaCliente(r.user||usuario());msg('');const ov=document.getElementById('pdGoogleAuthOverlay');const x=ov&&[...ov.querySelectorAll('button')].find(z=>/^(×|✕)$/.test((z.textContent||'').trim())||/cerrar/i.test(z.getAttribute('aria-label')||''));if(x)x.click();toast('✓ Tus datos quedaron guardados')}
    catch(e){msg('Se guardó en este teléfono, pero no en tu cuenta: '+(e.message||'inténtalo de nuevo.'))}
    finally{btn.disabled=false;if(btn.isConnected)btn.textContent=btTx}
  }
  /* ===== Volver a la misma carta después de entrar con Google ===== */
  const VK='pd_volver_carta';
  const negEnlace=()=>(new URLSearchParams(location.search).get('negocio')||'').trim();
  let cartaAbierta='';
  if(typeof window.showRestaurant==='function'){const o=window.showRestaurant;window.showRestaurant=function(id){cartaAbierta=String(id||'');return o.apply(this,arguments)}}
  if(typeof window.volverMenuPrincipal==='function'){const o=window.volverMenuPrincipal;window.volverMenuPrincipal=function(){if(!negEnlace())cartaAbierta='';return o.apply(this,arguments)}}
  /* Carta que el cliente tiene abierta ahora (por enlace, en la ventana de carta o en la vista de carta) */
  function cartaActual(){
    if(negEnlace())return negEnlace();
    const modal=document.getElementById('cartaModalNegocio');
    const abierta=(modal&&modal.innerHTML.trim()&&!modal.classList.contains('hidden'))||document.getElementById('products')?.classList.contains('menu-completo');
    if(!abierta)return '';
    if(cartaAbierta)return cartaAbierta;
    try{const n=(modal?.querySelector('h2')?.textContent||document.getElementById('productsTitle')?.textContent||'').trim().toLowerCase();const r=(restaurants||[]).find(x=>String(x.nombre||x.nombre_negocio||'').trim().toLowerCase()===n);return r?String(r.id):''}catch(_){return ''}
  }
  window.pdIngresarConGoogle=async function(){
    const b=$('pcGoogleBtn');if(b)b.disabled=true;msg('Conectando con Google…');
    try{
      const enlace=negEnlace(),id=enlace||cartaActual();
      try{if(id)localStorage.setItem(VK,JSON.stringify({id,enlace:!!enlace,t:Date.now()}));else localStorage.removeItem(VK)}catch(_){}
      /* Vuelve a la misma carta. El parámetro también evita que el navegador muestre una copia vieja de la tienda guardada en caché */
      const redirectTo=location.origin+location.pathname+(enlace?'?negocio='+encodeURIComponent(enlace)+'&v='+Date.now():'?v='+Date.now());
      const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{access_type:'offline',prompt:'select_account'}}});
      if(error)throw error;
    }catch(e){if(b)b.disabled=false;msg('No se pudo iniciar sesión: '+(e.message||'inténtalo de nuevo.'))}
  };
  /* Google rápido («One Tap»): hojita de Google dentro de pidemas.pe. Si no se puede mostrar, usa el ingreso de siempre. */
  const GID='123729912252-hpcomke4go7khbi0qom4c7cllu8i3kjc.apps.googleusercontent.com';/* ID de cliente web de Google (público). Vacío = ingreso de siempre */
  const googleRedir=window.pdIngresarConGoogle;
  let gisP=null;function gis(){if(window.google&&google.accounts&&google.accounts.id)return Promise.resolve();if(gisP)return gisP;gisP=new Promise((ok,ko)=>{const x=document.createElement('script');x.src='https://accounts.google.com/gsi/client';x.async=true;x.onload=ok;x.onerror=()=>{gisP=null;ko(new Error('gis'))};document.head.appendChild(x)});return gisP}
  async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  window.pdIngresarConGoogle=async function(){
    if(!GID||!window.crypto||!crypto.subtle)return googleRedir();
    try{await gis()}catch(_){return googleRedir()}
    const raw=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join(''),hashed=await sha(raw);
    let hecho=false;
    google.accounts.id.initialize({client_id:GID,nonce:hashed,auto_select:false,cancel_on_tap_outside:true,itp_support:true,context:'signin',
      callback:async r=>{hecho=true;try{msg('Entrando…')}catch(_){}
        try{const {error}=await sb.auth.signInWithIdToken({provider:'google',token:r.credential,nonce:raw});if(error)throw error;location.reload()}
        catch(e){try{window.pdAviso&&window.pdAviso('No se pudo entrar con Google. Probamos de otra forma.')}catch(_){}googleRedir()}}});
    google.accounts.id.prompt(n=>{try{if(hecho)return;
      if(n.isNotDisplayed&&n.isNotDisplayed())return googleRedir();
      if(n.isSkippedMoment&&n.isSkippedMoment()){const w=n.getSkippedReason&&n.getSkippedReason();if(w!=='user_cancel'&&w!=='tap_outside')googleRedir()}}catch(_){}});
  };
  /* Botón oficial de Google en la tienda (dice «pidemas.pe» y no se bloquea como la hojita).
     Reemplaza a nuestros botones «Continuar con Google»; si Google no carga, quedan los nuestros. */
  let gBtnP=null;
  function gBtnInit(){if(gBtnP)return gBtnP;gBtnP=(async()=>{await gis();const raw=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join(''),hashed=await sha(raw);
    google.accounts.id.initialize({client_id:GID,nonce:hashed,auto_select:false,itp_support:true,context:'signin',ux_mode:'popup',
      callback:async r=>{try{const {error}=await sb.auth.signInWithIdToken({provider:'google',token:r.credential,nonce:raw});if(error)throw error;location.reload()}
        catch(e){try{window.pdAviso&&window.pdAviso('No se pudo entrar con Google. Probamos de otra forma.')}catch(_){}googleRedir()}}});return true})().catch(()=>{gBtnP=null;return false});return gBtnP}
  if(GID&&window.crypto&&crypto.subtle)setInterval(()=>{try{
    const raices=[document].concat([...document.querySelectorAll('pd-app-tienda')].map(h=>h.shadowRoot).filter(Boolean));
    raices.forEach(R=>R.querySelectorAll('[data-a="google"],[data-h="g"]').forEach(b=>{if(b.dataset.gis||!b.offsetWidth)return;b.dataset.gis='1';
      gBtnInit().then(ok=>{if(!ok||!b.isConnected)return;const d=document.createElement('div');d.style.cssText='display:flex;justify-content:center;min-height:44px;width:100%';b.parentNode.insertBefore(d,b);
        const w=Math.round(Math.min(400,Math.max(220,b.offsetWidth||320)));
        try{google.accounts.id.renderButton(d,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'pill',logo_alignment:'center',width:w,locale:'es'})}catch(_){d.remove();return}
        setTimeout(()=>{if(d.querySelector('iframe')){b.style.setProperty('display','none','important')}else d.remove()},1500)})}))
  }catch(_){}},500);
  /* Facebook: mismo recorrido que Google (vuelve a la misma carta). Requiere el proveedor Facebook activo en Supabase. */
  window.pdIngresarConFacebook=async function(){
    try{
      const enlace=negEnlace(),id=enlace||cartaActual();
      try{if(id)localStorage.setItem(VK,JSON.stringify({id,enlace:!!enlace,t:Date.now()}));else localStorage.removeItem(VK)}catch(_){}
      const redirectTo=location.origin+location.pathname+(enlace?'?negocio='+encodeURIComponent(enlace)+'&v='+Date.now():'?v='+Date.now());
      const {error}=await sb.auth.signInWithOAuth({provider:'facebook',options:{redirectTo,scopes:'email,public_profile'}});
      if(error)throw error;
    }catch(e){throw e}
  };
  (async function volverACarta(){
    let p=null;try{p=JSON.parse(localStorage.getItem(VK)||'null')}catch(_){}
    if(!p||!p.id)return;
    if(Date.now()-Number(p.t||0)>20*60*1000){try{localStorage.removeItem(VK)}catch(_){}return}
    /* Espera a que la sesión de Google quede lista antes de moverse */
    let ok=false;for(let i=0;i<80&&!ok;i++){try{const {data}=await sb.auth.getSession();ok=!!data?.session?.user}catch(_){}if(!ok)await new Promise(r=>setTimeout(r,250))}
    try{localStorage.removeItem(VK)}catch(_){}
    if(!ok)return;
    if(p.enlace){if(negEnlace()!==p.id)location.replace(location.pathname+'?negocio='+encodeURIComponent(p.id)+location.hash);return}
    if(negEnlace())return;
    const abrir=()=>{try{window.pdCerrarCuentaCliente&&window.pdCerrarCuentaCliente()}catch(_){}window.showRestaurant(p.id)};
    for(let i=0;i<80;i++){try{if(Array.isArray(restaurants)&&restaurants.some(r=>String(r.id)===String(p.id))){abrir();
      /* Si algo de la tienda la cerró al terminar de cargar, se vuelve a abrir una vez */
      setTimeout(()=>{if(!cartaActual())abrir()},2500);return}}catch(_){}await new Promise(r=>setTimeout(r,250))}
  })();
  /* Buscador: dentro de la carta de un negocio busca productos de esa carta */
  (function(){
    const s=document.getElementById('search');if(!s)return;
    const base=s.getAttribute('placeholder')||'Buscar negocios y productos...';
    const pintar=()=>{const enCarta=!!negEnlace()||!!cartaActual();const ph=enCarta?'Buscar productos en la carta':base;if(s.placeholder!==ph){s.placeholder=ph;s.setAttribute('aria-label',ph)}};
    pintar();setInterval(pintar,700);
    /* Búsqueda dentro de la carta abierta: solo productos de ese negocio */
    const norm=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    s.addEventListener('input',e=>{
      const id=negEnlace()||cartaActual();if(!id)return;
      e.stopImmediatePropagation();
      const q=norm(s.value.trim());
      let todos=[];try{todos=(products||[]).filter(p=>p.origen==='negocio'&&String(p.negocio_id)===String(id))}catch(_){}
      const lista=q?todos.filter(p=>norm([p.nombre,p.nombre_producto,p.descripcion,p.categoria,p.categoria_nombre].join(' ')).includes(q)):todos;
      const el=document.getElementById('products');
      try{renderProducts(lista)}catch(_){}
      if(q&&!lista.length&&el)el.innerHTML='<div class="empty" style="padding:24px 8px;text-align:center;grid-column:1/-1">No encontramos «'+E(s.value.trim())+'» en esta carta.</div>';
      try{const r=(restaurants||[]).find(x=>String(x.id)===String(id));if(r&&document.getElementById('cartaModalProducts')&&typeof actualizarContenidoModalCarta==='function')actualizarContenidoModalCarta(r)}catch(_){}
    },true);
  })();
  /* Reemplaza las funciones de la cuenta de la tienda */
  window.pdAbrirCuentaCliente=function(){const o=overlay();if(!o)return;o.hidden=false;document.body.classList.add('pc-abierto');borrador=null;usuario()?pintarPerfil():pintarLogin()};
  window.pdCerrarCuentaCliente=function(){const o=$('pdGoogleAuthOverlay');if(o)o.hidden=true;document.body.classList.remove('pc-abierto')};
  window.pdMostrarPerfilCliente=function(){window.pdAbrirCuentaCliente()};
  const actualizarOriginal=window.pdActualizarCuentaCliente;
  window.pdActualizarCuentaCliente=function(user){
    try{pdClienteSesion=user||null}catch(e){}
    const btn=$('pdCustomerAccountBtn');
    if(btn){
      const m=(user&&user.user_metadata)||{},foto=m.avatar_url||m.picture||'';
      btn.classList.toggle('pdLogged',!!user);btn.title=user?(user.email||'Mi cuenta'):'Mi cuenta';
      btn.innerHTML=IC.user+(user?'<span class="pcOk" aria-hidden="true"></span>':'');btn.setAttribute('aria-label',user?'Mi perfil':'Iniciar sesión');
      if(!user){btn.style.color='#1F1A17'}
    }
    const o=$('pdGoogleAuthOverlay');
    if(o&&!o.hidden){if(user){if(vista!=='perfil')pintarPerfil()}else pintarLogin()}
  };
  try{window.pdActualizarCuentaCliente(pdClienteSesion)}catch(e){}
  const cssBtn=document.createElement('style');cssBtn.textContent='html body #pdCustomerAccountBtn#pdCustomerAccountBtn,html body #pdCustomerAccountBtn#pdCustomerAccountBtn.pdLogged{position:relative!important;flex:0 0 auto!important;width:44px!important;height:44px!important;min-width:44px!important;padding:0!important;border:1px solid var(--fr-line)!important;border-radius:14px!important;background:#FFFFFF!important;color:var(--fr-ink)!important;box-shadow:none!important;display:grid!important;place-items:center!important;overflow:visible!important}html body #pdCustomerAccountBtn svg{width:22px!important;height:22px!important;display:block!important}html body #pdCustomerAccountBtn .pcOk{position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:var(--fr-ink);border:2px solid #FFFFFF}';document.head.appendChild(cssBtn);

  /* Al pedir, este teléfono recuerda también la dirección y la ubicación usadas */
  if(typeof window.saveCustomerInfo==='function'){
    window.saveCustomerInfo=function(name,tel){
      const v=id=>{const el=$(id);return el?String(el.value||'').trim():''};
      const o={nombre_cliente:name||'',telefono_cliente:tel||''};
      if(v('cDireccion'))o.direccion=v('cDireccion');if(v('cReferencia'))o.referencia=v('cReferencia');
      if(v('cLat')&&v('cLng')){o.lat=Number(v('cLat'));o.lng=Number(v('cLng'))}
      LS.set(o);
    };
  }
  /* Si el cliente toma su ubicación al pedir y aún no tenía una guardada, queda guardada en su cuenta */
  if(typeof window.useCurrentLocation==='function'){
    const o=window.useCurrentLocation;
    window.useCurrentLocation=function(){
      const out=o.apply(this,arguments);
      if(usuario()&&datos().lat==null){let n=0;const iv=setInterval(()=>{n++;const la=$('cLat')?.value,ln=$('cLng')?.value;if(la&&ln){clearInterval(iv);guardarUbicacion(Number(la),Number(ln)).catch(()=>{})}else if(n>40)clearInterval(iv)},500)}
      return out;
    };
  }
  /* Formulario de entrega: se llena con los datos y la ubicación guardados */
  const abrirCheckoutOriginal=window.openCheckout;
  if(typeof abrirCheckoutOriginal==='function'){
    window.openCheckout=function(){
      const out=abrirCheckoutOriginal.apply(this,arguments);
      try{
        const d=datos(),put=(id,v)=>{const el=$(id);if(el&&!String(el.value||'').trim()&&v)el.value=v};
        put('cNombre',d.nombre);put('cTelefono',d.telefono);put('cDireccion',d.direccion);put('cReferencia',d.referencia);
        if(d.lat!=null&&d.lng!=null&&$('cLat')&&!$('cLat').value){
          $('cLat').value=d.lat;$('cLng').value=d.lng;
          const st=$('cLocationStatus');if(st)st.textContent='Usando tu ubicación guardada.';
          const mp=$('cMapLink');if(mp)mp.innerHTML='<a href="https://www.google.com/maps?q='+d.lat+','+d.lng+'" target="_blank" rel="noopener" style="color:var(--fr-ink);font-weight:700">Ver en el mapa</a> · Si no estás ahí, toca «Usar mi ubicación actual».';
          try{updateDeliveryFarePreview()}catch(e){}
        }
        const sheet=$('cNombre')&&$('cNombre').closest('.sheet');
        if(sheet&&(d.nombre||d.direccion||d.lat!=null)&&!sheet.querySelector('.pcUsado')){
          const n=document.createElement('div');n.className='pcUsado';n.innerHTML='Completamos tus datos guardados. <b>Revísalos antes de enviar.</b>';
          const top=sheet.querySelector('.sheetTop');if(top)top.after(n);
        }
      }catch(e){console.warn('No se pudieron llenar los datos guardados',e)}
      return out;
    };
  }
})();
