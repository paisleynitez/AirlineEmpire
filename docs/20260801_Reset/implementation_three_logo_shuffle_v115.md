# Three-Logo Shuffle Picker — v1.1.5 Revision

## Change

The Airline Logo panel now shows exactly three randomly selected contact-sheet logos. The previous Random Preview control, 34-card list, and internal logo scrolling are removed.

## Behavior

- The panel contains one **Shuffle** button.
- Opening the setup screen generates three unique logo choices.
- Pressing **Shuffle** replaces all three choices with another random selection.
- The selected card continues to use the existing airline-logo selection flow.
- The full 136-logo asset library remains installed and supplies future shuffle results.

## Updated files

- `game/index.html`
- `game/css/main.css`
- `game/js/generator/airlineIdentityGenerator.js`
- `docs/implementation_three_logo_shuffle_v115.md`
- `docs/qa_three_logo_shuffle_v115.md`
