# Procedural Airline Identity — v1.0.9

## Baseline

- Branch marker: `dab_20260712`
- Baseline commit marker: `f78f8d9a693f49cca71070bbb855275e6fea98a2`
- Required installed version: `1.0.8`

## Implementation

The Found Airline screen now includes an offline Procedural Brand Lab. The generator combines name fragments, carrier profiles, five vector frames, six vector symbols, and nine palettes. Logos are generated as inline SVG and converted to data URIs, so no network request or image service is required.

`game/index.html` remains a loader. Generator behavior is isolated in `game/js/generator/airlineIdentityGenerator.js`; presentation remains in `game/css/main.css`.

Selecting **Use This Identity** registers the generated identity in the existing logo catalog, selects it through the established logo-selection function, and places its generated name into the airline-name field. Existing static PNG identities remain unchanged.

## Files

- `game/index.html`
- `game/css/main.css`
- `game/js/generator/airlineIdentityGenerator.js`
- `docs/changelog.md`
- `docs/implementation_procedural_airline_identity_v109.md`
- `docs/qa_procedural_airline_identity_v109.md`
- `version.dat`
