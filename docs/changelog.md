
## 1.0.9 — Procedural Airline Identity

- Added an offline procedural airline-name and SVG logo generator.
- Added a live Procedural Brand Lab preview to Found Airline.
- Added one-click identity selection while preserving the existing static logo catalog.
- Added implementation and QA documentation.
# Changelog

## Unreleased

### Changed

- Reorganized repository structure.
- Standardized active game entry point as `game/index.html`.
- Added CSS extraction branch work.
- Added initial developer documentation.

### Added

- `docs/CODE_MAP.md`
- `docs/DEVELOPER_SETUP.md`
- `docs/DECISIONS.md`
- Organized `assets/`, `archive/`, `game/`, `tools/`, `tests/`, and `scripts/`.

Milestone

Completed CSS modularization.

- All CSS extracted from index.html.
- game/css/main.css is now the primary stylesheet.
- Repository structure finalized.

## Refactor

- Completed extraction of all inline JavaScript from `game/index.html`.
- Added `game/js/core/game.js` as the primary application module.
- Moved remaining inline patch (`main_redesign_v07`) into its own module.
- Added a Vite development environment.
- Verified all JavaScript with `node --check`.


## 1.0.1 — Cinematic Lavender Theme

### Changed

- Recolored the existing animated cinematic intro from teal-forward to lavender/violet.
- Changed the animated central `AIRLINE EMPIRE` title to a lavender gradient with violet glow.
- Recolored cinematic route arcs, hubs, aircraft traces, telemetry accents, and the Press to Begin indicator.
- Retained restrained gold route accents for contrast.
- Preserved all cinematic timing, SVG generation, motion, skip behavior, and transition into the home menu.
- No Git commands, npm workflow, or server dependency were introduced.

## 1.0.2 — Home Balance and Lavender Routes
- Removed landing-menu Welcome Back status and settings gear.
- Rebalanced landing title and game-card spacing.
- Changed landing title treatment to lavender.
- Added denser animated lavender network lines and hub glows.
- Enforced native 100% application CSS scale.

## v1.0.3 — Home Layout Correction
- Corrected v1.0.2 title clipping and menu-card cropping.
- Rebalanced the landing screen for 100% browser zoom.
- Reduced animated background density and hub-glow size.
- Improved card opacity and text readability.

## 1.0.4 — Home, Continue Flight, and Map Controls
- Removed Records from the opening menu and aligned the title with the three-card row.
- Simplified the Continue Flight home card and rebuilt the save picker around one autosave and five manual slots.
- Removed Conquest, Day/Night, and Map Live controls; moved Demand to the lower-left placeholder position.
- Corrected zoom-control visibility, ocean/sea coloring, selected-region contrast, and Dev Tuner readability.

## 1.0.5
- Replaced oversized Continue Flight save cards with six compact rows.
- Reduced and centered the Continue Flight dialog.
- Preserved Autosave, five Manual Saves, load actions, and save import.

## 1.0.6 — Satellite Ocean and Movable Tune Launcher

- Restored rich satellite ocean color and bathymetric detail.
- Removed the overly flat blue ocean wash.
- Added persistent drag positioning to the Tune launcher.

## 1.0.7 — Scenario Flow Refinement

- Reduced Scenario Selection card dimensions and spacing.
- Removed the setup Airline Empire wordmark.
- Removed Scenario Preview.
- Added a lavender aircraft grow-and-fly departure transition into Found Airline.

## 1.0.8 — Setup Animated Background

- Reused the home screen's generated lavender route-network animation behind setup pages 1–3.
- Added animated lavender routes, city nodes, hub glows, and restrained gold accent routes to Game Type, Scenario Selection, and Found Airline.
- Preserved setup readability, control stacking, direct local-file launch, and reduced-motion support.

## 1.1.2 — AI Airline Lifecycle and Identity Release

- Changed Choose Your Logo to show 34 randomly selected contact-sheet identities only.
- Removed generic/default logo cards from the visible selection grid.
- Added three identity unlocks every nine in-game months.
- Added random AI startup evaluations every 45 simulated days.
- Added a mandatory 30-day AI airline ramp-up period.
- Added fair-economy safeguards for AI startup cash, growth, value, aggression, and expansion pacing.
- Added compatibility handling for older saved logo identifiers.
