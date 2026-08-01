/* Airline Empire v1.1.2 — Fair AI airline lifecycle and identity release pacing. */
(function(){
  'use strict';

  const CONFIG = Object.freeze({
    initialIdentityCount: 34,
    unlockEveryMonths: 9,
    identitiesPerUnlock: 3,
    startupCheckDays: 45,
    rampUpDays: 30,
    baseStartupChance: 0.42,
    maxStartupChance: 0.68,
    maxActiveAirlines: 12,
    maxPlanningAirlines: 3,
    maxMonthlyCashGrowth: 28,
    maxMonthlyValueGrowth: 42
  });

  const FALLBACK_NAMES = [
    'Atlas Wings','Global One','Maple Jet','Zenith Air','Sky Sover','Orion Jet','CumulusAir','Aurora Air',
    'Summit Air','Oceanic Air','Flux Airlines','Aether Sky','Pioneer Air','Horizon Jet','Majestic Air','Nova Air',
    'Cascade Air','Quantum','Velocitycrest','Sunrise Air','Eagle Sky','Rapid Air','GreenJet','SkyLancer',
    'Meridian Air','Harborwing Airlines','Westwind Jet','Unity Air','Northcrest Airways','CinderJet','Polar Connect',
    'Sovereign Wings','Blue Meridian','Radiant Airlines','Vanguard Air','Pacific Crest','Silver Horizon','Regal Jet',
    'Evergreen Airways','Cobalt Air','Frontier Wings','Solaris Connect','Pinnacle Air','Liberty Jet','Aurora Regional'
  ];

  function absMonth(){ return Math.max(0, Number(STATE && STATE._absMonth) || 0); }
  function turnDays(){ return STATE && STATE.gameType === 'eras' ? 90 : 30; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function shuffle(list){
    const a=list.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  function identityAssets(){
    const assets=[];
    for(let i=1;i<=136;i++){
      const n=String(i).padStart(3,'0');
      assets.push({
        id:`contact_${n}`,
        name:FALLBACK_NAMES[(i-1)%FALLBACK_NAMES.length] + (i>FALLBACK_NAMES.length ? ` ${Math.ceil(i/FALLBACK_NAMES.length)}` : ''),
        logoId:`contact_${n}`,
        image:`./assets/airline-identities/contact-sheet-01/logo_${n}.webp`
      });
    }
    return assets;
  }
  function lifecycle(){
    STATE.aiLifecycle = STATE.aiLifecycle || {
      version: 1,
      day: 0,
      nextStartupCheckDay: CONFIG.startupCheckDays,
      nextUnlockMonth: CONFIG.unlockEveryMonths,
      unlockedIdentityCount: CONFIG.initialIdentityCount,
      identityOrder: shuffle(identityAssets()).map(x=>x.id),
      usedIdentityIds: [],
      startupChecks: 0,
      startupsAttempted: 0,
      startupsLaunched: 0,
      unlocks: 0
    };
    return STATE.aiLifecycle;
  }
  function allAssets(){
    const map=new Map(identityAssets().map(x=>[x.id,x]));
    const l=lifecycle();
    return l.identityOrder.map(id=>map.get(id)).filter(Boolean);
  }
  function availableAssets(){
    const l=lifecycle();
    const used=new Set(l.usedIdentityIds || []);
    return allAssets().slice(0,l.unlockedIdentityCount).filter(x=>!used.has(x.id));
  }
  function reserveIdentity(preferredName){
    const l=lifecycle();
    const asset=availableAssets()[0] || allAssets()[Math.floor(Math.random()*allAssets().length)];
    if(!asset) return {id:'fallback',name:preferredName||'New Airline',logoId:window.DEFAULT_AIRLINE_LOGO_ID||'nova_airlines',image:''};
    if(!l.usedIdentityIds.includes(asset.id)) l.usedIdentityIds.push(asset.id);
    return {...asset,name:preferredName || asset.name};
  }
  function chooseHub(){
    const occupied=new Set((STATE.competitors||[]).map(c=>c.hub));
    occupied.add(STATE.homeBase);
    const majors=Object.entries(CITIES).filter(([name,c])=>c.major && !occupied.has(name));
    const pool=majors.length ? majors : Object.entries(CITIES).filter(([name])=>!occupied.has(name));
    return (pool[Math.floor(Math.random()*pool.length)]||['London'])[0];
  }
  function plannedRoutes(hub,count){
    const hc=CITIES[hub]; if(!hc) return [];
    return Object.entries(CITIES)
      .filter(([name,c])=>name!==hub && c.region===hc.region)
      .sort((a,b)=>(b[1].econ+b[1].tourism+b[1].pop*12)-(a[1].econ+a[1].tourism+a[1].pop*12))
      .slice(0,count)
      .map(([to])=>({from:hub,to}));
  }
  function startupCash(){
    const playerCash=Math.max(60,Number(STATE.cash)||60);
    const scenarioBase=Math.max(80,Math.min(220,(STATE.scenario && STATE.scenario.cash ? STATE.scenario.cash*0.16 : 120)));
    return Math.round(clamp((scenarioBase*0.65)+(playerCash*0.10),70,210));
  }
  function makeCompetitor(identity){
    const hub=chooseHub();
    const routeCount=2;
    const aggressionBase=0.30+Math.random()*0.28;
    return {
      name:identity.name,
      identityId:identity.id,
      logoId:identity.logoId,
      logoImage:identity.image,
      color:['#67e8f9','#a78bfa','#f4c96b','#66d6a5','#5aa7ff'][Math.floor(Math.random()*5)],
      hub,
      cash:startupCash(),
      pax:0,
      paxYear:0,
      routes:0,
      value:18,
      aggression:clamp(aggressionBase*(STATE.level?.rivalAgg||1),0.22,0.72),
      regionsEntered:[CITIES[hub]?.region||'N America'],
      routeList:[],
      _plannedRoutes:plannedRoutes(hub,routeCount),
      lifecycleStatus:'ramp_up',
      rampDaysRemaining:CONFIG.rampUpDays,
      foundedAbsMonth:absMonth(),
      fleetCount:2+Math.floor(Math.random()*3),
      fairEconomy:true,
      _lastExpand:absMonth()
    };
  }
  function normalizeStartingCompetitors(){
    const l=lifecycle();
    (STATE.competitors||[]).forEach((c,index)=>{
      const identity=reserveIdentity(c.name);
      c.identityId=identity.id;
      c.logoId=identity.logoId;
      c.logoImage=identity.image;
      c.lifecycleStatus='ramp_up';
      c.rampDaysRemaining=CONFIG.rampUpDays;
      c._plannedRoutes=(c.routeList||[]).slice();
      c.routeList=[];
      c.routes=0;
      c.pax=0;
      c.paxYear=0;
      c.cash=clamp(Number(c.cash)||startupCash(),70,220);
      c.value=18;
      c.fleetCount=2+Math.min(2,index);
      c.fairEconomy=true;
      c._lastExpand=absMonth();
    });
    l.startupsLaunched=(STATE.competitors||[]).length;
  }
  function activeCount(){ return (STATE.competitors||[]).filter(c=>c.lifecycleStatus==='active').length; }
  function pendingCount(){ return (STATE.competitors||[]).filter(c=>c.lifecycleStatus==='ramp_up'||c.lifecycleStatus==='planning').length; }
  function startupChance(){
    const active=activeCount();
    const difficulty=((STATE.level&&STATE.level.rivalAgg)||1);
    const capacityPenalty=active>=CONFIG.maxActiveAirlines ? 0 : (1-active/CONFIG.maxActiveAirlines);
    return clamp(CONFIG.baseStartupChance*difficulty*capacityPenalty,0.12,CONFIG.maxStartupChance);
  }
  function maybeLaunchStartup(){
    const l=lifecycle();
    l.startupChecks++;
    if(activeCount()>=CONFIG.maxActiveAirlines || pendingCount()>=CONFIG.maxPlanningAirlines) return false;
    if(!availableAssets().length) return false;
    if(Math.random()>=startupChance()) return false;
    l.startupsAttempted++;
    const identity=reserveIdentity();
    const comp=makeCompetitor(identity);
    STATE.competitors.push(comp);
    l.startupsLaunched++;
    if(typeof addEvent==='function') addEvent('rival',`🛫 ${comp.name} has entered a 30-day startup ramp at ${comp.hub}.`);
    return true;
  }
  function unlockIdentities(){
    const l=lifecycle();
    const before=l.unlockedIdentityCount;
    l.unlockedIdentityCount=Math.min(allAssets().length,before+CONFIG.identitiesPerUnlock);
    if(l.unlockedIdentityCount>before){
      l.unlocks++;
      if(typeof addEvent==='function') addEvent('neutral',`🪪 ${l.unlockedIdentityCount-before} new airline identities are now available to future startups.`);
    }
  }
  function completeRamp(c){
    c.lifecycleStatus='active';
    c.rampDaysRemaining=0;
    c.routeList=(c._plannedRoutes||[]).slice(0,2);
    c.routes=c.routeList.length;
    c._lastExpand=absMonth();
    c.value=Math.max(24,c.routes*18+Math.round(c.cash*0.18));
    if(typeof addEvent==='function') addEvent('rival',`✈ ${c.name} completed ramp-up and began scheduled service from ${c.hub}.`);
  }
  function advanceLifecycle(days){
    const l=lifecycle();
    l.day+=days;
    while(absMonth()>=l.nextUnlockMonth){ unlockIdentities(); l.nextUnlockMonth+=CONFIG.unlockEveryMonths; }
    while(l.day>=l.nextStartupCheckDay){ maybeLaunchStartup(); l.nextStartupCheckDay+=CONFIG.startupCheckDays; }
    (STATE.competitors||[]).forEach(c=>{
      if(c.lifecycleStatus==='ramp_up'){
        c.rampDaysRemaining=Math.max(0,(Number(c.rampDaysRemaining)||CONFIG.rampUpDays)-days);
        c.cash=Math.max(45,c.cash-(1.2*(days/30))); // startup payroll, leases and certification costs
        if(c.rampDaysRemaining<=0) completeRamp(c);
      }
    });
  }
  function enforceFairGrowth(before){
    const playerBenchmark=Math.max(-20,Math.min(CONFIG.maxMonthlyCashGrowth,Number(STATE._lastMonthProfit)||CONFIG.maxMonthlyCashGrowth));
    (STATE.competitors||[]).forEach(c=>{
      if(c.lifecycleStatus!=='active') return;
      const prior=before.get(c);
      if(!prior) return;
      const allowedCashGrowth=Math.max(6,Math.min(CONFIG.maxMonthlyCashGrowth,playerBenchmark+12));
      c.cash=Math.min(c.cash,prior.cash+allowedCashGrowth);
      c.cash=Math.max(20,c.cash);
      c.value=Math.min(c.value,prior.value+CONFIG.maxMonthlyValueGrowth);
      c.aggression=clamp(c.aggression,0.18,0.78);
      c.fairEconomy=true;
    });
  }
  function init(){
    lifecycle();
    normalizeStartingCompetitors();
    window.AE_AI_LIFECYCLE=api;
  }

  const api={CONFIG,init,advanceLifecycle,availableAssets,reserveIdentity,maybeLaunchStartup,unlockIdentities};
  window.AE_AI_LIFECYCLE=api;

  if(typeof startGame==='function'){
    const originalStart=startGame;
    startGame=function(){
      const result=originalStart.apply(this,arguments);
      try{ init(); }catch(err){ console.error('AI lifecycle init failed',err); }
      return result;
    };
  }

  if(typeof runCompetitorTurns==='function'){
    const originalRun=runCompetitorTurns;
    runCompetitorTurns=function(){
      try{ advanceLifecycle(turnDays()); }catch(err){ console.error('AI lifecycle tick failed',err); }
      const all=STATE.competitors||[];
      const active=all.filter(c=>c.lifecycleStatus==='active'||!c.lifecycleStatus);
      const inactive=all.filter(c=>!active.includes(c));
      const before=new Map(active.map(c=>[c,{cash:Number(c.cash)||0,value:Number(c.value)||0}]));
      STATE.competitors=active;
      try{ originalRun.apply(this,arguments); }
      finally{
        STATE.competitors=active.concat(inactive);
        try{ enforceFairGrowth(before); }catch(err){ console.error('AI fair-growth guard failed',err); }
      }
    };
  }
})();
