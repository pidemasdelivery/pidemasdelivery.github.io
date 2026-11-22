(function(){
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const P=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?Math.round(n*100)/100:null};
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const st={taper:null,vaso:null,cub:false};
  function negocio(){try{return (typeof getRestaurantForCart==='function')?getRestaurantForCart():null}catch(e){return null}}
  /* Precios que define cada negocio. Vacío = no lo ofrece; 0 = sin costo */
  function cfg(){const n=negocio();if(!n)return {};let c=n.descartables_config;if(typeof c==='string'){try{c=JSON.parse(c)}catch(e){c=null}}return c&&typeof c==='object'?c:{}}
  const NOM={taper:'Taper',vaso:'Vaso'};
  function opciones(t){const c=cfg(),o=[];const p=P(c[t+'_p']),g=P(c[t+'_g']);
    if(p!==null)o.push({k:'p',n:NOM[t]+' pequeño',p});
    if(g!==null)o.push({k:'g',n:NOM[t]+' grande',p:g});return o}
  function elegido(t){const o=opciones(t);return o.length?(o.find(x=>x.k===st[t])||o[0]):null}
  /* Taper, vaso y bolsa: obligatorios cuando el negocio enciende su interruptor */
  window.pdDescItems=function(){const r=[];const b=P(cfg().bolsa);if(b!==null)r.push({n:'Bolsa',p:b});return r};
  /* Cubiertos: opcionales, los elige el cliente */
  window.pdDescCubOfrece=function(){return P(cfg().cubiertos)!==null};
  window.pdDescCubPrecio=function(){return P(cfg().cubiertos)||0};
  window.pdDescCubOn=function(){return st.cub===true&&window.pdDescCubOfrece()};
  window.pdDescActivo=function(){const n=negocio();return !!n&&n.descartables_activo===true&&(window.pdDescItems().length>0||window.pdDescCubOfrece())};
  window.pdDescMonto=function(){
    if(!window.pdDescActivo())return 0;
    return window.pdDescItems().reduce((a,x)=>a+x.p,0)+(window.pdDescCubOn()?window.pdDescCubPrecio():0);
  };
  window.pdDescReset=function(){st.taper=null;st.vaso=null;st.cub=false};
  window.pdDescLineas=function(m){
    if(!window.pdDescActivo())return '';
    const L=window.pdDescItems().map(x=>'<div class="pdLine"><span>'+E(x.n)+'</span><span>'+(x.p>0?m(x.p):'Gratis')+'</span></div>');
    if(window.pdDescCubOn()){const c=window.pdDescCubPrecio();L.push('<div class="pdLine"><span>Cubiertos</span><span>'+(c>0?m(c):'Gratis')+'</span></div>')}
    return L.join('');
  };
  function pintar(box){
    let h='<div class="pdDescH">Adicionales</div>';
    try{window.pdDescNormalizar&&window.pdDescNormalizar();(cart||[]).forEach(x=>(x.pdDesc||[]).forEach(d=>{h+='<div class="pdDescRow"><span class="pdDescN"><b>'+E(d.n)+'</b><small>Incluido en '+E(x.pdNom||x.nombre)+'</small></span><em>'+(d.p>0?money(d.p)+' c/u':'Sin costo')+'</em></div>'}))}catch(e){}
    [].forEach(t=>{
      const o=opciones(t);if(!o.length)return;
      if(o.length===1){h+='<div class="pdDescRow"><b>'+E(o[0].n)+'</b><em>'+(o[0].p>0?money(o[0].p):'Sin costo')+'</em></div>';return}
      const sel=elegido(t).k;
      h+='<div><div class="pdDescRow" style="margin-bottom:6px"><b>'+NOM[t]+'</b></div><div class="pdDescSeg">'+o.map(x=>'<button type="button" data-seg="'+t+'" data-k="'+x.k+'" aria-pressed="'+(x.k===sel)+'">'+(x.k==='p'?'Pequeño':'Grande')+' · '+(x.p>0?money(x.p):'Sin costo')+'</button>').join('')+'</div></div>';
    });
    const b=P(cfg().bolsa);if(b!==null)h+='<div class="pdDescRow"><b>Bolsa</b><em>'+(b>0?money(b):'Sin costo')+'</em></div>';
    if(window.pdDescCubOfrece()){const c=window.pdDescCubPrecio();
      h+='<div class="pdDescRow pdDescCub"><div class="pdDescTx"><b>¿Necesitas cubiertos?</b><small>'+(c>0?'Se suman '+money(c)+' a tu pedido.':'Sin costo adicional.')+'</small></div><button type="button" class="pdDescSw" role="switch" aria-checked="'+(st.cub===true)+'" aria-label="Cubiertos"></button></div>';}
    box.innerHTML=h;
  }
  function refrescar(){
    try{updatePaymentAmounts()}catch(e){}
    try{window.pdRefreshCheckoutSummary&&window.pdRefreshCheckoutSummary()}catch(e){}
  }
  /* ===== Taper y vaso por producto =====
     El negocio elige en cada producto si lleva taper y/o vaso (pequeño o grande).
     Su precio se suma al producto en el carrito. Se guarda en descartables_config.prod = {idProducto:{taper:'p'|'g',vaso:'p'|'g'}} */
  function negPorId(id){try{return (restaurants||[]).find(r=>String(r.id)===String(id))||null}catch(e){return null}}
  function cfgDe(n){let c=n&&n.descartables_config;if(typeof c==='string'){try{c=JSON.parse(c)}catch(e){c=null}}return c&&typeof c==='object'?c:{}}
  function itemsProducto(negocioId,pid){
    const n=negPorId(negocioId)||negocio();
    if(!n||n.descartables_activo!==true)return [];
    const c=cfgDe(n),m=c.prod&&c.prod[String(pid)];if(!m)return [];
    const r=[];
    ['taper','vaso'].forEach(t=>{const k=m[t];if(k!=='p'&&k!=='g')return;const pr=P(c[t+'_'+k]);if(pr===null)return;r.push({t,k,n:NOM[t]+(k==='p'?' pequeño':' grande'),p:pr})});
    /* otros descartables del negocio (caja, sobre, bandeja…) */
    const EX=Array.isArray(c.extras)?c.extras:[];
    (Array.isArray(m.ex)?m.ex:[]).forEach(id=>{const x=EX.find(e=>e&&String(e.id)===String(id));if(!x||!x.n)return;const pr=P(x.p);if(pr===null)return;r.push({t:'ex',k:String(x.id),n:String(x.n),p:pr})});
    return r;
  }
  const r2=v=>Math.round((Number(v)||0)*100)/100;
  function normalizar(){
    try{(cart||[]).forEach(x=>{
      if(!x||x.origen!=='negocio')return;
      if(x.pdBase===undefined){x.pdBase=Number(x.precio)||0;x.pdNom=x.nombre}
      const it=itemsProducto(x.negocio_id,x.id);
      const precio=r2(x.pdBase+it.reduce((a,i)=>a+i.p,0));
      const nombre=x.pdNom+(it.length?' (con '+it.map(i=>i.n.toLowerCase()).join(' y ')+')':'');
      if(x.precio!==precio)x.precio=precio;
      if(x.nombre!==nombre)x.nombre=nombre;
      x.pdDesc=it;
    })}catch(e){}
  }
  window.pdDescNormalizar=normalizar;
  /* Resumen para el aviso al negocio y al motorizado: "Taper grande ×2" */
  window.pdDescProdResumen=function(){
    normalizar();const m=new Map();
    (cart||[]).forEach(x=>(x.pdDesc||[]).forEach(d=>m.set(d.n,(m.get(d.n)||0)+Number(x.cantidad||0))));
    return [...m.entries()].filter(e=>e[1]>0).map(e=>e[0]+' ×'+e[1]);
  };
  ['saveCart','updateCart','getCartTotal','openCart','submitCartOrder'].forEach(nm=>{
    const f=window[nm];if(typeof f!=='function')return;
    window[nm]=function(){normalizar();return f.apply(this,arguments)};
  });
  (function(){
    const f=window.addToCart;if(typeof f!=='function')return;
    window.addToCart=function(id,origen){
      const ok=f.apply(this,arguments);
      if(ok){try{
        normalizar();
        const x=cart.find(l=>String(l.id)===String(id)&&l.origen===origen&&l.pdDesc&&l.pdDesc.length);
        if(x){const sum=x.pdDesc.reduce((a,i)=>a+i.p,0);toast('Agregado con '+x.pdDesc.map(i=>i.n.toLowerCase()).join(' y ')+(sum>0?' · +'+money(sum)+' c/u':''))}
      }catch(e){}}
      return ok;
    };
  })();
  /* El aviso se coloca siempre por encima de cualquier barra inferior visible
     («Ver carrito», «Confirmar pedido», barra de la carta, menú de abajo), sin taparla */
  (function(){
    const t=window.toast;if(typeof t!=='function'||t.__pdAlto)return;
    const BARRAS=['#pdCartaCartBar','#pcaBar','#modal .pdCkSubmit','#modal .pcaGo','#modal .phGo','#modal .pdtGo','#modal .pvGo','.bottom'];
    function ajustar(){
      try{
        const el=document.getElementById('toast');if(!el)return;
        const H=window.innerHeight;let top=H;
        BARRAS.forEach(sel=>document.querySelectorAll(sel).forEach(n=>{
          if(n.hidden)return;const cs=getComputedStyle(n);if(cs.display==='none'||cs.visibility==='hidden')return;
          const r=n.getBoundingClientRect();
          if(r.height>0&&r.width>0&&r.bottom>H*0.5&&r.top<H&&r.top>0&&r.top<top)top=r.top;
        }));
        if(top<H)el.style.setProperty('bottom',Math.round(H-top+12)+'px','important');
        else el.style.removeProperty('bottom');
      }catch(e){}
    }
    window.toast=function(){const x=t.apply(this,arguments);ajustar();setTimeout(ajustar,60);return x};
    window.toast.__pdAlto=true;
  })();
  window.pdDescMontar=function(items){
    if(!items||!window.pdDescActivo())return;
    if(items.querySelector('#pdDesc'))return;
    window.pdDescReset();
    const box=document.createElement('div');box.className='pdDesc';box.id='pdDesc';
    pintar(box);
    box.addEventListener('click',function(e){
      const seg=e.target.closest('[data-seg]'),sw=e.target.closest('.pdDescSw');
      if(!seg&&!sw)return;
      e.preventDefault();e.stopPropagation();
      if(seg)st[seg.dataset.seg]=seg.dataset.k;
      if(sw)st.cub=!st.cub;
      pintar(box);refrescar();
    });
    items.appendChild(box);
    refrescar();
  };
})();
