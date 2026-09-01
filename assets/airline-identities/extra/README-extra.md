# Airline logo extra pass — 65 marks (AI rivals, AI name pool, dice-button names)

Completes logo coverage for every airline name in the game (per airline-names-list.md).
The approved-250 catalog and the 34 curated SVG identities already have art; this pass
covers everything else:

- ai-rivals (6): PanWorld, AirGlobe, SkyRush, AeroNova, JetStar Intl, TransOcean
  (each keyed to its RIVAL_NAMES accent color from game.js)
- ai-pool (41): the AI lifecycle name pool, minus 4 names that exactly match existing
  catalog marks and REUSE them instead (see manifest-extra.json):
  Meridian Air, Flux Airlines, Zenith Air, Sovereign Wings
- dice-names (18): the setup-screen dice-button suggestions (SKYLINE ... PAISLEY AIR)

Style: same caption-safe procedural system (dark plate + accent outline + flat motif,
soft halo, transparent bg, no name text). Fit-verified: every mark's opaque bounds sit
inside an 8px safe margin of the 512x512 frame, so nothing clips in the logo cards.

## Contents
- logos/<category>/<id>.png — 65 standalone marks (the source of truth)
- contact-sheets/contact-sheet-01..07.png — sheets of ten (last sheet has 5),
  assembled programmatically FROM the standalone files; individual images should be
  pulled from logos/, not cropped from the sheets
- manifest-extra.json / manifest-extra.csv

## Destination
Extract into `C:\GitHub\AirlineEmpire\images_to_apply\logos-extra\`. These are new
categories (not part of approved-250), so wiring them to AI rivals / dice names in-game
is a separate task when wanted.
