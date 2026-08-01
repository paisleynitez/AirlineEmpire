# QA — AE v1.1.7 Global Font and Readable Logo Labels

1. Confirm `version.dat` reads `1.1.6` before installation.
2. Run `APPLY_PATCH.bat` and confirm all verification checks pass.
3. Launch the game and inspect the opening screen, setup flow, hub cards, buttons, fields, and normal panels.
4. Confirm routine UI text uses the same readable Plus Jakarta Sans family.
5. Confirm airport codes, money, and aligned numeric values remain monospaced.
6. Open **Airline Logo**.
7. Confirm every image displays the corresponding generated airline name in a readable lower overlay.
8. Confirm malformed or unrelated baked-in contact-sheet text is visually covered.
9. Confirm the name inside the image matches the name beneath the card.
10. Shuffle repeatedly and confirm the behavior remains correct for all nine cards.
11. Select a logo and confirm the selected-state border/check remains visible.
12. Run `REVERSE_PATCH.bat` and confirm the repository returns to v1.1.6 when rollback testing is complete.
