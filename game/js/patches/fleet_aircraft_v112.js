(function fleetAircraftV112(){
  'use strict';

  if (window.AEFleetAircraftV112) return;

  let queued = false;

  function normalizeModel(value){
    return String(value || '')
      .replace(/[★☆]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function manifestEntry(model){
    const manifest = window.AEAircraftImageManifest;
    if (!manifest || !manifest.byModel) return null;
    if (manifest.byModel[model]) return manifest.byModel[model];

    const target = model.replace(/[\s-]/g, '').toLowerCase();
    const key = Object.keys(manifest.byModel).find(function(k){
      return k.replace(/[\s-]/g, '').toLowerCase() === target;
    });
    return key ? manifest.byModel[key] : null;
  }

  function upgradeThumb(row){
    const thumb = row.querySelector('.flp-plane-thumb');
    const nameEl = row.querySelector('.flp-ac-name');
    if (!thumb || !nameEl) return;

    const model = normalizeModel(nameEl.textContent);
    const entry = manifestEntry(model);
    if (!entry || !entry.path) return;

    if (thumb.dataset.aeFleetImage === entry.path) return;
    thumb.dataset.aeFleetImage = entry.path;
    thumb.classList.add('has-aircraft-image');
    thumb.style.backgroundImage = "linear-gradient(90deg,rgba(2,12,19,.06),rgba(2,12,19,.02) 58%,rgba(2,12,19,.18)),url('" + entry.path + "')";
    thumb.style.backgroundSize = 'cover';
    thumb.style.backgroundPosition = 'center';
    thumb.textContent = '';
    thumb.title = (entry.name || model) + ' aircraft preview';
    thumb.setAttribute('role', 'img');
    thumb.setAttribute('aria-label', (entry.name || model) + ' aircraft preview');
  }

  function markModal(flp){
    const modal = flp.closest('#modal-content, .modal');
    if (!modal) return;
    modal.classList.add('fleet-upgrade-modal');
    modal.setAttribute('data-ae-fleet-ui', 'v112');
  }

  function enhanceFleet(){
    queued = false;
    const surfaces = document.querySelectorAll('.flp');
    if (!surfaces.length) return;

    surfaces.forEach(function(flp){
      markModal(flp);
      flp.querySelectorAll('.flp-row').forEach(upgradeThumb);
    });
  }

  function scheduleEnhance(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(enhanceFleet);
  }

  function installObserver(){
    const root = document.getElementById('modal-content') || document.body;
    const observer = new MutationObserver(function(mutations){
      for (const mutation of mutations) {
        if (mutation.type !== 'childList' || (!mutation.addedNodes.length && !mutation.removedNodes.length)) continue;
        scheduleEnhance();
        break;
      }
    });
    observer.observe(root, { childList:true, subtree:true });
    window.AEFleetAircraftV112.observer = observer;
  }

  function init(){
    scheduleEnhance();
    installObserver();
    window.addEventListener('resize', scheduleEnhance, { passive:true });
  }

  window.AEFleetAircraftV112 = {
    version:'v1.1.12',
    refresh:scheduleEnhance,
    observer:null
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
