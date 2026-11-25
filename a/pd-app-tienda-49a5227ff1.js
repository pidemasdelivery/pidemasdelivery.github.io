/* ===== Pidemás · Tienda · app nueva =====
   Inicio, carta del negocio, producto, tu pedido (con los datos de entrega y pago), mis pedidos y seguimiento
   como páginas completas dentro de una caja aislada (Shadow DOM), con el mismo diseño de las apps del
   motorizado, el negocio y el admin. Usa los datos y las acciones de la tienda de siempre: el carrito, la
   tarifa, los descartables, los descuentos y el envío del pedido siguen siendo los mismos. */
(function(){
  if(window.__pdAppTienda||!window.PdPasos)return;window.__pdAppTienda=1;
  const U=PdPasos.util,E=U.E,M=U.money;
  const $=id=>document.getElementById(id);
  const R=()=>{try{return Array.isArray(restaurants)?restaurants:[]}catch(e){return []}};
  const PR=()=>{try{return Array.isArray(products)?products:[]}catch(e){return []}};
  const CART=()=>{try{return Array.isArray(cart)?cart:[]}catch(e){return []}};
  const SB=()=>{try{return sb}catch(e){return null}};
  const SES=()=>{try{return pdClienteSesion||null}catch(e){return null}};
  const est=o=>String(o?.estado||'').toLowerCase().trim();
  const FIN=['entregado','cancelado','anulado','rechazado'];
  const S=d=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  const IC={
    home:S('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),search:S('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    box:S('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 9h16M10 13h4"/>'),user:S('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    cart:S('<path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>'),
    pin:S('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    back:S('<path d="m15 6-6 6 6 6"/>'),chev:S('<path d="m9 6 6 6-6 6"/>'),plus:S('<path d="M12 5v14M5 12h14"/>'),minus:S('<path d="M5 12h14"/>'),
    heart:S('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    clock:S('<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>'),map:S('<path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/>'),
    gps:S('<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>'),
    check:S('<path d="m5 12 5 5 9-10"/>'),trash:S('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    all:S('<path d="M4 6h16M4 12h16M4 18h16"/>'),store:S('<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>'),
    star:S('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),wa:S('<path d="M4 20l1.5-4A8 8 0 1 1 8 19z"/>')
  };
  const ESTILO=PdPasos.css+`
:host{z-index:2147482000}
.app{animation:none}
.hd{background:#FFFFFF;border-bottom:1px solid #F1E4DA;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 14px;display:flex;align-items:center;gap:12px;flex:0 0 auto}
.ib{position:relative;width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer}
.bd{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#C4410C;color:#FFFFFF;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-sizing:border-box}
.ava{flex:0 0 48px;width:48px;height:48px;border-radius:50%;background:#FDEBDF center/cover no-repeat;color:#C4410C;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}
.dsp{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA}
.dsp .pt{flex:0 0 12px;width:12px;height:12px;border-radius:50%;background:#15803D;box-shadow:0 0 0 5px rgba(21,128,61,.15)}
.dsp.off .pt{background:#A8988C;box-shadow:0 0 0 5px rgba(168,152,140,.18)}
.dsp .bt{height:40px;padding:0 12px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;cursor:pointer}
.dsp .bt svg{color:#C4410C;width:18px;height:18px}
.oc{display:block;width:100%;text-align:left;color:#1F1A17;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:10px}
.oc.a{border:1.5px solid #C4410C;box-shadow:0 6px 18px rgba(196,65,12,.10)}
.oc .r1{display:flex;align-items:center;gap:8px}.oc .r1 b{font-size:17px}.oc .r1 small{font-size:12px;font-weight:700;color:#6B5E55;text-transform:uppercase;letter-spacing:.05em}.oc .r1 em{margin-left:auto;font-style:normal;font-size:18px;font-weight:800;color:#1F1A17}
.oc .pls{display:flex;gap:8px;flex-wrap:wrap}
.pl{display:inline-flex;align-items:center;height:28px;padding:0 10px;border-radius:999px;background:#FDEBDF;color:#9A330A;font-size:13px;font-weight:800}
.pl.n{background:#FFFFFF;border:1px solid #F1E4DA;color:#1F1A17;font-weight:700}.pl.g{background:#E9F6EE;color:#0F5E2E}
.oc .bars{display:grid;gap:6px}
.oc .ad{display:flex;gap:10px;align-items:flex-start}.oc .ad svg{color:#C4410C;flex:0 0 20px;width:20px;height:20px}.oc .ad b{display:block;font-size:15px}.oc .ad span{font-size:14px;color:#6B5E55}
.kick{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#C4410C}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mt{text-align:left;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;flex-direction:column;gap:4px;color:#1F1A17;cursor:pointer}
.mt span{font-size:13px;font-weight:600;color:#6B5E55}.mt b{font-size:24px;color:#1F1A17}.mt small{font-size:12px;color:#6B5E55}
.tl{display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;color:#1F1A17;cursor:pointer;width:100%;text-align:left}
.tl .ic{flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center}
.tl .tx{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:2px}.tl .tx b{font-size:16px}.tl .tx span{font-size:13px;color:#6B5E55}
.tl>svg{color:#6B5E55;flex:0 0 auto}
.seg{display:grid;gap:4px;padding:4px;border-radius:14px;background:#F6EFE9}
.seg button{height:40px;border-radius:10px;border:0;background:transparent;color:#6B5E55;font-size:14px;font-weight:600;cursor:pointer}
.seg button.on{background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.10);color:#1F1A17;font-weight:800}
.vac{padding:28px 16px;text-align:center;color:#6B5E55;font-size:15px;border-radius:18px;border:1px dashed #E3CFC2;background:#FFFFFF}
.nv{flex:0 0 auto;display:flex;background:#FFFFFF;border-top:1px solid #F1E4DA;padding:2px 6px calc(env(safe-area-inset-bottom,0px) + 8px)}
.nv button{position:relative;flex:1 1 0%;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0 4px;border:0;background:transparent;color:#6B5E55;font-size:12px;font-weight:600;cursor:pointer}
.nv button span.i{width:52px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center}
.nv button.on{color:#C4410C;font-weight:800}.nv button.on span.i{background:#FDEBDF}
.nv .bd{top:2px;right:calc(50% - 26px)}
.gps{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:14px;background:#FDE8E8;color:#9B1C1C;font-size:14px;font-weight:700}
.gps button{margin-left:auto;height:36px;padding:0 12px;border-radius:10px;border:0;background:#C4410C;color:#FFFFFF;font-weight:800;cursor:pointer}

.back2{width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer}
.fld{display:flex;flex-direction:column;gap:6px}.fld label{font-size:14px;font-weight:700}
.fld input,.fld select{width:100%;height:54px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:0 16px;font:600 16px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;outline:none;box-sizing:border-box;-webkit-appearance:none;appearance:none}
.fld input:focus,.fld select:focus{border-color:#C4410C}
.mv{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #F1E4DA}.mv:last-child{border-bottom:0}
.mv .ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.mv .tx{flex:1 1 0%;min-width:0}.mv .tx b{display:block;font-size:15px;overflow-wrap:anywhere}.mv .tx span{font-size:13px;color:#6B5E55}
.mv .am{font-size:16px;font-weight:800;white-space:nowrap}
.g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.kp{padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;flex-direction:column;gap:2px}
.kp span{font-size:13px;color:#6B5E55;font-weight:600}.kp b{font-size:22px}.kp small{font-size:12px;color:#6B5E55}
.cd{background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px}
.cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.slc{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}.slc>small{text-align:center;font-size:12px;font-weight:800;color:#6B5E55;padding:2px 0}.slc>div{min-height:60px;height:auto;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 1px;font:inherit;min-width:0}.slc>div b{font-size:17px;font-weight:800;line-height:1.1}.slc>div small{font-size:10px;font-weight:700;color:#6B5E55;line-height:1.1;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.slc>div em{font-style:normal;font-size:9px;font-weight:800;color:#9A330A;background:#FDEBDF;border-radius:6px;padding:1px 3px;max-width:100%;overflow:hidden;white-space:nowrap}.slc .trabajado,.slc .ajuste{background:#E9F6EE;border-color:#CDEBD7}.slc .trabajado small,.slc .ajuste small{color:#0F5E2E}.slc .descanso{background:#FFF4EC;border-color:#F6D9C4}.slc .descanso small{color:#9A330A}.slc .falta{background:#FDE8E8;border-color:#F4C7C3}.slc .falta small,.slc .falta b{color:#9B1C1C}.slc .hoy{border:2px solid #C4410C}.slc .hoy small{color:#C4410C}.slc .libre,.slc .antes,.slc .dia31,.slc .ajusteFuturo{background:#F6EFE9;color:#9C8F86}.slc .adel{box-shadow:inset 0 0 0 2px #15803D}.slc>div{position:relative}.slc .vacp{background:#EAF1FE;border-color:#C9DBFB}.slc .vacp small,.slc .vacp b{color:#1D4ED8}.slc .vacn small{color:#9B1C1C}
.cal div{display:flex;flex-direction:column;align-items:center;gap:3px}.cal small{font-size:11px;color:#6B5E55;font-weight:700}
.cal i{width:100%;max-width:40px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px;font-weight:800;background:#F6EFE9;color:#6B5E55}
.cal i.t{background:#E9F6EE;color:#0F5E2E}.cal i.r{background:#FDEBDF;color:#9A330A}.cal i.f{background:#FDE8E8;color:#9B1C1C}.cal i.h{background:#FFFFFF;border:1.5px solid #C4410C;color:#C4410C}
.ley{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:#6B5E55}
.bar{height:10px;border-radius:999px;background:#F6EFE9;overflow:hidden}.bar s{display:block;height:100%;background:#C4410C;border-radius:999px}
.stars{color:#C4410C;letter-spacing:2px;font-size:16px}
.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.stop{display:flex;gap:12px;align-items:center;padding:12px 14px;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:16px}
.stop .n{flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;background:#C4410C;color:#FFFFFF}
.stop .tg{display:inline-flex;height:22px;align-items:center;padding:0 8px;border-radius:999px;font-size:12px;font-weight:800}
.ph{display:flex;gap:14px;align-items:center;padding:16px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA}
.ph .ava{flex:0 0 64px;width:64px;height:64px;font-size:26px}
.chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
.chips button{flex:0 0 auto;height:38px;padding:0 14px;border-radius:999px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:700;cursor:pointer}
.chips button.on{border:0;background:#C4410C;color:#FFFFFF}
.av2{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;text-align:left;width:100%;color:#1F1A17}
.av2 .ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#FDEBDF;color:#C4410C}
.av2 .tx{flex:1 1 0%;min-width:0}.av2 .tx b{display:block;font-size:15px}.av2 .tx span{display:block;font-size:14px;color:#6B5E55;margin-top:2px;line-height:1.4}.av2 .tx small{display:block;font-size:12px;color:#6B5E55;margin-top:6px;font-weight:600}
.av2 .pt{flex:0 0 10px;width:10px;height:10px;border-radius:50%;background:#C4410C;margin-top:6px}
.list{scrollbar-width:none}.list::-webkit-scrollbar{display:none}
.opt span{font-size:13px;color:#6B5E55}
.msgok{padding:10px 12px;border-radius:12px;background:#E9F6EE;color:#0F5E2E;font-size:14px;font-weight:700}
.load{padding:56px 24px 24px;text-align:center;color:#6B5E55;font-size:15px;display:flex;flex-direction:column;align-items:center;gap:14px} .eq{display:block;width:38px;height:38px;border-radius:50%;border:4px solid rgba(0,0,0,.1);border-top-color:#C4410C;box-sizing:border-box;animation:pdEqGira .8s linear infinite} @keyframes pdEqGira{to{transform:rotate(360deg)}}
`+`
:host{z-index:2147482000}
.app{animation:none}
.list{scrollbar-width:none}.list::-webkit-scrollbar{display:none}
.hd{background:#FFFFFF;border-bottom:1px solid #F1E4DA;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px 12px;display:flex;flex-direction:column;align-items:stretch;gap:12px;flex:0 0 auto}
.hrow{display:flex;align-items:center;gap:10px}
.dir{flex:1 1 0%;min-width:0;display:flex;align-items:center;gap:10px;border:0;background:transparent;padding:0;text-align:left;cursor:pointer;color:#1F1A17;font:inherit}
.dir .pi{width:44px;height:44px;border-radius:14px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.dir .tx{display:flex;flex-direction:column;min-width:0}
.dir .tx small{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55}
.dir .tx b{font-size:17px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ib{position:relative;width:48px;height:48px;flex:0 0 48px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer;text-decoration:none}
.ib.on{color:#C4410C;background:#FFF4EC;border-color:#F6D9C4}
.top .row>.ib[data-a]:first-child{width:44px;height:44px;flex:0 0 44px;border:0;background:#C4410C;color:#FFFFFF;box-shadow:0 4px 12px rgba(196,65,12,.28)}
.top .kick{color:#6B5E55;font-weight:800}
.top .h1{font-size:18px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hero{position:relative}.hero>.fav{position:absolute;top:10px;right:10px}.hero .tx{padding-right:30px}
.bd{position:absolute;top:-6px;right:-6px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#C4410C;color:#FFFFFF;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-sizing:border-box}
.srch{display:flex;align-items:center;gap:10px;height:50px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFF9F5;padding:0 14px;color:#6B5E55;box-sizing:border-box}
.srch input{flex:1 1 0%;min-width:0;border:0;background:transparent;outline:none;font:500 16px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;height:100%;padding:0}
.srch.w{background:#FFFFFF}
.sec{display:flex;align-items:baseline;justify-content:space-between;margin-top:4px}
.sec h2{margin:0;font-size:22px;font-weight:800}
.sec span{font-size:14px;color:#6B5E55;font-weight:600}
.chsBar{position:sticky;top:-16px;z-index:6;background:#FFF9F5;margin:0 -16px;padding:20px 16px 8px;box-shadow:0 6px 10px -8px rgba(31,26,23,.18)}
.catH{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 0 2px;padding:12px 14px;border-radius:16px;background:#FFFFFF;border:1px solid #F1E4DA;border-left:5px solid #C4410C;scroll-margin-top:72px}.catN{font-size:19px;font-weight:800;color:#1F1A17;line-height:1.2;overflow-wrap:anywhere}.catC{flex:0 0 auto;font-size:12.5px;font-weight:800;color:#9A330A;background:#FDEBDF;border-radius:999px;padding:5px 10px}
.lbl2{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55}
.cats{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px}.cats::after{content:'';flex:0 0 var(--fin,0px)}
.cats::-webkit-scrollbar{display:none}
.cats button{flex:0 0 84px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px;border-radius:16px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;cursor:pointer;font:inherit}
.cats button span{font-size:12px;font-weight:700;line-height:1.15;text-align:center}
.cats button svg{color:#C4410C;width:26px;height:26px}
.cats button.on{border:1.5px solid #C4410C;background:#FFF4EC}
.cats button.on span{font-weight:800}
.ng{display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;text-align:left;cursor:pointer;font:inherit;width:100%;box-sizing:border-box}
.ng.off{background:#FFFCFA}
.lg{width:60px;height:60px;border-radius:16px;background:#FFF4EC center/cover no-repeat;border:1px solid #F1E4DA;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#C4410C;flex:0 0 auto;box-sizing:border-box}
.lg.big{width:68px;height:68px;border-radius:18px;background-color:#FFFFFF}
.ng .tx{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:4px}
.ng .tx b{font-size:17px;font-weight:800}
.ng .tx span{font-size:14px;color:#6B5E55}
.ng>svg{color:#A8988C;flex:0 0 auto}
.st{align-self:flex-start;display:inline-block;line-height:26px;height:26px;padding:0 10px;border-radius:999px;font-size:13px;font-weight:800;white-space:nowrap;max-width:100%;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis}
.st.on{background:#E9F6EE;color:#0F5E2E}.st.warn{background:#FFF4EC;color:#9A330A}.st.off{background:#F6EFE9;color:#6B5E55}
.fav{width:40px;height:40px;border-radius:12px;border:0;background:transparent;color:#A8988C;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex:0 0 auto}
.fav.on{color:#C4410C}.fav.on svg{fill:#C4410C}
.curso{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:18px;border:1.5px solid #C4410C;background:#FFFFFF;color:#1F1A17;text-align:left;cursor:pointer;font:inherit;width:100%;box-sizing:border-box}
.bar5{display:grid;gap:6px}.bar5 i{height:6px;border-radius:999px;background:#EDE2DA}.bar5 i.d{background:#15803D}.bar5 i.c{background:#C4410C}
.hero{padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;gap:14px;align-items:center}
.hero .tx{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:6px}
.hero .tx .st{background:#FFFFFF}
.hero .tx span.m{font-size:14px;color:#6B5E55;font-weight:600}
.lnk{align-self:flex-start;border:0;background:transparent;padding:0;color:#9A330A;font-size:14px;font-weight:800;text-decoration:underline;cursor:pointer;font-family:inherit}
.chs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px}.chs::after,.chsHome::after{content:'';flex:0 0 var(--fin,0px)}
.chs::-webkit-scrollbar{display:none}
.chs button{flex:0 0 auto;height:40px;padding:0 16px;border-radius:999px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.chs button.on{border:0;background:#C4410C;color:#FFFFFF;font-weight:800}
.pc{display:flex;gap:12px;padding:12px;border-radius:18px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;text-align:left;cursor:pointer;font:inherit;width:100%;box-sizing:border-box;position:relative}
.pc.en{border:1.5px solid #C4410C}
.pc .tx{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:4px;padding:2px 0}
.pc .tx b{font-size:16px;font-weight:800;line-height:1.25}
.pc .tx .ds{font-size:14px;color:#6B5E55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pc .tx .pr{font-size:17px;font-weight:800;margin-top:auto}
.pc .tx .pr s{font-size:14px;color:#A8988C;font-weight:600;margin-left:6px}
.pc .ph{position:relative;width:96px;height:96px;flex:0 0 auto}
.pc .ph i{display:block;width:96px;height:96px;border-radius:14px;background:#F6EFE9 center/cover no-repeat}
.pc .ph i.no{display:flex;align-items:center;justify-content:center;color:#C9B9AD}
.pc .ph i.no svg{width:30px;height:30px}
.pc .ad{position:absolute;right:-4px;bottom:-4px;width:38px;height:38px;border-radius:12px;background:#C4410C;color:#FFFFFF;display:flex;align-items:center;justify-content:center;border:3px solid #FFFFFF;cursor:pointer;padding:0;box-sizing:border-box}
.pc .ad svg{width:18px;height:18px;stroke-width:2.8}
.pc .ad.off{background:#A8988C}
.enc{align-self:flex-start;display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:999px;background:#FDEBDF;color:#9A330A;font-size:12px;font-weight:800}
.agot{align-self:flex-start;display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:999px;background:#F6EFE9;color:#6B5E55;font-size:12px;font-weight:800}
.cbar{height:56px;border-radius:16px;background:#C4410C;color:#FFFFFF;border:0;display:flex;align-items:center;gap:12px;padding:0 16px;font:800 16px PdInter,Inter,system-ui,sans-serif;cursor:pointer;width:100%;box-sizing:border-box}
.cbar .n{min-width:30px;height:30px;border-radius:10px;background:#9A330A;display:flex;align-items:center;justify-content:center;font-size:14px}
.cbar .t{flex:1 1 0%;text-align:left}
.cbar.c{justify-content:center}
.cbar:disabled{background:#D9CCC3;cursor:default}
.foto{height:220px;border-radius:22px;background:#F6EFE9 center/cover no-repeat;border:1px solid #F1E4DA;flex:0 0 auto;display:flex;align-items:center;justify-content:center;color:#C9B9AD}
.foto svg{width:44px;height:44px}
.pt1{margin:0;font-size:26px;font-weight:800;line-height:1.15}
.pt2{font-size:24px;font-weight:800;color:#C4410C}
.pt2 s{font-size:16px;color:#A8988C;font-weight:600;margin-left:8px}
.qty{display:flex;align-items:center;gap:6px}
.qty button{width:44px;height:44px;border-radius:14px;border:1px solid #F1E4DA;background:#FFF9F5;color:#1F1A17;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.qty button.o{border:0;background:#C4410C;color:#FFFFFF}
.qty button:disabled{opacity:.4;cursor:default}
.qty b{min-width:36px;text-align:center;font-size:20px;font-weight:800}
.qty.s button{width:36px;height:36px;border-radius:12px}
.qty.s b{min-width:24px;font-size:16px}
.qty.s button svg{width:16px;height:16px}
.sug{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.sug button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px;border-radius:16px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;text-align:left;cursor:pointer;font:inherit;min-width:0}
.sug b{font-size:14px;font-weight:800;line-height:1.2;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.sug span{font-size:13px;color:#6B5E55}
.it{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #F1E4DA}
.it:first-of-type{border-top:0;padding-top:0}
.it .tx{flex:1 1 0%;min-width:0;display:flex;flex-direction:column}
.it .tx b{font-size:15px;font-weight:800}
.it .tx span{font-size:13px;color:#6B5E55}
.it>b{min-width:72px;text-align:right;font-size:15px}
.loc{display:flex;gap:10px;align-items:center;padding:12px;border-radius:14px;background:#FFF4EC}
.loc.on{background:#E9F6EE}
.loc .i{width:40px;height:40px;border-radius:12px;background:#FFFFFF;color:#C4410C;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.loc.on .i{color:#15803D}
.loc .tx{flex:1 1 0%;min-width:0;display:flex;flex-direction:column}
.loc .tx b{font-size:15px}.loc .tx span{font-size:13px;color:#6B5E55}
.pay{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pay button{height:52px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
.pay button.on{border:1.5px solid #C4410C;background:#FFF4EC;font-weight:800}
.ln{display:flex;justify-content:space-between;gap:10px;font-size:15px}
.ln span{color:#6B5E55}
.ln.t{border-top:1px solid #F1E4DA;padding-top:8px}
.ln.t span{color:#1F1A17;font-size:16px;font-weight:800}.ln.t b{font-size:20px}
.ln.g b{color:#15803D}
.sw{display:flex;align-items:center;gap:12px;border:0;background:transparent;padding:0;width:100%;text-align:left;cursor:pointer;font:inherit;color:#1F1A17}
.sw .tx{flex:1 1 0%;font-size:15px;font-weight:700}
.sw i{width:46px;height:28px;border-radius:999px;background:#E3D6CC;position:relative;flex:0 0 auto;transition:background .15s}
.sw i::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .15s}
.sw.on i{background:#C4410C}.sw.on i::after{left:21px}
.cdg{padding:16px;border-radius:22px;background:#FDEBDF;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}
.cdg .cdk{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#9A330A}
.cdg .cdn{font-size:44px;font-weight:800;letter-spacing:.18em}
.cdg .cds{font-size:14px;color:#6B5E55}
.tln{display:flex;flex-direction:column}
.tln .p{display:flex;gap:12px;padding:8px 0}
.tln .p .d{width:28px;height:28px;border-radius:50%;background:#F6EFE9;color:#6B5E55;display:flex;align-items:center;justify-content:center;flex:0 0 auto;font-size:13px;font-weight:800}
.tln .p .d svg{width:16px;height:16px;stroke-width:3}
.tln .p.ok .d{background:#E9F6EE;color:#15803D}
.tln .p.cur .d{background:#C4410C;color:#FFFFFF}
.tln .p .tx{flex:1 1 0%;display:flex;flex-direction:column}
.tln .p .tx b{font-size:15px}.tln .p .tx span{font-size:13px;color:#6B5E55}
.tln .p.cur .tx b{color:#C4410C}.tln .p.no .tx b{color:#6B5E55}
.vivo{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#15803D}
.vivo i{width:8px;height:8px;border-radius:50%;background:#15803D;box-shadow:0 0 0 4px rgba(21,128,61,.15)}
.oc2{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:18px;border:1px solid #F1E4DA;background:#FFFFFF}
.oc2.a{border:1.5px solid #C4410C}
.oc2 .r1{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.oc2 .r1 b{font-size:16px}
.oc2 .r2{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:13px;color:#6B5E55}
.oc2 .r3{font-size:14px;color:#6B5E55}
.gbtn{height:54px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;font-family:inherit;width:100%}
.lnks{display:flex;flex-direction:column}
.lnks button{display:flex;align-items:center;gap:12px;padding:14px 0;border:0;border-top:1px solid #F1E4DA;background:transparent;color:#1F1A17;font:700 15px PdInter,Inter,system-ui,sans-serif;text-align:left;cursor:pointer}
.lnks button:first-child{border-top:0}
.lnks button svg{color:#C4410C}
.lnks button span{flex:1 1 0%}
.lnks button>svg:last-child{color:#A8988C}

/* Pidemás · TIENDA · diseño propio (boceto). Este archivo es SOLO de la tienda: no lo usan motorizado, negocio ni admin.
   Se agrega al final de los estilos, así que manda sobre los estilos compartidos. */
.list button,.list a,.ib,.cbar,.dir,.fav,.chs button,.seg button{transition:transform .14s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease,color .2s ease;-webkit-tap-highlight-color:transparent}
.ng:active,.pc:active,.curso:active,.ib:active,.cbar:active,.dir:active,.chs button:active,.seg button:active,.lnk:active{transform:scale(.97)}
.fav:active,.pc .ad:active{transform:scale(.86)}
@keyframes pdUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.entra .list>*,.entra #tL>*,.entra #tCarta>*{animation:pdUp .5s cubic-bezier(.2,.8,.2,1) both}
.entra .list>*:nth-child(2),.entra #tL>*:nth-child(2),.entra #tCarta>*:nth-child(2){animation-delay:.05s}
.entra .list>*:nth-child(3),.entra #tL>*:nth-child(3),.entra #tCarta>*:nth-child(3){animation-delay:.1s}
.entra .list>*:nth-child(4),.entra #tL>*:nth-child(4),.entra #tCarta>*:nth-child(4){animation-delay:.15s}
.entra .list>*:nth-child(5),.entra #tL>*:nth-child(5),.entra #tCarta>*:nth-child(5){animation-delay:.2s}
.entra .list>*:nth-child(n+6),.entra #tL>*:nth-child(n+6),.entra #tCarta>*:nth-child(n+6){animation-delay:.25s}
@keyframes pdPop{0%{transform:scale(1)}40%{transform:scale(1.32)}100%{transform:scale(1)}}
.pop{animation:pdPop .42s cubic-bezier(.3,1.6,.5,1)}
@keyframes pdPulse{0%{box-shadow:0 0 0 0 rgba(196,65,12,.45)}100%{box-shadow:0 0 0 12px rgba(196,65,12,0)}}
@keyframes pdBlink{0%,100%{opacity:1}50%{opacity:.35}}
.vivo i{animation:pdBlink 1.4s ease-in-out infinite}
.st{gap:6px}.st::before{content:'';display:inline-block;vertical-align:middle;margin:-2px 7px 0 0;width:7px;height:7px;border-radius:50%;flex:0 0 auto}
.st.on::before{background:#16A34A;animation:pdBlink 1.4s ease-in-out infinite}.st.warn::before{background:#E8590C}.st.off::before{background:#A8988C}
.curso{flex-direction:row;align-items:center;gap:14px;background:#FFF1E8;border:1.5px solid #F6CDB3;border-radius:20px}
.curso .ci{width:46px;height:46px;border-radius:14px;background:#C4410C;color:#FFFFFF;display:flex;align-items:center;justify-content:center;flex:0 0 auto;animation:pdPulse 1.8s ease-out infinite}
.curso .ci svg{width:22px;height:22px}
.curso .ct{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:3px}
.curso>svg{color:#9A330A;flex:0 0 auto}
.seg{position:relative}.seg .ind{position:absolute;top:4px;bottom:4px;left:4px;border-radius:10px;background:#FFFFFF;box-shadow:0 2px 6px rgba(31,26,23,.1);transition:transform .34s cubic-bezier(.3,1.3,.5,1);pointer-events:none}
.seg button{position:relative;z-index:1}.seg.an button.on{background:transparent;box-shadow:none}
.chs button.on{box-shadow:0 4px 12px rgba(196,65,12,.28)}
.pc .ad{box-shadow:0 4px 10px rgba(196,65,12,.3)}.pc .ad.off{box-shadow:none}
.cbar{box-shadow:0 8px 20px rgba(196,65,12,.28)}.cbar:disabled{box-shadow:none}
.ng,.pc,.hero{box-shadow:0 1px 3px rgba(31,26,23,.05)}
*{font-family:'Plus Jakarta Sans',PdInter,Inter,system-ui,sans-serif!important}
.srch,.srch.w{background:#F7EFE9;border:0;border-radius:16px}
.hero{padding:14px;border-radius:22px;box-shadow:0 4px 14px rgba(31,26,23,.05)}
.lg.big{width:70px;height:70px;border-radius:20px}
.hero .tx{gap:5px}
.hero .tx .st{height:26px;font-size:12px}
.hero .tx .st.on{background:#E7F6EC;color:#0F6B33}.hero .tx .st.warn{background:#FDEBDF;color:#9A330A}.hero .tx .st.off{background:#F3EAE3;color:#6B5E55}
.hero .tx span.m{font-size:13.5px}
.lnk{text-decoration:none;color:#C4410C;font-size:13.5px}
.catH{background:transparent;border:0;border-radius:0;padding:4px 2px 0;margin:14px 0 0;box-shadow:none}
.catN{font-size:18px}
.pc{gap:14px;border-radius:20px;padding:12px}
.pc .tx b{font-size:15.5px}.pc .tx .ds{font-size:13px;line-height:1.35}.pc .tx .pr{font-size:16px}
.pc .ph{width:100px;height:100px;padding:0;border:0;background:transparent;border-radius:16px;display:block;gap:0}
.pc .ph i{width:100px;height:100px;border-radius:16px}
.pc .ph i.no{background:#F5E6D8}
.pc .ad{right:6px;bottom:6px;border:0;width:38px;height:38px;border-radius:12px}
.ng{border-radius:20px;padding:12px}
.ng .tx b{font-size:16px}.ng .tx span{font-size:13px}
.lg{width:62px;height:62px}
.ng>svg{display:none}.ng{padding-right:52px} .sede,b span.sede,.tx b span.sede,.ng .tx b span.sede,.h1 span.sede{display:inline-block;vertical-align:2px;margin:0 0 0 6px;padding:2px 8px;border-radius:999px;background:#FDEBDF;color:#9A330A;font-size:12px!important;font-weight:800!important;line-height:1.45;white-space:nowrap;letter-spacing:0;text-transform:none;margin-top:2px} .ng .tx>b{display:block;padding-right:50px;overflow-wrap:anywhere}
.pc .tx .pr{color:#C4410C}.catN{color:#C4410C}.sec h2{color:#C4410C}.catC{background:#FDEBDF;color:#9A330A}
.it>b,.it .tx>span,.ln b,.pt2,.sug button span{color:#C4410C}.ln.t b{color:#C4410C;font-weight:800}
.ln{align-items:baseline;font-size:16px}.ln span{flex:1 1 auto;min-width:0;line-height:1.35}.ln b{flex:0 0 auto;white-space:nowrap;text-align:right;font-weight:800}
.ln b.pgm{font-size:13px;padding:3px 10px;border-radius:999px;align-self:center}.ln b.pgm.y{background:#F1E8FD;color:#6D28D9}.ln b.pgm.e{background:#E9F6EE;color:#15803D}
.ln.t b{font-size:22px}
.it .tx>span{font-size:15px;font-weight:700}.it>b{font-size:17px;font-weight:800;white-space:nowrap}
.vto{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:12px 14px;border-radius:14px;background:#E9F6EE;color:#15803D;font-weight:700;font-size:15px;animation:pdUp .3s ease both}.vto b{font-size:20px;font-weight:800;color:#15803D}
.vto.bad{background:#FDE8E8;color:#B42318}.vto.bad b{color:#B42318}
@keyframes pdSpin{to{transform:rotate(360deg)}}
.spin{width:18px;height:18px;border:2.5px solid currentColor;border-right-color:transparent;border-radius:50%;animation:pdSpin .8s linear infinite;box-sizing:border-box;flex:0 0 auto}
.b.cargando{opacity:1;background:#FFF4EC;color:#C4410C;border-color:#F6CDB3}

/* --- Boceto: tarjetas y tipografía --- */
.app{font-size:15px}
.top .h1{font-size:19px!important;font-weight:800;letter-spacing:-.01em}
.cd{border-radius:20px;padding:16px;box-shadow:0 1px 3px rgba(31,26,23,.05)}
.cd.dash{border:1px solid #F1E4DA;background:#FFFFFF}
.ng,.pc{border-radius:20px}
.ng .tx b{font-size:16px;font-weight:800}.ng .tx span{font-size:13px;font-weight:600}
.pc .tx b{font-size:15.5px;font-weight:800}.pc .tx .ds{font-size:13px;font-weight:500}
.sec h2{font-size:21px;font-weight:800;letter-spacing:-.01em}.catN{font-size:18px;font-weight:800}
.chs button{height:40px;font-size:14px;font-weight:800}
.srch{height:50px;border-radius:16px}.srch input{font-size:15px;font-weight:600}
.fld label{font-size:14px;font-weight:800}.fld input,.fld select{font-size:15px;font-weight:600;border-radius:14px;height:52px;border:1px solid #EADBD0}
.ln{font-size:15px}.ln span{font-weight:600}
.it .tx b{font-size:15px;font-weight:800}
.cbar{height:58px;border-radius:18px;font-size:16px;font-weight:800}
.curso{border-radius:20px}
.st{font-size:12px}

/* --- Botón volver: igual en todas las páginas --- */
.bk,.top .row>.ib.bk:first-child,.qx.bk{width:46px!important;height:46px!important;flex:0 0 46px!important;border-radius:14px!important;border:1px solid #F1E4DA!important;background:#FFFFFF!important;color:#1F1A17!important;box-shadow:none!important;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:0}
.bk svg{width:22px!important;height:22px!important;stroke-width:2.4!important}
/* --- Buscador de inicio: fuera de la cabecera, debajo de ella --- */
.srch,.srch.w,.srch.inicio{background:#FFFFFF!important;border:1px solid #F1E4DA!important;box-shadow:0 1px 3px rgba(31,26,23,.05)}

/* --- Menú inferior visible también en las páginas que se abren encima --- */

.qs.full{bottom:var(--nvh,0px)!important}
.qs,.hbg,.dlg,.tst{pointer-events:auto}

/* --- Sin botones volver (se usa el menú inferior y el botón atrás del celular) --- */
.bk,.qx.bk,.top .row>.ib.bk:first-child{display:none!important}
/* --- Botones al final de la página, no fijos --- */
.hf.in{position:static;border-top:0;background:transparent;padding:8px 0 24px;box-shadow:none}

/* --- Foto del producto abre el detalle --- */
.pc .ph i{cursor:pointer}
/* --- Avisos arriba, para no tapar los botones de abajo --- */
/* Avisos cortos abajo (encima del menú inferior), debajo de cualquier alerta, en toda la tienda */
.tst{top:auto!important;bottom:calc(var(--pdTstB,72px) + 12px)!important;z-index:5}
.tst{animation:pdUpT .3s cubic-bezier(.2,.9,.3,1.2) both!important}@keyframes pdUpT{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* --- Tarjeta del negocio (debajo del buscador), mismo color que «Pedido en curso» --- */
.hero.neg{background:#FFFFFF;border:1px solid #F1E4DA;border-radius:20px;box-shadow:none;padding:14px;margin-top:0}
.hero.neg .lg.big{background-color:#FFFFFF}
.hero.neg .tx .st.on{background:#E7F6EC;color:#0F6B33}.hero.neg .tx .st.warn{background:#FDEBDF;color:#9A330A}.hero.neg .tx .st.off{background:#F3EAE3;color:#6B5E55}
.hero.neg .lnk{color:#C4410C;font-weight:800}

/* --- Misma distancia entre bloques que en Inicio --- */
.chsBar{padding-top:4px!important}

/* --- Botón atrás (modelo del detalle de pedido del motorizado) en negocio, detalle y tu pedido --- */
.top .row>.ib.bk.bkv:first-child,.bk.bkv{display:flex!important;width:44px!important;height:44px!important;flex:0 0 44px!important;border-radius:14px!important;border:1px solid #F1E4DA!important;background:#FFFFFF!important;color:#1F1A17!important;box-shadow:none!important}

/* ===== Diseño del detalle de pedido del MOTORIZADO (tipografía, colores y tamaños) ===== */
*{font-family:PdInter,Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif!important}
.app{font-size:14px;line-height:1.45;color:#1F1A17}
.top .kick,.qs .hh .k,.lbl,.lbl2,.dir .tx small{font-size:12px!important;font-weight:800!important;letter-spacing:.06em!important;text-transform:uppercase;color:#6B5E55!important}
.top .h1,.qs .hh h2{font-size:20px!important;font-weight:800!important;letter-spacing:0!important;color:#1F1A17}
.dir .tx b{font-size:17px;font-weight:800}
.cd,.ng,.pc,.hero,.curso,.hero.neg{border-radius:16px!important;box-shadow:none!important}
.cd{padding:14px;border:1px solid #F1E4DA;background:#FFFFFF}
.cd.dash{border:1.5px dashed #EADFD6!important;background:#FFFFFF}
.ng,.pc{border:1px solid #F1E4DA;padding:12px}
.ng .tx b,.pc .tx b,.it .tx b{font-size:16px!important;font-weight:800!important;color:#1F1A17}
.ng .tx span,.pc .tx .ds{font-size:14px!important;font-weight:500!important;color:#6B5E55}
.lg{width:56px;height:56px;border-radius:12px}.lg.big{width:60px;height:60px;border-radius:14px}
.pc .ph,.pc .ph i{width:92px!important;height:92px!important;border-radius:12px!important}
.pc .ad{width:36px!important;height:36px!important;border-radius:12px!important;box-shadow:none!important}
/* montos en negro y gruesos, como «Qué pidió» del motorizado; el total en naranja */
.pc .tx .pr,.it>b,.it .tx>span,.ln b,.pt2,.sug button span{color:#1F1A17!important;font-weight:800}
.pc .tx .pr{font-size:16px!important}.it>b{font-size:15px!important}.it .tx>span{font-size:13px!important;font-weight:600!important;color:#6B5E55!important}
.ln{font-size:14px!important}.ln span{font-weight:500;color:#6B5E55}.ln b{font-size:14px}
.ln.t span{font-size:15px;font-weight:800;color:#1F1A17}.ln.t b{font-size:20px!important;color:#C4410C!important}
/* títulos */
.sec h2{font-size:20px!important;font-weight:800;color:#1F1A17!important}.catN{font-size:17px!important;font-weight:800;color:#1F1A17!important}
.catC{font-size:12px!important;background:#FDEBDF;color:#9A330A}
/* tarjetas naranja claro como los avisos del motorizado */
.curso,.hero.neg{background:#FFFFFF!important;border:1px solid #F1E4DA!important}
/* chips, buscador, campos y botones */
.chs button{height:38px!important;font-size:14px!important;font-weight:700!important;border-radius:999px}
.chs button.on{box-shadow:none!important}
.srch,.srch.w,.srch.inicio{height:48px!important;border-radius:12px!important;box-shadow:none!important}
.srch input{font-size:15px!important;font-weight:500!important}
.fld label{font-size:14px!important;font-weight:700!important}
.fld input,.fld select{height:48px!important;border-radius:12px!important;font-size:15px!important;font-weight:500!important;border:1px solid #F1E4DA!important}
.cbar,.bp{height:52px!important;border-radius:12px!important;font-size:16px!important;font-weight:800!important;box-shadow:none!important}
.b{border-radius:12px}
.st{font-size:12px!important;height:24px!important}
.vto{border-radius:12px}.vto b{font-size:17px!important}
.ib{border-radius:12px!important}
.bk.bkv,.top .row>.ib.bk.bkv:first-child{border-radius:12px!important}
.ng .tx span.st{font-size:12px!important;font-weight:800!important;height:24px}.ng .tx{gap:3px!important}

.dlg .hora-al{width:100%;text-align:left;display:flex;flex-direction:column;gap:10px;max-height:52vh;overflow:auto}.dlg .hora-al .sem{border:1px solid #F1E4DA;border-radius:14px;padding:6px 4px}.dlg .hora-al .sem .d{padding:7px 10px;font-size:14px}.dlg .hora-al .nt{font-size:12.5px;color:#6B5E55}.dlg .hora-al .est{padding:10px 12px;border-radius:12px}
.dlg .okcod{width:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px;border:1.5px dashed #EADFD6;border-radius:14px}.dlg .okcod span{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55}.dlg .okcod b{font-size:24px;font-weight:800;letter-spacing:.08em;color:#1F1A17}
/* --- Botones de ubicación: se nota que trabajan --- */
.bs.cargando,.b.cargando{background:#FFF4EC!important;color:#C4410C!important;border-color:#F6CDB3!important;opacity:1!important}
.lc.busc,.loc.busc{background:#FFF4EC!important;animation:pdBlinkBg 1.2s ease-in-out infinite}
@keyframes pdBlinkBg{0%,100%{opacity:1}50%{opacity:.6}}
.lc .spin,.loc .spin{color:#C4410C}
.lc.fx,.loc.fx{animation:pdOkFx .6s cubic-bezier(.3,1.6,.5,1)}
@keyframes pdOkFx{0%{transform:scale(.96)}50%{transform:scale(1.03)}100%{transform:scale(1)}}
[data-h="gps"]:active,[data-a="ubic"]:active,[data-h="mapa"]:active,[data-a="mapa"]:active{transform:scale(.95)}
/* --- Seguimiento como alerta --- */
.dlg .segal{width:100%;text-align:left;display:flex;flex-direction:column;gap:10px;max-height:66vh;overflow:auto}
.dlg .segal .sk{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55}
.dlg .segal .st2{font-size:20px;font-weight:800;color:#1F1A17;margin-top:-6px}
.dlg .segal .cdg{padding:12px!important;border-radius:14px}.dlg .segal .cdn{font-size:34px!important}
.dlg .segal .cd{padding:10px 12px;border-radius:14px;border:1px solid #F1E4DA}
.dlg .segal .stot{display:flex;justify-content:space-between;align-items:baseline;padding:10px 12px;border:1.5px dashed #EADFD6;border-radius:14px;font-weight:800;font-size:15px}.dlg .segal .stot b{color:#C4410C;font-size:18px}
/* --- Seguimiento en alerta: compacto, entra en la pantalla sin deslizar --- */
.dlg:has(.segal){top:50%;padding:16px 14px 12px;gap:10px}
.dlg .segal{max-height:none!important;overflow:visible!important;gap:8px!important}
.dlg .segal .st2{font-size:18px!important;margin-top:-4px}
.dlg .segal .bar5{margin:2px 0 0}
.dlg .segal .cdg{display:grid!important;grid-template-columns:1fr auto;align-items:center;gap:0 10px;padding:10px 12px!important;text-align:left}
.dlg .segal .cdg .cdk{font-size:11.5px}.dlg .segal .cdg .cdn{font-size:26px!important;letter-spacing:.14em;grid-row:1/3;grid-column:2;line-height:1}
.dlg .segal .cdg .cds{font-size:12px;line-height:1.3;margin:0}
.dlg .segal .cd{padding:6px 10px!important}
.dlg .segal .tln .p{padding:4px 0!important;gap:10px;align-items:center}
.dlg .segal .tln .p .d{width:24px;height:24px;font-size:12px}.dlg .segal .tln .p .d svg{width:14px;height:14px}
.dlg .segal .tln .p .tx b{font-size:14px}.dlg .segal .tln .p .tx span{font-size:12px}
.dlg .segal .stot{padding:8px 12px!important}.dlg .segal .stot b{font-size:17px!important}
.dlg:has(.segal) .bb .bp,.dlg:has(.segal) .bb .bs{height:46px!important}
/* --- Programar pedido: página completa, sin menú, con botón atrás --- */
.qs.full.sinnav{bottom:0!important}
/* --- Barra de pedido programado: se puede cambiar o volver a pedir ahora --- */
.pdProgBar{display:grid;grid-template-columns:40px 1fr 1fr;gap:10px 10px;align-items:center;padding:12px;margin:0 0 4px;border-radius:18px;background:#FFF4EC;border:1.5px solid #F6CDB3}
.pdProgBar .pi{grid-column:1;width:40px;height:40px;border-radius:12px;background:#C4410C;color:#fff;display:flex;align-items:center;justify-content:center}.pdProgBar .pi svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pdProgBar .pt{grid-column:2/4;min-width:0;display:flex;flex-direction:column;gap:1px}.pdProgBar .pt b{font-size:15px;line-height:1.2}.pdProgBar .pt small{font-size:13px;line-height:1.3;color:#6B5E55;font-weight:600}
.pdProgBar button{height:42px;padding:0 10px;border-radius:12px;border:1.5px solid #EADFD6;background:#fff;color:#1F1A17;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer}
.pdProgBar button[data-prog=cambiar]{grid-column:1/3}.pdProgBar button.q{grid-column:3;background:#C4410C;border-color:#C4410C;color:#fff}
/* --- Horario de atención compacto (centrado) --- */
.dlg:has(.hc1){padding:20px 16px 14px;gap:0;border-radius:22px}
.hc1{display:flex;flex-direction:column;text-align:left;width:100%}
.hc1 .hcH{display:flex;flex-direction:row;align-items:center;gap:12px;text-align:left;padding:0;border:0;margin:0 0 14px}
.hc1 .hcI{flex:0 0 44px;width:44px;height:44px;border-radius:13px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center}.hc1 .hcI svg{width:22px;height:22px}
.hc1 .hcT{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:5px}.hc1 .hcT>b{font-size:17px;line-height:1.2}
.hc1 .hcT .st{max-width:100%}
.hc1 .sm{border:1px solid #F1E4DA;border-radius:14px;background:#FFFFFF;padding:4px}
.hc1 .r{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:10px;font-weight:600;font-size:14px;color:#1F1A17}
.hc1 .r>span{flex:1 1 0%;min-width:0}.hc1 .r>b{flex:0 0 auto;text-align:right;white-space:pre;font-weight:600;line-height:1.45}.hc1 .r b.off{color:#6B5E55}
.hc1 .r.hoy{background:#FDEBDF;color:#9A330A;font-weight:800}.hc1 .r.hoy>b{font-weight:800}.hc1 .r.hoy b.off{color:#9A330A}
.bb.hc1b{display:flex!important;flex-direction:column!important;gap:0;width:100%;margin:0!important}
.bb.hc1b>button{width:100%;height:48px!important;border-radius:14px!important;font:800 15px PdInter,Inter,system-ui,sans-serif!important;margin:10px 0 0!important;box-shadow:none!important}
.bb.hc1b>.bp{background:#C4410C;color:#FFFFFF}.bb.hc1b>.bp svg{width:20px;height:20px}
.bb.hc1b>.bs{background:#FFFFFF;border:1px solid #F1E4DA;color:#1F1A17}
.hcN{font:500 12.5px/1.4 PdInter,Inter,system-ui,sans-serif;color:#6B5E55;text-align:center;margin:10px 0 0;width:100%}
/* --- Efectos estilo app nativa --- */
@keyframes pdSh{from{background-position:100% 0}to{background-position:-50% 0}}
.skl{display:flex;flex-direction:column;gap:10px}.skc{display:flex;gap:12px;align-items:center;padding:14px;border-radius:20px;background:#FFFFFF;border:1px solid #F1E4DA}
.skb{display:block;border-radius:8px;background:linear-gradient(90deg,#F2E9E2 0%,#FBF6F2 40%,#F2E9E2 80%);background-size:300% 100%;animation:pdSh 1.2s linear infinite}
.ng,.pc,.b,.cbar,.curso,.chsHome button,.pdCarI,.ib{transition:transform .14s cubic-bezier(.2,.8,.2,1)}
.ng:active,.pc:active,.curso:active,.pdCarI:active{transform:scale(.975)}.b:active,.cbar:active,.chsHome button:active,.ib:active{transform:scale(.95)}
@keyframes pdRb{25%{transform:rotate(-12deg) scale(1.12)}50%{transform:rotate(9deg)}75%{transform:rotate(-4deg)}100%{transform:none}}
.ib.rb{animation:pdRb .5s cubic-bezier(.3,1.4,.5,1)}
@keyframes pdSube{from{transform:translateY(90px);opacity:0}to{transform:none;opacity:1}}.cbar.sube{animation:pdSube .42s cubic-bezier(.2,.9,.3,1.15)}
.stp{position:absolute;right:4px;bottom:4px;display:flex;align-items:center;height:36px;border-radius:12px;background:#C4410C;color:#FFFFFF;box-shadow:0 4px 10px rgba(196,65,12,.3);animation:pdStp .28s cubic-bezier(.2,.8,.2,1);overflow:hidden}
@keyframes pdStp{from{width:36px}to{width:94px}}.stp{width:94px}
.stp button{flex:0 0 32px;height:36px;border:0;background:none;color:#FFFFFF;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}.stp button svg{width:18px;height:18px}.stp b{flex:1;text-align:center;font-size:15px}
@keyframes pdTrz{to{stroke-dashoffset:0}}.okA svg path{stroke-dasharray:44;stroke-dashoffset:44;animation:pdTrz .45s .25s cubic-bezier(.4,0,.2,1) forwards}
@keyframes pdOkIn{from{transform:scale(.4);opacity:0}60%{transform:scale(1.12)}to{transform:none;opacity:1}}.okA{animation:pdOkIn .45s cubic-bezier(.2,.8,.2,1)}
@keyframes pdBarra{0%{background-position:100% 0}100%{background-position:-100% 0}}
@keyframes pdLat{0%{box-shadow:0 0 0 0 rgba(196,65,12,.45)}100%{box-shadow:0 0 0 10px rgba(196,65,12,0)}}.tln .p.cur .d{animation:pdLat 1.5s ease-out infinite}
.pdCar{position:relative;margin:0 0 4px}.pdCarS{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:20px;gap:0}.pdCarS::-webkit-scrollbar{display:none}
.pdCarI{flex:0 0 100%;height:150px;scroll-snap-align:center;border:0;border-radius:20px;background:#9A330A center/cover no-repeat;display:flex;align-items:flex-end;padding:14px;text-align:left;cursor:pointer;color:#FFFFFF;font-family:inherit}
.pdCarT{display:flex;flex-direction:column;gap:2px}.pdCarT b{font-size:19px;font-weight:800;text-shadow:0 1px 6px rgba(0,0,0,.35)}.pdCarT small{font-size:13px;font-weight:700;opacity:.95}
.pdCarD{position:absolute;right:14px;bottom:14px;display:flex;gap:5px}.pdCarD i{width:6px;height:6px;border-radius:9px;background:rgba(255,255,255,.55);transition:width .25s}.pdCarD i.on{width:18px;background:#FFFFFF}
@media (prefers-reduced-motion:reduce){.skb,.tln .p.cur .d{animation:none!important}}
/* --- Seguimiento compacto --- */
.segP .top .h1{font-size:18px!important}.segP .top .kick{font-size:11px}
.segP .bar5 i{height:5px}.segP .top span[style*="font-size:14px"]{font-size:12.5px!important}
.segP .list{gap:10px}
.segP .cdg{display:grid!important;grid-template-columns:1fr auto;align-items:center;gap:2px 12px;padding:12px 14px!important;border-radius:16px;text-align:left}
.segP .cdg .cdk{font-size:11px}.segP .cdg .cdn{font-size:30px!important;letter-spacing:.14em;grid-row:1/3;grid-column:2;line-height:1}
.segP .cdg .cds{font-size:12.5px;line-height:1.35;margin:0}
.segP .cd{padding:10px 14px;border-radius:16px;gap:6px}
.segP .tln .p{padding:5px 0;gap:10px;align-items:center}
.segP .tln .p .d{width:24px;height:24px;font-size:11.5px}.segP .tln .p .d svg{width:13px;height:13px}
.segP .tln .p .tx b{font-size:14px}.segP .tln .p .tx span{font-size:12px}
.segP .cd .lbl{font-size:11px}.segP .cd .ln,.segP .cd .ln span,.segP .cd .ln b{font-size:14px}
/* --- Tarjeta de pedido en curso (Mis pedidos) --- */
.oA{all:unset;box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #F1E4DA;box-shadow:0 6px 20px rgba(31,26,23,.07);cursor:pointer;transition:transform .14s}
.oA:active{transform:scale(.985)}
.oAh{display:flex;align-items:center;gap:12px}.oAh .lg{width:48px;height:48px;flex:0 0 48px;border-radius:14px}
.oAt{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:2px}.oAt b{font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.oAt small{font-size:12.5px;color:#6B5E55;font-weight:600}
.oAm{font-size:16px;font-weight:800;white-space:nowrap}
.oAt small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.top .oAh .lg{width:44px;height:44px;flex:0 0 44px;border-radius:13px}
.oAs{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border-radius:16px;background:#FFF4EC}
.oAs .vivo{font-size:12px}.oAs b{font-size:18px;font-weight:800;color:#1F1A17;line-height:1.25}.oAs small{font-size:13px;color:#6B5E55;font-weight:600}.oAs small:empty{display:none}
.oAb{display:block;height:6px;border-radius:99px;background:#EFE4DB;overflow:hidden}.oAb i{display:block;height:100%;border-radius:99px;background:#C4410C;transition:width .6s cubic-bezier(.2,.8,.2,1)}
.oAf{display:flex;align-items:center;justify-content:space-between;gap:10px}.oAf>span:first-child{font-size:12.5px;color:#6B5E55;font-weight:600;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oAg{display:inline-flex;align-items:center;gap:2px;font-size:14px;font-weight:800;color:#C4410C;white-space:nowrap}.oAg svg{width:18px;height:18px}
/* --- Categorías con íconos en la tienda principal («¿Qué se te antoja?») --- */
.sec.antoja h2{font-size:17px!important}
.chsHome.cti{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:2px 16px 4px;scroll-behavior:smooth}
.chsHome.cti::-webkit-scrollbar{display:none}
.chsHome.cti button{flex:0 0 76px;display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:transparent;padding:0;font:inherit;color:#1F1A17;cursor:pointer;transition:transform .14s ease}
.chsHome.cti button:active{transform:scale(.94)}
.chsHome.cti .ico{width:64px;height:64px;border-radius:18px;background:#FFF1E8;border:1px solid #F6CDB3;color:#C4410C;display:flex;align-items:center;justify-content:center;box-sizing:border-box;transition:background-color .2s ease,color .2s ease}
.chsHome.cti .ico svg{width:28px;height:28px}
.chsHome.cti .lb{font-size:12.5px;font-weight:600;line-height:1.2;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.chsHome.cti button.on .ico{background:#C4410C;border-color:#C4410C;color:#FFFFFF}
.chsHome.cti button.on .lb{color:#C4410C;font-weight:800}
/* Las categorías quedan fijas arriba al bajar por los negocios */
.list>.chsHome.cti{position:sticky;top:0;z-index:6;background:#FFF9F5;margin:0 -16px;padding:10px 16px 10px;box-shadow:0 1px 0 #F1E4DA}
.list>.chsHome.cti.pegada{box-shadow:0 -60px 0 #FFF9F5,0 1px 0 #F1E4DA}
`;
  /* Lo de la tienda vieja que queda debajo se esconde mientras se ve la app nueva */
  const ESTILO_DOC=`html.pdtApp body{overflow:hidden!important}
html.pdtApp #cartaModalNegocio,html.pdtApp #pdCartaCartBar,html.pdtApp #pcaBar{display:none!important}
html.pdtCk #modal{visibility:hidden!important;pointer-events:none!important}
html.pdtApp #toast,html.pdtApp .toast{z-index:2147483600!important}
html.pdtRes #ppSlots{display:none!important}
#toast{display:none!important}
/* «Estamos cerrados» como alerta, con la tienda nueva detrás */
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado{position:fixed!important;inset:0!important;left:0!important;right:0!important;top:0!important;bottom:0!important;width:auto!important;max-width:none!important;z-index:2147483200!important;background:rgba(31,26,23,.45)!important;-webkit-backdrop-filter:none!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;box-sizing:border-box;overflow:hidden!important;backdrop-filter:none!important;font-family:PdInter,Inter,system-ui,sans-serif!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado[hidden]{display:none!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .in{background:#FFFFFF!important;border-radius:22px!important;width:100%!important;max-width:400px!important;flex:0 0 auto!important;align-self:center!important;margin:auto!important;padding:20px 16px 14px!important;max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 20px 50px rgba(31,26,23,.25)!important;border:0!important;animation:ppIn .22s cubic-bezier(.2,.9,.3,1.1)}
@keyframes ppIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .in::before{display:none!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .logo{display:none!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .luna{width:56px!important;height:56px!important;border-radius:50%!important;background:#FDEBDF!important;color:#C4410C!important;margin:0 auto!important;display:flex!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .luna svg{width:28px!important;height:28px!important;stroke:#C4410C!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado h1{font:800 20px/1.25 PdInter,Inter,system-ui,sans-serif!important;color:#1F1A17!important;margin:12px 0 0!important;letter-spacing:0!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .vuelve{font:500 15px/1.45 PdInter,Inter,system-ui,sans-serif!important;color:#6B5E55!important;margin:6px 0 14px!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .vuelve b{color:#1F1A17!important;font-weight:800}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .sem{border:1px solid #F1E4DA!important;border-radius:14px!important;background:#FFFFFF!important;padding:4px!important;margin:0!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .sem div{border:0!important;padding:8px 10px!important;font:600 14px PdInter,Inter,system-ui,sans-serif!important;color:#1F1A17!important;border-radius:10px!important;background:transparent!important;box-shadow:none!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .sem div::before{display:none!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .sem .hoy{background:#FDEBDF!important;color:#9A330A!important;font-weight:800!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .sem .off{color:#6B5E55!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .bt{height:48px!important;border-radius:14px!important;font:800 15px PdInter,Inter,system-ui,sans-serif!important;margin:10px 0 0!important;box-shadow:none!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .bt.lt{background:#FFFFFF!important;border:1px solid #F1E4DA!important;color:#1F1A17!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .sem div span:last-child{white-space:nowrap;flex:0 0 auto}html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .sem div span:first-child{min-width:0}html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .sem div{font-size:13.5px!important;gap:8px!important}html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .luna,html:root body #ppCerrado#ppCerrado#ppCerrado .luna{background:#FDEBDF!important}html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .luna svg{stroke:#C4410C!important;fill:none!important}html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .bt.lt{background:#FFFFFF!important;border:1px solid #F1E4DA!important;color:#1F1A17!important}
html.pdtApp body:not(#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo#pdNo) #ppCerrado#ppCerrado#ppCerrado .nota{font:500 12.5px/1.4 PdInter,Inter,system-ui,sans-serif!important;color:#6B5E55!important;margin:10px 0 0!important}`;

  window.pdEnPagina=()=>!!sub||tab!=='inicio';
  let cerrT=0,tapT=0,eraTapada=false,host=null,root=null,tab='inicio',sub=null,key='',scrollMem={},tocando=false,ignorarPop=false;
  const F={q:'',cat:'',filtro:'todos',nq:'',ncat:'',neg:null,pid:null,qty:1,seg:null,lim:40};
  const C={};
  function cargar(k,fn,force){const c=C[k];if(c&&!force&&(c.busy||Date.now()-c.t<45000))return c;C[k]={busy:true,t:Date.now(),data:c&&c.data,err:null};
    Promise.resolve().then(fn).then(d=>{C[k]={t:Date.now(),data:d}},e=>{C[k]={t:Date.now(),data:c&&c.data,err:String(e&&e.message||e)}}).finally(()=>{key='';pintar()});return C[k]}

  /* ---------- negocios ---------- */
  const nomN=r=>String(r&&(r.nombre||r.nombre_negocio||r.razon_social)||'Negocio');
  /* sedes: «La Pera Madura (Jr. Arequipa)» se muestra como nombre + pastilla «Jr. Arequipa» */
  const sedeN=r=>{const n=nomN(r),m=n.match(/^(.*\S)\s*\(([^()]+)\)\s*$/);return m?{b:m[1],s:m[2].trim()}:{b:n,s:''}};
  const nomH=r=>{const x=sedeN(r);return E(x.b)+(x.s?`<span class="sede">${E(x.s)}</span>`:'')};
  const nomT=r=>{const x=sedeN(r);return {h:x.s?`<span style="display:block;white-space:normal;line-height:1.2">${E(x.b)}<span class="sede">${E(x.s)}</span></span>`:E(x.b)}};
  const catN=r=>String(r&&r.categoria_negocio||'').trim();
  /* Categoría en singular para la cabecera de un solo negocio (la lista sigue en plural) */
  const CAT1={'restaurantes':'Restaurante','pizzerías':'Pizzería','pollerías':'Pollería','hamburgueserías':'Hamburguesería','sangucherías':'Sanguchería','paviferías':'Pavifería','cevicherías':'Cevichería','chifas':'Chifa','parrillas y anticuchos':'Parrilla y anticuchos','heladerías':'Heladería','cafeterías':'Cafetería','juguerías':'Juguería','dulcerías y pastelerías':'Dulcería y pastelería','panaderías':'Panadería','bodegas y minimarkets':'Bodega y minimarket','fruterías y verdulerías':'Frutería y verdulería','carnicerías':'Carnicería','licorerías':'Licorería','farmacias y boticas':'Farmacia y botica','ferreterías':'Ferretería','florerías y regalos':'Florería y regalos','mascotas':'Tienda de mascotas','librerías y útiles escolares':'Librería y útiles escolares','jugueterías':'Juguetería','lavanderías':'Lavandería'};
  const catS=r=>{const c=catN(r);return CAT1[c.toLocaleLowerCase('es')]||c};
  const logoN=r=>r&&(r.logo_url||r.imagen_url)||'';
  const ini=n=>E(String(n||'N').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase());
  const visibleN=r=>r&&r.activo!==false&&r.visible_admin!==false;
  const negs=()=>R().filter(visibleN);
  const negPorId=id=>R().find(r=>String(r.id)===String(id))||null;
  function estado(r){try{const s=window.pdEstadoHorario&&window.pdEstadoHorario(r);if(s)return s}catch(e){}let ab=false;try{ab=isRestaurantOpen(r)}catch(e){}return ab?{tipo:'on',pill:'Abierto',txt:''}:{tipo:'off',pill:'Cerrado',txt:''}}
  const abierto=r=>{try{return isRestaurantOpen(r)}catch(e){return estado(r).tipo!=='off'}};
  const tiempo=r=>{const t=String(r&&r.tiempo_estimado||'').trim();return t?(/min/i.test(t)?t:t.replace('-','–')+' min'):''};
  const favs=()=>{try{const f=JSON.parse(localStorage.getItem('pidemas_favoritos')||'[]');return Array.isArray(f)?f.map(String):[]}catch(e){return []}};
  /* Más cerca: pide la ubicación del celular y ordena los negocios por distancia */
  let cercaBusy=false;
  function cercaUbic(){let c=null;try{c=customerNearbyCoords}catch(_){}if(c||cercaBusy)return;
    if(!navigator.geolocation){aviso('Tu celular no permite usar la ubicación.');return}
    cercaBusy=true;aviso('Buscando tu ubicación…');
    navigator.geolocation.getCurrentPosition(pos=>{cercaBusy=false;try{customerNearbyCoords={latitude:pos.coords.latitude,longitude:pos.coords.longitude}}catch(_){}key='';pintar()},
      err=>{cercaBusy=false;aviso(err&&err.code===1?'Para ver los negocios más cerca, permite usar tu ubicación.':'No se pudo obtener tu ubicación. Intenta de nuevo.')},
      {enableHighAccuracy:false,timeout:15000,maximumAge:300000})}
  function dist(r){try{const c=customerNearbyCoords;if(!c||r.latitud==null||r.longitud==null)return null;return distanceKm(c,{latitude:Number(r.latitud),longitude:Number(r.longitud)})}catch(e){return null}}
  const logoHtml=(r,big)=>{const u=logoN(r);return `<span class="lg${big?' big':''}" aria-hidden="true"${u?` style="background-image:url('${E(u)}')"`:''}>${u?'':ini(nomN(r))}</span>`};
  const CATIC={pollerías:'<path d="M7 14c-2-1-3-3-2-5s4-3 6-2l5 3c2 1 3 3 2 5s-4 2-6 1z"/><path d="m15 17 3 4M18 15l3 1"/>',chifas:'<path d="M3 12h18a9 9 0 0 1-18 0z"/><path d="m14 3-3 9M19 4l-5 8"/>',cevicherías:'<path d="M3 12c3-5 9-6 14-3l4-3v12l-4-3c-5 3-11 2-14-3z"/><circle cx="8" cy="11" r="1"/>',pizzerías:'<path d="M12 3 3 20h18z"/><circle cx="11" cy="14" r="1"/><circle cx="14" cy="16" r="1"/>',hamburgueserías:'<path d="M4 11a8 8 0 0 1 16 0z"/><path d="M3 14h18M5 17h14a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3z"/>',postres:'<path d="M6 11h12l-1.5 9h-9z"/><path d="M8 11a4 4 0 0 1 8 0"/>',dulcerías:'<path d="M6 11h12l-1.5 9h-9z"/><path d="M8 11a4 4 0 0 1 8 0"/>',cafeterías:'<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/>',bebidas:'<path d="M7 3h10l-1 18H8z"/><path d="M7 8h10"/>',paviferías:'<path d="M5 15c0-4 3-8 7-8s7 4 7 8z"/><path d="M3 15h18M12 7V4"/>'};
  const catIcon=c=>{const k=String(c||'').toLowerCase();const m=Object.keys(CATIC).find(x=>k.startsWith(x.slice(0,6)));return S(m?CATIC[m]:'<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/>')};

  /* ---------- carrito ---------- */
  const nCart=()=>CART().reduce((a,x)=>a+Number(x.cantidad||0),0);
  const totCart=()=>CART().reduce((a,x)=>a+Number(x.precio||0)*Number(x.cantidad||0),0);
  const cartNeg=()=>{const x=CART().find(y=>y.origen==='negocio');return x?String(x.negocio_id):''};
  function guardarCart(){try{window.saveCart&&window.saveCart()}catch(e){}try{window.updateCart&&window.updateCart()}catch(e){}try{window.pdRefreshCheckoutSummary&&window.pdRefreshCheckoutSummary()}catch(e){}try{window.updateDeliveryFarePreview&&window.updateDeliveryFarePreview()}catch(e){}}
  const enCarrito=pid=>CART().filter(x=>String(x.id)===String(pid)&&x.origen==='negocio').reduce((a,x)=>a+Number(x.cantidad||0),0);

  /* ---------- carta ---------- */
  function carta(id,force){return cargar('carta:'+id,async()=>{
    const db=SB();if(!db)throw new Error('Sin conexión.');
    const [c,p]=await Promise.all([db.from('categorias_negocio').select('*').eq('negocio_id',id).order('orden',{ascending:true}),db.from('productos_negocio').select('*').eq('negocio_id',id).eq('disponible',true).order('orden',{ascending:true})]);
    if(p.error)throw p.error;
    const prods=(p.data||[]).map(x=>({...x,origen:'negocio'}));
    try{products=PR().filter(x=>!(x.origen==='negocio'&&String(x.negocio_id)===String(id))).concat(prods)}catch(e){}
    const cats=(c.data||[]).filter(x=>x.activo!==false);
    try{selectedRestaurantCategories=cats}catch(e){}
    return {cats,prods};
  },force)}
  const precioP=p=>Number(p.precio??p.precio_unitario??0);
  const antesP=p=>{const a=Number(p.precio_antes);return Number.isFinite(a)&&a>precioP(p)?a:null};
  const fotoP=p=>{if(p.imagen_url||p.imagen)return p.imagen_url||p.imagen;let f=p.fotos;if(typeof f==='string'){try{f=JSON.parse(f)}catch(e){f=null}}return Array.isArray(f)&&f[0]?(typeof f[0]==='string'?f[0]:f[0].url||''):''};
  const stockP=p=>{try{const s=getProductStock(p);return s===null||s===undefined?null:Number(s)}catch(e){const s=Number(p.stock);return Number.isFinite(s)?s:null}};
  const varsP=p=>{let v=p.variantes;if(typeof v==='string'){try{v=JSON.parse(v)}catch(e){v=null}}return Array.isArray(v)?v.filter(Boolean):[]};
  const descP=p=>{const raw=String(p.descripcion||p.descripcion_detallada||p.detalle||'');try{return splitCatalogDescription(raw)}catch(e){return {description:raw,features:[]}}};
  const ICFOTO=S('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="m21 16-5-5-8 8"/>');

  /* ---------- páginas ---------- */
  const top=(k,t,izq,der)=>`<div class="top"><div class="row">${izq||''}<div class="ttl" style="flex:1 1 0%;min-width:0"><div class="kick">${E(k)}</div><div class="h1" style="font-size:22px">${t&&t.h?t.h:E(t)}</div></div>${der||''}${cartBtn()}</div></div>`;
  const back=(a,lab)=>`<button type="button" class="ib bk${['negocio','producto','carrito','seguir'].includes(sub)?' bkv':''}" data-a="${a||'volver'}" aria-label="${E(lab||'Volver')}">${IC.back}</button>`;
  const cartBtn=()=>{const n=nCart();return `<button type="button" class="ib" data-a="carrito" aria-label="Ver tu pedido${n?', '+n+' producto'+(n===1?'':'s'):''}">${IC.cart}${n?`<span class="bd">${n}</span>`:''}</button>`};
  function dirTxt(){try{const d=window.pdDatosClienteGuardados&&window.pdDatosClienteGuardados();if(d&&d.direccion)return d.direccion}catch(e){}return ''}

  function ultimoPedido(){try{const o=JSON.parse(localStorage.getItem('pidemas_last_order')||'null');return o&&o.id&&!FIN.includes(est(o))?o:null}catch(e){return null}}
  function inicio(){
    const dir=dirTxt();
    const head=`<div class="hd"><div class="hrow"><button type="button" class="dir" data-a="cuenta"><span class="pi">${IC.pin}</span><span class="tx"><small>Entregar en</small><b>${E(dir||'Agrega tu dirección')}</b></span></button>${cartBtn()}</div>
      </div>`;
    const buscador=`<label class="srch inicio">${IC.search}<span style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar</span><input id="tQ" type="search" placeholder="Busca un negocio o un producto" value="${E(F.q)}" data-in="q" autocomplete="off"></label>`;
    const L=negs();
    if(!L.length)return {head,body:buscador+'<div class="load"><span class="eq" aria-hidden="true"></span>Cargando los negocios…</div>'};
    let h=buscador;
    const o=ultimoPedido();
    if(o){const n=negPorId(o.negocio_id);h+=`<button type="button" class="curso" data-seg="${E(o.id)}"><span class="ci">${S('<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>')}</span><span class="ct"><span class="vivo"><i></i>Pedido en curso · ${E(etiqueta(o))}</span><b style="font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${E(n?nomN(n):'Tu pedido')}${o.total!=null?' · '+M(o.total):''}</b><span style="font-size:14px;font-weight:800;color:#C4410C">Ver seguimiento</span></span>${S('<path d="m9 6 6 6-6 6"/>')}</button>`}
    {const pv=window.__pdProg;if(pv)h+=`<div class="pdProgBar" role="status"><span class="pi">${S('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>')}</span><span class="pt"><b>Pedido programado</b><small>${E(pv.txt||'')}</small></span><button type="button" data-prog="cambiar">Cambiar</button><button type="button" class="q" data-prog="quitar">Pedir ahora</button></div>`}
    if(!F.q.trim()){const D=L.filter(r=>r.imagen_url).sort((a,b)=>(abierto(b)-abierto(a))||nomN(a).localeCompare(nomN(b),'es')).slice(0,6);
      if(D.length>1)h+=`<div class="pdCar" aria-label="Negocios destacados"><div class="pdCarS">${D.map(r=>`<button type="button" class="pdCarI" data-neg="${E(r.id)}" style="background-image:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.62)),url('${E(r.imagen_url)}')"><span class="pdCarT"><b>${nomH(r)}</b><small>${E([catS(r),abierto(r)?'Abierto ahora':''].filter(Boolean).join(' · '))}</small></span></button>`).join('')}</div><div class="pdCarD">${D.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')}</div></div>`}
    const cats=[...new Set(L.map(catN).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    if(cats.length>1)h+=`<div class="sec antoja"><h2>¿Qué se te antoja?</h2></div><div class="chsHome cti" role="group" aria-label="Categorías"><button type="button" class="${!F.cat?'on':''}" data-cat="" aria-pressed="${!F.cat}"><span class="ico">${S('<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>')}</span><span class="lb">Todos</span></button>${cats.map(c=>`<button type="button" class="${F.cat===c?'on':''}" data-cat="${E(c)}" aria-pressed="${F.cat===c}"><span class="ico">${catIcon(c)}</span><span class="lb">${E(c)}</span></button>`).join('')}</div>`;
    {const nf=F.cat?L.filter(r=>catN(r)===F.cat).length:L.length;h+=`<div class="sec"><h2>${E(F.cat||'Negocios')}</h2><span>${nf} ${F.cat?(nf===1?'negocio':'negocios'):'en Piura'}</span></div>`}
    {const si=Math.max(0,['todos','abiertos','cerca'].indexOf(F.filtro));h+=`<div class="seg an" style="grid-template-columns:repeat(3,minmax(0,1fr))"><span class="ind" data-i="${si}" style="width:calc((100% - 16px) / 3)"></span>${[['todos','Todos'],['abiertos','Abiertos'],['cerca','Más cerca']].map(x=>`<button type="button" class="${F.filtro===x[0]?'on':''}" data-fl="${x[0]}">${x[1]}</button>`).join('')}</div>`;}
    h+=`<div id="tL" style="display:flex;flex-direction:column;gap:10px">${filas()}</div>`;
    return {head,body:h};
  }
  function filas(){
    const ql=F.q.trim().toLowerCase(),fv=favs();
    let L=negs().filter(r=>!F.cat||catN(r)===F.cat);
    let prodHits=[];
    if(ql){const byName=L.filter(r=>(nomN(r)+' '+catN(r)).toLowerCase().includes(ql));
      prodHits=PR().filter(p=>p.origen==='negocio'&&String(p.nombre||p.nombre_producto||'').toLowerCase().includes(ql)&&L.some(r=>String(r.id)===String(p.negocio_id))).slice(0,8);
      const ids=new Set(prodHits.map(p=>String(p.negocio_id)));L=L.filter(r=>byName.includes(r)||ids.has(String(r.id)))}
    if(F.filtro==='abiertos')L=L.filter(abierto);
    const d=r=>{const x=dist(r);return x==null?1e9:x};
    L=L.slice().sort((a,b)=>F.filtro==='cerca'?d(a)-d(b):(abierto(b)-abierto(a))||(fv.includes(String(b.id))-fv.includes(String(a.id)))||nomN(a).localeCompare(nomN(b),'es'));
    const filaNeg=(r,s,km,t,f)=>`<div style="position:relative"><button type="button" class="ng${s.tipo==='off'?' off':''}" data-neg="${E(r.id)}">${logoHtml(r)}<span class="tx"><b>${nomH(r)}</b><span>${E([catN(r),t,km!=null?km.toFixed(1)+' km':''].filter(Boolean).join(' · '))}</span><span class="st ${E(s.tipo)}">${E(s.tipo==='off'&&/^Abre /.test(s.txt||'')?s.pill+' · '+s.txt.replace(/^Abre /,'abre ').replace(/\.$/,''):s.pill)}</span></span>${IC.chev}</button><button type="button" class="fav${f?' on':''}" data-fav="${E(r.id)}" aria-label="${f?'Quitar de favoritos':'Guardar en favoritos'}" aria-pressed="${f}" style="position:absolute;top:8px;right:36px">${IC.heart}</button></div>`;
    let h=L.map(r=>{const s=estado(r),km=dist(r),t=tiempo(r),f=fv.includes(String(r.id));return filaNeg(r,s,km,t,f)}).join('');
    /* Igual que la carta de un negocio: los negocios van separados por categoría */
    const cs=[...new Set(L.map(catN).filter(Boolean))];
    if(false){cs.sort((a,b)=>a.localeCompare(b,'es'));
      const partes=L.map(r=>{const s=estado(r),km=dist(r),t=tiempo(r),f=fv.includes(String(r.id));return filaNeg(r,s,km,t,f)});
      h=cs.map(c=>{const G=L.filter(r=>catN(r)===c);return `<div class="catH"><span class="catN">${E(c)}</span><span class="catC">${G.length} negocio${G.length===1?'':'s'}</span></div>`+G.map(r=>partes[L.indexOf(r)]).join('')}).join('');
      const sin=L.filter(r=>!catN(r));if(sin.length)h+=`<div class="catH"><span class="catN">Otros</span><span class="catC">${sin.length}</span></div>`+sin.map(r=>partes[L.indexOf(r)]).join('');}
    if(prodHits.length)h=`<div class="lbl2">Platos</div>`+prodHits.map(p=>{const r=negPorId(p.negocio_id);return `<button type="button" class="pc" data-prod="${E(p.id)}" data-pneg="${E(p.negocio_id)}"><span class="tx"><b>${E(p.nombre||p.nombre_producto)}</b><span class="ds">${E(r?nomN(r):'')}</span><span class="pr">${M(precioP(p))}</span></span></button>`}).join('')+(L.length?`<div class="lbl2" style="margin-top:6px">Negocios</div>`:'')+h;
    return h||`<div class="vac">${ql?'No encontramos «'+E(F.q.trim())+'».':F.filtro==='abiertos'?'No hay negocios abiertos ahora.':'No hay negocios en esta categoría.'}</div>`;
  }

  function negocio(){
    const r=negPorId(F.neg);
    if(!r&&(window.pdNegNoDisp||R().length))return {head:top('Negocio','No disponible',back('inicio')),body:'<div class="vac">Este negocio no está disponible en la tienda por ahora.</div>'};
    if(!r)return {head:top('Negocio','Cargando…',back('inicio')),body:'<div class="load"><span class="eq" aria-hidden="true"></span>Cargando…</div>'};
    const fv=favs().includes(String(r.id));
    const head=top(catS(r)||'Negocio',nomT(r),back('inicio','Volver al inicio'));
    const s=estado(r),c=carta(r.id);
    let h='';
    if(!c.data)return {head,body:h+(c.err?`<div class="err">No se pudo cargar la carta: ${E(c.err)}</div>`:'<div class="load"><span class="eq" aria-hidden="true"></span>Cargando la carta…</div>')};
    const {cats,prods}=c.data;
    if(!prods.length)return {head,body:h+'<div class="vac">Este negocio todavía no tiene productos en su carta.</div>'};
    const phC=/belleza|cuidado|farmac|botica|ropa|moda|tecnolog|celular|ferreter|librer|mascota|veterin|regalo|perfum|cosm|hogar|bazar|juguet|calzad|zapat|accesori|joyer|óptic|optic/i.test(catN(r)||'')?'Buscar un producto':'Buscar en la carta';
    {const fv2=favs().includes(String(r.id));h+=`<div class="hero neg">${logoHtml(r,true)}<div class="tx"><span class="st ${E(s.tipo)}">${E(s.pill)}</span>${s.txt?`<span class="m" style="color:#1F1A17;font-weight:700">${E(s.txt)}</span>`:''}<span class="m">${E([tiempo(r),r.ubicacion_publica===false?'Solo delivery':r.direccion].filter(Boolean).join(' · '))}</span><button type="button" class="lnk" data-a="horario">Ver horario de la semana</button></div><button type="button" class="fav${fv2?' on':''}" data-fav="${E(r.id)}" aria-label="${fv2?'Quitar de favoritos':'Guardar en favoritos'}" aria-pressed="${fv2}">${IC.heart}</button></div>`}
    h+=`<label class="srch">${IC.search}<span style="position:absolute;width:1px;height:1px;overflow:hidden">${E(phC)}</span><input id="tNq" type="search" placeholder="${E(phC)}" value="${E(F.nq)}" data-in="nq" autocomplete="off"></label>`;
    const grupos=gruposCarta(cats,prods);
    if(grupos.length>1)h+=`<div class="chsBar"><div class="chs" role="tablist" aria-label="Categorías de la carta">${grupos.map((g,i)=>`<button type="button" role="tab" aria-selected="false" data-ncat="${E(g.id)}">${E(g.n)}</button>`).join('')}</div></div>`;
    h+=`<div id="tCarta" style="display:flex;flex-direction:column;gap:10px">${cartaLista(r)}</div>`;
    const n=CART().filter(x=>String(x.negocio_id)===String(r.id)).reduce((a,x)=>a+Number(x.cantidad||0),0);
    const foot=n?`<button type="button" class="cbar" data-a="carrito"><span class="n">${n}</span><span class="t">Ver tu pedido</span><span>${M(totCart())}</span></button>`:'';
    return {head,body:h,foot};
  }
  function gruposCarta(cats,prods){const out=[];const ids=new Set(cats.map(c=>String(c.id)));
    cats.slice().sort((a,b)=>(Number(a.orden)||999)-(Number(b.orden)||999)).forEach(c=>{const L=prods.filter(p=>String(p.categoria_id||'')===String(c.id));if(L.length)out.push({id:String(c.id),n:c.nombre||'Categoría',L})});
    const sin=prods.filter(p=>!p.categoria_id||!ids.has(String(p.categoria_id)));if(sin.length)out.push({id:'otros',n:out.length?'Otros':'Productos',L:sin});
    return out}
  function cartaLista(r){
    const c=C['carta:'+r.id];if(!c||!c.data)return '';
    const ql=F.nq.trim().toLowerCase(),ab=abierto(r);
    const grupos=gruposCarta(c.data.cats,c.data.prods).map(g=>({...g,L:g.L.filter(p=>!ql||String(p.nombre||'').toLowerCase().includes(ql)||String(p.descripcion||'').toLowerCase().includes(ql))})).filter(g=>g.L.length);
    if(!grupos.length)return `<div class="vac">No encontramos «${E(F.nq.trim())}» en esta carta.</div>`;
    return grupos.map((g,gi)=>`<div class="catH" id="g-${E(g.id)}"${gi?'':' style="margin-top:2px"'}><span class="catN">${E(g.n)}</span><span class="catC">${g.L.length} producto${g.L.length===1?'':'s'}</span></div>`+g.L.map(p=>{
      const n=enCarrito(p.id),st=stockP(p),ago=st!==null&&st<=0,ft=fotoP(p),d=descP(p).description,an=antesP(p);
      return `<div class="pc${n?' en':''}" role="group" aria-label="${E(p.nombre)}"><button type="button" data-prod="${E(p.id)}" style="all:unset;flex:1 1 0%;min-width:0;cursor:pointer;display:flex"><span class="tx"><b>${E(p.nombre||p.nombre_producto||'Producto')}</b>${n?`<span class="enc">${n} en tu pedido</span>`:d?`<span class="ds">${E(d)}</span>`:''}${ago?'<span class="agot">Agotado</span>':''}<span class="pr">${M(precioP(p))}${an?`<s>${M(an)}</s>`:''}</span></span></button><span class="ph"><i data-prod="${E(p.id)}" role="button" aria-label="Ver ${E(p.nombre)}"${ft?` style="background-image:url('${E(ft)}')"`:' class="no"'}>${ft?'':ICFOTO}</i>${ago?'':n&&ab?`<span class="stp" role="group" aria-label="Cantidad de ${E(p.nombre)}"><button type="button" data-rem="${E(p.id)}" aria-label="${n>1?'Quitar uno':'Quitar del pedido'}">${n>1?IC.minus:IC.trash}</button><b>${n}</b><button type="button" data-add="${E(p.id)}" aria-label="Agregar uno">${IC.plus}</button></span>`:`<button type="button" class="ad${ab?'':' off'}" data-add="${E(p.id)}" aria-label="Agregar ${E(p.nombre)}">${IC.plus}</button>`}</span></div>`}).join('')).join('');
  }

  function producto(){
    const p=PR().find(x=>String(x.id)===String(F.pid)&&x.origen==='negocio');const r=p&&negPorId(p.negocio_id);
    if(!p||!r){sub='negocio';return negocio()}
    const c=C['carta:'+r.id],g=c&&c.data&&gruposCarta(c.data.cats,c.data.prods).find(x=>x.L.some(y=>String(y.id)===String(p.id)));
    const head=top(nomN(r)+(g?' · '+g.n:''),'Detalle',back('anegocio','Volver a la carta'));
    const ft=fotoP(p),d=descP(p),an=antesP(p),st=stockP(p),ab=abierto(r),q=Math.max(1,F.qty);
    let h=`<div class="foto"${ft?` style="background-image:url('${E(ft)}')"`:''} role="img" aria-label="${E(p.nombre)}">${ft?'':ICFOTO}</div>`;
    h+=`<div style="display:flex;flex-direction:column;gap:6px"><h1 class="pt1">${E(p.nombre||'Producto')}</h1><div class="pt2">${M(precioP(p))}${an?`<s>${M(an)}</s>`:''}</div>${d.description?`<div style="font-size:15px;color:#6B5E55;line-height:1.5;white-space:pre-line">${E(d.description)}</div>`:''}${st!==null&&st>0&&st<=10?`<div style="font-size:14px;color:#9A330A;font-weight:700">Quedan ${st}</div>`:''}</div>`;
    if(d.features&&d.features.length)h+=`<div class="cd"><div class="lbl">Características</div>${d.features.map(f=>`<div class="li"><span>${E(f.name)}</span><b>${E(f.value)}</b></div>`).join('')}</div>`;
    if(!ab){const s=estado(r);h+=`<div class="cd"><div class="lbl">${E(s.pill)}</div><div style="font-size:15px">${E(s.txt||'Este negocio no está recibiendo pedidos ahora.')}</div><button type="button" class="b" data-a="horario">Ver horario o reservar</button></div>`}
    else h+=`<div class="cd" style="flex-direction:row;align-items:center;justify-content:space-between"><b style="font-size:16px">Cantidad</b><span class="qty"><button type="button" data-q="-1" aria-label="Quitar uno"${q<=1?' disabled':''}>${IC.minus}</button><b aria-live="polite">${q}</b><button type="button" class="o" data-q="1" aria-label="Agregar uno"${st!==null&&q>=st?' disabled':''}>${IC.plus}</button></span></div>`;
    const otros=c&&c.data?c.data.prods.filter(x=>String(x.id)!==String(p.id)&&String(x.categoria_id||'')!==String(p.categoria_id||'')&&(stockP(x)===null||stockP(x)>0)).sort((a,b)=>precioP(a)-precioP(b)).slice(0,3):[];
    if(otros.length&&ab)h+=`<div class="lbl2">Combina con</div><div class="sug">${otros.map(x=>`<button type="button" data-prod="${E(x.id)}"><b>${E(x.nombre)}</b><span>${M(precioP(x))}</span></button>`).join('')}</div>`;
    const foot=ab&&!(st!==null&&st<=0)?`<button type="button" class="cbar c" data-a="agregar">Agregar ${q} a tu pedido · ${M(precioP(p)*q)}</button>`:'';
    return {head,body:h,foot};
  }

  /* ---------- tu pedido: los datos se escriben en el formulario de siempre (oculto) ---------- */
  const ck=()=>!!$('cNombre');
  function abrirCk(){if(!CART().length)return;if(!ck()){try{window.openCheckout()}catch(e){console.warn('[Tienda] checkout',e)}}document.documentElement.classList.add('pdtCk')}
  function cerrarCk(){document.documentElement.classList.remove('pdtCk');if(ck()){cerrT=Date.now();try{closeModal()}catch(e){}}}
  const val=id=>{const e=$(id);return e?String(e.value||''):''};
  function setVal(id,v){const e=$(id);if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
  const sheetCk=()=>{const e=$('cNombre');return e&&e.closest('.sheet')};
  const btnTxt=re=>{const s=sheetCk();return s?[...s.querySelectorAll('button')].find(b=>re.test((b.textContent||'').trim())):null};
  function lineasResumen(){const s=$('pdCkSummary');if(!s)return null;const L=[...s.querySelectorAll('.pdLine,.pdTotal')].map(l=>{const a=l.children;return [String(a[0]&&a[0].textContent||'').trim(),String(a[a.length-1]&&a[a.length-1].textContent||'').trim(),l.className]}).filter(x=>x[0]);return L.length?L:null}
  function vueltoH(){try{const n=x=>Number(String(x||'').replace(',','.').replace(/[^\d.]/g,''))||0;const res=lineasResumen();const tot=res?n(res[res.length-1][1]):totCart();const m=n(val('cMontoPago'));if(!m||!tot)return '';const d=Math.round((m-tot)*100)/100;
    return d<0?`<div class="vto bad"><span>Te faltan</span><b>${M(-d)}</b></div>`:`<div class="vto"><span>Tu vuelto</span><b>${M(d)}</b></div>`}catch(_){return ''}}
  function carrito(){
    const head=top(cartNeg()?nomN(negPorId(cartNeg())):'Tu carrito','Tu pedido',back('volver'));
    const L=CART();
    if(!L.length){cerrarCk();return {head,body:'<div class="vac">Tu pedido está vacío. Elige un negocio y agrega productos.</div><button type="button" class="b o" data-a="inicio">Ver negocios</button>'}}
    abrirCk();
    let h=`<div class="cd dash"><div class="lbl">Productos</div>${L.map((x,i)=>`<div class="it"><span class="tx"><b>${E(x.nombre)}</b><span>${M(x.precio)} c/u</span></span><span class="qty s"><button type="button" data-ci="${i}:-1" aria-label="${x.cantidad>1?'Quitar uno':'Quitar del pedido'}">${x.cantidad>1?IC.minus:IC.trash}</button><b>${x.cantidad}</b><button type="button" data-ci="${i}:1" aria-label="Agregar uno">${IC.plus}</button></span><b>${M(x.precio*x.cantidad)}</b></div>`).join('')}<button type="button" class="lnk" data-a="anegocio2" style="text-decoration:none">+ Agregar más productos</button></div>`;
    if(!ck())return {head,body:h+'<div class="load"><span class="eq" aria-hidden="true"></span>Preparando tu pedido…</div>'};
    const la=val('cLat'),ln=val('cLng'),on=!!(la&&ln),stx=String(($('cLocationStatus')||{}).textContent||'');
    const busc=ubicT&&Date.now()-ubicT<(ubicPrev?2500:12000)&&!(on&&!ubicPrev);if(on&&ubicT&&(!ubicPrev||Date.now()-ubicT>2500)){ubicT=0;setTimeout(()=>aviso('Listo, tomamos tu ubicación.'),50)}if(ubicT&&!busc)ubicT=0;
    h+=`<div class="cd"><div class="lbl">Entrega</div>
      <div class="fld"><label for="tDir">Dirección de entrega</label><input id="tDir" value="${E(val('cDireccion'))}" data-ck="cDireccion" placeholder="Ej. Urb. Miraflores Mz B Lt 7" autocomplete="street-address"></div>
      <div class="fld"><label for="tRef">Referencia</label><input id="tRef" value="${E(val('cReferencia'))}" data-ck="cReferencia" placeholder="Ej. Casa de dos pisos, reja negra"></div>
      <div class="loc${on?' on':''}${busc?' busc':''}"><span class="i">${busc?'<span class="spin"></span>':on?IC.check:IC.pin}</span><span class="tx"><b>${busc?'Buscando tu ubicación…':on?'Ubicación lista':'Falta tu ubicación'}</b><span>${busc?'Acepta el permiso de ubicación si tu celular lo pide.':on?'El delivery se calcula con este punto.':/Obteniendo|Buscando/i.test(stx)?E(stx):'Necesaria para calcular el delivery.'}</span></span></div>
      <div class="btns b2"><button type="button" class="b${on?'':' o'}${busc?' cargando':''}" data-a="ubic"${busc?' disabled':''}>${busc?'<span class="spin"></span>Buscando…':IC.gps+'Mi ubicación'}</button><button type="button" class="b" data-a="mapa">${IC.map}${on?'Cambiar en mapa':'Marcar en mapa'}</button></div></div>`;
    h+=`<div class="cd"><div class="lbl">Tus datos</div><div class="fld"><label for="tNom">Nombre</label><input id="tNom" value="${E(val('cNombre'))}" data-ck="cNombre" autocomplete="name"></div><div class="fld"><label for="tTel">Celular</label><input id="tTel" inputmode="tel" value="${E(val('cTelefono'))}" data-ck="cTelefono" autocomplete="tel" placeholder="9 dígitos"></div>
      ${$('cObs')?`<div class="fld"><label for="tObs">Nota para el pedido (opcional)</label><input id="tObs" value="${E(val('cObs'))}" data-ck="cObs" maxlength="300" placeholder="Ej. Tocar el timbre"></div>`:''}</div>`;
    const sw=document.querySelector('#modal .pdDescSw');
    if(sw){const box=sw.closest('.pdDesc,#pdDesc,.field,div');const t=String((box&&box.querySelector('b,strong,span'))?.textContent||'Cubiertos').trim();const on2=sw.classList.contains('on')||sw.getAttribute('aria-pressed')==='true'||sw.getAttribute('aria-checked')==='true';
      h+=`<div class="cd"><button type="button" class="sw${on2?' on':''}" data-a="cubiertos" aria-pressed="${on2}"><span class="tx">${E(t.length>60?'Cubiertos descartables':t)}</span><i aria-hidden="true"></i></button></div>`}
    const pago=val('cPago');
    h+=`<div class="cd"><div class="lbl">Pago</div><div class="pay"><button type="button" class="${pago==='efectivo'?'on':''}" data-pago="efectivo" aria-pressed="${pago==='efectivo'}">Efectivo</button><button type="button" class="${pago==='yape'?'on':''}" data-pago="yape" aria-pressed="${pago==='yape'}">Yape</button></div>`;
    if(pago==='efectivo')h+=`<div class="fld"><label for="tMon">¿Con cuánto pagas? (para tu vuelto)</label><input id="tMon" inputmode="decimal" value="${E(val('cMontoPago'))}" data-ck="cMontoPago" placeholder="Ej. 100"></div><div id="tVto">${vueltoH()}</div>`;
    if(pago==='yape'){const rs=[...document.querySelectorAll('#modal input[name="pdYapeModo"]')];
      if(rs.length)h+=`<div class="opts">${rs.map(x=>{const lb=x.closest('label');const tt=lb?[...lb.querySelectorAll('b,strong')].map(z=>z.textContent.trim())[0]||'':'';const ds=lb?String(lb.textContent||'').replace(tt,'').trim():'';const hid=lb&&(lb.classList.contains('pdOff')||lb.closest('.pdOff'));return hid?'':`<button type="button" class="opt${x.checked?' on':''}" data-yape="${E(x.value)}"><b>${E(tt||(x.value==='negocio'?'Coordinar con el negocio':'Al motorizado al recibir'))}</b><span>${E(ds)}</span></button>`}).join('')}</div>`}
    h+=`</div>`;
    const tipo=val('cCompTipo')||'ninguno';
    if($('cCompTipo')){h+=`<div class="cd"><div class="lbl">Comprobante (opcional)</div><div class="pay"><button type="button" class="${tipo==='boleta'?'on':''}" data-comp="boleta">Boleta</button><button type="button" class="${tipo==='factura'?'on':''}" data-comp="factura">Factura</button></div>`;
      if(tipo==='boleta')h+=`<div class="two"><div class="fld"><label for="tCd">DNI</label><input id="tCd" inputmode="numeric" value="${E(val('cCompDni'))}" data-ck="cCompDni"></div><div class="fld"><label for="tCn">Nombre</label><input id="tCn" value="${E(val('cCompNombre'))}" data-ck="cCompNombre"></div></div>`;
      if(tipo==='factura')h+=`<div class="fld"><label for="tCr">RUC</label><input id="tCr" inputmode="numeric" value="${E(val('cCompRuc'))}" data-ck="cCompRuc"></div><div class="fld"><label for="tCz">Razón social</label><input id="tCz" value="${E(val('cCompRazon'))}" data-ck="cCompRazon"></div><div class="fld"><label for="tCf">Dirección fiscal</label><input id="tCf" value="${E(val('cCompDirFiscal'))}" data-ck="cCompDirFiscal"></div>`;
      h+=`</div>`}
    if($('cDiscountCode')){const ms=String(($('cDiscountMsg')||{}).textContent||'').trim();h+=`<div class="cd"><div class="lbl">Código de descuento</div><div style="display:flex;gap:8px"><div class="fld" style="flex:1 1 0%"><label for="tDc" style="position:absolute;width:1px;height:1px;overflow:hidden">Código</label><input id="tDc" value="${E(val('cDiscountCode'))}" data-ck="cDiscountCode" placeholder="Escribe tu código" autocomplete="off" style="text-transform:uppercase"></div><button type="button" class="b" style="height:54px;padding:0 18px" data-a="cupon">Aplicar</button></div>${ms?`<div style="font-size:14px;color:#6B5E55">${E(ms)}</div>`:''}</div>`}
    const res=lineasResumen();
    if(res)h+=`<div class="cd">${res.map((x,i)=>`<div class="ln${i===res.length-1?' t':''}${/descuento|gratis/i.test(x[0]+x[1])&&i<res.length-1?' g':''}"><span>${E(x[0])}</span><b>${E(x[1])}</b></div>`).join('')}</div>`;
    const sb2=btnTxt(/^Confirmar|^Enviar|^Hacer pedido|^Reservar/i);const tot=res?res[res.length-1][1]:M(totCart());
    const foot=`<button type="button" class="cbar c" data-a="enviar"${window.__pidemasOrderSubmitting?' disabled':''}>${window.__pidemasOrderSubmitting?'Enviando…':E((sb2&&/Reservar/i.test(sb2.textContent))?'Reservar pedido':'Confirmar pedido')} · ${E(tot)}</button>`;
    return {head,body:h,foot};
  }

  /* ---------- mis pedidos y seguimiento ---------- */
  const fechaC=t=>{try{const d=new Date(t),k=x=>x.toLocaleDateString('en-CA',{timeZone:'America/Lima'});const h=d.toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'numeric',minute:'2-digit'});return k(d)===k(new Date())?'Hoy '+h:k(d)===k(new Date(Date.now()-864e5))?'Ayer '+h:d.toLocaleDateString('es-PE',{timeZone:'America/Lima',day:'numeric',month:'short'}).replace('.','')+' · '+h}catch(e){return ''}};
  const codP=o=>'#'+String(o.id||'').replace(/-/g,'').slice(0,8).toUpperCase();
  function etiqueta(o){try{return trackingLabel(o.estado)}catch(e){return String(o.estado||'En curso')}}
  function pasos(o){const neg=!!o.negocio_id,s=est(o);
    const L=[{k:'recibido',t:'Pedido recibido',d:neg?'El negocio está revisando tu pedido.':'Estamos preparando tu pedido.',at:o.creado_en},neg?{k:'negocio',t:'El negocio lo confirmó',d:'Están preparando tu pedido.',at:o.negocio_aceptado_en}:null,{k:'moto',t:'Motorizado en camino al local',d:'Un motorizado ya tiene tu pedido asignado.',at:o.aceptado_en||o.asignado_en},{k:'camino',t:'Recogió tu pedido',d:'Va camino a tu dirección.',at:o.en_camino_en},{k:'llegando',t:'Llegando a tu dirección',d:'Ten listo tu pago y tu celular.',at:o.en_entrega_en},{k:'entregado',t:'Pedido entregado',d:'¡Gracias por pedir en Pidemás!',at:o.entregado_en}].filter(Boolean);
    const pe={pendiente:0,confirmado:neg?1:0,asignado:neg?2:1,aceptado:neg?2:1,pedido_aceptado:neg?2:1,camino_recojo:neg?2:1,en_camino:neg?3:2,camino_entrega:neg?3:2,en_entrega:neg?4:3,confirmando_pago:neg?4:3,entregado:L.length-1};
    let cur=pe[s]??0;L.forEach((p,i)=>{if(p.at&&i>cur)cur=i});if(s==='entregado')cur=L.length-1;return {L,cur}}
  const hora=t=>{try{return t?new Date(t).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'numeric',minute:'2-digit'}):''}catch(e){return ''}};
  function loginCard(t,s){return `<div class="vac" style="display:flex;flex-direction:column;gap:12px;align-items:center"><b style="font-size:17px;color:#1F1A17">${E(t)}</b><span>${E(s)}</span><button type="button" class="gbtn" data-a="google"><svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar con Google</button></div>`}
  function historial(force){return cargar('hist',async()=>{const h=await pdCargarHistorialPedidosCliente();return Array.isArray(h)?h:[]},force)}
  function pedidos(){
    const head=top('Tus compras','Mis pedidos','',SES()?`<button type="button" class="ib" data-a="hact" aria-label="Actualizar">${S('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>')}</button>`:'');
    if(!SES())return {head,body:loginCard('Inicia sesión para ver tus pedidos','Tus pedidos quedan guardados en tu cuenta de Google.')};
    const c=historial();if(!c.data)return {head,body:c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load"><span class="eq" aria-hidden="true"></span>Cargando tus pedidos…</div>'};
    const H=c.data;if(!H.length)return {head,body:`<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:48px 20px 8px"><span style="width:76px;height:76px;border-radius:50%;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center">${String(IC.box).replace(/width="\d+" height="\d+"/,'width="34" height="34"')}</span><h2 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#1F1A17">Aún no tienes pedidos</h2><p style="margin:0;font-size:15px;line-height:1.5;color:#6B5E55;max-width:300px">Explora los negocios de Piura y haz tu primer pedido.</p></div><button type="button" class="b o" style="height:54px;font-size:16px;margin-top:8px" data-a="inicio">Ver negocios</button>`};
    let cal={};try{cal=JSON.parse(localStorage.getItem('pidemas_calificados')||'{}')||{}}catch(e){}
    const curso=H.filter(o=>!FIN.includes(est(o))),antes=H.filter(o=>FIN.includes(est(o)));
    const card=o=>{const s=est(o),canc=['cancelado','anulado','rechazado'].includes(s),fin=s==='entregado',r=negPorId(o.negocio_id),items=(o.items||[]).map(x=>Number(x.cantidad||1)+'× '+x.nombre).join(' · '),p=!fin&&!canc?pasos(o):null,cl=cal[o.id];
      if(p){const n=p.L.length,k=Math.min(p.cur,n-1),pc=Math.round((k+1)/n*100),sig=p.L[k+1];
        return `<button type="button" class="oA" data-seg="${E(o.id)}" aria-label="Ver seguimiento de tu pedido de ${E(r?nomN(r):'Pidemás')}">
          <span class="oAh">${r?logoHtml(r):'<span class="lg"></span>'}<span class="oAt"><b>${E(r?nomN(r):o.negocio_nombre||'Pedido')}</b><small>${E(codP(o))} · ${E(fechaC(o.creado_en))}</small></span><b class="oAm">${M(o.total)}</b></span>
          <span class="bar5" style="grid-template-columns:repeat(${n},minmax(0,1fr))" aria-hidden="true">${p.L.map((_,i)=>`<i class="${i<k?'d':i===k?'c':''}"></i>`).join('')}</span>
          <span class="oAf"><span>Paso ${k+1} de ${n} · ${E(etiqueta(o))}</span><span class="oAg">Ver seguimiento ${S('<path d="m9 6 6 6-6 6"/>')}</span></span>
        </button>`}
      return `<div class="oc2${p?' a':''}"><div class="r1"><b>${E(r?nomN(r):o.negocio_nombre||'Pedido')}</b><b>${M(o.total)}</b></div><div class="r2"><span class="st ${canc?'off':fin?'on':'warn'}">${canc?'Cancelado':fin?'Entregado':E(etiqueta(o))}</span><span>${E(codP(o))} · ${E(fechaC(o.creado_en))}</span>${cl?`<span style="color:#9A330A;font-weight:800">★ ${E(cl)}</span>`:''}</div>${items?`<div class="r3">${E(items)}</div>`:''}${p?`<div class="bar5" style="grid-template-columns:repeat(${p.L.length},minmax(0,1fr))" aria-hidden="true">${p.L.map((_,i)=>`<i class="${i<p.cur?'d':i===p.cur?'c':''}"></i>`).join('')}</div><button type="button" class="b" data-seg="${E(o.id)}">Ver seguimiento</button>`:`<div class="btns${fin&&!cl&&(o.items||[]).length?' b2':''}">${(o.items||[]).length?`<button type="button" class="b o" data-rep="${E(o.id)}">Pedir de nuevo</button>`:''}${fin&&!cl?`<button type="button" class="b" data-cal="${E(o.id)}">Calificar</button>`:''}</div>`}</div>`};
    let h='';if(curso.length)h+=`<div class="lbl2">En curso</div>`+curso.map(card).join('');
    if(antes.length)h+=`<div class="lbl2" style="margin-top:6px">Anteriores</div>`+antes.slice(0,F.lim).map(card).join('')+(antes.length>F.lim?`<button type="button" class="b" data-a="hmas">Ver más pedidos</button>`:'');
    return {head,body:h};
  }
  let segT=0;
  function seguimiento(){
    const head0=t=>top('Seguimiento',t,back('volver'));
    if(!SES())return {head:head0('Tu pedido'),body:loginCard('Inicia sesión para seguir tu pedido','Así ves en qué paso va tu pedido desde cualquier teléfono.')};
    const c=cargar('seg',async()=>{const l=await getTrackingOrders();return Array.isArray(l)?l:[]});
    if(Date.now()-c.t>15000&&!c.busy)cargar('seg',async()=>{const l=await getTrackingOrders();return Array.isArray(l)?l:[]},true);
    if(!c.data)return {head:head0('Tu pedido'),body:c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load"><span class="eq" aria-hidden="true"></span>Cargando tu pedido…</div>'};
    const act=c.data.filter(o=>!FIN.includes(est(o)));const o=c.data.find(x=>String(x.id)===String(F.seg))||act[0];
    if(!o)return {head:head0('Tu pedido'),body:'<div class="vac">No tienes pedidos en curso. Cuando hagas un pedido, aquí verás cada paso en tiempo real.</div><button type="button" class="b" data-t="pedidos">Ver mis pedidos</button>'};
    const r=negPorId(o.negocio_id),s=est(o),canc=['cancelado','anulado','rechazado'].includes(s),p=pasos(o),cur=p.L[p.cur];
    const tit=canc?'Pedido cancelado':{recibido:'Recibimos tu pedido',negocio:'Están preparando tu pedido',moto:'Un motorizado va por tu pedido',camino:'Va en camino',llegando:'Está llegando',entregado:'Pedido entregado'}[cur.k]||etiqueta(o);
    const head=`<div class="top"><div class="row">${back('volver')}<span class="oAh" style="flex:1 1 0%;min-width:0"><span class="oAt"><b>${E(r?nomN(r):o.negocio_nombre||'Pedido')}</b><small>${E(codP(o))} · ${E(fechaC(o.creado_en))}</small></span>${o.total!=null?`<b class="oAm">${M(o.total)}</b>`:''}</span></div>${canc?`<div class="h1" style="font-size:19px">${E(tit)}</div>`:`<div class="bar5" style="grid-template-columns:repeat(${p.L.length},minmax(0,1fr))" role="img" aria-label="Paso ${p.cur+1} de ${p.L.length}">${p.L.map((_,i)=>`<i class="${i<p.cur||s==='entregado'?'d':i===p.cur?'c':''}"></i>`).join('')}</div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span style="font-size:13.5px;color:#6B5E55;font-weight:700;min-width:0">Paso ${p.cur+1} de ${p.L.length} · <span style="color:#1F1A17">${E(tit)}</span>${s==='negocio'&&o.tiempo_preparacion_min?' · listo en unos '+o.tiempo_preparacion_min+' min':''}</span>${FIN.includes(s)?'':'<span class="vivo" style="flex:0 0 auto"><i></i>En vivo</span>'}</div>`}</div>`;
    let h='';
    if(canc)h+=`<div class="err">Si ya pagaste, Pidemás se comunicará contigo.</div>`;
    if(!canc&&!FIN.includes(s)&&o.negocio_id){const cc=cargar('cod:'+o.id,async()=>{const x=await SB().rpc('codigo_entrega',{p_pedido:o.id,p_token:(window.pdTokenPedido?window.pdTokenPedido(o.id):null)});return x&&!x.error&&x.data?String(x.data):''});h+=`<div class="cdg"><div class="cdk">Tu código de entrega</div><div class="cdn">${cc.data?E(cc.data):'····'}</div><div class="cds">Dáselo al motorizado solo cuando tengas tu pedido en la mano.</div></div>`}
    if(!canc)h+=`<div class="cd"><div class="tln">${p.L.map((x,i)=>{const ok=i<p.cur||s==='entregado',cu=i===p.cur&&s!=='entregado';return `<div class="p${ok?' ok':cu?' cur':' no'}"><span class="d">${ok?IC.check:i+1}</span><span class="tx"><b>${E(x.t)}</b><span>${E(ok&&x.at?hora(x.at):cu?x.d:'')}</span></span></div>`}).join('')}</div></div>`;
    const sub2=Number(o.subtotal),del=Number(o.delivery_cost??o.costo_delivery);
    h+=`<div class="cd dash"><div class="lbl">Detalle</div>${(o.items||[]).map(x=>`<div class="ln"><span style="color:#1F1A17">${Number(x.cantidad||1)} × ${E(x.nombre)}</span><b>${M(Number(x.precio||0)*Number(x.cantidad||1))}</b></div>`).join('')}${sub2>0?`<div class="ln"><span>Subtotal</span><b>${M(sub2)}</b></div>`:''}${Number.isFinite(del)?`<div class="ln"><span>Delivery</span><b>${M(del)}</b></div>`:''}${o.metodo_pago?`<div class="ln"><span>Pago</span><b class="pgm ${/yape/i.test(o.metodo_pago)?'y':'e'}">${E(String(o.metodo_pago).replace(/^./,m=>m.toUpperCase()))}${o.pago_confirmado?' · confirmado':''}</b></div>`:''}<div class="ln t"><span>Total</span><b>${M(o.total)}</b></div></div>`;
    if(act.length>1)h+=`<div class="lbl2">Otros pedidos en curso</div>`+act.filter(x=>x!==o).map(x=>`<button type="button" class="ng" data-seg="${E(x.id)}"><span class="tx"><b>${E(negPorId(x.negocio_id)?nomN(negPorId(x.negocio_id)):'Pedido')}</b><span>${E(codP(x))} · ${E(etiqueta(x))}</span></span>${IC.chev}</button>`).join('');
    return {head,body:h};
  }


  /* ---------- seguimiento como alerta (la página completa queda para «Ver detalle completo») ---------- */
  let segIv=null;
  function seguirAlerta(){
    if(sub==='seguir'){key='';pintar();return}abrir('seguir');return;
    hojaAbrir({t:'segal',view(){
      const v=seguimiento();const d=document.createElement('div');d.innerHTML=v.head+'<div class="__b">'+v.body+'</div>';
      const q=x=>d.querySelector(x);const kick=q('.top .kick'),tit=q('.top .h1'),bar=q('.top .bar5');const paso=bar&&bar.nextElementSibling?bar.nextElementSibling.outerHTML:'';
      const b=q('.__b');const cod=b.querySelector('.cdg'),tl=[...b.children].find(x=>x.querySelector&&x.querySelector('.tln')),tot=b.querySelector('.ln.t b');
      if(!tit){return {dlg:true,title:'Tu pedido',body:`<span class="ic">${IC.box}</span><h2>Tu pedido</h2><div style="width:100%;text-align:left">${b.innerHTML}</div>`,btns:'<div class="bb u"><button type="button" class="bs" data-h="x" style="height:50px;border-radius:14px;font-size:15px">Cerrar</button></div>'}}
      return {dlg:true,title:tit.textContent,body:`<div class="segal"><div class="sk">${kick?kick.innerHTML:''}</div><div class="st2">${tit.innerHTML}</div>${bar?bar.outerHTML:''}${paso}${cod?cod.outerHTML:''}${tl?tl.outerHTML:''}${tot?`<div class="stot"><span>Total</span><b>${tot.textContent}</b></div>`:''}</div>`,
        btns:'<div class="bb u"><button type="button" class="bp" data-h="det">Ver detalle completo</button><button type="button" class="bs" data-h="x" style="height:50px;border-radius:14px;font-size:15px">Cerrar</button></div>'}},
      on(a){if(a==='det'){hojaCerrar();abrir('seguir')}},
      alCerrar(){clearInterval(segIv)}});
    clearInterval(segIv);segIv=setInterval(()=>{if(!HO||HO.t!=='segal'){clearInterval(segIv);return}try{pintarHoja()}catch(_){}},2000);
  }
  function listo(){const o=F.ok||{tit:'¡Pedido enviado!',txt:'',cod:''};
    const h=`<div class="cdg" style="padding:24px 16px"><span style="width:64px;height:64px;border-radius:50%;background:#15803D;color:#FFFFFF;display:flex;align-items:center;justify-content:center">${S('<path d="m5 12 5 5 9-10"/>').replace('width="22" height="22"','width="34" height="34"')}</span><div style="font-size:24px;font-weight:800;margin-top:6px;color:#1F1A17">${E(o.tit)}</div><div class="cds" style="font-size:15px">${E(o.txt)}</div>${o.cod?`<div class="cdk" style="margin-top:8px">N.º de pedido</div><div style="font-size:26px;font-weight:800;letter-spacing:.08em;color:#1F1A17">${E(o.cod)}</div>`:''}</div>`+(SES()?'':U.note('Inicia sesión con Google para seguir tu pedido paso a paso desde cualquier teléfono.'));
    const foot=SES()?`<button type="button" class="cbar c" data-a="seguirult">Ver seguimiento</button><button type="button" class="b" data-a="inicio">Volver al inicio</button>`:`<button type="button" class="cbar c" data-a="google">Iniciar sesión para seguirlo</button><button type="button" class="b" data-a="inicio">Volver al inicio</button>`;
    return {head:top('Tu pedido','Listo'),body:h,foot}}
  function listoHoja(){const o=F.ok||{tit:'¡Pedido enviado!',txt:'',cod:''};setTimeout(confeti,350);vib([15,60,15]);
    if(F.ok&&!F.ok.__inst){F.ok.__inst=1;try{window.pdOfrecerInstalar&&window.pdOfrecerInstalar()}catch(_){}}
    hojaAbrir({t:'listo',view(){return {dlg:true,title:o.tit,
      body:`<span class="ic g okA"><svg viewBox="0 0 52 52" width="34" height="34" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 27l8 8 16-18"/></svg></span><h2>${E(o.tit)}</h2>${o.txt?`<p>${E(o.txt)}</p>`:''}${o.cod?`<div class="okcod"><span>N.º de pedido</span><b>${E(o.cod)}</b></div>`:''}${SES()?'':`<p style="font-size:13px">Inicia sesión con Google para seguir tu pedido paso a paso.</p>`}`,
      btns:'<div class="bb u">'+(SES()?`<button type="button" class="bp" data-h="seg">Ver seguimiento</button>`:`<button type="button" class="bp" data-h="g">Iniciar sesión para seguirlo</button>`)+`<button type="button" class="bs" data-h="x" style="height:50px;border-radius:14px;font-size:15px">Seguir comprando</button></div>`}},
      on(a){if(a==='seg'){hojaCerrar();F.seg=null;if(C.seg)C.seg.t=0;setTimeout(seguirAlerta,60)}if(a==='g'){hojaCerrar();try{window.pdIngresarConGoogle()}catch(_){}}}})}
  function perfil(){
    const u=SES(),m=(u&&u.user_metadata)||{},nom=m.full_name||m.name||'';
    const head=top('Mi cuenta',nom||'Perfil');
    if(!u)return {head,body:loginCard('Inicia sesión','Guarda tus datos y direcciones, y sigue tus pedidos desde cualquier teléfono.')+`<div class="cd"><div class="lnks"><button type="button" data-a="cuenta">${IC.pin}<span>Mis datos de entrega</span>${IC.chev}</button></div></div>`};
    const d=(window.pdDatosClienteGuardados&&window.pdDatosClienteGuardados())||{};
    let h=`<div class="cd" style="flex-direction:row;align-items:center;gap:14px"><span class="lg" style="border-radius:50%${m.avatar_url||m.picture?`;background-image:url('${E(m.avatar_url||m.picture)}')`:''}">${m.avatar_url||m.picture?'':ini(nom||'Cliente')}</span><span style="display:flex;flex-direction:column;min-width:0"><b style="font-size:17px">${E(nom||'Cliente')}</b><span style="font-size:14px;color:#6B5E55;overflow:hidden;text-overflow:ellipsis">${E(u.email||'')}</span></span></div>`;
    h+=`<div class="cd"><div class="lbl">Datos de entrega</div><div class="li"><span>Celular</span><b>${E(d.telefono||'—')}</b></div><div class="li"><span>Dirección</span><b style="text-align:right">${E(d.direccion||'—')}</b></div></div>`;
    h+=`<button type="button" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:54px;border-radius:14px;border:1px solid #F4C7C3;background:#FFFFFF;color:#B42318;font:800 16px PdInter,Inter,system-ui,sans-serif;cursor:pointer" data-a="salirCuenta"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/></svg>Cerrar sesión</button>`;
    return {head,body:h};
  }

  /* =============== VENTANAS (modales) con el diseño nuevo =============== */
  const HOJA_CSS=`
:host{z-index:2147483300}
.hbg{position:absolute;inset:0;background:rgba(31,26,23,.45);animation:fi .18s ease-out}
.qs{position:absolute;left:0;right:0;bottom:0;max-height:92%;background:#FFF9F5;border-radius:24px 24px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -8px 30px rgba(31,26,23,.18);animation:up .22s cubic-bezier(.2,.8,.2,1)}
.qs.full{top:0;max-height:none;border-radius:0}
.qs .grab{width:44px;height:5px;border-radius:999px;background:#E3D6CC;align-self:center;margin-top:10px;flex:0 0 auto}
.qs .hh{display:flex;align-items:center;gap:12px;padding:12px 16px;flex:0 0 auto}
.qs.full .hh{padding-top:calc(env(safe-area-inset-top,0px) + 12px);background:#FFFFFF;border-bottom:1px solid #F1E4DA}
.qs .hh .tt{flex:1 1 0%;min-width:0}
.qs .hh .k{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qs .hh h2{margin:0;font-size:18px;font-weight:800;line-height:1.2}
.qx{width:44px;height:44px;border-radius:14px;border:0;background:#C4410C;color:#FFFFFF;box-shadow:0 4px 12px rgba(196,65,12,.28);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex:0 0 auto}
.hb{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:4px 16px 16px;display:flex;flex-direction:column;gap:12px;scrollbar-width:none}
.hb::-webkit-scrollbar{display:none}
.hf{flex:0 0 auto;padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 14px);background:#FFFFFF;border-top:1px solid #F1E4DA;display:flex;flex-direction:column;gap:8px}
.bp{height:56px;border-radius:16px;border:0;background:#C4410C;color:#FFFFFF;font:800 16px PdInter,Inter,system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:0 14px}
.bp:disabled{background:#D9CCC3;cursor:default}
.bs{height:50px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font:800 15px PdInter,Inter,system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:0 14px}
.bs.r{color:#B42318}
.bt{height:44px;border:0;background:transparent;color:#6B5E55;font:700 15px PdInter,Inter,system-ui,sans-serif;cursor:pointer;width:100%}
.bt.r{color:#B42318;font-weight:800}
.est{padding:14px;border-radius:18px;background:#FDEBDF;display:flex;gap:12px;align-items:center}
.est.on{background:#E9F6EE}
.est .i{width:44px;height:44px;border-radius:14px;background:#FFFFFF;color:#9A330A;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.est.on .i{color:#15803D}
.est .tx{display:flex;flex-direction:column}.est .tx b{font-size:16px}.est .tx span{font-size:14px;color:#6B5E55}
.sem{padding:8px;border-radius:18px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;flex-direction:column;gap:2px}
.sem .lb{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55;padding:6px 12px}
.sem .d{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:12px;font-size:15px}
.sem .d span{font-weight:600}.sem .d.hoy{background:#FDEBDF}.sem .d.hoy span{font-weight:800}
.sem .d i{display:inline-flex;height:22px;padding:0 8px;border-radius:999px;background:#C4410C;color:#FFFFFF;font-size:12px;font-weight:800;font-style:normal;align-items:center;margin-left:6px}
.sem .d b.off{color:#6B5E55;font-weight:700}
.nt{font-size:13px;color:#6B5E55;line-height:1.45}
.cdh{padding:14px;border-radius:18px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;flex-direction:column;gap:10px}
.lbh{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55}
.dias{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px}
.dias::-webkit-scrollbar{display:none}
.dias button{flex:0 0 64px;display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 4px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;cursor:pointer;font-family:inherit}
.dias button i{font-style:normal;font-size:12px;font-weight:700;color:#6B5E55}.dias button b{font-size:20px;font-weight:800}.dias button small{font-size:11px;color:#6B5E55}
.dias button.on{border:0;background:#C4410C;color:#FFFFFF}.dias button.on i,.dias button.on small{color:#FFFFFF}
.horas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.horas button{height:46px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font:600 14px PdInter,Inter,system-ui,sans-serif;cursor:pointer}
.horas button.on{border:1.5px solid #C4410C;background:#FFF4EC;font-weight:800}
.qbox{padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;gap:12px;align-items:center}
.qbox .i{width:48px;height:48px;border-radius:14px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.qbox .tx{display:flex;flex-direction:column;min-width:0}.qbox .tx b{font-size:17px}.qbox .tx span{font-size:14px;color:#6B5E55}
.qp{font-size:15px;line-height:1.5}
.qst{display:flex;gap:2px;justify-content:center}
.qst button{width:48px;height:48px;border:0;background:transparent;padding:0;cursor:pointer;color:#D9CCC3;display:flex;align-items:center;justify-content:center}
.qst button svg{width:36px;height:36px}
.qst button.on{color:#E8A27A}.qst button.on svg{fill:#F2B48F}
.ben{display:flex;gap:10px;align-items:center;font-size:15px}
.ben span{width:28px;height:28px;border-radius:50%;background:#E9F6EE;color:#15803D;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.ben span svg{width:16px;height:16px;stroke-width:3}
.fh{display:flex;flex-direction:column;gap:6px}.fh label{font-size:14px;font-weight:700}
.fh input,.fh textarea{height:52px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:0 14px;font:500 16px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;outline:none;box-sizing:border-box;width:100%}
.fh textarea{height:auto;min-height:84px;padding:12px 14px;resize:none}
.fh input:focus,.fh textarea:focus{border-color:#C4410C}
.lc{display:flex;gap:10px;align-items:center;padding:12px;border-radius:14px;background:#FFF4EC}
.lc.on{background:#E9F6EE}
.lc .i{width:40px;height:40px;border-radius:12px;background:#FFFFFF;color:#C4410C;display:flex;align-items:center;justify-content:center;flex:0 0 auto}.lc.on .i{color:#15803D}
.lc .tx{display:flex;flex-direction:column;flex:1 1 0%;min-width:0}.lc .tx b{font-size:15px}.lc .tx span{font-size:13px;color:#6B5E55}
.two2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ms{font-size:14px;font-weight:700;color:#B42318}.ms.ok{color:#15803D}
.ava2{width:52px;height:52px;border-radius:50%;background:#FDEBDF center/cover no-repeat;color:#C4410C;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex:0 0 auto}
/* mapa */
.mq{display:flex;align-items:center;gap:10px;height:50px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:0 14px;color:#6B5E55;margin:12px 16px 0;flex:0 0 auto;box-sizing:border-box}
.mq input{flex:1 1 0%;min-width:0;border:0;outline:none;background:transparent;font:500 16px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;height:100%}
.mres{margin:6px 16px 0;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;overflow:hidden;flex:0 0 auto;max-height:240px;overflow-y:auto}
.mres button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;padding:12px 14px;border:0;border-top:1px solid #F1E4DA;background:#FFFFFF;text-align:left;cursor:pointer;font-family:inherit;color:#1F1A17}
.mres button:first-child{border-top:0}.mres button b{font-size:15px}.mres button span{font-size:13px;color:#6B5E55}
.mres .nd{padding:12px 14px;font-size:14px;color:#6B5E55}
.mz{position:relative;flex:1 1 0%;margin:12px 16px;border-radius:22px;overflow:hidden;background:#EFE6DE;border:1px solid #F1E4DA;min-height:200px}
.mz .mp{position:absolute;inset:0}
.mz .pin{position:absolute;left:50%;top:50%;width:44px;height:56px;transform:translate(-50%,-100%);pointer-events:none;z-index:500;transition:transform .15s}
.mz.mov .pin{transform:translate(-50%,-112%)}
.mz .tip{position:absolute;left:50%;top:calc(50% - 92px);transform:translateX(-50%);background:#1F1A17;color:#FFFFFF;font-size:13px;font-weight:700;padding:6px 10px;border-radius:10px;white-space:nowrap;z-index:500;pointer-events:none}
.mz .gps{position:absolute;right:12px;bottom:12px;width:48px;height:48px;border-radius:14px;border:0;background:#FFFFFF;color:#C4410C;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(31,26,23,.15);z-index:500;cursor:pointer}
.mdir{margin:0 16px;padding:12px;border-radius:16px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;gap:10px;align-items:center;flex:0 0 auto}
.mdir .i{width:40px;height:40px;border-radius:12px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.mdir .tx{display:flex;flex-direction:column;min-width:0}.mdir .tx b{font-size:15px}.mdir .tx span{font-size:13px;color:#6B5E55}
/* diálogo y aviso */
.dlg{position:absolute;left:24px;right:24px;top:50%;transform:translateY(-50%);background:#FFFFFF;border-radius:24px;padding:22px 18px 16px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;box-shadow:0 12px 40px rgba(31,26,23,.25);animation:pop .18s ease-out;max-width:420px;margin:0 auto}
.dlg .ic{width:56px;height:56px;border-radius:50%;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center}
.dlg .ic.r{background:#FDE8E8;color:#B42318}.dlg .ic.g{background:#E9F6EE;color:#15803D}
.dlg .ic svg{width:28px;height:28px}
.dlg h2{margin:0;font-size:19px;font-weight:800;line-height:1.3;white-space:pre-line}
.dlg p{margin:0;font-size:15px;color:#6B5E55;line-height:1.5;white-space:pre-line}
.dlg .bb{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%;margin-top:4px}
.dlg .bb.u{grid-template-columns:1fr}
.dlg .bb .bp{height:50px;border-radius:14px;font-size:15px}
.dlg .bb .bp.r{background:#B42318}
.dlg .fh{width:100%;text-align:left}
.qs.pg{animation:pin .18s ease-out;box-shadow:none}
.dlgp{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:28px 8px 8px}
.dlgp .ic{width:64px;height:64px;border-radius:50%;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center}
.dlgp .ic.r{background:#FDE8E8;color:#B42318}
.dlgp .ic svg{width:32px;height:32px}
.dlgp h2{margin:0;font-size:22px;font-weight:800;line-height:1.3;white-space:pre-line}
.dlgp p{margin:0;font-size:16px;color:#6B5E55;line-height:1.5;white-space:pre-line}
.dlgp .fh{width:100%;text-align:left}
.hf .bp.r{background:#B42318}
@keyframes pin{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
.tst{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 96px);background:#FFFFFF;color:#1F1A17;border:1px solid #F1E4DA;border-radius:14px;padding:14px 16px;font-size:15px;font-weight:600;display:flex;gap:10px;align-items:center;pointer-events:auto;animation:up .3s cubic-bezier(.2,.9,.3,1.2);box-shadow:0 12px 30px rgba(31,26,23,.16),0 8px 24px rgba(31,26,23,.25);max-width:520px;margin:0 auto}
.tst .ti{width:22px;height:22px;border-radius:50%;background:#15803D;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.tst.e .ti{background:#B42318}.tst.n .ti{background:#C4410C}
.tst .ti svg{width:14px;height:14px;stroke-width:3}
@keyframes up{from{transform:translateY(24px);opacity:.4}to{transform:none;opacity:1}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:translateY(-46%) scale(.96)}to{opacity:1;transform:translateY(-50%)}}
`;
  let HO=null,hHost=null,hRoot=null,hKey='',TS=null,tsT=0,hojaCola=Promise.resolve();
  const XI=S('<path d="M6 6l12 12M18 6 6 18"/>');
  /* Con una alerta abierta se oculta la pantalla «Estamos cerrados» de atrás, para que no se vean dos alertas encimadas */
  function hojaFondo(on){try{if(!document.getElementById('pdHojaFondoCss')){const st=document.createElement('style');st.id='pdHojaFondoCss';st.textContent='body.pdHojaOn #ppCerrado{visibility:hidden!important}';document.head.appendChild(st)}document.body.classList.toggle('pdHojaOn',!!on)}catch(_){}}
  function hojaAbrir(o){hojaFondo(1);if(HO&&HO.res&&HO!==o){const r=HO.res;HO.res=null;r(HO.cancel)}if(HO&&HO.alCerrar)try{HO.alCerrar()}catch(_){}HO=o;if(!o.sinHist)try{history.pushState({pdt:1,pdtM:1},'')}catch(_){}hKey='';pintarHoja()}
  function hojaCerrar(v,desdePop){const h=HO;if(!h)return;HO=null;hojaFondo(0);hKey='';pintarHoja();if(h.alCerrar)try{h.alCerrar(v)}catch(_){}if(h.res)h.res(v===undefined?h.cancel:v);if(!desdePop&&!h.sinHist&&history.state&&history.state.pdtM){ignorarPop=true;history.back()}}
  function asegurarHoja(){if(hHost)return;const w=$('pdAppShell');hHost=document.createElement('pd-tienda-hoja');(w||document.body).appendChild(hHost);hRoot=hHost.attachShadow({mode:'open'});try{PdPasos.flechas(hRoot)}catch(_){}
    hRoot.addEventListener('click',hClic);hRoot.addEventListener('input',hEntrada)}
  function pintarHoja(){
    if(!$('pdAppShell')&&!hHost){const wrap=document.createElement('header');wrap.id='pdAppShell';wrap.style.cssText='display:contents';document.body.appendChild(wrap)}
    asegurarHoja();
    const vis=!!HO||!!TS;hHost.style.display=vis?'':'none';hHost.style.pointerEvents='none';try{const nv=root&&root.querySelector('.nv');hHost.style.setProperty('--nvh',(nv?nv.offsetHeight:0)+'px');const ft=root&&root.querySelector('.foot');hHost.style.setProperty('--pdTstB',Math.max(nv?nv.offsetHeight:0,ft&&ft.offsetHeight?Math.round(innerHeight-ft.getBoundingClientRect().top):0)+'px')}catch(_){}
    if(!vis){if(hRoot.innerHTML)hRoot.innerHTML='';hKey='';hRoot.__qt=null;return}
    const act=hRoot.activeElement;if(HO&&act&&(act.tagName==='INPUT'||act.tagName==='TEXTAREA')&&hKey)return;
    const v=HO?HO.view():null;
    const pag=HO&&HO.t!=='listo'&&!(v&&v.dlg);/* solo la confirmación del pedido es ventana; todo lo demás es una página */
    const sh=!v?'':(v.dlg&&!pag)?`<div class="hbg"></div><section class="dlg" role="alertdialog" aria-modal="true" aria-label="${E(v.title)}">${v.body}${v.btns?(/class="bb/.test(v.btns)?v.btns:'<div class="bb u">'+v.btns+'</div>'):''}</section>`:
      `${pag?'':'<div class="hbg" data-h="x"></div>'}<section class="qs${pag?' full pg':''}${HO&&HO.t==='reserva'?' sinnav':''}" role="${pag?'region':'dialog'}"${pag?'':' aria-modal="true"'} aria-label="${E(v.title)}">${pag?'':'<div class="grab" aria-hidden="true"></div>'}<div class="hh">${pag?`<button type="button" class="qx bk${HO&&HO.t==='reserva'?' bkv':''}" data-h="${v.dlg?'no':'x'}" aria-label="Volver">${IC.back}</button>`:''}<div class="tt">${v.kick?`<div class="k">${E(v.kick)}</div>`:''}<h2>${E(v.dlg?(v.kick2||'Confirmar'):v.title)}</h2></div>${pag?(v.dlg||HO.t==='carrito'?'':cartBtn().replace('data-a="carrito"','data-h="carrito"')):`<button type="button" class="qx" data-h="x" aria-label="Cerrar">${XI}</button>`}</div>${v.raw||`<div class="hb">${v.dlg?`<div class="dlgp">${v.body}</div>`:v.body}${v.footIn&&v.foot?`<div class="hf in">${v.foot}</div>`:''}</div>`}${v.dlg?`<div class="hf">${v.btns||''}</div>`:v.foot&&!v.footIn?`<div class="hf">${v.foot}</div>`:''}</section>`;
    const tst=TS?`<div class="tst ${TS.k}" role="status"><span class="ti">${TS.k==='e'?S('<path d="M12 7v6"/><path d="M12 17h.01"/>'):TS.k==='n'?S('<path d="M12 8h.01"/><path d="M12 11v6"/>'):IC.check}</span><span>${E(TS.t)}</span></div>`:'';
    const k=(HO?HO.t+(HO.n||0):'')+'|'+sh+tst;if(k===hKey)return;
    const st=hRoot.querySelector('.hb'),y=st?st.scrollTop:0,mismo=hKey&&HO&&(hKey.startsWith(HO.t+(HO.n||0)+'|')||hRoot.__ho===HO);hRoot.__ho=HO;hKey=k;
    hRoot.innerHTML=`<style>${ESTILO}${HOJA_CSS}</style>${v&&v.css?v.css:''}${sh}${tst}`;
    {const t=HO?HO.t:null;if(mismo||(t&&hRoot.__qt===t&&Date.now()-(hRoot.__qtT||0)<600000)){hRoot.querySelectorAll('.qs,.hbg').forEach(x=>{x.style.animation='none'})}hRoot.__qt=t;hRoot.__qtT=Date.now()}
    const nb=hRoot.querySelector('.hb');if(nb&&mismo)nb.scrollTop=y;
    if(HO&&HO.despues)try{HO.despues(hRoot)}catch(e){console.warn(e)}
  }
  function hClic(e){const b=e.target.closest('[data-h]');if(!b||!HO)return;const a=b.dataset.h;if(!a)return;if(a==='x'){hojaCerrar(undefined);return}if(a==='carrito'){hojaCerrar(undefined);if(!CART().length){aviso('Tu pedido está vacío. Elige un negocio y agrega productos.');return}setTimeout(()=>abrir('carrito'),0);return}const i=a.indexOf(':');try{HO.on&&HO.on(i<0?a:a.slice(0,i),i<0?'':a.slice(i+1),b,e)}catch(err){console.warn(err)}}
  function hEntrada(e){const el=e.target,k=el.dataset&&el.dataset.hin;if(!k||!HO)return;HO.f=HO.f||{};HO.f[k]=el.value;if(HO.input)try{HO.input(k,el)}catch(_){}}
  const repintarHoja=()=>{hKey='';pintarHoja()};

  /* ---------- aviso corto (reemplaza al toast de siempre) ---------- */
  function aviso(t){t=String(t??'').trim();if(!t)return;const k=/no se pudo|error|falló|inválid|obligatori|primero|debes|falta|no hay|revisa|ingresa|escribe|elige/i.test(t)?'e':/agregad|listo|guardad|registrad|actualizad|eliminad|vaciad|correctamente|gracias|✓/i.test(t)?'':'n';
    TS={t,k};clearTimeout(tsT);tsT=setTimeout(()=>{TS=null;pintarHoja()},Math.min(6000,2200+t.length*40));pintarHoja()}
  const toastViejo=window.toast;
  window.toast=function(t){try{aviso(t)}catch(e){try{toastViejo&&toastViejo.apply(this,arguments)}catch(_){}}};
  window.pdAviso=function(t){aviso(t)};
  window.pdExito=function(t){aviso(t)};

  /* ---------- confirmar / informar / pedir un dato ---------- */
  function dialogo(tipo,texto,valor){return hojaCola=hojaCola.then(()=>new Promise(res=>{
    const raw=String(texto??'');const partes=raw.split('\n');const tit=partes[0],cuerpo=partes.slice(1).join('\n').trim();
    const pel=/borrar|eliminar|quitar|vaciar|anular|cancelar el pedido|cerrar sesión|rechaz/i.test(raw);
    hojaAbrir({t:'dlg',n:Math.random(),cancel:tipo==='prompt'?null:false,res,f:{v:valor??''},
      view(){const ic=tipo==='info'?`<span class="ic">${S('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>')}</span>`:pel?`<span class="ic r">${S('<path d="M12 8v5"/><path d="M12 16h.01"/><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>')}</span>`:`<span class="ic">${S('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><path d="M12 17.5v.01"/>')}</span>`;
        return {dlg:true,fija:tipo!=='info',title:tit,body:`${ic}<h2>${E(tit)}</h2>${cuerpo?`<p>${E(cuerpo)}</p>`:''}${tipo==='prompt'?`<div class="fh"><label for="hDv" style="position:absolute;width:1px;height:1px;overflow:hidden">${E(tit)}</label><input id="hDv" value="${E(this.f.v)}" data-hin="v" autocomplete="off"></div>`:''}`,btns:`<button type="button" class="bp${pel?' r':''}" data-h="si">${tipo==='info'?'Entendido':tipo==='prompt'?'Guardar':pel?'Sí, '+(raw.match(/borrar|eliminar|quitar|vaciar|anular|cerrar sesión|rechazar/i)||['continuar'])[0].toLowerCase():'Sí, continuar'}</button>${tipo==='info'?'':`<button type="button" class="bs" data-h="no">Cancelar</button>`}`,kick2:tipo==='info'?'Aviso':tipo==='prompt'?'Escribe el dato':'Confirmar'}},
      on(a){if(a==='si')hojaCerrar(tipo==='prompt'?this.f.v:true);if(a==='no')hojaCerrar(tipo==='prompt'?null:false)},
      despues(r){const i=r.getElementById('hDv');if(i&&!this.foc){this.foc=1;setTimeout(()=>{i.focus();i.select()},60)}}});
  }))}
  window.pdConfirmar=t=>dialogo('confirm',t);
  window.pdInfo=t=>dialogo('info',t);
  window.pdPedir=(t,v)=>dialogo('prompt',t,v);

  /* ---------- horario de atención ---------- */
  const DSEM=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const h12=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mi=m%60;return (h%12||12)+(mi?':'+String(mi).padStart(2,'0'):'')+' '+(h>=12?'p. m.':'a. m.')};
  function verHorario(id){const r=negPorId(id);if(!r)return;
    hojaAbrir({t:'horario',id:String(id),
      view(){const s=estado(r),hor=r.horario||r.horarios||r.horario_atencion||'',n=(()=>{try{return getLimaNow()}catch(e){return new Date()}})();
        const lun=new Date(n);lun.setDate(n.getDate()-((n.getDay()+6)%7));const AB=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];const dias=[];
        for(let i=0;i<7;i++){const f=new Date(lun);f.setDate(lun.getDate()+i);let rg=null;try{rg=window.getDailySchedule(hor,f)}catch(e){}const hc=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mi=m%60;return (h%12||12)+(mi?':'+String(mi).padStart(2,'0'):'')+' '+(h>=12?'pm':'am')};
          dias.push({d:f.getDay(),i,hoy:f.getDay()===n.getDay(),v:rg?(rg.tramos?rg.tramos.map(t=>hc(t.open)+' – '+hc(t.close)).join('\n'):hc(rg.open)+' – '+hc(rg.close)):'Cerrado'})}
        /* días con el mismo horario en una sola fila; hoy va aparte y resaltado */
        const gr=[];dias.filter(x=>!x.hoy).forEach(x=>{const g=gr.find(y=>y.v===x.v);if(g)g.d.push(x.d);else gr.push({v:x.v,d:[x.d]})});
        const hoyD=dias.find(x=>x.hoy);
        const pos=d=>(d+6)%7;/* lunes=0 … domingo=6 */
        const etq=L=>{const q=L.map(pos).sort((a,b)=>a-b),A=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];const tr=[];q.forEach(x=>{const u=tr[tr.length-1];if(u&&x===u[1]+1)u[1]=x;else tr.push([x,x])});
          const ps=[];tr.forEach(([a,b])=>{if(b-a>=2)ps.push(A[a]+' a '+A[b]);else for(let k=a;k<=b;k++)ps.push(A[k])});return ps.length>1?ps.slice(0,-1).join(', ')+' y '+ps[ps.length-1]:ps[0]};
        /* cada día en su fila, de lunes a domingo; hoy resaltado */
        const DL=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        let filas=dias.map(x=>`<div class="r${x.hoy?' hoy':''}"><span>${DL[x.d]}${x.hoy?' · hoy':''}</span><b class="${x.v==='Cerrado'?'off':''}">${E(x.v)}</b></div>`).join('');
        let nota='';try{const sem=window.pdHorarioSemana&&pdHorarioSemana();const no=(sem||[]).filter(x=>!x.activo).map(x=>x.dia.toLowerCase());if(no.length)nota='Los '+(no.length===1?no[0]+'s':no.join(', '))+' Pidemás no hace repartos, por eso ese día no se reciben pedidos.'}catch(e){}
        const on=s.tipo==='on',enCarta=sub==='negocio'&&String(F.neg)===String(r.id);
        const pill=s.tipo==='off'&&/^Abre /.test(s.txt||'')?s.pill+' · '+s.txt.replace(/^Abre /,'abre ').replace(/\.$/,''):(on?'Abierto ahora':s.pill);
        const CALI=S('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>');
        return {dlg:true,title:'Horario de '+nomN(r),body:`<div class="hc1"><div class="hcH"><span class="hcI">${IC.clock}</span><span class="hcT"><b>${nomH(r)}</b><span class="st ${E(s.tipo)}">${E(pill)}</span></span></div><div class="sm">${filas}</div>${nota?`<div style="display:flex;gap:10px;align-items:flex-start;margin-top:12px;padding:12px 14px;border-radius:14px;background:#FFF4EC;color:#9A330A;font-size:14.5px;line-height:1.4;font-weight:600">${IC.clock}<span>${E(nota)}</span></div>`:''}</div>`,
          btns:'<div class="bb hc1b">'+(on?'':`<button type="button" class="bp" data-h="reservar">${CALI}Reservar pedido</button>`)+(enCarta?`<button type="button" class="bs" data-h="cerrar">Cerrar</button>`:`<button type="button" class="bs" data-h="carta">Ver la carta</button>`)+'</div>'}},
      on(a){if(a==='cerrar'){hojaCerrar();return}if(a==='carta'){hojaCerrar();if(!(sub==='negocio'&&String(F.neg)===String(r.id)))abrirNeg(r.id)}if(a==='reservar'){hojaCerrar();setTimeout(()=>reservar(r.id),80)}}});
  }
  window.showRestaurantSchedule=verHorario;

  /* ---------- reservar un pedido: usa los horarios de siempre (pantalla vieja oculta) ---------- */
  function reservar(id){
    if(id)window.__pdProgNegId=String(id);
    document.documentElement.classList.add('pdtRes');
    try{window.pdProgramarPedido&&window.pdProgramarPedido()}catch(e){}
    setTimeout(()=>{const m=$('ppSlots');if(!m||m.hidden){document.documentElement.classList.remove('pdtRes');return}
      hojaAbrir({t:'reserva',n:0,
        view(){const m=$('ppSlots');if(!m||m.hidden){setTimeout(()=>hojaCerrar(true),0);return {title:'',body:''}}
          const ds=[...m.querySelectorAll('[data-a="dia"]')].map(b=>({i:b.dataset.i,on:b.classList.contains('on'),l:(b.querySelector('i')||{}).textContent||'',n:(b.querySelector('b')||{}).textContent||'',s:(b.querySelector('small')||{}).textContent||''}));
          const hs=[...m.querySelectorAll('[data-a="hora"]')].map(b=>({m:b.dataset.m,on:b.classList.contains('on'),t:b.textContent.trim()}));
          const nh=[...m.querySelectorAll('.nhi')].map(x=>[(x.querySelector('b')||{}).textContent||'',(x.querySelector('small')||{}).textContent||'']);
          const sel=hs.find(x=>x.on),dsel=ds.find(x=>x.on);
          return {kick:nh[0]?nh[0][0]:'Pedido programado',title:'¿Cuándo lo quieres?',
            body:`<div class="nt" style="font-size:15px">Elige cuándo quieres recibir tu pedido. Se lo enviamos al negocio para esa hora.</div><div class="cdh"><div class="lbh">Día</div><div class="dias">${ds.map(d=>`<button type="button" class="${d.on?'on':''}" aria-pressed="${d.on}" data-h="dia:${E(d.i)}"><i>${E(d.l)}</i><b>${E(d.n)}</b><small>${E(d.s)}</small></button>`).join('')}</div></div>
              <div class="cdh"><div class="lbh">Hora de entrega${nh[0]&&nh[0][1]?' · '+E(nh[0][1].toLowerCase()):''}</div><div class="horas">${hs.map(h=>`<button type="button" class="${h.on?'on':''}" aria-pressed="${h.on}" data-h="hora:${E(h.m)}">${E(h.t)}</button>`).join('')||'<span class="nt">No hay horas libres ese día.</span>'}</div><div class="nt">Es una hora aproximada.</div></div>`,
            foot:`${window.__pdProg?'<button type="button" class="bs" data-h="quitar" style="margin-bottom:8px">No reservar · pedir ahora</button>':''}<button type="button" class="bp" data-h="ok"${sel?'':' disabled'}>${sel?'Reservar para '+E((dsel&&/Hoy|Mañana/.test(dsel.l)?dsel.l.toLowerCase():dsel?dsel.l+' '+dsel.n:'')+' · '+sel.t):'Elige una hora'}</button>`}},
        on(a,v){const m=$('ppSlots');if(!m)return;if(a==='dia'||a==='hora'){const b=m.querySelector(`[data-a="${a}"][data-${a==='dia'?'i':'m'}="${CSS.escape(v)}"]`);if(b)b.click();this.n++;setTimeout(repintarHoja,30)}
          if(a==='quitar'){this.hecho=1;m.hidden=true;try{window.pdCancelarProgramado&&window.pdCancelarProgramado()}catch(_){}try{window.pdAviso&&window.pdAviso('Listo, ya no está reservado. Tu pedido se entrega lo antes posible.')}catch(_){}setTimeout(()=>{hojaCerrar(true);key='';pintar()},60);return}
          if(a==='ok'){const b=m.querySelector('[data-a="ok"]');if(b)b.click();this.hecho=1;setTimeout(()=>{hojaCerrar(true);key='';pintar()},60)}},
        alCerrar(){const m=$('ppSlots');if(!this.hecho&&m&&!m.hidden){const x=m.querySelector('[data-a="x"]');if(x)x.click();else m.hidden=true}document.documentElement.classList.remove('pdtRes')}});
    },120);
  }
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#ppCerrado [data-a="prog"]');if(!b||!document.documentElement.classList.contains('pdtApp'))return;e.stopImmediatePropagation();e.preventDefault();
    const c=$('ppCerrado');if(c)c.hidden=true;try{sessionStorage.setItem('pp_visto_'+new Date(new Date().toLocaleString('en-US',{timeZone:'America/Lima'})).toDateString(),'1')}catch(_){}reservar()},true);
  window.pdReservarNegocio=function(id){try{closeModal()}catch(_){}reservar(id)};
  window.pdProgramarNuevo=reservar;

  /* ---------- pedido de otro negocio ---------- */
  window.showRestaurantConflict=function(cur,nuevo){const a=negPorId(cur),b=negPorId(nuevo),na=a?nomN(a):'otro negocio',nb=b?nomN(b):'este negocio';
    hojaAbrir({t:'conf',view(){return {dlg:true,title:'Tu pedido es de otro negocio',body:`<span class="ic">${IC.cart}</span><h2>Tu pedido es de otro negocio</h2><p>Ya tienes ${nCart()} producto${nCart()===1?'':'s'} de ${E(na)} (${M(totCart())}). Cada pedido es de un solo negocio: termínalo o vacíalo para pedir en ${E(nb)}.</p>`,
      btns:`<div class="bb u"><button type="button" class="bp" data-h="ver">Ver mi pedido</button><button type="button" class="bs" data-h="vaciar" style="height:50px;border-radius:14px;font-size:15px;color:#B42318">Vaciar y pedir en ${E(nb)}</button></div>`}},
      on(x){if(x==='ver'){hojaCerrar();abrir('carrito')}if(x==='vaciar'){try{cart.splice(0,cart.length)}catch(_){}guardarCart();hojaCerrar();aviso('Listo, ya puedes pedir en '+nb+'.');key='';pintar()}}})};

  /* ---------- calificar ---------- */
  const STAR=S('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>');
  window.pdOpenRating=async function(id){
    let r;try{r=await SB().rpc('pedido_para_calificar',{p_pedido:id})}catch(e){r={error:e}}
    const o=r&&!r.error&&(Array.isArray(r.data)?r.data[0]:r.data);
    if(!o){aviso('No encontramos ese pedido.');return}
    if(o.ya_calificado){aviso('¡Este pedido ya fue calificado! Gracias.');return}
    if(String(o.estado)!=='entregado'){aviso('Podrás calificar cuando el pedido sea entregado.');return}
    const need=[o.negocio_id?'negocio':null,o.motorizado_id?'motorizado':null].filter(Boolean);
    hojaAbrir({t:'cal',n:0,val:{negocio:0,motorizado:0},f:{c:''},
      view(){const st=g=>`<div class="qst" role="group" aria-label="Estrellas">${[1,2,3,4,5].map(n=>`<button type="button" class="${n<=this.val[g]?'on':''}" data-h="st:${g}:${n}" aria-label="${n} estrella${n>1?'s':''}" aria-pressed="${n<=this.val[g]}">${STAR}</button>`).join('')}</div>`;
        const ok=need.every(k=>this.val[k]>0);
        return {kick:'Pedido #'+String(o.id).slice(0,8).toUpperCase(),title:'Califica tu pedido',
          body:(o.negocio_id?`<div class="cdh" style="align-items:center;text-align:center"><span style="font-size:15px;font-weight:700">¿Qué tal tu pedido de ${E(o.negocio_nombre||'el negocio')}?</span>${st('negocio')}</div>`:'')+(o.motorizado_id?`<div class="cdh" style="align-items:center;text-align:center"><span style="font-size:15px;font-weight:700">¿Qué tal el servicio de ${E(o.motorizado_nombre?String(o.motorizado_nombre).split(' ')[0]:'tu motorizado')}?</span>${st('motorizado')}</div>`:'')+`<div class="fh"><label for="hCm">Comentario (opcional)</label><textarea id="hCm" maxlength="300" data-hin="c" placeholder="Cuéntanos cómo te fue">${E(this.f.c)}</textarea></div>`,
          foot:`<button type="button" class="bp" data-h="env"${ok&&!this.env?'':' disabled'}>${this.env?'Enviando…':'Enviar calificación'}</button>`}},
      async on(a,v){if(a==='st'){const [g,n]=v.split(':');this.val[g]=+n;this.n++;repintarHoja();return}
        if(a==='env'){this.env=1;repintarHoja();const {error}=await SB().from('calificaciones').insert({pedido_id:o.id,negocio_id:o.negocio_id||null,motorizado_id:o.motorizado_id||null,estrellas_negocio:this.val.negocio||null,estrellas_motorizado:this.val.motorizado||null,comentario:String(this.f.c||'').trim()||null});
          if(error&&String(error.code)!=='23505'){this.env=0;repintarHoja();aviso('No se pudo enviar la calificación. Inténtalo más tarde.');return}
          try{const k='pidemas_calificados',m=JSON.parse(localStorage.getItem(k)||'{}');m[o.id]=this.val.negocio||this.val.motorizado||5;localStorage.setItem(k,JSON.stringify(m))}catch(_){}
          hojaCerrar();aviso('¡Gracias por tu calificación!');key='';pintar()}}});
  };

  /* ---------- cuenta: iniciar sesión y mis datos ---------- */
  const GOO='<svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  /* Ingreso con código por WhatsApp (Supabase Auth · proveedor Twilio con canal WhatsApp) */
  const SBc=()=>{try{if(typeof sb!=='undefined'&&sb)return sb}catch(_){}return window.sb||null};
  const telPE=v=>{let d=String(v||'').replace(/\D/g,'');if(d.startsWith('51')&&d.length===11)d=d.slice(2);return /^9\d{8}$/.test(d)?'+51'+d:''};
  /* Interruptor: el botón de WhatsApp se muestra a todos cuando WA_ON=true (Twilio ya configurado en Supabase).
     Para probarlo antes en un celular: abrir pidemas.pe/?wa=1 una vez. */
  const WA_ON=false;
  try{const q=new URLSearchParams(location.search).get('wa');if(q==='1')localStorage.setItem('pd_wa_prueba','1');if(q==='0')localStorage.removeItem('pd_wa_prueba')}catch(_){}
  /* Facebook: se muestra a todos con FB_ON=true (proveedor Facebook activo en Supabase). Para probar antes: pidemas.pe/?fb=1 */
  const FB_ON=false;
  try{const q=new URLSearchParams(location.search).get('fb');if(q==='1')localStorage.setItem('pd_fb_prueba','1');if(q==='0')localStorage.removeItem('pd_fb_prueba')}catch(_){}
  const fbVisible=()=>{try{return FB_ON||localStorage.getItem('pd_fb_prueba')==='1'}catch(_){return FB_ON}};
  const FBI='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#FFFFFF" d="M13.4 19.5v-6h2l.3-2.4h-2.3V9.6c0-.7.2-1.2 1.2-1.2h1.2V6.3c-.2 0-1-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.8h-2v2.4h2v6z"/></svg>';
  const waVisible=()=>{try{return WA_ON||localStorage.getItem('pd_wa_prueba')==='1'}catch(_){return WA_ON}};
  const WAI='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>';
  function entrar(){hojaAbrir({t:'login',modo:'',f:{tel:'',cod:''},msg:'',busy:0,view(){
      if(this.modo)return vistaWA(this);
      /* Iniciar sesión: alerta al centro, compacta y clara (tienda principal y tienda de cada negocio) */
      const sv=d=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#C4410C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
      const ben=(ic,t,s)=>`<div style="display:flex;gap:12px;align-items:center"><span style="width:40px;height:40px;border-radius:12px;background:#FDEBDF;display:flex;align-items:center;justify-content:center;flex:none">${ic}</span><span style="display:flex;flex-direction:column;min-width:0;text-align:left"><b style="font-size:15px;color:#1F1A17">${t}</b><span style="font-size:13.5px;color:#6B5E55;line-height:1.35">${s}</span></span></div>`;
      return {dlg:true,title:'Inicia sesión',body:`<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:0;padding-top:4px">
<img src="logo-pidemas-pe.svg?v=420ba567e9" alt="pidemas.pe" style="display:block;width:196px;max-width:72%;height:auto;margin:10px auto 20px">
<h2 style="margin:0;font-size:23px;line-height:1.2;font-weight:800;color:#1F1A17">Entra en un toque</h2>
<p style="margin:8px 0 18px;font-size:15px;line-height:1.45;color:#6B5E55">${(fbVisible()||waVisible())?'Elige cómo quieres entrar. Sin contraseñas.':'Con tu cuenta de Google. Sin contraseñas ni formularios.'}</p>
<div style="width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:14px;padding:16px;border-radius:18px;background:#FFF9F5;border:1px solid #F1E4DA">
${ben(sv('<path d="M3 12h3l3-8 4 16 3-8h5"/>'),'Sigue tu pedido en vivo','Te avisamos cuando lo aceptan, sale y llega')}
${ben(sv('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),'Tus datos listos','Nombre, celular y dirección se llenan solos')}
${ben(sv('<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>'),'Pide de nuevo','Repite tus pedidos favoritos con un toque')}
</div></div>`,
        btns:`<div class="bb u" style="gap:6px"><button type="button" class="bp" data-h="g" style="gap:12px"><span style="width:30px;height:30px;border-radius:50%;background:#FFFFFF;display:flex;align-items:center;justify-content:center">${GOO}</span>Continuar con Google</button>${fbVisible()?`<button type="button" class="bs" data-h="fb" style="gap:10px">${FBI}Continuar con Facebook</button>`:''}${waVisible()?`<button type="button" class="bs" data-h="wa" style="gap:10px;color:#146C36">${WAI}Recibir un código por WhatsApp</button>`:''}<button type="button" class="bt" data-h="x">Ahora no</button><small style="display:block;text-align:center;font-size:12.5px;color:#6B5E55;line-height:1.4;margin-top:2px">Solo usamos tus datos para tus pedidos. <a href="/privacidad/" target="_blank" rel="noopener" style="color:#9A330A;font-weight:700">Privacidad</a></small></div>`}},
    input(k,el){if(k==='cod'&&String(el.value).replace(/\D/g,'').length===6&&!this.busy)this.on('vcod')},
    async on(a){const H=this;
      if(a==='g'){hojaCerrar();try{window.pdIngresarConGoogle()}catch(e){aviso('No se pudo abrir Google. Inténtalo de nuevo.')}return}
      if(a==='fb'){hojaCerrar();try{await window.pdIngresarConFacebook()}catch(e){aviso(/provider is not enabled|Unsupported provider/i.test(String(e&&e.message))?'El ingreso con Facebook aún no está activo. Entra con Google por ahora.':'No se pudo abrir Facebook. Inténtalo de nuevo.')}return}
      if(a==='wa'){H.modo='tel';H.msg='';repintarHoja();setTimeout(()=>{try{hRoot.getElementById('waTel').focus()}catch(_){}},80);return}
      if(a==='volver'){H.modo=H.modo==='cod'?'tel':'';H.msg='';repintarHoja();return}
      if(a==='env'||a==='reenv'){const t=telPE(H.f.tel);if(!t){H.msg='Escribe tu celular de 9 dígitos (empieza con 9).';repintarHoja();return}
        const c=SBc();if(!c){H.msg='Sin conexión. Inténtalo de nuevo.';repintarHoja();return}
        H.busy=1;H.msg='';repintarHoja();
        try{const {error}=await c.auth.signInWithOtp({phone:t,options:{channel:'whatsapp'}});if(error)throw error;
          H.tel=t;H.modo='cod';H.f.cod='';H.msg=a==='reenv'?'Te enviamos un código nuevo.':'';}
        catch(e){const m=String(e&&e.message||'');H.msg=/provider|phone.*disabled|unsupported/i.test(m)?'El ingreso por WhatsApp aún no está activo. Entra con Google por ahora.':/rate|seconds|security purposes/i.test(m)?'Espera un minuto antes de pedir otro código.':'No pudimos enviar el código. Revisa tu número e inténtalo de nuevo.'}
        H.busy=0;repintarHoja();if(H.modo==='cod')setTimeout(()=>{try{hRoot.getElementById('waCod').focus()}catch(_){}},80);return}
      if(a==='vcod'){const k=String(H.f.cod||'').replace(/\D/g,'');if(k.length!==6){H.msg='El código tiene 6 números.';repintarHoja();return}
        const c=SBc();if(!c)return;H.busy=1;H.msg='';repintarHoja();
        try{const {error}=await c.auth.verifyOtp({phone:H.tel,token:k,type:'sms'});if(error)throw error;
          try{LSC.set({telefono:H.tel.replace('+51','')})}catch(_){}
          hojaCerrar();aviso('Listo, ya iniciaste sesión.');setTimeout(()=>{key='';pintar()},300)}
        catch(e){H.busy=0;H.msg='Ese código no es correcto o ya venció. Revísalo o pide uno nuevo.';repintarHoja()}}
    }})}
  function vistaWA(H){
    const enviando=H.busy?'<span class="eq" aria-hidden="true" style="width:18px;height:18px;border-width:3px"></span>':'';
    const err=H.msg?`<div role="status" style="margin-top:12px;padding:10px 12px;border-radius:12px;background:${/nuevo/.test(H.msg)?'#E7F5EC;color:#146C36':'#FFF4E5;color:#8A4B00'};font-size:14px;line-height:1.4;text-align:left">${E(H.msg)}</div>`:'';
    const cab=`<div style="display:flex;flex-direction:column;align-items:center;text-align:center"><span style="width:60px;height:60px;border-radius:18px;background:#E7F5EC;color:#146C36;display:flex;align-items:center;justify-content:center;margin:6px 0 14px">${WAI.replace('width="20" height="20"','width="30" height="30"')}</span>`;
    if(H.modo==='tel')return {dlg:true,title:'Ingresa con WhatsApp',
      body:cab+`<h2 style="margin:0;font-size:22px;font-weight:800;color:#1F1A17">Ingresa con WhatsApp</h2><p style="margin:8px 0 16px;font-size:15px;line-height:1.45;color:#6B5E55">Te enviaremos un código de 6 números a tu WhatsApp.</p></div>
<div style="width:100%;box-sizing:border-box;text-align:left"><label for="waTel" style="display:block;font-size:14px;font-weight:700;color:#1F1A17;margin-bottom:6px">Tu celular</label>
<div style="display:flex;align-items:center;width:100%;box-sizing:border-box;height:56px;border-radius:14px;border:1.5px solid #E2D6CD;background:#FFFFFF;overflow:hidden"><span style="padding:0 12px 0 14px;font-size:17px;font-weight:700;color:#6B5E55;border-right:1px solid #F1E4DA;height:100%;display:flex;align-items:center">+51</span><input id="waTel" data-hin="tel" inputmode="tel" autocomplete="tel-national" maxlength="11" placeholder="987 654 321" value="${E(H.f.tel||'')}" style="flex:1;min-width:0;border:0;outline:none;height:100%;padding:0 14px;font:inherit;font-size:18px;font-weight:700;letter-spacing:.04em;color:#1F1A17;background:transparent"></div>${err}</div>`,
      btns:`<div class="bb u" style="gap:6px"><button type="button" class="bp" data-h="env"${H.busy?' disabled':''} style="gap:10px">${enviando||WAI}${H.busy?'Enviando…':'Enviarme el código'}</button><button type="button" class="bt" data-h="volver">Volver</button></div>`};
    const tel=String(H.tel||'').replace('+51','').replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3');
    return {dlg:true,title:'Escribe el código',
      body:cab+`<h2 style="margin:0;font-size:22px;font-weight:800;color:#1F1A17">Escribe el código</h2><p style="margin:8px 0 16px;font-size:15px;line-height:1.45;color:#6B5E55">Lo enviamos por WhatsApp al <b style="color:#1F1A17;white-space:nowrap">${E(tel)}</b>.</p></div>
<label for="waCod" class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Código de 6 números</label>
<input id="waCod" data-hin="cod" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" value="${E(H.f.cod||'')}" style="display:block;width:100%;box-sizing:border-box;height:64px;border-radius:16px;border:1.5px solid #E2D6CD;background:#FFFFFF;text-align:center;font:inherit;font-size:30px;font-weight:800;letter-spacing:.5em;padding-left:.5em;color:#1F1A17;outline:none">${err}`,
      btns:`<div class="bb u" style="gap:6px"><button type="button" class="bp" data-h="vcod"${H.busy?' disabled':''} style="gap:10px">${enviando}${H.busy?'Verificando…':'Entrar'}</button><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px"><button type="button" class="bt" data-h="volver">Cambiar número</button><button type="button" class="bt" data-h="reenv">Enviar otro código</button></div></div>`};
  }

  const LSC={get(){try{return JSON.parse(localStorage.getItem('pidemas_customer_info')||'null')||{}}catch(e){return {}}},set(o){try{localStorage.setItem('pidemas_customer_info',JSON.stringify({...LSC.get(),...o}))}catch(e){}}};
  function misDatos(op){
    const d=(window.pdDatosClienteGuardados&&window.pdDatosClienteGuardados())||{};
    hojaAbrir({...(op||{}),t:'datos',n:0,f:{nombre:d.nombre||'',telefono:d.telefono||'',correo:d.correo||'',direccion:d.direccion||'',referencia:d.referencia||''},lat:d.lat,lng:d.lng,msg:'',ok:0,
      view(){const u=SES(),m=(u&&u.user_metadata)||{},f=this.f,on=this.lat!=null&&this.lng!=null,av=m.avatar_url||m.picture||'';
        return {kick:'Mi cuenta',title:'Mis datos',footIn:true,
          body:(u?`<div class="cdh" style="flex-direction:row;align-items:center;gap:12px"><span class="ava2"${av?` style="background-image:url('${E(av)}')"`:''}>${av?'':ini(f.nombre||m.full_name||'Cliente')}</span><span style="display:flex;flex-direction:column;min-width:0"><b style="font-size:16px">${E(m.full_name||m.name||f.nombre||'Cliente')}</b><span style="font-size:14px;color:#6B5E55;overflow:hidden;text-overflow:ellipsis">${E(u.email||'')}</span></span></div>`:'')+
            `<div class="cdh"><div class="lbh">Datos para tus pedidos</div><div class="nt">Así te contactarán el negocio y el motorizado.</div><div class="fh"><label for="hNo">Nombre</label><input id="hNo" value="${E(f.nombre)}" data-hin="nombre" autocomplete="name"></div><div class="fh"><label for="hTe">Celular</label><input id="hTe" inputmode="tel" value="${E(f.telefono)}" data-hin="telefono" autocomplete="tel" placeholder="9 dígitos"></div></div>
            <div class="cdh"><div class="lbh">Dirección de entrega</div><div class="fh"><label for="hDi">Dirección</label><input id="hDi" value="${E(f.direccion)}" data-hin="direccion" placeholder="Ej. Av. Grau 1234, Piura" autocomplete="street-address"></div><div class="fh"><label for="hRe">Referencia</label><input id="hRe" value="${E(f.referencia)}" data-hin="referencia" placeholder="Ej. Frente al parque, portón negro"></div>
            <div class="lc${on?' on':''}${this.busc?' busc':''}${this.okFx?' fx':''}"><span class="i">${this.busc?'<span class="spin"></span>':on?IC.check:IC.pin}</span><span class="tx"><b>${this.busc?'Buscando tu ubicación…':on?'Ubicación guardada':'Sin ubicación guardada'}</b><span>${this.busc?'Acepta el permiso de ubicación si tu celular lo pide.':E(this.locMsg||(on?'El delivery se calcula con este punto.':'Márcala para que el delivery se calcule solo.'))}</span></span></div>
            <div class="two2"><button type="button" class="bs${this.busc?' cargando':''}" data-h="gps"${this.busc?' disabled':''}>${this.busc?'<span class="spin"></span>Buscando…':IC.gps+'Mi ubicación'}</button><button type="button" class="bs" data-h="mapa">${IC.map}${on?'Cambiar':'Marcar'} en mapa</button></div></div>`+(this.msg?`<div class="ms${this.ok?' ok':''}">${E(this.msg)}</div>`:''),
          foot:`<button type="button" class="bp" data-h="guardar"${this.busy?' disabled':''}>${this.busy?'Guardando…':'Guardar mis datos'}</button>${u?`<button type="button" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:54px;border-radius:14px;border:1px solid #F4C7C3;background:#FFFFFF;color:#B42318;font:800 16px PdInter,Inter,system-ui,sans-serif;cursor:pointer;margin-top:8px" data-h="salir"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/></svg>Cerrar sesión</button>`:''}`}},
      async guardarUb(lat,lng){this.lat=lat;this.lng=lng;LSC.set({lat,lng});const u=SES();if(u){const {data:r,error}=await SB().auth.updateUser({data:{delivery_lat:lat,delivery_lng:lng}});if(error)throw error;try{pdClienteSesion=r.user||u}catch(_){}}},
      async on(a){const f=this.f;
        if(a==='gps'){if(!navigator.geolocation){this.locMsg='Este teléfono no permite obtener la ubicación.';repintarHoja();return}this.locMsg='Buscando tu ubicación… acepta el permiso si tu celular lo pide.';this.busc=true;this.okFx=false;this.n++;repintarHoja();
          navigator.geolocation.getCurrentPosition(async p=>{try{await this.guardarUb(Number(p.coords.latitude.toFixed(7)),Number(p.coords.longitude.toFixed(7)));this.locMsg='Listo, tomamos tu ubicación y quedó guardada.';this.okFx=true;try{aviso('Listo, tomamos tu ubicación.')}catch(_){}}catch(e){this.locMsg='No se pudo guardar: '+(e.message||'')}this.busc=false;this.n++;repintarHoja()},e=>{this.locMsg=e&&e.code===1?'El navegador bloqueó tu ubicación. Permítela en los ajustes del sitio y vuelve a intentarlo.':'No se pudo obtener tu ubicación. Activa el GPS del teléfono.';this.busc=false;this.n++;repintarHoja()},{enableHighAccuracy:true,timeout:15000,maximumAge:0});return}
        if(a==='mapa'){const yo=this;const c=yo.lat!=null?{lat:Number(yo.lat),lng:Number(yo.lng)}:null;const r=await window.pdMapaElegir({titulo:'Tu ubicación de entrega',centro:c,tip:'Mueve el mapa hasta tu casa u oficina',volverA:yo});
          if(r){try{await yo.guardarUb(r.lat,r.lng);yo.locMsg='Ubicación guardada en tu cuenta.';if(r.linea&&!String(yo.f.direccion||'').trim())yo.f.direccion=[r.linea,r.sub].filter(Boolean).join(', ')}catch(e){yo.locMsg='No se pudo guardar: '+(e.message||'')}}
          yo.n++;repintarHoja();return}
        if(a==='guardar'){if(!String(f.nombre||'').trim()){this.msg='Escribe tu nombre completo.';this.ok=0;repintarHoja();return}const tel=String(f.telefono||'').replace(/\D/g,'');if(tel&&tel.length<9){this.msg='Revisa tu número de celular (9 dígitos).';this.ok=0;repintarHoja();return}
          this.busy=1;this.msg='';repintarHoja();
          const data={full_name:f.nombre.trim(),phone:String(f.telefono||'').trim(),contact_email:String(f.correo||'').trim(),address:String(f.direccion||'').trim(),address_reference:String(f.referencia||'').trim(),delivery_lat:this.lat??null,delivery_lng:this.lng??null};
          LSC.set({nombre_cliente:data.full_name,telefono_cliente:data.phone,direccion:data.address,referencia:data.address_reference,lat:data.delivery_lat,lng:data.delivery_lng});
          const u=SES();if(!u){this.busy=0;hojaCerrar();aviso('Datos guardados en este teléfono.');key='';pintar();return}
          try{const {data:r,error}=await SB().auth.updateUser({data});if(error)throw error;try{window.pdActualizarCuentaCliente&&window.pdActualizarCuentaCliente(r.user||u)}catch(_){}this.busy=0;hojaCerrar();aviso('Tus datos se guardaron.');key='';pintar()}
          catch(e){this.busy=0;this.msg='Se guardó en este teléfono, pero no en tu cuenta: '+(e.message||'inténtalo de nuevo.');this.ok=0;repintarHoja()}return}
        if(a==='salir'){if(!(await window.pdConfirmar('¿Cerrar sesión en este teléfono?')))return;try{const {error}=await SB().auth.signOut();if(error)throw error;try{window.pdActualizarCuentaCliente&&window.pdActualizarCuentaCliente(null)}catch(_){}aviso('Sesión cerrada.');C.hist=null;key='';pintar()}catch(e){aviso('No se pudo cerrar la sesión: '+(e.message||''))}}}});
  }
  window.pdAbrirCuentaCliente=function(){SES()?misDatos():entrar()};
  window.pdMostrarPerfilCliente=window.pdAbrirCuentaCliente;
  window.pdMisDatos=misDatos;

  /* ---------- elegir ubicación en el mapa (pantalla completa) ---------- */
  const PIURA={lat:-5.1945,lng:-80.6328},PINSVG='<svg viewBox="0 0 40 52" width="100%" height="100%" aria-hidden="true"><path d="M20 51c0 0 18-18.6 18-31A18 18 0 0 0 2 20c0 12.4 18 31 18 31z" fill="#C4410C"/><circle cx="20" cy="20" r="7" fill="#FFFFFF"/></svg>';
  let Lp=null;function leaflet(){if(window.L&&L.map)return Promise.resolve(L);if(Lp)return Lp;Lp=new Promise((ok,ko)=>{const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>ok(window.L);s.onerror=()=>{Lp=null;ko(new Error('No cargó el mapa'))};document.head.appendChild(s)});return Lp}
  async function inversa(c){try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=es&lat='+c.lat+'&lon='+c.lng);const j=await r.json();const a=j.address||{};const calle=[a.road||a.pedestrian||a.footway||a.residential,a.house_number].filter(Boolean).join(' ');const zona=a.neighbourhood||a.suburb||a.quarter||a.city_district||a.hamlet||'';const ciudad=a.city||a.town||a.village||a.county||'';return {linea:calle||zona||j.name||'',sub:[calle?zona:'',ciudad].filter(Boolean).join(', ')}}catch(e){return null}}
  async function buscarDir(q){const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es&countrycodes=pe&viewbox=-80.78,-5.08,-80.52,-5.30&q='+encodeURIComponent(q+(/piura|castilla|veintis|sullana|paita|catacaos/i.test(q)?'':', Piura')));const j=await r.json();return (Array.isArray(j)?j:[]).map(x=>({lat:Number(x.lat),lng:Number(x.lon),nom:(x.name||String(x.display_name).split(',')[0]),sub:String(x.display_name).split(',').slice(1,4).join(',').trim()}))}
  window.pdMapaElegir=function(o){o=o||{};const volver=o.volverA&&HO===o.volverA?HO:null;return new Promise(res=>{
    let mapa=null,ult=null,tRev=0,tq=0;
    hojaAbrir({t:'mapa',res:v=>{res(v);if(volver)setTimeout(()=>{hojaAbrir(volver)},30)},cancel:null,
      view(){return {full:true,kick:'Entrega',title:o.titulo||'¿Dónde entregamos?',css:'<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">',
        raw:`<label class="mq">${IC.search}<span style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar dirección</span><input id="hMq" placeholder="Busca tu calle o una referencia" enterkeyhint="search" autocomplete="off"></label><div class="mres" id="hMr" hidden></div>
          <div class="mz" id="hMz"><div class="mp" id="hMp"></div><div class="pin">${PINSVG}</div><div class="tip" id="hMt">${E(o.tip||'Mueve el mapa hasta el lugar')}</div><button type="button" class="gps" data-h="gps" aria-label="Usar mi ubicación actual">${IC.gps}</button></div>
          <div class="mdir"><span class="i">${IC.pin}</span><span class="tx"><b id="hMd">Cargando mapa…</b><span id="hMs"></span></span></div>`,
        foot:`<button type="button" class="bp" data-h="ok">Confirmar esta ubicación</button>`}},
      despues(r){if(this.ini)return;this.ini=1;const el=r.getElementById('hMp'),mz=r.getElementById('hMz'),d=r.getElementById('hMd'),sb2=r.getElementById('hMs'),q=r.getElementById('hMq'),rs=r.getElementById('hMr');
        const rev=()=>{if(!mapa)return;const c=mapa.getCenter();d.textContent='Buscando dirección…';sb2.textContent=c.lat.toFixed(6)+', '+c.lng.toFixed(6);clearTimeout(tRev);tRev=setTimeout(async()=>{const x=await inversa(c);const n=mapa.getCenter();if(Math.abs(n.lat-c.lat)>1e-6||Math.abs(n.lng-c.lng)>1e-6)return;ult=x;d.textContent=x&&x.linea?x.linea:'Punto marcado en el mapa';sb2.textContent=x&&x.sub?x.sub:c.lat.toFixed(6)+', '+c.lng.toFixed(6)},500)};
        const ini=o.centro||PIURA;
        leaflet().then(L=>{mapa=L.map(el,{zoomControl:false}).setView([ini.lat,ini.lng],o.centro?18:15);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(mapa);
          mapa.on('movestart',()=>{mz.classList.add('mov');const t=r.getElementById('hMt');if(t)t.style.display='none'});mapa.on('moveend',()=>{mz.classList.remove('mov');rev()});setTimeout(()=>{mapa.invalidateSize();rev()},80);this.mapa=mapa})
          .catch(()=>{d.textContent='No se pudo cargar el mapa';sb2.textContent='Revisa tu conexión e inténtalo de nuevo.'});
        const correr=async()=>{const v=q.value.trim();if(v.length<3){rs.hidden=true;return}rs.hidden=false;rs.innerHTML='<div class="nd">Buscando…</div>';try{const L2=await buscarDir(v);rs.innerHTML=L2.length?L2.map(x=>`<button type="button" data-h="res:${x.lat},${x.lng}"><b>${E(x.nom)}</b><span>${E(x.sub)}</span></button>`).join(''):'<div class="nd">No encontramos esa dirección. Mueve el mapa hasta el lugar.</div>'}catch(e){rs.innerHTML='<div class="nd">No se pudo buscar. Revisa tu conexión.</div>'}};
        q.addEventListener('input',()=>{clearTimeout(tq);tq=setTimeout(correr,600)});q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(tq);correr()}});},
      on(a,v,b){if(a==='res'){const [la,ln]=v.split(',').map(Number);const rs=hRoot.getElementById('hMr');if(rs)rs.hidden=true;const q=hRoot.getElementById('hMq');if(q)q.blur();if(mapa)mapa.setView([la,ln],18);return}
        if(a==='gps'){if(!navigator.geolocation)return;b.style.opacity=.5;navigator.geolocation.getCurrentPosition(p=>{b.style.opacity=1;if(mapa)mapa.setView([p.coords.latitude,p.coords.longitude],18)},()=>{b.style.opacity=1;aviso('No se pudo obtener tu ubicación. Activa el GPS.')},{enableHighAccuracy:true,timeout:12000,maximumAge:0});return}
        if(a==='ok'){if(!mapa){aviso('Espera a que cargue el mapa.');return}const c=mapa.getCenter();hojaCerrar({lat:Number(c.lat.toFixed(6)),lng:Number(c.lng.toFixed(6)),linea:ult&&ult.linea||'',sub:ult&&ult.sub||''})}}});
  })};
  /* el botón atrás del teléfono cierra primero la ventana abierta */
  addEventListener('popstate',e=>{if(window.__pdPopPropio)return;if(ignorarPop)return;if(HO){e.stopImmediatePropagation();hojaCerrar(undefined,true)}},true);

  /* ---------- menú y pintado ---------- */
  function nav(){
    if(sub==='negocio'||sub==='producto'||sub==='carrito'||sub==='seguir')return '';
    const it=[['inicio','Inicio',IC.home],['buscar','Buscar',IC.search],['pedidos','Pedidos',IC.box],['perfil','Perfil',IC.user]];
    const curso=ultimoPedido();
    return `<nav class="nv" aria-label="Menú principal">${it.map(x=>`<button type="button" data-t="${x[0]}" class="${!sub&&tab===x[0]?'on':''}"${!sub&&tab===x[0]?' aria-current="page"':''}><span class="i">${x[2]}</span>${x[1]}${x[0]==='pedidos'&&curso?'<span class="bd" style="top:2px;right:calc(50% - 26px)">1</span>':''}</button>`).join('')}</nav>`;
  }
  const IGN=new Set(['pdAppShell','ppCerrado','cartaModalNegocio','pdCartaCartBar','toast']);
  function tapada(){
    const W=innerWidth,H=innerHeight;
    for(const el of document.body.children){
      if(IGN.has(el.id)||/^(SCRIPT|STYLE|PD-PASOS-PEDIDO|PD-VENTANA)$/.test(el.tagName))continue;
      if(el.id==='modal'&&document.documentElement.classList.contains('pdtCk')&&ck())continue;
      const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0||cs.pointerEvents==='none')continue;
      const r=el.getBoundingClientRect();if(r.width*r.height<W*H*0.45)continue;return true;
    }
    return false;
  }
  function vista(){
    if(sub==='negocio')return negocio();if(sub==='producto')return producto();if(sub==='carrito')return carrito();if(sub==='seguir')return seguimiento();if(sub==='listo')return listo();
    return tab==='pedidos'?pedidos():tab==='perfil'?perfil():inicio();
  }
  const cls=(el,c,on)=>{if(el&&el.classList.contains(c)!==!!on)el.classList.toggle(c,!!on)};
  let alCat=false,favPop=null,ubicT=0,ubicPrev=false;
  function pintar(){
    const H=document.documentElement;
    if(sub!=='carrito'&&H.classList.contains('pdtCk'))cerrarCk();
    if(sub==='carrito'&&ck())cls(H,'pdtCk',1);
    const tp=tapada();if(eraTapada&&!tp)tapT=Date.now();eraTapada=tp;
    if(tp){if(host&&host.style.display!=='none'){host.style.display='none'}cls(H,'pdtApp',0);return}
    if(!$('pd-font-jakarta')){const l=document.createElement('link');l.id='pd-font-jakarta';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';document.head.appendChild(l)}if(!$('pd-app-tienda-css')){const st=document.createElement('style');st.id='pd-app-tienda-css';st.textContent=ESTILO_DOC;document.head.appendChild(st)}
    if(!host){
      host=document.createElement('pd-app-tienda');
      const wrap=document.createElement('header');wrap.id='pdAppShell';wrap.style.cssText='display:contents';wrap.appendChild(host);document.body.appendChild(wrap);
      root=host.attachShadow({mode:'open'});try{PdPasos.flechas(root)}catch(_){}
      root.addEventListener('click',clic);root.addEventListener('input',entrada);
      /* Categorías fijas: cuando quedan pegadas arriba se tapa la franja de encima para que no se vea nada detrás */
      {const pegar=()=>{const L=root.querySelector('.list'),c=L&&L.querySelector(':scope>.chsHome.cti');if(!c)return;const on=c.getBoundingClientRect().top-L.getBoundingClientRect().top<=40&&L.scrollTop>0;if(c.classList.contains('pegada')!==on)c.classList.toggle('pegada',on)};
        root.addEventListener('scroll',e=>{if(e.target&&e.target.classList&&e.target.classList.contains('list'))pegar()},true);setInterval(pegar,300)}
      {let tsp=null,bloq=false,qt=null,toca=0;
        const soltar=()=>{clearTimeout(qt);qt=setTimeout(()=>{bloq=false},200)};
        root.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('.chsBar'))toca=Date.now()+100000},true);
        root.addEventListener('pointerup',()=>{if(toca)toca=Date.now()+700},true);root.addEventListener('pointercancel',()=>{if(toca)toca=Date.now()+700},true);
        root.addEventListener('scroll',e=>{const L0=e.target;if(L0&&L0.classList&&L0.classList.contains('pdCarS')){const i=Math.round(L0.scrollLeft/Math.max(1,L0.clientWidth));L0.nextElementSibling&&[...L0.nextElementSibling.children].forEach((d,k)=>d.classList.toggle('on',k===i));return}if(sub!=='negocio')return;if(e.target&&e.target.classList&&e.target.classList.contains('chs'))return;if(bloq){soltar();return}clearTimeout(tsp);tsp=setTimeout(()=>{
        const bar=root.querySelector('.chsBar');if(!bar)return;const lim=bar.getBoundingClientRect().bottom+12;let act=null;
        root.querySelectorAll('.catH').forEach(h=>{if(h.getBoundingClientRect().top<=lim)act=h.id.slice(2)});
        if(!act){const f=root.querySelector('.catH');act=f&&f.id.slice(2)}{const L=root.querySelector('.list');if(L&&L.scrollTop+L.clientHeight>=L.scrollHeight-6){const hs=[...root.querySelectorAll('.catH')];const vis=hs.filter(h=>h.getBoundingClientRect().top<L.getBoundingClientRect().bottom-40);if(vis.length)act=vis[vis.length-1].id.slice(2)}}if(!act||act===F.ncat)return;F.ncat=act;
        root.querySelectorAll('[data-ncat]').forEach(b=>{const on=b.dataset.ncat===act;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);if(on&&Date.now()>toca)alIzq(b)});
      },80)},true);root.__pdBloqueoSpy=()=>{bloq=true;clearTimeout(qt);qt=setTimeout(()=>{bloq=false},1200)}}
      root.addEventListener('pointerdown',e=>{tocando=Date.now();const cs=e.target.closest&&e.target.closest('.pdCarS');if(cs)cs.__t=Date.now()});root.addEventListener('pointerup',()=>setTimeout(()=>{tocando=false},150),true);root.addEventListener('click',()=>setTimeout(()=>{tocando=false},60),true);root.addEventListener('pointercancel',()=>{tocando=false});
    }
    if(host.style.display==='none')host.style.display='';
    cls(H,'pdtApp',1);
    if(tocando&&Date.now()-tocando<1500)return;tocando=false;/* un toque que no terminó no deja la pantalla congelada */
    const v=vista();const pag=sub?sub+':'+(F.neg||'')+(sub==='producto'?':'+F.pid:''):tab;
    {const act=root.activeElement;if(act&&(act.tagName==='INPUT'||act.tagName==='TEXTAREA')){if(root.__pag===pag)return;try{act.blur()}catch(_){}}}/* escribiendo: no redibuja; si cambió de página, sí */
    const k=pag+'|'+v.head+v.body+(v.foot||'')+nav();
    if(k===key)return;key=k;
    const lst=root.querySelector('.list');if(lst&&root.__pag)scrollMem[root.__pag]=lst.scrollTop;
    const cx=(root.querySelector('.chsHome')||{}).scrollLeft||0,carX=(root.querySelector('.pdCarS')||{}).scrollLeft||0,carT=(root.querySelector('.pdCarS')||{}).__t||0;
    /* al elegir categoría: la fila de categorías se queda quieta en su sitio */
    const anc=alCat&&root.__pag===pag&&root.querySelector('.chsHome')?root.querySelector('.chsHome').getBoundingClientRect().top:null;
    root.innerHTML=`<style>${ESTILO}</style><div class="app${sub==='seguir'?' segP':''}">${v.head}<div class="list">${v.body}</div>${v.foot?`<div class="foot">${v.foot}</div>`:''}${nav()}</div>`;
    const nueva=root.__pag!==pag;const nl=root.querySelector('.list');{const c2=root.querySelector('.chsHome');/* con pocos resultados la página no se encoge de golpe: deja espacio abajo para que nada salte */
      if(nl&&c2&&F.cat&&root.__pag===pag){const top=c2.offsetTop-nl.offsetTop,ul=nl.lastElementChild,alto=ul?ul.offsetTop-nl.offsetTop+ul.offsetHeight+(parseFloat(getComputedStyle(nl).paddingBottom)||0):0,falta=Math.ceil(top+nl.clientHeight-alto);if(falta>0){const sp=document.createElement('div');sp.style.cssText='height:'+falta+'px;flex:0 0 auto';sp.setAttribute('aria-hidden','true');nl.appendChild(sp)}}}if(nl)nl.scrollTop=root.__pag===pag?(scrollMem[pag]||0):(scrollMem[pag]=0,0);root.__pag=pag;
    try{const ap=root.querySelector('.app');if(nueva&&ap){ap.classList.add('entra');clearTimeout(root.__entT);root.__entT=setTimeout(()=>{const a2=root.querySelector('.app');a2&&a2.classList.remove('entra')},1100)}
      const ind=root.querySelector('.seg .ind');if(ind){const i=+ind.dataset.i||0,tx=k=>'translateX(calc('+k+' * (100% + 4px)))',pv=root.__segI;if(pv!=null&&pv!==i&&!nueva){ind.style.transition='none';ind.style.transform=tx(pv);void ind.offsetWidth;ind.style.transition=''}ind.style.transform=tx(i);root.__segI=i}
      const nc=nCart();if(root.__nc!=null&&nc>root.__nc){root.querySelectorAll('.bd,.cbar .n').forEach(x=>x.classList.add('pop'));root.querySelectorAll('.top .ib[data-a="carrito"]').forEach(x=>{x.classList.remove('rb');void x.offsetWidth;x.classList.add('rb')})}
      {const cb=root.querySelector('.cbar[data-a="carrito"]'),tt=totCart();if(cb){const t=cb.lastElementChild;if(root.__cbOn===false||root.__cbOn==null&&!nueva){cb.classList.add('sube')}if(root.__tot!=null&&root.__tot!==tt&&t&&!nueva)contar(t,root.__tot,tt);root.__cbOn=true}else root.__cbOn=false;root.__tot=tt}
      root.__nc=nc;
      if(favPop){root.querySelectorAll('[data-fav="'+CSS.escape(favPop)+'"]').forEach(x=>{const sv=x.querySelector('svg');sv&&sv.classList.add('pop');if(x.classList.contains('on'))particulas(x)});favPop=null}}catch(_){}
    {const cs=root.querySelector('.pdCarS');if(cs&&carX){cs.scrollLeft=carX;cs.__t=carT}}
    {const c2=root.querySelector('.chsHome');if(c2){c2.scrollLeft=cx;
      if(alCat){alCat=false;const on=c2.querySelector('button.on');
        if(anc!=null&&nl){const d=c2.getBoundingClientRect().top-anc;if(Math.abs(d)>1)nl.scrollTop+=d}
        /* la categoría elegida solo se acomoda si está cortada; no se corre toda la fila */
        if(on){const r=on.getBoundingClientRect(),q=c2.getBoundingClientRect();if(r.left<q.left+4)c2.scrollBy({left:r.left-q.left-16,behavior:'smooth'});else if(r.right>q.right-4)c2.scrollBy({left:r.right-q.right+16,behavior:'smooth'})}
        /* los resultados aparecen suaves */
        try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){let el=c2.nextElementSibling;let n=0;while(el&&n<12){el.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:220,delay:Math.min(n,6)*25,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});el=el.nextElementSibling;n++}}}catch(_){}}}}
    {const cs=[...root.querySelectorAll('[data-ncat]')];if(cs.length){const act=cs.some(b=>b.dataset.ncat===F.ncat)?F.ncat:cs[0].dataset.ncat;cs.forEach(b=>{const on=b.dataset.ncat===act;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)})}}
    if(pag==='buscar'||(tab==='buscar'&&!sub)){}
    try{if(typeof hHost!=='undefined'&&hHost){const nv=root.querySelector('.nv'),ft=root.querySelector('.foot');hHost.style.setProperty('--pdTstB',Math.max(nv?nv.offsetHeight:0,ft&&ft.offsetHeight?Math.round(innerHeight-ft.getBoundingClientRect().top):0)+'px')}}catch(_){}
  }
  function ir(t){
    /* Sin sesión ya no salta la alerta de iniciar sesión: la misma página de Pedidos o Perfil ofrece entrar, sin insistir */
    /* Mi perfil se edita directo: al tocar Perfil se abren los datos listos para cambiar */
    if(t==='perfil'&&SES()){const prev=tab==='perfil'?'inicio':tab;if(sub&&history.state&&history.state.pdt){ignorarPop=true;history.back()}sub=null;tab='perfil';key='';pintar();
      misDatos({alCerrar(){setTimeout(()=>{if(HO&&(HO.t==='mapa'||HO.t==='datos'))return;if(tab==='perfil'&&!sub){tab=prev;key='';pintar()}},0)}});return}
    if(sub&&history.state&&history.state.pdt){ignorarPop=true;history.back()}
    sub=null;pila=[];
    if(t==='buscar'){tab='inicio';key='';pintar();setTimeout(()=>{const i=root&&root.getElementById('tQ');if(i)i.focus()},50);return}
    if(t==='pedidos'){if(SES())historial(true);tab='pedidos';key='';pintar();/* sin pedidos: la misma página de Pedidos lo dice, sin ventana encima de otra página */
      const t0=Date.now(),iv=setInterval(()=>{const k=C.hist;if(k&&!k.busy){clearInterval(iv);if(tab==='pedidos'){key='';pintar()}}else if(Date.now()-t0>12000)clearInterval(iv)},150);return}
    tab=t;key='';pintar();
  }
  function alertaSinPedidos(){hojaAbrir({t:'sinped',view(){return {dlg:true,title:'Aún no tienes pedidos',
      body:`<span class="ic">${IC.box}</span><h2>Aún no tienes pedidos</h2><p>Explora los negocios de Piura y haz tu primer pedido.</p>`,
      btns:`<div class="bb u"><button type="button" class="bp" data-h="ver">Ver negocios</button><button type="button" class="bs" data-h="x" style="height:50px;border-radius:14px;font-size:15px">Cerrar</button></div>`}},
    on(x){if(x==='ver'){hojaCerrar();if(tab!=='inicio'||sub){sub=null;pila=[];tab='inicio';key='';pintar()}}}})}
  var pila=[];/* páginas abiertas una sobre otra: al volver se regresa a la anterior */
  function abrir(s){if(!sub)try{history.pushState({pdt:1},'')}catch(_){}if(sub&&sub!==s)pila.push({sub,neg:F.neg});sub=s;key='';pintar()}
  /* La categoría elegida pasa al primer lugar visible de la barra */
  function alIzq(b){try{const sc=b.parentElement;const pl=parseFloat(getComputedStyle(sc).paddingLeft)||0;const u=sc.querySelector('button:last-of-type');if(u)sc.style.setProperty('--fin',Math.max(0,sc.clientWidth-u.offsetWidth-pl-16)+'px');sc.scrollTo({left:Math.max(0,b.offsetLeft-sc.offsetLeft-pl),behavior:'smooth'})}catch(_){}}
  /* ---------- efectos ---------- */
  const sinMov=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
  function vib(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(_){}}
  function contar(el,a,b){if(sinMov()){el.textContent=M(b);return}const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/500),e=1-Math.pow(1-k,3);el.textContent=M(a+(b-a)*e);if(k<1)requestAnimationFrame(f)})(t0)}
  function expandir(btn){try{if(sinMov())return;const lg=btn.querySelector('.lg');if(!lg)return;const r=lg.getBoundingClientRect(),c=lg.cloneNode(true);
    c.style.cssText+=';position:fixed;left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px;margin:0;z-index:60;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.18)';root.appendChild(c);
    const W=innerWidth,dx=W/2-(r.left+r.width/2),dy=150-(r.top+r.height/2);
    c.animate([{transform:'none',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) scale(2.1)',opacity:1,offset:.7},{transform:'translate('+dx+'px,'+(dy-10)+'px) scale(2.4)',opacity:0}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}).onfinish=()=>c.remove()}catch(_){}}
  function particulas(el){try{if(sinMov())return;const r=el.getBoundingClientRect();for(let i=0;i<10;i++){const p=document.createElement('i');const a=i/10*Math.PI*2;p.style.cssText='position:fixed;left:'+(r.left+r.width/2-3.5)+'px;top:'+(r.top+r.height/2-3.5)+'px;width:7px;height:7px;border-radius:50%;z-index:70;pointer-events:none;background:'+['#E11D48','#F59E0B','#C4410C'][i%3];root.appendChild(p);
    p.animate([{transform:'none',opacity:1},{transform:'translate('+Math.cos(a)*34+'px,'+Math.sin(a)*34+'px) scale(.3)',opacity:0}],{duration:560,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>p.remove()}vib(10)}catch(_){}}
  function confeti(){try{if(sinMov())return;const W=innerWidth;for(let i=0;i<34;i++){const c=document.createElement('i');c.style.cssText='position:fixed;top:-14px;left:'+Math.random()*W+'px;width:8px;height:12px;border-radius:2px;z-index:80;pointer-events:none;background:'+['#C4410C','#F59E0B','#15803D','#2563EB','#E11D48'][i%5];root.appendChild(c);
    c.animate([{transform:'translateY(0) rotate(0)',opacity:1},{transform:'translateY('+(innerHeight*.75)+'px) translateX('+(Math.random()*80-40)+'px) rotate('+Math.random()*720+'deg)',opacity:0}],{duration:1300+Math.random()*900,delay:Math.random()*250,easing:'cubic-bezier(.3,.6,.6,1)',fill:'forwards'}).onfinish=()=>c.remove()}}catch(_){}}
  /* carrusel de destacados: pasa solo cada 4 s y los puntos siguen al deslizar */
  setInterval(()=>{try{const s=root&&root.querySelector('.pdCarS');if(!s||sinMov()||tocando)return;if(Date.now()-(s.__t||0)<5000)return;const n=s.children.length,w=s.clientWidth;const i=Math.round(s.scrollLeft/w);s.scrollTo({left:((i+1)%n)*w,behavior:'smooth'})}catch(_){}},4000);
  function abrirNeg(id){F.neg=String(id);F.nq='';F.ncat='';carta(id);abrir('negocio')}
  function abrirProd(id){const p=PR().find(x=>String(x.id)===String(id)&&x.origen==='negocio');if(!p)return;
    if(varsP(p).length){try{window.openProductDetails(p.id,'negocio')}catch(e){}return}
    F.neg=String(p.negocio_id);F.pid=String(p.id);F.qty=1;abrir('producto')}
  function agregar(id,q){const p=PR().find(x=>String(x.id)===String(id)&&x.origen==='negocio');if(!p)return false;
    if(varsP(p).length){try{window.openProductDetails(p.id,'negocio')}catch(e){}return false}
    const r=negPorId(p.negocio_id);if(r&&!abierto(r)){try{window.showRestaurantSchedule(r.id)}catch(e){}return false}
    let ok=false;try{ok=window.addToCart(p.id,'negocio',q||1)}catch(e){console.warn(e)}
    key='';pintar();return ok}
  function volver(){if(pila.length){atras();return}if(history.state&&history.state.pdt){history.back();return}atras()}
  function atras(){let d;do{d=pila.pop()}while(d&&d.sub===sub);if(d){sub=d.sub;if(d.neg)F.neg=d.neg}else if(sub==='producto'){sub='negocio'}else sub=null;if(!sub)pila=[];key='';pintar()}

  function entrada(e){const el=e.target,k=el.dataset&&el.dataset.in;
    if(el.dataset&&el.dataset.ck){setVal(el.dataset.ck,el.dataset.ck==='cDiscountCode'?el.value.toUpperCase():el.value);if(el.dataset.ck==='cMontoPago'){const vb=root.getElementById('tVto');if(vb)vb.innerHTML=vueltoH()}clearTimeout(entrada.t);entrada.t=setTimeout(()=>{const f=root.querySelector('.foot');const v=vista();if(f&&v.foot!=null&&f.innerHTML!==v.foot)f.innerHTML=v.foot},400);return}
    if(k==='q'){F.q=el.value;const b=root.getElementById('tL');if(b)b.innerHTML=filas();return}
    if(k==='nq'){F.nq=el.value;const r=negPorId(F.neg);const b=root.getElementById('tCarta');if(b&&r)b.innerHTML=cartaLista(r);return}
  }
  async function clic(e){
    tocando=false;
    const t=e.target.closest('[data-t]');if(t){if(HO&&HO.t!=='listo')try{hojaCerrar(undefined)}catch(_){}ir(t.dataset.t);return}
    const pgb=e.target.closest('[data-prog]');if(pgb){if(pgb.dataset.prog==='quitar'){try{window.pdCancelarProgramado&&window.pdCancelarProgramado()}catch(_){}try{window.pdAviso?window.pdAviso('Listo, ahora pides para entrega inmediata.'):0}catch(_){}}else{try{reservar(window.__pdProgNegId||'')}catch(_){}}key='';pintar();return}
    const fv=e.target.closest('[data-fav]');if(fv){try{window.pdToggleFav(fv.dataset.fav)}catch(_){}favPop=fv.dataset.fav;key='';pintar();return}
    const ng=e.target.closest('[data-neg]');if(ng){expandir(ng);abrirNeg(ng.dataset.neg);return}
    const rm=e.target.closest('[data-rem]');if(rm){const L=CART(),i=L.findIndex(x=>String(x.id)===String(rm.dataset.rem)&&x.origen==='negocio');if(i>=0){L[i].cantidad=Number(L[i].cantidad||0)-1;if(L[i].cantidad<=0)L.splice(i,1);guardarCart();vib(8)}key='';pintar();return}
    const ad=e.target.closest('[data-add]');if(ad){if(agregar(ad.dataset.add,1))vib(12);return}
    const pr=e.target.closest('[data-prod]');if(pr){if(pr.dataset.pneg){const id=pr.dataset.prod;F.neg=pr.dataset.pneg;carta(F.neg);if(!sub)try{history.pushState({pdt:1},'')}catch(_){}sub='negocio';const w=setInterval(()=>{if(PR().some(x=>String(x.id)===String(id))){clearInterval(w);abrirProd(id)}},150);setTimeout(()=>clearInterval(w),8000);return}abrirProd(pr.dataset.prod);return}
    const ct=e.target.closest('[data-cat]');if(ct){F.cat=ct.dataset.cat;alCat=true;key='';pintar();return}
    const fl=e.target.closest('[data-fl]');if(fl){F.filtro=fl.dataset.fl;if(F.filtro==='cerca')cercaUbic();key='';pintar();return}
    const nc=e.target.closest('[data-ncat]');if(nc){F.ncat=nc.dataset.ncat;root.querySelectorAll('[data-ncat]').forEach(b=>{const on=b===nc;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});alIzq(nc);const g=root.getElementById('g-'+nc.dataset.ncat);if(g){root.__pdBloqueoSpy&&root.__pdBloqueoSpy();g.scrollIntoView({behavior:'smooth',block:'start'})}return}
    const q=e.target.closest('[data-q]');if(q){F.qty=Math.max(1,F.qty+Number(q.dataset.q));key='';pintar();return}
    const ci=e.target.closest('[data-ci]');if(ci){const [i,d]=ci.dataset.ci.split(':').map(Number);const L=CART(),x=L[i];if(!x)return;
      if(d>0){const p=PR().find(y=>String(y.id)===String(x.id)&&y.origen===x.origen),st=p?stockP(p):null;if(st!==null&&enCarrito(x.id)+1>st){try{toast('No hay más stock de este producto.')}catch(_){}return}}
      x.cantidad=Number(x.cantidad||0)+d;if(x.cantidad<=0)L.splice(i,1);guardarCart();if(!L.length){cerrarCk()}key='';pintar();return}
    const pg=e.target.closest('[data-pago]');if(pg){const b=btnTxt(pg.dataset.pago==='yape'?/^Yape$/i:/^Efectivo$/i);if(b)b.click();else{setVal('cPago',pg.dataset.pago);try{togglePaymentProof()}catch(_){}}setTimeout(()=>{key='';pintar()},60);return}
    const yp=e.target.closest('[data-yape]');if(yp){const r2=document.querySelector(`#modal input[name="pdYapeModo"][value="${CSS.escape(yp.dataset.yape)}"]`);if(r2){r2.checked=true;r2.dispatchEvent(new Event('change',{bubbles:true}));r2.click()}setTimeout(()=>{key='';pintar()},60);return}
    const cp=e.target.closest('[data-comp]');if(cp){const cur=val('cCompTipo');try{if(cur===cp.dataset.comp){setVal('cCompTipo','ninguno');window.pdCompSel&&window.pdCompSel('ninguno')}else window.pdCompSel(cp.dataset.comp)}catch(_){}setTimeout(()=>{key='';pintar()},60);return}
    const sg=e.target.closest('[data-seg]');if(sg){F.seg=sg.dataset.seg;if(C.seg)C.seg.t=0;if(sub==='seguir'){key='';pintar()}else seguirAlerta();return}
    const rp=e.target.closest('[data-rep]');if(rp){try{await window.pdReorder(rp.dataset.rep)}catch(_){}setTimeout(()=>{const id=cartNeg();if(id&&!document.querySelector('#modal.overlay')){F.neg=id;carta(id);sub=null;pila=[];abrir('carrito')}},700);return}
    const cl=e.target.closest('[data-cal]');if(cl){try{window.pdOpenRating(cl.dataset.cal)}catch(_){}return}
    const a=e.target.closest('[data-a]');if(!a)return;
    switch(a.dataset.a){
      case 'volver':volver();break;
      case 'inicio':ir('inicio');break;
      case 'anegocio':if(history.state&&history.state.pdt&&sub==='producto'){sub='negocio';key='';pintar()}else{sub='negocio';key='';pintar()}break;
      case 'anegocio2':{const id=cartNeg();if(id){F.neg=id;carta(id);sub='negocio';key='';pintar()}break}
      case 'carrito':if(!CART().length){aviso('Tu pedido está vacío. Elige un negocio y agrega productos.');break}abrir('carrito');break;
      case 'agregar':{const ok=agregar(F.pid,F.qty);if(ok){sub='negocio';key='';pintar()}break}
      case 'horario':{try{window.showRestaurantSchedule(F.neg)}catch(_){}break}
      case 'cuenta':{try{window.pdAbrirCuentaCliente()}catch(_){}break}
      case 'salirCuenta':{if(!(await window.pdConfirmar('¿Cerrar sesión en este teléfono?')))break;try{const {error}=await SB().auth.signOut();if(error)throw error;try{window.pdActualizarCuentaCliente&&window.pdActualizarCuentaCliente(null)}catch(_){}aviso('Sesión cerrada.');C.hist=null;key='';pintar()}catch(e){aviso('No se pudo cerrar la sesión: '+(e.message||''))}break}
      case 'google':{try{window.pdIngresarConGoogle()}catch(_){try{window.pdAbrirCuentaCliente()}catch(__){}}break}
      case 'seguirult':F.seg=null;if(C.seg)C.seg.t=0;seguirAlerta();break;
      case 'hact':historial(true);key='';pintar();break;
      case 'hmas':F.lim+=40;key='';pintar();break;
      case 'ubic':{ubicPrev=!!(val('cLat')&&val('cLng'));ubicT=Date.now();key='';pintar();const b=document.querySelector('#modal .ckLocBtn')||document.querySelector('#modal .locationBtn');if(b)b.click();else try{useCurrentLocation('cart')}catch(_){}[400,1500,2600,3500,6000,9000,12200].forEach(ms=>setTimeout(()=>{key='';pintar()},ms));break}
      case 'mapa':{const b=document.querySelector('#modal .ckMapa');if(b)b.click();[600,2000].forEach(ms=>setTimeout(()=>{key='';pintar()},ms));break}
      case 'cubiertos':{const b=document.querySelector('#modal .pdDescSw');if(b)b.click();setTimeout(()=>{key='';pintar()},80);break}
      case 'cupon':{try{applyDeliveryDiscount()}catch(_){}[300,1200,2500].forEach(ms=>setTimeout(()=>{key='';pintar()},ms));break}
      case 'enviar':{if(window.__pidemasOrderSubmitting)break;const b=btnTxt(/^Confirmar|^Enviar|^Hacer pedido|^Reservar/i)||document.querySelector('#modal button.primary[onclick*="submitCartOrder"]');
        const t0=Date.now();if(b)b.click();else try{window.submitCartOrder()}catch(_){}
        key='';pintar();
        const w=setInterval(()=>{if(window.__pidemasOrderSubmitting)return;if(ck()){clearInterval(w);key='';pintar();return}const m=$('modal'),tx=String(m&&m.textContent||'').replace(/\s+/g,' ');const okE=/Pedido enviado|Pedido registrado|Reserva|reservad/i.test(tx);if(!okE&&m&&m.classList.contains('overlay')&&Date.now()-t0<15000)return;clearInterval(w);document.documentElement.classList.remove('pdtCk');if(C.hist)C.hist.t=0;if(C.seg)C.seg.t=0;if(okE){const cd=(tx.match(/#[0-9A-F]{6,10}/i)||[''])[0];F.ok={tit:/Reserva|reservad/i.test(tx)&&!/Pedido enviado/i.test(tx)?'¡Reserva registrada!':'¡Pedido enviado!',cod:cd,txt:/registrado/i.test(tx)&&!/enviado/i.test(tx)?'Tu pedido quedó registrado. Te avisaremos cuando el negocio lo confirme.':'El negocio ya recibió tu pedido y lo confirmará en breve.'};cerrT=Date.now();try{closeModal()}catch(_){}if(history.state&&history.state.pdt){ignorarPop=true;history.back()}sub=null;pila=[];tab='inicio';setTimeout(listoHoja,250)}else{if(history.state&&history.state.pdt){ignorarPop=true;history.back()}sub=null;pila=[];tab='inicio'}key='';pintar()},500);setTimeout(()=>clearInterval(w),90000);break}
    }
  }
  addEventListener('popstate',()=>{if(window.__pdPopPropio)return;if(ignorarPop){ignorarPop=false;return}if(Date.now()-cerrT<1200||Date.now()-tapT<1500||eraTapada)return;if(history.state&&history.state.pdt)return;/* volvió de una ventana vieja, no de esta app */if(sub){if(document.querySelector('#modal.overlay')&&!ck())return;atras();if(sub)try{history.pushState({pdt:1},'')}catch(_){}}});
  /* Enlace directo a la carta de un negocio: ?negocio=ID */
  (function(){const id=(new URLSearchParams(location.search).get('negocio')||'').trim();if(!id)return;const t=setInterval(()=>{const r=negPorId(id);if(!r&&window.pdNegNoDisp===id){clearInterval(t);F.neg=id;sub='negocio';key='';pintar();return}if(!r)return;clearInterval(t);F.neg=String(r.id);carta(r.id);sub='negocio';try{const m=$('cartaModalNegocio');if(m&&window.volverMenuPrincipal)window.volverMenuPrincipal()}catch(_){}key='';pintar()},300);setTimeout(()=>clearInterval(t),20000)})();
  setInterval(pintar,700);
  window.pdAppTienda={pintar,ir,abrirNeg,navH:()=>0,st:()=>({sub,tab,ck:ck(),cls:document.documentElement.className})};
})();
