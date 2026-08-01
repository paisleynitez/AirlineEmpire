# Airline Empire v1.0.5 — Continue Flight Row Layout

## Baseline
Requires Airline Empire v1.0.4.

## Change
The Continue Flight dialog was rebuilt from six large save cards into six compact selectable rows.

- One Autosave row and five Manual Save rows remain.
- Saved rows show airline, date, cash, routes, and save time in one compact line.
- Empty rows remain visible but use minimal space.
- Each populated row has a dedicated Load button.
- The dialog width is capped at 700 px and centered horizontally and vertically.
- The footer import action remains available.
- No Git, npm, or server workflow is introduced.

## Files
- `game/js/patches/real_game_recovery_v05.js`
- `game/css/main.css`
- `version.dat`
