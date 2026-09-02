/* BUY_AIRCRAFT_RESIZE_v01 — makes the Buy Aircraft window resizable in height
   (drag the bottom-right corner) and remembers the chosen height across launches;
   width always hugs the content.
   UI-only: wraps openModal() to tag the shared modal element while Buy Aircraft
   is open and to clear that tag (and any inline size) for every other window,
   so the size never bleeds into other popups. Styling lives in
   css/buy-aircraft-v01.css (.ae-bp-resizable). */
(function buyAircraftResizeV01(){
  'use strict';
  if (window.AEBuyAircraftResizeV01) return;
  window.AEBuyAircraftResizeV01 = true;

  const KEY = 'aeBuyPlanesSize';
  const CLS = 'ae-bp-resizable';
  let ro = null;

  function load(){ try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return (v && v.w > 0 && v.h > 0) ? v : null; } catch(e){ return null; } }
  function save(w, h){ try { localStorage.setItem(KEY, JSON.stringify({ w: Math.round(w), h: Math.round(h) })); } catch(e){} }

  function clear(c){
    if (!c) return;
    if (ro) { try { ro.disconnect(); } catch(e){} ro = null; }
    if (c.classList.contains(CLS)) {
      c.classList.remove(CLS);
      c.style.width = '';
      c.style.height = '';
    }
    c.classList.remove('ae-ac-guide');
  }

  function arm(c){
    c.classList.add(CLS);
    const s = load();
    if (s) { c.style.height = s.h + 'px'; }            // width follows content; only height is user-set
    if (window.ResizeObserver) {
      let base = null;                                   // size at open; only a real change is saved
      ro = new ResizeObserver(() => {
        if (!c.classList.contains(CLS)) return;
        const r = c.getBoundingClientRect();
        if (!r.width || !r.height) return;
        if (!base) { base = { w: r.width, h: r.height }; return; }
        if (Math.abs(r.width - base.w) < 2 && Math.abs(r.height - base.h) < 2) return;
        save(r.width, r.height);
      });
      ro.observe(c);
    }
  }

  function wrap(){
    const orig = window.openModal;
    if (typeof orig !== 'function' || orig.__aeBpResize) return false;
    const w = function(type, arg){
      const c = document.getElementById('modal-content');
      clear(c);
      const out = orig.apply(this, arguments);
      if (type === 'buy-planes' && c) arm(c);
      return out;
    };
    w.__aeBpResize = true;
    window.openModal = w;
    return true;
  }

  function wrapClose(){
    const orig = window.closeModal;
    if (typeof orig !== 'function' || orig.__aeBpResize) return;
    const w = function(){ const out = orig.apply(this, arguments); clear(document.getElementById('modal-content')); return out; };
    w.__aeBpResize = true;
    window.closeModal = w;
  }

  // Aircraft Identity Guide reuses the same modal element without going through
  // openModal(): drop the Buy Aircraft sizing and tag it so its body fills the window.
  function wrapGuide(){
    const orig = window.openAircraftIdentityGuide;
    if (typeof orig !== 'function' || orig.__aeBpResize) return;
    const w = function(){
      const c = document.getElementById('modal-content');
      clear(c);
      const out = orig.apply(this, arguments);
      if (c) c.classList.add('ae-ac-guide');
      return out;
    };
    w.__aeBpResize = true;
    window.openAircraftIdentityGuide = w;
  }

  function init(){ if (wrap()) { wrapClose(); wrapGuide(); } else setTimeout(init, 250); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
