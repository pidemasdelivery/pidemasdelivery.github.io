(function(){
  /* "Ver en el mapa" se abre dentro de la tienda; el botón atrás del celular lo cierra y vuelve a la tienda */
  function cerrar(){var m=document.getElementById('pdVerMapa');if(m)m.remove();document.documentElement.style.overflow=''}
  function abrir(url,q){
    cerrar();
    var m=document.createElement('div');m.id='pdVerMapa';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
    m.innerHTML='<div class="vmTop"><div><small>Tu ubicación</small><strong>Mapa</strong></div><button type="button" class="pdCerrarX" data-a="x" aria-label="Cerrar">×</button></div>'+
      '<iframe title="Mapa" loading="eager" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q='+encodeURIComponent(q)+'&z=17&output=embed"></iframe>'+
      '<div class="vmFoot"><a href="'+url+'" target="_blank" rel="noopener">Abrir en Google Maps</a></div>';
    m.querySelector('.pdCerrarX').addEventListener('click',cerrar);
    document.body.appendChild(m);document.documentElement.style.overflow='hidden';
  }
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[href^="https://www.google.com/maps?q="]');
    if(!a||a.closest('#pdVerMapa'))return;
    e.preventDefault();e.stopPropagation();
    var href=a.getAttribute('href'),q=decodeURIComponent(href.split('q=')[1]||'');
    abrir(href,q);
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.getElementById('pdVerMapa'))cerrar()});
})();
