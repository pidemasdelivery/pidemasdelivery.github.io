(function(){
  const $=id=>document.getElementById(id);
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const SVG=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
  const RELOJ=SVG('<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 7v5l3 3"/>');
  const BOLSA=SVG('<path d="M6.33 8h11.34a2 2 0 0 1 1.98 2.27l-1.25 8.5a2 2 0 0 1 -1.98 1.73h-8.84a2 2 0 0 1 -1.98 -1.73l-1.25 -8.5a2 2 0 0 1 1.98 -2.27z"/><path d="M9 11v-5a3 3 0 0 1 6 0v5"/>');
  const enlace=()=>(new URLSearchParams(location.search).get('negocio')||'').trim();
  const prods=()=>{try{return products||[]}catch(e){return []}};
  /* Categoría real del producto (para que «Caballa» diga de qué es) */
  const normC=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
  const catCache=new Map();
  window.pdCategoriaDe=function(p){
    if(!p)return '';
    try{(selectedRestaurantCategories||[]).forEach(c=>catCache.set(String(c.id),c))}catch(e){}
    const id=String(p.categoria_id||'');let n='';
    if(id){const L=[...catCache.values()].concat((()=>{try{return selectedRestaurantCategories||[]}catch(e){return []}})(),(()=>{try{return allProductCategories||[]}catch(e){return []}})(),(()=>{try{return productCategories||[]}catch(e){return []}})());const c=L.find(x=>String(x.id)===id);if(c)n=c.nombre||''}
    if(!n){try{n=(getOfficialMenuInfo(p)||{}).name||''}catch(e){}}
    if(!n)n=p.categoria_nombre||p.categoria||'';
    return /m[aá]s pedido/i.test(n)?'':String(n).trim();
  };
  window.pdCatItem=function(x){
    if(!x)return '';if(x.categoria)return x.categoria;
    const p=prods().find(y=>String(y.id)===String(x.id)&&y.origen===x.origen);const c=window.pdCategoriaDe(p);
    if(c)x.categoria=c;return c;
  };
  /* Nombre que recibe el negocio: «Caballa (Ceviches)»; si el nombre ya dice la categoría no se repite */
  window.pdNombreConCategoria=function(x){
    const nom=String(x&&x.nombre||'Producto'),c=window.pdCatItem(x);if(!c)return nom;
    if(/^(platos?|platos principales|plato de fondo|bebidas?|complementos?|guarniciones?|postres?|otros?|general|varios|productos?|men[uú]|carta|extras?|adicionales|sin categor[ií]a|promociones?|combos?)$/i.test(c.trim()))return nom;
    const raiz=normC(c).replace(/(es|s)$/,'').slice(0,Math.max(4,normC(c).length-2));
    if(raiz&&normC(nom).includes(raiz))return nom;
    return nom+' ('+c+')';
  };
  const rests=()=>{try{return restaurants||[]}catch(e){return []}};
  const carrito=()=>{try{return cart||[]}catch(e){return []}};
  const idDe=card=>{const m=String(card.getAttribute('onclick')||'').match(/openProductDetails\('([^']+)','([^']*)'\)/);return m?{id:m[1],origen:m[2]}:null};
  function negocioActual(cont){
    const id=enlace();if(id)return rests().find(r=>String(r.id)===id)||null;
    const c=cont.querySelector('.productDetailCard');const d=c&&idDe(c);if(!d)return null;
    const p=prods().find(x=>String(x.id)===d.id&&x.origen===d.origen);return p?rests().find(r=>String(r.id)===String(p.negocio_id))||null:null;
  }
  function abierto(r){try{return typeof isRestaurantOpen==='function'?isRestaurantOpen(r):true}catch(e){return true}}
  /* ---------- Carta ---------- */
  function mejorarCarta(cont){
    if(!cont||!cont.querySelector('.categoryBlock'))return;
    cont.classList.add('pcaCarta');
    const enModal=!!cont.closest('#cartaModalNegocio');
    /* Cabecera del negocio (solo en la carta de página completa; la ventana ya tiene la suya) */
    if(!enModal){
      const head=$('productsSectionHead');const r=negocioActual(cont);
      if(head&&r&&!head.querySelector('.pcaHead')){
        const on=abierto(r);const eta=r.tiempo_estimado||'';const cat=r.categoria_negocio||r.categoria||'';
        head.innerHTML='<div class="pcaHead"><h2 id="productsTitle">'+E(r.nombre||r.nombre_negocio||'Carta')+'</h2><div class="pcaMeta"><span class="pcaPill'+(on?'':' off')+'">'+(on?'Abierto':'Cerrado')+'</span>'+(cat?'<span>'+E(cat)+'</span>':'')+(eta?'<span class="pcaDot">'+RELOJ+E(eta)+'</span>':'')+'</div></div>';
      }
    }
    /* Chips de categorías */
    const bloques=[...cont.querySelectorAll('.categoryBlock')];
    let chips=cont.parentElement.querySelector(':scope > .pcaChips');
    if(bloques.length>1){
      if(!chips){chips=document.createElement('div');chips.className='pcaChips';cont.insertAdjacentElement('beforebegin',chips)}
      chips.innerHTML=bloques.map((b,i)=>{b.id='pcaCat'+i+(enModal?'m':'');return '<button type="button" data-cat="'+b.id+'" class="'+(i===0?'on':'')+'">'+E((()=>{const h=b.querySelector('.categoryTitle');if(!h)return 'Categoría';if(!h.dataset.nombre)h.dataset.nombre=[...h.childNodes].filter(n=>!(n.classList&&n.classList.contains('pcaCnt'))).map(n=>n.textContent).join('').trim();return h.dataset.nombre})())+'</button>'}).join('');
      chips.onclick=e=>{const b=e.target.closest('[data-cat]');if(!b)return;const t=cont.querySelector('#'+b.dataset.cat);if(t)irA(chips,t);marcar(chips,b.dataset.cat)};
      if(!enModal){const hdr=document.querySelector('header');document.documentElement.style.setProperty('--pca-top',((hdr&&hdr.getBoundingClientRect().height)||72)+'px')}
    }else if(chips)chips.remove();
    bloques.forEach(b=>{const h=b.querySelector('.categoryTitle');if(!h)return;const n=b.querySelectorAll('.productDetailCard').length;let s=h.querySelector('.pcaCnt');if(!s){s=document.createElement('span');s.className='pcaCnt';h.appendChild(s)}s.textContent=n+(n===1?' opción':' opciones')});
    /* Filas: descripción, pocas unidades y cantidad en el carrito */
    cont.querySelectorAll('.productDetailCard').forEach(c=>{
      const d=idDe(c);if(!d)return;const p=prods().find(x=>String(x.id)===d.id&&x.origen===d.origen);
      const body=c.querySelector('.productBody');if(!body)return;
      if(p&&!body.querySelector('.pcaDesc')&&p.descripcion){const h=body.querySelector('h3');if(h)h.insertAdjacentHTML('afterend','<div class="pcaDesc">'+E(p.descripcion)+'</div>')}
      body.querySelectorAll(':scope>div').forEach(x=>{if(/^\s*Stock:/i.test(x.textContent))x.classList.add('pcaStockViejo')});
      const st=Number(p&&(p.stock??p.stock_disponible));
      body.querySelector('.pcaPocos')?.remove();
      /* En la lista de la carta no se muestran las unidades que quedan */
      const n=carrito().filter(x=>String(x.id)===d.id&&x.origen===d.origen).reduce((a,x)=>a+Number(x.cantidad||0),0);
      c.querySelectorAll('.pcaCant').forEach(x=>x.remove());
      body.querySelector('.pcaChips2')?.replaceWith(...body.querySelector('.pcaChips2').childNodes);
      c.classList.toggle('pcaConFoto',!!c.querySelector('.productImg:not(.pdNoImg)'));
      if(n){const b=document.createElement('span');b.className='pcaCant';b.textContent=n;c.appendChild(b)}
      {const ps=[...body.querySelectorAll(':scope>.pcaPocos,:scope>.pcaCant')];if(ps.length){const w=document.createElement('div');w.className='pcaChips2';ps[0].before(w);ps.forEach(x=>w.appendChild(x))}}
    });
  }
  function barra(){
    let bar=$('pcaBar');
    const enCarta=!!enlace()&&$('products')?.classList.contains('menu-completo');
    const n=carrito().reduce((a,x)=>a+Number(x.cantidad||0),0),tot=carrito().reduce((a,x)=>a+Number(x.precio||0)*Number(x.cantidad||0),0);
    if(!enCarta||!n){if(bar)bar.hidden=true;document.body.classList.remove('pca-con-barra');return}
    if(!bar){bar=document.createElement('button');bar.type='button';bar.id='pcaBar';bar.onclick=()=>{try{openCart()}catch(e){}};document.body.appendChild(bar)}
    bar.hidden=false;document.body.classList.add('pca-con-barra');
    bar.innerHTML='<span><span class="n">'+n+'</span>Ver carrito</span><span>'+money(tot)+'</span>';
  }
  function todo(){try{window.pdCategoriaDe({});const p=$('products');if(p&&p.classList.contains('menu-completo'))mejorarCarta(p);const m=$('cartaModalProducts');if(m)mejorarCarta(m);barra()}catch(e){console.warn('[Pidemás] carta',e)}}
  const envolver=(nombre,despues)=>{const f=window[nombre];if(typeof f!=='function')return;window[nombre]=function(){const r=f.apply(this,arguments);try{despues()}catch(e){}return r}};
  envolver('renderProducts',todo);envolver('actualizarContenidoModalCarta',todo);envolver('updateCart',todo);
  /* Desplazamiento y categoría visible (página completa y ventana de la carta) */
  let bloqueo=0;
  function scroller(el){for(let x=el.parentElement;x&&x!==document.body;x=x.parentElement){const o=getComputedStyle(x).overflowY;if((o==='auto'||o==='scroll')&&x.scrollHeight>x.clientHeight+2)return x}return null}
  function marcar(chips,id){chips.querySelectorAll('button').forEach(x=>{const on=x.dataset.cat===id;if(on!==x.classList.contains('on'))x.classList.toggle('on',on);if(on){const cr=chips.getBoundingClientRect(),xr=x.getBoundingClientRect();if(xr.left<cr.left+8||xr.right>cr.right-8)chips.scrollTo({left:chips.scrollLeft+(xr.left-cr.left)-(cr.width-xr.width)/2,behavior:'smooth'})}})}
  function irA(chips,bloque){
    bloqueo=Date.now()+900;
    const d=bloque.getBoundingClientRect().top-chips.getBoundingClientRect().bottom-6;
    const sc=scroller(bloque);if(sc)sc.scrollBy({top:d,behavior:'smooth'});else window.scrollBy({top:d,behavior:'smooth'});
  }
  function espiar(){
    if(Date.now()<bloqueo)return;
    document.querySelectorAll('.pcaChips').forEach(ch=>{
      const cont=ch.parentElement&&ch.parentElement.querySelector(':scope > .pcaCarta');if(!cont||!ch.offsetParent)return;
      const lim=ch.getBoundingClientRect().bottom+24;let act=null;
      cont.querySelectorAll('.categoryBlock').forEach(b=>{if(b.getBoundingClientRect().top<=lim)act=b.id});
      if(!act){const f=cont.querySelector('.categoryBlock');act=f&&f.id}
      if(act)marcar(ch,act);
    });
  }
  document.addEventListener('scroll',()=>{clearTimeout(espiar.t);espiar.t=setTimeout(espiar,60)},{passive:true,capture:true});
  setTimeout(todo,600);setTimeout(todo,2000);

  /* ---------- Carrito ---------- */
  function pintarCarrito(){
    const sheet=document.querySelector('#modal .sheet');if(!sheet)return;
    sheet.classList.add('pcaCart');
    const items=carrito();
    const r=(()=>{const it=items.find(x=>x.origen==='negocio');return it?rests().find(x=>String(x.id)===String(it.negocio_id)):null})();
    const sub=items.reduce((a,x)=>a+Number(x.precio||0)*Number(x.cantidad||0),0);
    const foto=x=>{const p=prods().find(y=>String(y.id)===String(x.id)&&y.origen===x.origen);const u=p&&(p.imagen_url||p.imagen);return u?'<img src="'+E(u)+'" alt="">':''};
    let h='<div class="pcaTop"><div><h2>Tu carrito</h2>'+(items.length?'<small>'+E(r?(r.nombre||''):'Productos Pidemás')+'</small>':'')+'</div><button type="button" class="pcaX" aria-label="Cerrar" data-pca="cerrar">×</button></div>';
    if(!items.length){
      h+='<div class="pcaBody"><div class="pcaVacio"><i>'+BOLSA+'</i><b>Tu carrito está vacío</b><p>Agrega productos de la carta para hacer tu pedido.</p><button type="button" class="pdpBtn" data-pca="cerrar" style="width:100%!important">Ver la carta</button></div></div>';
    }else{
      h+='<div class="pcaBody"><div class="pcaCard">'+items.map((x,i)=>'<div class="pcaIt">'+(foto(x)?'<div class="pcaFoto">'+foto(x)+'</div>':'')+'<div class="pcaTx"><b>'+E(x.nombre)+'</b><small>'+(window.pdCatItem(x)?E(window.pdCatItem(x))+' · ':'')+money(x.precio)+' c/u</small><strong>'+money(Number(x.precio||0)*Number(x.cantidad||0))+'</strong></div><div class="pcaStep"><button type="button" data-pca="menos" data-i="'+i+'" aria-label="Quitar uno">−</button><span>'+Number(x.cantidad||0)+'</span><button type="button" data-pca="mas" data-i="'+i+'" aria-label="Agregar uno">+</button></div></div>').join('')+'</div>'+
        '<button type="button" class="pcaVaciar" data-pca="vaciar">Vaciar carrito</button>'+
        '<div class="pcaRes"><div><span>Subtotal</span><span>'+money(sub)+'</span></div><div><span>Delivery</span><span>Siguiente paso</span></div><div class="t"><span>Total</span><span>'+money(sub)+'</span></div><p>El delivery se calcula con tu ubicación al continuar.</p></div></div>'+
        '<div class="pcaFoot"><button type="button" class="pcaGo" data-pca="seguir"><span>Continuar</span><span>'+money(sub)+'</span></button></div>';
    }
    sheet.innerHTML=h;
    sheet.onclick=async e=>{
      const b=e.target.closest('[data-pca]');if(!b)return;const a=b.dataset.pca,i=Number(b.dataset.i);
      if(a==='cerrar'){try{closeModal()}catch(_){}return}
      if(a==='seguir'){try{openCheckout()}catch(_){}return}
      if(a==='vaciar'){if(!(await window.pdConfirmar('¿Vaciar el carrito?\nSe quitarán todos los productos.')))return;cart.length=0;try{saveCart();updateCart()}catch(_){}pintarCarrito();return}
      const it=cart[i];if(!it)return;
      if(a==='mas'){const p=prods().find(x=>String(x.id)===String(it.id)&&x.origen===it.origen);const st=Number(p?.stock);if(Number.isFinite(st)&&st>=0&&it.cantidad+1>st){try{toast('No hay más unidades disponibles de este producto.')}catch(_){}return}it.cantidad++}
      if(a==='menos'){it.cantidad--;if(it.cantidad<=0)cart.splice(i,1)}
      try{saveCart();updateCart()}catch(_){}
      pintarCarrito();
    };
  }
  const oc=window.openCart;
  if(typeof oc==='function'){window.openCart=function(){const r=oc.apply(this,arguments);try{pintarCarrito()}catch(e){console.warn('[Pidemás] carrito',e)}return r}}
  /* ---------- Detalle del producto ---------- */
  const opd=window.openProductDetails;
  if(typeof opd==='function'){
    window.openProductDetails=function(id,origen){
      const out=opd.apply(this,arguments);
      try{
        const sheet=document.querySelector('#modal .sheet.productDetailSheet');if(!sheet||sheet.classList.contains('pdtApp'))return out;
        const p=prods().find(x=>String(x.id)===String(id)&&x.origen===origen);if(!p)return out;
        const name=p.nombre||p.nombre_producto||'Producto';const price=Number(p.precio??p.precio_unitario??0);
        const img=p.imagen_url||p.imagen||'';
        let desc='',feat='';
        try{const d=splitCatalogDescription(p.descripcion||p.descripcion_detallada||p.detalle||'');desc=d.description||'';if(d.features&&d.features.length)feat='<div class="productCatalogFeatures"><strong>Características</strong>'+d.features.map(f=>'<div><b>'+E(f.name)+':</b> '+E(f.value)+'</div>').join('')+'</div>'}catch(e){desc=p.descripcion||''}
        let st=null;try{st=getProductStock(p)}catch(e){}
        const r=origen==='negocio'?rests().find(x=>String(x.id)===String(p.negocio_id)):null;
        const cat=window.pdCategoriaDe(p);
        const sArg=st===null?'null':Number(st);
        sheet.className='sheet productDetailSheet pdtApp'+(img?'':' sinFoto');
        sheet.innerHTML='<button type="button" class="pdtX close" onclick="closeModal()" aria-label="Cerrar">×</button>'+
          (img?'<div class="pdtFoto"><img src="'+E(img)+'" alt="'+E(name)+'" onerror="this.parentElement.remove();this.closest(\'.pdtApp\')?.classList.add(\'sinFoto\')"></div>':'')+
          '<div class="pdtBody">'+(r?'<div class="pdtNeg">'+E(r.nombre||'')+'</div>':'')+'<h2 class="pdtNom">'+E(name)+'</h2>'+(cat?'<div class="pdtCat">'+E(cat)+'</div>':'')+'<div class="pdtPrecio">'+money(price)+'</div>'+
          (desc?'<p class="pdtDesc">'+E(desc)+'</p>':'')+feat+
          (st!==null&&Number(st)>0&&Number(st)<=5?'<div class="pdtPocos">¡Quedan '+Number(st)+'!</div>':'')+'</div>'+
          '<div class="pdtBar"><div class="pdtQty"><button type="button" onclick="changeDetailQty(-1,'+sArg+')" aria-label="Quitar uno">−</button><strong id="detailProductQty">1</strong><button type="button" onclick="changeDetailQty(1,'+sArg+')" aria-label="Agregar uno">+</button></div>'+
          '<button type="button" class="pdtGo" onclick="addDetailedProductToCart(\''+E(String(p.id))+'\',\''+E(origen)+'\')">Agregar · S/ <span id="detailProductTotal">'+price.toFixed(2)+'</span></button></div>';
      }catch(e){console.warn('[Pidemás] detalle',e)}
      return out;
    };
  }
})();
