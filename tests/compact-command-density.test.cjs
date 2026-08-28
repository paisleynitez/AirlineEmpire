const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('compact density layer loads after the active visual theme', () => {
  const html = read('game/index.html');
  const themeIndex = html.indexOf('css/executive-command-v111.css');
  const densityIndex = html.indexOf('css/compact-command-density-v111.css');

  assert.ok(themeIndex >= 0, 'Executive Command stylesheet is missing');
  assert.ok(densityIndex > themeIndex, 'compact density stylesheet must load after the visual theme');
});

test('compact density layer covers the requested live surfaces', () => {
  const css = read('game/css/compact-command-density-v111.css');
  const requiredSelectors = [
    '#game-ui #header',
    '#header .brand',
    '#header .hdr-datetime',
    '#header #end-turn-btn.hdr-endturn',
    '#mock-livetiles',
    '#left-panel .ae-nav-item',
    '#mock-quick',
    '.rp-console-summary',
    '.rp-region-rail',
    '.rp-proj',
    '.rp-build-btn',
    '.modal.modal-research-hub',
    '.rh-grid',
    '.rh-command-bar',
  ];

  for (const selector of requiredSelectors) {
    assert.ok(css.includes(selector), `Missing compact density coverage for ${selector}`);
  }

  assert.doesNotMatch(css, /pointer-events\s*:\s*none\s*!important/i);
});

test('live dashboard keeps an explicit Research destination', () => {
  const js = read('game/js/core/game.js');

  assert.match(js, /row\('research','Research'\)/);
  assert.match(js, /case 'research': openModal\('research-hub'\)/);
  assert.match(js, /function buildResearchHub\(\)/);
  assert.match(js, /Fuel Efficiency/);
  assert.match(js, /Sustainable Aviation/);
  assert.doesNotMatch(js, /row\('projects','Special Projects'/);
});

test('Research command bars retain the requested 25 percent height reduction', () => {
  const css = read('game/css/compact-command-density-v111.css');

  assert.match(css, /\.rh-shell\s*\{[^}]*grid-template-rows:\s*59px minmax\(0, 1fr\) 59px/s);
  assert.match(css, /\.rh-command-bar\s*\{[^}]*min-height:\s*59px/s);
});
