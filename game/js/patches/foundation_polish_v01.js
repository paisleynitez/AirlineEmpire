(function(){
  function applyFoundationPolish(){
    try{
      document.documentElement.setAttribute('data-pn-foundation','v01');
      var oldChip=document.getElementById('pn-foundation-chip');
      if(oldChip) oldChip.remove();
      var ticker=document.getElementById('stock-ticker');
      if(ticker) ticker.classList.remove('visible');
      var footer=document.querySelector('#home-statbar');
      if(footer) footer.style.display='none';
    }catch(e){ console.warn('Foundation polish skipped', e); }
  }
  function loadReportAssets(done){
    if(!document.getElementById('operations-report-css')){
      var link=document.createElement('link');
      link.id='operations-report-css';link.rel='stylesheet';link.href='./css/operations_report.css';document.head.appendChild(link);
    }
    if(window.AEReports){done();return;}
    var script=document.createElement('script');
    script.id='operations-report-js';script.src='./js/core/reports.js';script.onload=done;
    document.head.appendChild(script);
  }
  function makeReportData(){
    var flow=STATE._cashflow||{},hist=STATE._bannerHistory||{},routes=(STATE.routes||[]).slice();
    var best=routes.length?routes.slice().sort(function(a,b){return (b.profit||0)-(a.profit||0);})[0]:null;
    var watch=routes.length?routes.slice().sort(function(a,b){return (a.profit||0)-(b.profit||0);})[0]:null;
    var flights=routes.reduce(function(s,r){return s+(Number(r.flights)||0);},0);
    var seats=routes.reduce(function(s,r){var ac=AIRCRAFT[r.plane]||{};return s+(Number(r.flights)||0)*(Number(ac.seats)||0);},0);
    var owned=Object.values(STATE.planes||{}).reduce(function(s,p){return s+(Number(p.owned)||0);},0);
    var net=routes.reduce(function(s,r){return s+(Number(r.profit)||0);},0);
    var revenue=(flow.inc||[]).reduce(function(s,x){return s+(Number(x[1])||0);},0);
    var expenses=(flow.exp||[]).reduce(function(s,x){return s+(Number(x[1])||0);},0);
    return {monthLabel:flow.label||'Period complete',revenue:revenue,expenses:expenses,profit:Number(hist.profit)||Number(flow.net)||0,cash:STATE.cash,passengers:Number(hist.pax)||0,routes:routes.length,flightsPerWeek:flights,seatsPerWeek:seats,aircraftOwned:owned,bestRoute:best,watchRoute:watch,runway:(net<0&&STATE.cash>=0)?Math.floor(STATE.cash/-net):Infinity,disruption:Number(STATE._monthDisruption)||0,groundedTypes:[]};
  }
  function installReportHook(){
    if(window.__aeReportHook||!window.AEReports||typeof window.endTurn!=='function')return;
    window.__aeReportHook=true;
    var originalEndTurn=window.endTurn;
    window.endTurn=function(){
      var result=originalEndTurn.apply(this,arguments);
      if(STATE.gameOver)return result;
      clearInterval(STATE.timerInterval);STATE.paused=true;
      var opened=window.AEReports.openOperationsReport(makeReportData());
      if(!opened)STATE.paused=false;
      return result;
    };
  }
  function boot(){applyFoundationPolish();loadReportAssets(installReportHook);setTimeout(applyFoundationPolish,300);setTimeout(applyFoundationPolish,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
