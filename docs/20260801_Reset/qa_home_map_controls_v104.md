# QA — Airline Empire v1.0.4

## Installation
1. Apply v1.0.3 first.
2. Extract this patch ZIP.
3. Double-click `APPLY_PATCH.bat`.
4. Double-click `game/index.html`.
5. Confirm browser zoom is 100% with Ctrl+0.

## Home screen
- [ ] Welcome/status and gear remain absent.
- [ ] Records card is absent.
- [ ] New Game, Continue Flight, and Daily Challenge appear as one centered row.
- [ ] Title panel and card row share the same horizontal center and visual width.
- [ ] Continue Flight card does not show airline, year, cash, or save metadata.

## Continue Flight
- [ ] Clicking Continue Flight opens a correctly sized centered window.
- [ ] One Autosave and five Manual Save slots are visible.
- [ ] Empty slots are labeled and do not disappear.
- [ ] Desktop view uses two compact rows of three slots.
- [ ] Existing saves show airline and save metadata only inside the picker.
- [ ] Load buttons load the selected save.
- [ ] Import Save File still opens the file picker.

## Map
- [ ] Conquest button is absent.
- [ ] Day/Night button is absent.
- [ ] Map Live / Earth Clear chip is absent.
- [ ] Demand appears at the lower-left and is marked as a placeholder.
- [ ] Zoom in (+), percentage, and zoom out (−) are all visible.
- [ ] Both zoom buttons work.
- [ ] Oceans and major seas have a consistent blue tone without tinting land.
- [ ] Selected continent tab has dark readable text on a light lavender background.

## Dev Tuner
- [ ] Open the tuner with the Tune control or tilde key.
- [ ] Tabs, labels, notes, and values are readable without leaning close to the screen.
- [ ] All five tabs remain functional.
- [ ] Numeric controls and Export JSON still work.

## Regression
- [ ] New Game opens setup.
- [ ] Daily Challenge opens normally.
- [ ] Map pan, city selection, routes, and End Turn still work.
- [ ] No npm or local server is required.
