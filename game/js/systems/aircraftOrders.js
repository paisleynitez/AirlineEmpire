/* Prepaid aircraft orders. The core advances deliveries after the calendar and before saving.
   Owned fleets, leases, starter aircraft and used-market purchases keep their existing state. */
(function(){
  'use strict';
  const LEAD_MONTHS = Object.freeze({short:2, medium:3, long:6, jumbo:9, supersonic:12});
  const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now = () => STATE.year * 12 + STATE.month;
  const date = month => `${MONTHS[((month % 12) + 12) % 12]} ${Math.floor(month / 12)}`;
  function orders(){
    if (!Array.isArray(STATE.aircraftOrders)) STATE.aircraftOrders = [];
    return STATE.aircraftOrders;
  }
  function spec(model, kind){ return kind === 'cargo' ? window.AE_CARGO_CATALOG.freighters[model] : AIRCRAFT[model]; }
  function leadTime(model, kind = 'passenger'){ const a = spec(model, kind); return a ? (LEAD_MONTHS[a.type] || 6) : 0; }
  function quote(model, quantity, kind = 'passenger'){
    if (kind !== 'passenger' && kind !== 'cargo') return {error:'Unknown aircraft category'};
    const a = spec(model, kind);
    if (!a) return {error:'Unknown aircraft'};
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return {error:'Choose 1–99 aircraft'};
    if (a.era > STATE.year) return {error:`${model} is available in ${a.era}`};
    if (a.retired && STATE.year > a.retired) return {error:`${model} is no longer available`};
    if (kind === 'cargo' && a.convOnly) return {error:'This freighter requires a conversion'};
    if (typeof acListed === 'function' && !acListed(a)) return {error:'Aircraft is not available in this campaign'};
    const total = kind === 'cargo' ? Math.round(a.cost * quantity * (quantity >= 3 ? 0.93 : 1)) : bulkPlaneDiscount(model, quantity).total;
    if (!Number.isFinite(total) || total <= 0) return {error:'Invalid aircraft price'};
    const months = leadTime(model, kind);
    return {model, quantity, kind, total, months, dueMonth:now() + months};
  }
  function place(model, quantity, kind = 'passenger'){
    if (STATE.gameOver) return null;
    const q = quote(model, quantity, kind);
    if (q.error) { showFlash('⚠ ' + q.error); return null; }
    if (!Number.isFinite(STATE.cash) || STATE.cash < q.total) { showFlash(`⚠ Need $${q.total}M`); return null; }
    if (!spendAction('Order aircraft')) return null;
    const all = orders();
    const serial = Math.max(0, Number.isSafeInteger(STATE.nextAircraftOrderId) ? STATE.nextAircraftOrderId : 0,
      ...all.map(o => Number(o.id) || 0)) + 1;
    const order = {id:serial, model, quantity, kind, totalCost:q.total, placedMonth:now(), dueMonth:q.dueMonth, status:'pending'};
    STATE.nextAircraftOrderId = serial;
    STATE.cash -= q.total;
    all.push(order);
    addEvent('neutral', `Aircraft ordered: ${quantity}× ${model} · $${q.total}M paid · delivery ${date(q.dueMonth)}`);
    showFlash(`✓ ${quantity}× ${model} ordered — delivery ${date(q.dueMonth)}`);
    return order;
  }
  function cancel(id){
    if (STATE.gameOver) return false;
    const order = orders().find(o => o.id === id && o.status === 'pending');
    if (!order) return false;
    order.status = 'cancelled'; order.cancelledMonth = now();
    STATE.cash += order.totalCost;
    addEvent('neutral', `Order #${id} cancelled · $${order.totalCost}M refunded`);
    showFlash(`✓ Order cancelled — $${order.totalCost}M refunded`);
    return true;
  }
  function deliver(){
    for (const order of orders()) {
      if (order.status !== 'pending' || order.dueMonth > now()) continue;
      const a = spec(order.model, order.kind);
      if (!a) continue; // preserve an unknown model's paid order for recovery
      if (order.kind === 'cargo') {
        window.AECargo.fleetEntry(order.model).owned += order.quantity;
      } else {
        const p = STATE.planes[order.model] ||= {...a, owned:0, assigned:0, leased:0};
        p.owned += order.quantity;
        stampAcquisition(p, order.quantity);
      }
      order.status = 'delivered'; order.deliveredMonth = now();
      addEvent('good', `Aircraft delivered: ${order.quantity}× ${order.model} · order #${order.id} · ready for assignment`);
      showFlash(`✈ ${order.quantity}× ${order.model} delivered`);
    }
    // Keep all live commitments and the latest 100 completed/cancelled records.
    const history = orders().filter(o => o.status !== 'pending').slice(-100);
    STATE.aircraftOrders = orders().filter(o => o.status === 'pending' || history.includes(o));
  }
  const pending = () => orders().filter(o => o.status === 'pending');
  const pendingCount = () => pending().reduce((sum, o) => sum + o.quantity, 0);
  function render(tab){
    const list = tab === 'orders' ? pending() : orders().filter(o => o.status !== 'cancelled');
    list.sort((a,b) => (a.status !== 'pending') - (b.status !== 'pending') || (a.status === 'pending' ? a.dueMonth - b.dueMonth : b.deliveredMonth - a.deliveredMonth));
    const rows = list.map(o => {
      const left = Math.max(0, o.dueMonth - now());
      const progress = o.status === 'delivered' ? 100 : Math.max(0, Math.min(100, (now() - o.placedMonth) / (o.dueMonth - o.placedMonth) * 100));
      return `<article class="ao-row" data-order-id="${o.id}">
        <div><strong>${esc(o.model)} × ${o.quantity}</strong><small>Order #${o.id} · ${o.kind === 'cargo' ? 'Freighter' : 'Passenger'} · placed ${date(o.placedMonth)}</small></div>
        <div><strong>$${o.totalCost}M paid</strong><small>No balance due at delivery</small></div>
        <div><strong>${o.status === 'delivered' ? 'Delivered ' + date(o.deliveredMonth) : date(o.dueMonth)}</strong><small>${o.status === 'delivered' ? 'Ready for assignment' : left + ' month' + (left === 1 ? '' : 's') + ' remaining'}</small><div class="ao-progress"><i style="width:${progress}%"></i></div></div>
        <div>${o.status === 'pending' ? `<button class="action-btn" onclick="cancelAircraftOrder(${o.id})">Cancel · refund $${o.totalCost}M</button>` : '<span class="ao-delivered">Delivered</span>'}</div>
      </article>`;
    }).join('');
    return `<section class="ao-panel"><div class="ao-intro"><h3>${tab === 'orders' ? 'Aircraft orders' : 'Delivery schedule'}</h3><p>Orders are paid in full. Pending orders may be cancelled for a full refund. Aircraft join the available fleet at delivery.</p><p>Lead times: regional 2 · narrowbody 3 · widebody 6 · jumbo 9 · supersonic 12 months.</p></div>${rows || '<div class="ao-empty">' + (tab === 'orders' ? 'No aircraft on order. Use Acquire Aircraft to place an order.' : 'No scheduled or completed deliveries yet.') + '</div>'}</section>`;
  }
  window.AEAircraftOrders = {LEAD_MONTHS, orders, quote, leadTime, place, cancel, deliver, pending, pendingCount, render, date};
})();
