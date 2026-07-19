(function(){
  function applyFoundationPolishV02(){
    try{
      document.documentElement.setAttribute('data-pn-foundation','v02');
      var badge=document.getElementById('build-badge');
      if(badge) badge.textContent='BUILD v6_23_4_56 · FOUNDATION_POLISH_v02';
    }catch(e){ console.warn('Foundation polish v02 skipped', e); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyFoundationPolishV02); else applyFoundationPolishV02();
  setTimeout(applyFoundationPolishV02,400);
  setTimeout(applyFoundationPolishV02,1400);

  // END TURN OPERATIONS SUMMARY v1
  var REPORT_PREF='ae_hide_operations_report_v1';
  var originalStartTimer=window.startTimer;
  var originalCloseModal=window.closeModal;
  var originalCloseModalOutside=window.closeModalOutside;

  function reportHidden(){
    try{return localStorage.getItem(REPORT_PREF)==='1';}catch(e){return false;}
  }
  function setReportHidden(on){
    try{if(on)localStorage.setItem(REPORT_PREF,'1');else localStorage.removeItem(REPORT_PREF);}catch(e){}
  }
  function money(v){
    var n=Number(v)||0;
    return (n<0?'−':'')+'$'+Math.abs(n).toFixed(1)+'M';
  }
  function routeName(r){return r?(r.from+' → '+r.to):'No routes operating';}
  function metric(label,value,tone,note){
    return '<div class="ops-report-metric '+(tone||'')+'">'+
      '<div class="ops-report-metric-label">'+label+'</div>'+
      '<div class="ops-report-metric-value">'+value+'</div>'+
      (note?'<div class="ops-report-metric-note">'+note+'</div>':'')+
      '</div>';
  }
  function buildReport(data){
    var routes=Array.isArray(data.routes)?data.routes:[];
    var best=data.bestRoute, weak=data.weakRoute;
    var alerts=(data.alerts||[]).map(function(a){
      return '<div class="ops-report-alert '+(a.level||'info')+'">'+
        '<span class="ops-report-alert-icon">'+(a.icon||'•')+'</span>'+
        '<div><b>'+a.title+'</b><span>'+(a.body||'')+'</span></div></div>';
    }).join('');
    return '<div class="ops-report-shell">'+
      '<div class="ops-report-header"><div>'+
        '<div class="ops-report-kicker">AIRLINE OPERATIONS REPORT</div>'+
        '<div class="ops-report-title">'+(data.monthLabel||'Month End')+'</div>'+
        '<div class="ops-report-subtitle">Executive summary for '+((window.STATE&&STATE.coName)||'your airline')+'</div>'+
      '</div><button class="modal-close ops-report-close" onclick="operationsReportDismiss()" aria-label="Continue flight">×</button></div>'+
      '<div class="ops-report-body">'+
        '<section class="ops-report-section"><div class="ops-report-section-title">Financial Performance</div><div class="ops-report-grid ops-report-grid-4">'+
          metric('Revenue',money(data.income),'positive')+
          metric('Expenses',money(data.expenses),'expense')+
          metric('Net result',money(data.profit),data.profit>=0?'positive':'negative',data.profit>=0?'Profitable period':'Loss-making period')+
          metric('Cash position',money(data.cash),data.cash>=0?'':'negative')+
        '</div></section>'+
        '<section class="ops-report-section"><div class="ops-report-section-title">Operations</div><div class="ops-report-grid ops-report-grid-4">'+
          metric('Passengers',Number(data.pax||0).toLocaleString(),'')+
          metric('Active routes',routes.length.toLocaleString(),'')+
          metric('Scheduled flights / wk',Number(data.weeklyFlights||0).toLocaleString(),'')+
          metric('Seat capacity / wk',Number(data.weeklySeats||0).toLocaleString(),'')+
        '</div></section>'+
        '<section class="ops-report-section"><div class="ops-report-section-title">Network Review</div><div class="ops-report-route-grid">'+
          '<div class="ops-report-route best"><span class="ops-report-route-tag">BEST ROUTE</span><strong>'+routeName(best)+'</strong><span>'+
            (best?(money(best.profit)+' · '+(best.load||0)+'% load'):'Open a route to begin network reporting.')+'</span></div>'+
          '<div class="ops-report-route '+(weak&&weak.profit<0?'warning':'')+'"><span class="ops-report-route-tag">WATCHLIST</span><strong>'+routeName(weak)+'</strong><span>'+
            (weak?(money(weak.profit)+' · '+(weak.load||0)+'% load'):'No route warnings this period.')+'</span></div>'+
        '</div></section>'+
        (alerts?'<section class="ops-report-section"><div class="ops-report-section-title">Executive Alerts</div><div class="ops-report-alerts">'+alerts+'</div></section>':'')+
        '<div class="ops-report-footer"><label class="ops-report-skip"><input id="ops-report-hide" type="checkbox"> Do not show this report after future turns</label>'+
        '<button class="ops-report-continue" onclick="operationsReportDismiss()">Continue Flight <span>›</span></button></div>'+
      '</div></div>';
  }
  function showReport(data){
    var overlay=document.getElementById('modal-overlay');
    var content=document.getElementById('modal-content');
    if(!overlay||!content)return false;
    STATE._operationsReportOpen=true;
    overlay.classList.add('open');
    content.classList.add('modal-wide','operations-report-modal');
    content.innerHTML=buildReport(data);
    return true;
  }
  function dismissReport(){
    var cb=document.getElementById('ops-report-hide');
    if(cb&&cb.checked)setReportHidden(true);
    if(window.STATE)STATE._operationsReportOpen=false;
    if(typeof originalCloseModal==='function')originalCloseModal();
    if(window.STATE&&!STATE.gameOver){
      if(typeof window.renderRoutesList==='function')window.renderRoutesList();
      if(!STATE.paused&&typeof originalStartTimer==='function')originalStartTimer();
    }
  }
  window.operationsReportDismiss=dismissReport;

  if(typeof originalStartTimer==='function'){
    window.startTimer=function(){
      if(window.STATE&&STATE._operationsReportOpen)return;
      return originalStartTimer.apply(this,arguments);
    };
  }
  window.closeModalOutside=function(e){
    var overlay=document.getElementById('modal-overlay');
    if(e.target!==overlay)return;
    if(window.STATE&&STATE._operationsReportOpen)dismissReport();
    else if(typeof originalCloseModalOutside==='function')originalCloseModalOutside(e);
    else if(typeof originalCloseModal==='function')originalCloseModal();
  };

  window.showQuarterBanner=function(profit,pax,income,expenses,biz,monthLabel){
    if(!window.STATE)return;
    STATE._bannerHistory={profit:profit,pax:pax};
    var routes=(STATE.routes||[]).slice();
    var ranked=routes.slice().sort(function(a,b){return (b.profit||0)-(a.profit||0);});
    var best=ranked[0]||null;
    var weak=ranked.length?ranked[ranked.length-1]:null;
    var weeklyFlights=routes.reduce(function(sum,r){return sum+(Number(r.flights)||0);},0);
    var weeklySeats=routes.reduce(function(sum,r){
      var ac=(window.AIRCRAFT&&AIRCRAFT[r.plane])||{};
      return sum+(Number(r.flights)||0)*(Number(ac.seats)||0);
    },0);
    var alerts=[];
    var disruption=Number(STATE._monthDisruption)||0;
    if(profit<0)alerts.push({level:'danger',icon:'↘',title:'Operating loss',body:'The airline lost '+money(profit)+' this period. Review weak routes and discretionary spending.'});
    if(STATE.cash<0)alerts.push({level:'danger',icon:'!',title:'Negative cash position',body:'Cash is '+money(STATE.cash)+'. Immediate financing or cost action is required.'});
    if(weak&&(weak.profit||0)<-0.5)alerts.push({level:'warn',icon:'△',title:'Route underperformance',body:weak.from+' → '+weak.to+' lost '+money(weak.profit)+' at '+(weak.load||0)+'% load.'});
    if(disruption>=0.5)alerts.push({level:'warn',icon:'☁',title:'Disruption impact',body:'World and operational disruptions reduced profit by approximately $'+disruption.toFixed(1)+'M.'});
    var poor=Object.keys(STATE.fleetHealth||{}).filter(function(k){var h=STATE.fleetHealth[k];return h&&Number(h.health)<40;});
    if(poor.length)alerts.push({level:'warn',icon:'⚙',title:'Fleet maintenance',body:poor.length+' aircraft type'+(poor.length!==1?'s are':' is')+' below 40% health. Review the Hangar.'});
    if(!alerts.length&&routes.length)alerts.push({level:'good',icon:'✓',title:'Operations stable',body:'No material financial, route, disruption, or fleet-health alerts were detected this period.'});
    if(reportHidden()){
      var sign=profit>=0?'+':'';
      if(typeof window.showFlash==='function')window.showFlash(monthLabel+': '+sign+'$'+profit.toFixed(1)+'M · '+Number(pax||0).toLocaleString()+' pass · $'+Number(STATE.cash||0).toFixed(0)+'M cash');
      if(typeof window.dismissBanner==='function')window.dismissBanner();
      return;
    }
    var opened=showReport({monthLabel:monthLabel,profit:profit,pax:pax,income:income,expenses:expenses,biz:biz,cash:STATE.cash,routes:routes,bestRoute:best,weakRoute:weak,weeklyFlights:weeklyFlights,weeklySeats:weeklySeats,alerts:alerts});
    if(!opened&&typeof window.dismissBanner==='function')window.dismissBanner();
  };

  function injectReportStyles(){
    if(document.getElementById('ops-report-v1-style'))return;
    var style=document.createElement('style');
    style.id='ops-report-v1-style';
    style.textContent=`
.operations-report-modal{width:min(940px,96vw)!important;max-height:90vh!important;overflow:auto!important;border-color:rgba(185,148,255,.28)!important;box-shadow:0 30px 100px rgba(0,0,0,.72),0 0 50px rgba(139,92,246,.11)!important}
.ops-report-shell{font-family:'Plus Jakarta Sans',sans-serif;color:var(--text);min-height:100%}.ops-report-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:24px 28px 20px;border-bottom:1px solid rgba(185,148,255,.16);background:radial-gradient(circle at 12% 0,rgba(139,92,246,.14),transparent 42%),linear-gradient(110deg,rgba(63,214,192,.055),rgba(139,92,246,.055));position:sticky;top:0;z-index:4;backdrop-filter:blur(12px)}
.ops-report-kicker{font-size:9px;font-weight:800;letter-spacing:2.8px;color:#b994ff;margin-bottom:6px}.ops-report-title{font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:2px;line-height:1;color:#f3f0ff}.ops-report-subtitle{font-size:10px;color:var(--muted2);margin-top:7px}.ops-report-close{font-size:25px;padding:0 2px}.ops-report-body{padding:22px 28px 26px}.ops-report-section{margin-bottom:22px}.ops-report-section-title{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#aebed0;margin-bottom:9px}.ops-report-grid{display:grid;gap:9px}.ops-report-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.ops-report-metric{min-width:0;padding:13px 14px;border:1px solid rgba(125,238,255,.11);border-radius:9px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.014))}.ops-report-metric.positive{border-color:rgba(78,234,170,.18)}.ops-report-metric.negative{border-color:rgba(244,63,94,.26);background:rgba(244,63,94,.045)}.ops-report-metric.expense{border-color:rgba(255,207,90,.16)}.ops-report-metric-label{font-size:8.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ops-report-metric-value{font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:#edf7ff;margin-top:6px;white-space:nowrap}.ops-report-metric.positive .ops-report-metric-value{color:var(--profit)}.ops-report-metric.negative .ops-report-metric-value{color:var(--loss)}.ops-report-metric.expense .ops-report-metric-value{color:var(--warn)}.ops-report-metric-note{font-size:8.5px;color:var(--muted2);margin-top:4px}
.ops-report-route-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.ops-report-route{display:flex;flex-direction:column;gap:5px;padding:14px 16px;border-radius:9px;border:1px solid rgba(125,238,255,.12);background:rgba(255,255,255,.022)}.ops-report-route.best{border-color:rgba(78,234,170,.22);background:rgba(78,234,170,.035)}.ops-report-route.warning{border-color:rgba(255,207,90,.24);background:rgba(255,207,90,.035)}.ops-report-route-tag{font-size:8px;font-weight:800;letter-spacing:1.5px;color:var(--muted2)}.ops-report-route strong{font-size:12px;color:var(--text)}.ops-report-route span:last-child{font-family:'DM Mono';font-size:9px;color:var(--muted)}
.ops-report-alerts{display:flex;flex-direction:column;gap:7px}.ops-report-alert{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:8px;border:1px solid rgba(125,238,255,.10);background:rgba(255,255,255,.018)}.ops-report-alert-icon{width:22px;height:22px;display:grid;place-items:center;border-radius:6px;background:rgba(125,238,255,.07);color:var(--accent);font-weight:800;flex:0 0 auto}.ops-report-alert b{display:block;font-size:10px;color:var(--text);margin-bottom:2px}.ops-report-alert div span{display:block;font-size:9px;line-height:1.45;color:var(--muted2)}.ops-report-alert.warn{border-color:rgba(255,207,90,.18)}.ops-report-alert.warn .ops-report-alert-icon{background:rgba(255,207,90,.08);color:var(--warn)}.ops-report-alert.danger{border-color:rgba(244,63,94,.22)}.ops-report-alert.danger .ops-report-alert-icon{background:rgba(244,63,94,.09);color:var(--loss)}.ops-report-alert.good{border-color:rgba(78,234,170,.18)}.ops-report-alert.good .ops-report-alert-icon{background:rgba(78,234,170,.08);color:var(--profit)}
.ops-report-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:6px;padding-top:16px;border-top:1px solid rgba(125,238,255,.10)}.ops-report-skip{display:flex;align-items:center;gap:8px;font-size:9px;color:var(--muted2);cursor:pointer}.ops-report-skip input{accent-color:#a78bfa}.ops-report-continue{border:1px solid rgba(185,148,255,.48);border-radius:8px;padding:10px 17px;background:linear-gradient(135deg,rgba(139,92,246,.24),rgba(63,214,192,.10));color:#f4efff;font:700 10px 'Plus Jakarta Sans';letter-spacing:.8px;text-transform:uppercase;cursor:pointer;box-shadow:0 8px 24px rgba(76,29,149,.18)}.ops-report-continue:hover{border-color:#c4a7ff;background:linear-gradient(135deg,rgba(139,92,246,.34),rgba(63,214,192,.15))}.ops-report-continue span{font-size:15px;margin-left:7px;vertical-align:-1px}@media(max-width:760px){.ops-report-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}.ops-report-route-grid{grid-template-columns:1fr}.ops-report-header,.ops-report-body{padding-left:18px;padding-right:18px}.ops-report-footer{align-items:flex-start;flex-direction:column}.ops-report-continue{width:100%}}`;
    document.head.appendChild(style);
  }
  injectReportStyles();
})();
