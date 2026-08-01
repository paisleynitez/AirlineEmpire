/* AE v1.1.6 — THCityscape city profile registry. */
(function(){
  'use strict';
  const profiles = {
    'New York':      { water:'harbor', terrain:'flat', landmark:'one-world', density:'dense', palette:['#182c4b','#07111f','#4d8eb8'] },
    'Chicago':       { water:'lake', terrain:'flat', landmark:'willis', density:'dense', palette:['#1b3456','#081321','#5aa1c8'] },
    'Los Angeles':   { water:'coast', terrain:'mountains', landmark:'la-tower', density:'wide', palette:['#4c3450','#171323','#e6a260'] },
    'Dallas':        { water:'none', terrain:'flat', landmark:'reunion', density:'medium', palette:['#3d3544','#15131b','#d6a65d'] },
    'Washington DC': { water:'river', terrain:'flat', landmark:'monument', density:'low', palette:['#243a56','#0d1725','#9db6cc'] },
    'Houston':       { water:'bayou', terrain:'flat', landmark:'houston-spire', density:'medium', palette:['#243d50','#0c1720','#6aa4b5'] },
    'San Francisco': { water:'bay', terrain:'hills', landmark:'golden-gate', density:'medium', palette:['#33475d','#131a24','#cf8d68'] },
    'Atlanta':       { water:'none', terrain:'trees', landmark:'bank-spire', density:'medium', palette:['#203b45','#0c171c','#74a18f'] },
    'Phoenix':       { water:'none', terrain:'desert', landmark:'camelback', density:'low', palette:['#5a3a3d','#211416','#eaa268'] }
  };
  const regional = {
    'N America': { water:'none', terrain:'flat', landmark:'generic-spire', density:'medium', palette:['#1d3550','#0a1421','#5c91b2'] },
    'S America': { water:'none', terrain:'hills', landmark:'generic-spire', density:'medium', palette:['#294442','#101c1b','#68a393'] },
    'Europe':    { water:'river', terrain:'flat', landmark:'old-spire', density:'dense', palette:['#34324b','#151421','#8d86b2'] },
    'Africa':    { water:'none', terrain:'savanna', landmark:'generic-spire', density:'low', palette:['#4b3927','#1c160f','#c59b62'] },
    'Mid East':  { water:'none', terrain:'desert', landmark:'needle', density:'medium', palette:['#4a3428','#1c1511','#d4a56a'] },
    'SE Asia':   { water:'bay', terrain:'tropical', landmark:'needle', density:'dense', palette:['#2c3b4d','#10161f','#5bb3bb'] },
    'Oceania':   { water:'harbor', terrain:'coast', landmark:'sail', density:'medium', palette:['#24455a','#0c1b25','#6fc0d1'] },
    'Asia':      { water:'river', terrain:'flat', landmark:'needle', density:'dense', palette:['#352b4c','#15111f','#8f70b8'] }
  };
  function get(name, region){
    const base = profiles[name] || regional[region] || regional['N America'];
    return Object.assign({name,region}, base);
  }
  window.AE_CITY_PROFILES = profiles;
  window.AECityProfileManager = { get, profiles, regional };
})();
