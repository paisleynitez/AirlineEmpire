# QA — Cumulative Yesterday Work Patch v1.0.9

## Installation
- [ ] Extract the ZIP before running the installer.
- [ ] Double-click `APPLY_PATCH.bat`.
- [ ] Confirm the installer reports the repository path and a successful backup.
- [ ] Confirm root `version.dat` reads `1.0.9`.

## Launch and home screen
- [ ] Launch with the repository's existing game start batch file or `game/index.html`.
- [ ] Home screen loads without a blank page or JavaScript error.
- [ ] Lavender cinematic styling and animated route-line treatment appear.
- [ ] Home layout is centered and controls remain readable at 100% zoom.

## Continue Flight
- [ ] Continue Flight opens in a compact centered window.
- [ ] Autosave and manual save slots display as selectable rows, not large cards.
- [ ] Selecting a row and continuing works.

## Map and tools
- [ ] Ocean appearance uses the richer satellite-style treatment.
- [ ] Removed map controls do not reappear.
- [ ] Zoom-out control functions.
- [ ] Tune control can be moved and remains usable.

## Setup flow
- [ ] Scenario/setup sequence advances correctly.
- [ ] Setup pages use the animated background consistently.
- [ ] Existing airline logo choices still display.

## Procedural identity preview
- [ ] Procedural identity preview opens on the airline identity step.
- [ ] Generate creates a new airline name, palette, and SVG logo.
- [ ] Repeated generation produces visible variation.
- [ ] Use This Identity applies the generated choice.
- [ ] Generated identity remains selected when proceeding.

## Regression
- [ ] `game/index.html` remains a loader; no large inline game script was introduced.
- [ ] Start a new airline and reach the main map.
- [ ] Existing saves remain visible.
- [ ] Browser console shows no new uncaught errors during the tested flow.
