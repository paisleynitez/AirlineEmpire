/* BUY_AIRCRAFT_v04 — sidebar Buy Aircraft window rebuilt to the approved "Hangar Browser" concept
   (prototypes/buy-aircraft/buy-c-hangar-browser.html): a compact list of every purchasable type on
   the left, grouped by range band, and one spec sheet on the right — hero art with the name on it,
   four stat bars, role & route fit, and an order panel (quantity stepper, bulk-discount ladder,
   total, cash after, Sell 1). A YOUR FLEET switch shows the owned types in the same frame.
   Replaces buildBuyPlanes() output only; buying/selling go through the native buyPlaneQty /
   sellPlane / bulkPlaneDiscount, the aircraft roster, identities, range bands and hero manifest
   are read from the game, and the Identity Guide button is the native one. Fixed-size frame
   (dataset.aeFixed) — popup_stability pins it; list and sheet scroll inside.
   Styling: css/buy-aircraft-v04.css (.ae-bp-v4). Supersedes buy_aircraft_v03 (unwired). */
(function buyAircraftV04(){
  'use strict';
  if (window.AEBuyAircraftV04) return;
  window.AEBuyAircraftV04 = true;
  const CLS = 'ae-bp-v4';
  const S = { sel: null, qty: 1, view: 'buy', open: {} };
  const I = {
    plane:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14l8-2.3V5.5a1 1 0 012 0v6.2l8 2.3v1.8l-8-1.8v3.2l2.3 1.4v1.4L12 19.4 8.7 20v-1.4L11 17.2V14l-8 1.8z"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>'
  };
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const jsq = v => String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const money = n => '$' + Math.round(n).toLocaleString() + 'M';
  function st(){ return (typeof STATE !== 'undefined' && STATE) ? STATE : null; }
  function hero(model){ const m = window.AEAircraftImageManifest; const e = m && m.byModel && m.byModel[model]; return e ? e.path : null; }
  function ident(model){ try { return acIdentity(model); } catch (e) { return { id: model, name: model, theme: '', role: '', color1: '#123', color2: '#012', accent: '#52d8ff', icon: '✈' }; } }
  function listed(){ return Object.entries(AIRCRAFT).filter(([, a]) => { try { return acListed(a); } catch (e) { return !a.vintage; } }); }
  function bands(){ const all = listed(); return BP_RANGE_BANDS.map(b => ({ b, planes: all.filter(([, a]) => bpRangeBand(a.range) === b.id).sort((x, y) => x[1].cost - y[1].cost) })).filter(x => x.planes.length); }
  function owned(n){ const S0 = st(); const p = S0 && S0.planes && S0.planes[n]; return p ? { owned: p.owned || 0, assigned: p.assigned || 0 } : { owned: 0, assigned: 0 }; }
  function fits(a){ const S0 = st(); const rs = (S0 && S0.routes) || []; const ok = rs.filter(r => { try { return a.range >= getDistance(r.from, r.to); } catch (e) { return false; } }); return { ok, all: rs.length }; }
  function ensureSel(){ const bs = bands(); if (S.sel && AIRCRAFT[S.sel]) return; const S0 = st(); const yr = (S0 && S0.year) || 2024; const first = bs.flatMap(x => x.planes).find(([, a]) => a.era <= yr) || bs.flatMap(x => x.planes)[0]; S.sel = first ? first[0] : null; }

  function thumb(model, cls){ const h = hero(model); const i = ident(model); return h ? '<div class="bp4-hero ' + (cls || '') + '"><img src="' + esc(h) + '" alt="" loading="lazy" decoding="async"></div>' : '<div class="bp4-hero ' + (cls || '') + '" style="background:linear-gradient(135deg,' + esc(i.color1) + ',' + esc(i.color2) + ')"><span class="bp4-glyph">' + (i.icon || '✈') + '</span></div>'; }

  function renderList(){
    const S0 = st(); const yr = (S0 && S0.year) || 2024;
    const selBand = S.sel && AIRCRAFT[S.sel] ? bpRangeBand(AIRCRAFT[S.sel].range) : null;
    return bands().map(({ b, planes }) => { const isOpen = (b.id in S.open) ? S.open[b.id] : (b.id === selBand); const nOwn = planes.filter(([n]) => owned(n).owned > 0).length;
      return '<div class="bp4-bh' + (isOpen ? ' open' : '') + '" onclick="AEBuyAircraftV04.band(\'' + jsq(b.id) + '\')"><span class="bp4-chev">\u203A</span><div class="bp4-bhn">' + esc(b.label) + '<small>' + esc(b.sub) + '</small></div><span class="bp4-bhc">' + planes.length + (nOwn ? ' \u00b7 ' + nOwn + ' owned' : '') + '</span></div>' + (isOpen ? '<div class="bp4-rows">' + planes.map(([n, a]) => { const i = ident(n); const o = owned(n); const fut = a.era > yr;
      return '<div class="bp4-row' + (S.sel === n ? ' on' : '') + (fut ? ' fut' : '') + '" onclick="AEBuyAircraftV04.pick(\'' + jsq(n) + '\')">' + thumb(n, 'sm') +
        '<div class="bp4-n">' + esc(i.name) + '<small>' + a.seats + ' seats · ' + a.range.toLocaleString() + ' mi</small></div>' +
        '<div class="bp4-p">' + money(a.cost) + (o.owned ? '<small>' + o.owned + ' owned</small>' : fut ? '<small class="fut">from ' + a.era + '</small>' : '') + '</div></div>'; }).join('') + '</div>' : ''); }).join('');
  }

  function renderDetail(){
    const S0 = st(); if (!S.sel) return '<div class="bp4-empty">No aircraft available.</div>';
    const n = S.sel, a = AIRCRAFT[n], i = ident(n), o = owned(n), yr = (S0 && S0.year) || 2024, fut = a.era > yr;
    const q = Math.max(1, S.qty | 0); const bulk = bulkPlaneDiscount(n, q); const tiers = ((typeof ECON !== 'undefined' && ECON.bulkDiscount) || {})[a.type] || [];
    const f = fits(a); const cash = (S0 && S0.cash) || 0; const can = !fut && cash >= bulk.total; const free = o.owned - o.assigned;
    const maxSeats = 560, maxRange = 8800, maxSpeed = a.type === 'supersonic' ? 1400 : 700;
    const bar = (v, m) => '<div class="bp4-bar"><i style="width:' + Math.max(4, Math.min(100, v / m * 100)) + '%"></i></div>';
    return '<div class="bp4-sheet">' +
      '<div class="bp4-herobig">' + (hero(n) ? '<img src="' + esc(hero(n)) + '" alt="">' : '<div class="bp4-herofill" style="background:linear-gradient(135deg,' + esc(i.color1) + ',' + esc(i.color2) + ')"></div>') +
        '<div class="bp4-tags"><span class="bp4-tag">' + esc(i.id) + '</span>' + (o.owned ? '<span class="bp4-tag own">' + o.owned + ' owned</span>' : '') + (fut ? '<span class="bp4-tag gold">Available ' + a.era + '</span>' : '') + '</div>' +
        '<div class="bp4-cap"><span class="bp4-sub">' + esc(i.theme) + '</span><h2>' + esc(i.name) + '</h2><span class="bp4-sub muted">' + esc(n) + ' · in service since ' + a.era + '</span></div></div>' +
      '<div class="bp4-specs">' +
        '<div class="bp4-sp"><span class="bp4-k">Seats</span><b>' + a.seats + '</b>' + bar(a.seats, maxSeats) + '</div>' +
        '<div class="bp4-sp"><span class="bp4-k">Range</span><b>' + a.range.toLocaleString() + ' mi</b>' + bar(a.range, maxRange) + '</div>' +
        '<div class="bp4-sp"><span class="bp4-k">Cruise</span><b>' + a.speed + ' mph</b>' + bar(a.speed, maxSpeed) + '</div>' +
        '<div class="bp4-sp"><span class="bp4-k">Efficiency</span><b>' + a.fuel + '</b>' + bar(a.fuel, 100) + '</div></div>' +
      '<div class="bp4-two"><div class="bp4-panel bp4-fit"><span class="bp4-k">Role &amp; fit</span><p>' + esc(i.role) + '</p><ul>' +
        '<li><span>Cost per seat</span><b>$' + Math.round(a.cost / a.seats * 1000) + 'k</b></li>' +
        '<li><span>Fits your routes</span><b>' + (f.all ? f.ok.length + ' of ' + f.all : 'no routes yet') + '</b></li>' +
        f.ok.slice(0, 3).map(r => '<li class="muted"><span>' + esc(r.from) + ' → ' + esc(r.to) + '</span><span>' + Math.round(getDistance(r.from, r.to)).toLocaleString() + ' mi</span></li>').join('') + '</ul></div>' +
      '<div class="bp4-panel bp4-order"><span class="bp4-k">Order</span>' +
        '<div class="bp4-qrow"><div class="bp4-stepper"><button onclick="AEBuyAircraftV04.qty(-1)">−</button><span>' + q + '</span><button onclick="AEBuyAircraftV04.qty(1)">+</button></div><span class="muted">× ' + money(a.cost) + '</span></div>' +
        (tiers.length ? '<div class="bp4-ladder">' + tiers.map(t => '<span class="' + (q >= t[0] ? 'on' : '') + '">' + t[0] + '+ · −' + t[1] + '%</span>').join('') + '</div>' : '') +
        '<div class="bp4-tot"><span class="muted">Total' + (bulk.pct ? ' after ' + bulk.pct + '% off' : '') + '</span><span class="bp4-price">' + money(bulk.total) + '</span></div>' +
        '<button class="bp4-buy"' + (can ? '' : ' disabled') + ' onclick="buyPlaneQty(\'' + jsq(n) + '\',' + q + ')">' + (fut ? 'Available in ' + a.era : cash < bulk.total ? 'Not enough cash' : 'Buy ' + q + ' ' + esc(i.name) + (q > 1 ? 's' : '')) + '</button>' +
        '<span class="bp4-after muted">Cash after: ' + money(cash - bulk.total) + '</span>' +
        (o.owned ? '<button class="bp4-sell"' + (free > 0 ? '' : ' disabled') + ' onclick="tapConfirm(this,()=>{sellPlane(\'' + jsq(n) + '\')},\'Sell 1 for ' + money(a.cost * 0.55) + '?\')">Sell 1 · ' + money(a.cost * 0.55) + (free > 0 ? '' : ' (all assigned)') + '</button>' : '') +
      '</div></div></div>';
  }

  function renderFleet(){
    const S0 = st(); const rows = Object.entries((S0 && S0.planes) || {}).filter(([, p]) => p.owned > 0);
    if (!rows.length) return '<div class="bp4-empty">No aircraft owned yet. Pick a type on the left to buy your first.</div>';
    return '<div class="bp4-fleet"><div class="bp4-fh"><span>Aircraft</span><span>Seats</span><span>Owned</span><span>Flying</span><span>Free</span><span></span></div>' + rows.map(([n, p]) => { const a = AIRCRAFT[n] || p; const i = ident(n); const free = (p.owned || 0) - (p.assigned || 0);
      return '<div class="bp4-fr" onclick="AEBuyAircraftV04.pick(\'' + jsq(n) + '\')">' + thumb(n, 'sm') + '<div class="bp4-n">' + esc(i.name) + '<small>' + esc(n) + ' · ' + esc(i.id) + '</small></div><span>' + (a.seats || 0) + '</span><span>' + (p.owned || 0) + '</span><span>' + (p.assigned || 0) + '</span><span class="' + (free > 0 ? 'ok' : '') + '">' + free + '</span>' +
        '<button class="bp4-sell sm"' + (free > 0 ? '' : ' disabled') + ' onclick="event.stopPropagation();tapConfirm(this,()=>{sellPlane(\'' + jsq(n) + '\')},\'Sell 1?\')">Sell 1 · ' + money((a.cost || 0) * 0.55) + '</button></div>'; }).join('') + '</div>';
  }

  function build(){
    ensureSel(); const S0 = st(); const cash = (S0 && S0.cash) || 0; const nOwned = Object.values((S0 && S0.planes) || {}).filter(p => p.owned > 0).length;
    const head = (typeof modalHead === 'function') ? modalHead('<span class="bp4-ic">' + I.plane + '</span> BUY AIRCRAFT') : '';
    return head + '<div class="bp4-top"><div class="bp4-tabs"><button class="' + (S.view === 'buy' ? 'on' : '') + '" onclick="AEBuyAircraftV04.view(\'buy\')"><span class="bp4-ic">' + I.plane + '</span>Buy aircraft</button><button class="' + (S.view === 'fleet' ? 'on' : '') + '" onclick="AEBuyAircraftV04.view(\'fleet\')"><span class="bp4-ic">' + I.list + '</span>Your fleet <b>' + nOwned + '</b></button></div>' +
      '<div class="bp4-right"><button class="bp4-guide" onclick="openAircraftIdentityGuide()">Identity guide</button><span class="bp4-cash">Cash <b>' + money(cash) + '</b></span></div></div>' +
      '<div class="bp4-body"><div class="bp4-list">' + renderList() + '</div><div class="bp4-detail">' + (S.view === 'fleet' ? renderFleet() : renderDetail()) + '</div></div>';
  }

  function rerender(){ const c = document.getElementById('modal-content'); if (!c || !c.classList.contains(CLS)) return; const l = c.querySelector('.bp4-list'); const d = c.querySelector('.bp4-detail'); const sl = l ? l.scrollTop : 0, sd = d ? d.scrollTop : 0; c.innerHTML = build(); const l2 = c.querySelector('.bp4-list'), d2 = c.querySelector('.bp4-detail'); if (l2) l2.scrollTop = sl; if (d2) d2.scrollTop = sd; }
  function size(c){ c.style.setProperty('width', 'min(980px, 96vw)', 'important'); c.style.setProperty('max-width', 'min(980px, 96vw)', 'important'); c.style.setProperty('height', 'min(660px, 92vh)', 'important'); c.style.setProperty('max-height', 'min(660px, 92vh)', 'important'); c.style.setProperty('margin-top', '0px', 'important'); c.style.setProperty('margin-bottom', '0px', 'important'); c.dataset.aeFixed = '1'; c._bpv4 = true; }
  function unsize(c){ if (!c || !c._bpv4) return; ['width','max-width','height','max-height','margin-top','margin-bottom'].forEach(p => c.style.removeProperty(p)); delete c.dataset.aeFixed; c._bpv4 = false; c.classList.remove(CLS); }

  window.AEBuyAircraftV04 = {
    pick: n => { S.sel = n; S.qty = 1; S.view = 'buy'; try { S.open[bpRangeBand(AIRCRAFT[n].range)] = true; } catch (e) {} rerender(); },
    band: id => { const selBand = S.sel && AIRCRAFT[S.sel] ? bpRangeBand(AIRCRAFT[S.sel].range) : null; const cur = (id in S.open) ? S.open[id] : (id === selBand); S.open[id] = !cur; rerender(); },
    qty: d => { S.qty = Math.max(1, Math.min(20, (S.qty | 0) + d)); rerender(); },
    view: v => { S.view = v; rerender(); },
    rerender, version: 'v04'
  };

  function install(){
    if (typeof window.buildBuyPlanes !== 'function' || typeof window.openModal !== 'function' || typeof window.bulkPlaneDiscount !== 'function') { setTimeout(install, 250); return; }
    const native = window.buildBuyPlanes;
    if (!native.__aeBpV4) { const w = function(){ try { return build(); } catch (err) { console.warn('[buy-aircraft-v04] render failed, stock window shown', err); return native.apply(this, arguments); } }; w.__aeBpV4 = true; window.buildBuyPlanes = w; }
    const oo = window.openModal;
    if (!oo.__aeBpV4) { const w = function(type){ const c = document.getElementById('modal-content'); if (c) unsize(c); if (type === 'buy-planes') { S.view = 'buy'; S.qty = 1; } const r = oo.apply(this, arguments); if (c && type === 'buy-planes') { c.classList.add(CLS); size(c); } return r; }; w.__aeBpV4 = true; window.openModal = w; }
    const oc = window.closeModal;
    if (typeof oc === 'function' && !oc.__aeBpV4) { const w = function(){ const r = oc.apply(this, arguments); unsize(document.getElementById('modal-content')); return r; }; w.__aeBpV4 = true; window.closeModal = w; }
    /* Identity Guide reuses the modal without openModal(): drop our frame so it sizes itself */
    const og = window.openAircraftIdentityGuide;
    if (typeof og === 'function' && !og.__aeBpV4) { const w = function(){ unsize(document.getElementById('modal-content')); return og.apply(this, arguments); }; w.__aeBpV4 = true; window.openAircraftIdentityGuide = w; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
