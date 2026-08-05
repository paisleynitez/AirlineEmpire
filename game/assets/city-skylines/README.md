# Airline Empire City Skyline Assets

This directory contains 343 generated WebP skyline assets mapped to 345 effective runtime city keys. Duplicate accented/unaccented aliases share assets by IATA code.

- Runtime size: 360 × 176 pixels.
- File key: lowercase IATA code; `PRN` uses `iata-prn.webp` because `prn` is a reserved Windows device name.
- Source: OpenAI built-in image generation, using the user-supplied contact sheet as a style reference.
- Labels and card UI remain HTML/CSS; generated images contain no text.
- Missing or failed assets fall back to the deterministic SVG renderer.

## Prompt template

Each atlas requested an exact row-major grid of named cities, with believable travel photography, recognizable skylines or defining local landmarks, identical wide cells, thin black gutters, varied golden-hour/blue-hour/daylight conditions, and no text, logos, watermarks, UI, or repeated skylines.
