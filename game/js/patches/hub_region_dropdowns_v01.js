/* HUB_REGION_DROPDOWNS_v01 — Setup step 3 "Choose Your Home Hub": the region pill tabs become
   two side-by-side dropdowns (Region / Subregion) styled exactly like the New Route window
   filters (new_route_filters_v01: white on black, 38px, side by side). Region selection still
   flows through the native hubSetRegion(); the subregion select is patch-local and only hides
   non-matching hub cards in #nh-hub-grid. UI-only — no gameplay or data changes. */
(function hubRegionDropdownsV01(){
  'use strict';
  if(window.AEHubRegionDropdownsV01) return;
  const API={version:'v01'};
  window.AEHubRegionDropdownsV01=API;

  let _hubSubregion=null;

  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function cur(name){ try{ return (0,eval)(name); }catch(e){ return undefined; } }

  function installStyles(){
    if(document.getElementById('ae-hub-region-dropdowns-v01-style')) return;
    const style=document.createElement('style');
    style.id='ae-hub-region-dropdowns-v01-style';
    style.textContent=`
      #hub-region-tabs.hub-filter-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:0 0 10px!important;width:100%!important;flex-wrap:nowrap!important}
      #hub-region-tabs .hub-filter-select{width:100%;min-width:0;height:38px;padding:0 9px;border-radius:8px;border:1px solid rgba(102,159,184,.22)!important;color:#fff!important;background:#000!important;color-scheme:dark;font:600 12px Inter,Segoe UI,Arial,sans-serif!important;outline:none;cursor:pointer;box-shadow:none!important}
      #hub-region-tabs .hub-filter-select option,#hub-region-tabs .hub-filter-select optgroup{color:#fff;background:#000}
      #hub-region-tabs .hub-filter-select:disabled{color:#9aa7ae!important;background:#000!important;opacity:.72;cursor:default}
      #hub-region-tabs .hub-filter-select:focus-visible{border-color:rgba(78,190,237,.6)!important}
    `;
    document.head.appendChild(style);
  }

  function majorsByRegion(){
    const CITIES=cur('CITIES')||{};
    const by={};
    Object.entries(CITIES).forEach(function(e){ const n=e[0],c=e[1]; if(c&&c.major) (by[c.region]=by[c.region]||[]).push([n,c]); });
    return by;
  }

  function subKey(region, ci, name){
    const SUB=cur('SUBREGIONS')||{}; const subs=SUB[region]; if(!subs||!ci) return null;
    for(const s of subs){ try{ if(s.test(ci.lat, ci.lon, name)) return s.key; }catch(e){} }
    return null;
  }

  function regionSelect(regions, by, active){
    const LBL=cur('AE4_REGION_LABEL')||{};
    return '<select class="hub-filter-select" aria-label="Region" onchange="AEHubRegionDropdownsV01.setRegion(this.value)">'+
      regions.map(function(r){
        return '<option value="'+esc(r)+'"'+(r===active?' selected':'')+'>'+esc(LBL[r]||r)+' ('+((by[r]||[]).length)+')</option>';
      }).join('')+
      '</select>';
  }

  function subregionSelect(region, by){
    const SUB=cur('SUBREGIONS')||{}; const subs=SUB[region]||[];
    const majors=by[region]||[];
    const visible=subs.filter(function(s){
      return majors.some(function(e){ return subKey(region,e[1],e[0])===s.key; });
    });
    if(_hubSubregion&&!visible.some(function(s){ return s.key===_hubSubregion; })) _hubSubregion=null;
    const enabled=visible.length>1;
    return '<select class="hub-filter-select" aria-label="Subregion"'+(enabled?'':' disabled')+
      ' onchange="AEHubRegionDropdownsV01.setSubregion(this.value===\'\'?null:this.value)">'+
      '<option value=""'+(_hubSubregion==null?' selected':'')+'>All Subregions</option>'+
      visible.map(function(s){ return '<option value="'+esc(s.key)+'"'+(s.key===_hubSubregion?' selected':'')+'>'+esc(s.label)+'</option>'; }).join('')+
      '</select>';
  }

  function applyFilter(){
    const grid=document.getElementById('nh-hub-grid'); if(!grid) return;
    const region=cur('_hubRegion'); const CITIES=cur('CITIES')||{};
    grid.querySelectorAll('.ae4-hub').forEach(function(card){
      const nameEl=card.querySelector('.ae4-hub-city'); if(!nameEl) return;
      const n=nameEl.textContent.trim();
      const show=_hubSubregion==null||subKey(region,CITIES[n],n)===_hubSubregion;
      card.style.display=show?'':'none';
    });
  }

  function rebuild(){
    const tabs=document.getElementById('hub-region-tabs'); if(!tabs) return;
    const by=majorsByRegion();
    if(!Object.keys(by).length) return;
    const META=cur('REGION_META')||{};
    const regions=Object.keys(by).sort(function(a,b){ return ((META[a]||{}).order||9)-((META[b]||{}).order||9); });
    const active=cur('_hubRegion')||regions[0];
    tabs.classList.add('hub-filter-row');
    tabs.innerHTML=regionSelect(regions,by,active)+subregionSelect(active,by);
    applyFilter();
  }

  API.setRegion=function(r){
    _hubSubregion=null;
    if(typeof window.hubSetRegion==='function') window.hubSetRegion(r);
    rebuild(); // hubSetRegion re-renders via wzRenderPage3 (wrapped below); rebuild again defensively
  };
  API.setSubregion=function(k){
    _hubSubregion=k;
    rebuild();
  };

  function wrap(){
    if(window.__aeHubRegionDropdownsV01Wrapped) return;
    if(typeof window.wzRenderPage3!=='function') return;
    window.__aeHubRegionDropdownsV01Wrapped=true;
    const orig=window.wzRenderPage3;
    window.wzRenderPage3=function(){ const out=orig.apply(this,arguments); try{ rebuild(); }catch(e){} return out; };
  }

  function init(){
    installStyles();
    wrap();
    rebuild();
    let attempts=0;
    const timer=setInterval(function(){ wrap(); if(window.__aeHubRegionDropdownsV01Wrapped||++attempts>=24) clearInterval(timer); },250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
