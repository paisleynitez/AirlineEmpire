AIRLINE EMPIRE — ADDING APPROVED AIRLINE LOGOS
================================================

Place approved logo files in this folder:

    game\assets\airline-identities\

Supported formats:

    .svg  .png  .jpg  .jpeg  .webp

Then edit:

    game\js\data\curatedAirlineIdentities.js

For example:

{
  id: 'curated_meridian_air',
  name: 'Meridian Air',
  logo: 'assets/airline-identities/meridian-air.svg',
  category: 'Legacy Carrier',
  region: 'Europe',
  style: 'Prestige',
  weight: 3,
  palette: ['#233b74', '#e8c76a', '#0d1324'],
  symbol: 'wing',
  shape: 'shield'
}

The logo path is relative to the game folder. Leave logo blank to let the
system create a matching SVG symbol from the palette, symbol, and shape.
