/* RESEARCH_REDIRECT_v01 — TEMPORARY. The sidebar "Research" item opens the
   RESEARCH & UPGRADES window (the one "Research History" used to lead to) directly,
   instead of the interim Research Hub page. Wraps navGo(); the hub page and its
   builder are untouched, so removing this script's line in index.html restores it. */
(function researchRedirectV01(){
  'use strict';
  if (window.AEResearchRedirectV01) return;
  window.AEResearchRedirectV01 = true;
  function wrap(){
    const orig = window.navGo;
    if (typeof orig !== 'function' || orig.__aeResearchRedirect) return false;
    const w = function(el, key){
      if (key === 'research') {
        if (el && el.parentElement) { el.parentElement.querySelectorAll('.ae-nav-item').forEach(n => n.classList.remove('active')); el.classList.add('active'); }
        try { openModal('projects'); } catch(e) { console.error('[research-redirect]', e); }
        return;
      }
      return orig.apply(this, arguments);
    };
    w.__aeResearchRedirect = true; window.navGo = w; return true;
  }
  function init(){ if (!wrap()) setTimeout(init, 250); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
