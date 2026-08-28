(function(){
  const BUILD='BASELINE_PATCH_v06';
  window.PAISLEYNITEZ_BUILD = BUILD;
  function esc(s){return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function fmtTime(ts){try{return new Date(ts||Date.now()).toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});}catch(e){return 'recent';}}
  function saveKey(n){try{return typeof SAVE_KEY==='function'?SAVE_KEY(n):('airlineEmpireSave_'+n);}catch(e){return 'airlineEmpireSave_'+n;}}
  function readSave(n){try{const raw=localStorage.getItem(saveKey(n));if(!raw)return null;const o=JSON.parse(raw);return {raw:o,n:n,ts:o.ts||o.time||o.updatedAt||0};}catch(e){return null;}}
  function metaFor(entry){
    const n=entry.n,o=entry.raw||{};
    let m=null; try{m=(typeof slotMeta==='function'?slotMeta(n):null)||null;}catch(e){}
    const state=o.state||o.STATE||o.game||o;
    const label=n==='q'?'QUICKSAVE':(n===0?'AUTOSAVE':'SLOT '+n);
    const co=(m&&m.co)||state.company||state.name||state.airline||state.airlineName||'Airline Empire';
    const cash=(m&&m.cash)!=null?m.cash:Math.round(((state.cash||0)/1000000)||state.cash||0);
    const routes=(m&&m.routes)!=null?m.routes:((state.routes&&state.routes.length)||0);
    const month=(m&&m.month)||state.month||'Month';
    const year=(m&&m.year)||state.year||'';
    return {label,co,cash,routes,month,year,tsText:fmtTime(entry.ts),ts:entry.ts};
  }
  window.openContinueMenu=function(){
    const old=document.getElementById('cont-ovl'); if(old) old.remove();
    const slots=[0,1,2,3,4,5];
    const rows=slots.map(n=>{
      const e=readSave(n);
      const label=n===0?'AUTOSAVE':'MANUAL SAVE '+n;
      if(!e){
        return `<div class="pn-save-row empty"><div class="pn-row-main"><div class="pn-slot-k">${label}</div><div class="pn-empty-title">EMPTY SLOT</div></div><div class="pn-empty-copy">No saved flight</div></div>`;
      }
      const m=metaFor(e);
      return `<div class="pn-save-row"><div class="pn-row-main"><div class="pn-slot-k">${label}</div><div class="pn-save-name">${esc(m.co)}</div><div class="pn-save-meta">${esc(m.month)} ${esc(m.year)} · $${esc(m.cash)}M · ${esc(m.routes)} routes · ${esc(m.tsText)}</div></div><button class="pn-load" onclick="contLoad('${esc(e.n)}')">LOAD</button></div>`;
    }).join('');
    const ovl=document.createElement('div'); ovl.id='cont-ovl'; ovl.setAttribute('role','dialog'); ovl.setAttribute('aria-modal','true');
    ovl.innerHTML=`<div class="pn-cont-panel" onclick="event.stopPropagation()"><div class="pn-cont-head"><div><div class="pn-cont-title">CONTINUE FLIGHT</div><div class="pn-cont-sub">Choose an autosave or manual save</div></div><button class="pn-cont-close" title="Close" onclick="document.getElementById('cont-ovl').remove()">×</button></div><div class="pn-cont-body"><div class="pn-save-list">${rows}</div></div><div class="pn-cont-foot"><button class="pn-import" onclick="const f=document.getElementById('intro-import-file'); if(f) f.click();">IMPORT SAVE FILE</button><div class="pn-foot-note">PaisleyNitez · ${BUILD}</div></div></div>`;
    ovl.onclick=()=>ovl.remove(); document.body.appendChild(ovl);
  };
  window.contLoad=function(n){
    try{ if(n!=='q') n=Number(n); if(typeof loadFromSlot==='function') loadFromSlot(n); }
    finally{ const ovl=document.getElementById('cont-ovl'); if(ovl) ovl.remove(); }
  };
  function setDefaults(){
    try{
      if(window.setupChoice){ setupChoice.name='PaisleyAire'; setupChoice.logo='⚥'; setupChoice.identity='PSLYFRK'; }
      if(typeof _selectedLogo!=='undefined') window._selectedLogo='⚥';
      if(typeof _selectedLivery!=='undefined') window._selectedLivery='#8b6fe0';
      if(typeof _selectedLivery2!=='undefined') window._selectedLivery2='#e05c9e';
      if(typeof _selectedLiveryA!=='undefined') window._selectedLiveryA='#ffcf5a';
const name=document.getElementById('nh-name-input');
if(name && (!name.value || name.value==='SKYLINE')){
  name.value='PaisleyAire';
  if (typeof window.aeNameCheck === 'function') {
    name.dispatchEvent(new Event('input',{bubbles:true}));
  }
}    
}catch(e){}
  }
  const oldStart=window.startNewGame;
  if(typeof oldStart==='function') window.startNewGame=function(){ const r=oldStart.apply(this,arguments); setTimeout(setDefaults,80); setTimeout(()=>{try{ if(typeof wzRenderPage3==='function') wzRenderPage3(); }catch(e){}},180); return r; };
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const ovl=document.getElementById('cont-ovl'); if(ovl) ovl.remove(); }});
  document.addEventListener('click',e=>{ const gear=e.target.closest && e.target.closest('.home-gear'); if(!gear)return; if(document.getElementById('intro') && !document.getElementById('intro').classList.contains('hidden')){ try{e.preventDefault();e.stopPropagation();}catch(_){} if(typeof openRecords==='function') openRecords(); }}, true);
  function setVersionMark(){
    var m=document.getElementById('pn-qa-mark');
    if(!m){ m=document.createElement('div'); m.id='pn-qa-mark'; document.body.appendChild(m); }
    var FALLBACK='1.1.11'; // keep in sync with /version.dat when bumping (file:// launches can't fetch it)
    m.textContent=FALLBACK;
    try{
      if(location.protocol!=='http:'&&location.protocol!=='https:') return;
      fetch('../version.dat').then(function(r){ if(!r.ok) throw 0; return r.text(); })
        .then(function(t){ var v=String(t||'').trim(); if(v){ window.AE_VERSION=v; m.textContent=v; } })
        .catch(function(){});
    }catch(e){}
  }
  window.AE_SET_VERSION_MARK=setVersionMark;
  document.addEventListener('DOMContentLoaded',()=>{ setDefaults(); setVersionMark(); });
  setTimeout(setDefaults,250);
})();
