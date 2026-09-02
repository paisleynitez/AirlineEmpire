/* WINDOW_CHROME_v01 — every window gets the same single × close box, nothing else.
   • Fleet & Aircraft page: had no close control at all — a standard .modal-close ×
     is added to the top-right of its header (same box style as every other window).
   • Slot Negotiations (Airports): the footer "Close" button is hidden; the header ×
     remains (its grip/pin/minimize are hidden by css/slot-window-chrome-v01.css).
   Wraps openModal(); no game logic touched. */
(function windowChromeV01(){
  'use strict';
  if (window.AEWindowChromeV01) return;
  window.AEWindowChromeV01 = true;

  function addFleetClose(){
    const c = document.getElementById('modal-content'); if (!c) return;
    const head = c.querySelector('.flp-head'); if (!head || head.querySelector('.modal-close')) return;
    const b = document.createElement('button');
    b.className = 'modal-close ae-flp-close'; b.type = 'button'; b.setAttribute('aria-label', 'Close');
    b.setAttribute('onclick', 'closeModal()'); b.textContent = '×';
    head.appendChild(b);
  }
  function wrap(){
    const orig = window.openModal;
    if (typeof orig !== 'function' || orig.__aeWinChrome) return false;
    const w = function(type){ const out = orig.apply(this, arguments); if (type === 'fleet-page') addFleetClose(); return out; };
    w.__aeWinChrome = true; window.openModal = w; return true;
  }
  function init(){ if (!wrap()) setTimeout(init, 250); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
