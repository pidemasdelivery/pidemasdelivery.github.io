(function(){
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const escH=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function itemsHtml(){
    return cart.map((x,i)=>`<div class="pdCkItem"><div class="pdCkItemTxt"><strong>${escH(x.nombre)}</strong><span>${(window.pdCatItem&&pdCatItem(x))?escH(pdCatItem(x))+' · ':''}${money(x.precio)} c/u</span></div><div class="pdCkStep"><button type="button" aria-label="Quitar uno" data-ck-step="-1" data-ck-i="${i}">−</button><span>${Number(x.cantidad||0)}</span><button type="button" aria-label="Agregar uno" data-ck-step="1" data-ck-i="${i}">+</button></div></div>`).join('');
  }
  function refreshSummary(){
    const box=document.getElementById('pdCkSummary');if(!box)return;
    const sub=getCartTotal(),dsc=window.pdDescMonto?window.pdDescMonto():0,dOrig=Number(currentDeliveryCost||0),del=getDiscountedDeliveryCost(dOrig),disc=Math.max(0,dOrig-del),tot=sub+dsc+del;
    const km=Number(currentDeliveryDistanceKm);
    const pay=document.getElementById('cPago')?.value;
    const cambio=document.getElementById('cCambio')?.textContent||'';
    const monto=Number(document.getElementById('cMontoPago')?.value);
    box.innerHTML=`<div class="pdLine"><span>Subtotal</span><span>${money(sub)}</span></div>
      ${window.pdDescLineas?window.pdDescLineas(money):''}
      <div class="pdLine"><span>Delivery${Number.isFinite(km)&&km>0?' · '+km.toFixed(1)+' km':''}</span><span>${dOrig>0?money(dOrig):'Por calcular'}</span></div>
      ${disc>0?`<div class="pdLine"><span>Descuento</span><span>− ${money(disc)}</span></div>`:''}
      ${pay==='efectivo'&&Number.isFinite(monto)&&monto>0?`<div class="pdLine"><span>Pagas con · tu cambio</span><strong>${money(monto)} · ${escH(cambio)}</strong></div>`:''}
      <div class="pdTotal"><span>Total a pagar</span><strong>${money(tot)}</strong></div>`;
    const btn=document.querySelector('#modal .sheet button.primary[onclick*="submitCartOrder"]');
    if(btn&&!btn.disabled&&!/Enviando/i.test(btn.textContent))btn.innerHTML=`<span>Confirmar pedido</span><span>${money(tot)}</span>`;
  }
  window.pdRefreshCheckoutSummary=refreshSummary;
  function enhance(){
    const modal=document.getElementById('modal');const nombre=document.getElementById('cNombre');
    if(!modal||!nombre)return;const sheet=nombre.closest('.sheet');if(!sheet||sheet.dataset.pdCk)return;
    sheet.dataset.pdCk='1';sheet.classList.add('pdCheckout');
    const h2=sheet.querySelector('.sheetTop h2');if(h2)h2.textContent='Tu pedido';
    const top=sheet.querySelector('.sheetTop');
    const items=document.createElement('div');items.className='pdCkBlock';items.id='pdCkItems';
    items.innerHTML=`<div class="pdKicker">Productos</div><div id="pdCkList">${itemsHtml()}</div>`;
    top.insertAdjacentElement('afterend',items);
    try{window.pdDescMontar&&window.pdDescMontar(items)}catch(e){console.warn('[Pidemás] descartables',e)}
    const k1=document.createElement('div');k1.className='pdKicker pdCkKicker';k1.textContent='Datos de entrega';
    nombre.closest('.field').insertAdjacentElement('beforebegin',k1);
    const sel=document.getElementById('cPago');const selField=sel?.closest('.field');
    if(selField){
      const k2=document.createElement('div');k2.className='pdKicker pdCkKicker';k2.textContent='Pago';
      const disc=document.getElementById('cDiscountCode')?.closest('.field');
      (disc||selField).insertAdjacentElement('beforebegin',k2);
      selField.classList.add('pdCkPayField');sel.classList.add('pdCkHiddenSelect');
      const seg=document.createElement('div');seg.className='pdCkSeg';seg.setAttribute('role','group');seg.setAttribute('aria-label','Método de pago');
      seg.innerHTML=[...sel.options].filter(o=>o.value).map(o=>`<button type="button" data-pay="${escH(o.value)}" aria-pressed="${sel.value===o.value}">${escH(o.textContent)}</button>`).join('');
      sel.insertAdjacentElement('afterend',seg);
      seg.addEventListener('click',e=>{const b=e.target.closest('[data-pay]');if(!b)return;sel.value=b.dataset.pay;seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));sel.dispatchEvent(new Event('change',{bubbles:true}));refreshSummary();});
    }
    // Evitar montos repetidos en la caja de efectivo: el resumen general los muestra.
    ['cMontoSubtotal','cMontoDelivery','cMontoPedido'].forEach(id=>{const el=document.getElementById(id);if(el){el.style.display='none';const lab=el.previousElementSibling;if(lab)lab.style.display='none';}});
    const btn=sheet.querySelector('button.primary[onclick*="submitCartOrder"]');
    if(btn){
      const sum=document.createElement('div');sum.className='pdPayBox pdCkSummary';sum.id='pdCkSummary';
      btn.insertAdjacentElement('beforebegin',sum);
      const wrap=document.createElement('div');wrap.className='pdCkSubmit';btn.insertAdjacentElement('beforebegin',wrap);wrap.appendChild(btn);
    }
    items.addEventListener('click',e=>{
      const b=e.target.closest('[data-ck-step]');if(!b)return;
      const i=Number(b.dataset.ckI),d=Number(b.dataset.ckStep);const it=cart[i];if(!it)return;
      if(d>0){const p=(typeof products!=='undefined'?products:[]).find(x=>String(x.id)===String(it.id)&&x.origen===it.origen);const st=Number(p?.stock);if(Number.isFinite(st)&&st>=0&&it.cantidad+1>st){toast('No hay suficiente stock disponible de este producto.');return;}}
      it.cantidad+=d;if(it.cantidad<=0)cart.splice(i,1);
      saveCart();updateCart();
      if(!cart.length){closeModal();toast('Tu carrito está vacío.');return;}
      document.getElementById('pdCkList').innerHTML=itemsHtml();
      updatePaymentAmounts();
    });
    refreshSummary();
  }
  function wrap(name,after){const f=window[name];if(typeof f!=='function'||f.__pdWrapped)return;const w=function(){const r=f.apply(this,arguments);try{after();}catch(e){console.warn(e)}return r;};w.__pdWrapped=true;window[name]=w;}
  function install(){
    wrap('openCheckout',enhance);
    wrap('updatePaymentAmounts',refreshSummary);
    wrap('updateCashChange',refreshSummary);
    wrap('renderDeliveryBox',refreshSummary);
  }
  install();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
})();
