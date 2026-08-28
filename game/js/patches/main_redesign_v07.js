(function(){
  const tag='MAIN_REDESIGN_v08_SLOT_DIRECT';
  let selectedCity='Denver', pinned=false, region='ALL', sort='revenue', confirmCity=null;
  let nativeOpenModal=null;

  function addSlotStyles(){
    if(document.getElementById('ae-slot-negotiations-css')) return;
    const link=document.createElement('link');
    link.id='ae-slot-negotiations-css';
    link.rel='stylesheet';
    link.href='./css/slot-negotiations-v112.css';
    document.head.appendChild(link);
  }

  function availableCities(){
    if(typeof CITIES==='undefined' || typeof STATE==='undefined') return [];
    return Object.entries(CITIES)
      .filter(([name])=>!(STATE.hubs||[]).includes(name))
      .map(([name,ci])=>{
        const cost=Math.round((ci.econ+ci.tourism)*0.25+4);
        const revenue=Math.round((ci.econ+ci.tourism)*0.25+ci.pop*0.5);
        const load=Math.round((ci.econ+ci.tourism)/40);
        const active=(STATE.negotiating||{})[name]||0;
        const frozen=!!(STATE.slotFreeze&&STATE.slotFreeze[name]);
        const routes=(STATE.routes||[]).filter(r=>r.from===name||r.to===name).length;
        return {name,code:ci.abbr||name.slice(0,3).toUpperCase(),region:ci.region||'Other',slots:ci.slots||0,
          econ:ci.econ||0,tourism:ci.tourism||0,pop:ci.pop||0,cost,revenue,load,active,frozen,routes};
      });
  }

  function filteredCities(){
    let rows=availableCities();
    if(region!=='ALL') rows=rows.filter(a=>a.region===region);
    rows.sort((a,b)=>sort==='slots'?b.slots-a.slots:sort==='name'?a.name.localeCompare(b.name):b.revenue-a.revenue);
    return rows;
  }

  function cityArtwork(a){
    if(typeof aeCityThumbSVG==='function'){
      try{return aeCityThumbSVG(a.name,a.region);}catch(e){}
    }
    return '';
  }

  function card(a){
    const state=a.frozen?'FROZEN':a.active?`${a.active} MO. LEFT`:a.routes?`${a.routes} ROUTE${a.routes!==1?'S':''}`:'AVAILABLE';
    return `<div class="ae-sn-card${a.name===selectedCity?' active':''}" data-city="${a.name.replace(/"/g,'&quot;')}" role="button" tabindex="0">
      <div class="ae-sn-thumb" style="overflow:hidden">${cityArtwork(a)}</div>
      <div class="ae-sn-cardmain">
        <div class="ae-sn-name">${a.name.toUpperCase()}</div>
        <div class="ae-sn-meta"><span class="ae-sn-region">${a.region}</span> &nbsp;•&nbsp; ${a.slots} Slots</div>
        <div class="ae-sn-tags"><span class="ae-sn-chip green">↗ +${a.load}% LOAD</span><span class="ae-sn-chip ae-sn-good">$${a.revenue}M /wk</span><span class="ae-sn-chip">${state}</span></div>
      </div><div class="ae-sn-chevron">›</div></div>`;
  }

  function detailData(){
    const rows=availableCities();
    let a=rows.find(x=>x.name===selectedCity);
    if(!a){ a=rows[0]; if(a) selectedCity=a.name; }
    return a;
  }

  function details(){
    const a=detailData(), host=document.querySelector('#ae-slot-negotiations .ae-sn-right');
    if(!a||!host) return;
    const competition=a.econ+a.tourism>=165?'High':a.econ+a.tourism>=125?'Moderate':'Low';
    const success=Math.max(55,Math.min(92,95-Math.round((a.econ+a.tourism)/8)));
    let action='';
    if(a.frozen) action=`<button class="ae-sn-start" disabled style="opacity:.45">🚫 &nbsp; SLOTS FROZEN</button>`;
    else if(a.active) action=`<button class="ae-sn-start" disabled style="opacity:.65">⏳ &nbsp; NEGOTIATION IN PROGRESS — ${a.active} MONTH${a.active!==1?'S':''}</button>`;
    else if(confirmCity===a.name) action=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button class="ae-sn-start ae-sn-confirm" style="margin-top:0">✓ CONFIRM — $${a.cost}M</button><button class="ae-sn-close ae-sn-cancel" style="height:62px">CANCEL</button></div>`;
    else if(typeof STATE!=='undefined' && STATE.cash<a.cost) action=`<button class="ae-sn-start" disabled style="opacity:.45">NEED $${Math.ceil(a.cost-STATE.cash)}M MORE</button>`;
    else action=`<button class="ae-sn-start" type="button">🤝 &nbsp; START NEGOTIATION — $${a.cost}M</button>`;

    host.innerHTML=`
      <div class="ae-sn-hero" style="overflow:hidden"><div style="position:absolute;inset:0;opacity:.7">${cityArtwork(a)}</div><div class="ae-sn-hero-copy"><h2>${a.name.toUpperCase()}</h2><p class="region">● &nbsp;${a.region}</p><p class="hub">⌖ &nbsp;${a.code} AIRPORT</p></div></div>
      <div class="ae-sn-stats"><div class="ae-sn-stat"><strong>${a.slots}</strong><small>AVAILABLE SLOTS</small></div><div class="ae-sn-stat good"><strong>+${a.load}%</strong><small>LOAD FACTOR</small></div><div class="ae-sn-stat"><strong>$${a.revenue}M</strong><small>EST. REVENUE / WK</small></div></div>
      <div class="ae-sn-panel"><div class="ae-sn-panel-title">NEGOTIATION DETAILS</div><div class="ae-sn-row"><span>▦ &nbsp; Time to Secure</span><b class="purple">1–3 months</b></div><div class="ae-sn-row"><span>ⓢ &nbsp; Cost to Secure</span><b class="gold">$${a.cost}M</b></div><div class="ae-sn-row"><span>♟ &nbsp; Competition</span><b class="gold">${competition}</b></div><div class="ae-sn-row"><span>◎ &nbsp; Success Outlook</span><b class="ae-sn-good">${success}%</b></div></div>
      <div class="ae-sn-panel"><div class="ae-sn-insight"><strong>💡 &nbsp; AIRPORT INSIGHT</strong>${a.name} combines economy ${Math.round(a.econ)}, tourism ${Math.round(a.tourism)}, and ${a.pop}M population. ${a.routes?`You currently operate ${a.routes} route${a.routes!==1?'s':''} here.`:'You do not currently operate a route here.'}</div></div>
      ${action}`;
    const start=host.querySelector('.ae-sn-start:not([disabled])');
    if(start) start.addEventListener('click',()=>{confirmCity=a.name;details();});
    const confirm=host.querySelector('.ae-sn-confirm');
    if(confirm) confirm.addEventListener('click',()=>{
      confirmCity=null;
      if(typeof negotiate==='function') negotiate(a.name,a.cost);
      renderList(); details(); updateFooter();
    });
    const cancel=host.querySelector('.ae-sn-cancel');
    if(cancel) cancel.addEventListener('click',()=>{confirmCity=null;details();});
  }

  function renderList(){
    const host=document.querySelector('#ae-slot-negotiations .ae-sn-list'); if(!host) return;
    const rows=filteredCities();
    host.innerHTML=rows.map(card).join('');
    host.querySelectorAll('.ae-sn-card').forEach(el=>{
      const choose=()=>{selectedCity=el.dataset.city;confirmCity=null;renderList();details();};
      el.addEventListener('click',choose);
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
    });
    updateFooter(rows.length);
  }

  function updateFooter(count){
    const el=document.querySelector('#ae-slot-negotiations .ae-sn-count');
    if(el) el.textContent=`Showing ${count==null?filteredCities().length:count} of ${availableCities().length} airports`;
  }

  function closeSlotWindow(){const root=document.getElementById('ae-slot-negotiations');if(root)root.hidden=true;}

  function makeDraggable(win,handle){
    let drag=null;
    handle.addEventListener('pointerdown',e=>{
      if(e.target.closest('button'))return;
      const r=win.getBoundingClientRect();
      drag={x:e.clientX-r.left,y:e.clientY-r.top};
      win.style.position='fixed';win.style.margin='0';win.style.width=r.width+'px';win.style.height=r.height+'px';
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove',e=>{
      if(!drag)return;
      const x=Math.max(8,Math.min(innerWidth-win.offsetWidth-8,e.clientX-drag.x));
      const y=Math.max(8,Math.min(innerHeight-win.offsetHeight-8,e.clientY-drag.y));
      win.style.left=x+'px';win.style.top=y+'px';
    });
    const stop=()=>drag=null;handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);
  }

  function buildWindow(){
    let root=document.getElementById('ae-slot-negotiations');
    if(root) return root;
    root=document.createElement('div');root.id='ae-slot-negotiations';
    const regs=[...new Set(availableCities().map(a=>a.region))].sort();
    root.innerHTML=`<section class="ae-sn-window" role="dialog" aria-modal="true" aria-label="Slot Negotiations">
      <header class="ae-sn-head"><div class="ae-sn-title"><span>🤝</span>SLOT NEGOTIATIONS</div><div class="ae-sn-grip" aria-hidden="true"></div><div class="ae-sn-head-actions"><button class="ae-sn-iconbtn ae-sn-pin" title="Pin">📌</button><button class="ae-sn-iconbtn ae-sn-min" title="Minimize">−</button><button class="ae-sn-iconbtn ae-sn-x" title="Close">×</button></div></header>
      <div class="ae-sn-body"><aside class="ae-sn-left"><div class="ae-sn-filters"><select id="ae-slot-region" class="ae-sn-select" aria-label="Region"><option value="ALL">🌐 All Regions</option>${regs.map(r=>`<option value="${r}">${r}</option>`).join('')}</select><select id="ae-slot-sort" class="ae-sn-select" aria-label="Sort"><option value="revenue">⚖ Sort: Revenue</option><option value="slots">Sort: Slots</option><option value="name">Sort: Name</option></select></div><div class="ae-sn-list"></div></aside><main class="ae-sn-right"></main></div>
      <footer class="ae-sn-foot"><span class="ae-sn-count"></span><button class="ae-sn-close" type="button">Close</button></footer></section>`;
    document.body.appendChild(root);
    root.querySelector('.ae-sn-x').addEventListener('click',closeSlotWindow);
    root.querySelector('.ae-sn-close').addEventListener('click',closeSlotWindow);
    root.querySelector('.ae-sn-min').addEventListener('click',()=>root.querySelector('.ae-sn-window').classList.toggle('minimized'));
    root.querySelector('.ae-sn-pin').addEventListener('click',e=>{pinned=!pinned;e.currentTarget.style.color=pinned?'#59d9ff':'';});
    root.querySelector('#ae-slot-region').addEventListener('change',e=>{region=e.target.value;confirmCity=null;renderList();details();});
    root.querySelector('#ae-slot-sort').addEventListener('change',e=>{sort=e.target.value;renderList();});
    root.addEventListener('mousedown',e=>{if(e.target===root&&!pinned)closeSlotWindow();});
    makeDraggable(root.querySelector('.ae-sn-window'),root.querySelector('.ae-sn-head'));
    return root;
  }

  function openSlotWindow(){
    addSlotStyles();
    if(typeof document==='undefined') return;
    const old=document.getElementById('modal-overlay');
    if(old) old.classList.remove('open');
    const rows=availableCities();
    if(!rows.length){ if(nativeOpenModal) nativeOpenModal('negotiations'); return; }
    if(!rows.some(a=>a.name===selectedCity)) selectedCity=rows[0].name;
    const root=buildWindow();
    root.hidden=false;
    const win=root.querySelector('.ae-sn-window');
    win.classList.remove('minimized');
    renderList();details();
  }

  function installNegotiationsHook(){
    if(window.__aeSlotNegotiationsHooked) return;
    if(typeof window.openModal!=='function') return;
    nativeOpenModal=window.openModal;
    window.openModal=function(type,arg){
      if(type==='negotiations') return openSlotWindow();
      return nativeOpenModal.apply(this,arguments);
    };
    window.__aeSlotNegotiationsHooked=true;
    window.openSlotNegotiationsUI=openSlotWindow;
  }

  function polishMainRedesign(){
    try{
      document.documentElement.setAttribute('data-ae-build',tag);
      const oc=document.querySelector('#ops-center .oc-sub'); if(oc) oc.textContent='Clean command feed · alerts, rivals, fleet, routes';
      const left=document.getElementById('left-panel'); if(left) left.setAttribute('title','Command rail');
      const right=document.getElementById('right-panel'); if(right) right.setAttribute('title','Ops feed');
      const ticker=document.getElementById('stock-ticker'); if(ticker) ticker.classList.remove('visible');
      addSlotStyles();
      installNegotiationsHook();
    }catch(e){console.error('[AE] slot negotiations hook failed',e);}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polishMainRedesign); else polishMainRedesign();
})();