# QA — AE v1.1.8 Hub Footer and Next Animation

## Installation

1. Confirm `version.dat` reads `1.1.7`.
2. Run `APPLY_PATCH.bat`.
3. Confirm all verification lines report PASS.
4. Confirm `version.dat` reads `1.1.8`.

## Visual checks

1. Open the Found Airline setup screen.
2. Confirm the Population, Demand, Competition, and Starting Gates legend row is absent.
3. Confirm the Next button is smaller than the previous full-width teal bar.
4. Confirm the Next button uses the navy/lavender theme and remains readable.

## Animation checks

1. Click Next once.
2. Confirm the plane begins inside the right side of the button.
3. Confirm it travels to the right, passes beyond the button, and disappears.
4. Confirm the game advances to Airline Preview after the animation begins.
5. Return to setup and repeat; confirm the animation can run again.
6. Double-click rapidly and confirm only one transition occurs.

## Regression checks

- Back button still works.
- Hub selection remains intact.
- Nine-logo shuffle remains intact.
- THCityscape artwork remains intact.
- Global readable typography remains active.
- Browser console shows no JavaScript errors.

## Reverse check

Run `REVERSE_PATCH.bat` and confirm version `1.1.7` and the previous footer/button are restored.
