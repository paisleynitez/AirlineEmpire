# Simulation Speed and Date Recovery v1.1.8

## Baseline

- Branch: `recovery/ui-reconstruction`
- Baseline commit: `5a27a8c`
- Locked comparison branch: `recovery/verified-baseline-20260720`

## Problem

The simulation timer engine and all configured timer modes were present in `game/js/core/game.js`, but the current game header exposed only Play/Pause and Turbo. The complete speed control element was hidden inside a compatibility container, so players could not clearly select or identify the active simulation speed. End Turn updated the date, but the visual change was easy to miss.

## Implementation

### `game/index.html`

- Replaced the two-button transport presentation with visible controls for:
  - Manual
  - 1× Relaxed
  - 2× Normal
  - 4× Fast
  - 8× Turbo
- Added a persistent simulation status label.
- Retained the existing Play/Pause control and Settings button.
- Kept compatibility-only hidden elements outside the visible speed control.

### `game/js/core/game.js`

- Added `speedModeLabel()` to keep labels consistent.
- Expanded `updateSpeedUI()` to:
  - Highlight the selected speed.
  - Show paused state on the selected speed.
  - Update ARIA pressed states.
  - Update the persistent header status.
  - Keep the Play/Pause icon synchronized.
- Added confirmation flashes when changing speed or pausing.
- Added `pulseDateAdvance()` for visible calendar feedback.
- Added an explicit End Turn confirmation identifying the completed and new month.
- No economy, route, aircraft, AI, or turn-resolution formulas were changed.

### `game/css/main.css`

- Added compact header styling for the restored speed controls.
- Added distinct active, paused, and manual status treatments.
- Added a short lavender date-advance pulse animation.
- Added a narrower-header fallback that hides only the text status while preserving every speed button.

### Version

- Updated `version.dat` from `1.1.7` to `1.1.8`.

## Architecture

- `game/index.html` remains the loader and markup shell.
- Timer behavior remains in `game/js/core/game.js`.
- Styling remains in `game/css/main.css`.
- No inline simulation logic was added.
