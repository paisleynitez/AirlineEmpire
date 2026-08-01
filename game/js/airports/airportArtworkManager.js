/* Airline Empire v1.3.0 — Airport Visual Identity Engine.
 * Produces deterministic, city-aware SVG postcards with geography, skyline,
 * landmark, lighting, and atmospheric layers. No network or runtime AI needed.
 */
(function(){
  'use strict';
  const profiles=window.AIRPORT_VISUAL_PROFILES||{};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seed){let x=hash(seed)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
  function fallback(name,region){
    const regional={
      'N America':{sky:['#28435d','#0b1929'],terrain:'flat',accent:'#84c7e8'},
      'S America':{sky:['#365d68','#10272e'],terrain:'mountains',accent:'#79d9b0'},
      'Europe':{sky:['#3b465c','#111827'],terrain:'flat',accent:'#d9c28b'},
      'Mid East':{sky:['#6a4d51','#1a2434'],terrain:'desert',accent:'#efc36b'},
      'SE Asia':{sky:['#245568','#0c2531'],terrain:'tropical',accent:'#73dfc2'},
      'Oceania':{sky:['#2c5f7b','#10263b'],terrain:'coastal',accent:'#8ed7ed'},
      'Africa':{sky:['#684b42','#1d2630'],terrain:'savanna',accent:'#e2b65f'}
    };
    return Object.assign({water:/coast|ocean/i.test(region),landmark:'none',skyline:'medium',climate:'temperate'},regional[region]||regional['N America']);
  }
  function mountains(W,H,r,color){
    let d=`M0 ${H-20}`; let x=0;
    while(x<W){const w=25+r()*35, peak=H-38-r()*25;d+=` L${(x+w*.5).toFixed(1)} ${peak.toFixed(1)} L${(x+w).toFixed(1)} ${H-20}`;x+=w;}
    return `<path d="${d} L${W} ${H} L0 ${H}Z" fill="${color}" opacity=".52"/>`;
  }
  function skyline(profile,r,W,H){
    const ground=H-14;let x=-3,b='',wins='';
    const density=profile.skyline==='dense'?1.35:profile.skyline==='low'?.72:profile.skyline==='spread'?.82:1;
    while(x<W){
      const bw=(9+r()*13)/density,bh=(16+r()*(profile.skyline==='low'?24:48))*density;
      b+=`<rect x="${x.toFixed(1)}" y="${(ground-bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx=".6" fill="#06101a" opacity="${(.72+r()*.2).toFixed(2)}"/>`;
      for(let wy=ground-bh+5;wy<ground-4;wy+=7)for(let wx=x+3;wx<x+bw-2;wx+=5)if(r()<.34)wins+=`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="1.8" height="2.5" fill="#ffd67c" opacity="${(.35+r()*.5).toFixed(2)}"/>`;
      x+=bw+2+r()*5;
    }
    return b+wins;
  }
  function landmark(kind,a){
    const c=a||'#e6c476';
    const L={
      'willis':`<g transform="translate(72 17)"><rect x="0" y="12" width="17" height="49" fill="#07111d"/><rect x="4" y="4" width="9" height="57" fill="#091725"/><path d="M6 4V-5M11 4V-8" stroke="${c}" stroke-width="1"/></g>`,
      'liberty':`<g transform="translate(24 38)" fill="${c}"><path d="m8 0 4 11H4z"/><rect x="6" y="10" width="4" height="20"/><path d="M8 2 3-3M8 2 13-4M8 2V-6" stroke="${c}"/></g>`,
      'golden-gate':`<g fill="none" stroke="${c}" stroke-width="2"><path d="M12 62h136M34 62V34M126 62V34M34 39Q80 68 126 39"/><path d="M34 39Q80 18 126 39" opacity=".5"/></g>`,
      'space-needle':`<g transform="translate(78 20)" fill="${c}"><path d="M2 12h16l-4 5H6z"/><rect x="9" y="0" width="2" height="57"/><path d="M4 57h12L10 18z" opacity=".5"/></g>`,
      'reunion':`<g transform="translate(74 27)" stroke="${c}" fill="none"><circle cx="8" cy="8" r="7" stroke-width="4"/><path d="M8 15 2 51M8 15l6 36M2 51h12"/></g>`,
      'monument':`<path d="M78 61 83 18l5 43z" fill="${c}" opacity=".9"/>`,
      'eiffel':`<g transform="translate(65 18)" fill="none" stroke="${c}" stroke-width="2"><path d="M15 0 1 48M15 0l29 48M7 31h31M4 42h37M15 0v15"/></g>`,
      'big-ben':`<g transform="translate(72 18)" fill="#091522" stroke="${c}"><rect x="0" y="8" width="18" height="47"/><path d="M2 8 9-3l7 11z" fill="${c}"/><circle cx="9" cy="19" r="5" fill="#dce8ed"/><path d="M9 19v-3M9 19l3 2"/></g>`,
      'burj':`<path d="M82 6 76 64h15z" fill="${c}" opacity=".88"/><path d="M82 6v-8" stroke="${c}"/>`,
      'opera':`<g transform="translate(43 39)" fill="#eff5f7"><path d="M0 25Q8-8 30 25z"/><path d="M20 25Q37-15 55 25z"/><path d="M48 25Q64-3 76 25z"/></g>`,
      'cn-tower':`<g transform="translate(76 10)" fill="${c}"><rect x="7" width="2" height="58"/><path d="m8 18-9 8h18z"/><ellipse cx="8" cy="25" rx="10" ry="3"/></g>`,
      'tokyo-tower':`<g transform="translate(68 16)" fill="none" stroke="${c}" stroke-width="2"><path d="M12 0 0 51M12 0l24 51M5 32h30M2 45h36M8 15h10"/></g>`,
      'marina':`<g transform="translate(48 31)" fill="#081421" stroke="${c}"><rect x="0" y="8" width="10" height="31"/><rect x="27" y="3" width="10" height="36"/><rect x="54" y="8" width="10" height="31"/><path d="M-4 7Q32-6 68 7L62 12H2z" fill="${c}"/></g>`,
      'christ':`<g transform="translate(75 23)" stroke="${c}" stroke-width="4" stroke-linecap="round"><path d="M8 0v36M-5 12h26"/></g>`,
      'hollywood':`<text x="82" y="33" text-anchor="middle" fill="${c}" font-size="8" font-weight="700" letter-spacing="1">HOLLYWOOD</text>`,
      'camelback':`<path d="M5 65Q29 37 52 55Q68 20 95 52Q119 35 155 65z" fill="${c}" opacity=".38"/>`,
      'angel':`<g transform="translate(77 27)" fill="${c}"><rect x="6" y="11" width="4" height="31"/><circle cx="8" cy="7" r="4"/><path d="M8 7-2 2M8 7 18 2" stroke="${c}" stroke-width="2"/></g>`,
      'none':''
    };
    return L[kind]||'';
  }
  function render(name,region,opts){
    const p=Object.assign({},fallback(name,region),profiles[name]||{}),r=rng('airport-art:'+name),W=160,H=88,gid='ap'+hash(name).toString(36);
    const water=p.water?`<path d="M0 69 Q40 64 80 70 T160 68V88H0Z" fill="#0a3750" opacity=".8"/><path d="M0 72Q40 68 80 73T160 71" fill="none" stroke="#7cc9da" opacity=".25"/>`:'';
    const terrain=/mountains|hills|desert|savanna/.test(p.terrain||'')?mountains(W,H,r,p.terrain==='desert'?'#6e4d38':'#19394a'):'';
    const cloud=Array.from({length:3},(_,i)=>`<ellipse cx="${25+i*53+r()*18}" cy="${13+r()*15}" rx="${12+r()*9}" ry="${3+r()*3}" fill="#dce8f2" opacity="${(.05+r()*.09).toFixed(2)}"/>`).join('');
    return `<svg class="ae4-thumb ae-airport-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(name)} city artwork"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${gid})"/>${cloud}<circle cx="${20+r()*120}" cy="${11+r()*18}" r="${5+r()*5}" fill="#f6d69a" opacity=".75"/><circle cx="${20+r()*120}" cy="${11+r()*18}" r="16" fill="#f6d69a" opacity=".05"/>${terrain}${skyline(p,r,W,H)}${landmark(p.landmark,p.accent)}${water}<rect y="82" width="160" height="6" fill="#030810"/></svg>`;
  }
  window.AirportArtworkManager={render,profiles,getProfile:(name,region)=>profiles[name]||fallback(name,region)};
})();
