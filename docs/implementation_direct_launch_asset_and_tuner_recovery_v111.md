# Direct Launch Asset and Dev Tuner Recovery — v1.1.11

## Baseline

- Active branch: `recovery/ui-reconstruction`
- Recovery lineage: v1.1.10
- Locked baseline remains unchanged.

## Changes

### Airline logo paths

`game/js/data/airline-logos.js` now converts root-relative `/assets/...` paths to `../assets/...` at load time. This works from `game/index.html` both when opened directly with `file://` and when served from the repository root.

### Market Intelligence startup

`game/js/tools/dev_tuner.js` no longer checks `window.STATE`. The core state is declared as a top-level lexical binding and therefore is not guaranteed to be a property of `window`. Market Intelligence now checks `typeof STATE`, exits safely when state is unavailable, and does not write `routeOffers` through a null reference.

### Chromium file-origin warning

The `Unsafe attempt to load URL ... file: URLs are treated as unique security origins` console line is a browser security warning associated with direct `file://` launch. This patch removes the two application errors reported alongside it, but does not attempt to suppress browser security diagnostics.
