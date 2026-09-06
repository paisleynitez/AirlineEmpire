/* MARKET_INTEL_v01 — implements the previously-stubbed Market Intelligence
   window (sidebar 'mi' row guards on openMarketIntel existing; nothing did).
   Concept: header + tab cards + hero stat strip + opportunity cards with
   filters, plus Heat Map and Rival Watch tabs. REAL DATA ONLY:
   - Route opportunities are scored from CITIES econ/tourism, real distances
     (getDistance), real rival presence, and ECON reference fares.
   - Heat Map aggregates per-region city strength vs your coverage.
   - Rival Watch reads STATE.competitors (+ alliance status from ALLIANCES_v01).
   Concept tabs with no underlying game system (Used Aircraft market,
   Contracts, Trial Routes) are intentionally NOT rendered — nothing fake.
   "Analyze Route" opens the New Route builder prefilled when possible. */
(function () {
  'use strict';
  if (window.AEMarketIntelV01) return;
  window.AEMarketIntelV01 = true;

  var S = { tab: 'routes', region: 'all', demand: 'all', unserved: true };
  var SIZED = ['width', 'max-width', 'height', 'max-height', 'margin'];

  function money(n) { return '$' + Math.round(n).toLocaleString() + 'M'; }
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function served(a, b) {
    return (STATE.routes || []).some(function (r) {
      return (r.from === a && r.to === b) || (r.from === b && r.to === a);
    });
  }
  function rivalsIn(region) {
    return (STATE.competitors || []).filter(function (c) { return (c.regionsEntered || []).includes(region); }).length;
  }
  function regions() {
    var s = {};
    Object.keys(CITIES).forEach(function (c) { s[CITIES[c].region] = 1; });
    return Object.keys(s).sort();
  }

  /* ---- Opportunity scoring: transparent estimates from real city data ---- */
  function opportunities() {
    var origins = {};
    (STATE.hubs || []).forEach(function (h) { origins[h] = 1; });
    (STATE.routes || []).forEach(function (r) { origins[r.from] = 1; origins[r.to] = 1; });
    var from = Object.keys(origins).filter(function (c) { return CITIES[c]; });
    if (!from.length) return [];
    var dests = Object.keys(CITIES)
      .sort(function (a, b) { return (CITIES[b].econ + CITIES[b].tourism) - (CITIES[a].econ + CITIES[a].tourism); })
      .slice(0, 60);
    var out = [];
    from.forEach(function (f) {
      dests.forEach(function (t) {
        if (t === f) return;
        var isServed = served(f, t);
        if (S.unserved && isServed) return;
        var cf = CITIES[f], ct = CITIES[t];
        if (S.region !== 'all' && ct.region !== S.region && cf.region !== S.region) return;
        var dist = getDistance(f, t);
        if (!dist || dist < 150) return;
        var pull = (cf.econ + cf.tourism + ct.econ + ct.tourism) / 4;   // 0..~10 city strength
        var riv = rivalsIn(ct.region);
        var estDemand = Math.round(pull * 620 * (1 - Math.min(.5, riv * .12)));
        var lvl = estDemand >= 4200 ? 'high' : estDemand >= 2400 ? 'medium' : 'low';
        if (S.demand !== 'all' && S.demand !== lvl) return;
        var refFare = ECON.refFareBase + dist * ECON.refFareDist;
        var estRev = estDemand * refFare / 1e6;
        var score = Math.max(5, Math.min(99, Math.round(
          pull * 8.5 - riv * 7 - dist / 900 + (isServed ? -25 : 6))));
        out.push({ from: f, to: t, dist: dist, demand: estDemand, lvl: lvl,
          rev: estRev, riv: riv, score: score, served: isServed,
          plane: idealPlane(dist), toRegion: ct.region });
      });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    var seen = {}, uniq = [];
    out.forEach(function (o) {
      var k = [o.from, o.to].sort().join('|');
      if (!seen[k]) { seen[k] = 1; uniq.push(o); }
    });
    return uniq.slice(0, 14);
  }
  function idealPlane(dist) {
    var best = null;
    Object.entries(AIRCRAFT).forEach(function (e) {
      var a = e[1];
      if (a.era > STATE.year || a.range < dist) return;
      if (!best || a.cost < AIRCRAFT[best].cost) best = e[0];
    });
    return best || '\u2014';
  }

  function scoreBar(s) {
    var col = s >= 80 ? 'var(--profit)' : s >= 55 ? 'var(--warn)' : 'var(--loss)';
    return '<div class="miv1-scb"><b style="color:' + col + '">' + s + '</b><span><i style="width:' + s + '%;background:' + col + '"></i></span></div>';
  }

  function routesTab() {
    var ops = opportunities();
    var regs = regions();
    var filters = '<div class="miv1-filters">' +
      '<span class="miv1-flbl">REGION</span>' +
      '<select class="miv1-sel" onchange="AEMI.region(this.value)">' +
        '<option value="all">All Regions</option>' +
        regs.map(function (r) { return '<option value="' + r + '"' + (S.region === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
      '</select>' +
      '<span class="miv1-flbl">DEMAND</span>' +
      ['all', 'high', 'medium', 'low'].map(function (d) {
        return '<span class="miv1-chip' + (S.demand === d ? ' on' : '') + '" onclick="AEMI.demand(\'' + d + '\')">' + d.charAt(0).toUpperCase() + d.slice(1) + '</span>';
      }).join('') +
      '<label class="miv1-uns"><input type="checkbox" ' + (S.unserved ? 'checked' : '') + ' onchange="AEMI.unserved()"> Unserved only</label>' +
      '</div>';
    if (!ops.length) return filters + '<div class="miv1-empty">No opportunities match these filters' + ((STATE.hubs || []).length ? '' : ' \u2014 establish a hub first') + '.</div>';
    return filters + ops.map(function (o) {
      var badge = o.score >= 80 ? '<span class="miv1-badge hi">HIGH OPPORTUNITY</span>'
        : o.score >= 55 ? '<span class="miv1-badge med">MEDIUM OPPORTUNITY</span>'
        : '<span class="miv1-badge low">LOW OPPORTUNITY</span>';
      return '<div class="miv1-op">' +
        '<div class="miv1-oprow1"><b>' + o.from + ' \u2192 ' + o.to + '</b>' + badge + scoreBar(o.score) + '</div>' +
        '<div class="miv1-oprow2">' +
          '<span><small>EST. DEMAND</small><b>' + o.demand.toLocaleString() + '</b><em>pax/mo</em></span>' +
          '<span><small>EST. REVENUE</small><b>' + money(o.rev) + '</b><em>monthly</em></span>' +
          '<span><small>COMPETITION</small><b>' + (o.riv === 0 ? 'None' : o.riv <= 1 ? 'Low' : o.riv <= 2 ? 'Medium' : 'High') + '</b><em>' + o.riv + ' rivals in ' + o.toRegion + '</em></span>' +
          '<span><small>DISTANCE</small><b>' + Math.round(o.dist).toLocaleString() + '</b><em>mi</em></span>' +
          '<span><small>IDEAL AIRCRAFT</small><b>' + o.plane + '</b><em>' + (o.served ? 'already served' : 'unserved') + '</em></span>' +
          '<button class="miv1-go" onclick="AEMI.analyze(\'' + esc(o.from) + '\',\'' + esc(o.to) + '\')">ANALYZE ROUTE \u203a</button>' +
        '</div></div>';
    }).join('');
  }

  function heatTab() {
    var regs = regions().map(function (r) {
      var cities = Object.keys(CITIES).filter(function (c) { return CITIES[c].region === r; });
      var pull = cities.reduce(function (s, c) { return s + CITIES[c].econ + CITIES[c].tourism; }, 0) / Math.max(1, cities.length);
      var mine = (STATE.routes || []).filter(function (rt) {
        return CITIES[rt.from] && CITIES[rt.to] && (CITIES[rt.from].region === r || CITIES[rt.to].region === r);
      }).length;
      return { r: r, cities: cities.length, pull: pull, mine: mine, riv: rivalsIn(r) };
    }).sort(function (a, b) { return b.pull - a.pull; });
    var max = regs[0] ? regs[0].pull : 1;
    return '<div class="miv1-heathead">Region demand strength (avg city economy + tourism) vs your coverage.</div>' +
      regs.map(function (g) {
        var pct = Math.round(g.pull / max * 100);
        return '<div class="miv1-heat"><b>' + g.r + '</b>' +
          '<span class="miv1-hbar"><i style="width:' + pct + '%"></i></span>' +
          '<em>' + g.cities + ' cities \u00b7 your routes: ' + g.mine + ' \u00b7 rivals: ' + g.riv + (g.mine === 0 && pct > 60 ? ' \u00b7 <u>untapped</u>' : '') + '</em></div>';
      }).join('');
  }

  function rivalsTab() {
    var comps = STATE.competitors || [];
    if (!comps.length) return '<div class="miv1-empty">No rival airlines yet.</div>';
    var lock = STATE._allianceLockout || {};
    var now = STATE._absMonth || 0;
    return comps.map(function (c) {
      var allied = (typeof activeAlliances === 'function') && activeAlliances().some(function (a) { return a.partner === c.name; });
      var frozen = lock[c.name] && lock[c.name] > now;
      var nRoutes = (c.routeList || []).length;
      return '<div class="miv1-riv">' +
        '<div class="miv1-rivtop"><b>' + c.name + '</b>' +
          (allied ? '<span class="miv1-badge hi">ALLIED</span>' : frozen ? '<span class="miv1-badge low">TALKS FROZEN</span>' : '') + '</div>' +
        '<div class="miv1-rivmeta">' + (c.regionsEntered || []).join(' \u00b7 ') +
          ' \u00b7 ' + nRoutes + ' known route' + (nRoutes !== 1 ? 's' : '') +
          (typeof c.allied === 'number' && c.allied > 0 ? ' \u00b7 legacy pact active' : '') + '</div>' +
        '<div class="miv1-rivact">' +
          (allied || frozen ? '' : '<button class="miv1-go" onclick="closeModal();openAlliances()">PARTNERSHIP OPTIONS \u203a</button>') +
        '</div></div>';
    }).join('');
  }

  function stats() {
    var ops = (function () { var keep = { r: S.region, d: S.demand, u: S.unserved }; S.region = 'all'; S.demand = 'all'; S.unserved = true; var o = opportunities(); S.region = keep.r; S.demand = keep.d; S.unserved = keep.u; return o; })();
    var high = ops.filter(function (o) { return o.score >= 80; }).length;
    var regs = regions();
    var untapped = regs.filter(function (r) {
      return !(STATE.routes || []).some(function (rt) {
        return CITIES[rt.from] && CITIES[rt.to] && (CITIES[rt.from].region === r || CITIES[rt.to].region === r);
      });
    }).length;
    return { viable: ops.length, high: high, untapped: untapped, regs: regs.length };
  }

  function tabCard(id, icon, name, sub) {
    return '<div class="miv1-tabcard' + (S.tab === id ? ' on' : '') + '" onclick="AEMI.tab(\'' + id + '\')">' +
      '<span>' + icon + '</span><span><b>' + name + '</b><small>' + sub + '</small></span></div>';
  }

  function render() {
    var st = stats();
    var body = S.tab === 'heat' ? heatTab() : S.tab === 'rivals' ? rivalsTab() : routesTab();
    return '<div class="modal-header miv1-head">' +
      '<div class="miv1-title"><div class="modal-title">\ud83d\udcc8 MARKET INTELLIGENCE</div>' +
        '<div class="miv1-sub">TURN DATA INTO OPPORTUNITY</div></div>' +
      '<div class="miv1-cash"><small>CASH</small><b>' + money(Math.round(STATE.cash)) + '</b></div>' +
      '<button class="modal-close" onclick="closeModal()">\u00d7</button></div>' +
      '<div class="modal-body miv1-body">' +
      '<div class="miv1-tabs">' +
        tabCard('routes', '\ud83c\udf10', 'ROUTE OPPORTUNITIES', 'Find new routes') +
        tabCard('heat', '\ud83d\udd25', 'HEAT MAP', 'Regional demand view') +
        tabCard('rivals', '\ud83d\udd2d', 'RIVAL WATCH', 'Track competitor moves') +
      '</div>' +
      '<div class="miv1-stats">' +
        '<span><b>' + st.viable + '</b><small>viable unserved routes</small></span>' +
        '<span><b class="hi">' + st.high + '</b><small>high-opportunity</small></span>' +
        '<span><b>' + st.untapped + ' / ' + st.regs + '</b><small>regions untapped</small></span>' +
      '</div>' + body + '</div>';
  }

  function sizeFrame() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    if (m.querySelector('.miv1-head')) {
      m.style.setProperty('width', 'min(94vw, 780px)', 'important');
      m.style.setProperty('max-width', 'min(94vw, 780px)', 'important');
      m.style.setProperty('height', 'auto', 'important');
      m.style.setProperty('max-height', '90vh', 'important');
      ['left', 'top', 'right', 'bottom', 'transform', 'position'].forEach(function (p) { m.style.removeProperty(p); });
      m.style.setProperty('margin', '4vh auto auto', 'important');
      m._miSized = true;
    } else if (m._miSized) {
      SIZED.forEach(function (p) { m.style.removeProperty(p); });
      m._miSized = false;
    }
  }

  function rerender() {
    var m = document.getElementById('modal-content');
    if (!m || !m.querySelector('.miv1-head')) return;
    var b = m.querySelector('.miv1-body');
    var st = b ? b.scrollTop : 0;
    m.innerHTML = render();
    b = m.querySelector('.miv1-body');
    if (b) b.scrollTop = st;
    sizeFrame();
  }

  window.openMarketIntel = function (tab) {
    if (tab === 'routes' || tab === 'heat' || tab === 'rivals') S.tab = tab;
    var m = document.getElementById('modal-content');
    document.getElementById('modal-overlay').classList.add('open');
    m.classList.remove('modal-wide', 'modal-new-route', 'modal-negotiations', 'modal-route-manager', 'modal-projects', 'modal-budget', 'modal-city');
    m.innerHTML = render();
    sizeFrame();
  };

  window.AEMI = {
    tab: function (t) { S.tab = t; rerender(); },
    region: function (r) { S.region = r; rerender(); },
    demand: function (d) { S.demand = d; rerender(); },
    unserved: function () { S.unserved = !S.unserved; rerender(); },
    analyze: function (f, t) {
      closeModal();
      try {
        openModal('newroute');
        setTimeout(function () {
          var sf = document.getElementById('r-from'), sto = document.getElementById('r-to');
          if (sf) { sf.value = f; sf.dispatchEvent(new Event('change')); }
          if (sto) { sto.value = t; sto.dispatchEvent(new Event('change')); }
          if (typeof updateRoutePreview === 'function') updateRoutePreview();
        }, 60);
      } catch (e) { try { showFlash('Open the Route Builder to plan ' + f + ' \u2192 ' + t); } catch (e2) {} }
    }
  };

  /* clear frame sizing when other windows take the modal */
  function hook() {
    if (typeof window.openModal !== 'function') { setTimeout(hook, 300); return; }
    var o = window.openModal;
    if (!o.__aeMi) {
      var wo = function () { var r = o.apply(this, arguments); setTimeout(sizeFrame, 0); return r; };
      wo.__aeMi = true; window.openModal = wo;
    }
    var c = window.closeModal;
    if (typeof c === 'function' && !c.__aeMi) {
      var wc = function () { var r = c.apply(this, arguments); setTimeout(sizeFrame, 0); return r; };
      wc.__aeMi = true; window.closeModal = wc;
    }
  }
  hook();
})();
