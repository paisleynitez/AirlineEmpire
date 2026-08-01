# Airline Empire v1.1.4 — Readable Typography

## Purpose

This patch improves readability across the setup flow and the wider game interface without changing the established theme or requiring network access.

## Typography system

- **Plus Jakarta Sans:** primary interface, cards, labels, buttons, body copy, airport names, and setup controls.
- **DM Mono:** financial values, airport codes, statistics, rankings, and other operational data requiring aligned digits.
- **Bebas Neue:** restricted to large Airline Empire branding and major display titles.

All three fonts were already embedded in `game/css/main.css`. No external font downloads, runtime requests, or new font files were added.

## Main changes

- Reduced excessive letter spacing on section headers and small metadata.
- Replaced condensed display typography in ordinary UI controls with the clearer interface face.
- Standardized title, body, label, button, and data hierarchy.
- Added tabular numerals to operational values.
- Increased body-copy line height and normalized weight.
- Improved setup wizard input, card, airport, and logo text readability.
- Preserved the v1.1.3 compact setup layout and airline-name cleanup.

## Files

- Replaced: `game/index.html`
- Replaced: `game/css/main.css`
- Updated: `version.dat`
- Added: this implementation document
- Added: `docs/qa_readable_typography_v114.md`
