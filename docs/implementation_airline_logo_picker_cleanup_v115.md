# Airline Logo Picker Cleanup — v1.1.5 TEST

## Purpose

This test patch simplifies the Found Airline identity screen and removes explanatory identity metadata that competed with the logo artwork.

## Changes

- Renamed `CHOOSE YOUR LOGO` to `AIRLINE LOGO`.
- Moved the random-name dice inside the airline-name field, immediately left of the validation checkmark.
- Removed the Brand Library/identity preview box and its Use This Identity button.
- Kept Shuffle 34 and Random Preview as compact header controls.
- Random Preview now selects and scrolls to one randomly available logo.
- Removed the identity category/subtitle from every logo card.
- Removed the 34-airline-identities title suffix.
- Uses a four-column desktop grid with exactly four card rows visible before vertical scrolling.
- Slightly reduced card dimensions, image area, padding, and gaps.

## Architecture

`game/index.html` remains the loader and setup markup. Rendering stays in `game/js/core/game.js`; contact-sheet selection behavior stays in `game/js/generator/airlineIdentityGenerator.js`; layout remains in `game/css/main.css`.
