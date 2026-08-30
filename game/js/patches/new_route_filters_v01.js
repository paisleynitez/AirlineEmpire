/* NEW_ROUTE_FILTERS_v01 — New Route window: region / subregion pills become two dropdowns
   styled exactly like the Slot Negotiations filters (white on black, side by side).
   Wraps nrRegionRow() and nrSubregionRow() only; selection still flows through the native
   nrSetRegion() / nrSetSubregion(), so destination filtering and route logic are unchanged. */
(function newRouteFiltersV01(){
  'use strict';
  if(window.AENewRouteFiltersV01) return;
  window.AENewRouteFiltersV01={version:'v01'};

  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function cur(name){ try{ return (0,eval)(name); }catch(e){ return undefined; } }

  function installStyles(){
    if(document.getElementById('ae-new-route-filters-v01-style')) return;
    const style=document.createElement('style');
    style.id='ae-new-route-filters-v01-style';
    style.textContent=`
      .modal-new-route .nr-filter-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:0 0 9px!important;width:100%!important}
      .modal-new-route .nr-filter-row .nr-region-row,
      .modal-new-route .nr-filter-row .nr-subregion-row{display:block!important;width:auto!important;margin:0!important;min-width:0}
      .modal-new-route .nr-filter-select{width:100%;min-width:0;height:38px;padding:0 9px;border-radius:8px;border:1px solid rgba(102,159,184,.22)!important;color:#fff!important;background:#000!important;color-scheme:dark;font:600 12px Inter,Segoe UI,Arial,sans-serif!important;outline:none;cursor:pointer;box-shadow:none!important}
      .modal-new-route .nr-filter-select option,.modal-new-route .nr-filter-select optgroup{color:#fff;background:#000}
      .modal-new-route .nr-filter-select:disabled{color:#9aa7ae!important;background:#000!important;opacity:.72;cursor:default}
      .modal-new-route .nr-origin-row{display:flex!important;align-items:baseline!important;justify-content:space-between!important;gap:8px}
      .modal-new-route .nr-origin-row #nr-destination-count{margin:0!important;padding:0!important;border:0!important;background:none!important;color:#c2b3d8!important;font:600 11px 'DM Mono',monospace!important;letter-spacing:.3px!important;text-transform:none!important}
      .modal-new-route .nr-filter-select:focus-visible{border-color:rgba(78,190,237,.6)!important}
      /* City peek: compact profile on double-click, floats over New Route without closing it */
      #ae-city-peek{position:fixed;z-index:12050;width:300px;max-width:calc(100vw - 24px);border:1px solid rgba(108,199,216,.42);border-radius:10px;background:linear-gradient(180deg,rgba(12,26,38,.98),rgba(6,16,25,.99));box-shadow:0 18px 48px rgba(0,0,0,.6),0 0 0 1px rgba(108,199,216,.08);color:#fff;font-family:Inter,system-ui,sans-serif}
      #ae-city-peek[hidden]{display:none}
      #ae-city-peek .cp-hero{position:relative;height:58px;border-radius:10px 10px 0 0;background-size:cover;background-position:center;overflow:hidden}
      #ae-city-peek .cp-hero:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,16,25,.15),rgba(6,16,25,.94))}
      #ae-city-peek .cp-head{position:absolute;left:12px;right:44px;bottom:7px;z-index:1;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
      #ae-city-peek .cp-name{font-size:15px;font-weight:800;line-height:1}
      #ae-city-peek .cp-badge{padding:2px 6px;border:1px solid rgba(108,199,216,.5);border-radius:5px;background:rgba(108,199,216,.12);font-size:8.5px;font-weight:800;letter-spacing:.08em}
      #ae-city-peek .cp-sub{width:100%;font-size:10.5px;color:#cbd7e0;font-family:'DM Mono',monospace}
      #ae-city-peek .cp-x{position:absolute;top:6px;right:6px;z-index:2;width:28px!important;height:28px!important;min-width:28px!important;font-size:15px!important;border-radius:8px!important}
      #ae-city-peek .cp-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;padding:8px 12px 10px}
      #ae-city-peek .cp-col-title{font-size:9px;font-weight:800;letter-spacing:.14em;color:#a9c4d4;margin:0 0 3px}
      #ae-city-peek .cp-row{display:flex;justify-content:space-between;align-items:baseline;gap:6px;padding:4px 0;border-top:1px solid rgba(123,173,195,.12);font-size:11px;color:#c9d6df}
      #ae-city-peek .cp-row b{color:#fff;font-family:'DM Mono',monospace;font-size:11.5px}
      #ae-city-peek .cp-bar{height:2px;border-radius:2px;background:rgba(123,173,195,.18);overflow:hidden;margin:-1px 0 2px}
      #ae-city-peek .cp-bar i{display:block;height:100%;background:linear-gradient(90deg,#6cc7d8,#e4bd70)}
      #ae-city-peek .cp-foot{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:6px 12px 10px;border-top:1px solid rgba(123,173,195,.14)}
      #ae-city-peek .cp-open{padding:6px 10px;border:1px solid rgba(108,199,216,.5);border-radius:7px;background:rgba(108,199,216,.1);color:#fff;font:700 10px Inter,system-ui,sans-serif;letter-spacing:.06em;cursor:pointer}
      #ae-city-peek .cp-open:hover{background:rgba(108,199,216,.2)}
    `;
    document.head.appendChild(style);
  }

  function regionSelect(){
    const regions=cur('REGIONS')||[];
    const active=cur('_nrRegion');
    return '<select class="nr-filter-select" aria-label="Region" onchange="nrSetRegion(this.value)">'+
      regions.map(function(r){ return '<option value="'+esc(r)+'"'+(r===active?' selected':'')+'>'+esc(r)+'</option>'; }).join('')+
      '</select>';
  }

  function subregionSelect(fromOverride){
    const SUB=cur('SUBREGIONS')||{}; const CITIES=cur('CITIES')||{};
    const region=cur('_nrRegion'); const active=cur('_nrSubregion');
    const subs=SUB[region]||[];
    const from=fromOverride!==undefined?fromOverride:((typeof window.val==='function'&&window.val('r-from'))||'');
    const keyOf=typeof window.nrSubregionKey==='function'?window.nrSubregionKey:function(){return null;};
    const visible=subs.filter(function(s){
      return Object.entries(CITIES).some(function(e){ const c=e[0],ci=e[1]; return ci.region===region&&c!==from&&keyOf(ci,c)===s.key; });
    });
    const enabled=visible.length>1;
    return '<select class="nr-filter-select" aria-label="Subregion"'+(enabled?'':' disabled')+
      ' onchange="nrSetSubregion(this.value===\'\'?null:this.value)">'+
      '<option value=""'+(active==null?' selected':'')+'>All Subregions</option>'+
      visible.map(function(s){ return '<option value="'+esc(s.key)+'"'+(s.key===active?' selected':'')+'>'+esc(s.label)+'</option>'; }).join('')+
      '</select>';
  }

  function wrap(){
    if(window.__aeNewRouteFiltersV01Wrapped) return;
    if(typeof window.nrRegionRow!=='function'||typeof window.nrSubregionRow!=='function') return;
    window.__aeNewRouteFiltersV01Wrapped=true;
    window.nrRegionRow=function(){ return regionSelect(); };
    window.nrSubregionRow=function(fromOverride){ return subregionSelect(fromOverride); };
  }

  function groupRows(){
    const heading=document.querySelector('.modal-new-route .nr-destination-pane .nr-pane-heading strong');
    if(heading&&heading.textContent.trim()==='Where do you want to fly?') heading.textContent='Create a route';
    // City count moves from the title row down to the DEPARTING FROM line
    const count=document.getElementById('nr-destination-count');
    const origin=document.querySelector('.modal-new-route .nr-origin-label');
    if(count&&origin&&count.parentElement!==origin){ origin.classList.add('nr-origin-row'); origin.appendChild(count); }
    const region=document.getElementById('nr-region-row');
    const sub=document.getElementById('nr-subregion-row');
    if(!region||!sub||region.parentElement!==sub.parentElement) return;
    if(region.parentElement.classList.contains('nr-filter-row')) return;
    const row=document.createElement('div');
    row.className='nr-filter-row';
    region.parentElement.insertBefore(row,region);
    row.appendChild(region);
    row.appendChild(sub);
  }

  // ── City peek: double-click a destination card for a compact profile (the city modal's Overview,
  //    condensed) without leaving the New Route window. "Full profile" hands off to openCityModal().
  function cityByAbbr(abbr){ const C=cur('CITIES')||{}; return Object.keys(C).find(function(n){ return (C[n].abbr||'')===abbr; }); }
  function cardCity(card){
    const name=card.querySelector('.nr-city-top strong'); const code=card.querySelector('.nr-city-top > b');
    const C=cur('CITIES')||{};
    const byName=name&&C[name.textContent.trim()]?name.textContent.trim():null;
    return byName||(code?cityByAbbr(code.textContent.trim()):null);
  }
  function skyline(name){
    try{ const m=window.AECitySkylineManifest&&window.AECitySkylineManifest.get(name); return m&&m.src?m.src:''; }catch(e){ return ''; }
  }
  function peekHtml(name){
    const C=cur('CITIES')||{}; const c=C[name]; if(!c) return '';
    const S=cur('STATE')||{};
    const hubs=S.hubs||[]; const isHome=(hubs[0]||S.homeBase)===name; const isHub=hubs.includes(name);
    const routes=(S.routes||[]).filter(function(r){ return r.from===name||r.to===name; }).length;
    const status=isHome?'Home Hub':isHub?'Hub':routes?'Served':'Unserved';
    const badge=isHome?'HOME HUB':isHub?'HUB':routes?'SERVED':'';
    const stars='\u2605'.repeat(Math.min(c.level||3,6))+'\u2606'.repeat(Math.max(0,6-(c.level||3)));
    const fill=Math.round(c.fulfill||0);
    const bar=function(v){ return '<div class="cp-bar"><i style="width:'+Math.max(0,Math.min(100,v))+'%"></i></div>'; };
    const row=function(k,v){ return '<div class="cp-row"><span>'+k+'</span><b>'+v+'</b></div>'; };
    const img=skyline(name);
    return '<div class="cp-hero"'+(img?' style="background-image:url(\''+esc(img)+'\')"':'')+'>'+
        '<div class="cp-head"><span class="cp-name">'+esc(name)+'</span>'+(badge?'<span class="cp-badge">'+badge+'</span>':'')+
        '<span class="cp-sub">'+esc(c.abbr||'')+' \u00b7 '+esc(c.region||'')+' \u00b7 '+esc(c.pop||0)+'M pop</span></div>'+
        '<button type="button" class="modal-close cp-x" data-peek="close" aria-label="Close">\u00d7</button></div>'+
      '<div class="cp-grid"><div><div class="cp-col-title">AIRPORT</div>'+
        row('IATA',esc(c.abbr||'\u2014'))+row('Level',stars)+row('Gate Slots',esc(c.slots||0))+row('Status',status)+
      '</div><div><div class="cp-col-title">MARKET</div>'+
        row('Population',esc(c.pop||0)+'M')+row('Economy',esc(Math.round(c.econ||0)))+bar(c.econ||0)+
        row('Tourism',esc(Math.round(c.tourism||0)))+bar(c.tourism||0)+row('Service Fill',fill+'%')+bar(fill)+
      '</div></div>'+
      '<div class="cp-foot"><button type="button" class="cp-open" data-peek="open">FULL PROFILE \u2192</button></div>';
  }
  function peekEl(){
    let el=document.getElementById('ae-city-peek');
    if(!el){ el=document.createElement('div'); el.id='ae-city-peek'; el.hidden=true; el.setAttribute('role','dialog'); document.body.appendChild(el); }
    return el;
  }
  function showPeek(name,anchor){
    const el=peekEl(); const html=peekHtml(name); if(!html) return;
    el.dataset.city=name; el.innerHTML=html; el.hidden=false;
    const r=anchor.getBoundingClientRect(); const w=el.offsetWidth||300, h=el.offsetHeight||240;
    let x=r.right+10, y=r.top;
    if(x+w>innerWidth-12) x=r.left-w-10;
    if(x<12) x=Math.max(12,Math.min(innerWidth-w-12,r.left));
    if(y+h>innerHeight-12) y=innerHeight-h-12;
    if(y<12) y=12;
    el.style.left=x+'px'; el.style.top=y+'px';
  }
  function hidePeek(){ const el=document.getElementById('ae-city-peek'); if(el) el.hidden=true; }
  function onDblClick(e){
    const card=e.target.closest&&e.target.closest('.modal-new-route .nr-city-card'); if(!card) return;
    const name=cardCity(card); if(!name) return;
    e.preventDefault(); showPeek(name,card);
  }
  function onPeekClick(e){
    const el=document.getElementById('ae-city-peek');
    if(!el||el.hidden) return;
    const inside=el.contains(e.target);
    const act=inside&&e.target.closest('[data-peek]');
    if(act&&act.dataset.peek==='close'){ hidePeek(); return; }
    if(act&&act.dataset.peek==='open'){ const n=el.dataset.city; hidePeek(); if(typeof window.closeModal==='function') window.closeModal(); if(typeof window.openCityModal==='function') window.openCityModal(n); return; }
    if(!inside) hidePeek();
  }
  function onKey(e){ if(e.key==='Escape') hidePeek(); }

  function init(){
    installStyles();
    wrap();
    groupRows();
    document.addEventListener('dblclick',onDblClick);
    document.addEventListener('click',onPeekClick,true);
    document.addEventListener('keydown',onKey);
    new MutationObserver(function(){ groupRows(); const ov=document.getElementById('modal-overlay'); if(ov&&!ov.classList.contains('open')) hidePeek(); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    let attempts=0;
    const timer=setInterval(function(){ wrap(); if(window.__aeNewRouteFiltersV01Wrapped||++attempts>=24) clearInterval(timer); },250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
