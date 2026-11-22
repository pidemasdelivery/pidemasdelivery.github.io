/* Pidemás · efectos de app profesional:
   - al agregar al carrito: el producto vuela al carrito, el carrito salta y el teléfono vibra suave
   - el botón «Agregar» muestra un visto ✓
   - la barra «Ver carrito» entra deslizándose y el total cambia con animación
   - los avisos entran suaves, el corazón de favoritos late y el pedido enviado se celebra con confeti */
(function(){
  if(window.__pdEfectos)return;window.__pdEfectos=true;
  const quieto=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vibrar=ms=>{try{if(navigator.vibrate)navigator.vibrate(ms)}catch(e){}};
  const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&!el.hidden&&getComputedStyle(el).visibility!=='hidden'};
  const pop=(el,cls)=>{if(!el||quieto)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),600)};

  /* Último toque: de dónde sale el vuelo */
  let toque=null;
  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest('button,[role=button],.productDetailCard,.pdRestCard,a');
    if(!b)return;
    const r=b.getBoundingClientRect();
    const caja=b.closest('.sheet,.productDetailCard,[class*="pdt"],.carta-modal-body')||b.parentElement;
    const img=caja&&caja.querySelector('img[src]:not([src^="data:image/svg"])');
    toque={x:r.left+r.width/2,y:r.top+r.height/2,img:img&&img.naturalWidth?img.currentSrc||img.src:null,boton:b,t:Date.now()};
  },true);

  const totalCarrito=()=>{try{return (window.cart||cart||[]).reduce((a,x)=>a+Number(x.cantidad||0),0)}catch(e){return 0}};
  const subtotal=()=>{try{return (window.cart||cart||[]).reduce((a,x)=>a+Number(x.precio||0)*Number(x.cantidad||0),0)}catch(e){return 0}};

  function destino(){
    const bar=document.getElementById('pdCartaCartBar');
    if(visible(bar))return bar.querySelector('.pdCartaCartCount')||bar;
    const btn=document.querySelector('header .cartBtn');
    if(visible(btn))return btn;
    const nav=[...document.querySelectorAll('.navbtn,nav button')].find(x=>/carrito|pedido/i.test(x.textContent));
    return visible(nav)?nav:null;
  }

  function volar(desde,img,cant){
    const meta=destino();if(!meta){return}
    const r=meta.getBoundingClientRect();const x2=r.left+r.width/2,y2=r.top+r.height/2;
    const x1=desde.x,y1=desde.y;
    if(quieto){llegar(meta);return}
    const f=document.createElement('div');f.className='pdfxVuelo';
    if(img)f.style.backgroundImage='url("'+img.replace(/"/g,'%22')+'")';else f.textContent='+'+cant;
    document.body.appendChild(f);
    const alto=Math.min(y1,y2)-Math.max(90,Math.abs(x2-x1)*0.35);
    const pasos=[];for(let i=0;i<=12;i++){const t=i/12;const x=x1+(x2-x1)*t;const y=(1-t)*(1-t)*y1+2*(1-t)*t*alto+t*t*y2;
      pasos.push({transform:'translate('+x+'px,'+y+'px) scale('+(1-0.55*t)+')'+(img?' rotate('+(t*200)+'deg)':''),opacity:t>0.92?0.2:1})}
    const a=f.animate(pasos,{duration:640,easing:'cubic-bezier(.35,.05,.45,1)',fill:'forwards'});
    a.onfinish=()=>{f.remove();llegar(meta)};
    setTimeout(()=>f.remove(),1500);
  }
  function llegar(meta){
    pop(meta,'pdfxPop');
    const badge=document.getElementById('cartCount');if(badge&&!meta.contains(badge))pop(badge,'pdfxPop');
    vibrar(18);
  }

  /* Visto ✓ en el botón Agregar */
  function vistoBien(b){
    if(!b||quieto||!document.body.contains(b))return;
    if(getComputedStyle(b).position==='static')b.style.position='relative';
    const o=document.createElement('span');o.className='pdfxOk';
    o.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Agregado';
    b.appendChild(o);setTimeout(()=>o.remove(),900);
  }

  /* Total de la barra «Ver carrito» contando hacia el nuevo valor */
  function contar(desde,hasta){
    const bar=document.getElementById('pdCartaCartBar');if(!bar||quieto)return;
    const el=bar.lastElementChild;if(!el||!/S\//.test(el.textContent))return;
    const t0=performance.now(),d=420;
    (function paso(t){const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent='S/ '+(desde+(hasta-desde)*e).toFixed(2);if(k<1)requestAnimationFrame(paso)})(t0);
  }

  /* Se engancha a updateCart: cada vez que el carrito crece, hay efecto */
  let antes=null,antesTotal=0,barraVisible=false;
  function enganchar(){
    const orig=window.updateCart;if(typeof orig!=='function'||orig.__pdfx)return false;
    const nuevo=function(){
      const prev=antes,prevTotal=antesTotal;
      const out=orig.apply(this,arguments);
      try{
        const n=totalCarrito(),tot=subtotal();antes=n;antesTotal=tot;
        const bar=document.getElementById('pdCartaCartBar');const vb=visible(bar);
        if(vb&&!barraVisible&&!quieto)pop(bar,'pdfxSube');
        barraVisible=vb;
        if(prev!==null&&n>prev){
          const d=toque&&Date.now()-toque.t<4000?toque:{x:innerWidth/2,y:innerHeight*0.7,img:null};
          const btn=d.boton;
          requestAnimationFrame(()=>{volar(d,d.img,n-prev);if(btn&&/agregar|añadir|\+/i.test(btn.textContent||btn.getAttribute('aria-label')||''))vistoBien(btn)});
          if(vb&&prevTotal!==tot)setTimeout(()=>contar(prevTotal,tot),60);
        }else if(prev!==null&&n<prev){pop(document.getElementById('cartCount'),'pdfxBump');vibrar(8)}
      }catch(e){}
      return out;
    };
    nuevo.__pdfx=true;window.updateCart=nuevo;
    try{updateCart=nuevo}catch(e){}
    antes=totalCarrito();antesTotal=subtotal();
    return true;
  }
  if(!enganchar())window.addEventListener('load',enganchar);

  /* Avisos (toast) entran suaves */
  const toast=document.getElementById('toast');
  if(toast&&!quieto){
    let mostrado=false;
    new MutationObserver(()=>{const v=toast.style.display!=='none'&&toast.textContent.trim();if(v&&!mostrado){toast.classList.remove('pdfxEntra');void toast.offsetWidth;toast.classList.add('pdfxEntra')}mostrado=!!v}).observe(toast,{attributes:true,attributeFilter:['style'],childList:true,characterData:true,subtree:true});
  }

  /* Corazón de favoritos late */
  document.addEventListener('click',e=>{const f=e.target.closest('.pdFav');if(!f)return;const oc=f.getAttribute('onclick');vibrar(10);
    setTimeout(()=>{const b=f.isConnected?f:[...document.querySelectorAll('.pdFav')].find(x=>x.getAttribute('onclick')===oc);pop(b,'pdfxPop')},30)},true);

  /* Pedido enviado: confeti */
  function confeti(){
    if(quieto)return;
    const c=document.createElement('canvas');c.className='pdfxConfeti';const dpr=Math.min(2,devicePixelRatio||1);
    c.width=innerWidth*dpr;c.height=innerHeight*dpr;document.body.appendChild(c);const g=c.getContext('2d');g.scale(dpr,dpr);
    const col=['#C4410C','#FF5E29','#FBE6DD','#1F6B3B','#F2B33D','#ffffff'];
    const P=[...Array(110)].map(()=>({x:innerWidth/2+(Math.random()-.5)*60,y:innerHeight*0.38,vx:(Math.random()-.5)*11,vy:-Math.random()*13-4,r:Math.random()*6+4,c:col[Math.random()*col.length|0],a:Math.random()*6,va:(Math.random()-.5)*.4}));
    const t0=performance.now();
    (function cuadro(t){g.clearRect(0,0,innerWidth,innerHeight);const k=(t-t0)/1000;
      P.forEach(p=>{p.vy+=0.38;p.vx*=0.985;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;g.save();g.globalAlpha=Math.max(0,1-k/2.2);g.translate(p.x,p.y);g.rotate(p.a);g.fillStyle=p.c;g.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);g.restore()});
      if(k<2.3)requestAnimationFrame(cuadro);else c.remove()})(t0);
    vibrar([20,40,30]);
  }
  const modal=document.getElementById('modal');
  if(modal)new MutationObserver(()=>{const ok=modal.querySelector('.pdOkSheet:not([data-pdfx])');if(ok){ok.dataset.pdfx='1';setTimeout(confeti,120)}}).observe(modal,{childList:true,subtree:true});
})();
