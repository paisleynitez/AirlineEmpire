const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function extractConstant(source, startToken, endToken, exportName) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  assert.notEqual(start, -1, `Missing ${startToken}`);
  assert.notEqual(end, -1, `Missing ${endToken}`);
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source.slice(start, end)};globalThis.__value=${exportName};`, context);
  return context.__value;
}

test('runtime, package, and lockfile versions agree', () => {
  const version = read('version.dat').trim();
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(version, '1.1.11');
  assert.equal(pkg.version, version);
  assert.equal(lock.version, version);
  assert.equal(lock.packages[''].version, version);
});

test('every local loader script and stylesheet exists', () => {
  const htmlPath = path.join(root, 'game/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const references = [
    ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
    ...html.matchAll(/<link[^>]+href="([^"]+)"/g),
  ].map(match => match[1]).filter(value => !/^(?:data:|https?:)/i.test(value));

  for (const reference of references) {
    const target = path.resolve(path.dirname(htmlPath), reference.split(/[?#]/, 1)[0]);
    assert.ok(fs.existsSync(target), `Missing loader dependency: ${reference}`);
  }
});

test('city roster and skyline manifest remain in exact parity', () => {
  const game = read('game/js/core/game.js');
  const cities = extractConstant(game, 'const CITIES =', 'const REGIONS', 'CITIES');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read('game/js/cities/citySkylineManifest.js'), context);
  const manifest = context.window.AECitySkylineManifest.byCity;
  assert.equal(Object.keys(cities).length, 344);
  assert.deepEqual(Object.keys(manifest).sort(), Object.keys(cities).sort());
  for (const [name, city] of Object.entries(cities)) {
    assert.equal(manifest[name].iata, city.abbr, `IATA mismatch for ${name}`);
    assert.ok(fs.existsSync(path.join(root, 'game', manifest[name].src)), `Missing skyline for ${name}`);
  }
});

test('aircraft roster, manifest, and hero images remain in exact parity', () => {
  const game = read('game/js/core/game.js');
  const aircraft = extractConstant(game, 'const AIRCRAFT =', 'const AIRCRAFT_IDENTITY', 'AIRCRAFT');
  const context = {};
  vm.createContext(context);
  vm.runInContext(read('game/js/data/aircraftImageManifest.js'), context);
  const manifest = context.AEAircraftImageManifest.byModel;
  assert.equal(Object.keys(aircraft).length, 37);
  assert.deepEqual(Object.keys(manifest).sort(), Object.keys(aircraft).sort());
  for (const entry of Object.values(manifest)) {
    assert.ok(fs.existsSync(path.join(root, 'game', entry.path)), `Missing aircraft hero: ${entry.model}`);
  }
});

test('every completed month creates a checkpoint and autosave', () => {
  const game = read('game/js/core/game.js');
  const start = game.indexOf('function endTurn()');
  const end = game.indexOf('function commercialIntel()', start);
  const endTurn = game.slice(start, end);
  assert.match(endTurn, /pushRevertPoint\(\)/);
  assert.match(endTurn, /autoSave\(\)/);
  assert.ok(endTurn.indexOf('autoSave()') > endTurn.indexOf('STATE.month'));
});

test('the nine-card picker includes approved and regional identities', () => {
  const logoPanel = { dataset: {} };
  const context = {
    window: { getSetupLogoRegion: () => 'N America' },
    document: {
      readyState: 'complete',
      documentElement: {},
      querySelector: selector => selector === '.ae4-logo-panel' ? logoPanel : null,
    },
    MutationObserver: class { observe() {} },
    requestAnimationFrame: callback => callback(),
    CSS: { escape: value => value },
  };
  vm.createContext(context);
  vm.runInContext(read('assets/airline-identities/approved-250/catalog.js'), context);
  vm.runInContext(read('game/js/data/curatedAirlineIdentities.js'), context);
  vm.runInContext(read('game/js/generator/airlineIdentityGenerator.js'), context);

  const logos = context.window.AIRLINE_LOGOS;
  assert.equal(context.window.AirlineIdentityGenerator.approvedCount, 250);
  assert.equal(logos.length, 9);
  assert.equal(logos.filter(logo => logo.source === 'curated').length, 3);
  assert.equal(logos.filter(logo => logo.sourceKind).length, 6);

  for (const logo of logos) {
    const target = path.resolve(root, 'game', logo.image);
    assert.ok(fs.existsSync(target), `Missing picker logo: ${logo.name}`);
  }
});
