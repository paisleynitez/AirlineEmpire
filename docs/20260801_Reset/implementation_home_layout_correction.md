# Home Layout Correction — v1.0.3

## Baseline
Requires Airline Empire v1.0.2 Home Balance + Lavender Routes.

## Changes
- Restored a viewport-safe landing layout with the title fully inside the screen.
- Centered all four game cards in one row on standard desktop widths.
- Reduced title and card dimensions so all content remains readable at browser zoom 100%.
- Raised card opacity to prevent animated background glows from obscuring text.
- Reduced route density, route thickness, node brightness, and hub-glow radius.
- Kept animated lavender route flow and restrained gold accents behind the interface.
- Preserved removal of the top-right welcome/status chip and settings control.
- Added responsive two-column and one-column fallbacks.

## Files
- `game/css/main.css`
- `game/js/core/game.js`
- `version.dat`

## Runtime
Direct local launch through `game/index.html`. No npm or server required.
