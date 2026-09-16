/* POPUP_STABILITY_v01 (rev 2) — house rule: no popup window may jump. Period.
   Applied to every overlay/window pair in the game (main modal system,
   aircraft purchase popup, lab overlay). Three guards:

   1. SCROLL KEEPER — most windows rebuild their entire content on every
      click, which silently resets any scrolled area back to the top. Scroll
      positions of every scrollable area are remembered as the user scrolls
      and restored the instant the content is rebuilt (before paint), so
      nothing visibly moves.

   2. TOP ANCHOR (normal windows) — the overlay flex-centers its window, so
      any change in content height used to shift the whole window up or down
      to re-center it. Each window's top edge is frozen at the spot it first
      appears; content growth expands downward instead of moving the window.

   3. HARD PIN (fixed-size windows, dataset.aeFixed='1' on the window) —
      the window is pinned with position:fixed at its natural centered
      coordinates, and a watchdog re-asserts those coordinates the moment
      ANY other code perturbs them (stray inline left/top, leftover margins,
      overlay flex changes, residual classes from other windows — whatever
      the cause, the window snaps back before the next paint). This is the
      categorical no-jump guarantee.

   Re-measured only when a different window takes the overlay or the
   viewport itself resizes. Pure UI patch — no gameplay code touched; new
   windows added later are covered automatically. */
