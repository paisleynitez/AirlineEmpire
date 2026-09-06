/* POPUP_RESIZE_v01 — every popup window gets one resize control: a diagonal-line
   grip pinned to its LOWER-RIGHT corner (approved in prototypes/hr-window rev 4).
   Rules:
   • Minimum size = the window's own opened size, so content can never be squashed,
     malformed, or cut off — windows only grow from their designed layout.
   • Maximum size is capped at a reasonable ceiling (1060×700, and never past the
     viewport gutter). The cap also applies to the OPENED size: a window whose own
     CSS would open it larger is clamped down, so nothing stretches near-fullscreen.
   • Resize lives in the lower-right grip ONLY. No edge handles, no other corners.
   • Fixed-size windows (NO_RESIZE list, e.g. Route Manager) show no grip at all.
   • Double-clicking the window header resets it to its opened size (re-centred by
     the overlay's flex centering from css/popup-align-v01.css).
   UI-only: no game logic touched; inline sizes are cleared whenever a popup closes
   or its content is re-rendered, so sizes never bleed between windows.
   Native CSS resize (e.g. Route Manager's resize:both) is disabled via
   css/popup-resize-v01.css so the grip is the ONLY resize control and stray inline
   sizes can no longer bleed between windows through the shared #modal-content.
   Buy Aircraft keeps its own resize (buy_aircraft_resize_v01.js) — skipped here.
   Styling lives in css/popup-resize-v01.css. */
