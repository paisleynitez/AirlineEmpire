(function(){
  const tag='LOGO_EXPANSION_v09';
  window.PAISLEYNITEZ_BUILD = tag;
  function applyV08(){
    try{
      document.documentElement.setAttribute('data-ae-build',tag);
      if(window.AE_SET_VERSION_MARK) window.AE_SET_VERSION_MARK();
      const oc=document.querySelector('#ops-center .oc-sub'); if(oc) oc.textContent='Ops feed · alerts, rivals, fleet, routes';
      const ticker=document.getElementById('stock-ticker'); if(ticker) ticker.classList.remove('visible');
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyV08); else applyV08();
  setTimeout(applyV08,250);
})();
