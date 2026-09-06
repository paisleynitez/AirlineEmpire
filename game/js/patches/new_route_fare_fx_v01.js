/* NEW_ROUTE_FARE_FX_v01 (rev B) — UI-only. Fare card gains:
   1) predicted demand/yield effect of the chosen fare vs market fare
   2) underlying demand vs offered capacity, so a 100% load at high fare is
      self-explanatory (capacity-constrained routes stay full until the fare
      cut pushes demand below seats).
   All math replicates the engine's own preview/tick formulas exactly
   (ECON elasticity, distance decay, seasonality, rival split, clamp 0.12–1.75).
   Wraps updateRoutePreview; core functions untouched. */
(function () {
  'use strict';
  if (window.AENewRouteFareFxV01) return;
  window.AENewRouteFareFxV01 = true;

  function fmtPct(x) { return (x > 0 ? '+' : '') + Math.round(x * 100) + '%'; }

  function engineNumbers(from, to, fare) {
    var cf = CITIES[from], ct = CITIES[to];
    if (!cf || !ct) return null;
    var E = ECON;
    var dist = getDistance(from, to);
    var refFare = E.refFareBase + dist * E.refFareDist;
    var mult = Math.max(0.12, Math.min(1.75, 1 + (refFare - fare) / refFare * E.fareElastic));
    var demand = (cf.pop + ct.pop) * E.demandPop + (cf.econ + ct.econ) * E.demandEcon + (cf.tourism + ct.tourism) * E.demandTour;
    demand *= 1 / (1 + dist / E.distDecay);
    demand *= seasonalFactor(ct.region, STATE.month);
    var rivals = STATE.competitors.filter(function (c) { return c.regionsEntered.includes(ct.region); }).length;
    demand *= 1 / (1 + rivals * E.rivalSplit);
    demand *= mult;
    var cap = 0;
    try {
      Object.keys(_nrPlanes || {}).forEach(function (n) {
        var count = _nrPlanes[n] || 0;
        if (!count) return;
        var ac = STATE.planes[n] || AIRCRAFT[n];
        if (ac) cap += ac.seats * count * E.weeksPerMonth;
      });
    } catch (e) { cap = 0; }
    return { refFare: refFare, mult: mult, demand: Math.round(demand), cap: Math.round(cap) };
  }

  function renderFx() {
    try {
      var section = document.querySelector('.modal-new-route .nr-fare-section');
      if (!section) return;
      var from = val('r-from'), to = val('r-to');
      var fare = +val('r-fare') || 0;
      var line = document.getElementById('nr-fare-fx');
      if (!line) {
        line = document.createElement('div');
        line.id = 'nr-fare-fx';
        section.appendChild(line);
      }
      var n = (from && to && fare) ? engineNumbers(from, to, fare) : null;
      if (!n) {
        line.innerHTML = '<span style="color:var(--muted2)">Pick a destination to preview fare effects.</span>';
        return;
      }
      var d = n.mult - 1;
      var y = fare / n.refFare - 1;
      var top;
      if (Math.abs(fare - n.refFare) / n.refFare < 0.02) {
        top = '<b style="color:var(--accent2)">●</b> At market fare — balanced demand and yield.';
      } else if (fare < n.refFare) {
        top = '<b style="color:var(--profit)">▼ Below market:</b> demand <b style="color:var(--profit)">' +
          fmtPct(d) + '</b> · yield/seat <b style="color:var(--loss)">' + fmtPct(y) + '</b>';
      } else {
        top = '<b style="color:var(--warn)">▲ Above market:</b> demand <b style="color:var(--loss)">' +
          fmtPct(d) + '</b> · yield/seat <b style="color:var(--profit)">' + fmtPct(y) + '</b>';
      }
      var capped = n.cap > 0 && n.demand >= n.cap;
      var opFill = (typeof ECON.overpriceSpill === 'number' && fare > n.refFare)
        ? Math.max(ECON.overpriceFloor, 1 - (fare / n.refFare - 1) * ECON.overpriceSpill) : 1;
      var spillNote = opFill < 1
        ? ' · <b style="color:var(--loss)">overprice spill −' + Math.round((1 - opFill) * 100) + '% fill</b>'
        : '';
      var bottom = '<span class="nr-fx-cap">Demand ≈ <b>' + n.demand.toLocaleString() +
        '</b> pax/mo vs <b>' + n.cap.toLocaleString() + '</b> seats' +
        (capped && opFill === 1
          ? ' · <b style="color:var(--accent2)">capacity-limited — plane fills even at this fare</b>'
          : (n.cap > 0 && !capped ? ' · <b style="color:var(--warn)">seats outnumber demand — load drops</b>' : '')) +
        spillNote +
        '</span>';
      line.innerHTML = top + '<br>' + bottom;
    } catch (e) { /* never break the preview */ }
  }

  function install() {
    var orig = window.updateRoutePreview;
    if (typeof orig !== 'function') { setTimeout(install, 250); return; }
    window.updateRoutePreview = function () {
      var r = orig.apply(this, arguments);
      renderFx();
      return r;
    };
    renderFx();
  }
  install();
})();
