(function(){
  async function render(){
    const box=document.getElementById('pdActiveOrder');if(!box)return;
    /* Solo mostrar el pedido en curso si hay sesión de Google activa */
    try{const {data}=await sb.auth.getSession();if(!data?.session?.user){box.hidden=true;return;}}catch(e){box.hidden=true;return;}
    let o=null;try{o=typeof getLastOrder==='function'?getLastOrder():null;}catch(e){}
    const st=String(o?.estado||'').toLowerCase();
    if(!o||!o.id||st==='entregado'||st==='cancelado'){box.hidden=true;return;}
    const idx=typeof trackingIndex==='function'?trackingIndex(st):0;
    const bars=[0,1,2,3,4,5].map(n=>`<span class="${n<=idx?'on':''}"></span>`).join('');
    const neg=(typeof getRestaurantNameById==='function'&&getRestaurantNameById(o.negocio_id))||'';
    box.innerHTML=`<span class="pdAoTop"><span class="pdKicker">Pedido en curso</span><span class="pdPill">${typeof trackingLabel==='function'?trackingLabel(st):''}</span></span><span class="pdAoCode">#${String(o.id).slice(0,8).toUpperCase()}${neg?' · '+String(neg).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])):''}</span><span class="pdBars">${bars}</span><span class="pdAoLink">Ver seguimiento →</span>`;
    box.hidden=false;
  }
  window.pdRenderActiveOrder=render;
  setTimeout(function(){try{sb.auth.onAuthStateChange(function(){setTimeout(render,0)})}catch(e){}},800);
  async function tick(){try{if(typeof refreshLastOrderTracking==='function')await refreshLastOrderTracking();}catch(e){}render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(tick,600),{once:true});else setTimeout(tick,600);
  setInterval(()=>{if(!document.hidden)tick();},20000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  window.addEventListener('storage',render);
})();
