# AE v1.1.7 — Global Font and Readable Logo Labels

## Purpose

This patch completes the readable typography pass across the game and corrects the unusable text baked into contact-sheet logo artwork.

## Changes

- Applies Plus Jakarta Sans as the default interface typeface across normal game controls, panels, buttons, fields, cards, and routine headings.
- Retains DM Mono for airport codes, money, numerical metrics, and other data-aligned values.
- Preserves display branding only where it is intentionally part of the Airline Empire title treatment.
- Adds the assigned airline name as a high-contrast overlay inside every logo image.
- Masks the lower portion of supplied contact-sheet artwork so malformed source text is no longer presented as the airline identity.
- Keeps the authoritative airline name beneath each logo card.

## Files

- `game/css/main.css`
- `game/js/core/game.js`
- `docs/implementation_global_font_readable_logos_v117.md`
- `docs/qa_global_font_readable_logos_v117.md`
- `version.dat`
