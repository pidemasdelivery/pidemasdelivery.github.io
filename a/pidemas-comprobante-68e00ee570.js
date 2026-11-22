window.pdCompSel=function(t){
  var v=document.getElementById('cCompTipo');
  /* Tocar de nuevo el que ya está marcado lo desmarca: sin comprobante */
  if(v&&v.value===t&&t!=='ninguno')t='ninguno';
  if(v)v.value=t;
  var hint=document.getElementById('cCompNota');if(hint)hint.textContent=t==='ninguno'?'¿Necesitas boleta o factura? Elige una. Si no, déjalo sin marcar.':'Toca otra vez para quitarlo. El negocio emitirá el comprobante con estos datos.';
  document.querySelectorAll('#cCompBox .compOpt').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-comp')===t)});
  var bo=document.getElementById('cCompBoleta'),fa=document.getElementById('cCompFactura');
  if(bo)bo.classList.toggle('hidden',t!=='boleta');
  if(fa)fa.classList.toggle('hidden',t!=='factura');
};
document.addEventListener('input',function(e){var id=e.target&&e.target.id;if(id==='cCompDni'||id==='cCompRuc')e.target.value=e.target.value.replace(/\D/g,'')});
/* Pone el bloque de comprobante como tarjeta propia, justo después de "Pago" */
function pdCompTarjeta(){
  var box=document.getElementById('cCompBox');if(!box)return;
  var cards=document.querySelector('.ckCards');if(!cards||box.closest('.ckCard'))return;
  var sec=document.createElement('section');sec.className='ckCard';
  sec.innerHTML='<div class="ckHead"><i><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg></i><b>Comprobante</b></div>';
  var lab=box.querySelector(':scope>label');if(lab)lab.remove();
  sec.appendChild(box);cards.appendChild(sec);
}
new MutationObserver(function(){try{pdCompTarjeta()}catch(e){}}).observe(document.documentElement,{childList:true,subtree:true});
