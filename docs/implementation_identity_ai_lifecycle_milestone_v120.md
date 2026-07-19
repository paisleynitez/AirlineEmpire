# Airline Identity and AI Lifecycle Milestone — v1.2.0

## Scope

Version 1.2.0 consolidates the complete approved identity feature line and the AI-airline lifecycle into one stable milestone.

## Included systems

- Contact-sheet airline artwork library with 136 extracted WebP assets.
- Curated airline identity records and offline procedural fallback.
- 34 approved identities visible at game start.
- Generic/default identity cards hidden from the player-facing logo picker.
- Shuffle and random-preview controls.
- Three additional identity slots released every nine in-game months.
- AI startup evaluation every 45 simulated days.
- Mandatory 30-day AI planning/ramp-up state before activation.
- Fair AI financial pacing and bounded growth modifiers.
- Compact setup frames and cards.
- Airline-name dice inside the name field; marketing praise line removed.
- Readable typography pass and reduced excessive tracking.

## Architecture

- `game/index.html` remains a loader.
- AI lifecycle logic remains in `game/js/core/aiAirlineLifecycle.js`.
- Identity generation remains in `game/js/generator/airlineIdentityGenerator.js`.
- Curated identity data remains in `game/js/data/curatedAirlineIdentities.js`.
- Styling remains in `game/css/main.css`.

## Upgrade support

The installer accepts versions 1.0.9 through 1.1.4 and installs the complete v1.2.0 state. Earlier separate patches are not required afterward.
