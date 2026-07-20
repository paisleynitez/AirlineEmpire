# QA — Curated Airline Identity Library v1.1.0

## Installation

1. Confirm root `version.dat` reads `1.0.9`.
2. Run `APPLY_PATCH.bat`.
3. Confirm the installer reports success.
4. Confirm root `version.dat` now reads `1.1.0`.

## Functional checks

1. Launch `game/index.html` directly.
2. Start a new game and reach **Choose Your Logo**.
3. Confirm the Brand Lab shows **Mixed**, **Curated**, and **Procedural** buttons.
4. Select **Curated** and press **Generate** repeatedly.
5. Confirm the sample approved names appear and no broken image is shown.
6. Select **Procedural** and confirm newly assembled names and SVG icons appear.
7. Select **Mixed** and confirm both curated and procedural identities appear over repeated generations.
8. Press **Use This Identity** and confirm the airline name and selected logo update.
9. Continue to the next setup step and confirm the chosen identity remains selected.

## Supplied-logo check

1. Copy a PNG or SVG into `game/assets/airline-identities/`.
2. Add its record to `game/js/data/curatedAirlineIdentities.js`.
3. Reload the game.
4. Use **Curated** mode and confirm the supplied file displays in the preview and logo grid.

## Regression checks

- Existing built-in airline logos remain selectable.
- Direct local-file launch works without npm or a server.
- The setup wizard advances normally.
- No JavaScript errors appear in the browser console.
