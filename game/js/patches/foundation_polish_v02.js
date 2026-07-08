(function(){
  function applyFoundationPolishV02(){
    try{
      document.documentElement.setAttribute('data-pn-foundation','v02');
      var badge=document.getElementById('build-badge');
      if(badge) badge.textContent='BUILD v6_23_4_56 \u00b7 FOUNDATION_POLISH_v02';
    }catch(e){ console.warn('Foundation polish v02 skipped', e); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyFoundationPolishV02); else applyFoundationPolishV02();
  // Re-assert after v01's own delayed passes (300ms / 1200ms) rewrite the badge.
  setTimeout(applyFoundationPolishV02,400);
  setTimeout(applyFoundationPolishV02,1400);
})();
