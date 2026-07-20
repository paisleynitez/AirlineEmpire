# QA — Airline Logo Picker Cleanup v1.1.5 TEST

## Installation

1. Confirm `version.dat` is `1.1.2`, `1.1.3`, or `1.1.4`.
2. Run `APPLY_PATCH.bat`.
3. Confirm the installer reports success and `version.dat` becomes `1.1.5`.

## Airline name panel

1. Open New Game and reach Found Airline.
2. Confirm the Great name message is not visible.
3. Confirm the dice is inside the airline-name field.
4. Confirm the dice is immediately left of the green checkmark.
5. Press the dice several times and confirm the name changes.
6. Confirm the checkmark stays vertically aligned and does not overlap the name.

## Airline logo panel

1. Confirm the title reads `AIRLINE LOGO`.
2. Confirm there is no Contact-Sheet Brand Library heading or description.
3. Confirm there is no large preview/identity box below the buttons.
4. Confirm there is no Live Procedural Identity text.
5. Confirm there is no Curated Contact-Sheet Identity line.
6. Confirm no CONTACT, CONTACT-SHEET, CURATED-ART badges or color circles appear.
7. Confirm logo cards contain only the artwork and airline name.
8. Confirm no Contact Sheet Identity/category line appears under card names.
9. Confirm the visible desktop grid is four columns by four rows.
10. Confirm additional logos are accessible by scrolling inside the logo grid.
11. Confirm the logo grid does not expand below four visible rows.
12. Confirm Shuffle 34 replaces the displayed selection.
13. Confirm Random Preview selects a random card and scrolls it into view.
14. Confirm clicking a logo selects it and displays the selection checkmark.

## Regression

- Continue through hub selection and airline preview.
- Confirm the selected airline name and logo persist.
- Confirm direct local launch still works without npm.
- Confirm no JavaScript errors appear in the browser console.
