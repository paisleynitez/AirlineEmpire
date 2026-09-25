/* RESEARCH_BOARD_v01 — catalogue (data only, no logic).
   Research programs: paid in research points, take N months, one per level per track;
   level N unlocks only when levels 1..N-1 of the same track are complete.
   Upgrades: one-time cash purchases with monthly upkeep, each unlocked by one research program.
   Effects are structured so research_board_v01.js can apply them to the live economy:
     fuel        fractional change to fuel burn            (ECON.fuelPerSeatMile)
     crew        fractional change to crew cost            (ECON.crewPerFlight / crewPerMile)
     maint       fractional change to all check costs      (MAINTENANCE_CHECKS.*.cost)
     maintEngine fractional change to engine overhaul cost (MAINTENANCE_CHECKS.engine.cost)
     incident    fractional change to incident odds        (MAINTENANCE_INCIDENTS[].prob, bad ones only)
     wear        share of monthly health loss recovered    (maintTick post-pass)
     ground      fractional change to new grounding length (maintTick post-pass)
     demand      fractional change to network demand       (crewMoraleDemandMult wrap)
     weather     multiplier on the overflight demand penalty (AEWX.OVERFLIGHT_MOD)
     rp          extra research points per month
   Nothing here touches marketing, branding or advertising. */
