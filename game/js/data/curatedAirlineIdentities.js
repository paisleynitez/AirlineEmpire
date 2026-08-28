/* Browser-compatible bridge for the 34 installed Airline Empire SVG identities. */
(function () {
  'use strict';

  const identities = [
    ['harrowgate-airlines', 'Harrowgate Airlines', 'Legacy / Full-Service'],
    ['meridian-air', 'Meridian Air', 'Legacy / Full-Service'],
    ['valdris-international', 'Valdris International', 'Legacy / Full-Service'],
    ['caledonian-airways', 'Caledonian Airways', 'Legacy / Full-Service'],
    ['solaris-airlines', 'Solaris Airlines', 'Legacy / Full-Service'],
    ['fenwick-air-lines', 'Fenwick Air Lines', 'Legacy / Full-Service'],
    ['northbridge-aviation', 'Northbridge Aviation', 'Legacy / Full-Service'],
    ['albion-airways', 'Albion Airways', 'Legacy / Full-Service'],
    ['cascadia-air', 'Cascadia Air', 'Regional / Domestic'],
    ['redrock-express', 'Redrock Express', 'Regional / Domestic'],
    ['lakeshore-airlines', 'Lakeshore Airlines', 'Regional / Domestic'],
    ['piedmont-connector', 'Piedmont Connector', 'Regional / Domestic'],
    ['bayfront-aviation', 'Bayfront Aviation', 'Regional / Domestic'],
    ['prairie-air', 'Prairie Air', 'Regional / Domestic'],
    ['tidewater-airlines', 'Tidewater Airlines', 'Regional / Domestic'],
    ['highpass-airways', 'Highpass Airways', 'Regional / Domestic'],
    ['zipjet', 'ZipJet', 'Budget / Low-Cost'],
    ['flydash', 'FlyDash', 'Budget / Low-Cost'],
    ['clearskies-air', 'ClearSkies Air', 'Budget / Low-Cost'],
    ['swiftway-airlines', 'Swiftway Airlines', 'Budget / Low-Cost'],
    ['openair-express', 'OpenAir Express', 'Budget / Low-Cost'],
    ['budgetwing', 'BudgetWing', 'Budget / Low-Cost'],
    ['volare-go', 'Volare Go', 'Budget / Low-Cost'],
    ['apex-air', 'Apex Air', 'Budget / Low-Cost'],
    ['cobalt-airlines', 'Cobalt Airlines', 'Premium / Boutique'],
    ['crestline-air', 'Crestline Air', 'Premium / Boutique'],
    ['vellum-airways', 'Vellum Airways', 'Premium / Boutique'],
    ['aurelian-airlines', 'Eurpoean Air', 'Premium / Boutique'],
    ['ivory-and-wing', 'Ivory & Wing', 'Premium / Boutique'],
    ['marcello-air', 'Marcello Air', 'Premium / Boutique'],
    ['faultline-air', 'Faultline Air', 'Upstart / Edgy'],
    ['contrail-airlines', 'Contrail Airlines', 'Upstart / Edgy'],
    ['rogue-aviation', 'Rogue Aviation', 'Upstart / Edgy'],
    ['ironbird-airways', 'Ironbird Airways', 'Upstart / Edgy'],
  ];


  const REGION_KEYS = ['N America', 'S America', 'Europe', 'Africa', 'Mid East', 'SE Asia', 'Oceania'];
  const regionsById = {
    'harrowgate-airlines': ['Europe', 'N America'],
    'meridian-air': ['N America', 'Europe'],
    'valdris-international': ['Europe', 'Mid East'],
    'caledonian-airways': ['Europe'],
    'solaris-airlines': ['S America', 'Africa', 'Mid East', 'Oceania'],
    'fenwick-air-lines': ['Europe', 'N America'],
    'northbridge-aviation': ['N America', 'Europe'],
    'albion-airways': ['Europe'],
    'cascadia-air': ['N America'],
    'redrock-express': ['N America', 'Oceania', 'Africa'],
    'lakeshore-airlines': ['N America', 'Europe'],
    'piedmont-connector': ['N America', 'Europe'],
    'bayfront-aviation': ['Oceania', 'SE Asia', 'N America', 'S America'],
    'prairie-air': ['N America', 'Oceania', 'S America'],
    'tidewater-airlines': ['Oceania', 'SE Asia', 'N America'],
    'highpass-airways': ['S America', 'Europe', 'Mid East', 'SE Asia', 'Africa'],
    'zipjet': ['Europe', 'N America', 'SE Asia'],
    'flydash': ['N America', 'SE Asia', 'Oceania'],
    'clearskies-air': ['Oceania', 'N America', 'SE Asia'],
    'swiftway-airlines': ['Europe', 'N America', 'SE Asia'],
    'openair-express': ['S America', 'Africa', 'SE Asia', 'Oceania'],
    'budgetwing': ['N America', 'Europe', 'Oceania'],
    'volare-go': ['Europe', 'S America'],
    'apex-air': ['Europe', 'S America', 'Africa', 'Mid East'],
    'cobalt-airlines': ['Europe', 'N America', 'SE Asia'],
    'crestline-air': ['Europe', 'N America', 'Mid East'],
    'vellum-airways': ['Europe', 'Mid East'],
    'aurelian-airlines': ['Europe', 'Mid East', 'Africa'],
    'ivory-and-wing': ['Africa', 'Mid East', 'SE Asia'],
    'marcello-air': ['Europe', 'S America'],
    'faultline-air': ['N America', 'Oceania', 'SE Asia', 'S America'],
    'contrail-airlines': ['N America', 'Europe', 'SE Asia'],
    'rogue-aviation': ['Oceania', 'N America', 'Africa'],
    'ironbird-airways': ['Europe', 'Africa', 'Mid East'],
  };

  REGION_KEYS.forEach(region => {
    const count = identities.filter(([id]) => (regionsById[id] || []).includes(region)).length;
    if (count < 9) throw new Error(`Region ${region} has only ${count} curated airline identities`);
  });

  const palettes = {
    'Legacy / Full-Service': ['#12304A', '#B68B40', '#E7E1D3'],
    'Regional / Domestic': ['#17604E', '#55A98C', '#DCEBE5'],
    'Budget / Low-Cost': ['#5A2A82', '#E8D33F', '#F2EAF7'],
    'Premium / Boutique': ['#4C244F', '#D1A64A', '#F5E9D0'],
    'Upstart / Edgy': ['#1F2024', '#D63B32', '#F2E8E7'],
  };

  window.CURATED_AIRLINE_IDENTITIES = identities.map(([id, name, category]) => {
    const regions = regionsById[id];
    if (!regions || !regions.length) throw new Error(`Missing region mapping for ${id}`);
    return {
      id,
      name,
      logo: `assets/airlines/${id}/logo.svg`,
      category,
      region: regions[0],
      regions: regions.slice(),
      style: 'Curated regional identity',
      weight: 1,
      palette: palettes[category],
      symbol: 'wing',
      shape: 'round-square',
    };
  });
})();
