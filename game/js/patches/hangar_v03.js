/* HANGAR_v03 — Hangar window rebuilt to the "Financial Log" concept skin:
   header with icon tile + month, five KPI cards, pill tab row (Health /
   Renewal / Insurance / Incidents), rounded content panel with per-tab
   filter chips, dynamic status banner, export row (fleet + incidents,
   CSV/JSON — read-only), footer with fine print + Close.
   All gameplay still runs through native functions only:
   maintDoCheck / maintSetInsurance / maintGetHealth / maintIsGrounded /
   buildFleetRenewal / INSURANCE_TIERS / MAINTENANCE_CHECKS.
   Frame sized from JS (resize memory beats CSS); sizing cleared when any
   other window takes the modal. Replaces HANGAR_v02. */
(function () {
  'use strict';
  if (window.AEHangarV03) return;
  window.AEHangarV03 = true;

  var S = { tab: 'fleet', sel: null, filt: 'all', incf: 'all' };
  var SIZED = ['width', 'max-width', 'height', 'max-height'];

  function money(n) { return '$' + (Math.round(n * 10) / 10).toLocaleString() + 'M'; }
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function owned() { return Object.entries(STATE.planes || {}).filter(function (e) { return e[1].owned > 0; }); }
  function healthOf(n) { try { return Math.round(maintGetHealth(n).health); } catch (e) { return 100; } }
  function monthLabel() {
    try { return (typeof MONTHS !== 'undefined' ? MONTHS[STATE.month] : '') + ' ' + STATE.year; }
    catch (e) { return ''; }
  }

  /* ---- inline SVG icons (stroke follows currentColor) ---- */
  var IC = {
    wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 7a3.5 3.5 0 0 0 4.4 4.4L20 9l-1-3-3-1-1.6 1.6A3.5 3.5 0 0 0 14 7z"/><path d="M13 9.5l-7.4 7.4a2 2 0 1 0 2.8 2.8L15.5 12"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6.5" rx="7.5" ry="3"/><path d="M4.5 6.5v5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-5M4.5 11.5v5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-5"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 15l9-2.6V5a1 1 0 0 1 2 0v7.4l9 2.6v1.8l-9-2v3.4l2.6 1.6v1.4L12 21l-3.6 1.2v-1.4L11 19.2v-3.4l-9 2z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.2-4.6-9.2-9A5 5 0 0 1 12 6.5 5 5 0 0 1 21.2 11c-2 4.4-9.2 9-9.2 9z"/><path d="M4 12h4l1.6-2.6L12 14l1.6-2H20"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 2.6v5.2c0 4.6-3 8.1-7 10.2-4-2.1-7-5.6-7-10.2V5.6z"/><path d="M9 12l2 2 4-4"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5L21.5 20h-19z"/><path d="M12 10v4.5M12 17.4v.1"/></svg>',
    renew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 3v4.5h-4.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10M8 10l4 4 4-4"/><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.1"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
  };

  function art(n) {
    try {
      var a = STATE.planes[n] || AIRCRAFT[n];
      var idn = (typeof acIdentity === 'function') ? acIdentity(n) : null;
      var hero = (typeof AC_HERO !== 'undefined') ? AC_HERO[n] : null;
      return hero ? '<img src="' + hero + '" alt="">'
        : (typeof aircraftSVG === 'function' ? aircraftSVG(n, a, (idn && idn.color2) || '#00d8f0', true) : '\u2708');
    } catch (e) { return '\u2708'; }
  }

  function statusKey(n) {
    if (typeof maintIsGrounded === 'function' && maintIsGrounded(n)) return 'grounded';
    var h = healthOf(n);
    if (h < 35) return 'crit';
    if (h < 60) return 'warn';
    return 'ok';
  }

  function badge(n) {
    var k = statusKey(n);
    if (k === 'grounded') {
      var mo = (typeof maintGroundingMonthsLeft === 'function') ? maintGroundingMonthsLeft(n) : '';
      return '<span class="hgv3-badge red">GROUNDED' + (mo ? ' ' + mo + 'MO' : '') + '</span>';
    }
    if (k === 'crit') return '<span class="hgv3-badge red">CRITICAL</span>';
    if (k === 'warn') return '<span class="hgv3-badge amber">ATTENTION</span>';
    return '<span class="hgv3-badge slate">AIRWORTHY</span>';
  }

  function stats() {
    var list = owned();
    var total = list.reduce(function (s, e) { return s + e[1].owned; }, 0);
    var groundedTypes = list.filter(function (e) { return statusKey(e[0]) === 'grounded'; });
    var groundedCount = groundedTypes.reduce(function (s, e) { return s + e[1].owned; }, 0);
    var avg = list.length ? Math.round(list.reduce(function (s, e) { return s + healthOf(e[0]); }, 0) / list.length) : 100;
    var service = list.filter(function (e) { return healthOf(e[0]) < 60; }).length;
    var openInc = (STATE.maintenanceIncidents || []).filter(function (i) { return !i.resolved; }).length;
    return { total: total, covered: total - groundedCount, grounded: groundedCount, avg: avg, service: service, openInc: openInc, types: list.length };
  }

  /* ---- KPI card row ---- */
  function kpi(icon, iconCls, label, value, valCls) {
    return '<div class="hgv3-kpi"><span class="hgv3-kic ' + (iconCls || '') + '">' + icon + '</span>' +
      '<span class="hgv3-ktxt"><small>' + label + '</small><b class="' + (valCls || '') + '">' + value + '</b></span>' +
      '<span class="hgv3-kchev">' + IC.chev + '</span></div>';
  }

  /* ---- pill tab row ---- */
  var TAB_HELP = {
    fleet: 'Inspect condition and schedule maintenance for your fleet.',
    renewal: 'Review leases and replace aging aircraft.',
    insurance: 'Choose fleet-wide coverage and premiums.',
    incidents: 'Review reports and active maintenance events.'
  };
  function tabPill(id, icon, name) {
    return '<button class="hgv3-tab' + (S.tab === id ? ' on' : '') + '" onclick="AEHG3.tab(\'' + id + '\')">' +
      '<span class="hgv3-tabic">' + icon + '</span>' + name + '</button>';
  }

  /* ---- content panel ---- */
  var PANEL_META = {
    fleet: { icon: IC.heart, title: 'FLEET HEALTH', sub: 'Condition and maintenance for every aircraft type.' },
    renewal: { icon: IC.renew, title: 'FLEET RENEWAL', sub: 'Leases and aging aircraft.' },
    insurance: { icon: IC.shield, title: 'INSURANCE', sub: 'Coverage tiers and premiums.' },
    incidents: { icon: IC.warn, title: 'INCIDENTS', sub: 'Reports and active events.' }
  };

  function chips() {
    function chip(fn, key, cur, label) {
      return '<button class="hgv3-chip' + (cur === key ? ' on' : '') + '" onclick="AEHG3.' + fn + '(\'' + key + '\')">' + label + '</button>';
    }
    if (S.tab === 'fleet') {
      return chip('filt', 'all', S.filt, 'All') + chip('filt', 'ok', S.filt, 'Airworthy') +
        chip('filt', 'warn', S.filt, 'Attention') + chip('filt', 'grounded', S.filt, 'Grounded');
    }
    if (S.tab === 'incidents') {
      return chip('incf', 'all', S.incf, 'All') + chip('incf', 'open', S.incf, 'Open') + chip('incf', 'done', S.incf, 'Resolved');
    }
    return '';
  }

  function matchFilt(n) {
    var k = statusKey(n);
    if (S.filt === 'all') return true;
    if (S.filt === 'ok') return k === 'ok';
    if (S.filt === 'warn') return k === 'warn' || k === 'crit';
    return k === 'grounded';
  }

  function healthTab() {
    var list = owned();
    if (!list.length) return '<div class="hgv3-emptymsg">No aircraft in fleet yet.</div>';
    if (!S.sel || !STATE.planes[S.sel] || !STATE.planes[S.sel].owned) S.sel = list[0][0];
    var shown = list.filter(function (e) { return matchFilt(e[0]); });
    var rows = shown.length ? shown.map(function (e) {
      var n = e[0], h = healthOf(n);
      var col = (typeof maintHealthColor === 'function') ? maintHealthColor(h) : 'var(--profit)';
      return '<div class="hgv3-acrow' + (S.sel === n ? ' on' : '') + '" onclick="AEHG3.sel(\'' + esc(n) + '\')">' +
        '<span class="hgv3-acart">' + art(n) + '</span>' +
        '<span class="hgv3-acmid"><b>' + n + '</b>' + badge(n) + '</span>' +
        '<span class="hgv3-ach" style="color:' + col + '">' + h + '%</span>' +
        '<span class="hgv3-acchev">' + IC.chev + '</span></div>';
    }).join('')
      : '<div class="hgv3-emptymsg">No aircraft match this filter. <button class="hgv3-linkbtn" onclick="AEHG3.filt(\'all\')">Show all</button></div>';

    var n = S.sel;
    var h = null; try { h = maintGetHealth(n); } catch (e) { h = { health: 100, checksDone: 0, wearPerMonth: 0 }; }
    var health = Math.round(h.health);
    var col = (typeof maintHealthColor === 'function') ? maintHealthColor(health) : 'var(--profit)';
    var p = STATE.planes[n] || {};
    var ownYrs = Math.max(0, (STATE.year || 1970) - (p._acqYear != null ? Math.round(p._acqYear) : (STATE.year || 1970)));
    var wear = h.wearPerMonth != null ? h.wearPerMonth : (h.wear != null ? h.wear : 0);
    var checks = h.checksDone != null ? h.checksDone : (h.checks || 0);
    var grounded = statusKey(n) === 'grounded';
    var condition = health >= 85 ? 'Aircraft is in excellent condition.'
      : health >= 60 ? 'Aircraft is in serviceable condition.'
      : health >= 35 ? 'Aircraft needs attention \u2014 schedule maintenance.'
      : 'Aircraft condition is critical \u2014 high incident risk.';

    function action(key, name2, sub, downtime, cls) {
      var c = MAINTENANCE_CHECKS[key];
      var ok = STATE.cash >= c.cost && !(grounded && key !== 'engine');
      return '<div class="hgv3-act ' + cls + '">' +
        '<div class="hgv3-acthead"><span class="hgv3-actic">' + IC.wrench + '</span><span><b>' + name2 + '</b><small>' + sub + '</small></span></div>' +
        '<div class="hgv3-actrow"><small>Cost</small><b>' + money(c.cost) + '</b></div>' +
        '<div class="hgv3-actrow"><small>Downtime</small><b>' + downtime + '</b></div>' +
        '<div class="hgv3-actrow"><small>Health</small><b class="up">+' + c.healthRestore + '%</b></div>' +
        '<button class="hgv3-actbtn" ' + (ok ? 'onclick="AEHG3.check(\'' + esc(n) + '\',\'' + key + '\')"' : 'disabled title="' + (grounded ? 'Grounded' : 'Need ' + money(c.cost)) + '"') + '>Schedule</button></div>';
    }

    return '<div class="hgv3-split">' +
      '<div class="hgv3-list"><div class="hgv3-listhead">AIRCRAFT (' + shown.length + (shown.length !== list.length ? ' of ' + list.length : '') + ')</div>' + rows + '</div>' +
      '<div class="hgv3-detail">' +
        '<div class="hgv3-dhead"><div><b>' + n + '</b> ' + badge(n) +
          '<div class="hgv3-dsub">' + ((AIRCRAFT[n] || {}).type || '') + ' \u00b7 ' + (p.owned || 0) + ' owned \u00b7 in fleet ' + ownYrs + ' yr' + (ownYrs !== 1 ? 's' : '') + '</div></div>' +
          '<span class="hgv3-dart">' + art(n) + '</span></div>' +
        '<div class="hgv3-hcard"><small>AIRCRAFT HEALTH</small>' +
          '<div class="hgv3-hbarwrap"><div class="hgv3-hbar"><i style="width:' + health + '%;background:' + col + '"></i></div><b style="color:' + col + '">' + health + '%</b></div>' +
          '<em>' + condition + '</em></div>' +
        '<div class="hgv3-tiles">' +
          '<div><small>AGE</small><b>' + ownYrs + ' yr</b><em>In fleet</em></div>' +
          '<div><small>WEAR RATE</small><b>' + (Math.round(wear * 10) / 10) + '%/mo</b><em>Monthly wear</em></div>' +
          '<div><small>CHECKS DONE</small><b>' + checks + '</b><em>Total completed</em></div>' +
          '<div><small>STATUS</small><b style="color:' + (grounded ? 'var(--loss)' : col) + '">' + (grounded ? 'GROUNDED' : health < 60 ? 'ATTENTION' : 'AIRWORTHY') + '</b><em>' + (grounded ? 'In repair' : 'No issues') + '</em></div>' +
        '</div>' +
        '<div class="hgv3-actlbl">MAINTENANCE ACTIONS</div>' +
        '<div class="hgv3-acts">' +
          action('light', 'A-Check', 'Routine maintenance', 'None', 'a') +
          action('heavy', 'C-Check', 'Major maintenance', '1 month', 'c') +
          action('engine', 'Engine Overhaul', 'Full engine service', '2 months', 'e') +
        '</div>' +
      '</div></div>';
  }

  function insuranceTab() {
    var cur = STATE.insurance || 'standard';
    var costMo = 0; try { costMo = maintInsuranceCostPerMonth(); } catch (e) {}
    return '<div class="hgv3-inswrap"><div class="hgv3-insnote">Current premium: <b>' + money(costMo) + '/mo</b> for the whole fleet.</div>' +
      Object.keys(INSURANCE_TIERS).map(function (k) {
        var t = INSURANCE_TIERS[k];
        return '<div class="hgv3-ins' + (cur === k ? ' on' : '') + '">' +
          '<div class="hgv3-inshead"><b>' + t.name + '</b>' + (cur === k ? '<span class="hgv3-badge green">ACTIVE</span>' : '') + '</div>' +
          '<div class="hgv3-insrow"><small>Premium</small><b>' + money(t.cost) + '/aircraft/mo</b></div>' +
          '<div class="hgv3-insrow"><small>Coverage</small><b>' + Math.round(t.cover * 100) + '% of incident costs</b></div>' +
          '<em>' + t.desc + '</em>' +
          (cur === k ? '' : '<button class="hgv3-actbtn" onclick="AEHG3.ins(\'' + k + '\')">Select</button>') +
        '</div>';
      }).join('') + '</div>';
  }

  function incidentsTab() {
    var inc = (STATE.maintenanceIncidents || []).slice().reverse();
    if (S.incf === 'open') inc = inc.filter(function (i) { return !i.resolved; });
    if (S.incf === 'done') inc = inc.filter(function (i) { return i.resolved; });
    if (!inc.length) {
      return '<div class="hgv3-emptymsg">' +
        (S.incf === 'all' ? 'No incidents on record. Keep fleet health high to keep it that way.'
          : 'No ' + (S.incf === 'open' ? 'open' : 'resolved') + ' incidents. <button class="hgv3-linkbtn" onclick="AEHG3.incf(\'all\')">Show all</button>') +
        '</div>';
    }
    return '<div class="hgv3-incwrap">' + inc.slice(0, 30).map(function (i) {
      return '<div class="hgv3-inc' + (i.resolved ? ' done' : '') + '">' +
        '<span class="hgv3-incic">' + (i.emoji || '\u26a0') + '</span>' +
        '<span class="hgv3-incmid"><b>' + (i.label || 'Incident') + '</b><small>' + (i.text || '') + '</small></span>' +
        '<span class="hgv3-incend">' + (i.resolved ? '<span class="hgv3-badge slate">RESOLVED</span>' : '<span class="hgv3-badge red">OPEN</span>') +
        (i.cost ? '<small>' + money(i.cost) + '</small>' : '') + '</span></div>';
    }).join('') + '</div>';
  }

  function renewalTab() {
    try { if (typeof buildFleetRenewal === 'function') return '<div class="hgv3-renewal">' + buildFleetRenewal() + '</div>'; } catch (e) {}
    return '<div class="hgv3-emptymsg">Renewal data unavailable.</div>';
  }

  /* ---- dynamic status banner ---- */
  function banner(st) {
    var head, line;
    if (!st.types) {
      head = 'No aircraft in the hangar yet \u2014 buy your first aircraft to begin tracking health.';
      line = 'Once you own aircraft, condition, maintenance history and incidents appear here.';
    } else if (st.grounded > 0) {
      head = st.grounded + ' aircraft grounded \u2014 repairs are in progress.';
      line = 'Grounded aircraft return to service automatically when their downtime ends.';
    } else if (st.openInc > 0) {
      head = st.openInc + ' open incident' + (st.openInc !== 1 ? 's' : '') + ' \u2014 review the Incidents tab.';
      line = 'Higher insurance tiers cover more of each incident\u2019s cost.';
    } else if (st.service > 0) {
      head = st.service + ' aircraft type' + (st.service !== 1 ? 's' : '') + ' below 60% health \u2014 schedule maintenance.';
      line = 'Low health raises incident risk and can ground aircraft for months.';
    } else {
      head = 'Fleet in good shape \u2014 all aircraft airworthy.';
      line = 'Keep health high with regular A-Checks to avoid incidents and costly repairs.';
    }
    return '<div class="hgv3-banner"><span class="hgv3-banic">' + IC.doc + '</span>' +
      '<span class="hgv3-bantxt"><b>' + head + '</b><small>' + line + '</small></span></div>';
  }

  /* ---- exports (read-only) ---- */
  function dl(name, text, mime) {
    try {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' }));
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 150);
    } catch (e) { console.warn('[hangar-v03] export failed', e); }
  }
  function stamp() {
    var m = (STATE.month != null ? STATE.month + 1 : 0);
    return (STATE.year || '') + '-' + (m < 10 ? '0' : '') + m;
  }
  function fleetData() {
    return owned().map(function (e) {
      var n = e[0], p = e[1], h = null;
      try { h = maintGetHealth(n); } catch (er) { h = {}; }
      var ownYrs = Math.max(0, (STATE.year || 1970) - (p._acqYear != null ? Math.round(p._acqYear) : (STATE.year || 1970)));
      return {
        aircraft: n,
        type: (AIRCRAFT[n] || {}).type || '',
        owned: p.owned || 0,
        health_pct: Math.round(h.health != null ? h.health : 100),
        status: statusKey(n) === 'ok' ? 'airworthy' : statusKey(n),
        years_in_fleet: ownYrs,
        checks_done: h.checksDone != null ? h.checksDone : (h.checks || 0),
        wear_pct_per_month: Math.round(((h.wearPerMonth != null ? h.wearPerMonth : (h.wear || 0)) * 10)) / 10
      };
    });
  }
  function incidentData() {
    return (STATE.maintenanceIncidents || []).map(function (i) {
      return { incident: i.label || 'Incident', detail: i.text || '', cost_m: i.cost || 0, status: i.resolved ? 'resolved' : 'open' };
    });
  }
  function toCSV(rows) {
    if (!rows.length) return 'no data';
    var keys = Object.keys(rows[0]);
    function cell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    return keys.join(',') + '\n' + rows.map(function (r) { return keys.map(function (k) { return cell(r[k]); }).join(','); }).join('\n');
  }

  function exportBtn(kind, label) {
    return '<button class="hgv3-exp" onclick="AEHG3.exp(\'' + kind + '\')"><span class="hgv3-expic">' + IC.dl + '</span>' + label + '</button>';
  }

  /* ---- full render ---- */
  function render() {
    var st = stats();
    var body = S.tab === 'fleet' ? healthTab()
      : S.tab === 'insurance' ? insuranceTab()
      : S.tab === 'incidents' ? incidentsTab()
      : renewalTab();
    var pm = PANEL_META[S.tab] || PANEL_META.fleet;
    return '<div class="modal-header hgv3-head">' +
      '<span class="hgv3-hic">' + IC.wrench + '</span>' +
      '<div class="hgv3-title"><div class="modal-title">HANGAR \u2014 ' + monthLabel() + '</div>' +
        '<div class="hgv3-sub">Track your fleet\u2019s health, maintenance and coverage.</div></div>' +
      '<div class="hgv3-htag">STRONG FLEET<br>HIGHER ALTITUDES</div>' +
      '<button class="modal-close" onclick="closeModal()">\u00d7</button></div>' +
    '<div class="modal-body hgv3-body">' +
      '<div class="hgv3-kpis">' +
        kpi(IC.cash, 'green', 'CASH', money(STATE.cash), 'green') +
        kpi(IC.plane, '', 'FLEET OPERATIONAL', st.covered + ' / ' + st.total, '') +
        kpi(IC.heart, '', 'AVG HEALTH', st.avg + '%', st.avg < 60 ? 'red' : st.avg < 85 ? 'amber' : 'green') +
        kpi(IC.wrench, '', 'NEEDS SERVICE', String(st.service), st.service ? 'amber' : '') +
        kpi(IC.warn, '', 'OPEN INCIDENTS', String(st.openInc), st.openInc ? 'red' : '') +
      '</div>' +
      '<div class="hgv3-tabbar">' +
        tabPill('fleet', IC.heart, 'Health') +
        tabPill('renewal', IC.renew, 'Renewal') +
        tabPill('insurance', IC.shield, 'Insurance') +
        tabPill('incidents', IC.warn, 'Incidents') +
        '<span class="hgv3-tabhelp">' + (TAB_HELP[S.tab] || '') + '</span>' +
      '</div>' +
      '<div class="hgv3-panel">' +
        '<div class="hgv3-panelhead">' +
          '<span class="hgv3-panic">' + pm.icon + '</span>' +
          '<span class="hgv3-pantxt"><b>' + pm.title + '</b><small>' + pm.sub + '</small></span>' +
          '<span class="hgv3-chips">' + chips() + '</span>' +
        '</div>' +
        '<div class="hgv3-panelbody">' + body + '</div>' +
      '</div>' +
      banner(st) +
      '<div class="hgv3-exports">' +
        exportBtn('fleetcsv', 'Export Fleet CSV') +
        exportBtn('fleetjson', 'Export Fleet JSON') +
        exportBtn('inccsv', 'Export Incidents CSV') +
        exportBtn('incjson', 'Export Incidents JSON') +
      '</div>' +
    '</div>' +
    '<div class="hgv3-foot">' +
      '<span class="hgv3-footic">' + IC.info + '</span>' +
      '<span class="hgv3-fine">Figures in $M. Health, wear, and insurance premiums update at the end of every month.</span>' +
      '<span class="hgv3-foottag"><span class="hgv3-footplane">' + IC.plane + '</span><span>REAL FLEET.<br>HIGHER TOMORROWS.</span></span>' +
      '<button class="hgv3-close" onclick="closeModal()">Close</button>' +
    '</div>';
  }

  function sizeFrame() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    if (m.querySelector('.hgv3-head')) {
      m.style.setProperty('width', 'min(1060px, 95vw)', 'important');
      m.style.setProperty('max-width', 'min(1060px, 95vw)', 'important');
      m.style.setProperty('height', 'auto', 'important');
      m.style.setProperty('max-height', '92vh', 'important');
      m._hgSized = true;
    } else if (m._hgSized) {
      SIZED.forEach(function (p) { m.style.removeProperty(p); });
      m._hgSized = false;
    }
  }

  function rerender() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    var b = m.querySelector('.hgv3-panelbody');
    var stp = b ? b.scrollTop : 0;
    m.innerHTML = render();
    b = m.querySelector('.hgv3-panelbody');
    if (b) b.scrollTop = stp;
    sizeFrame();
  }

  window.AEHG3 = {
    tab: function (t) { S.tab = t; rerender(); },
    sel: function (n) { S.sel = n; rerender(); },
    filt: function (f) { S.filt = f; rerender(); },
    incf: function (f) { S.incf = f; rerender(); },
    check: function (n, k) { try { maintDoCheck(n, k); } catch (e) { console.warn('[hangar-v03]', e); } },
    ins: function (t) { try { maintSetInsurance(t); } catch (e) { console.warn('[hangar-v03]', e); } },
    exp: function (kind) {
      if (kind === 'fleetcsv') dl('hangar-fleet-' + stamp() + '.csv', toCSV(fleetData()), 'text/csv');
      else if (kind === 'fleetjson') dl('hangar-fleet-' + stamp() + '.json', JSON.stringify(fleetData(), null, 2), 'application/json');
      else if (kind === 'inccsv') dl('hangar-incidents-' + stamp() + '.csv', toCSV(incidentData()), 'text/csv');
      else if (kind === 'incjson') dl('hangar-incidents-' + stamp() + '.json', JSON.stringify(incidentData(), null, 2), 'application/json');
    }
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
        console.warn('[hangar-v03] render failed, stock hangar shown', err);
        return nativeBuild.apply(this, arguments);
      }
    };
    /* keep our tab state in sync with native hangarSwitchTab */
    if (typeof window.hangarSwitchTab === 'function' && !window.hangarSwitchTab.__aeHg3) {
      var nativeSwitch = window.hangarSwitchTab;
      var wrappedSwitch = function (t) { S.tab = t; return nativeSwitch.apply(this, arguments); };
      wrappedSwitch.__aeHg3 = true;
      window.hangarSwitchTab = wrappedSwitch;
    }
    /* clear frame sizing whenever another window takes the modal */
    var origOpen = window.openModal;
    if (typeof origOpen === 'function' && !origOpen.__aeHg3) {
      var wrappedOpen = function () { var r = origOpen.apply(this, arguments); setTimeout(sizeFrame, 0); return r; };
      wrappedOpen.__aeHg3 = true;
      window.openModal = wrappedOpen;
    }
    var origClose = window.closeModal;
    if (typeof origClose === 'function' && !origClose.__aeHg3) {
      var wrappedClose = function () { var r = origClose.apply(this, arguments); setTimeout(sizeFrame, 0); return r; };
      wrappedClose.__aeHg3 = true;
      window.closeModal = wrappedClose;
    }
  }
  install();
})();
