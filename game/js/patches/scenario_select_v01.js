/* SCENARIO_SELECT_v01 — Scenario Selection polish (setup wizard page 2)
   Additive DOM enhancement layered on the existing wzRenderPage2() renderer.
   - Always-visible stat strip on every card (cash, credit, rivals, difficulty)
   - Check badge on the selected card + keyboard selection (Enter / Space)
   - DETAILS panel now shows credit line, goal, and flavor text
   - Right-rail "Selected scenario" summary; injects its own stylesheet (css/scenario-select-v01.css)
   Selection still flows through the original pickScenario(); no gameplay change. */
(function scenarioSelectV01(){
  'use strict';
  if(window.AEScenarioSelectV01) return;
  window.AEScenarioSelectV01={version:'v01'};

  const ICON_FALLBACK='\u2708';

  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function ctx(){
    try{
      if(typeof SCENARIOS==='undefined'||typeof setupChoice==='undefined'||typeof LEVELS==='undefined') return null;
      const lvl=setupChoice.level||LEVELS[1];
      const cash=typeof PLAYER_STARTING_CASH!=='undefined'?PLAYER_STARTING_CASH:(setupChoice.scenario||SCENARIOS[0]).cash;
      return {scenarios:SCENARIOS,sel:setupChoice.scenario||SCENARIOS[0],lvl,cash};
    }catch(e){ return null; }
  }
  function credit(s){ return Math.max(2000,(s.loan||600)*3); }
  function money(v){
    const n=Number(v)||0;
    if(Math.abs(n)>=1000){ const b=n/1000; return '$'+(Number.isInteger(b)?b.toFixed(0):b.toFixed(1))+'B'; }
    return '$'+n+'M';
  }
  function diffColor(lvl){
    return lvl.id===2?'var(--accent)':lvl.id===3?'var(--accent2)':lvl.id===4?'var(--danger)':'var(--profit)';
  }
  function icon(s){ return (typeof SC_ICONS!=='undefined'&&SC_ICONS[s.id])||ICON_FALLBACK; }
  function tagline(s){ return (typeof SCENARIO_TAGLINES!=='undefined'&&SCENARIO_TAGLINES[s.id])||''; }

  function quickStrip(s,c){
    return '<div class="sc-quick" aria-label="Key numbers">'+
      '<div><b>'+money(c.cash)+'</b><span>Cash</span></div>'+
      '<div><b>'+money(credit(s))+'</b><span>Credit</span></div>'+
      '<div><b>'+esc(c.lvl.rivals)+'</b><span>Rivals</span></div>'+
      '<div class="sq-diff" style="--sq-diff:'+diffColor(c.lvl)+'"><b>'+esc(c.lvl.name)+'</b><span>Difficulty</span></div>'+
    '</div>';
  }
  function detailRows(s,c){
    return quickStrip(s,c)+
      '<div class="sc-detail-row"><span>Starting hubs</span><b>1</b></div>'+
      '<div class="sc-detail-row sc-detail-goal"><span>Goal</span><b>'+esc(s.challenge||'grow the airline')+'</b></div>'+
      (s.flavor?'<div class="sc-detail-flavor">'+esc(s.flavor)+'</div>':'');
  }
  function railSummary(c){
    const s=c.sel;
    return '<div class="sc2-rail-title">SELECTED SCENARIO</div>'+
      '<div class="sc2-sel-head"><div class="sc2-sel-icon" aria-hidden="true">'+icon(s)+'</div>'+
        '<div><div class="sc2-sel-name">'+esc(s.name)+'</div>'+(tagline(s)?'<div class="sc2-sel-tag">'+esc(tagline(s))+'</div>':'')+'</div></div>'+
      '<div class="sc2-sel-stats">'+
        '<div><b>'+money(c.cash)+'</b><span>Start cash</span></div>'+
        '<div><b>'+money(credit(s))+'</b><span>Credit line</span></div>'+
        '<div><b>'+esc(c.lvl.rivals)+'</b><span>Rivals</span></div>'+
        '<div><b style="color:'+diffColor(c.lvl)+'">'+esc(c.lvl.name)+'</b><span>Difficulty</span></div>'+
      '</div>'+
      '<div class="sc2-sel-goal"><em>Goal</em>'+esc(s.challenge||'grow the airline')+'</div>';
  }

  function installStyles(){
    if(document.getElementById('ae-scenario-select-v01-style')) return;
    const link=document.createElement('link');
    link.id='ae-scenario-select-v01-style';
    link.rel='stylesheet';
    link.href='./css/scenario-select-v01.css';
    document.head.appendChild(link);
  }

  function installShell(){
    const page=document.getElementById('wz-p2');
    if(!page) return;
    const title=page.querySelector('.wz-panel-title');
    if(title&&!title.querySelector('.wz-step')){
      const num=title.querySelector('.wz-num');
      if(num) num.textContent='02';
      title.insertAdjacentHTML('beforeend','<span class="wz-step">Step 2 of 3</span>');
    }
    // Right rail (Selected Scenario / How Scenarios Work / Tips) is retired; the cards use the full stage.
    const rail=page.querySelector('.sc2-rail');
    if(rail) rail.hidden=true;
  }

  function enhance(){
    installShell();
    const c=ctx();
    const grid=document.getElementById('wz-scenario-grid');
    if(!c||!grid) return;

    grid.querySelectorAll('.sc-card').forEach(function(card,i){
      const s=c.scenarios[i];
      if(!s) return;
      const selected=card.classList.contains('selected');
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-pressed',String(selected));
      card.dataset.scenarioId=String(s.id);

      const tag=card.querySelector('.sc-card-tag');
      if(tag) tag.style.removeProperty('color');
      const ic=card.querySelector('.sc-card-icon');
      if(ic){ ic.style.removeProperty('color'); ic.style.removeProperty('border-color'); }

      if(!card.querySelector('.sc-check')){
        card.insertAdjacentHTML('afterbegin','<span class="sc-check" aria-hidden="true">\u2713</span>');
      }

      const desc=card.querySelector('.sc-card-desc');
      if(desc){ const stale=card.querySelector(':scope > .sc-quick'); if(stale) stale.remove(); }

      const stats=card.querySelector('.sc-card-stats');
      if(stats&&stats.dataset.aeScenarioV01!=='1'){
        stats.dataset.aeScenarioV01='1';
        stats.innerHTML=detailRows(s,c);
      }
    });

    const rail=document.getElementById('sc2-selected');
    if(rail){
      rail.innerHTML=railSummary(c);
      rail.hidden=false;
    }
  }

  function wrap(){
    if(window.__aeScenarioSelectV01Wrapped) return;
    if(typeof window.wzRenderPage2!=='function') return;
    window.__aeScenarioSelectV01Wrapped=true;
    const native=window.wzRenderPage2;
    window.wzRenderPage2=function(){
      const result=native.apply(this,arguments);
      enhance();
      return result;
    };
  }

  function onKey(event){
    if(event.key!=='Enter'&&event.key!==' ') return;
    const card=event.target.closest?.('#wz-scenario-grid .sc-card');
    if(!card||event.target.closest('button,a,input,select')) return;
    event.preventDefault();
    card.click();
  }

  function init(){
    installStyles();
    wrap();
    document.addEventListener('keydown',onKey);
    enhance();
    let attempts=0;
    const timer=setInterval(function(){
      wrap();
      enhance();
      if(++attempts>=12) clearInterval(timer);
    },250);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
