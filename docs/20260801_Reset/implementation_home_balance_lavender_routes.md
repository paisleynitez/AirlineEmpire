# Airline Empire v1.0.2 — Home Balance and Lavender Routes

## Baseline
Requires Airline Empire v1.0.1 Cinematic Lavender.

## Changes
- Removed the top-right Welcome Back / Empire Status chip from the landing menu.
- Removed the top-right settings gear from the landing menu.
- Rebalanced the landing title stage and choice-card row at native application scale.
- Changed the landing `AIRLINE EMPIRE` title and aircraft mark to lavender.
- Expanded the existing generated route network from five to eight nearby destinations per seed hub.
- Added layered lavender route trails, restrained gold routes, animated dash flow, denser city nodes, and brighter lavender hub glows.
- Preserved the existing SVG-generated background; no flat background image was introduced.
- Set the application document and body to native 100% CSS scale on launch.

## Files
- `game/index.html`
- `game/css/main.css`
- `game/js/core/game.js`
- `version.dat`

## Git and launch behavior
The installer performs no Git or npm operations. The game remains compatible with launching `game/index.html` directly from the hard drive.

## Browser zoom note
The application now requests and maintains 100% CSS layout scale. Browser-controlled zoom is a browser security preference and cannot be forcibly changed by page JavaScript. QA should begin with the browser at 100% (`Ctrl+0`) for an exact native-scale comparison.
