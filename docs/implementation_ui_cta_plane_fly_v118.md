# AE v1.1.8 — Hub Footer Cleanup and Next CTA Animation

## Major changes

- Removed the hub legend row containing Population, Demand, Competition, and Starting Gates explanations.
- Reduced the width and height of the setup Next button.
- Restyled the Next button with the current navy, lavender, and teal interface theme.
- Added a button-contained aircraft departure animation.
- Clicking Next sends the aircraft to the right, beyond the button edge, fades it out, and then advances to Airline Preview.

## Files updated

- `game/index.html`
- `game/css/main.css`
- `game/js/core/game.js`
- `version.dat`

## Architecture

The setup loader remains in `game/index.html`. Animation behavior stays in `game/js/core/game.js`, while all visual rules and keyframes remain in `game/css/main.css`.
