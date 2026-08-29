Warning: truncated output (original token count: 520213)
... 1032275 bytes omitted ...

const PLAYER_STARTING_CASH = 1500;
const LEVELS = [
  { id:1, name:'Easy',   blurb:'Fewer regions, timid rivals',          regions:3, rivalAgg:0.6, rivals:2 },
  { id:2, name:'Normal', blurb:'Balanced economy & competition',      regions:4, rivalAgg:1.0, rivals:3 },
  { id:3, name:'Hard',   blurb:'More regions, aggressive rivals',     regions:5, rivalAgg:1.3, rivals:3 },
  { id:4, name:'Expert', blurb:'Maximum reach, ruthless rivals',      regions:6, rivalAgg:1.7, rivals:4 },
];
const GAME_TYPES = [
  { id:'scenario',   name:'Scenario',        icon:'🗺', blurb:'Classic campaign. Choose your scenario and grow the world\'s #1 airline.' },
  { id:'domination', name:'Domination',      icon:'⚔', blurb:'Total conquest — lead all 7 regions while ruthless rivals attack.' },
  { id:'mystery',    name:'Mystery',         icon:'🛰', blurb:'Classified. Era, hub and objective are randomized and revealed in-flight.' },
  { id:'eras',       name:'Eras Campaign',   icon:'🕰', blurb:'1970→2030. Six decades of history — oil shocks, deregulation, booms and busts. Quarterly turns.' },
  { id:'daily',      name:'Daily Challenge', icon:'📅', blurb:'A seeded run that changes daily, with a twist. Chase a high score.' },
];
const MYSTERY_OBJECTIVES = [
  { kind:'value',  target:4000,    hint:'Amass a fortune in the sky…',      desc:'Reach $4,000M company value' },
  { kind:'routes', target:24,      hint:'Spread your wings far and wide…',  desc:'Operate 24 routes at once' },
  { kind:'pax',    target:8000000, hint:'Move the masses…',                 desc:'Carry 8M passengers in a single year' },
  { kind:'hubs',   target:6,       hint:'Plant your flag on every shore…',  desc:'Hold hubs across 6 regions' },
  { kind:'value',  target:6000,    hint:'Build an untouchable empire…',     desc:'Reach $6,000M company value' },
];
const DAILY_TWISTS = [
  { id:'fuel',   name:'Fuel Crisis',  desc:'Fuel costs run +60% for the entire game.' },
  { id:'noloan', name:'No Credit',    desc:'Banks are closed — loans are disabled.' },
  { id:'solo',   name:'Lone Hub',     desc:'No new hubs — your home base is all you get.' },
  { id:'boom',   name:'Boom Times',   desc:'Global tourism is booming (+20% everywhere).' },
  { id:'lean',   name:'Lean Start',   desc:'You begin with half the usual capital.' },
];
const DAILY_OBJECTIVE = { kind:'timed_value', years:5, desc:'Maximize company value within 5 years' };
function seededRng(str){
  let h=1779033703 ^ str.length;
  for(let i=0;i<str.length;i++){ h=Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h<<13 | h>>>19; }
  let a = h>>>0;
  return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
}
function todaySeed(){ return new Date().toISOString().slice(0,10); }
function dailyConfig(){
  const seed = todaySeed(), rnd = seededRng(seed);
  const sc = SCENARIOS[Math.floor(rnd()*SCENARIOS.length)];
  const majors = Object.keys(CITIES).filter(n=>CITIES[n].major);
  const hub = majors[Math.floor(rnd()*majors.length)];
  const twist = DAILY_TWISTS[Math.floor(rnd()*DAILY_TWISTS.length)];
  return { sc, lv: LEVELS[2], hub, twist, seed, objective: {...DAILY_OBJECTIVE} };
}
function configureRun(){
  const t = setupChoice.type;
  if(t==='daily') return { type:t, ...dailyConfig() };
  if(t==='mystery'){
    const sc = SCENARIOS[Math.floor(Math.random()*SCENARIOS.length)];
    const lv = LEVELS[1+Math.floor(Math.random()*(LEVELS.length-1))];
    const majors = Object.keys(CITIES).filter(n=>CITIES[n].major);
    const hub = majors[Math.floor(Math.random()*majors.length)];
    const objective = {...MYSTERY_OBJECTIVES[Math.floor(Math.random()*MYSTERY_OBJECTIVES.length)]};
    return { type:t, sc, lv, hub, twist:null, seed:null, objective };
  }
  if(t==='eras'){
    return { type:t, sc:ERAS_SCENARIO, lv:setupChoice.level, hub:setupChoice.hub, twist:null, seed:null, objective:{kind:'eras', years:60} };
  }
  if(t==='domination'){
    return { type:t, sc:setupChoice.scenario, lv:setupChoice.level, hub:setupChoice.hub, twist:null, seed:null, objective:{kind:'dominate'} };
  }
  return { type:'scenario', sc:setupChoice.scenario, lv:setupChoice.level, hub:setupChoice.hub, twist:null, seed:null, objective:{kind:'scenario'} };
}
function countRegionsLed(){
  let led=0;
  REGIONS.forEach(reg => {
    const myRegPax = STATE.routes.filter(r=>CITIES[r.to]?.region===reg||CITIES[r.from]?.region===reg).reduce((s,r)=>s+(r.pax||0),0) + (typeof regionProjectPax==='function'?regionProjectPax(reg):0);
    const rivalMax = Math.max(0, ...STATE.competitors.filter(c=>c.regionsEntered.includes(reg)).map(c=>c.pax*0.2));
    if (myRegPax > rivalMax && myRegPax > 0) led++;
  });
  return led;
}
function objectiveStatus(){
  const o = STATE.objective || {kind:'scenario'};
  const led = countRegionsLed();
  const hubRegions = new Set(STATE.hubs.map(h=>CITIES[h]?.region)).size;
  const profitable = STATE.profitThisYear > 0;
  const v = STATE.companyValue, routes = STATE.routes.length, pax = STATE.totalPaxYear;
  switch(o.kind){
    case 'dominate':   return { done: led>=7 && hubRegions>=7 && profitable, label:'Dominate all 7 regions', prog:`${led}/7 regions · ${hubRegions}/7 hubs · ${profitable?'profit':'loss'}` };
    case 'value':      return { done: v>=o.target, label:`Reach $${o.target}M value`, prog:`$${v}M / $${o.target}M` };
    case 'routes':     return { done: routes>=o.target, label:`Operate ${o.target} routes`, prog:`${routes}/${o.target} routes` };
    case 'pax':        return { done: pax>=o.target, label:`Carry ${(o.target/1e6)}M pass/yr`, prog:`${(pax/1e6).toFixed(1)}M / ${(o.target/1e6)}M pass` };
    case 'hubs':       return { done: hubRegions>=o.target, label:`Hold ${o.target} hub regions`, prog:`${hubRegions}/${o.target} regions` };
    case 'timed_value':return { timed:true, done:false, label:`Max value by year ${o.years}`, prog:`$${v}M · year ${STATE.yearsElapsed}/${o.years}` };
    case 'eras':       return { timed:true, done:false, label:'Build your legacy — 1970 to 2030', prog:`$${v}M · ${STATE.year} / 2030` };
    default:           return { done: led>=STATE.level.regions && hubRegions>=7 && profitable, label:`Lead ${STATE.level.regions} regions + 7 hubs`, prog:`${led}/${STATE.level.regions} regions · ${hubRegions}/7 hubs · ${profitable?'profit':'loss'}` };
  }
}
const CITIES = {
  'Chicago':{x:518.3,y:270.0,lat:41.88,lon:-87.63,abbr:'ORD',region:'N America',pop:7.0,econ:80,tourism:55,slots:120,major:true,level:5,fulfill:50},
  'Minneapolis':{x:486.7,y:252.6,lat:44.98,lon:-93.27,abbr:'MSP',region:'N America',pop:2.0,econ:72,tourism:48,slots:80,major:false,level:3,fulfill:50},
  'New York':{x:594.8,y:276.6,lat:40.71,lon:-74.0,abbr:'JFK',region:'N America',pop:8.5,econ:90,tourism:80,slots:160,major:true,level:6,fulfill:50},
  'Los Angeles':{x:346.5,y:313.9,lat:34.05,lon:-118.24,abbr:'LAX',region:'N America',pop:6.8,econ:75,tourism:70,slots:140,major:true,level:5,fulfill:50},
  'Atlanta':{x:536.5,y:315.6,lat:33.75,lon:-84.39,abbr:'ATL',region:'N America',pop:3.2,econ:65,tourism:45,slots:100,major:true,level:4,fulfill:50},
  'Dallas':{x:466.8,y:321.1,lat:32.78,lon:-96.8,abbr:'DFW',region:'N America',pop:4.1,econ:70,tourism:40,slots:90,major:true,level:4,fulfill:50},
  'Seattle':{x:323.6,y:237.9,lat:47.61,lon:-122.33,abbr:'SEA',region:'N America',pop:1.8,econ:60,tourism:55,slots:70,major:false,level:3,fulfill:50},
  'Miami':{x:559.9,y:360.3,lat:25.78,lon:-80.22,abbr:'MIA',region:'N America',pop:2.5,econ:60,tourism:75,slots:80,major:false,level:4,fulfill:50},
  'Toronto':{x:564.6,y:260.1,lat:43.65,lon:-79.38,abbr:'YYZ',region:'N America',pop:3.1,econ:68,tourism:50,slots:85,major:false,level:4,fulfill:50},
  'Honolulu':{x:124.2,y:385.4,lat:21.31,lon:-157.86,abbr:'HNL',region:'N America',pop:0.9,econ:55,tourism:88,slots:60,major:false,level:3,fulfill:50},
  'Boston'       :{x:611.3,y:267.3,lat:42.36,lon:-71.06, abbr:'BOS',region:'N America',pop:2.8,econ:88,tourism:62,slots:85, major:true, level:4,fulfill:50},
  'Washington DC':{x:577.7,y:286.7,lat:38.91,lon:-77.04, abbr:'IAD',region:'N America',pop:3.5,econ:85,tourism:65,slots:90, major:true, level:4,fulfill:50},
  'Philadelphia' :{x:588.2,y:280.8,lat:39.95,lon:-75.17, abbr:'PHL',region:'N America',pop:2.9,econ:78,tourism:52,slots:80, major:false,level:3,fulfill:50},
  'Pittsburgh'   :{x:561.2,y:278.1,lat:40.44,lon:-79.99, abbr:'PIT',region:'N America',pop:1.2,econ:70,tourism:40,slots:60, major:false,level:2,fulfill:50},
  'Charlotte'    :{x:556.4,y:307.3,lat:35.23,lon:-80.84, abbr:'CLT',region:'N America',pop:1.5,econ:68,tourism:42,slots:75, major:false,level:3,fulfill:50},
  'Orlando'      :{x:553.4,y:344.9,lat:28.54,lon:-81.38, abbr:'MCO',region:'N America',pop:1.4,econ:60,tourism:90,slots:80, major:false,level:3,fulfill:50},
  'Tampa'        :{x:547.3,y:348.1,lat:27.97,lon:-82.46, abbr:'TPA',region:'N America',pop:1.2,econ:58,tourism:68,slots:65, major:false,level:2,fulfill:50},
  'New Orleans'  :{x:504.6,y:336.9,lat:29.95,lon:-90.08, abbr:'MSY',region:'N America',pop:1.0,econ:52,tourism:80,slots:60, major:false,level:2,fulfill:50},
  'Nashville'    :{x:523.1,y:302.0,lat:36.17,lon:-86.78, abbr:'BNA',region:'N America',pop:1.2,econ:65,tourism:58,slots:65, major:false,level:2,fulfill:50},
  'Detroit'      :{x:544.0,y:267.5,lat:42.33,lon:-83.05, abbr:'DTW',region:'N America',pop:2.0,econ:65,tourism:38,slots:75, major:false,level:3,fulfill:50},
  'Denver'       :{x:420.9,y:282.0,lat:39.74,lon:-104.98,abbr:'DEN',region:'N America',pop:2.2,econ:70,tourism:58,slots:85, major:true, level:4,fulfill:50},
  'Billings'        :{x:400.9,y:248.0,lat:45.79,lon:-108.54,abbr:'BIL',region:'N America',pop:0.20,econ:52,tourism:55,slots:45,major:false,level:2,fulfill:50},
  'Bismarck'        :{x:444.4,y:242.3,lat:46.81,lon:-100.78,abbr:'BIS',region:'N America',pop:0.13,econ:50,tourism:32,slots:42,major:false,level:2,fulfill:50},
  'Rapid City'      :{x:430.7,y:257.6,lat:44.08,lon:-103.23,abbr:'RAP',region:'N America',pop:0.15,econ:48,tourism:72,slots:48,major:false,level:3,fulfill:50},
  'Casper'          :{x:413.3,y:264.5,lat:42.85,lon:-106.32,abbr:'CPR',region:'N America',pop:0.08,econ:50,tourism:38,slots:38,major:false,level:1,fulfill:50},
  'Cheyenne'        :{x:421.8,y:274.1,lat:41.14,lon:-104.82,abbr:'CYS',region:'N America',pop:0.10,econ:48,tourism:40,slots:40,major:false,level:2,fulfill:50},
  'North Platte'    :{x:444.5,y:274.2,lat:41.13,lon:-100.77,abbr:'LBF',region:'N America',pop:0.05,econ:42,tourism:28,slots:34,major:false,level:1,fulfill:50},
  'Colorado Springs':{x:421.8,y:287.0,lat:38.83,lon:-104.82,abbr:'COS',region:'N America',pop:0.75,econ:58,tourism:66,slots:60,major:false,level:3,fulfill:50},
  'Amarillo'        :{x:438.5,y:307.3,lat:35.22,lon:-101.83,abbr:'AMA',region:'N America',pop:0.27,econ:50,tourism:35,slots:45,major:false,level:2,fulfill:50},
  'Lubbock'         :{x:438.4,y:316.5,lat:33.58,lon:-101.86,abbr:'LBB',region:'N America',pop:0.32,econ:52,tourism:38,slots:48,major:false,level:2,fulfill:50},
  'Tulsa'           :{x:471.3,y:302.1,lat:36.15,lon:-95.99, abbr:'TUL',region:'N America',pop:1.00,econ:58,tourism:45,slots:62,major:false,level:3,fulfill:50},
  'El Paso'         :{x:412.4,y:326.7,lat:31.76,lon:-106.49,abbr:'ELP',region:'N America',pop:0.87,econ:55,tourism:48,slots:60,major:false,level:3,fulfill:50},
  'Kansas City'  :{x:479.3,y:285.6,lat:39.10,lon:-94.58, abbr:'MCI',region:'N America',pop:1.0,econ:62,tourism:38,slots:55, major:false,level:2,fulfill:50},
  'St Louis'     :{x:503.9,y:288.2,lat:38.63,lon:-90.19, abbr:'STL',region:'N America',pop:1.4,econ:64,tourism:42,slots:65, major:false,level:2,fulfill:50},
  'Cincinnati'   :{x:535.7,y:285.6,lat:39.10,lon:-84.52, abbr:'CVG',region:'N America',pop:1.1,econ:66,tourism:38,slots:60, major:false,level:2,fulfill:50},
  'Phoenix'      :{x:381.2,y:317.3,lat:33.45,lon:-112.07,abbr:'PHX',region:'N America',pop:3.0,econ:65,tourism:52,slots:85, major:true, level:4,fulfill:50},
  'Las Vegas'    :{x:363.9,y:302.0,lat:36.17,lon:-115.14,abbr:'LAS',region:'N America',pop:1.8,econ:60,tourism:95,slots:80, major:false,level:3,fulfill:50},
  'San Antonio'  :{x:457.4,y:339.9,lat:29.42,lon:-98.49, abbr:'SAT',region:'N America',pop:1.5,econ:58,tourism:50,slots:60, major:false,level:2,fulfill:50},
  'Houston'      :{x:474.9,y:338.0,lat:29.76,lon:-95.37, abbr:'IAH',region:'N America',pop:3.5,econ:68,tourism:45,slots:90, major:true, level:4,fulfill:50},
  'Salt Lake City':{x:382.2,y:276.3,lat:40.76,lon:-111.89,abbr:'SLC',region:'N America',pop:0.8,econ:62,tourism:55,slots:60, major:false,level:2,fulfill:50},
  'San Francisco':{x:323.3,y:293.9,lat:37.62,lon:-122.38,abbr:'SFO',region:'N America',pop:3.5,econ:88,tourism:75,slots:100,major:true, level:5,fulfill:50},
  'Portland'     :{x:322.1,y:249.2,lat:45.59,lon:-122.60,abbr:'PDX',region:'N America',pop:1.2,econ:68,tourism:58,slots:65, major:false,level:2,fulfill:50},
  'San Diego'    :{x:352.4,y:321.3,lat:32.73,lon:-117.19,abbr:'SAN',region:'N America',pop:1.8,econ:70,tourism:72,slots:70, major:false,level:2,fulfill:50},
  'Anchorage'    :{x:168.9,y:161.5,lat:61.22,lon:-149.90,abbr:'ANC',region:'N America',pop:0.4,econ:55,tourism:60,slots:45, major:false,level:2,fulfill:50},
  'Vancouver'    :{x:318.8,y:229.0,lat:49.19,lon:-123.18,abbr:'YVR',region:'N America',pop:1.5,econ:75,tourism:68,slots:75, major:true, level:3,fulfill:50},
  'Montreal'     :{x:596.2,y:249.9,lat:45.47,lon:-73.74, abbr:'YUL',region:'N America',pop:2.0,econ:70,tourism:62,slots:80, major:true, level:3,fulfill:50},
  'Calgary'      :{x:370.2,y:218.1,lat:51.13,lon:-114.02,abbr:'YYC',region:'N America',pop:1.0,econ:72,tourism:55,slots:60, major:false,level:2,fulfill:50},
  'Mexico City':{x:453.8,y:396.0,lat:19.43,lon:-99.13,abbr:'MEX',region:'S America',pop:9.0,econ:55,tourism:60,slots:90,major:true,level:4,fulfill:50},
  'Sao Paulo':{x:748.4,y:637.1,lat:-23.55,lon:-46.63,abbr:'GRU',region:'S America',pop:10.0,econ:60,tourism:50,slots:100,major:true,level:4,fulfill:50},
  'Lima':{x:577.7,y:572.6,lat:-12.05,lon:-77.04,abbr:'LIM',region:'S America',pop:4.5,econ:42,tourism:55,slots:65,major:false,level:3,fulfill:50},
  'Buenos Aires':{x:682.4,y:699.1,lat:-34.6,lon:-58.38,abbr:'EZE',region:'S America',pop:5.5,econ:55,tourism:58,slots:80,major:false,level:3,fulfill:50},
  'Bogota'      :{x:594.4,y:478.6,lat:4.71, lon:-74.07,abbr:'BOG',region:'S America',pop:4.2,econ:48,tourism:45,slots:70,major:true, level:3,fulfill:50},
  'Santiago'    :{x:613.5,y:692.7,lat:-33.45,lon:-70.67,abbr:'SCL',region:'S America',pop:3.5,econ:58,tourism:55,slots:70,major:true, level:3,fulfill:50},
  'Rio de Janeiro':{x:767.8,y:633.5,lat:-22.9,lon:-43.17,abbr:'GIG',region:'S America',pop:6.7,econ:55,tourism:72,slots:85,major:true, level:4,fulfill:50},
  'Caracas'     :{x:634.7,y:446.1,lat:10.49,lon:-66.88,abbr:'CCS',region:'S America',pop:2.9,econ:42,tourism:35,slots:55,major:false,level:3,fulfill:50},
  'Riyadh'      :{x:1272.2,y:366.5,lat:24.69,lon:46.72, abbr:'RUH',region:'Mid East',pop:3.5,econ:62,tourism:38,slots:90,major:true, level:4,fulfill:50},
  'Istanbul'    :{x:1172.5,y:274.9,lat:41.01,lon:28.96, abbr:'IST',region:'Mid East',pop:7.5,econ:65,tourism:75,slots:130,major:true, level:5,fulfill:50},
  'Karachi'     :{x:1386.0,y:365.5,lat:24.86,lon:67.01, abbr:'KHI',region:'Mid East',pop:5.0,econ:38,tourism:28,slots:65,major:false,level:3,fulfill:50},
  'Mumbai'      :{x:1418.9,y:397.9,lat:19.08,lon:72.88, abbr:'BOM',region:'Mid East',pop:7.0,econ:52,tourism:62,slots:100,major:true, level:4,fulfill:50},
  'Casablanca'  :{x:967.3, y:316.5,lat:33.59,lon:-7.61, abbr:'CMN',region:'Africa',pop:2.5,econ:48,tourism:58,slots:65,major:true, level:3,fulfill:50},
  'Addis Ababa' :{x:1227.4,y:454.3,lat:9.03, lon:38.74, abbr:'ADD',region:'Africa',pop:2.8,econ:35,tourism:42,slots:55,major:false,level:3,fulfill:50},
  'Accra'       :{x:1008.9,y:473.8,lat:5.56, lon:-0.2,  abbr:'ACC',region:'Africa',pop:2.1,econ:42,tourism:40,slots:50,major:false,level:3,fulfill:50},
  'Dar es Salaam':{x:1230.0,y:543.1,lat:-6.79,lon:39.21,abbr:'DAR',region:'Africa',pop:2.0,econ:33,tourism:38,slots:45,major:false,level:2,fulfill:50},
  'Cape Town'   :{x:1113.4,y:695.4,lat:-33.93,lon:18.42,abbr:'CPT',region:'Africa',pop:2.2,econ:55,tourism:72,slots:65,major:true, level:3,fulfill:50},
  'Brisbane'    :{x:1868.6,y:659.1,lat:-27.47,lon:153.02,abbr:'BNE',region:'Oceania',pop:1.8,econ:68,tourism:65,slots:70,major:true, level:3,fulfill:50},
  'Christchurch':{x:1978.6,y:749.3,lat:-43.53,lon:172.62,abbr:'CHC',region:'Oceania',pop:0.8,econ:60,tourism:62,slots:45,major:false,level:2,fulfill:50},
  'Nadi'        :{x:2005.6,y:604.6,lat:-17.75,lon:177.44,abbr:'NAN',region:'Oceania',pop:0.5,econ:45,tourism:75,slots:40,major:false,level:2,fulfill:50},
  'Port Moresby':{x:1836.1,y:558.0,lat:-9.44, lon:147.22,abbr:'POM',region:'Oceania',pop:0.7,econ:32,tourism:35,slots:35,major:false,level:2,fulfill:50},
  'Kuala Lumpur':{x:1580.6,y:487.4,lat:3.14, lon:101.69,abbr:'KUL',region:'SE Asia',pop:3.5,econ:62,tourism:68,slots:95,major:true, level:4,fulfill:50},
  'Manila'      :{x:1688.8,y:423.1,lat:14.59,lon:120.98,abbr:'MNL',region:'SE Asia',pop:5.0,econ:48,tourism:58,slots:80,major:true, level:4,fulfill:50},
  'Jakarta'     :{x:1609.5,y:539.8,lat:-6.21,lon:106.85,abbr:'CGK',region:'SE Asia',pop:6.5,econ:45,tourism:52,slots:85,major:true, level:4,fulfill:50},
  'Shanghai'    :{x:1691.6,y:329.8,lat:31.23,lon:121.48,abbr:'PVG',region:'SE Asia',pop:8.5,econ:72,tourism:65,slots:140,major:true, level:5,fulfill:50},
  'London'      :{x:1009.3,y:216.0,lat:51.51,lon:-0.13, abbr:'LHR',region:'Europe',pop:9.0, econ:90,tourism:88,slots:200,major:true, level:6,fulfill:50},
  'Munich'      :{x:1075.0,y:234.9,lat:48.14,lon:11.58, abbr:'MUC',region:'Europe',pop:2.0, econ:88,tourism:75,slots:110,major:true, level:4,fulfill:50},
  'Brussels'    :{x:1034.4,y:219.7,lat:50.85,lon:4.35,  abbr:'BRU',region:'Europe',pop:1.2, econ:85,tourism:68,slots:90, major:true, level:4,fulfill:50},
  'Copenhagen'  :{x:1080.5,y:192.6,lat:55.68,lon:12.57, abbr:'CPH',region:'Europe',pop:1.3, econ:88,tourism:72,slots:90, major:true, level:4,fulfill:50},
  'Stockholm'   :{x:1111.4,y:172.1,lat:59.33,lon:18.07, abbr:'ARN',region:'Europe',pop:1.5, econ:90,tourism:70,slots:95, major:true, level:4,fulfill:50},
  'Oslo'        :{x:1070.3,y:168.8,lat:59.91,lon:10.75, abbr:'OSL',region:'Europe',pop:1.0, econ:92,tourism:65,slots:80, major:false,level:3,fulfill:50},
  'Helsinki'    :{x:1150.1,y:166.5,lat:60.32,lon:24.97, abbr:'HEL',region:'Europe',pop:0.8, econ:88,tourism:60,slots:75, major:false,level:3,fulfill:50},
  'Lisbon'      :{x:958.7, y:287.7,lat:38.72,lon:-9.14, abbr:'LIS',region:'Europe',pop:1.5, econ:70,tourism:82,slots:80, major:true, level:3,fulfill:50},
  'Dublin'      :{x:974.9, y:205.6,lat:53.35,lon:-6.26, abbr:'DUB',region:'Europe',pop:1.2, econ:85,tourism:75,slots:80, major:true, level:3,fulfill:50},
  'Warsaw'      :{x:1127.9,y:211.9,lat:52.23,lon:21.01, abbr:'WAW',region:'Europe',pop:1.8, econ:72,tourism:62,slots:80, major:false,level:3,fulfill:50},
  'Prague'      :{x:1091.0,y:224.0,lat:50.08,lon:14.44, abbr:'PRG',region:'Europe',pop:1.3, econ:75,tourism:80,slots:75, major:false,level:3,fulfill:50},
  'Budapest'    :{x:1116.8,y:238.5,lat:47.50,lon:19.04, abbr:'BUD',region:'Europe',pop:1.1, econ:68,tourism:78,slots:70, major:false,level:3,fulfill:50},
  'Bucharest'   :{x:1156.5,y:255.7,lat:44.43,lon:26.10, abbr:'OTP',region:'Europe',pop:1.8, econ:58,tourism:55,slots:70, major:false,level:3,fulfill:50},
  'Kiev'        :{x:1181.3,y:221.9,lat:50.45,lon:30.52, abbr:'KBP',region:'Europe',pop:2.9, econ:52,tourism:50,slots:75, major:false,level:3,fulfill:50},
  'Milan'       :{x:1061.6,y:249.9,lat:45.47,lon:9.19,  abbr:'MXP',region:'Europe',pop:3.2, econ:82,tourism:80,slots:105,major:true, level:4,fulfill:50},
  'Doha'        :{x:1299.1,y:363.1,lat:25.29,lon:51.53, abbr:'DOH',region:'Mid East',pop:0.8,econ:68,tourism:60,slots:120,major:true, level:5,fulfill:50},
  'Abu Dhabi'   :{x:1315.1,y:367.8,lat:24.46,lon:54.37, abbr:'AUH',region:'Mid East',pop:0.9,econ:65,tourism:58,slots:100,major:true, level:4,fulfill:50},
  'Muscat'      :{x:1338.8,y:372.6,lat:23.59,lon:58.59, abbr:'MCT',region:'Mid East',pop:0.8,econ:62,tourism:55,slots:75, major:false,level:3,fulfill:50},
  'Amman'       :{x:1211.6,y:325.7,lat:31.95,lon:35.93, abbr:'AMM',region:'Mid East',pop:2.2,econ:55,tourism:58,slots:75, major:false,level:3,fulfill:50},
  'Tel Aviv'    :{x:1205.7,y:325.4,lat:32.01,lon:34.87, abbr:'TLV',region:'Mid East',pop:1.0,econ:80,tourism:72,slots:80, major:true, level:4,fulfill:50},
  'Beirut'      :{x:1209.1,y:314.8,lat:33.89,lon:35.49, abbr:'BEY',region:'Mid East',pop:1.0,econ:58,tourism:55,slots:60, major:false,level:3,fulfill:50},
  'Bangalore'   :{x:1445.4,y:432.2,lat:12.97,lon:77.59, abbr:'BLR',region:'SE Asia',pop:4.0,econ:55,tourism:45,slots:85, major:true, level:4,fulfill:50},
  'Chennai'     :{x:1460.4,y:431.6,lat:13.08,lon:80.27, abbr:'MAA',region:'SE Asia',pop:3.5,econ:50,tourism:48,slots:75, major:false,level:3,fulfill:50},
  'Colombo'     :{x:1458.1,y:466.3,lat:6.90, lon:79.86, abbr:'CMB',region:'SE Asia',pop:0.8,econ:42,tourism:62,slots:65, major:false,level:3,fulfill:50},
  'Dhaka'       :{x:1517.1,y:371.8,lat:23.73,lon:90.38, abbr:'DAC',region:'SE Asia',pop:5.0,econ:35,tourism:30,slots:60, major:false,level:3,fulfill:50},
  'Kathmandu'   :{x:1489.0,y:349.6,lat:27.70,lon:85.36, abbr:'KTM',region:'SE Asia',pop:1.0,econ:30,tourism:65,slots:45, major:false,level:2,fulfill:50},
  'Islamabad'   :{x:1419.9,y:315.8,lat:33.72,lon:73.05, abbr:'ISB',region:'SE Asia',pop:1.2,econ:38,tourism:35,slots:55, major:false,level:3,fulfill:50},
  'Lahore'      :{x:1427.1,y:327.9,lat:31.56,lon:74.34, abbr:'LHE',region:'SE Asia',pop:3.5,econ:36,tourism:32,slots:60, major:false,level:3,fulfill:50},
  'Kuwait City' :{x:1279.2,y:340.2,lat:29.37,lon:47.98, abbr:'KWI',region:'Mid East',pop:0.9,econ:60,tourism:38,slots:65, major:false,level:3,fulfill:50},
  'Bahrain'     :{x:1293.8,y:357.9,lat:26.21,lon:50.58, abbr:'BAH',region:'Mid East',pop:0.5,econ:62,tourism:42,slots:55, major:false,level:2,fulfill:50},
  'Guangzhou'   :{x:1645.5,y:375.2,lat:23.13,lon:113.26,abbr:'CAN',region:'SE Asia',pop:7.5, econ:68,tourism:55,slots:125,major:true, level:5,fulfill:50},
  'Chengdu'     :{x:1593.9,y:333.5,lat:30.57,lon:104.07,abbr:'CTU',region:'SE Asia',pop:5.0, econ:60,tourism:55,slots:95, major:true, level:4,fulfill:50},
  'Osaka'       :{x:1770.2,y:310.4,lat:34.69,lon:135.49,abbr:'KIX',region:'SE Asia',pop:4.2, econ:82,tourism:78,slots:110,major:true, level:4,fulfill:50},
  'Taipei'      :{x:1690.2,y:364.3,lat:25.08,lon:121.22,abbr:'TPE',region:'SE Asia',pop:3.8, econ:80,tourism:72,slots:110,major:true, level:4,fulfill:50},
  'Ho Chi Minh' :{x:1608.5,y:444.3,lat:10.82,lon:106.66,abbr:'SGN',region:'SE Asia',pop:4.5, econ:48,tourism:62,slots:85, major:true, level:4,fulfill:50},
  'Hanoi'       :{x:1603.9,y:387.0,lat:21.03,lon:105.84,abbr:'HAN',region:'SE Asia',pop:2.5, econ:45,tourism:55,slots:70, major:false,level:3,fulfill:50},
  'Yangon'      :{x:1549.4,y:410.3,lat:16.87,lon:96.13, abbr:'RGN',region:'SE Asia',pop:2.0, econ:35,tourism:45,slots:55, major:false,level:2,fulfill:50},
  'Denpasar'    :{x:1656.2,y:554.1,lat:-8.75,lon:115.17,abbr:'DPS',region:'SE Asia',pop:0.5, econ:40,tourism:88,slots:70, major:false,level:3,fulfill:50},
  'Phnom Penh'  :{x:1598.7,y:440.1,lat:11.57,lon:104.92,abbr:'PNH',region:'SE Asia',pop:1.0, econ:35,tourism:48,slots:45, major:false,level:2,fulfill:50},
  'Ulaanbaatar' :{x:1609.7,y:236.2,lat:47.90,lon:106.88,abbr:'ULN',region:'SE Asia',pop:0.8, econ:42,tourism:45,slots:40, major:false,level:2,fulfill:50},
  'Algiers'     :{x:1027.2,y:298.8,lat:36.74,lon:3.06,  abbr:'ALG',region:'Africa',pop:2.5, econ:52,tourism:42,slots:65, major:false,level:3,fulfill:50},
  'Dakar'       :{x:912.0, y:422.4,lat:14.72,lon:-17.47,abbr:'DKR',region:'Africa',pop:1.5, econ:42,tourism:48,slots:55, major:false,level:3,fulfill:50},
  'Abidjan'     :{x:987.5, y:475.0,lat:5.35, lon:-4.01, abbr:'ABJ',region:'Africa',pop:2.0, econ:44,tourism:38,slots:55, major:false,level:3,fulfill:50},
  'Kinshasa'    :{x:1096.0,y:529.2,lat:-4.32,lon:15.32, abbr:'FIH',region:'Africa',pop:4.5, econ:30,tourism:25,slots:50, major:false,level:2,fulfill:50},
  'Luanda'      :{x:1084.2,y:554.6,lat:-8.84,lon:13.23, abbr:'LAD',region:'Africa',pop:2.5, econ:48,tourism:30,slots:55, major:false,level:3,fulfill:50},
  'Harare'      :{x:1184.2,y:605.0,lat:-17.83,lon:31.05,abbr:'HRE',region:'Africa',pop:1.5, econ:38,tourism:42,slots:50, major:false,level:2,fulfill:50},
  'Maputo'      :{x:1192.9,y:650.7,lat:-25.97,lon:32.59,abbr:'MPM',region:'Africa',pop:1.1, econ:40,tourism:38,slots:45, major:false,level:2,fulfill:50},
  'Khartoum'    :{x:1192.5,y:417.7,lat:15.55,lon:32.53, abbr:'KRT',region:'Africa',pop:2.0, econ:32,tourism:28,slots:45, major:false,level:2,fulfill:50},
  'Entebbe'     :{x:1192.0,y:504.8,lat:0.04, lon:32.44, abbr:'EBB',region:'Africa',pop:0.8, econ:36,tourism:45,slots:45, major:false,level:2,fulfill:50},
  'Douala'      :{x:1064.5,y:482.5,lat:4.01, lon:9.71,  abbr:'DLA',region:'Africa',pop:1.5, econ:38,tourism:30,slots:45, major:false,level:2,fulfill:50},
  'Mauritius'   :{x:1332.6,y:618.1,lat:-20.16,lon:57.5,abbr:'MRU',region:'Africa',pop:0.4, econ:52,tourism:85,slots:40, major:false,level:2,fulfill:50},
  'Medellín'    :{x:586.0, y:470.0,lat:6.23, lon:-75.57,abbr:'MDE',region:'S America',pop:2.5,econ:48,tourism:50,slots:60, major:false,level:3,fulfill:50},
  'Guayaquil'   :{x:561.8, y:517.3,lat:-2.19,lon:-79.88,abbr:'GYE',region:'S America',pop:2.0,econ:42,tourism:40,slots:50, major:false,level:2,fulfill:50},
  'Quito'       :{x:569.5, y:506.2,lat:-0.22,lon:-78.51,abbr:'UIO',region:'S America',pop:1.5,econ:44,tourism:55,slots:50, major:false,level:2,fulfill:50},
  'Montevideo'  :{x:694.6, y:700.4,lat:-34.82,lon:-56.21,abbr:'MVD',region:'S America',pop:1.0,econ:58,tourism:50,slots:45, major:false,level:2,fulfill:50},
  'La Paz'      :{x:627.4, y:597.7,lat:-16.52,lon:-68.19,abbr:'LPB',region:'S America',pop:1.1,econ:38,tourism:52,slots:40, major:false,level:2,fulfill:50},
  'Recife'      :{x:814.3, y:550.2,lat:-8.06, lon:-34.88,abbr:'REC',region:'S America',pop:2.0,econ:42,tourism:50,slots:50, major:false,level:2,fulfill:50},
  'Fortaleza'   :{x:793.7, y:525.9,lat:-3.72, lon:-38.54,abbr:'FOR',region:'S America',pop:1.8,econ:40,tourism:55,slots:50, major:false,level:2,fulfill:50},
  'Papeete'     :{x:170.7, y:603.5,lat:-17.55,lon:-149.57,abbr:'PPT',region:'Oceania',pop:0.3,econ:55,tourism:85,slots:40, major:false,level:2,fulfill:50},
  'Noumea'      :{x:1943.9,y:629.9,lat:-22.26,lon:166.44,abbr:'NOU',region:'Oceania',pop:0.2,econ:60,tourism:78,slots:35, major:false,level:2,fulfill:50},
  'Frankfurt':{x:1058.7,y:223.8,lat:50.11,lon:8.68,abbr:'FRA',region:'Europe',pop:3.0,econ:82,tourism:60,slots:130,major:true,level:4,fulfill:50},
  'Amsterdam':{x:1037.5,y:211.1,lat:52.37,lon:4.9,abbr:'AMS',region:'Europe',pop:2.0,econ:80,tourism:72,slots:120,major:true,level:4,fulfill:50},
  'Rome':{x:1080.1,y:269.9,lat:41.9,lon:12.5,abbr:'FCO',region:'Europe',pop:4.0,econ:70,tourism:88,slots:110,major:true,level:4,fulfill:50},
  'Moscow':{x:1221.1,y:192.1,lat:55.76,lon:37.62,abbr:'SVO',region:'Europe',pop:8.5,econ:65,tourism:55,slots:120,major:true,level:5,fulfill:50},
  'Madrid':{x:989.2,y:278.2,lat:40.42,lon:-3.7,abbr:'MAD',region:'Europe',pop:4.5,econ:68,tourism:78,slots:100,major:false,level:4,fulfill:50},
  'Zurich'      :{x:1057.9,y:239.1,lat:47.38,lon:8.54, abbr:'ZRH',region:'Europe',pop:1.0,econ:90,tourism:72,slots:90, major:true, level:4,fulfill:50},
  'Vienna'      :{x:1101.9,y:234.5,lat:48.21,lon:16.37,abbr:'VIE',region:'Europe',pop:1.9,econ:80,tourism:76,slots:100,major:true, level:4,fulfill:50},
  'Barcelona'   :{x:1022.1,y:272.8,lat:41.39,lon:2.16, abbr:'BCN',region:'Europe',pop:2.8,econ:72,tourism:88,slots:95, major:true, level:4,fulfill:50},
  'Athens'      :{x:1143.2,y:291.9,lat:37.98,lon:23.73,abbr:'ATH',region:'Europe',pop:2.0,econ:60,tourism:82,slots:80, major:true, level:3,fulfill:50},
  'Cairo':{x:1185.3,y:336.4,lat:30.04,lon:31.24,abbr:'CAI',region:'Africa',pop:7.5,econ:50,tourism:70,slots:90,major:true,level:4,fulfill:50},
  'Tunis':{x:1067.1,y:298.5,lat:36.81,lon:10.18,abbr:'TUN',region:'Africa',pop:1.5,econ:45,tourism:55,slots:55,major:true,level:3,fulfill:50},
  'Nairobi':{x:1216.6,y:512.2,lat:-1.29,lon:36.82,abbr:'NBO',region:'Africa',pop:2.5,econ:40,tourism:60,slots:60,major:false,level:3,fulfill:50},
  'Lagos':{x:1029.0,y:468.4,lat:6.52,lon:3.38,abbr:'LOS',region:'Africa',pop:5.0,econ:38,tourism:30,slots:55,major:false,level:3,fulfill:50},
  'Johannesburg':{x:1167.4,y:652.0,lat:-26.2,lon:28.05,abbr:'JNB',region:'Africa',pop:3.0,econ:52,tourism:48,slots:70,major:false,level:3,fulfill:50},
  'Baghdad':{x:1258.9,y:318.1,lat:33.31,lon:44.36,abbr:'BGW',region:'Mid East',pop:4.5,econ:52,tourism:30,slots:80,major:true,level:3,fulfill:50},
  'Tehran':{x:1298.4,y:304.7,lat:35.69,lon:51.39,abbr:'IKA',region:'Mid East',pop:4.8,econ:48,tourism:35,slots:70,major:true,level:3,fulfill:50},
  'New Delhi':{x:1443.2,y:344.5,lat:28.61,lon:77.21,abbr:'DEL',region:'Mid East',pop:5.0,econ:45,tourism:60,slots:85,major:true,level:4,fulfill:50},
  'Dubai':{x:1320.1,y:363.6,lat:25.2,lon:55.27,abbr:'DXB',region:'Mid East',pop:1.0,econ:58,tourism:65,slots:75,major:false,level:5,fulfill:50},
  'Tokyo':{x:1793.8,y:304.8,lat:35.68,lon:139.69,abbr:'NRT',region:'SE Asia',pop:12.0,econ:85,tourism:75,slots:170,major:true,level:6,fulfill:50},
  'Beijing':{x:1663.1,y:281.1,lat:39.9,lon:116.4,abbr:'PEK',region:'SE Asia',pop:7.0,econ:68,tourism:65,slots:120,major:true,level:5,fulfill:50},
  'Hong Kong':{x:1650.6,y:379.8,lat:22.32,lon:114.17,abbr:'HKG',region:'SE Asia',pop:4.5,econ:82,tourism:78,slots:130,major:true,level:5,fulfill:50},
  'Bangkok':{x:1573.9,y:427.8,lat:13.76,lon:100.5,abbr:'BKK',region:'SE Asia',pop:5.0,econ:55,tourism:80,slots:100,major:true,level:4,fulfill:50},
  'Singapore':{x:1592.5,y:497.4,lat:1.35,lon:103.82,abbr:'SIN',region:'SE Asia',pop:2.2,econ:78,tourism:72,slots:110,major:true,level:5,fulfill:50},
  'Seoul':{x:1722.5,y:294.2,lat:37.57,lon:126.98,abbr:'ICN',region:'SE Asia',pop:7.0,econ:72,tourism:60,slots:110,major:false,level:5,fulfill:50},
  'Sydney':{x:1858.5,y:695.0,lat:-33.87,lon:151.21,abbr:'SYD',region:'Oceania',pop:3.2,econ:75,tourism:80,slots:110,major:true,level:5,fulfill:50},
  'Melbourne':{x:1823.4,y:717.2,lat:-37.81,lon:144.96,abbr:'MEL',region:'Oceania',pop:2.8,econ:70,tourism:70,slots:90,major:false,level:4,fulfill:50},
  'Auckland':{x:1990.6,y:711.8,lat:-36.85,lon:174.76,abbr:'AKL',region:'Oceania',pop:1.1,econ:65,tourism:68,slots:60,major:true,level:3,fulfill:50},
  'Perth':{x:1660.1,y:684.3,lat:-31.95,lon:115.86,abbr:'PER',region:'Oceania',pop:1.5,econ:62,tourism:60,slots:65,major:true,level:3,fulfill:50},
  'Birmingham':{x:523.2,y:316.7,lat:33.55,lon:-86.75,abbr:'BHM',region:'N America',pop:0.7,econ:58,tourism:38,slots:45,major:false,level:2,fulfill:50},
  'Little Rock':{x:492.5,y:310.1,lat:34.73,lon:-92.23,abbr:'LIT',region:'N America',pop:0.5,econ:52,tourism:40,slots:40,major:false,level:2,fulfill:50},
  'Boise':{x:357.9,y:260.5,lat:43.57,lon:-116.22,abbr:'BOI',region:'N America',pop:0.4,econ:55,tourism:52,slots:40,major:false,level:2,fulfill:50},
  'Indianapolis':{x:525.9,y:282.1,lat:39.72,lon:-86.28,abbr:'IND',region:'N America',pop:1.0,econ:62,tourism:42,slots:55,major:false,level:3,fulfill:50},
  'Des Moines':{x:484.5,y:272.0,lat:41.53,lon:-93.65,abbr:'DSM',region:'N America',pop:0.5,econ:62,tourism:38,slots:40,major:false,level:2,fulfill:50},
  'Wichita':{x:463.3,y:293.7,lat:37.65,lon:-97.43,abbr:'ICT',region:'N America',pop:0.4,econ:58,tourism:35,slots:38,major:false,level:2,fulfill:50},
  'Louisville':{x:528.9,y:290.8,lat:38.17,lon:-85.74,abbr:'SDF',region:'N America',pop:0.6,econ:60,tourism:42,slots:42,major:false,level:2,fulfill:50},
  'Baltimore':{x:579.8,y:285.2,lat:39.17,lon:-76.67,abbr:'BWI',region:'N America',pop:1.5,econ:72,tourism:55,slots:65,major:false,level:3,fulfill:50},
  'Jackson MS':{x:504.6,y:323.6,lat:32.32,lon:-90.08,abbr:'JAN',region:'N America',pop:0.4,econ:48,tourism:32,slots:35,major:false,level:2,fulfill:50},
  'Bozeman':{x:386.3,y:248.1,lat:45.78,lon:-111.15,abbr:'BZN',region:'N America',pop:0.2,econ:52,tourism:65,slots:30,major:false,level:2,fulfill:50},
  'Omaha':{x:471.2,y:273.3,lat:41.3,lon:-96.02,abbr:'OMA',region:'N America',pop:0.5,econ:60,tourism:38,slots:40,major:false,level:2,fulfill:50},
  'Albuquerque':{x:411.8,y:308.4,lat:35.04,lon:-106.61,abbr:'ABQ',region:'N America',pop:0.6,econ:55,tourism:55,slots:45,major:false,level:2,fulfill:50},
  'Fargo':{x:466.8,y:241.7,lat:46.92,lon:-96.81,abbr:'FAR',region:'N America',pop:0.2,econ:55,tourism:30,slots:30,major:false,level:2,fulfill:50},
  'Oklahoma City':{x:462.4,y:306.4,lat:35.39,lon:-97.6,abbr:'OKC',region:'N America',pop:0.6,econ:58,tourism:38,slots:40,major:false,level:2,fulfill:50},
  'Charleston SC':{x:561.5,y:321.1,lat:32.78,lon:-79.93,abbr:'CHS',region:'N America',pop:0.5,econ:60,tourism:62,slots:40,major:false,level:2,fulfill:50},
  'Sioux Falls':{x:467.2,y:260.5,lat:43.58,lon:-96.74,abbr:'FSD',region:'N America',pop:0.2,econ:52,tourism:32,slots:30,major:false,level:2,fulfill:50},
  'Charleston WV':{x:552.2,y:289.7,lat:38.37,lon:-81.59,abbr:'CRW',region:'N America',pop:0.3,econ:50,tourism:30,slots:30,major:false,level:2,fulfill:50},
  'Milwaukee':{x:516.8,y:263.5,lat:43.04,lon:-87.9,abbr:'MKE',region:'N America',pop:0.8,econ:62,tourism:42,slots:48,major:false,level:2,fulfill:50},
  'Jackson Hole':{x:388.6,y:260.3,lat:43.61,lon:-110.74,abbr:'JAC',region:'N America',pop:0.1,econ:60,tourism:78,slots:28,major:false,level:2,fulfill:50},
  'Zagreb':{x:1100.2,y:248.3,lat:45.74,lon:16.07,abbr:'ZAG',region:'Europe',pop:0.8,econ:62,tourism:60,slots:50,major:false,level:3,fulfill:50},
  'Belgrade':{x:1123.8,y:253.5,lat:44.82,lon:20.29,abbr:'BEG',region:'Europe',pop:1.2,econ:55,tourism:58,slots:55,major:false,level:3,fulfill:50},
  'Sofia':{x:1140.9,y:265.4,lat:42.7,lon:23.32,abbr:'SOF',region:'Europe',pop:1.0,econ:52,tourism:55,slots:50,major:false,level:3,fulfill:50},
  'Bratislava':{x:1106.0,y:234.8,lat:48.15,lon:17.11,abbr:'BTS',region:'Europe',pop:0.5,econ:62,tourism:52,slots:40,major:false,level:2,fulfill:50},
  'Ljubljana':{x:1091.4,y:246.5,lat:46.07,lon:14.51,abbr:'LJU',region:'Europe',pop:0.3,econ:68,tourism:58,slots:38,major:false,level:2,fulfill:50},
  'Riga':{x:1145.0,y:185.6,lat:56.92,lon:24.06,abbr:'RIX',region:'Europe',pop:0.5,econ:65,tourism:58,slots:42,major:false,level:2,fulfill:50},
  'Vilnius':{x:1151.8,y:198.1,lat:54.69,lon:25.28,abbr:'VNO',region:'Europe',pop:0.5,econ:62,tourism:55,slots:40,major:false,level:2,fulfill:50},
  'Tallinn':{x:1149.2,y:171.6,lat:59.41,lon:24.8,abbr:'TLL',region:'Europe',pop:0.4,econ:68,tourism:60,slots:38,major:false,level:2,fulfill:50},
  'Luxembourg':{x:1044.8,y:226.6,lat:49.62,lon:6.2,abbr:'LUX',region:'Europe',pop:0.2,econ:90,tourism:55,slots:38,major:false,level:2,fulfill:50},
    'Reykjavik':{x:883.1,y:146.0,lat:63.98,lon:-22.61,abbr:'KEF',region:'Europe',pop:0.3,econ:82,tourism:80,slots:42,major:false,level:3,fulfill:50},
  'Skopje':{x:1131.3,y:269.6,lat:41.96,lon:21.62,abbr:'SKP',region:'Europe',pop:0.5,econ:48,tourism:45,slots:38,major:false,level:2,fulfill:50},
  'Sarajevo':{x:1112.9,y:259.1,lat:43.82,lon:18.33,abbr:'SJJ',region:'Europe',pop:0.4,econ:50,tourism:52,slots:38,major:false,level:2,fulfill:50},
  'Tirana':{x:1121.3,y:273.1,lat:41.33,lon:19.83,abbr:'TIA',region:'Europe',pop:0.5,econ:45,tourism:48,slots:38,major:false,level:2,fulfill:50},
  'Chisinau':{x:1171.8,y:241.3,lat:47.0,lon:28.84,abbr:'KIV',region:'Europe',pop:0.4,econ:38,tourism:38,slots:35,major:false,level:2,fulfill:50},
  'Podgorica':{x:1118.0,y:267.3,lat:42.36,lon:19.25,abbr:'TGD',region:'Europe',pop:0.2,econ:45,tourism:55,slots:32,major:false,level:2,fulfill:50},
  'Pristina':{x:1128.1,y:266.1,lat:42.57,lon:21.04,abbr:'PRN',region:'Europe',pop:0.3,econ:42,tourism:40,slots:30,major:false,level:2,fulfill:50},
  'Minsk':{x:1164.5,y:202.7,lat:53.88,lon:27.54,abbr:'MSQ',region:'Europe',pop:1.5,econ:48,tourism:40,slots:55,major:false,level:3,fulfill:50},
  'Tbilisi':{x:1262.2,y:271.1,lat:41.69,lon:44.95,abbr:'TBS',region:'Europe',pop:1.0,econ:50,tourism:58,slots:50,major:false,level:3,fulfill:50},
  'Yerevan':{x:1259.2,y:279.7,lat:40.15,lon:44.41,abbr:'EVN',region:'Europe',pop:0.8,econ:48,tourism:52,slots:45,major:false,level:3,fulfill:50},
  'Baku':{x:1289.7,y:278.5,lat:40.37,lon:49.84,abbr:'GYD',region:'Europe',pop:1.5,econ:58,tourism:50,slots:55,major:false,level:3,fulfill:50},
  'Damascus':{x:1213.5,y:317.0,lat:33.51,lon:36.27,abbr:'DAM',region:'Mid East',pop:1.0,econ:35,tourism:38,slots:40,major:false,level:2,fulfill:50},
  'Sanaa':{x:1258.1,y:418.1,lat:15.48,lon:44.22,abbr:'SAH',region:'Mid East',pop:0.8,econ:28,tourism:25,slots:30,major:false,level:2,fulfill:50},
  'Tripoli':{x:1083.8,y:321.7,lat:32.66,lon:13.16,abbr:'TIP',region:'Africa',pop:0.5,econ:38,tourism:30,slots:35,major:false,level:2,fulfill:50},
  'Kabul':{x:1398.3,y:311.1,lat:34.56,lon:69.21,abbr:'KBL',region:'Mid East',pop:1.0,econ:22,tourism:20,slots:30,major:false,level:2,fulfill:50},
  'Nur-Sultan':{x:1411.0,y:218.7,lat:51.02,lon:71.47,abbr:'NQZ',region:'Mid East',pop:0.5,econ:52,tourism:35,slots:38,major:false,level:2,fulfill:50},
  'Almaty':{x:1442.3,y:261.8,lat:43.35,lon:77.04,abbr:'ALA',region:'Mid East',pop:1.0,econ:55,tourism:42,slots:50,major:false,level:3,fulfill:50},
  'Tashkent':{x:1398.7,y:273.3,lat:41.3,lon:69.28,abbr:'TAS',region:'Mid East',pop:1.5,econ:42,tourism:38,slots:48,major:false,level:3,fulfill:50},
  'Ashgabat':{x:1337.5,y:291.8,lat:37.99,lon:58.36,abbr:'ASB',region:'Mid East',pop:0.5,econ:40,tourism:30,slots:32,major:false,level:2,fulfill:50},
  'Dushanbe':{x:1395.9,y:288.7,lat:38.55,lon:68.77,abbr:'DYU',region:'Mid East',pop:0.4,econ:35,tourism:28,slots:30,major:false,level:2,fulfill:50},
  'Bishkek':{x:1428.5,y:264.5,lat:42.87,lon:74.59,abbr:'FRU',region:'Mid East',pop:0.4,econ:35,tourism:32,slots:30,major:false,level:2,fulfill:50},
  'Vientiane':{x:1585.5,y:404.1,lat:17.99,lon:102.56,abbr:'VTE',region:'SE Asia',pop:0.3,econ:35,tourism:42,slots:30,major:false,level:2,fulfill:50},
  'Bandar Seri':{x:1654.9,y:477.3,lat:4.94,lon:114.93,abbr:'BWN',region:'SE Asia',pop:0.1,econ:65,tourism:45,slots:35,major:false,level:2,fulfill:50},
  'Kigali':{x:1179.1,y:516.1,lat:-1.97,lon:30.14,abbr:'KGL',region:'Africa',pop:0.4,econ:45,tourism:50,slots:38,major:false,level:2,fulfill:50},
  'Gaborone':{x:1155.4,y:642.8,lat:-24.56,lon:25.91,abbr:'GBE',region:'Africa',pop:0.3,econ:50,tourism:42,slots:32,major:false,level:2,fulfill:50},
  'Windhoek':{x:1108.0,y:631.1,lat:-22.48,lon:17.47,abbr:'WDH',region:'Africa',pop:0.2,econ:48,tourism:45,slots:30,major:false,level:2,fulfill:50},
  'Antananarivo':{x:1276.4,y:610.5,lat:-18.8,lon:47.48,abbr:'TNR',region:'Africa',pop:0.5,econ:30,tourism:42,slots:32,major:false,level:2,fulfill:50},
  'Lilongwe':{x:1199.6,y:582.4,lat:-13.79,lon:33.79,abbr:'LLW',region:'Africa',pop:0.3,econ:28,tourism:35,slots:28,major:false,level:2,fulfill:50},
  'Bamako':{x:965.1,y:434.7,lat:12.53,lon:-8.0,abbr:'BKO',region:'Africa',pop:0.5,econ:28,tourism:30,slots:30,major:false,level:2,fulfill:50},
  'Niamey':{x:1022.2,y:429.2,lat:13.51,lon:2.18,abbr:'NIM',region:'Africa',pop:0.3,econ:25,tourism:25,slots:25,major:false,level:2,fulfill:50},
  'Ouagadougou':{x:1001.5,y:435.6,lat:12.36,lon:-1.52,abbr:'OUA',region:'Africa',pop:0.4,econ:28,tourism:28,slots:28,major:false,level:2,fulfill:50},
  'Conakry':{x:933.6,y:451.5,lat:9.54,lon:-13.61,abbr:'CKY',region:'Africa',pop:0.5,econ:28,tourism:30,slots:28,major:false,level:2,fulfill:50},
  'Lomé':{x:1017.0,y:470.4,lat:6.17,lon:1.25,abbr:'LFW',region:'Africa',pop:0.4,econ:32,tourism:32,slots:28,major:false,level:2,fulfill:50},
  'Cotonou':{x:1023.4,y:469.3,lat:6.36,lon:2.39,abbr:'COO',region:'Africa',pop:0.5,econ:35,tourism:32,slots:30,major:false,level:2,fulfill:50},
  'Banjul':{x:916.4,y:430.1,lat:13.34,lon:-16.68,abbr:'BJL',region:'Africa',pop:0.2,econ:28,tourism:35,slots:25,major:false,level:2,fulfill:50},
  'Freetown':{x:936.0,y:457.4,lat:8.49,lon:-13.19,abbr:'FNA',region:'Africa',pop:0.5,econ:25,tourism:30,slots:25,major:false,level:2,fulfill:50},
  'Monrovia':{x:951.9,y:469.7,lat:6.29,lon:-10.36,abbr:'ROB',region:'Africa',pop:0.4,econ:22,tourism:25,slots:25,major:false,level:2,fulfill:50},
  'Mogadishu':{x:1264.2,y:493.7,lat:2.02,lon:45.3,abbr:'MGQ',region:'Africa',pop:0.8,econ:18,tourism:15,slots:22,major:false,level:2,fulfill:50},
  'Djibouti':{x:1252.2,y:440.2,lat:11.55,lon:43.16,abbr:'JIB',region:'Africa',pop:0.2,econ:40,tourism:30,slots:25,major:false,level:2,fulfill:50},
  'NDjamena':{x:1094.4,y:436.9,lat:12.13,lon:15.04,abbr:'NDJ',region:'Africa',pop:0.4,econ:22,tourism:20,slots:22,major:false,level:2,fulfill:50},
  'Bangui':{x:1113.9,y:480.3,lat:4.4,lon:18.52,abbr:'BGF',region:'Africa',pop:0.3,econ:20,tourism:20,slots:20,major:false,level:2,fulfill:50},
  'Libreville':{x:1062.8,y:502.8,lat:0.39,lon:9.41,abbr:'LBV',region:'Africa',pop:0.3,econ:42,tourism:35,slots:28,major:false,level:2,fulfill:50},
  'Brazzaville':{x:1095.6,y:528.8,lat:-4.25,lon:15.25,abbr:'BZV',region:'Africa',pop:0.4,econ:32,tourism:28,slots:25,major:false,level:2,fulfill:50},
  'Malabo':{x:1059.2,y:483.9,lat:3.76,lon:8.77,abbr:'SSG',region:'Africa',pop:0.2,econ:45,tourism:25,slots:22,major:false,level:2,fulfill:50},
  'Asmara':{x:1228.3,y:419.2,lat:15.29,lon:38.91,abbr:'ASM',region:'Africa',pop:0.4,econ:22,tourism:22,slots:20,major:false,level:2,fulfill:50},
      'Lusaka':{x:1169.6,y:591.0,lat:-15.33,lon:28.45,abbr:'LUN',region:'Africa',pop:0.8,econ:40,tourism:38,slots:38,major:false,level:2,fulfill:50},
  'Nouakchott':{x:920.5,y:403.4,lat:18.1,lon:-15.95,abbr:'NKC',region:'Africa',pop:0.3,econ:25,tourism:22,slots:22,major:false,level:2,fulfill:50},
  'Guatemala City':{x:502.1,y:423.2,lat:14.58,lon:-90.52,abbr:'GUA',region:'N America',pop:0.8,econ:45,tourism:45,slots:45,major:false,level:2,fulfill:50},
  'Tegucigalpa':{x:520.7,y:426.1,lat:14.06,lon:-87.21,abbr:'SAP',region:'N America',pop:0.5,econ:38,tourism:35,slots:32,major:false,level:2,fulfill:50},
  'San Salvador':{x:509.9,y:428.1,lat:13.7,lon:-89.12,abbr:'SAL',region:'N America',pop:0.5,econ:40,tourism:38,slots:35,major:false,level:2,fulfill:50},
  'Managua':{x:526.5,y:436.9,lat:12.13,lon:-86.17,abbr:'MGA',region:'N America',pop:0.5,econ:35,tourism:38,slots:30,major:false,level:2,fulfill:50},
  'San Jose CR':{x:537.5,y:448.9,lat:9.99,lon:-84.21,abbr:'SJO',region:'N America',pop:0.5,econ:52,tourism:62,slots:42,major:false,level:3,fulfill:50},
  'Panama City':{x:563.8,y:454.6,lat:8.99,lon:-79.52,abbr:'PTY',region:'N America',pop:0.5,econ:58,tourism:55,slots:50,major:false,level:3,fulfill:50},
  'Havana':{x:547.8,y:375.5,lat:23.08,lon:-82.38,abbr:'HAV',region:'N America',pop:0.8,econ:35,tourism:62,slots:45,major:false,level:3,fulfill:50},
  'Kingston':{x:579.1,y:404.1,lat:17.99,lon:-76.79,abbr:'KIN',region:'N America',pop:0.4,econ:40,tourism:60,slots:38,major:false,level:2,fulfill:50},
  'Port-au-Prince':{x:604.1,y:401.0,lat:18.54,lon:-72.34,abbr:'PAP',region:'N America',pop:0.5,econ:22,tourism:35,slots:28,major:false,level:2,fulfill:50},
  'Santo Domingo':{x:617.8,y:401.4,lat:18.47,lon:-69.9,abbr:'SDQ',region:'N America',pop:0.8,econ:40,tourism:65,slots:45,major:false,level:3,fulfill:50},
  'Port of Spain':{x:664.8,y:445.2,lat:10.65,lon:-61.52,abbr:'POS',region:'S America',pop:0.3,econ:48,tourism:55,slots:38,major:false,level:2,fulfill:50},
      'Belmopan':{x:511.8,y:408.2,lat:17.25,lon:-88.78,abbr:'BZE',region:'N America',pop:0.1,econ:42,tourism:50,slots:25,major:false,level:2,fulfill:50},
  'San Juan PR':{x:639.0,y:401.4,lat:18.47,lon:-66.11,abbr:'SJU',region:'N America',pop:0.8,econ:58,tourism:72,slots:50,major:false,level:3,fulfill:50},
          'Dili':{x:1714.4,y:553.0,lat:-8.55,lon:125.53,abbr:'DIL',region:'SE Asia',pop:0.1,econ:28,tourism:35,slots:18,major:false,level:2,fulfill:50},
  'Pyongyang':{x:1715.1,y:284.9,lat:39.22,lon:125.67,abbr:'FNJ',region:'SE Asia',pop:0.5,econ:20,tourism:10,slots:18,major:false,level:2,fulfill:50},
  'Paris':{x:1023.2,y:230.9,lat:48.85,lon:2.35,abbr:'CDG',region:'Europe',pop:11.0,econ:90,tourism:92,slots:200,major:true,level:6,fulfill:50},
  'Nice':{x:1050.5,y:260.0,lat:43.66,lon:7.21,abbr:'NCE',region:'Europe',pop:1.0,econ:72,tourism:80,slots:70,major:false,level:3,fulfill:50},
  'Lyon':{x:1037.2,y:248.2,lat:45.76,lon:4.84,abbr:'LYS',region:'Europe',pop:1.7,econ:74,tourism:55,slots:70,major:false,level:3,fulfill:50},
  'Geneva':{x:1044.5,y:245.8,lat:46.2,lon:6.14,abbr:'GVA',region:'Europe',pop:0.6,econ:85,tourism:70,slots:75,major:false,level:3,fulfill:50},
  'Hamburg':{x:1066.1,y:204.5,lat:53.55,lon:9.99,abbr:'HAM',region:'Europe',pop:1.8,econ:78,tourism:52,slots:80,major:false,level:3,fulfill:50},
  'Berlin':{x:1085.2,y:210.3,lat:52.52,lon:13.4,abbr:'BER',region:'Europe',pop:3.7,econ:82,tourism:75,slots:120,major:true,level:4,fulfill:50},
  'Dusseldorf':{x:1048.0,y:217.5,lat:51.23,lon:6.78,abbr:'DUS',region:'Europe',pop:0.6,econ:80,tourism:48,slots:80,major:false,level:3,fulfill:50},
  'Manchester':{x:997.4,y:204.9,lat:53.48,lon:-2.24,abbr:'MAN',region:'Europe',pop:2.7,econ:72,tourism:55,slots:95,major:true,level:4,fulfill:50},
  'Edinburgh':{x:992.1,y:191.1,lat:55.95,lon:-3.19,abbr:'EDI',region:'Europe',pop:0.5,econ:74,tourism:72,slots:70,major:false,level:3,fulfill:50},
  'Glasgow':{x:986.2,y:191.6,lat:55.86,lon:-4.25,abbr:'GLA',region:'Europe',pop:0.6,econ:68,tourism:50,slots:60,major:false,level:2,fulfill:50},
  'Porto':{x:961.7,y:274.1,lat:41.15,lon:-8.61,abbr:'OPO',region:'Europe',pop:1.3,econ:60,tourism:68,slots:70,major:false,level:3,fulfill:50},
  'Venice':{x:1079.1,y:250.0,lat:45.44,lon:12.32,abbr:'VCE',region:'Europe',pop:0.3,econ:62,tourism:90,slots:65,major:false,level:3,fulfill:50},
  'Naples':{x:1090.1,y:275.8,lat:40.85,lon:14.27,abbr:'NAP',region:'Europe',pop:1.0,econ:55,tourism:68,slots:65,major:false,level:2,fulfill:50},
  'Florence':{x:1073.2,y:259.4,lat:43.77,lon:11.26,abbr:'FLR',region:'Europe',pop:0.4,econ:60,tourism:82,slots:55,major:false,level:2,fulfill:50},
  'Palma':{x:1024.9,y:283.0,lat:39.57,lon:2.65,abbr:'PMI',region:'Europe',pop:0.4,econ:55,tourism:88,slots:70,major:false,level:3,fulfill:50},
  'Malaga':{x:985.2,y:299.0,lat:36.72,lon:-4.42,abbr:'AGP',region:'Europe',pop:0.6,econ:55,tourism:82,slots:65,major:false,level:3,fulfill:50},
  'Seville':{x:976.4,y:295.2,lat:37.39,lon:-5.99,abbr:'SVQ',region:'Europe',pop:0.7,econ:55,tourism:75,slots:55,major:false,level:2,fulfill:50},
  'Valencia':{x:1007.9,y:283.5,lat:39.47,lon:-0.38,abbr:'VLC',region:'Europe',pop:0.8,econ:60,tourism:68,slots:60,major:false,level:2,fulfill:50},
  'Krakow':{x:1121.9,y:224.1,lat:50.06,lon:19.94,abbr:'KRK',region:'Europe',pop:0.8,econ:58,tourism:72,slots:55,major:false,level:2,fulfill:50},
  'Antalya':{x:1182.2,y:297.9,lat:36.9,lon:30.69,abbr:'AYT',region:'Europe',pop:1.2,econ:52,tourism:90,slots:80,major:false,level:3,fulfill:50},
  'Split':{x:1102.2,y:260.9,lat:43.51,lon:16.44,abbr:'SPU',region:'Europe',pop:0.2,econ:50,tourism:80,slots:50,major:false,level:2,fulfill:50},
  'Thessaloniki':{x:1138.7,y:277.0,lat:40.64,lon:22.94,abbr:'SKG',region:'Europe',pop:0.8,econ:52,tourism:62,slots:55,major:false,level:2,fulfill:50},
    'St Petersburg':{x:1180.2,y:168.7,lat:59.93,lon:30.34,abbr:'LED',region:'Europe',pop:5.4,econ:62,tourism:72,slots:95,major:true,level:4,fulfill:50},
  'Tenerife':{x:917.2,y:345.3,lat:28.46,lon:-16.54,abbr:'TFS',region:'Europe',pop:0.9,econ:50,tourism:85,slots:60,major:false,level:3,fulfill:50},
  'Faro':{x:965.5,y:297.3,lat:37.02,lon:-7.93,abbr:'FAO',region:'Europe',pop:0.1,econ:48,tourism:82,slots:45,major:false,level:2,fulfill:50},
  'Jeddah':{x:1229.9,y:384.4,lat:21.49,lon:39.19,abbr:'JED',region:'Mid East',pop:4.7,econ:68,tourism:60,slots:100,major:true,level:4,fulfill:50},
  'Marrakech':{x:965.2,y:327.5,lat:31.63,lon:-7.99,abbr:'RAK',region:'Africa',pop:0.9,econ:50,tourism:85,slots:60,major:false,level:3,fulfill:50},
  'Tangier':{x:977.3,y:304.3,lat:35.76,lon:-5.83,abbr:'TNG',region:'Africa',pop:1.1,econ:48,tourism:58,slots:50,major:false,level:2,fulfill:50},
  'Sharm el-Sheikh':{x:1202.6,y:348.3,lat:27.92,lon:34.33,abbr:'SSH',region:'Africa',pop:0.2,econ:45,tourism:88,slots:55,major:false,level:3,fulfill:50},
  'Mombasa':{x:1232.6,y:527.7,lat:-4.04,lon:39.67,abbr:'MBA',region:'Africa',pop:1.2,econ:42,tourism:72,slots:50,major:false,level:2,fulfill:50},
  'Zanzibar':{x:1230.0,y:539.6,lat:-6.16,lon:39.2,abbr:'ZNZ',region:'Africa',pop:0.2,econ:40,tourism:85,slots:45,major:false,level:2,fulfill:50},
  'Kolkata':{x:1505.8,y:378.4,lat:22.57,lon:88.36,abbr:'CCU',region:'SE Asia',pop:14.8,econ:55,tourism:48,slots:110,major:true,level:4,fulfill:50},
  'Hyderabad':{x:1450.4,y:407.4,lat:17.39,lon:78.49,abbr:'HYD',region:'SE Asia',pop:10.0,econ:62,tourism:50,slots:100,major:true,level:4,fulfill:50},
  'Ahmedabad':{x:1417.2,y:375.8,lat:23.02,lon:72.57,abbr:'AMD',region:'SE Asia',pop:8.0,econ:58,tourism:42,slots:85,major:false,level:3,fulfill:50},
  'Goa':{x:1424.3,y:418.7,lat:15.38,lon:73.83,abbr:'GOI',region:'SE Asia',pop:0.6,econ:48,tourism:88,slots:55,major:false,level:3,fulfill:50},
  'Kochi':{x:1438.0,y:449.3,lat:9.93,lon:76.27,abbr:'COK',region:'SE Asia',pop:2.1,econ:52,tourism:68,slots:60,major:false,level:2,fulfill:50},
  'Sapporo':{x:1803.1,y:263.4,lat:43.06,lon:141.35,abbr:'CTS',region:'SE Asia',pop:2.0,econ:70,tourism:72,slots:80,major:false,level:3,fulfill:50},
  'Fukuoka':{x:1741.7,y:316.5,lat:33.59,lon:130.4,abbr:'FUK',region:'SE Asia',pop:1.6,econ:72,tourism:58,slots:80,major:false,level:3,fulfill:50},
  'Nagoya':{x:1778.2,y:307.6,lat:35.18,lon:136.91,abbr:'NGO',region:'SE Asia',pop:2.3,econ:78,tourism:50,slots:90,major:false,level:3,fulfill:50},
  'Okinawa':{x:1726.3,y:357.9,lat:26.21,lon:127.65,abbr:'OKA',region:'SE Asia',pop:0.3,econ:60,tourism:85,slots:55,major:false,level:3,fulfill:50},
  'Busan':{x:1734.3,y:307.6,lat:35.18,lon:129.08,abbr:'PUS',region:'SE Asia',pop:3.4,econ:72,tourism:62,slots:90,major:true,level:4,fulfill:50},
  'Jeju':{x:1719.9,y:317.0,lat:33.51,lon:126.52,abbr:'CJU',region:'SE Asia',pop:0.7,econ:60,tourism:88,slots:60,major:false,level:3,fulfill:50},
  'Xian':{x:1621.3,y:312.3,lat:34.34,lon:108.94,abbr:'XIY',region:'SE Asia',pop:12.0,econ:62,tourism:70,slots:100,major:true,level:4,fulfill:50},
  'Kunming':{x:1586.3,y:364.5,lat:25.04,lon:102.71,abbr:'KMG',region:'SE Asia',pop:6.6,econ:55,tourism:68,slots:80,major:false,level:3,fulfill:50},
  'Hangzhou':{x:1684.2,y:335.2,lat:30.27,lon:120.16,abbr:'HGH',region:'SE Asia',pop:10.4,econ:72,tourism:72,slots:100,major:true,level:4,fulfill:50},
  'Shenzhen':{x:1650.0,y:378.5,lat:22.54,lon:114.06,abbr:'SZX',region:'SE Asia',pop:12.5,econ:82,tourism:55,slots:120,major:true,level:5,fulfill:50},
  'Xiamen':{x:1672.6,y:367.6,lat:24.48,lon:118.09,abbr:'XMN',region:'SE Asia',pop:4.3,econ:68,tourism:65,slots:75,major:false,level:3,fulfill:50},
  'Qingdao':{x:1685.5,y:302.6,lat:36.07,lon:120.38,abbr:'TAO',region:'SE Asia',pop:9.0,econ:66,tourism:58,slots:85,major:false,level:3,fulfill:50},
    'Chiang Mai':{x:1565.4,y:399.6,lat:18.79,lon:98.99,abbr:'CNX',region:'SE Asia',pop:1.2,econ:48,tourism:82,slots:55,major:false,level:3,fulfill:50},
  'Phuket':{x:1562.1,y:460.8,lat:7.88,lon:98.39,abbr:'HKT',region:'SE Asia',pop:0.4,econ:50,tourism:92,slots:65,major:false,level:3,fulfill:50},
  'Da Nang':{x:1617.1,y:414.9,lat:16.05,lon:108.2,abbr:'DAD',region:'SE Asia',pop:1.2,econ:50,tourism:80,slots:55,major:false,level:3,fulfill:50},
  'Cebu':{x:1705.2,y:447.1,lat:10.31,lon:123.89,abbr:'CEB',region:'SE Asia',pop:3.0,econ:48,tourism:75,slots:65,major:false,level:3,fulfill:50},
  'Surabaya':{x:1642.7,y:545.7,lat:-7.25,lon:112.75,abbr:'SUB',region:'SE Asia',pop:3.0,econ:52,tourism:45,slots:70,major:false,level:3,fulfill:50},
  'Medan':{x:1563.6,y:484.9,lat:3.59,lon:98.67,abbr:'KNO',region:'SE Asia',pop:2.5,econ:48,tourism:42,slots:60,major:false,level:2,fulfill:50},
  'Adelaide':{x:1787.7,y:701.0,lat:-34.93,lon:138.6,abbr:'ADL',region:'Oceania',pop:1.4,econ:68,tourism:55,slots:70,major:false,level:3,fulfill:50},
  'Cairns':{x:1827.9,y:599.9,lat:-16.92,lon:145.77,abbr:'CNS',region:'Oceania',pop:0.2,econ:55,tourism:85,slots:50,major:false,level:2,fulfill:50},
  'Gold Coast':{x:1870.9,y:662.2,lat:-28.02,lon:153.43,abbr:'OOL',region:'Oceania',pop:0.7,econ:60,tourism:85,slots:60,major:false,level:3,fulfill:50},
  'Darwin':{x:1744.2,y:574.9,lat:-12.46,lon:130.84,abbr:'DRW',region:'Oceania',pop:0.15,econ:52,tourism:60,slots:45,major:false,level:2,fulfill:50},
  'Wellington':{x:1990.7,y:736.7,lat:-41.29,lon:174.78,abbr:'WLG',region:'Oceania',pop:0.4,econ:70,tourism:62,slots:60,major:false,level:2,fulfill:50},
  'Queenstown':{x:1956.4,y:757.7,lat:-45.03,lon:168.66,abbr:'ZQN',region:'Oceania',pop:0.05,econ:58,tourism:92,slots:45,major:false,level:2,fulfill:50},
  'Cancun':{x:522.7,y:386.3,lat:21.16,lon:-86.85,abbr:'CUN',region:'N America',pop:0.9,econ:55,tourism:92,slots:80,major:false,level:3,fulfill:50},
  'Guadalajara':{x:430.1,y:389.0,lat:20.67,lon:-103.35,abbr:'GDL',region:'N America',pop:5.0,econ:58,tourism:52,slots:80,major:false,level:3,fulfill:50},
  'Monterrey':{x:447.1,y:360.9,lat:25.69,lon:-100.32,abbr:'MTY',region:'N America',pop:4.7,econ:66,tourism:45,slots:80,major:false,level:3,fulfill:50},
  'Edmonton':{x:373.2,y:204.5,lat:53.55,lon:-113.49,abbr:'YEG',region:'N America',pop:1.4,econ:70,tourism:45,slots:65,major:false,level:2,fulfill:50},
  'Ottawa':{x:585.2,y:250.1,lat:45.42,lon:-75.7,abbr:'YOW',region:'N America',pop:1.0,econ:72,tourism:52,slots:65,major:false,level:2,fulfill:50},
  'Winnipeg':{x:464.9,y:225.0,lat:49.9,lon:-97.14,abbr:'YWG',region:'N America',pop:0.8,econ:62,tourism:40,slots:55,major:false,level:2,fulfill:50},
  'Halifax':{x:653.2,y:254.5,lat:44.65,lon:-63.58,abbr:'YHZ',region:'N America',pop:0.4,econ:60,tourism:50,slots:50,major:false,level:2,fulfill:50},
  'Maui':{x:132.3,y:387.8,lat:20.89,lon:-156.43,abbr:'OGG',region:'N America',pop:0.15,econ:55,tourism:92,slots:50,major:false,level:3,fulfill:50},
  'Fairbanks':{x:181.1,y:141.2,lat:64.84,lon:-147.72,abbr:'FAI',region:'N America',pop:0.1,econ:48,tourism:55,slots:40,major:false,level:2,fulfill:50},
  'Brasilia':{x:741.3,y:593.6,lat:-15.79,lon:-47.88,abbr:'BSB',region:'S America',pop:4.6,econ:62,tourism:48,slots:90,major:true,level:4,fulfill:50},
  'Cartagena':{x:586.3,y:446.7,lat:10.39,lon:-75.51,abbr:'CTG',region:'S America',pop:1.0,econ:48,tourism:85,slots:55,major:false,level:3,fulfill:50},
  'Manaus':{x:673.2,y:522.5,lat:-3.12,lon:-60.02,abbr:'MAO',region:'S America',pop:2.2,econ:45,tourism:55,slots:60,major:false,level:2,fulfill:50},
  'Cusco':{x:606.2,y:580.9,lat:-13.53,lon:-71.97,abbr:'CUZ',region:'S America',pop:0.5,econ:42,tourism:90,slots:50,major:false,level:3,fulfill:50},
  'Mendoza':{x:623.7,y:689.5,lat:-32.89,lon:-68.84,abbr:'MDZ',region:'S America',pop:1.2,econ:50,tourism:68,slots:55,major:false,level:2,fulfill:50},
  'Salvador':{x:794.0,y:577.8,lat:-12.97,lon:-38.5,abbr:'SSA',region:'S America',pop:2.9,econ:48,tourism:75,slots:70,major:false,level:3,fulfill:50},
  'Punta Cana':{x:624.4,y:400.8,lat:18.57,lon:-68.72,abbr:'PUJ',region:'N America',pop:0.1,econ:45,tourism:92,slots:55,major:false,level:3,fulfill:50},
  'Cordoba':{x:649.9,y:681.3,lat:-31.42,lon:-64.18,abbr:'COR',region:'S America',pop:1.6,econ:55,tourism:48,slots:55,major:false, level:2,fulfill:50},
  'Belo Horizonte':{x:763.4,y:616.8,lat:-19.92,lon:-43.94,abbr:'CNF',region:'S America',pop:2.7,econ:62,tourism:45,slots:60,major:true, level:3,fulfill:50},
  'Porto Alegre':{x:722.5,y:673.5,lat:-30.03,lon:-51.23,abbr:'POA',region:'S America',pop:1.5,econ:60,tourism:48,slots:55,major:false, level:2,fulfill:50},
  'Curitiba':{x:733.5,y:647.7,lat:-25.43,lon:-49.27,abbr:'CWB',region:'S America',pop:1.9,econ:63,tourism:50,slots:55,major:false, level:2,fulfill:50},
  'Cali':{x:580.6,y:485.8,lat:3.42,lon:-76.52,abbr:'CLO',region:'S America',pop:2.2,econ:52,tourism:46,slots:55,major:false, level:2,fulfill:50},
  'Medellin':{x:586.0,y:469.9,lat:6.25,lon:-75.56,abbr:'MDE',region:'S America',pop:2.5,econ:58,tourism:58,slots:60,major:true, level:3,fulfill:50},
  'Quito':{x:569.7,y:506.0,lat:-0.18,lon:-78.47,abbr:'UIO',region:'S America',pop:2.0,econ:54,tourism:62,slots:60,major:true, level:3,fulfill:50},
  'Guayaquil':{x:561.8,y:517.3,lat:-2.19,lon:-79.88,abbr:'GYE',region:'S America',pop:2.7,econ:52,tourism:44,slots:55,major:false, level:2,fulfill:50},
  'La Paz':{x:627.6,y:597.6,lat:-16.5,lon:-68.15,abbr:'LPB',region:'S America',pop:0.8,econ:45,tourism:58,slots:45,major:false, level:2,fulfill:50},
  'Montevideo':{x:694.9,y:700.8,lat:-34.9,lon:-56.16,abbr:'MVD',region:'S America',pop:1.4,econ:60,tourism:55,slots:55,major:true, level:3,fulfill:50},
  'Asuncion':{x:686.6,y:647.0,lat:-25.3,lon:-57.63,abbr:'ASU',region:'S America',pop:0.5,econ:48,tourism:40,slots:45,major:false, level:1,fulfill:50},
  'Recife':{x:814.3,y:550.2,lat:-8.05,lon:-34.88,abbr:'REC',region:'S America',pop:1.6,econ:55,tourism:60,slots:55,major:false, level:2,fulfill:50},
  'Fortaleza':{x:793.9,y:525.9,lat:-3.73,lon:-38.52,abbr:'FOR',region:'S America',pop:2.7,econ:54,tourism:62,slots:55,major:true, level:3,fulfill:50},
  'Canberra':{x:1846.8,y:703.0,lat:-35.28,lon:149.13,abbr:'CBR',region:'Oceania',pop:0.45,econ:72,tourism:52,slots:55,major:false, level:2,fulfill:50},
  'Hobart':{x:1836.7,y:745.6,lat:-42.88,lon:147.33,abbr:'HBA',region:'Oceania',pop:0.24,econ:60,tourism:62,slots:45,major:false, level:2,fulfill:50},
  'Guam':{x:1822.4,y:429.4,lat:13.48,lon:144.79,abbr:'GUM',region:'Oceania',pop:0.17,econ:55,tourism:72,slots:50,major:true, level:3,fulfill:50},
  'Suva':{x:2011.2,y:606.8,lat:-18.14,lon:178.44,abbr:'SUV',region:'Oceania',pop:0.09,econ:42,tourism:60,slots:40,major:false, level:1,fulfill:50},
  'Apia':{x:46.2,y:582.6,lat:-13.83,lon:-171.77,abbr:'APW',region:'Oceania',pop:0.04,econ:38,tourism:58,slots:35,major:false, level:1,fulfill:50},
  'Port Vila':{x:1954.5,y:604.5,lat:-17.73,lon:168.32,abbr:'VLI',region:'Oceania',pop:0.05,econ:38,tourism:64,slots:35,major:false, level:1,fulfill:50},
  'Nukualofa':{x:26.9,y:623.6,lat:-21.14,lon:-175.2,abbr:'TBU',region:'Oceania',pop:0.025,econ:34,tourism:55,slots:30,major:false, level:1,fulfill:50},
  'Honiara':{x:1907.5,y:557.9,lat:-9.43,lon:159.95,abbr:'HIR',region:'Oceania',pop:0.08,econ:36,tourism:48,slots:35,major:false, level:1,fulfill:50},
  'Papeete':{x:170.7,y:603.5,lat:-17.55,lon:-149.57,abbr:'PPT',region:'Oceania',pop:0.14,econ:50,tourism:78,slots:50,major:true, level:3,fulfill:50},
  'Newcastle':{x:1861.6,y:689.8,lat:-32.93,lon:151.78,abbr:'NTL',region:'Oceania',pop:0.5,econ:64,tourism:50,slots:50,major:false, level:2,fulfill:50},
  'Townsville':{x:1833.8,y:613.1,lat:-19.26,lon:146.82,abbr:'TSV',region:'Oceania',pop:0.18,econ:58,tourism:55,slots:45,major:false, level:2,fulfill:50},
  'Hamilton NZ':{x:1993.5,y:717.0,lat:-37.79,lon:175.28,abbr:'HLZ',region:'Oceania',pop:0.18,econ:60,tourism:52,slots:45,major:false, level:2,fulfill:50},
};
const REGIONS = ['N America','S America','Europe','Africa','Mid East','SE Asia','Oceania'];
const SUB_NA_SETS = {
  canada:   new Set(['Toronto','Montreal','Vancouver','Calgary','Edmonton','Ottawa','Winnipeg','Halifax']),
  mexico:   new Set(['Mexico City','Guadalajara','Monterrey','Cancun']),
  central:  new Set(['Guatemala City','Tegucigalpa','San Salvador','Managua','San Jose CR','Panama City','Belmopan']),
  caribbean:new Set(['Havana','Kingston','Port-au-Prince','Santo Domingo','San Juan PR','Punta Cana']),
  hawaii:   new Set(['Honolulu','Maui']),
};
const SUBREGIONS = {
  'N America': [
    {key:'canada',   label:'Canada',    test:(lat,lon,n)=>SUB_NA_SETS.canada.has(n)},
    {key:'mexico',   label:'Mexico',    test:(lat,lon,n)=>SUB_NA_SETS.mexico.has(n)},
    {key:'central',  label:'C America', test:(lat,lon,n)=>SUB_NA_SETS.central.has(n)},
    {key:'caribbean',label:'Caribbean', test:(lat,lon,n)=>SUB_NA_SETS.caribbean.has(n)},
    {key:'hawaii',   label:'Hawaii',    test:(lat,lon,n)=>SUB_NA_SETS.hawaii.has(n)},
    {key:'west',     label:'W US',      test:(lat,lon,n)=>lon<=-110},
    {key:'mountain', label:'Mountain',  test:(lat,lon,n)=>lon>-110&&lon<=-100},
    {key:'midwest',  label:'Midwest',   test:(lat,lon,n)=>lon>-100&&lon<=-87&&lat>=37},
    {key:'south',    label:'South',     test:(lat,lon,n)=>lon>-100&&lat<37&&lon<=-80},
    {key:'northeast',label:'NE US',     test:(lat,lon,n)=>lon>-87&&lat>=37},
    {key:'southeast',label:'SE US',     test:(lat,lon,n)=>lon>-80&&lat<37},
  ],
  'S America': [
    {key:'north',    label:'North',     test:(lat,lon)=>lat>=0},
    {key:'brazil',   label:'Brazil',    test:(lat,lon)=>lat<0&&lon>-55},
    {key:'andes',    label:'Andes/W',   test:(lat,lon)=>lat<0&&lon<=-55&&lat>-25},
    {key:'south',    label:'Southern',  test:(lat,lon)=>lat<=-25},
  ],
  'Europe': [
    {key:'british',  label:'British Is',test:(lat,lon)=>lon<=-5&&lat>=50},
    {key:'nordic',   label:'Nordic',    test:(lat,lon)=>lat>=55&&lon>-5},
    {key:'west',     label:'W Europe',  test:(lat,lon)=>lat<55&&lat>=44&&lon>-10&&lon<=8},
    {key:'central',  label:'C Europe',  test:(lat,lon)=>lat<55&&lat>=44&&lon>8&&lon<=20},
    {key:'south',    label:'S Europe',  test:(lat,lon)=>lat<44&&lon>=-10&&lon<=15},
    {key:'balkans',  label:'Balkans',   test:(lat,lon)=>lat<46&&lat>=36&&lon>15&&lon<=30},
    {key:'east',     label:'E Europe',  test:(lat,lon)=>lat>=44&&lon>20&&lon<=35},
    {key:'caucasus', label:'Caucasus',  test:(lat,lon)=>lon>35},
    {key:'atlantic', label:'Atlantic',  test:(lat,lon)=>lon<=-14},
  ],
  'Africa': [
    {key:'north',    label:'N Africa',  test:(lat,lon)=>lat>=20},
    {key:'west',     label:'W Africa',  test:(lat,lon)=>lat<20&&lon<15},
    {key:'central',  label:'C Africa',  test:(lat,lon)=>lat<10&&lat>-10&&lon>=15},
    {key:'east',     label:'E Africa',  test:(lat,lon)=>lat>=-10&&lat<20&&lon>=20&&lon<=50},
    {key:'south',    label:'S Africa',  test:(lat,lon)=>lat<-10},
  ],
  'Mid East': [
    {key:'levant',   label:'Levant',    test:(lat,lon)=>lon<45&&lat>=20},
    {key:'gulf',     label:'Gulf',      test:(lat,lon)=>lat<30&&lon>=45},
    {key:'iraniraq', label:'Iran/Iraq', test:(lat,lon)=>lat>=30&&lon>=44&&lon<60},
    {key:'casia',    label:'C Asia',    test:(lat,lon)=>lon>=60},
  ],
  'SE Asia': [
    {key:'neast',    label:'NE Asia',   test:(lat,lon)=>lat>=30},
    {key:'china',    label:'China',     test:(lat,lon)=>lat>=20&&lat<30&&lon>=100},
    {key:'mainland', label:'SE Mainland',test:(lat,lon)=>lat>=8&&lat<30&&lon>=85&&lon<115},
    {key:'india',    label:'India',     test:(lat,lon)=>lon<85},
    {key:'maritime', label:'Maritime',  test:(lat,lon)=>lat<20&&lon>=115},
  ],
  'Oceania': [
    {key:'australia',label:'Australia', test:(lat,lon)=>lon>112&&lon<154&&lat>-38},
    {key:'nz',       label:'NZ',        test:(lat,lon)=>lon>165||lat<-38},
    {key:'pacific',  label:'Pacific',   test:(lat,lon)=>lon>154||lon<0},
  ],
};
const AIRCRAFT = {
  'A220-100'  :{seats:110,range:3400,cost:32, fuel:82,era:2016,type:'short',     speed:520},
  'A220-300'  :{seats:140,range:3300,cost:38, fuel:83,era:2018,type:'short',     speed:520},
  'B737-800'  :{seats:162,range:3115,cost:42, fuel:72,era:1998,type:'medium',    speed:540},
  'B737 MAX 8':{seats:178,range:3550,cost:52, fuel:78,era:2017,type:'medium',    speed:542},
  'B737 MAX 10':{seats:204,range:3300,cost:58,fuel:80,era:2022,type:'medium',    speed:542},
  'A319'      :{seats:128,range:4200,cost:38, fuel:68,era:1996,type:'medium',    speed:530},
  'A320'      :{seats:180,range:4180,cost:45, fuel:70,era:1988,type:'medium',    speed:530},
  'A320neo'   :{seats:194,range:4000,cost:52, fuel:79,era:2016,type:'medium',    speed:533},
  'A321XLR'   :{seats:220,range:5400,cost:62, fuel:81,era:2024,type:'medium',    speed:533},
  'B767-300ER':{seats:218,range:6025,cost:55, fuel:64,era:1988,type:'long',      speed:590},
  'B787-8'    :{seats:242,range:7355,cost:95, fuel:80,era:2011,type:'long',      speed:593},
  'B787-9'    :{seats:296,range:7530,cost:110,fuel:82,era:2014,type:'long',      speed:593},
  'B787-10'   :{seats:336,range:6430,cost:118,fuel:84,era:2018,type:'long',      speed:593},
  'A330-300'  :{seats:300,range:6350,cost:90, fuel:66,era:1994,type:'long',      speed:572},
  'A330neo'   :{seats:310,range:7200,cost:100,fuel:78,era:2018,type:'long',      speed:572},
  'A350-900'  :{seats:369,range:8100,cost:130,fuel:84,era:2015,type:'long',      speed:590},
  'A350-1000' :{seats:410,range:8700,cost:148,fuel:85,era:2017,type:'long',      speed:590},
  'B747-400'  :{seats:416,range:7670,cost:150,fuel:56,era:1989,type:'jumbo',     speed:615},
  'B747-8I'   :{seats:467,range:8000,cost:175,fuel:72,era:2012,type:'jumbo',     speed:614},
  'A380-800'  :{seats:555,range:8200,cost:195,fuel:64,era:2007,type:'jumbo',     speed:590},
  'B777-300ER':{seats:396,range:7370,cost:145,fuel:70,era:2004,type:'jumbo',     speed:615},
  'B777X'     :{seats:426,range:8200,cost:165,fuel:82,era:2025,type:'jumbo',     speed:617},
  'Overture'  :{seats:80, range:4250,cost:180,fuel:30,era:2029,type:'supersonic',speed:1300},
  // ── Vintage fleet (Eras Campaign 1970→2030) — hidden in modern modes ──
  'B707-320B' :{seats:147,range:3735,cost:30, fuel:34,era:1962,type:'long',      speed:525,vintage:true},
  'DC-8-63'   :{seats:220,range:4500,cost:34, fuel:36,era:1967,type:'long',      speed:521,vintage:true},
  'B727-200'  :{seats:155,range:2550,cost:24, fuel:40,era:1967,type:'medium',    speed:515,vintage:true},
  'DC-9-30'   :{seats:105,range:1635,cost:16, fuel:46,era:1967,type:'short',     speed:500,vintage:true},
  'B737-200'  :{seats:120,range:2300,cost:20, fuel:48,era:1968,type:'short',     speed:500,vintage:true},
  'B747-100'  :{seats:366,range:4620,cost:70, fuel:36,era:1970,type:'jumbo',     speed:600,vintage:true},
  'B747-200'  :{seats:380,range:6560,cost:85, fuel:38,era:1971,type:'jumbo',     speed:600,vintage:true},
  'DC-10-30'  :{seats:270,range:5790,cost:60, fuel:42,era:1972,type:'long',      speed:564,vintage:true},
  'L-1011'    :{seats:256,range:4250,cost:58, fuel:43,era:1972,type:'long',      speed:558,vintage:true},
  'A300B4'    :{seats:247,range:3300,cost:48, fuel:52,era:1974,type:'long',      speed:540,vintage:true},
  'Concorde'  :{seats:100,range:4500,cost:120,fuel:14,era:1976,type:'supersonic',speed:1350,vintage:true,retired:2003},
  'MD-80'     :{seats:155,range:2880,cost:30, fuel:52,era:1980,type:'medium',    speed:504,vintage:true},
  'B757-200'  :{seats:200,range:4488,cost:42, fuel:60,era:1983,type:'medium',    speed:530,vintage:true},
  'B767-200ER':{seats:181,range:6385,cost:52, fuel:62,era:1984,type:'long',      speed:590,vintage:true},
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKING-AIRCRAFT-IDENTITY-001 — aircraft names, ids, and visual themes
// Keeps original AIRCRAFT keys intact for save compatibility.
// ═══════════════════════════════════════════════════════════════════════════
const AIRCRAFT_IDENTITY = {
  "A220-100": {
    "id": "SKY-110",
    "name": "Skylark 110",
    "theme": "nimble city-hopper",
    "color1": "#1E3A8A",
    "color2": "#38BDF8",
    "accent": "#A7F3D0",
    "icon": "\ud83d\udee9",
    "role": "Low-cost short-haul starter for thin city pairs and quick frequency growth."
  },
  "A220-300": {
    "id": "SKY-140",
    "name": "Skylark 140",
    "theme": "efficient regional growth",
    "color1": "#0F766E",
    "color2": "#5EEAD4",
    "accent": "#FDE68A",
    "icon": "\ud83d\udee9",
    "role": "A bigger Skylark for regional expansion with better seat economics."
  },
  "B737-800": {
    "id": "MTR-162",
    "name": "MetroRunner 162",
    "theme": "workhorse domestic trunk",
    "color1": "#1E293B",
    "color2": "#3B82F6",
    "accent": "#FBBF24",
    "icon": "\u2708",
    "role": "Reliable backbone jet for dense domestic routes and early hub building."
  },
  "B737 MAX 8": {
    "id": "MTX-178",
    "name": "MetroJet 178",
    "theme": "modern narrowbody efficiency",
    "color1": "#0B1220",
    "color2": "#22C55E",
    "accent": "#60A5FA",
    "icon": "\u2708",
    "role": "Efficient medium-haul upgrade for competitive city pairs."
  },
  "B737 MAX 10": {
    "id": "MTS-204",
    "name": "MetroJet Stretch 204",
    "theme": "high-density narrowbody",
    "color1": "#111827",
    "color2": "#34D399",
    "accent": "#F472B6",
    "icon": "\u2708",
    "role": "Dense short-to-medium haul capacity without jumping to widebody costs."
  },
  "A319": {
    "id": "CTA-128",
    "name": "CityArrow 128",
    "theme": "premium thin-market connector",
    "color1": "#312E81",
    "color2": "#818CF8",
    "accent": "#F9A8D4",
    "icon": "\u2708",
    "role": "Small flexible narrowbody for longer thin routes and premium regional service."
  },
  "A320": {
    "id": "CTL-180",
    "name": "CityLink 180",
    "theme": "balanced network core",
    "color1": "#0F172A",
    "color2": "#06B6D4",
    "accent": "#E5E7EB",
    "icon": "\u2708",
    "role": "Balanced baseline aircraft for most early and mid-game routes."
  },
  "A320neo": {
    "id": "ECO-194",
    "name": "EcoLink 194",
    "theme": "clean high-frequency network",
    "color1": "#064E3B",
    "color2": "#22C55E",
    "accent": "#BAE6FD",
    "icon": "\u2708",
    "role": "Fuel-smart A320 successor for higher margins on mature routes."
  },
  "A321XLR": {
    "id": "HLX-220",
    "name": "Horizon XLR 220",
    "theme": "long-reach narrowbody",
    "color1": "#172554",
    "color2": "#2563EB",
    "accent": "#F97316",
    "icon": "\ud83d\udeeb",
    "role": "Opens long thin routes without committing widebody capital."
  },
  "B767-300ER": {
    "id": "BRG-218",
    "name": "BridgeLiner 218",
    "theme": "classic transatlantic bridge",
    "color1": "#1F2937",
    "color2": "#60A5FA",
    "accent": "#C084FC",
    "icon": "\ud83d\udeeb",
    "role": "Affordable long-haul bridge aircraft for early international expansion."
  },
  "B787-8": {
    "id": "NGD-242",
    "name": "Nightglide 242",
    "theme": "quiet long-haul pioneer",
    "color1": "#020617",
    "color2": "#6366F1",
    "accent": "#67E8F9",
    "icon": "\ud83c\udf19",
    "role": "Efficient long-haul aircraft for prestige routes with moderate capacity."
  },
  "B787-9": {
    "id": "NGD-296",
    "name": "Nightglide 296",
    "theme": "flagship global reach",
    "color1": "#030712",
    "color2": "#8B5CF6",
    "accent": "#38BDF8",
    "icon": "\ud83c\udf19",
    "role": "High-efficiency global route builder with stronger capacity."
  },
  "B787-10": {
    "id": "NGD-336",
    "name": "Nightglide 336",
    "theme": "dense long-haul profit",
    "color1": "#111827",
    "color2": "#7C3AED",
    "accent": "#A7F3D0",
    "icon": "\ud83c\udf19",
    "role": "Long-haul profit machine for dense routes with slightly less range."
  },
  "A330-300": {
    "id": "ATL-300",
    "name": "Atlantic 300",
    "theme": "widebody gateway",
    "color1": "#0C4A6E",
    "color2": "#38BDF8",
    "accent": "#FDE047",
    "icon": "\ud83d\udeeb",
    "role": "Widebody starter for ocean-crossing routes with strong capacity."
  },
  "A330neo": {
    "id": "ATN-310",
    "name": "Atlantic Neo 310",
    "theme": "modern widebody economy",
    "color1": "#064E3B",
    "color2": "#2DD4BF",
    "accent": "#FACC15",
    "icon": "\ud83d\udeeb",
    "role": "Efficient widebody refresh for profitable international networks."
  },
  "A350-900": {
    "id": "AUR-369",
    "name": "Aurora 369",
    "theme": "premium global flagship",
    "color1": "#581C87",
    "color2": "#C084FC",
    "accent": "#93C5FD",
    "icon": "\ud83c\udf0c",
    "role": "High-end global flagship for prestige long-haul expansion."
  },
  "A350-1000": {
    "id": "AUX-410",
    "name": "Aurora XL 410",
    "theme": "ultra-premium capacity",
    "color1": "#4C1D95",
    "color2": "#A855F7",
    "accent": "#F0ABFC",
    "icon": "\ud83c\udf0c",
    "role": "Large premium widebody for the biggest intercontinental markets."
  },
  "B747-400": {
    "id": "SKQ-416",
    "name": "SkyQueen 416",
    "theme": "classic jumbo royalty",
    "color1": "#7C2D12",
    "color2": "#F59E0B",
    "accent": "#FDE68A",
    "icon": "\ud83d\udc51",
    "role": "Iconic jumbo for mega-hubs and high-demand trunk routes."
  },
  "B747-8I": {
    "id": "SQ8-467",
    "name": "SkyQueen Eight 467",
    "theme": "modern jumbo prestige",
    "color1": "#78350F",
    "color2": "#FBBF24",
    "accent": "#F472B6",
    "icon": "\ud83d\udc51",
    "role": "Modern high-capacity prestige aircraft for global hub dominance."
  },
  "A380-800": {
    "id": "CTD-555",
    "name": "CloudCitadel 555",
    "theme": "flying airport palace",
    "color1": "#0F172A",
    "color2": "#F97316",
    "accent": "#FDE047",
    "icon": "\ud83c\udff0",
    "role": "Massive capacity flagship for slot-constrained mega routes."
  },
  "B777-300ER": {
    "id": "TTN-396",
    "name": "Titan 396",
    "theme": "heavy long-haul warrior",
    "color1": "#1E1B4B",
    "color2": "#EF4444",
    "accent": "#FDBA74",
    "icon": "\ud83e\uddbe",
    "role": "Powerful jumbo-category aircraft for premium dense long-haul markets."
  },
  "B777X": {
    "id": "TTX-426",
    "name": "Titan X 426",
    "theme": "next-gen heavy flagship",
    "color1": "#020617",
    "color2": "#DC2626",
    "accent": "#22D3EE",
    "icon": "\ud83e\uddbe",
    "role": "Next-generation heavy flagship for the most profitable global routes."
  },
  "Overture": {
    "id": "CMT-080",
    "name": "Comet 80",
    "theme": "supersonic luxury dart",
    "color1": "#312E81",
    "color2": "#EC4899",
    "accent": "#FDE68A",
    "icon": "\ud83d\ude80",
    "role": "Ultra-premium speed product for rich time-sensitive travelers."
  },
  "B707-320B": {
    "id": "JTA-147",
    "name": "JetAge 147",
    "theme": "dawn of the jet age",
    "color1": "#374151",
    "color2": "#A3A3A3",
    "accent": "#F59E0B",
    "icon": "\ud83d\udd70",
    "role": "Vintage long-haul pioneer for early eras campaigns."
  },
  "DC-8-63": {
    "id": "SLV-220",
    "name": "Silverline 220",
    "theme": "silver-age intercontinental",
    "color1": "#334155",
    "color2": "#CBD5E1",
    "accent": "#38BDF8",
    "icon": "\ud83d\udd70",
    "role": "Vintage long-range aircraft with strong capacity for its era."
  },
  "B727-200": {
    "id": "TRJ-155",
    "name": "TriJet Runner 155",
    "theme": "three-engine city sprinter",
    "color1": "#3F3F46",
    "color2": "#F97316",
    "accent": "#FDE047",
    "icon": "\ud83d\udd70",
    "role": "Vintage medium-haul workhorse for smaller airport networks."
  },
  "DC-9-30": {
    "id": "PKJ-105",
    "name": "PocketJet 105",
    "theme": "short-field city shuttle",
    "color1": "#1F2937",
    "color2": "#94A3B8",
    "accent": "#34D399",
    "icon": "\ud83d\udd70",
    "role": "Compact vintage short-haul aircraft for small markets."
  },
  "B737-200": {
    "id": "RMT-120",
    "name": "RetroMetro 120",
    "theme": "early narrowbody commuter",
    "color1": "#27272A",
    "color2": "#60A5FA",
    "accent": "#FBBF24",
    "icon": "\ud83d\udd70",
    "role": "Classic starter jet for early domestic expansion."
  },
  "B747-100": {
    "id": "CQN-366",
    "name": "ClassicQueen 366",
    "theme": "first-generation jumbo",
    "color1": "#713F12",
    "color2": "#D97706",
    "accent": "#FDE68A",
    "icon": "\ud83d\udc51",
    "role": "Early jumbo icon for huge routes in the Eras campaign."
  },
  "B747-200": {
    "id": "CQ2-380",
    "name": "ClassicQueen 380",
    "theme": "longer-range jumbo classic",
    "color1": "#78350F",
    "color2": "#F59E0B",
    "accent": "#FEF3C7",
    "icon": "\ud83d\udc51",
    "role": "Stronger classic jumbo for long-range high-demand eras routes."
  },
  "DC-10-30": {
    "id": "TOC-270",
    "name": "TriOcean 270",
    "theme": "tri-jet ocean crosser",
    "color1": "#1E293B",
    "color2": "#0284C7",
    "accent": "#F97316",
    "icon": "\ud83d\udeeb",
    "role": "Vintage widebody for ocean routes before modern twins dominate."
  },
  "L-1011": {
    "id": "STL-256",
    "name": "Starlift 256",
    "theme": "polished tri-jet service",
    "color1": "#312E81",
    "color2": "#818CF8",
    "accent": "#FDE68A",
    "icon": "\u2728",
    "role": "Comfort-focused vintage widebody with a prestige service feel."
  },
  "A300B4": {
    "id": "EUB-247",
    "name": "EuroBridge 247",
    "theme": "early twin-aisle efficiency",
    "color1": "#0F766E",
    "color2": "#67E8F9",
    "accent": "#FACC15",
    "icon": "\ud83d\udeeb",
    "role": "Early widebody twin for efficient regional trunk expansion."
  },
  "Concorde": {
    "id": "MCH-100",
    "name": "Mach Crown 100",
    "theme": "supersonic royal service",
    "color1": "#111827",
    "color2": "#A855F7",
    "accent": "#FDE047",
    "icon": "\u26a1",
    "role": "Prestige supersonic product with extreme speed and expensive operations."
  },
  "MD-80": {
    "id": "TTL-155",
    "name": "T-Tail 155",
    "theme": "lean 1980s commuter",
    "color1": "#374151",
    "color2": "#22C55E",
    "accent": "#FBBF24",
    "icon": "\u2708",
    "role": "Vintage medium-haul workhorse with practical economics."
  },
  "B757-200": {
    "id": "RKT-200",
    "name": "RocketRoute 200",
    "theme": "hot-rod narrowbody",
    "color1": "#1E293B",
    "color2": "#EF4444",
    "accent": "#FACC15",
    "icon": "\ud83d\ude80",
    "role": "Powerful narrowbody for long thin routes and performance-limited airports."
  },
  "B767-200ER": {
    "id": "BRC-181",
    "name": "BridgeClassic 181",
    "theme": "early efficient long-haul twin",
    "color1": "#0C4A6E",
    "color2": "#38BDF8",
    "accent": "#C084FC",
    "icon": "\ud83d\udeeb",
    "role": "Classic long-haul twin for early global network building."
  }
};
function acIdentity(model) {
  const base = AIRCRAFT_IDENTITY[model] || {};
  const ac = AIRCRAFT[model] || {};
  return {
    id: base.id || String(model||'AC').toUpperCase().replace(/[^A-Z0-9]+/g,'-'),
    name: base.name || model,
    theme: base.theme || ((ac.type||'aircraft') + ' service'),
    color1: base.color1 || '#0F172A',
    color2: base.color2 || '#3B82F6',
    accent: base.accent || '#E5E7EB',
    icon: base.icon || (ac.type==='supersonic'?'🚀':ac.type==='jumbo'?'👑':ac.type==='long'?'🛫':'✈'),
    role: base.role || 'General-purpose fleet aircraft.',
    model
  };
}
function acDisplayName(model) { const i = acIdentity(model); return i.name; }
function acIdentityLine(model) { const i = acIdentity(model); return `${i.id} · ${i.theme}`; }
function acBrandBadge(model) { const i = acIdentity(model); return `<span class="bp-tag" style="border-color:${i.accent}66;color:${i.accent}">${i.id}</span>`; }

// ── Aircraft availability gating ─────────────────────────────────────────────
// Eras mode: only planes that exist in the current year (small teaser window).
// Modern modes: hide the vintage fleet entirely (unchanged behavior otherwise).
function acListed(a) {
  if (!a) return false;
  if (STATE && STATE.gameType === 'eras') {
    if (a.retired && STATE.year > a.retired) return false;   // e.g. Concorde after 2003
    return a.era <= (STATE.year || 1970) + 5;                // 5-yr "coming soon" teaser
  }
  return !a.vintage;
}
const BUSINESSES = {
  'City Hotel':{icon:'🏨',cat:'Hotel',income:8,cost:40,desc:'+Pass to city'},
  'Resort Hotel':{icon:'🏖',cat:'Hotel',income:6,cost:30,desc:'+Tourism'},
  'Grand Hotel':{icon:'🏰',cat:'Hotel',income:12,cost:70,desc:'Max pass boost'},
  'Travel Agency':{icon:'🗺',cat:'Travel',income:5,cost:20,desc:'+Campaign success'},
  'Amusement Park':{icon:'🎡',cat:'Amuse',income:7,cost:35,desc:'+Tourism level'},
  'Concert Hall':{icon:'🎶',cat:'Culture',income:4,cost:25,desc:'Culture campaign'},
  'Museum':{icon:'🏛',cat:'Culture',income:4,cost:22,desc:'Culture campaign'},
  'Shuttle Service':{icon:'🚌',cat:'Service',income:3,cost:15,desc:'+City pop'},
  'Ski Resort':{icon:'⛷',cat:'Amuse',income:9,cost:50,desc:'+Tourism,+Load'},
  'Golf Course':{icon:'⛳',cat:'Amuse',income:5,cost:28,desc:'+Business traffic'},
};
// ═══════════════════════════════════════════════════════════════════════════
// HUB NETWORK — CONNECTING TRAFFIC  (hub-and-spoke demand synergy)
// ═══════════════════════════════════════════════════════════════════════════
function hubSpokes(hub) {
  return (STATE.routes || []).filter(r => r.from === hub || r.to === hub).length;
}
// Each endpoint that is one of your hubs feeds transfer passengers onto this
// route, proportional to how many OTHER routes connect at that hub.
// Long-haul routes benefit most (feeders fill big planes).
function connectingTrafficMult(r) {
  if (!STATE || !STATE.hubs || !STATE.hubs.length) return 1;
  const dist = getDistance(r.from, r.to);
  const lh = isLongHaul(dist);
  let bonus = 0;
  [r.from, r.to].forEach(end => {
    if (!STATE.hubs.includes(end)) return;
    const spokes = Math.max(0, hubSpokes(end) - 1);   // exclude this route itself
    let b = Math.min(0.30, spokes * 0.02);            // +2% per spoke, cap +30%
    if (lh) b = Math.min(0.42, b * 1.4);              // feeders matter most on long-haul
    bonus += b;
  });
  return 1 + Math.min(0.60, bonus);
}
function hubNetworkBonusPct(hub) {
  const spokes = Math.max(0, hubSpokes(hub) - 1);
  return Math.round(Math.min(0.30, spokes * 0.02) * 100);
}
// ═══════════════════════════════════════════════════════════════════════════
// ERAS CAMPAIGN — 1970 → 2030, quarterly turns, history unfolds
// ═══════════════════════════════════════════════════════════════════════════
const ERAS_SCENARIO = {
  id: 99, year: 1970, name: 'Eras Campaign',
  desc: 'Six decades of aviation history. Start in the golden age of the jet set; survive every shock the world throws at you.',
  cash: 600, loan: 500,
  flavor: 'From the 747\'s debut to the supersonic revival — oil crises, deregulation, recessions and booms, all on schedule.',
  startRoutes: 0, challenge: 'build the greatest airline in history by 2030',
};
const ERA_TIMELINE = [
  { y:1970, head:'🐋 THE JUMBO AGE — Boeing 747 enters service. Mass air travel begins.', fx:s=>{} },
  { y:1973, head:'🛢 OPEC OIL EMBARGO — fuel prices skyrocket worldwide.', flash:'🛢 1973 Oil Crisis — fuel +80%',
    fx:s=>{ addTimedEffect('era_oil_73','fuel_crisis',1.8,null,null,8); s.fuelMod=1.8; s._fuelLock=true; } },
  { y:1976, head:'⚡ CONCORDE ENTERS SERVICE — supersonic passenger flight is real.', fx:s=>{} },
  { y:1978, head:'📜 AIRLINE DEREGULATION — fares freed, demand surges, new carriers everywhere.', flash:'📜 Deregulation — demand +15%',
    fx:s=>{ addTimedEffect('era_dereg_78','macro_boom',1.15,null,null,10); } },
  { y:1986, head:'🛢 OIL GLUT — crude collapses. Cheap fuel era begins.', flash:'🛢 1986 Oil Glut — fuel −30%',
    fx:s=>{ addTimedEffect('era_glut_86','fuel_glut',0.70,null,null,8); } },
  { y:1991, head:'⚔ GULF WAR — travel demand slumps, fuel spikes.', flash:'⚔ Gulf War — demand −15%, fuel +40%',
    fx:s=>{ addTimedEffect('era_gulf_rec','recession',0.85,null,null,5); addTimedEffect('era_gulf_fuel','fuel_crisis',1.4,null,null,4); s.fuelMod=Math.max(s.fuelMod,1.4); s._fuelLock=true; } },
  { y:1997, head:'📉 ASIAN FINANCIAL CRISIS — SE Asia traffic collapses.', flash:'📉 Asian Crisis — SE Asia −25%',
    fx:s=>{ addTimedEffect('era_asia_97','regional_demand',0.75,'SE Asia',null,8); } },
  { y:2001, head:'🌐 GLOBAL SHOCK — aviation\'s darkest year. Demand craters worldwide.', flash:'🌐 2001 — global demand −30%',
    fx:s=>{ addTimedEffect('era_shock_01','recession',0.70,null,null,6); } },
  { y:2004, head:'💺 LOW-COST REVOLUTION — budget carriers reshape the market. Flying is for everyone.', flash:'💺 LCC boom — demand +12%',
    fx:s=>{ addTimedEffect('era_lcc_04','macro_boom',1.12,null,null,8); } },
  { y:2008, head:'🏦 GLOBAL FINANCIAL CRISIS — business travel evaporates.', flash:'🏦 2008 Crisis — demand −22%',
    fx:s=>{ addTimedEffect('era_gfc_08','recession',0.78,null,null,8); } },
  { y:2014, head:'🛢 SHALE GLUT — oil halves. Margins fatten across the industry.', flash:'🛢 Cheap oil — fuel −25%',
    fx:s=>{ addTimedEffect('era_shale_14','fuel_glut',0.75,null,null,8); } },
  { y:2020, head:'😷 GLOBAL PANDEMIC — borders close. Aviation grinds to a halt.', flash:'😷 Pandemic — demand −65%',
    fx:s=>{ addTimedEffect('era_pandemic_20','pandemic',0.35,null,null,6); s._hadPandemic=true; } },
  { y:2024, head:'🧳 REVENGE TRAVEL — pent-up demand explodes. Record bookings everywhere.', flash:'🧳 Travel boom — demand +20%',
    fx:s=>{ addTimedEffect('era_boom_24','macro_boom',1.20,null,null,8); } },
  { y:2029, head:'⚡ SUPERSONIC REVIVAL — Overture enters service. The Concorde dream returns.', fx:s=>{} },
];
function fireEraEvents() {
  if (STATE.gameType !== 'eras') return;
  ERA_TIMELINE.filter(e => e.y === STATE.year).forEach(e => {
    addEvent(e.flash ? 'warn' : 'neutral', e.head);
    if (e.flash) showFlash(e.flash);
    try { e.fx(STATE); } catch(err) {}
  });
  // New aircraft entering service this year
  Object.entries(AIRCRAFT).forEach(([n, a]) => {
    if (a.era === STATE.year) addEvent('good', `🛬 NEW AIRCRAFT: ${n} enters service — ${a.seats} seats · ${a.range.toLocaleString()}mi range · $${a.cost}M.`);
    if (a.retired && a.retired === STATE.year) addEvent('warn', `🛑 ${n} retired from service — no longer available for purchase.`);
  });
}
// ═══════════════════════════════════════════════════════════════════════════
// PILOT PROFILE — achievements, lifetime stats, daily streaks (persists across runs)
// ═══════════════════════════════════════════════════════════════════════════
const PROFILE_KEY = 'ae_profile_v1';
function loadProfile() {
  try { const raw = localStorage.getItem(PROFILE_KEY); if (raw) { const p = JSON.parse(raw); p.ach=p.ach||{}; p.lifetime=p.lifetime||{}; p.daily=p.daily||{}; return p; } } catch(e) {}
  return { ach:{}, lifetime:{runs:0,wins:0,pax:0,bestValue:0}, daily:{streak:0,lastDate:null,best:{}} };
}
let PROFILE = loadProfile();
function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(PROFILE)); } catch(e) {} }
const ACHIEVEMENTS = [
  { id:'first_route', cat:'network', icon:'🛫', name:'Wheels Up',           desc:'Open your first route',                       check:s=>(s.routes||[]).length>=1 },
  { id:'ten_routes', cat:'network', icon:'🕸',  name:'Network Builder',     desc:'Operate 10 routes at once',                   check:s=>(s.routes||[]).length>=10 },
  { id:'t5_routes', cat:'network', icon:'🌐', name:'Sky Web',             desc:'Operate 25 routes at once',                   check:s=>(s.routes||[]).length>=25 },
  { id:'second_hub', cat:'network', icon:'🏢', name:'Beachhead',           desc:'Hold hubs in two different regions',          check:s=>new Set((s.hubs||[]).map(h=>CITIES[h]?.region)).size>=2 },
  { id:'all_regions', cat:'network', icon:'🗺',  name:'Globe Spanner',       desc:'Fly routes touching all 7 regions',           check:s=>new Set((s.routes||[]).flatMap(r=>[CITIES[r.from]?.region,CITIES[r.to]?.region]).filter(Boolean)).size>=7 },
  { id:'value_1b', cat:'business', icon:'💰', name:'Unicorn',             desc:'Reach $1,000M company value',                 check:s=>(s.companyValue||0)>=1000 },
  { id:'value_5b', cat:'business', icon:'👑', name:'Titan of the Skies',  desc:'Reach $5,000M company value',                 check:s=>(s.companyValue||0)>=5000 },
  { id:'pax_1m', cat:'business', icon:'👥', name:'Million Mile Club',   desc:'Carry 1M passengers in a single year',        check:s=>Math.max(s.paxThisYear||0,s.totalPaxYear||0)>=1e6 },
  { id:'pax_10m', cat:'business', icon:'🚀', name:'Mass Transit',        desc:'Carry 10M passengers in a single year',       check:s=>Math.max(s.paxThisYear||0,s.totalPaxYear||0)>=1e7 },
  { id:'career_50m', cat:'business', icon:'🌍', name:'Half the Planet',     desc:'Carry 50M passengers in one career',          check:s=>(s._lifetimePax||0)>=5e7 },
  { id:'fleet_20', cat:'fleet', icon:'✈',  name:'Armada',              desc:'Own 20 aircraft',                             check:s=>Object.values(s.planes||{}).reduce((t,p)=>t+(p.owned||0),0)>=20 },
  { id:'jumbo', cat:'fleet', icon:'🐋', name:'Queen of the Skies',  desc:'Own a jumbo jet',                             check:s=>Object.entries(s.planes||{}).some(([n,p])=>(p.owned||0)>0&&AIRCRAFT[n]?.type==='jumbo') },
  { id:'supersonic', cat:'fleet', icon:'⚡',  name:'Boom',                desc:'Own a supersonic aircraft',                   check:s=>Object.entries(s.planes||{}).some(([n,p])=>(p.owned||0)>0&&AIRCRAFT[n]?.type==='supersonic') },
  { id:'mega_hub', cat:'network', icon:'🔁', name:'Fortress Hub',        desc:'Run 12+ routes through a single hub',         check:s=>(s.hubs||[]).some(h=>hubSpokes(h)>=12) },
  { id:'alliance', cat:'network', icon:'🤝', name:'Code Share',          desc:'Form an alliance with a rival',               check:s=>!!s._everAllied },
  { id:'war_chest', cat:'business', icon:'💵', name:'War Chest',           desc:'Hold $2,000M in cash',                        check:s=>(s.cash||0)>=2000 },
  { id:'storm', cat:'victories', icon:'😷', name:'Through the Storm',   desc:'Survive a pandemic with cash in the bank',    check:s=>!!s._hadPandemic&&(s.cash||0)>0&&!s.gameOver },
  { id:'win_any', cat:'victories', icon:'🏆', name:'Mission Complete',    desc:'Win any game',                                check:()=>false },
  { id:'win_domination', cat:'victories', icon:'⚔',  name:'World Conqueror',     desc:'Win a Domination game',                       check:()=>false },
  { id:'eras_complete', cat:'victories', icon:'🕰',  name:'Sixty Years Aloft',   desc:'Complete the 1970→2030 Eras Campaign',        check:()=>false },
  { id:'daily_3streak', cat:'victories', icon:'🔥', name:'Regular',             desc:'Complete the Daily Challenge 3 days running', check:()=>false },
];
window.__runUnlocks = window.__runUnlocks || [];
function unlockAchievement(id) {
  if (PROFILE.ach[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id); if (!a) return;
  PROFILE.ach[id] = Date.now();
  saveProfile();
  window.__runUnlocks.push(id);
  try { addEvent('good', `🏆 ACHIEVEMENT UNLOCKED: ${a.icon} ${a.name} — ${a.desc}.`); } catch(e) {}
  try { showFlash(`🏆 ${a.name} unlocked!`); } catch(e) { try { flashIntro(`🏆 ${a.name} unlocked!`); } catch(e2) {} }
}
function checkAchievements() {
  if (!STATE) return;
  ACHIEVEMENTS.forEach(a => {
    if (PROFILE.ach[a.id]) return;
    let ok = false; try { ok = a.check(STATE); } catch(e) {}
    if (ok) unlockAchievement(a.id);
  });
}
let _recTab = 'overview';
const REC_TABS = [
  ['overview','📊 Overview'], ['network','🗺 Network'], ['fleet','✈ Fleet'],
  ['business','💰 Business'], ['victories','🏆 Victories'],
];
function recAchCards(cat){
  return ACHIEVEMENTS.filter(a => a.cat === cat).map(a => {
    const got = !!PROFILE.ach[a.id];
    return `<div style="border:1px solid ${got?'rgba(255,207,90,0.45)':'var(--border)'};border-radius:8px;padding:10px 11px;background:${got?'rgba(255,207,90,0.07)':'rgba(0,0,0,0.25)'};opacity:${got?1:0.55};display:flex;gap:10px;align-items:flex-start">
      <div style="font-size:22.6px;filter:${got?'none':'grayscale(1)'};flex-shrink:0">${a.icon}</div>
      <div style="min-width:0">
        <div style="font-size:12.4px;font-weight:700;color:${got?'var(--accent2)':'var(--muted)'}">${a.name} ${got?'<span style="font-size:10.2px;color:var(--profit)">✓</span>':''}</div>
        <div style="font-size:11.3px;color:var(--muted2);line-height:1.5;margin-top:2px">${a.desc}</div>
      </div>
    </div>`;
  }).join('');
}
function recBody(){
  const lt = PROFILE.lifetime || {};
  const dl = PROFILE.daily || {};
  const bestDaily = Object.values(dl.best || {}).reduce((m,v)=>Math.max(m,v),0);
  if (_recTab === 'overview') {
    const stat = (l,v,c)=>`<div style="background:rgba(0,0,0,0.35);border:1px solid var(--border);border-radius:8px;padding:11px 8px;text-align:center">
      <div style="font-size:11.3px;color:var(--muted2);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">${l}</div>
      <div style="font-size:18.1px;font-weight:700;color:${c||'var(--text)'}">${v}</div></div>`;
    const catBar = (cat,label) => {
      const all = ACHIEVEMENTS.filter(a=>a.cat===cat);
      const got = all.filter(a=>PROFILE.ach[a.id]).length;
      return `<div onclick="recSwitch('${cat}')" style="display:flex;align-items:center;gap:10px;padding:9px 11px;background:rgba(0,0,0,0.25);border:1px solid var(--border);border-radius:8px;margin-bottom:6px">
        <span style="font-size:11.9px;font-weight:700;color:var(--text);flex:0 0 110px">${label}</span>
        <div style="flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.round(got/all.length*100)}%;background:var(--accent2)"></div></div>
        <span style="font-size:11.3px;font-family:'DM Mono';color:${got===all.length?'var(--profit)':'var(--muted2)'};flex-shrink:0">${got}/${all.length}</span>
        <span style="color:var(--muted);font-size:12.4px">›</span>
      </div>`;
    };
    return `
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px">
        ${stat('Games played', lt.runs||0)}
        ${stat('Victories', lt.wins||0, 'var(--profit)')}
        ${stat('Career pass', (lt.pax||0)>=1e6?((lt.pax/1e6).toFixed(1)+'M'):(lt.pax||0).toLocaleString(), 'var(--accent)')}
        ${stat('Best value', '$'+(lt.bestValue||0).toLocaleString()+'M', 'var(--purple)')}
        ${stat('Daily streak', '🔥 '+(dl.streak||0), 'var(--accent2)')}
      </div>
      ${bestDaily ? `<div style="font-size:11.3px;color:var(--muted2);margin-bottom:12px">Best daily challenge score: <b style="color:var(--accent2)">$${bestDaily.toLocaleString()}M</b></div>` : ''}
      <div style="font-size:11.3px;color:var(--muted2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Achievements by category</div>
      ${catBar('network','🗺 Network')}
      ${catBar('fleet','✈ Fleet')}
      ${catBar('business','💰 Business')}
      ${catBar('victories','🏆 Victories')}`;
  }
  const all = ACHIEVEMENTS.filter(a=>a.cat===_recTab);
  const got = all.filter(a=>PROFILE.ach[a.id]).length;
  return `
    <div style="font-size:11.3px;color:var(--muted2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">${got}/${all.length} unlocked</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${recAchCards(_recTab)}</div>`;
}
function recSwitch(tab){
  _recTab = tab;
  const ovl = document.getElementById('records-ovl'); if (!ovl) return;
  ovl.querySelectorAll('.rec-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const body = document.getElementById('rec-body'); if (body) body.innerHTML = recBody();
}
function openRecords() {
  let ovl = document.getElementById('records-ovl');
  if (ovl) ovl.remove();
  _recTab = 'overview';
  const unlocked = Object.keys(PROFILE.ach).length;
  ovl = document.createElement('div');
  ovl.id = 'records-ovl';
  ovl.style.cssText = 'position:fixed;inset:0;z-index:9995;background:rgba(0,0,0,0.78);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px';
  ovl.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border2);border-radius:12px;max-width:680px;width:100%;max-height:84vh;display:flex;flex-direction:column;padding:22px 24px;box-shadow:var(--shadow)" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-shrink:0">
      <div style="font-family:'Bebas Neue';font-size:27.1px;letter-spacing:3px;color:var(--accent2)">🏆 PILOT RECORDS <span style="font-size:14.7px;color:var(--muted2);letter-spacing:1px">${unlocked}/${ACHIEVEMENTS.length}</span></div>
      <button class="action-btn" style="padding:5px 14px" onclick="document.getElementById('records-ovl').remove()">✕ Close</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px;flex-shrink:0">
      ${REC_TABS.map(([id,label])=>`<div class="region-tab rec-tab ${id===_recTab?'active':''}" data-tab="${id}" onclick="recSwitch('${id}')">${label}</div>`).join('')}
    </div>
    <div id="rec-body" style="overflow-y:auto;min-height:0">${recBody()}</div>
  </div>`;
  ovl.onclick = () => ovl.remove();
  document.body.appendChild(ovl);
}
const EVENTS_AIRPORT = [
  { id:'runway_closure', type:'bad', dur:3,
    text:'🚧 Runway closure at {city} — capacity cut 40% for {dur} months.',
    fx:'runway_closure', mag:0.6 },
  { id:'terminal_fire', type:'bad', dur:2,
    text:'🔥 Terminal fire at {city}! All routes suspended for {dur} months.',
    fx:'terminal_fire', mag:0 },
  { id:'slot_freeze', type:'bad', dur:4,
    text:'🚫 Slot freeze at {city} — no new routes allowed for {dur} months.',
    fx:'slot_freeze', mag:1 },
  { id:'airport_expansion', type:'good', dur:0,
    text:'🏗 Airport expansion complete at {city} — +40 slots!',
    fx:'slots', mag:40 },
  { id:'new_terminal', type:'good', dur:0,
    text:'✈ New terminal opens at {city} — capacity surges!',
    fx:'slots', mag:60 },
  { id:'second_airport', type:'neutral', dur:0,
    text:'🛬 Second airport opens near {city} — demand splits but grows 20%.',
    fx:'second_airport', mag:1.2 },
  { id:'ground_delay_program', type:'bad', dur:2,
    text:'⏱ FAA Ground Delay Program at {city} — average 90-min holds. Handling costs +20% for {dur} months.',
    fx:'hub_congestion_surge', mag:1.2 },
  { id:'tarmac_rules', type:'bad', dur:3,
    text:'📋 Tarmac delay rules enforced at {city} — ops costs +15% for {dur} months.',
    fx:'hub_congestion_surge', mag:1.15 },
  { id:'capacity_crunch', type:'bad', dur:4,
    text:'⚡ Capacity crunch at {city} — peak-hour slot restrictions. Routes here -10% demand for {dur} months.',
    fx:'capacity_crunch', mag:0.9 },
  { id:'holiday_surge', type:'neutral', dur:2,
    text:'🎄 Holiday travel surge at {city} — demand +25% but handling costs +10%.',
    fx:'holiday_surge', mag:1.25 },
  { id:'atc_upgrade', type:'good', dur:0,
    text:'📡 New ATC radar installed at {city} — throughput up, congestion costs -15% permanently.',
    fx:'hub_decongest', mag:0.85 },
  { id:'security_overhaul', type:'bad', dur:2,
    text:'🛂 Security overhaul at {city} — passenger processing slowed, demand -8% for {dur} months.',
    fx:'capacity_crunch', mag:0.92 },
];
const EVENTS_COUNTRY = [
  { id:'sanctions', type:'bad', dur:6,
    text:'🚷 SANCTIONS imposed — routes to {city} cut to 50% revenue.',
    fx:'sanctions', mag:0.5 },
  { id:'open_skies', type:'good', dur:0,
    text:'🌐 OPEN-SKIES AGREEMENT signed with {region} — rival caps lifted!',
    fx:'open_skies', mag:1 },
  { id:'bilateral_treaty', type:'good', dur:8,
    text:'🤝 Bilateral treaty with {region} — demand +20% on international routes.',
    fx:'bilateral', mag:1.2 },
  { id:'visa_restriction', type:'bad', dur:5,
    text:'🛂 Visa restrictions tighten in {region} — tourist routes hit -30%.',
    fx:'visa_restrict', mag:0.7 },
  { id:'border_open', type:'good', dur:0,
    text:'🗺 Borders reopen in {region} — pent-up demand floods in!',
    fx:'border_open', mag:1.35 },
  { id:'nationalisation', type:'bad', dur:0,
    text:'🏛 Govt nationalises routes to {city} — revenue capped there.',
    fx:'nationalise', mag:0.65 },
];
const EVENTS_CITY = [
  { id:'city_boom', type:'good', dur:0,
    text:'📈 Economic boom in {city} — city levels up and demand surges!',
    fx:'city_levelup', mag:1 },
  { id:'tourism_spike', type:'good', dur:3,
    text:'📸 {city} named top destination — tourism +35% for {dur} months.',
    fx:'tourism_boom', mag:1.35 },
  { id:'industry_collapse', type:'bad', dur:4,
    text:'🏭 Key industry closes in {city} — econ falls, routes suffer.',
    fx:'city_econ_drop', mag:0.75 },
  { id:'expo_hosting', type:'good', dur:6,
    text:'🏛 World Expo hosted in {city} — demand +25% for {dur} months!',
    fx:'tourism_boom', mag:1.25 },
  { id:'city_strike', type:'bad', dur:2,
    text:'✊ City-wide strike in {city} — all routes disrupted for {dur} months.',
    fx:'city_strike', mag:0.5 },
];
const SEASONAL_PEAKS = {
  'N America':  [0.85,0.88,0.92,0.97,1.05,1.18,1.22,1.18,1.02,0.95,0.9,1.1],
  'S America':  [1.18,1.15,1.05,0.92,0.88,0.85,0.88,0.9,0.95,1.02,1.08,1.15],
  'Europe':     [0.78,0.8,0.92,1.02,1.1,1.2,1.28,1.25,1.08,0.95,0.82,0.88],
  'Africa':     [1.05,1.02,0.98,0.95,0.9,0.88,0.9,0.92,0.95,1.0,1.05,1.08],
  'Mid East':   [0.88,0.9,0.95,0.98,0.85,0.8,0.82,0.85,0.95,1.05,1.1,1.08],
  'SE Asia':    [1.1,1.05,0.98,0.92,0.88,0.85,0.9,0.92,0.98,1.05,1.1,1.15],
  'Oceania':    [1.15,1.12,1.05,0.95,0.88,0.82,0.8,0.85,0.92,1.0,1.08,1.12],
};
function seasonalFactor(region, month) {
  const curve = SEASONAL_PEAKS[region] || Array(12).fill(1);
  return curve[month] || 1;
}
const EVENTS_MACRO = [
  { id:'recession', type:'bad', dur:8,
    text:'📉 GLOBAL RECESSION — demand falls 25% worldwide for {dur} months.',
    fx:'recession', mag:0.75 },
  { id:'boom', type:'good', dur:6,
    text:'🚀 ECONOMIC BOOM — global demand up 20% for {dur} months!',
    fx:'macro_boom', mag:1.2 },
  { id:'stagflation', type:'bad', dur:5,
    text:'💸 STAGFLATION — fares must cut 15% while costs rise 20%.',
    fx:'stagflation', mag:1 },
  { id:'recovery', type:'good', dur:0,
    text:'📊 Economic recovery underway — consumer confidence rebounds.',
    fx:'recovery', mag:1 },
];
const EVENTS_PANDEMIC = [
  { id:'pandemic', type:'bad', dur:12,
    text:'🦠 PANDEMIC — global air travel collapses. Regional recovery over {dur} months.',
    fx:'pandemic', mag:0.25 },
  { id:'epidemic', type:'bad', dur:5,
    text:'🏥 Disease outbreak in {region} — tourism -60%, routes -40% for {dur} months.',
    fx:'epidemic', mag:0.4 },
  { id:'health_scare', type:'bad', dur:3,
    text:'😷 Health scare grounds confidence in {region} for {dur} months.',
    fx:'health_scare', mag:0.7 },
];
const EVENTS_FUEL = [
  { id:'oil_crisis', type:'bad', dur:6,
    text:'⛽ OIL CRISIS — fuel costs +40% for {dur} months!',
    fx:'fuel_crisis', mag:1.4 },
  { id:'fuel_glut', type:'good', dur:4,
    text:'⬇ Fuel prices collapse — operating costs -25% for {dur} months.',
    fx:'fuel_glut', mag:0.75 },
  { id:'refinery_fire', type:'bad', dur:3,
    text:'🔥 Refinery fire — regional fuel shortage, costs +60% for {dur} months!',
    fx:'fuel_crisis', mag:1.6 },
];
const EVENTS_CURRENCY = [
  { id:'currency_crisis', type:'bad', dur:5,
    text:'💱 Currency crisis in {region} — international route revenue -35% for {dur} months.',
    fx:'currency_crisis', mag:0.65 },
  { id:'strong_dollar', type:'good', dur:4,
    text:'💵 Strong domestic currency — inbound tourism to {region} up 20%.',
    fx:'currency_boost', mag:1.2 },
  { id:'devaluation', type:'bad', dur:3,
    text:'📉 Currency devaluation in {region} — route profitability hit.',
    fx:'currency_crisis', mag:0.75 },
];
const EVENTS_WEATHER = [
  { id:'hurricane_atlantic', type:'bad', dur:2,
    text:'🌀 Hurricane makes landfall near {city}! Routes disrupted for {dur} months.',
    fx:'weather_closure', mag:0, minMonth:5, maxMonth:10,
    regions:['N America','S America'] },
  { id:'tropical_storm', type:'bad', dur:1,
    text:'⛈ Tropical storm disrupts {region} routes for {dur} month.',
    fx:'regional_demand', mag:0.78, minMonth:5, maxMonth:10,
    regions:['N America','S America'] },
  { id:'typhoon', type:'bad', dur:2,
    text:'🌀 Typhoon strikes near {city} — routes suspended for {dur} months.',
    fx:'weather_closure', mag:0, minMonth:4, maxMonth:10,
    regions:['SE Asia'] },
  { id:'typhoon_region', type:'bad', dur:1,
    text:'🌀 Typhoon season disrupts {region} routes this month.',
    fx:'regional_demand', mag:0.80, minMonth:5, maxMonth:10,
    regions:['SE Asia','Oceania'] },
  { id:'cyclone_south', type:'bad', dur:2,
    text:'🌀 Tropical cyclone near {city} — {dur} month disruption.',
    fx:'weather_closure', mag:0, minMonth:10, maxMonth:3,
    regions:['Oceania','Mid East'] },
  { id:'tornado_outbreak', type:'bad', dur:1,
    text:'🌪 Tornado outbreak across {region}! Airport closures for {dur} month.',
    fx:'regional_demand', mag:0.85, minMonth:2, maxMonth:5,
    regions:['N America'] },
  { id:'tornado_city', type:'bad', dur:1,
    text:'🌪 Tornado damages airport at {city}. Operations disrupted {dur} month.',
    fx:'weather_closure', mag:0, minMonth:3, maxMonth:5,
    regions:['N America'] },
  { id:'blizzard', type:'bad', dur:1,
    text:'❄️ Major blizzard grounds flights at {city} for {dur} month.',
    fx:'weather_closure', mag:0, minMonth:11, maxMonth:2,
    regions:['N America','Europe'] },
  { id:'ice_storm', type:'bad', dur:1,
    text:'🧊 Ice storm paralyses {region} airports. Demand −20% this month.',
    fx:'regional_demand', mag:0.80, minMonth:11, maxMonth:2,
    regions:['N America','Europe'] },
  { id:'arctic_blast', type:'bad', dur:1,
    text:'🥶 Arctic blast hits {region}. All routes delayed.',
    fx:'regional_demand', mag:0.85, minMonth:0, maxMonth:1,
    regions:['N America','Europe'] },
  { id:'monsoon_india', type:'bad', dur:2,
    text:'🌧 Heavy monsoon flooding disrupts {region} routes for {dur} months.',
    fx:'regional_demand', mag:0.82, minMonth:5, maxMonth:8,
    regions:['Mid East'] },
  { id:'monsoon_sea', type:'bad', dur:2,
    text:'🌧 Monsoon disrupts {region} routes for {dur} months.',
    fx:'regional_demand', mag:0.84, minMonth:4, maxMonth:9,
    regions:['SE Asia'] },
  { id:'sandstorm', type:'bad', dur:1,
    text:'🌬 Sandstorm closes {city} airport. Visibility zero for {dur} month.',
    fx:'weather_closure', mag:0, minMonth:2, maxMonth:7,
    regions:['Africa','Mid East'] },
  { id:'flood', type:'bad', dur:2,
    text:'🌊 Flooding at {city} — airport closed {dur} months.',
    fx:'weather_closure', mag:0, minMonth:2, maxMonth:8 },
  { id:'heatwave', type:'bad', dur:1,
    text:'🌡 Extreme heat wave — {region} travel disrupted for {dur} month.',
    fx:'regional_demand', mag:0.87, minMonth:5, maxMonth:8,
    regions:['Mid East','Africa','Europe','N America'] },
  { id:'lightning_storm', type:'bad', dur:1,
    text:'⚡ Severe electrical storms ground flights at {city} for {dur} month.',
    fx:'weather_closure', mag:0, minMonth:4, maxMonth:9,
    regions:['N America','Europe','SE Asia'] },
  { id:'wildfire', type:'bad', dur:2,
    text:'🔥 Wildfire smoke closes {city} airport for {dur} months.',
    fx:'weather_closure', mag:0, minMonth:5, maxMonth:9,
    regions:['N America','Europe','Oceania'] },
  { id:'fog_event', type:'bad', dur:1,
    text:'🌫 Dense fog halts operations at {city} for {dur} month.',
    fx:'weather_closure', mag:0, minMonth:9, maxMonth:2,
    regions:['Europe','N America','SE Asia'] },
  { id:'volcano', type:'bad', dur:3,
    text:'🌋 Volcanic eruption near {city} — ash grounds flights for {dur} months.',
    fx:'weather_closure', mag:0, minMonth:0, maxMonth:11,
    regions:['SE Asia','Oceania','S America','Europe','N America'] },
  { id:'earthquake', type:'bad', dur:2,
    text:'🏚 Earthquake damages {city} airport — closed for {dur} months.',
    fx:'weather_closure', mag:0, minMonth:0, maxMonth:11,
    regions:['N America','S America','SE Asia','Oceania','Mid East','Europe'] },
];
const EVENTS_CREW = [
  { id:'pilot_strike', type:'bad', dur:2,
    text:'✊ PILOT STRIKE — all routes suspended! Negotiate or wait {dur} months.',
    fx:'crew_strike', mag:0 },
  { id:'cabin_strike', type:'bad', dur:1,
    text:'✊ Cabin crew strike — capacity cut 50% for {dur} months.',
    fx:'cabin_strike', mag:0.5 },
  { id:'atc_strike', type:'bad', dur:1,
    text:'✊ ATC strike in {region} — all regional flights grounded 1 month.',
    fx:'atc_strike', mag:0 },
];
const EVENTS_RIVALS = [
  { id:'rival_bankruptcy', type:'good', dur:0,
    text:'🏦 {rival} goes BANKRUPT! Their routes and passengers up for grabs.',
    fx:'rival_bankrupt', mag:1 },
  { id:'rival_expand', type:'warn', dur:0,
    text:'⚠ {rival} expanding aggressively into {region}!',
    fx:'rival_expand', mag:1 },
  { id:'rival_merger', type:'warn', dur:0,
    text:'🤝 {rival} merges with a regional airline — now 30% larger!',
    fx:'rival_merge', mag:1.3 },
  { id:'rival_accident', type:'neutral', dur:3,
    text:'💥 {rival} involved in incident — their passengers flee to safer carriers.',
    fx:'rival_accident', mag:1 },
];
const EVENTS_SUBSIDY = [
  { id:'route_subsidy', type:'good', dur:0,
    text:'💰 Government subsidy granted for opening route to {city} — $15M bonus!',
    fx:'subsidy_cash', mag:15 },
  { id:'fuel_subsidy', type:'good', dur:4,
    text:'⛽ Regional fuel subsidy — costs -20% in {region} for {dur} months.',
    fx:'fuel_subsidy', mag:0.8 },
  { id:'hub_grant', type:'good', dur:0,
    text:'🏛 Government hub development grant — $25M awarded!',
    fx:'subsidy_cash', mag:25 },
  { id:'underserved_bonus', type:'good', dur:0,
    text:'✈ Underserved route bonus — opening a small-city route earns $8M!',
    fx:'subsidy_cash', mag:8 },
];
const EVENT_POOL = [
  ...EVENTS_AIRPORT.map(e=>({...e,cat:'airport'})),
  ...EVENTS_COUNTRY.map(e=>({...e,cat:'country'})),
  ...EVENTS_CITY.map(e=>({...e,cat:'city'})),
  ...EVENTS_MACRO.map(e=>({...e,cat:'macro'})),
  ...EVENTS_PANDEMIC.map(e=>({...e,cat:'pandemic'})),
  ...EVENTS_FUEL.map(e=>({...e,cat:'fuel'})),
  ...EVENTS_CURRENCY.map(e=>({...e,cat:'currency'})),
  ...EVENTS_WEATHER.map(e=>({...e,cat:'weather'})),
  ...EVENTS_CREW.map(e=>({...e,cat:'crew'})),
  ...EVENTS_RIVALS.map(e=>({...e,cat:'rivals'})),
  ...EVENTS_SUBSIDY.map(e=>({...e,cat:'subsidy'})),
  {type:'good', cat:'city',    text:'🏅 OLYMPICS in {city}! Tourism surges.',          fx:'tourism_boom', mag:1.3,  dur:3},
  {type:'good', cat:'macro',   text:'🌐 WORLD EXPO in {city} — demand spikes!',        fx:'tourism_boom', mag:1.25, dur:4},
  {type:'good', cat:'macro',   text:'📈 Economic boom across {region}!',               fx:'econ_boom',    mag:1.15, dur:0},
  {type:'bad',  cat:'crew',    text:'✊ LABOR STRIKE — capacity cut 30%!',             fx:'strike',       mag:0.7,  dur:2},
  {type:'bad',  cat:'accident',text:'💥 Accident reported — confidence drops!',        fx:'accident',     mag:0.85, dur:1},
  {type:'warn', cat:'country', text:'⚠ DEREGULATION — fare wars incoming!',           fx:'deregulation', mag:0.9,  dur:0},
];
const RIVAL_NAMES = [
  {name:'PanWorld',color:'#e0896b'},{name:'AirGlobe',color:'#9a8cf0'},
  {name:'SkyRush',color:'#d9b24e'},{name:'AeroNova',color:'#6ba9d6'},
  {name:'JetStar Intl',color:'#d98aae'},{name:'TransOcean',color:'#6fb6a6'},
];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
let STATE = {};
function defaultState() {
  return {
    scenario: SCENARIOS[0], level: LEVELS[1],
    coName: 'SKYLINE', homeBase: 'Chicago', logo: '✈', logoId: (window.DEFAULT_AIRLINE_LOGO_ID || 'nova_airlines'), livery: '#a789ff',
    month: 3, year: 1970, startYear: 1970,
    cash: PLAYER_STARTING_CASH, loan: 600, maxLoan: 3000,
    shares: { owned: 125000, total: 1000000, price: 1, dividend: 0 },
    companyValue: 1,
    totalPaxYear: 0, paxThisYear: 0, lastYearPax: 0,
    profitThisYear: 0,
    firstMoves: { rung: 0, done: false }, gateBonus: {}, _lastMonthProfit: null,
    actionCap: { on: false, max: 4, used: 0 },
    planes: {}, routes: [], hubs: ['Chicago'], businesses: {},
    routeSieges: {},     // ⚔ AIRLINE WAR: { 'FROM|TO': {rival, intensity 0..1, since, priceWar} }
    cityInvestments: {}, // { cityName: { buildingId: { level, purchasedMonth } } }
    sponsorships: {},    // { sponsorId: { city, monthsLeft, monthlyReturn } }
    monitorLog: [],      // continuous game monitor — issues flagged/resolved each tick
    budget: { repair: 1, ad: 1, service: 1 },
    crewBudget: 2,       // 1=lean, 2=standard, 3=generous — affects morale drift
    crew: [],            // array of crew member objects
    crewIncidents: [],   // incident log {id, type, crewId, month, year, resolved, demandHit}
    _crewMoraleCache: 1, // last-computed morale multiplier (0.7–1.15)
    events: [], competitors: [],
    activeCampaigns: [],               // targeted ad campaigns (region/city/route/venture)
    charters: [], _charterSeq: 0, _acqSelected: null,  // M&A: charter companies on the market
    fuelMod: 1, viewRegion: 'N America',
    timerSecs: 120, timerMax: 120, timerInterval: null,
    timerMode: 'relaxed', paused: false,
    routeFrom: null, selectedCity: null,
    negotiating: {}, // city -> quarters remaining
    board: { cfo:null, coo:null, strategy:null }, // hired executives {tier,name}
    yearsElapsed: 0, gameOver: false,
    mapTX: 0, mapTY: -144, mapZoom: 1.75, _panInit: false,
    gameType: 'scenario', objective: {kind:'scenario'}, twist: null, seed: null,
    _noHubs: false, _fuelLock: false,
    mhc: { points: 0, totalEarned: 0, redemptions: 0, unlocked: false, members: 0 },
    // ── Maintenance & Insurance system ──────────────────────────────
    insurance: 'none',           // 'none' | 'standard' | 'premium'
    fleetHealth: {},             // planeName -> { health:0-100, wearRate, groundedUntil, totalChecks, lastCheck }
    maintenanceIncidents: [],    // incident log
    _maintTotalCost: 0,          // cumulative cost tracker
    // ── Regional capital projects (mid/late-game money sink) ────────
    regionProjects: {},          // region -> { active:[{id,turnsLeft,cost}], completed:[id...] }
    projectSlots: 2,             // concurrent in-progress projects allowed
    researchPoints: 2450,        // presentation balance for the Research command center
  };
}
let setupChoice = { type: 'scenario', scenario: SCENARIOS[0], level: LEVELS[1], hub: 'Chicago' };
let _wzPage = 1;
const GT_SVG = {
  scenario: `<svg class="gt-icon" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="15" stroke="#4ab0c0" stroke-width="1.5" opacity=".4"/><path d="M10 18 Q14 10 18 18 Q22 26 26 18" stroke="#00d8f0" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="10" cy="18" r="2" fill="#00d8f0" opacity=".7"/><circle cx="26" cy="18" r="2" fill="#ffcf5a" opacity=".7"/></svg>`,
  domination: `<svg class="gt-icon" viewBox="0 0 36 36" fill="none"><path d="M18 6L30 28H6L18 6Z" stroke="#f43f5e" stroke-width="1.8" stroke-linejoin="round" fill="rgba(244,63,94,0.08)"/><path d="M18 14v8M18 26v.5" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/></svg>`,
  mystery:  `<svg class="gt-icon" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="14" stroke="#a78bfa" stroke-width="1.5" stroke-dasharray="4 3"/><circle cx="18" cy="18" r="5" fill="rgba(167,139,250,0.2)" stroke="#a78bfa" stroke-width="1.5"/><path d="M18 8v4M18 24v4M8 18h4M24 18h4" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round" opacity=".5"/></svg>`,
  eras:     `<svg class="gt-icon" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="14" stroke="#ffcf5a" stroke-width="1.5" opacity=".5"/><path d="M18 10v8l6 4" stroke="#ffcf5a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 18h3M28 18h3M18 5v3" stroke="#ffcf5a" stroke-width="1.5" stroke-linecap="round" opacity=".45"/></svg>`,
  daily:    `<svg class="gt-icon" viewBox="0 0 36 36" fill="none"><rect x="6" y="8" width="24" height="22" rx="3" stroke="#ffcf5a" stroke-width="1.5" fill="rgba(255,207,90,0.06)"/><path d="M12 6v4M24 6v4M6 16h24" stroke="#ffcf5a" stroke-width="1.5" stroke-linecap="round"/><circle cx="18" cy="23" r="2.5" fill="#ffcf5a" opacity=".8"/></svg>`,
};
const SC_ICONS = { 1:'🛫', 2:'🔀', 3:'🌏', 4:'💺', 5:'🌿', 6:'🏆' };
function wzStep(page) {
  if (page === 2 && !setupChoice.type) return showFlash('Pick a game type first');
  if (page === 3 && setupChoice.type === 'scenario' && !setupChoice.scenario) return showFlash('Pick a scenario first');
  const needsScenario = setupChoice.type === 'scenario';
  if (!needsScenario && page === 2) {
    page = 3;
  }
  _wzPage = page;
  document.querySelectorAll('.wz-page').forEach((p,i)=>{
    p.classList.toggle('active', i+1 === page);
  });
  // keep the view anchored — no upward jump when page heights differ
  const _setupEl = document.getElementById('setup');
  if (_setupEl) _setupEl.scrollTop = 0;
  const step2El = document.getElementById('wz-step-2');
  const step2Line = step2El?.previousElementSibling;
  const step2LineAfter = step2El?.nextElementSibling;
  if (step2El) {
    const show = needsScenario;
    step2El.style.display = show ? '' : 'none';
    if (step2Line) step2Line.style.display = show ? '' : 'none';
    if (step2LineAfter) step2LineAfter.style.display = show ? '' : 'none';
  }
  for (let i=1; i<=3; i++) {
    const el = document.getElementById(`wz-step-${i}`);
    if (!el) continue;
    el.classList.remove('active','done');
    if (i === page) el.classList.add('active');
    else if (i < page) el.classList.add('done');
  }
  if (page === 1) wzRenderPage1();
  else if (page === 2) wzRenderPage2();
  else if (page === 3) wzRenderPage3();
  // Re-trigger flap animation on every page change
  const wzFlap = document.getElementById('wz-flap-title');
  if (wzFlap) setTimeout(() => splitFlap(wzFlap, 'AIRLINE EMPIRE'), 80);
}
let _wzFlightTransitionActive = false;
function wzFlyToFoundAirline(ev) {
  if (_wzFlightTransitionActive) return;
  if (setupChoice.type === 'scenario' && !setupChoice.scenario) {
    showFlash('Pick a scenario first');
    return;
  }
  _wzFlightTransitionActive = true;
  const source = ev && ev.currentTarget ? ev.currentTarget : null;
  if (source) source.disabled = true;

  const flight = document.createElement('div');
  flight.className = 'wz-flight-transition';
  flight.setAttribute('aria-hidden','true');
  flight.innerHTML = `<div class="wz-flight-trail"></div><svg class="wz-flight-plane" viewBox="0 0 120 120" role="presentation"><path d="M12 66l41-12V18c0-6 4-10 7-10s7 4 7 10v36l41 12v10L67 67v18l14 9v8l-21-7-21 7v-8l14-9V67l-41 9z"/></svg>`;
  document.body.appendChild(flight);
  requestAnimationFrame(() => flight.classList.add('depart'));

  window.setTimeout(() => {
    wzStep(3);
    flight.classList.add('finish');
  }, 620);
  window.setTimeout(() => {
    flight.remove();
    if (source) source.disabled = false;
    _wzFlightTransitionActive = false;
  }, 980);
}

function wzRenderPage1() {
  const t = setupChoice.type;
  const tg = document.getElementById('wz-type-grid');
  if (tg) tg.innerHTML = GAME_TYPES.filter(g=>g.id!=='daily' && g.id!=='eras').map(g => `
    <div class="gt-card ${g.id===t?'selected':''}" data-gt="${g.id}" onclick="pickType('${g.id}')" data-peek-icon="${g.icon}" data-peek-title="${g.name}" data-peek-body="${g.blurb}">
      <span class="gt-check">✓</span>
      <div class="gt-ring">${GT_SVG[g.id] || `<span class="gt-icon">${g.icon}</span>`}</div>
      <div class="gt-name">${g.name}</div>
      <div class="gt-blurb">${g.blurb}</div>
    </div>`).join('');
  setupSetupPeek();
  const dp = document.getElementById('wz-diff-panel');
  if (dp) dp.style.display = (t==='mystery') ? 'none' : '';
  const dg = document.getElementById('wz-diff-grid');
  if (dg) dg.innerHTML = LEVELS.filter(l=>l.id!==1).map(l => {
    const startCash = PLAYER_STARTING_CASH;
    const diffIcon = l.id===2?'🎯':l.id===3?'⚔️':'💀';
    const peekBody = `${l.blurb}. Start $${startCash}M · ${l.regions} regions · ${l.rivals} rivals.`;
    return `<div class="diff-card ${l.id===setupChoice.level?.id?'selected':''}" data-diff="${l.id}" onclick="pickLevel(${l.id})"
      data-peek-icon="${diffIcon}" data-peek-title="${l.name}" data-peek-body="${peekBody.replace(/"/g,'&quot;')}">
      <div class="diff-name">${l.name}</div>
      <div class="diff-blurb">${l.blurb}</div>
      <div class="diff-stats">Start $${startCash}M · ${l.regions} regions · ${l.rivals} rivals</div>
    </div>`;
  }).join('');
  const nextBtn = document.querySelector('#wz-p1 .wz-next');
  if (nextBtn) {
    nextBtn.textContent = (t === 'scenario')
      ? 'Next — Choose Scenario ›'
      : 'Next — Found Airline ›';
  }
}
let _scDetails = {};   // accordion state: at most one scenario is expanded
const SC_PREVIEW_ARCS = {   // per-scenario preview route (city pair)
  1: ['Chicago','New York'], 2: ['Chicago','Dallas'], 3: ['New York','Singapore'],
  4: ['Chicago','Miami'], 5: ['Seattle','San Francisco'], 6: ['Chicago','Denver'],
};
function scToggleDetails(id, ev) {
  if (ev) ev.stopPropagation();
  const shouldOpen = _scDetails[id] !== true;
  _scDetails = shouldOpen ? { [id]: true } : {};
  wzRenderPage2();
}
function scPreviewSVG() {
  const sel = setupChoice.scenario || SCENARIOS[0];
  const pair = SC_PREVIEW_ARCS[sel.id] || ['Chicago','New York'];
  const a = CITIES[pair[0]], b = CITIES[pair[1]];
  const W = MAP_W, H = MAP_H;
  // dotted world: sample every city as a faint dot (continent constellation)
  let dots = '';
  Object.values(CITIES).forEach(c => { dots += `<circle cx="${c.x}" cy="${c.y}" r="7.5" fill="#2a5878"/>`; });
  let arc = '';
  if (a && b) {
    const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - Math.abs(a.x - b.x) * 0.22 - 40;
    arc = `<path d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}" fill="none" stroke="#a789ff" stroke-width="9" stroke-dasharray="18 15" opacity=".95"/>
      <circle cx="${a.x}" cy="${a.y}" r="16" fill="#a789ff"/><circle cx="${b.x}" cy="${b.y}" r="16" fill="#a789ff"/>
      <text x="${mx}" y="${my + 30}" font-size="52" text-anchor="middle" fill="#e8edf3">✈</text>`;
  }
  return `<svg viewBox="60 ${H*0.06} ${W-120} ${H*0.62}" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#050c14"/>${dots}${arc}</svg>`;
}
function wzRenderPage2() {
  const sg = document.getElementById('wz-scenario-grid');
  if (!sg) return;
  const lvl = setupChoice.level || LEVELS[1];
  sg.innerHTML = SCENARIOS.map(s => {
    const tagline = SCENARIO_TAGLINES[s.id] || '';
    const accent  = SCENARIO_ACCENT[s.id] || 'var(--accent)';
    const startCash = PLAYER_STARTING_CASH;
    const hubs = 1;                       // all scenarios start from a single home hub
    const rivals = lvl.rivals;            // rivals come from chosen difficulty
    const diffName = lvl.name;            // difficulty chosen on page 1
    const diffCol = lvl.id===2?'var(--accent)':lvl.id===3?'var(--accent2)':lvl.id===4?'var(--danger)':'var(--profit)';
    const open = _scDetails[s.id] === true;   // collapsed by default
    const statRow = (k,v,vc)=>`<div class="sc-stat"><span class="sc-stat-k">${k}</span><span class="sc-stat-v" style="color:${vc||'var(--text)'}">${v}</span></div>`;
    const detailsPeek = `Start cash $${startCash}M · Credit line $${Math.max(2000,(s.loan||600)*3)}M · Goal: ${s.challenge||'grow the airline'}`;
    return `
    <div class="sc-card ${s.id===1?'sc-rec':''} ${s.id===setupChoice.scenario?.id?'selected':''}" onclick="pickScenario(${s.id})"
         data-peek-icon="${SC_ICONS[s.id]||'✈'}" data-peek-title="${s.name.replace(/"/g,'&quot;')}"
         data-peek-body="${(s.desc+' '+s.flavor).replace(/"/g,'&quot;').trim()}">
      <div class="sc-card-top">
        <div class="sc-card-icon" style="border-color:${accent};color:${accent};margin-bottom:0">${SC_ICONS[s.id]||'✈'}</div>
        ${s.id===1?'<span class="sc-rec-pill">RECOMMENDED ★</span>':''}
      </div>
      <div class="sc-card-name">${s.name}</div>
      ${tagline?`<div class="sc-card-tag" style="color:${accent}">${tagline}</div>`:''}
      <div class="sc-card-desc">${s.desc}</div>
      <button type="button" class="sc-details-head ${open?'':'closed'}" onclick="scToggleDetails(${s.id},event)"
           aria-expanded="${open}" aria-label="${open?'Hide':'Show'} ${s.name.replace(/"/g,'&quot;')} details"
           data-peek-icon="💰" data-peek-title="${s.name.replace(/"/g,'&quot;')} — Details"
           data-peek-body="${detailsPeek.replace(/"/g,'&quot;')}">
        <span>DETAILS</span><span class="chev" aria-hidden="true">⌄</span>
      </button>
      ${open?`<div class="sc-card-stats">
        ${statRow('Start Cash', '$'+startCash+'M', accent)}
        ${statRow('Starting Hubs', hubs)}
        ${statRow('Rivals', rivals)}
        ${statRow('Difficulty', diffName, diffCol)}
      </div>`:''}
    </div>`;}).join('');
  const pv = document.getElementById('sc2-preview');
  if (pv) pv.innerHTML = scPreviewSVG();
  setupSetupPeek();
}
const SCENARIO_TAGLINES = {1:'Build from the ground up.',2:'Integrate or implode.',3:'Go the distance.',4:'Disrupt or be ignored.',5:'Profit with a purpose.',6:'Rule your backyard.'};
const SCENARIO_ACCENT = {1:'var(--accent)',2:'#a78bfa',3:'var(--profit)',4:'var(--accent2)',5:'var(--profit)',6:'var(--accent2)'};
let _hubRegion = null;
let _expandedHubCards = new Set();
const REGION_TINT = {
  'N America':['#1d3b57','#0d1c2c'], 'S America':['#1d4a3a','#0c1f18'],
  'Europe':['#33304f','#15131f'], 'Africa':['#4a3a22','#1f1810'],
  'Mid East':['#4a3320','#1f1610'], 'SE Asia':['#3a2247','#16101f'],
  'Oceania':['#1d4452','#0c1d22'], 'Asia':['#3a2247','#16101f']
};
const REGION_META = {
  'N America': { icon: '🌎', order: 1 },
  'S America': { icon: '🌎', order: 2 },
  'Europe':    { icon: '🌍', order: 3 },
  'Africa':    { icon: '🌍', order: 4 },
  'Mid East':  { icon: '🌏', order: 5 },
  'SE Asia':   { icon: '🌏', order: 6 },
  'Oceania':   { icon: '🌏', order: 7 },
};
function wzRenderPage3() {
  // ---- helpers scoped to setup step 3 (ae4 reskin) ----
  const P = LIVERY_COLORS.slice(0,5), S = LIVERY_COLORS.slice(5,10), A = LIVERY_COLORS.slice(10,12);
  const row = document.getElementById('logo-pick-row');
  if (row) {
    const logos = Array.isArray(window.AIRLINE_LOGOS) ? window.AIRLINE_LOGOS : [];
    row.innerHTML = logos.map(logo => {
      const selected = logo.id === _selectedLogo;
      const groupName = (window.AIRLINE_LOGO_GROUPS && window.AIRLINE_LOGO_GROUPS[logo.group]) || logo.group || 'Airline Identity';
      const title = String(logo.name || logo.id).replace(/"/g,'&quot;');
      return `<button class="logo-pick logo-card image-logo-card ${selected?'selected':''}" onclick="pickLogo('${logo.id}')"
        data-logo-id="${logo.id}" data-peek-icon="✈" data-peek-title="${title}" data-peek-body="${groupName}" title="${title}">
          <span class="logo-card-image-wrap">${window.airlineLogoImg ? window.airlineLogoImg(logo.id, 'logo-card-image', logo.name) : '✈'}</span>
          <span class="logo-card-name">${logo.name}</span>
        </button>`;
    }).join('');
  }
  const swRow = (el, list, sel, fn) => { const n=document.getElementById(el); if(n) n.innerHTML =
    list.map(c => `<span class="livery-pick ${c===sel?'selected':''}" onclick="${fn}('${c}')" style="background:${c}" title="${c}"></span>`).join(''); };
  swRow('livery-pick-row',  P, _selectedLivery,  'pickLivery');
  swRow('livery-pick-row2', S, _selectedLivery2, 'pickLivery2');
  swRow('livery-pick-rowA', A, _selectedLiveryA, 'pickLiveryA');
  const lpv = document.getElementById('ae4-livery-plane');
  if (lpv) lpv.innerHTML = aePlaneSVG(150, 58);
  const majors = Object.entries(CITIES).filter(([,c])=>c.major);
  const byRegion = {};
  majors.forEach(([n,c]) => { (byRegion[c.region]=byRegion[c.region]||[]).push([n,c]); });
  const regions = Object.keys(byRegion).sort((a,b) =>
    (REGION_META[a]?.order||9) - (REGION_META[b]?.order||9)
  );
  if (!_hubRegion || !byRegion[_hubRegion]) {
    _hubRegion = (setupChoice.hub && CITIES[setupChoice.hub]?.region) || regions[0];
  }
  const tabsEl = document.getElementById('hub-region-tabs');
  if (tabsEl) {
    tabsEl.innerHTML = regions.map(r => {
      const meta = REGION_META[r] || {};
      const label = AE4_REGION_LABEL[r] || r;
      return `<button class="ae4-rtab ${r===_hubRegion?'active':''}" onclick="hubSetRegion('${r}')">
        ${meta.icon||'🌐'} ${label} <span class="ae4-rcount">${byRegion[r].length}</span>
      </button>`;
    }).join('');
  }
  const grid = document.getElementById('nh-hub-grid');
  if (grid) {
    const cities = (byRegion[_hubRegion] || []).sort((a,b)=>b[1].pop-a[1].pop);
    grid.innerHTML = cities.map(([n,c]) => {
      const gates = 16 + (c.level||3) * 2;
      const isSelected = n === setupChoice.hub;
      const isOpen = _expandedHubCards.has(n);
      const regionIcon = (REGION_META[c.region]||{}).icon || '🌍';
      const apt = AE4_AIRPORTS[n] || `${c.abbr||''} Intl`;
      const dem = Math.max(1, Math.min(7, Math.round(((c.econ + c.tourism) / 2) / 100 * 7)));
      const comp = aeCompDots(n, c);
      const peekBody = `${c.abbr} · ${apt} · Pop ${c.pop}M · Demand ${dem}/7 · Competition ${comp}/5 · ${gates} starting gates`;
      return `<div class="ae4-hub compact ${isSelected?'selected':''} ${isOpen?'open':''}" onclick="pickHub('${n}')"
        data-peek-icon="${regionIcon}" data-peek-title="${n}" data-peek-body="${peekBody}">
        <span class="ae4-check">✓</span>
        ${aeCityThumbSVG(n, c.region)}
        <div class="ae4-hub-topline">
          <div class="ae4-hub-main">
            <div class="ae4-hub-city">${n}</div>
            <div class="ae4-hub-idline"><span class="ae4-hub-iata">${c.abbr||''}</span><span class="ae4-hub-airport-mini">${apt}</span></div>
          </div>
          <button class="ae4-hub-chev" onclick="aeToggleHubCard('${n}',event)" title="Show hub details">⌄</button>
        </div>
        <div class="ae4-hub-details">
          <div class="ae4-stat"><span><span class="sic">👥</span>Population</span><b>${c.pop.toFixed(1)}M</b></div>
          <div class="ae4-stat"><span><span class="sic">📶</span>Demand</span><span class="ae4-blocks">${Array.from({length:7},(_,i)=>`<i class="${i<dem?'on':''}"></i>`).join('')}</span></div>
          <div class="ae4-stat"><span><span class="sic">🎯</span>Competition</span><span class="ae4-dots">${Array.from({length:5},(_,i)=>`<i class="${i<comp?'on':''}"></i>`).join('')}</span></div>
          <div class="ae4-stat"><span><span class="sic">🛫</span>Starting Gates</span><b>${gates}</b></div>
        </div>
      </div>`;
    }).join('');
  }
  const ld = document.getElementById('nh-logo-display');
  if (ld) { ld.innerHTML = window.airlineLogoImg ? window.airlineLogoImg(_selectedLogo, 'nh-selected-logo', 'Selected airline logo') : '✈'; ld.style.color = _selectedLivery; ld.style.textShadow = 'none'; }
  aeNameCheck();
}
const AE4_REGION_LABEL = { 'N America':'North America', 'S America':'South America' };
const AE4_AIRPORTS = {
  'Chicago':'Chicago O\'Hare Intl','New York':'John F. Kennedy Intl','Los Angeles':'Los Angeles Intl',
  'Dallas':'Dallas Fort Worth Intl','Washington DC':'Dulles Intl','Houston':'George Bush Intl',
  'San Francisco':'San Francisco Intl','Atlanta':'Hartsfield-Jackson Intl','Phoenix':'Phoenix Sky Harbor Intl',
  'Boston':'Logan Intl','Denver':'Denver Intl','Miami':'Miami Intl','Seattle':'Seattle-Tacoma Intl',
  'Toronto':'Toronto Pearson Intl','Mexico City':'Benito Juárez Intl','London':'Heathrow','Paris':'Charles de Gaulle',
  'Frankfurt':'Frankfurt am Main','Amsterdam':'Schiphol','Madrid':'Adolfo Suárez Barajas','Rome':'Fiumicino',
  'Istanbul':'Istanbul Airport','Moscow':'Sheremetyevo Intl','Tokyo':'Haneda Intl','Osaka':'Kansai Intl',
  'Seoul':'Incheon Intl','Beijing':'Beijing Capital Intl','Shanghai':'Pudong Intl','Hong Kong':'Hong Kong Intl',
  'Singapore':'Changi','Bangkok':'Suvarnabhumi','Jakarta':'Soekarno-Hatta Intl','Manila':'Ninoy Aquino Intl',
  'Delhi':'Indira Gandhi Intl','Mumbai':'Chhatrapati Shivaji Intl','Dubai':'Dubai Intl','Doha':'Hamad Intl',
  'Riyadh':'King Khalid Intl','Tel Aviv':'Ben Gurion Intl','Cairo':'Cairo Intl','Johannesburg':'O.R. Tambo Intl',
  'Lagos':'Murtala Muhammed Intl','Nairobi':'Jomo Kenyatta Intl','Sydney':'Kingsford Smith','Melbourne':'Melbourne Tullamarine',
  'Auckland':'Auckland Intl','São Paulo':'Guarulhos Intl','Sao Paulo':'Guarulhos Intl','Buenos Aires':'Ezeiza Intl',
  'Rio de Janeiro':'Galeão Intl','Lima':'Jorge Chávez Intl','Bogotá':'El Dorado Intl','Bogota':'El Dorado Intl',
  'Santiago':'Arturo Merino Benítez Intl',
};
function aeCompDots(name, c) {
  const r = seededRng('comp:' + name)();
  return Math.max(1, Math.min(5, Math.round((c.level||3) * 0.72 + r * 1.6)));
}
function aeCityThumbSVG(name, region) {
  const skyline = window.AECitySkylineManifest && window.AECitySkylineManifest.get(name);
  if (skyline && skyline.src) {
    return `<img class="ae4-thumb ae4-thumb-photo" src="${skyline.src}" alt="" aria-hidden="true" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">${aeCityThumbFallbackSVG(name, region, true)}`;
  }
  return aeCityThumbFallbackSVG(name, region, false);
}
function aeCityThumbFallbackSVG(name, region, hidden) {
  const hiddenStyle = hidden ? ' style="display:none"' : '';
  if (window.AECityRenderer && typeof window.AECityRenderer.render === 'function') {
    return window.AECityRenderer.render(name, region).replace('<svg ', `<svg${hiddenStyle} `);
  }
  const tint = REGION_TINT[region] || ['#1b3a52','#0e1f30'];
  return `<svg${hiddenStyle} class="ae4-thumb" viewBox="0 0 180 88" aria-hidden="true"><defs><linearGradient id="fallbackCity" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tint[0]}"/><stop offset="1" stop-color="${tint[1]}"/></linearGradient></defs><rect width="180" height="88" fill="url(#fallbackCity)"/><rect y="70" width="180" height="18" fill="#050b12"/></svg>`;
}

function aePlaneSVG(w, h) {
  const p = _selectedLivery, s = _selectedLivery2, a = _selectedLiveryA;
  return `<svg width="${w}" height="${h}" viewBox="0 0 200 78">
    <ellipse cx="100" cy="72" rx="72" ry="4" fill="#000" opacity=".35"/>
    <path d="M14 44 Q16 34 34 32 L150 30 Q176 31 186 40 Q178 50 150 52 L34 52 Q18 51 14 44 Z" fill="#e8edf3"/>
    <path d="M14 44 Q16 40 30 44 L168 46 Q180 44 186 40 Q178 50 150 52 L34 52 Q18 51 14 44 Z" fill="${p}"/>
    <path d="M150 30 Q176 31 186 40 Q180 44 168 44 L152 42 Z" fill="#cfd8e2"/>
    <path d="M30 34 L46 12 Q48 9 52 10 L56 12 L46 34 Z" fill="${s}"/>
    <text x="47" y="24" font-size="11" text-anchor="middle" transform="rotate(-8 47 24)">✈</text>
    <path d="M84 46 L64 62 L74 62 L96 48 Z" fill="${s}" opacity=".9"/>
    <rect x="88" y="52" width="20" height="9" rx="4.5" fill="${a}"/>
    <rect x="88" y="52" width="6" height="9" rx="3" fill="#2a3644"/>
    <g fill="#20303f">${Array.from({length:9},(_,i)=>`<circle cx="${64+i*11}" cy="37" r="2"/>`).join('')}</g>
    <path d="M158 33 L172 24 L176 26 L166 34 Z" fill="${s}"/>
  </svg>`;
}
function aeNameCheck() {
  const nameEl = document.getElementById('nh-name-input');
  const msg = document.getElementById('ae4-namemsg');
  const chk = document.getElementById('ae4-namecheck');
  if (!nameEl || !msg || !chk) return;
  const v = (nameEl.value || '').trim();
  if (!v) { msg.textContent = 'Enter an airline name'; msg.className = 'warn'; chk.classList.remove('ok'); }
  else if (v.length < 3) { msg.textContent = 'A bit short — use 3+ characters'; msg.className = 'warn'; chk.classList.remove('ok'); }
  else { msg.textContent = '✨ Great name! Memorable and professional.'; msg.className = ''; chk.classList.add('ok'); }
}
const AE4_NAMES = ['SKYLINE','AURORA','ZEPHYR','NIMBUS','MERIDIAN','HORIZON','POLARIS','CIRRUS','STRATUS','VELOCITY','EQUINOX','SOLSTICE','ATLAS AIR','VANTAGE','PACIFIC JET','APEX AIR','NOVA WINGS','PAISLEY AIR'];
function aeRandomName() {
  const nameEl = document.getElementById('nh-name-input');
  if (!nameEl) return;
  const pool = AE4_NAMES.filter(n => n !== nameEl.value);
  nameEl.value = pool[Math.floor(Math.random() * pool.length)];
  aeNameCheck();
}
window.getSetupLogoRegion = function() {
  const hub = setupChoice.hub;
  return _hubRegion || (hub && CITIES[hub] ? CITIES[hub].region : null) || REGIONS[0];
};
function hubSetRegion(r) {
  _hubRegion = r;
  if (window.AirlineIdentityGenerator && typeof window.AirlineIdentityGenerator.setRegion === 'function') {
    window.AirlineIdentityGenerator.setRegion(r, 9);
  } else {
    wzRenderPage3();
  }
}
function aeToggleHubCard(n, ev) {
  if (ev) { ev.stopPropagation(); ev.preventDefault(); }
  if (_expandedHubCards.has(n)) _expandedHubCards.delete(n);
  else _expandedHubCards.add(n);
  wzRenderPage3();
}
function pickHub(n) {
  setupChoice.hub = n;
  _hubRegion = CITIES[n]?.region || _hubRegion;
  wzRenderPage3();
}
function renderSetup() {
  if (_wzPage === 1) wzRenderPage1();
  else if (_wzPage === 2) wzRenderPage2();
  else if (_wzPage === 3) wzRenderPage3();
}
function pickType(id) { setupChoice.type = id; wzRenderPage1(); }
function pickScenario(id) { setupChoice.scenario = SCENARIOS.find(s=>s.id===id)||SCENARIOS[0]; if(_wzPage===1) wzRenderPage1(); else wzRenderPage2(); }
function pickLevel(id) { setupChoice.level = LEVELS.find(l=>l.id===id); wzRenderPage1(); }
const GUIDE_CONTENT = {
  'first-flight': `
    <div class="guide-section">
      <div class="guide-section-title">First Flight — Your First Four Moves</div>
      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Tap any step to open it. Tap the header again or hit <b>‹ Back</b> to close.</div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">✈</span><span class="gchev-title">1 · Buy an Aircraft</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          You can't fly routes without planes. For your first game, buy 2–3 copies of a <b>A320</b> or <b>B737 MAX 8</b> — medium range (~3,500–6,500mi), affordable ($50–60M each), and versatile enough for both regional and transcontinental routes. Avoid widebodies and jumbos until you have 5+ profitable routes — the lease cost crushes you early.
          <span class="gchev-where">→ Left panel: Operations › Buy Aircraft</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🛫</span><span class="gchev-title">2 · Open Your First Route</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Use <b>Operations › New Route</b> in the left panel. Your hub is already the origin — pick a destination city with high population and economy. The preview shows estimated load % and projected profit before you commit. Aim for <b>60%+ load</b> to be profitable from day one. Cities closer to your hub in the same region are safer first choices.
          <span class="gchev-where">→ Left panel: Operations › New Route</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">💰</span><span class="gchev-title">3 · Price Your Fare Carefully</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          The route dialog shows a <b>market reference fare</b> — this is what passengers expect to pay for that distance. Stay within 10–20% of it. Price 40% above and your load crashes to 30%. Price 40% below and seats fill but you lose money on every passenger. Your first route: start at the reference fare, then nudge down 5–10% to fill seats fast while you're still ramping up.
          <span class="gchev-where">→ Fare field in the New Route dialog</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📊</span><span class="gchev-title">4 · End the Month & Read the Results</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Press <b>END MONTH</b> (bottom-right of the map). Time advances, passengers fly, revenue arrives, rivals move. New routes take 3–6 months to reach full demand — don't panic if month 1 is thin. Click any route card in the <b>ROUTES tab</b> to open its P&L panel and see exactly what's happening, including diagnostic hints if it's losing money.
          <span class="gchev-where">→ END MONTH button, bottom-right of map</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🎯</span><span class="gchev-title">First-Year Goals</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          By month 12 you should have: <b>3–5 profitable routes</b>, <b>positive monthly cash flow</b>, and a <b>second hub</b> in a new region started. If you're losing money, open each route's P&L panel — the red <b style="color:var(--loss)">WHY THIS ROUTE IS LOSING</b> section tells you exactly why.
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
    </div>`,
  'hub': `
    <div class="guide-section">
      <div class="guide-section-title">Your Hub — The Heart of the Network</div>
      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Tap any topic to open it. Tap the header again or hit <b>‹ Back</b> to close.</div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🏠</span><span class="gchev-title">Every Route Starts Here</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Your hub is the origin of every passenger route you open. Pick destinations from it; you can't fly point-to-point between two non-hub cities. Bigger hub city = more population, economy, and departure gates.
          <span class="gchev-where">→ Chosen at game setup · shown with a ★ in the left panel HUBS list</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🚪</span><span class="gchev-title">Gates Are Your Capacity</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Each route consumes gates based on weekly flights. Keep usage <b>under 70%</b> — congestion surcharges kick in above that: <b style="color:var(--warn)">70–85% up to +12%</b>, <b style="color:var(--loss)">85–95% up to +30%</b> on every route from that hub. Win more gates via <b>Gate Bidding</b> when slots open.
          <span class="gchev-where">→ Left panel: HUBS list shows the gate bar per hub</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🔁</span><span class="gchev-title">Spokes Feed Each Other</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Every extra route at a hub adds <b>+2% demand</b> to all the others (cap +30%, and ×1.4 on long-haul). Transfer passengers flow through your network — a thin feeder route can pay for itself by filling your widebodies. Build dense hubs, not scattered routes.
          <span class="gchev-where">→ Hub card shows "🔁 N spokes · +X% network demand"</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🏗</span><span class="gchev-title">Expand With a Second Hub</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Build hubs in new regions to unlock their route map. Each extra hub costs $1.2M/month upkeep, so open one only when you have 3–5 profitable routes and the cash to fill it with 2–3 routes immediately.
          <span class="gchev-where">→ Left panel: Operations › 🏗 Build Hub</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>

      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📋</span><span class="gchev-title">Visible Example — Hub Card</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="background:rgba(0,0,0,0.35);border:1px dashed rgba(167,137,255,0.35);border-radius:10px;padding:12px 14px">
            <div style="font-size:10.7px;color:#fff;letter-spacing:1.5px;margin-bottom:8px">WHAT YOU'LL SEE IN THE HUBS LIST</div>
            <div style="max-width:300px;font-size:11.3px">
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="color:#fff">★ Chicago</span><span style="color:var(--warn);font-size:10.7px">3 of 22 free</span></div>
              <div style="height:3px;background:var(--border);border-radius:2px;overflow:hidden;margin-top:3px"><div style="height:100%;width:86%;background:var(--warn)"></div></div>
              <div style="font-size:10.2px;color:var(--warn);margin-top:2px">⚠ +14% surcharge</div>
              <div style="font-size:10.2px;color:#fff;margin-top:1px">🔁 11 spokes · +20% network demand</div>
            </div>
            <div style="font-size:10.7px;color:var(--muted2);margin-top:10px;line-height:1.6">Read it as: 19 of 22 gates used (amber bar = congestion zone, costs +14% on every Chicago route), but 11 connected routes are boosting each other's demand by 20%. Bid for gates or trim low-value flights.</div>
          </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
    </div>
  `,
  'routes': `
    <div class="guide-section">      <div class="guide-section-title">Launching Routes That Make Money</div>      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Tap any topic to open it. Tap the header again or hit <b>‹ Back</b> to close.</div>      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🛫</span><span class="gchev-title">Pick a Destination With Demand</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Demand comes from <b>population + economy + tourism</b> of both cities, shrinking with distance. The New Route dialog previews estimated load % and profit before you commit — aim for a preview of <b>60%+ load</b>. Same-region cities near your hub are the safest early picks.
          <span class="gchev-where">→ Left panel: Operations › 🛫 New Route (or click a city on the map)</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">💵</span><span class="gchev-title">Price Against the Reference Fare</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Every route shows a market <b>reference fare</b>. Price 5–10% under it to fill seats while the route ramps; never stray more than ~20% either way. Overprice → empty seats. Underprice → full plane, no margin.
          <span class="gchev-where">→ Fare field in the New Route dialog · editable later from the route's P&L panel</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">💺</span><span class="gchev-title">Watch Load vs Breakeven</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          The load bar carries an amber <b>breakeven marker</b> — the fill % needed to cover fuel, crew, lease and handling. Above it = profit. Consistently 90%+? Add a flight or raise the fare. Below breakeven? Cut frequency, drop the fare, or swap to a smaller aircraft.
          <span class="gchev-where">→ ROUTES tab: click any route card for the full P&L breakdown</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📈</span><span class="gchev-title">Give It Time to Ramp</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          New routes open at ~78% of their true demand and build to 100% over <b>3–6 months</b>; sustained high loads add a loyalty bonus on top. Don't kill a route after one thin month — check the trend in its history sparkline first.
          <span class="gchev-where">→ Route P&L panel shows monthly history</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📋</span><span class="gchev-title">Visible Example — Route Card</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="background:rgba(0,0,0,0.35);border:1px dashed rgba(167,137,255,0.35);border-radius:10px;padding:12px 14px">
        <div style="font-size:10.7px;color:#fff;letter-spacing:1.5px;margin-bottom:8px">WHAT YOU'LL SEE IN THE ROUTES TAB</div>
        <div style="max-width:340px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.3px">
          <div style="display:flex;justify-content:space-between"><b style="color:var(--text)">Chicago → New York</b><b style="color:var(--profit)">+$2.41M/mo</b></div>
          <div style="color:var(--muted2);font-size:10.7px;margin:3px 0">6 fl/wk · A320 · fare $128 <span style="color:var(--muted)">(ref $142)</span> · 🔁 310 transfer pass</div>
          <div style="position:relative;height:6px;background:var(--border);border-radius:3px;margin-top:4px">
            <div style="height:100%;width:72%;background:var(--profit);border-radius:3px"></div>
            <div style="position:absolute;top:-2px;left:55%;width:2px;height:10px;background:var(--warn)"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10.2px;color:var(--muted2);margin-top:3px"><span>72% load</span><span style="color:var(--warn)">▮ breakeven 55%</span></div>
        </div>
        <div style="font-size:10.7px;color:var(--muted2);margin-top:10px;line-height:1.6">Healthy route: load (72%) is well above the amber breakeven mark (55%), fare sits just under reference, and hub connections are feeding it transfer passengers. Room to nudge the fare up.</div>
      </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🌡</span><span class="gchev-title">The Demand Heatmap</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Toggle the <b>🌡 Demand</b> button (bottom of the map) to paint unserved demand onto the world. Dots run <b style="color:#4caf50">green</b> → <b style="color:#ffb300">yellow</b> → <b style="color:#f44336">red</b>: red means a <b>large market you aren't serving</b> — the bigger and hotter the dot, the more passengers are waiting. Small cities cap out at yellow even when totally unserved, so red is always worth a look. Dots fade as your routes absorb the demand.
          <span class="gchev-where">→ Map › 🌡 Demand toggle · recheck after adding hubs, distance to your nearest hub matters</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
    </div>
  `,
  'fleet': `
    <div class="guide-section">      <div class="guide-section-title">Building the Right Fleet</div>      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Tap any topic to open it. Tap the header again or hit <b>‹ Back</b> to close.</div>      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">✈</span><span class="gchev-title">Match the Plane to the Route</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Two hard rules: <b>range ≥ route distance</b>, and <b>seats ≈ demand</b>. Narrowbodies (100–220 seats) earn on short/medium routes; widebodies and jumbos only pay off on long-haul with feeder traffic. A half-empty A380 bleeds lease money every week.
          <span class="gchev-where">→ Left panel: Operations › ✈ Buy Aircraft (route dialog also offers in-range planes)</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">⛽</span><span class="gchev-title">Read the Stat Bars</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Each aircraft card shows seats, range, fuel efficiency and speed. Higher efficiency = lower fuel cost per seat-mile — it's what separates an A320neo from a 1970s trijet. Newer types cost more up front but dominate on operating cost.
          <span class="gchev-where">→ Buy Aircraft modal, organized by class: Narrowbody / Widebody / Jumbo / Supersonic</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">⚙</span><span class="gchev-title">Wear Costs Money — Renew Your Fleet</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Aircraft wear with use and age. From <b>20 years</b> a surcharge grows on every cost line (up to +50% at 40yr), fleet health drops, and incident risk rises — groundings stop a route cold. Run A-checks regularly, C-checks when health dips, and sell types before they turn 28.
          <span class="gchev-where">→ Left panel: 🔧 Hangar &amp; Maintenance · year-end warnings flag aging fleets</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📋</span><span class="gchev-title">Visible Example — Comparing Two Aircraft</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="background:rgba(0,0,0,0.35);border:1px dashed rgba(167,137,255,0.35);border-radius:10px;padding:12px 14px">
        <div style="font-size:10.7px;color:#fff;letter-spacing:1.5px;margin-bottom:8px">WHAT YOU'LL SEE IN BUY AIRCRAFT</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:170px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:9px 11px;font-size:11.3px">
            <b style="color:var(--text);font-size:11.9px">A320neo</b> <span style="color:var(--muted2)">· $52M</span>
            <div style="margin-top:6px;color:var(--muted2)">Seats 194</div><div style="height:3px;background:var(--border);border-radius:2px"><div style="height:100%;width:35%;background:var(--accent)"></div></div>
            <div style="margin-top:4px;color:var(--muted2)">Range 4,000mi</div><div style="height:3px;background:var(--border);border-radius:2px"><div style="height:100%;width:46%;background:var(--accent)"></div></div>
            <div style="margin-top:4px;color:var(--muted2)">Fuel efficiency</div><div style="height:3px;background:var(--border);border-radius:2px"><div style="height:100%;width:68%;background:var(--profit)"></div></div>
            <div style="margin-top:6px;color:var(--profit);font-size:10.2px">✓ Short/medium workhorse</div>
          </div>
          <div style="flex:1;min-width:170px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:9px 11px;font-size:11.3px">
            <b style="color:var(--text);font-size:11.9px">B787-9</b> <span style="color:var(--muted2)">· $110M</span>
            <div style="margin-top:6px;color:var(--muted2)">Seats 296</div><div style="height:3px;background:var(--border);border-radius:2px"><div style="height:100%;width:53%;background:var(--accent)"></div></div>
            <div style="margin-top:4px;color:var(--muted2)">Range 7,530mi</div><div style="height:3px;background:var(--border);border-radius:2px"><div style="height:100%;width:87%;background:var(--accent)"></div></div>
            <div style="margin-top:4px;color:var(--muted2)">Fuel efficiency</div><div style="height:3px;background:var(--border);border-radius:2px"><div style="height:100%;width:50%;background:var(--profit)"></div></div>
            <div style="margin-top:6px;color:var(--warn);font-size:10.2px">⚠ Needs long-haul + feeders to fill</div>
          </div>
        </div>
      </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev-subhead">Maintenance &amp; The Hangar</div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🩺</span><span class="gchev-title">Every Type Has a Health Bar</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Each aircraft type carries <b>health (0–100%)</b> that wears down monthly. Wear accelerates with <b>age</b> and <b>workload</b> — an old jet flying 5 routes wears several times faster than a parked new one. Low health invites breakdowns, which cost cash and can ground the plane.
          <span class="gchev-where">→ Left panel: 🔧 Hangar &amp; Maintenance</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🔧</span><span class="gchev-title">Three Service Tiers</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <b>A-Check</b> ($2.5M, +12 health, no downtime) for routine upkeep · <b>C-Check</b> ($9M, +35, grounded 1 month) · <b>Engine Overhaul</b> ($18M, +55, grounded 2 months) for aged high-cycle aircraft. Service <i>before</i> health collapses — below <b>15% health</b> the regulator forces a C-Check and grounds you 2 months with no say in the timing.
          <span class="gchev-where">→ Hangar › per-aircraft service buttons</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">⛔</span><span class="gchev-title">Grounded = Routes Go Dark</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          While a type is grounded, <b>every route flown by that aircraft earns zero demand</b> — costs keep running. Spread key routes across multiple types so one grounding can't black out the network, and carry <b>insurance</b> to absorb incident costs; premium cover also cuts grounding time by 40%.
          <span class="gchev-where">→ Hangar › Insurance tab</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
    </div>
  `,
  'staff': `
    <div class="guide-section">      <div class="guide-section-title">Staff &amp; Operations</div>      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Tap any topic to open it. Tap the header again or hit <b>‹ Back</b> to close.</div>      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">👨‍✈️</span><span class="gchev-title">Hire Crew &amp; Guard Morale</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Routes need pilots and cabin crew. <b>Morale</b> directly multiplies demand (happy crew = better service) and cuts crew costs — low morale risks incidents and <b>strikes that zero out demand</b> until settled. Train crew, pay fairly, settle disputes fast.
          <span class="gchev-where">→ Left panel: 👨‍✈️ Crew Management</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">💰</span><span class="gchev-title">Tune the Three Budgets</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <b>Service</b> and <b>Advertising</b> budgets boost demand on every route (~5% per level above the baseline); <b>Repair</b> slows fleet wear. Slider 1 is the lean baseline — free. Each step above 1 costs $0.09M/mo per slider. Raise them as routes become profitable.
          <span class="gchev-where">→ Left panel: 💰 Budget</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🏛</span><span class="gchev-title">Hire Executives</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          The Board adds passive bonuses: a <b>CFO</b> cuts loan interest and boosts venture income, a <b>COO</b> lifts load factors, a <b>Strategy chief</b> shields you from rival demand-splitting. They draw a salary — hire when the bonus outearns it.
          <span class="gchev-where">→ Left panel: 🏛 Board of Directors · 📋 Advisor Report flags what needs attention</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🥵</span><span class="gchev-title">Watch the Workload</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Every route you operate adds <b>monthly workload stress</b> that drains crew morale — a 12+ route network bleeds several points a month on a lean budget. Offset it with a <b>Generous crew budget</b> (+4 morale/mo) and training. Crew under <b>30% morale</b> start resigning, and replacements cost signing fees and arrive green.
          <span class="gchev-where">→ Human Resources › Crew Budget tier buttons</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📇</span><span class="gchev-title">Crew Profiles &amp; Skills</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          After 12 months of operation, click any crew member's name to open their <b>profile</b>: four skill bars (pilots: Airmanship, Fuel Efficiency, Long-Haul, Leadership · cabin: Service, Safety, Languages, Leadership), a training record, and a full career history. <b>Training programs grant big skill jumps</b>; skills also creep up monthly from experience, faster when morale is high. Skills now drive the ★ rating — a drilled veteran outranks a cheerful rookie.
          <span class="gchev-where">→ Crew Management › click a name with the PROFILE ▸ tag</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📋</span><span class="gchev-title">Visible Example — Crew Morale</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="background:rgba(0,0,0,0.35);border:1px dashed rgba(167,137,255,0.35);border-radius:10px;padding:12px 14px">
        <div style="font-size:10.7px;color:#fff;letter-spacing:1.5px;margin-bottom:8px">WHAT YOU'LL SEE IN CREW MANAGEMENT</div>
        <div style="max-width:300px;font-size:11.3px">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text)">Crew morale</span><b style="color:var(--warn)">61%</b></div>
          <div style="height:5px;background:var(--border);border-radius:3px;margin-top:4px;overflow:hidden"><div style="height:100%;width:61%;background:linear-gradient(90deg,var(--loss),var(--warn))"></div></div>
          <div style="font-size:10.7px;color:var(--warn);margin-top:4px">⚠ Demand −4% · strike risk rising — run training or raise pay</div>
        </div>
        <div style="font-size:10.7px;color:var(--muted2);margin-top:10px;line-height:1.6">Above ~75% morale boosts demand; below ~50% expect walkout threats. A strike grounds demand to zero on affected routes until you settle.</div>
      </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
    </div>
  `,
  'alliances': `
    <div class="guide-section">      <div class="guide-section-title">Rivals, Alliances &amp; Competition</div>      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Tap any topic to open it. Tap the header again or hit <b>‹ Back</b> to close.</div>      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🛩</span><span class="gchev-title">Rivals Split Your Demand</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Every rival operating in a region skims passengers from your routes there. They expand from their own hubs, bid for gates, and grow aggressively on higher difficulties. Track them in the RIVALS tab — value, routes, and territory.
          <span class="gchev-where">→ Right panel: RIVALS tab · rankings show who leads each region</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🤝</span><span class="gchev-title">Codeshare When It's Cheaper Than War</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Pay an alliance fee to a rival and for <b>12 months</b> they withdraw from your overlapping routes and feed you <b>+15% demand</b> on shared corridors. Best used against the rival hurting your richest region — renew before it lapses or they come back swinging.
          <span class="gchev-where">→ Left panel: 🤝 Alliances (also reachable from a rival's card)</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🚪</span><span class="gchev-title">Fight for Slots &amp; Cities</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Some cities require <b>Slot Negotiations</b> before you can fly there; gate auctions pit you against rivals for scarce capacity. Outbidding a rival at a contested airport both grows you and starves them.
          <span class="gchev-where">→ Left panel: 🤝 Slot Negotiations · gate bids appear as timed events</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📋</span><span class="gchev-title">Visible Example — Allied Rival</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="background:rgba(0,0,0,0.35);border:1px dashed rgba(167,137,255,0.35);border-radius:10px;padding:12px 14px">
        <div style="font-size:10.7px;color:#fff;letter-spacing:1.5px;margin-bottom:8px">WHAT YOU'LL SEE IN THE RIVALS TAB</div>
        <div style="max-width:320px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:11.3px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b style="color:#e87040">Pacific Crown Air</b>
            <span style="font-size:10.2px;background:rgba(78,234,170,0.12);color:var(--profit);border:1px solid rgba(78,234,170,0.3);border-radius:4px;padding:2px 6px">🤝 ALLIED · 9 mo left</span>
          </div>
          <div style="color:var(--muted2);font-size:10.7px;margin-top:3px">$842M · 14 routes · hub: Tokyo · SE Asia + Oceania</div>
          <div style="color:var(--profit);font-size:10.7px;margin-top:3px">+15% demand on 4 codeshare corridors</div>
        </div>
        <div style="font-size:10.7px;color:var(--muted2);margin-top:10px;line-height:1.6">While allied they stop splitting your SE Asia demand. Watch the countdown — when it hits zero the codeshare boost vanishes and competition resumes.</div>
      </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
    </div>
  `,
  'winning': `
    <div class="guide-section">      <div class="guide-section-title">Winning the Game</div>      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Tap any topic to open it. Tap the header again or hit <b>‹ Back</b> to close.</div>      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🎯</span><span class="gchev-title">Know Your Objective</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <b>Scenario:</b> hit the scenario's stated challenge. <b>Domination:</b> lead every required region in passengers. <b>Mystery:</b> the objective is hidden — deduce it from the classified hint. <b>Eras:</b> build maximum company value from 1970 to 2030. <b>Daily:</b> chase a high score under the day's twist.
          <span class="gchev-where">→ Top of screen: GOAL progress bar · event log states it at game start</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">💀</span><span class="gchev-title">Don't Lose First</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Three ways to fail: <b>bankruptcy</b> (cash below −$200M at year end), a rival <b>dominating the skies</b> (4× your annual passengers after year 6), or the <b>20-year clock</b> expiring on untimed objectives. Cash is oxygen — keep a buffer for fuel shocks.
          <span class="gchev-where">→ The game monitor flags critical risks · 📋 Advisor Report each quarter</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🏆</span><span class="gchev-title">Then Win Big — Grades &amp; Records</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          Victories are graded by final <b>company value</b> (routes, cash, fleet, share price all feed it). Achievements, lifetime stats and daily streaks persist across runs in your Pilot Records — S-rank everything.
          <span class="gchev-where">→ Endgame screen · 🏆 RECORDS on the title screen</span>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📋</span><span class="gchev-title">Visible Example — Grade Ladder</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="background:rgba(0,0,0,0.35);border:1px dashed rgba(167,137,255,0.35);border-radius:10px;padding:12px 14px">
        <div style="font-size:10.7px;color:#fff;letter-spacing:1.5px;margin-bottom:8px">HOW YOUR VICTORY IS GRADED</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:11.3px;text-align:center">
          <div style="flex:1;min-width:84px;border:1px solid rgba(255,215,0,0.4);border-radius:8px;padding:8px 4px;background:rgba(255,215,0,0.06)"><div style="font-size:22.6px;font-weight:900;color:#ffd700">S</div><div style="color:var(--muted2)">&gt; $2,000M</div></div>
          <div style="flex:1;min-width:84px;border:1px solid var(--border);border-radius:8px;padding:8px 4px"><div style="font-size:22.6px;font-weight:900;color:var(--profit)">A</div><div style="color:var(--muted2)">&gt; $1,000M</div></div>
          <div style="flex:1;min-width:84px;border:1px solid var(--border);border-radius:8px;padding:8px 4px"><div style="font-size:22.6px;font-weight:900;color:#fff">B</div><div style="color:var(--muted2)">&gt; $500M</div></div>
          <div style="flex:1;min-width:84px;border:1px solid var(--border);border-radius:8px;padding:8px 4px"><div style="font-size:22.6px;font-weight:900;color:var(--warn)">C</div><div style="color:var(--muted2)">&gt; $200M</div></div>
          <div style="flex:1;min-width:84px;border:1px solid var(--border);border-radius:8px;padding:8px 4px"><div style="font-size:22.6px;font-weight:900;color:var(--muted)">D</div><div style="color:var(--muted2)">won, &lt; $200M</div></div>
        </div>
        <div style="font-size:10.7px;color:var(--muted2);margin-top:10px;line-height:1.6">Company value at the moment of victory sets the grade. Scored modes (Daily, Eras) use the same ladder with a C floor for finishing.</div>
      </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
    </div>
  `,
  'strategy': `
    <div class="guide-section">      <div class="guide-section-title">Strategy</div>      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Tap any topic to open it. Tap the header again or hit <b>‹ Back</b> to close.</div>      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">📊</span><span class="gchev-title">Route Economics</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="background:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.2);border-radius:8px;padding:11px 14px;margin-bottom:10px;font-size:13px;color:var(--muted);line-height:1.75;font-family:'DM Mono'">
        Profit = Revenue − (Fuel + Crew + Handling + Lease + Age ± Congestion)
      </div>
      <div style="font-size:13.6px;color:var(--muted);line-height:1.75">
        Every route has a <b style="color:var(--text)">breakeven load factor</b> — the minimum seat fill % to cover fixed costs. It appears as the amber marker on the load bar. Stay above it and the route is profitable. Click any route card → P&L panel to see the full cost breakdown.
      </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🧲</span><span class="gchev-title">Demand Drivers</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:4px">
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
          <div style="font-size:11.3px;font-weight:700;color:#fff;margin-bottom:5px;letter-spacing:.5px">🏙 POPULATION & ECONOMY</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.65">Large wealthy cities generate more passengers. NYC–Tokyo > Tunis–Nairobi.</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
          <div style="font-size:11.3px;font-weight:700;color:#fff;margin-bottom:5px;letter-spacing:.5px">🌴 TOURISM SCORE</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.65">Bangkok, Dubai, Phuket punch above their weight. Great for holiday routes.</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
          <div style="font-size:11.3px;font-weight:700;color:#fff;margin-bottom:5px;letter-spacing:.5px">💰 FARE PRICING</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.65">Drop 20% below reference → loads surge. Raise 40% above → passengers defect.</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
          <div style="font-size:11.3px;font-weight:700;color:#fff;margin-bottom:5px;letter-spacing:.5px">⏳ ROUTE MATURITY</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.65">New routes start at 78% demand and ramp to 100% over 6 months. Be patient.</div>
        </div>
      </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">🗺</span><span class="gchev-title">Hub Strategy</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="display:flex;gap:7px;margin-bottom:10px">
        <div style="flex:1;background:rgba(167,137,255,0.06);border:1px solid rgba(167,137,255,0.2);border-radius:8px;padding:10px 12px;text-align:center">
          <div style="font-size:20.3px;font-weight:800;color:#fff;font-family:'DM Mono'">26</div>
          <div style="font-size:10.7px;color:var(--muted);margin-top:2px">gates, Level 5 hub</div>
        </div>
        <div style="flex:1;background:rgba(255,207,90,0.06);border:1px solid rgba(255,207,90,0.2);border-radius:8px;padding:10px 12px;text-align:center">
          <div style="font-size:20.3px;font-weight:800;color:var(--warn);font-family:'DM Mono'">70%</div>
          <div style="font-size:10.7px;color:var(--muted);margin-top:2px">gates used → surcharge starts</div>
        </div>
        <div style="flex:1;background:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.2);border-radius:8px;padding:10px 12px;text-align:center">
          <div style="font-size:20.3px;font-weight:800;color:var(--loss);font-family:'DM Mono'">95%</div>
          <div style="font-size:10.7px;color:var(--muted);margin-top:2px">gates used → pulsing red ring</div>
        </div>
      </div>
      <div style="font-size:13.6px;color:var(--muted);line-height:1.75">Formula: <b style="color:var(--text)">16 + (city level × 2) gates</b>. Near the limit? Build a second hub or close underperforming routes. Inter-regional routes tap larger markets with less competition.</div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">⚔</span><span class="gchev-title">Managing Rivals</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="font-size:13.6px;color:var(--muted);line-height:1.75;margin-bottom:10px">Each rival in your destination region splits demand by ~42%. Two rivals = you fight for a third of the market. Rival routes appear as <b style="color:var(--text)">dashed colored lines</b> on the map — click any to see their stats.</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:7px;padding:9px 12px">
          <div style="font-size:18.1px;flex-shrink:0">⚔</div>
          <div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px">Gate Wars</div><div style="font-size:13px;color:var(--muted)">Lock rivals off a route for 3–6 months · $15–30M</div></div>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:7px;padding:9px 12px">
          <div style="font-size:18.1px;flex-shrink:0">🤝</div>
          <div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px">Alliances</div><div style="font-size:13px;color:var(--muted)">Codeshare — rival stops competing, you gain +15% demand · 12 months</div></div>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:7px;padding:9px 12px">
          <div style="font-size:18.1px;flex-shrink:0">📣</div>
          <div><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px">Ad Campaigns</div><div style="font-size:13px;color:var(--muted)">Boost regional tourism demand · $10–100M · 12 months</div></div>
        </div>
      </div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
      <div class="gchev">
        <div class="gchev-head" onclick="toggleGuideChev(this)">
          <span class="gchev-emoji">✈</span><span class="gchev-title">Fleet Planning</span><span class="gchev-arrow">›</span>
        </div>
        <div class="gchev-body"><div class="gchev-inner">
          <div style="display:flex;gap:7px;margin-bottom:10px">
        <div style="flex:1;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
          <div style="font-size:11.3px;font-weight:700;color:var(--warn);margin-bottom:5px">⚙ FLEET WEAR</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.6">+2%/yr on costs after 8 years <b>in your fleet</b> (cap +30%); designs 30+ years old add up to +10% heritage. Buying new resets the clock.</div>
        </div>
        <div style="flex:1;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
          <div style="font-size:11.3px;font-weight:700;color:#fff;margin-bottom:5px">📦 CARGO ROUTES</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.6">Monetise spare aircraft. Follows economic corridors, less affected by tourism swings.</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--muted2);background:rgba(0,0,0,0.2);border-radius:6px;padding:8px 12px">Sell ageing aircraft via <b style="color:var(--text)">Buy Aircraft › Sell 1</b> — you get 55¢ on the dollar back.</div>
          <button class="gchev-back" onclick="closeGuideChev(this)">‹ Back</button>
        </div></div>
      </div>
    </div>
  `,
  'faq': `
    <div class="guide-section">
      <div class="guide-section-title">Money & Routes</div>
      ${[
        ['❓ Why is my route losing money?',
         `Open the route card → <b>P&L panel</b>. Look for the red <b>WHY THIS ROUTE IS LOSING</b> section — it pinpoints the cause. Most common: <b>fare too high</b> (load below breakeven), <b>aircraft too large</b> (empty seats + high lease), or <b>route too new</b> (demand ramps over 6 months). The amber marker on the load bar is your breakeven — get above it.`],
        ['❓ My route has 90% load — should I raise fares?',
         `Yes. Full plane = demand exceeds capacity. Raise <b>5–10% at a time</b> and watch next month's load. Keep going until load settles at <b>75–85%</b> — that's the profit sweet spot between revenue per seat and total passengers.`],
        ['❓ What does load factor mean?',
         `Percentage of seats with passengers. <b>100% = full, 0% = empty.</b> Your breakeven load is the minimum to cover all costs — the amber marker on the load bar. Above it = profitable. Below it = burning cash every flight.`],
      ].map(([q,a],i) => `
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)" id="faq-q-m${i}">
            <span>${q}</span><span style="font-size:14.7px;color:var(--muted2)">›</span>
          </div>
          <div class="faq-a" id="faq-a-m${i}">${a}</div>
        </div>`).join('')}
    </div>
    <div class="guide-section">
      <div class="guide-section-title">Hubs & Expansion</div>
      ${[
        ['❓ How do I unlock routes to new regions?',
         `Build a hub in the target region via <b>Operations › Build Hub</b>. You must already fly a route to that city. Hub costs range from <b>$30M</b> (small city) to <b>$180M</b> (major hub). Alternatively, <b>Slot Negotiations</b> secures landing rights in 1–3 months and improves loads on existing routes.`],
        ['❓ What is hub gate capacity?',
         `Each hub handles a limited number of routes. Formula: <b>16 + (city level × 2) gates</b>. A Level 5 hub = 26 gates. At <b>70%+</b> usage, congestion surcharges appear. At <b>95%+</b>, a red pulsing ring appears on the map and costs spike. Gate usage shows in the Your Hubs section of the left panel.`],
        ['❓ How do I deal with a fuel crisis?',
         `A fuel crisis raises costs 40–60% for several months. Short term: close least profitable long-haul routes. Medium term: use <b>Fuel Hedging</b> (Finance menu) to lock in fuel prices — especially useful when you see a crisis event appear in the News feed.`],
      ].map(([q,a],i) => `
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)" id="faq-q-h${i}">
            <span>${q}</span><span style="font-size:14.7px;color:var(--muted2)">›</span>
          </div>
          <div class="faq-a" id="faq-a-h${i}">${a}</div>
        </div>`).join('')}
    </div>
    <div class="guide-section">
      <div class="guide-section-title">Rivals & Fleet</div>
      ${[
        ['❓ Why are rivals getting all the passengers?',
         `Each rival in your destination region splits the market by ~42%. Two rivals = you fight for a third. Counter: <b>⚔ Gate Wars</b> ($15–30M, blocks a rival from a route for 3–6 months) · <b>🤝 Alliances</b> (rival stops competing, you get +15% demand) · <b>📣 Ad Campaign</b> (grow the total market).`],
        ['❓ My aircraft is old — should I retire it?',
         `Aircraft over <b>15 years old</b> pay +2%/yr maintenance (capped at +50% at 25+ years). Fleet tab shows age warnings at 20 years. Sell via <b>Buy Aircraft › Sell 1</b> — you get 55¢ on the dollar back. Reinvest in newer aircraft immediately.`],
        ['❓ What do cargo routes do?',
         `Cargo earns revenue on high-GDP city pairs without depending on tourism. Uses spare aircraft not on passenger routes. Less affected by tourism events and pandemics — good for diversifying income when passenger demand dips.`],
        ['❓ How do I win the game?',
         `Check <b>Goal Progress</b> in the left panel — it shows exactly what you need. Generally: lead required regions in passengers, hold hubs, stay profitable. You start in 2024 with up to <b>20 years</b> (until 2044). Winning faster earns a higher grade.`],
      ].map(([q,a],i) => `
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)" id="faq-q-r${i}">
            <span>${q}</span><span style="font-size:14.7px;color:var(--muted2)">›</span>
          </div>
          <div class="faq-a" id="faq-a-r${i}">${a}</div>
        </div>`).join('')}
    
    <div class="guide-section">
      <div class="guide-section-title">Crew &amp; Maintenance</div>
      ${[
        ['❓ Why is my route suddenly at 0% load?',
         `Almost always a <b>grounded aircraft</b>. Check 🔧 Hangar — if the type flying that route is in maintenance (or hit by a forced inspection), every one of its routes earns zero until it's cleared. The fix: keep health above 15% with regular A-Checks, and don't fly your whole network on one type.`],
        ['❓ Why did a crew member resign?',
         `Morale under <b>30%</b> gives each crew member a monthly chance of walking. Big networks drain morale through workload; lean crew budgets drain it further. Switch to a <b>Generous budget</b>, run training (it adds morale on top of skills), and settle incidents quickly. Their resignation stays on their profile's career history.`],
        ['❓ How do crew skills actually help?',
         `Skills feed the ★ rating, which reflects overall crew quality. Training programs add large skill chunks instantly (e.g. Advanced Pilot: +15 airmanship); day-to-day flying adds a slow monthly trickle, faster at high morale. Open any profile to see exactly what each completed program contributed.`],
        ['❓ What does the 🌡 Demand button show?',
         `Unserved passenger demand, weighted by city size. <b>Red dots are large markets nobody is flying to</b> — prime expansion targets. Small towns max out at yellow so they never shout louder than they deserve. Dots shrink as your capacity soaks up the market.`],
      ].map(([q,a],i) => `
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)" id="faq-q-c${i}">
            <span>${q}</span><span style="font-size:14.7px;color:var(--muted2)">›</span>
          </div>
          <div class="faq-a" id="faq-a-c${i}">${a}</div>
        </div>`).join('')}
    </div>
  </div>`,
  'glossary': `
    <div class="guide-section">
      <div class="guide-section-title">Glossary — Key Terms</div>
      <div style="font-size:11.9px;color:var(--muted2);margin-bottom:14px;line-height:1.6">Every term you'll meet in the game, grouped by area.</div>
      ${(() => {
        const TERMS = [
          ['📊','Load Factor',     'economics', 'Seats with passengers ÷ total seats × 100. 100% = full, 0% = empty. Aim for 75–85% on profitable routes.'],
          ['📉','Breakeven Load',  'economics', 'Minimum load % to cover all costs. Shown as the amber marker on route load bars.'],
          ['💵','Reference Fare',  'economics', 'Expected fare for that distance ($65 + $0.048/mi). Demand falls sharply when you price above it.'],
          ['📈','Fare Elasticity', 'economics', 'A 10% fare hike cuts demand ~8.5%. A 10% cut grows it. Price near the reference fare to stay full.'],
          ['🚪','Hub Gate',        'operations','One gate = one route from this hub. Capacity = 16 + city level × 2. At 95%+, costs spike severely.'],
          ['⏳','Route Maturity',  'operations','New routes start at 78% potential demand and ramp to 100% over 6 months. Be patient early on.'],
          ['💎','Loyalty Factor',  'operations','Routes with >60% avg load earn up to +8% extra demand from repeat passengers over time.'],
          ['🌡','Demand Heatmap',  'operations','Map overlay of unserved demand, weighted by city size. Red = big unserved market worth targeting.'],
          ['🩺','Fleet Health',    'fleet',     'Per-type condition 0–100%. Wears with age and workload. Below 15% triggers a forced 2-month grounding.'],
          ['🔧','A/C-Check',       'fleet',     'Maintenance tiers: A-Check $2.5M no downtime; C-Check $9M, 1mo grounded; Engine Overhaul $18M, 2mo.'],
          ['⛔','Grounded',        'fleet',     'Aircraft out of service. All routes flown by that type earn zero demand until cleared.'],
          ['⚙','Fleet Wear',      'fleet',     '+2%/yr on costs after 8 years in your fleet (cap +30%); designs 30+ years old add up to +10%. Sell & re-buy to reset the clock.'],
          ['📦','Cargo Route',     'fleet',     'Freight-only route. Demand scales with city GDP, not tourism. Uses spare aircraft.'],
          ['📇','Crew Profile',    'crew',      'Per-worker page: skill bars, training record, career history. Unlocks after 12 months of operation.'],
          ['💪','Crew Skill',      'crew',      '0–100 per discipline. Training adds big jumps; flying adds a slow monthly trickle. Drives the ★ rating.'],
          ['🥵','Workload Stress', 'crew',      'Monthly morale drain that scales with route count. Offset with a Generous crew budget and training.'],
          ['🤝','Alliance',        'rivals',    'Paid codeshare with a rival. They stop competing; you get +15% demand for 12 months.'],
          ['⚔','Gate Lock',       'rivals',    'Blocks a rival from a specific route for 3–6 months. Cost scales with route distance.'],
          ['⚡','Timed Effect',    'events',    'A world event lasting N months — fuel crisis, pandemic, sanctions. Visible in the News tab.'],
          ['🌆','Fulfill Score',   'cities',    'City service satisfaction (0–100%). High fulfillment causes cities to level up over time.'],
          ['👑','Region Lead',     'goals',     'You lead a region when your pass on routes there exceeds every rival in that region.'],
          ['🏢','Company Value',   'goals',     'Reflects profitable routes, fleet, hubs, pass volume, and cash net of debt. Drives share price.'],
          ['⛽','Fuel Hedge',      'finance',   'Lock in fuel prices for 3–12 months. Protects against oil crisis events in the News feed.'],
        ];
        const CAT_ORDER = ['economics','operations','fleet','crew','rivals','events','cities','goals','finance'];
        const CAT_LABEL = {economics:'Economics',operations:'Operations',fleet:'Fleet & Maintenance',crew:'Crew',rivals:'Rivals',events:'Events',cities:'Cities',goals:'Goals',finance:'Finance'};
        const CAT_COLOR = {economics:'var(--accent)',operations:'var(--accent3)',fleet:'var(--warn)',events:'var(--loss)',rivals:'#a78bfa',cities:'var(--profit)',goals:'#f59e0b',finance:'var(--muted)',crew:'#5eead4'};
        return CAT_ORDER.filter(cat => TERMS.some(t => t[2] === cat)).map(cat => {
          const col = CAT_COLOR[cat] || 'var(--muted)';
          const cards = TERMS.filter(t => t[2] === cat).map(([icon,term,,def]) => `
            <div style="background:rgba(255,255,255,0.025);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
                <span style="font-size:15.8px">${icon}</span>
                <span style="font-size:13.6px;font-weight:700;color:var(--text)">${term}</span>
              </div>
              <div style="font-size:12.4px;color:var(--muted);line-height:1.65">${def}</div>
            </div>`).join('');
          return `<div style="margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:8px;margin:0 0 8px">
              <span style="width:8px;height:8px;border-radius:2px;background:${col};box-shadow:0 0 8px ${col}"></span>
              <span style="font-size:11.3px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${col}">${CAT_LABEL[cat]}</span>
              <span style="flex:1;height:1px;background:linear-gradient(90deg,${col}44,transparent)"></span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">${cards}</div>
          </div>`;
        }).join('');
      })()}
    </div>`
};
let _activeGuideTab = 'first-flight';
function buildGuideModal(tab) {
  tab = tab || 'first-flight';
  const tabs = [
    ['first-flight','First Flight'],['hub','Your Hub'],['routes','Routes'],['fleet','Fleet'],
    ['staff','Staff & Ops'],['alliances','Rivals'],['strategy','Strategy'],['winning','Winning'],
    ['faq','FAQ'],['glossary','Glossary']
  ];
  const tabHtml = tabs.map(([id,label]) =>
    `<div class="guide-tab${id===tab?' active':''}" data-tab="${id}" onclick="switchGuideTab('${id}')" style="padding:8px 14px 8px 20px;font-size:11.3px">${label}</div>`
  ).join('');
  return modalHead('GUIDE & FAQ') +
    `<div style="flex-shrink:0;border-bottom:1px solid rgba(167,137,255,0.12);padding:0 22px">
       <div class="guide-tabs" id="guide-tabs" style="margin-top:0">${tabHtml}</div>
     </div>
     <div class="guide-body" id="guide-body" style="padding:18px 22px;overflow-y:auto;max-height:65vh">${GUIDE_CONTENT[tab]||''}</div>`;
}
function replayTour() {
  try { localStorage.removeItem('ae_tour_done'); } catch(e) {}
  closeModal();
  const qsg = document.getElementById('first-turn-guide');
  if (qsg) qsg.classList.remove('show');
  setTimeout(startTour, 300);
}
function switchGuideTab(tab) {
  _activeGuideTab = tab;
  document.querySelectorAll('.guide-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('guide-body').innerHTML = GUIDE_CONTENT[tab] || '';
}
function toggleFaq(el) {
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-q').forEach(q => q.classList.remove('open'));
  document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
  if (!isOpen) {
    el.classList.add('open');
    const idx = el.id.replace('faq-q-','');
    const ans = document.getElementById('faq-a-'+idx);
    if (ans) ans.classList.add('open');
  }
}
function showFirstTurnGuide() {
  const skip = (() => { try { return localStorage.getItem('ae_skip_guide')==='1'; } catch(e){ return false; } })();
  if (skip) return;
  // Show QSG modal
  const g = document.getElementById('first-turn-guide');
  if (g) g.classList.add('show');
  // Pre-check the checkbox if already set
  const cb = document.getElementById('qsg-skip-cb');
  if (cb) try { cb.checked = localStorage.getItem('ae_skip_guide')==='1'; } catch(e){}
}
function openGuideModal(tab) {
  // If called from QSG topic row: dismiss QSG and show full guide detail
  const qsg = document.getElementById('first-turn-guide');
  if (qsg && qsg.classList.contains('show')) {
    qsg.classList.remove('show');
    // Open full guide in the settings/info modal
    openModal('guide', tab || 'first-flight');
    return;
  }
  // Direct call (e.g. from left panel button): open full guide
  openModal('guide', tab || 'first-flight');
}
function dismissGuide(permanent) {
  const g = document.getElementById('first-turn-guide');
  if (g) g.classList.remove('show');
  const cb = document.getElementById('qsg-skip-cb');
  if (permanent || (cb && cb.checked)) {
    try { localStorage.setItem('ae_skip_guide','1'); } catch(e){}
  }
  const strip = document.getElementById('ftg-strip');
  if (strip && document.getElementById('game-ui') && !document.getElementById('game-ui').classList.contains('hidden')) {
    const allDone = !document.querySelector('.ftg-pip:not(.done):not(#pip-1)');
    if (!allDone) strip.style.display = 'flex';
  }
}
const STRIP_STEPS = ['Buy an aircraft','Open a route','Set your fare','End the month'];
function guideStep(n) {
  for (let i = 1; i <= 4; i++) {
    const pip = document.getElementById('pip-'+i);
    if (!pip) continue;
    pip.classList.remove('active','done');
    if (i < n) pip.classList.add('done');
    else if (i === n) pip.classList.add('active');
  }
  const stripText = document.getElementById('ftg-strip-text');
  if (stripText) stripText.textContent = STRIP_STEPS[n-1] || 'Complete!';
  const strip = document.getElementById('ftg-strip');
  if (n > 4 && strip) {
    setTimeout(() => { if (strip) strip.style.display = 'none'; }, 2000);
    if (stripText) stripText.textContent = '✓ You\'re airborne!';
  }
  const g = document.getElementById('first-turn-guide');
  if (g && g.classList.contains('show') && _activeGuideTab === 'first-flight') {
    switchGuideTab('first-flight');
  }
}
function toggleAcc(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}
function toggleGuideChev(head) {
  const group = head.closest('.gchev');
  if (group) group.classList.toggle('open');
}
function closeGuideChev(btn) {
  const group = btn.closest('.gchev');
  if (group) group.classList.remove('open');
}
function setSpeed(mode) {
  if (mode === 'pause') {
    if (STATE.timerMode === 'off') { showFlash('Select 1×, 2×, 4×, or 8× to start the timer'); return; }
    STATE.paused = !STATE.paused;
    if (STATE.paused) clearInterval(STATE.timerInterval);
    else startTimer();
    updatePauseUI(); updateSpeedUI();
    showFlash(STATE.paused ? '⏸ Simulation paused' : `▶ Simulation resumed at ${speedModeLabel(STATE.timerMode)}`);
    return;
  }
  STATE.paused = false;
  STATE.timerMode = mode;
  if (TIMER_MODES[mode]) STATE.timerMax = TIMER_MODES[mode];
  startTimer(); updateSpeedUI();
  showFlash(mode === 'off' ? '■ Manual turns — timer off' : `▶ Simulation speed: ${speedModeLabel(mode)}`);
  renderMap();   // re-bake plane animation durations for the new speed
}
function speedModeLabel(mode) {
  return ({ off:'MANUAL', relaxed:'1×', normal:'2×', fast:'4×', turbo:'8×' })[mode] || 'MANUAL';
}
function updateSpeedUI() {
  const map = { 'spd-off':'off', 'spd-relaxed':'relaxed', 'spd-normal':'normal', 'spd-fast':'fast', 'spd-turbo':'turbo' };
  Object.entries(map).forEach(([id, m]) => {
    const el = document.getElementById(id); if (!el) return;
    el.classList.toggle('active', STATE.timerMode === m && !STATE.paused);
    el.classList.toggle('paused', STATE.timerMode === m && !!STATE.paused);
    el.setAttribute('aria-pressed', String(STATE.timerMode === m));
  });
  const pb = document.getElementById('spd-pause');
  if (pb) { pb.classList.toggle('paused', !!STATE.paused); pb.classList.remove('active'); }
  const status = document.getElementById('hdr-speed-status');
  if (status) {
    status.textContent = STATE.paused ? `PAUSED · ${speedModeLabel(STATE.timerMode)}` : speedModeLabel(STATE.timerMode);
    status.classList.toggle('paused', !!STATE.paused);
    status.classList.toggle('manual', STATE.timerMode === 'off');
  }
  updateHdrPlayIcon();
}
function pulseDateAdvance(previousLabel) {
  const date = document.getElementById('h-date');
  const dateBox = date && date.closest('.hdr-datetime');
  if (!date || !dateBox) return;
  dateBox.classList.remove('date-advanced');
  void dateBox.offsetWidth;
  dateBox.classList.add('date-advanced');
  dateBox.setAttribute('title', `${previousLabel} completed — now ${date.textContent}`);
  setTimeout(() => dateBox.classList.remove('date-advanced'), 1500);
}
// ⬢ NIGHT MAP + DASHBOARD OVERVIEW STRIP (mockup, v46).
function nightMapOn() { try { return localStorage.getItem('aeMapNight') !== '0'; } catch(e) { return true; } }
function applyNightMap() {
  const mc = document.getElementById('map-container');
  const bt = document.getElementById('night-toggle');
  const on = nightMapOn();
  if (mc) mc.classList.toggle('night', on);
  if (bt) { bt.classList.toggle('active', on); bt.textContent = on ? '🌙 Night' : '☀️ Day'; }
}
function toggleNightMap() {
  try { localStorage.setItem('aeMapNight', nightMapOn() ? '0' : '1'); } catch(e) {}
  applyNightMap();
}
function dashStripCollapsed() { try { return localStorage.getItem('aeDashStrip') === '0'; } catch(e) { return false; } }
function applyDashStrip() {
  const s = document.getElementById('dash-strip');
  const ch = document.getElementById('ds-chev');
  const col = dashStripCollapsed();
  if (s) s.classList.toggle('collapsed', col);
  if (ch) ch.textContent = col ? '▴' : '▾';
}
function toggleDashStrip() {
  try { localStorage.setItem('aeDashStrip', dashStripCollapsed() ? '1' : '0'); } catch(e) {}
  applyDashStrip();
}
function renderDashStrip() {
  applyNightMap();
  applyDashStrip();
  if (dashStripCollapsed()) return;
  const netEl = document.getElementById('ds-network');
  if (netEl) {
    const routes = STATE.routes || [];
    const served = {};
    routes.forEach(r => { served[r.from] = (served[r.from]||0)+1; served[r.to] = (served[r.to]||0)+1; });
    let dots = '', lines = '';
    Object.entries(CITIES).forEach(([n,c]) => {
      const hits = served[n] || 0;
      if (hits) {
        const rr = Math.min(16, 7 + hits * 2.2);
        dots += `<circle cx="${c.x}" cy="${c.y}" r="${rr}" fill="#00d8f0" opacity=".16"/>`;
        dots += `<circle cx="${c.x}" cy="${c.y}" r="${Math.min(7, 3.5 + hits)}" fill="#a789ff"/>`;
      } else {
        dots += `<circle cx="${c.x}" cy="${c.y}" r="2.1" fill="#274a63" opacity=".8"/>`;
      }
    });
    routes.forEach(r => {
      const a = CITIES[r.from], b = CITIES[r.to];
      if (a && b) lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2aa8bf" stroke-width="2" opacity=".45"/>`;
    });
    netEl.innerHTML = `<svg viewBox="0 60 ${MAP_W} ${MAP_H-190}" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="${MAP_W}" height="${MAP_H}" fill="#050c14"/>${lines}${dots}</svg>`;
  }
  const finEl = document.getElementById('ds-financial');
  if (finEl) {
    const h = STATE._finHist || [];
    const sub = document.getElementById('ds-fin-sub');
    if (sub) sub.textContent = h.length ? `— last ${h.length} month${h.length!==1?'s':''}` : '';
    if (h.length < 2) {
      finEl.innerHTML = `<div class="ds-empty">Profit &amp; cost trends chart here<br>as months pass — end a few turns.</div>`;
    } else {
      const W = 340, H = 104, padL = 6, padR = 6, padT = 8, padB = 16;
      const vals = h.flatMap(p => [p.net, p.costs]);
      const vMax = Math.max(1, ...vals), vMin = Math.min(0, ...vals);
      const X = i => padL + i / (h.length - 1) * (W - padL - padR);
      const Y = v => padT + (1 - (v - vMin) / (vMax - vMin)) * (H - padT - padB);
      const line = (key) => h.map((p,i) => `${X(i).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(' ');
      const zeroY = Y(0);
      const lbl = (i) => `<text x="${X(i).toFixed(1)}" y="${H-3}" font-size="8" fill="#5a7186" text-anchor="middle" font-family="DM Mono">${h[i].label}</text>`;
      const labels = h.length <= 4 ? h.map((_,i)=>lbl(i)).join('') : [0, Math.floor((h.length-1)/2), h.length-1].map(lbl).join('');
      finEl.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${W-padR}" y2="${zeroY.toFixed(1)}" stroke="#22384c" stroke-width="1" stroke-dasharray="3 3"/>
        <polyline points="${line('costs')}" fill="none" stroke="#e0415c" stroke-width="1.6" opacity=".85"/>
        <polyline points="${line('net')}" fill="none" stroke="#35d47f" stroke-width="2"/>
        ${labels}
        <circle cx="${X(h.length-1).toFixed(1)}" cy="${Y(h[h.length-1].net).toFixed(1)}" r="2.6" fill="#35d47f"/>
      </svg>
      <div style="position:absolute;top:0;right:2px;display:flex;gap:9px;font-size:9.6px;color:var(--muted)">
        <span><span style="color:#35d47f">●</span> Profit</span><span><span style="color:#e0415c">●</span> Costs</span>
      </div>`;
    }
  }
  const trEl = document.getElementById('ds-toproutes');
  if (trEl) {
    const routes = (STATE.routes || []).slice().sort((a,b) => (b.profit||0) - (a.profit||0)).slice(0,5);
    if (!routes.length) {
      trEl.innerHTML = `<div class="ds-empty">No routes yet —<br>open one to see profit rankings.</div>`;
    } else {
      const maxP = Math.max(0.1, ...routes.map(r => Math.abs(r.profit||0)));
      trEl.innerHTML = routes.map((r,i) => {
        const p = r.profit || 0;
        const ab = n => (CITIES[n] && CITIES[n].abbr) || n.slice(0,3).toUpperCase();
        const w = Math.max(4, Math.abs(p)/maxP*100);
        return `<div class="ds-route-row">
          <span class="ds-route-rank">${i+1}</span>
          <span class="ds-route-name">${ab(r.from)} → ${ab(r.to)}</span>
          <span class="ds-route-bar"><i class="${p<0?'neg':''}" style="width:${w.toFixed(0)}%"></i></span>
          <span class="ds-route-val ${p<0?'neg':''}">${p<0?'−':'+'}$${Math.abs(p).toFixed(1)}M</span>
        </div>`;
      }).join('');
    }
  }
  renderLiveFlights();
  renderAirportAlerts();
}
// ⬢ LIVE FLIGHTS — monthly-proxy departure board (v47). Deterministic per
// (route, year, month): frozen within a turn, re-rolls at END MONTH.
function renderLiveFlights() {
  const el = document.getElementById('ds-liveflights');
  if (!el) return;
  const routes = (STATE.routes || []).slice().sort((a,b) => (b.profit||0) - (a.profit||0)).slice(0, 5);
  if (!routes.length) {
    el.innerHTML = `<div class="ds-empty">No flights on the board —<br>open a route to see departures.</div>`;
    return;
  }
  const prefix = ((STATE.coName || 'AE').replace(/[^A-Z0-9]/gi,'').slice(0,2) || 'AE').toUpperCase();
  const ab = n => (CITIES[n] && CITIES[n].abbr) || n.slice(0,3).toUpperCase();
  const pad2 = n => String(n).padStart(2,'0');
  const rows = routes.map((r, idx) => {
    const rnd = seededRng(`lf:${r.from}-${r.to}:${STATE.year}-${STATE.month}`);
    const fno = `${prefix}${100 + Math.floor(rnd() * 880)}`;
    const type = r.plane || (r.planes && r.planes[0] && r.planes[0].type) || 'A320';
    const ac = AIRCRAFT[type] || { speed: 540, type: 'medium' };
    const kmh = Math.round((ac.speed || 540) * 1.609 + (rnd() * 40 - 20));
    const altBase = ac.type === 'short' ? 34000 : (ac.type === 'medium' ? 36000 : 38000);
    const alt = altBase + Math.round(rnd() * 4) * 500;
    const dist = (typeof getDistance === 'function') ? getDistance(r.from, r.to) : 2000;
    const durH = Math.max(0.8, dist / ((ac.speed || 540)));
    const depM = Math.floor(rnd() * 1440);
    const arrM = (depM + Math.round(durH * 60)) % 1440;
    const t = m => `${pad2(Math.floor(m/60))}:${pad2(m%60)}`;
    const sroll = rnd();
    const status = sroll < 0.68 ? 'En Route' : (sroll < 0.85 ? 'Boarding' : 'Landed');
    const prog = status === 'En Route' ? Math.round(15 + rnd() * 72) : (status === 'Boarding' ? 0 : 100);
    const stCls = status === 'En Route' ? 'st-enroute' : (status === 'Boarding' ? 'st-boarding' : 'st-landed');
    return `<tr>
      <td class="fno" style="width:52px">${fno}</td>
      <td class="rt" style="width:82px">${ab(r.from)} → ${ab(r.to)}</td>
      <td style="width:88px">${type}</td>
      <td class="${stCls}" style="width:62px">${status}</td>
      <td style="width:42px">${t(depM)}</td>
      <td style="width:42px">${t(arrM)}</td>
      <td style="width:56px">${alt.toLocaleString()} ft</td>
      <td style="width:64px">${kmh} km/h</td>
      <td><span class="ds-lf-prog"><span class="bar"><i style="width:${prog}%"></i></span><span class="pc">${prog}%</span></span></td>
    </tr>`;
  }).join('');
  el.innerHTML = `<table class="ds-lf-table">
    <thead><tr><th style="width:52px">Flight</th><th style="width:82px">Route</th><th style="width:88px">Aircraft</th><th style="width:62px">Status</th><th style="width:42px">Dep</th><th style="width:42px">Arr</th><th style="width:56px">Alt</th><th style="width:64px">Speed</th><th>Progress</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}
// ⬢ AIRPORT ALERTS — real alert sources: city-tagged crises, hub congestion,
// grounded aircraft. Times are monthly-proxy flavor (seeded per turn).
function renderAirportAlerts() {
  const el = document.getElementById('ds-alerts');
  if (!el) return;
  const alerts = [];
  const rnd = seededRng(`al:${STATE.year}-${STATE.month}`);
  const ftime = () => `${String(Math.floor(rnd()*24)).padStart(2,'0')}:${String(Math.floor(rnd()*12)*5).padStart(2,'0')}`;
  (STATE.timedEffects || []).forEach(e => {
    if (!e.city || !CITIES[e.city]) return;
    const fx = String(e.fx || e.id || '');
    let msg = 'Advisory', ic = '⚠️';
    if (/storm|hurric|tornado|flood|ice|sand|volcan|snow|quake/i.test(fx)) { msg = 'Severe Weather'; ic = '🔴'; }
    else if (/strike/i.test(fx)) { msg = 'Crew Strike'; ic = '🔴'; }
    else if (/closure|war|siege/i.test(fx)) { msg = 'Operations Disrupted'; ic = '🔴'; }
    else if (e.mag != null && e.mag < 1) { msg = 'Demand Advisory'; ic = '⚠️'; }
    else return;
    alerts.push({ city: CITIES[e.city].abbr || e.city, msg, ic });
  });
  (STATE.hubs || []).forEach(h => {
    try {
      const used = hubGatesUsed(h), cap = hubGateCapacity(h);
      if (cap > 0 && used / cap >= 0.85) alerts.push({ city: CITIES[h]?.abbr || h, msg: 'High Congestion', ic: '⚠️' });
    } catch (e) {}
  });
  let grounded = 0;
  Object.values(STATE.fleetHealth || {}).forEach(hh => { if (hh && hh.groundedUntil && hh.groundedUntil > (STATE._absMonth||0)) grounded++; });
  if (grounded) alerts.push({ city: CITIES[STATE.homeBase]?.abbr || 'HUB', msg: `Runway Maintenance — ${grounded} grounded`, ic: '⚠️' });
  const shown = alerts.slice(0, 4);
  el.innerHTML = shown.length ? shown.map(a => `
    <div class="ds-alert-row">
      <span class="ds-alert-ic">${a.ic}</span>
      <span><span class="ds-alert-city">${a.city}</span><br><span class="ds-alert-msg">${a.msg}</span></span>
      <span class="ds-alert-time">${ftime()}</span>
    </div>`).join('')
    : `<div class="ds-empty">✓ All clear —<br>no active airport alerts.</div>`;
}
// ⬢ SIDEBAR FLEET STATUS + TOP AIRCRAFT (mockup, v45).
// Counts are real fleet data; the in-flight / at-airport split is monthly-proxy
// flavor — deterministic per turn (seeded on year+month), engine stays monthly.
function renderSidebarFleet() {
  const rowsEl = document.getElementById('sb-fleet-rows');
  const acEl = document.getElementById('sb-topac-rows');
  if (!rowsEl && !acEl) return;
  const planes = STATE.planes || {};
  const entries = Object.entries(planes).filter(([,p]) => planeTotal(p) > 0);
  const total = entries.reduce((s,[,p]) => s + planeTotal(p), 0);
  const assigned = entries.reduce((s,[,p]) => s + Math.min(p.assigned||0, planeTotal(p)), 0);
  const fh = STATE.fleetHealth || {};
  let maint = 0;
  Object.values(fh).forEach(h => { if (!h) return;
    if (h.groundedUntil && h.groundedUntil > (STATE._absMonth||0)) maint++;
    else if (h.health != null && h.health < 40) maint++; });
  maint = Math.min(maint, total);
  const share = 0.52 + seededRng('flt' + STATE.year + '-' + STATE.month)() * 0.16;
  const inFlight = Math.min(Math.max(0, total - maint), Math.round(assigned * share));
  const atAirports = Math.max(0, total - inFlight - maint);
  if (rowsEl) {
    const utilPct = total ? Math.round(assigned / total * 100) : 0;
    rowsEl.innerHTML = `
      <div class="ae-sb-row t-total"><span class="dot"></span><span class="lbl">Total Aircraft</span><span class="val">${total}</span></div>
      <div class="ae-sb-bar"><i style="width:${utilPct}%"></i></div>
      <div class="ae-sb-row t-flight"><span class="dot"></span><span class="lbl">In Flight</span><span class="val">${inFlight}</span></div>
      <div class="ae-sb-row t-ground"><span class="dot"></span><span class="lbl">At Airports</span><span class="val">${atAirports}</span></div>
      <div class="ae-sb-row t-maint ${maint ? 'hot' : ''}"><span class="dot"></span><span class="lbl">Maintenance</span><span class="val">${maint}</span></div>`;
  }
  if (acEl) {
    const top = entries.map(([n,p]) => {
      const t = planeTotal(p), a = Math.min(p.assigned||0, t);
      return { n, t, util: t ? Math.round(a / t * 100) : 0 };
    }).sort((a,b) => b.t - a.t || b.util - a.util).slice(0, 6);
    acEl.innerHTML = top.length ? top.map(r => `
      <div class="ae-topac-row">
        <div class="ae-topac-head"><span class="nm">${r.n}</span><span class="ut">${r.t}× · <b>${r.util}%</b></span></div>
        <div class="ae-topac-bar"><i style="width:${r.util}%"></i></div>
      </div>`).join('')
      : '<div style="font-size:11.3px;color:var(--muted)">No aircraft yet — visit Buy Aircraft.</div>';
  }
}
// ⬢ OPERATIONS CENTER — six status tiles, all real monthly-sim data.
// Live-ops mockup labels are reinterpreted into things the monthly game tracks.
function renderOpsCenter() {
  const box = document.getElementById('oc-tiles'); if (!box) return;
  const routes = STATE.routes || [];
  const activeRoutes = routes.length;
  const losing = routes.filter(r => (r.profit||0) < 0).length;
  // maintenance: aircraft with low health or grounded
  const fh = STATE.fleetHealth || {};
  let maintNeeded = 0, grounded = 0;
  Object.values(fh).forEach(h => {
    if (!h) return;
    if (h.groundedUntil && h.groundedUntil > (STATE._absMonth||0)) grounded++;
    else if ((h.health!=null) && h.health < 40) maintNeeded++;
  });
  // below break-even load
  let belowBE = 0;
  routes.forEach(r => {
    try { const be = (typeof breakevenLoad==='function') ? breakevenLoad(r) : 50;
      if ((r.load||0) < be) belowBE++; } catch(e){}
  });
  const cargo = (STATE.cargoRoutes || []).length;
  // incidents = active negative timed effects (crises)
  const badFx = ['fuel_crisis','recession','strike','storm','closure','war'];
  const incidents = (STATE.timedEffects || []).filter(e =>
    badFx.some(b => (e.fx||e.type||'').includes(b)) || (e.mag!=null && e.mag < 1)
  ).length;

  const tiles = [
    { icon:'✈', label:'Active Routes',  big:activeRoutes,
      note: activeRoutes ? `${routes.reduce((s,r)=>s+(r.flights||0),0)} flights/wk` : 'none yet', tone:'teal' },
    { icon:'⏱', label:'Losing Money',   big:losing,
      note: losing ? 'Needs attention' : 'All profitable', tone: losing ? 'bad' : 'good' },
    { icon:'🔧', label:'Maintenance',    big:(maintNeeded+grounded),
      note: grounded ? `${grounded} grounded` : (maintNeeded ? 'Service soon' : 'Fleet healthy'),
      tone: (maintNeeded+grounded) ? 'warn' : 'good' },
    { icon:'📉', label:'Under Break-even', big:belowBE,
      note: belowBE ? 'Low load factor' : 'Loads healthy', tone: belowBE ? 'warn' : 'good' },
    { icon:'📦', label:'Cargo Routes',   big:cargo,
      note: cargo ? 'Active' : 'None', tone:'teal' },
    { icon:'⚠', label:'Incidents',      big:incidents,
      note: incidents ? 'Crisis active' : 'All clear', tone: incidents ? 'bad' : 'good' },
  ];
  box.innerHTML = tiles.map(t => `
    <div class="oc-tile oc-${t.tone}">
      <div class="oc-ic">${t.icon}</div>
      <div class="oc-meta">
        <div class="oc-label">${t.label}</div>
        <div class="oc-note">${t.note}</div>
      </div>
      <div class="oc-big">${t.big}</div>
    </div>`).join('');
}

// Left-rail count badges + sub-lines — all real monthly-sim data.
function renderRailBadges() {
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html || ''; };
  const setSub = (id, txt) => { const el = document.getElementById(id); if (el && txt!=null) el.textContent = txt; };
  const badge = (n, tone) => (n>0 ? `<span class="cmd-cnt cmd-cnt-${tone}">${n}</span>` : '');

  const routes = STATE.routes || [];
  // Fleet: total owned aircraft + maintenance flag
  const owned = Object.values(STATE.planes||{}).reduce((s,p)=>s+(p.owned||0),0);
  const fh = STATE.fleetHealth || {};
  let maint = 0, grounded = 0;
  Object.values(fh).forEach(h=>{ if(!h) return;
    if (h.groundedUntil && h.groundedUntil>(STATE._absMonth||0)) grounded++;
    else if (h.health!=null && h.health<40) maint++; });
  const maintTotal = maint + grounded;

  set('rb-fleet', maintTotal>0 ? badge(maintTotal,'bad') : badge(owned,'teal'));
  setSub('rb-fleet-sub', `${owned} aircraft${maintTotal?` · ${maintTotal} need service`:''}`);

  // New Route: recommended = profitable unserved hub pairs is complex; show route count instead (real)
  set('rb-newroute', routes.length>0 ? badge(routes.length,'teal') : '');
  setSub('rb-newroute-sub', routes.length ? `${routes.length} active route${routes.length>1?'s':''}` : 'Build a connection');

  // Route Manager: routes losing money flagged
  const losing = routes.filter(r=>(r.profit||0)<0).length;
  set('rb-routemgr', losing>0 ? badge(losing,'amber') : '');
  setSub('rb-routemgr-sub', losing ? `${losing} losing money` : 'Manage your network');

  // Slot Negotiations: gates available across hubs (real if tracked); else neutral
  setSub('rb-slots-sub', 'Airport access');

  // Build Hub: hub count + level
  const hubs = (STATE.hubs||[]).length;
  set('rb-hub', hubs>0 ? badge(hubs,'teal') : '');
  setSub('rb-hub-sub', hubs ? `${hubs} hub${hubs>1?'s':''}` : 'Expand operations');

  // Crew: staffing %
  const crew = STATE.crew || [];
  if (crew.length) {
    const avgMorale = Math.round(crew.reduce((s,c)=>s+(c.morale||c.satisfaction||80),0)/crew.length);
    setSub('rb-crew-sub', `${crew.length} crew · ${avgMorale}% morale`);
    set('rb-crew', `<span class="cmd-dot ${avgMorale>=70?'ok':avgMorale>=45?'warn':'bad'}"></span>`);
  } else {
    setSub('rb-crew-sub', 'Staffing');
  }
}

function renderTicker() {
  const track = document.getElementById('ticker-track'); if (!track) return;
  const f$ = v => v >= 0 ? `+$${v.toFixed(0)}M` : `-$${Math.abs(v).toFixed(0)}M`;
  const items = [];
  items.push({ l: STATE.coName, v: `$${STATE.companyValue}M`, c: 'tick-gold' });
  items.push({ l: 'CASH', v: `$${STATE.cash.toFixed(0)}M`, c: STATE.cash>=0?'tick-up':'tick-dn' });
  items.push({ l: 'SHARE', v: `$${STATE.shares.price}`, c: 'tick-teal' });
  const tp = STATE.routes.reduce((s,r)=>s+(r.profit||0),0);
  items.push({ l: 'P&L/MO', v: f$(tp), c: tp>=0?'tick-up':'tick-dn' });
  items.push({ l: 'PASS/YR', v: (STATE.totalPaxYear||STATE.paxThisYear).toLocaleString(), c: '' });
  items.push({ l: 'ROUTES', v: `${STATE.routes.length}`, c: 'tick-teal' });
  if (STATE.loan > 0) items.push({ l: 'LOAN', v: `$${STATE.loan.toFixed(0)}M`, c: 'tick-dn' });
  if (STATE.competitors?.length) {
    items.push({ l: '▸', v: 'RIVALS', c: 'tick-gold' });
    [...STATE.competitors].sort((a,b)=>b.pax-a.pax).slice(0,3).forEach(c => {
      items.push({ l: c.name.split(' ')[0].toUpperCase(), v: `${c.pax.toLocaleString()} PASS`, c: '' });
    });
  }
  if (STATE.routes.length) {
    const sorted = [...STATE.routes].sort((a,b)=>(b.profit||0)-(a.profit||0));
    const best = sorted[0], worst = sorted[sorted.length-1];
    items.push({ l: '▸', v: 'ROUTES', c: 'tick-gold' });
    if (best) items.push({ l: `${best.from?.slice(0,3)}→${best.to?.slice(0,3)}`, v: `${f$(best.profit||0)} ${best.load||0}%LF`, c: (best.profit||0)>=0?'tick-up':'tick-dn' });
    if (worst && worst!==best) items.push({ l: `${worst.from?.slice(0,3)}→${worst.to?.slice(0,3)}`, v: `${f$(worst.profit||0)} ${worst.load||0}%LF`, c: (worst.profit||0)>=0?'tick-up':'tick-dn' });
  }
  if (STATE.timedEffects?.length) {
    items.push({ l: '▸', v: 'ACTIVE EVENTS', c: 'tick-gold' });
    STATE.timedEffects.slice(0,3).forEach(e => {
      items.push({ l: e.id.replace(/_/g,' ').toUpperCase().slice(0,16), v: `${e.monthsLeft}mo`, c: 'tick-dn' });
    });
  }
  const html = items.map(it => {
    const isSec = it.l === '\u25b8'; // section-divider marker (▸)
    return `<span class="tick-item${isSec?' tick-sec':''}"><span class="tick-label">${it.l}</span><span class="tick-val ${it.c}">${it.v}</span></span>`;
  }).join('');
  track.innerHTML = html + html; // duplicate for seamless loop
}
function toggleLeftPanel() {
  const main = document.getElementById('main');
  const btn  = document.getElementById('left-collapse-btn');
  main.classList.toggle('left-collapsed');
  const collapsed = main.classList.contains('left-collapsed');
  btn.textContent = collapsed ? '›' : '‹';
  btn.title = collapsed ? 'Expand panel' : 'Collapse panel';
  try{ localStorage.setItem('aePanelLeftCollapsed', collapsed?'1':''); }catch(e){}
}
function _aePanelSetup(){
  // restore collapse state
  try{
    if(localStorage.getItem('aePanelLeftCollapsed')==='1' && !document.getElementById('main').classList.contains('left-collapsed')) toggleLeftPanel();
    if(localStorage.getItem('aePanelRightCollapsed')==='1' && !document.getElementById('main').classList.contains('right-collapsed')) toggleRightPanel();
  }catch(e){}
  // restore widths
  try{
    const w=JSON.parse(localStorage.getItem('aePanelWidths')||'{}');
    if(w.left)  document.documentElement.style.setProperty('--ae-rail-w', w.left+'px');
    if(w.right) document.documentElement.style.setProperty('--ae-feed-w', w.right+'px');
  }catch(e){}
  // drag-resize
  function wire(id, varName, min, max, dir){
    const el=document.getElementById(id); if(!el) return;
    el.addEventListener('mousedown', e=>{
      e.preventDefault(); el.classList.add('dragging');
      const startX=e.clientX;
      const startW=parseFloat(getComputedStyle(document.documentElement).getPropertyValue(varName))||0;
      function mv(ev){
        const w=Math.max(min, Math.min(max, startW + dir*(ev.clientX-startX)));
        document.documentElement.style.setProperty(varName, w+'px');
      }
      function up(){
        el.classList.remove('dragging');
        document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up);
        try{
          const w=JSON.parse(localStorage.getItem('aePanelWidths')||'{}');
          const cur=parseFloat(getComputedStyle(document.documentElement).getPropertyValue(varName))||0;
          if(varName==='--ae-rail-w') w.left=Math.round(cur); else w.right=Math.round(cur);
          localStorage.setItem('aePanelWidths', JSON.stringify(w));
        }catch(e){}
        try{ window.dispatchEvent(new Event('resize')); }catch(e){}
      }
      document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
    });
    el.addEventListener('dblclick', ()=>{ // reset to default
      document.documentElement.style.setProperty(varName, (varName==='--ae-rail-w'?92:336)+'px');
      try{
        const w=JSON.parse(localStorage.getItem('aePanelWidths')||'{}');
        if(varName==='--ae-rail-w') delete w.left; else delete w.right;
        localStorage.setItem('aePanelWidths', JSON.stringify(w));
      }catch(e){}
      try{ window.dispatchEvent(new Event('resize')); }catch(e){}
    });
  }
  wire('left-resizer','--ae-rail-w',70,260,+1);
  wire('right-resizer','--ae-feed-w',240,560,-1);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',_aePanelSetup); else _aePanelSetup();
function toggleRightPanel() {
  const main = document.getElementById('main');
  const btn  = document.getElementById('right-collapse-btn');
  main.classList.toggle('right-collapsed');
  const collapsed = main.classList.contains('right-collapsed');
  btn.textContent = collapsed ? '‹' : '›';
  btn.title = collapsed ? 'Expand panel' : 'Collapse panel';
  try{ localStorage.setItem('aePanelRightCollapsed', collapsed?'1':''); }catch(e){}
}
// Click a collapsed rail label -> expand that panel and reveal only that section
function railOpenLeft(label){
  const main = document.getElementById('main');
  main.classList.remove('left-collapsed');
  const btn = document.getElementById('left-collapse-btn');
  if (btn){ btn.textContent = '‹'; btn.title = 'Collapse panel'; }
  const ALIAS = { 'Goal':'Goal Progress', 'Hubs':'Your Hubs' };
  const want = (ALIAS[label] || label).toLowerCase();
  const scope = document.querySelector('#left-panel .panel-scroll');
  if (!scope) return;
  let target = null;
  scope.querySelectorAll('.acc-group').forEach(g => {
    const h = g.querySelector('.acc-header');
    const b = h ? h.nextElementSibling : null;
    if (!h || !b) return;
    const txt = (h.querySelector('span') ? h.querySelector('span').textContent : '').toLowerCase();
    if (!target && txt.indexOf(want) !== -1){ h.classList.add('open'); b.classList.add('open'); target = g; }
    else { h.classList.remove('open'); b.classList.remove('open'); }
  });
  if (target) setTimeout(() => { try { target.scrollIntoView({behavior:'smooth', block:'start'}); } catch(e){} }, 80);
}
function railOpenRight(tabId){
  const main = document.getElementById('main');
  main.classList.remove('right-collapsed');
  const btn = document.getElementById('right-collapse-btn');
  if (btn){ btn.textContent = '›'; btn.title = 'Collapse panel'; }
  if (typeof switchTab === 'function') switchTab(tabId);
}
let _selectedLogo = window.DEFAULT_AIRLINE_LOGO_ID || 'nova_airlines';
let _selectedLivery = '#a789ff';
let _selectedLivery2 = '#e8843a';
let _selectedLiveryA = '#c0c8d4';
const LIVERY_COLORS = ['#a789ff','#00d8f0','#3b8fd4','#8b6fe0','#e0415c','#e8843a','#ffcf5a','#3fbf7f','#e05c9e','#5ad1c8','#c0c8d4','#f25f8a'];
function pickLivery(c) { _selectedLivery = c; wzRenderPage3(); }
function pickLivery2(c) { _selectedLivery2 = c; wzRenderPage3(); }
function pickLiveryA(c) { _selectedLiveryA = c; wzRenderPage3(); }
const LOGOS = [
  '⚥',
  '♕',
  '🦅',
  '✦',
  '🌅',
  '🌊',
  '⛰',
  '〰',
  '🌐',
  '➤',
  '❖',
  '🌴',
  '⚡',
  '🛡',
  '𓅃',
  '𓅂',
  '✶',
  '▰',
  '◌',
  '🍃',
  '◆',
  '⟡',
  '☾',
  '☽',
  '🧭',
  '⬡',
  '🏙',
  '☁',
  '🔷',
  '♛',
  '✈',
  '◎',
  '⛅',
  '◇'
];
const LOGO_LORE = {  '⚥': { name:'Paisley Glyph', desc:'Royal purple swirl identity for PaisleyAire and PSLYFRK style brands. Distinctive, premium and weird in a good way.', category:'Signature', tone:'#c026d3' },  '♕': { name:'Royal Crown', desc:'Gold crown mark for a premium flag carrier with first-class ambition.', category:'Classic', tone:'#f5c84c' },  '🦅': { name:'Falcon Wing', desc:'Sharp falcon wing for a fast modern international airline.', category:'Modern', tone:'#7dd3fc' },  '✦': { name:'Compass Star', desc:'Navigation star for a balanced network carrier built around route discipline.', category:'Classic', tone:'#c7d2fe' },  '🌅': { name:'Sunrise Tail', desc:'Warm sunrise brand for vacation routes, leisure travelers and optimistic growth.', category:'Leisure', tone:'#fb923c' },  '🌊': { name:'Ocean Wave', desc:'Blue wave mark for island, coastal and transoceanic service.', category:'Regional', tone:'#38bdf8' },  '⛰': { name:'Mountain Peak', desc:'Mountain route identity for western, alpine and high-altitude regional service.', category:'Regional', tone:'#93c5fd' },  '〰': { name:'Jetstream Ribbon', desc:'Flowing air ribbon for a sleek efficient mainline carrier.', category:'Modern', tone:'#22d3ee' },  '🌐': { name:'Globe Meridian', desc:'Globe and meridian feel for international expansion and alliance play.', category:'Global', tone:'#67e8f9' },  '➤': { name:'Arrowline', desc:'Forward chevron mark for efficient low-cost growth and fast turnarounds.', category:'Low Cost', tone:'#84cc16' },  '❖': { name:'Aurora Wing', desc:'Northern-lights premium mark for cold-region long-haul routes.', category:'Premium', tone:'#2dd4bf' },  '🌴': { name:'Palm Air', desc:'Resort airline identity for Caribbean, island and sun destination networks.', category:'Leisure', tone:'#65a30d' },  '⚡': { name:'Thunderbolt Air', desc:'Aggressive speed mark for a disruptive budget carrier.', category:'Bold', tone:'#ef4444' },  '🛡': { name:'Heritage Shield', desc:'Crest badge for a legacy carrier with national-airline gravitas.', category:'Classic', tone:'#f59e0b' },  '𓅃': { name:'Crane Bird', desc:'Elegant bird mark for refined transpacific and premium business routes.', category:'Premium', tone:'#e5e7eb' },  '𓅂': { name:'Desert Falcon', desc:'Sand and gold falcon identity for desert hubs and long-haul prestige.', category:'Regional', tone:'#d97706' },  '✶': { name:'Northern Star', desc:'Icy star mark for Canada, Alaska and northern regional networks.', category:'Regional', tone:'#67e8f9' },  '▰': { name:'Red Tail Classic', desc:'Simple red tail mark for a traditional mainline airline.', category:'Classic', tone:'#ef4444' },  '◌': { name:'Silver Orbit', desc:'Orbit ring brand for a tech-forward futuristic airline.', category:'Modern', tone:'#cbd5e1' },  '🍃': { name:'Green Leaf Air', desc:'Leaf and wing identity for eco-conscious operations and quiet efficiency.', category:'Eco', tone:'#84cc16' },  '◆': { name:'Black Diamond', desc:'Black and gold diamond for a luxury boutique airline.', category:'Premium', tone:'#f59e0b' },  '⟡': { name:'Route Node', desc:'Connected-node logo for a strategy-first route network airline.', category:'Network', tone:'#22d3ee' },  '☾': { name:'Neon Night Air', desc:'Moonlit neon identity for late-night, party and red-eye service.', category:'Distinctive', tone:'#d946ef' },  '☽': { name:'Midnight Sky', desc:'Elegant crescent and stars for quiet premium overnight flights.', category:'Premium', tone:'#a78bfa' },  '🧭': { name:'Copper Compass', desc:'Warm compass badge for exploration, regional discovery and charter growth.', category:'Classic', tone:'#fb923c' },  '⬡': { name:'Atlas Hex', desc:'Structured hex globe mark for logistics-heavy global operations.', category:'Network', tone:'#06b6d4' },  '🏙': { name:'Metro Skyline', desc:'City skyline identity for business shuttles and commuter-heavy routes.', category:'Business', tone:'#60a5fa' },  '☁': { name:'Cloudline', desc:'Soft cloud mark for friendly regional service and comfort-focused branding.', category:'Regional', tone:'#bae6fd' },  '🔷': { name:'Sapphire Kite', desc:'Blue geometric kite for clean premium routes and stylish aircraft tails.', category:'Modern', tone:'#3b82f6' },  '♛': { name:'Meridian Crown', desc:'Luxury crown-compass hybrid for a serious global flagship.', category:'Premium', tone:'#facc15' },  '✈': { name:'Classic Jet', desc:'Straightforward aircraft mark for players who want no-nonsense airline branding.', category:'Classic', tone:'#94a3b8' },  '◎': { name:'Runway Halo', desc:'Circular runway-light logo for airport-first operations and hub building.', category:'Network', tone:'#2dd4bf' },  '⛅': { name:'Sky Harbor', desc:'Sun-through-cloud brand for friendly mid-market mainline service.', category:'Leisure', tone:'#fbbf24' },  '◇': { name:'Crystal Tail', desc:'Sharp crystal tailfin mark for a polished, upscale modern airline.', category:'Premium', tone:'#a78bfa' },};
function goToNameHub() {
  wzStep(3);
}
function renderNameHub() {
  wzRenderPage3();
}
function pickLogo(e) {
  _selectedLogo = e;
  wzRenderPage3();
}
let _aeLaunchTransitionActive = false;
function aeFlyToOperationsCenter(ev) {
  if (_aeLaunchTransitionActive) return;
  _aeLaunchTransitionActive = true;
  const source = ev && ev.currentTarget ? ev.currentTarget : null;
  if (source) {
    source.disabled = true;
    source.classList.add('is-departing');
  }
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(() => {
    try {
      launchFromNameHub();
    } finally {
      if (source) {
        source.disabled = false;
        source.classList.remove('is-departing');
      }
      _aeLaunchTransitionActive = false;
    }
  }, reduceMotion ? 0 : 760);
}
function launchFromNameHub() {
  const nameEl = document.getElementById('nh-name-input');
  setupChoice._name = (nameEl ? nameEl.value : 'SKYLINE') || 'SKYLINE';
  setupChoice._logoId = _selectedLogo;
  setupChoice._logo = '✈';
  setupChoice._color = _selectedLivery;
  setupChoice._color2 = _selectedLivery2;
  setupChoice._colorA = _selectedLiveryA;
  startGame('name-hub');
}
function startGame(from) {
  STATE = defaultState();
  window.__runUnlocks = [];
  STATE._lifetimePax = 0;
  STATE.firstMoves = { rung: 0, done: false }; STATE.gateBonus = {}; STATE._lastMonthProfit = null; STATE._fmGiftPlane = null; STATE.actionCap = { on: false, max: 4, used: 0 };
  const cfg = configureRun();
  STATE.gameType = cfg.type;
  STATE.scenario = cfg.sc;
  STATE.level = cfg.lv;
  STATE.homeBase = cfg.hub;
  STATE.hubs = [cfg.hub];
  STATE.mhc  = { points: 0, totalEarned: 0, redemptions: 0, unlocked: false, members: 0 };
  STATE.objective = cfg.objective;
  STATE.twist = cfg.twist;
  STATE.seed = cfg.seed;
  STATE.coName = ((setupChoice._name) || (document.getElementById('nh-name-input') && document.getElementById('nh-name-input').value) || 'SKYLINE').toUpperCase().slice(0,14);
  STATE.logoId = setupChoice._logoId || window.DEFAULT_AIRLINE_LOGO_ID || 'nova_airlines';
  STATE.logo   = '✈';
  STATE.livery = setupChoice._color || '#a789ff';
  STATE.livery2 = setupChoice._color2 || '#e8843a';
  STATE.liveryAccent = setupChoice._colorA || '#c0c8d4';
  STATE.year = STATE.scenario.year;
  STATE.startYear = STATE.scenario.year;
  STATE.month = 3; // April
  STATE.cash = PLAYER_STARTING_CASH;
  if (window.__cheatBonus){ STATE.cash += window.__cheatBonus; STATE._bonus = window.__cheatBonus; }
  STATE.loan = 0;                                   // start debt-free
  STATE.maxLoan = Math.max(2000, STATE.scenario.loan * 3); // scenario sets available credit line
  STATE.viewRegion = CITIES[STATE.homeBase].region;
  // Starter plane: always give the player a fresh aircraft, never one already deep into
  // its service life. In modern-era games (2010+) restrict to non-vintage types only.
  // In Eras mode (pre-2000) vintage jets are era-appropriate and allowed.
  const _startYr = STATE.year;
  const _allowVintage = _startYr < 2000; // eras campaign and early decades
  const startEra = Object.entries(AIRCRAFT)
    .filter(([,a]) => a.era <= _startYr && !a.retired && (_allowVintage || !a.vintage))
    .sort((a,b) => b[1].era - a[1].era);
  // Prefer a medium type introduced within the last 8 years so the player starts
  // with no age surcharge. Fall back to newest medium, then newest anything.
  const starterEntry =
    startEra.find(([,a]) => a.type==='medium' && (_startYr - a.era) <= 8) ||
    startEra.find(([,a]) => a.type==='medium') ||
    startEra[0] ||
    ['A320', AIRCRAFT['A320']];
  STATE.planes[starterEntry[0]] = { ...starterEntry[1], owned:3, assigned:0 };
  stampAcquisition(STATE.planes[starterEntry[0]], 3);
  const aggMult = STATE.gameType==='domination' ? 1.4 : 1;
  const extraRivals = STATE.gameType==='domination' ? 1 : 0;
  const homeRegion = CITIES[STATE.homeBase].region;
  // One rival ALWAYS sets up in the player's home region as a direct competitor,
  // so the early game has real contention (and the war system has a target).
  const usedRegions = [];
  const rivalCount = Math.min(RIVAL_NAMES.length, STATE.level.rivals + extraRivals);
  const shuffled = [...RIVAL_NAMES].sort(()=>Math.random()-0.5);
  for (let i=0;i<rivalCount;i++){
    const r = shuffled[i % shuffled.length];
    let availMajors;
    if (i === 0) {
      // home rival: a major city in the player's region (not the player's own hub)
      availMajors = Object.entries(CITIES).filter(([n,c])=>c.major && c.region===homeRegion && n!==STATE.homeBase);
      if (!availMajors.length) availMajors = Object.entries(CITIES).filter(([n,c])=>c.region===homeRegion && n!==STATE.homeBase);
    } else {
      availMajors = Object.entries(CITIES).filter(([n,c])=>c.major && !usedRegions.includes(c.region) && c.region!==homeRegion && n!==STATE.homeBase);
      if (!availMajors.length) availMajors = Object.entries(CITIES).filter(([n,c])=>c.major && n!==STATE.homeBase);
    }
    const pick = availMajors[Math.floor(Math.random()*availMajors.length)] || ['London',CITIES['London']];
    usedRegions.push(pick[1].region);
    const hubCity = pick[0];
    const hubRegion = pick[1].region;
    const startingRouteCount = (i === 0) ? 2 : 0;   // home rival starts active (2 routes); others dormant until turn 5
    const regionCities = Object.entries(CITIES)
      .filter(([n,c]) => c.region === hubRegion && n !== hubCity)
      .sort((a,b) => (b[1].econ + b[1].tourism + b[1].pop) - (a[1].econ + a[1].tourism + a[1].pop));
    const startRoutes = regionCities.slice(0, startingRouteCount).map(([dest]) => ({ from: hubCity, to: dest }));
    STATE.competitors.push({
      name: r.name, color: r.color, hub: hubCity,
      cash: STATE.scenario.cash * (0.25 + Math.random()*0.25),
      pax: 0, routes: startRoutes.length, value: startRoutes.length * 20,
      aggression: Math.min(1, (0.35 + Math.random()*0.4) * STATE.level.rivalAgg * aggMult),
      regionsEntered: [hubRegion],
      routeList: startRoutes,
    });
  }
  applyTwist(STATE.twist);
  if (STATE.gameType === 'eras') setTimeout(() => { try { fireEraEvents(); } catch(e) {} }, 400);
  const typeLabel = (GAME_TYPES.find(g=>g.id===STATE.gameType)||{}).name || 'Scenario';
  const fromId = (from==='intro' || document.getElementById('setup').classList.contains('hidden')) ? 'intro' : 'setup';
  enterGame(fromId, ()=>{
    const lb = document.getElementById('logo-badge'); if (lb) { lb.innerHTML = window.airlineLogoImg ? window.airlineLogoImg(STATE.logoId, 'header-airline-logo', STATE.coName + ' logo') : (STATE.logo || '✈'); lb.style.color = STATE.livery || ''; lb.style.textShadow = 'none'; }
    const bc = document.getElementById('brand-co'); if (bc) bc.textContent = `${STATE.coName} · ${STATE.homeBase.toUpperCase()} · ${typeLabel.toUpperCase()}`;
    initGame();
  });
}
function enterGame(fromId, build){
  const from = document.getElementById(fromId);
  const gui = document.getElementById('game-ui');
  if(from && !from.classList.contains('hidden')) from.classList.add('lift-out');
  clearTimeout(window.__enterT1); clearTimeout(window.__enterT2);
  window.__enterT1 = setTimeout(()=>{
    document.getElementById('intro').classList.add('hidden');
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('intro').classList.remove('lift-out');
    document.getElementById('setup').classList.remove('lift-out');
    gui.classList.remove('hidden');
    gui.classList.add('entering');
    const dtl = document.getElementById('dt-launch'); if (dtl) dtl.classList.remove('dt-gone');
    build();
    // Re-center map after browser has laid out the now-visible game-ui
    setTimeout(()=>{ centerOnCity(STATE.homeBase); applyPan(); }, 80);
    window.__enterT2 = setTimeout(()=>gui.classList.remove('entering'), 1000);
    // Skywrite the AIRLINE EMPIRE brand across the header
    setTimeout(brandSkywrite, 600);
    // First launch hint sequence — only shown once
    const seen = (() => { try { return localStorage.getItem('ae_hints_seen')==='1'; } catch(e){ return false; } })();
    if (!seen) showLaunchHints();
  }, 400);
}
function showLaunchHints() {
  return; // Floating STEP 1/2/3 launch hints disabled — the Quick Start Guide handles onboarding.
  const hints = [
    { icon: '✈', step: 'STEP 1', text: 'Buy an aircraft — Fleet tab → Buy Aircraft' },
    { icon: '🗺', step: 'STEP 2', text: 'Click two cities on the map to open a route' },
    { icon: '⏭', step: 'STEP 3', text: 'Hit End Turn to advance time and earn revenue' },
  ];
  let i = 0;
  function showNext() {
    const old = document.getElementById('launch-hint');
    if (old) old.remove();
    if (i >= hints.length) {
      try { localStorage.setItem('ae_hints_seen','1'); } catch(e){}
      return;
    }
    const h = hints[i++];
    const el = document.createElement('div');
    el.id = 'launch-hint';
    el.innerHTML = '<span class="hint-icon">' + h.icon + '</span><span class="hint-step">' + h.step + '</span><span>' + h.text + '</span>';
    document.body.appendChild(el);
    setTimeout(() => { if(el.parentNode) { el.style.opacity='0'; el.style.transition='opacity .4s'; setTimeout(()=>{ if(el.parentNode) el.remove(); showNext(); }, 400); } }, 4500);
  }
  setTimeout(showNext, 1200);
}
function applyTwist(tw){
  if(!tw) return;
  switch(tw.id){
    case 'fuel':   STATE.fuelMod = 1.6; STATE._fuelLock = true; break;
    case 'noloan': STATE.maxLoan = STATE.loan; break;
    case 'solo':   STATE._noHubs = true; break;
    case 'boom':   Object.values(CITIES).forEach(c=>c.tourism=Math.min(95, c.tourism*1.2)); break;
    case 'lean':   STATE.cash = Math.round(STATE.cash*0.5); break;
  }
}
function initGame() {
  renderRegionTabs();
  const _lb = document.getElementById('logo-badge'); if (_lb && STATE.livery) { _lb.innerHTML = window.airlineLogoImg ? window.airlineLogoImg(STATE.logoId, 'header-airline-logo', STATE.coName + ' logo') : (STATE.logo || '✈'); _lb.style.color = STATE.livery; _lb.style.textShadow = 'none'; }
  // Set a reasonable default zoom before rendering so the map is visible on launch
  if (!STATE.mapZoom || STATE.mapZoom < 0.5) STATE.mapZoom = 1.75;
  STATE.viewRegion = STATE.viewRegion || 'NA';
  centerOnCity(STATE.homeBase); // set correct mapTX/TY before renderMap paints
  renderMap(); // builds SVG and calls applyPan (may be 0-dim but sets transform correctly)
  // enterGame fires applyPan again at 80ms after layout is complete
  updateUI();
  renderRankings(); renderFleet(); renderRivals(); renderHubsList(); renderRoutesList(); renderGoalProgress();
  addEvent('neutral', `${STATE.coName} founded. Home hub: ${STATE.homeBase}.`);
  initCrewPool();
  updateCrewBtn();
  if (STATE.gameType==='mystery' && STATE.yearsElapsed<1) {
    addEvent('warn', `Mystery objective [CLASSIFIED]: "${STATE.objective.hint||'…'}"`);
  } else {
    addEvent('neutral', `Objective: ${objectiveStatus().label}.`);
  }
  if (STATE.twist) addEvent('warn', `Daily twist — ${STATE.twist.name}: ${STATE.twist.desc}`);
  if (STATE._bonus) addEvent('good', `Secret clearance granted: +$${STATE._bonus}M starting capital. ✈`);
  updatePauseUI();
  startTimer();
  autoSave();
  if (!STATE._absMonth || STATE._absMonth === 0) {
    if (STATE.gameType === 'daily') {
      setTimeout(showDailyBriefing, 700);  // daily skips the QSG — straight to the conditions
    } else {
      const tourDone = (() => { try { return localStorage.getItem('ae_tour_done')==='1'; } catch(e){ return true; } })();
      if (!tourDone) {
        maybeLaunchTour(); // tour shows first; guide will show after player dismisses tour
      } else {
        setTimeout(showFirstTurnGuide, 600); // returning player — skip tour, show guide
      }
    }
  }
}
const MAP_W = 2020, MAP_H = 1010;     // equirectangular world size
const MAP_IMG_X = 0;    // horizontal calibration: compromise -3px (West Coast ~1-4px residual, East Coast ~3px max)
const MAP_IMG_Y = 0, MAP_IMG_H = 1010;
const VIEW_W = 1100, VIEW_H = 620;    // visible viewBox window
const LAND_PATH = "M2020.0,595.7L2017.6,599.0L2019.6,597.7L2019.0,598.9L2014.7,599.3L2012.5,599.9L2011.7,598.9L2020.0,595.7ZM1813.4,572.1L1813.5,574.4L1814.6,576.5L1817.0,585.8L1821.3,585.5L1825.2,589.3L1826.4,597.8L1828.7,600.8L1829.6,605.9L1830.5,608.9L1831.9,612.1L1836.4,613.9L1837.5,614.0L1839.6,616.1L1845.1,619.3L1845.0,620.0L1844.9,621.4L1848.6,627.1L1850.4,630.8L1851.7,631.4L1851.6,629.5L1852.5,629.9L1854.9,631.6L1855.2,630.5L1856.0,631.7L1856.9,637.0L1862.3,640.8L1864.5,643.6L1865.7,644.7L1869.0,652.6L1869.6,658.8L1871.9,666.9L1870.4,670.5L1867.3,683.4L1864.7,687.7L1861.0,690.7L1859.1,694.1L1856.3,700.0L1856.0,701.5L1852.6,706.8L1850.6,715.7L1847.7,717.1L1838.4,718.5L1831.7,722.2L1830.4,722.6L1831.9,723.7L1831.1,724.5L1829.6,722.9L1828.5,722.6L1826.0,720.9L1825.7,719.5L1822.8,720.7L1822.4,720.2L1823.9,718.3L1821.0,718.7L1820.9,719.2L1821.1,719.8L1814.3,722.5L1808.7,720.3L1802.4,719.2L1796.7,716.2L1794.1,713.4L1793.0,707.5L1790.3,704.7L1791.6,704.1L1791.0,703.3L1786.5,705.0L1785.7,704.1L1786.8,699.5L1784.6,697.2L1781.9,702.2L1778.8,700.9L1781.3,700.1L1782.4,695.0L1783.9,692.8L1783.9,691.1L1783.8,688.9L1783.1,688.5L1779.5,694.1L1773.8,698.2L1772.6,699.8L1772.7,701.2L1770.2,700.0L1768.2,698.8L1769.6,697.9L1765.9,691.6L1762.5,688.8L1761.5,686.9L1754.3,684.3L1749.1,682.9L1745.2,681.9L1731.3,683.9L1723.1,686.2L1714.6,687.4L1706.5,690.9L1702.2,695.2L1694.9,695.1L1687.9,695.1L1681.8,696.0L1679.1,698.3L1675.0,699.9L1670.3,701.8L1662.1,700.6L1656.8,697.5L1655.3,696.6L1655.8,693.4L1658.2,693.1L1659.0,690.2L1657.8,680.6L1655.2,674.5L1653.2,667.0L1650.4,662.0L1648.0,655.6L1645.2,651.9L1646.0,652.1L1646.5,652.0L1648.2,654.2L1648.8,652.8L1646.9,650.3L1647.1,648.8L1648.4,651.8L1649.0,651.0L1650.2,653.1L1650.8,651.6L1649.6,648.3L1646.4,641.1L1648.4,635.6L1648.5,630.3L1650.4,627.5L1650.8,631.0L1654.5,627.0L1665.6,620.9L1670.3,620.8L1679.7,617.3L1685.8,616.3L1690.0,614.3L1694.6,608.2L1696.6,606.2L1695.4,602.8L1696.4,600.7L1700.6,598.8L1703.4,603.0L1703.6,600.4L1704.8,600.4L1705.0,599.6L1703.1,597.4L1703.8,595.8L1705.3,596.8L1706.5,596.3L1710.0,596.9L1708.0,595.9L1709.4,593.7L1708.3,593.9L1708.6,591.8L1710.0,590.8L1711.8,591.3L1710.9,589.8L1711.8,589.3L1713.5,589.7L1712.9,587.2L1714.7,585.6L1715.3,585.2L1715.3,586.5L1716.1,586.6L1716.7,586.5L1717.1,585.6L1717.7,583.3L1718.7,584.3L1719.7,584.0L1720.8,584.1L1722.6,582.3L1725.6,584.1L1729.1,588.2L1728.8,590.9L1729.7,590.5L1729.4,589.1L1731.8,587.9L1734.8,589.1L1735.2,589.6L1736.0,588.6L1737.5,589.7L1738.1,588.3L1738.4,588.0L1737.8,586.8L1737.2,586.7L1736.4,584.8L1739.1,580.8L1740.2,578.8L1742.0,576.0L1742.9,575.1L1743.2,574.6L1744.5,575.3L1744.8,574.3L1746.8,572.9L1749.1,573.9L1752.8,573.7L1753.1,573.3L1754.2,572.5L1753.3,569.5L1750.4,568.7L1750.8,567.8L1751.8,568.4L1753.8,568.8L1754.9,569.4L1756.4,569.3L1758.3,570.8L1764.9,572.7L1766.5,572.6L1768.7,573.6L1772.2,571.8L1771.7,573.7L1773.2,573.4L1774.2,574.8L1774.7,573.4L1775.6,572.1L1776.5,573.1L1776.1,576.7L1775.4,579.3L1774.4,578.9L1772.7,581.4L1772.0,584.9L1769.9,588.4L1770.5,589.2L1775.7,592.8L1777.0,593.4L1778.3,594.2L1783.8,597.5L1787.2,599.2L1790.6,600.5L1792.4,602.5L1796.7,604.3L1799.2,603.4L1800.7,601.5L1803.4,594.2L1804.6,588.3L1804.2,581.1L1805.3,577.0L1806.2,576.2L1805.7,572.8L1806.6,572.2L1808.6,566.1L1809.8,565.1L1810.0,565.7L1811.3,567.9L1812.0,571.7L1813.4,572.1ZM2010.3,602.5L2012.1,604.3L2012.1,606.6L2007.9,607.4L2004.6,605.8L2007.8,602.6L2010.3,602.5ZM1931.4,618.6L1937.2,621.8L1940.2,624.6L1947.1,629.9L1946.5,630.4L1943.9,629.7L1935.0,624.0L1931.1,619.6L1930.6,618.0L1931.4,618.6ZM1726.7,500.2L1727.8,500.1L1730.6,496.5L1732.2,496.4L1732.0,499.0L1730.5,501.4L1731.3,503.1L1727.8,502.5L1727.7,503.8L1728.7,507.7L1729.8,509.9L1726.4,505.9L1725.5,499.8L1725.0,498.0L1726.7,494.0L1728.5,492.9L1727.9,495.0L1728.2,497.8L1726.2,499.5L1726.7,500.2ZM1398.2,780.6L1400.5,780.3L1400.2,781.4L1400.9,781.4L1405.1,780.3L1405.8,781.4L1404.7,782.4L1401.4,782.5L1404.5,783.2L1403.2,783.9L1397.6,783.6L1396.1,783.9L1396.6,778.7L1397.7,778.4L1397.5,780.4L1398.2,780.6ZM1365.6,52.2L1361.2,51.3L1370.0,50.3L1372.3,49.4L1376.5,50.0L1374.7,51.5L1365.6,52.2ZM1335.2,55.4L1331.4,55.0L1332.8,53.4L1337.7,54.3L1335.2,55.4ZM867.3,107.1L865.2,108.9L862.6,109.7L852.7,109.3L856.3,107.3L865.6,106.4L867.3,107.1ZM1906.4,557.0L1908.1,557.8L1910.7,558.5L1912.3,560.4L1906.4,559.6L1905.7,557.2L1906.4,557.0ZM1668.2,457.6L1668.8,455.8L1679.3,445.7L1679.6,443.1L1680.9,441.8L1681.1,446.6L1676.3,449.7L1674.1,453.4L1668.2,457.6ZM1697.3,439.8L1699.8,440.3L1700.7,440.2L1701.0,440.8L1700.6,442.2L1698.3,444.4L1694.2,446.2L1695.1,439.5L1694.4,438.2L1697.3,439.8ZM1700.9,454.1L1696.9,450.6L1696.9,449.5L1699.4,448.2L1699.4,445.8L1700.3,443.8L1703.0,443.7L1703.1,445.2L1701.1,450.5L1701.8,453.3L1700.9,454.1ZM1709.0,441.4L1711.4,441.8L1711.6,442.5L1711.6,444.7L1712.8,447.4L1712.0,447.7L1711.4,447.8L1711.0,448.4L1710.2,447.3L1709.5,443.5L1708.1,442.4L1707.9,440.4L1709.0,441.4ZM1712.7,434.7L1714.2,436.9L1714.2,440.2L1715.2,442.6L1712.3,441.8L1711.3,439.7L1711.0,439.0L1707.4,434.5L1712.7,434.7ZM1687.3,429.4L1690.5,430.0L1692.0,431.6L1691.9,434.4L1689.8,436.3L1687.0,431.1L1685.3,429.4L1687.3,429.4ZM1885.1,542.5L1883.2,543.5L1881.2,542.2L1880.0,540.0L1878.2,537.6L1878.4,535.6L1880.8,537.4L1885.1,542.5ZM1868.3,531.7L1867.6,531.7L1866.7,530.2L1866.2,527.4L1864.0,524.7L1856.3,520.2L1857.3,520.1L1863.3,523.4L1869.2,528.9L1868.3,531.7ZM1787.3,551.4L1784.2,552.0L1782.6,551.4L1785.4,547.1L1788.8,546.6L1789.3,549.2L1787.3,551.4ZM1738.1,521.1L1743.0,523.1L1742.7,526.0L1737.3,523.6L1735.7,524.1L1733.1,523.2L1730.8,524.3L1728.7,522.9L1727.8,524.1L1728.9,521.5L1731.4,520.9L1738.1,521.1ZM1721.8,522.3L1723.9,525.4L1721.9,526.2L1719.3,525.8L1717.2,523.8L1718.2,522.7L1721.8,522.3ZM1698.9,553.3L1688.8,555.1L1682.7,554.4L1682.3,553.4L1682.9,552.4L1687.3,551.6L1691.7,553.2L1694.7,552.5L1697.0,553.3L1698.8,550.9L1699.7,550.5L1699.9,551.9L1698.9,553.3ZM1683.4,557.6L1686.9,560.0L1687.3,562.3L1684.1,562.2L1680.4,559.8L1677.8,559.0L1677.9,558.0L1679.4,557.6L1683.4,557.6ZM1673.5,551.7L1675.9,551.7L1676.3,551.7L1677.7,551.8L1677.8,554.1L1674.3,554.5L1673.4,554.4L1666.3,555.9L1665.2,555.3L1665.9,552.7L1667.8,552.0L1670.0,552.5L1672.7,553.5L1673.1,552.8L1670.8,551.5L1671.4,550.5L1673.0,550.7L1673.5,551.7ZM1664.5,553.3L1663.0,555.1L1660.2,554.1L1661.3,553.3L1662.1,551.5L1664.5,551.5L1664.5,553.3ZM1657.8,550.8L1659.0,552.4L1655.8,554.5L1655.0,552.7L1652.3,550.6L1657.8,550.8ZM1605.0,514.4L1609.0,519.7L1608.2,522.2L1604.4,520.4L1603.1,517.0L1599.9,516.1L1602.8,514.0L1603.4,514.3L1603.7,513.5L1604.7,513.6L1605.0,514.4ZM1136.9,176.1L1139.8,177.1L1135.0,178.7L1133.3,179.8L1134.0,178.6L1132.6,177.9L1133.0,176.7L1136.9,176.1ZM1131.2,64.0L1134.6,65.0L1136.0,66.1L1141.1,66.7L1140.9,67.6L1145.4,69.3L1136.6,71.4L1137.3,70.1L1136.9,69.9L1127.1,69.8L1129.0,67.3L1124.3,64.4L1131.2,64.0ZM1358.8,51.4L1356.6,52.7L1350.7,53.7L1343.0,53.3L1342.8,52.6L1347.2,51.3L1358.8,51.4ZM1276.2,51.3L1282.4,51.7L1282.8,52.6L1277.1,51.9L1268.4,53.4L1263.2,52.5L1276.2,51.3ZM1292.1,50.9L1297.0,52.7L1283.1,54.4L1284.3,55.2L1277.3,55.5L1277.3,54.7L1272.9,54.8L1276.0,53.6L1286.0,53.0L1287.8,51.3L1292.1,50.9ZM1292.0,116.8L1291.5,117.6L1290.1,117.5L1286.0,119.1L1283.1,119.3L1280.9,117.3L1282.9,115.4L1286.2,115.0L1292.0,116.8ZM1349.2,112.6L1348.5,113.8L1344.6,113.8L1343.2,112.8L1339.3,111.9L1338.4,110.4L1341.6,109.8L1349.2,112.6ZM1406.6,94.9L1402.4,94.7L1403.6,92.9L1408.1,92.5L1411.9,94.4L1406.6,94.9ZM1530.1,57.9L1521.9,55.9L1535.2,57.1L1530.1,57.9ZM1646.2,87.5L1639.5,89.0L1636.0,87.7L1638.2,87.6L1643.8,87.1L1646.2,87.5ZM1801.2,89.8L1796.6,89.8L1796.6,88.4L1801.6,88.6L1801.2,89.8ZM1143.8,305.6L1145.8,305.6L1147.2,306.6L1154.5,306.8L1155.0,307.9L1157.6,307.1L1156.2,308.5L1148.8,308.9L1144.6,307.4L1142.2,307.0L1142.5,305.4L1143.4,305.1L1143.8,305.6ZM1141.4,286.4L1145.5,288.5L1146.7,290.9L1148.0,291.1L1147.7,291.9L1145.7,290.9L1144.0,289.5L1139.9,287.0L1138.3,286.9L1141.4,286.4ZM1203.4,305.3L1200.3,307.5L1200.4,308.8L1194.8,311.0L1191.9,309.9L1191.2,308.1L1194.8,307.1L1195.9,306.6L1203.4,305.3ZM1117.0,180.5L1115.4,182.5L1115.7,183.0L1112.2,185.1L1112.1,181.7L1115.1,180.3L1117.0,180.5ZM1080.5,192.0L1078.9,194.1L1079.1,195.1L1077.7,196.0L1075.9,196.9L1074.4,195.2L1072.7,194.5L1072.0,192.2L1075.6,191.3L1076.5,192.1L1077.6,190.5L1079.7,190.2L1080.4,191.0L1080.5,192.0ZM1069.7,193.0L1070.5,194.9L1068.6,196.1L1065.9,195.2L1065.3,193.5L1069.7,193.0ZM1027.6,281.7L1029.2,282.6L1026.3,284.1L1023.3,282.7L1027.9,280.8L1027.6,281.7ZM333.5,918.9L331.1,921.1L330.7,922.1L320.6,922.1L320.4,921.5L321.0,921.3L321.5,920.2L320.1,919.5L318.2,919.1L320.3,918.4L333.5,918.9ZM301.1,916.2L307.1,918.5L304.1,919.1L313.5,919.3L314.6,920.3L315.3,920.9L314.6,921.7L306.2,920.6L300.4,919.2L299.0,918.3L296.1,918.6L295.2,916.8L296.7,916.3L301.1,916.2ZM638.7,954.3L630.2,951.2L642.3,953.0L640.2,954.1L638.7,954.3ZM685.4,864.4L687.3,864.2L688.3,865.4L688.0,866.2L682.8,865.9L683.8,865.3L683.2,864.7L682.2,864.5L683.7,863.4L685.8,863.4L685.4,864.4ZM655.5,866.7L655.8,867.3L656.4,867.5L652.2,868.6L649.6,867.7L654.6,865.6L655.5,866.7ZM596.4,901.3L593.6,903.0L582.6,904.1L580.7,903.1L588.5,902.0L589.7,901.1L591.8,902.1L593.5,901.2L596.4,901.3ZM589.2,896.3L592.2,897.6L590.0,898.8L584.6,897.7L589.2,896.3ZM459.6,908.5L460.5,909.7L463.1,909.0L462.8,909.8L464.4,909.7L469.2,908.1L469.7,909.3L466.3,910.4L473.5,910.0L472.3,911.5L471.3,911.9L467.4,912.1L456.5,911.7L436.0,909.2L448.4,908.1L450.4,909.2L457.9,907.8L459.6,908.5ZM592.8,915.2L591.3,916.4L592.2,917.8L584.1,916.5L583.2,915.2L587.8,914.7L592.1,914.0L592.8,915.2ZM628.5,883.6L623.4,885.1L622.1,883.5L626.6,879.8L630.1,878.9L628.7,881.2L629.3,882.2L627.6,883.1L628.5,883.6ZM6.3,103.4L13.9,105.7L2.8,107.0L0.0,106.1L0.9,103.5L6.3,103.4ZM679.8,792.7L682.4,793.3L681.9,794.0L683.2,794.4L683.4,793.4L685.6,794.1L685.3,794.6L684.5,795.3L680.9,796.7L678.2,796.8L678.0,797.9L675.3,797.5L677.2,795.5L678.6,794.8L679.6,793.2L679.8,792.7ZM801.8,808.4L806.4,809.6L808.7,812.4L806.6,812.4L802.4,809.9L797.1,808.0L801.8,808.4ZM596.0,748.2L592.7,747.3L596.3,740.0L597.5,740.6L597.9,742.2L597.3,743.4L596.1,744.2L597.7,746.2L596.2,747.9L596.0,748.2ZM671.7,793.8L677.3,793.9L673.4,796.7L669.5,797.8L669.1,796.5L672.0,795.3L670.4,795.1L671.6,794.4L670.4,793.2L671.7,793.8ZM592.1,780.8L590.8,785.7L590.0,783.5L590.6,782.3L589.3,783.1L588.2,784.7L586.0,783.9L587.5,782.7L587.3,781.5L588.6,781.0L589.0,780.1L590.3,778.3L591.8,778.9L592.1,780.8ZM600.5,756.3L598.0,756.0L599.2,753.8L601.7,755.0L600.5,756.3ZM663.2,229.5L653.3,227.8L648.8,224.9L658.6,226.6L663.6,228.9L663.2,229.5ZM667.1,247.2L668.5,247.2L668.1,248.3L669.4,248.2L669.4,247.3L670.1,246.5L672.0,245.4L674.2,246.1L674.2,247.2L669.0,249.2L665.9,249.1L664.9,247.2L669.1,242.0L671.0,241.3L671.2,243.4L670.3,245.7L667.1,247.2ZM47.9,147.9L54.4,147.7L59.3,149.5L63.1,150.3L59.1,150.8L57.7,151.6L50.8,149.0L46.4,149.3L46.9,147.4L47.9,147.9ZM77.8,166.2L80.3,166.8L79.9,168.9L77.5,169.6L71.0,167.1L77.8,166.2ZM92.7,196.5L93.4,197.9L85.6,199.7L84.7,198.8L87.4,196.9L92.7,196.5ZM576.5,401.4L582.2,404.2L581.9,404.7L578.5,404.5L576.4,405.2L573.2,404.1L570.4,402.4L571.1,401.5L576.5,401.4ZM638.9,401.5L641.8,402.6L638.9,404.3L633.1,403.1L632.9,401.8L633.7,401.1L638.9,401.5ZM152.1,180.5L154.8,180.6L154.8,181.5L155.2,182.5L151.5,182.5L153.1,183.3L147.9,185.0L145.7,186.4L147.0,185.2L143.8,184.6L144.7,185.4L143.1,185.0L141.9,183.1L145.7,181.6L147.3,183.1L147.0,181.5L147.0,181.2L147.0,180.3L149.0,181.0L150.4,180.6L151.8,179.9L152.1,180.5ZM154.8,177.5L157.2,178.2L156.2,178.6L151.6,179.6L150.9,178.2L152.8,177.6L153.7,177.1L154.8,177.5ZM275.1,193.6L273.5,195.2L272.3,194.3L270.2,194.4L273.6,191.1L275.1,192.6L275.1,193.6ZM260.5,188.9L262.9,189.2L265.1,190.8L268.2,193.7L266.4,193.1L266.0,193.8L269.3,196.2L269.0,198.0L263.1,194.4L263.3,193.6L263.2,193.0L260.0,191.9L262.3,191.0L259.5,190.8L260.7,189.8L260.5,188.9ZM261.7,185.1L264.0,185.8L263.9,187.1L261.9,186.2L262.7,188.1L260.3,188.2L259.5,185.9L258.3,184.9L261.7,185.1ZM252.7,183.2L254.7,187.4L253.9,189.4L252.6,187.6L253.2,187.0L250.6,186.0L251.3,184.9L249.7,183.8L248.1,184.8L248.1,183.4L250.6,182.2L252.7,183.2ZM254.3,178.6L257.7,179.6L259.1,181.7L256.4,179.8L258.6,182.4L258.5,183.3L255.2,184.9L254.9,183.9L254.8,182.0L252.9,177.6L254.3,178.6ZM248.4,178.2L249.3,179.5L251.6,179.0L252.9,179.8L251.9,180.7L251.1,181.1L253.1,181.5L252.0,182.3L249.1,181.5L246.9,182.2L243.9,179.3L245.5,178.7L248.4,178.2ZM288.7,207.9L288.5,210.7L287.7,211.2L287.5,209.0L286.0,209.0L285.5,207.1L287.0,206.3L288.7,207.9ZM265.7,201.3L268.5,202.7L266.7,203.9L268.4,203.6L269.7,201.8L271.1,201.9L267.4,206.5L265.4,205.5L265.6,205.0L263.2,202.4L263.8,201.1L265.7,201.3ZM270.7,206.5L270.5,208.3L269.9,208.4L271.7,209.7L273.5,211.0L273.5,211.6L274.3,212.0L272.6,211.9L268.0,208.4L266.7,207.2L266.4,206.8L270.7,206.5ZM651.9,244.3L661.1,244.9L659.0,246.0L657.9,247.1L657.1,246.2L656.2,245.4L656.2,245.2L654.9,246.0L652.4,245.3L648.6,243.0L650.9,241.4L651.4,243.3L651.9,244.3ZM603.1,275.0L604.1,275.5L599.1,276.9L594.8,276.7L597.7,275.4L603.6,274.7L603.1,275.0ZM1862.4,529.1L1864.0,529.0L1864.9,530.2L1864.3,532.8L1862.9,533.9L1862.7,536.0L1860.0,536.4L1857.8,538.6L1854.1,540.2L1849.4,540.1L1842.4,536.1L1851.5,535.6L1852.4,533.2L1853.3,536.1L1856.1,535.7L1859.4,532.7L1861.1,531.7L1861.2,528.6L1862.4,529.1ZM1724.3,552.3L1719.1,555.3L1712.6,557.8L1707.6,562.1L1704.4,563.1L1703.6,562.3L1705.1,558.0L1711.5,554.7L1713.2,553.2L1722.9,551.8L1724.3,552.3ZM1823.9,733.9L1832.4,735.9L1840.6,733.8L1842.1,734.8L1842.3,742.1L1841.4,740.7L1840.5,742.6L1840.1,747.3L1838.5,746.4L1838.7,745.6L1837.1,745.7L1836.5,745.4L1835.8,747.7L1834.7,747.3L1835.0,748.1L1833.9,749.8L1829.3,748.8L1830.2,748.0L1828.1,747.6L1825.1,743.7L1825.7,742.6L1826.6,742.8L1825.6,741.9L1822.3,737.0L1822.6,733.5L1823.9,733.9ZM1551.6,50.1L1559.1,52.2L1554.4,53.1L1556.0,54.6L1547.9,55.1L1531.8,55.5L1524.5,53.8L1531.7,52.2L1530.6,51.8L1530.2,51.2L1534.6,50.3L1548.1,49.0L1551.6,50.1ZM1558.1,55.2L1559.4,56.1L1558.3,57.3L1564.7,55.9L1570.6,57.6L1568.5,60.2L1567.3,60.4L1568.5,62.5L1564.5,62.7L1541.9,61.2L1536.1,59.2L1534.1,58.2L1544.6,55.9L1558.1,55.2ZM1587.3,60.3L1585.6,62.4L1588.4,61.4L1593.1,61.0L1597.1,62.6L1600.3,63.0L1598.2,65.4L1576.9,66.5L1568.3,67.5L1568.0,66.9L1571.4,65.2L1574.0,62.9L1576.1,62.8L1577.6,60.8L1580.3,59.7L1583.3,60.0L1586.8,59.5L1588.2,60.1L1587.3,60.3ZM1795.8,79.5L1800.5,80.5L1801.3,78.6L1805.3,77.9L1823.7,81.4L1822.6,82.3L1820.3,83.6L1815.9,83.7L1810.7,81.6L1809.9,80.1L1807.6,81.6L1810.3,85.1L1805.4,84.3L1795.6,84.8L1793.3,84.5L1789.8,86.0L1784.3,85.1L1778.5,82.6L1779.9,81.1L1780.7,79.8L1782.1,79.5L1781.9,78.8L1783.1,78.5L1789.5,77.5L1795.8,79.5ZM1807.8,90.4L1814.7,92.5L1813.5,94.2L1795.1,92.9L1798.9,92.2L1802.2,90.5L1807.8,90.4ZM1833.7,82.1L1843.3,82.0L1845.5,82.9L1855.3,84.5L1846.3,85.4L1841.0,85.1L1830.3,82.5L1833.4,81.3L1833.7,82.1ZM1982.2,701.0L1983.2,701.0L1987.0,702.4L1987.5,703.1L1988.4,703.2L1989.3,705.8L1989.0,706.3L1990.7,709.2L1990.8,711.8L1995.1,713.5L1994.7,709.9L1996.3,711.5L1998.6,716.4L2005.1,718.2L2010.3,715.8L2011.7,716.9L2009.8,721.8L2008.4,723.0L2008.1,725.1L2005.5,724.3L2003.3,725.3L2003.0,727.2L2003.0,728.9L2001.9,730.7L1996.7,736.9L1993.2,738.3L1992.2,737.3L1991.2,737.3L1991.0,736.4L1990.0,736.5L1993.1,732.3L1992.0,729.2L1985.0,725.3L1989.8,721.6L1991.1,716.5L1989.8,713.0L1990.5,713.5L1990.7,712.3L1988.8,712.0L1987.7,709.7L1988.9,709.9L1988.0,708.0L1986.2,707.1L1985.8,706.7L1986.6,709.0L1983.4,704.0L1984.0,703.1L1982.5,703.9L1981.8,702.1L1980.0,698.2L1980.5,698.8L1982.2,701.0ZM1981.4,736.6L1986.3,734.6L1985.8,736.4L1986.8,735.1L1987.9,735.4L1987.1,736.4L1988.4,736.1L1986.7,737.7L1987.3,738.7L1987.7,739.6L1981.6,746.4L1978.6,748.0L1979.0,748.5L1979.0,748.8L1981.4,750.8L1980.9,751.2L1977.8,751.0L1978.1,750.4L1977.5,750.5L1976.3,750.9L1975.4,750.4L1975.6,751.6L1971.1,753.5L1969.6,757.1L1969.4,758.3L1967.8,761.5L1967.9,762.4L1965.4,763.6L1960.2,766.6L1958.1,766.6L1954.7,766.4L1953.1,765.1L1949.8,764.0L1945.5,764.2L1946.3,763.0L1944.1,762.6L1946.0,761.4L1946.3,760.6L1945.6,760.1L1946.4,759.6L1946.5,759.2L1947.7,759.5L1948.2,759.1L1947.8,757.8L1948.2,757.8L1949.7,757.0L1951.9,755.4L1952.1,755.4L1952.8,753.9L1955.2,752.1L1959.0,750.9L1962.9,749.1L1966.0,747.0L1966.5,746.5L1968.0,746.1L1969.6,745.0L1969.8,745.2L1971.2,743.1L1972.5,739.3L1975.2,737.6L1976.6,733.7L1978.7,732.4L1979.2,732.5L1981.4,736.6ZM1717.0,452.7L1718.1,453.8L1718.8,455.4L1718.0,457.0L1719.1,458.3L1719.6,459.3L1720.1,464.7L1718.3,467.2L1717.8,469.1L1715.7,463.9L1715.1,464.5L1713.8,467.9L1714.8,472.1L1713.0,473.4L1712.5,471.0L1709.3,471.3L1706.1,468.3L1706.0,465.1L1706.8,463.3L1703.6,461.1L1701.7,463.1L1700.4,462.3L1699.1,462.6L1697.3,461.9L1695.1,466.2L1694.0,465.3L1696.4,460.0L1700.1,458.9L1700.5,457.7L1703.0,456.3L1705.0,458.0L1705.4,459.4L1707.0,458.6L1708.3,456.7L1710.1,456.2L1711.1,454.7L1712.4,454.9L1714.4,453.7L1714.3,450.2L1717.0,452.7ZM1689.5,400.5L1694.3,402.4L1696.2,401.7L1695.5,406.4L1697.4,409.3L1694.4,414.3L1692.1,416.2L1691.2,419.3L1692.5,422.6L1693.4,425.8L1695.8,426.6L1695.9,425.5L1698.8,424.8L1700.6,426.7L1701.5,427.9L1702.3,426.3L1705.0,427.6L1703.6,429.1L1705.1,431.4L1706.5,433.2L1705.6,434.3L1705.3,432.4L1701.8,431.5L1699.6,428.7L1697.6,426.9L1697.4,430.6L1696.7,429.1L1693.1,426.7L1690.1,428.5L1687.4,427.0L1686.8,426.5L1688.3,422.4L1686.4,422.1L1685.8,423.9L1683.6,421.0L1682.2,413.5L1684.9,414.9L1685.5,414.3L1686.2,403.1L1687.3,400.9L1689.5,400.5ZM1758.9,509.1L1762.4,510.0L1763.2,513.3L1762.6,515.3L1763.9,519.7L1764.6,520.2L1765.5,519.5L1766.2,521.5L1768.9,523.9L1770.6,523.3L1772.7,521.3L1776.5,517.5L1779.7,516.4L1779.7,515.1L1784.4,513.7L1794.8,518.2L1799.3,518.9L1801.8,519.7L1816.3,525.1L1818.7,526.4L1820.9,526.6L1828.0,532.4L1828.4,535.7L1837.7,538.8L1839.5,540.8L1838.8,542.7L1834.6,543.3L1835.4,545.2L1836.9,547.3L1841.3,550.8L1844.3,556.0L1847.4,555.9L1848.4,558.7L1851.6,559.6L1850.3,560.4L1851.2,561.3L1855.5,562.9L1854.4,563.5L1854.4,564.7L1852.5,564.6L1849.7,563.0L1838.6,561.2L1834.4,556.9L1834.3,556.0L1832.2,554.1L1828.2,549.8L1820.5,547.6L1817.9,548.2L1816.6,547.4L1817.4,549.6L1815.4,550.1L1814.9,551.2L1809.3,551.7L1808.6,551.0L1810.0,551.8L1813.6,553.1L1814.6,555.0L1809.8,557.2L1806.7,556.6L1800.7,556.0L1795.5,550.8L1795.7,550.0L1791.7,550.8L1791.0,550.4L1789.3,551.2L1790.2,547.2L1788.8,545.5L1790.6,545.4L1787.7,543.8L1788.9,543.1L1786.4,539.3L1785.9,537.8L1785.7,537.1L1785.7,536.9L1784.7,536.8L1784.2,535.5L1780.1,532.9L1771.5,530.1L1766.1,528.5L1766.2,527.0L1761.5,526.2L1760.1,523.6L1760.6,522.1L1757.7,527.8L1755.8,527.8L1753.8,522.6L1750.5,520.6L1752.5,520.1L1755.7,519.9L1757.8,518.8L1760.3,519.3L1761.3,517.9L1761.0,517.5L1760.3,517.3L1751.8,517.2L1749.7,513.7L1745.1,512.8L1746.7,509.7L1754.2,507.0L1758.9,509.1ZM1710.8,499.4L1707.9,502.5L1703.8,503.3L1699.7,502.3L1685.9,502.1L1684.0,504.1L1683.9,508.6L1687.4,512.7L1690.1,511.8L1692.5,509.7L1695.1,509.9L1699.5,509.1L1701.7,508.3L1702.4,510.4L1699.3,510.2L1695.4,513.9L1692.2,515.7L1690.9,515.9L1696.3,521.6L1696.3,523.4L1696.2,525.5L1698.8,528.0L1699.5,528.1L1699.1,529.6L1694.9,530.9L1694.1,532.2L1691.8,531.3L1692.0,527.5L1688.3,524.4L1688.9,520.0L1686.4,520.3L1685.0,522.7L1685.8,526.0L1685.5,535.3L1685.1,536.1L1680.3,536.0L1679.9,534.2L1681.2,527.4L1679.8,524.4L1677.0,524.1L1676.7,520.1L1678.5,518.4L1679.7,515.2L1679.7,512.0L1681.4,509.1L1682.5,509.3L1681.9,505.3L1685.0,499.5L1686.8,499.9L1690.1,497.9L1699.6,500.2L1707.3,499.3L1712.0,495.5L1712.6,496.7L1710.8,499.4ZM1612.5,538.7L1614.7,539.9L1618.4,540.8L1620.4,543.2L1630.1,543.7L1632.7,541.1L1634.8,542.6L1641.7,544.6L1645.4,548.3L1651.8,548.6L1652.2,549.3L1652.2,553.0L1652.2,554.0L1644.8,551.5L1641.7,552.1L1634.7,551.4L1622.7,548.2L1615.5,548.3L1607.1,546.0L1605.9,543.9L1600.5,543.0L1601.1,542.4L1602.4,542.4L1605.7,538.5L1609.7,539.2L1611.3,538.4L1612.5,538.7ZM1551.4,475.7L1557.6,476.0L1561.4,480.7L1562.9,482.6L1570.6,488.2L1574.5,493.0L1576.0,493.5L1576.0,492.2L1578.0,493.2L1579.9,495.6L1583.2,497.9L1585.0,500.6L1588.1,501.8L1586.7,503.3L1586.7,503.6L1590.3,502.2L1592.1,504.0L1591.9,505.1L1590.3,506.3L1590.9,509.2L1595.7,511.0L1596.7,515.8L1598.3,517.2L1597.5,519.6L1599.3,518.2L1601.9,518.6L1605.1,522.7L1603.9,525.9L1603.7,536.9L1603.0,537.6L1600.9,536.3L1599.3,537.1L1597.0,536.3L1596.3,537.6L1592.3,533.2L1584.4,527.3L1579.0,521.3L1575.9,517.0L1571.6,508.1L1568.9,504.4L1566.1,502.4L1563.1,494.3L1558.0,491.0L1556.5,488.3L1553.7,484.5L1550.4,482.6L1545.2,477.1L1544.3,475.0L1544.6,473.6L1546.0,473.4L1551.4,475.7ZM1665.4,467.5L1667.9,466.2L1668.6,467.9L1670.4,469.8L1671.1,471.7L1672.5,471.4L1672.3,472.9L1674.7,472.7L1679.2,475.2L1675.9,477.1L1673.2,477.9L1675.2,480.4L1669.9,481.4L1669.6,482.6L1670.5,484.5L1667.1,484.7L1672.5,492.3L1671.2,493.8L1677.1,500.0L1673.2,500.1L1671.8,499.2L1669.1,506.1L1669.4,509.5L1665.7,511.8L1665.0,511.2L1664.9,512.7L1662.9,515.0L1663.3,516.5L1663.0,517.1L1664.1,517.9L1663.4,519.2L1662.6,519.6L1662.5,521.6L1661.9,522.0L1662.0,522.7L1656.7,526.9L1653.2,528.1L1652.2,524.5L1651.4,523.9L1651.3,523.6L1647.6,524.2L1647.2,522.8L1643.9,522.9L1637.4,524.8L1636.5,521.4L1632.1,522.1L1631.8,521.5L1628.5,521.4L1627.0,514.8L1626.9,511.6L1623.1,509.5L1623.1,508.2L1622.3,507.2L1623.0,504.7L1621.2,502.0L1621.1,499.9L1622.2,497.9L1622.5,496.0L1625.5,494.4L1633.5,496.9L1633.1,495.8L1634.0,492.7L1634.2,491.3L1635.4,491.4L1636.3,489.2L1644.3,487.0L1649.4,480.9L1650.0,479.2L1655.5,476.9L1656.1,477.5L1658.2,476.7L1657.9,475.5L1658.4,473.8L1660.4,472.9L1665.2,465.8L1665.4,467.5ZM1390.2,77.2L1353.7,82.6L1348.0,84.3L1349.1,84.9L1345.2,85.9L1344.4,86.3L1342.1,86.0L1340.7,87.2L1338.3,87.2L1337.9,89.1L1334.2,89.9L1334.6,90.9L1333.5,91.1L1331.5,90.8L1332.4,92.0L1326.6,93.7L1317.3,92.9L1313.7,92.7L1312.2,90.9L1317.1,89.6L1320.9,87.3L1323.9,86.7L1322.3,86.1L1326.6,84.3L1323.5,83.8L1324.4,83.1L1329.1,82.8L1329.0,82.2L1330.3,82.0L1333.4,82.2L1337.8,80.1L1341.0,79.3L1352.3,78.1L1355.5,76.9L1366.5,76.8L1373.1,76.2L1391.7,73.0L1396.7,74.3L1394.7,76.0L1390.2,77.2ZM1320.4,93.7L1326.5,94.6L1324.7,96.6L1322.6,97.0L1321.0,98.2L1321.4,100.0L1321.3,101.7L1329.2,107.0L1332.3,108.5L1325.7,108.2L1327.0,109.0L1325.0,108.5L1310.0,107.2L1312.2,106.2L1312.4,105.5L1309.3,103.9L1309.4,103.6L1300.7,103.9L1298.6,102.0L1300.7,100.2L1305.5,99.1L1305.6,97.2L1305.0,96.6L1308.8,95.5L1308.8,94.4L1310.3,94.1L1318.3,93.2L1320.4,93.7ZM1811.0,199.8L1812.3,201.5L1812.9,204.9L1814.3,209.3L1813.8,214.1L1818.3,225.0L1821.8,231.9L1817.0,228.3L1812.5,229.5L1810.0,237.4L1814.2,242.4L1815.4,243.7L1815.2,245.6L1814.7,245.6L1812.7,243.6L1810.0,243.0L1806.9,247.1L1806.0,243.0L1806.9,239.9L1806.9,237.3L1807.5,234.0L1806.7,230.2L1807.6,223.2L1807.3,220.1L1807.3,216.4L1805.5,214.6L1805.0,211.2L1806.1,207.4L1805.9,205.4L1810.1,204.6L1810.5,202.2L1809.9,200.4L1811.0,199.8ZM1817.0,257.5L1822.5,258.4L1825.7,256.5L1824.8,260.5L1826.1,262.1L1827.7,261.8L1822.5,263.8L1816.7,265.1L1813.0,269.2L1803.4,266.3L1800.9,267.3L1797.7,266.6L1798.5,268.6L1801.6,270.7L1798.9,270.6L1796.4,272.6L1795.6,272.0L1795.9,269.0L1794.8,266.1L1798.3,263.4L1798.3,261.8L1802.5,262.7L1803.5,261.6L1805.6,254.1L1804.5,251.1L1805.5,250.1L1806.9,250.0L1812.8,255.1L1817.0,257.5ZM1802.5,272.9L1803.5,273.5L1804.2,277.6L1806.7,281.4L1806.3,284.9L1804.8,286.6L1803.2,289.6L1800.8,291.5L1801.0,297.4L1798.9,302.2L1799.1,304.9L1797.3,307.7L1794.7,308.6L1795.0,306.7L1795.8,305.1L1794.6,304.9L1793.7,306.8L1793.5,307.8L1790.9,307.4L1789.0,310.7L1788.9,308.1L1787.6,308.1L1784.2,310.6L1779.2,310.7L1780.0,309.9L1778.1,309.7L1777.3,308.5L1776.6,310.9L1777.6,312.5L1774.6,313.7L1770.0,316.7L1768.2,314.2L1768.2,312.4L1769.5,310.6L1765.2,309.9L1756.4,312.4L1752.0,312.9L1751.2,315.0L1747.7,314.1L1744.4,312.8L1747.5,311.6L1757.2,305.5L1761.8,305.8L1768.7,304.5L1770.9,305.7L1772.6,305.2L1773.2,303.7L1774.0,301.7L1777.3,297.7L1778.5,295.1L1780.6,294.9L1778.7,297.2L1779.4,298.7L1780.4,298.8L1787.4,295.2L1791.3,291.7L1792.4,290.3L1795.8,283.6L1795.2,281.2L1794.2,280.8L1795.6,278.8L1795.7,276.4L1797.4,275.2L1798.0,273.8L1799.1,274.1L1800.0,275.9L1802.2,275.4L1802.0,273.6L1800.4,272.6L1802.5,272.9ZM1763.9,312.8L1765.5,314.0L1765.0,315.7L1762.6,318.2L1757.9,317.8L1754.6,321.1L1754.0,320.3L1753.3,319.1L1752.8,317.4L1751.3,317.6L1754.6,315.4L1756.2,313.7L1758.0,314.4L1759.8,313.8L1760.0,312.9L1762.3,312.2L1763.9,312.8ZM1746.0,316.5L1749.1,316.7L1749.1,318.4L1749.9,318.8L1750.5,320.7L1748.5,323.6L1746.5,328.8L1745.3,328.9L1744.5,330.4L1743.3,330.7L1743.5,327.0L1742.5,328.8L1741.2,329.6L1740.9,328.6L1740.6,324.8L1742.6,321.9L1741.9,320.1L1740.2,319.2L1741.1,321.7L1739.2,321.4L1738.4,321.8L1738.2,319.9L1739.0,319.9L1737.3,317.9L1738.6,317.7L1744.2,314.7L1746.0,316.5ZM1689.0,378.1L1687.2,381.4L1683.7,375.1L1684.2,372.0L1689.5,364.4L1692.6,363.4L1693.7,365.3L1693.1,368.7L1690.6,376.1L1689.0,378.1ZM1632.2,392.8L1632.3,395.1L1630.4,397.6L1629.5,400.1L1627.3,401.7L1623.9,402.4L1619.8,399.8L1619.9,396.5L1623.4,393.3L1628.4,392.5L1630.5,392.4L1631.0,392.0L1632.2,392.8ZM1458.8,449.9L1461.0,450.9L1463.9,454.0L1466.9,458.9L1469.4,465.6L1466.6,470.0L1461.7,471.6L1458.9,469.3L1457.7,462.4L1457.5,458.5L1457.9,458.4L1460.0,451.5L1461.1,451.4L1458.8,450.6L1458.8,449.9ZM1288.0,574.8L1290.4,579.5L1293.3,591.3L1292.2,594.0L1290.7,593.7L1289.7,591.6L1288.6,592.3L1289.5,598.2L1287.4,602.3L1286.6,609.1L1273.9,645.2L1263.7,648.5L1261.5,647.2L1256.9,644.9L1255.0,641.4L1255.2,636.4L1252.7,630.0L1254.5,624.5L1256.1,623.3L1259.3,615.4L1256.9,605.6L1259.3,598.7L1260.0,595.9L1269.2,593.4L1270.6,594.2L1270.0,593.2L1271.9,591.3L1273.7,590.5L1274.5,591.2L1274.8,589.4L1276.2,587.5L1276.7,589.1L1278.6,587.2L1278.3,586.6L1279.2,581.4L1281.2,581.5L1284.4,577.6L1284.4,574.9L1286.4,572.8L1288.0,574.8ZM117.5,952.8L93.6,951.1L88.4,949.1L94.7,946.7L100.1,947.1L115.5,951.1L117.5,952.8ZM615.3,952.1L607.5,951.3L610.2,948.6L633.8,944.4L635.3,945.0L620.6,949.8L616.6,952.0L615.3,952.1ZM756.3,947.2L766.2,948.2L768.8,952.8L765.9,953.7L764.5,954.0L766.1,954.6L734.0,957.5L706.1,958.8L704.9,957.4L710.7,954.5L719.8,953.8L727.5,951.0L727.1,950.1L725.8,949.6L727.3,947.8L727.6,947.3L727.8,946.6L742.4,941.8L754.5,942.0L764.2,944.3L757.1,946.4L756.3,947.2ZM674.8,955.8L673.7,958.2L662.0,958.9L656.6,958.0L652.5,957.4L644.1,957.3L635.8,955.4L659.2,956.0L666.0,955.6L665.0,955.3L666.0,953.9L667.1,953.1L674.0,952.6L674.7,953.5L676.1,954.5L676.6,955.0L674.8,955.8ZM616.9,893.2L617.7,893.7L620.9,895.9L626.9,903.9L626.2,908.9L616.9,912.5L603.6,912.7L600.3,911.7L601.2,910.7L602.5,910.5L613.5,911.0L615.5,910.1L606.6,909.9L609.6,908.1L604.1,906.9L600.5,908.6L595.7,908.3L595.3,909.9L593.9,909.9L587.1,907.8L589.9,906.4L592.7,906.9L592.7,905.7L593.7,905.5L598.0,906.5L597.0,905.4L598.2,905.2L603.6,904.9L600.0,904.1L604.0,903.8L608.8,904.0L615.4,903.1L618.1,903.9L617.6,902.7L611.3,900.8L616.7,899.7L617.9,899.5L607.1,897.8L606.9,894.2L605.2,892.8L609.4,891.5L615.5,891.2L616.9,893.2ZM621.9,800.5L624.2,800.0L626.5,801.8L626.6,802.5L626.2,804.0L627.6,804.2L633.7,808.8L639.7,811.4L643.9,812.4L636.1,813.7L626.6,812.6L620.1,812.8L618.5,812.1L613.1,812.2L606.4,811.0L613.3,810.0L614.0,810.8L615.6,810.7L612.4,808.0L614.7,807.4L614.6,808.0L614.2,808.8L617.3,810.1L619.3,810.0L621.4,811.1L622.6,810.3L616.7,808.1L616.4,806.7L620.9,805.1L620.0,804.3L615.4,804.5L614.6,803.2L616.4,801.9L616.2,800.8L617.9,801.3L621.9,800.5ZM550.8,375.0L557.7,375.5L561.9,376.9L565.7,379.4L571.5,380.9L574.9,382.8L576.0,382.9L576.9,383.8L576.4,384.1L576.8,384.5L578.3,384.6L579.3,385.1L585.6,386.8L585.6,388.7L590.7,389.6L593.6,392.1L588.5,393.2L574.8,392.3L576.9,389.6L570.6,387.6L567.7,383.7L561.6,383.0L558.4,381.1L555.3,381.1L554.4,380.4L553.0,380.5L550.7,380.4L550.0,379.2L551.6,378.2L550.4,377.7L545.5,377.9L541.6,380.5L539.0,380.7L537.9,382.0L535.9,382.4L533.7,382.4L536.5,380.1L542.8,376.1L550.8,375.0ZM1127.3,54.7L1135.6,55.6L1136.5,53.8L1140.5,53.6L1141.0,55.1L1147.7,54.5L1161.6,55.4L1161.9,56.9L1151.6,59.8L1137.9,60.2L1132.9,59.6L1120.4,58.4L1124.8,57.4L1115.1,57.5L1112.6,56.7L1112.9,55.8L1111.5,55.2L1119.6,55.2L1117.6,54.3L1121.1,54.5L1120.7,53.4L1127.3,54.7ZM1104.2,56.6L1110.8,57.8L1110.2,59.3L1115.2,59.0L1115.5,60.0L1115.3,60.3L1122.9,61.3L1126.5,61.4L1126.3,62.2L1129.2,63.4L1120.3,64.0L1116.9,65.5L1115.6,67.1L1113.4,67.4L1112.3,70.0L1107.9,71.7L1105.3,74.2L1105.0,75.2L1102.4,75.1L1089.9,71.4L1088.7,69.9L1105.2,68.2L1104.6,67.8L1088.3,68.5L1087.0,67.0L1089.9,66.9L1106.4,65.0L1103.7,63.9L1102.8,63.7L1096.2,64.6L1095.7,63.9L1096.0,62.9L1093.6,63.7L1091.8,63.4L1091.6,64.7L1091.4,65.1L1082.5,65.6L1074.3,61.9L1079.6,62.0L1076.8,61.1L1077.2,60.1L1072.3,60.4L1070.2,58.6L1070.3,57.8L1070.3,57.3L1078.7,57.5L1088.1,57.1L1084.2,58.4L1088.7,59.8L1089.6,58.3L1094.5,57.9L1099.0,60.8L1101.2,61.1L1098.9,57.6L1101.9,55.8L1104.2,56.6ZM1064.0,275.6L1064.9,278.1L1064.2,279.7L1063.2,285.4L1060.6,285.9L1058.2,286.4L1057.2,284.5L1057.7,281.1L1057.2,278.6L1055.9,276.2L1056.3,275.5L1059.5,275.2L1062.1,273.8L1064.0,275.6ZM1063.2,264.8L1062.9,269.5L1060.5,272.3L1058.3,269.6L1058.5,268.7L1058.2,267.2L1060.5,265.7L1062.4,265.0L1062.8,263.6L1063.2,264.8ZM1097.4,290.5L1094.8,295.3L1095.8,297.3L1094.2,299.1L1080.3,293.6L1080.1,292.1L1082.1,291.4L1084.9,290.8L1088.2,291.6L1097.4,290.5ZM714.1,112.5L718.2,113.4L718.3,114.7L708.4,116.4L706.1,115.4L708.6,115.1L707.4,114.8L702.3,112.8L703.3,112.2L702.6,111.0L707.0,110.6L712.0,111.4L714.1,112.5ZM296.3,220.9L306.3,223.0L310.6,227.7L314.6,229.1L318.1,233.4L316.5,233.8L308.5,231.7L309.0,230.3L309.6,228.9L307.7,230.1L305.6,230.3L304.1,229.5L304.9,229.0L303.1,228.4L302.9,228.0L299.8,227.0L301.0,226.3L298.2,224.9L296.5,224.9L295.9,223.7L292.5,223.6L292.5,221.8L294.6,222.0L294.4,221.1L291.0,221.5L290.4,219.8L296.3,220.9ZM606.3,394.3L612.5,393.4L617.8,395.1L621.0,396.5L621.4,397.1L620.0,397.8L625.9,400.0L625.9,401.7L624.4,402.8L620.6,401.6L614.0,402.5L612.0,402.4L608.7,405.5L603.2,402.8L596.2,402.9L594.8,403.2L592.1,401.5L593.5,400.3L601.9,401.5L604.0,400.2L601.8,397.7L601.2,395.4L597.9,394.3L598.6,393.6L602.4,393.3L606.3,394.3ZM731.5,506.3L738.5,507.0L735.5,513.3L734.0,513.3L733.1,514.0L732.1,514.1L729.9,514.9L726.1,514.5L725.4,511.3L726.1,511.0L725.1,508.9L726.9,505.9L731.5,506.3ZM992.6,176.7L990.9,178.2L987.4,180.0L988.2,180.8L987.6,181.9L999.0,181.4L999.7,182.8L995.0,187.9L992.1,188.7L994.5,189.6L990.5,190.6L989.2,190.5L998.0,191.3L1001.0,193.6L1003.5,198.3L1009.1,201.5L1010.4,204.1L1007.3,203.7L1012.0,206.7L1011.6,208.7L1014.6,207.8L1019.6,209.4L1017.9,213.3L1015.0,215.0L1014.5,215.8L1013.0,216.1L1017.9,217.1L1017.7,218.0L1008.9,219.9L1002.5,219.8L998.7,220.7L996.8,220.9L990.9,220.9L988.7,223.2L986.3,222.3L983.0,223.0L980.7,224.3L978.3,224.0L986.7,217.7L992.9,217.4L995.8,214.9L990.0,216.5L987.9,215.5L986.6,215.3L984.6,214.6L981.2,214.9L981.0,214.3L981.5,213.2L986.7,211.4L987.3,210.1L986.3,208.1L983.7,208.5L986.9,206.4L992.2,205.4L993.6,205.9L994.3,205.8L992.8,204.3L993.9,201.0L991.4,200.7L990.6,197.7L992.7,196.6L981.2,197.2L981.3,196.3L983.7,193.3L982.6,192.0L982.9,191.2L983.8,191.0L983.0,189.9L980.6,191.2L981.5,189.7L979.8,190.7L978.6,194.4L977.6,194.4L979.1,191.9L978.5,190.5L979.2,188.8L980.7,186.6L977.6,187.7L975.6,186.7L977.1,185.7L978.4,183.5L977.4,182.5L978.1,182.0L978.2,180.5L981.0,180.1L980.0,178.7L981.8,177.9L982.1,176.3L992.9,176.0L992.6,176.7ZM969.7,196.1L976.1,195.6L978.0,197.8L977.4,198.3L979.2,199.5L978.3,199.3L978.0,200.6L974.4,202.3L975.9,208.4L973.9,212.1L970.7,212.3L964.3,214.3L963.0,213.9L962.4,214.9L957.7,216.0L955.5,215.4L954.5,215.2L953.5,215.2L953.4,214.5L951.8,214.0L954.1,212.5L952.7,211.7L954.8,211.6L954.8,210.7L956.2,210.1L959.9,209.2L955.4,209.6L958.1,206.9L959.3,206.3L953.4,205.1L953.5,204.4L954.7,204.1L955.3,203.2L956.2,202.9L954.5,202.4L954.3,201.6L953.9,200.5L961.9,200.3L962.5,198.6L961.1,197.9L962.8,196.6L964.3,195.5L967.3,195.3L967.4,196.4L969.3,194.4L970.4,195.4L969.7,196.1ZM1.1,118.2L7.4,119.7L7.8,120.1L7.1,120.1L8.6,120.6L10.9,121.3L11.7,121.8L12.0,121.3L13.0,121.4L13.9,122.1L26.3,125.7L27.2,127.0L28.8,127.5L28.7,129.1L28.8,130.6L28.8,131.2L31.0,131.9L31.6,132.7L33.6,132.5L33.5,133.4L34.6,131.9L32.9,131.0L33.2,129.4L31.2,128.5L36.0,128.3L38.3,128.8L37.4,129.6L38.3,129.8L38.5,129.1L41.6,129.2L41.4,128.9L47.3,130.1L53.5,132.9L53.4,133.1L57.1,134.7L53.0,135.7L51.1,136.7L48.0,135.8L49.9,137.4L49.3,137.5L41.8,136.8L43.4,138.6L41.7,139.0L43.6,139.6L43.2,140.3L39.3,141.2L40.3,141.6L40.1,142.5L42.6,143.6L39.6,143.0L39.5,144.1L37.7,144.3L37.1,143.2L34.2,143.6L29.0,141.5L25.3,141.1L23.2,140.0L19.4,137.2L8.4,137.3L8.3,136.0L6.4,134.5L7.1,134.5L7.8,132.7L6.1,133.7L4.6,132.7L3.2,133.9L1.5,134.1L2.0,136.0L3.1,137.8L0.0,138.8L1.1,118.2ZM922.8,133.4L928.1,132.6L925.8,134.3L927.7,134.9L927.2,136.0L929.4,136.1L929.7,136.8L933.6,137.5L932.7,138.5L933.4,140.2L930.7,141.9L929.3,142.1L927.0,143.8L902.0,149.0L895.5,147.9L895.2,147.1L891.3,146.2L882.7,146.6L882.9,145.5L886.6,145.3L889.0,143.7L886.3,144.1L886.7,143.7L888.2,142.5L888.7,142.3L885.7,142.9L882.5,141.5L875.2,141.0L887.5,139.8L886.3,139.6L883.9,139.0L886.5,137.5L880.3,137.3L875.2,137.8L873.4,136.9L875.3,136.8L875.2,135.9L879.2,136.0L876.4,135.4L877.2,134.9L876.8,134.3L878.2,134.4L877.8,134.0L878.8,133.6L884.2,135.1L882.0,133.8L881.3,133.4L883.6,133.1L880.3,132.7L882.5,132.2L889.9,134.6L889.4,134.9L890.5,135.4L889.9,136.3L888.7,136.5L891.6,138.6L893.6,136.6L895.5,136.8L896.1,134.2L897.2,134.2L900.8,135.9L902.3,134.1L904.6,133.7L908.3,136.1L908.0,133.8L911.6,134.8L914.0,133.5L917.8,133.2L917.5,132.0L920.0,131.7L922.8,133.4ZM1930.1,924.9L1930.2,923.8L1930.8,924.3L1930.1,924.9ZM1934.9,884.0L1934.1,883.2L1934.9,882.8L1934.9,884.0ZM1950.7,943.5L1942.1,944.2L1942.1,943.2L1947.8,943.4L1950.4,942.8L1950.7,943.5ZM1947.5,938.9L1958.9,940.2L1948.6,941.0L1945.1,941.4L1943.6,939.8L1944.9,938.9L1944.3,938.1L1947.7,938.6L1947.5,938.9ZM1963.0,918.0L1962.0,917.0L1963.3,917.2L1963.0,918.0ZM1576.6,873.5L1572.9,872.6L1578.0,872.4L1576.6,873.5ZM1491.6,880.7L1488.9,879.4L1492.2,880.4L1491.6,880.7ZM1394.1,910.7L1395.6,909.5L1396.1,910.3L1394.1,910.7ZM1552.1,875.5L1553.9,876.5L1550.9,875.8L1552.1,875.5ZM1414.0,901.3L1412.0,900.3L1412.3,899.4L1414.4,900.7L1414.0,901.3ZM1922.4,878.0L1920.8,877.3L1922.2,877.8L1922.4,878.0ZM1590.2,872.2L1586.8,870.5L1589.0,871.1L1590.2,872.2ZM187.4,936.8L184.9,936.7L184.7,936.1L189.9,936.8L187.4,936.8ZM172.1,935.5L177.5,935.9L172.6,936.0L172.1,935.5ZM274.6,923.5L269.7,922.2L275.2,922.8L274.6,923.5ZM339.2,920.8L337.8,920.4L338.5,919.2L342.3,920.0L339.2,920.8ZM355.0,921.1L351.4,920.7L358.0,919.6L355.0,921.1ZM295.3,923.7L291.8,923.0L291.5,922.0L296.6,922.9L295.3,923.7ZM101.0,971.4L94.0,971.1L96.5,970.0L102.0,971.0L101.0,971.4ZM109.6,962.8L90.2,961.5L103.5,961.7L109.6,962.8ZM172.7,937.7L164.5,936.8L169.5,936.4L172.7,937.7ZM976.9,900.9L975.3,901.1L975.0,900.3L976.6,900.2L976.9,900.9ZM1027.0,901.1L1024.8,900.6L1028.1,900.0L1027.0,901.1ZM993.4,904.6L991.0,904.2L991.7,903.7L993.4,904.6ZM1017.3,899.2L1016.2,899.5L1015.8,898.1L1018.2,898.5L1017.3,899.2ZM995.8,902.1L998.1,902.6L994.1,904.0L990.4,901.9L990.2,901.6L995.8,902.1ZM1035.4,900.5L1033.2,900.1L1033.1,899.3L1035.9,899.8L1035.4,900.5ZM1101.0,897.8L1097.5,896.8L1103.3,896.4L1101.0,897.8ZM1160.7,899.9L1155.9,899.9L1155.8,898.9L1159.7,898.4L1160.7,899.9ZM835.4,952.8L838.0,952.4L843.2,953.5L836.9,953.5L830.4,952.4L832.7,951.9L835.4,952.8ZM819.6,950.1L804.8,949.4L817.0,949.5L819.6,950.1ZM991.6,900.8L991.6,899.7L993.4,899.3L994.9,900.4L991.6,900.8ZM894.4,919.6L894.4,921.3L895.5,922.5L893.6,922.9L888.7,920.7L886.9,920.5L892.0,919.5L894.5,918.1L894.4,919.6ZM828.5,952.1L827.6,951.6L829.6,951.3L830.7,951.7L828.5,952.1ZM753.5,844.6L755.3,845.3L752.1,845.0L753.5,844.6ZM632.6,950.8L626.1,950.1L633.7,949.8L632.6,950.8ZM698.4,859.5L700.8,859.9L698.1,860.4L693.2,860.8L693.1,860.3L698.4,859.5ZM696.5,861.5L694.6,861.0L697.4,861.3L696.5,861.5ZM688.8,867.3L688.1,866.6L690.4,866.3L688.8,867.3ZM684.7,852.4L685.6,853.0L681.2,854.3L679.2,853.8L684.7,852.4ZM662.1,896.2L659.2,893.0L663.3,894.6L662.1,896.2ZM654.7,868.9L653.9,868.6L655.1,868.5L654.7,868.9ZM660.3,866.5L657.9,866.8L660.3,864.2L661.6,865.4L660.3,866.5ZM695.4,858.9L692.7,859.1L693.0,858.4L695.4,858.9ZM669.8,856.0L672.1,857.1L669.9,856.4L666.9,856.4L669.2,855.6L669.8,856.0ZM669.2,901.8L668.4,900.7L670.8,901.2L669.2,901.8ZM669.7,863.4L668.8,863.2L669.7,862.8L669.7,863.4ZM498.5,915.6L496.9,914.4L496.3,913.2L496.0,912.3L500.7,912.8L500.6,913.8L500.0,915.1L498.5,915.6ZM423.4,915.5L420.5,915.3L420.4,914.4L423.4,915.5ZM476.8,912.7L478.3,911.9L479.5,911.7L476.8,912.7ZM607.7,899.3L609.2,900.0L607.2,899.6L607.7,899.3ZM606.1,896.1L600.7,894.8L604.1,894.9L606.1,896.1ZM595.5,916.6L594.3,916.0L596.6,915.9L595.5,916.6ZM640.5,874.4L639.4,873.9L640.6,872.7L641.5,873.2L640.5,874.4ZM636.3,876.5L634.8,876.9L636.4,875.8L636.3,876.5ZM632.1,885.2L630.9,884.3L633.2,884.6L632.1,885.2ZM1315.3,53.5L1312.2,53.3L1314.0,52.9L1315.3,53.5ZM1353.1,50.8L1347.1,50.5L1355.5,50.2L1353.1,50.8ZM1310.3,55.1L1303.3,54.6L1309.3,54.1L1311.8,54.8L1310.3,55.1ZM1330.3,54.1L1325.3,55.7L1323.9,55.2L1327.9,54.3L1330.3,54.1ZM1344.9,56.4L1340.8,55.9L1345.6,55.6L1344.9,56.4ZM586.3,778.6L586.3,776.2L586.0,774.7L587.3,774.7L587.9,778.1L586.3,778.6ZM587.5,789.4L586.6,789.4L587.5,788.3L588.3,788.7L587.5,789.4ZM592.6,802.0L597.3,803.1L599.1,804.4L592.5,802.4L591.0,800.9L592.6,802.0ZM618.9,813.2L626.2,813.8L625.2,814.6L626.6,815.3L628.0,817.3L623.4,816.0L623.3,814.9L621.2,814.5L621.2,815.7L621.5,816.3L620.3,816.0L617.5,814.2L618.9,813.2ZM588.6,779.0L586.3,781.2L586.0,780.7L586.2,779.0L588.6,779.0ZM1311.7,434.1L1315.5,434.7L1310.7,435.7L1309.6,434.3L1311.0,433.7L1311.7,434.1ZM1339.5,391.6L1339.9,390.0L1340.8,389.9L1339.5,391.6ZM1325.3,353.9L1323.6,355.0L1320.3,355.4L1323.0,354.3L1323.7,354.0L1325.3,353.9ZM1245.6,411.2L1246.6,411.9L1244.4,410.5L1245.2,409.6L1245.6,411.2ZM1235.2,416.9L1236.2,417.6L1234.1,416.9L1234.5,416.7L1234.7,415.9L1235.2,416.9ZM1294.0,359.8L1293.3,358.8L1293.7,357.7L1294.0,359.8ZM1280.9,338.8L1280.0,337.5L1280.6,337.0L1280.9,338.8ZM1955.2,599.1L1953.5,599.1L1953.7,598.1L1955.2,599.1ZM1954.3,596.7L1952.6,595.9L1953.8,595.5L1954.3,596.7ZM1955.2,603.4L1954.9,604.9L1953.7,604.0L1955.2,603.4ZM1945.6,588.2L1946.4,590.0L1947.4,589.0L1948.2,591.9L1946.7,592.4L1945.7,592.3L1945.1,590.4L1944.6,587.2L1945.6,588.2ZM1949.4,595.3L1951.3,597.7L1949.5,597.7L1948.8,595.4L1948.1,594.4L1949.4,595.3ZM1907.1,552.9L1901.4,549.7L1900.7,547.7L1906.6,552.2L1907.1,552.9ZM1893.7,546.1L1890.4,545.3L1888.0,542.1L1893.7,546.1ZM1689.8,470.9L1691.3,471.5L1690.2,471.7L1688.4,471.3L1689.8,470.9ZM591.6,777.7L589.1,777.3L588.1,774.2L590.0,774.5L591.6,777.7ZM647.8,812.0L651.8,812.3L646.8,812.8L647.8,812.0ZM600.8,805.1L604.3,807.2L601.1,808.7L601.1,808.2L601.1,807.2L598.7,807.7L598.6,806.4L596.5,804.8L600.8,805.1ZM633.6,814.5L631.8,815.1L627.9,814.8L627.8,813.2L633.5,814.0L633.6,814.5ZM611.7,812.9L615.6,814.0L615.0,814.5L609.2,813.1L611.7,812.9ZM591.6,792.7L590.9,793.2L588.3,794.1L587.5,794.3L588.9,793.0L591.6,792.7ZM588.9,787.2L586.9,787.0L588.0,785.8L590.1,786.7L588.9,787.2ZM590.2,794.7L591.8,796.7L590.0,798.3L589.1,795.2L590.2,794.7ZM609.4,808.2L611.5,808.9L609.9,809.8L606.2,809.2L605.2,807.7L609.4,808.2ZM596.3,754.1L595.2,755.6L596.1,759.1L594.3,758.6L592.1,755.2L592.4,754.3L594.2,753.4L595.3,752.6L596.3,754.1ZM593.0,761.4L591.2,760.9L593.2,759.1L593.0,761.4ZM597.2,249.9L595.6,249.6L597.4,249.4L597.2,249.9ZM662.6,239.7L663.0,240.0L663.1,238.6L665.1,238.1L662.6,239.7ZM1648.8,544.9L1644.3,545.5L1642.8,544.3L1650.1,544.1L1648.8,544.9ZM127.1,494.6L126.7,495.0L126.1,494.2L126.8,494.2L127.2,494.0L127.1,494.6ZM172.1,604.3L172.5,605.2L170.4,603.9L170.5,603.4L172.1,603.7L172.1,604.3ZM43.0,580.6L43.0,582.3L41.2,581.6L41.1,580.9L43.0,580.6ZM1822.2,430.6L1822.4,429.1L1823.1,428.7L1822.2,430.6ZM1961.0,614.6L1959.7,614.7L1959.9,613.4L1961.0,614.6ZM1960.2,611.3L1958.3,610.6L1958.8,609.5L1960.2,611.3ZM1952.7,625.2L1952.7,626.4L1952.3,626.2L1952.3,624.9L1952.7,625.2ZM1949.3,623.7L1947.2,622.4L1947.8,621.5L1948.2,621.0L1949.3,623.7ZM1912.0,551.7L1915.2,558.8L1911.5,553.4L1911.4,551.8L1912.0,551.7ZM1917.4,563.3L1919.9,564.0L1920.7,565.8L1916.4,563.9L1915.5,562.3L1917.4,563.3ZM1916.5,559.0L1916.1,559.4L1915.7,558.9L1915.7,557.6L1916.5,559.0ZM1895.2,551.2L1895.1,552.8L1893.8,551.3L1892.2,551.1L1894.3,549.9L1895.2,551.2ZM1897.2,553.7L1895.9,553.6L1896.2,553.0L1897.3,553.0L1897.2,553.7ZM1889.2,549.5L1888.9,547.7L1889.8,548.6L1889.2,549.5ZM1891.9,550.5L1890.7,549.5L1891.5,549.1L1891.9,550.5ZM21.4,750.4L20.3,750.7L19.9,750.8L19.9,752.3L19.2,752.5L18.9,750.9L18.2,750.5L21.4,750.4ZM1942.7,789.8L1941.0,789.8L1942.9,788.6L1942.7,789.8ZM1953.5,767.9L1953.4,768.5L1953.7,769.3L1950.1,769.8L1951.3,767.6L1952.4,767.0L1953.5,767.9ZM1792.8,598.0L1790.8,598.8L1792.5,597.2L1793.1,597.7L1792.8,598.0ZM1777.1,582.5L1778.2,582.6L1777.3,584.2L1778.3,584.9L1777.4,585.1L1775.3,584.5L1776.1,582.4L1777.0,581.8L1777.1,582.5ZM1742.0,570.5L1742.3,571.4L1739.8,570.5L1741.3,568.6L1742.0,570.5ZM1742.9,568.8L1746.9,568.1L1747.7,569.6L1743.1,570.9L1741.6,567.8L1742.9,568.8ZM1817.6,730.1L1817.2,728.5L1818.5,727.4L1818.6,729.6L1817.6,730.1ZM1842.3,731.2L1842.4,732.2L1840.8,731.4L1842.3,731.2ZM1840.4,728.1L1842.1,729.8L1842.1,730.4L1840.9,730.8L1839.5,728.5L1840.4,728.1ZM1782.1,705.5L1784.7,706.4L1782.2,706.7L1780.9,707.1L1776.4,706.6L1776.4,705.9L1781.7,704.8L1782.1,705.5ZM1868.9,649.5L1869.6,645.7L1870.1,643.8L1869.3,648.2L1868.9,649.5ZM1858.1,636.8L1858.3,638.2L1857.6,636.6L1858.1,636.8ZM1683.9,436.7L1684.8,436.9L1684.7,437.6L1683.1,437.3L1682.9,435.9L1683.9,436.7ZM1698.2,446.2L1697.5,446.1L1698.1,445.0L1698.6,444.9L1698.2,446.2ZM1702.2,452.0L1703.1,448.1L1706.1,442.1L1705.5,447.1L1703.8,448.8L1702.2,452.0ZM1709.1,450.1L1705.4,451.0L1705.0,449.6L1707.8,448.1L1708.9,449.6L1709.1,450.1ZM1695.1,468.9L1693.9,468.4L1694.1,467.5L1696.0,468.1L1695.1,468.9ZM1715.3,449.4L1714.3,447.8L1715.2,446.7L1715.3,449.4ZM1694.1,429.0L1695.2,429.7L1693.9,430.5L1694.1,429.0ZM1695.1,435.7L1694.3,436.6L1694.2,435.5L1695.3,434.2L1695.1,435.7ZM1704.2,436.1L1706.1,438.7L1705.7,438.7L1702.5,436.6L1701.0,437.8L1702.1,434.6L1704.2,436.1ZM1707.8,428.5L1706.1,428.7L1706.5,427.6L1707.5,426.7L1707.8,428.5ZM1694.7,420.8L1694.1,422.7L1694.4,420.6L1694.7,420.8ZM1840.6,537.7L1839.6,535.8L1840.8,537.3L1840.6,537.7ZM1835.2,516.0L1837.3,516.6L1835.6,517.2L1832.2,517.1L1833.5,516.1L1835.2,516.0ZM1854.1,519.9L1852.2,519.6L1852.2,518.5L1854.2,519.1L1854.1,519.9ZM1857.7,561.2L1858.6,562.2L1857.0,561.1L1856.2,559.6L1857.7,561.2ZM1853.6,558.3L1852.4,557.0L1853.5,557.0L1853.6,558.3ZM1854.6,557.4L1856.6,558.4L1856.4,559.4L1854.4,558.7L1854.6,557.4ZM1866.4,555.3L1868.5,556.1L1868.1,556.6L1866.1,555.3L1866.4,555.3ZM1871.5,569.4L1872.4,570.2L1870.5,569.5L1870.2,568.7L1871.5,569.4ZM1769.6,508.7L1773.5,509.9L1774.8,511.6L1772.2,511.3L1771.1,509.9L1769.6,508.7ZM1770.2,513.9L1777.1,515.3L1774.2,515.4L1770.2,513.9ZM1789.4,552.1L1787.8,551.4L1789.4,551.8L1789.4,552.1ZM1741.4,514.5L1741.5,516.2L1740.2,516.6L1739.4,514.9L1741.4,514.5ZM1745.1,512.4L1743.6,511.6L1744.5,510.0L1745.3,511.7L1745.1,512.4ZM1744.0,505.0L1746.8,506.1L1746.3,507.1L1744.5,506.5L1742.9,505.5L1743.7,507.5L1742.8,506.8L1741.1,505.9L1744.0,505.0ZM1730.8,493.5L1729.7,493.3L1730.1,491.1L1732.1,491.1L1730.8,493.5ZM1725.8,506.8L1726.3,508.9L1727.3,509.8L1726.4,509.7L1725.1,509.1L1724.3,507.6L1725.8,506.8ZM1729.1,514.3L1725.2,514.5L1725.2,513.2L1727.7,513.1L1729.1,514.3ZM1766.1,537.0L1765.7,540.5L1763.9,540.2L1762.7,538.8L1763.2,537.2L1763.3,536.9L1765.3,535.5L1766.1,537.0ZM1764.9,541.1L1763.0,543.8L1762.2,543.0L1762.6,541.1L1762.8,539.7L1764.9,541.1ZM1729.8,525.6L1727.8,525.6L1730.1,524.7L1729.8,525.6ZM1701.2,530.5L1700.9,531.6L1700.1,534.1L1700.8,535.3L1697.8,536.1L1700.4,529.7L1701.2,530.5ZM1698.2,534.6L1697.5,535.3L1696.4,533.8L1697.5,531.4L1698.7,531.2L1698.2,534.6ZM1694.8,535.5L1693.5,534.2L1694.4,533.5L1694.8,535.5ZM1701.5,528.1L1700.1,528.3L1700.3,527.3L1701.5,528.1ZM1717.1,515.0L1718.6,515.4L1716.1,515.7L1713.9,515.2L1717.1,515.0ZM1711.2,514.6L1712.1,515.6L1707.9,514.5L1711.2,514.6ZM1701.4,511.6L1702.1,512.0L1703.2,512.5L1702.7,513.4L1701.5,513.8L1700.9,513.9L1700.8,512.5L1699.4,513.7L1700.0,511.7L1701.4,511.6ZM1721.6,482.4L1721.3,481.6L1721.6,479.5L1721.8,481.5L1721.6,482.4ZM1715.1,485.7L1714.3,485.1L1714.4,484.4L1715.1,485.7ZM1744.3,551.7L1745.5,550.6L1745.3,551.1L1744.3,551.7ZM1746.9,549.9L1745.7,549.5L1746.1,548.0L1749.0,545.1L1748.3,548.1L1746.9,549.9ZM1721.5,548.0L1718.8,549.4L1715.9,549.2L1717.5,548.2L1721.1,548.0L1721.5,548.0ZM1699.9,566.2L1700.5,565.0L1702.3,564.3L1699.9,566.2ZM1709.0,550.7L1712.1,551.0L1711.9,551.9L1707.9,552.2L1709.0,550.7ZM1707.4,551.7L1706.1,553.0L1705.6,551.9L1707.3,551.0L1707.4,551.7ZM1705.4,551.4L1702.9,552.9L1702.0,552.4L1702.8,551.4L1705.4,551.4ZM1671.7,482.3L1670.0,481.9L1670.5,481.1L1671.7,482.3ZM1662.6,526.7L1661.2,527.5L1661.0,525.3L1662.4,524.0L1662.6,526.7ZM1625.6,511.6L1624.0,512.0L1625.1,510.5L1625.6,511.6ZM1617.8,484.3L1617.0,483.9L1616.0,482.3L1617.4,481.7L1618.2,483.3L1617.8,484.3ZM1580.7,493.3L1580.1,495.4L1579.3,495.1L1579.2,493.4L1580.7,493.3ZM1584.7,499.4L1583.8,498.6L1583.9,497.2L1584.9,498.5L1584.7,499.4ZM1585.1,496.8L1584.7,497.3L1582.6,495.9L1585.1,496.8ZM1588.1,500.8L1584.9,500.0L1585.4,498.7L1588.1,500.8ZM1596.8,498.2L1596.4,500.2L1595.2,499.3L1594.9,499.0L1596.8,498.2ZM1597.9,506.0L1597.5,506.2L1596.3,505.7L1597.1,505.1L1597.9,506.0ZM1596.2,506.9L1596.6,507.9L1595.4,508.0L1595.3,507.1L1596.2,506.9ZM1617.2,521.8L1615.9,523.1L1615.1,522.4L1614.0,522.5L1615.1,519.2L1617.6,520.9L1617.2,521.8ZM1557.0,496.8L1559.3,500.0L1558.1,501.7L1555.6,497.0L1557.0,496.8ZM1573.5,522.9L1572.5,520.6L1573.7,522.1L1573.5,522.9ZM1572.3,520.4L1571.1,520.5L1571.2,519.1L1572.3,520.4ZM1570.2,518.1L1568.5,517.1L1569.0,516.3L1570.2,518.1ZM1566.4,515.0L1564.5,513.6L1564.8,510.1L1567.0,514.8L1566.4,515.0ZM1562.5,508.0L1561.8,507.6L1562.0,505.0L1562.8,507.1L1562.5,508.0ZM1551.3,491.8L1547.4,489.0L1548.7,489.4L1551.3,491.8ZM1138.6,174.9L1136.1,175.6L1135.2,174.5L1136.0,174.1L1137.4,173.8L1139.0,174.4L1138.6,174.9ZM1211.0,139.3L1210.2,140.0L1209.7,139.3L1211.0,139.3ZM1290.8,55.7L1289.9,54.8L1292.3,55.1L1290.8,55.7ZM1298.5,56.4L1293.2,55.9L1297.6,55.8L1298.5,56.4ZM1334.4,47.4L1337.5,48.3L1335.0,48.8L1334.2,49.5L1330.7,49.5L1321.8,49.2L1323.0,48.7L1334.4,47.4ZM1317.0,49.8L1333.1,51.9L1322.6,52.5L1313.3,51.2L1317.0,49.8ZM1294.8,50.2L1293.2,49.8L1295.9,49.9L1294.8,50.2ZM1338.9,50.3L1340.3,51.7L1337.0,51.8L1332.1,50.2L1338.9,50.3ZM1337.1,46.5L1334.9,46.4L1342.5,45.7L1343.1,46.1L1337.1,46.5ZM1073.1,63.9L1077.1,66.1L1070.8,63.7L1069.2,62.3L1071.5,62.6L1073.1,63.9ZM1117.8,87.6L1115.8,86.9L1118.1,87.1L1117.8,87.6ZM1308.2,105.3L1307.4,106.5L1303.4,104.6L1306.8,104.6L1308.2,105.3ZM1428.9,96.1L1426.0,95.0L1429.4,95.2L1428.9,96.1ZM1445.6,99.4L1441.5,98.9L1449.2,97.9L1445.6,99.4ZM1456.1,96.9L1451.4,96.0L1455.3,95.2L1456.3,96.7L1456.1,96.9ZM1496.2,84.3L1498.2,84.9L1494.4,84.5L1496.2,84.3ZM1471.1,81.8L1469.6,82.7L1468.5,81.6L1471.1,81.8ZM1551.7,77.0L1549.3,77.7L1544.9,77.1L1551.7,77.0ZM1550.3,72.8L1545.4,72.6L1551.8,72.1L1550.3,72.8ZM1512.3,71.9L1510.5,71.4L1513.2,71.4L1512.3,71.9ZM1459.0,51.4L1453.9,50.9L1461.3,50.9L1459.0,51.4ZM1606.3,66.2L1606.7,65.8L1608.8,65.8L1606.3,66.2ZM1641.1,75.1L1641.9,75.8L1640.7,75.8L1638.5,75.0L1641.1,75.1ZM1772.8,81.9L1770.2,81.6L1771.9,79.7L1773.0,81.2L1772.8,81.9ZM1846.9,74.9L1843.0,74.8L1847.6,74.4L1846.9,74.9ZM1959.4,114.6L1951.6,112.9L1960.6,113.0L1959.4,114.6ZM1928.2,176.2L1927.8,176.0L1931.4,173.4L1933.8,173.3L1931.8,174.9L1928.2,176.2ZM1945.1,197.3L1944.4,197.7L1940.5,194.7L1942.7,195.0L1945.1,197.3ZM1887.6,220.8L1886.5,220.0L1888.0,220.2L1887.6,220.8ZM1884.9,222.7L1881.3,224.1L1880.9,222.8L1884.1,221.7L1886.0,220.7L1884.9,222.7ZM1849.9,248.9L1850.5,247.6L1853.0,246.8L1849.9,248.9ZM1843.8,250.7L1838.3,252.8L1834.5,255.2L1840.2,250.4L1843.9,249.8L1845.0,249.6L1844.9,250.7L1843.8,250.7ZM1784.0,195.9L1784.9,196.4L1782.4,198.3L1780.3,197.6L1780.3,197.0L1783.8,195.8L1784.0,195.9ZM1779.7,195.8L1778.6,196.8L1777.6,196.3L1779.7,195.8ZM1830.4,255.3L1831.7,256.0L1826.0,259.2L1830.4,255.3ZM1729.7,355.4L1727.5,357.0L1726.3,358.2L1728.2,355.3L1730.1,354.6L1729.7,355.4ZM1736.4,346.7L1735.1,346.4L1737.8,345.3L1736.4,346.7ZM1739.9,324.2L1739.5,323.8L1740.5,322.7L1739.9,324.2ZM1786.3,292.8L1785.9,292.6L1786.1,290.9L1787.2,290.3L1787.1,292.3L1786.3,292.8ZM1767.1,312.6L1766.1,312.2L1767.0,312.0L1767.1,312.6ZM1736.0,312.2L1735.7,311.3L1736.5,310.5L1736.0,312.2ZM1718.8,318.6L1718.1,317.8L1720.9,316.8L1722.2,317.3L1718.8,318.6ZM1593.9,446.7L1593.3,447.5L1593.0,446.8L1593.9,446.7ZM1562.2,460.7L1561.4,460.5L1561.9,459.5L1562.2,460.7ZM1536.8,466.7L1535.8,465.7L1535.5,465.0L1536.7,464.6L1536.8,466.7ZM1529.0,445.8L1528.3,445.2L1528.3,444.4L1529.3,444.4L1529.0,445.8ZM1530.3,440.3L1529.4,438.1L1530.6,436.0L1531.4,429.3L1532.2,429.6L1530.3,440.3ZM1540.1,415.5L1540.2,414.8L1540.9,414.4L1540.1,415.5ZM1519.4,381.1L1518.8,379.7L1518.8,377.0L1519.9,379.4L1519.4,381.1ZM959.8,107.5L965.1,105.6L965.1,106.4L959.8,107.5ZM137.0,398.3L135.2,397.7L134.7,393.7L136.8,391.9L139.8,393.5L141.1,395.8L137.0,398.3ZM127.9,386.0L130.5,386.6L127.5,386.3L127.9,386.0ZM131.9,387.5L134.6,388.8L132.1,388.8L131.0,387.0L131.9,387.5ZM124.6,384.6L124.6,385.7L122.7,385.1L122.8,383.8L124.3,384.1L124.6,384.6ZM115.7,381.9L113.8,380.8L116.1,380.7L115.7,381.9ZM2005.5,213.9L2005.3,213.4L2006.8,212.9L2005.5,213.9ZM1979.7,207.5L1982.9,208.5L1979.2,208.3L1978.9,207.6L1979.7,207.5ZM108.4,194.6L109.1,194.3L108.8,195.5L107.5,194.6L108.4,194.6ZM112.9,195.7L111.3,196.3L112.9,194.9L112.9,195.7ZM79.4,201.6L78.1,201.1L79.9,201.1L79.4,201.6ZM67.5,205.7L61.3,208.4L63.7,206.2L65.3,205.9L66.3,204.6L68.4,204.9L67.5,205.7ZM75.1,202.6L76.8,202.7L75.5,203.7L76.1,204.0L69.6,206.1L69.0,205.5L72.4,204.0L73.5,203.7L74.0,203.8L72.3,202.9L73.1,202.2L75.1,202.6ZM36.2,212.5L38.3,212.9L34.1,212.8L36.2,212.5ZM29.9,213.0L26.9,213.0L32.2,211.7L31.6,211.3L33.4,211.2L33.5,211.6L31.7,212.8L29.9,213.0ZM19.1,214.0L19.8,214.7L17.5,214.4L19.1,213.3L19.1,214.0ZM16.0,214.8L13.1,214.8L16.2,213.6L16.0,214.8ZM11.9,215.2L10.3,213.8L12.8,214.3L11.9,215.2ZM1423.6,803.2L1421.9,803.2L1421.3,802.2L1423.6,803.2ZM1166.2,303.4L1165.7,302.6L1165.8,301.8L1168.4,300.9L1166.2,303.4ZM1162.5,306.0L1162.4,304.5L1162.7,304.6L1162.5,306.0ZM1160.5,292.8L1161.4,293.5L1159.5,293.0L1160.5,292.8ZM1156.4,290.6L1155.2,290.3L1155.7,289.4L1156.0,288.4L1156.7,289.0L1156.4,290.6ZM1158.2,284.3L1159.2,286.0L1158.1,286.3L1157.3,285.2L1156.9,285.1L1155.4,285.4L1155.4,284.6L1158.2,284.3ZM1152.7,280.6L1152.0,281.6L1150.6,281.1L1152.7,280.6ZM913.5,320.6L915.9,321.5L913.7,321.4L913.5,320.6ZM918.3,345.8L915.8,347.1L915.5,345.8L919.6,344.9L918.3,345.8ZM933.0,342.8L932.6,342.0L934.7,341.2L933.9,342.5L933.0,342.8ZM930.3,346.9L929.4,347.2L932.4,344.0L930.3,346.9ZM939.7,463.3L937.9,462.2L939.8,462.5L939.7,463.3ZM923.6,347.1L922.7,349.3L921.3,347.9L923.3,347.1L923.6,347.1ZM868.8,409.9L867.9,409.5L869.1,408.5L869.8,409.1L868.8,409.9ZM881.4,413.9L882.7,414.6L882.0,415.3L881.4,414.4L881.4,413.9ZM878.5,420.8L876.5,420.4L877.0,419.1L878.5,420.8ZM1259.6,572.8L1259.5,574.2L1258.5,573.3L1259.6,572.8ZM1253.9,571.8L1252.7,569.1L1253.2,568.8L1253.9,571.8ZM1232.8,549.8L1232.5,549.3L1233.9,548.4L1232.8,549.8ZM1231.6,539.6L1231.3,541.0L1230.0,539.1L1230.8,537.6L1231.6,539.6ZM1333.5,619.9L1331.9,619.5L1334.0,617.8L1333.5,619.9ZM1323.1,624.7L1320.4,624.1L1321.1,622.1L1323.2,624.4L1323.1,624.7ZM1233.7,532.5L1232.8,535.5L1233.2,532.7L1233.7,532.5ZM1059.0,483.9L1059.3,485.9L1058.5,486.9L1057.4,486.5L1059.0,483.9ZM1047.4,504.3L1046.5,504.3L1046.3,503.4L1047.9,503.2L1047.4,504.3ZM1071.5,315.8L1070.2,315.0L1071.3,314.8L1071.5,315.8ZM985.2,201.0L983.4,201.3L985.3,199.7L985.2,201.0ZM981.4,193.9L979.7,192.9L980.0,192.5L981.4,193.2L981.4,193.9ZM977.6,188.8L974.5,189.0L974.6,187.7L974.6,187.4L977.6,188.8ZM975.6,191.2L974.9,193.0L974.5,192.0L973.6,192.4L975.6,191.2ZM976.5,191.8L976.1,191.2L977.5,190.7L976.5,191.8ZM1002.7,165.3L1004.0,166.2L1002.4,168.8L1002.6,167.3L1001.2,166.7L1001.9,165.7L1001.6,165.4L1002.7,165.3ZM986.5,205.8L986.4,206.4L985.2,206.6L985.0,205.3L986.5,205.8ZM992.8,173.8L994.3,174.5L991.2,174.0L992.3,173.2L992.8,173.8ZM972.8,155.8L972.4,156.6L971.6,156.6L971.8,157.2L971.0,155.3L972.8,155.8ZM975.2,177.5L973.9,179.0L973.1,179.9L971.0,180.3L971.5,179.9L970.4,179.5L970.7,178.3L972.3,178.4L972.2,177.8L975.1,176.8L975.2,177.5ZM975.5,182.3L975.8,183.5L978.2,183.9L976.4,184.9L975.4,184.1L972.1,182.6L974.9,181.5L975.5,182.3ZM1122.2,166.4L1123.7,166.9L1123.1,167.3L1120.4,167.0L1122.2,166.4ZM1102.7,189.1L1102.0,188.1L1103.3,185.9L1105.7,183.6L1102.7,189.1ZM1094.7,196.3L1092.8,194.7L1094.9,195.9L1094.7,196.3ZM1086.9,199.9L1084.0,200.2L1084.2,198.7L1085.5,198.4L1086.9,199.9ZM1080.4,196.6L1078.1,196.6L1079.1,196.2L1080.4,196.6ZM1073.8,197.0L1076.0,197.7L1075.5,198.3L1072.0,197.0L1073.8,197.0ZM1070.2,197.8L1070.0,196.9L1071.3,196.0L1070.2,197.8ZM1056.6,197.6L1057.4,196.1L1058.3,197.1L1056.6,197.6ZM1018.1,286.6L1017.0,286.3L1018.8,285.5L1019.1,285.9L1018.1,286.6ZM1125.7,289.6L1125.6,291.1L1124.5,289.9L1125.7,289.6ZM1127.2,292.9L1127.3,293.3L1126.2,293.2L1126.1,292.2L1127.2,292.9ZM1122.7,283.7L1120.6,281.7L1121.9,282.0L1121.7,282.7L1122.7,283.7ZM723.8,114.7L722.1,114.1L722.7,112.7L725.5,113.2L723.8,114.7ZM709.6,106.4L707.3,105.7L709.7,105.2L709.6,106.4ZM701.3,96.6L697.8,97.7L695.3,96.8L701.3,96.6ZM750.4,163.9L749.1,164.5L749.7,163.2L750.7,163.3L750.4,163.9ZM322.2,234.8L323.1,236.1L321.4,234.1L322.4,234.0L321.9,234.5L322.2,234.8ZM299.4,226.7L297.7,225.9L298.4,225.2L299.4,226.7ZM307.6,223.9L307.1,222.1L308.0,223.5L307.6,223.9ZM586.1,307.3L586.2,307.0L586.5,304.6L586.1,307.3ZM574.3,368.9L574.1,369.7L575.0,370.4L573.6,371.7L572.6,368.9L574.3,368.9ZM576.7,359.6L576.3,358.6L576.1,355.6L573.5,354.1L573.1,353.8L575.4,354.4L577.7,357.2L576.7,359.6ZM600.2,386.1L598.1,387.5L596.5,387.1L598.0,386.0L599.6,386.0L600.3,385.5L600.2,386.1ZM593.6,380.4L595.5,377.7L594.9,379.5L593.6,380.4ZM579.9,362.0L582.9,364.2L582.4,366.5L582.4,365.7L582.0,363.5L579.4,362.0L579.9,362.0ZM590.1,376.5L588.0,374.9L588.0,372.9L590.1,376.5ZM587.4,369.2L586.5,369.4L586.4,368.5L585.2,366.4L587.4,369.2ZM573.8,366.4L573.2,368.1L571.9,368.3L570.4,366.7L572.1,363.9L573.8,366.4ZM546.7,384.0L543.9,384.5L543.3,383.7L543.8,382.7L545.6,382.1L546.7,384.0ZM569.6,355.0L572.7,355.4L567.8,356.1L567.1,355.3L568.3,355.7L569.6,355.0ZM559.0,363.9L558.0,364.7L559.5,362.8L559.0,363.9ZM522.2,391.1L522.2,389.7L523.2,389.7L522.2,391.1ZM668.3,427.4L667.4,427.7L667.4,426.9L668.4,426.4L668.3,427.4ZM668.7,423.7L667.2,423.6L667.1,423.0L666.7,421.6L668.2,422.3L668.7,423.7ZM667.7,448.1L664.0,447.8L665.0,445.5L664.4,444.7L667.7,444.9L667.7,448.1ZM651.7,442.5L650.9,443.9L648.9,443.0L650.8,442.9L651.7,442.5ZM665.9,413.9L664.7,413.5L665.4,412.6L665.9,413.9ZM664.4,415.2L663.3,413.5L664.1,413.4L664.4,415.2ZM600.2,379.1L601.6,379.9L599.7,379.0L600.2,379.1ZM188.6,165.8L190.1,166.1L187.3,166.8L186.8,166.0L188.6,165.8ZM181.0,169.4L180.9,168.6L184.5,166.3L185.2,166.9L181.0,169.4ZM181.5,165.8L180.6,167.2L180.8,165.7L181.5,165.8ZM264.5,197.0L265.8,197.3L264.3,197.7L262.1,194.6L264.5,197.0ZM258.2,186.0L259.4,187.4L258.3,190.2L256.7,189.6L257.3,187.9L256.6,185.6L258.2,186.0ZM262.0,193.3L260.2,194.1L260.5,193.4L262.0,193.3ZM273.0,195.9L273.1,197.0L272.4,196.8L271.8,194.9L273.0,195.9ZM265.1,187.8L264.1,187.4L265.7,186.9L265.8,187.7L265.1,187.8ZM268.7,190.2L268.4,191.0L267.1,191.0L265.5,189.5L268.2,188.6L268.7,190.2ZM265.0,189.4L263.6,188.6L265.8,188.5L265.0,189.4ZM279.2,202.2L278.3,202.8L276.7,202.3L278.3,201.5L279.2,202.2ZM281.4,206.7L278.0,204.1L281.9,206.2L281.4,206.7ZM289.7,211.0L289.7,208.8L290.4,209.1L289.7,211.0ZM560.4,521.7L559.6,521.6L560.3,520.1L561.0,520.8L560.4,521.7ZM719.2,513.0L721.5,508.2L722.9,508.7L722.1,510.7L719.2,513.0ZM730.9,503.5L729.4,505.2L727.5,504.2L730.9,503.5ZM725.8,505.7L723.7,506.5L723.7,506.1L725.2,505.2L725.8,505.7ZM732.6,505.6L730.6,505.3L732.8,504.7L732.6,505.6ZM727.1,504.2L726.5,503.6L727.5,501.7L727.1,504.2ZM728.6,502.8L727.9,502.8L728.0,501.7L729.2,501.7L728.6,502.8ZM503.1,509.3L502.4,507.9L504.0,508.1L503.1,509.3ZM508.3,510.1L507.6,509.6L509.1,509.0L508.3,510.1ZM552.1,463.9L550.7,463.0L551.3,462.2L552.1,463.9ZM497.9,504.9L499.9,510.3L497.3,510.7L496.8,509.5L498.3,507.8L496.8,505.1L496.5,504.7L497.9,504.9ZM375.1,342.0L372.7,340.0L373.1,339.1L374.9,341.5L375.1,342.0ZM363.8,347.5L363.3,346.7L363.6,346.0L363.8,347.5ZM380.4,342.2L379.6,343.6L378.6,342.9L380.0,340.9L380.4,342.2ZM381.2,367.3L380.3,365.0L380.8,363.5L380.6,365.8L381.2,367.3ZM1402.9,131.8L1400.0,130.5L1403.1,131.1L1402.9,131.8ZM1916.0,118.4L1914.1,116.7L1914.0,115.2L1916.3,114.3L1916.4,115.4L1915.5,116.2L1916.0,118.4ZM524.1,106.6L532.5,105.8L534.2,106.1L534.0,102.9L530.8,102.5L528.2,100.9L533.0,99.8L537.1,100.7L534.1,99.2L533.9,98.7L530.9,98.5L529.4,96.7L533.1,95.8L537.1,96.3L533.0,93.5L539.9,93.0L540.2,92.2L546.2,91.3L553.2,91.8L555.4,94.0L557.8,95.0L558.3,96.2L559.6,96.8L554.2,99.4L557.7,98.6L556.0,99.9L557.0,100.5L555.8,100.7L556.3,101.5L560.5,99.8L560.6,99.3L562.4,98.5L566.6,99.9L568.0,101.4L569.0,101.6L567.7,99.5L569.1,99.2L574.9,99.8L569.8,98.6L570.4,97.6L579.6,97.1L588.1,98.6L588.9,99.5L584.1,102.6L589.7,100.4L593.6,101.1L591.3,102.2L588.1,102.7L590.8,103.0L590.5,104.7L592.5,102.8L595.8,102.3L595.5,103.2L594.4,104.2L596.9,103.7L599.3,104.6L599.3,103.4L602.1,103.0L609.0,104.0L609.4,105.8L604.2,107.6L607.4,106.3L613.7,106.6L611.5,108.4L607.3,110.0L610.0,109.8L609.3,111.5L612.4,108.6L615.3,107.8L622.5,108.1L626.2,109.1L625.7,109.9L617.7,112.1L624.2,111.1L623.4,112.5L624.8,112.4L629.3,110.6L633.0,113.6L627.8,113.6L622.4,114.9L632.7,115.3L635.9,116.4L622.9,117.4L626.7,116.9L629.8,117.6L628.4,119.0L623.6,119.2L627.6,119.6L629.1,120.5L635.7,120.9L634.6,122.0L634.6,123.1L636.3,122.8L636.7,122.0L638.2,122.8L637.5,124.4L640.0,123.3L642.5,123.8L643.1,125.2L643.6,123.8L646.2,123.5L646.2,124.7L650.5,126.3L649.2,127.1L647.6,127.3L651.9,127.3L653.6,127.0L655.6,128.1L652.9,130.1L662.3,128.9L666.0,131.3L661.6,131.2L664.5,132.6L662.4,132.9L659.8,132.9L660.8,133.8L661.3,134.6L659.3,134.8L659.4,135.8L657.8,136.7L653.9,135.6L652.8,136.5L653.6,136.7L654.5,137.2L654.2,139.6L652.4,140.3L649.2,138.5L649.3,138.0L647.2,139.3L643.2,135.7L648.1,132.8L643.6,134.6L640.3,134.6L641.4,133.5L638.5,133.5L634.0,131.2L632.3,131.7L632.3,133.0L629.6,132.6L632.5,134.9L631.8,135.1L625.5,133.3L624.4,133.6L627.3,134.4L627.8,135.6L628.7,136.8L629.0,137.1L631.3,136.8L633.3,137.9L632.4,138.4L635.2,140.2L635.9,141.3L636.8,140.4L638.8,141.8L641.0,141.1L643.7,142.3L642.5,143.0L644.1,144.2L643.3,144.6L645.2,145.8L647.1,145.8L646.6,146.4L648.2,147.6L647.6,150.1L647.0,150.0L644.2,147.3L645.0,150.2L647.1,152.0L644.4,151.9L644.3,153.5L638.3,150.9L638.0,151.5L636.9,151.0L636.0,150.2L635.6,151.1L629.4,147.9L629.4,149.0L624.9,147.3L624.0,148.2L639.6,156.2L639.0,156.8L639.0,157.7L637.3,157.7L624.9,155.5L618.3,152.7L615.3,152.7L611.1,151.4L611.7,150.8L608.1,150.4L606.2,149.1L608.7,148.2L604.4,147.3L605.0,146.5L602.7,146.4L597.9,143.5L598.1,142.7L595.1,143.3L594.2,143.4L593.6,142.4L590.7,141.3L590.2,141.9L589.8,143.3L584.9,143.7L577.8,144.4L571.4,142.4L572.4,140.2L575.9,139.0L575.5,138.2L576.5,137.7L585.5,139.5L586.8,141.1L586.7,139.7L585.2,138.5L597.2,137.2L592.7,133.5L600.5,130.4L602.3,128.7L604.7,127.5L598.7,121.4L595.5,121.0L595.6,119.5L592.8,120.3L589.7,118.8L590.2,118.2L589.6,117.9L590.3,117.5L580.1,119.4L580.8,117.7L585.5,116.6L580.6,114.9L581.2,114.0L577.2,114.2L578.2,113.2L574.4,112.8L573.2,110.8L569.6,110.5L565.8,109.0L564.8,110.1L567.5,110.9L567.3,112.3L563.3,112.8L551.8,111.7L555.9,113.1L552.3,112.5L547.2,113.0L541.3,112.4L526.3,111.6L524.6,110.3L523.9,110.0L516.8,110.8L509.4,108.0L508.6,106.2L519.8,106.3L505.6,103.3L505.4,100.7L506.6,100.0L506.0,98.4L508.8,96.3L510.0,94.4L523.1,90.7L533.1,91.1L527.0,93.9L523.8,96.9L525.6,98.7L527.2,102.3L532.3,104.9L524.1,106.6ZM620.1,39.2L637.3,39.8L627.5,41.3L645.8,39.8L653.7,40.4L653.2,41.0L656.0,41.9L659.4,42.0L665.5,42.4L664.3,43.9L624.4,49.0L642.6,48.9L618.7,54.1L613.5,53.3L611.0,55.1L605.6,55.5L614.1,55.7L610.1,56.6L609.9,57.3L606.2,57.8L591.1,57.0L598.1,57.6L599.0,58.6L597.8,58.9L578.8,59.0L587.2,60.4L591.2,61.5L569.2,61.4L574.0,62.0L583.1,61.8L591.8,63.6L582.8,64.6L586.1,66.1L583.1,67.4L572.0,67.8L571.4,70.4L568.4,71.0L556.2,70.9L551.8,70.1L553.8,71.0L549.5,71.4L551.3,71.8L564.8,72.1L566.8,73.5L571.4,73.3L572.4,74.3L563.9,76.8L556.6,77.6L555.8,77.0L555.1,75.8L550.9,75.6L547.1,74.6L542.1,76.1L538.7,75.8L537.1,76.6L531.1,76.8L524.3,75.7L522.0,76.2L519.0,76.4L513.5,75.3L512.8,74.9L511.7,76.0L507.6,74.9L511.9,73.0L522.5,71.8L515.7,68.9L519.0,68.1L526.5,68.8L533.3,70.8L535.9,70.9L541.2,70.2L546.4,67.7L539.1,70.0L531.4,69.8L531.6,67.3L536.5,66.2L532.9,65.6L526.2,66.9L527.0,65.7L519.1,65.7L519.8,64.6L526.1,62.7L534.2,62.4L543.5,62.8L550.5,61.9L535.9,61.6L540.6,61.2L530.5,57.9L524.7,56.0L525.7,54.3L542.3,55.3L552.9,58.1L559.6,58.2L553.5,57.3L545.5,54.1L578.8,51.2L568.5,50.5L572.5,48.6L553.8,52.6L545.6,52.6L547.1,51.8L531.3,53.2L524.0,52.6L529.5,50.9L535.1,49.9L514.9,52.2L513.9,50.5L528.5,49.8L531.9,48.8L506.2,50.1L507.4,49.2L507.0,48.8L511.2,47.8L515.7,47.4L502.7,48.2L505.9,47.1L503.1,47.0L495.8,46.7L518.2,44.4L521.8,44.9L532.8,44.9L526.4,43.5L534.5,42.4L547.9,44.5L545.9,43.6L548.3,43.7L564.3,45.7L547.4,42.5L550.1,41.7L551.1,41.2L556.6,41.6L554.8,40.6L557.4,40.6L567.9,41.0L561.7,39.6L576.7,40.2L585.0,41.7L583.1,40.8L585.0,39.0L593.7,39.3L601.6,40.6L597.9,39.6L605.6,38.7L612.0,39.8L612.3,38.7L620.1,39.2ZM480.8,102.3L484.0,102.4L484.9,103.4L488.3,104.9L488.7,107.1L488.4,107.5L496.2,111.3L491.7,111.1L491.3,111.8L493.4,112.3L489.0,114.2L495.3,114.8L498.5,114.3L497.8,114.8L502.1,115.3L500.8,117.2L502.0,118.8L502.0,121.0L503.9,122.0L505.7,120.5L507.5,117.4L509.5,116.3L516.4,119.5L517.0,121.9L514.2,122.0L515.1,124.8L520.0,128.1L524.4,126.2L525.4,124.4L528.6,121.6L529.4,119.5L533.8,119.0L532.5,118.6L533.7,117.3L530.7,116.0L530.7,113.1L547.7,114.5L546.3,115.3L548.6,116.0L549.0,116.4L553.7,117.2L551.6,118.5L554.0,119.6L549.9,120.8L547.3,121.3L548.8,122.7L549.8,122.5L550.0,124.2L554.0,126.5L552.0,129.0L541.3,132.6L534.8,129.0L532.4,129.7L535.1,129.6L537.6,131.0L539.2,133.5L533.6,133.1L528.6,131.7L523.3,131.8L524.2,132.9L527.4,134.4L518.0,138.4L505.6,135.0L497.0,135.0L506.2,136.1L515.1,138.7L521.8,139.7L514.1,145.4L510.8,145.8L509.4,145.3L509.4,146.0L504.6,145.2L505.4,146.2L504.7,146.6L503.6,147.9L499.7,148.2L484.8,145.7L485.8,146.8L486.7,146.7L486.8,146.3L492.6,147.8L492.2,148.3L495.5,147.8L501.1,150.9L496.9,152.6L491.6,152.6L494.1,153.9L490.6,154.3L489.8,155.3L490.5,156.1L487.2,155.1L487.8,156.3L486.1,157.5L485.2,157.8L486.2,158.6L482.9,160.2L482.9,161.0L482.2,161.2L479.4,165.3L478.6,165.7L478.0,173.1L477.8,173.7L481.0,175.9L481.0,177.4L483.8,175.2L487.3,175.7L491.3,183.6L489.7,185.5L503.1,184.3L512.4,186.7L520.2,190.9L529.9,193.4L531.9,194.7L531.9,195.1L540.5,194.9L548.2,196.4L547.8,199.3L547.7,201.0L549.0,203.5L548.4,207.8L552.3,211.2L550.9,212.0L553.3,212.4L557.8,215.1L558.3,216.9L556.7,218.1L559.0,217.0L561.3,217.5L564.6,219.8L562.6,218.0L563.1,216.5L565.2,215.7L567.3,217.3L568.2,215.9L567.1,214.4L569.5,211.6L566.1,203.6L567.0,202.9L566.7,201.9L565.7,201.3L563.0,198.1L574.0,194.5L579.9,190.2L580.6,186.8L579.9,183.0L575.2,178.5L569.4,175.7L571.0,173.7L573.6,171.6L574.6,170.1L575.6,170.5L576.2,168.1L574.7,167.8L574.3,166.3L574.6,165.5L575.1,165.2L573.7,164.5L573.1,163.9L571.4,163.6L574.0,159.2L571.9,157.5L571.7,155.3L576.8,154.0L585.4,155.7L586.4,155.5L591.3,156.4L596.9,154.6L602.2,156.5L601.9,158.0L605.0,158.2L605.8,159.0L605.9,159.3L608.2,159.4L607.2,160.4L609.7,161.9L616.2,162.5L617.7,163.5L620.5,163.2L618.6,165.9L618.4,168.2L613.7,168.4L619.1,169.1L620.6,172.0L620.9,172.4L619.4,174.9L618.3,174.2L617.0,175.4L624.9,174.5L626.6,176.2L626.7,178.3L625.8,179.1L624.1,179.7L626.8,178.6L628.6,177.0L628.9,178.1L628.4,178.7L629.9,177.4L630.5,179.1L638.0,175.1L640.1,176.6L639.9,174.8L642.5,173.4L641.4,172.7L643.0,172.1L643.3,171.3L644.9,171.6L642.6,170.5L643.0,169.5L644.6,169.4L644.7,168.4L646.9,166.4L648.4,167.1L646.8,168.3L649.9,168.5L650.0,169.5L651.7,171.4L652.1,172.0L653.7,173.3L651.2,173.8L655.3,173.6L655.5,174.7L655.9,176.5L653.8,177.7L658.3,177.8L655.3,179.5L660.4,179.7L662.7,180.3L661.6,182.0L659.6,182.6L662.9,183.0L662.4,183.9L665.8,185.6L661.8,186.9L659.9,186.7L663.5,187.9L663.8,188.5L664.9,188.9L664.6,189.6L665.9,190.4L665.8,190.9L671.3,192.4L672.1,193.9L670.2,196.0L675.0,194.9L676.2,195.7L674.7,197.0L679.0,195.6L681.8,197.6L685.0,197.7L687.9,198.8L680.5,201.8L674.0,203.1L671.9,204.2L671.3,204.2L672.5,205.1L672.5,205.9L682.7,201.7L685.0,201.4L683.5,200.7L689.1,202.4L688.8,203.6L687.2,204.2L688.9,204.6L693.3,203.6L696.3,205.4L696.6,209.7L694.5,210.2L697.4,210.8L695.8,211.1L697.5,212.4L690.1,216.3L681.2,217.4L670.9,223.1L663.0,223.3L641.0,223.0L636.6,223.5L632.7,226.7L631.4,228.2L627.2,229.2L621.5,232.4L618.6,234.6L612.0,233.3L618.5,235.1L615.5,238.5L608.1,243.0L600.3,246.2L596.4,248.5L593.4,249.7L594.2,250.7L591.6,252.3L597.5,249.9L600.4,246.3L607.8,243.2L615.0,240.6L621.1,235.4L629.1,231.6L638.7,228.9L643.1,228.6L649.7,230.8L648.6,231.2L649.5,232.6L647.3,233.6L643.3,235.6L639.6,234.8L636.1,235.6L641.0,236.5L642.6,237.4L645.0,236.8L646.6,237.5L644.8,240.0L643.8,240.9L646.0,241.5L649.7,245.7L651.8,246.3L651.6,247.1L653.3,247.6L658.1,248.7L658.8,248.8L662.5,247.7L664.0,248.9L666.2,249.8L667.1,250.5L667.3,251.1L654.4,254.5L653.4,254.7L652.2,255.4L650.6,254.8L649.0,255.6L649.0,256.5L642.1,260.6L638.6,257.7L640.0,254.9L639.5,255.0L649.0,250.8L649.6,251.9L649.9,251.7L653.1,250.3L646.2,249.8L648.6,247.9L647.3,247.4L645.9,249.0L639.9,251.3L639.3,250.5L639.3,250.3L636.8,251.7L633.3,251.7L633.0,254.3L629.0,255.6L627.9,255.6L625.8,255.6L625.2,256.6L624.0,256.0L624.0,255.0L620.9,258.1L615.7,260.0L612.7,265.0L613.5,265.9L611.6,267.7L613.8,269.1L615.6,270.9L617.2,270.0L615.9,268.8L617.3,269.6L617.3,271.1L613.5,271.8L611.8,271.9L610.6,272.0L610.6,270.8L609.6,271.0L607.3,273.1L600.3,273.7L595.1,275.8L595.2,274.2L594.6,276.3L593.4,278.0L595.0,278.7L594.3,281.5L594.1,280.9L592.1,284.2L589.4,286.4L589.3,285.1L586.3,283.2L587.2,281.5L588.2,281.1L586.3,282.1L586.2,283.9L588.7,287.7L588.5,288.4L588.9,289.6L583.6,296.2L585.0,291.9L584.2,290.6L584.2,289.8L582.9,290.0L581.9,289.0L583.5,288.3L581.9,287.2L582.5,286.6L581.8,286.1L582.8,285.7L582.7,284.4L583.9,283.9L583.7,283.3L580.3,284.7L581.2,285.8L580.6,286.2L581.1,289.7L580.0,289.2L581.3,291.1L577.5,289.3L576.6,289.0L577.7,287.4L576.4,289.8L578.5,290.7L582.1,292.6L579.1,292.1L578.4,291.6L581.5,294.4L581.3,295.2L580.5,295.7L579.4,294.9L581.7,297.3L579.6,296.2L576.7,295.7L580.0,297.1L581.3,298.0L583.7,298.2L585.9,303.7L583.8,299.4L584.2,302.0L582.8,301.8L579.7,302.6L579.4,302.3L580.1,303.3L583.2,303.7L583.3,304.7L584.4,303.2L585.0,304.3L582.0,306.5L580.1,305.6L578.1,306.0L580.4,307.4L578.7,308.6L578.5,308.8L581.5,309.0L580.7,309.9L575.9,310.7L575.6,310.9L572.7,314.3L572.5,314.3L567.2,316.1L565.4,318.1L565.1,318.1L564.4,319.6L561.7,321.4L561.0,322.0L558.1,322.8L557.7,323.8L556.6,323.4L556.9,324.6L555.0,326.3L553.0,330.6L552.7,332.6L554.9,339.7L557.9,345.5L558.3,348.3L557.6,345.0L557.0,345.3L556.5,344.3L557.3,346.4L560.9,355.9L560.3,360.0L558.0,363.4L554.6,363.4L555.6,363.0L552.3,359.7L550.9,358.3L550.5,355.8L550.6,355.4L549.5,355.2L549.4,353.7L547.9,353.9L546.0,350.6L547.4,348.4L546.3,348.5L545.9,349.4L545.7,346.6L545.6,342.0L536.9,336.3L536.1,337.2L530.9,338.4L530.2,336.8L529.6,336.0L529.3,335.1L528.3,335.5L526.1,334.3L526.7,334.2L525.3,334.0L520.9,334.6L522.0,333.9L521.6,333.6L519.2,335.0L516.3,335.2L517.3,334.7L516.0,332.8L514.8,334.6L510.3,334.6L505.3,335.2L502.7,335.9L505.0,336.3L506.9,335.9L506.4,337.1L507.3,337.1L508.3,336.6L508.1,337.9L506.8,339.3L510.5,341.5L509.5,342.0L508.6,341.9L504.1,339.4L504.7,340.4L503.8,341.7L502.2,340.6L499.4,341.2L497.8,340.5L498.5,340.3L497.8,339.1L496.2,338.9L493.7,337.8L492.3,339.2L489.3,338.7L486.0,337.9L483.3,338.0L482.9,337.7L482.0,338.5L478.3,339.9L479.2,339.1L478.5,338.6L477.9,338.1L477.0,339.3L476.8,340.8L474.8,342.8L470.0,345.1L470.7,344.4L468.4,345.1L468.6,345.6L467.5,346.0L466.9,346.1L466.2,346.8L464.9,347.3L465.3,348.0L464.3,348.7L464.1,349.7L463.0,351.7L461.8,351.9L463.1,352.5L463.5,356.9L464.9,359.3L461.7,370.4L461.0,378.4L462.4,382.6L463.8,384.7L463.3,385.2L463.2,383.7L462.1,383.8L465.0,389.3L469.3,395.2L472.4,399.5L472.3,399.8L476.9,400.8L480.4,403.1L492.6,400.2L494.4,400.4L496.0,401.5L496.9,401.0L497.8,400.0L498.6,398.2L501.1,394.3L502.3,392.6L504.0,386.5L514.8,384.0L520.6,384.6L520.3,384.0L522.3,384.6L522.9,387.1L522.2,388.4L519.2,392.2L519.2,393.8L518.0,395.1L519.4,395.6L518.2,396.9L518.5,398.1L517.3,402.0L516.4,401.5L515.9,401.1L515.8,399.3L514.6,402.1L515.7,403.3L515.1,406.7L514.0,412.5L511.5,416.0L513.2,416.1L514.9,416.7L515.9,416.5L518.4,415.7L523.2,416.4L526.4,415.9L528.7,415.2L532.1,415.7L535.0,415.9L539.9,418.4L538.1,418.4L540.3,419.6L541.2,419.2L542.6,420.4L543.2,421.1L542.2,422.1L543.1,424.9L541.1,430.3L541.1,435.5L540.8,434.2L540.3,435.4L540.4,437.5L539.8,438.6L540.1,440.1L539.6,442.5L543.6,448.7L547.9,452.4L550.5,454.7L550.8,454.2L550.8,453.8L553.5,455.7L556.4,455.1L564.7,451.3L566.6,451.6L574.0,455.1L579.4,460.1L578.6,456.6L582.8,453.0L584.1,452.1L585.8,451.5L586.0,447.6L585.4,447.8L588.5,444.0L592.2,443.3L592.8,443.4L592.2,444.5L592.8,444.3L594.4,441.4L601.9,439.3L608.8,435.2L610.7,436.7L610.0,438.1L606.2,440.6L607.8,443.3L607.9,446.4L606.0,450.9L608.6,454.2L611.2,451.6L611.2,449.8L608.7,445.4L610.1,443.3L616.9,440.3L618.5,440.2L617.7,439.5L616.0,439.2L616.5,436.9L617.7,437.0L619.6,440.6L625.0,441.5L626.5,443.0L629.2,446.2L639.1,445.7L641.6,447.6L645.1,448.5L651.8,446.4L651.7,445.8L649.8,445.3L662.6,445.1L657.4,446.0L658.2,448.3L658.5,448.5L659.9,449.3L660.4,450.1L662.6,449.6L663.6,450.6L664.8,449.7L668.6,453.0L667.4,454.0L664.8,457.0L666.6,457.4L673.2,457.0L680.6,462.3L681.9,465.5L681.2,468.8L682.9,466.4L685.7,468.0L689.1,470.8L689.4,473.3L693.2,471.7L696.4,472.5L697.8,471.4L705.0,471.8L706.8,472.9L706.5,474.6L710.1,473.8L713.9,475.4L716.6,477.6L717.0,477.7L718.4,479.7L718.5,480.3L719.4,479.4L720.7,481.2L722.0,481.3L723.4,484.4L725.7,493.0L727.7,494.9L730.1,497.0L729.8,498.7L724.9,504.0L722.2,506.0L718.1,512.9L716.5,513.8L720.2,512.8L724.7,510.6L725.9,515.2L728.0,515.8L731.8,515.5L732.8,516.1L731.8,519.8L734.2,515.5L737.3,513.4L738.2,513.5L738.1,513.1L738.9,510.8L740.3,509.0L743.8,509.1L744.8,508.6L755.5,513.8L755.9,514.5L757.4,513.5L759.1,515.1L759.8,515.3L759.9,516.9L759.2,518.0L760.9,517.7L760.2,518.5L759.6,522.6L762.1,518.9L763.0,519.8L767.4,518.4L774.3,520.7L778.2,521.5L786.8,521.8L794.7,526.8L802.6,532.7L805.8,533.5L811.4,534.5L814.7,545.9L814.2,550.4L810.3,558.5L808.9,559.8L805.7,563.9L801.4,567.8L800.4,569.0L799.9,568.9L797.0,575.0L794.5,577.8L792.6,576.5L792.4,577.1L791.0,581.1L791.4,595.8L790.0,602.2L789.6,605.2L787.0,609.6L786.4,615.3L779.7,625.7L779.3,628.9L774.4,631.7L773.6,633.7L768.6,633.7L767.4,632.6L766.6,634.0L763.3,634.4L764.8,633.9L762.8,633.7L759.3,634.7L759.6,635.8L756.3,637.3L754.5,638.6L748.3,640.3L745.5,642.4L740.9,645.6L739.3,647.5L739.1,647.0L738.1,647.0L737.5,647.8L736.8,648.0L737.6,649.9L736.9,650.2L737.2,651.9L736.7,652.8L737.3,658.0L737.0,663.3L734.9,666.0L729.3,672.2L724.3,680.4L717.8,684.9L718.2,683.5L722.9,680.9L723.2,679.4L725.6,675.7L726.4,675.1L723.6,674.8L722.2,674.1L722.8,675.6L722.1,677.3L719.8,680.3L718.3,681.7L717.1,684.4L717.2,685.8L713.9,691.7L710.0,694.9L706.9,698.7L705.5,699.5L700.9,700.8L696.5,700.3L694.4,700.8L687.1,698.3L685.3,698.3L682.2,693.0L682.9,690.9L684.1,689.6L683.3,687.7L683.4,690.2L682.0,691.8L681.6,694.4L682.1,697.2L681.9,698.3L689.3,704.2L688.3,707.2L690.5,709.0L691.9,709.4L689.7,715.1L683.6,720.7L675.1,722.7L663.0,723.6L660.0,723.0L660.9,725.3L661.1,726.0L661.4,728.5L659.7,731.4L660.4,734.0L657.6,735.3L650.2,735.1L645.7,733.5L644.5,734.4L645.8,741.6L649.4,743.0L650.5,742.2L650.4,741.7L652.4,741.5L652.9,744.9L649.7,744.9L647.2,743.6L645.1,744.9L648.8,746.4L645.4,747.9L643.7,749.8L643.7,753.9L641.4,756.4L641.0,757.5L637.7,757.7L632.6,760.7L630.6,764.0L631.9,766.2L636.0,769.0L641.0,770.2L640.3,772.7L638.7,773.5L640.2,774.2L630.2,781.3L627.6,786.1L625.7,785.4L624.7,784.4L623.3,785.4L624.2,785.5L625.8,786.6L622.6,788.4L620.9,791.4L622.0,791.7L621.6,794.3L620.5,794.6L623.3,795.2L626.0,798.8L620.3,798.3L618.6,799.6L612.5,801.8L611.1,807.0L609.1,807.1L603.9,805.0L604.3,803.8L606.8,804.0L606.6,805.3L607.5,803.7L610.6,801.9L609.4,801.1L603.4,803.8L601.9,804.7L600.4,803.4L602.2,801.0L607.9,799.9L601.6,800.0L598.5,802.7L598.4,801.0L599.4,799.5L598.2,800.1L594.6,800.0L593.7,797.5L596.2,798.0L596.7,797.2L599.6,797.5L601.9,796.6L602.7,798.2L602.2,798.9L603.1,798.0L603.1,796.2L603.0,795.1L599.7,793.6L600.8,796.0L597.1,796.6L594.4,794.4L595.4,793.0L594.1,792.3L589.3,790.5L590.1,789.4L590.8,788.6L591.6,787.7L595.9,790.8L596.5,788.8L594.2,789.6L594.6,788.2L592.3,785.9L594.7,785.2L593.0,784.0L593.5,783.2L595.4,782.9L594.3,782.0L594.6,780.1L593.1,782.5L592.8,781.9L593.5,777.2L593.8,776.7L592.0,776.4L592.5,774.4L597.6,774.9L596.2,772.4L594.3,774.1L592.8,774.0L591.5,772.2L593.7,771.9L592.5,770.6L593.6,769.2L592.2,767.4L590.9,768.0L589.0,767.0L589.1,766.0L586.0,767.2L586.4,768.4L585.5,766.5L589.2,763.7L590.5,762.1L594.2,761.5L594.2,760.1L595.2,759.8L595.7,760.3L594.3,763.9L592.7,764.5L595.2,763.4L596.5,762.3L595.1,766.3L596.1,765.9L597.1,761.9L596.0,761.0L597.3,760.2L599.3,759.5L600.7,759.8L598.4,757.4L602.3,754.3L599.0,752.3L599.8,748.8L600.7,747.5L601.8,746.2L601.7,743.5L602.0,743.0L602.0,741.9L603.4,741.8L602.5,740.7L601.6,739.8L604.0,737.9L602.6,738.9L600.3,738.1L597.5,739.5L596.3,739.2L596.4,738.3L594.9,734.9L597.7,728.6L597.7,721.7L596.8,714.0L599.4,712.9L602.8,704.2L605.0,700.9L606.4,695.9L608.0,693.1L608.0,690.3L609.0,687.6L607.9,675.2L609.7,673.0L609.8,670.2L608.8,666.9L610.7,662.5L613.5,652.2L613.7,648.3L614.7,646.2L614.2,641.5L614.9,637.0L614.0,635.0L615.8,631.6L616.8,624.8L614.9,607.9L609.6,603.9L607.3,601.5L601.5,598.2L588.1,591.0L583.5,586.3L581.8,582.6L581.2,578.6L578.0,573.6L577.1,571.9L576.2,569.7L574.4,567.8L567.1,552.2L560.5,542.3L554.5,538.3L556.2,537.3L555.8,535.7L553.9,529.3L557.4,525.4L561.6,522.3L562.5,518.9L561.7,517.0L561.2,519.5L560.8,518.4L559.0,520.0L556.2,517.0L556.4,514.2L556.4,510.5L558.3,508.8L559.1,508.5L559.0,508.3L559.3,505.9L561.0,502.7L560.9,500.3L567.7,497.7L567.0,495.2L569.2,494.2L569.3,491.4L573.4,489.6L577.2,483.1L576.6,482.3L575.5,482.2L575.1,481.1L576.2,478.2L576.1,473.2L576.0,471.4L575.3,469.7L575.5,467.5L570.3,459.7L571.7,458.0L573.2,458.9L571.4,457.6L570.2,457.6L569.9,457.8L568.8,456.1L566.2,454.5L563.9,454.7L560.4,458.1L558.5,459.3L560.7,463.2L556.1,464.2L555.0,460.8L553.4,461.9L550.7,459.2L545.5,458.4L544.6,459.1L541.6,456.1L542.2,457.8L540.2,456.7L540.8,454.7L539.3,452.9L535.0,450.9L532.9,448.2L531.6,447.4L533.0,450.6L532.4,451.2L529.2,449.1L528.4,446.7L529.0,444.5L528.1,443.7L528.4,442.2L518.1,432.2L519.9,432.2L518.5,429.9L517.1,429.9L515.2,431.1L512.5,430.6L511.4,430.5L501.6,426.8L495.8,425.8L482.1,414.4L480.3,413.6L479.9,414.2L477.3,413.1L477.8,413.8L477.2,414.0L466.8,416.8L459.3,414.1L443.3,408.1L437.7,404.2L428.8,401.3L424.9,398.3L420.6,395.9L417.8,392.4L417.2,390.3L419.5,389.2L418.3,388.0L419.6,385.8L418.4,383.7L415.5,377.2L409.1,370.2L405.5,367.7L406.8,368.3L406.5,367.5L404.0,366.4L402.6,364.3L403.5,364.2L399.3,361.7L398.0,361.8L398.8,360.8L396.2,360.6L396.4,358.3L397.6,357.4L395.7,355.1L393.7,354.8L391.2,352.6L389.9,351.3L388.5,348.4L385.6,347.2L383.0,344.7L377.3,336.0L375.5,331.4L375.5,329.9L372.4,328.4L370.6,327.5L368.9,327.9L365.3,326.3L367.2,336.5L376.7,345.9L378.5,349.8L381.5,353.4L382.9,355.9L382.7,354.2L384.1,355.9L386.3,361.5L389.0,365.9L389.7,369.1L391.0,369.6L392.6,369.4L396.1,373.7L394.9,375.5L392.3,375.9L389.2,371.8L380.9,365.1L381.0,361.4L378.6,357.6L375.3,355.1L374.8,354.3L372.0,354.7L364.5,349.0L368.7,348.8L369.6,349.4L369.3,347.8L369.5,344.5L364.8,340.1L360.5,337.0L357.4,331.2L355.4,327.1L354.4,325.5L349.1,316.8L345.7,315.0L344.5,314.0L341.0,313.3L338.3,312.0L333.2,310.5L332.7,307.7L325.9,300.6L326.1,297.7L323.2,295.3L322.6,293.7L323.3,293.2L324.9,294.5L323.7,291.7L327.5,291.3L322.7,291.2L322.2,292.5L319.8,291.7L319.9,290.2L315.8,285.5L314.9,281.3L312.1,277.8L313.6,271.5L311.4,264.1L313.5,257.8L314.4,247.8L314.4,245.6L318.4,246.0L314.0,244.8L314.1,244.0L314.7,243.9L314.5,242.9L314.3,241.4L313.3,241.2L311.6,236.9L310.3,234.8L310.7,233.6L318.2,235.0L321.1,235.0L321.1,237.1L319.2,239.3L322.6,236.7L322.2,238.3L322.1,239.7L320.3,239.7L320.3,240.5L322.1,240.3L323.5,239.1L323.2,236.7L324.0,235.4L322.5,234.8L322.7,233.6L321.7,233.1L322.6,232.7L322.3,231.3L318.8,228.8L320.0,228.2L318.2,228.0L318.0,226.8L315.0,227.3L313.9,226.3L315.9,226.4L314.8,224.6L315.4,223.8L314.6,223.4L314.5,224.5L312.6,225.7L309.8,224.0L309.0,221.4L309.0,219.9L308.3,221.6L305.9,221.7L305.5,220.9L304.7,221.8L300.5,221.4L303.5,220.5L300.1,220.4L300.7,219.7L299.8,219.0L295.9,219.3L293.4,217.3L295.8,215.2L297.2,214.8L294.2,215.7L293.4,216.1L292.5,214.2L292.6,213.3L293.6,211.8L296.0,211.0L298.8,212.6L296.3,210.2L297.7,209.0L297.3,208.5L296.8,209.7L292.3,212.4L290.7,213.2L291.6,211.4L291.6,210.2L290.7,209.7L291.2,208.1L288.8,206.8L285.5,204.0L287.0,203.9L287.1,204.5L292.1,205.8L287.6,203.9L288.1,202.5L285.0,204.0L284.6,205.4L282.3,205.7L279.2,202.7L281.7,201.1L281.7,200.7L278.3,200.0L278.6,198.3L282.6,193.9L281.6,193.4L280.0,195.8L280.1,191.7L279.6,195.6L278.6,197.4L277.3,197.7L275.3,196.7L274.7,195.4L275.9,194.5L274.5,190.5L273.3,190.7L270.4,191.6L269.4,193.4L268.5,193.0L268.4,192.0L270.8,189.9L270.2,189.5L264.7,185.6L264.2,184.9L261.3,183.3L260.2,181.4L261.3,181.1L262.5,180.3L260.9,180.0L259.5,180.4L257.8,178.8L258.6,176.7L256.7,178.2L252.8,175.9L250.2,172.0L250.3,173.5L251.7,178.2L247.5,177.0L247.3,174.5L246.0,174.2L245.2,175.1L241.5,174.1L241.1,174.7L243.7,175.1L246.6,177.4L243.0,178.1L231.7,172.9L225.6,170.9L227.2,169.9L227.3,168.5L228.5,170.5L229.1,169.2L228.7,168.9L227.1,168.2L220.8,169.9L217.2,168.4L216.5,167.7L212.6,168.1L201.1,168.1L197.2,165.8L197.9,164.6L194.2,166.2L191.8,165.4L189.9,164.6L187.7,164.2L187.8,163.6L188.6,162.0L179.6,163.0L180.8,161.5L177.4,162.5L177.9,163.1L177.3,163.7L176.4,163.8L178.0,164.9L176.1,165.6L179.6,165.8L176.9,168.5L171.6,167.8L170.5,169.6L169.5,169.1L166.9,170.7L164.8,170.9L162.9,172.6L157.7,172.5L158.0,171.7L162.4,169.6L159.8,170.3L158.3,168.8L161.0,165.7L163.0,163.6L166.4,162.6L173.5,163.4L168.2,161.6L171.5,159.9L170.0,160.1L167.7,161.2L163.0,161.6L158.6,163.2L158.3,164.2L153.4,167.0L151.3,166.7L152.8,168.8L151.3,169.4L150.2,170.2L147.7,170.4L145.2,173.3L149.6,174.5L148.0,175.9L144.3,177.9L144.3,178.7L139.7,180.0L132.0,183.3L132.0,184.6L130.7,185.1L120.4,188.9L121.0,190.2L120.6,190.4L119.9,189.9L115.4,191.7L114.8,192.2L114.1,192.8L113.3,191.7L104.5,194.3L104.3,193.4L105.4,193.2L103.3,193.1L100.1,195.6L98.4,196.0L97.4,195.2L96.4,196.7L94.7,196.2L93.5,197.1L94.7,195.3L105.4,190.7L107.3,190.9L107.4,192.1L107.9,192.1L108.9,191.5L110.7,191.7L109.3,190.4L111.4,188.6L118.3,186.0L119.7,186.1L120.2,184.5L122.2,183.2L124.9,182.1L126.4,182.3L125.2,181.0L125.9,178.8L127.2,178.2L126.5,176.7L129.0,175.4L129.3,174.0L121.7,176.0L121.1,173.9L122.2,173.7L120.2,174.0L119.1,174.5L117.4,176.9L113.7,174.5L111.4,174.5L109.3,173.9L102.4,176.1L101.0,175.7L102.2,174.5L102.2,173.3L101.4,171.9L101.5,169.9L99.4,165.8L100.6,164.4L97.9,167.0L96.9,168.4L90.3,169.4L83.5,165.4L84.1,164.2L85.9,163.4L88.0,164.7L88.0,164.9L90.1,164.1L92.4,164.6L92.5,163.9L90.7,163.4L91.7,163.1L89.8,163.5L83.2,162.9L84.5,162.1L82.4,161.4L82.3,161.2L81.5,162.2L80.6,161.8L79.7,160.0L78.8,159.6L77.6,159.4L78.4,158.5L78.6,158.0L80.2,157.5L81.7,155.4L83.5,154.2L85.3,154.2L85.9,153.3L85.0,152.6L85.5,151.7L87.7,151.2L87.2,150.5L89.2,150.0L91.8,151.0L91.7,151.2L95.0,151.1L99.9,148.5L107.0,147.8L107.5,146.3L105.4,143.7L104.3,142.9L107.2,142.4L107.2,141.4L105.6,140.7L101.7,141.7L96.5,143.8L93.7,142.5L94.8,143.2L93.9,143.2L76.7,142.4L75.9,141.4L75.5,140.5L73.5,139.4L77.4,138.6L67.4,137.1L67.3,136.2L77.4,133.7L80.9,133.9L81.6,132.4L89.5,131.2L90.8,131.4L94.4,134.2L103.5,133.3L104.7,133.3L106.2,133.0L101.6,131.9L97.6,129.6L99.6,129.5L104.7,131.9L110.9,131.8L106.3,131.0L102.8,131.0L102.5,129.5L101.2,128.8L91.3,128.0L82.0,123.2L74.9,121.2L77.0,120.2L81.3,118.6L88.9,118.1L94.0,115.9L99.0,111.7L102.1,110.6L101.0,111.3L108.6,109.9L112.0,108.9L112.7,110.4L113.0,110.4L114.0,109.5L113.6,109.2L116.1,107.3L116.8,107.6L117.4,107.9L125.7,106.9L132.4,104.4L135.7,105.6L136.7,106.3L134.4,107.2L135.4,107.5L140.6,106.1L141.8,107.0L142.5,107.5L146.3,107.3L155.8,107.7L154.9,108.7L158.2,109.2L161.5,109.9L174.8,109.8L199.7,112.0L209.3,112.0L216.9,114.2L231.8,116.1L251.2,119.5L247.2,118.0L248.8,117.7L248.6,116.1L255.4,114.8L256.8,114.1L258.4,115.4L258.4,116.1L267.0,114.1L267.5,113.6L274.8,112.3L277.8,111.4L283.1,111.8L275.2,114.3L268.6,115.6L261.4,118.7L262.6,119.1L266.3,118.5L265.0,118.0L266.3,117.0L271.4,115.3L274.9,115.4L275.4,116.2L283.0,113.2L286.8,112.4L285.4,113.6L287.8,113.3L291.2,111.3L291.9,110.6L290.8,109.5L292.6,109.1L297.8,111.9L301.6,114.8L306.4,115.9L307.7,115.1L306.7,114.1L308.0,113.3L309.4,112.2L308.9,112.0L311.4,111.4L312.3,113.7L313.4,114.2L311.6,115.6L313.6,115.8L317.2,115.5L320.1,113.2L326.9,113.4L337.5,115.9L352.8,118.4L358.7,118.6L358.2,118.0L361.2,118.0L366.9,119.3L370.2,121.7L363.7,122.9L363.1,124.2L364.7,124.5L379.1,125.2L392.5,123.6L397.1,125.0L398.4,125.5L399.4,126.6L400.7,125.7L404.4,127.9L402.8,128.8L401.4,128.7L408.1,132.3L405.5,130.4L405.5,129.1L408.2,129.2L404.6,124.3L405.3,123.3L412.8,121.8L416.5,120.0L402.2,122.6L400.4,121.3L405.3,119.8L416.4,118.6L419.7,121.6L424.5,123.2L430.2,123.1L436.5,124.9L447.7,124.4L455.6,124.9L457.8,124.4L456.1,123.4L457.1,123.2L464.2,125.3L463.8,124.0L459.0,123.9L457.3,122.7L457.6,122.3L457.0,121.4L460.6,120.9L462.1,120.7L467.8,122.0L468.9,121.8L468.0,123.2L471.1,122.6L470.1,126.8L471.3,127.5L473.0,127.4L473.4,127.9L474.7,128.4L474.4,129.1L469.3,129.1L472.8,130.8L471.5,129.3L475.0,129.2L475.3,127.0L474.6,123.2L479.8,122.4L484.8,119.9L483.2,117.9L481.3,119.2L479.4,118.3L482.1,117.1L481.0,116.5L481.7,115.9L484.7,115.6L485.0,116.2L485.2,115.7L483.7,115.0L480.7,115.2L478.8,114.1L470.7,112.9L468.2,111.0L469.4,109.6L471.4,108.9L471.9,108.3L469.3,108.4L468.2,107.2L468.5,105.8L471.4,104.3L474.4,104.0L472.2,103.3L477.6,101.2L479.8,101.5L480.8,102.3ZM557.0,209.0L550.2,206.9L556.1,207.4L557.0,209.0ZM596.9,124.7L591.6,124.4L590.7,123.2L597.8,123.5L596.9,124.7ZM573.0,148.9L574.6,150.4L572.2,150.7L569.5,149.0L573.0,148.9ZM549.9,151.8L547.7,154.2L543.9,156.0L540.3,156.1L539.2,154.6L542.7,151.9L549.9,151.8ZM563.7,154.8L565.0,156.5L562.7,159.3L559.6,157.9L559.8,156.3L561.5,154.9L563.7,154.8ZM423.3,72.1L418.7,71.5L415.0,68.8L420.4,69.9L423.9,71.5L423.3,72.1ZM474.2,68.5L486.3,69.4L484.0,70.3L471.0,70.1L469.8,69.4L470.5,68.9L474.2,68.5ZM455.7,56.2L455.4,57.6L453.3,57.4L448.2,55.9L454.4,55.5L455.7,56.2ZM505.9,71.4L498.6,70.8L498.6,69.5L505.9,70.2L506.7,71.0L505.9,71.4ZM485.1,84.0L484.7,86.1L478.6,86.2L468.0,83.8L472.2,81.5L478.9,80.7L484.4,82.6L485.1,84.0ZM393.8,63.7L396.5,64.8L394.4,65.6L374.4,65.4L390.5,63.1L393.8,63.7ZM346.0,80.9L340.5,80.4L350.6,78.0L346.0,80.9ZM419.2,95.8L410.6,92.0L420.2,91.2L423.1,92.1L422.0,94.4L419.2,95.8ZM448.9,90.1L454.3,91.2L462.5,90.4L465.7,91.4L462.3,92.7L463.0,93.5L457.7,95.7L463.1,95.4L465.3,97.0L465.4,97.4L468.6,97.5L468.4,98.8L466.9,99.2L468.0,100.0L467.1,100.8L466.0,102.2L459.1,102.9L457.9,102.0L457.8,104.7L453.2,104.4L444.9,100.0L438.9,99.1L433.7,96.7L434.8,95.4L437.6,95.0L442.8,97.0L446.4,96.5L446.8,95.5L448.4,95.7L446.1,94.1L448.9,94.0L446.1,93.6L440.7,93.0L440.4,92.6L444.1,92.2L446.0,92.8L443.8,90.9L449.4,90.6L447.6,90.4L448.9,90.1ZM533.5,138.8L537.2,138.2L550.3,142.7L551.7,145.1L551.5,145.8L557.2,145.7L559.4,147.2L554.5,148.8L547.6,147.4L546.7,146.1L541.5,145.3L538.5,147.8L534.2,150.1L530.3,150.7L528.5,147.5L520.8,148.2L522.5,146.3L526.0,144.9L525.5,142.2L527.3,136.7L529.1,135.3L532.3,136.4L532.7,137.8L533.5,138.8ZM585.4,121.6L588.8,122.7L587.4,126.8L578.3,127.7L576.2,125.2L580.2,121.9L585.4,121.6ZM563.7,91.7L577.3,92.9L582.5,96.3L561.5,96.2L559.5,94.0L556.5,93.3L556.5,91.2L563.7,91.7ZM461.8,75.9L462.3,78.3L461.8,79.7L460.9,80.0L463.4,81.1L463.7,81.8L460.9,82.7L461.2,83.5L459.6,83.2L459.4,84.0L446.2,83.1L446.8,82.5L447.3,81.6L449.4,80.3L433.6,80.6L438.0,79.2L443.2,79.7L438.4,78.1L438.2,77.2L437.1,76.7L439.5,76.0L450.2,79.0L448.4,77.8L449.9,77.6L446.6,77.1L448.4,76.6L445.7,75.3L452.7,75.6L454.7,75.5L457.2,74.8L461.8,75.9ZM429.7,60.0L434.0,61.2L434.3,62.0L434.9,62.3L441.6,61.8L443.1,62.2L443.7,62.9L450.1,63.9L451.0,64.3L450.2,65.1L451.3,65.8L454.2,67.5L447.3,68.3L441.6,66.2L433.6,65.8L428.3,65.5L421.5,65.1L421.3,64.2L422.4,64.1L429.3,64.0L426.8,63.6L429.8,63.1L425.4,62.9L427.1,62.2L424.2,62.0L421.0,62.7L421.4,61.4L417.6,61.4L418.7,59.9L429.7,60.0ZM494.4,49.8L502.0,52.9L509.7,53.4L510.5,55.0L513.2,55.4L514.8,55.2L512.6,54.5L513.3,53.8L518.2,54.2L517.0,55.4L517.0,55.6L521.6,57.2L520.5,58.5L526.1,58.2L527.7,59.0L530.2,58.7L532.0,60.4L521.7,62.3L517.0,63.4L516.5,62.2L517.2,61.5L515.6,61.9L514.9,63.7L516.0,64.6L512.2,64.3L512.6,65.5L510.8,66.3L504.6,64.3L507.4,66.4L501.5,65.5L501.6,66.5L494.3,66.0L489.2,64.9L494.1,64.2L486.0,63.7L485.0,63.0L486.3,62.8L482.8,61.5L495.5,59.7L488.0,59.3L475.2,59.7L473.8,58.6L479.3,57.7L471.3,57.8L467.9,56.2L472.6,55.7L479.1,55.8L479.2,55.0L473.3,54.8L469.2,54.2L473.5,53.9L470.6,52.2L472.9,52.0L482.4,52.8L474.1,51.3L479.6,50.3L486.8,49.8L481.5,48.6L491.5,48.9L494.4,49.8ZM480.9,73.4L487.0,74.3L485.8,75.9L489.8,75.2L498.7,74.8L501.5,75.9L497.5,76.1L509.4,77.1L497.8,77.7L509.5,79.9L508.7,81.0L511.3,81.6L511.8,80.5L513.0,80.5L528.0,81.7L529.8,80.9L540.1,79.6L551.9,79.7L563.4,82.0L561.2,83.5L559.6,84.2L563.9,84.8L559.3,84.9L560.0,85.4L554.2,86.6L549.5,87.1L544.4,86.5L543.4,85.2L541.2,84.8L542.1,86.0L540.8,86.6L534.9,86.9L513.4,86.9L513.8,85.3L512.4,85.3L505.9,86.7L499.6,85.6L498.7,85.6L495.7,85.9L493.2,84.5L492.6,83.1L491.4,82.2L493.4,80.5L492.7,79.4L487.1,76.5L474.4,76.5L471.3,75.7L472.0,75.4L466.3,74.3L468.9,74.0L467.5,73.0L473.4,72.6L480.9,73.4ZM470.2,64.4L477.6,65.3L476.4,66.3L476.5,67.4L465.5,68.3L464.5,66.8L465.6,66.5L459.7,65.2L458.3,64.5L459.6,64.0L458.2,63.0L464.8,63.1L470.2,64.4ZM390.2,66.8L394.6,67.3L388.0,68.3L392.1,69.4L387.8,70.6L377.9,70.5L374.8,69.8L374.4,68.3L390.2,66.8ZM361.6,70.9L357.5,72.4L359.6,73.5L357.8,73.6L359.2,74.7L353.4,75.8L351.6,77.0L347.8,76.1L348.9,74.0L347.5,74.2L343.3,75.8L344.3,76.7L341.8,77.9L338.6,77.0L338.2,78.0L339.3,78.7L335.8,79.4L334.1,79.3L331.9,77.5L329.3,78.7L322.5,78.8L321.9,77.6L320.5,77.6L323.4,76.3L329.9,75.1L343.3,71.1L354.6,71.0L353.8,70.1L357.1,69.9L361.6,70.9ZM402.4,78.2L405.6,78.7L404.3,79.7L408.8,79.2L410.1,80.3L411.4,79.6L410.5,78.8L412.3,78.3L417.4,78.9L417.9,80.6L414.7,83.7L407.0,84.4L398.4,84.1L375.8,87.5L369.4,86.6L369.6,85.5L384.3,83.9L386.1,82.7L371.5,83.7L371.4,82.5L372.6,81.9L370.0,81.8L368.7,82.8L367.5,82.7L368.3,83.4L365.5,84.2L362.0,83.6L358.3,83.9L350.2,82.5L352.6,81.5L364.1,80.3L353.3,80.1L361.3,79.1L355.4,78.8L356.6,77.8L365.4,77.5L360.1,76.9L366.0,75.7L369.5,76.2L373.9,77.2L379.7,78.2L382.3,79.1L382.2,79.5L384.6,79.9L387.8,81.1L398.4,81.3L393.9,79.3L395.8,78.4L395.7,77.7L391.0,76.3L400.9,74.3L401.1,76.1L403.0,77.4L401.7,78.1L402.4,78.2ZM487.2,88.9L494.5,89.7L501.5,90.0L502.4,91.2L496.8,94.2L492.5,96.9L481.7,96.9L485.1,98.5L481.7,101.0L476.0,100.0L473.5,95.7L473.7,91.3L478.7,91.6L476.2,90.4L477.1,89.5L487.2,88.9ZM463.3,114.2L470.3,116.4L473.7,118.8L475.3,118.9L465.7,120.4L461.8,119.9L458.0,118.7L451.7,118.1L454.0,117.0L457.6,115.8L457.4,114.6L459.2,115.0L458.4,114.0L459.7,113.2L462.3,113.3L463.3,114.2ZM367.4,97.7L373.1,97.1L374.8,95.5L379.0,95.7L385.8,97.2L382.9,99.1L384.1,99.0L391.6,97.2L389.9,95.4L395.0,96.1L400.1,98.2L403.2,102.7L405.2,103.1L406.6,100.9L402.9,94.4L404.1,94.1L405.6,93.5L414.8,95.0L418.5,96.7L421.9,101.5L424.4,103.8L425.5,107.0L430.4,109.0L432.0,109.3L433.5,109.3L439.7,110.7L441.9,111.4L443.0,111.6L443.6,113.8L436.4,113.1L434.5,113.9L433.5,114.8L429.4,114.2L431.9,115.4L431.5,116.6L437.4,115.2L437.7,116.5L438.9,117.1L431.1,118.8L419.9,118.1L419.4,117.3L413.7,116.7L412.9,115.5L411.0,115.5L404.8,118.1L393.0,119.9L374.6,120.4L372.6,118.1L369.9,116.4L356.1,115.4L352.8,113.2L352.7,111.7L369.4,110.5L383.1,110.2L370.5,108.3L346.4,107.2L346.4,106.4L348.9,105.7L362.8,103.7L346.8,104.2L348.5,102.9L342.3,102.1L344.6,100.1L346.7,99.4L345.3,98.3L347.1,97.4L361.6,94.2L368.6,93.5L369.4,93.9L369.7,96.2L367.4,97.7ZM338.1,89.1L341.3,88.7L341.8,89.7L346.8,88.3L352.4,88.8L362.4,92.8L341.8,97.4L338.0,99.6L335.6,100.3L331.4,104.1L324.6,105.1L318.7,105.9L310.0,101.9L304.2,100.9L308.7,97.6L309.0,96.2L311.1,95.6L310.6,94.2L315.4,91.0L312.8,90.0L317.2,87.3L330.3,87.0L338.3,88.9L338.1,89.1ZM479.6,80.0L477.6,78.9L479.9,78.7L480.8,79.8L479.6,80.0ZM567.1,189.3L565.4,191.5L565.5,189.8L563.8,191.5L563.9,190.3L563.6,190.1L561.1,191.2L564.0,188.5L564.2,187.8L564.5,189.2L565.3,187.4L567.1,189.3ZM561.2,189.6L561.1,189.0L563.2,188.6L561.2,189.6ZM466.9,95.7L465.2,95.0L465.6,94.5L467.9,95.2L466.9,95.7ZM458.6,90.5L452.2,90.3L461.8,89.2L458.6,90.5ZM589.8,121.5L587.1,119.9L589.8,120.4L589.8,121.5ZM646.3,154.0L648.2,154.8L645.5,154.5L646.3,154.0ZM627.1,167.0L626.5,166.3L628.0,165.0L629.3,166.1L627.1,167.0ZM615.3,154.0L612.5,153.5L610.9,152.2L615.2,153.4L615.3,154.0ZM646.2,160.7L643.4,159.0L647.0,159.7L646.2,160.7ZM628.9,114.8L627.9,114.1L629.3,114.5L628.9,114.8ZM564.3,113.4L564.5,114.0L561.8,114.4L561.3,114.7L560.8,114.9L556.7,113.8L564.3,113.4ZM572.2,113.8L570.6,114.7L567.9,114.9L572.2,113.8ZM565.5,118.7L564.7,118.1L569.0,115.8L570.7,116.4L565.5,118.7ZM578.0,117.0L575.8,116.3L576.2,115.5L579.8,115.8L578.0,117.0ZM645.1,157.8L645.9,158.6L644.0,157.7L645.1,157.8ZM522.3,111.6L524.5,112.0L522.6,112.3L520.0,111.6L522.3,111.6ZM540.2,135.8L543.0,136.4L542.1,136.7L537.9,135.4L536.1,134.1L540.3,135.1L540.2,135.8ZM524.1,124.9L522.3,124.2L522.1,122.8L524.2,121.8L525.2,124.1L524.1,124.9ZM534.9,137.1L532.3,135.7L532.9,134.5L535.3,136.6L534.9,137.1ZM436.4,78.5L437.4,79.0L432.4,79.9L430.7,79.5L427.7,79.2L426.5,78.3L424.5,77.5L434.4,77.0L436.4,78.5ZM442.0,75.3L440.4,75.0L443.9,74.4L444.7,74.9L442.0,75.3ZM426.3,75.3L431.6,76.3L424.2,76.5L423.6,75.0L426.3,75.3ZM432.0,66.5L430.6,66.3L433.0,65.9L432.0,66.5ZM439.4,69.0L435.1,68.6L435.2,68.0L442.6,68.4L441.0,68.9L439.4,69.0ZM506.5,75.7L503.4,75.3L502.1,74.1L506.5,74.3L506.5,75.7ZM470.9,81.3L466.2,82.0L465.8,81.3L470.5,80.7L471.5,81.1L470.9,81.3ZM371.3,68.7L364.8,67.8L365.3,67.5L368.7,67.0L372.5,68.4L371.3,68.7ZM330.6,80.0L330.9,79.4L331.7,79.1L330.6,80.0ZM372.8,74.4L366.7,73.8L372.0,73.7L372.8,74.4ZM425.8,84.0L421.5,83.3L424.5,81.8L426.9,82.0L428.3,83.4L425.8,84.0ZM698.8,215.8L695.5,217.4L696.9,217.9L696.5,219.4L691.6,224.6L691.5,226.4L694.9,223.9L695.4,224.5L698.4,224.8L695.1,226.6L696.4,226.4L695.5,227.5L699.3,227.4L699.8,227.9L700.2,227.4L699.5,229.6L704.4,227.1L704.8,227.9L709.4,228.6L706.4,231.3L708.6,232.0L706.4,233.5L712.5,232.5L709.5,234.7L708.7,235.3L708.2,235.6L708.9,235.8L707.9,237.2L709.2,237.6L712.1,235.3L713.3,235.1L711.7,238.5L714.0,237.0L714.5,238.6L712.0,243.2L709.2,243.1L709.0,240.5L706.6,242.3L706.0,241.7L707.7,238.7L705.8,236.5L703.8,239.2L703.8,238.7L700.9,240.3L699.1,241.8L696.6,242.0L696.7,240.9L702.0,237.7L695.3,238.3L696.7,236.9L696.2,236.8L690.4,238.1L682.2,237.4L677.1,237.1L679.2,234.8L681.8,232.8L678.6,232.1L679.6,231.8L680.7,232.2L682.5,229.5L684.3,230.0L684.0,228.8L683.5,227.6L685.7,227.2L686.2,224.3L688.1,221.2L688.7,220.8L690.3,218.7L692.3,216.8L696.3,215.7L698.8,215.8ZM447.7,118.9L445.4,119.1L445.5,117.8L447.3,118.1L447.7,118.9ZM447.2,109.4L445.3,108.5L447.1,109.0L447.2,109.4ZM474.1,114.6L474.8,115.2L473.7,115.9L473.0,115.6L472.4,114.7L471.5,115.4L472.5,114.3L474.1,114.6ZM442.3,115.6L441.5,114.6L443.0,115.3L442.3,115.6ZM438.5,120.2L436.1,119.5L439.0,119.1L438.5,120.2ZM423.4,121.2L420.9,120.2L423.8,120.6L423.4,121.2ZM404.6,126.8L403.2,126.1L403.7,125.3L404.6,126.8ZM1134.4,166.3L1135.2,166.8L1134.9,167.4L1134.1,166.6L1134.4,166.3ZM1120.9,111.0L1122.3,111.8L1120.8,111.6L1120.4,110.7L1120.9,111.0ZM1141.5,107.6L1137.1,109.1L1134.4,108.5L1141.5,107.6ZM1126.6,111.7L1124.5,111.4L1126.8,111.1L1126.6,111.7ZM1153.6,105.8L1156.6,106.6L1153.0,106.5L1152.7,106.1L1153.6,105.8ZM1142.5,109.1L1139.9,110.6L1138.6,109.9L1142.5,109.1ZM1087.8,122.0L1087.9,122.5L1084.1,123.0L1087.8,122.0ZM1082.8,124.2L1082.3,123.9L1083.3,123.0L1083.5,123.4L1082.8,124.2ZM1108.2,114.5L1111.3,115.3L1109.7,116.9L1104.4,117.3L1105.4,116.8L1105.9,115.6L1107.6,115.5L1106.8,115.0L1108.2,114.5ZM1118.0,111.8L1119.1,112.7L1113.3,114.7L1111.5,114.3L1114.9,113.2L1117.8,110.8L1118.0,111.8ZM1098.4,120.3L1101.1,118.7L1102.8,119.4L1099.3,121.3L1090.0,122.0L1096.9,118.9L1097.8,117.1L1100.0,116.1L1099.7,117.2L1098.8,118.1L1098.6,120.0L1098.4,120.3ZM1095.3,118.2L1096.1,119.7L1094.3,120.0L1091.3,119.1L1095.3,118.2ZM566.4,79.0L563.6,78.8L567.1,77.8L566.4,79.0ZM607.9,71.1L603.3,70.5L609.0,71.0L607.9,71.1ZM758.3,44.4L744.6,41.9L744.8,41.2L755.2,41.6L758.9,42.6L758.3,44.4ZM905.3,45.8L901.3,45.4L900.6,44.2L905.3,45.8ZM911.2,57.1L903.2,57.4L903.4,56.4L912.4,56.4L911.2,57.1ZM903.4,67.5L902.2,67.1L902.8,65.0L903.7,65.4L903.4,67.5ZM905.7,78.3L902.9,75.3L904.0,74.6L905.3,76.3L905.7,78.3ZM909.0,81.9L910.3,83.4L911.3,84.2L904.0,83.1L906.5,82.3L909.0,81.9ZM909.3,69.3L909.5,68.1L911.0,68.6L909.3,69.3ZM841.9,36.1L864.6,37.9L831.4,39.4L870.6,39.2L874.4,39.9L888.9,41.3L876.1,43.3L842.7,45.1L872.0,45.5L877.4,46.3L881.3,44.7L891.2,45.0L889.3,48.0L879.8,51.4L881.1,51.4L902.1,46.9L905.3,47.7L913.3,48.1L920.4,46.1L933.1,46.1L945.3,48.1L932.5,50.4L928.7,50.6L930.1,51.4L924.7,52.1L916.9,53.2L920.6,53.9L915.3,55.0L900.5,54.8L896.7,56.5L897.9,57.5L901.8,57.9L901.8,59.8L903.0,60.9L891.4,63.7L891.1,65.2L888.9,69.3L894.6,67.9L901.2,69.1L900.4,69.7L896.5,70.9L907.1,71.7L906.8,73.7L904.8,74.2L892.5,73.6L888.0,74.7L883.4,74.5L884.1,75.0L887.9,76.3L889.8,77.1L898.5,77.9L898.9,79.1L900.7,80.3L901.3,82.5L898.9,83.3L892.7,83.3L887.3,83.9L886.0,83.8L888.8,84.3L892.6,83.9L892.8,85.7L894.3,85.7L896.6,84.1L898.9,85.0L902.1,87.1L901.6,88.1L888.9,88.9L887.5,87.8L886.9,86.6L887.0,87.3L884.7,88.2L885.3,88.8L885.0,89.6L895.9,90.8L890.3,92.8L881.0,93.4L873.4,91.6L870.3,91.7L866.8,90.7L869.6,92.7L863.2,93.9L857.5,93.3L860.4,94.3L855.5,94.8L875.9,93.2L886.4,97.0L883.8,100.1L873.3,97.1L870.9,95.1L861.4,97.2L870.9,96.0L871.4,98.2L870.6,98.8L886.5,102.7L883.8,104.0L884.2,105.2L885.2,104.1L888.3,104.7L888.7,109.6L884.4,109.3L883.6,107.7L881.3,109.7L876.5,109.1L871.0,105.0L862.9,103.3L857.6,103.2L865.5,104.1L864.0,106.1L858.1,106.9L851.3,106.9L853.0,107.5L852.1,108.5L847.5,109.7L860.9,109.8L855.0,112.1L857.0,112.0L859.9,110.9L871.1,110.6L884.1,112.3L876.4,113.8L876.1,114.7L873.9,114.7L872.8,115.5L869.3,116.8L860.4,119.7L839.9,122.4L837.7,122.2L836.9,123.0L835.1,123.0L828.7,121.3L829.2,122.1L829.0,122.7L828.9,123.9L824.0,125.5L818.1,131.0L813.2,133.1L808.8,132.4L809.5,134.1L805.8,135.1L805.1,134.8L804.0,135.8L801.1,135.9L797.0,136.7L799.7,133.6L800.8,132.8L796.8,132.9L797.5,133.5L794.5,134.8L794.3,135.1L793.2,136.8L784.5,137.3L786.9,138.8L781.8,139.7L779.8,140.3L780.9,141.0L782.6,141.3L784.0,143.5L780.0,144.6L779.0,144.9L781.9,146.3L781.2,148.0L779.6,149.2L777.4,151.1L773.5,150.7L776.3,152.0L774.5,153.0L769.5,153.3L773.4,154.2L773.0,156.8L772.9,158.4L772.5,158.9L767.8,165.4L763.5,165.1L767.5,166.1L767.4,168.4L763.5,168.4L764.8,169.2L762.5,169.3L762.2,168.8L760.8,168.0L761.2,167.2L758.6,168.1L755.5,166.7L757.0,165.5L751.1,164.0L752.2,161.6L746.4,163.7L739.3,163.8L741.5,162.6L738.5,161.9L735.3,160.7L733.8,159.2L733.3,157.5L735.0,156.5L731.3,157.0L731.2,155.6L727.9,154.1L728.3,152.6L728.9,151.6L727.2,152.3L724.4,150.6L720.8,147.2L722.3,145.6L727.2,144.7L726.7,144.2L720.6,145.3L720.8,144.1L723.2,142.7L726.7,142.0L729.4,143.0L728.2,141.7L725.8,141.1L724.3,139.7L724.4,142.0L722.9,141.9L721.8,142.0L718.2,144.4L715.7,139.1L715.4,138.3L723.0,135.9L714.0,137.0L711.3,136.0L711.2,134.8L710.6,134.3L722.3,129.7L711.7,133.7L709.0,133.1L711.4,130.6L715.8,129.6L707.6,128.3L709.5,126.3L716.1,124.8L725.9,125.9L722.9,124.9L722.0,124.6L715.2,124.5L709.0,125.3L712.4,122.2L720.9,123.0L722.9,121.3L716.1,122.2L710.7,121.5L713.2,119.7L723.4,120.0L724.9,118.9L723.0,118.2L725.0,117.2L727.8,116.8L723.5,116.3L726.9,113.5L727.5,113.2L726.9,112.4L727.0,112.0L716.3,111.8L706.2,109.6L704.5,108.0L714.7,108.1L721.5,109.8L725.7,109.9L721.9,108.4L721.6,107.2L720.2,106.5L723.7,106.6L719.4,105.9L712.0,104.9L718.7,102.9L710.0,103.2L710.7,102.2L708.3,99.2L707.6,99.1L709.9,101.8L707.3,103.3L706.4,104.3L701.1,104.3L697.6,103.1L701.6,99.5L702.3,98.9L697.7,99.8L699.0,98.6L698.8,98.2L702.6,97.4L702.7,95.9L697.5,95.1L699.5,93.2L695.2,92.1L696.5,90.7L694.1,88.9L689.5,88.9L692.2,88.2L692.1,87.2L692.8,86.3L681.2,82.0L682.4,80.7L680.8,80.1L654.0,76.7L642.7,77.8L633.6,77.5L627.6,78.2L625.3,77.7L620.6,76.1L627.2,74.8L618.6,74.3L617.9,73.6L616.0,73.8L613.1,73.8L611.3,72.3L624.3,71.2L631.6,70.8L637.6,71.3L637.8,70.3L637.2,69.5L617.4,69.9L615.6,68.5L614.9,68.2L609.4,68.3L602.7,65.8L602.2,65.1L603.8,64.5L608.7,63.7L623.2,62.5L623.8,61.8L628.1,61.4L642.1,60.2L647.3,55.9L649.7,55.5L634.3,55.6L633.0,54.5L636.2,53.1L651.5,50.2L656.0,50.8L656.5,49.3L658.3,49.3L665.9,49.4L667.0,47.5L667.6,46.0L672.8,45.2L692.1,48.3L680.5,44.4L705.4,43.1L709.3,44.5L710.2,46.6L713.0,44.7L712.0,43.5L713.9,43.1L727.4,45.4L731.2,45.0L724.2,42.7L724.8,42.2L735.8,42.6L759.7,45.9L760.0,43.4L759.9,41.8L755.5,40.6L777.5,40.5L749.2,39.5L752.4,38.9L770.0,37.8L780.1,38.2L786.2,37.6L796.2,39.2L796.8,38.2L793.1,37.0L799.7,36.5L841.9,36.1ZM690.1,860.6L690.3,862.0L689.3,861.7L688.6,861.3L686.0,862.0L678.7,865.4L680.0,866.0L679.6,867.1L675.5,866.6L674.8,867.2L672.0,867.2L671.1,867.5L665.9,869.9L663.6,869.9L664.0,871.1L662.0,871.0L661.8,872.3L662.2,873.0L661.2,875.5L664.2,875.9L670.2,875.2L668.3,876.4L667.0,877.0L664.8,876.6L663.0,877.6L660.8,876.4L657.9,877.1L658.6,879.3L654.0,876.7L652.6,877.1L652.0,879.6L651.8,880.5L646.8,880.4L646.1,881.5L646.2,881.8L646.1,882.3L644.8,882.8L642.3,883.4L642.1,885.4L642.3,886.2L642.2,886.8L642.2,887.4L645.9,887.5L643.4,888.6L645.0,889.1L645.8,890.3L650.0,890.4L655.3,888.9L656.6,889.3L654.0,890.8L653.8,891.9L654.8,893.0L659.6,895.4L661.0,897.9L662.5,898.9L660.8,900.2L665.0,901.0L661.9,902.3L663.8,902.6L666.3,903.4L667.7,905.2L663.7,907.2L667.7,907.1L664.1,908.2L662.7,909.4L669.4,909.8L667.5,911.6L668.1,912.9L670.3,913.7L671.9,914.7L673.2,915.7L666.4,916.0L662.6,915.8L665.4,917.2L668.3,919.5L665.9,920.4L666.4,921.4L665.9,922.1L669.4,921.9L665.6,923.1L660.8,923.1L662.5,925.1L660.0,925.6L655.5,924.1L654.5,925.2L653.3,926.0L653.4,926.8L651.0,927.7L655.1,928.1L650.6,929.1L617.7,934.4L614.1,935.5L576.3,935.4L587.0,939.7L599.0,942.1L586.9,943.6L556.1,941.5L553.0,942.0L575.4,945.8L568.3,946.9L550.3,945.8L540.1,943.0L542.3,945.0L540.0,945.3L542.8,947.0L552.7,949.2L557.2,951.2L564.2,950.0L583.0,950.9L581.6,952.9L578.5,953.6L567.2,954.4L582.1,954.8L590.3,958.9L602.9,958.7L614.1,957.5L619.3,959.3L626.6,959.5L646.7,962.4L661.2,963.1L645.2,963.4L643.8,963.9L646.9,964.5L639.9,964.9L642.1,966.8L648.7,967.2L668.7,966.7L658.6,968.6L663.7,970.8L666.6,971.3L667.8,973.1L682.9,971.4L699.7,967.7L708.5,966.1L741.3,964.7L751.2,965.3L750.8,966.6L750.9,968.0L757.3,967.6L767.7,965.2L780.4,960.5L796.7,959.2L803.4,959.4L809.3,958.4L817.3,957.3L836.0,955.6L845.4,954.9L878.7,953.1L841.4,951.6L838.0,949.0L813.6,948.2L806.5,946.1L810.8,942.9L821.5,938.8L832.3,937.2L852.4,932.9L879.8,929.9L906.7,928.1L905.5,926.5L912.9,922.1L922.9,922.3L928.0,919.4L918.6,919.5L919.7,918.6L917.4,917.7L918.7,916.8L925.8,914.9L931.4,914.6L931.8,913.2L938.5,912.5L946.3,910.6L948.5,908.0L947.3,907.7L941.1,906.2L941.5,905.3L950.2,905.9L953.2,903.7L951.9,903.3L953.3,903.0L959.7,905.4L962.3,907.2L967.0,905.2L966.5,903.5L965.9,902.7L967.2,902.4L978.0,902.0L978.0,903.2L975.6,904.9L976.6,905.3L997.3,905.4L1001.6,905.7L1005.0,905.3L1008.2,907.0L1014.7,904.5L1024.6,902.8L1056.6,900.4L1059.5,900.0L1063.9,899.3L1076.4,901.9L1082.2,898.7L1084.6,899.1L1098.7,899.6L1103.1,898.9L1106.3,900.3L1112.3,900.7L1114.5,899.3L1117.7,899.4L1117.5,902.4L1121.9,902.9L1128.9,901.6L1132.6,899.3L1135.7,900.9L1135.0,901.7L1138.9,902.3L1146.0,900.3L1151.3,903.2L1160.1,903.2L1183.0,899.2L1194.1,897.3L1194.6,894.3L1193.9,890.9L1200.0,890.4L1201.2,891.5L1201.1,892.8L1205.0,893.1L1209.6,895.9L1216.0,895.8L1219.7,896.4L1224.0,896.8L1228.3,898.3L1228.9,897.4L1233.1,893.1L1234.7,891.4L1237.2,890.7L1250.3,887.2L1252.2,886.9L1270.6,883.9L1270.7,882.6L1273.1,882.5L1276.0,883.2L1275.5,884.7L1277.7,885.0L1281.1,885.4L1282.4,886.1L1285.2,882.9L1284.5,882.1L1284.0,880.6L1294.0,881.8L1292.3,879.6L1293.9,877.3L1303.9,875.2L1318.3,874.9L1329.8,879.3L1325.9,879.4L1326.9,880.2L1326.3,882.1L1334.5,881.2L1344.7,883.5L1352.3,883.7L1363.6,884.1L1368.7,883.9L1396.6,885.8L1400.8,885.8L1401.1,887.5L1402.4,889.6L1400.2,891.4L1400.2,893.8L1396.5,894.8L1398.1,896.5L1396.7,897.3L1391.7,897.2L1389.6,899.6L1398.3,901.1L1395.9,903.9L1390.8,906.6L1387.5,910.6L1384.5,914.6L1383.5,915.8L1390.1,915.6L1391.6,914.2L1393.9,911.9L1401.5,910.4L1410.3,906.3L1413.5,901.7L1418.2,899.1L1423.4,896.8L1435.4,896.2L1438.5,894.9L1447.8,891.6L1454.9,887.2L1478.5,883.4L1485.5,881.5L1493.2,881.3L1528.0,878.5L1539.2,879.0L1543.5,878.3L1562.5,878.1L1570.1,878.4L1578.6,875.9L1579.4,875.1L1588.9,874.9L1626.2,880.0L1630.5,877.1L1635.4,875.1L1646.1,874.5L1653.1,878.0L1657.8,880.7L1649.2,883.0L1651.5,883.2L1666.1,881.3L1677.5,881.8L1685.0,880.8L1685.6,882.3L1706.9,878.7L1711.9,878.9L1714.8,877.5L1717.4,877.6L1721.9,879.6L1728.0,881.1L1735.2,881.2L1739.3,877.3L1744.8,876.4L1761.0,876.2L1766.2,877.3L1770.6,876.3L1777.3,877.6L1783.0,877.6L1786.4,878.4L1807.7,880.2L1811.8,880.9L1817.2,880.6L1818.7,881.4L1820.9,882.5L1819.1,886.0L1826.7,884.3L1830.8,885.2L1834.0,886.8L1836.8,888.7L1857.7,888.7L1859.8,890.8L1870.4,891.1L1872.8,890.2L1874.3,888.5L1885.4,892.6L1895.3,893.3L1897.4,893.3L1907.4,895.7L1911.4,898.2L1916.9,902.9L1920.6,903.5L1920.2,899.7L1924.8,900.6L1930.2,901.3L1934.2,900.9L1948.3,902.1L1950.6,902.6L1954.8,904.5L1965.3,906.6L1967.3,906.8L1967.7,908.8L1963.6,911.3L1965.5,911.7L1964.2,912.4L1956.2,911.7L1963.0,913.5L1958.5,915.7L1953.8,915.3L1946.4,914.7L1944.1,914.6L1948.3,916.2L1950.1,917.1L1941.3,918.2L1940.0,919.5L1937.2,919.0L1935.9,916.7L1934.4,917.7L1935.3,920.2L1936.0,921.7L1937.5,923.6L1927.7,922.6L1926.1,922.6L1924.4,923.9L1922.0,926.8L1920.3,927.1L1913.6,928.1L1920.3,929.3L1923.2,931.2L1921.8,932.6L1923.6,934.0L1923.2,935.1L1922.4,936.1L1922.8,937.1L1926.0,937.8L1930.5,941.4L1933.0,942.4L1931.9,944.0L1936.1,943.9L1938.8,943.0L1942.6,945.2L1947.8,946.1L1946.2,946.5L1931.9,946.2L1918.9,946.6L1916.3,945.9L1918.2,948.6L1910.5,949.4L1909.0,951.4L1908.2,951.8L1909.3,952.4L1908.4,953.3L1909.9,954.2L1902.5,956.4L1911.2,956.7L1911.2,957.5L1911.8,958.1L1909.3,958.6L1911.9,960.1L1912.9,961.7L1921.4,966.9L1922.6,967.8L1935.7,967.3L1948.6,970.0L1951.7,970.9L1955.4,971.4L1950.7,972.2L1963.0,973.0L2012.1,1010.0L0.0,1007.7L9.0,978.2L131.1,982.4L128.2,981.3L129.1,980.9L82.8,978.5L91.1,978.0L86.4,976.9L84.4,975.2L67.0,974.8L49.4,972.2L38.9,970.2L50.3,970.4L66.3,971.9L84.6,972.3L89.5,973.1L95.9,972.7L108.9,973.5L125.1,972.9L127.1,971.8L126.1,971.3L139.4,969.9L146.5,966.1L143.4,964.4L144.6,963.0L131.7,960.4L179.4,958.6L165.9,955.1L177.6,953.9L177.9,953.4L177.2,952.4L160.7,950.5L156.8,949.4L155.7,948.9L139.1,948.1L132.0,946.2L142.0,943.9L124.3,943.1L121.2,942.0L121.5,940.5L124.3,937.5L130.9,938.3L146.4,938.3L151.1,939.5L163.0,940.3L170.6,941.4L178.1,939.4L174.8,938.6L176.3,937.6L192.6,939.8L192.8,938.3L193.2,938.0L191.1,937.2L192.5,936.4L189.8,935.1L183.3,933.9L172.3,933.2L180.3,932.2L192.8,933.3L189.0,931.6L195.8,930.8L207.5,928.9L212.7,928.8L217.6,928.9L237.8,926.3L243.8,926.6L246.7,924.5L253.4,924.1L261.1,925.0L271.0,924.8L284.8,924.9L300.8,924.4L338.5,923.9L349.0,922.5L364.1,922.8L368.4,919.8L373.2,921.1L372.3,922.5L372.6,923.4L370.4,925.0L370.7,925.7L383.9,924.4L383.3,923.1L383.6,921.2L387.1,921.5L391.1,924.2L386.6,926.9L418.6,926.9L433.3,926.5L439.8,927.1L444.9,928.1L456.5,927.4L453.3,926.3L447.4,924.8L447.6,922.9L441.4,922.2L437.1,920.0L433.2,918.2L450.1,918.7L453.4,917.8L442.2,916.4L431.6,915.6L430.8,913.3L432.9,913.0L436.1,913.7L437.5,914.6L460.0,914.8L470.5,916.3L492.4,915.6L502.6,916.0L504.1,914.3L513.3,912.9L515.1,913.8L515.1,915.8L521.6,916.6L524.1,916.6L529.8,916.1L535.5,917.7L552.1,919.1L554.2,917.3L555.4,915.9L559.0,916.3L557.8,914.5L560.3,914.6L566.9,916.4L570.0,917.7L579.3,917.8L578.6,919.2L588.9,918.2L600.8,917.1L623.8,915.2L632.3,912.4L634.3,908.4L631.1,905.0L629.1,900.1L626.2,896.7L625.2,894.5L632.3,893.9L633.9,892.3L632.4,890.9L633.8,890.3L633.8,889.1L634.2,887.4L633.9,885.6L635.7,883.9L630.9,883.8L631.6,881.5L634.3,880.9L635.0,882.5L637.0,882.3L637.6,878.7L641.2,878.5L641.3,876.8L644.0,875.7L644.7,875.1L647.8,874.8L648.2,874.1L649.7,873.3L652.0,872.4L650.7,870.7L653.8,870.2L656.3,870.2L657.8,868.8L658.9,868.4L659.8,867.7L661.3,868.2L664.9,867.2L671.8,863.7L689.2,859.8L690.1,860.6ZM2013.6,107.6L2013.4,105.6L2020.0,106.7L2013.6,107.6ZM1110.9,172.1L1114.5,172.1L1111.6,173.6L1103.4,175.9L1101.6,176.0L1104.4,177.0L1103.8,177.9L1102.3,185.6L1099.3,189.8L1092.8,190.6L1089.8,191.7L1089.0,194.2L1082.6,193.7L1082.0,191.4L1080.2,189.1L1081.5,188.8L1081.7,188.2L1081.8,187.1L1076.9,182.2L1073.6,177.4L1073.1,177.2L1072.7,173.7L1073.8,173.4L1070.3,172.3L1069.1,170.0L1067.5,173.6L1066.6,173.8L1065.0,173.8L1064.0,173.6L1061.8,175.4L1055.1,178.7L1047.0,179.0L1047.1,178.1L1041.3,176.1L1042.8,174.2L1044.4,174.6L1045.5,173.9L1043.8,174.0L1043.4,173.2L1044.0,171.9L1045.9,170.8L1038.8,172.7L1039.8,170.3L1044.9,169.3L1042.5,168.8L1045.6,166.4L1046.6,167.1L1047.4,166.3L1048.2,165.5L1044.2,166.7L1038.7,170.2L1039.5,167.8L1041.7,167.5L1039.1,166.6L1039.0,165.6L1041.4,164.4L1038.3,164.4L1038.6,162.3L1048.7,162.1L1049.7,162.9L1052.3,161.7L1051.5,161.5L1051.1,160.6L1049.0,161.8L1046.7,161.4L1038.7,161.7L1039.0,160.2L1039.6,159.9L1037.6,158.2L1038.0,157.7L1047.5,157.7L1039.0,157.4L1039.4,156.1L1043.6,154.8L1047.1,154.7L1044.3,154.6L1046.1,153.7L1052.9,153.9L1053.8,153.1L1055.1,152.8L1048.1,152.7L1052.9,150.9L1056.1,151.5L1058.3,152.2L1055.9,150.2L1058.5,149.3L1057.1,148.5L1058.7,148.0L1061.4,148.3L1062.3,148.3L1065.2,148.6L1066.6,149.1L1070.1,148.5L1073.7,146.8L1073.4,146.2L1074.1,145.8L1072.1,146.0L1071.5,146.4L1068.0,148.3L1065.7,148.6L1063.7,147.5L1064.5,146.6L1070.8,143.1L1075.3,141.3L1073.4,141.2L1078.2,139.3L1080.2,139.7L1082.5,138.4L1079.4,139.2L1078.0,138.2L1081.9,134.9L1082.8,134.6L1085.1,133.6L1088.4,132.9L1083.3,132.2L1084.7,130.7L1088.1,130.1L1087.0,129.4L1089.7,128.4L1096.6,127.7L1091.1,127.4L1094.8,125.9L1097.4,126.6L1096.9,126.2L1095.4,125.4L1094.4,125.2L1093.2,124.8L1094.4,123.7L1097.6,123.5L1096.9,122.9L1100.0,122.2L1101.2,123.4L1101.6,122.9L1100.9,121.7L1103.3,121.2L1108.6,120.9L1103.0,120.1L1111.7,116.8L1112.1,115.4L1112.6,115.2L1116.1,116.0L1114.8,114.9L1120.7,113.4L1120.7,115.0L1122.6,112.9L1124.2,112.7L1123.8,114.8L1123.3,115.8L1126.4,114.8L1125.3,113.1L1126.9,112.7L1131.1,112.6L1132.8,112.2L1130.9,110.8L1138.2,110.3L1141.3,112.1L1140.9,111.1L1142.8,110.0L1146.9,108.0L1147.1,107.2L1149.0,106.6L1154.0,107.9L1151.1,110.4L1151.5,111.5L1159.6,106.9L1159.6,109.9L1164.6,107.6L1162.8,106.9L1164.9,106.1L1169.3,106.7L1167.1,108.5L1168.2,109.0L1168.7,110.0L1173.3,107.4L1183.7,110.3L1177.9,111.7L1171.6,111.7L1176.4,112.5L1177.2,113.7L1180.3,113.2L1181.1,113.4L1187.7,113.8L1189.7,113.1L1191.8,113.0L1195.1,114.3L1190.1,114.3L1193.1,115.1L1197.8,115.7L1197.0,117.3L1202.1,116.1L1215.5,117.8L1226.9,121.6L1233.5,123.1L1233.9,122.8L1240.4,126.6L1242.0,128.4L1237.4,132.2L1225.5,134.3L1208.4,132.3L1204.2,131.5L1203.0,131.2L1195.2,129.6L1194.5,128.7L1191.8,128.2L1189.5,128.3L1198.5,132.5L1197.5,132.9L1203.0,133.9L1205.2,135.4L1203.8,138.7L1208.0,143.9L1210.9,144.0L1216.0,146.2L1221.2,146.5L1223.6,145.4L1222.3,143.8L1217.8,143.1L1215.2,141.5L1215.7,140.6L1217.9,139.2L1233.5,142.2L1236.6,140.9L1233.0,137.8L1236.3,136.1L1247.4,131.8L1254.4,132.9L1254.4,133.7L1254.8,133.8L1257.6,134.3L1258.1,132.4L1259.3,130.2L1259.2,129.0L1255.7,127.2L1258.2,123.0L1257.8,121.6L1253.6,119.6L1269.0,121.8L1270.5,124.4L1264.6,125.2L1262.2,127.1L1266.7,129.1L1268.6,129.9L1271.2,130.1L1277.7,128.8L1280.9,125.4L1284.3,125.0L1284.1,124.2L1302.1,120.4L1304.4,121.3L1305.4,120.6L1305.6,119.3L1314.0,117.8L1311.9,118.5L1312.6,118.9L1312.5,120.4L1312.0,121.3L1309.7,122.0L1318.2,121.3L1325.8,119.9L1332.3,119.8L1341.4,118.0L1342.7,119.5L1342.8,121.2L1345.7,121.3L1347.6,119.5L1351.5,117.0L1348.6,115.3L1348.2,114.2L1352.4,113.1L1372.4,115.4L1374.9,116.3L1386.8,119.2L1396.2,120.3L1396.7,118.1L1392.2,116.5L1390.3,114.9L1385.7,114.2L1384.8,114.1L1386.3,112.2L1387.1,111.3L1387.1,107.7L1384.1,107.4L1384.2,106.4L1384.6,105.8L1394.2,101.8L1400.6,95.5L1413.6,96.4L1418.4,98.3L1416.1,102.0L1414.4,104.9L1418.1,107.6L1417.7,110.0L1417.0,111.3L1417.2,118.0L1422.2,121.0L1420.3,122.9L1419.3,125.1L1412.1,129.4L1410.9,129.7L1410.3,130.8L1405.9,131.6L1405.3,130.9L1406.3,130.4L1397.5,130.4L1399.5,131.8L1404.7,132.7L1415.8,132.8L1421.5,130.1L1424.6,128.6L1429.0,125.2L1429.6,124.0L1427.9,119.7L1434.1,118.4L1439.8,118.4L1443.4,120.8L1443.9,124.9L1447.6,125.9L1452.6,125.6L1445.0,124.0L1446.3,122.2L1447.4,121.3L1444.7,118.4L1434.0,116.4L1427.3,117.0L1424.6,115.5L1424.3,111.2L1427.0,108.6L1423.4,101.9L1431.1,99.9L1430.9,97.5L1430.1,96.3L1433.5,97.2L1434.2,98.1L1434.7,99.6L1432.2,102.0L1433.5,103.6L1432.5,104.5L1437.1,105.4L1453.7,106.6L1450.4,106.5L1447.2,104.8L1438.2,103.3L1437.1,101.4L1442.4,101.0L1446.4,101.9L1449.0,101.3L1444.5,100.1L1450.4,98.8L1458.6,99.7L1463.5,100.7L1470.6,102.6L1477.0,102.9L1471.7,106.1L1471.6,108.3L1471.1,109.4L1471.4,109.8L1474.3,106.9L1476.0,107.6L1475.3,109.9L1474.4,111.4L1476.3,111.6L1477.4,110.4L1479.4,108.5L1477.2,105.1L1477.6,102.0L1471.9,100.6L1468.9,99.2L1463.4,98.1L1462.7,96.7L1463.1,95.2L1461.4,94.5L1461.5,93.1L1467.1,91.8L1497.9,90.6L1491.4,93.3L1496.6,94.7L1492.5,92.7L1499.8,91.4L1501.0,90.7L1493.6,88.2L1493.6,87.4L1498.8,87.5L1491.9,85.6L1500.5,84.5L1497.7,83.5L1499.1,83.1L1506.6,82.5L1520.6,80.5L1538.3,78.8L1531.0,78.7L1533.9,78.0L1548.2,77.9L1548.6,78.5L1547.2,79.3L1552.0,78.6L1553.6,78.9L1564.2,77.3L1569.4,78.8L1568.9,79.6L1569.0,77.2L1568.7,75.9L1580.6,75.8L1576.8,75.1L1577.8,72.8L1588.7,69.4L1594.6,68.8L1603.3,71.0L1601.0,72.4L1611.5,73.9L1608.6,75.7L1615.5,75.4L1618.0,74.5L1635.0,74.7L1638.5,76.2L1639.2,76.2L1642.3,77.3L1642.5,78.1L1643.0,78.2L1644.4,77.3L1644.5,77.1L1646.1,77.6L1648.9,79.0L1648.3,80.2L1647.0,80.7L1641.0,79.5L1645.0,80.7L1643.6,84.1L1626.5,88.1L1614.7,91.9L1611.3,92.1L1603.0,95.6L1601.4,96.6L1611.0,94.4L1632.1,91.3L1625.3,90.9L1632.4,90.1L1635.4,89.8L1634.5,90.4L1637.3,91.2L1640.7,91.4L1643.7,90.7L1643.7,90.1L1645.1,90.7L1646.1,92.1L1645.6,93.2L1646.7,95.1L1644.9,96.7L1648.1,97.3L1645.8,96.1L1647.6,93.9L1648.5,93.3L1648.9,92.4L1654.2,92.0L1677.0,92.4L1674.5,94.0L1680.1,95.0L1698.4,96.0L1698.0,95.2L1701.9,95.4L1703.0,93.9L1701.9,92.4L1702.9,91.6L1710.2,91.4L1715.8,92.8L1718.7,92.4L1718.6,93.2L1721.7,93.0L1728.0,92.9L1734.1,95.1L1732.0,96.0L1734.5,97.2L1731.3,98.2L1736.1,99.2L1733.5,100.6L1727.3,99.3L1734.1,102.2L1735.5,101.8L1735.1,102.4L1734.6,103.3L1739.6,106.2L1743.2,107.2L1744.1,107.0L1745.9,108.1L1750.6,105.0L1754.7,101.7L1762.5,104.5L1775.4,103.4L1784.3,105.8L1784.4,105.1L1784.9,104.6L1784.3,104.0L1786.1,103.2L1790.0,103.5L1791.7,104.1L1795.2,103.5L1793.0,101.4L1793.5,101.0L1796.3,99.8L1790.8,99.5L1792.6,98.4L1801.1,97.5L1799.3,96.1L1802.9,96.2L1830.5,99.0L1822.4,98.9L1820.6,100.0L1833.8,99.7L1829.3,101.3L1830.0,100.2L1827.6,99.8L1825.9,101.6L1823.9,101.6L1824.0,102.6L1828.1,102.4L1837.3,99.1L1850.4,100.5L1851.0,101.9L1847.4,102.8L1855.2,103.8L1853.0,105.1L1860.5,105.0L1862.9,106.6L1867.4,107.5L1889.2,106.1L1904.1,107.8L1907.8,110.5L1908.4,113.7L1913.0,115.3L1914.2,117.6L1914.1,119.8L1914.0,120.3L1916.6,117.5L1918.7,114.8L1927.4,113.9L1947.5,114.7L1952.4,113.9L1955.0,116.5L1960.6,118.3L1964.3,119.0L1969.5,117.6L1965.0,114.0L1966.8,112.6L1968.8,111.7L1982.7,112.6L1998.2,113.0L2013.9,115.8L2020.0,138.5L2019.0,140.1L2010.4,142.1L2006.4,141.5L2001.1,140.1L2003.9,140.6L2004.0,141.4L2002.2,141.1L1996.3,141.2L1990.3,142.1L1998.5,140.9L1999.1,142.2L2000.4,142.1L2005.6,141.6L2008.5,144.6L2010.5,144.1L2012.6,147.8L2012.4,148.4L2013.0,149.3L2013.9,149.3L2016.7,151.1L2016.1,151.8L2017.6,153.3L2014.6,155.3L2004.8,153.5L2004.8,152.7L2003.1,153.1L2002.6,154.1L1987.9,158.1L1982.9,159.6L1981.0,160.4L1979.6,160.3L1980.0,161.1L1976.3,162.7L1967.2,166.1L1964.8,168.4L1957.1,165.2L1953.4,165.1L1944.0,168.6L1942.5,169.2L1942.5,165.6L1936.2,168.6L1935.0,169.2L1932.3,168.0L1931.0,168.4L1928.8,168.2L1926.9,169.3L1925.1,173.2L1919.3,178.0L1919.0,179.7L1921.6,180.9L1923.0,179.9L1925.8,181.3L1923.3,183.6L1923.5,186.2L1926.0,187.6L1926.1,189.8L1923.7,190.4L1923.0,188.9L1924.3,187.9L1921.7,188.5L1921.6,189.5L1918.6,191.7L1917.8,195.2L1918.8,198.1L1915.0,199.1L1910.7,199.6L1907.8,201.3L1907.1,203.8L1907.5,206.9L1902.9,207.0L1900.4,208.0L1899.0,207.9L1899.6,209.4L1899.2,211.5L1895.6,215.4L1889.4,218.6L1888.1,216.2L1886.6,209.7L1882.8,194.4L1885.5,186.6L1890.8,182.6L1890.9,180.5L1898.4,179.1L1903.9,176.1L1909.7,171.7L1918.1,167.0L1920.5,165.3L1927.7,162.6L1930.2,160.5L1929.3,159.6L1931.8,155.2L1938.1,154.3L1931.7,153.2L1926.0,154.6L1925.8,158.6L1925.7,159.1L1924.9,159.6L1923.2,158.7L1920.1,159.7L1910.5,164.2L1908.8,164.5L1909.4,162.5L1906.8,162.6L1909.1,157.7L1905.0,158.3L1902.6,157.5L1890.3,159.6L1888.0,161.6L1877.4,167.8L1875.6,169.8L1875.6,171.3L1880.7,171.9L1879.8,172.8L1873.5,173.3L1870.0,173.4L1866.1,174.2L1858.0,173.5L1863.5,172.3L1858.2,170.7L1854.7,171.0L1848.4,169.7L1846.8,170.8L1846.8,171.2L1844.4,171.4L1845.6,172.4L1843.2,172.5L1839.7,171.8L1835.1,171.9L1831.7,171.5L1828.8,172.8L1820.7,171.8L1808.6,173.1L1799.4,178.4L1795.6,181.3L1785.6,187.2L1781.9,190.1L1768.8,196.9L1769.3,198.0L1774.4,198.6L1777.7,198.8L1777.1,203.1L1778.1,202.9L1780.2,201.9L1780.8,200.4L1781.6,201.1L1781.4,201.8L1783.1,202.5L1780.6,204.6L1785.8,203.5L1787.3,202.2L1786.6,203.8L1786.1,204.7L1788.0,203.4L1790.5,200.8L1794.8,200.8L1803.4,206.6L1800.5,207.1L1800.5,207.4L1802.7,209.6L1802.1,211.2L1803.3,212.9L1800.3,216.5L1798.2,221.4L1799.0,224.1L1798.2,225.4L1796.8,231.3L1795.5,233.8L1787.3,241.4L1785.5,244.3L1781.1,248.9L1770.5,258.3L1769.0,259.9L1760.3,264.7L1756.6,265.3L1752.5,262.4L1752.0,262.3L1750.1,262.8L1750.5,262.1L1749.1,262.6L1745.2,265.7L1744.1,266.4L1737.7,271.6L1735.7,276.5L1730.4,280.1L1725.6,282.3L1725.4,285.2L1730.3,288.3L1736.2,297.8L1736.2,302.9L1736.6,304.8L1734.3,307.9L1730.8,308.2L1730.4,309.3L1728.1,308.5L1726.3,309.0L1726.2,310.3L1724.8,310.1L1724.9,311.1L1723.6,311.2L1722.8,310.8L1719.9,312.3L1718.7,310.2L1720.1,309.5L1719.2,309.0L1719.0,307.4L1720.2,305.3L1720.0,304.9L1721.0,303.6L1719.4,299.2L1718.2,298.1L1720.9,297.6L1721.9,298.2L1722.4,297.6L1721.4,295.7L1720.5,293.0L1718.1,292.7L1717.3,292.5L1715.3,292.0L1713.4,293.2L1712.5,291.6L1712.3,291.3L1710.7,290.5L1713.1,288.0L1714.1,287.7L1713.7,284.5L1712.4,282.9L1709.9,282.0L1709.2,282.1L1707.3,281.0L1696.4,284.1L1691.8,287.1L1689.6,287.2L1690.0,286.5L1692.5,284.9L1693.4,283.9L1690.6,283.6L1691.2,282.7L1696.1,277.5L1693.5,275.1L1692.3,275.8L1689.4,275.8L1685.4,279.4L1679.9,281.9L1677.2,285.2L1670.0,287.0L1670.2,289.4L1672.2,290.7L1677.9,292.3L1677.7,295.8L1680.2,296.7L1682.7,296.0L1684.9,293.5L1689.2,293.3L1693.5,294.8L1697.8,295.6L1697.1,297.9L1696.1,298.3L1692.7,298.3L1687.8,299.6L1688.1,300.6L1687.2,301.1L1686.2,302.4L1684.0,302.2L1684.6,303.4L1679.7,308.0L1678.8,310.0L1685.1,313.3L1688.4,320.7L1688.9,322.3L1691.2,323.4L1691.5,324.6L1693.8,327.1L1684.4,325.6L1684.4,326.0L1687.6,325.9L1693.4,330.1L1693.3,331.8L1686.9,334.5L1684.6,335.3L1688.4,335.8L1690.9,335.1L1693.5,336.9L1694.0,337.9L1692.8,339.4L1694.2,338.9L1694.1,341.5L1692.6,341.0L1691.9,341.6L1692.5,342.7L1692.0,345.0L1691.8,346.1L1690.2,345.9L1689.5,346.3L1688.3,347.9L1687.6,348.0L1686.4,351.7L1683.2,355.8L1682.1,354.4L1681.0,355.0L1682.2,357.4L1679.8,358.8L1679.2,359.3L1681.4,359.6L1681.0,362.7L1678.5,362.4L1679.0,363.6L1677.2,364.0L1676.7,365.2L1675.7,365.8L1675.3,367.1L1672.2,367.2L1671.3,367.9L1671.6,369.7L1670.7,370.3L1668.4,372.4L1665.7,373.4L1664.7,374.1L1662.8,376.3L1657.4,377.5L1655.8,377.2L1653.9,378.0L1653.0,377.6L1652.5,378.6L1651.3,378.8L1650.4,379.6L1649.1,379.2L1649.3,378.6L1646.6,375.6L1646.0,376.6L1647.1,379.3L1646.9,380.4L1644.1,380.9L1643.5,382.2L1641.2,382.6L1640.6,382.0L1639.5,382.9L1638.0,382.8L1635.0,384.2L1632.8,384.8L1630.1,386.0L1629.5,385.8L1628.2,388.0L1629.4,388.3L1630.1,390.2L1627.9,391.3L1626.6,390.5L1625.6,386.9L1626.3,384.5L1624.7,384.1L1622.2,384.4L1618.7,382.1L1618.5,383.8L1617.7,383.7L1614.4,384.9L1612.5,386.1L1611.0,387.4L1608.6,387.4L1607.9,389.8L1607.7,391.2L1603.7,395.1L1603.3,399.6L1607.4,404.7L1606.8,405.3L1607.7,405.9L1615.3,413.5L1616.5,413.9L1621.0,419.8L1623.2,427.8L1623.8,433.9L1623.3,435.5L1622.8,437.3L1620.6,441.5L1611.7,446.5L1610.3,445.4L1609.8,446.7L1608.4,446.3L1608.4,447.3L1608.2,447.6L1608.8,448.6L1607.9,449.6L1605.8,448.1L1608.0,450.9L1606.9,451.4L1605.4,450.7L1602.0,454.0L1598.6,456.8L1598.6,455.9L1598.6,449.9L1599.7,449.2L1599.0,448.3L1597.0,447.7L1593.2,445.6L1590.9,445.5L1591.6,442.9L1590.6,442.8L1588.5,442.9L1588.0,440.0L1585.6,436.8L1579.2,434.2L1576.0,433.7L1576.2,429.5L1574.1,429.2L1571.1,430.7L1571.0,433.3L1570.7,437.4L1566.6,447.4L1567.4,453.2L1570.4,453.4L1573.6,464.1L1572.6,461.4L1572.3,462.9L1573.9,464.8L1577.6,466.4L1580.2,467.1L1590.3,477.8L1590.7,489.1L1594.8,495.3L1594.2,497.1L1593.5,496.3L1590.3,497.0L1578.7,488.1L1575.4,482.5L1572.6,470.3L1569.5,465.1L1568.5,463.9L1567.2,462.6L1563.5,458.4L1561.2,457.7L1563.6,447.9L1562.7,447.9L1562.7,444.9L1564.6,439.1L1563.4,438.8L1562.6,430.4L1560.7,428.4L1560.4,427.0L1559.5,422.5L1559.5,422.2L1558.8,419.8L1557.7,414.4L1558.0,412.1L1556.1,411.5L1554.8,408.7L1553.6,407.7L1552.2,412.1L1550.3,411.9L1550.0,411.7L1549.4,413.3L1547.0,414.8L1545.0,416.7L1544.9,415.0L1543.5,416.1L1542.4,415.3L1542.3,414.6L1541.1,415.3L1541.3,412.8L1538.6,414.5L1540.6,405.7L1537.6,396.9L1536.3,398.6L1534.8,396.2L1536.8,396.9L1537.2,395.7L1535.5,393.6L1535.1,393.3L1532.7,392.5L1531.8,392.4L1532.0,390.5L1530.7,391.6L1531.0,390.5L1530.2,389.6L1529.6,390.1L1527.6,387.8L1526.3,384.3L1525.4,379.6L1522.9,377.1L1519.6,377.5L1518.2,372.7L1517.3,373.5L1517.2,373.9L1518.4,374.8L1517.7,377.7L1518.3,380.1L1515.9,382.6L1515.5,381.5L1515.8,380.8L1514.5,380.9L1514.4,379.8L1514.3,379.4L1513.6,382.0L1512.6,382.3L1512.0,380.4L1511.9,382.6L1511.0,383.2L1509.5,381.9L1509.2,383.6L1508.5,383.5L1507.8,383.7L1507.0,382.5L1506.3,383.7L1505.3,383.3L1504.1,383.3L1504.3,380.3L1503.6,380.1L1504.4,381.3L1502.8,383.1L1497.9,385.1L1497.3,386.6L1497.7,389.3L1495.4,391.8L1491.7,393.9L1489.8,394.3L1487.9,394.9L1488.2,395.5L1479.4,403.6L1471.7,409.7L1470.9,412.5L1465.8,413.7L1464.0,416.6L1461.0,416.4L1459.5,419.0L1459.7,426.1L1460.4,429.1L1459.5,429.1L1460.2,433.8L1457.8,441.4L1457.5,447.2L1454.7,447.9L1452.8,452.0L1454.5,453.1L1449.2,454.6L1446.4,459.0L1443.7,459.3L1439.2,454.0L1438.0,449.4L1439.0,451.5L1437.8,448.8L1434.5,440.6L1430.1,432.9L1427.1,423.2L1424.6,419.1L1423.7,417.1L1421.0,408.5L1418.9,400.2L1419.5,397.5L1418.5,397.2L1418.4,396.4L1418.0,392.3L1418.9,388.1L1417.9,384.7L1417.8,384.6L1418.0,384.1L1419.5,383.2L1417.3,382.2L1417.5,381.8L1417.5,380.4L1417.9,380.1L1415.4,380.2L1414.6,382.7L1414.4,385.9L1411.6,387.3L1406.8,388.6L1403.5,386.6L1397.0,379.9L1397.5,379.1L1400.2,379.3L1404.6,377.0L1405.2,375.5L1398.5,376.8L1395.2,374.9L1394.1,372.4L1395.2,371.4L1392.6,371.9L1392.4,371.5L1388.8,370.7L1386.5,365.9L1384.2,365.1L1383.5,362.6L1382.2,361.3L1382.3,361.9L1382.6,362.2L1372.4,363.6L1369.0,362.8L1353.6,363.9L1348.9,363.0L1333.9,360.7L1331.3,359.6L1329.7,354.0L1326.2,352.4L1315.9,355.8L1310.2,354.3L1305.4,351.3L1302.9,349.5L1299.1,348.4L1290.5,335.5L1287.4,335.9L1285.2,334.4L1285.7,333.8L1285.2,334.1L1283.1,336.5L1279.2,336.8L1279.8,339.0L1278.5,340.2L1279.8,340.7L1284.4,350.0L1291.3,355.4L1290.6,355.7L1291.2,356.6L1291.4,358.5L1291.0,359.3L1295.1,365.9L1294.8,362.2L1296.8,358.7L1298.3,359.0L1299.4,360.3L1299.0,362.2L1299.5,364.9L1298.1,367.2L1298.4,368.5L1299.7,368.6L1301.3,370.4L1303.2,370.4L1307.5,369.5L1314.7,368.9L1326.6,357.3L1326.3,361.5L1326.4,364.8L1328.6,368.5L1333.3,371.4L1340.1,373.7L1344.1,378.3L1345.8,379.2L1345.5,380.3L1337.4,390.6L1336.7,389.9L1336.4,389.5L1335.1,390.8L1334.6,392.1L1333.8,395.0L1334.0,398.5L1327.9,400.7L1325.7,404.3L1320.0,406.3L1319.6,408.7L1317.3,409.8L1312.7,410.1L1304.3,413.0L1302.8,415.5L1302.3,417.5L1285.5,423.6L1282.7,426.2L1278.9,426.4L1275.1,428.6L1270.9,429.7L1265.5,430.7L1261.9,433.3L1256.0,433.9L1253.9,433.0L1252.9,428.5L1250.7,420.8L1249.6,419.0L1250.2,418.7L1249.8,412.0L1246.0,405.9L1241.3,399.7L1237.9,393.8L1232.3,389.9L1229.4,385.4L1228.8,377.6L1224.8,370.8L1220.0,367.8L1218.8,365.4L1217.2,361.1L1206.8,347.4L1204.2,347.1L1205.9,339.6L1201.0,348.8L1196.3,344.0L1192.3,337.5L1191.8,339.3L1193.1,341.3L1194.0,343.5L1198.3,349.6L1201.1,356.0L1208.6,368.8L1209.9,370.6L1209.6,374.4L1210.9,376.8L1216.9,381.6L1218.1,385.3L1219.1,386.8L1218.5,387.8L1219.1,393.9L1220.6,399.8L1226.6,404.0L1232.1,417.9L1233.4,419.7L1234.3,418.6L1236.2,421.0L1242.7,425.1L1247.6,429.8L1248.6,430.8L1251.1,433.1L1251.9,433.7L1253.6,436.6L1248.9,440.5L1252.7,440.5L1259.1,446.5L1264.4,445.2L1268.2,444.4L1273.6,443.7L1276.4,442.3L1288.5,440.7L1293.2,439.2L1297.2,438.6L1296.5,446.5L1297.8,446.1L1297.7,446.6L1295.6,447.5L1294.4,453.1L1289.2,462.0L1283.0,474.2L1276.6,482.7L1267.1,492.0L1258.8,497.2L1253.9,501.5L1245.3,510.9L1241.6,515.9L1239.5,517.0L1236.7,519.3L1235.7,520.1L1234.4,523.8L1230.9,531.0L1230.1,531.3L1228.0,539.8L1231.7,545.0L1230.4,548.7L1230.7,551.3L1231.0,553.9L1232.3,557.8L1233.7,561.2L1237.6,565.1L1237.1,569.2L1237.7,576.6L1237.6,577.9L1238.5,585.9L1238.8,588.3L1236.2,593.5L1233.1,597.4L1228.6,600.4L1223.7,601.9L1217.9,605.5L1213.8,610.5L1210.0,612.5L1205.8,616.2L1204.8,615.9L1205.1,620.4L1207.9,627.1L1208.5,631.0L1209.2,629.1L1209.4,630.6L1207.8,642.1L1199.9,645.7L1194.9,648.0L1193.6,649.9L1193.2,651.4L1193.9,652.0L1194.8,652.3L1194.5,655.7L1191.2,665.6L1184.9,671.0L1177.4,681.3L1165.8,690.7L1158.3,694.4L1153.9,694.9L1153.0,695.9L1149.7,696.1L1145.7,696.1L1135.8,696.1L1130.9,697.9L1124.7,698.6L1121.8,700.1L1118.4,699.0L1116.3,697.7L1115.6,697.4L1115.0,696.2L1113.6,696.7L1113.3,697.4L1112.9,696.2L1112.7,693.1L1110.4,688.8L1112.4,688.2L1112.9,686.1L1111.9,682.6L1106.4,673.9L1102.5,665.7L1095.8,658.0L1094.7,653.3L1093.8,650.7L1092.9,644.1L1091.3,639.9L1090.4,629.5L1084.5,620.2L1079.2,610.2L1075.8,604.6L1076.5,593.5L1082.4,578.1L1083.9,576.0L1087.4,571.3L1087.6,566.3L1082.9,555.4L1085.1,553.4L1083.5,548.7L1080.3,542.0L1079.0,539.2L1083.0,537.7L1079.9,538.7L1078.5,537.3L1078.0,534.2L1075.5,529.9L1064.6,518.8L1065.9,519.0L1063.8,517.9L1062.4,515.6L1062.4,515.3L1062.3,514.2L1063.0,513.5L1062.1,513.3L1062.3,512.5L1060.2,511.0L1059.1,508.5L1061.3,508.2L1062.4,505.3L1062.6,503.3L1065.1,504.3L1065.8,503.8L1063.1,503.0L1062.4,501.6L1064.0,501.5L1063.4,498.7L1062.9,497.7L1064.9,493.4L1065.6,486.8L1063.8,483.6L1064.6,483.2L1064.3,482.1L1062.5,483.0L1060.4,481.3L1059.9,479.3L1058.8,479.5L1057.9,479.3L1058.0,478.3L1056.2,477.5L1055.0,479.4L1052.5,479.4L1052.2,478.9L1050.4,479.1L1049.8,478.7L1049.4,480.3L1048.5,480.1L1048.1,478.9L1047.9,480.6L1046.8,480.6L1045.1,480.7L1044.9,480.4L1043.5,480.7L1040.2,476.2L1040.5,474.9L1040.2,474.7L1039.3,473.7L1040.4,473.4L1038.7,472.9L1033.2,469.0L1029.6,468.8L1029.7,468.4L1025.6,469.2L1016.7,470.8L1014.2,472.7L1009.3,473.8L998.3,478.3L992.0,476.1L993.0,476.1L991.8,475.1L988.3,475.7L980.1,475.9L978.8,476.4L967.0,480.5L958.8,476.6L951.5,470.4L943.1,464.7L940.0,463.2L939.8,461.5L937.7,460.9L936.9,459.0L935.6,457.4L937.1,457.2L937.6,456.4L935.8,456.2L936.2,455.1L933.9,451.5L933.4,450.9L933.1,449.3L928.0,445.8L927.6,445.0L926.7,443.5L925.5,444.2L925.3,442.5L924.6,442.4L923.6,441.8L924.4,440.1L925.1,439.6L923.0,439.2L923.2,438.5L925.2,437.8L920.8,438.1L918.4,437.4L918.5,436.3L916.0,434.7L917.7,434.2L915.9,433.9L916.5,429.4L918.7,430.4L923.4,429.3L917.2,429.5L916.1,426.7L916.5,426.2L915.7,425.9L913.1,422.5L912.3,422.0L915.5,419.2L917.2,416.1L918.3,410.0L920.1,404.6L918.5,397.5L917.6,396.2L917.7,395.7L918.3,390.4L915.0,386.5L914.6,385.1L915.8,380.7L918.5,376.9L921.4,371.5L920.5,371.8L921.5,370.6L926.6,365.4L927.5,361.6L929.7,357.4L934.3,354.2L938.2,348.0L945.9,345.7L953.8,338.7L955.8,334.2L954.8,331.9L955.7,327.1L957.9,324.1L960.4,320.3L967.6,316.2L972.1,313.5L977.7,304.0L980.0,303.8L982.9,307.0L985.7,307.7L992.8,306.8L993.4,306.6L994.7,307.9L1000.6,307.6L1007.6,303.8L1010.3,303.6L1012.9,301.5L1021.1,299.8L1036.7,298.0L1040.4,299.2L1046.9,297.4L1050.6,297.6L1051.7,297.1L1055.6,297.9L1060.8,296.5L1064.8,295.5L1065.5,296.4L1067.2,297.2L1069.0,298.6L1072.0,297.0L1072.0,298.3L1068.9,302.8L1071.7,305.5L1071.5,308.4L1066.3,313.4L1068.7,316.1L1070.1,316.4L1070.8,316.9L1072.2,316.7L1073.0,318.5L1079.7,320.8L1086.0,320.8L1095.7,323.7L1098.8,329.0L1110.7,331.9L1117.3,335.2L1122.3,332.2L1123.1,330.6L1122.1,325.4L1124.3,323.0L1131.9,320.2L1139.8,322.9L1143.5,324.6L1150.0,325.7L1152.4,328.2L1158.5,328.2L1162.9,328.9L1173.6,332.0L1179.8,329.3L1181.5,328.4L1183.3,328.1L1182.3,328.8L1184.1,328.2L1185.0,327.8L1187.3,328.5L1189.4,328.2L1190.0,329.1L1188.9,328.7L1189.0,329.7L1190.7,330.4L1191.4,329.6L1193.4,330.6L1201.8,329.4L1204.6,326.0L1210.9,311.8L1211.9,310.7L1211.1,303.8L1211.4,302.1L1211.3,300.7L1213.1,298.8L1212.3,297.9L1207.4,299.4L1204.2,298.6L1198.1,302.2L1192.6,302.4L1188.3,299.6L1183.7,298.2L1181.5,300.0L1180.5,301.6L1174.7,301.5L1172.1,299.2L1168.2,299.1L1164.0,299.0L1167.9,297.2L1162.9,296.9L1164.4,296.0L1161.9,293.5L1162.9,292.4L1162.4,291.9L1157.8,289.7L1158.8,288.2L1159.8,289.5L1161.3,289.3L1160.3,287.6L1161.3,286.6L1159.9,284.3L1160.5,283.0L1156.4,283.2L1157.6,280.4L1161.6,278.3L1165.9,278.6L1165.8,277.7L1167.1,277.8L1168.7,278.3L1173.0,278.2L1173.0,276.9L1177.5,276.3L1173.2,275.1L1174.5,273.7L1185.9,274.1L1192.6,270.4L1201.9,269.5L1207.2,269.4L1208.1,270.9L1211.6,270.9L1213.0,272.6L1214.9,273.5L1217.6,273.4L1226.3,275.3L1233.4,275.0L1238.3,274.3L1242.9,272.0L1243.8,268.5L1240.8,264.7L1231.7,259.6L1226.8,256.3L1215.5,251.5L1216.6,250.6L1217.5,250.3L1219.1,250.8L1221.4,250.1L1221.4,248.8L1223.3,246.6L1224.0,246.9L1225.0,245.5L1222.2,243.9L1222.5,243.3L1226.0,242.8L1230.5,240.9L1229.0,239.8L1219.5,241.7L1215.9,242.6L1208.6,244.7L1206.5,246.3L1208.0,245.1L1206.7,245.4L1205.5,246.5L1205.9,247.6L1208.5,250.5L1214.9,250.8L1213.3,252.4L1208.4,252.6L1199.4,255.9L1197.8,254.8L1197.4,251.4L1194.2,249.2L1198.7,246.7L1198.0,246.4L1191.4,246.2L1188.3,245.1L1188.7,244.3L1188.0,243.8L1191.9,244.0L1191.5,243.7L1189.2,242.5L1188.6,240.8L1188.3,243.3L1186.7,242.7L1182.7,244.2L1179.4,247.7L1176.1,248.7L1176.7,251.0L1175.9,253.4L1173.2,253.6L1172.6,252.5L1172.1,253.0L1171.9,255.3L1170.8,258.2L1169.7,261.5L1167.3,262.2L1166.1,265.3L1165.1,267.1L1169.1,272.3L1172.9,274.2L1171.5,275.1L1167.6,274.6L1163.9,275.8L1157.2,279.8L1157.9,278.4L1159.1,277.1L1156.3,276.7L1150.3,275.1L1143.2,276.8L1144.3,278.3L1146.0,279.3L1143.1,278.9L1144.7,280.4L1143.7,280.4L1141.2,279.3L1142.7,280.9L1140.9,280.1L1138.2,277.8L1138.0,277.3L1137.0,278.2L1138.1,281.7L1140.3,285.6L1138.2,284.7L1138.7,286.5L1137.0,287.0L1141.1,288.8L1144.9,292.0L1144.5,293.6L1141.9,291.6L1139.3,292.5L1141.8,294.9L1139.6,295.3L1137.7,295.2L1139.7,300.5L1136.9,298.6L1135.5,300.1L1133.5,297.3L1132.0,298.2L1131.1,296.3L1131.0,294.4L1128.6,292.2L1130.4,290.6L1133.2,290.0L1138.6,292.0L1139.9,290.8L1135.6,289.6L1130.0,289.5L1129.7,289.4L1128.2,289.0L1126.6,286.6L1128.7,286.6L1128.2,286.0L1126.2,286.0L1123.3,283.1L1119.3,279.4L1118.6,278.3L1119.1,277.9L1118.8,276.1L1119.2,270.1L1114.3,266.8L1106.1,263.6L1109.1,264.3L1103.1,261.1L1099.5,260.5L1094.9,256.7L1096.3,256.3L1093.6,254.1L1092.1,251.2L1090.7,250.6L1087.1,252.5L1086.2,249.6L1086.1,248.2L1078.7,250.4L1080.1,253.1L1079.0,255.7L1080.1,257.4L1086.8,261.5L1089.6,266.5L1093.4,269.0L1100.8,270.4L1099.8,272.5L1111.2,277.4L1113.7,280.0L1112.2,281.4L1108.1,278.8L1105.6,277.7L1104.3,278.7L1103.1,282.6L1106.1,285.4L1105.9,286.6L1102.9,287.8L1101.4,290.4L1098.2,292.1L1098.1,290.3L1099.6,287.8L1100.4,286.0L1097.5,280.3L1093.8,279.1L1092.0,276.9L1091.1,276.5L1088.8,275.7L1086.7,273.5L1083.2,273.5L1074.5,267.3L1072.3,267.0L1071.4,265.2L1069.0,263.4L1066.4,258.0L1058.0,256.2L1053.4,259.2L1043.8,263.2L1037.9,261.3L1034.7,261.2L1031.9,260.6L1027.7,263.3L1027.3,266.0L1028.1,267.9L1027.7,270.1L1018.8,273.8L1014.5,276.0L1014.8,276.7L1012.0,278.8L1008.2,283.8L1009.8,286.8L1010.8,287.9L1006.9,290.6L1005.4,293.4L1005.7,294.0L999.9,296.1L997.7,298.8L985.1,299.1L980.7,300.9L977.4,302.5L974.0,298.9L974.5,297.9L973.6,297.6L971.1,296.2L965.4,297.4L961.0,297.0L959.9,296.5L960.5,292.5L961.0,289.1L958.3,289.3L958.5,287.9L960.2,285.8L958.1,287.8L956.8,287.0L957.7,284.0L960.3,279.7L961.4,274.5L960.4,271.0L960.2,270.3L960.3,269.7L960.8,268.2L961.0,267.7L959.6,266.0L959.3,265.6L959.3,264.8L958.2,263.5L959.0,262.5L963.7,261.3L964.3,260.2L967.4,259.6L971.3,260.4L978.2,260.5L999.7,261.5L1002.4,258.0L1003.4,254.4L1003.5,253.8L1004.7,249.9L1006.7,252.2L1005.1,249.5L1003.2,248.2L1004.2,248.2L1003.0,245.1L999.2,243.0L998.3,241.7L998.6,239.7L998.9,239.5L995.8,239.1L996.1,238.4L994.3,238.3L994.0,237.8L985.5,236.4L984.0,235.2L985.1,234.4L984.6,233.9L985.9,233.7L983.4,233.4L984.6,232.2L993.1,231.2L996.3,232.0L1001.7,231.8L1000.4,226.2L1002.9,226.7L1004.6,227.8L1009.9,228.2L1012.5,227.4L1010.6,226.9L1013.5,225.2L1017.9,223.9L1018.7,222.8L1019.0,219.8L1020.7,218.9L1030.1,216.6L1033.2,216.6L1029.6,215.6L1033.8,216.0L1033.5,215.4L1032.3,214.1L1035.6,210.7L1036.8,207.9L1043.0,205.5L1048.8,205.5L1050.1,205.8L1049.7,204.9L1050.9,203.8L1054.9,203.7L1056.0,205.2L1057.4,204.5L1057.9,204.5L1059.9,202.9L1062.3,203.0L1064.0,204.2L1060.0,202.0L1059.7,200.3L1058.4,200.0L1059.8,198.7L1058.6,196.5L1056.8,193.5L1055.9,191.3L1056.2,187.3L1058.9,187.7L1060.9,186.3L1061.7,186.2L1060.5,185.1L1058.3,186.8L1056.4,186.5L1059.4,184.5L1063.6,183.9L1067.6,181.7L1068.8,181.5L1068.6,184.2L1068.3,187.7L1071.1,188.8L1069.1,189.7L1067.9,189.6L1067.0,191.6L1065.9,191.8L1064.0,194.1L1063.3,195.7L1063.7,196.2L1066.3,198.7L1066.9,199.3L1072.1,200.4L1071.3,202.0L1074.3,202.2L1081.7,199.5L1083.8,200.4L1087.6,201.9L1088.7,203.3L1091.8,203.8L1090.5,202.8L1088.0,202.3L1088.8,201.8L1092.6,201.9L1101.1,200.1L1104.7,198.7L1111.5,197.3L1115.5,198.4L1114.3,199.1L1116.5,200.0L1119.8,199.6L1121.9,197.8L1122.8,196.6L1127.0,195.1L1128.5,193.2L1126.0,196.6L1129.1,195.8L1128.2,186.2L1133.1,181.8L1136.9,181.5L1144.3,185.1L1146.9,183.3L1146.5,180.3L1146.9,177.4L1144.7,177.8L1143.0,177.1L1142.0,175.5L1142.0,175.2L1141.8,174.2L1142.6,172.6L1147.9,171.4L1153.2,170.8L1153.7,170.4L1167.1,171.3L1167.8,169.5L1169.5,169.8L1176.5,168.6L1179.2,168.9L1175.9,167.2L1171.7,166.5L1170.0,165.6L1170.4,164.7L1168.1,165.1L1158.8,165.7L1158.7,165.2L1157.0,166.1L1155.9,165.9L1154.3,166.8L1138.9,169.3L1139.9,168.1L1138.2,167.3L1135.9,167.9L1136.6,166.2L1130.1,164.8L1130.4,162.0L1130.9,159.0L1129.5,156.5L1128.8,154.8L1128.5,153.2L1131.0,150.9L1132.3,150.2L1135.2,149.6L1135.0,148.9L1137.7,147.7L1142.7,145.1L1148.4,141.4L1151.9,140.7L1152.3,139.9L1151.9,138.9L1151.6,137.2L1147.9,136.0L1148.0,135.5L1138.6,135.9L1135.5,135.5L1133.9,136.8L1130.8,138.3L1131.0,138.8L1130.3,138.7L1130.2,140.2L1129.0,141.5L1130.6,143.6L1126.0,146.9L1114.2,150.8L1113.8,151.6L1112.4,152.3L1111.4,152.7L1110.4,152.5L1110.7,153.9L1107.5,154.7L1108.5,155.9L1107.6,158.3L1107.3,158.8L1106.2,159.9L1107.4,164.7L1111.1,165.5L1114.0,167.5L1116.4,169.7L1110.9,172.1ZM1294.4,241.6L1286.9,244.2L1283.9,246.3L1283.2,246.7L1283.2,247.5L1280.8,248.1L1276.9,248.9L1276.7,249.1L1272.3,255.8L1275.8,258.1L1276.9,259.0L1277.2,259.2L1276.5,263.7L1278.0,265.7L1288.1,276.5L1291.9,278.0L1291.4,278.7L1287.6,280.1L1286.7,284.3L1284.1,287.2L1285.9,294.0L1291.5,295.3L1296.8,298.8L1302.8,299.5L1312.5,297.8L1311.7,298.4L1313.1,298.2L1312.0,291.5L1312.0,286.1L1309.3,284.3L1308.1,284.2L1309.1,283.0L1310.7,282.8L1309.9,280.9L1307.1,281.1L1307.2,281.5L1306.2,277.5L1307.4,275.2L1313.5,276.6L1317.0,275.6L1316.8,274.3L1313.2,271.3L1311.9,268.7L1310.2,268.7L1306.3,271.0L1306.4,273.6L1304.4,269.1L1304.9,264.8L1301.2,264.5L1299.1,262.8L1297.8,262.4L1297.7,260.7L1294.9,256.8L1292.0,255.5L1294.2,254.6L1298.9,254.9L1296.4,252.6L1299.2,250.6L1307.9,250.2L1306.8,248.1L1308.0,244.6L1308.2,242.7L1305.6,241.5L1302.3,242.2L1295.7,241.0L1294.4,241.6Z";
const BORDER_PATH = "M1279.2,460.1L1284.6,451.3L1284.6,441.8M1279.2,460.1L1262.0,477.5L1254.3,477.8L1250.9,480.1L1250.1,480.9L1245.2,482.4L1245.0,482.7M1202.2,329.9L1203.5,327.8M1209.5,323.2L1206.8,322.9L1206.2,325.0L1206.3,326.5L1207.2,326.9L1205.9,329.1L1208.9,328.4M1207.0,319.4L1209.2,319.2L1209.8,318.5M1210.8,321.3L1211.1,317.5M1200.8,308.2L1197.8,308.6L1197.0,307.7L1193.6,307.7M1446.5,305.8L1447.9,306.1L1448.1,307.9L1450.6,311.1L1453.1,312.8L1451.9,314.9L1452.8,317.7M1442.3,308.0L1439.3,310.1L1434.2,311.4L1432.6,311.0M1524.2,349.2L1529.9,348.2L1531.2,346.6L1532.9,345.5L1535.6,344.0L1539.2,342.0L1541.2,340.6L1545.4,342.0L1548.0,340.3L1549.8,340.7L1550.6,341.1L1549.7,341.9L1550.6,342.1L1551.4,344.5L1550.5,345.7L1552.3,345.4L1556.1,346.7M1730.3,288.3L1727.7,290.1L1722.7,290.4L1720.6,293.0M961.3,349.8L960.5,350.1L960.1,352.9L956.8,353.2L954.4,354.3L949.2,353.4L946.3,354.7L946.0,355.8L944.0,358.6L942.2,359.6L939.9,366.0L936.7,368.1L934.9,370.7L931.8,372.5L929.9,380.2L928.0,382.6L926.7,384.6L914.6,384.8M1211.6,479.1L1210.6,477.2L1209.0,474.6L1208.0,474.8L1207.9,474.2M310.0,232.9L318.7,233.8L318.6,231.8L319.7,231.1L318.1,230.1M1524.2,349.2L1524.0,348.2L1521.9,347.5L1520.4,347.9L1516.9,347.2M1142.5,215.9L1143.5,215.3L1145.4,215.1L1147.4,213.9L1155.5,213.7L1163.0,215.4L1165.7,216.1L1168.7,215.6L1171.6,216.0L1173.5,215.4L1175.4,216.5L1179.6,216.3L1181.6,217.0L1181.9,214.5L1184.4,212.8L1188.2,212.7M1211.1,317.5L1209.8,318.5M1211.1,317.5L1212.1,316.5L1212.1,315.4L1214.0,315.0L1214.0,314.2L1214.8,311.8L1213.8,311.3L1213.7,310.4L1211.9,310.7M1204.6,572.4L1204.5,572.9L1204.6,572.4M1460.1,268.3L1460.3,264.9L1461.9,264.2L1461.7,263.2L1463.1,262.6L1460.9,257.1L1461.4,253.9L1458.6,252.8L1468.8,250.8L1470.1,251.6L1473.2,251.6L1473.4,250.0L1472.1,248.7L1476.2,240.1L1481.4,241.4L1485.4,241.6L1486.1,242.2L1489.9,240.7L1490.5,239.0L1490.1,235.4L1491.6,233.4L1496.3,232.1L1497.5,229.5L1500.0,229.6M1141.8,202.3L1147.4,202.4L1153.1,200.5L1153.5,201.2L1154.6,201.0L1153.5,199.9L1155.7,196.7L1160.2,194.7L1158.5,194.3L1159.2,192.6M710.5,694.3L709.6,693.7L709.7,690.8L711.3,688.1L708.9,686.2L708.1,684.8L704.9,683.1L702.0,681.1L700.0,680.2L698.0,678.1L696.9,679.1M1664.7,225.4L1659.7,233.1L1658.9,234.6L1658.4,236.0L1659.3,236.8L1660.9,237.3L1662.7,236.5L1665.9,236.5L1668.7,237.5L1671.2,235.7L1675.3,236.0L1682.0,240.8L1681.9,243.4L1676.5,242.7L1670.3,244.0L1668.8,243.7L1668.0,244.9L1663.8,245.7L1661.5,248.6L1658.3,250.0L1652.6,250.5L1646.9,253.8L1637.0,252.7L1635.2,256.3L1637.8,259.9L1632.3,262.3L1628.8,265.2L1622.3,266.9L1608.7,267.9L1598.4,271.3L1595.3,270.2L1590.5,270.1L1582.2,268.1L1578.5,266.3L1553.3,265.1L1550.6,265.1L1547.8,261.6L1545.7,258.2L1544.9,257.5L1543.3,256.7L1533.5,252.6L1519.8,251.0L1519.0,248.4L1520.6,246.3L1520.2,245.1L1520.6,243.5L1516.8,237.5L1511.2,235.5L1509.2,235.4L1507.0,233.9L1506.1,233.4L1503.6,232.4L1503.9,231.5L1502.4,230.5L1502.9,229.9L1502.7,229.1M1087.5,231.4L1080.9,227.5L1079.9,225.6L1079.9,224.7L1077.9,222.7L1079.0,223.3L1080.9,222.2L1090.7,219.3L1090.6,218.7L1093.1,219.6M1163.5,182.2L1157.6,181.8L1154.7,180.3L1151.8,179.4L1146.5,180.3M1163.5,182.2L1166.2,183.8L1165.2,186.0L1166.4,186.2L1167.7,187.9L1167.9,190.0M1128.1,190.4L1135.5,188.6L1146.7,189.2L1149.7,188.5L1151.4,189.8L1159.2,192.6M1125.7,117.6L1123.8,118.2L1123.6,119.7L1122.5,121.3L1121.5,121.4L1111.9,120.5L1111.7,122.7L1108.6,123.2L1106.3,123.3L1103.1,125.5L1101.4,127.3L1101.1,129.2L1096.3,133.3L1092.0,135.0L1090.9,138.8L1087.8,143.0L1089.2,143.7L1088.9,145.4L1081.2,146.1L1078.5,148.7L1078.1,151.0L1079.0,155.9L1079.0,159.1L1082.0,161.5L1080.0,162.5L1079.1,163.3L1080.4,166.3L1079.6,168.1L1076.7,169.6L1075.6,170.8L1075.9,173.1L1074.8,174.5L1073.0,173.4L1071.2,174.2M1125.7,117.6L1128.4,117.5L1128.6,116.4L1131.3,116.3L1136.3,119.4L1141.7,119.6L1144.7,119.0L1150.8,119.9L1154.6,117.4L1155.0,115.8L1156.8,113.8L1159.2,112.6L1166.5,111.9L1174.6,115.2L1171.8,117.2L1172.5,117.7M1595.9,446.6L1598.6,445.6L1600.1,443.9L1603.7,443.7L1605.5,443.7L1605.3,442.8L1604.0,441.2L1604.2,439.6L1605.4,439.1L1607.1,439.4L1607.6,437.9L1613.4,435.2L1613.4,430.8L1613.7,429.1L1612.4,424.7L1613.3,422.5M620.0,603.2L621.2,605.8L622.3,606.4L623.2,611.8L625.7,614.2L624.5,615.8L625.1,617.5L624.2,617.9L624.3,619.8L625.7,620.8L625.4,622.4L627.3,625.3L629.5,633.3L633.0,633.1M620.0,603.2L618.1,604.8L616.9,607.6L614.9,607.9M1045.6,227.5L1046.1,225.5L1044.3,224.3L1044.3,223.8M1024.2,218.3L1025.9,220.5L1027.7,220.2L1028.6,221.6L1030.4,221.9L1030.9,222.6L1033.4,223.2L1033.4,224.7L1036.1,224.4L1037.3,223.7L1037.7,225.6L1041.1,227.2L1042.5,227.0M1044.3,223.8L1042.9,224.0L1042.2,225.1L1042.9,226.6L1042.5,227.0M1270.5,269.9L1266.1,268.0L1266.2,266.4L1261.7,265.1L1260.8,265.4L1255.5,266.0L1254.8,264.8L1249.4,262.8L1242.6,262.2L1237.4,260.8L1234.9,260.6L1234.3,261.4M1127.6,275.8L1125.9,274.6L1125.0,273.1L1125.4,270.0M1125.4,270.0L1124.5,267.8L1122.6,266.3M1242.9,272.0L1248.5,272.3L1250.1,271.8L1253.7,274.3M1577.5,384.0L1578.3,386.1L1581.2,385.8L1580.6,382.2L1579.9,380.0L1581.0,378.8L1583.0,379.4M1423.2,283.6L1424.7,282.8L1424.4,281.5L1425.3,280.2L1429.9,278.6L1430.1,277.8L1434.1,277.2L1435.7,278.9L1438.7,278.4L1442.0,274.7L1449.6,273.4L1455.3,270.6L1460.2,269.1L1460.1,268.3M1253.7,274.3L1262.5,273.3M1460.1,268.3L1457.8,266.9L1455.3,266.3L1453.6,265.0L1441.7,263.9L1431.1,264.3L1426.3,262.6L1422.1,265.4L1421.9,267.0L1412.5,264.7L1409.3,265.6L1407.8,267.7L1408.1,267.9M693.1,494.1L688.1,494.1L684.0,496.5L682.5,496.3L681.2,497.8L679.7,498.2L677.2,496.8L674.7,494.0L674.2,491.9L673.4,489.5L674.8,484.4L675.8,482.8L674.8,480.2L672.5,479.4L672.9,476.1L672.3,475.6L669.2,475.8M1057.1,195.8L1058.7,196.9L1064.7,197.4M1063.4,335.4L1065.7,334.3L1067.5,331.8L1067.0,328.0L1067.8,327.1L1074.7,322.8L1074.6,318.8M1262.5,273.3L1263.6,274.2L1263.1,274.6L1265.8,275.9L1264.6,277.0L1265.7,278.2L1267.9,279.6L1267.3,280.5L1266.2,280.8L1270.8,283.3L1270.2,283.9L1271.2,285.0L1270.4,285.2L1270.9,286.7M1261.2,282.2L1262.9,282.0L1263.9,282.8L1267.0,283.4L1268.8,286.9M1123.6,246.3L1128.7,245.2L1133.7,238.3L1138.4,236.0M1408.2,279.2L1412.7,279.5L1415.1,278.0L1416.2,278.2L1417.2,277.6L1420.4,275.9L1415.0,274.6L1414.6,273.9L1413.2,273.2L1412.0,271.9L1410.1,274.1L1406.9,272.7L1406.4,272.4L1403.8,271.9L1409.7,268.3L1408.1,267.9M1115.7,227.2L1118.0,227.2L1119.3,226.8L1121.0,228.3L1121.1,229.0L1122.8,228.5L1124.9,227.9L1131.8,227.9L1136.5,229.6M969.5,195.9L967.3,197.8L965.6,198.2L966.3,198.8L965.6,200.3L968.9,201.3L971.1,199.9L973.3,201.7L975.1,201.5M1115.7,227.2L1113.9,225.0L1108.7,223.7L1109.1,222.8L1104.7,222.1L1104.8,223.3L1103.1,223.8L1101.1,221.9L1102.1,221.2L1100.2,220.9L1094.1,218.8L1093.6,219.6L1093.1,219.6M1408.2,279.2L1405.3,280.3L1401.5,279.7L1399.9,280.2L1399.6,281.1L1398.7,281.0L1398.5,281.9L1399.4,283.2L1406.0,282.9L1408.4,283.9L1411.2,282.9L1412.9,284.6L1414.5,284.4L1415.4,285.0L1417.6,284.0L1423.2,283.6M1122.2,282.2L1123.7,282.2L1124.4,281.4L1124.1,280.6L1126.0,279.7L1128.0,276.9L1127.6,275.8M1196.3,583.6L1195.1,583.6L1193.8,581.0L1195.0,578.8L1195.3,575.9L1197.9,574.2L1196.9,571.7L1196.7,569.0L1197.1,567.2L1196.8,565.9L1198.7,563.9L1197.1,560.9L1196.9,560.1L1196.0,558.9L1195.1,558.7L1194.7,557.8M1134.2,233.4L1136.5,229.6M945.4,466.2L950.4,460.7L952.3,457.4M1145.5,456.4L1146.8,458.7L1150.3,460.3L1151.6,462.1L1152.4,463.9L1157.6,468.8L1159.2,471.2L1162.5,473.2L1163.4,475.9M1250.8,443.3L1252.7,440.5M1250.8,443.3L1244.4,442.2L1244.6,439.2L1247.8,435.0M1175.0,530.0L1174.6,533.0L1176.1,537.4L1175.6,539.6L1176.0,540.9L1180.1,545.4L1182.5,551.0M1247.8,435.0L1250.0,435.3L1250.6,434.2L1251.9,433.7M1087.5,231.4L1089.6,232.4L1092.5,231.9L1095.0,230.2L1101.0,231.5L1103.1,231.3L1105.1,232.3M1247.7,296.8L1250.5,295.5L1257.8,295.8L1258.7,297.3L1261.2,296.6M1100.3,242.0L1102.4,241.2L1102.7,239.0L1103.4,237.9L1102.4,237.4L1105.6,237.0L1106.2,235.6M1049.4,247.3L1054.1,247.2L1057.3,244.5L1058.1,246.0L1060.8,247.6L1062.2,244.1L1063.8,245.2L1065.8,244.9L1066.9,245.5L1066.9,243.4L1068.6,243.6L1068.7,242.0M1068.7,242.0L1067.1,242.1L1063.8,241.0M1261.2,296.6L1260.9,295.4L1260.1,294.5L1260.0,293.2L1258.2,292.0L1259.3,289.8L1258.5,289.4L1258.2,286.9L1257.1,284.0L1259.4,282.4L1261.0,282.3L1261.5,282.5M1141.8,202.3L1140.6,200.7L1137.7,200.0M1182.5,551.0L1184.4,553.3L1186.5,553.6L1189.8,555.9L1194.7,557.8M1050.4,206.0L1049.4,209.7L1047.6,209.9L1049.5,211.4L1047.7,212.9L1048.0,213.6L1043.4,214.6L1044.7,216.5L1043.4,218.5L1042.9,218.8L1043.6,220.2M1063.8,241.0L1063.5,239.8M962.4,462.6L964.0,462.4L965.0,459.3L963.7,457.8L963.9,457.4L966.8,457.0L965.4,455.2L966.2,453.9L965.7,452.8L965.3,452.2L964.3,450.7L964.3,448.8L965.2,448.0M1052.0,259.4L1052.6,257.2L1050.1,257.0L1048.6,255.9L1049.1,253.4L1047.2,251.8L1049.9,250.5L1048.1,248.1L1049.4,247.3M1172.5,117.7L1169.7,118.5L1171.5,118.9L1169.8,120.7L1171.0,122.4L1175.7,123.8L1178.0,126.0L1173.2,129.9L1178.9,136.2L1177.3,137.1L1176.2,139.0L1177.3,139.7L1176.3,140.8L1179.0,142.0L1178.6,143.4L1181.2,144.8L1181.2,145.8L1178.6,147.6L1185.3,150.7L1186.4,152.8L1181.5,156.4L1165.6,165.8M1183.2,113.4L1182.8,114.9L1179.2,114.3L1178.3,115.6L1174.7,116.3L1172.5,117.7M1319.7,377.6L1321.7,370.4L1324.2,369.8L1323.1,368.4L1323.2,365.2L1324.3,365.2L1324.8,366.1L1326.4,364.8M1282.5,270.2L1277.0,273.7L1274.9,272.4L1272.0,270.3L1270.5,269.9M703.5,491.9L701.4,490.5L696.4,491.0L695.9,490.9L695.4,492.4L696.0,494.6L693.1,494.1M1270.5,269.9L1269.2,271.4L1271.8,273.6L1270.7,274.6L1263.7,272.6L1262.5,273.3M946.1,435.4L945.8,432.1L944.5,429.9L943.4,430.0L942.4,427.9L942.3,424.9L941.1,421.9M703.5,491.9L706.5,492.9L708.4,491.9L713.3,492.3L715.1,490.6L716.7,486.8L720.2,482.2M1025.2,469.3L1026.3,454.2L1027.7,452.7L1028.8,449.9L1030.2,448.9L1030.2,446.9L1031.5,445.2L1029.6,440.5L1030.2,439.4M1083.4,531.0L1081.4,530.1L1077.4,533.1M1102.7,244.1L1101.5,244.0L1100.4,244.7L1097.6,245.9L1097.7,247.8L1095.7,248.5L1095.5,250.0L1092.7,249.6L1091.6,248.9L1090.1,249.8L1086.2,249.6M1116.1,247.3L1112.6,248.2L1109.4,247.9L1102.7,244.1M1123.6,246.3L1119.6,246.0L1116.1,247.3M1102.7,244.1L1100.3,242.0M1297.7,366.9L1295.8,367.0L1295.1,365.9M1151.7,604.8L1151.9,606.2L1155.7,611.5L1157.2,614.8L1162.7,618.0L1164.1,619.9L1165.4,620.2L1165.4,623.5L1167.4,626.0L1172.9,627.4L1173.1,628.7L1174.8,629.5M1446.5,305.8L1440.7,304.9M1167.2,269.5L1164.2,269.6L1161.3,269.2L1159.0,269.9L1157.7,270.9M1587.6,439.3L1586.3,436.2L1586.3,434.9L1585.1,433.0L1584.7,428.9L1589.7,424.5L1598.5,424.2L1599.6,425.2L1600.2,424.5M1508.8,351.7L1508.1,352.7L1508.9,353.9L1513.4,355.1L1517.5,354.3L1524.8,354.4L1526.6,354.0L1526.5,351.5L1523.9,350.4L1524.2,349.2M1593.9,497.8L1593.0,496.9L1591.9,496.9L1591.3,498.2M1571.8,468.9L1573.0,468.2L1577.1,470.4L1576.9,472.9L1577.6,473.3L1580.0,471.9L1580.8,472.6L1581.9,471.8L1582.9,470.0M1043.6,220.2L1045.6,222.2L1044.3,223.8M607.2,394.4L607.9,397.7L607.2,398.8L607.0,400.4L606.3,401.1L607.5,402.5L607.3,403.8M1088.9,431.6L1086.3,428.1M1271.1,341.7L1275.0,336.4L1279.2,336.8M1504.4,348.6L1507.3,347.4L1508.4,348.4L1508.1,351.1L1508.8,351.7M504.5,427.9L505.3,426.5L507.5,424.9L507.6,424.1L508.6,424.1M1706.0,557.4L1707.6,557.8L1708.3,556.6M1711.0,555.2L1711.2,555.9L1712.2,556.2L1711.2,556.9L1711.8,558.4M1656.1,477.5L1656.2,480.5L1655.4,477.5M1625.1,493.6L1624.7,494.6L1625.7,496.5L1630.7,500.1L1634.4,499.1L1638.0,498.8L1643.7,496.2L1644.4,497.0L1647.9,497.9L1649.7,496.8L1652.7,496.8L1654.2,493.7L1654.4,492.3L1656.3,490.6L1655.9,488.8L1658.0,487.4L1658.6,482.7L1660.1,480.6L1671.5,481.5M1068.7,242.0L1071.9,242.4L1074.2,241.4L1078.4,240.9L1078.8,242.2L1080.0,243.1L1086.9,244.0M1086.9,244.0L1085.2,245.6L1086.5,246.0L1085.7,247.0L1087.7,249.2L1087.0,249.2M1172.8,520.3L1173.8,519.7L1175.3,520.8L1177.1,520.5L1178.2,518.1L1181.4,518.5M1529.4,381.7L1529.6,385.7L1527.8,384.8L1527.3,386.0L1528.0,388.3M1018.0,266.0L1013.8,264.6L1012.1,265.4L1005.8,264.2L1001.7,263.3L1001.7,262.2L999.9,261.4M1018.0,266.0L1019.8,266.1L1019.6,266.5M1019.6,266.5L1021.8,267.2L1028.0,266.9M1018.0,266.0L1018.3,266.9L1019.6,266.5M1430.2,296.1L1431.4,294.9L1430.3,293.5L1429.4,288.9L1426.3,288.1L1425.1,288.8L1423.8,287.9L1424.1,286.2L1423.1,284.5L1423.2,283.6M1430.2,296.1L1427.3,296.6L1428.3,297.3M1127.6,275.8L1131.4,275.5L1134.2,274.2L1137.5,273.9L1138.6,273.1M1131.0,267.9L1126.4,269.2L1126.1,270.2L1125.4,270.0M1135.4,267.6L1131.0,267.9M1135.4,267.6L1136.4,266.6L1136.4,264.4L1137.9,263.8L1138.3,262.3L1135.5,258.9L1137.4,256.8M1138.6,273.1L1139.0,270.7L1135.4,267.6M1113.4,266.2L1113.9,266.9M1113.4,266.2L1109.1,264.3M1452.8,317.7L1453.9,318.6M1124.2,264.7L1126.8,262.4L1131.6,265.5L1132.1,265.7L1131.0,268.0M1124.2,264.7L1122.4,265.2L1122.6,266.3M1117.7,260.7L1124.2,264.7M508.6,424.1L510.3,424.6L513.7,427.3L515.8,426.7L517.7,427.3L517.3,429.8M519.9,432.2L522.1,431.8L522.5,430.6L523.5,430.3L523.3,427.8L526.1,427.0L527.5,426.6L529.0,427.1L531.9,424.3L533.8,421.9L536.1,422.8L543.4,420.9M587.6,505.6L581.8,502.5L580.2,503.6L575.6,502.6L573.3,500.4L567.5,496.8M686.8,486.1L684.5,481.2L685.4,477.4L688.5,476.7L689.1,473.9M706.5,486.3L707.0,484.7L705.1,481.8L704.3,477.4L706.1,474.9M682.2,695.5L682.5,690.8L683.8,689.7L683.4,687.2M686.8,674.4L685.6,677.3L684.3,683.3L683.7,684.5L683.4,687.2M703.5,648.5L706.3,648.3L707.8,649.5L708.6,652.9L707.5,657.4L702.1,659.9L697.2,663.5L697.3,664.3L696.3,664.4L686.8,674.4M1125.7,117.6L1134.5,120.8L1138.9,121.7L1142.6,123.8L1141.8,124.6L1141.7,126.5L1143.4,127.2L1142.9,128.7L1144.3,130.3L1142.9,133.0L1145.4,136.0L1145.3,137.4M1033.7,216.7L1031.5,217.6L1029.1,217.4L1028.8,216.7M1043.6,220.2L1041.7,219.6L1042.3,217.9L1038.6,216.9L1038.0,216.3L1033.7,216.7M1045.6,227.5L1048.0,229.2L1055.7,230.7L1053.7,232.6L1052.6,235.3L1052.7,238.0M1063.4,238.3L1057.7,237.0L1057.4,237.6L1058.0,237.8L1057.3,238.0L1052.7,238.0M1063.5,239.8L1063.6,238.4L1063.4,238.3M1063.8,241.0L1063.5,239.8M1049.4,247.3L1048.2,245.3L1046.9,244.4L1045.0,245.0L1043.7,246.1L1043.9,245.6L1045.3,243.1L1049.2,239.6L1049.6,238.5L1051.6,238.7L1052.7,238.0M968.4,296.4L968.6,293.0L970.9,290.7L968.8,289.0L970.5,285.6L968.2,282.3L971.2,280.9L970.6,279.4L971.7,278.4L971.2,274.7…62152 tokens truncated… 0;
    const name = known ? c.name : '█████████';
    const meta = known ? `Hub: ${c.hub} · ${(c.routeList||[]).length} routes · ${c.regionsEntered.length} regions` : 'Intel unavailable — enter their region';
    const cash = known ? `$${c.cash.toFixed(0)}M` : '$???';
    const paxLabel = known
      ? `~${monthEst.toLocaleString()} pass/mo`
      : '??? PASS';
    const initials = c.name.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return `<div class="competitor-row" onclick="showRivalModal(${i})">
      <div class="comp-head">
        <div class="comp-icon" style="background:${known?c.color:'#444444'}">${known?initials:'?'}</div>
        <div class="comp-name" style="color:${known?c.color:'var(--muted)'}">${name}</div>
        ${known?`<div style="font-size:11.3px;color:var(--muted);font-family:'DM Mono'">${cash}</div>`:''}
      </div>
      <div style="font-size:10.7px;color:var(--muted);margin-bottom:5px">${meta}</div>
      <div class="comp-bar"><div class="comp-fill" style="width:${pct}%;background:${known?c.color:'#444444'}"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:10.7px;color:var(--muted);margin-top:3px">
        <span>${paxLabel}</span>
        ${known?`<span style="color:${c.aggression>0.7?'var(--danger)':c.aggression>0.4?'var(--warn)':'var(--accent3)'}">${c.aggression>0.7?'🔴 HIGH':c.aggression>0.4?'🟡 MED':'🟢 LOW'} threat</span>`:''}
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--muted);font-size:11.3px;padding:8px">No rivals yet.</div>';
}
function showRivalRoutePopup(evt, rivalName, from, to) {
  evt.stopPropagation();
  const c = STATE.competitors.find(c=>c.name===rivalName); if(!c) return;
  const initials = rivalName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const routes = (c.routeList||[]);
  const routeCount = routes.length;
  const isHub = from === to;
  const mp = document.getElementById('map-container');
  const box = mp.getBoundingClientRect();
  const px = Math.min(evt.clientX - box.left, box.width - 220);
  const py = Math.min(evt.clientY - box.top,  box.height - 160);
  const old = document.getElementById('rival-popup');
  if (old) old.remove();
  const pop = document.createElement('div');
  pop.id = 'rival-popup';
  pop.style.cssText = `position:absolute;left:${px}px;top:${py}px;z-index:120;
    background:var(--surface);border:1px solid ${c.color||'var(--border2)'};
    border-radius:10px;padding:12px 14px;min-width:200px;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);font-family:'Inter'`;
  pop.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:32px;height:32px;border-radius:50%;background:${c.color||'#888'};display:flex;align-items:center;justify-content:center;font-size:13.6px;font-weight:700;color:#fff;flex-shrink:0">${initials}</div>
      <div>
        <div style="font-size:14.7px;font-weight:700;color:${c.color||'var(--text)'}">${rivalName}</div>
        <div style="font-size:11.3px;color:var(--muted)">Hub: ${c.hub}</div>
      </div>
      <button onclick="document.getElementById('rival-popup').remove()" style="margin-left:auto;background:none;border:none;color:var(--muted);cursor:pointer;font-size:15.8px;padding:0">✕</button>
    </div>
    ${!isHub ? `<div style="font-size:11.3px;color:var(--text);font-weight:600;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">
      ✈ ${from} → ${to}
      <span style="color:var(--muted);font-weight:400;margin-left:6px">${Math.round(getDistance(from,to)).toLocaleString()} mi</span>
    </div>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11.3px">
      <div><div style="color:var(--muted2);font-size:10.7px">VALUE</div><div style="color:var(--text);font-weight:600">$${c.value}M</div></div>
      <div><div style="color:var(--muted2);font-size:10.7px">ROUTES</div><div style="color:var(--text);font-weight:600">${routeCount}</div></div>
      <div><div style="color:var(--muted2);font-size:10.7px">PASS/MO</div><div style="color:var(--text);font-weight:600">${(c.pax||0).toLocaleString()}</div></div>
      <div><div style="color:var(--muted2);font-size:10.7px">STATUS</div><div style="color:var(--text);font-weight:600">${c.known?'Known':'Unknown'}</div></div>
    </div>
    <div style="margin-top:10px;display:flex;gap:6px">
      <button class="action-btn" style="flex:1;font-size:11.3px;padding:6px" onclick="document.getElementById('rival-popup').remove();showRivalModal(${STATE.competitors.indexOf(c)})">Full Profile</button>
    </div>`;
  mp.appendChild(pop);
  setTimeout(()=>{ document.addEventListener('click', function dismiss(e){ if(!pop.contains(e.target)){pop.remove(); document.removeEventListener('click',dismiss);} }, {once:false}); }, 100);
}
function showRivalModal(idx) {
  const c = STATE.competitors[idx]; if (!c) return;
  const mystery = STATE.gameType==='mystery';
  const myRegions = new Set([CITIES[STATE.homeBase]?.region, ...STATE.routes.flatMap(r=>[CITIES[r.from]?.region, CITIES[r.to]?.region])].filter(Boolean));
  const known = !mystery || c.regionsEntered.some(r=>myRegions.has(r));
  if (!known) {
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-content').innerHTML = modalHead('RIVAL INTEL') +
      `<div class="modal-body" style="text-align:center;padding:32px 18px">
        <div style="font-size:40.7px;margin-bottom:12px">📡</div>
        <div style="color:var(--muted);font-size:14.7px">No intelligence available.</div>
        <div style="color:var(--muted2);font-size:12.4px;margin-top:8px">Enter their region to reveal this rival.</div>
        <button class="action-btn" onclick="closeModal()" style="margin-top:16px">CLOSE</button>
      </div>`;
    return;
  }
  const initials = c.name.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const aggLabel = c.aggression>0.7?'HIGH':c.aggression>0.4?'MEDIUM':'LOW';
  const aggColor = c.aggression>0.7?'var(--danger)':c.aggression>0.4?'var(--warn)':'var(--accent3)';
  const aggPct = Math.round(c.aggression*100);
  const routes = (c.routeList||[]);
  const hubCity = CITIES[c.hub];
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-content').innerHTML = modalHead(
    `<span style="display:inline-flex;align-items:center;gap:10px">
      <span style="width:28px;height:28px;border-radius:50%;background:${c.color};display:inline-flex;align-items:center;justify-content:center;font-size:12.4px;font-weight:700;color:#fff">${initials}</span>
      <span style="color:${c.color}">${c.name}</span>
    </span>`
  ) + `<div class="modal-body">
    <div class="city-stat-grid" style="margin-bottom:12px">
      <div class="city-stat-box"><div class="csb-l">Pass/mo est.</div><div class="csb-v" style="font-size:14.7px">${Math.round((c.paxYear||0)/Math.max(1,STATE.month||1)).toLocaleString()}</div></div>
      <div class="city-stat-box"><div class="csb-l">Pass this yr</div><div class="csb-v" style="font-size:14.7px;color:var(--profit)">${(c.paxYear||0).toLocaleString()}</div></div>
      <div class="city-stat-box"><div class="csb-l">Company Value</div><div class="csb-v" style="font-size:14.7px;color:#fff">$${c.value}M</div></div>
      <div class="city-stat-box"><div class="csb-l">Cash</div><div class="csb-v" style="font-size:14.7px;color:#fff">$${c.cash.toFixed(0)}M</div></div>
      <div class="city-stat-box"><div class="csb-l">Routes</div><div class="csb-v" style="font-size:14.7px">${c.routes}</div></div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11.3px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Aggression — <span style="color:${aggColor}">${aggLabel}</span></div>
      <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${aggPct}%;background:${aggColor};border-radius:3px"></div>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11.3px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Regions Entered (${c.regionsEntered.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${c.regionsEntered.map(r=>`<span style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2px 8px;font-size:10.7px;color:var(--text)">${r}</span>`).join('')}
      </div>
    </div>
    ${routes.length ? `
    <div style="margin-bottom:14px">
      <div style="font-size:11.3px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Known Routes (${routes.length})</div>
      <div style="max-height:120px;overflow-y:auto">
        ${routes.map(r=>`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:11.3px">
          <span style="color:${c.color}">${r.from}</span>
          <span style="color:var(--muted2)">→</span>
          <span style="color:var(--text)">${Array.isArray(r.to) ? r.to[0] : r.to}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}
    <div style="margin-bottom:12px">
      <div style="font-size:11.3px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Home Hub</div>
      <div style="font-size:13.6px;color:var(--text)">${c.hub}${hubCity?` <span style="color:var(--muted);font-size:11.3px">· ${hubCity.region}</span>`:''}</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="action-btn" style="flex:1" onclick="zoomToRivalHub(${idx})">🗺 ZOOM TO HUB</button>
      <button class="action-btn" style="flex:1;border-color:var(--border);color:var(--muted);background:transparent" onclick="closeModal()">CLOSE</button>
    </div>
  </div>`;
}
function zoomToRivalHub(idx) {
  const c = STATE.competitors[idx]; if(!c) return;
  const city = CITIES[c.hub]; if(!city) return;
  closeModal();
  STATE.viewRegion = city.region;
  renderRegionTabs();
  STATE.mapZoom = 2.2;
  centerOnXY(city.x, city.y);
  renderMap();
  showFlash(`Zoomed to ${c.name} hub — ${c.hub}`);
  switchTab('rivals');
}
function flashRegionTab(region) {
  const tabs = document.querySelectorAll('#region-tabs .region-tab');
  tabs.forEach(tab => {
    if (tab.textContent.trim() === region) {
      tab.classList.remove('hub-flash');
      void tab.offsetWidth; // reflow to restart animation
      tab.classList.add('hub-flash');
      setTimeout(() => tab.classList.remove('hub-flash'), 4500);
    }
  });
}
function renderHubsList() {
  document.getElementById('hubs-list').innerHTML = STATE.hubs.map(h=>{
    const used = hubGatesUsed(h), cap = hubGateCapacity(h), free = cap - used;
    const pct  = Math.round(used / cap * 100);
    const cMult = hubCongestionMult ? hubCongestionMult(h) : 1;
    const gateColor = free === 0 ? 'var(--danger)' : free <= 2 ? 'var(--warn)' : used === 0 ? 'var(--accent)' : 'var(--muted)';
    const gateLabel = used === 0
      ? `${cap} gates open`
      : free === 0 ? `FULL — ${cap}/${cap}`
      : `${free} of ${cap} free`;
    const congestionNote = cMult > 1.12 ? `<div style="font-size:10.2px;color:var(--loss);margin-top:1px">⚡ +${Math.round((cMult-1)*100)}% congestion surcharge</div>`
      : cMult > 1 ? `<div style="font-size:10.2px;color:var(--warn);margin-top:1px">⚠ +${Math.round((cMult-1)*100)}% surcharge</div>` : '';
    const spokes = hubSpokes(h);
    const netPct = hubNetworkBonusPct(h);
    const netNote = spokes >= 2 ? `<div style="font-size:10.2px;color:#fff;margin-top:1px">🔁 ${spokes} spokes · +${netPct}% network demand</div>` : '';
    return `<div style="margin-bottom:6px;font-size:11.3px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="color:${h===STATE.homeBase?'var(--accent)':'var(--accent3)'}">${h===STATE.homeBase?'★':'○'} ${h.split(' ')[0]}</span>
        <span style="color:${gateColor};font-size:10.7px">${gateLabel}</span>
      </div>
      <div style="height:2px;background:var(--border);border-radius:1px;overflow:hidden;margin-top:2px">
        <div style="height:100%;width:${pct}%;background:${used===0?'rgba(167,137,255,0.2)':gateColor};border-radius:1px"></div>
      </div>
      ${congestionNote}
      ${netNote}
    </div>`;
  }).join('');
}
function actionsLeft() {
  const a = STATE.actionCap;
  return (a && a.on) ? Math.max(0, a.max - a.used) : Infinity;
}
function renderActionPips() {
  const el = document.getElementById('action-pips');
  if (!el) return;
  const a = STATE.actionCap;
  if (!a || !a.on) { el.classList.add('hidden-cap'); return; }
  el.classList.remove('hidden-cap');
  const left = Math.max(0, a.max - a.used);
  let pips = '';
  for (let i = 0; i < a.max; i++) {
    pips += `<span class="ap-pip" style="color:${i < left ? 'var(--accent)' : 'rgba(255,255,255,.18)'}">${i < left ? '◆' : '◇'}</span>`;
  }
  el.innerHTML = `${pips}<span style="margin-left:3px">${left} move${left === 1 ? '' : 's'} left</span>`;
  el.classList.toggle('spent', left === 0);
}
function spendAction(label) {
  const a = STATE.actionCap;
  if (!a || !a.on) return true;
  if (a.used >= a.max) {
    showFlash('◇ Out of moves this month — END TURN to act again');
    const b = document.getElementById('end-turn-btn'); if (b) b.classList.add('urgent');
    return false;
  }
  a.used++;
  renderActionPips();
  return true;
}
function resetActions() {
  if (STATE.actionCap) STATE.actionCap.used = 0;
  const b = document.getElementById('end-turn-btn');
  if (b && STATE.actionCap && STATE.actionCap.on) b.classList.remove('urgent');
  renderActionPips();
}
function toggleActionCap() {
  STATE.actionCap = STATE.actionCap || { on: false, max: 4, used: 0 };
  STATE.actionCap.on = !STATE.actionCap.on;
  if (STATE.actionCap.on) STATE.actionCap.used = 0;
  showFlash(STATE.actionCap.on
    ? `◆ Action cap ON — ${STATE.actionCap.max} moves per month`
    : 'Action cap OFF — unlimited moves');
  const b = document.getElementById('end-turn-btn');
  if (b && !STATE.actionCap.on) b.classList.remove('urgent');
  renderActionPips();
}
function fmRungs() {
  const routes = STATE.routes.length;
  const regions = new Set(STATE.routes.flatMap(r=>[(CITIES[r.from]||{}).region,(CITIES[r.to]||{}).region]).filter(Boolean));
  const pax = STATE._lifetimePax || 0;
  const lastP = STATE._lastMonthProfit;
  const clampPct = (cur,need)=>Math.max(0,Math.min(96,(cur/need)*100));
  return [
    { id:'route2',  label:'Open your 2nd route',             reward:'+$8M founding grant',
      ready: routes>=2,  prog:`${routes}/2 routes`,                            pct: routes>=2?100:clampPct(routes,2),
      pay:()=>{ STATE.cash += 8; } },
    { id:'pax25k',  label:'Carry 25,000 passengers',          reward:'a free regional aircraft',
      ready: pax>=25000, prog:`${Math.round(pax).toLocaleString()} / 25,000 pass`, pct: pax>=25000?100:clampPct(pax,25000),
      pay:()=>{ const av=Object.entries(AIRCRAFT).filter(([n,a])=>a.era<=STATE.year).sort((a,b)=>a[1].cost-b[1].cost); const pk=av[0]||Object.entries(AIRCRAFT).sort((a,b)=>a[1].cost-b[1].cost)[0]; const nm=pk[0]; if(!STATE.planes[nm])STATE.planes[nm]={...AIRCRAFT[nm],owned:0,assigned:0}; STATE.planes[nm].owned+=1; stampAcquisition(STATE.planes[nm],1); STATE._fmGiftPlane=nm; } },
    { id:'profit1', label:'Turn your first profitable month', reward:'+$12M',
      ready: (lastP!=null && lastP>0), prog:(lastP!=null?`last month ${lastP>=0?'+':''}$${lastP.toFixed(1)}M`:'fly a month to measure'), pct:(lastP!=null&&lastP>0)?100:8,
      pay:()=>{ STATE.cash += 12; } },
    { id:'region2', label:'Fly into a 2nd region',            reward:'+1 gate slot at home',
      ready: regions.size>=2, prog:`${regions.size}/2 regions served`,         pct: regions.size>=2?100:clampPct(regions.size,2),
      pay:()=>{ STATE.gateBonus=STATE.gateBonus||{}; STATE.gateBonus[STATE.homeBase]=(STATE.gateBonus[STATE.homeBase]||0)+1; } },
    { id:'route5',  label:'Reach 5 routes',                   reward:'+$15M — and you graduate',
      ready: routes>=5,  prog:`${routes}/5 routes`,                            pct: routes>=5?100:clampPct(routes,5),
      pay:()=>{ STATE.cash += 15; } },
  ];
}
function evalFirstMoves(monthProfit) {
  if (typeof monthProfit === 'number') STATE._lastMonthProfit = monthProfit;
  if (!STATE.firstMoves || STATE.firstMoves.done) return;
  const rungs = fmRungs();
  let i = STATE.firstMoves.rung | 0;
  if (i >= rungs.length) { STATE.firstMoves.done = true; return; }
  const r = rungs[i];
  if (!r.ready) return;
  r.pay();
  STATE.firstMoves.rung = i + 1;
  const gift = (r.id==='pax25k' && STATE._fmGiftPlane) ? ` (${STATE._fmGiftPlane})` : '';
  addEvent('good', `✓ First Moves: ${r.label} — ${r.reward}${gift}`);
  if (STATE.firstMoves.rung >= rungs.length) {
    STATE.firstMoves.done = true;
    showFlash(`🎓 ${r.label} ✓  ${r.reward}. You're off the ground — now chase the real prize.`);
  } else {
    showFlash(`✓ ${r.label}!  Reward: ${r.reward}.  Next up: ${rungs[STATE.firstMoves.rung].label}`);
  }
  try { recalcCompanyValue(); } catch(e){}
}
function renderGoalProgress() {
  const st = objectiveStatus();
  const typeLabel = (GAME_TYPES.find(g=>g.id===STATE.gameType)||{}).name || 'Scenario';
  const mystery = STATE.gameType==='mystery' && STATE.yearsElapsed<1;
  const yearsCap = (STATE.objective && STATE.objective.kind==='timed_value') ? STATE.objective.years : 20;
  let fmHtml = '';
  const fm = STATE.firstMoves;
  if (fm && !fm.done && (fm.rung|0) < 5) {
    const r = fmRungs()[fm.rung|0];
    fmHtml = `
    <div style="margin-bottom:7px;padding:7px 8px;border:1px solid var(--accent);border-radius:7px;background:linear-gradient(135deg,rgba(167,137,255,0.12),rgba(255,207,90,0.05))">
      <div style="font-size:10.2px;letter-spacing:1.5px;color:#fff;margin-bottom:3px">▶ GETTING OFF THE GROUND · ${(fm.rung|0)+1}/5</div>
      <div style="font-size:12.4px;color:var(--text);font-weight:600;margin-bottom:5px">${r.label}</div>
      <div style="height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin-bottom:4px">
        <div style="height:100%;width:${r.pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width .4s"></div>
      </div>
      <div style="display:flex;justify-content:space-between;gap:6px;font-size:11.3px">
        <span style="color:var(--muted)">${r.prog}</span>
        <span style="color:var(--accent2);white-space:nowrap">🎁 ${r.reward}</span>
      </div>
    </div>`;
  }
  const objDim = fmHtml ? 'opacity:.7;' : '';
  document.getElementById('goal-progress').innerHTML = fmHtml + `
    <div style="${objDim}margin-bottom:5px; color:#fff; font-weight:600">${fmHtml?'Long game · ':''}${typeLabel}${STATE.twist?` · ${STATE.twist.name}`:''}</div>
    ${ mystery
      ? `<div style="${objDim}margin-bottom:4px; color:var(--warn)">▸ [CLASSIFIED]</div>
         <div style="${objDim}font-size:11.3px; color:var(--muted); font-style:italic">"${STATE.objective.hint||'…'}"</div>`
      : `<div style="${objDim}margin-bottom:4px; color:${st.done?'var(--profit)':'var(--text)'}">▸ ${st.label}</div>
         <div style="${objDim}font-size:11.3px; color:var(--muted)">${st.prog}</div>` }
    <div style="${objDim}color:var(--muted); font-size:11.3px; margin-top:6px">Year ${STATE.yearsElapsed}/${yearsCap}</div>`;
}
let _newsFilter = 'all';
function addEvent(type, text, loc) {
  const isRival = STATE.competitors?.some(c => text.includes(c.name));
  const finalType = isRival && type === 'neutral' ? 'rival' : type;
  const rec = { type: finalType, text, time: `${MONTHS[STATE.month]} ${STATE.year}` };
  if (loc && loc.city && CITIES[loc.city]) rec.city = loc.city;
  else if (loc && loc.region) rec.region = loc.region;
  STATE.events.unshift(rec);
  if (STATE.events.length > 60) STATE.events.pop();
  STATE.eventLog = STATE.eventLog || [];
  STATE.eventLog.push({ ...rec });
  if (STATE.eventLog.length > 1000) STATE.eventLog.shift();
  renderEventsList();
}
const TOUR_STEPS = [
  {
    title: '✈ Welcome to Airline Empire',
    body: 'You\'re the CEO. Build routes, buy aircraft, outmaneuver rivals, and grow the world\'s #1 airline. Let\'s get you oriented.',
    pos: { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' },
    next: 'Got it →',
  },
  {
    title: '🗺 Your Map',
    body: 'This is your world. Rival hubs pulse with their airline colors. Use the <b style="color:#fff">+ / −</b> buttons or scroll to zoom in on any region.',
    pos: { top: '120px', left: '320px' },
    highlight: 'map-container',
    next: 'Next →',
  },
  {
    title: '💾 Save & Menu',
    body: 'The <b style="color:#fff">💾 Save</b> and <b style="color:#fff">☰ Menu</b> buttons are always at the top of the left panel. Save often — the game auto-saves each turn.',
    pos: { top: '60px', left: '200px' },
    next: 'Next →',
  },
  {
    title: '✈ Open Your First Route',
    body: 'Click <b style="color:#fff">Operations › New Route</b> in the left panel. Pick your hub as the origin, choose a destination, select an aircraft, and set your fare.',
    pos: { top: '160px', left: '200px' },
    next: 'Next →',
  },
  {
    title: '📊 Track Performance',
    body: 'Click any route on the map or in the ROUTES tab to open the P&L panel. It shows profit, load factor, and <b style="color:var(--loss)">why a route is losing</b> if it is.',
    pos: { top: '50%', right: '20px', transform: 'translateY(-50%)' },
    next: 'Next →',
  },
  {
    title: '🌡 Demand Overlay',
    body: 'Click <b style="color:#fff">🌡 Demand</b> on the map to see which cities are underserved — bigger glow = more unmet demand. Great for spotting where to expand.',
    pos: { bottom: '80px', left: '60px' },
    next: 'Next →',
  },
  {
    title: '⚔ Watch the Rivals',
    body: 'Rivals start with real routes and expand every month. Their lines are dashed in their airline color. Click any rival line or hub to see their stats.',
    pos: { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' },
    next: 'Start Playing!',
  },
];
let _tourStep = 0;
function startTour() {
  _tourStep = 0;
  showTourStep();
}
function showTourStep() {
  const overlay = document.getElementById('tour-overlay');
  if (!overlay) return;
  if (_tourStep >= TOUR_STEPS.length) {
    endTour(); return;
  }
  overlay.classList.remove('hidden');
  const step = TOUR_STEPS[_tourStep];
  const pips = TOUR_STEPS.map((_,i) =>
    `<div class="tour-pip ${i===_tourStep?'active':''}"></div>`
  ).join('');
  overlay.innerHTML = `
    <div class="tour-backdrop" onclick=""></div>
    <div class="tour-bubble" style="${Object.entries(step.pos||{}).map(([k,v])=>`${k}:${v}`).join(';')}">
      <div class="tour-pip-row">${pips}</div>
      <div class="tour-title">${step.title}</div>
      <div class="tour-body">${step.body}</div>
      <div class="tour-btns">
        <button class="tour-skip" onclick="endTour()">Skip tour</button>
        <button class="tour-next" onclick="advanceTour()">${step.next||'Next →'}</button>
      </div>
    </div>`;
}
function advanceTour() {
  _tourStep++;
  showTourStep();
}
function endTour() {
  const overlay = document.getElementById('tour-overlay');
  if (overlay) overlay.classList.add('hidden');
  try { localStorage.setItem('ae_tour_done', '1'); } catch(e) {}
  setTimeout(showFirstTurnGuide, 300);
}
const DAILY_BONUSES = [
  { id:'globetrotter', icon:'🌐', name:'Globetrotter', desc:'Finish with routes touching 4+ regions', check:s=>new Set((s.routes||[]).flatMap(r=>[CITIES[r.from]?.region,CITIES[r.to]?.region]).filter(Boolean)).size>=4 },
  { id:'network_ace',  icon:'🕸',  name:'Network Ace',  desc:'Finish with 12+ routes open',            check:s=>(s.routes||[]).length>=12 },
  { id:'debt_free',    icon:'💵', name:'Debt-Free',     desc:'Finish with no outstanding loan',        check:s=>!((s.loan||0)>0) },
];
function showDailyBriefing(){
  const t = STATE.twist || {};
  const ovl = document.getElementById('modal-overlay');
  const mc = document.getElementById('modal-content');
  if (!ovl || !mc) return;
  const row = (l,v)=>`<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
    <span style="flex:0 0 90px;font-size:11.3px;color:var(--muted2);letter-spacing:1.2px;text-transform:uppercase;padding-top:2px">${l}</span>
    <span style="font-size:13px;color:var(--text);line-height:1.55">${v}</span></div>`;
  mc.innerHTML = modalHead('📅 DAILY CHALLENGE — ' + (STATE.seed || todaySeed())) + `<div class="modal-body">
    ${row('Hub', `<b>${STATE.homeBase}</b> — same for every player today`)}
    ${row('Objective', `<b style="color:var(--accent2)">${(STATE.objective&&STATE.objective.desc)||'Maximize company value within 5 years'}</b>`)}
    ${row("Today's twist", `<b style="color:var(--warn)">${t.name||'—'}</b> — ${t.desc||'no modifier'}`)}
    ${row('Scoring', `Final <b>company value</b> is your score. One attempt per seed counts toward your best & streak 🔥.`)}
    <div style="font-size:11.3px;color:var(--muted2);letter-spacing:1.5px;text-transform:uppercase;margin:14px 0 7px">Sub-bonuses — each adds +10% to your score</div>
    ${DAILY_BONUSES.map(b=>`<div style="display:flex;gap:9px;align-items:flex-start;background:rgba(255,207,90,0.06);border:1px solid rgba(255,207,90,0.25);border-radius:8px;padding:8px 11px;margin-bottom:6px">
      <span style="font-size:18.1px">${b.icon}</span>
      <span><b style="font-size:11.9px;color:var(--accent2)">${b.name}</b><br><span style="font-size:10.7px;color:var(--muted)">${b.desc}</span></span>
    </div>`).join('')}
    <button class="action-btn success" style="width:100%;margin-top:12px;padding:11px;font-size:13.6px;letter-spacing:2px" onclick="closeModal()">✈ START THE CLOCK</button>
  </div>`;
  ovl.classList.add('open');
}
function brandSkywrite(){
  const stage = document.getElementById('brand-sky');
  const h = document.getElementById('brand-sky-title');
  if (!stage || !h) return;
  h.innerHTML = [...'AIRLINE EMPIRE'].map(ch =>
    ch === ' ' ? '<span class="sky-l">&nbsp;</span>' : `<span class="sky-l">${ch}</span>`).join('');
  stage.querySelectorAll('.sky-plane').forEach(p => p.remove());
  const plane = document.createElement('div');
  plane.className = 'sky-plane mini';
  plane.innerHTML = '<span class="sp-trail"></span><span class="sp-glyph">✈</span>';
  plane.style.top = '50%';
  stage.appendChild(plane);
  if (STATE.livery) { const _gl = plane.querySelector('.sp-glyph'); if (_gl) { _gl.style.color = STATE.livery; _gl.style.textShadow = `0 0 8px ${STATE.livery}`; } }
  const w = stage.clientWidth || 240;
  const SFD = (w + 80) / 300;            // steady mini flyby, ~1s
  if (plane.animate) {
    plane.animate(
      [{ left: '-44px', opacity: 0, offset: 0 },
       { left: '-34px', opacity: 1, offset: 0.06 },
       { left: (w + 30) + 'px', opacity: 1, offset: 0.94 },
       { left: (w + 44) + 'px', opacity: 0, offset: 1 }],
      { duration: Math.round(SFD * 1000), easing: 'linear', fill: 'forwards' });
  } else { plane.style.left = (w + 44) + 'px'; plane.style.opacity = '0'; }
  const letters = [...h.querySelectorAll('.sky-l')], n = letters.length || 1;
  letters.forEach((L, j) => {
    L.style.setProperty('--ld', (SFD * ((j + 0.5) / n) * 0.92).toFixed(2) + 's');
    L.style.setProperty('--lx', '-10px');
    // brand letters persist — push the smoke-out beyond any session length
    L.style.setProperty('--lo', '999999s');
  });
  stage.classList.remove('fly'); void stage.offsetWidth;
  stage.classList.add('fly');
}
function maybeLaunchTour() {
  try {
    if (localStorage.getItem('ae_tour_done')) return;
  } catch(e) {}
  setTimeout(startTour, 800); // slight delay so map renders first
}
let _demandOverlayOn = false;
let _conquestCentroids = null;
function conquestCentroids(){
  if(_conquestCentroids) return _conquestCentroids;
  const acc={}, cnt={};
  Object.values(CITIES).forEach(c=>{
    if(!REGIONS.includes(c.region)) return;
    if(!acc[c.region]){ acc[c.region]={x:0,y:0}; cnt[c.region]=0; }
    acc[c.region].x+=c.x; acc[c.region].y+=c.y; cnt[c.region]++;
  });
  _conquestCentroids={};
  REGIONS.forEach(r=>{ if(cnt[r]) _conquestCentroids[r]={x:acc[r].x/cnt[r], y:acc[r].y/cnt[r]}; });
  return _conquestCentroids;
}
// On-map conquest overlay: each region tagged LED / CONTESTED / OPEN from the same
// pax-leadership read the Chief Strategist uses. Toggled via the 👑 Conquest button.
// ═══════════════════════════════════════════════════════════════════════════
//  REGIONAL CAPITAL PROJECTS — late-game money sink tied to conquest standing
// ═══════════════════════════════════════════════════════════════════════════
// Each project: large lump sum (scales with region development), built over
// several turns, small monthly upkeep, permanent regional effect + conquest pax
// credit. Effects are situational so there's no universal auto-buy.
const REGION_PROJECTS = {
  megahub: {
    icon:'🏛', name:'Mega-Hub Terminal', turns:4, baseCost:180, upkeep:1.2,
    demandMult:0.12, conquestPax:60000,
    blurb:'A flagship terminal lifts demand on every route touching the region.',
    when:'Best where you are slot-constrained and already flying heavy volume here.' },
  lounge: {
    icon:'🛋', name:'Lounge Network', turns:3, baseCost:120, upkeep:0.8,
    demandMult:0.08, conquestPax:35000,
    blurb:'Premium lounges raise appeal and load on routes into the region.',
    when:'Pays off on premium-heavy networks with long-haul service.' },
  maintbase: {
    icon:'🔧', name:'Maintenance Megabase', turns:4, baseCost:150, upkeep:0.6,
    maintCut:0.30, conquestPax:25000,
    blurb:'A regional MRO cuts age-surcharge on aircraft serving the region.',
    when:'Synergizes with an old fleet — pairs with the Fleet Renewal sink.' },
  marketing: {
    icon:'📣', name:'Brand Campaign', turns:2, baseCost:90, upkeep:0.4,
    demandMult:0.06, conquestPax:90000,
    blurb:'A sustained brand push — the most direct lever on conquest standing.',
    when:'Pays off in a contested region you are trying to flip to LED.' },
  alliance: {
    icon:'🤝', name:'Govt / Alliance Pact', turns:3, baseCost:140, upkeep:1.0,
    rivalShield:0.30, conquestPax:40000,
    blurb:'Landing rights and a regional alliance blunt rival demand-splitting.',
    when:'Pays off in rival-heavy regions where you keep losing demand.' },
};
const PROJECT_ORDER = ['megahub','lounge','maintbase','marketing','alliance'];

// Cost scales with region development (sum of city econ in the region, normalized)
function projectCost(region, projId) {
  const def = REGION_PROJECTS[projId]; if(!def) return 9999;
  let dev = 0, n = 0;
  Object.values(CITIES).forEach(c => { if(c.region===region){ dev += (c.econ||40); n++; } });
  const devFactor = n ? Math.min(1.6, Math.max(0.7, (dev/n)/55)) : 1;
  return Math.round(def.baseCost * devFactor);
}

function _rp(region){ STATE.regionProjects = STATE.regionProjects||{}; return STATE.regionProjects[region] || (STATE.regionProjects[region] = {active:[],completed:[]}); }
function regionCompleted(region){ return (_rp(region).completed)||[]; }
function regionHasProject(region, projId){ return regionCompleted(region).includes(projId) || (_rp(region).active||[]).some(a=>a.id===projId); }
function activeProjectCount(){ return REGIONS.reduce((s,r)=>s+((_rp(r).active||[]).length),0); }

// ── Effect readers (pure, called by the economy engine) ──
function regionDemandMult(region){
  let m = 1;
  regionCompleted(region).forEach(id=>{ const p=REGION_PROJECTS[id]; if(p&&p.demandMult) m += p.demandMult; });
  return m;
}
function regionMaintCut(region){
  let cut = 0;
  regionCompleted(region).forEach(id=>{ const p=REGION_PROJECTS[id]; if(p&&p.maintCut) cut = Math.max(cut, p.maintCut); });
  return cut;
}
function regionRivalShield(region){
  let sh = 0;
  regionCompleted(region).forEach(id=>{ const p=REGION_PROJECTS[id]; if(p&&p.rivalShield) sh = Math.max(sh, p.rivalShield); });
  return sh;
}
function regionProjectPax(region){
  // Direct conquest-standing credit from completed projects (added to my regional pax)
  let pax = 0;
  regionCompleted(region).forEach(id=>{ const p=REGION_PROJECTS[id]; if(p&&p.conquestPax) pax += p.conquestPax; });
  return pax;
}
function projectsUpkeep(){
  let up = 0;
  REGIONS.forEach(r=>regionCompleted(r).forEach(id=>{ const p=REGION_PROJECTS[id]; if(p&&p.upkeep) up += p.upkeep; }));
  return up;
}

// ── Turn tick: advance in-progress builds, fire completion ──
function tickProjects(){
  REGIONS.forEach(region=>{
    const rp = _rp(region);
    const stillActive = [];
    (rp.active||[]).forEach(a=>{
      a.turnsLeft = (a.turnsLeft||1) - 1;
      if(a.turnsLeft <= 0){
        rp.completed = rp.completed||[];
        if(!rp.completed.includes(a.id)) rp.completed.push(a.id);
        const def = REGION_PROJECTS[a.id];
        addEvent('good', `${def.icon} ${def.name} complete in ${region} — ${def.demandMult?`+${Math.round(def.demandMult*100)}% demand`:def.maintCut?`−${Math.round(def.maintCut*100)}% maint`:def.rivalShield?`−${Math.round(def.rivalShield*100)}% rival loss`:'active'}.`);
      } else {
        stillActive.push(a);
      }
    });
    rp.active = stillActive;
  });
}

function startProject(region, projId){
  const def = REGION_PROJECTS[projId];
  if(!def) return;
  if(regionHasProject(region, projId)) return showFlash('Already built or in progress here');
  if(activeProjectCount() >= (STATE.projectSlots||2)) return showFlash(`⚠ All ${STATE.projectSlots||2} project slots in use`);
  const cost = projectCost(region, projId);
  if(STATE.cash < cost) return showFlash(`⚠ Need $${cost}M for this project`);
  STATE.cash -= cost;
  const rp = _rp(region);
  rp.active = rp.active||[];
  rp.active.push({ id:projId, turnsLeft:def.turns, cost });
  addEvent('neutral', `${def.icon} Broke ground on ${def.name} in ${region} — $${cost}M, ${def.turns} turns.`);
  showFlash(`${def.icon} ${def.name} started in ${region}`);
  updateUI();
  if(document.getElementById('modal-content')) renderProjectsModal();
}

const RESEARCH_HUB_CARDS = [
  {id:'fuel', icon:'&#127807;', name:'Fuel Efficiency', level:2, color:'#9be34a', cost:1200, progress:40,
    benefits:['Reduce fuel consumption by 6%','Lower operating costs']},
  {id:'pricing', icon:'&#127991;', name:'Advanced Pricing', level:3, color:'#c77cff', cost:1500, progress:60,
    benefits:['Increase ticket revenue by 8%','Improve dynamic pricing accuracy']},
  {id:'routes', icon:'&#128205;', name:'Route Optimization', level:2, color:'#5da8ff', cost:1200, progress:40,
    benefits:['Improve route profitability by 7%','Reduce flight time by up to 3%']},
  {id:'cabin', icon:'&#128186;', name:'Cabin Comfort', level:3, color:'#ffb733', cost:1500, progress:60,
    benefits:['Increase passenger satisfaction','Boost reputation gain']},
  {id:'maintenance', icon:'&#128736;', name:'Aircraft Maintenance', level:2, color:'#35d5e5', cost:1200, progress:40,
    benefits:['Reduce maintenance costs by 6%','Decrease unexpected failures']},
  {id:'brand', icon:'&#9733;', name:'Brand Reputation', level:3, color:'#ffbd32', cost:1500, progress:60,
    benefits:['Increase reputation gain by 10%','Attract more high-value passengers']},
  {id:'digital', icon:'&#128227;', name:'Digital Marketing', level:2, color:'#36d6df', cost:1200, progress:40,
    benefits:['Increase booking conversions by 6%','Improve market reach']},
  {id:'sustainable', icon:'&#127807;', name:'Sustainable Aviation', level:1, color:'#a8e63f', cost:1000, progress:20,
    benefits:['Reduce emissions by 5%','Unlock green partnership bonuses']},
];

function researchHubAction(id){
  closeModal();
  window.setTimeout(()=>{
    if(id==='fuel' || id==='maintenance') openHangarModal();
    else if(id==='pricing') openModal('budget');
    else if(id==='routes') openRouteManager();
    else if(id==='cabin') openModal('hr');
    else if(id==='brand' || id==='digital') openModal('campaign');
    else if(id==='sustainable') openFleetPage();
  }, 0);
}

function researchHubHistory(){
  closeModal();
  window.setTimeout(()=>openModal('projects'), 0);
}

function researchHubCommand(key){
  closeModal();
  window.setTimeout(()=>{
    if(key==='world') return;
    if(key==='operations') openModal('new-route');
    else if(key==='finance') openModal('budget');
    else if(key==='intel' && typeof openMarketIntel==='function') openMarketIntel('routes');
    else if(key==='airport') openModal('negotiations');
    else if(key==='competitors') switchTab('rivals');
    else if(key==='mail') switchTab('events');
  }, 0);
}

function researchHubNav(key){
  if(key==='research') return;
  closeModal();
  window.setTimeout(()=>key==='settings' ? openModal('settings') : navGo(null, key), 0);
}

function researchHubUtility(key){
  closeModal();
  window.setTimeout(()=>{
    if(key==='news') switchTab('events');
    else if(key==='achievements') openRecords();
    else if(key==='tutorial') openGuideModal('first');
    else if(key==='exit') saveAndQuit();
  }, 0);
}

function buildResearchHub(){
  const points = Number.isFinite(STATE.researchPoints) ? STATE.researchPoints : 2450;
  const profit = Number(STATE._lastMonthProfit != null ? STATE._lastMonthProfit : (STATE.routes||[]).reduce((sum, route)=>sum+(route.profit||0), 0));
  const weekly = profit / 4.345;
  const passengers = Number(STATE.totalPaxYear||STATE.paxThisYear||0);
  const fuel = 2.40 * (Number(STATE.fuelMod)||1) * (typeof timedFuelMod==='function' ? timedFuelMod() : 1);
  const cards = RESEARCH_HUB_CARDS.map(card=>`<article class="rh-card" style="--rh-accent:${card.color}">
    <div class="rh-card-head"><span class="rh-card-icon">${card.icon}</span><div><div class="rh-card-name">${card.name}</div><div class="rh-card-level">Level ${card.level} / 5</div></div></div>
    <div class="rh-progress"><i style="width:${card.progress}%"></i></div>
    <div class="rh-benefit-title">NEXT LEVEL BENEFITS</div>
    <ul>${card.benefits.map(b=>`<li>${b}</li>`).join('')}</ul>
    <button class="rh-research-btn" onclick="researchHubAction('${card.id}')"><span>RESEARCH</span><b>&#9878; ${card.cost.toLocaleString()}</b></button>
  </article>`).join('');
  const absTurn = Math.max(1, (STATE._absMonth||0) + 1);
  return `<div class="rh-shell">
    <header class="rh-topbar">
      <div class="rh-brand"><svg viewBox="0 0 64 54" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M31.8 49 17 39 5 9l26.8 15.5V49Z"/><path d="M32.2 49 47 39 59 9 32.2 24.5V49Z"/><path d="m10 15 18 14-11 3.5M54 15 36 29l11 3.5M18 38l13.8 5M46 38l-13.8 5"/></svg><div><b>AIRLINE<br>EMPIRE</b><small>BUILD. CONNECT. CONQUER.</small></div></div>
      <section class="rh-kpis" aria-label="Airline performance">
        <div><small>CASH</small><strong class="lime">$${(STATE.cash||0).toFixed(1)}M</strong><em class="lime">${weekly>=0?'+':'&#8722;'}$${Math.abs(weekly).toFixed(2)}M /WK</em></div>
        <div><small>WEEKLY PROFIT</small><strong class="lime">${weekly>=0?'$':'&#8722;$'}${Math.abs(weekly).toFixed(2)}M</strong><em class="lime">&#8961; rising</em></div>
        <div><small>PASSENGERS</small><strong>${passengers.toLocaleString()}</strong><em>&mdash;</em></div>
        <div><small>REPUTATION</small><strong class="gold rh-stars">&#9733;&#9733;&#9733;&#9733;&#9734;</strong><em>&mdash;</em></div>
        <div><small>FUEL PRICE</small><strong class="purple">&#9675; $${fuel.toFixed(2)}<i>/GAL</i></strong><em>&mdash;</em></div>
      </section>
      <nav class="rh-utilities" aria-label="Game utilities">
        <button onclick="researchHubUtility('news')"><span>&#128240;</span>NEWS</button>
        <button onclick="researchHubUtility('achievements')"><span>&#127942;</span>ACHIEVEMENTS</button>
        <button onclick="researchHubUtility('tutorial')"><span>&#127891;</span>TUTORIAL</button>
        <button onclick="researchHubUtility('exit')"><span>&#9211;</span>EXIT GAME</button>
      </nav>
    </header>
    <div class="rh-stage">
      <aside class="rh-sidebar">
        <nav aria-label="Primary navigation">
          <button onclick="researchHubNav('dash')"><span>&#9638;</span>DASHBOARD</button>
          <button onclick="researchHubNav('routes')"><span>&#9992;</span>ROUTES</button>
          <button onclick="researchHubNav('fleet')"><span>&#9992;</span>FLEET</button>
          <button onclick="researchHubNav('airports')"><span>&#9814;</span>AIRPORTS</button>
          <button onclick="researchHubNav('finance')"><span>&#9673;</span>FINANCE</button>
          <button class="active" onclick="researchHubNav('research')"><span>&#9878;</span>RESEARCH</button>
          <button onclick="researchHubNav('marketing')"><span>&#128227;</span>MARKETING</button>
          <button onclick="researchHubNav('hr')"><span>&#9823;</span>STAFF</button>
          <button onclick="researchHubNav('cargo')"><span>&#9633;</span>CARGO</button>
        </nav>
        <button class="rh-settings" onclick="researchHubNav('settings')">&#9881;&nbsp; SETTINGS</button>
      </aside>
      <main class="rh-content">
        <header class="rh-heading">
          <div><h2>RESEARCH</h2><p>Invest in innovation to build a more efficient, profitable, and trusted airline.</p></div>
          <div class="rh-points"><span class="rh-flask">&#9878;</span><div><small>RESEARCH POINTS</small><strong>${points.toLocaleString()}</strong></div></div>
          <button class="rh-history" onclick="researchHubHistory()"><span>&#8634;</span> RESEARCH HISTORY</button>
        </header>
        <section class="rh-grid">${cards}</section>
        <section class="rh-status-row">
          <div class="rh-status rh-active"><div class="rh-status-title">RESEARCH IN PROGRESS</div><div class="rh-active-row"><span class="rh-mini-icon">&#127991;</span><div class="rh-active-copy"><b>Advanced Pricing</b><span>Level 3 &#8594; 4</span><div class="rh-mini-progress"><i></i></div></div><div class="rh-time"><small>TIME REMAINING</small><b>1D 14H</b></div><button onclick="showFlash('Research acceleration is managed through active regional programs')">SPEED UP&nbsp; &#9673; 250</button></div></div>
          <div class="rh-status rh-tier"><div class="rh-status-title">UNLOCK NEXT TIER</div><div class="rh-tier-row"><span class="rh-mini-icon">&#9878;</span><p>Reach Research Level 5 in 4 more categories<br>to unlock Advanced Technologies Tier.</p><b>4 / 8</b></div><div class="rh-tier-progress"><i></i></div></div>
          <div class="rh-status rh-mult"><div class="rh-status-title">RESEARCH MULTIPLIER</div><div class="rh-mult-row"><div><strong>+15%</strong><p>Active from Marketing Campaigns</p></div><button onclick="closeModal();openModal('campaign')">VIEW CAMPAIGNS</button></div></div>
        </section>
      </main>
    </div>
    <footer class="rh-command-bar">
      <div class="rh-day"><b>DAY ${absTurn}</b><span>&#9719;&nbsp; 18:45</span></div>
      <nav aria-label="Research command navigation">
        <button onclick="researchHubCommand('world')"><span>&#127758;</span>WORLD MAP</button>
        <button onclick="researchHubCommand('operations')"><span>&#9992;</span>OPERATIONS</button>
        <button onclick="researchHubCommand('finance')"><span>&#36;</span>FINANCE</button>
        <button onclick="researchHubCommand('intel')"><span>&#9646;</span>MARKET INTEL</button>
        <button onclick="researchHubCommand('airport')"><span>&#9814;</span>AIRPORT HUB</button>
        <button onclick="researchHubCommand('competitors')"><span>&#9823;</span>COMPETITORS</button>
        <button onclick="researchHubCommand('mail')"><span>&#9993;</span>MAIL</button>
      </nav>
      <button class="rh-end-turn" onclick="endTurn()"><span>&#9992;</span><b>END TURN<small>NEXT DAY</small></b></button>
    </footer>
  </div>`;
}

let _rpSelectedRegion = null;
function openProjectsModal(){
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-content').classList.add('modal-projects');
  renderProjectsModal();
}
function renderProjectsModal(){
  document.getElementById('modal-content').innerHTML = buildProjectsModal();
}
function buildProjectsModal(){
  let k; try { k = crownIntel(); } catch(e){ k = null; }
  const standing = {};
  if(k){ k.led.forEach(x=>standing[x.reg]='led'); k.contested.forEach(x=>standing[x.reg]='contested'); k.absent.forEach(x=>standing[x.reg]='absent'); }
  const focusReg = k && k.focus;
  const used = activeProjectCount();
  const total = STATE.projectSlots||2;
  const dots = Array.from({length:total},(_,i)=>`<span class="rp-slot-dot ${i<used?'used':''}"></span>`).join('');
  const upkeep = projectsUpkeep();
  const selectedRegion = (_rpSelectedRegion && REGIONS.includes(_rpSelectedRegion))
    ? _rpSelectedRegion
    : (focusReg && REGIONS.includes(focusReg) ? focusReg : REGIONS[0]);
  _rpSelectedRegion = selectedRegion;

  const slotsStrip = `<div class="rp-console-summary">
    <div class="rp-summary-copy">
      <span class="rp-console-kicker">INNOVATION PROGRAM</span>
      <strong>Choose where the airline develops its next advantage.</strong>
    </div>
    <div class="rp-summary-metric">
      <span>RESEARCH SLOTS</span>
      <strong>${used} / ${total}</strong>
      <div class="rp-slot-dots">${dots}</div>
    </div>
    <div class="rp-summary-metric rp-summary-upkeep">
      <span>UPKEEP</span>
      <strong>$${upkeep.toFixed(1)}M/mo</strong>
    </div>
  </div>`;

  let inProgHtml = '';
  const allActive = [];
  REGIONS.forEach(reg=>{ (_rp(reg).active||[]).forEach(a=>allActive.push({reg,...a})); });
  if(allActive.length){
    inProgHtml = `<div class="rp-inprog">
      <div class="rp-inprog-title">IN PROGRESS</div>
      ${allActive.map(a=>{
        const def = REGION_PROJECTS[a.id];
        const pct = Math.round((1 - (a.turnsLeft/def.turns))*100);
        return `<div class="rp-inprog-row">
          <span class="rp-inprog-icon">${def.icon}</span>
          <span class="rp-inprog-name">${def.name} <small>· ${a.reg}</small></span>
          <div class="rp-prog-bar"><div class="rp-prog-fill" style="width:${pct}%"></div></div>
          <span class="rp-inprog-turns">${a.turnsLeft} turn${a.turnsLeft!==1?'s':''}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  const STAND_WORD = {led:'LED',contested:'CONTESTED',absent:'OPEN'};
  const regionRail = REGIONS.map(reg=>{
    const st = standing[reg]||'absent';
    const completed = regionCompleted(reg);
    const isFocus = reg===focusReg;
    const available = PROJECT_ORDER.filter(pid=>!regionHasProject(reg,pid)).length;
    const detail = isFocus ? 'Strategic focus' : completed.length ? `${completed.length} completed` : st==='led' ? 'Conquest leader' : st==='contested' ? 'Active contest' : 'Open territory';
    const statusLabel = st==='led' ? 'LED' : isFocus ? 'FOCUS' : available;
    return `<button class="rp-region-rail${reg===selectedRegion?' selected':''}${isFocus?' focus':''}" onclick="_rpSelectedRegion='${reg}';renderProjectsModal()">
      <span class="rp-region-rail-copy"><b>${reg}</b><small>${detail}</small></span>
      <em class="${st}">${statusLabel}</em>
    </button>`;
  }).join('');

  const selectedStanding = standing[selectedRegion]||'absent';
  const selectedCompleted = regionCompleted(selectedRegion);
  const selectedActive = (_rp(selectedRegion).active||[]);
  const projectList = PROJECT_ORDER.map((pid,index)=>{
    const def = REGION_PROJECTS[pid];
    const isDone = selectedCompleted.includes(pid);
    const activeBuild = selectedActive.find(a=>a.id===pid);
    const cost = projectCost(selectedRegion,pid);
    const canAfford = STATE.cash >= cost;
    const slotsFree = used < total;
    const effLabel = def.demandMult?`+${Math.round(def.demandMult*100)}% demand`
                   : def.maintCut?`−${Math.round(def.maintCut*100)}% maintenance`
                   : def.rivalShield?`−${Math.round(def.rivalShield*100)}% rival loss`:'';
    let action;
    if(isDone) action = `<span class="rp-built-tag">✓ COMPLETED</span>`;
    else if(activeBuild) action = `<span class="rp-built-tag building">${activeBuild.turnsLeft} TURN${activeBuild.turnsLeft!==1?'S':''} LEFT</span>`;
    else action = `<button class="rp-build-btn" ${(canAfford&&slotsFree)?`onclick="startProject('${selectedRegion}','${pid}')"`:'disabled'}
      title="${!slotsFree?'No free build slots':!canAfford?'Not enough cash':`$${cost}M · ${def.turns} turns`}"><strong>$${cost}M</strong><span>START BUILD</span></button>`;
    return `<article class="rp-proj${index===0?' featured':''}${isDone?' completed':''}${activeBuild?' active':''}">
      <span class="rp-proj-ic">${def.icon}</span>
      <div class="rp-proj-body">
        <span class="rp-proj-kicker">${isDone?'COMPLETED':activeBuild?'IN PROGRESS':index===0?'FLAGSHIP PROJECT':'CAPITAL PROJECT'}</span>
        <div class="rp-proj-name">${def.name}</div>
        <div class="rp-proj-blurb">${def.blurb}</div>
        <div class="rp-proj-when">${def.when}</div>
        <div class="rp-proj-meta"><span>${effLabel}</span><span>+${(def.conquestPax/1000).toFixed(0)}K pax</span><span>${def.turns} turns</span><span>$${def.upkeep}M/mo</span></div>
      </div>
      <div class="rp-proj-action">${action}</div>
    </article>`;
  }).join('');

  return modalHead('&#9878; RESEARCH &amp; UPGRADES') + `<div class="rp-console">
    ${slotsStrip}
    ${inProgHtml}
    <div class="rp-console-layout">
      <nav class="rp-region-rail-list" aria-label="Project regions">${regionRail}</nav>
      <section class="rp-project-stage">
        <div class="rp-stage-head">
          <div><span class="rp-console-kicker">${selectedRegion.toUpperCase()} · ${PROJECT_ORDER.length-selectedCompleted.length-selectedActive.length} AVAILABLE</span><h2>Regional research program</h2></div>
          <span class="rp-stage-status ${selectedStanding}">${selectedRegion===focusReg?'PRIORITY REGION':STAND_WORD[selectedStanding]}</span>
        </div>
        <div class="rp-project-list">${projectList}</div>
      </section>
    </div>
  </div>`;
}

function buildConquestOverlay(){
  if(!STATE.showConquest) return '';
  let k; try { k = crownIntel(); } catch(e){ return ''; }
  const cen = conquestCentroids(), st = {};
  k.led.forEach(x=>st[x.reg]={s:'led'});
  k.contested.forEach(x=>st[x.reg]={s:'contested',gap:x.gap});
  k.absent.forEach(x=>st[x.reg]={s:'absent'});
  const COL={led:'#5fe0a0',contested:'#ffcf5a',absent:'#7a8694'};
  const WORD={led:'LED',contested:'CONTESTED',absent:'OPEN'};
  let out='';
  REGIONS.forEach(reg=>{
    const c=cen[reg]; if(!c) return;
    const info=st[reg]||{s:'absent'}, col=COL[info.s], word=WORD[info.s];
    const sub = info.s==='contested' ? `\u2212${Math.round(info.gap)}` : (info.s==='led'?'\u2713':'');
    out += `<g transform="translate(${c.x.toFixed(1)},${c.y.toFixed(1)})"><g class="cmark">`
        +  `<rect x="-45" y="-15" width="90" height="30" rx="6" fill="rgba(8,13,20,0.86)" stroke="${col}" stroke-width="1.5"/>`
        +  `<circle cx="-35" cy="-5.5" r="3.4" fill="${col}"/>`
        +  `<text x="-28" y="-2.5" font-size="8.5" font-weight="700" fill="#e8eef2" font-family="'DM Mono',monospace" letter-spacing="0.3">${reg.toUpperCase()}</text>`
        +  `<text x="-35" y="9.5" font-size="8" font-weight="700" fill="${col}" font-family="'DM Mono',monospace" letter-spacing="0.4">${word}${sub?'  '+sub:''}</text>`
        +  `</g></g>`;
  });
  return out;
}
function toggleConquest(force){
  STATE.showConquest = (force===true) ? true : !STATE.showConquest;
  const btn = document.getElementById('conquest-toggle');
  if(btn) btn.classList.toggle('active', STATE.showConquest);
  renderMap();
}
function toggleDemandOverlay() {
  _demandOverlayOn = !_demandOverlayOn;
  const btn = document.getElementById('demand-toggle');
  if (btn) btn.classList.toggle('active', _demandOverlayOn);
  renderMap();
}
function buildDemandOverlay() {
  if (!_demandOverlayOn) return '';
  let out = '';
  Object.entries(CITIES).forEach(([name, c]) => {
    if (c.level < 3) return; // only meaningful cities
    const closestHub = STATE.hubs.reduce((best, h) => {
      const d = getDistance(h, name);
      return (!best || d < best.dist) ? { hub: h, dist: d } : best;
    }, null);
    if (!closestHub) return;
    const baseDemand = (c.pop * 180 + c.econ * 40 + c.tourism * 30) / (1 + closestHub.dist / 4000);
    const servedCap  = STATE.routes
      .filter(r => r.to === name || r.from === name)
      .reduce((s, r) => {
        const ac = AIRCRAFT[r.plane] || {};
        return s + (ac.seats||150) * (r.flights||3) * 4.3;
      }, 0);
    const unmet = Math.max(0, baseDemand - servedCap);
    const ratio = Math.min(1, unmet / Math.max(1, baseDemand));
    // Weight by city size so small unserved airports read as modest
    // opportunities (yellow/green), not the same blazing red as an
    // unserved megacity. pop + level both feed significance.
    const sig  = Math.min(1, c.pop / 6 + (c.level - 2) * 0.12);
    const heat = ratio * (0.25 + 0.75 * sig);
    if (heat < 0.20) return; // well served or too minor to flag
    // Smooth green→yellow→orange→red ramp; red reserved for big unmet demand
    const hue   = Math.round(115 * (1 - heat));
    const color = `hsl(${hue},82%,52%)`;
    const radius = 5 + heat * 16;
    out += `<circle cx="${c.x}" cy="${c.y}" r="${radius}"
      fill="${color}" opacity="${0.08 + heat * 0.16}"
      vector-effect="non-scaling-stroke" pointer-events="none"
      class="demand-circle"/>`;
    out += `<circle cx="${c.x}" cy="${c.y}" r="${Math.max(3.5, radius * 0.4)}"
      fill="${color}" opacity="${0.30 + heat * 0.35}"
      vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  });
  return out;
}
function setNewsFilter(f, btn) {
  _newsFilter = f;
  document.querySelectorAll('.nf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderEventsList();
}
function clearNews() {
  STATE.events = [];
  renderEventsList();
  if (typeof showFlash === 'function') showFlash('News feed cleared');
}
function renderEventsList() {
  const filtered = _newsFilter === 'all'
    ? STATE.events
    : STATE.events.filter(e => e.type === _newsFilter);
  const el = document.getElementById('events-list');
  if (!el) return;
  el.innerHTML = filtered.length
    ? filtered.map(e => {
        const tgt = e.city || e.region || '';
        const cl = tgt ? ' ev-clickable' : '';
        const isWx = (e.text || '').startsWith('[WEATHER]');
        const oc = tgt ? ` onclick="newsGoTo('${(e.city||'').replace(/'/g,"\\'")}','${(e.region||'').replace(/'/g,"\\'")}',${isWx})"` : '';
        const arrow = tgt ? ` <span class="ev-goto" title="Go to ${e.city||e.region}">\u2197</span>` : '';
        return `<div class="event-item ${e.type}${cl}"${oc}>
        <div class="ev-time">${e.time}${arrow}</div>
        <div>${e.text}</div>
      </div>`;
      }).join('')
    : `<div style="color:var(--muted2);font-size:11.3px;padding:12px 10px">No ${_newsFilter === 'all' ? '' : _newsFilter + ' '}events yet.</div>`;
}
function showFlash(msg){
  const el=document.getElementById('event-flash');
  el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),4000);
}
function switchTab(t){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  const tabBtn = document.querySelector(`[onclick="switchTab('${t}')"]`);
  if (tabBtn) tabBtn.classList.add('active');
  const tabPane = document.getElementById('tab-'+t);
  if (tabPane) tabPane.classList.add('active');
  if(t==='routes')renderRoutesList(); if(t==='fleet')renderFleet();
  if(t==='rankings')renderRankings(); if(t==='rivals')renderRivals(); if(t==='events')renderEventsList();
}
function openModal(type, arg){
  const ov=document.getElementById('modal-overlay'), c=document.getElementById('modal-content');
  ov.classList.add('open');
  ov.classList.toggle('research-hub-mode', type==='research-hub');
  c.classList.remove('modal-city');
  const map={'new-route':buildNewRoute,'buy-planes':buildBuyPlanes,'buy-biz':buildBiz,
    'negotiations':buildNegotiations,'budget':buildBudget,'build-hub':buildHub,
    'bank':buildBank,'ledger':buildLedger,'logviewer':buildLogViewer,'shares':buildShares,'campaign':buildCampaign,'settings':buildSettings,
    'crew':()=>buildCrewModal('roster'),'hr':()=>buildCrewModal('hr'),'guide':()=>buildGuideModal(arg),
    'projects':buildProjectsModal,'research-hub':buildResearchHub,'route-manager':buildRouteManager,'fleet-page':buildFleetPage};
  if(map[type]) c.innerHTML=map[type]();
  c.classList.toggle('modal-wide', type==='new-route' || type==='buy-planes' || type==='fleet-page' || type==='budget');
  c.classList.toggle('modal-new-route', type==='new-route');
  c.classList.toggle('modal-negotiations', type==='negotiations');
  c.classList.toggle('modal-route-manager', type==='route-manager');
  c.classList.toggle('modal-projects', type==='projects');
  c.classList.toggle('modal-research-hub', type==='research-hub');
  c.classList.toggle('modal-budget', type==='budget');
}
function openRouteCreation(from,to){
  document.getElementById('modal-overlay').classList.add('open');
  const c=document.getElementById('modal-content');
  c.classList.remove('modal-city');
  c.innerHTML=buildNewRoute(from,to);
  c.classList.add('modal-wide','modal-new-route');
}
function closeModal(){
  const overlay = document.getElementById('modal-overlay');
  const wasOpen = overlay.classList.contains('open');
  overlay.classList.remove('open');
  overlay.classList.remove('research-hub-mode');
  if (wasOpen) blockMapWheel();
  const c=document.getElementById('modal-content');
  if(c) c.classList.remove('modal-wide','modal-new-route','modal-negotiations','modal-route-manager','modal-projects','modal-research-hub','modal-budget','modal-city');
  STATE.routeFrom=null; STATE.selectedCity=null; hideCityPanel();
}
function closeModalOutside(e){ if(e.target===document.getElementById('modal-overlay'))closeModal(); }
function modalHead(title){ return `<div class="modal-header"><div class="modal-title">${title}</div><button class="modal-close" onclick="closeModal()">×</button></div>`; }
// ── UI KIT gallery (dev reference) — call openUIKit() from console.
// Renders every uk-* component so the shared design system can be verified.
function openUIKit(){
  const sec=(t,inner)=>`<div style="margin:0 0 18px"><div style="font-size:12.4px;font-weight:800;letter-spacing:1.2px;color:var(--accent2);text-transform:uppercase;margin-bottom:9px">${t}</div>${inner}</div>`;
  const row=inner=>`<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">${inner}</div>`;
  const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${p}</svg>`;
  const html = modalHead('🎨 UI KIT — shared design system') + `<div class="modal-body" style="max-height:74vh;overflow:auto">
    ${sec('Buttons', row(`
      <button class="uk-btn uk-btn--solid">Primary</button>
      <button class="uk-btn">Default</button>
      <button class="uk-btn uk-btn--secondary">Secondary</button>
      <button class="uk-btn uk-btn--ghost">Ghost</button>
      <button class="uk-btn uk-btn--danger">Danger</button>
      <button class="uk-btn" disabled>Disabled</button>
      <button class="uk-btn uk-btn--sm uk-btn--solid">Small</button>`))}
    ${sec('Tabs', `<div class="uk-tabs"><button class="uk-tab is-active">Overview</button><button class="uk-tab">Demand</button><button class="uk-tab">Competition</button></div>`)}
    ${sec('Toggle &amp; icon row', row(`
      <span class="uk-switch is-on" onclick="this.classList.toggle('is-on')"><span class="uk-track"><span class="uk-thumb"></span></span><span class="uk-sw-label">ON</span></span>
      <span class="uk-switch" onclick="this.classList.toggle('is-on')"><span class="uk-track"><span class="uk-thumb"></span></span><span class="uk-sw-label">OFF</span></span>
      <span class="uk-iconbtn is-active">${ic('<path d="M4 6h16M4 12h16M4 18h16"/>')}</span>
      <span class="uk-iconbtn">${ic('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>')}</span>
      <span class="uk-iconbtn">${ic('<path d="M2 15l9-2.6V5a1 1 0 012 0v7.4l9 2.6"/>')}</span>
      <span class="uk-iconbtn">${ic('<path d="M4 19V9m5 10V5m5 14v-7m5 7V8"/>')}</span>`))}
    ${sec('Status badges', row(`
      <span class="uk-badge uk-badge--profit">Profitable</span>
      <span class="uk-badge uk-badge--stable">Stable</span>
      <span class="uk-badge uk-badge--contested">Contested</span>
      <span class="uk-badge uk-badge--risk">At Risk</span>
      <span class="uk-badge uk-badge--new">New Route</span>
      <span class="uk-badge uk-badge--rival">Rival Activity</span>`))}
    ${sec('Info card', `<div class="uk-info" style="max-width:320px">
      <div class="uk-info-head"><span class="uk-info-pair">JFK <span class="uk-arrow">→</span> LHR</span><span class="uk-badge uk-badge--profit">Profitable</span></div>
      <div class="uk-info-grid">
        <div class="uk-info-cell"><div class="uk-k">Demand</div><div class="uk-v hi">92</div><div class="uk-meter"><i style="width:92%"></i></div></div>
        <div class="uk-info-cell"><div class="uk-k">Competition</div><div class="uk-v lo">Low</div></div>
        <div class="uk-info-cell"><div class="uk-k">Est. Profit / Q</div><div class="uk-v">$8.7M</div></div>
        <div class="uk-info-cell"><div class="uk-k">Distance</div><div class="uk-v">3,451 nm</div></div>
      </div></div>`)}
    ${sec('Event toasts', `<div style="display:flex;flex-direction:column;gap:8px;max-width:360px">
      <div class="uk-toast uk-toast--good"><span class="uk-toast-ic">${ic('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>')}</span><span class="uk-toast-msg">Demand surge in Europe!</span><span class="uk-toast-x">×</span></div>
      <div class="uk-toast uk-toast--fuel"><span class="uk-toast-ic">${ic('<rect x="4" y="9" width="9" height="11" rx="1"/><path d="M13 13h3a2 2 0 012 2v2a2 2 0 002 2"/>')}</span><span class="uk-toast-msg">Fuel prices increased by 7%.</span><span class="uk-toast-x">×</span></div>
      <div class="uk-toast uk-toast--rival"><span class="uk-toast-ic">${ic('<path d="M12 2l9 16H3z"/><path d="M12 9v4"/>')}</span><span class="uk-toast-msg">WorldJet entered ORD–LHR.</span><span class="uk-toast-x">×</span></div>
      <div class="uk-toast uk-toast--info"><span class="uk-toast-ic">${ic('<path d="M4 21V8l8-5 8 5v13"/>')}</span><span class="uk-toast-msg">Heathrow slots available.</span><span class="uk-toast-x">×</span></div>
    </div>`)}
    ${sec('Panels', `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="uk-panel"><div class="uk-panel-head"><span class="uk-panel-title">Panel Title</span><span class="uk-panel-x">×</span></div><div class="uk-panel-body">This is a standard panel used for content sections.</div></div>
      <div class="uk-panel uk-panel--warn"><div class="uk-panel-head"><span class="uk-panel-title">Panel Title</span><span class="uk-panel-x">×</span></div><div class="uk-panel-body">Warning or important information appears here.</div></div>
    </div>`)}
    <div style="font-size:11.3px;color:var(--muted2);letter-spacing:.5px;margin-top:6px">UI STYLE GUIDE: dark theme, neon accents, high contrast, clear hierarchy, minimal noise.</div>
  </div>`;
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}

/* ============================ ROUTE MANAGER ============================
   Full-network triage modal. Reads live stored r.load/r.profit/r.pax +
   deterministic breakevenLoad (no processRoute jitter). Reuses .gchev rows.
   Actions wired to real engines: fare stepper, Close (releaseRouteAirframes
   via closeRouteConfirm), Open -> P&L (openPnlModal). Re-renders in place;
   expand state persists across fare edits. */
let _rmFilter = 'all';      // all | losing | belowbe | contested
let _rmSort   = 'risk';     // risk | pnl | load | az
let _rmOpen   = {};         // routeKey -> true (expanded rows persist)
function _rmKey(r){ return `${r.from}__${r.to}`; }
function _rmContestedSet(){
  const set = new Set();
  try{ (rivalIntel().contested||[]).forEach(c=>set.add(`${c.from}__${c.to}`)); }catch(e){}
  return set;
}
function _rmRows(){
  const cont = _rmContestedSet();
  return (STATE.routes||[]).map(r=>{
    const be   = breakevenLoad(r);
    const load = r.load||0, profit = r.profit||0, pax = r.pax||0;
    const contested = cont.has(_rmKey(r));
    return { r, be, load, profit, pax, contested, cushion: load-be };
  });
}
function _rmFiltered(rows){
  if(_rmFilter==='losing')    return rows.filter(x=>x.profit < 0);
  if(_rmFilter==='belowbe')   return rows.filter(x=>x.load < x.be);
  if(_rmFilter==='contested') return rows.filter(x=>x.contested);
  return rows;
}
function _rmSorted(rows){
  const a=[...rows];
  if(_rmSort==='pnl')  a.sort((x,y)=>x.profit-y.profit);                 // worst first
  else if(_rmSort==='load') a.sort((x,y)=>x.load-y.load);                // emptiest first
  else if(_rmSort==='az')   a.sort((x,y)=>(x.r.from+x.r.to).localeCompare(y.r.from+y.r.to));
  else a.sort((x,y)=>x.cushion-y.cushion);                              // at-risk: smallest cushion first
  return a;
}
function buildRouteManager(){
  return modalHead('Route Manager')
    + `<div id="rm-body">${_rmInner()}</div>`;
}
function _rmInner(){
  const rows = _rmRows();
  const losing   = rows.filter(x=>x.profit<0).length;
  const belowbe  = rows.filter(x=>x.load<x.be).length;
  const contested= rows.filter(x=>x.contested).length;
  const net      = rows.reduce((s,x)=>s+x.profit,0);
  if(!rows.length){
    const fallbackEntry = Object.entries(AIRCRAFT).find(([,a])=>a.era<=STATE.year) || Object.entries(AIRCRAFT)[0];
    const emptyEntry = Object.entries(STATE.planes||{}).find(([,p])=>(p.owned||0)>0) || fallbackEntry;
    const [emptyName,emptyAircraft] = emptyEntry;
    const emptyIdentity = typeof acIdentity==='function' ? acIdentity(emptyName) : null;
    const emptyPlane = typeof aircraftSVG==='function'
      ? aircraftSVG(emptyName,emptyAircraft,emptyIdentity?.color2||STATE.livery||'#a789ff',true)
      : `<span class="rm-empty-plane-fallback" aria-hidden="true">&#9992;</span>`;
    const emptyHub = (STATE.hubs||[])[0] || STATE.homeBase || 'Home';
    const emptyHubCode = CITIES[emptyHub]?.abbr || emptyHub;
    const readyAircraft = Object.values(STATE.planes||{}).reduce((sum,p)=>sum+Math.max(0,(p.owned||0)-(p.assigned||0)),0);
    return `<div class="rm-empty rm-empty--routes">
      <div class="rm-empty-content">
        <div class="rm-empty-kicker"><span></span>Network ready</div>
        <div class="rm-empty-title">Your network starts here.</div>
        <div class="rm-empty-text">Choose a destination from ${emptyHub} and put your available fleet to work.</div>
        <div class="rm-empty-readiness">
          <div><b>${emptyHubCode}</b><span>Home hub</span></div>
          <div><b>${readyAircraft}</b><span>Aircraft ready</span></div>
        </div>
        <button type="button" class="rm-empty-action" onclick="closeModal();openModal('new-route')">
          <span>Plan First Route</span><span class="rm-empty-action-arrow" aria-hidden="true">&#8594;</span>
        </button>
      </div>
      <div class="rm-empty-visual">
        <div class="rm-empty-route-line" aria-hidden="true"><span></span><span></span></div>
        <div class="rm-empty-art">${emptyPlane}</div>
        <div class="rm-empty-model"><span>Ready fleet</span><b>${emptyName}</b></div>
      </div>
    </div>`;
  }
  // KPI strip
  const kpis = `<div class="rm-kpis">
    <div class="rm-kpi"><div class="rk-v">${rows.length}</div><div class="rk-k">Routes</div></div>
    <div class="rm-kpi"><div class="rk-v" style="color:${net>=0?'var(--profit)':'var(--loss)'}">${net>=0?'+':''}$${net.toFixed(1)}M</div><div class="rk-k">Net / mo</div></div>
    <div class="rm-kpi"><div class="rk-v" style="color:${losing?'var(--loss)':'var(--muted2)'}">${losing}</div><div class="rk-k">Losing</div></div>
    <div class="rm-kpi"><div class="rk-v" style="color:${belowbe?'var(--warn)':'var(--muted2)'}">${belowbe}</div><div class="rk-k">Below B/E</div></div>
  </div>`;
  // filters + sort
  const fbtn=(id,label,count)=>`<button class="rm-fbtn ${_rmFilter===id?'active':''}" onclick="rmSetFilter('${id}')">${label}${count!=null?` <span class="rm-ct">${count}</span>`:''}</button>`;
  const sbtn=(id,label)=>`<button class="rm-sbtn ${_rmSort===id?'active':''}" onclick="rmSetSort('${id}')">${label}</button>`;
  const controls = `<div class="rm-controls">
    <div class="rm-filters">${fbtn('all','All',rows.length)}${fbtn('losing','Losing',losing)}${fbtn('belowbe','Below B/E',belowbe)}${fbtn('contested','Contested',contested)}</div>
    <div class="rm-sorts"><span class="rm-sort-lbl">Sort</span>${sbtn('risk','At-risk')}${sbtn('pnl','P&L')}${sbtn('load','Load')}${sbtn('az','A–Z')}</div>
  </div>`;
  const list = _rmSorted(_rmFiltered(rows)).map(_rmRowHTML).join('') ||
    `<div class="rm-empty" style="padding:24px">No routes match this filter.</div>`;
  return kpis + controls + `<div class="rm-list">${list}</div>`;
}
function _rmRowHTML(x){
  const {r,be,load,profit,pax,contested,cushion}=x;
  const cf=CITIES[r.from]||{}, ct=CITIES[r.to]||{};
  const fa=cf.abbr||r.from.slice(0,3).toUpperCase(), ta=ct.abbr||r.to.slice(0,3).toUpperCase();
  const intl = cf.region!==ct.region;
  const open = !!_rmOpen[_rmKey(r)];
  const dist = getDistance(r.from,r.to);
  // load-vs-breakeven bar
  const barPct = Math.max(0,Math.min(100,load));
  const bePos  = Math.max(0,Math.min(100,be));
  const loadCol = load<be ? 'var(--loss)' : (cushion<10 ? 'var(--warn)' : 'var(--profit)');
  const statusDot = profit<0 ? 'var(--loss)' : (load<be?'var(--warn)':'var(--profit)');
  const bar = `<div class="rm-bar"><div class="rm-bar-fill" style="width:${barPct}%;background:${loadCol}"></div><div class="rm-bar-be" style="left:${bePos}%" title="breakeven ${be}%"></div></div>`;
  // expanded breakdown
  let body='';
  if(open){
    const plane = STATE.planes[r.plane] || AIRCRAFT[r.plane] || {};
    const seatsMo = (plane.seats||0) * (r.flights||0) * ECON.weeksPerMonth;
    const rev = r._rev||0, cost=r._cost||0;
    const marginSeat = seatsMo>0 ? ((rev-cost)*1e6/seatsMo) : 0;
    const annual = profit*12;
    let hint='';
    try{ const h=routeHints(r,{load,profit}); if(h&&h.length) hint=`<div class="rm-hint"><span class="rm-hint-ic">${h[0].icon||'💡'}</span><span>${h[0].text}${h[0].fix?` <b>${h[0].fix}</b>`:''}</span></div>`; }catch(e){}
    const cell=(k,v,c)=>`<div class="rm-cell"><div class="rm-cell-k">${k}</div><div class="rm-cell-v" ${c?`style="color:${c}"`:''}>${v}</div></div>`;
    const summary = `<div class="rm-summary">
      <span>Fare <b>$${r.fare}</b></span><span>Net <b style="color:${profit<0?'var(--loss)':'var(--profit)'}">${profit>=0?'+':''}$${profit.toFixed(2)}M</b></span>
      <span>${load}% load</span><span>be ${be}%</span>${contested?'<span class="rm-flag">⚔ contested</span>':''}
      <span>${dist}mi · ${r.flights}/wk</span></div>`;
    const grid = `<div class="rm-grid">
      ${cell('Demand / seats', `${pax} / ${Math.round(seatsMo)}`)}
      ${cell('Revenue', `$${rev.toFixed(2)}M`)}
      ${cell('Fixed cost', `$${cost.toFixed(2)}M`)}
      ${cell('Margin / seat', `$${marginSeat.toFixed(0)}`, marginSeat<0?'var(--loss)':'')}
      ${cell('Breakeven cushion', `${cushion>=0?'+':''}${cushion}%`, cushion<0?'var(--loss)':(cushion<10?'var(--warn)':'var(--profit)'))}
      ${cell('Annualized net', `${annual>=0?'+':''}$${annual.toFixed(1)}M`, annual<0?'var(--loss)':'')}
    </div>`;
    const actions = `<div class="rm-actions">
      <div class="rm-fare">Fare
        <button class="rm-step" onclick="rmFare('${_rmEsc(r.from)}','${_rmEsc(r.to)}',-10)">−</button>
        <span class="rm-fare-v">$${r.fare}</span>
        <button class="rm-step" onclick="rmFare('${_rmEsc(r.from)}','${_rmEsc(r.to)}',10)">+</button>
      </div>
      <button class="rm-act" onclick="rmOpenPnl('${_rmEsc(r.from)}','${_rmEsc(r.to)}')">P&L ›</button>
      <button class="rm-act rm-danger" onclick="rmClose('${_rmEsc(r.from)}','${_rmEsc(r.to)}')">Close route</button>
    </div>`;
    body = `<div class="gchev-body"><div class="gchev-inner rm-inner">${summary}${hint}${grid}${actions}</div></div>`;
  }
  return `<div class="gchev rm-row ${open?'open':''}">
    <div class="gchev-head rm-head" onclick="rmToggle('${_rmEsc(r.from)}','${_rmEsc(r.to)}')">
      <span class="rm-dot" style="background:${statusDot}"></span>
      <span class="rm-pair">${fa}–${ta}</span>
      <span class="rm-tag ${intl?'intl':'dom'}">${intl?'INTL':'DOM'}</span>
      <span class="rm-city">${r.to}</span>
      ${bar}
      <span class="rm-load" style="color:${loadCol}">${load}%</span>
      <span class="gchev-arrow rm-arrow">›</span>
    </div>${body}
  </div>`;
}
function _rmEsc(s){ return String(s).replace(/'/g,"\\'"); }
function _rmRefresh(){ const b=document.getElementById('rm-body'); if(b) b.innerHTML=_rmInner(); }
function rmSetFilter(f){ _rmFilter=f; _rmRefresh(); }
function rmSetSort(s){ _rmSort=s; _rmRefresh(); }
function rmToggle(from,to){ const k=`${from}__${to}`; _rmOpen[k]=!_rmOpen[k]; _rmRefresh(); }
function rmFare(from,to,delta){
  const r=STATE.routes.find(x=>x.from===from&&x.to===to); if(!r) return;
  r.fare = Math.max(50, Math.min(999, (r.fare||100)+delta));
  _rmRefresh();
  if(typeof updateUI==='function') updateUI();
}
function rmOpenPnl(from,to){
  const r=STATE.routes.find(x=>x.from===from&&x.to===to); if(!r) return;
  closeModal(); openPnlModal(r);
}
function rmClose(from,to){
  if(typeof closeRouteConfirm==='function') closeRouteConfirm(from,to);
  delete _rmOpen[`${from}__${to}`];
  _rmRefresh();
  if(typeof updateUI==='function') updateUI();
}
function openRouteManager(){ _rmOpen={}; openModal('route-manager'); }

let _nrRegion = null;
let _nrPlanes = {};   // multi-plane route builder: { aircraftType: flightsPerWeek }  (1 flight/wk = 1 airframe)
let _nrSubregion = null;
function nrEsc(s){ return String(s).replace(/'/g, "\\'"); }
function nrRouteDist(){ const f=val('r-from'), t=val('r-to'); return (f&&t&&f!==t)?getDistance(f,t):0; }
function nrTotalFlights(){ return Object.values(_nrPlanes).reduce((s,v)=>s+v,0); }
function nrHubRow(sel){
  return STATE.hubs.filter(c=>CITIES[c]).map(c => {
    const ci = CITIES[c];
    if (c === sel) {
      const tint = (typeof REGION_TINT!=='undefined' && REGION_TINT[ci.region]) || ['#1b3a52','#0e1f30'];
      return `<div class="nr-hub-banner" style="--h1:${tint[0]};--h2:${tint[1]}" onclick="nrSetFrom('${nrEsc(c)}')">
        <span class="nr-hub-star">★</span><span class="nr-hub-name">${c.toUpperCase()}</span><span class="nr-hub-iata">${ci.abbr||''}</span>
      </div>`;
    }
    return `<div class="region-tab" onclick="nrSetFrom('${nrEsc(c)}')">★ ${c}</div>`;
  }).join('');
}
function nrRegionRow(){
  return `<select id="nr-region-select" class="nr-location-select" aria-label="Destination region" onchange="nrSetRegion(this.value)">
    <option value=""${_nrRegion===null?' selected':''}>🌐 All Regions</option>
    ${REGIONS.map(r=>`<option value="${r}"${r===_nrRegion?' selected':''}>${r}</option>`).join('')}
  </select>`;
}
function nrSubregionKey(ci, name){
  const subs = SUBREGIONS[_nrRegion];
  if (!subs) return null;
  for (const s of subs) { if (s.test(ci.lat, ci.lon, name)) return s.key; }
  return null;
}
function nrSubregionRow(fromOverride){
  const subs = SUBREGIONS[_nrRegion];
  if (!subs) return `<select id="nr-subregion-select" class="nr-location-select" aria-label="Destination subregion" disabled><option value="">All Subregions</option></select>`;
  const from = fromOverride !== undefined ? fromOverride : (val('r-from')||'');
  const visible = subs.filter(s =>
    Object.entries(CITIES).some(([c,ci]) => ci.region===_nrRegion && c!==from && nrSubregionKey(ci,c)===s.key)
  );
  return `<select id="nr-subregion-select" class="nr-location-select" aria-label="Destination subregion" onchange="nrSetSubregion(this.value)"${visible.length?'':' disabled'}>
    <option value=""${_nrSubregion===null?' selected':''}>All Subregions</option>
    ${visible.map(s=>`<option value="${s.key}"${s.key===_nrSubregion?' selected':''}>${s.label}</option>`).join('')}
  </select>`;
}
function nrDestinationCities(fromOverride){
  const from = fromOverride !== undefined ? fromOverride : val('r-from');
  return Object.entries(CITIES)
    .filter(([c,ci]) => c !== from && (_nrRegion===null || ci.region === _nrRegion)
      && (_nrSubregion === null || nrSubregionKey(ci,c) === _nrSubregion))
    .sort((a,b) => (b[1].econ + b[1].tourism + b[1].pop*4) - (a[1].econ + a[1].tourism + a[1].pop*4));
}
function nrRecommendedDestinationEntry(fromOverride){
  const from = fromOverride !== undefined ? fromOverride : val('r-from');
  return nrDestinationCities(from).find(([c]) =>
    !STATE.routes.some(r => (r.from===from&&r.to===c)||(r.from===c&&r.to===from)) && !STATE.slotFreeze?.[c]
  ) || null;
}
function nrCityGrid(fromOverride, toOverride){
  const from = fromOverride !== undefined ? fromOverride : val('r-from');
  const to = toOverride !== undefined ? toOverride : val('r-to');
  const cities = nrDestinationCities(from);
  if (!cities.length) return '<div style="grid-column:1/-1;color:var(--muted);font-size:11.3px;padding:8px">No destinations in this subregion</div>';
  const featuredCity = nrRecommendedDestinationEntry(from)?.[0];
  const cityCards = featuredCity ? cities.filter(([c]) => c !== featuredCity) : cities;
  const score = ci => ci.econ + ci.tourism + ci.pop*4;
  const maxScore = Math.max(...cities.map(([,ci]) => score(ci)));
  return cityCards.map(([c,ci]) => {
    const dupe = STATE.routes.some(r => (r.from===from&&r.to===c)||(r.from===c&&r.to===from));
    const frozen = STATE.slotFreeze?.[c];
    const isHub = STATE.hubs.includes(c);
    const seld = c === to;
    const dis = dupe || frozen;
    const dist = from ? getDistance(from, c) : null;
    const demPct = Math.round(score(ci) / maxScore * 100);
    const demColor = demPct > 70 ? 'var(--profit)' : demPct > 42 ? 'var(--accent)' : 'var(--muted2)';
    const lean = ci.econ - ci.tourism;
    const tag = lean > 12 ? {t:'BIZ', c:'var(--accent2)'} : lean < -12 ? {t:'LEIS', c:'var(--accent)'} : {t:'MIX', c:'var(--muted2)'};
    const status = frozen ? '🚫' : dupe ? '✓ ROUTE' : ci.abbr;
    return `<button type="button" class="nr-city-card${seld?' is-selected':''}${dis?' is-disabled':''}" onclick="${dis?'':`nrSetTo('${nrEsc(c)}')`}" ${dis?'disabled':''}>
      <span class="nr-city-top"><strong>${isHub?'<span class="nr-city-hub">★</span> ':''}${c}</strong><b class="${dupe?'has-route':''}">${status}</b></span>
      <span class="nr-city-demand"><i style="--nr-demand:${demPct}%;--nr-demand-color:${demColor}"></i>${dist!=null ? `<em>${Math.round(dist).toLocaleString()} mi</em>` : ''}</span>
      <span class="nr-city-bottom"><b style="color:${tag.c}">${tag.t}</b><small>${demPct>70?'High demand':demPct>42?'Steady demand':'Developing'}</small></span>
    </button>`;
  }).join('');
}
function nrFeaturedDestination(fromOverride, toOverride){
  const from = fromOverride !== undefined ? fromOverride : val('r-from');
  const to = toOverride !== undefined ? toOverride : val('r-to');
  const entry = nrRecommendedDestinationEntry(from);
  if (!entry) return '';
  const [city, ci] = entry;
  const art = typeof AECitySkylineManifest !== 'undefined' ? AECitySkylineManifest.get(city) : null;
  const media = art?.src
    ? `<img src="${art.src}" alt="${city} skyline">`
    : (typeof AECityRenderer !== 'undefined' ? AECityRenderer.render(city, ci.region) : '');
  const lean = ci.econ - ci.tourism;
  const demand = lean > 12 ? 'Strong business demand' : lean < -12 ? 'Strong leisure demand' : 'Balanced travel demand';
  const dist = from ? getDistance(from, city) : 0;
  return `<button type="button" class="nr-featured${city===to?' is-selected':''}" onclick="nrSetTo('${nrEsc(city)}')">
    <span class="nr-featured-media">${media}</span><span class="nr-featured-shade"></span>
    <span class="nr-featured-copy"><small>RECOMMENDED EXPANSION</small><strong>${city}</strong><span>${demand}${dist?` · ${Math.round(dist).toLocaleString()} miles`:''}</span></span>
    <span class="nr-featured-code">${ci.abbr||''} <b>↗</b></span>
  </button>`;
}
function nrRouteHero(fromOverride, toOverride){
  const from = fromOverride !== undefined ? fromOverride : val('r-from');
  const to = toOverride !== undefined ? toOverride : val('r-to');
  const fromCity = CITIES[from], toCity = CITIES[to];
  const distance = fromCity && toCity ? `${Math.round(getDistance(from,to)).toLocaleString()} mi` : 'Choose destination';
  return `<div class="nr-route-place"><strong>${fromCity?.abbr||'—'}</strong><small>${from||'NO HUB'}</small></div>
    <div class="nr-route-line"><span>✈</span><small>${distance}</small></div>
    <div class="nr-route-place is-destination"><strong>${toCity?.abbr||'—'}</strong><small>${to||'DESTINATION'}</small></div>`;
}
function nrRefreshRouteChrome(){
  const from = val('r-from'), to = val('r-to');
  const feature = document.getElementById('nr-featured-destination'); if (feature) feature.innerHTML = nrFeaturedDestination(from,to);
  const hero = document.getElementById('nr-route-hero'); if (hero) hero.innerHTML = nrRouteHero(from,to);
  const title = document.getElementById('nr-plan-title'); if (title) title.textContent = to ? `${to} route plan` : 'Build the flight';
  const count = document.getElementById('nr-destination-count'); if (count) count.textContent = `${nrDestinationCities(from).length} cities`;
}
function nrPlaneList(){
  const entries = Object.entries(STATE.planes);
  if (!entries.length) return '<div style="color:var(--muted);font-size:11.3px;padding:6px">No aircraft in fleet.</div>';
  const dist = nrRouteDist();
  const totalFlights = nrTotalFlights();
  // sort: free & in-range first, then by capacity
  entries.sort((a,b) => {
    const af = (a[1].owned-a[1].assigned) > 0, bf = (b[1].owned-b[1].assigned) > 0;
    if (af !== bf) return af ? -1 : 1;
    return b[1].seats - a[1].seats;
  });
  const recIdx = entries.findIndex(([n2,p2]) => (p2.owned-p2.assigned) > 0 && !(dist > 0 && dist > p2.range));
  return entries.map(([n,p], _i) => {
    const free  = planeFree(p);
    const used  = _nrPlanes[n] || 0;
    const avail = free - used;
    const outRange = dist > 0 && dist > p.range;
    const dim   = free <= 0 && used === 0;
    const canInc = !outRange && avail > 0 && totalFlights < 14;
    const canDec = used > 0;
    const rec = _i === recIdx;
    const identity = typeof acIdentity === 'function' ? acIdentity(n) : null;
    const heroImage = typeof AC_HERO !== 'undefined' ? AC_HERO[n] : null;
    const planeArt = heroImage
      ? `<img src="${heroImage}" alt="${n}">`
      : typeof aircraftSVG === 'function'
        ? aircraftSVG(n, p, identity?.color2 || '#00d8f0', true)
        : '✈';
    return `<div class="nr-plane-row${used>0?' sel':''}${dim?' dim':''}${rec?' rec':''}">
      ${rec?'<span class="nr-rec-pill">★ RECOMMENDED</span>':''}
      <div class="nr-plane-art">${planeArt}</div>
      <div style="min-width:0;flex:1">
        <div style="color:${used>0?'var(--accent)':'var(--text)'};font-weight:700;font-size:12.4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n}${outRange?' <span style="color:var(--danger);font-weight:600;font-size:10.2px">⚠ OUT OF RANGE</span>':''}</div>
        <div style="color:var(--muted2);font-size:10.7px;margin-top:1px">${p.seats}s · ${p.range.toLocaleString()}mi · <span style="color:${free>0?'var(--profit)':'var(--muted)'}">${free} free / ${p.owned} owned</span></div>
      </div>
      <div style="display:flex;align-items:center;gap:7px;flex-shrink:0">
        <button class="nr-step" onclick="nrDecPlane('${nrEsc(n)}')" ${canDec?'':'disabled'}>−</button>
        <span style="font-family:'DM Mono';font-size:14.7px;min-width:16px;text-align:center;color:${used>0?'var(--accent)':'var(--muted)'}">${used}</span>
        <button class="nr-step" onclick="nrIncPlane('${nrEsc(n)}')" ${canInc?'':'disabled'}>+</button>
      </div>
    </div>`;
  }).join('');
}
function nrPlaneSummary(){
  const E = ECON;
  const types = Object.keys(_nrPlanes).filter(n => _nrPlanes[n] > 0);
  const totalFlights = nrTotalFlights();
  const totalSeats = types.reduce((s,n) => {
    const p = STATE.planes[n] || AIRCRAFT[n];
    return s + (p ? p.seats * _nrPlanes[n] * E.weeksPerMonth : 0);
  }, 0);
  if (!totalFlights) return `<div style="color:var(--muted2);font-size:11.3px;font-style:italic">No aircraft assigned — tap + to add flights.</div>`;
  return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:11.3px;color:var(--muted)">
    <span><b style="color:var(--text)">${totalFlights}</b> flight${totalFlights!==1?'s':''}/wk · <b style="color:var(--text)">${types.length}</b> type${types.length!==1?'s':''}</span>
    <span style="font-family:'DM Mono';color:#fff">${Math.round(totalSeats).toLocaleString()} seats/mo</span>
  </div>`;
}
function nrIncPlane(n){
  const p = STATE.planes[n]; if (!p) return;
  const free = planeFree(p), used = _nrPlanes[n] || 0;
  if (used >= free) return showFlash(`⚠ No more free ${n}`);
  const dist = nrRouteDist();
  if (dist > 0 && dist > p.range) return showFlash(`⚠ ${n} range too short for this route`);
  if (nrTotalFlights() >= 14) return showFlash('⚠ Max 14 flights/wk per route');
  _nrPlanes[n] = used + 1;
  nrRefreshPlanes();
}
function nrDecPlane(n){
  const used = _nrPlanes[n] || 0; if (used <= 0) return;
  _nrPlanes[n] = used - 1;
  if (_nrPlanes[n] === 0) delete _nrPlanes[n];
  nrRefreshPlanes();
}
function nrRefreshPlanes(){
  const list = document.getElementById('nr-plane-list'); if (list) list.innerHTML = nrPlaneList();
  const sum  = document.getElementById('nr-plane-summary'); if (sum) sum.innerHTML = nrPlaneSummary();
  updateRoutePreview();
}
function nrSetFrom(c){
  const el = document.getElementById('r-from'); if (el) el.value = c;
  const row = document.getElementById('nr-hub-row'); if (row) row.innerHTML = nrHubRow(c);
  const toEl = document.getElementById('r-to');
  if (toEl && toEl.value === c) toEl.value = '';
  _nrSubregion = null;
  const srow = document.getElementById('nr-subregion-row'); if (srow) srow.innerHTML = nrSubregionRow();
  const grid = document.getElementById('nr-city-grid'); if (grid) grid.innerHTML = nrCityGrid();
  nrRefreshRouteChrome();
  nrRefreshPlanes();
}
function nrSetRegion(r){
  _nrRegion = r || null;
  _nrSubregion = null;
  const row = document.getElementById('nr-region-row'); if (row) row.innerHTML = nrRegionRow();
  const srow = document.getElementById('nr-subregion-row'); if (srow) srow.innerHTML = nrSubregionRow();
  const grid = document.getElementById('nr-city-grid'); if (grid) grid.innerHTML = nrCityGrid();
  nrRefreshRouteChrome();
}
function nrSetSubregion(k){
  _nrSubregion = k || null;
  const row = document.getElementById('nr-subregion-row'); if (row) row.innerHTML = nrSubregionRow();
  const grid = document.getElementById('nr-city-grid'); if (grid) grid.innerHTML = nrCityGrid();
  nrRefreshRouteChrome();
}
function nrSetTo(c){
  const el = document.getElementById('r-to'); if (el) el.value = c;
  const grid = document.getElementById('nr-city-grid'); if (grid) grid.innerHTML = nrCityGrid();
  nrRefreshRouteChrome();
  nrRefreshPlanes();   // range gating depends on destination
}
function buildNewRoute(preFrom, preTo){
  const origins = STATE.hubs.filter(c => CITIES[c]);
  const fromHub = (preFrom && origins.includes(preFrom)) ? preFrom : origins[0] || '';
  const toCity = (preTo && CITIES[preTo] && preTo !== fromHub) ? preTo : '';
  _nrRegion = toCity ? CITIES[toCity].region : null;
  const firstFree = Object.entries(STATE.planes).find(([,p]) => p.owned > p.assigned);
  const hasFree = !!firstFree;
  const _liv = STATE.livery || '#a789ff';
  // fresh selection each time the dialog opens; pre-seed 1 flight of the first free type (if in range)
  _nrPlanes = {};
  _nrSubregion = null;
  if (firstFree) {
    const dist = (fromHub && toCity) ? getDistance(fromHub, toCity) : 0;
    if (dist === 0 || firstFree[1].range >= dist) _nrPlanes[firstFree[0]] = 1;
  }
  const initialCityCount = nrDestinationCities(fromHub).length;
  const fromCode = CITIES[fromHub]?.abbr || '—';
  const html = modalHead('✈ NEW ROUTE') + `<div class="nr-progress" aria-hidden="true"><span class="is-done"></span><span class="is-active"></span><span></span></div><div class="modal-body" style="--nr-airline-accent:${_liv}">
    <input type="hidden" id="r-from" value="${fromHub}">
    <input type="hidden" id="r-to" value="${toCity}">
    <div class="nr-grid">
      <section class="nr-pane nr-destination-pane">
        <div class="nr-pane-heading"><div><span>01 · CHOOSE DESTINATION</span><strong>Where do you want to fly?</strong></div><b id="nr-destination-count">${initialCityCount} cities</b></div>
        <div class="nr-origin-label">DEPARTING FROM</div>
        <div id="nr-hub-row" class="nr-hub-row">${nrHubRow(fromHub)}</div>
        <div class="nr-location-filters">
          <div id="nr-region-row" class="nr-region-row">${nrRegionRow()}</div>
          <div id="nr-subregion-row" class="nr-subregion-row">${nrSubregionRow(fromHub)}</div>
        </div>
        <div id="nr-featured-destination">${nrFeaturedDestination(fromHub,toCity)}</div>
        <div id="nr-city-grid" class="nr-city-grid">${nrCityGrid(fromHub,toCity)}</div>
      </section>
      <section class="nr-pane nr-plan-pane">
        <div class="nr-pane-heading"><div><span>02 · BUILD THE FLIGHT</span><strong id="nr-plan-title">${toCity?`${toCity} route plan`:'Build the flight'}</strong></div></div>
        <div id="nr-route-hero" class="nr-route-hero">${nrRouteHero(fromHub,toCity)}</div>
        <div class="nr-card-label">AIRCRAFT <span>Flights per week · one aircraft each</span></div>
        ${hasFree
          ? `<div id="nr-plane-list" class="nr-plane-list">${nrPlaneList()}</div>
              <div id="nr-plane-summary" class="nr-plane-summary">${nrPlaneSummary()}</div>
              <button class="nr-buy-link" onclick="openBuyPlanesForRoute(document.getElementById('r-from')?.value||'', document.getElementById('r-to')?.value||'')">＋ Buy or change aircraft type…</button>`
          : `<div class="nr-empty-aircraft">
              <div style="color:var(--danger);font-size:12.4px;font-weight:600;margin-bottom:8px">⚠ No free aircraft — buy a plane or close a route first.</div>
              ${nrPlaneList() ? `<div style="margin-bottom:9px">${nrPlaneList()}</div>` : ''}
              <button class="action-btn" style="width:100%;border-color:var(--accent);color:#fff"
                onclick="openBuyPlanesForRoute(document.getElementById('r-from')?.value||'', document.getElementById('r-to')?.value||'')">✈ Buy Aircraft</button>
            </div>`}
        <div class="nr-fare-section">
          <div class="nr-fare-heading"><span>AVERAGE ONE-WAY FARE</span><strong>$<span id="rfa-v">200</span></strong></div>
          <input type="range" id="r-fare" min="50" max="900" step="10" value="200" oninput="document.getElementById('rfa-v').textContent=this.value;updateRoutePreview()">
          <div class="nr-fare-marks">
            <span>LOW<br><b>$<span id="nr-f-low">120</span></b></span>
            <span style="text-align:center">MARKET<br><b>$<span id="nr-f-avg">200</span></b></span>
            <span style="text-align:right">HIGH<br><b>$<span id="nr-f-high">350</span></b></span>
          </div>
        </div>
        <div id="route-preview"></div>
        <div class="nr-tip"><span class="nr-tip-ic">✦</span><span>Market fare is <b>$<span id="nr-tip-avg">200</span></b>. Adjust pricing to balance demand and yield.</span></div>
      </section>
    </div>
  </div>
    <div class="nr-footer">
      <div class="nr-footer-summary"><span>✦</span><div><small id="nr-footer-label">ROUTE SETUP</small><strong id="nr-footer-pair">${fromCode} → ${CITIES[toCity]?.abbr||'—'} · ${nrTotalFlights()} flight/week</strong></div></div>
      <div class="nr-footer-actions">
        <button class="nr-add-btn" id="r-confirm-add" onclick="confirmRoute(true)" ${hasFree?'':'disabled'} title="Open this route, then keep the dialog open to add the next one">+ add another</button>
        <button class="nr-open-btn" id="r-confirm" onclick="confirmRoute(false)" ${hasFree?'':'disabled'}>✈ OPEN ROUTE <span id="nr-open-cost"></span></button>
      </div>
    </div>
  `;
  setTimeout(updateRoutePreview, 0);
  return html;
}
function rebuildDestList(fromHub) {
  // legacy hook — city grid now handles destination filtering
  const grid = document.getElementById('nr-city-grid');
  if (grid) grid.innerHTML = nrCityGrid();
}
function updateRoutePreview(){
  const from = val('r-from'), to = val('r-to');
  const fare = +val('r-fare') || 200;
  const el = document.getElementById('route-preview');
  if (!el) return;  // modal closed before deferred preview ran
  nrRefreshRouteChrome();
  const btn = document.getElementById('r-confirm');
  const btnA = document.getElementById('r-confirm-add');
  const footerLabel = document.getElementById('nr-footer-label');
  const footerPair = document.getElementById('nr-footer-pair');
  const openCostEl = document.getElementById('nr-open-cost');
  const sel = Object.keys(_nrPlanes).filter(n => _nrPlanes[n] > 0);
  const flights = nrTotalFlights();
  const fromCode = CITIES[from]?.abbr || '—', toCode = CITIES[to]?.abbr || '—';
  if (footerLabel) footerLabel.textContent = from && to && flights ? 'READY TO OPEN' : 'ROUTE SETUP';
  if (footerPair) footerPair.textContent = `${fromCode} → ${toCode} · ${flights} flight${flights===1?'':'s'}/week`;
  if (!from || !to || from === to || flights === 0) {
    el.innerHTML = '';
    if(btn) btn.disabled = true;
    if(btnA) btnA.disabled = true;
    if(openCostEl) openCostEl.textContent = '';
    return;
  }
  const dist = getDistance(from, to);
  const E = ECON;
  // capacity summed across selected types; range = every selected type must reach
  let cap = 0, outRangeTypes = [];
  sel.forEach(n => {
    const ac = STATE.planes[n] || AIRCRAFT[n];
    if (!ac) return;
    if (dist > ac.range) outRangeTypes.push(n);
    cap += ac.seats * _nrPlanes[n] * E.weeksPerMonth;
  });
  const canFly = outRangeTypes.length === 0;
  const isDupe = STATE.routes.some(r => (r.from===from&&r.to===to)||(r.from===to&&r.to===from));
  const isSlotFrozen = STATE.slotFreeze && STATE.slotFreeze[to];
  const openCost = Math.round(dist * 0.025 + 5);
  const cf = CITIES[from], ct = CITIES[to];
  let estDemand = 0;
  if (cf && ct && canFly) {
    estDemand = (cf.pop+ct.pop)*E.demandPop + (cf.econ+ct.econ)*E.demandEcon + (cf.tourism+ct.tourism)*E.demandTour;
    estDemand *= 1/(1+dist/E.distDecay);
    estDemand *= seasonalFactor(ct.region, STATE.month);
    const rivals = STATE.competitors.filter(c=>c.regionsEntered.includes(ct.region)).length;
    estDemand *= 1/(1+rivals*E.rivalSplit);
    const refFare = E.refFareBase + dist*E.refFareDist;
    estDemand *= Math.max(0.12, Math.min(1.75, 1+(refFare-fare)/refFare*E.fareElastic));
  }
  const estLoad = cap > 0 ? Math.min(100, Math.round(estDemand / cap * 100)) : 0;
  const loadColor = estLoad > 70 ? 'var(--profit)' : estLoad > 45 ? 'var(--warn)' : 'var(--loss)';
  const refFare2 = E.refFareBase + dist*E.refFareDist;
  // fare rail markers + tip follow the live market reference
  const _setT=(id,v)=>{const e2=document.getElementById(id); if(e2) e2.textContent=Math.round(v);};
  _setT('nr-f-low', refFare2*0.6); _setT('nr-f-avg', refFare2); _setT('nr-f-high', refFare2*1.75); _setT('nr-tip-avg', refFare2);
  const canOpen = canFly && !isDupe && !isSlotFrozen && STATE.cash >= openCost;
  if(btn) btn.disabled = !canOpen;
  if(btnA) btnA.disabled = !canOpen;
  if(openCostEl) openCostEl.textContent = `· $${openCost}M`;
  const estPax = canFly ? Math.round(Math.min(cap, estDemand)).toLocaleString() : '—';
  // collect warnings (only the active ones)
  const warns = [];
  if (!canFly)       warns.push(`<span style="color:var(--danger)">⚠ ${outRangeTypes.join(', ')} can't reach ${to} (${dist.toLocaleString()}mi)</span>`);
  if (isDupe)        warns.push('<span style="color:var(--danger)">⚠ Route already exists</span>');
  if (isSlotFrozen)  warns.push(`<span style="color:var(--danger)">🚫 Slot freeze at ${to} (${STATE.slotFreeze[to]}mo)</span>`);
  if (STATE.cash < openCost) warns.push(`<span style="color:var(--danger)">⚠ Need $${openCost}M (have $${STATE.cash.toFixed(0)}M)</span>`);
  if (canFly && from && hubGatesFree(from) <= 2) warns.push(`<span style="color:var(--warn)">⚠ ${from}: ${hubGatesFree(from)} gate${hubGatesFree(from)!==1?'s':''} left</span>`);
  if (canFly && !isDupe && !STATE.negotiating?.[to] && !STATE.hubs.includes(to)) warns.push('<span style="color:var(--muted2)">💡 Negotiate slots for better loads</span>');
  // ── EST. DEMAND / LOAD FACTOR / REVENUE-PER-WK block (mockup) ──
  // Demand band from load potential (demand vs capacity at this fare)
  const demandRatio = cap > 0 ? estDemand / cap : 0;
  let dLabel='Low', dColor='var(--loss)';
  if (demandRatio >= 0.85)      { dLabel='High';   dColor='var(--profit)'; }
  else if (demandRatio >= 0.55) { dLabel='Medium'; dColor='var(--warn)'; }
  const weeklyRev = canFly ? Math.round(Math.min(cap, estDemand) * fare / E.weeksPerMonth) : 0;
  const wkRevStr = canFly ? '$' + weeklyRev.toLocaleString() : '—';
  el.innerHTML = `
    <div class="nr-est3">
      <div class="nr-est">
        <div class="nr-est-k">Expected Load</div>
        <div class="nr-est-v" style="color:${canFly?loadColor:'var(--muted2)'}">${canFly?estLoad+'%':'—'}</div>
        <div class="nr-est-d">${canFly?dLabel+' demand':'Unavailable'}</div>
      </div>
      <div class="nr-est">
        <div class="nr-est-k">Passengers / mo</div>
        <div class="nr-est-v" style="color:${canFly?'var(--text)':'var(--muted2)'}">${estPax}</div>
        <div class="nr-est-d">Projected traffic</div>
      </div>
      <div class="nr-est">
        <div class="nr-est-k">Est. Revenue / wk</div>
        <div class="nr-est-v" style="color:${canFly?'var(--profit)':'var(--muted2)'}">${wkRevStr}</div>
        <div class="nr-est-d">Projected weekly sales</div>
      </div>
    </div>
    <div class="nr-preview-meta"><span>${dist.toLocaleString()} mi</span><span style="color:${dColor}">${dLabel} demand</span><span>$${openCost}M to open</span></div>
    ${warns.length ? `<div class="nr-warnings">${warns.join('')}</div>` : ''}`;
}
function confirmRoute(addAnother){
  const from=val('r-from'), to=val('r-to');
  const fare=+val('r-fare')||200;
  const mapViewBeforeRoute={
    zoom:STATE.mapZoom,
    tx:STATE.mapTX,
    ty:STATE.mapTY,
    region:STATE.viewRegion
  };
  const restoreMapView=()=>{
    STATE.mapZoom=mapViewBeforeRoute.zoom;
    STATE.mapTX=mapViewBeforeRoute.tx;
    STATE.mapTY=mapViewBeforeRoute.ty;
    STATE.viewRegion=mapViewBeforeRoute.region;
    renderRegionTabs();
  };
  if(!from||!to||from===to) return showFlash('Invalid route');
  const sel = Object.keys(_nrPlanes).filter(n => _nrPlanes[n] > 0);
  if(!sel.length) return showFlash('No aircraft assigned');
  const dist=getDistance(from,to);
  // validate every selected type: in fleet, in range, enough free copies
  for (const n of sel) {
    const p = STATE.planes[n];
    if (!p) return showFlash(`${n} not in fleet`);
    const ac = AIRCRAFT[n] || p;
    if (dist > (ac.range||0)) return showFlash(`⚠ ${n} range too short for this route`);
    if (_nrPlanes[n] > planeFree(p)) return showFlash(`⚠ Not enough free ${n}`);
  }
  if(STATE.routes.some(r=>(r.from===from&&r.to===to)||(r.from===to&&r.to===from))) return showFlash('Route already exists!');
  if(STATE.slotFreeze?.[to]) return showFlash(`🚫 Slot freeze at ${to}`);
  if(hubGatesFree(from) <= 0) return showFlash(`⚠ ${from} hub full (${hubGateCapacity(from)} gates). Expand hub or close a route.`);
  const cost=Math.round(dist*0.025+5);
  if(STATE.cash<cost) return showFlash(`⚠ Need $${cost}M`);
  if(!spendAction('Open route')) return;
  STATE.cash-=cost;
  // build the multi-plane route; 1 flight/wk = 1 airframe assigned
  const planes = sel.map(n => ({ type:n, flights:_nrPlanes[n] }));
  sel.forEach(n => { STATE.planes[n].assigned += _nrPlanes[n]; });
  const flights = planes.reduce((s,e)=>s+e.flights, 0);
  const plane = sel[0];   // legacy primary-type field for back-compat
  const newRoute = {from,to,plane,flights,fare,service:'economy',profit:0,pax:0,load:50, planes};
  STATE.routes.push(newRoute);
  const _isMaiden = !STATE._maidenDone && STATE.routes.length === 1;
  if (_isMaiden) { STATE._maidenDone = true; STATE._maidenPnlPending = true; }
  const initRes = processRoute(newRoute);
  newRoute.profit = initRes.profit;
  newRoute.pax    = initRes.pax;
  newRoute.load   = initRes.load;
  newRoute._rev   = initRes.revenue;
  newRoute._cost  = initRes.cost;
  const fleetTxt = planes.map(e=>`${e.flights}× ${e.type}`).join(', ');
  addEvent('neutral',`Route opened: ${from}→${to} (${fleetTxt}, ${flights}f/wk, $${fare})`);
  showFlash(`✓ ${from}→${to} launched`);
  guideStep(4);
  updateUI(); renderRoutesList(); renderFleet();
  if (addAnother) {
    restoreMapView();
    applyPan();
    document.getElementById('modal-content').innerHTML = buildNewRoute(from, '');
    if (_isMaiden) setTimeout(()=>maidenFlight(from, to), 350);
    return;
  }
  closeModal();
  // Route creation may trigger guide, modal, and fleet refresh hooks. Restore
  // the exact pre-route camera before drawing so none can recenter or zoom it.
  restoreMapView();
  renderMap();
  applyPan();
  if (_isMaiden) setTimeout(()=>maidenFlight(from, to), 650);
}
function openBuyPlanesForRoute(from, to) {
  document.getElementById('modal-content').innerHTML = buildBuyPlanesForRoute(from, to);
}
function buildBuyPlanesForRoute(from, to) {
  const dist   = (from && to) ? getDistance(from, to) : 0;
  const hasRoute = from && to && from !== to;
  const avail = Object.entries(AIRCRAFT)
    .filter(([,a]) => acListed(a) && a.era <= STATE.year + 3)
    .sort((a, b) => {
      const aOk = dist === 0 || a[1].range >= dist;
      const bOk = dist === 0 || b[1].range >= dist;
      if (aOk !== bOk) return aOk ? -1 : 1;
      return a[1].cost - b[1].cost;
    });
  const distLabel = hasRoute
    ? `<div class="nr-chiprow">
        <span class="nr-chip">Route <b>${from} → ${to}</b></span>
        <span class="nr-chip">Distance <b style="color:#fff">${Math.round(dist).toLocaleString()} mi</b></span>
        <span class="nr-chip">Cash <b style="color:var(--accent2)">$${STATE.cash.toFixed(0)}M</b></span>
       </div>`
    : `<div class="nr-chiprow"><span class="nr-chip">Cash <b style="color:var(--accent2)">$${STATE.cash.toFixed(0)}M</b></span></div>`;
  const cards = avail.map(([n, a]) => {
    const idn = acIdentity(n);
    const owned    = STATE.planes[n]?.owned || 0;
    const free     = (STATE.planes[n]?.owned || 0) - (STATE.planes[n]?.assigned || 0);
    const inRange  = !hasRoute || a.range >= dist;
    const future   = a.era > STATE.year;
    const canAfford1 = STATE.cash >= a.cost;
    const rangeTag = hasRoute
      ? inRange
        ? `<span style="color:var(--profit);font-size:10.7px">✓ In range</span>`
        : `<span style="color:var(--loss);font-size:10.7px">✗ Too short (${a.range.toLocaleString()} mi)</span>`
      : '';
    const dimStyle = !inRange ? 'opacity:0.45;' : '';
    return `<div class="fleet-item" style="flex-direction:column;align-items:stretch;margin-bottom:8px;${dimStyle}border:1px solid ${inRange?'var(--border2)':'var(--border)'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="plane-name" style="color:${inRange?'var(--text)':'var(--muted)'}">${idn.icon} ${idn.name}</div>
          <div class="bp-identity-line">${idn.id} · ${idn.theme}</div>
          <div style="font-size:10.7px;color:var(--muted);margin-top:2px">
            ${n} · ${a.seats}s · ${a.range.toLocaleString()} mi · ${a.speed} mph · <em>${a.type}</em>
          </div>
          <div style="margin-top:3px">${rangeTag}${future ? `<span style="color:var(--warn);font-size:10.2px;margin-left:6px">Avail. ${a.era}</span>` : ''}</div>
          ${owned ? `<div style="font-size:10.2px;color:var(--muted2);margin-top:2px">${owned} owned · <span style="color:${free>0?'var(--accent)':'var(--warn)'}">${free} free</span></div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:10px">
          <div style="color:var(--warn);font-weight:700;font-size:14.7px">$${a.cost}M</div>
          <div style="font-size:10.7px;color:var(--muted)">per aircraft</div>
        </div>
      </div>
      ${inRange && !future ? `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:8px">
        ${[1,2,3,5].map(q => {
          const total = a.cost * q;
          const ok = STATE.cash >= total;
          return `<button class="action-btn${ok?'':' danger'}" style="padding:4px 0;font-size:11.3px;text-align:center"
            ${ok?`onclick="buyPlaneForRoute('${n}',${q},'${from}','${to}')"` : 'disabled'}
            title="${ok?`Buy ${q} for $${total}M`:`Need $${total}M`}">
            ×${q}<br><span style="font-size:10.7px;color:${ok?'var(--muted)':'var(--danger)'}">$${total}M</span>
          </button>`;
        }).join('')}
      </div>` : !inRange ? `
      <div style="font-size:11.3px;color:var(--muted2);margin-top:6px;text-align:center">
        Cannot reach ${to} — need ${Math.round(dist).toLocaleString()} mi range
      </div>` : `
      <div style="font-size:11.3px;color:var(--warn);margin-top:6px;text-align:center">Not yet available</div>`}
    </div>`;
  }).join('');
  return `<div class="modal-header">
    <div class="modal-title">✈ BUY AIRCRAFT</div>
    <button class="modal-close" onclick="document.getElementById('modal-content').innerHTML=buildNewRoute('${from}','${to}')">←</button>
  </div>
  <div class="modal-body" style="max-height:62vh;overflow-y:auto">
    ${distLabel}
    <div class="nr-preview-label">Select Aircraft</div>
    ${hasRoute ? '<div class="nr-sub">In-range types listed first · tap a quantity to buy</div>' : ''}
    ${cards}
  </div>`;
}
function buyPlaneForRoute(name, qty, from, to) {
  const a = AIRCRAFT[name];
  const total = a.cost * qty;
  if (STATE.cash < total) return showFlash(`⚠ Need $${total}M`);
  STATE.cash -= total;
  if (!STATE.planes[name]) STATE.planes[name] = { ...a, owned: 0, assigned: 0 };
  STATE.planes[name].owned += qty;
  stampAcquisition(STATE.planes[name], qty);
  addEvent('neutral', `Bought ${qty}× ${name} for $${total}M`);
  showFlash(`✓ ${qty}× ${name} acquired — return to route`);
  guideStep(2);
  updateUI(); renderFleet();
  document.getElementById('modal-content').innerHTML = buildNewRoute(from, to);
}
const BP_CATEGORIES = [
  { id:'fleet',       label:'Your Fleet',    icon:'📋', sub:'Owned aircraft overview',                    types:[] },
  { id:'puddle',      label:'Puddle Jumper', icon:'🛩', sub:'Regional short-haul, ~100–140 seats',        types:['short'] },
  { id:'narrowbody',  label:'Narrow Body',   icon:'✈',  sub:'Medium-haul workhorses, 130–220 seats',      types:['medium'] },
  { id:'widebody',    label:'Widebody',      icon:'🛫', sub:'Long haul, 200–420 seats',                   types:['long'] },
  { id:'premium',     label:'Premium',       icon:'👑', sub:'Jumbos & supersonics — flagship metal',      types:['jumbo','supersonic'] },
];
let _bpCat = Object.values(STATE?.planes||{}).some(p=>p.owned>0) ? 'fleet' : 'browse';
let _bpQty = {}; // per-plane selected qty
// range bands for the grouped accordion (mi)
const BP_RANGE_BANDS = [
  { id:'regional',  label:'Regional',     icon:'🛩', sub:'Under 2,500 mi · short hops',          min:0,    max:2500 },
  { id:'shorthaul', label:'Short-haul',   icon:'✈',  sub:'2,500–4,000 mi · domestic & near-intl', min:2500, max:4000 },
  { id:'medium',    label:'Medium-haul',  icon:'🛫', sub:'4,000–5,500 mi · transcontinental',    min:4000, max:5500 },
  { id:'longhaul',  label:'Long-haul',    icon:'🌍', sub:'5,500–7,500 mi · intercontinental',    min:5500, max:7500 },
  { id:'ultra',     label:'Ultra-long',   icon:'🌏', sub:'Over 7,500 mi · the longest routes',   min:7500, max:99999 },
];
let _bpBandOpen = {}; // bandId -> bool (collapse state)
function bpRangeBand(range){
  for (const b of BP_RANGE_BANDS) if (range >= b.min && range < b.max) return b.id;
  return 'ultra';
}
// ═══════════════════════════════════════════════════════════════════
// FLEET & AIRCRAFT — full-page management view (dashboard mockup).
// My Fleet + Maintenance run on REAL monthly-sim data. Leases / Orders /
// Deliveries / Market are stubbed "coming soon" until those systems exist.
// Daily metrics from the mockup are reinterpreted as MONTHLY (real meaning).
// ═══════════════════════════════════════════════════════════════════
let _fleetTab = 'myfleet';
function openFleetPage(tab){ _fleetTab = tab || 'myfleet'; openModal('fleet-page'); }
function fleetSetTab(t){ _fleetTab = t; const c=document.getElementById('modal-content'); if(c){ c.innerHTML=buildFleetPage(); } }

// real monthly profit + utilization attributed to an aircraft type
function fleetTypeStats(typeName){
  let monthlyProfit = 0, hoursMonth = 0, flightsWk = 0;
  (STATE.routes||[]).forEach(r=>{
    const list = (r.planes && r.planes.length) ? r.planes : [{type:r.plane, flights:r.flights||0}];
    const onThis = list.filter(e=>e.type===typeName);
    if(!onThis.length) return;
    const typeFlights = onThis.reduce((s,e)=>s+(e.flights||0),0);
    const totalFlights = list.reduce((s,e)=>s+(e.flights||0),0) || 1;
    const share = typeFlights/totalFlights;
    monthlyProfit += (r.profit||0)*share;
    flightsWk += typeFlights;
    try { const dist = (typeof getDistance==='function')?getDistance(r.from,r.to):0;
      const hrs = (typeof flightHours==='function')?flightHours(dist):0;
      hoursMonth += hrs * typeFlights * (ECON?.weeksPerMonth||4.33) * 2; // round trips
    } catch(e){}
  });
  return { monthlyProfit, hoursMonth, flightsWk };
}

function buildFleetPage(){
  const owned = Object.entries(STATE.planes||{}).filter(([,p])=>p.owned>0);
  const totalOwned = owned.reduce((s,[,p])=>s+(p.owned||0),0);
  const leased = Object.values(STATE.planes||{}).reduce((sm,p)=>sm+(p.leased||0),0);
  const onOrder = 0; // orders system not built yet
  const totalAircraft = totalOwned + leased + onOrder;

  // footer aggregates (real)
  let totalMonthProfit = 0, totalHours = 0, ageSum = 0, ageCount = 0;
  owned.forEach(([n,p])=>{
    const st = fleetTypeStats(n); totalMonthProfit += st.monthlyProfit; totalHours += st.hoursMonth;
    const age = Math.max(0, STATE.year - (p.era||AIRCRAFT[n]?.era||1960));
    ageSum += age*(p.owned||0); ageCount += (p.owned||0);
  });
  const avgAge = ageCount ? (ageSum/ageCount) : 0;
  const avgUtil = totalOwned ? (totalHours/totalOwned) : 0;
  const maintCost = (() => { let c=0; owned.forEach(([n,p])=>{ const a=AIRCRAFT[n]||p; const age=Math.max(0,STATE.year-(a.era||1960)); const sur=age>15?Math.min(50,(age-15)*2):0; c += (a.cost||0)*0.004*(1+sur/100)*(p.owned||0);}); return c; })();
  const fuelCost = (() => { let c=0; owned.forEach(([n,p])=>{ const st=fleetTypeStats(n); c += st.hoursMonth*0.06; }); return c; })();

  const f$ = v => '$'+Math.round(v).toLocaleString()+'M';

  const tabs = [
    ['myfleet','My Fleet'],['orders','Orders'],['leases','Leases'],
    ['maint','Maintenance'],['deliveries','Deliveries'],['market','Aircraft Market']
  ];
  const tabHtml = tabs.map(([id,l])=>`<button class="flp-tab${id===_fleetTab?' active':''}" onclick="fleetSetTab('${id}')">${l}</button>`).join('');

  return `
  <div class="flp">
    <div class="flp-head">
      <div class="flp-title-wrap">
        <div class="flp-title-ic">✈</div>
        <div>
          <div class="flp-title">Fleet &amp; Aircraft</div>
          <div class="flp-sub">Manage your aircraft fleet, orders and leases.</div>
        </div>
      </div>
      <div class="flp-summary">
        <div class="flp-sum flp-sum-lead"><div class="flp-sum-k">Total Aircraft</div><div class="flp-sum-v">${totalAircraft}</div></div>
        <div class="flp-sum"><div class="flp-sum-k">Owned</div><div class="flp-sum-v" style="color:var(--profit)">${totalOwned}</div></div>
        <div class="flp-sum"><div class="flp-sum-k">Leased</div><div class="flp-sum-v" style="color:var(--warn)">${leased}</div></div>
        <div class="flp-sum"><div class="flp-sum-k">On Order</div><div class="flp-sum-v" style="color:#fff">${onOrder}</div></div>
      </div>
    </div>
    <div class="flp-tabs">${tabHtml}</div>
    <div class="flp-body">${fleetTabBody(_fleetTab, owned)}</div>
    <div class="flp-footer">
      <button class="flp-acquire" onclick="openModal('buy-planes')">+ Acquire Aircraft</button>
      <div class="flp-fstat"><div class="flp-fk">Average Fleet Age</div><div class="flp-fv">${avgAge.toFixed(1)} <span>Years</span></div></div>
      <div class="flp-fstat"><div class="flp-fk">Average Utilization</div><div class="flp-fv">${avgUtil.toFixed(1)} <span>hrs / mo</span></div></div>
      <div class="flp-fstat"><div class="flp-fk">Maintenance Cost</div><div class="flp-fv" style="color:var(--loss)">${f$(maintCost)} <span>/ mo</span></div></div>
      <div class="flp-fstat"><div class="flp-fk">Fuel Cost</div><div class="flp-fv" style="color:var(--warn)">${f$(fuelCost)} <span>/ mo</span></div></div>
      <div class="flp-fstat"><div class="flp-fk">Monthly Profit</div><div class="flp-fv" style="color:var(--profit)">${f$(totalMonthProfit)}</div></div>
    </div>
  </div>`;
}

function fleetTabBody(tab, owned){
  if(tab==='myfleet') return fleetMyFleetTable(owned);
  if(tab==='maint')   return fleetMaintTable(owned);
  if(tab==='leases')  return fleetLeasesTab();
  const stubs = {
    orders:['📦','Aircraft Orders','Order aircraft with delivery lead times. This system is coming soon — for now, aircraft are acquired instantly via the Aircraft Market.'],
    deliveries:['🚚','Deliveries','Track inbound aircraft from your orders. Available once the Orders system ships.'],
    market:['🏷','Aircraft Market','A dynamic market with changing availability and pricing. For now, use Acquire Aircraft for the full catalog.']
  };
  const [ic,t,d] = stubs[tab] || ['','',''];
  return `<div class="flp-stub">
    <div class="flp-stub-ic">${ic}</div>
    <div class="flp-stub-t">${t}</div>
    <div class="flp-stub-d">${d}</div>
    <button class="flp-acquire" style="margin-top:16px;max-width:240px" onclick="openModal('buy-planes')">+ Acquire Aircraft</button>
  </div>`;
}

function fleetLeasesTab(){
  const planes = STATE.planes||{};
  const leasedEntries = Object.entries(planes).filter(([,p])=>(p.leased||0)>0);
  const totalLeased = leasedEntries.reduce((s,[,p])=>s+(p.leased||0),0);
  const moTotal = (typeof leaseMonthlyCost==='function')?leaseMonthlyCost():0;

  // available to lease: aircraft available this era, sorted by cost
  const avail = Object.entries(AIRCRAFT).filter(([,a])=>a.era<=STATE.year+3).sort((a,b)=>a[1].cost-b[1].cost);

  const leasedRows = leasedEntries.map(([n,p])=>{
    const a = AIRCRAFT[n]||p;
    const moCost = Math.round(a.cost*LEASE.monthly*p.leased*10)/10;
    const freeLeased = planeFree(p);
    return `<div class="flp-row">
      <div class="flp-c flp-c-ac"><div class="flp-plane-thumb">✈</div><div><div class="flp-ac-name">${n}</div><div class="flp-ac-reg">×${p.leased} leased · ${Math.max(0,freeLeased)} free</div></div></div>
      <div class="flp-c"><div class="flp-c-big">${a.seats||0}</div><div class="flp-c-sm">seats</div></div>
      <div class="flp-c"><div class="flp-c-big" style="color:var(--warn)">$${moCost}M</div><div class="flp-c-sm">/ month</div></div>
      <div class="flp-c flp-c-act"><button class="flp-iconbtn" title="Return one lease" onclick="tapConfirm(this,()=>{returnLease('${n}',1)},'Return 1?')">↩</button></div>
    </div>`;
  }).join('');

  const availRows = avail.map(([n,a])=>{
    const deposit = Math.round(a.cost*LEASE.deposit*10)/10;
    const moCost = Math.round(a.cost*LEASE.monthly*10)/10;
    const cls = a.type==='long'?'Widebody':a.type==='supersonic'?'Supersonic':a.type==='short'?'Narrowbody':a.type==='medium'?'Narrowbody':'Regional';
    const afford = STATE.cash >= deposit;
    return `<div class="flp-row">
      <div class="flp-c flp-c-ac"><div class="flp-plane-thumb" style="--p1:${a.type==='long'?'#23415f':'#1f3a4f'};--p2:#0d1a28">${a.type==='long'?'🛬':a.type==='supersonic'?'🚀':'✈'}</div><div><div class="flp-ac-name">${n}</div><div class="flp-ac-reg">${a.seats}s · ${(a.range||0).toLocaleString()}mi · ${cls}</div></div></div>
      <div class="flp-c"><div class="flp-c-sm">Deposit</div><div class="flp-c-big" style="color:#fff">$${deposit}M</div></div>
      <div class="flp-c"><div class="flp-c-sm">Monthly</div><div class="flp-c-big" style="color:var(--warn)">$${moCost}M</div></div>
      <div class="flp-c"><div class="flp-c-sm">Buy price</div><div class="flp-c-big" style="color:var(--muted)">$${a.cost}M</div></div>
      <div class="flp-c flp-c-act"><button class="flp-leasebtn" ${afford?`onclick="tapConfirm(this,()=>{leasePlaneQty('${n.replace(/'/g,"\\'")}',1)},'Lease 1? $${deposit}M deposit')"`:'disabled'}>Lease</button></div>
    </div>`;
  }).join('');

  return `
    <div class="flp-lease-banner">
      <span style="font-size:24.9px;flex-shrink:0">📄</span>
      <div style="flex:1">
        <div style="font-size:14.7px;color:var(--text);font-weight:600">Leasing lets you fly aircraft for a low upfront deposit + a monthly fee — no ownership, return any time.</div>
        <div style="font-size:12.4px;color:var(--muted2);margin-top:3px">Deposit ≈ ${Math.round(LEASE.deposit*100)}% of value · Monthly ≈ ${(LEASE.monthly*100).toFixed(1)}% of value. Cheaper to start, costlier long-term than buying.</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="flp-fk">Leased · monthly</div>
        <div class="flp-fv">${totalLeased} <span>· $${Math.round(moTotal*10)/10}M/mo</span></div>
      </div>
    </div>
    ${leasedEntries.length ? `
    <div class="flp-lease-h">Your Leased Aircraft</div>
    <div class="flp-table"><div class="flp-thead"><div class="flp-c flp-c-ac">Aircraft</div><div class="flp-c">Config</div><div class="flp-c">Lease Cost</div><div class="flp-c flp-c-act">Return</div></div><div id="flp-rows">${leasedRows}</div></div>` : ''}
    <div class="flp-lease-h">Available to Lease</div>
    <div class="flp-table"><div class="flp-thead"><div class="flp-c flp-c-ac">Aircraft</div><div class="flp-c">Deposit</div><div class="flp-c">Monthly</div><div class="flp-c">Buy Price</div><div class="flp-c flp-c-act">Action</div></div><div>${availRows}</div></div>`;
}

let _flpQ='', _flpType='all', _flpStatus='all', _flpSortBy='type', _flpDetail=null;
function fleetRowStatus(n){
  const h = (typeof maintGetHealth==='function')?maintGetHealth(n):{health:100};
  const grounded = (typeof maintIsGrounded==='function')&&maintIsGrounded(n);
  return grounded ? 'grounded' : (h.health<35 ? 'service' : 'active');
}
function fleetClass(a){ return a.type==='jumbo'?'Jumbo':a.type==='long'?'Widebody':a.type==='supersonic'?'Supersonic':(a.type==='short'||a.type==='medium')?'Narrowbody':'Regional'; }
function fleetToggleFav(n, ev){ if(ev) ev.stopPropagation();
  STATE._fleetFavs = STATE._fleetFavs || {};
  if (STATE._fleetFavs[n]) delete STATE._fleetFavs[n]; else STATE._fleetFavs[n] = 1;
  fleetApplyFilters();
}
function fleetToggleDetail(n, ev){ if(ev) ev.stopPropagation(); _flpDetail = _flpDetail===n?null:n; fleetApplyFilters(); }
function fleetFilter(v){ _flpQ = (v||'').toLowerCase(); fleetApplyFilters(); }
function fleetSetType(v){ _flpType = v; fleetApplyFilters(); }
function fleetSetStatus(v){ _flpStatus = v; fleetApplyFilters(); }
function fleetSetSortBy(v){ _flpSortBy = v; fleetApplyFilters(); }
function fleetActiveFilterCount(){ return (_flpQ?1:0)+(_flpType!=='all'?1:0)+(_flpStatus!=='all'?1:0); }
function fleetFilteredOwned(){
  const owned = Object.entries(STATE.planes||{}).filter(([,p])=>p.owned>0);
  const favs = STATE._fleetFavs || {};
  let list = owned.filter(([n])=>{
    const a = AIRCRAFT[n]||{};
    if (_flpQ && !(n.toLowerCase().includes(_flpQ) || fleetClass(a).toLowerCase().includes(_flpQ))) return false;
    if (_flpType!=='all' && fleetClass(a)!==_flpType) return false;
    if (_flpStatus!=='all' && fleetRowStatus(n)!==_flpStatus) return false;
    return true;
  });
  const sorters = {
    type:   (a,b)=>a[0].localeCompare(b[0]),
    age:    (a,b)=>(AIRCRAFT[a[0]]?.era||0)-(AIRCRAFT[b[0]]?.era||0),
    profit: (a,b)=>fleetTypeStats(b[0]).monthlyProfit - fleetTypeStats(a[0]).monthlyProfit,
    util:   (a,b)=>{const ua=fleetTypeStats(a[0]).hoursMonth/(a[1].owned||1), ub=fleetTypeStats(b[0]).hoursMonth/(b[1].owned||1); return ub-ua;},
    count:  (a,b)=>(b[1].owned||0)-(a[1].owned||0),
  };
  list.sort(sorters[_flpSortBy]||sorters.type);
  list.sort((a,b)=>(favs[b[0]]?1:0)-(favs[a[0]]?1:0));   // favorites pinned
  return list;
}
function fleetRowHtml([n,p]){
  const a = AIRCRAFT[n]||p;
  const age = Math.max(0, STATE.year - (a.era||1960));
  const ageCol = age>25?'var(--loss)':age>18?'var(--warn)':'var(--text)';
  const cls = fleetClass(a);
  const st = fleetTypeStats(n);
  const utilPerPlane = p.owned ? (st.hoursMonth/p.owned) : 0;
  const utilPct = Math.max(4, Math.min(100, (utilPerPlane/300)*100));
  const rowStatus = fleetRowStatus(n);
  const h = (typeof maintGetHealth==='function')?maintGetHealth(n):{health:100};
  const statusHtml = rowStatus==='grounded'
    ? `<span class="flp-stat-dot bad"></span>Grounded<div class="flp-substat bad">In Shop</div>`
    : rowStatus==='service'
      ? `<span class="flp-stat-dot warn"></span>Service<div class="flp-substat warn">Book A-Check</div>`
      : `<span class="flp-stat-dot ok"></span>Active<div class="flp-substat ok">Operational</div>`;
  const profCol = st.monthlyProfit>=0?'var(--profit)':'var(--loss)';
  const fav = (STATE._fleetFavs||{})[n];
  const esc = n.replace(/'/g,"\\'");
  const detail = _flpDetail===n ? `<div class="flp-detail">
      <span><b>Range</b> ${(a.range||0).toLocaleString()} mi</span>
      <span><b>Fuel index</b> ${a.fuel||'—'}</span>
      <span><b>Speed</b> ${a.speed||'—'} mph</span>
      <span><b>Buy price</b> $${a.cost}M</span>
      <span><b>Health</b> ${Math.round(h.health)}%</span>
      <span><b>Flights</b> ${st.flightsWk}/wk</span>
      <button class="flp-leasebtn" onclick="tapConfirm(this,()=>{sellPlane('${esc}')},'Sell 1 for $${Math.round((a.cost||0)*0.55)}M?')">Sell 1 · $${Math.round((a.cost||0)*0.55)}M</button>
    </div>` : '';
  return `<div class="flp-row">
    <div class="flp-c flp-c-ac">
      <div class="flp-plane-thumb" style="--p1:${a.type==='long'?'#23415f':'#1f3a4f'};--p2:#0d1a28">${a.type==='long'?'🛬':a.type==='supersonic'?'🚀':'✈'}</div>
      <div><div class="flp-ac-name">${n} <span class="flp-fav ${fav?'on':''}" onclick="fleetToggleFav('${esc}',event)" title="Favorite">${fav?'★':'☆'}</span></div><div class="flp-ac-reg">×${p.owned} owned · ${p.assigned} flying</div></div>
    </div>
    <div class="flp-c flp-c-type"><div>${cls}</div><span class="flp-type-chip">${(a.seats||0)} seats</span></div>
    <div class="flp-c"><div class="flp-c-big">${a.seats||0}</div><div class="flp-c-sm">Y${a.seats||0}</div></div>
    <div class="flp-c"><div class="flp-c-big" style="color:${ageCol}">${age}</div><div class="flp-c-sm">Years</div></div>
    <div class="flp-c">${statusHtml}</div>
    <div class="flp-c flp-c-util"><div class="flp-c-big">${utilPerPlane.toFixed(1)}</div><div class="flp-c-sm">hrs / mo</div><div class="flp-util-bar"><i style="width:${utilPct}%"></i></div></div>
    <div class="flp-c"><div class="flp-c-big" style="color:${profCol}">$${Math.round(st.monthlyProfit*1000).toLocaleString()}k</div><div class="flp-c-sm">/ mo</div></div>
    <div class="flp-c flp-c-act">
      <button class="flp-iconbtn ${_flpDetail===n?'active':''}" title="Details" onclick="fleetToggleDetail('${esc}',event)">🔍</button>
      <button class="flp-iconbtn" title="Sell 1" onclick="tapConfirm(this,()=>{sellPlane('${esc}')},'Sell 1?')">···</button>
    </div>
  </div>${detail}`;
}
function fleetApplyFilters(){
  const box = document.getElementById('flp-rows'); if(!box) return;
  const list = fleetFilteredOwned();
  box.innerHTML = list.length ? list.map(fleetRowHtml).join('')
    : `<div class="flp-stub" style="padding:26px 0"><div class="flp-stub-t">No aircraft match</div><div class="flp-stub-d">Adjust search or filters.</div></div>`;
  const chip = document.getElementById('flp-filter-count');
  if (chip) { const c = fleetActiveFilterCount(); chip.textContent = c; chip.style.display = c?'inline-flex':'none'; }
}
function fleetMyFleetTable(owned){
  if(!owned.length) return `<div class="flp-stub"><div class="flp-stub-ic">✈</div><div class="flp-stub-t">No aircraft yet</div><div class="flp-stub-d">Acquire your first aircraft to start building routes.</div><button class="flp-acquire" style="margin-top:16px;max-width:240px" onclick="openModal('buy-planes')">+ Acquire Aircraft</button></div>`;
  _flpQ = '';
  _flpType = 'all';
  _flpStatus = 'all';
  const html = `
    <div class="flp-table">
      <div class="flp-thead">
        <div class="flp-c flp-c-ac">Aircraft</div><div class="flp-c flp-c-type">Type</div>
        <div class="flp-c">Config</div><div class="flp-c">Age</div><div class="flp-c">Status</div>
        <div class="flp-c">Utilization</div><div class="flp-c">Monthly Profit</div><div class="flp-c flp-c-act">Actions</div>
      </div>
      <div id="flp-rows"></div>
    </div>`;
  setTimeout(fleetApplyFilters, 0);
  return html;
}
function fleetMaintTable(owned){
  if(!owned.length) return `<div class="flp-stub"><div class="flp-stub-ic">🔧</div><div class="flp-stub-t">No aircraft to service</div><div class="flp-stub-d">Acquire aircraft first.</div></div>`;
  const rows = owned.map(([n,p])=>{
    const h = (typeof maintGetHealth==='function')?maintGetHealth(n):{health:100};
    const hPct = Math.round(h.health);
    const hCol = (typeof maintHealthColor==='function')?maintHealthColor(hPct):'var(--profit)';
    const grounded = (typeof maintIsGrounded==='function')&&maintIsGrounded(n);
    const left = grounded && typeof maintGroundingMonthsLeft==='function'?maintGroundingMonthsLeft(n):0;
    const age = Math.max(0, STATE.year-(AIRCRAFT[n]?.era||1960));
    return `<div class="flp-row">
      <div class="flp-c flp-c-ac"><div class="flp-plane-thumb">✈</div><div><div class="flp-ac-name">${n}</div><div class="flp-ac-reg">×${p.owned} · ${age}yr</div></div></div>
      <div class="flp-c" style="flex:2"><div class="flp-util-bar" style="margin:0"><i style="width:${hPct}%;background:${hCol}"></i></div><div class="flp-c-sm" style="color:${hCol};margin-top:4px">Health ${hPct}%</div></div>
      <div class="flp-c">${grounded?`<span class="flp-stat-dot bad"></span>Grounded ${left}mo`:hPct<35?`<span class="flp-stat-dot warn"></span>Needs service`:`<span class="flp-stat-dot ok"></span>Good`}</div>
      <div class="flp-c flp-c-act"><button class="flp-iconbtn" onclick="openHangarModal()" title="Hangar">🔧</button></div>
    </div>`;
  }).join('');
  return `<div class="flp-table"><div class="flp-thead"><div class="flp-c flp-c-ac">Aircraft</div><div class="flp-c" style="flex:2">Health</div><div class="flp-c">Status</div><div class="flp-c flp-c-act">Service</div></div><div id="flp-rows">${rows}</div></div>
    <div style="text-align:center;margin-top:14px"><button class="flp-acquire" style="max-width:280px" onclick="openHangarModal()">🔧 Open Hangar — Maintenance &amp; Insurance</button></div>`;
}



function openAircraftIdentityGuide(){
  const rows = Object.entries(AIRCRAFT_IDENTITY).map(([model,i])=>{
    const a = AIRCRAFT[model] || {};
    return `<div class="fleet-item" style="align-items:flex-start;margin-bottom:7px;border-left:3px solid ${i.accent};background:linear-gradient(135deg, ${i.color1}44, ${i.color2}22)">
      <div style="font-size:24.9px;margin-right:8px">${i.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="color:var(--text)">${i.name}</b><span class="bp-tag" style="color:${i.accent};border-color:${i.accent}66">${i.id}</span><span style="font-size:10.2px;color:var(--muted2)">${model}</span></div>
        <div style="font-size:11.3px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.8px">${i.theme} · ${a.type||'aircraft'} · ${a.seats||'?'} seats · ${(a.range||0).toLocaleString()} mi</div>
        <div style="font-size:11.3px;color:var(--muted2);line-height:1.35;margin-top:3px">${i.role}</div>
      </div>
    </div>`;
  }).join('');
  const c=document.getElementById('modal-content');
  if(c) c.innerHTML = modalHead('✦ AIRCRAFT IDENTITY GUIDE') + `<div class="modal-body" style="max-height:66vh;overflow-y:auto"><div class="nr-sub" style="margin-bottom:10px">Fictional game names, aircraft IDs, themes, and roles. Original model keys stay unchanged for saves and route logic.</div>${rows}</div>`;
}

function buildBuyPlanes() {
  Object.keys(AIRCRAFT).forEach(n => { if (!_bpQty[n]) _bpQty[n] = 1; });
  const ownedFleet = Object.entries(STATE.planes).filter(([,p])=>p.owned>0);
  // initialise band-open state: open the first band that has available planes
  if (Object.keys(_bpBandOpen).length === 0) {
    const firstWithPlanes = BP_RANGE_BANDS.find(b =>
      Object.entries(AIRCRAFT).some(([,a]) => acListed(a) && bpRangeBand(a.range)===b.id));
    BP_RANGE_BANDS.forEach(b => { _bpBandOpen[b.id] = (firstWithPlanes && b.id===firstWithPlanes.id); });
  }
  const navItems = [
    { id:'fleet',  icon:'📋', label:'Your Fleet', count:`${ownedFleet.length} types` },
    { id:'browse', icon:'✈',  label:'Buy Aircraft', count:'by range' },
  ];
  const navHtml = navItems.map((it,i) => {
    const divider = i === 0 ? '<div class="bp-nav-divider"></div>' : '';
    return `<button class="bp-nav-btn ${it.id===_bpCat?'active':''} ${it.id==='fleet'?'bp-fleet-btn':''}" onclick="bpSetCat('${it.id}')">
      <span class="bp-nav-icon">${it.icon}</span>
      ${it.label}
      <span class="bp-nav-count">${it.count}</span>
    </button>${divider}`;
  }).join('');
  const content = _bpCat === 'fleet' ? buildBpFleetView(ownedFleet) : buildBpBrowseView();
  return modalHead('✈ BUY AIRCRAFT') + `
    <div class="bp-layout">
      <div class="bp-nav">${navHtml}</div>
      <div class="bp-content" id="bp-content">${content}</div>
    </div>`;
}
function bpSetCat(cat) {
  _bpCat = cat;
  document.getElementById('modal-content').innerHTML = buildBuyPlanes();
}
function bpToggleBand(bandId) {
  _bpBandOpen[bandId] = !_bpBandOpen[bandId];
  const sec = document.getElementById('bp-band-'+bandId);
  const chev = document.getElementById('bp-chev-'+bandId);
  if (sec) sec.style.display = _bpBandOpen[bandId] ? 'block' : 'none';
  if (chev) chev.style.transform = _bpBandOpen[bandId] ? 'rotate(90deg)' : 'rotate(0deg)';
}
function buildBpBrowseView() {
  const header = `<div class="bp-cat-header">
    <div class="bp-cat-icon">✈</div>
    <div style="flex:1"><div class="bp-cat-name">Buy Aircraft</div><div class="bp-cat-sub">Grouped by range — aircraft now have names, IDs, and visual themes</div></div>
    <button class="action-btn" style="margin:0;padding:7px 10px;font-size:11.3px" onclick="openAircraftIdentityGuide()">Identity Guide</button>
    <span class="nr-chip">Cash <b style="color:var(--accent2)">$${STATE.cash.toFixed(0)}M</b></span>
  </div>`;
  const bandsHtml = BP_RANGE_BANDS.map(band => {
    const planes = Object.entries(AIRCRAFT)
      .filter(([,a]) => acListed(a) && bpRangeBand(a.range)===band.id)
      .sort((a,b) => a[1].cost - b[1].cost);
    if (!planes.length) return '';
    const ownedInBand = planes.filter(([n]) => (STATE.planes[n]?.owned||0) > 0).length;
    const availNow = planes.filter(([,a]) => a.era <= STATE.year).length;
    const open = !!_bpBandOpen[band.id];
    const cards = bpCardsForPlanes(planes);
    return `<div class="bp-band">
      <div class="bp-band-head" onclick="bpToggleBand('${band.id}')">
        <span class="bp-band-chev" id="bp-chev-${band.id}" style="transform:rotate(${open?90:0}deg)">›</span>
        <span class="bp-band-icon">${band.icon}</span>
        <div style="flex:1;min-width:0">
          <div class="bp-band-name">${band.label}</div>
          <div class="bp-band-sub">${band.sub}</div>
        </div>
        <div class="bp-band-meta">
          <span class="bp-band-count">${availNow} available</span>
          ${ownedInBand?`<span class="bp-band-owned">✓ ${ownedInBand} owned</span>`:''}
        </div>
      </div>
      <div class="bp-band-body" id="bp-band-${band.id}" style="display:${open?'block':'none'}">${cards}</div>
    </div>`;
  }).join('');
  return header + bandsHtml;
}
const BP_CLASS_DESC = {
  short:  'Perfect for short-haul routes with high efficiency and low operating costs.',
  medium: 'Reliable and versatile for medium-haul routes with strong passenger comfort.',
  long:   'Built for long-haul range, connecting distant city pairs with high capacity.',
  supersonic: 'Premium high-speed flagship for prestige ultra-fast long-haul service.'
};
const BP_CLASS_LABEL = { short:'SHORT', medium:'MEDIUM', long:'LONG', supersonic:'SUPERSONIC' };
function bpCardsForPlanes(planes) {
  const seatCostMin = Math.min(...planes.filter(([,x])=>x.era<=STATE.year).map(([,x]) => x.cost / x.seats));
  const maxSeats = Math.max(...planes.map(([,x])=>x.seats));
  const maxRange = Math.max(...planes.map(([,x])=>x.range));
  return planes.map(([n, a]) => {
    const idn = acIdentity(n);
    const owned   = STATE.planes[n]?.owned || 0;
    const free    = owned - (STATE.planes[n]?.assigned || 0);
    const future  = a.era > STATE.year;
    const qty     = _bpQty[n] || 1;
    const total   = a.cost * qty;
    const canSell = owned > 0 && free > 0;
    const seatsW  = Math.round(a.seats/maxSeats*100);
    const rangeW  = Math.round(a.range/maxRange*100);
    const fuelW   = a.fuel;
    const speedW  = Math.round((a.speed / (a.type==='supersonic'?1400:700)) * 100);
    const perSeat = Math.round(a.cost / a.seats * 1000);
    const isValue = !future && (a.cost / a.seats) <= seatCostMin * 1.06;
    const badges = `${owned ? `<span class="bp-tag owned">✓ ${owned} owned · ${free} free</span>` : ''}${future ? `<span class="bp-tag future">From ${a.era}</span>` : (isValue ? `<span class="bp-tag val">★ Best value</span>` : '')}`;
    const miniRows = [
      ['Seats', a.seats.toLocaleString(), seatsW, 'var(--accent)'],
      ['Range', a.range.toLocaleString(), rangeW, 'var(--accent2)'],
      ['Speed', a.speed.toLocaleString(), speedW, 'var(--purple,#a78bfa)'],
      ['Eff',   a.fuel+'%', fuelW, 'var(--profit)']
    ].map(([l,v,w,col])=>`<div class="bp-mini-i"><div class="bp-mini-top"><span>${l}</span><b>${v}</b></div><div class="bp-mini-bar"><i style="width:${Math.max(4,Math.min(100,w))}%;background:${col}"></i></div></div>`).join('');
    const haul = BP_CLASS_LABEL[a.type] || (a.type||'').toUpperCase();
    const desc = BP_CLASS_DESC[a.type] || '';
    const esc = n.replace(/'/g,"\\'");
    const qtyBtn = q => {
      const t = a.cost * q;
      const afford = STATE.cash >= t;
      return `<button class="bp-qbtn${q===1?' bp-qbtn-lead':''}" ${afford?`onclick="tapConfirm(this,()=>{buyPlane('${esc}',${q})},'Buy ${q}? $${t}M')"`:'disabled'}>
        <span class="bp-qx">×${q}</span><span class="bp-qt">$${t}M</span></button>`;
    };
    return `<div class="bp-card2${future?' bp-future':''}${owned?' bp-owned':''}" id="bpc-${n.replace(/\s/g,'_')}">
      <div class="bp-photo" style="--p1:${idn.color1};--p2:${idn.color2};box-shadow:inset 0 0 0 1px ${idn.accent}66">
        <span class="bp-photo-plane">${idn.icon}</span>
      </div>
      <div class="bp-card2-body">
        <div class="bp-card2-top">
          <div style="min-width:0;flex:1">
            <div class="bp-name-row"><div class="bp-plane-name2">${idn.name}<span class="bp-model-key">${n}</span></div>${badges}${acBrandBadge(n)}</div>
            <div class="bp-identity-line">${idn.theme}</div>
            <div class="bp-statline">
              <span>👥 ${a.seats} SEATS</span><span class="bp-sep">|</span>
              <span>📍 ${a.range.toLocaleString()} MI</span><span class="bp-sep">|</span>
              <span>⏱ ${a.speed} MPH</span><span class="bp-sep">|</span>
              <span class="bp-haul">${haul}</span>
            </div>
            <div class="bp-desc"><b style="color:${idn.accent}">${idn.id}</b> — ${idn.role}</div>${desc?`<div class="bp-identity-theme">${desc}</div>`:''}
          </div>
          <div class="bp-price-block">
            <div class="bp-price2">$${a.cost}M</div>
            <div class="bp-perunit2">per aircraft</div>
          </div>
        </div>
        ${future
          ? `<div class="bp-future-note">⏳ Available in ${a.era} — not purchasable yet</div>`
          : `<div class="bp-qrow">${[1,2,3,5].map(qtyBtn).join('')}
              ${canSell?`<button class="bp-sell-btn2" onclick="tapConfirm(this,()=>{sellPlane('${esc}')},'Sell 1?')">Sell 1 · $${Math.round(a.cost*0.55)}M</button>`:''}
            </div>`}
      </div>
    </div>`;
  }).join('');
}
function buildBpCatView(catId) {
  const cat = BP_CATEGORIES.find(c=>c.id===catId);
  if (!cat) return '';
  const planes = Object.entries(AIRCRAFT)
    .filter(([,a]) => acListed(a) && cat.types.includes(a.type))
    .sort((a,b) => a[1].cost - b[1].cost);
  const header = `<div class="bp-cat-header">
    <div class="bp-cat-icon">${cat.icon}</div>
    <div style="flex:1"><div class="bp-cat-name">${cat.label}</div><div class="bp-cat-sub">${cat.sub}</div></div>
    <span class="nr-chip">Cash <b style="color:var(--accent2)">$${STATE.cash.toFixed(0)}M</b></span>
  </div>`;
  const cards = bpCardsForPlanes(planes);
  return header + (cards || `<div style="color:var(--muted);font-size:12.4px;padding:20px 0">No aircraft available in this category yet.</div>`);
}
function buildBpFleetView(ownedFleet) {
  const header = `<div class="bp-cat-header">
    <div class="bp-cat-icon">📋</div>
    <div><div class="bp-cat-name">Your Fleet</div><div class="bp-cat-sub">All owned aircraft</div></div>
    <div class="bp-cash">Cash<br><b>$${STATE.cash.toFixed(0)}M</b></div>
  </div>`;
  if (!ownedFleet.length) {
    return header + `<div style="color:var(--muted);font-size:12.4px;padding:20px 0;text-align:center">No aircraft owned yet.<br>Browse categories on the left to buy.</div>`;
  }
  const groups = {};
  ownedFleet.forEach(([n,p]) => {
    const a = AIRCRAFT[n] || {}; const t = a.type || 'other';
    if (!groups[t]) groups[t] = [];
    groups[t].push([n,p,a]);
  });
  const groupHtml = Object.entries(groups).map(([type, planes]) => `
    <div style="font-size:11.3px;letter-spacing:1.5px;color:var(--muted2);text-transform:uppercase;margin:10px 0 6px;font-weight:700">${type}</div>
    ${planes.map(([n,p,a])=>{
      const idn = acIdentity(n);
      const free = p.owned - p.assigned;
      const freeColor = free>0?'var(--accent)':'var(--warn)';
      return `<div class="bp-card owned" style="margin-bottom:6px">
        <div class="bp-card-head" onclick="bpToggle('fleet_${n.replace(/\s/g,'_')}')">
          <div class="bp-plane-info">
            <div class="bp-plane-name">${idn.icon} ${idn.name}</div>
            <div class="bp-plane-specs"><span>${idn.id}</span><span>${n}</span><span>${a.seats} seats</span><span>${(a.range||0).toLocaleString()} mi</span><span>${a.speed||'—'} mph</span></div>
          </div>
          <div class="bp-plane-right">
            <div style="font-size:13.6px;font-weight:700;color:var(--text);font-family:'DM Mono'">${p.owned} <span style="color:var(--muted);font-weight:400;font-size:11.3px">owned</span></div>
            <div style="font-size:12.4px;font-weight:700;color:${freeColor};font-family:'DM Mono'">${free} <span style="color:var(--muted);font-weight:400;font-size:11.3px">free</span></div>
          </div>
          <div class="bp-expand">›</div>
        </div>
        <div class="bp-detail" id="bpc-fleet_${n.replace(/\s/g,'_')}">
          <div class="bp-buy-row">
            <span class="bp-qty-label">Buy more:</span>
            ${[1,2,3,5].map(q=>`<button class="bp-qty-btn ${(_bpQty[n]||1)===q?'bp-qty-active':''}" onclick="bpSetQty('fleet_${n.replace(/\s/g,'_')}','${n}',${q})">${q}</button>`).join('')}
            <button class="bp-buy-btn" onclick="openAcDetail('${n.replace(/'/g,"\\'")}')">
              BUY ${_bpQty[n]||1} · $${(a.cost*(_bpQty[n]||1)).toFixed(0)}M ›
            </button>
            ${free>0?`<button class="bp-sell-btn" onclick="tapConfirm(this,()=>{sellPlane('${n}')},'Confirm sell')">Sell 1 · $${Math.round(a.cost*0.55)}M</button>`:''}
          </div>
        </div>
      </div>`;
    }).join('')}
  `).join('');
  return header + groupHtml;
}
function bpToggle(id) {
  const el = document.getElementById(`bpc-${id}`);
  const card = el && el.closest('.bp-card');
  if (card) card.classList.toggle('open');
}
function bpSetQty(cardId, planeName, qty) {
  _bpQty[planeName] = qty;
  document.getElementById('modal-content').innerHTML = buildBuyPlanes();
}
// ── Aircraft purchase popup: full specs + all pricing, buy or sell in place ──
function closeAcDetail(){ const o=document.getElementById('ac-pop'); if(o) o.style.display='none'; }
function acSetQty(name, q){ _bpQty[name]=q; openAcDetail(name); }
function acBuy(name){
  const q=_bpQty[name]||1;
  buyPlaneQty(name, q);                 // handles cash/era checks, fleet, flash, modal refresh
  const o=document.getElementById('ac-pop');
  if(o && o.style.display!=='none') openAcDetail(name);   // refresh popup with new owned counts
}
function acSell(name){
  sellPlane(name);
  const o=document.getElementById('ac-pop');
  if(o && o.style.display!=='none') openAcDetail(name);
}
// ═══════════════════════════════════════════════════════════════════════════
// FLEET ART — hero images + procedural fallback silhouettes  (v_fleetart_1)
// AC_HERO holds embedded WebP hero shots per aircraft. Any plane without an
// entry falls back to a procedurally generated side-profile silhouette,
// tinted with the player's livery. Add images over time; no code changes.
// ═══════════════════════════════════════════════════════════════════════════
const AC_HERO = Object.fromEntries(
  Object.entries(globalThis.AEAircraftImageManifest?.byModel || {}).map(([model, entry]) => [model, entry.path])
);
// Per-aircraft silhouette config: e=engines, m=mount(wing|rear|tri|delta),
// tt=T-tail, hump=747 upper deck, deck:2=full double deck,
// banjo=fin-mounted #2 (DC-10), droop=droop nose (Concorde)
const AC_ART = {
  'A220-100':{e:2,m:'wing'},        'A220-300':{e:2,m:'wing'},
  'B737-800':{e:2,m:'wing'},        'B737 MAX 8':{e:2,m:'wing'},
  'B737 MAX 10':{e:2,m:'wing'},     'A319':{e:2,m:'wing'},
  'A320':{e:2,m:'wing'},            'A320neo':{e:2,m:'wing'},
  'A321XLR':{e:2,m:'wing'},         'B767-300ER':{e:2,m:'wing'},
  'B787-8':{e:2,m:'wing'},          'B787-9':{e:2,m:'wing'},
  'B787-10':{e:2,m:'wing'},         'A330-300':{e:2,m:'wing'},
  'A330neo':{e:2,m:'wing'},         'A350-900':{e:2,m:'wing'},
  'A350-1000':{e:2,m:'wing'},       'B747-400':{e:4,m:'wing',hump:1},
  'B747-8I':{e:4,m:'wing',hump:1},  'A380-800':{e:4,m:'wing',deck:2},
  'B777-300ER':{e:2,m:'wing'},      'B777X':{e:2,m:'wing'},
  'Overture':{m:'delta'},
  'B707-320B':{e:4,m:'wing'},       'DC-8-63':{e:4,m:'wing'},
  'B727-200':{e:3,m:'rear',tt:1},   'DC-9-30':{e:2,m:'rear',tt:1},
  'B737-200':{e:2,m:'wing'},        'B747-100':{e:4,m:'wing',hump:1},
  'B747-200':{e:4,m:'wing',hump:1}, 'DC-10-30':{e:3,m:'tri',banjo:1},
  'L-1011':{e:3,m:'tri'},           'A300B4':{e:2,m:'wing'},
  'Concorde':{m:'delta',droop:1},   'MD-80':{e:2,m:'rear',tt:1},
  'B757-200':{e:2,m:'wing'},        'B767-200ER':{e:2,m:'wing'},
};
function acShade(hex,amt){
  const n=parseInt(hex.slice(1),16);
  const f=v=>Math.max(0,Math.min(255,v+amt));
  return '#'+[f(n>>16&255),f(n>>8&255),f(n&255)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function aircraftSVG(name, ac, livery, compact){
  livery = livery || '#00d8f0';
  const art = AC_ART[name] || {e:2,m:'wing'};
  const uid = 'fus_'+name.replace(/[^a-z0-9]/gi,'');
  const clampV=(v,a,b)=>Math.max(a,Math.min(b,v));
  const isDelta = art.m==='delta';
  const len = isDelta ? 480 : clampV(250 + ac.seats*0.62, 300, 590);
  const H = {short:30, medium:32, long:38, jumbo:46, supersonic:22}[ac.type]||32;
  const h = art.deck===2 ? 56 : H;
  const nx = (640-len)/2, tx = nx+len;
  const cy = 118, top = cy-h/2, bot = cy+h/2;
  const finH = h*(ac.type==='jumbo'?1.55:1.75);
  const g = [];
  const dark = acShade(livery,-35);
  const pod=(x,y,w,hh)=>`<g><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${hh/2.4}"
      fill="url(#${uid})" stroke="#7c8a94" stroke-width="0.7"/>
    <rect x="${x+w*0.14}" y="${y}" width="${w*0.16}" height="${hh}" fill="${livery}" opacity="0.9"/>
    <ellipse cx="${x+1.5}" cy="${y+hh/2}" rx="${w*0.09}" ry="${hh/2.3}" fill="#39424b"/></g>`;
  const win=(x1,x2,y)=>`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"
    stroke="#3a4854" stroke-width="2.1" stroke-dasharray="2.1 3.6" stroke-linecap="round"/>`;
  const wx = nx + len*0.46;
  if (isDelta){
    g.push(`<path d="M ${nx+len*0.34},${cy+2} L ${tx-len*0.04},${cy+h*1.9}
      L ${tx-len*0.015},${cy+3} Z" fill="url(#${uid})" stroke="#7c8a94" stroke-width="0.7"/>`);
    g.push(pod(tx-len*0.30, cy+h*1.0, len*0.13, h*0.85));
  } else {
    const wc = len*0.17, drop = h*1.15, sweep = len*0.14;
    g.push(`<path d="M ${wx},${cy+h*0.10} L ${wx+wc},${cy+h*0.10}
      L ${wx+wc+sweep},${cy+drop} L ${wx+sweep+wc*0.45},${cy+drop} Z"
      fill="url(#${uid})" stroke="#7c8a94" stroke-width="0.7"/>`);
  }
  if (!isDelta){
    const pw = len*0.105, ph = h*0.62, py = bot + h*0.28;
    if (art.m==='wing'){
      g.push(pod(wx - pw*0.55, py, pw, ph));
      if (art.e>=4) g.push(pod(wx - pw*1.9, py - ph*0.12, pw*0.88, ph*0.9));
    }
    if (art.m==='rear') g.push(pod(tx - len*0.20, cy - h*0.05, pw*0.95, ph*0.85));
    if (art.m==='tri'){
      g.push(pod(wx - pw*0.55, py, pw, ph));
      if (art.banjo) g.push(pod(tx - len*0.135, top - h*0.70, pw*1.05, ph*0.9));
      else           g.push(pod(tx - len*0.155, top - h*0.28, pw*0.95, ph*0.8));
    }
  }
  const fb = tx - len*0.155;
  const ftipX = tx - len*0.015, ftipY = top - finH;
  g.push(`<path d="M ${fb},${top+3} L ${ftipX - len*0.055},${ftipY}
    L ${ftipX + len*0.015},${ftipY} L ${tx+1},${top+4} Z"
    fill="${livery}" stroke="${dark}" stroke-width="0.8"/>`);
  g.push(`<path d="M ${fb+len*0.035},${top+2} L ${ftipX - len*0.028},${ftipY+finH*0.28}
    L ${ftipX - len*0.008},${ftipY+finH*0.28} L ${fb+len*0.055},${top+2} Z"
    fill="rgba(255,255,255,0.55)"/>`);
  if (art.tt){
    g.push(`<path d="M ${ftipX - len*0.085},${ftipY+2} L ${ftipX + len*0.035},${ftipY-4}
      L ${ftipX + len*0.045},${ftipY+1} L ${ftipX - len*0.045},${ftipY+7} Z"
      fill="#c9d1d9" stroke="#7c8a94" stroke-width="0.6"/>`);
  } else if (!isDelta){
    g.push(`<path d="M ${tx - len*0.11},${top+7} L ${tx + len*0.02},${top-6}
      L ${tx + len*0.035},${top-1} L ${tx - len*0.055},${top+12} Z"
      fill="#c9d1d9" stroke="#7c8a94" stroke-width="0.6"/>`);
  }
  if (art.m==='rear' && art.e===3)
    g.push(`<ellipse cx="${fb+len*0.01}" cy="${top-2}" rx="${len*0.022}" ry="${h*0.22}"
      fill="#39424b" stroke="#7c8a94" stroke-width="0.6"/>`);
  const noseEnd = isDelta ? nx + h*4.4 : nx + h*1.5;
  const nosePath = art.droop
    ? `M ${nx},${cy+5} Q ${nx+h*1.4},${cy-h*0.30} ${noseEnd},${top}`
    : `M ${nx},${cy} Q ${nx+2},${cy-h*0.36} ${noseEnd},${top}`;
  g.push(`<path d="${nosePath}
    L ${tx - len*0.15},${top} Q ${tx-3},${top+1} ${tx},${top+5}
    L ${tx},${top+10}
    Q ${tx - len*0.09},${bot-2} ${tx - len*0.21},${bot}
    L ${nx + (isDelta?h*3.4:h*1.2)},${bot}
    Q ${nx+2},${cy+h*0.36} ${nx},${cy + (art.droop?5:0)} Z"
    fill="url(#${uid})" stroke="#7c8a94" stroke-width="0.8"/>`);
  if (art.hump){
    g.push(`<path d="M ${nx+h*1.1},${top+1} Q ${nx+h*1.5},${top-h*0.42} ${nx+len*0.14},${top-h*0.44}
      L ${nx+len*0.30},${top-h*0.44} Q ${nx+len*0.40},${top-h*0.42} ${nx+len*0.46},${top+1} Z"
      fill="url(#${uid})" stroke="#7c8a94" stroke-width="0.8"/>`);
    g.push(win(nx+len*0.10, nx+len*0.34, top-h*0.16));
  }
  if (ac.vintage){
    g.push(`<path d="M ${nx+h*0.5},${cy} L ${tx - len*0.10},${cy} L ${tx-len*0.12},${cy+h*0.16}
      L ${nx+h*0.7},${cy+h*0.16} Z" fill="${livery}" opacity="0.92"/>`);
    g.push(`<path d="M ${nx+h*0.7},${cy+h*0.20} L ${tx-len*0.13},${cy+h*0.20}
      L ${tx-len*0.14},${cy+h*0.28} L ${nx+h*0.9},${cy+h*0.28} Z" fill="${dark}" opacity="0.85"/>`);
  } else if (!isDelta){
    g.push(`<path d="M ${tx - len*0.32},${bot} Q ${tx-len*0.20},${bot-h*0.30} ${tx-len*0.155},${top+6}
      L ${tx},${top+10} Q ${tx - len*0.09},${bot-2} ${tx - len*0.21},${bot} Z"
      fill="${livery}" opacity="0.85"/>`);
  }
  g.push(win(nx + (isDelta?h*4.6:h*1.9), tx - len*0.24, cy - h*0.14));
  if (art.deck===2) g.push(win(nx + h*1.6, tx - len*0.24, cy + h*0.12));
  const ck = isDelta ? nx + h*3.2 : nx + h*1.1;
  g.push(`<path d="M ${ck},${top+h*0.16} l ${h*0.5},0 l ${h*0.14},${h*0.16} l -${h*0.56},0 Z"
    fill="#2b3540"/>`);
  const viewBox = compact ? '60 18 520 170' : '0 0 640 226';
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}"
    style="display:block;width:100%;height:auto">
    <defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f3f6f9"/><stop offset="70%" stop-color="#d7dee6"/>
      <stop offset="100%" stop-color="#b9c3cd"/></linearGradient></defs>
    <ellipse cx="320" cy="208" rx="${len*0.42}" ry="7" fill="rgba(0,0,0,0.35)"/>
    ${g.join('\n')}
  </svg>`;
}
function acHeroHTML(name, a, idn){
  idn = idn || (typeof acIdentity==='function' ? acIdentity(name)
      : {name:name, id:'', theme:(a.type||'aircraft')+' service', icon:'✈', color2:'#00d8f0', accent:'#e5e7eb'});
  const img = AC_HERO[name];
  const future = a.era > STATE.year;
  const badge = future ? ['⏳ FROM '+a.era, '#ffcf5a']
    : a.vintage ? ['★ VINTAGE FLEET', '#e0b64a']
    : ['★ MODERN FLEET', '#22c55e'];
  const TL={short:'Short-haul',medium:'Medium-haul',long:'Long-haul',jumbo:'Jumbo',supersonic:'Supersonic'};
  const visual = img
    ? `<img src="${img}" alt="${idn.name}" style="display:block;width:100%;height:auto">`
    : `<div style="padding:4px 0 0">${aircraftSVG(name, a, idn.color2||'#00d8f0')}</div>`;
  return `<div style="position:relative;background:linear-gradient(180deg,#0d1a26,#0b0f13);overflow:hidden;border-radius:12px 12px 0 0;border-bottom:1px solid var(--border)">
    ${visual}
    <div style="position:absolute;inset:auto 0 0 0;height:74px;background:linear-gradient(transparent,rgba(10,13,17,0.95));pointer-events:none"></div>
    <span style="position:absolute;top:10px;left:10px;font-size:10.7px;font-weight:800;letter-spacing:1.2px;padding:5px 10px;border-radius:8px;background:rgba(5,8,12,0.85);border:1.5px solid ${badge[1]};color:${badge[1]}">${badge[0]}</span>
    <span onclick="closeAcDetail()" style="position:absolute;top:8px;right:10px;cursor:pointer;color:#d5dde2;font-size:16.9px;padding:2px 8px;background:rgba(5,8,12,0.65);border-radius:7px">✕</span>
    <div style="position:absolute;left:13px;bottom:7px">
      <div style="font-size:10.2px;color:${idn.accent||'#9fb4c0'};letter-spacing:2px;text-transform:uppercase;font-weight:800;text-shadow:0 1px 6px rgba(0,0,0,.9)">${idn.id} · ${idn.theme}</div>
      <div style="font-size:23.7px;font-weight:800;color:#fff;letter-spacing:.5px;text-shadow:0 2px 10px rgba(0,0,0,.9)">${idn.icon} ${idn.name}</div>
      <div style="font-size:10.7px;color:#9fb0ba;text-shadow:0 1px 5px rgba(0,0,0,.9)">Model ${name} · ${TL[a.type]||a.type} · introduced ${a.era}</div>
    </div>
  </div>`;
}

function openAcDetail(name){
  const a=AIRCRAFT[name]; if(!a) return;
  const idn = acIdentity(name);
  const p=STATE.planes[name] || {owned:0, assigned:0};
  const owned=p.owned||0, free=owned-(p.assigned||0);
  const future=a.era>STATE.year;
  const qty=_bpQty[name]||1;
  const unit=a.cost, total=unit*qty;
  const resale=Math.round(a.cost*0.55);
  const perSeat=Math.round(a.cost/a.seats*1000);                       // $k per seat
  const leaseMo=(a.seats*ECON.leasePerSeatMonth/1e6);                  // $M/mo upkeep per airframe
  const fuelCost1k=(ECON.fuelPerSeatMile*(1-a.fuel/220)*1000).toFixed(1); // $/seat/1000mi fuel
  const canBuy=!future && STATE.cash>=total;
  const shortfall=Math.max(0, total-STATE.cash);
  const TYPE_LABEL={short:'Short-haul',medium:'Medium-haul',long:'Long-haul',jumbo:'Jumbo',supersonic:'Supersonic'};
  const bar=(v,col)=>`<div style="height:5px;border-radius:3px;background:var(--border);margin-top:4px"><div style="height:5px;border-radius:3px;width:${Math.min(100,Math.max(2,v))}%;background:${col}"></div></div>`;
  const specBox=(v,l,w,col)=>`<div style="flex:1;min-width:70px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:7px 8px">
    <div style="font-size:15.8px;font-weight:700;color:var(--text);font-family:'DM Mono'">${v}</div>
    <div style="font-size:10.2px;color:var(--muted2);letter-spacing:.6px;text-transform:uppercase">${l}</div>${bar(w,col)}</div>`;
  const priceRow=(l,v,c)=>`<div style="display:flex;justify-content:space-between;padding:5px 11px;border-bottom:1px solid var(--border);font-size:11.3px">
    <span style="color:var(--muted2)">${l}</span><span style="color:${c||'var(--text)'};font-family:'DM Mono';font-weight:600">${v}</span></div>`;

  const card=document.getElementById('ac-pop-card');
  card.innerHTML=`
    ${acHeroHTML(name, a, idn)}
    <div style="padding:12px 14px">
      <div class="bp-mini bp-mini-lg" style="margin-bottom:14px">
        ${[['Seats', a.seats.toLocaleString(), a.seats/450*100, 'var(--accent)'],
           ['Range', a.range.toLocaleString(), a.range/9000*100, 'var(--accent2)'],
           ['Speed', a.speed.toLocaleString(), a.speed/1400*100, 'var(--purple,#a78bfa)'],
           ['Eff', a.fuel+'%', a.fuel, 'var(--profit)']]
          .map(([l,v,w,col])=>`<div class="bp-mini-i"><div class="bp-mini-top"><span>${l}</span><b>${v}</b></div><div class="bp-mini-bar"><i style="width:${Math.max(4,Math.min(100,w))}%;background:${col}"></i></div></div>`).join('')}
      </div>

      <div style="font-size:11.9px;color:var(--muted);line-height:1.45;background:linear-gradient(135deg, ${idn.color1}55, ${idn.color2}33);border:1px solid ${idn.accent}55;border-radius:9px;padding:8px 10px;margin-bottom:12px"><b style="color:${idn.accent}">${idn.name}</b> — ${idn.role}</div>
      <div style="font-size:11.3px;font-weight:700;color:#fff;letter-spacing:1.4px;margin-bottom:6px">PRICING — all-in</div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:6px">
        ${priceRow('Unit price', '$'+unit+'M', 'var(--accent2)')}
        ${priceRow('Resale value (each)', '$'+resale+'M', 'var(--profit)')}
        ${priceRow('Cost per seat', '$'+perSeat+'k', 'var(--muted)')}
        ${priceRow('Monthly upkeep / airframe', '$'+(leaseMo*1000).toFixed(0)+'k', 'var(--warn)')}
        ${priceRow('Fuel burn', '$'+fuelCost1k+' / seat / 1000mi', 'var(--muted)')}
        <div style="display:flex;justify-content:space-between;padding:6px 11px;background:rgba(255,207,90,0.07)">
          <span style="font-size:11.3px;font-weight:700;color:var(--muted)">Order total · ${qty}×</span>
          <span style="font-size:14.7px;font-weight:800;color:${canBuy?'var(--accent2)':'var(--loss)'};font-family:'DM Mono'">$${total}M</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11.3px;color:var(--muted2);margin-bottom:12px">
        <span>${owned?`Fleet: <b style="color:var(--text)">${owned}</b> owned · <b style="color:${free>0?'var(--accent)':'var(--warn)'}">${free}</b> free`:'None owned yet'}</span>
        <span>Cash: <b style="color:var(--accent2)">$${Math.round(STATE.cash)}M</b></span>
      </div>

      ${future ? `<div style="text-align:center;color:var(--warn);font-size:12.4px;padding:8px 0">⏳ Enters service in ${a.era} — not purchasable yet.</div>` : `
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:10px">
        <span style="font-size:11.3px;color:var(--muted2);margin-right:2px">QTY</span>
        ${[1,2,3,5,10].map(q=>`<button onclick="acSetQty('${name.replace(/'/g,"\\'")}',${q})" style="flex:1;padding:5px 0;font-size:11.3px;border-radius:6px;cursor:pointer;font-weight:700;border:1px solid ${qty===q?'var(--accent)':'var(--border)'};background:${qty===q?'rgba(167,137,255,0.16)':'var(--bg2)'};color:${qty===q?'var(--accent)':'var(--muted)'}">${q}</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <button class="action-btn gold" style="flex:2;margin:0;padding:9px;font-size:13.6px" ${canBuy?'':'disabled'} onclick="tapConfirm(this,()=>{acBuy('${name.replace(/'/g,"\\'")}')},'Tap to confirm')">${shortfall>0?`Need $${shortfall}M more`:`BUY ${qty} · $${total}M`}</button>
        <button class="action-btn danger" style="flex:1;margin:0;padding:9px;font-size:13.6px" ${free>0?'':'disabled'} onclick="tapConfirm(this,()=>{acSell('${name.replace(/'/g,"\\'")}')},'Tap to confirm')">SELL 1 · $${resale}M</button>
      </div>
      ${free<=0&&owned>0?`<div style="font-size:10.2px;color:var(--muted2);text-align:center;margin-top:5px">All ${owned} copies are assigned to routes — unassign one to sell.</div>`:''}`}
    </div>`;
  document.getElementById('ac-pop').style.display='flex';
}
// ═══════════════════════════════════════════════════════════════════
// AIRCRAFT LEASING — lease vs own. Leased airframes fly routes like owned
// ones, but cost a monthly lease fee and can't be sold (returned instead).
// Backward-compatible: leased defaults to 0, so existing owned-only logic
// is unchanged for anyone not leasing.
// ═══════════════════════════════════════════════════════════════════
const LEASE = { deposit: 0.08, monthly: 0.015 }; // fraction of aircraft value
function planeTotal(p){ return (p?.owned||0) + (p?.leased||0); }
function planeFree(p){ return planeTotal(p) - (p?.assigned||0); }
function leaseMonthlyCost(){
  let c = 0;
  Object.entries(STATE.planes||{}).forEach(([n,p])=>{
    if(!p.leased) return;
    const a = AIRCRAFT[n] || p;
    c += (a.cost||0) * LEASE.monthly * p.leased;
  });
  return c;
}
function leasePlaneQty(n, q){
  const a = AIRCRAFT[n]; if(!a) return;
  const deposit = Math.round(a.cost * LEASE.deposit * q * 10)/10;
  if (STATE.cash < deposit) return showFlash(`⚠ Need $${deposit}M deposit`);
  if (a.era > STATE.year+3) return showFlash(`⚠ ${n} not available until ${a.era}`);
  if(!spendAction('Lease aircraft')) return;
  STATE.cash -= deposit;
  if (!STATE.planes[n]) STATE.planes[n] = {...a, owned:0, assigned:0, leased:0};
  STATE.planes[n].leased = (STATE.planes[n].leased||0) + q;
  const moCost = Math.round(a.cost * LEASE.monthly * q * 10)/10;
  addEvent('neutral', `Leased ${q}× ${n} ($${deposit}M deposit, $${moCost}M/mo)`);
  showFlash(`✓ ${q}× ${n} leased`);
  guideStep(2);
  updateUI(); if(typeof renderFleet==='function') renderFleet();
  const c=document.getElementById('modal-content'); if(c && _fleetTab) c.innerHTML=buildFleetPage();
}
function returnLease(n, q){
  const p = STATE.planes[n]; if(!p || !(p.leased>0)) return showFlash('No leased aircraft of this type');
  q = q || 1;
  const freeLeased = planeFree(p);
  if (freeLeased < q) return showFlash('⚠ Return failed — leased aircraft are assigned to routes. Free them first.');
  p.leased = Math.max(0, p.leased - q);
  addEvent('neutral', `Returned ${q}× ${n} lease`);
  showFlash(`✓ Returned ${q}× ${n}`);
  updateUI(); if(typeof renderFleet==='function') renderFleet();
  const c=document.getElementById('modal-content'); if(c && _fleetTab) c.innerHTML=buildFleetPage();
}

function stampAcquisition(p, qty, acqYear){
  const y = (acqYear != null ? acqYear : (STATE.year || 2024));
  const prev = Math.max(0, (p.owned||0) - qty);   // fleet size before this acquisition
  p._acqYear = (prev > 0 && p._acqYear != null)
    ? (p._acqYear * prev + y * qty) / (prev + qty)
    : y;
}
function buyPlaneQty(n, q) {
  const a = AIRCRAFT[n], total = a.cost * q;
  if (STATE.cash < total) return showFlash(`⚠ Need $${total}M`);
  if (a.era > STATE.year+3) return showFlash(`⚠ ${n} not available until ${a.era}`);
  if(!spendAction('Buy aircraft')) return;
  STATE.cash -= total;
  if (!STATE.planes[n]) STATE.planes[n] = {...a, owned:0, assigned:0, leased:0};
  STATE.planes[n].owned += q;
  stampAcquisition(STATE.planes[n], q);
  addEvent('neutral', `Bought ${q}× ${n} for $${total}M`);
  showFlash(`✓ ${q}× ${n} acquired`);
  guideStep(2);
  updateUI(); renderFleet();
  document.getElementById('modal-content').innerHTML = buildBuyPlanes();
}
function buyPlane(n, q) { buyPlaneQty(n, q); }
function sellPlane(n){
  const p=STATE.planes[n]; if(!p||p.owned<=0) return showFlash('None to sell');
  const free=p.owned-p.assigned;
  if(free<=0) return showFlash('⚠ All copies are assigned to routes');
  const price=Math.round(AIRCRAFT[n].cost*0.55);
  STATE.cash+=price; p.owned--;
  showFlash(`✓ Sold 1× ${n} for $${price}M`);
  addEvent('neutral',`Sold ${n} for $${price}M`);
  updateUI(); renderFleet();
  document.getElementById('modal-content').innerHTML=buildBuyPlanes();
}
// Each venture, when placed in a city, lifts that city's loyalty (fulfill) and economy.
const BIZ_CITY_FX = {
  'City Hotel':     {fulfill:14, pop:0.4, econ:3,           blurb:'+0.4M pop · +3 econ'},
  'Resort Hotel':   {fulfill:14, tourism:10,                blurb:'+10 tourism'},
  'Grand Hotel':    {fulfill:20, pop:0.6, tourism:6,        blurb:'+0.6M pop · +6 tourism'},
  'Travel Agency':  {fulfill:10,                            blurb:'+campaign reach'},
  'Amusement Park': {fulfill:16, tourism:12,                blurb:'+12 tourism'},
  'Concert Hall':   {fulfill:12, tourism:7,                 blurb:'+7 tourism'},
  'Museum':         {fulfill:12, tourism:6,                 blurb:'+6 tourism'},
  'Shuttle Service':{fulfill:10, pop:0.3,                   blurb:'+0.3M pop'},
  'Ski Resort':     {fulfill:16, tourism:14,                blurb:'+14 tourism'},
  'Golf Course':    {fulfill:12, econ:5, tourism:4,         blurb:'+5 econ · +4 tourism'},
};
function ventureList(){ return Object.values(STATE.businesses||{}); }
function ventureKey(type, city){ return type+'__'+city; }
function cityHasVenture(type, city){ return !!(STATE.businesses||{})[ventureKey(type,city)]; }
function hasVenture(type){ return ventureList().some(v => v.name===type) || !!(STATE.businesses||{})[type]; }
function migrateBusinesses(){
  const biz=STATE.businesses; if(!biz) return;
  Object.keys(biz).forEach(k=>{
    if(k.indexOf('__')!==-1) return;            // already composite
    const v=biz[k]; if(!v) return;
    v.name  = v.name  || k;
    v.stake = v.stake || 1;
    v.city  = v.city  || (STATE.hubs && STATE.hubs[0]) || Object.keys(CITIES)[0];
    biz[ventureKey(v.name, v.city)] = v;
    delete biz[k];
  });
}
let _bizRegion = 'ALL';
let _bizSort = 'profit';
let _bizView = 'grid';
let _bizInfoOpen = null;
const BIZ_BADGE = {
  'City Hotel':'#e05c5c','Resort Hotel':'#2ab5a5','Grand Hotel':'#9a6fe0','Travel Agency':'#3b8fd4',
  'Amusement Park':'#e8843a','Concert Hall':'#a05ce0','Museum':'#4a7fd4','Shuttle Service':'#e8963a',
  'Ski Resort':'#4aa3d4','Golf Course':'#3fbf7f',
};
function bizThumbSVG(name){
  const rnd = seededRng('biz:'+name);
  const c = BIZ_BADGE[name] || '#3b8fd4';
  const W=180,H=74,g=H-8;
  const gid='bz'+name.replace(/[^a-z0-9]/gi,'');
  let scene='';
  const win=(x,y,w,h,cols,rows)=>{let s='';for(let r=0;r<rows;r++)for(let cc=0;cc<cols;cc++){if(rnd()<0.5)s+=`<rect x="${x+3+cc*(w-6)/cols}" y="${y+3+r*(h-6)/rows}" width="2.4" height="3" fill="#ffd77a" opacity="${(0.4+rnd()*0.5).toFixed(2)}"/>`;}return s;};
  if(name==='City Hotel'||name==='Grand Hotel'){
    const bw=name==='Grand Hotel'?96:54, bh=name==='Grand Hotel'?46:52, bx=(W-bw)/2;
    scene=`<rect x="${bx}" y="${g-bh}" width="${bw}" height="${bh}" rx="2" fill="#0a1420"/>${win(bx,g-bh,bw,bh,name==='Grand Hotel'?8:4,5)}<rect x="${bx+bw*0.35}" y="${g-bh-7}" width="${bw*0.3}" height="7" fill="#0a1420"/>`;
  } else if(name==='Resort Hotel'){
    scene=`<rect x="46" y="${g-30}" width="60" height="30" rx="2" fill="#0a1420"/>${win(46,g-30,60,30,5,3)}<ellipse cx="135" cy="${g-3}" rx="24" ry="4" fill="#1e6f8f" opacity=".8"/><path d="M28 ${g} q2-24 -3-30 m3 30 q-2-24 4-31 m-4 31 q0-22 -9-26" stroke="#1f7a4d" stroke-width="2.2" fill="none"/><circle cx="28" cy="${g-31}" r="5" fill="#1f7a4d"/>`;
  } else if(name==='Travel Agency'){
    scene=`<circle cx="${W/2}" cy="${g-24}" r="21" fill="none" stroke="${c}" stroke-width="1.4" opacity=".9"/><ellipse cx="${W/2}" cy="${g-24}" rx="10" ry="21" fill="none" stroke="${c}" stroke-width="1" opacity=".6"/><line x1="${W/2-21}" y1="${g-24}" x2="${W/2+21}" y2="${g-24}" stroke="${c}" stroke-width="1" opacity=".6"/><path d="M${W/2-30} ${g-40} l14 5 -6 4 z" fill="#cfd8e2"/>`;
  } else if(name==='Amusement Park'){
    scene=`<circle cx="${W/2}" cy="${g-27}" r="20" fill="none" stroke="${c}" stroke-width="2"/><circle cx="${W/2}" cy="${g-27}" r="3" fill="${c}"/>${Array.from({length:8},(_,k)=>{const a=k/8*Math.PI*2;return `<circle cx="${(W/2+Math.cos(a)*20).toFixed(1)}" cy="${(g-27+Math.sin(a)*20).toFixed(1)}" r="2.6" fill="#ffd77a"/><line x1="${W/2}" y1="${g-27}" x2="${(W/2+Math.cos(a)*20).toFixed(1)}" y2="${(g-27+Math.sin(a)*20).toFixed(1)}" stroke="${c}" stroke-width=".8" opacity=".7"/>`;}).join('')}<path d="M${W/2-13} ${g} l13-16 13 16 z" fill="#0a1420"/>`;
  } else if(name==='Concert Hall'){
    scene=`<rect x="30" y="${g-16}" width="120" height="16" fill="#0a1420"/>`+Array.from({length:5},(_,k)=>{const x=45+k*23;return `<path d="M${x} ${g-16} L${x-9+rnd()*18} ${g-58}" stroke="${['#e05c9e','#8b6fe0','#00d8f0','#ffcf5a','#a789ff'][k]}" stroke-width="4" opacity=".55" stroke-linecap="round"/>`;}).join('')+Array.from({length:12},()=>`<circle cx="${(35+rnd()*110).toFixed(0)}" cy="${g-4-rnd()*8}" r="1.6" fill="#e8edf3" opacity=".7"/>`).join('');
  } else if(name==='Museum'){
    scene=`<rect x="42" y="${g-8}" width="96" height="8" fill="#0a1420"/><path d="M40 ${g-40} L${W/2} ${g-54} L140 ${g-40} Z" fill="#0e1a28"/>`+Array.from({length:5},(_,k)=>`<rect x="${52+k*17}" y="${g-38}" width="6" height="30" fill="#12222f"/>`).join('');
  } else if(name==='Shuttle Service'){
    scene=`<rect x="52" y="${g-26}" width="76" height="22" rx="5" fill="${c}"/><rect x="58" y="${g-22}" width="52" height="9" rx="2" fill="#0a1420" opacity=".85"/><circle cx="68" cy="${g-3}" r="5" fill="#0a1420"/><circle cx="112" cy="${g-3}" r="5" fill="#0a1420"/><rect x="114" y="${g-22}" width="9" height="9" rx="2" fill="#ffd77a" opacity=".9"/>`;
  } else if(name==='Ski Resort'){
    scene=`<path d="M20 ${g} L70 ${g-52} L110 ${g} Z" fill="#dde7f0" opacity=".9"/><path d="M85 ${g} L130 ${g-40} L168 ${g} Z" fill="#b8c9da" opacity=".85"/><line x1="34" y1="${g-38}" x2="150" y2="${g-52}" stroke="#43596e" stroke-width="1.4"/>`+Array.from({length:3},(_,k)=>`<rect x="${52+k*38}" y="${g-49-k*4}" width="5" height="5" fill="#0a1420"/>`).join('');
  } else if(name==='Golf Course'){
    scene=`<path d="M0 ${g} Q45 ${g-22} 90 ${g-10} T${W} ${g-16} V${H} H0 Z" fill="#1f7a4d" opacity=".85"/><ellipse cx="120" cy="${g-12}" rx="20" ry="5" fill="#35d47f" opacity=".7"/><line x1="120" y1="${g-12}" x2="120" y2="${g-38}" stroke="#e8edf3" stroke-width="1.4"/><path d="M120 ${g-38} l12 4 -12 4 z" fill="#e0415c"/>`;
  }
  return `<svg class="bz-thumb" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12283f"/><stop offset="1" stop-color="#081420"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${gid})"/>
    <circle cx="${(20+rnd()*(W-40)).toFixed(0)}" cy="${(10+rnd()*14).toFixed(0)}" r="4" fill="#ffd9a0" opacity=".65"/>
    ${scene}<rect y="${g}" width="${W}" height="${H-g}" fill="#04090f"/></svg>`;
}
function bizRerender(){ const m=document.getElementById('modal-content'); if(m) m.innerHTML=buildBiz(); }
function bizSetSort(v){ _bizSort=v; bizRerender(); }
function bizSetView(v){ _bizView=v; bizRerender(); }
function bizToggleInfo(name, ev){ if(ev) ev.stopPropagation(); _bizInfoOpen = (_bizInfoOpen===name)?null:name; bizRerender(); }
function buildBiz(){
  migrateBusinesses();
  const owned = ventureList();
  const qIncome = owned.reduce((s,v)=>s+(v.income||0),0);
  const esc = s => s.replace(/'/g,"\\'");
  let entries = Object.entries(BUSINESSES).map(([n,b])=>({n,b,fx:BIZ_CITY_FX[n]||{fulfill:0},cnt:owned.filter(v=>v.name===n).length}));
  const sorters = {
    profit:(a,c)=>c.b.income-a.b.income, price:(a,c)=>a.b.cost-c.b.cost,
    loyalty:(a,c)=>(c.fx.fulfill||0)-(a.fx.fulfill||0), name:(a,c)=>a.n.localeCompare(c.n),
  };
  entries.sort(sorters[_bizSort]||sorters.profit);
  const ownedHtml = owned.length ? owned.map(v=>`
    <div style="display:flex;align-items:center;gap:9px;padding:7px 10px;border-bottom:1px solid var(--border)">
      <div style="font-size:18.1px">${v.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12.4px;font-weight:700;color:var(--text)">${v.name} <span style="font-size:10.2px;color:var(--muted2);font-weight:400">in ${v.city}</span>${v.stake&&v.stake<1?` <span style="font-size:10.2px;color:var(--accent2)">${Math.round(v.stake*100)}% stake</span>`:''}</div>
        <div style="font-size:10.7px;color:#fff">+$${v.income}M/Q</div>
      </div>
    </div>`).join('') : '';
  const cardsHtml = entries.map(({n,b,fx,cnt})=>{
    const badge = BIZ_BADGE[n]||'#3b8fd4';
    const info = _bizInfoOpen===n ? `<div class="bz-info" onclick="event.stopPropagation()">
        <div style="font-size:11.3px;font-weight:800;color:var(--text);margin-bottom:4px">${b.icon} ${n}</div>
        <div style="font-size:10.2px;color:var(--muted);line-height:1.5">City effects: <b style="color:#fff">${fx.blurb||b.desc}</b> · +${fx.fulfill||0} loyalty at the host city.${cnt?`<br>You own <b style="color:var(--accent2)">${cnt}</b>.`:''}<br>Full buy $${b.cost}M (+$${b.income}M/Q) · 40% stake $${Math.max(3,Math.round(b.cost*0.45))}M (+$${Math.max(1,Math.round(b.income*0.4))}M/Q, half loyalty).</div>
        <div style="margin-top:6px;text-align:right"><span style="font-size:10.2px;color:#fff;cursor:pointer;font-weight:800" onclick="bizToggleInfo('${esc(n)}',event)">CLOSE ✕</span></div>
      </div>` : '';
    if (_bizView==='list') return `<div class="bz-row" onclick="bizPick('${esc(n)}')">
        <span class="bz-badge sm" style="background:${badge}">${b.icon}</span>
        <span style="flex:1;min-width:0"><span style="font-size:12.4px;font-weight:800;color:var(--text)">${n}${cnt?` <span style="font-size:10.2px;color:#fff">×${cnt}</span>`:''}</span><br><span style="font-size:10.2px;color:var(--muted2)">${b.desc}</span></span>
        <span style="font-size:11.3px;color:var(--profit);font-family:'DM Mono';font-weight:700">$${b.income}M/Q</span>
        <span style="font-size:11.3px;color:var(--accent2)">★ ${fx.fulfill||0}</span>
        <span style="font-size:12.4px;font-weight:800;color:var(--accent2);font-family:'DM Mono';width:52px;text-align:right">$${b.cost}M</span>
      </div>`;
    return `<div class="bz-card" onclick="bizPick('${esc(n)}')">
      ${info}
      <div class="bz-art">${bizThumbSVG(n)}
        <span class="bz-badge" style="background:${badge}">${b.icon}</span>
        <span class="bz-i" onclick="bizToggleInfo('${esc(n)}',event)" title="Details">i</span>
      </div>
      <div class="bz-body">
        <div class="bz-name">${n}${cnt?` <span style="font-size:10.2px;color:#fff">×${cnt}</span>`:''}</div>
        <div class="bz-desc">${b.desc}</div>
        <div class="bz-stats"><span class="bz-inc">$ $${b.income}M/Q</span><span class="bz-loy">★ ${fx.fulfill||0} Loyalty</span></div>
        <div class="bz-price">$${b.cost}M</div>
      </div>
    </div>`;
  }).join('');
  const sortOpts = [['profit','Profit'],['price','Price'],['loyalty','Loyalty'],['name','Name']]
    .map(([v,l])=>`<option value="${v}" ${_bizSort===v?'selected':''}>${l}</option>`).join('');
  return modalHead('🏢 BUSINESS VENTURES')+`<div class="modal-body">
    <div style="font-size:11.3px;letter-spacing:2.5px;color:#fff;font-weight:700;margin:-6px 0 12px">INVEST WISELY. GROW YOUR EMPIRE.</div>
    <div class="bz-statrow">
      <div class="bz-stat"><span class="bz-stat-ic">💼</span><span><span class="bz-stat-l">VENTURES</span><br><span class="bz-stat-v">${owned.length}</span><br><span class="bz-stat-s">Owned</span></span></div>
      <div class="bz-stat"><span class="bz-stat-ic">📈</span><span><span class="bz-stat-l">INCOME</span><br><span class="bz-stat-v" style="color:var(--profit)">$${qIncome}M<span style="font-size:11.3px;color:var(--muted2)"> / Q</span></span><br><span class="bz-stat-s">Quarterly</span></span></div>
      <div class="bz-stat"><span class="bz-stat-ic">💲</span><span><span class="bz-stat-l">CASH</span><br><span class="bz-stat-v" style="color:#fff">$${STATE.cash.toFixed(0)}M</span><br><span class="bz-stat-s">Available</span></span></div>
      <div class="bz-stat bz-tip"><span class="bz-stat-ic">💡</span><span><span class="bz-stat-l" style="color:#fff">PRO TIP</span><br><span style="font-size:10.7px;color:var(--muted);line-height:1.4">Higher loyalty increases income and unlocks bonuses over time.</span></span></div>
    </div>
    ${owned.length?`<div style="font-size:10.7px;letter-spacing:1px;color:var(--muted2);margin-bottom:5px">YOUR PORTFOLIO</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:14px;max-height:20vh;overflow-y:auto">${ownedHtml}</div>`:''}
    <div class="bz-toolbar">
      <span style="font-size:11.3px;letter-spacing:1px;color:var(--text);font-weight:800">👉 BUY OR INVEST — TAP A VENTURE, THEN PICK ANY CITY</span>
      <span style="margin-left:auto;display:flex;gap:7px;align-items:center">
        <select class="bz-sort" onchange="bizSetSort(this.value)"><optgroup label="Sort by">${sortOpts}</optgroup></select>
        <span class="bz-viewbtn ${_bizView==='grid'?'active':''}" onclick="bizSetView('grid')" title="Grid view">▦</span>
        <span class="bz-viewbtn ${_bizView==='list'?'active':''}" onclick="bizSetView('list')" title="List view">☰</span>
      </span>
    </div>
    <div class="${_bizView==='grid'?'bz-grid':'bz-list'}">${cardsHtml}</div>
    <div class="bz-legend">
      <span><span class="lic" style="color:var(--profit)">📈</span><span><b>PASSIVE INCOME</b><br>Earn steady income every quarter</span></span>
      <span><span class="lic" style="color:var(--accent2)">⭐</span><span><b>LOYALTY BONUS</b><br>Higher loyalty increases passenger retention</span></span>
      <span><span class="lic" style="color:var(--profit)">📊</span><span><b>EMPIRE GROWTH</b><br>Unlock more ventures as your empire grows</span></span>
      <span><span class="lic" style="color:#fff">🛡</span><span><b>DIVERSIFY RISK</b><br>Spread investments to maximize stability</span></span>
    </div>
  </div>`;
}
function bizPick(name){ document.getElementById('modal-content').innerHTML = buildBizPicker(name); }
function bizSetRegion(r){ _bizRegion=r; document.getElementById('modal-content').innerHTML = buildBizPicker(window._bizPickType); }
function buildBizPicker(name){
  window._bizPickType = name;
  const b=BUSINESSES[name]; if(!b) return buildBiz();
  const fx=BIZ_CITY_FX[name]||{fulfill:10};
  const hubs=new Set(STATE.hubs||[]);
  const served=new Set(); (STATE.routes||[]).forEach(r=>{served.add(r.from);served.add(r.to);});
  const regions=['ALL','N America','S America','Europe','Africa','Mid East','SE Asia','Oceania'];
  let cities=Object.entries(CITIES).filter(([cn,c])=> !cityHasVenture(name,cn) && (_bizRegion==='ALL'||c.region===_bizRegion));
  cities.sort((a,b2)=>{
    const ah=hubs.has(a[0])?0:1, bh=hubs.has(b2[0])?0:1; if(ah!==bh)return ah-bh;
    const as=served.has(a[0])?0:1, bs=served.has(b2[0])?0:1; if(as!==bs)return as-bs;
    return (b2[1].econ+b2[1].tourism+b2[1].pop*15)-(a[1].econ+a[1].tourism+a[1].pop*15);
  });
  cities=cities.slice(0,40);
  const fullCost=b.cost, stakeCost=Math.max(3,Math.round(b.cost*0.45)), stakeInc=Math.max(1,Math.round(b.income*0.4));
  const rows=cities.map(([city,c])=>{
    const isHub=hubs.has(city), isServed=served.has(city);
    const fc=c.fulfill>60?'var(--profit)':c.fulfill<30?'var(--loss)':'var(--warn)';
    const tag=isHub?'<span style="color:var(--accent2)">\u2605 hub</span>':isServed?'<span style="color:#fff">served</span>':'';
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 11px;border-bottom:1px solid var(--border)">
      <div style="flex:1;min-width:0">
        <div style="font-size:12.4px;font-weight:700;color:var(--text)">${city} <span style="font-size:10.2px;color:var(--muted2);font-weight:400">${c.region}${tag?' \u00b7 ':''}</span>${tag}</div>
        <div style="font-size:10.2px;color:var(--muted2)">loyalty <span style="color:${fc}">${Math.round(c.fulfill)}%</span> \u00b7 pop ${c.pop}M \u00b7 econ ${c.econ} \u00b7 tour ${c.tourism}</div>
      </div>
      <button class="action-btn" style="width:auto;margin:0;padding:4px 9px;font-size:11.3px;background:rgba(167,137,255,0.08);border-color:rgba(167,137,255,0.3);color:#fff" ${STATE.cash<stakeCost?'disabled':''} onclick="tapConfirm(this,()=>{buyBiz('${name.replace(/'/g,"\\'")}','${city.replace(/'/g,"\\'")}',0.4)},'Confirm')">Invest $${stakeCost}M</button>
      <button class="action-btn gold" style="width:auto;margin:0;padding:4px 11px;font-size:11.3px" ${STATE.cash<fullCost?'disabled':''} onclick="tapConfirm(this,()=>{buyBiz('${name.replace(/'/g,"\\'")}','${city.replace(/'/g,"\\'")}',1)},'Confirm')">Buy $${fullCost}M</button>
    </div>`;
  }).join('');
  const regTabs=regions.map(r=>`<button onclick="bizSetRegion('${r}')" style="padding:4px 9px;font-size:10.7px;border-radius:6px;cursor:pointer;border:1px solid ${_bizRegion===r?'var(--accent)':'var(--border)'};background:${_bizRegion===r?'rgba(167,137,255,0.15)':'var(--bg2)'};color:${_bizRegion===r?'var(--accent)':'var(--muted)'};white-space:nowrap">${r==='ALL'?'All':r}</button>`).join('');
  return modalHead('\ud83c\udfe2 PLACE VENTURE')+`<div class="modal-body">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">
      <div style="font-size:15.8px;font-weight:800;color:var(--text)">${b.icon} ${name}</div>
      <button class="action-btn" style="width:auto;margin:0;padding:4px 12px;font-size:11.3px" onclick="document.getElementById('modal-content').innerHTML=buildBiz()">\u2190 Back</button>
    </div>
    <div style="font-size:10.7px;color:var(--muted);margin-bottom:6px"><b style="color:var(--accent2)">Buy</b> = full venture (+$${b.income}M/Q, +${fx.fulfill||0} loyalty). <b style="color:#fff">Invest</b> = 40% stake (+$${stakeInc}M/Q, half loyalty) for $${stakeCost}M. Place it <b>anywhere</b>.</div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px">${regTabs}</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;overflow:hidden;max-height:44vh;overflow-y:auto">${rows||'<div style="padding:14px;font-size:11.3px;color:var(--muted2);text-align:center">No more cities for this venture in this region.</div>'}</div>
  </div>`;
}
function buyBiz(name, city, stake){
  stake = stake || 1;
  const b=BUSINESSES[name]; if(!b) return;
  if(!city || !CITIES[city]) return showFlash('Pick a location');
  if(cityHasVenture(name, city)) return showFlash(`Already have ${name} in ${city}`);
  const cost = stake<1 ? Math.max(3,Math.round(b.cost*0.45)) : b.cost;
  if(STATE.cash<cost) return showFlash(`\u26a0 Need $${cost}M`);
  const c=CITIES[city], fx=BIZ_CITY_FX[name]||{fulfill:10};
  if(!spendAction('Buy business')) return;
  STATE.cash-=cost;
  const income = stake<1 ? Math.max(1,Math.round(b.income*0.4)) : b.income;
  STATE.businesses[ventureKey(name,city)] = {...b, name, city, cost, income, stake};
  const lm = stake<1?0.5:1;
  if(fx.fulfill) c.fulfill=Math.min(100,(c.fulfill||50)+fx.fulfill*lm);
  if(fx.tourism) c.tourism=Math.min(95,(c.tourism||40)+fx.tourism*lm);
  if(fx.econ)    c.econ=Math.min(100,(c.econ||50)+Math.round(fx.econ*lm));
  if(fx.pop)     c.pop=Math.round(((c.pop||1)+fx.pop*lm)*10)/10;
  addEvent('good',`${b.icon} ${stake<1?'Invested in':'Opened'} ${name} in ${city} (+$${income}M/Q).`);
  showFlash(`\u2713 ${name} \u2192 ${city}`);
  if(typeof recalcCompanyValue==='function') recalcCompanyValue();
  updateUI(); if(typeof renderMap==='function') renderMap();
  document.getElementById('modal-content').innerHTML=buildBiz();
}

let _negRegion = 'ALL';
let _negSubregion = {};
let _negOpen = {};
let _negPreselectCity = null; // city to jump to when opening from city modal
function negToggleRegion(reg, cur){ _negOpen[reg] = !cur; negRerender(); }
function setNegSubregion(reg, key){ _negSubregion[reg] = key; _negPending = null; negRerender(); }
function setNegRegion(r){
  _negRegion = r;
  _negPending = null;
  negRerender();
}
function buildNegotiations(){
  const REGION_COLORS = {
    'N America':'#a789ff','S America':'#5fe0a0','Europe':'#9d8ee0',
    'Africa':'#ffcf5a','Mid East':'#e8843a','SE Asia':'#e05c6e','Oceania':'#3b8fd4'
  };
  const REGION_FULL = {
    'N America':'NORTH AMERICA','S America':'SOUTH AMERICA','Europe':'EUROPE',
    'Africa':'AFRICA','Mid East':'MIDDLE EAST','SE Asia':'ASIA','Oceania':'OCEANIA'
  };
  // If we arrived from a city modal, pre-select that city and expand its region
  if (_negPreselectCity) {
    const _pci = CITIES[_negPreselectCity];
    if (_pci) {
      _negPending = _negPreselectCity;
      _negOpen[_pci.region] = true;
    }
    _negPreselectCity = null;
  }
  const all = Object.entries(CITIES)
    .filter(([c]) => !STATE.hubs.includes(c))
    .filter(([,ci]) => _negRegion === 'ALL' || ci.region === _negRegion)
    .sort((a,b) => (b[1].econ + b[1].tourism) - (a[1].econ + a[1].tourism));
  const active    = all.filter(([c]) => STATE.negotiating[c]);
  const withRoute = all.filter(([c]) => !STATE.negotiating[c] && STATE.routes.some(r=>r.from===c||r.to===c));
  const rest      = all.filter(([c]) => !STATE.negotiating[c] && !STATE.routes.some(r=>r.from===c||r.to===c));

  // Reuse the authoritative city-card artwork used by the setup hub cards.
  function cityTile(c, ci) {
    return `<div class="neg-city-card-image">${aeCityThumbSVG(c, ci.region)}</div>`;
  }

  const ICN = {
    econ: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M14.4 9.2a2.6 2 0 0 0-4.8.8c0 1.3 1.1 1.7 2.4 2.2s2.4.9 2.4 2.2a2.6 2 0 0 1-4.8.8M12 7v10"/></svg>',
    tour: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="12.5" r="3.3"/></svg>',
    pop:  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.1"/><path d="M3.6 19c0-3 2.4-5 5.4-5s5.4 2 5.4 5"/><path d="M16 5.6a3 3 0 0 1 0 5.2M16.6 14.3c2.3.5 3.8 2.2 3.8 4.7"/></svg>',
  };

  function statPill(icon, color, label, value, frac) {
    const w = Math.round(Math.min(100, Math.max(4, frac*100)));
    return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:9px 10px 10px;min-width:0">
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:7px;min-width:0">
        <span style="width:20px;height:20px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;background:${color}22;border:1px solid ${color}55;color:${color}">${icon}</span>
        <span style="font-size:8.5px;letter-spacing:.2px;color:var(--muted2);font-weight:700;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</span>
      </div>
      <div style="font-size:18.1px;font-weight:800;color:var(--text);font-family:'DM Mono';line-height:1;margin-bottom:6px">${value}</div>
      <div style="height:4px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden"><div style="height:100%;width:${w}%;background:${color};border-radius:3px"></div></div>
    </div>`;
  }

  function cityCard([c, ci], idx) {
    const cost = Math.round((ci.econ + ci.tourism) * 0.25 + 4);
    const estRev = Math.round((ci.econ + ci.tourism) * 0.25 + ci.pop * 0.5);
    const neg = STATE.negotiating[c];
    const hasRoute = STATE.routes.some(r=>r.from===c||r.to===c);
    const canAfford = STATE.cash >= cost;
    const frozen = STATE.slotFreeze?.[c];
    const demandBoost = Math.round((ci.econ + ci.tourism) / 40);
    const rc = REGION_COLORS[ci.region] || 'var(--border2)';
    const regionFull = REGION_FULL[ci.region] || ci.region.toUpperCase();
    const routeCount = STATE.routes.filter(r=>r.from===c||r.to===c).length;
    const negPct = neg===1?100:neg===2?60:neg===3?25:0;
    const borderColor = neg ? 'rgba(167,137,255,0.45)' : frozen ? 'rgba(244,63,94,0.3)' : hasRoute ? 'rgba(167,137,255,0.22)' : 'var(--border)';
    const bgColor = neg ? 'rgba(167,137,255,0.05)' : hasRoute ? 'rgba(167,137,255,0.03)' : 'var(--bg2)';

    let footerBlock;
    if (neg) {
      footerBlock = `<div style="margin-top:11px">
        <div style="margin-bottom:5px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:10.7px;color:var(--muted2)">Negotiation progress</span>
          <span style="font-size:11.3px;color:#fff;font-weight:700">${neg} month${neg!==1?'s':''} remaining</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${negPct}%;background:linear-gradient(90deg,var(--accent),rgba(167,137,255,0.6));border-radius:3px;transition:width .5s"></div>
        </div></div>`;
    } else if (frozen) {
      footerBlock = `<div style="margin-top:11px;font-size:11.9px;color:var(--loss);padding:5px 0">🚫 Landing slots blocked — competition or regulatory freeze</div>`;
    } else if (_negPending === c) {
      footerBlock = `<div style="margin-top:11px;background:rgba(255,207,90,0.08);border:1px solid rgba(255,207,90,0.45);border-radius:10px;padding:11px 13px">
        <div style="font-size:13px;font-weight:700;color:var(--accent2);margin-bottom:6px">Confirm — send a manager to ${c}?</div>
        <div style="font-size:11.3px;color:var(--muted);line-height:1.7;margin-bottom:10px">
          Cost: <b style="color:var(--warn)">$${cost}M</b> (you have $${STATE.cash.toFixed(0)}M) · Duration: <b style="color:var(--text)">1–3 months</b><br>
          Effect: <b style="color:var(--accent2)">+${demandBoost}% load</b> on all your ${c} routes once the deal closes${hasRoute?'':' — open a route here to benefit immediately'}.
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button class="action-btn success" style="padding:9px;font-size:12.4px" onclick="negotiate('${c}',${cost})">✓ CONFIRM — $${cost}M</button>
          <button class="action-btn" style="padding:9px;font-size:12.4px" onclick="negCancel()">✕ CANCEL</button>
        </div></div>`;
    } else {
      footerBlock = `<button style="width:100%;margin-top:11px;padding:14px;border-radius:11px;font-family:'Inter';font-size:14.1px;font-weight:800;letter-spacing:1px;border:1px solid;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px;
          ${canAfford
            ? `background:linear-gradient(135deg,rgba(63,143,212,0.28),rgba(63,143,212,0.1));border-color:rgba(63,143,212,0.55);color:#86c4f5;cursor:pointer`
            : `background:rgba(255,255,255,0.03);border-color:var(--border);color:var(--muted);opacity:0.55`}"
          ${canAfford ? `onclick="negAsk('${c}')"` : 'disabled'}>
          ${canAfford ? `🤝 Send Manager to ${c.toUpperCase()} <span style="margin-left:auto;font-size:18.1px">›</span>` : `Need $${(cost-STATE.cash).toFixed(0)}M more to send manager`}
        </button>`;
    }

    const statusChip = frozen
      ? `<span style="font-size:10.2px;background:rgba(244,63,94,0.15);color:var(--loss);padding:3px 7px;border-radius:5px;font-weight:700">🚫 FROZEN</span>`
      : neg
      ? `<span style="font-size:10.2px;background:rgba(167,137,255,0.15);color:#fff;padding:3px 7px;border-radius:5px;font-weight:700">⏳ ACTIVE</span>`
      : `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10.7px;background:rgba(63,143,212,0.14);color:#86c4f5;padding:3px 8px;border-radius:5px;font-weight:700">✈ ${routeCount} ROUTE${routeCount!==1?'S':''}</span>`;
    const loadBadge = `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11.9px;font-weight:800;color:var(--profit);background:rgba(78,234,170,0.12);border:1px solid rgba(78,234,170,0.3);border-radius:6px;padding:3px 8px;line-height:1">↗ +${demandBoost}% LOAD</span>`;

    return `<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:13px;margin-bottom:11px;overflow:hidden;transition:border-color .15s">
      <div style="position:relative;height:136px;border-bottom:1px solid var(--border)">${cityTile(c, ci)}
        <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 48%,${bgColor})"></div>
      </div>
      <div style="padding:13px 15px;min-width:0">
        <div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:120px">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px">
              <span style="font-size:19.2px;font-weight:800;color:var(--text);letter-spacing:.3px;line-height:1">${c.toUpperCase()}</span>
              ${statusChip}
            </div>
            <div style="font-size:11.3px;color:var(--muted2)">
              <span style="color:${rc};font-weight:700;letter-spacing:.3px">📍 ${regionFull}</span> · ${ci.slots} SLOTS
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="margin-bottom:5px">${loadBadge}</div>
            <div style="font-size:22.6px;font-weight:800;color:var(--profit);font-family:'DM Mono';line-height:1">$${estRev}M</div>
            <div style="font-size:9px;letter-spacing:.6px;color:var(--muted2);font-weight:700;margin-top:2px">EST. REVENUE / WK</div>
            <div style="font-size:10.7px;color:var(--muted);margin-top:6px;display:flex;align-items:center;justify-content:flex-end;gap:4px">📅 1–3 MONTHS</div>
          </div>
        </div>
        <details class="neg-city-extras">
          <summary aria-label="Toggle ${c} negotiation details">
            <span class="neg-city-extras-chevron" aria-hidden="true">&#8250;</span>
          </summary>
          <div class="neg-city-extras-content">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
              ${statPill(ICN.econ, '#e8b04a', 'Economy', Math.round(ci.econ), ci.econ/100)}
              ${statPill(ICN.tour, 'var(--purple)', 'Tourism', Math.round(ci.tourism), ci.tourism/100)}
              ${statPill(ICN.pop, 'var(--profit)', 'Population', ci.pop+'M', ci.pop/20)}
            </div>
            ${footerBlock}
          </div>
        </details>
      </div>
    </div>`;
  }

  const section = (title, items, color='var(--muted2)') => items.length
    ? `<div style="font-size:11.3px;letter-spacing:2px;color:${color};text-transform:uppercase;font-weight:700;margin:14px 0 8px;display:flex;align-items:center;gap:8px">
        ${title} <span style="font-size:10.2px;background:rgba(255,255,255,0.07);padding:1px 7px;border-radius:10px;color:var(--muted)">${items.length}</span>
       </div>${items.map((item,i)=>cityCard(item,i)).join('')}`
    : '';

  const cashColor = STATE.cash < 20 ? 'var(--loss)' : STATE.cash < 100 ? 'var(--warn)' : 'var(--accent2)';
  const homeRegion = CITIES[STATE.homeBase] ? CITIES[STATE.homeBase].region : null;
  // group available (non-active) cities by region into collapsible, themed sections
  const avail = all.filter(([c]) => !STATE.negotiating[c]);
  const byRegion = {};
  avail.forEach(item => { const reg=item[1].region; (byRegion[reg]=byRegion[reg]||[]).push(item); });
  Object.values(byRegion).forEach(list => list.sort((a,b)=>{
    const ar=STATE.routes.some(r=>r.from===a[0]||r.to===a[0])?0:1;
    const br=STATE.routes.some(r=>r.from===b[0]||r.to===b[0])?0:1;
    if(ar!==br) return ar-br;
    return (b[1].econ+b[1].tourism)-(a[1].econ+a[1].tourism);
  }));
  const regionOrder = Object.keys(byRegion).sort((a,b)=>{
    const an=a==='N America'?0:1, bn=b==='N America'?0:1; if(an!==bn) return an-bn;
    const ah=a===homeRegion?0:1, bh=b===homeRegion?0:1; if(ah!==bh) return ah-bh;
    return byRegion[b].length - byRegion[a].length;
  });
  const groupsHtml = regionOrder.map(reg=>{
    const list=byRegion[reg]; const rc=REGION_COLORS[reg]||'var(--border2)';
    const open=_negOpen[reg]!==undefined ? _negOpen[reg] : (reg===homeRegion);
    const yr=list.filter(([c])=>STATE.routes.some(r=>r.from===c||r.to===c)).length;
    const subs = SUBREGIONS[reg]||[];
    const activeSub = _negSubregion[reg]||null;
    const visibleSubs = subs.filter(s => list.some(([cn,ci])=>{
      for(const s2 of subs) if(s2.test(ci.lat,ci.lon,cn)) return s2.key===s.key;
      return false;
    }));
    const subTabsHtml = visibleSubs.length>1 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
      ${[{key:null,label:'All'},...visibleSubs].map(s=>`<div class="region-tab ${s.key===activeSub?'active':''}" style="font-size:11.3px;padding:3px 8px" onclick="event.stopPropagation();setNegSubregion('${reg}',${s.key===null?'null':"'"+s.key+"'"})">${s.label}</div>`).join('')}
    </div>` : '';
    const filteredList = activeSub ? list.filter(([cn,ci])=>{
      for(const s of subs) if(s.test(ci.lat,ci.lon,cn)) return s.key===activeSub;
      return false;
    }) : list;
    return `<div style="margin-bottom:9px;border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <div onclick="negToggleRegion('${reg}',${open})" style="display:flex;align-items:center;gap:9px;padding:11px 13px;cursor:pointer;border-left:3px solid ${rc};background:${open?'rgba(255,255,255,0.03)':'transparent'}">
        <span style="display:inline-block;transform:rotate(${open?90:0}deg);transition:transform .15s;color:${rc};font-size:16.9px;font-weight:700;line-height:1">\u203a</span>
        <span style="font-size:14.7px;font-weight:800;color:var(--text);letter-spacing:.4px">${REGION_FULL[reg]||reg.toUpperCase()}</span>
        ${yr?`<span style="font-size:10.2px;background:rgba(167,137,255,0.12);color:#fff;padding:1px 6px;border-radius:4px;font-weight:700">\u2708 ${yr}</span>`:''}
        <span style="margin-left:auto;font-size:11.3px;color:var(--muted2);background:rgba(255,255,255,0.06);padding:2px 9px;border-radius:10px">${list.length} cit${list.length!==1?'ies':'y'}</span>
      </div>
      ${open?`<div style="padding:10px 12px 3px">${subTabsHtml}${filteredList.map((item,i)=>cityCard(item,i)).join('')}</div>`:''}
    </div>`;
  }).join('');
  return modalHead('🤝 SLOT NEGOTIATIONS') + `<div class="modal-body">
    <div style="display:flex;gap:10px;margin:0 0 16px;align-items:stretch">
      <div style="flex:1;background:rgba(167,137,255,0.05);border:1px solid rgba(167,137,255,0.18);border-radius:11px;padding:14px 16px;font-size:13.6px;color:var(--muted);line-height:1.7;display:flex;align-items:center;gap:11px">
        <span style="font-size:22.6px;flex-shrink:0">ℹ️</span>
        <span>Secure landing slots to boost load factors on your routes. Each city manager takes <b style="color:#fff">1\u20133 months</b> to close the deal.</span>
      </div>
      <div style="background:linear-gradient(160deg,rgba(255,207,90,0.1),rgba(255,207,90,0.03));border:1px solid rgba(255,207,90,0.3);border-radius:11px;padding:14px 20px;text-align:center;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;min-width:140px">
        <div style="font-size:11.3px;color:var(--accent2);letter-spacing:1.5px;margin-bottom:6px;font-weight:700">AVAILABLE FUNDS</div>
        <div style="font-size:24.9px;font-weight:800;color:${cashColor};font-family:'DM Mono';line-height:1">${STATE.cash.toFixed(0)}M</div>
      </div>
    </div>
    ${_negDone ? `<div style="background:rgba(78,234,170,0.08);border:1px solid rgba(78,234,170,0.4);border-radius:8px;padding:10px 13px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:10px">
      <div style="font-size:11.9px;color:var(--profit);line-height:1.6"><b>\u2713 Manager dispatched to ${_negDone.city}</b> \u2014 $${_negDone.cost}M paid. Negotiation closes in <b>${_negDone.months} month${_negDone.months!==1?'s':''}</b>; track it under "In Progress" below.</div>
      <span onclick="_negDone=null;negRerender()" style="color:var(--muted);font-size:14.7px;flex-shrink:0;padding:0 3px">\u2715</span>
    </div>` : ''}
    ${section('\u23f3 In Progress', active, 'var(--accent)')}
    ${regionOrder.length ? `<div style="display:flex;align-items:center;gap:10px;margin:18px 0 11px"><span style="font-size:13.6px;letter-spacing:2px;color:var(--text);text-transform:uppercase;font-weight:800">🌐 Cities by Region</span><span style="flex:1;height:1px;background:linear-gradient(90deg,var(--border),transparent)"></span><span style="font-size:11.3px;color:var(--accent2);background:rgba(255,207,90,0.1);border:1px solid rgba(255,207,90,0.25);padding:3px 11px;border-radius:14px;font-weight:700">${avail.length} CITIES</span></div>${groupsHtml}` : ''}
    ${!active.length && !regionOrder.length ? `<div style="color:var(--muted);font-size:12.4px;text-align:center;padding:20px">All non-hub cities already covered.</div>` : ''}
    <div style="display:flex;align-items:center;gap:12px;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:9px;color:var(--muted);font-size:12.4px;line-height:1.5;flex:1;min-width:200px">
        <span style="color:var(--accent2);font-size:15.8px;flex-shrink:0">⭐</span>
        <span>Slot values fluctuate based on demand, competition, and route performance.</span>
      </div>
      <button class="uk-btn uk-btn--secondary" style="flex-shrink:0;font-size:12.4px" onclick="openSlotHistory()">📊 VIEW SLOT HISTORY</button>
    </div>
  </div>`;
}
let _negPending = null, _negDone = null;
function openSlotHistory(){
  const hist = STATE.slotHistory || [];
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rows = hist.length ? hist.map(h => {
    const when = (h.month!=null ? MN[(h.month-1+12)%12]+' ' : '') + (h.year||'');
    const closed = h.status === 'closed';
    const color = closed ? 'var(--profit)' : 'var(--accent)';
    const label = closed ? '✓ SLOTS SECURED' : '⏳ MANAGER DISPATCHED';
    return `<div style="display:flex;align-items:center;gap:11px;padding:11px 13px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--bg2)">
      <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;box-shadow:0 0 8px ${color}"></span>
      <div style="flex:1;min-width:0">
        <div style="font-size:14.7px;font-weight:700;color:var(--text)">${h.city}</div>
        <div style="font-size:11.3px;color:${color};font-weight:700;letter-spacing:.4px;margin-top:2px">${label}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:12.4px;color:var(--muted);font-family:'DM Mono'">${when||'—'}</div>
        ${h.cost?`<div style="font-size:11.3px;color:var(--muted2);margin-top:2px">$${h.cost}M</div>`:''}
      </div>
    </div>`;
  }).join('') : `<div style="text-align:center;color:var(--muted);font-size:13.6px;padding:40px 20px;line-height:1.7">No slot deals yet.<br><span style="font-size:12.4px;color:var(--muted2)">Dispatch a manager to a city and your negotiation history will appear here.</span></div>`;
  const mc = document.getElementById('modal-content'); if (!mc) return;
  mc.innerHTML = modalHead('📊 SLOT HISTORY') + `<div class="modal-body">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px">
      <button class="uk-btn uk-btn--ghost" style="font-size:13.6px" onclick="negRerender()">‹ Back to Negotiations</button>
      <span style="font-size:11.3px;color:var(--muted2);letter-spacing:1px;font-weight:700">${hist.length} RECORD${hist.length!==1?'S':''}</span>
    </div>${rows}</div>`;
}
function negRerender(){
  const mc = document.getElementById('modal-content'); if (!mc) return;
  const body = mc.querySelector('.modal-body');
  const scroll = body ? body.scrollTop : 0;
  mc.innerHTML = buildNegotiations();
  const nb = mc.querySelector('.modal-body');
  if (nb) nb.scrollTop = scroll;
}
function negAsk(c){ _negPending = c; _negDone = null; negRerender(); }
function negCancel(){ _negPending = null; negRerender(); }
function negToggle(c){ if(STATE.negotiating[c]||STATE.slotFreeze?.[c]) return; const ci=CITIES[c]; const cost=Math.round((ci.econ+ci.tourism)*0.25+4); if(STATE.cash<cost) return; _negPending=(_negPending===c?null:c); negRerender(); }
function negotiate(c,cost){
  if(STATE.cash<cost) return showFlash(`⚠ Need $${cost}M`);
  if(STATE.negotiating[c]) return showFlash('Already negotiating');
  if(STATE.slotFreeze?.[c]) return showFlash(`🚫 Slot freeze at ${c}`);
  if(!spendAction('Slot negotiation')) return;
  STATE.cash-=cost;
  const months = 1+Math.floor(Math.random()*3);
  STATE.negotiating[c]=months;
  (STATE.slotHistory = STATE.slotHistory || []).unshift({ city: c, month: STATE.month, year: STATE.year, status: 'dispatched', cost });
  if (STATE.slotHistory.length > 40) STATE.slotHistory.length = 40;
  _negPending = null;
  _negDone = { city:c, cost, months };
  addEvent('neutral',`Manager sent to negotiate slots in ${c}`);
  showFlash(`✓ Manager dispatched to ${c}`);
  updateUI(); negRerender();
}
function budgetBreakdown(){
  const inc=[], exp=[];
  let rRev=0, rCost=0;
  (STATE.routes||[]).forEach(r=>{ const res=processRoute(r); rRev+=res.revenue||0; rCost+=res.cost||0; });
  if((STATE.routes||[]).length){ inc.push(['Route revenue', rRev]); exp.push(['Route operating cost', rCost]); }
  const cargo=(STATE.cargoRoutes||[]).reduce((s,cr)=>s+(cr.profit||0),0);
  if((STATE.cargoRoutes||[]).length) inc.push(['Cargo routes (net)', cargo]);
  const bizBoost = 1 + (typeof execBonus==='function'?execBonus('cfo','bizBoost'):0);
  let biz=0; Object.entries(STATE.businesses||{}).forEach(([k,b])=> biz += (b.income||0)*ventureAdMult(k)/3 );
  biz*=bizBoost;
  if(Object.keys(STATE.businesses||{}).length) inc.push(['Business ventures', biz]);
  let invInc=0;
  Object.values(STATE.cityInvestments||{}).forEach(bld=>{ (typeof CITY_BUILDINGS!=='undefined'?CITY_BUILDINGS:[]).forEach(def=>{ const lv=(bld[def.id]||{}).level||0; if(def.passiveIncome&&lv>0) invInc+=def.passiveIncome*lv; }); });
  if(invInc>0.001) inc.push(['City investments', invInc]);
  let spon=0; Object.values(STATE.sponsorships||{}).forEach(sp=>{ if(sp.monthsLeft>0 && sp.monthlyReturn>0) spon+=sp.monthlyReturn; });
  if(spon>0.001) inc.push(['Sponsorship returns', spon]);
  exp.push(['Department spending', ((STATE.budget.repair-1)+(STATE.budget.ad-1)+(STATE.budget.service-1))*0.09]);
  if(STATE.hubs.length>1) exp.push(['Hub overhead', (STATE.hubs.length-1)*1.2]);
  const interest = (typeof loanGrossInterest==='function'?loanGrossInterest():0) * (1 - (typeof execBonus==='function'?execBonus('cfo','interestCut'):0));
  if(interest>0.001) exp.push(['Loan interest', interest]);
  const salary = (typeof boardSalary==='function'?boardSalary():0);
  if(salary>0.001) exp.push(['Board salaries', salary]);
  const ins = (typeof maintInsuranceCostPerMonth==='function'?maintInsuranceCostPerMonth():0);
  if(ins>0.001) exp.push(['Maintenance insurance', ins]);
  const incTot=inc.reduce((s,x)=>s+x[1],0), expTot=exp.reduce((s,x)=>s+x[1],0);
  return {inc, exp, incTot, expTot, net:incTot-expTot};
}
function buildBudgetLegacy(){
  const lvls=['LEAN','BASIC','SOLID','STRONG','MAXIMUM'];
  const rows=[{k:'repair',l:'Maintenance',d:'Slider 1 = lean baseline (free). Above 1: slows fleet wear. +$0.09M/mo per step.'},{k:'ad',l:'Advertising',d:'Slider 1 = baseline (free). Above 1: boosts demand ~4.5% per step. +$0.09M/mo per step.'},{k:'service',l:'Service',d:'Slider 1 = baseline (free). Above 1: boosts demand ~5% per step. +$0.09M/mo per step.'}];
  const bd=budgetBreakdown();
  const fmt=v=>`${v<0?'-':''}$${Math.abs(v).toFixed(1)}M`;
  const line=(l,v,col)=>`<div style="display:flex;justify-content:space-between;padding:4px 12px;font-size:11.3px"><span style="color:var(--muted)">${l}</span><span style="color:${col};font-family:'DM Mono'">${fmt(v)}</span></div>`;
  const _cf=STATE._cashflow;
  const cfBlock = _cf ? `
    <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:9px;overflow:hidden;margin-bottom:10px">
      <div style="font-size:10.7px;letter-spacing:1px;color:#fff;padding:6px 12px 3px">LAST MONTH \u00b7 ACTUAL \u00b7 ${_cf.label}</div>
      <div style="font-size:10.2px;letter-spacing:1px;color:var(--profit);padding:2px 12px">INCOME</div>
      ${_cf.inc.map(([l,v])=>line(l,v,'var(--profit)')).join('')}
      <div style="font-size:10.2px;letter-spacing:1px;color:var(--loss);padding:5px 12px 2px;border-top:1px solid var(--border)">EXPENSES</div>
      ${_cf.exp.map(([l,v])=>line(l,-v,'var(--loss)')).join('')}
      <div style="display:flex;justify-content:space-between;padding:8px 12px;border-top:1px solid var(--border2);background:rgba(255,255,255,0.03)">
        <span style="font-size:12.4px;font-weight:700;color:var(--text)">Net change to cash</span>
        <span style="font-size:14.7px;font-weight:800;font-family:'DM Mono';color:${_cf.net>=0?'var(--profit)':'var(--loss)'}">${fmt(_cf.net)}</span>
      </div>
    </div>` : `<div style="font-size:11.3px;color:var(--muted);margin-bottom:10px;padding:9px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:9px">Play a month to see your actual cash flow itemised here \u2014 every line that moved your balance.</div>`;
  return modalHead('\ud83d\udcb0 BUDGET & CASH FLOW')+`<div class="modal-body">
    ${cfBlock}
    <div style="font-size:11.3px;color:var(--muted);margin-bottom:10px">\u2193 Projected next month \u2014 estimate across <b>every</b> revenue & cost stream \u2014 not just routes.</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:6px">
      <div style="font-size:10.7px;letter-spacing:1px;color:var(--profit);padding:6px 12px 3px">INCOME</div>
      ${bd.inc.map(([l,v])=>line(l,v,'var(--profit)')).join('')}
      <div style="display:flex;justify-content:space-between;padding:3px 12px;font-size:10.7px;border-top:1px dashed var(--border)"><span style="color:var(--muted2)">Total income</span><span style="color:var(--profit);font-family:'DM Mono';font-weight:700">${fmt(bd.incTot)}</span></div>
      <div style="font-size:10.7px;letter-spacing:1px;color:var(--loss);padding:8px 12px 3px;border-top:1px solid var(--border)">EXPENSES</div>
      ${bd.exp.map(([l,v])=>line(l,-v,'var(--loss)')).join('')}
      <div style="display:flex;justify-content:space-between;padding:3px 12px;font-size:10.7px;border-top:1px dashed var(--border)"><span style="color:var(--muted2)">Total expenses</span><span style="color:var(--loss);font-family:'DM Mono';font-weight:700">${fmt(-bd.expTot)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:8px 12px;border-top:1px solid var(--border2);background:rgba(255,255,255,0.025)">
        <span style="font-size:12.4px;font-weight:700;color:var(--text)">Net / month</span>
        <span style="font-size:14.7px;font-weight:800;font-family:'DM Mono';color:${bd.net>=0?'var(--profit)':'var(--loss)'}">${fmt(bd.net)}</span>
      </div>
    </div>
    <div style="font-size:10.2px;color:var(--muted2);margin-bottom:14px">Cash $${STATE.cash.toFixed(0)}M \u00b7 includes ventures, cargo, city investments & sponsorships.</div>
    <div style="font-size:10.7px;letter-spacing:1px;color:var(--muted2);margin-bottom:6px">DEPARTMENT SPENDING \u2014 affects performance</div>
    ${rows.map(r=>`<div class="form-row"><label class="form-label" id="bl-${r.k}">${r.l}: <span style="color:#fff">${lvls[STATE.budget[r.k]-1]}</span></label>
    <div style="font-size:10.7px;color:var(--muted);margin-bottom:4px">${r.d}</div>
    <input type="range" min="1" max="5" value="${STATE.budget[r.k]}" oninput="STATE.budget['${r.k}']=+this.value;document.getElementById('bl-${r.k}').innerHTML='${r.l}: <span style=color:#fff>'+['LEAN','BASIC','SOLID','STRONG','MAXIMUM'][+this.value-1]+'</span>'"></div>`).join('')}
    <div style="display:flex;gap:8px">
      <button class="action-btn" style="flex:1" onclick="updateUI();document.getElementById('modal-content').innerHTML=buildBudget()">RECALC \u21bb</button>
      <button class="action-btn gold" style="flex:1" onclick="updateUI();closeModal()">DONE \u2713</button>
    </div></div>`;
}

function buildBudget(){
  const lvls=['LEAN','BASIC','SOLID','STRONG','MAXIMUM'];
  const rows=[
    {k:'repair',l:'Maintenance',tag:'Fleet reliability',glyph:'⚙',d:'Slows fleet wear and reduces maintenance pressure.'},
    {k:'ad',l:'Advertising',tag:'Market demand',glyph:'⌁',d:'Builds awareness and raises route demand by about 4.5% per step.'},
    {k:'service',l:'Service',tag:'Passenger experience',glyph:'✦',d:'Improves passenger appeal and raises demand by about 5% per step.'}
  ];
  const bd=budgetBreakdown();
  const fmt=v=>`${v<0?'-':''}$${Math.abs(v).toFixed(1)}M`;
  const ledgerLine=(l,v,tone)=>`<div class="bf-ledger-row"><span>${l}</span><b class="${tone}">${fmt(v)}</b></div>`;
  const _cf=STATE._cashflow;
  const deptSpend=((STATE.budget.repair-1)+(STATE.budget.ad-1)+(STATE.budget.service-1))*0.09;
  const netTone=bd.net>=0?'positive':'negative';
  const actualBlock=_cf ? `
    <div class="bf-ledger-group income"><div class="bf-ledger-label">Income</div>${_cf.inc.map(([l,v])=>ledgerLine(l,v,'positive')).join('')||ledgerLine('No income recorded',0,'muted')}</div>
    <div class="bf-ledger-group expense"><div class="bf-ledger-label">Expenses</div>${_cf.exp.map(([l,v])=>ledgerLine(l,-v,'negative')).join('')||ledgerLine('No expenses recorded',0,'muted')}</div>
    <div class="bf-ledger-total"><span>Net cash movement</span><b class="${_cf.net>=0?'positive':'negative'}">${fmt(_cf.net)}</b></div>` : `
    <div class="bf-empty-state"><span class="bf-empty-glyph">◷</span><b>First statement pending</b><p>Complete one month to generate an itemised operational cashflow statement.</p></div>`;
  const projectedIncome=bd.inc.map(([l,v])=>ledgerLine(l,v,'positive')).join('')||ledgerLine('No active revenue streams',0,'muted');
  const projectedExpense=bd.exp.map(([l,v])=>ledgerLine(l,-v,'negative')).join('')||ledgerLine('No active expenses',0,'muted');
  return modalHead('FINANCE COMMAND · BUDGET & CASHFLOW')+`<div class="bf-shell"><div class="modal-body bf-body">
    <div class="bf-hero">
      <div><div class="bf-eyebrow">FINANCIAL OPERATIONS</div><div class="bf-hero-title">Capital control center</div><div class="bf-hero-sub">Monitor monthly movement, projected exposure, and department allocations.</div></div>
      <div class="bf-reserve"><span>Available cash</span><b>$${STATE.cash.toFixed(0)}M</b><small>LIQUID RESERVE</small></div>
    </div>
    <div class="bf-kpi-grid">
      <div class="bf-kpi"><span>Projected income</span><b class="positive">${fmt(bd.incTot)}</b><small>ALL REVENUE STREAMS</small></div>
      <div class="bf-kpi"><span>Operating outflow</span><b class="negative">${fmt(-bd.expTot)}</b><small>NEXT MONTH</small></div>
      <div class="bf-kpi emphasis ${netTone}"><span>Net position</span><b>${fmt(bd.net)}</b><small>${bd.net>=0?'POSITIVE CASHFLOW':'CASH BURN'}</small></div>
      <div class="bf-kpi"><span>Department spend</span><b>${fmt(-deptSpend)}</b><small>MONTHLY ALLOCATION</small></div>
    </div>
    <div class="bf-ledger-grid">
      <section class="bf-panel">
        <div class="bf-panel-head"><div><span>ACTUAL STATEMENT</span><b>${_cf?_cf.label:'AWAITING CLOSE'}</b></div><i class="${_cf&&_cf.net>=0?'positive':_cf?'negative':'muted'}">${_cf?(_cf.net>=0?'▲ CLOSED POSITIVE':'▼ CLOSED NEGATIVE'):'● NO DATA'}</i></div>
        <div class="bf-panel-body">${actualBlock}</div>
      </section>
      <section class="bf-panel">
        <div class="bf-panel-head"><div><span>PROJECTED CASHFLOW</span><b>NEXT MONTH</b></div><i class="${netTone}">${bd.net>=0?'▲ SURPLUS':'▼ DEFICIT'}</i></div>
        <div class="bf-panel-body">
          <div class="bf-ledger-group income"><div class="bf-ledger-label">Income</div>${projectedIncome}<div class="bf-ledger-subtotal"><span>Total income</span><b class="positive">${fmt(bd.incTot)}</b></div></div>
          <div class="bf-ledger-group expense"><div class="bf-ledger-label">Expenses</div>${projectedExpense}<div class="bf-ledger-subtotal"><span>Total expenses</span><b class="negative">${fmt(-bd.expTot)}</b></div></div>
          <div class="bf-ledger-total"><span>Net / month</span><b class="${netTone}">${fmt(bd.net)}</b></div>
        </div>
      </section>
    </div>
    <section class="bf-department-panel">
      <div class="bf-section-head"><div><span>DEPARTMENT ALLOCATION</span><b>Performance controls</b></div><small>Each step above Lean costs $0.09M / month</small></div>
      <div class="bf-department-grid">
        ${rows.map(r=>{const val=STATE.budget[r.k];return `<div class="bf-dept-card">
          <div class="bf-dept-head"><span class="bf-dept-glyph">${r.glyph}</span><div><b>${r.l}</b><small>${r.tag}</small></div><span class="bf-tier" id="bl-${r.k}">${lvls[val-1]}</span></div>
          <p>${r.d}</p>
          <input aria-label="${r.l} budget" type="range" min="1" max="5" value="${val}" oninput="STATE.budget['${r.k}']=+this.value;document.getElementById('bl-${r.k}').textContent=['LEAN','BASIC','SOLID','STRONG','MAXIMUM'][+this.value-1]">
          <div class="bf-range-scale"><span>LEAN</span><span>MAXIMUM</span></div>
        </div>`;}).join('')}
      </div>
    </section>
    </div><div class="bf-actions">
      <span>Adjust allocations, then recalculate to update the projection.</span>
      <button class="uk-btn uk-btn--secondary" onclick="updateUI();document.getElementById('modal-content').innerHTML=buildBudget()">↻ RECALCULATE</button>
      <button class="uk-btn uk-btn--solid" onclick="updateUI();closeModal()">CONFIRM BUDGET ✓</button>
    </div></div>`;
}

function hubAccToggle(head){ if(head&&head.parentElement) head.parentElement.classList.toggle('open'); }
function buildHub(){
  if(STATE._noHubs) return modalHead('BUILD REGIONAL HUB')+`<div class="modal-body"><div style="color:var(--warn);padding:12px">Lone Hub challenge — new hubs are disabled.</div></div>`;
  const connected = Object.entries(CITIES).filter(([n,c]) =>
    c.major &&
    !STATE.hubs.includes(n) &&
    STATE.routes.some(r => r.to===n || r.from===n)
  );
  const unconnectedCount = Object.entries(CITIES).filter(([n,c]) =>
    c.major && !STATE.hubs.includes(n) && !STATE.routes.some(r=>r.to===n||r.from===n)
  ).length;
  function hubPrice(n, c) {
    const base = { 6:180, 5:120, 4:75, 3:45, 2:30, 1:20 }[c.level] || 60;
    const popMult = 1 + (c.pop - 2) * 0.04;
    const econMult = 1 + (c.econ - 60) * 0.008;
    return Math.round(base * popMult * econMult / 5) * 5; // round to $5M
  }
  if (!connected.length) {
    return modalHead('BUILD REGIONAL HUB') + `<div class="modal-body">
      <div style="background:rgba(255,200,0,0.07);border:1px solid var(--warn);border-radius:8px;padding:14px;text-align:center;margin-bottom:12px">
        <div style="font-size:15.8px;margin-bottom:6px">No connected cities eligible</div>
        <div style="font-size:11.9px;color:var(--muted);line-height:1.7">
          Fly a route to a major city first, then return here to establish a hub.
          ${unconnectedCount > 0 ? `<br>${unconnectedCount} major cities available once you open routes there.` : ''}
        </div>
      </div>
      <div style="font-size:11.3px;color:var(--muted2)">Current hubs: ${STATE.hubs.join(' · ')}</div>
    </div>`;
  }
  const cards = connected.map(([n,c]) => {
    const cost = hubPrice(n, c);
    const canAfford = STATE.cash >= cost;
    const gates = 16 + c.level * 2;
    const hubNum = STATE.hubs.filter(h => CITIES[h]?.region === c.region).length + 1;
    const yourRoutes = STATE.routes.filter(r=>r.to===n||r.from===n).length;
    return `<div class="hub-acc">
      <div class="hub-acc-head" onclick="hubAccToggle(this)">
        <span class="hub-acc-chev">›</span>
        <span class="hub-acc-city">${n}</span>
        <span class="hub-acc-num">Hub #${hubNum}</span>
        <span class="hub-acc-cost" style="color:${canAfford?'var(--warn)':'var(--loss)'}">$${cost}M</span>
      </div>
      <div class="hub-acc-body">
        <div style="font-size:10.7px;color:var(--muted);margin-bottom:4px">
          ${c.region} · Level ${c.level} · Pop ${c.pop}M · ${yourRoutes} route${yourRoutes!==1?'s':''} here · one-time cost
        </div>
        <div style="font-size:11.3px;color:#fff;margin-bottom:9px">
          ${gates} gates · Unlocks routes from ${n} across ${c.region}
        </div>
        <button class="action-btn${canAfford?' success':' danger'}" style="width:100%;padding:8px"
          ${canAfford?`onclick="tapConfirm(this,()=>{doBuildHub('${n}',${cost})},'Tap to confirm')"`:' disabled'}>
          ${canAfford ? `🏗 Establish Hub in ${n}` : `Need $${(cost-STATE.cash).toFixed(0)}M more`}
        </button>
      </div>
    </div>`;
  }).join('');
  return modalHead('🏗 BUILD REGIONAL HUB') + `<div class="modal-body">
    <div style="font-size:11.9px;color:var(--muted);margin-bottom:14px;line-height:1.7">
      Hubs unlock routes from that city. Only cities you already fly to are eligible.
      <br>Cash: <b style="color:var(--accent2)">$${STATE.cash.toFixed(0)}M</b>
      ${unconnectedCount ? ` · <span style="color:var(--muted2)">${unconnectedCount} more major cities need a route first</span>` : ''}
    </div>
    ${cards}
  </div>`;
}
function doBuildHub(n,cost){
  if(STATE._noHubs) return showFlash('⚠ Lone Hub challenge — new hubs are disabled');
  if(STATE.cash<cost) return showFlash(`⚠ Need $${cost}M`);
  if(STATE.hubs.includes(n)) return;
  STATE.cash-=cost; STATE.hubs.push(n);
  addEvent('good',`New hub built in ${n}! ${CITIES[n].region} expansion unlocked.`);
  showFlash(`✓ Hub established in ${n}`);
  flashRegionTab(CITIES[n].region);
  updateUI(); renderMap(); renderHubsList(); renderGoalProgress(); closeModal();
}
// ── Loan model: tranche-based, backward-compatible with legacy STATE.loan ──
const LOAN_BASE = {
  starter:   { name:'Founder Facility',      icon:'🌱', base:0.0022, cap:300,      minDraw:10,  blurb:'One-time low-rate line for first-time founders. No risk premium.' },
  standard:  { name:'Standard Credit Line',  icon:'🏦', base:0.0035, cap:Infinity, minDraw:10,  blurb:'Everyday working capital. Draw up to your credit limit.' },
  expansion: { name:'Expansion Loan',        icon:'🚀', base:0.0048, cap:Infinity, minDraw:200, blurb:'Large draws for fleet & hub growth. Higher rate.' },
  bridge:    { name:'Bridge Loan',           icon:'⚡', base:0.0072, cap:250,      minDraw:10,  blurb:'Fast cash, steep rate — repay quickly.' },
};
function ensureLoans(){
  if (!Array.isArray(STATE.loans)) {
    STATE.loans = (STATE.loan>0)
      ? [{ id:'standard', name:'Standard Credit Line', icon:'🏦', principal:STATE.loan, rate:0.0035, opened:STATE._absMonth||0 }]
      : [];
  }
}
function loanTotal(){ ensureLoans(); return STATE.loans.reduce((s,t)=>s+t.principal,0); }
function syncLoan(){ STATE.loan = Math.round(loanTotal()); }
function loanGrossInterest(){ ensureLoans(); return STATE.loans.reduce((s,t)=>s+t.principal*t.rate,0); }
function blendedMonthlyRate(){ const t=loanTotal(); return t>0 ? loanGrossInterest()/t : 0; }
function aprFromMonthly(m){ return (Math.pow(1+m,12)-1)*100; }
function loanHeadroom(){ return Math.max(0,(STATE.maxLoan||0)-loanTotal()); }
function loanRiskPremium(){
  const v = Math.max(1, STATE.companyValue||1);
  return Math.min(0.003, Math.max(0, loanTotal()/v)*0.004);
}
function loanOffers(){
  const prem = loanRiskPremium(), head = loanHeadroom();
  const out = [];
  for (const k of ['starter','standard','expansion','bridge']) {
    const p = LOAN_BASE[k];
    if (k==='starter' && (STATE._starterLoanUsed || loanTotal()>=p.cap)) continue;
    const rate = p.base + (k==='starter' ? 0 : prem); // founder rate shielded from premium
    const cap  = Math.floor(Math.min(head, p.cap===Infinity ? head : p.cap));
    out.push({ id:k, name:p.name, icon:p.icon, blurb:p.blurb, rate, apr:aprFromMonthly(rate), cap, minDraw:p.minDraw, first:k==='starter' });
  }
  return out;
}
function drawLoan(id){
  ensureLoans();
  const offer = loanOffers().find(o=>o.id===id);
  if(!offer) return showFlash('⚠ Facility unavailable right now');
  let amt = Math.round((+val('loan-amt')||0)/10)*10;
  if(amt < offer.minDraw)   return showFlash(`⚠ ${offer.name} minimum draw is $${offer.minDraw}M`);
  if(amt > loanHeadroom())  return showFlash(`⚠ Over credit limit — $${Math.floor(loanHeadroom())}M headroom left`);
  if(amt > offer.cap)       return showFlash(`⚠ ${offer.name} caps at $${offer.cap}M right now`);
  const existing = STATE.loans.find(t=>t.id===id);
  if(existing){ const np=existing.principal+amt; existing.rate=(existing.rate*existing.principal+offer.rate*amt)/np; existing.principal=np; }
  else STATE.loans.push({ id, name:offer.name, icon:offer.icon, principal:amt, rate:offer.rate, opened:STATE._absMonth||0 });
  if(id==='starter') STATE._starterLoanUsed = true;
  STATE.cash += amt; syncLoan();
  addEvent('warn',`Drew $${amt}M on ${offer.name} @ ${(offer.rate*100).toFixed(2)}%/mo`);
  showFlash(`💵 +$${amt}M drawn`);
  updateUI(); document.getElementById('modal-content').innerHTML=buildBank();
}
function repayLoan(mode){
  ensureLoans();
  const tot = loanTotal();
  if(tot<=0) return showFlash('No debt to repay');
  let amt = mode==='q25' ? tot*0.25 : mode==='q50' ? tot*0.50 : mode==='full' ? tot : (+val('loan-amt')||0);
  amt = Math.min(Math.round(amt), Math.round(tot));
  if(amt<=0) return showFlash('⚠ Set a repayment amount');
  if(STATE.cash<amt) return showFlash(`⚠ Need $${amt}M cash (have $${Math.floor(STATE.cash)}M)`);
  STATE.cash -= amt;
  let rem = amt;
  STATE.loans.sort((a,b)=>b.rate-a.rate); // clear most expensive debt first
  for(const t of STATE.loans){ if(rem<=0) break; const pay=Math.min(t.principal,rem); t.principal-=pay; rem-=pay; }
  STATE.loans = STATE.loans.filter(t=>t.principal>0.5);
  syncLoan();
  addEvent('neutral',`Repaid $${amt}M of debt${loanTotal()<=0?' — debt-free':''}`);
  showFlash(`✓ −$${amt}M repaid`);
  updateUI(); document.getElementById('modal-content').innerHTML=buildBank();
}
function consolidateLoans(){
  ensureLoans();
  if(STATE.loans.length<2) return showFlash('Need 2+ loans to consolidate');
  const tot = loanTotal();
  const fee = Math.max(1, Math.round(tot*0.01));
  if(STATE.cash<fee) return showFlash(`⚠ Consolidation fee is $${fee}M`);
  const newRate = blendedMonthlyRate()*0.9; // 10% loyalty discount on the blend
  STATE.cash -= fee;
  STATE.loans = [{ id:'consolidated', name:'Consolidated Loan', icon:'🧾', principal:tot, rate:newRate, opened:STATE._absMonth||0 }];
  syncLoan();
  addEvent('good',`Consolidated all debt to one loan @ ${(newRate*100).toFixed(2)}%/mo (fee $${fee}M)`);
  showFlash('🧾 Loans consolidated');
  updateUI(); document.getElementById('modal-content').innerHTML=buildBank();
}
function buildBank(){
  if (typeof recalcCompanyValue==='function') recalcCompanyValue();
  ensureLoans();
  const cash = STATE.cash, tot = loanTotal(), head = loanHeadroom();
  const cfoCut = (typeof execBonus==='function') ? execBonus('cfo','interestCut') : 0;
  const grossInt = loanGrossInterest(), netInt = grossInt*(1-cfoCut);
  const blended = blendedMonthlyRate();
  const cv = STATE.companyValue||1;
  const ratio = tot/Math.max(1,cv);
  const ratioCol = ratio<0.4 ? 'var(--profit)' : ratio<0.7 ? 'var(--warn)' : 'var(--loss)';
  const offers = loanOffers();
  const def = (+val('loan-amt')||100);
  const sliderMax = Math.max(100, Math.ceil(Math.max(head, tot, 100)/10)*10);
  const sliderVal = Math.min(def, sliderMax);

  const statBox = (l,v,c) => `<div class="city-stat-box" style="flex:1;min-width:78px">
    <div class="csb-l">${l}</div><div class="csb-v" style="color:${c||'var(--text)'}">${v}</div></div>`;

  const offerCard = o => {
    const can = o.cap >= o.minDraw && head > 0;
    return `<div style="border:1px solid ${o.first?'rgba(78,234,170,0.4)':'var(--border)'};border-radius:9px;padding:9px 11px;margin-bottom:7px;background:${o.first?'rgba(78,234,170,0.05)':'var(--bg2)'}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="display:flex;align-items:center;gap:7px;min-width:0">
          <span style="font-size:16.9px;flex-shrink:0">${o.icon}</span>
          <div style="min-width:0">
            <div style="font-size:12.4px;font-weight:700;color:var(--text)">${o.name}${o.first?' <span style="font-size:10.2px;color:var(--profit);border:1px solid rgba(78,234,170,0.4);border-radius:3px;padding:1px 4px;letter-spacing:.5px">FIRST-TIME</span>':''}</div>
            <div style="font-size:10.7px;color:var(--muted2);line-height:1.35;margin-top:1px">${o.blurb}</div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:14.7px;font-weight:700;color:var(--accent2);font-family:'DM Mono'">${(o.rate*100).toFixed(2)}%<span style="font-size:10.2px;color:var(--muted2)">/mo</span></div>
          <div style="font-size:10.2px;color:var(--muted2)">${o.apr.toFixed(1)}% APR</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:7px;gap:8px">
        <span style="font-size:10.7px;color:var(--muted2)">avail $${o.cap}M · min $${o.minDraw}M</span>
        <button class="action-btn ${o.first?'success':'gold'}" style="width:auto;padding:5px 16px;font-size:11.3px;margin:0" ${can?'':'disabled'} onclick="drawLoan('${o.id}')">DRAW</button>
      </div>
    </div>`;
  };

  const trancheRows = STATE.loans.length ? STATE.loans.map(t=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-bottom:1px solid var(--border);font-size:11.3px">
      <span style="color:var(--muted)">${t.icon||'•'} ${t.name}</span>
      <span style="display:flex;gap:12px;align-items:center">
        <span style="color:var(--muted2);font-size:10.7px">${(t.rate*100).toFixed(2)}%/mo</span>
        <span style="color:var(--warn);font-family:'DM Mono'">−$${(t.principal*t.rate).toFixed(2)}M/mo</span>
        <span style="color:var(--loss);font-family:'DM Mono';font-weight:700;min-width:54px;text-align:right">$${Math.round(t.principal)}M</span>
      </span>
    </div>`).join('') : '';

  return modalHead('🏦 BANK / LOANS')+`<div class="modal-body">
    <!-- Credit summary -->
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">
      ${statBox('Cash', `$${Math.round(cash)}M`, cash>=0?'var(--profit)':'var(--loss)')}
      ${statBox('Total Debt', `$${Math.round(tot)}M`, tot>0?'var(--loss)':'var(--muted2)')}
      ${statBox('Credit Left', `$${Math.round(head)}M`, head>0?'var(--accent)':'var(--muted2)')}
      ${statBox('Interest/mo', `$${netInt.toFixed(2)}M`, netInt>0?'var(--warn)':'var(--muted2)')}
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">
      ${statBox('Blended Rate', tot>0?`${(blended*100).toFixed(2)}%/mo`:'—', 'var(--accent2)')}
      ${statBox('Blended APR', tot>0?`${aprFromMonthly(blended).toFixed(1)}%`:'—', 'var(--accent2)')}
      ${statBox('Credit Limit', `$${STATE.maxLoan}M`, 'var(--text)')}
      ${statBox('Company Value', `$${cv}M`, 'var(--purple)')}
    </div>
    <!-- Debt-to-value health bar -->
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;font-size:10.7px;color:var(--muted2);margin-bottom:3px">
        <span>DEBT / COMPANY VALUE</span><span style="color:${ratioCol}">${Math.round(ratio*100)}%</span>
      </div>
      <div style="position:relative;height:6px;border-radius:3px;background:var(--border)">
        <div style="height:6px;border-radius:3px;width:${Math.min(100,Math.round(ratio*100))}%;background:${ratioCol};transition:width .3s"></div>
        <div title="Comfort ceiling 60%" style="position:absolute;top:-2px;left:60%;width:2px;height:10px;background:var(--warn);border-radius:1px"></div>
      </div>
      <div style="font-size:10.2px;color:var(--muted2);margin-top:2px">amber line = 60% comfort ceiling · ${cfoCut>0?`CFO cutting interest ${Math.round(cfoCut*100)}%`:'hire a CFO to cut interest'}</div>
    </div>
    <!-- Amount control -->
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:10px 12px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <span style="font-size:11.3px;font-weight:700;color:var(--accent2);letter-spacing:1.2px">AMOUNT</span>
        <span style="font-size:18.1px;font-family:'DM Mono';color:var(--text)">$<span id="loan-v">${sliderVal}</span>M</span>
      </div>
      <input type="range" id="loan-amt" min="10" max="${sliderMax}" step="10" value="${sliderVal}" style="width:100%" oninput="document.getElementById('loan-v').textContent=this.value">
      <div style="display:flex;gap:6px;margin-top:7px">
        ${[100,250,500].map(q=>`<button class="action-btn" style="padding:4px 0;font-size:11.3px;margin:0;flex:1" onclick="var s=document.getElementById('loan-amt');s.value=Math.min(${q},${sliderMax});document.getElementById('loan-v').textContent=s.value">$${q}M</button>`).join('')}
        <button class="action-btn" style="padding:4px 0;font-size:11.3px;margin:0;flex:1" onclick="var s=document.getElementById('loan-amt');s.value=${sliderMax};document.getElementById('loan-v').textContent=s.value">MAX</button>
      </div>
    </div>
    <!-- Available facilities -->
    <div style="font-size:11.3px;font-weight:700;color:#fff;letter-spacing:1.5px;margin-bottom:7px">AVAILABLE FACILITIES</div>
    ${head>0 ? offers.map(offerCard).join('') : `<div style="font-size:11.3px;color:var(--muted2);padding:8px 0 12px">Credit limit reached — repay debt to free up borrowing capacity.</div>`}
    <!-- Your loans -->
    ${STATE.loans.length ? `
      <div style="font-size:11.3px;font-weight:700;color:#fff;letter-spacing:1.5px;margin:14px 0 7px;display:flex;justify-content:space-between;align-items:center">
        <span>YOUR LOANS</span>
        ${STATE.loans.length>=2 ? `<button class="action-btn" style="padding:4px 12px;font-size:11.3px;margin:0;width:auto" onclick="consolidateLoans()">🧾 Consolidate → ${(blendedMonthlyRate()*0.9*100).toFixed(2)}%/mo</button>` : ''}
      </div>
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:12px">
        ${trancheRows}
        <div style="display:flex;justify-content:space-between;padding:6px 10px;background:rgba(255,93,114,0.06);font-size:11.3px;font-weight:700">
          <span style="color:var(--muted)">Total</span>
          <span style="color:var(--loss);font-family:'DM Mono'">$${Math.round(tot)}M · −$${grossInt.toFixed(2)}M/mo</span>
        </div>
      </div>
      ${STATE.loans.length>=2 ? `<div style="font-size:10.2px;color:var(--muted2);margin:-6px 0 12px">Consolidating merges every loan into one and shaves 10% off your blended rate (1% fee).</div>` : ''}
      <!-- Repay -->
      <div style="font-size:11.3px;font-weight:700;color:#fff;letter-spacing:1.5px;margin-bottom:7px">REPAY (clears priciest debt first)</div>
      <div style="display:flex;gap:6px;margin-bottom:7px">
        <button class="action-btn danger" style="flex:1;padding:6px 0;font-size:11.3px;margin:0" onclick="repayLoan('q25')">Pay 25%<br><span style="font-size:10.2px;color:var(--muted2)">$${Math.round(tot*0.25)}M</span></button>
        <button class="action-btn danger" style="flex:1;padding:6px 0;font-size:11.3px;margin:0" onclick="repayLoan('q50')">Pay 50%<br><span style="font-size:10.2px;color:var(--muted2)">$${Math.round(tot*0.5)}M</span></button>
        <button class="action-btn danger" style="flex:1;padding:6px 0;font-size:11.3px;margin:0" onclick="repayLoan('full')">Pay Off<br><span style="font-size:10.2px;color:var(--muted2)">$${Math.round(tot)}M</span></button>
      </div>
      <button class="action-btn" style="width:100%;padding:7px;font-size:11.3px" onclick="repayLoan('custom')">Repay slider amount ($<span>${sliderVal}</span>M)</button>
    ` : `<div style="font-size:11.3px;color:var(--muted2);text-align:center;padding:10px 0">You're debt-free. 🎉 Draw a facility above when you need capital.</div>`}
  </div>`;
}
// ══════════════════════════════════════════════════════════════════════════
//  CHARTER ACQUISITIONS (M&A) — small carriers appear, you negotiate & buy them
// ══════════════════════════════════════════════════════════════════════════
const CHARTER_PREFIX = {
  'N America':['Cascade','Sierra','Lakeshore','Liberty','Great Lakes','Sunbelt','Cardinal','Redwood'],
  'S America':['Andes','Pampas','Amazonia','Condor','Iguazu','Patagon','Altiplano'],
  'Europe'   :['Alpine','Nordic','Adriatic','Albion','Rhine','Iberia','Baltic'],
  'Africa'   :['Sahara','Savanna','Kilimanjaro','Cape','Serengeti','Atlas','Nile'],
  'Mid East' :['Gulf Star','Levant','Oasis','Cedar','Pearl','Mirage','Dune'],
  'SE Asia'  :['Monsoon','Orchid','Mekong','Pacific Rim','Lotus','Java','Spice'],
  'Oceania'  :['Coral','Outback','Tasman','Reef','Southern Cross','Kowari'],
};
const CHARTER_SUFFIX = ['Air Charter','Airways','Air','Express','Connect','Wings','Aviation','Skyways','Regional','Air Lines'];
function genCharterName(region){
  const pre = (CHARTER_PREFIX[region]||['Skylark','Meridian','Vanguard']);
  return `${pre[Math.floor(Math.random()*pre.length)]} ${CHARTER_SUFFIX[Math.floor(Math.random()*CHARTER_SUFFIX.length)]}`;
}
function _cityGrowth(c){
  const v = ((c.tourism||40)+(c.econ||50))/220 + (5-(c.level||3))*0.05;
  return Math.max(0.05, Math.min(0.95, v));
}
function _charterRouteObj(rt){
  return { from:rt.from, to:rt.to, plane:rt.plane, flights:rt.flights, fare:rt.fare,
           service:rt.service||'economy', _age:12, planes:[{type:rt.plane, flights:rt.flights}] };
}
function charterMonthlyProfit(ch){
  let p=0;
  for(const rt of ch.routes){ try{ const res=processRoute(_charterRouteObj(rt)); p+=res.profit||0; }catch(e){} }
  return p;
}
function valueCharter(ch){
  const mp = charterMonthlyProfit(ch);
  ch.monthlyProfit = mp;
  ch.annualProfit  = mp*12;
  const fleetResale = Object.entries(ch.fleet).reduce((s,[t,n])=> s + n*((AIRCRAFT[t]?.cost||25)*0.5), 0);
  const slotValue   = ch.routes.length*6;
  const assetValue  = fleetResale + slotValue;
  const earnVal     = Math.max(0, ch.annualProfit)*4.5;
  const base        = Math.max(assetValue, earnVal>0 ? earnVal : assetValue*0.85);
  const growthPrem  = base * ch.growth * 0.6;
  ch.fairValue = Math.max(8, Math.round(base + growthPrem));
  ch.askPrice  = Math.round(ch.fairValue * (1.12 + 0.18*ch.growth));
  ch.floor     = Math.round(ch.fairValue * (0.90 + Math.random()*0.05));
  return ch;
}
function generateCharter(){
  const region = REGIONS[Math.floor(Math.random()*REGIONS.length)];
  const inRegion = Object.entries(CITIES).filter(([n,c])=>c.region===region);
  if(inRegion.length < 3) return null;
  const hubPool = inRegion.filter(([n,c])=>!c.major).concat(inRegion);
  const [hub, hubC] = hubPool[Math.floor(Math.random()*hubPool.length)];
  const dests = inRegion.filter(([n])=>n!==hub)
     .map(([n,c])=>[n,c,getDistance(hub,n)])
     .sort((a,b)=>a[2]-b[2])
     .slice(0, 2 + Math.floor(Math.random()*3));   // 2–4 nearest
  if(dests.length < 2) return null;
  const maxDist = Math.max(...dests.map(d=>d[2]));
  let acPool = Object.entries(AIRCRAFT).filter(([t,a])=>
       a.era<=STATE.year && a.range>=maxDist && a.seats<=200
       && a.type!=='supersonic' && !a.vintage && (!a.retired || STATE.year < a.retired))
     .sort((a,b)=> (a[1].range-b[1].range) || (a[1].seats-b[1].seats));   // right-size: tightest range first
  if(!acPool.length) acPool = Object.entries(AIRCRAFT).filter(([t,a])=>a.range>=maxDist && a.type!=='supersonic')
     .sort((a,b)=> (a[1].range-b[1].range));
  if(!acPool.length) return null;
  const planeType = acPool[Math.floor(Math.random()*Math.min(4, acPool.length))][0];   // variety among right-sized jets
  const routes = dests.map(([n,c,dist])=>{
    const refFare = ECON.refFareBase + dist*ECON.refFareDist;
    return { from:hub, to:n, plane:planeType, flights:1+Math.floor(Math.random()*3),
             fare:Math.round(refFare*(0.85+Math.random()*0.2)), service:'economy' };
  });
  const totalFlights = routes.reduce((s,r)=>s+r.flights,0);   // 1 airframe per weekly flight
  const fleet = { [planeType]: totalFlights };
  const growth = Math.max(0.12, Math.min(0.9, dests.reduce((s,d)=>s+_cityGrowth(d[1]),0)/dests.length));
  const ch = { id:'ch'+(++STATE._charterSeq), name:genCharterName(region), region, hub, icon:'🛩',
               routes, fleet, growth, expires:(STATE._absMonth||0)+6+Math.floor(Math.random()*5), negotiation:null };
  valueCharter(ch);
  return ch;
}
function maybeSpawnCharter(){
  STATE.charters = STATE.charters || [];
  if(STATE.charters.length >= 3) return;
  const rivalRoutes = STATE.competitors.length
    ? STATE.competitors.reduce((s,c)=>s+(((c.routeList||[]).length)||c.routes||0),0)/STATE.competitors.length : 0;
  const behind = STATE.routes.length < rivalRoutes;
  const prob = 0.12 + (behind?0.10:0) + Math.min(0.08, (STATE.yearsElapsed||0)*0.01);
  if(Math.random() < prob){
    let ch=null; try{ ch=generateCharter(); }catch(e){ ch=null; }
    if(ch){
      STATE.charters.push(ch);
      addEvent('good', `🛩 Charter on the market: <b>${ch.name}</b> (${ch.region} · hub ${ch.hub}) — ${ch.routes.length} routes, asking $${ch.askPrice}M. Open 📈 Shares → Acquisitions to negotiate.`);
      showFlash(`🛩 ${ch.name} is up for acquisition`);
    }
  }
  updateAcqBadge();
}
function tickCharters(){
  STATE.charters = STATE.charters || [];
  const mo = STATE._absMonth||0;
  STATE.charters = STATE.charters.filter(ch=>{
    if(mo >= ch.expires){
      addEvent('neutral', `🛩 ${ch.name} withdrew from the market (offer lapsed).`);
      if(STATE._acqSelected===ch.id) STATE._acqSelected=null;
      return false;
    }
    return true;
  });
  updateAcqBadge();
}
function updateAcqBadge(){
  const b=document.getElementById('acq-badge'); if(!b) return;
  const n=(STATE.charters||[]).length;
  if(n>0){ b.textContent=n; b.style.display='inline-block'; } else { b.style.display='none'; }
}
function findCharter(id){ return (STATE.charters||[]).find(c=>c.id===id); }
function refreshSharesModal(){ const c=document.getElementById('modal-content'); if(c) c.innerHTML=buildShares(); }
function selectCharter(id){ STATE._acqSelected=id; const ch=findCharter(id); if(ch&&!ch.negotiation) ch.negotiation={round:0,message:''}; refreshSharesModal(); }
function closeCharter(){ STATE._acqSelected=null; refreshSharesModal(); }
function acceptAsk(id){ const ch=findCharter(id); if(ch) acquireCharter(ch, ch.askPrice); }
function makeOffer(id){
  const ch=findCharter(id); if(!ch) return;
  const offer = Math.round(+val('acq-amt')||0);
  if(offer<=0) return showFlash('⚠ Enter an offer amount');
  ch.negotiation = ch.negotiation || {round:0,message:''};
  if(offer >= ch.askPrice) return acquireCharter(ch, offer);
  if(offer >= ch.floor){ ch.negotiation.message=`✓ Deal — ${ch.name} accepts $${offer}M.`; return acquireCharter(ch, offer); }
  ch.negotiation.round++;
  if(offer < ch.floor*0.6 && Math.random()<0.5){
    ch.negotiation.message=`✗ Insulted by the lowball, ${ch.name}'s owners end the talks.`;
    addEvent('warn', `🛩 ${ch.name} pulled out after a lowball offer.`);
    STATE.charters = STATE.charters.filter(c=>c.id!==ch.id);
    STATE._acqSelected=null; updateAcqBadge(); updateUI(); refreshSharesModal(); return;
  }
  if(ch.negotiation.round >= 4){
    ch.negotiation.message=`✗ Talks stalled — ${ch.name} won't drop below about $${ch.floor}M. Meet their number or walk.`;
  } else {
    ch.askPrice = Math.max(ch.floor, Math.round((ch.askPrice + offer)/2));
    ch.negotiation.message=`↔ Counter: they'll come down to <b>$${ch.askPrice}M</b> (round ${ch.negotiation.round}/3). Their floor is firm.`;
  }
  refreshSharesModal();
}
function acquireCharter(ch, price){
  price = Math.round(price);
  if(STATE.cash < price) return showFlash(`⚠ Need $${price}M cash (have $${Math.floor(STATE.cash)}M)`);
  STATE.cash -= price;
  for(const [t,n] of Object.entries(ch.fleet)){
    const a=AIRCRAFT[t]; if(!a) continue;
    if(!STATE.planes[t]) STATE.planes[t] = {...a, owned:0, assigned:0};
    STATE.planes[t].owned += n;
    stampAcquisition(STATE.planes[t], n, (STATE.year||2024) - 6);   // second-hand frames
  }
  if(!STATE.hubs.includes(ch.hub)) STATE.hubs.push(ch.hub);
  let added=0;
  for(const rt of ch.routes){
    const dup = STATE.routes.some(r=>(r.from===rt.from&&r.to===rt.to)||(r.from===rt.to&&r.to===rt.from));
    if(dup) continue;
    const planes=[{type:rt.plane, flights:rt.flights}];
    if(STATE.planes[rt.plane]) STATE.planes[rt.plane].assigned += rt.flights;
    const nr={ from:rt.from, to:rt.to, plane:rt.plane, flights:rt.flights, fare:rt.fare,
               service:rt.service||'economy', profit:0, pax:0, load:50, planes, _age:6, _acquired:true };
    try{ const res=processRoute(nr); nr.profit=res.profit; nr.pax=res.pax; nr.load=res.load; nr._demand=res.demand; nr._capacity=res.capacity; }catch(e){}
    STATE.routes.push(nr); added++;
  }
  const frames = Object.values(ch.fleet).reduce((s,n)=>s+n,0);
  STATE.charters = STATE.charters.filter(c=>c.id!==ch.id);
  STATE._acqSelected=null;
  if(typeof recalcCompanyValue==='function') recalcCompanyValue();
  addEvent('good', `🤝 Acquired <b>${ch.name}</b> for $${price}M — +${added} routes, +${frames} aircraft, new hub in ${ch.hub}.`);
  showFlash(`🤝 ${ch.name} acquired`);
  updateAcqBadge();
  updateUI();
  if(typeof renderMap==='function') renderMap();
  if(typeof renderRoutesList==='function') renderRoutesList();
  if(typeof renderFleet==='function') renderFleet();
  if(typeof renderHubsList==='function') renderHubsList();
  refreshSharesModal();
}
function growthLabel(g){ return g>=0.7?'🔥 Hot':g>=0.5?'High':g>=0.3?'Moderate':'Low'; }
function growthColor(g){ return g>=0.7?'var(--loss)':g>=0.5?'var(--profit)':g>=0.3?'var(--warn)':'var(--muted2)'; }
function acqStatBox(l,v,c){ return `<div class="city-stat-box" style="flex:1;min-width:76px"><div class="csb-l">${l}</div><div class="csb-v" style="color:${c||'var(--text)'}">${v}</div></div>`; }
function charterCard(ch){
  const _pb = ch.annualProfit>0 ? ch.askPrice/ch.annualProfit : 999;
  const yrs = (ch.annualProfit>1 && _pb<=25) ? _pb.toFixed(1)+'y payback' : 'asset / growth play';
  const pc  = ch.monthlyProfit>=0?'var(--profit)':'var(--loss)';
  const frames = Object.values(ch.fleet).reduce((s,n)=>s+n,0);
  return `<div style="border:1px solid var(--border);border-radius:9px;padding:10px 12px;margin-bottom:8px;background:var(--bg2)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <div style="min-width:0">
        <div style="font-size:13.6px;font-weight:700;color:var(--text)">${ch.icon} ${ch.name}</div>
        <div style="font-size:10.7px;color:var(--muted2);margin-top:1px">${ch.region} · hub ${ch.hub} · ${ch.routes.length} routes · ${frames} aircraft</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:10.2px;color:var(--muted2)">ASKING</div>
        <div style="font-size:16.9px;font-weight:700;color:var(--accent2);font-family:'DM Mono'">$${ch.askPrice}M</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:7px;font-size:11.3px;align-items:center;flex-wrap:wrap">
      <span style="color:var(--muted2)">Profit <span style="color:${pc};font-family:'DM Mono'">${ch.monthlyProfit>=0?'+':''}$${ch.monthlyProfit.toFixed(2)}M/mo</span></span>
      <span style="color:var(--muted2)">Growth <span style="color:${growthColor(ch.growth)}">${growthLabel(ch.growth)}</span></span>
      <span style="color:var(--muted2)">${yrs}</span>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <button class="action-btn gold" style="width:auto;margin:0;padding:5px 18px;font-size:11.3px" onclick="selectCharter('${ch.id}')">NEGOTIATE →</button>
    </div>
  </div>`;
}
function buildCharterDetail(ch){
  const sliderMin = Math.max(1, Math.round(ch.floor*0.5));
  const sliderMax = Math.round(ch.askPrice*1.1);
  const def = Math.min(sliderMax, Math.max(sliderMin, ch.fairValue));
  const routeRows = ch.routes.map(rt=>{
    const dist=Math.round(getDistance(rt.from,rt.to));
    return `<div style="display:flex;justify-content:space-between;padding:4px 10px;border-bottom:1px solid var(--border);font-size:10.7px">
      <span style="color:var(--muted)">${rt.from} → ${rt.to}</span>
      <span style="color:var(--muted2)">${rt.plane} · ${rt.flights}f/wk · $${rt.fare} · ${dist}mi</span></div>`;
  }).join('');
  const fleetRows = Object.entries(ch.fleet).map(([t,n])=>`${n}× ${t}`).join(' · ');
  const canAfford = STATE.cash >= ch.askPrice;
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-size:11.3px;font-weight:700;color:#fff;letter-spacing:1.2px">🛩 NEGOTIATING · ${ch.icon} ${ch.name.toUpperCase()}</span>
      <button class="action-btn" style="width:auto;margin:0;padding:3px 10px;font-size:11.3px" onclick="closeCharter()">← BACK</button>
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">
      ${acqStatBox('Asking','$'+ch.askPrice+'M','var(--accent2)')}
      ${acqStatBox('Fair Value','$'+ch.fairValue+'M','var(--text)')}
      ${acqStatBox('Profit/yr',(ch.annualProfit>=0?'+':'')+'$'+ch.annualProfit.toFixed(1)+'M', ch.annualProfit>=0?'var(--profit)':'var(--loss)')}
      ${acqStatBox('Growth',growthLabel(ch.growth),growthColor(ch.growth))}
    </div>
    <div style="font-size:10.7px;color:var(--muted2);margin-bottom:4px">NETWORK — transfers to you on close</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;overflow:hidden;margin-bottom:6px">${routeRows}</div>
    <div style="font-size:11.3px;color:var(--muted2);margin-bottom:12px">Fleet included: ${fleetRows} · you also gain a hub at <b style="color:var(--text)">${ch.hub}</b></div>
    ${ch.negotiation&&ch.negotiation.message?`<div style="background:rgba(167,137,255,0.08);border:1px solid rgba(167,137,255,0.3);border-radius:8px;padding:8px 11px;margin-bottom:12px;font-size:11.3px;color:var(--muted)">${ch.negotiation.message}</div>`:''}
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:10px 12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <span style="font-size:11.3px;font-weight:700;color:var(--accent2);letter-spacing:1.2px">YOUR OFFER</span>
        <span style="font-size:18.1px;font-family:'DM Mono'">$<span id="acq-v">${def}</span>M</span>
      </div>
      <input type="range" id="acq-amt" min="${sliderMin}" max="${sliderMax}" step="1" value="${def}" style="width:100%" oninput="document.getElementById('acq-v').textContent=this.value">
      <div style="font-size:10.2px;color:var(--muted2);margin-top:4px">Offer at or above their (hidden) floor to close instantly. Lowballs risk them walking away.</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="action-btn gold" style="flex:1;margin:0;padding:8px;font-size:12.4px" onclick="makeOffer('${ch.id}')">MAKE OFFER</button>
      <button class="action-btn success" style="flex:1;margin:0;padding:8px;font-size:12.4px" ${canAfford?'':'disabled'} onclick="tapConfirm(this,()=>{acceptAsk('${ch.id}')},'Tap to confirm')">PAY ASK · $${ch.askPrice}M</button>
    </div>
    ${!canAfford?`<div style="font-size:10.7px;color:var(--loss);text-align:center;margin-top:6px">Short on cash for the asking price — make a lower offer or raise a loan first.</div>`:''}`;
}


function _ownSparkline(hist, key, color){
  if (!hist || hist.length < 2) return '';
  const vals = hist.map(h=>h[key]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max-min || 1;
  const W = 70, H = 18;
  const pts = vals.map((v,i)=>{
    const x = (i/(vals.length-1))*W;
    const y = H - ((v-min)/range)*H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg width="${W}" height="${H}" style="display:block;margin-top:4px" viewBox="0 0 ${W} ${H}">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.8"/>
  </svg>`;
}
function _ownTrend(hist, key){
  if (!hist || hist.length < 2) return { pct:0, dir:'flat' };
  const first = hist[0][key], last = hist[hist.length-1][key];
  if (!first) return { pct:0, dir:'flat' };
  const pct = ((last-first)/first)*100;
  return { pct, dir: pct>0.5?'up':pct<-0.5?'down':'flat' };
}
function buildShares(){
  const s=STATE.shares; const ownPct=Math.round(s.owned/s.total*100);
  if (typeof recalcCompanyValue==='function') recalcCompanyValue();
  STATE.charters = STATE.charters || [];
  const cv=STATE.companyValue||1;
  const sel = STATE._acqSelected ? findCharter(STATE._acqSelected) : null;
  const hist = STATE._shareHist || [];
  const priceTrend = _ownTrend(hist,'price');
  const cvTrend = _ownTrend(hist,'cv');
  const ownPctExact = s.owned/s.total*100;
  const holdingsM = s.owned*s.price/1000;

  // stake status + color
  let stakeLabel, stakeCol, stakeBg;
  if (ownPctExact>=75){ stakeLabel='FULL CONTROL'; stakeCol='var(--profit)'; stakeBg='rgba(95,224,160,0.15)'; }
  else if (ownPctExact>=51){ stakeLabel='MAJORITY CONTROL'; stakeCol='var(--profit)'; stakeBg='rgba(95,224,160,0.15)'; }
  else if (ownPctExact>=25){ stakeLabel='BLOCKING STAKE'; stakeCol='var(--accent)'; stakeBg='rgba(167,137,255,0.15)'; }
  else { stakeLabel='MINORITY HOLDER'; stakeCol='var(--accent2)'; stakeBg='rgba(255,207,90,0.15)'; }

  const trendChip = (tr, goodIsUp) => {
    if (tr.dir==='flat') return `<div style="font-size:10.7px;color:var(--muted);margin-top:2px">— stable</div>`;
    const up = tr.dir==='up';
    const col = (up===goodIsUp) ? 'var(--profit)' : 'var(--loss)';
    return `<div style="font-size:10.7px;color:${col};margin-top:2px">${up?'▲':'▼'} ${tr.pct>=0?'+':''}${tr.pct.toFixed(1)}%</div>`;
  };

  const statCard = (label, value, color, extra) => `
    <div class="city-stat-box" style="flex:1;min-width:76px">
      <div class="csb-l">${label}</div>
      <div class="csb-v" style="color:${color||'var(--text)'}">${value}</div>
      ${extra||''}
    </div>`;

  const companyHtml = `
    <div style="font-size:11.3px;font-weight:700;color:#fff;letter-spacing:1.5px;margin-bottom:7px">YOUR COMPANY</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px">
      ${statCard('Ownership', ownPct+'%', ownPctExact>=51?'var(--profit)':ownPctExact>=25?'var(--accent)':'var(--warn)',
        `<div style="font-size:10.7px;color:${stakeCol};margin-top:2px">${stakeLabel.toLowerCase()}</div>`)}
      ${statCard('Share Price', '$'+s.price, 'var(--profit)', _ownSparkline(hist,'price','var(--profit)'))}
      ${statCard('Company Value', '$'+cv+'M', 'var(--purple)', trendChip(cvTrend,true))}
      ${statCard('Holdings', '$'+holdingsM.toFixed(1)+'M', 'var(--text)',
        `<div style="font-size:10.7px;color:var(--muted);margin-top:2px">${(s.owned/1000).toFixed(0)}k shares</div>`)}
    </div>

    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:10px 12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11.3px;color:var(--muted2)">Ownership stake</span>
        <span style="font-size:11.3px;font-weight:700;padding:2px 8px;border-radius:4px;background:${stakeBg};color:${stakeCol}">${stakeLabel}</span>
      </div>
      <div style="height:20px;border-radius:5px;overflow:hidden;display:flex;margin-bottom:6px">
        <div id="stakeSegYou" style="height:100%;width:${Math.max(3,ownPctExact)}%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:10.7px;font-weight:700;color:#04342c">${ownPctExact>=8?ownPct+'%':''}</div>
        <div id="stakeSegPub" style="height:100%;width:${100-ownPctExact}%;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:10.7px;color:var(--muted)">Public float ${100-ownPct}%</div>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px">
        ${[['25%','Blocking',25],['51%','Majority',51],['75%','Full control',75]].map(([p,l,thr])=>`
          <div style="flex:1;background:var(--surface2);border:1px solid ${ownPctExact>=thr?'var(--accent)':'var(--border)'};border-radius:5px;padding:4px 6px;text-align:center">
            <div style="font-size:11.3px;font-weight:700;color:${ownPctExact>=thr?'var(--accent)':'var(--muted2)'}">${p}</div>
            <div style="font-size:10.2px;color:var(--muted);margin-top:1px">${l}</div>
          </div>`).join('')}
      </div>
    </div>

    ${ownPctExact<15 ? `<div style="background:rgba(255,93,114,0.08);border:1px solid rgba(255,93,114,0.4);border-radius:8px;padding:9px 12px;margin-bottom:10px;display:flex;gap:9px;align-items:flex-start">
      <span style="font-size:15.8px;flex-shrink:0">⚠️</span>
      <div style="font-size:11.3px;color:var(--loss);line-height:1.5">Takeover risk — your stake is below 15%. A rival or activist investor could move to seize control. Buy shares to defend your position.</div>
    </div>` : ''}

    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:11px 13px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
        <div style="display:flex;gap:4px">
          <button id="sh-mode-buy" class="action-btn success" style="margin:0;padding:4px 14px;font-size:11.3px" onclick="setShareMode('buy')">Buy</button>
          <button id="sh-mode-sell" class="action-btn" style="margin:0;padding:4px 14px;font-size:11.3px;border-color:var(--border);color:var(--muted)" onclick="setShareMode('sell')">Sell</button>
        </div>
        <span style="font-size:12.4px;font-family:'DM Mono'"><span id="sh-v">50</span>k shares</span>
      </div>
      ${ownPct>=100 ? `<div style="font-size:11.3px;color:var(--muted2);margin-bottom:8px">You own 100% — sell shares to raise cash, or grow via acquisitions below.</div>` : ''}
      <input type="range" id="sh-amt" min="10" max="200" step="10" value="50" style="width:100%" oninput="updateShareTrade()">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin:10px 0">
        <div style="background:var(--surface2);border-radius:6px;padding:7px 9px">
          <div style="font-size:10.2px;color:var(--muted2);letter-spacing:0.3px" id="sh-cost-lbl">COST</div>
          <div style="font-size:14.7px;font-weight:700;font-family:'DM Mono'" id="sh-cost-val">$37M</div>
          <div style="font-size:10.2px;color:var(--muted);margin-top:1px">@ $${s.price}/share</div>
        </div>
        <div style="background:var(--surface2);border-radius:6px;padding:7px 9px">
          <div style="font-size:10.2px;color:var(--muted2);letter-spacing:0.3px">NEW STAKE</div>
          <div style="font-size:14.7px;font-weight:700;font-family:'DM Mono'" id="sh-newown">13.0%</div>
          <div style="font-size:10.2px;margin-top:1px" id="sh-owndelta">+0.0%</div>
        </div>
        <div style="background:var(--surface2);border-radius:6px;padding:7px 9px">
          <div style="font-size:10.2px;color:var(--muted2);letter-spacing:0.3px">CASH AFTER</div>
          <div style="font-size:14.7px;font-weight:700;font-family:'DM Mono'" id="sh-cashafter">$0M</div>
          <div style="font-size:10.2px;color:var(--muted);margin-top:1px">from $${STATE.cash.toFixed(0)}M</div>
        </div>
      </div>
      <button id="sh-exec" class="action-btn success" style="width:100%;margin:0;padding:9px;font-size:12.4px" onclick="execShareTrade()">BUY 50K SHARES — $37M</button>
    </div>`;

  let acqHtml;
  if (sel) {
    acqHtml = buildCharterDetail(sel);
  } else {
    const list = STATE.charters.length ? STATE.charters.map(charterCard).join('') :
      `<div style="background:var(--bg2);border:1px dashed var(--border);border-radius:9px;padding:14px;text-align:center">
         <div style="font-size:20.3px;color:var(--muted2);margin-bottom:5px">🛩</div>
         <div style="font-size:12.4px;color:var(--muted);margin-bottom:4px">No carriers on the market right now</div>
         <div style="font-size:11.3px;color:var(--muted2);line-height:1.6;margin-bottom:10px">Small carriers come up for sale over time. Buy one to instantly absorb its routes, fleet and hub.</div>
         <div style="display:flex;align-items:center;gap:9px">
           <div style="flex:1;height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden"><div style="height:3px;width:${_charterProgress()}%;background:var(--accent);border-radius:2px"></div></div>
           <div style="font-size:11.3px;color:var(--muted2);min-width:96px;text-align:right">${_charterEta()}</div>
         </div>
       </div>`;
    acqHtml = `<div style="font-size:11.3px;font-weight:700;color:#fff;letter-spacing:1.5px;margin-bottom:7px;display:flex;justify-content:space-between">
        <span>🛩 CHARTER ACQUISITIONS</span>${STATE.charters.length?`<span style="color:var(--accent2)">${STATE.charters.length} on market</span>`:''}
      </div>${list}`;
  }

  const html = modalHead('📈 OWNERSHIP &amp; ACQUISITIONS')+`<div class="modal-body">${companyHtml}${acqHtml}</div>`;
  setTimeout(()=>{ if(typeof updateShareTrade==='function') updateShareTrade(); }, 0);
  return html;
}
let _shareMode = 'buy';
function setShareMode(m){
  _shareMode = m;
  const buyBtn=document.getElementById('sh-mode-buy'), sellBtn=document.getElementById('sh-mode-sell');
  if(buyBtn&&sellBtn){
    if(m==='buy'){
      buyBtn.className='action-btn success'; buyBtn.style.cssText='margin:0;padding:4px 14px;font-size:11.3px';
      sellBtn.className='action-btn'; sellBtn.style.cssText='margin:0;padding:4px 14px;font-size:11.3px;border-color:var(--border);color:var(--muted)';
    } else {
      sellBtn.className='action-btn danger'; sellBtn.style.cssText='margin:0;padding:4px 14px;font-size:11.3px';
      buyBtn.className='action-btn'; buyBtn.style.cssText='margin:0;padding:4px 14px;font-size:11.3px;border-color:var(--border);color:var(--muted)';
    }
  }
  updateShareTrade();
}
function updateShareTrade(){
  const s=STATE.shares;
  const amt=(+val('sh-amt')||50)*1000;
  const value=amt*s.price/1000; // $M
  const vEl=document.getElementById('sh-v'); if(vEl) vEl.textContent=amt/1000;
  const costLbl=document.getElementById('sh-cost-lbl'); if(costLbl) costLbl.textContent=_shareMode==='buy'?'COST':'PROCEEDS';
  const costVal=document.getElementById('sh-cost-val');
  const proceeds = _shareMode==='sell' ? value*0.95 : value;
  if(costVal) costVal.textContent='$'+proceeds.toFixed(1)+'M';

  const newOwned = _shareMode==='buy' ? Math.min(s.total, s.owned+amt) : Math.max(0, s.owned-amt);
  const newPct = newOwned/s.total*100;
  const curPct = s.owned/s.total*100;
  const newOwnEl=document.getElementById('sh-newown'); if(newOwnEl) newOwnEl.textContent=newPct.toFixed(1)+'%';
  const delta=newPct-curPct;
  const dEl=document.getElementById('sh-owndelta');
  if(dEl){ dEl.textContent=(delta>=0?'+':'')+delta.toFixed(1)+'%'; dEl.style.color=_shareMode==='buy'?'var(--profit)':'var(--loss)'; }

  const cashAfter = _shareMode==='buy' ? STATE.cash-value : STATE.cash+proceeds;
  const caEl=document.getElementById('sh-cashafter'); if(caEl){ caEl.textContent='$'+cashAfter.toFixed(0)+'M'; caEl.style.color=cashAfter<0?'var(--loss)':'var(--text)'; }

  // live stake bar preview
  const segYou=document.getElementById('stakeSegYou'), segPub=document.getElementById('stakeSegPub');
  if(segYou&&segPub){
    segYou.style.width=Math.max(3,newPct)+'%';
    segYou.textContent=newPct>=8?Math.round(newPct)+'%':'';
    segPub.style.width=(100-newPct)+'%';
    segPub.textContent='Public float '+Math.round(100-newPct)+'%';
  }

  const exec=document.getElementById('sh-exec');
  if(exec){
    exec.textContent=(_shareMode==='buy'?'BUY ':'SELL ')+(amt/1000)+'K SHARES — $'+proceeds.toFixed(1)+'M';
    exec.className='action-btn '+(_shareMode==='buy'?'success':'danger');
    exec.style.cssText='width:100%;margin:0;padding:9px;font-size:12.4px';
  }
}
function execShareTrade(){
  if(_shareMode==='buy') buyShares(); else sellShares();
}
function buyShares(){
  const amt=(+val('sh-amt')||50)*1000;
  const cost=amt*STATE.shares.price/1000;
  if(STATE.cash<cost) return showFlash(`⚠ Need $${cost.toFixed(0)}M`);
  if(STATE.shares.owned+amt>STATE.shares.total) return showFlash('⚠ Not enough available');
  STATE.cash-=cost; STATE.shares.owned+=amt;
  showFlash(`Bought ${amt/1000}k shares`);
  updateUI(); document.getElementById('modal-content').innerHTML=buildShares();
}
function sellShares(){
  const amt=(+val('sh-amt')||50)*1000;
  if(amt>STATE.shares.owned) return showFlash('⚠ Not enough shares');
  const gain=amt*STATE.shares.price/1000*0.95;
  STATE.cash+=gain; STATE.shares.owned-=amt;
  showFlash(`Sold ${amt/1000}k shares for $${gain.toFixed(0)}M`);
  updateUI(); document.getElementById('modal-content').innerHTML=buildShares();
}
function _charterSpawnProb(){
  const rivalRoutes = STATE.competitors && STATE.competitors.length
    ? STATE.competitors.reduce((s,c)=>s+(((c.routeList||[]).length)||c.routes||0),0)/STATE.competitors.length : 0;
  const behind = (STATE.routes||[]).length < rivalRoutes;
  return 0.12 + (behind?0.10:0) + Math.min(0.08, (STATE.yearsElapsed||0)*0.01);
}
function _charterEta(){
  const prob = _charterSpawnProb();
  const exp = Math.max(1, Math.round(1/prob));
  return `next listing ~${exp} mo`;
}
function _charterProgress(){
  // a soft visual: higher spawn prob = fuller bar (closer to a listing)
  const prob = _charterSpawnProb();
  return Math.min(95, Math.round(prob/0.30*100));
}
function activeCampaignsList(){
  if(!Array.isArray(STATE.activeCampaigns)){
    STATE.activeCampaigns = STATE.activeCampaign
      ? [{type:'region', region:STATE.activeCampaign.region, bonus:0.15, monthsLeft:STATE.activeCampaign.monthsLeft||12, label:STATE.activeCampaign.region}]
      : [];
    STATE.activeCampaign = null;
  }
  return STATE.activeCampaigns;
}
function campaignRouteMult(cf, ct, r){
  let m=1;
  activeCampaignsList().forEach(cp=>{
    if(cp.monthsLeft<=0) return;
    if(cp.type==='region'){ if(ct.region===cp.region || cf.region===cp.region) m*=1+cp.bonus; }
    else if(cp.type==='city'){ if(r.from===cp.city || r.to===cp.city) m*=1+cp.bonus; }
    else if(cp.type==='route'){ if((r.from===cp.from&&r.to===cp.to)||(r.from===cp.to&&r.to===cp.from)) m*=1+cp.bonus; }
  });
  return m;
}
function ventureAdMult(key){
  let m=1;
  activeCampaignsList().forEach(cp=>{ if(cp.type==='venture' && cp.monthsLeft>0 && cp.ventureKey===key) m*=1+cp.bonus; });
  return m;
}
function tickCampaigns(){
  const list=activeCampaignsList();
  for(let k=list.length-1;k>=0;k--){
    list[k].monthsLeft--;
    if(list[k].monthsLeft<=0){ addEvent('neutral', `📣 ${list[k].label} ad campaign ended.`); list.splice(k,1); }
  }
}
let _adTab='region';
function adSetTab(t){ _adTab=t; document.getElementById('modal-content').innerHTML=buildCampaign(); }
const AD_TYPES={
  region:  {label:'Region',  bonus:0.15, months:12, cost:35, blurb:'+15% demand on every route in a region'},
  city:    {label:'City',    bonus:0.18, months:9,  cost:16, blurb:'+18% demand on all routes to/from a city'},
  route:   {label:'Route',   bonus:0.25, months:6,  cost:7,  blurb:'+25% demand on a single route'},
  venture: {label:'Venture', bonus:0.30, months:9,  cost:9,  blurb:'+30% income from one business venture'},
};
function adCost(type){ const a=AD_TYPES[type]; return hasVenture('Travel Agency') ? Math.max(2,Math.round(a.cost*0.8)) : a.cost; }
function buildCampaign(){
  migrateBusinesses();
  const camps=activeCampaignsList();
  const hasAgency=hasVenture('Travel Agency');
  const tabs=Object.keys(AD_TYPES);
  const tabHtml=tabs.map(t=>`<button onclick="adSetTab('${t}')" style="flex:1;padding:7px 4px;font-size:10.7px;font-weight:700;border-radius:7px;cursor:pointer;border:1px solid ${_adTab===t?'var(--accent)':'var(--border)'};background:${_adTab===t?'rgba(167,137,255,0.15)':'var(--bg2)'};color:${_adTab===t?'var(--accent)':'var(--muted)'}">${AD_TYPES[t].label}</button>`).join('');
  const a=AD_TYPES[_adTab], cost=adCost(_adTab);
  // build target list per tab
  let targets=[];
  if(_adTab==='region'){
    targets=[...new Set(STATE.routes.flatMap(r=>[CITIES[r.from]?.region,CITIES[r.to]?.region]).filter(Boolean))]
      .map(reg=>({label:reg, active:camps.some(c=>c.type==='region'&&c.region===reg), launch:`launchAd('region',{region:'${reg.replace(/'/g,"\\'")}'},'${reg.replace(/'/g,"\\'")}')`, sub:reg}));
  } else if(_adTab==='city'){
    const cs=new Set(); (STATE.hubs||[]).forEach(h=>cs.add(h)); STATE.routes.forEach(r=>{cs.add(r.from);cs.add(r.to);});
    targets=[...cs].filter(c=>CITIES[c]).sort((x,y)=>(CITIES[y].econ+CITIES[y].tourism)-(CITIES[x].econ+CITIES[x].tourism))
      .map(city=>({label:city, sub:CITIES[city].region, active:camps.some(c=>c.type==='city'&&c.city===city), launch:`launchAd('city',{city:'${city.replace(/'/g,"\\'")}'},'${city.replace(/'/g,"\\'")}')`}));
  } else if(_adTab==='route'){
    targets=STATE.routes.map(r=>({label:`${r.from} \u2192 ${r.to}`, sub:`${Math.round(r.load||0)}% load \u00b7 ${(r.pax||0).toLocaleString()} pass/mo`,
      active:camps.some(c=>c.type==='route'&&((c.from===r.from&&c.to===r.to)||(c.from===r.to&&c.to===r.from))),
      launch:`launchAd('route',{from:'${r.from.replace(/'/g,"\\'")}',to:'${r.to.replace(/'/g,"\\'")}'},'${(r.from+' \u2192 '+r.to).replace(/'/g,"\\'")}')`}));
  } else {
    targets=ventureList().map(v=>{ const key=ventureKey(v.name,v.city); return {label:`${v.icon} ${v.name}`, sub:`in ${v.city} \u00b7 +$${v.income}M/Q`,
      active:camps.some(c=>c.type==='venture'&&c.ventureKey===key), launch:`launchAd('venture',{ventureKey:'${key.replace(/'/g,"\\'")}'},'${(v.name+' \u00b7 '+v.city).replace(/'/g,"\\'")}')`};});
  }
  const activeHtml = camps.length ? `<div style="font-size:10.7px;letter-spacing:1px;color:var(--muted2);margin-bottom:5px">RUNNING NOW</div>
    <div style="background:rgba(167,137,255,0.06);border:1px solid rgba(167,137,255,0.25);border-radius:8px;padding:5px 0;margin-bottom:13px">
    ${camps.map(c=>`<div style="display:flex;justify-content:space-between;padding:4px 11px;font-size:10.7px"><span style="color:#fff">\u2708 ${AD_TYPES[c.type].label}: <b>${c.label}</b></span><span style="color:var(--muted2)">${c.monthsLeft}mo left</span></div>`).join('')}
    </div>` : '';
  const rows = targets.length ? targets.map(t=>`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:9px;padding:8px 11px;border-bottom:1px solid var(--border)">
      <div style="min-width:0"><div style="font-size:12.4px;font-weight:700;color:var(--text)">${t.label}</div><div style="font-size:10.7px;color:var(--muted2)">${t.sub||''}</div></div>
      ${t.active ? `<span style="font-size:11.3px;font-weight:700;color:#fff">ACTIVE</span>`
        : `<button class="action-btn gold" style="width:auto;margin:0;padding:5px 12px;font-size:11.3px" ${STATE.cash<cost?'disabled':''} onclick="${t.launch}">Launch $${cost}M</button>`}
    </div>`).join('')
    : `<div style="padding:16px;text-align:center;font-size:11.3px;color:var(--muted2)">${_adTab==='venture'?'No ventures yet \u2014 buy one in Business Ventures.':'Open a route first to advertise here.'}</div>`;
  return modalHead('\ud83d\udce3 ADVERTISING')+`<div class="modal-body">
    <div style="font-size:11.3px;color:var(--muted);margin-bottom:10px">Target your ad spend precisely. ${hasAgency?'<span style="color:var(--profit)">Travel Agency \u2014 20% off!</span>':'<span style="color:var(--muted2)">Own a Travel Agency for 20% off.</span>'}</div>
    ${activeHtml}
    <div style="display:flex;gap:6px;margin-bottom:8px">${tabHtml}</div>
    <div style="font-size:11.3px;color:var(--accent2);margin-bottom:9px">${a.blurb} \u00b7 ${a.months} months \u00b7 base $${a.cost}M</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:9px;overflow:hidden;max-height:46vh;overflow-y:auto">${rows}</div>
  </div>`;
}
function launchAd(type, target, label){
  const cost=adCost(type), a=AD_TYPES[type];
  if(STATE.cash<cost) return showFlash(`\u26a0 Need $${cost}M`);
  const camps=activeCampaignsList();
  // prevent duplicate on same target
  const dup = camps.some(c=>c.type===type && (
    (type==='region'&&c.region===target.region) ||
    (type==='city'&&c.city===target.city) ||
    (type==='route'&&((c.from===target.from&&c.to===target.to)||(c.from===target.to&&c.to===target.from))) ||
    (type==='venture'&&c.ventureKey===target.ventureKey)));
  if(dup) return showFlash('Already advertising that');
  STATE.cash-=cost;
  camps.push({type, ...target, bonus:a.bonus, monthsLeft:a.months, label});
  addEvent('good', `📣 ${a.label} ad launched: ${label} (+${Math.round(a.bonus*100)}% for ${a.months}mo).`);
  showFlash(`\u2713 Advertising ${label}`);
  updateUI();
  document.getElementById('modal-content').innerHTML=buildCampaign();
}
// legacy shim
function launchCampaign(region, cost){ launchAd('region',{region},region); }

function showBoardMeeting(){
  document.getElementById('modal-overlay').classList.add('open');
  const salary = boardSalary();
  const filled = ['cfo','coo','strategy'].filter(r=>execTier(r)).length;
  const slot = (role) => {
    const def = BOARD_ROLES[role];
    const cur = execTier(role);
    const e   = (STATE.board||{})[role];
    const pers = getPersonality(role);
    const salaryEff = cur ? (cur.salary * (pers.salaryMult||1)).toFixed(1) : '0';
    const header = cur ? `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">
        <div>
          <div style="font-size:14.1px;font-weight:700;color:var(--text)">${e.name}</div>
          <div style="font-size:10.7px;color:var(--muted2)">${cur.title} · $${salaryEff}M/mo</div>
        </div>
        <button class="action-btn" style="padding:3px 10px;font-size:11.3px;background:rgba(244,63,94,0.1);border-color:rgba(244,63,94,0.3);color:var(--loss)" onclick="fireExec('${role}')">Dismiss</button>
      </div>
      ${pers.label ? `<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:5px;padding:3px 8px;font-size:10.7px;color:var(--muted);margin-bottom:7px" title="${pers.blurb}">${pers.icon} <b style="color:var(--text)">${pers.label}</b> <span style="color:var(--muted2)">· ${pers.effectMult>1?'+'+Math.round((pers.effectMult-1)*100)+'% effect':pers.effectMult<1?'-'+Math.round((1-pers.effectMult)*100)+'% effect':'baseline'}</span></div>` : ''}
      <div style="font-size:11.3px;color:var(--profit);background:rgba(78,234,170,0.06);border-radius:5px;padding:6px 9px;margin-bottom:9px">✓ ${def.effect(cur)} <span style="color:var(--muted2);font-size:10.2px">${pers.effectMult!==1?'(×'+pers.effectMult.toFixed(2)+' personality)':''}</span></div>
    ` : `
      <div style="font-size:12.4px;color:var(--muted);margin-bottom:9px">${def.blurb}</div>
      <div style="font-size:10.7px;color:var(--muted2);margin-bottom:9px">Personality assigned on hire — each exec has a unique working style that scales their effect and salary.</div>
    `;
    const tierBtns = def.tiers.map(t => {
      const isCurrent = cur && cur.tier === t.tier;
      const isDowngrade = cur && t.tier < cur.tier;
      const afford = STATE.cash >= t.hire;
      const label = isCurrent ? 'CURRENT' : (cur && t.tier>cur.tier ? 'PROMOTE' : cur ? 'SET' : 'HIRE');
      return `<button class="action-btn"
        style="flex:1;padding:7px 4px;font-size:11.3px;line-height:1.3;${isCurrent?'background:rgba(167,137,255,0.18);border-color:var(--accent)':''};${(!afford&&!isCurrent)?'opacity:.45':''}"
        ${(isCurrent||(!afford))?'disabled':''}
        onclick="hireExec('${role}',${t.tier})">
        <div style="font-weight:700">${t.title.split(' ')[0]}</div>
        <div style="color:var(--accent2);font-size:10.7px">${def.effect(t)}</div>
        <div style="color:var(--muted2);font-size:10.2px;margin-top:2px">$${t.hire}M sign · $${t.salary}M/mo</div>
        <div style="font-size:10.2px;margin-top:1px">${label}</div>
      </button>`;
    }).join('');
    return `<div style="background:rgba(0,0,0,0.22);border:1px solid var(--border);border-radius:9px;padding:13px 15px;margin-bottom:11px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
        <span class="qb-role-badge ${def.cls}" style="font-size:11.3px">${def.icon} ${def.short}</span>
        <span style="font-size:12.4px;color:var(--muted2)">${def.name}</span>
      </div>
      ${header}
      <div style="display:flex;gap:6px">${tierBtns}</div>
    </div>`;
  };
  document.getElementById('modal-content').innerHTML = modalHead('🏛 BOARD OF DIRECTORS') + `<div class="modal-body">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.3px;color:var(--muted);margin-bottom:12px">
      <span>Hire executives for permanent, passive advantages. They have your back every single month.</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <div class="city-stat-box" style="flex:1"><div class="csb-l">Seats Filled</div><div class="csb-v">${filled}/3</div></div>
      <div class="city-stat-box" style="flex:1"><div class="csb-l">Total Payroll</div><div class="csb-v" style="color:${salary>0?'var(--warn)':'var(--muted2)'}">$${salary.toFixed(1)}M/mo</div></div>
      <div class="city-stat-box" style="flex:1"><div class="csb-l">Cash</div><div class="csb-v" style="color:${STATE.cash>=0?'var(--accent)':'var(--loss)'}">$${STATE.cash.toFixed(0)}M</div></div>
    </div>
    ${slot('cfo')}
    ${slot('coo')}
    ${slot('strategy')}
    <div style="text-align:center;margin-top:6px">
      <button class="action-btn" onclick="closeModal()" style="padding:8px 28px">Close</button>
    </div>
  </div>`;
}
function breakevenLoad(r) {
  const plane = STATE.planes[r.plane] || AIRCRAFT[r.plane] || AIRCRAFT['A320'];
  const dist  = getDistance(r.from, r.to);
  const E     = ECON;
  const flightsMo = r.flights * E.weeksPerMonth;
  const seatsMo   = plane.seats * flightsMo;
  const effic     = 1 - (plane.fuel/220);
  const fixedFuel  = seatsMo * dist * E.fuelPerSeatMile * effic * STATE.fuelMod;
  const fixedCrew  = flightsMo*E.crewPerFlight + flightsMo*dist*E.crewPerMile;
  const fixedLease = plane.seats * r.flights * E.leasePerSeatMonth;
  const fixedTotal = fixedFuel + fixedCrew + fixedLease;
  const margin = r.fare - E.paxHandling;
  if (margin <= 0) return 100; // can never break even
  const bePax = fixedTotal / margin;
  const capacity = seatsMo;
  return Math.min(100, Math.round(bePax / capacity * 100));
}
function routeHints(r, res) {
  const plane  = STATE.planes[r.plane] || AIRCRAFT[r.plane] || AIRCRAFT['A320'];
  const dist   = getDistance(r.from, r.to);
  const cf     = CITIES[r.from] || {}, ct = CITIES[r.to] || {};
  const E      = ECON;
  const load   = res.load || 0;
  const be     = breakevenLoad(r);
  const profit = res.profit || 0;
  const rivals = STATE.competitors.filter(c=>c.regionsEntered.includes(ct.region)).length;
  const refFare= E.refFareBase + dist*E.refFareDist;
  const hints  = [];
  if (load < be) {
    hints.push({ sev:'danger', icon:'📉', text:`Load ${load}% is below your breakeven of ${be}% — you're flying too many empty seats.`,
      fix: load < be*0.6 ? 'Try fewer flights/week to right-size capacity.'
         : 'A small fare cut often unlocks latent demand and fills seats.' });
  }
  if (r.fare > refFare * 1.35) {
    hints.push({ sev:'warn', icon:'💸', text:`Fare $${r.fare} is ${Math.round((r.fare/refFare-1)*100)}% above the distance-reference of $${Math.round(refFare)}.`,
      fix: 'Elastic passengers avoid over-priced routes. Try $'+Math.round(refFare*1.1)+' to match market expectations.' });
  }
  if (r.fare < refFare * 0.6 && load > 85) {
    hints.push({ sev:'warn', icon:'🏷', text:`Seats sell out at $${r.fare} but you\'re leaving money on the table — demand far exceeds supply.`,
      fix: 'Raise the fare toward $'+Math.round(refFare*0.9)+' — you can afford to be selective.' });
  }
  if (dist > plane.range * 0.95) {
    hints.push({ sev:'danger', icon:'⚠', text:`${r.plane} range is ${plane.range}mi but this route is ${dist}mi — aircraft is over-stretched and operating inefficiently.`,
      fix: 'Assign a longer-range aircraft or reduce flights to contain fuel burn.' });
  }
  const effic = 1 - (plane.fuel/220);
  if (plane.fuel > 65 && res.fuel && res.fuel > res.revenue * 0.4) {
    hints.push({ sev:'warn', icon:'⛽', text:`Fuel burn eating ${Math.round(res.fuel/res.revenue*100)}% of revenue. ${r.plane} has a high fuel rating (${plane.fuel}%).`,
      fix: 'A more fuel-efficient aircraft (lower fuel %) would improve margins on this long sector.' });
  }
  if (STATE.fuelMod > 1.2) {
    hints.push({ sev:'warn', icon:'🛢', text:`Global fuel costs are running at +${Math.round((STATE.fuelMod-1)*100)}% due to a crisis event.`,
      fix: 'Wait for the crisis to pass or switch to your most fuel-efficient aircraft.' });
  }
  const leaseShare = res.lease / (res.cost || 1);
  if (leaseShare > 0.45 && load < 60) {
    hints.push({ sev:'warn', icon:'🛫', text:`Lease/financing is ${Math.round(leaseShare*100)}% of costs — ${r.plane} (${plane.seats} seats) is too large for this demand.`,
      fix: 'Downsize to a smaller aircraft or increase flights to utilize the seats.' });
  }
  if (rivals >= 2) {
    hints.push({ sev:'warn', icon:'⚔', text:`${rivals} rival airlines operate in ${ct.region} and are splitting the demand pool.`,
      fix: 'Expand service budget or run a targeted ad campaign to defend market share.' });
  }
  const rawDemand = (cf.pop+ct.pop)*E.demandPop + (cf.econ+ct.econ)*E.demandEcon + (cf.tourism+ct.tourism)*E.demandTour;
  const cap = plane.seats * r.flights * E.weeksPerMonth;
  if (rawDemand < cap * 0.5 && load < 50) {
    hints.push({ sev:'info', icon:'🏙', text:`Combined city stats (pop ${cf.pop+ct.pop}M, econ ${Math.round(cf.econ+ct.econ)}) generate limited base demand.`,
      fix: 'Grow city level with sustained service, or open this route with fewer weekly flights.' });
  }
  const crewShare = res.crew / (res.cost || 1);
  if (crewShare > 0.35 && r.flights > 10 && dist > 3000) {
    hints.push({ sev:'info', icon:'👨‍✈️', text:`Crew costs are ${Math.round(crewShare*100)}% of expenses. High frequency on a long route compounds crew costs.`,
      fix: 'Reduce weekly flights and fill seats at a higher fare instead.' });
  }
  if (profit > 0 && load > 70 && hints.length === 0) {
    hints.push({ sev:'good', icon:'✅', text:`Healthy load of ${load}% at $${r.fare} — this route is solidly profitable.`,
      fix: 'Consider growing frequency or upgrading to a larger aircraft if demand allows.' });
  }
  if (profit > 0 && load >= be && hints.length === 0) {
    hints.push({ sev:'good', icon:'📈', text:`Operating above breakeven (${be}%). Revenue covers all costs.`, fix:'' });
  }
  return hints;
}
function showRouteDetail(i) {
  const r = STATE.routes[i]; if (!r) return;
  openPnlModal(r);
}
function bidGate(from, to, cost, months, routeIdx) {
  if (STATE.cash < cost) return showFlash(`⚠ Need $${cost}M to bid`);
  STATE.cash -= cost;
  STATE.gateBids = STATE.gateBids || {};
  const key = from + '→' + to;
  STATE.gateBids[key] = (STATE.gateBids[key] || 0) + months;
  STATE.competitors.forEach(c => {
    c.routeList = (c.routeList||[]).filter(r =>
      !((r.from===from&&r.to===to)||(r.from===to&&r.to===from)));
  });
  addEvent('good', `🔒 Gate lock secured on ${from}→${to} for ${months} months ($${cost}M)`);
  showFlash(`✓ Rivals locked out of ${from}→${to}`);
  updateUI();
  const routeObj = STATE.routes.find(r => (r.from===from&&r.to===to)||(r.from===to&&r.to===from));
  if (routeObj) openPnlModal(routeObj);
}
function tickGateBids() {
  if (!STATE.gateBids) return;
  Object.keys(STATE.gateBids).forEach(key => {
    STATE.gateBids[key]--;
    if (STATE.gateBids[key] <= 0) {
      delete STATE.gateBids[key];
      addEvent('neutral', `🔓 Gate lock expired on ${key} — rivals may return.`);
    }
  });
}
function openAllianceModal() {
  const eligible = STATE.competitors.filter(c => !c.allied && c.cash > 0);
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-content').innerHTML = modalHead('✈ AIRLINE ALLIANCES') +
    `<div class="modal-body">
      <div style="font-size:11.3px;color:var(--muted);margin-bottom:12px;line-height:1.6">
        Form a codeshare alliance with a rival. They stop competing on your routes and share demand,
        giving you <b style="color:#fff">+15% load factor</b> on overlapping routes.
        Alliance lasts <b>12 months</b>.
      </div>
      ${!eligible.length ? '<div style="color:var(--muted);font-size:12.4px">No rivals available for alliance.</div>' :
        eligible.map((c,i) => {
          const fee = Math.round(c.pax * 0.0003 + 20);
          const initials = c.name.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
          const sharedRoutes = STATE.routes.filter(r =>
            (c.routeList||[]).some(rl => (rl.from===r.from&&rl.to===r.to)||(rl.from===r.to&&rl.to===r.from))
          ).length;
          return `<div class="fleet-item" style="margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:28px;height:28px;border-radius:50%;background:${c.color};display:flex;align-items:center;justify-content:center;font-size:12.4px;font-weight:700;color:#fff;flex-shrink:0">${initials}</div>
              <div>
                <div style="color:${c.color};font-weight:700">${c.name}</div>
                <div style="font-size:11.3px;color:var(--muted)">${c.routes} routes · ${c.regionsEntered.length} regions · ${sharedRoutes} shared with you</div>
              </div>
            </div>
            <button class="action-btn" style="padding:6px 12px;white-space:nowrap" onclick="formAlliance(${STATE.competitors.indexOf(c)},${fee})">
              Alliance — $${fee}M
            </button>
          </div>`;
        }).join('')
      }
      <button class="action-btn" style="width:100%;margin-top:4px;border-color:var(--border);color:var(--muted)" onclick="closeModal()">CANCEL</button>
    </div>`;
}
function formAlliance(rivalIdx, fee) {
  const c = STATE.competitors[rivalIdx];
  if (!c) return;
  if (STATE.cash < fee) return showFlash(`⚠ Need $${fee}M`);
  STATE.cash -= fee;
  c.allied = 12; // months remaining
  STATE._everAllied = true;
  const myPairs = new Set(STATE.routes.map(r => [r.from,r.to].sort().join('→')));
  c.routeList = (c.routeList||[]).filter(r => !myPairs.has([r.from,r.to].sort().join('→')));
  addEvent('good', `✈ Alliance formed with ${c.name} — codeshare active for 12 months.`);
  showFlash(`✓ Allied with ${c.name}`);
  closeModal(); updateUI();
}
function tickAlliances() {
  STATE.competitors.forEach(c => {
    if (c.allied > 0) {
      c.allied--;
      if (c.allied === 0) {
        delete c.allied;
        addEvent('warn', `✈ Alliance with ${c.name} has expired — competing again.`);
      }
    }
  });
}
function allianceBonus(r) {
  const alliedOnRoute = STATE.competitors.some(c =>
    c.allied > 0 && (c.routeList||[]).some(rl =>
      (rl.from===r.from&&rl.to===r.to)||(rl.from===r.to&&rl.to===r.from)));
  return alliedOnRoute ? 1.15 : 1;
}
function hubCongestionMult(hubName) {
  if (!STATE.hubs.includes(hubName)) return 1; // only applies to your hubs
  const used = hubGatesUsed(hubName);
  const cap  = hubGateCapacity(hubName);
  const pct  = cap > 0 ? used / cap : 0;
  if (pct < 0.70) return 1;
  if (pct < 0.85) return 1 + (pct - 0.70) / 0.15 * 0.12;
  if (pct < 0.95) return 1.12 + (pct - 0.85) / 0.10 * 0.18;
  return 1.30;
}
function destAirportCongestionMult(cityName) {
  const c = CITIES[cityName];
  if (!c) return 1;
  const competitorRoutesHere = STATE.competitors.reduce((n, comp) =>
    n + (comp.routeList||[]).filter(r => r.from === cityName || r.to === cityName).length, 0);
  const yourRoutes = STATE.routes.filter(r => r.from === cityName || r.to === cityName).length;
  const totalActivity = competitorRoutesHere + yourRoutes;
  const slotPressure = c.slots > 0 ? Math.min(1, totalActivity / (c.slots * 0.1)) : 0;
  if (slotPressure < 0.4) return 1;
  if (slotPressure < 0.7) return 1 + (slotPressure - 0.4) / 0.3 * 0.08;
  return 1 + 0.08 + (slotPressure - 0.7) / 0.3 * 0.12;
}
function hubGateCapacity(hubName) {
  const c = CITIES[hubName];
  return 16 + (c.level || 3) * 2 + ((STATE.gateBonus && STATE.gateBonus[hubName]) || 0);
}
function hubGatesUsed(hubName) {
  return STATE.routes.filter(r => r.from === hubName || r.to === hubName).length;
}
function hubGatesFree(hubName) {
  return Math.max(0, hubGateCapacity(hubName) - hubGatesUsed(hubName));
}
function openCargoModal() {
  document.getElementById('modal-overlay').classList.add('open');
  const myCargoRoutes = (STATE.cargoRoutes || []);
  const freighters = Object.entries(STATE.planes)
    .filter(([,p]) => p.owned > p.assigned)
    .map(([n,p]) => `<option value="${n}">${n} (${p.seats}s capacity)</option>`).join('');
  document.getElementById('modal-content').innerHTML = modalHead('📦 CARGO ROUTES') +
    `<div class="modal-body">
      <div style="font-size:11.3px;color:var(--muted);margin-bottom:12px;line-height:1.6">
        Cargo routes run on economic corridors — high-econ city pairs. Revenue scales with city GDP,
        not tourism. Use your spare aircraft capacity.
      </div>
      ${myCargoRoutes.length ? `
        <div style="font-size:11.3px;letter-spacing:1px;color:var(--muted);margin-bottom:8px">ACTIVE CARGO ROUTES</div>
        ${myCargoRoutes.map((cr,idx) => {
          const cf = CITIES[cr.from], ct = CITIES[cr.to];
          const monthlyRev = cf && ct ? Math.round((cf.econ+ct.econ)*cr.flights*0.8) / 10 : 0;
          return `<div class="fleet-item" style="margin-bottom:6px">
            <div>
              <div style="font-weight:600;color:var(--accent2)">📦 ${cr.from} → ${cr.to}</div>
              <div style="font-size:11.3px;color:var(--muted)">${cr.plane} · ${cr.flights}f/wk · $${monthlyRev.toFixed(1)}M/mo</div>
            </div>
            <button class="action-btn danger" style="padding:5px 10px" onclick="closeCargoRoute(${idx})">CLOSE</button>
          </div>`;
        }).join('')}
        <hr style="border-color:var(--border);margin:12px 0">` : ''}
      <div style="font-size:11.3px;letter-spacing:1px;color:var(--muted);margin-bottom:8px">OPEN NEW CARGO ROUTE</div>
      ${!freighters ? `<div style="background:rgba(255,200,0,0.07);border:1px solid var(--warn);border-radius:6px;padding:10px 12px;text-align:center">
        <div style="color:var(--warn);font-size:11.9px;margin-bottom:8px">⚠ No free aircraft — buy or free up a plane first.</div>
        <button class="action-btn" style="width:100%;border-color:var(--accent);color:#fff" onclick="closeModal();openModal('buy-planes')">✈ Buy Aircraft</button>
      </div>` : `
        <div class="form-row"><label class="form-label">From (Hub)</label>
          <select id="cg-from">${STATE.hubs.map(h=>`<option value="${h}">${h}</option>`).join('')}</select></div>
        <div class="form-row"><label class="form-label">To (Economic Hub)</label>
          <select id="cg-to">${Object.entries(CITIES).filter(([,c])=>c.econ>=60).sort(([,a],[,b])=>b.econ-a.econ).map(([n,c])=>`<option value="${n}">${n} — econ ${Math.round(c.econ)} (${c.region})</option>`).join('')}</select></div>
        <div class="form-row"><label class="form-label">Aircraft</label>
          <select id="cg-plane">${freighters}</select></div>
        <div class="form-row"><label class="form-label">Flights/Wk: <span id="cgf-v">3</span></label>
          <input type="range" id="cg-flights" min="1" max="14" value="3" oninput="document.getElementById('cgf-v').textContent=this.value"></div>
        <button class="action-btn success" onclick="openCargoRoute()" style="margin-top:8px">OPEN CARGO ROUTE ✓</button>
      `}
    </div>`;
}
function openCargoRoute() {
  const from = val('cg-from'), to = val('cg-to'), plane = val('cg-plane');
  const flights = +val('cg-flights') || 3;
  if (!from||!to||!plane||from===to) return showFlash('Invalid cargo route');
  const isDupe = (STATE.cargoRoutes||[]).some(r=>(r.from===from&&r.to===to)||(r.from===to&&r.to===from));
  if (isDupe) return showFlash('⚠ Cargo route already exists between these cities');
  const dist = getDistance(from, to);
  const ac = STATE.planes[plane];
  if (!ac || dist > ac.range) return showFlash('⚠ Aircraft range too short');
  const cost = Math.round(dist * 0.02 + 3);
  if (STATE.cash < cost) return showFlash(`⚠ Need $${cost}M to open`);
  if (!STATE.planes[plane] || STATE.planes[plane].assigned >= STATE.planes[plane].owned)
    return showFlash('⚠ No free aircraft');
  STATE.cash -= cost;
  STATE.planes[plane].assigned++;
  STATE.cargoRoutes = STATE.cargoRoutes || [];
  STATE.cargoRoutes.push({ from, to, plane, flights, _age: 0 });
  addEvent('good', `📦 Cargo route ${from}→${to} opened.`);
  showFlash(`✓ Cargo route ${from}→${to} launched`);
  closeModal(); updateUI();
}
function closeCargoRoute(idx) {
  const cr = (STATE.cargoRoutes||[])[idx]; if (!cr) return;
  if (STATE.planes[cr.plane]) STATE.planes[cr.plane].assigned = Math.max(0, STATE.planes[cr.plane].assigned - 1);
  STATE.cargoRoutes.splice(idx, 1);
  addEvent('neutral', `📦 Cargo route closed.`);
  closeModal(); updateUI();
}
function processCargoRoutes() {
  let totalIncome = 0;
  (STATE.cargoRoutes || []).forEach(cr => {
    const cf = CITIES[cr.from], ct = CITIES[cr.to]; if (!cf||!ct) return;
    const dist = getDistance(cr.from, cr.to);
    let demand = (cf.econ + ct.econ) * 380 * cr.flights * ECON.weeksPerMonth;
    demand *= 1 / (1 + dist / 12000); // cargo less distance-sensitive than pax
    (STATE.timedEffects||[]).forEach(e => {
      if (e.fx==='recession') demand *= 0.85;
      if (e.fx==='pandemic') demand *= 0.6;
      if (e.fx==='macro_boom') demand *= 1.1;
    });
    demand *= 0.9 + Math.random() * 0.2;
    const revenue = demand / 1e6; // $M
    const fuelCost = (AIRCRAFT[cr.plane]?.fuel||60)/100 * dist * cr.flights * ECON.weeksPerMonth * 0.04 / 1e6;
    const crewCost = cr.flights * ECON.weeksPerMonth * ECON.crewPerFlight / 1e6 * 0.7;
    const profit = revenue - fuelCost - crewCost;
    cr.profit = Math.round(profit * 100) / 100;
    cr._age = (cr._age||0) + 1;
    totalIncome += profit;
  });
  return totalIncome;
}
function refreshRouteDetail(i) {
  clearTimeout(refreshRouteDetail._t);
  refreshRouteDetail._t = setTimeout(() => showRouteDetail(i), 80);
}
function reassignAircraft(routeIdx, newPlaneName) {
  const r = STATE.routes[routeIdx]; if (!r) return;
  const newPlane = STATE.planes[newPlaneName];
  if (!newPlane) return showFlash('Aircraft not in fleet');
  const dist = getDistance(r.from, r.to);
  if (dist > (AIRCRAFT[newPlaneName]?.range || newPlane.range)) return showFlash(`⚠ ${newPlaneName} range too short for this route (${dist}mi)`);
  const list = (r.planes && r.planes.length) ? r.planes : [{ type:r.plane, flights:r.flights||1 }];
  const totalFlights = list.reduce((s,e)=>s+e.flights, 0);
  // copies that become free once this route releases what it already holds of newPlaneName
  const heldOfNew = list.filter(e=>e.type===newPlaneName).reduce((s,e)=>s+e.flights, 0);
  const freeAfterRelease = (newPlane.owned - newPlane.assigned) + heldOfNew;
  if (freeAfterRelease < totalFlights) return showFlash(`⚠ Need ${totalFlights} free ${newPlaneName} (only ${freeAfterRelease} available)`);
  releaseRouteAirframes(r);                 // hand all current airframes back
  newPlane.assigned += totalFlights;        // re-assign the whole route to the new type
  r.planes  = [{ type:newPlaneName, flights:totalFlights }];
  r.plane   = newPlaneName;
  r.flights = totalFlights;
  addEvent('neutral', `Swapped ${r.from}→${r.to} to ${totalFlights}× ${newPlaneName}`);
  showFlash(`✓ Route now flying ${totalFlights}× ${newPlaneName}`);
  openPnlModal(r);
  renderFleet(); updateUI();
}
function closeRoute(i){
  const r=STATE.routes[i], refund=Math.round(getDistance(r.from,r.to)*0.012+2);
  STATE.cash+=refund;
  releaseRouteAirframes(r);
  addEvent('neutral',`Closed ${r.from}→${r.to}, refunded $${refund}M`);
  STATE.routes.splice(i,1);
  closeModal(); renderMap(); renderRoutesList(); renderFleet(); updateUI();
}
function val(id){ const e=document.getElementById(id); return e?e.value:null; }
const SAVE_SLOTS = 5;          // named save slots (0 = autosave)
const SAVE_KEY   = n => `ae_save_${n}`;  // localStorage keys
function slotMeta(n) {
  try {
    const raw = localStorage.getItem(SAVE_KEY(n));
    if (!raw) return null;
    const o = JSON.parse(raw);
    const s = o.state;
    return {
      label:   o.label || (n === 0 ? 'Autosave' : `Slot ${n}`),
      co:      s.coName || '?',
      year:    s.year   || '?',
      month:   MONTHS[s.month] || '?',
      cash:    Math.round(s.cash || 0),
      routes:  (s.routes||[]).length,
      ts:      o.ts ? new Date(o.ts).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '?',
    };
  } catch(e) { return null; }
}
function buildSettings() {
  const modes = [['off','Off','Manual'],['relaxed','Relaxed','3½ min'],['normal','Normal','2 min'],['fast','Fast','60s'],['turbo','Turbo','25s']];
  const auto = slotMeta(0);
  const slots = Array.from({length: SAVE_SLOTS}, (_,i) => {
    const n = i + 1;
    const m = slotMeta(n);
    return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          ${m ? `
            <div style="font-size:12.4px;font-weight:700;color:var(--text)">${m.co} · ${m.month} ${m.year}</div>
            <div style="font-size:11.3px;color:var(--muted);margin-top:2px">$${m.cash}M · ${m.routes} routes · ${m.ts}</div>
          ` : `<div style="font-size:12.4px;color:var(--muted2)">— Empty slot ${n} —</div>`}
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0">
          <button class="action-btn success" style="padding:6px 10px;font-size:11.3px" onclick="saveToSlot(${n})">💾</button>
          ${m ? `<button class="action-btn" style="padding:6px 10px;font-size:11.3px" onclick="loadFromSlot(${n})">▶</button>` : ''}
          ${m ? `<button class="action-btn danger" style="padding:6px 8px;font-size:11.3px" onclick="deleteSlot(${n})">✕</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  const revertSlots = ['ae_revert_1','ae_revert_2','ae_revert_3'].map((key,i) => {
    try {
      const raw = localStorage.getItem(key); if (!raw) return null;
      const o = JSON.parse(raw); const s = o.state;
      return { key, label:`${MONTHS[s.month]} ${s.year}`, co:s.coName, cash:Math.round(s.cash||0), routes:(s.routes||[]).length, ts:o.ts?new Date(o.ts).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'?' };
    } catch(e) { return null; }
  }).filter(Boolean);
  const revertHtml = revertSlots.length ? revertSlots.map(r =>
    `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:7px;margin-bottom:5px">
      <div style="flex:1;min-width:0">
        <div style="font-size:11.3px;font-weight:600;color:var(--text)">${r.co} · ${r.label}</div>
        <div style="font-size:10.7px;color:var(--muted)">$${r.cash}M · ${r.routes} routes · ${r.ts}</div>
      </div>
      <button class="action-btn" style="padding:5px 10px;font-size:11.3px;border-color:var(--warn);color:var(--warn)" onclick="revertTo('${r.key}')">↩ Revert</button>
    </div>`
  ).join('') : `<div style="font-size:11.3px;color:var(--muted2);padding:8px 0">No revert points yet — they're created automatically each turn.</div>`;
  const qs = slotMeta('q');
  const qsRow = `<div style="background:rgba(167,137,255,0.05);border:1px solid rgba(167,137,255,0.3);border-radius:8px;padding:10px 12px;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          ${qs ? `
            <div style="font-size:12.4px;font-weight:700;color:#fff">⚡ Quicksave · ${qs.co} · ${qs.month} ${qs.year}</div>
            <div style="font-size:11.3px;color:var(--muted);margin-top:2px">$${qs.cash}M · ${qs.routes} routes · ${qs.ts} · hotkeys Q / L</div>
          ` : `<div style="font-size:12.4px;color:var(--muted2)">⚡ Quicksave — press <b style="color:#fff">Q</b> in game (load with <b style="color:#fff">L</b>)</div>`}
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0">
          <button class="action-btn success" style="padding:6px 10px;font-size:11.3px" onclick="qsave();document.getElementById('modal-content').innerHTML=buildSettings()">💾</button>
          ${qs ? `<button class="action-btn" style="padding:6px 10px;font-size:11.3px" onclick="loadFromSlot('q')">▶</button>` : ''}
          ${qs ? `<button class="action-btn danger" style="padding:6px 8px;font-size:11.3px" onclick="deleteSlot('q')">✕</button>` : ''}
        </div>
      </div>
    </div>`;
  const section = (label, first) => `<div style="display:flex;align-items:center;gap:9px;margin:${first?'0':'20px'} 0 11px"><span style="font-size:10.7px;font-weight:700;letter-spacing:1.5px;color:var(--accent2);white-space:nowrap">${label}</span><div style="flex:1;height:1px;background:var(--border)"></div></div>`;
  return modalHead('⚙ MENU') + `<div class="modal-body">
    ${section('💾 SAVE &amp; LOAD', true)}
    ${qsRow}
    ${slots}
    <div style="display:flex;gap:6px;margin:4px 0 6px">
      <button class="action-btn" style="flex:1" onclick="exportSave()">⬇ Export to file</button>
      <button class="action-btn" style="flex:1" onclick="document.getElementById('import-file').click()">⬆ Import file</button>
      <input type="file" id="import-file" accept=".json,application/json" style="display:none" onchange="importSave(this)">
    </div>
    ${auto ? `<div style="font-size:11.3px;color:var(--muted2)">Autosave: ${auto.co} · ${auto.month} ${auto.year} · $${auto.cash}M</div>` : ''}
    ${section('↩ CHECKPOINTS')}
    ${revertHtml}
    ${section('⏱ GAMEPLAY')}
    <div style="font-size:11.3px;color:var(--muted);margin-bottom:7px">Turn timer — how long each month runs before it auto-advances.</div>
    <div style="display:flex;gap:6px">
      ${modes.map(([k,n,d])=>`<button class="action-btn ${STATE.timerMode===k?'success':''}" style="padding:9px 4px;flex:1" onclick="setTimerMode('${k}')">
        <div style="font-weight:700">${n}</div><div style="font-size:11.3px;color:var(--muted)">${d}</div></button>`).join('')}
    </div>
    ${section('⚠ DANGER ZONE')}
    <button class="action-btn danger" style="width:100%" onclick="closeModal();location.reload();">⏏ End Game &amp; Return to Menu</button>
  </div>`;
}
function saveToSlot(n) {
  try {
    const label = n === 'q' ? 'Quicksave' : n === 0 ? 'Autosave' : `Slot ${n}`;
    const data = { v:2, ts:Date.now(), label, state:{...STATE, timerInterval:null}, cities:CITIES };
    localStorage.setItem(SAVE_KEY(n), JSON.stringify(data));
    showFlash(`✓ Saved to ${label}`);
    // only refresh the menu if it's actually open — don't clobber other dialogs
    const ov = document.getElementById('modal-overlay');
    if (ov && ov.classList.contains('open') && document.querySelector('#modal-content .modal-body'))
      document.getElementById('modal-content').innerHTML = buildSettings();
  } catch(e) { showFlash('⚠ Save failed — browser storage may be full'); }
}
function qsave() {
  if (STATE.gameOver) return showFlash('Game over — nothing to save');
  try {
    const data = { v:2, ts:Date.now(), label:'Quicksave', state:{...STATE, timerInterval:null}, cities:CITIES };
    localStorage.setItem(SAVE_KEY('q'), JSON.stringify(data));
    showFlash('💾 Quick saved — Q to save · L to load');
  } catch(e) { showFlash('⚠ Quick save failed — browser storage may be full'); }
}
function qload() {
  if (!localStorage.getItem(SAVE_KEY('q'))) return showFlash('No quicksave yet — press Q to create one');
  loadFromSlot('q');
}
function saveAndQuit() {
  if (STATE.gameOver) { location.reload(); return; }
  qsave();
  showFlash('💾 Saved — returning to menu…');
  setTimeout(() => location.reload(), 350);
}
// In-game hotkeys: Q = quick save, L = quick load (ignored while typing or on menus)
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  const intro = document.getElementById('intro'), setup = document.getElementById('setup');
  const onMenus = (intro && !intro.classList.contains('hidden')) || (setup && !setup.classList.contains('hidden'));
  if (onMenus || !STATE || !STATE.coName || STATE.gameOver) return;
  const k = (e.key || '').toLowerCase();
  if (k === 'q') { e.preventDefault(); qsave(); }
  else if (k === 'l') { e.preventDefault(); qload(); }
  else if (k === 's') { e.preventDefault(); saveAndQuit(); }
});
function loadFromSlot(n) {
  try {
    const raw = localStorage.getItem(SAVE_KEY(n));
    if (!raw) return showFlash('Slot is empty');
    applySave(raw); closeModal(); showFlash(n === 'q' ? '✓ Quicksave loaded' : '✓ Loaded');
    const _co = document.getElementById('cont-ovl'); if (_co) _co.remove();
  } catch(e) { showFlash('⚠ Load failed'); }
}
function deleteSlot(n) {
  localStorage.removeItem(SAVE_KEY(n));
  document.getElementById('modal-content').innerHTML = buildSettings();
}
function revertTo(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return showFlash('Revert point not found');
    applySave(raw); closeModal(); showFlash('✓ Reverted');
  } catch(e) { showFlash('⚠ Revert failed'); }
}
function pushRevertPoint() {
  try {
    const r2 = localStorage.getItem('ae_revert_1');
    const r3 = localStorage.getItem('ae_revert_2');
    if (r3) localStorage.setItem('ae_revert_3', r3);
    if (r2) localStorage.setItem('ae_revert_2', r2);
    const data = { v:2, ts:Date.now(), label:'Revert', state:{...STATE, timerInterval:null}, cities:CITIES };
    localStorage.setItem('ae_revert_1', JSON.stringify(data));
  } catch(e) {
    showFlash('⚠ Revert point failed — storage full. Export a save to free space.');
  }
}
function quickSave() {
  saveToSlot(0);
}
function quickLoad(){
  try{
    const s=localStorage.getItem(SAVE_KEY(0));
    if(!s){ showFlash('No autosave found'); return; }
    applySave(s); closeModal(); showFlash('✓ Autosave loaded');
  }catch(e){ showFlash('⚠ Load failed'); }
}
function openContinueMenu(){
  let ovl = document.getElementById('cont-ovl');
  if (ovl) ovl.remove();
  const entries = [];
  const push = (n, fallback) => { const m = slotMeta(n); if (m) entries.push({ n, m, ts: m._raw || 0 }); };
  // gather autosave, quicksave, and the 5 slots with raw timestamps for ordering
  ['q', 0, 1, 2, 3, 4, 5].forEach(n => {
    try {
      const raw = localStorage.getItem(SAVE_KEY(n)); if (!raw) return;
      const o = JSON.parse(raw); const m = slotMeta(n); if (!m) return;
      entries.push({ n, m, ts: o.ts || 0 });
    } catch(e) {}
  });
  entries.sort((a,b) => b.ts - a.ts);
  const rows = entries.slice(0, 7).map(e => `
    <div style="display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:11px 13px;margin-bottom:7px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13.6px;font-weight:700;color:var(--text)">${e.m.label} <span style="color:var(--muted2);font-weight:400">— ${e.m.co}</span></div>
        <div style="font-size:10.7px;color:var(--muted);margin-top:2px">${e.m.month} ${e.m.year} · $${e.m.cash}M · ${e.m.routes} routes · ${e.m.ts}</div>
      </div>
      <button class="action-btn success" style="padding:8px 18px;font-size:12.4px;flex-shrink:0" onclick="contLoad('${e.n}')">▶ LOAD</button>
    </div>`).join('');
  ovl = document.createElement('div');
  ovl.id = 'cont-ovl';
  ovl.style.cssText = 'position:fixed;inset:0;z-index:9995;background:rgba(0,0,0,0.78);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px';
  ovl.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border2);border-radius:12px;max-width:520px;width:100%;max-height:80vh;display:flex;flex-direction:column;padding:22px 24px;box-shadow:var(--shadow)" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-shrink:0">
      <div style="font-family:'Bebas Neue';font-size:24.9px;letter-spacing:3px;color:#fff">↻ CONTINUE</div>
      <button class="action-btn" style="padding:5px 14px" onclick="document.getElementById('cont-ovl').remove()">✕ Close</button>
    </div>
    <div style="overflow-y:auto;min-height:0">
      ${rows || '<div style="color:var(--muted);font-size:12.4px;text-align:center;padding:18px 0">No saved games yet.</div>'}
    </div>
    <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:12px;flex-shrink:0">
      <button class="action-btn" style="width:100%;padding:10px" onclick="document.getElementById('intro-import-file').click()">⤓ Import a game save from file</button>
    </div>
  </div>`;
  ovl.onclick = () => ovl.remove();
  document.body.appendChild(ovl);
}
function contLoad(n){
  if (n !== 'q') n = +n;
  loadFromSlot(n);
  // if the load went through, the game UI took over — drop the picker
  const intro = document.getElementById('intro');
  if (intro && intro.classList.contains('hidden')) {
    const o = document.getElementById('cont-ovl'); if (o) o.remove();
  }
}
function applySave(str){
  const o=JSON.parse(str);
  if(!o || !o.state) throw new Error('bad save');
  clearInterval(STATE.timerInterval);
  STATE = Object.assign(defaultState(), o.state);  // merge over defaults: saved values win, fields newer than the save are backfilled (prevents render crashes on older saves)
  STATE.timerInterval = null;
  STATE._panInit = true;            // listeners already bound to the live <svg>
  STATE.paused = false;
  // Ensure crew pool exists and counter is synced
  if (!STATE.crew) { STATE.crew = []; STATE.crewIncidents = []; STATE._crewMoraleCache = 1; }
  _syncCrewIdCounter();
  // Fleet wear migration: pre-wear saves have no acquisition year — start the
  // wear clock now (heritage still applies immediately via design age).
  Object.values(STATE.planes||{}).forEach(p=>{ if(p && p._acqYear==null) p._acqYear = STATE.year||2024; });
  if(o.cities) Object.entries(o.cities).forEach(([n,c])=>{ if(CITIES[n]) Object.assign(CITIES[n],c); });
  // Drop references to cities removed from the roster (older saves)
  STATE.routes = (STATE.routes||[]).filter(r => CITIES[r.from] && CITIES[r.to]);
  STATE.hubs   = (STATE.hubs||[]).filter(h => CITIES[h]);
  if (!CITIES[STATE.homeBase]) STATE.homeBase = STATE.hubs[0] || 'Chicago';
  if (!STATE.hubs.length) STATE.hubs = [STATE.homeBase];
  const doRender=()=>{
    document.getElementById('intro').classList.add('hidden');
    document.getElementById('setup').classList.add('hidden');
    const _lb = document.getElementById('logo-badge'); if (_lb) _lb.innerHTML = window.airlineLogoImg ? window.airlineLogoImg(STATE.logoId, 'header-airline-logo', STATE.coName + ' logo') : (STATE.logo||'✈');
    const _tl = (GAME_TYPES.find(g=>g.id===STATE.gameType)||{}).name || 'Scenario';
    const _bc = document.getElementById('brand-co'); if (_bc) _bc.textContent = `${STATE.coName} · ${STATE.homeBase.toUpperCase()} · ${_tl.toUpperCase()}`;
    renderRegionTabs(); renderMap(); applyPan(); updateUI();
    renderRankings(); renderFleet(); renderRivals(); renderHubsList(); renderRoutesList(); renderGoalProgress(); renderEventsList();
    updatePauseUI();
    startTimer();
    // Defer a second applyPan to guarantee map is visible after DOM paint
    requestAnimationFrame(()=>{ setTimeout(()=>{ applyPan(); }, 50); });
  };
  if(!document.getElementById('intro').classList.contains('hidden')){
    enterGame('intro', doRender);
  } else {
    document.getElementById('game-ui').classList.remove('hidden');
    { const dtl = document.getElementById('dt-launch'); if (dtl) dtl.classList.remove('dt-gone'); }
    doRender();
  }
}
function logFinance(income, expenses, profit, bizIncome, cargoIncome, monthPax){
  if (typeof recalcCompanyValue === 'function') recalcCompanyValue();
  STATE.financeLog = STATE.financeLog || [];
  const r2 = x => Math.round((x||0)*100)/100;
  const sum = k => (STATE.routes||[]).reduce((s,r)=>s+(r['_'+k]||0),0);
  STATE.financeLog.push({
    absMonth: STATE._absMonth||0,
    label: `${MONTHS[STATE.month]} ${STATE.year}`,
    month: STATE.month, year: STATE.year,
    cash: r2(STATE.cash), value: Math.round(STATE.companyValue||0), loan: r2(STATE.loan||0),
    income: r2(income), expenses: r2(expenses), profit: r2(profit),
    routeRev: r2(income - (bizIncome||0) - (cargoIncome||0)),
    biz: r2(bizIncome), cargo: r2(cargoIncome||0), pax: Math.round(monthPax||0),
    fuel: r2(sum('fuel')), crew: r2(sum('crew')), handling: r2(sum('handling')), lease: r2(sum('lease')),
  });
  if (STATE.financeLog.length > 600) STATE.financeLog.shift();
}
function buildLedger(){
  const log = STATE.financeLog || [];
  const sgn = v => (v>=0?'+':'') + (Math.round(v*10)/10);
  const pc  = v => v>=0 ? 'var(--profit)' : 'var(--loss)';
  const cols = '1.1fr .9fr .9fr .9fr .8fr .8fr .7fr';
  const head = `<div style="display:grid;grid-template-columns:${cols};gap:2px;padding:7px 11px;font-size:10.2px;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border);background:rgba(255,255,255,0.02)">
      <span>MONTH</span><span style="text-align:right">INCOME</span><span style="text-align:right">EXPENSE</span><span style="text-align:right">PROFIT</span><span style="text-align:right">CASH</span><span style="text-align:right">VALUE</span><span style="text-align:right">LOAN</span></div>`;
  const rows = [...log].reverse().map(e=>`
    <div style="display:grid;grid-template-columns:${cols};gap:2px;padding:6px 11px;border-bottom:1px solid rgba(255,255,255,0.04)">
      <span style="font-size:11.9px;color:var(--text)">${e.label}</span>
      <span style="text-align:right;font-family:'DM Mono';font-size:11.9px">${Math.round(e.income*10)/10}</span>
      <span style="text-align:right;font-family:'DM Mono';font-size:11.9px">${Math.round(e.expenses*10)/10}</span>
      <span style="text-align:right;font-family:'DM Mono';font-size:11.9px;color:${pc(e.profit)}">${sgn(e.profit)}</span>
      <span style="text-align:right;font-family:'DM Mono';font-size:11.9px;color:${e.cash>=0?'var(--text)':'var(--loss)'}">${Math.round(e.cash)}</span>
      <span style="text-align:right;font-family:'DM Mono';font-size:11.9px">${Math.round(e.value)}</span>
      <span style="text-align:right;font-family:'DM Mono';font-size:11.9px;color:${e.loan>0?'var(--loss)':'var(--muted2)'}">${Math.round(e.loan)}</span>
    </div>`).join('');
  const table = log.length
    ? `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:10px">${head}<div style="max-height:260px;overflow-y:auto">${rows}</div></div>`
    : `<div style="color:var(--muted);font-size:12.4px;padding:18px 0;text-align:center">No finance data yet — advance at least one month to start the log.</div>`;
  return modalHead(`📒 FINANCIAL LOG — ${MONTHS[STATE.month]} ${STATE.year}`) +
  `<div class="modal-body">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
      <div class="city-stat-box"><div class="csb-l">Cash</div><div class="csb-v" style="color:${STATE.cash>=0?'var(--accent)':'var(--loss)'}">$${Math.round(STATE.cash)}M</div></div>
      <div class="city-stat-box"><div class="csb-l">YTD Profit</div><div class="csb-v" style="color:${(STATE.profitThisYear||0)>=0?'var(--profit)':'var(--loss)'}">$${sgn(STATE.profitThisYear||0)}M</div></div>
      <div class="city-stat-box"><div class="csb-l">Value</div><div class="csb-v">$${Math.round(STATE.companyValue||0)}M</div></div>
      <div class="city-stat-box"><div class="csb-l">Months</div><div class="csb-v">${log.length}</div></div>
    </div>
    ${table}
    <div style="font-size:11.3px;color:var(--muted2);margin-bottom:12px">Figures in $M. Exports include route revenue, business, cargo, fuel, crew, handling, lease, and passengers for every month.</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap">
      <button class="action-btn" style="flex:1;min-width:128px;padding:8px;font-size:11.3px" onclick="exportFinanceCSV()">⬇ Finances CSV</button>
      <button class="action-btn" style="flex:1;min-width:128px;padding:8px;font-size:11.3px" onclick="exportFinanceJSON()">⬇ Finances JSON</button>
      <button class="action-btn" style="flex:1;min-width:128px;padding:8px;font-size:11.3px" onclick="exportEventLogCSV()">⬇ Event Log CSV</button>
      <button class="action-btn" style="flex:1;min-width:128px;padding:8px;font-size:11.3px" onclick="exportEventLogJSON()">⬇ Event Log JSON</button>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="action-btn" onclick="closeModal()" style="padding:8px 28px">Close</button></div>
  </div>`;
}
function buildLogViewer(){
  const finBtns = `<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px">
      <button class="action-btn" style="flex:1;min-width:128px;padding:8px;font-size:11.3px" onclick="exportFinanceCSV()">\u2b07 Finances CSV</button>
      <button class="action-btn" style="flex:1;min-width:128px;padding:8px;font-size:11.3px" onclick="exportFinanceJSON()">\u2b07 Finances JSON</button>
      <button class="action-btn" style="flex:1;min-width:128px;padding:8px;font-size:11.3px" onclick="exportEventLogCSV()">\u2b07 Event Log CSV</button>
      <button class="action-btn" style="flex:1;min-width:128px;padding:8px;font-size:11.3px" onclick="exportEventLogJSON()">\u2b07 Event Log JSON</button>
    </div>`;
  return modalHead(`\ud83d\uddc2 GAME LOGS \u2014 ${MONTHS[STATE.month]} ${STATE.year}`) +
  `<div class="modal-body">
    <div style="display:flex;gap:6px;margin-bottom:10px">
      <button class="action-btn lv-tab" id="lv-tab-fin" onclick="lvShow('fin')" style="flex:1;padding:8px;font-size:11.9px;letter-spacing:.08em">\ud83d\udcb0 FINANCES</button>
      <button class="action-btn lv-tab" id="lv-tab-ev" onclick="lvShow('ev')" style="flex:1;padding:8px;font-size:11.9px;letter-spacing:.08em;opacity:.55">\ud83d\udce3 EVENTS</button>
    </div>
    <div id="lv-pane-fin">${lvFinanceHTML()}</div>
    <div id="lv-pane-ev" style="display:none">${lvEventsWrapHTML()}</div>
    ${finBtns}
    <div style="text-align:center;margin-top:14px"><button class="action-btn" onclick="closeModal()" style="padding:8px 28px">Close</button></div>
  </div>`;
}
function lvShow(which){
  const fin = which==='fin';
  const pf=document.getElementById('lv-pane-fin'), pe=document.getElementById('lv-pane-ev');
  const tf=document.getElementById('lv-tab-fin'), te=document.getElementById('lv-tab-ev');
  if(pf) pf.style.display = fin?'':'none';
  if(pe) pe.style.display = fin?'none':'';
  if(tf) tf.style.opacity = fin?'1':'.55';
  if(te) te.style.opacity = fin?'.55':'1';
}
function lvFinanceHTML(){
  const log = STATE.financeLog || [];
  if(!log.length) return `<div style="color:var(--muted);font-size:12.4px;padding:18px 0;text-align:center">No finance data yet \u2014 advance at least one month to start the log.</div>`;
  const cols=[['label','MONTH','left'],['income','INCOME','right'],['expenses','EXPENSES','right'],['profit','PROFIT','right'],['routeRev','ROUTE REV','right'],['biz','BIZ','right'],['cargo','CARGO','right'],['fuel','FUEL','right'],['crew','CREW','right'],['handling','HANDLING','right'],['lease','LEASE','right'],['cash','CASH','right'],['value','VALUE','right'],['loan','LOAN','right'],['pax','PAX','right']];
  const grid = `minmax(84px,1.2fr) repeat(${cols.length-1},minmax(62px,1fr))`;
  const head = `<div style="display:grid;grid-template-columns:${grid};gap:2px;padding:7px 11px;font-size:9.6px;color:var(--muted2);letter-spacing:.5px;border-bottom:1px solid var(--border);background:rgba(255,255,255,0.02);min-width:1020px">` +
    cols.map(c=>`<span style="text-align:${c[2]}">${c[1]}</span>`).join('') + `</div>`;
  const sgn = v => (v>=0?'+':'') + (Math.round(v*10)/10);
  const rows = [...log].reverse().map(e=>{
    return `<div style="display:grid;grid-template-columns:${grid};gap:2px;padding:6px 11px;border-bottom:1px solid rgba(255,255,255,0.04);min-width:1020px">` + cols.map(c=>{
      const k=c[0]; let v=e[k];
      if(k==='label') return `<span style="font-size:11.3px;color:var(--text)">${v}</span>`;
      if(k==='profit') return `<span style="text-align:right;font-family:'DM Mono';font-size:11.3px;color:${v>=0?'var(--profit)':'var(--loss)'}">${sgn(v||0)}</span>`;
      if(k==='pax'||k==='value') return `<span style="text-align:right;font-family:'DM Mono';font-size:11.3px">${Math.round(v||0)}</span>`;
      const neg = (k==='loan'&&v>0)||((k==='cash')&&v<0);
      return `<span style="text-align:right;font-family:'DM Mono';font-size:11.3px;color:${neg?'var(--loss)':'inherit'}">${Math.round((v||0)*10)/10}</span>`;
    }).join('') + `</div>`;
  }).join('');
  return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;overflow:auto;max-height:340px">${head}${rows}</div>
    <div style="font-size:11.3px;color:var(--muted2);margin-top:7px">All figures in $M \u00b7 every column from the CSV export, per month \u00b7 scroll sideways for more. INCOME = ROUTE REV + BIZ + CARGO \u00b7 PROFIT = INCOME \u2212 EXPENSES \u00b7 FUEL/CREW/HANDLING/LEASE are the route-cost components inside EXPENSES.</div>`;
}
function lvEventsWrapHTML(){
  const chips=['all','good','bad','warn','rival'];
  const chip = t => `<button class="action-btn lv-evf" data-f="${t}" onclick="lvFilterEvents('${t}')" style="flex:0 0 auto;width:auto;padding:5px 12px;font-size:10.7px;letter-spacing:.08em;${t==='all'?'':'opacity:.55'}">${t.toUpperCase()}</button>`;
  return `<div style="display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap">${chips.map(chip).join('')}</div>
    <div id="lv-ev-list">${lvEventsHTML('all')}</div>`;
}
function lvEventsHTML(filter){
  const L = (STATE.eventLog && STATE.eventLog.length ? STATE.eventLog : (STATE.events||[]));
  const list = [...L].reverse().filter(e=>filter==='all'||e.type===filter);
  if(!list.length) return `<div style="color:var(--muted);font-size:12.4px;padding:18px 0;text-align:center">No events${filter==='all'?'':' of this type'} yet.</div>`;
  const col={good:'var(--profit)',bad:'var(--loss)',warn:'var(--accent2)',rival:'var(--purple)'};
  const rows=list.map(e=>`<div style="display:grid;grid-template-columns:74px 52px 1fr;gap:8px;padding:5px 11px;border-bottom:1px solid rgba(255,255,255,0.04);align-items:baseline">
      <span style="font-family:'DM Mono';font-size:10.7px;color:var(--muted2)">${e.time||''}</span>
      <span style="font-size:9.6px;font-weight:700;letter-spacing:.06em;color:${col[e.type]||'var(--muted)'}">${(e.type||'').toUpperCase()}</span>
      <span style="font-size:11.9px;color:var(--text)">${e.text||''}</span>
    </div>`).join('');
  return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;overflow-y:auto;max-height:340px">${rows}</div>
    <div style="font-size:11.3px;color:var(--muted2);margin-top:7px">${list.length} entr${list.length===1?'y':'ies'} \u00b7 full history (news feed shows only the latest 60).</div>`;
}
function lvFilterEvents(t){
  const el=document.getElementById('lv-ev-list'); if(el) el.innerHTML=lvEventsHTML(t);
  document.querySelectorAll('.lv-evf').forEach(b=>{ b.style.opacity = (b.dataset.f===t)?'1':'.55'; });
}
function _csvCell(v){ v = (v===undefined||v===null) ? '' : String(v); return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }
function financeCSV(){
  const L = STATE.financeLog || [];
  const cols = ['label','income','expenses','profit','routeRev','biz','cargo','fuel','crew','handling','lease','cash','value','loan','pax'];
  const head = ['Month','Income $M','Expenses $M','Profit $M','RouteRev $M','Biz $M','Cargo $M','Fuel $M','Crew $M','Handling $M','Lease $M','Cash $M','Value $M','Loan $M','Pax'];
  const rows = L.map(e => cols.map(c => _csvCell(e[c])).join(','));
  return [head.join(','), ...rows].join('\n');
}
function eventLogCSV(){
  const L = STATE.eventLog || STATE.events || [];
  const rows = L.map(e => [_csvCell(e.time), _csvCell(e.type), _csvCell(e.text)].join(','));
  return ['Time,Type,Event', ...rows].join('\n');
}
function _dlBlob(name, content, type){
  try{
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
    showFlash('✓ '+name+' exported');
  }catch(e){ showFlash('⚠ Export failed'); }
}
function exportFinanceCSV(){ _dlBlob(`airline-empire-finances-${MONTHS[STATE.month]}${STATE.year}.csv`, financeCSV(), 'text/csv'); }
function exportFinanceJSON(){ _dlBlob(`airline-empire-finances-${MONTHS[STATE.month]}${STATE.year}.json`, JSON.stringify(STATE.financeLog||[], null, 2), 'application/json'); }
function exportEventLogCSV(){ _dlBlob(`airline-empire-eventlog-${MONTHS[STATE.month]}${STATE.year}.csv`, eventLogCSV(), 'text/csv'); }
function exportEventLogJSON(){ _dlBlob(`airline-empire-eventlog-${MONTHS[STATE.month]}${STATE.year}.json`, JSON.stringify(STATE.eventLog||STATE.events||[], null, 2), 'application/json'); }
function exportSave(){
  try{
    const blob=new Blob([gatherSave()],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`airline-empire-${STATE.coName||'save'}-${MONTHS[STATE.month]}${STATE.year}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showFlash('✓ Save exported');
  }catch(e){ showFlash('⚠ Export failed'); }
}
function importSave(input){
  const f=input.files && input.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{ applySave(r.result); closeModal(); showFlash('✓ Save imported'); }
                 catch(e){ showFlash('⚠ Invalid save file'); } };
  r.readAsText(f);
}
// HOME_BALANCE_LAVENDER_ROUTES_v01: keep application layout at native 100% CSS scale.
(function enforceNativeAppScale(){
  try{
    document.documentElement.style.zoom='100%';
    document.body.style.zoom='100%';
    document.documentElement.style.transform='none';
    document.body.style.transform='none';
  }catch(e){}
})();
function buildIntroBg(){
  const svg=document.getElementById('intro-bg');
  const svg2=document.getElementById('setup-bg');
  if(!svg && !svg2) return;
  const W=1000, H=600;
  let ents=[];
  try{ ents=Object.entries(CITIES); }catch(e){}
  if(!ents.length){ if(svg)svg.innerHTML=''; if(svg2)svg2.innerHTML=''; return; }
  let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
  ents.forEach(([,c])=>{ if(c.x<minx)minx=c.x; if(c.x>maxx)maxx=c.x; if(c.y<miny)miny=c.y; if(c.y>maxy)maxy=c.y; });
  const sx=x=>30+(x-minx)/(maxx-minx)*(W-60), sy=y=>42+(y-miny)/(maxy-miny)*(H-84);
  const list=ents.map(([n,c])=>({n,a:c.abbr||'',x:sx(c.x),y:sy(c.y),m:!!c.major,p:c.pop||0}));
  const byAbbr={}; list.forEach(c=>{ if(c.a) byAbbr[c.a]=c; });
  const seedAbbr=['NYC','LON','TYO','LAX','PAR','SAO','SHA','MEX','IST','SIN','DXB','HKG','SYD','JNB'];
  let seeds=seedAbbr.map(a=>byAbbr[a]).filter(Boolean);
  if(seeds.length<6) seeds=list.filter(c=>c.m).sort((a,b)=>b.p-a.p).slice(0,12);
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  let arcs=[];
  seeds.forEach((s,si)=>{
    const near=list.filter(c=>c!==s).sort((a,b)=>dist(s,a)-dist(s,b)).slice(0,4);
    near.forEach((t,ti)=>arcs.push([s,t,si,ti]));
  });
  const seen=new Set();
  arcs=arcs.filter(p=>{ const k=[p[0].a||p[0].n,p[1].a||p[1].n].sort().join('>'); if(seen.has(k))return false; seen.add(k); return true; });

  let html='<defs>'
    +'<filter id="bgHubGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    +'<radialGradient id="bgHub" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f7efff"/><stop offset="45%" stop-color="#c9a7ff" stop-opacity=".75"/><stop offset="100%" stop-color="#8f5bd7" stop-opacity="0"/></radialGradient></defs>';
  html+='<g>';
  list.forEach(c=>{ html+=`<circle class="${c.m?'home-city-major':'home-city-dot'}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${c.m?1.45:.82}"/>`; });
  html+='</g><g>';
  arcs.forEach((p,i)=>{
    const [a,b,si,ti]=p;
    const span=Math.hypot(a.x-b.x,a.y-b.y);
    const mx=(a.x+b.x)/2;
    const lift=(0.13+((i%4)*0.022))*span;
    const my=Math.min(a.y,b.y)-lift;
    const d=`M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
    const gold=(i%13===0 || (si+ti)%19===0);
    html+=`<path class="home-route-soft" d="${d}" fill="none" vector-effect="non-scaling-stroke"/>`;
    html+=`<path class="${gold?'home-route-gold':'home-route-main'}" d="${d}" fill="none" vector-effect="non-scaling-stroke" style="animation-delay:-${(i%11)*.8}s"/>`;
  });
  html+='</g><g>';
  seeds.forEach((s,i)=>{ html+=`<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${i%3===0?7:5.5}" fill="url(#bgHub)"/><circle class="home-hub-core" cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="1.55" filter="url(#bgHubGlow)"/>`; });
  html+='</g>';
  if(svg) svg.innerHTML=html;
  if(svg2) svg2.innerHTML=html;
}
function splitFlap(container, text){
  if(!container) return;
  container.innerHTML='';
  const glyphs='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789✈·';
  [...text.toUpperCase()].forEach((ch,i)=>{
    const cell=document.createElement('span'); cell.className='flap';
    if(ch===' '){ cell.classList.add('space'); cell.innerHTML='&nbsp;'; container.appendChild(cell); return; }
    cell.textContent=glyphs[Math.floor(Math.random()*glyphs.length)];
    container.appendChild(cell);
    let ticks=7 + i*2 + Math.floor(Math.random()*5);
    const iv=setInterval(()=>{
      ticks--;
      if(ticks<=0){ clearInterval(iv); cell.textContent=ch; cell.classList.remove('flapping'); cell.classList.add('locked'); }
      else { cell.textContent=glyphs[Math.floor(Math.random()*glyphs.length)]; cell.classList.add('flapping'); }
    }, 55);
  });
}
function setupCardPeek()  {}
function setupSetupPeek() {}
function skyPass(){
  const intro = document.getElementById('intro'); if (!intro) return;
  let lane = document.getElementById('sky-lane');
  if (!lane) {
    lane = document.createElement('div'); lane.id = 'sky-lane';
    intro.appendChild(lane);
  }
  lane.innerHTML = '';
  const irect = intro.getBoundingClientRect();
  const iw = irect.width || intro.clientWidth || 1200;
  const SPEED = 1280;                         // px/s — a touch faster again (was 1080)
  const SPAN = iw + 180, SFD = SPAN / SPEED;  // full crossing time
  let firstExit = Infinity, lastExit = 0;
  document.querySelectorAll('.intro-card').forEach((card, i) => {
    const h4 = card.querySelector('h4'); if (!h4) return;
    let sky = card.querySelector('.ic-sky');
    if (!sky) {
      sky = document.createElement('div'); sky.className = 'ic-sky';
      h4.parentNode.insertBefore(sky, h4);
      sky.appendChild(h4);
    }
    if (!h4.dataset.split) {
      h4.dataset.split = '1';
      h4.innerHTML = [...h4.textContent].map(ch =>
        ch === ' ' ? '<span class="sky-l">&nbsp;</span>' : `<span class="sky-l">${ch}</span>`).join('');
    }
    const fromRight = i % 2 === 1;
    const r = sky.getBoundingClientRect();
    const y = (r.top - irect.top) + (intro.scrollTop || 0) + r.height / 2;
    // a plane that crosses the entire screen at this title's altitude
    const plane = document.createElement('div');
    plane.className = 'sky-plane' + (fromRight ? ' from-r' : '');
    plane.innerHTML = '<span class="sp-trail"></span><span class="sp-glyph">✈</span>';
    plane.style.top = y + 'px';
    lane.appendChild(plane);
    const PD = 0.3 + i * 0.26;
    const x0 = fromRight ? iw + 90 : -90, x1 = fromRight ? -90 : iw + 90;
    const exitT = PD + SFD;                 // moment this plane clears the screen
    firstExit = Math.min(firstExit, exitT);
    lastExit  = Math.max(lastExit,  exitT);
    if (plane.animate) {
      plane.animate(
        [{ left: x0 + 'px', opacity: 0, offset: 0 },
         { left: (x0 + (x1 - x0) * 0.04) + 'px', opacity: 1, offset: 0.04 },
         { left: (x0 + (x1 - x0) * 0.96) + 'px', opacity: 1, offset: 0.96 },
         { left: x1 + 'px', opacity: 0, offset: 1 }],
        { duration: Math.round(SFD * 1000), delay: Math.round(PD * 1000), easing: 'linear', fill: 'forwards' });
    } else { plane.style.left = x1 + 'px'; plane.style.opacity = '0'; }
    // each letter condenses out of the exhaust the moment the plane passes overhead
    const letters = [...h4.querySelectorAll('.sky-l')], n = letters.length || 1;
    const HOLD = 2.4;        // titles hang in the air, then smoke out (single pass, no repeat)
    let maxIn = 0;
    const fracs = letters.map((L, j) => {
      const lx = (r.left - irect.left) + ((j + 0.5) / n) * r.width;     // letter x within the screen
      return Math.max(0, Math.min(1, fromRight ? (iw + 90 - lx) / SPAN : (lx + 90) / SPAN));
    });
    letters.forEach((L, j) => {
      const tIn = PD + SFD * fracs[j];
      maxIn = Math.max(maxIn, tIn);
      L.style.setProperty('--ld', tIn.toFixed(2) + 's');
      L.style.setProperty('--lx', fromRight ? '14px' : '-14px');
    });
    const writeEnd = maxIn + 0.55;
    letters.forEach((L, j) => {
      L.style.setProperty('--lo', (writeEnd + HOLD + j * 0.06).toFixed(2) + 's');  // dissipate 1st → last
      L.style.setProperty('--lxo', fromRight ? '-9px' : '9px');
    });
    card.classList.remove('fly'); void card.offsetWidth;
    card.classList.add('fly');
  });
  window.__planeExitTiming = {
    first: isFinite(firstExit) ? firstExit : 1.4,
    last:  lastExit || 2.6,
  };
}
function animateIntroCards(){
  clearInterval(window.__skyLoopT);   // single pass — no repeats
  clearTimeout(window.__skyGoneT);
  skyPass();
}
function revealIntro(){
  splitFlap(document.getElementById('intro-title'),'AIRLINE EMPIRE');
  document.querySelectorAll('.intro-card').forEach((c,i)=>{
    c.classList.remove('smoke-in'); void c.offsetWidth;
    c.style.setProperty('--d', (0.25 + i*0.22).toFixed(2)+'s');
    c.classList.add('smoke-in');
  });
  animateIntroCards();
  const t = window.__planeExitTiming || { first: 1.4, last: 2.6 };
  revealIntroActions(t.first, t.last);
  clearTimeout(window.__departT);
  window.__departT = setTimeout(launchPlaneDeparture, 3400);
  setTimeout(()=>{ try { maybeShowChangelog(); } catch(e){} }, 1400);
}
// Fade the NEW GAME / CONTINUE / DAILY / RECORDS buttons in, staggered across
// the window in which the title planes exit the screen.
function revealIntroActions(firstExit, lastExit) {
  const wrap = document.querySelector('.intro-actions');
  if (!wrap) return;
  const items = [...wrap.querySelectorAll('.intro-action-btn'), wrap.querySelector('.intro-import')].filter(Boolean);
  if (!items.length) return;
  const hasSave = !!saveSummary();
  const span = Math.max(0.45, lastExit - firstExit);
  // hide instantly
  items.forEach(el => {
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
  });
  void wrap.offsetWidth;
  // reveal each in time with a plane leaving
  items.forEach((el, k) => {
    const delay = firstExit + span * (k / (items.length - 1 || 1));
    const target = (el.classList.contains('intro-cont') && !hasSave) ? '0.38' : '1';
    setTimeout(() => {
      el.style.transition = 'opacity .5s ease, transform .55s cubic-bezier(.2,.8,.3,1)';
      el.style.opacity = target;
      el.style.transform = 'translateY(0)';
      // hand control back to the fast hover transition once settled
      setTimeout(() => { el.style.transition = ''; el.style.transform = ''; }, 600);
    }, Math.round(delay * 1000));
  });
}
function launchPlaneDeparture(){
  const badge = document.getElementById('intro-plane-badge');
  if (!badge) return;
  badge.classList.add('departing');
  setTimeout(() => {
    badge.classList.remove('departing');
    badge.style.opacity = '0';
    setTimeout(() => {
      badge.style.transition = 'opacity 0.7s ease';
      badge.style.opacity    = '';
      setTimeout(() => { badge.style.transition = ''; }, 800);
    }, 600);
  }, 1900);
}
function scrambleLine(el, text){
  if(!el) return;
  const glyphs='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/+=·▚▞';
  const final=text.toUpperCase();
  let frame=0; const total=final.length*2+12;
  clearInterval(el._iv);
  el._iv=setInterval(()=>{
    frame++;
    let out='';
    for(let i=0;i<final.length;i++){
      if(final[i]===' '){ out+=' '; continue; }
      out += (frame > i*2+5) ? final[i] : glyphs[Math.floor(Math.random()*glyphs.length)];
    }
    el.textContent=out;
    if(frame>=total){ clearInterval(el._iv); el.textContent=final; }
  }, 45);
}
function spawnBlip(){
  const layer=window.__blipLayer; if(!layer) return;
  const NS='http://www.w3.org/2000/svg';
  const ang=Math.random()*Math.PI*2, rad=16+Math.random()*92;
  const x=120+Math.cos(ang)*rad, y=120+Math.sin(ang)*rad;
  const g=document.createElementNS(NS,'g');
  g.setAttribute('transform',`translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  const halo=document.createElementNS(NS,'circle');
  halo.setAttribute('r','3.2'); halo.setAttribute('class','blip-halo');
  g.appendChild(halo);
  const specks=[];
  const n=2+Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){
    const s=document.createElementNS(NS,'circle');
    s.setAttribute('r',(0.4+Math.random()*0.5).toFixed(2));
    s.setAttribute('class','blip-static');
    g.appendChild(s); specks.push(s);
  }
  const core=document.createElementNS(NS,'circle');
  core.setAttribute('r',(1.2+Math.random()*0.8).toFixed(2));
  core.setAttribute('class','blip-core');
  g.appendChild(core);
  layer.appendChild(g);
  let f=0; const frames=5+Math.floor(Math.random()*5);
  const jit=setInterval(()=>{
    f++;
    specks.forEach(s=>{
      s.setAttribute('cx',(-2.4+Math.random()*4.8).toFixed(2));
      s.setAttribute('cy',(-2.4+Math.random()*4.8).toFixed(2));
      s.style.opacity = Math.random()<0.6 ? (0.5+Math.random()*0.5).toFixed(2) : '0';
    });
    core.style.opacity = Math.random()<0.7 ? '1' : '0.15';
    if(f>=frames){
      clearInterval(jit);
      specks.forEach(s=>{ s.style.opacity='0'; });
      core.style.opacity='';
      core.style.animation='blipFlash .55s ease-out forwards';
      halo.style.animation='blipHalo .6s ease-out forwards';
      setTimeout(()=>{ if(g.parentNode) g.remove(); }, 680);
    }
  }, 42);
  (window.__blipTimers=window.__blipTimers||[]).push(jit);
  setTimeout(()=>{ if(g.parentNode){ clearInterval(jit); g.remove(); } }, 1500);
}
function clearCineTimers(){
  (window.__cineSeq||[]).forEach(t=>clearTimeout(t));
  window.__cineSeq=[];
  clearTimeout(window.__cineT);
  clearInterval(window.__blipIv);
  (window.__blipTimers||[]).forEach(t=>clearInterval(t)); window.__blipTimers=[];
  const term=document.getElementById('cine-term'); if(term) clearInterval(term._iv);
  const bl=document.querySelector('.cine-radar .blip-layer'); if(bl) bl.innerHTML='';
  cancelAnimationFrame(window.__cineDistortRaf); window.__cineDistortRaf=null;
  const wrap=document.querySelector('.cine-fx-wrap');
  if(wrap){ wrap.style.filter='none'; wrap.style.animation='none'; }
  const disp=document.getElementById('cine-disp'); if(disp) disp.setAttribute('scale','0');
}
function drawCineNoise(){
  const cvs=document.getElementById('cine-noise'); if(!cvs) return;
  const W=Math.min(window.innerWidth||1200,960), H=Math.min(window.innerHeight||800,640);
  cvs.width=W; cvs.height=H;
  const ctx=cvs.getContext('2d'); if(!ctx) return; const img=ctx.createImageData(W,H); const d=img.data;
  for(let i=0;i<d.length;i+=4){
    const v=Math.random()<0.42?Math.random()*115|0:0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=200;
  }
  ctx.putImageData(img,0,0);
  cvs.style.opacity='0.40';
  requestAnimationFrame(()=>{ cvs.style.opacity='0'; });
}
function animateCineDistort(){
  const disp=document.getElementById('cine-disp'), wrap=document.querySelector('.cine-fx-wrap');
  if(!disp||!wrap) return;
  wrap.style.filter='url(#cine-distort)';
  wrap.style.animation='cine-jerk 3.8s ease-out both';
  let start=null;
  function step(ts){
    if(!start) start=ts;
    const t=Math.min(1,(ts-start)/2700);
    const ease=1-(1-t)*(1-t)*(1-t)*(1-t);
    disp.setAttribute('scale',(40*(1-ease)).toFixed(1));
    if(t<1){ window.__cineDistortRaf=requestAnimationFrame(step); }
    else{ disp.setAttribute('scale','0'); wrap.style.filter='none'; }
  }
  window.__cineDistortRaf=requestAnimationFrame(step);
}
function playIntroCinematic(){
  const cine=document.getElementById('cinematic');
  if(!cine){ revealIntro(); return; }
  cine.classList.remove('hidden','done','online'); delete cine.dataset.done;
  clearCineTimers();
  window.__cineSeq=[];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS="http://www.w3.org/2000/svg", $=id=>document.getElementById(id);
  const dotsG=$('sp-dots'), arcsG=$('sp-arcs'), planesG=$('sp-planes'), hubsG=$('sp-hubs');
  if(!dotsG){ revealIntro(); return; }
  dotsG.innerHTML=arcsG.innerHTML=planesG.innerHTML=hubsG.innerHTML='';

  // Build city list from LIVE CITIES, scaled into the 1600x820 viewBox.
  const ents=Object.entries(CITIES);
  let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
  ents.forEach(([,c])=>{ if(c.x<minx)minx=c.x; if(c.x>maxx)maxx=c.x; if(c.y<miny)miny=c.y; if(c.y>maxy)maxy=c.y; });
  const sx=x=>60+(x-minx)/(maxx-minx)*1480, sy=y=>40+(y-miny)/(maxy-miny)*740;
  const list=ents.map(([n,c])=>({n, a:c.abbr||'', x:sx(c.x), y:sy(c.y), r:c.region||'', m:!!c.major, p:c.pop||0}));
  const byAbbr={}; list.forEach(c=>{ if(c.a) byAbbr[c.a]=c; });

  // faint world dot-field
  list.forEach(c=>{ const d=document.createElementNS(SVGNS,'circle');
    d.setAttribute('cx',c.x); d.setAttribute('cy',c.y); d.setAttribute('r', c.m?2.2:1.3);
    d.setAttribute('fill', c.m?'#6f55a3':'#352a56'); d.setAttribute('class','sp-citydot'); d.dataset.region=c.r;
    dotsG.appendChild(d); });

  // routes from recognizable seed hubs to nearest + a few long hauls
  const seedAbbr=['NYC','LON','TYO','LAX','PAR','SAO','SHA','MEX','IST','SIN','DXB','HKG','SYD','JNB'];
  let seeds=seedAbbr.map(a=>byAbbr[a]).filter(Boolean);
  if(seeds.length<4){ seeds=list.filter(c=>c.m).sort((a,b)=>b.p-a.p).slice(0,12); }
  const majors=list.filter(c=>c.m);
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  let routes=[];
  seeds.forEach(s=>{ const o=list.filter(c=>c!==s).sort((a,b)=>dist(s,a)-dist(s,b)).slice(0,9);
    const far=majors.filter(m=>m!==s).sort((a,b)=>dist(s,b)-dist(s,a)).slice(0,3);
    [...o,...far].forEach(t=>routes.push([s,t])); });
  const seen=new Set(); routes=routes.filter(r=>{ const k=[r[0].a||r[0].n,r[1].a||r[1].n].sort().join('>'); if(seen.has(k))return false; seen.add(k); return true; });

  function arcPath(a,b){ const len=Math.hypot(b.x-a.x,b.y-a.y), lift=Math.min(120,len*0.22);
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2; return `M${a.x},${a.y} Q${mx},${my-lift-len*0.05} ${b.x},${b.y}`; }

  const arcEls=[];
  routes.forEach((r,i)=>{ const p=document.createElementNS(SVGNS,'path');
    p.setAttribute('d',arcPath(r[0],r[1])); p.setAttribute('fill','none');
    p.setAttribute('stroke', i%7===0?'#e4b85f':'#a970f2'); p.setAttribute('stroke-width', i%7===0?1.5:1.1);
    p.setAttribute('stroke-opacity','0'); p.setAttribute('filter','url(#sp-glow)');
    arcsG.appendChild(p); arcEls.push({el:p, route:r, len:0}); });
  arcEls.forEach(a=>{ a.len=a.el.getTotalLength(); a.el.style.strokeDasharray=a.len; a.el.style.strokeDashoffset=a.len; });

  const hubNodes={};
  function makeHub(c){ const g=document.createElementNS(SVGNS,'g'); g.setAttribute('opacity','0');
    const halo=document.createElementNS(SVGNS,'circle'); halo.setAttribute('cx',c.x); halo.setAttribute('cy',c.y); halo.setAttribute('r','16'); halo.setAttribute('fill','url(#sp-hubg)');
    const core=document.createElementNS(SVGNS,'circle'); core.setAttribute('cx',c.x); core.setAttribute('cy',c.y); core.setAttribute('r','3'); core.setAttribute('fill','#eafffb'); core.setAttribute('filter','url(#sp-softglow)');
    g.appendChild(halo); g.appendChild(core); hubsG.appendChild(g); return {g,halo,core,c}; }
  seeds.forEach(s=>{ hubNodes[s.a||s.n]=makeHub(s); });

  const ease=t=>1-Math.pow(1-t,3), easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function anim(dur,cb,done){ const t0=performance.now(); function f(now){ let t=Math.min(1,(now-t0)/dur); cb(t); if(t<1)requestAnimationFrame(f); else done&&done(); } requestAnimationFrame(f); }
  function fadeEl(el,to,dur){ if(!el)return; const fr=parseFloat(getComputedStyle(el).opacity)||0; anim(dur,t=>el.style.opacity=(fr+(to-fr)*t).toFixed(3)); }
  function flyPlane(arc,dur,color){ const path=arc.el, L=arc.len;
    const dot=document.createElementNS(SVGNS,'circle'); dot.setAttribute('r','2.6'); dot.setAttribute('fill',color||'#eafffb'); dot.setAttribute('filter','url(#sp-softglow)'); planesG.appendChild(dot);
    const tail=document.createElementNS(SVGNS,'circle'); tail.setAttribute('r','1.6'); tail.setAttribute('fill',color||'#c9a7ff'); tail.setAttribute('opacity','.6'); planesG.appendChild(tail);
    anim(dur,t=>{ const p=path.getPointAtLength(L*easeIO(t)); const q=path.getPointAtLength(L*Math.max(0,easeIO(t)-0.04)); dot.setAttribute('cx',p.x); dot.setAttribute('cy',p.y); tail.setAttribute('cx',q.x); tail.setAttribute('cy',q.y); }, ()=>{ dot.remove(); tail.remove(); }); }
  function roll(el,to,dur,fmt){ if(!el)return; anim(dur,t=>{ const v=Math.round(to*ease(t)); el.textContent=fmt?fmt(v):v.toLocaleString(); }); }
  function pulseHub(h){ const r0=16; anim(reduce?200:900, t=>{ h.halo.setAttribute('r',(r0*(1+1.6*ease(t))).toFixed(1)); h.halo.setAttribute('opacity',(1-ease(t)).toFixed(2)); }, ()=>{ h.halo.setAttribute('r',r0); h.halo.setAttribute('opacity','1'); }); }

  const REGIONS=(typeof window.REGIONS!=='undefined'&&Array.isArray(window.REGIONS))?window.REGIONS:['N America','S America','Europe','Africa','Mid East','SE Asia','Oceania'];
  const RL={'N America':'N. AMERICA','S America':'S. AMERICA','Europe':'EUROPE','Africa':'AFRICA','Mid East':'MID EAST','SE Asia':'ASIA \u00b7 PACIFIC','Oceania':'OCEANIA'};
  const regC=$('sp-regions'); regC.innerHTML=''; const regEls={};
  REGIONS.forEach(r=>{ const d=document.createElement('div'); d.className='sp-reg'; d.innerHTML='<span class="nm">'+(RL[r]||r.toUpperCase())+'</span> <span class="st"></span>'; regC.appendChild(d); regEls[r]=d; });
  function igniteRegion(reg){ const e=regEls[reg]; if(!e)return; e.classList.add('lit'); e.querySelector('.st').innerHTML='LED <span class="dot"></span>';
    document.querySelectorAll('.sp-citydot[data-region="'+reg+'"]').forEach(d=>{ d.setAttribute('fill', parseFloat(d.getAttribute('r'))>=2?'#c9a7ff':'#8059bd'); }); }

  // reset overlays
  ['sp-coord','sp-stats','sp-h1','sp-tag','sp-cta'].forEach(id=>{ const e=$(id); if(e)e.style.opacity='0'; });
  $('sp-title').style.opacity='1';
  ['sp-sRoutes','sp-sCities','sp-sRev','sp-sPax'].forEach(id=>{ const e=$(id); if(e)e.textContent='0'; });

  const T=(ms,fn)=>window.__cineSeq.push(setTimeout(fn, reduce?Math.min(ms,200):ms));
  // 0 cold open
  T(250, ()=>fadeEl($('sp-coord'),1,800));
  T(650, ()=>{ const h=hubNodes['NYC']||hubNodes[seeds[0].a||seeds[0].n]; if(h){ fadeEl(h.g,1,600); pulseHub(h);} });
  // 1 draw network
  const base=reduce?0:1000, step=reduce?0:40; const lit=new Set();
  arcEls.forEach((a,i)=>{ T(base+i*step, ()=>{ a.el.setAttribute('stroke-opacity', a.el.getAttribute('stroke')==='#e4b85f'?'0.9':'0.64');
    anim(reduce?200:900, t=>{ a.el.style.strokeDashoffset=(a.len*(1-ease(t))).toFixed(1); });
    flyPlane(a, reduce?300:1100, a.el.getAttribute('stroke'));
    const hn=hubNodes[a.route[1].a||a.route[1].n]; if(hn){ fadeEl(hn.g,1,500); pulseHub(hn); }
    const reg=a.route[1].r; if(reg&&!lit.has(reg)){ lit.add(reg); igniteRegion(reg);} }); });
  // 2 stats
  T(reduce?260:2500, ()=>{ fadeEl($('sp-stats'),1,700);
    roll($('sp-sRoutes'), routes.length, reduce?300:1400);
    roll($('sp-sCities'), list.length, reduce?300:1600);
    roll($('sp-sRev'), 4280, reduce?300:1800);
    anim(reduce?300:2000, t=>{ $('sp-sPax').textContent=(9.74*ease(t)).toFixed(1)+'M'; }); });
  // 3 title
  const ts=reduce?500:4000;
  T(ts+450, ()=>{ fadeEl($('sp-h1'),1,1100);
    window.__cineSeq.push(setTimeout(()=>{ const s=$('sp-shine'); if(s){ s.style.opacity='1'; anim(900,t=>{ s.style.left=(-40+180*t)+'%'; }, ()=>s.style.opacity='0'); } }, 700)); });
  T(ts+1100, ()=>fadeEl($('sp-tag'),1,900));
  T(ts+1900, ()=>fadeEl($('sp-cta'),1,800));
  // ambient planes until handoff
  window.__blipIv=setInterval(()=>{ if(!arcEls.length)return; const a=arcEls[(Math.random()*arcEls.length)|0]; if(parseFloat(a.el.getAttribute('stroke-opacity'))>0) flyPlane(a, 1400+Math.random()*900, a.el.getAttribute('stroke')); }, 460);
  // hand off to the menu
  window.__cineT=setTimeout(endCinematic, reduce?1400:7600);
  window.__cineSeq.push(window.__cineT);
}
function endCinematic(){
  const cine=document.getElementById('cinematic');
  if(!cine || cine.dataset.done) return;
  cine.dataset.done='1';
  clearCineTimers();
  cine.classList.add('done');
  setTimeout(()=>cine.classList.add('hidden'), 700);
  revealIntro();
}
function saveSummary(){
  try{
    const raw = localStorage.getItem(SAVE_KEY(0)) || localStorage.getItem('airline_empire_save');
    if(!raw) return null;
    const o=JSON.parse(raw); const s=o&&o.state; if(!s) return null;
    return { co:s.coName||'AIRLINE', year:s.year||'', cash:Math.round(s.cash||0), type:s.gameType||'scenario' };
  }catch(e){ return null; }
}
function updateIntroMenu(){
  const bar=document.getElementById('resume-bar'), info=document.getElementById('resume-info');
  const sum=saveSummary();
  if(bar){
    bar.style.display='';
    if(sum){
      bar.style.opacity='1'; bar.style.pointerEvents='auto'; bar.classList.remove('disabled');
      if(info) info.textContent=`${sum.co} · ${sum.year} · $${sum.cash.toLocaleString()}M`;
    } else {
      bar.style.opacity=''; bar.style.pointerEvents=''; bar.classList.add('disabled');
      if(info) info.textContent='No saved game';
    }
  }
  const sub=document.getElementById('daily-sub');
  if(sub){ try{ const d=dailyConfig(); const stk=(PROFILE.daily&&PROFILE.daily.streak)||0; sub.textContent=`Today · ${d.twist.name}${stk>1?` · 🔥${stk}`:''}`; }catch(e){ sub.textContent='Today\u2019s seeded run'; } }
  const rsub=document.getElementById('records-sub');
  if(rsub){ try{ rsub.textContent=`${Object.keys(PROFILE.ach||{}).length}/${ACHIEVEMENTS.length} achievements`; }catch(e){} }
  // ── Home-screen hydration (CEO badge, CONTINUE line, bottom stat bar) ──
  try { hydrateHomeScreen(); } catch(e) {}
}
function hydrateHomeScreen(){
  const set=(id,txt)=>{const el=document.getElementById(id);if(el!=null&&txt!=null)el.textContent=txt;};
  const sum = (typeof saveSummary==='function') ? saveSummary() : null;
  // pull the full saved state for richer bottom-bar numbers
  let st=null;
  try{ const raw=localStorage.getItem(SAVE_KEY(0))||localStorage.getItem('airline_empire_save');
       if(raw){ const o=JSON.parse(raw); st=o&&o.state; } }catch(e){}
  // CONTINUE card line
  const contLine=document.getElementById('home-cont-line');
  if(contLine){ contLine.textContent = sum ? `${sum.co} \u00b7 ${sum.year}` : 'No saved game'; }
  // Empire status flavor from reputation/value if available
  const status=document.getElementById('home-status');
  if(status){
    let label='New Venture';
    if(st){ const v=st.companyValue||0, rep=(st.repScore!=null?st.repScore:(st.reputation!=null?st.reputation:null));
      if(v>4000||(rep!=null&&rep>=85)) label='Global Powerhouse';
      else if(v>1500||(rep!=null&&rep>=70)) label='Rising Star';
      else if(v>400) label='Up & Coming';
      else label='Scrappy Startup';
    }
    status.textContent=label;
  }
  // Daily reward line (kept generic; engine awards vary)
  // bottom stat bar
  const f$=n=>`$${Math.round(n).toLocaleString()}M`;
  if(st){
    set('home-cash', f$(st.cash||0));
    // profit/mo: prefer stored last-month, else sum route profit
    let pm=null;
    if(typeof st._lastMonthProfit==='number') pm=st._lastMonthProfit;
    else if(Array.isArray(st.routes)) pm=st.routes.reduce((s,r)=>s+(r.profit||0),0);
    set('home-profit', pm==null?'—':`${pm>=0?'+':''}${f$(pm)}`);
    set('home-routes', Array.isArray(st.routes)?String(st.routes.length):'—');
    let ac=0; if(st.planes){ Object.values(st.planes).forEach(p=>ac+=(p.owned||0)); }
    set('home-aircraft', ac?String(ac):'—');
    const rep = (st.repScore!=null?st.repScore:(st.reputation!=null?st.reputation:null));
    set('home-rep', rep!=null?String(Math.round(rep)):'—');
    const rb=document.getElementById('home-rep-bar'); if(rb) rb.style.width=(rep!=null?Math.max(0,Math.min(100,rep)):0)+'%';
    set('home-rank', st.rank?('#'+st.rank):'—');
    set('home-date', st.year? (st.month!=null?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][st.month%12]+' '+st.year : String(st.year)) : '—');
  } else {
    // no save — show a clean empty/onboarding state, no invented numbers
    ['home-cash','home-profit','home-rank','home-routes','home-aircraft','home-rep','home-date'].forEach(id=>set(id,'—'));
    const rb=document.getElementById('home-rep-bar'); if(rb) rb.style.width='0%';
  }
}
function gatherSave(){
  const s={...STATE}; delete s.timerInterval;
  return JSON.stringify({ v:2, ts:Date.now(), state:s, cities:CITIES });
}
function autoSave(){ try{ saveToSlot(0); }catch(e){} }
function launchDaily(){
  endCinematic();
  setupChoice.type='daily';
  startGame('intro');
}
const CHANGELOG = [
  { tag:'Build 1.51', date:'Jun 27', v:'2026.06.27', items:[
    'A cinematic new opening — watch your route network ignite across the globe, region by region, before the title takes flight. Tap anywhere or hit Skip to jump straight to the menu.',
    'Fleet Renewal — see your aging fleet at a glance, with ranked replacement moves and a payback verdict on each, so you always know which upgrade actually pays for itself.',
    'Regional Capital Projects — big-ticket builds (mega-hub terminals, lounges, maintenance bases, brand campaigns) that take several months, lift a whole region, and push you toward the crown.',
    'Executive personalities — every board hire now has a temperament that shapes both their impact and their salary, from Sharp Dealers to Risk-Averse stewards — choose who fits your strategy.',
    'Turn payoff — your “At Stake” chips now resolve right where you left them at the end of each month, so you can see how the turn actually played out before the next one begins.',
  ]},
  { tag:'Build 1.41', date:'Jun 20', v:'2026.06.20', items:[
    'Meet your advisor council — a team of specialists that watches the airline and surfaces what needs your attention each turn. Open the Advisor Report anytime.',
    'New Chief Strategist — pinpoints the single biggest thing standing between you and the crown, and the next region to push for it.',
    'New Commercial advisor — flags routes that are turning passengers away and fares that are quietly suppressing demand.',
    'Sharper finance & rival intel — your CFO now warns when reserves are too thin to ride out a downturn, and your strategist tracks head-to-head contention on your routes.',
    'Conquest map — one tap shows which regions you lead, which are contested, and which are still wide open.',
    'Cleaner world view and true-to-life polar ice — only your hubs show when zoomed out (cities reveal as you zoom in), with a bright Antarctic cap and northern snow that fades realistically.',
  ]},
  { tag:'Build 1.31', date:'Jun 19', v:'2026.06.19', items:[
    'Brighter, crisper text across the whole interface.',
    'Weather alerts now take you straight to the storm — click any weather card in the news to fly there.',
    '“First Moves” starter goals: clear early milestones for cash and a free aircraft while you find your feet.',
    'Optional turn focus — cap yourself to a few big moves per month for a tenser game (toggle in the Dev Tuner).',
    'This “What’s New” panel — reopen it anytime from the title screen.',
  ]},
  { tag:'Build 1.21', date:'Jun 18', v:'2026.06.18', items:[
    'Fleet self-upgrade — replace a whole aircraft type with a newer model in one click.',
    'Routes group under their hub, with collapsible sections and per-route detail.',
    'Buy Aircraft & Slot Negotiations open tidy and collapsed; manufacturer counts on the buy card.',
    'Smarter save manager — 1 quicksave, 5 manual slots, plus a separate autosave.',
  ]},
  { tag:'Build 1.x', date:'Jun 17', v:'2026.06.17', items:[
    'Crew recognition & awards — Employee of the Quarter, Safety Star, Long Service and more, each lifting morale.',
    'Crew screen split into clean Roster and Human Resources views.',
  ]},
];
function buildChangelogHTML(){
  const blocks = CHANGELOG.slice(0,2).map((c,i)=>`
    <div class="cl-block">
      <div class="cl-vrow">
        <span class="cl-ver">${c.tag}</span>
        <span class="cl-date">${c.date}</span>
        ${i===0?'<span class="cl-new">NEW</span>':''}
      </div>
      <ul class="cl-items">${c.items.map(it=>`<li>${it}</li>`).join('')}</ul>
    </div>`).join('');
  return `
    <div class="cl-head">
      <h2>✦ What's New</h2>
      <div class="cl-sub">Airline Empire · ${CHANGELOG[0].tag} · ${CHANGELOG[0].date}</div>
    </div>
    <div class="cl-scroll">${blocks}</div>
    <div class="cl-foot"><button class="cl-go" onclick="closeChangelog()">Let’s fly ▶</button></div>`;
}
function showChangelog(){ /* What's New removed entirely by request */ }
function closeChangelog(){
  const ov = document.getElementById('changelog-overlay');
  if (ov) ov.classList.remove('open');
  try { localStorage.setItem('ae_changelog_seen', CHANGELOG[0].v); } catch(e){}
}
// === LAB HARNESS START — parallel side-thoughts. Read-only. Off by default. ===
// Reads live game state to preview ideas but must NEVER write to STATE or routes
// while LAB.on. To remove: delete this block, the #lab-overlay element, the .lab-
// CSS, the Dev-Tuner button, and the labTick() call in endTurn.
const LAB = {
  on: false,
  ticketing: {
    bizMult: 2.8,         // business fare = economy x this
    firstMult: 5.0,       // first fare    = economy x this
    bizSpace: 1.6,        // a business seat eats this many economy seats of floor
    firstSpace: 2.6,      // a first seat eats this many economy seats of floor
    bizFloorPct: 0.20,    // share of cabin FLOOR given to business
    firstFloorPct: 0.08,  // share given to first (long-haul only)
    longHaulMi: 2800,     // first class only beyond this distance
    poolFloor: 0.10, poolCeil: 0.80, // clamp on a route's premium-willing share
  },
  history: [],            // LAB-owned per-turn snapshots (never touches the game)
};
function labEnabled(){
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('lab') === '1') return true;
    if (localStorage.getItem('ae_lab') === '1') return true;
  } catch(e){}
  return false;
}
try { LAB.on = labEnabled(); } catch(e){}
function labMoney(m){ const a=Math.abs(m); return '$'+(a>=100?Math.round(m):m.toFixed(1))+'M'; }

// ---- ticketing-tiers SHADOW: what would this route earn split into cabins? ----
// Pure read: runs processRoute(r) for the live numbers, recomputes revenue under a
// multi-cabin allocation, returns a comparison. Writes nothing back to r or STATE.
function labRouteShadow(r){
  try {
  if (!r || r.cargo) return null;
  const cf = CITIES[r.from], ct = CITIES[r.to];
  if (!cf || !ct) return null;
  const res = processRoute(r);                 // live engine, READ ONLY
  if (!res || res.capacity <= 0) return null;
  const E = ECON, T = LAB.ticketing;
  const dist = getDistance(r.from, r.to);
  // premium-willing share, from the route's own econ-vs-tourism demand mix
  const bizW  = (cf.econ + ct.econ)       * E.demandEcon;
  const leisW = (cf.tourism + ct.tourism) * E.demandTour;
  const popW  = (cf.pop + ct.pop)         * E.demandPop;
  let bizShare = (bizW + popW * 0.4) / Math.max(1, bizW + leisW + popW);
  bizShare = Math.max(T.poolFloor, Math.min(T.poolCeil, bizShare));
  const longHaul = dist >= T.longHaulMi;
  // allocate cabin FLOOR -> physical seats (premium seats consume more floor)
  const cap   = res.capacity;                  // economy-equivalent seat-months
  const fFirst = longHaul ? T.firstFloorPct : 0;
  const fBiz   = T.bizFloorPct;
  const fEcon  = Math.max(0, 1 - fFirst - fBiz);
  const firstSeats = cap * fFirst / T.firstSpace;
  const bizSeats   = cap * fBiz   / T.bizSpace;
  const econSeats  = cap * fEcon;
  const physSeats  = firstSeats + bizSeats + econSeats;
  // demand per cabin
  const demand = res.demand;
  const premiumPool = demand * bizShare;
  const firstDemand = longHaul ? premiumPool * 0.30 : 0;
  const bizDemand   = premiumPool - firstDemand;
  const firstPax = Math.min(firstSeats, firstDemand);
  const bizPax   = Math.min(bizSeats,   bizDemand);
  const spill    = (firstDemand - firstPax) + (bizDemand - bizPax); // downgrade to econ
  const econPax  = Math.min(econSeats, Math.max(0, demand - premiumPool) + spill);
  const trm  = (typeof timedRevenueMod === 'function') ? timedRevenueMod(r) : 1;
  const fare = r.fare;
  // processRoute returns revenue in MILLIONS, so match units here
  const shadowRevM = (econPax*fare + bizPax*fare*T.bizMult + firstPax*fare*T.firstMult) * trm / 1e6;
  const shadowPax  = Math.round(econPax + bizPax + firstPax);
  return {
    name: r.from + '\u2192' + r.to,
    longHaul, bizShare,
    base:   { rev: res.revenue, pax: res.pax, load: res.load },
    shadow: { rev: shadowRevM, pax: shadowPax,
              first: Math.round(firstPax), biz: Math.round(bizPax), econ: Math.round(econPax),
              load: physSeats>0 ? Math.round(shadowPax/physSeats*100) : 0 },
    delta: shadowRevM - res.revenue,
  };
  } catch(e){ return null; }
}
function labTicketingReport(){
  const rows = []; let bRev=0,sRev=0,bPax=0,sPax=0;
  (STATE.routes||[]).forEach(r=>{
    const sh = labRouteShadow(r); if(!sh) return;
    rows.push(sh); bRev+=sh.base.rev; sRev+=sh.shadow.rev; bPax+=sh.base.pax; sPax+=sh.shadow.pax;
  });
  rows.sort((a,b)=>b.delta-a.delta);
  return { rows, bRev, sRev, bPax, sPax, dRev: sRev-bRev, dPax: sPax-bPax };
}
function labTick(){                 // per-turn snapshot, LAB-owned storage only
  if (!LAB.on) return;
  try {
    const rep = labTicketingReport();
    LAB.history.push({ y: STATE.year, m: STATE.month, bRev: rep.bRev, sRev: rep.sRev, dRev: rep.dRev });
    if (LAB.history.length > 360) LAB.history.shift();
  } catch(e){}
}
const LAB_KNOBS = [
  {k:'bizMult',       label:'Business fare',       min:1.5, max:5,    step:0.1,  fmt:v=>'×'+v.toFixed(1)},
  {k:'firstMult',     label:'First fare',          min:2,   max:9,    step:0.1,  fmt:v=>'×'+v.toFixed(1)},
  {k:'bizFloorPct',   label:'Biz cabin floor',     min:0,   max:0.5,  step:0.01, fmt:v=>Math.round(v*100)+'%'},
  {k:'firstFloorPct', label:'First cabin floor',   min:0,   max:0.25, step:0.01, fmt:v=>Math.round(v*100)+'%'},
  {k:'bizSpace',      label:'Biz seat floor cost', min:1,   max:3,    step:0.1,  fmt:v=>'×'+v.toFixed(1)},
  {k:'firstSpace',    label:'First seat floor cost',min:1.5,max:5,    step:0.1,  fmt:v=>'×'+v.toFixed(1)},
  {k:'longHaulMi',    label:'Long-haul threshold', min:1000,max:6000, step:100,  fmt:v=>Math.round(v)+' mi'},
];
const LAB_TKT_DEF = Object.assign({}, LAB.ticketing);
function labKnobFmt(k,v){ const d=LAB_KNOBS.find(x=>x.k===k); return d?d.fmt(v):v; }

function labKpiHTML(rep){
  const pct  = rep.bRev>0 ? (rep.dRev/rep.bRev*100) : 0;
  const dCls = rep.dRev>=0 ? 'lab-up' : 'lab-dn';
  return '<div class="lab-sum">'
    +'<div><div class="lab-k">Fares now</div><div class="lab-v">'+labMoney(rep.bRev)+'/mo</div></div>'
    +'<div><div class="lab-k">With cabins</div><div class="lab-v">'+labMoney(rep.sRev)+'/mo</div></div>'
    +'<div><div class="lab-k">Δ Revenue</div><div class="lab-v '+dCls+'">'+(rep.dRev>=0?'+':'')+labMoney(rep.dRev)+' ('+(pct>=0?'+':'')+pct.toFixed(0)+'%)</div></div>'
    +'<div><div class="lab-k">Δ Passengers</div><div class="lab-v '+(rep.dPax>=0?'lab-up':'lab-dn')+'">'+(rep.dPax>=0?'+':'')+rep.dPax.toLocaleString()+'</div></div>'
    +'</div>';
}
function labRowsHTML(rep){
  if(!rep.rows.length) return '<tr><td colspan="6" class="lab-empty">No passenger routes yet — open a route to populate this.</td></tr>';
  return rep.rows.slice(0,40).map(sh=>{
    const p = sh.base.rev>0 ? (sh.delta/sh.base.rev*100) : 0;
    const c = sh.delta>=0 ? 'lab-up' : 'lab-dn';
    const mix = (sh.shadow.first?sh.shadow.first+'F · ':'') + sh.shadow.biz + 'B · ' + sh.shadow.econ + 'Y';
    return '<tr><td>'+sh.name+(sh.longHaul?' <span class="lab-lh">LH</span>':'')+'</td>'
      +'<td class="num">'+Math.round(sh.bizShare*100)+'%</td>'
      +'<td class="num">'+labMoney(sh.base.rev)+'</td>'
      +'<td class="num">'+labMoney(sh.shadow.rev)+'</td>'
      +'<td class="num '+c+'">'+(p>=0?'+':'')+p.toFixed(0)+'%</td>'
      +'<td class="num lab-dim">'+mix+'</td></tr>';
  }).join('');
}
function labControlsHTML(){
  const T=LAB.ticketing;
  const knobs = LAB_KNOBS.map(d=>{
    const v=T[d.k];
    return '<div class="lab-knob"><div class="lab-knrow"><span>'+d.label+'</span>'
      +'<span class="lab-knval" id="labval-'+d.k+'">'+d.fmt(v)+'</span></div>'
      +'<input type="range" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+v
      +'" oninput="labSet(&#39;'+d.k+'&#39;,this.value)"></div>';
  }).join('');
  return '<div class="lab-ctrls"><div class="lab-ctrls-head"><span>Tune the cabin model — table updates live</span>'
    +'<button class="lab-reset" onclick="labResetTicketing()">Reset</button></div>'
    +'<div class="lab-knobs">'+knobs+'</div></div>';
}
function labSparkHTML(){
  const h=LAB.history;
  if(h.length<2) return '<div class="lab-spark"><div class="lab-spark-cap">Δ revenue / month — end a few turns with LAB on to chart the trend.</div></div>';
  const vals=h.map(x=>x.dRev), n=vals.length;
  const min=Math.min(0,...vals), max=Math.max(0,...vals), span=(max-min)||1;
  const W=660,H=64, X=i=>(i/(n-1)*W), Y=v=>(H-(v-min)/span*H);
  const pts=vals.map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' ');
  const last=vals[n-1], zeroY=Y(0).toFixed(1);
  return '<div class="lab-spark"><svg class="lab-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none">'
    +'<line class="lab-zero" x1="0" y1="'+zeroY+'" x2="'+W+'" y2="'+zeroY+'"/>'
    +'<polyline class="lab-line" points="'+pts+'"/></svg>'
    +'<div class="lab-spark-cap">Δ revenue / month · '+n+' turns · latest '+(last>=0?'+':'')+labMoney(last)+'</div></div>';
}
function labSet(k,raw){
  const v=parseFloat(raw); if(!isFinite(v)) return;
  LAB.ticketing[k]=v;
  const el=document.getElementById('labval-'+k); if(el) el.textContent=labKnobFmt(k,v);
  labRefresh();
}
function labRefresh(){
  const rep=labTicketingReport();
  const k=document.getElementById('lab-kpis'); if(k) k.innerHTML=labKpiHTML(rep);
  const b=document.getElementById('lab-tbody'); if(b) b.innerHTML=labRowsHTML(rep);
}
function labResetTicketing(){
  Object.assign(LAB.ticketing, LAB_TKT_DEF);
  openLabTicketing();   // full rebuild so slider positions reset too
}
function buildLabTicketingHTML(){
  const rep = labTicketingReport(), T = LAB.ticketing;
  return ''
    +'<div id="lab-kpis">'+labKpiHTML(rep)+'</div>'
    +labControlsHTML()
    +labSparkHTML()
    +'<div class="lab-note">Shadow only — the live game is untouched. A premium seat costs '+T.bizSpace+'–'+T.firstSpace+'× the floor of an economy seat, so total seats fall — the trade is yield vs. headcount, and that cost only bites on near-full routes.</div>'
    +'<div class="lab-tablewrap"><table class="lab-table"><thead><tr>'
    +'<th>Route</th><th class="num">Biz%</th><th class="num">Now</th><th class="num">Cabins</th><th class="num">Δ</th><th class="num">F/B/Y</th>'
    +'</tr></thead><tbody id="lab-tbody">'+labRowsHTML(rep)+'</tbody></table></div>';
}
function openLabTicketing(){
  if (!LAB.on) { LAB.on = true; try{ localStorage.setItem('ae_lab','1'); }catch(e){} }
  const ov = document.getElementById('lab-overlay');
  const c  = document.getElementById('lab-content');
  if (!ov || !c) return;
  c.innerHTML = '<div class="lab-head"><h2>\ud83e\uddea Ticketing Tiers \u2014 Shadow</h2>'
    +'<div class="lab-sub">Parallel cabin-mix preview \u00b7 reads real routes \u00b7 changes nothing</div>'
    +'<button class="lab-x" onclick="closeLab()">\u2715</button></div>'
    +'<div class="lab-scroll">'+buildLabTicketingHTML()+'</div>';
  ov.classList.add('open');
}
function closeLab(){ const ov=document.getElementById('lab-overlay'); if(ov) ov.classList.remove('open'); }
// === LAB HARNESS END ===
function maybeShowChangelog(){ /* What's New removed entirely by request */ }
function showIntro(){
  document.getElementById('intro').classList.remove('hidden');
  document.getElementById('setup').classList.add('hidden');
  document.getElementById('game-ui').classList.add('hidden');
  const dtl = document.getElementById('dt-launch'); if (dtl) dtl.classList.add('dt-gone');
  const dtp = document.getElementById('dev-tuner'); if (dtp) dtp.classList.add('dt-hidden');
  buildIntroBg();
  updateIntroMenu();
  if(!window.__introPlayed){
    window.__introPlayed=true;
    playIntroCinematic();
  } else {
    const cine=document.getElementById('cinematic'); if(cine) cine.classList.add('hidden','done');
    revealIntro();
  }
}
function startNewGame(){
  endCinematic();
  if(setupChoice.type==='daily') setupChoice.type='scenario';
  document.getElementById('intro').classList.add('hidden');
  const setup = document.getElementById('setup');
  setup.classList.remove('hidden');
  setTimeout(()=>{
    const wzFlap = document.getElementById('wz-flap-title');
    if (wzFlap) splitFlap(wzFlap, 'AIRLINE EMPIRE');
  }, 180);
  _wzPage = 1;
  try{ buildIntroBg(); }catch(e){}   // carry the intro network through setup
  document.querySelectorAll('.wz-page').forEach((p,i)=>p.classList.toggle('active', i===0));
  ['wz-step-1','wz-step-2','wz-step-3'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='';
  });
  document.querySelectorAll('.wz-step-line').forEach(el=>el.style.display='');
  document.querySelectorAll('.wz-step').forEach((s,i)=>{ s.classList.remove('active','done'); if(i===0) s.classList.add('active'); });
  wzRenderPage1();
}
function expandCard(e, card) {
  e.stopPropagation();
  const isOpen = card.classList.contains('expanded');
  // Close all first (and reset their toggles)
  document.querySelectorAll('.intro-card.expanded').forEach(c => {
    c.classList.remove('expanded');
    const t = c.querySelector('.ic-toggle');
    if (t) { t.textContent = '＋'; t.title = 'Show details'; t.setAttribute('aria-label','Show details'); }
  });
  if (!isOpen) {
    card.classList.add('expanded');
    const t = card.querySelector('.ic-toggle');
    if (t) { t.textContent = '✕'; t.title = 'Hide details'; t.setAttribute('aria-label','Hide details'); }
  }
}
// Click anywhere outside cards to close
document.addEventListener('click', () => {
  document.querySelectorAll('.intro-card.expanded').forEach(c => {
    c.classList.remove('expanded');
    const t = c.querySelector('.ic-toggle');
    if (t) { t.textContent = '＋'; t.title = 'Show details'; t.setAttribute('aria-label','Show details'); }
  });
});
function reflipTitle(){
  // Re-flip every AIRLINE EMPIRE flap-board in the page
  const targets = [
    document.getElementById('intro-title'),
    document.getElementById('wz-flap-title'),
  ];
  targets.forEach(el => { if (el) splitFlap(el, 'AIRLINE EMPIRE'); });
}
let _poke={n:0,t:0};
function planePoke(){
  const now=Date.now();
  if(now-_poke.t>1500) _poke.n=0;
  _poke.t=now; _poke.n++;
  if(_poke.n>=3){ _poke.n=0; barrelRoll(); }
}
function barrelRoll(){
  const el=document.getElementById('intro-inner'); if(!el) return;
  el.classList.remove('barrel'); void el.offsetWidth; el.classList.add('barrel');
  flashIntro('🛩  Barrel roll!');
}
function flashIntro(msg){
  const t=document.getElementById('intro-toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'), 2800);
}
function planeShower(){
  for(let i=0;i<26;i++){
    const s=document.createElement('div'); s.className='plane-confetti'; s.textContent='✈';
    s.style.left=Math.random()*100+'vw';
    s.style.color = Math.random()<0.5 ? 'var(--accent)' : 'var(--accent2)';
    const dur=2.2+Math.random()*2.2;
    s.style.animationDuration=dur+'s';
    s.style.animationDelay=(Math.random()*0.8)+'s';
    s.style.fontSize=(14+Math.random()*16)+'px';
    document.body.appendChild(s);
    setTimeout(()=>s.remove(), (dur+1.2)*1000);
  }
}
function fireworksBurst(color, originX, originY){
  const cx = originX != null ? originX : window.innerWidth  * (0.22 + Math.random()*0.56);
  const cy = originY != null ? originY : window.innerHeight * (0.16 + Math.random()*0.30);
  const palette = [color || '#a789ff', '#ffd86b', '#ffffff', '#ff7eb6'];
  const N = 20;
  for(let i=0;i<N;i++){
    const p=document.createElement('div'); p.className='fw-particle';
    const ang = (i/N)*Math.PI*2 + Math.random()*0.35;
    const dist = 46 + Math.random()*78;
    p.style.left=cx+'px'; p.style.top=cy+'px';
    p.style.background = palette[i % palette.length];
    p.style.setProperty('--dx', (Math.cos(ang)*dist).toFixed(1)+'px');
    p.style.setProperty('--dy', (Math.sin(ang)*dist).toFixed(1)+'px');
    document.body.appendChild(p);
    setTimeout(()=>p.remove(), 1100);
  }
}
function maidenFlight(from, to){
  if (document.getElementById('maiden-overlay')) return;
  const livery = STATE.livery || '#a789ff';
  const ov = document.createElement('div');
  ov.id = 'maiden-overlay';
  ov.innerHTML = `
    <div class="maiden-plane" style="color:${livery}">✈</div>
    <div class="maiden-card">
      <div class="maiden-kicker" style="color:${livery}">${STATE.logo||'✈'} ${STATE.coName||'YOUR AIRLINE'}</div>
      <div class="maiden-title">MAIDEN FLIGHT</div>
      <div class="maiden-rule" style="background:${livery}"></div>
      <div class="maiden-route">${from} <span style="opacity:.55">→</span> ${to}</div>
      <div class="maiden-sub">Your first route is in the air. Clear skies, Captain.</div>
      <div class="maiden-skip">Tap anywhere to continue</div>
    </div>`;
  const close = () => { if (ov._closed) return; ov._closed = true; clearInterval(ov._fw); ov.classList.add('maiden-out'); setTimeout(()=>ov.remove(), 560); };
  ov.onclick = close;
  document.body.appendChild(ov);
  fireworksBurst(livery);
  let n = 0;
  ov._fw = setInterval(()=>{ fireworksBurst(livery); if(++n >= 5) clearInterval(ov._fw); }, 430);
  ov._t = setTimeout(close, 3400);
}
function maidenFirstMonth(){
  const livery = STATE.livery || '#a789ff';
  // a quick burst of fireworks over the map + a celebratory flash, no full takeover
  fireworksBurst(livery, window.innerWidth*0.5, window.innerHeight*0.28);
  setTimeout(()=>fireworksBurst('#ffd86b', window.innerWidth*0.62, window.innerHeight*0.22), 300);
  if (typeof showFlash === 'function') showFlash(`${STATE.logo||'✈'} First month in the skies — welcome aboard, ${STATE.coName||'Captain'}!`);
}
const KONAMI=['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
let _kPos=0;
document.addEventListener('keydown', e=>{
  const intro=document.getElementById('intro');
  if(!intro || intro.classList.contains('hidden')){ _kPos=0; return; }
  const k=(e.key||'').toLowerCase();
  if(k===KONAMI[_kPos]){ _kPos++; if(_kPos===KONAMI.length){ _kPos=0; konamiUnlock(); } }
  else { _kPos = (k===KONAMI[0]) ? 1 : 0; }
});
function konamiUnlock(){
  window.__cheatBonus=500;
  endCinematic();
  splitFlap(document.getElementById('intro-title'),'CLEARED  HOT');
  setTimeout(revealIntro, 2600);
  planeShower();
  flashIntro('✈  SECRET CLEARANCE — +$500M starting capital on launch!');
}
showIntro();
/* ===== MOCKUP DASHBOARD LAYER (2024-dash) — rides on top of existing systems ===== */
function _mockIcon(name){
  const I={
    mi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2.2"/><path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5M12 8a4 4 0 0 1 4 4M4.5 12A7.5 7.5 0 0 1 12 4.5"/><path d="M12 12l5.5 5.5"/></svg>',
    projects:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l2.5 5 5.5.8-4 3.9.9 5.5L12 16.1 7.1 18.7l.9-5.5-4-3.9 5.5-.8z"/></svg>'
  };
  return I[name]||'';
}
function _mockDashSetup(){
  try{
    /* header: tagline */
    const lock=document.querySelector('#header .ae-lock');
    if(lock && !document.getElementById('ae-tagline')){
      const t=document.createElement('div'); t.id='ae-tagline'; t.textContent='BUILD. CONNECT. DOMINATE.';
      lock.appendChild(t);
    }
    /* header: relabel stat tiles + hide fuel */
    document.querySelectorAll('#header .hdr-stat .label').forEach(l=>{
      const tx=l.textContent.trim();
      if(tx==='Cash') l.textContent='Cash Balance';
      else if(tx==='Weekly Profit') l.textContent='Daily Profit';
      else if(tx==='Passengers') l.textContent='Fleet Value';
      else if(tx==='Fuel Price'){ const tile=l.closest('.hdr-stat'); if(tile) tile.style.display='none'; }
    });
    /* header: move END TURN button up beside the date */
    const et=document.getElementById('end-turn-btn'), hdr=document.getElementById('header');
    if(et && hdr && et.parentElement && et.parentElement.id!=='header'){ hdr.appendChild(et); et.classList.add('hdr-endturn'); et.innerHTML='END TURN <span class="et-arrow">\u2192</span>'; }
    /* sidebar: grouped rows */
    const nav=document.getElementById('ae-nav');
    if(nav && !nav.dataset.mock2){ nav.dataset.mock2='1';
      const icon={}; nav.querySelectorAll('.ae-nav-item').forEach(n=>{ const m=(n.getAttribute('onclick')||'').match(/'([a-z]+)'/); const sv=n.querySelector('svg'); if(m&&sv) icon[m[1]]=sv.outerHTML; });
      const SUB={dash:'Command & Overview',routes:'Network & Route Map',fleet:'Hangar & Aircraft',airports:'Network & Hubs',cargo:'Logistics & Freight',maintenance:'Repairs & Service',finance:'Budget & Expenses',research:'Research & Upgrades',hr:'Recruitment & Staff',reports:'Analytics & Performance',alliances:'Partners & Codeshares',logs:'Finance & Event History',mi:'Forecasts & Rivals',marketing:'Campaigns & Ads'};
      const BDG={routes:'mnb-routes',fleet:'mnb-fleet',airports:'mnb-airports',maintenance:'mnb-maint',reports:'mnb-reports'};
      const row=(k,label,ic)=>`<div class="ae-nav-item${k==='dash'?' active':''}" onclick="navGo(this,'${k}')">${ic||icon[k]||''}<span class="mn-two"><span class="mn-l">${label}</span><span class="mn-s">${SUB[k]||''}</span></span>${BDG[k]?`<span class="mns-badge" id="${BDG[k]}"></span>`:''}</div>`;
      const sec=t=>`<div class="mock-nav-sec"><span class="mns-dot"></span>${t}</div>`;
      nav.innerHTML =
        sec('Overview')+row('dash','Dashboard')+
        sec('Operations')+row('routes','Routes')+row('fleet','Fleet')+row('airports','Airports')+row('cargo','Cargo')+row('maintenance','Maintenance')+
        sec('Company')+row('finance','Finance')+row('research','Research')+row('hr','Human Resources')+row('reports','Reports')+row('alliances','Alliances')+row('logs','Logs')+
        sec('Growth')+row('mi','Market Intelligence',_mockIcon('mi'))+row('marketing','Marketing');
    }
    /* sidebar: CEO card pinned at the bottom */
    const lp=document.getElementById('left-panel');
    if(lp && !document.getElementById('mock-ceo-card')){
      const c=document.createElement('div'); c.id='mock-ceo-card';
      c.innerHTML='<div class="mcc-top"><div class="mcc-av" id="mcc-av">A</div><div class="mcc-meta"><div class="mcc-name" id="mcc-name">Airline</div><div class="mcc-role">Chief Executive Officer</div></div><button class="mcc-gear" onclick="openModal(\'settings\')" title="Settings">\u2699</button></div><div class="mcc-cashrow"><span class="mcc-cl">CASH BALANCE</span><span class="mcc-cv" id="mcc-cash">\u2014</span></div>';
      lp.appendChild(c);
    }
    /* wider rail default; clear stale narrow saved width */
    try{
      const w=JSON.parse(localStorage.getItem('aePanelWidths')||'{}');
      if(w.left && w.left<170){ delete w.left; localStorage.setItem('aePanelWidths', JSON.stringify(w)); }
      if(!w.left) document.documentElement.style.setProperty('--ae-rail-w','232px');
    }catch(e){ document.documentElement.style.setProperty('--ae-rail-w','232px'); }
    /* right panel: Operations Center header + View All + Quick Actions */
    const ocT=document.querySelector('#ops-center .oc-title'); if(ocT) ocT.textContent='OPERATIONS CENTER';
    const ocH=document.querySelector('#ops-center .oc-head');
    if(ocH && !document.getElementById('oc-viewall')){
      const va=document.createElement('span'); va.id='oc-viewall'; va.textContent='View All'; va.onclick=()=>openModal('logviewer'); ocH.appendChild(va);
    }
    const ocS=document.querySelector('#ops-center .oc-sub'); if(ocS) ocS.textContent='Real-time overview of your airline.';
    const rps=document.querySelector('#right-panel .panel-scroll');
    if(rps && !document.getElementById('mock-quick')){
      const q=document.createElement('div'); q.id='mock-quick';
      const act=(ic,label,fn)=>`<div class="mq-row" onclick="${fn}"><span class="mq-ic">${ic}</span><span>${label}</span></div>`;
      q.innerHTML='<div class="mq-title">QUICK ACTIONS</div>'+
        act('\u2708','Add Route',"openModal('new-route')")+
        act('\u2708','Purchase Aircraft',"openModal('buy-planes')")+
        act('\ud83d\udce3','New Campaign',"openModal('campaign')")+
        act('\ud83d\udcc4','View Reports',"openModal('ledger')");
      rps.appendChild(q);
    }
    /* label the existing turn-speed cluster so it reads as the time control */
    const sc=document.getElementById('speed-ctrl');
    if(sc && !document.getElementById('ts-label')){
      const l=document.createElement('span'); l.id='ts-label'; l.className='hdr-timescale-label'; l.textContent='Time Scale';
      sc.parentElement.insertBefore(l, sc);
    }
    /* live status tiles above the map (monthly-proxy flavor) */
    const mc2=document.getElementById('map-container');
    if(mc2 && !document.getElementById('mock-livetiles')){
      const lt=document.createElement('div'); lt.id='mock-livetiles';
      const tile=(id,label)=>`<div class="mlt"><div class="mlt-l">${label}</div><div class="mlt-v" id="${id}">\u2014</div><div class="mlt-s" id="${id}-s"></div></div>`;
      lt.innerHTML=tile('mlt-air','Aircraft In Air')+tile('mlt-otp','On-Time Performance')+tile('mlt-rev','Daily Revenue')+tile('mlt-dem','Demand Index')+tile('mlt-fuel','Fuel Price')+tile('mlt-wx','Weather Impact');
      mc2.insertAdjacentElement('beforebegin', lt);
    }
    /* Active Alerts panel in the right column */
    const rps2=document.querySelector('#right-panel .panel-scroll');
    if(rps2 && !document.getElementById('mock-alertspanel')){
      const ap=document.createElement('div'); ap.id='mock-alertspanel';
      ap.innerHTML='<div class="map-head"><span class="map-title">ACTIVE ALERTS <span id="map-count"></span></span><span class="map-viewall" onclick="mockOpenAlerts()">View All</span></div><div id="map-list"></div><button class="map-allbtn" onclick="mockOpenAlerts()">\u26a0 VIEW ALL ALERTS</button>';
      const q=document.getElementById('mock-quick');
      if(q) rps2.insertBefore(ap,q); else rps2.appendChild(ap);
    }
  }catch(e){ console.warn('mock dash setup', e); }
}
function _mockDashSync(){
  if(typeof STATE==='undefined' || !STATE || !STATE.routes) return;
  const $=id=>document.getElementById(id);
  const money=v=>'$'+(Math.abs(v)>=1000?(v/1000).toFixed(2)+'B':(Math.round(v*10)/10)+'M');
  try{
    /* header tiles */
    const net=(STATE._finHist&&STATE._finHist.length?STATE._finHist[STATE._finHist.length-1].net:0)||0;
    const dp=$('h-wprofit'); if(dp) dp.textContent=(net<0?'-':'')+money(Math.abs(net)/30).replace('$','$');
    const dpd=$('h-wprofit-d'); if(dpd) dpd.textContent='per day \u00b7 monthly proxy';
    let fv=0; Object.entries(STATE.planes||{}).forEach(([t,p])=>{ const ac=(typeof AIRCRAFT!=='undefined'&&AIRCRAFT[t])||{}; fv+=(p.owned||0)*(ac.cost||ac.price||40); });
    const fvEl=$('h-paxm'); if(fvEl) fvEl.textContent=money(fv);
    const fvd=$('h-paxm-d'); if(fvd) fvd.textContent='';
    const rep=Math.round((STATE.repScore!=null?STATE.repScore:(STATE.reputation!=null?STATE.reputation:0))||0);
    const word=rep>=80?'Great':rep>=60?'Good':rep>=40?'Fair':'Poor';
    const repEl=$('h-rep'); if(repEl) repEl.innerHTML = rep>0 ? rep+' <span class="rep-word">'+word+'</span>' : '\u2014';
    const served=new Set(); (STATE.routes||[]).forEach(r=>{served.add(r.from);served.add(r.to);}); (STATE.hubs||[]).forEach(h=>served.add(h));
    let inc=0, grounded=0;
    Object.keys(STATE.planes||{}).forEach(n=>{ try{ if(typeof maintIsGrounded==='function'&&maintIsGrounded(n)) grounded++; }catch(e){} });
    inc=(STATE.maintIncidents||[]).filter(i=>!i.resolved).length;
    const otp=Math.max(72, Math.min(98, 96 - inc*2 - grounded*3));
    /* CEO card */
    const nm=STATE.coName||'Airline';
    if($('mcc-name')) $('mcc-name').textContent=nm.toUpperCase();
    if($('mcc-av')) $('mcc-av').textContent=(nm[0]||'A').toUpperCase();
    /* sidebar badges + CEO cash */
    const setB=(id,v,cls)=>{const e=$(id); if(!e) return; if(v>0){e.textContent=v; e.className='mns-badge show'+(cls?' '+cls:'');} else {e.textContent=''; e.className='mns-badge';}};
    const totalOwned=Object.values(STATE.planes||{}).reduce((s,p)=>s+(p.owned||0),0);
    const attention=grounded+inc;
    setB('mnb-routes',(STATE.routes||[]).length);
    setB('mnb-fleet',totalOwned, grounded>0?'bad':'');
    setB('mnb-airports',served.size);
    setB('mnb-maint',attention,'bad');
    setB('mnb-reports',(STATE.financeLog||[]).length);
    if($('mcc-cash')) $('mcc-cash').textContent=money(STATE.cash||0);
    /* live tiles (frozen per month via seed) */
    const seed=(STATE._absMonth||0)*7919;
    const jit=n=>Math.abs((seed>>(n%13))%7);
    const routesN=(STATE.routes||[]).length;
    const inAir=routesN?Math.min(totalOwned||routesN, Math.max(1, Math.round(routesN*0.62)+jit(1)%3)):0;
    const setT=(id,v,s,col)=>{const e=$(id); if(e){e.textContent=v; if(col)e.style.color=col;} const se=$(id+'-s'); if(se) se.innerHTML=s||'';};
    setT('mlt-air', inAir+' / '+(totalOwned||'\u2014'), 'this month \u00b7 proxy');
    setT('mlt-otp', (routesN?otp+'%':'\u2014'), '');
    const h2=STATE._finHist||[]; const lastInc=h2.length?h2[h2.length-1].income:0; const prevInc=h2.length>1?h2[h2.length-2].income:0;
    const rpct=prevInc?Math.round((lastInc-prevInc)/Math.abs(prevInc)*1000)/10:0;
    setT('mlt-rev', money(lastInc/30), h2.length>1?('<span style="color:'+(rpct>=0?'var(--profit)':'var(--loss)')+'">'+(rpct>=0?'+':'')+rpct+'%</span>'):'');
    const avgLoad=routesN?(STATE.routes.reduce((s,r)=>s+(r.load||0),0)/routesN):0;
    const dem=routesN?Math.round(avgLoad/65*100)/100:0;
    setT('mlt-dem', routesN?dem.toFixed(2)+'x':'\u2014', routesN?('<span style="color:'+(dem>1.1?'var(--accent2)':'#fff')+'">'+(dem>1.1?'High':dem>0.9?'Moderate':'Low')+'</span>'):'');
    const fuelMult2=((STATE.fuelMod!=null?STATE.fuelMod:1)*(typeof timedFuelMod==='function'?timedFuelMod():1))||1;
    const fuelP=2.40*fuelMult2; const fd2=(STATE._fuelPrev!=null)?(fuelP-STATE._fuelPrev):0;
    setT('mlt-fuel','$'+fuelP.toFixed(2), fd2?('<span style="color:'+(fd2<=0?'var(--profit)':'var(--loss)')+'">'+(fd2>0?'+':'')+fd2.toFixed(2)+'</span>'):'');
    const fx=(STATE.timedEffects||[]).length;
    setT('mlt-wx', fx===0?'None':fx<=2?'Low':fx<=4?'Moderate':'High', fx? fx+' active event'+(fx>1?'s':'') : 'clear skies', fx>=3?'var(--accent2)':undefined);
    /* Active Alerts panel */
    const apl=document.getElementById('map-list');
    if(apl){
      const rows=[];
      const arow=(sev,title,sub,fn)=>rows.push('<div class="map-row '+sev+'" onclick="'+(fn||'')+'"><span class="map-ic">'+(sev==='bad'?'\ud83d\udd34':sev==='warn'?'\u26a0':'\u2139')+'</span><span class="map-txt"><b>'+title+'</b><span>'+sub+'</span></span></div>');
      if(attention>0) arow('warn','Maintenance Due', attention+' aircraft require attention \u00b7 check schedule',"openHangarModal()");
      if(grounded>0) arow('bad','Aircraft Grounded', grounded+' grounded for repairs',"openHangarModal()");
      const losers=(STATE.routes||[]).filter(r=>(r.profit||0)<0);
      if(losers.length) arow('bad','Losing Routes', losers.length+' route'+(losers.length>1?'s':'')+' below breakeven',"openRouteManager()");
      const sieged=(STATE.routes||[]).filter(r=>r.siege||r.contested).length;
      if(sieged) arow('warn','Routes Under Siege', sieged+' contested by rivals',"openRouteManager()");
      ((STATE.events||[]).filter(e=>e.type==='bad'||e.type==='warn').slice(0,3)).forEach(e=>arow(e.type==='bad'?'bad':'warn', e.text.replace(/<[^>]*>/g,'').slice(0,46), e.time,"mockOpenAlerts()"));
      const n=rows.length;
      const cnt=document.getElementById('map-count'); if(cnt) cnt.textContent='('+n+')';
      apl.innerHTML = n?rows.slice(0,5).join(''):'<div class="map-empty">All clear \u2014 no active alerts.</div>';
    }
  }catch(e){}
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',_mockDashSetup); else _mockDashSetup();
try{
  const _updateUI_orig_mock = updateUI;
  updateUI = function(){ const r=_updateUI_orig_mock.apply(this,arguments); try{ _mockDashSetup(); _mockDashSync(); }catch(e){} return r; };
}catch(e){}
function mockOpenAlerts(){ try{ openModal('logviewer'); setTimeout(()=>{ if(typeof lvShow==='function') lvShow('ev'); }, 60); }catch(e){} }
function _mockRivalRoutes(){
  try{
    if(typeof STATE==='undefined'||!STATE||!STATE.competitors) return;
    const svg=document.getElementById('world-map'); if(!svg) return;
    document.querySelectorAll('.mock-rival-routes').forEach(el=>el.remove());
    let out='';
    let n=0;
    (STATE.competitors||[]).forEach(c=>{
      (c.routeList||[]).forEach(r=>{
        if(n>=70) return;
        const a=CITIES[r.from], b=CITIES[r.to]; if(!a||!b) return;
        let x1=a.x, x2=b.x;
        if(x2-x1>MAP_W/2) x2-=MAP_W; else if(x1-x2>MAP_W/2) x2+=MAP_W;
        const arc=(a.region!==b.region)?0.18:0.12;
        const mx=(x1+x2)/2, my=(a.y+b.y)/2 - Math.abs(x1-x2)*arc;
        out+='<path d="M'+x1.toFixed(1)+','+a.y.toFixed(1)+' Q'+mx.toFixed(1)+','+my.toFixed(1)+' '+x2.toFixed(1)+','+b.y.toFixed(1)+'" fill="none" stroke="'+(c.color||'#8fb7ff')+'" stroke-width="1" stroke-opacity="0.34" vector-effect="non-scaling-stroke"/>';
        n++;
      });
    });
    if(out){
      svg.querySelectorAll('.routes').forEach(rg=>{
        const parent=rg.parentNode; if(!parent) return;
        const gEl=document.createElementNS('http://www.w3.org/2000/svg','g');
        gEl.setAttribute('class','mock-rival-routes'); gEl.setAttribute('pointer-events','none'); gEl.innerHTML=out;
        parent.insertBefore(gEl, rg);
      });
    }
  }catch(e){}
}
try{
  const _renderMap_orig_mock = renderMap;
  renderMap = function(){ const r=_renderMap_orig_mock.apply(this,arguments); try{ _mockRivalRoutes(); }catch(e){} return r; };
}catch(e){}
/* The moving day/night terminator is intentionally omitted from the map. */
