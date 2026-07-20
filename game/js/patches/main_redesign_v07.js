(function(){
  const tag='MAIN_REDESIGN_v07';
  function polishMainRedesign(){
    try{
      document.documentElement.setAttribute('data-ae-build',tag);
      const oc=document.querySelector('#ops-center .oc-sub'); if(oc) oc.textContent='Clean command feed · alerts, rivals, fleet, routes';
      const left=document.getElementById('left-panel'); if(left) left.setAttribute('title','Command rail');
      const right=document.getElementById('right-panel'); if(right) right.setAttribute('title','Ops feed');
      const ticker=document.getElementById('stock-ticker'); if(ticker) ticker.classList.remove('visible');
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polishMainRedesign); else polishMainRedesign();
})();
