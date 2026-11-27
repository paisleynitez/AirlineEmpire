const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function systems(){
  const events = [];
  const ctx = {
    STATE:{cash:500, planes:{A320:{owned:3}}, fleetHealth:{A320:{health:100, groundedUntil:0}}, _absMonth:10,
      research:{done:[], run:{}, owned:[]}, researchPoints:2450, cityInvestments:{}},
    ECON:{fuelPerSeatMile:10, crewPerFlight:20, crewPerMile:30},
    MAINTENANCE_CHECKS:{light:{cost:2.5}, heavy:{cost:9}, engine:{cost:18}},
    MAINTENANCE_INCIDENTS:[{sev:'warn', prob:0.1}], AEWX:{OVERFLIGHT_MOD:0.85},
    document:{readyState:'loading', addEventListener(){}, getElementById(){return null;}},
    addEvent:(...args) => events.push(args), showFlash(){}, console,
  };
  ctx.window = ctx;
  const names = ['endTurn','processRoute','maintTick','applySave','budgetBreakdown','navGo','renderRoutesList','openModal','closeModal'];
  const originals = Object.fromEntries(names.map(name => [name, ctx[name] = () => {}]));
  vm.createContext(ctx);
  for (const file of ['data/researchCatalog.js', 'data/cargoCatalog.js', 'systems/research.js', 'systems/cargo.js', 'systems/loyalty.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'game/js', file), 'utf8'), ctx, {filename:file});
  }
  return {ctx, events, originals};
}

test('gameplay systems do not replace core functions when loaded', () => {
  const {ctx, originals} = systems();
  for (const [name, original] of Object.entries(originals)) assert.equal(ctx[name], original, name);
});

test('research advances once per elapsed month, includes freighters and records slot unlock once', () => {
  const {ctx, events} = systems();
  const S = ctx.STATE, R = ctx.AEResearchBoard;
  S.research = {done:['r_winglet'], run:{r_composite:2}, owned:['u_hangar']};
  S.cargo = {fleet:{freighter:{owned:2}}, conversions:[{}]};
  const before = S.researchPoints;
  assert.equal(R.monthTick(2), 1.8);
  assert.equal(S.cash, 500, 'core owns upkeep cash deduction');
  assert.equal(S.researchPoints - before, 2 * (120 + 8 * 6));
  assert.ok(S.research.done.includes('r_composite'));
  assert.equal(Object.keys(S.research.run).length, 0);
  assert.equal(ctx.AE_RESEARCH_CATALOG.cfg.slots, 3);
  assert.equal(S._rbThirdSlotNoted, true);
  R.monthTick();
  assert.equal(events.filter(e => e[1].includes('Third research slot')).length, 1);
});

test('research modifiers survive repeated application and reset for an older save', () => {
  const {ctx} = systems(), R = ctx.AEResearchBoard;
  ctx.STATE.research = {done:['r_winglet'], run:{}, owned:['u_hangar','u_engine','u_deice']};
  R.applyMods();
  const first = JSON.stringify([ctx.ECON, ctx.MAINTENANCE_CHECKS, ctx.AEWX]);
  R.applyMods();
  assert.equal(JSON.stringify([ctx.ECON, ctx.MAINTENANCE_CHECKS, ctx.AEWX]), first);
  assert.ok(Math.abs(ctx.MAINTENANCE_CHECKS.engine.cost - 18 * 0.75 * 0.7) < 1e-9);
  delete ctx.STATE.research;
  R.applyMods();
  assert.ok(Math.abs(ctx.ECON.fuelPerSeatMile - 10) < 1e-9);
  assert.ok(Math.abs(ctx.MAINTENANCE_CHECKS.engine.cost - 18) < 1e-9);
  assert.ok(Math.abs(ctx.AEWX.OVERFLIGHT_MOD - 0.85) < 1e-9);
});

test('maintenance bonuses preserve health and shorten newly imposed grounding', () => {
  const {ctx} = systems(), R = ctx.AEResearchBoard;
  const wearProgram = ctx.AE_RESEARCH_CATALOG.research.find(r => r.fx.wear);
  assert.ok(wearProgram);
  ctx.STATE.research.done.push(wearProgram.id);
  ctx.STATE.research.owned.push('u_parts');
  const before = R.beforeMaintenance();
  ctx.STATE.fleetHealth.A320.health = 90;
  ctx.STATE.fleetHealth.A320.groundedUntil = 15;
  R.afterMaintenance(before);
  assert.ok(Math.abs(ctx.STATE.fleetHealth.A320.health - (90 + 10 * wearProgram.fx.wear)) < 1e-9);
  assert.equal(ctx.STATE.fleetHealth.A320.groundedUntil, 13);
});

test('loyalty keeps Gold VIP revenue and lounge synergy without replacing route processing', () => {
  const {ctx} = systems();
  const route = {from:'Chicago', to:'New York', fare:200, _ffTier:3};
  const result = ctx.AEFF.applyVip(route, {revenue:1, profit:0.2, pax:1000});
  assert.equal(result._vipPax, 20);
  assert.ok(Math.abs(result.revenue - 1.012) < 1e-9);
  ctx.STATE.cityInvestments.Chicago = {lounge:{level:1}};
  const lounge = ctx.AEFF.applyVip(route, {revenue:1, profit:0.2, pax:1000});
  assert.equal(lounge._vipPax, 40);
  assert.ok(Math.abs(lounge.revenue - 1.024) < 1e-9);
  const base = {revenue:1, profit:0.2, pax:1000};
  assert.equal(ctx.AEFF.applyVip({...route, _ffTier:0}, base), base);
  assert.equal(base.revenue, 1);
});
