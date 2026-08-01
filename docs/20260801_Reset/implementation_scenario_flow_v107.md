# Airline Empire v1.0.7 — Scenario Flow Refinement

## Baseline

Requires Airline Empire v1.0.6.

## Changes

- Removed the Airline Empire setup wordmark/header from the setup wizard.
- Removed the Scenario Preview panel from Scenario Selection.
- Reduced scenario-card height, padding, icon size, and spacing slightly while preserving readability.
- Retained the How Scenarios Work and Tips panels in a narrower right rail.
- Replaced the direct Found Airline navigation with a lavender aircraft departure transition.
- The aircraft starts near the Found Airline button, grows, flies upward off screen, and then reveals the Found Airline page.
- Direct local launch through `game/index.html` remains supported.
- No Git or npm operations are used by the installer.

## Files

- `game/index.html`
- `game/css/main.css`
- `game/js/core/game.js`
- `version.dat`