(function () {
  'use strict';
  if (window.AEPopupStability) return;
  window.AEPopupStability = true;

  var PAIRS = [
    ['modal-overlay', 'modal-content'],
    ['ac-pop', 'ac-pop-card'],
    ['lab-overlay', 'lab-content']
  ];

  function init() { PAIRS.forEach(function (p) { setup(p[0], p[1]); }); }

  function setup(ovId, ctId) {
    var ov = document.getElementById(ovId);
    var ct = document.getElementById(ctId);
    if (!ov || !ct) return;

    var mem = {};        /* scroll-container key -> last user scrollTop */
    var sig = null;      /* signature of the window currently in the overlay */
    var mode = null;     /* null | 'anchor' | 'pin' */
    var pinned = null;   /* {l, t} style values for pin mode */
    var target = null;   /* {tl, tt} RENDERED coordinates the pin must land on */
    var asserting = false;
    var patrol = null;   /* interval that verifies the rendered rect while pinned */
    var docLock = null;  /* saved overflow values while the document is locked */

    /* While any window is up, the document must not scroll or grow a
       scrollbar — either one shifts the entire page a few pixels on click
       (Firefox nudges scroll on focus; scrollbar appearance reflows layout).
       Locked on freeze, restored on unfreeze. */
    function lockDoc() {
      if (docLock !== null) return;
      var de = document.documentElement, b = document.body;
      docLock = { de: de.style.getPropertyValue('overflow'), b: b.style.getPropertyValue('overflow') };
      de.style.setProperty('overflow', 'hidden', 'important');
      b.style.setProperty('overflow', 'hidden', 'important');
      if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    }
    function unlockDoc() {
      if (docLock === null) return;
      var de = document.documentElement, b = document.body;
      if (docLock.de) de.style.setProperty('overflow', docLock.de); else de.style.removeProperty('overflow');
      if (docLock.b) b.style.setProperty('overflow', docLock.b); else b.style.removeProperty('overflow');
      docLock = null;
    }

    function isOpen() {
      var d = getComputedStyle(ov).display;
      return d !== 'none' && ct.firstElementChild;
    }
    function signature() {
      var f = ct.firstElementChild;
      return f ? ((f.className && String(f.className)) || f.tagName) : '';
    }
    function keyFor(el) {
      if (el.id) return '#' + el.id;
      var c = (el.className && typeof el.className === 'string') ? el.className.split(' ')[0] : '';
      return c || el.tagName;
    }
    function findByKey(k) {
      if (k.charAt(0) === '#') return document.getElementById(k.slice(1));
      try { return ct.querySelector('.' + (window.CSS && CSS.escape ? CSS.escape(k) : k)); }
      catch (e) { return null; }
    }

    /* 1 ── scroll keeper */
    ov.addEventListener('scroll', function (e) {
      var el = e.target;
      if (el && el.nodeType === 1) mem[keyFor(el)] = el.scrollTop;
    }, true);

    function restoreScroll() {
      Object.keys(mem).forEach(function (k) {
        var el = findByKey(k);
        if (el && el.scrollHeight > el.clientHeight && Math.abs(el.scrollTop - mem[k]) > 1) {
          el.scrollTop = mem[k];
        }
      });
    }

    /* 2/3 ── geometry lock */
    function clearOverrides() {
      asserting = true;
      ov.style.removeProperty('align-items');
      ['margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'margin',
       'position', 'left', 'top', 'right', 'bottom', 'transform'].forEach(function (p) { ct.style.removeProperty(p); });
      asserting = false;
    }
    function unfreeze() {
      clearOverrides();
      mode = null; pinned = null; target = null;
      if (patrol) { clearInterval(patrol); patrol = null; }
      unlockDoc();
    }
    function assertPin() {
      if (mode !== 'pin' || !pinned) return;
      var s = ct.style;
      if (s.getPropertyValue('position') === 'fixed' &&
          s.getPropertyValue('left') === pinned.l &&
          s.getPropertyValue('top') === pinned.t &&
          s.getPropertyValue('margin') === '0px' &&
          s.getPropertyValue('transform') === 'none') return;   /* already correct */
      asserting = true;
      s.setProperty('position', 'fixed', 'important');
      s.setProperty('left', pinned.l, 'important');
      s.setProperty('top', pinned.t, 'important');
      s.setProperty('margin', '0px', 'important');
      s.setProperty('transform', 'none', 'important');
      s.removeProperty('right'); s.removeProperty('bottom');
      asserting = false;
    }
    /* the pin is judged by where the window actually RENDERS, not by its style
       values — ancestor effects (filters/transforms toggling) can shift fixed
       coordinates without touching this element's style at all. Measure, and
       nudge the style values until the rendered rect sits on target. */
    function ensureRect() {
      if (mode !== 'pin' || !pinned || !target) return;
      for (var i = 0; i < 3; i++) {
        var r = ct.getBoundingClientRect();
        var dl = Math.round(target.tl - r.left), dt = Math.round(target.tt - r.top);
        /* dead-zone: at browser zoom levels, rects come back fractional and a
           1px "correction" can ping-pong forever — only real drift is fixed */
        if (Math.abs(dl) < 2 && Math.abs(dt) < 2) return;
        pinned = { l: (parseFloat(pinned.l) + dl) + 'px', t: (parseFloat(pinned.t) + dt) + 'px' };
        asserting = true;
        ct.style.setProperty('left', pinned.l, 'important');
        ct.style.setProperty('top', pinned.t, 'important');
        asserting = false;
      }
    }
    function freeze() {
      if (!isOpen()) return;
      lockDoc();
      clearOverrides();                             /* measure the natural centered spot */
      var r = ct.getBoundingClientRect();
      if (!isFinite(r.top) || !isFinite(r.left)) return;
      var top = Math.max(0, Math.round(r.top));
      if (ct.dataset.aeFixed === '1') {
        /* hard pin, deterministically CENTERED: the spot is computed from the
           viewport and the window's own size — never from transient layout —
           so it is identical on every open. ensureRect then walks the style
           values until the rendered rect actually sits there. */
        target = {
          tl: Math.max(0, Math.round((window.innerWidth - r.width) / 2)),
          tt: Math.max(0, Math.round((window.innerHeight - r.height) / 2))
        };
        pinned = { l: target.tl + 'px', t: target.tt + 'px' };
        mode = 'pin';
        assertPin();
        ensureRect();
        if (!patrol) patrol = setInterval(ensureRect, 120);
      } else {
        /* top anchor: keep centered look, growth expands downward */
        asserting = true;
        ov.style.setProperty('align-items', 'flex-start', 'important');
        ct.style.setProperty('margin-top', top + 'px', 'important');
        ct.style.setProperty('margin-bottom', '0', 'important');
        asserting = false;
        mode = 'anchor';
      }
    }

    var mo = new MutationObserver(function (recs) {
      if (asserting) return;
      if (!isOpen()) {
        if (mode) unfreeze();
        mem = {}; sig = null;
        return;
      }
      var s = signature();
      if (s !== sig) {          /* a different window took this overlay */
        sig = s;
        mem = {};
        freeze();
        return;
      }
      /* same window: keep scroll, and defend the pin against any style writes */
      restoreScroll();
      if (!mode) freeze();
      else if (mode === 'pin') {
        /* if the window flipped between fixed/non-fixed content, re-evaluate */
        if (ct.dataset.aeFixed !== '1') freeze();
        else { assertPin(); ensureRect(); }
      } else if (mode === 'anchor' && ct.dataset.aeFixed === '1') {
        freeze();               /* window declared itself fixed after first render */
      }
    });
    mo.observe(ov, { attributes: true, attributeFilter: ['style', 'class'] });
    mo.observe(ct, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    /* viewport resize is the one legitimate reason to re-place a window */
    window.addEventListener('resize', function () {
      if (mode && isOpen()) freeze();
    });
    /* and if anything scrolls the document while a window is up, undo it */
    window.addEventListener('scroll', function () {
      if (mode && (window.scrollX || window.scrollY)) window.scrollTo(0, 0);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
