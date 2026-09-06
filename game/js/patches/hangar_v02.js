/* HANGAR_v02 — Hangar window rebuilt to the concept: tab cards
   (Health / Renewal / Insurance / Incidents), stat strip, aircraft list +
   detail pane with health bar and tiles, maintenance action cards, insurance
   tier cards, incident log. All gameplay via native functions:
   maintDoCheck / maintSetInsurance / maintGetHealth / maintIsGrounded /
   buildFleetRenewal / INSURANCE_TIERS / MAINTENANCE_CHECKS. Frame sized from
   JS (resize memory beats CSS); sizing cleared when any other window opens. */
(function () {
  'use strict';
  if (window.AEHangarV02) return;
  window.AEHangarV02 = true;

  var S = { tab: 'fleet', sel: null };
  var SIZED = ['width', 'max-width', 'height', 'max-height'];

  function money(n) { return '$' + (Math.round(n * 10) / 10).toLocaleString() + 'M'; }
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function owned() { return Object.entries(STATE.planes || {}).filter(function (e) { return e[1].owned > 0; }); }
  function healthOf(n) { try { return Math.round(maintGetHealth(n).health); } catch (e) { return 100; } }

  function art(n) {
    try {
      var a = STATE.planes[n] || AIRCRAFT[n];
      var idn = (typeof acIdentity === 'function') ? acIdentity(n) : null;
      var hero = (typeof AC_HERO !== 'undefined') ? AC_HERO[n] : null;
      return hero ? '<img src="' + hero + '" alt="">'
        : (typeof aircraftSVG === 'function' ? aircraftSVG(n, a, (idn && idn.color2) || '#00d8f0', true) : '\u2708');
    } catch (e) { return '\u2708'; }
  }

  function statusTag(n) {
    var h = healthOf(n);
    if (typeof maintIsGrounded === 'function' && maintIsGrounded(n)) {
      var mo = (typeof maintGroundingMonthsLeft === 'function') ? maintGroundingMonthsLeft(n) : '';
      return '<span class="hgv2-tag grounded">GROUNDED' + (mo ? ' ' + mo + 'mo' : '') + '</span>';
    }
    if (h < 35) return '<span class="hgv2-tag crit">CRITICAL</span>';
    if (h < 60) return '<span class="hgv2-tag warn">ATTENTION</span>';
    return '<span class="hgv2-tag ok">AIRWORTHY</span>';
  }

  function stats() {
    var list = owned();
    var total = list.reduce(function (s, e) { return s + e[1].owned; }, 0);
    var groundedTypes = list.filter(function (e) { return typeof maintIsGrounded === 'function' && maintIsGrounded(e[0]); });
    var groundedCount = groundedTypes.reduce(function (s, e) { return s + e[1].owned; }, 0);
    var avg = list.length ? Math.round(list.reduce(function (s, e) { return s + healthOf(e[0]); }, 0) / list.length) : 100;
    var service = list.filter(function (e) { return healthOf(e[0]) < 60; }).length;
    var openInc = (STATE.maintenanceIncidents || []).filter(function (i) { return !i.resolved; }).length;
    return { total: total, covered: total - groundedCount, avg: avg, service: service, openInc: openInc };
  }

  function tabCard(id, icon, name, sub) {
    return '<div class="hgv2-tabcard' + (S.tab === id ? ' on' : '') + '" onclick="AEHG.tab(\'' + id + '\')">' +
      '<span class="hgv2-tabic">' + icon + '</span><span><b>' + name + '</b><small>' + sub + '</small></span></div>';
  }

  function statTile(icon, label, value, sub, cls) {
    return '<div class="hgv2-stat ' + (cls || '') + '"><span class="hgv2-statix">' + icon + '</span>' +
      '<span><small>' + label + '</small><b>' + value + '</b><em>' + sub + '</em></span></div>';
  }

  function healthTab() {
    var list = owned();
    if (!list.length) return '<div class="hgv2-emptymsg">No aircraft in fleet yet.</div>';
    if (!S.sel || !STATE.planes[S.sel] || !STATE.planes[S.sel].owned) S.sel = list[0][0];
    var rows = list.map(function (e) {
      var n = e[0], h = healthOf(n);
      var col = (typeof maintHealthColor === 'function') ? maintHealthColor(h) : 'var(--profit)';
      return '<div class="hgv2-acrow' + (S.sel === n ? ' on' : '') + '" onclick="AEHG.sel(\'' + esc(n) + '\')">' +
        '<span class="hgv2-acart">' + art(n) + '</span>' +
        '<span class="hgv2-acmid"><b>' + n + '</b>' + statusTag(n) + '</span>' +
        '<span class="hgv2-ach" style="color:' + col + '">' + h + '%</span></div>';
    }).join('');

    var n = S.sel;
    var h = null; try { h = maintGetHealth(n); } catch (e) { h = { health: 100, checksDone: 0, wearPerMonth: 0 }; }
    var health = Math.round(h.health);
    var col = (typeof maintHealthColor === 'function') ? maintHealthColor(health) : 'var(--profit)';
    var p = STATE.planes[n] || {};
    var ownYrs = Math.max(0, (STATE.year || 1970) - (p._acqYear != null ? Math.round(p._acqYear) : (STATE.year || 1970)));
    var wear = h.wearPerMonth != null ? h.wearPerMonth : (h.wear != null ? h.wear : 0);
    var checks = h.checksDone != null ? h.checksDone : (h.checks || 0);
    var grounded = (typeof maintIsGrounded === 'function') && maintIsGrounded(n);
    var condition = health >= 85 ? 'Aircraft is in excellent condition.'
      : health >= 60 ? 'Aircraft is in serviceable condition.'
      : health >= 35 ? 'Aircraft needs attention \u2014 schedule maintenance.'
      : 'Aircraft condition is critical \u2014 high incident risk.';

    function action(key, icon, name2, sub, downtime, cls) {
      var c = MAINTENANCE_CHECKS[key];
      var ok = STATE.cash >= c.cost && !(grounded && key !== 'engine');
      return '<div class="hgv2-act ' + cls + '">' +
        '<div class="hgv2-acthead"><span>' + icon + '</span><span><b>' + name2 + '</b><small>' + sub + '</small></span></div>' +
        '<div class="hgv2-actrow"><small>Cost</small><b>' + money(c.cost) + '</b></div>' +
        '<div class="hgv2-actrow"><small>Downtime</small><b>' + downtime + '</b></div>' +
        '<div class="hgv2-actrow"><small>Health</small><b class="up">+' + c.healthRestore + '%</b></div>' +
        '<button class="hgv2-actbtn" ' + (ok ? 'onclick="AEHG.check(\'' + esc(n) + '\',\'' + key + '\')"' : 'disabled title="' + (grounded ? 'Grounded' : 'Need ' + money(c.cost)) + '"') + '>Schedule</button></div>';
    }

    return '<div class="hgv2-split">' +
      '<div class="hgv2-list"><div class="hgv2-listhead">AIRCRAFT (' + list.length + ')</div>' + rows + '</div>' +
      '<div class="hgv2-detail">' +
        '<div class="hgv2-dhead"><div><b>' + n + '</b> ' + statusTag(n) +
          '<div class="hgv2-dsub">' + ((AIRCRAFT[n] || {}).type || '') + ' \u00b7 ' + (p.owned || 0) + ' owned \u00b7 in fleet ' + ownYrs + ' yr' + (ownYrs !== 1 ? 's' : '') + '</div></div>' +
          '<span class="hgv2-dart">' + art(n) + '</span></div>' +
        '<div class="hgv2-hcard"><small>AIRCRAFT HEALTH</small>' +
          '<div class="hgv2-hbarwrap"><div class="hgv2-hbar"><i style="width:' + health + '%;background:' + col + '"></i></div><b style="color:' + col + '">' + health + '%</b></div>' +
          '<em>' + condition + '</em></div>' +
        '<div class="hgv2-tiles">' +
          '<div><small>AGE</small><b>' + ownYrs + ' yr</b><em>In fleet</em></div>' +
          '<div><small>WEAR RATE</small><b>' + (Math.round(wear * 10) / 10) + '%/mo</b><em>Monthly wear</em></div>' +
          '<div><small>CHECKS DONE</small><b>' + checks + '</b><em>Total completed</em></div>' +
          '<div><small>STATUS</small><b style="color:' + (grounded ? 'var(--loss)' : col) + '">' + (grounded ? 'GROUNDED' : health < 60 ? 'ATTENTION' : 'AIRWORTHY') + '</b><em>' + (grounded ? 'In repair' : 'No issues') + '</em></div>' +
        '</div>' +
        '<div class="hgv2-actlbl">\ud83d\udd27 MAINTENANCE ACTIONS</div>' +
        '<div class="hgv2-acts">' +
          action('light', '\ud83d\udd27', 'A-Check', 'Routine maintenance', 'None', 'a') +
          action('heavy', '\u2699', 'C-Check', 'Major maintenance', '1 month', 'c') +
          action('engine', '\ud83d\udee0', 'Engine Overhaul', 'Full engine service', '2 months', 'e') +
        '</div>' +
      '</div></div>';
  }

  function insuranceTab() {
    var cur = STATE.insurance || 'standard';
    var costMo = 0; try { costMo = maintInsuranceCostPerMonth(); } catch (e) {}
    return '<div class="hgv2-inswrap"><div class="hgv2-insnote">Current premium: <b>' + money(costMo) + '/mo</b> for the whole fleet.</div>' +
      Object.keys(INSURANCE_TIERS).map(function (k) {
        var t = INSURANCE_TIERS[k];
        return '<div class="hgv2-ins' + (cur === k ? ' on' : '') + '">' +
          '<div class="hgv2-inshead"><b>' + t.name + '</b>' + (cur === k ? '<span class="hgv2-tag ok">ACTIVE</span>' : '') + '</div>' +
          '<div class="hgv2-insrow"><small>Premium</small><b>' + money(t.cost) + '/aircraft/mo</b></div>' +
          '<div class="hgv2-insrow"><small>Coverage</small><b>' + Math.round(t.cover * 100) + '% of incident costs</b></div>' +
          '<em>' + t.desc + '</em>' +
          (cur === k ? '' : '<button class="hgv2-actbtn" onclick="AEHG.ins(\'' + k + '\')">Select</button>') +
        '</div>';
      }).join('') + '</div>';
  }

  function incidentsTab() {
    var inc = (STATE.maintenanceIncidents || []).slice().reverse();
    if (!inc.length) return '<div class="hgv2-emptymsg">No incidents on record. Keep fleet health high to keep it that way.</div>';
    return '<div class="hgv2-incwrap">' + inc.slice(0, 30).map(function (i) {
      return '<div class="hgv2-inc' + (i.resolved ? ' done' : '') + '">' +
        '<span class="hgv2-incic">' + (i.emoji || '\u26a0') + '</span>' +
        '<span class="hgv2-incmid"><b>' + (i.label || 'Incident') + '</b><small>' + (i.text || '') + '</small></span>' +
        '<span class="hgv2-incend">' + (i.resolved ? 'RESOLVED' : '<b class="open">OPEN</b>') + (i.cost ? '<small>' + money(i.cost) + '</small>' : '') + '</span></div>';
    }).join('') + '</div>';
  }

  function renewalTab() {
    try { if (typeof buildFleetRenewal === 'function') return '<div class="hgv2-renewal">' + buildFleetRenewal() + '</div>'; } catch (e) {}
    return '<div class="hgv2-emptymsg">Renewal data unavailable.</div>';
  }

  function render() {
    var st = stats();
    var body = S.tab === 'fleet' ? healthTab()
      : S.tab === 'insurance' ? insuranceTab()
      : S.tab === 'incidents' ? incidentsTab()
      : renewalTab();
    return '<div class="modal-header hgv2-head">' +
      '<div class="hgv2-title"><div class="modal-title">\ud83d\udd27 HANGAR</div>' +
        '<div class="hgv2-sub">MAINTENANCE \u00b7 RENEWAL \u00b7 INSURANCE \u00b7 INCIDENTS</div></div>' +
      '<div class="hgv2-cash"><small>CASH</small><b>' + money(STATE.cash) + '</b></div>' +
      '<button class="modal-close" onclick="closeModal()">\u00d7</button></div>' +
      '<div class="modal-body hgv2-body">' +
      '<div class="hgv2-tabs">' +
        tabCard('fleet', '\u2764', 'HEALTH', 'Fleet condition & maintenance') +
        tabCard('renewal', '\u27f3', 'RENEWAL', 'Leases & aging aircraft') +
        tabCard('insurance', '\ud83d\udee1', 'INSURANCE', 'Coverage & premiums') +
        tabCard('incidents', '\u26a0', 'INCIDENTS', 'Reports & active events') +
      '</div>' +
      '<div class="hgv2-stats">' +
        statTile('\u2708', 'FLEET OPERATIONAL', st.covered + ' / ' + st.total, st.covered === st.total ? 'All aircraft flying' : (st.total - st.covered) + ' grounded', '') +
        statTile('\u2764', 'AVERAGE HEALTH', st.avg + '%', st.avg >= 85 ? 'Fleet in good shape' : 'Watch the low performers', st.avg < 60 ? 'bad' : 'good') +
        statTile('\ud83d\udd27', 'NEEDS SERVICE', String(st.service), st.service ? 'Types below 60% health' : 'Nothing due', st.service ? 'warn2' : '') +
        statTile('\u26a0', 'OPEN INCIDENTS', String(st.openInc), st.openInc ? 'Action required' : 'No active incidents', st.openInc ? 'bad' : '') +
      '</div>' + body + '</div>';
  }

  function sizeFrame() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    if (m.querySelector('.hgv2-head')) {
      m.style.setProperty('width', 'min(1000px, 95vw)', 'important');
      m.style.setProperty('max-width', 'min(1000px, 95vw)', 'important');
      m.style.setProperty('height', 'auto', 'important');
      m.style.setProperty('max-height', '90vh', 'important');
      m._hgSized = true;
    } else if (m._hgSized) {
      SIZED.forEach(function (p) { m.style.removeProperty(p); });
      m._hgSized = false;
    }
  }

  function rerender() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    var b = m.querySelector('.hgv2-body');
    var stp = b ? b.scrollTop : 0;
    m.innerHTML = render();
    b = m.querySelector('.hgv2-body');
    if (b) b.scrollTop = stp;
    sizeFrame();
  }

  window.AEHG = {
    tab: function (t) { S.tab = t; rerender(); },
    sel: function (n) { S.sel = n; rerender(); },
    check: function (n, k) { try { maintDoCheck(n, k); } catch (e) { console.warn('[hangar-v02]', e); } },
    ins: function (t) { try { maintSetInsurance(t); } catch (e) { console.warn('[hangar-v02]', e); } }
  };

  function install() {
    if (typeof window.buildHangarModal !== 'function') { setTimeout(install, 250); return; }
    var nativeBuild = window.buildHangarModal;
    window.buildHangarModal = function () {
      try {
        try { S.tab = (typeof _hangarTab !== 'undefined' && _hangarTab) ? _hangarTab : S.tab; } catch (e) {}
        var html = render();
        setTimeout(sizeFrame, 0);
        return html;
      } catch (err) {
        console.warn('[hangar-v02] render failed, stock hangar shown', err);
        return nativeBuild.apply(this, arguments);
      }
    };
    /* keep our tab state in sync with native hangarSwitchTab */
    if (typeof window.hangarSwitchTab === 'function' && !window.hangarSwitchTab.__aeHg) {
      var nativeSwitch = window.hangarSwitchTab;
      var wrappedSwitch = function (t) { S.tab = t; return nativeSwitch.apply(this, arguments); };
      wrappedSwitch.__aeHg = true;
      window.hangarSwitchTab = wrappedSwitch;
    }
    /* clear frame sizing whenever another window takes the modal */
    var origOpen = window.openModal;
    if (typeof origOpen === 'function' && !origOpen.__aeHg) {
      var wrappedOpen = function () { var r = origOpen.apply(this, arguments); setTimeout(sizeFrame, 0); return r; };
      wrappedOpen.__aeHg = true;
      window.openModal = wrappedOpen;
    }
    var origClose = window.closeModal;
    if (typeof origClose === 'function' && !origClose.__aeHg) {
      var wrappedClose = function () { var r = origClose.apply(this, arguments); setTimeout(sizeFrame, 0); return r; };
      wrappedClose.__aeHg = true;
      window.closeModal = wrappedClose;
    }
  }
  install();
})();
