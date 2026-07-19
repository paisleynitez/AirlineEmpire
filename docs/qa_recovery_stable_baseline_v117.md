# QA — AE Recovery Stable Baseline 1.1.7

## Installation verification

1. Run `APPLY_PATCH.bat` from the extracted recovery folder.
2. Confirm every preflight check says PASS.
3. Confirm `version.dat` reads `1.1.7`.
4. Launch the existing game entry point.

## Regression checks

### Opening and setup
- Opening cards retain their pre-v1.1.8 dimensions and alignment.
- Game Type and Difficulty screens match the last accepted layout.
- No duplicate or oversized setup panels appear.

### Airline logo picker
- Exactly nine cards appear in a 3 by 3 grid.
- No scrollbar appears.
- Shuffle changes all nine cards.
- No numeric suffixes appear.
- Each logo has one readable airline name, not duplicated text.

### Hub selection
- THCityscape cards render.
- Updated global font theme remains active.
- Hub cards and region controls remain functional.

### Navigation
- All setup Next and Back actions operate as they did before v1.1.8.
- No JavaScript error appears in the browser console.

## Reverse test

Run `REVERSE_PATCH.bat` only to restore the exact state that existed immediately before this recovery package was applied.
