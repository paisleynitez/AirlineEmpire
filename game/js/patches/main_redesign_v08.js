(function(){
  const tag='LOGO_EXPANSION_v09';
  window.PAISLEYNITEZ_BUILD = tag;

  function installNewRouteWindow(){
    if(document.getElementById('ae-new-route-window-style')) return;

    const style=document.createElement('style');
    style.id='ae-new-route-window-style';
    style.textContent=`
      body.ae-executive-command #modal-overlay.open .modal.modal-new-route{
        width:min(1180px,calc(100vw - 72px))!important;
        max-width:1180px!important;
        height:min(760px,calc(100vh - 72px))!important;
        max-height:calc(100vh - 72px)!important;
        margin:0!important;
        position:fixed!important;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        overflow:hidden!important;
        border-radius:14px!important;
      }
      body.ae-executive-command .modal-new-route .modal-header{
        cursor:grab!important;
        user-select:none;
        touch-action:none;
      }
      body.ae-executive-command .modal-new-route.ae-window-dragging .modal-header{
        cursor:grabbing!important;
      }
      body.ae-executive-command .modal-new-route :is(.modal-body,.nr-body,.nr-content,.nr-main){
        min-height:0!important;
      }
      @media (max-width:900px){
        body.ae-executive-command #modal-overlay.open .modal.modal-new-route{
          width:calc(100vw - 24px)!important;
          max-width:calc(100vw - 24px)!important;
          height:calc(100vh - 24px)!important;
          max-height:calc(100vh - 24px)!important;
        }
      }
    `;
    document.head.appendChild(style);

    const modal=document.getElementById('modal-content');
    const overlay=document.getElementById('modal-overlay');
    if(!modal||!overlay) return;

    let drag=null;
    const interactive='button,a,input,select,textarea,label,[role="button"],[contenteditable="true"]';

    function resetPosition(){
      drag=null;
      modal.classList.remove('ae-window-dragging');
      modal.style.removeProperty('left');
      modal.style.removeProperty('top');
      modal.style.removeProperty('right');
      modal.style.removeProperty('bottom');
      modal.style.removeProperty('transform');
      modal.style.removeProperty('margin');
    }

    function clampPosition(left,top){
      const rect=modal.getBoundingClientRect();
      const pad=10;
      const maxLeft=Math.max(pad,window.innerWidth-rect.width-pad);
      const maxTop=Math.max(pad,window.innerHeight-rect.height-pad);
      return {
        left:Math.min(Math.max(pad,left),maxLeft),
        top:Math.min(Math.max(pad,top),maxTop)
      };
    }

    modal.addEventListener('pointerdown',event=>{
      if(event.button!==0||!modal.classList.contains('modal-new-route')) return;
      const header=event.target.closest('.modal-header');
      if(!header||!modal.contains(header)||event.target.closest(interactive)) return;

      const rect=modal.getBoundingClientRect();
      drag={
        pointerId:event.pointerId,
        offsetX:event.clientX-rect.left,
        offsetY:event.clientY-rect.top
      };

      modal.style.left=`${rect.left}px`;
      modal.style.top=`${rect.top}px`;
      modal.style.right='auto';
      modal.style.bottom='auto';
      modal.style.transform='none';
      modal.style.margin='0';
      modal.classList.add('ae-window-dragging');
      header.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    modal.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.pointerId) return;
      const next=clampPosition(event.clientX-drag.offsetX,event.clientY-drag.offsetY);
      modal.style.left=`${next.left}px`;
      modal.style.top=`${next.top}px`;
    });

    function finishDrag(event){
      if(!drag||event.pointerId!==drag.pointerId) return;
      drag=null;
      modal.classList.remove('ae-window-dragging');
    }
    modal.addEventListener('pointerup',finishDrag);
    modal.addEventListener('pointercancel',finishDrag);

    window.addEventListener('resize',()=>{
      if(!modal.classList.contains('modal-new-route')||!modal.style.left) return;
      const rect=modal.getBoundingClientRect();
      const next=clampPosition(rect.left,rect.top);
      modal.style.left=`${next.left}px`;
      modal.style.top=`${next.top}px`;
    });

    const observer=new MutationObserver(()=>{
      if(!overlay.classList.contains('open')||!modal.classList.contains('modal-new-route')) resetPosition();
    });
    observer.observe(overlay,{attributes:true,attributeFilter:['class']});
    observer.observe(modal,{attributes:true,attributeFilter:['class']});
  }

  function applyV08(){
    try{
      document.documentElement.setAttribute('data-ae-build',tag);
      if(window.AE_SET_VERSION_MARK) window.AE_SET_VERSION_MARK();
      const oc=document.querySelector('#ops-center .oc-sub'); if(oc) oc.textContent='Ops feed · alerts, rivals, fleet, routes';
      const ticker=document.getElementById('stock-ticker'); if(ticker) ticker.classList.remove('visible');
      installNewRouteWindow();
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyV08); else applyV08();
  setTimeout(applyV08,250);
})();
