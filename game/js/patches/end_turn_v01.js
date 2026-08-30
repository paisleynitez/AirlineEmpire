/* END_TURN_v01 — header END TURN button + transport cluster
   1. Reliability: a direct, capture-phase click handler on #end-turn-btn calls endTurn() and
      surfaces any failure as a flash message instead of failing silently. Re-entrancy guarded.
   2. Clock hand-off: when the month-end report closes, the report-open flag is cleared and the
      clock resumes in the mode it was running in before END TURN (the v01/v02 report layers
      otherwise left the game paused with the timer stopped).
   3. Root-cause guard: switchGuideTab() writes to #guide-body, which the current index.html no
      longer contains; endTurn() reaches it via guideStep(5) and aborted on the null write.
   4. Transport: pause/play is a quiet glyph button; speeds read as chevrons (▸ ▸▸ ▸▸▸).
   5. Look: three switchable END TURN prototypes, driven by <html data-ae-endturn="a|b|c">.
      Ctrl+click (or Cmd+click) the button to cycle; choice persists in localStorage.
      Also exposed as window.AEEndTurn.setStyle('a'|'b'|'c'). Injects css/end-turn-v01.css. */
(function endTurnV01(){
  'use strict';
  if(window.AEEndTurnV01) return;
  window.AEEndTurnV01={version:'v01'};

  const STYLES=['a','b','c'];
  const NAMES={a:'A · Executive',b:'B · Cyan Glass',c:'C · Departure Board'};
  const KEY='ae_endturn_style';
  let busy=false;
  let resumeMode=null;

  function flash(msg){ try{ if(typeof window.showFlash==='function') window.showFlash(msg); }catch(e){} }
  function state(){ try{ return (typeof STATE!=='undefined'&&STATE)?STATE:null; }catch(e){ return null; } }
  function btn(){ return document.getElementById('end-turn-btn'); }

  function installStyles(){
    if(document.getElementById('ae-end-turn-v01-style')) return;
    const link=document.createElement('link');
    link.id='ae-end-turn-v01-style';
    link.rel='stylesheet';
    link.href='./css/end-turn-v01.css';
    document.head.appendChild(link);
  }

  function getStyle(){
    let v='a';
    try{ v=localStorage.getItem(KEY)||'a'; }catch(e){}
    return STYLES.includes(v)?v:'a';
  }
  function setStyle(v,announce){
    if(!STYLES.includes(v)) v='a';
    document.documentElement.setAttribute('data-ae-endturn',v);
    try{ localStorage.setItem(KEY,v); }catch(e){}
    if(announce) flash('End Turn style: '+NAMES[v]+'  (Ctrl+click to cycle)');
    return v;
  }
  function cycleStyle(){
    const cur=getStyle();
    return setStyle(STYLES[(STYLES.indexOf(cur)+1)%STYLES.length],true);
  }

  function runEndTurn(){
    const s=state();
    if(busy) return;
    if(!s){ flash('Game state not ready'); return; }
    if(s.gameOver) return;
    if(typeof window.endTurn!=='function'){ flash('End Turn is unavailable'); return; }
    busy=true;
    const b=btn();
    if(b){ b.classList.add('et-pressed','et-busy'); }
    // remember the clock so it can be restored after the month-end report closes
    resumeMode=(s.timerMode&&s.timerMode!=='off'&&!s.paused)?s.timerMode:null;
    try{
      window.endTurn();
    }catch(err){
      console.error('[End Turn] failed',err);
      const where=(err&&err.stack?String(err.stack).split('\n')[1]||'':'').trim();
      flash('End Turn hit an error: '+(err&&err.message?err.message:'see console')+(where?'  @ '+where.replace(/^at\s+/,'').replace(/\(.*\/js\//,'(js/'):''));
    }finally{
      setTimeout(function(){
        busy=false;
        const b2=btn();
        if(b2) b2.classList.remove('et-pressed','et-busy');
      },250);
    }
  }

  function onClick(event){
    const target=event.target&&event.target.closest?event.target.closest('#end-turn-btn'):null;
    if(!target) return;
    if(target.dataset.aeEndturnV01!=='1') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(event.ctrlKey||event.metaKey){ cycleStyle(); return; }
    runEndTurn();
  }

  // Transport cluster: pause/play uses the glyph only (quiet button); speeds read as chevrons.
  // Mapping keeps every mode reachable from the Settings modal; the header shows three speeds.
  const SPEED_LABELS={'spd-relaxed':null,'spd-normal':'\u25B8','spd-fast':'\u25B8\u25B8','spd-turbo':'\u25B8\u25B8\u25B8'};
  function styleTransport(){
    Object.keys(SPEED_LABELS).forEach(function(id){
      const el=document.getElementById(id);
      if(!el||el.dataset.aeChev==='1') return;
      el.dataset.aeChev='1';
      const label=SPEED_LABELS[id];
      if(label===null){ el.classList.add('ae-chev-hidden'); return; }
      el.classList.add('ae-chev');
      el.setAttribute('aria-label',el.getAttribute('title')||el.textContent.trim());
      el.textContent=label;
    });
  }

  function claimButton(){
    const b=btn();
    if(!b||b.dataset.aeEndturnV01==='1') return;
    b.dataset.aeEndturnV01='1';
    b.removeAttribute('onclick');
    b.removeAttribute('disabled');
    b.setAttribute('type','button');
    b.setAttribute('title','End the month and advance the calendar (Ctrl+click: cycle button style)');
    if(!b.querySelector('.et-arrow')) b.innerHTML='END TURN <span class="et-arrow">\u2192</span>';
  }

  function resumeClock(){
    const s=state();
    if(!s||s.gameOver) return;
    s._operationsReportOpen=false;
    if(resumeMode&&typeof window.setSpeed==='function'){
      const mode=resumeMode; resumeMode=null;
      s.paused=false;
      try{ window.setSpeed(mode); }catch(e){}
    }else{
      s.paused=false;
      try{ if(typeof window.updatePauseUI==='function') window.updatePauseUI(); }catch(e){}
      try{ if(typeof window.updateSpeedUI==='function') window.updateSpeedUI(); }catch(e){}
    }
    try{ if(typeof window.updateHdrPlayIcon==='function') window.updateHdrPlayIcon(); }catch(e){}
  }

  function hookReports(){
    if(typeof window.switchGuideTab==='function'&&!window.switchGuideTab.__aeEndTurnV01){
      const nativeSwitch=window.switchGuideTab;
      const guarded=function(tab){
        if(document.getElementById('guide-body')) return nativeSwitch.apply(this,arguments);
        document.querySelectorAll('.guide-tab').forEach(function(t){ t.classList.toggle('active',t.dataset.tab===tab); });
      };
      guarded.__aeEndTurnV01=true;
      window.switchGuideTab=guarded;
    }
    if(window.AEReports&&typeof window.AEReports.close==='function'&&!window.AEReports.__aeEndTurnV01){
      const nativeClose=window.AEReports.close;
      window.AEReports.close=function(){ const r=nativeClose.apply(this,arguments); resumeClock(); return r; };
      window.AEReports.__aeEndTurnV01=true;
    }
    if(typeof window.operationsReportDismiss==='function'&&!window.__aeEndTurnV01Dismiss){
      const nativeDismiss=window.operationsReportDismiss;
      window.operationsReportDismiss=function(){ const r=nativeDismiss.apply(this,arguments); resumeClock(); return r; };
      window.__aeEndTurnV01Dismiss=true;
    }
  }

  function init(){
    installStyles();
    setStyle(getStyle(),false);
    document.addEventListener('click',onClick,true);
    claimButton(); styleTransport();
    hookReports();
    new MutationObserver(function(){ claimButton(); styleTransport(); }).observe(document.body,{childList:true,subtree:true});
    let attempts=0;
    const timer=setInterval(function(){
      claimButton(); styleTransport(); hookReports();
      if(++attempts>=24) clearInterval(timer);
    },250);
  }

  window.AEEndTurn={setStyle:function(v){return setStyle(v,true);},cycleStyle,getStyle,styles:STYLES.slice(),names:NAMES};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
