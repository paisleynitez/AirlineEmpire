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
    ['aurelian-airlines', 'Aurelian Airlines', 'Premium / Boutique'],
    ['ivory-and-wing', 'Ivory & Wing', 'Premium / Boutique'],
    ['marcello-air', 'Marcello Air', 'Premium / Boutique'],
    ['faultline-air', 'Faultline Air', 'Upstart / Edgy'],
    ['contrail-airlines', 'Contrail Airlines', 'Upstart / Edgy'],
    ['rogue-aviation', 'Rogue Aviation', 'Upstart / Edgy'],
    ['ironbird-airways', 'Ironbird Airways', 'Upstart / Edgy'],
  ];

  const palettes = {
    'Legacy / Full-Service': ['#12304A', '#B68B40', '#E7E1D3'],
    'Regional / Domestic': ['#17604E', '#55A98C', '#DCEBE5'],
    'Budget / Low-Cost': ['#5A2A82', '#E8D33F', '#F2EAF7'],
    'Premium / Boutique': ['#4C244F', '#D1A64A', '#F5E9D0'],
    'Upstart / Edgy': ['#1F2024', '#D63B32', '#F2E8E7'],
  };

  window.CURATED_AIRLINE_IDENTITIES = identities.map(([id, name, category]) => ({
    id,
    name,
    logo: `assets/airlines/${id}/logo.svg`,
    category,
    region: 'Fictional',
    style: 'Curated identity',
    weight: 1,
    palette: palettes[category],
    symbol: 'wing',
    shape: 'round-square',
  }));
})();
