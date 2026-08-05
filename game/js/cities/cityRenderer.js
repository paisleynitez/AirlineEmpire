/* AE v1.1.6 — THCityscape deterministic SVG renderer. */
(function(){
  'use strict';
  function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function rng(seed){ let a=hash(seed); return function(){ a+=0x6D2B79F5; let t=a; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
  function terrain(p,W,H){
    if(p.terrain==='mountains'||p.terrain==='desert') return `<path d="M0 55 L20 37 38 49 58 29 82 50 105 35 132 52 160 31 180 51 180 88H0Z" fill="#111827" opacity=".72"/>`;
    if(p.terrain==='hills') return `<path d="M0 61 Q24 42 48 59 T96 57 T144 54 T180 58 V88H0Z" fill="#10202b" opacity=".8"/>`;
    if(p.terrain==='trees'||p.terrain==='tropical'||p.terrain==='savanna') return `<path d="M0 69 ${Array.from({length:18},(_,i)=>`L${i*11} ${58-(i%3)*7} L${i*11+5} 69`).join(' ')} V88H0Z" fill="#0b1b1a" opacity=".86"/>`;
    return '';
  }
  function water(p,W,H){
    if(p.water==='none') return '';
    return `<rect y="70" width="${W}" height="18" fill="#071b2a"/><path d="M0 74 Q28 70 56 74 T112 74 T180 74" fill="none" stroke="#4bb4c4" stroke-opacity=".25" stroke-width="1.2"/>`;
  }
  function landmark(p){
    const c='#09111b';
    switch(p.landmark){
      case 'one-world': return `<path d="M91 63h10V27l-5-12-5 12z" fill="${c}"/><rect x="94" y="8" width="4" height="11" fill="${c}"/>`;
      case 'willis': return `<rect x="88" y="27" width="16" height="42" fill="${c}"/><rect x="91" y="18" width="5" height="10" fill="${c}"/><rect x="98" y="13" width="4" height="15" fill="${c}"/>`;
      case 'la-tower': return `<rect x="92" y="35" width="12" height="34" fill="${c}"/><path d="M90 35h16l-3-7H93z" fill="${c}"/>`;
      case 'reunion': return `<rect x="97" y="39" width="4" height="31" fill="${c}"/><circle cx="99" cy="31" r="10" fill="${c}"/><circle cx="99" cy="31" r="6" fill="#d7b474" opacity=".65"/>`;
      case 'monument': return `<path d="M97 68h5l-1-42-2-11-2 11z" fill="${c}"/>`;
      case 'houston-spire': return `<rect x="92" y="31" width="13" height="39" fill="${c}"/><path d="M96 31l3-13 3 13z" fill="${c}"/>`;
      case 'golden-gate': return `<path d="M12 65h65M22 65V37M65 65V37M22 42h43M22 42Q43 55 65 42" fill="none" stroke="#9f4f3d" stroke-width="3"/>`;
      case 'bank-spire': return `<rect x="92" y="33" width="13" height="37" fill="${c}"/><path d="M98 19l6 14H92z" fill="${c}"/>`;
      case 'camelback': return `<path d="M82 66 Q92 48 101 58 Q108 43 119 66Z" fill="#2a1717"/>`;
      case 'sail': return `<path d="M98 24q19 13 0 42q-19-13 0-42z" fill="${c}"/>`;
      case 'needle': return `<path d="M97 68h5l-1-41-2-15-2 15z" fill="${c}"/>`;
      case 'old-spire': return `<rect x="94" y="37" width="10" height="32" fill="${c}"/><path d="M99 18l7 19H92z" fill="${c}"/>`;
      default: return `<rect x="94" y="31" width="11" height="39" fill="${c}"/><path d="M99 21l5 10H94z" fill="${c}"/>`;
    }
  }
  function buildings(name,p){
    const r=rng('thcity:'+name), W=180, ground=72;
    let x=-3,out='',wins=''; const count=p.density==='dense'?18:p.density==='wide'?12:p.density==='low'?9:14;
    for(let i=0;i<count&&x<W;i++){
      const bw=8+Math.floor(r()*13), bh=15+Math.floor(r()*(p.density==='dense'?45:34));
      out+=`<rect x="${x}" y="${ground-bh}" width="${bw}" height="${bh}" rx="${r()>.8?2:0}" fill="#07101a" opacity="${(.74+r()*.22).toFixed(2)}"/>`;
      for(let yy=ground-bh+5;yy<ground-4;yy+=7) for(let xx=x+3;xx<x+bw-2;xx+=6) if(r()<.24) wins+=`<rect x="${xx}" y="${yy}" width="2" height="2.5" fill="#f4c86c" opacity="${(.35+r()*.45).toFixed(2)}"/>`;
      x+=bw+2+Math.floor(r()*3);
    }
    return out+wins;
  }
  function render(name,region){
    const p=(window.AECityProfileManager&&window.AECityProfileManager.get(name,region))||{palette:['#1d3550','#0a1421','#5c91b2'],water:'none',terrain:'flat',landmark:'generic-spire',density:'medium'};
    const id='thc'+hash(name+region).toString(16), W=180,H=88;
    return `<svg class="ae4-thumb thc-thumb" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Stylized ${name} cityscape">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.palette[0]}"/><stop offset=".62" stop-color="${p.palette[1]}"/><stop offset="1" stop-color="${p.palette[2]}"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#${id})"/>
      <circle cx="145" cy="18" r="11" fill="#f4d49c" opacity=".72"/><circle cx="145" cy="18" r="20" fill="#f4d49c" opacity=".08"/>
      ${terrain(p,W,H)}${water(p,W,H)}${buildings(name,p)}${landmark(p)}
      <rect y="72" width="${W}" height="16" fill="#040b12" opacity=".92"/>
      <path d="M0 77H180" stroke="#a789ff" stroke-opacity=".18"/>
    </svg>`;
  }
  window.AECityRenderer={render};
})();
