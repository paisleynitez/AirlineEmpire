/* NIGHT_MAP_v01 (rev B — "dark satellite")
   Keeps the original daytime satellite raster (full terrain clarity) but
   color-grades it darker so it sits with the executive-command UI instead of
   fighting it: brightness/saturation pulled down via CSS filter on
   image.sat-img, night-tint eased to 0.28.
   (rev A swapped in a NASA Black Marble night texture; retired for legibility —
   fetch/cache code removed. localStorage key ae_night_map_v01 is now unused.) */
(function () {
  'use strict';
  if (window.AENightMapV01) return;
  window.AENightMapV01 = true;

  var FILTER = 'brightness(0.55) saturate(0.7) contrast(1.05)';
  var TINT_OPACITY = '0.28';
  var scheduled = false;

  function applyAll() {
    var imgs = document.querySelectorAll('image.sat-img');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].style.filter !== FILTER) imgs[i].style.filter = FILTER;
    }
    var tints = document.querySelectorAll('rect.night-tint');
    for (var j = 0; j < tints.length; j++) {
      if (tints[j].getAttribute('opacity') !== TINT_OPACITY) {
        tints[j].setAttribute('opacity', TINT_OPACITY);
      }
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      applyAll();
    }, 50);
  }

  function start() {
    applyAll();
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes.length) { schedule(); return; }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
