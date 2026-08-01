# QA — Airline Identity and AI Lifecycle Milestone v1.2.0

## Installation

1. Confirm the repository has `game/index.html` and `version.dat`.
2. Run `APPLY_PATCH.bat`.
3. Confirm SUCCESS and `version.dat` = `1.2.0`.
4. Launch the existing game start batch file or `game/index.html`.

## Setup UI

- Game Type and Difficulty frames are compact and horizontally centered.
- The airline-name praise line is absent.
- The dice and validation check appear inside the name field.
- Body and detail text are easy to read at 100% zoom.

## Identity library

- Exactly 34 identity cards appear at game start.
- No generic purple/blue generated logo cards appear in the visible identity grid.
- Shuffle produces a new set without duplicate cards in the same page.
- Random Preview uses supplied contact-sheet artwork.
- Selecting an identity preserves the typed airline name unless Use This Identity is explicitly selected.

## AI lifecycle

Use the Dev Tuner or accelerated simulation where available.

- No AI airline becomes fully active without completing 30 ramp-up days.
- Startup evaluation occurs at 45-day intervals.
- Three identity slots become eligible after each nine-month interval.
- AI cash, fleet, route count, and valuation do not jump outside normal economic pacing.
- Save and reload preserve lifecycle state.

## Regression

- Direct local-file launch works without npm.
- Scenario selection, founding flow, hub selection, and launch still work.
- No browser-console errors occur during setup or month advancement.
