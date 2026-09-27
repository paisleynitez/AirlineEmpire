/* MAP_VIBRANCE_v01 — the world map made livelier without touching the map renderer.
   Adds, on top of renderMap()'s output: a day/night terminator that drifts across the globe (real-time,
   ~8 min per rotation; sun declination follows the game month), city lights on the night side of
   hubs and major cities, a soft glow halo under hub markers with a slow breathing ring, flowing
   dashes along your routes, a faint animated ocean sheen, a cinematic edge vignette, and a
   warmer satellite colour grade (CSS). v3 adds a Map Layers control (demand heat, weather, day/night, lights, route flow, sheen). Everything is pointer-events:none and purely visual; no
   gameplay values are read except CITIES, STATE.hubs, STATE.routes and STATE.month.
   Layers live inside each of the three pan copies (so they pan/zoom with the map) and are
   re-attached after every renderMap. Styling: css/map-vibrance-v01.css. */
(function mapVibranceV01(){
  'use strict';
  if (window.AEMapVibrance) return;
  const NS = 'http://www.w3.org/2000/svg';
  const st = () => (typeof STATE !== 'undefined' && STATE) ? STATE : null;
  const W = () => (typeof MAP_W !== 'undefined' ? MAP_W : 2020), H = () => (typeof MAP_H !== 'undefined' ? MAP_H : 1010);
  const px = lon => (lon + 180) / 360 * W(), py = lat => (90 - lat) / 180 * H();
  const ROT_MS = 8 * 60 * 1000;            // one sun rotation
  let t0 = Date.now() - Math.random() * ROT_MS;
  const el = (tag, attrs, html) => { const e = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k])); if (html) e.innerHTML = html; return e; };

  /* ── sun ──────────────────────────────────────────────────── */
  function sun(){ const S = st(); const m = (S && Number.isFinite(S.month)) ? S.month : 5; const day = (m + 0.5) * 30.4;
    const decl = 23.44 * Math.sin(2 * Math.PI * (day - 81) / 365); const lon = 180 - ((Date.now() - t0) % ROT_MS) / ROT_MS * 360; return { decl, lon }; }
  function terminatorPath(){ const { decl, lon } = sun(); const d = Math.max(0.5, Math.abs(decl)) * Math.sign(decl || 1); const tanD = Math.tan(d * Math.PI / 180);
    const pts = []; for (let L = -180; L <= 180; L += 4) { const lat = Math.atan(-Math.cos((L - lon) * Math.PI / 180) / tanD) * 180 / Math.PI; pts.push([px(L), py(lat)]); }
    const poleY = d > 0 ? H() : 0;           // northern summer: south pole is dark
    return 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'L' + W() + ',' + poleY + 'L0,' + poleY + 'Z'; }
  function isNight(lon, lat){ const { decl, lon: sl } = sun(); const a = lat * Math.PI / 180, dd = decl * Math.PI / 180, h = (lon - sl) * Math.PI / 180;
    return Math.sin(a) * Math.sin(dd) + Math.cos(a) * Math.cos(dd) * Math.cos(h) < -0.02; }

  /* ── layers ───────────────────────────────────────────────── */
  function ensureDefs(svg){ if (svg.querySelector('#aemv-defs')) return; const d = el('defs', { id:'aemv-defs' });
    d.innerHTML = '<filter id="aemv-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/></filter>' +
      '<filter id="aemv-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>' +
      '<filter id="aemv-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<radialGradient id="aemv-halo"><stop offset="0" stop-color="#52d8ff" stop-opacity=".55"/><stop offset=".55" stop-color="#52d8ff" stop-opacity=".12"/><stop offset="1" stop-color="#52d8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aemv-light"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset=".4" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="aemv-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fe9ff" stop-opacity="0"/><stop offset=".5" stop-color="#7fe9ff" stop-opacity=".07"/><stop offset="1" stop-color="#7fe9ff" stop-opacity="0"/><animate attributeName="x1" values="-1;1" dur="26s" repeatCount="indefinite"/><animate attributeName="x2" values="0;2" dur="26s" repeatCount="indefinite"/></linearGradient>' +
      '<radialGradient id="aemv-vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#020814" stop-opacity="0"/><stop offset="1" stop-color="#020814" stop-opacity=".62"/></radialGradient>';
    svg.insertBefore(d, svg.firstChild); }

  function buildUnder(){ const g = el('g', { class:'aemv-under', 'pointer-events':'none' });
    g.appendChild(el('rect', { class:'aemv-sheen', x:0, y:0, width:W(), height:H(), fill:'url(#aemv-sheen)' }));
    g.appendChild(el('path', { class:'aemv-night', d:terminatorPath(), fill:'#02091a', opacity:'0.5', filter:'url(#aemv-blur)' }));
    const S = st(); if (S) { const lights = el('g', { class:'aemv-lights' });
      Object.entries(CITIES).forEach(([n, c]) => { const hub = S.hubs && S.hubs.includes(n); if (!hub && !c.major) return; if (!isNight(c.lon, c.lat)) return;
        lights.appendChild(el('circle', { cx:c.x, cy:c.y, r: hub ? 13 : 8, fill:'url(#aemv-light)' })); });
      g.appendChild(lights);
      const halos = el('g', { class:'aemv-halos' });
      (S.hubs || []).forEach(n => { const c = CITIES[n]; if (!c) return; halos.appendChild(el('circle', { cx:c.x, cy:c.y, r:34, fill:'url(#aemv-halo)' }));
        const ring = el('circle', { cx:c.x, cy:c.y, r:14, fill:'none', stroke:'#52d8ff', 'stroke-width':'1.2', opacity:'0.6', 'vector-effect':'non-scaling-stroke' });
        ring.innerHTML = '<animate attributeName="r" values="12;30" dur="3.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="3.2s" repeatCount="indefinite"/>'; halos.appendChild(ring); });
      g.appendChild(halos); }
    return g; }
  function buildFlow(copy){ const g = el('g', { class:'aemv-flow', 'pointer-events':'none', filter:'url(#aemv-glow)' }); const routes = copy.querySelector('.routes'); if (!routes) return g;
    Array.from(routes.querySelectorAll('path')).forEach(p => { if (p.getAttribute('opacity') !== '1' || p.getAttribute('stroke') === 'transparent') return;
      const f = el('path', { d:p.getAttribute('d'), fill:'none', stroke:'#ffffff', 'stroke-width':'2.4', 'stroke-linecap':'round', 'stroke-dasharray':'3 21', opacity:'0.95', 'vector-effect':'non-scaling-stroke', class:'aemv-dash' }); g.appendChild(f); });
    return g; }

  function decorate(){ const svg = document.getElementById('world-map'); const pan = svg && document.getElementById('pan'); if (!svg || !pan) return;
    ensureDefs(svg);
    Array.from(pan.children).forEach(copy => { if (copy.id === 'weather-layer') return;
      copy.querySelectorAll('.aemv-under,.aemv-flow').forEach(x => x.remove());
      const anchor = copy.querySelector('.demand-overlay') || copy.querySelector('.routes'); const under = buildUnder(); if (anchor) copy.insertBefore(under, anchor); else copy.appendChild(under);
      const routes = copy.querySelector('.routes'); const flow = buildFlow(copy); if (routes && routes.nextSibling) copy.insertBefore(flow, routes.nextSibling); else copy.appendChild(flow); });
    if (!svg.querySelector('#aemv-top')) { const vb = (svg.getAttribute('viewBox') || '0 0 1100 620').split(/\s+/).map(Number);
      const top = el('g', { id:'aemv-top', 'pointer-events':'none' }); top.appendChild(el('rect', { x:vb[0], y:vb[1], width:vb[2], height:vb[3], fill:'url(#aemv-vig)' })); svg.appendChild(top); } }
  function tickSun(){ const svg = document.getElementById('world-map'); if (!svg) return; const d = terminatorPath(); svg.querySelectorAll('.aemv-night').forEach(p => p.setAttribute('d', d));
    const S = st(); svg.querySelectorAll('.aemv-lights').forEach(gl => { gl.innerHTML = ''; if (!S) return; Object.entries(CITIES).forEach(([n, c]) => { const hub = S.hubs && S.hubs.includes(n); if (!hub && !c.major) return; if (!isNight(c.lon, c.lat)) return; gl.appendChild(el('circle', { cx:c.x, cy:c.y, r: hub ? 13 : 8, fill:'url(#aemv-light)' })); }); }); }

  /* Reduced motion: a Settings toggle (Menu → Motion) that stops the flowing routes, sun drift, pulse rings
     and ocean sheen. Stored locally; the OS "reduce motion" preference is honoured by the CSS too. */
  const RM_KEY = 'ae_reduced_motion';
  function rmOn(){ try { return localStorage.getItem(RM_KEY) === '1'; } catch (e) { return false; } }
  function rmApply(){ document.body.classList.toggle('ae-reduced-motion', rmOn()); }
  function rmSet(v){ try { localStorage.setItem(RM_KEY, v ? '1' : '0'); } catch (e) {} rmApply(); }
  function settingsSection(){ return '<div style="display:flex;align-items:center;gap:9px;margin:20px 0 11px"><span style="font-size:10.7px;font-weight:700;letter-spacing:1.5px;color:var(--muted)">🎞 MOTION</span><span style="flex:1;height:1px;background:var(--border)"></span></div>' +
    '<label style="display:flex;align-items:center;gap:10px;font-size:12.4px;cursor:default"><input type="checkbox" ' + (rmOn() ? 'checked' : '') + ' onchange="AEMapVibrance.setReducedMotion(this.checked)" style="accent-color:var(--accent)"> <span><b>Reduce motion</b><span style="display:block;font-size:11.3px;color:var(--muted)">Stops the flowing route dashes, day/night drift, hub pulse rings and ocean sheen on the map.</span></span></label>'; }
  /* Map Layers: a small control beside the Demand button — Demand heat, Weather, Day/night, City lights,
     Route flow. Choices are remembered locally. */
  const LKEY = 'ae_map_layers';
  function layers(){ try { return Object.assign({ weather:true, night:true, lights:true, flow:true, sheen:true }, JSON.parse(localStorage.getItem(LKEY) || '{}')); } catch (e) { return { weather:true, night:true, lights:true, flow:true, sheen:true }; } }
  function setLayer(k, v){ const L = layers(); L[k] = !!v; try { localStorage.setItem(LKEY, JSON.stringify(L)); } catch (e) {} applyLayers(); renderLayersPanel(); }
  function applyLayers(){ const L = layers(); const b = document.body.classList; b.toggle('ae-ml-noweather', !L.weather); b.toggle('ae-ml-nonight', !L.night); b.toggle('ae-ml-nolights', !L.lights); b.toggle('ae-ml-noflow', !L.flow); b.toggle('ae-ml-nosheen', !L.sheen); }
  function demandOn(){ const b = document.getElementById('demand-toggle'); return !!(b && b.classList.contains('active')); }
  function renderLayersPanel(){ const p = document.getElementById('ae-map-layers'); if (!p) return; const L = layers();
    const row = (k, label, on, fn) => '<label><input type="checkbox" ' + (on ? 'checked' : '') + ' onchange="' + fn + '"><span>' + label + '</span></label>';
    p.querySelector('.ae-ml-list').innerHTML = row('demand', 'Passenger demand heat', demandOn(), 'toggleDemandOverlay();AEMapVibrance.renderLayersPanel()') + row('weather', 'Weather', L.weather, 'AEMapVibrance.setLayer(\'weather\',this.checked)') + row('night', 'Day / night', L.night, 'AEMapVibrance.setLayer(\'night\',this.checked)') + row('lights', 'City lights', L.lights, 'AEMapVibrance.setLayer(\'lights\',this.checked)') + row('flow', 'Route flow', L.flow, 'AEMapVibrance.setLayer(\'flow\',this.checked)') + row('sheen', 'Ocean sheen', L.sheen, 'AEMapVibrance.setLayer(\'sheen\',this.checked)'); }
  function mountLayers(){ const mc = document.getElementById('map-container'); if (!mc || document.getElementById('ae-map-layers-btn')) return;
    const btn = document.createElement('div'); btn.id = 'ae-map-layers-btn'; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/></svg> Layers'; btn.title = 'Map layers';
    const panel = document.createElement('div'); panel.id = 'ae-map-layers'; panel.innerHTML = '<div class="ae-ml-hd">MAP LAYERS</div><div class="ae-ml-list"></div>';
    btn.onclick = e => { e.stopPropagation(); panel.classList.toggle('open'); renderLayersPanel(); };
    panel.onclick = e => e.stopPropagation(); document.addEventListener('click', () => panel.classList.remove('open'));
    mc.appendChild(btn); mc.appendChild(panel); applyLayers(); }
  function install(){
    rmApply(); mountLayers();
    const obs = window.buildSettings; if (typeof obs === 'function' && !obs.__aeMV) { const w = function(){ let h = obs.apply(this, arguments); try { const i = h.lastIndexOf('DANGER ZONE'); const cut = i > 0 ? h.lastIndexOf('<div', i) : -1; h = cut > 0 ? h.slice(0, cut) + settingsSection() + h.slice(cut) : h.replace('</div>\s*$', settingsSection() + '</div>'); } catch (e) {} return h; }; w.__aeMV = true; window.buildSettings = w; } if (typeof renderMap !== 'function' || !document.getElementById('world-map')) { setTimeout(install, 250); return; }
    const o = window.renderMap; if (!o.__aeMV) { const w = function(){ const r = o.apply(this, arguments); try { decorate(); } catch (e) { console.warn('[map-vibrance]', e); } return r; }; w.__aeMV = true; window.renderMap = w; }
    try { decorate(); } catch (e) {}
    setInterval(() => { if (!document.hidden && !rmOn()) { try { tickSun(); } catch (e) {} } }, 4000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  window.AEMapVibrance = { decorate, tickSun, sun, setReducedMotion: rmSet, reducedMotion: rmOn, layers, setLayer, renderLayersPanel, setSunLon(l){ t0 = Date.now() - ((180 - l) / 360) * ROT_MS; tickSun(); }, version:'v01' };
})();
