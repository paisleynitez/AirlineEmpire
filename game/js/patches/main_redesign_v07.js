(function(){
  const tag='MAIN_REDESIGN_v07';
  const airports=[
    {code:'DEN',name:'DENVER',region:'North America',slots:85,load:3,revenue:33,time:'1–3 months',cost:'$12M – $18M',competition:'Moderate',chance:'78%',hub:'Major Hub Airport',thumb:'den',insight:'Denver is a high-demand hub with strong business and leisure traffic. Securing slots here will boost your network presence in the Rocky Mountain region.'},
    {code:'COS',name:'COLORADO SPRINGS',region:'North America',slots:60,load:3,revenue:31,time:'1–3 months',cost:'$9M – $14M',competition:'Moderate',chance:'81%',hub:'Regional Airport',thumb:'cos',insight:'Colorado Springs offers a balanced regional market with growing business and leisure demand.'},
    {code:'PHX',name:'PHOENIX',region:'North America',slots:90,load:2,revenue:29,time:'1–3 months',cost:'$11M – $17M',competition:'Moderate',chance:'80%',hub:'Major Hub Airport',thumb:'phx',insight:'Phoenix combines strong year-round leisure demand with a large and fast-growing metropolitan market.'},
    {code:'DFW',name:'DALLAS / FORT WORTH',region:'North America',slots:120,load:4,revenue:41,time:'2–4 months',cost:'$18M – $28M',competition:'High',chance:'67%',hub:'Major Hub Airport',thumb:'dfw',insight:'Dallas/Fort Worth is a premium connecting market with exceptional revenue potential and intense competition.'},
    {code:'SLC',name:'SALT LAKE CITY',region:'North America',slots:55,load:2,revenue:27,time:'1–3 months',cost:'$8M – $13M',competition:'Moderate',chance:'83%',hub:'Regional Hub Airport',thumb:'slc',insight:'Salt Lake City provides strong mountain-west connectivity and efficient access to western markets.'},
    {code:'LAS',name:'LAS VEGAS',region:'North America',slots:70,load:3,revenue:34,time:'1–3 months',cost:'$13M – $19M',competition:'High',chance:'73%',hub:'Leisure Hub Airport',thumb:'las',insight:'Las Vegas delivers consistently high leisure demand and strong ancillary revenue opportunities.'}
  ];
  let selected=airports[0], pinned=false;

  function addSlotStyles(){
    if(document.getElementById('ae-slot-negotiations-css')) return;
    const link=document.createElement('link');
    link.id='ae-slot-negotiations-css';
    link.rel='stylesheet';
    link.href='./css/slot-negotiations-v112.css';
    document.head.appendChild(link);
  }

  function card(a){
    return `<div class="ae-sn-card${a.code===selected.code?' active':''}" data-code="${a.code}" role="button" tabindex="0">
      <div class="ae-sn-thumb ${a.thumb}"></div>
      <div class="ae-sn-cardmain"><div class="ae-sn-name">${a.name}</div><div class="ae-sn-meta"><span class="ae-sn-region">${a.region}</span> &nbsp;•&nbsp; ${a.slots} Slots</div><div class="ae-sn-tags"><span class="ae-sn-chip green">↗ +${a.load}% LOAD</span><span class="ae-sn-chip ae-sn-good">$${a.revenue}M /wk</span><span class="ae-sn-chip">▦ ${a.time.replace(' months',' mo.').replace(' month',' mo.')}</span></div></div>
      <div class="ae-sn-chevron">›</div>
    </div>`;
  }

  function details(a){
    const host=document.querySelector('#ae-slot-negotiations .ae-sn-right');
    if(!host) return;
    host.innerHTML=`
      <div class="ae-sn-hero"><div class="ae-sn-hero-copy"><h2>${a.name}</h2><p class="region">● &nbsp;${a.region}</p><p class="hub">⌖ &nbsp;${a.hub}</p></div></div>
      <div class="ae-sn-stats"><div class="ae-sn-stat"><strong>${a.slots}</strong><small>AVAILABLE SLOTS</small></div><div class="ae-sn-stat good"><strong>+${a.load}%</strong><small>LOAD FACTOR</small></div><div class="ae-sn-stat"><strong>$${a.revenue}M</strong><small>EST. REVENUE / WK</small></div></div>
      <div class="ae-sn-panel"><div class="ae-sn-panel-title">NEGOTIATION DETAILS</div><div class="ae-sn-row"><span>▦ &nbsp; Time to Secure</span><b class="purple">${a.time}</b></div><div class="ae-sn-row"><span>ⓢ &nbsp; Cost to Secure</span><b class="gold">${a.cost}</b></div><div class="ae-sn-row"><span>♟ &nbsp; Competition</span><b class="gold">${a.competition}</b></div><div class="ae-sn-row"><span>◎ &nbsp; Success Chance</span><b class="ae-sn-good">${a.chance}</b></div></div>
      <div class="ae-sn-panel"><div class="ae-sn-insight"><strong>💡 &nbsp; AIRPORT INSIGHT</strong>${a.insight}</div></div>
      <button class="ae-sn-start" type="button">🤝 &nbsp; START NEGOTIATION</button>`;
    host.querySelector('.ae-sn-start').addEventListener('click',startNegotiation);
  }

  function renderList(){
    const host=document.querySelector('#ae-slot-negotiations .ae-sn-list'); if(!host) return;
    const sort=document.querySelector('#ae-slot-sort')?.value || 'revenue';
    const rows=airports.slice().sort((a,b)=>sort==='slots'?b.slots-a.slots:sort==='name'?a.name.localeCompare(b.name):b.revenue-a.revenue);
    host.innerHTML=rows.map(card).join('');
    host.querySelectorAll('.ae-sn-card').forEach(el=>{
      const choose=()=>{ selected=airports.find(a=>a.code===el.dataset.code)||selected; renderList(); details(selected); };
      el.addEventListener('click',choose); el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
    });
  }

  function startNegotiation(){
    const candidates=['openSlotNegotiation','startSlotNegotiation','negotiateSlots','openAirportSlots','startNegotiation'];
    for(const name of candidates){ if(typeof window[name]==='function' && window[name]!==startNegotiation){ try{ window[name](selected.code,selected); closeSlotWindow(); return; }catch(e){} } }
    window.dispatchEvent(new CustomEvent('ae:slot-negotiation-request',{detail:{airport:selected.code,data:selected}}));
    closeSlotWindow();
  }

  function closeSlotWindow(){ const root=document.getElementById('ae-slot-negotiations'); if(root) root.hidden=true; }
  function openSlotWindow(){
    addSlotStyles();
    let root=document.getElementById('ae-slot-negotiations');
    if(!root){
      root=document.createElement('div'); root.id='ae-slot-negotiations';
      root.innerHTML=`<section class="ae-sn-window" role="dialog" aria-modal="true" aria-label="Slot Negotiations"><header class="ae-sn-head"><div class="ae-sn-title"><span>🤝</span>SLOT NEGOTIATIONS</div><div class="ae-sn-grip" aria-hidden="true"></div><div class="ae-sn-head-actions"><button class="ae-sn-iconbtn ae-sn-pin" title="Pin">📌</button><button class="ae-sn-iconbtn ae-sn-min" title="Minimize">−</button><button class="ae-sn-iconbtn ae-sn-x" title="Close">×</button></div></header><div class="ae-sn-body"><aside class="ae-sn-left"><div class="ae-sn-filters"><select class="ae-sn-select" aria-label="Region"><option>🌐  All Regions</option><option>North America</option></select><select id="ae-slot-sort" class="ae-sn-select" aria-label="Sort"><option value="revenue">⚖ Sort: Revenue</option><option value="slots">Sort: Slots</option><option value="name">Sort: Name</option></select></div><div class="ae-sn-list"></div></aside><main class="ae-sn-right"></main></div><footer class="ae-sn-foot"><span>Showing 6 of 42 airports</span><button class="ae-sn-close" type="button">Close</button></footer></section>`;
      document.body.appendChild(root);
      root.querySelector('.ae-sn-x').addEventListener('click',closeSlotWindow); root.querySelector('.ae-sn-close').addEventListener('click',closeSlotWindow);
      root.querySelector('.ae-sn-min').addEventListener('click',()=>root.querySelector('.ae-sn-window').classList.toggle('minimized'));
      root.querySelector('.ae-sn-pin').addEventListener('click',e=>{pinned=!pinned;e.currentTarget.style.color=pinned?'#59d9ff':'';});
      root.querySelector('#ae-slot-sort').addEventListener('change',renderList);
      root.addEventListener('mousedown',e=>{if(e.target===root&&!pinned)closeSlotWindow();});
      makeDraggable(root.querySelector('.ae-sn-window'),root.querySelector('.ae-sn-head'));
    }
    root.hidden=false; root.querySelector('.ae-sn-window').classList.remove('minimized'); renderList(); details(selected);
  }

  function makeDraggable(win,handle){
    let drag=null;
    handle.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=win.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};win.style.position='fixed';win.style.margin='0';win.style.width=r.width+'px';win.style.height=r.height+'px';handle.setPointerCapture(e.pointerId);});
    handle.addEventListener('pointermove',e=>{if(!drag)return;const x=Math.max(8,Math.min(innerWidth-win.offsetWidth-8,e.clientX-drag.x));const y=Math.max(8,Math.min(innerHeight-win.offsetHeight-8,e.clientY-drag.y));win.style.left=x+'px';win.style.top=y+'px';});
    const stop=()=>drag=null;handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);
  }

  function polishMainRedesign(){
    try{
      document.documentElement.setAttribute('data-ae-build',tag);
      const oc=document.querySelector('#ops-center .oc-sub'); if(oc) oc.textContent='Clean command feed · alerts, rivals, fleet, routes';
      const left=document.getElementById('left-panel'); if(left) left.setAttribute('title','Command rail');
      const right=document.getElementById('right-panel'); if(right) right.setAttribute('title','Ops feed');
      const ticker=document.getElementById('stock-ticker'); if(ticker) ticker.classList.remove('visible');
      addSlotStyles();
      document.addEventListener('click',e=>{const item=e.target.closest('.ae-nav-item');if(item && /airports/i.test(item.textContent||'')) setTimeout(openSlotWindow,0);});
      window.openSlotNegotiationsUI=openSlotWindow;
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polishMainRedesign); else polishMainRedesign();
})();
