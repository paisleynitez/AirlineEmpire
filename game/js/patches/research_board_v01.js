/* RESEARCH_BOARD_v01 — makes research real and replaces the sidebar "Research" window
   with the Tech Board (prototype D): rows are tracks, columns are levels 1-5, a drawer on
   the right starts research / installs the upgrade that node unlocks.

   Engine (this file, data in js/data/researchCatalog.js):
     • STATE.research = { done:[], run:{id:monthsLeft}, owned:[] }  (lazy, save-compatible)
     • STATE.researchPoints is the balance; income each month = rpBase + rpPerAircraft × fleet + upgrade bonus
     • endTurn wrapper: applies modifiers, then (only if the month advanced) counts down running
       programs, completes them, pays research income, charges upgrade upkeep
     • Modifiers are applied by scaling the live tunables (ECON fuel/crew, check costs, incident odds)
       relative to the last applied multiplier, so Dev Tuner edits still stick; demand, health wear,
       grounding length and storm overflight go through small wrappers.
   Window: sidebar Research → AEResearchBoard.open(); the old regional-projects window stays
   reachable from the REGIONAL PROJECTS button in the sub-header. Fixed-size frame (dataset.aeFixed)
   so popup_stability hard-pins it; the board scrolls inside. */
(function researchBoardV01(){
  'use strict';
  if (window.AEResearchBoard) return;
  const CAT = window.AE_RESEARCH_CATALOG;
  if (!CAT) { console.error('[research-board] catalogue missing (js/data/researchCatalog.js)'); return; }
  const CFG = CAT.cfg;
  const byId = {}; CAT.research.forEach(r => byId[r.id] = r); CAT.upgrades.forEach(u => byId[u.id] = u);
  const UNLOCKED_BY = {}; CAT.research.forEach(r => { if (r.unlocks) UNLOCKED_BY[r.unlocks] = r.id; });
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtM = n => '$' + (Math.round(n * 10) / 10) + 'M';
  function st(){ return (typeof STATE !== 'undefined' && STATE) ? STATE : null; }

  /* ── state ─────────────────────────────────────────────────── */
  function R(){
    const S = st(); if (!S) return { done:[], run:{}, owned:[] };
    if (!S.research || typeof S.research !== 'object') S.research = { done:[], run:{}, owned:[] };
    const r = S.research;
    if (!Array.isArray(r.done)) r.done = [];
    if (!r.run || typeof r.run !== 'object') r.run = {};
    if (!Array.isArray(r.owned)) r.owned = [];
    if (!Number.isFinite(S.researchPoints)) S.researchPoints = CFG.startRP;
    return r;
  }
  const isDone = id => R().done.includes(id);
  const isOwned = id => R().owned.includes(id);
  const running = () => Object.keys(R().run).length;
  function trackRows(t){ return CAT.research.filter(r => r.track === t).sort((a,b) => a.lvl - b.lvl); }
  function isReady(r){ return !isDone(r.id) && !R().run[r.id] && trackRows(r.track).filter(x => x.lvl < r.lvl).every(x => isDone(x.id)); }
  function fleetCount(){ const S = st(); return Object.values((S && S.planes) || {}).reduce((a,p) => a + (p.owned || 0), 0); }
  function rpIncome(){ return Math.round(CFG.rpBase + CFG.rpPerAircraft * fleetCount() + mods().rp); }
  function upkeep(){ return R().owned.reduce((a,id) => a + ((byId[id] && byId[id].upkeep) || 0), 0); }

  /* ── modifiers ─────────────────────────────────────────────── */
  function mods(){
    const m = { fuel:1, crew:1, maint:1, maintEngine:1, incident:1, wear:0, ground:1, demand:1, weather:1, rp:0 };
    const r = R();
    [...r.done, ...r.owned].forEach(id => { const it = byId[id]; if (!it || !it.fx) return; const f = it.fx;
      if (f.fuel) m.fuel *= 1 + f.fuel; if (f.crew) m.crew *= 1 + f.crew; if (f.maint) m.maint *= 1 + f.maint;
      if (f.maintEngine) m.maintEngine *= 1 + f.maintEngine; if (f.incident) m.incident *= 1 + f.incident;
      if (f.wear) m.wear = 1 - (1 - m.wear) * (1 - f.wear); if (f.ground) m.ground *= 1 + f.ground;
      if (f.demand) m.demand *= 1 + f.demand; if (f.weather) m.weather *= f.weather; if (f.rp) m.rp += f.rp; });
    return m;
  }
  const APPLIED = { fuel:1, crew:1, maint:1, maintEngine:1, incident:1, weather:1 };
  function scale(obj, key, tag, next){ if (!obj || !Number.isFinite(obj[key])) return; obj[key] = obj[key] / APPLIED[tag] * next; }
  function applyMods(){
    const m = mods();
    try {
      if (typeof ECON !== 'undefined') { scale(ECON, 'fuelPerSeatMile', 'fuel', m.fuel); scale(ECON, 'crewPerFlight', 'crew', m.crew); scale(ECON, 'crewPerMile', 'crew', m.crew); }
      if (typeof MAINTENANCE_CHECKS !== 'undefined') { Object.keys(MAINTENANCE_CHECKS).forEach(k => { if (k !== 'engine') scale(MAINTENANCE_CHECKS[k], 'cost', 'maint', m.maint); }); scale(MAINTENANCE_CHECKS.engine, 'cost', 'maint', m.maint); scale(MAINTENANCE_CHECKS.engine, 'cost', 'maintEngine', m.maintEngine); }
      if (typeof MAINTENANCE_INCIDENTS !== 'undefined') MAINTENANCE_INCIDENTS.forEach(inc => { if (inc.sev !== 'good') scale(inc, 'prob', 'incident', m.incident); });
      if (window.AEWX && Number.isFinite(window.AEWX.OVERFLIGHT_MOD)) { const basePen = (1 - window.AEWX.OVERFLIGHT_MOD) / APPLIED.weather; window.AEWX.OVERFLIGHT_MOD = 1 - basePen * m.weather; }
    } catch (e) { console.warn('[research-board] applyMods', e); }
    APPLIED.fuel = m.fuel; APPLIED.crew = m.crew; APPLIED.maint = m.maint; APPLIED.maintEngine = m.maintEngine; APPLIED.incident = m.incident; APPLIED.weather = m.weather;
  }

  /* ── wrappers ──────────────────────────────────────────────── */
  function wrapDemand(){
    const o = window.crewMoraleDemandMult; if (typeof o !== 'function' || o.__aeRB) return;
    const w = function(){ return o.apply(this, arguments) * mods().demand; }; w.__aeRB = true; window.crewMoraleDemandMult = w;
  }
  function wrapMaint(){
    const o = window.maintTick; if (typeof o !== 'function' || o.__aeRB) return;
    const w = function(){
      const S = st(); const m = mods(); const before = {};
      if (S && S.fleetHealth) Object.keys(S.fleetHealth).forEach(k => { const h = S.fleetHealth[k]; before[k] = { health:h.health, g:h.groundedUntil }; });
      const r = o.apply(this, arguments);
      if (S && S.fleetHealth && (m.wear > 0 || m.ground < 1)) { const abs = S._absMonth || 0;
        Object.keys(S.fleetHealth).forEach(k => { const h = S.fleetHealth[k], b = before[k]; if (!b) return;
          const loss = b.health - h.health; if (loss > 0 && m.wear > 0) h.health = Math.min(b.health, h.health + loss * m.wear);
          if (m.ground < 1 && h.groundedUntil > (b.g || 0) && h.groundedUntil > abs) { const len = h.groundedUntil - abs; h.groundedUntil = abs + Math.max(1, Math.round(len * m.ground)); } }); }
      return r;
    }; w.__aeRB = true; window.maintTick = w;
  }
  function wrapEndTurn(){
    const o = window.endTurn; if (typeof o !== 'function' || o.__aeRB) return;
    const w = function(){
      applyMods();
      const S = st(); const abs0 = S ? (S._absMonth || 0) : 0;
      const r = o.apply(this, arguments);
      try { if (S && (S._absMonth || 0) > abs0) monthTick(); } catch (e) { console.error('[research-board] monthTick', e); }
      return r;
    }; w.__aeRB = true; window.endTurn = w;
  }
  function monthTick(){
    const S = st(); const r = R();
    Object.keys(r.run).forEach(id => { r.run[id] -= 1; if (r.run[id] <= 0) { delete r.run[id]; if (!r.done.includes(id)) r.done.push(id);
      const it = byId[id]; if (it && typeof addEvent === 'function') addEvent('good', '🔬 Research complete: ' + it.name + ' — ' + it.fxText.join(', '));
      if (it && typeof showFlash === 'function') showFlash('🔬 ' + it.name + ' complete'); } });
    const inc = rpIncome(); S.researchPoints = (S.researchPoints || 0) + inc;
    const up = upkeep(); if (up > 0) { S.cash -= up; if (typeof addEvent === 'function') addEvent('neutral', '🏗 Facility upkeep: ' + fmtM(up) + ' for ' + r.owned.length + ' installed upgrade' + (r.owned.length === 1 ? '' : 's')); }
    applyMods();
  }
  function wrapNav(){
    const o = window.navGo; if (typeof o !== 'function' || o.__aeRB) return false;
    const w = function(el, key){
      if (key === 'research') { if (el && el.parentElement) { el.parentElement.querySelectorAll('.ae-nav-item').forEach(n => n.classList.remove('active')); el.classList.add('active'); } open(); return; }
      return o.apply(this, arguments);
    }; w.__aeRB = true; window.navGo = w; return true;
  }
  function wrapClose(){
    const o = window.closeModal; if (typeof o !== 'function' || o.__aeRB) return;
    const w = function(){ const r = o.apply(this, arguments); unsize(); return r; }; w.__aeRB = true; window.closeModal = w;
    /* another window taking #modal-content (e.g. REGIONAL PROJECTS) must not inherit our frame */
    const oo = window.openModal; if (typeof oo !== 'function' || oo.__aeRB) return;
    const wo = function(){ unsize(); return oo.apply(this, arguments); }; wo.__aeRB = true; window.openModal = wo;
  }

  /* ── actions ───────────────────────────────────────────────── */
  const UI = { sel:null };
  function start(id){ const it = byId[id]; const S = st(); if (!it || !S) return;
    if (!isReady(it)) return flash('Finish the earlier level first');
    if (running() >= CFG.slots) return flash('Both research slots are busy');
    if ((S.researchPoints || 0) < it.rp) return flash('Not enough research points');
    S.researchPoints -= it.rp; R().run[id] = it.months;
    if (typeof addEvent === 'function') addEvent('neutral', '🔬 Research started: ' + it.name + ' (' + it.months + ' months)');
    rerender(); }
  function buy(id){ const it = byId[id]; const S = st(); if (!it || !S || isOwned(id)) return;
    const need = UNLOCKED_BY[id]; if (need && !isDone(need)) return flash('Requires ' + byId[need].name);
    if ((S.cash || 0) < it.cash) return flash('Not enough cash');
    S.cash -= it.cash; R().owned.push(id); applyMods();
    if (typeof addEvent === 'function') addEvent('good', '🏗 Installed: ' + it.name + ' — ' + it.fxText.join(', '));
    if (typeof updateUI === 'function') { try { updateUI(); } catch (e) {} }
    rerender(); }
  function flash(m){ if (typeof showFlash === 'function') showFlash(m); }

  /* ── window ────────────────────────────────────────────────── */
  function open(){
    if (typeof closeModal === 'function') closeModal();
    const ov = document.getElementById('modal-overlay'), c = document.getElementById('modal-content'); if (!ov || !c) return;
    if (!UI.sel) { const first = CAT.research.find(isReady) || CAT.research[0]; UI.sel = first.id; }
    ov.classList.add('open'); c.classList.add('modal-research-board'); c.innerHTML = render(); size(); }
  function size(){ const c = document.getElementById('modal-content'); if (!c) return;
    c.style.removeProperty('transform');
    c.style.setProperty('width', 'min(1145px, 96vw)', 'important'); c.style.setProperty('max-width', 'min(1145px, 96vw)', 'important');
    c.style.setProperty('height', 'min(718px, 92vh)', 'important'); c.style.setProperty('max-height', 'min(718px, 92vh)', 'important');
    c.dataset.aeFixed = '1'; c._rbSized = true; }
  function unsize(){ const c = document.getElementById('modal-content'); if (!c || !c._rbSized) return;
    ['width','max-width','height','max-height'].forEach(p => c.style.removeProperty(p)); delete c.dataset.aeFixed; c._rbSized = false; c.classList.remove('modal-research-board'); }
  function rerender(){ const c = document.getElementById('modal-content'); if (!c || !c.classList.contains('modal-research-board')) return;
    const b = c.querySelector('.rb-body'); const sc = b ? b.scrollTop : 0; c.innerHTML = render(); const b2 = c.querySelector('.rb-body'); if (b2) b2.scrollTop = sc; }
  function select(id){ UI.sel = id; rerender(); }

  function render(){
    const S = st(); const r = R(); const run = running();
    const head = (typeof modalHead === 'function') ? modalHead('🔬 RESEARCH &amp; UPGRADES') : '';
    const dots = Array.from({length: CFG.slots}, (_, i) => '<i class="' + (i < run ? 'on' : '') + '"></i>').join('');
    let board = '<div class="rb-colh"></div>' + [1,2,3,4,5].map(l => '<div class="rb-colh">LEVEL ' + l + '</div>').join('');
    CAT.tracks.forEach(t => { const rows = trackRows(t.id);
      board += '<div class="rb-rowh"><b>' + t.icon + ' ' + esc(t.name) + '</b><small>' + esc(t.sm) + '</small></div>';
      for (let l = 1; l <= 5; l++) { const x = rows.find(q => q.lvl === l);
        if (!x) { board += '<div class="rb-node locked"><span class="rb-st">RESERVED</span><h4>Reserved</h4><small>Future program</small></div>'; continue; }
        const done = isDone(x.id), left = r.run[x.id], ready = isReady(x);
        const cls = done ? 'done' : left ? 'run' : ready ? 'next' : 'locked';
        board += '<div class="rb-node ' + cls + (UI.sel === x.id ? ' sel' : '') + '" onclick="AEResearchBoard.select(\'' + x.id + '\')">' +
          '<span class="rb-st">' + (done ? 'DONE' : left ? left + ' MO LEFT' : ready ? 'READY' : 'LOCKED') + '</span><h4>' + esc(x.name) + '</h4><small>' + esc(x.fxText[0]) + '</small>' +
          (left ? '<div class="rb-bar"><i style="width:' + Math.round(100 - left / x.months * 100) + '%"></i></div>' : '') + '</div>'; } });
    const x = byId[UI.sel] || CAT.research[0]; const T = CAT.tracks.find(t => t.id === x.track); const rows = trackRows(x.track);
    const done = isDone(x.id), left = r.run[x.id], ready = isReady(x); const prev = rows.find(q => q.lvl === x.lvl - 1);
    const can = ready && run < CFG.slots && (S.researchPoints || 0) >= x.rp;
    const u = x.unlocks ? byId[x.unlocks] : null;
    const drawer = '<div class="rb-hd"><div class="rb-k">' + esc(T.name).toUpperCase() + ' · LEVEL ' + x.lvl + '</div><h2>' + esc(x.name) + '</h2></div>' +
      '<div class="rb-card"><p>' + esc(x.desc) + '</p><div class="rb-fx">' + x.fxText.map(esc).map(f => '<span>' + f + '</span>').join('') + '</div>' +
      '<div class="rb-kv"><span>Cost</span><b>' + x.rp.toLocaleString() + ' RP</b></div><div class="rb-kv"><span>Duration</span><b>' + x.months + ' months</b></div><div class="rb-kv"><span>Requires</span><b>' + (prev ? esc(prev.name) : 'Nothing') + '</b></div>' +
      (done ? '<div class="rb-btn done">COMPLETED</div>' : left ? '<div class="rb-btn ghost">' + left + ' MONTH' + (left === 1 ? '' : 'S') + ' LEFT</div>' :
        '<button class="rb-btn"' + (can ? '' : ' disabled') + ' onclick="AEResearchBoard.start(\'' + x.id + '\')"><b>' + x.rp.toLocaleString() + ' RP</b>' + (ready ? (run >= CFG.slots ? 'SLOTS BUSY' : 'START RESEARCH') : 'LOCKED') + '</button>') + '</div>' +
      (u ? '<div class="rb-card"><span class="rb-tag up">UNLOCKS UPGRADE · AIRLINE-WIDE</span><h3>' + esc(u.name) + '</h3><p>' + esc(u.desc) + '</p><div class="rb-fx">' + u.fxText.map(esc).map(f => '<span>' + f + '</span>').join('') + '<span class="m">' + fmtM(u.upkeep) + '/mo upkeep</span></div>' +
        (isOwned(u.id) ? '<div class="rb-btn done">INSTALLED</div>' : '<button class="rb-btn"' + (done && (S.cash || 0) >= u.cash ? '' : ' disabled') + ' onclick="AEResearchBoard.buy(\'' + u.id + '\')"><b>' + fmtM(u.cash) + '</b>' + (done ? ((S.cash || 0) >= u.cash ? 'INSTALL' : 'NOT ENOUGH CASH') : 'NEEDS RESEARCH') + '</button>') + '</div>' : '');
    const installed = r.owned.map(id => byId[id]).filter(Boolean);
    return head +
      '<div class="rb-sub"><div><div class="rb-k">TECH BOARD</div><div class="rb-t">Click a node for details.</div></div>' +
      '<div class="rb-stat"><div><small>POINTS</small><b>' + Math.round(S.researchPoints || 0).toLocaleString() + ' RP</b><em>+' + rpIncome() + '/mo</em></div>' +
      '<div><small>SLOTS</small><b>' + run + ' / ' + CFG.slots + '</b><span class="rb-slots">' + dots + '</span></div>' +
      '<div><small>CASH</small><b class="lime">' + fmtM(S.cash || 0) + '</b></div><div><small>UPKEEP</small><b class="gold">' + fmtM(upkeep()) + '/mo</b></div>' +
      '<button class="rb-btn ghost rb-proj" onclick="openModal(\'projects\')">REGIONAL PROJECTS ›</button></div></div>' +
      '<div class="rb-body"><div class="rb-panel"><div class="rb-hd"><div><div class="rb-k">ALL TRACKS · LEVELS 1–5</div><h2>Technology board</h2></div></div><div class="rb-board">' + board + '</div>' +
      '<div class="rb-hd" style="margin-top:12px"><div><div class="rb-k">INSTALLED UPGRADES</div></div></div><div class="rb-owned">' + (installed.length ? installed.map(i => '<span class="rb-chip">' + esc(i.name) + '<small>' + esc(i.fxText[0]) + '</small></span>').join('') : '<span class="rb-none">Nothing installed yet — complete a program to unlock its upgrade.</span>') + '</div>' +
      '<div class="rb-note">Level N unlocks when levels 1–N−1 in the same row are done. Research costs points and takes months; ' + CFG.slots + ' programs may run at once. Points come in every month (' + CFG.rpBase + ' + ' + CFG.rpPerAircraft + ' per aircraft). Upgrades are bought with cash and charge monthly upkeep.</div></div>' +
      '<div class="rb-panel rb-drawer">' + drawer + '</div></div>';
  }

  /* ── install ───────────────────────────────────────────────── */
  function init(){
    if (typeof window.navGo !== 'function' || typeof window.endTurn !== 'function') { setTimeout(init, 250); return; }
    wrapNav(); wrapEndTurn(); wrapMaint(); wrapDemand(); wrapClose();
    const o = window.applySave;
    if (typeof o === 'function' && !o.__aeRB) { const w = function(){ const r = o.apply(this, arguments); try { applyMods(); } catch (e) {} return r; }; w.__aeRB = true; window.applySave = w; }
    try { if (st()) applyMods(); } catch (e) {}
  }
  window.AEResearchBoard = { open, select, start, buy, mods, applyMods, rerender, version:'v01' };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
