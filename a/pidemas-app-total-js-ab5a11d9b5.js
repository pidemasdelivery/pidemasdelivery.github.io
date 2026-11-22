(function(){
  if(window.__pdAppTotal)return;window.__pdAppTotal=true;
  var SEL='.carta-modal-overlay,#pdGoogleAuthOverlay,#pdmpMapa,#ppCerrado,#ppSlots';
  function abrir(el){if(!el||el.__pdOp)return;el.__pdOp=1;el.classList.add('pd-opening');setTimeout(function(){el.classList.remove('pd-opening');el.__pdOp=0},420)}
  /* Ventana principal (#modal): anima solo cuando pasa de cerrada a abierta, no al redibujarse */
  var modal=document.getElementById('modal');
  if(modal){var was=!modal.classList.contains('hidden');new MutationObserver(function(){var now=!modal.classList.contains('hidden');if(now&&!was)abrir(modal);was=now}).observe(modal,{attributes:true,attributeFilter:['class']})}
  /* Pantallas que se crean al abrirse (carta, cuenta, mapa, cerrado, programar) */
  new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1&&n.matches&&n.matches(SEL))abrir(n)})})}).observe(document.body,{childList:true});
  /* Barra inferior: la pestaña tocada se marca; al cerrar la ventana vuelve a Inicio */
  var nav=document.querySelector('.bottom nav');
  if(nav){
    var bs=function(){return nav.querySelectorAll('.navbtn')};
    var marcar=function(b){bs().forEach(function(x){x.classList.toggle('active',x===b)})};
    nav.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.navbtn');if(b)marcar(b)});
    var ult=0;nav.addEventListener('click',function(){ult=Date.now()});
    var abierta=function(){return (modal&&!modal.classList.contains('hidden'))||document.body.classList.contains('pc-abierto')||!!document.querySelector('.carta-modal-overlay,#ppSlots,#pdmpMapa')};
    setInterval(function(){if(Date.now()-ult<1200||abierta())return;var f=bs()[0];if(f&&!f.classList.contains('active'))marcar(f)},700);
  }
  /* En celulares: sin menú de "mantener presionado" sobre imágenes y botones */
  if(document.documentElement.classList.contains('pd-touch')){
    document.addEventListener('contextmenu',function(e){var t=e.target;if(t&&/^(INPUT|TEXTAREA)$/.test(t.tagName))return;e.preventDefault()});
  }
})();
