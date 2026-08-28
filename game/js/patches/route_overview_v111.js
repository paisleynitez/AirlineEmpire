(function routeOverviewV111() {
  'use strict';

  if (window.RouteOverviewV111) return;

  const legacyOpenPnlModal = window.openPnlModal;
  let currentRoute = null;
  let pendingFare = 0;

  const html = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const routeMatches = (route, from, to) => route && (
    (route.from === from && route.to === to) ||
    (route.from === to && route.to === from)
  );

  const findRoute = (from, to) => (STATE.routes || []).find(route => routeMatches(route, from, to));

  const routeKey = route => `${route.from}__${route.to}`;

  function modalElements() {
    return {
      overlay: document.getElementById('modal-overlay'),
      modal: document.getElementById('modal-content')
    };
  }

  function resetRouteModalClasses(modal) {
    modal.classList.remove(
      'modal-wide', 'modal-new-route', 'modal-negotiations', 'modal-route-manager',
      'modal-projects', 'modal-budget', 'modal-city', 'modal-route-report-v111',
      'modal-route-overview-v111'
    );
  }

  function routeCapacity(route) {
    const planeList = route.planes && route.planes.length
      ? route.planes
      : [{ type: route.plane, flights: route.flights || 1 }];
    return planeList.reduce((sum, entry) => {
      const aircraft = STATE.planes[entry.type] || AIRCRAFT[entry.type] || AIRCRAFT.A320;
      return sum + (aircraft.seats || 0) * entry.flights * ECON.weeksPerMonth;
    }, 0);
  }

  function totalFlights(route) {
    const list = route.planes && route.planes.length
      ? route.planes
      : [{ type: route.plane, flights: route.flights || 1 }];
    return list.reduce((sum, entry) => sum + entry.flights, 0);
  }

  function statusFor(route, result) {
    const breakeven = breakevenLoad(route);
    if (result.profit < 0) return { label: 'Needs attention', color: 'var(--loss)', icon: '!' };
    if (result.load < breakeven) return { label: 'Watch', color: 'var(--warn)', icon: '!' };
    return { label: 'Healthy', color: 'var(--profit)', icon: '✓' };
  }

  function adviceFor(route, result, capacity) {
    const demand = result.demand || 0;
    if (demand >= capacity && result.load >= 90) {
      return {
        title: 'Demand is higher than current capacity.',
        body: 'Add capacity or test a slightly higher fare. The route has room to earn more.'
      };
    }
    try {
      const hints = routeHints(route, result) || [];
      if (hints.length) {
        return { title: hints[0].text, body: hints[0].fix || 'Review this route after the next month-end.' };
      }
    } catch (error) {
      // The compact overview can still render without advisory hints.
    }
    return {
      title: 'Route performance is steady.',
      body: 'No immediate change is required. Review again after the next month-end.'
    };
  }

  function currentResult(route) {
    return processRoute(route);
  }

  function renderOverview(route) {
    const { overlay, modal } = modalElements();
    if (!route || !overlay || !modal) return;

    currentRoute = route;
    pendingFare = route.fare || 200;

    const result = currentResult(route);
    const distance = Math.round(getDistance(route.from, route.to));
    const hours = flightHours(distance);
    const hoursText = `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
    const longHaul = isLongHaul(distance);
    const capacity = result.capacity || routeCapacity(route);
    const demand = result.demand || route._demand || 0;
    const breakeven = breakevenLoad(route);
    const totalRevenue = result.revenue + (result.foodRevenue || 0) + (result.drinkRevenue || 0) + (result.mhcRevenue || 0);
    const margin = totalRevenue > 0 ? Math.round(result.profit / totalRevenue * 100) : 0;
    const status = statusFor(route, result);
    const advice = adviceFor(route, result, capacity);
    const profitClass = result.profit >= 0 ? 'positive' : 'negative';
    const capacityAction = demand >= capacity ? 'Add capacity' : 'Adjust capacity';

    resetRouteModalClasses(modal);
    modal.classList.add('modal-route-overview-v111');
    modal.style.setProperty('--rov-status', status.color);
    modal.innerHTML = `
      <header class="rov-header">
        <div class="rov-title-group">
          <p class="rov-kicker">${longHaul ? 'Long-haul' : 'Short-haul'} · ${hoursText} · Current fare $${route.fare}</p>
          <h2 class="rov-title">${html(route.from)} → ${html(route.to)}</h2>
        </div>
        <div class="rov-status"><span class="rov-status-dot" aria-hidden="true"></span>${status.label}</div>
        <button class="rov-close" type="button" aria-label="Close route overview">×</button>
      </header>
      <div class="rov-body">
        <div class="rov-advice">
          <span class="rov-advice-icon" aria-hidden="true">${status.icon}</span>
          <div><strong>${html(advice.title)}</strong><span>${html(advice.body)}</span></div>
        </div>

        <div class="rov-metrics">
          <section class="rov-metric" aria-label="Monthly profit">
            <div class="rov-metric-label">Monthly profit</div>
            <div class="rov-metric-value ${profitClass}">${result.profit >= 0 ? '+' : '−'}$${Math.abs(result.profit).toFixed(2)}M</div>
            <div class="rov-metric-context">${margin}% margin</div>
          </section>
          <section class="rov-metric" aria-label="Passenger load">
            <div class="rov-metric-label">Passenger load</div>
            <div class="rov-metric-value">${result.load}%</div>
            <div class="rov-load-track" aria-label="${result.load} percent load with ${breakeven} percent breakeven">
              <span class="rov-load-fill" style="width:${Math.max(0, Math.min(100, result.load))}%"></span>
              <span class="rov-load-be" style="left:${Math.max(0, Math.min(100, breakeven))}%"></span>
            </div>
            <div class="rov-load-labels"><span>${result.load >= 95 ? 'Full' : `${result.load}% filled`}</span><span>BE ${breakeven}%</span></div>
          </section>
          <section class="rov-metric" aria-label="Monthly capacity">
            <div class="rov-metric-label">Monthly capacity</div>
            <div class="rov-metric-value">${Math.round(capacity).toLocaleString()}</div>
            <div class="rov-metric-context">${Math.round(demand).toLocaleString()} passenger demand</div>
          </section>
        </div>

        <div class="rov-actions" aria-label="Primary route actions">
          <button class="rov-action primary" type="button" data-rov-action="capacity" aria-pressed="false">${capacityAction}</button>
          <button class="rov-action" type="button" data-rov-action="fare" aria-pressed="false">Adjust fare</button>
          <button class="rov-action" type="button" data-rov-action="manage" aria-pressed="false">Manage route</button>
        </div>

        <div class="rov-drawer" data-rov-drawer aria-live="polite"></div>

        <button class="rov-report" type="button" data-rov-report>
          <span class="rov-report-icon" aria-hidden="true">▥</span>
          <span class="rov-report-copy"><strong>View full route report</strong><span>P&amp;L, cost detail, history and competition</span></span>
          <span class="rov-report-arrow" aria-hidden="true">›</span>
        </button>
      </div>`;

    overlay.classList.add('open');
    bindOverviewControls();
  }

  function bindOverviewControls() {
    const { modal } = modalElements();
    modal.querySelector('.rov-close')?.addEventListener('click', closeModal);
    modal.querySelector('[data-rov-report]')?.addEventListener('click', openFullReport);
    modal.querySelectorAll('[data-rov-action]').forEach(button => {
      button.addEventListener('click', () => openDrawer(button.dataset.rovAction));
    });
  }

  function drawerElement() {
    return modalElements().modal?.querySelector('[data-rov-drawer]');
  }

  function setActiveAction(action) {
    modalElements().modal?.querySelectorAll('[data-rov-action]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.rovAction === action));
    });
  }

  function closeDrawer() {
    const drawer = drawerElement();
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.innerHTML = '';
    setActiveAction('');
  }

  function drawerHeader(title, description, showBack = false) {
    return `<div class="rov-drawer-head">
      <div class="rov-drawer-title-row">
        ${showBack ? '<button class="rov-drawer-back" type="button" data-rov-back aria-label="Back to route management">‹</button>' : ''}
        <div><h3>${html(title)}</h3><p>${html(description)}</p></div>
      </div>
      <button class="rov-drawer-close" type="button" aria-label="Close ${html(title)}">×</button>
    </div>`;
  }

  function openDrawer(action) {
    const drawer = drawerElement();
    if (!drawer || !currentRoute) return;

    const renderers = {
      capacity: renderCapacityDrawer,
      fare: renderFareDrawer,
      manage: renderManageDrawer,
      fleet: renderFleetDrawer,
      service: renderServiceDrawer,
      settings: renderSettingsDrawer
    };
    const renderer = renderers[action];
    if (!renderer) return;

    drawer.innerHTML = renderer();
    drawer.classList.add('open');
    setActiveAction(['capacity', 'fare', 'manage'].includes(action) ? action : 'manage');
    drawer.querySelector('.rov-drawer-close')?.addEventListener('click', closeDrawer);
    bindDrawerControls(action);
  }

  function renderCapacityDrawer() {
    return `${drawerHeader('Add capacity', 'Choose the smallest change that can absorb more demand.')}
      <button class="rov-choice recommended" type="button" data-rov-capacity-add>
        <span class="rov-choice-icon" aria-hidden="true">＋</span>
        <span class="rov-choice-copy"><strong>Add one flight per week</strong><span>Use the current aircraft type and increase frequency.</span></span>
        <span class="rov-choice-tag">Recommended</span>
      </button>
      <button class="rov-choice" type="button" data-rov-open="fleet">
        <span class="rov-choice-icon" aria-hidden="true">✈</span>
        <span class="rov-choice-copy"><strong>Assign another aircraft</strong><span>Choose a free aircraft that has enough range.</span></span>
      </button>
      <div class="rov-drawer-actions"><button class="rov-drawer-action" type="button" data-rov-cancel>Cancel</button></div>`;
  }

  function renderFareDrawer() {
    return `${drawerHeader('Adjust fare', 'Make a small change, then review load after the next month.')}
      <div class="rov-fare-control">
        <button class="rov-fare-step" type="button" data-rov-fare-step="-25" aria-label="Lower fare by 25 dollars">−</button>
        <div class="rov-fare-value"><strong data-rov-fare-value>$${pendingFare}</strong><span>Fare per passenger</span></div>
        <button class="rov-fare-step" type="button" data-rov-fare-step="25" aria-label="Raise fare by 25 dollars">+</button>
      </div>
      <p class="rov-fare-note">At very high load, test modest increases and review the next month before changing again.</p>
      <div class="rov-drawer-actions">
        <button class="rov-drawer-action" type="button" data-rov-cancel>Cancel</button>
        <button class="rov-drawer-action confirm" type="button" data-rov-fare-apply>Apply $${pendingFare} fare</button>
      </div>`;
  }

  function manageItem(action, icon, title, description) {
    return `<button class="rov-manage-item" type="button" data-rov-open="${action}">
      <span class="rov-manage-icon" aria-hidden="true">${icon}</span>
      <span class="rov-manage-copy"><strong>${html(title)}</strong><span>${html(description)}</span></span>
      <span class="rov-manage-arrow" aria-hidden="true">›</span>
    </button>`;
  }

  function renderManageDrawer() {
    return `${drawerHeader('Manage route', 'Operational settings are grouped by task instead of mixed into the overview.')}
      ${manageItem('fleet', '✈', 'Fleet and frequency', 'Assign aircraft, release aircraft or change weekly flights.')}
      ${manageItem('service', '◈', 'Cabin and service', 'Cabin tier, food, drinks and onboard options.')}
      ${manageItem('settings', '⚙', 'Route settings', 'Fare, capacity and route closure.')}`;
  }

  function renderFleetDrawer() {
    const route = currentRoute;
    const list = route.planes && route.planes.length ? route.planes : [{ type: route.plane, flights: route.flights || 1 }];
    const flights = totalFlights(route);
    const distance = getDistance(route.from, route.to);
    const routeIndex = STATE.routes.indexOf(route);
    const rows = list.map(entry => {
      const aircraft = STATE.planes[entry.type] || AIRCRAFT[entry.type] || {};
      const capacity = (aircraft.seats || 0) * entry.flights * ECON.weeksPerMonth;
      return `<div class="rov-fleet-row">
        <div class="rov-fleet-copy"><strong>${entry.flights}× ${html(entry.type)}</strong><span>${Math.round(capacity).toLocaleString()} seats/month</span></div>
        <button class="rov-mini-action" type="button" data-rov-release="${html(entry.type)}" ${flights <= 1 ? 'disabled' : ''}>Release one</button>
      </div>`;
    }).join('');

    const swapOptions = Object.entries(STATE.planes || {})
      .filter(([name, plane]) => name !== route.plane && plane.owned > plane.assigned && distance <= (AIRCRAFT[name]?.range || plane.range || 0))
      .map(([name, plane]) => `<option value="${html(name)}">${html(name)} · ${plane.owned - plane.assigned} free</option>`).join('');

    const addOptions = Object.entries(STATE.planes || {})
      .filter(([name, plane]) => plane.owned > plane.assigned && distance <= (AIRCRAFT[name]?.range || plane.range || 0))
      .map(([name, plane]) => `<option value="${html(name)}">${html(name)} · ${plane.owned - plane.assigned} free</option>`).join('');

    return `${drawerHeader('Fleet and frequency', `${flights} flight${flights === 1 ? '' : 's'} per week on this route.`, true)}
      ${rows}
      ${swapOptions ? `<div class="rov-inline-form"><select class="rov-select" data-rov-swap-select aria-label="Replacement aircraft">${swapOptions}</select><button class="rov-mini-action" type="button" data-rov-swap data-route-index="${routeIndex}">Swap fleet</button></div>` : ''}
      ${addOptions ? `<div class="rov-inline-form"><select class="rov-select" data-rov-add-select aria-label="Aircraft to add">${addOptions}</select><button class="rov-mini-action" type="button" data-rov-add-aircraft>Add aircraft</button></div>` : ''}`;
  }

  function optionButtons(entries, activeKey, dataName, hours) {
    return Object.entries(entries).map(([key, item]) => {
      const locked = hours != null && hours < (item.minHours || 0);
      const label = item.short || item.name || key;
      return `<button class="rov-option ${key === activeKey ? 'active' : ''}" type="button" data-${dataName}="${html(key)}" ${locked ? 'disabled' : ''}>${html(label)}</button>`;
    }).join('');
  }

  function renderServiceDrawer() {
    const route = currentRoute;
    const hours = flightHours(getDistance(route.from, route.to));
    return `${drawerHeader('Cabin and service', 'Only onboard choices live here; economics remain in the full report.', true)}
      <div class="rov-control-group"><p class="rov-group-label">Cabin</p><div class="rov-options">${optionButtons(SERVICE_TIERS, route.service || 'economy', 'rov-cabin', null)}</div></div>
      <div class="rov-control-group"><p class="rov-group-label">Food service</p><div class="rov-options">${optionButtons(FOOD_TIERS, route.food || 'none', 'rov-food', hours)}</div></div>
      <div class="rov-control-group"><p class="rov-group-label">Drink service</p><div class="rov-options">${optionButtons(DRINK_TIERS, route.drinks || 'none', 'rov-drinks', hours)}</div></div>`;
  }

  function renderSettingsDrawer() {
    const flights = totalFlights(currentRoute);
    return `${drawerHeader('Route settings', 'Change one operating decision at a time.', true)}
      <div class="rov-settings-row"><div><strong>Fare</strong><br><span>$${currentRoute.fare} per passenger</span></div><button class="rov-mini-action" type="button" data-rov-open="fare">Edit fare</button></div>
      <div class="rov-settings-row"><div><strong>Capacity</strong><br><span>${flights} flight${flights === 1 ? '' : 's'} per week</span></div><button class="rov-mini-action" type="button" data-rov-open="capacity">Adjust capacity</button></div>
      <div class="rov-settings-row"><div><strong>Close route</strong><br><span>Release assigned aircraft and end service.</span></div><button class="rov-mini-action danger" type="button" data-rov-close-route>Close route</button></div>`;
  }

  function applyServiceChange(fnName, tier) {
    const route = currentRoute;
    if (!route || typeof window[fnName] !== 'function') return;
    const from = route.from;
    const to = route.to;
    closeModal();
    window[fnName](from, to, tier, null);
    window.setTimeout(() => {
      if (typeof closePlanePop === 'function') closePlanePop();
      const updated = findRoute(from, to);
      if (updated) {
        renderOverview(updated);
        openDrawer('service');
      }
    }, 100);
  }

  function bindDrawerControls(action) {
    const drawer = drawerElement();
    if (!drawer || !currentRoute) return;

    drawer.querySelector('[data-rov-cancel]')?.addEventListener('click', closeDrawer);
    drawer.querySelector('[data-rov-back]')?.addEventListener('click', () => openDrawer('manage'));
    drawer.querySelectorAll('[data-rov-open]').forEach(button => button.addEventListener('click', () => openDrawer(button.dataset.rovOpen)));

    drawer.querySelector('[data-rov-capacity-add]')?.addEventListener('click', () => {
      adjustRouteFlights(currentRoute.from, currentRoute.to, totalFlights(currentRoute) + 1);
    });

    drawer.querySelectorAll('[data-rov-fare-step]').forEach(button => {
      button.addEventListener('click', () => {
        pendingFare = Math.max(50, Math.min(999, pendingFare + Number(button.dataset.rovFareStep)));
        openDrawer('fare');
      });
    });

    drawer.querySelector('[data-rov-fare-apply]')?.addEventListener('click', () => {
      adjustRouteFare(currentRoute.from, currentRoute.to, pendingFare);
    });

    drawer.querySelectorAll('[data-rov-release]').forEach(button => {
      button.addEventListener('click', () => releaseRouteAircraft(currentRoute.from, currentRoute.to, button.dataset.rovRelease));
    });

    drawer.querySelector('[data-rov-swap]')?.addEventListener('click', buttonEvent => {
      const select = drawer.querySelector('[data-rov-swap-select]');
      if (select?.value) reassignAircraft(Number(buttonEvent.currentTarget.dataset.routeIndex), select.value);
    });

    drawer.querySelector('[data-rov-add-aircraft]')?.addEventListener('click', () => {
      const select = drawer.querySelector('[data-rov-add-select]');
      if (select?.value) addAircraftToRoute(currentRoute.from, currentRoute.to, select.value);
    });

    drawer.querySelectorAll('[data-rov-cabin]').forEach(button => button.addEventListener('click', () => applyServiceChange('setRouteService', button.dataset.rovCabin)));
    drawer.querySelectorAll('[data-rov-food]').forEach(button => button.addEventListener('click', () => applyServiceChange('setRouteFood', button.dataset.rovFood)));
    drawer.querySelectorAll('[data-rov-drinks]').forEach(button => button.addEventListener('click', () => applyServiceChange('setRouteDrinks', button.dataset.rovDrinks)));

    drawer.querySelector('[data-rov-close-route]')?.addEventListener('click', () => closeRouteConfirm(currentRoute.from, currentRoute.to));
  }

  function openFullReport() {
    if (!currentRoute || typeof legacyOpenPnlModal !== 'function') return;
    const route = currentRoute;
    legacyOpenPnlModal(route);
    const { modal } = modalElements();
    resetRouteModalClasses(modal);
    modal.classList.add('modal-route-report-v111');
    const header = modal.querySelector('.modal-header');
    if (header) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'rov-report-back';
      back.textContent = '‹ Overview';
      back.addEventListener('click', () => renderOverview(route));
      header.insertBefore(back, header.firstChild);
    }
  }

  window.RouteOverviewV111 = {
    open: renderOverview,
    openDrawer,
    openFullReport,
    legacyOpenPnlModal
  };
  window.openPnlModal = renderOverview;
})();
