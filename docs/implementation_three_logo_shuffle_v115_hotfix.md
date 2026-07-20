# AE v1.1.5 — Three-Logo Shuffle Installer Hotfix

## Purpose

The prior package contained the intended three-logo files, but its repository search order could select a different Airline Empire copy when multiple repositories or extracted copies were present.

## Corrected behavior

- Prioritizes the established active repository paths before the current/extracted folder.
- Searches standard GitHub folders only if the preferred repository is unavailable.
- Overwrites the complete replacement files.
- Verifies the installed `game/index.html`, generator, and stylesheet contents after copying.
- Refuses to report success if the active files still contain `RANDOM PREVIEW`, `SHUFFLE 34`, a scrollable logo grid, or more than the three-logo shuffle configuration.
- Displays the exact repository path that was patched.

## Resulting UI

- One **Shuffle** button.
- Exactly three airline-logo cards.
- No logo-grid scrollbar.
- No hidden logo rows.
- Dice inside the airline-name field, immediately left of the validation checkmark.
