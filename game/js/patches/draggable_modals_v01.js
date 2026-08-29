(function draggableModalsV01(){
  'use strict';

  if(window.AEDraggableModalsV01) return;
  window.AEDraggableModalsV01=true;

  const POPUP_SELECTOR=[
    '#modal-content.modal',
    '#lab-content.lab-card',
    '#ac-pop-card',
    '.modal',
    '.lab-card'
  ].join(',');

  const HANDLE_SELECTOR=[
    '.modal-header',
    '.rov-header',
    '.ops-report-header',
    '.lab-header',
    '.ac-pop-header',
    '.nr-header',
    '.rm-header',
    '.cm-header',
    '.bf-header',
    '.projects-head',
    '.neg-header'
  ].join(',');

  const INTERACTIVE_SELECTOR=[
    'button','a','input','select','textarea','label','summary',
    '[role="button"]','[contenteditable="true"]'
  ].join(',');

  let drag=null;

  function visible(el){
    if(!el) return false;
    const style=getComputedStyle(el);
    const rect=el.getBoundingClientRect();
    return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.height>0;
  }

  function popupFor(target){
    const popup=target.closest?.(POPUP_SELECTOR);
    return popup && visible(popup) ? popup : null;
  }

  function isHandle(target,popup){
    const explicit=target.closest?.(HANDLE_SELECTOR);
    if(explicit && popup.contains(explicit)) return explicit;

    if(target.closest?.(INTERACTIVE_SELECTOR)) return null;

    const rect=popup.getBoundingClientRect();
    const y=eventY(target);
    if(y!==null && y>=rect.top && y<=rect.top+64) return popup;
    return null;
  }

  function eventY(target){
    const ev=window.event;
    return ev && typeof ev.clientY==='number' ? ev.clientY : null;
  }

  function clamp(popup,left,top){
    const rect=popup.getBoundingClientRect();
    const pad=10;
    return {
      left:Math.min(Math.max(pad,left),Math.max(pad,innerWidth-rect.width-pad)),
      top:Math.min(Math.max(pad,top),Math.max(pad,innerHeight-rect.height-pad))
    };
  }

  function prime(popup){
    const rect=popup.getBoundingClientRect();
    popup.style.position='fixed';
    popup.style.left=`${rect.left}px`;
    popup.style.top=`${rect.top}px`;
    popup.style.right='auto';
    popup.style.bottom='auto';
    popup.style.margin='0';
    popup.style.transform='none';
    popup.style.zIndex='10001';
  }

  function reset(popup){
    if(!popup) return;
    popup.classList.remove('ae-popup-dragging');
    ['position','left','top','right','bottom','margin','transform','z-index'].forEach(name=>popup.style.removeProperty(name));
    if(drag && drag.popup===popup) drag=null;
  }

  function start(event){
    if(event.button!==0) return;
    const popup=popupFor(event.target);
    if(!popup) return;

    const explicit=event.target.closest?.(HANDLE_SELECTOR);
    const rectBefore=popup.getBoundingClientRect();
    const topBand=!event.target.closest?.(INTERACTIVE_SELECTOR) && event.clientY>=rectBefore.top && event.clientY<=rectBefore.top+64;
    if(!(explicit && popup.contains(explicit)) && !topBand) return;
    if(event.target.closest?.(INTERACTIVE_SELECTOR)) return;

    prime(popup);
    const rect=popup.getBoundingClientRect();
    drag={
      popup,
      pointerId:event.pointerId,
      offsetX:event.clientX-rect.left,
      offsetY:event.clientY-rect.top
    };
    popup.classList.add('ae-popup-dragging');
    (explicit || popup).setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function move(event){
    if(!drag || event.pointerId!==drag.pointerId) return;
    const next=clamp(drag.popup,event.clientX-drag.offsetX,event.clientY-drag.offsetY);
    drag.popup.style.left=`${next.left}px`;
    drag.popup.style.top=`${next.top}px`;
  }

  function stop(event){
    if(!drag) return;
    if(event && event.pointerId!==undefined && event.pointerId!==drag.pointerId) return;
    drag.popup.classList.remove('ae-popup-dragging');
    drag=null;
  }

  function installStyles(){
    if(document.getElementById('ae-draggable-popups-v01-style')) return;
    const style=document.createElement('style');
    style.id='ae-draggable-popups-v01-style';
    style.textContent=`
      body.ae-executive-command #modal-overlay.open .modal.modal-new-route{
        width:76vw!important;
        height:80vh!important;
        max-width:1100px!important;
        max-height:720px!important;
        overflow:hidden!important;
      }
      body.ae-executive-command .modal-new-route :is(.modal-body,.nr-body,.nr-content,.nr-main){
        min-height:0!important;
      }
      body.ae-executive-command :is(.modal,.lab-card,#ac-pop-card) :is(.modal-header,.rov-header,.ops-report-header,.lab-header,.ac-pop-header,.nr-header,.rm-header,.cm-header,.bf-header,.projects-head,.neg-header){
        cursor:grab!important;
        user-select:none!important;
        touch-action:none!important;
      }
      body.ae-executive-command :is(.modal,.lab-card,#ac-pop-card).ae-popup-dragging :is(.modal-header,.rov-header,.ops-report-header,.lab-header,.ac-pop-header,.nr-header,.rm-header,.cm-header,.bf-header,.projects-head,.neg-header){
        cursor:grabbing!important;
      }
      @media (max-width:900px){
        body.ae-executive-command #modal-overlay.open .modal.modal-new-route{
          width:calc(100vw - 24px)!important;
          height:calc(100vh - 24px)!important;
          max-width:calc(100vw - 24px)!important;
          max-height:calc(100vh - 24px)!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function keepOnScreen(){
    document.querySelectorAll(POPUP_SELECTOR).forEach(popup=>{
      if(!visible(popup) || !popup.style.left) return;
      const rect=popup.getBoundingClientRect();
      const next=clamp(popup,rect.left,rect.top);
      popup.style.left=`${next.left}px`;
      popup.style.top=`${next.top}px`;
    });
  }

  function watchOverlay(overlayId,popupId){
    const overlay=document.getElementById(overlayId);
    const popup=document.getElementById(popupId);
    if(!overlay || !popup) return;
    new MutationObserver(()=>{
      if(!overlay.classList.contains('open')) reset(popup);
    }).observe(overlay,{attributes:true,attributeFilter:['class']});
  }

  function init(){
    installStyles();
    document.addEventListener('pointerdown',start,true);
    document.addEventListener('pointermove',move,true);
    document.addEventListener('pointerup',stop,true);
    document.addEventListener('pointercancel',stop,true);
    window.addEventListener('resize',keepOnScreen);
    watchOverlay('modal-overlay','modal-content');
    watchOverlay('lab-overlay','lab-content');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
