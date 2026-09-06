/* BUY_AIRCRAFT_v02 — route-flow Buy Aircraft rebuilt to the concept:
   header stat chips (cash / fleet / airports), filter + sort + affordable-only
   bar, rich aircraft cards (procedural art, identity, spec chips, route fit,
   "fits N of your routes", ownership), quantity presets + custom, selection
   summary bar (total cost, cash-after, BUY & ASSIGN / BUY), and 2–3-way
   compare. Also preserves the fare slider value across the buy round-trip.
   Native gameplay functions (buyPlaneForRoute etc.) are reused untouched;
   this wraps buildBuyPlanesForRoute / openBuyPlanesForRoute only. */
(function () {
  'use strict';
  if (window.AEBuyAircraftV02) return;
  window.AEBuyAircraftV02 = true;

  var S = { from: '', to: '', filter: 'all', sort: 'rec', afford: false,
            sel: null, qtyMap: {}, compare: [], fare: null, open: {} };

  function qtyOf(n) { return S.qtyMap[n] || 1; }

  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function money(n) { return '$' + Math.round(n).toLocaleString() + 'M'; }

  function fitsRoutes(a) {
    try {
      return (STATE.routes || []).filter(function (r) {
        return a.range >= getDistance(r.from, r.to);
      }).length;
    } catch (e) { return 0; }
  }
  function airportsServed() {
    try {
      var set = {};
      (STATE.hubs || []).forEach(function (h) { set[h] = 1; });
      (STATE.routes || []).forEach(function (r) { set[r.from] = 1; set[r.to] = 1; });
      return Object.keys(set).length;
    } catch (e) { return 0; }
  }
  function fleetCount() {
    return Object.values(STATE.planes || {}).reduce(function (s, p) { return s + (p.owned || 0); }, 0);
  }

  function list() {
    var dist = (S.from && S.to) ? getDistance(S.from, S.to) : 0;
    var rows = Object.entries(AIRCRAFT).filter(function (e) {
      var a = e[1];
      if (typeof acListed === 'function' && !acListed(a)) return false;
      if (a.era > STATE.year) return false;   /* unavailable (future) aircraft hidden entirely */
      if (S.filter === 'short' && a.type !== 'short') return false;
      if (S.filter === 'medium' && a.type !== 'medium') return false;
      if (S.filter === 'long' && a.type !== 'long') return false;
      if (S.filter === 'premium' && a.type !== 'jumbo' && a.type !== 'supersonic') return false;
      if (S.afford && a.cost > STATE.cash) return false;
      return true;
    });
    rows.sort(function (x, y) {
      var a = x[1], b = y[1];
      if (S.sort === 'price') return a.cost - b.cost;
      if (S.sort === 'seats') return b.seats - a.seats;
      if (S.sort === 'range') return b.range - a.range;
      var aOk = dist === 0 || a.range >= dist, bOk = dist === 0 || b.range >= dist;
      if (aOk !== bOk) return aOk ? -1 : 1;
      return a.cost - b.cost;
    });
    return rows;
  }

  function card(n, a) {
    var idn = (typeof acIdentity === 'function' ? acIdentity(n) : null) || { icon: '\u2708', name: n, id: '', theme: '' };
    var p = STATE.planes[n] || {};
    var owned = p.owned || 0, assigned = p.assigned || 0, free = owned - assigned;
    var dist = (S.from && S.to) ? getDistance(S.from, S.to) : 0;
    var hasRoute = dist > 0;
    var inRange = !hasRoute || a.range >= dist;
    var future = a.era > STATE.year;
    var fits = fitsRoutes(a);
    var art = '';
    try {
      var hero = (typeof AC_HERO !== 'undefined') ? AC_HERO[n] : null;
      art = hero ? '<img src="' + hero + '" alt="">'
        : (typeof aircraftSVG === 'function' ? aircraftSVG(n, a, (idn.color2 || '#00d8f0'), true) : '\u2708');
    } catch (e) { art = '\u2708'; }
    var fitLine = hasRoute
      ? (inRange ? '<span class="bav2-fit ok">\u2713 In range for this route</span>'
                 : '<span class="bav2-fit no">\u2717 Too short \u2014 needs ' + Math.round(dist).toLocaleString() + ' mi</span>')
      : '';
    var fitsLine = fits > 0 ? '<span class="bav2-fits">Fits ' + fits + ' of your route' + (fits !== 1 ? 's' : '') + '</span>' : '';
    var cmp = S.compare.indexOf(n) !== -1;
    var qtyRow = '';
    if (!future && inRange) {
      var q = qtyOf(n);
      var d = (typeof bulkPlaneDiscount === 'function') ? bulkPlaneDiscount(n, q) : { pct: 0, total: a.cost * q, base: a.cost * q };
      var tot = d.total;
      var ok = STATE.cash >= tot;
      var tiers = (typeof ECON !== 'undefined' && ECON.bulkDiscount && ECON.bulkDiscount[a.type]) || [];
      var next = null;
      for (var ti = 0; ti < tiers.length; ti++) { if (tiers[ti][0] > q) { next = tiers[ti]; break; } }
      qtyRow = '<div class="bav2-buyrow">' +
        '<span class="bav2-stepper">' +
          '<button class="bav2-st" onclick="AEBA.dec(\'' + esc(n) + '\')" ' + (q > 1 ? '' : 'disabled') + '>\u2212</button>' +
          '<span class="bav2-qn">' + q + '</span>' +
          '<button class="bav2-st" onclick="AEBA.inc(\'' + esc(n) + '\')">+</button>' +
        '</span>' +
        '<button class="bav2-cardbuy" ' + (ok ? 'onclick="AEBA.buyNow(\'' + esc(n) + '\')"' : 'disabled title="Need ' + money(tot) + '"') + '>BUY ' + q + ' <i>\u00b7</i> <em>' + money(tot) + '</em>' +
          (d.pct ? '<b class="bav2-off">\u2212' + d.pct + '%</b>' : '') + '</button>' +
        (next ? '<span class="bav2-tier">' + next[0] + '+ \u2192 \u2212' + next[1] + '%</span>' : '') +
        '</div>';
    } else if (future) {
      qtyRow = '<div class="bav2-cant warn">Not yet available \u2014 avail. ' + a.era + '</div>';
    } else {
      qtyRow = '<div class="bav2-cant">Cannot serve this route at ' + a.range.toLocaleString() + ' mi range</div>';
    }
    var isOpen = !!S.open[n];
    return '<div class="bav2-card' + ((!inRange || future) ? ' dim' : '') + '">' +
      '<div class="bav2-art">' + art +
        '<label class="bav2-cmp"><input type="checkbox" ' + (cmp ? 'checked' : '') + ' onchange="AEBA.cmp(\'' + esc(n) + '\')"> Compare</label></div>' +
      '<div class="bav2-main">' +
        '<div class="bav2-nm">' + idn.icon + ' ' + idn.name + '</div>' +
        '<div class="bav2-theme">' + (idn.theme || '').toUpperCase() +
          '<span class="bav2-mm"> \u00b7 ' + n + ' \u00b7 ' + a.type + '</span>' +
          '<button class="bav2-chev' + (isOpen ? ' open' : '') + '" onclick="AEBA.toggle(\'' + esc(n) + '\')" title="Details">\u25be</button></div>' +
        ((fitLine || fitsLine) ? '<div class="bav2-fitline">' + fitLine + (fitLine && fitsLine ? ' \u00b7 ' : '') + fitsLine + '</div>' : '') +
        (isOpen ? '<div class="bav2-details">' + a.seats + ' seats \u00b7 ' + a.range.toLocaleString() + ' mi range \u00b7 ' + a.speed + ' mph \u00b7 introduced ' + a.era + '</div>' : '') +
        qtyRow +
      '</div>' +
      '<div class="bav2-rail">' +
        '<div class="bav2-price"><b>' + money(a.cost) + '</b><small>per aircraft</small></div>' +
        '<div class="bav2-own"><span>Owned <b>' + owned + '</b></span><small>Active ' + assigned + ' \u00b7 Avail ' + Math.max(0, free) + '</small></div>' +
      '</div></div>';
  }

  function compareTable() {
    if (S.compare.length < 2) return '';
    var cols = S.compare.slice(0, 3).map(function (n) { return [n, AIRCRAFT[n]]; }).filter(function (e) { return e[1]; });
    function row(label, fn) {
      return '<tr><td>' + label + '</td>' + cols.map(function (e) { return '<td>' + fn(e[0], e[1]) + '</td>'; }).join('') + '</tr>';
    }
    return '<div class="bav2-comparewrap"><div class="bav2-comparehead">COMPARE (' + cols.length + ')' +
      '<button onclick="AEBA.clearCmp()">clear</button></div><table class="bav2-compare">' +
      '<tr><td></td>' + cols.map(function (e) { return '<td><b>' + e[0] + '</b></td>'; }).join('') + '</tr>' +
      row('Price', function (n, a) { return money(a.cost); }) +
      row('Seats', function (n, a) { return a.seats; }) +
      row('Range', function (n, a) { return a.range.toLocaleString(); }) +
      row('Speed', function (n, a) { return a.speed; }) +
      row('Owned', function (n) { return (STATE.planes[n] || {}).owned || 0; }) +
      '</table></div>';
  }

  function summaryBar() {
    if (!S.sel || !AIRCRAFT[S.sel]) return '';
    var a = AIRCRAFT[S.sel];
    var q = qtyOf(S.sel);
    var d = (typeof bulkPlaneDiscount === 'function') ? bulkPlaneDiscount(S.sel, q) : { pct: 0, total: a.cost * q, base: a.cost * q };
    var total = d.total;
    var after = STATE.cash - total;
    var ok = after >= 0;
    return '<div class="bav2-sum">' +
      '<div class="bav2-sumleft"><b>' + q + ' \u00d7 ' + S.sel + '</b>' +
        '<button class="bav2-rm" onclick="AEBA.clearSel()">Remove</button></div>' +
      '<div class="bav2-sumstat"><small>Total Cost</small><b style="color:var(--warn)">' + money(total) +
        (d.pct ? ' <s>' + money(d.base) + '</s>' : '') + '</b>' +
        (d.pct ? '<small style="color:var(--accent2)">bulk \u2212' + d.pct + '% \u00b7 saves ' + money(d.base - d.total) + '</small>' : '') + '</div>' +
      '<div class="bav2-sumstat"><small>Cash After</small><b style="color:' + (ok ? 'var(--profit)' : 'var(--loss)') + '">' + money(after) + '</b></div>' +
      '<div class="bav2-sumbtns">' +
        '<button class="bav2-assign" ' + (ok ? 'onclick="AEBA.buy(true)"' : 'disabled') + ' title="Purchase and add ' + q + ' flight/wk on this route">\u2708 BUY &amp; ASSIGN</button>' +
        '<button class="bav2-buy" ' + (ok ? 'onclick="AEBA.buy(false)"' : 'disabled') + ' title="Purchase only">\uD83D\uDED2 BUY</button>' +
      '</div></div>';
  }

  function render() {
    var chips = [['all', 'All'], ['short', 'Short'], ['medium', 'Medium'], ['long', 'Long'], ['premium', 'Premium']];
    var rows = list();
    /* stale-selection guard: selection must be visible under the current filter */
    if (S.sel && !rows.some(function (e) { return e[0] === S.sel; })) S.sel = null;
    var listHtml = rows.length
      ? rows.map(function (e) { return card(e[0], e[1]); }).join('')
      : '<div class="bav2-empty">No aircraft match the current filter' + (S.afford ? ' at your cash level' : '') + '. <button onclick="AEBA.reset()">Show all</button></div>';
    return '<div class="modal-header bav2-head">' +
      '<div class="bav2-title"><div class="modal-title">\u2708 BUY AIRCRAFT</div><div class="bav2-subtitle">Expand your fleet and grow your airline</div></div>' +
      '<div class="bav2-stats">' +
        '<span><small>Cash</small><b style="color:var(--accent2)">' + money(STATE.cash) + '</b></span>' +
        '<span><small>Fleet</small><b>' + fleetCount() + '</b></span>' +
        '<span><small>Airports</small><b>' + airportsServed() + '</b></span>' +
      '</div>' +
      '<button class="modal-close" onclick="AEBA.back()" title="Back to route builder">\u2190</button></div>' +
      '<div class="modal-body bav2-body">' +
      '<div class="bav2-bar">' +
        '<span class="bav2-barlbl">FILTER</span>' +
        chips.map(function (c) {
          return '<button class="bav2-chipbtn' + (S.filter === c[0] ? ' on' : '') + '" onclick="AEBA.filter(\'' + c[0] + '\')">' + c[1] + '</button>';
        }).join('') +
        '<span class="bav2-barlbl" style="margin-left:auto"></span>' +
        '<label class="bav2-aff"><input type="checkbox" ' + (S.afford ? 'checked' : '') + ' onchange="AEBA.afford()"> Affordable only</label>' +
      '</div>' +
      (S.from && S.to ? '<div class="bav2-route">Route <b>' + S.from + ' \u2192 ' + S.to + '</b> \u00b7 ' + Math.round(getDistance(S.from, S.to)).toLocaleString() + ' mi</div>' : '') +
      listHtml +
      compareTable() +
      '</div>' + summaryBar();
  }

  function rerender() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    var body = m.querySelector('.bav2-body');
    var st = body ? body.scrollTop : 0;   /* preserve list scroll across re-renders */
    m.innerHTML = render();
    body = m.querySelector('.bav2-body');
    if (body) body.scrollTop = st;
  }

  function restoreFare() {
    if (S.fare == null) return;
    setTimeout(function () {
      var inp = document.getElementById('r-fare');
      if (inp) {
        inp.value = S.fare;
        var v = document.getElementById('rfa-v');
        if (v) v.textContent = S.fare;
        try { updateRoutePreview(); } catch (e) {}
      }
      S.fare = null;
    }, 0);
  }

  window.AEBA = {
    filter: function (f) { S.filter = f; rerender(); },
    sort: function (v) { S.sort = v; rerender(); },
    afford: function () { S.afford = !S.afford; rerender(); },
    pick: function (n, q) { S.sel = n; S.qtyMap[n] = q; rerender(); },
    inc: function (n) { S.sel = n; S.qtyMap[n] = Math.min(99, qtyOf(n) + 1); rerender(); },
    dec: function (n) { S.sel = n; S.qtyMap[n] = Math.max(1, qtyOf(n) - 1); rerender(); },
    buyNow: function (n) { S.sel = n; AEBA.buy(false); },
    reset: function () { S.filter = 'all'; S.afford = false; rerender(); },
    toggle: function (n) { S.open[n] = !S.open[n]; rerender(); },
    cmp: function (n) {
      var i = S.compare.indexOf(n);
      if (i !== -1) S.compare.splice(i, 1);
      else { S.compare.push(n); if (S.compare.length > 3) S.compare.shift(); }
      rerender();
    },
    clearCmp: function () { S.compare = []; rerender(); },
    clearSel: function () { if (S.sel) S.qtyMap[S.sel] = 1; S.sel = null; rerender(); },
    buy: function (assign) {
      if (!S.sel) return;
      var a = AIRCRAFT[S.sel];
      var q = qtyOf(S.sel);
      var d = (typeof bulkPlaneDiscount === 'function') ? bulkPlaneDiscount(S.sel, q) : { total: a.cost * q };
      if (STATE.cash < d.total) { try { showFlash('\u26a0 Need ' + money(d.total)); } catch (e) {} return; }
      if (assign) {
        try { _nrPlanes[S.sel] = (_nrPlanes[S.sel] || 0) + q; } catch (e) {}
      }
      var n = S.sel;
      S.sel = null; S.qtyMap[n] = 1;
      buyPlaneForRoute(n, q, S.from, S.to);   /* native: cash, owned, events, returns to builder */
      restoreFare();
    },
    back: function () {
      document.getElementById('modal-content').innerHTML = buildNewRoute(S.from, S.to);
      restoreFare();
    }
  };

  function install() {
    if (typeof window.buildBuyPlanesForRoute !== 'function' || typeof window.openBuyPlanesForRoute !== 'function') {
      setTimeout(install, 250); return;
    }
    var origOpen = window.openBuyPlanesForRoute;
    window.openBuyPlanesForRoute = function (from, to) {
      S.from = from || ''; S.to = to || '';
      S.sel = null; S.qtyMap = {};
      try { S.fare = +val('r-fare') || null; } catch (e) { S.fare = null; }
      try {
        document.getElementById('modal-content').innerHTML = render();
      } catch (e) {
        console.warn('[buy-aircraft-v02] render failed, falling back to stock', e);
        origOpen(from, to);
      }
    };
  }
  install();
})();
