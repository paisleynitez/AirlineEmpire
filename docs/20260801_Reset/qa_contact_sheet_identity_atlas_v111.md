# QA — Contact-Sheet Identity Atlas v1.1.1

## Installation
1. Confirm `version.dat` reads `1.1.0`.
2. Run `APPLY_PATCH.bat`.
3. Confirm the installer reports success.
4. Confirm `version.dat` now reads `1.1.1`.

## Choose Your Logo
1. Start a new game and reach Choose Your Logo.
2. Confirm supplied contact-sheet artwork appears in the logo grid.
3. Confirm 24 randomized contact identities load without broken-image icons.
4. Press `SHUFFLE 24`.
5. Confirm the displayed contact-art set changes.
6. Confirm there are no duplicate contact images in the visible shuffled group.
7. Select `CONTACT ART`, then press `GENERATE`.
8. Confirm the live preview uses supplied artwork.
9. Enter a custom airline name and select a contact logo.
10. Confirm the custom airline name is not replaced.

## Regression
1. Confirm `MIXED`, `CURATED`, and `PROCEDURAL` modes remain usable.
2. Confirm procedural SVG logos still render.
3. Confirm existing supplied individual logos still render.
4. Confirm Back and Next navigation works.
5. Close and reopen the game by double-clicking the normal game launcher.
6. Confirm no server or npm is required.

## Failure checks
- No broken image placeholders.
- No console syntax errors.
- No duplicate IDs causing selection failure.
- Logo cards remain selectable and scrollable.
