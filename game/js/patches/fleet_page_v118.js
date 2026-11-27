/* FLEET_PAGE_v118 — Fleet & Aircraft page condensed onto the sitewide skin, on top of
   fleet_aircraft_v117 (which supplies the toolbar, hero thumbs and tab decoration).
   This layer only: fixes the frame at a compact size (dataset.aeFixed → pinned by popup_stability,
   never dragged), swaps the emoji in the header / tabs / action buttons for line icons, labels the
   action buttons, and tags the summary cards so the CSS can size and tint them.
   All handlers (fleetSetTab, fleetToggleDetail, sellPlane, filters, favourites) are untouched.
   Re-applies after every re-render via a MutationObserver. v2: freighters/conversions band + summary card. Styling: css/fleet-page-v118.css. */
(function fleetPageV118(){
  'use strict';
  if (window.AEFleetPageV118) return;
  window.AEFleetPageV118 = true;
  const CLS = 'ae-flp-v118';
  const I = {
    plane:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14l8-2.3V5.5a1 1 0 012 0v6.2l8 2.3v1.8l-8-1.8v3.2l2.3 1.4v1.4L12 19.4 8.7 20v-1.4L11 17.2V14l-8 1.8z"/></svg>',
    cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h2l2.4 10.5a1 1 0 001 .8h9.6a1 1 0 001-.8L21 8H7"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/></svg>',
    doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>',
    wrench:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a4 4 0 015 5l-8.2 8.2a2 2 0 01-2.8-2.8l8.2-8.2a4 4 0 01-2.2-2.2z"/><path d="M4 20l3-3"/></svg>',
    box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/></svg>',
    tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12l-8 8-8-8V4h8z"/><circle cx="8.5" cy="8.5" r="1.4"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/></svg>',
    dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></svg>'
  };
  const ic = k => '<span class="flp118-ic">' + I[k] + '</span>';
  const TAB_ICONS = { 'my fleet':'plane', 'orders':'cart', 'leases':'doc', 'maintenance':'wrench', 'deliveries':'box', 'aircraft market':'tag' };

  function decorate(m){
    const flp = m.querySelector('.flp'); if (!flp) return;
    const ti = flp.querySelector('.flp-title-ic'); if (ti && !ti.dataset.v118) { ti.dataset.v118 = '1'; ti.innerHTML = I.plane; }
    flp.querySelectorAll('.flp-tab').forEach(t => { const s = t.querySelector('.ae-fleet-tab-icon'); const key = TAB_ICONS[(t.textContent || '').toLowerCase().replace(/[^a-z ]/g, '').trim()]; if (s && key && !s.dataset.v118) { s.dataset.v118 = '1'; s.innerHTML = I[key]; s.classList.add('flp118-ic'); } });
    flp.querySelectorAll('.flp-sum').forEach(s => { const k = (s.querySelector('.flp-sum-k') || {}).textContent || ''; s.classList.add('flp118-sum'); s.classList.toggle('is-owned', /owned/i.test(k)); s.classList.toggle('is-leased', /leased/i.test(k)); s.classList.toggle('is-order', /order/i.test(k)); });
    cargoBits(flp);
    flp.querySelectorAll('.flp-iconbtn').forEach(b => { if (b.dataset.v118) return; b.dataset.v118 = '1'; const t = (b.getAttribute('title') || '').toLowerCase();
      if (/detail/.test(t)) { b.innerHTML = ic('search') + '<span>Details</span>'; b.classList.add('flp118-btn'); }
      else if (/sell/.test(t)) { b.innerHTML = ic('dots') + '<span>Sell 1</span>'; b.classList.add('flp118-btn', 'is-sell'); } });
  }
  /* Freighters and conversions (systems/cargo.js) shown on the Fleet page: a fifth summary card and,
     on My Fleet, a read-only band under the passenger table linking to the Cargo Network window. */
  function cargoBits(flp){ const A = window.AECargo; if (!A) return; const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const c = A.C(); const list = A.fleetList().filter(a => a.owned > 0); const n = list.reduce((s, a) => s + a.owned, 0); const conv = c.conversions || [];
    const sum = flp.querySelector('.flp-summary'); if (sum && !sum.querySelector('.is-cargo')) { const d = document.createElement('div'); d.className = 'flp-sum flp118-sum is-cargo'; d.innerHTML = '<div class="flp-sum-k">Freighters</div><div class="flp-sum-v"></div>'; sum.appendChild(d); }
    const card = sum && sum.querySelector('.is-cargo .flp-sum-v'); if (card) { const txt = String(n) + (conv.length ? ' <small>+' + conv.length + ' conv.</small>' : ''); if (card.innerHTML !== txt) card.innerHTML = txt; }
    const body = flp.querySelector('.flp-body'); const onFleet = !!(body && body.querySelector('.flp-c-type')); let band = flp.querySelector('.flp118-cargo');
    if (!onFleet || (!list.length && !conv.length)) { if (band) band.remove(); return; }
    const sig = JSON.stringify([list.map(a => [a.model, a.owned, a.assigned]), conv.map(x => [x.from, x.left])]); if (band && band.dataset.sig === sig) return;
    if (!band) { band = document.createElement('div'); band.className = 'flp118-cargo'; body.appendChild(band); } band.dataset.sig = sig;
    const lanesFor = m => A.lanes().filter(l => l.plane === m).length;
    band.innerHTML = '<div class="flp118-cargo-hd"><span>' + I.box + '</span><b>Freighters &amp; conversions</b><span class="flp118-dim">managed in the Cargo Network</span><button class="flp118-btn" onclick="AECargoWindow.open(\'freighters\')">' + I.box + '<span>Open Cargo</span></button></div>' +
      list.map(a => '<div class="flp118-cargo-row"><div class="flp118-cargo-thumb">' + (a.hero ? '<img src="' + esc(a.hero) + '" alt="">' : '') + '</div><div><b>' + esc(a.ident.name) + '</b> <span class="flp118-dim">' + esc(a.model) + '</span></div><div>' + a.payload + ' t payload</div><div>' + a.owned + ' owned · ' + (a.owned - a.assigned) + ' free</div><div>' + lanesFor(a.model) + (lanesFor(a.model) === 1 ? ' lane' : ' lanes') + '</div></div>').join('') +
      conv.map(x => '<div class="flp118-cargo-row is-conv"><div class="flp118-cargo-thumb">' + (A.hero(x.to) ? '<img src="' + esc(A.hero(x.to)) + '" alt="">' : '') + '</div><div><b>' + esc(x.from) + ' → ' + esc(x.to) + '</b> <span class="flp118-dim">in conversion</span></div><div class="flp118-cargo-bar"><i style="width:' + Math.round((x.total - x.left) / x.total * 100) + '%"></i></div><div>' + x.left + ' of ' + x.total + ' mo left</div><div></div></div>').join(''); }
  function size(m){ m.style.setProperty('width', 'min(1000px, 96vw)', 'important'); m.style.setProperty('max-width', 'min(1000px, 96vw)', 'important'); m.style.setProperty('height', 'min(640px, 92vh)', 'important'); m.style.setProperty('max-height', 'min(640px, 92vh)', 'important'); m.dataset.aeFixed = '1'; m._flp118 = true; }
  function unsize(m){ if (!m || !m._flp118) return; ['width','max-width','height','max-height'].forEach(p => m.style.removeProperty(p)); delete m.dataset.aeFixed; m._flp118 = false; m.classList.remove(CLS); }

  let pending = false;
  function tick(){ pending = false; const m = document.getElementById('modal-content'); if (!m) return;
    const has = !!m.querySelector('.flp');
    if (has) { if (!m.classList.contains(CLS)) { m.classList.add(CLS); size(m); } decorate(m); }
    else if (m._flp118) unsize(m); }
  function schedule(){ if (pending) return; pending = true; requestAnimationFrame(tick); }
  function init(){ const m = document.getElementById('modal-content'); if (!m) { setTimeout(init, 250); return; }
    new MutationObserver(schedule).observe(m, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    const oc = window.closeModal; if (typeof oc === 'function' && !oc.__aeFlp118) { const w = function(){ const r = oc.apply(this, arguments); unsize(document.getElementById('modal-content')); return r; }; w.__aeFlp118 = true; window.closeModal = w; }
    // Stock sellPlane() ends by swapping the modal to the Buy Aircraft window. When the sale was
    // made from the Fleet page, stay on the Fleet page (same tab) instead.
    const os = window.sellPlane; if (typeof os === 'function' && !os.__aeFlp118) { const w = function(){
      const onFleet = !!(m.querySelector('.flp')); const r = os.apply(this, arguments);
      if (onFleet && typeof window.buildFleetPage === 'function') { try { m.innerHTML = window.buildFleetPage(); } catch (e) {} }
      return r; }; w.__aeFlp118 = true; window.sellPlane = w; }
    schedule(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
