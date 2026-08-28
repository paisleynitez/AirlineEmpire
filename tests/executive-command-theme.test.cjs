const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('Executive Command theme is enabled after feature styles', () => {
  const html = read('game/index.html');
  const mainIndex = html.indexOf('css/main.css');
  const routeIndex = html.indexOf('css/route-overview-v111.css');
  const themeIndex = html.indexOf('css/executive-command-v111.css');

  assert.match(html, /<body class="ae-executive-command">/);
  assert.ok(mainIndex >= 0, 'main stylesheet is missing');
  assert.ok(routeIndex > mainIndex, 'route feature stylesheet must follow main.css');
  assert.ok(themeIndex > routeIndex, 'Executive Command must load last');
});

test('Executive Command covers dashboard and generated submenu surfaces', () => {
  const css = read('game/css/executive-command-v111.css');
  const requiredSelectors = [
    '#header',
    '#left-panel',
    '#right-panel',
    '#map-container',
    '#stock-ticker',
    '#modal-overlay',
    '.modal-header',
    '.modal-body',
    '.modal-new-route',
    '.modal-route-manager',
    '.modal-budget',
    '.modal-projects',
    '.modal-city',
  ];

  for (const selector of requiredSelectors) {
    assert.ok(css.includes(selector), `Missing theme coverage for ${selector}`);
  }

  assert.match(css, /--ec-panel:/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /display\s*:\s*none\s*!important/i);
  assert.doesNotMatch(css, /pointer-events\s*:\s*none\s*!important/i);
});
