/* HOTKEYS_v01 — global keyboard shortcuts.

   Rules:
     • Dashboard-only shortcuts (R, F, and any future single-letter keys) fire only
       when no modal is open. They call the exact same handler that clicking the
       matching left-nav item would (navGo(null, key)).
     • C closes the topmost open modal — universal, only fires when a modal exists.
     • ? (Shift+/ or plain "?") shows a keyboard help popup — always active.
     • Keys are ignored while the user is typing in inputs/textareas/contentEditable,
       or when a modifier key (Ctrl/Cmd/Alt) is held, so browser shortcuts stay intact.

   Adding a new dashboard shortcut is one entry in DASH_SHORTCUTS. The help popup
   is generated from that array — one source of truth for what's documented. */
(function () {
  'use strict';
  if (window.AEHotkeysV01) return;
  window.AEHotkeysV01 = true;

  // Dashboard-only shortcuts — mirror clicking the left nav item.
  // Nav keys available: dash, routes, fleet, airports, cargo, maintenance,
  //                     finance, marketing, research, alliances, hr, reports, logs
  var DASH_SHORTCUTS = [
    { key: 'r', label: 'R', name: 'Routes', fn: function () { if (typeof navGo === 'function') navGo(null, 'routes'); } },
    { key: 'f', label: 'F', name: 'Fleet',  fn: function () { if (typeof navGo === 'function') navGo(null, 'fleet');  } }
  ];

  // Universal shortcuts — active regardless of modal state
  var UNIVERSAL = [
    { label: 'C',       name: 'Close window',      when: 'when a window is open' },
    { label: '?',       name: 'Show this help',    when: 'anywhere' }
  ];

  function isModalOpen() {
    var m = document.getElementById('modal-overlay');
    return !!(m && m.classList.contains('open'));
  }

  function isEditableFocused() {
    var t = document.activeElement;
    if (!t) return false;
    var tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (t.isContentEditable) return true;
    return false;
  }

  document.addEventListener('keydown', function (e) {
    // Never intercept typing or browser shortcuts
    if (isEditableFocused()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    var k = (e.key || '').toLowerCase();

    // If help popup is open, any key dismisses it (except we still let ? re-open logic run)
    var helpOpen = !!document.getElementById('ae-hotkeys-help');
    if (helpOpen && k !== '?') {
      hideHelp();
      // fall through — let the pressed key still take effect
    }

    // ? — always show help (Shift+/ on most layouts also lands here)
    if (k === '?' || (e.shiftKey && k === '/')) {
      e.preventDefault();
      if (helpOpen) hideHelp(); else showKeyboardHelp();
      return;
    }

    // C — universal close, but only when a modal is actually open
    if (k === 'c') {
      if (isModalOpen()) {
        e.preventDefault();
        try { if (typeof closeModal === 'function') closeModal(); } catch (err) { /* keep silent */ }
      }
      return;
    }

    // Dashboard-only shortcuts — blocked when any modal is open
    if (isModalOpen()) return;
    var s = DASH_SHORTCUTS.find(function (x) { return x.key === k; });
    if (!s) return;
    e.preventDefault();
    try { s.fn(); } catch (err) { /* keep silent */ }
  });

  function hideHelp() {
    var el = document.getElementById('ae-hotkeys-help');
    if (el) el.remove();
  }

  function showKeyboardHelp() {
    hideHelp(); // never stack
    var rows = DASH_SHORTCUTS.map(function (s) {
      return '<div class="aehk-row"><kbd>' + s.label + '</kbd><span>' + s.name + '</span><em>from dashboard</em></div>';
    }).join('') + UNIVERSAL.map(function (s) {
      return '<div class="aehk-row"><kbd>' + s.label + '</kbd><span>' + s.name + '</span><em>' + s.when + '</em></div>';
    }).join('');
    var el = document.createElement('div');
    el.id = 'ae-hotkeys-help';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Keyboard shortcuts');
    el.innerHTML =
      '<div class="aehk-shell" onclick="event.stopPropagation()">' +
        '<div class="aehk-head"><b>Keyboard Shortcuts</b><span class="aehk-x" onclick="AEHotkeysV01Hide()">×</span></div>' +
        '<div class="aehk-body">' + rows + '</div>' +
        '<div class="aehk-foot">Press any key to dismiss</div>' +
      '</div>';
    el.addEventListener('click', hideHelp);
    document.body.appendChild(el);
  }

  window.AEHotkeysV01Hide = hideHelp;
  // Expose showKeyboardHelp on window so future patches or UI can call it (e.g. a "?" button)
  window.showKeyboardHelp = showKeyboardHelp;
  window.AEHK = { SHORTCUTS: DASH_SHORTCUTS, UNIVERSAL: UNIVERSAL, show: showKeyboardHelp, hide: hideHelp };
})();
