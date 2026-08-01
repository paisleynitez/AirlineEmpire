# QA — Airline Logo Picker and Readable Typography v1.1.5 Revised

## Installer

1. Confirm `version.dat` reads `1.1.2`, `1.1.3`, `1.1.4`, or `1.1.5`.
2. Extract the ZIP and run `APPLY_PATCH.bat`.
3. Confirm the installer reports that existing matching files will be overwritten.
4. Confirm a timestamped backup path is displayed.
5. Confirm `version.dat` reads `1.1.5` after installation.

## Airline-name field

1. Open the Found Airline setup screen.
2. Confirm the dice appears inside the name field.
3. Confirm the dice is immediately left of the green validation checkmark.
4. Confirm both controls are vertically centered and do not overlap the airline name.
5. Click the dice and confirm the airline name changes.

## Airline Logo picker

1. Confirm the heading reads `AIRLINE LOGO`.
2. Confirm no Brand Library or identity-preview box appears.
3. Confirm no `Live Procedural Identity`, curated-description line, metadata badges, color circles, identity-count label, or `Contact Sheet Identity` subtitle appears.
4. Confirm logo cards begin directly beneath the controls.
5. Confirm four columns appear at normal desktop width.
6. Confirm no more than four complete rows are visible inside the logo region at once.
7. Scroll inside the logo region and confirm additional cards appear without extending the outer setup page excessively.
8. Confirm each card displays only the artwork and airline name.
9. Select a card and confirm its selected state is visible.
10. Click `SHUFFLE 34` and confirm the displayed selection changes.
11. Click `RANDOM PREVIEW` and confirm a random logo is selected and scrolled into view.

## Typography

1. Confirm normal UI text uses the clearer Plus Jakarta Sans face.
2. Confirm airport codes, money, and numeric statistics remain monospaced.
3. Confirm headings retain clear hierarchy without excessive spacing.
4. Check Game Type, Difficulty, Airline Logo, and Home Hub screens at 100% browser zoom.
5. Confirm text does not clip or overlap at common desktop widths.

## Regression

- Direct `game/index.html` launch works without npm.
- Existing setup navigation still advances and returns correctly.
- Chosen airline name and logo remain selected on subsequent setup screens.
- Browser console shows no new JavaScript errors.
