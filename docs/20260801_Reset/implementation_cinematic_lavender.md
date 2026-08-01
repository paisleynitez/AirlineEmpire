# Cinematic Lavender Theme — Implementation

Version: 1.0.1
Baseline: AirlineEmpire_v1.0.0_2026-07-17_172146.tar.gz

## Scope

This patch changes only the animated opening cinematic palette. It does not redesign the flat home menu or alter gameplay.

## Files Changed

- `game/index.html` — updates the cinematic SVG hub gradient definition.
- `game/css/main.css` — updates cinematic background, title gradient, glow, telemetry, region indicators, and call-to-action colors.
- `game/js/core/game.js` — updates runtime-generated cinematic city dots, route arcs, hubs, aircraft trails, and region ignition colors.
- `version.dat` — advances the project version to 1.0.1.

## Preserved Behavior

- Existing SVG network construction
- Route drawing sequence
- Aircraft movement
- Hub pulse animation
- Stat count-up animation
- Title reveal and shine
- Click-to-skip and SKIP button
- Transition to the existing home menu
- Direct local launch through `game/index.html`

## Palette

- Primary lavender: `#b982ff`
- Light lavender: `#c9a7ff`
- Pale title highlight: `#eadcff`
- Deep violet: `#8f5bd7`
- Restrained gold accent: `#e4b85f`
