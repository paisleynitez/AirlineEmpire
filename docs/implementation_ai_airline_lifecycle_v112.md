# AI Airline Lifecycle and Identity Release — v1.1.2

## Purpose

This change connects the contact-sheet airline identity library to AI competitor creation and establishes fair startup pacing.

## Identity availability

- A new game begins with 34 contact-sheet identities available.
- Generic/default SVG and legacy cards are removed from the visible Choose Your Logo grid.
- The player may reshuffle the 34 visible approved identities.
- Existing saves that reference an older logo remain readable through a hidden compatibility registry.
- Three additional identities are unlocked every nine in-game months for future AI startups.

## AI startup lifecycle

Each AI airline follows these states:

1. `available` identity in the unlocked pool.
2. Random startup evaluation every 45 simulated days.
3. `ramp_up` for 30 simulated days.
4. `active` scheduled operations.

During ramp-up an AI carrier has a selected identity, one hub, two to four aircraft represented by its fleet count, startup cash, and planned routes. It does not carry passengers or compete on routes until ramp-up completes.

## Fair economy controls

AI airlines use the existing route-demand and operating-cost process. Version 1.1.2 adds safeguards:

- Startup cash is constrained to a modest range based on the scenario and player economy.
- Route expansion remains limited by the existing four-month cooldown.
- Aggression is clamped to a reasonable range.
- Monthly cash and company-value growth are capped.
- Ramp-up incurs startup overhead.
- World capacity limits prevent unlimited simultaneous startups.
- No AI carrier receives instant passenger traffic, routes, or large fleets during startup.

## Files

### Added

- `game/js/core/aiAirlineLifecycle.js`
- `docs/implementation_ai_airline_lifecycle_v112.md`
- `docs/qa_ai_airline_lifecycle_v112.md`

### Updated

- `game/index.html`
- `game/js/generator/airlineIdentityGenerator.js`
- `game/css/main.css`
- `docs/changelog.md`
- `version.dat`

## Architecture

`game/index.html` remains a loader. AI lifecycle logic is isolated in `game/js/core/aiAirlineLifecycle.js`. The module wraps the existing startup and competitor-turn entry points without moving gameplay logic into inline HTML.
