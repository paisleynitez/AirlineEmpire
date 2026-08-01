# Airport Visual Identity Engine — v1.3.0

## Purpose

Replace the single generic skyline generator with deterministic city-aware artwork that makes major hubs visually recognizable while preserving fast offline local-file launch.

## Added modules

- `game/js/data/airportVisualProfiles.js`
- `game/js/airports/airportArtworkManager.js`

## Updated files

- `game/index.html`
- `game/js/core/game.js`
- `game/css/main.css`
- `version.dat`

## Rendering model

Each city profile can define:

- Sky palette
- Water presence
- Terrain family
- Skyline density
- Landmark silhouette
- Accent color
- Climate family

The artwork manager creates a deterministic SVG postcard from those layers. The same city remains recognizable and stable between renders, while unprofiled airports receive a region-appropriate fallback scene.

## Initial landmark profiles

New York, Chicago, Los Angeles, Dallas, Washington DC, Houston, San Francisco, Atlanta, Phoenix, Seattle, Miami, London, Paris, Tokyo, Dubai, Sydney, Singapore, Toronto, Mexico City, and Rio de Janeiro.

## Expansion path

Additional airports require only a data record. Future versions can add day/night, season, weather, or static WebP overrides without changing hub-card rendering.

## Architecture

`game/index.html` remains a loader. Profile data, rendering logic, core game behavior, and CSS remain separate modules/files.