window.AE_RESEARCH_CATALOG = {
  cfg: {
    slots: 2,            // programs that may run at once
    rpBase: 120,         // research points earned every month
    rpPerAircraft: 8,    // ...plus this per owned airframe
    startRP: 2450        // balance for saves that pre-date the system (matches defaultState)
  },
  tracks: [
    { id:'airframe', name:'Airframe & Engines',  sm:'Fuel burn, range, payload',          icon:'✈' },
    { id:'avionics', name:'Avionics & Software', sm:'Dispatch, scheduling, health data',   icon:'🖥' },
    { id:'ops',      name:'Flight Ops Process',  sm:'Procedures crews fly every day',      icon:'📋' }
  ],
  research: [
    { id:'r_winglet',   track:'airframe', lvl:1, rp:900,  months:2, name:'Winglet Retrofit Program',
      desc:'Blended winglets fitted to the narrowbody fleet during routine checks.',
      fx:{ fuel:-0.03 }, fxText:['−3% fuel burn'], unlocks:'u_hangar' },
    { id:'r_composite', track:'airframe', lvl:2, rp:1400, months:4, name:'Composite Airframe Materials',
      desc:'Lighter structures and fairings across the fleet.',
      fx:{ fuel:-0.04 }, fxText:['−4% fuel burn'], unlocks:'u_cabin' },
    { id:'r_saf',       track:'airframe', lvl:3, rp:1800, months:6, name:'Sustainable Fuel Blending',
      desc:'Certify the fleet for 30% SAF blends and tune engines for it.',
      fx:{ fuel:-0.02 }, fxText:['−2% fuel burn'], unlocks:'u_wifi' },
    { id:'r_engine',    track:'airframe', lvl:4, rp:2600, months:8, name:'Next-Gen Engine Cores',
      desc:'Geared-fan cores with a higher bypass ratio on every new delivery.',
      fx:{ fuel:-0.08 }, fxText:['−8% fuel burn'], unlocks:'u_engine' },
    { id:'r_laminar',   track:'airframe', lvl:5, rp:3200, months:10, name:'Laminar Flow Wing Program',
      desc:'Natural-laminar-flow wing surfaces and sealed slats on the next generation of airframes.',
      fx:{ fuel:-0.06 }, fxText:['−6% fuel burn'], unlocks:'u_coating' },

    { id:'r_crewopt',   track:'avionics', lvl:1, rp:1000, months:2, name:'Crew Scheduling Optimizer',
      desc:'Pairing software that cuts hotel nights and deadhead flights.',
      fx:{ crew:-0.06 }, fxText:['−6% crew cost'], unlocks:'u_erp' },
    { id:'r_predict',   track:'avionics', lvl:2, rp:1500, months:4, name:'Predictive Maintenance AI',
      desc:'Sensor data flags failures before they ground a jet.',
      fx:{ incident:-0.20 }, fxText:['−20% unscheduled incidents'], unlocks:'u_parts' },
    { id:'r_twin',      track:'avionics', lvl:3, rp:2000, months:6, name:'Digital Twin Fleet Monitoring',
      desc:'A live health model of every airframe in the fleet.',
      fx:{ wear:0.15 }, fxText:['Aircraft health wears 15% slower'], unlocks:'u_occ' },
    { id:'r_flightplan', track:'avionics', lvl:4, rp:2400, months:7, name:'Automated Flight Planning',
      desc:'Wind-optimal routing and cost-index cruise computed for every departure.',
      fx:{ fuel:-0.03 }, fxText:['−3% fuel burn'], unlocks:'u_datalink' },
    { id:'r_autohealth', track:'avionics', lvl:5, rp:3000, months:9, name:'Autonomous Health Monitoring',
      desc:'Aircraft self-diagnose in flight and book their own fixes before landing.',
      fx:{ incident:-0.25, wear:0.10 }, fxText:['−25% unscheduled incidents','Health wears 10% slower'], unlocks:'u_aog' },

    { id:'r_cda',       track:'ops',      lvl:1, rp:800,  months:2, name:'Continuous Descent Approach',
      desc:'Idle-thrust descents at every hub that allows them.',
      fx:{ fuel:-0.02 }, fxText:['−2% fuel burn'], unlocks:'u_gate' },
    { id:'r_taxi',      track:'ops',      lvl:2, rp:1100, months:3, name:'Single-Engine Taxi Procedure',
      desc:'Taxi out on one engine after a cold-start check.',
      fx:{ fuel:-0.015 }, fxText:['−1.5% fuel burn'], unlocks:'u_sim' },
    { id:'r_turn',      track:'ops',      lvl:3, rp:1900, months:5, name:'Rapid Turnaround Standard',
      desc:'Choreographed 25-minute turns on short-haul routes.',
      fx:{ demand:0.03 }, fxText:['+3% network demand'], unlocks:'u_deice' },
    { id:'r_etops',     track:'ops',      lvl:4, rp:2300, months:6, name:'Extended Twin-Ops Certification',
      desc:'ETOPS-330 approval lets twinjets fly the direct oceanic tracks.',
      fx:{ demand:0.03, fuel:-0.01 }, fxText:['+3% network demand','−1% fuel burn'], unlocks:'u_line' },
    { id:'r_fatigue',   track:'ops',      lvl:5, rp:2800, months:8, name:'Fatigue Risk Management',
      desc:'Science-based rostering replaces flat duty limits; crews fly rested.',
      fx:{ crew:-0.05, incident:-0.05 }, fxText:['−5% crew cost','−5% incidents'], unlocks:'u_crewbase' }
  ],
  upgrades: [
    { id:'u_hangar', name:'Heavy Maintenance Hangar', cash:140, upkeep:0.9,
      desc:'C-checks done in-house instead of at a contractor.',
      fx:{ maint:-0.25 }, fxText:['−25% check costs'] },
    { id:'u_engine', name:'Engine Overhaul Shop', cash:180, upkeep:1.2,
      desc:'Full teardown and rebuild capability.',
      fx:{ maintEngine:-0.30 }, fxText:['−30% engine overhaul cost'] },
    { id:'u_parts',  name:'Rotable Spares Pool', cash:65, upkeep:0.4,
      desc:'Shared inventory of high-failure parts.',
      fx:{ ground:-0.40 }, fxText:['Grounding time −40%'] },
    { id:'u_sim',    name:'Flight Simulator Center', cash:95, upkeep:0.5,
      desc:'Type-rating simulators for every aircraft you fly.',
      fx:{ crew:-0.04 }, fxText:['−4% crew cost'] },
    { id:'u_occ',    name:'Operations Control Center', cash:110, upkeep:0.7,
      desc:'24/7 dispatch desk with live weather and slot data.',
      fx:{ incident:-0.10, ground:-0.20 }, fxText:['−10% incidents','Grounding time −20%'] },
    { id:'u_deice',  name:'Winter Operations Kit', cash:48, upkeep:0.3,
      desc:'De-icing trucks, glycol recovery, heated stands.',
      fx:{ weather:0.5 }, fxText:['Storm overflight penalty halved'] },
    { id:'u_cabin',  name:'Cabin Retrofit', cash:60, upkeep:0,
      desc:'New slimline seats, lighting and seat-back screens.',
      fx:{ demand:0.04 }, fxText:['+4% network demand'] },
    { id:'u_wifi',   name:'Satellite Connectivity', cash:40, upkeep:0.2,
      desc:'Ku-band Wi-Fi across the fleet.',
      fx:{ demand:0.02 }, fxText:['+2% network demand'] },
    { id:'u_erp',    name:'Airline Operating System', cash:70, upkeep:0.6,
      desc:'Replace the patchwork of spreadsheets with one engineering system.',
      fx:{ rp:60 }, fxText:['+60 research points / month'] },
    { id:'u_gate',   name:'Electric Ground Equipment', cash:36, upkeep:0.2,
      desc:'Ground power units and e-tugs at every gate; no APU burn on stand.',
      fx:{ fuel:-0.01, demand:0.01 }, fxText:['−1% fuel burn','+1% network demand'] },
    { id:'u_coating', name:'Drag-Reduction Coating', cash:30, upkeep:0.1,
      desc:'Riblet paint applied fleet-wide at the next repaint cycle.',
      fx:{ fuel:-0.01 }, fxText:['−1% fuel burn'] },
    { id:'u_datalink', name:'Fleet Datalink Network', cash:85, upkeep:0.5,
      desc:'Satellite datalink streams engine and airframe data to the ground in real time.',
      fx:{ incident:-0.10 }, fxText:['−10% incidents'] },
    { id:'u_aog',     name:'AOG Rapid Response Desk', cash:75, upkeep:0.4,
      desc:'A standing team and parts kit that flies to any grounded aircraft within hours.',
      fx:{ ground:-0.30 }, fxText:['Grounding time −30%'] },
    { id:'u_line',    name:'Line Maintenance Stations', cash:95, upkeep:0.6,
      desc:'Overnight line checks at outstations instead of ferrying jets home.',
      fx:{ maint:-0.10 }, fxText:['−10% check costs'] },
    { id:'u_crewbase', name:'Crew Base Network', cash:110, upkeep:0.7,
      desc:'Crew bases at secondary hubs cut positioning flights and hotel nights.',
      fx:{ crew:-0.05 }, fxText:['−5% crew cost'] }
  ]
};
