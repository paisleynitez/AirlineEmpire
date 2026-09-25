/* CARGO_v01 — catalogue (data only, no logic).
   Freighter roster, passenger-to-freighter conversion programmes, belly capacity by aircraft class,
   commodity types, city industry profiles, shipper names for the contract board, market events,
   hub throughput per Cargo Hub level, and the Cargo & Freight track for the Tech Board.
   Read by js/patches/cargo_engine_v01.js and cargo_window_v01.js. Freighters are a separate fleet
   (STATE.cargo.fleet) and never enter the AIRCRAFT roster, so passenger routes cannot pick them.
   Loads after researchCatalog.js so the Cargo & Freight track can be appended to the Tech Board. */
window.AE_CARGO_CATALOG = {
  /* ── freighters: payload tonnes, range mi, cost $M; base = passenger type; art = freighter hero (derived from the base artwork) ── */
  freighters: {
    'B747-8F'     :{ payload:137, range:5100, cost:190, fuel:72, era:2011, type:'jumbo',  base:'B747-8I' , art:'./assets/aircraft-heroes/b747-8f.webp' },
    'B777F'       :{ payload:102, range:5600, cost:160, fuel:78, era:2009, type:'jumbo',  base:'B777-300ER' , art:'./assets/aircraft-heroes/b777f.webp' },
    'A330-200F'   :{ payload:65,  range:4600, cost:95,  fuel:70, era:2010, type:'long',   base:'A330-300' , art:'./assets/aircraft-heroes/a330-200f.webp' },
    'B767-300F'   :{ payload:52,  range:3800, cost:60,  fuel:64, era:1995, type:'long',   base:'B767-300ER' , art:'./assets/aircraft-heroes/b767-300f.webp' },
    'B737-800BCF' :{ payload:23,  range:2300, cost:22,  fuel:72, era:2018, type:'medium', base:'B737-800',   convOnly:true , art:'./assets/aircraft-heroes/b737-800bcf.webp' },
    'A321P2F'     :{ payload:27,  range:2500, cost:26,  fuel:80, era:2020, type:'medium', base:'A321XLR',    convOnly:true , art:'./assets/aircraft-heroes/a321p2f.webp' },
    'B767-300BCF' :{ payload:52,  range:3600, cost:40,  fuel:64, era:2008, type:'long',   base:'B767-300ER', convOnly:true , art:'./assets/aircraft-heroes/b767-300bcf.webp' },
    'A330-300P2F' :{ payload:61,  range:4000, cost:55,  fuel:66, era:2017, type:'long',   base:'A330-300',   convOnly:true , art:'./assets/aircraft-heroes/a330-300p2f.webp' },
    'B747-400BCF' :{ payload:113, range:4900, cost:70,  fuel:56, era:2005, type:'jumbo',  base:'B747-400',   convOnly:true , art:'./assets/aircraft-heroes/b747-400bcf.webp' },
    /* vintage — Eras campaign only */
    'B747-200F'   :{ payload:110, range:6000, cost:90,  fuel:38, era:1972, type:'jumbo',  base:'B747-200',   vintage:true , art:'./assets/aircraft-heroes/b747-200f.webp' },
    'DC-10-30F'   :{ payload:70,  range:5500, cost:62,  fuel:42, era:1980, type:'long',   base:'DC-10-30',   vintage:true , art:'./assets/aircraft-heroes/dc-10-30f.webp' },
    'B707-320C'   :{ payload:40,  range:3700, cost:32,  fuel:34, era:1963, type:'long',   base:'B707-320B',  vintage:true , art:'./assets/aircraft-heroes/b707-320c.webp' }
  },
  identity: {
    'B747-8F'     :{ id:'TTN-8F',  name:'Titan 8F',       theme:'nose-door heavy lifter',     role:'The biggest lift on the board — oversize, heavy and long-haul freight.' },
    'B777F'       :{ id:'HRZ-F',   name:'Horizon F',      theme:'long-haul freight workhorse', role:'Intercontinental freighter for the busiest corridors.' },
    'A330-200F'   :{ id:'MRD-F',   name:'Meridian F',     theme:'mid-size widebody freighter', role:'Right-sized for medium corridors and regional trunk lanes.' },
    'B767-300F'   :{ id:'VYG-F',   name:'Voyager F',      theme:'express favourite',           role:'The integrator classic — overnight express and regional widebody work.' },
    'B737-800BCF' :{ id:'CMT-BCF', name:'Comet BCF',      theme:'converted narrowbody',        role:'Short-haul feeder freighter converted from a passenger MetroRunner.' },
    'A321P2F'     :{ id:'FLC-P2F', name:'Falcon P2F',     theme:'converted narrowbody',        role:'Largest narrowbody freighter; e-commerce feeder lanes.' },
    'B767-300BCF' :{ id:'VYG-BCF', name:'Voyager BCF',    theme:'converted widebody',          role:'Converted 767 with the same lift as a factory freighter.' },
    'A330-300P2F' :{ id:'MRD-P2F', name:'Meridian P2F',   theme:'converted widebody',          role:'Converted A330 for medium-haul freight.' },
    'B747-400BCF' :{ id:'TTN-BCF', name:'Titan BCF',      theme:'converted jumbo',             role:'Converted 747-400 — heavy lift without the factory price.' },
    'B747-200F'   :{ id:'TTN-2F',  name:'Titan 200F',     theme:'classic jumbo freighter',     role:'First-generation jumbo freighter.' },
    'DC-10-30F'   :{ id:'TRJ-10F', name:'Trident 10F',    theme:'classic trijet freighter',    role:'Trijet freighter for the 1980s freight boom.' },
    'B707-320C'   :{ id:'CLP-707C',name:'Clipper 707C',   theme:'jet-age convertible',         role:'The first jet freighter.' }
  },
  /* ── passenger-to-freighter conversions: fee $M, months out of service ── */
  conversions: [
    { from:'B737-800',   to:'B737-800BCF', fee:12, months:4 },
    { from:'A321XLR',    to:'A321P2F',     fee:16, months:5 },
    { from:'B767-300ER', to:'B767-300BCF', fee:18, months:5 },
    { from:'A330-300',   to:'A330-300P2F', fee:30, months:6 },
    { from:'B747-400',   to:'B747-400BCF', fee:35, months:6 }
  ],
  /* belly hold capacity per passenger flight, tonnes, by aircraft class */
  belly: { short:1.5, medium:2.5, long:12, jumbo:18, supersonic:0 },
  /* ── commodity types: base $/kg, monthly spot volatility, certification needed ── */
  commodities: [
    { k:'gen',  label:'General freight',      rate:1.6, vol:0.04 },
    { k:'exp',  label:'E-commerce / Express', rate:3.4, vol:0.08 },
    { k:'per',  label:'Perishables',          rate:2.6, vol:0.12 },
    { k:'pha',  label:'Pharma / Cold chain',  rate:5.8, vol:0.04, needs:'cold' },
    { k:'aut',  label:'Automotive / Parts',   rate:2.1, vol:0.08 },
    { k:'hvy',  label:'Heavy / Oversize',     rate:4.2, vol:0.08, needs:'heavy' },
    { k:'mail', label:'Mail',                 rate:1.9, vol:0.0 },
    { k:'dg',   label:'Dangerous goods',      rate:4.9, vol:0.04, needs:'dg' }
  ],
  /* default industry mix by region (shares of monthly demand); city overrides below */
  regionMix: {
    'N America': { gen:.32, exp:.24, aut:.14, pha:.08, hvy:.08, mail:.08, dg:.06 },
    'S America': { gen:.34, per:.34, aut:.10, exp:.10, mail:.06, hvy:.06 },
    'Europe':    { gen:.30, aut:.20, pha:.14, exp:.16, mail:.08, dg:.06, hvy:.06 },
    'Africa':    { gen:.34, per:.40, exp:.08, mail:.08, hvy:.10 },
    'Mid East':  { gen:.36, exp:.22, hvy:.14, pha:.08, mail:.06, dg:.14 },
    'SE Asia':   { gen:.28, exp:.34, aut:.14, per:.10, hvy:.06, dg:.08 },
    'Oceania':   { gen:.34, per:.28, exp:.16, mail:.10, hvy:.12 },
    'default':   { gen:.40, exp:.20, aut:.10, per:.10, mail:.10, hvy:.10 }
  },
  cityMix: {
    'Shenzhen':  { exp:.58, gen:.22, hvy:.10, dg:.10 },
    'Shanghai':  { gen:.30, exp:.28, aut:.18, pha:.10, dg:.14 },
    'Hong Kong': { exp:.46, gen:.26, aut:.14, hvy:.14 },
    'Frankfurt': { gen:.28, aut:.26, pha:.20, exp:.14, dg:.12 },
    'Basel':     { pha:.62, gen:.20, exp:.18 },
    'Memphis':   { exp:.60, mail:.22, gen:.18 },
    'Louisville':{ exp:.60, mail:.22, gen:.18 },
    'Cologne':   { exp:.48, mail:.22, gen:.20, aut:.10 },
    'Tokyo':     { aut:.40, gen:.26, exp:.18, dg:.16 },
    'Nagoya':    { aut:.52, gen:.26, exp:.12, hvy:.10 },
    'Stuttgart': { aut:.50, gen:.26, exp:.14, dg:.10 },
    'Detroit':   { aut:.48, gen:.28, exp:.14, hvy:.10 },
    'Lima':      { per:.70, gen:.20, exp:.10 },
    'Bogotá':    { per:.66, gen:.22, exp:.12 },
    'Bogota':    { per:.66, gen:.22, exp:.12 },
    'Quito':     { per:.72, gen:.18, exp:.10 },
    'Nairobi':   { per:.74, gen:.16, exp:.10 },
    'Amsterdam': { per:.30, gen:.28, exp:.20, pha:.12, dg:.10 },
    'Miami':     { per:.36, gen:.28, exp:.20, pha:.08, mail:.08 },
    'Houston':   { hvy:.34, gen:.30, dg:.20, exp:.16 },
    'Dubai':     { gen:.40, exp:.26, hvy:.12, pha:.10, dg:.12 },
    'Singapore': { exp:.34, gen:.28, pha:.16, dg:.12, hvy:.10 },
    'Seoul':     { aut:.30, exp:.30, gen:.24, dg:.16 },
    'Chennai':   { gen:.44, pha:.28, exp:.18, aut:.10 },
    'Mumbai':    { gen:.40, pha:.26, exp:.22, dg:.12 },
    'Anchorage': { gen:.40, exp:.40, per:.20 },
    'Chicago':   { gen:.34, exp:.26, aut:.16, hvy:.10, mail:.08, dg:.06 },
    'Los Angeles':{ exp:.36, gen:.30, per:.12, aut:.12, dg:.10 },
    'New York':  { gen:.32, exp:.26, pha:.16, mail:.14, dg:.12 },
    'São Paulo': { gen:.36, aut:.24, per:.20, exp:.12, hvy:.08 },
    'Sao Paulo': { gen:.36, aut:.24, per:.20, exp:.12, hvy:.08 }
  },
  /* seasonal multiplier by commodity and month (1-12); 1 where omitted */
  season: {
    per:  { 11:1.25, 12:1.35, 1:1.30, 2:1.20 },
    exp:  { 10:1.10, 11:1.30, 12:1.35, 1:0.85 },
    mail: { 12:1.25 },
    aut:  { 8:0.85 }
  },
  /* hub freight throughput per month by Cargo Hub level (tonnes); over the cap lanes lose load */
  hubTonnes: [1800, 4500, 9000],
  hubOverloadLoad: 0.75,
  /* ── contract board ── */
  shippers: {
    fwd:  ['Meridian Forwarding','Atlas Global Logistics','Kestrel Freight','Northbridge Cargo','Blue Anchor Forwarding','Halcyon Logistics'],
    int:  ['NorthStar Express','Skyline Parcel','Zephyr Overnight','ParcelOne'],
    chr:  ['UN Relief Agency','Orion Motorsport','Helios Energy','Aurora Film Studios','Summit Aerospace','Crescent Mining'],
    mail: ['Royal Postal Service','National Post','Continental Mail','Federal Postal Office']
  },
  contractKinds: {
    fwd:  { label:'Forwarder',  term:[6,24],  share:[.15,.35], rate:[0.95,1.10], pen:0.6, expires:[2,4] },
    int:  { label:'Integrator', term:[18,36], share:[.25,.45], rate:[1.10,1.20], pen:1.0, expires:[1,3], needs:'night' },
    chr:  { label:'Charter',    term:[1,1],   share:[.08,.20], rate:[1.50,2.20], pen:1.5, expires:[1,2] },
    mail: { label:'Mail',       term:[24,48], share:[.05,.12], rate:[0.60,0.75], pen:0.3, expires:[3,6] }
  },
  boardSize: 6,
  /* ── market events: fx applied to demand; picked at random, one active at a time ── */
  events: [
    { id:'port_strike',  name:'Port strike',          text:'Sea freight backed up — air freight demand up 40 % between {a} and {b}.', months:3, pair:true, mult:1.40 },
    { id:'harvest',      name:'Harvest peak',         text:'Perishables demand up 35 % out of {a}.', months:3, city:true, k:'per', mult:1.35 },
    { id:'ecom_fest',    name:'E-commerce festival',  text:'Express volumes up 25 % out of {a}.', months:2, city:true, k:'exp', mult:1.25 },
    { id:'factory_boom', name:'Factory boom',         text:'Automotive and parts demand up 30 % at {a}.', months:6, city:true, k:'aut', mult:1.30 },
    { id:'pharma_launch',name:'Vaccine roll-out',     text:'Cold-chain demand doubles out of {a} for a while.', months:4, city:true, k:'pha', mult:2.0 },
    { id:'freight_slump',name:'Freight slump',        text:'Spot rates soften — general freight demand down 15 % everywhere.', months:3, all:true, k:'gen', mult:0.85 }
  ],
  /* ── Tech Board: Cargo & Freight track (appended to AE_RESEARCH_CATALOG at load) ── */
  research: {
    track: { id:'cargo', name:'Cargo & Freight', sm:'Freighters, ULDs, cold chain, hubs', icon:'📦' },
    programs: [
      { id:'r_cargo_uld',  track:'cargo', lvl:1, rp:800,  months:2, name:'ULD & Pallet Systems',
        desc:'Standard containers and pallet locks on every freighter and hold.',
        fx:{ cargoCap:0.08 }, fxText:['+8% cargo capacity'], unlocks:'u_cargo_loader' },
      { id:'r_cargo_cold', track:'cargo', lvl:2, rp:1300, months:4, name:'Cold Chain Certification',
        desc:'Temperature-controlled handling from warehouse to hold.',
        fx:{ cargoCert:'cold' }, fxText:['Unlocks pharma & cold-chain freight'], unlocks:'u_cargo_coolroom' },
      { id:'r_cargo_dg',   track:'cargo', lvl:3, rp:1600, months:5, name:'Dangerous Goods Certification',
        desc:'Crews, loaders and paperwork certified for hazardous cargo.',
        fx:{ cargoCert:'dg' }, fxText:['Unlocks dangerous-goods freight'], unlocks:'u_cargo_nightops' },
      { id:'r_cargo_conv', track:'cargo', lvl:4, rp:2000, months:6, name:'Freighter Conversion Line',
        desc:'An in-house passenger-to-freighter line instead of a third-party shop.',
        fx:{ cargoConvFee:-0.25, cargoConvMonths:-1 }, fxText:['−25% conversion fee','−1 month conversion time'], unlocks:'u_cargo_automation' },
      { id:'r_cargo_net',  track:'cargo', lvl:5, rp:2600, months:8, name:'Freight Network Planning',
        desc:'Interline and road-feeder agreements widen every corridor you serve.',
        fx:{ cargoDemand:0.10 }, fxText:['+10% freight demand on your lanes'], unlocks:'u_cargo_terminal' }
    ],
    upgrades: [
      { id:'u_cargo_loader',     name:'Main-Deck Loaders',     cash:60,  upkeep:0.4, desc:'High-loaders and nose-door handling at every hub.',           fx:{ cargoCert:'heavy' },     fxText:['Unlocks heavy & oversize freight'] },
      { id:'u_cargo_coolroom',   name:'Cool-Room Terminals',   cash:80,  upkeep:0.6, desc:'Refrigerated storage at your hubs.',                          fx:{ cargoYield:{pha:0.15,per:0.10} }, fxText:['+15% pharma yield','+10% perishables yield'] },
      { id:'u_cargo_nightops',   name:'Night Operations',      cash:45,  upkeep:0.5, desc:'Night crews, lighting and slots for overnight departures.',   fx:{ cargoCert:'night' },     fxText:['Unlocks integrator contracts'] },
      { id:'u_cargo_automation', name:'Cargo Hub Automation',  cash:120, upkeep:0.8, desc:'Automated sortation and build-up at your cargo hubs.',       fx:{ cargoHub:0.20 },         fxText:['+20% hub throughput'] },
      { id:'u_cargo_terminal',   name:'Freight Terminal',      cash:150, upkeep:1.0, desc:'A dedicated freight terminal cuts handling on every tonne.',  fx:{ cargoHandling:-0.15 },   fxText:['−15% handling cost per tonne'] }
    ]
  }
};
/* append the Cargo & Freight track to the Tech Board catalogue (researchCatalog.js loads first) */
(function(){ const R = window.AE_RESEARCH_CATALOG, C = window.AE_CARGO_CATALOG.research; if (!R || !C) return;
  if (!R.tracks.some(t => t.id === C.track.id)) R.tracks.push(C.track);
  C.programs.forEach(p => { if (!R.research.some(r => r.id === p.id)) R.research.push(p); });
  C.upgrades.forEach(u => { if (!R.upgrades.some(x => x.id === u.id)) R.upgrades.push(u); }); })();
