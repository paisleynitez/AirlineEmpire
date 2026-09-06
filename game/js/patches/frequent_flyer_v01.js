/* FREQUENT_FLYER_v01 — per-route FF tier system (Bronze → Platinum) + VIP passengers.

   Layers on top of the existing avgLoad-based loyaltyFactor at game.js:7482.
   A tier is earned by sustaining a load-factor threshold for a set number of
   months. Each tier grants an additional demand bonus. Gold and Platinum also
   generate VIP passengers who pay a fare multiplier on top of base revenue.
   A VIP Lounge at either endpoint city doubles the VIP passenger share.

   Data attached to each route (lazy, no schema migration needed):
     r._ffTier      : 0..4  (None, Bronze, Silver, Gold, Platinum)
     r._ffMomentum  : consecutive months meeting NEXT tier's threshold
     r._ffRegress   : consecutive months below (current tier minLoad − 10)

   Attaches by wrapping processRoute (adds VIP revenue), endTurn (advances
   tier momentum after routes are processed), and renderRoutesList (injects
   the tier badge on each route card). The demand bonus itself is applied by
   a one-line hook in game.js at line 7482 that calls AEFF.tierDemandBonus.

   Public API:
     AEFF.TIERS                  — tier definitions
     AEFF.tierOf(r)              — current tier object for a route
     AEFF.tierDemandBonus(r)     — additive demand bonus (0..0.15)
     AEFF.effectiveVipShare(r)   — VIP pax share after Lounge synergy
     AEFF.updateTier(r)          — advance/regress momentum (called once per month)
*/
(function () {
  'use strict';
  if (window.AEFrequentFlyerV01) return;
  window.AEFrequentFlyerV01 = true;

  var TIERS = [
    { id: 0, name: 'None',     color: null,      demandBonus: 0.00, vipShare: 0.00, vipFareMult: 1, minLoad: 0,  minMonths: 0  },
    { id: 1, name: 'Bronze',   color: '#cd7f32', demandBonus: 0.03, vipShare: 0.00, vipFareMult: 1, minLoad: 55, minMonths: 6  },
    { id: 2, name: 'Silver',   color: '#c0c8d0', demandBonus: 0.06, vipShare: 0.00, vipFareMult: 1, minLoad: 65, minMonths: 12 },
    { id: 3, name: 'Gold',     color: '#f0c050', demandBonus: 0.10, vipShare: 0.02, vipFareMult: 4, minLoad: 75, minMonths: 24 },
    { id: 4, name: 'Platinum', color: '#e0e8f0', demandBonus: 0.15, vipShare: 0.04, vipFareMult: 6, minLoad: 82, minMonths: 36 }
  ];
  var REGRESSION_MONTHS = 3;

  function tierOf(r) {
    if (!r) return TIERS[0];
    var t = typeof r._ffTier === 'number' ? r._ffTier : 0;
    return TIERS[Math.max(0, Math.min(TIERS.length - 1, t))];
  }
  function nextTier(r) { return TIERS[Math.min(TIERS.length - 1, (r._ffTier || 0) + 1)]; }

  function loungeAtEndpoint(r) {
    if (!window.STATE || !STATE.cityInvestments) return false;
    var f = STATE.cityInvestments[r.from], t = STATE.cityInvestments[r.to];
    var fL = f && f.lounge && (f.lounge.level || 0) > 0;
    var tL = t && t.lounge && (t.lounge.level || 0) > 0;
    return fL || tL;
  }

  function tierDemandBonus(r) { return tierOf(r).demandBonus; }

  function effectiveVipShare(r) {
    var t = tierOf(r);
    var s = t.vipShare;
    if (s > 0 && loungeAtEndpoint(r)) s *= 2;
    return s;
  }

  function updateTier(r) {
    if (!r) return;
    r._ffTier = r._ffTier || 0;
    r._ffMomentum = r._ffMomentum || 0;
    r._ffRegress  = r._ffRegress  || 0;
    var load = r._avgLoad || 50;
    var cur = tierOf(r);
    var next = nextTier(r);
    if (next.id > cur.id && load >= next.minLoad) {
      r._ffMomentum += 1;
      r._ffRegress = 0;
      if (r._ffMomentum >= next.minMonths) {
        r._ffTier = next.id;
        r._ffMomentum = 0;
      }
    } else {
      r._ffMomentum = Math.max(0, r._ffMomentum - 1);
      if (cur.id > 0 && load < (cur.minLoad - 10)) {
        r._ffRegress += 1;
        if (r._ffRegress >= REGRESSION_MONTHS) {
          r._ffTier = Math.max(0, r._ffTier - 1);
          r._ffRegress = 0;
          r._ffMomentum = 0;
        }
      } else {
        r._ffRegress = 0;
      }
    }
  }

  // ── VIP revenue kicker: wrap processRoute post-result ──
  // (Demand bonus is applied inline at game.js:7482 via tierDemandBonus hook.)
  var _origProcessRoute = window.processRoute;
  if (typeof _origProcessRoute === 'function') {
    window.processRoute = function (r) {
      var res = _origProcessRoute.apply(this, arguments);
      if (!res || !r) return res;
      var t = tierOf(r);
      if (t.vipShare > 0 && res.pax > 0 && r.fare > 0) {
        var vipShare = effectiveVipShare(r);
        var vipPax = Math.round(res.pax * vipShare);
        // Fare is stored in dollars per pax; revenue is in $M. Convert with 1e6.
        var vipBonus = vipPax * r.fare * (t.vipFareMult - 1) / 1e6;
        if (vipBonus > 0) {
          res.revenue = (res.revenue || 0) + vipBonus;
          res.profit  = (res.profit  || 0) + vipBonus;
          res._vipPax = vipPax;
          res._vipBonus = vipBonus;
        }
      }
      return res;
    };
  }

  // ── Tier progression: wrap endTurn to run after routes are processed ──
  var _origEndTurn = window.endTurn;
  if (typeof _origEndTurn === 'function') {
    window.endTurn = function () {
      var result = _origEndTurn.apply(this, arguments);
      try {
        if (window.STATE && Array.isArray(STATE.routes)) {
          STATE.routes.forEach(updateTier);
        }
      } catch (e) { /* never let a tier update crash a turn */ }
      return result;
    };
  }

  // ── Badge injection: wrap renderRoutesList to add tier badge after each render ──
  var _origRenderRoutesList = window.renderRoutesList;
  if (typeof _origRenderRoutesList === 'function') {
    window.renderRoutesList = function () {
      _origRenderRoutesList.apply(this, arguments);
      try { injectBadges(); } catch (e) { /* keep the list render safe */ }
    };
  }

  function injectBadges() {
    var host = document.getElementById('routes-list');
    if (!host || !window.STATE || !Array.isArray(STATE.routes)) return;
    var cards = host.querySelectorAll('.route-card');
    // Route cards render in a sorted order; recover the original route index
    // from the onclick="showRouteDetail(N)" attribute set by renderRoutesList.
    cards.forEach(function (card) {
      var oc = card.getAttribute('onclick') || '';
      var m = oc.match(/showRouteDetail\((\d+)\)/);
      if (!m) return;
      var r = STATE.routes[parseInt(m[1], 10)];
      if (!r) return;
      var t = tierOf(r);
      if (t.id === 0) return;
      var cities = card.querySelector('.cities');
      if (!cities || cities.querySelector('.ff-tier-badge')) return;
      var vip = effectiveVipShare(r);
      var badge = document.createElement('span');
      badge.className = 'ff-tier-badge ff-tier-' + t.name.toLowerCase();
      badge.title = 'FF Tier ' + t.name
        + '  ·  +' + Math.round(t.demandBonus * 100) + '% demand'
        + (vip > 0 ? '  ·  ' + Math.round(vip * 100) + '% VIP pax × ' + t.vipFareMult + ' fare'
                          + (loungeAtEndpoint(r) ? '  (Lounge synergy)' : '')
                    : '');
      badge.innerHTML = '&#9733; ' + t.name.toUpperCase() + (vip > 0 ? ' VIP' : '');
      cities.appendChild(badge);
    });
  }

  window.AEFF = {
    TIERS: TIERS,
    tierOf: tierOf,
    tierDemandBonus: tierDemandBonus,
    effectiveVipShare: effectiveVipShare,
    updateTier: updateTier
  };
})();
