/* FLEET_ROW_CLEANUP_v01 — fixes two display bugs in the Fleet & Aircraft rows:
   • Monthly profit showed "$0k" while the footer shows "$0M" — row values are
     re-formatted to $M with one decimal (e.g. $1,250k → $1.3M, $0k → $0.0M),
     matching the footer's unit.
   • The utilization bar always drew a minimum 4% fill, contradicting a 0.0
     hrs/mo value — at zero utilization the bar is now empty.
   UI-only: wraps fleetApplyFilters() (the sole row renderer) and rewrites the
   already-rendered cells; no game numbers or handlers change. Layout fixes for
   the same table live in css/fleet-compact-v01.css. */
(function fleetRowCleanupV01(){
  'use strict';
  if (window.AEFleetRowCleanupV01) return;
  window.AEFleetRowCleanupV01 = true;

  function normalize(){
    document.querySelectorAll('#flp-rows .flp-row').forEach(row => {
      // Profit "$Nk" -> "$N.NM" (sign preserved)
      row.querySelectorAll('.flp-c-big').forEach(big => {
        const m = (big.textContent || '').trim().match(/^\$(-?)([\d,]+)k$/);
        if (!m) return;
        const k = parseInt(m[2].replace(/,/g, ''), 10) * (m[1] ? -1 : 1);
        const mVal = k / 1000;
        big.textContent = (mVal < 0 ? '-$' : '$') + Math.abs(mVal).toFixed(1) + 'M';
      });
      // Utilization bar: empty at 0.0 hrs/mo
      const utilCell = row.querySelector('.flp-c-util');
      if (utilCell) {
        const v = parseFloat((utilCell.querySelector('.flp-c-big') || {}).textContent || '');
        const bar = utilCell.querySelector('.flp-util-bar i');
        if (bar && v === 0) bar.style.width = '0%';
      }
    });
  }

  function wrap(){
    const orig = window.fleetApplyFilters;
    if (typeof orig !== 'function' || orig.__aeRowCleanup) return false;
    const w = function(){
      const out = orig.apply(this, arguments);
      try { normalize(); } catch (e) { /* leave stock rendering */ }
      return out;
    };
    w.__aeRowCleanup = true;
    window.fleetApplyFilters = w;
    return true;
  }

  function init(){ if (!wrap()) setTimeout(init, 250); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
