# Implementation — Logo Names Without Numeric Suffixes v1.1.5

## Change

The nine-logo shuffle still selects from the full supplied contact-sheet library, but displayed airline names no longer receive numeric suffixes such as `2` or `3`.

## Behavior

- The original curated names are retained where available.
- Additional contact-sheet assets receive deterministic word-based airline names.
- No displayed logo-card name ends in a generated number.
- The nine-card, three-column, three-row layout remains unchanged.
- Shuffle still produces nine unique logo assets with no scrolling.

## Updated file

- `game/js/generator/airlineIdentityGenerator.js`
