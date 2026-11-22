/* Horario general de Pidemás: atención 9:00 am – 10:00 pm, último pedido 9:30 pm (hora de Lima). */
(function(){
  if(window.__pdHorarioGlobal)return; window.__pdHorarioGlobal=true;
  var H=window.PD_HORARIO={abre:9*60,ultimoPedido:21*60+30,cierra:22*60,aviso:21*60};
  function limaMin(){
    try{var p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
      var h=+p.find(function(x){return x.type==='hour'}).value%24, m=+p.find(function(x){return x.type==='minute'}).value; return h*60+m;}
    catch(e){var d=new Date();return d.getHours()*60+d.getMinutes();}
  }
  function abiertoGeneral(min){min=(min==null?limaMin():min);return min>=H.abre&&min<H.ultimoPedido;}
  window.pdServicioAbierto=abiertoGeneral;

  // Recorta el horario de cada negocio a la ventana general de Pidemás.
  if(typeof window.getDailySchedule==='function'){
    var orig=window.getDailySchedule;
    window.getDailySchedule=function(horario,date){
      var r=orig.apply(this,arguments); if(!r)return r;
      var open=r.open, close=r.close;
      if(open===close){open=H.abre;close=H.ultimoPedido;}
      else if(open>close){close=H.ultimoPedido;}            // horario que cruza la medianoche
      open=Math.max(open,H.abre); close=Math.min(close,H.ultimoPedido);
      if(open>=close)return null;
      var out={}; for(var k in r)out[k]=r[k]; out.open=open; out.close=close; return out;
    };
  }

  function msgCerrado(){if(window.pdHorarioMsgCerrado)return window.pdHorarioMsgCerrado();return 'Pidemás recibe pedidos de 9:00 a. m. a 9:30 p. m. Vuelve '+(limaMin()<H.abre?'hoy':'mañana')+' desde las 9:00 a. m.';}
  function bloquear(){
    if(abiertoGeneral()||window.__pdProg)return false;
    if(typeof window.mostrarAvisoHorario==='function')window.mostrarAvisoHorario(msgCerrado());
    else if(typeof window.toast==='function')window.toast(msgCerrado());
    return true;
  }
  ['openCheckout','submitCartOrder'].forEach(function(fn){
    var f=window[fn]; if(typeof f!=='function')return;
    window[fn]=function(){ if(bloquear())return; return f.apply(this,arguments); };
  });

  function barra(){
    var bar=document.getElementById('pdHorarioBar');
    if(!bar){bar=document.createElement('div');bar.id='pdHorarioBar';bar.setAttribute('role','status');var hd=document.querySelector('header')||document.body;hd.appendChild(bar);}
    var m=limaMin();
    if(!abiertoGeneral(m)){bar.className='show closed';bar.innerHTML='<span class="pdHDot"></span><span>'+(window.pdHorarioBarraCerrado?window.pdHorarioBarraCerrado():'Cerrado · pedidos de 9:00 a. m. a 9:30 p. m.')+'</span>';}
    else if(m>=H.aviso){var f=H.ultimoPedido-m;bar.className='';bar.innerHTML='';
      /* Aviso «Pidemás cierra pronto» con el mismo diseño de «[negocio] cierra pronto»: al entrar y a los 15, 10 y 5 min */
      if(!window.__pdProg&&typeof window.mostrarAvisoHorario==='function'){
        var prev=window.__pdAvisoCierre;
        if(prev==null||[15,10,5].some(function(t){return f<=t&&prev>t;}))window.mostrarAvisoHorario('Pidemás cerrará en '+f+' min');
        window.__pdAvisoCierre=f;
      }
    }
    else{bar.className='';bar.innerHTML='';}
  }
  var estado=abiertoGeneral();
  function tick(){
    barra();
    var ahora=abiertoGeneral();
    if(ahora!==estado){estado=ahora;try{if(typeof window.refreshRestaurantStatuses==='function')window.refreshRestaurantStatuses();}catch(e){}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();
  setInterval(tick,30000);
})();
