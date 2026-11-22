/* Etapa 4 · Tienda: productos con tallas, colores u opciones, varias fotos, precio de oferta y licorería +18. */
(function(){
  if(window.__pdTipoTienda)return; window.__pdTipoTienda=true;
  const COMIDA=['Restaurantes','Comida criolla','Pizzerías','Pollerías','Hamburgueserías','Comida rápida','Sangucherías','Paviferías','Cevicherías','Chifas','Sushi y comida japonesa','Parrillas y anticuchos','Heladerías','Cafeterías','Juguerías','Dulcerías y pastelerías','Panaderías'];
  const plantilla=cat=>{const c=String(cat||'').trim();if(!c||COMIDA.includes(c))return 'comida';if(['Ropa y moda','Calzado y zapatillas'].includes(c))return 'moda';if(c==='Licorerías')return 'licoreria';return 'opciones'};
  window.pdPlantilla=plantilla;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arr=v=>{if(Array.isArray(v))return v;try{const p=JSON.parse(v||'[]');return Array.isArray(p)?p:[]}catch(e){return []}};
  const findP=(id,origen)=>(typeof products!=='undefined'?products:[]).find(x=>String(x.id)===String(id)&&x.origen===origen);
  const restOf=p=>p&&p.origen==='negocio'?(typeof restaurants!=='undefined'?restaurants:[]).find(r=>String(r.id)===String(p.negocio_id)):null;
  const catOf=r=>r?(typeof pick==='function'?pick(r,['categoria_negocio','categoria_comercial','tipo_negocio','categoria'],''):r.categoria_negocio):'';
  const vars=p=>arr(p?.variantes).filter(v=>v&&v.clave);
  const off=p=>{const a=Number(p?.precio_antes),n=Number(p?.precio);return a>n&&n>0?Math.round((1-n/a)*100):0};

  // +18: el carrito contiene productos de una licorería.
  window.pdCarrito18=function(){return (typeof cart!=='undefined'?cart:[]).some(x=>{if(x.origen!=='negocio')return false;const r=(typeof restaurants!=='undefined'?restaurants:[]).find(r=>String(r.id)===String(x.negocio_id));return plantilla(catOf(r))==='licoreria'})};

  // Tarjetas: precio de oferta.
  function decorar(){
    document.querySelectorAll('.productDetailCard[onclick^="openProductDetails("]:not([data-pdoff])').forEach(card=>{
      card.dataset.pdoff='1';
      const m=String(card.getAttribute('onclick')).match(/openProductDetails\('([^']*)','([^']*)'\)/);if(!m)return;
      const p=findP(m[1],m[2]);const o=off(p);if(!o)return;
      const pr=card.querySelector('.price');if(pr)pr.innerHTML=`S/ ${Number(p.precio).toFixed(2)}<s>S/ ${Number(p.precio_antes).toFixed(2)}</s>`;
      const im=card.querySelector('.productImg');if(im&&!im.querySelector('.pdOffTag'))im.insertAdjacentHTML('afterbegin',`<span class="pdOffTag">−${o}%</span>`);
    });
  }
  let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(decorar,80)}).observe(document.body,{childList:true,subtree:true});

  // Ficha con variantes.
  const S={};
  function render(){
    const p=findP(S.id,S.origen);if(!p)return;
    const r=restOf(p),tipo=plantilla(catOf(r)),vs=vars(p);
    const name=typeof pick==='function'?pick(p,['nombre','nombre_producto'],'Producto'):p.nombre;
    const desc=typeof splitCatalogDescription==='function'?splitCatalogDescription(p.descripcion||'').description:(p.descripcion||'');
    const fotos=[p.imagen_url,...arr(p.fotos)].filter(Boolean);
    const colores=[...new Set(vs.map(v=>v.color).filter(Boolean))];
    const moda=tipo==='moda'||vs.some(v=>v.talla);
    if(moda&&colores.length&&!S.color)S.color=(vs.find(v=>v.color&&Number(v.stock)>0)||vs[0]).color||'';
    const pool=moda&&colores.length?vs.filter(v=>v.color===S.color):vs;
    const sel=vs.find(v=>v.clave===S.clave);
    const o=off(p);
    let selector='';
    if(moda){
      if(colores.length)selector+=`<div><div class="pvLbl">Color: <span>${E(S.color||'—')}</span></div><div class="pvChips">${colores.map(c=>`<button type="button" class="${c===S.color?'on':''}" onclick="pdVarColor(${colores.indexOf(c)})">${E(c)}</button>`).join('')}</div></div>`;
      selector+=`<div><div class="pvLbl">Talla</div><div class="pvChips">${pool.map(v=>`<button type="button" class="${v.clave===S.clave?'on':''}" ${Number(v.stock)>0?'':'disabled'} onclick="pdVarPick(${vs.indexOf(v)})">${E(v.talla||v.opcion||v.clave)}</button>`).join('')}</div></div>`;
    }else{
      selector=`<div><div class="pvLbl">Elige una opción</div><div class="pvChips">${vs.map(v=>`<button type="button" class="${v.clave===S.clave?'on':''}" ${Number(v.stock)>0?'':'disabled'} onclick="pdVarPick(${vs.indexOf(v)})">${E(v.opcion||v.clave)}</button>`).join('')}</div></div>`;
    }
    const left=sel?(Number(sel.stock)<=5?`Quedan ${Number(sel.stock)}`:''):'';
    const go=vs.length?(sel?`Agregar · ${E(sel.clave)}`:(moda?'Elige tu talla':'Elige una opción')):'Agregar al carrito';
    const html=`<div class="sheet"><div class="sheetTop"><h2>Detalle del producto</h2><button class="close" onclick="closeModal()" aria-label="Cerrar">×</button></div><div class="pvSheet">
      ${fotos.length?`<div class="pvPhotos">${fotos.map(u=>`<img src="${E(u)}" alt="${E(name)}" loading="lazy">`).join('')}</div>`:''}
      <h3>${E(name)}</h3>
      <div class="pvPrice">S/ ${Number(p.precio||0).toFixed(2)}${o?`<s>S/ ${Number(p.precio_antes).toFixed(2)}</s><span class="pvOff">−${o}%</span>`:''}</div>
      ${desc?`<p class="pvDesc">${E(desc)}</p>`:''}
      ${vs.length?selector:''}
      <div class="pvLeft">${E(left)}</div>
      ${tipo==='licoreria'?'<div class="pv18">Venta solo a mayores de 18 años. El motorizado te pedirá tu DNI al entregar.</div>':''}
      <div class="pvBar"><div class="pvQty"><button type="button" onclick="pdVarQty(-1)" aria-label="Quitar uno">−</button><b>${S.qty}</b><button type="button" onclick="pdVarQty(1)" aria-label="Agregar uno">+</button></div><button type="button" class="pvGo" ${vs.length&&!sel?'disabled':''} onclick="pdVarAdd()">${go}</button></div>
    </div></div>`;
    showModal(html);
  }
  window.pdVarColor=i=>{const p=findP(S.id,S.origen);const cs=[...new Set(vars(p).map(v=>v.color).filter(Boolean))];S.color=cs[i]||'';S.clave='';S.qty=1;render()};
  window.pdVarPick=i=>{const p=findP(S.id,S.origen);const v=vars(p)[i];if(!v)return;S.clave=v.clave;S.qty=1;render()};
  window.pdVarQty=d=>{const p=findP(S.id,S.origen);const v=vars(p).find(x=>x.clave===S.clave);const max=v?Number(v.stock):(typeof getProductStock==='function'?getProductStock(p):null);S.qty=Math.max(1,S.qty+d);if(max!=null&&Number.isFinite(Number(max)))S.qty=Math.min(S.qty,Math.max(1,Number(max)));render()};
  window.pdVarAdd=function(){
    const p=findP(S.id,S.origen);if(!p)return;
    const vs=vars(p);
    if(!vs.length){if(typeof addToCart==='function'&&addToCart(p.id,p.origen,S.qty))closeModal();return}
    const v=vs.find(x=>x.clave===S.clave);if(!v){toast('Elige una opción.');return}
    if(p.origen==='negocio'){const nr=getProductRestaurantId(p),cr=getCartRestaurantId();if(cr&&String(cr)!==String(nr)){showRestaurantConflict(cr,nr);return}}
    const key=String(p.id)+'|'+p.origen+'|'+v.clave;
    const inCart=cart.filter(x=>x.key===key).reduce((a,x)=>a+Number(x.cantidad||0),0);
    if(inCart+S.qty>Number(v.stock)){toast('No hay suficiente stock de '+v.clave+'.');return}
    const old=cart.find(x=>x.key===key);
    if(old)old.cantidad+=S.qty;else cart.push({key,id:String(p.id),origen:p.origen,negocio_id:getProductRestaurantId(p),nombre:(pick(p,['nombre','nombre_producto'],'Producto'))+' · '+v.clave,precio:Number(p.precio||0),cantidad:S.qty,variante:v.clave});
    saveCart();updateCart();toast('Producto agregado al carrito');closeModal();
  };
  if(typeof window.openProductDetails==='function'){
    const orig=window.openProductDetails;
    window.openProductDetails=function(id,origen){
      const p=findP(id,origen);
      if(!p||(!vars(p).length&&!arr(p.fotos).length&&!off(p)&&plantilla(catOf(restOf(p)))!=='licoreria'))return orig.apply(this,arguments);
      const r=restOf(p);if(r&&typeof isRestaurantOpen==='function'&&!isRestaurantOpen(r)){showRestaurantSchedule(p.negocio_id);return}
      S.id=String(id);S.origen=origen;S.color='';S.clave='';S.qty=1;
      const vs=vars(p);if(vs.length===1&&Number(vs[0].stock)>0)S.clave=vs[0].clave;
      render();
    };
  }

  // Checkout: confirmación de mayoría de edad para licorerías.
  if(typeof window.openCheckout==='function'){
    const oc=window.openCheckout;
    window.openCheckout=function(){
      const out=oc.apply(this,arguments);
      try{if(window.pdCarrito18()&&!document.getElementById('cMayor18')){const pago=document.getElementById('cPago')?.closest('.field');const f=document.createElement('label');f.className='pd18Field';f.innerHTML='<input type="checkbox" id="cMayor18"><span>Confirmo que soy <b>mayor de 18 años</b>. Mostraré mi DNI al recibir el pedido.</span>';pago?pago.before(f):document.querySelector('#modal .sheet')?.appendChild(f)}}catch(e){}
      return out;
    };
  }
  if(typeof window.submitCartOrder==='function'){
    const so=window.submitCartOrder;
    window.submitCartOrder=function(){
      if(window.pdCarrito18()&&!document.getElementById('cMayor18')?.checked){toast('Confirma que eres mayor de 18 años para comprar en una licorería.');document.getElementById('cMayor18')?.focus();return}
      return so.apply(this,arguments);
    };
  }
})();
