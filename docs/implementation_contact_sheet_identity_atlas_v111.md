# Airline Empire v1.1.1 — Contact-Sheet Identity Atlas

## Baseline
- Expected installed version: `1.1.0`
- Target version: `1.1.1`
- Architecture remains modular; `game/index.html` remains a loader.
- No npm or web service is required.

## Major change
The supplied contact sheet has been converted into 136 individual WebP logo assets under:

`game/assets/airline-identities/contact-sheet-01/`

The identity generator now treats these assets as a curated contact-art pool.

## Runtime behavior
- The Choose Your Logo screen loads 24 unique contact-sheet logos.
- `SHUFFLE 24` replaces that set with another randomized, non-duplicated group.
- `CONTACT ART` forces the live generator to use supplied artwork.
- `MIXED` favors supplied contact art, while retaining curated records and SVG fallback.
- Selecting contact artwork preserves the airline name typed by the player.
- All processing is offline.

## Files
- `game/js/generator/airlineIdentityGenerator.js`
- `game/css/main.css`
- `game/assets/airline-identities/contact-sheet-01/logo_001.webp` through `logo_136.webp`
- `version.dat`

## Future contact sheets
Additional sheets can be extracted into adjacent folders and appended to `CONTACT_SHEET_LOGOS`.
