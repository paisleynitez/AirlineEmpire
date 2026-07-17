# Airline Logo Catalog Integration v02

## Baseline

- Branch: `dab_20260712`
- Commit: `f78f8d9`
- Preserves the uploaded working copies of `game/index.html` and `game/css/main.css`.

## Implemented

- Added 193 individual PNG airline logos across eight catalog groups.
- Added `game/js/data/airline-logos.js`.
- Added stable filename-based `logoId` save data.
- Replaced the setup glyph grid with image cards and readable HTML names.
- Added image rendering to the setup preview, selected-logo display, dashboard badge, and CEO badge.
- Retained `STATE.logo = '✈'` as a compatibility fallback for older text-only surfaces.
- Older saves without `logoId` resolve to `nova_airlines`.

## Asset Path

`assets/logos/airlines/<group>/<logo_id>.png`

## Save Contract

The save stores only `STATE.logoId`. Image paths are resolved through the catalog.
