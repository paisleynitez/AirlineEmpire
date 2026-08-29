(function fleetAircraftV116(){
  'use strict';

  if(window.AEFleetAircraftV116) return;

  let queued=false;
  let drag=null;

  const TAB_ICONS=['✈','🛒','▤','🔧','▣','⌂'];

  function modal(){ return document.getElementById('modal-content'); }

  function normalizeModel(value){
    return String(value||'').replace(/[★☆]/g,'').replace(/\s+/g,' ').trim();
  }

  function slugForModel(model){
    return normalizeModel(model)
      .toLowerCase()
      .replace(/\s+/g,'')
      .replace(/[^a-z0-9-]/g,'');
  }

  function manifestEntry(model){
    const manifest=window.AEAircraftImageManifest;
    if(!manifest||!manifest.byModel) return null;
    if(manifest.byModel[model]) return manifest.byModel[model];
    const target=model.replace(/[\s-]/g,'').toLowerCase();
    const key=Object.keys(manifest.byModel).find(k=>k.replace(/[\s-]/g,'').toLowerCase()===target);
    return key?manifest.byModel[key]:null;
  }

  function applyThumb(row){
    const thumb=row.querySelector('.flp-plane-thumb');
    const nameEl=row.querySelector('.flp-ac-name');
    if(!thumb||!nameEl) return;

    const model=normalizeModel(nameEl.textContent);
    const entry=manifestEntry(model);
    const fallback='../assets/aircraft-cards/source/'+slugForModel(model)+'.svg';
    const path=(entry&&entry.path)||fallback;
    if(thumb.dataset.aeFleetImage===path) return;

    const probe=new Image();
    probe.onload=function(){
      thumb.dataset.aeFleetImage=path;
      thumb.classList.add('has-aircraft-image');
      thumb.style.backgroundImage="linear-gradient(90deg,rgba(2,12,19,.04),rgba(2,12,19,.015) 58%,rgba(2,12,19,.14)),url('"+path+"')";
      thumb.style.backgroundSize='cover';
      thumb.style.backgroundPosition='center';
      thumb.textContent='';
      thumb.setAttribute('role','img');
      thumb.setAttribute('aria-label',model+' aircraft preview');
    };
    probe.onerror=function(){
      thumb.dataset.aeFleetImage='missing:'+path;
    };
    probe.src=path;
  }

  function decorateTabs(flp){
    flp.querySelectorAll('.flp-tab').forEach(function(tab,index){
      if(tab.querySelector('.ae-fleet-tab-icon')) return;
      const icon=document.createElement('span');
      icon.className='ae-fleet-tab-icon';
      icon.textContent=TAB_ICONS[index]||'•';
      tab.insertBefore(icon,tab.firstChild);
    });
  }

  function addToolbar(flp){
    if(flp.querySelector('.ae-fleet-toolbar')) return;
    const body=flp.querySelector('.flp-body');
    const table=body&&body.querySelector('.flp-table');
    if(!body||!table) return;

    const toolbar=document.createElement('div');
    toolbar.className='ae-fleet-toolbar';
    toolbar.innerHTML=
      '<div class="ae-fleet-tools-left">'+
        '<input class="ae-fleet-search" type="search" placeholder="Search aircraft..." aria-label="Search aircraft">'+
        '<select class="ae-fleet-status" aria-label="Filter aircraft status">'+
          '<option value="all">All Status</option>'+
          '<option value="active">Active</option>'+
          '<option value="operational">Operational</option>'+
          '<option value="maintenance">Maintenance</option>'+
          '<option value="leased">Leased</option>'+
        '</select>'+
      '</div>'+
      '<div class="ae-fleet-tools-right" aria-label="Fleet view">'+
        '<button class="ae-fleet-view active" type="button" data-view="list" aria-label="List view" aria-pressed="true">☷</button>'+
        '<button class="ae-fleet-view" type="button" data-view="grid" aria-label="Grid view" aria-pressed="false">▦</button>'+
      '</div>';

    body.insertBefore(toolbar,table);

    toolbar.addEventListener('input',function(){ applyFilters(flp); });
    toolbar.addEventListener('change',function(){ applyFilters(flp); });
    toolbar.addEventListener('click',function(event){
      const button=event.target.closest('.ae-fleet-view');
      if(!button) return;
      setView(flp,button.dataset.view||'list');
    });
  }

  function applyFilters(flp){
    const toolbar=flp.querySelector('.ae-fleet-toolbar');
    if(!toolbar) return;
    const q=String(toolbar.querySelector('.ae-fleet-search')?.value||'').trim().toLowerCase();
    const status=String(toolbar.querySelector('.ae-fleet-status')?.value||'all').toLowerCase();
    const rows=[...flp.querySelectorAll('#flp-rows > .flp-row')];
    rows.forEach(function(row){
      const text=String(row.textContent||'').toLowerCase();
      const show=(!q||text.includes(q))&&(status==='all'||text.includes(status));
      row.style.display=show?'':'none';
    });
  }

  function setView(flp,mode){
    const m=modal();
    if(!m) return;
    m.classList.toggle('fleet-grid-view',mode==='grid');
    flp.querySelectorAll('.ae-fleet-view').forEach(function(btn){
      const active=btn.dataset.view===mode;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
  }

  function centerFleet(m){
    if(!m||m.dataset.aeFleetCentered==='1') return;
    m.style.removeProperty('left');
    m.style.removeProperty('top');
    m.style.removeProperty('right');
    m.style.removeProperty('bottom');
    m.style.removeProperty('transform');
    m.style.removeProperty('position');
    m.style.removeProperty('margin');
    m.dataset.aeFleetCentered='1';
  }

  function markFleet(){
    const m=modal();
    const flp=m&&m.querySelector('.flp');
    if(!m||!flp){
      if(m){
        m.removeAttribute('data-ae-fleet-ui');
        m.removeAttribute('data-ae-fleet-centered');
        m.classList.remove('fleet-grid-view','ae-fleet-dragging');
      }
      return;
    }

    m.setAttribute('data-ae-fleet-ui','v116');
    centerFleet(m);
    decorateTabs(flp);
    addToolbar(flp);
    flp.querySelectorAll('.flp-row').forEach(applyThumb);
    applyFilters(flp);
  }

  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(function(){ queued=false; markFleet(); });
  }

  function startDrag(event){
    if(event.button!==0) return;
    const head=event.target.closest('.flp-head');
    const m=modal();
    if(!head||!m||m.dataset.aeFleetUi!=='v116'||!m.contains(head)) return;
    if(event.target.closest('button,input,select,a,[role="button"]')) return;

    const r=m.getBoundingClientRect();
    m.style.position='fixed';
    m.style.left=r.left+'px';
    m.style.top=r.top+'px';
    m.style.right='auto';
    m.style.bottom='auto';
    m.style.margin='0';
    m.style.transform='none';
    m.classList.add('ae-fleet-dragging');
    drag={pointerId:event.pointerId,dx:event.clientX-r.left,dy:event.clientY-r.top};
    head.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event){
    if(!drag||event.pointerId!==drag.pointerId) return;
    const m=modal();
    if(!m) return;
    const r=m.getBoundingClientRect();
    const pad=10;
    const maxLeft=Math.max(pad,innerWidth-r.width-pad);
    const maxTop=Math.max(pad,innerHeight-r.height-pad);
    const left=Math.min(Math.max(pad,event.clientX-drag.dx),maxLeft);
    const top=Math.min(Math.max(pad,event.clientY-drag.dy),maxTop);
    m.style.left=left+'px';
    m.style.top=top+'px';
  }

  function stopDrag(event){
    if(!drag) return;
    if(event&&event.pointerId!==undefined&&event.pointerId!==drag.pointerId) return;
    modal()?.classList.remove('ae-fleet-dragging');
    drag=null;
  }

  function hookFleetOpens(){
    if(window.__aeFleetV116Hooks) return;
    window.__aeFleetV116Hooks=true;

    const nativeOpenFleet=window.openFleetPage;
    if(typeof nativeOpenFleet==='function'){
      window.openFleetPage=function(){
        const m=modal();
        if(m) m.removeAttribute('data-ae-fleet-centered');
        const result=nativeOpenFleet.apply(this,arguments);
        setTimeout(schedule,0);
        return result;
      };
    }

    const nativeSetTab=window.fleetSetTab;
    if(typeof nativeSetTab==='function'){
      window.fleetSetTab=function(){
        const result=nativeSetTab.apply(this,arguments);
        setTimeout(schedule,0);
        return result;
      };
    }
  }

  function init(){
    hookFleetOpens();
    schedule();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('pointerdown',startDrag,true);
    document.addEventListener('pointermove',moveDrag,true);
    document.addEventListener('pointerup',stopDrag,true);
    document.addEventListener('pointercancel',stopDrag,true);
    window.addEventListener('resize',schedule,{passive:true});

    let tries=0;
    const timer=setInterval(function(){
      hookFleetOpens();
      schedule();
      if(++tries>=24) clearInterval(timer);
    },250);
  }

  window.AEFleetAircraftV116={version:'v1.1.16',refresh:schedule};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
