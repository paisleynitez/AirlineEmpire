/* DEV_CONSOLE_v01 — "Dev" tab inside the ⚙ Tune panel.
   One place to jump to any page, open/close any window, drive the clock, fire End Turn,
   and flip kill switches (stop map animation, silence flashes, hide guide/tour, close overlays).
   Adds a tab to the existing dev tuner and renders into #dt-body; nothing else is modified.
   Kill switches are UI-level toggles and do not alter economy or save data. */
(function devConsoleV01(){
  'use strict';
  if(window.AEDevConsoleV01) return;
  const API=window.AEDevConsoleV01={version:'v01'};

  const PAGES=[['dash','Dashboard'],['routes','Routes'],['fleet','Fleet'],['airports','Airports'],['cargo','Cargo'],['maintenance','Hangar'],['finance','Finance'],['marketing','Marketing'],['research','Research'],['alliances','Alliances'],['hr','Human Resources'],['reports','Reports'],['logs','Logs'],['mi','Market Intel']];
  const WINDOWS=[['new-route','New Route'],['route-manager','Route Manager'],['buy-planes','Buy Aircraft'],['fleet-page','Fleet Page'],['negotiations','Slot Negotiations'],['build-hub','Build Hub'],['buy-biz','Ventures'],['bank','Bank / Loans'],['shares','Shares'],['budget','Budget'],['ledger','Ledger'],['logviewer','Log Viewer'],['campaign','Campaign'],['crew','Crew'],['hr','HR'],['projects','Projects'],['research-hub','Research Hub'],['guide','Guide'],['settings','Settings']];
  const state={anim:false,flash:false,events:false};
  let nativeFlash=null;
  const PREF_SKIP='ae_dev_skip_intro', PREF_AUTOLOAD='ae_dev_autoload';
  function pref(k){ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } }
  function setPref(k,v){ try{ v?localStorage.setItem(k,v):localStorage.removeItem(k); }catch(e){} }

  function flash(m){ try{ (nativeFlash||window.showFlash)(m); }catch(e){} }
  function S(){ try{ return (typeof STATE!=='undefined')?STATE:null; }catch(e){ return null; } }
  function call(fn){ try{ fn(); }catch(e){ console.error('[Dev]',e); flash('Dev: '+(e&&e.message||e)); } }

  function installStyles(){
    if(document.getElementById('ae-dev-console-v01-style')) return;
    const st=document.createElement('style'); st.id='ae-dev-console-v01-style';
    st.textContent=`
      .dtc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin:4px 0 8px}
      .dtc-grid.c3{grid-template-columns:repeat(3,minmax(0,1fr))}
      .dtc-btn{padding:6px 7px;border:1px solid rgba(160,148,184,.22);border-radius:6px;background:rgba(255,255,255,.035);color:#e8e2f3;font:600 10.5px Inter,system-ui,sans-serif;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .dtc-btn:hover{border-color:rgba(167,137,255,.5);color:#fff;background:rgba(167,137,255,.12)}
      .dtc-btn.on{border-color:rgba(255,120,120,.55);background:rgba(255,80,80,.14);color:#ffd7d7}
      .dtc-btn.go{border-color:rgba(78,234,170,.4);background:rgba(78,234,170,.08)}
      .dtc-head{margin:8px 0 3px;font:800 9.5px Inter,system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#a99dc0}
      .dtc-note{font-size:9.5px;color:#7f7896;margin:2px 0 6px;line-height:1.4}
      #dev-tuner .dt-tab[data-tab="dev"]{color:#78d9cc}
      #dev-tuner .dt-tab[data-tab="dev"].active{color:#fff;border-bottom-color:#78d9cc}
    `;
    document.head.appendChild(st);
  }

  function btn(label,action,cls){ const id='dtc_'+Math.random().toString(36).slice(2,8); API._acts[id]=action; return '<button type="button" class="dtc-btn '+(cls||'')+'" data-act="'+id+'">'+label+'</button>'; }
  function tog(label,key,on,off){ return btn((state[key]?'■ ':'▶ ')+label,function(){ state[key]=!state[key]; (state[key]?on:off)(); render(); },state[key]?'on':''); }

  function closeOverlays(){
    call(function(){ if(typeof window.closeModal==='function') window.closeModal(); });
    call(function(){ if(typeof window.closeLab==='function') window.closeLab(); });
    ['cont-ovl','ac-pop','pause-overlay','tour-overlay'].forEach(function(id){ const el=document.getElementById(id); if(!el) return; if(id==='cont-ovl') el.remove(); else if(id==='tour-overlay') el.classList.add('hidden'); else el.style.display='none'; });
    const sn=document.getElementById('ae-slot-negotiations'); if(sn) sn.hidden=true;
    const g=document.getElementById('first-turn-guide'); if(g) g.classList.remove('show');
  }
  function animOn(){ let st=document.getElementById('ae-dev-anim-stop'); if(!st){ st=document.createElement('style'); st.id='ae-dev-anim-stop'; st.textContent='#world-map *,#map-container *,#intro *,.sp-net *{animation:none!important;transition:none!important}'; document.head.appendChild(st);} }
  function animOff(){ const st=document.getElementById('ae-dev-anim-stop'); if(st) st.remove(); }
  function flashOn(){ if(!nativeFlash&&typeof window.showFlash==='function'){ nativeFlash=window.showFlash; window.showFlash=function(){}; } }
  function flashOff(){ if(nativeFlash){ window.showFlash=nativeFlash; nativeFlash=null; } }
  function eventsOn(){ window._aeDevEventFreqBackup=window._dtEventFreq; window._dtEventFreq=0; }
  function eventsOff(){ window._dtEventFreq=window._aeDevEventFreqBackup; }

  // Startup: skip the intro cinematic and/or drop straight into a save. Runs once on load.
  function bootStartup(){
    if(window.__aeDevBootDone) return; window.__aeDevBootDone=true;
    const skip=pref(PREF_SKIP)==='1', slot=pref(PREF_AUTOLOAD);
    if(!skip&&!slot) return;
    if(!document.getElementById('ae-dev-skip-intro-style')){
      const st=document.createElement('style'); st.id='ae-dev-skip-intro-style';
      st.textContent='#cinematic{display:none!important}#game-ui.entering,#game-ui.entering *{animation:none!important}#intro-inner{opacity:1!important;transform:none!important}';
      document.head.appendChild(st);
    }
    const kill=function(){ call(function(){ if(typeof window.clearCineTimers==='function') window.clearCineTimers(); if(typeof window.endCinematic==='function') window.endCinematic(); }); };
    kill(); setTimeout(kill,50); setTimeout(kill,400);
    if(slot){
      const tryLoad=function(n){
        let raw=null; try{ raw=localStorage.getItem((typeof window.SAVE_KEY==='function'?window.SAVE_KEY(slot):'ae_save_'+slot)); }catch(e){}
        if(!raw){ if(n<1) flash('Dev auto-load: slot "'+slot+'" is empty'); return; }
        if(typeof window.loadFromSlot!=='function'||typeof window.applySave!=='function'){ if(n<20) setTimeout(function(){tryLoad(n+1);},150); return; }
        call(function(){ window.loadFromSlot(slot==='q'?'q':Number(slot)); });
      };
      setTimeout(function(){ tryLoad(0); },120);
    }
  }

  function html(){
    const s=S(); const mode=s?(s.paused?'paused':(s.timerMode||'off')):'—';
    let h='<div class="dtc-note">Jump anywhere, open or close any window, drive the clock, and flip kill switches. Clock: <b style="color:#fff">'+mode+'</b>'+(s?' · '+(s.month||'')+'/'+(s.year||''):'')+'</div>';
    h+='<div class="dtc-head">Pages</div><div class="dtc-grid c3">'+PAGES.map(function(p){ return btn(p[1],function(){ const el=document.querySelector('.ae-nav-item[onclick*="\''+p[0]+'\'"]'); if(typeof window.navGo==='function') window.navGo(el,p[0]); }); }).join('')+'</div>';
    h+='<div class="dtc-head">Windows</div><div class="dtc-grid c3">'+WINDOWS.map(function(w){ return btn(w[1],function(){ if(typeof window.openModal==='function') window.openModal(w[0]); }); }).join('')+btn('✕ Close all overlays',closeOverlays,'on')+'</div>';
    h+='<div class="dtc-head">Clock &amp; turn</div><div class="dtc-grid c3">'+
      btn('▶ Play (2×)',function(){ window.setSpeed&&window.setSpeed('normal'); render(); })+btn('▸▸ 4×',function(){ window.setSpeed&&window.setSpeed('fast'); render(); })+btn('▸▸▸ 8×',function(){ window.setSpeed&&window.setSpeed('turbo'); render(); })+
      btn('⏸ Pause / resume',function(){ window.setSpeed&&window.setSpeed('pause'); render(); })+btn('■ Stop clock (manual)',function(){ window.setSpeed&&window.setSpeed('off'); render(); })+btn('⏭ End Turn',function(){ const b=document.getElementById('end-turn-btn'); if(b) b.click(); else if(window.endTurn) window.endTurn(); setTimeout(render,300); },'go')+
      btn('Dismiss month report',function(){ if(window.AEReports&&window.AEReports.close) window.AEReports.close(); if(window.operationsReportDismiss) window.operationsReportDismiss(); render(); })+btn('💾 Quick save',function(){ window.qsave&&window.qsave(); })+btn('⟲ Quick load',function(){ window.qload&&window.qload(); })+
    '</div>';
    const slot=pref(PREF_AUTOLOAD);
    const opt=function(v,l){ return '<option value="'+v+'"'+(slot===v?' selected':'')+'>'+l+'</option>'; };
    h+='<div class="dtc-head">Startup (persists across reloads)</div><div class="dtc-grid">'+
      btn((pref(PREF_SKIP)==='1'?'■ ':'▶ ')+'Skip intro cinematic on load',function(){ setPref(PREF_SKIP,pref(PREF_SKIP)==='1'?'':'1'); render(); },pref(PREF_SKIP)==='1'?'on':'')+
      '<select class="dtc-btn" data-pref="autoload" aria-label="Auto-load on start">'+opt('','Auto-load: off')+opt('q','Auto-load: quicksave')+opt('0','Auto-load: autosave')+opt('1','Auto-load: slot 1')+opt('2','Auto-load: slot 2')+opt('3','Auto-load: slot 3')+opt('4','Auto-load: slot 4')+opt('5','Auto-load: slot 5')+'</select>'+
      btn('⟳ Reload now',function(){ location.reload(); },'go')+
      btn('Skip intro now',function(){ if(window.clearCineTimers) call(window.clearCineTimers); if(window.endCinematic) call(window.endCinematic); })+
    '</div><div class="dtc-note">Skip removes the cinematic and entry animations. Auto-load applies the chosen save as soon as the game scripts are ready.</div>';
    h+='<div class="dtc-head">Kill switches</div><div class="dtc-grid">'+
      tog('Map / intro animations',   'anim',  animOn,  animOff)+
      tog('Flash messages',           'flash', flashOn, flashOff)+
      tog('Random events (tuner freq=0)','events',eventsOn,eventsOff)+
      btn('Hide guide & tour',function(){ if(window.dismissGuide) call(window.dismissGuide); const t=document.getElementById('tour-overlay'); if(t) t.classList.add('hidden'); const st=document.getElementById('ftg-strip'); if(st) st.style.display='none'; })+
      btn('Toggle action cap',function(){ window.toggleActionCap&&window.toggleActionCap(); })+
      btn('Replay tour',function(){ window.replayTour&&window.replayTour(); })+
    '</div><div class="dtc-note">■ = switch is engaged (thing is stopped). Tuner-frequency switch restores the previous value when released.</div>';
    return h;
  }

  function render(){
    if(API._tab!=='dev') return;
    const body=document.getElementById('dt-body'); if(!body) return;
    API._acts={};
    body.innerHTML=html();
  }
  function onChange(e){
    const sel=e.target.closest&&e.target.closest('#dt-body select[data-pref="autoload"]'); if(!sel) return;
    setPref(PREF_AUTOLOAD,sel.value); flash('Dev auto-load: '+(sel.value?('slot '+sel.value):'off'));
  }
  function onClick(e){
    const b=e.target.closest&&e.target.closest('#dt-body .dtc-btn[data-act]'); if(!b) return;
    const fn=API._acts[b.dataset.act]; if(fn) call(fn);
  }

  function installTab(){
    const tabs=document.getElementById('dt-tabs'); if(!tabs||tabs.querySelector('[data-tab="dev"]')) return;
    const t=document.createElement('div'); t.className='dt-tab'; t.dataset.tab='dev'; t.textContent='Dev'; t.setAttribute('onclick',"dtSetTab('dev')"); tabs.appendChild(t);
  }
  function wrapSetTab(){
    if(window.__aeDevConsoleWrapped||typeof window.dtSetTab!=='function') return;
    window.__aeDevConsoleWrapped=true;
    const native=window.dtSetTab;
    window.dtSetTab=function(t){ API._tab=t; const r=native.apply(this,arguments); render(); return r; };
  }
  function init(){ installStyles(); installTab(); wrapSetTab(); document.addEventListener('click',onClick); document.addEventListener('change',onChange); bootStartup(); let n=0; const tm=setInterval(function(){ installTab(); wrapSetTab(); if(++n>=24) clearInterval(tm); },250); }
  API.render=render; API._acts={}; API._tab=null;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
