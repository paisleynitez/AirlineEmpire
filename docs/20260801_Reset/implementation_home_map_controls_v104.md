# Airline Empire v1.0.4 — Home, Continue Flight, and Map Controls

## Baseline
Requires Airline Empire v1.0.3.

## Home screen
- Removed the Records card from the opening screen.
- Centered the Airline Empire title panel and the three-card game row on the same horizontal axis and width.
- Retained New Game, Continue Flight, and Daily Challenge.
- Removed save metadata from the Continue Flight home card.

## Continue Flight
- The Continue Flight picker now always displays six defined slots: one Autosave and five Manual Save slots.
- Empty slots remain visible and labeled.
- Slots use a compact three-column desktop layout, with responsive wrapping on smaller displays.

## Map controls
- Removed Conquest and Day/Night buttons from the map UI.
- Removed the Map Live / Earth Clear chip.
- Moved Demand to the lower-left as a visible placeholder reminder.
- Repositioned the zoom control so zoom in, current percentage, and zoom out remain visible.
- Increased selected-region contrast.

## Map appearance
- Added an SVG ocean mask based on the existing land path.
- Applied a restrained blue overlay to oceans and major seas while preserving satellite land detail.

## Dev Tuner
- Increased panel width, font sizes, spacing, input size, tab contrast, and note readability.

## Runtime
- Direct local launch through `game/index.html` remains supported.
- No npm or Git operations are required or performed.
