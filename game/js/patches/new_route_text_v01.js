/* NEW_ROUTE_TEXT_v01 (rev C) — UI-only wrapper around nrRouteHero + frame size.
   - Blanks the "Choose destination" placeholder on the route line.
   - Empty destination slot shows the label "DESTINATION" ABOVE the dash.
   - Frame: the resize-grip memory stamps an inline width on #modal-content,
     which stylesheet rules cannot beat — so on every modal open, if the
     New Route window is showing, its frame is sized here from JS
     (priority-important inline), and those props are removed again the
     moment any other window takes the frame. Core functions untouched. */
(function () {
  'use strict';
  if (window.AENewRouteTextV01) return;
  window.AENewRouteTextV01 = true;

  var SIZED_PROPS = ['width', 'max-width', 'height', 'max-height'];

  function sizeFrame() {
    var m = document.getElementById('modal-content');
    if (!m) return;
    if (m.classList.contains('modal-new-route')) {
      m.style.setProperty('width', 'min(645px, 94vw)', 'important');
      m.style.setProperty('max-width', 'min(645px, 94vw)', 'important');
      m.style.setProperty('height', 'auto', 'important');
      m.style.setProperty('max-height', '84vh', 'important');
      m._nrSized = true;
    } else if (m._nrSized) {
      SIZED_PROPS.forEach(function (p) { m.style.removeProperty(p); });
      m._nrSized = false;
    }
  }

  function install() {
    var orig = window.nrRouteHero;
    if (typeof orig !== 'function') { setTimeout(install, 250); return; }
    window.nrRouteHero = function () {
      return orig.apply(this, arguments)
        .replace('>Choose destination<', '><')
        .replace('<strong>\u2014</strong><small>DESTINATION</small>',
                 '<small>DESTINATION</small><strong>\u2014</strong>');
    };
    var hero = document.getElementById('nr-route-hero');
    if (hero) { try { hero.innerHTML = window.nrRouteHero(); } catch (e) {} }

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
    setTimeout(sizeFrame, 0);
  }
  install();
})();
