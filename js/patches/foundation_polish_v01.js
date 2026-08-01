(function(){
  function applyFoundationPolish(){
    try{
      document.documentElement.setAttribute('data-pn-foundation','v01');
      var badge=document.getElementById('build-badge');
      if(badge) badge.textContent='BUILD v6_23_4_56 · FOUNDATION_POLISH_v01';
      var oldChip=document.getElementById('pn-foundation-chip');
      if(oldChip) oldChip.remove();
      // Keep the previous no-footer/no-ticker decision in place without deleting DOM.
      var ticker=document.getElementById('stock-ticker');
      if(ticker) ticker.classList.remove('visible');
      var footer=document.querySelector('#home-statbar');
      if(footer) footer.style.display='none';
    }catch(e){ console.warn('Foundation polish skipped', e); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyFoundationPolish); else applyFoundationPolish();
  setTimeout(applyFoundationPolish,300);
  setTimeout(applyFoundationPolish,1200);
})();
