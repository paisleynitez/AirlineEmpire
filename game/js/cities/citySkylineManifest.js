/* Generated from the live CITIES roster. Keep card UI and rendering out of this data file. */
(function(){
  'use strict';
  const byCity = Object.freeze({
  "Chicago": {
    "iata": "ORD",
    "src": "assets/city-skylines/ord.webp"
  },
  "Minneapolis": {
    "iata": "MSP",
    "src": "assets/city-skylines/msp.webp"
  },
  "New York": {
    "iata": "JFK",
    "src": "assets/city-skylines/jfk.webp"
  },
  "Los Angeles": {
    "iata": "LAX",
    "src": "assets/city-skylines/lax.webp"
  },
  "Atlanta": {
    "iata": "ATL",
    "src": "assets/city-skylines/atl.webp"
  },
  "Dallas": {
    "iata": "DFW",
    "src": "assets/city-skylines/dfw.webp"
  },
  "Seattle": {
    "iata": "SEA",
    "src": "assets/city-skylines/sea.webp"
  },
  "Miami": {
    "iata": "MIA",
    "src": "assets/city-skylines/mia.webp"
  },
  "Toronto": {
    "iata": "YYZ",
    "src": "assets/city-skylines/yyz.webp"
  },
  "Honolulu": {
    "iata": "HNL",
    "src": "assets/city-skylines/hnl.webp"
  },
  "Boston": {
    "iata": "BOS",
    "src": "assets/city-skylines/bos.webp"
  },
  "Washington DC": {
    "iata": "IAD",
    "src": "assets/city-skylines/iad.webp"
  },
  "Philadelphia": {
    "iata": "PHL",
    "src": "assets/city-skylines/phl.webp"
  },
  "Pittsburgh": {
    "iata": "PIT",
    "src": "assets/city-skylines/pit.webp"
  },
  "Charlotte": {
    "iata": "CLT",
    "src": "assets/city-skylines/clt.webp"
  },
  "Orlando": {
    "iata": "MCO",
    "src": "assets/city-skylines/mco.webp"
  },
  "Tampa": {
    "iata": "TPA",
    "src": "assets/city-skylines/tpa.webp"
  },
  "New Orleans": {
    "iata": "MSY",
    "src": "assets/city-skylines/msy.webp"
  },
  "Nashville": {
    "iata": "BNA",
    "src": "assets/city-skylines/bna.webp"
  },
  "Detroit": {
    "iata": "DTW",
    "src": "assets/city-skylines/dtw.webp"
  },
  "Denver": {
    "iata": "DEN",
    "src": "assets/city-skylines/den.webp"
  },
  "Billings": {
    "iata": "BIL",
    "src": "assets/city-skylines/bil.webp"
  },
  "Bismarck": {
    "iata": "BIS",
    "src": "assets/city-skylines/bis.webp"
  },
  "Rapid City": {
    "iata": "RAP",
    "src": "assets/city-skylines/rap.webp"
  },
  "Casper": {
    "iata": "CPR",
    "src": "assets/city-skylines/cpr.webp"
  },
  "Cheyenne": {
    "iata": "CYS",
    "src": "assets/city-skylines/cys.webp"
  },
  "North Platte": {
    "iata": "LBF",
    "src": "assets/city-skylines/lbf.webp"
  },
  "Colorado Springs": {
    "iata": "COS",
    "src": "assets/city-skylines/cos.webp"
  },
  "Amarillo": {
    "iata": "AMA",
    "src": "assets/city-skylines/ama.webp"
  },
  "Lubbock": {
    "iata": "LBB",
    "src": "assets/city-skylines/lbb.webp"
  },
  "Tulsa": {
    "iata": "TUL",
    "src": "assets/city-skylines/tul.webp"
  },
  "El Paso": {
    "iata": "ELP",
    "src": "assets/city-skylines/elp.webp"
  },
  "Kansas City": {
    "iata": "MCI",
    "src": "assets/city-skylines/mci.webp"
  },
  "St Louis": {
    "iata": "STL",
    "src": "assets/city-skylines/stl.webp"
  },
  "Cincinnati": {
    "iata": "CVG",
    "src": "assets/city-skylines/cvg.webp"
  },
  "Phoenix": {
    "iata": "PHX",
    "src": "assets/city-skylines/phx.webp"
  },
  "Las Vegas": {
    "iata": "LAS",
    "src": "assets/city-skylines/las.webp"
  },
  "San Antonio": {
    "iata": "SAT",
    "src": "assets/city-skylines/sat.webp"
  },
  "Houston": {
    "iata": "IAH",
    "src": "assets/city-skylines/iah.webp"
  },
  "Salt Lake City": {
    "iata": "SLC",
    "src": "assets/city-skylines/slc.webp"
  },
  "San Francisco": {
    "iata": "SFO",
    "src": "assets/city-skylines/sfo.webp"
  },
  "Portland": {
    "iata": "PDX",
    "src": "assets/city-skylines/pdx.webp"
  },
  "San Diego": {
    "iata": "SAN",
    "src": "assets/city-skylines/san.webp"
  },
  "Anchorage": {
    "iata": "ANC",
    "src": "assets/city-skylines/anc.webp"
  },
  "Vancouver": {
    "iata": "YVR",
    "src": "assets/city-skylines/yvr.webp"
  },
  "Montreal": {
    "iata": "YUL",
    "src": "assets/city-skylines/yul.webp"
  },
  "Calgary": {
    "iata": "YYC",
    "src": "assets/city-skylines/yyc.webp"
  },
  "Mexico City": {
    "iata": "MEX",
    "src": "assets/city-skylines/mex.webp"
  },
  "Sao Paulo": {
    "iata": "GRU",
    "src": "assets/city-skylines/gru.webp"
  },
  "Lima": {
    "iata": "LIM",
    "src": "assets/city-skylines/lim.webp"
  },
  "Buenos Aires": {
    "iata": "EZE",
    "src": "assets/city-skylines/eze.webp"
  },
  "Bogota": {
    "iata": "BOG",
    "src": "assets/city-skylines/bog.webp"
  },
  "Santiago": {
    "iata": "SCL",
    "src": "assets/city-skylines/scl.webp"
  },
  "Rio de Janeiro": {
    "iata": "GIG",
    "src": "assets/city-skylines/gig.webp"
  },
  "Caracas": {
    "iata": "CCS",
    "src": "assets/city-skylines/ccs.webp"
  },
  "Riyadh": {
    "iata": "RUH",
    "src": "assets/city-skylines/ruh.webp"
  },
  "Istanbul": {
    "iata": "IST",
    "src": "assets/city-skylines/ist.webp"
  },
  "Karachi": {
    "iata": "KHI",
    "src": "assets/city-skylines/khi.webp"
  },
  "Mumbai": {
    "iata": "BOM",
    "src": "assets/city-skylines/bom.webp"
  },
  "Casablanca": {
    "iata": "CMN",
    "src": "assets/city-skylines/cmn.webp"
  },
  "Addis Ababa": {
    "iata": "ADD",
    "src": "assets/city-skylines/add.webp"
  },
  "Accra": {
    "iata": "ACC",
    "src": "assets/city-skylines/acc.webp"
  },
  "Dar es Salaam": {
    "iata": "DAR",
    "src": "assets/city-skylines/dar.webp"
  },
  "Cape Town": {
    "iata": "CPT",
    "src": "assets/city-skylines/cpt.webp"
  },
  "Brisbane": {
    "iata": "BNE",
    "src": "assets/city-skylines/bne.webp"
  },
  "Christchurch": {
    "iata": "CHC",
    "src": "assets/city-skylines/chc.webp"
  },
  "Nadi": {
    "iata": "NAN",
    "src": "assets/city-skylines/nan.webp"
  },
  "Port Moresby": {
    "iata": "POM",
    "src": "assets/city-skylines/pom.webp"
  },
  "Kuala Lumpur": {
    "iata": "KUL",
    "src": "assets/city-skylines/kul.webp"
  },
  "Manila": {
    "iata": "MNL",
    "src": "assets/city-skylines/mnl.webp"
  },
  "Jakarta": {
    "iata": "CGK",
    "src": "assets/city-skylines/cgk.webp"
  },
  "Shanghai": {
    "iata": "PVG",
    "src": "assets/city-skylines/pvg.webp"
  },
  "London": {
    "iata": "LHR",
    "src": "assets/city-skylines/lhr.webp"
  },
  "Munich": {
    "iata": "MUC",
    "src": "assets/city-skylines/muc.webp"
  },
  "Brussels": {
    "iata": "BRU",
    "src": "assets/city-skylines/bru.webp"
  },
  "Copenhagen": {
    "iata": "CPH",
    "src": "assets/city-skylines/cph.webp"
  },
  "Stockholm": {
    "iata": "ARN",
    "src": "assets/city-skylines/arn.webp"
  },
  "Oslo": {
    "iata": "OSL",
    "src": "assets/city-skylines/osl.webp"
  },
  "Helsinki": {
    "iata": "HEL",
    "src": "assets/city-skylines/hel.webp"
  },
  "Lisbon": {
    "iata": "LIS",
    "src": "assets/city-skylines/lis.webp"
  },
  "Dublin": {
    "iata": "DUB",
    "src": "assets/city-skylines/dub.webp"
  },
  "Warsaw": {
    "iata": "WAW",
    "src": "assets/city-skylines/waw.webp"
  },
  "Prague": {
    "iata": "PRG",
    "src": "assets/city-skylines/prg.webp"
  },
  "Budapest": {
    "iata": "BUD",
    "src": "assets/city-skylines/bud.webp"
  },
  "Bucharest": {
    "iata": "OTP",
    "src": "assets/city-skylines/otp.webp"
  },
  "Kiev": {
    "iata": "KBP",
    "src": "assets/city-skylines/kbp.webp"
  },
  "Milan": {
    "iata": "MXP",
    "src": "assets/city-skylines/mxp.webp"
  },
  "Doha": {
    "iata": "DOH",
    "src": "assets/city-skylines/doh.webp"
  },
  "Abu Dhabi": {
    "iata": "AUH",
    "src": "assets/city-skylines/auh.webp"
  },
  "Muscat": {
    "iata": "MCT",
    "src": "assets/city-skylines/mct.webp"
  },
  "Amman": {
    "iata": "AMM",
    "src": "assets/city-skylines/amm.webp"
  },
  "Tel Aviv": {
    "iata": "TLV",
    "src": "assets/city-skylines/tlv.webp"
  },
  "Beirut": {
    "iata": "BEY",
    "src": "assets/city-skylines/bey.webp"
  },
  "Bangalore": {
    "iata": "BLR",
    "src": "assets/city-skylines/blr.webp"
  },
  "Chennai": {
    "iata": "MAA",
    "src": "assets/city-skylines/maa.webp"
  },
  "Colombo": {
    "iata": "CMB",
    "src": "assets/city-skylines/cmb.webp"
  },
  "Dhaka": {
    "iata": "DAC",
    "src": "assets/city-skylines/dac.webp"
  },
  "Kathmandu": {
    "iata": "KTM",
    "src": "assets/city-skylines/ktm.webp"
  },
  "Islamabad": {
    "iata": "ISB",
    "src": "assets/city-skylines/isb.webp"
  },
  "Lahore": {
    "iata": "LHE",
    "src": "assets/city-skylines/lhe.webp"
  },
  "Kuwait City": {
    "iata": "KWI",
    "src": "assets/city-skylines/kwi.webp"
  },
  "Bahrain": {
    "iata": "BAH",
    "src": "assets/city-skylines/bah.webp"
  },
  "Guangzhou": {
    "iata": "CAN",
    "src": "assets/city-skylines/can.webp"
  },
  "Chengdu": {
    "iata": "CTU",
    "src": "assets/city-skylines/ctu.webp"
  },
  "Osaka": {
    "iata": "KIX",
    "src": "assets/city-skylines/kix.webp"
  },
  "Taipei": {
    "iata": "TPE",
    "src": "assets/city-skylines/tpe.webp"
  },
  "Ho Chi Minh": {
    "iata": "SGN",
    "src": "assets/city-skylines/sgn.webp"
  },
  "Hanoi": {
    "iata": "HAN",
    "src": "assets/city-skylines/han.webp"
  },
  "Yangon": {
    "iata": "RGN",
    "src": "assets/city-skylines/rgn.webp"
  },
  "Denpasar": {
    "iata": "DPS",
    "src": "assets/city-skylines/dps.webp"
  },
  "Phnom Penh": {
    "iata": "PNH",
    "src": "assets/city-skylines/pnh.webp"
  },
  "Ulaanbaatar": {
    "iata": "ULN",
    "src": "assets/city-skylines/uln.webp"
  },
  "Algiers": {
    "iata": "ALG",
    "src": "assets/city-skylines/alg.webp"
  },
  "Dakar": {
    "iata": "DKR",
    "src": "assets/city-skylines/dkr.webp"
  },
  "Abidjan": {
    "iata": "ABJ",
    "src": "assets/city-skylines/abj.webp"
  },
  "Kinshasa": {
    "iata": "FIH",
    "src": "assets/city-skylines/fih.webp"
  },
  "Luanda": {
    "iata": "LAD",
    "src": "assets/city-skylines/lad.webp"
  },
  "Harare": {
    "iata": "HRE",
    "src": "assets/city-skylines/hre.webp"
  },
  "Maputo": {
    "iata": "MPM",
    "src": "assets/city-skylines/mpm.webp"
  },
  "Khartoum": {
    "iata": "KRT",
    "src": "assets/city-skylines/krt.webp"
  },
  "Entebbe": {
    "iata": "EBB",
    "src": "assets/city-skylines/ebb.webp"
  },
  "Douala": {
    "iata": "DLA",
    "src": "assets/city-skylines/dla.webp"
  },
  "Mauritius": {
    "iata": "MRU",
    "src": "assets/city-skylines/mru.webp"
  },
  "Medellín": {
    "iata": "MDE",
    "src": "assets/city-skylines/mde.webp"
  },
  "Guayaquil": {
    "iata": "GYE",
    "src": "assets/city-skylines/gye.webp"
  },
  "Quito": {
    "iata": "UIO",
    "src": "assets/city-skylines/uio.webp"
  },
  "Montevideo": {
    "iata": "MVD",
    "src": "assets/city-skylines/mvd.webp"
  },
  "La Paz": {
    "iata": "LPB",
    "src": "assets/city-skylines/lpb.webp"
  },
  "Recife": {
    "iata": "REC",
    "src": "assets/city-skylines/rec.webp"
  },
  "Fortaleza": {
    "iata": "FOR",
    "src": "assets/city-skylines/for.webp"
  },
  "Papeete": {
    "iata": "PPT",
    "src": "assets/city-skylines/ppt.webp"
  },
  "Noumea": {
    "iata": "NOU",
    "src": "assets/city-skylines/nou.webp"
  },
  "Frankfurt": {
    "iata": "FRA",
    "src": "assets/city-skylines/fra.webp"
  },
  "Amsterdam": {
    "iata": "AMS",
    "src": "assets/city-skylines/ams.webp"
  },
  "Rome": {
    "iata": "FCO",
    "src": "assets/city-skylines/fco.webp"
  },
  "Moscow": {
    "iata": "SVO",
    "src": "assets/city-skylines/svo.webp"
  },
  "Madrid": {
    "iata": "MAD",
    "src": "assets/city-skylines/mad.webp"
  },
  "Zurich": {
    "iata": "ZRH",
    "src": "assets/city-skylines/zrh.webp"
  },
  "Vienna": {
    "iata": "VIE",
    "src": "assets/city-skylines/vie.webp"
  },
  "Barcelona": {
    "iata": "BCN",
    "src": "assets/city-skylines/bcn.webp"
  },
  "Athens": {
    "iata": "ATH",
    "src": "assets/city-skylines/ath.webp"
  },
  "Cairo": {
    "iata": "CAI",
    "src": "assets/city-skylines/cai.webp"
  },
  "Tunis": {
    "iata": "TUN",
    "src": "assets/city-skylines/tun.webp"
  },
  "Nairobi": {
    "iata": "NBO",
    "src": "assets/city-skylines/nbo.webp"
  },
  "Lagos": {
    "iata": "LOS",
    "src": "assets/city-skylines/los.webp"
  },
  "Johannesburg": {
    "iata": "JNB",
    "src": "assets/city-skylines/jnb.webp"
  },
  "Baghdad": {
    "iata": "BGW",
    "src": "assets/city-skylines/bgw.webp"
  },
  "Tehran": {
    "iata": "IKA",
    "src": "assets/city-skylines/ika.webp"
  },
  "New Delhi": {
    "iata": "DEL",
    "src": "assets/city-skylines/del.webp"
  },
  "Dubai": {
    "iata": "DXB",
    "src": "assets/city-skylines/dxb.webp"
  },
  "Tokyo": {
    "iata": "NRT",
    "src": "assets/city-skylines/nrt.webp"
  },
  "Beijing": {
    "iata": "PEK",
    "src": "assets/city-skylines/pek.webp"
  },
  "Hong Kong": {
    "iata": "HKG",
    "src": "assets/city-skylines/hkg.webp"
  },
  "Bangkok": {
    "iata": "BKK",
    "src": "assets/city-skylines/bkk.webp"
  },
  "Singapore": {
    "iata": "SIN",
    "src": "assets/city-skylines/sin.webp"
  },
  "Seoul": {
    "iata": "ICN",
    "src": "assets/city-skylines/icn.webp"
  },
  "Sydney": {
    "iata": "SYD",
    "src": "assets/city-skylines/syd.webp"
  },
  "Melbourne": {
    "iata": "MEL",
    "src": "assets/city-skylines/mel.webp"
  },
  "Auckland": {
    "iata": "AKL",
    "src": "assets/city-skylines/akl.webp"
  },
  "Perth": {
    "iata": "PER",
    "src": "assets/city-skylines/per.webp"
  },
  "Birmingham": {
    "iata": "BHM",
    "src": "assets/city-skylines/bhm.webp"
  },
  "Little Rock": {
    "iata": "LIT",
    "src": "assets/city-skylines/lit.webp"
  },
  "Boise": {
    "iata": "BOI",
    "src": "assets/city-skylines/boi.webp"
  },
  "Indianapolis": {
    "iata": "IND",
    "src": "assets/city-skylines/ind.webp"
  },
  "Des Moines": {
    "iata": "DSM",
    "src": "assets/city-skylines/dsm.webp"
  },
  "Wichita": {
    "iata": "ICT",
    "src": "assets/city-skylines/ict.webp"
  },
  "Louisville": {
    "iata": "SDF",
    "src": "assets/city-skylines/sdf.webp"
  },
  "Baltimore": {
    "iata": "BWI",
    "src": "assets/city-skylines/bwi.webp"
  },
  "Jackson MS": {
    "iata": "JAN",
    "src": "assets/city-skylines/jan.webp"
  },
  "Bozeman": {
    "iata": "BZN",
    "src": "assets/city-skylines/bzn.webp"
  },
  "Omaha": {
    "iata": "OMA",
    "src": "assets/city-skylines/oma.webp"
  },
  "Albuquerque": {
    "iata": "ABQ",
    "src": "assets/city-skylines/abq.webp"
  },
  "Fargo": {
    "iata": "FAR",
    "src": "assets/city-skylines/far.webp"
  },
  "Oklahoma City": {
    "iata": "OKC",
    "src": "assets/city-skylines/okc.webp"
  },
  "Charleston SC": {
    "iata": "CHS",
    "src": "assets/city-skylines/chs.webp"
  },
  "Sioux Falls": {
    "iata": "FSD",
    "src": "assets/city-skylines/fsd.webp"
  },
  "Charleston WV": {
    "iata": "CRW",
    "src": "assets/city-skylines/crw.webp"
  },
  "Milwaukee": {
    "iata": "MKE",
    "src": "assets/city-skylines/mke.webp"
  },
  "Jackson Hole": {
    "iata": "JAC",
    "src": "assets/city-skylines/jac.webp"
  },
  "Zagreb": {
    "iata": "ZAG",
    "src": "assets/city-skylines/zag.webp"
  },
  "Belgrade": {
    "iata": "BEG",
    "src": "assets/city-skylines/beg.webp"
  },
  "Sofia": {
    "iata": "SOF",
    "src": "assets/city-skylines/sof.webp"
  },
  "Bratislava": {
    "iata": "BTS",
    "src": "assets/city-skylines/bts.webp"
  },
  "Ljubljana": {
    "iata": "LJU",
    "src": "assets/city-skylines/lju.webp"
  },
  "Riga": {
    "iata": "RIX",
    "src": "assets/city-skylines/rix.webp"
  },
  "Vilnius": {
    "iata": "VNO",
    "src": "assets/city-skylines/vno.webp"
  },
  "Tallinn": {
    "iata": "TLL",
    "src": "assets/city-skylines/tll.webp"
  },
  "Luxembourg": {
    "iata": "LUX",
    "src": "assets/city-skylines/lux.webp"
  },
  "Reykjavik": {
    "iata": "KEF",
    "src": "assets/city-skylines/kef.webp"
  },
  "Skopje": {
    "iata": "SKP",
    "src": "assets/city-skylines/skp.webp"
  },
  "Sarajevo": {
    "iata": "SJJ",
    "src": "assets/city-skylines/sjj.webp"
  },
  "Tirana": {
    "iata": "TIA",
    "src": "assets/city-skylines/tia.webp"
  },
  "Chisinau": {
    "iata": "KIV",
    "src": "assets/city-skylines/kiv.webp"
  },
  "Podgorica": {
    "iata": "TGD",
    "src": "assets/city-skylines/tgd.webp"
  },
  "Pristina": {
    "iata": "PRN",
    "src": "assets/city-skylines/iata-prn.webp"
  },
  "Minsk": {
    "iata": "MSQ",
    "src": "assets/city-skylines/msq.webp"
  },
  "Tbilisi": {
    "iata": "TBS",
    "src": "assets/city-skylines/tbs.webp"
  },
  "Yerevan": {
    "iata": "EVN",
    "src": "assets/city-skylines/evn.webp"
  },
  "Baku": {
    "iata": "GYD",
    "src": "assets/city-skylines/gyd.webp"
  },
  "Damascus": {
    "iata": "DAM",
    "src": "assets/city-skylines/dam.webp"
  },
  "Sanaa": {
    "iata": "SAH",
    "src": "assets/city-skylines/sah.webp"
  },
  "Tripoli": {
    "iata": "TIP",
    "src": "assets/city-skylines/tip.webp"
  },
  "Kabul": {
    "iata": "KBL",
    "src": "assets/city-skylines/kbl.webp"
  },
  "Nur-Sultan": {
    "iata": "NQZ",
    "src": "assets/city-skylines/nqz.webp"
  },
  "Almaty": {
    "iata": "ALA",
    "src": "assets/city-skylines/ala.webp"
  },
  "Tashkent": {
    "iata": "TAS",
    "src": "assets/city-skylines/tas.webp"
  },
  "Ashgabat": {
    "iata": "ASB",
    "src": "assets/city-skylines/asb.webp"
  },
  "Dushanbe": {
    "iata": "DYU",
    "src": "assets/city-skylines/dyu.webp"
  },
  "Bishkek": {
    "iata": "FRU",
    "src": "assets/city-skylines/fru.webp"
  },
  "Vientiane": {
    "iata": "VTE",
    "src": "assets/city-skylines/vte.webp"
  },
  "Bandar Seri": {
    "iata": "BWN",
    "src": "assets/city-skylines/bwn.webp"
  },
  "Kigali": {
    "iata": "KGL",
    "src": "assets/city-skylines/kgl.webp"
  },
  "Gaborone": {
    "iata": "GBE",
    "src": "assets/city-skylines/gbe.webp"
  },
  "Windhoek": {
    "iata": "WDH",
    "src": "assets/city-skylines/wdh.webp"
  },
  "Antananarivo": {
    "iata": "TNR",
    "src": "assets/city-skylines/tnr.webp"
  },
  "Lilongwe": {
    "iata": "LLW",
    "src": "assets/city-skylines/llw.webp"
  },
  "Bamako": {
    "iata": "BKO",
    "src": "assets/city-skylines/bko.webp"
  },
  "Niamey": {
    "iata": "NIM",
    "src": "assets/city-skylines/nim.webp"
  },
  "Ouagadougou": {
    "iata": "OUA",
    "src": "assets/city-skylines/oua.webp"
  },
  "Conakry": {
    "iata": "CKY",
    "src": "assets/city-skylines/cky.webp"
  },
  "Lomé": {
    "iata": "LFW",
    "src": "assets/city-skylines/lfw.webp"
  },
  "Cotonou": {
    "iata": "COO",
    "src": "assets/city-skylines/coo.webp"
  },
  "Banjul": {
    "iata": "BJL",
    "src": "assets/city-skylines/bjl.webp"
  },
  "Freetown": {
    "iata": "FNA",
    "src": "assets/city-skylines/fna.webp"
  },
  "Monrovia": {
    "iata": "ROB",
    "src": "assets/city-skylines/rob.webp"
  },
  "Mogadishu": {
    "iata": "MGQ",
    "src": "assets/city-skylines/mgq.webp"
  },
  "Djibouti": {
    "iata": "JIB",
    "src": "assets/city-skylines/jib.webp"
  },
  "NDjamena": {
    "iata": "NDJ",
    "src": "assets/city-skylines/ndj.webp"
  },
  "Bangui": {
    "iata": "BGF",
    "src": "assets/city-skylines/bgf.webp"
  },
  "Libreville": {
    "iata": "LBV",
    "src": "assets/city-skylines/lbv.webp"
  },
  "Brazzaville": {
    "iata": "BZV",
    "src": "assets/city-skylines/bzv.webp"
  },
  "Malabo": {
    "iata": "SSG",
    "src": "assets/city-skylines/ssg.webp"
  },
  "Asmara": {
    "iata": "ASM",
    "src": "assets/city-skylines/asm.webp"
  },
  "Lusaka": {
    "iata": "LUN",
    "src": "assets/city-skylines/lun.webp"
  },
  "Nouakchott": {
    "iata": "NKC",
    "src": "assets/city-skylines/nkc.webp"
  },
  "Guatemala City": {
    "iata": "GUA",
    "src": "assets/city-skylines/gua.webp"
  },
  "Tegucigalpa": {
    "iata": "SAP",
    "src": "assets/city-skylines/sap.webp"
  },
  "San Salvador": {
    "iata": "SAL",
    "src": "assets/city-skylines/sal.webp"
  },
  "Managua": {
    "iata": "MGA",
    "src": "assets/city-skylines/mga.webp"
  },
  "San Jose CR": {
    "iata": "SJO",
    "src": "assets/city-skylines/sjo.webp"
  },
  "Panama City": {
    "iata": "PTY",
    "src": "assets/city-skylines/pty.webp"
  },
  "Havana": {
    "iata": "HAV",
    "src": "assets/city-skylines/hav.webp"
  },
  "Kingston": {
    "iata": "KIN",
    "src": "assets/city-skylines/kin.webp"
  },
  "Port-au-Prince": {
    "iata": "PAP",
    "src": "assets/city-skylines/pap.webp"
  },
  "Santo Domingo": {
    "iata": "SDQ",
    "src": "assets/city-skylines/sdq.webp"
  },
  "Port of Spain": {
    "iata": "POS",
    "src": "assets/city-skylines/pos.webp"
  },
  "Belmopan": {
    "iata": "BZE",
    "src": "assets/city-skylines/bze.webp"
  },
  "San Juan PR": {
    "iata": "SJU",
    "src": "assets/city-skylines/sju.webp"
  },
  "Dili": {
    "iata": "DIL",
    "src": "assets/city-skylines/dil.webp"
  },
  "Pyongyang": {
    "iata": "FNJ",
    "src": "assets/city-skylines/fnj.webp"
  },
  "Paris": {
    "iata": "CDG",
    "src": "assets/city-skylines/cdg.webp"
  },
  "Nice": {
    "iata": "NCE",
    "src": "assets/city-skylines/nce.webp"
  },
  "Lyon": {
    "iata": "LYS",
    "src": "assets/city-skylines/lys.webp"
  },
  "Geneva": {
    "iata": "GVA",
    "src": "assets/city-skylines/gva.webp"
  },
  "Hamburg": {
    "iata": "HAM",
    "src": "assets/city-skylines/ham.webp"
  },
  "Berlin": {
    "iata": "BER",
    "src": "assets/city-skylines/ber.webp"
  },
  "Dusseldorf": {
    "iata": "DUS",
    "src": "assets/city-skylines/dus.webp"
  },
  "Manchester": {
    "iata": "MAN",
    "src": "assets/city-skylines/man.webp"
  },
  "Edinburgh": {
    "iata": "EDI",
    "src": "assets/city-skylines/edi.webp"
  },
  "Glasgow": {
    "iata": "GLA",
    "src": "assets/city-skylines/gla.webp"
  },
  "Porto": {
    "iata": "OPO",
    "src": "assets/city-skylines/opo.webp"
  },
  "Venice": {
    "iata": "VCE",
    "src": "assets/city-skylines/vce.webp"
  },
  "Naples": {
    "iata": "NAP",
    "src": "assets/city-skylines/nap.webp"
  },
  "Florence": {
    "iata": "FLR",
    "src": "assets/city-skylines/flr.webp"
  },
  "Palma": {
    "iata": "PMI",
    "src": "assets/city-skylines/pmi.webp"
  },
  "Malaga": {
    "iata": "AGP",
    "src": "assets/city-skylines/agp.webp"
  },
  "Seville": {
    "iata": "SVQ",
    "src": "assets/city-skylines/svq.webp"
  },
  "Valencia": {
    "iata": "VLC",
    "src": "assets/city-skylines/vlc.webp"
  },
  "Krakow": {
    "iata": "KRK",
    "src": "assets/city-skylines/krk.webp"
  },
  "Antalya": {
    "iata": "AYT",
    "src": "assets/city-skylines/ayt.webp"
  },
  "Split": {
    "iata": "SPU",
    "src": "assets/city-skylines/spu.webp"
  },
  "Thessaloniki": {
    "iata": "SKG",
    "src": "assets/city-skylines/skg.webp"
  },
  "St Petersburg": {
    "iata": "LED",
    "src": "assets/city-skylines/led.webp"
  },
  "Tenerife": {
    "iata": "TFS",
    "src": "assets/city-skylines/tfs.webp"
  },
  "Faro": {
    "iata": "FAO",
    "src": "assets/city-skylines/fao.webp"
  },
  "Jeddah": {
    "iata": "JED",
    "src": "assets/city-skylines/jed.webp"
  },
  "Marrakech": {
    "iata": "RAK",
    "src": "assets/city-skylines/rak.webp"
  },
  "Tangier": {
    "iata": "TNG",
    "src": "assets/city-skylines/tng.webp"
  },
  "Sharm el-Sheikh": {
    "iata": "SSH",
    "src": "assets/city-skylines/ssh.webp"
  },
  "Mombasa": {
    "iata": "MBA",
    "src": "assets/city-skylines/mba.webp"
  },
  "Zanzibar": {
    "iata": "ZNZ",
    "src": "assets/city-skylines/znz.webp"
  },
  "Kolkata": {
    "iata": "CCU",
    "src": "assets/city-skylines/ccu.webp"
  },
  "Hyderabad": {
    "iata": "HYD",
    "src": "assets/city-skylines/hyd.webp"
  },
  "Ahmedabad": {
    "iata": "AMD",
    "src": "assets/city-skylines/amd.webp"
  },
  "Goa": {
    "iata": "GOI",
    "src": "assets/city-skylines/goi.webp"
  },
  "Kochi": {
    "iata": "COK",
    "src": "assets/city-skylines/cok.webp"
  },
  "Sapporo": {
    "iata": "CTS",
    "src": "assets/city-skylines/cts.webp"
  },
  "Fukuoka": {
    "iata": "FUK",
    "src": "assets/city-skylines/fuk.webp"
  },
  "Nagoya": {
    "iata": "NGO",
    "src": "assets/city-skylines/ngo.webp"
  },
  "Okinawa": {
    "iata": "OKA",
    "src": "assets/city-skylines/oka.webp"
  },
  "Busan": {
    "iata": "PUS",
    "src": "assets/city-skylines/pus.webp"
  },
  "Jeju": {
    "iata": "CJU",
    "src": "assets/city-skylines/cju.webp"
  },
  "Xian": {
    "iata": "XIY",
    "src": "assets/city-skylines/xiy.webp"
  },
  "Kunming": {
    "iata": "KMG",
    "src": "assets/city-skylines/kmg.webp"
  },
  "Hangzhou": {
    "iata": "HGH",
    "src": "assets/city-skylines/hgh.webp"
  },
  "Shenzhen": {
    "iata": "SZX",
    "src": "assets/city-skylines/szx.webp"
  },
  "Xiamen": {
    "iata": "XMN",
    "src": "assets/city-skylines/xmn.webp"
  },
  "Qingdao": {
    "iata": "TAO",
    "src": "assets/city-skylines/tao.webp"
  },
  "Chiang Mai": {
    "iata": "CNX",
    "src": "assets/city-skylines/cnx.webp"
  },
  "Phuket": {
    "iata": "HKT",
    "src": "assets/city-skylines/hkt.webp"
  },
  "Da Nang": {
    "iata": "DAD",
    "src": "assets/city-skylines/dad.webp"
  },
  "Cebu": {
    "iata": "CEB",
    "src": "assets/city-skylines/ceb.webp"
  },
  "Surabaya": {
    "iata": "SUB",
    "src": "assets/city-skylines/sub.webp"
  },
  "Medan": {
    "iata": "KNO",
    "src": "assets/city-skylines/kno.webp"
  },
  "Adelaide": {
    "iata": "ADL",
    "src": "assets/city-skylines/adl.webp"
  },
  "Cairns": {
    "iata": "CNS",
    "src": "assets/city-skylines/cns.webp"
  },
  "Gold Coast": {
    "iata": "OOL",
    "src": "assets/city-skylines/ool.webp"
  },
  "Darwin": {
    "iata": "DRW",
    "src": "assets/city-skylines/drw.webp"
  },
  "Wellington": {
    "iata": "WLG",
    "src": "assets/city-skylines/wlg.webp"
  },
  "Queenstown": {
    "iata": "ZQN",
    "src": "assets/city-skylines/zqn.webp"
  },
  "Cancun": {
    "iata": "CUN",
    "src": "assets/city-skylines/cun.webp"
  },
  "Guadalajara": {
    "iata": "GDL",
    "src": "assets/city-skylines/gdl.webp"
  },
  "Monterrey": {
    "iata": "MTY",
    "src": "assets/city-skylines/mty.webp"
  },
  "Edmonton": {
    "iata": "YEG",
    "src": "assets/city-skylines/yeg.webp"
  },
  "Ottawa": {
    "iata": "YOW",
    "src": "assets/city-skylines/yow.webp"
  },
  "Winnipeg": {
    "iata": "YWG",
    "src": "assets/city-skylines/ywg.webp"
  },
  "Halifax": {
    "iata": "YHZ",
    "src": "assets/city-skylines/yhz.webp"
  },
  "Maui": {
    "iata": "OGG",
    "src": "assets/city-skylines/ogg.webp"
  },
  "Fairbanks": {
    "iata": "FAI",
    "src": "assets/city-skylines/fai.webp"
  },
  "Brasilia": {
    "iata": "BSB",
    "src": "assets/city-skylines/bsb.webp"
  },
  "Cartagena": {
    "iata": "CTG",
    "src": "assets/city-skylines/ctg.webp"
  },
  "Manaus": {
    "iata": "MAO",
    "src": "assets/city-skylines/mao.webp"
  },
  "Cusco": {
    "iata": "CUZ",
    "src": "assets/city-skylines/cuz.webp"
  },
  "Mendoza": {
    "iata": "MDZ",
    "src": "assets/city-skylines/mdz.webp"
  },
  "Salvador": {
    "iata": "SSA",
    "src": "assets/city-skylines/ssa.webp"
  },
  "Punta Cana": {
    "iata": "PUJ",
    "src": "assets/city-skylines/puj.webp"
  },
  "Cordoba": {
    "iata": "COR",
    "src": "assets/city-skylines/cor.webp"
  },
  "Belo Horizonte": {
    "iata": "CNF",
    "src": "assets/city-skylines/cnf.webp"
  },
  "Porto Alegre": {
    "iata": "POA",
    "src": "assets/city-skylines/poa.webp"
  },
  "Curitiba": {
    "iata": "CWB",
    "src": "assets/city-skylines/cwb.webp"
  },
  "Cali": {
    "iata": "CLO",
    "src": "assets/city-skylines/clo.webp"
  },
  "Medellin": {
    "iata": "MDE",
    "src": "assets/city-skylines/mde.webp"
  },
  "Asuncion": {
    "iata": "ASU",
    "src": "assets/city-skylines/asu.webp"
  },
  "Canberra": {
    "iata": "CBR",
    "src": "assets/city-skylines/cbr.webp"
  },
  "Hobart": {
    "iata": "HBA",
    "src": "assets/city-skylines/hba.webp"
  },
  "Guam": {
    "iata": "GUM",
    "src": "assets/city-skylines/gum.webp"
  },
  "Suva": {
    "iata": "SUV",
    "src": "assets/city-skylines/suv.webp"
  },
  "Apia": {
    "iata": "APW",
    "src": "assets/city-skylines/apw.webp"
  },
  "Port Vila": {
    "iata": "VLI",
    "src": "assets/city-skylines/vli.webp"
  },
  "Nukualofa": {
    "iata": "TBU",
    "src": "assets/city-skylines/tbu.webp"
  },
  "Honiara": {
    "iata": "HIR",
    "src": "assets/city-skylines/hir.webp"
  },
  "Newcastle": {
    "iata": "NTL",
    "src": "assets/city-skylines/ntl.webp"
  },
  "Townsville": {
    "iata": "TSV",
    "src": "assets/city-skylines/tsv.webp"
  },
  "Hamilton NZ": {
    "iata": "HLZ",
    "src": "assets/city-skylines/hlz.webp"
  }
});
  function get(name){ return byCity[name] || null; }
  window.AECitySkylineManifest = Object.freeze({ byCity, get });
})();
