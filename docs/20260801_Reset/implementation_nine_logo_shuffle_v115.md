# AE TP v1.1.5 — Nine-Logo Shuffle

## Change

The Airline Logo picker now displays exactly nine approved logo cards at a time in a fixed 3-column by 3-row layout. The grid does not scroll. Pressing **Shuffle** replaces all nine visible cards with a new non-duplicated random selection from the full contact-sheet logo library.

## Updated files

- `game/index.html`
- `game/css/main.css`
- `game/js/generator/airlineIdentityGenerator.js`
- `version.dat`

## Preserved behavior

- The full contact-sheet library remains available through repeated shuffles.
- Generic logos remain excluded.
- Random Preview remains removed.
- The dice remains inside the airline-name field immediately left of the validation checkmark.
- The modular loader and JavaScript structure remain unchanged.
