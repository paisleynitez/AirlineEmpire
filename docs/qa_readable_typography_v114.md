# QA — Airline Empire v1.1.4 Readable Typography

## Installation

1. Confirm root `version.dat` reads `1.1.3`.
2. Run `APPLY_PATCH.bat`.
3. Confirm the installer reports success.
4. Confirm root `version.dat` reads `1.1.4`.

## Setup flow

1. Launch the game using the normal local-file workflow.
2. Open New Game.
3. Confirm Game Type and Difficulty card titles are clear and not overly condensed.
4. Confirm card descriptions are easier to read and have comfortable line spacing.
5. Continue to Airline Name and verify:
   - The dice remains inside the name input.
   - The removed “Great name” line does not return.
   - The typed airline name is clear and vertically centered.
6. Check Choose Your Logo:
   - Logo names remain legible.
   - Contact-sheet artwork is unchanged.
   - Metadata is compact but readable.
7. Check Home Hub:
   - Airport city names use the primary UI font.
   - IATA codes remain monospaced.
   - Airport subtitles remain readable at normal zoom.

## Wider interface

1. Begin a game and inspect header statistics.
2. Confirm monetary and numerical values align cleanly.
3. Open Routes, Fleet, Rankings, Rivals, and News.
4. Confirm ordinary UI text does not use the condensed title font.
5. Open a modal and verify headings, paragraphs, and buttons are readable.
6. Confirm the Airline Empire brand title still uses its distinctive display face.

## Regression

- No external font or network request is required.
- Direct opening of `game/index.html` works.
- No broken layout or clipped text at 100% browser zoom.
- Compact v1.1.3 setup sizing remains intact.
- Existing logo selection, AI lifecycle, saves, routes, and simulation behavior remain unchanged.
