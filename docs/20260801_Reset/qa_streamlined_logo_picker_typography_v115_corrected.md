# QA — Streamlined Airline Logo Picker + Typography v1.1.5 Corrected

## Automated package checks

- JavaScript syntax check must pass for every JavaScript replacement file.
- ZIP integrity test must pass.
- Exactly 136 supplied logo assets must be present.
- Obsolete visible strings must not appear in game CSS, HTML, or generator JavaScript.
- v1.1.3 implementation and QA documents must be present.

## Manual checks

1. Install over an accepted v1.1.2–v1.1.5 baseline.
2. Launch the game directly from `game/index.html`.
3. Confirm the main setup typography is readable.
4. Confirm the airline-name dice is immediately left of the checkmark inside the field.
5. Confirm the section title reads **AIRLINE LOGO**.
6. Confirm there is no identity preview box.
7. Confirm there are no contact-sheet, procedural, curated, identity-count, badge, metadata, or color-dot labels.
8. Confirm four columns and four visible rows appear at desktop width.
9. Confirm the logo grid scrolls internally for additional rows.
10. Confirm Shuffle and Random Preview continue to function.
11. Confirm selecting a logo does not replace the typed airline name.
