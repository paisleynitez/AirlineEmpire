/* MARKETING_CENTER_v01 — presentation-only rebuild of the Advertising/Campaign
   window into the approved "Marketing Center" concept: header with stat boxes,
   pill tabs, campaign target cards with art header + badge + stats + action.
   Gameplay is untouched: this overrides window.buildCampaign with a renderer
   that reads the same live data (STATE, AD_TYPES, _adTab) and emits the SAME
   onclick actions (adSetTab, launchAd, closeModal) the stock window uses.
   If anything is missing it falls back to the native renderer.
   Styling lives in css/marketing-center-v01.css (scoped to .mkc). */
(function marketingCenterV01(){
  'use strict';
  if (window.AEMarketingCenterV01) return;
  window.AEMarketingCenterV01 = { version: 'v01' };

  const nativeBuild = window.buildCampaign;

  const TAB_META = {
    region:  { icon: '\uD83C\uDF0D', focus: 'Focus: Whole-region demand' },
    city:    { icon: '\uD83C\uDFD9', focus: 'Focus: One city\u2019s routes' },
    route:   { icon: '\u2708\uFE0F', focus: 'Focus: A single route' },
    venture: { icon: '\uD83C\uDFE2', focus: 'Focus: Venture income' }
  };

  function esc(s){ return String(s).replace(/'/g, "\\'"); }
  function html(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function render(){
    // Bail to native if the game globals we rely on are missing.
    if (typeof STATE === 'undefined' || typeof AD_TYPES === 'undefined' ||
        typeof _adTab === 'undefined' || typeof activeCampaignsList !== 'function' ||
        typeof adCost !== 'function') {
      return nativeBuild ? nativeBuild() : '';
    }
    if (typeof migrateBusinesses === 'function') migrateBusinesses();

    const camps = activeCampaignsList();
    const routes = STATE.routes || [];
    const hasAgency = (typeof hasVenture === 'function') && hasVenture('Travel Agency');
    const tab = _adTab;
    const a = AD_TYPES[tab];
    const cost = adCost(tab);

    // ---- Targets: identical construction to the stock buildCampaign ----
    let targets = [];
    if (tab === 'region') {
      targets = [...new Set(routes.flatMap(r=>[CITIES[r.from]?.region, CITIES[r.to]?.region]).filter(Boolean))]
        .map(reg => ({ label: reg, sub: reg + ' \u00b7 every route in region',
          active: camps.find(c=>c.type==='region' && c.region===reg),
          launch: `launchAd('region',{region:'${esc(reg)}'},'${esc(reg)}')` }));
    } else if (tab === 'city') {
      const cs = new Set(); (STATE.hubs||[]).forEach(h=>cs.add(h)); routes.forEach(r=>{cs.add(r.from); cs.add(r.to);});
      targets = [...cs].filter(c=>CITIES[c])
        .sort((x,y)=>(CITIES[y].econ+CITIES[y].tourism)-(CITIES[x].econ+CITIES[x].tourism))
        .map(city => ({ label: city, sub: CITIES[city].region,
          art: (window.AECitySkylineManifest && window.AECitySkylineManifest.get(city) || {}).src || null,
          active: camps.find(c=>c.type==='city' && c.city===city),
          launch: `launchAd('city',{city:'${esc(city)}'},'${esc(city)}')` }));
    } else if (tab === 'route') {
      targets = routes.map(r => ({ label: `${r.from} \u2192 ${r.to}`,
        sub: `${Math.round(r.load||0)}% load \u00b7 ${(r.pax||0).toLocaleString()} pass/mo`,
        active: camps.find(c=>c.type==='route' && ((c.from===r.from&&c.to===r.to)||(c.from===r.to&&c.to===r.from))),
        launch: `launchAd('route',{from:'${esc(r.from)}',to:'${esc(r.to)}'},'${esc(r.from+' \u2192 '+r.to)}')` }));
    } else {
      targets = (typeof ventureList==='function' ? ventureList() : []).map(v => {
        const key = ventureKey(v.name, v.city);
        return { label: `${v.icon} ${v.name}`, sub: `in ${v.city} \u00b7 +$${v.income}M/Q`,
          active: camps.find(c=>c.type==='venture' && c.ventureKey===key),
          launch: `launchAd('venture',{ventureKey:'${esc(key)}'},'${esc(v.name+' \u00b7 '+v.city)}')` };
      });
    }

    // ---- Header stats (real data only) ----
    const avgBoost = camps.length
      ? '+' + Math.round(camps.reduce((s,c)=>s+(c.bonus||0),0)/camps.length*100) + '%'
      : '\u2014';
    const discount = hasAgency ? '20%' : '\u2014';

    const tabsHtml = Object.keys(AD_TYPES).map(t =>
      `<button class="mkc-tab${t===tab?' active':''}" onclick="adSetTab('${t}')">` +
      `<span class="mkc-tab-ic">${TAB_META[t].icon}</span>${AD_TYPES[t].label}</button>`).join('');

    const cards = targets.length ? targets.map(t => {
      const badge = t.active
        ? `<span class="mkc-badge on">ACTIVE</span>`
        : `<span class="mkc-badge">AVAILABLE</span>`;
      const action = t.active
        ? `<div class="mkc-action running">Running \u00b7 ${t.active.monthsLeft}mo left</div>`
        : `<button class="mkc-action launch" ${STATE.cash<cost?'disabled':''} onclick="${t.launch}">Launch \u00b7 $${cost}M</button>`;
      const artStyle = t.art
        ? ` style="background-image:linear-gradient(180deg,rgba(4,14,26,.18),rgba(3,12,22,.55)),url('${t.art}')"`
        : '';
      return `<div class="mkc-card${t.active?' is-active':''}">
        <div class="mkc-art art-${tab}${t.art?' has-img':''}"${artStyle}>${badge}${t.art?'':`<span class="mkc-glyph">${TAB_META[tab].icon}</span>`}</div>
        <div class="mkc-card-body">
          <div class="mkc-name">${html(t.label)}</div>
          <div class="mkc-focus">${html(t.sub||TAB_META[tab].focus)}</div>
          <div class="mkc-cstats">
            <div class="mkc-cstat"><span>Boost</span><b>+${Math.round(a.bonus*100)}%</b></div>
            <div class="mkc-cstat"><span>Duration</span><b>${a.months} mo</b></div>
          </div>
          ${action}
        </div>
      </div>`;
    }).join('')
    : `<div class="mkc-empty">${tab==='venture' ? 'No ventures yet \u2014 buy one in Business Ventures.' : 'Open a route first to advertise here.'}</div>`;

    return `<div class="mkc">
      <div class="mkc-head">
        <div class="mkc-title-wrap">
          <div class="mkc-ic">\u2708</div>
          <div>
            <div class="mkc-title">Marketing Center</div>
            <div class="mkc-sub">Promote your airline and attract more passengers.</div>
          </div>
        </div>
        <div class="mkc-stats">
          <div class="mkc-stat"><span class="mkc-k">Active Campaigns</span><span class="mkc-v">${camps.length}</span></div>
          <div class="mkc-stat teal"><span class="mkc-k">Avg Boost</span><span class="mkc-v">${avgBoost}</span></div>
          <div class="mkc-stat vio"><span class="mkc-k">Agency Discount</span><span class="mkc-v">${discount}</span></div>
        </div>
        <button class="modal-close" onclick="closeModal()">\u00d7</button>
      </div>
      <div class="mkc-tabs">${tabsHtml}</div>
      <div class="mkc-note">${a.blurb} \u00b7 ${a.months} months \u00b7 $${cost}M each${hasAgency?' \u00b7 <span class="mkc-good">Travel Agency \u2014 20% off applied</span>':''}</div>
      <div class="mkc-grid">${cards}</div>
    </div>`;
  }

  window.buildCampaign = function(){
    try { return render(); }
    catch(e){ console.error('[MarketingCenter]', e); return nativeBuild ? nativeBuild() : ''; }
  };

  /* COMPACT rev B: the resize-grip memory stamps inline width/height on the
     frame; when the Marketing Center is showing, force height to content
     (max 86vh) and clear our overrides when any other window takes the modal. */
  var SIZED = ['width', 'max-width', 'height', 'max-height', 'margin'];
  function mkcSizeFrame(){
    var m = document.getElementById('modal-content');
    if (!m) return;
    if (m.querySelector('.mkc')) {
      m.style.setProperty('width', 'min(94vw, 780px)', 'important');
      m.style.setProperty('max-width', 'min(94vw, 780px)', 'important');
      m.style.setProperty('height', 'auto', 'important');
      m.style.setProperty('max-height', '86vh', 'important');
      /* drop dragged/resized offsets, then pin toward the top of the overlay */
      ['left', 'top', 'right', 'bottom', 'transform', 'position'].forEach(function(p){ m.style.removeProperty(p); });
      m.style.setProperty('margin', '15.5vh auto auto', 'important');
      m._mkcSized = true;
    } else if (m._mkcSized) {
      SIZED.forEach(function(p){ m.style.removeProperty(p); });
      m._mkcSized = false;
    }
  }
  function hookModal(){
    if (typeof window.openModal !== 'function') { setTimeout(hookModal, 300); return; }
    var o = window.openModal;
    if (!o.__aeMkc) {
      var wo = function(){ var r = o.apply(this, arguments); setTimeout(mkcSizeFrame, 0); return r; };
      wo.__aeMkc = true; window.openModal = wo;
    }
    var c = window.closeModal;
    if (typeof c === 'function' && !c.__aeMkc) {
      var wc = function(){ var r = c.apply(this, arguments); setTimeout(mkcSizeFrame, 0); return r; };
      wc.__aeMkc = true; window.closeModal = wc;
    }
    /* LOCK rev C: any re-render (tab switch, launch, refresh) restamps the
       frame, so the window never moves between Region/City/Route/Venture. */
    var mc = document.getElementById('modal-content');
    if (mc && !mc.__aeMkcObs) {
      mc.__aeMkcObs = true;
      new MutationObserver(function(){ mkcSizeFrame(); }).observe(mc, { childList: true });
    }
  }
  hookModal();
})();
