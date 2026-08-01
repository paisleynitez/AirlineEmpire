# AE v1.1.10 Logo Card Repair — Implementation

## Baseline
AE v1.1.9 UI Polish / Center Align.

## Changes
- Removed the duplicate airline-name element beneath each logo image.
- Kept one authoritative airline name inside the image mask.
- Reduced logo-card height while preserving the 3 × 3 / nine-logo layout.
- Preserved Shuffle, selection, global typography, THCityscape, and wizard alignment.
- Added final CSS overrides after all historical patch rules so older selectors cannot re-enable the duplicated label.

## Files changed
- `game/js/core/game.js`
- `game/css/main.css`
- `version.dat`
