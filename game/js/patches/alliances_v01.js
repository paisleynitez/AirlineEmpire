/* ALLIANCES_v01 (window) — UI over the verified alliance engine.
   Locked state before Month 7 (explains itself); after unlock: active-contract
   cards (progress, strength, fee, cancel w/ penalty), partner grid (lockouts
   shown), agreement picker (4 types), region picker for Regional, route picker
   (max 3) for JV. All actions via engine API: signAlliance / cancelAlliance /
   activeAlliances / allianceCap / allianceStrength. Frame sized from JS. */
(function () {
  'use strict';
  if (window.AEAlliancesV01) return;
  window.AEAlliancesV01 = true;

  var S = { partner: null, type: null, region: null, routes: [] };
  var SIZED = ['width', 'max-width', 'height', 'max-height'];

  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function money(n) { return '$' + n + 'M'; }
  function T() { return ECON.allianceTypes; }

  function typeEffect(k) {
    var t = T()[k];
    if (k === 'codeshare') return '+' + Math.round(t.demand * 100) + '% demand on routes in partner regions';
    if (k === 'regional') return 'Partner stops splitting your demand in one region';
    if (k === 'operational') return '\u2212' + Math.round(t.costCut * 100) + '% handling, crew & maintenance costs';
    return '+' + Math.round(t.demand * 100) + '% demand on up to ' + t.maxRoutes + ' routes \u00b7 partner takes ' + Math.round(t.revShare * 100) + '% of their revenue';
  }

  function lockedView() {
    var m = (STATE._absMonth || 0) + 1;
    return '<div class="alv1-locked"><div class="alv1-lockic">\ud83d\udd12</div>' +
      '<b>AIRLINE ALLIANCES</b><span>Unlocks in Month 7 \u2014 you are in Month ' + m + '</span>' +
      '<em>Build your network first. Alliances become available once your airline has an established operating history.</em></div>';
  }

  function activeCards() {
    var list = activeAlliances();
    var cap = allianceCap();
    var head = '<div class="alv1-seclbl">ACTIVE AGREEMENTS \u00b7 ' + list.length + ' of ' + cap + ' <small>(cap grows with rival count)</small></div>';
    if (!list.length) return head + '<div class="alv1-none">No active agreements. Pick a partner below.</div>';
    return head + list.map(function (a) {
      var t = T()[a.type];
      var age = (STATE._absMonth || 0) - a.start;
      var pct = Math.min(100, Math.round(age / t.term * 100));
      var str = Math.round(allianceStrength(a) * 100);
      var scope = a.type === 'regional' ? a.region
        : a.type === 'jv' ? (a.routes || []).map(function (r) { return r.from + '\u2192' + r.to; }).join(', ')
        : 'Network-wide';
      return '<div class="alv1-active">' +
        '<div class="alv1-actop"><b>' + t.name + '</b><span>with <i>' + a.partner + '</i></span>' +
          '<button class="alv1-cancel" onclick="AEAL.cancel(\'' + a.id + '\')" title="Early cancel: ' + money(t.feeMo * t.penaltyX) + ' penalty + 12mo lockout">Cancel</button></div>' +
        '<div class="alv1-acmeta">' + scope + ' \u00b7 ' + money(t.feeMo) + '/mo \u00b7 month ' + age + ' of ' + t.term + ' \u00b7 strength <b>' + str + '%</b></div>' +
        '<div class="alv1-bar"><i style="width:' + pct + '%"></i></div></div>';
    }).join('');
  }

  function partnerGrid() {
    var lock = STATE._allianceLockout || {};
    var now = STATE._absMonth || 0;
    return '<div class="alv1-seclbl">CHOOSE A PARTNER</div><div class="alv1-partners">' +
      (STATE.competitors || []).map(function (c) {
        var allied = activeAlliances().some(function (a) { return a.partner === c.name; });
        var frozen = lock[c.name] && lock[c.name] > now;
        var dis = allied || frozen;
        var tag = allied ? '<small class="ok">ALLIED</small>' : frozen ? '<small class="no">FROZEN ' + (lock[c.name] - now) + 'mo</small>' : '';
        return '<div class="alv1-partner' + (S.partner === c.name ? ' on' : '') + (dis ? ' dim' : '') + '" ' +
          (dis ? '' : 'onclick="AEAL.pick(\'' + esc(c.name) + '\')"') + '><b>' + c.name + '</b>' +
          '<span>' + (c.regionsEntered || []).join(' \u00b7 ') + '</span>' + tag + '</div>';
      }).join('') + '</div>';
  }

  function typeCards() {
    if (!S.partner) return '';
    return '<div class="alv1-seclbl">AGREEMENT WITH ' + S.partner.toUpperCase() + '</div><div class="alv1-types">' +
      Object.keys(T()).map(function (k) {
        var t = T()[k];
        return '<div class="alv1-type' + (S.type === k ? ' on' : '') + '" onclick="AEAL.type(\'' + k + '\')">' +
          '<b>' + t.name + '</b><em>' + typeEffect(k) + '</em>' +
          '<span>' + money(t.feeMo) + '/mo \u00b7 ' + t.term + ' mo \u00b7 cancel: ' + money(t.feeMo * t.penaltyX) + '</span></div>';
      }).join('') + '</div>' + picker() + signRow();
  }

  function picker() {
    if (S.type === 'regional') {
      var regs = _allPartnerRegions(S.partner);
      return '<div class="alv1-seclbl">PROTECTED REGION</div><div class="alv1-chips">' +
        regs.map(function (r) {
          return '<span class="alv1-chip' + (S.region === r ? ' on' : '') + '" onclick="AEAL.region(\'' + esc(r) + '\')">' + r + '</span>';
        }).join('') + '</div>';
    }
    if (S.type === 'jv') {
      var max = T().jv.maxRoutes;
      if (!(STATE.routes || []).length) return '<div class="alv1-none">Open some routes first \u2014 a venture needs routes to cover.</div>';
      return '<div class="alv1-seclbl">VENTURE ROUTES <small>(up to ' + max + ')</small></div><div class="alv1-chips">' +
        (STATE.routes || []).map(function (r) {
          var key = r.from + '|' + r.to;
          var on = S.routes.indexOf(key) !== -1;
          return '<span class="alv1-chip' + (on ? ' on' : '') + '" onclick="AEAL.route(\'' + esc(key) + '\')">' + r.from + ' \u2192 ' + r.to + '</span>';
        }).join('') + '</div>';
    }
    return '';
  }

  function readyToSign() {
    if (!S.partner || !S.type) return false;
    if (S.type === 'regional' && !S.region) return false;
    if (S.type === 'jv' && !S.routes.length) return false;
    return true;
  }

  function signRow() {
    if (!S.type) return '';
    var ok = readyToSign();
    var t = T()[S.type];
    return '<div class="alv1-signrow">' +
      '<span>' + t.name + ' \u00b7 ' + money(t.feeMo) + '/mo \u00b7 benefits ramp in over ' + (ECON.allianceRampMonths || 4) + ' months and fluctuate monthly</span>' +
      '<button class="alv1-sign" ' + (ok ? 'onclick="AEAL.sign()"' : 'disabled') + '>\ud83e\udd1d SIGN AGREEMENT</button></div>';
  }

  function render() {
    var body = allianceUnlocked()
      ? activeCards() + partnerGrid() + typeCards()
      : lockedView();
    return '<div class="modal-header alv1-head">' +
      '<div class="alv1-title"><div class="modal-title">\ud83e\udd1d ALLIANCES</div>' +
        '<div class="alv1-sub">PARTNERSHIPS \u00b7 CODESHARES \u00b7 JOINT VENTURES</div></div>' +
      '<div class="alv1-cash"><small>CASH</small><b>' + money(Math.round(STATE.cash)) + '</b></div>' +
      '<button class="modal-close" onclick="closeModal()">\u00d7</button></div>' +
      '<div class="modal-body alv1-body">' + body + '</div>';
  }

  function sizeFrame() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    if (m.querySelector('.alv1-head')) {
      m.style.setProperty('width', 'min(680px, 94vw)', 'important');
      m.style.setProperty('max-width', 'min(680px, 94vw)', 'important');
      m.style.setProperty('height', 'auto', 'important');
      m.style.setProperty('max-height', '88vh', 'important');
      m._alSized = true;
    } else if (m._alSized) {
      SIZED.forEach(function (p) { m.style.removeProperty(p); });
      m._alSized = false;
    }
  }

  function rerender() {
    var m = document.getElementById('modal-content');
    if (!m || !m.querySelector('.alv1-head')) return;
    var b = m.querySelector('.alv1-body');
    var st = b ? b.scrollTop : 0;
    m.innerHTML = render();
    b = m.querySelector('.alv1-body');
    if (b) b.scrollTop = st;
    sizeFrame();
  }

  window.openAlliances = function () {
    S = { partner: null, type: null, region: null, routes: [] };
    var m = document.getElementById('modal-content');
    document.getElementById('modal-overlay').classList.add('open');
    m.classList.remove('modal-wide', 'modal-new-route', 'modal-negotiations', 'modal-route-manager', 'modal-projects', 'modal-budget', 'modal-city');
    m.innerHTML = render();
    sizeFrame();
  };

  window.AEAL = {
    pick: function (n) { S.partner = n; S.type = null; S.region = null; S.routes = []; rerender(); },
    type: function (t) { S.type = t; S.region = null; S.routes = []; rerender(); },
    region: function (r) { S.region = r; rerender(); },
    route: function (k) {
      var i = S.routes.indexOf(k);
      if (i !== -1) S.routes.splice(i, 1);
      else if (S.routes.length < T().jv.maxRoutes) S.routes.push(k);
      rerender();
    },
    sign: function () {
      if (!readyToSign()) return;
      var routes = S.routes.map(function (k) { var p = k.split('|'); return { from: p[0], to: p[1] }; });
      signAlliance(S.partner, S.type, { region: S.region, routes: routes });
      S = { partner: null, type: null, region: null, routes: [] };
      rerender();
    },
    cancel: function (id) { cancelAlliance(id); rerender(); }
  };

  function install() {
    if (typeof window.allianceUnlocked !== 'function' || typeof window.openModal !== 'function') { setTimeout(install, 300); return; }
    /* clear frame sizing when other windows take the modal */
    var origOpen = window.openModal;
    if (!origOpen.__aeAl) {
      var wo = function () { var r = origOpen.apply(this, arguments); setTimeout(sizeFrame, 0); return r; };
      wo.__aeAl = true; window.openModal = wo;
    }
    var origClose = window.closeModal;
    if (typeof origClose === 'function' && !origClose.__aeAl) {
      var wc = function () { var r = origClose.apply(this, arguments); setTimeout(sizeFrame, 0); return r; };
      wc.__aeAl = true; window.closeModal = wc;
    }
    /* entry points: advisor quick-action list + a button in the Rivals page header if present */
    try { if (typeof ADV_ACTIONS !== 'undefined' && ADV_ACTIONS.strategy) ADV_ACTIONS.strategy.push(['\ud83e\udd1d Alliances', 'openAlliances()']); } catch (e) {}
    function injectRivalsBtn() {
      var host = document.getElementById('tab-rivals');
      if (!host || document.getElementById('alv1-open-btn')) return;
      var b = document.createElement('button');
      b.id = 'alv1-open-btn'; b.type = 'button';
      b.textContent = '\ud83e\udd1d ALLIANCES' + (allianceUnlocked() ? '' : ' \u00b7 \ud83d\udd12 Month 7');
      b.setAttribute('onclick', 'openAlliances()');
      host.insertBefore(b, host.firstChild);
    }
    injectRivalsBtn();
    new MutationObserver(injectRivalsBtn).observe(document.body, { childList: true, subtree: true });
  }
  install();
})();
