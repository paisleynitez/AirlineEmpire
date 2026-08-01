/* Airline Empire v1.1.0 — Curated airline identity source library.
 *
 * Doug can provide airline names and logo files. Add each logo under:
 *   game/assets/airline-identities/
 *
 * Then add a record below. The generator will use these approved names and
 * logos in CURATED and MIXED modes. PNG, JPG, WEBP, and SVG are supported.
 */
(function () {
  'use strict';

  window.CURATED_AIRLINE_IDENTITIES = [
    {
      id: 'curated_unity_air',
      name: 'Unity Air',
      logo: '',
      category: 'Global Network',
      region: 'Global',
      style: 'Modern',
      weight: 4,
      palette: ['#6f5cff', '#b7a9ff', '#10182a'],
      symbol: 'orbit',
      shape: 'round-square'
    },
    {
      id: 'curated_westwind_jet',
      name: 'Westwind Jet',
      logo: '',
      category: 'Boutique Airline',
      region: 'North America',
      style: 'Premium',
      weight: 3,
      palette: ['#cf4f86', '#ffacd1', '#28111e'],
      symbol: 'compass',
      shape: 'diamond'
    },
    {
      id: 'curated_harborwing',
      name: 'Harborwing Airlines',
      logo: '',
      category: 'Regional Connector',
      region: 'Europe',
      style: 'Legacy',
      weight: 2,
      palette: ['#2f76d2', '#9bc7ff', '#101b31'],
      symbol: 'wing',
      shape: 'shield'
    }
  ];
})();
