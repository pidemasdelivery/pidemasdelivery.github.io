(function(){
  /* Las ventanas solo se cierran con la X: tocar el fondo no hace nada */
  var FONDOS='#modal,.carta-modal-overlay,#pdGoogleAuthOverlay,#modal .bg,.pdOverlay';
  function esFondo(t){return t&&t.matches&&t.matches(FONDOS)}
  ['click','pointerup','mouseup','touchend'].forEach(function(ev){
    document.addEventListener(ev,function(e){
      if(esFondo(e.target)){e.stopImmediatePropagation();e.preventDefault()}
    },true);
  });
  /* Sin zoom: pellizcar, doble toque, gestos de Safari y Ctrl+rueda */
  ['gesturestart','gesturechange','gestureend'].forEach(function(ev){document.addEventListener(ev,function(e){e.preventDefault()},{passive:false})});
  document.addEventListener('touchmove',function(e){if(e.touches&&e.touches.length>1&&e.cancelable)e.preventDefault()},{passive:false,capture:true});
  var ult=0;
  document.addEventListener('touchend',function(e){var n=Date.now();if(n-ult<350&&e.cancelable&&!(e.target.closest&&e.target.closest('input,textarea,select,a,button,label')))e.preventDefault();ult=n},{passive:false});
  document.addEventListener('wheel',function(e){if(e.ctrlKey)e.preventDefault()},{passive:false});
  document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&(e.key==='+'||e.key==='-'||e.key==='='||e.key==='0'))e.preventDefault()});
  /* Sin recargar al arrastrar hacia abajo (en la página y en las ventanas) */
  var y0=0,x0=0;
  document.addEventListener('touchstart',function(e){if(e.touches.length===1){y0=e.touches[0].clientY;x0=e.touches[0].clientX}},{passive:true,capture:true});
  document.addEventListener('touchmove',function(e){
    if(e.touches.length!==1)return;
    var t=e.target;if(!t||!t.closest)return;
    var dy=e.touches[0].clientY-y0,dx=e.touches[0].clientX-x0;
    if(Math.abs(dx)>Math.abs(dy))return; /* gesto horizontal: carruseles y chips siguen funcionando */
    if(t.closest('input,textarea,select,[contenteditable="true"],iframe,.leaflet-container'))return;
    var sc=t,ok=false;
    while(sc&&sc!==document.documentElement){
      var cs=getComputedStyle(sc);
      if(/(auto|scroll)/.test(cs.overflowY)&&sc.scrollHeight>sc.clientHeight+1){
        if(dy>0&&sc.scrollTop>0)ok=true;
        if(dy<0&&sc.scrollTop+sc.clientHeight<sc.scrollHeight-1)ok=true;
        if(ok)break;
      }
      sc=sc.parentElement;
    }
    if(!ok){
      var se=document.scrollingElement||document.documentElement;
      if(dy>0&&se.scrollTop>0&&!t.closest('#modal,.carta-modal-overlay,#pdGoogleAuthOverlay'))ok=true;
      if(dy<0&&se.scrollTop+se.clientHeight<se.scrollHeight-1&&!t.closest('#modal,.carta-modal-overlay,#pdGoogleAuthOverlay'))ok=true;
    }
    /* Solo se bloquea el jalón hacia abajo estando arriba del todo (evita recargar). Nunca se bloquea el scroll normal. */
    /* El jalón hacia abajo ya no se bloquea por JS: lo evita overscroll-behavior-y en el CSS final, así el scroll nunca se corta. */
  },{passive:false,capture:true});
})();
