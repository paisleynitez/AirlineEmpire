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
    const seen=new Set(), entries=[];
    ['q',0,1,2,3,4,5].forEach(n=>{const e=readSave(n); if(!e)return; const k=JSON.stringify([e.n,e.ts]); if(seen.has(k))return; seen.add(k); entries.push(e);});
    entries.sort((a,b)=>(b.ts||0)-(a.ts||0));
    const rows=entries.map(e=>{const m=metaFor(e);return `<div class="pn-save-row"><div><div class="pn-save-name">${esc(m.label)} <span style="color:#94a3b8;font-weight:500">— ${esc(m.co)}</span></div><div class="pn-save-meta">${esc(m.month)} ${esc(m.year)} · $${esc(m.cash)}M · ${esc(m.routes)} routes · ${esc(m.tsText)}</div></div><button class="pn-load" onclick="contLoad('${esc(e.n)}')">LOAD</button></div>`;}).join('');
    const ovl=document.createElement('div'); ovl.id='cont-ovl'; ovl.setAttribute('role','dialog'); ovl.setAttribute('aria-modal','true');
    ovl.innerHTML=`<div class="pn-cont-panel" onclick="event.stopPropagation()"><div class="pn-cont-head"><div><div class="pn-cont-title">CONTINUE FLIGHT</div><div class="pn-cont-sub">Quicksave · autosave · save slots</div></div><button class="pn-cont-close" title="Close" onclick="document.getElementById('cont-ovl').remove()">×</button></div><div class="pn-cont-body">${rows||'<div class="pn-empty"><b>No saved games found.</b><br><span style="font-size:11px;color:#94a3b8">Start a new airline or import a save file.</span></div>'}</div><div class="pn-cont-foot"><button class="pn-import" onclick="const f=document.getElementById('intro-import-file'); if(f) f.click();">IMPORT SAVE FILE</button><div class="pn-foot-note">PaisleyNitez · ${BUILD}</div></div></div>`;
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
  if(typeof oldStart==='function') window.startNewGame=function(){ const r=oldStart.apply(this,arguments); setTimeout(setDefaults,80); setTimeout(()=>{try{ if(typeof wzRenderPage3==='function') wzRenderPage3(); if(typeof aeRenderPreview==='function') aeRenderPreview(); }catch(e){}},180); return r; };
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const ovl=document.getElementById('cont-ovl'); if(ovl) ovl.remove(); }});
  document.addEventListener('click',e=>{ const gear=e.target.closest && e.target.closest('.home-gear'); if(!gear)return; if(document.getElementById('intro') && !document.getElementById('intro').classList.contains('hidden')){ try{e.preventDefault();e.stopPropagation();}catch(_){} if(typeof openRecords==='function') openRecords(); }}, true);
  document.addEventListener('DOMContentLoaded',()=>{ setDefaults(); if(!document.getElementById('pn-qa-mark')){const m=document.createElement('div');m.id='pn-qa-mark';m.textContent='PaisleyNitez · '+BUILD;document.body.appendChild(m);} });
  setTimeout(setDefaults,250);
})();
