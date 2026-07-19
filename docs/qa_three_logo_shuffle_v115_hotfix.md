# QA — AE v1.1.5 Three-Logo Shuffle Installer Hotfix

## Installer verification

1. Run `APPLY_PATCH.bat`.
2. Confirm the installer prints the exact repository path.
3. Confirm all post-copy checks report `PASS`.
4. Confirm the installer ends with `SUCCESS`.

## Visual verification

1. Start the game from the repository path printed by the installer.
2. Begin a new game and reach the airline setup screen.
3. Confirm the heading reads **AIRLINE LOGO**.
4. Confirm there is only one button: **SHUFFLE**.
5. Confirm exactly three logo cards are visible.
6. Confirm there is no scrollbar in the logo area.
7. Press **SHUFFLE** several times and confirm all three cards are replaced.
8. Confirm selecting a card highlights it and preserves the typed airline name.
9. Confirm the dice is inside the airline-name field, directly left of the green checkmark.
