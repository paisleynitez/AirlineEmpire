/* REAL_DEV_v01 — "Real Dev" tab inside the ⚙ Tune panel.
   Live-edits the values that actually drive a running game: player cash / loan /
   reputation / research points, the fuel multiplier, every aircraft's purchase
   price (plus a one-shot global multiplier), rival aggression, and the three
   budget sliders. Edits apply immediately to the live STATE / AIRCRAFT tables and
   refresh the UI; nothing is persisted beyond the current game (saves carry the
   STATE values as usual — aircraft prices are table edits and reset on reload).
   Adds a tab next to the existing tuner tabs and renders into #dt-body. */
(function realDevV01(){
  'use strict';
  if (window.AERealDevV01) return;
  const API = window.AERealDevV01 = { version: 'v01', _acts: {}, _tab: null };

  function S(){ try { return (typeof STATE !== 'undefined') ? STATE : null; } catch(e){ return null; } }
  function AC(){ try { return (typeof AIRCRAFT !== 'undefined') ? AIRCRAFT : null; } catch(e){ return null; } }
  function IDN(){ try { return (typeof AIRCRAFT_IDENTITY !== 'undefined') ? AIRCRAFT_IDENTITY : {}; } catch(e){ return {}; } }
  function flash(m){ try { if (typeof window.showFlash === 'function') window.showFlash(m); } catch(e){} }
  function refresh(){ try { if (typeof window.updateUI === 'function') window.updateUI(); } catch(e){} }
  function call(fn){ try { fn(); } catch(e){ console.error('[RealDev]', e); flash('Real Dev: ' + (e && e.message || e)); } }

  let basePrices = null;
  function snapshotPrices(){ const ac = AC(); if (!ac || basePrices) return; basePrices = {}; Object.keys(ac).forEach(k => basePrices[k] = ac[k].cost); }

  function installStyles(){
    if (document.getElementById('ae-real-dev-v01-style')) return;
    const st = document.createElement('style'); st.id = 'ae-real-dev-v01-style';
    st.textContent = `
      .rdv-head{margin:8px 0 3px;font:800 9.5px Inter,system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#a99dc0}
      .rdv-note{font-size:9.5px;color:#7f7896;margin:2px 0 6px;line-height:1.4}
      .rdv-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04)}
      .rdv-row .rdv-l{flex:1 1 auto;font:600 10.5px Inter,system-ui,sans-serif;color:#e8e2f3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
      .rdv-row .rdv-l small{display:block;font-weight:500;font-size:9px;color:#7f7896;letter-spacing:.3px}
      #dt-body input.rdv-num{width:84px!important;min-width:0!important;flex:0 0 84px!important;height:24px!important;padding:2px 6px!important;margin:0!important;border:1px solid rgba(160,148,184,.28)!important;border-radius:5px!important;background:rgba(0,0,0,.35)!important;color:#fff!important;font:700 10.5px 'DM Mono',monospace!important;text-align:right!important;box-shadow:none!important}
      .rdv-row{min-width:0}
      #dt-body input.rdv-num:focus{outline:none!important;border-color:#78d9cc!important}
      #dt-body input.rdv-num.rdv-changed{border-color:#ffcf5a!important;color:#ffcf5a!important}
      .rdv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:4px 0 8px}
      .rdv-btn{padding:6px 7px;border:1px solid rgba(160,148,184,.22);border-radius:6px;background:rgba(255,255,255,.035);color:#e8e2f3;font:600 10.5px Inter,system-ui,sans-serif;text-align:center;cursor:pointer;white-space:nowrap}
      .rdv-btn:hover{border-color:rgba(120,217,204,.6);color:#fff;background:rgba(120,217,204,.12)}
      .rdv-btn.warn{border-color:rgba(255,207,90,.4)}
      .rdv-list{max-height:260px;overflow-y:auto;padding-right:2px;margin-bottom:6px}
      #dt-tabs{flex-wrap:wrap!important}
      #dev-tuner .dt-tab{padding:8px 3px!important;font-size:10.8px!important;letter-spacing:.4px!important;white-space:nowrap}
      #dev-tuner .dt-tab[data-tab="realdev"]{color:#ffcf5a}
      #dev-tuner .dt-tab[data-tab="realdev"].active{color:#fff;border-bottom-color:#ffcf5a}
    `;
    document.head.appendChild(st);
  }

  function num(id, label, get, set, min, max, step, sub){
    API._acts[id] = { get, set, min, max };
    const v = get();
    return `<div class="rdv-row"><div class="rdv-l">${label}${sub ? `<small>${sub}</small>` : ''}</div>
      <input class="rdv-num" type="number" data-rdv="${id}" min="${min}" max="${max}" step="${step}" value="${(v === undefined || v === null || isNaN(v)) ? '' : v}"></div>`;
  }
  function btn(label, fn, cls){ const id = 'b_' + Math.random().toString(36).slice(2, 8); API._acts[id] = { fn }; return `<button type="button" class="rdv-btn ${cls || ''}" data-rdvb="${id}">${label}</button>`; }

  function html(){
    const s = S(), ac = AC(), idn = IDN();
    if (!s) return '<div class="rdv-note">Start or load a game first — Real Dev edits the live game state.</div>';
    snapshotPrices();
    let h = '<div class="rdv-note">Edits apply instantly to the running game. Yellow = changed this session.</div>';

    h += '<div class="rdv-head">Player</div>';
    h += num('cash', 'Cash', () => s.cash, v => s.cash = v, -100000, 1000000, 10, '$M');
    h += num('loan', 'Loan balance', () => s.loan, v => s.loan = v, 0, 1000000, 10, '$M');
    h += num('maxLoan', 'Credit line', () => s.maxLoan, v => s.maxLoan = v, 0, 1000000, 10, '$M');
    h += num('rep', 'Reputation', () => (s.repScore != null ? s.repScore : s.reputation), v => { s.repScore = v; s.reputation = v; }, 0, 100, 1, '0–100');
    h += num('rp', 'Research points', () => (Number.isFinite(s.researchPoints) ? s.researchPoints : 0), v => s.researchPoints = v, 0, 1000000, 10);
    h += num('cv', 'Company value', () => s.companyValue, v => s.companyValue = v, 0, 10000000, 10, '$M');
    h += '<div class="rdv-grid">' +
      btn('+$100M', () => { s.cash += 100; refresh(); render(); }) +
      btn('+$1B', () => { s.cash += 1000; refresh(); render(); }) +
      btn('Clear loan', () => { s.loan = 0; refresh(); render(); }, 'warn') + '</div>';

    h += '<div class="rdv-head">Fuel</div>';
    h += num('fuelMod', 'Fuel multiplier', () => s.fuelMod, v => s.fuelMod = v, 0.1, 5, 0.05, '1 = normal · applies to every route');
    h += '<div class="rdv-grid">' +
      btn((s._fuelLock ? '■ ' : '▶ ') + 'Lock multiplier', () => { s._fuelLock = !s._fuelLock; render(); }, s._fuelLock ? 'warn' : '') +
      btn('Reset to 1.0', () => { s.fuelMod = 1; s._fuelLock = false; refresh(); render(); }) + '</div>';
    h += '<div class="rdv-note">Unlocked, the game drifts the multiplier back toward 1.0 by 0.1 each month.</div>';

    if (ac) {
      h += '<div class="rdv-head">Aircraft prices</div>';
      h += '<div class="rdv-grid">' +
        btn('× 0.5', () => scalePrices(0.5)) + btn('× 0.75', () => scalePrices(0.75)) + btn('× 2', () => scalePrices(2)) +
        btn('Reset all prices', () => { Object.keys(basePrices).forEach(k => ac[k].cost = basePrices[k]); flash('Aircraft prices reset'); refresh(); render(); }, 'warn') + '</div>';
      h += '<div class="rdv-list">';
      Object.keys(ac).forEach(k => {
        const a = ac[k], i = idn[k] || {};
        h += num('ac_' + k, i.name || k, () => a.cost, v => a.cost = v, 1, 100000, 1, `${k} · ${a.seats} seats · ${(a.range || 0).toLocaleString()} mi`);
      });
      h += '</div>';
      h += '<div class="rdv-note">Purchase price in $M. Table edits — they last until the page reloads.</div>';
    }

    h += '<div class="rdv-head">Rivals</div>';
    if (s.level) h += num('rivalAgg', 'Rival aggression', () => s.level.rivalAgg, v => s.level.rivalAgg = v, 0, 5, 0.1, '1 = Normal · scales rival expansion');
    (s.competitors || []).forEach((c, i) => {
      h += num('rc_' + i, c.name || ('Rival ' + (i + 1)), () => c.cash, v => c.cash = v, -100000, 1000000, 10, 'cash $M');
    });

    if (s.budget) {
      h += '<div class="rdv-head">Budget sliders</div>';
      h += num('bRepair', 'Repair', () => s.budget.repair, v => s.budget.repair = v, 1, 5, 1, '1 = neutral … 5 = max');
      h += num('bAd', 'Advertising', () => s.budget.ad, v => s.budget.ad = v, 1, 5, 1);
      h += num('bService', 'Service', () => s.budget.service, v => s.budget.service = v, 1, 5, 1);
    }

    h += '<div class="rdv-grid" style="margin-top:8px">' + btn('↻ Refresh UI', () => { refresh(); render(); }) + btn('⟳ Re-read values', render) + '</div>';
    return h;
  }
  function scalePrices(m){ const ac = AC(); if (!ac) return; Object.keys(ac).forEach(k => ac[k].cost = Math.max(1, Math.round(ac[k].cost * m))); flash('Aircraft prices × ' + m); refresh(); render(); }

  function render(){
    if (API._tab !== 'realdev') return;
    const body = document.getElementById('dt-body'); if (!body) return;
    API._acts = {};
    body.innerHTML = html();
  }
  function onInput(e){
    const el = e.target.closest && e.target.closest('#dt-body .rdv-num[data-rdv]'); if (!el) return;
    const a = API._acts[el.dataset.rdv]; if (!a) return;
    let v = parseFloat(el.value); if (isNaN(v)) return;
    if (!isNaN(a.min) && v < a.min) v = a.min;
    if (!isNaN(a.max) && v > a.max) v = a.max;
    call(() => { a.set(v); el.classList.add('rdv-changed'); refresh(); });
  }
  function onClick(e){
    const b = e.target.closest && e.target.closest('#dt-body .rdv-btn[data-rdvb]'); if (!b) return;
    const a = API._acts[b.dataset.rdvb]; if (a && a.fn) call(a.fn);
  }
  function installTab(){
    const tabs = document.getElementById('dt-tabs'); if (!tabs || tabs.querySelector('[data-tab="realdev"]')) return;
    const t = document.createElement('div'); t.className = 'dt-tab'; t.dataset.tab = 'realdev'; t.textContent = 'RealDev'; t.setAttribute('onclick', "dtSetTab('realdev')"); tabs.appendChild(t);
  }
  function wrapSetTab(){
    if (window.__aeRealDevWrapped || typeof window.dtSetTab !== 'function') return;
    window.__aeRealDevWrapped = true;
    const native = window.dtSetTab;
    window.dtSetTab = function(t){ API._tab = t; const r = native.apply(this, arguments); render(); return r; };
  }
  function init(){
    installStyles(); installTab(); wrapSetTab();
    document.addEventListener('input', onInput); document.addEventListener('click', onClick);
    let n = 0; const tm = setInterval(function(){ installTab(); wrapSetTab(); if (++n >= 24) clearInterval(tm); }, 250);
  }
  API.render = render;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
