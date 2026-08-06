/* Airline Empire v1.1.5 — streamlined supplied-logo library and 34-logo random selection. */
(function(){
  'use strict';

  const PREFIXES=['Aero','Atlas','Aurora','Blue','Cobalt','Crown','Crystal','Evergreen','Frontier','Golden','Horizon','Imperial','Liberty','Meridian','Northern','Nova','Pacific','Pinnacle','Polar','Radiant','Regal','Silver','Sky','Solar','Sovereign','Summit','Unity','Vanguard','Velocity','Westwind'];
  const ROOTS=['Arc','Crest','Falcon','Harbor','Jet','Link','Orbit','Peak','Quest','Star','Stream','Trail','Vista','Wave','Wing'];
  const SUFFIXES=['Air','Airways','Airlines','Aviation','Connect','Express','International','Jet','Regional','Wings'];
  const TYPES=['Legacy Carrier','Premium Regional','Low-Cost Carrier','Global Network','Boutique Airline','Regional Connector','Leisure Carrier'];
  const TRAITS=['Reliable operations','Premium service','Aggressive growth','Value-focused fares','Strong regional loyalty','Modern fleet strategy','High-frequency network'];
  const PALETTES=[
    ['#6f5cff','#b7a9ff','#10182a'],['#16b8c8','#80f1e8','#102338'],['#ef9e3e','#ffd47d','#27180d'],
    ['#2f76d2','#9bc7ff','#101b31'],['#cf4f86','#ffacd1','#28111e'],['#3d9b68','#9ae0b5','#10251a'],
    ['#b88932','#f4db8e','#221b0c'],['#d14a43','#ffaaa0','#2b1110'],['#7357a6','#c9b4ef','#181126']
  ];
  const SHAPES=['circle','shield','diamond','hex','round-square'];
  const SYMBOLS=['wing','mountain','star','compass','ribbon','orbit'];
  const MODES=['contact'];
  const CONTACT_NAMES=['Atlas Wings','Global One','Maple Jet','Zenith Air','Sky Sover','Orion Jet','CumulusAir','Aurora Air','Summit Air','Oceanic Air','Flux Airlines','Aether Sky','Pioneer Air','Horizon Jet','Majestic Air','Nova Air','Cascade Air','Quantum','Velocitycrest','Sunrise Air','Eagle Sky','Rapid Air','GreenJet','SkyLancer','Meridian Air','Harborwing Airlines','Westwind Jet','Unity Air','Northcrest Airways','CinderJet','Polar Connect','Sovereign Wings','Blue Meridian','Radiant Airlines','Vanguard Air','Pacific Crest','Silver Horizon','Regal Jet','Evergreen Airways','Cobalt Air','Frontier Wings','Solaris Connect','Pinnacle Air','Liberty Jet','Aurora Regional'];
  const CONTACT_NAME_STEMS=['Aero','Altair','Bluecrest','Crown','Crystal','Falcon','Golden','Horizon','Imperial','Liberty','Meridian','Northern','Nova','Pacific','Pinnacle','Polar','Radiant','Regal','Silver','Sky','Solar','Sovereign','Summit'];
  const CONTACT_NAME_ROOTS=['Arc','Crest','Falcon','Harbor','Horizon','Orbit','Peak','Quest','Star','Stream','Trail','Vista','Wave','Wing'];
  const CONTACT_NAME_ENDINGS=['Air','Airways','Airlines','Aviation','Connect','Express','International','Jet','Regional','Wings'];
  const CONTACT_SHEET_LOGOS=Array.from({length:136},(_,i)=>({
    id:`contact_${String(i+1).padStart(3,'0')}`,
    logo:`assets/airline-identities/contact-sheet-01/logo_${String(i+1).padStart(3,'0')}.webp`
  }));
  let current=null;
  let mode='contact';

  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function normalizePath(path){
    if(!path) return '';
    if(/^(data:|https?:|blob:)/i.test(path)) return path;
    return path.startsWith('./') ? path : './'+path.replace(/^\/+/, '');
  }
  function makeName(){
    const patterns=[()=>`${pick(PREFIXES)} ${pick(SUFFIXES)}`,()=>`${pick(PREFIXES)}${pick(ROOTS)} ${pick(SUFFIXES)}`,()=>`${pick(ROOTS)}${pick(ROOTS)} ${pick(SUFFIXES)}`];
    return pick(patterns)().replace(/(Air) Air$/,'Airways').slice(0,32);
  }
  function symbolMarkup(symbol,c2){
    const common=`fill="${c2}"`;
    if(symbol==='wing') return `<path ${common} d="M25 59c25-3 42-15 61-35-8 27-27 45-61 51l23-15z"/><path fill="rgba(255,255,255,.55)" d="M29 63c17-3 31-10 43-21-10 15-22 23-39 27z"/>`;
    if(symbol==='mountain') return `<path ${common} d="M18 76 49 29l14 20 10-13 29 40H18z"/><path fill="rgba(255,255,255,.62)" d="m49 29 8 26-8-7-9 8z"/>`;
    if(symbol==='star') return `<path ${common} d="m60 20 9 25 27 1-21 16 8 26-23-15-23 15 8-26-21-16 27-1z"/>`;
    if(symbol==='compass') return `<circle cx="60" cy="60" r="31" fill="none" stroke="${c2}" stroke-width="8"/><path ${common} d="m70 27-5 29 20 20-29-5-20 20 5-29-20-20 29 5z"/>`;
    if(symbol==='ribbon') return `<path ${common} d="M20 43c24-18 48-17 80 0-25-6-44 0-59 16 18-5 36-1 57 15-31-9-55-3-78 18 13-20 23-34 38-43-15-3-26-4-38-6z"/>`;
    return `<ellipse cx="60" cy="60" rx="40" ry="21" fill="none" stroke="${c2}" stroke-width="8" transform="rotate(-24 60 60)"/><circle cx="79" cy="38" r="9" ${common}/>`;
  }
  function frame(shape,c1){
    if(shape==='circle') return `<circle cx="60" cy="60" r="51" fill="${c1}"/>`;
    if(shape==='shield') return `<path fill="${c1}" d="M60 7 105 23v33c0 29-17 47-45 58C32 103 15 85 15 56V23z"/>`;
    if(shape==='diamond') return `<rect x="20" y="20" width="80" height="80" rx="15" fill="${c1}" transform="rotate(45 60 60)"/>`;
    if(shape==='hex') return `<path fill="${c1}" d="m60 7 46 26v54l-46 26L14 87V33z"/>`;
    return `<rect x="9" y="9" width="102" height="102" rx="27" fill="${c1}"/>`;
  }
  function svg(identity){
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${esc(identity.name)} logo"><defs><filter id="g"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".35"/></filter></defs><g filter="url(#g)">${frame(identity.shape,identity.palette[0])}<circle cx="43" cy="32" r="30" fill="rgba(255,255,255,.10)"/>${symbolMarkup(identity.symbol,identity.palette[1])}</g></svg>`;
  }
  function dataUri(identity){ return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg(identity)); }
  function weightedPick(items){
    const total=items.reduce((sum,item)=>sum+Math.max(1,Number(item.weight)||1),0);
    let roll=Math.random()*total;
    for(const item of items){ roll-=Math.max(1,Number(item.weight)||1); if(roll<=0) return item; }
    return items[items.length-1];
  }
  function curatedPool(){ return Array.isArray(window.CURATED_AIRLINE_IDENTITIES) ? window.CURATED_AIRLINE_IDENTITIES.filter(x=>x&&x.name) : []; }
  function contactDisplayName(sourceId){
    const index=Math.max(0,Number(String(sourceId).replace('contact_',''))-1);
    if(index<CONTACT_NAMES.length) return CONTACT_NAMES[index].replace(/\s+\d+$/,'');
    const extra=index-CONTACT_NAMES.length;
    const stem=CONTACT_NAME_STEMS[extra%CONTACT_NAME_STEMS.length];
    const root=CONTACT_NAME_ROOTS[Math.floor(extra/CONTACT_NAME_STEMS.length)%CONTACT_NAME_ROOTS.length];
    const ending=CONTACT_NAME_ENDINGS[Math.floor(extra/(CONTACT_NAME_STEMS.length*CONTACT_NAME_ROOTS.length))%CONTACT_NAME_ENDINGS.length];
    return `${stem} ${root} ${ending}`.replace(/\s+\d+$/,'');
  }
  function createContactIdentity(source){
    source=source||pick(CONTACT_SHEET_LOGOS);
    return {
      id:'atlas_runtime_'+source.id+'_'+Math.random().toString(36).slice(2,7),
      atlasId:source.id,
      name:contactDisplayName(source.id),
      group:'procedural',
      source:'contact',
      image:normalizePath(source.logo),
      palette:['#6f5cff','#b7a9ff','#10182a'],
      shape:'image',
      symbol:'logo',
      type:'Airline Logo',
      trait:''
    };
  }
  function createProceduralIdentity(){
    const name=makeName(), palette=pick(PALETTES), shape=pick(SHAPES), symbol=pick(SYMBOLS);
    return {id:'proc_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),name,group:'procedural',source:'procedural',image:'',palette,shape,symbol,type:pick(TYPES),trait:pick(TRAITS)};
  }
  function createCuratedIdentity(source){
    const pool=curatedPool();
    if(!pool.length) return createProceduralIdentity();
    source=source||weightedPick(pool);
    const palette=Array.isArray(source.palette)&&source.palette.length>=2 ? source.palette.slice(0,3) : pick(PALETTES);
    const shape=source.shape||pick(SHAPES), symbol=source.symbol||pick(SYMBOLS);
    return {
      id:'curated_runtime_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),
      curatedId:source.id||'', name:String(source.name).slice(0,32), group:'procedural', source:'curated',
      image:normalizePath(source.logo||''), palette, shape, symbol,
      type:source.category||pick(TYPES), trait:[source.region,source.style].filter(Boolean).join(' · ')||pick(TRAITS)
    };
  }
  function createIdentity(){ return createCuratedIdentity(); }
  function ensureImage(identity){ if(!identity.image) identity.image=dataUri(identity); return identity; }
  function register(identity){
    ensureImage(identity);
    const list=window.AIRLINE_LOGOS || (window.AIRLINE_LOGOS=[]);
    if(!list.some(x=>x.id===identity.id)) list.unshift(identity);
    window.AIRLINE_LOGO_GROUPS=window.AIRLINE_LOGO_GROUPS||{};
    window.AIRLINE_LOGO_GROUPS.procedural='Airline Logo';
    return identity;
  }
  function generate(){
    const list=(window.AIRLINE_LOGOS||[]).filter(x=>x&&x.id);
    if(!list.length){ shuffleContactLogos(9); return; }
    current=pick(list);
    if(typeof window.pickLogo==='function') window.pickLogo(current.id); else window._selectedLogo=current.id;
    requestAnimationFrame(()=>{
      const card=document.querySelector(`[data-logo-id="${CSS.escape(current.id)}"]`);
      if(card) card.scrollIntoView({block:'nearest',behavior:'smooth'});
    });
  }
  function setMode(){ mode='contact'; generate(); }
  function useIdentity(){
    if(!current) generate();
    register(current);
    const input=document.getElementById('nh-name-input'); // contact artwork never replaces the player's airline name
    if(typeof window.pickLogo==='function') window.pickLogo(current.id); else window._selectedLogo=current.id;
    current=createIdentity();
  }
  function shuffleContactLogos(count=9){
    const list=window.AIRLINE_LOGOS || (window.AIRLINE_LOGOS=[]);
    list.splice(0,list.length);
    const pool=curatedPool().slice();
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    pool.slice(0,Math.min(count,pool.length)).reverse().forEach(item=>register(createCuratedIdentity(item)));
    if(typeof window.wzRenderPage3==='function') window.wzRenderPage3();
    else if(typeof window.renderLogoPicker==='function') window.renderLogoPicker();
    return list.slice();
  }
  function installPanel(){
    const logoPanel=document.querySelector('.ae4-logo-panel');
    if(!logoPanel || logoPanel.dataset.aeLogoLibraryReady==='1') return;
    logoPanel.dataset.aeLogoLibraryReady='1';
    shuffleContactLogos(9);
  }
  const legacyLogos=new Map((window.AIRLINE_LOGOS||[]).map(x=>[x.id,x]));
  const oldGet=window.getAirlineLogo, oldImg=window.airlineLogoImg;
  window.getAirlineLogo=function(id){ return (window.AIRLINE_LOGOS||[]).find(x=>x.id===id) || legacyLogos.get(id) || (oldGet&&oldGet(id)); };
  window.airlineLogoImg=function(id,className,alt){
    const logo=(window.AIRLINE_LOGOS||[]).find(x=>x.id===id) || legacyLogos.get(id);
    if(logo && logo.group==='procedural') return `<img class="ae-airline-logo-img ${esc(className||'')}" src="${esc(logo.image)}" alt="${esc(alt||logo.name)}">`;
    return oldImg ? oldImg(id,className,alt) : '<span class="ae-logo-fallback">✈</span>';
  };
  window.AirlineIdentityGenerator={generate,useIdentity,setMode,shuffleContactLogos,createIdentity,createContactIdentity,createCuratedIdentity,createProceduralIdentity,register,svg};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installPanel); else installPanel();
  new MutationObserver(installPanel).observe(document.documentElement,{childList:true,subtree:true});
})();
