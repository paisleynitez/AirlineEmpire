# Implementation — Map UI Cleanup v1.1.11

## Baseline

- Repository: `C:\GitHub\AirlineEmpire`
- Branch: `doug/v1.1.11-baseline`
- Baseline commit: `b02a7caa7c688fd7632dadcbd71eed7e4752d22c`
- Entry point: `game/index.html`

The current working tree was used as the source of truth. Existing skyline and airline-identity work was preserved.

## Scope

Removed these generated dashboard/map UI elements:

- Day / Night map toggle
- Map legend
- Network News ticker segment
- Fuel Price ticker segment
- At Stake ticker segment

## Implementation

### `game/js/core/game.js`

- Stopped creating and synchronizing the map legend.
- Stopped creating and synchronizing the three-segment bottom ticker.
- Stopped creating the Day / Night toggle and removed its unused click handler.
- Retained the automatic day/night map-lighting system and its rendering updates.

### `game/css/main.css`

- Removed styles used only by the map legend, bottom ticker, and Day / Night toggle.
- Retained the existing time-scale label and automatic day/night appearance rules.

## Architecture and behavior

- `game/index.html` remains the unchanged loader.
- JavaScript remains in the established modular folder structure.
- No data, assets, simulation rules, save data, route logic, economy logic, or turn behavior changed.
- The setup wizard hub legend (`ae4-legend`) is unrelated and remains intact.

## Verification record

See `docs/qa_test_results_map_ui_cleanup_v111.md` for the executed checks and results.
