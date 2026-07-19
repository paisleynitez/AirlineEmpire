# Compact Setup Layout — v1.1.3

## Purpose

Version 1.1.3 reduces the setup-frame footprint and improves horizontal centering while preserving the modular loader and existing setup behavior.

## Included changes

- Reduced Game Type and Difficulty frame dimensions.
- Reduced setup-card padding, icon size, heading size, and internal spacing.
- Centered both setup groups horizontally within the available viewport.
- Reduced the Next navigation bar height.
- Removed the airline-name helper sentence.
- Moved the random-name dice control into the airline-name field.
- Positioned the dice immediately before the validation checkmark.

## Updated files

- `game/css/main.css`
- `game/js/core/game.js`
- `game/js/patches/foundation_polish_v01.js`
- `version.dat`

## Architecture

`game/index.html` remains a loader. Layout and presentation stay in the stylesheet, while setup behavior remains in JavaScript modules.
