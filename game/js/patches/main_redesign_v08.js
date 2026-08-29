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

  function installNewRouteDrag(){
    const modal=document.getElementById('modal-content');
    if(!modal || modal.dataset.nrDragInstalled==='1') return;
    modal.dataset.nrDragInstalled='1';

    let dragging=false;
    let pointerId=null;
    let startX=0, startY=0, startLeft=0, startTop=0;

    function isNewRoute(){ return modal.classList.contains('modal-new-route'); }
    function dragHandle(){
      return modal.querySelector('.nr-header, .modal-header, .nr-titlebar, .nr-topbar, header');
    }
    function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

    modal.addEventListener('pointerdown',function(e){
      if(!isNewRoute() || e.button!==0) return;
      const handle=dragHandle();
      if(!handle || !handle.contains(e.target)) return;
      if(e.target.closest('button,input,select,textarea,a,[role="button"]')) return;

      const rect=modal.getBoundingClientRect();
      dragging=true;
      pointerId=e.pointerId;
      startX=e.clientX;
      startY=e.clientY;
      startLeft=rect.left;
      startTop=rect.top;

      modal.style.position='fixed';
      modal.style.margin='0';
      modal.style.left=rect.left+'px';
      modal.style.top=rect.top+'px';
      modal.style.transform='none';
      modal.style.right='auto';
      modal.style.bottom='auto';
      modal.style.zIndex='10001';
      handle.style.cursor='grabbing';
      handle.style.userSelect='none';
      try{ modal.setPointerCapture(pointerId); }catch(_){ }
      e.preventDefault();
    });

    modal.addEventListener('pointermove',function(e){
      if(!dragging || e.pointerId!==pointerId || !isNewRoute()) return;
      const rect=modal.getBoundingClientRect();
      const maxLeft=Math.max(0,window.innerWidth-rect.width);
      const maxTop=Math.max(0,window.innerHeight-Math.min(rect.height,80));
      const left=clamp(startLeft+(e.clientX-startX),0,maxLeft);
      const top=clamp(startTop+(e.clientY-startY),0,maxTop);
      modal.style.left=left+'px';
      modal.style.top=top+'px';
    });

    function stop(e){
      if(!dragging) return;
      const handle=dragHandle();
      dragging=false;
      if(handle) handle.style.cursor='grab';
      try{ modal.releasePointerCapture(pointerId); }catch(_){ }
      pointerId=null;
    }
    modal.addEventListener('pointerup',stop);
    modal.addEventListener('pointercancel',stop);

    const observer=new MutationObserver(function(){
      if(isNewRoute()){
        const handle=dragHandle();
        if(handle){
          handle.style.cursor='grab';
          handle.title=handle.title || 'Drag to move window';
        }
      }else if(!dragging){
        modal.style.removeProperty('position');
        modal.style.removeProperty('margin');
        modal.style.removeProperty('left');
        modal.style.removeProperty('top');
        modal.style.removeProperty('right');
        modal.style.removeProperty('bottom');
        modal.style.removeProperty('transform');
        modal.style.removeProperty('z-index');
      }
    });
    observer.observe(modal,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  }

  function boot(){ applyV08(); installNewRouteDrag(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(boot,250);
})();
