# QA

## Zero Warning Policy

Every console warning, HTTP error, missing asset, or unexpected log message is treated as a defect until investigated.

Resolution options:

- Fixed
- Documented as Technical Debt
- Explicitly accepted

## Smoke Test

Before committing game changes:

- [ ] Game starts
- [ ] No red browser console errors
- [ ] No unexpected HTTP errors
- [ ] Main menu loads
- [ ] New Game works
- [ ] Continue works if available
- [ ] Map loads
- [ ] Left menu works
- [ ] End Turn works
- [ ] Save/Load does not break

## Current Known QA Notes

- Missing favicon request should be fixed, not ignored.

### JavaScript Extraction

- [x] Game loads under Vite.
- [x] Browser console clean.
- [x] All JavaScript extracted from `index.html`.
- [x] All JavaScript passes `node --check`.
- [x] Gameplay functions verified.


## Cinematic Lavender Theme QA — 1.0.1

Launch by double-clicking `game/index.html`.

- [ ] The cinematic intro appears before the flat home menu.
- [ ] The large animated `AIRLINE EMPIRE` title is lavender/violet, not teal.
- [ ] Route arcs continue drawing and moving normally.
- [ ] Hub bursts and route nodes glow lavender.
- [ ] Aircraft markers continue moving along routes.
- [ ] Gold remains a limited secondary route accent.
- [ ] Region names and telemetry remain readable.
- [ ] `PRESS TO BEGIN` remains animated and clickable.
- [ ] Clicking the cinematic or SKIP transitions to the existing home menu.
- [ ] New Game, Continue, Daily Challenge, and Records remain unchanged.
- [ ] Refreshing the page replays the cinematic without console errors.

## v1.0.2 Home Balance and Lavender Routes
See `qa_home_balance_lavender_routes.md` for the landing-screen and route-animation checklist.

## v1.0.3 Home Layout Correction
See `qa_home_layout_correction.md` for the focused regression checklist.
