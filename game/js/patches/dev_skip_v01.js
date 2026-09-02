/* DEV_SKIP_v01 — TEMPORARY. Adds a small "DEV: SKIP TO GAME" button on the home
   screen that starts a default scenario run immediately (default airline name,
   default logo, Chicago hub, standard difficulty) without going through the
   New Game wizard. Remove the script tag in index.html to take it out. */
(function devSkipV01(){
  'use strict';
  if (window.AEDevSkipV01) return;
  window.AEDevSkipV01 = true;

  window.devSkipToGame = function(){
    try {
      if (typeof setupChoice !== 'undefined') {
        setupChoice.type = 'scenario';
        setupChoice.scenario = SCENARIOS[0];
        setupChoice.level = LEVELS[1];
        setupChoice.hub = setupChoice.hub || 'Chicago';
        setupChoice._name = 'DEVAIR';
      }
      startGame('intro');
    } catch(e) { console.error('[dev-skip]', e); }
  };

  function mount(){
    const intro = document.getElementById('intro');
    if (!intro || document.getElementById('dev-skip-btn')) return;
    const b = document.createElement('button');
    b.id = 'dev-skip-btn';
    b.type = 'button';
    b.textContent = 'DEV: SKIP TO GAME';
    b.title = 'Temporary — starts a default scenario run, bypassing the wizard';
    b.setAttribute('onclick', 'devSkipToGame()');
    b.style.cssText = [
      'position:absolute', 'left:18px', 'bottom:18px', 'z-index:50',
      'height:30px', 'padding:0 12px', 'border-radius:8px', 'cursor:pointer',
      "font-family:'Inter',system-ui,sans-serif", 'font-size:10.6px', 'font-weight:800', 'letter-spacing:1px',
      'color:#ffcf5a', 'background:rgba(8,20,36,.92)', 'border:1px dashed rgba(255,207,90,.55)'
    ].join(';');
    intro.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
