# QA — AI Airline Lifecycle and Identity Release v1.1.2

## Installation

1. Confirm the repository is on the expected Airline Empire structure.
2. Run `APPLY_PATCH.bat`.
3. The installer may upgrade versions `1.0.9`, `1.1.0`, or `1.1.1` directly.
4. Confirm `version.dat` reads `1.1.2` after success.

## Choose Your Logo

1. Start a new game and reach Choose Your Logo.
2. Confirm exactly 34 contact-sheet identity cards are shown.
3. Confirm generic/default SVG cards such as Unity Air or Radiant Airlines are not mixed into the grid.
4. Press **Shuffle 34** and confirm the visible selection changes without duplicates.
5. Select a contact-sheet identity and confirm the typed airline name remains unchanged.
6. Continue through setup and confirm the selected logo remains attached to the player airline.

## Initial AI ramp-up

1. Start a normal game.
2. Confirm initial AI competitors exist in ramp-up state rather than operating immediately.
3. Advance one normal monthly turn.
4. Confirm the initial AI airlines complete their 30-day ramp-up and begin with no more than two routes each.
5. Confirm no AI airline receives immediate large passenger totals or extraordinary company value.

## 45-day startup checks

1. Advance multiple monthly turns.
2. Confirm new AI startups do not occur every month predictably.
3. Confirm startup checks follow the internal 45-day schedule, producing an alternating monthly cadence when the game advances in 30-day turns.
4. When a startup occurs, confirm it enters ramp-up first and does not operate until 30 additional simulated days pass.

## Nine-month identity release

1. Advance to nine elapsed months.
2. Confirm an event reports that three new airline identities became available.
3. Repeat through 18 elapsed months and confirm another three identities unlock.
4. Confirm unlocked identities become candidates for later random AI startups; they do not all launch automatically.

## Fairness checks

Run at least 24 months and verify:

- AI cash does not jump by unrealistic amounts in one month.
- AI company value grows gradually.
- AI expansion respects route-opening cooldowns.
- New AI airlines begin with one hub and a modest fleet count.
- Ramp-up carriers do not attack player routes.
- Active AI carriers use the established demand and operating-cost calculations.
- The number of simultaneous active and ramping airlines remains controlled.

## Regression checks

- Direct local-file launch works without npm.
- Existing saves with older logo IDs still load their logo or compatibility fallback.
- Player routes, revenue, end-turn flow, events, and saves continue to function.
- No JavaScript errors appear in the browser console.
