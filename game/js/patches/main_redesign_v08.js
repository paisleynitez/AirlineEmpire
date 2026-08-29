(function(){
  const tag='LOGO_EXPANSION_v09';
  window.PAISLEYNITEZ_BUILD = tag;

  function loadDraggablePopups(){
    if(document.getElementById('ae-draggable-popups-v01')) return;
    const script=document.createElement('script');
    script.id='ae-draggable-popups-v01';
    script.src='./js/patches/draggable_modals_v01.js';
    document.head.appendChild(script);
  }

  function applyV08(){
    try{
      document.documentElement.setAttribute('data-ae-build',tag);
      if(window.AE_SET_VERSION_MARK) window.AE_SET_VERSION_MARK();
      const oc=document.querySelector('#ops-center .oc-sub'); if(oc) oc.textContent='Ops feed · alerts, rivals, fleet, routes';
      const ticker=document.getElementById('stock-ticker'); if(ticker) ticker.classList.remove('visible');
      loadDraggablePopups();
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyV08); else applyV08();
  setTimeout(applyV08,250);
})();
