/* CARGO_WINDOW_v01 — Cargo Network window on the sitewide skin (approved "Freight Desk" concept).
   Tabs: Lanes (landing) · Contracts · Freighters · Market · Conversions. Fixed-size frame
   (dataset.aeFixed → pinned by popup_stability, never dragged). All gameplay goes through
   AECargo (js/patches/cargo_engine_v01.js); this file only renders and forwards clicks.
   Replaces openCargoModal (sidebar Cargo, dashboard Cargo Route button) and openModal('cargo-route').
   Styling: css/cargo-window-v01.css. */
(function cargoWindowV01(){
  'use strict';
  if (window.AECargoWindow) return;
  const CLS = 'modal-cargo';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const jsq = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const M = v => '$' + (Math.round(v * 100) / 100).toFixed(2) + 'M';
  const M1 = v => '$' + (Math.round(v * 10) / 10).toFixed(1) + 'M';
  const P = v => Math.round(v * 100) + '%';
  const T = v => Math.round(v).toLocaleString();
  const S0 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
  const I = {
    box:S0 + '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/></svg>',
    lane:S0 + '<path d="M4 17c4-8 12-8 16-2"/><circle cx="4" cy="17" r="1.6"/><circle cx="20" cy="15" r="1.6"/></svg>',
    doc:S0 + '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>',
    plane:S0 + '<path d="M3 14l8-2.3V5.5a1 1 0 012 0v6.2l8 2.3v1.8l-8-1.8v3.2l2.3 1.4v1.4L12 19.4 8.7 20v-1.4L11 17.2V14l-8 1.8z"/></svg>',
    map:S0 + '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
    wrench:S0 + '<path d="M14.5 6.5a4 4 0 015 5l-8.2 8.2a2 2 0 01-2.8-2.8l8.2-8.2a4 4 0 01-2.2-2.2z"/><path d="M4 20l3-3"/></svg>',
    search:S0 + '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/></svg>',
    swap:S0 + '<path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
    warn:S0 + '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
    trend:S0 + '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
    check:S0 + '<path d="M5 12l4 4L19 7"/></svg>',
    clock:S0 + '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
    bolt:S0 + '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',
    scale:S0 + '<path d="M12 4v16M5 8h14M5 8l-3 6a3 3 0 006 0zM19 8l-3 6a3 3 0 006 0z"/></svg>',
    fuel:S0 + '<rect x="4" y="4" width="10" height="16" rx="2"/><path d="M14 9h2a2 2 0 012 2v5a1.5 1.5 0 003 0V9l-2-2M7 8h4"/></svg>',
    cal:S0 + '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    snow:S0 + '<path d="M12 3v18M4 7l16 10M4 17L20 7"/></svg>'
  };
  const ic = k => '<span class="cg-ic">' + I[k] + '</span>';
  const CC = { gen:'c-gen', exp:'c-exp', per:'c-per', pha:'c-pha', aut:'c-aut', hvy:'c-hvy', mail:'c-mail', dg:'c-dg' };
  const KIND = { fwd:['Forwarder','b-fwd'], chr:['Charter','b-chr'], int:['Integrator','b-int'], mail:['Mail','b-mail'] };
  const badge = k => '<span class="cg-badge ' + KIND[k][1] + '">' + KIND[k][0] + '</span>';
  const UI = { tab:'lanes', sel:0, q:'', filter:'all', form:null, cfilter:'all', mkFilter:'unserved', mkSel:0, chosen:{} };
  const A = () => window.AECargo;
  const st = () => (typeof STATE !== 'undefined' && STATE) ? STATE : null;

  function mixBar(m){ if (!m) return ''; return '<div class="cg-mix">' + Object.entries(m).filter(([, v]) => v > 0).map(([k, v]) => '<i class="' + CC[k] + '" style="width:' + Math.round(v * 100) + '%" title="' + esc(A().COMK[k].label) + ' ' + P(v) + '"></i>').join('') + '</div>'; }
  function mixLegend(m){ if (!m) return ''; return '<div class="cg-leg">' + Object.entries(m).filter(([, v]) => v > 0.02).sort((a, b) => b[1] - a[1]).map(([k, v]) => '<span><i class="' + CC[k] + '"></i>' + esc(A().COMK[k].label) + ' ' + P(v) + (A().certified(k) ? '' : ' <em>locked</em>') + '</span>').join('') + '</div>'; }
  function isWide(model){ const s = A().spec(model); return s && (s.type === 'long' || s.type === 'jumbo'); }

  /* ── header ───────────────────────────────────────────────── */
  function kpis(){ const L = A().lanes(); const c = A().C(); const last = c.last || {}; const tons = L.reduce((s, l) => s + (l.tons || 0), 0); const cap = L.reduce((s, l) => s + (l.cap || A().laneCapacity(l)), 0);
    const rev = L.reduce((s, l) => s + (l.rev || 0), 0); const y = tons ? rev * 1e6 / (tons * 1000) : 0; const net = (last.total != null) ? last.total : L.reduce((s, l) => s + (l.profit || 0), 0);
    return '<div class="cg-kpi"><div class="c teal"><div class="k">Tonnes / mo</div><div class="v">' + T(tons + (last.bellyT || 0)) + '</div></div><div class="c"><div class="k">Load factor</div><div class="v">' + (cap ? P(tons / cap) : '—') + '</div></div><div class="c orange"><div class="k">Yield</div><div class="v">$' + y.toFixed(2) + '<small>/kg</small></div></div><div class="c purple"><div class="k">Cargo net</div><div class="v">' + M1(net) + '<small>/mo</small></div></div></div>'; }
  function tabs(){ const c = A().C(); const n = { lanes:A().lanes().length, contracts:c.contracts.length, conversions:c.conversions.length };
    const t = (id, icon, label, pill) => '<button class="cg-tab' + (UI.tab === id ? ' on' : '') + '" onclick="AECargoWindow.tab(\'' + id + '\')">' + ic(icon) + label + (pill || '') + '</button>';
    return '<div class="cg-tabs">' + t('lanes', 'lane', 'Lanes', n.lanes ? '<b>' + n.lanes + '</b>' : '') + t('contracts', 'doc', 'Contracts', n.contracts ? '<span class="cg-pill ok">' + n.contracts + ' active</span>' : '') + t('freighters', 'plane', 'Freighters') + t('market', 'map', 'Market') + t('conversions', 'wrench', 'Conversions', n.conversions ? '<span class="cg-pill warn">' + n.conversions + '</span>' : '') + '</div>'; }
  function render(){
    return '<div class="modal-header"><div class="modal-title">' + ic('box') + 'CARGO NETWORK<span class="cg-sub">Lanes · contracts · freighters · market</span></div><button class="modal-close" onclick="closeModal()">×</button></div>' +
      '<div class="cg-top">' + tabs() + kpis() + '</div><div class="cg-body">' + ({ lanes:renderLanes, contracts:renderContracts, freighters:renderFreighters, market:renderMarket, conversions:renderConversions })[UI.tab]() + '</div>'; }

  /* ── Lanes tab ────────────────────────────────────────────── */
  function laneRows(){ const q = UI.q.toLowerCase(); return A().lanes().map((l, i) => ({ l, i })).filter(({ l }) => {
    if (q && !(l.from + ' ' + l.to + ' ' + l.plane).toLowerCase().includes(q)) return false;
    if (UI.filter === 'wide') return isWide(l.plane); if (UI.filter === 'narrow') return !isWide(l.plane); if (UI.filter === 'contract') return A().reservedOn(l.from, l.to) > 0; return true; }); }
  function renderLanes(){ const rows = laneRows(); const L = A().lanes(); if (UI.sel >= L.length) UI.sel = Math.max(0, L.length - 1);
    const chip = (id, label) => '<button class="cg-chip' + (UI.filter === id ? ' on' : '') + '" onclick="AECargoWindow.filter(\'' + id + '\')">' + label + '</button>';
    const table = !L.length ? '<div class="cg-empty">' + ic('lane') + '<b>No cargo lanes yet.</b><span>Open a lane from one of your hubs, or start from the Market tab to see where freight is waiting.</span><button class="cg-btn pri" onclick="AECargoWindow.openForm()">+ Open lane</button></div>' :
      '<table class="cg-tbl"><tr><th>Lane</th><th>Aircraft</th><th class="r">Flt/wk</th><th class="r">Tonnes</th><th>Load</th><th class="r">Yield</th><th class="r">On-time</th><th class="r">Net / mo</th><th style="width:64px">Mix</th></tr>' +
      rows.map(({ l, i }) => { const cap = l.cap || A().laneCapacity(l); const lf = l.lf != null ? l.lf : 0; const fresh = l.tons == null;
        return '<tr class="' + (i === UI.sel && !UI.form ? 'on' : '') + '" onclick="AECargoWindow.pick(' + i + ')"><td><b class="nw">' + esc(l.from) + ' → ' + esc(l.to) + '</b><div class="cg-dim">' + (fresh ? 'first month pending' : Math.round((l.tons || 0) / Math.max(1, l.flights * 4.33 * 2)) + ' t / flight') + (l.hubOver ? ' · <span class="warn">hub over capacity</span>' : '') + '</div></td><td>' + esc(l.plane) + (A().isFreighter(l.plane) ? '' : '<div class="cg-dim">passenger jet</div>') + '</td><td class="r mono">' + l.flights + '</td><td class="r mono">' + (fresh ? '—' : T(l.tons)) + '</td><td><div class="cg-lf"><div class="cg-bar"><i style="width:' + P(lf) + '"></i></div><span class="mono">' + (fresh ? '—' : P(lf)) + '</span></div></td><td class="r mono"><b class="o">' + (fresh ? '—' : '$' + (l.yield || 0).toFixed(2)) + '</b></td><td class="r mono">' + (fresh ? '—' : P(l.otp || 0.95)) + '</td><td class="r mono"><b class="' + ((l.profit || 0) >= 0 ? 't' : 'bad') + '">' + (fresh ? '—' : M(l.profit || 0)) + '</b></td><td>' + mixBar(l.mix) + '</td></tr>'; }).join('') + '</table>' + (rows.length ? '' : '<div class="cg-dim" style="padding:10px">No lanes match.</div>');
    return '<div class="cg-main"><div class="cg-panel cg-lanes"><div class="cg-hd">' + ic('search') + '<input id="cg-q" placeholder="Search lanes, cities, aircraft…" value="' + esc(UI.q) + '" oninput="AECargoWindow.search(this.value)">' + chip('all', 'All') + chip('wide', 'Widebody') + chip('narrow', 'Narrowbody') + chip('contract', 'Under contract') + '<button class="cg-btn pri sm" onclick="AECargoWindow.openForm()">+ Open lane</button></div><div class="cg-scroll">' + table + '</div></div>' +
      '<div class="cg-panel cg-side">' + (UI.form ? renderForm() : renderDetail()) + '</div></div>'; }
  function renderDetail(){ const L = A().lanes(); const l = L[UI.sel]; if (!l) return '<div class="cg-empty small">' + ic('box') + '<b>Select a lane</b><span>or open a new one to see its economics here.</span></div>';
    const h = A().hero(l.plane); const id = A().ident(l.plane); const cap = l.cap || A().laneCapacity(l); const fresh = l.tons == null; const res = A().reservedOn(l.from, l.to); const d = A().demand(l.from, l.to);
    const choices = A().laneAircraftChoices().filter(c => c.range >= d.dist);
    return '<div class="cg-hero">' + (h ? '<img src="' + esc(h) + '" alt="">' : '') + '<div class="nm"><h2>' + esc(l.from) + ' → ' + esc(l.to) + '</h2><small>' + esc(id.name) + ' · ' + esc(l.plane) + ' · ' + l.flights + ' flights / week</small></div></div>' +
      '<div class="cg-rows"><div class="row"><span>Capacity</span><b>' + A().payload(l.plane) + ' t / flight · ' + T(cap) + ' t / mo</b></div>' +
      '<div class="row"><span>Demand on corridor</span><b>' + T(d.sellable) + ' t / mo</b></div>' +
      '<div class="row"><span>Carried</span><b>' + (fresh ? 'first month pending' : T(l.tons) + ' t / mo (' + P(l.lf) + ')') + '</b></div>' +
      (res ? '<div class="row"><span>Under contract</span><b class="p">' + T(res) + ' t / mo</b></div>' : '') +
      '<div class="row"><span>Yield</span><b class="o">$' + (fresh ? d.yield : l.yield).toFixed(2) + ' / kg</b></div>' +
      '<div class="row"><span>Revenue</span><b>' + (fresh ? '—' : M(l.rev)) + '</b></div><div class="row"><span>Fuel · crew · handling</span><b>' + (fresh ? '—' : '−' + M(l.cost)) + '</b></div><div class="row"><span>Net</span><b class="' + ((l.profit || 0) >= 0 ? 't' : 'bad') + '">' + (fresh ? '—' : M(l.profit) + ' / mo') + '</b></div></div>' +
      '<div class="cg-k">Commodity mix</div>' + mixBar(l.mix || d.mix) + mixLegend(l.mix || d.mix) +
      '<div class="cg-k">Signals</div><div class="cg-sig">' + (l.hubOver ? ic('warn') + ' A hub on this lane is over its freight throughput — upgrade its Cargo Hub.<br>' : '') + ((l.lf || 0) > 0.9 ? ic('warn') + ' Lane is near capacity — add a frequency or a larger freighter.' : ic('trend') + ' Spare capacity: ' + T(Math.max(0, cap - (l.tons || 0))) + ' t / mo. Unsold demand: ' + T(l.unsold != null ? l.unsold : Math.max(0, d.sellable - cap)) + ' t.') + '</div>' +
      '<div class="cg-acts"><button class="cg-btn pri sm" onclick="AECargoWindow.freq(' + UI.sel + ',1)">+ Frequency</button><button class="cg-btn sm" onclick="AECargoWindow.freq(' + UI.sel + ',-1)">− Frequency</button>' +
      '<select class="cg-sel sm" onchange="AECargoWindow.swap(' + UI.sel + ',this.value)"><option value="">' + I.swap.replace(/<[^>]+>/g, '') + 'Swap aircraft…</option>' + choices.map(c => '<option value="' + esc(c.model) + '">' + esc(c.model) + ' · ' + c.payload + ' t · ' + c.free + ' free</option>').join('') + '</select>' +
      '<button class="cg-btn sm" onclick="AECargoWindow.tab(\'contracts\')">' + ic('doc') + 'Contracts</button><button class="cg-btn sm danger" onclick="tapConfirm(this,()=>AECargoWindow.close(' + UI.sel + '),\'Close lane?\')">Close</button></div>'; }
  function renderForm(){ const S = st(); const f = UI.form; const hubs = S.hubs || []; if (!f.from) f.from = hubs[0] || '';
    const dests = Object.keys(CITIES).filter(c => c !== f.from && (CITIES[c].econ || 0) >= 40).map(c => ({ c, d:A().demand(f.from, c) })).sort((a, b) => b.d.sellable - a.d.sellable).slice(0, 80);
    if (!f.to || !dests.some(x => x.c === f.to)) f.to = dests[0] ? dests[0].c : '';
    const choices = A().laneAircraftChoices(); if (!f.plane || !choices.some(c => c.model === f.plane)) f.plane = choices[0] ? choices[0].model : '';
    const e = f.plane ? A().estimate(f.from, f.to, f.plane, f.flights) : null;
    return '<div class="cg-formhd"><h2>Open cargo lane</h2><button class="cg-btn sm" onclick="AECargoWindow.closeForm()">Cancel</button></div>' +
      '<label class="cg-lbl">From (hub)</label><select class="cg-sel" onchange="AECargoWindow.form(\'from\',this.value)">' + hubs.map(h => '<option' + (h === f.from ? ' selected' : '') + '>' + esc(h) + '</option>').join('') + '</select>' +
      '<label class="cg-lbl">To — sorted by freight demand</label><select class="cg-sel" onchange="AECargoWindow.form(\'to\',this.value)">' + dests.map(x => '<option value="' + esc(x.c) + '"' + (x.c === f.to ? ' selected' : '') + '>' + esc(x.c) + ' — ' + T(x.d.sellable) + ' t · $' + x.d.yield.toFixed(2) + '/kg</option>').join('') + '</select>' +
      '<label class="cg-lbl">Aircraft</label>' + (choices.length ? '<select class="cg-sel" onchange="AECargoWindow.form(\'plane\',this.value)">' + choices.map(c => '<option value="' + esc(c.model) + '"' + (c.model === f.plane ? ' selected' : '') + '>' + esc(c.model) + ' · ' + c.payload + ' t · ' + c.free + ' free' + (c.freighter ? '' : ' · passenger jet') + '</option>').join('') + '</select>' : '<div class="cg-warnbox">' + ic('warn') + ' No free aircraft. <a onclick="AECargoWindow.tab(\'freighters\')">Buy a freighter</a> or free up a jet.</div>') +
      '<label class="cg-lbl">Flights per week <b>' + f.flights + '</b></label><input type="range" min="1" max="14" value="' + f.flights + '" oninput="AECargoWindow.form(\'flights\',+this.value)">' +
      (e ? '<div class="cg-rows est">' + (!e.inRange ? '<div class="cg-warnbox">' + ic('warn') + ' Out of range — ' + T(e.dist) + ' mi.</div>' : '') + '<div class="row"><span>Capacity</span><b>' + T(e.cap) + ' t / mo</b></div><div class="row"><span>Demand</span><b>' + T(e.demand) + ' t / mo</b></div><div class="row"><span>Expected load</span><b>' + P(e.lf) + '</b></div><div class="row"><span>Yield</span><b class="o">$' + e.yield.toFixed(2) + ' / kg</b></div><div class="row"><span>Revenue</span><b>' + M(e.rev) + '</b></div><div class="row"><span>Costs</span><b>−' + M(e.cost) + '</b></div><div class="row"><span>Est. net</span><b class="' + (e.net >= 0 ? 't' : 'bad') + '">' + M(e.net) + ' / mo</b></div><div class="row"><span>Set-up</span><b>$' + e.setup + 'M</b></div></div>' + mixBar(e.mix) + mixLegend(e.mix) + (e.needs.length ? '<div class="cg-dim">' + ic('snow') + ' Locked types on this corridor need Tech Board certification.</div>' : '') : '') +
      '<div class="cg-acts"><button class="cg-btn pri" style="flex:1" ' + (e && e.inRange ? '' : 'disabled') + ' onclick="AECargoWindow.submit()">' + ic('lane') + 'Open lane' + (e ? ' · $' + e.setup + 'M' : '') + '</button></div>'; }

  /* ── Contracts tab ────────────────────────────────────────── */
  function renderContracts(){ const c = A().C(); const offers = c.offers.filter(o => UI.cfilter === 'all' || (UI.cfilter === 'can' ? A().offerCheck(o).ok : o.kind === UI.cfilter));
    const chip = (id, label) => '<button class="cg-chip' + (UI.cfilter === id ? ' on' : '') + '" onclick="AECargoWindow.cfilter(\'' + id + '\')">' + label + '</button>';
    const income = c.contracts.filter(k => k.kind !== 'chr').reduce((s, k) => s + k.tons * k.rate / 1000, 0);
    const left = '<div class="cg-k">Active contracts · ' + c.contracts.length + '</div>' + (c.contracts.length ? c.contracts.map(k => { const l = A().laneFor(k.from, k.to); const done = k.kind === 'chr' ? 0 : Math.min(1, (k.lastDel || 0) / k.tons);
        return '<div class="cg-card">' + badge(k.kind) + '<div class="t">' + esc(k.title) + '</div><div class="m"><span>' + esc(k.who) + '</span><span class="o">$' + k.rate.toFixed(2) + '/kg</span></div>' + (k.kind === 'chr' ? '<div class="m"><span>' + k.tons + ' t · flies at month end</span><span>' + M(k.tons * k.rate / 1000) + '</span></div>' : '<div class="cg-bar"><i style="width:' + P(done) + '"></i></div><div class="m"><span>' + (k.lastDel != null ? k.lastDel + ' / ' + k.tons + ' t last month' : k.tons + ' t / mo reserved') + '</span><span>' + k.left + ' mo left</span></div>' + (!l ? '<div class="m warn">' + ic('warn') + ' No lane — will miss lift</div>' : k.lastPen ? '<div class="m warn">Penalty last month ' + M(k.lastPen) + '</div>' : '')) +
          '<div class="m"><span>Earned ' + M(k.earned || 0) + '</span><a onclick="tapConfirm(this,()=>AECargoWindow.cancel(\'' + esc(k.id) + '\'),\'Cancel · break fee ' + M(k.pen * 2) + '?\')">Cancel</a></div></div>'; }).join('') : '<div class="cg-dim">No contracts yet — accept an offer from the board.</div>') +
      '<div class="cg-card dashed" style="margin-top:auto"><div class="cg-k">Contract income</div><div class="big t">' + M1(income) + '<small> / mo</small></div><div class="cg-dim">' + (c.contracts.length ? 'Fixed-rate tonnage — insulated from spot swings.' : 'Contracts pay a fixed rate for the term, whatever the spot market does.') + '</div></div>';
    const board = offers.length ? offers.map(o => { const chk = A().offerCheck(o); const worth = o.tons * o.rate / 1000; const hot = o.rate >= A().COMK[o.k].rate * 1.3;
        return '<div class="cg-off' + (hot ? ' hot' : '') + '"><div class="h">' + badge(o.kind) + (hot ? '<span class="cg-badge b-hot">High yield</span>' : '') + '<span class="who">' + esc(o.who) + '</span></div><h3>' + esc(o.title) + '</h3>' +
          '<div class="st"><div><div class="cg-k">Volume</div><div class="v">' + o.tons + ' t<small>' + (o.kind === 'chr' ? '' : '/mo') + '</small></div></div><div><div class="cg-k">Term</div><div class="v">' + (o.kind === 'chr' ? 'One-off' : o.term + ' mo') + '</div></div><div><div class="cg-k">Rate</div><div class="v o">$' + o.rate.toFixed(2) + '<small>/kg</small></div></div><div><div class="cg-k">Penalty</div><div class="v bad">' + M1(o.pen) + '</div></div></div>' +
          '<div class="req"><i class="' + CC[o.k] + '"></i>' + esc(A().COMK[o.k].label) + ' · ' + esc(o.note || '') + '</div>' +
          '<div class="ft"><span class="rev">Worth <b>' + M(worth) + '</b>' + (o.kind === 'chr' ? '' : ' / mo') + '</span><span class="cg-pill ' + (chk.ok ? 'ok' : 'bad') + '">' + (chk.ok ? ic('check') + 'Can fulfil' : ic('warn') + esc(chk.why)) + '</span><span class="cg-pill warn">' + ic('clock') + o.expires + ' mo</span>' + (chk.needLane ? '<button class="cg-btn sm" onclick="AECargoWindow.openForm(\'' + jsq(o.from) + '\',\'' + jsq(o.to) + '\')">Open lane</button>' : '') + '<button class="cg-btn sm' + (chk.ok ? ' pri' : '') + '"' + (chk.ok ? '' : ' disabled') + ' onclick="AECargoWindow.accept(\'' + esc(o.id) + '\')">Accept</button></div></div>'; }).join('') : '<div class="cg-dim" style="padding:12px">No offers match. The board refreshes every month.</div>';
    return '<div class="cg-main contracts"><div class="cg-panel cg-side">' + left + '</div><div class="cg-panel cg-boardwrap"><div class="cg-hd"><span class="cg-dim">Board refreshes each month · ' + c.offers.length + ' offers</span><span style="margin-left:auto"></span>' + chip('all', 'All') + chip('fwd', 'Forwarder') + chip('chr', 'Charter') + chip('int', 'Integrator') + chip('mail', 'Mail') + chip('can', 'Can fulfil') + '</div><div class="cg-scroll"><div class="cg-board">' + board + '</div></div></div></div>'; }

  /* ── Freighters tab ───────────────────────────────────────── */
  function renderFreighters(){ const S = st(); const list = A().fleetList(); const fx = A().techFx(); const yr = S.year || 2024;
    const cards = list.map(a => { const fut = a.era > yr + 3; const q = UI.chosen[a.model] || 1;
      return '<div class="cg-ac"><div class="cg-thumb">' + (a.hero ? '<img src="' + esc(a.hero) + '" alt="">' : '') + '</div><div><h3>' + esc(a.ident.name) + '<small>' + esc(a.model) + '</small><span class="cg-tag">' + esc(a.ident.id) + '</span>' + (a.owned ? '<span class="cg-tag own">' + a.owned + ' owned · ' + (a.owned - a.assigned) + ' free</span>' : '') + (a.convOnly ? '<span class="cg-tag gold">Conversion</span>' : '') + (fut ? '<span class="cg-tag gold">From ' + a.era + '</span>' : '') + '</h3>' +
        '<div class="spec">' + ic('scale') + a.payload + ' t<span class="s">|</span>' + ic('lane') + T(a.range) + ' mi<span class="s">|</span>' + ic('cal') + a.era + '</div><div class="cg-bar" style="margin:4px 0 6px"><i style="width:' + Math.round(a.payload / 137 * 100) + '%"></i></div>' +
        '<div class="act"><div class="price">$' + a.cost + 'M</div>' + (a.convOnly ? '<button class="cg-btn sm" onclick="AECargoWindow.tab(\'conversions\')">' + ic('wrench') + 'Convert</button>' : (fut ? '' : '<button class="cg-btn sm pri" onclick="AECargoWindow.buy(\'' + jsq(a.model) + '\',1)">Buy ×1</button><button class="cg-btn sm" onclick="AECargoWindow.buy(\'' + jsq(a.model) + '\',3)">×3 <span class="q">−7%</span></button>')) + (a.owned ? '<button class="cg-btn sm" onclick="tapConfirm(this,()=>AECargoWindow.sell(\'' + jsq(a.model) + '\'),\'Sell 1 for $' + Math.round(a.cost * 0.55) + 'M?\')">Sell 1</button>' : '') + '</div></div></div>'; }).join('');
    const c = A().C(); const bellyT = (c.last && c.last.bellyT) || 0; const belly = (c.last && c.last.belly) || 0;
    const mainDeck = list.reduce((s, a) => s + a.owned * a.payload * 4.33 * 5 * 2 * 0.9, 0);
    const side = '<div class="cg-kpi col"><div class="c teal"><div class="k">Freighters</div><div class="v">' + A().freighterCount() + '</div></div><div class="c"><div class="k">Main-deck capacity</div><div class="v">' + T(mainDeck) + '<small> t/mo at 5/wk</small></div></div><div class="c purple"><div class="k">Belly freight</div><div class="v">' + T(bellyT) + '<small> t/mo · ' + M(belly) + '</small></div></div><div class="c orange"><div class="k">In conversion</div><div class="v">' + c.conversions.length + '</div></div></div>' +
      '<div class="cg-card dashed"><b>Belly cargo</b><div class="cg-dim">Every passenger route now carries freight in its hold — ' + Object.entries(A().CAT.belly).filter(([, v]) => v).map(([k, v]) => k + ' ' + v + ' t').join(', ') + ' per flight, sold at 85 % of lane yield. Cargo Hub buildings raise how much freight each hub can move (' + A().CAT.hubTonnes.join(' / ') + ' t/mo by level).</div></div>' +
      '<div class="cg-card dashed"><b>Certifications</b><div class="cg-cert">' + ['cold','dg','heavy','night'].map(n => '<span class="cg-pill ' + (fx.certs[n] ? 'ok' : '') + '">' + (fx.certs[n] ? ic('check') : '') + esc(A().certName(n)) + '</span>').join('') + '</div><div class="cg-dim">Earned on the Tech Board — Cargo &amp; Freight track.</div></div>';
    return '<div class="cg-main freighters"><div class="cg-scroll"><div class="cg-cards">' + cards + '</div></div><div class="cg-panel cg-side">' + side + '</div></div>'; }

  /* ── Market tab ───────────────────────────────────────────── */
  function renderMarket(){ const S = st(); const c = A().C(); let rows = A().market(60); if (UI.mkFilter === 'unserved') rows = rows.filter(r => !r.lane); if (UI.mkFilter === 'range') { const maxR = Math.max(0, ...A().fleetList().filter(a => a.owned).map(a => a.range), ...Object.values(S.planes || {}).map(p => p.range || 0)); rows = rows.filter(r => r.dist <= maxR); }
    if (!S.hubs || !S.hubs.length) return '<div class="cg-empty">' + ic('map') + '<b>No hubs yet.</b><span>The freight market lists corridors out of your hubs.</span></div>';
    if (UI.mkSel >= rows.length) UI.mkSel = 0; const mx = Math.max(1, ...rows.map(r => r.sellable));
    const chip = (id, label) => '<button class="cg-chip' + (UI.mkFilter === id ? ' on' : '') + '" onclick="AECargoWindow.mkFilter(\'' + id + '\')">' + label + '</button>';
    const ev = c.events.length ? '<div class="cg-ev">' + c.events.map(e => '<div class="e">' + ic('bolt') + '<div><b>' + esc(e.name) + '</b>' + esc(e.text) + ' · ' + e.left + ' mo left</div></div>').join('') + '</div>' : '<div class="cg-ev"><div class="e quiet">' + ic('bolt') + '<div><b>Freight market quiet</b>No events this month. Strikes, harvests and e-commerce peaks push demand around the map.</div></div></div>';
    const table = '<table class="cg-tbl"><tr><th>Corridor</th><th style="width:30%">Demand · served / unserved</th><th class="r">Unserved</th><th class="r">Yield</th><th style="width:90px">Mix</th></tr>' + rows.map((m, i) => '<tr class="' + (i === UI.mkSel ? 'on' : '') + '" onclick="AECargoWindow.mkPick(' + i + ')"><td><b class="nw">' + esc(m.from) + ' → ' + esc(m.to) + '</b>' + (m.hot ? ' <span class="cg-badge b-hot">Hot</span>' : '') + (m.lane ? ' <span class="cg-badge b-fwd">Your lane</span>' : '') + '</td><td><div class="cg-dem"><div class="cg-bar tall"><i style="width:' + Math.round(m.served / mx * 100) + '%"></i><em style="left:' + Math.round(m.served / mx * 100) + '%;width:' + Math.round(m.unserved / mx * 100) + '%"></em></div><span class="mono">' + T(m.sellable) + ' t</span></div></td><td class="r mono"><b class="o">' + T(m.unserved) + ' t</b></td><td class="r mono">$' + m.yield.toFixed(2) + '</td><td>' + mixBar(m.mix) + '</td></tr>').join('') + '</table>';
    const m = rows[UI.mkSel]; let side = '<div class="cg-empty small">' + ic('map') + '<b>No corridors</b><span>Try another filter.</span></div>';
    if (m) { const p = A().plan(m.from, m.to);
      side = '<h2>' + esc(m.from) + ' → ' + esc(m.to) + '</h2><div class="cg-dim">' + T(m.unserved) + ' t / mo going by sea, truck or a rival. Yield $' + m.yield.toFixed(2) + '/kg · ' + T(m.dist) + ' mi.</div>' +
        (p ? '<div class="cg-k">Launch plan</div><div class="cg-sug"><div class="cg-thumb sm">' + (A().hero(p.model) ? '<img src="' + esc(A().hero(p.model)) + '" alt="">' : '') + '</div><div><b>' + esc(A().ident(p.model).name) + '</b> <span class="cg-dim">' + esc(p.model) + '</span><small>' + A().payload(p.model) + ' t payload · ' + (p.owned > 0 ? p.owned + ' free in fleet' : 'not owned — $' + p.cost + 'M') + '</small></div></div>' +
        '<div class="cg-rows"><div class="row"><span>Frequency</span><b>' + p.fpw + ' / week</b></div><div class="row"><span>Tonnes captured</span><b>' + T(p.cap) + ' t / mo</b></div><div class="row"><span>Revenue</span><b>' + M(p.rev) + ' / mo</b></div><div class="row"><span>Est. net</span><b class="' + (p.net >= 0 ? 't' : 'bad') + '">' + M(p.net) + ' / mo</b></div><div class="row"><span>Set-up</span><b>$' + p.setup + 'M</b></div></div>' : '<div class="cg-warnbox">' + ic('warn') + ' No freighter in range of this corridor.</div>') +
        '<div class="cg-k">Commodities</div>' + mixBar(m.mix) + mixLegend(m.mix) +
        '<div class="cg-acts" style="margin-top:auto">' + (m.lane ? '<button class="cg-btn pri" style="flex:1" onclick="AECargoWindow.gotoLane(\'' + jsq(m.from) + '\',\'' + jsq(m.to) + '\')">' + ic('lane') + 'View lane</button>' : '<button class="cg-btn pri" style="flex:1" onclick="AECargoWindow.openForm(\'' + jsq(m.from) + '\',\'' + jsq(m.to) + '\')">' + ic('lane') + 'Open lane</button>') + (p && p.owned <= 0 ? '<button class="cg-btn" onclick="AECargoWindow.tab(\'freighters\')">Buy freighter</button>' : '') + '</div>'; }
    return ev + '<div class="cg-main market"><div class="cg-panel cg-lanes"><div class="cg-hd">' + chip('unserved', 'Unserved') + chip('all', 'All corridors') + chip('range', 'In range') + '<span class="cg-dim" style="margin-left:auto">Sorted by unserved tonnes</span></div><div class="cg-scroll">' + table + '</div></div><div class="cg-panel cg-side">' + side + '</div></div>'; }

  /* ── Conversions tab ──────────────────────────────────────── */
  function renderConversions(){ const S = st(); const c = A().C(); const fx = A().techFx();
    const run = c.conversions.length ? c.conversions.map(cv => '<div class="cg-card run">' + ic('wrench') + '<b>' + esc(cv.from) + ' → ' + esc(cv.to) + '</b><div class="cg-bar" style="margin:6px 0 3px"><i style="width:' + P((cv.total - cv.left) / cv.total) + '"></i></div><div class="m"><span>Out of service</span><span>' + cv.left + ' of ' + cv.total + ' months left</span></div></div>').join('') : '<div class="cg-dim">Nothing in the shop.</div>';
    const progs = A().CAT.conversions.map(p => { const pl = S.planes[p.from]; const free = pl ? (pl.owned || 0) - (pl.assigned || 0) : 0; const to = A().FR[p.to];
      return '<div class="cg-ac conv"><div class="cg-thumb">' + (A().hero(p.to) ? '<img src="' + esc(A().hero(p.to)) + '" alt="">' : '') + '</div><div><h3>' + esc(p.from) + ' <span class="cg-dim">→</span> ' + esc(A().ident(p.to).name) + '<small>' + esc(p.to) + '</small></h3><div class="spec">' + ic('scale') + to.payload + ' t<span class="s">|</span>' + ic('lane') + T(to.range) + ' mi<span class="s">|</span>' + ic('clock') + A().convMonths(p) + ' mo downtime</div><div class="cg-dim">' + (free ? free + ' eligible ' + esc(p.from) + (free > 1 ? 's' : '') + ' in your fleet (owned, not on a route)' : 'No free ' + esc(p.from) + ' in your fleet') + '</div><div class="act"><div class="price">$' + A().convFee(p) + 'M</div><button class="cg-btn sm pri"' + (free ? '' : ' disabled') + ' onclick="AECargoWindow.convert(\'' + jsq(p.from) + '\')">' + ic('wrench') + 'Send one</button></div></div></div>'; }).join('');
    return '<div class="cg-main conversions"><div class="cg-scroll"><div class="cg-k" style="padding:2px 4px 8px">Conversion programmes' + (fx.convFee < 1 ? ' · <span class="t">in-house line: −' + Math.round((1 - fx.convFee) * 100) + '% fee</span>' : '') + '</div><div class="cg-cards">' + progs + '</div><div class="cg-dim" style="padding:10px 4px">A converted jet leaves the passenger fleet the day it is sent, returns to the freighter fleet when the work is done, and keeps its age. Converted freighters cost about 8 % more to maintain than factory-built ones.</div></div><div class="cg-panel cg-side"><div class="cg-k">In conversion · ' + c.conversions.length + '</div>' + run + '</div></div>'; }

  /* ── frame ────────────────────────────────────────────────── */
  function open(tab){ if (tab) UI.tab = tab; UI.form = null; const ov = document.getElementById('modal-overlay'), c = document.getElementById('modal-content'); if (!ov || !c || !A()) return;
    try { if (typeof closeModal === 'function') closeModal(); } catch (e) {}
    ov.classList.add('open'); c.classList.add('modal-wide', CLS); c.innerHTML = render(); size(); }
  function size(){ const c = document.getElementById('modal-content'); if (!c) return; c.style.removeProperty('transform');
    c.style.setProperty('width', 'min(1100px, 96vw)', 'important'); c.style.setProperty('max-width', 'min(1100px, 96vw)', 'important');
    c.style.setProperty('height', 'min(740px, 92vh)', 'important'); c.style.setProperty('max-height', 'min(740px, 92vh)', 'important'); c.dataset.aeFixed = '1'; c._cgSized = true; }
  function unsize(){ const c = document.getElementById('modal-content'); if (!c || !c._cgSized) return; ['width','max-width','height','max-height'].forEach(p => c.style.removeProperty(p)); delete c.dataset.aeFixed; c._cgSized = false; c.classList.remove(CLS); }
  function rerender(){ const c = document.getElementById('modal-content'); if (!c || !c.classList.contains(CLS)) return; const sc = c.querySelector('.cg-scroll'); const top = sc ? sc.scrollTop : 0; c.innerHTML = render(); const sc2 = c.querySelector('.cg-scroll'); if (sc2) sc2.scrollTop = top; try { updateUI(); } catch (e) {} }
  function isOpen(){ const c = document.getElementById('modal-content'); return !!(c && c.classList.contains(CLS)); }

  function install(){
    if (typeof openModal !== 'function' || typeof closeModal !== 'function' || !window.AECargo) { setTimeout(install, 200); return; }
    const oc = window.closeModal; if (!oc.__aeCG) { const w = function(){ const r = oc.apply(this, arguments); unsize(); return r; }; w.__aeCG = true; window.closeModal = w; }
    const oo = window.openModal; if (!oo.__aeCG) { const w = function(type){ unsize(); if (type === 'cargo-route' || type === 'cargo') { open('lanes'); return; } return oo.apply(this, arguments); }; w.__aeCG = true; window.openModal = w; }
    window.openCargoModal = function(){ open('lanes'); };
    // Dashboard: a "Cargo" tile in the live strip above the map (tonnes moved, net, lanes, contracts).
    const od = window._mockDashSync; if (typeof od === 'function' && !od.__aeCG) { const w = function(){ const r = od.apply(this, arguments);
      try { const strip = document.getElementById('mock-livetiles'); if (strip) { let t = document.getElementById('mlt-cargo-tile');
        if (!t) { t = document.createElement('div'); t.className = 'mlt'; t.id = 'mlt-cargo-tile'; t.innerHTML = '<div class="mlt-l">Cargo</div><div class="mlt-v" id="mlt-cargo">\u2014</div><div class="mlt-s" id="mlt-cargo-s"></div>'; t.onclick = () => open('lanes'); strip.appendChild(t); }
        const c = A().C(); const l = c.last || {}; const L = A().lanes(); const tons = (l.tons || 0) + (l.bellyT || 0);
        document.getElementById('mlt-cargo').textContent = tons ? T(tons) + ' t' : (L.length ? 'pending' : '\u2014');
        document.getElementById('mlt-cargo-s').textContent = l.total != null ? M1(l.total) + ' net/mo \u00b7 ' + L.length + (L.length === 1 ? ' lane' : ' lanes') + (c.contracts.length ? ' \u00b7 ' + c.contracts.length + ' contracts' : '') : (L.length ? 'first month pending' : 'no lanes yet'); } } catch (e) {}
      return r; }; w.__aeCG = true; window._mockDashSync = w; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();

  window.AECargoWindow = { open, rerender, isOpen, version:'v01',
    tab(t){ UI.tab = t; UI.form = null; rerender(); },
    pick(i){ UI.sel = i; UI.form = null; rerender(); },
    search(q){ UI.q = q; rerender(); const i = document.getElementById('cg-q'); if (i) { i.focus(); const n = i.value.length; try { i.setSelectionRange(n, n); } catch (e) {} } },
    filter(f){ UI.filter = f; rerender(); },
    cfilter(f){ UI.cfilter = f; rerender(); },
    mkFilter(f){ UI.mkFilter = f; UI.mkSel = 0; rerender(); },
    mkPick(i){ UI.mkSel = i; rerender(); },
    openForm(from, to){ UI.tab = 'lanes'; UI.form = { from: from || null, to: to || null, plane: null, flights: 3 }; rerender(); },
    closeForm(){ UI.form = null; rerender(); },
    form(k, v){ if (!UI.form) return; UI.form[k] = v; if (k === 'from') UI.form.to = null; rerender(); },
    submit(){ const f = UI.form; if (!f) return; if (A().openLane(f.from, f.to, f.plane, f.flights)) { UI.form = null; UI.sel = A().lanes().length - 1; } rerender(); },
    freq(i, d){ const l = A().lanes()[i]; if (!l) return; A().setFlights(i, (l.flights || 1) + d); rerender(); },
    swap(i, model){ if (!model) return; A().swapPlane(i, model); rerender(); },
    close(i){ A().closeLane(i); UI.sel = 0; rerender(); },
    gotoLane(from, to){ const i = A().lanes().findIndex(l => (l.from === from && l.to === to) || (l.from === to && l.to === from)); UI.tab = 'lanes'; UI.form = null; if (i >= 0) UI.sel = i; rerender(); },
    accept(id){ A().accept(id); rerender(); },
    cancel(id){ A().cancel(id); rerender(); },
    buy(model, q){ A().buy(model, q); rerender(); },
    sell(model){ A().sell(model); rerender(); },
    convert(from){ A().convert(from); rerender(); }
  };
})();
