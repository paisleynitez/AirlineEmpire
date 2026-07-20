(function(){
  'use strict';
  const PREF_KEY='ae_hide_operations_report_v1';
  let open=false;
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const money=v=>{const n=Number(v)||0;return `${n<0?'−':''}$${Math.abs(n).toFixed(1)}M`;};
  const integer=v=>Math.round(Number(v)||0).toLocaleString();
  const routeName=r=>r?`${esc(r.from)} → ${esc(r.to)}`:'No route data';
  function hidden(){try{return localStorage.getItem(PREF_KEY)==='1';}catch(e){return false;}}
  function setHidden(v){try{v?localStorage.setItem(PREF_KEY,'1'):localStorage.removeItem(PREF_KEY);}catch(e){}}
  function metric(label,value,tone){return `<div class="ops-report-metric ${tone||''}"><span>${esc(label)}</span><strong>${value}</strong></div>`;}
  function routeCard(label,r,tone){
    if(!r)return `<div class="ops-report-route"><span>${esc(label)}</span><strong>No active routes</strong><small>Open a route to begin network reporting.</small></div>`;
    return `<div class="ops-report-route ${tone||''}"><span>${esc(label)}</span><strong>${routeName(r)}</strong><small>${money(r.profit||0)} · ${Number(r.load||0).toFixed(0)}% load</small></div>`;
  }
  function alertRows(d){
    const rows=[];
    if(d.profit<0)rows.push(['danger','Monthly loss',`${money(d.profit)} net result`]);
    if(Number.isFinite(d.runway)&&d.runway<6)rows.push(['danger','Cash runway',`${d.runway} month${d.runway===1?'':'s'} at current loss rate`]);
    if(d.disruption>=0.5)rows.push(['warn','Operational disruption',`${money(-d.disruption)} impact this period`]);
    if(d.watchRoute&&Number(d.watchRoute.profit||0)<0)rows.push(['warn','Route watch',`${routeName(d.watchRoute)} lost ${money(Math.abs(d.watchRoute.profit||0))}`]);
    if(d.groundedTypes&&d.groundedTypes.length)rows.push(['danger','Fleet grounding',`${d.groundedTypes.map(esc).join(', ')} unavailable`]);
    if(!d.routes)rows.push(['info','Network inactive','Open a route to begin operations']);
    if(!rows.length)rows.push(['good','Operations stable','No critical exceptions require executive action']);
    return rows;
  }
  function build(d){
    const alerts=alertRows(d).map(([tone,title,body])=>`<div class="ops-report-alert ${tone}"><i></i><div><strong>${esc(title)}</strong><span>${body}</span></div></div>`).join('');
    return `<div class="ops-report-shell">
      <header class="ops-report-header"><div><span class="ops-report-eyebrow">CEO MONTH-END BRIEFING</span><h2>AIRLINE OPERATIONS REPORT</h2><p>${esc(d.monthLabel||'Period complete')}</p></div><button class="modal-close ops-report-close" onclick="AEReports.close()" aria-label="Close report">×</button></header>
      <div class="ops-report-body">
        <section class="ops-report-section"><h3>Financial performance</h3><div class="ops-report-grid four">${metric('Revenue',money(d.revenue))}${metric('Expenses',money(d.expenses))}${metric('Net result',money(d.profit),d.profit>=0?'positive':'negative')}${metric('Cash',money(d.cash))}</div></section>
        <section class="ops-report-section"><h3>Operating snapshot</h3><div class="ops-report-grid four">${metric('Passengers',integer(d.passengers))}${metric('Active routes',integer(d.routes))}${metric('Flights / week',integer(d.flightsPerWeek))}${metric('Aircraft owned',integer(d.aircraftOwned))}</div><div class="ops-report-capacity">${integer(d.seatsPerWeek)} scheduled seats per week across the network</div></section>
        <section class="ops-report-section"><h3>Network performance</h3><div class="ops-report-network">${routeCard('Best performing route',d.bestRoute,'best')}${routeCard('Route requiring attention',d.watchRoute,'watch')}</div></section>
        <section class="ops-report-section"><h3>Executive alerts</h3><div class="ops-report-alerts">${alerts}</div></section>
      </div>
      <footer class="ops-report-footer"><label><input id="ops-report-hide" type="checkbox"> Do not show this report again</label><button class="uk-btn uk-btn--solid ops-report-continue" onclick="AEReports.close()">Continue Flight</button></footer>
    </div>`;
  }
  function openOperationsReport(data){
    if(hidden()){if(typeof window.dismissBanner==='function')window.dismissBanner();return false;}
    const overlay=document.getElementById('modal-overlay'),content=document.getElementById('modal-content');
    if(!overlay||!content){if(typeof window.dismissBanner==='function')window.dismissBanner();return false;}
    if(window.STATE&&window.STATE.timerInterval)clearInterval(window.STATE.timerInterval);
    content.innerHTML=build(data||{});
    content.classList.add('modal-wide','ops-report-modal');
    overlay.classList.add('open');
    open=true;
    return true;
  }
  function close(){
    const cb=document.getElementById('ops-report-hide');
    if(cb&&cb.checked)setHidden(true);
    const overlay=document.getElementById('modal-overlay'),content=document.getElementById('modal-content');
    if(overlay)overlay.classList.remove('open');
    if(content){content.classList.remove('modal-wide','ops-report-modal');content.innerHTML='';}
    open=false;
    if(typeof window.dismissBanner==='function')window.dismissBanner();
  }
  window.AEReports={openOperationsReport,close,isOpen:()=>open,resetPreference:()=>setHidden(false)};
})();