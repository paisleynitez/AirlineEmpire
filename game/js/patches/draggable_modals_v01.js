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
        width:min(76vw,1100px)!important;
        height:min(80vh,720px)!important;
        max-width:calc(100vw - 32px)!important;
        max-height:calc(100vh - 32px)!important;
        overflow:hidden!important;
        font-size:clamp(13px,.78vw,16px)!important;
        line-height:1.4!important;
      }

      body.ae-executive-command .modal-new-route :is(.modal-body,.nr-body,.nr-content,.nr-main){
        min-height:0!important;
      }

      body.ae-executive-command .modal-new-route :is(.modal-body,.nr-body,.nr-content,.nr-main,.nr-pane){
        overflow:auto;
      }

      body.ae-executive-command .modal-new-route :is(h1,h2,h3,.modal-title,.nr-title,.nr-pane-heading strong){
        line-height:1.15!important;
        letter-spacing:0!important;
        text-wrap:balance;
      }

      body.ae-executive-command .modal-new-route .modal-title{
        font-size:clamp(20px,1.45vw,28px)!important;
      }

      body.ae-executive-command .modal-new-route :is(.nr-pane-heading strong,.nr-title){
        font-size:clamp(17px,1.2vw,23px)!important;
      }

      body.ae-executive-command .modal-new-route :is(
        .nr-pane-heading,.nr-label,.nr-meta,.nr-city-card,.nr-plane-row,.region-tab,
        .nr-est,.nr-route-hero,.nr-fare-section,.nr-footer,.uk-info,.info-box,
        button,input,select,textarea
      ){
        font-size:clamp(12.5px,.74vw,15px)!important;
      }

      body.ae-executive-command .modal-new-route :is(
        .nr-meta,.nr-sub,.nr-city-meta,.nr-plane-meta,.nr-muted,small
      ){
        color:#aebfc6!important;
        font-size:clamp(11.5px,.67vw,13.5px)!important;
        line-height:1.45!important;
      }

      body.ae-executive-command .modal-new-route :is(
        .modal-title,.nr-title,.nr-pane-heading strong,.nr-city-card strong,
        .nr-plane-row strong,.nr-est strong,.nr-route-hero strong
      ){
        color:#f4f8f9!important;
        font-weight:750!important;
        text-shadow:none!important;
      }

      body.ae-executive-command .modal-new-route :is(.region-tab,.nr-city-card,.nr-plane-row,button){
        min-height:34px;
      }

      body.ae-executive-command .modal-new-route :is(.nr-pane,.nr-est,.nr-fare-section,.nr-route-hero){
        padding:clamp(10px,1vw,16px)!important;
      }

      body.ae-executive-command .modal-new-route :is(.nr-city-card,.nr-plane-row){
        padding:clamp(8px,.75vw,12px)!important;
      }

      body.ae-executive-command .modal-new-route .nr-footer{
        min-height:58px!important;
        padding:10px clamp(12px,1.2vw,20px)!important;
      }

      body.ae-executive-command :is(.modal,.lab-card,#ac-pop-card) :is(.modal-header,.rov-header,.ops-report-header,.lab-header,.ac-pop-header,.nr-header,.rm-header,.cm-header,.bf-header,.projects-head,.neg-header){
        cursor:grab!important;
        user-select:none!important;
        touch-action:none!important;
      }

      body.ae-executive-command :is(.modal,.lab-card,#ac-pop-card).ae-popup-dragging :is(.modal-header,.rov-header,.ops-report-header,.lab-header,.ac-pop-header,.nr-header,.rm-header,.cm-header,.bf-header,.projects-head,.neg-header){
        cursor:grabbing!important;
      }

      @media (max-width:1200px){
        body.ae-executive-command #modal-overlay.open .modal.modal-new-route{
          width:min(90vw,1050px)!important;
          height:min(86vh,700px)!important;
        }
      }

      @media (max-width:900px){
        body.ae-executive-command #modal-overlay.open .modal.modal-new-route{
          width:calc(100vw - 20px)!important;
          height:calc(100vh - 20px)!important;
          max-width:calc(100vw - 20px)!important;
          max-height:calc(100vh - 20px)!important;
          font-size:14px!important;
        }
        body.ae-executive-command .modal-new-route :is(.nr-grid,.nr-layout,.nr-columns,.nr-main-grid){
          grid-template-columns:1fr!important;
        }
      }

      @media (max-width:640px){
        body.ae-executive-command .modal-new-route{
          font-size:13.5px!important;
        }
        body.ae-executive-command .modal-new-route .modal-title{
          font-size:20px!important;
        }
        body.ae-executive-command .modal-new-route :is(.region-tabs,.nr-region-tabs,.nr-tabs){
          overflow-x:auto!important;
          flex-wrap:nowrap!important;
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
