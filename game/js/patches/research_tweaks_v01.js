/* RESEARCH_TWEAKS_v01 — pacing tweaks for the Tech Board (research_board_v01):
   1. A third research slot unlocks once any track reaches level 3 (two programs done on one track).
   2. Research points: each freighter in the cargo fleet (cargo_engine_v01) earns points like a passenger
      airframe does; conversions in progress count too.
   Both are live getters on the catalogue's cfg, so the board's own slot and income logic is unchanged. */
(function researchTweaksV01(){
  'use strict';
  if (window.AEResearchTweaks) return;
  const CAT = window.AE_RESEARCH_CATALOG; if (!CAT || !CAT.cfg) return;
  const st = () => (typeof STATE !== 'undefined' && STATE) ? STATE : null;
  const baseSlots = CAT.cfg.slots, baseRp = CAT.cfg.rpBase, perAc = CAT.cfg.rpPerAircraft;
  function thirdSlot(){ const S = st(); const done = (S && S.research && S.research.done) || []; if (!done.length) return false;
    const byTrack = {}; CAT.research.forEach(r => { if (done.includes(r.id)) byTrack[r.track] = Math.max(byTrack[r.track] || 0, r.lvl); });
    return Object.values(byTrack).some(l => l >= 2); }
  function freighters(){ const S = st(); const c = S && S.cargo; if (!c) return 0; return Object.values(c.fleet || {}).reduce((a, e) => a + (e.owned || 0), 0) + (c.conversions || []).length; }
  Object.defineProperty(CAT.cfg, 'slots', { get(){ return baseSlots + (thirdSlot() ? 1 : 0); }, configurable:true });
  Object.defineProperty(CAT.cfg, 'rpBase', { get(){ return baseRp + perAc * freighters(); }, configurable:true });
  // one-time note when the third slot opens
  function watch(){ const S = st(); if (!S) return; if (thirdSlot() && !S._rbThirdSlotNoted) { S._rbThirdSlotNoted = true; try { addEvent('good', '🔬 Third research slot unlocked — a track reached level 3'); } catch (e) {} } }
  const oe = window.endTurn; if (typeof oe === 'function' && !oe.__aeRT) { const w = function(){ const r = oe.apply(this, arguments); try { watch(); } catch (e) {} return r; }; w.__aeRT = true; window.endTurn = w; }
  window.AEResearchTweaks = { thirdSlot, freighters, version:'v01' };
})();
