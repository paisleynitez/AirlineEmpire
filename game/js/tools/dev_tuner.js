(function(){
  let _tab = 'econ';
  let _defaults = null;
  const _collapsed = {};        // section-id -> bool (remember collapse state across re-renders)
  function captureDefaults() {
    if (_defaults) return;
    _defaults = {
      econ: { ...ECON },
      eventFreq: 0.30, rivalExpand: 0.20, rivalHub: 0.08, cityUp: 0.15, cityDown: 0.10,
      cfo: BOARD_ROLES.cfo.tiers.map(t => ({ ...t })),
      coo: BOARD_ROLES.coo.tiers.map(t => ({ ...t })),
      cso: BOARD_ROLES.strategy.tiers.map(t => ({ ...t })),
      crisis: Object.fromEntries(EVENT_POOL.filter(e=>e.id).map(e=>[e.id, e.mag])),
    };
  }
  window.dtToggle = function() {
    captureDefaults();
    const panel = document.getElementById('dev-tuner');
    const launch = document.getElementById('dt-launch');
    const showing = panel.classList.contains('dt-hidden');
    if (showing) {
      panel.classList.remove('dt-hidden');
      launch.classList.add('dt-gone');
      render();
    } else {
      panel.classList.add('dt-hidden');
      launch.classList.remove('dt-gone');
    }
  };
  window.dtSetTab = function(t) {
    _tab = t;
    document.querySelectorAll('.dt-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === t));
    render();
  };
  window._dtSet = {};
  function row(id, label, get, set, min, max, step, unit) {
    window._dtSet[id] = set;
    const v = get();
    const u = unit ? `<div class="dt-unit">${unit}</div>` : '';
    return `<div class="dt-row">
      <div><span class="dt-label">${label}</span>${u}</div>
      <input class="dt-num" id="dtn-${id}" type="number"
        min="${min}" max="${max}" step="${step}" value="${v}"
        oninput="_dtApply('${id}', this)" />
    </div>`;
  }
  window._dtApply = function(id, el) {
    let v = parseFloat(el.value);
    if (isNaN(v)) return;                      // let them keep typing
    const min = parseFloat(el.min), max = parseFloat(el.max);
    if (!isNaN(min) && v < min) v = min;
    if (!isNaN(max) && v > max) v = max;
    window._dtSet[id](v);
    el.classList.add('dt-changed');
  };
  function section(id, title, rowsHtml, startCollapsed) {
    if (_collapsed[id] === undefined) _collapsed[id] = !!startCollapsed;
    const cls = _collapsed[id] ? 'dt-sec dt-collapsed' : 'dt-sec';
    return `<div class="${cls}" id="dtsec-${id}">
      <div class="dt-sec-head" onclick="_dtSecToggle('${id}')">
        <span class="dt-sec-arrow">▼</span>${title}
      </div>
      <div class="dt-sec-rows">${rowsHtml}</div>
    </div>`;
  }
  window._dtSecToggle = function(id) {
    _collapsed[id] = !_collapsed[id];
    document.getElementById('dtsec-' + id)?.classList.toggle('dt-collapsed', _collapsed[id]);
  };
  function tabEcon() {
    let h = '';
    h += section('demand', 'Demand Pool',
      row('demandPop',  'Population factor', ()=>ECON.demandPop,  v=>ECON.demandPop=v,  100, 800, 1) +
      row('demandEcon', 'Economy factor',    ()=>ECON.demandEcon, v=>ECON.demandEcon=v,   2,  40, 0.1) +
      row('demandTour', 'Tourism factor',    ()=>ECON.demandTour, v=>ECON.demandTour=v,   2,  50, 0.1) +
      row('distDecay',  'Distance decay',    ()=>ECON.distDecay,  v=>ECON.distDecay=v, 2000,20000, 100, 'miles — higher = long routes keep demand'));
    h += section('fares', 'Fares & Elasticity',
      row('refFareBase', 'Base fare',        ()=>ECON.refFareBase, v=>ECON.refFareBase=v, 10, 200, 1, '$') +
      row('refFareDist', 'Fare per mile',    ()=>ECON.refFareDist, v=>ECON.refFareDist=v, 0.01, 0.15, 0.001, '$/mi') +
      row('fareElastic', 'Fare elasticity',  ()=>ECON.fareElastic, v=>ECON.fareElastic=v, 0.1, 2.0, 0.01) +
      row('rivalSplit',  'Rival mkt split',  ()=>ECON.rivalSplit,  v=>ECON.rivalSplit=v,  0.05, 0.9, 0.01, 'each rival takes a share'), true);
    h += section('costs', 'Operating Costs',
      row('fuelPerSeatMile','Fuel / seat-mi', ()=>ECON.fuelPerSeatMile, v=>ECON.fuelPerSeatMile=v, 0.01, 0.20, 0.001, '$') +
      row('crewPerFlight',  'Crew / flight',  ()=>ECON.crewPerFlight,   v=>ECON.crewPerFlight=v,  500, 5000, 50, '$') +
      row('crewPerMile',    'Crew / mile',    ()=>ECON.crewPerMile,     v=>ECON.crewPerMile=v,    0.1, 5.0, 0.05, '$') +
      row('paxHandling',    'Pass handling',   ()=>ECON.paxHandling,     v=>ECON.paxHandling=v,    1, 30, 0.5, '$/pass') +
      row('leasePerSeatMonth','Lease/seat/mo',()=>ECON.leasePerSeatMonth,v=>ECON.leasePerSeatMonth=v, 10, 150, 1, '$'), true);
    return h;
  }
  function tabWeather() {
    let h = `<div class="dt-note">Fire any weather event now — bypasses season &amp; region gates for testing. Map storm visuals spawn where defined.</div>`;
    const rows = EVENTS_WEATHER.map(e => {
      const icon = (e.text || '').trim().split(' ')[0];
      const name = e.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const eff  = e.fx === 'weather_closure' ? 'Airport closure'
                 : e.fx === 'regional_demand' ? `Region demand -${Math.round((1 - e.mag) * 100)}%`
                 : e.fx;
      const span = (typeof MONTHS !== 'undefined' && e.minMonth !== undefined)
                 ? `${MONTHS[e.minMonth]}\u2013${MONTHS[e.maxMonth]}` : 'any season';
      const regs = (e.regions && e.regions.length) ? e.regions.join(', ') : 'any region';
      return `<div class="dt-row" style="align-items:center">
        <div><span class="dt-label">${icon} ${name}</span><div class="dt-unit">${eff} \u00b7 ${span} \u00b7 ${regs}</div></div>
        <button class="dt-btn" style="padding:3px 9px;font-size:10px;white-space:nowrap" onclick="dtFireWeather('${e.id}')">\u25b6 Fire</button>
      </div>`;
    }).join('');
    h += section('dtwx', 'Demo Weather — fire on demand', rows);
    return h;
  }
  window.dtFireWeather = function(id) {
    const base = EVENTS_WEATHER.find(e => e.id === id);
    if (!base) return;
    fireEventNow({ ...base, cat:'weather' });
    const nm = id.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
    if (typeof showFlash === 'function') showFlash('\u25b6 Fired: ' + nm);
  };
  function tabEvents() {
    if (window._dtEventFreq === undefined) window._dtEventFreq = 0.30;
    if (window._dtRivalExpand === undefined) window._dtRivalExpand = 0.20;
    if (window._dtRivalHub === undefined) window._dtRivalHub = 0.08;
    if (window._dtCityLevelUp === undefined) window._dtCityLevelUp = 0.15;
    if (window._dtCityLevelDown === undefined) window._dtCityLevelDown = 0.10;
    let h = '';
    h += `<div class="dt-note">Values are probabilities (0–1). Changes take effect next month.</div>`;
    h += section('evfreq', 'World Events',
      row('eventFreq', 'Event / month', ()=>window._dtEventFreq, v=>window._dtEventFreq=v, 0, 1, 0.01, '0–1 chance'));
    h += section('evrival', 'Rivals',
      row('rivalExpand', 'Expand / mo',  ()=>window._dtRivalExpand, v=>window._dtRivalExpand=v, 0, 1, 0.01) +
      row('rivalHub',    'New hub / mo',  ()=>window._dtRivalHub,    v=>window._dtRivalHub=v,    0, 0.5, 0.01));
    h += section('evcity', 'City Growth',
      row('cityUp',   'Level-up',  ()=>window._dtCityLevelUp,   v=>window._dtCityLevelUp=v,   0, 0.5, 0.01) +
      row('cityDown', 'Level-down',()=>window._dtCityLevelDown, v=>window._dtCityLevelDown=v, 0, 0.5, 0.01), true);
    return h;
  }
  function tabExecs() {
    const roles = [
      { key:'cfo',      label:'CFO',  role:BOARD_ROLES.cfo,
        bonus:[['interestCut','Interest cut','0–0.9',0,0.9,0.01],['bizBoost','Biz income','+share',0,0.5,0.01]] },
      { key:'coo',      label:'COO',  role:BOARD_ROLES.coo,
        bonus:[['loadBoost','Load boost','+share',0,0.3,0.005]] },
      { key:'strategy', label:'CSO',  role:BOARD_ROLES.strategy,
        bonus:[['hubCut','Hub cost cut','0–0.9',0,0.9,0.01],['rivalShield','Rival shield','0–0.9',0,0.9,0.01]] },
    ];
    let h = `<div class="dt-note">Salary $M/mo · Signing $M · bonuses are fractions.</div>`;
    roles.forEach(({key,label,role,bonus}) => {
      let rows = '';
      role.tiers.forEach((tier,i) => {
        const t = i+1;
        rows += `<div class="dt-label" style="color:#666;margin:5px 0 2px;font-size:10px;letter-spacing:.5px">Tier ${t} — ${tier.title}</div>`;
        rows += row(`${key}_${t}_salary`, 'Salary', ()=>role.tiers[i].salary, v=>role.tiers[i].salary=v, 0.05, 5, 0.05);
        rows += row(`${key}_${t}_hire`,   'Signing',()=>role.tiers[i].hire,   v=>role.tiers[i].hire=v,   1, 100, 1);
        bonus.forEach(([bk,blabel,bunit,bmin,bmax,bstep]) => {
          rows += row(`${key}_${t}_${bk}`, blabel, ()=>role.tiers[i][bk], v=>role.tiers[i][bk]=v, bmin, bmax, bstep);
        });
      });
      h += section('exec_'+key, `${label} — ${role.name}`, rows, key!=='cfo');  // CFO open, others collapsed
    });
    return h;
  }
  function tabCrisis() {
    const items = [
      ['oil_crisis',         'Oil crisis fuel',     1.0, 3.0, 0.05, '× cost',   'Multiplies fuel costs on all routes. 1.4 = +40% fuel bill.'],
      ['major_oil_crisis',   'Major oil crisis',    1.0, 3.0, 0.05, '× cost',   'Severe version — higher multiplier, longer duration.'],
      ['pandemic',           'Pandemic demand',     0.1, 0.9, 0.05, '× demand', 'Crushes passenger demand globally. 0.3 = 70% demand drop.'],
      ['epidemic',           'Epidemic demand',     0.1, 0.9, 0.05, '× demand', 'Regional demand collapse. Milder than pandemic.'],
      ['health_scare',       'Health scare',        0.4, 0.95,0.05, '× demand', 'Short-term demand hit. 0.7 = 30% fewer passengers.'],
      ['currency_crisis',    'Currency crisis',     0.2, 0.9, 0.05, '× rev',    'Cuts revenue from international routes. 0.6 = −40% rev.'],
      ['mild_currency_crisis','Mild currency',      0.4, 0.95,0.05, '× rev',    'Softer currency hit — affects fewer regions.'],
      ['recession',          'Recession demand',    0.4, 0.95,0.05, '× demand', 'Economy-wide demand reduction. 0.75 = 25% fewer pass.'],
    ];
    let rows = '';
    items.forEach(([id, label, min, max, step, unit, desc]) => {
      const ev = EVENT_POOL.find(e => e.id === id); if (!ev) return;
      rows += row('cr_' + id, label, () => ev.mag, v => ev.mag = v, min, max, step, unit);
      rows += `<div class="dt-note" style="margin:-2px 0 7px;color:#4a5560;">${desc}</div>`;
    });
    const merger = EVENT_POOL.find(e => e.id === 'rival_merger');
    let rivalRows = merger
      ? row('cr_rival_merger', 'Rival merger size', () => merger.mag, v => merger.mag = v, 1.0, 3.0, 0.05, '× size') +
        `<div class="dt-note" style="margin:-2px 0 7px;color:#4a5560;">How much larger the merged rival becomes. 1.3 = 30% bigger.</div>`
      : '';
    let h = `<div class="dt-note" style="margin-bottom:8px;">Magnitudes apply next time each event fires.<br>For <strong style="color:#9a9a9a">demand/rev</strong> crises: lower = worse (0.5 = half). For <strong style="color:#9a9a9a">cost</strong> crises: higher = worse (2.0 = double).</div>`;
    h += section('crmag', 'Crisis Magnitudes', rows);
    if (rivalRows) h += section('crrival', 'Rival Events', rivalRows, true);
    return h;
  }
  function render() {
    const body = document.getElementById('dt-body');
    if (!body) return;
    window._dtSet = {};
    if (_tab === 'econ')   body.innerHTML = tabEcon();
    if (_tab === 'events') body.innerHTML = tabEvents();
    if (_tab === 'execs')  body.innerHTML = tabExecs();
    if (_tab === 'crisis') body.innerHTML = tabCrisis();
    if (_tab === 'weather') body.innerHTML = tabWeather();
  }
  window.dtReset = function() {
    if (!_defaults) return;
    Object.assign(ECON, _defaults.econ);
    window._dtEventFreq = _defaults.eventFreq;
    window._dtRivalExpand = _defaults.rivalExpand;
    window._dtRivalHub = _defaults.rivalHub;
    window._dtCityLevelUp = _defaults.cityUp;
    window._dtCityLevelDown = _defaults.cityDown;
    _defaults.cfo.forEach((t,i)=>Object.assign(BOARD_ROLES.cfo.tiers[i], t));
    _defaults.coo.forEach((t,i)=>Object.assign(BOARD_ROLES.coo.tiers[i], t));
    _defaults.cso.forEach((t,i)=>Object.assign(BOARD_ROLES.strategy.tiers[i], t));
    EVENT_POOL.forEach(e=>{ if (e.id && _defaults.crisis[e.id] !== undefined) e.mag = _defaults.crisis[e.id]; });
    render();
    if (typeof showFlash === 'function') showFlash('⚙ Tuner reset to defaults');
  };
  window.dtExport = function() {
    const snap = {
      ECON: { ...ECON },
      eventFreqMonthly: window._dtEventFreq ?? 0.30,
      rivalExpandChance: window._dtRivalExpand ?? 0.20,
      rivalNewHubChance: window._dtRivalHub ?? 0.08,
      cityLevelUpChance: window._dtCityLevelUp ?? 0.15,
      cityLevelDownChance: window._dtCityLevelDown ?? 0.10,
      BOARD_ROLES: {
        cfo:      { tiers: BOARD_ROLES.cfo.tiers.map(t=>({...t})) },
        coo:      { tiers: BOARD_ROLES.coo.tiers.map(t=>({...t})) },
        strategy: { tiers: BOARD_ROLES.strategy.tiers.map(t=>({...t})) },
      },
      crisisMagnitudes: Object.fromEntries(EVENT_POOL.filter(e=>e.id).map(e=>[e.id, e.mag])),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'airline-empire-tunables.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showFlash === 'function') showFlash('⚙ Tunables exported');
  };
  document.addEventListener('keydown', function(e) {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.key === '`' || e.key === '~') dtToggle();
  });
  (function(){
    const header = document.getElementById('dt-header');
    const panel  = document.getElementById('dev-tuner');
    if (!header || !panel) return;
    let drag=false, sx=0, sy=0, sl=0, st=0;
    header.addEventListener('mousedown', e => {
      if (e.target.id === 'dt-min') return;
      drag = true;
      const r = panel.getBoundingClientRect();
      sx=e.clientX; sy=e.clientY; sl=r.left; st=r.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!drag) return;
      let nl = sl + (e.clientX - sx);
      let nt = st + (e.clientY - sy);
      nl = Math.max(0, Math.min(window.innerWidth  - panel.offsetWidth,  nl));
      nt = Math.max(0, Math.min(window.innerHeight - 40, nt));
      panel.style.left = nl + 'px'; panel.style.top = nt + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => { drag = false; });
  })();
  window._dtGetEventProb = function() {
    return (window._dtEventFreq !== undefined) ? window._dtEventFreq : 0.30;
  };
})();

/* =========================================================
   AE-MARKET-INTEL-002-WORKING-V55
   Built onto airline-empire-v6_23_4_55.html.
   Adds strategy brain without replacing the opening/start flow.
   ========================================================= */
(function(){
  const MI_VERSION = 'AE-MARKET-INTEL-002-WORKING-V55';
  const RIVAL_ACTIONS = ['Fare War','Capacity Dump','Ad Blitz','Premium Cabin Attack','Regional Expansion','Route Match','Retreat','Ignore'];
  const ADVISORS = {
    aggressive:'Aggressive Advisor', conservative:'Conservative Advisor', finance:'Finance Advisor', network:'Network Advisor', brand:'Brand Advisor'
  };
  function miClamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
  function miPick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function miInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
  function miMoney(n){ return '$'+Number(n||0).toFixed(0)+'M'; }
  function miMonthKey(){ return (STATE?.year||0)+'-'+(STATE?.month||0); }
  function miEnsure(){
    if(!window.STATE) return null;
    STATE.marketIntel = STATE.marketIntel || {};
    const mi = STATE.marketIntel;
    mi.version = MI_VERSION;
    mi.routeOffers = mi.routeOffers || [];
    mi.aircraftDeals = mi.aircraftDeals || [];
    mi.contracts = mi.contracts || [];
    mi.trials = mi.trials || [];
    mi.rivalWatch = mi.rivalWatch || [];
    mi.monthlyReports = mi.monthlyReports || [];
    mi.decisionLog = mi.decisionLog || [];
    mi.heatMap = mi.heatMap || [];
    mi.activeTab = mi.activeTab || 'routes';
    return mi;
  }
  function miLog(text,type='neutral'){
    const mi=miEnsure(); if(!mi) return;
    mi.decisionLog.unshift({text,type,time:(MONTHS?.[STATE.month]||'')+' '+STATE.year});
    if(mi.decisionLog.length>80) mi.decisionLog.pop();
  }
  function miCityScore(name){ const c=CITIES[name]; if(!c) return 1; return ((c.pop||1)*120)+((c.econ||45)*5)+((c.tourism||45)*4)+((c.major?120:0)); }
  function miRouteExists(from,to){ return (STATE.routes||[]).some(r=>(r.from===from&&r.to===to)||(r.from===to&&r.to===from)); }
  function miSeason(c){
    const m=STATE.month||0, t=c?.tourism||45, reg=c?.region||'';
    let v=1;
    if([5,6,7].includes(m)) v += t>62?.18:.07;
    if([10,11,0].includes(m)) v += t>62?.15:.05;
    if(reg==='Europe' && [6,7].includes(m)) v += .07;
    if(reg==='N America' && [11,0].includes(m)) v += .05;
    return v;
  }
  function miForecast(from,to,demand,dist){
    const c=CITIES[to]||{}; const season=miSeason(c); const econ=(c.econ||50), tourism=(c.tourism||50);
    if(season>1.18) return {type:'Seasonal Spike', window:'Next 3 months', trend:'+18%', confidence:'High'};
    if(econ>74 && demand>420) return {type:'Business Growth', window:'6 month build', trend:'+9%', confidence:'Medium'};
    if(tourism>76) return {type:'Tourism Surge', window:'Holiday peak', trend:'+14%', confidence:'Medium'};
    if(dist>5200) return {type:'Volatile', window:'Fuel-sensitive', trend:'±12%', confidence:'Low'};
    if(demand<180) return {type:'Declining', window:'Test only', trend:'-5%', confidence:'Medium'};
    return {type:'Stable', window:'Next 6 months', trend:'+3%', confidence:'Medium'};
  }
  function miRisks(from,to,dist,demand,competition){
    const c=CITIES[to]||{}; const risks=[];
    if(competition==='High') risks.push('Rival pressure');
    if(dist>5200) risks.push('Fuel exposure');
    if((c.tourism||0)>68) risks.push('Seasonal demand');
    if((c.econ||0)<45) risks.push('Weak business base');
    if(demand<220) risks.push('Thin market');
    if(['Miami','Houston','Cancun','Havana','New Orleans'].includes(to)) risks.push('Storm disruption');
    return risks.slice(0,3).length?risks.slice(0,3):['Normal launch risk'];
  }
  function miCompetition(from,to,dist){
    const rivals=(STATE.competitors||[]).filter(comp=>(comp.routeList||[]).some(r=>(r.from===from&&r.to===to)||(r.from===to&&r.to===from))).length;
    const c=CITIES[to]||{}, major=(CITIES[from]?.major||c.major)?1:0;
    if(rivals>=2 || major && Math.random()>.45) return 'High';
    if(rivals===1 || Math.random()>.55) return 'Medium';
    return 'Low';
  }
  function miSuggestedAircraft(dist,demand){
    const list=Object.entries(AIRCRAFT||{}).filter(([n,a])=>a && (a.range||0)>=dist && (a.era||0)<=((STATE.year||2020)+3) && !a.retired).map(([n,a])=>{
      const seats=a.seats||150; const fit=Math.abs(seats - Math.max(90, demand/3));
      return {n,a,score:fit + (a.cost||50)*.45 - (a.fuel||70)*.18};
    }).sort((x,y)=>x.score-y.score);
    return list[0]?.n || 'No aircraft in range';
  }
  function miDemand(from,to,dist){
    const base=Math.sqrt(miCityScore(from)*miCityScore(to));
    const distPenalty=1/(1+dist/5200);
    const hub=(STATE.hubs||[]).includes(from)?1.16:1;
    const season=miSeason(CITIES[to]);
    return Math.max(35, Math.round(base*distPenalty*hub*season/15));
  }
  function miProfit(dist,demand,competition,plane){
    const a=AIRCRAFT[plane]||{}; const seats=a.seats||150, fuel=a.fuel||74;
    const flights=demand>620?7:demand>340?5:3; const fare=Math.max(89,95+dist*.055); const load=miClamp(demand/Math.max(1,seats*flights),.46,.92);
    let p=(seats*flights*load*fare)/1000000 - (dist*flights*((105-fuel)/100)*0.018) - ((a.cost||45)*.08);
    if(competition==='High') p*=.74; else if(competition==='Low') p*=1.14;
    return Math.round(p*10)/10;
  }
  function miAdvisor(offer,style){
    style=style||miPick(Object.keys(ADVISORS));
    const f=offer.forecast?.type||'Stable'; const risk=(offer.risks||[])[0]||'normal launch risk';
    const lines={
      aggressive:`Take the slot before rivals wake up. ${offer.from} → ${offer.to} has ${offer.competition.toLowerCase()} competition and ${f.toLowerCase()} potential.`,
      conservative:`Use a 90-day trial. The upside is real, but ${risk.toLowerCase()} needs proof before permanent commitment.`,
      finance:`Margins forecast at ${miMoney(offer.estimatedProfit)} weekly. Watch setup costs and avoid over-capacity.`,
      network:`This strengthens hub feed from ${offer.from}. It fits best if you can connect passengers onward.`,
      brand:`Passenger story matters here. Launch clean, keep service strong, and use the route to build reputation.`
    };
    return {style,name:ADVISORS[style],text:lines[style]};
  }
  function miGenerateRouteOffer(){
    const entries=Object.keys(CITIES||{}).filter(n=>CITIES[n] && typeof CITIES[n].x==='number');
    const origins=(STATE.hubs||[]).filter(n=>CITIES[n]);
    let from,to,dist;
    for(let i=0;i<80;i++){
      from=(origins.length?miPick(origins):miPick(entries)); to=miPick(entries); if(!from||!to||from===to) continue;
      dist=Math.round(getDistance(from,to));
      if(dist<120||dist>9500||miRouteExists(from,to)) continue;
      break;
    }
    if(!from||!to||from===to) return null;
    const demand=miDemand(from,to,dist), comp=miCompetition(from,to,dist), plane=miSuggestedAircraft(dist,demand), forecast=miForecast(from,to,demand,dist);
    const risks=miRisks(from,to,dist,demand,comp);
    const offer={id:'MI-'+from+'-'+to+'-'+Date.now()+'-'+miInt(10,99),from,to,distance:dist,demand,competition:comp,suggestedAircraft:plane,estimatedProfit:miProfit(dist,demand,comp,plane),forecast,risks,tags:[],expiresIn:miInt(3,9)};
    if(demand>550) offer.tags.push('Heavy demand'); if(comp==='Low') offer.tags.push('Low competition'); if(dist>5000) offer.tags.push('Long-haul'); if(forecast.type.includes('Tourism')||forecast.type.includes('Seasonal')) offer.tags.push('Tourism window');
    offer.advisor=miAdvisor(offer);
    return offer;
  }
  function miGenerateRoutes(){
    const mi=miEnsure(); const offers=[]; const seen=new Set();
    for(let i=0;i<60 && offers.length<6;i++){ const o=miGenerateRouteOffer(); if(!o) continue; const k=[o.from,o.to].sort().join('|'); if(seen.has(k)) continue; seen.add(k); offers.push(o); }
    mi.routeOffers=offers; miLog(`Generated ${offers.length} route forecasts.`,'good'); return offers;
  }
  function miGenerateAircraftDeals(){
    const mi=miEnsure(); const ac=Object.entries(AIRCRAFT||{}).filter(([n,a])=>a && (a.era||0)<=((STATE.year||2020)+2) && !a.retired).sort(()=>Math.random()-.5).slice(0,6);
    mi.aircraftDeals=ac.map(([name,a])=>{ const condition=miInt(58,96), discount=miInt(8,32); const price=Math.max(1,Math.round((a.cost||50)*(1-discount/100)*(condition/100+.16))); return {id:'DEAL-'+name+'-'+Date.now()+miInt(1,99),name,seats:a.seats||0,range:a.range||0,condition,price,discount,risk:condition<70?'High maintenance risk':condition<82?'Moderate maintenance risk':'Clean record',fit:mi.routeOffers.find(o=>(a.range||0)>=o.distance)?.from||'General fleet'}; });
  }
  function miGenerateContracts(){
    const mi=miEnsure(); const offers=mi.routeOffers.length?mi.routeOffers:miGenerateRoutes();
    const types=['Sports Team Charter','Holiday Relief Lift','Government Shuttle','VIP Tour Series','Emergency Capacity Contract','Cargo Belly-Hold Trial'];
    mi.contracts=offers.slice(0,4).map(o=>({id:'CON-'+o.id,type:miPick(types),from:o.from,to:o.to,payout:Math.max(2,Math.round(o.estimatedProfit*miInt(3,7))),requires:o.demand>520?'160+ seats':'100+ seats',expiresIn:miInt(2,6),risk:miPick(o.risks),status:'Open'}));
  }
  function miGenerateHeat(){
    const regs=[...new Set(Object.values(CITIES||{}).map(c=>c.region).filter(Boolean))];
    const hot=regs.sort(()=>Math.random()-.5).slice(0,3).map(r=>({region:r,trend:'+'+miInt(6,22)+'%',why:miPick(['Tourism surge','Business travel rebound','Rival retreat','Seasonal peak','Airport expansion'])}));
    const cool=regs.sort(()=>Math.random()-.5).slice(0,2).map(r=>({region:r,trend:'-'+miInt(3,14)+'%',why:miPick(['Fuel pressure','Weather disruption','Fare war','Weak demand','Congestion'])}));
    miEnsure().heatMap={hot,cool,updated:miMonthKey()};
  }
  function miMonthlyReport(reason){
    const mi=miEnsure(); const hot=mi.heatMap.hot||[], cool=mi.heatMap.cool||[];
    const report={id:'REP-'+Date.now(),time:(MONTHS[STATE.month]||'')+' '+STATE.year,reason:reason||'Monthly refresh',summary:`${hot[0]?.region||'Regional'} demand is heating up; ${cool[0]?.region||'fuel-sensitive'} markets need caution.`,hot,cool,rivals:(mi.rivalWatch||[]).slice(0,3),actions:['Review 90-day trials','Check used aircraft deals','Avoid overcapacity on high-risk routes']};
    mi.monthlyReports.unshift(report); if(mi.monthlyReports.length>12) mi.monthlyReports.pop();
  }
  function miGenerateAll(reason){
    miEnsure(); miGenerateRoutes(); miGenerateAircraftDeals(); miGenerateContracts(); miGenerateHeat(); miMonthlyReport(reason||'Manual refresh');
    try{ if(typeof addEvent==='function') addEvent('neutral','🛰 Market Intelligence refreshed: forecasts, deals, contracts and heat map updated.'); }catch(e){}
  }
  function miRivalResponse(offer){
    const rival=miPick(STATE.competitors||[{name:'Grafitti'},{name:'AeroNova'},{name:'PanWorld'}]); let action='Ignore';
    if(offer.estimatedProfit>6 && Math.random()<.55) action=miPick(['Fare War','Capacity Dump','Route Match','Ad Blitz']);
    else if(offer.demand>520 && Math.random()<.35) action=miPick(['Premium Cabin Attack','Regional Expansion']);
    else if(Math.random()<.25) action='Retreat';
    const severity= action==='Ignore'||action==='Retreat'?'Low':(action==='Fare War'||action==='Capacity Dump'?'High':'Medium');
    const rec={time:(MONTHS[STATE.month]||'')+' '+STATE.year,rival:rival?.name||'Rival',route:offer.from+' → '+offer.to,action,severity,message:`${rival?.name||'A rival'} response on ${offer.from} → ${offer.to}: ${action}.`};
    const mi=miEnsure(); mi.rivalWatch.unshift(rec); if(mi.rivalWatch.length>40) mi.rivalWatch.pop();
    return rec;
  }
  window.miPlanRoute=function(i){ const mi=miEnsure(); const o=mi.routeOffers[i]; if(!o) return showFlash('Opportunity expired'); miLog(`Planned route ${o.from} → ${o.to}.`,'good'); try{ openRouteCreation(o.from,o.to); }catch(e){ openModal('new-route'); } };
  window.miLaunchTrial=function(i){
    const mi=miEnsure(); const o=mi.routeOffers[i]; if(!o) return showFlash('Opportunity expired');
    const trial={id:'TRIAL-'+o.id,offer:o,from:o.from,to:o.to,stage:'Trial',monthsRemaining:3,age:0,load:miInt(58,88),profit:Math.max(-2,Math.round(o.estimatedProfit*.55)),satisfaction:miInt(64,91),rival:miRivalResponse(o),history:[]};
    mi.trials.unshift(trial); miLog(`Launched 90-day trial ${o.from} → ${o.to}.`,'good'); try{ addEvent('good',`🧪 90-day route trial launched: ${o.from}→${o.to}`); }catch(e){}; showFlash('✓ 90-day trial launched'); openMarketIntel('trials');
  };
  window.miAcceptContract=function(i){ const mi=miEnsure(); const c=mi.contracts[i]; if(!c) return; c.status='Accepted'; miLog(`Accepted contract: ${c.type} ${c.from} → ${c.to} for ${miMoney(c.payout)}.`,'good'); try{ addEvent('good',`📄 Contract accepted: ${c.type} ${c.from}→${c.to}`); }catch(e){} showFlash('✓ Contract accepted'); openMarketIntel('contracts'); };
  window.miBuyDeal=function(i){ const mi=miEnsure(); const d=mi.aircraftDeals[i]; if(!d) return; if((STATE.cash||0)<d.price) return showFlash('⚠ Not enough cash'); STATE.cash-=d.price; const a=AIRCRAFT[d.name]; STATE.planes[d.name]=STATE.planes[d.name]||{...a,owned:0,assigned:0}; STATE.planes[d.name].owned++; miLog(`Purchased used ${d.name} for ${miMoney(d.price)}.`,'good'); try{ addEvent('neutral',`Used aircraft acquired: ${d.name} (${d.condition}% condition)`); }catch(e){} updateUI(); openMarketIntel('aircraft'); };
  function miProcessTrials(){
    const mi=miEnsure(); (mi.trials||[]).forEach(t=>{ if(t.stage==='Converted'||t.stage==='Cut') return; t.age=(t.age||0)+1; t.monthsRemaining=Math.max(0,(t.monthsRemaining||3)-1); const pressure=t.rival?.severity==='High'?-8:t.rival?.severity==='Medium'?-4:1; t.load=miClamp((t.load||70)+miInt(-6,8)+pressure,30,96); t.profit=Math.round(((t.offer?.estimatedProfit||3)*(t.load/78)) - (t.rival?.severity==='High'?2:0)); t.satisfaction=miClamp((t.satisfaction||75)+miInt(-4,5),35,98); t.history=t.history||[]; t.history.push({time:(MONTHS[STATE.month]||'')+' '+STATE.year,load:t.load,profit:t.profit,satisfaction:t.satisfaction}); if(t.monthsRemaining===0){ t.stage=t.profit>=4&&t.load>=72?'Ready to Convert':t.profit>=1?'Needs Decision':'At Risk'; t.grade=t.profit>=8&&t.load>=82?'A':t.profit>=4?'B':t.profit>=1?'C':t.load>=50?'D':'F'; try{ addEvent(t.grade==='F'?'bad':'good',`📊 Trial report ready: ${t.from}→${t.to} Grade ${t.grade}`); }catch(e){} } });
  }
  window.miConvertTrial=function(i){ const mi=miEnsure(); const t=mi.trials[i]; if(!t) return; t.stage='Converted'; miLog(`Converted trial ${t.from} → ${t.to} to route-planning handoff.`,'good'); try{ openRouteCreation(t.from,t.to); }catch(e){} };
  window.miExtendTrial=function(i){ const t=miEnsure().trials[i]; if(!t) return; t.stage='Trial'; t.monthsRemaining=3; miLog(`Extended trial ${t.from} → ${t.to}.`,'neutral'); openMarketIntel('trials'); };
  window.miCutTrial=function(i){ const t=miEnsure().trials[i]; if(!t) return; t.stage='Cut'; miLog(`Cut trial ${t.from} → ${t.to}.`,'bad'); openMarketIntel('trials'); };
  function miCardOffer(o,i){ return `<div class="aemi-card"><div class="aemi-route"><span>${o.from}</span><b>→</b><span>${o.to}</span></div><div class="aemi-tags">${(o.tags||[]).map(t=>`<span class="aemi-tag">${t}</span>`).join('')}<span class="aemi-tag warn">${o.forecast.type}</span></div><div class="aemi-stats"><div class="aemi-stat"><b>${o.distance.toLocaleString()}</b><small>miles</small></div><div class="aemi-stat"><b>${o.demand}</b><small>demand</small></div><div class="aemi-stat"><b>${o.competition}</b><small>competition</small></div><div class="aemi-stat"><b>${miMoney(o.estimatedProfit)}</b><small>weekly est.</small></div></div><div class="aemi-note"><b>Forecast:</b> ${o.forecast.window} · ${o.forecast.trend} · ${o.forecast.confidence} confidence<br><b>Aircraft:</b> ${o.suggestedAircraft}</div><div class="aemi-tags">${(o.risks||[]).map(r=>`<span class="aemi-tag bad">${r}</span>`).join('')}</div><div class="aemi-advisor"><b>${o.advisor.name}:</b> ${o.advisor.text}</div><div class="aemi-row"><button class="aemi-btn" onclick="miPlanRoute(${i})">Plan Route</button><button class="aemi-btn warn" onclick="miLaunchTrial(${i})">Launch 90-Day Trial</button></div></div>`; }
  function miRenderRoutes(){ const mi=miEnsure(); if(!mi.routeOffers.length) miGenerateAll('First open'); return `<div class="aemi-grid">${mi.routeOffers.map(miCardOffer).join('')}</div>`; }
  function miRenderAircraft(){ const mi=miEnsure(); if(!mi.aircraftDeals.length) miGenerateAircraftDeals(); return `<div class="aemi-grid">${mi.aircraftDeals.map((d,i)=>`<div class="aemi-card"><div class="aemi-route"><span>${d.name}</span></div><div class="aemi-stats"><div class="aemi-stat"><b>${miMoney(d.price)}</b><small>used price</small></div><div class="aemi-stat"><b>${d.condition}%</b><small>condition</small></div><div class="aemi-stat"><b>${d.seats}</b><small>seats</small></div><div class="aemi-stat"><b>${d.range.toLocaleString()}</b><small>range</small></div></div><div class="aemi-note">${d.risk}. Fit: ${d.fit==='General fleet'?'General fleet':d.fit+' route board'}.</div><button class="aemi-btn" onclick="miBuyDeal(${i})">Buy Used Aircraft</button></div>`).join('')}</div>`; }
  function miRenderContracts(){ const mi=miEnsure(); if(!mi.contracts.length) miGenerateContracts(); return `<div class="aemi-grid">${mi.contracts.map((c,i)=>`<div class="aemi-card"><div class="aemi-route"><span>${c.type}</span></div><div class="aemi-note"><b>${c.from} → ${c.to}</b><br>Requires: ${c.requires}<br>Risk: ${c.risk}<br>Expires in ${c.expiresIn} months</div><div class="aemi-stats"><div class="aemi-stat"><b>${miMoney(c.payout)}</b><small>payout</small></div><div class="aemi-stat"><b>${c.status}</b><small>status</small></div></div><button class="aemi-btn" onclick="miAcceptContract(${i})">Accept Contract</button></div>`).join('')}</div>`; }
  function miRenderTrials(){ const mi=miEnsure(); if(!mi.trials.length) return `<div class="aemi-card"><div class="aemi-title">No route trials yet</div><div class="aemi-note">Launch a 90-day trial from Route Opportunities to generate reports, rival response, and lifecycle decisions.</div></div>`; return `<div class="aemi-grid">${mi.trials.map((t,i)=>`<div class="aemi-card"><div class="aemi-route"><span>${t.from}</span><b>→</b><span>${t.to}</span></div><div class="aemi-tags"><span class="aemi-tag warn">${t.stage}</span><span class="aemi-tag">${t.monthsRemaining||0} months left</span><span class="aemi-tag bad">${t.rival?.action||'No response'}</span></div><div class="aemi-stats"><div class="aemi-stat"><b>${t.load}%</b><small>load factor</small></div><div class="aemi-stat"><b>${miMoney(t.profit)}</b><small>monthly profit</small></div><div class="aemi-stat"><b>${t.satisfaction}%</b><small>satisfaction</small></div><div class="aemi-stat"><b>${t.grade||'—'}</b><small>grade</small></div></div><div class="aemi-progress"><i style="width:${miClamp(t.load,0,100)}%"></i></div><div class="aemi-advisor"><b>Rival Watch:</b> ${t.rival?.message||'No rival response yet.'}</div><div class="aemi-row"><button class="aemi-btn" onclick="miConvertTrial(${i})">Convert</button><button class="aemi-btn warn" onclick="miExtendTrial(${i})">Extend</button><button class="aemi-btn" onclick="miCutTrial(${i})">Cut</button></div></div>`).join('')}</div>`; }
  function miRenderHeat(){ const mi=miEnsure(); if(!mi.heatMap.hot) miGenerateHeat(); const h=mi.heatMap; return `<div class="aemi-heat"><div class="aemi-card hot"><div class="aemi-title">Hot Markets</div>${(h.hot||[]).map(x=>`<div class="aemi-list-row"><b>${x.region}</b> <span style="color:var(--profit)">${x.trend}</span><div class="aemi-mini">${x.why}</div></div>`).join('')}</div><div class="aemi-card cool"><div class="aemi-title">Cooling Markets</div>${(h.cool||[]).map(x=>`<div class="aemi-list-row"><b>${x.region}</b> <span style="color:var(--loss)">${x.trend}</span><div class="aemi-mini">${x.why}</div></div>`).join('')}</div></div>`; }
  function miRenderRivals(){ const mi=miEnsure(); return `<div class="aemi-list">${(mi.rivalWatch||[]).length?(mi.rivalWatch||[]).map(r=>`<div class="aemi-list-row"><b>${r.rival}</b> · ${r.action} · ${r.severity}<div class="aemi-mini">${r.route} · ${r.time}</div><div class="aemi-note">${r.message}</div></div>`).join(''):`<div class="aemi-card"><div class="aemi-title">No rival response yet</div><div class="aemi-note">Launch a trial or high-value route opportunity to trigger Rival Watch.</div></div>`}</div>`; }
  function miRenderReports(){ const mi=miEnsure(); if(!mi.monthlyReports.length) miMonthlyReport('First report'); return `<div class="aemi-list">${mi.monthlyReports.map(r=>`<div class="aemi-list-row"><b>${r.time}</b> · ${r.reason}<div class="aemi-note">${r.summary}</div><div class="aemi-tags">${(r.actions||[]).map(a=>`<span class="aemi-tag">${a}</span>`).join('')}</div></div>`).join('')}</div>`; }
  function miRenderLog(){ const mi=miEnsure(); return `<div class="aemi-list aemi-log">${(mi.decisionLog||[]).map(l=>`<div class="aemi-list-row"><b>${l.time}</b><div class="aemi-note">${l.text}</div></div>`).join('')||'<div class="aemi-card">No decisions logged yet.</div>'}</div>`; }
  function miBody(tab){ return ({routes:miRenderRoutes,aircraft:miRenderAircraft,contracts:miRenderContracts,trials:miRenderTrials,heat:miRenderHeat,rivals:miRenderRivals,reports:miRenderReports,log:miRenderLog}[tab]||miRenderRoutes)(); }
  window.openMarketIntel=function(tab){ const mi=miEnsure(); if(tab) mi.activeTab=tab; const active=mi.activeTab||'routes'; const tabs=[['routes','Route Opportunities'],['aircraft','Used Aircraft'],['contracts','Contracts'],['trials','Trial Routes'],['heat','Heat Map'],['rivals','Rival Watch'],['reports','Monthly Report'],['log','Decision Log']]; const html=`<div class="aemi-wrap"><div class="aemi-hero"><div><div class="aemi-kicker">${MI_VERSION}</div><div class="aemi-title">🛰 Market Intelligence</div><div class="aemi-sub">Forecast → act → rivals respond → trial report → convert, extend, or cut. Built onto the working v6_23_4_55 base without replacing the opening flow.</div></div><div class="aemi-actions"><button class="aemi-btn" onclick="miGenerateAll('Manual refresh');openMarketIntel('${active}')">↻ Refresh Intel</button><button class="aemi-btn warn" onclick="miProcessTrials();miMonthlyReport('Manual simulation');openMarketIntel('trials')">Advance Intel Month</button></div></div><div class="aemi-tabs">${tabs.map(t=>`<button class="aemi-tab ${active===t[0]?'active':''}" onclick="openMarketIntel('${t[0]}')">${t[1]}</button>`).join('')}</div>${miBody(active)}</div>`; if(typeof openModal==='function'){ openModal('settings'); const c=document.getElementById('modal-content'); c.innerHTML=modalHead('🛰 Market Intelligence')+`<div class="modal-body">${html}</div>`; c.classList.add('modal-wide'); } };
  const _oldRenderOps = window.renderOpsCenter;
  if(typeof _oldRenderOps==='function') window.renderOpsCenter=function(){ _oldRenderOps.apply(this,arguments); const box=document.getElementById('oc-tiles'); if(box && !document.getElementById('aemi-ops-tile')) box.insertAdjacentHTML('beforeend',`<div id="aemi-ops-tile" class="oc-tile oc-teal aemi-tile" onclick="openMarketIntel('routes')"><div class="oc-ic">🛰</div><div class="oc-meta"><div class="oc-label">Market Intelligence</div><div class="oc-note">Forecasts · rivals · trials</div></div><div class="oc-big">MI</div></div>`); };
  const _oldEnd = window.endTurn;
  if(typeof _oldEnd==='function') window.endTurn=function(){ const res=_oldEnd.apply(this,arguments); try{ miProcessTrials(); if(Math.random()<.75){ miGenerateAll('Monthly auto-refresh'); } }catch(e){ console.warn(MI_VERSION,e); } return res; };
  const _oldStart = window.startGame;
  if(typeof _oldStart==='function') window.startGame=function(){ const res=_oldStart.apply(this,arguments); try{ setTimeout(()=>{ miEnsure(); miGenerateAll('New game seed'); try{ updateUI(); }catch(e){} },250); }catch(e){} return res; };
  const _oldUpdate = window.updateUI;
  if(typeof _oldUpdate==='function') window.updateUI=function(){ const res=_oldUpdate.apply(this,arguments); try{ miEnsure(); }catch(e){} return res; };
  try{ miEnsure(); }catch(e){}
})();

/* v1.0.6 — movable Dev Tuner launcher. Standalone and Git/npm independent. */
(function enableMovableTuneLauncher(){
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function init(){
    const btn=document.getElementById('dt-launch');
    if(!btn || btn.dataset.dragReady==='1') return;
    btn.dataset.dragReady='1';

    try{
      const saved=JSON.parse(localStorage.getItem('ae_dt_launcher_pos')||'null');
      if(saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)){
        btn.style.left=saved.x+'px'; btn.style.top=saved.y+'px';
        btn.style.right='auto'; btn.style.bottom='auto';
      }
    }catch(e){}

    let active=false,moved=false,startX=0,startY=0,baseX=0,baseY=0,pid=null;
    btn.addEventListener('pointerdown',function(e){
      if(e.button!==undefined && e.button!==0) return;
      const r=btn.getBoundingClientRect();
      active=true; moved=false; pid=e.pointerId;
      startX=e.clientX; startY=e.clientY; baseX=r.left; baseY=r.top;
      btn.classList.add('dt-dragging');
      try{btn.setPointerCapture(pid);}catch(err){}
      e.preventDefault();
    });
    btn.addEventListener('pointermove',function(e){
      if(!active || e.pointerId!==pid) return;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if(Math.abs(dx)+Math.abs(dy)>4) moved=true;
      const x=clamp(baseX+dx,8,window.innerWidth-btn.offsetWidth-8);
      const y=clamp(baseY+dy,8,window.innerHeight-btn.offsetHeight-8);
      btn.style.left=x+'px'; btn.style.top=y+'px';
      btn.style.right='auto'; btn.style.bottom='auto';
    });
    function finish(e){
      if(!active || (e.pointerId!==undefined && e.pointerId!==pid)) return;
      active=false; btn.classList.remove('dt-dragging');
      const r=btn.getBoundingClientRect();
      try{localStorage.setItem('ae_dt_launcher_pos',JSON.stringify({x:Math.round(r.left),y:Math.round(r.top)}));}catch(err){}
      if(moved){
        btn.dataset.suppressClick='1';
        setTimeout(()=>{delete btn.dataset.suppressClick;},80);
      }
      try{btn.releasePointerCapture(pid);}catch(err){}
      pid=null;
    }
    btn.addEventListener('pointerup',finish);
    btn.addEventListener('pointercancel',finish);
    btn.addEventListener('click',function(e){
      if(btn.dataset.suppressClick==='1'){
        e.preventDefault(); e.stopImmediatePropagation();
      }
    },true);
    window.addEventListener('resize',function(){
      const r=btn.getBoundingClientRect();
      const x=clamp(r.left,8,window.innerWidth-btn.offsetWidth-8);
      const y=clamp(r.top,8,window.innerHeight-btn.offsetHeight-8);
      btn.style.left=x+'px'; btn.style.top=y+'px';
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
