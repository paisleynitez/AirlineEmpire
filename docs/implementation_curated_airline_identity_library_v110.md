# Curated Airline Identity Library — v1.1.0

## Purpose

Version 1.1.0 changes the Brand Lab from a purely random generator into a hybrid identity system. Project-approved airline names and supplied logo files can now feed the generator without replacing the offline procedural SVG fallback.

## New files

- `game/js/data/curatedAirlineIdentities.js`
- `game/assets/airline-identities/README_ADD_LOGOS.txt`

## Updated files

- `game/index.html`
- `game/js/generator/airlineIdentityGenerator.js`
- `game/css/main.css`
- `version.dat`

## Source modes

- **Mixed:** approximately 70% curated identities and 30% procedural identities when curated records exist.
- **Curated:** uses only project-approved records. If no curated record exists, the generator safely falls back to procedural generation.
- **Procedural:** retains the original offline name and SVG generator.

## Curated record format

Each record may define a name, logo path, category, region, style, selection weight, palette, symbol, and frame shape. A blank logo path generates a matching SVG icon from the supplied visual DNA.

## Architecture

The loader remains in `game/index.html`. Identity data is stored in a data module, while creation and rendering remain in the generator module. No generator logic was moved into inline scripts.
