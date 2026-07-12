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
