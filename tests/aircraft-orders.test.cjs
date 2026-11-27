const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../game/js/systems/aircraftOrders.js'), 'utf8');
function game(saved){
  const ctx = {
    STATE:saved || {year:2025, month:10, cash:10000, planes:{}, cargoFleet:{}},
    MONTHS:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],
    AIRCRAFT:{Regional:{type:'short',era:2000,cost:20}, Narrowbody:{type:'medium',era:2000,cost:40},
      Widebody:{type:'long',era:2000,cost:100}, Jumbo:{type:'jumbo',era:2000,cost:200},
      Supersonic:{type:'supersonic',era:2000,cost:250}, Future:{type:'short',era:2030,cost:30},
      Retired:{type:'short',era:1980,retired:2020,cost:20}},
    AE_CARGO_CATALOG:{freighters:{Freighter:{type:'long',era:2000,cost:60}, Conversion:{type:'medium',era:2000,cost:30,convOnly:true}}},
    allowed:true, actions:0, events:[],
    acListed:() => true,
    spendAction(){if (!ctx.allowed) return false;ctx.actions++;return true;},
    showFlash(){}, addEvent(...args){ctx.events.push(args);},
    bulkPlaneDiscount(model, q){return {total:Math.round(ctx.AIRCRAFT[model].cost * q * (q >= 3 ? 0.9 : 1))};},
    stampAcquisition(p){p._acqYear=ctx.STATE.year;},
  };
  ctx.window=ctx;
  ctx.AECargo={fleetEntry(model){return ctx.STATE.cargoFleet[model] ||= {owned:0,assigned:0};}};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  ctx.advance = months => {const n=ctx.STATE.year*12+ctx.STATE.month+months;ctx.STATE.year=Math.floor(n/12);ctx.STATE.month=n%12;};
  return ctx;
}

test('lead times increase by aircraft class and quotes use bulk pricing', () => {
  const g=game(), A=g.AEAircraftOrders;
  assert.deepEqual(['Regional','Narrowbody','Widebody','Jumbo','Supersonic'].map(m=>A.leadTime(m)),[2,3,6,9,12]);
  assert.equal(A.quote('Narrowbody',3).total,108);
  assert.equal(A.quote('Freighter',3,'cargo').total,167);
});

test('invalid, future, retired, unaffordable and blocked orders leave cash and fleets unchanged', () => {
  const g=game(), A=g.AEAircraftOrders;
  for(const [model,q,kind] of [['Unknown',1],['Regional',0],['Regional',-1],['Regional',1.5],['Regional',100],['Regional',NaN],['Future',1],['Retired',1],['Conversion',1,'cargo'],['Regional',1,'invalid']]) {
    assert.equal(A.place(model,q,kind),null);
  }
  g.allowed=false;assert.equal(A.place('Regional',1),null);
  g.allowed=true;g.STATE.cash=1;assert.equal(A.place('Regional',1),null);
  assert.equal(g.STATE.cash,1);assert.equal(g.actions,0);assert.equal(A.pendingCount(),0);
  assert.equal(Object.keys(g.STATE.planes).length,0);
});

test('prepaid orders survive a fresh state reload and deliver exactly once without another charge', () => {
  const g=game(), A=g.AEAircraftOrders;
  const order=A.place('Narrowbody',3);
  assert.equal(g.STATE.cash,9892);assert.equal(A.pendingCount(),3);
  assert.equal(g.STATE.planes.Narrowbody,undefined);
  const reloaded=game(JSON.parse(JSON.stringify(g.STATE))), B=reloaded.AEAircraftOrders;
  reloaded.advance(2);B.deliver();assert.equal(reloaded.STATE.planes.Narrowbody,undefined);
  reloaded.advance(1);B.deliver();
  assert.equal(reloaded.STATE.planes.Narrowbody.owned,3);
  assert.equal(reloaded.STATE.planes.Narrowbody.assigned,0);
  assert.equal(reloaded.STATE.planes.Narrowbody._acqYear,2026);
  assert.equal(reloaded.STATE.cash,9892);assert.equal(B.pendingCount(),0);
  assert.equal(B.orders()[0].id,order.id);assert.equal(B.orders()[0].status,'delivered');
  B.deliver();assert.equal(reloaded.STATE.planes.Narrowbody.owned,3);
  const again=game(JSON.parse(JSON.stringify(reloaded.STATE)));again.AEAircraftOrders.deliver();
  assert.equal(again.STATE.planes.Narrowbody.owned,3);
  assert.equal(again.AEAircraftOrders.cancel(order.id),false);
});

test('quarterly delivery catches every due order across year rollover', () => {
  const g=game(), A=g.AEAircraftOrders;
  A.place('Regional',1);A.place('Narrowbody',2);A.place('Widebody',1);
  g.advance(3);A.deliver();
  assert.equal(g.STATE.year,2026);assert.equal(g.STATE.month,1);
  assert.equal(g.STATE.planes.Regional.owned,1);assert.equal(g.STATE.planes.Narrowbody.owned,2);
  assert.equal(g.STATE.planes.Widebody,undefined);assert.equal(A.pendingCount(),1);
});

test('cancellation refunds the locked order price once and prevents delivery after reload', () => {
  const g=game(), A=g.AEAircraftOrders;
  const order=A.place('Narrowbody',3);assert.equal(A.cancel(order.id),true);
  assert.equal(g.STATE.cash,10000);assert.equal(A.cancel(order.id),false);
  const reload=game(JSON.parse(JSON.stringify(g.STATE)));
  reload.advance(12);reload.AEAircraftOrders.deliver();
  assert.equal(reload.STATE.planes.Narrowbody,undefined);assert.equal(reload.STATE.cash,10000);
  const next=reload.AEAircraftOrders.place('Regional',1);assert.ok(next.id>order.id);
});

test('freighters wait for delivery and enter the cargo inventory only', () => {
  const g=game(), A=g.AEAircraftOrders;
  A.place('Freighter',2,'cargo');assert.equal(g.STATE.cargoFleet.Freighter,undefined);
  g.advance(6);A.deliver();
  assert.equal(g.STATE.cargoFleet.Freighter.owned,2);assert.equal(g.STATE.cargoFleet.Freighter.assigned,0);
  assert.equal(g.STATE.planes.Freighter,undefined);assert.equal(g.STATE.cash,9880);
  A.deliver();assert.equal(g.STATE.cargoFleet.Freighter.owned,2);
});

test('older saves start without orders and history pruning retains pending commitments', () => {
  const g=game(), A=g.AEAircraftOrders;
  assert.equal(A.orders().length,0);
  const pending=A.place('Widebody',1);
  for(let i=0;i<102;i++){const o=A.place('Regional',1);A.cancel(o.id);}
  A.deliver();assert.equal(A.orders().length,101);assert.equal(A.pending()[0].id,pending.id);
});