(function popupResizeV01(){
  'use strict';
  if (window.AEPopupResizeV01) return;
  window.AEPopupResizeV01 = true;

  // Popups that get the grip. Each entry: the window element id.
  const TARGET_IDS = ['modal-content', 'lab-content', 'ac-pop-card'];
  const SKIP_CLASS = 'ae-bp-resizable';       // Buy Aircraft manages its own resize
  const HEADER_SELECTOR = '.modal-header,.lab-header,.ac-pop-header,.rov-header,.nr-header,.rm-header,.cm-header,.bf-header,.projects-head,.neg-header,.ops-report-header';
  const CAP_W = 1060, CAP_H = 700;            // default ceiling for EVERY window
  // Per-window ceilings (matched by class on the popup element, first match wins).
  // Route Manager: approved max ≈ image-3 size; it opens smaller via
  // css/route-manager-compact-v01.css and may grow only this far.
  const CAPS = [
    { cls: 'modal-route-manager', w: 1064, h: 562 }
  ];
  // Windows that get NO resize control at all (fixed size; opened-size clamp still applies).
  const NO_RESIZE = ['modal-route-manager'];
  const GUTTER = 48;                           // keep clear of the viewport edges

  function capOf(el){
    const hit = el && CAPS.find(c => el.classList.contains(c.cls));
    return hit || { w: CAP_W, h: CAP_H };
  }
  function capW(el){ return Math.min(capOf(el).w, innerWidth  - GUTTER); }
  function capH(el){ return Math.min(capOf(el).h, innerHeight - GUTTER); }
  const grips = new Map();                     // el.id -> grip element
  let active = null;                           // current drag state

  function visible(el){
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function makeGrip(target){
    const g = document.createElement('div');
    g.className = 'ae-rs-grip';
    g.title = 'Resize';
    g.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true">'
      + '<line x1="2" y1="12" x2="12" y2="2"/>'
      + '<line x1="6" y1="12" x2="12" y2="6"/>'
      + '<line x1="10" y1="12" x2="12" y2="10"/></svg>';
    g.addEventListener('pointerdown', e => startResize(e, target));
    g.addEventListener('dblclick', e => { e.preventDefault(); resetSize(target); });
    document.body.appendChild(g);
    return g;
  }

  function gripFor(target){
    let g = grips.get(target.id);
    if (!g){ g = makeGrip(target); grips.set(target.id, g); }
    return g;
  }

  function place(){
    TARGET_IDS.forEach(id => {
      const el = document.getElementById(id);
      const g = el ? gripFor(el) : grips.get(id);
      if (!g) return;
      if (!el || !visible(el)){
        g.style.display = 'none';
        if (el && !visible(el)) clearSize(el);   // popup closed → forget its inline size
        return;
      }
      // The opened-size clamp applies to EVERY visible popup, grip or not.
      if (!el.dataset.aeRsW){                    // first frame visible → clamp + record opened size
        const r0 = el.getBoundingClientRect();
        const w0 = Math.min(Math.round(r0.width),  capW(el));
        const h0 = Math.min(Math.round(r0.height), capH(el));
        if (w0 < Math.round(r0.width))  el.style.setProperty('width',  w0 + 'px', 'important');
        if (h0 < Math.round(r0.height)) el.style.setProperty('height', h0 + 'px', 'important');
        el.dataset.aeRsW = w0;
        el.dataset.aeRsH = h0;
      }
      // The grip is shown only for resizable windows.
      const noGrip = el.classList.contains(SKIP_CLASS)
        || NO_RESIZE.some(cls => el.classList.contains(cls));
      if (noGrip){ g.style.display = 'none'; return; }
      const r = el.getBoundingClientRect();
      g.style.display = 'block';
      g.style.left = Math.round(r.right - 22) + 'px';
      g.style.top  = Math.round(r.bottom - 22) + 'px';
    });
  }

  function clearSize(el){
    if (!el) return;
    delete el.dataset.aeRsW; delete el.dataset.aeRsH;
    ['position','left','top','margin','transform','width','height']
      .forEach(p => el.style.removeProperty(p));
  }

  function resetSize(el){
    // Back to the window's own opened size; overlay flex centering takes over again.
    ['position','left','top','margin','transform','width','height']
      .forEach(p => el.style.removeProperty(p));
    delete el.dataset.aeRsW; delete el.dataset.aeRsH;  // re-measure natural size
    place();
  }

  function startResize(e, el){
    if (e.button !== 0) return;
    const r = el.getBoundingClientRect();
    const minW = parseInt(el.dataset.aeRsW, 10) || r.width;
    const minH = parseInt(el.dataset.aeRsH, 10) || r.height;
    const maxW = Math.max(minW, capW(el));
    const maxH = Math.max(minH, capH(el));
    // Lock the window's top-left so the grip tracks the cursor exactly.
    el.style.setProperty('position', 'fixed', 'important');
    el.style.setProperty('left',  r.left + 'px', 'important');
    el.style.setProperty('top',   r.top  + 'px', 'important');
    el.style.setProperty('margin', '0', 'important');
    el.style.setProperty('transform', 'none', 'important');
    active = { el, x: e.clientX, y: e.clientY, w: r.width, h: r.height, minW, minH, maxW, maxH, pid: e.pointerId };
    document.body.classList.add('ae-rs-active');
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function moveResize(e){
    if (!active || (e.pointerId !== undefined && e.pointerId !== active.pid)) return;
    const w = Math.min(active.maxW, Math.max(active.minW, active.w + e.clientX - active.x));
    const h = Math.min(active.maxH, Math.max(active.minH, active.h + e.clientY - active.y));
    active.el.style.setProperty('width',  w + 'px', 'important');
    active.el.style.setProperty('height', h + 'px', 'important');
    place();
  }

  function endResize(e){
    if (!active) return;
    if (e && e.pointerId !== undefined && e.pointerId !== active.pid) return;
    document.body.classList.remove('ae-rs-active');
    active = null;
  }

  function onHeaderDblclick(e){
    const head = e.target.closest && e.target.closest(HEADER_SELECTOR);
    if (!head) return;
    for (const id of TARGET_IDS){
      const el = document.getElementById(id);
      if (el && el.contains(head)){ resetSize(el); break; }
    }
  }

  function wrapOpenModal(){
    const orig = window.openModal;
    if (typeof orig !== 'function' || orig.__aePopupResize) return false;
    const w = function(){
      const c = document.getElementById('modal-content');
      if (c) clearSize(c);                      // fresh content → fresh natural size
      const out = orig.apply(this, arguments);
      place();
      return out;
    };
    w.__aePopupResize = true;
    window.openModal = w;
    return true;
  }

  function init(){
    if (!wrapOpenModal()) { setTimeout(init, 250); return; }
    document.addEventListener('pointermove', moveResize, true);
    document.addEventListener('pointerup', endResize, true);
    document.addEventListener('pointercancel', endResize, true);
    document.addEventListener('dblclick', onHeaderDblclick, true);
    window.addEventListener('resize', place);
    setInterval(place, 200);                    // light tracker: keeps grip glued to the corner
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
