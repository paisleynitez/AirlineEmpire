# Aircraft Image and Identity Package v1.1.11

## Result

The current 37-model AIRCRAFT roster now has a one-to-one set of standalone 16:9 aircraft cards, runtime hero images, source SVGs, and generated lookup data. The original AIRCRAFT keys remain unchanged for save compatibility.

## Implementation

- Gameplay authority remains `game/js/core/game.js` (`AIRCRAFT`).
- Existing fictional names, IDs, themes, colors, and roles remain in `AIRCRAFT_IDENTITY`.
- Existing procedural aircraft configurations remain in `AC_ART`.
- Runtime artwork is separated into `game/assets/aircraft-heroes/`.
- Generated lookup data is in `game/js/data/aircraftImageManifest.js` and loads before `game.js`.
- Standalone deliverables are in `assets/aircraft-cards/`: 37 SVG sources, 37 WebP cards, JSON/CSV manifests, and the contact sheet.
- Cards and heroes are 1600 × 900 WebP (16:9). The cards use the established night-navy glass presentation and fictional aircraft identity layer.
- The owned-fleet accordion now applies its `open` state to the parent card, matching the existing CSS and restoring access to the aircraft hero popup.
- `scripts/build-aircraft-cards.cjs` deterministically rebuilds the set from the current roster and existing procedural artwork.

## Packaging

The copy-ready package is `packages/aircraft-image-identity-package-v111/`. It mirrors repository destination paths and includes complete replacement files for the two integrated runtime files.

## Scope safeguards

No AIRCRAFT gameplay values, model keys, save data, economy behavior, route logic, or modular folder responsibilities were changed.
