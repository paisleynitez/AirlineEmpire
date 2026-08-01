# AE v1.1.6 — THCityscape Implementation

## Summary

Adds a modular deterministic cityscape engine to the home-hub chooser and updates the panel to match the newer navy, teal, and lavender setup theme.

## Added modules

- `game/js/cities/cityProfileManager.js`
- `game/js/cities/cityRenderer.js`

## Initial city profiles

New York, Chicago, Los Angeles, Dallas, Washington DC, Houston, San Francisco, Atlanta, and Phoenix receive distinct terrain, water, skyline-density, palette, and landmark rules.

All other airports use region-aware fallback profiles, so no airport returns to the single generic skyline.

## Rendering approach

The renderer creates lightweight inline SVG scenes offline. Artwork is deterministic by city name, so the same city keeps the same recognizable composition on every launch while window lighting and building arrangement remain city-specific.

## Architecture

`game/index.html` remains the loader. Profiles and rendering live in dedicated modules. `game/js/core/game.js` delegates thumbnail generation to `AECityRenderer` and retains a safe fallback if the module is unavailable.

## Theme changes

The hub panel now uses darker navy surfaces, restrained lavender borders, teal active states, compact region filters, reduced card spacing, and a quieter legend.
