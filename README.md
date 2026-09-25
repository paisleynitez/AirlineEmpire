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

Copyright © 2026 PaisleyNitez. All rights reserved.
