/* CARGO_ENGINE_v01 — freight economy behind the Cargo Network window.
   Replaces the flat cargo-route formula with: a per-corridor demand model built from city economy and
   industry mix (8 commodity types, spot rates that drift monthly, seasons, market events); a separate
   freighter fleet (STATE.cargo.fleet) bought here or produced by passenger-to-freighter conversions;
   belly freight on every passenger route; a rotating contract board (forwarder / integrator / charter /
   mail) with fixed rates, deliveries and penalties; hub throughput tied to the Cargo Hub building level;
   and certifications unlocked on the Tech Board's Cargo & Freight track.
   Integration: core processCargoRoutes calls tick (endTurn adds its return value to income);
   route commands forward to openLane / closeLane so lanes can fly freighters. STATE.cargoRoutes stays the lane
   list so the dashboard count, ledger and finance log keep working. Existing saves migrate in place.
   Data: js/data/cargoCatalog.js. Window: js/patches/cargo_window_v01.js. */
(function cargoEngineV01(){
  'use strict';
  if (window.AECargo) return;
  const CAT = window.AE_CARGO_CATALOG;
  if (!CAT) { console.error('[cargo-engine] catalogue missing (js/data/cargoCatalog.js)'); return; }
  const FR = CAT.freighters, COM = CAT.commodities, COMK = {}; COM.forEach(c => COMK[c.k] = c);
  const W = 4.33;
  const st = () => (typeof STATE !== 'undefined' && STATE) ? STATE : null;
  const r2 = v => Math.round(v * 100) / 100;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

  /* ── state ─────────────────────────────────────────────────── */
  function C(){
    const S = st(); if (!S) return { fleet:{}, contracts:[], offers:[], conversions:[], spot:{}, events:[], last:{} };
    if (!S.cargoRoutes) S.cargoRoutes = [];
    if (!S.cargo || typeof S.cargo !== 'object') S.cargo = {};
    const c = S.cargo;
    if (!c.fleet || typeof c.fleet !== 'object') c.fleet = {};
    ['contracts','offers','conversions','events'].forEach(k => { if (!Array.isArray(c[k])) c[k] = []; });
    if (!c.spot || typeof c.spot !== 'object') c.spot = {};
    COM.forEach(x => { if (!Number.isFinite(c.spot[x.k])) c.spot[x.k] = 1; });
    if (!c.last || typeof c.last !== 'object') c.last = {};
    if (!c.rep || typeof c.rep !== 'object') c.rep = {};
    if (!c.migrated) { S.cargoRoutes.forEach(l => { if (!l.mix) l.mix = mixFor(l.from, l.to); if (!Number.isFinite(l.flights)) l.flights = 3; }); c.migrated = 1; }
    return c;
  }
  const lanes = () => { C(); return st().cargoRoutes; };

  /* ── research / certification hooks ────────────────────────── */
  function techIds(){ const S = st(); const r = S && S.research; return r ? [...(r.done || []), ...(r.owned || [])] : []; }
  function techFx(){
    const R = window.AE_RESEARCH_CATALOG; const byId = {}; if (R) { R.research.forEach(x => byId[x.id] = x); R.upgrades.forEach(x => byId[x.id] = x); }
    const m = { cap:1, certs:{}, convFee:1, convMonths:0, demand:1, yield:{}, hub:1, handling:1 };
    techIds().forEach(id => { const f = byId[id] && byId[id].fx; if (!f) return;
      if (f.cargoCap) m.cap *= 1 + f.cargoCap; if (f.cargoCert) m.certs[f.cargoCert] = true;
      if (f.cargoConvFee) m.convFee *= 1 + f.cargoConvFee; if (f.cargoConvMonths) m.convMonths += f.cargoConvMonths;
      if (f.cargoDemand) m.demand *= 1 + f.cargoDemand; if (f.cargoYield) Object.keys(f.cargoYield).forEach(k => m.yield[k] = (m.yield[k] || 1) * (1 + f.cargoYield[k]));
      if (f.cargoHub) m.hub *= 1 + f.cargoHub; if (f.cargoHandling) m.handling *= 1 + f.cargoHandling; });
    return m;
  }
  const certified = k => { const c = COMK[k]; return !c || !c.needs || !!techFx().certs[c.needs]; };

  /* ── aircraft helpers ──────────────────────────────────────── */
  function isFreighter(model){ return !!FR[model]; }
  function spec(model){ if (FR[model]) return FR[model]; const a = (typeof AIRCRAFT !== 'undefined') && AIRCRAFT[model]; return a || null; }
  /* tonnes per flight: freighters use payload; a passenger jet on a freight-only lane loads its cabin and hold */
  function payload(model){ const f = FR[model]; if (f) return f.payload; const a = spec(model); return a ? Math.round((a.seats || 0) * 0.09) : 0; }
  function seatEq(model){ const f = FR[model]; if (f) return f.payload * 3.6; const a = spec(model); return a ? (a.seats || 0) : 150; }
  function ident(model){ const i = CAT.identity[model]; if (i) return { ...i, model }; try { return acIdentity(model); } catch (e) { return { id: model, name: model, theme: '', role: '', model }; } }
  function hero(model){ const f = FR[model]; if (f && f.art) return f.art; const base = f ? f.base : model; const m = window.AEAircraftImageManifest; const e = m && m.byModel && m.byModel[base]; return e ? e.path : null; }
  function listedFreighter(model){ const f = FR[model], S = st(); if (!f) return false;
    if (S && S.gameType === 'eras') return f.era <= (S.year || 1970) + 5;
    return !f.vintage; }
  function fleetEntry(model){ const c = C(); if (!c.fleet[model]) c.fleet[model] = { owned:0, assigned:0 }; return c.fleet[model]; }
  function freeCount(model){ if (isFreighter(model)) { const e = fleetEntry(model); return e.owned - e.assigned; } const S = st(); const p = S && S.planes && S.planes[model]; return p ? (p.owned || 0) - (p.assigned || 0) : 0; }
  function assign(model, d){ if (isFreighter(model)) { const e = fleetEntry(model); e.assigned = clamp(e.assigned + d, 0, Math.max(e.owned, 0)); } else { const S = st(); const p = S && S.planes && S.planes[model]; if (p) p.assigned = Math.max(0, (p.assigned || 0) + d); } }
  function fleetList(){ const c = C(); return Object.keys(FR).filter(m => (c.fleet[m] && c.fleet[m].owned > 0) || (listedFreighter(m) && !FR[m].convOnly)).map(m => ({ model:m, ...FR[m], ident:ident(m), hero:hero(m), owned:(c.fleet[m] || {}).owned || 0, assigned:(c.fleet[m] || {}).assigned || 0 })); }
  function freighterCount(){ const c = C(); return Object.values(c.fleet).reduce((s, e) => s + (e.owned || 0), 0); }
  function laneAircraftChoices(){ const S = st(); const out = [];
    Object.keys(FR).forEach(m => { const n = freeCount(m); if (n > 0) out.push({ model:m, free:n, payload:payload(m), range:FR[m].range, freighter:true }); });
    Object.entries((S && S.planes) || {}).forEach(([m, p]) => { const n = (p.owned || 0) - (p.assigned || 0); if (n > 0 && AIRCRAFT[m]) out.push({ model:m, free:n, payload:payload(m), range:AIRCRAFT[m].range, freighter:false }); });
    return out; }

  /* ── demand model ───────────────────────────────────────────── */
  function cityMix(city){ const c = CITIES[city]; if (!c) return CAT.regionMix.default;
    const base = CAT.cityMix[city] || CAT.regionMix[c.region] || CAT.regionMix.default;
    if (CAT.cityMix[city]) return base;
    // deterministic per-city variation so cities in one region differ
    const h = hash(city); const out = {}; let tot = 0; const ks = Object.keys(base);
    ks.forEach((k, i) => { const v = base[k] * (0.8 + ((h >> (i * 3)) % 7) / 15); out[k] = v; tot += v; });
    ks.forEach(k => out[k] = out[k] / tot); return out; }
  function mixFor(a, b){ const ma = cityMix(a), mb = cityMix(b); const out = {}; let tot = 0;
    COM.forEach(c => { const v = ((ma[c.k] || 0) + (mb[c.k] || 0)) / 2; if (v > 0.005) { out[c.k] = v; tot += v; } });
    Object.keys(out).forEach(k => out[k] = r2(out[k] / tot * 100) / 100); return out; }
  function season(k){ const S = st(); const m = ((S && S.month) || 0) + 1; const t = CAT.season[k]; return t && t[m] ? t[m] : 1; }
  function eventMult(a, b, k){ let m = 1; C().events.forEach(e => { const ok = e.all || (e.pair && ((e.a === a && e.b === b) || (e.a === b && e.b === a))) || (e.city && (e.a === a || e.a === b)); if (!ok) return; if (!e.k || e.k === k) m *= e.mult; }); return m; }
  function macroMult(){ let m = 1; const S = st(); ((S && S.timedEffects) || []).forEach(e => { if (e.fx === 'recession') m *= 0.85; if (e.fx === 'pandemic') m *= 1.25; if (e.fx === 'macro_boom') m *= 1.10; }); return m; }
  /* difficulty (LEVELS 1-4): freight rates and contract penalties scale like fares do */
  function diff(){ const S = st(); const id = (S && S.level && S.level.id) || 2; return { rate:[1.1, 1, 0.92, 0.85][id - 1] || 1, pen:[0.7, 1, 1.25, 1.5][id - 1] || 1 }; }
  /* alliance interline: a partner's home regions feed your corridors (+10 % at full strength) */
  function allianceMult(a, b){ let m = 1; try { if (typeof activeAlliances !== 'function') return 1; activeAlliances().forEach(al => { const s = (typeof allianceStrength === 'function') ? allianceStrength(al) : 1; if (!s) return;
      const regs = (typeof _allPartnerRegions === 'function') ? _allPartnerRegions(al.partner) : []; const ra = CITIES[a] && CITIES[a].region, rb = CITIES[b] && CITIES[b].region; if (regs.includes(ra) || regs.includes(rb)) m *= 1 + 0.10 * s; }); } catch (e) {} return m; }
  /* rival airlines fly freight too: each rival takes a slice of any corridor touching its hub or its routes */
  function rivalShare(a, b){ const S = st(); let share = 0; ((S && S.competitors) || []).forEach(r => { const hub = r.hub === a || r.hub === b;
      const onRoute = (r.routeList || []).some(x => { const f = Array.isArray(x.from) ? x.from[0] : x.from, t = Array.isArray(x.to) ? x.to[0] : x.to; return (f === a && t === b) || (f === b && t === a); });
      if (onRoute) share += 0.30 * (0.6 + 0.6 * (r.aggression || 0.5)); else if (hub) share += 0.12 * (0.6 + 0.6 * (r.aggression || 0.5)); }); return Math.min(0.7, share); }
  /* monthly freight demand on corridor a<->b (both directions), tonnes, split by commodity */
  function demand(a, b){ const ca = CITIES[a], cb = CITIES[b]; if (!ca || !cb) return { total:0, by:{}, sellable:0, yield:0 };
    const dist = getDistance(a, b);
    const base = Math.sqrt((ca.econ || 40) * (cb.econ || 40)) * 6.0 * (1 + ((ca.pop || 1) + (cb.pop || 1)) / 40) * (ca.region === cb.region ? 0.8 : 1.0) * (dist < 300 ? 0.25 : 1) * 2;
    const dd = 1 / (1 + dist / 9000); const fx = techFx(); const mix = mixFor(a, b); const c = C();
    const by = {}; let total = 0, sellable = 0, revPerT = 0; const rs = rivalShare(a, b), am = allianceMult(a, b), df = diff().rate;
    Object.keys(mix).forEach(k => { const t = base * dd * mix[k] * season(k) * eventMult(a, b, k) * macroMult() * fx.demand * am; by[k] = t; total += t;
      if (certified(k)) { const tt = t * (1 - rs); sellable += tt; revPerT += tt * COMK[k].rate * c.spot[k] * (fx.yield[k] || 1) * df; } });
    return { total, by, sellable, mix, yield: sellable ? revPerT / sellable : 0, dist, rival: total * rs, rivalShare: rs, alliance: am }; }
  function hubLevel(city){ const S = st(); const inv = ((S && S.cityInvestments) || {})[city] || {}; return (inv.cargo_hub || {}).level || 0; }
  function hubCap(city){ const lv = clamp(hubLevel(city), 0, CAT.hubTonnes.length - 1); return CAT.hubTonnes[lv] * techFx().hub; }
  function laneCapacity(l){ return payload(l.plane) * (l.flights || 0) * W * 0.9 * 2 * techFx().cap; }

  /* ── contracts ─────────────────────────────────────────────── */
  function reservedOn(from, to){ return C().contracts.filter(k => k.kind !== 'chr' && ((k.from === from && k.to === to) || (k.from === to && k.to === from))).reduce((s, k) => s + k.tons, 0); }
  function laneFor(from, to){ return lanes().find(l => (l.from === from && l.to === to) || (l.from === to && l.to === from)); }
  function offerCheck(o){ const fx = techFx(); const n = COMK[o.k] && COMK[o.k].needs; if (n && !fx.certs[n]) return { ok:false, why:'Needs ' + certName(n) };
    if (o.kind === 'int' && !fx.certs.night) return { ok:false, why:'Needs Night Operations' };
    if (o.kind === 'chr') { const big = Object.keys(FR).some(m => fleetEntry(m).owned > 0 && payload(m) >= o.tons / (o.lifts || 1)); return big ? { ok:true } : { ok:false, why:'Needs a freighter that lifts ' + Math.ceil(o.tons / (o.lifts || 1)) + ' t' }; }
    const l = laneFor(o.from, o.to); if (!l) return { ok:false, why:'Open a lane ' + o.from + ' → ' + o.to + ' first', needLane:true };
    const free = laneCapacity(l) - reservedOn(o.from, o.to); if (free < o.tons * 0.5) return { ok:false, why:'Lane needs ' + Math.ceil(o.tons - free) + ' t/mo more capacity' };
    return { ok:true }; }
  function certName(n){ return { cold:'Cold Chain Certification', dg:'Dangerous Goods Certification', heavy:'Main-Deck Loaders', night:'Night Operations' }[n] || n; }
  function makeOffer(){ const S = st(); const hubs = (S && S.hubs) || []; if (!hubs.length) return null;
    const kinds = ['fwd','fwd','fwd','int','chr','mail','mail']; const kind = pick(kinds); const K = CAT.contractKinds[kind];
    const from = pick(hubs); const cands = Object.keys(CITIES).filter(c => c !== from && (CITIES[c].econ || 0) >= 45);
    let to = null; if (kind !== 'chr' && lanes().length && Math.random() < 0.5) { const l = pick(lanes()); if (hubs.includes(l.from)) { to = l.to; } }
    if (!to) to = pick(cands.sort((a, b) => (CITIES[b].econ - CITIES[a].econ)).slice(0, 60));
    const d = demand(from, to); if (!d.total) return null;
    const ks = Object.keys(d.by).sort((a, b) => d.by[b] - d.by[a]); let k = ks[0];
    if (kind === 'mail') k = 'mail'; else if (kind === 'int') k = 'exp'; else if (kind === 'chr') k = pick(['hvy','gen','per','dg','aut']);
    const c = COMK[k]; const tons = Math.max(10, Math.round(d.total * rnd(K.share[0], K.share[1]) / 10) * 10);
    const who = pick(CAT.shippers[kind]); const trust = clamp((C().rep[who] || 0), -4, 6);
    const rate = r2(c.rate * C().spot[k] * rnd(K.rate[0], K.rate[1]) * diff().rate * (1 + 0.025 * trust)); const term = Math.round(rnd(K.term[0], K.term[1]));
    const o = { id:'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), kind, who, from, to, k, tons, term, rate, pen:r2(tons * rate / 1000 * K.pen * diff().pen), expires:Math.round(rnd(K.expires[0], K.expires[1])), trust };
    if (kind === 'chr') { o.lifts = tons > 120 ? 2 : 1; o.title = 'Charter: ' + from + ' → ' + to; o.note = pick(['Relief supplies — prestige on completion.','Oversize pallets. Hard deadline.','Event freight, one lift, no second chances.','Project cargo for a plant build.']); }
    else if (kind === 'int') { o.title = 'Overnight express: ' + from + ' ↔ ' + to; o.note = 'Departs 23:00–01:00. Integrator supplies ULDs. Volume grows 8 %/yr.'; }
    else if (kind === 'mail') { o.title = 'Mail: ' + from + ' ↔ ' + to; o.note = 'Low yield, never fails. Fits belly or narrowbody capacity.'; }
    else { o.title = from + ' → ' + to + ' block space'; o.note = 'Guaranteed ' + tons + ' t/mo at a fixed rate for ' + term + ' months.'; }
    return o; }
  function refreshOffers(){ const c = C(); c.offers = c.offers.filter(o => (o.expires -= 1) > 0);
    let guard = 20; while (c.offers.length < CAT.boardSize && guard-- > 0) { const o = makeOffer(); if (o && !c.offers.some(x => x.from === o.from && x.to === o.to && x.kind === o.kind)) c.offers.push(o); } }
  function accept(id){ const c = C(); const i = c.offers.findIndex(o => o.id === id); if (i < 0) return false; const o = c.offers[i];
    const chk = offerCheck(o); if (!chk.ok) { showFlash('⚠ ' + chk.why); return false; }
    if (typeof spendAction === 'function' && !spendAction('Accept contract')) return false;
    c.offers.splice(i, 1); c.contracts.push({ ...o, left:o.term, delivered:0, missed:0, earned:0 });
    addEvent('good', '📦 Contract signed: ' + o.title + ' (' + o.who + ')'); showFlash('✓ Contract signed — ' + o.title); return true; }
  function cancel(id){ const c = C(); const i = c.contracts.findIndex(k => k.id === id); if (i < 0) return; const k = c.contracts[i];
    const fee = r2(k.pen * 2); const S = st(); S.cash -= fee; c.contracts.splice(i, 1); c.rep[k.who] = (c.rep[k.who] || 0) - 1;
    addEvent('bad', '📦 Contract cancelled: ' + k.title + ' — $' + fee + 'M break fee'); showFlash('Contract cancelled — $' + fee + 'M break fee'); }

  /* ── conversions ────────────────────────────────────────────── */
  function convFee(p){ return r2(p.fee * techFx().convFee); }
  function convMonths(p){ return Math.max(1, p.months + techFx().convMonths); }
  function convert(from){ const p = CAT.conversions.find(x => x.from === from); if (!p) return; const S = st(); const pl = S.planes[from];
    if (!pl || pl.owned - pl.assigned <= 0) return showFlash('⚠ No free ' + from + ' to convert');
    const fee = convFee(p); if (S.cash < fee) return showFlash('⚠ Need $' + fee + 'M');
    if (typeof spendAction === 'function' && !spendAction('Convert aircraft')) return;
    S.cash -= fee; pl.owned -= 1; C().conversions.push({ from, to:p.to, left:convMonths(p), total:convMonths(p), fee });
    addEvent('neutral', '🔧 ' + from + ' sent for freighter conversion → ' + p.to + ' ($' + fee + 'M, ' + convMonths(p) + ' mo)'); showFlash('✓ ' + from + ' sent for conversion'); }

  /* ── freighter buy / sell ───────────────────────────────────── */
  function buy(model, q){ q = Math.max(1, q | 0); const f = FR[model]; if (!f || f.convOnly) return; const S = st();
    if (f.era > S.year + 3) return showFlash('⚠ ' + model + ' not available until ' + f.era);
    const total = Math.round(f.cost * q * (q >= 3 ? 0.93 : 1)); if (S.cash < total) return showFlash('⚠ Need $' + total + 'M');
    if (typeof spendAction === 'function' && !spendAction('Buy freighter')) return;
    S.cash -= total; fleetEntry(model).owned += q; addEvent('neutral', '📦 Bought ' + q + '× ' + model + ' freighter for $' + total + 'M'); showFlash('✓ ' + q + '× ' + model + ' acquired'); }
  function sell(model){ const e = fleetEntry(model); if (e.owned - e.assigned <= 0) return showFlash('⚠ All copies are on lanes'); const S = st(); const price = Math.round(FR[model].cost * 0.55);
    S.cash += price; e.owned -= 1; addEvent('neutral', 'Sold ' + model + ' freighter for $' + price + 'M'); showFlash('✓ Sold 1× ' + model + ' for $' + price + 'M'); }

  /* ── lanes ──────────────────────────────────────────────────── */
  function openLane(from, to, plane, flights){ const S = st(); flights = clamp(flights | 0 || 3, 1, 14);
    if (!from || !to || !plane || from === to) return showFlash('Invalid cargo lane');
    if (laneFor(from, to)) return showFlash('⚠ A lane already exists between these cities');
    const dist = getDistance(from, to); const sp = spec(plane); if (!sp || dist > sp.range) return showFlash('⚠ Aircraft range too short');
    if (freeCount(plane) <= 0) return showFlash('⚠ No free aircraft');
    const cost = Math.round(dist * 0.02 + 3); if (S.cash < cost) return showFlash('⚠ Need $' + cost + 'M to open');
    if (typeof spendAction === 'function' && !spendAction('Open cargo lane')) return;
    S.cash -= cost; assign(plane, +1);
    lanes().push({ from, to, plane, flights, _age:0, profit:0, mix:mixFor(from, to) });
    addEvent('good', '📦 Cargo lane ' + from + ' → ' + to + ' opened (' + plane + ', ' + flights + '/wk)'); showFlash('✓ Cargo lane ' + from + ' → ' + to + ' launched'); if (typeof updateUI === 'function') updateUI(); return true; }
  function closeLane(idx){ const L = lanes(); const l = L[idx]; if (!l) return; assign(l.plane, -1); L.splice(idx, 1);
    const c = C(); c.contracts = c.contracts.filter(k => { const on = k.kind !== 'chr' && ((k.from === l.from && k.to === l.to) || (k.from === l.to && k.to === l.from)); if (on) addEvent('bad', '📦 Contract ' + k.title + ' lapsed — lane closed'); return !on; });
    addEvent('neutral', '📦 Cargo lane ' + l.from + ' → ' + l.to + ' closed.'); if (typeof updateUI === 'function') updateUI(); }
  function setFlights(idx, n){ const l = lanes()[idx]; if (!l) return; l.flights = clamp(n | 0, 1, 14); }
  function swapPlane(idx, model){ const l = lanes()[idx]; if (!l || l.plane === model) return; if (freeCount(model) <= 0) return showFlash('⚠ No free ' + model);
    const dist = getDistance(l.from, l.to); if (dist > spec(model).range) return showFlash('⚠ Range too short'); assign(l.plane, -1); assign(model, +1); l.plane = model; showFlash('✓ ' + l.from + ' → ' + l.to + ' now flies ' + model); }

  /* ── month tick (called by processCargoRoutes) ───────────── */
  function costs(l, tons){ const E = ECON, dist = getDistance(l.from, l.to), fl = (l.flights || 0), sp = spec(l.plane) || { fuel:70 };
    const sm = seatEq(l.plane) * fl * W * dist * 2; const effic = 1 - ((sp.fuel || 70) / 220); let fuelMult = (st().fuelMod || 1); try { fuelMult *= timedFuelMod(); } catch (e) {}
    const fuel = sm * E.fuelPerSeatMile * effic * fuelMult; let crewM = 1; try { crewM = crewMoraleCostMult(); } catch (e) {}
    const crew = fl * W * 2 * (E.crewPerFlight * 0.6 + dist * E.crewPerMile * 0.6) * crewM; const handling = tons * 120 * techFx().handling;
    return { fuel: fuel / 1e6, crew: crew / 1e6, handling: handling / 1e6 }; }
  function tick(){ const S = st(); if (!S) return 0; const c = C(); const fx = techFx(); const out = { lanes:0, belly:0, contracts:0, charters:0, penalties:0, tons:0, contractTons:0, cap:0 };
    // spot drift
    COM.forEach(x => { c.spot[x.k] = clamp(c.spot[x.k] + rnd(-x.vol, x.vol) + (1 - c.spot[x.k]) * 0.15, 0.8, 1.25); });
    // events: expire, maybe spawn (one active at a time)
    c.events = c.events.filter(e => (e.left -= 1) > 0);
    if (!c.events.length && Math.random() < 0.22) { const t = pick(CAT.events); const hubs = S.hubs || []; const a = hubs.length && Math.random() < 0.7 ? pick(hubs) : pick(Object.keys(CITIES)); let b = a; if (t.pair) { const l = laneFor && lanes().find(x => x.from === a || x.to === a); b = l ? (l.from === a ? l.to : l.from) : pick(Object.keys(CITIES).filter(x => x !== a)); }
      c.events.push({ id:t.id, name:t.name, text:t.text.replace('{a}', a).replace('{b}', b), left:t.months, a, b, k:t.k, mult:t.mult, all:!!t.all, pair:!!t.pair, city:!!t.city }); addEvent('neutral', '📦 Freight market: ' + t.name + ' — ' + c.events[0].text); }
    // hub loads
    const hubT = {}; lanes().forEach(l => { const t = (l.tons != null ? l.tons : laneCapacity(l) * 0.6); hubT[l.from] = (hubT[l.from] || 0) + t / 2; hubT[l.to] = (hubT[l.to] || 0) + t / 2; });
    const hubOver = city => (S.hubs || []).includes(city) && hubT[city] > hubCap(city);
    // lanes
    lanes().forEach(l => { const d = demand(l.from, l.to); let cap = laneCapacity(l); if (hubOver(l.from) || hubOver(l.to)) cap *= CAT.hubOverloadLoad;
      const reserved = Math.min(cap, reservedOn(l.from, l.to)); const spot = Math.min(cap - reserved, Math.max(0, d.sellable - reserved)) * rnd(0.92, 1.04);
      const tons = Math.min(cap, reserved + spot); const rev = spot * d.yield * 1000 / 1e6; const k = costs(l, tons); const profit = rev - k.fuel - k.crew - k.handling;
      l.tons = Math.round(tons); l.cap = Math.round(cap); l.lf = cap ? tons / cap : 0; l.yield = r2(d.yield); l.rev = r2(rev); l.cost = r2(k.fuel + k.crew + k.handling); l.profit = r2(profit); l.mix = d.mix; l.demand = Math.round(d.sellable); l.unsold = Math.round(Math.max(0, d.sellable - tons));
      l.otp = r2(clamp((l.otp || 0.95) + rnd(-0.03, 0.03), 0.82, 0.995)); l._age = (l._age || 0) + 1; l.reserved = Math.round(reserved); l.hubOver = hubOver(l.from) || hubOver(l.to);
      out.lanes += profit; out.tons += tons; out.cap += cap; });
    // contracts on lanes: reserved tonnage is paid at contract rate
    c.contracts.slice().forEach(k => { if (k.kind === 'chr') { // one-off lift this month
        const rev = k.tons * k.rate * 1000 / 1e6; const h = k.tons * 120 * fx.handling / 1e6; out.charters += rev - h; k.earned = r2(rev); c.contracts.splice(c.contracts.indexOf(k), 1);
        addEvent('good', '📦 Charter flown: ' + k.title + ' — $' + r2(rev) + 'M'); if (Number.isFinite(S.prestige)) S.prestige += 1; c.rep[k.who] = (c.rep[k.who] || 0) + 1; return; }
      const l = laneFor(k.from, k.to); const cap = l ? Math.min(laneCapacity(l), l.cap || laneCapacity(l)) : 0; const others = reservedOn(k.from, k.to) - k.tons;
      const avail = Math.max(0, cap - Math.max(0, others)); const del = Math.min(k.tons, avail); const short = k.tons - del;
      const rev = del * k.rate * 1000 / 1e6; out.contracts += rev; out.contractTons += del; k.delivered += del; k.earned = r2((k.earned || 0) + rev); k.lastDel = Math.round(del);
      if (short > k.tons * 0.15) { const pen = r2(short * k.rate * 1000 / 1e6 * 1.5); out.penalties += pen; k.missed += 1; k.lastPen = pen; addEvent('bad', '📦 Missed lift on ' + k.title + ': ' + Math.round(short) + ' t short — $' + pen + 'M penalty');
        if (k.missed >= 3) { c.contracts.splice(c.contracts.indexOf(k), 1); c.rep[k.who] = (c.rep[k.who] || 0) - 2; addEvent('bad', '📦 ' + k.who + ' cancelled ' + k.title + ' after repeated shortfalls'); return; } } else k.lastPen = 0;
      k.left -= 1; if (k.left <= 0) { c.contracts.splice(c.contracts.indexOf(k), 1); c.rep[k.who] = (c.rep[k.who] || 0) + 1; addEvent('good', '📦 Contract completed: ' + k.title + ' — $' + k.earned + 'M over its term');
        if (Math.random() < 0.7) c.offers.push({ id:'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e3), kind:k.kind, who:k.who, from:k.from, to:k.to, k:k.k, tons:k.tons, term:k.term, rate:r2(k.rate * rnd(0.98, 1.08)), pen:k.pen, expires:3, title:k.title, note:'Renewal offer from ' + k.who + '.' }); } });
    // belly freight on passenger routes
    let bellyT = 0; (S.routes || []).forEach(r => { const ac = S.planes[r.plane] || AIRCRAFT[r.plane]; if (!ac) return; const b = CAT.belly[ac.type] || 0; if (!b) return; const d = demand(r.from, r.to);
      const capT = b * (r.flights || 0) * W * 2 * 0.8 * fx.cap; const t = Math.min(capT, d.sellable * 0.12); const rev = t * d.yield * 0.85 * 1000 / 1e6 - t * 120 * fx.handling / 1e6; r._belly = r2(rev); r._bellyT = Math.round(t); bellyT += t; out.belly += Math.max(0, rev); });
    // conversions
    c.conversions.slice().forEach(cv => { cv.left -= 1; if (cv.left <= 0) { c.conversions.splice(c.conversions.indexOf(cv), 1); fleetEntry(cv.to).owned += 1; addEvent('good', '🔧 Conversion complete: ' + cv.from + ' is now a ' + cv.to + ' freighter'); } });
    refreshOffers();
    out.bellyT = Math.round(bellyT); out.total = out.lanes + out.belly + out.contracts + out.charters - out.penalties; out.month = (S.month || 0) + 1; out.year = S.year;
    c.last = { lanes:r2(out.lanes), belly:r2(out.belly), contracts:r2(out.contracts), charters:r2(out.charters), penalties:r2(out.penalties), total:r2(out.total), tons:Math.round(out.tons), bellyT:out.bellyT, contractTons:Math.round(out.contractTons), lf:out.cap ? r2(out.tons / out.cap) : 0 };
    return out.total; }

  /* ── market view data ───────────────────────────────────────── */
  function market(limit){ const S = st(); const hubs = (S && S.hubs) || []; const rows = []; const seen = {};
    const cands = Object.keys(CITIES).filter(c => (CITIES[c].econ || 0) >= 50);
    hubs.forEach(h => cands.forEach(t => { if (t === h) return; const key = [h, t].sort().join('|'); if (seen[key]) return; seen[key] = 1; const d = demand(h, t); const l = laneFor(h, t); const served = l ? (l.tons || 0) : 0;
      rows.push({ from:h, to:t, demand:Math.round(d.total), sellable:Math.round(d.sellable), rival:Math.round(d.rival || 0), served, unserved:Math.round(Math.max(0, d.sellable - served)), yield:r2(d.yield), mix:d.mix, dist:d.dist, hot: C().events.some(e => e.a === h || e.a === t || e.b === h || e.b === t), lane:!!l }); }));
    rows.sort((a, b) => b.unserved - a.unserved); return rows.slice(0, limit || 40); }
  function plan(from, to){ const d = demand(from, to); const un = Math.max(0, d.sellable - (laneFor(from, to) ? laneFor(from, to).tons || 0 : 0)); const dist = d.dist;
    const cands = Object.keys(FR).filter(m => FR[m].range >= dist && (fleetEntry(m).owned > 0 || (listedFreighter(m) && !FR[m].convOnly))).map(m => ({ model:m, payload:FR[m].payload, owned:fleetEntry(m).owned - fleetEntry(m).assigned, cost:FR[m].cost }));
    cands.sort((a, b) => (b.owned > 0) - (a.owned > 0) || Math.abs(a.payload * 5 * W * 1.8 - un) - Math.abs(b.payload * 5 * W * 1.8 - un)); const f = cands[0]; if (!f) return null;
    const fpw = clamp(Math.round(un / (f.payload * 0.85 * W * 1.8)), 2, 7); const cap = Math.min(un, f.payload * fpw * W * 0.9 * 2); const rev = cap * d.yield * 1000 / 1e6; const k = costs({ from, to, plane:f.model, flights:fpw }, cap);
    return { model:f.model, owned:f.owned, cost:f.cost, fpw, cap:Math.round(cap), rev:r2(rev), net:r2(rev - k.fuel - k.crew - k.handling), setup:Math.round(dist * 0.02 + 3), unserved:Math.round(un), yield:r2(d.yield), mix:d.mix, needs:Object.keys(d.by).filter(k => !certified(k)) }; }

  function estimate(from, to, plane, flights){ if (!from || !to || !plane || from === to || !CITIES[from] || !CITIES[to] || !spec(plane)) return null; const d = demand(from, to); const l = { from, to, plane, flights:clamp(flights | 0 || 3, 1, 14) };
    const cap = laneCapacity(l); const tons = Math.min(cap, d.sellable); const rev = tons * d.yield * 1000 / 1e6; const k = costs(l, tons); const dist = d.dist;
    return { cap:Math.round(cap), tons:Math.round(tons), demand:Math.round(d.sellable), lf:cap ? tons / cap : 0, yield:r2(d.yield), rev:r2(rev), cost:r2(k.fuel + k.crew + k.handling), net:r2(rev - k.fuel - k.crew - k.handling), setup:Math.round(dist * 0.02 + 3), dist:Math.round(dist), inRange:spec(plane).range >= dist, mix:d.mix, needs:Object.keys(d.by).filter(x => !certified(x)) }; }

  function cargoLines(){ const l = C().last || {}; const out = []; if (l.lanes) out.push(['Cargo lanes', l.lanes]); if (l.belly) out.push(['Belly cargo', l.belly]); if (l.contracts) out.push(['Cargo contracts', l.contracts]); if (l.charters) out.push(['Cargo charters', l.charters]); return out; }

  function decorateBudget(r){
    const i = r.inc.findIndex(x => /^Cargo routes/.test(x[0]));
    const parts = cargoLines(); const l = C().last || {};
    if (parts.length) {
      if (i >= 0) r.inc.splice(i, 1, ...parts); else r.inc.push(...parts);
      if (l.penalties) r.exp.push(['Cargo contract penalties', l.penalties]);
      r.incTot = r.inc.reduce((s, x) => s + x[1], 0);
      r.expTot = r.exp.reduce((s, x) => s + x[1], 0);
      r.net = r.incTot - r.expTot;
    }
    return r;
  }

  /* ── install ────────────────────────────────────────────────── */
  function install(){
    if (typeof processCargoRoutes !== 'function' || typeof STATE === 'undefined') { setTimeout(install, 200); return; }
    // Cargo Hub building: it now sets hub freight throughput and belly cargo already pays per route,
    // so its old flat "belly-cargo revenue" is trimmed rather than paid on top of the new model.
    try { if (typeof CITY_BUILDINGS !== 'undefined') { const b = CITY_BUILDINGS.find(x => x.id === 'cargo_hub'); if (b && !b.__aeCargo) { b.__aeCargo = true; b.passiveIncome = 1.5;
      b.desc = 'Freight terminal capacity: raises how many tonnes a month this hub can move (' + CAT.hubTonnes.join(' / ') + ' t) and adds a small handling income. Belly cargo on routes through here pays on its own.'; } } } catch (e) {}
    C();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();

  window.AECargo = { cashflowLines:cargoLines, decorateBudget, C, lanes, FR, COM, COMK, CAT, techFx, certified, certName, isFreighter, spec, payload, ident, hero, listedFreighter, fleetEntry, freeCount, fleetList, freighterCount, laneAircraftChoices,
    demand, estimate, mixFor, hubLevel, diff, rivalShare, allianceMult, trust:who => clamp((C().rep[who] || 0), -4, 6), hubCap, laneCapacity, reservedOn, laneFor, offerCheck, accept, cancel, refreshOffers, convFee, convMonths, convert, buy, sell, openLane, closeLane, setFlights, swapPlane, market, plan, tick, version:'v01' };
})();
