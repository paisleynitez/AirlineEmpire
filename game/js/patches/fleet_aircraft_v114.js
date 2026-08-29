(function fleetAircraftV114(){
  'use strict';

  if (window.AEFleetAircraftV114) return;

  let queued = false;

  function normalizeModel(value){
    return String(value || '').replace(/[★☆]/g,'').replace(/\s+/g,' ').trim();
  }

  function manifestEntry(model){
    const manifest = window.AEAircraftImageManifest;
    if (!manifest || !manifest.byModel) return null;
    if (manifest.byModel[model]) return manifest.byModel[model];
    const target = model.replace(/[\s-]/g,'').toLowerCase();
    const key = Object.keys(manifest.byModel).find(function(k){
      return k.replace(/[\s-]/g,'').toLowerCase() === target;
    });
    return key ? manifest.byModel[key] : null;
  }

  function modalFor(flp){
    return flp.closest('#modal-content, .modal');
  }

  function upgradeThumb(row){
    const thumb = row.querySelector('.flp-plane-thumb');
    const nameEl = row.querySelector('.flp-ac-name');
    if (!thumb || !nameEl) return;
    const model = normalizeModel(nameEl.textContent);
    const entry = manifestEntry(model);
    if (!entry || !entry.path || thumb.dataset.aeFleetImage === entry.path) return;
    thumb.dataset.aeFleetImage = entry.path;
    thumb.classList.add('has-aircraft-image');
    thumb.style.backgroundImage = "linear-gradient(90deg,rgba(2,12,19,.04),rgba(2,12,19,.015) 58%,rgba(2,12,19,.16)),url('" + entry.path + "')";
    thumb.style.backgroundSize = 'cover';
    thumb.style.backgroundPosition = 'center';
    thumb.textContent = '';
    thumb.title = (entry.name || model) + ' aircraft preview';
    thumb.setAttribute('role','img');
    thumb.setAttribute('aria-label',(entry.name || model) + ' aircraft preview');
  }

  function rowText(row){
    return String(row.textContent || '').toLowerCase();
  }

  function applyFilters(flp){
    const toolbar = flp.querySelector('.ae-fleet-toolbar');
    if (!toolbar) return;
    const search = toolbar.querySelector('.ae-fleet-search');
    const status = toolbar.querySelector('.ae-fleet-status');
    const query = String(search && search.value || '').trim().toLowerCase();
    const statusValue = String(status && status.value || 'all').toLowerCase();
    let shown = 0;

    flp.querySelectorAll('.flp-row').forEach(function(row){
      const text = rowText(row);
      const visible = (!query || text.includes(query)) && (statusValue === 'all' || text.includes(statusValue));
      row.style.display = visible ? '' : 'none';
      if (visible) shown += 1;
    });

    const empty = flp.querySelector('.ae-fleet-empty');
    if (empty) empty.classList.toggle('visible', shown === 0);
  }

  function setView(flp, mode){
    const modal = modalFor(flp);
    if (!modal) return;
    modal.classList.toggle('fleet-grid-view', mode === 'grid');
    flp.querySelectorAll('.ae-fleet-view').forEach(function(btn){
      const active = btn.dataset.view === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function addToolbar(flp){
    if (flp.querySelector('.ae-fleet-toolbar')) return;
    const body = flp.querySelector('.flp-body');
    const table = flp.querySelector('.flp-table');
    if (!body || !table) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'ae-fleet-toolbar';
    toolbar.innerHTML =
      '<div class="ae-fleet-tools-left">' +
        '<input class="ae-fleet-search" type="search" placeholder="Search aircraft..." aria-label="Search aircraft">' +
        '<select class="ae-fleet-status" aria-label="Filter aircraft status">' +
          '<option value="all">All Status</option>' +
          '<option value="active">Active</option>' +
          '<option value="operational">Operational</option>' +
          '<option value="maintenance">Maintenance</option>' +
          '<option value="leased">Leased</option>' +
        '</select>' +
      '</div>' +
      '<div class="ae-fleet-tools-right" aria-label="Fleet view">' +
        '<button class="ae-fleet-view active" type="button" data-view="list" aria-label="List view" aria-pressed="true">☷</button>' +
        '<button class="ae-fleet-view" type="button" data-view="grid" aria-label="Grid view" aria-pressed="false">▦</button>' +
      '</div>';

    body.insertBefore(toolbar, table);

    if (!flp.querySelector('.ae-fleet-empty')) {
      const empty = document.createElement('div');
      empty.className = 'ae-fleet-empty';
      empty.textContent = 'No aircraft match the current filters.';
      table.insertAdjacentElement('afterend', empty);
    }

    toolbar.addEventListener('input', function(){ applyFilters(flp); });
    toolbar.addEventListener('change', function(){ applyFilters(flp); });
    toolbar.addEventListener('click', function(event){
      const button = event.target.closest('.ae-fleet-view');
      if (!button) return;
      setView(flp, button.dataset.view || 'list');
    });
  }

  function markFleet(flp){
    const modal = modalFor(flp);
    if (!modal) return;
    modal.classList.add('fleet-upgrade-modal');
    modal.setAttribute('data-ae-fleet-ui','v114');
  }

  function cleanup(){
    document.querySelectorAll('.fleet-upgrade-modal').forEach(function(modal){
      if (!modal.querySelector('.flp')) {
        modal.classList.remove('fleet-upgrade-modal','fleet-grid-view');
        modal.removeAttribute('data-ae-fleet-ui');
      }
    });
  }

  function enhanceFleet(){
    queued = false;
    cleanup();
    const surfaces = document.querySelectorAll('.flp');
    if (!surfaces.length) return;

    surfaces.forEach(function(flp){
      markFleet(flp);
      addToolbar(flp);
      flp.querySelectorAll('.flp-row').forEach(upgradeThumb);
      applyFilters(flp);
    });
  }

  function scheduleEnhance(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(enhanceFleet);
  }

  function init(){
    scheduleEnhance();
    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.AEFleetAircraftV114.observer = observer;
    window.addEventListener('resize',scheduleEnhance,{passive:true});

    /* bounded fallback catches fleet modals inserted by late legacy renderers */
    let checks = 0;
    const timer = setInterval(function(){
      scheduleEnhance();
      checks += 1;
      if (checks >= 20) clearInterval(timer);
    },250);
  }

  window.AEFleetAircraftV114 = {
    version:'v1.1.14',
    refresh:scheduleEnhance,
    observer:null
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
