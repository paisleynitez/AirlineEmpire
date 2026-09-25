/* DEV_BOOTSTRAP_v112
   Keeps development-only controls out of the production runtime unless the
   page is opened with ?dev=0 — dev tools load by default. */
(function devBootstrapV112(){
  'use strict';

  /* Dev tools ON by default (Scotty, Sep 2026); open with ?dev=0 to hide them for a clean play session. */
  const enabled = new URLSearchParams(window.location.search).get('dev') !== '0';
  const scripts = [
    './js/tools/dev_tuner.js',
    './js/patches/dev_skip_v01.js',
    './js/patches/real_dev_v01.js',
    './js/patches/debug_cursor_probe_v01.js?v=1',
    './js/patches/dev_console_v01.js',
  ];

  window.AEDevBootstrapV112 = { enabled, scripts: scripts.slice() };
  if (!enabled) return;

  document.documentElement.classList.add('ae-dev-mode');
  ['dt-launch', 'dev-tuner'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.hidden = false;
  });

  function load(index){
    if (index >= scripts.length) return;
    const script = document.createElement('script');
    script.src = scripts[index];
    script.onload = () => load(index + 1);
    script.onerror = () => console.error(`[Airline Empire] Unable to load development tool: ${scripts[index]}`);
    document.body.appendChild(script);
  }

  load(0);
})();
