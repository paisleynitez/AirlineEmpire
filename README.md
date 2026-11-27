# Airline Empire

Airline Empire is an airline management / tycoon game by PaisleyNitez.

## Current Status

Playable alpha with a complete airline setup, route/fleet management loop, monthly economy, AI competitors, events, and save management. The current development focus is consolidating the runtime, expanding automated coverage, and completing the remaining placeholder systems.

## Quick Start

```bash
cd ~/projects/AirlineEmpire
npm install
npm run dev
```

Vite opens `http://localhost:5173/game/`.

For a dependency-free static launch, serve the repository root so the `game/` runtime and its bundled assets are available:

```bash
cd ~/projects/AirlineEmpire
python3 -m http.server 8000
```

Open `http://localhost:8000/game/`.

Development-only controls are disabled by default. Add `?dev=1` to the game URL when you intentionally need the tuner, skip button, developer console, or cursor probe.

## Project Layout

- `archive/` — old builds, prototypes, and retired work
- `assets/` — standalone source art and approved identity catalogs
- `docs/` — project, implementation, and QA documentation
- `game/` — playable runtime source
- `packages/` — copy-ready feature packages
- `scripts/` — build and generation utilities
- `tests/` — automated runtime smoke tests
- `tools/` — shared utility tools

## Runtime ownership

`game/js/core/game.js` owns the gameplay sequence and calls the public systems in
`game/js/systems/` directly. Research owns bonuses, upkeep and progression (including
freighter income and the third slot); cargo owns freight simulation and budget lines;
loyalty owns VIP calculations, tiers and badges. These modules do not replace core
functions. Keep new gameplay integration at the explicit core call sites.

A turn applies existing research effects, processes passenger routes and loyalty,
settles cargo and maintenance, advances research, reconciles accounting, advances the
calendar and competitors, creates the financial log and one operations report, then
runs any enabled developer market trials, then writes checkpoints and the autosave. `core/reports.js` owns report visibility and
clock blocking. Save loading clears transient report state and reapplies research
bonuses before rendering. The existing v2 save format and storage keys are retained.

The remaining `game/js/patches/` files handle existing screen layouts and interaction
adapters. `foundation.js` preserves the shared appearance; it does not run gameplay
or load a second report renderer.

Run `node --test tests/*.test.cjs` for system behavior and browser save/reload checks.
The browser cycle uses an isolated project-local profile, buys aircraft, opens a
route, progresses research and upgrades, and checks autosaves, manual saves,
checkpoints, quarterly turns, year rollover, older saves and report controls, with developer tools both disabled and enabled.

Copyright © 2026 PaisleyNitez. All rights reserved.
