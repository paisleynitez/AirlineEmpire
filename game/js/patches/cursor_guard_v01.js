/* CURSOR_GUARD_v01 — runtime enforcement of the house rule: NEVER the hand
   cursor, arrow only. CSS rules can be beaten by higher-specificity rules,
   stale-cached stylesheets, or scripts setting cursors at runtime — this
   guard cannot:

   • The moment the mouse moves over (or presses) ANY element whose computed
     cursor is pointer/grab/grabbing, that element is forced to the arrow via
     an inline !important style — which outranks every stylesheet rule that
     exists or will ever exist.
   • Elements whose inline style is given a hand cursor by scripts are swept
     back to the arrow continuously.
   • A last-in-head style tag re-asserts the global arrow rules and keeps
     itself last even when other patches inject stylesheets after load.
   • Native drag ghosts (image/selection drags show an OS drag cursor that
     CSS cannot restyle) are suppressed entirely.

   Functional cursors are preserved: text fields keep the I-beam, resize
   grips keep their resize arrows, sliders keep ew-resize. UI-only. */
(function () {
  'use strict';
  if (window.AECursorGuard) return;
  window.AECursorGuard = true;

  var HAND = { pointer: 1, grab: 1, grabbing: 1 };
  var KEEP = /(^|\s)(popup-resize-grip)(\s|$)/;

  function functional(el) {
    if (!el || el.nodeType !== 1) return true;
    var t = el.tagName;
    if (t === 'TEXTAREA') return true;
    if (t === 'INPUT') return true;                     /* text/number/range keep theirs */
    var cls = typeof el.className === 'string' ? el.className : '';
    if (KEEP.test(cls) || /resize-grip/.test(cls)) return true;
    return false;
  }

  function disarm(el) {
    if (functional(el)) return;
    try {
      var c = getComputedStyle(el).cursor;
      if (HAND[c]) el.style.setProperty('cursor', 'default', 'important');
    } catch (e) {}
  }

  /* force the arrow exactly where the mouse is, the moment it gets there */
  document.addEventListener('pointerover', function (e) { disarm(e.target); }, true);
  document.addEventListener('pointerdown', function (e) { disarm(e.target); }, true);

  /* scripts that write hand cursors into inline styles get swept back */
  function sweep() {
    document.querySelectorAll('[style*="cursor"]').forEach(function (el) {
      var v = el.style.cursor;
      if (HAND[v] && !functional(el)) el.style.setProperty('cursor', 'default', 'important');
    });
  }

  /* keep a final arrow stylesheet as the LAST thing in <head> */
  var CSS_TEXT =
    'body.ae-executive-command *{cursor:default !important}' +
    'body.ae-executive-command input[type="text"],body.ae-executive-command input[type="number"],' +
    'body.ae-executive-command input[type="search"],body.ae-executive-command textarea{cursor:text !important}' +
    'body.ae-executive-command .popup-resize-grip,body.ae-executive-command [class*="resize-grip"]{cursor:nwse-resize !important}' +
    'body.ae-executive-command input[type="range"]{cursor:ew-resize !important}' +
    'img,svg,canvas{-webkit-user-drag:none;user-drag:none}';
  function assertLast() {
    var s = document.getElementById('ae-cursor-guard-style');
    if (!s) {
      s = document.createElement('style');
      s.id = 'ae-cursor-guard-style';
      s.textContent = CSS_TEXT;
    }
    if (document.head && document.head.lastElementChild !== s) document.head.appendChild(s);
  }

  /* native drags show an unstylable OS hand/drag cursor — never allow them */
  document.addEventListener('dragstart', function (e) { e.preventDefault(); }, true);

  setInterval(function () { assertLast(); sweep(); }, 300);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { assertLast(); sweep(); }, { once: true });
  } else { assertLast(); sweep(); }
})();
