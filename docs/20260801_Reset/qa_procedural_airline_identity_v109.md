# QA — Procedural Airline Identity v1.0.9

## Installation

1. Confirm the repository root contains `version.dat` showing `1.0.8`.
2. Run `APPLY_PATCH.bat`.
3. Confirm the installer reports success and `version.dat` now shows `1.0.9`.

## Functional checks

1. Launch the existing game start batch file or open `game/index.html` using the established local workflow.
2. Start a new game and reach **Found Airline**.
3. Confirm **Procedural Brand Lab** appears above the existing logo rows.
4. Press **Generate** at least ten times.
5. Confirm the name, carrier profile, colors, frame, and symbol vary.
6. Confirm every preview remains inside its panel without clipping.
7. Press **Use This Identity**.
8. Confirm the generated name fills the airline-name field.
9. Confirm the generated logo appears in the logo list and is selected.
10. Continue to Airline Preview and confirm the selected identity appears.
11. Return to Found Airline and confirm existing static logo cards still work.
12. Launch the airline and confirm no blocking JavaScript errors occur.

## Regression checks

- Scenario flow remains functional.
- Home hub selection remains functional.
- Existing image-logo loading remains functional.
- Back and Next navigation remain functional.
- Direct local-file launch does not require internet access.
