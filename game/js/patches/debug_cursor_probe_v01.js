/* DEBUG_CURSOR_PROBE_v01 — TEMPORARY diagnostic. Press F9 in the game to
   toggle a small readout at the top of the screen. It live-reports, for the
   element currently under the mouse:
     tag.class · computed cursor · window rect · page scroll · viewport size
   and flashes red the moment the window rect or page scroll CHANGES, showing
   the delta. Purpose: capture, on the user's own browser (Firefox), exactly
   which element shows a hand cursor and exactly what moves on click.
   Delete this file + its index.html line once diagnosed. No game logic. */
(function () {
  'use strict';
  if (window.AECursorProbe) return;
  window.AECursorProbe = true;

  var badge = null, on = false, last = null;

  /* activation: press F9 in-game, OR open the game as index.html?probe */
  if (/[?&]probe/.test(location.search)) { on = true; }

  function fmtRect() {
    var m = document.getElementById('modal-content');
    if (!m) return 'no-modal';
    var r = m.getBoundingClientRect();
    return Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
  }
  function state() {
    return fmtRect() + ' | scroll ' + Math.round(window.scrollX) + ',' + Math.round(window.scrollY) +
      ' | vp ' + window.innerWidth + 'x' + window.innerHeight;
  }
  function ensureBadge() {
    if (badge) return badge;
    badge = document.createElement('div');
    badge.id = 'ae-cursor-probe';
    badge.style.cssText = 'position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      'background:rgba(5,10,20,.95);color:#cfe6ff;border:1px solid #4a8;border-radius:8px;' +
      'padding:5px 12px;font:11px/1.5 monospace;pointer-events:none;white-space:pre;text-align:center;';
    document.body.appendChild(badge);
    return badge;
  }
  function report(e, kind) {
    if (!on) return;
    var el = e && e.target && e.target.nodeType === 1 ? e.target : null;
    var cur = el ? getComputedStyle(el).cursor : '?';
    var id = el ? (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
      (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) : '?';
    var s = state();
    var moved = last !== null && s !== last;
    var b = ensureBadge();
    b.style.borderColor = moved ? '#f55' : (/(pointer|grab)/.test(cur) ? '#fd5' : '#4a8');
    b.style.color = moved ? '#ffb0b0' : (/(pointer|grab)/.test(cur) ? '#ffe9a0' : '#cfe6ff');
    b.textContent = (kind || '') + ' ' + id + '\ncursor: ' + cur + (/(pointer|grab)/.test(cur) ? '  << HAND' : '') +
      '\n' + s + (moved ? '\nMOVED! was: ' + last : '');
    if (moved) { /* keep the MOVED line visible for a moment */ }
    last = s;
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'F9') {
      on = !on;
      var b = ensureBadge();
      b.style.display = on ? 'block' : 'none';
      if (on) { last = null; b.textContent = 'probe ON — hover / click the problem icon'; }
    }
  }, true);
  document.addEventListener('pointermove', function (e) { report(e, 'over'); }, true);
  document.addEventListener('pointerdown', function (e) { report(e, 'DOWN'); }, true);
  document.addEventListener('pointerup', function (e) { report(e, 'up'); }, true);
  if (on) {
    var boot = function () { var b = ensureBadge(); b.textContent = 'probe ON — hover / click the problem icon'; };
    if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot, { once: true });
  }
})();
