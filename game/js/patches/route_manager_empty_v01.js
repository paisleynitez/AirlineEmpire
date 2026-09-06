/* ROUTE_MANAGER_EMPTY_v01 — Option C empty state ("centered dialog", 460px).
   Wraps _rmInner: when Route Manager has zero routes, renders a stacked
   compact dialog (kicker / title / sub / stats row incl. ready fleet / CTA)
   and sizes the frame from JS with priority-important inline styles, which
   beats the resize-grip memory that CSS could not. Frame styles are cleared
   again the moment the normal route list renders. Core functions untouched. */
(function () {
  'use strict';
  if (window.AERouteManagerEmptyV01) return;
  window.AERouteManagerEmptyV01 = true;

  var SIZED_PROPS = ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'align-self', 'margin'];

  function emptyMarkup() {
    var fallbackEntry = Object.entries(AIRCRAFT).find(function (e) { return e[1].era <= STATE.year; }) || Object.entries(AIRCRAFT)[0];
    var emptyEntry = Object.entries(STATE.planes || {}).find(function (e) { return (e[1].owned || 0) > 0; }) || fallbackEntry;
    var emptyName = emptyEntry[0];
    var emptyHub = (STATE.hubs || [])[0] || STATE.homeBase || 'Home';
    var emptyHubCode = (CITIES[emptyHub] && CITIES[emptyHub].abbr) || emptyHub;
    var readyAircraft = Object.values(STATE.planes || {}).reduce(function (s, p) {
      return s + Math.max(0, (p.owned || 0) - (p.assigned || 0));
    }, 0);
    return '<div class="rme-c">' +
      '<div class="rme-kick"><i></i>NETWORK READY</div>' +
      '<div class="rme-title">Your network starts here.</div>' +
      '<div class="rme-sub">Choose a destination from ' + emptyHub + ' and put your available fleet to work.</div>' +
      '<div class="rme-stats">' +
        '<div><b>' + emptyHubCode + '</b><span>Home hub</span></div>' +
        '<div><b>' + readyAircraft + '</b><span>Aircraft ready</span></div>' +
        '<div><b>' + emptyName + '</b><span>Ready fleet</span></div>' +
      '</div>' +
      '<button type="button" class="rm-empty-action rme-cta" onclick="closeModal();openModal(\'new-route\')">' +
        '<span>Plan First Route</span><span aria-hidden="true">&#8594;</span></button>' +
    '</div>';
  }

  function sizeFrame() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    var isEmptyRM = m.classList.contains('modal-route-manager') && !!m.querySelector('.rme-c');
    if (isEmptyRM) {
      m.style.setProperty('width', '460px', 'important');
      m.style.setProperty('min-width', '0', 'important');
      m.style.setProperty('max-width', '460px', 'important');
      m.style.setProperty('height', 'auto', 'important');
      m.style.setProperty('min-height', '0', 'important');
      m.style.setProperty('max-height', 'none', 'important');
      m.style.setProperty('align-self', 'flex-start', 'important');
      m.style.setProperty('margin', '26vh auto auto', 'important');
      m._rmeSized = true;
    } else if (m._rmeSized) {
      SIZED_PROPS.forEach(function (p) { m.style.removeProperty(p); });
      m._rmeSized = false;
    }
  }

  function install() {
    var orig = window._rmInner;
    if (typeof orig !== 'function') { setTimeout(install, 250); return; }
    window._rmInner = function () {
      var html = orig.apply(this, arguments);
      if (html.indexOf('rm-empty--routes') !== -1) {
        try { html = emptyMarkup(); } catch (e) { /* fall back to stock */ }
      }
      setTimeout(sizeFrame, 0);
      return html;
    };
    /* the modal element is shared by every window — clear our frame sizing on
       every open/close so it can never leak onto another window */
    var origOpen = window.openModal;
    if (typeof origOpen === 'function') {
      window.openModal = function () {
        var r = origOpen.apply(this, arguments);
        setTimeout(sizeFrame, 0);
        return r;
      };
    }
    var origClose = window.closeModal;
    if (typeof origClose === 'function') {
      window.closeModal = function () {
        var r = origClose.apply(this, arguments);
        setTimeout(sizeFrame, 0);
        return r;
      };
    }
  }
  install();
})();
